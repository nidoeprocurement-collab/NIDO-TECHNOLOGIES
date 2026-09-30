import { useEffect, useMemo, useState } from "react";
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
import "./VendorDashboard.css";
import { getVendors, type StoredVendor } from "@/lib/vendorDataStore";
import { getAllPOs, getPODisplayStatus, type StoredPO } from "@/lib/purchaseOrderStore";
import { belongsToVendor } from "@/lib/vendorScope";

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
    <div className={`bg-card rounded-lg border border-border shadow-sm min-w-0 ${className}`}>
      {children}
    </div>
  );
}

function SHead({ title, link }: { title: string; link?: string }) {
  return (
    <div className="flex flex-wrap justify-between items-center gap-2 px-4 py-3 border-b border-border">
      <span className="min-w-0 text-[11px] font-semibold text-foreground">{title}</span>
      {link && (
        <span className="shrink-0 whitespace-nowrap text-[10px] text-primary cursor-pointer hover:text-primary/80">
          {link} →
        </span>
      )}
    </div>
  );
}

function dashboardAmount(po: StoredPO): number {
  const amount = Number(po.grandTotal);
  if (Number.isFinite(amount) && amount > 0) return amount;
  return Number(po.subtotal || 0) + Number(po.sgstAmt || 0) + Number(po.cgstAmt || 0);
}

function dashboardDate(value?: string): number {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  if (Number.isFinite(parsed)) return parsed;
  const parts = value.split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts.map(Number);
    return new Date(year, month - 1, day).getTime() || 0;
  }
  return 0;
}

