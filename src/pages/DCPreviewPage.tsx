import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getDCDetail } from "@/lib/dcStore";
import { generateDCPdfBlob, downloadDCPdf } from "@/lib/dcPdfGenerator";

export default function DCPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [challanNo, setChallanNo] = useState("");
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) { setError("No challan ID provided."); return; }
    const dc = getDCDetail(id);
    if (!dc) { setError("Delivery Challan not found."); return; }

    setChallanNo(dc.challanNo);
    generateDCPdfBlob(dc)
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
      })
      .catch(() => setError("Failed to generate PDF preview."));

    return () => {
      // revoke on unmount
      setBlobUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    };
  }, [id]);

  const handleDownload = async () => {
    if (!id) return;
    const dc = getDCDetail(id);
    if (!dc) { toast.error("DC data not found"); return; }
    setDownloading(true);
    try {
      await downloadDCPdf(dc, `${dc.challanNo}.pdf`);
      toast.success(`${dc.challanNo}.pdf downloaded`);
    } catch {
      toast.error("Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-100">
      {/* Header */}
      <div className="shrink-0 bg-white border-b border-gray-200 shadow-sm px-5 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors shrink-0"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <span className="text-gray-300 font-light">|</span>
          <h1 className="text-sm font-bold text-gray-900 truncate">
            {challanNo ? `Delivery Challan — ${challanNo}` : "Delivery Challan Preview"}
          </h1>
        </div>

        {blobUrl && (
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shrink-0"
          >
            {downloading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            Download PDF
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        {error ? (
          <div className="flex items-center justify-center h-full text-sm text-red-500">
            {error}
          </div>
        ) : !blobUrl ? (
          <div className="flex items-center justify-center h-full gap-2 text-sm text-gray-500">
            <Loader2 size={18} className="animate-spin" />
            Generating preview…
          </div>
        ) : (
          <iframe
            src={blobUrl}
            title={`Delivery Challan ${challanNo}`}
            className="w-full h-full border-0"
          />
        )}
      </div>
    </div>
  );
}
