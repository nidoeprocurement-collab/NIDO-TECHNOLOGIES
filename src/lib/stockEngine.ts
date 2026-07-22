// Stock Engine — computes vendor allocation records for cart items.
//
// Stock is NO LONGER deducted when items enter the cart.  Vendor stock is only
// modified when a Purchase Order is raised (deducted) or cancelled (restored).
// This means the stock shown on the Shop page and in Vendor Selection always
// reflects the vendor's true available quantity, reduced only by confirmed POs.
//
// reserveStock / releaseStock / releasePartial are kept for API compatibility
// (they still compute allocation records the order-details flow depends on)
// but they no longer mutate the vendorStore stock field.

import { getAllVendorProducts, getAvailableStock } from './vendorStore';
import { computeVendorComparisons } from './priceEngineStore';

export interface StockAllocation {
  vendorId: string;
  /** VendorProduct.id — the row-level key needed by updateVendorProduct */
  vendorProductId: string;
  vendorName: string;
  allocated: number;
}

// ─── Reserve ─────────────────────────────────────────────────────────────────

/**
 * Reserve `qty` units for `masterProductCode` by deducting from vendor stocks
 * cheapest-first.  Returns the allocation list to store on the CartItem so the
 * exact same units can be released later.
 *
 * If total available stock < qty (partial fill), reserves only what's available
 * and returns the partial allocation.
 */
export function reserveStock(
  masterProductCode: string,
  qty: number,
  productCategory?: string,
): StockAllocation[] {
  if (qty <= 0) return [];

  // Read live vendor products to compute which vendors cover this qty.
  // NOTE: we intentionally do NOT deduct from vendor stock here.
  // Stock is only deducted when a PO is raised (see OrderDetailsPage handleRaisePOs).
  const storeMap = getAllVendorProducts();

  // Vendor comparisons sorted cheapest-first — defines fill order.
  const comparisons = computeVendorComparisons(masterProductCode, productCategory);

  const allocations: StockAllocation[] = [];
  let remaining = qty;

  for (const comp of comparisons) {
    if (remaining <= 0) break;

    const vendorProducts = storeMap[comp.vendorId] || [];
    const match = vendorProducts.find(
      p => p.masterProductCode === masterProductCode && p.status === 'Active',
    );
    if (!match) continue;

    const available = getAvailableStock(match);
    if (available <= 0) continue;

    const take = Math.min(remaining, available);
    // Stock field is NOT modified here — deduction happens at PO creation.

    allocations.push({
      vendorId: comp.vendorId,
      vendorProductId: match.id,
      vendorName: comp.vendorName,
      allocated: take,
    });
    remaining -= take;
  }

  return allocations;
}

// ─── Release (full) ──────────────────────────────────────────────────────────

/**
 * No-op: stock is no longer reserved at cart time, so there is nothing to
 * release.  Kept for API compatibility with CartContext / MyOrdersContext.
 */
export function releaseStock(_allocations: StockAllocation[]): void {
  // Intentional no-op — vendor stock is only modified at PO raise / cancel.
}

// ─── Release (partial) ───────────────────────────────────────────────────────

/**
 * Release `qtyToRelease` units back to vendors from an existing allocation,
 * starting from the most-expensive vendor (end of the list).
 *
 * Returns the updated allocation (with reduced allocated values).
 */
export function releasePartial(
  allocations: StockAllocation[],
  qtyToRelease: number,
): StockAllocation[] {
  if (qtyToRelease <= 0 || !allocations?.length) return allocations;

  // Work on a copy; adjust allocated counts from most-expensive (last) vendor first.
  // NOTE: vendor stock field is NOT modified — only the allocation records are updated.
  const updated = allocations.map(a => ({ ...a }));
  let remaining = qtyToRelease;

  for (let i = updated.length - 1; i >= 0 && remaining > 0; i--) {
    const alloc = updated[i];
    const toReturn = Math.min(remaining, alloc.allocated);
    if (toReturn <= 0) continue;
    alloc.allocated -= toReturn;
    remaining -= toReturn;
  }

  return updated.filter(a => a.allocated > 0);
}

// ─── Reserve extra (qty increase) ────────────────────────────────────────────

/**
 * Add `extraQty` more units to an existing allocation.
 * Returns the merged allocation (existing + new units).
 */
export function reserveExtra(
  masterProductCode: string,
  extraQty: number,
  existingAllocations: StockAllocation[],
  productCategory?: string,
): StockAllocation[] {
  if (extraQty <= 0) return existingAllocations;

  const newAllocs = reserveStock(masterProductCode, extraQty, productCategory);

  // Merge: if the same vendorProductId appears in both, sum the allocated counts.
  const merged = [...existingAllocations.map(a => ({ ...a }))];
  for (const na of newAllocs) {
    const existing = merged.find(a => a.vendorProductId === na.vendorProductId);
    if (existing) {
      existing.allocated += na.allocated;
    } else {
      merged.push(na);
    }
  }
  return merged;
}
