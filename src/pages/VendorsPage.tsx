import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Star,
  ChevronDown,
  X,
  Building2,
  Mail,
  MapPin,
  Calendar,
  Award,
  Users,
  AlertTriangle,
  IndianRupee,
  Edit,
  Archive,
  MoreVertical,
  CheckCircle,
  Clock,
  PauseCircle,
  XCircle,
  Phone,
} from "lucide-react";

type VendorStatus = "Active" | "Inactive" | "On Hold" | "Pending";

interface Vendor {
  id: string;
  name: string;
  category: string;
  primaryContact: string;
  email: string;
  phone: string;
  rating: number;
  region: string;
  status: VendorStatus;
  onboardedDate: string;
  monthSpend: number;
  score: number;
  address: string;
  totalSpend: number;
  complianceIssues: number;
  archived: boolean;
}

const initialVendors: Vendor[] = [
  { id: "VND-1001", name: "InfoTech Pvt. Ltd.", category: "IT Services", primaryContact: "Rahul Sharma", email: "rahul@infotech.com", phone: "+91 98765 43210", rating: 4.5, region: "North",  status: "Active", onboardedDate: "12 Jan 2023", monthSpend: 75000000, score: 4.8, address: "Delhi, India", totalSpend: 850000000, complianceIssues: 0, archived: false },
  { id: "VND-1002", name: "Logistics Express", category: "Logistics", primaryContact: "Priya Mehta", email: "priya@logexp.com", phone: "+91 87654 32109", rating: 3.8, region: "West",  status: "Active", onboardedDate: "5 Mar 2023", monthSpend: 42000000, score: 3.9, address: "Mumbai, India", totalSpend: 420000000, complianceIssues: 2, archived: false },
  { id: "VND-1003", name: "GreenLeaf Supplies", category: "Raw Materials", primaryContact: "Ankit Patel", email: "ankit@greenleaf.com", phone: "+91 76543 21098", rating: 4.2, region: "South",  status: "On Hold", onboardedDate: "20 Jun 2022", monthSpend: 0, score: 4.1, address: "Bangalore, India", totalSpend: 310000000, complianceIssues: 5, archived: false },
  { id: "VND-1004", name: "Cloud Systems India", category: "IT Services", primaryContact: "Sneha Reddy", email: "sneha@cloudsys.in", phone: "+91 65432 10987", rating: 4.7, region: "South",  status: "Active", onboardedDate: "8 Sep 2022", monthSpend: 96000000, score: 4.9, address: "Hyderabad, India", totalSpend: 960000000, complianceIssues: 0, archived: false },
  { id: "VND-1005", name: "FastTrack Movers", category: "Logistics", primaryContact: "Vikram Singh", email: "vikram@fasttrack.co", phone: "+91 54321 09876", rating: 3.5, region: "East",  status: "Pending", onboardedDate: "14 Nov 2023", monthSpend: 18000000, score: 3.6, address: "Kolkata, India", totalSpend: 75000000, complianceIssues: 1, archived: false },
  { id: "VND-1006", name: "Steel Forge Ltd.", category: "Manufacturing", primaryContact: "Kavita Joshi", email: "kavita@steelforge.com", phone: "+91 43210 98765", rating: 4.0, region: "West",  status: "Active", onboardedDate: "2 Feb 2022", monthSpend: 130000000, score: 4.2, address: "Pune, India", totalSpend: 1250000000, complianceIssues: 3, archived: false },
  { id: "VND-1007", name: "Digital Wave Media", category: "Marketing", primaryContact: "Arjun Nair", email: "arjun@digitalwave.io", phone: "+91 32109 87654", rating: 4.3, region: "South",  status: "Active", onboardedDate: "30 Apr 2023", monthSpend: 22000000, score: 4.4, address: "Chennai, India", totalSpend: 190000000, complianceIssues: 0, archived: false },
  { id: "VND-1008", name: "Ecopack Solutions", category: "Packaging", primaryContact: "Neha Gupta", email: "neha@ecopack.com", phone: "+91 21098 76543", rating: 3.9, region: "North",  status: "Inactive", onboardedDate: "11 Jul 2021", monthSpend: 0, score: 3.7, address: "Jaipur, India", totalSpend: 145000000, complianceIssues: 4, archived: false },
  { id: "VND-1009", name: "TechBridge Corp", category: "IT Services", primaryContact: "Suresh Kumar", email: "suresh@techbridge.in", phone: "+91 10987 65432", rating: 4.6, region: "West",  status: "Active", onboardedDate: "19 Oct 2022", monthSpend: 88000000, score: 4.7, address: "Ahmedabad, India", totalSpend: 780000000, complianceIssues: 1, archived: false },
  { id: "VND-1010", name: "Agro Fresh Farms", category: "Agriculture", primaryContact: "Deepa Iyer", email: "deepa@agrofresh.com", phone: "+91 09876 54321", rating: 4.1, region: "South",  status: "Active", onboardedDate: "7 Jan 2024", monthSpend: 35000000, score: 4.0, address: "Coimbatore, India", totalSpend: 120000000, complianceIssues: 0, archived: false },
];

