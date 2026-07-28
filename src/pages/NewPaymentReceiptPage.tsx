import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Save, CreditCard, FileText, StickyNote, Paperclip, Heart, X } from "lucide-react";
import { toast } from "sonner";
import { safeReadJson } from "@/lib/utils";
import { getClients } from "@/lib/clientStore";
import { getInvoices } from "@/lib/invoiceStore";

// ── Types ─────────────────────────────────────────────────────────────────────
interface PaymentReceipt {
  id: string;
  paymentNumber: string;
  customerName: string;
  invoiceNumber: string;
  paymentDate: string;
  paymentMode: string;
  amountReceived: number;
  taxDeducted: "no" | "tds";
  status: "draft" | "paid";
}

const STORAGE_KEY = "nido_payment_receipts_v3";

// ── Shared style tokens ───────────────────────────────────────────────────────
const inp =
  "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white placeholder-gray-400 transition-colors";
const sel =
  "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white transition-colors";
const ta =
  "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white placeholder-gray-400 transition-colors resize-none";

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
      {children}
      {required && <span className="text-red-400 ml-0.5 normal-case">*</span>}
    </label>
  );
}

function Section({ title, icon: Icon, children }: {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
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

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-5 py-2 text-sm font-semibold rounded-lg transition-colors ${
        active
          ? "bg-blue-600 text-white shadow-sm"
          : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function NewPaymentReceiptPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const locationState = (location.state || {}) as {
    customerName?: string;
    invoiceNumber?: string;
    amount?: number;
    email?: string;
  };

  const clients = getClients();
  const invoices = getInvoices();

  const [tab, setTab] = useState<"invoice" | "advance">("invoice");
  const [saving, setSaving] = useState(false);
  const [attachmentDraft, setAttachmentDraft] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);

  const [form, setForm] = useState({
    customerName: locationState.customerName || "",
    placeOfSupply: "[KA] - Karnataka",
    descriptionOfSupply: "",
    amountReceived: String(locationState.amount ?? ""),
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentNumber: `PR-${Date.now().toString().slice(-5)}`,
    paymentMode: "Cash",
    depositTo: "Petty Cash",
    reference: "",
    invoiceNumber: locationState.invoiceNumber || "",
    bankCharges: "",
    taxCode: "",
    taxDeducted: "no" as "no" | "tds",
    note: "",
    sendThankYou: true,
    recipients: [locationState.email || ""].filter(Boolean),
  });

  const setF = (field: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  const amountValue = Number(form.amountReceived) || 0;

  // Filter invoices for selected customer
  const customerInvoices = form.customerName
    ? invoices.filter((inv) =>
        inv.clientName.toLowerCase().includes(form.customerName.toLowerCase())
      )
    : invoices;

  const addAttachment = () => {
    const v = attachmentDraft.trim();
    if (!v) return;
    setAttachments((a) => [...a, v]);
    setAttachmentDraft("");
  };

  const handleSave = () => {
    if (!form.customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!form.amountReceived || amountValue <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setSaving(true);
    try {
      const existing = safeReadJson<PaymentReceipt[]>(STORAGE_KEY, []);
      const receipt: PaymentReceipt = {
        id: `pr-${Date.now()}`,
        paymentNumber: form.paymentNumber.trim() || `PR-${Date.now().toString().slice(-5)}`,
        customerName: form.customerName.trim(),
        invoiceNumber: form.invoiceNumber.trim(),
        paymentDate: form.paymentDate,
        paymentMode: form.paymentMode,
        amountReceived: amountValue,
        taxDeducted: form.taxDeducted,
        status: "paid",
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify([receipt, ...existing]));
      toast.success(`Receipt ${receipt.paymentNumber} saved`);
      if (form.sendThankYou && form.recipients.length > 0) {
        toast.info(`Thank you note queued for ${form.recipients.join(", ")}`);
      }
      navigate("/sales/payment-receipts", { replace: true });
    } catch {
      toast.error("Failed to save receipt");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Sticky Toolbar ── */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate("/sales/payment-receipts")}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors shrink-0"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <span className="text-gray-300">|</span>
            <h1 className="text-sm font-bold text-gray-900 truncate">New Payment Receipt</h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => navigate("/sales/payment-receipts")}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              <Save size={14} />
              {saving ? "Saving…" : "Save Receipt"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-5xl mx-auto px-6 py-7">

        {/* Tab switcher */}
        <div className="flex items-center gap-2 mb-6 p-1 bg-white border border-gray-200 rounded-xl w-fit shadow-sm">
          <TabBtn active={tab === "invoice"} onClick={() => setTab("invoice")}>
            Invoice Payment
          </TabBtn>
          <TabBtn active={tab === "advance"} onClick={() => setTab("advance")}>
            Customer Advance
          </TabBtn>
        </div>

        {/* ── Invoice Payment Tab ── */}
        {tab === "invoice" && (
          <>
            <Section title="Payment Details" icon={CreditCard}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <FieldLabel required>Customer Name</FieldLabel>
                  <select
                    className={sel}
                    value={form.customerName}
                    onChange={(e) => setF("customerName", e.target.value)}
                  >
                    <option value="">— Select customer —</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                    {form.customerName && !clients.find((c) => c.name === form.customerName) && (
                      <option value={form.customerName}>{form.customerName}</option>
                    )}
                  </select>
                </div>

                <div>
                  <FieldLabel required>Amount Received (₹)</FieldLabel>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={inp}
                    placeholder="0.00"
                    value={form.amountReceived}
                    onChange={(e) => setF("amountReceived", e.target.value)}
                  />
                  {amountValue > 0 && (
                    <p className="mt-1.5 text-xs text-green-600 font-medium">
                      ✓ Received full amount ₹{amountValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>

                <div>
                  <FieldLabel>Bank Charges (if any)</FieldLabel>
                  <input
                    className={inp}
                    placeholder="0.00"
                    value={form.bankCharges}
                    onChange={(e) => setF("bankCharges", e.target.value)}
                  />
                </div>

                <div>
                  <FieldLabel required>Payment Date</FieldLabel>
                  <input
                    type="date"
                    className={inp}
                    value={form.paymentDate}
                    onChange={(e) => setF("paymentDate", e.target.value)}
                  />
                </div>

                <div>
                  <FieldLabel required>Payment #</FieldLabel>
                  <input
                    className={inp}
                    value={form.paymentNumber}
                    onChange={(e) => setF("paymentNumber", e.target.value)}
                  />
                </div>

                <div>
                  <FieldLabel>Payment Mode</FieldLabel>
                  <select
                    className={sel}
                    value={form.paymentMode}
                    onChange={(e) => setF("paymentMode", e.target.value)}
                  >
                    {["Cash", "Bank Transfer", "UPI", "Cheque", "NEFT", "RTGS", "IMPS", "Credit Card", "Debit Card", "Other"].map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <FieldLabel required>Deposit To</FieldLabel>
                  <select
                    className={sel}
                    value={form.depositTo}
                    onChange={(e) => setF("depositTo", e.target.value)}
                  >
                    <option value="Petty Cash">Petty Cash</option>
                    <option value="Main Bank">Main Bank</option>
                    <option value="HDFC Current Account">HDFC Current Account</option>
                    <option value="ICICI Savings Account">ICICI Savings Account</option>
                  </select>
                </div>

                <div>
                  <FieldLabel>Reference #</FieldLabel>
                  <input
                    className={inp}
                    placeholder="e.g. UTR number, cheque no."
                    value={form.reference}
                    onChange={(e) => setF("reference", e.target.value)}
                  />
                </div>

                <div className="md:col-span-2">
                  <FieldLabel>Tax Deducted?</FieldLabel>
                  <div className="flex items-center gap-6 mt-1">
                    {(["no", "tds"] as const).map((opt) => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                        <input
                          type="radio"
                          className="accent-blue-600"
                          checked={form.taxDeducted === opt}
                          onChange={() => setF("taxDeducted", opt)}
                        />
                        {opt === "no" ? "No Tax Deducted" : "Yes, TDS (Income Tax)"}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            {/* Unpaid Invoices */}
            <Section title="Unpaid Invoices" icon={FileText}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500">
                  {form.customerName
                    ? `Showing invoices for "${form.customerName}"`
                    : "Select a customer above to filter invoices"}
                </p>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  SENT invoices
                </span>
              </div>
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {["Date", "Invoice Number", "Invoice Amount", "Amount Due", "Payment Received On", "Payment"].map((h, i) => (
                        <th key={h} className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 ${i >= 2 ? "text-right" : "text-left"}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {customerInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                          No invoices found{form.customerName ? ` for "${form.customerName}"` : ""}
                        </td>
                      </tr>
                    ) : (
                      customerInvoices.slice(0, 5).map((inv) => (
                        <tr
                          key={inv.id}
                          className={`border-b border-gray-100 last:border-0 cursor-pointer transition-colors ${form.invoiceNumber === inv.invoiceNumber ? "bg-blue-50" : "hover:bg-gray-50/60"}`}
                          onClick={() => setF("invoiceNumber", inv.invoiceNumber === form.invoiceNumber ? "" : inv.invoiceNumber)}
                        >
                          <td className="px-4 py-3 text-gray-600">{inv.invoiceDate}</td>
                          <td className="px-4 py-3 font-medium text-blue-600">{inv.invoiceNumber}</td>
                          <td className="px-4 py-3 text-right text-gray-700">₹{(inv.grandTotal ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                          <td className="px-4 py-3 text-right text-gray-700">₹{(inv.grandTotal ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                          <td className="px-4 py-3 text-gray-500">{form.paymentDate}</td>
                          <td className="px-4 py-3 text-right">
                            <input
                              type="text"
                              readOnly
                              value={form.invoiceNumber === inv.invoiceNumber ? amountValue.toFixed(2) : ""}
                              placeholder="—"
                              className="w-28 px-2 py-1 text-right text-sm border border-gray-200 rounded-lg bg-white"
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {form.invoiceNumber && (
                <p className="mt-2 text-xs text-blue-600 font-medium">
                  ✓ Invoice {form.invoiceNumber} selected
                </p>
              )}
            </Section>
          </>
        )}

        {/* ── Customer Advance Tab ── */}
        {tab === "advance" && (
          <Section title="Advance Payment Details" icon={CreditCard}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <FieldLabel required>Customer Name</FieldLabel>
                <select
                  className={sel}
                  value={form.customerName}
                  onChange={(e) => setF("customerName", e.target.value)}
                >
                  <option value="">— Select customer —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel required>Place of Supply</FieldLabel>
                <input
                  className={inp}
                  value={form.placeOfSupply}
                  onChange={(e) => setF("placeOfSupply", e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <FieldLabel>Description of Supply</FieldLabel>
                <textarea
                  rows={3}
                  className={ta}
                  placeholder="Describe the supply for this advance payment…"
                  value={form.descriptionOfSupply}
                  onChange={(e) => setF("descriptionOfSupply", e.target.value)}
                />
              </div>

              <div>
                <FieldLabel required>Amount Received (₹)</FieldLabel>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inp}
                  placeholder="0.00"
                  value={form.amountReceived}
                  onChange={(e) => setF("amountReceived", e.target.value)}
                />
              </div>

              <div>
                <FieldLabel>Bank Charges (if any)</FieldLabel>
                <input
                  className={inp}
                  placeholder="0.00"
                  value={form.bankCharges}
                  onChange={(e) => setF("bankCharges", e.target.value)}
                />
              </div>

              <div>
                <FieldLabel>Tax</FieldLabel>
                <select
                  className={sel}
                  value={form.taxCode || "none"}
                  onChange={(e) => setF("taxCode", e.target.value === "none" ? "" : e.target.value)}
                >
                  <option value="none">Select a Tax</option>
                  <option value="GST18">GST18 [18%]</option>
                  <option value="GST12">GST12 [12%]</option>
                  <option value="GST5">GST5 [5%]</option>
                  <option value="GST0">GST0 [0%]</option>
                </select>
              </div>

              <div>
                <FieldLabel required>Payment Date</FieldLabel>
                <input
                  type="date"
                  className={inp}
                  value={form.paymentDate}
                  onChange={(e) => setF("paymentDate", e.target.value)}
                />
              </div>

              <div>
                <FieldLabel required>Payment #</FieldLabel>
                <input
                  className={inp}
                  value={form.paymentNumber}
                  onChange={(e) => setF("paymentNumber", e.target.value)}
                />
              </div>

              <div>
                <FieldLabel>Payment Mode</FieldLabel>
                <input
                  className={inp}
                  value={form.paymentMode}
                  onChange={(e) => setF("paymentMode", e.target.value)}
                />
              </div>

              <div>
                <FieldLabel required>Deposit To</FieldLabel>
                <input
                  className={inp}
                  value={form.depositTo}
                  onChange={(e) => setF("depositTo", e.target.value)}
                />
              </div>

              <div>
                <FieldLabel>Reference #</FieldLabel>
                <input
                  className={inp}
                  placeholder="e.g. UTR number"
                  value={form.reference}
                  onChange={(e) => setF("reference", e.target.value)}
                />
              </div>
            </div>
          </Section>
        )}

        {/* ── Notes ── */}
        <Section title="Notes" icon={StickyNote}>
          <FieldLabel>Internal Notes (not visible to customer)</FieldLabel>
          <textarea
            rows={3}
            className={ta}
            placeholder="Add internal notes here…"
            value={form.note}
            onChange={(e) => setF("note", e.target.value)}
          />
        </Section>

        {/* ── Attachments ── */}
        <Section title="Attachments" icon={Paperclip}>
          <div className="flex gap-2 mb-3">
            <input
              className={inp}
              placeholder="Filename or URL"
              value={attachmentDraft}
              onChange={(e) => setAttachmentDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAttachment(); } }}
            />
            <button
              type="button"
              onClick={addAttachment}
              className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors shrink-0"
            >
              Add
            </button>
          </div>
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((a) => (
                <span
                  key={a}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
                >
                  {a}
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((x) => x !== a))}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
          {attachments.length === 0 && (
            <p className="text-xs text-gray-400">No attachments added.</p>
          )}
        </Section>

        {/* ── Thank You ── */}
        <Section title="Thank You Note" icon={Heart}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 accent-blue-600 w-4 h-4"
              checked={form.sendThankYou}
              onChange={(e) => setF("sendThankYou", e.target.checked)}
            />
            <div>
              <p className="text-sm font-medium text-gray-800">
                Send a "Thank you" note for this payment
              </p>
              {form.sendThankYou && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {form.recipients.length === 0 ? (
                    <p className="text-xs text-gray-400">No recipients — add customer email to send.</p>
                  ) : (
                    form.recipients.map((r) => (
                      <span key={r} className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
                        {r}
                      </span>
                    ))
                  )}
                </div>
              )}
            </div>
          </label>
        </Section>

        {/* ── Footer action bar ── */}
        <div className="flex justify-end gap-3 pt-2 pb-8">
          <button
            type="button"
            onClick={() => navigate("/sales/payment-receipts")}
            className="px-5 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? "Saving…" : "Save Receipt"}
          </button>
        </div>
      </div>
    </div>
  );
}
