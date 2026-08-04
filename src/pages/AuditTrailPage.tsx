import { useState, useMemo, Fragment } from "react";
import { usePageMeta } from "@/contexts/PageMetaContext";
import ReportShell from "@/components/reports/ReportShell";
import { useReportShellContext } from "@/contexts/ReportShellContext";
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  User,
  Shield,
  AlertTriangle,
  Info,
  XCircle,
  CheckCircle2,
  LogIn,
  LogOut,
  Edit3,
  Trash2,
  Plus,
  Eye,
  Settings,
  FileText,
  Database,
  Activity,
  Clock,
  Monitor,
  Globe,
  Lock,
  Unlock,
  UserCheck,
  AlertCircle,
  BarChart2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

// ── Types ──────────────────────────────────────────────────────────────────────

type ActivityAction =
  | "Login" | "Logout" | "Failed Login"
  | "Create" | "Edit" | "Delete" | "View" | "Export" | "Download"
  | "Approve" | "Reject" | "Invite" | "Password Reset";

type LogSeverity = "Info" | "Warning" | "Error" | "Critical";

type LogCategory = "Authentication" | "Data" | "System" | "Security" | "Configuration" | "All";

interface UserActivity {
  id: string;
  user: string;
  avatar: string;
  role: string;
  action: ActivityAction;
  resource: string;
  module: string;
  ip: string;
  device: string;
  location: string;
  timestamp: string;
  status: "Success" | "Failed" | "Warning";
  details: string;
}

interface SystemLog {
  id: string;
  severity: LogSeverity;
  category: LogCategory;
  event: string;
  service: string;
  message: string;
  timestamp: string;
  user: string;
  ip: string;
  duration?: string;
  statusCode?: number;
}

// ── Mock Data ──────────────────────────────────────────────────────────────────

