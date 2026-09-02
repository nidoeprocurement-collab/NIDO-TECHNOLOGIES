import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getPrefix } from "../lib/configService";
import { releaseStock, type StockAllocation } from "../lib/stockEngine";
import { releaseVendorReservation } from "../lib/vendorStore";
import { savePO, generatePoNumber, getAllPOs, type StoredPO, type POLineItem, type PONote } from "../lib/purchaseOrderStore";
import { getVendorById } from "../lib/vendorDataStore";
import { getEffectiveTaxPctForCategory } from "../lib/taxEngine";
import type { ProductCommercialTerms } from "../lib/productCommercialTerms";

// ─── Types ────────────────────────────────────────────────────────────────────
export type MyOrderStatus =
  | "Processing"
  | "Pending Shipping"
  | "Partially Shipped"
  | "Shipped"
  | "Partially Delivered"
  | "Delivered"
  | "Cancelled"
  | "Draft";

// Minimal cart-item shape stored with the order for the detail view
export interface OrderCartItem {
  id: number;
  name: string;
  image: string;
  priceNum: number;
  quantity: number;
  category: string;
  specs: string[];
  moq: number;
  clientId: string;
  productCode?: string;
  productType?: string;
  physicalType?: string;
  commercialTerms?: ProductCommercialTerms;
  fulfillmentType?: "physical" | "digital";
  /** Vendor allocation snapshot — used to restore stock if the order is cancelled. */
  vendorAllocations?: StockAllocation[];
  // ── Vendor snapshot — locked at add-to-cart time ──────────────────────────
  selectedVendorId?: string;
  selectedVendorName?: string;
  vendorPrice?: number;
  landedCost?: number;
  gstSnapshot?: number;
  hsnSnapshot?: string;
  vendorRating?: number;
  /** Unique ID for the stock reservation placed at checkout — used for auditing and release on cancellation */
  stockReservationId?: string;
  /** Stable generated sub-order identifier assigned when the master order is created. */
  subOrderId?: string;
}

