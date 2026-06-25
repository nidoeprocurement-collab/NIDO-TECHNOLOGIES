import { useState, useRef, useEffect } from "react";
import {
  FileText, CheckCircle, Clock, IndianRupee, RefreshCcw,
  MoreVertical, Eye, ChevronDown, ChevronLeft, ChevronRight,
  X, Plus, Download, Archive, Pencil, FolderOpen, Check,
  User, Phone, Calendar, ChevronUp, AlertTriangle,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type ContractStatus = "Active" | "Expired" | "Expiring Soon" | "Archived";
type ContractType = "Supply Agreement" | "SLA" | "NDA" | "AMC" | "Framework";

interface Contract {
  id: string;
  name: string;
  type: ContractType;
  startDate: string;
  endDate: string;
  value: string;
  paymentTerms: string;
  status: ContractStatus;
  autoRenewal: boolean;
  renewalReminder: string;
  expiryIn: string | null;
  contacts: {
    owner: string;
    vendor: string;
    vendorPhone: string;
    procurement: string;
    procurementPhone: string;
  };
  terms: {
    priceValidity: string;
    deliveryTerm: string;
    warrantyPeriod: string;
    slaUptime: string;
    penaltyClause: string;
    governingLaw: string;
  };
}

// ─── Data ────────────────────────────────────────────────────────────────────
const CONTRACTS: Contract[] = [
  {
    id: "CT-2025-001",
    name: "IT Hardware Supply Agreement 2025",
    type: "Supply Agreement",
    startDate: "Jan 01, 2025",
    endDate: "Dec 31, 2026",
    value: "₹8,00,00,000",
    paymentTerms: "Net 30",
    status: "Active",
    autoRenewal: true,
    renewalReminder: "60 Days Before Expiry",
    expiryIn: "252 Days",
    contacts: { owner: "Pavan (System Owner)", vendor: "Rahul Sharma", vendorPhone: "+91 98765 43210", procurement: "Sneha Iyer", procurementPhone: "+91 98740 11122" },
    terms: { priceValidity: "Till Dec 31, 2026", deliveryTerm: "FOB - Destination", warrantyPeriod: "3 Years Onsite", slaUptime: "99.5%", penaltyClause: "Applicable", governingLaw: "Karnataka, India" },
  },
  {
    id: "CT-2024-001",
    name: "Service Level Agreement 2024",
    type: "SLA",
    startDate: "Mar 01, 2024",
    endDate: "Feb 28, 2025",
    value: "₹2,00,00,000",
    paymentTerms: "Net 30",
    status: "Active",
    autoRenewal: false,
    renewalReminder: "30 Days Before Expiry",
    expiryIn: null,
    contacts: { owner: "Pavan (System Owner)", vendor: "Ravi Kumar", vendorPhone: "+91 99887 66554", procurement: "Anita Desai", procurementPhone: "+91 87654 32100" },
    terms: { priceValidity: "Till Feb 28, 2025", deliveryTerm: "Ex-Works", warrantyPeriod: "1 Year", slaUptime: "99.0%", penaltyClause: "Applicable", governingLaw: "Maharashtra, India" },
  },
  {
    id: "CT-2023-001",
    name: "NDA Agreement",
    type: "NDA",
    startDate: "Feb 10, 2023",
    endDate: "Feb 09, 2026",
    value: "₹80,00,000",
    paymentTerms: "Net 30",
    status: "Expired",
    autoRenewal: false,
    renewalReminder: "30 Days Before Expiry",
    expiryIn: null,
    contacts: { owner: "Pavan (System Owner)", vendor: "Meena Pillai", vendorPhone: "+91 91234 56789", procurement: "Kartik Rao", procurementPhone: "+91 90000 12345" },
    terms: { priceValidity: "Till Feb 09, 2026", deliveryTerm: "N/A", warrantyPeriod: "N/A", slaUptime: "N/A", penaltyClause: "Not Applicable", governingLaw: "Karnataka, India" },
  },
];

const ARCHIVED_CONTRACTS: Contract[] = [
  {
    id: "CT-2022-001",
    name: "Hardware Maintenance Contract 2022",
    type: "AMC",
    startDate: "Jan 15, 2022",
    endDate: "Jan 14, 2023",
    value: "₹45,00,000",
    paymentTerms: "Net 45",
    status: "Archived",
    autoRenewal: false,
    renewalReminder: "30 Days Before Expiry",
    expiryIn: null,
    contacts: { owner: "Pavan (System Owner)", vendor: "Suresh Nair", vendorPhone: "+91 98001 23456", procurement: "Divya Menon", procurementPhone: "+91 87001 23456" },
    terms: { priceValidity: "Till Jan 14, 2023", deliveryTerm: "Onsite", warrantyPeriod: "1 Year", slaUptime: "98.0%", penaltyClause: "Applicable", governingLaw: "Kerala, India" },
  },
  {
    id: "CT-2021-001",
    name: "Framework Agreement 2021",
    type: "Framework",
    startDate: "Apr 01, 2021",
    endDate: "Mar 31, 2022",
    value: "₹1,20,00,000",
    paymentTerms: "Net 60",
    status: "Archived",
    autoRenewal: false,
    renewalReminder: "45 Days Before Expiry",
    expiryIn: null,
    contacts: { owner: "Pavan (System Owner)", vendor: "Arjun Das", vendorPhone: "+91 97001 23456", procurement: "Priya Sharma", procurementPhone: "+91 86001 23456" },
    terms: { priceValidity: "Till Mar 31, 2022", deliveryTerm: "CIF", warrantyPeriod: "2 Years", slaUptime: "98.5%", penaltyClause: "Applicable", governingLaw: "Delhi, India" },
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<ContractStatus, string> = {
  Active: "bg-green-100 text-green-700",
  Expired: "bg-red-100 text-red-600",
  "Expiring Soon": "bg-orange-100 text-orange-600",
  Archived: "bg-gray-100 text-gray-500",
};

const TYPE_STYLES: Record<ContractType, string> = {
  "Supply Agreement": "bg-blue-100 text-blue-700",
  SLA: "bg-purple-100 text-purple-700",
  NDA: "bg-cyan-100 text-cyan-700",
  AMC: "bg-yellow-100 text-yellow-700",
  Framework: "bg-indigo-100 text-indigo-700",
};

function ProgressBar({ value, color = "bg-blue-500" }: { value: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-10 text-right">{value}%</span>
    </div>
  );
}

// Simple SVG Line Chart
function LineChart() {
  const data = [0.5, 1, 1.8, 2.5, 3.2, 4.1, 5, 5.8, 6.9, 7.5, 8, 8];
  const max = 10;
  const w = 360; const h = 140;
  const pts = data.map((v, i) => ({ x: (i / 11) * w, y: h - (v / max) * h }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const area = `${line} L ${pts[pts.length - 1].x} ${h} L 0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-28" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#chartGrad)" />
      <path d={line} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3" fill="#3b82f6" />)}
    </svg>
  );
}

// ─── Right Detail Panel ───────────────────────────────────────────────────────
function ContractPanel({ contract, onClose, readOnly = false }: { contract: Contract; onClose: () => void; readOnly?: boolean }) {
  const [tab, setTab] = useState<"Details" | "Documents" | "Performance" | "History">("Details");
  const TABS = ["Details", "Documents (6)", "Performance", "History"] as const;

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200 w-[380px] flex-shrink-0">
      {/* Header */}
      <div className="px-5 pt-4 pb-0 border-b border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 text-base">{contract.id}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[contract.status]}`}>{contract.status}</span>
            {readOnly && <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-500">Read Only</span>}
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-3">{contract.name}</p>
        <div className="flex gap-0">
          {TABS.map((t) => {
            const label = t.replace(" (6)", "");
            const active = tab === label;
            return (
              <button key={t} onClick={() => setTab(label as typeof tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${active ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {tab === "Details" && (
          <>
            {/* Contract Information */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-800">Contract Information</h3>
                {!readOnly && <button className="text-xs text-blue-600 border border-blue-200 px-2 py-0.5 rounded hover:bg-blue-50 transition-colors">Edit</button>}
              </div>
              <div className="space-y-2.5">
                {[
                  { label: "Contract Type", value: contract.type },
                  { label: "Start Date", value: contract.startDate },
                  { label: "End Date", value: contract.endDate },
                  { label: "Contract Value", value: contract.value },
                  { label: "Payment Terms", value: contract.paymentTerms },
                  { label: "Auto Renewal", value: contract.autoRenewal ? "Enabled" : "Disabled", green: contract.autoRenewal },
                  { label: "Renewal Reminder", value: contract.renewalReminder },
                  ...(contract.expiryIn ? [{ label: "Expiry In", value: contract.expiryIn, blue: true }] : []),
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{row.label}</span>
                    <span className={`text-xs font-semibold ${(row as any).green ? "text-green-600" : (row as any).blue ? "text-blue-600" : "text-gray-800"}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Key Contacts */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-800">Key Contacts</h3>
                {!readOnly && <button className="text-xs text-blue-600 border border-blue-200 px-2 py-0.5 rounded hover:bg-blue-50 transition-colors">Edit</button>}
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Contract Owner</p>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span className="text-xs font-semibold text-gray-700">{contract.contacts.owner}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Vendor Contact</p>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">{contract.contacts.vendor}</p>
                      <p className="text-xs text-gray-400">{contract.contacts.vendorPhone}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Procurement Head</p>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">{contract.contacts.procurement}</p>
                      <p className="text-xs text-gray-400">{contract.contacts.procurementPhone}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Contract Terms Summary */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-800">Contract Terms (Summary)</h3>
                <button className="text-xs text-blue-600 hover:underline">View All</button>
              </div>
              <div className="space-y-2">
                {[
                  { label: "Price Validity", value: contract.terms.priceValidity },
                  { label: "Delivery Term", value: contract.terms.deliveryTerm },
                  { label: "Warranty Period", value: contract.terms.warrantyPeriod },
                  { label: "SLA Uptime", value: contract.terms.slaUptime },
                  { label: "Penalty Clause", value: contract.terms.penaltyClause },
                  { label: "Governing Law", value: contract.terms.governingLaw },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    <span className="text-xs text-gray-500 flex-1">{row.label}</span>
                    <span className="text-xs font-semibold text-gray-700">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {!readOnly && (
              <button className="w-full mt-2 flex items-center justify-center gap-2 py-2 border border-blue-200 rounded-lg text-blue-600 text-sm font-medium hover:bg-blue-50 transition-colors">
                <FileText className="w-4 h-4" /> View Full Contract
              </button>
            )}
          </>
        )}

        {tab === "Documents" && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 font-medium">6 Documents attached</p>
            {["IT Hardware Supply Agreement v2.pdf", "Annexure A - Pricing Schedule.xlsx", "Annexure B - SLA Terms.pdf", "NDA Signed Copy.pdf", "Purchase Order Copy.pdf", "Vendor Compliance Certificate.pdf"].map((doc) => (
              <div key={doc} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="w-8 h-8 bg-red-50 rounded-md flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{doc}</p>
                  <p className="text-xs text-gray-400">Added Jan 01, 2025</p>
                </div>
                <Download className="w-4 h-4 text-gray-400 hover:text-blue-600 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}

        {tab === "Performance" && (
          <div className="space-y-4">
            <p className="text-sm font-bold text-gray-800">Contract Performance (This Year)</p>
            {[
              { label: "Spend vs Contract Value", sub: "₹6.25 Cr / ₹8.00 Cr", value: 78.2, color: "bg-blue-500" },
              { label: "SLA Compliance", sub: "Target 90%", value: 94.2, color: "bg-green-500" },
              { label: "On-time Delivery", sub: "Target 90%", value: 92.1, color: "bg-green-500" },
              { label: "Invoice Compliance", sub: "Target 95%", value: 98.7, color: "bg-blue-500" },
            ].map((m) => (
              <div key={m.label}>
                <div className="flex justify-between mb-1">
                  <div>
                    <p className="text-xs font-medium text-gray-700">{m.label}</p>
                    <p className="text-xs text-gray-400">{m.sub}</p>
                  </div>
                </div>
                <ProgressBar value={m.value} color={m.color} />
              </div>
            ))}
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500">Savings Generated</p>
              <p className="text-sm font-bold text-green-600">₹42.35 L <span className="text-xs text-gray-400 font-normal">This Year</span></p>
            </div>
          </div>
        )}

        {tab === "History" && (
          <div className="space-y-4">
            <p className="text-sm font-bold text-gray-800">Activity History</p>
            {[
              { date: "May 16, 2026", action: "Contract reviewed by Pavan", type: "review" },
              { date: "Jan 01, 2025", action: "Contract activated", type: "activate" },
              { date: "Dec 20, 2024", action: "Contract signed by vendor", type: "sign" },
              { date: "Dec 10, 2024", action: "Contract drafted and sent for approval", type: "draft" },
              { date: "Dec 01, 2024", action: "Contract initiated by Sneha Iyer", type: "init" },
            ].map((h, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
                  {i < 4 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                </div>
                <div className="pb-3">
                  <p className="text-xs font-medium text-gray-700">{h.action}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{h.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Add Contract Modal ───────────────────────────────────────────────────────
function AddContractModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: "", type: "Supply Agreement", startDate: "", endDate: "",
    value: "", paymentTerms: "Net 30", autoRenewal: false,
    renewalReminder: "30 Days Before Expiry",
    ownerName: "", vendorContact: "", vendorPhone: "", procurementHead: "", procurementPhone: "",
    priceValidity: "", deliveryTerm: "", warrantyPeriod: "", slaUptime: "", penaltyClause: "Applicable", governingLaw: "",
    notes: "",
  });
  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Add New Contract</h2>
            <p className="text-xs text-gray-500">Fill in the details to create a new contract</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Contract Details */}
          <section>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-500" /> Contract Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Contract Name *</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. IT Hardware Supply Agreement 2026" value={form.name} onChange={(e) => set("name", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Contract Type *</label>
                <div className="relative">
                  <select className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8" value={form.type} onChange={(e) => set("type", e.target.value)}>
                    {["Supply Agreement", "SLA", "NDA", "AMC", "Framework"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Payment Terms *</label>
                <div className="relative">
                  <select className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8" value={form.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)}>
                    {["Net 30", "Net 45", "Net 60", "Immediate", "Advance"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Date *</label>
                <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">End Date *</label>
                <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Contract Value (₹) *</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 8,00,00,000" value={form.value} onChange={(e) => set("value", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Renewal Reminder</label>
                <div className="relative">
                  <select className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8" value={form.renewalReminder} onChange={(e) => set("renewalReminder", e.target.value)}>
                    {["30 Days Before Expiry", "60 Days Before Expiry", "90 Days Before Expiry"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <button type="button" onClick={() => set("autoRenewal", !form.autoRenewal)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${form.autoRenewal ? "bg-blue-600" : "bg-gray-200"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.autoRenewal ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
                <label className="text-sm text-gray-700 font-medium">Enable Auto Renewal</label>
              </div>
            </div>
          </section>

          {/* Key Contacts */}
          <section>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><User className="w-4 h-4 text-green-500" /> Key Contacts</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Contract Owner</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Pavan (System Owner)" value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Vendor Contact Name</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Full name" value={form.vendorContact} onChange={(e) => set("vendorContact", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Vendor Contact Phone</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="+91 XXXXX XXXXX" value={form.vendorPhone} onChange={(e) => set("vendorPhone", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Procurement Head</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Full name" value={form.procurementHead} onChange={(e) => set("procurementHead", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Procurement Head Phone</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="+91 XXXXX XXXXX" value={form.procurementPhone} onChange={(e) => set("procurementPhone", e.target.value)} />
              </div>
            </div>
          </section>

          {/* Contract Terms */}
          <section>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Check className="w-4 h-4 text-purple-500" /> Contract Terms</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Price Validity</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Till Dec 31, 2026" value={form.priceValidity} onChange={(e) => set("priceValidity", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Delivery Term</label>
                <div className="relative">
                  <select className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8" value={form.deliveryTerm} onChange={(e) => set("deliveryTerm", e.target.value)}>
                    {["FOB - Destination", "Ex-Works", "CIF", "DDP", "Onsite", "N/A"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Warranty Period</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 3 Years Onsite" value={form.warrantyPeriod} onChange={(e) => set("warrantyPeriod", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">SLA Uptime</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 99.5%" value={form.slaUptime} onChange={(e) => set("slaUptime", e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Penalty Clause</label>
                <div className="relative">
                  <select className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8" value={form.penaltyClause} onChange={(e) => set("penaltyClause", e.target.value)}>
                    {["Applicable", "Not Applicable"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Governing Law</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Karnataka, India" value={form.governingLaw} onChange={(e) => set("governingLaw", e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Additional Notes</label>
                <textarea rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Any additional contract notes..." value={form.notes} onChange={(e) => set("notes", e.target.value)} />
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm">Save Contract</button>
        </div>
      </div>
    </div>
  );
}

// ─── Archived Contracts Modal ─────────────────────────────────────────────────
function ArchivedContractsModal({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<Contract | null>(null);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-gray-500" />
            <div>
              <h2 className="text-base font-bold text-gray-900">Archived Contracts</h2>
              <p className="text-xs text-gray-500">Read-only view of archived contracts</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex flex-1 overflow-hidden">
          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-sm border-b border-gray-100">
                <tr>
                  {["Contract ID", "Contract Name", "Type", "Start Date", "End Date", "Value", "Status"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ARCHIVED_CONTRACTS.map((c) => (
                  <tr key={c.id} onClick={() => setSelected(c)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap"><span className="text-blue-600 font-semibold text-sm">{c.id}</span></td>
                    <td className="px-4 py-3 text-gray-700 text-sm">{c.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${TYPE_STYLES[c.type]}`}>{c.type}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-sm">{c.startDate}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-sm">{c.endDate}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-700 text-sm">{c.value}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLES[c.status]}`}>{c.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Side panel for archived */}
          {selected && (
            <div className="w-[360px] flex-shrink-0 border-l border-gray-200 overflow-hidden flex flex-col">
              <ContractPanel contract={selected} onClose={() => setSelected(null)} readOnly />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  return { open, setOpen, ref };
}

export default function ContractsPage() {
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [openRowMenu, setOpenRowMenu] = useState<string | null>(null);
  const [showAddContract, setShowAddContract] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const topMenu = useDropdown();

  const stats = [
    { icon: <FileText className="w-5 h-5 text-blue-500" />, bg: "bg-blue-50", label: "Total Contracts", value: "3", sub: "All Time" },
    { icon: <CheckCircle className="w-5 h-5 text-green-500" />, bg: "bg-green-50", label: "Active Contracts", value: "2", sub: "Currently Active" },
    { icon: <Clock className="w-5 h-5 text-orange-400" />, bg: "bg-orange-50", label: "Expiring in 30 Days", value: "0", sub: "No Contracts" },
    { icon: <IndianRupee className="w-5 h-5 text-purple-500" />, bg: "bg-purple-50", label: "Contract Value", value: "₹12,80,00,000", sub: "Total Value" },
    { icon: <RefreshCcw className="w-5 h-5 text-blue-400" />, bg: "bg-blue-50", label: "Renewal Rate", value: "100%", sub: "On-time Renewals" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans" onClick={() => setOpenRowMenu(null)}>
      <div className="flex min-h-screen">
        {/* Backdrop for mobile when panel is open */}
        {selectedContract && (
          <div className="fixed inset-0 bg-black/20 z-20 lg:hidden" onClick={() => setSelectedContract(null)} />
        )}

        {/* Main content — always full width; shifts right only on lg+ when panel open */}
        <div className={`flex-1 min-w-0 overflow-y-auto transition-all duration-300`}>
          <div className="w-full px-4 sm:px-6 py-6 space-y-4">

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {stats.map((s) => (
                <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>{s.icon}</div>
                  <p className="text-xs text-gray-500 font-medium mb-1">{s.label}</p>
                  <p className="text-lg font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Filters + Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              {/* Filter row */}
              <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-end gap-4">
                {[
                  { label: "Status", options: ["All Status", "Active", "Expired", "Expiring Soon"] },
                  { label: "Contract Type", options: ["All Types", "Supply Agreement", "SLA", "NDA", "AMC", "Framework"] },
                  { label: "Date Range", options: ["All Time", "This Year", "Last Year", "Custom"] },
                ].map((f) => (
                  <div key={f.label} className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 font-medium">{f.label}</label>
                    <div className="relative">
                      <select className="appearance-none border border-gray-200 rounded-lg bg-white text-sm px-3 py-2 pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[130px]">
                        {f.options.map((o) => <option key={o}>{o}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                ))}

                {/* Top-right 3-dot menu */}
                <div className="ml-auto relative" ref={topMenu.ref}>
                  <button onClick={() => topMenu.setOpen((o) => !o)} className="p-2 border border-gray-200 rounded-md text-gray-500 hover:bg-gray-50 transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {topMenu.open && (
                    <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                      <button onClick={() => { setShowAddContract(true); topMenu.setOpen(false); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
                        <Plus className="w-4 h-4 text-gray-400" /> Add Contract
                      </button>
                      <button onClick={() => topMenu.setOpen(false)} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
                        <Download className="w-4 h-4 text-gray-400" /> Export Contracts
                      </button>
                      <div className="my-1 border-t border-gray-100" />
                      <button onClick={() => { setShowArchived(true); topMenu.setOpen(false); }} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
                        <Archive className="w-4 h-4 text-gray-400" /> Archived Contracts
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      {["Contract ID", "Contract Name", "Contract Type", "Start Date", "End Date", "Contract Value", "Payment Terms", "Status", "Actions"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-sm font-bold text-gray-700 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {CONTRACTS.map((c) => (
                      <tr key={c.id} className={`hover:bg-gray-50/70 transition-colors cursor-pointer ${selectedContract?.id === c.id ? "bg-blue-50/40" : ""}`}
                        onClick={() => setSelectedContract(selectedContract?.id === c.id ? null : c)}>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="text-blue-600 font-semibold text-sm hover:underline">{c.id}</span>
                        </td>
                        <td className="px-4 py-3.5 max-w-[200px]">
                          <span className="text-gray-800 text-sm font-medium">{c.name}</span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${TYPE_STYLES[c.type]}`}>{c.type}</span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-gray-600 text-sm">{c.startDate}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-gray-600 text-sm">{c.endDate}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-semibold text-gray-800 text-sm">{c.value}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-gray-600 text-sm">{c.paymentTerms}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${STATUS_STYLES[c.status]}`}>{c.status}</span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setSelectedContract(selectedContract?.id === c.id ? null : c)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                            <div className="relative">
                              <button onClick={(e) => { e.stopPropagation(); setOpenRowMenu(openRowMenu === c.id ? null : c.id); }}
                                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {openRowMenu === c.id && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                                  <button onClick={() => setOpenRowMenu(null)} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
                                    <Pencil className="w-4 h-4 text-gray-400" /> Edit Contract
                                  </button>
                                  <button onClick={() => setOpenRowMenu(null)} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
                                    <Download className="w-4 h-4 text-gray-400" /> Export Contract
                                  </button>
                                  <button onClick={() => setOpenRowMenu(null)} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
                                    <FolderOpen className="w-4 h-4 text-gray-400" /> View Documents
                                  </button>
                                  <div className="my-1 border-t border-gray-100" />
                                  <button onClick={() => setOpenRowMenu(null)} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-orange-600 hover:bg-orange-50 transition-colors text-left">
                                    <Archive className="w-4 h-4 text-orange-400" /> Archive Contract
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100">
                <span className="text-sm text-gray-500">Showing 1 to 3 of 3 contracts</span>
                <div className="flex items-center gap-1.5">
                  <button className="p-1.5 rounded-md border border-gray-200 text-gray-400 hover:bg-gray-50 opacity-40 cursor-not-allowed transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                  <button className="w-8 h-8 rounded-md text-sm font-medium bg-blue-600 text-white">1</button>
                  <button className="p-1.5 rounded-md border border-gray-200 text-gray-400 hover:bg-gray-50 opacity-40 cursor-not-allowed transition-colors"><ChevronRight className="w-4 h-4" /></button>
                  <div className="ml-2 flex items-center gap-1 text-sm text-gray-500 border border-gray-200 rounded-md px-2.5 py-1.5">10 / page <ChevronDown className="w-3.5 h-3.5 text-gray-400" /></div>
                </div>
              </div>
            </div>

            {/* Bottom Performance Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Contract Performance */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-bold text-gray-800">Contract Performance <span className="text-xs font-normal text-gray-400">(This Year)</span></p>
                  <button className="text-xs text-blue-600 hover:underline">View Details</button>
                </div>
                <div className="space-y-4">
                  {[
                    { label: "Spend vs Contract Value", sub: "₹6.25 Cr / ₹8.00 Cr", value: 78.2, color: "bg-blue-500" },
                    { label: "SLA Compliance", sub: "Target 90%", value: 94.2, color: "bg-green-500" },
                    { label: "On-time Delivery", sub: "Target 90%", value: 92.1, color: "bg-green-500" },
                    { label: "Invoice Compliance", sub: "Target 95%", value: 98.7, color: "bg-blue-500" },
                  ].map((m) => (
                    <div key={m.label}>
                      <div className="flex justify-between mb-1">
                        <div><p className="text-xs font-medium text-gray-700">{m.label}</p><p className="text-xs text-gray-400">{m.sub}</p></div>
                      </div>
                      <ProgressBar value={m.value} color={m.color} />
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500">Savings Generated</p>
                    <p className="text-sm font-bold text-green-600">₹42.35 L <span className="text-xs font-normal text-gray-400">This Year</span></p>
                  </div>
                </div>
              </div>

              {/* Contract Value Over Time */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-gray-800">Contract Value Over Time</p>
                  <div className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 rounded px-2 py-1 cursor-pointer hover:bg-gray-50">
                    This Year <ChevronDown className="w-3 h-3" />
                  </div>
                </div>
                <LineChart />
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-blue-500 rounded" /><span className="text-xs text-gray-500">Cumulative Spend</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 border-t border-dashed border-gray-400" /><span className="text-xs text-gray-500">Contract Value</span></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-300 px-1">
                  {["Jan","Mar","May","Jul","Sep","Nov"].map((m) => <span key={m}>{m}</span>)}
                </div>
              </div>

              {/* Upcoming Renewals */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-gray-800">Upcoming Renewals</p>
                  <button className="text-xs text-blue-600 hover:underline">View All</button>
                </div>
                <div className="flex flex-col items-center justify-center flex-1 py-8 text-center">
                  <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-3 border border-gray-100">
                    <Calendar className="w-7 h-7 text-gray-300" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">No contracts expiring soon</p>
                  <p className="text-xs text-gray-400 mt-1">All active contracts are valid beyond 30 days.</p>
                </div>
                <button className="w-full mt-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  View All Contracts
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel — fixed overlay, full-height, responsive width */}
        {selectedContract && (
          <div className="fixed top-0 right-0 h-screen w-full sm:w-[400px] z-30 flex flex-col bg-white shadow-2xl border-l border-gray-200 overflow-hidden">
            <ContractPanel contract={selectedContract} onClose={() => setSelectedContract(null)} />
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddContract && <AddContractModal onClose={() => setShowAddContract(false)} />}
      {showArchived && <ArchivedContractsModal onClose={() => setShowArchived(false)} />}
    </div>
  );
}
