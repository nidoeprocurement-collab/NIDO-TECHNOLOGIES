import { recordStockEvent } from './stockHistoryStore';
import { getVendorById } from './vendorDataStore';

const STORE_KEY = 'nido_vendor_products';

export interface VendorProduct {
  id: string;                // catalog product id
  vendorId: string;
  masterProductCode: string;
  skuCode: string;
  productName: string;
  category: string;
  brand: string;
  images: string[];
  price: string;
  moq: string;
  leadTime: string;
  /** Physical inventory with vendor. Keep in sync with physicalStock. */
  stock: string;
  /** Actual physical inventory with vendor (source of truth). */
  physicalStock: string;
  /** Qty reserved by pending client orders (never manually edited). */
  reservedStock: string;
  vendorProductCode: string;
  addedAt: string;
  status: 'Active' | 'Inactive';
}

type Store = Record<string, VendorProduct[]>;

// ─── Current-user helper (for history) ───────────────────────────────────────
function getCurrentUser(): string {
  try {
    const u = JSON.parse(localStorage.getItem('nido_user') || '{}');
    return u.email || u.name || 'System';
  } catch { return 'System'; }
}

/** Ensure every product has physicalStock / reservedStock populated. */
function migrateProduct(p: VendorProduct): VendorProduct {
  if (p.physicalStock !== undefined && p.reservedStock !== undefined) return p;
  return {
    ...p,
    physicalStock: p.physicalStock ?? p.stock ?? '0',
    reservedStock: p.reservedStock ?? '0',
  };
}

function readStore(): Store {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
    const migrated: Store = {};
    for (const [vendorId, products] of Object.entries(raw)) {
      migrated[vendorId] = (products as VendorProduct[]).map(migrateProduct);
    }
    return migrated;
  } catch {
    return {};
  }
}

function writeStore(store: Store): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
  window.dispatchEvent(new Event('vendorProductsUpdated'));
}

export function getVendorProducts(vendorId: string): VendorProduct[] {
  return readStore()[vendorId] || [];
}

export function saveVendorProducts(vendorId: string, products: VendorProduct[]): void {
  const store = readStore();
  store[vendorId] = products;
  writeStore(store);
}

export function addVendorProducts(vendorId: string, newProducts: VendorProduct[]): void {
  const existing = getVendorProducts(vendorId);
  const existingIds = new Set(existing.map(p => p.id));
  const toAdd = newProducts.filter(p => !existingIds.has(p.id));
  saveVendorProducts(vendorId, [...existing, ...toAdd]);
}

/**
 * Update one or more fields on a vendor product.
 * @param _skipHistory  Pass true from named stock-mutation functions so they
 *                      can record a richer history entry themselves without
 *                      triggering a duplicate 'Vendor Stock Updated' entry.
 */
export function updateVendorProduct(
  vendorId: string,
  productId: string,
  updates: Partial<VendorProduct>,
  _skipHistory = false,
): void {
  const products = getVendorProducts(vendorId);
  const oldProduct = products.find(p => p.id === productId);

  const newProducts = products.map(p => {
    if (p.id !== productId) return p;
    const merged = { ...p, ...updates };
    // Admin manually edited stock only → sync to physicalStock so both stay in step.
    if (updates.stock !== undefined && updates.physicalStock === undefined) {
      merged.physicalStock = updates.stock;
    }
    // physicalStock explicitly provided → keep legacy stock field in sync.
    if (updates.physicalStock !== undefined) {
      merged.stock = updates.physicalStock;
    }
    return merged;
  });

  saveVendorProducts(vendorId, newProducts);

  // Record history for admin manual stock edits coming from Vendor Products page
  if (!_skipHistory && oldProduct && (updates.stock !== undefined || updates.physicalStock !== undefined)) {
    const newPhysical = parseInt(updates.physicalStock ?? updates.stock ?? oldProduct.physicalStock ?? '0') || 0;
    const oldPhysical = parseInt(oldProduct.physicalStock ?? oldProduct.stock ?? '0') || 0;
    if (newPhysical !== oldPhysical) {
      recordStockEvent({
        masterProductCode: oldProduct.masterProductCode,
        productName: oldProduct.productName,
        vendorId,
        vendorName: getVendorById(vendorId)?.name || vendorId,
        action: 'Vendor Stock Updated',
        field: 'physicalStock',
        qtyBefore: oldPhysical,
        qtyChanged: newPhysical - oldPhysical,
        qtyAfter: newPhysical,
        reference: 'Admin Edit',
        user: getCurrentUser(),
      });
    }
  }
}

// ─── Available stock helper ───────────────────────────────────────────────────

