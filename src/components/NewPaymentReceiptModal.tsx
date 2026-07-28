import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import {
  savePaymentReceipt,
  generatePaymentNo,
  type PaymentMode,
  type PaymentStatus,
  type PaymentReceipt,
} from "@/lib/paymentReceiptStore";
import { getClients } from "@/lib/clientStore";
import { getInvoices } from "@/lib/invoiceStore";

const inputCls =
  "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors bg-white";
const selectCls =
  "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors bg-white";

const MODES: PaymentMode[] = [
  "Cash", "Bank Transfer", "Cheque", "UPI", "Credit Card",
  "Debit Card", "NEFT", "RTGS", "IMPS", "Other",
];
const STATUSES: PaymentStatus[] = ["Received", "Pending", "Failed", "Refunded"];

interface Props {
  onClose: () => void;
  onSaved: (receipt: PaymentReceipt) => void;
}

export default function NewPaymentReceiptModal({ onClose, onSaved }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const clients = getClients();
  const invoices = getInvoices();

  const [form, setForm] = useState({
    paymentNo: generatePaymentNo(),
    date: today,
    customer: "",
    invoiceRef: "",
    mode: "Bank Transfer" as PaymentMode,
    status: "Received" as PaymentStatus,
    amount: "",
    reference: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // Filter invoices by selected customer
  const filteredInvoices = form.customer
    ? invoices.filter((inv) =>
        inv.clientName.toLowerCase().includes(form.customer.toLowerCase())
      )
    : invoices;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customer.trim()) { toast.error("Customer is required"); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error("Enter a valid amount"); return; }

    setSaving(true);
    try {
      const receipt: PaymentReceipt = {
        id: crypto.randomUUID(),
        paymentNo: form.paymentNo.trim() || generatePaymentNo(),
        date: form.date,
        customer: form.customer.trim(),
        invoiceRef: form.invoiceRef.trim(),
        mode: form.mode,
        status: form.status,
        amount: parseFloat(form.amount),
        reference: form.reference.trim() || undefined,
        notes: form.notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      savePaymentReceipt(receipt);
      toast.success(`Receipt ${receipt.paymentNo} saved`);
      onSaved(receipt);
    } catch {
      toast.error("Failed to save receipt");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">New Payment Receipt</h2>
            <p className="text-xs text-gray-500 mt-0.5">{form.paymentNo}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* Row 1: Payment No + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Payment #</label>
              <input
                className={inputCls}
                value={form.paymentNo}
                onChange={(e) => set("paymentNo", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className={inputCls}
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Customer */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Customer <span className="text-red-500">*</span>
            </label>
            <select
              className={selectCls}
              value={form.customer}
              onChange={(e) => set("customer", e.target.value)}
              required
            >
              <option value="">— Select customer —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Invoice Ref */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Invoice Reference</label>
            <select
              className={selectCls}
              value={form.invoiceRef}
              onChange={(e) => set("invoiceRef", e.target.value)}
            >
              <option value="">— Select invoice (optional) —</option>
              {filteredInvoices.map((inv) => (
                <option key={inv.id} value={inv.invoiceNumber}>
                  {inv.invoiceNumber} — {inv.clientName} — ₹{inv.grandTotal?.toLocaleString("en-IN")}
                </option>
              ))}
            </select>
          </div>

          {/* Mode + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Payment Mode</label>
              <select
                className={selectCls}
                value={form.mode}
                onChange={(e) => set("mode", e.target.value as PaymentMode)}
              >
                {MODES.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                className={selectCls}
                value={form.status}
                onChange={(e) => set("status", e.target.value as PaymentStatus)}
              >
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Amount + Reference */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className={inputCls}
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Ref / Transaction ID
              </label>
              <input
                className={inputCls}
                placeholder="e.g. UTR number"
                value={form.reference}
                onChange={(e) => set("reference", e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              rows={2}
              className={`${inputCls} resize-none`}
              placeholder="Optional remarks..."
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Receipt"}
          </button>
        </div>
      </div>
    </div>
  );
}
