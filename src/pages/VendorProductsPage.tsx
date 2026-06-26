import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";

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

export default function VendorProductsPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openRowMenu, setOpenRowMenu] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      setOpenRowMenu(null);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-[1200px] mx-auto px-4 py-6 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {STATS.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
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
          <div className="px-4 py-3 flex items-center justify-end border-b border-gray-100">
            <div className="relative" ref={menuRef}>
              <button onClick={() => setMenuOpen((o) => !o)} className="p-2 border border-gray-200 rounded-md text-gray-500 hover:bg-gray-50 transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                  {MENU_ITEMS.map((item, i) => (
                    <div key={item.label}>
                      {i === 1 && <div className="my-1 border-t border-gray-100" />}
                      <button className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left" onClick={() => setMenuOpen(false)}>
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-4 py-3 text-sm font-bold text-gray-700 uppercase tracking-wide whitespace-nowrap">
                    <span className="flex items-center gap-1 cursor-pointer hover:text-gray-900">VPI <span className="flex flex-col"><ChevronUp className="w-3 h-3 -mb-1" /><ChevronDown className="w-3 h-3" /></span></span>
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-bold text-gray-700 uppercase tracking-wide">MPI</th>
                  <th className="text-left px-4 py-3 text-sm font-bold text-gray-700 uppercase tracking-wide">Product Name</th>
                  <th className="text-left px-4 py-3 text-sm font-bold text-gray-700 uppercase tracking-wide">Category</th>
                  <th className="text-left px-4 py-3 text-sm font-bold text-gray-700 uppercase tracking-wide whitespace-nowrap">Purchase Price</th>
                  <th className="text-left px-4 py-3 text-sm font-bold text-gray-700 uppercase tracking-wide">MOQ</th>
                  <th className="text-left px-4 py-3 text-sm font-bold text-gray-700 uppercase tracking-wide whitespace-nowrap">Lead Time</th>
                  <th className="text-left px-4 py-3 text-sm font-bold text-gray-700 uppercase tracking-wide">
                    <span className="flex items-center gap-1 cursor-pointer hover:text-gray-900">Stock <span className="flex flex-col"><ChevronUp className="w-3 h-3 -mb-1" /><ChevronDown className="w-3 h-3" /></span></span>
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-bold text-gray-700 uppercase tracking-wide whitespace-nowrap">
                    <span className="flex items-center gap-1 cursor-pointer hover:text-gray-900">Last Updated <span className="flex flex-col"><ChevronUp className="w-3 h-3 -mb-1" /><ChevronDown className="w-3 h-3" /></span></span>
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-bold text-gray-700 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {PRODUCTS.map((product) => (
                  <tr key={product.vendorSku} className="hover:bg-gray-50/70 transition-colors group">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center text-base flex-shrink-0 border border-gray-200">{product.image}</div>
                        <span className="text-blue-600 font-medium text-xs hover:underline cursor-pointer">{product.vendorSku}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-gray-600 text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{product.masterSku}</span>
                    </td>
                    <td className="px-4 py-3.5 max-w-[200px]">
                      <div className="font-medium text-gray-800 text-sm leading-tight">{product.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5 leading-tight">{product.spec}</div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-gray-600 text-sm">{product.category}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-gray-800 text-sm">{product.price}</div>
                      <PriceIndicator dir={product.priceDir} change={product.priceChange} />
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-gray-600 text-sm">{product.moq}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-gray-600 text-sm">{product.leadTime}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap"><StockBadge status={product.stockStatus} count={product.stock} /></td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-gray-500 text-sm">{product.lastUpdated}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="relative inline-block">
                        <button onClick={(e) => { e.stopPropagation(); setOpenRowMenu(openRowMenu === product.vendorSku ? null : product.vendorSku); }} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openRowMenu === product.vendorSku && (
                          <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                            <button className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left" onClick={() => setOpenRowMenu(null)}>
                              <Pencil className="w-4 h-4 text-gray-400" /> Edit Product
                            </button>
                            <button className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left" onClick={() => setOpenRowMenu(null)}>
                              <Trash2 className="w-4 h-4 text-red-400" /> Remove Product
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3.5 flex items-center justify-between border-t border-gray-100">
            <span className="text-sm text-gray-500">Showing 1 to {Math.min(perPage, PRODUCTS.length)} of 128 products</span>
            <div className="flex items-center gap-1.5">
              <button className="p-1.5 rounded-md border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              {[1, 2, 3].map((p) => (
                <button key={p} onClick={() => setCurrentPage(p)} className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${currentPage === p ? "bg-blue-600 text-white shadow-sm" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{p}</button>
              ))}
              <span className="text-gray-400 text-sm">...</span>
              <button onClick={() => setCurrentPage(16)} className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${currentPage === 16 ? "bg-blue-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>16</button>
              <button className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"><ChevronRight className="w-4 h-4" /></button>
              <div className="ml-2 flex items-center gap-1.5 text-sm text-gray-500">10 / page <ChevronDown className="w-3.5 h-3.5 text-gray-400" /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
