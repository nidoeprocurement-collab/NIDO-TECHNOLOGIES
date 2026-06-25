import { useState } from "react";
import { Filter, MoreVertical, X, Plus, Edit2, Trash2, Search } from "lucide-react";

// Sample vendor products data
const vendorProductsData = [
  {
    id: "PROD-001",
    name: "Enterprise Server Rack",
    sku: "SRV-001",
    category: "Hardware",
    subcategory: "Servers",
    price: "₹2,50,000",
    stock: 45,
    status: "Active",
    lastUpdated: "2024-06-20",
    image: "📦",
  },
  {
    id: "PROD-002",
    name: "Network Switch 48 Port",
    sku: "NSW-048",
    category: "Networking",
    subcategory: "Switches",
    price: "₹1,75,000",
    stock: 12,
    status: "Active",
    lastUpdated: "2024-06-18",
    image: "🔌",
  },
  {
    id: "PROD-003",
    name: "Database License Pack",
    sku: "DBL-100",
    category: "Software",
    subcategory: "Licenses",
    price: "₹5,00,000",
    stock: 0,
    status: "Out of Stock",
    lastUpdated: "2024-06-15",
    image: "💾",
  },
  {
    id: "PROD-004",
    name: "Cloud Storage 1TB",
    sku: "CLD-001",
    category: "Services",
    subcategory: "Cloud",
    price: "₹12,000/mo",
    stock: 999,
    status: "Active",
    lastUpdated: "2024-06-22",
    image: "☁️",
  },
  {
    id: "PROD-005",
    name: "IT Support Contract",
    sku: "SUP-YR1",
    category: "Services",
    subcategory: "Support",
    price: "₹8,50,000",
    stock: 50,
    status: "Active",
    lastUpdated: "2024-06-21",
    image: "🛠️",
  },
  {
    id: "PROD-006",
    name: "Backup System",
    sku: "BAK-500",
    category: "Hardware",
    subcategory: "Storage",
    price: "₹4,25,000",
    stock: 8,
    status: "Active",
    lastUpdated: "2024-06-19",
    image: "💿",
  },
];

function ProductStatusBadge({ status }: { status: string }) {
  if (status === "Active") {
    return (
      <span className="inline-flex items-center text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full">
        Active
      </span>
    );
  }
  if (status === "Out of Stock") {
    return (
      <span className="inline-flex items-center text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-full">
        Out of Stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1 rounded-full">
      {status}
    </span>
  );
}

function AddProductModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "",
    price: "",
    stock: "",
    description: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 flex flex-col max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-base font-semibold text-gray-900">Add New Product</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={set("name")}
              placeholder="e.g. Enterprise Server"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              SKU <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.sku}
              onChange={set("sku")}
              placeholder="e.g. SRV-001"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={form.category}
              onChange={set("category")}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="">Select a category</option>
              <option value="Hardware">Hardware</option>
              <option value="Software">Software</option>
              <option value="Services">Services</option>
              <option value="Networking">Networking</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Price (₹) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.price}
              onChange={set("price")}
              placeholder="e.g. 2,50,000"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Stock <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={form.stock}
              onChange={set("stock")}
              placeholder="e.g. 45"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={set("description")}
              placeholder="Enter product description"
              rows={3}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex gap-2 justify-end border-t sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            Add Product
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VendorProductPage() {
  const [products, setProducts] = useState(vendorProductsData);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "All" || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  return (
    <div className="flex-1 flex flex-col gap-4 bg-[#f5f6fa]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products & Services</h1>
          <p className="text-sm text-gray-600 mt-1">Manage all vendor products and services</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex gap-3 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 text-sm"
          />
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
          <Filter size={16} className="text-gray-600" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-sm focus:outline-none bg-transparent"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Product Name</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">SKU</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Category</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Price</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Stock</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-700">Last Updated</th>
              <th className="px-6 py-3 text-center font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{product.image}</span>
                      <span className="font-medium text-gray-900">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-gray-600">{product.sku}</td>
                  <td className="px-6 py-3 text-gray-600">{product.category}</td>
                  <td className="px-6 py-3 font-semibold text-gray-900">{product.price}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`font-medium ${
                        product.stock > 20 ? "text-emerald-700" : product.stock > 0 ? "text-orange-700" : "text-red-700"
                      }`}
                    >
                      {product.stock} units
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <ProductStatusBadge status={product.status} />
                  </td>
                  <td className="px-6 py-3 text-gray-600 text-xs">{product.lastUpdated}</td>
                  <td className="px-6 py-3 text-center">
                    <button className="inline-flex items-center justify-center text-gray-400 hover:text-gray-600">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  <p className="text-sm">No products found matching your search criteria</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-xs text-gray-600 mb-1">Total Products</p>
          <p className="text-2xl font-bold text-gray-900">{products.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-xs text-gray-600 mb-1">Active Products</p>
          <p className="text-2xl font-bold text-emerald-700">{products.filter((p) => p.status === "Active").length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-xs text-gray-600 mb-1">Out of Stock</p>
          <p className="text-2xl font-bold text-orange-700">{products.filter((p) => p.status === "Out of Stock").length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <p className="text-xs text-gray-600 mb-1">Total Value</p>
          <p className="text-2xl font-bold text-blue-700">₹22.5Cr+</p>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && <AddProductModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
