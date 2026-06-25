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
import VendorProductsPage from "./VendorProductsPage";
import VendorOrdersPage from "./VendorOrdersPage";
import VendorContractsPage from "./VendorContractsPage";

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

// ── main page ─────────────────────────────────────────────────────────────────
const TABS = [
  { key: "overview", label: "Overview", icon: <Building2 className="w-3.5 h-3.5" /> },
  { key: "products", label: "Products", count: 28, icon: <Package className="w-3.5 h-3.5" /> },
  { key: "orders", label: "Orders", count: 78, icon: <ShoppingCart className="w-3.5 h-3.5" /> },
  { key: "performance", label: "Performance", icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { key: "contracts", label: "Contracts", count: 5, icon: <ClipboardList className="w-3.5 h-3.5" /> },
  { key: "documents", label: "Documents", count: 34, icon: <FileText className="w-3.5 h-3.5" /> },
  { key: "payments", label: "Payments", icon: <CreditCard className="w-3.5 h-3.5" /> },
  { key: "news", label: "News & Activity", icon: <Newspaper className="w-3.5 h-3.5" /> },
];

export default function VendorDetail() {
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();

  const stats = [
    { label: "Rating", value: "4.6/5", sub: "★★★★★", accent: "text-amber-500" },
    { label: "Total Contract Value", value: "₹4,45,00,500", sub: "+12% YoY", accent: "text-blue-600" },
    { label: "Total Orders", value: "156", sub: "All time", accent: "text-gray-800" },
    { label: "On-Time Delivery", value: "99.8%", sub: "Last 12 months", accent: "text-emerald-600" },
    { label: "Quality Score", value: "85.8%", sub: "Avg last 3 reviews", accent: "text-indigo-600" },
    { label: "Active Contracts", value: "3", sub: "Running", accent: "text-purple-600" },
  ];

  return (
    <div className="min-h-screen bg-[#f5f6fa] font-[Inter,sans-serif] flex flex-col">

      {/* ── Sticky Header ───────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">

        {/* Vendor identity row */}
        <div className="px-6 pt-4 pb-3 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Back button + avatar */}
            <button
              onClick={() => navigate("/")}
              className="mt-1 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
              D
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg font-bold text-gray-900">Dell India Pvt. Ltd.</h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Active
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {[
                  { label: "VDA-1001" },
                  { label: "Dell_IND-001" },
                  { label: "IT Hardware" },
                  { label: "Supplier: IT Hardware" },
                  { label: "Onboard: Feb 15, 2024" },
                ].map((item, i) => (
                  <span key={i} className="text-xs text-gray-500 flex items-center gap-1">
                    {i > 0 && <span className="text-gray-300">·</span>}
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Primary contact + action */}
          <div className="flex items-start gap-6 flex-shrink-0">
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Primary Contact</p>
              <p className="text-sm font-semibold text-gray-800">Rahul Sharma</p>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <Phone className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">+91 98765 43210</span>
              </div>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <Mail className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">rahul@dell.com</span>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm mt-1">
              <MessageSquare className="w-3.5 h-3.5" />
              Message Vendor
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="px-6 pb-3">
          <div className="grid grid-cols-6 divide-x divide-gray-100 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
            {stats.map((s, i) => (
              <div key={i} className="flex flex-col items-center py-3 px-2 text-center">
                <p className={`text-base font-bold ${s.accent}`}>{s.value}</p>
                <p className="text-xs text-gray-500 font-medium leading-tight mt-0.5">{s.label}</p>
                <p className="text-xs text-gray-400 leading-tight">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Horizontal scrollable tabs */}
        <div className="relative">
          <div className="flex items-center px-6 gap-0 overflow-x-auto no-scrollbar border-t border-gray-100">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${
                  activeTab === tab.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-200"
                }`}
              >
                <span className={activeTab === tab.key ? "text-blue-600" : "text-gray-400"}>{tab.icon}</span>
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    activeTab === tab.key ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Page body ────────────────────────────────────────────────────── */}
      <div className="flex-1 px-0 py-0 overflow-auto">
        {activeTab === "overview" && <div className="px-6 py-5"><OverviewTab /></div>}
        {activeTab === "products" && <VendorProductsPage />}
        {activeTab === "orders" && <VendorOrdersPage />}
        {activeTab === "performance" && <div className="px-6 py-5"><PlaceholderTab label="Performance" icon={<TrendingUp className="w-6 h-6" />} /></div>}
        {activeTab === "contracts" && <VendorContractsPage />}
        {activeTab === "documents" && <div className="px-6 py-5"><PlaceholderTab label="Documents" icon={<FileText className="w-6 h-6" />} /></div>}
        {activeTab === "payments" && <div className="px-6 py-5"><PlaceholderTab label="Payments" icon={<CreditCard className="w-6 h-6" />} /></div>}
        {activeTab === "news" && <div className="px-6 py-5"><PlaceholderTab label="News & Activity" icon={<Newspaper className="w-6 h-6" />} /></div>}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