function formatCr(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function buildLiveDashboardData() {
  const vendors = getVendors().filter(vendor => !vendor.archived);
  const purchaseOrders = getAllPOs();
  const activePOs = purchaseOrders.filter(po => po.status !== "Draft" && po.status !== "Cancelled");
  const vendorOrders = (vendor: StoredVendor) =>
    purchaseOrders.filter(po => belongsToVendor(po, { vendorId: vendor.id, vendorName: vendor.name }));
  const spendByVendor = vendors.map(vendor => {
    const orders = vendorOrders(vendor).filter(po => po.status !== "Draft" && po.status !== "Cancelled");
    return {
      vendor,
      orders,
      spend: orders.reduce((total, po) => total + dashboardAmount(po), 0),
    };
  });

  const spendByVendorData = spendByVendor
    .filter(row => row.spend > 0)
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 10)
    .map(row => ({ name: row.vendor.name, value: row.spend / 10000000 }));

  const vendorRankingData = vendors
    .map(vendor => ({
      name: vendor.name,
      category: vendor.category || "—",
      quality: Number(vendor.rating || (vendor.performanceQuality || 0) / 20),
      delivery: Number(vendor.performanceDelivery || 0),
    }))
    .sort((a, b) => b.quality - a.quality || b.delivery - a.delivery)
    .slice(0, 10);

  const slaVendorData = vendors
    .map(vendor => {
      const orders = vendorOrders(vendor).filter(po => po.status !== "Draft" && po.status !== "Cancelled");
      const delivered = orders.filter(po => po.status === "Delivered").length;
      return {
        vendor: vendor.name,
        category: vendor.category || "—",
        sla: Number(vendor.performanceDelivery || 0),
        tickets: orders.length,
        resolved: delivered,
        status: Number(vendor.performanceDelivery || 0) > 0 ? "Recorded" : "No data",
      };
    })
    .filter(row => row.tickets > 0 || row.sla > 0)
    .sort((a, b) => b.sla - a.sla)
    .slice(0, 7);

  const avgDelivery = vendors.length
    ? vendors.reduce((total, vendor) => total + Number(vendor.performanceDelivery || 0), 0) / vendors.length
    : 0;
  const slaData = [
    { name: "Recorded", value: avgDelivery, color: "#2B2D42" },
    { name: "Remaining", value: Math.max(0, 100 - avgDelivery), color: "#E5E7EB" },
  ];

  const activities = [...purchaseOrders]
    .sort((a, b) => dashboardDate(b.createdOn || b.createdOnDisplay) - dashboardDate(a.createdOn || a.createdOnDisplay))
    .slice(0, 9)
    .map(po => ({
      text: `${po.item || po.items?.[0]?.item || "Purchase order"} · ${po.poNumber}`,
      sub: `${po.vendorName || "Vendor"} · ${getPODisplayStatus(po.status)}`,
      time: po.createdOn
        ? new Date(po.createdOn).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
        : po.createdOnDisplay || "Date not recorded",
      color: po.status === "Delivered" ? C.green : po.status === "Cancelled" ? C.red : C.blue,
    }));

  const categorySpend = new Map<string, number>();
  for (const po of activePOs) {
    const items = po.items?.length ? po.items : [{
      category: po.category,
      lineSubtotal: po.subtotal,
    }];
    for (const item of items) {
      const category = String(item.category || "Uncategorised");
      categorySpend.set(category, (categorySpend.get(category) || 0) + Number(item.lineSubtotal || 0));
    }
  }
  const totalCategorySpend = [...categorySpend.values()].reduce((sum, amount) => sum + amount, 0);
  const spendCategoryData = [...categorySpend.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, amount], index) => ({
      name,
      value: totalCategorySpend ? Math.round((amount / totalCategorySpend) * 100) : 0,
      color: [C.blue, C.orange, C.purple, C.green, C.gray][index],
    }));

  const statusGroups = [
    { name: "Pending", matches: ["draft"], color: C.orange },
    { name: "Processing", matches: ["confirmed", "accepted", "vendor notified"], color: C.blue },
    { name: "In Transit", matches: ["dispatched", "partially shipped", "shipped", "partially delivered"], color: C.cyan },
    { name: "Delivered", matches: ["delivered", "completed"], color: C.green },
    { name: "Cancelled", matches: ["cancelled", "rejected"], color: C.red },
  ];
  const orderStatusData = statusGroups.map(group => ({
    name: group.name,
    value: purchaseOrders.filter(po => group.matches.includes(String(po.status || "").toLowerCase())).length,
    color: group.color,
  })).filter(group => group.value > 0);

  const recentOrdersData = [...purchaseOrders]
    .sort((a, b) => dashboardDate(b.createdOn || b.createdOnDisplay) - dashboardDate(a.createdOn || a.createdOnDisplay))
    .slice(0, 5)
    .map(po => {
      const status = getPODisplayStatus(po.status);
      const colors: Record<string, string> = { Delivered: C.green, Completed: C.green, Dispatched: C.blue, "Partially Shipped": C.blue, Processing: C.orange, Pending: C.orange, Cancelled: C.red };
      return {
        vendor: po.vendorName || "—",
        category: po.category || po.items?.[0]?.category || "—",
        amount: formatCr(dashboardAmount(po)),
        date: po.createdOn
          ? new Date(po.createdOn).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
          : po.createdOnDisplay || "—",
        status,
        sc: colors[status] || C.gray,
      };
    });

  const topVendorsData = [...spendByVendor]
    .sort((a, b) =>
      Number(b.vendor.rating || (b.vendor.performanceQuality || 0) / 20) -
      Number(a.vendor.rating || (a.vendor.performanceQuality || 0) / 20),
    )
    .slice(0, 5)
    .map((row, index) => ({
      rank: index + 1,
      name: row.vendor.name,
      score: Number(row.vendor.rating || (row.vendor.performanceQuality || 0) / 20),
      color: [C.blue, C.green, C.purple, C.orange, C.cyan][index],
    }));

  const contractStatuses = new Map<string, number>();
  for (const vendor of vendors) {
    try {
      const contracts = JSON.parse(localStorage.getItem(`nido_vendor_contracts_${vendor.id}`) || "[]");
      if (!Array.isArray(contracts)) continue;
      for (const contract of contracts) {
        const status = String(contract.status || "Active");
        const normalized = status.toLowerCase();
        const label = normalized.includes("expired") ? "Expired"
          : normalized.includes("expir") ? "Expiring"
          : normalized.includes("renew") ? "Renewal" : "Active";
        contractStatuses.set(label, (contractStatuses.get(label) || 0) + 1);
      }
    } catch { /* malformed vendor contract records are excluded */ }
  }
  const contractPieData = [
    { name: "Active", value: contractStatuses.get("Active") || 0, color: C.green },
    { name: "Expiring", value: contractStatuses.get("Expiring") || 0, color: C.orange },
    { name: "Expired", value: contractStatuses.get("Expired") || 0, color: C.red },
    { name: "Renewal", value: contractStatuses.get("Renewal") || 0, color: C.blue },
  ].filter(row => row.value > 0);

  const monthlyTotals = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - (5 - index));
    const month = date.getMonth();
    const year = date.getFullYear();
    const monthPOs = activePOs.filter(po => {
      const created = new Date(dashboardDate(po.createdOn || po.createdOnDisplay));
      return created.getMonth() === month && created.getFullYear() === year;
    });
    return {
      month: date.toLocaleDateString("en-IN", { month: "short" }),
      paid: monthPOs.reduce((sum, po) => sum + dashboardAmount(po), 0) / 10000000,
      pending: purchaseOrders
        .filter(po => {
          if (po.status !== "Draft") return false;
          const created = new Date(dashboardDate(po.createdOn || po.createdOnDisplay));
          return created.getMonth() === month && created.getFullYear() === year;
        })
        .reduce((sum, po) => sum + dashboardAmount(po), 0) / 10000000,
    };
  });

  const issueVendors = vendors.filter(vendor => Number(vendor.complianceIssues || 0) > 0).length;
  const riskData = [
    { level: "No reported issues", count: vendors.length - issueVendors, pct: vendors.length ? Math.round(((vendors.length - issueVendors) / vendors.length) * 100) : 0, color: C.green },
    { level: "Reported issues", count: issueVendors, pct: vendors.length ? Math.round((issueVendors / vendors.length) * 100) : 0, color: C.orange },
  ];

  const deliveryCounts = [
    { name: "Delivered", value: purchaseOrders.filter(po => po.status === "Delivered" || po.status === "Completed").length, color: C.green },
    { name: "In progress", value: purchaseOrders.filter(po => !["Delivered", "Completed", "Cancelled"].includes(po.status) && po.status !== "Draft").length, color: C.blue },
    { name: "Pending", value: purchaseOrders.filter(po => po.status === "Draft").length, color: C.orange },
    { name: "Cancelled", value: purchaseOrders.filter(po => po.status === "Cancelled").length, color: C.red },
  ];
  const qualityCounts = [
    { name: "4.5–5", min: 4.5, max: 5.01, color: C.green },
    { name: "3.5–4.4", min: 3.5, max: 4.5, color: C.blue },
    { name: "2.5–3.4", min: 2.5, max: 3.5, color: C.orange },
    { name: "Below 2.5", min: 0, max: 2.5, color: C.red },
  ].map(group => ({
    name: group.name,
    value: vendors.filter(vendor => {
      const rating = Number(vendor.rating || (vendor.performanceQuality || 0) / 20);
      return rating >= group.min && rating < group.max;
    }).length,
    color: group.color,
  })).filter(group => group.value > 0);

  const categoryPerformance = new Map<string, { spend: number; orders: number; vendors: StoredVendor[] }>();
  for (const vendor of vendors) {
    const category = vendor.category || "Uncategorised";
    const value = categoryPerformance.get(category) || { spend: 0, orders: 0, vendors: [] };
    const orders = vendorOrders(vendor).filter(po => po.status !== "Draft" && po.status !== "Cancelled");
    value.spend += orders.reduce((sum, po) => sum + dashboardAmount(po), 0);
    value.orders += orders.length;
    value.vendors.push(vendor);
    categoryPerformance.set(category, value);
  }
  const performanceCatData = [...categoryPerformance.entries()]
    .sort((a, b) => b[1].spend - a[1].spend)
    .map(([category, data]) => {
      const deliveryScores = data.vendors.map(vendor => Number(vendor.performanceDelivery || 0)).filter(score => score > 0);
      const qualityScores = data.vendors.map(vendor => Number(vendor.rating || (vendor.performanceQuality || 0) / 20)).filter(score => score > 0);
      return {
        category,
        spend: formatCr(data.spend),
        orders: data.orders,
        onTime: deliveryScores.length ? `${(deliveryScores.reduce((sum, score) => sum + score, 0) / deliveryScores.length).toFixed(1)}%` : "—",
        quality: qualityScores.length ? `${(qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length).toFixed(1)} / 5` : "—",
        returnRate: "—",
        growth: "—",
        pos: true,
      };
    });

  const productSpend = new Map<string, { spend: number; qty: number }>();
  for (const po of activePOs) {
    const lines = po.items?.length ? po.items : [{
      item: po.item,
      lineSubtotal: po.subtotal,
      qty: po.qty,
    }];
    for (const line of lines) {
      const name = String(line.item || "Unspecified product");
      const value = productSpend.get(name) || { spend: 0, qty: 0 };
      value.spend += Number(line.lineSubtotal || 0);
      value.qty += Number(line.qty || 0);
      productSpend.set(name, value);
    }
  }
  const totalProductSpend = [...productSpend.values()].reduce((sum, value) => sum + value.spend, 0);
  const topProductsData = [...productSpend.entries()]
    .sort((a, b) => b[1].spend - a[1].spend)
    .slice(0, 5)
    .map(([name, value], index) => ({
      rank: index + 1,
      name,
      amount: formatCr(value.spend),
      pct: totalProductSpend ? Number(((value.spend / totalProductSpend) * 100).toFixed(1)) : 0,
    }));

  const recentIssuesData = vendors
    .filter(vendor => Number(vendor.complianceIssues || 0) > 0)
    .sort((a, b) => Number(b.complianceIssues) - Number(a.complianceIssues))
    .slice(0, 5)
    .map(vendor => ({
      issue: `${vendor.name} · ${vendor.complianceIssues} reported compliance issue(s)`,
      date: "Date not recorded",
      status: "Review",
      sc: C.orange,
    }));

  const totalSpend = activePOs.reduce((sum, po) => sum + dashboardAmount(po), 0);
  const deliveredPOs = purchaseOrders.filter(po => po.status === "Delivered" || po.status === "Completed");
  const qualityScores = vendors.map(vendor => Number(vendor.rating || (vendor.performanceQuality || 0) / 20)).filter(score => score > 0);
  const avgQuality = qualityScores.length ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length : 0;
  const preferredCount = vendors.filter(vendor => String(vendor.preferredVendor || "").toLowerCase() === "yes").length;
  const totalDelivery = vendors.map(vendor => Number(vendor.performanceDelivery || 0)).filter(score => score > 0);
  const responsivenessScores = vendors
    .map(vendor => ({ vendor: vendor.name, value: Number(vendor.performanceResponsiveness || 0) }))
    .filter(row => row.value > 0)
    .sort((a, b) => b.value - a.value);
  const avgResponsiveness = responsivenessScores.length
    ? responsivenessScores.reduce((sum, row) => sum + row.value, 0) / responsivenessScores.length
    : 0;
  const responsivenessData = responsivenessScores.slice(0, 4).map((row, index) => ({
    label: row.vendor,
    pct: Math.min(100, row.value),
    color: [C.green, C.blue, C.orange, C.purple][index],
  }));
  const now = new Date();
  const currentMonthSpend = activePOs.filter(po => {
    const created = new Date(dashboardDate(po.createdOn || po.createdOnDisplay));
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).reduce((sum, po) => sum + dashboardAmount(po), 0);
  const draftSpend = purchaseOrders
    .filter(po => po.status === "Draft")
    .reduce((sum, po) => sum + dashboardAmount(po), 0);

  return {
    vendors, purchaseOrders, totalSpend, preferredCount, avgQuality,
    avgDelivery: totalDelivery.length ? totalDelivery.reduce((sum, score) => sum + score, 0) / totalDelivery.length : 0,
    spendByVendorData, vendorRankingData, slaVendorData, slaData, activities, spendCategoryData,
    orderStatusData, recentOrdersData, topVendorsData, contractPieData, paymentChartData: monthlyTotals,
    riskData, deliveryPieData: deliveryCounts, qualityPieData: qualityCounts, performanceCatData,
    topProductsData, recentIssuesData, deliveredPOs, responsivenessData, avgResponsiveness,
    currentMonthSpend, draftSpend,
  };
}

