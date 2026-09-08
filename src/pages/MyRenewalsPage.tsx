import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
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
  Info,
  Bell,
  Mail,
  Eye,
  Home,
} from "lucide-react";
import jsPDF from "jspdf";
import { getClients, type StoredClient } from "@/lib/clientStore";
import { getCatalogProducts, type CatalogProduct } from "@/lib/catalogStore";
import { useMyOrders, type MyOrder } from "@/contexts/MyOrdersContext";

type RenewalStatus = "Overdue" | "Upcoming" | "Due Soon";
type AutoRenew = "Enabled" | "Disabled";

interface Renewal {
  id: string;
  product: string;
  brand: "microsoft" | "adobe" | "vmware" | "fortinet" | "other";
  client: string;
  licenseType: string;
  seats: string;
  dueDate: string;
  dueIn: string;
  amount: string;
  renewalStatus: RenewalStatus;
  autoRenew: AutoRenew;
  orderId?: string;
  orderDate?: string;
  deliveryDate?: string;
  currentExpiryDate?: string;
  renewalStartDate?: string;
  renewalTerm?: string;
  quantity?: string;
  unitPrice?: string;
  contractNo?: string;
  purchaseOrderNo?: string;
  reminders?: string[];
  notifyTo?: string[];
  notificationMessage?: string;
  notes?: string;
}

interface RenewalNote {
  id: string;
  author: string;
  date: string;
  text: string;
  visibility: "Internal Note" | "External Note";
}

type RenewalFormValues = Pick<
  Renewal,
  "product" | "brand" | "client" | "licenseType" | "seats" | "dueDate" | "amount" | "autoRenew"
>;

type RenewalWizardValues = {
  client: string;
  order: string;
  product: string;
  brand: Renewal["brand"];
  licenseType: string;
  orderDate: string;
  deliveryDate: string;
  currentExpiryDate: string;
  renewalStartDate: string;
  renewalTerm: string;
  quantity: string;
  unitPrice: string;
  contractNo: string;
  purchaseOrderNo: string;
  autoRenew: boolean;
  reminders: string[];
  notifyTo: string[];
  notificationMessage: string;
  notes: string;
};

type RenewalWizardProduct = {
  name: string;
  brand: Renewal["brand"];
  licenseType: string;
  quantity: string;
  unitPrice: string;
};

type RenewalWizardOrder = {
  id: string;
  clientId?: string;
  client: string;
  orderDate: string;
  deliveryDate: string;
  products: RenewalWizardProduct[];
};

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

const RENEWALS_STORAGE_KEY = "nidoRenewals";
const RENEWAL_HISTORY_STORAGE_KEY = "nidoRenewalHistory";

function readStoredRenewals(key: string, fallback: Renewal[]): Renewal[] {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.localStorage.getItem(key);
    if (!stored) return fallback;
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
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

function createEmptyRenewalWizardValues(): RenewalWizardValues {
  return {
  client: "",
  order: "",
  product: "",
  brand: "other",
  licenseType: "",
  orderDate: "",
  deliveryDate: "",
  currentExpiryDate: "",
  renewalStartDate: "",
  renewalTerm: "1 Year",
  quantity: "",
  unitPrice: "",
  contractNo: "",
  purchaseOrderNo: "",
  autoRenew: false,
  reminders: ["30"],
  notifyTo: [],
  notificationMessage: "Your license for {product_name} is expiring soon. Please review and renew to avoid service interruption.",
  notes: "",
  };
}

function normalizeRenewalBrand(value: string | undefined): Renewal["brand"] {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("microsoft")) return "microsoft";
  if (normalized.includes("adobe")) return "adobe";
  if (normalized.includes("vmware")) return "vmware";
  if (normalized.includes("fortinet")) return "fortinet";
  return "other";
}

function formatSourceDate(value: string | undefined): string {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString().slice(0, 10);
}

function createRenewalWizardOrders(orders: MyOrder[], products: CatalogProduct[]): RenewalWizardOrder[] {
  return orders.map(order => ({
    id: order.id,
    clientId: order.clientId,
    client: order.client,
    orderDate: formatSourceDate(order.orderDate),
    deliveryDate: "",
    products: (order.cartItems || []).map(item => {
      const catalogProduct = products.find(product =>
        product.productName.trim().toLowerCase() === item.name.trim().toLowerCase()
      );
      return {
        name: item.name,
        brand: normalizeRenewalBrand(catalogProduct?.brand),
        licenseType: item.productType || catalogProduct?.productType || "",
        quantity: String(item.quantity || ""),
        unitPrice: String(item.priceNum || catalogProduct?.price || ""),
      };
    }),
  }));
}

function createInitialRenewalWizardValues(
  clients: StoredClient[],
  orders: RenewalWizardOrder[],
): RenewalWizardValues {
  const values = createEmptyRenewalWizardValues();
  const order = orders.find(item => item.products.length > 0);
  const product = order?.products[0];
  return {
    ...values,
    client: order?.client || clients[0]?.name || "",
    order: order?.id || "",
    product: product?.name || "",
    brand: product?.brand || "other",
    licenseType: product?.licenseType || "",
    orderDate: order?.orderDate || "",
    deliveryDate: order?.deliveryDate || "",
    quantity: product?.quantity || "",
    unitPrice: product?.unitPrice || "",
  };
}

function wizardDateLabel(value: string): string {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function wizardNextExpiryDate(startDate: string, term: string): string {
  const [year, month, day] = startDate.split("-").map(Number);
  if (!year || !month || !day) return "";
  const years = Number.parseInt(term, 10) || 1;
  const expiry = new Date(year + years, month - 1, day);
  expiry.setDate(expiry.getDate() - 1);
  return `${expiry.getFullYear()}-${String(expiry.getMonth() + 1).padStart(2, "0")}-${String(expiry.getDate()).padStart(2, "0")}`;
}

function WizardCard({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-gray-200 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-5 ${className}`}>
      <h2 className="mb-4 text-sm font-bold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

function WizardField({
  label,
  required = false,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="mb-1.5 block text-xs font-medium text-gray-600">
        {label} {required && <span className="text-rose-600">*</span>}
      </span>
      {children}
    </label>
  );
}

function WizardInput({
  value,
  onChange,
  placeholder,
  type = "text",
  readOnly = false,
}: {
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      readOnly={readOnly}
      onChange={event => onChange?.(event.target.value)}
      placeholder={placeholder}
      className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 read-only:bg-gray-50"
    />
  );
}

function WizardSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <span className="relative block">
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        className="h-10 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm text-gray-800 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    </span>
  );
}

function RenewalWizardStepper({ step }: { step: 1 | 2 | 3 | 4 }) {
  const steps = ["Select Order & Product", "Renewal Details", "Notifications", "Review & Create"];
  return (
    <div className="mb-5 grid grid-cols-4 gap-2">
      {steps.map((label, index) => {
        const number = index + 1;
        const complete = number < step;
        const active = number === step;
        return (
          <div key={label} className="flex min-w-0 items-center gap-2">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
              complete || active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"
            }`}>
              {complete ? <Check className="h-4 w-4" /> : number}
            </span>
            <span className={`hidden truncate text-xs sm:block ${active ? "font-semibold text-blue-700" : "text-gray-500"}`}>{label}</span>
            {number < 4 && <span className={`hidden h-px flex-1 sm:block ${complete ? "bg-blue-300" : "bg-gray-200"}`} />}
          </div>
        );
      })}
    </div>
  );
}

