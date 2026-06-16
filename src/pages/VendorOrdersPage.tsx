import { useState } from "react";
import { toast } from "sonner";
import { Search, Filter, Eye, Download } from "lucide-react";

const MOCK_VENDOR_ORDERS = [
  {
    id: "vo_001",
    order_number: "ORD-001",
    client: "Tech Solutions Inc",
    items: 5,
    amount: 15000,
    status: "delivered",
    date: "2024-01-10",
  },
  {
    id: "vo_002",
    order_number: "ORD-002",
    client: "Marketing Pro",
    items: 3,
    amount: 8500,
    status: "processing",
    date: "2024-01-15",
  },
  {
    id: "vo_003",
    order_number: "ORD-003",
    client: "Finance Corp",
    items: 8,
    amount: 22000,
    status: "pending",
    date: "2024-01-20",
  },
];

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState(MOCK_VENDOR_ORDERS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = orders.filter((o) => {
    const match =
      o.order_number.includes(search) ||
      o.client.toLowerCase().includes(search.toLowerCase());
    const statusMatch = statusFilter === "all" || o.status === statusFilter;
    return match && statusMatch;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    totalValue: orders.reduce((s, o) => s + o.amount, 0),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div>
            <p className="text-xs text-gray-500">Vendor Portal / Orders</p>
            <h1 className="text-2xl font-bold">My Orders</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {[
            { label: "Total", value: stats.total, color: "blue" },
            { label: "Pending", value: stats.pending, color: "yellow" },
            { label: "Processing", value: stats.processing, color: "blue" },
            { label: "Delivered", value: stats.delivered, color: "green" },
            { label: "Revenue", value: "$" + (stats.totalValue / 1000).toFixed(1) + "k", color: "purple" },
          ].map((stat) => (
            <div key={stat.label} className="p-4 bg-white rounded-lg border">
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className={`text-2xl font-bold mt-2 text-${stat.color}-600`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="delivered">Delivered</option>
          </select>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center gap-2">
            <Download size={18} />
            Export
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-6 py-4 text-left text-xs font-semibold">Order #</th>
                <th className="px-6 py-4 text-left text-xs font-semibold">Client</th>
                <th className="px-6 py-4 text-left text-xs font-semibold">Items</th>
                <th className="px-6 py-4 text-left text-xs font-semibold">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold">Status</th>
                <th className="px-6 py-4 text-center text-xs font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-blue-600">{o.order_number}</td>
                  <td className="px-6 py-4 text-sm">{o.client}</td>
                  <td className="px-6 py-4 text-sm">{o.items}</td>
                  <td className="px-6 py-4 text-sm font-medium">${o.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm">{o.date}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded text-xs font-semibold ${getStatusColor(o.status)}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="text-blue-600 hover:text-blue-700">
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