// ─── Main Dashboard ──────────────────────────────────────────────
export default function VendorDashboard() {
  const [dataVersion, setDataVersion] = useState(0);
  useEffect(() => {
    const refresh = () => setDataVersion(version => version + 1);
    const events = ["nidoVendorsUpdated", "vendorProductsUpdated", "poCreated", "poActivityUpdated", "vendorContractsUpdated", "storage"];
    events.forEach(event => window.addEventListener(event, refresh));
    return () => events.forEach(event => window.removeEventListener(event, refresh));
  }, []);
  const live = useMemo(() => buildLiveDashboardData(), [dataVersion]);
  const {
    vendors, purchaseOrders, totalSpend, preferredCount, avgQuality, avgDelivery,
    spendByVendorData, vendorRankingData, slaVendorData, slaData, activities, spendCategoryData,
    orderStatusData, recentOrdersData, topVendorsData, contractPieData, paymentChartData,
    riskData, deliveryPieData, qualityPieData, performanceCatData, topProductsData, recentIssuesData,
    deliveredPOs, responsivenessData, avgResponsiveness, currentMonthSpend, draftSpend,
  } = live;
  const totalOrders = purchaseOrders.length;

  const kpis = [
    { label: "Total Vendors",          value: String(vendors.length), Icon: Users,       color: C.blue,   sub: "Current vendor records" },
    { label: "Active Vendors",         value: String(vendors.filter(v => v.status === "Active").length), Icon: UserCheck, color: C.green, sub: "Current vendor status" },
    { label: "Preferred Vendors",      value: String(preferredCount), Icon: Star,         color: C.orange, sub: "Marked preferred" },
    { label: "Vendor Spend",           value: formatCr(totalSpend), Icon: IndianRupee, color: C.red, sub: `${purchaseOrders.filter(po => po.status !== "Draft" && po.status !== "Cancelled").length} confirmed POs` },
    { label: "Delivery Performance",   value: avgDelivery ? `${avgDelivery.toFixed(1)}%` : "—", Icon: Truck, color: C.cyan, sub: "From vendor records" },
    { label: "Avg Quality Score",      value: avgQuality ? `${avgQuality.toFixed(1)} / 5` : "—", Icon: Award, color: C.purple, sub: `Across ${vendors.length} vendors` },
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
      className="vendor-dashboard min-h-screen p-4 md:p-6 space-y-4 bg-background"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >

      {/* ═══ ROW 1: KPI Cards ═══════════════════════════════════════ */}
      <div className="dashboard-kpis">
        {kpis.map(({ label, value, Icon, color, sub }) => (
          <SCard key={label} className="px-4 py-3">
            <div className="flex items-center gap-2">
              <div
                className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: color + "22" }}
              >
                <Icon size={18} style={{ color }} />
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
      <div className="dashboard-row-two">

        {/* Spend by Vendor + SLA Compliance below */}
        <SCard className="dashboard-vendor-spend min-w-0">
          <SHead title="Spend by Vendor (Top 10)" link="View All" />
          <div className="p-1 pt-1">
            <ResponsiveContainer width="100%" height={240}>
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

          {/* Vendor delivery score from the live vendor records */}
          <div className="border-t border-gray-100 mt-1">
            <div className="flex items-center justify-between px-3 pt-2 pb-1">
              <p className="text-[10px] font-semibold text-gray-700">Delivery Performance</p>
              <span className="text-[9px] text-blue-500 cursor-pointer hover:underline">View All</span>
            </div>
            <div className="dashboard-delivery-panel px-4 pb-4">
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
                    <span className="text-sm font-bold text-gray-800">{avgDelivery ? `${avgDelivery.toFixed(0)}%` : "—"}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-0.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#2B2D42" }} />
                    <span className="text-[8px] text-gray-500">Recorded</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                    <span className="text-[8px] text-gray-500">Remaining</span>
                  </div>
                </div>
                <div className="text-center mt-0.5">
                  <p className="text-[9px] font-semibold text-gray-700">Vendor score</p>
                  <p className="text-[8px] text-gray-500">Profile data</p>
                </div>
              </div>

              {/* Vendor-level delivery score and order history */}
              <div className="dashboard-delivery-table min-w-0">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-[8px] text-gray-500">
                      <th className="text-left py-1 px-1.5 font-medium rounded-l">Vendor</th>
                      <th className="text-left py-1 px-1 font-medium">Category</th>
                      <th className="text-center py-1 px-1 font-medium">Delivery %</th>
                      <th className="text-center py-1 px-1 font-medium">Delivered / POs</th>
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
                          <span className="text-[8px] font-semibold" style={{ color: row.status === "Recorded" ? C.green : C.gray }}>
                            {row.sla ? `${row.sla}%` : "—"}
                          </span>
                        </td>
                        <td className="py-1 px-1 text-center text-[8px] text-gray-500">
                          {row.resolved}/{row.tickets}
                        </td>
                        <td className="py-1 px-1 text-center">
                          <span
                            className="text-[7px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{
                              color: row.status === "Recorded" ? C.green : C.gray,
                              backgroundColor: (row.status === "Recorded" ? C.green : C.gray) + "18",
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
        <SCard className="dashboard-vendor-ranking min-w-0">
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
        <div className="dashboard-activities min-w-0">
          <SCard className="flex-1">
            <SHead title="Recent Activities" />
              <div className="dashboard-activity-list px-3 py-3">
              {activities.slice(0, 9).map((a, i) => (
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
      <div className="dashboard-row-three">

        {/* Spend by Category */}
        <SCard className="dashboard-category-card min-w-0">
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

        {/* Vendor ratings */}
        <SCard className="dashboard-rating-card min-w-0">
          <SHead title="Vendor Ratings" />
          <div className="p-2">
            <div className="text-center mb-2">
              <span className="text-2xl font-bold text-gray-800">{avgQuality ? avgQuality.toFixed(1) : "—"}</span>
              <p className="text-[8px] text-gray-500">Average / 5</p>
            </div>
            <div className="space-y-1.5">
              {qualityPieData.map((item) => {
                const ratedVendors = qualityPieData.reduce((sum, group) => sum + group.value, 0);
                const pct = ratedVendors ? Math.round((item.value / ratedVendors) * 100) : 0;
                return (
                <div key={item.name}>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[8px] text-gray-600">{item.name}</span>
                    <span className="text-[8px] font-semibold" style={{ color: item.color }}>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                  </div>
                </div>
                );
              })}
            </div>
            <p className="text-[8px] text-gray-500 mt-2 text-center">
              Rated vendors: <span className="font-bold text-gray-700">{qualityPieData.reduce((sum, item) => sum + item.value, 0)}</span>
            </p>
          </div>
        </SCard>

        {/* Order Status */}
        <SCard className="dashboard-status-card min-w-0">
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
                <span className="text-xs font-bold text-gray-800">{totalOrders}</span>
                <span className="text-[7px] text-gray-500">Purchase Orders</span>
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
        <SCard className="dashboard-orders-card min-w-0">
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
        <SCard className="dashboard-top-vendors-card min-w-0">
          <SHead title="Top Rated Vendors" />
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
                  {v.score ? `${v.score.toFixed(1)} / 5` : "—"}
                </span>
              </div>
            ))}
          </div>
        </SCard>
      </div>

      {/* ═══ ROW 4: Contract Summary | Payment Summary | Risk Monitor | Quick Actions ═══ */}
      <div className="dashboard-row-four">

        {/* Contract Summary */}
        <SCard className="dashboard-contract-card min-w-0">
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

        {/* Purchase-order value summary */}
        <SCard className="dashboard-po-value-card min-w-0">
          <SHead title="Purchase Order Value" link="View All" />
          <div className="px-3 pt-1.5 flex justify-between">
            <div>
              <span className="text-xs font-bold text-gray-800">{formatCr(draftSpend)}</span>
              <span className="text-[9px] text-gray-500 ml-1">Draft POs</span>
            </div>
            <div>
              <span className="text-xs font-bold text-gray-700">{formatCr(currentMonthSpend)}</span>
              <span className="text-[9px] text-gray-500 ml-1">Confirmed this month</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={paymentChartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 8, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 8, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: number, n: string) => [`₹${v.toFixed(2)} Cr`, n === "paid" ? "Confirmed POs" : "Draft POs"]}
                contentStyle={{ fontSize: 9, padding: "2px 6px", borderRadius: 4 }}
              />
              <Bar dataKey="paid"    fill={C.blue}   radius={[2,2,0,0]} barSize={12} />
              <Bar dataKey="pending" fill={C.orange} radius={[2,2,0,0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </SCard>

        {/* Compliance issues */}
        <SCard className="dashboard-compliance-card min-w-0">
          <SHead title="Compliance Issues" link="View All" />
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
        <SCard className="dashboard-quick-actions-card min-w-0">
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
      <div className="dashboard-row-five">

        {/* Purchase-order status */}
        <SCard className="dashboard-status-performance min-w-0">
          <SHead title="Purchase Order Status" link="View Details" />
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
                <span className="text-sm font-bold text-gray-800">{totalOrders}</span>
                <span className="text-[7px] text-gray-500 leading-tight">Total</span>
                <span className="text-[7px] text-gray-500 leading-tight">POs</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="space-y-1.5">
                {deliveryPieData.map((item) => {
                  const pct = totalOrders ? Math.round((item.value / totalOrders) * 100) : 0;
                  return <div key={item.name} className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-[9px] text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-[9px] font-medium text-gray-700">{item.value} ({pct}%)</span>
                  </div>;
                })}
              </div>
              <div className="mt-2 border-t border-gray-100 pt-1.5 grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[8px] text-gray-500">Delivered POs</p>
                  <p className="text-xs font-bold text-gray-800">{deliveredPOs.length}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-gray-500">Total POs</p>
                  <p className="text-xs font-bold text-gray-700">{totalOrders}</p>
                </div>
              </div>
            </div>
          </div>
        </SCard>

        {/* Quality Performance */}
        <SCard className="dashboard-quality-performance min-w-0">
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
                <span className="text-sm font-bold text-gray-800">{qualityPieData.reduce((sum, item) => sum + item.value, 0)}</span>
                <span className="text-[7px] text-gray-500 leading-tight">Rated</span>
                <span className="text-[7px] text-gray-500 leading-tight">Vendors</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="space-y-1.5">
                {qualityPieData.map((item) => {
                  const ratedVendors = qualityPieData.reduce((sum, group) => sum + group.value, 0);
                  const pct = ratedVendors ? Math.round((item.value / ratedVendors) * 100) : 0;
                  return <div key={item.name} className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-[9px] text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-[9px] font-medium text-gray-700">{item.value} ({pct}%)</span>
                  </div>;
                })}
              </div>
              <div className="mt-2 border-t border-gray-100 pt-1.5 grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[8px] text-gray-500">Avg Quality Score</p>
                  <p className="text-xs font-bold text-gray-800">{avgQuality ? `${avgQuality.toFixed(1)} / 5` : "—"}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-gray-500">Vendors with scores</p>
                  <p className="text-xs font-bold text-gray-700">{qualityPieData.reduce((sum, item) => sum + item.value, 0)}</p>
                </div>
              </div>
            </div>
          </div>
        </SCard>

        {/* Vendor responsiveness score */}
        <SCard className="dashboard-responsiveness min-w-0">
          <SHead title="Vendor Responsiveness" link="View Details" />
          <div className="p-3">
            <div className="space-y-2.5">
              {responsivenessData.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="text-[9px] text-gray-600 w-20 shrink-0 truncate" title={item.label}>{item.label}</span>
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
                <p className="text-[8px] text-gray-500">Average recorded score</p>
                <p className="text-sm font-bold text-gray-800">{avgResponsiveness ? `${avgResponsiveness.toFixed(1)}%` : "—"}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] text-gray-500">Scores recorded</p>
                <p className="text-xs font-bold text-gray-700">{responsivenessData.length}</p>
              </div>
            </div>
          </div>
        </SCard>
      </div>

      {/* ═══ ROW 6: Performance by Category ═══════════════════════════ */}
      <SCard>
        <SHead title="Performance by Category" />
        <div className="dashboard-wide-table">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 text-[9px] text-gray-500">
              <th className="text-left py-2 px-3 font-medium">Category</th>
              <th className="text-right py-2 px-3 font-medium">Total Spend</th>
              <th className="text-center py-2 px-3 font-medium">Orders</th>
              <th className="text-center py-2 px-3 font-medium">Delivery Score</th>
              <th className="text-center py-2 px-3 font-medium">Quality</th>
              <th className="text-center py-2 px-3 font-medium">Return Rate</th>
              <th className="text-center py-2 px-3 font-medium">Growth</th>
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
                      row.growth === "—"
                        ? "text-gray-500 bg-gray-100"
                        : row.pos
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
        </div>
      </SCard>

      {/* ═══ ROW 7: Top Performing Products | Recent Issues ══════════════ */}
      <div className="dashboard-row-seven pb-4">

        {/* Top Performing Products */}
        <SCard className="min-w-0">
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
        <SCard className="min-w-0">
          <SHead title="Vendor Compliance Follow-up" link="View All" />
          <table className="w-full mt-0.5">
            <thead>
              <tr className="bg-gray-50 text-[9px] text-gray-500">
                <th className="text-left py-1.5 px-3 font-medium">Issue</th>
                <th className="text-center py-1.5 px-3 font-medium">Date</th>
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