function RenewalProductSummary({
  values,
  nextExpiryDate,
  showOrderDetails = true,
}: {
  values: RenewalWizardValues;
  nextExpiryDate: string;
  showOrderDetails?: boolean;
}) {
  const estimatedAmount = (Number(values.quantity) || 0) * (Number(values.unitPrice) || 0);
  return (
    <aside className="rounded-xl border border-gray-200 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900">Selected Product</h2>
        <button type="button" className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50">
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
      </div>
      <div className="flex items-start gap-3 border-b border-gray-100 pb-4">
        <BrandMark brand={values.brand} />
        <div className="min-w-0">
          <p className="font-semibold text-gray-900">{values.product}</p>
          <span className="mt-1 inline-flex rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-purple-700">Digital License</span>
          <p className="mt-1 text-xs text-gray-500">{values.licenseType} | {values.quantity} Users</p>
        </div>
      </div>
      {showOrderDetails && (
        <div className="space-y-3 border-b border-gray-100 py-4 text-xs">
          <div className="flex justify-between gap-4"><span className="text-gray-500">Client</span><span className="text-right font-medium text-gray-800">{values.client}</span></div>
          <div className="flex justify-between gap-4"><span className="text-gray-500">Order ID</span><span className="font-medium text-gray-800">{values.order}</span></div>
          <div className="flex justify-between gap-4"><span className="text-gray-500">Order Date</span><span className="font-medium text-gray-800">{wizardDateLabel(values.orderDate)}</span></div>
          <div className="flex justify-between gap-4"><span className="text-gray-500">Delivery Date</span><span className="font-medium text-gray-800">{wizardDateLabel(values.deliveryDate)}</span></div>
          <div className="flex justify-between gap-4"><span className="text-gray-500">Current Expiry</span><span className="font-medium text-gray-800">{wizardDateLabel(values.currentExpiryDate)} <span className="ml-1 rounded-full bg-emerald-50 px-2 py-1 text-emerald-600">Active</span></span></div>
        </div>
      )}
      <div className="space-y-3 border-b border-gray-100 py-4 text-xs">
        <div className="flex justify-between gap-4"><span className="text-gray-500">Renewal Term</span><span className="font-medium text-gray-800">{values.renewalTerm}</span></div>
        <div className="flex justify-between gap-4"><span className="text-gray-500">Quantity / Users</span><span className="font-medium text-gray-800">{values.quantity}</span></div>
        <div className="flex justify-between gap-4"><span className="text-gray-500">Unit Price</span><span className="font-semibold text-gray-800">{formatCurrencyAmount(values.unitPrice)}</span></div>
        {nextExpiryDate && <div className="flex justify-between gap-4"><span className="text-gray-500">Next Expiry Date</span><span className="font-medium text-gray-800">{wizardDateLabel(nextExpiryDate)}</span></div>}
      </div>
      <div className="pt-4">
        <p className="text-xs font-medium text-gray-600">Estimated Renewal Amount</p>
        <p className="mt-1 text-2xl font-bold text-blue-600">{formatCurrencyAmount(String(estimatedAmount))}</p>
        <p className="text-xs text-gray-500">(Inclusive of applicable taxes)</p>
      </div>
      <div className="mt-5 rounded-lg bg-blue-50 p-3 text-xs text-blue-900">
        <div className="flex items-start gap-2"><Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" /><div><p className="font-semibold">Reminder & Auto Renewal</p><p className="mt-1 text-blue-800">You will be notified before the expiry date. Auto renewal can be enabled later from the renewal details page.</p></div></div>
      </div>
    </aside>
  );
}

