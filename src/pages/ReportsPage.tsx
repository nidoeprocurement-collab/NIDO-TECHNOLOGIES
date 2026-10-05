import { useState, useMemo, lazy, Suspense, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePageMeta } from "@/contexts/PageMetaContext";
import ReportShellContext from "@/contexts/ReportShellContext";

// Lazy-loaded BI report pages (rendered inline when a tile is active)
const ExecutiveDashboardPage  = lazy(() => import("@/pages/reports/ExecutiveDashboardPage"));
const SalesReportPage         = lazy(() => import("@/pages/reports/SalesReportPage"));
const ProcurementReportPage   = lazy(() => import("@/pages/reports/ProcurementReportPage"));
const VendorPerformancePage   = lazy(() => import("@/pages/reports/VendorPerformancePage"));
const ClientReportPage        = lazy(() => import("@/pages/reports/ClientReportPage"));
const InventoryReportPage     = lazy(() => import("@/pages/reports/InventoryReportPage"));
const FinanceReportPage       = lazy(() => import("@/pages/reports/FinanceReportPage"));
const SupportReportPage       = lazy(() => import("@/pages/reports/SupportReportPage"));
const SlaReportPage           = lazy(() => import("@/pages/reports/SlaReportPage"));
const ApprovalReportPage      = lazy(() => import("@/pages/reports/ApprovalReportPage"));
const TaxReportPage           = lazy(() => import("@/pages/reports/TaxReportPage"));
const AuditTrailPage          = lazy(() => import("@/pages/AuditTrailPage"));
import {
  getCustomReports,
  deleteCustomReport,
  saveCustomReport,
  generateReportId,
  getBuiltinReportSchedule,
  saveBuiltinReportSchedule,
  moduleToCategoryLabel,
  scheduleLabel as buildScheduleLabel,
  type CustomReport,
} from "@/lib/reportStore";
import { getClients } from "@/lib/clientStore";
import { getVendors } from "@/lib/vendorDataStore";
import { getUsers } from "@/lib/nidoUsersStore";
import { getCatalogProducts } from "@/lib/catalogStore";
import { getOrders } from "@/lib/salesOrderStore";
import { getSupportTickets } from "@/lib/supportTicketStore";
import { getServiceRequests } from "@/lib/serviceRequestsStore";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Building2,
  UserCog,
  Package,
  ShoppingCart,
  HeadphonesIcon,
  DollarSign,
  Settings2,
  Search,
  Filter,
  ChevronDown,
  Eye,
  Download,
  MoreVertical,
  Clock,
  CalendarDays,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  CheckSquare,
  Receipt,
  FileSearch,
  Database,
  Columns3,
  SlidersHorizontal,
  Send,
  Play,
  Pencil,
  Plus,
  ArrowRight,
  Wrench,
  Trash2,
  X,
  Mail,
  ChevronRight,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

// ── Types ──────────────────────────────────────────────────────────────────────

type ReportCategory = "Orders" | "Clients" | "Vendors" | "Support" | "Services" | "Users" | "All";
type ReportFormat = "Excel" | "PDF" | "CSV";
type TabKey = "all" | "scheduled" | "mine" | "shared";

interface ReportRow {
  id: string;
  isCustom?: boolean;
  name: string;
  description: string;
  category: Exclude<ReportCategory, "All">;
  createdBy: string;
  scheduleLabel: string;
  scheduleIcon: "recurring" | "calendar";
  lastRunDate: string;
  lastRunTime: string;
  lastRunStatus: "Success" | "Failed" | "Pending";
  format: ReportFormat;
}

interface ScheduledReport {
  id: string;
  name: string;
  schedule: string;
  nextRun: string;
  recipients: string;
  format: ReportFormat;
}

// ── Static data ────────────────────────────────────────────────────────────────