/** Available stock = physicalStock − reservedStock (never negative). */
export function getAvailableStock(product: VendorProduct): number {
  const physical = parseInt(product.physicalStock ?? product.stock ?? '0') || 0;
  const reserved = parseInt(product.reservedStock ?? '0') || 0;
  return Math.max(0, physical - reserved);
}

// ─── Enterprise stock reservation functions ──────────────────────────────────

/**
 * Reserve `qty` units for `masterProductCode` from `vendorId`.
 * Called when a client places an order (checkout).
 * Only increases reservedStock — physicalStock is unchanged.
 */
export function reserveVendorStock(
  vendorId: string,
  masterProductCode: string,
  qty: number,
  reference = 'Order',
): void {
  if (qty <= 0) return;
  const products = getVendorProducts(vendorId);
  const product = products.find(
    p => p.masterProductCode === masterProductCode && p.status === 'Active',
  );
  if (!product) return;
  const current = parseInt(product.reservedStock ?? '0') || 0;
  updateVendorProduct(vendorId, product.id, { reservedStock: String(current + qty) }, true);
  recordStockEvent({
    masterProductCode,
    productName: product.productName,
    vendorId,
    vendorName: getVendorById(vendorId)?.name || vendorId,
    action: 'Order Reserved',
    field: 'reservedStock',
    qtyBefore: current,
    qtyChanged: qty,
    qtyAfter: current + qty,
    reference,
    user: getCurrentUser(),
  });
}

/**
 * Release `qty` units of reserved stock for `masterProductCode` from `vendorId`.
 * Called when an order is cancelled before a PO is raised.
 * Only decreases reservedStock — physicalStock is unchanged.
 */
export function releaseVendorReservation(
  vendorId: string,
  masterProductCode: string,
  qty: number,
  reference = 'Order Cancelled',
): void {
  if (qty <= 0) return;
  const products = getVendorProducts(vendorId);
  const product = products.find(p => p.masterProductCode === masterProductCode);
  if (!product) return;
  const current = parseInt(product.reservedStock ?? '0') || 0;
  const newReserved = Math.max(0, current - qty);
  updateVendorProduct(vendorId, product.id, { reservedStock: String(newReserved) }, true);
  recordStockEvent({
    masterProductCode,
    productName: product.productName,
    vendorId,
    vendorName: getVendorById(vendorId)?.name || vendorId,
    action: 'Reservation Released',
    field: 'reservedStock',
    qtyBefore: current,
    qtyChanged: -(current - newReserved),
    qtyAfter: newReserved,
    reference,
    user: getCurrentUser(),
  });
}

/**
 * Deduct `qty` units from physicalStock AND reservedStock when a PO is raised.
 * This is the ONLY point where physical inventory actually decreases.
 * Available stock (physical − reserved) does not change because both drop equally.
 */
export function deductPhysicalStock(
  vendorId: string,
  masterProductCode: string,
  qty: number,
  reference = 'PO Raised',
): void {
  if (qty <= 0) return;
  const products = getVendorProducts(vendorId);
  const product = products.find(
    p => p.masterProductCode === masterProductCode && p.status === 'Active',
  );
  if (!product) return;
  const physical = parseInt(product.physicalStock ?? product.stock ?? '0') || 0;
  const reserved = parseInt(product.reservedStock ?? '0') || 0;
  const newPhysical = Math.max(0, physical - qty);
  const newReserved = Math.max(0, reserved - qty);
  updateVendorProduct(vendorId, product.id, {
    physicalStock: String(newPhysical),
    stock: String(newPhysical),
    reservedStock: String(newReserved),
  }, true);
  recordStockEvent({
    masterProductCode,
    productName: product.productName,
    vendorId,
    vendorName: getVendorById(vendorId)?.name || vendorId,
    action: 'PO Raised',
    field: 'both',
    qtyBefore: physical,
    qtyChanged: -(physical - newPhysical),
    qtyAfter: newPhysical,
    reference,
    user: getCurrentUser(),
  });
}

/**
 * Restore `qty` units to physicalStock when a PO is cancelled.
 * reservedStock is NOT changed — the reservation was already cleared at PO creation.
 */
export function restorePhysicalStock(
  vendorId: string,
  masterProductCode: string,
  qty: number,
  reference = 'PO Cancelled',
): void {
  if (qty <= 0) return;
  const products = getVendorProducts(vendorId);
  const product = products.find(p => p.masterProductCode === masterProductCode);
  if (!product) return;
  const physical = parseInt(product.physicalStock ?? product.stock ?? '0') || 0;
  const newPhysical = physical + qty;
  updateVendorProduct(vendorId, product.id, {
    physicalStock: String(newPhysical),
    stock: String(newPhysical),
  }, true);
  recordStockEvent({
    masterProductCode,
    productName: product.productName,
    vendorId,
    vendorName: getVendorById(vendorId)?.name || vendorId,
    action: 'PO Cancelled',
    field: 'physicalStock',
    qtyBefore: physical,
    qtyChanged: qty,
    qtyAfter: newPhysical,
    reference,
    user: getCurrentUser(),
  });
}

