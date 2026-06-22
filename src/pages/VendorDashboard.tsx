import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Users, Star, Truck, Award,
  Plus, CreditCard,
  BarChart2, Download, Settings, Bell, Upload,
  IndianRupee, UserCheck,
} from "lucide-react";

// ─── Color Palette ──────────────────────────────────────────────
const C = {
  blue:   "#4B7BE5",
  green:  "#28C76F",
  orange: "#FF9F43",
  red:    "#EA5455",
  purple: "#7367F0",
  cyan:   "#00CFE8",
  gray:   "#ADB5BD",
};

// ─── Data ───────────────────────────────────────────────────────
const spendByVendorData = [
  { name: "Dell Technologies", value: 40.6 },
  { name: "HP India",          value: 19.4 },
  { name: "Lenovo India",      value: 15.2 },
  { name: "Canon Supplies",    value: 9.8  },
  { name: "Cisco Systems",     value: 9.2  },
  { name: "Honeywell",         value: 7.4  },
  { name: "ViewSonic Corp",    value: 5.9  },
  { name: "Logitech India",    value: 4.2  },
  { name: "Samsung India",     value: 3.8  },
  { name: "Others",            value: 2.5  },
];

const vendorRankingData = [
  { name: "Dell Technologies", category: "IT Hardware",     quality: 4.8, delivery: 98.2 },
  { name: "HP India",          category: "IT Hardware",     quality: 4.5, delivery: 95.8 },
  { name: "Lenovo India",      category: "IT Hardware",     quality: 4.3, delivery: 92.1 },
  { name: "Canon Supplies",    category: "Office Supplies", quality: 4.6, delivery: 96.4 },
  { name: "Cisco Systems",     category: "Networking",      quality: 4.7, delivery: 94.0 },
  { name: "Honeywell",         category: "Peripherals",     quality: 3.9, delivery: 87.5 },
  { name: "ViewSonic Corp",    category: "IT Hardware",     quality: 4.2, delivery: 90.3 },
  { name: "Microsoft India",   category: "Software",        quality: 4.6, delivery: 97.0 },
  { name: "Logitech India",    category: "Peripherals",     quality: 4.4, delivery: 93.5 },
  { name: "Seagate India",     category: "Storage",         quality: 4.1, delivery: 89.2 },
  { name: "Samsung India",     category: "IT Hardware",     quality: 4.5, delivery: 94.8 },
  { name: "LG Electronics",    category: "Displays",        quality: 4.3, delivery: 91.6 },
];

const slaVendorData = [
  { vendor: "Dell Technologies", category: "IT Hardware",     sla: 98.2, target: 95, tickets: 124, resolved: 122, status: "Met"    },
  { vendor: "HP India",          category: "IT Hardware",     sla: 95.8, target: 95, tickets: 87,  resolved: 83,  status: "Met"    },
  { vendor: "Canon Supplies",    category: "Office Supplies", sla: 96.4, target: 95, tickets: 52,  resolved: 50,  status: "Met"    },
  { vendor: "Cisco Systems",     category: "Networking",      sla: 94.0, target: 95, tickets: 68,  resolved: 64,  status: "Missed" },
  { vendor: "Lenovo India",      category: "IT Hardware",     sla: 92.1, target: 95, tickets: 95,  resolved: 88,  status: "Missed" },
  { vendor: "Honeywell",         category: "Peripherals",     sla: 87.5, target: 90, tickets: 40,  resolved: 35,  status: "Missed" },
  { vendor: "ViewSonic Corp",    category: "IT Hardware",     sla: 90.3, target: 90, tickets: 31,  resolved: 28,  status: "Met"    },
];

const slaData = [
  { name: "Met",    value: 91, color: "#2B2D42" },
  { name: "Missed", value: 9,  color: "#E5E7EB"  },
];

const activities = [
  { text: "Dell Latitude 5440 Laptop",     sub: "PO-10027 received & verified",      time: "2h ago",  color: C.green  },
  { text: "HP LaserJet M404dn printer",    sub: "New vendor onboarding completed",    time: "4h ago",  color: C.blue   },
  { text: "Lenovo ThinkPad E14 Gen 4",     sub: "Quality assessment: 4.8/5",          time: "6h ago",  color: C.green  },
  { text: "Canon imageCLASS MF3010",       sub: "Contract renewed for 1 year",        time: "1d ago",  color: C.orange },
  { text: "Cisco Catalyst 9200 Switch",    sub: "Invoice approved & processed",       time: "1d ago",  color: C.blue   },
];

