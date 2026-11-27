import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { supabase } from "@/lib/supabase";
import {
  checkoutCartToOrderInSupabase,
  loadOrdersFromSupabase,
  updateOrderApprovalMetaInSupabase,
  updateOrderStatusInSupabase,
} from "@/lib/ordersApi";
import {
  deleteApprovalWorkflowInSupabase,
  getApprovalWorkflowHistoryFromSupabase,
  loadApprovalBootstrapFromSupabase,
  saveApprovalWorkflowInSupabase,
  setApprovalWorkflowStatusInSupabase,
} from "@/lib/approvalsApi";
import {
  deleteGlobalCategoryRuleInSupabase,
  loadGlobalCategoryRulesFromSupabase,
  saveGlobalCategoryRulesInSupabase,
} from "@/lib/clientPriceEngineApi";

describe("Orders, Checkout, Approval Workflow & Wave 1.3 Follow-ups", () => {
  const clientUuid1 = "11111111-1111-4111-8111-111111111111";
  const orderUuid1 = "22222222-2222-4222-8222-222222222222";
  const workflowUuid1 = "33333333-3333-4333-8333-333333333333";
  const masterUuid1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const vendorUuid1 = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

  const sampleOrderRow = {
    id: orderUuid1,
    order_number: "ORD-000001",
    client_id: clientUuid1,
    client_name: "Beta Corp",
    po_number: null,
    requester_user_id: "44444444-4444-4444-8444-444444444444",
    requester_name: "Pavan Client",
    requester_email: "pavan@betacorp.example.com",
    requester_role: "Procurement",
    ordered_for: "Ordered by self",
    assigned_name: "Unassigned",
    assigned_role: null,
    assigned_on: null,
    assignment_notes: null,
    assignment_completed: false,
    auto_assignment_status: "unassigned" as const,
    order_date: "Nov 26, 2026",
    order_time: "01:55 PM",
    status: "Processing" as const,
    approval_status: "Pending",
    defer_purchase_orders: true,
    total_amount: 64900,
    initial_total_amount: 64900,
    total_amount_display: "₹64,900.00",
    payment_method: "Corporate Credit",
    payment_detail: "NET 30",
    payment_terms: "NET 30",
    order_notes: "Urgent delivery",
    delivery_address: "Bengaluru",
    delivery_details: { city: "Bengaluru" },
    checkout_pricing_snapshot: { shippingDeliveryFee: 0, platformFee: 0 },
    cancel_reason: null,
    sla_time: null,
    sla_alert: false,
    created_by_name: "Pavan Client",
    updated_by_name: "Pavan Client",
    update_count: 0,
    created_at: "2026-11-26T08:00:00Z",
    updated_at: "2026-11-26T08:00:00Z",
    procurement_order_items: [
      {
        id: "55555555-5555-4555-8555-555555555555",
        order_id: orderUuid1,
        sub_order_id: "SO-ORD-000001-001",
        client_id: clientUuid1,
        master_catalogue_item_id: masterUuid1,
        vendor_id: vendorUuid1,
        vendor_product_id: "66666666-6666-4666-8666-666666666666",
        product_code: "MPC-2026-000001",
        sku_code: "SKU-LAP-01",
        product_name: "Enterprise Laptop Pro",
        category: "IT Hardware",
        product_type: "Product",
        physical_type: "Physical Product",
        fulfillment_type: "physical" as const,
        image: "",
        specs: [],
        quantity: 2,
        moq: 1,
        unit_price: 32450,
        vendor_price: 25000,
        client_selling_price_excl_gst: 27500,
        landed_cost: 26000,
        checkout_unit_price_inclusive: 32450,
        checkout_unit_price_excl_gst: 27500,
        gst_rate: 18,
        discount_pct: 0,
        hsn_snapshot: "8471",
        selected_vendor_name: "Apex Industrial Supplies",
        vendor_rating: 4.5,
        lead_time: "5 Days",
        configuration: {},
        configuration_price_adjustment: 0,
        commercial_terms: {},
        stock_reservation_id: "77777777-7777-4777-8777-777777777777",
        vendor_allocations: [
          {
            vendorId: vendorUuid1,
            vendorProductId: "66666666-6666-4666-8666-666666666666",
            vendorName: "Apex Industrial Supplies",
            allocated: 2,
          },
        ],
        item_status: "Processing",
        metadata: {},
      },
    ],
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("performs atomic idempotent checkout, loads orders, and releases reservations on cancel", async () => {
    (supabase as unknown as { rpc: unknown }).rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: sampleOrderRow, error: null })
      .mockResolvedValueOnce({ data: sampleOrderRow, error: null });

    const orderResult = { data: [sampleOrderRow], error: null };
    (supabase as unknown as { from: unknown }).from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: sampleOrderRow, error: null }),
          order: vi.fn().mockResolvedValue(orderResult),
        })),
        order: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue(orderResult),
          then: (resolve: (val: typeof orderResult) => unknown) => Promise.resolve(orderResult).then(resolve),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    }));

    const order = await checkoutCartToOrderInSupabase({
      idempotencyKey: "idem-key-123",
      clientId: clientUuid1,
      subtotal: 55000,
      totalGst: 9900,
      totalDiscount: 0,
      shippingDeliveryFee: 0,
      platformFee: 0,
      totalAmount: 64900,
    });
    expect(order.id).toBe("ORD-000001");
    expect(order.dbOrderId).toBe(orderUuid1);
    expect(order.cartItems).toHaveLength(1);
    expect(order.cartItems?.[0].stockReservationId).toBe("77777777-7777-4777-8777-777777777777");

    const orders = await loadOrdersFromSupabase(clientUuid1);
    expect(orders).toHaveLength(1);
    expect(orders[0].totalAmountNum).toBe(64900);

    await expect(updateOrderApprovalMetaInSupabase("ORD-000001", "Approved", false)).resolves.toBeUndefined();
    await expect(updateOrderStatusInSupabase("ORD-000001", "Cancelled", "No longer needed", orderUuid1)).resolves.toBeUndefined();
  });

  it("loads, saves, activates, inspects history, and protects approval workflows with audit history", async () => {
    const sampleWfRow = {
      id: workflowUuid1,
      client_id: clientUuid1,
      client_name: "Beta Corp",
      name: "High Value Order Approval",
      description: "Requires Finance approval above 50k",
      module: "Order",
      trigger: "Order created",
      workflow_type: "Standard",
      status: "Active" as const,
      current_version: 1,
      conditions: [{ joinOperator: "AND", field: "amount", operator: "greater_than", value: 50000 }],
      levels: [{ levelNumber: 1, approverType: "Role", approverRole: "Finance", minimumApprovers: 1, approvalMode: "Sequential", slaHours: 24, escalationEnabled: false }],
      created_by: "admin@nido.example.com",
      updated_by: "admin@nido.example.com",
      created_at: "2026-11-26T08:00:00Z",
      updated_at: "2026-11-26T08:00:00Z",
    };

    (supabase as unknown as { from: unknown }).from = vi.fn((table: string) => {
      if (table === "approval_workflows") {
        return {
          select: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({ data: [sampleWfRow], error: null }),
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: sampleWfRow, error: null }) })),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: { ...sampleWfRow, status: "Inactive" }, error: null }) })),
            })),
          })),
          delete: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              error: { code: "23503", message: "violates foreign key constraint" },
            }),
          })),
        };
      }
      if (table === "approval_requests") {
        return {
          select: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          })),
        };
      }
      if (table === "approval_workflow_steps") {
        return {
          delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      if (table === "approval_workflow_history") {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn().mockResolvedValue({
                data: [{ version: 1, changed_by: "admin@nido.example.com", created_at: "2026-11-26T08:00:00Z", snapshot: {}, status: "Saved" }],
                error: null,
              }),
            })),
          })),
        };
      }
      return {};
    });

    const boot = await loadApprovalBootstrapFromSupabase();
    expect(boot.workflows).toHaveLength(1);
    expect(boot.stats.active_workflows).toBe(1);

    const saved = await saveApprovalWorkflowInSupabase({
      name: "High Value Order Approval",
      module: "Order",
      clientId: clientUuid1,
      conditions: [],
      levels: [],
    });
    expect(saved.id).toBe(workflowUuid1);

    const deactivated = await setApprovalWorkflowStatusInSupabase(workflowUuid1, "Inactive", "admin@nido.example.com");
    expect(deactivated.status).toBe("Inactive");

    const history = await getApprovalWorkflowHistoryFromSupabase(workflowUuid1);
    expect(history).toHaveLength(1);

    await expect(deleteApprovalWorkflowInSupabase(workflowUuid1)).rejects.toThrow(/approval history/i);
  });

  it("persists global category pricing rules through Supabase (Wave 1.3 follow-up)", async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    const deleteMock = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }));
    const selectMock = vi.fn(() => ({
      order: vi.fn().mockResolvedValue({
        data: [{ id: "rule-1", category: "IT Hardware", margin_pct: 5, buffer_pct: 2 }],
        error: null,
      }),
    }));

    (supabase as unknown as { from: unknown }).from = vi.fn(() => ({
      select: selectMock,
      upsert: upsertMock,
      delete: deleteMock,
    }));

    const loaded = await loadGlobalCategoryRulesFromSupabase();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].marginPct).toBe(5);

    await saveGlobalCategoryRulesInSupabase([{ id: "rule-1", category: "IT Hardware", marginPct: 6, bufferPct: 2 }]);
    expect(upsertMock).toHaveBeenCalledTimes(1);

    await deleteGlobalCategoryRuleInSupabase("IT Hardware");
    expect(deleteMock).toHaveBeenCalledTimes(1);
  });

  it("enforces RLS, idempotency, and stock reservation lifecycle in Wave 2.1 migration SQL", () => {
    const migrationPath = path.resolve(
      process.cwd(),
      "supabase/migrations/20261126000015_phase3_orders_and_approvals.sql",
    );
    const sql = fs.readFileSync(migrationPath, "utf8");

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.procurement_orders");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.procurement_order_items");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.order_status_history");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.approval_workflows");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.approval_requests");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.approval_actions");
    expect(sql).toContain("idempotency_key text NULL UNIQUE");
    expect(sql).toContain("'ordered'");
    expect(sql).toContain("checkout_cart_to_order");
    expect(sql).toContain("cancel_procurement_order_and_release");
    expect(sql).toContain("REVOKE ALL ON TABLE public.procurement_orders FROM PUBLIC, anon");
    expect(sql).toContain("REVOKE ALL ON TABLE public.approval_workflows FROM PUBLIC, anon");
  });
});
