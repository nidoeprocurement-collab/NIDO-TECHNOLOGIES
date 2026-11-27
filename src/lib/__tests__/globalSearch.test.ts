import { beforeEach, describe, expect, it } from "vitest";
import { getGlobalSearchResults } from "../globalSearch";
import { addClient } from "../clientStore";

describe("getGlobalSearchResults", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("finds sidebar modules and existing client records", () => {
    addClient({
      id: "CL-00001",
      name: "Apex Manufacturing",
      company_name: "Apex Manufacturing",
      category: "Manufacturing",
      billingCity: "Pune",
      status: "active",
    });

    const moduleResults = getGlobalSearchResults("invoice");
    const clientResults = getGlobalSearchResults("Apex Manufacturing");

    expect(moduleResults.some(item => item.path === "/invoices")).toBe(true);
    expect(clientResults.some(item => item.path === "/clients/CL-00001")).toBe(true);
  });

  it("finds catalogue items and orders from existing workspace stores", () => {
    localStorage.setItem(
      "nido_catalog_products",
      JSON.stringify([
        { id: "PROD-001", productName: "Apple MacBook Pro", masterProductCode: "MBP-14", status: "Active" },
      ]),
    );
    localStorage.setItem(
      "nido_my_orders",
      JSON.stringify([
        { id: "ORD-2024-001", orderNumber: "ORD-2024-001", status: "Processing" },
      ]),
    );

    const productResults = getGlobalSearchResults("MacBook");
    const orderResults = getGlobalSearchResults("ORD-2024-001");

    expect(productResults.some(item => item.path === "/configuration/master-catalogue/edit/PROD-001")).toBe(true);
    expect(orderResults.some(item => item.path === "/orders/ORD-2024-001")).toBe(true);
  });

  it("keeps client portal search inside permitted portal routes", () => {
    const results = getGlobalSearchResults("support", {
      isClientPortalUser: true,
      permissions: { Support: { view: true } },
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results.every(item => item.path.startsWith("/portal/"))).toBe(true);
    expect(results.some(item => item.path === "/portal/support")).toBe(true);
  });

  it("hides client portal pages when the user lacks view permission", () => {
    const deniedResults = getGlobalSearchResults("support", {
      isClientPortalUser: true,
      permissions: { Support: { view: false }, Dashboard: { view: true } },
    });
    const unpermittedResults = getGlobalSearchResults("support", {
      isClientPortalUser: true,
      permissions: {},
    });

    expect(deniedResults).toEqual([]);
    expect(unpermittedResults).toEqual([]);
  });
});