function NewRenewalWizard({
  onCancel,
  onCreate,
  onView,
  initialValues,
  clients,
  orders,
}: {
  onCancel: () => void;
  onCreate: (values: RenewalWizardValues) => Renewal;
  onView: (renewal: Renewal) => void;
  initialValues: RenewalWizardValues;
  clients: StoredClient[];
  orders: RenewalWizardOrder[];
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [values, setValues] = useState<RenewalWizardValues>(initialValues);
  const [createdRenewal, setCreatedRenewal] = useState<Renewal>();
  const nextExpiryDate = wizardNextExpiryDate(values.renewalStartDate, values.renewalTerm);
  const estimatedAmount = (Number(values.quantity) || 0) * (Number(values.unitPrice) || 0);
  const selectedOrder = orders.find(order => order.id === values.order);
  const availableProducts = selectedOrder?.products || [];
  const canCreate = Boolean(
    values.order &&
    values.product &&
    values.renewalStartDate &&
    values.quantity &&
    values.unitPrice,
  );

  const update = <K extends keyof RenewalWizardValues>(key: K, value: RenewalWizardValues[K]) => {
    setValues(current => ({ ...current, [key]: value }));
  };

  const selectOrder = (orderId: string) => {
    const order = orders.find(item => item.id === orderId);
    const product = order?.products[0];
    setValues(current => ({
      ...current,
      order: orderId,
      client: order?.client || current.client,
      orderDate: order?.orderDate || "",
      deliveryDate: order?.deliveryDate || "",
      product: product?.name || "",
      brand: product?.brand || "other",
      licenseType: product?.licenseType || "",
      quantity: product?.quantity || "",
      unitPrice: product?.unitPrice || "",
    }));
  };

  const selectClient = (clientName: string) => {
    const selectedClient = clients.find(client => client.name === clientName);
    const relatedOrders = orders.filter(order =>
      (selectedClient?.id && order.clientId === selectedClient.id) ||
      order.client === clientName
    );
    const order = relatedOrders.find(item => item.products.length > 0) || relatedOrders[0];
    const product = order?.products[0];
    setValues(current => ({
      ...current,
      client: clientName,
      order: order?.id || "",
      product: product?.name || "",
      brand: product?.brand || "other",
      licenseType: product?.licenseType || "",
      orderDate: order?.orderDate || "",
      deliveryDate: order?.deliveryDate || "",
      quantity: product?.quantity || "",
      unitPrice: product?.unitPrice || "",
      currentExpiryDate: "",
      renewalStartDate: "",
      contractNo: "",
      purchaseOrderNo: "",
    }));
  };

  const selectProduct = (productName: string) => {
    const product = availableProducts.find(item => item.name === productName);
    setValues(current => ({
      ...current,
      product: productName,
      brand: product?.brand || "other",
      licenseType: product?.licenseType || "",
      quantity: product?.quantity || current.quantity,
      unitPrice: product?.unitPrice || current.unitPrice,
    }));
  };

  const toggleNotifyTo = (name: string) => {
    update("notifyTo", values.notifyTo.includes(name)
      ? values.notifyTo.filter(item => item !== name)
      : [...values.notifyTo, name]);
  };

  const addReminder = () => update("reminders", [...values.reminders, "3"]);
  const updateReminder = (index: number, value: string) => update("reminders", values.reminders.map((item, itemIndex) => itemIndex === index ? value : item));

  const goNext = () => setStep(current => Math.min(4, current + 1) as 1 | 2 | 3 | 4);
  const goBack = () => setStep(current => Math.max(1, current - 1) as 1 | 2 | 3 | 4);
  const create = () => {
    if (canCreate) setCreatedRenewal(onCreate(values));
  };

  if (createdRenewal) {
    return (
      <div className="renewals-page min-h-screen bg-[#fbfcfe] px-3 pb-10 pt-5 text-gray-900 sm:px-7 sm:pt-7">
        <RenewalTypography />
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-4 flex items-center gap-2 text-xs text-gray-500"><Home className="h-3.5 w-3.5" /> Home <ChevronRight className="h-3.5 w-3.5" /> Renewals <ChevronRight className="h-3.5 w-3.5" /> New Renewal <ChevronRight className="h-3.5 w-3.5" /><span className="rounded bg-emerald-50 px-2 py-1 text-emerald-700">Success</span></div>
          <section className="rounded-xl border border-emerald-100 bg-emerald-50 p-5 sm:p-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg"><Check className="h-9 w-9" /></div><div><h1 className="text-2xl font-bold text-gray-900">Renewal Created Successfully!</h1><p className="mt-1 text-sm text-gray-600">The renewal has been created and reminder notifications have been scheduled.</p></div></div>
              <div className="rounded-lg bg-emerald-100 px-5 py-3"><p className="text-xs text-gray-600">Renewal ID</p><p className="text-2xl font-bold text-gray-900">{createdRenewal.id}</p><p className="text-xs text-gray-600">Created on {wizardDateLabel(new Date().toISOString().slice(0, 10))}</p></div>
              <div className="flex flex-col gap-2 sm:min-w-[190px]"><button type="button" onClick={() => onView(createdRenewal)} className="h-10 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700">View Renewal</button><button type="button" onClick={() => { setCreatedRenewal(undefined); setStep(1); setValues(initialValues); }} className="h-10 rounded-lg border border-gray-300 bg-white px-5 text-sm font-semibold text-blue-700 hover:bg-blue-50">Create Another Renewal</button></div>
            </div>
          </section>
          <WizardCard title="Renewal Summary" className="mt-4">
            <div className="grid gap-5 md:grid-cols-4">
              <div className="flex items-start gap-3 md:col-span-2"><BrandMark brand={values.brand} /><div><p className="font-semibold text-gray-900">{values.product}</p><span className="mt-1 inline-flex rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-purple-700">Digital License</span><p className="mt-1 text-xs text-gray-500">{values.licenseType} | {values.quantity} Users</p></div></div>
              <div className="space-y-2 text-sm"><p><span className="text-gray-500">Status</span> <span className="ml-4 rounded-full bg-blue-50 px-2 py-1 text-blue-700">Upcoming</span></p><p><span className="text-gray-500">Next Expiry Date</span> <strong className="ml-3">{wizardDateLabel(nextExpiryDate)}</strong></p><p><span className="text-gray-500">Renewal Term</span> <strong className="ml-8">{values.renewalTerm}</strong></p></div>
              <div className="space-y-2 text-sm"><p><span className="text-gray-500">Client</span> <strong className="float-right">{values.client}</strong></p><p><span className="text-gray-500">Order ID</span> <strong className="float-right">{values.order}</strong></p><p><span className="text-gray-500">Contract No.</span> <strong className="float-right">{values.contractNo}</strong></p></div>
            </div>
          </WizardCard>
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,2fr)_300px]">
            <WizardCard title="Reminder Schedule">
              <div className="overflow-hidden rounded-lg border border-gray-200"><table className="w-full text-sm"><thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Reminder Date</th><th className="px-3 py-2">Days Before Expiry</th><th className="px-3 py-2">Notify To</th><th className="px-3 py-2">Status</th></tr></thead><tbody>{values.reminders.map((days, index) => { const date = new Date(`${nextExpiryDate}T00:00:00`); date.setDate(date.getDate() - Number(days)); return <tr key={`${days}-${index}`} className="border-t border-gray-100"><td className="px-3 py-3">{index + 1}</td><td className="px-3 py-3">{date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td><td className="px-3 py-3">{days} days</td><td className="px-3 py-3">{values.notifyTo.join(", ")}</td><td className="px-3 py-3"><span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">Scheduled</span></td></tr>; })}</tbody></table></div>
            </WizardCard>
            <WizardCard title="Quick Actions"><div className="divide-y divide-gray-100 text-sm"><button type="button" onClick={() => onView(createdRenewal)} className="flex w-full items-center justify-between py-3 text-left text-gray-700 hover:text-blue-700"><span className="flex items-center gap-2"><Eye className="h-4 w-4 text-blue-600" /> View Renewal Details</span><ChevronRight className="h-4 w-4" /></button><button type="button" onClick={() => setCreatedRenewal(undefined)} className="flex w-full items-center justify-between py-3 text-left text-gray-700 hover:text-blue-700"><span className="flex items-center gap-2"><Pencil className="h-4 w-4 text-blue-600" /> Edit Renewal</span><ChevronRight className="h-4 w-4" /></button><button type="button" onClick={onCancel} className="flex w-full items-center justify-between py-3 text-left text-gray-700 hover:text-blue-700"><span className="flex items-center gap-2"><ArrowLeft className="h-4 w-4 text-blue-600" /> Back to Renewals</span><ChevronRight className="h-4 w-4" /></button></div></WizardCard>
          </div>
        </div>
      </div>
    );
  }

  const sidebar = <RenewalProductSummary values={values} nextExpiryDate={nextExpiryDate} />;

  return (
    <div className="renewals-page min-h-screen bg-[#fbfcfe] px-3 pb-10 pt-5 text-gray-900 sm:px-7 sm:pt-7">
      <RenewalTypography />
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-4 flex items-center gap-2 text-xs text-gray-500"><Home className="h-3.5 w-3.5" /> Home <ChevronRight className="h-3.5 w-3.5" /> Renewals <ChevronRight className="h-3.5 w-3.5" /><span className="rounded bg-blue-50 px-2 py-1 text-blue-700">New Renewal</span></div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Create New Renewal</h1>
        <p className="mt-1 text-sm text-gray-500">{step === 1 ? "Create a renewal for a product/service you have already purchased" : step === 2 ? "Set renewal details and reminder preferences" : step === 3 ? "Configure notification and reminder settings" : "Review the details and create the renewal"}</p>
        <div className="mt-5"><RenewalWizardStepper step={step} /></div>

        {step === 1 && (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <WizardCard title="1. Select Order & Product">
                <div className="grid gap-4 sm:grid-cols-2">
                  <WizardField label="Client" required><WizardSelect value={values.client} onChange={selectClient}><option value="" disabled>Select a client</option>{clients.map(client => <option key={client.id} value={client.name}>{client.name}</option>)}</WizardSelect></WizardField>
                  <WizardField label="Order" required><WizardSelect value={values.order} onChange={selectOrder}><option value="" disabled>Select an order</option>{orders.filter(order => { const selectedClient = clients.find(client => client.name === values.client); return (selectedClient?.id && order.clientId === selectedClient.id) || order.client === values.client; }).map(order => <option key={order.id} value={order.id}>{order.id}</option>)}</WizardSelect><span className="mt-1 block text-xs text-gray-500">{values.orderDate ? `Ordered on ${wizardDateLabel(values.orderDate)}${values.deliveryDate ? ` | Delivered on ${wizardDateLabel(values.deliveryDate)}` : ""}` : "Select an order to load its live details"}</span></WizardField>
                  <WizardField label="Product / License" required className="sm:col-span-2">
                    <WizardSelect value={values.product} onChange={selectProduct}><option value="" disabled>{availableProducts.length ? "Select a product from the order" : "Select an order first"}</option>{availableProducts.map(product => <option key={product.name} value={product.name}>{product.name}</option>)}</WizardSelect>
                  </WizardField>
                </div>
              </WizardCard>
              <WizardCard title="2. Renewal Details">
                <div className="grid gap-4 sm:grid-cols-2">
                  <WizardField label="Current Expiry Date"><WizardInput type="date" value={values.currentExpiryDate} onChange={value => update("currentExpiryDate", value)} /></WizardField>
                  <WizardField label="Renewal Start Date" required><WizardInput type="date" value={values.renewalStartDate} onChange={value => update("renewalStartDate", value)} /></WizardField>
                  <WizardField label="Renewal Term" required><WizardSelect value={values.renewalTerm} onChange={value => update("renewalTerm", value)}><option>1 Year</option><option>2 Years</option><option>3 Years</option></WizardSelect></WizardField>
                  <WizardField label="Quantity / Users" required><div className="flex"><WizardInput value={values.quantity} onChange={value => update("quantity", value)} /><span className="flex h-10 items-center rounded-r-lg border border-l-0 border-gray-200 bg-gray-50 px-3 text-xs text-gray-500">Users</span></div></WizardField>
                </div>
              </WizardCard>
              <WizardCard title="3. Renewal Notifications">
                <div className="grid gap-4 sm:grid-cols-2">
                  <WizardField label="Reminder Days Before Expiry" required><WizardSelect value={values.reminders[0] || ""} onChange={value => updateReminder(0, value)}><option value="" disabled>Select reminder days</option><option>30</option><option>15</option><option>7</option></WizardSelect></WizardField>
                  <WizardField label="Notify To" required><WizardSelect value={values.notifyTo.join(", ")} onChange={() => undefined}><option value="" disabled>{values.notifyTo.length ? values.notifyTo.join(", ") : "Choose recipients in Notifications"}</option></WizardSelect></WizardField>
                </div>
              </WizardCard>
              <WizardCard title="4. Additional Notes (Optional)">
                <textarea value={values.notes} onChange={event => update("notes", event.target.value)} maxLength={200} placeholder="Add any internal notes for this renewal..." className="min-h-[86px] w-full resize-none rounded-lg border border-gray-200 p-3 text-sm outline-none placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                <p className="mt-1 text-right text-xs text-gray-500">{values.notes.length} / 200</p>
              </WizardCard>
            </div>
            {sidebar}
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <WizardCard title="Renewal Details">
                <div className="grid gap-4 sm:grid-cols-2">
                  <WizardField label="Renewal Start Date" required><WizardInput type="date" value={values.renewalStartDate} onChange={value => update("renewalStartDate", value)} /></WizardField>
                  <WizardField label="Next Expiry Date"><WizardInput type="date" value={nextExpiryDate} readOnly /></WizardField>
                  <WizardField label="Renewal Term" required><WizardSelect value={values.renewalTerm} onChange={value => update("renewalTerm", value)}><option>1 Year</option><option>2 Years</option><option>3 Years</option></WizardSelect></WizardField>
                  <WizardField label="Quantity / Users" required><div className="flex"><WizardInput value={values.quantity} onChange={value => update("quantity", value)} /><span className="flex h-10 items-center rounded-r-lg border border-l-0 border-gray-200 bg-gray-50 px-3 text-xs text-gray-500">Users</span></div></WizardField>
                  <WizardField label="Unit Price"><WizardInput value={formatCurrencyAmount(values.unitPrice)} readOnly /></WizardField>
                  <WizardField label="Expected Renewal Amount"><WizardInput value={formatCurrencyAmount(String(estimatedAmount))} readOnly /></WizardField>
                  <WizardField label="Contract No."><WizardInput value={values.contractNo} onChange={value => update("contractNo", value)} /></WizardField>
                  <WizardField label="Purchase Order No. (Optional)"><WizardInput value={values.purchaseOrderNo} onChange={value => update("purchaseOrderNo", value)} placeholder="Enter PO number" /></WizardField>
                </div>
              </WizardCard>
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4"><div className="flex items-start justify-between gap-4"><div><h2 className="text-sm font-bold text-gray-900">Auto Renewal (Optional)</h2><p className="mt-2 text-sm font-semibold text-gray-800">Enable Auto Renewal</p><p className="text-xs text-gray-500">System will automatically create a renewal when the reminder is triggered.</p></div><button type="button" aria-pressed={values.autoRenew} onClick={() => update("autoRenew", !values.autoRenew)} className={`relative mt-1 h-6 w-11 rounded-full transition-colors ${values.autoRenew ? "bg-blue-600" : "bg-gray-300"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${values.autoRenew ? "translate-x-6" : "translate-x-1"}`} /></button></div><div className="mt-4 rounded-lg bg-blue-100/70 p-3 text-xs text-blue-800"><Info className="mr-2 inline h-4 w-4" />You can enable or change auto renewal anytime from the renewal details page.</div></div>
              <WizardCard title="Renewal Summary Note (Optional)"><textarea value={values.notes} onChange={event => update("notes", event.target.value)} maxLength={200} placeholder="Add any additional notes, special terms or instructions..." className="min-h-[86px] w-full resize-none rounded-lg border border-gray-200 p-3 text-sm outline-none placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /><p className="mt-1 text-right text-xs text-gray-500">{values.notes.length} / 200</p></WizardCard>
            </div>
            {sidebar}
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <WizardCard title="Reminder Settings">
                <div className="mb-4 rounded-lg bg-blue-50 p-3 text-xs text-blue-800"><Info className="mr-2 inline h-4 w-4" />Set when you want to be notified before the renewal expiry date. You can add multiple reminders.</div>
                <div className="grid gap-3 sm:grid-cols-3">{values.reminders.map((reminder, index) => <WizardField key={index} label={`Reminder ${index + 1}`} required><div className="flex"><WizardInput value={reminder} onChange={value => updateReminder(index, value)} /><span className="flex h-10 items-center rounded-r-lg border border-l-0 border-gray-200 bg-gray-50 px-3 text-xs text-gray-600">Days before expiry</span></div></WizardField>)}</div>
                <button type="button" onClick={addReminder} className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"><Plus className="h-3.5 w-3.5" /> Add Another Reminder</button>
              </WizardCard>
              <WizardCard title="Notification Channels">
                <p className="mb-4 text-sm text-gray-500">Choose who should receive renewal reminders.</p>
                <div className="grid gap-3 sm:grid-cols-2">{["System Owner (You)", "Client Admin", "Account Manager", "Finance Team"].map(name => <label key={name} className="flex items-center gap-2 text-sm text-gray-800"><input type="checkbox" checked={values.notifyTo.includes(name)} onChange={() => toggleNotifyTo(name)} className="h-4 w-4 rounded border-gray-300 accent-blue-600" />{name}</label>)}</div>
              </WizardCard>
              <WizardCard title="Notification Message (Optional)">
                <p className="mb-3 text-sm text-gray-500">This message will be included in the reminder email/notification.</p>
                <textarea value={values.notificationMessage} onChange={event => update("notificationMessage", event.target.value)} maxLength={500} className="min-h-[105px] w-full resize-none rounded-lg border border-gray-200 p-3 text-sm leading-6 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                <p className="mt-1 text-right text-xs text-gray-500">{values.notificationMessage.length} / 500</p>
                <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"><Mail className="mr-2 inline h-5 w-5" /><strong>Preview Reminder</strong><p className="ml-7 text-xs">You can preview the email/notification before creating the renewal.</p></div>
              </WizardCard>
            </div>
            {sidebar}
          </div>
        )}

        {step === 4 && (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-4">
              <WizardCard title="Review Renewal Information">
                <p className="mb-4 text-sm text-gray-500">Please review all details before creating the renewal. You can go back and make changes if needed.</p>
                <div className="space-y-4">
                  <div className="rounded-lg bg-gray-50 p-4"><h3 className="mb-3 text-sm font-bold text-gray-800">Order & Product</h3><div className="grid gap-3 text-sm sm:grid-cols-2"><div className="space-y-2"><p><span className="text-gray-500">Client :</span> <strong>{values.client || "—"}</strong></p><p><span className="text-gray-500">Order ID :</span> <strong>{values.order || "—"}</strong></p><p><span className="text-gray-500">Order Date :</span> <strong>{wizardDateLabel(values.orderDate)}</strong></p><p><span className="text-gray-500">Delivery Date :</span> <strong>{wizardDateLabel(values.deliveryDate)}</strong></p></div><div className="space-y-2"><p><span className="text-gray-500">Product / License :</span> <strong>{values.product || "—"}</strong></p><p><span className="text-gray-500">License Type :</span> <strong>{values.licenseType || "—"}</strong></p><p><span className="text-gray-500">Users / Quantity :</span> <strong>{values.quantity ? `${values.quantity} Users` : "—"}</strong></p><p><span className="text-gray-500">Unit Price :</span> <strong>{values.unitPrice ? formatCurrencyAmount(values.unitPrice) : "—"}</strong></p></div></div></div>
                  <div className="rounded-lg bg-gray-50 p-4"><h3 className="mb-3 text-sm font-bold text-gray-800">Renewal Details</h3><div className="grid gap-2 text-sm sm:grid-cols-2"><p><span className="text-gray-500">Renewal Start Date :</span> <strong>{wizardDateLabel(values.renewalStartDate)}</strong></p><p><span className="text-gray-500">Contract No. :</span> <strong>{values.contractNo}</strong></p><p><span className="text-gray-500">Next Expiry Date :</span> <strong>{wizardDateLabel(nextExpiryDate)}</strong></p><p><span className="text-gray-500">Purchase Order No. :</span> <strong>{values.purchaseOrderNo || "—"}</strong></p><p><span className="text-gray-500">Renewal Term :</span> <strong>{values.renewalTerm}</strong></p><p><span className="text-gray-500">Expected Amount :</span> <strong>{formatCurrencyAmount(String(estimatedAmount))}</strong></p></div></div>
                  <div className="rounded-lg bg-gray-50 p-4"><h3 className="mb-3 text-sm font-bold text-gray-800">Reminder & Notifications</h3><div className="grid gap-2 text-sm sm:grid-cols-2"><div className="space-y-2">{values.reminders.map((reminder, index) => <p key={index}><span className="text-gray-500">Reminder {index + 1} :</span> <strong>{reminder} days before expiry</strong></p>)}</div><div className="space-y-2"><p><span className="text-gray-500">Notify To :</span> <strong>{values.notifyTo.join(", ") || "—"}</strong></p><p><span className="text-gray-500">Auto Renewal :</span> <strong>{values.autoRenew ? "Enabled" : "Disabled"}</strong></p></div></div></div>
                  <div className="rounded-lg bg-gray-50 p-4"><h3 className="mb-2 text-sm font-bold text-gray-800">Message</h3><p className="text-sm text-gray-700">{values.notificationMessage}</p></div>
                </div>
              </WizardCard>
            </div>
            {sidebar}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-3">
          <button type="button" onClick={step === 1 ? onCancel : goBack} className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"><ArrowLeft className="h-4 w-4" /> {step === 1 ? "Cancel" : "Back"}</button>
           {step < 4 ? <button type="button" onClick={goNext} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700">Next <ChevronRight className="h-4 w-4" /></button> : <button type="button" onClick={create} disabled={!canCreate} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"><Check className="h-4 w-4" /> Create Renewal</button>}
        </div>
      </div>
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
    ? `Nido Tech License Details\n\nRenewal ID: ${row.id}\nProduct: ${row.product}\nClient: ${row.client}\nLicense type: ${row.licenseType || "—"}\nQuantity: ${row.seats}\nOrder ID: ${row.orderId || "—"}\nActivation domain: —\nLicense key: —\n`
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

function RenewalTypography() {
  return (
    <style>{`
      .renewals-page {
        font-family: 'Inter', 'Segoe UI', sans-serif;
        font-size: 13.5px;
      }
      .renewals-page [class~="text-[8px]"] {
        font-size: 12px !important;
      }
      .renewals-page [class~="text-[9px]"] {
        font-size: 13px !important;
      }
      .renewals-page [class~="text-[10px]"] {
        font-size: 13.5px !important;
      }
      .renewals-page [class~="text-[11px]"] {
        font-size: 14px !important;
      }
      .renewals-page [class~="text-[17px]"] {
        font-size: 22px !important;
      }
      .renewals-page [class~="text-[19px]"] {
        font-size: 24px !important;
      }
      .renewals-page [class~="leading-3.5"] {
        line-height: 1.5rem !important;
      }
      .renewals-page .renewal-list-table {
        width: 100%;
        table-layout: fixed;
      }
      .renewals-page .renewal-list-table th,
      .renewals-page .renewal-list-table td {
        overflow-wrap: anywhere;
        padding-left: 0.375rem !important;
        padding-right: 0.375rem !important;
      }
      .renewals-page textarea,
      .renewals-page input,
      .renewals-page select,
      .renewals-page button {
        font-family: inherit;
      }
    `}</style>
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
  const notesKey = `nido_renewal_notes_${row.id}`;
  const [noteText, setNoteText] = useState("");
  const [visibility, setVisibility] = useState<RenewalNote["visibility"]>("Internal Note");
  const [notes, setNotes] = useState<RenewalNote[]>([]);
  const amount = Number(row.amount.replace(/[^\d.-]/g, "").replace(/,/g, "")) || 0;
  const gst = amount * 0.18;
  const total = amount + gst;

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(notesKey) || "null");
      setNotes(Array.isArray(stored) ? stored : []);
    } catch {
      setNotes([]);
    }
    setNoteText("");
    setVisibility("Internal Note");
  }, [notesKey]);

  useEffect(() => {
    try {
      localStorage.setItem(notesKey, JSON.stringify(notes));
    } catch {
      // Notes remain available in the current view if browser storage is unavailable.
    }
  }, [notes, notesKey]);

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    const now = new Date();
    const date = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      + " " + now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    setNotes(current => [{
      id: `n${Date.now()}`,
      author: "System Owner",
      date,
      text: noteText.trim(),
      visibility,
    }, ...current]);
    setNoteText("");
  };
  const scrollToTab = (tab: DetailTab) => {
    setActiveTab(tab);
    document.getElementById(`renewal-detail-${tab.toLowerCase().replaceAll(" ", "-")}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="renewals-page min-h-screen bg-[#fbfcfe] px-3 pb-10 pt-5 text-gray-900 sm:px-7 sm:pt-7">
      <RenewalTypography />
      <header className="px-1.5 pb-3 pt-2 sm:px-2">
        <button type="button" onClick={onBack} className="mb-2 inline-flex items-center gap-1 text-[9px] text-gray-500 hover:text-blue-600">
          <ArrowLeft className="h-3 w-3" /> Back to Renewals
        </button>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[17px] font-bold leading-6 tracking-[-0.25px] text-gray-900">Renewal Details / #{row.id}</h1>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[8px] font-semibold text-emerald-700">Delivered</span>
            </div>
            <p className="mt-0.5 text-[9px] text-gray-500">Master Order {row.orderId ? `· ${row.orderId}` : ""} · Created on {wizardDateLabel(row.orderDate || "")}</p>
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
                <button type="button" onClick={() => { navigator.clipboard?.writeText(row.orderId || ""); setMenuOpen(false); }} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-[9px] text-gray-700 hover:bg-gray-50">Copy order ID</button>
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
          <p className="text-[8px] font-semibold uppercase text-gray-500">SLA Deadline: {wizardDateLabel(row.orderDate || "")}</p>
          <p className="mt-1 text-[9px] text-gray-600">Completed On: {wizardDateLabel(row.deliveryDate || "")}</p>
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
            <DetailField label="Payment Method" value="—" />
            <DetailField label="Payment Term" value="—" />
            <DetailField label="Billing Address" value="—" />
          </div>
        </DetailCard>
        <DetailCard title="Delivery Information">
          <div className="space-y-2.5">
            <DetailField label="Ship To" value="—" />
            <DetailField label="Delivery Type" value="—" />
            <DetailField label="Delivery Status" value={<span className="text-emerald-600">Delivered</span>} />
            <DetailField label="Delivered On" value={wizardDateLabel(row.deliveryDate || "")} />
          </div>
        </DetailCard>
        <DetailCard title="Requester / Client Information">
          <div className="space-y-2.5">
            <DetailField label="Name" value="—" />
            <DetailField label="Role" value="—" />
            <DetailField label="Organization" value={row.client} />
            <DetailField label="Client Operations" value="—" />
          </div>
        </DetailCard>
        <DetailCard title="Order Summary">
          <div className="space-y-2.5">
            <DetailField label="Master Order ID" value={row.orderId || "—"} />
            <DetailField label="Sub Orders" value="1" />
            <DetailField label="Total Items" value={row.product ? "1" : "0"} />
            <DetailField label="Total Amount" value={<span className="font-bold">{formatCurrencyAmount(String(total))}</span>} />
            <DetailField label="Created On" value={wizardDateLabel(row.orderDate || "")} />
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
               <tbody><tr className="border-b border-gray-100"><td className="py-3">1</td><td className="py-3"><div className="flex items-center gap-2"><BrandMark brand={row.brand} /><span className="font-semibold text-gray-700">{row.product || "—"}<span className="mt-1 block w-fit rounded bg-purple-50 px-1 text-[7px] font-semibold uppercase text-purple-700">{row.licenseType || "License"}</span></span></div></td><td>{row.licenseType || "—"}</td><td>{row.quantity || row.seats.replace(/[^\d]/g, "") || "—"}</td><td>{row.unitPrice ? formatCurrencyAmount(row.unitPrice) : formatCurrencyAmount(row.amount)}</td><td>{formatCurrencyAmount(row.amount)}</td><td><span className="rounded-full bg-emerald-50 px-1.5 py-1 text-[8px] font-semibold text-emerald-600">Delivered</span><span className="mt-1 block text-[7px] text-gray-400">Delivered on<br />{wizardDateLabel(row.deliveryDate || "")}</span></td><td className="text-blue-600">—</td></tr></tbody>
            </table>
          </div>
          <div className="mt-3 ml-auto w-56 space-y-1.5 text-right text-[9px]"><p>Sub-total (incl. GST) <span className="float-right font-semibold">{formatCurrencyAmount(String(amount))}</span></p><p>GST (18%) <span className="float-right font-semibold">{formatCurrencyAmount(String(gst))}</span></p><p className="border-t border-gray-200 pt-1.5 font-bold">Total Order Amount <span className="float-right">{formatCurrencyAmount(String(total))}</span></p></div>
        </DetailCard>

        <section id="renewal-detail-license-details">
          <DetailCard title="License Details">
            <div className="grid gap-4 md:grid-cols-3">
               <div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded bg-purple-50 text-purple-500"><ShieldCheck className="h-5 w-5" /></div><div className="space-y-2"><DetailField label="License Type" value={row.licenseType || "—"} /><DetailField label="License Model" value="Subscription" /><DetailField label="Quantity Licensed" value={row.seats} /><DetailField label="Vendor" value="—" /></div></div>
               <div className="space-y-2"><DetailField label="Activation / Tenant Domain" value="—" /><DetailField label="Assigned To" value={row.client} /><DetailField label="Assigned Users" value={row.quantity || row.seats} /><DetailField label="License Key / Notes" value={row.notes || "—"} /></div>
               <div className="space-y-2"><DetailField label="Start Date" value={wizardDateLabel(row.renewalStartDate || "")} /><DetailField label="End / Expiry Date" value={row.dueDate} /><DetailField label="Status" value={<span className="rounded-full bg-emerald-50 px-1.5 py-1 text-[8px] font-semibold text-emerald-600">Active</span>} /><DetailField label="Auto Renewal" value={<span className="text-emerald-600">● {row.autoRenew}</span>} /></div>
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
            <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-[9px]"><thead><tr className="border-b border-gray-100 text-left text-[8px] uppercase text-gray-400"><th className="pb-2">Renewal ID</th><th className="pb-2">Period</th><th className="pb-2">Amount</th><th className="pb-2">Status</th><th className="pb-2">Renewed On</th><th className="pb-2">Invoice</th></tr></thead><tbody>{row.renewalStartDate ? <tr><td className="py-2 text-blue-600">{row.id}</td><td>{wizardDateLabel(row.renewalStartDate)} – {row.dueDate}</td><td>{formatCurrencyAmount(row.amount)}</td><td><span className="rounded-full bg-blue-50 px-1.5 py-1 text-[8px] font-semibold text-blue-600">Upcoming</span></td><td>{wizardDateLabel(row.renewalStartDate)}</td><td><button type="button" onClick={() => downloadRenewalInvoice(row)} className="text-blue-600 hover:underline">Download ↓</button></td></tr> : <tr><td colSpan={6} className="py-4 text-center text-gray-400">No renewal history available</td></tr>}</tbody></table></div>
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
            <div className="overflow-x-auto"><table className="w-full min-w-[550px] text-[9px]"><thead><tr className="border-b border-gray-100 text-left text-[8px] uppercase text-gray-400"><th className="pb-2">Invoice ID</th><th className="pb-2">Invoice Date</th><th className="pb-2">Amount</th><th className="pb-2">Status</th><th className="pb-2">Due Date</th><th className="pb-2">Actions</th></tr></thead><tbody><tr><td className="py-2 text-blue-600">{row.id}-INV</td><td>{wizardDateLabel(row.orderDate || "")}</td><td>{formatCurrencyAmount(String(total))}</td><td><span className="rounded-full bg-gray-100 px-1.5 py-1 text-[8px] font-semibold text-gray-600">Pending</span></td><td>{row.dueDate || "—"}</td><td><button type="button" onClick={() => downloadRenewalInvoice(row)} className="text-blue-600 hover:underline">View</button><button type="button" onClick={() => downloadRenewalInvoice(row)} className="ml-2 rounded border border-gray-200 p-1 text-gray-500 hover:bg-gray-50" aria-label="Download invoice"><Download className="h-3 w-3" /></button></td></tr></tbody></table></div>
            <button type="button" onClick={() => scrollToTab("Invoices")} className="mt-3 block w-full text-center text-[9px] font-medium text-blue-600 hover:underline">View all invoices →</button>
          </DetailCard>
        </section>

        <section id="renewal-detail-activity-log">
          <DetailCard title="Activity Log">
            <div className="space-y-3 text-[9px]"><div className="flex gap-2"><Activity className="mt-0.5 h-3 w-3 text-blue-500" /><p><span className="font-semibold text-gray-700">Order delivered</span><span className="ml-2 text-gray-400">{wizardDateLabel(row.deliveryDate || "")}</span><br /><span className="text-gray-500">Delivery information from the selected order.</span></p></div><div className="flex gap-2"><Activity className="mt-0.5 h-3 w-3 text-gray-400" /><p><span className="font-semibold text-gray-700">Renewal created</span><span className="ml-2 text-gray-400">{wizardDateLabel(row.orderDate || "")}</span><br /><span className="text-gray-500">Renewal request was created from the selected order.</span></p></div></div>
          </DetailCard>
        </section>

        <section id="renewal-detail-notes">
          <DetailCard title="Notes">
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: "#111827", marginBottom: 1 }}>Notes</div>
              <div style={{ fontSize: 12.5, color: "#6b7280", marginBottom: 14 }}>
                {notes.length} note{notes.length !== 1 ? "s" : ""}
              </div>
              {notes.map((item, index) => (
                <div key={item.id} style={{ display: "flex", gap: 12, marginBottom: 14, paddingBottom: 14, borderBottom: index < notes.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                    {(item.author?.[0] || "S").toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 13.5, color: "#111827" }}>{item.author}</span>
                      <span style={{ fontSize: 12, color: "#9ca3af" }}>{item.date}</span>
                      <span style={{ fontSize: 11, background: item.visibility === "Internal Note" ? "#eff6ff" : "#faf5ff", color: item.visibility === "Internal Note" ? "#1d4ed8" : "#7c3aed", padding: "2px 8px", borderRadius: 10, fontWeight: 500 }}>
                        {item.visibility === "Internal Note" ? "🔒 Internal" : "🌐 Visible to client"}
                      </span>
                    </div>
                    <div style={{ fontSize: 13.5, color: "#374151", lineHeight: 1.6 }}>{item.text}</div>
                  </div>
                </div>
              ))}
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", marginTop: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 220px" }}>
                  <div style={{ padding: "14px 16px", borderRight: "1px solid #e5e7eb" }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 8, color: "#111827" }}>Add Note</div>
                    <textarea
                      value={noteText}
                      onChange={event => { if (event.target.value.length <= 500) setNoteText(event.target.value); }}
                      placeholder="Write your note here..."
                      rows={4}
                      style={{ width: "100%", border: "none", outline: "none", resize: "none", fontSize: 13.5, fontFamily: "inherit", color: "#374151", boxSizing: "border-box", background: "transparent" }}
                    />
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                      <div style={{ fontSize: 12, color: "#9ca3af" }}>{noteText.length} / 500</div>
                    </div>
                  </div>
                  <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 12 }}>Visibility</div>
                      {[
                        ["Internal Note", "🔒", "Only visible to internal users"],
                        ["External Note", "🌐", "Visible to the client on the portal"],
                      ].map(([label, icon, sub]) => (
                        <div key={label} onClick={() => setVisibility(label as RenewalNote["visibility"])} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14, cursor: "pointer" }}>
                          <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${visibility === label ? "#2563eb" : "#d1d5db"}`, background: visibility === label ? "#2563eb" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2, flexShrink: 0 }}>
                            {visibility === label && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: "#111827", display: "flex", alignItems: "center", gap: 5 }}>{icon} {label}</div>
                            <div style={{ fontSize: 11.5, color: "#9ca3af", marginTop: 1 }}>{sub}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        onClick={handleAddNote}
                        disabled={!noteText.trim()}
                        style={{ padding: "8px 22px", border: "none", borderRadius: 8, background: noteText.trim() ? "#2563eb" : "#93c5fd", color: "#fff", cursor: noteText.trim() ? "pointer" : "not-allowed", fontWeight: 600, fontSize: 13.5, fontFamily: "inherit" }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
    <div data-renewal-action-menu className={`relative inline-block ${open ? "z-50" : ""}`}>
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
        <div className="absolute right-0 top-7 z-50 w-48 rounded-lg border border-gray-200 bg-white p-1 text-left shadow-xl">
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
  const { orders: liveOrders } = useMyOrders();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Overview");
  const [renewals, setRenewals] = useState<Renewal[]>(() => readStoredRenewals(RENEWALS_STORAGE_KEY, RENEWALS));
  const [renewalHistory, setRenewalHistory] = useState<Renewal[]>(() => readStoredRenewals(RENEWAL_HISTORY_STORAGE_KEY, RENEWAL_HISTORY));
  const [liveClients, setLiveClients] = useState<StoredClient[]>(() => getClients());
  const [liveCatalog, setLiveCatalog] = useState<CatalogProduct[]>(() => getCatalogProducts());
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
  const liveWizardOrders = useMemo(
    () => createRenewalWizardOrders(liveOrders, liveCatalog),
    [liveCatalog, liveOrders],
  );
  const liveWizardInitialValues = useMemo(
    () => createInitialRenewalWizardValues(liveClients, liveWizardOrders),
    [liveClients, liveWizardOrders],
  );

  useEffect(() => {
    const reloadLiveSources = () => {
      setLiveClients(getClients());
      setLiveCatalog(getCatalogProducts());
    };
    window.addEventListener("nidoClientsUpdated", reloadLiveSources);
    window.addEventListener("catalogUpdated", reloadLiveSources);
    return () => {
      window.removeEventListener("nidoClientsUpdated", reloadLiveSources);
      window.removeEventListener("catalogUpdated", reloadLiveSources);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(RENEWALS_STORAGE_KEY, JSON.stringify(renewals));
  }, [renewals]);

  useEffect(() => {
    window.localStorage.setItem(RENEWAL_HISTORY_STORAGE_KEY, JSON.stringify(renewalHistory));
  }, [renewalHistory]);

  useEffect(() => {
    if (!actionMenuId) return;

    const closeMenuOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && !target.closest("[data-renewal-action-menu]")) {
        setActionMenuId(null);
      }
    };

    document.addEventListener("pointerdown", closeMenuOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeMenuOnOutsidePointer);
  }, [actionMenuId]);

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

  const createRenewalFromWizard = (values: RenewalWizardValues): Renewal => {
    const dueDateInput = wizardNextExpiryDate(values.renewalStartDate, values.renewalTerm);
    const dueDays = Math.ceil((new Date(`${dueDateInput}T00:00:00`).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    const total = (Number(values.quantity) || 0) * (Number(values.unitPrice) || 0);
    const renewal: Renewal = {
      id: `REN-${String(renewals.length + renewalHistory.length + 41).padStart(6, "0")}`,
      product: values.product,
      brand: values.brand,
      client: values.client,
      licenseType: values.licenseType,
      seats: `${values.quantity} Users`,
      dueDate: wizardDateLabel(dueDateInput),
      dueIn: dueDays < 0 ? `Overdue by ${Math.abs(dueDays)} days` : `Due in ${dueDays} days`,
      amount: formatCurrencyAmount(String(total)),
      renewalStatus: getRenewalStatus(dueDateInput),
      autoRenew: values.autoRenew ? "Enabled" : "Disabled",
      orderId: values.order,
      orderDate: values.orderDate,
      deliveryDate: values.deliveryDate,
      currentExpiryDate: values.currentExpiryDate,
      renewalStartDate: values.renewalStartDate,
      renewalTerm: values.renewalTerm,
      quantity: values.quantity,
      unitPrice: values.unitPrice,
      contractNo: values.contractNo,
      purchaseOrderNo: values.purchaseOrderNo,
      reminders: values.reminders,
      notifyTo: values.notifyTo,
      notificationMessage: values.notificationMessage,
      notes: values.notes,
    };
    setRenewals(current => [renewal, ...current]);
    return renewal;
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

  if (showNewRenewal && !editingRenewal) {
    return (
      <NewRenewalWizard
        onCancel={() => setShowNewRenewal(false)}
        onCreate={createRenewalFromWizard}
        initialValues={liveWizardInitialValues}
        clients={liveClients}
        orders={liveWizardOrders}
        onView={renewal => {
          setShowNewRenewal(false);
          setSelectedRenewal(renewal);
        }}
      />
    );
  }

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
    <div className="renewals-page min-h-screen bg-white px-1.5 pb-10 pt-5 text-gray-900 sm:pt-7">
      <RenewalTypography />
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
        <section className="overflow-visible rounded-[10px] border border-gray-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
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
          <div className="w-full overflow-visible">
            <table className="renewal-list-table text-[10px]">
              <colgroup>
                <col style={{ width: "9%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "5%" }} />
                <col style={{ width: "7%" }} />
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
      {showNewRenewal && editingRenewal && (
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