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