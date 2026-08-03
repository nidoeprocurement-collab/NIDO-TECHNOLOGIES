import { FileText, FileSpreadsheet, Printer, Mail, CalendarClock, RefreshCw, Download } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface ExportBarProps {
  reportTitle?: string;
  onRefresh?: () => void;
}

export default function ExportBar({ reportTitle = "Report", onRefresh }: ExportBarProps) {
  const act = (label: string) => toast({ title: `${label}: ${reportTitle}` });

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => act("Export PDF")}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <FileText className="w-3.5 h-3.5 text-red-500" /> PDF
      </button>
      <button
        onClick={() => act("Export Excel")}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" /> Excel
      </button>
      <button
        onClick={() => act("Export CSV")}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Download className="w-3.5 h-3.5 text-blue-500" /> CSV
      </button>
      <button
        onClick={() => window.print()}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Printer className="w-3.5 h-3.5 text-gray-500" /> Print
      </button>
      <button
        onClick={() => act("Email Report")}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Mail className="w-3.5 h-3.5 text-blue-500" /> Email
      </button>
      <button
        onClick={() => act("Schedule Report")}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <CalendarClock className="w-3.5 h-3.5 text-purple-500" /> Schedule
      </button>
      <button
        onClick={() => { onRefresh?.(); toast({ title: "Refreshed" }); }}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors ml-auto"
      >
        <RefreshCw className="w-3.5 h-3.5" /> Refresh
      </button>
    </div>
  );
}
