import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MoreVertical,
  Filter,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CheckCircle2,
  Clock,
  CheckSquare,
  XCircle,
  X,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// ─── Types ────────────────────────────────────────────────────────────────────
type RequestStatus = "In Progress" | "Active" | "Scheduled" | "Completed" | "Cancelled" | "Pending";
type RequestPriority = "Low" | "Medium" | "High";

interface ServiceRequest {
  id: string;
  requestType: string;
  itemAsset: string;
  assetTag: string;
  location: string;
  requestDate: string;       // "DD Mon YYYY"
  requestDateTs: number;     // Unix ms for filtering
  status: RequestStatus;
  priority: RequestPriority;
  nextAppointment: string;
  requestedBy: string;
}

// ─── Date helper ─────────────────────────────────────────────────────────────
function parseDate(s: string): number {
  return new Date(s).getTime();
}

// ─── Sample Data ──────────────────────────────────────────────────────────────
const RAW: Omit<ServiceRequest, "requestDateTs">[] = [
  { id: "REP-2026-00187", requestType: "Repair Service",     itemAsset: "Dell Latitude 5420",        assetTag: "AST-1001", location: "Bangalore - Main Office", requestDate: "22 Jul 2026", status: "In Progress", priority: "Medium", nextAppointment: "24 Jul 2026\n10:00 AM", requestedBy: "Ramesh K."    },
  { id: "AMC-2026-00124", requestType: "AMC Service",        itemAsset: "Dell Latitude 5420",        assetTag: "AST-1001", location: "Bangalore - Main Office", requestDate: "01 Jul 2026", status: "Active",      priority: "Medium", nextAppointment: "15 Aug 2026\n10:00 AM", requestedBy: "Ramesh K."    },
  { id: "REC-2026-00056", requestType: "Recycle / Disposal", itemAsset: "IT Assets (10 Items)",      assetTag: "",         location: "Bangalore - Main Office", requestDate: "18 Jul 2026", status: "Scheduled",   priority: "Low",    nextAppointment: "25 Jul 2026\n11:00 AM", requestedBy: "Priya Sharma" },
  { id: "RET-2026-00031", requestType: "Return / Replace",   itemAsset: "HP LaserJet Pro MFP 4103",  assetTag: "AST-1002", location: "Bangalore - Main Office", requestDate: "16 Jul 2026", status: "In Progress", priority: "High",   nextAppointment: "23 Jul 2026\n02:00 PM", requestedBy: "Vikram Singh" },
  { id: "REP-2026-00120", requestType: "Repair Service",     itemAsset: "APC Smart UPS 1500VA",      assetTag: "AST-1004", location: "Pune - Branch Office",    requestDate: "10 Jul 2026", status: "Completed",   priority: "Low",    nextAppointment: "10 Jul 2026\n04:30 PM", requestedBy: "Anita Patil"  },
  { id: "AMC-2026-00110", requestType: "AMC Service",        itemAsset: "Cisco Switch WS-C2960X",    assetTag: "AST-1003", location: "Hyderabad - Branch",      requestDate: "05 Jul 2026", status: "Completed",   priority: "Medium", nextAppointment: "05 Jul 2026\n11:30 AM", requestedBy: "Vikram Singh" },
  { id: "REP-2026-00098", requestType: "Repair Service",     itemAsset: "Lenovo ThinkPad E14",       assetTag: "AST-1005", location: "Bangalore - Main Office", requestDate: "08 Jul 2026", status: "Cancelled",   priority: "Low",    nextAppointment: "-",                     requestedBy: "Ramesh K."    },
  { id: "REC-2026-00021", requestType: "Recycle / Disposal", itemAsset: "Old Monitors (5 Items)",    assetTag: "",         location: "Chennai - Branch",        requestDate: "01 Jul 2026", status: "Cancelled",   priority: "Low",    nextAppointment: "-",                     requestedBy: "Suresh B."    },
  { id: "REP-2026-00091", requestType: "Repair Service",     itemAsset: "HP EliteBook 840",          assetTag: "AST-1006", location: "Mumbai - Office",         requestDate: "03 Jul 2026", status: "Completed",   priority: "Medium", nextAppointment: "04 Jul 2026\n09:00 AM", requestedBy: "Anita Patil"  },
  { id: "AMC-2026-00085", requestType: "AMC Service",        itemAsset: "Dell PowerEdge R440",       assetTag: "AST-1007", location: "Bangalore - Main Office", requestDate: "01 Jul 2026", status: "Active",      priority: "High",   nextAppointment: "01 Aug 2026\n10:00 AM", requestedBy: "Ramesh K."    },
  { id: "REC-2026-00078", requestType: "Recycle / Disposal", itemAsset: "Old Printers (3 Items)",    assetTag: "",         location: "Pune - Branch Office",    requestDate: "28 Jun 2026", status: "Completed",   priority: "Low",    nextAppointment: "30 Jun 2026\n02:00 PM", requestedBy: "Suresh B."    },
  { id: "RET-2026-00072", requestType: "Return / Replace",   itemAsset: "Canon ImageRunner 2625",    assetTag: "AST-1008", location: "Hyderabad - Branch",      requestDate: "25 Jun 2026", status: "Completed",   priority: "Medium", nextAppointment: "27 Jun 2026\n11:00 AM", requestedBy: "Vikram Singh" },
  { id: "REP-2026-00068", requestType: "Repair Service",     itemAsset: "Epson WorkForce 7720",      assetTag: "AST-1009", location: "Chennai - Branch",        requestDate: "22 Jun 2026", status: "Cancelled",   priority: "Low",    nextAppointment: "-",                     requestedBy: "Priya Sharma" },
  { id: "AMC-2026-00061", requestType: "AMC Service",        itemAsset: "Cisco IP Phone 7945",       assetTag: "AST-1010", location: "Bangalore - Main Office", requestDate: "18 Jun 2026", status: "Active",      priority: "Medium", nextAppointment: "18 Jul 2026\n09:30 AM", requestedBy: "Ramesh K."    },
  { id: "REC-2026-00055", requestType: "Recycle / Disposal", itemAsset: "Keyboards & Mice (20)",     assetTag: "",         location: "Mumbai - Office",         requestDate: "14 Jun 2026", status: "Completed",   priority: "Low",    nextAppointment: "15 Jun 2026\n03:00 PM", requestedBy: "Anita Patil"  },
  { id: "REP-2026-00048", requestType: "Repair Service",     itemAsset: "Zebra ZT410 Barcode",       assetTag: "AST-1011", location: "Pune - Branch Office",    requestDate: "10 Jun 2026", status: "Completed",   priority: "High",   nextAppointment: "11 Jun 2026\n10:00 AM", requestedBy: "Vikram Singh" },
  { id: "AMC-2026-00042", requestType: "AMC Service",        itemAsset: "APC UPS 3000VA",            assetTag: "AST-1012", location: "Hyderabad - Branch",      requestDate: "06 Jun 2026", status: "Active",      priority: "Medium", nextAppointment: "06 Jul 2026\n10:00 AM", requestedBy: "Suresh B."    },
  { id: "RET-2026-00038", requestType: "Return / Replace",   itemAsset: "Dell Monitor P2422H",       assetTag: "AST-1013", location: "Bangalore - Main Office", requestDate: "03 Jun 2026", status: "Completed",   priority: "Low",    nextAppointment: "05 Jun 2026\n02:00 PM", requestedBy: "Priya Sharma" },
  { id: "REP-2026-00031", requestType: "Repair Service",     itemAsset: "HP LaserJet M404dn",        assetTag: "AST-1014", location: "Chennai - Branch",        requestDate: "28 May 2026", status: "Cancelled",   priority: "Low",    nextAppointment: "-",                     requestedBy: "Ramesh K."    },
  { id: "REC-2026-00025", requestType: "Recycle / Disposal", itemAsset: "Network Switches (5)",      assetTag: "",         location: "Mumbai - Office",         requestDate: "22 May 2026", status: "Completed",   priority: "Medium", nextAppointment: "24 May 2026\n11:00 AM", requestedBy: "Anita Patil"  },
  { id: "AMC-2026-00019", requestType: "AMC Service",        itemAsset: "Fortinet FortiGate 60F",    assetTag: "AST-1015", location: "Bangalore - Main Office", requestDate: "18 May 2026", status: "Active",      priority: "High",   nextAppointment: "18 Jun 2026\n09:00 AM", requestedBy: "Vikram Singh" },
  { id: "REP-2026-00012", requestType: "Repair Service",     itemAsset: "Lenovo IdeaCentre 510",     assetTag: "AST-1016", location: "Hyderabad - Branch",      requestDate: "12 May 2026", status: "Completed",   priority: "Low",    nextAppointment: "13 May 2026\n02:00 PM", requestedBy: "Suresh B."    },
  { id: "RET-2026-00008", requestType: "Return / Replace",   itemAsset: "Cisco Catalyst 2960-X",     assetTag: "AST-1017", location: "Pune - Branch Office",    requestDate: "08 May 2026", status: "Completed",   priority: "Medium", nextAppointment: "10 May 2026\n10:00 AM", requestedBy: "Priya Sharma" },
  { id: "REC-2026-00004", requestType: "Recycle / Disposal", itemAsset: "Old Servers (2 Items)",     assetTag: "",         location: "Bangalore - Main Office", requestDate: "03 May 2026", status: "Completed",   priority: "High",   nextAppointment: "05 May 2026\n09:00 AM", requestedBy: "Ramesh K."    },
];

