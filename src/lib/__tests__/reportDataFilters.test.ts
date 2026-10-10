import { describe, expect, it } from "vitest";
import { DEFAULT_REPORT_FILTERS } from "@/contexts/ReportControlsContext";
import { applyReportFilters, getReportFieldValue } from "@/lib/reportData";

describe("report date and field filters", () => {
  it("maps selected columns to live records from their platform modules", () => {
    expect(getReportFieldValue(
      { __module: "Clients", id: "client-1", name: "Acme Ltd", email: "ops@acme.test" },
      "Client Name",
    )).toBe("Acme Ltd");
    expect(getReportFieldValue(
      { __module: "Vendors", id: "vendor-1", name: "North Supply", category: "Hardware" },
      "Vendor Name",
    )).toBe("North Supply");
    expect(getReportFieldValue(
      { __module: "Catalog", id: "product-1", productName: "Monitor", skuCode: "MON-01" },
      "SKU",
    )).toBe("MON-01");
    expect(getReportFieldValue(
      { __module: "Orders", id: "order-1", orderNumber: "SO-00001", clientName: "Acme Ltd" },
      "Client Name",
    )).toBe("Acme Ltd");
    expect(getReportFieldValue(
      { __module: "Users", id: "user-1", name: "Jordan Lee", department: "Operations" },
      "User Name",
    )).toBe("Jordan Lee");
  });

  it("filters an inclusive custom date range", () => {
    const records = [
      { id: "before", createdAt: "2026-10-07", status: "Paid" },
      { id: "start", createdAt: "2026-10-08", status: "Paid" },
      { id: "end", createdAt: "2026-10-10", status: "Pending" },
      { id: "after", createdAt: "2026-10-11", status: "Paid" },
    ];

    const result = applyReportFilters(records, {
      ...DEFAULT_REPORT_FILTERS,
      datePreset: "custom",
      dateFrom: "2026-10-08",
      dateTo: "2026-10-10",
    });

    expect(result.map((record) => record.id)).toEqual(["start", "end"]);
  });

  it("combines date, client, and status filters and excludes records without a date", () => {
    const records = [
      { id: "match", invoiceDate: "2026-10-09", clientName: "Acme", status: "Paid" },
      { id: "wrong-client", invoiceDate: "2026-10-09", clientName: "Other", status: "Paid" },
      { id: "wrong-status", invoiceDate: "2026-10-09", clientName: "Acme", status: "Pending" },
      { id: "missing-date", clientName: "Acme", status: "Paid" },
    ];

    const result = applyReportFilters(records, {
      ...DEFAULT_REPORT_FILTERS,
      datePreset: "custom",
      dateFrom: "2026-10-08",
      dateTo: "2026-10-10",
      client: "Acme",
      status: "Paid",
    });

    expect(result.map((record) => record.id)).toEqual(["match"]);
  });

  it("uses local calendar dates for the Today preset", () => {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

    const result = applyReportFilters(
      [{ id: "today", date: todayKey }, { id: "yesterday", date: yesterdayKey }],
      { ...DEFAULT_REPORT_FILTERS, datePreset: "today" },
    );

    expect(result.map((record) => record.id)).toEqual(["today"]);
  });
});
