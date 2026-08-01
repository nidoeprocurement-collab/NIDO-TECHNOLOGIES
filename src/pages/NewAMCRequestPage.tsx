import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, CalendarDays, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { addServiceRequest } from "@/lib/serviceRequestsStore";

// ─── Static options ────────────────────────────────────────────────────────────
const CLIENTS   = ["Apex Tech Solutions", "Global Systems Ltd", "TechCorp Pvt Ltd", "Sunrise Enterprises"];
const LOCATIONS = ["Bangalore - Main Office", "Pune - Branch Office", "Hyderabad - Branch", "Chennai - Branch", "Mumbai - Office"];
const REQUEST_TYPES = ["AMC Service"];

const CATEGORIES: Record<string, string[]> = {
  Laptops:     ["Dell", "HP", "Lenovo", "Apple", "Asus"],
  Desktops:    ["Dell", "HP", "Lenovo", "Acer"],
  Servers:     ["Dell", "HP", "IBM", "Cisco"],
  Networking:  ["Cisco", "D-Link", "TP-Link", "Netgear"],
  Printers:    ["HP", "Canon", "Epson", "Brother"],
  UPS:         ["APC", "Emerson", "Luminous"],
  Phones:      ["Cisco", "Panasonic", "Polycom"],
  Other:       ["Other"],
};

const MODELS: Record<string, Record<string, string[]>> = {
  Laptops: {
    Dell:   ["Latitude 5420", "Latitude 7420", "Inspiron 15", "XPS 13"],
    HP:     ["EliteBook 840", "ProBook 450", "Pavilion 15"],
    Lenovo: ["ThinkPad E14", "IdeaPad 3", "ThinkPad X1 Carbon"],
    Apple:  ["MacBook Air M2", "MacBook Pro 14", "MacBook Pro 16"],
    Asus:   ["ZenBook 14", "VivoBook 15"],
  },
  Servers: {
    Dell:  ["PowerEdge R440", "PowerEdge R640", "PowerEdge T40"],
    HP:    ["ProLiant DL360", "ProLiant DL380"],
    IBM:   ["System x3650"],
    Cisco: ["UCS C220", "UCS C240"],
  },
  Networking: {
    Cisco:   ["Catalyst 2960-X", "Catalyst 9200", "ASA 5506"],
    "D-Link":["DGS-1210", "DES-1210"],
  },
  UPS: {
    APC:     ["Smart-UPS 1500VA", "Back-UPS 650VA", "Smart-UPS 3000VA"],
    Emerson: ["Liebert PS 1000"],
    Luminous:["Cruze 1 KVA"],
  },
  Phones: {
    Cisco:     ["IP Phone 7945", "IP Phone 8851", "IP Phone 7821"],
    Panasonic: ["KX-NT553", "KX-NT343"],
  },
};

const AMC_PERIODS = ["6 Months", "1 Year", "2 Years", "3 Years"];
const FREQUENCIES = ["Monthly", "Quarterly", "Half-Yearly", "Annually"];
const PRIORITIES  = ["Low", "Medium", "High"];

const VISITS_PER_PERIOD: Record<string, Record<string, number>> = {
  "6 Months": { Monthly: 6,  Quarterly: 2,  "Half-Yearly": 1, Annually: 0 },
  "1 Year":   { Monthly: 12, Quarterly: 4,  "Half-Yearly": 2, Annually: 1 },
  "2 Years":  { Monthly: 24, Quarterly: 8,  "Half-Yearly": 4, Annually: 2 },
  "3 Years":  { Monthly: 36, Quarterly: 12, "Half-Yearly": 6, Annually: 3 },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}
function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}
function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function isoToInput(iso: string): string { return iso; }

interface SelectFieldProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
}
function SelectField({ label, required, value, onChange, options, placeholder = `Select ${label}`, disabled }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-400 cursor-pointer transition-colors hover:border-gray-400"
        >
          <option value="">{placeholder}</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <svg className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </div>
    </div>
  );
}

