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
  stock: string;
  vendorProductCode: string;
  addedAt: string;
  status: 'Active' | 'Inactive';
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
