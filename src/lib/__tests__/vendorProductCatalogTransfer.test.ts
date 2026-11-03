import { describe, expect, it } from "vitest";
import type { VendorProduct } from "../vendorStore";
import {
  exportVendorProductCatalogCsv,
  filterVendorProductsByCatalogType,
  parseVendorProductArrayField,
  parseVendorProductImportFile,
  parseVendorProductVariations,
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
      name: "User",
      options: [
        { id: "option-two-users", label: "2 Users", priceAdjustment: 500 },
        { id: "option-one-year", label: "1 Year", priceAdjustment: 250 },
      ],
    },
    {
      id: "variation-region",
      name: "Storage",
      options: [
        { id: "option-20-gb", label: "20 GB", priceAdjustment: 1999 },
        { id: "option-50-gb", label: "50 GB", priceAdjustment: 2499 },
      ],
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

  it("exports digital variations as field, option, and price columns and round-trips them", () => {
    const csv = exportVendorProductCatalogCsv([digitalProduct], "digital");
    const headers = csv.split(/\r?\n/, 1)[0].replace(/^\uFEFF/, "").split(",");
    const [row] = parseVendorProductImportFile("vendor-digital-catalog.csv", csv);
    const variations = parseVendorProductVariations(row, digitalProduct.variations);
    const images = parseVendorProductArrayField<string>(row, "images");

    expect(headers).toEqual([
      "vendorId",
      "masterProductCode",
      "skuCode",
      "productName",
      "category",
      "brand",
      "physicalType",
      "Variation field 1",
      "Option 1",
      "Price 1",
      "Option 2",
      "Price 2",
      "Variation field 2",
      "Option 1",
      "Price 1",
      "Option 2",
      "Price 2",
      "price",
      "moq",
      "leadTime",
      "stock",
      "lastStockUpdate",
      "vendorProductCode",
      "addedAt",
      "status",
    ]);
    expect(headers).not.toContain("id");
    expect(headers).not.toContain("images");
    expect(headers).not.toContain("physicalStock");
    expect(headers).not.toContain("reservedStock");
    expect(headers).not.toContain("incomingStock");
    expect(row).not.toHaveProperty("id");
    expect(row.masterproductcode).toBe(digitalProduct.masterProductCode);
    expect(row.vendorproductcode).toBe(digitalProduct.vendorProductCode);
    expect(row.price).toBe(digitalProduct.price);
    expect(row.variationfield1).toBe("User");
    expect(row.variationfield1option1).toBe("2 Users");
    expect(row.variationfield1price1).toBe("500");
    expect(row.variationfield2).toBe("Storage");
    expect(row.variationfield2option2).toBe("50 GB");
    expect(row.variationfield2price2).toBe("2499");
    expect(images.found).toBe(false);
    expect(variations.value).toEqual(digitalProduct.variations);
  });

  it("keeps physical export variations in the legacy JSON column", () => {
    const csv = exportVendorProductCatalogCsv([physicalProduct], "physical");
    const headers = csv.split(/\r?\n/, 1)[0].replace(/^\uFEFF/, "").split(",");
    const [row] = parseVendorProductImportFile("vendor-physical-catalog.csv", csv);

    expect(headers).toContain("id");
    expect(headers).not.toContain("images");
    expect(headers).toContain("physicalStock");
    expect(headers).toContain("reservedStock");
    expect(headers).toContain("incomingStock");
    expect(row.variations).toBe("[]");
  });

  it("reads variation arrays directly from JSON imports", () => {
    const [row] = parseVendorProductImportFile(
      "vendor-digital-catalog.json",
      JSON.stringify([digitalProduct]),
    );

    expect(parseVendorProductArrayField(row, "variations").value)
      .toEqual(digitalProduct.variations);
  });

  it("imports all variation fields and options even when column headers repeat in Excel/CSV", () => {
    const csvWithRepeatedHeaders = [
      "vendorId,masterProductCode,skuCode,productName,physicalType,Variation field 1,Option 1,Price 1,Variation field 1,Option 1,Price 1,Variation field 1,Option 1,Price 1,price",
      'VND-1006,MPC-001,SKU-001,Cloud Product,Digital Licence,Users,1 User,100,Plan,Pro,500,Storage,100 GB,1200,0',
    ].join("\n");

    const [row] = parseVendorProductImportFile("digital-import.csv", csvWithRepeatedHeaders);
    const variations = parseVendorProductVariations(row);

    expect(variations.found).toBe(true);
    expect(variations.value).toHaveLength(3);
    expect(variations.value[0].name).toBe("Users");
    expect(variations.value[0].options[0].label).toBe("1 User");
    expect(variations.value[0].options[0].priceAdjustment).toBe(100);
    expect(variations.value[1].name).toBe("Plan");
    expect(variations.value[1].options[0].label).toBe("Pro");
    expect(variations.value[1].options[0].priceAdjustment).toBe(500);
    expect(variations.value[2].name).toBe("Storage");
    expect(variations.value[2].options[0].label).toBe("100 GB");
    expect(variations.value[2].options[0].priceAdjustment).toBe(1200);
  });

  it("imports tab-delimited files with multiple variations", () => {
    const tsv = [
      ["vendorId", "productName", "physicalType", "Variation field 1", "Option 1", "Price 1", "Variation field 2", "Option 1", "Price 1"].join("\t"),
      ["VND-1006", "Test App", "Digital Licence", "Tier", "Basic", "50", "Region", "US East", "20"].join("\t"),
    ].join("\n");

    const [row] = parseVendorProductImportFile("digital-import.tsv", tsv);
    const variations = parseVendorProductVariations(row);

    expect(variations.found).toBe(true);
    expect(variations.value).toHaveLength(2);
    expect(variations.value[0].name).toBe("Tier");
    expect(variations.value[0].options[0].label).toBe("Basic");
    expect(variations.value[1].name).toBe("Region");
    expect(variations.value[1].options[0].label).toBe("US East");
  });
});
