// Stock Engine — reserves and releases vendor stock as items move in and out of the cart.
//
// Strategy: cheapest vendor fills first (same order as the price engine's vendor ranking).
// When releasing a partial reduction, we give stock back to the most-expensive vendor
// first (reverse order) so the cheap vendor's stock is consumed last and released last.
//
// All mutations go through updateVendorProduct → writeStore → fires 'vendorProductsUpdated'
// so every listener (CartPage vendorMatchMap, ShopPage product list) sees fresh numbers
// after each cart action.

import { getAllVendorProducts, updateVendorProduct } from './vendorStore';
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

  // Re-read live vendor products at call time (not cached) so we see the
  // latest stock numbers even if another call just updated them.
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

    const available = parseInt(match.stock) || 0;
    if (available <= 0) continue;

    const take = Math.min(remaining, available);
    updateVendorProduct(comp.vendorId, match.id, { stock: String(available - take) });

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
 * Return all units in `allocations` back to their vendors.
 * Call this when an item is removed from the cart or the cart is cleared.
 */
export function releaseStock(allocations: StockAllocation[]): void {
  if (!allocations?.length) return;

  const storeMap = getAllVendorProducts();

  for (const alloc of allocations) {
    const vendorProducts = storeMap[alloc.vendorId] || [];
    const match = vendorProducts.find(p => p.id === alloc.vendorProductId);
    if (!match) continue;

    const current = parseInt(match.stock) || 0;
    updateVendorProduct(alloc.vendorId, alloc.vendorProductId, {
      stock: String(current + alloc.allocated),
    });
  }
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

  const storeMap = getAllVendorProducts();
  // Work on a copy; release from most-expensive (last) vendor first.
  const updated = allocations.map(a => ({ ...a }));
  let remaining = qtyToRelease;

  for (let i = updated.length - 1; i >= 0 && remaining > 0; i--) {
    const alloc = updated[i];
    const toReturn = Math.min(remaining, alloc.allocated);
    if (toReturn <= 0) continue;

    const vendorProducts = storeMap[alloc.vendorId] || [];
    const match = vendorProducts.find(p => p.id === alloc.vendorProductId);
    if (match) {
      const current = parseInt(match.stock) || 0;
      updateVendorProduct(alloc.vendorId, alloc.vendorProductId, {
        stock: String(current + toReturn),
      });
    }

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
