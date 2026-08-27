export type FulfillmentType = "physical" | "digital";

export type ProductTypeFields = {
  productType?: string;
  physicalType?: string;
  fulfillmentType?: FulfillmentType;
};

/**
 * Product Type is the single source of truth for Shop fulfillment behavior.
 * physicalType is retained for compatibility with the existing catalogue
 * schema, while fulfillmentType is the normalized value carried in carts and
 * orders.
 */
export function getFulfillmentType(product: ProductTypeFields): FulfillmentType {
  if (product.fulfillmentType) return product.fulfillmentType;

  const physicalType = (product.physicalType || "").trim().toLowerCase();
  const productType = (product.productType || "").trim().toLowerCase();

  if (physicalType.includes("digital") || physicalType.includes("service")) return "digital";
  if (physicalType.includes("physical")) return "physical";
  if (productType.includes("digital") || productType.includes("service")) return "digital";
  return "physical";
}

export function isDigitalProduct(product: ProductTypeFields): boolean {
  return getFulfillmentType(product) === "digital";
}