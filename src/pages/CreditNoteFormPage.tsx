import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Plus,
  ReceiptIndianRupee,
  Save,
  StickyNote,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { getClients } from "@/lib/clientStore";
import type { StoredClient } from "@/lib/clientStore";
import { safeReadJson } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
type Reason =
  | "Sales Return"
  | "Post Sale Discount"
  | "Deficiency in service"
  | "Correction in invoice"
  | "Change in POS"
  | "Finalization of Provisional assessment"
  | "Others";

type CreditStatus = "draft" | "open";

interface CreditItem {
  itemName: string;
  account: string;
  description: string;
  hsnSac: string;
  quantity: number;
  rate: number;
  discount: number;
  taxRate: number;
}

interface CreditNoteEntry {
  id: string;
  creditNoteNumber: string;
  referenceNumber: string;
  customerName: string;
  customerAddress: string;
  customerGstin: string;
  customerEmail: string;
  customerPhone: string;
  invoiceNumber: string;
  invoiceDate: string;
  issueDate: string;
  reason: Reason;
  placeOfSupply: string;
  status: CreditStatus;
  item: CreditItem;
  shippingCharges: number;
  adjustment: number;
  subtotal: number;
  total: number;
  creditsRemaining: number;
  totalInWords: string;
  notes: string;
  terms: string;
  taxMode: "tds" | "tcs";
}

// ── Constants ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = "nido_credit_notes_v3";

const REASONS: Reason[] = [
  "Sales Return",
  "Post Sale Discount",
  "Deficiency in service",
  "Correction in invoice",
  "Change in POS",
  "Finalization of Provisional assessment",
  "Others",
];

const today = () => new Date().toISOString().slice(0, 10);

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const numberToWords = (value: number): string => {
  const units = ["Zero","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  const convert = (num: number): string => {
    if (num < 20) return units[num];
    if (num < 100) return `${tens[Math.floor(num / 10)]}${num % 10 ? ` ${units[num % 10]}` : ""}`;
    if (num < 1000) { const rem = num % 100; return `${units[Math.floor(num / 100)]} Hundred${rem ? ` ${convert(rem)}` : ""}`; }
    if (num < 100000) { const rem = num % 1000; return `${convert(Math.floor(num / 1000))} Thousand${rem ? ` ${convert(rem)}` : ""}`; }
    return String(num);
  };
  return `Indian Rupee ${convert(Math.max(0, Math.round(value)))} Only`;
};

const computeTotals = (item: CreditItem, shippingCharges: number, adjustment: number) => {
  const base = Math.max(0, item.quantity * item.rate - item.discount);
  const taxAmt = Math.round(base * (item.taxRate / 100) * 100) / 100;
  const total = Math.round((base + taxAmt + shippingCharges + adjustment) * 100) / 100;
  return {
    subtotal: Math.round(base * 100) / 100,
    taxAmount: taxAmt,
    total,
    creditsRemaining: total,
    totalInWords: numberToWords(total),
  };
};

