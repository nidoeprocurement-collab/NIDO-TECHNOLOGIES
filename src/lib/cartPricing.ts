import { getClientCartPricingSettings, getSlabDiscountPct } from "./priceEngineStore";
import { computeCartGST, type GstSlab } from "./cartGstHelper";
import { getEffectiveTaxPctForCategory } from "./taxEngine";
import {
  getCartTaxRate,
  getCartUnitPriceInclusive,
  type VendorCartLine,
} from "./vendorCartPricing";

export type CartPricingItem = VendorCartLine & {
  quantity: number;
  clientId?: string;
  category?: string;
};

export interface CartPricingLine {
  taxRate: number;
  slabDiscountPct: number;
  clientDiscountPct: number;
  baseUnitPriceInclusive: number;
  preClientDiscountUnitPriceInclusive: number;
  checkoutUnitPriceInclusive: number;
  checkoutUnitPriceExclGst: number;
  slabDiscountPerUnitExclGst: number;
  clientDiscountPerUnitExclGst: number;
  combinedDiscountPct: number;
  combinedDiscountPerUnitExclGst: number;
}

export interface CartPricingSummary {
  lines: CartPricingLine[];
  slabs: GstSlab[];
  totalGst: number;
  preSlabDiscountSubtotal: number;
  slabDiscountAmount: number;
  totalDiscountAmount: number;
  totalDiscountPct: number;
  preTaxSubtotal: number;
  preClientDiscountSubtotal: number;
  clientDiscountAmount: number;
  shippingDeliveryFee: number;
  platformFee: number;
  grandTotal: number;
}

/**
 * Calculate the customer checkout price once for Cart, Review, and saved orders.
 * Cart unit prices are GST-inclusive; the vendor landed cost is never used here.
 */
export function calculateCartPricing(items: CartPricingItem[]): CartPricingSummary {
  const lines = items.map((item) => {
    const taxRate = getCartTaxRate(item) ?? getEffectiveTaxPctForCategory(item.category || "");
    const baseUnitPriceInclusive = getCartUnitPriceInclusive(item, taxRate);
    const slabDiscountPct = item.clientId
      ? getSlabDiscountPct(item.clientId, item.category || "", item.quantity)
      : 0;
    const clientDiscountPct = item.clientId
      ? getClientCartPricingSettings(item.clientId).discountPct
      : 0;
    const preClientDiscountUnitPriceInclusive = baseUnitPriceInclusive * (1 - slabDiscountPct / 100);
    const checkoutUnitPriceInclusive =
      preClientDiscountUnitPriceInclusive * (1 - clientDiscountPct / 100);
    const checkoutUnitPriceExclGst =
      taxRate > 0
        ? checkoutUnitPriceInclusive * 100 / (100 + taxRate)
        : checkoutUnitPriceInclusive;
    const baseUnitPriceExclGst =
      taxRate > 0
        ? baseUnitPriceInclusive * 100 / (100 + taxRate)
        : baseUnitPriceInclusive;
    const preClientDiscountUnitPriceExclGst =
      taxRate > 0
        ? preClientDiscountUnitPriceInclusive * 100 / (100 + taxRate)
        : preClientDiscountUnitPriceInclusive;

    return {
      taxRate,
      slabDiscountPct,
      clientDiscountPct,
      baseUnitPriceInclusive,
      preClientDiscountUnitPriceInclusive,
      checkoutUnitPriceInclusive,
      checkoutUnitPriceExclGst,
      slabDiscountPerUnitExclGst: Math.max(0, baseUnitPriceExclGst - preClientDiscountUnitPriceExclGst),
      clientDiscountPerUnitExclGst: Math.max(0, preClientDiscountUnitPriceExclGst - checkoutUnitPriceExclGst),
      combinedDiscountPct: baseUnitPriceExclGst > 0
        ? Math.max(0, (baseUnitPriceExclGst - checkoutUnitPriceExclGst) / baseUnitPriceExclGst * 100)
        : 0,
      combinedDiscountPerUnitExclGst: Math.max(0, baseUnitPriceExclGst - checkoutUnitPriceExclGst),
    };
  });

  const beforeSlabDiscount = computeCartGST(
    items.map((item, index) => ({
      inclusiveAmount: lines[index].baseUnitPriceInclusive * item.quantity,
      category: item.category,
      taxRate: lines[index].taxRate,
    })),
  );
  const effectiveGst = computeCartGST(
    items.map((item, index) => ({
      inclusiveAmount: lines[index].checkoutUnitPriceInclusive * item.quantity,
      category: item.category,
      taxRate: lines[index].taxRate,
    })),
  );
  const beforeClientDiscount = computeCartGST(
    items.map((item, index) => ({
      inclusiveAmount: lines[index].preClientDiscountUnitPriceInclusive * item.quantity,
      category: item.category,
      taxRate: lines[index].taxRate,
    })),
  );

  const primaryClientId = items.find((item) => item.clientId)?.clientId || "";
  const clientPricing = primaryClientId
    ? getClientCartPricingSettings(primaryClientId)
    : { discountPct: 0, shippingDeliveryFee: 0, platformFee: 0 };
  const platformFee = clientPricing.platformFee;
  const shippingDeliveryFee = clientPricing.shippingDeliveryFee;
  const totalDiscountAmount = Math.max(
    0,
    beforeSlabDiscount.preTaxSubtotal - effectiveGst.preTaxSubtotal,
  );

  return {
    lines,
    slabs: effectiveGst.slabs,
    totalGst: effectiveGst.totalGst,
    preSlabDiscountSubtotal: beforeSlabDiscount.preTaxSubtotal,
    slabDiscountAmount: Math.max(0, beforeSlabDiscount.preTaxSubtotal - beforeClientDiscount.preTaxSubtotal),
    totalDiscountAmount,
    totalDiscountPct: beforeSlabDiscount.preTaxSubtotal > 0
      ? totalDiscountAmount / beforeSlabDiscount.preTaxSubtotal * 100
      : 0,
    preTaxSubtotal: effectiveGst.preTaxSubtotal,
    preClientDiscountSubtotal: beforeClientDiscount.preTaxSubtotal,
    clientDiscountAmount: Math.max(0, beforeClientDiscount.preTaxSubtotal - effectiveGst.preTaxSubtotal),
    shippingDeliveryFee,
    platformFee,
    grandTotal: effectiveGst.preTaxSubtotal + effectiveGst.totalGst + shippingDeliveryFee + platformFee,
  };
}
