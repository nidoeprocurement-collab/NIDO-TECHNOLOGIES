export type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";

/** The same product-type rules used by the vendor product list. */
export function getProductType(type?: string): string {
  return type?.trim() || "Physical Product";
}

export function isDigitalType(type: string): boolean {
  const normalized = type.toLowerCase();
  return normalized.includes("digital")
    || normalized.includes("subscription")
    || normalized.includes("saas")
    || normalized.includes("cloud")
    || normalized.includes("service");
}

export function isHybridType(type: string): boolean {
  return type.toLowerCase().includes("hybrid");
}

/** Proforma invoices are supported only for physical goods and hybrid products. */
export function isPhysicalOrHybridType(type?: string): boolean {
  const normalized = String(type || "").trim().toLowerCase();
  return normalized === "physical product"
    || normalized === "physical"
    || normalized.includes("hybrid");
}

export interface ProductTypeMetadata {
  productType?: string;
  physicalType?: string;
  fulfillmentType?: string;
  category?: string;
  commercialTerms?: { productType?: string } | null;
}

function isExplicitlyNonPhysicalType(type: string): boolean {
  const normalized = type.trim().toLowerCase();
  return isDigitalType(normalized)
    || normalized.includes("license")
    || normalized.includes("software")
    || normalized.includes("consulting")
    || normalized.includes("implementation")
    || normalized.includes("maintenance")
    || normalized.includes("hosting")
    || normalized.includes("support")
    || normalized.includes("training")
    || normalized.includes("virtual");
}

function isGenericProductType(type: string): boolean {
  return [
    "product",
    "item",
    "goods",
    "catalog product",
    "product type",
  ].includes(type.trim().toLowerCase());
}

/**
 * Resolve proforma eligibility from the original product metadata rather than
 * from a display-only commercial-terms fallback. Missing or conflicting
 * metadata is rejected so non-physical items cannot become eligible by
 * defaulting to "Physical Product".
 */
export function isPhysicalOrHybridProduct(metadata: ProductTypeMetadata): boolean {
  const fulfillmentType = String(metadata.fulfillmentType || "").trim().toLowerCase();
  if (fulfillmentType) {
    if (fulfillmentType !== "physical" && fulfillmentType !== "hybrid") return false;
  }

  const typeValues = [
    metadata.physicalType,
    metadata.commercialTerms?.productType,
    metadata.productType,
  ].map((value) => String(value || "").trim()).filter(Boolean);
  const classificationValues = [
    ...typeValues,
    metadata.category,
  ].map((value) => String(value || "").trim()).filter(Boolean);

  if (typeValues.length === 0) return false;
  if (classificationValues.some(isExplicitlyNonPhysicalType)) return false;

  const hasHybridClassification = classificationValues.some((value) => isHybridType(value));
  if (hasHybridClassification) return true;

  // A meaningful productType that is neither physical nor hybrid is not
  // allowed to inherit a default physicalType from legacy catalog records.
  const productType = String(metadata.productType || "").trim();
  if (
    productType
    && !isGenericProductType(productType)
    && !isPhysicalOrHybridType(productType)
  ) return false;

  const primaryType = typeValues[0];
  return isPhysicalOrHybridType(primaryType);
}

export function isDigitalOnlyType(type: string): boolean {
  return isDigitalType(type) && !isHybridType(type);
}

export function getPricingModel(type: string): string {
  const normalized = type.toLowerCase();
  if (normalized.includes("cloud")) return "Pay-As-You-Go (Consumption)";
  if (normalized.includes("subscription") || normalized.includes("saas")) return "Per Account / Year";
  if (normalized.includes("digital")) return "Per User / Year";
  if (normalized.includes("hybrid")) return "Per Unit + Subscription";
  return "Per Unit";
}

export function getQuantityLabel(type: string): string {
  const normalized = type.toLowerCase();
  if (normalized.includes("cloud")) return "Min. Commitment";
  if (normalized.includes("subscription") || normalized.includes("saas")) return "Account";
  if (normalized.includes("digital")) return "User";
  return "Units";
}

export function formatLeadTimeByType(
  leadTime: string | number | undefined,
  type: string,
): { primary: string; secondary?: string } {
  const value = typeof leadTime === "number"
    ? leadTime
    : parseInt(leadTime || "", 10) || 0;

  if (isDigitalOnlyType(type)) {
    return {
      primary: value > 0 ? `${value} Hours` : "Instant",
      secondary: "Provisioning",
    };
  }

  return {
    primary: value > 0 ? `${value} Days` : "—",
    secondary: isHybridType(type) ? "Instant" : undefined,
  };
}

export function getAvailabilityByType(
  stock: number,
  type: string,
): {
  primary: string;
  status: StockStatus | "Instant";
  isUnlimited: boolean;
} {
  if (isDigitalOnlyType(type)) {
    return { primary: "Unlimited", status: "Instant", isUnlimited: true };
  }

  const available = Math.max(0, stock || 0);
  const status: StockStatus =
    available > 10 ? "In Stock" : available > 0 ? "Low Stock" : "Out of Stock";
  return {
    primary: `${available.toLocaleString("en-IN")} Units`,
    status,
    isUnlimited: false,
  };
}