import { useState } from "react";
import {
  Star,
  Phone,
  Mail,
  MessageSquare,
  ChevronLeft,
  Building2,
  MapPin,
  CreditCard,
  FileText,
  Package,
  ShoppingCart,
  TrendingUp,
  ClipboardList,
  Newspaper,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Edit2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useNavigate } from "react-router-dom";

// ── helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

function ProgressBar({ value, color = "bg-blue-500" }: { value: number; color?: string }) {
  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-10 text-right">{value}%</span>
    </div>
  );
}

// ── spend data ───────────────────────────────────────────────────────────────
const spendData = [
  { month: "Jan", spend: 32 },
  { month: "Feb", spend: 45 },
  { month: "Mar", spend: 28 },
  { month: "Apr", spend: 58 },
  { month: "May", spend: 41 },
  { month: "Jun", spend: 67 },
  { month: "Jul", spend: 52 },
  { month: "Aug", spend: 73 },
  { month: "Sep", spend: 61 },
  { month: "Oct", spend: 48 },
  { month: "Nov", spend: 55 },
  { month: "Dec", spend: 70 },
];

const activities = [
  { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, text: "Invoice #INV-2024-0892 approved for ₹12,50,000", time: "2 hours ago", color: "bg-emerald-50" },
  { icon: <ShoppingCart className="w-4 h-4 text-blue-500" />, text: "New PO #PO-2024-0334 raised for IT Hardware", time: "Yesterday", color: "bg-blue-50" },
  { icon: <AlertCircle className="w-4 h-4 text-amber-500" />, text: "Compliance document renewal due in 15 days", time: "2 days ago", color: "bg-amber-50" },
  { icon: <Clock className="w-4 h-4 text-purple-500" />, text: "Contract #CNT-005 extended for 6 months", time: "1 week ago", color: "bg-purple-50" },
  { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, text: "Annual vendor review completed — Score: 85.8%", time: "2 weeks ago", color: "bg-emerald-50" },
];

const contracts = [
  { name: "Hardware Supply Agreement", value: "₹1,80,00,000", progress: 20, status: "Active", end: "Mar 2026" },
  { name: "Enterprise Support Contract", value: "₹95,00,000", progress: 45, status: "Active", end: "Dec 2025" },
  { name: "Cloud Infrastructure Deal", value: "₹1,70,00,500", progress: 74, status: "Active", end: "Aug 2025" },
];