const formatCrores = (val: number) => {
  const cr = val / 10000000;
  return cr >= 100 ? `₹${(cr / 100).toFixed(1)}K Cr` : `₹${cr.toFixed(1)} Cr`;
};
const formatLakhs = (val: number) => {
  if (val === 0) return "—";
  const lakh = val / 100000;
  return lakh >= 100 ? `₹${(lakh / 100).toFixed(1)} Cr` : `₹${lakh.toFixed(1)} L`;
};

const statusColors: Record<VendorStatus, string> = {
  Active: "bg-emerald-100 text-emerald-700",
  Inactive: "bg-gray-100 text-gray-500",
  "On Hold": "bg-amber-100 text-amber-700",
  Pending: "bg-blue-100 text-blue-700",
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" />
      <span className="text-xs font-semibold text-gray-800">{rating.toFixed(1)}</span>
    </div>
  );
}
function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${className}`}>
      {children}
    </span>
  );
}

// ----- Row Actions Menu -----
function RowActionsMenu({ vendor, onEdit, onArchive, onSetStatus }: {
  vendor: Vendor;
  onEdit: () => void;
  onArchive: () => void;
  onSetStatus: (s: VendorStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setStatusOpen(false); } };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const statuses: { label: VendorStatus; icon: React.ReactNode; color: string }[] = [
    { label: "Active", icon: <CheckCircle className="w-3.5 h-3.5" />, color: "text-emerald-600" },
    { label: "On Hold", icon: <PauseCircle className="w-3.5 h-3.5" />, color: "text-amber-600" },
    { label: "Pending", icon: <Clock className="w-3.5 h-3.5" />, color: "text-blue-600" },
    { label: "Inactive", icon: <XCircle className="w-3.5 h-3.5" />, color: "text-gray-500" },
  ];

  return (
    <div ref={ref} className="relative flex justify-center">
      <button onClick={() => { setOpen(p => !p); setStatusOpen(false); }} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
        <MoreVertical className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-1">
          <button onClick={() => { onEdit(); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors text-left">
            <Edit className="w-3.5 h-3.5 opacity-60" /> Edit Vendor
          </button>
          <div className="relative">
            <button onClick={() => setStatusOpen(p => !p)} className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
              <span className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 opacity-60" /> Set Status</span>
              <ChevronDown className={`w-3 h-3 opacity-40 transition-transform ${statusOpen ? "rotate-180" : ""}`} />
            </button>
            {statusOpen && (
              <div className="absolute right-full top-0 mr-1 w-40 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-1">
                {statuses.map(s => (
                  <button key={s.label} onClick={() => { onSetStatus(s.label); setOpen(false); setStatusOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-colors text-left ${s.color} ${vendor.status === s.label ? "font-bold" : ""}`}>
                    {s.icon} {s.label} {vendor.status === s.label && <span className="ml-auto opacity-50">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="border-t border-gray-100 my-0.5" />
          <button onClick={() => { onArchive(); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors text-left">
            <Archive className="w-3.5 h-3.5 opacity-70" /> Archive Vendor
          </button>
        </div>
      )}
    </div>
  );
}

