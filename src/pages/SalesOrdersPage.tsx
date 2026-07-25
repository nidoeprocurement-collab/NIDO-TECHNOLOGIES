import { useState, useMemo } from "react";
import { useConfig } from "@/contexts/ConfigContext";
import { toast } from "sonner";
import { Plus, Search, MoreVertical, Trash2, Eye, FileDown } from "lucide-react";

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

function statusBadge(status: string) {
  switch (status) {
    case "completed":  return "bg-green-100 text-green-800";
    case "processing": return "bg-blue-100 text-blue-800";
    case "pending":    return "bg-yellow-100 text-yellow-800";
    default:           return "bg-gray-100 text-gray-800";
  }
}

export default function SalesOrdersPage() {
  const { config } = useConfig();
  const soPrefix = config.prefixes.find(p => p.key === "salesOrder")?.value || "SO-";

  const [orders, setOrders] = useState(MOCK_SALES_ORDERS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const [rowMenuOpen, setRowMenuOpen] = useState<string | null>(null);

  const displayedOrders = useMemo(
    () => orders.map(o => ({ ...o, number: o.number.replace(/^SO-/, soPrefix) })),
    [orders, soPrefix]
  );

  const filtered = displayedOrders.filter(o => {
    const match = o.number.includes(search) || o.client.toLowerCase().includes(search.toLowerCase());
    const statusMatch = statusFilter === "all" || o.status === statusFilter;
    return match && statusMatch;
  });

  const stats = {
    total:      orders.length,
    pending:    orders.filter(o => o.status === "pending").length,
    processing: orders.filter(o => o.status === "processing").length,
    completed:  orders.filter(o => o.status === "completed").length,
    totalValue: orders.reduce((s, o) => s + o.amount, 0),
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Delete this order?")) {
      setOrders(orders.filter(o => o.id !== id));
      setRowMenuOpen(null);
      toast.success("Deleted");
    }
  };

  const exportCsv = () => {
    const headers = ["Order #", "Client", "Items", "Amount", "Date", "Status"];
    const escapeCsv = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = displayedOrders.map(o => [o.number, o.client, o.items, o.amount, o.date, o.status]);
    const csv = [headers, ...rows].map(row => row.map(escapeCsv).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    link.download = "sales-orders.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="space-y-6" onClick={() => { setMenuOpen(false); setRowMenuOpen(null); }}>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Create and manage sales orders</p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales Orders</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <MoreVertical size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 z-50">
                <button
                  onClick={() => { setMenuOpen(false); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                >
                  <Plus size={16} />
                  New Order
                </button>
                <button
                  onClick={() => { setMenuOpen(false); exportCsv(); }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                >
                  <FileDown size={16} />
                  Export CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Total",      value: stats.total,                                      color: "text-blue-600 dark:text-blue-400" },
          { label: "Pending",    value: stats.pending,                                    color: "text-yellow-600 dark:text-yellow-400" },
          { label: "Processing", value: stats.processing,                                 color: "text-blue-600 dark:text-blue-400" },
          { label: "Completed",  value: stats.completed,                                  color: "text-green-600 dark:text-green-400" },
          { label: "Value",      value: "$" + stats.totalValue.toLocaleString(),          color: "text-purple-600 dark:text-purple-400" },
        ].map(stat => (
          <div key={stat.label} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-400 dark:text-gray-500 mb-4">No orders found</p>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
            >
              <Plus size={16} /> Create First Order
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  {["ORDER #", "CLIENT", "ITEMS", "AMOUNT", "DATE", "STATUS", "ACTIONS"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">{o.number}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{o.client}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{o.items}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">${o.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{o.date}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusBadge(o.status)}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <div className="relative">
                          <button
                            onClick={() => setRowMenuOpen(rowMenuOpen === o.id ? null : o.id)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            <MoreVertical size={16} className="text-gray-600 dark:text-gray-400" />
                          </button>
                          {rowMenuOpen === o.id && (
                            <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 z-50">
                              <button
                                onClick={() => setRowMenuOpen(null)}
                                className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                              >
                                <Eye size={15} /> View
                              </button>
                              <button
                                onClick={() => handleDelete(o.id)}
                                className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                              >
                                <Trash2 size={15} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
