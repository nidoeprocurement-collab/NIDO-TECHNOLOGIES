import { useState } from "react";
import { Download, Filter, MoreVertical, X } from "lucide-react";

const catalogProducts = [
  {
    productCode: "PC-DL-001",
    sku: "PRD-001",
    name: "Dell Laptop XPS 15",
    category: "Hardware",
    roles: ["Admin", "IT Manager"],
    price: "₹21,004",
    availability: "In Stock",
    img: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=40&h=40&fit=crop&auto=format",
  },
  {
    productCode: "PC-MS-002",
    sku: "PRD-002",
    name: "Microsoft Office 365",
    category: "Software",
    roles: ["IT Manager", "Finance"],
    price: "₹83,375",
    availability: "In Stock",
    img: "https://images.unsplash.com/photo-1633419461186-7d40a38105ec?w=40&h=40&fit=crop&auto=format",
  },
  {
    productCode: "PC-EO-003",
    sku: "PRD-003",
    name: "Ergonomic Office Chair",
    category: "Accessories",
    roles: ["IT Staff", "Support"],
    price: "₹1,740",
    availability: "In Stock",
    img: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=40&h=40&fit=crop&auto=format",
  },
];

const masterCatalogProducts = [
  { sku: "WH1000XM5/B", name: "Sony WH-1000XM5 Wireless Noise Canceling Headphones", brand: "Sony", category: "Audio > Headphones", catalog: "Electronics Master Catalog", price: "₹12,331", img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=60&h=60&fit=crop&auto=format" },
  { sku: "MX-KEYS-ADV", name: "Logitech MX Keys Advanced Keyboard", brand: "Logitech", category: "Peripherals > Keyboards", catalog: "Electronics Master Catalog", price: "₹8,999", img: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=60&h=60&fit=crop&auto=format" },
  { sku: "DELL-U2722D", name: "Dell UltraSharp 27 USB-C Hub Monitor", brand: "Dell", category: "Displays > Monitors", catalog: "Electronics Master Catalog", price: "₹45,000", img: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=60&h=60&fit=crop&auto=format" },
  { sku: "ERGO-CH-001", name: "Herman Miller Aeron Chair", brand: "Herman Miller", category: "Furniture > Chairs", catalog: "Office Master Catalog", price: "₹1,20,000", img: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=60&h=60&fit=crop&auto=format" },
];

const catalogRoleOptions = ["Admin", "IT Manager", "Finance", "IT Staff", "Support", "Procurement Manager", "Employee"];

type MasterProduct = typeof masterCatalogProducts[0];

function AddNewProductModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<MasterProduct[]>([]);
  const [role, setRole] = useState("");
  const [preference, setPreference] = useState("");
  const [preferences, setPreferences] = useState(["Preference 1", "Preference 2"]);
  const [prefDropdownOpen, setPrefDropdownOpen] = useState(false);
  const [addingPref, setAddingPref] = useState(false);
  const [newPrefName, setNewPrefName] = useState("");

  const filtered = masterCatalogProducts.filter((p) =>
    (p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase())) &&
    !selectedProducts.some((s) => s.sku === p.sku)
  );

  const selectProduct = (p: MasterProduct) => {
    setSelectedProducts((prev) => [...prev, p]);
    setQuery("");
    setDropdownOpen(false);
  };

  const removeProduct = (sku: string) => {
    setSelectedProducts((prev) => prev.filter((p) => p.sku !== sku));
  };

  const addNewPreference = () => {
    const name = newPrefName.trim();
    if (!name || preferences.includes(name)) return;
    setPreferences((prev) => [...prev, name]);
    setPreference(name);
    setNewPrefName("");
    setAddingPref(false);
    setPrefDropdownOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <h2 className="text-sm font-semibold text-gray-900">Add New Product</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-6" onClick={() => { setDropdownOpen(false); setPrefDropdownOpen(false); }}>
          {/* Search Product */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Search Product</p>
            <p className="text-xs text-blue-500 mb-3">Choose an item from the Master Catalog and add it to your client catalog.</p>
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setDropdownOpen(true); }}
                  onFocus={() => setDropdownOpen(true)}
                  placeholder="Search for products in Master Catalog..."
                  className="w-full pl-8 pr-10 py-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-400"
                />
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              {dropdownOpen && query && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 py-1 max-h-48 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-gray-400">No products found</p>
                  ) : filtered.map((p) => (
                    <button key={p.sku} onClick={() => selectProduct(p)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
                      <img src={p.img} alt={p.name} className="w-8 h-8 rounded object-cover bg-gray-100 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-800">{p.name}</p>
                        <p className="text-[10px] text-gray-400">{p.sku} · {p.category}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected Products list */}
          {selectedProducts.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-3">Selected Product{selectedProducts.length > 1 ? "s" : ""}</p>
              <div className="flex flex-col gap-3">
                {selectedProducts.map((prod) => (
                  <div key={prod.sku} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <img src={prod.img} alt={prod.name} className="w-14 h-14 rounded-lg object-cover bg-gray-100 shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900 mb-1">{prod.name}</p>
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded-full">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> Selected
                          </span>
                          <div className="grid grid-cols-2 gap-x-12 gap-y-2 mt-2">
                            <div>
                              <p className="text-[10px] text-gray-400">SKU</p>
                              <p className="text-xs text-gray-700">{prod.sku}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-blue-500">Brand</p>
                              <p className="text-xs text-blue-500">{prod.brand}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400">Category</p>
                              <p className="text-xs text-blue-500">{prod.category}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-blue-500">Master Catalog</p>
                              <p className="text-xs text-blue-500">{prod.catalog}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => removeProduct(prod.sku)} className="text-xs text-red-500 hover:text-red-700 transition-colors font-medium shrink-0">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Product Details */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-4">Product Details</p>
            <div className="flex flex-col gap-4">
              {/* Roles */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Roles <span className="text-red-400">*</span></label>
                <div className="relative">
                  <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3 py-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 appearance-none text-gray-500 bg-white">
                    <option value="">Select role</option>
                    {catalogRoleOptions.map((r) => <option key={r}>{r}</option>)}
                  </select>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                <p className="text-[10px] text-blue-500 mt-1">Choose the role this product will be available for.</p>
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Price (₹) <span className="text-red-400">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₹</span>
                  <input
                    type="text"
                    value={selectedProducts.length === 1 ? selectedProducts[0].price.replace("₹", "") : selectedProducts.length > 1 ? "Multiple" : ""}
                    readOnly
                    placeholder="—"
                    className="w-full pl-7 pr-4 py-2.5 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-700 placeholder-gray-300 cursor-not-allowed select-none"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Price from Master Catalog (read-only).</p>
              </div>

              {/* Preferences — custom dropdown with Add new option */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <label className="block text-xs font-medium text-gray-700 mb-1">Preferences <span className="text-red-400">*</span></label>
                <button
                  type="button"
                  onClick={() => { setPrefDropdownOpen((v) => !v); setAddingPref(false); }}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white text-left"
                >
                  <span className={preference ? "text-gray-700" : "text-gray-400"}>{preference || "Select preference"}</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 shrink-0"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                {prefDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 py-1">
                    {preferences.map((p) => (
                      <button key={p} onClick={() => { setPreference(p); setPrefDropdownOpen(false); }} className={`w-full text-left px-4 py-2 text-xs hover:bg-gray-50 transition-colors ${preference === p ? "text-blue-600 font-medium" : "text-gray-700"}`}>
                        {p}
                      </button>
                    ))}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      {addingPref ? (
                        <div className="px-3 py-2 flex items-center gap-2">
                          <input
                            type="text"
                            autoFocus
                            value={newPrefName}
                            onChange={(e) => setNewPrefName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addNewPreference()}
                            placeholder="Preference name..."
                            className="flex-1 px-2 py-1 text-xs border border-blue-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                          <button onClick={addNewPreference} className="px-2 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Add</button>
                          <button onClick={() => { setAddingPref(false); setNewPrefName(""); }} className="px-2 py-1 text-xs border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setAddingPref(true)} className="w-full text-left px-4 py-2 text-xs text-blue-500 hover:bg-blue-50 transition-colors font-medium flex items-center gap-1.5">
                          <span className="text-sm leading-none">+</span> Add new preference
                        </button>
                      )}
                    </div>
                  </div>
                )}
                <p className="text-[10px] text-blue-500 mt-1">Choose a preference for this product.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">Add Product</button>
        </div>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  const [search, setSearch] = useState("");
  const [rowMenu, setRowMenu] = useState<string | null>(null);
  const [headerMenu, setHeaderMenu] = useState(false);
  const [page, setPage] = useState(1);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [products, setProducts] = useState(catalogProducts.map((p) => ({ ...p, roles: [...p.roles] })));

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const totalItems = products.length;
  const inStock = products.filter((p) => p.availability === "In Stock").length;
  const lowStock = products.filter((p) => p.availability === "Low Stock").length;
  const outOfStock = products.filter((p) => p.availability === "Out of Stock").length;

  const removeRole = (sku: string, role: string) => {
    setProducts((prev) =>
      prev.map((p) => p.sku === sku ? { ...p, roles: p.roles.filter((r) => r !== role) } : p)
    );
  };

  return (
    <div className="p-5 flex flex-col gap-4" onClick={() => { setRowMenu(null); setHeaderMenu(false); }}>
      {showAddProduct && <AddNewProductModal onClose={() => setShowAddProduct(false)} />}
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="border border-gray-200 rounded-xl px-4 py-3 bg-white">
          <p className="text-xs text-gray-500 mb-1">Total Items</p>
          <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
        </div>
        <div className="border border-gray-200 rounded-xl px-4 py-3 bg-white">
          <p className="text-xs text-gray-500 mb-1">In Stock</p>
          <p className="text-2xl font-bold text-green-500">{inStock}</p>
        </div>
        <div className="border border-gray-200 rounded-xl px-4 py-3 bg-white">
          <p className="text-xs text-gray-500 mb-1">Low Stock</p>
          <p className="text-2xl font-bold text-orange-400">{lowStock}</p>
        </div>
        <div className="border border-gray-200 rounded-xl px-4 py-3 bg-white">
          <p className="text-xs text-gray-500 mb-1">Out of Stock</p>
          <p className="text-2xl font-bold text-red-500">{outOfStock}</p>
        </div>
      </div>

      {/* Catalog table card */}
      <div className="border border-gray-200 rounded-xl bg-white flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Client Catalog</h2>
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setHeaderMenu((v) => !v); }}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <MoreVertical size={16} />
            </button>
            {headerMenu && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20 w-44" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => { setShowAddProduct(true); setHeaderMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                  <span className="text-gray-400"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></span>
                  Add New Product
                </button>
                <button onClick={() => setHeaderMenu(false)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                  <Download size={13} className="text-gray-400" /> Export
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name, SKU, brand..."
              className="w-full pl-8 pr-4 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder-gray-400 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px] w-28">Product ID</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px] w-24">SKU Code</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Product</th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px] w-28">Category <Filter size={9} className="inline ml-0.5 text-gray-400" /></th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Roles <Filter size={9} className="inline ml-0.5 text-gray-400" /></th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px] w-36">Selling Price (INR) <Filter size={9} className="inline ml-0.5 text-gray-400" /></th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px] w-28">Availability <Filter size={9} className="inline ml-0.5 text-gray-400" /></th>
                <th className="text-left px-4 py-2.5 font-semibold text-gray-500 uppercase tracking-wide text-[10px] w-16">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product, i) => (
                <tr key={product.sku} className={`border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/20"}`}>
                  <td className="px-4 py-3 text-gray-500 font-mono text-[10px]">{product.productCode}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-[10px]">{product.sku}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img src={product.img} alt={product.name} className="w-8 h-8 rounded object-cover bg-gray-100 shrink-0" />
                      <span className="font-medium text-gray-800 text-[11px]">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{product.category}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {product.roles.map((role) => (
                        <span key={role} className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">
                          {role}
                          <button onClick={(e) => { e.stopPropagation(); removeRole(product.sku, role); }} className="text-blue-400 hover:text-blue-700 leading-none">×</button>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{product.price}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                      product.availability === "In Stock" ? "bg-green-50 text-green-700 border-green-200"
                      : product.availability === "Low Stock" ? "bg-orange-50 text-orange-600 border-orange-200"
                      : "bg-red-50 text-red-500 border-red-200"
                    }`}>
                      {product.availability}
                    </span>
                  </td>
                  <td className="px-4 py-3 relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); setRowMenu(rowMenu === product.sku ? null : product.sku); }}
                      className="p-1 rounded hover:bg-gray-100 text-gray-400 transition-colors"
                    >
                      <MoreVertical size={13} />
                    </button>
                    {rowMenu === product.sku && (
                      <div className="absolute right-8 top-2 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-20 w-44" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setRowMenu(null)} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors text-gray-700">View Product</button>
                        <button onClick={() => setRowMenu(null)} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors text-gray-700">Edit Roles & Preferences</button>
                        <div className="my-1 border-t border-gray-100" />
                        <button onClick={() => { setProducts((prev) => prev.filter((p) => p.sku !== product.sku)); setRowMenu(null); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors text-red-500">Remove Product</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-xs text-gray-400">No products match your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-[11px] text-gray-500">Showing 1 to {filtered.length} of {filtered.length} products</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs transition-colors disabled:opacity-40">–</button>
            <span className="w-7 h-7 flex items-center justify-center rounded bg-blue-600 text-white text-xs font-semibold">{page}</span>
            <button onClick={() => setPage((p) => p + 1)} className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs transition-colors">+</button>
          </div>
        </div>
      </div>
    </div>
  );
}
