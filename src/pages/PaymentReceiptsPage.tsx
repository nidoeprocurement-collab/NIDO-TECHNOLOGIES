import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { getPaymentReceipts, type PaymentReceipt } from "@/lib/paymentReceiptStore";
import NewPaymentReceiptModal from "@/components/NewPaymentReceiptModal";

const STATUS_COLORS: Record<string, string> = {
  Received: "bg-green-50 text-green-700 border border-green-200",
  Pending:  "bg-yellow-50 text-yellow-700 border border-yellow-200",
  Failed:   "bg-red-50 text-red-700 border border-red-200",
  Refunded: "bg-purple-50 text-purple-700 border border-purple-200",
};

function fmt(n: number) {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PaymentReceiptsPage() {
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setReceipts(getPaymentReceipts());
  }, []);

  function handleSaved(receipt: PaymentReceipt) {
    setReceipts(getPaymentReceipts());
    setShowModal(false);
  }

  const totalPaid = receipts
    .filter((r) => r.status === "Received")
    .reduce((s, r) => s + r.amount, 0);

  return (
    <div className="min-h-screen bg-white p-4">
      {/* Summary Card */}
      <div className="bg-white border rounded-xl shadow-sm p-4 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500">
              Capture payment receipts and maintain a stable customer payment trail.
            </p>
            <h2 className="text-3xl font-bold text-slate-900 mt-1">
              Total Paid: ₹{fmt(totalPaid)}
            </h2>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition text-sm"
          >
            <Plus size={16} />
            New
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border rounded-xl shadow-sm p-4">
        <div className="border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-3 py-2.5 text-xs font-semibold tracking-wider text-slate-500 uppercase">Date</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold tracking-wider text-slate-500 uppercase">Payment #</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold tracking-wider text-slate-500 uppercase">Customer</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold tracking-wider text-slate-500 uppercase">Invoice #</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold tracking-wider text-slate-500 uppercase">Mode</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold tracking-wider text-slate-500 uppercase">Status</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold tracking-wider text-slate-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>
              {receipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400 text-sm">
                    No payment records found. Click <strong>+ New</strong> to add one.
                  </td>
                </tr>
              ) : (
                receipts.map((r, i) => (
                  <tr
                    key={r.id}
                    className={`border-t border-slate-100 text-sm ${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}
                  >
                    <td className="px-3 py-3 text-slate-600 whitespace-nowrap">{r.date}</td>
                    <td className="px-3 py-3 font-medium text-slate-800">{r.paymentNo}</td>
                    <td className="px-3 py-3 text-slate-700">{r.customer}</td>
                    <td className="px-3 py-3 text-slate-500">{r.invoiceRef || "—"}</td>
                    <td className="px-3 py-3 text-slate-600">{r.mode}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] ?? ""}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-slate-900 tabular-nums">
                      ₹{fmt(r.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <NewPaymentReceiptModal
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
