import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  MoreHorizontal, Plus, Archive, Pencil, Download, X, FileText,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getActiveReceipts,
  getArchivedReceipts,
  archiveReceipt,
  type PaymentReceipt,
} from "@/lib/paymentReceiptStore";
import { downloadReceiptPdf } from "@/lib/paymentReceiptPdf";

function fmt(n: number) {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const STATUS_STYLES: Record<string, string> = {
  paid:  "bg-green-100 text-green-700",
  draft: "bg-yellow-100 text-yellow-700",
};

// ── Archived slide-over ───────────────────────────────────────────────────────
function ArchivedDrawer({ onClose }: { onClose: () => void }) {
  const archived = getArchivedReceipts();

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* panel */}
      <div className="relative z-10 w-full max-w-2xl bg-white h-full flex flex-col shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <Archive size={18} className="text-gray-500" />
            <div>
              <h2 className="text-base font-bold text-gray-900">Archived Receipts</h2>
              <p className="text-xs text-gray-500 mt-0.5">Read-only view · {archived.length} record{archived.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {archived.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
              <Archive size={40} strokeWidth={1.5} />
              <p className="text-sm">No archived receipts yet.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {["Date", "Payment #", "Customer", "Invoice #", "Mode", "Amount"].map((h, i) => (
                      <th
                        key={h}
                        className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 ${
                          i === 5 ? "text-right" : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {archived.map((r, i) => (
                    <tr
                      key={r.id}
                      className={`border-b border-gray-100 last:border-0 ${
                        i % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                      }`}
                    >
                      <td className="px-4 py-3 text-gray-500">{r.paymentDate}</td>
                      <td className="px-4 py-3 font-medium text-gray-700">{r.paymentNumber}</td>
                      <td className="px-4 py-3 text-gray-700">{r.customerName}</td>
                      <td className="px-4 py-3 text-gray-500">{r.invoiceNumber || "—"}</td>
                      <td className="px-4 py-3 text-gray-500">{r.paymentMode}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-700 tabular-nums">
                        ₹{fmt(r.amountReceived)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* footer note */}
        <div className="shrink-0 px-6 py-3 border-t border-gray-100 bg-gray-50/60">
          <p className="text-xs text-gray-400 text-center">Archived receipts are read-only and cannot be edited.</p>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PaymentReceiptsPage() {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    setReceipts(getActiveReceipts());
  }, []);

  const totalPaid = receipts
    .filter((r) => r.status === "paid")
    .reduce((s, r) => s + r.amountReceived, 0);

  const handleArchive = (id: string) => {
    archiveReceipt(id);
    setReceipts(getActiveReceipts());
    toast.success("Receipt archived");
  };

  const handleDownload = async (r: PaymentReceipt) => {
    setDownloadingId(r.id);
    try {
      await downloadReceiptPdf(r, `${r.paymentNumber}.pdf`);
      toast.success(`${r.paymentNumber}.pdf downloaded`);
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setDownloadingId(null);
    }
  };

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

          {/* 3-dot menu — New + Archived */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
                <MoreHorizontal size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onSelect={() => navigate("/sales/payment-receipts/create")}
              >
                <Plus size={14} /> New Receipt
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="gap-2 cursor-pointer"
                onSelect={() => setShowArchived(true)}
              >
                <Archive size={14} /> Archived
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                {["Date", "Payment #", "Customer", "Invoice #", "Mode", "Status", "Amount", "Actions"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-gray-500 ${
                      i === 6 ? "text-right" : i === 7 ? "text-center" : "text-left"
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
                  <td colSpan={8} className="px-4 py-14 text-center text-sm text-gray-400">
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
                receipts.map((r) => {
                  const isLoading = downloadingId === r.id;
                  return (
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
                      {/* Actions */}
                      <td className="px-4 py-3 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              disabled={isLoading}
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-40"
                            >
                              {isLoading ? (
                                <span className="block w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                              ) : (
                                <MoreHorizontal size={16} />
                              )}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer"
                              onSelect={() => navigate(`/sales/payment-receipts/${r.id}`)}
                            >
                              <Pencil size={14} /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer"
                              onSelect={() => handleDownload(r)}
                            >
                              <Download size={14} /> Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                              onSelect={() => handleArchive(r.id)}
                            >
                              <Archive size={14} /> Archive
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Archived slide-over */}
      {showArchived && <ArchivedDrawer onClose={() => setShowArchived(false)} />}
    </div>
  );
}