const REPORTS: ReportRow[] = [
  {
    id: "r1",
    name: "Master Order Report",
    description: "Summary of all orders across clients and vendors",
    category: "Orders",
    createdBy: "System Admin",
    scheduleLabel: "Daily\n08:00 AM",
    scheduleIcon: "recurring",
    lastRunDate: "Jul 31, 2026",
    lastRunTime: "08:00 AM",
    lastRunStatus: "Success",
    format: "Excel",
  },
  {
    id: "r2",
    name: "Client Activity Report",
    description: "Client users, catalog, orders and requests",
    category: "Clients",
    createdBy: "System Admin",
    scheduleLabel: "Weekly\nEvery Monday 09:00 AM",
    scheduleIcon: "recurring",
    lastRunDate: "Jul 28, 2026",
    lastRunTime: "09:00 AM",
    lastRunStatus: "Success",
    format: "PDF",
  },
  {
    id: "r3",
    name: "Vendor Performance Report",
    description: "Vendor users, catalog, orders and tickets",
    category: "Vendors",
    createdBy: "System Admin",
    scheduleLabel: "Weekly\nEvery Monday 09:00 AM",
    scheduleIcon: "recurring",
    lastRunDate: "Jul 28, 2026",
    lastRunTime: "09:00 AM",
    lastRunStatus: "Success",
    format: "Excel",
  },
  {
    id: "r4",
    name: "Support Tickets Report",
    description: "All support tickets and resolution status",
    category: "Support",
    createdBy: "System Admin",
    scheduleLabel: "Daily\n07:00 PM",
    scheduleIcon: "recurring",
    lastRunDate: "Jul 30, 2026",
    lastRunTime: "07:00 PM",
    lastRunStatus: "Success",
    format: "PDF",
  },
  {
    id: "r5",
    name: "Services Requests Report",
    description: "All service requests and status",
    category: "Services",
    createdBy: "System Admin",
    scheduleLabel: "Daily\n06:00 PM",
    scheduleIcon: "recurring",
    lastRunDate: "Jul 30, 2026",
    lastRunTime: "06:00 PM",
    lastRunStatus: "Success",
    format: "Excel",
  },
  {
    id: "r6",
    name: "User Summary Report",
    description: "All platform users and roles",
    category: "Users",
    createdBy: "System Admin",
    scheduleLabel: "Monthly\n1st of every month",
    scheduleIcon: "calendar",
    lastRunDate: "Jul 01, 2026",
    lastRunTime: "09:00 AM",
    lastRunStatus: "Success",
    format: "Excel",
  },
];

const SCHEDULED: ScheduledReport[] = [
  {
    id: "s1",
    name: "Master Order Report",
    schedule: "Daily at 08:00 AM",
    nextRun: "Aug 01, 2026 08:00 AM",
    recipients: "admin@nido-tech.com, reports@nido-tech.com",
    format: "Excel",
  },
  {
    id: "s2",
    name: "Client Activity Report",
    schedule: "Weekly on Monday 09:00 AM",
    nextRun: "Aug 04, 2026 09:00 AM",
    recipients: "admin@nido-tech.com",
    format: "PDF",
  },
  {
    id: "s3",
    name: "Vendor Performance Report",
    schedule: "Weekly on Monday 09:00 AM",
    nextRun: "Aug 04, 2026 09:00 AM",
    recipients: "admin@nido-tech.com, vendor@nido-tech.com",
    format: "Excel",
  },
];

const CATEGORIES: ReportCategory[] = ["All", "Orders", "Clients", "Vendors", "Support", "Services", "Users"];
const FORMATS: (ReportFormat | "All Formats")[] = ["All Formats", "Excel", "PDF", "CSV"];

