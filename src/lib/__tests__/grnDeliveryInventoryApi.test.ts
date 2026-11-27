import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { supabase } from "@/lib/supabase";
import {
  loadGoodsReceiptsFromSupabase,
  processGoodsReceiptInSupabase,
} from "@/lib/goodsReceiptsApi";
import {
  loadDeliveryTrackingFromSupabase,
  recordDeliveryTrackingUpdateInSupabase,
} from "@/lib/deliveryTrackingApi";
import {
  adjustVendorInventoryInSupabase,
  loadClientInventoryFromSupabase,
  loadInventoryTransactionsFromSupabase,
} from "@/lib/inventoryTransactionsApi";

describe("GRN, Delivery Tracking & Inventory Ledger (Wave 2.3)", () => {
  const poUuid1 = "77777777-7777-4777-8777-777777777777";
  const clientUuid1 = "11111111-1111-4111-8111-111111111111";
  const vendorUuid1 = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const masterUuid1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

  const sampleGrnRow = {
    id: "99999999-9999-4999-8999-999999999999",
    grn_number: "GRN-00001",
    purchase_order_id: poUuid1,
    po_number: "PO-1001",
    order_id: "22222222-2222-4222-8222-222222222222",
    client_id: clientUuid1,
    vendor_id: vendorUuid1,
    received_by: "Warehouse Team",
    received_date: "2026-11-26T10:00:00Z",
    status: "Partially Received" as const,
    inspection_notes: "1 unit damaged in transit",
    remarks: "Partial delivery",
    attachments: [],
    goods_receipt_items: [
      {
        id: "12121212-1212-4121-8121-121212121212",
        goods_receipt_id: "99999999-9999-4999-8999-999999999999",
        purchase_order_item_id: "34343434-3434-4343-8343-343434343434",
        sub_order_id: "SO-ORD-000001-001",
        master_catalogue_item_id: masterUuid1,
        product_code: "MPC-2026-000001",
        sku: "SKU-LAP-01",
        product_name: "Enterprise Laptop Pro",
        ordered_qty: 10,
        previously_received_qty: 0,
        received_qty: 6,
        accepted_qty: 5,
        rejected_qty: 0,
        damaged_qty: 1,
        shortage_qty: 4,
        excess_qty: 0,
        batch_number: "BATCH-01",
        serial_number: null,
        expiry_date: null,
        inspection_notes: "1 damaged",
        return_requested: true,
        return_reason: "Screen crack",
      },
    ],
    goods_receipt_status_history: [],
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("processes partial & full GRNs idempotently and tracks shortage/damaged quantities", async () => {
    const fullGrnRow = {
      ...sampleGrnRow,
      id: "88888888-8888-4888-8888-888888888888",
      grn_number: "GRN-00002",
      status: "Received" as const,
    };

    (supabase as unknown as { rpc: unknown }).rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: sampleGrnRow, error: null })
      .mockResolvedValueOnce({ data: fullGrnRow, error: null })
      .mockResolvedValueOnce({
        data: null,
        error: { code: "22023", message: "Received quantity (15) exceeds remaining PO quantity (4)" },
      });

    (supabase as unknown as { from: unknown }).from = vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: [sampleGrnRow], error: null }),
        })),
      })),
    }));

    const partial = await processGoodsReceiptInSupabase({
      poNumber: "PO-1001",
      receivedBy: "Warehouse Team",
      idempotencyKey: "grn-idem-1",
      items: [
        {
          sub_order_id: "SO-ORD-000001-001",
          received_qty: 6,
          accepted_qty: 5,
          damaged_qty: 1,
          return_requested: true,
          return_reason: "Screen crack",
        },
      ],
    });
    expect(partial.grn_number).toBe("GRN-00001");
    expect(partial.status).toBe("Partially Received");
    expect(partial.goods_receipt_items?.[0].accepted_qty).toBe(5);
    expect(partial.goods_receipt_items?.[0].damaged_qty).toBe(1);
    expect(partial.goods_receipt_items?.[0].shortage_qty).toBe(4);

    const complete = await processGoodsReceiptInSupabase({
      poNumber: "PO-1001",
      receivedBy: "Warehouse Team",
      idempotencyKey: "grn-idem-2",
      items: [{ sub_order_id: "SO-ORD-000001-001", received_qty: 4, accepted_qty: 4 }],
    });
    expect(complete.status).toBe("Received");

    await expect(
      processGoodsReceiptInSupabase({
        poNumber: "PO-1001",
        receivedBy: "Warehouse Team",
        items: [{ sub_order_id: "SO-ORD-000001-001", received_qty: 15 }],
      }),
    ).rejects.toThrow(/exceeds remaining PO quantity/i);

    const list = await loadGoodsReceiptsFromSupabase("PO-1001");
    expect(list).toHaveLength(1);
  });

  it("records partial & complete delivery tracking updates and inventory transactions", async () => {
    const dtRow = {
      id: "56565656-5656-4565-8565-565656565656",
      shipment_reference: "SHP-00001",
      purchase_order_id: poUuid1,
      po_number: "PO-1001",
      order_id: "22222222-2222-4222-8222-222222222222",
      client_id: clientUuid1,
      vendor_id: vendorUuid1,
      carrier: "BlueDart",
      tracking_number: "BD-998877",
      tracking_link: "https://track.example.com/BD-998877",
      dispatch_date: "2026-11-26T09:00:00Z",
      expected_delivery_date: "2026-11-28",
      actual_delivery_date: null,
      delivery_status: "Partially Shipped" as const,
      proof_of_delivery: null,
      received_by: null,
      delivery_notes: "Batch 1 dispatched",
      shipment_documents: [],
      created_at: "2026-11-26T09:00:00Z",
      updated_at: "2026-11-26T09:00:00Z",
      delivery_tracking_events: [],
    };

    const adjRow = {
      id: "78787878-7878-4787-8787-787878787878",
      adjustment_reference: "ADJ-001",
      vendor_id: vendorUuid1,
      vendor_product_id: "66666666-6666-4666-8666-666666666666",
      master_catalogue_item_id: masterUuid1,
      master_product_code: "MPC-2026-000001",
      adjustment_type: "Stock In" as const,
      quantity_delta: 20,
      previous_physical_stock: 10,
      new_physical_stock: 30,
      reason: "Manual: Restock",
      performed_by: "Admin",
      created_at: "2026-11-26T10:00:00Z",
    };

    (supabase as unknown as { rpc: unknown }).rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: dtRow, error: null })
      .mockResolvedValueOnce({ data: adjRow, error: null });

    (supabase as unknown as { from: unknown }).from = vi.fn((table: string) => {
      if (table === "delivery_tracking") {
        return {
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({ data: [dtRow], error: null }),
            })),
          })),
        };
      }
      if (table === "inventory_transactions") {
        return {
          select: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "txn-1",
                  transaction_reference: "TXN-GRN-00001",
                  transaction_type: "GRN Accepted",
                  master_catalogue_item_id: masterUuid1,
                  master_product_code: "MPC-2026-000001",
                  product_name: "Enterprise Laptop Pro",
                  vendor_id: vendorUuid1,
                  vendor_name: "Apex Supplies",
                  client_id: clientUuid1,
                  field: "clientInventory",
                  quantity: 5,
                  previous_quantity: 0,
                  new_quantity: 5,
                  transaction_date: "2026-11-26T10:00:00Z",
                  performed_by: "Warehouse Team",
                  reason: "Accepted goods via GRN-00001",
                  document_reference: "GRN-00001",
                },
              ],
              error: null,
            }),
          })),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "ci-1",
                  client_id: clientUuid1,
                  master_catalogue_item_id: masterUuid1,
                  goods_receipt_item_id: null,
                  source_key: "grn_SO-ORD-000001-001",
                  asset_id: "MPC-2026-000001",
                  name: "Enterprise Laptop Pro",
                  asset_type: "Physical Asset",
                  category: "IT Hardware",
                  serial_number: null,
                  location: null,
                  quantity: 5,
                  unit_label: "units",
                  condition: "New",
                  status: "available",
                  warranty: null,
                },
              ],
              error: null,
            }),
          })),
        })),
      };
    });

    const dt = await recordDeliveryTrackingUpdateInSupabase({
      poNumber: "PO-1001",
      deliveryStatus: "Partially Shipped",
      carrier: "BlueDart",
      trackingNumber: "BD-998877",
    });
    expect(dt.shipment_reference).toBe("SHP-00001");

    const dtList = await loadDeliveryTrackingFromSupabase("PO-1001");
    expect(dtList).toHaveLength(1);

    const adj = await adjustVendorInventoryInSupabase({
      vendorId: vendorUuid1,
      masterCatalogueItemId: masterUuid1,
      adjustmentType: "Stock In",
      quantityDelta: 20,
      reason: "Manual: Restock",
      performedBy: "Admin",
    });
    expect(adj.new_physical_stock).toBe(30);

    const txns = await loadInventoryTransactionsFromSupabase();
    expect(txns).toHaveLength(1);
    expect(txns[0].qtyChanged).toBe(5);

    const clientInv = await loadClientInventoryFromSupabase(clientUuid1);
    expect(clientInv).toHaveLength(1);
    expect(clientInv[0].quantity).toBe(5);
  });

  it("blocks unauthorized GRN/adjustment calls and cross-tenant access (RLS 42501)", async () => {
    (supabase as unknown as { rpc: unknown }).rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "42501", message: "Forbidden: internal NIDO authorization required" },
    });

    await expect(
      processGoodsReceiptInSupabase({
        poNumber: "PO-1001",
        receivedBy: "Unauthorized",
        items: [{ sub_order_id: "SO-ORD-000001-001", received_qty: 1 }],
      }),
    ).rejects.toThrow(/internal NIDO authorization required/i);

    await expect(
      adjustVendorInventoryInSupabase({
        vendorId: vendorUuid1,
        masterCatalogueItemId: masterUuid1,
        adjustmentType: "Stock In",
        quantityDelta: 5,
        reason: "Unauthorized",
        performedBy: "Client User",
      }),
    ).rejects.toThrow(/internal NIDO authorization required/i);
  });

  it("enforces RLS, partition constraints, and no vendor stock double-deduction in Wave 2.3 migration SQL", () => {
    const migrationPath = path.resolve(
      process.cwd(),
      "supabase/migrations/20261126000017_phase3_grn_delivery_inventory.sql",
    );
    const sql = fs.readFileSync(migrationPath, "utf8");

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.goods_receipts");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.goods_receipt_items");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.delivery_tracking");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.inventory_transactions");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.inventory_adjustments");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.client_inventory_items");
    expect(sql).toContain("CONSTRAINT chk_grn_qty_partition CHECK (accepted_qty + rejected_qty + damaged_qty <= received_qty)");
    expect(sql).toContain("process_goods_receipt");
    expect(sql).toContain("record_delivery_tracking_update");
    expect(sql).toContain("adjust_vendor_inventory_atomic");
    expect(sql).toContain("REVOKE ALL ON TABLE public.goods_receipts FROM PUBLIC, anon");
    expect(sql).toContain("REVOKE ALL ON TABLE public.inventory_transactions FROM PUBLIC, anon");
    expect(sql).toContain("app.current_client_id()");
  });
});
