import { describe, expect, it } from "vitest";
import { calculateOrderDetailsLinePricing } from "../orderDetailsLinePricing";

describe("Order Details line pricing", () => {
  it("applies a percentage discount before calculating tax", () => {
    expect(calculateOrderDetailsLinePricing({
      unitPriceExclGst: 100,
      quantity: 2,
      taxRate: 18,
      discountType: "percentage",
      discountValue: 10,
    })).toEqual({
      grossPreTax: 200,
      discountAmount: 20,
      preTaxSubtotal: 180,
      taxAmount: 32.4,
      total: 212.4,
    });
  });

  it("applies a fixed-currency discount to the line total and caps it at the taxable amount", () => {
    expect(calculateOrderDetailsLinePricing({
      unitPriceExclGst: 100,
      quantity: 2,
      taxRate: 18,
      discountType: "amount",
      discountValue: 250,
    })).toEqual({
      grossPreTax: 200,
      discountAmount: 200,
      preTaxSubtotal: 0,
      taxAmount: 0,
      total: 0,
    });
  });
});