const ALL_REQUESTS: ServiceRequest[] = RAW.map(r => ({
  ...r,
  requestDateTs: parseDate(r.requestDate),
}));

// ─── Date-range options ───────────────────────────────────────────────────────
const DATE_RANGES = ["Last 7 Days", "Last 30 Days", "Last 90 Days", "This Year", "All Time"] as const;
type DateRange = typeof DATE_RANGES[number];

/** Reference "today" anchored to the latest entry so demo data is always visible */
const ANCHOR = new Date("2026-07-31").getTime();

function dateRangeCutoff(range: DateRange): number {
  switch (range) {
    case "Last 7 Days":  return ANCHOR - 7  * 86400000;
    case "Last 30 Days": return ANCHOR - 30 * 86400000;
    case "Last 90 Days": return ANCHOR - 90 * 86400000;
    case "This Year":    return new Date("2026-01-01").getTime();
    default:             return 0;
  }
}

// ─── Colours ──────────────────────────────────────────────────────────────────
const statusColors: Record<RequestStatus, string> = {
  "In Progress": "bg-blue-100 text-blue-700",
  "Active":      "bg-emerald-100 text-emerald-700",
  "Scheduled":   "bg-purple-100 text-purple-700",
  "Completed":   "bg-green-100 text-green-700",
  "Cancelled":   "bg-red-100 text-red-600",
  "Pending":     "bg-amber-100 text-amber-700",
};

