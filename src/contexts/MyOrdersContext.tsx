import { createContext, useContext, useState, ReactNode } from "react";

// ─── Types (same shape as MyOrderPage uses) ────────────────────────────────────
export type MyOrderStatus =
  | "Processing"
  | "Partially Shipped"
  | "Partially Delivered"
  | "Delivered"
  | "Cancelled"
  | "Draft";

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
}

// ─── Seed data (moved here from MyOrderPage) ──────────────────────────────────
const SEED_ORDERS: MyOrder[] = [
  {
    id: "ORD-24815779", client: "TechHub Solutions", clientColor: "#c53030", clientInitial: "T",
    poNumber: "PO-10034", requester: "Pavan", requesterRole: "System Owner", requesterInitial: "P", requesterColor: "#6b46c1",
    assigned: "Sneha Iyer", assignedRole: "Admin", assignedInitial: "S", assignedColor: "#276749",
    orderDate: "Apr 16, 2026", orderTime: "12:33 PM", status: "Processing",
    slaTime: "02:45", slaAlert: true, totalAmount: "$2,192.00",
  },
  {
    id: "ORD-24815678", client: "OfficeMart Supplies", clientColor: "#2b6cb0", clientInitial: "O",
    poNumber: "PO-10035", requester: "Rohit Sharma", requesterRole: "Admin", requesterInitial: "R", requesterColor: "#9b2c2c",
    assigned: "Priya Nair", assignedRole: "Admin", assignedInitial: "P", assignedColor: "#c05621",
    orderDate: "Apr 15, 2026", orderTime: "04:15 PM", status: "Partially Shipped",
    slaTime: "01:30", slaAlert: false, totalAmount: "$1,045.50",
  },
  {
    id: "ORD-24815560", client: "PaperWorld Distributors", clientColor: "#276749", clientInitial: "A",
    poNumber: "PO-10036", requester: "Anita Desai", requesterRole: "Procurement Manager", requesterInitial: "A", requesterColor: "#276749",
    assigned: "Arjun Mehta", assignedRole: "Procurement Manager", assignedInitial: "A", assignedColor: "#276749",
    orderDate: "Apr 14, 2026", orderTime: "11:20 AM", status: "Partially Delivered",
    slaTime: "03:10", slaAlert: false, totalAmount: "$3,765.25",
  },
  {
    id: "ORD-24815432", client: "Global Industrial", clientColor: "#276749", clientInitial: "G",
    poNumber: "PO-10037", requester: "Sanjay Patel", requesterRole: "Purchase Executive", requesterInitial: "S", requesterColor: "#276749",
    assigned: "Rahul Verma", assignedRole: "Purchase Executive", assignedInitial: "R", assignedColor: "#9b2c2c",
    orderDate: "Apr 13, 2026", orderTime: "09:10 AM", status: "Delivered",
    slaTime: null, slaAlert: false, totalAmount: "$980.00",
  },
  {
    id: "ORD-24815321", client: "TechHub Solutions", clientColor: "#c53030", clientInitial: "T",
    poNumber: "PO-10038", requester: "Priya Nair", requesterRole: "Admin", requesterInitial: "P", requesterColor: "#c05621",
    assigned: "Sneha Iyer", assignedRole: "Admin", assignedInitial: "S", assignedColor: "#276749",
    orderDate: "Apr 12, 2026", orderTime: "02:45 PM", status: "Delivered",
    slaTime: null, slaAlert: false, totalAmount: "$1,560.00",
  },
  {
    id: "ORD-24815210", client: "OfficeMart Supplies", clientColor: "#2b6cb0", clientInitial: "O",
    poNumber: "PO-10039", requester: "Rahul Verma", requesterRole: "Purchase Executive", requesterInitial: "R", requesterColor: "#9b2c2c",
    assigned: "Sanjay Patel", assignedRole: "Purchase Executive", assignedInitial: "S", assignedColor: "#276749",
    orderDate: "Apr 11, 2026", orderTime: "10:30 AM", status: "Cancelled",
    slaTime: null, slaAlert: false, totalAmount: "$450.00",
  },
  {
    id: "ORD-24815105", client: "PaperWorld Distributors", clientColor: "#276749", clientInitial: "A",
    poNumber: "-", requester: "Arjun Mehta", requesterRole: "Procurement Manager", requesterInitial: "A", requesterColor: "#276749",
    assigned: "Anita Desai", assignedRole: "Procurement Manager", assignedInitial: "A", assignedColor: "#276749",
    orderDate: "Apr 10, 2026", orderTime: "03:20 PM", status: "Draft",
    slaTime: null, slaAlert: false, totalAmount: "$0.00",
  },
  {
    id: "ORD-24815001", client: "Global Industrial", clientColor: "#276749", clientInitial: "G",
    poNumber: "PO-10040", requester: "Sneha Iyer", requesterRole: "Admin", requesterInitial: "S", requesterColor: "#276749",
    assigned: "Priya Nair", assignedRole: "Admin", assignedInitial: "P", assignedColor: "#c05621",
    orderDate: "Apr 09, 2026", orderTime: "01:05 PM", status: "Processing",
    slaTime: "01:05", slaAlert: true, totalAmount: "$875.75",
  },
];

// ─── Context ──────────────────────────────────────────────────────────────────
interface MyOrdersContextType {
  orders: MyOrder[];
  addOrder: (order: MyOrder) => void;
  setOrders: React.Dispatch<React.SetStateAction<MyOrder[]>>;
}

const MyOrdersContext = createContext<MyOrdersContextType | undefined>(undefined);

export function MyOrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<MyOrder[]>(SEED_ORDERS);

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
