import { createContext, useContext, useState, ReactNode } from "react";

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
  addOrder: (order: MyOrder) => void;
  setOrders: React.Dispatch<React.SetStateAction<MyOrder[]>>;
}

const MyOrdersContext = createContext<MyOrdersContextType | undefined>(undefined);

export function MyOrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<MyOrder[]>([]);

  const addOrder = (order: MyOrder) => {
    setOrders((prev) => [order, ...prev]);
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
