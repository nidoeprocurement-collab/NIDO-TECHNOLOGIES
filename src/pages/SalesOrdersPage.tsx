import { useState } from "react";
import { toast } from "sonner";
import { Plus, Search, MoreVertical, Trash2, Eye } from "lucide-react";

const MOCK_SALES_ORDERS = [
  {
    id: "so_001",
    number: "SO-001",
    client: "Tech Solutions Inc",
    amount: 25000,
    status: "completed",
    date: "2024-01-10",
    items: 12,
  },
  {
    id: "so_002",
    number: "SO-002",
    client: "Marketing Pro Agency",
    amount: 15000,
    status: "processing",
    date: "2024-01-15",
    items: 8,
  },
  {
    id: "so_003",
    number: "SO-003",
    client: "Finance Corp",
    amount: 35000,
    status: "pending",
    date: "2024-01-20",
    items: 18,
  },
];

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState(MOCK_SALES_ORDERS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = orders.filter((o) => {
    const match =
      o.number.includes(search) ||
      o.client.toLowerCase().includes(search.toLowerCase());
    const statusMatch = statusFilter === "all" || o.status === statusFilter;
    return match && statusMatch;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    completed: orders.filter((o) => o.status === "completed").length,
    totalValue: orders.reduce((s, o) => s + o.amount, 0),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Delete this order?")) {
      setOrders(orders.filter((o) => o.id !== id));
      toast.success("Deleted");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-transparent border-b border-gray-200/70">
        <div className="w-full px-2 md:px-4 lg:px-4 md:px-6 py-2 md:py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Sales / Orders</p>
            <h1 className="text-2xl font-bold">Sales Orders</h1>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus size={18} />
            New Order
          </button>
        </div>
      </div>

      <div className="w-full px-2 md:px-6 py-8">
        <div className="grid grid-cols-5 gap-2 mb-8">
          {[
            { label: "Total", value: stats.total, color: "blue" },
            { label: "Pending", value: stats.pending, color: "yellow" },
            { label: "Processing", value: stats.processing, color: "blue" },
            { label: "Completed", value: stats.completed, color: "green" },
            { label: "Value", value: "$" + stats.totalValue.toLocaleString(), color: "purple" },
          ].map((stat) => (
            <div key={stat.label} className="p-4 bg-white rounded-lg border">
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className={`text-2xl font-bold mt-2 text-${stat.color}-600`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search..."
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
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-3 md:px-4 lg:px-4 md:px-6 py-2 md:py-4 text-left text-xs font-semibold">Order #</th>
                <th className="px-3 md:px-4 lg:px-4 md:px-6 py-2 md:py-4 text-left text-xs font-semibold">Client</th>
                <th className="px-3 md:px-4 lg:px-4 md:px-6 py-2 md:py-4 text-left text-xs font-semibold">Items</th>
                <th className="px-3 md:px-4 lg:px-4 md:px-6 py-2 md:py-4 text-left text-xs font-semibold">Amount</th>
                <th className="px-3 md:px-4 lg:px-4 md:px-6 py-2 md:py-4 text-left text-xs font-semibold">Date</th>
                <th className="px-3 md:px-4 lg:px-4 md:px-6 py-2 md:py-4 text-left text-xs font-semibold">Status</th>
                <th className="px-3 md:px-4 lg:px-4 md:px-6 py-2 md:py-4 text-center text-xs font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b hover:bg-gray-50">
                  <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-2 md:py-4 text-sm font-medium text-blue-600">{o.number}</td>
                  <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-2 md:py-4 text-sm">{o.client}</td>
                  <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-2 md:py-4 text-sm">{o.items}</td>
                  <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-2 md:py-4 text-sm font-medium">${o.amount.toLocaleString()}</td>
                  <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-2 md:py-4 text-sm">{o.date}</td>
                  <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-2 md:py-4 text-sm">
                    <span className={`px-3 py-1 rounded text-xs font-semibold ${getStatusColor(o.status)}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-2 md:py-4 text-center">
                    <button onClick={() => handleDelete(o.id)} className="text-red-600 hover:text-red-700">
                      <Trash2 size={16} />
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
