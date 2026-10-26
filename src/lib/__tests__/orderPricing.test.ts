import { describe, expect, it } from "vitest";
import { calculateRemainingOrderPricing } from "../orderPricing";

describe("calculateRemainingOrderPricing", () => {
  it("recalculates customer totals from checkout snapshots and keeps order fees for remaining items", () => {
    const order = {
      id: "ORD-100",
      totalAmount: "$385.00",
      totalAmountNum: 385,
      checkoutPricingSnapshot: {
        shippingDeliveryFee: 10,
        platformFeePct: 5,
      },
      cartItems: [
        {
          id: 1,
          subOrderId: "SO-ORD-100-001",
          priceNum: 120,
          checkoutUnitPriceInclusive: 240,
          checkoutGstRate: 20,
          quantity: 2,
          category: "Hardware",
        },
        {
          id: 2,
          subOrderId: "SO-ORD-100-002",
          priceNum: 120,
          checkoutUnitPriceInclusive: 120,
          checkoutGstRate: 20,
          quantity: 1,
          category: "Hardware",
        },
      ],
    };

    const remaining = calculateRemainingOrderPricing(
      order,
      new Set(["SO-ORD-100-001"]),
    );

    expect(remaining.preTaxSubtotal).toBe(100);
    expect(remaining.subtotalBeforeDiscount).toBe(100);
    expect(remaining.discountAmount).toBe(0);
    expect(remaining.totalGst).toBe(20);
    expect(remaining.cgstAmount).toBe(10);
    expect(remaining.sgstAmount).toBe(10);
    expect(remaining.shippingDeliveryFee).toBe(10);
    expect(remaining.platformFee).toBe(5);
    expect(remaining.grandTotal).toBe(135);
  });

  it("uses a fixed platform fee from new checkout snapshots", () => {
    const remaining = calculateRemainingOrderPricing({
      id: "ORD-101",
      checkoutPricingSnapshot: {
        shippingDeliveryFee: 0,
        platformFee: 7,
      },
      cartItems: [{
        id: 1,
        priceNum: 120,
        checkoutUnitPriceInclusive: 120,
        checkoutGstRate: 20,
        quantity: 1,
        category: "Hardware",
      }],
    }, new Set());

    expect(remaining.preTaxSubtotal).toBe(100);
    expect(remaining.discountAmount).toBe(0);
    expect(remaining.subtotalBeforeDiscount).toBe(100);
    expect(remaining.totalGst).toBe(20);
    expect(remaining.cgstAmount).toBe(10);
    expect(remaining.sgstAmount).toBe(10);
    expect(remaining.platformFee).toBe(7);
    expect(remaining.grandTotal).toBe(127);
  });

  it("preserves legacy order totals by allocating them in proportion to saved line values", () => {
    const order = {
      id: "ORD-200",
      totalAmount: "₹354.00",
      totalAmountNum: 354,
      cartItems: [
        {
          id: 1,
          subOrderId: "SO-ORD-200-001",
          priceNum: 118,
          gstSnapshot: 18,
          quantity: 1,
          category: "Hardware",
        },
        {
          id: 2,
          subOrderId: "SO-ORD-200-002",
          priceNum: 236,
          gstSnapshot: 18,
          quantity: 1,
          category: "Hardware",
        },
      ],
    };

    const remaining = calculateRemainingOrderPricing(
      order,
      new Set(["SO-ORD-200-001"]),
    );

    expect(remaining.grandTotal).toBe(236);
  });

  it("shows the pre-discount subtotal and discount from saved checkout line snapshots", () => {
    const pricing = calculateRemainingOrderPricing({
      id: "ORD-300",
      totalAmountNum: 216,
      checkoutPricingSnapshot: { shippingDeliveryFee: 0, platformFee: 0 },
      cartItems: [{
        id: 1,
        priceNum: 120,
        quantity: 2,
        category: "Hardware",
        cartDiscountPct: 10,
        checkoutUnitPriceInclusive: 108,
        checkoutUnitPriceExclGst: 90,
        checkoutGstRate: 20,
      }],
    }, new Set());

    expect(pricing.preTaxSubtotal).toBe(180);
    expect(pricing.discountAmount).toBe(20);
    expect(pricing.subtotalBeforeDiscount).toBe(200);
    expect(pricing.cgstAmount).toBe(18);
    expect(pricing.sgstAmount).toBe(18);
    expect(pricing.grandTotal).toBe(216);
  });

  it("keeps fractional precision through GST, discount, fees, and the displayed total", () => {
    const inclusiveUnitPrice = 1.19;
    const checkoutUnitPriceExclGst = inclusiveUnitPrice * 100 / 118;
    const pricing = calculateRemainingOrderPricing({
      id: "ORD-PRECISION",
      checkoutPricingSnapshot: {
        shippingDeliveryFee: 0.025,
        platformFeePct: 1.25,
      },
      cartItems: [{
        priceNum: inclusiveUnitPrice,
        quantity: 1,
        category: "Hardware",
        cartDiscountPct: 12.5,
        checkoutUnitPriceInclusive: inclusiveUnitPrice,
        checkoutUnitPriceExclGst,
        checkoutGstRate: 18,
      }],
    }, new Set());

    const expectedDiscount = checkoutUnitPriceExclGst * 12.5 / 87.5;
    const expectedGst = inclusiveUnitPrice - checkoutUnitPriceExclGst;
    const expectedPlatformFee = checkoutUnitPriceExclGst * 1.25 / 100;

    expect(pricing.preTaxSubtotal).toBeCloseTo(checkoutUnitPriceExclGst, 12);
    expect(pricing.discountAmount).toBeCloseTo(expectedDiscount, 12);
    expect(pricing.subtotalBeforeDiscount).toBeCloseTo(checkoutUnitPriceExclGst + expectedDiscount, 12);
    expect(pricing.totalGst).toBeCloseTo(expectedGst, 12);
    expect(pricing.platformFee).toBeCloseTo(expectedPlatformFee, 12);
    expect(pricing.grandTotal).toBeCloseTo(
      pricing.subtotalBeforeDiscount + pricing.totalGst + pricing.shippingDeliveryFee
        + pricing.platformFee - pricing.discountAmount,
      12,
    );
  });

  it("removes fixed fees when every sub-order is cancelled", () => {
    const pricing = calculateRemainingOrderPricing({
      id: "ORD-CANCELLED",
      totalAmountNum: 127,
      checkoutPricingSnapshot: {
        shippingDeliveryFee: 10,
        platformFee: 7,
      },
      cartItems: [{
        subOrderId: "SO-ORD-CANCELLED-001",
        priceNum: 120,
        checkoutUnitPriceInclusive: 120,
        checkoutGstRate: 20,
        quantity: 1,
        category: "Hardware",
      }],
    }, new Set(["SO-ORD-CANCELLED-001"]));

    expect(pricing.shippingDeliveryFee).toBe(0);
    expect(pricing.platformFee).toBe(0);
    expect(pricing.grandTotal).toBe(0);
  });
});
