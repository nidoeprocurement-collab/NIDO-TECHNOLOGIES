import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePageMeta } from "@/contexts/PageMetaContext";
import {
  getBuiltinReportView,
  getBuiltinReportSchedule,
  getCustomReports,
  saveBuiltinReportSchedule,
  saveCustomReport,
  type BuiltinReportSchedule,
  type BuiltinReportView,
  type CustomReport,
  type ReportFormat,
  type ReportFrequency,
} from "@/lib/reportStore";
import { getOrders, type StoredSalesOrder } from "@/lib/salesOrderStore";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useI18n } from "@/i18n/I18nProvider";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Download, Calendar, Pencil, ChevronLeft, ChevronRight,
  FileSpreadsheet, FileText, Users, ShoppingCart, Building2,
  Package, HeadphonesIcon, Settings2, CheckCircle2, XCircle,
  Clock, BarChart3, ChevronDown, Filter, Eye, MoreVertical, Copy,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getPrefix } from "@/lib/configService";

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
  return formatCurrency(base);
}

function dateKey(value: string): string {
  const direct = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (direct) return direct[1];
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getOrderValue(order: StoredSalesOrder, column: string): string {
  switch (column) {
    case "ID":
    case "Order ID":
      return order.orderNumber || order.id;
    case "Created On":
    case "Order Date":
      return formatDate(order.orderDate || order.createdAt);
    case "Created By":
      return order.assignedTo || "—";
    case "Client Name":
      return order.clientName || "—";
    case "Vendor Name":
      return "—";
    case "Order Status":
    case "Status":
      return order.status;
    case "Amount":
      return formatCurrency(order.subtotal);
    case "Tax":
      return formatCurrency(order.totalTax);
    case "Total":
      return formatCurrency(order.grandTotal);
    default:
      return "—";
  }
}

const REPORT_FREQUENCIES: ReportFrequency[] = ["One Time", "Daily", "Weekly", "Monthly", "Quarterly"];

function toTimeInputValue(value: string): string {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (!match) return "08:00";
  let hours = Number(match[1]);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem) {
    hours %= 12;
    if (meridiem === "PM") hours += 12;
  }
  return `${String(hours).padStart(2, "0")}:${match[2]}`;
}

