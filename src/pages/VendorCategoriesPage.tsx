import { Plus, Settings, Eye, Edit2, Trash2, Download, ZapOff, Lock, Layers } from "lucide-react";

const MOCK_CATEGORIES = [
  {
    id: 1,
    name: "IT Hardware",
    code: "ITH",
    description: "Computer hardware and p...",
    workflow: "IT Service Approval",
    template: "Standard",
    vendors: 1,
    status: "Active",
  },
  {
    id: 2,
    name: "Office Supplies",
    code: "OFS",
    description: "General office supplies an...",
    workflow: "No Approval Required",
    template: "Basic",
    vendors: 0,
    status: "Inactive",
  },
  {
    id: 3,
    name: "Cloud Services",
    code: "CLS",
    description: "Cloud computing and SaaS...",
    workflow: "No Approval Required",
    template: "Premium",
    vendors: 0,
    status: "Inactive",
  },
  {
    id: 4,
    name: "Security Systems",
    code: "SEC",
    description: "Physical and cyber securit...",
    workflow: "Maintenance Approval",
    template: "Premium",
    vendors: 0,
    status: "Inactive",
  },
  {
    id: 5,
    name: "Consulting",
    code: "CON",
    description: "Professional consulting ser...",
    workflow: "Construction Approval",
    template: "Standard",
    vendors: 0,
    status: "Inactive",
  },
];

export default function VendorCategoriesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Configuration / Vendor Categories</p>
            <h1 className="text-2xl font-bold">Vendor Categories</h1>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center gap-2 text-sm font-medium">
              <Download size={18} />
              Export
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium">
              <Plus size={18} />
              Add Category
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option>All Vendors</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option>All Workflows</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option>All SLA Templates</option>
          </select>
          <input type="text" placeholder="Search" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600">CATEGORY NAME</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-600">VENDOR CODE</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">DESCRIPTION</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">APPROVAL WORKFLOW</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">DEFAULT SLA TEMPLATE</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">ACTIVE VENDORS</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">STATUS</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_CATEGORIES.map((cat) => (
                  <tr key={cat.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium">{cat.name}</td>
                    <td className="hidden md:table-cell px-4 py-3 text-xs sm:text-sm">{cat.code}</td>
                    <td className="hidden lg:table-cell px-4 py-3 text-xs sm:text-sm text-gray-600">{cat.description}</td>
                    <td className="hidden xl:table-cell px-4 py-3 text-xs sm:text-sm">{cat.workflow}</td>
                    <td className="hidden xl:table-cell px-4 py-3 text-xs sm:text-sm">{cat.template}</td>
                    <td className="hidden sm:table-cell px-4 py-3 text-xs sm:text-sm text-center">{cat.vendors}</td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        {cat.status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <Edit2 size={14} />
                        </button>
                        <button className="p-1 hover:bg-gray-200 rounded text-red-600">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-3 sm:px-4 py-3 border-t text-xs sm:text-sm text-gray-600">
            1 — 5 of 5
          </div>
        </div>

        {/* Category Settings */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Category Settings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 sm:p-6 rounded-lg border hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <Settings size={18} className="text-blue-600" />
                <h3 className="font-semibold text-sm sm:text-base">Manage Approval Paths</h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">Configure category-specific approval workflows.</p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg border hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <Lock size={18} className="text-green-600" />
                <h3 className="font-semibold text-sm sm:text-base">Role Hierarchy & Permissions</h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">Set roles and permissions for vendor categories.</p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg border hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <ZapOff size={18} className="text-purple-600" />
                <h3 className="font-semibold text-sm sm:text-base">Auto Assignment Logic</h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">Define auto vendor assignment rules.</p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg border hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <Layers size={18} className="text-orange-600" />
                <h3 className="font-semibold text-sm sm:text-base">Category Settings</h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-600">Edit/manage products by vendors.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
