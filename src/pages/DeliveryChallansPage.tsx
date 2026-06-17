import { useState } from "react";
import { toast } from "sonner";
import { Plus, Search, MoreVertical, Trash2, Eye } from "lucide-react";

const MOCK_CHALLANS = [
  {
    id: "dc_001",
    number: "DC-001",
    order_id: "ORD-001",
    client_name: "Tech Solutions Inc",
    items_count: 5,
    status: "delivered",
    created_date: "2024-01-10",
  },
  {
    id: "dc_002",
    number: "DC-002",
    order_id: "ORD-002",
    client_name: "Marketing Pro Agency",
    items_count: 3,
    status: "in_transit",
    created_date: "2024-01-15",
  },
  {
    id: "dc_003",
    number: "DC-003",
    order_id: "ORD-003",
    client_name: "Finance Corp",
    items_count: 8,
    status: "pending",
    created_date: "2024-01-20",
  },
];

export default function DeliveryChallansPage() {
  const [challans, setChallans] = useState(MOCK_CHALLANS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = challans.filter((c) => {
    const match =
      c.number.includes(search) ||
      c.client_name.toLowerCase().includes(search.toLowerCase());
    const statusMatch = statusFilter === "all" || c.status === statusFilter;
    return match && statusMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "in_transit":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Delete challan?")) {
      setChallans(challans.filter((c) => c.id !== id));
      toast.success("Challan deleted");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="w-full px-3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Logistics / Delivery Challans</p>
            <h1 className="text-2xl font-bold">Delivery Challans</h1>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus size={18} />
            New Challan
          </button>
        </div>
      </div>

      <div className="w-full px-4 md:px-6 py-8">
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
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>

        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold">Challan #</th>
                <th className="px-3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold">Client</th>
                <th className="px-3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold">Items</th>
                <th className="px-3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold">Date</th>
                <th className="px-3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold">Status</th>
                <th className="px-3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-center text-xs font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-sm font-medium text-blue-600">{c.number}</td>
                  <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-sm">{c.client_name}</td>
                  <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-sm">{c.items_count}</td>
                  <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-sm">{c.created_date}</td>
                  <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-sm">
                    <span className={`px-3 py-1 rounded text-xs font-semibold ${getStatusColor(c.status)}`}>
                      {c.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-center">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-red-600 hover:text-red-700"
                    >
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
