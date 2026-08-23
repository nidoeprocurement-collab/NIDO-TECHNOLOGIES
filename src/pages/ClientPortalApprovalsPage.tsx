import { useMemo } from "react";
import { CheckCircle2, ClipboardList } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getClientOrders } from "@/lib/clientDataStore";

export default function ClientPortalApprovalsPage() {
  const { user } = useAuth();
  const orders = useMemo(
    () => user?.clientId ? getClientOrders(user.clientId, user.clientName ?? "") : [],
    [user?.clientId, user?.clientName],
  );
  const pending = orders.filter(order => !["Delivered", "Cancelled"].includes(order.status));
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="border-b border-gray-200/70 mb-8 pb-4">
        <p className="text-xs text-gray-500">Portal / Approvals</p>
        <h1 className="text-2xl font-bold">My Approvals</h1>
        <p className="text-sm text-gray-500">Requests belonging to your client account</p>
      </div>
      <div className="rounded-xl border border-gray-200">
        {pending.length === 0 ? (
          <div className="flex flex-col items-center p-12 text-center">
            <CheckCircle2 className="mb-3 text-emerald-500" size={28} />
            <p className="font-medium text-gray-700">No pending approvals</p>
            <p className="mt-1 text-sm text-gray-500">New client requests requiring action will appear here.</p>
          </div>
        ) : pending.map(order => (
          <div key={order.id} className="flex items-center gap-3 border-b border-gray-100 p-4 last:border-0">
            <ClipboardList className="text-blue-600" size={18} />
            <div><p className="text-sm font-medium">Order {order.id}</p><p className="text-xs text-gray-500">{order.status}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}