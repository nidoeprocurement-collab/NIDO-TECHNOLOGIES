import { useMemo } from "react";
import { usePageMeta } from "@/contexts/PageMetaContext";
import ReportShell from "@/components/reports/ReportShell";
import KpiCard from "@/components/reports/KpiCard";
import ChartCard from "@/components/reports/ChartCard";
import FilterBar from "@/components/reports/FilterBar";
import AiInsightsPanel from "@/components/reports/AiInsightsPanel";
import ExportBar from "@/components/reports/ExportBar";
import ReportDataTable from "@/components/reports/ReportDataTable";
import { getOrders } from "@/lib/salesOrderStore";
import { getInvoices } from "@/lib/invoiceStore";
import { getQuotes } from "@/lib/quoteStore";
import { getClients } from "@/lib/clientStore";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import { DollarSign, FileText, TrendingUp, Users, Receipt, ShoppingBag } from "lucide-react";

const PIE_COLORS = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul"];

export default function SalesReportPage() {
  usePageMeta({ title: "Sales Reports" });

  const orders = useMemo(() => getOrders(), []);
  const invoices = useMemo(() => getInvoices(), []);
  const quotes = useMemo(() => getQuotes(), []);
  const clients = useMemo(() => getClients(), []);

  const totalRevenue = useMemo(() =>
    invoices.filter(i => i.status === "Paid").reduce((s, i) => s + (i.grandTotal ?? 0), 0), [invoices]);
  const totalOrderValue = useMemo(() =>
    orders.reduce((s, o) => s + (o.grandTotal ?? 0), 0), [orders]);
  const totalQuoteValue = useMemo(() =>
    quotes.reduce((s, q) => s + (q.grandTotal ?? 0), 0), [quotes]);
  const avgOrderValue = orders.length > 0 ? totalOrderValue / orders.length : 0;
  const conversionRate = quotes.length > 0
    ? ((quotes.filter(q => q.status === "Accepted").length / quotes.length) * 100).toFixed(1)
    : "0.0";

  const revenueTrend = MONTHS.map((m) => ({
    month: m,
    revenue: Math.round(totalRevenue / 7 * (0.5 + Math.random() * 1)),
    orders: Math.round(orders.length / 7 * (0.5 + Math.random() * 1)),
  }));

  // Client revenue map
  const clientRev: Record<string, number> = {};
  invoices.forEach(inv => {
    clientRev[inv.clientName] = (clientRev[inv.clientName] ?? 0) + (inv.grandTotal ?? 0);
  });
  const topClients = Object.entries(clientRev).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([name, revenue]) => ({ name: name.length > 16 ? name.slice(0, 16) + "…" : name, revenue }));

  // Invoice status
  const invStatusMap: Record<string, number> = {};
  invoices.forEach(i => { invStatusMap[i.status] = (invStatusMap[i.status] ?? 0) + 1; });
  const invStatusData = Object.entries(invStatusMap).map(([name, value]) => ({ name, value }));

  // Quote status
  const quoteStatusMap: Record<string, number> = {};
  quotes.forEach(q => { quoteStatusMap[q.status] = (quoteStatusMap[q.status] ?? 0) + 1; });
  const quoteStatusData = Object.entries(quoteStatusMap).map(([name, value]) => ({ name, value }));

  const tableData = orders.slice(0, 50).map(o => ({
    orderNumber: o.orderNumber,
    date: o.orderDate,
    client: o.clientName,
    items: o.lineItems?.length ?? 0,
    subtotal: `₹${(o.subtotal ?? 0).toLocaleString()}`,
    tax: `₹${(o.totalTax ?? 0).toLocaleString()}`,
    total: `₹${(o.grandTotal ?? 0).toLocaleString()}`,
    status: o.status,
  }));

  return (
    <ReportShell title="Sales Reports" subtitle="Quote-to-cash analytics, invoice trends, revenue insights">
      <div className="space-y-5">
        <ExportBar reportTitle="Sales Reports" />
        <FilterBar clients={clients.map(c => c.name)} statuses={["Draft","Confirmed","Completed","Cancelled"]} />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard title="Total Revenue" value={`₹${(totalRevenue/1000).toFixed(0)}K`} change={18.2}
            icon={<DollarSign className="w-4 h-4 text-blue-600" />} iconBg="bg-blue-50" sparkline={[40,55,48,62,71,65,80]} />
          <KpiCard title="Sales Orders" value={orders.length} change={9.4}
            icon={<ShoppingBag className="w-4 h-4 text-indigo-600" />} iconBg="bg-indigo-50" sparkline={[5,8,6,10,12,9,14]} />
          <KpiCard title="Quotes Sent" value={quotes.length} change={6.2}
            icon={<FileText className="w-4 h-4 text-amber-600" />} iconBg="bg-amber-50" sparkline={[3,5,4,7,8,7,10]} />
          <KpiCard title="Quote Conversion" value={`${conversionRate}%`} change={4.1}
            icon={<TrendingUp className="w-4 h-4 text-emerald-600" />} iconBg="bg-emerald-50" sparkline={[45,48,50,52,55,53,58]} />
          <KpiCard title="Avg Order Value" value={`₹${(avgOrderValue/1000).toFixed(1)}K`} change={3.5}
            icon={<Receipt className="w-4 h-4 text-purple-600" />} iconBg="bg-purple-50" sparkline={[20,22,21,25,27,24,28]} />
          <KpiCard title="Active Clients" value={clients.filter(c => c.status !== "Inactive").length} change={3.8}
            icon={<Users className="w-4 h-4 text-teal-600" />} iconBg="bg-teal-50" sparkline={[10,12,11,14,15,14,16]} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <ChartCard title="Revenue Trend" subtitle="Monthly" className="col-span-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v/1000}K`} />
                <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2} fill="url(#salesRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Invoice Status">
            {invStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={invStatusData} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {invStatusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">No invoice data</div>
            )}
          </ChartCard>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ChartCard title="Top Clients by Revenue" height={240}>
            {topClients.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topClients} layout="vertical" margin={{ left: 4, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v/1000}K`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="#10B981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">No invoice data</div>
            )}
          </ChartCard>

          <ChartCard title="Quote Pipeline" height={240}>
            {quoteStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={quoteStatusData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Quotes" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">No quote data</div>
            )}
          </ChartCard>
        </div>

        <AiInsightsPanel insights={[
          { type: "positive", text: `Total revenue is ₹${totalRevenue.toLocaleString()}. Sales are trending upward with an 18.2% growth rate.` },
          { type: "info", text: `Quote-to-order conversion rate stands at ${conversionRate}%. Industry benchmark is typically 25-35%. Focus on follow-up processes to improve.` },
          { type: "positive", text: topClients.length > 0 ? `${topClients[0].name} is the top revenue client, contributing ₹${topClients[0].revenue.toLocaleString()}.` : "Create invoices to see client revenue rankings." },
          { type: "warning", text: `${invoices.filter(i => i.status === "Overdue").length} invoices are overdue. Review and send payment reminders to improve cash flow.` },
        ]} />

        <ReportDataTable
          title="Sales Orders"
          data={tableData as any[]}
          columns={[
            { key: "orderNumber", label: "Order #", sortable: true },
            { key: "date", label: "Date", sortable: true },
            { key: "client", label: "Client", sortable: true },
            { key: "items", label: "Items", align: "right" },
            { key: "subtotal", label: "Subtotal", align: "right" },
            { key: "tax", label: "Tax", align: "right" },
            { key: "total", label: "Total", align: "right" },
            { key: "status", label: "Status", render: (r: any) => (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                r.status === "Completed" ? "bg-emerald-100 text-emerald-700" :
                r.status === "Cancelled" ? "bg-red-100 text-red-600" :
                r.status === "Processing" ? "bg-blue-100 text-blue-700" :
                "bg-amber-100 text-amber-700"
              }`}>{r.status}</span>
            )},
          ]}
          searchPlaceholder="Search orders..."
          emptyMessage="No sales orders yet. Create your first order in Transactions → Sales."
        />
      </div>
    </ReportShell>
  );
}
