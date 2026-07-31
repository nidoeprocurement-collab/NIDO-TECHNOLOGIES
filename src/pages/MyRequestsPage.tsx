import { useState } from "react";
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
  requestDate: string;
  status: RequestStatus;
  priority: RequestPriority;
  nextAppointment: string;
  requestedBy: string;
}

// ─── Sample Data (from image) ─────────────────────────────────────────────────
const REQUESTS: ServiceRequest[] = [
  { id: "REP-2026-00187", requestType: "Repair Service",    itemAsset: "Dell Latitude 5420",       assetTag: "AST-1001", location: "Bangalore - Main Office", requestDate: "22 Jul 2026", status: "In Progress", priority: "Medium", nextAppointment: "24 Jul 2026\n10:00 AM", requestedBy: "Ramesh K." },
  { id: "AMC-2026-00124", requestType: "AMC Service",       itemAsset: "Dell Latitude 5420",       assetTag: "AST-1001", location: "Bangalore - Main Office", requestDate: "01 Jul 2026", status: "Active",      priority: "Medium", nextAppointment: "15 Aug 2026\n10:00 AM", requestedBy: "Ramesh K." },
  { id: "REC-2026-00056", requestType: "Recycle / Disposal",itemAsset: "IT Assets (10 Items)",     assetTag: "",         location: "Bangalore - Main Office", requestDate: "18 Jul 2026", status: "Scheduled",   priority: "Low",    nextAppointment: "25 Jul 2026\n11:00 AM", requestedBy: "Priya Sharma" },
  { id: "RET-2026-00031", requestType: "Return / Replace",  itemAsset: "HP LaserJet Pro MFP 4103", assetTag: "AST-1002", location: "Bangalore - Main Office", requestDate: "16 Jul 2026", status: "In Progress", priority: "High",   nextAppointment: "23 Jul 2026\n02:00 PM", requestedBy: "Vikram Singh" },
  { id: "REP-2026-00120", requestType: "Repair Service",    itemAsset: "APC Smart UPS 1500VA",     assetTag: "AST-1004", location: "Pune - Branch Office",    requestDate: "10 Jul 2026", status: "Completed",   priority: "Low",    nextAppointment: "10 Jul 2026\n04:30 PM", requestedBy: "Anita Patil" },
  { id: "AMC-2026-00110", requestType: "AMC Service",       itemAsset: "Cisco Switch WS-C2960X",   assetTag: "AST-1003", location: "Hyderabad - Branch",      requestDate: "05 Jul 2026", status: "Completed",   priority: "Medium", nextAppointment: "05 Jul 2026\n11:30 AM", requestedBy: "Vikram Singh" },
  { id: "REP-2026-00098", requestType: "Repair Service",    itemAsset: "Lenovo ThinkPad E14",      assetTag: "AST-1005", location: "Bangalore - Main Office", requestDate: "08 Jul 2026", status: "Cancelled",   priority: "Low",    nextAppointment: "-",                     requestedBy: "Ramesh K." },
  { id: "REC-2026-00021", requestType: "Recycle / Disposal",itemAsset: "Old Monitors (5 Items)",   assetTag: "",         location: "Chennai - Branch",        requestDate: "01 Jul 2026", status: "Cancelled",   priority: "Low",    nextAppointment: "-",                     requestedBy: "Suresh B." },
];

