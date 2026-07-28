import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MoreHorizontal } from "lucide-react";
import { safeReadJson } from "@/lib/utils";

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

const STATUS_STYLES: Record<string, string> = {
  paid:  "bg-green-100 text-green-700",
  draft: "bg-gray-100 text-gray-600",
};

function fmt(n: number) {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PaymentReceiptsPage() {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState<PaymentReceipt[]>(() =>
    safeReadJson<PaymentReceipt[]>(STORAGE_KEY, []),
  );

  useEffect(() => {
    setReceipts(safeReadJson<PaymentReceipt[]>(STORAGE_KEY, []));
  }, []);

  const totalPaid = receipts
    .filter((r) => r.status === "paid")
    .reduce((s, r) => s + r.amountReceived, 0);

  return (
    <div className="min-h-screen bg-white">
      {/* ── Header ── */}
      <div className="border-b border-gray-200/70">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Payment Receipts</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Capture payment receipts and maintain a stable customer payment trail.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/sales/payment-receipts/create")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus size={15} /> New
            </button>
            <button className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Summary strip ── */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <p className="text-sm text-gray-500">
          Total Paid:{" "}
          <span className="text-lg font-bold text-gray-900">₹{fmt(totalPaid)}</span>
        </p>
      </div>

      {/* ── Table ── */}
      <div className="px-6 py-6">
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {["Date", "Payment #", "Customer", "Invoice #", "Mode", "Status", "Amount"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-gray-500 ${
                      i === 6 ? "text-right" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {receipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center text-sm text-gray-400">
                    No payment records found.{" "}
                    <button
                      onClick={() => navigate("/sales/payment-receipts/create")}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      + Create one
                    </button>
                  </td>
                </tr>
              ) : (
                receipts.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-600">{r.paymentDate}</td>
                    <td className="px-4 py-3 font-medium text-blue-600">{r.paymentNumber}</td>
                    <td className="px-4 py-3 text-gray-700">{r.customerName}</td>
                    <td className="px-4 py-3 text-gray-500">{r.invoiceNumber || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{r.paymentMode}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          STATUS_STYLES[r.status] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {r.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 tabular-nums">
                      ₹{fmt(r.amountReceived)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
