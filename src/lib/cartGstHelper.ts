// Cart GST Helper — computes per-category tax breakdowns using the Tax Engine.
// Always reads rates from Tax Settings so any change there flows through
// immediately to the Cart, Checkout, and Order Confirmation pages.

import { getEffectiveTaxPctForCategory } from './taxEngine';

export interface GstSlab {
  rate: number;     // e.g. 18
  taxable: number;  // sum of item amounts taxed at this rate
  gst: number;      // tax amount for this slab (Math.round)
}

export interface CartGstResult {
  slabs: GstSlab[];   // one entry per distinct rate, sorted ascending
  totalGst: number;   // sum of all slab gst values
  isMixed: boolean;   // true when 2+ distinct rates exist
}

/**
 * Compute GST breakdown for a list of cart items.
 * Each item supplies the already-discounted taxable amount and its product category.
 */
export function computeCartGST(
  items: { taxableAmount: number; category?: string }[],
): CartGstResult {
  const rateMap = new Map<number, number>(); // rate% → taxable total

  for (const item of items) {
    const rate = getEffectiveTaxPctForCategory(item.category || '');
    rateMap.set(rate, (rateMap.get(rate) ?? 0) + item.taxableAmount);
  }

  const slabs: GstSlab[] = [...rateMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([rate, taxable]) => ({
      rate,
      taxable,
      gst: Math.round(taxable * rate / 100),
    }));

  const totalGst = slabs.reduce((s, sl) => s + sl.gst, 0);

  return { slabs, totalGst, isMixed: slabs.length > 1 };
}
