import { type FormEvent, type ReactNode, useMemo, useState } from "react";
import {
  CalendarDays,
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  Grid2X2,
  MoreVertical,
  Plus,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Repeat2,
  X,
  Pencil,
  Check,
  Trash2,
  List,
  FileText,
  Activity,
  StickyNote,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import jsPDF from "jspdf";

type RenewalStatus = "Overdue" | "Upcoming" | "Due Soon";
type AutoRenew = "Enabled" | "Disabled";

interface Renewal {
  id: string;
  product: string;
  brand: "microsoft" | "adobe" | "vmware" | "fortinet";
  client: string;
  licenseType: string;
  seats: string;
  dueDate: string;
  dueIn: string;
  amount: string;
  renewalStatus: RenewalStatus;
  autoRenew: AutoRenew;
}

type RenewalFormValues = Pick<
  Renewal,
  "product" | "brand" | "client" | "licenseType" | "seats" | "dueDate" | "amount" | "autoRenew"
>;

const TABS = [
  "Overview",
  "Calendar View",
  "Upcoming Renewals",
  "Renewal History",
  "Expiring Soon",
  "Auto Renewals",
] as const;

const RENEWALS: Renewal[] = [
  {
    id: "REN-000041",
    product: "Microsoft 365 Business Standard",
    brand: "microsoft",
    client: "Nido Tech CorpEssentials",
    licenseType: "Subscription (License)",
    seats: "10 Users",
    dueDate: "Aug 24, 2026",
    dueIn: "Due in 0 days",
    amount: "₹59,000.00",
    renewalStatus: "Overdue",
    autoRenew: "Enabled",
  },
  {
    id: "REN-000042",
    product: "Adobe Acrobat Pro",
    brand: "adobe",
    client: "Cloud Systems India",
    licenseType: "Subscription (License)",
    seats: "5 Users",
    dueDate: "Sep 10, 2026",
    dueIn: "Due in 17 days",
    amount: "₹24,750.00",
    renewalStatus: "Upcoming",
    autoRenew: "Enabled",
  },
  {
    id: "REN-000043",
    product: "VMware vSphere Standard",
    brand: "vmware",
    client: "InfoTech Pvt. Ltd.",
    licenseType: "Subscription (License)",
    seats: "2 CPU",
    dueDate: "Oct 05, 2026",
    dueIn: "Due in 42 days",
    amount: "₹1,25,000.00",
    renewalStatus: "Due Soon",
    autoRenew: "Disabled",
  },
  {
    id: "REN-000044",
    product: "FortiGate 100F (UTM Firewall)",
    brand: "fortinet",
    client: "Apex Tech Solutions",
    licenseType: "Subscription (License)",
    seats: "1 Device",
    dueDate: "Oct 28, 2026",
    dueIn: "Due in 65 days",
    amount: "₹85,000.00",
    renewalStatus: "Due Soon",
    autoRenew: "Enabled",
  },
  {
    id: "REN-000045",
    product: "Microsoft Windows Server 2022 Std",
    brand: "microsoft",
    client: "Nido Tech CorpEssentials",
    licenseType: "Perpetual + SA (License)",
    seats: "1 Server",
    dueDate: "Nov 15, 2026",
    dueIn: "Due in 83 days",
    amount: "₹45,000.00",
    renewalStatus: "Upcoming",
    autoRenew: "Disabled",
  },
];

const RENEWAL_HISTORY: Renewal[] = [
  {
    id: "REN-000039",
    product: "Microsoft 365 Business Basic",
    brand: "microsoft",
    client: "Cloud Systems India",
    licenseType: "Subscription (License)",
    seats: "25 Users",
    dueDate: "Jun 12, 2026",
    dueIn: "Renewed Jun 12, 2026",
    amount: "₹42,500.00",
    renewalStatus: "Upcoming",
    autoRenew: "Enabled",
  },
  {
    id: "REN-000040",
    product: "Adobe Creative Cloud",
    brand: "adobe",
    client: "Apex Tech Solutions",
    licenseType: "Subscription (License)",
    seats: "8 Users",
    dueDate: "Jul 03, 2026",
    dueIn: "Renewed Jul 03, 2026",
    amount: "₹68,000.00",
    renewalStatus: "Upcoming",
    autoRenew: "Disabled",
  },
];

const STATUS_STYLES: Record<RenewalStatus, string> = {
  Overdue: "bg-rose-50 text-rose-600",
  Upcoming: "bg-blue-50 text-blue-600",
  "Due Soon": "bg-amber-50 text-amber-700",
};

function BrandMark({ brand }: { brand: Renewal["brand"] }) {
  if (brand === "adobe") {
    return (
      <div className="flex h-5 w-5 items-center justify-center text-[#e21b2d]">
        <span className="text-[21px] font-bold leading-none">A</span>
      </div>
    );
  }

  if (brand === "fortinet") {
    return (
      <div className="grid h-5 w-5 grid-cols-2 grid-rows-2 gap-px overflow-hidden">
        <span className="bg-[#e1261c]" />
        <span className="bg-[#b6ce39]" />
        <span className="bg-[#e1261c]" />
        <span className="bg-[#b6ce39]" />
      </div>
    );
  }

  if (brand === "vmware") {
    return (
      <div className="grid h-5 w-5 grid-cols-2 grid-rows-2 gap-px overflow-hidden">
        <span className="bg-[#f25022]" />
        <span className="bg-[#7fba00]" />
        <span className="bg-[#00a4ef]" />
        <span className="bg-[#ffb900]" />
      </div>
    );
  }

  return (
    <div className="grid h-5 w-5 grid-cols-2 grid-rows-2 gap-px overflow-hidden">
      <span className="bg-[#f25022]" />
      <span className="bg-[#7fba00]" />
      <span className="bg-[#00a4ef]" />
      <span className="bg-[#ffb900]" />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  wide = false,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  wide?: boolean;
}) {
  return (
    <label className={`min-w-0 ${wide ? "sm:col-span-1" : ""}`}>
      <span className="mb-1 block text-[9px] font-semibold text-gray-600">{label}</span>
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-8 w-full appearance-none rounded-lg border border-gray-200 bg-white px-2.5 pr-7 text-[11px] text-gray-700 outline-none transition-colors hover:border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
        >
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
      </span>
    </label>
  );
}

function exportRenewals(rows: Renewal[]) {
  const headings = [
    "Renewal ID",
    "Product / License",
    "Client",
    "License Type",
    "Due Date",
    "Amount",
    "Renewal Status",
    "Auto Renew",
  ];
  const values = rows.map((row) => [
    row.id,
    row.product,
    row.client,
    `${row.licenseType} ${row.seats}`,
    row.dueDate,
    row.amount,
    row.renewalStatus,
    row.autoRenew,
  ]);
  const csv = [headings, ...values]
    .map((line) => line.map((value) => `"${value.replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "renewals.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function inputDateFromDisplayDate(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function displayDateFromInputDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function getDueDays(row: Renewal): number {
  const match = row.dueIn.match(/(\d+)\s*days?/i);
  if (match) return row.dueIn.toLowerCase().includes("overdue") ? -Number(match[1]) : Number(match[1]);
  const dueDate = new Date(row.dueDate);
  return Number.isNaN(dueDate.getTime())
    ? Number.POSITIVE_INFINITY
    : Math.ceil((dueDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

function getRenewalStatus(dueDate: string): RenewalStatus {
  const dueDays = Math.ceil((new Date(`${dueDate}T00:00:00`).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (dueDays < 0) return "Overdue";
  if (dueDays <= 30) return "Upcoming";
  return "Due Soon";
}

function RenewalFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: Renewal;
  onClose: () => void;
  onSave: (values: RenewalFormValues) => void;
}) {
  const [form, setForm] = useState<RenewalFormValues>(() => ({
    product: initial?.product ?? "",
    brand: initial?.brand ?? "microsoft",
    client: initial?.client ?? "",
    licenseType: initial?.licenseType ?? "Subscription (License)",
    seats: initial?.seats ?? "1 User",
    dueDate: initial ? inputDateFromDisplayDate(initial.dueDate) : "",
    amount: initial?.amount ?? "",
    autoRenew: initial?.autoRenew ?? "Enabled",
  }));

  const update = <K extends keyof RenewalFormValues>(key: K, value: RenewalFormValues[K]) => {
    setForm(current => ({ ...current, [key]: value }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
      <form onSubmit={submit} className="w-full max-w-xl rounded-xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">{initial ? "Edit Renewal" : "New Renewal"}</h2>
            <p className="mt-0.5 text-xs text-gray-500">Keep license and subscription renewal details up to date.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-1 block text-[10px] font-semibold text-gray-600">Product / License</span>
            <input required value={form.product} onChange={event => update("product", event.target.value)} className="h-9 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100" />
          </label>
          <label>
            <span className="mb-1 block text-[10px] font-semibold text-gray-600">Client</span>
            <input required value={form.client} onChange={event => update("client", event.target.value)} className="h-9 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100" />
          </label>
          <label>
            <span className="mb-1 block text-[10px] font-semibold text-gray-600">Brand</span>
            <select value={form.brand} onChange={event => update("brand", event.target.value as Renewal["brand"])} className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100">
              <option value="microsoft">Microsoft</option>
              <option value="adobe">Adobe</option>
              <option value="vmware">VMware</option>
              <option value="fortinet">Fortinet</option>
            </select>
          </label>
          <label>
            <span className="mb-1 block text-[10px] font-semibold text-gray-600">License Type</span>
            <select value={form.licenseType} onChange={event => update("licenseType", event.target.value)} className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100">
              <option>Subscription (License)</option>
              <option>Perpetual + SA (License)</option>
            </select>
          </label>
          <label>
            <span className="mb-1 block text-[10px] font-semibold text-gray-600">Seats / Quantity</span>
            <input required value={form.seats} onChange={event => update("seats", event.target.value)} className="h-9 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100" />
          </label>
          <label>
            <span className="mb-1 block text-[10px] font-semibold text-gray-600">Due Date</span>
            <input required type="date" value={form.dueDate} onChange={event => update("dueDate", event.target.value)} className="h-9 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100" />
          </label>
          <label>
            <span className="mb-1 block text-[10px] font-semibold text-gray-600">Amount</span>
            <input required value={form.amount} onChange={event => update("amount", event.target.value)} placeholder="₹0.00" className="h-9 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100" />
          </label>
          <label>
            <span className="mb-1 block text-[10px] font-semibold text-gray-600">Auto Renew</span>
            <select value={form.autoRenew} onChange={event => update("autoRenew", event.target.value as AutoRenew)} className="h-9 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100">
              <option>Enabled</option>
              <option>Disabled</option>
            </select>
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" className="h-9 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700">Save Renewal</button>
        </div>
      </form>
    </div>
  );
}

type DetailTab = "Order Items" | "License Details" | "Renewals" | "Downloads" | "Invoices" | "Activity Log" | "Notes";

const DETAIL_TABS: DetailTab[] = [
  "Order Items",
  "License Details",
  "Renewals",
  "Downloads",
  "Invoices",
  "Activity Log",
  "Notes",
];

function formatCurrencyAmount(value: string): string {
  const amount = Number(value.replace(/[^\d.-]/g, "").replace(/,/g, ""));
  if (!Number.isFinite(amount)) return value;
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function downloadRenewalInvoice(row: Renewal) {
  const amount = Number(row.amount.replace(/[^\d.-]/g, "").replace(/,/g, "")) || 0;
  const gst = amount * 0.18;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Nido Tech", 42, 54);
  doc.setFontSize(13);
  doc.text("Renewal Invoice", 42, 82);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Renewal ID: ${row.id}`, 42, 108);
  doc.text(`Client: ${row.client}`, 42, 124);
  doc.text(`Due date: ${row.dueDate}`, 42, 140);
  doc.line(42, 158, 553, 158);
  doc.setFont("helvetica", "bold");
  doc.text("Description", 42, 180);
  doc.text("Amount", 470, 180);
  doc.setFont("helvetica", "normal");
  doc.text(row.product, 42, 202);
  doc.text(formatCurrencyAmount(row.amount), 470, 202, { align: "right" });
  doc.line(42, 220, 553, 220);
  doc.text(`Subtotal: ${formatCurrencyAmount(row.amount)}`, 553, 244, { align: "right" });
  doc.text(`GST (18%): ${formatCurrencyAmount(String(gst))}`, 553, 262, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.text(`Total: ${formatCurrencyAmount(String(amount + gst))}`, 553, 288, { align: "right" });
  doc.save(`${row.id}-invoice.pdf`);
}

function downloadRenewalFile(row: Renewal, type: "license" | "renewal") {
  const contents = type === "license"
    ? `Nido Tech License Details\n\nRenewal ID: ${row.id}\nProduct: ${row.product}\nClient: ${row.client}\nLicense type: ${row.licenseType}\nQuantity: ${row.seats}\nActivation domain: nido-tech.onmicrosoft.com\nLicense key: abcd1234-ef56-7890-abcd-1234567890ef\n`
    : `Nido Tech Renewal Summary\n\nRenewal ID: ${row.id}\nProduct: ${row.product}\nClient: ${row.client}\nNext renewal: ${row.dueDate}\nRenewal amount: ${row.amount}\nAuto renewal: ${row.autoRenew}\n`;
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([contents], { type: "text/plain;charset=utf-8" }));
  link.download = `${row.id}-${type}-details.txt`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function DetailCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[10px] border border-gray-200 bg-white p-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <h2 className="mb-3 text-[10px] font-bold text-gray-800">{title}</h2>
      {children}
    </section>
  );
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[8px] text-gray-400">{label}</p>
      <p className="mt-0.5 text-[9px] font-medium leading-3.5 text-gray-700">{value}</p>
    </div>
  );
}