// Fill up to 24 entries for pagination demo
const EXTRA: ServiceRequest[] = [
  { id: "REP-2026-00091", requestType: "Repair Service",    itemAsset: "HP EliteBook 840",         assetTag: "AST-1006", location: "Mumbai - Office",         requestDate: "03 Jul 2026", status: "Completed",   priority: "Medium", nextAppointment: "04 Jul 2026\n09:00 AM", requestedBy: "Anita Patil" },
  { id: "AMC-2026-00085", requestType: "AMC Service",       itemAsset: "Dell PowerEdge R440",      assetTag: "AST-1007", location: "Bangalore - Main Office", requestDate: "01 Jul 2026", status: "Active",      priority: "High",   nextAppointment: "01 Aug 2026\n10:00 AM", requestedBy: "Ramesh K." },
  { id: "REC-2026-00078", requestType: "Recycle / Disposal",itemAsset: "Old Printers (3 Items)",   assetTag: "",         location: "Pune - Branch Office",    requestDate: "28 Jun 2026", status: "Completed",   priority: "Low",    nextAppointment: "30 Jun 2026\n02:00 PM", requestedBy: "Suresh B." },
  { id: "RET-2026-00072", requestType: "Return / Replace",  itemAsset: "Canon ImageRunner 2625",   assetTag: "AST-1008", location: "Hyderabad - Branch",      requestDate: "25 Jun 2026", status: "Completed",   priority: "Medium", nextAppointment: "27 Jun 2026\n11:00 AM", requestedBy: "Vikram Singh" },
  { id: "REP-2026-00068", requestType: "Repair Service",    itemAsset: "Epson WorkForce 7720",     assetTag: "AST-1009", location: "Chennai - Branch",        requestDate: "22 Jun 2026", status: "Cancelled",   priority: "Low",    nextAppointment: "-",                     requestedBy: "Priya Sharma" },
  { id: "AMC-2026-00061", requestType: "AMC Service",       itemAsset: "Cisco IP Phone 7945",      assetTag: "AST-1010", location: "Bangalore - Main Office", requestDate: "18 Jun 2026", status: "Active",      priority: "Medium", nextAppointment: "18 Jul 2026\n09:30 AM", requestedBy: "Ramesh K." },
  { id: "REC-2026-00055", requestType: "Recycle / Disposal",itemAsset: "Keyboards & Mice (20)",    assetTag: "",         location: "Mumbai - Office",         requestDate: "14 Jun 2026", status: "Completed",   priority: "Low",    nextAppointment: "15 Jun 2026\n03:00 PM", requestedBy: "Anita Patil" },
  { id: "REP-2026-00048", requestType: "Repair Service",    itemAsset: "Zebra ZT410 Barcode",      assetTag: "AST-1011", location: "Pune - Branch Office",    requestDate: "10 Jun 2026", status: "Completed",   priority: "High",   nextAppointment: "11 Jun 2026\n10:00 AM", requestedBy: "Vikram Singh" },
  { id: "AMC-2026-00042", requestType: "AMC Service",       itemAsset: "APC UPS 3000VA",           assetTag: "AST-1012", location: "Hyderabad - Branch",      requestDate: "06 Jun 2026", status: "Active",      priority: "Medium", nextAppointment: "06 Jul 2026\n10:00 AM", requestedBy: "Suresh B." },
  { id: "RET-2026-00038", requestType: "Return / Replace",  itemAsset: "Dell Monitor P2422H",      assetTag: "AST-1013", location: "Bangalore - Main Office", requestDate: "03 Jun 2026", status: "Completed",   priority: "Low",    nextAppointment: "05 Jun 2026\n02:00 PM", requestedBy: "Priya Sharma" },
  { id: "REP-2026-00031", requestType: "Repair Service",    itemAsset: "HP LaserJet M404dn",       assetTag: "AST-1014", location: "Chennai - Branch",        requestDate: "28 May 2026", status: "Cancelled",   priority: "Low",    nextAppointment: "-",                     requestedBy: "Ramesh K." },
  { id: "REC-2026-00025", requestType: "Recycle / Disposal",itemAsset: "Network Switches (5)",     assetTag: "",         location: "Mumbai - Office",         requestDate: "22 May 2026", status: "Completed",   priority: "Medium", nextAppointment: "24 May 2026\n11:00 AM", requestedBy: "Anita Patil" },
  { id: "AMC-2026-00019", requestType: "AMC Service",       itemAsset: "Fortinet FortiGate 60F",   assetTag: "AST-1015", location: "Bangalore - Main Office", requestDate: "18 May 2026", status: "Active",      priority: "High",   nextAppointment: "18 Jun 2026\n09:00 AM", requestedBy: "Vikram Singh" },
  { id: "REP-2026-00012", requestType: "Repair Service",    itemAsset: "Lenovo IdeaCentre 510",    assetTag: "AST-1016", location: "Hyderabad - Branch",      requestDate: "12 May 2026", status: "Completed",   priority: "Low",    nextAppointment: "13 May 2026\n02:00 PM", requestedBy: "Suresh B." },
  { id: "RET-2026-00008", requestType: "Return / Replace",  itemAsset: "Cisco Catalyst 2960-X",    assetTag: "AST-1017", location: "Pune - Branch Office",    requestDate: "08 May 2026", status: "Completed",   priority: "Medium", nextAppointment: "10 May 2026\n10:00 AM", requestedBy: "Priya Sharma" },
  { id: "REC-2026-00004", requestType: "Recycle / Disposal",itemAsset: "Old Servers (2 Items)",    assetTag: "",         location: "Bangalore - Main Office", requestDate: "03 May 2026", status: "Completed",   priority: "High",   nextAppointment: "05 May 2026\n09:00 AM", requestedBy: "Ramesh K." },
];