const priorityColors: Record<RequestPriority, string> = {
  High:   "bg-red-100 text-red-600",
  Medium: "bg-orange-100 text-orange-600",
  Low:    "bg-gray-100 text-gray-500",
};

// ─── Badge ────────────────────────────────────────────────────────────────────
function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${className}`}>
      {children}
    </span>
  );
}

// ─── Row Actions ──────────────────────────────────────────────────────────────
function RowActions({ onView }: { onView: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative flex justify-center">
      <button onClick={() => setOpen(p => !p)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
        <MoreVertical className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-1">
          {[
            { label: "View Details",   action: onView,           cls: "text-gray-700 hover:bg-gray-50" },
            { label: "Edit Request",   action: () => {},         cls: "text-gray-700 hover:bg-gray-50" },
            { label: "Cancel Request", action: () => {},         cls: "text-red-600 hover:bg-red-50"   },
          ].map(({ label, action, cls }) => (
            <button key={label} onClick={() => { action(); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${cls}`}>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Filter Panel ─────────────────────────────────────────────────────────────
interface Filters {
  requestType: string;
  priority: string;
  location: string;
  requestedBy: string;
}

const EMPTY_FILTERS: Filters = { requestType: "All", priority: "All", location: "All", requestedBy: "All" };

function FilterPanel({
  open, onClose, filters, onApply,
}: {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  onApply: (f: Filters) => void;
}) {
  const [local, setLocal] = useState<Filters>(filters);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setLocal(filters); }, [filters, open]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, onClose]);

  if (!open) return null;

  const requestTypes = ["All", ...Array.from(new Set(ALL_REQUESTS.map(r => r.requestType)))];
  const priorities   = ["All", "High", "Medium", "Low"];
  const locations    = ["All", ...Array.from(new Set(ALL_REQUESTS.map(r => r.location)))];
  const requestedBys = ["All", ...Array.from(new Set(ALL_REQUESTS.map(r => r.requestedBy)))];

  const Field = ({ label, field, options }: { label: string; field: keyof Filters; options: string[] }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      <div className="relative">
        <select
          value={local[field]}
          onChange={e => setLocal(p => ({ ...p, [field]: e.target.value }))}
          className="w-full appearance-none pl-2.5 pr-7 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:border-blue-400 cursor-pointer"
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );

  const hasChanges = JSON.stringify(local) !== JSON.stringify(EMPTY_FILTERS);

  return (
    <div ref={ref} className="absolute right-0 top-full mt-1 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-800">Filters</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
      </div>
      <div className="space-y-3">
        <Field label="Request Type" field="requestType" options={requestTypes} />
        <Field label="Priority"     field="priority"    options={priorities} />
        <Field label="Location"     field="location"    options={locations} />
        <Field label="Requested By" field="requestedBy" options={requestedBys} />
      </div>
      <div className="flex gap-2 mt-4">
        <button
          onClick={() => { setLocal(EMPTY_FILTERS); onApply(EMPTY_FILTERS); onClose(); }}
          className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Clear All
        </button>
        <button
          onClick={() => { onApply(local); onClose(); }}
          className="flex-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Apply Filters
        </button>
      </div>
      {hasChanges && (
        <p className="text-xs text-blue-500 mt-2 text-center">Unsaved changes</p>
      )}
    </div>
  );
}