/**
 * Manual stock adjustment from the Stock Management module.
 * Stock In / Stock Out affect physicalStock only (reservedStock is untouched).
 * Stock Correction sets physicalStock to an exact value.
 */
export function manualStockAdjustment(
  vendorId: string,
  masterProductCode: string,
  adjustType: 'Stock In' | 'Stock Out' | 'Stock Correction',
  qty: number,
  reference: string,
): void {
  if (qty < 0) return;
  const products = getVendorProducts(vendorId);
  const product = products.find(p => p.masterProductCode === masterProductCode);
  if (!product) return;
  const physical = parseInt(product.physicalStock ?? product.stock ?? '0') || 0;

  let newPhysical: number;
  if (adjustType === 'Stock In') {
    newPhysical = physical + qty;
  } else if (adjustType === 'Stock Out') {
    newPhysical = Math.max(0, physical - qty);
  } else {
    // Stock Correction — set to exact value
    newPhysical = qty;
  }

  updateVendorProduct(vendorId, product.id, {
    physicalStock: String(newPhysical),
    stock: String(newPhysical),
  }, true);

  const changed = newPhysical - physical;
  recordStockEvent({
    masterProductCode,
    productName: product.productName,
    vendorId,
    vendorName: getVendorById(vendorId)?.name || vendorId,
    action: adjustType,
    field: 'physicalStock',
    qtyBefore: physical,
    qtyChanged: changed,
    qtyAfter: newPhysical,
    reference,
    user: getCurrentUser(),
  });
}

export function removeVendorProduct(vendorId: string, productId: string): void {
  const products = getVendorProducts(vendorId).filter(p => p.id !== productId);
  saveVendorProducts(vendorId, products);
}

export function getAllVendorProducts(): Record<string, VendorProduct[]> {
  return readStore();
}

// ─── Global VPC sequence counter ─────────────────────────────────────────────
// A dedicated localStorage key stores the highest VPC number ever issued.
// This is a monotonic counter: it only ever increases, even when products are
// deleted or VPC values are manually edited, so codes are never reused.
//
// On first use the counter is bootstrapped by scanning all existing products
// so that any products added before this code was deployed are accounted for.

import { getPrefix } from './configService';

const VPC_COUNTER_KEY = 'nido_vpc_counter';
// Historical bootstrap regex — always matches the original VPC- default so
// existing product codes are counted regardless of the current prefix setting.
const VPC_RE = /^VPC-(\d+)$/i;

function readVpcCounter(): number {
  try {
    const raw = localStorage.getItem(VPC_COUNTER_KEY);
    if (raw !== null) return Math.max(0, parseInt(raw, 10) || 0);
  } catch { /* ignore */ }
  // First run: bootstrap from existing products
  const store = readStore();
  let max = 0;
  for (const products of Object.values(store)) {
    for (const p of products) {
      const m = VPC_RE.exec(p.vendorProductCode?.trim() ?? '');
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > max) max = n;
      }
    }
  }
  return max;
}

function writeVpcCounter(value: number): void {
  try { localStorage.setItem(VPC_COUNTER_KEY, String(value)); } catch { /* ignore */ }
}

/**
 * Peek at the current counter value without incrementing it.
 * Use this to compute preview VPC codes for display only —
 * the counter is not advanced, so cancelling wastes nothing.
 */
export function peekVpcCounter(): number {
  return readVpcCounter();
}

/**
 * Reserve `count` sequential VPC codes atomically.
 * The counter is incremented before returning so the same codes
 * are never issued twice, even across separate sessions.
 *
 * Returns an array of strings: ['VPC-00001', 'VPC-00002', …]
 */
export function reserveVendorProductCodes(count: number): string[] {
  if (count <= 0) return [];
  const prefix = getPrefix('vendorProductCode') || 'VPC-';
  const current = readVpcCounter();
  const codes = Array.from({ length: count }, (_, i) =>
    `${prefix}${String(current + 1 + i).padStart(5, '0')}`
  );
  writeVpcCounter(current + count);
  return codes;
}

/** Convenience wrapper for a single VPC code. */
export function reserveVendorProductCode(): string {
  return reserveVendorProductCodes(1)[0];
}

/** VPC format regex — exported so the UI can validate user-edited codes. */
export const VPC_FORMAT_RE = VPC_RE;
