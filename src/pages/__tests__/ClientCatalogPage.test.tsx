import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import ClientCatalogPage from "@/pages/ClientCatalogPage";
import { saveCatalogProduct, type CatalogProduct } from "@/lib/catalogStore";
import { saveVendorProducts } from "@/lib/vendorStore";
import { saveVendors } from "@/lib/vendorDataStore";
import { createPortalRolePermission, savePortalRoles } from "@/lib/portalUserStore";
import { getClientCatalog } from "@/lib/clientCatalogStore";

const clientId = "CL-TEST-DIGITAL";

describe("ClientCatalogPage digital products from vendors", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it("shows only digital products added across vendors' digital products when adding digital products to a client", () => {
    saveVendors([
      {
        id: "VND-1001",
        name: "Karna Industries",
        category: "Software & Cloud",
        primaryContact: "Suraj V P",
        email: "suraj@nidotech.com",
        phone: "8125784555",
        rating: 4,
        region: "Karnataka",
        status: "Active",
        onboardedDate: "2026-11-10",
        monthSpend: 0,
        score: 80,
        address: "Karnataka",
        totalSpend: 0,
        complianceIssues: 0,
        archived: false,
      },
    ]);

    savePortalRoles(clientId, [
      {
        id: "role-admin",
        name: "IT Manager",
        description: "Manages software",
        status: "active",
        permissions: [createPortalRolePermission("Catalog", { view: true })],
      },
    ]);

    // Master catalog has an unassigned digital product that no vendor offers
    const unassignedMasterDigital: CatalogProduct = {
      id: "cat-unassigned-digital",
      masterProductCode: "MPC-UNASSIGNED-DIG",
      skuCode: "SKU-UNASSIGNED-DIG",
      productName: "Unassigned Master Cloud Suite",
      productType: "Digital License",
      physicalType: "Digital License",
      category: "Software",
      subcategory: "",
      brand: "CloudCorp",
      tags: [],
      description: "Not added to any vendor",
      specifications: [],
      generalSpecs: [],
      variations: [],
      productNotes: "",
      videoUrl: "",
      images: [],
      publishStatus: "published",
      price: 1500,
      moq: 1,
      leadTime: "Instant",
      warranty: "",
    };
    saveCatalogProduct(unassignedMasterDigital);

    // Vendor has 2 digital products (one imported directly without master catalog entry, one with MPC) and 1 physical product
    saveVendorProducts("VND-1001", [
      {
        id: "vp-dig-1",
        vendorId: "VND-1001",
        masterProductCode: "MPC-DIG-001",
        skuCode: "SKU-DIG-001",
        productName: "Vendor Microsoft 365 Business",
        category: "Software",
        brand: "Microsoft",
        physicalType: "Digital License",
        images: [],
        variations: [
          {
            id: "var-1",
            name: "Plan",
            options: [{ id: "opt-1", label: "Standard (1 Year)", priceAdjustment: 4999 }],
          },
        ],
        price: "0",
        moq: "1",
        leadTime: "2",
        stock: "0",
        physicalStock: "0",
        reservedStock: "0",
        incomingStock: "0",
        vendorProductCode: "VPC-00001",
        addedAt: "10 Nov 2026",
        status: "Active",
      },
      {
        id: "vp-dig-2",
        vendorId: "VND-1001",
        masterProductCode: "",
        skuCode: "SKU-AWS-002",
        productName: "Vendor AWS Cloud Credits",
        category: "Cloud",
        brand: "AWS",
        physicalType: "Cloud Service",
        images: [],
        variations: [],
        price: "0",
        moq: "1",
        leadTime: "Instant",
        stock: "0",
        physicalStock: "0",
        reservedStock: "0",
        incomingStock: "0",
        vendorProductCode: "VPC-00002",
        addedAt: "10 Nov 2026",
        status: "Active",
      },
      {
        id: "vp-phys-1",
        vendorId: "VND-1001",
        masterProductCode: "MPC-PHYS-001",
        skuCode: "SKU-PHYS-001",
        productName: "Vendor Physical Laptop",
        category: "Hardware",
        brand: "Dell",
        physicalType: "Physical Product",
        images: [],
        price: "55000",
        moq: "1",
        leadTime: "5",
        stock: "20",
        physicalStock: "20",
        reservedStock: "0",
        incomingStock: "0",
        vendorProductCode: "VPC-00003",
        addedAt: "10 Nov 2026",
        status: "Active",
      },
    ]);

    render(<ClientCatalogPage clientId={clientId} />);

    // Switch to Digital Products tab
    fireEvent.click(screen.getByRole("button", { name: /Digital Products/i }));

    // Open Add New Digital Product modal
    fireEvent.click(screen.getByRole("button", { name: /Add New Digital Product/i }));

    expect(screen.getByText("Add Digital Products to Client")).toBeTruthy();

    // Only the vendor's digital products should be shown
    expect(screen.getByText("Vendor Microsoft 365 Business")).toBeTruthy();
    expect(screen.getByText("Vendor AWS Cloud Credits")).toBeTruthy();

    // Unassigned master digital product and vendor physical product must NOT be shown
    expect(screen.queryByText("Unassigned Master Cloud Suite")).toBeNull();
    expect(screen.queryByText("Vendor Physical Laptop")).toBeNull();

    // Select one of the vendor digital products, assign role, and add to client catalog
    fireEvent.click(screen.getByText("Vendor Microsoft 365 Business"));
    fireEvent.click(screen.getByRole("button", { name: /Select roles/i }));
    fireEvent.click(screen.getByRole("button", { name: "IT Manager" }));
    fireEvent.click(screen.getByRole("button", { name: /Add Digital Product/i }));

    // Verify it is saved in client catalog and shown with vendor mapping
    const saved = getClientCatalog(clientId);
    expect(saved).toHaveLength(1);
    expect(saved[0].name).toBe("Vendor Microsoft 365 Business");
    expect(saved[0].variations).toHaveLength(1);

    const row = screen.getByRole("row", { name: /Vendor Microsoft 365 Business/i });
    expect(within(row).getByText(/Karna Industries/)).toBeTruthy();
  });
});

