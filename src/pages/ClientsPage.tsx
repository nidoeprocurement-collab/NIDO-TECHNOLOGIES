import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Download, Upload, MoreVertical, Archive, Edit, Eye } from "lucide-react";

const MOCK_CLIENTS = [
  {
    id: "CLI-001",
    client_id: "CLI-00024",
    company_name: "Acme Corporation",
    contact_person: "John Smith",
    email: "john.smith@acme.com",
    status: "active",
    total_spend: 0,
  },
  {
    id: "CLI-002",
    client_id: "CLI-00023",
    company_name: "TechVision Solutions",
    contact_person: "Sarah Johnson",
    email: "sarah@techvision.com",
    status: "active",
    total_spend: 0,
  },
  {
    id: "CLI-003",
    client_id: "CLI-00020",
    company_name: "Global Enterprises",
    contact_person: "Michael Brown",
    email: "michael@globalent.com",
    status: "active",
    total_spend: 0,
  },
];

export default function ClientsPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<"Premium" | "Active" | "Pending" | "Inactive">("Active");
  const [showMenu, setShowMenu] = useState(false);
  const [rowMenuOpen, setRowMenuOpen] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const stats = { premium: 0, active: 14, pending: 0, inactive: 0 };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-3 sm:px-4 md:px-6 py-4 md:py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          
          {/* 3-Dot Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <MoreVertical size={20} />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg w-48 z-50">
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                  <Plus size={16} /> New Client
                </button>
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                  <Download size={16} /> Export CSV
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={() => {
                    setShowArchived(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  <Archive size={16} /> Archived Clients
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { label: "Premium Clients", value: "Premium", count: stats.premium },
            { label: "Active Clients", value: "Active", count: stats.active },
            { label: "Pending", value: "Pending", count: stats.pending },
            { label: "Inactive", value: "Inactive", count: stats.inactive },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value as any)}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium whitespace-nowrap rounded-lg transition-all ${
                activeFilter === tab.value
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    <input type="checkbox" className="rounded" />
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    Client ID
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    Client Name
                  </th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    Representative
                  </th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    Email
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    Total Spend (INR)
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-center text-xs font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {MOCK_CLIENTS.map((client) => (
                  <tr key={client.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-3">
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td
                      className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium text-blue-600 cursor-pointer hover:underline"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      {client.client_id}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium">
                      {client.company_name}
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-xs sm:text-sm">
                      {client.contact_person}
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3 text-xs sm:text-sm">
                      {client.email}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm">
                      ₹{client.total_spend || 0}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                        {client.status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-center relative">
                      <button
                        onClick={() => setRowMenuOpen(rowMenuOpen === client.id ? null : client.id)}
                        className="p-1 hover:bg-gray-100 rounded inline-block"
                      >
                        <MoreVertical size={18} className="text-gray-600" />
                      </button>

                      {rowMenuOpen === client.id && (
                        <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-40 z-50">
                          <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                            <Eye size={16} /> View Details
                          </button>
                          <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                            <Edit size={16} /> Edit
                          </button>
                          <div className="border-t border-gray-200 my-1"></div>
                          <button className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600">
                            <Archive size={16} /> Archive
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Archived Clients Modal */}
        {showArchived && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
              <div className="sticky top-0 bg-white border-b p-4 sm:p-6 flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Archived Clients</h2>
                <button
                  onClick={() => setShowArchived(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="p-4 sm:p-6">
                <p className="text-gray-500">No archived clients yet</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
