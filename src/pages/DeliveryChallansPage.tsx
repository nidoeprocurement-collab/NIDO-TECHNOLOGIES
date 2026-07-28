import { useRef, useState } from "react";
import { toast } from "sonner";
import { Archive, Download, Eye, MoreHorizontal, Pencil, Plus, Upload } from "lucide-react";

const MOCK_CHALLANS = [
  {
    id: "dc_001",
    date: "2021-09-07",
    number: "DC-00031",
    referenceNumber: "SO-00031",
    customerName: "UNIQUE MEASUREMENT SERVICE",
    status: "OPEN",
    invoiceStatus: "NOT INVOICED",
    amount: 94.0,
  },
  {
    id: "dc_002",
    date: "2024-02-14",
    number: "DC-00032",
    referenceNumber: "SO-00045",
    customerName: "TECH SOLUTIONS INC",
    status: "CLOSED",
    invoiceStatus: "INVOICED",
    amount: 12500.0,
  },
  {
    id: "dc_003",
    date: "2024-03-01",
    number: "DC-00033",
    referenceNumber: "SO-00051",
    customerName: "MARKETING PRO AGENCY",
    status: "OPEN",
    invoiceStatus: "NOT INVOICED",
    amount: 4750.5,
  },
];

type Challan = (typeof MOCK_CHALLANS)[number];

function ActionsMenu({ challan, onArchive }: { challan: Challan; onArchive: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  const handleBlur = () => setTimeout(() => setOpen(false), 150);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onBlur={handleBlur}
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-44 rounded-lg border border-gray-200 bg-white shadow-lg py-1 text-sm">
          <button
            onMouseDown={() => { toast.info(`Preview ${challan.number}`); setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            <Eye size={14} /> Preview
          </button>
          <button
            onMouseDown={() => { toast.info(`Edit ${challan.number}`); setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            <Pencil size={14} /> Edit
          </button>
          <button
            onMouseDown={() => { toast.info(`Downloading PDF for ${challan.number}`); setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            <Download size={14} /> Download PDF
          </button>
          <div className="my-1 border-t border-gray-100" />
          <button
            onMouseDown={() => { onArchive(challan.id); setOpen(false); }}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-red-600 hover:bg-red-50"
          >
            <Archive size={14} /> Archive
          </button>
        </div>
      )}
    </div>
  );
}

export default function DeliveryChallansPage() {
  const [challans, setChallans] = useState(MOCK_CHALLANS);

  const handleArchive = (id: string) => {
    setChallans((prev) => prev.filter((c) => c.id !== id));
    toast.success("Challan archived");
  };

  const statusBadge = (status: string) => {
    const isOpen = status === "OPEN";
    return (
      <span
        className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold ${
          isOpen ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ── Page header ── */}
      <div className="border-b border-gray-200/70">
        <div className="px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Delivery Challans</h1>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <Upload size={15} />
              Export
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
              <Plus size={15} />
              New
            </button>
            <button className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="px-6 py-6">
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-500">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-500">
                  Delivery Challan#
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-500">
                  Reference Number
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-500">
                  Customer Name
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-500">
                  Invoice Status
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-widest text-gray-500">
                  Amount
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-widest text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {challans.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">
                    No delivery challans found.
                  </td>
                </tr>
              )}
              {challans.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-3 text-gray-600">{c.date}</td>
                  <td className="px-4 py-3 font-medium text-blue-600 cursor-pointer hover:underline">
                    {c.number}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{c.referenceNumber}</td>
                  <td className="px-4 py-3 text-gray-700 uppercase">{c.customerName}</td>
                  <td className="px-4 py-3">{statusBadge(c.status)}</td>
                  <td className="px-4 py-3 text-gray-600">{c.invoiceStatus}</td>
                  <td className="px-4 py-3 text-right text-gray-900 font-medium">
                    Rs.{c.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ActionsMenu challan={c} onArchive={handleArchive} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