const spendCategoryData = [
  { name: "IT Hardware",     value: 52, color: C.blue   },
  { name: "Office Supplies", value: 18, color: C.orange },
  { name: "Networking",      value: 12, color: C.purple },
  { name: "Accessories",     value: 10, color: C.green  },
  { name: "Others",          value: 8,  color: C.gray   },
];

const orderStatusData = [
  { name: "Processing", value: 152, color: C.orange },
  { name: "In Transit", value: 245, color: C.blue   },
  { name: "Delivered",  value: 421, color: C.green  },
  { name: "Cancelled",  value: 40,  color: C.red    },
];

const recentOrdersData = [
  { vendor: "Dell Technologies", category: "IT Hardware",     amount: "₹4.20 Cr", date: "Apr 15", status: "Delivered",   sc: C.green  },
  { vendor: "HP India",          category: "IT Hardware",     amount: "₹1.85 Cr", date: "Apr 12", status: "In Transit",  sc: C.blue   },
  { vendor: "Lenovo India",      category: "IT Hardware",     amount: "₹2.10 Cr", date: "Apr 10", status: "Processing",  sc: C.orange },
  { vendor: "Canon Supplies",    category: "Office Supplies", amount: "₹0.45 Cr", date: "Apr 08", status: "Delivered",   sc: C.green  },
  { vendor: "Cisco Systems",     category: "Networking",      amount: "₹1.20 Cr", date: "Apr 05", status: "Delivered",   sc: C.green  },
];

const topVendorsData = [
  { rank: 1, name: "Dell Technologies", score: 9.8, color: C.blue   },
  { rank: 2, name: "Canon Supplies",    score: 9.4, color: C.green  },
  { rank: 3, name: "Cisco Systems",     score: 9.1, color: C.purple },
  { rank: 4, name: "HP India",          score: 8.9, color: C.orange },
  { rank: 5, name: "ViewSonic Corp",    score: 8.7, color: C.cyan   },
];

const contractPieData = [
  { name: "Active",   value: 89, color: C.green  },
  { name: "Expiring", value: 23, color: C.orange },
  { name: "Expired",  value: 12, color: C.red    },
  { name: "Renewal",  value: 4,  color: C.blue   },
];

const paymentChartData = [
  { month: "Oct", paid: 1.2, pending: 0.4 },
  { month: "Nov", paid: 0.9, pending: 0.3 },
  { month: "Dec", paid: 1.8, pending: 0.6 },
  { month: "Jan", paid: 1.1, pending: 0.2 },
  { month: "Feb", paid: 1.4, pending: 0.5 },
  { month: "Mar", paid: 0.7, pending: 0.1 },
];

const riskData = [
  { level: "Low",      count: 342, pct: 65, color: C.green  },
  { level: "Medium",   count: 128, pct: 25, color: C.orange },
  { level: "High",     count: 42,  pct: 8,  color: C.red    },
  { level: "Critical", count: 12,  pct: 2,  color: "#7B1A1A"},
];

const deliveryPieData = [
  { name: "On-time", value: 147, color: C.green },
  { name: "Early",   value: 5,   color: C.blue  },
  { name: "Late",    value: 4,   color: C.red   },
];

const qualityPieData = [
  { name: "Excellent (5)", value: 102, color: C.green  },
  { name: "Good (4)",      value: 38,  color: C.blue   },
  { name: "Average (3)",   value: 10,  color: C.orange },
  { name: "Poor",          value: 6,   color: C.red    },
];

const performanceCatData = [
  { category: "Laptops",      spend: "₹5.42 Cr", orders: 90, onTime: "98.8%", quality: "4.7 / 5", returnRate: "0.8%", growth: "+12.3%", pos: true  },
  { category: "Monitors",     spend: "₹1.9 Cr",  orders: 81, onTime: "93.2%", quality: "4.3 / 5", returnRate: "0.9%", growth: "+8.7%",  pos: true  },
  { category: "Accessories",  spend: "₹1.1 Cr",  orders: 33, onTime: "88.8%", quality: "4.4 / 5", returnRate: "0.7%", growth: "+16.4%", pos: true  },
  { category: "Networking",   spend: "₹0.63 Cr", orders: 18, onTime: "80.0%", quality: "4.2 / 5", returnRate: "3.4%", growth: "-3.4%",  pos: false },
  { category: "Peripherals",  spend: "₹1.26 Cr", orders: 9,  onTime: "31.3%", quality: "—",        returnRate: "1.9%", growth: "+5.4%",  pos: true  },
];