export interface MyOrder {
  id: string;
  /** Client tenant that owns this order. */
  clientId?: string;
  client: string;
  clientColor: string;
  clientInitial: string;
  poNumber: string;
  requester: string;
  requesterRole: string;
  requesterInitial: string;
  requesterColor: string;
  assigned: string;
  assignedRole: string;
  assignedInitial: string;
  assignedColor: string;
  orderDate: string;
  orderTime: string;
  status: MyOrderStatus;
  slaTime: string | null;
  slaAlert: boolean;
  totalAmount: string;
  // Cart items stored at order-creation time, used by the detail page
  cartItems?: OrderCartItem[];
  // Numeric total for easy calculation
  totalAmountNum?: number;
  // Payment & delivery captured at checkout
  paymentMethod?: string;
  paymentDetail?: string;
  paymentTerms?: string;
  deliveryAddress?: string;
  cancelReason?: string;
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface MyOrdersContextType {
  orders: MyOrder[];
  addOrder: (order: Omit<MyOrder, "id"> & { id?: string }) => string;
  setOrders: React.Dispatch<React.SetStateAction<MyOrder[]>>;
  updateOrderStatus: (orderId: string, status: MyOrderStatus, cancelReason?: string) => void;
  updateOrdersStatus: (orderIds: string[], status: MyOrderStatus, cancelReason?: string) => void;
}

const MyOrdersContext = createContext<MyOrdersContextType | undefined>(undefined);

const ORDERS_KEY = "nido_my_orders";
const SEQ_KEY = "nido_order_seq";
// Sub-order-level state (per master order) mirrors the keys OrderDetailsPage
// reads/writes, so status cascades stay consistent no matter which screen
// (order list or order detail) triggered the change.
const subItemsKey = (orderId: string) => `nido_subitems_${orderId}`;
const vendorsKey = (orderId: string) => `nido_vendors_${orderId}`;

// A master order moving to Cancelled/Draft always cascades to every sub-order
// (all items get the same status) and clears any in-progress vendor sourcing,
// since vendor selection should not be happening for an order that is no
// longer active. This mirrors the logic OrderDetailsPage uses to derive
// sub-order IDs from cartItems.
function cascadeStatusToSubOrders(order: MyOrder, status: MyOrderStatus) {
  if (status !== "Cancelled" && status !== "Draft") return;
  const itemCount = order.cartItems?.length || 0;
  if (itemCount === 0) return;
  try {
    const key = subItemsKey(order.id);
    let saved: Record<string, any> = {};
    try {
      saved = JSON.parse(localStorage.getItem(key) || "{}");
    } catch {
      saved = {};
    }
    const updatedOn = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    for (let i = 0; i < itemCount; i++) {
      const subId = order.cartItems?.[i]?.subOrderId
        || `SO-${order.id}-${String(i + 1).padStart(3, "0")}`;
      saved[subId] = { ...(saved[subId] || {}), itemStatus: status, updatedOn };
    }
    localStorage.setItem(key, JSON.stringify(saved));
    // Vendor sourcing should not be in-flight for a cancelled/draft order.
    localStorage.removeItem(vendorsKey(order.id));
  } catch {
    /* never block the status update on a localStorage failure */
  }
  // Notify any currently-mounted OrderDetailsPage (same tab) to reload its
  // sub-order/vendor state immediately — the "storage" event only fires
  // across tabs, not within the tab that made the change.
  window.dispatchEvent(new CustomEvent("orderSubItemsUpdated", { detail: { orderId: order.id } }));
}

// Serial, zero-padded order numbers: ORD-000001, ORD-000002, ...
function nextOrderId(): string {
  let seq = 0;
  try {
    seq = parseInt(localStorage.getItem(SEQ_KEY) || "0", 10) || 0;
  } catch {
    seq = 0;
  }
  seq += 1;
  try {
    localStorage.setItem(SEQ_KEY, String(seq));
  } catch {
    /* ignore */
  }
  return `${getPrefix("order") || "ORD-"}${String(seq).padStart(6, "0")}`;
}

// ─── Auto Draft-PO creation ───────────────────────────────────────────────────
// Called immediately after a new order is placed. Groups cart items by the
// vendor the client selected on the Shop page and creates one Draft PO per
// vendor. No price-engine allocation is needed — vendor info is already
// snapshotted on each cart item.
function autoCreateDraftPOs(
  orderId: string,
  cartItems: OrderCartItem[],
  _orderDate: string,
  paymentTerms: string,
  _deliveryAddress: string,
): void {
  // Group items by selectedVendorId (skip items with no vendor selected)
  const vendorGroups = new Map<string, OrderCartItem[]>();
  for (const item of cartItems) {
    if (!item.selectedVendorId) continue;
    if (!vendorGroups.has(item.selectedVendorId)) vendorGroups.set(item.selectedVendorId, []);
    vendorGroups.get(item.selectedVendorId)!.push(item);
  }
  if (vendorGroups.size === 0) return;

  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const displayDate = `${dd}/${mm}/${yyyy}`;

  for (const [vendorId, items] of vendorGroups.entries()) {
    const vendor = getVendorById(vendorId);
    const poNumber = generatePoNumber();

    const lineItems: POLineItem[] = items.map((item, i) => {
      const subOrderId = item.subOrderId
        || `${getPrefix("salesOrder") || "SO-"}${orderId}-${String(i + 1).padStart(3, "0")}`;
      const unitPrice = item.landedCost || item.vendorPrice || item.priceNum || 0;
      const qty = item.quantity;
      const gstPct = item.gstSnapshot ?? getEffectiveTaxPctForCategory(item.category);
      return {
        subOrderId,
        item: item.name,
        sku: item.productCode || `${getPrefix("sku") || "SKU-"}${item.id}`,
        productCode: item.productCode || "",
        category: item.category || "General",
        hsnCode: item.hsnSnapshot || "",
        specs: Array.isArray(item.specs) ? item.specs : [],
        referenceNumber: "",
        qty,
        unitPrice,
        lineSubtotal: unitPrice * qty,
        gstPct,
        productType: item.productType,
        physicalType: item.physicalType,
        commercialTerms: item.commercialTerms,
        status: "Pending",
        tracking: null,
      };
    });

    const subtotal = lineItems.reduce((s, li) => s + li.lineSubtotal, 0);
    const primaryGst = lineItems[0]?.gstPct ?? 18;
    const halfGst = primaryGst / 2;
    const sgstAmt = Math.round(lineItems.reduce((s, li) => s + li.lineSubtotal * ((li.gstPct ?? 18) / 2) / 100, 0) * 100) / 100;
    const cgstAmt = sgstAmt;

    const vendorAddrParts = [vendor?.addressLine1, vendor?.addressLine2, vendor?.city, vendor?.state, vendor?.zipCode].filter(Boolean);

    const grandTotal = subtotal + sgstAmt + cgstAmt;
    const creationNote: PONote = {
      id: "audit_created_" + Date.now() + "_" + vendorId,
      author: "System",
      initials: "SY",
      color: "#6b7280",
      date: displayDate,
      text: `Draft PO ${poNumber} automatically created for order ${orderId}. Vendor: ${vendor?.name || vendorId}. ${lineItems.length} item${lineItems.length !== 1 ? "s" : ""} — Grand Total ₹${grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}. Awaiting admin review and confirmation.`,
      visibility: "Internal Note",
    };

    const po: StoredPO = {
      poNumber,
      orderId,
      subOrderId: lineItems[0]?.subOrderId || "",
      subOrderIds: lineItems.map(li => li.subOrderId),
      items: lineItems,
      vendorId,
      vendorName: vendor?.name || items[0].selectedVendorName || vendorId,
      vendorContact: vendor?.primaryContact || "",
      vendorEmail: vendor?.email || "",
      vendorPhone: vendor?.phone || "",
      vendorGstin: vendor?.taxId || "",
      vendorAddress: vendorAddrParts.join(", "),
      vendorAddressLine1: vendor?.addressLine1 || "",
      vendorAddressLine2: vendor?.addressLine2 || "",
      vendorCity: vendor?.city || "",
      vendorState: vendor?.state || "",
      vendorPincode: vendor?.zipCode || "",
      item: lineItems[0]?.item || "",
      sku: lineItems[0]?.sku || "",
      category: lineItems[0]?.category || "",
      hsnCode: lineItems[0]?.hsnCode || "",
      specs: lineItems[0]?.specs || [],
      referenceNumber: "",
      qty: lineItems[0]?.qty || 0,
      unitPrice: lineItems[0]?.unitPrice || 0,
      subtotal,
      sgstPct: halfGst,
      cgstPct: halfGst,
      sgstAmt,
      cgstAmt,
      grandTotal,
      paymentTerms: paymentTerms || "Net 30",
      status: "Draft",
      createdOn: now.toISOString(),
      createdOnDisplay: displayDate,
      requestedDelivery: "",
      documents: [],
      notes: [creationNote],
    };

    try {
      savePO(po);
    } catch {
      /* never block order creation on a PO-save failure */
    }
  }
}

export function MyOrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<MyOrder[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
    } catch {
      return [];
    }
  });

  // Persist every change to localStorage so orders survive page refresh
  useEffect(() => {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }, [orders]);

  // Cross-tab / cross-session sync: if another tab (e.g. the owner platform or
  // the client portal open side-by-side) writes to the shared orders key,
  // pick up the change immediately instead of waiting for a manual refresh.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== ORDERS_KEY) return;
      try {
        setOrders(JSON.parse(e.newValue || "[]"));
      } catch {
        /* ignore malformed payloads */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const addOrder = (order: Omit<MyOrder, "id"> & { id?: string }) => {
    const id = nextOrderId();
    const cartItems = order.cartItems?.map((item, index) => ({
      ...item,
      subOrderId: item.subOrderId
        || `${getPrefix("salesOrder") || "SO-"}${id}-${String(index + 1).padStart(3, "0")}`,
    }));
    const normalizedOrder = { ...order, id, cartItems } as MyOrder;
    setOrders((prev) => [normalizedOrder, ...prev]);
    // Auto-create Draft POs grouped by vendor immediately after the order is saved.
    if (cartItems?.length) {
      autoCreateDraftPOs(id, cartItems, order.orderDate, order.paymentTerms || "", order.deliveryAddress || "");
    }
    return id;
  };

  // Single source of truth for changing a master order's status. Used by both
  // the order list (bulk update) and the order detail page ("Update Master
  // Status") so a Cancelled/Draft transition always cascades to sub-orders
  // and clears vendor selection consistently, regardless of entry point.
  // Cancelled is a terminal state: once an order is Cancelled it can no
  // longer be edited, have its status changed, or be processed further —
  // guarding here (the single source of truth) protects every entry point
  // (order detail page, list bulk update) without relying on each caller
  // to re-check.
  const updateOrderStatus = (orderId: string, status: MyOrderStatus, cancelReason?: string) => {
    setOrders((prev) => {
      const target = prev.find((o) => o.id === orderId);
      if (!target || target.status === "Cancelled") return prev;
      // Once any PO has been generated for an order (including a draft PO),
      // the master order must not be cancelled.
      if (status === "Cancelled" && getAllPOs().some((po) => po.orderId === orderId)) return prev;
      // Release reserved stock when an order is cancelled before a PO is raised.
      // If a PO was already raised for some qty, that qty's reservedStock was
      // already cleared at PO-creation time, so the Math.max(0, ...) floor in
      // releaseVendorReservation makes this safe to call unconditionally.
      if (status === "Cancelled") {
        for (const item of (target.cartItems || [])) {
          if (!item.productCode) continue;
          for (const alloc of (item.vendorAllocations || [])) {
            if (alloc.vendorId && alloc.allocated > 0) {
              releaseVendorReservation(alloc.vendorId, item.productCode, alloc.allocated);
            }
          }
        }
      }
      cascadeStatusToSubOrders(target, status);
      const extra = status === "Cancelled" && cancelReason ? { cancelReason } : {};
      return prev.map((o) => (o.id === orderId ? { ...o, status, ...extra } : o));
    });
  };

  const updateOrdersStatus = (orderIds: string[], status: MyOrderStatus, cancelReason?: string) => {
    const idSet = new Set(orderIds);
    setOrders((prev) => {
      prev.forEach((o) => {
        if (
          idSet.has(o.id) &&
          o.status !== "Cancelled" &&
          !(status === "Cancelled" && getAllPOs().some((po) => po.orderId === o.id))
        ) cascadeStatusToSubOrders(o, status);
      });
      const extra = status === "Cancelled" && cancelReason ? { cancelReason } : {};
      return prev.map((o) => (
        idSet.has(o.id) &&
        o.status !== "Cancelled" &&
        !(status === "Cancelled" && getAllPOs().some((po) => po.orderId === o.id))
          ? { ...o, status, ...extra }
          : o
      ));
    });
  };

  return (
    <MyOrdersContext.Provider value={{ orders, addOrder, setOrders, updateOrderStatus, updateOrdersStatus }}>
      {children}
    </MyOrdersContext.Provider>
  );
}

export function useMyOrders() {
  const ctx = useContext(MyOrdersContext);
  if (!ctx) throw new Error("useMyOrders must be used within a MyOrdersProvider");
  return ctx;
}