const CATEGORY_COLORS: Record<Exclude<ReportCategory, "All">, string> = {
  Orders: "bg-blue-100 text-blue-700",
  Clients: "bg-emerald-100 text-emerald-700",
  Vendors: "bg-purple-100 text-purple-700",
  Support: "bg-orange-100 text-orange-700",
  Services: "bg-pink-100 text-pink-700",
  Users: "bg-indigo-100 text-indigo-700",
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function FormatBadge({ format }: { format: ReportFormat }) {
  if (format === "Excel")
    return (
      <span className="flex items-center gap-1 text-xs text-green-700">
        <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" /> Excel
      </span>
    );
  if (format === "PDF")
    return (
      <span className="flex items-center gap-1 text-xs text-red-600">
        <FileText className="w-3.5 h-3.5" /> PDF
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-xs text-gray-600">
      <FileSpreadsheet className="w-3.5 h-3.5" /> {format}
    </span>
  );
}

// ── Edit Schedule Modal ────────────────────────────────────────────────────────

const FREQ_OPTIONS: CustomReport["frequency"][] = ["One Time", "Daily", "Weekly", "Monthly", "Quarterly"];
const TZ_OPTIONS = ["UTC", "EST (UTC-5)", "CST (UTC-6)", "MST (UTC-7)", "PST (UTC-8)", "IST (UTC+5:30)", "CET (UTC+1)", "AEST (UTC+10)"];

function EditScheduleModal({ report, reportName, onClose, onSaved }: {
  report: ReportRow;
  reportName: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const reportId = report.id;
  const stored = getCustomReports().find((r) => r.id === reportId);
  const savedBuiltinSchedule = getBuiltinReportSchedule(reportId);
  const defaultFrequency = report.scheduleLabel.split("\n")[0] as CustomReport["frequency"];
  const defaultRecipients = SCHEDULED.find((scheduled) => scheduled.name === reportName)?.recipients ?? "";
  const [frequency, setFrequency] = useState<CustomReport["frequency"]>(
    stored?.frequency ?? savedBuiltinSchedule?.frequency ?? defaultFrequency
  );
  const [time, setTime] = useState(stored?.time ?? savedBuiltinSchedule?.time ?? report.lastRunTime ?? "08:00 AM");
  const [timeZone, setTimeZone] = useState(stored?.timeZone ?? savedBuiltinSchedule?.timeZone ?? "UTC");
  const [emailOn, setEmailOn] = useState(
    stored?.deliveryEmail ?? savedBuiltinSchedule?.deliveryEmail ?? Boolean(defaultRecipients)
  );
  const [recipients, setRecipients] = useState(
    stored?.emailRecipients ?? savedBuiltinSchedule?.emailRecipients ?? defaultRecipients
  );

  const handleSave = () => {
    const schedule = { frequency, time, timeZone, deliveryEmail: emailOn, emailRecipients: recipients };
    if (stored) saveCustomReport({ ...stored, ...schedule });
    else saveBuiltinReportSchedule(reportId, schedule);
    onSaved();
    toast({ title: "Schedule updated", description: `"${reportName}" schedule has been saved.` });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Edit Schedule</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{reportName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Frequency */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Frequency</label>
            <div className="grid grid-cols-3 gap-2">
              {FREQ_OPTIONS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={`px-2 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    frequency === f
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Time</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="08:00 AM"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Time Zone</label>
              <div className="relative">
                <select
                  value={timeZone}
                  onChange={(e) => setTimeZone(e.target.value)}
                  className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white pr-7"
                >
                  {TZ_OPTIONS.map((tz) => <option key={tz}>{tz}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Email delivery */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={emailOn}
                onChange={(e) => setEmailOn(e.target.checked)}
                className="w-4 h-4 rounded accent-blue-600"
              />
              <span className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                <Mail className="w-3.5 h-3.5 text-gray-400" /> Email Delivery
              </span>
            </label>
            {emailOn && (
              <input
                type="text"
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                placeholder="email@example.com, another@example.com"
                className="mt-2.5 w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2.5 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
          >
            Save Schedule
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Download helper ────────────────────────────────────────────────────────────

function downloadReportAsCSV(report: ReportRow) {
  const stored = getCustomReports().find((r) => r.id === report.id);
  const columns = stored?.selectedColumns?.length
    ? stored.selectedColumns
    : ["ID", "Name", "Status", "Date", "Amount"];

  // Build a simple 5-row CSV with placeholder data
  const MOCK_VALUES: Record<string, string[]> = {
    default: ["Value 1", "Value 2", "Value 3", "Value 4", "Value 5"],
  };
  const rows = Array.from({ length: 5 }, (_, i) =>
    columns.map((col) => MOCK_VALUES[col]?.[i] ?? `${col} ${i + 1}`).join(",")
  );

  const csv = [columns.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${report.name.replace(/[^a-z0-9]/gi, "_")}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Row Actions ────────────────────────────────────────────────────────────────

function RowActions({ report, onRefresh }: { report: ReportRow; onRefresh?: () => void }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isCustom = report.isCustom === true;

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleView = () => {
    setOpen(false);
    navigate(`/reports/custom/${report.id}`);
  };

  const handleDownload = () => {
    setOpen(false);
    downloadReportAsCSV(report);
    toast({ title: "Download started", description: `${report.name}.csv is downloading.` });
  };

  const handleEditSchedule = () => {
    setOpen(false);
    setScheduleOpen(true);
  };

  const handleDelete = () => {
    setOpen(false);
    if (isCustom) {
      deleteCustomReport(report.id);
      onRefresh?.();
      toast({ title: "Report deleted", description: `"${report.name}" has been removed.` });
    } else {
      toast({ title: "Cannot delete built-in reports." });
    }
  };

  return (
    <>
      {scheduleOpen && (
        <EditScheduleModal
          report={report}
          reportName={report.name}
          onClose={() => setScheduleOpen(false)}
          onSaved={() => onRefresh?.()}
        />
      )}
      <div className="flex items-center gap-1 relative">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((p) => !p)}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-1">
              <button
                onClick={handleView}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors text-left"
              >
                <Eye className="w-3.5 h-3.5" /> View Report
              </button>
              <button
                onClick={handleDownload}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors text-left"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
              <button
                onClick={handleEditSchedule}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors text-left"
              >
                <Clock className="w-3.5 h-3.5" /> Edit Schedule
              </button>
              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Tabs content ───────────────────────────────────────────────────────────────

function ReportTable({
  reports,
  search,
  category,
  format,
  onRefresh,
}: {
  reports: ReportRow[];
  search: string;
  category: ReportCategory;
  format: ReportFormat | "All Formats";
  onRefresh?: () => void;
}) {
  const navigate = useNavigate();
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      const matchSearch =
        !search ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === "All" || r.category === category;
      const matchFmt = format === "All Formats" || r.format === format;
      return matchSearch && matchCat && matchFmt;
    });
  }, [reports, search, category, format]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="w-8 py-3 px-3">
                <input type="checkbox" className="rounded border-gray-300" />
              </th>
              {["Report Name", "Category", "Created By", "Schedule", "Last Run", "Actions"].map((h) => (
                <th key={h} className="py-3 px-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((r) => (
              <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                <td className="py-3 px-3">
                  <input type="checkbox" className="rounded border-gray-300" />
                </td>
                <td className="py-3 px-3 min-w-[200px]">
                  <button
                    onClick={() => navigate(`/reports/custom/${r.id}`)}
                    className="text-left group"
                  >
                    <div className="font-medium text-blue-600 group-hover:text-blue-800 group-hover:underline text-sm transition-colors">{r.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{r.description}</div>
                  </button>
                </td>
                <td className="py-3 px-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[r.category]}`}>
                    {r.category}
                  </span>
                </td>
                <td className="py-3 px-3 text-xs text-gray-600 whitespace-nowrap">{r.createdBy}</td>
                <td className="py-3 px-3">
                  <div className="flex items-start gap-1.5">
                    {r.scheduleIcon === "recurring" ? (
                      <Clock className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                    ) : (
                      <CalendarDays className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                    )}
                    <div className="text-xs text-gray-700 leading-snug whitespace-pre-line">{r.scheduleLabel}</div>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <div className="text-xs text-gray-700 whitespace-nowrap">{r.lastRunDate} {r.lastRunTime}</div>
                  <div className={`text-xs font-medium mt-0.5 ${r.lastRunStatus === "Success" ? "text-emerald-600" : r.lastRunStatus === "Failed" ? "text-red-500" : "text-amber-500"}`}>
                    {r.lastRunStatus}
                  </div>
                </td>
                <td className="py-3 px-3">
                  <RowActions report={r} onRefresh={onRefresh} />
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm text-gray-400">
                  No reports found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex items-center justify-between px-3 py-3 border-t border-gray-100">
        <span className="text-xs text-gray-500">
          Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to{" "}
          {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} reports
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="px-2 py-1 text-xs rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
          >
            «
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-2 py-1 text-xs rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
          >
            ‹
          </button>
          {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-2.5 py-1 text-xs rounded border transition-colors ${p === page ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 hover:bg-gray-50"}`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-2 py-1 text-xs rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
          >
            ›
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            className="px-2 py-1 text-xs rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
          >
            »
          </button>
          <select
            value={PAGE_SIZE}
            className="ml-2 text-xs border border-gray-200 rounded px-1.5 py-1 bg-white"
            readOnly
          >
            <option>10 / page</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function ScheduledReportsTab() {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {["Report Name", "Category", "Created By", "Schedule", "Next Run", "Recipients", "Format", "Actions"].map((h) => (
                <th key={h} className="py-3 px-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {REPORTS.filter((r) => r.scheduleIcon === "recurring" || r.scheduleIcon === "calendar").map((r) => {
              const sched = SCHEDULED.find((s) => s.name === r.name);
              return (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-medium text-gray-900 text-sm">{r.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{r.description}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[r.category]}`}>
                      {r.category}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-xs text-gray-600">{r.createdBy}</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-700">
                      <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      {sched?.schedule ?? r.scheduleLabel.replace("\n", " ")}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-xs text-gray-700 whitespace-nowrap">
                    {sched?.nextRun ?? "—"}
                  </td>
                  <td className="py-3 px-3 text-xs text-gray-600 max-w-[220px] truncate">
                    {sched?.recipients ?? "admin@nido-tech.com"}
                  </td>
                  <td className="py-3 px-3">
                    <FormatBadge format={r.format} />
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      <button
                        title="Run now"
                        onClick={() => toast({ title: "Running: " + r.name })}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Edit schedule"
                        onClick={() => toast({ title: "Edit schedule: " + r.name })}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="More"
                        onClick={() => toast({ title: "Options: " + r.name })}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-3 py-3 border-t border-gray-100 text-xs text-gray-500">
        Showing 1 to {REPORTS.length} of {REPORTS.length} reports
      </div>
    </div>
  );
}

function MyReportsTab() {
  return (
    <div className="py-16 text-center">
      <FileSpreadsheet className="w-10 h-10 text-gray-300 mx-auto mb-3" />
      <p className="text-sm font-medium text-gray-500">No personal reports yet</p>
      <p className="text-xs text-gray-400 mt-1">Reports you create will appear here</p>
      <Button size="sm" className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-xs">
        <Plus className="w-3.5 h-3.5 mr-1" /> Create Report
      </Button>
    </div>
  );
}

function SharedReportsTab() {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {["Report Name", "Category", "Shared By", "Shared On", "Format", "Actions"].map((h) => (
                <th key={h} className="py-3 px-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {REPORTS.slice(0, 3).map((r) => (
              <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                <td className="py-3 px-3">
                  <div className="font-medium text-gray-900 text-sm">{r.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{r.description}</div>
                </td>
                <td className="py-3 px-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[r.category]}`}>
                    {r.category}
                  </span>
                </td>
                <td className="py-3 px-3 text-xs text-gray-600">{r.createdBy}</td>
                <td className="py-3 px-3 text-xs text-gray-600 whitespace-nowrap">{r.lastRunDate}</td>
                <td className="py-3 px-3">
                  <FormatBadge format={r.format} />
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => toast({ title: "Viewing: " + r.name })} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => toast({ title: "Downloading: " + r.name })} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-3 py-3 border-t border-gray-100 text-xs text-gray-500">
        Showing 1 to 3 of 3 reports
      </div>
    </div>
  );
}

// ── Create Report Modal ────────────────────────────────────────────────────────

function CreateReportModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [source, setSource] = useState("");
  const [reportName, setReportName] = useState("");

  const sources = ["Orders", "Clients", "Vendors", "Support Tickets", "Service Requests", "Users", "Catalog Items"];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Create a Custom Report</h2>
            <p className="text-xs text-gray-500 mt-0.5">Build a report by selecting data, columns, filters and schedule.</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-400">✕</button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-6">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-blue-600" : "bg-gray-200"}`} />
          ))}
        </div>

        {step === 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">1. Select Data Source</label>
            <div className="grid grid-cols-2 gap-2">
              {sources.map((s) => (
                <button
                  key={s}
                  onClick={() => setSource(s)}
                  className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${source === s ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 hover:bg-gray-50"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {step === 2 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Name</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`${source} Report`}
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-3">2. Select the columns you want to include. All columns selected by default.</p>
            {["Name", "Status", "Date", "Amount", "Category", "Created By"].map((col) => (
              <label key={col} className="flex items-center gap-2 mt-2 text-sm text-gray-700">
                <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600" /> {col}
              </label>
            ))}
          </div>
        )}
        {step === 3 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">3. Apply Filters</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Date Range</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option>Last 30 days</option>
                  <option>Last 7 days</option>
                  <option>This month</option>
                  <option>Custom range</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Status</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option>All Statuses</option>
                  <option>Active</option>
                  <option>Pending</option>
                  <option>Completed</option>
                </select>
              </div>
            </div>
          </div>
        )}
        {step === 4 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">4. Schedule & Delivery</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Frequency</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option>Once</option>
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Format</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option>Excel</option>
                  <option>PDF</option>
                  <option>CSV</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Recipients (comma separated)</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="admin@nido-tech.com" />
              </div>
            </div>
          </div>
        )}
        {step === 5 && (
          <div className="text-center py-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-900">Ready to Run</p>
            <p className="text-xs text-gray-500 mt-1">
              Your report <strong>{reportName || `${source} Report`}</strong> is configured and ready.
            </p>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <Button variant="outline" size="sm" onClick={step === 1 ? onClose : () => setStep((s) => s - 1)} className="text-xs">
            {step === 1 ? "Cancel" : "← Back"}
          </Button>
          <Button
            size="sm"
            disabled={step === 1 && !source}
            onClick={() => {
              if (step < 5) setStep((s) => s + 1);
              else { toast({ title: "Report created!", description: `${reportName || source + " Report"} has been saved.` }); onClose(); }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
          >
            {step === 5 ? "Create Report" : "Next →"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

/** Convert a stored CustomReport to the ReportRow shape used by the table */
function customToRow(r: CustomReport): ReportRow {
  const catLabel = moduleToCategoryLabel(r.module);
  const cat: Exclude<ReportCategory, "All"> =
    catLabel === "All Modules" ? "Orders" : (catLabel as Exclude<ReportCategory, "All">);
  const fmt: ReportFormat =
    r.format === "CSV" ? "CSV" : r.format === "PDF" ? "PDF" : "Excel";
  return {
    id: r.id,
    isCustom: true,
    name: r.name,
    description: r.description || r.reportType,
    category: cat,
    createdBy: r.createdBy,
    scheduleLabel: buildScheduleLabel(r.frequency, r.time),
    scheduleIcon: r.frequency === "Monthly" || r.frequency === "Quarterly" ? "calendar" : "recurring",
    lastRunDate: r.lastRunDate ?? r.createdAt.split(" ")[0],
    lastRunTime: r.time,
    lastRunStatus: r.lastRunStatus ?? "Pending",
    format: fmt,
  };
}

export default function ReportsPage() {
  usePageMeta({ title: "Reports" });
  const navigate = useNavigate();

  // Live counts from stores
  const clients = getClients();
  const vendors = getVendors();
  const users = getUsers();
  const catalog = getCatalogProducts();
  const orders = getOrders();
  const tickets = getSupportTickets();
  const serviceReqs = getServiceRequests();

  // Custom reports from store (re-read on every render so additions appear immediately)
  const [customReports, setCustomReports] = useState<ReportRow[]>(() =>
    getCustomReports().map(customToRow)
  );

  const [builtinScheduleRevision, setBuiltinScheduleRevision] = useState(0);
  const refreshReports = () => {
    setCustomReports(getCustomReports().map(customToRow));
    setBuiltinScheduleRevision((revision) => revision + 1);
  };

  const builtInReports = useMemo(
    () => REPORTS.map((report) => {
      const schedule = getBuiltinReportSchedule(report.id);
      if (!schedule) return report;
      return {
        ...report,
        scheduleLabel: buildScheduleLabel(schedule.frequency, schedule.time),
        scheduleIcon: schedule.frequency === "Monthly" || schedule.frequency === "Quarterly" ? "calendar" as const : "recurring" as const,
        lastRunTime: schedule.time,
      };
    }),
    [builtinScheduleRevision]
  );
  const allReports = useMemo(() => [...customReports, ...builtInReports], [customReports, builtInReports]);

  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<ReportCategory>("All");
  const [fmtFilter, setFmtFilter] = useState<ReportFormat | "All Formats">("All Formats");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const TABS: { key: TabKey; label: string }[] = [
    { key: "all", label: "All Reports" },
    { key: "scheduled", label: "Scheduled Reports" },
    { key: "mine", label: "My Reports" },
    { key: "shared", label: "Shared Reports" },
  ];

  const stats = [
    { label: "Total Clients", value: clients.length || 58, icon: <Users className="w-5 h-5 text-blue-500" />, bg: "bg-blue-50" },
    { label: "Total Vendors", value: vendors.length || 142, icon: <Building2 className="w-5 h-5 text-purple-500" />, bg: "bg-purple-50" },
    { label: "Total Users", value: users.length || 1248, icon: <UserCog className="w-5 h-5 text-indigo-500" />, bg: "bg-indigo-50" },
    { label: "All Catalog Items", value: catalog.length || 12856, icon: <Package className="w-5 h-5 text-orange-500" />, bg: "bg-orange-50" },
    { label: "Total Orders", value: orders.length || 24536, icon: <ShoppingCart className="w-5 h-5 text-emerald-500" />, bg: "bg-emerald-50" },
    { label: "Total Tickets", value: tickets.length || 3124, icon: <HeadphonesIcon className="w-5 h-5 text-rose-500" />, bg: "bg-rose-50" },
    { label: "Total Requests", value: serviceReqs.length || 1875, icon: <Settings2 className="w-5 h-5 text-cyan-500" />, bg: "bg-cyan-50" },
  ];

  const statTitles = ["Clients", "Vendors", "Users", "Catalog Items", "Orders", "Support Tickets", "Services Requests"];

  const CREATE_STEPS = [
    { icon: <Database className="w-4 h-4 text-blue-500" />, step: "1. Select Data Source", desc: "Choose the module you want to report on" },
    { icon: <Columns3 className="w-4 h-4 text-blue-500" />, step: "2. Add Columns", desc: "Choose the columns to include in report" },
    { icon: <SlidersHorizontal className="w-4 h-4 text-blue-500" />, step: "3. Apply Filters", desc: "Set conditions to filter the data" },
    { icon: <Send className="w-4 h-4 text-blue-500" />, step: "4. Schedule & Delivery", desc: "Set frequency, time and recipients" },
    { icon: <Play className="w-4 h-4 text-blue-500" />, step: "5. Run Report", desc: "Run now or save and schedule" },
  ];

  const [activeModule, setActiveModule] = useState<string | null>(null);

  const BI_MODULES = [
    { id: "executive",   label: "Executive Dashboard",  desc: "Revenue, profit, KPIs & growth",        icon: <LayoutDashboard className="w-5 h-5" />, color: "bg-blue-50 text-blue-600",    ring: "ring-blue-400",    activeText: "text-blue-700"    },
    { id: "sales",       label: "Sales Reports",         desc: "Quotes, orders, invoices & revenue",    icon: <TrendingUp className="w-5 h-5" />,      color: "bg-emerald-50 text-emerald-600", ring: "ring-emerald-400", activeText: "text-emerald-700" },
    { id: "procurement", label: "Procurement",            desc: "POs, spend & approval cycles",          icon: <ShoppingCart className="w-5 h-5" />,    color: "bg-purple-50 text-purple-600",  ring: "ring-purple-400",  activeText: "text-purple-700"  },
    { id: "vendors",     label: "Vendor Performance",    desc: "Ratings, spend & delivery metrics",     icon: <Building2 className="w-5 h-5" />,       color: "bg-indigo-50 text-indigo-600",  ring: "ring-indigo-400",  activeText: "text-indigo-700"  },
    { id: "clients",     label: "Client Reports",        desc: "Revenue, contracts & activity",         icon: <Users className="w-5 h-5" />,           color: "bg-teal-50 text-teal-600",      ring: "ring-teal-400",    activeText: "text-teal-700"    },
    { id: "inventory",   label: "Inventory Reports",     desc: "Stock levels, movements & alerts",      icon: <Package className="w-5 h-5" />,         color: "bg-orange-50 text-orange-600",  ring: "ring-orange-400",  activeText: "text-orange-700"  },
    { id: "finance",     label: "Finance Reports",       desc: "P&L, cash flow & receivables",          icon: <DollarSign className="w-5 h-5" />,      color: "bg-green-50 text-green-600",    ring: "ring-green-400",   activeText: "text-green-700"   },
    { id: "support",     label: "Support Reports",       desc: "Tickets, resolution & SLA",             icon: <HeadphonesIcon className="w-5 h-5" />,  color: "bg-rose-50 text-rose-600",      ring: "ring-rose-400",    activeText: "text-rose-700"    },
    { id: "sla",         label: "SLA Reports",           desc: "Compliance, breaches & trends",         icon: <Clock className="w-5 h-5" />,           color: "bg-cyan-50 text-cyan-600",      ring: "ring-cyan-400",    activeText: "text-cyan-700"    },
    { id: "approvals",   label: "Approval Reports",      desc: "Pending, approved & rejected",          icon: <CheckSquare className="w-5 h-5" />,     color: "bg-amber-50 text-amber-600",    ring: "ring-amber-400",   activeText: "text-amber-700"   },
    { id: "tax",         label: "Tax Reports",           desc: "GST, CGST, SGST & ITC summary",         icon: <Receipt className="w-5 h-5" />,         color: "bg-pink-50 text-pink-600",      ring: "ring-pink-400",    activeText: "text-pink-700"    },
    { id: "audit",       label: "Audit Reports",         desc: "User activity & system logs",           icon: <FileSearch className="w-5 h-5" />,      color: "bg-gray-100 text-gray-600",     ring: "ring-gray-400",    activeText: "text-gray-700"    },
    { id: "custom",      label: "Custom Reports",        desc: "Create, schedule & manage reports",     icon: <Wrench className="w-5 h-5" />,          color: "bg-violet-50 text-violet-600",  ring: "ring-violet-400",  activeText: "text-violet-700"  },
  ];

  function toggleModule(id: string) {
    setActiveModule((prev) => (prev === id ? null : id));
  }

  return (
    <div className="space-y-5">
      {showCreateModal && <CreateReportModal onClose={() => setShowCreateModal(false)} />}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Click any module to view its analytics. Click again to collapse.</p>
        </div>
        <Button
          onClick={() => navigate("/reports/create")}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Create Report
        </Button>
      </div>

      {/* ── Module tiles (always visible) ───────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500">Select a module to view its report inline</p>
          {activeModule && (
            <button
              onClick={() => setActiveModule(null)}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
            >
              ✕ Close panel
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 p-4">
          {BI_MODULES.map((m) => {
            const isActive = activeModule === m.id;
            return (
              <button
                key={m.id}
                onClick={() => toggleModule(m.id)}
                className={`flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all text-left group ${
                  isActive
                    ? `border-current ${m.ring.replace("ring-", "border-")} shadow-sm bg-white`
                    : "border-gray-100 hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                <div className={`w-9 h-9 rounded-lg ${m.color} flex items-center justify-center shrink-0`}>
                  {m.icon}
                </div>
                <div className="min-w-0 w-full">
                  <p className={`text-xs font-semibold leading-tight truncate ${isActive ? m.activeText : "text-gray-800"}`}>
                    {m.label}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-tight line-clamp-2">{m.desc}</p>
                </div>
                {isActive && (
                  <span className={`text-[10px] font-semibold ${m.activeText}`}>▲ open</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Inline BI module content ─────────────────────────────────────── */}
      {activeModule && activeModule !== "custom" && (
        <ReportShellContext.Provider value={{ inline: true }}>
          <Suspense fallback={
            <div className="flex items-center justify-center bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-gray-400 text-sm gap-2">
              <span className="animate-spin">⟳</span> Loading report…
            </div>
          }>
            {activeModule === "executive"   && <ExecutiveDashboardPage />}
            {activeModule === "sales"       && <SalesReportPage />}
            {activeModule === "procurement" && <ProcurementReportPage />}
            {activeModule === "vendors"     && <VendorPerformancePage />}
            {activeModule === "clients"     && <ClientReportPage />}
            {activeModule === "inventory"   && <InventoryReportPage />}
            {activeModule === "finance"     && <FinanceReportPage />}
            {activeModule === "support"     && <SupportReportPage />}
            {activeModule === "sla"         && <SlaReportPage />}
            {activeModule === "approvals"   && <ApprovalReportPage />}
            {activeModule === "tax"         && <TaxReportPage />}
            {activeModule === "audit"       && <AuditTrailPage />}
          </Suspense>
        </ReportShellContext.Provider>
      )}

      {/* ── Custom Reports inline content ───────────────────────────────── */}
      {activeModule === "custom" && (
        <div className="space-y-5">

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {stats.map((s, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3.5 flex flex-col gap-2">
                <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}>
                  {s.icon}
                </div>
                <div>
                  <div className="text-xs text-gray-500 leading-tight">{statTitles[i]}</div>
                  <div className="text-xl font-bold text-gray-900 leading-tight">{s.value.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Table + create panel */}
          <div className="flex gap-4 items-start">
            {/* Left: tabs + table */}
            <div className="flex-1 min-w-0 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex border-b border-gray-100 px-4 pt-3 gap-1">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === t.key
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {activeTab === "all" && (
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
                  <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search reports..."
                      className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    />
                  </div>
                  <div className="relative">
                    <select
                      value={catFilter}
                      onChange={(e) => setCatFilter(e.target.value as ReportCategory)}
                      className="appearance-none pl-3 pr-7 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <select
                      value={fmtFilter}
                      onChange={(e) => setFmtFilter(e.target.value as ReportFormat | "All Formats")}
                      className="appearance-none pl-3 pr-7 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      {FORMATS.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                  </div>
                  <button
                    onClick={() => { setSearch(""); setCatFilter("All"); setFmtFilter("All Formats"); }}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
                  >
                    <Filter className="w-3.5 h-3.5" /> Clear
                  </button>
                </div>
              )}

              {activeTab === "all"       && <ReportTable reports={allReports} search={search} category={catFilter} format={fmtFilter} onRefresh={refreshReports} />}
              {activeTab === "scheduled" && <ScheduledReportsTab />}
              {activeTab === "mine"      && <MyReportsTab />}
              {activeTab === "shared"    && <SharedReportsTab />}
            </div>

            {/* Right: Create panel */}
            <div className="w-64 shrink-0 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Create a Custom Report</h3>
              <p className="text-xs text-gray-400 mb-4">Build a report by selecting data, columns, filters and schedule.</p>
              <div className="space-y-3.5">
                {CREATE_STEPS.map(({ icon, step, desc }) => (
                  <div key={step} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                      {icon}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-800">{step}</div>
                      <div className="text-xs text-gray-400 leading-snug">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => navigate("/reports/create")}
                className="w-full mt-5 bg-blue-600 hover:bg-blue-700 text-white text-sm"
              >
                Create Report
              </Button>
            </div>
          </div>

          {/* Upcoming Scheduled Reports */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Upcoming Scheduled Reports</h3>
              <button
                onClick={() => setActiveTab("scheduled")}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                View All Scheduled
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    {["Report Name", "Schedule", "Next Run", "Recipients", "Format", ""].map((h, i) => (
                      <th key={i} className="py-2.5 px-4 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SCHEDULED.map((s) => (
                    <tr key={s.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <button onClick={() => toast({ title: "Viewing: " + s.name })} className="text-sm font-medium text-blue-600 hover:underline text-left">
                          {s.name}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600 whitespace-nowrap">{s.schedule}</td>
                      <td className="py-3 px-4 text-xs text-gray-600 whitespace-nowrap">{s.nextRun}</td>
                      <td className="py-3 px-4 text-xs text-gray-500 max-w-[240px] truncate">{s.recipients}</td>
                      <td className="py-3 px-4"><FormatBadge format={s.format} /></td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => toast({ title: "Edit: " + s.name })} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => toast({ title: "Options: " + s.name })} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