function toStoredTime(value: string): string {
  const [hoursRaw, minutes] = value.split(":");
  const hours = Number(hoursRaw);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${String(hour12).padStart(2, "0")}:${minutes} ${suffix}`;
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
    case "Order ID":        return `${getPrefix("order") || "ORD-"}2026-${String(i + 1).padStart(4, "0")}`;
    case "Order Date":      return fmtDate(i) + " " + fmtTime(10 + (i % 8), (i * 17) % 60);
    case "Order Status":    return ["Completed", "Pending", "Cancelled", "Completed", "Pending", "Completed", "Completed", "Pending", "Completed", "Pending"][i];
    case "Amount":          return fmtAmount(50000 + (idx * 17531) % 200000);
    case "Tax":             return fmtAmount(Math.round((50000 + (idx * 17531) % 200000) * 0.18));
    case "Total":           return fmtAmount(Math.round((50000 + (idx * 17531) % 200000) * 1.18));
    case "Item Name":       return ["Laptop Pro", "Office Chair", "Printer Ink", "USB Hub", "Monitor 24\"", "Keyboard", "Desk Lamp", "Webcam", "Headset", "Mouse"][i];
    case "SKU":             return `${getPrefix("sku") || "SKU-"}${String(1000 + idx).padStart(6, "0")}`;
    case "Category":        return ["Electronics", "Furniture", "Consumables", "Peripherals", "Accessories"][i % 5];
    case "Price":           return fmtAmount(500 + (idx * 1234) % 50000);
    case "Stock":           return String(5 + (idx * 7) % 200);
    case "Unit":            return ["pcs", "box", "set", "pack"][i % 4];
    case "Service Name":    return ["AC Maintenance", "IT Support", "Network Setup", "Server Repair", "CCTV Install", "UPS Service", "Printer Fix", "WiFi Config", "Data Backup", "Security Audit"][i];
    case "Request Date":    return fmtDate(i);
    case "Status":          return STATUSES[i % STATUSES.length];
    case "Priority":        return PRIORITIES[i % PRIORITIES.length];
    case "Assigned To":     return ["Rahul Sharma", "Priya Mehta", "Amit Verma", "Sneha Iyer", "Vikram Singh"][i % 5];
    case "Ticket ID":       return `${getPrefix("supportTicket") || "TKT-"}2026-${String(i + 1).padStart(4, "0")}`;
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

function getKpis(module: string, orders: StoredSalesOrder[] = []): KpiConfig[] {
  switch (module) {
    case "Orders": {
      const completed = orders.filter((order) => order.status === "Completed").length;
      const pending = orders.filter((order) => ["Draft", "Confirmed", "Processing"].includes(order.status)).length;
      const cancelled = orders.filter((order) => order.status === "Cancelled").length;
      const totalValue = orders.reduce((sum, order) => sum + (Number(order.grandTotal) || 0), 0);
      return [
        { label: "Total Orders", value: orders.length.toLocaleString(), icon: <ShoppingCart className="w-5 h-5 text-blue-500" />, iconBg: "bg-blue-50" },
        { label: "Total Order Value", value: formatCurrency(totalValue, undefined, { compact: true }), icon: <BarChart3 className="w-5 h-5 text-green-500" />, iconBg: "bg-green-50" },
        { label: "Completed Orders", value: completed.toLocaleString(), icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />, iconBg: "bg-emerald-50", valColor: "text-emerald-600" },
        { label: "Pending Orders", value: pending.toLocaleString(), icon: <Clock className="w-5 h-5 text-amber-500" />, iconBg: "bg-amber-50", valColor: "text-amber-600" },
        { label: "Cancelled Orders", value: cancelled.toLocaleString(), icon: <XCircle className="w-5 h-5 text-red-400" />, iconBg: "bg-red-50", valColor: "text-red-500" },
      ];
    }
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

function getFilters(module: string, orders: StoredSalesOrder[] = []) {
  const base = [
    {
      label: "Date Range",
      type: "daterange" as const,
      value: "Jul 01, 2026 – Jul 31, 2026",
    },
  ];
  switch (module) {
    case "Orders": {
      const clients = [...new Set(orders.map((order) => order.clientName).filter(Boolean))].sort();
      const statuses = [...new Set(orders.map((order) => order.status))].sort();
      return [
        ...base,
        { label: "Client", type: "select" as const, options: ["All Clients", ...clients], value: "All Clients" },
        { label: "Status", type: "select" as const, options: ["All Status", ...statuses], value: "All Status" },
      ];
    }
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

function ReportScheduleDialog({ reportId, reportName, onClose, onSaved }: {
  reportId: string;
  reportName: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const customReport = getCustomReports().find((item) => item.id === reportId);
  const savedBuiltin = getBuiltinReportSchedule(reportId);
  const [frequency, setFrequency] = useState<ReportFrequency>(
    customReport?.frequency ?? savedBuiltin?.frequency ?? "Daily"
  );
  const [time, setTime] = useState(toTimeInputValue(customReport?.time ?? savedBuiltin?.time ?? "08:00 AM"));
  const [timeZone, setTimeZone] = useState(customReport?.timeZone ?? savedBuiltin?.timeZone ?? "(IST) Asia/Kolkata");
  const [emailOn, setEmailOn] = useState(customReport?.deliveryEmail ?? savedBuiltin?.deliveryEmail ?? false);
  const [recipients, setRecipients] = useState(customReport?.emailRecipients ?? savedBuiltin?.emailRecipients ?? "");

  const handleSave = () => {
    const emails = recipients.split(",").map((email) => email.trim()).filter(Boolean);
    if (emailOn && (!emails.length || emails.some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))) {
      toast({ title: "Enter valid recipient email addresses", variant: "destructive" });
      return;
    }
    const schedule: BuiltinReportSchedule = {
      frequency,
      time: toStoredTime(time),
      timeZone,
      deliveryEmail: emailOn,
      emailRecipients: emails.join(", "),
    };
    if (customReport) saveCustomReport({ ...customReport, ...schedule });
    else saveBuiltinReportSchedule(reportId, schedule);
    toast({ title: "Schedule updated", description: `Schedule saved for ${reportName}.` });
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md mx-4 rounded-2xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Schedule report</h2>
            <p className="mt-0.5 text-xs text-gray-500">{reportName}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close schedule settings" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <XCircle className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4">
          <label className="block text-xs font-medium text-gray-700">
            Frequency
            <select value={frequency} onChange={(event) => setFrequency(event.target.value as ReportFrequency)} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
              {REPORT_FREQUENCIES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-gray-700">
              Run time
              <input type="time" value={time} onChange={(event) => setTime(event.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
            </label>
            <label className="block text-xs font-medium text-gray-700">
              Time zone
              <select value={timeZone} onChange={(event) => setTimeZone(event.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                {["(IST) Asia/Kolkata", "(UTC) Universal", "UTC", "EST (UTC-5)", "CST (UTC-6)", "MST (UTC-7)", "PST (UTC-8)", "(EST) America/New_York", "(PST) America/Los_Angeles", "(GMT) Europe/London"].map((zone) => <option key={zone}>{zone}</option>)}
              </select>
            </label>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" checked={emailOn} onChange={(event) => setEmailOn(event.target.checked)} />
              Email report
            </label>
            {emailOn && (
              <input value={recipients} onChange={(event) => setRecipients(event.target.value)} placeholder="name@example.com, another@example.com" className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="button" onClick={handleSave} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Save Schedule</button>
        </div>
      </div>
    </div>
  );
}

const STATUS_COLS = new Set([
  "Client Status","Vendor Status","Order Status","Status","Priority",
]);

// ── Main page ──────────────────────────────────────────────────────────────────

export default function CustomReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useI18n();

  const report: CustomReport | BuiltinReportView | undefined = useMemo(
    () => (id ? getCustomReports().find((r) => r.id === id) ?? getBuiltinReportView(id) : undefined),
    [id],
  );

  usePageMeta({ title: report?.name ?? "Report Detail" });

  const [orders, setOrders] = useState<StoredSalesOrder[]>(() => getOrders());
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [appliedFilterValues, setAppliedFilterValues] = useState<Record<string, string>>({});
  const [draftDateRange, setDraftDateRange] = useState({ from: "", to: "" });
  const [appliedDateRange, setAppliedDateRange] = useState({ from: "", to: "" });
  const [page, setPage] = useState(1);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [rowMenuOrderId, setRowMenuOrderId] = useState<string | null>(null);
  const rowMenuRef = useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 10;

  useEffect(() => {
    const refresh = () => setOrders(getOrders());
    window.addEventListener("nidoSalesOrdersUpdated", refresh);
    return () => window.removeEventListener("nidoSalesOrdersUpdated", refresh);
  }, []);

  useEffect(() => {
    if (!rowMenuOrderId) return;
    const closeOutside = (event: MouseEvent) => {
      if (rowMenuRef.current && !rowMenuRef.current.contains(event.target as Node)) {
        setRowMenuOrderId(null);
      }
    };
    document.addEventListener("mousedown", closeOutside);
    return () => document.removeEventListener("mousedown", closeOutside);
  }, [rowMenuOrderId]);

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
  const isOrderReport = report.module === "Orders";
  const filterConfig = getFilters(report.module, orders);
  const filteredOrders = isOrderReport
    ? orders.filter((order) => {
        const client = appliedFilterValues.Client;
        const status = appliedFilterValues.Status;
        const orderDate = dateKey(order.orderDate || order.createdAt);
        if (client && client !== "All Clients" && order.clientName !== client) return false;
        if (status && status !== "All Status" && order.status !== status) return false;
        if (appliedDateRange.from && (!orderDate || orderDate < appliedDateRange.from)) return false;
        if (appliedDateRange.to && (!orderDate || orderDate > appliedDateRange.to)) return false;
        return true;
      })
    : [];
  const totalRows = isOrderReport ? filteredOrders.length : 50;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const startRow = totalRows === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endRow = Math.min(page * PAGE_SIZE, totalRows);
  const pageOrders = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rows: { index: number; values: string[]; order?: StoredSalesOrder }[] = isOrderReport
    ? pageOrders.map((order, index) => ({
        index: (page - 1) * PAGE_SIZE + index,
        order,
        values: columns.map((column) => getOrderValue(order, column)),
      }))
    : Array.from({ length: PAGE_SIZE }, (_, index) => {
        const rowIndex = (page - 1) * PAGE_SIZE + index;
        return { index: rowIndex, values: columns.map((column) => getMockValue(column, rowIndex)) };
      });
  const kpis = getKpis(report.module, isOrderReport ? filteredOrders : []);
  const genStr = `${formatDate(new Date())} ${new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
  const exportRows = isOrderReport
    ? filteredOrders.map((order) => columns.map((column) => getOrderValue(order, column)))
    : rows.map((row) => row.values);
  const firstVisiblePage = Math.max(1, Math.min(page - 2, totalPages - 4));

  const handleApplyFilters = () => {
    if (draftDateRange.from && draftDateRange.to && draftDateRange.from > draftDateRange.to) {
      toast({ title: "Date range is invalid", description: "The start date must be on or before the end date.", variant: "destructive" });
      return;
    }
    setAppliedFilterValues(filterValues);
    setAppliedDateRange(draftDateRange);
    setPage(1);
    setRowMenuOrderId(null);
    toast({ title: "Filters applied" });
  };

  const handleExport = (format: ReportFormat) => {
    const filename = report.name.trim().replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "report";
    const safeRows = exportRows.map((row) => row.map((value) => String(value ?? "")));
    if (format === "CSV") {
      const escapeCell = (value: string) => `"${value.replace(/"/g, '""')}"`;
      const csv = [columns, ...safeRows].map((row) => row.map(escapeCell).join(",")).join("\r\n");
      const blobUrl = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${filename}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 0);
    } else if (format === "PDF") {
      const doc = new jsPDF({ orientation: columns.length > 5 ? "landscape" : "portrait" });
      doc.text(report.name, 14, 15);
      autoTable(doc, { head: [columns], body: safeRows, startY: 22, styles: { fontSize: 8 } });
      doc.save(`${filename}.pdf`);
    } else {
      const worksheet = XLSX.utils.aoa_to_sheet([columns, ...safeRows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
      XLSX.writeFile(workbook, `${filename}.xlsx`);
    }
    toast({ title: `${format} export started`, description: `${safeRows.length} filtered report rows exported.` });
  };

  const handleApplySchedule = () => setScheduleOpen(true);
  const handleEditReport = () => {
    const isCustom = "reportType" in report;
    navigate(isCustom
      ? `/reports/create?edit=${encodeURIComponent(report.id)}`
      : `/reports/create?clone=${encodeURIComponent(report.id)}`);
  };

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

  const copyOrderNumber = async (order: StoredSalesOrder) => {
    try {
      await navigator.clipboard.writeText(order.orderNumber || order.id);
      toast({ title: "Order number copied", description: order.orderNumber || order.id });
    } catch {
      toast({ title: "Could not copy order number", variant: "destructive" });
    }
    setRowMenuOrderId(null);
  };

  return (
    <div className="space-y-5 pb-8">

      {/* ── Breadcrumb ───────────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500">
        <button onClick={() => navigate("/reports")} className="hover:text-blue-600 transition-colors">
          Reports
        </button>
        <ChevronRight className="w-3.5 h-3.5" />
        <button onClick={() => navigate("reportType" in report ? "/reports?module=custom" : "/reports")} className="hover:text-blue-600 transition-colors">
          {"reportType" in report ? "Custom Reports" : "All Reports"}
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
            onClick={() => handleExport(report.format)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={handleApplySchedule}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            <Calendar className="w-4 h-4" /> Schedule
          </button>
          <button
            onClick={handleEditReport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Pencil className="w-4 h-4" /> {"reportType" in report ? "Edit Report" : "Customize Report"}
          </button>
        </div>
      </div>
      {scheduleOpen && (
        <ReportScheduleDialog
          reportId={report.id}
          reportName={report.name}
          onClose={() => setScheduleOpen(false)}
          onSaved={() => setScheduleOpen(false)}
        />
      )}

      {/* ── Filters ──────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
        <div className="flex items-center gap-3 flex-wrap">
          {filterConfig.map((f, fi) => (
            <div key={fi} className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">{f.label}</label>
              {f.type === "daterange" ? (
                isOrderReport ? (
                  <div className="flex items-center gap-2">
                    <input
                      aria-label="Start date"
                      type="date"
                      value={draftDateRange.from}
                      onChange={(event) => setDraftDateRange((range) => ({ ...range, from: event.target.value }))}
                      className="min-w-[145px] rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-700"
                    />
                    <span className="text-xs text-gray-400">to</span>
                    <input
                      aria-label="End date"
                      type="date"
                      value={draftDateRange.to}
                      onChange={(event) => setDraftDateRange((range) => ({ ...range, to: event.target.value }))}
                      className="min-w-[145px] rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-700"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white min-w-[200px]">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="text-sm">{f.value}</span>
                  </div>
                )
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
              onClick={handleApplyFilters}
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
              Showing {startRow} to {endRow} of {totalRows.toLocaleString()} records
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
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => firstVisiblePage + i).map((pg) => (
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
              {rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1} className="py-12 text-center text-sm text-gray-400">
                    No orders match the selected filters.
                  </td>
                </tr>
              )}
              {rows.map(({ index, values, order }) => (
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
                    {order && (
                      <div className="relative">
                        <button
                          type="button"
                          aria-label={`Actions for ${order.orderNumber || order.id}`}
                          onClick={() => setRowMenuOrderId((current) => current === order.id ? null : order.id)}
                          className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>
                        {rowMenuOrderId === order.id && (
                          <div ref={rowMenuRef} className="absolute right-0 top-full z-30 mt-1 w-40 rounded-lg border border-gray-100 bg-white py-1 shadow-xl">
                            <button
                              type="button"
                              onClick={() => { setRowMenuOrderId(null); navigate(`/sales/orders/${order.id}`); }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
                            >
                              <Eye className="h-3.5 w-3.5" /> View order
                            </button>
                            <button
                              type="button"
                              onClick={() => void copyOrderNumber(order)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
                            >
                              <Copy className="h-3.5 w-3.5" /> Copy order number
                            </button>
                          </div>
                        )}
                      </div>
                    )}
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
            onClick={() => handleExport("Excel")}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" /> Export Excel
          </button>
          <button
            onClick={() => handleExport("PDF")}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            <FileText className="w-4 h-4 text-red-500" /> Export PDF
          </button>
        </div>
      </div>
    </div>
  );
}
