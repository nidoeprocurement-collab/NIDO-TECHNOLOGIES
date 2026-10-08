import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { ReportExportColumn, ReportExportData } from "@/contexts/ReportControlsContext";

export type ReportFileFormat = "CSV" | "Excel" | "PDF";

function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function safeFileName(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "report";
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function csvValue(value: unknown): string {
  const text = cellText(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function reportDataToCsv(columns: ReportExportColumn[], rows: ReportExportData["rows"]): string {
  const header = columns.map((column) => csvValue(column.label)).join(",");
  const body = rows.map((row) => columns.map((column) => csvValue(row[column.key])).join(","));
  return [header, ...body].join("\r\n");
}

export function downloadReportExport(
  format: ReportFileFormat,
  title: string,
  columns: ReportExportColumn[],
  rows: ReportExportData["rows"],
) {
  const name = safeFileName(title);
  const date = new Date().toISOString().slice(0, 10);

  if (format === "CSV") {
    downloadBlob(
      new Blob(["\uFEFF", reportDataToCsv(columns, rows)], { type: "text/csv;charset=utf-8" }),
      `${name}-${date}.csv`,
    );
    return;
  }

  if (format === "Excel") {
    const worksheet = XLSX.utils.aoa_to_sheet([
      columns.map((column) => column.label),
      ...rows.map((row) => columns.map((column) => cellText(row[column.key]))),
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `${name}-${date}.xlsx`);
    return;
  }

  const pdf = new jsPDF({ orientation: columns.length > 6 ? "landscape" : "portrait" });
  pdf.setFontSize(14);
  pdf.text(title, 14, 16);
  pdf.setFontSize(9);
  pdf.text(`Generated ${new Date().toLocaleString()}`, 14, 22);
  autoTable(pdf, {
    startY: 28,
    head: [columns.map((column) => column.label)],
    body: rows.map((row) => columns.map((column) => cellText(row[column.key]))),
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235] },
    margin: { left: 14, right: 14 },
  });
  pdf.save(`${name}-${date}.pdf`);
}
