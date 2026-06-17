import { useState } from "react";
import { toast } from "sonner";
import { Plus, Search, MessageCircle, Clock, CheckCircle, AlertCircle } from "lucide-react";

const MOCK_TICKETS = [
  {
    id: "tkt_001",
    number: "TKT-001",
    subject: "Unable to access vendor portal",
    status: "resolved",
    priority: "high",
    created: "2024-01-20",
    resolved: "2024-01-21",
  },
  {
    id: "tkt_002",
    number: "TKT-002",
    subject: "Invoice discrepancy",
    status: "in_progress",
    priority: "medium",
    created: "2024-01-22",
    resolved: null,
  },
  {
    id: "tkt_003",
    number: "TKT-003",
    subject: "Payment method update",
    status: "open",
    priority: "low",
    created: "2024-01-23",
    resolved: null,
  },
];

export default function SupportPage() {
  const [tickets, setTickets] = useState(MOCK_TICKETS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ subject: "", description: "", priority: "medium" });

  const filtered = tickets.filter((t) => {
    const match =
      t.number.includes(search) ||
      t.subject.toLowerCase().includes(search.toLowerCase());
    const statusMatch = statusFilter === "all" || t.status === statusFilter;
    return match && statusMatch;
  });

  const stats = {
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

  const handleCreate = () => {
    if (!form.subject) {
      toast.error("Please enter a subject");
      return;
    }
    const newTicket = {
      id: `tkt_${Date.now()}`,
      number: `TKT-${String(tickets.length + 1).padStart(3, "0")}`,
      subject: form.subject,
      status: "open",
      priority: form.priority,
      created: new Date().toISOString().split("T")[0],
      resolved: null,
    };
    setTickets([...tickets, newTicket]);
    toast.success("Support ticket created");
    setShowCreate(false);
    setForm({ subject: "", description: "", priority: "medium" });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return <CheckCircle className="text-green-600" size={18} />;
      case "in_progress":
        return <Clock className="text-blue-600" size={18} />;
      case "open":
        return <AlertCircle className="text-yellow-600" size={18} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "open":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="w-full px-3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Support / Tickets</p>
            <h1 className="text-2xl font-bold">Support Center</h1>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={18} />
            New Ticket
          </button>
        </div>
      </div>

      <div className="w-full px-4 md:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-4 md:gap-6 mb-4 md:mb-6 md:mb-8">
          {[
            { label: "Open", value: stats.open, color: "yellow", icon: AlertCircle },
            { label: "In Progress", value: stats.in_progress, color: "blue", icon: Clock },
            { label: "Resolved", value: stats.resolved, color: "green", icon: CheckCircle },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="p-6 bg-white rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">{stat.label}</p>
                    <p className={`text-3xl font-bold mt-2 text-${stat.color}-600`}>
                      {stat.value}
                    </p>
                  </div>
                  <Icon className={`text-${stat.color}-600`} size={28} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search tickets..."
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
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {/* Tickets Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold">Ticket</th>
                <th className="px-3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold">Subject</th>
                <th className="px-3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold">Priority</th>
                <th className="px-3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold">Created</th>
                <th className="px-3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-left text-xs font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ticket) => (
                <tr key={ticket.id} className="border-b hover:bg-gray-50">
                  <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-sm font-medium text-blue-600">
                    {ticket.number}
                  </td>
                  <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-sm">{ticket.subject}</td>
                  <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-sm">
                    <span className={`px-3 py-1 rounded text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-sm">{ticket.created}</td>
                  <td className="px- truncate3 md:px-4 lg:px-4 md:px-6 py-3 md:py-4 text-sm">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(ticket.status)}
                      <span className={`px-3 py-1 rounded text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace("_", " ")}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Create Support Ticket</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject *</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg h-24"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