function RenewalDetailsPage({
  row,
  onBack,
  onEdit,
  onRenew,
  onRemove,
  onManageRenewal,
}: {
  row: Renewal;
  onBack: () => void;
  onEdit: () => void;
  onRenew: () => void;
  onRemove: () => void;
  onManageRenewal: () => void;
}) {
  const [activeTab, setActiveTab] = useState<DetailTab>("Order Items");
  const [menuOpen, setMenuOpen] = useState(false);
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const amount = Number(row.amount.replace(/[^\d.-]/g, "").replace(/,/g, "")) || 0;
  const gst = amount * 0.18;
  const total = amount + gst;
  const scrollToTab = (tab: DetailTab) => {
    setActiveTab(tab);
    document.getElementById(`renewal-detail-${tab.toLowerCase().replaceAll(" ", "-")}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-[#fbfcfe] px-2 pb-8 text-gray-900 sm:px-3">
      <header className="px-1.5 pb-3 pt-2 sm:px-2">
        <button type="button" onClick={onBack} className="mb-2 inline-flex items-center gap-1 text-[9px] text-gray-500 hover:text-blue-600">
          <ArrowLeft className="h-3 w-3" /> Back to Renewals
        </button>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[17px] font-bold leading-6 tracking-[-0.25px] text-gray-900">Order Details / #ORD-000014</h1>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[8px] font-semibold text-emerald-700">Delivered</span>
            </div>
            <p className="mt-0.5 text-[9px] text-gray-500">Master Order · Created on Aug 24, 2026 04:21 PM · Requested by Rahul Sharma (Client Operations)</p>
          </div>
          <div className="relative flex shrink-0 items-center gap-1.5">
            <button type="button" onClick={() => downloadRenewalInvoice(row)} className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-[9px] font-medium text-gray-700 shadow-sm hover:bg-gray-50">
              <Download className="h-3 w-3" /> Download Invoice
            </button>
            <button type="button" aria-label="Order actions" onClick={() => setMenuOpen(open => !open)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50">
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-30 w-36 rounded-lg border border-gray-200 bg-white p-1 shadow-xl">
                <button type="button" onClick={() => { window.print(); setMenuOpen(false); }} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[9px] text-gray-700 hover:bg-gray-50">Print details</button>
                <button type="button" onClick={() => { navigator.clipboard?.writeText("ORD-000014"); setMenuOpen(false); }} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[9px] text-gray-700 hover:bg-gray-50">Copy order ID</button>
                <button type="button" onClick={() => { onRemove(); setMenuOpen(false); }} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[9px] text-rose-600 hover:bg-rose-50">Remove renewal</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mb-3 grid gap-px overflow-hidden rounded-[10px] border border-emerald-100 bg-emerald-100 md:grid-cols-3">
        <div className="bg-emerald-50/70 px-3 py-2.5">
          <p className="text-[8px] font-semibold uppercase text-emerald-700">Order Processing SLA</p>
          <p className="mt-1 text-[9px] text-gray-600">Target: 24h <span className="ml-2 font-bold text-emerald-700">SLA Met in 6h 45m</span></p>
        </div>
        <div className="bg-emerald-50/70 px-3 py-2.5">
          <p className="text-[8px] font-semibold uppercase text-gray-500">SLA Deadline: Aug 24, 2026 04:21 PM</p>
          <p className="mt-1 text-[9px] text-gray-600">Completed On: Aug 24, 2026 11:06 PM</p>
        </div>
        <div className="bg-emerald-50/70 px-3 py-2.5">
          <p className="text-[8px] font-semibold uppercase text-gray-500">Renewal ID</p>
          <p className="mt-1 text-[9px] font-bold text-gray-700">{row.id}</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <DetailCard title="Billing Information">
          <div className="space-y-2.5">
            <DetailField label="Client" value={row.client} />
            <DetailField label="Payment Method" value="Company Account" />
            <DetailField label="Payment Term" value="Net 30 (Payment due in 30 days)" />
            <DetailField label="Billing Address" value="41/10, C Cross, Wilson garden, Bangalore – 560027" />
          </div>
        </DetailCard>
        <DetailCard title="Delivery Information">
          <div className="space-y-2.5">
            <DetailField label="Ship To" value="41/10, C Cross, Wilson garden, Bangalore – 560027" />
            <DetailField label="Delivery Type" value="Digital Delivery" />
            <DetailField label="Delivery Status" value={<span className="text-emerald-600">Delivered</span>} />
            <DetailField label="Delivered On" value="Aug 24, 2026 11:06 PM" />
          </div>
        </DetailCard>
        <DetailCard title="Requester / Client Information">
          <div className="space-y-2.5">
            <DetailField label="Name" value="Rahul Sharma" />
            <DetailField label="Role" value="Client Operations Analyst" />
            <DetailField label="Organization" value={row.client} />
            <DetailField label="Client Operations" value="Procurement" />
          </div>
        </DetailCard>
        <DetailCard title="Order Summary">
          <div className="space-y-2.5">
            <DetailField label="Master Order ID" value="ORD-000014" />
            <DetailField label="Sub Orders" value="1" />
            <DetailField label="Total Items" value="1" />
            <DetailField label="Total Amount" value={<span className="font-bold">{formatCurrencyAmount(String(total))}</span>} />
            <DetailField label="Created On" value="Aug 24, 2026 04:21 PM" />
          </div>
        </DetailCard>
      </div>

      <nav className="mt-4 flex min-w-max items-end gap-1 overflow-x-auto border-b border-gray-200">
        {DETAIL_TABS.map(tab => (
          <button
            type="button"
            key={tab}
            onClick={() => scrollToTab(tab)}
            className={`relative inline-flex h-9 items-center gap-1.5 px-2.5 text-[9px] font-medium ${activeTab === tab ? "text-blue-700" : "text-gray-500 hover:text-gray-800"}`}
          >
            {tab === "Order Items" && <FileText className="h-3 w-3" />}
            {tab === "License Details" && <ShieldCheck className="h-3 w-3" />}
            {tab === "Renewals" && <RefreshCw className="h-3 w-3" />}
            {tab === "Downloads" && <Download className="h-3 w-3" />}
            {tab === "Invoices" && <Receipt className="h-3 w-3" />}
            {tab === "Activity Log" && <Activity className="h-3 w-3" />}
            {tab === "Notes" && <StickyNote className="h-3 w-3" />}
            {tab}
            {tab === "Order Items" && <span className="rounded-full bg-blue-100 px-1 text-[7px] text-blue-700">1</span>}
            {tab === "Renewals" && <span className="rounded-full bg-blue-100 px-1 text-[7px] text-blue-700">1</span>}
            {activeTab === tab && <span className="absolute inset-x-0 bottom-[-1px] h-0.5 bg-blue-600" />}
          </button>
        ))}
      </nav>

      <main className="mt-3 space-y-3">
        <DetailCard title={`Order Items (1)`}>
          <div id="renewal-detail-order-items" className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-[9px]">
              <thead><tr className="border-b border-gray-100 text-left text-[8px] uppercase text-gray-400"><th className="pb-2">#</th><th className="pb-2">Item Details</th><th className="pb-2">Type</th><th className="pb-2">Qty</th><th className="pb-2">Unit Price</th><th className="pb-2">Total</th><th className="pb-2">Status</th><th className="pb-2">Vendor</th></tr></thead>
              <tbody><tr className="border-b border-gray-100"><td className="py-3">1</td><td className="py-3"><div className="flex items-center gap-2"><BrandMark brand={row.brand} /><span className="font-semibold text-gray-700">{row.product}<span className="mt-1 block w-fit rounded bg-purple-50 px-1 text-[7px] font-semibold uppercase text-purple-700">Digital License</span></span></div></td><td>Subscription<br />(License)</td><td>{row.seats.replace(/[^\d]/g, "") || "1"}</td><td>{formatCurrencyAmount(row.amount)}</td><td>{formatCurrencyAmount(row.amount)}</td><td><span className="rounded-full bg-emerald-50 px-1.5 py-1 text-[8px] font-semibold text-emerald-600">Delivered</span><span className="mt-1 block text-[7px] text-gray-400">Delivered on<br />Aug 24, 2026</span></td><td className="text-blue-600">TechCloud Solutions Pvt. Ltd.</td></tr></tbody>
            </table>
          </div>
          <div className="mt-3 ml-auto w-56 space-y-1.5 text-right text-[9px]"><p>Sub-total (incl. GST) <span className="float-right font-semibold">{formatCurrencyAmount(String(amount))}</span></p><p>GST (18%) <span className="float-right font-semibold">{formatCurrencyAmount(String(gst))}</span></p><p className="border-t border-gray-200 pt-1.5 font-bold">Total Order Amount <span className="float-right">{formatCurrencyAmount(String(total))}</span></p></div>
        </DetailCard>

        <section id="renewal-detail-license-details">
          <DetailCard title="License Details">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded bg-purple-50 text-purple-500"><ShieldCheck className="h-5 w-5" /></div><div className="space-y-2"><DetailField label="License Type" value={row.product} /><DetailField label="License Model" value="Subscription" /><DetailField label="Quantity Licensed" value={row.seats} /><DetailField label="Vendor" value={<span className="text-blue-600">TechCloud Solutions Pvt. Ltd.</span>} /></div></div>
              <div className="space-y-2"><DetailField label="Activation / Tenant Domain" value="nido-tech.onmicrosoft.com" /><DetailField label="Assigned To" value={row.client} /><DetailField label="Assigned Users (10)" value={<button type="button" onClick={() => alert(`Showing assigned users for ${row.id}`)} className="text-blue-600 hover:underline">View Assigned Users →</button>} /><DetailField label="License Key / Notes" value="abcd1234-ef56-7890-abcd-1234567890ef" /></div>
              <div className="space-y-2"><DetailField label="Start Date" value="Aug 24, 2026" /><DetailField label="End / Expiry Date" value="Aug 24, 2027" /><DetailField label="Status" value={<span className="rounded-full bg-emerald-50 px-1.5 py-1 text-[8px] font-semibold text-emerald-600">Active</span>} /><DetailField label="Auto Renewal" value={<span className="text-emerald-600">● Enabled</span>} /></div>
            </div>
            <div className="mt-3 flex justify-end"><button type="button" onClick={() => downloadRenewalFile(row, "license")} className="inline-flex items-center gap-1 text-[9px] font-medium text-blue-600 hover:underline"><Download className="h-3 w-3" /> Download license details</button></div>
          </DetailCard>
        </section>

        <section id="renewal-detail-renewals">
          <DetailCard title="Renewal Summary">
            <div className="mb-3 flex justify-end"><button type="button" onClick={onManageRenewal} className="rounded border border-blue-200 px-2 py-1 text-[8px] font-semibold text-blue-600 hover:bg-blue-50">Manage Renewal</button></div>
            <div className="grid gap-2 sm:grid-cols-4">
              <div className="rounded border border-gray-100 p-2"><DetailField label="Next Renewal" value={<span className="font-bold">{row.dueDate}</span>} /><p className="mt-1 text-[8px] text-gray-400">{row.dueIn}</p></div>
              <div className="rounded border border-gray-100 p-2"><DetailField label="Renewal Amount (Est.)" value={<span className="font-bold">{formatCurrencyAmount(row.amount)}</span>} /><p className="mt-1 text-[8px] text-gray-400">Excl. GST</p></div>
              <div className="rounded border border-gray-100 p-2"><DetailField label="Renewal Status" value={<span className="rounded-full bg-blue-50 px-1.5 py-1 text-[8px] font-semibold text-blue-600">Upcoming</span>} /></div>
              <div className="rounded border border-gray-100 p-2"><DetailField label="Auto Renewal" value={<span className="text-emerald-600">● Enabled</span>} /></div>
            </div>
          </DetailCard>
          <DetailCard title="Renewal History">
            <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-[9px]"><thead><tr className="border-b border-gray-100 text-left text-[8px] uppercase text-gray-400"><th className="pb-2">Renewal ID</th><th className="pb-2">Period</th><th className="pb-2">Amount</th><th className="pb-2">Status</th><th className="pb-2">Renewed On</th><th className="pb-2">Invoice</th></tr></thead><tbody><tr><td className="py-2 text-blue-600">REN-000001</td><td>Aug 24, 2025 – Aug 24, 2026</td><td>{formatCurrencyAmount(row.amount)}</td><td><span className="rounded-full bg-emerald-50 px-1.5 py-1 text-[8px] font-semibold text-emerald-600">Completed</span></td><td>Aug 22, 2025</td><td><button type="button" onClick={() => downloadRenewalInvoice(row)} className="text-blue-600 hover:underline">INV-000039 ↓</button></td></tr></tbody></table></div>
            <button type="button" onClick={() => setActiveTab("Renewals")} className="mt-3 block w-full text-center text-[9px] font-medium text-blue-600 hover:underline">View all renewal history →</button>
          </DetailCard>
        </section>

        <section id="renewal-detail-downloads">
          <DetailCard title="Downloads">
            <div className="flex items-center justify-between gap-3 rounded border border-gray-100 p-2"><div className="flex items-center gap-2"><BrandMark brand={row.brand} /><div><p className="text-[9px] font-semibold text-gray-700">{row.product}</p><p className="text-[8px] text-gray-400">Setup & Authentication Guide</p></div></div><button type="button" onClick={() => downloadRenewalFile(row, "license")} className="inline-flex items-center gap-1 rounded border border-gray-200 px-2 py-1 text-[8px] text-gray-600 hover:bg-gray-50"><Download className="h-3 w-3" /> Download</button></div>
            <button type="button" onClick={() => scrollToTab("Downloads")} className="mt-3 block w-full text-center text-[9px] font-medium text-blue-600 hover:underline">View all downloads →</button>
          </DetailCard>
        </section>

        <section id="renewal-detail-invoices">
          <DetailCard title="Invoices">
            <div className="overflow-x-auto"><table className="w-full min-w-[550px] text-[9px]"><thead><tr className="border-b border-gray-100 text-left text-[8px] uppercase text-gray-400"><th className="pb-2">Invoice ID</th><th className="pb-2">Invoice Date</th><th className="pb-2">Amount</th><th className="pb-2">Status</th><th className="pb-2">Due Date</th><th className="pb-2">Actions</th></tr></thead><tbody><tr><td className="py-2 text-blue-600">INV-000123</td><td>Aug 24, 2026</td><td>{formatCurrencyAmount(String(total))}</td><td><span className="rounded-full bg-emerald-50 px-1.5 py-1 text-[8px] font-semibold text-emerald-600">Paid</span></td><td>Sep 23, 2026</td><td><button type="button" onClick={() => downloadRenewalInvoice(row)} className="text-blue-600 hover:underline">View</button><button type="button" onClick={() => downloadRenewalInvoice(row)} className="ml-2 rounded border border-gray-200 p-1 text-gray-500 hover:bg-gray-50" aria-label="Download invoice"><Download className="h-3 w-3" /></button></td></tr></tbody></table></div>
            <button type="button" onClick={() => scrollToTab("Invoices")} className="mt-3 block w-full text-center text-[9px] font-medium text-blue-600 hover:underline">View all invoices →</button>
          </DetailCard>
        </section>

        <section id="renewal-detail-activity-log">
          <DetailCard title="Activity Log">
            <div className="space-y-3 text-[9px]"><div className="flex gap-2"><Activity className="mt-0.5 h-3 w-3 text-blue-500" /><p><span className="font-semibold text-gray-700">Order delivered</span><span className="ml-2 text-gray-400">Aug 24, 2026 11:06 PM</span><br /><span className="text-gray-500">Digital license was delivered to the client.</span></p></div><div className="flex gap-2"><Activity className="mt-0.5 h-3 w-3 text-gray-400" /><p><span className="font-semibold text-gray-700">Renewal created</span><span className="ml-2 text-gray-400">Aug 24, 2026 04:21 PM</span><br /><span className="text-gray-500">Renewal request was submitted by Rahul Sharma.</span></p></div></div>
          </DetailCard>
        </section>

        <section id="renewal-detail-notes">
          <DetailCard title="Notes">
            <div className="flex gap-2"><input value={note} onChange={event => setNote(event.target.value)} placeholder="Add a note about this renewal..." className="h-8 min-w-0 flex-1 rounded border border-gray-200 px-2 text-[9px] outline-none focus:border-blue-400" /><button type="button" onClick={() => { if (note.trim()) { setNotes(current => [note.trim(), ...current]); setNote(""); } }} className="h-8 rounded bg-blue-600 px-3 text-[9px] font-semibold text-white hover:bg-blue-700">Add Note</button></div>
            {notes.length > 0 && <div className="mt-3 space-y-2">{notes.map((item, index) => <p key={`${item}-${index}`} className="rounded bg-gray-50 p-2 text-[9px] text-gray-600">{item}</p>)}</div>}
          </DetailCard>
        </section>

        <div className="flex items-center gap-2 rounded bg-blue-50 px-3 py-2 text-[8px] text-blue-700"><ShieldCheck className="h-3 w-3" /> License keys are encrypted and visible only to authorized users. For security, sharing license keys externally is restricted.</div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onEdit} className="inline-flex items-center gap-1 rounded border border-gray-200 px-3 py-1.5 text-[9px] font-medium text-gray-700 hover:bg-gray-50"><Pencil className="h-3 w-3" /> Edit Renewal</button>
          <button type="button" onClick={onRenew} className="inline-flex items-center gap-1 rounded bg-emerald-600 px-3 py-1.5 text-[9px] font-semibold text-white hover:bg-emerald-700"><Check className="h-3 w-3" /> Mark as Renewed</button>
        </div>
      </main>
    </div>
  );
}

function RenewalActionMenu({
  row,
  open,
  onToggle,
  onEdit,
  onRenew,
  onRemove,
}: {
  row: Renewal;
  open: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onRenew: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="relative inline-block">
      <button
        type="button"
        aria-label={`Actions for ${row.id}`}
        onClick={event => {
          event.stopPropagation();
          onToggle();
        }}
        className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
      >
        <MoreVertical className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-30 w-40 rounded-lg border border-gray-200 bg-white p-1 text-left shadow-xl">
          <button type="button" onClick={event => { event.stopPropagation(); onEdit(); }} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[10px] text-gray-700 hover:bg-gray-50">
            <Pencil className="h-3 w-3" /> Edit renewal
          </button>
          <button type="button" onClick={event => { event.stopPropagation(); onRenew(); }} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[10px] text-gray-700 hover:bg-gray-50">
            <Check className="h-3 w-3 text-emerald-600" /> Mark as renewed
          </button>
          <button type="button" onClick={event => { event.stopPropagation(); onRemove(); }} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[10px] text-rose-600 hover:bg-rose-50">
            <Trash2 className="h-3 w-3" /> Remove renewal
          </button>
        </div>
      )}
    </div>
  );
}

export default function MyRenewalsPage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Overview");
  const [renewals, setRenewals] = useState<Renewal[]>(RENEWALS);
  const [renewalHistory, setRenewalHistory] = useState<Renewal[]>(RENEWAL_HISTORY);
  const [client, setClient] = useState("All Clients");
  const [status, setStatus] = useState("All Statuses");
  const [renewalStatus, setRenewalStatus] = useState("All");
  const [licenseType, setLicenseType] = useState("All");
  const [dateRange, setDateRange] = useState("Select Range");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [autoRenewOnly, setAutoRenewOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showNewRenewal, setShowNewRenewal] = useState(false);
  const [editingRenewal, setEditingRenewal] = useState<Renewal | undefined>();
  const [selectedRenewal, setSelectedRenewal] = useState<Renewal | undefined>();
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(2026, 7, 1));

  const activeRows = activeTab === "Renewal History" ? renewalHistory : renewals;

  const filteredRenewals = useMemo(() => {
    return activeRows.filter((row) => {
      const search = query.trim().toLowerCase();
      const matchesQuery =
        !search ||
        row.id.toLowerCase().includes(search) ||
        row.product.toLowerCase().includes(search) ||
        row.client.toLowerCase().includes(search) ||
        row.licenseType.toLowerCase().includes(search) ||
        row.amount.toLowerCase().includes(search);
      const matchesClient = client === "All Clients" || row.client.includes(client);
      const matchesStatus = status === "All Statuses" || row.autoRenew === status;
      const matchesRenewalStatus =
        renewalStatus === "All" || row.renewalStatus === renewalStatus;
      const matchesLicenseType =
        licenseType === "All" || row.licenseType.includes(licenseType);
      const dueDays = getDueDays(row);
      const matchesDateRange =
        dateRange === "Select Range" ||
        (dateRange === "Next 30 Days" && dueDays >= 0 && dueDays <= 30) ||
        (dateRange === "Next 60 Days" && dueDays >= 0 && dueDays <= 60) ||
        (dateRange === "This Year" && dueDays >= 0);
      const matchesTab =
        activeTab === "Overview" ||
        activeTab === "Calendar View" ||
        activeTab === "Renewal History" ||
        (activeTab === "Upcoming Renewals" && dueDays >= 0 && dueDays <= 30) ||
        (activeTab === "Expiring Soon" && dueDays >= 0 && dueDays <= 60) ||
        (activeTab === "Auto Renewals" && row.autoRenew === "Enabled");
      return (
        matchesQuery &&
        matchesClient &&
        matchesStatus &&
        matchesRenewalStatus &&
        matchesLicenseType &&
        matchesDateRange &&
        matchesTab &&
        (!autoRenewOnly || row.autoRenew === "Enabled")
      );
    });
  }, [activeRows, activeTab, autoRenewOnly, client, dateRange, licenseType, query, renewalStatus, status]);

  const sortedRenewals = useMemo(
    () => [...filteredRenewals].sort((first, second) => {
      const difference = new Date(first.dueDate).getTime() - new Date(second.dueDate).getTime();
      return sortDirection === "asc" ? difference : -difference;
    }),
    [filteredRenewals, sortDirection],
  );
  const totalPages = Math.max(1, Math.ceil(sortedRenewals.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleRows = sortedRenewals.slice((safePage - 1) * pageSize, safePage * pageSize);
  const calendarCells = useMemo(() => {
    const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay();
    return Array.from({ length: 42 }, (_, index) => new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      index - firstDay + 1,
    ));
  }, [calendarMonth]);

  const metrics = [
    {
      label: "Total Renewals",
      value: renewals.length + renewalHistory.length,
      note: "All time",
      icon: CalendarDays,
      iconClass: "bg-blue-50 text-blue-600",
      onClick: () => {
        setActiveTab("Overview");
        setRenewalStatus("All");
        setPage(1);
      },
    },
    {
      label: "Upcoming (0–30 days)",
      value: renewals.filter(row => getDueDays(row) >= 0 && getDueDays(row) <= 30).length,
      note: "Next 30 days",
      icon: Clock3,
      iconClass: "bg-emerald-50 text-emerald-600",
      onClick: () => {
        setActiveTab("Upcoming Renewals");
        setPage(1);
      },
    },
    {
      label: "Due Soon (31–60 days)",
      value: renewals.filter(row => getDueDays(row) > 30 && getDueDays(row) <= 60).length,
      note: "Next 31–60 days",
      icon: CalendarDays,
      iconClass: "bg-amber-50 text-amber-600",
      onClick: () => {
        setActiveTab("Expiring Soon");
        setDateRange("Next 60 Days");
        setPage(1);
      },
    },
    {
      label: "Overdue",
      value: renewals.filter(row => row.renewalStatus === "Overdue").length,
      note: "Past due",
      icon: AlertTriangle,
      iconClass: "bg-rose-50 text-rose-600",
      onClick: () => {
        setActiveTab("Overview");
        setRenewalStatus("Overdue");
        setPage(1);
      },
    },
    {
      label: "Auto Renewals",
      value: renewals.filter(row => row.autoRenew === "Enabled").length,
      note: "Enabled",
      icon: Repeat2,
      iconClass: "bg-purple-50 text-purple-600",
      onClick: () => {
        setActiveTab("Auto Renewals");
        setPage(1);
      },
    },
  ];

  const saveRenewal = (values: RenewalFormValues) => {
    const dueDays = Math.ceil((new Date(`${values.dueDate}T00:00:00`).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    const renewal: Renewal = {
      ...values,
      id: editingRenewal?.id ?? `REN-${String(renewals.length + renewalHistory.length + 41).padStart(6, "0")}`,
      dueDate: displayDateFromInputDate(values.dueDate),
      dueIn: dueDays < 0 ? `Overdue by ${Math.abs(dueDays)} days` : `Due in ${dueDays} days`,
      renewalStatus: getRenewalStatus(values.dueDate),
    };
    if (editingRenewal) {
      setRenewals(current => current.map(row => row.id === renewal.id ? renewal : row));
    } else {
      setRenewals(current => [renewal, ...current]);
    }
    setShowNewRenewal(false);
    setEditingRenewal(undefined);
  };

  const markRenewed = (row: Renewal) => {
    setRenewals(current => current.filter(item => item.id !== row.id));
    setRenewalHistory(current => [{ ...row, dueIn: `Renewed ${new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}` }, ...current]);
    setActionMenuId(null);
    setSelectedRenewal(undefined);
  };

  const removeRenewal = (row: Renewal) => {
    setRenewals(current => current.filter(item => item.id !== row.id));
    setRenewalHistory(current => current.filter(item => item.id !== row.id));
    setActionMenuId(null);
    setSelectedRenewal(undefined);
  };

  const editRenewal = (row: Renewal) => {
    setEditingRenewal(row);
    setShowNewRenewal(true);
    setActionMenuId(null);
  };

  const handleTabChange = (tab: (typeof TABS)[number]) => {
    setActiveTab(tab);
    setPage(1);
    setActionMenuId(null);
  };

  if (selectedRenewal) {
    return (
      <RenewalDetailsPage
        row={selectedRenewal}
        onBack={() => setSelectedRenewal(undefined)}
        onEdit={() => {
          setSelectedRenewal(undefined);
          editRenewal(selectedRenewal);
        }}
        onRenew={() => markRenewed(selectedRenewal)}
        onRemove={() => removeRenewal(selectedRenewal)}
        onManageRenewal={() => {
          setSelectedRenewal(undefined);
          editRenewal(selectedRenewal);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white px-1.5 pb-4 text-gray-900 sm:px-2">
      <header className="flex items-start justify-between gap-4 px-1.5 pb-2 pt-1.5 sm:px-2">
        <div>
          <h1 className="text-[19px] font-bold leading-6 tracking-[-0.35px] text-gray-900">
            Renewals
          </h1>
          <p className="mt-0.5 text-[10px] leading-4 text-gray-500">
            Monitor and manage all license and subscription renewals
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => exportRenewals(sortedRenewals)}
            className="inline-flex h-[30px] items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-[10px] font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 active:scale-[0.98]"
          >
            <Download className="h-3 w-3" />
            Export
          </button>
          <button
            type="button"
            className="inline-flex h-[30px] items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-[10px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 active:scale-[0.98]"
            onClick={() => {
              setEditingRenewal(undefined);
              setShowNewRenewal(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            New Renewal
          </button>
        </div>
      </header>

      <nav className="flex min-w-max items-end border-b border-gray-200 px-1.5 sm:px-2">
        {TABS.map((tab) => (
          <button
            type="button"
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`relative h-9 px-3.5 text-[10px] font-medium transition-colors ${
              activeTab === tab ? "text-blue-700" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <span className="absolute inset-x-0 bottom-[-1px] h-0.5 bg-blue-600" />
            )}
          </button>
        ))}
      </nav>

      <main className="space-y-4 px-1.5 pt-3 sm:px-2">
        <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <button
                type="button"
                key={metric.label}
                onClick={metric.onClick}
                className="flex min-h-[78px] items-center gap-3 rounded-[10px] border border-gray-200 bg-white px-3 text-left shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${metric.iconClass}`}>
                  <Icon className="h-[22px] w-[22px]" strokeWidth={1.8} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[9px] text-gray-500">{metric.label}</p>
                  <p className="mt-0.5 text-[21px] font-bold leading-6 text-gray-900">{metric.value}</p>
                  <p className="mt-0.5 text-[9px] text-gray-500">{metric.note}</p>
                </div>
              </button>
            );
          })}
        </section>

        <section className="rounded-[10px] border border-gray-200 bg-white px-3 py-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-6">
            <SelectField
              label="Client"
              value={client}
              options={["All Clients", "Nido Tech", "Cloud Systems", "InfoTech", "Apex Tech"]}
              onChange={(value) => {
                setClient(value);
                setPage(1);
              }}
            />
            <SelectField
              label="Status"
              value={status}
              options={["All Statuses", "Enabled", "Disabled"]}
              onChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
            />
            <SelectField
              label="Renewal Status"
              value={renewalStatus}
              options={["All", "Upcoming", "Due Soon", "Overdue"]}
              onChange={(value) => {
                setRenewalStatus(value);
                setPage(1);
              }}
            />
            <SelectField
              label="License Type"
              value={licenseType}
              options={["All", "Subscription", "Perpetual"]}
              onChange={(value) => {
                setLicenseType(value);
                setPage(1);
              }}
            />
            <SelectField
              label="Due Date"
              value={dateRange}
              options={["Select Range", "Next 30 Days", "Next 60 Days", "This Year"]}
             onChange={value => {
               setDateRange(value);
               setPage(1);
             }}
            />
            <div className="relative self-end">
              <button
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
                className={`flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border px-2 text-[10px] font-medium transition-colors ${
                  filtersOpen
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Filter className="h-3 w-3" />
                More Filters
                <ChevronDown className="h-3 w-3 text-gray-400" />
              </button>
              {filtersOpen && (
                <div className="absolute right-0 top-9 z-20 w-56 rounded-lg border border-gray-200 bg-white p-3 text-[10px] text-gray-600 shadow-xl">
                  <p className="font-semibold text-gray-800">Additional filters</p>
                  <label className="mt-3 flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={autoRenewOnly}
                      onChange={event => {
                        setAutoRenewOnly(event.target.checked);
                        setPage(1);
                      }}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Show auto-renew enabled only</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setClient("All Clients");
                      setStatus("All Statuses");
                      setRenewalStatus("All");
                      setLicenseType("All");
                      setDateRange("Select Range");
                      setAutoRenewOnly(false);
                      setQuery("");
                      setPage(1);
                    }}
                    className="mt-3 text-[10px] font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Reset all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {activeTab === "Calendar View" ? (
          <section className="overflow-hidden rounded-[10px] border border-gray-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="flex h-12 items-center justify-between border-b border-gray-100 px-3.5">
              <div>
                <h2 className="text-[11px] font-semibold text-gray-800">
                  {calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </h2>
                <p className="text-[9px] text-gray-500">Select a renewal to view its details</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() => setCalendarMonth(current => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarMonth(new Date(2026, 7, 1))}
                  className="h-7 rounded-lg border border-gray-200 px-2.5 text-[10px] font-medium text-gray-700 hover:bg-gray-50"
                >
                  Today
                </button>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() => setCalendarMonth(current => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/80 text-center text-[9px] font-semibold uppercase text-gray-500">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => <div key={day} className="py-2">{day}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {calendarCells.map(day => {
                const dayRows = filteredRenewals.filter(row => {
                  const dueDate = new Date(row.dueDate);
                  return dueDate.getFullYear() === day.getFullYear() &&
                    dueDate.getMonth() === day.getMonth() &&
                    dueDate.getDate() === day.getDate();
                });
                const inMonth = day.getMonth() === calendarMonth.getMonth();
                return (
                  <div key={day.toISOString()} className={`min-h-[86px] border-b border-r border-gray-100 p-1.5 ${inMonth ? "bg-white" : "bg-gray-50/60"}`}>
                    <span className={`text-[10px] ${inMonth ? "text-gray-700" : "text-gray-300"}`}>{day.getDate()}</span>
                    <div className="mt-1 space-y-1">
                      {dayRows.map(row => (
                        <button
                          type="button"
                          key={row.id}
                          onClick={() => setSelectedRenewal(row)}
                          className={`block w-full truncate rounded px-1 py-1 text-left text-[8px] font-medium ${STATUS_STYLES[row.renewalStatus]} hover:opacity-80`}
                        >
                          {row.id} · {row.product}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
        <section className="overflow-hidden rounded-[10px] border border-gray-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex h-11 items-center justify-between gap-3 border-b border-gray-100 px-3.5">
            <h2 className="text-[11px] font-semibold text-gray-800">
              {activeTab === "Overview" ? "Renewal List" : activeTab} ({filteredRenewals.length})
            </h2>
            <div className="flex items-center gap-3">
              <label className="flex h-7 w-[205px] items-center gap-2 rounded-lg border border-gray-200 px-2.5 text-gray-400 focus-within:border-blue-400">
                <Search className="h-3.5 w-3.5 shrink-0" />
                <input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search renewals..."
                  className="min-w-0 flex-1 bg-transparent text-[10px] text-gray-700 outline-none placeholder:text-gray-400"
                />
              </label>
              <button
                type="button"
                title={viewMode === "table" ? "Switch to cards" : "Switch to table"}
                aria-label={viewMode === "table" ? "Switch to cards" : "Switch to table"}
                onClick={() => setViewMode(mode => mode === "table" ? "cards" : "table")}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50"
              >
                {viewMode === "table" ? <Grid2X2 className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {viewMode === "table" ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] table-fixed text-[10px]">
              <colgroup>
                <col style={{ width: "9%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "13.5%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10.5%" }} />
                <col style={{ width: "10.5%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "3.5%" }} />
              </colgroup>
              <thead>
                <tr className="h-8 border-b border-gray-100 bg-gray-50/80 text-[8px] font-semibold uppercase text-gray-500">
                  <th className="px-3 text-left">Renewal ID</th>
                  <th className="px-3 text-left">Product / License</th>
                  <th className="px-3 text-left">Client</th>
                  <th className="px-3 text-left">License Type</th>
                  <th className="px-3 text-left">
                    <button
                      type="button"
                      onClick={() => {
                        setSortDirection(direction => direction === "asc" ? "desc" : "asc");
                        setPage(1);
                      }}
                      className="inline-flex items-center gap-1 hover:text-gray-800"
                    >
                      Due Date <span className="text-gray-400">{sortDirection === "asc" ? "↑" : "↓"}</span>
                    </button>
                  </th>
                  <th className="px-3 text-left">Amount</th>
                  <th className="px-3 text-left">Renewal Status</th>
                  <th className="px-3 text-left">Auto Renew</th>
                  <th className="px-3 text-left">Status</th>
                  <th className="px-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedRenewal(row)}
                    className="h-[64px] cursor-pointer border-b border-gray-100 last:border-0 hover:bg-gray-50/60"
                  >
                    <td className="px-3 align-middle">
                      <button
                        type="button"
                        onClick={event => {
                          event.stopPropagation();
                          setSelectedRenewal(row);
                        }}
                        className="font-semibold text-blue-600 hover:underline"
                      >
                        {row.id}
                      </button>
                    </td>
                    <td className="px-3 align-middle">
                      <div className="flex items-start gap-2">
                        <BrandMark brand={row.brand} />
                        <div className="min-w-0">
                          <p className="font-semibold leading-[14px] text-gray-800">{row.product}</p>
                          <span className="mt-1 inline-flex rounded bg-purple-50 px-1.5 py-0.5 text-[8px] font-semibold uppercase text-purple-700">
                            Digital License
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 align-middle">
                      <p className="leading-[14px] text-gray-700">{row.client.split(" ").slice(0, 2).join(" ")}</p>
                      <p className="leading-[14px] text-gray-700">{row.client.split(" ").slice(2).join(" ")}</p>
                    </td>
                    <td className="px-3 align-middle">
                      <p className="leading-[14px] text-gray-700">{row.licenseType}</p>
                      <p className="leading-[14px] text-gray-700">{row.seats}</p>
                    </td>
                    <td className="px-3 align-middle">
                      <p className="text-gray-700">{row.dueDate}</p>
                      <p className={`mt-0.5 ${row.renewalStatus === "Overdue" ? "text-rose-600" : row.renewalStatus === "Due Soon" ? "text-amber-600" : "text-amber-600"}`}>
                        {row.dueIn}
                      </p>
                    </td>
                    <td className="px-3 align-middle font-semibold text-gray-800">{row.amount}</td>
                    <td className="px-3 align-middle">
                      <span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-semibold ${STATUS_STYLES[row.renewalStatus]}`}>
                        {row.renewalStatus}
                      </span>
                    </td>
                    <td className="px-3 align-middle">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-medium ${row.autoRenew === "Enabled" ? "text-gray-700" : "text-gray-500"}`}>
                        {row.autoRenew === "Enabled" ? (
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3 text-gray-400" />
                        )}
                        {row.autoRenew}
                      </span>
                    </td>
                    <td className="px-3 align-middle">
                      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-600">
                        Active
                      </span>
                    </td>
                    <td className="px-2 text-center align-middle">
                      <RenewalActionMenu
                        row={row}
                        open={actionMenuId === row.id}
                        onToggle={() => setActionMenuId(actionMenuId === row.id ? null : row.id)}
                        onEdit={() => editRenewal(row)}
                        onRenew={() => markRenewed(row)}
                        onRemove={() => removeRenewal(row)}
                      />
                    </td>
                  </tr>
                ))}
                {visibleRows.length === 0 && (
                  <tr>
                    <td colSpan={10} className="h-40 text-center text-xs text-gray-400">
                      No renewals match the selected filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          ) : (
            <div className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3">
              {visibleRows.map(row => (
                <article
                  key={row.id}
                  onClick={() => setSelectedRenewal(row)}
                  className="cursor-pointer rounded-lg border border-gray-200 p-3 transition-colors hover:border-blue-200 hover:bg-blue-50/20"
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={event => {
                        event.stopPropagation();
                        setSelectedRenewal(row);
                      }}
                      className="font-semibold text-blue-600 hover:underline"
                    >
                      {row.id}
                    </button>
                    <RenewalActionMenu
                      row={row}
                      open={actionMenuId === row.id}
                      onToggle={() => setActionMenuId(actionMenuId === row.id ? null : row.id)}
                      onEdit={() => editRenewal(row)}
                      onRenew={() => markRenewed(row)}
                      onRemove={() => removeRenewal(row)}
                    />
                  </div>
                  <div className="mt-3 flex items-start gap-2">
                    <BrandMark brand={row.brand} />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-gray-800">{row.product}</p>
                      <p className="mt-1 truncate text-[10px] text-gray-500">{row.client}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
                    <div><span className="block text-gray-400">Due date</span><span className="font-medium text-gray-700">{row.dueDate}</span></div>
                    <div><span className="block text-gray-400">Amount</span><span className="font-semibold text-gray-800">{row.amount}</span></div>
                    <div><span className="block text-gray-400">Renewal</span><span className={`font-medium ${row.renewalStatus === "Overdue" ? "text-rose-600" : "text-amber-600"}`}>{row.dueIn}</span></div>
                    <div><span className="block text-gray-400">Auto renew</span><span className="font-medium text-gray-700">{row.autoRenew}</span></div>
                  </div>
                </article>
              ))}
              {visibleRows.length === 0 && (
                <p className="col-span-full py-12 text-center text-xs text-gray-400">No renewals match the selected filters</p>
              )}
            </div>
          )}

          <footer className="flex h-10 items-center justify-between border-t border-gray-100 px-3.5">
            <span className="text-[10px] text-gray-500">
              {filteredRenewals.length > 0
                ? `Showing ${(safePage - 1) * pageSize + 1} to ${Math.min(safePage * pageSize, filteredRenewals.length)} of ${filteredRenewals.length} renewals`
                : "Showing 0 renewals"}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage === 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
                <button
                  type="button"
                  key={number}
                  onClick={() => setPage(number)}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg border text-[10px] font-medium transition-colors ${
                    safePage === number
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {number}
                </button>
              ))}
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPageSize(current => current === 10 ? 20 : current === 20 ? 50 : 10)}
                className="ml-2 flex h-7 items-center gap-3 rounded-lg border border-gray-200 px-2.5 text-[10px] text-gray-700 transition-colors hover:bg-gray-50"
              >
                {pageSize} / page
                <ChevronDown className="h-3 w-3 text-gray-500" />
              </button>
            </div>
          </footer>
        </section>
        )}
      </main>
      {showNewRenewal && (
        <RenewalFormModal
          initial={editingRenewal}
          onClose={() => {
            setShowNewRenewal(false);
            setEditingRenewal(undefined);
          }}
          onSave={saveRenewal}
        />
      )}
    </div>
  );
}