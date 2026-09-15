// ── Shared purchase-order store (localStorage) ────────────────────────────────
// All POs created from the order-detail flow are written here so that
// VendorOrdersPage and VendorOrderDetailPage can read real data.

import { getPrefix } from "./configService";
import type { ProductCommercialTerms } from "./productCommercialTerms";

export interface PODocument {
  id: string;
  name: string;
  ext: string;
  type: string;
  uploadedBy: string;
  uploadedOn: string;
  dataUrl?: string; // base64 data-URI for in-app download
}

export interface PONote {
  id: string;
  author: string;
  initials: string;
  color: string;
  date: string;
  text: string;
  visibility: string;
}

export type POStatus =
  | "Draft"
  | "Confirmed"
  | "Partially Shipped"
  | "Vendor Notified"
  | "Accepted"
  | "Dispatched"
  | "Delivered"
  | "Completed"
  | "Cancelled";

/** One line-item inside a multi-item PO */
export interface POLineItem {
  subOrderId: string;
  item: string;
  sku: string;
  /** Master product code — used to deduct / restore vendor stock when PO is raised / cancelled */
  productCode?: string;
  category: string;
  hsnCode: string;
  specs: string[];
  referenceNumber: string;
  qty: number;
  unitPrice: number;
  lineSubtotal: number;
  /** Full GST rate for this line item (e.g. 18 for 18%). Stored so the PDF can show per-item rates. */
  gstPct?: number;
  productType?: string;
  commercialTerms?: ProductCommercialTerms;
  /** Fulfilment state and shipment details for this specific PO line. */
  status?: string;
  cancelReason?: string;
  tracking?: {
    number: string;
    carrier: string;
    note: string;
    link: string;
  } | null;
}

export interface StoredPO {
  poNumber: string;
  orderId: string;       // master order ID
  subOrderId: string;   // primary sub-order (first item; kept for backward compat)
  subOrderIds: string[]; // all sub-order IDs covered by this PO
  items: POLineItem[];   // all line items (may be more than one if same vendor)
  vendorId: string;
  vendorName: string;
  vendorContact: string;
  vendorEmail: string;
  vendorPhone: string;
  vendorGstin: string;
  vendorAddress: string;   // full single-line address
  vendorAddressLine1: string;
  vendorAddressLine2: string;
  vendorCity: string;
  vendorState: string;
  vendorPincode: string;
  item: string;
  sku: string;
  category: string;
  hsnCode: string;
  specs: string[];
  referenceNumber: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
  sgstPct: number;
  cgstPct: number;
  sgstAmt: number;
  cgstAmt: number;
  grandTotal: number;
  paymentTerms: string;
  status: POStatus;
  createdOn: string;      // ISO string
  createdOnDisplay: string; // "DD/MM/YYYY"
  requestedDelivery: string;
  documents: PODocument[];
  notes: PONote[];
  cancelReason?: string;
}

/** A PO locks its order only after it has left the editable Draft state. */
export function isPOConfirmed(po: Pick<StoredPO, "status"> | null | undefined): boolean {
  const status = String(po?.status || "").toLowerCase();
  // Missing/legacy status is not evidence that a PO was generated. Treat it
  // as pending so an order cannot become accidentally non-cancellable merely
  // because an incomplete PO record exists in localStorage.
  return Boolean(status) && status !== "draft" && status !== "cancelled" && status !== "rejected";
}

const STORAGE_KEY = "nido_all_purchase_orders";

