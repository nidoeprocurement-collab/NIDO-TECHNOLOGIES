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
}

const MyOrdersContext = createContext<MyOrdersContextType | undefined>(undefined);

const ORDERS_KEY = "nido_my_orders";
const SEQ_KEY = "nido_order_seq";

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

  const addOrder = (order: Omit<MyOrder, "id"> & { id?: string }) => {
    const id = nextOrderId();
    setOrders((prev) => [{ ...order, id } as MyOrder, ...prev]);
    return id;
  };

  return (
    <MyOrdersContext.Provider value={{ orders, addOrder, setOrders }}>
      {children}
    </MyOrdersContext.Provider>
  );
}

export function useMyOrders() {
  const ctx = useContext(MyOrdersContext);
  if (!ctx) throw new Error("useMyOrders must be used within a MyOrdersProvider");
  return ctx;
}
