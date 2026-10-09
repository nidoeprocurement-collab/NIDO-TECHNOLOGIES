import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/clientStore", () => ({
  getClients: () => [{ id: "client-1", name: "Acme" }],
}));
vi.mock("@/lib/clientCatalogStore", () => ({
  getClientCatalog: () => [{ productCode: "AC-1", name: "Acme Product", priceNum: 125, availability: "In stock" }],
}));
vi.mock("@/lib/catalogStore", () => ({
  getCatalogProducts: () => [{ id: "global-product", name: "Global Product" }],
}));
vi.mock("@/lib/clientDataStore", () => ({
  getClientOrders: (clientId: string) => [{
    id: "client-order-1",
    clientId,
    date: "2026-10-01",
    amountNum: 500,
    amount: "₹500",
    client: "Acme",
    status: "Processing",
  }],
  getClientServices: (clientId: string) => [{
    id: "client-service-1",
    clientId,
    name: "Cloud Hosting",
    provider: "Cloud Co",
    startDate: "2026-10-02",
    endDate: "2027-10-01",
    amount: "₹1,200/year",
    status: "Active",
    category: "Hosting",
  }],
}));
vi.mock("@/lib/salesOrderStore", () => ({
  getOrders: () => [{ id: "internal-order-1", orderNumber: "SO-1" }],
}));

import {
  filterReportCenterRecords,
  getReportCenterRecords,
  loadReportCenterRecords,
} from "@/lib/reportCenterData";

describe("report center live data sources", () => {
  it("loads the selected client catalog instead of the global catalog", async () => {
    const records = await loadReportCenterRecords("Catalog", "client");

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      clientId: "client-1",
      clientName: "Acme",
      productName: "Acme Product",
    });
  });

  it("loads client portal orders and maps their date and amount into report fields", () => {
    const [record] = getReportCenterRecords("Client Orders", "client");

    expect(record).toMatchObject({
      id: "client-order-1",
      clientId: "client-1",
      clientName: "Acme",
      orderDate: "2026-10-01",
      amount: 500,
      totalAmount: 500,
    });
  });

  it("loads client services and includes their start date in date filtering", () => {
    const records = getReportCenterRecords("Services", "client");
    const filtered = filterReportCenterRecords(records, {
      entityType: "client",
      entityIds: [],
      allEntities: true,
      dateBasis: "Created date",
      dateFrom: "2026-10-01",
      dateTo: "2026-10-31",
    }, { client: [], vendor: [], internal: [] });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]).toMatchObject({
      serviceName: "Cloud Hosting",
      requestDate: "2026-10-02",
      clientName: "Acme",
      assignedTo: "Cloud Co",
    });
  });

  it("keeps internal sales orders on the internal Orders report", () => {
    expect(getReportCenterRecords("Orders", "internal")).toEqual([
      { id: "internal-order-1", orderNumber: "SO-1" },
    ]);
  });
});
