import type { VendorProduct } from "./vendorStore";
import { getProductType, isDigitalOnlyType } from "./productTypeRules";

export type VendorCatalogType = "physical" | "digital";

const CSV_HEADERS = [
  "id",
  "vendorId",
  "masterProductCode",
  "skuCode",
  "productName",
  "category",
  "brand",
  "physicalType",
  "images",
  "variations",
  "price",
  "moq",
  "leadTime",
  "stock",
  "physicalStock",
  "reservedStock",
  "incomingStock",
  "lastStockUpdate",
  "vendorProductCode",
  "addedAt",
  "status",
] as const;

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function csvEscape(value: unknown): string {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function parseCsvRows(text: string): Record<string, unknown>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field.trim());
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  row.push(field.trim());
  if (row.some((value) => value !== "")) rows.push(row);
  if (rows.length < 2) return [];

  const headers = rows[0].map(normalizeKey);
  return rows.slice(1).map((values) =>
    headers.reduce<Record<string, unknown>>((result, header, index) => {
      if (header) result[header] = values[index] ?? "";
      return result;
    }, {}),
  );
}

export function filterVendorProductsByCatalogType(
  products: readonly VendorProduct[],
  catalogType: VendorCatalogType,
): VendorProduct[] {
  return products.filter((product) => {
    const digital = isDigitalOnlyType(getProductType(product.physicalType));
    return digital === (catalogType === "digital");
  });
}

export function exportVendorProductCatalogCsv(products: readonly VendorProduct[]): string {
  const rows = products.map((product) =>
    [
      product.id,
      product.vendorId,
      product.masterProductCode,
      product.skuCode,
      product.productName,
      product.category,
      product.brand,
      product.physicalType,
      JSON.stringify(product.images ?? []),
      JSON.stringify(product.variations ?? []),
      product.price,
      product.moq,
      product.leadTime,
      product.stock,
      product.physicalStock,
      product.reservedStock,
      product.incomingStock,
      product.lastStockUpdate,
      product.vendorProductCode,
      product.addedAt,
      product.status,
    ].map(csvEscape).join(","),
  );

  return `\uFEFF${CSV_HEADERS.join(",")}\n${rows.join("\n")}`;
}

export function parseVendorProductImportFile(
  fileName: string,
  contents: string,
): Record<string, unknown>[] {
  const parsed: unknown = fileName.toLowerCase().endsWith(".json")
    ? JSON.parse(contents)
    : parseCsvRows(contents);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((row): row is Record<string, unknown> =>
    Boolean(row) && typeof row === "object" && !Array.isArray(row),
  );
}

export function parseVendorProductArrayField<T>(
  row: Record<string, unknown>,
  ...fieldNames: string[]
): { found: boolean; value: T[] } {
  const names = new Set(fieldNames.map(normalizeKey));
  const field = Object.entries(row).find(([key]) => names.has(normalizeKey(key)));
  if (!field) return { found: false, value: [] };

  const [fieldName, rawValue] = field;
  if (Array.isArray(rawValue)) return { found: true, value: rawValue as T[] };
  const text = String(rawValue ?? "").trim();
  if (!text) return { found: true, value: [] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`The ${fieldName} field must contain a JSON array.`);
  }
  if (!Array.isArray(parsed)) {
    throw new Error(`The ${fieldName} field must contain a JSON array.`);
  }
  return { found: true, value: parsed as T[] };
}
