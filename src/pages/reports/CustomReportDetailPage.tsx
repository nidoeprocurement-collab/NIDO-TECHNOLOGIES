import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePageMeta } from "@/contexts/PageMetaContext";
import { getCustomReports, type CustomReport } from "@/lib/reportStore";
import {
  Download, Calendar, Pencil, ChevronLeft, ChevronRight,
  FileSpreadsheet, FileText, Users, ShoppingCart, Building2,
  Package, HeadphonesIcon, Settings2, CheckCircle2, XCircle,
  Clock, BarChart3, ChevronDown, Filter, Eye, MoreVertical,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

// ── Mock data helpers ──────────────────────────────────────────────────────────

const CLIENT_NAMES = [
  "TechNova Solutions", "Bright Future Ltd", "Innovatech Pvt Ltd",
  "Global Enterprises", "Alpha Infotech", "NextGen Systems",
  "Skyline Corp", "Vertex Solutions", "Zento Technologies",
  "Pinnacle Industries", "Horizon Tech", "Apex Corp",
  "BlueStar Solutions", "Delta Systems", "Omega Industries",
];
const VENDOR_NAMES = [
  "Prime Supplies Pvt Ltd", "Office Needs Co.", "PanTree Supplies",
  "FurniHub Pvt Ltd", "Tech Solutions Pvt Ltd", "Metro Logistics",
  "Rapid Supply Co.", "National Distributors", "Allied Traders",
  "Capital Goods Ltd",
];
const STATUSES = ["Completed", "Pending", "Cancelled", "Active", "Inactive"];
const PRIORITIES = ["High", "Medium", "Low", "Critical"];
const ROLES = ["System Admin", "Client Admin", "Client User", "Vendor Admin", "Vendor User"];
const CITIES = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Pune", "Kolkata", "Ahmedabad"];

function fmtDate(offset = 0) {
  const d = new Date(2026, 6, 31 - offset);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtTime(h = 10, m = 45) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} AM`;
}
function fmtAmount(base: number) {
  return `₹${base.toLocaleString("en-IN")}`;
}

function getMockValue(col: string, idx: number): string {
  const i = idx % 10;
  switch (col) {
    case "ID":              return String(idx + 1).padStart(3, "0");
    case "Created On":      return fmtDate(i);
    case "Created By":      return ROLES[i % ROLES.length];
    case "Client Name":     return CLIENT_NAMES[i];
    case "Client Email":    return `info@${CLIENT_NAMES[i].toLowerCase().replace(/\s+/g, "")}.com`;
    case "Client Phone":    return `+91 9${(800000000 + idx * 11111).toString().slice(0, 9)}`;
    case "Client City":     return CITIES[i % CITIES.length];
    case "Client Status":   return i < 7 ? "Active" : "Inactive";
    case "Client Tier":     return ["Gold", "Silver", "Bronze", "Platinum"][i % 4];
    case "Contract Start":  return fmtDate(30 + i);
    case "Contract End":    return fmtDate(-180 + i);
    case "Vendor Name":     return VENDOR_NAMES[i % VENDOR_NAMES.length];
    case "Vendor Email":    return `contact@${VENDOR_NAMES[i % VENDOR_NAMES.length].toLowerCase().replace(/\s+/g, "")}.com`;
    case "Vendor Phone":    return `+91 9${(700000000 + idx * 13579).toString().slice(0, 9)}`;
    case "Vendor Category": return ["Electronics", "Office Supplies", "Furniture", "Logistics", "IT Services"][i % 5];
    case "Vendor Status":   return i < 8 ? "Active" : "Inactive";
    case "Rating":          return `${(3.5 + (i % 15) * 0.1).toFixed(1)} / 5`;
    case "Order ID":        return `ORD-2026-${String(i + 1).padStart(4, "0")}`;
    case "Order Date":      return fmtDate(i) + " " + fmtTime(10 + (i % 8), (i * 17) % 60);
    case "Order Status":    return ["Completed", "Pending", "Cancelled", "Completed", "Pending", "Completed", "Completed", "Pending", "Completed", "Pending"][i];
    case "Amount":          return fmtAmount(50000 + (idx * 17531) % 200000);
    case "Tax":             return fmtAmount(Math.round((50000 + (idx * 17531) % 200000) * 0.18));
    case "Total":           return fmtAmount(Math.round((50000 + (idx * 17531) % 200000) * 1.18));
    case "Item Name":       return ["Laptop Pro", "Office Chair", "Printer Ink", "USB Hub", "Monitor 24\"", "Keyboard", "Desk Lamp", "Webcam", "Headset", "Mouse"][i];
    case "SKU":             return `SKU-${String(1000 + idx).padStart(6, "0")}`;
    case "Category":        return ["Electronics", "Furniture", "Consumables", "Peripherals", "Accessories"][i % 5];
    case "Price":           return fmtAmount(500 + (idx * 1234) % 50000);
    case "Stock":           return String(5 + (idx * 7) % 200);
    case "Unit":            return ["pcs", "box", "set", "pack"][i % 4];
    case "Service Name":    return ["AC Maintenance", "IT Support", "Network Setup", "Server Repair", "CCTV Install", "UPS Service", "Printer Fix", "WiFi Config", "Data Backup", "Security Audit"][i];
    case "Request Date":    return fmtDate(i);
    case "Status":          return STATUSES[i % STATUSES.length];
    case "Priority":        return PRIORITIES[i % PRIORITIES.length];
    case "Assigned To":     return ["Rahul Sharma", "Priya Mehta", "Amit Verma", "Sneha Iyer", "Vikram Singh"][i % 5];
    case "Ticket ID":       return `TKT-2026-${String(i + 1).padStart(4, "0")}`;
    case "Subject":         return ["Login issue", "Payment failed", "Report error", "Access denied", "Slow performance", "Data mismatch", "Email not sent", "Export broken", "UI bug", "Missing invoice"][i];
    case "Resolution Date": return i < 6 ? fmtDate(i + 2) : "—";
    case "Agent":           return ["Rahul S.", "Priya M.", "Amit V.", "Sneha I.", "Vikram S."][i % 5];
    default:                return "—";
  }
}

// ── Module KPI configs ─────────────────────────────────────────────────────────

interface KpiConfig {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
  valColor?: string;
}

function getKpis(module: string): KpiConfig[] {
  switch (module) {
    case "Orders":
      return [
        { label: "Total Orders",      value: "1,248",         icon: <ShoppingCart className="w-5 h-5 text-blue-500" />,    iconBg: "bg-blue-50" },
        { label: "Total Order Value",  value: "₹2,45,85,650",  icon: <BarChart3 className="w-5 h-5 text-green-500" />,     iconBg: "bg-green-50" },
        { label: "Completed Orders",   value: "968",           icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, iconBg: "bg-emerald-50", valColor: "text-emerald-600" },
        { label: "Pending Orders",     value: "214",           icon: <Clock className="w-5 h-5 text-amber-500" />,          iconBg: "bg-amber-50",  valColor: "text-amber-600" },
        { label: "Cancelled Orders",   value: "66",            icon: <XCircle className="w-5 h-5 text-red-400" />,          iconBg: "bg-red-50",    valColor: "text-red-500" },
      ];
    case "Clients":
      return [
        { label: "Total Clients",        value: "58",   icon: <Users className="w-5 h-5 text-blue-500" />,      iconBg: "bg-blue-50" },
        { label: "Completed Activities", value: "968",  icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, iconBg: "bg-emerald-50", valColor: "text-emerald-600" },
        { label: "Pending Activities",   value: "214",  icon: <Clock className="w-5 h-5 text-amber-500" />,       iconBg: "bg-amber-50",   valColor: "text-amber-600" },
        { label: "Cancelled Activities", value: "66",   icon: <XCircle className="w-5 h-5 text-red-400" />,       iconBg: "bg-red-50",     valColor: "text-red-500" },
        { label: "Total Activities",     value: "1,248",icon: <BarChart3 className="w-5 h-5 text-indigo-500" />,  iconBg: "bg-indigo-50",  valColor: "text-indigo-600" },
      ];
    case "Vendors":
      return [
        { label: "Total Vendors",    value: "142",  icon: <Building2 className="w-5 h-5 text-purple-500" />,  iconBg: "bg-purple-50" },
        { label: "Active Vendors",   value: "118",  icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, iconBg: "bg-emerald-50", valColor: "text-emerald-600" },
        { label: "Inactive Vendors", value: "24",   icon: <XCircle className="w-5 h-5 text-red-400" />,         iconBg: "bg-red-50",     valColor: "text-red-500" },
        { label: "Avg Rating",       value: "4.2",  icon: <BarChart3 className="w-5 h-5 text-amber-500" />,     iconBg: "bg-amber-50" },
        { label: "Total POs",        value: "3,124",icon: <ShoppingCart className="w-5 h-5 text-blue-500" />,   iconBg: "bg-blue-50" },
      ];
    case "Services":
      return [
        { label: "Total Requests",    value: "1,875", icon: <Settings2 className="w-5 h-5 text-cyan-500" />,    iconBg: "bg-cyan-50" },
        { label: "Completed",         value: "1,340", icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, iconBg: "bg-emerald-50", valColor: "text-emerald-600" },
        { label: "Pending",           value: "412",   icon: <Clock className="w-5 h-5 text-amber-500" />,         iconBg: "bg-amber-50",   valColor: "text-amber-600" },
        { label: "Cancelled",         value: "123",   icon: <XCircle className="w-5 h-5 text-red-400" />,         iconBg: "bg-red-50",     valColor: "text-red-500" },
        { label: "Avg Resolution",    value: "2.4 days", icon: <BarChart3 className="w-5 h-5 text-blue-500" />,  iconBg: "bg-blue-50" },
      ];
    case "Support Tickets":
      return [
        { label: "Total Tickets",  value: "3,124",icon: <HeadphonesIcon className="w-5 h-5 text-rose-500" />,   iconBg: "bg-rose-50" },
        { label: "Resolved",       value: "2,580",icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,  iconBg: "bg-emerald-50", valColor: "text-emerald-600" },
        { label: "Open",           value: "412",  icon: <Clock className="w-5 h-5 text-amber-500" />,            iconBg: "bg-amber-50",   valColor: "text-amber-600" },
        { label: "Critical",       value: "132",  icon: <XCircle className="w-5 h-5 text-red-400" />,            iconBg: "bg-red-50",     valColor: "text-red-500" },
        { label: "Avg Resolution", value: "1.8 days", icon: <BarChart3 className="w-5 h-5 text-blue-500" />,    iconBg: "bg-blue-50" },
      ];
    case "Catalog":
      return [
        { label: "Total Items",    value: "12,856", icon: <Package className="w-5 h-5 text-orange-500" />,      iconBg: "bg-orange-50" },
        { label: "Active Items",   value: "11,204", icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, iconBg: "bg-emerald-50", valColor: "text-emerald-600" },
        { label: "Low Stock",      value: "234",    icon: <Clock className="w-5 h-5 text-amber-500" />,           iconBg: "bg-amber-50",   valColor: "text-amber-600" },
        { label: "Out of Stock",   value: "68",     icon: <XCircle className="w-5 h-5 text-red-400" />,           iconBg: "bg-red-50",     valColor: "text-red-500" },
        { label: "Categories",     value: "48",     icon: <BarChart3 className="w-5 h-5 text-indigo-500" />,     iconBg: "bg-indigo-50" },
      ];
    default: // All Modules
      return [
        { label: "Total Records",  value: "1,248",  icon: <BarChart3 className="w-5 h-5 text-blue-500" />,       iconBg: "bg-blue-50" },
        { label: "Clients",        value: "58",     icon: <Users className="w-5 h-5 text-emerald-500" />,         iconBg: "bg-emerald-50" },
        { label: "Vendors",        value: "142",    icon: <Building2 className="w-5 h-5 text-purple-500" />,      iconBg: "bg-purple-50" },
        { label: "Orders",         value: "1,248",  icon: <ShoppingCart className="w-5 h-5 text-blue-600" />,    iconBg: "bg-blue-50" },
        { label: "Support Tickets",value: "3,124",  icon: <HeadphonesIcon className="w-5 h-5 text-rose-500" />,  iconBg: "bg-rose-50" },
      ];
  }
}

// ── Filter configs ─────────────────────────────────────────────────────────────

function getFilters(module: string) {
  const base = [
    {
      label: "Date Range",
      type: "daterange" as const,
      value: "Jul 01, 2026 – Jul 31, 2026",
    },
  ];
  switch (module) {
    case "Orders":
      return [
        ...base,
        { label: "Client",  type: "select" as const, options: ["All Clients",  ...CLIENT_NAMES.slice(0, 5)], value: "All Clients" },
        { label: "Vendor",  type: "select" as const, options: ["All Vendors",  ...VENDOR_NAMES.slice(0, 5)], value: "All Vendors" },
        { label: "Status",  type: "select" as const, options: ["All Status", "Completed", "Pending", "Cancelled"], value: "All Status" },
      ];
    case "Clients":
      return [
        ...base,
        { label: "Client", type: "select" as const, options: ["All Clients", ...CLIENT_NAMES.slice(0, 5)], value: "All Clients" },
        { label: "Activity Type", type: "select" as const, options: ["All Activities", "Orders", "Invoices", "Requests"], value: "All Activities" },
        { label: "Status", type: "select" as const, options: ["All Status", "Active", "Inactive"], value: "All Status" },
      ];
    case "Vendors":
      return [
        ...base,
        { label: "Vendor",   type: "select" as const, options: ["All Vendors",   ...VENDOR_NAMES.slice(0, 5)], value: "All Vendors" },
        { label: "Category", type: "select" as const, options: ["All Categories","Electronics","Office Supplies","Furniture","Logistics"], value: "All Categories" },
        { label: "Status",   type: "select" as const, options: ["All Status", "Active", "Inactive"], value: "All Status" },
      ];
    default:
      return [
        ...base,
        { label: "Module", type: "select" as const, options: ["All Modules","Clients","Vendors","Orders","Services"], value: "All Modules" },
        { label: "Status", type: "select" as const, options: ["All Status","Active","Inactive","Completed","Pending"], value: "All Status" },
      ];
  }
}

// ── Status badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Completed:  "bg-emerald-100 text-emerald-700",
    Active:     "bg-emerald-100 text-emerald-700",
    Resolved:   "bg-emerald-100 text-emerald-700",
    Pending:    "bg-amber-100 text-amber-700",
    Open:       "bg-amber-100 text-amber-700",
    Inactive:   "bg-gray-100 text-gray-600",
    Cancelled:  "bg-red-100 text-red-600",
    Critical:   "bg-red-100 text-red-600",
  };
  const cls = map[status] ?? "bg-gray-100 text-gray-600";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

const STATUS_COLS = new Set([
  "Client Status","Vendor Status","Order Status","Status","Priority",
]);

// ── Main page ──────────────────────────────────────────────────────────────────

export default function CustomReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const report: CustomReport | undefined = useMemo(
    () => getCustomReports().find((r) => r.id === id),
    [id],
  );

  usePageMeta({ title: report?.name ?? "Report Detail" });

  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const TOTAL_ROWS = 50; // mock total

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <BarChart3 className="w-12 h-12 text-gray-300" />
        <h2 className="text-lg font-semibold text-gray-700">Report Not Found</h2>
        <p className="text-sm text-gray-400">This report may have been deleted or the link is invalid.</p>
        <button
          onClick={() => navigate("/reports")}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
        >
          Back to Reports
        </button>
      </div>
    );
  }

  const columns = report.selectedColumns.length > 0
    ? report.selectedColumns
    : ["ID", "Created On", "Status"];

  const kpis = getKpis(report.module);
  const filterConfig = getFilters(report.module);

  const totalPages = Math.ceil(TOTAL_ROWS / PAGE_SIZE);
  const startRow = (page - 1) * PAGE_SIZE + 1;
  const endRow = Math.min(page * PAGE_SIZE, TOTAL_ROWS);

  const rows = Array.from({ length: PAGE_SIZE }, (_, i) => ({
    index: (page - 1) * PAGE_SIZE + i,
    values: columns.map((col) => getMockValue(col, (page - 1) * PAGE_SIZE + i)),
  }));

  const genDate = new Date(2026, 6, 31, 11, 30);
  const genStr = genDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    + " " + genDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const sectionLabel = (() => {
    switch (report.module) {
      case "Orders":          return "Order Details";
      case "Clients":         return "Client Activity Details";
      case "Vendors":         return "Vendor Details";
      case "Services":        return "Service Request Details";
      case "Support Tickets": return "Support Ticket Details";
      case "Catalog":         return "Catalog Details";
      default:                return "Report Details";
    }
  })();

  return (
    <div className="space-y-5 pb-8">

      {/* ── Breadcrumb ───────────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500">
        <button onClick={() => navigate("/reports")} className="hover:text-blue-600 transition-colors">
          Reports
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-800 font-medium truncate">{report.name}</span>
      </nav>

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{report.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {report.description || `Summary of all ${report.module.toLowerCase()} data across the platform.`}
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => toast({ title: "Exporting report…" })}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={() => toast({ title: "Schedule settings opening…" })}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            <Calendar className="w-4 h-4" /> Schedule
          </button>
          <button
            onClick={() => navigate("/reports/create")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Pencil className="w-4 h-4" /> Edit Report
          </button>
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
        <div className="flex items-center gap-3 flex-wrap">
          {filterConfig.map((f, fi) => (
            <div key={fi} className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">{f.label}</label>
              {f.type === "daterange" ? (
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white min-w-[200px] cursor-pointer hover:bg-gray-50">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="text-sm">{f.value}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-auto" />
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={filterValues[f.label] ?? f.value}
                    onChange={(e) => setFilterValues((p) => ({ ...p, [f.label]: e.target.value }))}
                    className="appearance-none border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[130px]"
                  >
                    {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              )}
            </div>
          ))}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-transparent select-none">apply</label>
            <button
              onClick={() => toast({ title: "Filters applied" })}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Filter className="w-3.5 h-3.5" /> Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────────────── */}
      <div className={`grid gap-3 ${kpis.length === 5 ? "grid-cols-5" : "grid-cols-4"}`}>
        {kpis.map((k, ki) => (
          <div key={ki} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl ${k.iconBg} flex items-center justify-center shrink-0`}>
              {k.icon}
            </div>
            <div>
              <p className="text-xs text-gray-500 leading-tight">{k.label}</p>
              <p className={`text-xl font-bold leading-tight mt-0.5 ${k.valColor ?? "text-gray-900"}`}>{k.value}</p>
              {k.sub && <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* ── Data Table ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table header row */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">{sectionLabel}</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              Showing {startRow} to {endRow} of {TOTAL_ROWS.toLocaleString()} records
            </span>
            {/* Pagination controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`w-7 h-7 flex items-center justify-center rounded border text-xs font-medium transition-colors ${
                    pg === page
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {pg}
                </button>
              ))}
              {totalPages > 5 && <span className="text-xs text-gray-400 px-1">...</span>}
              {totalPages > 5 && (
                <button
                  onClick={() => setPage(totalPages)}
                  className={`w-7 h-7 flex items-center justify-center rounded border text-xs font-medium transition-colors ${
                    page === totalPages
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {totalPages}
                </button>
              )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {columns.map((col) => (
                  <th
                    key={col}
                    className="py-3 px-4 text-left text-xs font-semibold text-gray-500 whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ index, values }) => (
                <tr
                  key={index}
                  className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                >
                  {columns.map((col, ci) => {
                    const val = values[ci];
                    const isStatus = STATUS_COLS.has(col);
                    const isAmount = col === "Amount" || col === "Total" || col === "Tax" || col === "Price";
                    const isName = col === "Client Name" || col === "Vendor Name";
                    return (
                      <td key={col} className="py-3 px-4 whitespace-nowrap">
                        {isStatus ? (
                          <StatusBadge status={val} />
                        ) : isName ? (
                          <span className="text-blue-600 font-medium text-sm">{val}</span>
                        ) : isAmount ? (
                          <span className="text-sm font-medium text-gray-800">{val}</span>
                        ) : (
                          <span className="text-sm text-gray-700">{val}</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-3 px-4">
                    <button className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          Report generated on {genStr} &nbsp;|&nbsp; All times are in (IST) Asia/Kolkata
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast({ title: "Exporting to Excel…" })}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" /> Export Excel
          </button>
          <button
            onClick={() => toast({ title: "Exporting to PDF…" })}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            <FileText className="w-4 h-4 text-red-500" /> Export PDF
          </button>
        </div>
      </div>
    </div>
  );
}
