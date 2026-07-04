import { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import {
  Star, Phone, Mail, MessageSquare, ChevronLeft, Building2, MapPin,
  CreditCard, FileText, Package, ShoppingCart, TrendingUp, ClipboardList,
  Newspaper, DollarSign, AlertCircle, CheckCircle2, Clock, ArrowUpRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import VendorProductsPage from "./VendorProductsPage";
import VendorOrdersPage from "./VendorOrdersPage";
import VendorContractsPage from "./VendorContractsPage";
import VendorPaymentsPage from "./VendorPaymentsPage";
import VendorServicesPage from "./VendorServicesPage";
import VendorNewsActivityPage from "./VendorNewsActivityPage";
import VendorPerformancePage from "./VendorPerformancePage";
import VendorConfigurationTab from "./VendorConfigurationTab";
import { getVendorById, type StoredVendor } from "@/lib/vendorDataStore";

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

function generateSpendData(seed: number) {
  const base = [32, 45, 28, 58, 41, 67, 52, 73, 61, 48, 55, 70];
  return base.map((v, i) => ({
    month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
    spend: Math.max(10, Math.round(v * (0.7 + ((seed * (i + 1)) % 50) / 100))),
  }));
}

const defaultActivities = [
  { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, text: "Invoice approved successfully", time: "2 hours ago", color: "bg-emerald-50" },
  { icon: <ShoppingCart className="w-4 h-4 text-blue-500" />, text: "New Purchase Order raised", time: "Yesterday", color: "bg-blue-50" },
  { icon: <AlertCircle className="w-4 h-4 text-amber-500" />, text: "Compliance document renewal due in 15 days", time: "2 days ago", color: "bg-amber-50" },
  { icon: <Clock className="w-4 h-4 text-purple-500" />, text: "Contract extended for 6 months", time: "1 week ago", color: "bg-purple-50" },
  { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, text: "Annual vendor review completed", time: "2 weeks ago", color: "bg-emerald-50" },
];

const defaultContracts = [
  { name: "Master Supply Agreement", value: "₹1,80,00,000", progress: 20, status: "Active", end: "Mar 2026" },
  { name: "Enterprise Support Contract", value: "₹95,00,000", progress: 45, status: "Active", end: "Dec 2025" },
  { name: "Service Level Agreement", value: "₹1,20,00,000", progress: 74, status: "Active", end: "Aug 2025" },
];

function OverviewTab({ vendor }: { vendor: StoredVendor }) {
  const seed = parseInt(vendor.id.replace(/\D/g, "").slice(-3) || "1", 10);
  const spendData = generateSpendData(seed);

  const totalSpend = vendor.totalSpend
    ? fmt(vendor.totalSpend)
    : "₹0";
  const avgOrderValue = vendor.totalSpend
    ? fmt(Math.round(vendor.totalSpend / 156))
    : "₹0";

  const qualityScore = vendor.performanceQuality ?? 82;
  const deliveryScore = vendor.performanceDelivery ?? 88;
  const responsivenessScore = vendor.performanceResponsiveness ?? 79;
  const complianceScore = vendor.performanceCompliance ?? 91;
  const grandScore = Math.round((qualityScore + deliveryScore + responsivenessScore + complianceScore) / 4);

  return (
    <div className="flex flex-col gap-5">
      {/* Top 3-column info */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-800">Vendor Information</h3>
          </div>
          <div className="flex flex-col gap-2.5">
            {[
              { label: "Address", value: vendor.addressLine1 || vendor.address || "—" },
              { label: "City", value: vendor.city || "—" },
              { label: "State / Province", value: vendor.state || "—" },
              { label: "Zip / Postal Code", value: vendor.zipCode || "—" },
              { label: "Country", value: vendor.country || "India" },
              { label: "Website", value: vendor.website || "—" },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-start gap-2">
                <span className="text-xs text-gray-400 flex-shrink-0">{r.label}</span>
                <span className="text-xs font-medium text-gray-700 text-right">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-800">Additional Information</h3>
          </div>
          <div className="flex flex-col gap-2.5">
            {[
              { label: "Registration No.", value: vendor.registrationNo || "—" },
              { label: "Tax ID / GST", value: vendor.taxId || "—" },
              { label: "PAN Number", value: vendor.pan || "—" },
              { label: "Founded", value: vendor.founded || "—" },
              { label: "Employees", value: vendor.employees || "—" },
              { label: "Annual Revenue", value: vendor.annualRevenue || "—" },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-start gap-2">
                <span className="text-xs text-gray-400 flex-shrink-0">{r.label}</span>
                <span className="text-xs font-medium text-gray-700 text-right">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-800">Payment & Bank Details</h3>
          </div>
          <div className="flex flex-col gap-2.5">
            {[
              { label: "Payment Mode", value: vendor.paymentMode || "—" },
              { label: "Payment Terms", value: vendor.paymentTerms || "—" },
              { label: "Bank Account", value: vendor.bankAccount || "—" },
              { label: "IFSC Code", value: vendor.ifscCode || "—" },
              { label: "Bank Name", value: vendor.bankName || "—" },
              { label: "Branch", value: vendor.bankBranch || "—" },
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
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-800">Billing Address</h3>
          </div>
          <div className="flex flex-col gap-2.5">
            {[
              { label: "Address Line 1", value: vendor.billingAddressLine1 || vendor.addressLine1 || "—" },
              { label: "Address Line 2", value: vendor.billingAddressLine2 || vendor.addressLine2 || "—" },
              { label: "City", value: vendor.billingCity || vendor.city || "—" },
              { label: "State", value: vendor.billingState || vendor.state || "—" },
              { label: "Zip Code", value: vendor.billingZip || vendor.zipCode || "—" },
              { label: "Country", value: vendor.billingCountry || vendor.country || "India" },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-start gap-2">
                <span className="text-xs text-gray-400 flex-shrink-0">{r.label}</span>
                <span className="text-xs font-medium text-gray-700 text-right">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-semibold text-gray-800">Shipping Address</h3>
          </div>
          <div className="flex flex-col gap-2.5">
            {[
              { label: "Address Line 1", value: vendor.shippingAddressLine1 || vendor.addressLine1 || "—" },
              { label: "Address Line 2", value: vendor.shippingAddressLine2 || vendor.addressLine2 || "—" },
              { label: "City", value: vendor.shippingCity || vendor.city || "—" },
              { label: "State", value: vendor.shippingState || vendor.state || "—" },
              { label: "Zip Code", value: vendor.shippingZip || vendor.zipCode || "—" },
              { label: "Country", value: vendor.shippingCountry || vendor.country || "India" },
            ].map(r => (
              <div key={r.label} className="flex justify-between items-start gap-2">
                <span className="text-xs text-gray-400 flex-shrink-0">{r.label}</span>
                <span className="text-xs font-medium text-gray-700 text-right">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-800">Vendor Performance</h3>
          </div>
          <div className="flex flex-col gap-3.5">
            {[
              { label: "Quality", value: qualityScore, color: "bg-blue-500" },
              { label: "Delivery", value: deliveryScore, color: "bg-emerald-500" },
              { label: "Responsiveness", value: responsivenessScore, color: "bg-purple-500" },
              { label: "Compliance", value: complianceScore, color: "bg-indigo-500" },
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
              <span className="text-sm font-bold text-blue-600">{grandScore}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Contracts + Report Activity */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-gray-800">Active Contracts</h3>
            </div>
            <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full">3 Active</span>
          </div>
          <div className="flex flex-col gap-4">
            {defaultContracts.map((c, i) => (
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

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Newspaper className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-800">Report Activity</h3>
          </div>
          <div className="flex flex-col gap-0">
            {defaultActivities.map((a, i) => (
              <div key={i} className="flex gap-3 relative pb-4 last:pb-0">
                {i < defaultActivities.length - 1 && (
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

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpRight className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-800">Spend Metrics</h3>
          </div>
          <div className="flex flex-col gap-4">
            {[
              { label: "Total Spend", value: totalSpend, highlight: true },
              { label: "Category", value: vendor.category, highlight: false },
              { label: "Avg Order Value", value: avgOrderValue, highlight: false },
              { label: "Onboarded", value: vendor.onboardedDate, highlight: false },
              { label: "Region", value: vendor.region, highlight: false },
            ].map(m => (
              <div key={m.label} className="flex flex-col gap-0.5">
                <p className="text-xs text-gray-400">{m.label}</p>
                <p className={`text-sm font-bold ${m.highlight ? "text-blue-600" : "text-gray-800"}`}>{m.value}</p>
                {m.label !== "Region" && <div className="h-px bg-gray-50 mt-1" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { key: "overview", label: "Overview", icon: <Building2 className="w-3.5 h-3.5" /> },
  { key: "products", label: "Products", icon: <Package className="w-3.5 h-3.5" /> },
  { key: "orders", label: "Orders", icon: <ShoppingCart className="w-3.5 h-3.5" /> },
  { key: "services", label: "Services", icon: <DollarSign className="w-3.5 h-3.5" /> },
  { key: "performance", label: "Performance", icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { key: "contracts", label: "Contracts", icon: <ClipboardList className="w-3.5 h-3.5" /> },
  { key: "configuration", label: "Configuration", icon: <FileText className="w-3.5 h-3.5" /> },
  { key: "payments", label: "Payments", icon: <CreditCard className="w-3.5 h-3.5" /> },
  { key: "news", label: "News & Activity", icon: <Newspaper className="w-3.5 h-3.5" /> },
];

export default function VendorDetailPage() {
  const { id: vendorId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const vendor = vendorId ? getVendorById(vendorId) : undefined;

  useEffect(() => {
    const state = location.state as { tab?: string } | null;
    if (state?.tab) {
      setActiveTab(state.tab);
      window.history.replaceState({}, "");
    }
  }, [location.state]);

  if (!vendor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
          <Building2 className="w-7 h-7 text-red-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Vendor not found</h2>
          <p className="text-sm text-gray-400 mt-1">No vendor with ID <span className="font-mono">{vendorId}</span> exists.</p>
        </div>
        <button
          onClick={() => navigate("/vendors")}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Vendors
        </button>
      </div>
    );
  }

  const initials = vendor.name
    .split(" ")
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const qualityScore = vendor.performanceQuality ?? 82;
  const deliveryScore = vendor.performanceDelivery ?? 88;
  const responsivenessScore = vendor.performanceResponsiveness ?? 79;
  const complianceScore = vendor.performanceCompliance ?? 91;
  const grandScore = Math.round((qualityScore + deliveryScore + responsivenessScore + complianceScore) / 4);

  const stats = [
    { label: "Rating", value: `${vendor.rating}/5`, sub: "★".repeat(Math.round(vendor.rating)), accent: "text-amber-500" },
    { label: "Total Spend", value: vendor.totalSpend ? fmt(vendor.totalSpend) : "₹0", sub: "+12% YoY", accent: "text-blue-600" },
    { label: "Category", value: vendor.category, sub: vendor.region, accent: "text-gray-800" },
    { label: "On-Time Delivery", value: `${deliveryScore}%`, sub: "Last 12 months", accent: "text-emerald-600" },
    { label: "Quality Score", value: `${grandScore}%`, sub: "Avg last 3 reviews", accent: "text-indigo-600" },
    { label: "Status", value: vendor.status, sub: vendor.onboardedDate, accent: vendor.status === "Active" ? "text-emerald-600" : "text-gray-600" },
  ];

  const statusColor = {
    Active: "bg-emerald-100 text-emerald-700",
    Inactive: "bg-gray-100 text-gray-500",
    "On Hold": "bg-amber-100 text-amber-700",
    Pending: "bg-blue-100 text-blue-700",
  }[vendor.status] || "bg-gray-100 text-gray-500";

  return (
    <div className="min-h-screen bg-[#f5f6fa] font-[Inter,sans-serif] flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        {/* Vendor identity row */}
        <div className="px-6 pt-4 pb-3 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate("/vendors")}
              className="mt-1 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg font-bold text-gray-900">{vendor.name}</h1>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${statusColor}`}>
                  {vendor.status === "Active" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                  {vendor.status}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                {[vendor.id, vendor.category, vendor.region, `Onboard: ${vendor.onboardedDate}`].map((item, i) => (
                  <span key={i} className="text-xs text-gray-500 flex items-center gap-1">
                    {i > 0 && <span className="text-gray-300">·</span>}
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Primary contact + action */}
          <div className="flex items-start gap-6 flex-shrink-0">
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Primary Contact</p>
              <p className="text-sm font-semibold text-gray-800">{vendor.primaryContact}</p>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <Phone className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">{vendor.phone}</span>
              </div>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <Mail className="w-3 h-3 text-gray-400" />
                <a href={`mailto:${vendor.email}`} className="text-xs text-blue-500 hover:underline">{vendor.email}</a>
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

        {/* Tabs */}
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
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Page body */}
      <div className="flex-1 overflow-auto">
        {activeTab === "overview" && <div className="px-6 py-5"><OverviewTab vendor={vendor} /></div>}
        {activeTab === "products" && <VendorProductsPage />}
        {activeTab === "orders" && <VendorOrdersPage />}
        {activeTab === "services" && <VendorServicesPage />}
        {activeTab === "performance" && <VendorPerformancePage />}
        {activeTab === "contracts" && <VendorContractsPage />}
        {activeTab === "configuration" && <div className="px-6 py-5"><VendorConfigurationTab vendorId={vendor.id} /></div>}
        {activeTab === "payments" && <VendorPaymentsPage />}
        {activeTab === "news" && <VendorNewsActivityPage />}
      </div>
    </div>
  );
}