// ─── CSV Export ───────────────────────────────────────────────────────────────
function exportCSV(rows: ServiceRequest[]) {
  const headers = ["Request ID", "Request Type", "Item / Asset", "Asset Tag", "Location", "Request Date", "Status", "Priority", "Next Appointment", "Requested By"];
  const csvRows = rows.map(r => [
    r.id, r.requestType, r.itemAsset, r.assetTag, r.location, r.requestDate,
    r.status, r.priority, r.nextAppointment.replace("\n", " "), r.requestedBy,
  ].map(v => `"${v}"`).join(","));
  const blob = new Blob([headers.join(",") + "\n" + csvRows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `my-requests-export-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MyRequestsPage() {
  const navigate = useNavigate();
  const ITEMS_PER_PAGE = 10;

  const [currentPage,  setCurrentPage]  = useState(1);
  const [tileFilter,   setTileFilter]   = useState("All");
  const [dateRange,    setDateRange]     = useState<DateRange>("Last 30 Days");
  const [filters,      setFilters]       = useState<Filters>(EMPTY_FILTERS);
  const [filterOpen,   setFilterOpen]   = useState(false);
  const filterBtnRef = useRef<HTMLDivElement>(null);

  // ── Apply all filters ──
  const cutoff = dateRangeCutoff(dateRange);

  const filtered = ALL_REQUESTS.filter(r => {
    if (tileFilter !== "All" && r.status !== tileFilter)              return false;
    if (r.requestDateTs < cutoff)                                     return false;
    if (filters.requestType !== "All" && r.requestType !== filters.requestType) return false;
    if (filters.priority    !== "All" && r.priority    !== filters.priority)    return false;
    if (filters.location    !== "All" && r.location    !== filters.location)    return false;
    if (filters.requestedBy !== "All" && r.requestedBy !== filters.requestedBy) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage   = Math.min(currentPage, totalPages);
  const paged      = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const handleTile = (key: string) => {
    setTileFilter(prev => prev === key ? "All" : key);
    setCurrentPage(1);
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== "All").length;
  const hasAnyFilter = tileFilter !== "All" || activeFilterCount > 0;

  const clearAll = () => {
    setTileFilter("All");
    setFilters(EMPTY_FILTERS);
    setCurrentPage(1);
  };

  // ── Stats ──
  const stats = [
    { label: "Total Requests",      value: 24, filterKey: "All",        icon: <ClipboardList className="w-5 h-5 text-blue-500" />,   iconBg: "bg-blue-50",    border: "border-blue-100",    valueColor: "text-gray-900"    },
    { label: "In Progress",         value: 7,  filterKey: "In Progress", icon: <CheckCircle2  className="w-5 h-5 text-emerald-500" />, iconBg: "bg-emerald-50", border: "border-emerald-100", valueColor: "text-emerald-600" },
    { label: "Pending / Scheduled", value: 6,  filterKey: "Scheduled",   icon: <Clock         className="w-5 h-5 text-amber-500" />,   iconBg: "bg-amber-50",   border: "border-amber-100",   valueColor: "text-amber-600"   },
    { label: "Completed",           value: 8,  filterKey: "Completed",   icon: <CheckSquare   className="w-5 h-5 text-purple-500" />,  iconBg: "bg-purple-50",  border: "border-purple-100",  valueColor: "text-purple-600"  },
    { label: "Cancelled",           value: 3,  filterKey: "Cancelled",   icon: <XCircle       className="w-5 h-5 text-red-400" />,     iconBg: "bg-red-50",     border: "border-red-100",     valueColor: "text-red-500"     },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* ── Header ── */}
      <div className="bg-transparent border-b border-gray-200/70">
        <div className="w-full px-4 py-3">
          <p className="text-xs text-gray-500">Services / My Requests</p>
          <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
          <p className="text-sm text-gray-500 mt-0.5">View and track all your service requests</p>
        </div>
      </div>

      <div className="w-full px-4 py-4">
        {/* ── Stat tiles ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
          {stats.map(s => {
            const isActive = tileFilter === s.filterKey;
            return (
              <Card
                key={s.label}
                onClick={() => handleTile(s.filterKey)}
                className={`cursor-pointer transition-all hover:shadow-md border ${s.border} ${isActive ? "ring-2 ring-blue-500 shadow-md" : ""}`}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center`}>
                    {s.icon}
                  </div>
                  <div>
                    <p className={`text-2xl font-bold leading-none ${s.valueColor}`}>{s.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── Table Card ── */}
        <Card>
          <CardContent className="p-0">

            {/* ── Toolbar ── */}
            <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-gray-100 flex-wrap">
              {/* Active filter chips */}
              <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                {tileFilter !== "All" && (
                  <span className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded-full font-medium">
                    Status: {tileFilter}
                    <button onClick={() => { setTileFilter("All"); setCurrentPage(1); }} className="text-blue-400 hover:text-blue-700 ml-0.5"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {filters.requestType !== "All" && (
                  <span className="flex items-center gap-1 text-xs text-gray-700 bg-gray-100 border border-gray-200 px-2 py-1 rounded-full font-medium">
                    Type: {filters.requestType}
                    <button onClick={() => { setFilters(p => ({ ...p, requestType: "All" })); setCurrentPage(1); }} className="text-gray-400 hover:text-gray-700 ml-0.5"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {filters.priority !== "All" && (
                  <span className="flex items-center gap-1 text-xs text-gray-700 bg-gray-100 border border-gray-200 px-2 py-1 rounded-full font-medium">
                    Priority: {filters.priority}
                    <button onClick={() => { setFilters(p => ({ ...p, priority: "All" })); setCurrentPage(1); }} className="text-gray-400 hover:text-gray-700 ml-0.5"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {filters.location !== "All" && (
                  <span className="flex items-center gap-1 text-xs text-gray-700 bg-gray-100 border border-gray-200 px-2 py-1 rounded-full font-medium">
                    Location: {filters.location}
                    <button onClick={() => { setFilters(p => ({ ...p, location: "All" })); setCurrentPage(1); }} className="text-gray-400 hover:text-gray-700 ml-0.5"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {filters.requestedBy !== "All" && (
                  <span className="flex items-center gap-1 text-xs text-gray-700 bg-gray-100 border border-gray-200 px-2 py-1 rounded-full font-medium">
                    By: {filters.requestedBy}
                    <button onClick={() => { setFilters(p => ({ ...p, requestedBy: "All" })); setCurrentPage(1); }} className="text-gray-400 hover:text-gray-700 ml-0.5"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {hasAnyFilter && (
                  <button onClick={clearAll} className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2">Clear all</button>
                )}
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Filter */}
                <div ref={filterBtnRef} className="relative">
                  <button
                    onClick={() => setFilterOpen(p => !p)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${
                      filterOpen || activeFilterCount > 0
                        ? "bg-blue-50 border-blue-300 text-blue-700"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Filter className="w-3.5 h-3.5" />
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="ml-0.5 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                  <FilterPanel
                    open={filterOpen}
                    onClose={() => setFilterOpen(false)}
                    filters={filters}
                    onApply={f => { setFilters(f); setCurrentPage(1); }}
                  />
                </div>

                {/* Export */}
                <button
                  onClick={() => exportCSV(filtered)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-700 transition-colors active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" /> Export
                </button>

                {/* Date range */}
                <div className="relative">
                  <select
                    value={dateRange}
                    onChange={e => { setDateRange(e.target.value as DateRange); setCurrentPage(1); }}
                    className="appearance-none pl-7 pr-6 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:border-blue-400 cursor-pointer font-medium hover:bg-gray-50 transition-colors"
                  >
                    {DATE_RANGES.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <Calendar className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* ── Table ── */}
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-xs">
                <colgroup>
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "9%" }}  />
                  <col style={{ width: "8%" }}  />
                  <col style={{ width: "7%" }}  />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "6%" }}  />
                </colgroup>
                <thead>
                  <tr className="bg-gray-50 border-b text-xs text-gray-600 font-semibold">
                    <th className="px-3 py-3 text-left">Request ID</th>
                    <th className="px-3 py-3 text-left">Request Type</th>
                    <th className="px-3 py-3 text-left">Item / Asset</th>
                    <th className="px-3 py-3 text-left">Location</th>
                    <th className="px-3 py-3 text-left">Request Date</th>
                    <th className="px-3 py-3 text-left">Status</th>
                    <th className="px-3 py-3 text-left">Priority</th>
                    <th className="px-3 py-3 text-left">Next Appointment</th>
                    <th className="px-3 py-3 text-left">Requested By</th>
                    <th className="px-3 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-16 text-gray-400">
                        <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No requests match the current filters</p>
                        {hasAnyFilter && (
                          <button onClick={clearAll} className="mt-2 text-xs text-blue-600 hover:underline">Clear all filters</button>
                        )}
                      </td>
                    </tr>
                  ) : paged.map(req => (
                    <tr key={req.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-3">
                        <button
                          onClick={() => navigate(`/my-services/requests/${req.id}`)}
                          className="text-blue-600 font-semibold hover:underline text-xs truncate block max-w-full text-left"
                        >
                          {req.id}
                        </button>
                      </td>
                      <td className="px-3 py-3 font-semibold text-gray-800 truncate">{req.requestType}</td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-gray-800 truncate">{req.itemAsset}</p>
                        {req.assetTag && <p className="text-gray-400 text-xs">{req.assetTag}</p>}
                      </td>
                      <td className="px-3 py-3 text-gray-600 truncate">{req.location}</td>
                      <td className="px-3 py-3 text-gray-600">{req.requestDate}</td>
                      <td className="px-3 py-3">
                        <Badge className={statusColors[req.status]}>{req.status}</Badge>
                      </td>
                      <td className="px-3 py-3">
                        <Badge className={priorityColors[req.priority]}>{req.priority}</Badge>
                      </td>
                      <td className="px-3 py-3 text-gray-600 whitespace-pre-line leading-tight text-xs">{req.nextAppointment}</td>
                      <td className="px-3 py-3 text-gray-700 truncate">{req.requestedBy}</td>
                      <td className="px-3 py-3">
                        <RowActions onView={() => navigate(`/my-services/requests/${req.id}`)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ── */}
            <div className="px-3 py-3 flex items-center justify-between border-t">
              <span className="text-xs text-gray-500">
                {filtered.length === 0
                  ? "No entries"
                  : `Showing ${(safePage - 1) * ITEMS_PER_PAGE + 1} to ${Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} of ${filtered.length} entries`}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="p-1.5 rounded border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-7 h-7 rounded border text-xs font-medium transition-colors ${p === safePage ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 hover:bg-gray-50"}`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="p-1.5 rounded border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