const USER_ACTIVITIES: UserActivity[] = [
  { id: "a1",  user: "Arjun Sharma",   avatar: "AS", role: "Admin",        action: "Login",          resource: "Platform",          module: "Auth",          ip: "192.168.1.101", device: "Chrome / Windows",   location: "Mumbai, IN",    timestamp: "Aug 04, 2026 10:42:17", status: "Success", details: "Successful login via email/password" },
  { id: "a2",  user: "Priya Mehta",    avatar: "PM", role: "Manager",      action: "Edit",           resource: "PO-2026-0481",      module: "Purchase",      ip: "192.168.1.45",  device: "Safari / macOS",     location: "Delhi, IN",     timestamp: "Aug 04, 2026 10:38:05", status: "Success", details: "Updated purchase order status to Approved" },
  { id: "a3",  user: "Rahul Kapoor",   avatar: "RK", role: "Procurement",  action: "Create",         resource: "Vendor: TechSupply", module: "Vendors",       ip: "10.0.0.22",     device: "Firefox / Ubuntu",   location: "Bangalore, IN", timestamp: "Aug 04, 2026 10:31:44", status: "Success", details: "New vendor onboarded" },
  { id: "a4",  user: "Sneha Gupta",    avatar: "SG", role: "Finance",      action: "Export",         resource: "Invoice Report",    module: "Reports",       ip: "192.168.2.78",  device: "Edge / Windows",     location: "Pune, IN",      timestamp: "Aug 04, 2026 10:25:09", status: "Success", details: "Exported invoices as Excel (Q2 2026)" },
  { id: "a5",  user: "Unknown",        avatar: "??", role: "—",            action: "Failed Login",   resource: "Platform",          module: "Auth",          ip: "45.33.108.201", device: "Chrome / Linux",     location: "Frankfurt, DE", timestamp: "Aug 04, 2026 10:19:33", status: "Failed",  details: "3 consecutive failed attempts — account locked" },
  { id: "a6",  user: "Arjun Sharma",   avatar: "AS", role: "Admin",        action: "Delete",         resource: "User: Vikram Nair", module: "Users",         ip: "192.168.1.101", device: "Chrome / Windows",   location: "Mumbai, IN",    timestamp: "Aug 04, 2026 10:12:55", status: "Success", details: "User account deactivated" },
  { id: "a7",  user: "Meera Joshi",    avatar: "MJ", role: "Sales",        action: "Create",         resource: "Quote QT-2026-0122",module: "Sales",         ip: "192.168.3.15",  device: "Chrome / macOS",     location: "Chennai, IN",   timestamp: "Aug 04, 2026 09:58:27", status: "Success", details: "New sales quote created for Infosys" },
  { id: "a8",  user: "Priya Mehta",    avatar: "PM", role: "Manager",      action: "Approve",        resource: "Expense EXP-0094",  module: "Finance",       ip: "192.168.1.45",  device: "Safari / macOS",     location: "Delhi, IN",     timestamp: "Aug 04, 2026 09:44:12", status: "Success", details: "Expense report approved — ₹12,500" },
  { id: "a9",  user: "Rahul Kapoor",   avatar: "RK", role: "Procurement",  action: "Download",       resource: "Contract PDF",      module: "Contracts",     ip: "10.0.0.22",     device: "Firefox / Ubuntu",   location: "Bangalore, IN", timestamp: "Aug 04, 2026 09:37:58", status: "Success", details: "Downloaded vendor contract — Rexon Ltd" },
  { id: "a10", user: "Arjun Sharma",   avatar: "AS", role: "Admin",        action: "Invite",         resource: "User: Anil Kumar",  module: "Users",         ip: "192.168.1.101", device: "Chrome / Windows",   location: "Mumbai, IN",    timestamp: "Aug 04, 2026 09:22:04", status: "Success", details: "Invitation sent to anil.kumar@nido-tech.com" },
  { id: "a11", user: "Sneha Gupta",    avatar: "SG", role: "Finance",      action: "Edit",           resource: "Invoice INV-1041",  module: "Sales",         ip: "192.168.2.78",  device: "Edge / Windows",     location: "Pune, IN",      timestamp: "Aug 04, 2026 09:15:31", status: "Warning", details: "Invoice amount revised post-approval" },
  { id: "a12", user: "Meera Joshi",    avatar: "MJ", role: "Sales",        action: "Reject",         resource: "Quote QT-2026-0118",module: "Sales",         ip: "192.168.3.15",  device: "Chrome / macOS",     location: "Chennai, IN",   timestamp: "Aug 04, 2026 09:09:47", status: "Success", details: "Quote rejected — pricing mismatch" },
  { id: "a13", user: "Vikram Nair",    avatar: "VN", role: "Support",      action: "View",           resource: "Ticket TKT-0284",   module: "Support",       ip: "192.168.4.55",  device: "Chrome / Android",   location: "Hyderabad, IN", timestamp: "Aug 04, 2026 08:58:12", status: "Success", details: "Viewed critical ticket detail" },
  { id: "a14", user: "Arjun Sharma",   avatar: "AS", role: "Admin",        action: "Password Reset", resource: "User: Meera Joshi", module: "Users",         ip: "192.168.1.101", device: "Chrome / Windows",   location: "Mumbai, IN",    timestamp: "Aug 04, 2026 08:44:39", status: "Success", details: "Password reset link sent" },
  { id: "a15", user: "Priya Mehta",    avatar: "PM", role: "Manager",      action: "Logout",         resource: "Platform",          module: "Auth",          ip: "192.168.1.45",  device: "Safari / macOS",     location: "Delhi, IN",     timestamp: "Aug 03, 2026 18:30:00", status: "Success", details: "User session ended" },
  { id: "a16", user: "Rahul Kapoor",   avatar: "RK", role: "Procurement",  action: "Create",         resource: "PO-2026-0480",      module: "Purchase",      ip: "10.0.0.22",     device: "Firefox / Ubuntu",   location: "Bangalore, IN", timestamp: "Aug 03, 2026 17:52:11", status: "Success", details: "Purchase order raised for ₹84,000" },
  { id: "a17", user: "Unknown",        avatar: "??", role: "—",            action: "Failed Login",   resource: "Platform",          module: "Auth",          ip: "91.200.48.9",   device: "Unknown",            location: "Moscow, RU",    timestamp: "Aug 03, 2026 16:40:05", status: "Failed",  details: "Brute-force attempt detected — IP blocked" },
  { id: "a18", user: "Sneha Gupta",    avatar: "SG", role: "Finance",      action: "Create",         resource: "Bill BL-0219",      module: "Purchase",      ip: "192.168.2.78",  device: "Edge / Windows",     location: "Pune, IN",      timestamp: "Aug 03, 2026 16:28:44", status: "Success", details: "Vendor bill recorded ₹22,350" },
  { id: "a19", user: "Meera Joshi",    avatar: "MJ", role: "Sales",        action: "Edit",           resource: "Client: Wipro Ltd", module: "Clients",       ip: "192.168.3.15",  device: "Chrome / macOS",     location: "Chennai, IN",   timestamp: "Aug 03, 2026 15:14:29", status: "Success", details: "Client contact details updated" },
  { id: "a20", user: "Arjun Sharma",   avatar: "AS", role: "Admin",        action: "Settings",       resource: "System Config",     module: "Configuration", ip: "192.168.1.101", device: "Chrome / Windows",   location: "Mumbai, IN",    timestamp: "Aug 03, 2026 14:07:00", status: "Success", details: "Updated SLA thresholds" },
];

