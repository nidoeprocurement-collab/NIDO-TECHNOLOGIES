import { useState } from "react";
import { toast } from "sonner";
import { Archive, Download, Eye, MoreHorizontal, Pencil, Plus, Upload, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { generateDCPdfBase64, downloadDCPdf, type DeliveryChallanData } from "@/lib/dcPdfGenerator";

// ── Rich DC data (from the uploaded PDF) ─────────────────────────────────────
const DC_DETAILS: Record<string, DeliveryChallanData> = {
  dc_001: {
    challanNo: "DC-2026-0092",
    challanDate: "24/07/2026",
    invoiceRef: "INV-2026-0092",
    poReference: "PO-99482",
    placeOfSupply: "Telangana (36)",
    consigneeName: "Express IT Solutions Pvt Ltd",
    consigneeAddress: "321 Cyber Towers, HITEC City\nHyderabad, Telangana - 500081",
    consigneeGstin: "36AAACE9876B1ZS",
    consigneeContact: "accounts@expressit.com",
    shippedToName: "Express IT Solutions Pvt Ltd",
    shippedToAddress: "321 Cyber Towers, HITEC City\nHyderabad, Telangana - 500081",
    shippedToStateCode: "36 (Telangana)",
    shippedToAttn: "Operations Team",
    lineItems: [
      {
        itemName: "Enterprise Cloud Workstation Setup",
        description: "Hardware procurement & corporate installation.",
        hsnCode: "84713010",
        qty: 2,
        unit: "Nos",
        taxableValue: 125000,
      },
      {
        itemName: "Commercial Computer Manuals & Printware",
        description: "Printed documentation and operating guides.",
        hsnCode: "49011010",
        qty: 10,
        unit: "Nos",
        taxableValue: 11000,
      },
      {
        itemName: "Logitech Corporate Desktop Bundles",
        description: "High-grade mouse and keyboard accessories.",
        hsnCode: "84716040",
        qty: 5,
        unit: "Sets",
        taxableValue: 23000,
      },
    ],
    transportationNote:
      "This Delivery Challan accompanies the movement of physical goods specified above under Rule 55 of CGST Rules, 2017. Service items (e.g., Network Infrastructure Consulting) are excluded from physical dispatch.",
    modeOfTransport: "Surface Express Cargo",
    vehicleLrNo: "TN-09-CB-4491",
    eWayBillNo: "241098472910",
    declaration: [
      "Goods detailed above are being dispatched for supply as per Invoice #INV-2026-0092.",
      "Please verify the quantity and condition of goods upon delivery before signing acknowledgment.",
      "Any discrepancy must be reported within 24 hours of receipt.",
    ],
    footerNote: "Thank you for choosing Nido-Tech as your corporate essentials partner!",
  },
  dc_002: {
    challanNo: "DC-00032",
    challanDate: "14/02/2024",
    invoiceRef: "INV-00045",
    poReference: "SO-00045",
    placeOfSupply: "Maharashtra (27)",
    consigneeName: "Tech Solutions Inc",
    consigneeAddress: "45 Business Park, Andheri East\nMumbai, Maharashtra - 400069",
    consigneeGstin: "27AABCT1234A1ZS",
    consigneeContact: "procurement@techsolutions.com",
    shippedToName: "Tech Solutions Inc",
    shippedToAddress: "45 Business Park, Andheri East\nMumbai, Maharashtra - 400069",
    shippedToStateCode: "27 (Maharashtra)",
    shippedToAttn: "Warehouse Manager",
    lineItems: [
      {
        itemName: "Server Rack Units",
        description: "1U rack mount servers for data centre deployment.",
        hsnCode: "84715010",
        qty: 4,
        unit: "Nos",
        taxableValue: 320000,
      },
      {
        itemName: "Ethernet Switch 48-Port",
        description: "Managed gigabit switch with PoE support.",
        hsnCode: "85176200",
        qty: 2,
        unit: "Nos",
        taxableValue: 85000,
      },
    ],
    transportationNote:
      "This Delivery Challan accompanies the movement of physical goods under Rule 55 of CGST Rules, 2017.",
    modeOfTransport: "Road – Truck",
    vehicleLrNo: "MH-04-DX-7812",
    eWayBillNo: "881034567210",
    declaration: [
      "Goods detailed above are being dispatched for supply as per Invoice #INV-00045.",
      "Please verify the quantity and condition of goods upon delivery before signing acknowledgment.",
      "Any discrepancy must be reported within 24 hours of receipt.",
    ],
  },
  dc_003: {
    challanNo: "DC-00033",
    challanDate: "01/03/2024",
    invoiceRef: "INV-00051",
    poReference: "SO-00051",
    placeOfSupply: "Karnataka (29)",
    consigneeName: "Marketing Pro Agency",
    consigneeAddress: "88 Lavelle Road, Richmond Town\nBengaluru, Karnataka - 560001",
    consigneeGstin: "29AADCM5678B1ZK",
    consigneeContact: "ops@marketingpro.in",
    shippedToName: "Marketing Pro Agency",
    shippedToAddress: "88 Lavelle Road, Richmond Town\nBengaluru, Karnataka - 560001",
    shippedToStateCode: "29 (Karnataka)",
    shippedToAttn: "Receiving Desk",
    lineItems: [
      {
        itemName: "High-Resolution Projector",
        description: "4K laser projector for conference rooms.",
        hsnCode: "85286200",
        qty: 3,
        unit: "Nos",
        taxableValue: 90000,
      },
      {
        itemName: "Presentation Remote Kits",
        description: "Wireless slide-advance clicker with laser pointer.",
        hsnCode: "85176900",
        qty: 12,
        unit: "Nos",
        taxableValue: 14400,
      },
    ],
    transportationNote:
      "This Delivery Challan accompanies the movement of physical goods under Rule 55 of CGST Rules, 2017.",
    modeOfTransport: "Air Cargo",
    vehicleLrNo: "KA-01-AB-3321",
    eWayBillNo: "330987654321",
    declaration: [
      "Goods detailed above are being dispatched for supply as per Invoice #INV-00051.",
      "Please verify the quantity and condition of goods upon delivery before signing acknowledgment.",
      "Any discrepancy must be reported within 24 hours of receipt.",
    ],
  },
};

const MOCK_CHALLANS = [
  {
    id: "dc_001",
    date: "2026-07-24",
    number: "DC-2026-0092",
    referenceNumber: "INV-2026-0092",
    customerName: "EXPRESS IT SOLUTIONS PVT LTD",
    status: "OPEN" as const,
    invoiceStatus: "NOT INVOICED" as const,
    amount: 159000,
  },
  {
    id: "dc_002",
    date: "2024-02-14",
    number: "DC-00032",
    referenceNumber: "SO-00045",
    customerName: "TECH SOLUTIONS INC",
    status: "CLOSED" as const,
    invoiceStatus: "INVOICED" as const,
    amount: 405000,
  },
  {
    id: "dc_003",
    date: "2024-03-01",
    number: "DC-00033",
    referenceNumber: "SO-00051",
    customerName: "MARKETING PRO AGENCY",
    status: "OPEN" as const,
    invoiceStatus: "NOT INVOICED" as const,
    amount: 104400,
  },
];

type Challan = (typeof MOCK_CHALLANS)[number];

// ── Preview modal ─────────────────────────────────────────────────────────────
function PreviewModal({ dataUri, challanNo, onClose }: { dataUri: string; challanNo: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      {/* Dialog */}
      <div className="relative z-10 flex flex-col bg-white rounded-xl shadow-2xl w-[90vw] max-w-4xl h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 shrink-0">
          <p className="text-sm font-semibold text-gray-800">Preview — {challanNo}</p>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        {/* PDF embed */}
        <div className="flex-1 overflow-hidden rounded-b-xl">
          <iframe
            src={dataUri}
            title={`Preview ${challanNo}`}
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DeliveryChallansPage() {
  const [challans, setChallans] = useState(MOCK_CHALLANS);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewChallanNo, setPreviewChallanNo] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleArchive = (id: string) => {
    setChallans((prev) => prev.filter((c) => c.id !== id));
    toast.success("Challan archived");
  };

  const handleDownload = async (challan: Challan) => {
    const dc = DC_DETAILS[challan.id];
    if (!dc) { toast.error("DC data not found"); return; }
    setLoadingId(challan.id + "_dl");
    try {
      await downloadDCPdf(dc, `${dc.challanNo}.pdf`);
      toast.success(`${dc.challanNo}.pdf downloaded`);
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setLoadingId(null);
    }
  };

  const handlePreview = async (challan: Challan) => {
    const dc = DC_DETAILS[challan.id];
    if (!dc) { toast.error("DC data not found"); return; }
    setLoadingId(challan.id + "_pr");
    try {
      const uri = await generateDCPdfBase64(dc);
      setPreviewChallanNo(dc.challanNo);
      setPreviewUri(uri);
    } catch {
      toast.error("Failed to generate preview");
    } finally {
      setLoadingId(null);
    }
  };

  const statusBadge = (status: string) => (
    <span
      className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold ${
        status === "OPEN" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );

  return (
    <>
      {/* Preview modal — rendered at root level, no clipping possible */}
      {previewUri && (
        <PreviewModal
          dataUri={previewUri}
          challanNo={previewChallanNo}
          onClose={() => { setPreviewUri(null); setPreviewChallanNo(""); }}
        />
      )}

      <div className="min-h-screen bg-white">
        {/* ── Header ── */}
        <div className="border-b border-gray-200/70">
          <div className="px-6 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Delivery Challans</h1>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <Upload size={15} /> Export
              </button>
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
                <Plus size={15} /> New
              </button>
              <button className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors">
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="px-6 py-6">
          {/* Note: NO overflow-hidden on this wrapper — dropdowns must never be clipped */}
          <div className="rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  {["Date", "Delivery Challan#", "Reference Number", "Customer Name", "Status", "Invoice Status", "Amount", "Actions"].map((h, i) => (
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
                {challans.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">
                      No delivery challans found.
                    </td>
                  </tr>
                )}
                {challans.map((c) => {
                  const isLoading = loadingId?.startsWith(c.id);
                  return (
                    <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors last:border-0">
                      <td className="px-4 py-3 text-gray-600">{c.date}</td>
                      <td className="px-4 py-3 font-medium text-blue-600 cursor-pointer hover:underline">{c.number}</td>
                      <td className="px-4 py-3 text-gray-700">{c.referenceNumber}</td>
                      <td className="px-4 py-3 text-gray-700">{c.customerName}</td>
                      <td className="px-4 py-3">{statusBadge(c.status)}</td>
                      <td className="px-4 py-3 text-gray-600">{c.invoiceStatus}</td>
                      <td className="px-4 py-3 text-right text-gray-900 font-medium">
                        ₹{c.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {/* Radix DropdownMenu portals its content to <body> —
                            it will never be clipped by any ancestor overflow or z-index */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              disabled={!!isLoading}
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
                              onSelect={() => handlePreview(c)}
                            >
                              <Eye size={14} /> Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer"
                              onSelect={() => toast.info(`Edit ${c.number}`)}
                            >
                              <Pencil size={14} /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer"
                              onSelect={() => handleDownload(c)}
                            >
                              <Download size={14} /> Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                              onSelect={() => handleArchive(c.id)}
                            >
                              <Archive size={14} /> Archive
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
