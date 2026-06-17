import { useState } from "react";
import { Search, Filter, Eye, Download, AlertCircle, Shield, Clock } from "lucide-react";

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
        <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 md:py-4">
          <p className="text-xs text-gray-500">Procurement / Vendor Orders</p>
          <h1 className="text-2xl font-bold">Vendor Orders</h1>
        </div>
      </div>

      <div className="px-4 md:px-6 py-8">
        {/* Stats Cards - Updated Icons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "VENDOR ASSIGNMENTS", value: 0, icon: AlertCircle, color: "bg-blue-100 text-blue-600" },
              { label: "AT RISK SLA", value: 0, icon: Shield, color: "bg-yellow-100 text-yellow-600" },
              { label: "SLA BREACHES", value: 0, icon: AlertCircle, color: "bg-red-100 text-red-600" },
              { label: "DUE REMINDERS", value: 0, icon: Clock, color: "bg-purple-100 text-purple-600" },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="p-4 sm:p-6 bg-white rounded-lg border">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-600 font-semibold">{stat.label}</p>
                      <p className="text-2xl sm:text-3xl font-bold mt-2">{stat.value}</p>
                    </div>
                    <div className={`p-2 rounded ${stat.color}`}>
                      <Icon size={20} />
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Vendor Order Control Tower */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Vendor Order Control Tower</h2>
          
          {/* Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by order number, vendor, or organization"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-sm"
              />
            </div>
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option>All Vendors</option>
            </select>
            <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option>All SLA</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="overflow-x-auto min-w-0">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600">ORDER</th>
                    <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-600">VENDOR</th>
                    <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-600">ASSIGNED SCOPE</th>
                    <th className="hidden xl:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-600">SLA ELAPSED</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600">SLA</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-600">REMINDERS</th>
                    <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-600">AMOUNT</th>
                    <th className="px-3 sm:px-4 py-3 text-center text-xs font-semibold text-gray-600">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={8} className="px-3 sm:px-4 py-8 text-center text-gray-500 text-sm">
                      <div className="text-center">
                        <p className="font-medium">No vendor orders found</p>
                        <p className="text-xs">Assign vendors in procure order details and they will appear here.</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SLA Overview */}
        <div>
          <h2 className="text-lg font-semibold mb-4">SLA Overview</h2>
          <p className="text-sm text-gray-600 mb-4">Live vendor SLA status with quick actions for procurement.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { label: "WITHIN SLA", value: 0, color: "bg-green-100 text-green-600" },
              { label: "AT RISK", value: 0, color: "bg-yellow-100 text-yellow-600" },
              { label: "BREACHED", value: 0, color: "bg-red-100 text-red-600" },
              { label: "DUE REMINDERS", value: 0, color: "bg-gray-100 text-gray-600" },
            ].map((stat) => (
              <div key={stat.label} className={`p-4 sm:p-6 rounded-lg ${stat.color}`}>
                <p className="text-xs font-semibold mb-2">{stat.label}</p>
                <p className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
