import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Plus,
  MoreVertical,
  ChevronUp,
  ChevronDown,
  Minus,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Package,
  CheckSquare,
  AlertTriangle,
  Tag,
  Clock,
  Star,
  Download,
  Upload,
  RefreshCcw,
  BookOpen,
  Pencil,
  Trash2,
  X,
  IndianRupee,
  Layers,
  Timer,
  Warehouse,
} from "lucide-react";
import { getVendorProducts, removeVendorProduct, updateVendorProduct, VendorProduct } from "@/lib/vendorStore";

const STATS = [
  { icon: <Package className="w-5 h-5 text-blue-500" />, label: "Total Products", value: "128", sub: "All Products", bg: "bg-blue-50" },
  { icon: <CheckSquare className="w-5 h-5 text-green-500" />, label: "Active Products", value: "120", sub: "93.75% of total", bg: "bg-green-50" },
  { icon: <AlertTriangle className="w-5 h-5 text-orange-400" />, label: "Out of Stock", value: "5", sub: "3.91% of total", bg: "bg-orange-50" },
  { icon: <Tag className="w-5 h-5 text-cyan-500" />, label: "Price Updates", value: "23", sub: "This Month", bg: "bg-cyan-50" },
  { icon: <Clock className="w-5 h-5 text-blue-400" />, label: "Avg. Lead Time", value: "4 Days", sub: "Across all products", bg: "bg-blue-50" },
  { icon: <Star className="w-5 h-5 text-red-400" />, label: "Preferred Products", value: "84", sub: "65.63% of total", bg: "bg-red-50" },
];

type PriceChange = "up" | "down" | "neutral";
type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";

interface Product {
  image: string;
  vendorSku: string;
  name: string;
  spec: string;
  masterSku: string;
  category: string;
  price: string;
  priceChange: string;
  priceDir: PriceChange;
  moq: number;
  leadTime: string;
  stock: number;
  stockStatus: StockStatus;
  lastUpdated: string;
  status: "Active" | "Inactive";
}

const PRODUCTS: Product[] = [
  { image: "💻", vendorSku: "DELL-LAT-5440", name: "Dell Latitude 5440 Laptop", spec: "Intel i5, 16GB RAM, 512GB SSD, 14\" FHD", masterSku: "LT-1001", category: "Laptops", price: "₹52,000.00", priceChange: "2.80%", priceDir: "down", moq: 5, leadTime: "3 Days", stock: 120, stockStatus: "In Stock", lastUpdated: "May 16, 2026", status: "Active" },
  { image: "🖥️", vendorSku: "DELL-MON-24", name: "Dell 24 Monitor - P2422H", spec: '24", FHD, IPS, 60Hz, HDMI, DP', masterSku: "MN-1005", category: "Monitors", price: "₹9,500.00", priceChange: "5.56%", priceDir: "up", moq: 10, leadTime: "2 Days", stock: 75, stockStatus: "In Stock", lastUpdated: "May 15, 2026", status: "Active" },
  { image: "⌨️", vendorSku: "DELL-KB-01", name: "Dell Wired Keyboard", spec: "USB, Black", masterSku: "KB-2001", category: "Accessories", price: "₹650.00", priceChange: "0.00%", priceDir: "neutral", moq: 20, leadTime: "1 Day", stock: 250, stockStatus: "In Stock", lastUpdated: "May 16, 2026", status: "Active" },
  { image: "🖱️", vendorSku: "DELL-MSE-01", name: "Dell MS116 Mouse", spec: "Wired Optical Mouse, Black", masterSku: "MS-2001", category: "Accessories", price: "₹450.00", priceChange: "0.00%", priceDir: "neutral", moq: 20, leadTime: "1 Day", stock: 150, stockStatus: "In Stock", lastUpdated: "May 14, 2026", status: "Active" },
  { image: "🔌", vendorSku: "DELL-DOCK-WD19", name: "Dell WD19 Docking Station", spec: "USB-C, 180W, Dual Display", masterSku: "DOCK-1002", category: "Accessories", price: "₹18,750.00", priceChange: "1.32%", priceDir: "down", moq: 5, leadTime: "3 Days", stock: 45, stockStatus: "In Stock", lastUpdated: "May 13, 2026", status: "Active" },
  { image: "🔋", vendorSku: "DELL-PWR-65W", name: "Dell 65W Power Adapter", spec: "Original Adapter", masterSku: "ADP-1003", category: "Accessories", price: "₹1,550.00", priceChange: "3.33%", priceDir: "up", moq: 10, leadTime: "2 Days", stock: 60, stockStatus: "In Stock", lastUpdated: "May 10, 2026", status: "Active" },
  { image: "📡", vendorSku: "DELL-SWITCH-24P", name: "Dell 24 Port Switch", spec: "24 Port Gigabit Switch", masterSku: "NET-2001", category: "Networking", price: "₹22,000.00", priceChange: "0.00%", priceDir: "neutral", moq: 2, leadTime: "4 Days", stock: 25, stockStatus: "Low Stock", lastUpdated: "May 08, 2026", status: "Active" },
  { image: "💻", vendorSku: "DELL-LAT-3540", name: "Dell Latitude 3540 Laptop", spec: 'Intel i3, 8GB RAM, 256GB SSD, 15.6"', masterSku: "LT-1002", category: "Laptops", price: "₹36,000.00", priceChange: "1.37%", priceDir: "down", moq: 5, leadTime: "3 Days", stock: 30, stockStatus: "In Stock", lastUpdated: "May 07, 2026", status: "Active" },
];

