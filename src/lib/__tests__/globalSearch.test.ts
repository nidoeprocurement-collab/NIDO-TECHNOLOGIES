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

    expect(moduleResults.some(item => item.path === "/sales/invoices")).toBe(true);
    expect(clientResults.some(item => item.path === "/clients/CL-00001")).toBe(true);
  });

  it("finds catalogue items and orders from existing workspace stores", () => {
    const productResults = getGlobalSearchResults("MacBook");
    const orderResults = getGlobalSearchResults("ORD-2024-001");

    expect(productResults.some(item => item.path === "/catalogue/products/PROD-001")).toBe(true);
    expect(orderResults.some(item => item.path === "/orders/ORD-2024-001")).toBe(true);
  });

  it("keeps client portal search inside portal routes", () => {
    const results = getGlobalSearchResults("support", { isClientPortalUser: true });

    expect(results.length).toBeGreaterThan(0);
    expect(results.every(item => item.path.startsWith("/portal/"))).toBe(true);
  });
});