export function getAllPOs(): StoredPO[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function getPOByNumber(poNumber: string): StoredPO | undefined {
  return getAllPOs().find((p) => p.poNumber === poNumber);
}

export function savePO(po: StoredPO): void {
  const all = getAllPOs();
  const idx = all.findIndex((p) => p.poNumber === po.poNumber);
  if (idx >= 0) {
    all[idx] = po;
  } else {
    all.unshift(po);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  // Notify any listening page (e.g. PurchaseOrdersPage) to refresh
  try { window.dispatchEvent(new CustomEvent("poCreated", { detail: { poNumber: po.poNumber } })); } catch { /* SSR safe */ }
}

export function updatePO(poNumber: string, changes: Partial<StoredPO>): void {
  const all = getAllPOs();
  const idx = all.findIndex((p) => p.poNumber === poNumber);
  if (idx >= 0) {
    const existing = all[idx];
    if (existing.status === "Delivered" && changes.status && changes.status !== "Delivered") return;
    if (
      changes.status === "Delivered" &&
      existing.status !== "Shipped" &&
      existing.status !== "Partially Delivered" &&
      existing.status !== "Delivered"
    ) return;
    all[idx] = { ...all[idx], ...changes };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

    // When a PO is cancelled, clean up the order-level PO and vendor-selection
    // localStorage keys and mark every covered order item inactive. A PO
    // cancellation is terminal for those items; they must not become editable
    // again just because the Order Details page was refreshed.
    if (changes.status === "Cancelled") {
      const po = all[idx];
      const orderId = po.orderId;
      const subOrderIds: string[] = po.subOrderIds?.length
        ? po.subOrderIds
        : [po.subOrderId].filter(Boolean);

      try {
        // Remove createdPOs entries for these sub-orders
        const posKey = `nido_pos_${orderId}`;
        const createdPOs: Record<string, any> = JSON.parse(localStorage.getItem(posKey) || "{}");
        let changed = false;
        for (const key of Object.keys(createdPOs)) {
          if (subOrderIds.includes(createdPOs[key]?.subOrderId)) {
            delete createdPOs[key];
            changed = true;
          }
        }
        if (changed) localStorage.setItem(posKey, JSON.stringify(createdPOs));
      } catch { /* storage unavailable */ }

      try {
        // Remove vendor selection entries for these sub-orders
        const vendorsKey = `nido_vendors_${orderId}`;
        const vendors: Record<string, string> = JSON.parse(localStorage.getItem(vendorsKey) || "{}");
        let changed = false;
        for (const subId of subOrderIds) {
          if (subId in vendors) { delete vendors[subId]; changed = true; }
        }
        if (changed) localStorage.setItem(vendorsKey, JSON.stringify(vendors));
      } catch { /* storage unavailable */ }

      try {
        // Project the terminal PO state into the order-detail item state.
        // This works for both Draft and confirmed POs and preserves the
        // cancellation reason for the audit trail shown to the user.
        const itemStateKey = `nido_subitems_${orderId}`;
        const itemState: Record<string, any> = JSON.parse(localStorage.getItem(itemStateKey) || "{}");
        for (const subId of subOrderIds) {
          itemState[subId] = {
            ...(itemState[subId] || {}),
            itemStatus: "Cancelled",
            cancelReason: changes.cancelReason || "Purchase order cancelled",
            tracking: null,
            trackingOwner: undefined,
            updatedOn: new Date().toLocaleDateString("en-IN"),
          };
        }
        localStorage.setItem(itemStateKey, JSON.stringify(itemState));
      } catch { /* storage unavailable */ }

      // Notify OrderDetailsPage (same tab) to sync its React state from localStorage
      try {
        window.dispatchEvent(new CustomEvent("poCancelled", {
          detail: { poNumber, orderId, subOrderIds },
        }));
        window.dispatchEvent(new CustomEvent("orderSubItemsUpdated", {
          detail: { orderId, subOrderIds, reason: changes.cancelReason || "Purchase order cancelled" },
        }));
      } catch { /* SSR safe */ }
    }

    try { window.dispatchEvent(new CustomEvent("poCreated", { detail: { poNumber } })); } catch { /* SSR safe */ }
  }
}

/**
 * Remove one cancelled sub-order from any Draft PO for its master order.
 * If it was the only line, the Draft PO is removed. Multi-line POs keep their
 * remaining products and have their totals/primary line metadata recalculated.
 */
export function removeSubOrderFromDraftPOs(orderId: string, subOrderId: string): void {
  const all = getAllPOs();
  const removedPoNumbers = new Set<string>();
  let changed = false;

  const next = all.flatMap((po) => {
    if (po.orderId !== orderId || po.status !== "Draft") return [po];

    const items = Array.isArray(po.items) ? po.items : [];
    const remainingItems = items.filter((item) => item.subOrderId !== subOrderId);
    const covered = remainingItems.length !== items.length
      || po.subOrderId === subOrderId
      || po.subOrderIds?.includes(subOrderId);

    if (!covered) return [po];
    changed = true;

    if (remainingItems.length === 0) {
      removedPoNumbers.add(po.poNumber);
      return [];
    }

    const subtotal = remainingItems.reduce((sum, item) => sum + item.lineSubtotal, 0);
    const sgstAmt = Math.round(
      remainingItems.reduce((sum, item) => sum + item.lineSubtotal * ((item.gstPct ?? 18) / 2) / 100, 0) * 100,
    ) / 100;
    const cgstAmt = sgstAmt;
    const primary = remainingItems[0];

    return [{
      ...po,
      items: remainingItems,
      subOrderId: primary.subOrderId,
      subOrderIds: remainingItems.map((item) => item.subOrderId),
      item: primary.item,
      sku: primary.sku,
      category: primary.category,
      hsnCode: primary.hsnCode,
      specs: primary.specs,
      referenceNumber: primary.referenceNumber,
      qty: primary.qty,
      unitPrice: primary.unitPrice,
      subtotal,
      sgstPct: (primary.gstPct ?? 18) / 2,
      cgstPct: (primary.gstPct ?? 18) / 2,
      sgstAmt,
      cgstAmt,
      grandTotal: subtotal + sgstAmt + cgstAmt,
    }];
  });

  if (!changed) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

  // Keep the legacy per-order PO projection in sync where older flows created it.
  try {
    const posKey = `nido_pos_${orderId}`;
    const legacyPOs: Record<string, any> = JSON.parse(localStorage.getItem(posKey) || "{}");
    let legacyChanged = false;
    for (const key of Object.keys(legacyPOs)) {
      const entry = legacyPOs[key];
      if (entry?.subOrderId === subOrderId || removedPoNumbers.has(entry?.poNumber)) {
        delete legacyPOs[key];
        legacyChanged = true;
      }
    }
    if (legacyChanged) localStorage.setItem(posKey, JSON.stringify(legacyPOs));
  } catch {
    /* storage unavailable */
  }

  try {
    window.dispatchEvent(new CustomEvent("poCreated", {
      detail: { orderId, subOrderId, action: "lineRemoved" },
    }));
  } catch {
    /* SSR safe */
  }
}

// Dedicated monotonic counter — avoids rescanning all POs each time.
const COUNTER_KEY = "nido_po_counter";

/**
 * Generate the next PO number atomically.
 * Reads a dedicated counter, increments it, and verifies uniqueness
 * against existing records to survive concurrent tabs.
 * Reads the current prefix from config so changes in General Settings take effect immediately.
 */
export function generatePoNumber(): string {
  const prefix = getPrefix("purchaseOrder") || "PO-";

  // Build regex dynamically from current prefix to parse existing numbers
  const prefixEscaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^${prefixEscaped}(\\d+)$`);

  const existing = new Set(
    getAllPOs()
      .map(p => { const m = p.poNumber.match(re); return m ? parseInt(m[1], 10) : 0; })
  );

  // Start from the stored counter or 8 (one before the sample PO-00008)
  let next = parseInt(localStorage.getItem(COUNTER_KEY) || "8", 10) + 1;

  // Skip any numbers already in use (defensive against concurrent writes)
  while (existing.has(next)) next++;

  localStorage.setItem(COUNTER_KEY, String(next));
  return `${prefix}${String(next).padStart(5, "0")}`;
}
