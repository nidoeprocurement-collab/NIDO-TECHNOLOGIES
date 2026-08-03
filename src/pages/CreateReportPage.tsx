import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageMeta } from "@/contexts/PageMetaContext";
import { nanoid } from "nanoid";
import {
  saveCustomReport,
  generateReportId,
  type ReportFormat,
  type ReportFrequency,
} from "@/lib/reportStore";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Search,
  ArrowRight,
  ArrowLeft,
  X,
  BarChart2,
  Table2,
  TrendingUp,
  LayoutGrid,
  FileText,
  Wrench,
  Users,
  Building2,
  Package,
  ShoppingCart,
  Layers,
  HeadphonesIcon,
  Clock,
  CalendarDays,
  CalendarRange,
  CalendarCheck,
  Calendar,
} from "lucide-react";

// ── Constants ──────────────────────────────────────────────────────────────────

const REPORT_TYPES = [
  { value: "Summary Report", desc: "Summarized data with key metrics", icon: <BarChart2 className="w-4 h-4 text-blue-500" /> },
  { value: "Detailed Report", desc: "Detailed row-level data", icon: <FileText className="w-4 h-4 text-indigo-500" /> },
  { value: "Tabular Report", desc: "Display data in table format", icon: <Table2 className="w-4 h-4 text-purple-500" /> },
  { value: "Pivot Report", desc: "Analyze data in pivot table format", icon: <LayoutGrid className="w-4 h-4 text-pink-500" /> },
  { value: "Trend Report", desc: "Track data trends over time", icon: <TrendingUp className="w-4 h-4 text-emerald-500" /> },
  { value: "Custom Report", desc: "Build a report from scratch", icon: <Wrench className="w-4 h-4 text-orange-500" /> },
];

const MODULES = [
  { value: "All Modules", desc: "Include data from all modules", icon: <Layers className="w-4 h-4 text-blue-500" /> },
  { value: "Clients", desc: "Client and related data", icon: <Users className="w-4 h-4 text-emerald-500" /> },
  { value: "Vendors", desc: "Vendor and related data", icon: <Building2 className="w-4 h-4 text-purple-500" /> },
  { value: "Catalog", desc: "All catalog data", icon: <Package className="w-4 h-4 text-orange-500" /> },
  { value: "Orders", desc: "Order and related data", icon: <ShoppingCart className="w-4 h-4 text-blue-600" /> },
  { value: "Services", desc: "Services and requests data", icon: <Wrench className="w-4 h-4 text-pink-500" /> },
  { value: "Support Tickets", desc: "Support tickets and resolutions", icon: <HeadphonesIcon className="w-4 h-4 text-red-500" /> },
];

const FIELDS_BY_MODULE: Record<string, { group: string; fields: string[] }[]> = {
  "All Modules": [
    { group: "COMMON", fields: ["ID", "Created On", "Created By"] },
    { group: "CLIENTS", fields: ["Client Name", "Client Email", "Client Phone", "Client City", "Client Status"] },
    { group: "VENDORS", fields: ["Vendor Name", "Vendor Email", "Vendor Category"] },
    { group: "ORDERS", fields: ["Order ID", "Order Date", "Order Status", "Amount"] },
    { group: "CATALOG", fields: ["Item Name", "SKU", "Category", "Price"] },
    { group: "SERVICES", fields: ["Service Name", "Request Date", "Status"] },
    { group: "SUPPORT", fields: ["Ticket ID", "Subject", "Priority", "Resolution Date"] },
  ],
  Clients: [
    { group: "CLIENTS", fields: ["ID", "Created On", "Created By", "Client Name", "Client Email", "Client Phone", "Client City", "Client Status", "Client Tier", "Contract Start", "Contract End"] },
  ],
  Vendors: [
    { group: "VENDORS", fields: ["ID", "Created On", "Created By", "Vendor Name", "Vendor Email", "Vendor Phone", "Vendor Category", "Vendor Status", "Rating"] },
  ],
  Catalog: [
    { group: "CATALOG", fields: ["ID", "Created On", "Item Name", "SKU", "Category", "Price", "Stock", "Unit"] },
  ],
  Orders: [
    { group: "ORDERS", fields: ["ID", "Created On", "Created By", "Order ID", "Order Date", "Order Status", "Client Name", "Vendor Name", "Amount", "Tax", "Total"] },
  ],
  Services: [
    { group: "SERVICES", fields: ["ID", "Created On", "Service Name", "Request Date", "Client Name", "Status", "Priority", "Assigned To"] },
  ],
  "Support Tickets": [
    { group: "SUPPORT", fields: ["ID", "Created On", "Ticket ID", "Subject", "Client Name", "Priority", "Status", "Resolution Date", "Agent"] },
  ],
};