const topProductsData = [
  { rank: 1, name: "Dell Latitude 5440 Laptop",    amount: "₹3.20 Cr", pct: 25.7 },
  { rank: 2, name: "Dell 24 Monitor - P2422H",     amount: "₹2.14 Cr", pct: 17.2 },
  { rank: 3, name: "Dell WD19 Docking Station",    amount: "₹1.89 Cr", pct: 15.1 },
  { rank: 4, name: "Dell OptiPlex 7020",           amount: "₹1.45 Cr", pct: 11.6 },
  { rank: 5, name: "Dell PowerEdge T350",          amount: "₹1.12 Cr", pct: 9.0  },
];

const recentIssuesData = [
  { issue: "Delayed delivery for PO-10027",       date: "Apr 09, 2026", status: "Closed",   sc: "#6C757D" },
  { issue: "Quality Issue in Monitor P2422H",     date: "Mar 18, 2026", status: "Resolved", sc: C.green  },
  { issue: "Missing items in shipment",           date: "Feb 27, 2026", status: "Closed",   sc: "#6C757D" },
  { issue: "Invoice discrepancy in PO-10018",     date: "Feb 10, 2026", status: "Closed",   sc: "#6C757D" },
];

// ─── Helper ─────────────────────────────────────────────────────
function qColor(q: number) {
  if (q >= 4.5) return C.green;
  if (q >= 4.0) return C.blue;
  if (q >= 3.5) return C.orange;
  return C.red;
}

// ─── Shared UI Primitives ────────────────────────────────────────
function SCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

