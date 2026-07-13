import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Search, Download, MoreVertical, Eye, Trash2, Edit2 } from "lucide-react";

const MOCK_INVOICES = [
  {
    id: "inv_001",
    invoice_number: "INV-001",
    client_name: "Tech Solutions Inc",
    amount: 15000,
    status: "paid",
    invoice_date: "2024-01-10",
    due_date: "2024-02-10",
  },
  {
    id: "inv_002",
    invoice_number: "INV-002",
    client_name: "Marketing Pro Agency",
    amount: 8500,
    status: "pending",
    invoice_date: "2024-01-15",
    due_date: "2024-02-15",
  },
  {
    id: "inv_003",
    invoice_number: "INV-003",
    client_name: "Finance Corp",
    amount: 22000,
    status: "overdue",
    invoice_date: "2023-12-20",
    due_date: "2024-01-20",
  },
];

export default function InvoicePage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState(MOCK_INVOICES);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredInvoices = invoices.filter((inv) => {
    const matchSearch =
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      inv.client_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: invoices.length,
    paid: invoices.filter((i) => i.status === "paid").length,
    pending: invoices.filter((i) => i.status === "pending").length,
    overdue: invoices.filter((i) => i.status === "overdue").length,
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure?")) {
      setInvoices(invoices.filter((i) => i.id !== id));
      toast.success("Invoice deleted");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-transparent border-b border-gray-200/70">
        <div className="w-full px-2 md:px-4 lg:px-4 md:px-6 py-2 md:py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Finance / Invoices</p>
            <h1 className="text-2xl font-bold">Invoices</h1>
          </div>
          <button
            onClick={() => navigate("/invoices/new")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={18} />
            New Invoice
          </button>
        </div>
      </div>

      <div className="w-full px-2 md:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-8">
          {[
            { label: "Total", value: stats.total, color: "blue" },
            { label: "Paid", value: stats.paid, color: "green" },
            { label: "Pending", value: stats.pending, color: "yellow" },
            { label: "Overdue", value: stats.overdue, color: "red" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 bg-white rounded-lg border border-gray-200"
            >
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className={`text-2xl font-bold mt-2 text-${stat.color}-600`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search invoices..."
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
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-3 md:px-4 lg:px-4 md:px-6 py-2 md:py-4 text-left text-xs font-semibold">Invoice #</th>
                <th className="px-3 md:px-4 lg:px-4 md:px-6 py-2 md:py-4 text-left text-xs font-semibold">Client</th>
                <th className="px-3 md:px-4 lg:px-4 md:px-6 py-2 md:py-4 text-left text-xs font-semibold">Amount</th>
                <th className="px-3 md:px-4 lg:px-4 md:px-6 py-2 md:py-4 text-left text-xs font-semibold">Date</th>
                <th className="px-3 md:px-4 lg:px-4 md:px-6 py-2 md:py-4 text-left text-xs font-semibold">Due</th>
                <th className="px-3 md:px-4 lg:px-4 md:px-6 py-2 md:py-4 text-left text-xs font-semibold">Status</th>
                <th className="px-3 md:px-4 lg:px-4 md:px-6 py-2 md:py-4 text-center text-xs font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="border-b hover:bg-gray-50">
                  <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-2 md:py-4 text-sm font-medium text-blue-600">
                    {inv.invoice_number}
                  </td>
                  <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-2 md:py-4 text-sm">{inv.client_name}</td>
                  <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-2 md:py-4 text-sm">${inv.amount.toLocaleString()}</td>
                  <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-2 md:py-4 text-sm">{inv.invoice_date}</td>
                  <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-2 md:py-4 text-sm">{inv.due_date}</td>
                  <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-2 md:py-4 text-sm">
                    <span className={`px-3 py-1 rounded text-xs font-semibold ${getStatusColor(inv.status)}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-2 md:py-4 text-center">
                    <button
                      onClick={() => handleDelete(inv.id)}
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