function PriceIndicator({ dir, change }: { dir: PriceChange; change: string }) {
  if (dir === "up") return <span className="flex items-center gap-0.5 text-red-500 text-xs font-medium"><ArrowUp className="w-3 h-3" /> {change}</span>;
  if (dir === "down") return <span className="flex items-center gap-0.5 text-green-600 text-xs font-medium"><ArrowDown className="w-3 h-3" /> {change}</span>;
  return <span className="flex items-center gap-0.5 text-gray-400 text-xs font-medium"><Minus className="w-3 h-3" /> {change}</span>;
}

function StockBadge({ status, count }: { status: StockStatus; count: number }) {
  const colors: Record<StockStatus, string> = {
    "In Stock": "text-green-700 bg-green-50",
    "Low Stock": "text-orange-600 bg-orange-50",
    "Out of Stock": "text-red-600 bg-red-50",
  };
  return (
    <div className="flex flex-col items-start gap-0.5">
      <span className="font-semibold text-sm text-gray-800">{count}</span>
      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${colors[status]}`}>{status}</span>
    </div>
  );
}

const MENU_ITEMS = [
  { icon: <Plus className="w-4 h-4" />, label: "Add Product" },
  { icon: <Tag className="w-4 h-4" />, label: "Bulk Price Update" },
  { icon: <Upload className="w-4 h-4" />, label: "Import Products" },
  { icon: <Download className="w-4 h-4" />, label: "Export Catalog" },
  { icon: <RefreshCcw className="w-4 h-4" />, label: "Sync Vendor Feed" },
  { icon: <BookOpen className="w-4 h-4" />, label: "Assign to Master Catalog" },
];

// ── Edit Product Screen ────────────────────────────────────────────────────────

function EditProductScreen({
  product,
  onClose,
  onSave,
}: {
  product: VendorProduct;
  onClose: () => void;
  onSave: (updates: Pick<VendorProduct, "price" | "moq" | "leadTime" | "stock">) => void;
}) {
  const [price, setPrice] = useState(product.price || "");
  const [moq, setMoq] = useState(product.moq || "");
  const [leadTime, setLeadTime] = useState(product.leadTime || "");
  const [stock, setStock] = useState(product.stock || "");

  const initials = product.productName.slice(0, 2).toUpperCase();

  const handleSave = () => {
    onSave({ price: price.trim(), moq: moq.trim(), leadTime: leadTime.trim(), stock: stock.trim() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-2 py-2 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900">Edit Product</h2>
            <p className="text-xs text-gray-400 truncate">{product.productName}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xlpx-2 py-2 flex gap-8">

          {/* Left: Product card (read-only) */}
          <div className="w-64 shrink-0">
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <div className="w-full aspect-square bg-gray-50 flex items-center justify-center">
                {product.images && product.images.length > 0 ? (
                  <img src={product.images[0]} alt={product.productName} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 text-2xl font-bold border border-blue-200">
                    {initials}
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-gray-100 space-y-2">
                <h3 className="font-semibold text-gray-900 text-sm leading-snug">{product.productName}</h3>
                <p className="text-xs text-gray-500">{product.category}</p>
                <div className="space-y-1.5 text-xs text-gray-600 pt-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">MPI Code</span>
                    <span className="font-mono">{product.masterProductCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">SKU</span>
                    <span className="font-mono">{product.skuCode || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Brand</span>
                    <span>{product.brand || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status</span>
                    <span className={`font-medium ${product.status === "Active" ? "text-green-600" : "text-gray-400"}`}>{product.status}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Editable fields */}
          <div className="flex-1 min-w-0">
            <div className="border border-gray-200 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-1">Pricing &amp; Inventory</h3>
              <p className="text-sm text-gray-400 mb-6">Update the purchase price, minimum order quantity, lead time, and current stock for this product.</p>

              <div className="grid grid-cols-2 gap-6">
                {/* Purchase Price */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Purchase Price
                  </label>
                  <p className="text-xs text-gray-400 mb-2">Vendor purchase price (excl. GST)</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <IndianRupee className="w-4 h-4" />
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="e.g. 52000"
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900"
                    />
                  </div>
                </div>

                {/* MOQ */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Minimum Order Quantity (MOQ)
                  </label>
                  <p className="text-xs text-gray-400 mb-2">Minimum units per order</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Layers className="w-4 h-4" />
                    </span>
                    <input
                      type="number"
                      min="1"
                      value={moq}
                      onChange={(e) => setMoq(e.target.value)}
                      placeholder="e.g. 5"
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900"
                    />
                  </div>
                </div>

                {/* Lead Time */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Lead Time (days)
                  </label>
                  <p className="text-xs text-gray-400 mb-2">Days from order to delivery</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Timer className="w-4 h-4" />
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={leadTime}
                      onChange={(e) => setLeadTime(e.target.value)}
                      placeholder="e.g. 3"
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900"
                    />
                  </div>
                </div>

                {/* Stock */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Stock
                  </label>
                  <p className="text-xs text-gray-400 mb-2">Current units available</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <Warehouse className="w-4 h-4" />
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      placeholder="e.g. 120"
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-2 py-2 border-t border-gray-200 bg-white flex items-center justify-end gap-3">
        <button
          onClick={onClose}
          className="px-5 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}

// ── Confirm Remove Dialog ──────────────────────────────────────────────────────

function ConfirmRemoveDialog({
  product,
  onCancel,
  onConfirm,
}: {
  product: VendorProduct;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-2 py-2 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <Trash2 className="w-4 h-4 text-red-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Remove Product</h3>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl mb-4">
            {product.images && product.images.length > 0 ? (
              <img src={product.images[0]} alt={product.productName} className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0" />
            ) : (
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 text-xs font-bold border border-blue-200 shrink-0">
                {product.productName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">{product.productName}</p>
              <p className="text-xs text-gray-400 font-mono">{product.masterProductCode}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Are you sure you want to remove this product from the vendor list? This action cannot be undone.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-2 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            Remove Product
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VendorProductsPage() {
  const { id: vendorId = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openRowMenu, setOpenRowMenu] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [vendorProducts, setVendorProducts] = useState<VendorProduct[]>([]);
  const [editProduct, setEditProduct] = useState<VendorProduct | null>(null);
  const [removeProduct, setRemoveProduct] = useState<VendorProduct | null>(null);
  const perPage = 10;
  const menuRef = useRef<HTMLDivElement>(null);

  // Load vendor products from store
  useEffect(() => {
    if (vendorId) setVendorProducts(getVendorProducts(vendorId));
  }, [vendorId]);

  useEffect(() => {
    const handler = () => { if (vendorId) setVendorProducts(getVendorProducts(vendorId)); };
    window.addEventListener("vendorProductsUpdated", handler);
    return () => window.removeEventListener("vendorProductsUpdated", handler);
  }, [vendorId]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      setOpenRowMenu(null);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSaveEdit = (id: string, updates: Pick<VendorProduct, "price" | "moq" | "leadTime" | "stock">) => {
    updateVendorProduct(vendorId, id, updates);
    setVendorProducts((prev) => prev.map((p) => p.id === id ? { ...p, ...updates } : p));
  };

  const handleConfirmRemove = (id: string) => {
    removeVendorProduct(vendorId, id);
    setVendorProducts((prev) => prev.filter((p) => p.id !== id));
    setRemoveProduct(null);
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      {editProduct && (
        <EditProductScreen
          product={editProduct}
          onClose={() => setEditProduct(null)}
          onSave={(updates) => handleSaveEdit(editProduct.id, updates)}
        />
      )}
      {removeProduct && (
        <ConfirmRemoveDialog
          product={removeProduct}
          onCancel={() => setRemoveProduct(null)}
          onConfirm={() => handleConfirmRemove(removeProduct.id)}
        />
      )}
      <div className="max-w-[1200px]px-2 py-2 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {STATS.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-2 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>{stat.icon}</div>
              <p className="text-xs text-gray-500 font-medium mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {/* Actions Bar */}
          <div className="px-4 py-2 flex items-center justify-end border-b border-gray-100">
            <div className="relative" ref={menuRef}>
              <button onClick={() => setMenuOpen((o) => !o)} className="p-2 border border-gray-200 rounded-md text-gray-500 hover:bg-gray-50 transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                  {MENU_ITEMS.map((item, i) => (
                    <div key={item.label}>
                      {i === 1 && <div className="my-1 border-t border-gray-100" />}
                      <button
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                        onClick={() => {
                          setMenuOpen(false);
                          if (item.label === "Add Product") navigate(`/vendors/${vendorId}/add-products`);
                        }}
                      >
                        <span className="text-gray-400">{item.icon}</span>
                        {item.label}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          {vendorProducts.length === 0 ? (
            <div className="px-4 py-16 text-center text-gray-400 text-sm">
              No products assigned to this vendor yet.{" "}
              <button
                onClick={() => navigate(`/vendors/${vendorId}/add-products`)}
                className="text-blue-600 hover:underline font-medium"
              >
                Add products from master catalog
              </button>
            </div>
          ) : (
          <div className="overflow-x-visible">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-2 py-2 text-sm font-bold text-gray-700 uppercase tracking-wide whitespace-nowrap">VPC</th>
                  <th className="text-left px-2 py-2 text-sm font-bold text-gray-700 uppercase tracking-wide">MPI</th>
                  <th className="text-left px-2 py-2 text-sm font-bold text-gray-700 uppercase tracking-wide">Product Name</th>
                  <th className="text-left px-2 py-2 text-sm font-bold text-gray-700 uppercase tracking-wide">Category</th>
                  <th className="text-left px-2 py-2 text-sm font-bold text-gray-700 uppercase tracking-wide whitespace-nowrap">Purchase Price</th>
                  <th className="text-left px-2 py-2 text-sm font-bold text-gray-700 uppercase tracking-wide">MOQ</th>
                  <th className="text-left px-2 py-2 text-sm font-bold text-gray-700 uppercase tracking-wide whitespace-nowrap">Lead Time</th>
                  <th className="text-left px-2 py-2 text-sm font-bold text-gray-700 uppercase tracking-wide">
                    <span className="flex items-center gap-1 cursor-pointer hover:text-gray-900">Stock <span className="flex flex-col"><ChevronUp className="w-3 h-3 -mb-1" /><ChevronDown className="w-3 h-3" /></span></span>
                  </th>
                  <th className="text-left px-2 py-2 text-sm font-bold text-gray-700 uppercase tracking-wide whitespace-nowrap">
                    <span className="flex items-center gap-1 cursor-pointer hover:text-gray-900">Added On <span className="flex flex-col"><ChevronUp className="w-3 h-3 -mb-1" /><ChevronDown className="w-3 h-3" /></span></span>
                  </th>
                  <th className="text-left px-2 py-2 text-sm font-bold text-gray-700 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {vendorProducts.slice((currentPage - 1) * perPage, currentPage * perPage).map((product) => {
                  const initials = product.productName.slice(0, 2).toUpperCase();
                  return (
                    <tr key={product.id} className="hover:bg-gray-50/70 transition-colors group">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-gray-600 text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{product.vendorProductCode || "—"}</span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="text-gray-600 text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{product.masterProductCode}</span>
                      </td>
                      <td className="px-4 py-3.5 max-w-[220px]">
                        <div className="flex items-center gap-2.5">
                          {product.images && product.images.length > 0 ? (
                            <img src={product.images[0]} alt={product.productName} className="w-8 h-8 rounded-md object-cover border border-gray-200 flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0 border border-blue-200">{initials}</div>
                          )}
                          <div>
                            <div className="font-medium text-gray-800 text-sm leading-tight">{product.productName}</div>
                            <div className="text-xs text-gray-400 mt-0.5 font-mono">{product.skuCode || "—"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-gray-600 text-sm">{product.category || "—"}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-gray-800 text-sm">
                          {product.price ? `₹${parseFloat(product.price).toLocaleString("en-IN")}` : "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-gray-600 text-sm">{product.moq || "—"}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-gray-600 text-sm">
                        {product.leadTime ? `${product.leadTime} day${product.leadTime !== "1" ? "s" : ""}` : "—"}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {product.stock ? (
                          <StockBadge
                            status={parseInt(product.stock) > 10 ? "In Stock" : parseInt(product.stock) > 0 ? "Low Stock" : "Out of Stock"}
                            count={parseInt(product.stock)}
                          />
                        ) : <span className="text-gray-400 text-sm">—</span>}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-gray-500 text-sm">{product.addedAt}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="relative inline-block">
                          <button
                            onMouseDown={(e) => { e.stopPropagation(); }}
                            onClick={(e) => { e.stopPropagation(); setOpenRowMenu(openRowMenu === product.id ? null : product.id); }}
                            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openRowMenu === product.id && (
                            <div
                              className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1"
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <button
                                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                                onClick={() => { setOpenRowMenu(null); setEditProduct(product); }}
                              >
                                <Pencil className="w-4 h-4 text-gray-400" /> Edit Product
                              </button>
                              <button
                                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                                onClick={() => { setOpenRowMenu(null); setRemoveProduct(product); }}
                              >
                                <Trash2 className="w-4 h-4 text-red-400" /> Remove Product
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}

          {/* Pagination */}
          {vendorProducts.length > 0 && (
          <div className="px-4 py-3.5 flex items-center justify-between border-t border-gray-100">
            <span className="text-sm text-gray-500">
              Showing {Math.min((currentPage - 1) * perPage + 1, vendorProducts.length)}–{Math.min(currentPage * perPage, vendorProducts.length)} of {vendorProducts.length} product{vendorProducts.length !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.ceil(vendorProducts.length / perPage) }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setCurrentPage(p)} className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${currentPage === p ? "bg-blue-600 text-white shadow-sm" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{p}</button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(Math.ceil(vendorProducts.length / perPage), p + 1))}
                disabled={currentPage >= Math.ceil(vendorProducts.length / perPage)}
                className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="ml-2 flex items-center gap-1.5 text-sm text-gray-500">10 / page <ChevronDown className="w-3.5 h-3.5 text-gray-400" /></div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
