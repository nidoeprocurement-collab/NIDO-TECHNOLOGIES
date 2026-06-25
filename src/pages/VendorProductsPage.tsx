import { useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  Filter,
  Eye,
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
} from "lucide-react";

const TABS = [
  "Overview",
  "Products (128)",
  "Orders (156)",
  "Performance",
  "Contracts (3)",
  "Documents (24)",
  "Payments",
  "Notes & Activity",
];

const STATS = [
  {
    icon: <Package className="w-5 h-5 text-blue-500" />,
    label: "Total Products",
    value: "128",
    sub: "All Products",
    bg: "bg-blue-50",
  },
  {
    icon: <CheckSquare className="w-5 h-5 text-green-500" />,
    label: "Active Products",
    value: "120",
    sub: "93.75% of total",
    bg: "bg-green-50",
  },
  {
    icon: <AlertTriangle className="w-5 h-5 text-orange-400" />,
    label: "Out of Stock",
    value: "5",
    sub: "3.91% of total",
    bg: "bg-orange-50",
  },
  {
    icon: <Tag className="w-5 h-5 text-cyan-500" />,
    label: "Price Updates",
    value: "23",
    sub: "This Month",
    bg: "bg-cyan-50",
  },
  {
    icon: <Clock className="w-5 h-5 text-blue-400" />,
    label: "Avg. Lead Time",
    value: "4 Days",
    sub: "Across all products",
    bg: "bg-blue-50",
  },
  {
    icon: <Star className="w-5 h-5 text-red-400" />,
    label: "Preferred Products",
    value: "84",
    sub: "65.63% of total",
    bg: "bg-red-50",
  },
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
  {
    image: "💻",
    vendorSku: "DELL-LAT-5440",
    name: "Dell Latitude 5440 Laptop",
    spec: "Intel i5, 16GB RAM, 512GB SSD, 14\" FHD",
    masterSku: "LT-1001",
    category: "Laptops",
    price: "₹52,000.00",
    priceChange: "2.80%",
    priceDir: "down",
    moq: 5,
    leadTime: "3 Days",
    stock: 120,
    stockStatus: "In Stock",
    lastUpdated: "May 16, 2026",
    status: "Active",
  },
  {
    image: "🖥️",
    vendorSku: "DELL-MON-24",
    name: "Dell 24 Monitor - P2422H",
    spec: '24", FHD, IPS, 60Hz, HDMI, DP',
    masterSku: "MN-1005",
    category: "Monitors",
    price: "₹9,500.00",
    priceChange: "5.56%",
    priceDir: "up",
    moq: 10,
    leadTime: "2 Days",
    stock: 75,
    stockStatus: "In Stock",
    lastUpdated: "May 15, 2026",
    status: "Active",
  },
  {
    image: "⌨️",
    vendorSku: "DELL-KB-01",
    name: "Dell Wired Keyboard",
    spec: "USB, Black",
    masterSku: "KB-2001",
    category: "Accessories",
    price: "₹650.00",
    priceChange: "0.00%",
    priceDir: "neutral",
    moq: 20,
    leadTime: "1 Day",
    stock: 250,
    stockStatus: "In Stock",
    lastUpdated: "May 16, 2026",
    status: "Active",
  },
  {
    image: "🖱️",
    vendorSku: "DELL-MSE-01",
    name: "Dell MS116 Mouse",
    spec: "Wired Optical Mouse, Black",
    masterSku: "MS-2001",
    category: "Accessories",
    price: "₹450.00",
    priceChange: "0.00%",
    priceDir: "neutral",
    moq: 20,
    leadTime: "1 Day",
    stock: 150,
    stockStatus: "In Stock",
    lastUpdated: "May 14, 2026",
    status: "Active",
  },
  {
    image: "🔌",
    vendorSku: "DELL-DOCK-WD19",
    name: "Dell WD19 Docking Station",
    spec: "USB-C, 180W, Dual Display",
    masterSku: "DOCK-1002",
    category: "Accessories",
    price: "₹18,750.00",
    priceChange: "1.32%",
    priceDir: "down",
    moq: 5,
    leadTime: "3 Days",
    stock: 45,
    stockStatus: "In Stock",
    lastUpdated: "May 13, 2026",
    status: "Active",
  },
  {
    image: "🔋",
    vendorSku: "DELL-PWR-65W",
    name: "Dell 65W Power Adapter",
    spec: "Original Adapter",
    masterSku: "ADP-1003",
    category: "Accessories",
    price: "₹1,550.00",
    priceChange: "3.33%",
    priceDir: "up",
    moq: 10,
    leadTime: "2 Days",
    stock: 60,
    stockStatus: "In Stock",
    lastUpdated: "May 10, 2026",
    status: "Active",
  },
  {
    image: "📡",
    vendorSku: "DELL-SWITCH-24P",
    name: "Dell 24 Port Switch",
    spec: "24 Port Gigabit Switch",
    masterSku: "NET-2001",
    category: "Networking",
    price: "₹22,000.00",
    priceChange: "0.00%",
    priceDir: "neutral",
    moq: 2,
    leadTime: "4 Days",
    stock: 25,
    stockStatus: "Low Stock",
    lastUpdated: "May 08, 2026",
    status: "Active",
  },
  {
    image: "💻",
    vendorSku: "DELL-LAT-3540",
    name: "Dell Latitude 3540 Laptop",
    spec: 'Intel i3, 8GB RAM, 256GB SSD, 15.6"',
    masterSku: "LT-1002",
    category: "Laptops",
    price: "₹36,000.00",
    priceChange: "1.37%",
    priceDir: "down",
    moq: 5,
    leadTime: "3 Days",
    stock: 30,
    stockStatus: "In Stock",
    lastUpdated: "May 07, 2026",
    status: "Active",
  },
];