function SHead({ title, link }: { title: string; link?: string }) {
  return (
    <div className="flex justify-between items-center px-3 py-1.5 border-b border-gray-100">
      <span className="text-[11px] font-semibold text-gray-700">{title}</span>
      {link && (
        <span className="text-[10px] text-blue-500 cursor-pointer hover:text-blue-600">
          {link} →
        </span>
      )}
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────
export default function App() {
  const totalOrders = orderStatusData.reduce((s, d) => s + d.value, 0);

  const kpis = [
    { label: "Total Vendors",          value: "524",     Icon: Users,       color: C.blue,   sub: "+12 this month"        },
    { label: "Active Vendors",         value: "482",     Icon: UserCheck,   color: C.green,  sub: "91.6% active"          },
    { label: "Preferred Vendors",      value: "128",     Icon: Star,        color: C.orange, sub: "26.6% of total"        },
    { label: "Vendor Spend",           value: "₹12.5 Cr",Icon: IndianRupee, color: C.red,    sub: "This Financial Year"   },
    { label: "On-Time Delivery Count", value: "94.2%",   Icon: Truck,       color: C.cyan,   sub: "Last 90 days"          },
    { label: "Avg Quality Score",      value: "4.6 / 5", Icon: Award,       color: C.purple, sub: "Based on 156 orders"   },
  ];

  const quickActions = [
    { Icon: Plus,      label: "Create PO",  color: C.blue   },
    { Icon: Users,     label: "New Vendor", color: C.green  },
    { Icon: CreditCard,label: "Payment",    color: C.orange },
    { Icon: BarChart2, label: "Analytics",  color: C.purple },
    { Icon: Upload,    label: "Import",     color: C.cyan   },
    { Icon: Download,  label: "Export",     color: C.gray   },
    { Icon: Bell,      label: "Alerts",     color: C.red    },
    { Icon: Settings,  label: "Settings",   color: "#6C757D"},
  ];

  return (
    <div
      className="min-h-screen p-2.5 space-y-2"
      style={{ backgroundColor: "#F4F6F9", fontFamily: "'Inter', sans-serif" }}
    >

      {/* ═══ ROW 1: KPI Cards ═══════════════════════════════════════ */}
      <div className="flex gap-2">
        {kpis.map(({ label, value, Icon, color, sub }) => (
          <SCard key={label} className="flex-1 px-3 py-2">
            <div className="flex items-center gap-2">
              <div
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: color + "22" }}
              >
                <Icon size={14} style={{ color }} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-500 truncate leading-tight">{label}</p>
                <p className="text-[13px] font-bold text-gray-800 leading-snug">{value}</p>
                <p className="text-[9px] text-gray-400 leading-tight">{sub}</p>
              </div>
            </div>
          </SCard>
        ))}
      </div>

      {/* ═══ ROW 2: Spend by Vendor + SLA | Ranking | Activities ═══ */}
      <div className="flex gap-2">

        {/* Spend by Vendor + SLA Compliance below */}
        <SCard className="flex-[2.2]">
          <SHead title="Spend by Vendor (Top 10)" link="View All" />
          <div className="p-1 pt-2">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={spendByVendorData}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 80, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 8, fill: "#9CA3AF" }}
                  tickFormatter={(v) => `₹${v}Cr`}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 9, fill: "#374151" }}
                  width={80}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v: number) => [`₹${v} Cr`, "Spend"]}
                  contentStyle={{ fontSize: 10, padding: "4px 8px", borderRadius: 6 }}
                />
                <Bar dataKey="value" fill={C.blue} radius={[0, 3, 3, 0]} barSize={11} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* SLA Compliance — detailed section below the chart */}
          <div className="border-t border-gray-100 mt-1">
            <div className="flex items-center justify-between px-3 pt-2 pb-1">
              <p className="text-[10px] font-semibold text-gray-700">SLA Compliance</p>
              <span className="text-[9px] text-blue-500 cursor-pointer hover:underline">View All</span>
            </div>
            <div className="flex gap-3 px-3 pb-3">
              {/* Donut gauge */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="relative">
                  <PieChart width={84} height={84}>
                    <Pie
                      data={slaData}
                      cx={42} cy={42}
                      innerRadius={28} outerRadius={40}
                      startAngle={90} endAngle={-270}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {slaData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                  </PieChart>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-bold text-gray-800">91%</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-0.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#2B2D42" }} />
                    <span className="text-[8px] text-gray-500">Met</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                    <span className="text-[8px] text-gray-500">Missed</span>
                  </div>
                </div>
                <div className="text-center mt-0.5">
                  <p className="text-[9px] font-semibold text-gray-700">SLA Met</p>
                  <p className="text-[8px] text-red-400">9% Missed</p>
                </div>
              </div>

              {/* Vendor-level SLA table */}
              <div className="flex-1 min-w-0">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-[8px] text-gray-500">
                      <th className="text-left py-1 px-1.5 font-medium rounded-l">Vendor</th>
                      <th className="text-left py-1 px-1 font-medium">Category</th>
                      <th className="text-center py-1 px-1 font-medium">SLA %</th>
                      <th className="text-center py-1 px-1 font-medium">Tickets</th>
                      <th className="text-center py-1 px-1 font-medium rounded-r">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slaVendorData.map((row, i) => (
                      <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                        <td className="py-1 px-1.5 text-[8px] font-medium text-gray-700 max-w-[90px]">
                          <span className="block truncate">{row.vendor}</span>
                        </td>
                        <td className="py-1 px-1 text-[8px] text-gray-500 max-w-[70px]">
                          <span className="block truncate">{row.category}</span>
                        </td>
                        <td className="py-1 px-1 text-center">
                          <span className="text-[8px] font-semibold" style={{ color: row.sla >= row.target ? C.green : C.red }}>
                            {row.sla}%
                          </span>
                        </td>
                        <td className="py-1 px-1 text-center text-[8px] text-gray-500">
                          {row.resolved}/{row.tickets}
                        </td>
                        <td className="py-1 px-1 text-center">
                          <span
                            className="text-[7px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{
                              color: row.status === "Met" ? C.green : C.red,
                              backgroundColor: (row.status === "Met" ? C.green : C.red) + "18",
                            }}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </SCard>

        {/* Vendor Performance Ranking — all rows filled */}
        <SCard className="flex-[1.6]">
          <SHead title="Vendor Performance Ranking" link="View All" />
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-[9px] text-gray-500">
                <th className="text-left py-1.5 px-2 font-medium">#</th>
                <th className="text-left py-1.5 px-1 font-medium">Name</th>
                <th className="text-left py-1.5 px-1 font-medium">Category</th>
                <th className="text-center py-1.5 px-1 font-medium">Quality</th>
                <th className="text-center py-1.5 px-1 font-medium">Delivery</th>
              </tr>
            </thead>
            <tbody>
              {vendorRankingData.map((v, i) => (
                <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="py-1.5 px-2 text-[9px] text-gray-400 font-mono">{i + 1}</td>
                  <td className="py-1.5 px-1 text-[9px] font-medium text-gray-700 max-w-[80px]">
                    <span className="block truncate">{v.name}</span>
                  </td>
                  <td className="py-1.5 px-1 text-[9px] text-gray-500 max-w-[65px]">
                    <span className="block truncate">{v.category}</span>
                  </td>
                  <td className="py-1.5 px-1 text-center">
                    <span
                      className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                      style={{ color: qColor(v.quality), backgroundColor: qColor(v.quality) + "20" }}
                    >
                      {v.quality}
                    </span>
                  </td>
                  <td className="py-1.5 px-1 text-[9px] text-center text-gray-600">{v.delivery}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SCard>

        {/* Right column: Recent Activities — stretched full height */}
        <div className="flex flex-col gap-2" style={{ width: 160, minWidth: 160 }}>
          <SCard className="flex-1">
            <SHead title="Recent Activities" />
            <div className="px-2 py-1.5 space-y-2">
              {[...activities, ...activities].slice(0, 9).map((a, i) => (
                <div key={i} className="flex gap-1.5 items-start">
                  <div className="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: a.color }} />
                  <div className="min-w-0">
                    <p className="text-[8px] font-medium text-gray-700 truncate">{a.text}</p>
                    <p className="text-[8px] text-gray-400 truncate">{a.sub}</p>
                    <p className="text-[8px] text-gray-300">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </SCard>
        </div>
      </div>

      {/* ═══ ROW 3: Spend by Category | NPS | Order Status | Recent Orders | Top Vendors ═══ */}
      <div className="flex gap-2">

        {/* Spend by Category */}
        <SCard style={{ width: 148, minWidth: 148 }}>
          <SHead title="Spend by Category" />
          <div className="p-2 flex flex-col items-center">
            <PieChart width={90} height={90}>
              <Pie
                data={spendCategoryData}
                cx={45} cy={45}
                innerRadius={24} outerRadius={42}
                dataKey="value"
                paddingAngle={2}
              >
                {spendCategoryData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
            </PieChart>
            <div className="mt-1.5 w-full space-y-0.5">
              {spendCategoryData.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-[8px] text-gray-600">{d.name}</span>
                  </div>
                  <span className="text-[8px] font-semibold text-gray-700">{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </SCard>

        {/* NPS Status */}
        <SCard style={{ width: 130, minWidth: 130 }}>
          <SHead title="NPS Status" />
          <div className="p-2">
            <div className="text-center mb-2">
              <span className="text-2xl font-bold text-gray-800">52</span>
              <p className="text-[8px] text-gray-500">NPS Score</p>
            </div>
            <div className="space-y-1.5">
              {[
                { label: "Promoters",  pct: 70, color: C.green  },
                { label: "Passives",   pct: 12, color: "#FFC107" },
                { label: "Detractors", pct: 18, color: C.red    },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[8px] text-gray-600">{item.label}</span>
                    <span className="text-[8px] font-semibold" style={{ color: item.color }}>{item.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[8px] text-gray-500 mt-2 text-center">
              Detractors: <span className="font-bold text-red-500">18</span>
            </p>
          </div>
        </SCard>

        {/* Order Status */}
        <SCard style={{ width: 148, minWidth: 148 }}>
          <SHead title="Order Status" />
          <div className="p-2 flex flex-col items-center">
            <div className="relative">
              <PieChart width={90} height={90}>
                <Pie
                  data={orderStatusData}
                  cx={45} cy={45}
                  innerRadius={24} outerRadius={42}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {orderStatusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-gray-800">304</span>
                <span className="text-[7px] text-gray-500">Processing</span>
              </div>
            </div>
            <div className="mt-1.5 w-full space-y-0.5">
              {orderStatusData.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-[8px] text-gray-600">{d.name}</span>
                  </div>
                  <span className="text-[8px] font-semibold text-gray-700">{d.value}</span>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-0.5 flex justify-between">
                <span className="text-[8px] font-medium text-gray-600">Total</span>
                <span className="text-[8px] font-bold text-gray-800">{totalOrders}</span>
              </div>
            </div>
          </div>
        </SCard>

        {/* Recent Vendor Orders */}
        <SCard className="flex-1">
          <SHead title="Recent Vendor Orders" link="View All" />
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-[9px] text-gray-500">
                <th className="text-left py-1.5 px-2 font-medium">Vendor</th>
                <th className="text-left py-1.5 px-1 font-medium">Date</th>
                <th className="text-right py-1.5 px-1 font-medium">Amount</th>
                <th className="text-center py-1.5 px-1 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrdersData.map((r, i) => (
                <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="py-1.5 px-2">
                    <p className="text-[9px] font-medium text-gray-700 truncate max-w-[90px]">{r.vendor}</p>
                    <p className="text-[8px] text-gray-400">{r.category}</p>
                  </td>
                  <td className="py-1.5 px-1 text-[9px] text-gray-500">{r.date}</td>
                  <td className="py-1.5 px-1 text-[9px] text-right font-medium text-gray-700">{r.amount}</td>
                  <td className="py-1.5 px-1 text-center">
                    <span
                      className="text-[8px] font-medium px-1.5 py-0.5 rounded-full"
                      style={{ color: r.sc, backgroundColor: r.sc + "20" }}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SCard>

        {/* Top Performing Vendors */}
        <SCard style={{ width: 150, minWidth: 150 }}>
          <SHead title="Top Performing Vendors" />
          <div className="px-2 py-1.5 space-y-1.5">
            {topVendorsData.map((v) => (
              <div key={v.rank} className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold text-gray-400 w-3 shrink-0">{v.rank}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-medium text-gray-700 truncate">{v.name}</p>
                </div>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                  style={{ color: v.color, backgroundColor: v.color + "20" }}
                >
                  {v.score}
                </span>
              </div>
            ))}
          </div>
        </SCard>
      </div>

      {/* ═══ ROW 4: Contract Summary | Payment Summary | Risk Monitor | Quick Actions ═══ */}
      <div className="flex gap-2">

        {/* Contract Summary */}
        <SCard style={{ width: 190, minWidth: 190 }}>
          <SHead title="Contract Summary" link="View All" />
          <div className="p-2 flex gap-2 items-center">
            <PieChart width={64} height={64}>
              <Pie
                data={contractPieData}
                cx={32} cy={32}
                innerRadius={18} outerRadius={30}
                dataKey="value"
                paddingAngle={2}
              >
                {contractPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
            </PieChart>
            <div className="flex-1 grid grid-cols-2 gap-1">
              {contractPieData.map((d) => (
                <div key={d.name} className="text-center p-1 rounded" style={{ backgroundColor: d.color + "18" }}>
                  <p className="text-sm font-bold leading-tight" style={{ color: d.color }}>{d.value}</p>
                  <p className="text-[8px] text-gray-500">{d.name}</p>
                </div>
              ))}
            </div>
          </div>
        </SCard>

        {/* Payment Summary */}
        <SCard className="flex-[1.8]">
          <SHead title="Payment Summary" link="View All" />
          <div className="px-3 pt-1.5 flex justify-between">
            <div>
              <span className="text-xs font-bold text-gray-800">₹1.8 Cr</span>
              <span className="text-[9px] text-gray-500 ml-1">Pending</span>
            </div>
            <div>
              <span className="text-xs font-bold text-gray-700">₹42 Lakh</span>
              <span className="text-[9px] text-gray-500 ml-1">This month</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={72}>
            <BarChart data={paymentChartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 8, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 8, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: number, n: string) => [`₹${v}Cr`, n === "paid" ? "Paid" : "Pending"]}
                contentStyle={{ fontSize: 9, padding: "2px 6px", borderRadius: 4 }}
              />
              <Bar dataKey="paid"    fill={C.blue}   radius={[2,2,0,0]} barSize={7} />
              <Bar dataKey="pending" fill={C.orange} radius={[2,2,0,0]} barSize={7} />
            </BarChart>
          </ResponsiveContainer>
        </SCard>

        {/* Risk Monitor */}
        <SCard className="flex-[1.4]">
          <SHead title="Risk Monitor" link="View All" />
          <div className="p-3 space-y-2">
            {riskData.map((r) => (
              <div key={r.level}>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[9px] text-gray-600">{r.level}</span>
                  <span className="text-[9px] font-medium text-gray-700">{r.count} ({r.pct}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${r.pct}%`, backgroundColor: r.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SCard>

        {/* Quick Actions */}
        <SCard className="flex-[1.2]">
          <SHead title="Quick Actions" />
          <div className="p-2 grid grid-cols-4 gap-1.5">
            {quickActions.map(({ Icon, label, color }) => (
              <div key={label} className="flex flex-col items-center gap-0.5 cursor-pointer group">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-150"
                  style={{ backgroundColor: color + "20" }}
                >
                  <Icon size={13} style={{ color }} />
                </div>
                <span className="text-[8px] text-gray-500 text-center leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </SCard>
      </div>

      {/* ═══ ROW 5: Delivery Performance | Quality Performance | Response Time ═══ */}
      <div className="flex gap-2">

        {/* Delivery Performance */}
        <SCard className="flex-1">
          <SHead title="Delivery Performance" link="View Details" />
          <div className="p-2 flex gap-3 items-center">
            <div className="relative shrink-0">
              <PieChart width={96} height={96}>
                <Pie
                  data={deliveryPieData}
                  cx={48} cy={48}
                  innerRadius={30} outerRadius={45}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {deliveryPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-bold text-gray-800">156</span>
                <span className="text-[7px] text-gray-500 leading-tight">Total</span>
                <span className="text-[7px] text-gray-500 leading-tight">Orders</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="space-y-1.5">
                {[
                  { label: "On-time", value: "147 (94.2%)", color: C.green  },
                  { label: "Early",   value: "5 (3.2%)",    color: C.blue   },
                  { label: "Late",    value: "4 (2.6%)",    color: C.red    },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-[9px] text-gray-600">{item.label}</span>
                    </div>
                    <span className="text-[9px] font-medium text-gray-700">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 border-t border-gray-100 pt-1.5 grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[8px] text-gray-500">Avg Delivery Time</p>
                  <p className="text-xs font-bold text-gray-800">2.3 Days</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-gray-500">vs Last Year</p>
                  <p className="text-xs font-bold text-green-600">-0.4 days</p>
                </div>
              </div>
            </div>
          </div>
        </SCard>

        {/* Quality Performance */}
        <SCard className="flex-1">
          <SHead title="Quality Performance" link="View Details" />
          <div className="p-2 flex gap-3 items-center">
            <div className="relative shrink-0">
              <PieChart width={96} height={96}>
                <Pie
                  data={qualityPieData}
                  cx={48} cy={48}
                  innerRadius={30} outerRadius={45}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {qualityPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-bold text-gray-800">156</span>
                <span className="text-[7px] text-gray-500 leading-tight">Total</span>
                <span className="text-[7px] text-gray-500 leading-tight">Orders</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="space-y-1.5">
                {[
                  { label: "Excellent (5)", value: "102 (65.4%)", color: C.green  },
                  { label: "Good (4)",      value: "38 (24.4%)",  color: C.blue   },
                  { label: "Average (3)",   value: "10 (6.4%)",   color: C.orange },
                  { label: "Poor",          value: "6 (3.8%)",    color: C.red    },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-[9px] text-gray-600">{item.label}</span>
                    </div>
                    <span className="text-[9px] font-medium text-gray-700">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 border-t border-gray-100 pt-1.5 grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[8px] text-gray-500">Avg Quality Score</p>
                  <p className="text-xs font-bold text-gray-800">4.6 / 5</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-gray-500">vs Last Year</p>
                  <p className="text-xs font-bold text-green-600">+0.4</p>
                </div>
              </div>
            </div>
          </div>
        </SCard>

        {/* Response Time Performance */}
        <SCard className="flex-[1.4]">
          <SHead title="Response Time Performance" link="View Details" />
          <div className="p-3">
            <div className="space-y-2.5">
              {[
                { label: "Within 4 hrs", pct: 98.2, color: C.green  },
                { label: "4 – 24 hrs",   pct: 23.6, color: C.blue   },
                { label: "24 – 48 hrs",  pct: 4.3,  color: C.orange },
                { label: "48+ hrs",      pct: 1.9,  color: C.red    },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="text-[9px] text-gray-600 w-20 shrink-0">{item.label}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                  <span className="text-[9px] font-semibold text-gray-700 w-9 text-right">{item.pct}%</span>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-gray-100 pt-2 flex justify-between items-end">
              <div>
                <p className="text-[8px] text-gray-500">Average Response Time</p>
                <p className="text-sm font-bold text-gray-800">12.5 hrs</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] text-gray-500">vs Last Year</p>
                <p className="text-xs font-bold text-green-600">-3.1 hrs</p>
              </div>
            </div>
          </div>
        </SCard>
      </div>

      {/* ═══ ROW 6: Performance by Category ═══════════════════════════ */}
      <SCard>
        <SHead title="Performance by Category" />
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-[9px] text-gray-500">
              <th className="text-left py-2 px-3 font-medium">Category</th>
              <th className="text-right py-2 px-3 font-medium">Total Spend</th>
              <th className="text-center py-2 px-3 font-medium">Orders</th>
              <th className="text-center py-2 px-3 font-medium">On-time Delivery</th>
              <th className="text-center py-2 px-3 font-medium">Quality</th>
              <th className="text-center py-2 px-3 font-medium">Return Rate</th>
              <th className="text-center py-2 px-3 font-medium">vs Last Year</th>
            </tr>
          </thead>
          <tbody>
            {performanceCatData.map((row, i) => (
              <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="py-2 px-3 text-[10px] font-semibold text-gray-700">{row.category}</td>
                <td className="py-2 px-3 text-[10px] text-right text-gray-700">{row.spend}</td>
                <td className="py-2 px-3 text-[10px] text-center text-gray-600">{row.orders}</td>
                <td className="py-2 px-3 text-[10px] text-center text-gray-600">{row.onTime}</td>
                <td className="py-2 px-3 text-[10px] text-center text-gray-600">{row.quality}</td>
                <td className="py-2 px-3 text-[10px] text-center text-gray-600">{row.returnRate}</td>
                <td className="py-2 px-3 text-center">
                  <span
                    className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                      row.pos
                        ? "text-green-700 bg-green-100"
                        : "text-red-700 bg-red-100"
                    }`}
                  >
                    {row.growth}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SCard>

      {/* ═══ ROW 7: Top Performing Products | Recent Issues ══════════════ */}
      <div className="flex gap-2 pb-3">

        {/* Top Performing Products */}
        <SCard className="flex-1">
          <SHead title="Top Performing Products" link="View All" />
          <p className="text-[9px] text-gray-500 px-3 pt-1">By Spend</p>
          <table className="w-full mt-0.5">
            <thead>
              <tr className="bg-gray-50 text-[9px] text-gray-500">
                <th className="text-left py-1.5 px-3 font-medium">#</th>
                <th className="text-left py-1.5 px-2 font-medium">Product Name</th>
                <th className="text-right py-1.5 px-3 font-medium">Amount</th>
                <th className="text-right py-1.5 px-3 font-medium">% of Spend</th>
              </tr>
            </thead>
            <tbody>
              {topProductsData.map((p) => (
                <tr key={p.rank} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3 text-[10px] text-gray-500">{p.rank}</td>
                  <td className="py-2 px-2 text-[10px] font-medium text-gray-700">{p.name}</td>
                  <td className="py-2 px-3 text-[10px] text-right text-gray-700">{p.amount}</td>
                  <td className="py-2 px-3 text-right">
                    <span className="text-[9px] font-semibold text-blue-600">{p.pct}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SCard>

        {/* Recent Issues */}
        <SCard className="flex-1">
          <SHead title="Recent Issues" link="View All" />
          <table className="w-full mt-0.5">
            <thead>
              <tr className="bg-gray-50 text-[9px] text-gray-500">
                <th className="text-left py-1.5 px-3 font-medium">Issue</th>
                <th className="text-center py-1.5 px-3 font-medium">Raised On</th>
                <th className="text-center py-1.5 px-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentIssuesData.map((issue, i) => (
                <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="py-2 px-3 text-[10px] text-gray-700">{issue.issue}</td>
                  <td className="py-2 px-3 text-[10px] text-center text-gray-500">{issue.date}</td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className="text-[9px] font-medium px-2 py-0.5 rounded-full"
                      style={{ color: issue.sc, backgroundColor: issue.sc + "20" }}
                    >
                      {issue.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </SCard>
      </div>

    </div>
  );
}