const TIMEZONES = ["(IST) Asia/Kolkata", "(UTC) Universal", "(EST) America/New_York", "(PST) America/Los_Angeles", "(GMT) Europe/London", "(CST) Asia/Shanghai"];

const FREQUENCIES: { value: ReportFrequency; desc: string; icon: React.ReactNode }[] = [
  { value: "One Time", desc: "Run once on selected date", icon: <CalendarCheck className="w-4 h-4 text-blue-500" /> },
  { value: "Daily", desc: "Run report every day", icon: <CalendarDays className="w-4 h-4 text-indigo-500" /> },
  { value: "Weekly", desc: "Run report every week", icon: <CalendarRange className="w-4 h-4 text-purple-500" /> },
  { value: "Monthly", desc: "Run report every month", icon: <Calendar className="w-4 h-4 text-pink-500" /> },
  { value: "Quarterly", desc: "Run report every quarter", icon: <Clock className="w-4 h-4 text-orange-500" /> },
];

const FORMATS: { value: ReportFormat; label: string }[] = [
  { value: "Excel", label: "Excel (.xlsx)" },
  { value: "CSV", label: "CSV (.csv)" },
  { value: "PDF", label: "PDF (.pdf)" },
];

const FILTER_OPERATORS = ["equals", "not equals", "contains", "greater than", "less than", "is empty", "is not empty"];

type ReportFrequency = "One Time" | "Daily" | "Weekly" | "Monthly" | "Quarterly";

// ── Custom Dropdown ────────────────────────────────────────────────────────────

