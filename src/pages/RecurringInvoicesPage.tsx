import { useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Trash2, MoreVertical } from "lucide-react";

const MOCK_RECURRING = [
  {
    id: "rec_001",
    number: "REC-001",
    client: "Tech Solutions Inc",
    amount: 5000,
    frequency: "monthly",
    status: "active",
    start_date: "2024-01-01",
  },
  {
    id: "rec_002",
    number: "REC-002",
    client: "Marketing Pro Agency",
    amount: 2500,
    frequency: "quarterly",
    status: "active",
    start_date: "2024-01-15",
  },
];

export default function RecurringInvoicesPage() {
  const [invoices, setInvoices] = useState(MOCK_RECURRING);
  const [search, setSearch] = useState("");

  const filtered = invoices.filter((inv) =>
    inv.number.includes(search) ||
    inv.client.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    active: invoices.filter((i) => i.status === "active").length,
    total_invoices: invoices.length,
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Delete recurring invoice?")) {
      setInvoices(invoices.filter((i) => i.id !== id));
      toast.success("Deleted");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Finance / Recurring Invoices</p>
            <h1 className="text-2xl font-bold">Recurring Invoices</h1>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus size={18} />
            New Recurring
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-white rounded-lg border">
            <p className="text-sm text-gray-600">Active</p>
            <p className="text-3xl font-bold">{stats.active}</p>
          </div>
          <div className="p-4 bg-white rounded-lg border">
            <p className="text-sm text-gray-600">Total Invoices</p>
            <p className="text-3xl font-bold">{stats.total_invoices}</p>
          </div>
          <div className="p-4 bg-white rounded-lg border">
            <p className="text-sm text-gray-600">Total Value</p>
            <p className="text-3xl font-bold">${invoices.reduce((s, i) => s + i.amount, 0).toLocaleString()}</p>
          </div>
        </div>

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold">Number</th>
                <th className="px-3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold">Client</th>
                <th className="px-3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold">Amount</th>
                <th className="px-3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold">Frequency</th>
                <th className="px-3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold">Status</th>
                <th className="px-3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-center text-xs font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="border-b hover:bg-gray-50">
                  <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-sm font-medium text-blue-600">{inv.number}</td>
                  <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-sm">{inv.client}</td>
                  <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-sm">${inv.amount.toLocaleString()}</td>
                  <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-sm">{inv.frequency}</td>
                  <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-sm">
                    <span className="px-3 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                      {inv.status}
                    </span>
                  </td>
                  <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-center">
                    <button onClick={() => handleDelete(inv.id)} className="text-red-600 hover:text-red-700">
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