function nextCode(prefix: string, existing: string[], pad = 5): string {
  const nums = existing
    .map((s) => { const m = s.match(/(\d+)$/); return m ? parseInt(m[1], 10) : 0; })
    .filter((n) => Number.isFinite(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${String(next).padStart(pad, "0")}`;
}

function buildAddress(c: StoredClient): string {
  const parts = [
    c.billingAddress || c.locationDetails?.address || c.address || "",
    c.billingCity || "",
    [c.billingState || c.locationDetails?.state || "", c.billingPincode || ""].filter(Boolean).join(" "),
    "India",
  ].filter(Boolean);
  return parts.join("\n");
}

// ── Shared style tokens ───────────────────────────────────────────────────────
const inp = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white placeholder-gray-400 transition-colors";
const ta = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white placeholder-gray-400 transition-colors resize-none";

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl mb-5 overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-3.5 border-b border-gray-100 bg-gray-50/70">
        <div className="w-1 h-4 bg-blue-600 rounded-full shrink-0" />
        {Icon && <Icon size={14} className="text-blue-600 shrink-0" />}
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-700">{title}</h3>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ── Default blank form ────────────────────────────────────────────────────────
function blankForm(creditNoteNumber: string): CreditNoteEntry {
  return {
    id: `cn-${Date.now()}`,
    creditNoteNumber,
    referenceNumber: "",
    customerName: "",
    customerAddress: "",
    customerGstin: "",
    customerEmail: "",
    customerPhone: "",
    invoiceNumber: "",
    invoiceDate: "",
    issueDate: today(),
    reason: "Sales Return",
    placeOfSupply: "",
    status: "draft",
    item: { itemName: "", account: "Sales", description: "", hsnSac: "", quantity: 1, rate: 0, discount: 0, taxRate: 0 },
    shippingCharges: 0,
    adjustment: 0,
    subtotal: 0,
    total: 0,
    creditsRemaining: 0,
    totalInWords: "",
    notes: "",
    terms: "",
    taxMode: "tds",
  };
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CreditNoteFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;

  const [clients, setClients] = useState<StoredClient[]>([]);
  const [selectedClient, setSelectedClient] = useState<StoredClient | null>(null);
  const [notes, setNotes] = useState<CreditNoteEntry[]>([]);
  const [form, setForm] = useState<CreditNoteEntry | null>(null);
  const [saving, setSaving] = useState(false);

  // Load clients and existing notes from localStorage on mount
  useEffect(() => {
    const allClients = getClients();
    setClients(allClients);

    const stored = safeReadJson<CreditNoteEntry[]>(STORAGE_KEY, []);
    const list: CreditNoteEntry[] = Array.isArray(stored) ? stored : [];
    setNotes(list);

    if (isEdit && id) {
      const existing = list.find((n) => n.id === id);
      if (existing) {
        setForm(existing);
        // pre-select matching client
        const match = allClients.find((c) => c.name === existing.customerName);
        if (match) setSelectedClient(match);
      } else {
        toast.error("Credit note not found");
        navigate("/sales/credit-notes", { replace: true });
      }
    } else {
      // generate next credit note number
      const prefix = "CN";
      const cn = nextCode(prefix, list.map((n) => n.creditNoteNumber), 5);
      setForm(blankForm(cn));
    }
  }, []);

  // Handle customer selection — fetch and auto-fill all related fields
  const handleCustomerSelect = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    setSelectedClient(client);
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        customerName: client.name,
        customerAddress: buildAddress(client),
        customerGstin: client.gst || client.gstin || client.locationDetails?.gstin || "",
        customerEmail: client.email || "",
        customerPhone: client.phone || client.mobile || "",
        placeOfSupply: client.billingState || client.locationDetails?.state || prev.placeOfSupply,
      };
    });
  };

  const setField = <K extends keyof CreditNoteEntry>(key: K, val: CreditNoteEntry[K]) =>
    setForm((prev) => prev ? { ...prev, [key]: val } : prev);

  const setItemField = <K extends keyof CreditItem>(key: K, val: CreditItem[K]) =>
    setForm((prev) => prev ? { ...prev, item: { ...prev.item, [key]: val } } : prev);

  const computed = useMemo(() => {
    if (!form) return { subtotal: 0, taxAmount: 0, total: 0, creditsRemaining: 0, totalInWords: "" };
    return computeTotals(form.item, form.shippingCharges, form.adjustment);
  }, [form?.item, form?.shippingCharges, form?.adjustment]);

  const handleSave = (status: CreditStatus) => {
    if (!form) return;
    if (!form.customerName.trim()) { toast.error("Customer name is required"); return; }
    if (!form.creditNoteNumber.trim()) { toast.error("Credit Note # is required"); return; }
    setSaving(true);
    const payload: CreditNoteEntry = {
      ...form,
      status,
      subtotal: computed.subtotal,
      total: computed.total,
      creditsRemaining: computed.creditsRemaining,
      totalInWords: computed.totalInWords,
    };
    const updated = isEdit
      ? notes.map((n) => n.id === id ? payload : n)
      : [payload, ...notes];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    toast.success(isEdit ? "Credit note updated" : `Credit note ${payload.creditNoteNumber} created`);
    navigate("/sales/credit-notes");
  };

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading…</div>
      </div>
    );
  }

  const itemAmount = Math.max(0, form.item.quantity * form.item.rate - form.item.discount);
  const taxAmt = Math.round(itemAmount * (form.item.taxRate / 100) * 100) / 100;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Top Bar ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/sales/credit-notes")}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <p className="text-[11px] text-gray-400 font-medium">Sales › Credit Notes</p>
              <h1 className="text-base font-bold text-gray-900 leading-tight">
                {isEdit ? `Edit ${form.creditNoteNumber}` : "New Credit Note"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/sales/credit-notes")}
              className="px-4 py-2 text-sm font-semibold border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave("draft")}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Save size={15} /> Save as Draft
            </button>
            <button
              onClick={() => handleSave("open")}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save size={15} /> Save as Open
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

        {/* ── Left column ── */}
        <div>

          {/* Customer & Reference */}
          <Section title="Customer & Reference Details" icon={User}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

              {/* Customer Name dropdown */}
              <div className="sm:col-span-2 lg:col-span-1">
                <FieldLabel required>Customer Name</FieldLabel>
                <select
                  className={`${inp} ${!form.customerName ? "text-gray-400" : "text-gray-900"}`}
                  value={selectedClient?.id || ""}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                >
                  <option value="">Select a customer…</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel required>Credit Note #</FieldLabel>
                <input className={inp} value={form.creditNoteNumber} onChange={(e) => setField("creditNoteNumber", e.target.value)} />
              </div>

              <div>
                <FieldLabel>Reference #</FieldLabel>
                <input className={inp} placeholder="e.g. 142012681" value={form.referenceNumber} onChange={(e) => setField("referenceNumber", e.target.value)} />
              </div>

              <div>
                <FieldLabel required>Credit Note Date</FieldLabel>
                <input type="date" className={inp} value={form.issueDate} onChange={(e) => setField("issueDate", e.target.value)} />
              </div>

              <div>
                <FieldLabel>Reason</FieldLabel>
                <select className={inp} value={form.reason} onChange={(e) => setField("reason", e.target.value as Reason)}>
                  {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div>
                <FieldLabel>Invoice #</FieldLabel>
                <input className={inp} placeholder="e.g. INV-001" value={form.invoiceNumber} onChange={(e) => setField("invoiceNumber", e.target.value)} />
              </div>

              <div>
                <FieldLabel>Invoice Date</FieldLabel>
                <input type="date" className={inp} value={form.invoiceDate} onChange={(e) => setField("invoiceDate", e.target.value)} />
              </div>

              <div>
                <FieldLabel>Place of Supply</FieldLabel>
                <input className={inp} placeholder="e.g. Karnataka" value={form.placeOfSupply} onChange={(e) => setField("placeOfSupply", e.target.value)} />
              </div>
            </div>
          </Section>

          {/* Customer Details (auto-filled, editable) */}
          <Section title="Customer Details" icon={User}>
            {selectedClient ? (
              <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">{selectedClient.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-800">{selectedClient.name}</p>
                  {selectedClient.email && <p className="text-xs text-blue-600 mt-0.5">{selectedClient.email}</p>}
                  {selectedClient.phone && <p className="text-xs text-blue-500">{selectedClient.phone}</p>}
                  <p className="text-[11px] text-blue-400 mt-1">Fields below are auto-filled — you can edit them.</p>
                </div>
              </div>
            ) : (
              <div className="mb-4 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-400 italic">
                Select a customer above to auto-fill billing details.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <FieldLabel>Billing Address</FieldLabel>
                <textarea
                  className={ta}
                  rows={4}
                  placeholder="Enter billing address"
                  value={form.customerAddress}
                  onChange={(e) => setField("customerAddress", e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>GSTIN</FieldLabel>
                <input className={inp} placeholder="e.g. 29AABCP1234R1Z0" value={form.customerGstin} onChange={(e) => setField("customerGstin", e.target.value)} />
              </div>
              <div>
                <FieldLabel>Email</FieldLabel>
                <input type="email" className={inp} placeholder="customer@email.com" value={form.customerEmail} onChange={(e) => setField("customerEmail", e.target.value)} />
              </div>
              <div>
                <FieldLabel>Phone</FieldLabel>
                <input className={inp} placeholder="+91 98765 43210" value={form.customerPhone} onChange={(e) => setField("customerPhone", e.target.value)} />
              </div>
            </div>
          </Section>

          {/* Item Table */}
          <Section title="Item Details" icon={FileText}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    {["Item Name", "Account", "HSN/SAC", "Qty", "Rate (₹)", "Disc (₹)", "Tax %", "Amount (₹)"].map((h) => (
                      <th key={h} className="pb-2 pr-3 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 last:pr-0 last:text-right">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="align-top">
                    <td className="pt-3 pr-3">
                      <input className={inp} placeholder="Item name" value={form.item.itemName} onChange={(e) => setItemField("itemName", e.target.value)} />
                    </td>
                    <td className="pt-3 pr-3 w-28">
                      <input className={inp} placeholder="Account" value={form.item.account} onChange={(e) => setItemField("account", e.target.value)} />
                    </td>
                    <td className="pt-3 pr-3 w-24">
                      <input className={inp} placeholder="HSN/SAC" value={form.item.hsnSac} onChange={(e) => setItemField("hsnSac", e.target.value)} />
                    </td>
                    <td className="pt-3 pr-3 w-20">
                      <input type="number" min="0" className={inp} value={form.item.quantity} onChange={(e) => setItemField("quantity", toNumber(e.target.value, 1))} />
                    </td>
                    <td className="pt-3 pr-3 w-24">
                      <input type="number" min="0" className={inp} value={form.item.rate} onChange={(e) => setItemField("rate", toNumber(e.target.value))} />
                    </td>
                    <td className="pt-3 pr-3 w-24">
                      <input type="number" min="0" className={inp} value={form.item.discount} onChange={(e) => setItemField("discount", toNumber(e.target.value))} />
                    </td>
                    <td className="pt-3 pr-3 w-20">
                      <input type="number" min="0" max="100" className={inp} value={form.item.taxRate} onChange={(e) => setItemField("taxRate", toNumber(e.target.value))} />
                    </td>
                    <td className="pt-3 w-28">
                      <input readOnly className={`${inp} text-right bg-gray-50 font-semibold text-gray-700 cursor-default`} value={(itemAmount + taxAmt).toFixed(2)} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Description */}
            <div className="mt-4">
              <FieldLabel>Description</FieldLabel>
              <input className={inp} placeholder="Item description (optional)" value={form.item.description} onChange={(e) => setItemField("description", e.target.value)} />
            </div>

            {/* Add row placeholder */}
            <button
              type="button"
              onClick={() => toast.info("Multiple line items coming soon")}
              className="mt-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              <Plus size={13} /> Add Another Item
            </button>
          </Section>

          {/* Notes & Terms */}
          <Section title="Notes & Terms" icon={StickyNote}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Customer Notes</FieldLabel>
                <textarea className={ta} rows={4} placeholder="e.g. Clarification will be made on the post quality check…" value={form.notes} onChange={(e) => setField("notes", e.target.value)} />
              </div>
              <div>
                <FieldLabel>Terms & Conditions</FieldLabel>
                <textarea className={ta} rows={4} placeholder="e.g. Price mentioned are excluding Taxes." value={form.terms} onChange={(e) => setField("terms", e.target.value)} />
              </div>
            </div>
          </Section>

        </div>

        {/* ── Right column — Summary ── */}
        <div className="space-y-4 sticky top-20">

          {/* Totals card */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50/70">
              <div className="w-1 h-4 bg-blue-600 rounded-full shrink-0" />
              <ReceiptIndianRupee size={14} className="text-blue-600" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-700">Amount Summary</h3>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Sub Total</span>
                <span className="font-semibold text-gray-800">₹{computed.subtotal.toFixed(2)}</span>
              </div>
              {form.item.taxRate > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax ({form.item.taxRate}%)</span>
                  <span className="font-semibold text-gray-800">₹{computed.taxAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-gray-500">Shipping</span>
                <input
                  type="number"
                  min="0"
                  className="w-28 px-2 py-1 text-sm text-right border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  value={form.shippingCharges}
                  onChange={(e) => setField("shippingCharges", toNumber(e.target.value))}
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-gray-500">Adjustment</span>
                <input
                  type="number"
                  className="w-28 px-2 py-1 text-sm text-right border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  value={form.adjustment}
                  onChange={(e) => setField("adjustment", toNumber(e.target.value))}
                />
              </div>

              <div className="pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-blue-700">₹{computed.total.toFixed(2)}</span>
                </div>
                <div className="mt-2 flex justify-between text-xs text-blue-600">
                  <span>Credits Remaining</span>
                  <span className="font-semibold">₹{computed.creditsRemaining.toFixed(2)}</span>
                </div>
              </div>

              {computed.total > 0 && (
                <div className="text-[11px] text-gray-400 italic pt-1 border-t border-gray-100">
                  {computed.totalInWords}
                </div>
              )}
            </div>
          </div>

          {/* Tax Mode */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Tax Mode</h3>
            <div className="flex gap-4">
              {(["tds", "tcs"] as const).map((mode) => (
                <label key={mode} className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border transition-colors ${form.taxMode === mode ? "border-blue-400 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  <input
                    type="radio"
                    className="accent-blue-600"
                    checked={form.taxMode === mode}
                    onChange={() => setField("taxMode", mode)}
                  />
                  <span className="text-sm font-semibold">{mode.toUpperCase()}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Actions</h3>
            <button
              onClick={() => handleSave("open")}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save size={15} /> Save as Open
            </button>
            <button
              onClick={() => handleSave("draft")}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Save as Draft
            </button>
            <button
              onClick={() => navigate("/sales/credit-notes")}
              className="w-full px-4 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
