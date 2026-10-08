import { useMemo } from "react";
import { usePageMeta } from "@/contexts/PageMetaContext";
import { useLiveReportRevision } from "@/hooks/useLiveReportRevision";
import { useReportFilters } from "@/contexts/ReportControlsContext";
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
import { applyReportFilters, getRecentReportMonths, getReportMonthKey } from "@/lib/reportData";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import { DollarSign, FileText, TrendingUp, Users, Receipt, ShoppingBag } from "lucide-react";

const PIE_COLORS = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];
export default function SalesReportPage() {
  usePageMeta({ title: "Sales Reports" });
  const liveRevision = useLiveReportRevision();
  const filters = useReportFilters();

  // The status selector on this report is specifically the sales-order status.
  // Date/client filters apply to the other datasets, but order status must not
  // accidentally remove invoices, quotes, or clients from their own metrics.
  const sharedFilters = useMemo(() => ({
    ...filters,
    vendor: "",
    category: "",
    status: "",
    user: "",
    branch: "",
    department: "",
  }), [filters]);
  const orders = useMemo(
    () => applyReportFilters(
      getOrders().map((order) => ({ ...order, createdAt: order.orderDate ?? order.createdAt })),
      { ...sharedFilters, status: filters.status },
    ),
    [liveRevision, sharedFilters, filters.status],
  );
  const invoices = useMemo(
    () => applyReportFilters(
      getInvoices().map((invoice) => ({ ...invoice, createdAt: invoice.invoiceDate ?? invoice.createdAt })),
      sharedFilters,
    ),
    [liveRevision, sharedFilters],
  );
  const quotes = useMemo(
    () => applyReportFilters(
      getQuotes().map((quote) => ({ ...quote, createdAt: quote.quoteDate ?? quote.createdAt })),
      sharedFilters,
    ),
    [liveRevision, sharedFilters],
  );
  const clients = useMemo(() => getClients(), [liveRevision]);
  const selectedClients = clients.filter((client) =>
    (!filters.client || client.name === filters.client) &&
    String(client.status || "").toLowerCase() === "active",
  );
  const paidInvoices = invoices.filter((invoice) => invoice.status === "Paid");
  const sentQuotes = quotes.filter((quote) => quote.status !== "Draft");
  const validOrders = orders.filter((order) => order.status !== "Cancelled" && order.status !== "Draft");

  const totalRevenue = paidInvoices.reduce((sum, invoice) => sum + (invoice.grandTotal ?? 0), 0);
  const avgOrderValue = validOrders.length > 0
    ? validOrders.reduce((sum, order) => sum + (order.grandTotal ?? 0), 0) / validOrders.length
    : 0;
  const acceptedQuotes = sentQuotes.filter((quote) => quote.status === "Accepted").length;
  const conversionRate = sentQuotes.length > 0
    ? ((acceptedQuotes / sentQuotes.length) * 100).toFixed(1)
    : "0.0";

  const revenueTrend = getRecentReportMonths().map(({ key, label }) => ({
    month: label,
    revenue: paidInvoices
      .filter((invoice) => getReportMonthKey(invoice.invoiceDate ?? invoice.createdAt) === key)
      .reduce((sum, invoice) => sum + (invoice.grandTotal ?? 0), 0),
  }));

  // Revenue means cash collected, so exclude unpaid and cancelled invoices.
  const clientRev: Record<string, number> = {};
  paidInvoices.forEach(inv => {
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
        <FilterBar clients={clients.map((client) => client.name)} statuses={["Draft","Confirmed","Processing","Completed","Cancelled"]} statusLabel="Order Status" />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard title="Total Revenue" value={`₹${totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
            icon={<DollarSign className="w-4 h-4 text-blue-600" />} iconBg="bg-blue-50" />
          <KpiCard title="Sales Orders" value={orders.length}
            icon={<ShoppingBag className="w-4 h-4 text-indigo-600" />} iconBg="bg-indigo-50" />
          <KpiCard title="Quotes Sent" value={sentQuotes.length}
            icon={<FileText className="w-4 h-4 text-amber-600" />} iconBg="bg-amber-50" />
          <KpiCard title="Quote Conversion" value={`${conversionRate}%`}
            icon={<TrendingUp className="w-4 h-4 text-emerald-600" />} iconBg="bg-emerald-50" />
          <KpiCard title="Avg Order Value" value={`₹${avgOrderValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
            icon={<Receipt className="w-4 h-4 text-purple-600" />} iconBg="bg-purple-50" />
          <KpiCard title="Active Clients" value={selectedClients.length}
            icon={<Users className="w-4 h-4 text-teal-600" />} iconBg="bg-teal-50" />
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
          { type: "positive", text: `${paidInvoices.length} paid invoices generated ₹${totalRevenue.toLocaleString("en-IN")} in revenue for the selected filters.` },
          { type: "info", text: sentQuotes.length > 0 ? `${acceptedQuotes} of ${sentQuotes.length} sent quotes were accepted (${conversionRate}% conversion).` : "No sent quotes match the selected filters." },
          { type: "positive", text: topClients.length > 0 ? `${topClients[0].name} is the top revenue client, contributing ₹${topClients[0].revenue.toLocaleString()}.` : "Create invoices to see client revenue rankings." },
          { type: "warning", text: `${invoices.filter(i => i.status === "Overdue").length} invoices are overdue for the selected filters.` },
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