const ALL_REQUESTS = [...REQUESTS, ...EXTRA];

// ─── Status badge colours ─────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${className}`}>
      {children}
    </span>
  );
}

// ─── Row Actions ──────────────────────────────────────────────────────────────
function RowActions() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex justify-center">
      <button
        onClick={() => setOpen(p => !p)}
        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-1">
          {["View Details", "Edit Request", "Cancel Request"].map(label => (
            <button
              key={label}
              onClick={() => setOpen(false)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${label === "Cancel Request" ? "text-red-600 hover:bg-red-50" : "text-gray-700 hover:bg-gray-50"}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MyRequestsPage() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [dateRange, setDateRange] = useState("Last 30 Days");
  const ITEMS_PER_PAGE = 8;

  // Stats from the image
  const stats = [
    { label: "Total Requests",     value: 24, filterKey: "All",         icon: <ClipboardList className="w-5 h-5 text-blue-500" />,   iconBg: "bg-blue-50",    border: "border-blue-100",   valueColor: "text-gray-900" },
    { label: "In Progress",        value: 7,  filterKey: "In Progress",  icon: <CheckCircle2  className="w-5 h-5 text-emerald-500" />, iconBg: "bg-emerald-50", border: "border-emerald-100", valueColor: "text-emerald-600" },
    { label: "Pending / Scheduled",value: 6,  filterKey: "Scheduled",    icon: <Clock         className="w-5 h-5 text-amber-500" />,   iconBg: "bg-amber-50",   border: "border-amber-100",  valueColor: "text-amber-600" },
    { label: "Completed",          value: 8,  filterKey: "Completed",    icon: <CheckSquare   className="w-5 h-5 text-purple-500" />,  iconBg: "bg-purple-50",  border: "border-purple-100", valueColor: "text-purple-600" },
    { label: "Cancelled",          value: 3,  filterKey: "Cancelled",    icon: <XCircle       className="w-5 h-5 text-red-400" />,     iconBg: "bg-red-50",     border: "border-red-100",    valueColor: "text-red-500" },
  ];

  const filtered = activeFilter === "All"
    ? ALL_REQUESTS
    : ALL_REQUESTS.filter(r => r.status === activeFilter);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage   = Math.min(currentPage, totalPages);
  const paged      = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const handleTile = (key: string) => {
    setActiveFilter(prev => prev === key ? "All" : key);
    setCurrentPage(1);
  };

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
            const isActive = activeFilter === s.filterKey;
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
            {/* Toolbar */}
            <div className="flex items-center justify-end gap-2 px-3 py-2 border-b border-gray-100">
              {activeFilter !== "All" && (
                <span className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-full font-medium mr-auto">
                  {activeFilter} · {filtered.length} requests
                  <button onClick={() => { setActiveFilter("All"); setCurrentPage(1); }} className="ml-1.5 text-blue-400 hover:text-blue-700">✕</button>
                </span>
              )}
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-700 transition-colors">
                <Filter className="w-3.5 h-3.5" /> Filters
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg bg-white hover:bg-gray-50 text-gray-700 transition-colors">
                <Download className="w-3.5 h-3.5" /> Export
              </button>
              <div className="relative">
                <select
                  value={dateRange}
                  onChange={e => setDateRange(e.target.value)}
                  className="appearance-none pl-7 pr-6 py-1.5 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:border-blue-400 cursor-pointer font-medium"
                >
                  {["Last 7 Days", "Last 30 Days", "Last 90 Days", "This Year"].map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
                <Calendar className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-xs">
                <colgroup>
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "11%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "7%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "6%" }} />
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
                        <p className="text-sm">No requests match the current filter</p>
                      </td>
                    </tr>
                  ) : paged.map(req => (
                    <tr key={req.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-3">
                        <button
                          onClick={() => navigate(`/services/requests/${req.id}`)}
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
                      <td className="px-3 py-3 text-gray-600 whitespace-pre-line leading-tight">
                        {req.nextAppointment}
                      </td>
                      <td className="px-3 py-3 text-gray-700 truncate">{req.requestedBy}</td>
                      <td className="px-3 py-3">
                        <RowActions />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-3 py-3 flex items-center justify-between text-sm text-gray-600 border-t">
              <span className="text-xs text-gray-500">
                Showing {filtered.length === 0 ? "0" : `${(safePage - 1) * ITEMS_PER_PAGE + 1} to ${Math.min(safePage * ITEMS_PER_PAGE, filtered.length)}`} of {filtered.length} entries
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