function SelectDropdown<T extends string>({
  value,
  placeholder,
  options,
  onChange,
  renderOption,
  renderValue,
  className = "",
}: {
  value: T | "";
  placeholder: string;
  options: { value: T; label?: string; desc?: string; icon?: React.ReactNode }[];
  onChange: (v: T) => void;
  renderOption?: (opt: { value: T; label?: string; desc?: string; icon?: React.ReactNode }) => React.ReactNode;
  renderValue?: (v: T) => React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      >
        <span className={selected ? "text-gray-900 flex items-center gap-2" : "text-gray-400"}>
          {selected
            ? renderValue
              ? renderValue(value as T)
              : (selected.label ?? selected.value)
            : placeholder}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-full bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-1 max-h-72 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-blue-50 transition-colors ${value === opt.value ? "bg-blue-50" : ""}`}
            >
              {renderOption ? (
                renderOption(opt)
              ) : (
                <span className="flex items-center gap-2 text-sm text-gray-800">
                  {opt.icon}
                  <span>
                    <span className={`font-medium ${value === opt.value ? "text-blue-700" : ""}`}>{opt.label ?? opt.value}</span>
                    {opt.desc && <span className="block text-xs text-gray-400">{opt.desc}</span>}
                  </span>
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Section Badge ──────────────────────────────────────────────────────────────

function SectionBadge({ n }: { n: number }) {
  return (
    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
      {n}
    </span>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function CreateReportPage() {
  usePageMeta({ title: "Create Report" });
  const navigate = useNavigate();

  // ── Form state ──
  const [reportName, setReportName] = useState("");
  const [description, setDescription] = useState("");
  const [reportType, setReportType] = useState("");
  const [module, setModule] = useState("");
  const [fieldTab, setFieldTab] = useState<"all" | "selected">("all");
  const [fieldSearch, setFieldSearch] = useState("");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [colSearch, setColSearch] = useState("");
  const [filters, setFilters] = useState<{ id: string; field: string; operator: string; value: string }[]>([]);
  const [frequency, setFrequency] = useState<ReportFrequency>("One Time");
  const [startDate, setStartDate] = useState("2026-08-01");
  const [time, setTime] = useState("09:00");
  const [timezone, setTimezone] = useState("(IST) Asia/Kolkata");
  const [deliveryEmail, setDeliveryEmail] = useState(true);
  const [deliveryDownload, setDeliveryDownload] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState("");
  const [format, setFormat] = useState<ReportFormat>("Excel");
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);

  // ── Derived field list ──
  const activeModule = module || "All Modules";
  const fieldGroups = FIELDS_BY_MODULE[activeModule] ?? FIELDS_BY_MODULE["All Modules"];
  const allFields = fieldGroups.flatMap((g) => g.fields);

  const visibleGroups = fieldGroups.map((g) => ({
    ...g,
    fields: g.fields.filter((f) =>
      fieldTab === "selected"
        ? selectedColumns.includes(f)
        : !fieldSearch || f.toLowerCase().includes(fieldSearch.toLowerCase())
    ),
  })).filter((g) => g.fields.length > 0);

  // ── Column move actions ──
  const moveToSelected = () => {
    const checked = allFields.filter((f) => {
      const el = document.getElementById(`field-${f}`) as HTMLInputElement | null;
      return el?.checked && !selectedColumns.includes(f);
    });
    if (checked.length) setSelectedColumns((p) => [...p, ...checked]);
  };

  const moveFromSelected = () => {
    const checked = selectedColumns.filter((f) => {
      const el = document.getElementById(`selcol-${f}`) as HTMLInputElement | null;
      return el?.checked;
    });
    if (checked.length) setSelectedColumns((p) => p.filter((c) => !checked.includes(c)));
  };

  const toggleField = (f: string) => {
    setSelectedColumns((p) =>
      p.includes(f) ? p.filter((c) => c !== f) : [...p, f]
    );
  };

  const toggleSelectAll = () => {
    const visible = visibleGroups.flatMap((g) => g.fields);
    const allSelected = visible.every((f) => selectedColumns.includes(f));
    if (allSelected) setSelectedColumns((p) => p.filter((c) => !visible.includes(c)));
    else setSelectedColumns((p) => [...new Set([...p, ...visible])]);
  };

  const colsFiltered = selectedColumns.filter((c) =>
    !colSearch || c.toLowerCase().includes(colSearch.toLowerCase())
  );

  // ── Filters ──
  const addFilter = () => {
    setFilters((p) => [...p, { id: nanoid(), field: "", operator: "equals", value: "" }]);
  };
  const removeFilter = (id: string) => setFilters((p) => p.filter((f) => f.id !== id));
  const updateFilter = (id: string, key: "field" | "operator" | "value", val: string) => {
    setFilters((p) => p.map((f) => (f.id === id ? { ...f, [key]: val } : f)));
  };

  // ── Save ──
  const handleSave = () => {
    if (!reportName.trim()) { toast({ title: "Report name is required", variant: "destructive" }); return; }
    if (!reportType) { toast({ title: "Report type is required", variant: "destructive" }); return; }

    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    const report = {
      id: generateReportId(),
      name: reportName.trim(),
      description: description.trim(),
      reportType,
      module: activeModule,
      selectedColumns,
      filters,
      frequency,
      startDate,
      time: new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      timeZone: timezone,
      deliveryEmail,
      deliveryDownload,
      emailRecipients,
      format,
      includeCharts,
      includeSummary,
      createdBy: "System Admin",
      createdAt: `${dateStr} ${timeStr}`,
      lastRunDate: dateStr,
      lastRunStatus: "Success" as const,
    };

    saveCustomReport(report);
    toast({ title: "Report saved!", description: `"${report.name}" has been added to your reports.` });
    navigate("/reports");
  };

  const formatLabel = FORMATS.find((f) => f.value === format)?.label ?? "Excel (.xlsx)";

  return (
    <div className="space-y-5 pb-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500">
        <button onClick={() => navigate("/reports")} className="hover:text-blue-600 transition-colors">
          Reports
        </button>
        <span className="text-gray-300">›</span>
        <span className="text-gray-700 font-medium">Create Report</span>
      </nav>

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Report</h1>
          <p className="text-sm text-gray-500 mt-0.5">Build a custom report to view and analyze your business data.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/reports")} className="text-sm">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white text-sm">
            Save &amp; Next
          </Button>
        </div>
      </div>

      {/* ── Section 1: Report Details ─────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-5">
          <SectionBadge n={1} />
          <h2 className="text-base font-semibold text-gray-900">Report Details</h2>
        </div>
        <div className="grid grid-cols-2 gap-5">
          {/* Left: name + type */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Name <span className="text-red-500">*</span>
              </label>
              <input
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Enter report name"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Type <span className="text-red-500">*</span>
              </label>
              <SelectDropdown
                value={reportType as any}
                placeholder="Select report type"
                options={REPORT_TYPES.map((r) => ({ value: r.value, desc: r.desc, icon: r.icon }))}
                onChange={(v) => setReportType(v)}
              />
            </div>
          </div>
          {/* Right: description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter report description"
              rows={5}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400 resize-none"
            />
          </div>
        </div>
      </div>

      {/* ── Section 2 + 3+4: Data Source alongside Filters & Schedule ──────── */}
      <div className="grid grid-cols-5 gap-4 items-start">
        {/* Left: Data Source (3/5) */}
        <div className="col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <SectionBadge n={2} />
            <div>
              <h2 className="text-base font-semibold text-gray-900">Data Source</h2>
              <p className="text-xs text-gray-400">Select the module and fields for your report.</p>
            </div>
          </div>

          {/* Module dropdown */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Module / Data Source <span className="text-red-500">*</span>
            </label>
            <SelectDropdown
              value={module as any}
              placeholder="Select module"
              options={MODULES.map((m) => ({ value: m.value, desc: m.desc, icon: m.icon }))}
              onChange={(v) => { setModule(v); setSelectedColumns([]); setFieldSearch(""); }}
            />
          </div>

          {/* Fields panel + move buttons + selected columns */}
          <div className="flex gap-2 items-start">
            {/* Left: fields list */}
            <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => setFieldTab("all")}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${fieldTab === "all" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/40" : "text-gray-500 hover:text-gray-700"}`}
                >
                  All Fields
                </button>
                <button
                  onClick={() => setFieldTab("selected")}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${fieldTab === "selected" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/40" : "text-gray-500 hover:text-gray-700"}`}
                >
                  Selected Fields ({selectedColumns.length})
                </button>
              </div>
              {/* Search */}
              <div className="p-2 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    value={fieldSearch}
                    onChange={(e) => setFieldSearch(e.target.value)}
                    placeholder="Search fields..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              {/* Field rows */}
              <div className="max-h-52 overflow-y-auto">
                {visibleGroups.length === 0 && (
                  <div className="py-8 text-center text-xs text-gray-400">No fields found</div>
                )}
                {visibleGroups.map((g) => (
                  <div key={g.group}>
                    {visibleGroups.length > 1 && (
                      <div className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                        {g.group}
                      </div>
                    )}
                    {g.fields.map((f) => (
                      <label key={f} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          id={`field-${f}`}
                          type="checkbox"
                          checked={selectedColumns.includes(f)}
                          onChange={() => toggleField(f)}
                          className="rounded border-gray-300 text-blue-600"
                        />
                        <span className="text-xs text-gray-700">{f}</span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Move buttons */}
            <div className="flex flex-col gap-2 pt-16 shrink-0">
              <button
                onClick={moveToSelected}
                title="Move selected to columns"
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <ArrowRight className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={moveFromSelected}
                title="Remove from columns"
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Right: selected columns */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700">Selected Columns</span>
                <span className="text-[10px] text-gray-400">Drag to reorder columns</span>
              </div>
              {/* Column selector dropdown */}
              <div className="relative mb-2">
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white">
                  <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <input
                    value={colSearch}
                    onChange={(e) => setColSearch(e.target.value)}
                    placeholder="Search columns..."
                    className="flex-1 text-xs outline-none placeholder:text-gray-400"
                  />
                </div>
              </div>
              {/* Select all + column list */}
              {selectedColumns.length > 0 ? (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <label className="flex items-center gap-2.5 px-3 py-2 border-b border-gray-100 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={colsFiltered.length > 0 && colsFiltered.every((c) => selectedColumns.includes(c))}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-xs font-medium text-gray-600">Select All</span>
                  </label>
                  {/* Group by module */}
                  {(() => {
                    const grouped: Record<string, string[]> = {};
                    fieldGroups.forEach((g) => {
                      const cols = colsFiltered.filter((c) => g.fields.includes(c));
                      if (cols.length) grouped[g.group] = cols;
                    });
                    return Object.entries(grouped).map(([grp, cols]) => (
                      <div key={grp}>
                        <div className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-t border-gray-100">
                          {grp}
                        </div>
                        {cols.map((c) => (
                          <label key={c} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors">
                            <input
                              id={`selcol-${c}`}
                              type="checkbox"
                              defaultChecked
                              className="rounded border-gray-300 text-blue-600"
                            />
                            <span className="text-xs text-gray-700">{c}</span>
                          </label>
                        ))}
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <div className="border border-dashed border-gray-200 rounded-lg min-h-[160px] flex flex-col items-center justify-center text-center p-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                    <Layers className="w-5 h-5 text-gray-300" />
                  </div>
                  <p className="text-xs font-medium text-gray-400">No columns selected</p>
                  <p className="text-xs text-gray-300 mt-0.5">Add columns from the left panel</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Filters + Schedule stacked */}
        <div className="col-span-2 flex flex-col gap-4">
          {/* ── Section 3: Filters ─────────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <SectionBadge n={3} />
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Filters <span className="text-sm font-normal text-gray-400">(Optional)</span>
                  </h2>
                  <p className="text-xs text-gray-400">Add filters to narrow down your report data.</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={addFilter}
                className="text-xs border-blue-200 text-blue-600 hover:bg-blue-50 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Filter
              </Button>
            </div>
            {filters.length === 0 ? (
              <div className="py-5 text-center text-xs text-gray-400">
                No filters added. Click "+ Add Filter" to begin.
              </div>
            ) : (
              <div className="space-y-2">
                {filters.map((f) => (
                  <div key={f.id} className="flex items-center gap-2">
                    <select
                      value={f.field}
                      onChange={(e) => updateFilter(f.id, "field", e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select field</option>
                      {allFields.map((field) => (
                        <option key={field} value={field}>{field}</option>
                      ))}
                    </select>
                    <select
                      value={f.operator}
                      onChange={(e) => updateFilter(f.id, "operator", e.target.value)}
                      className="w-28 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {FILTER_OPERATORS.map((op) => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                    <input
                      value={f.value}
                      onChange={(e) => updateFilter(f.id, "value", e.target.value)}
                      placeholder="Value"
                      className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => removeFilter(f.id)}
                      className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Section 4: Schedule & Delivery ─────────────────────────────── */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <SectionBadge n={4} />
              <div>
                <h2 className="text-base font-semibold text-gray-900">Schedule &amp; Delivery</h2>
                <p className="text-xs text-gray-400">Set how often and where the report should be delivered.</p>
              </div>
            </div>

            {/* Frequency / Start Date / Time */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Frequency</label>
                <SelectDropdown
                  value={frequency}
                  placeholder="Select frequency"
                  options={FREQUENCIES.map((f) => ({ value: f.value, desc: f.desc, icon: f.icon }))}
                  onChange={(v) => setFrequency(v)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Time</label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Timezone */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">Time Zone</label>
              <SelectDropdown
                value={timezone as any}
                placeholder="Select timezone"
                options={TIMEZONES.map((tz) => ({ value: tz }))}
                onChange={(v) => setTimezone(v)}
              />
            </div>

            {/* Delivery Method */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-600 mb-2">Delivery Method</label>
              <div className="flex items-center gap-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deliveryEmail}
                    onChange={(e) => setDeliveryEmail(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Email</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deliveryDownload}
                    onChange={(e) => setDeliveryDownload(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">Download</span>
                </label>
              </div>
            </div>

            {/* Email Recipients */}
            {deliveryEmail && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email Recipients</label>
                <input
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value)}
                  placeholder="Enter email addresses separated by comma"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                />
                <p className="text-xs text-gray-400 mt-1">e.g., admin@nido-tech.com, manager@nido-tech.com</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 5: Output & Format ───────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SectionBadge n={5} />
            <div>
              <h2 className="text-base font-semibold text-gray-900">Output &amp; Format</h2>
              <p className="text-xs text-gray-400">Choose the format in which the report will be generated.</p>
            </div>
          </div>

          <div className="flex items-center gap-8">
            {/* Format dropdown */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Format</label>
              <div className="relative w-44">
                <FormatDropdown value={format} onChange={setFormat} />
              </div>
            </div>

            {/* Include Charts toggle */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Include Charts</span>
              <Toggle checked={includeCharts} onChange={setIncludeCharts} />
            </div>

            {/* Include Summary toggle */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Include Summary</span>
              <Toggle checked={includeSummary} onChange={setIncludeSummary} />
            </div>

            {/* Save Report */}
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white text-sm flex items-center gap-2 ml-4">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Format Dropdown ────────────────────────────────────────────────────────────

function FormatDropdown({ value, onChange }: { value: ReportFormat; onChange: (v: ReportFormat) => void }) {
  const [open, setOpen] = useState(false);
  const selected = FORMATS.find((f) => f.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      >
        <span className="text-gray-900">{selected?.label}</span>
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-full bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-1">
          {FORMATS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => { onChange(f.value); setOpen(false); }}
              className={`w-full flex items-center px-3 py-2 text-sm text-left transition-colors hover:bg-blue-50 ${value === f.value ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-800"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Toggle ─────────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? "bg-blue-600" : "bg-gray-200"}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );
}