const SYSTEM_LOGS: SystemLog[] = [
  { id: "l1",  severity: "Info",     category: "Authentication", event: "User Session Created",       service: "auth-service",     message: "New session token issued for arjun.sharma@nido-tech.com",               timestamp: "Aug 04, 2026 10:42:17", user: "arjun.sharma",  ip: "192.168.1.101", duration: "2ms",   statusCode: 200 },
  { id: "l2",  severity: "Warning",  category: "Security",       event: "Rate Limit Approaching",     service: "api-gateway",      message: "Client 45.33.108.201 hit 80% of rate limit (800/1000 req/min)",          timestamp: "Aug 04, 2026 10:20:01", user: "system",        ip: "45.33.108.201", duration: "—",     statusCode: 429 },
  { id: "l3",  severity: "Critical", category: "Security",       event: "Brute Force Detected",       service: "auth-service",     message: "IP 45.33.108.201 blocked after 10 failed auth attempts in 5 minutes",    timestamp: "Aug 04, 2026 10:19:33", user: "system",        ip: "45.33.108.201", duration: "—",     statusCode: 403 },
  { id: "l4",  severity: "Info",     category: "Data",           event: "Database Backup Completed",  service: "db-scheduler",     message: "Nightly backup successful — 2.4 GB written to /backups/2026-08-04",      timestamp: "Aug 04, 2026 03:00:12", user: "system",        ip: "10.0.0.1",      duration: "4m 22s", statusCode: 200 },
  { id: "l5",  severity: "Error",    category: "System",         event: "Email Delivery Failed",      service: "email-service",    message: "SMTP connection timeout — unable to deliver to external relay smtp.sendgrid.net", timestamp: "Aug 04, 2026 09:55:44", user: "system",        ip: "10.0.0.5",      duration: "30s",   statusCode: 503 },
  { id: "l6",  severity: "Info",     category: "Configuration",  event: "SLA Config Updated",         service: "config-service",   message: "P1 response threshold changed from 2h to 1h by arjun.sharma",           timestamp: "Aug 03, 2026 14:07:00", user: "arjun.sharma",  ip: "192.168.1.101", duration: "12ms",  statusCode: 200 },
  { id: "l7",  severity: "Warning",  category: "System",         event: "High Memory Usage",          service: "app-server-02",    message: "Heap usage at 87% (1.74 GB / 2 GB) — GC pressure increasing",           timestamp: "Aug 03, 2026 13:30:05", user: "system",        ip: "10.0.0.2",      duration: "—",     statusCode: undefined },
  { id: "l8",  severity: "Info",     category: "Authentication", event: "Password Reset Sent",        service: "auth-service",     message: "Reset link dispatched to meera.joshi@nido-tech.com (expires 15 min)",  timestamp: "Aug 04, 2026 08:44:39", user: "arjun.sharma",  ip: "192.168.1.101", duration: "45ms",  statusCode: 200 },
  { id: "l9",  severity: "Error",    category: "Security",       event: "Unauthorized Access Attempt", service: "api-gateway",     message: "JWT token rejected — expired token presented from IP 91.200.48.9",      timestamp: "Aug 03, 2026 16:40:05", user: "unknown",       ip: "91.200.48.9",   duration: "3ms",   statusCode: 401 },
  { id: "l10", severity: "Info",     category: "Data",           event: "Report Exported",            service: "report-service",   message: "Q2 2026 invoice report exported as Excel (18,432 rows) by sneha.gupta",  timestamp: "Aug 04, 2026 10:25:09", user: "sneha.gupta",   ip: "192.168.2.78",  duration: "2.1s",  statusCode: 200 },
  { id: "l11", severity: "Warning",  category: "Data",           event: "Large Query Detected",       service: "db-service",       message: "Query execution time 4.8s — table scan on orders (2.1M rows)",          timestamp: "Aug 04, 2026 09:10:22", user: "report-job",    ip: "10.0.0.3",      duration: "4.8s",  statusCode: 200 },
  { id: "l12", severity: "Info",     category: "System",         event: "Service Health Check",       service: "monitoring",       message: "All 7 services healthy — avg response time 48ms",                       timestamp: "Aug 04, 2026 10:00:00", user: "system",        ip: "10.0.0.1",      duration: "1.2s",  statusCode: 200 },
  { id: "l13", severity: "Critical", category: "System",         event: "Disk Usage Critical",        service: "app-server-01",    message: "Disk /data at 94% capacity — immediate cleanup required",               timestamp: "Aug 03, 2026 11:15:34", user: "system",        ip: "10.0.0.2",      duration: "—",     statusCode: undefined },
  { id: "l14", severity: "Info",     category: "Authentication", event: "New User Invited",           service: "user-service",     message: "Invitation sent to anil.kumar@nido-tech.com with role Procurement",     timestamp: "Aug 04, 2026 09:22:04", user: "arjun.sharma",  ip: "192.168.1.101", duration: "88ms",  statusCode: 201 },
  { id: "l15", severity: "Warning",  category: "Security",       event: "MFA Bypass Attempt",         service: "auth-service",     message: "MFA challenge skipped via recovery code — vikram.nair@nido-tech.com",  timestamp: "Aug 03, 2026 09:05:11", user: "vikram.nair",   ip: "192.168.4.55",  duration: "14ms",  statusCode: 200 },
  { id: "l16", severity: "Info",     category: "Configuration",  event: "Tax Rate Updated",           service: "config-service",   message: "GST rate for HSN 8471 updated 18% → 12% by arjun.sharma",             timestamp: "Aug 02, 2026 15:30:00", user: "arjun.sharma",  ip: "192.168.1.101", duration: "9ms",   statusCode: 200 },
  { id: "l17", severity: "Error",    category: "Data",           event: "PDF Generation Failed",      service: "pdf-service",      message: "Timeout generating Quote QT-2026-0120 PDF — jsPDF error: memory limit", timestamp: "Aug 02, 2026 14:22:18", user: "meera.joshi",   ip: "192.168.3.15",  duration: "30s",   statusCode: 500 },
  { id: "l18", severity: "Info",     category: "System",         event: "Scheduled Job Completed",    service: "scheduler",        message: "Daily email digest sent — 24 recipients, 3 failed",                    timestamp: "Aug 04, 2026 08:00:05", user: "system",        ip: "10.0.0.1",      duration: "18s",   statusCode: 200 },
];

