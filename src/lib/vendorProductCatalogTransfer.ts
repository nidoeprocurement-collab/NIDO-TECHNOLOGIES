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
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const delimiter = tabCount > commaCount ? "\t" : ",";

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
    } else if (char === delimiter && !quoted) {
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

  const rawHeaders = rows[0];
  let currentVariationIndex = 0;
  let currentOptionIndex = 0;

  const headers = rawHeaders.map((value, colIndex) => {
    const header = normalizeKey(value);

    // Check if this column represents a variation field / variation name
    const isVariationField =
      (header.startsWith("variation") || header.startsWith("field") || header === "var") &&
      !header.includes("option") &&
      !header.includes("price") &&
      !header.includes("label") &&
      !header.includes("adjustment");

    if (isVariationField) {
      const match = header.match(/^variation(?:field)?(\d+)$/);
      const explicitNum = match ? Number(match[1]) : 0;
      if (explicitNum > currentVariationIndex) {
        currentVariationIndex = explicitNum;
      } else {
        currentVariationIndex += 1;
      }
      currentOptionIndex = 0;
      return `variationfield${currentVariationIndex}`;
    }

    // Check if this column represents an option / option label
    const isOption =
      (header.includes("option") || header.includes("label")) &&
      !header.includes("price") &&
      !header.includes("adjustment");

    if (isOption) {
      if (currentVariationIndex === 0) currentVariationIndex = 1;
      const match = header.match(/option(\d+)$/) || header.match(/label(\d+)$/);
      const explicitNum = match ? Number(match[1]) : 0;
      if (explicitNum > currentOptionIndex) {
        currentOptionIndex = explicitNum;
      } else {
        currentOptionIndex += 1;
      }
      return `variationfield${currentVariationIndex}option${currentOptionIndex}`;
    }

    // Check if this column represents a price adjustment for the current option
    const prevHeader = colIndex > 0 ? normalizeKey(rawHeaders[colIndex - 1]) : "";
    const isPrice =
      currentVariationIndex > 0 &&
      currentOptionIndex > 0 &&
      (header.includes("price") || header.includes("adjustment")) &&
      (header !== "price" || prevHeader.includes("option") || prevHeader.includes("label"));

    if (isPrice) {
      return `variationfield${currentVariationIndex}price${currentOptionIndex}`;
    }

    // If regular column reached, close current variation context
    if (currentVariationIndex > 0) {
      currentVariationIndex = 0;
      currentOptionIndex = 0;
    }

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
  const beforeVariationHeaders = isDigitalCatalog
    ? PRODUCT_HEADERS_BEFORE_VARIATIONS.filter((header) => header !== "id")
    : PRODUCT_HEADERS_BEFORE_VARIATIONS;
  const afterVariationHeaders = isDigitalCatalog
    ? PRODUCT_HEADERS_AFTER_VARIATIONS.filter(
      (header) => !["physicalStock", "reservedStock", "incomingStock"].includes(header),
    )
    : PRODUCT_HEADERS_AFTER_VARIATIONS;
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
    ...beforeVariationHeaders,
    ...variationHeaders,
    ...afterVariationHeaders,
  ];

  const rows = products.map((product) => {
    const variationValues = isDigitalCatalog
      ? buildVariationValues(product.variations, maxVariationCount, maxOptionsPerField)
      : [JSON.stringify(product.variations ?? [])];
    const beforeVariationValues: Record<string, unknown> = {
      id: product.id,
      vendorId: product.vendorId,
      masterProductCode: product.masterProductCode,
      skuCode: product.skuCode,
      productName: product.productName,
      category: product.category,
      brand: product.brand,
      physicalType: product.physicalType,
    };
    const afterVariationValues: Record<string, unknown> = {
      price: product.price,
      moq: product.moq,
      leadTime: product.leadTime,
      stock: product.stock,
      physicalStock: product.physicalStock,
      reservedStock: product.reservedStock,
      incomingStock: product.incomingStock,
      lastStockUpdate: product.lastStockUpdate,
      vendorProductCode: product.vendorProductCode,
      addedAt: product.addedAt,
      status: product.status,
    };
    return [
      ...beforeVariationHeaders.map((header) => beforeVariationValues[header]),
      ...variationValues,
      ...afterVariationHeaders.map((header) => afterVariationValues[header]),
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

    const effectiveName = name || (optionValues.size > 0 ? (existingVariations[index - 1]?.name || `Variation ${index}`) : "");
    if (!effectiveName && optionValues.size === 0) return [];

    const existingVariation = existingVariations.find(
      (variation) => variation.name.trim().toLowerCase() === effectiveName.toLowerCase(),
    ) ?? existingVariations[index - 1];
    const options = [...optionValues.entries()]
      .sort(([left], [right]) => left - right)
      .flatMap(([optionIndex, importedOption]) => {
        const label = importedOption.label?.trim() ?? "";
        if (!label) return [];
        const priceText = importedOption.price?.replace(/,/g, "").trim() ?? "";
        const priceAdjustment = priceText ? Number(priceText) : 0;
        if (!Number.isFinite(priceAdjustment)) {
          throw new Error(`The price for "${label}" in "${effectiveName}" must be a number.`);
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

    if (options.length === 0) return [];

    return [{
      id: existingVariation?.id || `imported-variation-${index}-${normalizeKey(effectiveName) || "field"}`,
      name: effectiveName,
      options,
    }];
  });

  return { found: variations.length > 0, value: variations };
}
