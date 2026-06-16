import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Plus,
  Search,
  MoreVertical,
  Download,
  Eye,
  Trash2,
  Filter,
} from "lucide-react";

const MOCK_ORDERS = [
  {
    id: "ord_001",
    order_number: "ORD-001",
    client_name: "Tech Solutions Inc",
    vendor_name: "Global Supplies",
    status: "delivered",
    total_amount: 15000,
    order_date: "2024-01-10",
    items_count: 5,
  },
  {
    id: "ord_002",
    order_number: "ORD-002",
    client_name: "Marketing Pro Agency",
    vendor_name: "Equipment Rentals",
    status: "processing",
    total_amount: 8500,
    order_date: "2024-01-15",
    items_count: 3,
  },
  {
    id: "ord_003",
    order_number: "ORD-003",
    client_name: "Finance Corp",
    vendor_name: "Tech Solutions Ltd",
    status: "pending",
    total_amount: 22000,
    order_date: "2024-01-20",
    items_count: 8,
  },
  {
    id: "ord_004",
    order_number: "ORD-004",
    client_name: "Global Trading Ltd",
    vendor_name: "Global Supplies",
    status: "cancelled",
    total_amount: 5500,
    order_date: "2024-01-25",
    items_count: 2,
  },
];

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState(MOCK_ORDERS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loadError, setLoadError] = useState<string | null>(null);

  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.client_name.toLowerCase().includes(search.toLowerCase()) ||
      o.vendor_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      setOrders(orders.filter((o) => o.id !== id));
      toast.success("Order deleted");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Procurement / Orders</p>
            <h1 className="text-2xl font-bold">Purchase Orders</h1>
          </div>
          <button
            onClick={() => navigate("/orders/new")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={18} />
            New Order
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Orders", value: stats.total, color: "blue" },
            { label: "Pending", value: stats.pending, color: "yellow" },
            { label: "Processing", value: stats.processing, color: "blue" },
            { label: "Delivered", value: stats.delivered, color: "green" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 bg-white rounded-lg border border-gray-200"
            >
              <p className="text-gray-600 text-sm">{stat.label}</p>
              <p className={`text-2xl font-bold mt-2 text-${stat.color}-600`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by order number, client, or vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto min-w-0">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600">
                    Order #
                  </th>
                  <th className="px-3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600">
                    Client
                  </th>
                  <th className="px-3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600">
                    Vendor
                  </th>
                  <th className="px-3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600">
                    Items
                  </th>
                  <th className="px-3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600">
                    Amount
                  </th>
                  <th className="px-3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600">
                    Date
                  </th>
                  <th className="px-3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="px-3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-center text-xs font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 md:px-6 py-8 text-center text-gray-500">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-sm font-medium text-blue-600 cursor-pointer hover:underline">
                        {order.order_number}
                      </td>
                      <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-sm">{order.client_name}</td>
                      <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-sm">{order.vendor_name}</td>
                      <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-sm">
                        {order.items_count} items
                      </td>
                      <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-sm font-medium">
                        ${order.total_amount.toLocaleString()}
                      </td>
                      <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-sm">{order.order_date}</td>
                      <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-center">
                        <div className="relative group">
                          <button className="p-2 hover:bg-gray-200 rounded">
                            <MoreVertical size={16} />
                          </button>
                          <div className="hidden group-hover:flex absolute right-0 mt-0 bg-white border rounded-lg shadow-lg flex-col z-10">
                            <button
                              onClick={() => navigate(`/orders/${order.id}`)}
                              className="px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Eye size={14} /> View
                            </button>
                            <button
                              onClick={() => handleDelete(order.id)}
                              className="px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