// ── tab content ───────────────────────────────────────────────────────────────
function OverviewTab() {
  return (
    <div className="flex flex-col gap-5">

      {/* Top 3-column info */}
      <div className="grid grid-cols-3 gap-4">
        {/* Vendor Information */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-800">Vendor Information</h3>
          </div>
          <div className="flex flex-col gap-2.5">
            {[
              { label: "Address", value: "14th Floor, DLF Cyber City" },
              { label: "City", value: "New Delhi" },
              { label: "State / Province", value: "Delhi" },
              { label: "Zip / Postal Code", value: "110001" },
              { label: "Country", value: "India" },
              { label: "Website", value: "www.dell.com/in" },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-start gap-2">
                <span className="text-xs text-gray-400 flex-shrink-0">{r.label}</span>
                <span className="text-xs font-medium text-gray-700 text-right">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-800">Additional Information</h3>
          </div>
          <div className="flex flex-col gap-2.5">
            {[
              { label: "Registration No.", value: "DL-2015-123456" },
              { label: "Tax ID / GST", value: "29AADCD1234F1Z5" },
              { label: "PAN Number", value: "AADCD1234F" },
              { label: "Founded", value: "1984 (India ops: 2015)" },
              { label: "Employees", value: "500+" },
              { label: "Annual Revenue", value: "₹50 Cr+" },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-start gap-2">
                <span className="text-xs text-gray-400 flex-shrink-0">{r.label}</span>
                <span className="text-xs font-medium text-gray-700 text-right">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment & Bank Details */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-800">Payment & Bank Details</h3>
          </div>
          <div className="flex flex-col gap-2.5">
            {[
              { label: "Payment Mode", value: "NEFT / RTGS" },
              { label: "Payment Terms", value: "NET 30" },
              { label: "Bank Account", value: "XXXX-XXXX-1234" },
              { label: "IFSC Code", value: "HDFC0001234" },
              { label: "Bank Name", value: "HDFC Bank Ltd." },
              { label: "Branch", value: "Connaught Place, Delhi" },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-start gap-2">
                <span className="text-xs text-gray-400 flex-shrink-0">{r.label}</span>
                <span className="text-xs font-medium text-gray-700 text-right">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Billing / Shipping + Performance */}
      <div className="grid grid-cols-3 gap-4">
        {/* Billing Address */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-800">Billing Address</h3>
          </div>
          <div className="flex flex-col gap-2.5">
            {[
              { label: "Address Line 1", value: "14th Floor, DLF Cyber City" },
              { label: "Address Line 2", value: "Sector 25, Phase II" },
              { label: "City", value: "New Delhi" },
              { label: "State", value: "Delhi" },
              { label: "Zip Code", value: "110001" },
              { label: "Country", value: "India" },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-start gap-2">
                <span className="text-xs text-gray-400 flex-shrink-0">{r.label}</span>
                <span className="text-xs font-medium text-gray-700 text-right">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-semibold text-gray-800">Shipping Address</h3>
          </div>
          <div className="flex flex-col gap-2.5">
            {[
              { label: "Address Line 1", value: "Plot 12, Sector 18" },
              { label: "Address Line 2", value: "NSEZ, Noida" },
              { label: "City", value: "Noida" },
              { label: "State", value: "Uttar Pradesh" },
              { label: "Zip Code", value: "201301" },
              { label: "Country", value: "India" },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-start gap-2">
                <span className="text-xs text-gray-400 flex-shrink-0">{r.label}</span>
                <span className="text-xs font-medium text-gray-700 text-right">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Vendor Performance */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-800">Vendor Performance</h3>
          </div>
          <div className="flex flex-col gap-3.5">
            {[
              { label: "Quality", value: 82, color: "bg-blue-500" },
              { label: "Delivery", value: 88, color: "bg-emerald-500" },
              { label: "Responsiveness", value: 79, color: "bg-purple-500" },
              { label: "Compliance", value: 91, color: "bg-indigo-500" },
            ].map(m => (
              <div key={m.label}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs text-gray-500">{m.label}</span>
                </div>
                <ProgressBar value={m.value} color={m.color} />
              </div>
            ))}
            <div className="mt-2 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600">Grand Score</span>
              <span className="text-sm font-bold text-blue-600">83.8%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Contracts + Report Activity */}
      <div className="grid grid-cols-2 gap-4">
        {/* Active Contracts */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-gray-800">Active Contracts</h3>
            </div>
            <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full">3 Active</span>
          </div>
          <div className="flex flex-col gap-4">
            {contracts.map((c, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.value} · Ends {c.end}</p>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">{c.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${c.progress}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right">{c.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Report Activity */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Newspaper className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-800">Report Activity</h3>
          </div>
          <div className="flex flex-col gap-0">
            {activities.map((a, i) => (
              <div key={i} className="flex gap-3 relative pb-4 last:pb-0">
                {i < activities.length - 1 && (
                  <div className="absolute left-4 top-7 bottom-0 w-px bg-gray-100" />
                )}
                <div className={`w-8 h-8 rounded-full ${a.color} flex items-center justify-center flex-shrink-0 z-10`}>
                  {a.icon}
                </div>
                <div className="pt-1 min-w-0">
                  <p className="text-xs text-gray-700 leading-snug">{a.text}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Spend Summary + Spend Metrics */}
      <div className="grid grid-cols-3 gap-4">
        {/* Spend Summary chart */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-gray-800">Spend Summary</h3>
            </div>
            <span className="text-xs text-gray-400">Last 12 months</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={spendData} barSize={18} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}L`} />
              <Tooltip
                formatter={(v: number) => [`₹${v} L`, "Spend"]}
                contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}
              />
              <Bar dataKey="spend" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Spend Metrics */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpRight className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-800">Spend Metrics</h3>
          </div>
          <div className="flex flex-col gap-4">
            {[
              { label: "Total Spend", value: "₹4,09,00,500", highlight: true },
              { label: "Total Orders", value: "156", highlight: false },
              { label: "Avg Order Value", value: "₹5,53,190", highlight: false },
              { label: "Last Order Date", value: "April 2024", highlight: false },
              { label: "Avg Payment Cycle", value: "May 2024", highlight: false },
            ].map(m => (
              <div key={m.label} className="flex flex-col gap-0.5">
                <p className="text-xs text-gray-400">{m.label}</p>
                <p className={`text-sm font-bold ${m.highlight ? "text-blue-600" : "text-gray-800"}`}>{m.value}</p>
                {m.label !== "Avg Payment Cycle" && <div className="h-px bg-gray-50 mt-1" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaceholderTab({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-24 gap-3 text-gray-300">
      <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center">{icon}</div>
      <p className="text-sm font-medium text-gray-400">{label} content coming soon</p>
    </div>
  );
}

// Products Tab - Shows vendor products
"import { useMemo, useState } from \"react\";
import {
  Users,
  CheckSquare,
  AlertTriangle,
  Tag,
  Clock,
  Star,
  MoreVertical,
  ChevronUp,
  ChevronDown,
  Eye,
  Pencil,
  Trash2,
  Search,
  ArrowUpDown,
  Plus,
  TrendingUp,
  Upload,
  Download,
  RefreshCw,
  Image as ImageIcon,
} from \"lucide-react\";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from \"@/components/ui/select\";
import { Button } from \"@/components/ui/button\";
import { Input } from \"@/components/ui/input\";
import { Badge } from \"@/components/ui/badge\";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from \"@/components/ui/dropdown-menu\";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from \"@/components/ui/alert-dialog\";
import { toast } from \"sonner\";

import { MOCK_PRODUCTS, CATEGORIES, BRANDS } from \"@/data/mockProducts\";
import { formatINR, formatDateShort, stockBucket } from \"@/lib/format\";
import {
  ProductFormDialog,
  ViewProductDialog,
  BulkPriceDialog,
  ImportProductsDialog,
  ExportCatalogDialog,
  SyncFeedDialog,
} from \"@/components/catalog/ProductModals\";

const STAT_DEF = [
  { key: \"total\", label: \"Total Products\", sub: \"All Products\", icon: Users, color: \"bg-blue-50 text-blue-600\" },
  { key: \"active\", label: \"Active Products\", subFn: (p, t) => `${((p / t) * 100).toFixed(2)}% of total`, icon: CheckSquare, color: \"bg-emerald-50 text-emerald-600\" },
  { key: \"outOfStock\", label: \"Out of Stock\", subFn: (p, t) => `${((p / t) * 100).toFixed(2)}% of total`, icon: AlertTriangle, color: \"bg-orange-50 text-orange-600\" },
  { key: \"priceUpdates\", label: \"Price Updates\", sub: \"This Month\", icon: Tag, color: \"bg-emerald-50 text-emerald-600\" },
  { key: \"avgLead\", label: \"Avg. Lead Time\", sub: \"Across all products\", suffix: \" Days\", icon: Clock, color: \"bg-blue-50 text-blue-600\" },
  { key: \"preferred\", label: \"Preferred Products\", subFn: (p, t) => `${((p / t) * 100).toFixed(2)}% of total`, icon: Star, color: \"bg-rose-50 text-rose-600\" },
];

const PRICE_OPTIONS = [
  { value: \"all\", label: \"All\" },
  { value: \"7d\", label: \"Updated in last 7 days\" },
  { value: \"30d\", label: \"Updated in last 30 days\" },
  { value: \"stale\", label: \"Not updated in 60+ days\" },
];

const STOCK_OPTIONS = [
  { value: \"all\", label: \"All\" },
  { value: \"in\", label: \"In Stock\" },
  { value: \"low\", label: \"Low Stock\" },
  { value: \"out\", label: \"Out of Stock\" },
];

export default function VendorCatalog() {
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [filters, setFilters] = useState({ category: \"all\", brand: \"all\", stock: \"all\", price: \"all\", search: \"\" });
  const [sort, setSort] = useState({ key: \"lastUpdated\", dir: \"desc\" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // ---- derived
  const filtered = useMemo(() => {
    const now = Date.now();
    return products.filter((p) => {
      if (filters.category !== \"all\" && p.category !== filters.category) return false;
      if (filters.brand !== \"all\" && p.brand !== filters.brand) return false;
      if (filters.stock !== \"all\" && stockBucket(p.stock) !== filters.stock) return false;
      if (filters.price !== \"all\") {
        const days = (now - new Date(p.lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
        if (filters.price === \"7d\" && days > 7) return false;
        if (filters.price === \"30d\" && days > 30) return false;
        if (filters.price === \"stale\" && days < 60) return false;
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!(p.name.toLowerCase().includes(q) || p.vendorSku.toLowerCase().includes(q) || (p.masterSku || \"\").toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [products, filters]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = a[sort.key]; const bv = b[sort.key];
      if (av == null) return 1; if (bv == null) return -1;
      if (typeof av === \"number\" && typeof bv === \"number\") return sort.dir === \"asc\" ? av - bv : bv - av;
      const as = String(av).toLowerCase(); const bs = String(bv).toLowerCase();
      if (as < bs) return sort.dir === \"asc\" ? -1 : 1;
      if (as > bs) return sort.dir === \"asc\" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const stats = useMemo(() => {
    const t = products.length;
    const a = products.filter((p) => p.status === \"Active\").length;
    const o = products.filter((p) => p.stock <= 0).length;
    const pr = products.filter((p) => p.preferred).length;
    const monthAgo = Date.now() - 30 * 86400000;
    const pu = products.filter((p) => new Date(p.lastUpdated).getTime() >= monthAgo).length;
    const avg = Math.round(products.reduce((s, p) => s + p.leadTime, 0) / Math.max(1, products.length));
    return { total: t, active: a, outOfStock: o, preferred: pr, priceUpdates: pu, avgLead: avg };
  }, [products]);

  // ---- handlers
  const handleSort = (key) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === \"asc\" ? \"desc\" : \"asc\" } : { key, dir: \"asc\" }));
  };

  const saveProduct = (p) => {
    setProducts((prev) => {
      const idx = prev.findIndex((x) => x.id === p.id);
      if (idx >= 0) {
        const copy = [...prev]; copy[idx] = p; return copy;
      }
      return [p, ...prev];
    });
  };

  const removeProduct = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    toast.success(\"Product deleted\");
    setDeleteId(null);
  };

  const applyBulk = ({ mode, direction, value, scope }) => {
    const targetIds = new Set((scope === \"filtered\" ? filtered : products).map((p) => p.id));
    setProducts((prev) => prev.map((p) => {
      if (!targetIds.has(p.id)) return p;
      let np = p.purchasePrice;
      const delta = mode === \"percent\" ? (np * value) / 100 : value;
      np = direction === \"increase\" ? np + delta : Math.max(0, np - delta);
      const trend = ((np - p.purchasePrice) / p.purchasePrice) * 100;
      return { ...p, purchasePrice: Math.round(np), priceTrend: Number(trend.toFixed(2)), lastUpdated: new Date().toISOString() };
    }));
  };

  const importProducts = (count) => {
    const next = Array.from({ length: count }, (_, i) => {
      const idx = products.length + i + 1;
      return {
        id: `p_imp_${Date.now()}_${i}`,
        vendorSku: `IMP-${String(idx).padStart(4, \"0\")}`,
        name: `Imported Product ${idx}`,
        description: \"Imported via CSV\",
        masterSku: `M-${5000 + idx}`,
        category: CATEGORIES[idx % CATEGORIES.length],
        brand: BRANDS[idx % BRANDS.length],
        purchasePrice: 500 + (idx % 50) * 100,
        priceTrend: 0,
        moq: 5,
        leadTime: 2,
        stock: 50 + (idx % 30),
        lastUpdated: new Date().toISOString(),
        status: \"Active\",
        preferred: false,
      };
    });
    setProducts((prev) => [...next, ...prev]);
  };

  const refreshFromFeed = () => {
    setProducts((prev) => prev.map((p, i) => {
      if (i % 11 !== 0) return p;
      const trend = (Math.random() * 6 - 3); // -3 to +3
      const np = Math.max(100, Math.round(p.purchasePrice * (1 + trend / 100)));
      return { ...p, purchasePrice: np, priceTrend: Number(trend.toFixed(2)), lastUpdated: new Date().toISOString() };
    }));
  };

  const resetFilters = () => setFilters({ category: \"all\", brand: \"all\", stock: \"all\", price: \"all\", search: \"\" });

  return (
    <div className=\"min-h-screen bg-slate-50 font-sans\" data-testid=\"vendor-catalog-page\">
      <div className=\"max-w-[1400px] mx-auto px-6 py-8\">
        {/* Header */}
        <div className=\"mb-6 flex items-center justify-between\">
          <div>
            <h1 className=\"text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900\">Vendor Product Catalog</h1>
            <p className=\"text-sm text-slate-500 mt-1\">Manage products, prices, and stock from your vendor feed.</p>
          </div>
        </div>

        {/* Stats */}
        <div className=\"grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8\" data-testid=\"stats-grid\">
          {STAT_DEF.map((s) => {
            const Icon = s.icon;
            const value = stats[s.key];
            const sub = s.subFn ? s.subFn(value, stats.total) : s.sub;
            return (
              <div key={s.key} className=\"bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition\" data-testid={`stat-${s.key}`}>
                <div className=\"flex items-start gap-3\">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${s.color}`}>
                    <Icon className=\"w-5 h-5\" />
                  </div>
                  <div className=\"min-w-0\">
                    <p className=\"text-xs font-medium text-slate-500 truncate\">{s.label}</p>
                    <p className=\"text-2xl font-semibold text-slate-900 mt-0.5\">
                      {value}{s.suffix || \"\"}
                    </p>
                    <p className=\"text-[11px] text-slate-400 mt-0.5\">{sub}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className=\"flex flex-wrap items-center justify-center gap-3 mb-6\" data-testid=\"filters\">
          <FilterSelect
            testid=\"filter-category\"
            label=\"Category\"
            value={filters.category}
            onChange={(v) => { setFilters({ ...filters, category: v }); setPage(1); }}
            options={[{ value: \"all\", label: \"All Categories\" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
          />
          <FilterSelect
            testid=\"filter-brand\"
            label=\"Brand\"
            value={filters.brand}
            onChange={(v) => { setFilters({ ...filters, brand: v }); setPage(1); }}
            options={[{ value: \"all\", label: \"All Brands\" }, ...BRANDS.map((b) => ({ value: b, label: b }))]}
          />
          <FilterSelect
            testid=\"filter-stock\"
            label=\"Stock Status\"
            value={filters.stock}
            onChange={(v) => { setFilters({ ...filters, stock: v }); setPage(1); }}
            options={STOCK_OPTIONS}
          />
          <FilterSelect
            testid=\"filter-price\"
            label=\"Price Updated\"
            value={filters.price}
            onChange={(v) => { setFilters({ ...filters, price: v }); setPage(1); }}
            options={PRICE_OPTIONS}
          />
        </div>

        {/* Action bar */}
        <div className=\"flex items-center justify-between gap-3 mb-4\">
          <div className=\"relative w-full max-w-sm\">
            <Search className=\"w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400\" />
            <Input
              data-testid=\"search-input\"
              placeholder=\"Search by name, vendor SKU, master SKU...\"
              value={filters.search}
              onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
              className=\"pl-9 bg-white\"
            />
          </div>

          <div className=\"flex items-center gap-2\">
            {(filters.category !== \"all\" || filters.brand !== \"all\" || filters.stock !== \"all\" || filters.price !== \"all\" || filters.search) && (
              <Button variant=\"ghost\" size=\"sm\" onClick={resetFilters} data-testid=\"reset-filters\" className=\"text-slate-600\">
                Clear filters
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant=\"outline\" size=\"icon\" data-testid=\"actions-trigger\" className=\"h-10 w-10 rounded-lg border-slate-200\">
                  <MoreVertical className=\"w-4 h-4\" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align=\"end\" className=\"w-56\">
                <DropdownMenuLabel>Catalog actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem data-testid=\"menu-add-product\" onClick={() => { setEditing(null); setFormOpen(true); }}>
                  <Plus className=\"w-4 h-4 mr-2 text-blue-600\" /> Add Product
                </DropdownMenuItem>
                <DropdownMenuItem data-testid=\"menu-bulk-price\" onClick={() => setBulkOpen(true)}>
                  <TrendingUp className=\"w-4 h-4 mr-2 text-blue-600\" /> Bulk Price Update
                </DropdownMenuItem>
                <DropdownMenuItem data-testid=\"menu-import\" onClick={() => setImportOpen(true)}>
                  <Upload className=\"w-4 h-4 mr-2 text-blue-600\" /> Import Products
                </DropdownMenuItem>
                <DropdownMenuItem data-testid=\"menu-export\" onClick={() => setExportOpen(true)}>
                  <Download className=\"w-4 h-4 mr-2 text-blue-600\" /> Export Catalog
                </DropdownMenuItem>
                <DropdownMenuItem data-testid=\"menu-sync\" onClick={() => setSyncOpen(true)}>
                  <RefreshCw className=\"w-4 h-4 mr-2 text-blue-600\" /> Sync Vendor Feed
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Table */}
        <div className=\"bg-white border border-slate-200 rounded-xl overflow-hidden\" data-testid=\"products-table\">
          <div className=\"overflow-x-auto\">
            <table className=\"w-full text-sm\">
              <thead className=\"bg-slate-50/70 border-b border-slate-200\">
                <tr className=\"text-left text-slate-500\">
                  <Th onClick={() => handleSort(\"vendorSku\")} sorted={sort.key === \"vendorSku\" ? sort.dir : null}>Vendor SKU</Th>
                  <Th onClick={() => handleSort(\"name\")} sorted={sort.key === \"name\" ? sort.dir : null}>Product Name</Th>
                  <Th>Master SKU</Th>
                  <Th>Category</Th>
                  <Th onClick={() => handleSort(\"purchasePrice\")} sorted={sort.key === \"purchasePrice\" ? sort.dir : null}>Purchase Price</Th>
                  <Th>MOQ</Th>
                  <Th onClick={() => handleSort(\"leadTime\")} sorted={sort.key === \"leadTime\" ? sort.dir : null}>Lead Time</Th>
                  <Th onClick={() => handleSort(\"stock\")} sorted={sort.key === \"stock\" ? sort.dir : null}>Stock</Th>
                  <Th onClick={() => handleSort(\"lastUpdated\")} sorted={sort.key === \"lastUpdated\" ? sort.dir : null}>Last Updated</Th>
                  <Th onClick={() => handleSort(\"status\")} sorted={sort.key === \"status\" ? sort.dir : null}>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={11} className=\"py-16 text-center text-slate-400\" data-testid=\"empty-state\">
                      No products match your filters.
                    </td>
                  </tr>
                ) : paged.map((p) => (
                  <tr key={p.id} className=\"border-b border-slate-100 hover:bg-slate-50/60\" data-testid={`row-${p.id}`}>
                    <td className=\"px-4 py-3\">
                      <div className=\"flex items-center gap-3\">
                        <div className=\"w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center shrink-0\">
                          <ImageIcon className=\"w-4 h-4 text-slate-400\" />
                        </div>
                        <span className=\"font-medium text-blue-600\">{p.vendorSku}</span>
                      </div>
                    </td>
                    <td className=\"px-4 py-3\">
                      <div className=\"text-slate-900 font-medium\">{p.name}</div>
                      <div className=\"text-xs text-slate-400 mt-0.5 line-clamp-1\">{p.description}</div>
                    </td>
                    <td className=\"px-4 py-3 text-slate-600\">{p.masterSku || \"—\"}</td>
                    <td className=\"px-4 py-3 text-slate-600\">{p.category}</td>
                    <td className=\"px-4 py-3\">
                      <div className=\"font-semibold text-slate-900\">{formatINR(p.purchasePrice)}</div>
                      <PriceTrend trend={p.priceTrend} />
                    </td>
                    <td className=\"px-4 py-3 text-slate-700\">{p.moq}</td>
                    <td className=\"px-4 py-3 text-slate-700\">{p.leadTime} {p.leadTime > 1 ? \"Days\" : \"Day\"}</td>
                    <td className=\"px-4 py-3\">
                      <div className=\"font-semibold text-slate-900\">{p.stock}</div>
                      <StockTag stock={p.stock} />
                    </td>
                    <td className=\"px-4 py-3 text-slate-600\">{formatDateShort(p.lastUpdated)}</td>
                    <td className=\"px-4 py-3\">
                      <Badge className={p.status === \"Active\"
                        ? \"bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-50\"
                        : \"bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-100\"}>
                        {p.status}
                      </Badge>
                    </td>
                    <td className=\"px-4 py-3\">
                      <div className=\"flex items-center gap-1\">
                        <Button
                          variant=\"ghost\"
                          size=\"icon\"
                          data-testid={`view-${p.id}`}
                          onClick={() => { setViewing(p); setViewOpen(true); }}
                          className=\"h-8 w-8 text-slate-500 hover:text-blue-600\"
                        >
                          <Eye className=\"w-4 h-4\" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant=\"ghost\" size=\"icon\" data-testid={`row-menu-${p.id}`} className=\"h-8 w-8 text-slate-500\">
                              <MoreVertical className=\"w-4 h-4\" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align=\"end\">
                            <DropdownMenuItem onClick={() => { setEditing(p); setFormOpen(true); }} data-testid={`edit-${p.id}`}>
                              <Pencil className=\"w-4 h-4 mr-2\" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setViewing(p); setViewOpen(true); }}>
                              <Eye className=\"w-4 h-4 mr-2\" /> View details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeleteId(p.id)} className=\"text-red-600 focus:text-red-700\" data-testid={`delete-${p.id}`}>
                              <Trash2 className=\"w-4 h-4 mr-2\" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div className=\"flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200 bg-white\">
            <p className=\"text-xs text-slate-500\" data-testid=\"pagination-info\">
              Showing {sorted.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, sorted.length)} of {sorted.length} products
            </p>
            <Pager
              page={currentPage}
              totalPages={totalPages}
              onChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={(v) => { setPageSize(Number(v)); setPage(1); }}
            />
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editing}
        onSave={saveProduct}
      />
      <ViewProductDialog open={viewOpen} onOpenChange={setViewOpen} product={viewing} />
      <BulkPriceDialog open={bulkOpen} onOpenChange={setBulkOpen} onApply={applyBulk} totalCount={products.length} />
      <ImportProductsDialog open={importOpen} onOpenChange={setImportOpen} onImport={importProducts} />
      <ExportCatalogDialog open={exportOpen} onOpenChange={setExportOpen} products={products} />
      <SyncFeedDialog open={syncOpen} onOpenChange={setSyncOpen} onSync={refreshFromFeed} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent data-testid=\"delete-confirm-dialog\">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the product from your vendor catalog. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-testid=\"delete-confirm\"
              onClick={() => deleteId && removeProduct(deleteId)}
              className=\"bg-red-600 hover:bg-red-700\"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ----- helpers ----- */

const FilterSelect = ({ label, value, onChange, options, testid }) => (
  <div className=\"bg-white border border-slate-200 rounded-xl px-3 py-2 min-w-[180px]\">
    <p className=\"text-[11px] font-medium text-slate-500\">{label}</p>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger data-testid={testid} className=\"border-0 shadow-none p-0 h-7 font-semibold text-slate-900 focus:ring-0\">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

const Th = ({ children, onClick, sorted }) => (
  <th
    onClick={onClick}
    className={`px-4 py-3 font-medium text-xs uppercase tracking-wider whitespace-nowrap ${onClick ? \"cursor-pointer hover:text-slate-700 select-none\" : \"\"}`}
  >
    <span className=\"inline-flex items-center gap-1\">
      {children}
      {onClick && (
        sorted === \"asc\" ? <ChevronUp className=\"w-3 h-3\" /> :
        sorted === \"desc\" ? <ChevronDown className=\"w-3 h-3\" /> :
        <ArrowUpDown className=\"w-3 h-3 opacity-40\" />
      )}
    </span>
  </th>
);

const PriceTrend = ({ trend }) => {
  if (!trend || trend === 0) {
    return <div className=\"text-xs text-slate-400 mt-0.5 flex items-center gap-1\">→ 0.00%</div>;
  }
  const up = trend > 0;
  return (
    <div className={`text-xs mt-0.5 flex items-center gap-1 ${up ? \"text-red-500\" : \"text-emerald-600\"}`}>
      <span>{up ? \"↑\" : \"↓\"}</span>
      <span>{Math.abs(trend).toFixed(2)}%</span>
    </div>
  );
};

const StockTag = ({ stock }) => {
  const b = stockBucket(stock);
  if (b === \"in\") return <span className=\"inline-block mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700\">In Stock</span>;
  if (b === \"low\") return <span className=\"inline-block mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700\">Low Stock</span>;
  return <span className=\"inline-block mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-50 text-red-700\">Out of Stock</span>;
};

const Pager = ({ page, totalPages, onChange, pageSize, onPageSizeChange }) => {
  const range = () => {
    const out = [];
    const push = (v) => out.push(v);
    push(1);
    if (page > 3) push(\"...\");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) push(i);
    if (page < totalPages - 2) push(\"...\");
    if (totalPages > 1) push(totalPages);
    return out;
  };

  return (
    <div className=\"flex items-center gap-2\">
      <Button
        variant=\"outline\"
        size=\"icon\"
        className=\"h-8 w-8\"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        data-testid=\"page-prev\"
      >
        <ChevronUp className=\"w-4 h-4 -rotate-90\" />
      </Button>
      {range().map((it, idx) =>
        it === \"...\" ? (
          <span key={`e-${idx}`} className=\"px-2 text-slate-400\">…</span>
        ) : (
          <Button
            key={it}
            variant={it === page ? \"default\" : \"outline\"}
            className={`h-8 min-w-8 px-2 ${it === page ? \"bg-blue-600 hover:bg-blue-700\" : \"\"}`}
            onClick={() => onChange(it)}
            data-testid={`page-${it}`}
          >
            {it}
          </Button>
        )
      )}
      <Button
        variant=\"outline\"
        size=\"icon\"
        className=\"h-8 w-8\"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        data-testid=\"page-next\"
      >
        <ChevronDown className=\"w-4 h-4 -rotate-90\" />
      </Button>
      <Select value={String(pageSize)} onValueChange={onPageSizeChange}>
        <SelectTrigger className=\"h-8 w-[110px]\" data-testid=\"page-size\">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value=\"10\">10 / page</SelectItem>
          <SelectItem value=\"20\">20 / page</SelectItem>
          <SelectItem value=\"50\">50 / page</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
"