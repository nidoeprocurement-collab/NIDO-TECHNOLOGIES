import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Download,
  Users,
  DollarSign,
  Construction,
  ShoppingCart,
  Building2,
  Globe,
  ChevronRight,
  FileText,
  Clock,
} from "lucide-react";
import RolesPage from "./ClientRolesPage";
import UsersPage from "./ClienUsersPage";
import OrdersPage from "./ClienOrdersPage";
import ServicesPage from "./ClienServicesPage";
import CatalogPage from "./ClienCatalogPage";
import ActivityPage from "./ClienActivityPage";
import ConfigurationPage from "./ClienConfigurationPage";

const monthlySpend = [
  { month: "Jan", value: 18000 },
  { month: "Feb", value: 22000 },
  { month: "Mar", value: 19000 },
  { month: "Apr", value: 25000 },
  { month: "May", value: 21000 },
  { month: "Jun", value: 28000 },
  { month: "Jul", value: 32000 },
  { month: "Aug", value: 38000 },
  { month: "Sep", value: 45000 },
  { month: "Oct", value: 52000 },
  { month: "Nov", value: 58000 },
  { month: "Dec", value: 60000 },
];

const spendCategories = [
  { name: "Hardware", value: 45, amount: "$200,250", color: "#3b82f6" },
  { name: "Software", value: 30, amount: "$30,300", color: "#22c55e" },
  { name: "Service", value: 15, amount: "$15,300", color: "#f97316" },
  { name: "Other", value: 10, amount: "$10,500", color: "#a855f7" },
];

const tabs = ["Overview", "Roles", "Users", "Orders", "Services", "Catalog", "Activity", "Configuration"];

