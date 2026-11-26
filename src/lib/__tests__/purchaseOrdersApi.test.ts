import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { supabase } from "@/lib/supabase";
import {
  cancelPOInSupabase,
  createDraftPOsForOrderInSupabase,
  deleteDraftPOInSupabase,
  loadPurchaseOrdersFromSupabase,
  raisePOAndConsumeStockInSupabase,
  savePOToSupabase,
} from "@/lib/purchaseOrdersApi";
import type { StoredPO } from "@/lib/purchaseOrderStore";

describe("purchaseOrdersApi & Wave 2.2 Purchase Orders RLS + Stock Transition", () => {
  const vendorUuid1 = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const vendorUuid2 = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
  const orderUuid1 = "22222222-2222-4222-8222-222222222222";
  const clientUuid1 = "11111111-1111-4111-8111-111111111111";
  const poUuid1 = "77777777-7777-4777-8777-777777777777";
  const poUuid2 = "88888888-8888-4888-8888-888888888888";

  const makePoRow = (id: string, poNumber: string, vendorId: string, status: StoredPO["status"], stockConsumed: boolean) => ({
    id,
    po_number: poNumber,
    order_id: orderUuid1,
    order_number: "ORD-000001",
    client_id: clientUuid1,
    vendor_id: vendorId,
    vendor_name: vendorId === vendorUuid1 ? "Apex Supplies" : "Beta Hardware",
    vendor_contact: "Rohan",
    vendor_email: "vendor@example.com",
    vendor_phone: "+91 9876543210",
    vendor_gstin: "29ABCDE1234F1Z5",
    vendor_address: "Bengaluru",
    vendor_address_line1: "100 MG Road",
    vendor_address_line2: null,
    vendor_city: "Bengaluru",
    vendor_state: "Karnataka",
    vendor_pincode: "560001",
    sub_order_id: "SO-ORD-000001-001",
    sub_order_ids: ["SO-ORD-000001-001"],
    primary_item: "Enterprise Laptop Pro",
    primary_sku: "MPC-2026-000001",
    category: "IT Hardware",
    hsn_code: "8471",
    specs: [],
    reference_number: null,
    serial_number: null,
    qty: 2,
    unit_price: 26000,
    subtotal: 52000,
    sgst_pct: 9,
    cgst_pct: 9,
    sgst_amt: 4680,
    cgst_amt: 4680,
    grand_total: 61360,
    payment_terms: "Net 30",
    status,
    stock_consumed: stockConsumed,
    created_on: "2026-11-26T08:00:00Z",
    created_on_display: "26/11/2026",
    requested_delivery: null,
    cancel_reason: null,
    purchase_order_items: [
      {
        id: "99999999-9999-4999-8999-999999999999",
        purchase_order_id: id,
        order_item_id: null,
        sub_order_id: "SO-ORD-000001-001",
        master_catalogue_item_id: null,
        vendor_product_id: null,
        item_name: "Enterprise Laptop Pro",
        sku: "SKU-LAP-01",
        product_code: "MPC-2026-000001",
        category: "IT Hardware",
        hsn_code: "8471",
        specs: [],
        reference_number: null,
        serial_number: null,
        qty: 2,
        unit_price: 26000,
        line_subtotal: 52000,
        gst_pct: 18,
        product_type: "Product",
        commercial_terms: null,
        configuration: null,
        configuration_price_adjustment: 0,
        item_status: "Pending",
        cancel_reason: null,
        cancel_source: null,
        provisioning_details: null,
        tracking: null,
      },
    ],
    purchase_order_status_history: [],
    purchase_order_documents: [],
  });

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("creates vendor-specific Draft POs from an order, raises atomically, and handles cancellation", async () => {
    const draft1 = makePoRow(poUuid1, "PO-1001", vendorUuid1, "Draft", false);
    const draft2 = makePoRow(poUuid2, "PO-1002", vendorUuid2, "Draft", false);
    const confirmed1 = makePoRow(poUuid1, "PO-1001", vendorUuid1, "Confirmed", true);
    const cancelled2 = makePoRow(poUuid2, "PO-1002", vendorUuid2, "Cancelled", false);

    (supabase as unknown as { rpc: unknown }).rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: [draft1, draft2], error: null })
      .mockResolvedValueOnce({ data: confirmed1, error: null })
      .mockResolvedValueOnce({ data: cancelled2, error: null });

    const orderMock = vi
      .fn()
      .mockResolvedValueOnce({ data: [draft1, draft2], error: null })
      .mockResolvedValueOnce({ data: [confirmed1, draft2], error: null })
      .mockResolvedValueOnce({ data: [confirmed1, cancelled2], error: null });

    (supabase as unknown as { from: unknown }).from = vi.fn(() => ({
      select: vi.fn(() => ({ order: orderMock })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) })),
      })),
    }));

    const createdDrafts = await createDraftPOsForOrderInSupabase("ORD-000001", "Net 30");
    expect(createdDrafts).toHaveLength(2);
    expect(createdDrafts[0].status).toBe("Draft");
    expect(createdDrafts[0].stockConsumed).toBe(false);
    expect(createdDrafts[0].grandTotal).toBe(61360);

    const raised = await raisePOAndConsumeStockInSupabase("PO-1001");
    expect(raised.status).toBe("Confirmed");
    expect(raised.stockConsumed).toBe(true);

    await expect(cancelPOInSupabase("PO-1002", "Vendor unavailable")).resolves.toBeUndefined();
    await expect(deleteDraftPOInSupabase("PO-1002")).resolves.toBeUndefined();
  });

  it("blocks unauthorized/client-portal PO access and invalid MOQ/stock transitions", async () => {
    (supabase as unknown as { rpc: unknown }).rpc = vi
      .fn()
      .mockResolvedValueOnce({
        data: null,
        error: { code: "42501", message: "Forbidden: internal NIDO authorization required" },
      })
      .mockResolvedValueOnce({
        data: null,
        error: { code: "22023", message: "Quantity (1) for Laptop is below vendor MOQ (5)" },
      });

    (supabase as unknown as { from: unknown }).from = vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "42501", message: "permission denied for table purchase_orders" },
        }),
      })),
    }));

    await expect(loadPurchaseOrdersFromSupabase()).rejects.toThrow(/permission denied/i);
    await expect(createDraftPOsForOrderInSupabase("ORD-000001")).rejects.toThrow(/internal NIDO authorization required/i);
    await expect(raisePOAndConsumeStockInSupabase("PO-1001")).rejects.toThrow(/below vendor MOQ/i);
  });

  it("persists manual/edited POs via savePOToSupabase", async () => {
    const upsertMock = vi.fn(() => ({
      select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: { id: poUuid1 }, error: null }) })),
    }));
    const itemsUpsertMock = vi.fn().mockResolvedValue({ error: null });

    (supabase as unknown as { from: unknown }).from = vi.fn((table: string) => {
      if (table === "procurement_orders") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: { id: orderUuid1, client_id: clientUuid1 }, error: null }),
            })),
          })),
        };
      }
      if (table === "purchase_order_items") {
        return { upsert: itemsUpsertMock };
      }
      return { upsert: upsertMock };
    });

    const samplePo: StoredPO = {
      poNumber: "PO-1001",
      orderId: "ORD-000001",
      subOrderId: "SO-ORD-000001-001",
      subOrderIds: ["SO-ORD-000001-001"],
      items: [
        {
          subOrderId: "SO-ORD-000001-001",
          item: "Enterprise Laptop Pro",
          sku: "SKU-LAP-01",
          productCode: "MPC-2026-000001",
          category: "IT Hardware",
          hsnCode: "8471",
          specs: [],
          referenceNumber: "",
          qty: 2,
          unitPrice: 26000,
          lineSubtotal: 52000,
          gstPct: 18,
        },
      ],
      vendorId: vendorUuid1,
      vendorName: "Apex Supplies",
      vendorContact: "Rohan",
      vendorEmail: "vendor@example.com",
      vendorPhone: "+91 9876543210",
      vendorGstin: "29ABCDE1234F1Z5",
      vendorAddress: "Bengaluru",
      vendorAddressLine1: "100 MG Road",
      vendorAddressLine2: "",
      vendorCity: "Bengaluru",
      vendorState: "Karnataka",
      vendorPincode: "560001",
      item: "Enterprise Laptop Pro",
      sku: "SKU-LAP-01",
      category: "IT Hardware",
      hsnCode: "8471",
      specs: [],
      referenceNumber: "",
      qty: 2,
      unitPrice: 26000,
      subtotal: 52000,
      sgstPct: 9,
      cgstPct: 9,
      sgstAmt: 4680,
      cgstAmt: 4680,
      grandTotal: 61360,
      paymentTerms: "Net 30",
      status: "Draft",
      createdOn: "2026-11-26T08:00:00Z",
      createdOnDisplay: "26/11/2026",
      requestedDelivery: "",
      documents: [],
      notes: [],
    };

    await savePOToSupabase(samplePo);
    expect(upsertMock).toHaveBeenCalledTimes(1);
    expect(itemsUpsertMock).toHaveBeenCalledTimes(1);
  });

  it("enforces internal-only RLS, stock_consumed idempotency, and RPCs in Wave 2.2 migration SQL", () => {
    const migrationPath = path.resolve(
      process.cwd(),
      "supabase/migrations/20261126000016_phase3_purchase_orders.sql",
    );
    const sql = fs.readFileSync(migrationPath, "utf8");

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.purchase_orders");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.purchase_order_items");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.purchase_order_status_history");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.purchase_order_documents");
    expect(sql).toContain("stock_consumed boolean NOT NULL DEFAULT false");
    expect(sql).toContain("app.is_nido_internal()");
    expect(sql).toContain("create_draft_purchase_orders_for_order");
    expect(sql).toContain("raise_purchase_order_and_consume_stock");
    expect(sql).toContain("cancel_purchase_order_and_release");
    expect(sql).toContain("REVOKE ALL ON TABLE public.purchase_orders FROM PUBLIC, anon");
  });
});
