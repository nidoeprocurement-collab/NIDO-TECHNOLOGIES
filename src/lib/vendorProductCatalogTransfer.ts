import type { VendorProduct } from "./vendorStore";
import type { CatalogVariation } from "./catalogStore";
import { getProductType, isDigitalOnlyType } from "./productTypeRules";

export type VendorCatalogType = "physical" | "digital";

const PRODUCT_HEADERS_BEFORE_VARIATIONS = [
  "id",
  "vendorId",
  "masterProductCode",
  "skuCode",
  "productName",
  "category",
  "brand",
  "physicalType",
  "images",
] as const;

const PRODUCT_HEADERS_AFTER_VARIATIONS = [
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

  let activeVariationField = 0;
  const headers = rows[0].map((value) => {
    const header = normalizeKey(value);
    const variationField = header.match(/^variationfield(\d+)$/);
    if (variationField) {
      activeVariationField = Number(variationField[1]);
      return header;
    }
    if (activeVariationField && /^(option|price)\d+$/.test(header)) {
      return `variationfield${activeVariationField}${header}`;
    }
    activeVariationField = 0;
    return header;
  });
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

function buildVariationHeaders(fieldCount: number, optionsPerField: number): string[] {
  return Array.from({ length: fieldCount }, (_, fieldIndex) => [
    `Variation field ${fieldIndex + 1}`,
    ...Array.from({ length: optionsPerField }, (_, optionIndex) => [
      `Option ${optionIndex + 1}`,
      `Price ${optionIndex + 1}`,
    ]).flat(),
  ]).flat();
}

function buildVariationValues(
  variations: readonly CatalogVariation[] | undefined,
  fieldCount: number,
  optionsPerField: number,
): unknown[] {
  return Array.from({ length: fieldCount }, (_, fieldIndex) => {
    const variation = variations?.[fieldIndex];
    const optionValues = Array.from({ length: optionsPerField }, (_, optionIndex) => {
      const option = variation?.options[optionIndex];
      return [option?.label ?? "", option?.priceAdjustment ?? ""];
    }).flat();
    return [variation?.name ?? "", ...optionValues];
  }).flat();
}

export function exportVendorProductCatalogCsv(
  products: readonly VendorProduct[],
  catalogType: VendorCatalogType = "physical",
): string {
  const isDigitalCatalog = catalogType === "digital";
  const maxVariationCount = isDigitalCatalog
    ? Math.max(1, ...products.map((product) => product.variations?.length ?? 0))
    : 0;
  const maxOptionsPerField = isDigitalCatalog
    ? Math.max(
        1,
        ...products.flatMap((product) => (product.variations ?? []).map((variation) => variation.options.length)),
      )
    : 0;
  const variationHeaders = isDigitalCatalog
    ? buildVariationHeaders(maxVariationCount, maxOptionsPerField)
    : ["variations"];
  const headers = [
    ...PRODUCT_HEADERS_BEFORE_VARIATIONS,
    ...variationHeaders,
    ...PRODUCT_HEADERS_AFTER_VARIATIONS,
  ];

  const rows = products.map((product) => {
    const variationValues = isDigitalCatalog
      ? buildVariationValues(product.variations, maxVariationCount, maxOptionsPerField)
      : [JSON.stringify(product.variations ?? [])];
    return [
      product.id,
      product.vendorId,
      product.masterProductCode,
      product.skuCode,
      product.productName,
      product.category,
      product.brand,
      product.physicalType,
      JSON.stringify(product.images ?? []),
      ...variationValues,
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
    ].map(csvEscape).join(",");
  });

  return `\uFEFF${headers.join(",")}\n${rows.join("\n")}`;
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

export function parseVendorProductVariations(
  row: Record<string, unknown>,
  existingVariations: readonly CatalogVariation[] = [],
): { found: boolean; value: CatalogVariation[] } {
  const jsonVariations = parseVendorProductArrayField<CatalogVariation>(
    row,
    "variations",
    "vendorVariations",
  );
  if (jsonVariations.found) return jsonVariations;

  const fieldEntries = Object.entries(row)
    .map(([key, value]) => {
      const match = normalizeKey(key).match(/^variationfield(\d+)$/);
      return match ? { index: Number(match[1]), name: String(value ?? "").trim() } : null;
    })
    .filter((entry): entry is { index: number; name: string } => entry !== null)
    .sort((left, right) => left.index - right.index);
  if (fieldEntries.length === 0) return { found: false, value: [] };

  const variations = fieldEntries.flatMap(({ index, name }) => {
    if (!name) return [];

    const prefix = `variationfield${index}`;
    const optionValues = new Map<number, { label?: string; price?: string }>();
    for (const [key, rawValue] of Object.entries(row)) {
      const match = normalizeKey(key).match(new RegExp(`^${prefix}(option|price)(\\d+)$`));
      if (!match) continue;
      const optionIndex = Number(match[2]);
      const current = optionValues.get(optionIndex) ?? {};
      if (match[1] === "option") current.label = String(rawValue ?? "").trim();
      else current.price = String(rawValue ?? "").trim();
      optionValues.set(optionIndex, current);
    }

    const existingVariation = existingVariations.find(
      (variation) => variation.name.trim().toLowerCase() === name.toLowerCase(),
    ) ?? existingVariations[index - 1];
    const options = [...optionValues.entries()]
      .sort(([left], [right]) => left - right)
      .flatMap(([optionIndex, importedOption]) => {
        const label = importedOption.label?.trim() ?? "";
        if (!label) return [];
        const priceText = importedOption.price?.replace(/,/g, "").trim() ?? "";
        const priceAdjustment = priceText ? Number(priceText) : 0;
        if (!Number.isFinite(priceAdjustment)) {
          throw new Error(`The price for "${label}" in "${name}" must be a number.`);
        }
        const existingOption = existingVariation?.options.find(
          (option) => option.label.trim().toLowerCase() === label.toLowerCase(),
        ) ?? existingVariation?.options[optionIndex - 1];
        return [{
          id: existingOption?.id || `imported-option-${index}-${optionIndex}-${normalizeKey(label) || "option"}`,
          label,
          priceAdjustment,
        }];
      });

    return [{
      id: existingVariation?.id || `imported-variation-${index}-${normalizeKey(name) || "field"}`,
      name,
      options,
    }];
  });

  return { found: true, value: variations };
}
