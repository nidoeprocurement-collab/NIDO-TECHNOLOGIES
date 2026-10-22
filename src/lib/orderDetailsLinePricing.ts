export type OrderDetailsDiscountType = "percentage" | "amount";

export interface OrderDetailsLinePricingInput {
  unitPriceExclGst: number;
  quantity: number;
  taxRate: number;
  discountType: OrderDetailsDiscountType;
  discountValue: number;
}

export interface OrderDetailsLinePricing {
  grossPreTax: number;
  discountAmount: number;
  preTaxSubtotal: number;
  taxAmount: number;
  total: number;
}

export function calculateOrderDetailsLinePricing({
  unitPriceExclGst,
  quantity,
  taxRate,
  discountType,
  discountValue,
}: OrderDetailsLinePricingInput): OrderDetailsLinePricing {
  const unitPrice = Math.max(0, Number(unitPriceExclGst) || 0);
  const qty = Math.max(0, Number(quantity) || 0);
  const rate = Math.max(0, Number(taxRate) || 0);
  const value = Math.max(0, Number(discountValue) || 0);
  const grossPreTax = unitPrice * qty;
  const discountAmount = discountType === "percentage"
    ? grossPreTax * Math.min(value, 100) / 100
    : Math.min(value, grossPreTax);
  const preTaxSubtotal = Math.max(0, grossPreTax - discountAmount);
  const taxAmount = preTaxSubtotal * rate / 100;

  return {
    grossPreTax,
    discountAmount,
    preTaxSubtotal,
    taxAmount,
    total: preTaxSubtotal + taxAmount,
  };
}