// ----- Top 3-dot menu -----
function TopMenu({ onArchived, onOnboarding }: { onArchived: () => void; onOnboarding: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(p => !p)} className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 shadow-sm transition-colors">
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-1">
          {[
            { label: "Vendor Onboarding", icon: <Users className="w-4 h-4" />, onClick: onOnboarding },
            { label: "Export Vendors", icon: <IndianRupee className="w-4 h-4" />, onClick: () => {} },
            { label: "Archived Vendors", icon: <Archive className="w-4 h-4" />, onClick: onArchived },
          ].map((o, i) => (
            <button key={i} onClick={() => { o.onClick(); setOpen(false); }} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
              <span className="text-gray-400">{o.icon}</span>{o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ----- Vendor Overview Popup -----
function VendorOverviewPopup({ vendor, onClose }: { vendor: Vendor; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-start justify-between">
          <div>
            <p className="text-blue-200 text-xs font-medium mb-1">{vendor.id}</p>
            <h2 className="text-white text-xl font-semibold">{vendor.name}</h2>
            <p className="text-blue-200 text-sm mt-0.5">{vendor.category} · {vendor.region}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
          {[
            { label: "Rating", value: `${vendor.rating}/5`, icon: <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> },
            { label: "Score", value: `${vendor.score}/5`, icon: <Award className="w-4 h-4 text-blue-500" /> },
            { label: "Issues", value: vendor.complianceIssues, icon: <AlertTriangle className="w-4 h-4 text-red-400" /> },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center py-4 gap-1">
              {s.icon}
              <p className="text-lg font-bold text-gray-800">{s.value}</p>
              <p className="text-xs text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="p-5 grid grid-cols-2 gap-5">
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Contact</h3>
            {[
              { icon: <Users className="w-3.5 h-3.5 text-blue-400" />, v: vendor.primaryContact },
              { icon: <Mail className="w-3.5 h-3.5 text-blue-400" />, v: vendor.email },
              { icon: <Phone className="w-3.5 h-3.5 text-blue-400" />, v: vendor.phone },
              { icon: <MapPin className="w-3.5 h-3.5 text-blue-400" />, v: vendor.address },
            ].map((r, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="mt-0.5 flex-shrink-0">{r.icon}</span>
                <p className="text-sm text-gray-700 break-all">{r.v}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Financials</h3>
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-0.5">Total Spend</p>
              <p className="text-base font-bold text-gray-800">{formatCrores(vendor.totalSpend)}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-0.5">This Month</p>
              <p className="text-base font-bold text-gray-800">{formatLakhs(vendor.monthSpend)}</p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Onboarded</p>
                <p className="text-sm font-medium text-gray-700">{vendor.onboardedDate}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge className={statusColors[vendor.status]}>{vendor.status}</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----- Archived Vendors Modal -----
function ArchivedModal({ vendors, onClose, onVendorClick }: { vendors: Vendor[]; onClose: () => void; onVendorClick: (v: Vendor) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Archived Vendors</h2>
            <p className="text-xs text-gray-400 mt-0.5">{vendors.length} {vendors.length === 1 ? "vendor" : "vendors"} · Read only</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="overflow-auto flex-1">
          {vendors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Archive className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">No archived vendors yet</p>
            </div>
          ) : (
            <table className="w-full table-fixed text-xs">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-[10%]">Vendor ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-[20%]">Vendor Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-[14%]">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-[16%]">Primary Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-[9%]">Rating</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-[9%]">Region</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-[9%]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {vendors.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => onVendorClick(v)} className="text-blue-600 font-bold hover:underline text-xs">{v.id}</button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">{v.name[0]}</div>
                        <span className="font-medium text-gray-800 truncate">{v.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 truncate">{v.category}</td>
                    <td className="px-4 py-3 text-gray-500 truncate">{v.primaryContact}</td>
                    <td className="px-4 py-3"><StarRating rating={v.rating} /></td>
                    <td className="px-4 py-3 text-gray-500">{v.region}</td>
                    <td className="px-4 py-3"><Badge className="bg-gray-100 text-gray-500">Archived</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex-shrink-0">
          <p className="text-xs text-gray-400">This list is read-only. No actions can be performed on archived vendors.</p>
        </div>
      </div>
    </div>
  );
}

// ----- Filter Select -----
function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="appearance-none pl-2.5 pr-6 py-1 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:border-blue-400 cursor-pointer font-medium">
        {options.map(o => <option key={o} value={o}>{o === "All" ? label : o}</option>)}
      </select>
      <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
}

// ----- Main App -----
export default function App() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [overviewVendor, setOverviewVendor] = useState<Vendor | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [archivedOverview, setArchivedOverview] = useState<Vendor | null>(null);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);

  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterRating, setFilterRating] = useState("All");
  const [filterRegion, setFilterRegion] = useState("All");

  const activeVendors = vendors.filter(v => !v.archived);
  const archivedVendors = vendors.filter(v => v.archived);

  const totalSpend = activeVendors.reduce((s, v) => s + v.totalSpend, 0);
  const avgRating = activeVendors.length ? activeVendors.reduce((s, v) => s + v.rating, 0) / activeVendors.length : 0;
  const avgScore = activeVendors.length ? activeVendors.reduce((s, v) => s + v.score, 0) / activeVendors.length : 0;
  const complianceIssues = activeVendors.reduce((s, v) => s + v.complianceIssues, 0);
  const activeCount = activeVendors.filter(v => v.status === "Active").length;

  const categories = ["All", ...Array.from(new Set(vendors.map(v => v.category)))];
  const regions = ["All", ...Array.from(new Set(vendors.map(v => v.region)))];

  const filteredVendors = activeVendors.filter(v => {
    if (filterCategory !== "All" && v.category !== filterCategory) return false;
    if (filterStatus !== "All" && v.status !== filterStatus) return false;
    if (filterRegion !== "All" && v.region !== filterRegion) return false;
    if (filterRating === "5★ (4.5+)" && v.rating < 4.5) return false;
    if (filterRating === "4★ (3.5–4.5)" && (v.rating < 3.5 || v.rating >= 4.5)) return false;
    if (filterRating === "3★ (Below 3.5)" && v.rating >= 3.5) return false;
    return true;
  });

  const archiveVendor = (id: string) => setVendors(prev => prev.map(v => v.id === id ? { ...v, archived: true } : v));
  const setVendorStatus = (id: string, status: VendorStatus) => setVendors(prev => prev.map(v => v.id === id ? { ...v, status } : v));

  const stats = [
    { label: "Total Vendors", value: activeVendors.length, sub: "registered", icon: <Building2 className="w-4 h-4 text-blue-600" />, bg: "bg-blue-50" },
    { label: "Active Vendors", value: activeCount, sub: "currently active", icon: <Users className="w-4 h-4 text-emerald-600" />, bg: "bg-emerald-50" },
    { label: "Compliance Issues", value: complianceIssues, sub: "need attention", icon: <AlertTriangle className="w-4 h-4 text-amber-600" />, bg: "bg-amber-50" },
    { label: "Avg Rating", value: avgRating.toFixed(1), sub: "out of 5.0", icon: <Star className="w-4 h-4 fill-amber-400 text-amber-400" />, bg: "bg-yellow-50" },
    { label: "Total Spend", value: formatCrores(totalSpend), sub: "all time", icon: <IndianRupee className="w-4 h-4 text-purple-600" />, bg: "bg-purple-50" },
    { label: "Avg Score", value: `${avgScore.toFixed(1)}/5`, sub: "performance", icon: <Award className="w-4 h-4 text-indigo-600" />, bg: "bg-indigo-50" },
  ];


  return (
    <div className="w-full h-screen overflow-hidden flex flex-col bg-[#f5f6fa] font-[Inter,sans-serif] px-4 py-3 gap-2 mx-auto max-w-6xl">

      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0 py-1">
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-tight">Vendors List</h1>
          <p className="text-xs text-gray-400 mt-0">Manage and monitor all your vendor relationships</p>
        </div>
        <TopMenu onArchived={() => setShowArchived(true)} onOnboarding={() => navigate('/vendors/onboarding')} />
      </div>

      {/* Stats tiles */}
      <div className="grid grid-cols-6 gap-1.5 flex-shrink-0">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-md border border-gray-100 shadow-sm p-3 py-4 flex flex-col items-center justify-center gap-1 text-center">
            <div className={`w-5 h-5 rounded-md ${s.bg} flex items-center justify-center flex-shrink-0 text-xs`}>{s.icon}</div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-900 leading-tight">{s.value}</p>
              <p className="text-xs text-gray-500 leading-tight truncate">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table card — fills remaining space, no scrollbars */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">

        {/* Filters */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 flex-shrink-0 flex-wrap">
          <span className="text-xs font-semibold text-gray-400 mr-0.5">Filters:</span>
          <FilterSelect label="Category" value={filterCategory} options={categories} onChange={setFilterCategory} />
          <FilterSelect label="Status" value={filterStatus} options={["All", "Active", "Inactive", "On Hold", "Pending"]} onChange={setFilterStatus} />
          <FilterSelect label="Rating" value={filterRating} options={["All", "5★ (4.5+)", "4★ (3.5–4.5)", "3★ (Below 3.5)"]} onChange={setFilterRating} />
          <FilterSelect label="Region" value={filterRegion} options={regions} onChange={setFilterRegion} />
            <button onClick={() => { setFilterCategory("All"); setFilterStatus("All"); setFilterRating("All"); setFilterRegion("All"); }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium">Clear all</button> 
          <span className="ml-auto text-xs text-gray-400">{filteredVendors.length} of {activeVendors.length} vendors</span>
        </div>

        {/* Table — table-fixed so columns respect widths, no overflow */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <table className="w-full h-full table-fixed text-xs border-collapse">
            <colgroup>
              <col style={{ width: "9%" }} />
              <col style={{ width: "19%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "16%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "7%" }} />
            </colgroup>
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Vendor ID", "Vendor Name", "Category", "Primary Contact", "Rating", "Region", "Status", "This Month Spend","Action", ""].map((h, i) => (
                  <th key={i} className="px-2.5 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-gray-400">
                    <Building2 className="w-7 h-7 mx-auto mb-2 opacity-30" />
                    <p>No vendors match the current filters</p>
                  </td>
                </tr>
              ) : filteredVendors.map((v, idx) => (
                <tr key={v.id} className={`border-b border-gray-50 hover:bg-blue-50/30 transition-colors ${idx % 2 === 0 ? "" : "bg-gray-50/30"}`}>
                  <td className="px-2.5 py-2.5">
                    <button onClick={() => navigate(`/vendors/${v.id}`)} className="text-blue-600 font-bold hover:underline text-xs">{v.id}</button>
                  </td>
                  <td className="px-2.5 py-2.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">{v.name[0]}</div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate text-xs leading-tight">{v.name}</p>
                        <p className="text-gray-400 truncate text-xs leading-tight">{v.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2.5 py-2.5">
                    <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-medium truncate block max-w-full">{v.category}</span>
                  </td>
                  <td className="px-2.5 py-2.5">
                    <p className="text-gray-700 font-medium text-xs truncate leading-tight">{v.primaryContact}</p>
                    <p className="text-gray-400 text-xs truncate leading-tight">{v.phone}</p>
                  </td>
                  <td className="px-2.5 py-2.5"><StarRating rating={v.rating} /></td>
                  <td className="px-2.5 py-2.5 text-gray-500 text-xs">{v.region}</td>
                  <td className="px-2.5 py-2.5"><Badge className={statusColors[v.status]}>{v.status}</Badge></td>
                  <td className="px-2.5 py-2.5">
                    <span className={`font-semibold text-xs ${v.monthSpend > 0 ? "text-gray-800" : "text-gray-300"}`}>{formatLakhs(v.monthSpend)}</span>
                  </td>
                  <td className="px-1 py-2.5">
                    <RowActionsMenu vendor={v} onEdit={() => setEditVendor(v)} onArchive={() => archiveVendor(v.id)} onSetStatus={s => setVendorStatus(v.id, s)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between flex-shrink-0 bg-gray-50/50">
          <p className="text-xs text-gray-400">Showing {filteredVendors.length} of {activeVendors.length} active vendors</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3].map(p => (
              <button key={p} className={`w-6 h-6 rounded text-xs font-medium ${p === 1 ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-100"}`}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Vendor Overview Popup */}
      {overviewVendor && <VendorOverviewPopup vendor={overviewVendor} onClose={() => setOverviewVendor(null)} />}

      {/* Archived Vendors Modal */}
      {showArchived && <ArchivedModal vendors={archivedVendors} onClose={() => setShowArchived(false)} onVendorClick={v => setArchivedOverview(v)} />}

      {/* Archived vendor overview popup */}
      {archivedOverview && <VendorOverviewPopup vendor={archivedOverview} onClose={() => setArchivedOverview(null)} />}

      {/* Edit Vendor Modal */}
      {editVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setEditVendor(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-base font-semibold text-gray-900">Edit Vendor</h2>
              <button onClick={() => setEditVendor(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-6 py-4 flex flex-col gap-3">
              {[
                { label: "Vendor Name", value: editVendor.name },
                { label: "Category", value: editVendor.category },
                { label: "Primary Contact", value: editVendor.primaryContact },
                { label: "Email", value: editVendor.email },
                { label: "Phone", value: editVendor.phone },
                { label: "Region", value: editVendor.region },
                { label: "Address", value: editVendor.address },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">{f.label}</label>
                  <input defaultValue={f.value} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-gray-50" />
                </div>
              ))}
            </div>
            <div className="flex gap-2 px-6 pb-5">
              <button className="flex-1 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors" onClick={() => setEditVendor(null)}>Save Changes</button>
              <button className="flex-1 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors" onClick={() => setEditVendor(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
