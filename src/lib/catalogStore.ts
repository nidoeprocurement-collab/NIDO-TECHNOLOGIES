export interface CatalogSpec {
  id: string;
  specification: string;
  value: string;
  unit: string;
}

export interface GeneralSpec {
  id: string;
  category: string;
  attributeValue: string;
}

export interface CatalogProduct {
  id: string;
  masterProductCode: string;
  skuCode: string;
  productName: string;
  productType: string;
  physicalType: string;
  category: string;
  subcategory: string;
  brand: string;
  tags: string[];
  description: string;
  specifications: CatalogSpec[];
  generalSpecs: GeneralSpec[];
  productNotes: string;
  videoUrl: string;
  images: string[];
  publishStatus: 'draft' | 'published';
  price: number;
  moq: number;
  leadTime: string;
  warranty: string;
}

const STORE_KEY = 'nido_catalog_products';
const COUNTER_KEY = 'nido_mpc_counter';

export function getCatalogProducts(): CatalogProduct[] {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveCatalogProduct(product: CatalogProduct): void {
  const products = getCatalogProducts();
  const idx = products.findIndex(p => p.id === product.id);
  if (idx >= 0) {
    products[idx] = product;
  } else {
    products.push(product);
  }
  localStorage.setItem(STORE_KEY, JSON.stringify(products));
  window.dispatchEvent(new Event('catalogUpdated'));
}

export function deleteCatalogProduct(id: string): void {
  const products = getCatalogProducts().filter(p => p.id !== id);
  localStorage.setItem(STORE_KEY, JSON.stringify(products));
  window.dispatchEvent(new Event('catalogUpdated'));
}

export function generateMasterProductCode(): string {
  const year = new Date().getFullYear();
  const counter = parseInt(localStorage.getItem(COUNTER_KEY) || '0', 10) + 1;
  localStorage.setItem(COUNTER_KEY, String(counter));
  return `MPC-${year}-${String(counter).padStart(6, '0')}`;
}
