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