interface TextFieldProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}
function TextField({ label, required, value, onChange, placeholder, type = "text" }: TextFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors hover:border-gray-400"
      />
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function NewAMCRequestPage() {
  const navigate = useNavigate();

  // Request Details
  const [client,      setClient]      = useState("Apex Tech Solutions");
  const [location,    setLocation]    = useState("Bangalore - Main Office");
  const [requestType, setRequestType] = useState("AMC Service");

  // Equipment Details
  const [category,     setCategory]     = useState("");
  const [brand,        setBrand]        = useState("");
  const [model,        setModel]        = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [assetTag,     setAssetTag]     = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");

  // AMC Plan
  const [amcPeriod,   setAmcPeriod]   = useState("1 Year");
  const [startDate,   setStartDate]   = useState("");
  const [endDate,     setEndDate]     = useState("");
  const [visitFreq,   setVisitFreq]   = useState("Monthly");

  // Issue / Visit Details
  const [issueSubject, setIssueSubject] = useState("");
  const [priority,     setPriority]     = useState("Medium");
  const [issueDesc,    setIssueDesc]    = useState("");
  const [prefDate,     setPrefDate]     = useState("");

  const [submitting, setSubmitting] = useState(false);

  // ── Auto-fill end date when start date or period changes ──
  useEffect(() => {
    if (!startDate) { setEndDate(""); return; }
    const d = new Date(startDate);
    let end: Date;
    switch (amcPeriod) {
      case "6 Months": end = addMonths(d, 6);  break;
      case "1 Year":   end = addYears(d, 1);   break;
      case "2 Years":  end = addYears(d, 2);   break;
      case "3 Years":  end = addYears(d, 3);   break;
      default:         end = addYears(d, 1);
    }
    setEndDate(end.toISOString().slice(0, 10));
  }, [startDate, amcPeriod]);

  // ── Reset brand/model when category changes ──
  useEffect(() => { setBrand(""); setModel(""); }, [category]);
  useEffect(() => { setModel(""); }, [brand]);

  // ── Computed AMC info ──
  const totalVisits  = VISITS_PER_PERIOD[amcPeriod]?.[visitFreq] ?? 0;
  const nextTicketOn = startDate
    ? fmtDate(addDays(new Date(startDate), 31))
    : "23 Aug 2026";
  const freqLabel = visitFreq === "Monthly" ? "1 Month"
    : visitFreq === "Quarterly" ? "3 Months"
    : visitFreq === "Half-Yearly" ? "6 Months"
    : "1 Year";

  const availableBrands = category ? (CATEGORIES[category] ?? []) : [];
  const availableModels = category && brand ? (MODELS[category]?.[brand] ?? []) : [];

  // ── Validate & Submit ──
  const handleSubmit = () => {
    if (!client || !location || !requestType) { toast.error("Please fill in all required Request Details."); return; }
    if (!category || !brand || !model)        { toast.error("Please fill in all required Equipment Details."); return; }
    if (!amcPeriod || !startDate || !endDate || !visitFreq) { toast.error("Please fill in all AMC Plan fields."); return; }
    if (!issueSubject || !issueDesc || !priority) { toast.error("Please fill in all Issue / Visit Details."); return; }

    setSubmitting(true);
    try {
      const assetLabel = `${brand} ${model}`;
      addServiceRequest({
        requestType: "AMC",
        itemAsset: assetLabel,
        assetTag: assetTag || "",
        location,
        requestDate: "",       // filled in by store
        status: "Scheduled",
        priority: priority as "Low" | "Medium" | "High",
        nextAppointment: prefDate ? new Date(prefDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) + "\n10:00 AM" : "-",
        requestedBy: "Ramesh K.",
        payload: {
          client, location, requestType: "AMC", category, brand, model,
          serialNumber, assetTag, purchaseDate,
          amcPeriod, startDate, endDate, visitFreq, totalVisits,
          issueSubject, priority, issueDesc, prefDate,
        },
      }, "AMC");

      toast.success("AMC request submitted successfully!");
      setTimeout(() => navigate("/my-services"), 800);
    } catch (e) {
      toast.error("Failed to submit request. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Page Header ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AMC (Annual Maintenance Contract)</h1>
            <p className="text-sm text-gray-500 mt-0.5">Raise a new AMC service request</p>
          </div>
          <button
            onClick={() => navigate("/my-services")}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-700 transition-colors flex-shrink-0"
          >
            <ListChecks className="w-4 h-4" /> View My AMC Requests
          </button>
        </div>
      </div>

      <div className="px-6 py-6 max-w-6xl mx-auto space-y-6">

        {/* ── Request Details ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-bold text-gray-800 mb-5">Request Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <SelectField label="Client"       required value={client}      onChange={setClient}      options={CLIENTS} />
            <SelectField label="Location"     required value={location}    onChange={setLocation}    options={LOCATIONS} />
            <SelectField label="Request Type" required value={requestType} onChange={setRequestType} options={REQUEST_TYPES} />
          </div>
        </div>

        {/* ── Equipment Details ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-bold text-gray-800 mb-5">Equipment Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <SelectField
              label="Category" required value={category} onChange={setCategory}
              options={Object.keys(CATEGORIES)} placeholder="Select Category"
            />
            <SelectField
              label="Brand" required value={brand} onChange={setBrand}
              options={availableBrands} placeholder="Select Brand"
              disabled={!category}
            />
            <SelectField
              label="Model" required value={model} onChange={setModel}
              options={availableModels} placeholder="Select Model"
              disabled={!brand}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
            <TextField
              label="Serial Number"
              value={serialNumber} onChange={setSerialNumber}
              placeholder="Enter Serial Number"
            />
            <TextField
              label="Asset Tag (Optional)"
              value={assetTag} onChange={setAssetTag}
              placeholder="Enter Asset Tag"
            />
            <TextField
              label="Purchase Date (Optional)"
              type="date" value={purchaseDate} onChange={setPurchaseDate}
            />
          </div>
        </div>

        {/* ── AMC Plan & Recurring Schedule ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-bold text-gray-800 mb-5">AMC Plan &amp; Recurring Schedule</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <SelectField label="AMC Period" required value={amcPeriod} onChange={setAmcPeriod} options={AMC_PERIODS} />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Start Date <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type="date"
                  value={isoToInput(startDate)}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors hover:border-gray-400"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">End Date <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type="date"
                  value={isoToInput(endDate)}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors hover:border-gray-400"
                />
              </div>
            </div>
            <SelectField label="Visit Frequency" required value={visitFreq} onChange={setVisitFreq} options={FREQUENCIES} />
          </div>

          {/* Info box */}
          <div className="mt-5 flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <CalendarDays className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">
                Auto ticket will be created every {freqLabel}
              </p>
              <p className="text-xs text-blue-600 mt-0.5">
                Total visits: {totalVisits} &nbsp;•&nbsp; Next ticket on: {nextTicketOn}
              </p>
            </div>
          </div>
        </div>

        {/* ── Issue / Visit Details ── */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-bold text-gray-800 mb-5">Issue / Visit Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <TextField
              label="Issue Subject" required
              value={issueSubject} onChange={setIssueSubject}
              placeholder="Brief description of the issue"
            />
            <SelectField label="Priority" required value={priority} onChange={setPriority} options={PRIORITIES} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
            {/* Issue Description */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Issue Description <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <textarea
                  value={issueDesc}
                  onChange={e => setIssueDesc(e.target.value.slice(0, 1000))}
                  placeholder="Please provide detailed information about the issue..."
                  rows={5}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors hover:border-gray-400"
                />
                <span className="absolute bottom-2 right-3 text-xs text-gray-400">{issueDesc.length} / 1000</span>
              </div>
            </div>

            {/* Preferred Appointment Date */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Preferred Appointment Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={prefDate}
                  onChange={e => setPrefDate(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors hover:border-gray-400"
                />
                <Calendar className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="flex justify-end gap-3 pb-8">
          <button
            onClick={() => navigate("/services")}
            className="px-6 py-2.5 text-sm font-medium border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Submitting…" : "Submit Request"}
          </button>
        </div>

      </div>
    </div>
  );
}