// ── Hourly chart data ──────────────────────────────────────────────────────────
const HOURLY_DATA = [
  { hour: "06:00", activity: 12, errors: 0 },
  { hour: "07:00", activity: 34, errors: 1 },
  { hour: "08:00", activity: 67, errors: 2 },
  { hour: "09:00", activity: 142, errors: 4 },
  { hour: "10:00", activity: 198, errors: 8 },
  { hour: "11:00", activity: 176, errors: 3 },
  { hour: "12:00", activity: 89, errors: 1 },
  { hour: "13:00", activity: 110, errors: 2 },
  { hour: "14:00", activity: 154, errors: 5 },
  { hour: "15:00", activity: 132, errors: 3 },
  { hour: "16:00", activity: 97, errors: 2 },
  { hour: "17:00", activity: 54, errors: 1 },
  { hour: "18:00", activity: 22, errors: 0 },
];

// ── Helper components ──────────────────────────────────────────────────────────

const ACTION_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  Login:          { icon: <LogIn className="w-3.5 h-3.5" />,    color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Logout:         { icon: <LogOut className="w-3.5 h-3.5" />,   color: "bg-gray-100 text-gray-600 border-gray-200" },
  "Failed Login": { icon: <Lock className="w-3.5 h-3.5" />,     color: "bg-red-50 text-red-700 border-red-200" },
  Create:         { icon: <Plus className="w-3.5 h-3.5" />,     color: "bg-blue-50 text-blue-700 border-blue-200" },
  Edit:           { icon: <Edit3 className="w-3.5 h-3.5" />,    color: "bg-amber-50 text-amber-700 border-amber-200" },
  Delete:         { icon: <Trash2 className="w-3.5 h-3.5" />,   color: "bg-red-50 text-red-700 border-red-200" },
  View:           { icon: <Eye className="w-3.5 h-3.5" />,      color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  Export:         { icon: <Download className="w-3.5 h-3.5" />, color: "bg-purple-50 text-purple-700 border-purple-200" },
  Download:       { icon: <Download className="w-3.5 h-3.5" />, color: "bg-purple-50 text-purple-700 border-purple-200" },
  Approve:        { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  Reject:         { icon: <XCircle className="w-3.5 h-3.5" />,  color: "bg-red-50 text-red-700 border-red-200" },
  Invite:         { icon: <UserCheck className="w-3.5 h-3.5" />, color: "bg-teal-50 text-teal-700 border-teal-200" },
  "Password Reset": { icon: <Unlock className="w-3.5 h-3.5" />, color: "bg-orange-50 text-orange-700 border-orange-200" },
  Settings:       { icon: <Settings className="w-3.5 h-3.5" />, color: "bg-gray-100 text-gray-700 border-gray-200" },
};

function ActionBadge({ action }: { action: string }) {
  const cfg = ACTION_CONFIG[action] ?? { icon: <Activity className="w-3.5 h-3.5" />, color: "bg-gray-100 text-gray-600 border-gray-200" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium ${cfg.color}`}>
      {cfg.icon}{action}
    </span>
  );
}

const SEV_CONFIG: Record<LogSeverity, { icon: React.ReactNode; color: string; dot: string }> = {
  Info:     { icon: <Info className="w-3.5 h-3.5" />,          color: "bg-blue-50 text-blue-700 border-blue-200",    dot: "bg-blue-500" },
  Warning:  { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  Error:    { icon: <AlertCircle className="w-3.5 h-3.5" />,   color: "bg-red-50 text-red-700 border-red-200",       dot: "bg-red-500" },
  Critical: { icon: <XCircle className="w-3.5 h-3.5" />,       color: "bg-red-100 text-red-800 border-red-300",      dot: "bg-red-700" },
};

function SeverityBadge({ severity }: { severity: LogSeverity }) {
  const cfg = SEV_CONFIG[severity];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-semibold ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {severity}
    </span>
  );
}

function AvatarBubble({ initials, color }: { initials: string; color: string }) {
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${color}`}>
      {initials}
    </div>
  );
}

const AVATAR_COLORS = ["bg-blue-500","bg-emerald-500","bg-violet-500","bg-orange-500","bg-pink-500","bg-teal-500","bg-indigo-500","bg-rose-500","bg-amber-500","bg-cyan-500"];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

// ── User Activity Tab ──────────────────────────────────────────────────────────

function UserActivityTab() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const PAGE_SIZE = 10;

  const actionOptions = ["All", "Login", "Logout", "Failed Login", "Create", "Edit", "Delete", "View", "Export", "Approve", "Reject", "Invite", "Password Reset"];
  const statusOptions = ["All", "Success", "Failed", "Warning"];

  const filtered = useMemo(() => {
    return USER_ACTIVITIES.filter((a) => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        a.user.toLowerCase().includes(q) ||
        a.resource.toLowerCase().includes(q) ||
        a.module.toLowerCase().includes(q) ||
        a.ip.includes(q);
      const matchAction = actionFilter === "All" || a.action === actionFilter;
      const matchStatus = statusFilter === "All" || a.status === statusFilter;
      return matchSearch && matchAction && matchStatus;
    });
  }, [search, actionFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search user, resource, IP…"
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          {actionOptions.map((o) => <option key={o}>{o === "All" ? "All Actions" : o}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          {statusOptions.map((o) => <option key={o}>{o === "All" ? "All Statuses" : o}</option>)}
        </select>
        <button
          onClick={() => { setSearch(""); setActionFilter("All"); setStatusFilter("All"); setPage(1); }}
          className="flex items-center gap-1.5 text-xs px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
        >
          <Filter className="w-3.5 h-3.5" /> Clear
        </button>
        <span className="ml-auto text-xs text-gray-400">{filtered.length} events</span>
        <button
          onClick={() => toast({ title: "Exported user activity log as CSV" })}
          className="flex items-center gap-1.5 text-xs px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {["User", "Action", "Resource / Module", "IP & Device", "Location", "Time", "Status"].map((h) => (
                  <th key={h} className="py-3 px-4 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((row) => (
                <Fragment key={row.id}>
                  <tr
                    onClick={() => setExpanded(expanded === row.id ? null : row.id)}
                    className={`border-b border-gray-50 hover:bg-gray-50/70 transition-colors cursor-pointer ${expanded === row.id ? "bg-blue-50/40" : ""}`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <AvatarBubble initials={row.avatar} color={row.avatar === "??" ? "bg-gray-400" : avatarColor(row.user)} />
                        <div>
                          <div className="text-xs font-semibold text-gray-900 whitespace-nowrap">{row.user}</div>
                          <div className="text-[11px] text-gray-400">{row.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <ActionBadge action={row.action} />
                    </td>
                    <td className="py-3 px-4 max-w-[180px]">
                      <div className="text-xs font-medium text-gray-800 truncate">{row.resource}</div>
                      <div className="text-[11px] text-gray-400">{row.module}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-xs text-gray-700">
                        <Globe className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="font-mono">{row.ip}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                        <Monitor className="w-3 h-3 shrink-0" />{row.device}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600 whitespace-nowrap">{row.location}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-xs text-gray-700 whitespace-nowrap">
                        <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                        {row.timestamp.split(" ").slice(-2).join(" ")}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{row.timestamp.split(",")[0]}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        row.status === "Success" ? "bg-emerald-50 text-emerald-700" :
                        row.status === "Failed"  ? "bg-red-50 text-red-700" :
                        "bg-amber-50 text-amber-700"
                      }`}>
                        {row.status === "Success" ? <CheckCircle2 className="w-3 h-3" /> :
                         row.status === "Failed"  ? <XCircle className="w-3 h-3" /> :
                         <AlertTriangle className="w-3 h-3" />}
                        {row.status}
                      </span>
                    </td>
                  </tr>
                  {expanded === row.id && (
                    <tr className="bg-blue-50/30 border-b border-blue-100">
                      <td colSpan={7} className="px-6 py-3">
                        <div className="flex items-start gap-2">
                          <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-xs font-semibold text-blue-800">Event Detail: </span>
                            <span className="text-xs text-gray-700">{row.details}</span>
                            <span className="ml-4 text-[11px] text-gray-400">Full timestamp: {row.timestamp}</span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-gray-400">
                    <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    No activity events match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            {filtered.length === 0 ? "0" : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)}`} of {filtered.length} events
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">
              <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-7 h-7 text-xs rounded border transition-colors ${p === page ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 hover:bg-gray-50"}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">
              <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── System Logs Tab ────────────────────────────────────────────────────────────

function SystemLogsTab() {
  const [search, setSearch] = useState("");
  const [sevFilter, setSevFilter] = useState<string>("All");
  const [catFilter, setCatFilter] = useState<string>("All");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const sevOptions = ["All", "Info", "Warning", "Error", "Critical"];
  const catOptions: string[] = ["All", "Authentication", "Data", "System", "Security", "Configuration"];

  const filtered = useMemo(() => {
    return SYSTEM_LOGS.filter((l) => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        l.event.toLowerCase().includes(q) ||
        l.message.toLowerCase().includes(q) ||
        l.service.toLowerCase().includes(q) ||
        l.user.toLowerCase().includes(q);
      const matchSev = sevFilter === "All" || l.severity === sevFilter;
      const matchCat = catFilter === "All" || l.category === catFilter;
      return matchSearch && matchSev && matchCat;
    });
  }, [search, sevFilter, catFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search event, service, message…"
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={sevFilter}
          onChange={(e) => { setSevFilter(e.target.value); setPage(1); }}
          className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          {sevOptions.map((o) => <option key={o}>{o === "All" ? "All Severities" : o}</option>)}
        </select>
        <select
          value={catFilter}
          onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}
          className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          {catOptions.map((o) => <option key={o}>{o === "All" ? "All Categories" : o}</option>)}
        </select>
        <button
          onClick={() => { setSearch(""); setSevFilter("All"); setCatFilter("All"); setPage(1); }}
          className="flex items-center gap-1.5 text-xs px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
        >
          <Filter className="w-3.5 h-3.5" /> Clear
        </button>
        <span className="ml-auto text-xs text-gray-400">{filtered.length} logs</span>
        <button
          onClick={() => toast({ title: "Exported system logs as CSV" })}
          className="flex items-center gap-1.5 text-xs px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {["Severity", "Event", "Service", "Message", "User", "Duration", "Timestamp"].map((h) => (
                  <th key={h} className="py-3 px-4 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((log) => {
                const sev = SEV_CONFIG[log.severity];
                return (
                  <tr key={log.id} className={`border-b border-gray-50 transition-colors hover:bg-gray-50/70 ${
                    log.severity === "Critical" ? "bg-red-50/30" :
                    log.severity === "Error"    ? "bg-orange-50/20" : ""
                  }`}>
                    <td className="py-3 px-4">
                      <SeverityBadge severity={log.severity} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs font-semibold text-gray-900 whitespace-nowrap">{log.event}</div>
                      <span className={`inline-block mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        log.category === "Security"       ? "bg-red-50 text-red-600" :
                        log.category === "Authentication" ? "bg-blue-50 text-blue-600" :
                        log.category === "Data"           ? "bg-emerald-50 text-emerald-600" :
                        log.category === "Configuration"  ? "bg-violet-50 text-violet-600" :
                        "bg-gray-100 text-gray-600"
                      }`}>{log.category}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Database className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="text-xs font-mono text-gray-700">{log.service}</span>
                      </div>
                      {log.statusCode && (
                        <span className={`text-[11px] font-mono mt-0.5 block ${
                          log.statusCode < 300 ? "text-emerald-600" :
                          log.statusCode < 400 ? "text-amber-600" : "text-red-600"
                        }`}>{log.statusCode}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-[280px]">
                      <p className="text-xs text-gray-700 leading-relaxed line-clamp-2">{log.message}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="text-xs font-mono text-gray-700">{log.user}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                        <Globe className="w-2.5 h-2.5" />{log.ip}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-gray-600 whitespace-nowrap">
                      {log.duration ?? "—"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs text-gray-700 whitespace-nowrap">{log.timestamp.split(" ").slice(-2).join(" ")}</div>
                      <div className="text-[11px] text-gray-400">{log.timestamp.split(",")[0]}</div>
                    </td>
                  </tr>
                );
              })}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-gray-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    No log entries match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            {filtered.length === 0 ? "0" : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)}`} of {filtered.length} logs
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">
              <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-7 h-7 text-xs rounded border transition-colors ${p === page ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 hover:bg-gray-50"}`}>
                {p}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">
              <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AuditTrailPage() {
  usePageMeta({ title: "Audit Reports" });
  const { inline } = useReportShellContext();
  const [tab, setTab] = useState<"activity" | "logs">("activity");
  const [refreshing, setRefreshing] = useState(false);

  const kpis = [
    {
      label: "Total Events Today",
      value: "1,291",
      sub: "+14% vs yesterday",
      icon: <Activity className="w-5 h-5 text-blue-500" />,
      bg: "bg-blue-50",
      trend: "up",
    },
    {
      label: "Active Users",
      value: "38",
      sub: "Currently online",
      icon: <User className="w-5 h-5 text-emerald-500" />,
      bg: "bg-emerald-50",
      trend: "neutral",
    },
    {
      label: "Failed Logins",
      value: "17",
      sub: "2 IPs blocked",
      icon: <Lock className="w-5 h-5 text-red-500" />,
      bg: "bg-red-50",
      trend: "down",
    },
    {
      label: "System Errors",
      value: "4",
      sub: "2 critical, 2 high",
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
      bg: "bg-amber-50",
      trend: "down",
    },
    {
      label: "Security Alerts",
      value: "3",
      sub: "Requires review",
      icon: <Shield className="w-5 h-5 text-violet-500" />,
      bg: "bg-violet-50",
      trend: "down",
    },
    {
      label: "Config Changes",
      value: "5",
      sub: "Last 24 hours",
      icon: <Settings className="w-5 h-5 text-indigo-500" />,
      bg: "bg-indigo-50",
      trend: "neutral",
    },
  ];

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); toast({ title: "Audit logs refreshed" }); }, 1200);
  }

  const content = (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          {inline && <h2 className="text-lg font-bold text-gray-900">Audit Reports</h2>}
          <p className={`text-sm text-gray-500 ${inline ? "mt-0.5" : ""}`}>
            User activity, system events and security logs — Aug 4, 2026
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className={`flex items-center gap-1.5 text-xs px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors ${refreshing ? "opacity-60 pointer-events-none" : ""}`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <select className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
            <option>Today</option>
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Custom range</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2">
            <div className={`w-9 h-9 rounded-lg ${k.bg} flex items-center justify-center shrink-0`}>
              {k.icon}
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900 leading-tight">{k.value}</div>
              <div className="text-[11px] text-gray-500 leading-tight mt-0.5">{k.label}</div>
              <div className={`text-[11px] font-medium mt-1 ${
                k.trend === "up" ? "text-emerald-600" : k.trend === "down" ? "text-red-500" : "text-gray-400"
              }`}>{k.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Activity Timeline Chart */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-gray-900">Event Volume — Hourly</h3>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-blue-500 inline-block" /> Activity</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-red-400 inline-block" /> Errors</span>
          </div>
        </div>
        <div className="px-4 py-4">
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={HOURLY_DATA} barSize={14} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={28} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}
                cursor={{ fill: "#F9FAFB" }}
              />
              <Bar dataKey="activity" fill="#3B82F6" radius={[3, 3, 0, 0]} name="Activity Events" />
              <Bar dataKey="errors" fill="#F87171" radius={[3, 3, 0, 0]} name="Errors" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Tab header */}
        <div className="flex border-b border-gray-100 px-4 pt-1">
          <button
            onClick={() => setTab("activity")}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "activity" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <User className="w-4 h-4" />
            User Activity
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${tab === "activity" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
              {USER_ACTIVITIES.length}
            </span>
          </button>
          <button
            onClick={() => setTab("logs")}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
              tab === "logs" ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <FileText className="w-4 h-4" />
            System Logs
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${tab === "logs" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
              {SYSTEM_LOGS.length}
            </span>
          </button>

          {/* Critical alert pill */}
          {tab === "logs" && (
            <div className="ml-auto flex items-center self-center">
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-xs font-semibold border border-red-200">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                2 Critical
              </span>
            </div>
          )}
        </div>

        {/* Tab body */}
        <div className="p-4">
          {tab === "activity" && <UserActivityTab />}
          {tab === "logs" && <SystemLogsTab />}
        </div>
      </div>
    </div>
  );

  if (inline) return content;

  return (
    <ReportShell title="Audit Reports" subtitle="User activity, system events and security logs">
      {content}
    </ReportShell>
  );
}
