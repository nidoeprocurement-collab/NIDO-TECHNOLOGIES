import { createContext, useContext, useState, useEffect, ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export type MyOrderStatus =
  | "Processing"
  | "Partially Shipped"
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
}

export interface MyOrder {
  id: string;
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
}

// ─── Context ──────────────────────────────────────────────────────────────────
interface MyOrdersContextType {
  orders: MyOrder[];
  addOrder: (order: Omit<MyOrder, "id"> & { id?: string }) => string;
  setOrders: React.Dispatch<React.SetStateAction<MyOrder[]>>;
  updateOrderStatus: (orderId: string, status: MyOrderStatus) => void;
  updateOrdersStatus: (orderIds: string[], status: MyOrderStatus) => void;
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
      const subId = `SO-${order.id}-${String(i + 1).padStart(3, "0")}`;
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
  return `ORD-${String(seq).padStart(6, "0")}`;
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
    setOrders((prev) => [{ ...order, id } as MyOrder, ...prev]);
    return id;
  };

  // Single source of truth for changing a master order's status. Used by both
  // the order list (bulk update) and the order detail page ("Update Master
  // Status") so a Cancelled/Draft transition always cascades to sub-orders
  // and clears vendor selection consistently, regardless of entry point.
  const updateOrderStatus = (orderId: string, status: MyOrderStatus) => {
    setOrders((prev) => {
      const target = prev.find((o) => o.id === orderId);
      if (target) cascadeStatusToSubOrders(target, status);
      return prev.map((o) => (o.id === orderId ? { ...o, status } : o));
    });
  };

  const updateOrdersStatus = (orderIds: string[], status: MyOrderStatus) => {
    const idSet = new Set(orderIds);
    setOrders((prev) => {
      prev.forEach((o) => {
        if (idSet.has(o.id)) cascadeStatusToSubOrders(o, status);
      });
      return prev.map((o) => (idSet.has(o.id) ? { ...o, status } : o));
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
