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
  /** Physical stock at vendor (currentStock). Only reduced when a PO is raised. */
  stock: string;
  /** Units reserved by client orders not yet converted to a PO. */
  reservedStock: string;
  /** Incoming / on-order stock (informational). */
  incomingStock: string;
  /** ISO timestamp of the last stock update. */
  lastStockUpdate: string;
  vendorProductCode: string;
  addedAt: string;
  status: 'Active' | 'Inactive';
}

/**
 * Available stock = currentStock − reservedStock.
 * This is what the client shop should display.
 */
export function getAvailableStock(product: VendorProduct): number {
  const current = parseInt(product.stock || '0') || 0;
  const reserved = parseInt(product.reservedStock || '0') || 0;
  return Math.max(0, current - reserved);
}

type Store = Record<string, VendorProduct[]>;

function readStore(): Store {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
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

export function updateVendorProduct(vendorId: string, productId: string, updates: Partial<VendorProduct>): void {
  const products = getVendorProducts(vendorId).map(p =>
    p.id === productId ? { ...p, ...updates } : p
  );
  saveVendorProducts(vendorId, products);
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
