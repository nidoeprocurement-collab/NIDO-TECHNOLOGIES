import { describe, expect, it } from "vitest";
import type { VendorProduct } from "../vendorStore";
import {
  exportVendorProductCatalogCsv,
  filterVendorProductsByCatalogType,
  parseVendorProductArrayField,
  parseVendorProductImportFile,
} from "../vendorProductCatalogTransfer";

const physicalProduct: VendorProduct = {
  id: "catalog-physical",
  vendorId: "vendor-1",
  masterProductCode: "MPC-PHYSICAL",
  skuCode: "SKU-PHYSICAL",
  productName: "Physical Product",
  category: "Hardware",
  brand: "Example",
  physicalType: "Physical Product",
  images: ["https://example.com/physical.png"],
  price: "1200.00",
  moq: "2",
  leadTime: "3 Days",
  stock: "25",
  physicalStock: "25",
  reservedStock: "0",
  incomingStock: "5",
  vendorProductCode: "VPC-00001",
  addedAt: "28 Oct 2026",
  status: "Active",
};

const digitalProduct: VendorProduct = {
  ...physicalProduct,
  id: "catalog-digital",
  masterProductCode: "MPC-DIGITAL",
  skuCode: "SKU-DIGITAL",
  productName: "Digital Product",
  physicalType: "Digital License",
  variations: [
    {
      id: "variation-license",
      name: "License Type",
      options: [
        { id: "option-standard", label: "Standard", priceAdjustment: 0 },
        { id: "option-enterprise", label: "Enterprise, Plus", priceAdjustment: 250 },
      ],
    },
    {
      id: "variation-region",
      name: "Region",
      options: [{ id: "option-india", label: "India", priceAdjustment: 0 }],
    },
  ],
};

describe("vendor product catalog transfer", () => {
  it("splits physical and digital products into separate catalogs", () => {
    expect(filterVendorProductsByCatalogType([physicalProduct, digitalProduct], "physical"))
      .toEqual([physicalProduct]);
    expect(filterVendorProductsByCatalogType([physicalProduct, digitalProduct], "digital"))
      .toEqual([digitalProduct]);
  });

  it("round-trips vendor details and every digital variation through CSV", () => {
    const csv = exportVendorProductCatalogCsv([digitalProduct]);
    const [row] = parseVendorProductImportFile("vendor-digital-catalog.csv", csv);
    const variations = parseVendorProductArrayField<typeof digitalProduct.variations[number]>(
      row,
      "variations",
    );
    const images = parseVendorProductArrayField<string>(row, "images");

    expect(row.masterproductcode).toBe(digitalProduct.masterProductCode);
    expect(row.vendorproductcode).toBe(digitalProduct.vendorProductCode);
    expect(row.price).toBe(digitalProduct.price);
    expect(images.value).toEqual(digitalProduct.images);
    expect(variations.value).toEqual(digitalProduct.variations);
  });

  it("reads variation arrays directly from JSON imports", () => {
    const [row] = parseVendorProductImportFile(
      "vendor-digital-catalog.json",
      JSON.stringify([digitalProduct]),
    );

    expect(parseVendorProductArrayField(row, "variations").value)
      .toEqual(digitalProduct.variations);
  });
});
