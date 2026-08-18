const STORE_KEY = "nido_custom_reports_v1";

export type ReportFormat = "Excel" | "CSV" | "PDF";
export type ReportFrequency = "One Time" | "Daily" | "Weekly" | "Monthly" | "Quarterly";
export type ReportCategory = "Orders" | "Clients" | "Vendors" | "Support" | "Services" | "Users" | "Catalog" | "All Modules";

export interface CustomReport {
  id: string;
  name: string;
  description: string;
  reportType: string;
  module: string;
  selectedColumns: string[];
  filters: ReportFilter[];
  frequency: ReportFrequency;
  startDate: string;
  time: string;
  timeZone: string;
  deliveryEmail: boolean;
  deliveryDownload: boolean;
  emailRecipients: string;
  format: ReportFormat;
  includeCharts: boolean;
  includeSummary: boolean;
  createdBy: string;
  createdAt: string;
  lastRunDate?: string;
  lastRunStatus?: "Success" | "Failed" | "Pending";
}

export interface ReportFilter {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export function getCustomReports(): CustomReport[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

export function saveCustomReport(report: CustomReport): void {
  const all = getCustomReports();
  const idx = all.findIndex((r) => r.id === report.id);
  if (idx >= 0) all[idx] = report;
  else all.unshift(report);
  localStorage.setItem(STORE_KEY, JSON.stringify(all));
}

export function deleteCustomReport(id: string): void {
  const all = getCustomReports().filter((r) => r.id !== id);
  localStorage.setItem(STORE_KEY, JSON.stringify(all));
}

export function generateReportId(): string {
  const all = getCustomReports();
  const num = all.length + 1;
  return `RPT-${String(num).padStart(5, "0")}`;
}

/** Map module → category label used in the reports list */
export function moduleToCategoryLabel(module: string): ReportCategory {
  const map: Record<string, ReportCategory> = {
    "All Modules": "All Modules",
    Clients: "Clients",
    Vendors: "Vendors",
    Catalog: "Catalog",
    Orders: "Orders",
    Services: "Services",
    "Support Tickets": "Support",
  };
  return map[module] ?? "All Modules";
}

/** Human-readable schedule label for the reports list */
export function scheduleLabel(freq: ReportFrequency, time: string): string {
  switch (freq) {
    case "One Time": return `One Time\n${time}`;
    case "Daily": return `Daily\n${time}`;
    case "Weekly": return `Weekly\nEvery Monday ${time}`;
    case "Monthly": return `Monthly\n1st of every month`;
    case "Quarterly": return `Quarterly\n1st of every quarter`;
    default: return freq;
  }
}
