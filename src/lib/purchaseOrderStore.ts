// ── Shared purchase-order store (localStorage) ────────────────────────────────
// All POs created from the order-detail flow are written here so that
// VendorOrdersPage and VendorOrderDetailPage can read real data.

import { getPrefix } from "./configService";

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
  | "Processing"
  | "Confirmed"
  | "Shipped"
  | "Delivered"
  | "Closed"
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
    all[idx] = { ...all[idx], ...changes };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

    // When a PO is cancelled, clean up the order-level PO and vendor-selection
    // localStorage keys so OrderDetailsPage resets to its default (unselected) state.
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

      // Notify OrderDetailsPage (same tab) to sync its React state from localStorage
      try {
        window.dispatchEvent(new CustomEvent("poCancelled", {
          detail: { poNumber, orderId, subOrderIds },
        }));
      } catch { /* SSR safe */ }
    }

    try { window.dispatchEvent(new CustomEvent("poCreated", { detail: { poNumber } })); } catch { /* SSR safe */ }
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