function DonutChart({ categories, size }: { categories: typeof spendCategories; size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.45;
  const innerR = size * 0.28;
  const total = categories.reduce((s, c) => s + c.value, 0);
  let angle = -Math.PI / 2;

  const slices = categories.map((cat) => {
    const sweep = (cat.value / total) * 2 * Math.PI;
    const x1 = cx + outerR * Math.cos(angle);
    const y1 = cy + outerR * Math.sin(angle);
    const x2 = cx + outerR * Math.cos(angle + sweep);
    const y2 = cy + outerR * Math.sin(angle + sweep);
    const ix1 = cx + innerR * Math.cos(angle + sweep);
    const iy1 = cy + innerR * Math.sin(angle + sweep);
    const ix2 = cx + innerR * Math.cos(angle);
    const iy2 = cy + innerR * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    const d = `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${large} 0 ${ix2} ${iy2} Z`;
    angle += sweep;
    return { d, color: cat.color, name: cat.name };
  });

  return (
    <svg width={size} height={size}>
      {slices.map((s) => (
        <path key={s.name} d={s.d} fill={s.color} stroke="white" strokeWidth={1} />
      ))}
    </svg>
  );
}

function PlaceholderPage({ tab }: { tab: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
        <Construction size={28} className="text-blue-400" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-800">{tab}</h2>
        <p className="text-sm text-gray-400 mt-1">This section is ready — data coming soon.</p>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("Overview");
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const isOverview = activeTab === "Overview";

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Page header */}
      <div className="px-6 pt-5 pb-0">
        <h1 className="text-lg font-semibold text-gray-900">Nitin Supplies</h1>
      </div>

      <div className="flex gap-0 p-4 pt-3 min-h-[calc(100vh-48px)]">
        {/* LEFT SIDEBAR — only on Overview */}
        {isOverview && sidebarVisible && (
          <aside className="w-64 shrink-0 bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4 mr-4 h-fit relative">
            {/* Hide button */}
            <button
              onClick={() => setSidebarVisible(false)}
              title="Hide panel"
              className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            </button>

            {/* Avatar */}
            <div className="flex flex-col items-center gap-2 pt-2">
              <div className="w-16 h-16 rounded-full border-2 border-blue-500 flex items-center justify-center bg-white">
                <span className="text-blue-600 font-bold text-lg">NS</span>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900 text-sm">Nitin Supplies</p>
                <p className="text-xs text-gray-500">Premium Client • Since 2026</p>
              </div>
            </div>

            {/* Contact info */}
            <div className="flex flex-col gap-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <Mail size={13} className="text-gray-400 shrink-0" />
                <span>nitinshetty@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-gray-400 shrink-0" />
                <span>080-4000017</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={13} className="text-gray-400 shrink-0" />
                <span>No address</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={13} className="text-gray-400 shrink-0" />
                <span>N/A</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-1.5 border border-gray-300 rounded-lg py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                <Mail size={12} />
                Email
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 border border-gray-300 rounded-lg py-1.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                <Phone size={12} />
                Call
              </button>
            </div>

            {/* Contract Progress */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs text-gray-600">Contract Progress</span>
                <span className="text-xs text-gray-500">0 days left</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "100%" }} />
              </div>
            </div>

            {/* Client meta */}
            <div className="flex justify-between text-xs">
              <div>
                <p className="text-gray-500">Client Since</p>
                <p className="font-medium text-gray-800">Jun 2026</p>
              </div>
              <div>
                <p className="text-gray-500">Client ID</p>
                <p className="font-medium text-gray-800">CI-00020</p>
              </div>
            </div>

            {/* Download button */}
            <button className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-lg py-2 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors">
              <Download size={13} />
              Download Profile
            </button>
          </aside>
        )}

        {/* Show sidebar button — visible when sidebar is hidden */}
        {isOverview && !sidebarVisible && (
          <button
            onClick={() => setSidebarVisible(true)}
            title="Show panel"
            className="mr-3 mt-1 w-7 h-7 shrink-0 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors self-start"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        )}

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Stats row — only on Overview */}
          {isOverview && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <Users size={16} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900 leading-tight">24</p>
                    <p className="text-xs text-gray-400 mt-0.5">12 Active</p>
                    <p className="text-xs text-gray-400">3 Pending Invites</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-green-50">
                    <DollarSign size={16} className="text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Spends</p>
                    <p className="text-2xl font-bold text-gray-900 leading-tight">$101,000</p>
                    <p className="text-xs text-gray-400 mt-0.5">Year to date</p>
                    <p className="text-xs text-gray-400">Last Payment: $25,000</p>
                    <p className="text-xs text-gray-400">Jan 11, 2026</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-orange-50">
                    <ShoppingCart size={16} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Open Orders</p>
                    <p className="text-2xl font-bold text-gray-900 leading-tight">3</p>
                    <p className="text-xs text-gray-400 mt-0.5">$32,500 value</p>
                    <p className="text-xs text-gray-400">Contracts</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-xl border border-gray-200 px-4">
            <div className="flex border-b border-gray-100">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                    activeTab === tab
                      ? "text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Non-overview tab content */}
          {!isOverview && (
            <div className="bg-white rounded-xl border border-gray-200 flex-1">
              {activeTab === "Roles" ? <RolesPage /> : activeTab === "Users" ? <UsersPage /> : activeTab === "Orders" ? <OrdersPage /> : activeTab === "Services" ? <ServicesPage /> : activeTab === "Catalog" ? <CatalogPage /> : activeTab === "Activity" ? <ActivityPage /> : activeTab === "Configuration" ? <ConfigurationPage /> : <PlaceholderPage tab={activeTab} />}
            </div>
          )}

          {/* Overview panels */}
          {isOverview && (
            <>
              <div className="grid grid-cols-3 gap-4">
                {/* Company Details */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900 text-sm mb-4">Company Details</h3>
                  <div className="flex flex-col gap-3 text-xs text-gray-700">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-gray-400 shrink-0" />
                      <span>Nitin Supplies</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-gray-400 shrink-0" />
                      <span>Technology</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-gray-400 shrink-0" />
                      <span>51-200 employees</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-gray-400">Website</span>
                      <div className="flex items-center gap-2">
                        <Globe size={14} className="text-gray-400 shrink-0" />
                        <a href="#" className="text-blue-500 hover:underline">www.nitinsupplies.com</a>
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-gray-400">Phone</span>
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-gray-400 shrink-0" />
                        <span>080-4000017</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-gray-400">Billing Email</span>
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-gray-400 shrink-0" />
                        <a href="#" className="text-blue-500 hover:underline">nitinshetty@gmail.com</a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Spending Overview */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm">Spending Overview</h3>
                    <span className="text-xs border border-gray-200 rounded-md px-2 py-0.5 text-gray-500">This Year</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">$101,000</p>
                  <p className="text-xs text-gray-400 mb-1">Total Spend</p>
                  <p className="text-xs text-green-500 font-medium mb-3">+12.5% vs last year</p>
                  <ResponsiveContainer width="100%" height={130}>
                    <BarChart data={monthlySpend} barSize={10} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <XAxis key="spend-xaxis" dataKey="month" tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                      <YAxis key="spend-yaxis" tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}K`} />
                      <Tooltip
                        key="spend-tooltip"
                        formatter={(v: number) => [`$${v.toLocaleString()}`, "Spend"]}
                        contentStyle={{ fontSize: 11, borderRadius: 6, border: "1px solid #e5e7eb" }}
                      />
                      <Bar key="spend-bar" dataKey="value" fill="#3b82f6" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Top Spend Categories */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900 text-sm mb-4">Top Spend Categories</h3>
                  <div className="flex items-center gap-4">
                    <div className="shrink-0">
                      <DonutChart categories={spendCategories} size={100} />
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      {spendCategories.map((cat) => (
                        <div key={cat.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                            <span className="text-gray-600">{cat.name} {cat.value}%</span>
                          </div>
                          <span className="text-gray-800 font-medium">{cat.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom row */}
              <div className="grid grid-cols-3 gap-4">
                {/* User Summary */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Users size={15} className="text-gray-400" />
                      <h3 className="font-semibold text-gray-900 text-sm">User Summary</h3>
                    </div>
                    <ChevronRight size={15} className="text-gray-400" />
                  </div>
                  <div className="flex items-end gap-6">
                    <div>
                      <Users size={22} className="text-gray-300 mb-1" />
                      <p className="text-2xl font-bold text-gray-900">24</p>
                      <p className="text-xs text-gray-400">Total Users</p>
                    </div>
                    <div className="flex gap-4 pb-1">
                      <div className="text-center">
                        <p className="text-xl font-bold text-green-500">12</p>
                        <p className="text-xs text-gray-400">Active</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-bold text-orange-400">4</p>
                        <p className="text-xs text-gray-400">Inactive</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <ShoppingCart size={15} className="text-gray-400" />
                      <h3 className="font-semibold text-gray-900 text-sm">Recent Orders</h3>
                    </div>
                    <ChevronRight size={15} className="text-gray-400" />
                  </div>
                  <div className="flex items-end gap-6">
                    <div>
                      <ShoppingCart size={22} className="text-gray-300 mb-1" />
                      <p className="text-2xl font-bold text-gray-900">3</p>
                      <p className="text-xs text-gray-400">Open Orders</p>
                    </div>
                    <div className="pb-1">
                      <p className="text-xl font-bold text-gray-900">$32,500</p>
                      <p className="text-xs text-gray-400">Total Value</p>
                    </div>
                  </div>
                </div>

                {/* Active Services */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Clock size={15} className="text-gray-400" />
                      <h3 className="font-semibold text-gray-900 text-sm">Active Services</h3>
                    </div>
                    <ChevronRight size={15} className="text-gray-400" />
                  </div>
                  <div className="flex items-end gap-6">
                    <div>
                      <FileText size={22} className="text-gray-300 mb-1" />
                      <p className="text-2xl font-bold text-gray-900">2</p>
                      <p className="text-xs text-gray-400">Active Contracts</p>
                    </div>
                    <div className="pb-1">
                      <p className="text-xl font-bold text-blue-500">0 days</p>
                      <p className="text-xs text-gray-400">Until Renewal</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
