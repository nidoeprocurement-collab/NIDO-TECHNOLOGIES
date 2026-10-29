import { afterEach, describe, expect, it } from "vitest";
import { getVendorProducts, isCatalogProductAlreadyAssigned } from "../vendorStore";

describe("isCatalogProductAlreadyAssigned", () => {
  it("matches a vendor product by catalog ID", () => {
    expect(isCatalogProductAlreadyAssigned(
      { id: "catalog-1", masterProductCode: "MPC-1" },
      [{ id: "catalog-1", masterProductCode: "MPC-1" }],
    )).toBe(true);
  });

  it("matches legacy vendor records by master product code", () => {
    expect(isCatalogProductAlreadyAssigned(
      { id: "catalog-1", masterProductCode: "MPC-1" },
      [{ id: "legacy-id", masterProductCode: "mpc-1" }],
    )).toBe(true);
  });

  it("does not match an unassigned product", () => {
    expect(isCatalogProductAlreadyAssigned(
      { id: "catalog-1", masterProductCode: "MPC-1" },
      [{ id: "catalog-2", masterProductCode: "MPC-2" }],
    )).toBe(false);
  });
});

describe("digital vendor base pricing", () => {
  afterEach(() => {
    localStorage.removeItem("nido_vendor_products");
  });

  it("normalizes digital base prices to zero and preserves physical and variation prices", () => {
    const variation = {
      id: "license-tier",
      name: "License tier",
      options: [{ label: "Annual", priceAdjustment: 2400 }],
    };
    localStorage.setItem("nido_vendor_products", JSON.stringify({
      vendor1: [
        {
          id: "digital-1",
          physicalType: "Cloud Service",
          price: "1500",
          physicalStock: "0",
          reservedStock: "0",
          variations: [variation],
        },
        {
          id: "physical-1",
          physicalType: "Physical Product",
          price: "850",
          physicalStock: "10",
          reservedStock: "0",
        },
      ],
    }));

    const products = getVendorProducts("vendor1");

    expect(products[0].price).toBe("0");
    expect(products[0].variations).toEqual([variation]);
    expect(products[1].price).toBe("850");
    expect(JSON.parse(localStorage.getItem("nido_vendor_products") || "{}").vendor1[0].price).toBe("0");
  });
});