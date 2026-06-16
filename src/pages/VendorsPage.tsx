import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, MoreVertical, Download, Upload, Eye, Trash2, Edit2, FileDown, FileUp, LogIn } from "lucide-react";

const MOCK_VENDORS = [
  {
    id: "vnd_001",
    vendor_code: "VND-001",
    company_name: "Tech Solutions Ltd",
    category: "IT Hardware",
    contact_person: "John Doe",
    email: "john@techsolutions.com",
    phone: "+1-555-0100",
    status: "active",
    rating: 4.5,
    created_at: "2024-01-15",
  },
  {
    id: "vnd_002",
    vendor_code: "VND-002",
    company_name: "Global Supplies Inc",
    category: "Office Supplies",
    contact_person: "Sarah Smith",
    email: "sarah@globalsupplies.com",
    phone: "+1-555-0200",
    status: "active",
    rating: 4.0,
    created_at: "2024-01-20",
  },
  {
    id: "vnd_003",
    vendor_code: "VND-003",
    company_name: "Equipment Rentals Co",
    category: "Equipment",
    contact_person: "Mike Johnson",
    email: "mike@equipmentrentals.com",
    phone: "+1-555-0300",
    status: "pending",
    rating: 3.5,
    created_at: "2024-02-01",
  },
];

export default function VendorsPage() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState(MOCK_VENDORS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "IT Hardware",
    contactPerson: "",
    contactEmail: "",
    phone: "",
  });

  const filteredVendors = vendors.filter((v) => {
    const matchSearch =
      v.company_name.toLowerCase().includes(search.toLowerCase()) ||
      v.email.toLowerCase().includes(search.toLowerCase()) ||
      v.vendor_code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: vendors.length,
    active: vendors.filter((v) => v.status === "active").length,
    pending: vendors.filter((v) => v.status === "pending").length,
  };

  const handleCreate = () => {
    if (!form.name || !form.contactEmail) {
      console.log("[v0] Please fill in required fields");
      return;
    }
    const newVendor = {
      id: `vnd_${Date.now()}`,
      vendor_code: `VND-${String(vendors.length + 1).padStart(3, "0")}`,
      company_name: form.name,
      category: form.category,
      contact_person: form.contactPerson,
      email: form.contactEmail,
      phone: form.phone,
      status: "pending",
      rating: 0,
      created_at: new Date().toISOString().split("T")[0],
    };
    setVendors([...vendors, newVendor]);
    console.log("[v0] Vendor created successfully");
    setShowCreate(false);
    resetForm();
  };

  const handleSaveEdit = () => {
    if (!editingId || !form.name || !form.contactEmail) {
      console.log("[v0] Please fill in required fields");
      return;
    }
    setVendors(
      vendors.map((v) =>
        v.id === editingId
          ? {
              ...v,
              company_name: form.name,
              category: form.category,
              contact_person: form.contactPerson,
              email: form.contactEmail,
              phone: form.phone,
            }
          : v
      )
    );
    console.log("[v0] Vendor updated successfully");
    setShowEdit(false);
    setEditingId(null);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this vendor?")) {
      setVendors(vendors.filter((v) => v.id !== id));
      console.log("[v0] Vendor deleted successfully");
    }
  };

  const handleEditOpen = (vendor: any) => {
    setEditingId(vendor.id);
    setForm({
      name: vendor.company_name,
      category: vendor.category,
      contactPerson: vendor.contact_person,
      contactEmail: vendor.email,
      phone: vendor.phone,
    });
    setShowEdit(true);
  };

  const resetForm = () => {
    setForm({
      name: "",
      category: "IT Hardware",
      contactPerson: "",
      contactEmail: "",
      phone: "",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Configuration / Vendor Management</p>
            <h1 className="text-2xl font-bold">Vendor Management</h1>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center gap-2 text-sm font-medium">
              <FileDown size={18} />
              Export CSV
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center gap-2 text-sm font-medium">
              <FileUp size={18} />
              Template
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center gap-2 text-sm font-medium">
              <Upload size={18} />
              Bulk Import
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center gap-2 text-sm font-medium">
              <LogIn size={18} />
              Onboard
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowCreate(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm font-medium"
            >
              <Plus size={18} />
              Add Vendor
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filter */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search vendors..."
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
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">
                    VENDOR ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">
                    VENDOR
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">
                    CATEGORY
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">
                    CONTACT
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">
                    RATING
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">
                    ORDERS
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">
                    TOTAL SPEND
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600">
                    STATUS
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                      No vendors found
                    </td>
                  </tr>
                ) : (
                  filteredVendors.map((vendor) => (
                    <tr key={vendor.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-blue-600">
                        {vendor.vendor_code}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {vendor.company_name}
                      </td>
                      <td className="px-6 py-4 text-sm">{vendor.category}</td>
                      <td className="px-6 py-4 text-sm">
                        {vendor.email}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="text-yellow-500">★</span> {vendor.rating}
                      </td>
                      <td className="px-6 py-4 text-sm">0</td>
                      <td className="px-6 py-4 text-sm">$0</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            vendor.status
                          )}`}
                        >
                          {vendor.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button className="p-2 hover:bg-gray-200 rounded">
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={() => handleEditOpen(vendor)}
                            className="p-2 hover:bg-gray-200 rounded">
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(vendor.id)}
                            className="p-2 hover:bg-gray-200 rounded text-red-600">
                            <Trash2 size={16} />
                          </button>
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

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Add New Vendor</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option>IT Hardware</option>
                  <option>Office Supplies</option>
                  <option>Equipment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={form.contactPerson}
                  onChange={(e) =>
                    setForm({ ...form, contactPerson: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) =>
                    setForm({ ...form, contactEmail: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowCreate(false);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Vendor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Edit Vendor</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option>IT Hardware</option>
                  <option>Office Supplies</option>
                  <option>Equipment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={form.contactPerson}
                  onChange={(e) =>
                    setForm({ ...form, contactPerson: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) =>
                    setForm({ ...form, contactEmail: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => {
                  setShowEdit(false);
                  setEditingId(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