function PriceIndicator({ dir, change }: { dir: PriceChange; change: string }) {
  if (dir === "up") {
    return (
      <span className="flex items-center gap-0.5 text-red-500 text-xs font-medium">
        <ArrowUp className="w-3 h-3" /> {change}
      </span>
    );
  }
  if (dir === "down") {
    return (
      <span className="flex items-center gap-0.5 text-green-600 text-xs font-medium">
        <ArrowDown className="w-3 h-3" /> {change}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-gray-400 text-xs font-medium">
      <Minus className="w-3 h-3" /> {change}
    </span>
  );
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
      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${colors[status]}`}>
        {status}
      </span>
    </div>
  );
}

function SelectBox({ label, options }: { label: string; options: string[] }) {
  const [val, setVal] = useState(options[0]);
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-xs text-gray-500 font-medium">{label}</label>
      <div className="relative">
        <select
          className="appearance-none border border-gray-200 rounded-md bg-white text-sm px-3 py-1.5 pr-7 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          value={val}
          onChange={(e) => setVal(e.target.value)}
        >
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
}

export default function VendorProductsPage() {
  const [activeTab, setActiveTab] = useState("Products (128)");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(10);

  const filtered = PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.vendorSku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-[1200px] mx-auto px-4 py-6 space-y-4">

        {/* Vendor Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-start gap-4">
            {/* Dell Logo */}
            <div className="w-14 h-14 rounded-full bg-[#007DB8] flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="text-white font-black text-sm tracking-widest">DELL</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-xl font-bold text-gray-900">Dell India Pvt. Ltd.</h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                  Active
                </span>
              </div>
              <div className="flex flex-wrap gap-6">
                {[
                  { label: "Vendor ID", value: "VEN-1001" },
                  { label: "Vendor Code", value: "DELL-IND-001" },
                  { label: "Category", value: "IT Hardware" },
                  { label: "Vendor Type", value: "Supplier" },
                  { label: "Onboarded On", value: "Feb 10, 2024" },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-gray-400 font-medium">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-700">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
                {stat.icon}
              </div>
              <p className="text-xs text-gray-500 font-medium mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Filters & Actions */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-100">
            {/* Search + Filters Row */}
            <div className="flex flex-wrap items-end gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search by product name, SKU, category..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <SelectBox label="Category" options={["All Categories", "Laptops", "Monitors", "Accessories", "Networking"]} />
              <SelectBox label="Brand" options={["All Brands", "Dell"]} />
              <SelectBox label="Stock Status" options={["All", "In Stock", "Low Stock", "Out of Stock"]} />
              <SelectBox label="Price Updated" options={["All", "Today", "This Week", "This Month"]} />

              <div className="flex items-center gap-2 ml-auto">
                <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                  <Filter className="w-3.5 h-3.5" />
                  Filters
                </button>
                <button className="p-2 border border-gray-200 rounded-md text-gray-500 hover:bg-gray-50 transition-colors">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-4 py-3 flex flex-wrap gap-2 border-b border-gray-100">
            <button className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors shadow-sm">
              <Plus className="w-3.5 h-3.5" />
              Add Product
            </button>
            <button className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
              <Tag className="w-3.5 h-3.5" />
              Bulk Price Update
            </button>
            <button className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              Import Products
            </button>
            <button className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
              <Download className="w-3.5 h-3.5" />
              Export Catalog
            </button>
            <button className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
              <RefreshCcw className="w-3.5 h-3.5" />
              Sync Vendor Feed
            </button>
            <button className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
              <BookOpen className="w-3.5 h-3.5" />
              Assign to Master Catalog
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    <span className="flex items-center gap-1 cursor-pointer hover:text-gray-700">
                      Vendor SKU <span className="flex flex-col"><ChevronUp className="w-3 h-3 -mb-1" /><ChevronDown className="w-3 h-3" /></span>
                    </span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Master SKU</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Purchase Price</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">MOQ</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Lead Time</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <span className="flex items-center gap-1 cursor-pointer hover:text-gray-700">
                      Stock <span className="flex flex-col"><ChevronUp className="w-3 h-3 -mb-1" /><ChevronDown className="w-3 h-3" /></span>
                    </span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    <span className="flex items-center gap-1 cursor-pointer hover:text-gray-700">
                      Last Updated <span className="flex flex-col"><ChevronUp className="w-3 h-3 -mb-1" /><ChevronDown className="w-3 h-3" /></span>
                    </span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <span className="flex items-center gap-1 cursor-pointer hover:text-gray-700">
                      Status <span className="flex flex-col"><ChevronUp className="w-3 h-3 -mb-1" /><ChevronDown className="w-3 h-3" /></span>
                    </span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((product) => (
                  <tr key={product.vendorSku} className="hover:bg-gray-50/70 transition-colors group">
                    {/* Image + SKU */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-md flex items-center justify-center text-base flex-shrink-0 border border-gray-200">
                          {product.image}
                        </div>
                        <span className="text-blue-600 font-medium text-xs hover:underline cursor-pointer">
                          {product.vendorSku}
                        </span>
                      </div>
                    </td>
                    {/* Name */}
                    <td className="px-4 py-3.5 max-w-[200px]">
                      <div className="font-medium text-gray-800 text-sm leading-tight">{product.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5 leading-tight">{product.spec}</div>
                    </td>
                    {/* Master SKU */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-gray-600 text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">
                        {product.masterSku}
                      </span>
                    </td>
                    {/* Category */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-gray-600 text-sm">{product.category}</td>
                    {/* Purchase Price */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-gray-800 text-sm">{product.price}</div>
                      <PriceIndicator dir={product.priceDir} change={product.priceChange} />
                    </td>
                    {/* MOQ */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-gray-600 text-sm">{product.moq}</td>
                    {/* Lead Time */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-gray-600 text-sm">{product.leadTime}</td>
                    {/* Stock */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <StockBadge status={product.stockStatus} count={product.stock} />
                    </td>
                    {/* Last Updated */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-gray-500 text-sm">{product.lastUpdated}</td>
                    {/* Status */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          product.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3.5 flex items-center justify-between border-t border-gray-100">
            <span className="text-sm text-gray-500">
              Showing 1 to {Math.min(perPage, filtered.length)} of 128 products
            </span>
            <div className="flex items-center gap-1.5">
              <button className="p-1.5 rounded-md border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {[1, 2, 3].map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                    currentPage === p
                      ? "bg-blue-600 text-white shadow-sm"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              ))}
              <span className="text-gray-400 text-sm">...</span>
              <button
                onClick={() => setCurrentPage(16)}
                className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                  currentPage === 16
                    ? "bg-blue-600 text-white"
                    : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                16
              </button>
              <button className="p-1.5 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="ml-2 flex items-center gap-1.5">
                <span className="text-sm text-gray-500">10 / page</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
