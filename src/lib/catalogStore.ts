import { getPrefix } from './configService';
import { isDigitalOnlyType } from './productTypeRules';
import { addCatalogAuditLog } from './catalogAuditStore';

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

export interface CatalogVariationOption {
  id: string;
  label: string;
  priceAdjustment: number;
}

export interface CatalogVariation {
  id: string;
  name: string;
  options: CatalogVariationOption[];
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
  /** Cloud/service variation fields configured by an administrator. */
  variations?: CatalogVariation[];
  productNotes: string;
  videoUrl: string;
  images: string[];
  publishStatus: 'draft' | 'published' | 'pending' | 'archived';
  price: number;
  moq: number;
  leadTime: string;
  warranty: string;
}

/** Product names are unique in the master catalog, regardless of case or extra spacing. */
export function normalizeCatalogProductName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

export function findCatalogProductByName(productName: string, excludeId?: string): CatalogProduct | undefined {
  const normalizedName = normalizeCatalogProductName(productName);
  if (!normalizedName) return undefined;
  return getCatalogProducts().find(product =>
    (excludeId === undefined || String(product.id) !== String(excludeId)) &&
    normalizeCatalogProductName(product.productName) === normalizedName
  );
}

const STORE_KEY = 'nido_catalog_products';
const COUNTER_KEY = 'nido_mpc_counter';
const SEED_KEY = 'nido_catalog_seeded';

// Remove any previously seeded mock products so the catalog starts clean.
function clearSeedData(): void {
  try {
    if (localStorage.getItem(SEED_KEY)) {
      const existing: CatalogProduct[] = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
      const cleaned = existing.filter((p) => !p.id.startsWith('seed-'));
      localStorage.setItem(STORE_KEY, JSON.stringify(cleaned));
      localStorage.removeItem(SEED_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

clearSeedData();

export function getCatalogProducts(): CatalogProduct[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((product): product is Record<string, any> => Boolean(product && typeof product === 'object'))
      .map((product, index) => ({
        ...product,
        id: String(product.id ?? `cat-${index}`),
        masterProductCode: typeof product.masterProductCode === 'string' ? product.masterProductCode : '',
        skuCode: typeof product.skuCode === 'string' ? product.skuCode : (typeof product.sku === 'string' ? product.sku : ''),
        productName:
          typeof product.productName === 'string' && product.productName.trim()
            ? product.productName
            : typeof product.name === 'string' && product.name.trim()
              ? product.name
              : 'Untitled Product',
        productType: typeof product.productType === 'string' ? product.productType : 'Product',
        physicalType: typeof product.physicalType === 'string' && product.physicalType.trim() ? product.physicalType.trim() : 'Physical Product',
        category: typeof product.category === 'string' ? product.category : '',
        subcategory:
          typeof product.subcategory === 'string'
            ? product.subcategory
            : typeof product.subCategory === 'string'
              ? product.subCategory
              : '',
        brand: typeof product.brand === 'string' ? product.brand : '',
        tags: Array.isArray(product.tags) ? product.tags.filter((t): t is string => typeof t === 'string') : [],
        description: typeof product.description === 'string' ? product.description : '',
        specifications: Array.isArray(product.specifications) ? product.specifications : [],
        generalSpecs: Array.isArray(product.generalSpecs) ? product.generalSpecs : [],
        variations: Array.isArray(product.variations) ? product.variations : [],
        productNotes: typeof product.productNotes === 'string' ? product.productNotes : '',
        videoUrl: typeof product.videoUrl === 'string' ? product.videoUrl : '',
        images: Array.isArray(product.images) ? product.images.filter((img): img is string => typeof img === 'string') : [],
        publishStatus:
          product.publishStatus === 'published' ||
            product.publishStatus === 'pending' ||
            product.publishStatus === 'archived' ||
            product.publishStatus === 'draft'
            ? product.publishStatus
            : 'draft',
        price: Number(product.price) || 0,
        moq: Number(product.moq) || 0,
        leadTime: typeof product.leadTime === 'string' ? product.leadTime : '',
        warranty: typeof product.warranty === 'string' ? product.warranty : '',
      }));
  } catch {
    return [];
  }
}

/** Returns sorted unique category names from the master catalog. */
export function getMasterCatalogCategories(): string[] {
  const products = getCatalogProducts();
  const seen = new Set<string>();
  for (const p of products) {
    if (p.category && p.category.trim()) seen.add(p.category.trim());
  }
  return Array.from(seen).sort();
}

export function saveCatalogProduct(
  product: CatalogProduct,
  options: {
    skipDuplicateCheck?: boolean;
    auditUser?: string;
    auditEvent?: string;
    auditDetail?: string;
    skipAudit?: boolean;
  } = {},
): boolean {
  const products = getCatalogProducts();
  const idx = products.findIndex(p => String(p.id) === String(product.id));
  const existing = idx >= 0 ? products[idx] : undefined;

  if (!options.skipDuplicateCheck) {
    const duplicate = products.find(p =>
      String(p.id) !== String(product.id) &&
      normalizeCatalogProductName(p.productName) === normalizeCatalogProductName(product.productName)
    );
    if (duplicate) return false;
  }

  if (idx >= 0) {
    products[idx] = product;
  } else if (!options.skipDuplicateCheck) {
    products.push(product);
  } else {
    return false;
  }
  localStorage.setItem(STORE_KEY, JSON.stringify(products));
  window.dispatchEvent(new Event('catalogUpdated'));

  // ── Record live audit log ──────────────────────────────────────────────────
  if (!options.skipAudit) {
    try {
      if (!existing) {
        addCatalogAuditLog({
          event: options.auditEvent || (product.publishStatus === 'published' ? 'New Item Added' : 'Draft Created'),
          detail: options.auditDetail || `${product.productName} (${product.skuCode || product.masterProductCode || 'N/A'})`,
          itemId: product.id,
          itemName: product.productName,
          sku: product.skuCode || product.masterProductCode,
          user: options.auditUser,
          status: product.publishStatus === 'published' ? 'Approved' : 'Draft',
          newValue: `₹${Number(product.price || 0).toLocaleString('en-IN')}`,
        });
      } else {
        const statusChanged = existing.publishStatus !== product.publishStatus;
        const priceChanged = Number(existing.price || 0) !== Number(product.price || 0);

        if (statusChanged && product.publishStatus === 'published') {
          addCatalogAuditLog({
            event: options.auditEvent || 'Item Approved',
            detail: options.auditDetail || `Approved & Published: ${product.productName}`,
            itemId: product.id,
            itemName: product.productName,
            sku: product.skuCode || product.masterProductCode,
            user: options.auditUser,
            status: 'Approved',
            previousValue: existing.publishStatus,
            newValue: 'published',
          });
        } else if (statusChanged && product.publishStatus === 'archived') {
          addCatalogAuditLog({
            event: options.auditEvent || 'Item Archived',
            detail: options.auditDetail || `Archived product: ${product.productName}`,
            itemId: product.id,
            itemName: product.productName,
            sku: product.skuCode || product.masterProductCode,
            user: options.auditUser,
            status: 'Archived',
            previousValue: existing.publishStatus,
            newValue: 'archived',
          });
        } else if (statusChanged && product.publishStatus === 'draft' && existing.publishStatus === 'pending') {
          addCatalogAuditLog({
            event: options.auditEvent || 'Item Rejected',
            detail: options.auditDetail || `Rejected approval for ${product.productName} (returned to Draft)`,
            itemId: product.id,
            itemName: product.productName,
            sku: product.skuCode || product.masterProductCode,
            user: options.auditUser,
            status: 'Rejected',
            previousValue: 'pending',
            newValue: 'draft',
          });
        } else if (priceChanged) {
          addCatalogAuditLog({
            event: options.auditEvent || 'Price Changed',
            detail: options.auditDetail || `${product.productName}: ₹${Number(existing.price || 0).toLocaleString('en-IN')} → ₹${Number(product.price || 0).toLocaleString('en-IN')}`,
            itemId: product.id,
            itemName: product.productName,
            sku: product.skuCode || product.masterProductCode,
            user: options.auditUser,
            status: 'Updated',
            previousValue: `₹${Number(existing.price || 0).toLocaleString('en-IN')}`,
            newValue: `₹${Number(product.price || 0).toLocaleString('en-IN')}`,
          });
        } else if (statusChanged) {
          addCatalogAuditLog({
            event: options.auditEvent || 'Status Changed',
            detail: options.auditDetail || `${product.productName} status updated from ${existing.publishStatus} to ${product.publishStatus}`,
            itemId: product.id,
            itemName: product.productName,
            sku: product.skuCode || product.masterProductCode,
            user: options.auditUser,
            status: product.publishStatus === 'pending' ? 'Pending' : (product.publishStatus === 'draft' ? 'Draft' : 'Updated'),
            previousValue: existing.publishStatus,
            newValue: product.publishStatus,
          });
        } else {
          addCatalogAuditLog({
            event: options.auditEvent || 'Item Details Updated',
            detail: options.auditDetail || `Updated details for ${product.productName}`,
            itemId: product.id,
            itemName: product.productName,
            sku: product.skuCode || product.masterProductCode,
            user: options.auditUser,
            status: 'Updated',
          });
        }
      }
    } catch {
      // never block the save
    }
  }

  // ── Propagate master catalog changes downstream ──────────────────────────
  // We use raw localStorage reads here (no imports from other stores) to avoid
  // circular-dependency issues. Only master-catalog snapshot fields are overwritten;
  // digital vendor base price is fixed at 0, while other vendor-specific fields
  // (moq, leadTime, stock, roles, preference, etc.) remain untouched.

  // 1. Vendor products — matched by id (= catalog product id)
  try {
    const VENDOR_KEY = 'nido_vendor_products';
    const vendorStore: Record<string, Record<string, unknown>[]> =
      JSON.parse(localStorage.getItem(VENDOR_KEY) || '{}');
    let vendorChanged = false;
    for (const vendorId of Object.keys(vendorStore)) {
      vendorStore[vendorId] = vendorStore[vendorId].map((p) => {
        if (p.id !== product.id) return p;
        vendorChanged = true;
        return {
          ...p,
          masterProductCode: product.masterProductCode,
          skuCode: product.skuCode,
          productName: product.productName,
          category: product.category,
          brand: product.brand,
          physicalType: product.physicalType,
          images: product.images,
          price: isDigitalOnlyType(product.physicalType || '') ? '0' : p.price,
        };
      });
    }
    if (vendorChanged) {
      localStorage.setItem(VENDOR_KEY, JSON.stringify(vendorStore));
      window.dispatchEvent(new Event('vendorProductsUpdated'));
    }
  } catch { /* never block the save */ }

  // 2. Client catalogs — matched by productCode (= masterProductCode)
  try {
    const CLIENT_KEY = 'nido_client_catalogs';
    const clientStore: Record<string, Record<string, unknown>[]> =
      JSON.parse(localStorage.getItem(CLIENT_KEY) || '{}');

    // Pre-format specs so we don't repeat the work per client
    const specs: string[] = (product.specifications ?? []).map(
      (s) => `${s.specification}: ${s.value}${s.unit ? ' ' + s.unit : ''}`.trim()
    );
    const generalSpecs: { label: string; value: string }[] = (product.generalSpecs ?? []).map(
      (s) => ({ label: s.category, value: s.attributeValue })
    );

    let clientChanged = false;
    for (const clientId of Object.keys(clientStore)) {
      clientStore[clientId] = clientStore[clientId].map((e) => {
        if (e.productCode !== product.masterProductCode) return e;
        clientChanged = true;
        return {
          ...e,
          productCode: product.masterProductCode,
          sku: product.skuCode,
          name: product.productName,
          category: product.category,
          subcategory: product.subcategory,
          brand: product.brand,
          tags: product.tags ?? [],
          productType: product.productType,
          physicalType: product.physicalType,
          img: product.images?.[0] ?? (e.img as string) ?? '',
          images: product.images ?? [],
          description: product.description,
          specs,
          generalSpecs,
          productNotes: product.productNotes,
          videoUrl: product.videoUrl,
          warranty: product.warranty,
          variations: product.variations ?? [],
        };
      });
    }
    if (clientChanged) {
      localStorage.setItem(CLIENT_KEY, JSON.stringify(clientStore));
      window.dispatchEvent(new Event('clientCatalogUpdated'));
    }
  } catch { /* never block the save */ }

  return true;
}

export function deleteCatalogProduct(id: string): void {
  const products = getCatalogProducts();
  const toDelete = products.find(p => String(p.id) === String(id));
  const remaining = products.filter(p => String(p.id) !== String(id));
  localStorage.setItem(STORE_KEY, JSON.stringify(remaining));
  if (toDelete) {
    removeArchivedProductFromDownstream(toDelete.id, toDelete.masterProductCode);
  }
  window.dispatchEvent(new Event('catalogUpdated'));
  if (toDelete) {
    try {
      addCatalogAuditLog({
        event: 'Deleted Item',
        detail: `Permanently deleted: ${toDelete.productName} (${toDelete.skuCode || toDelete.masterProductCode || 'N/A'})`,
        itemId: toDelete.id,
        itemName: toDelete.productName,
        sku: toDelete.skuCode || toDelete.masterProductCode,
        status: 'Deleted',
      });
    } catch {
      // ignore
    }
  }
}

/**
 * Removes a master-catalog product from all downstream stores
 * (vendor product lists + client catalogs) when it is archived.
 * Matched by catalog product id in vendor store, and by masterProductCode in client store.
 */
export function removeArchivedProductFromDownstream(id: string, masterProductCode: string): void {
  // 1. Vendor products — remove entries whose id matches the catalog product id
  try {
    const VENDOR_KEY = 'nido_vendor_products';
    const vendorStore: Record<string, Record<string, unknown>[]> =
      JSON.parse(localStorage.getItem(VENDOR_KEY) || '{}');
    let vendorChanged = false;
    for (const vendorId of Object.keys(vendorStore)) {
      const before = vendorStore[vendorId].length;
      vendorStore[vendorId] = vendorStore[vendorId].filter((p) => p.id !== id);
      if (vendorStore[vendorId].length !== before) vendorChanged = true;
    }
    if (vendorChanged) {
      localStorage.setItem(VENDOR_KEY, JSON.stringify(vendorStore));
      window.dispatchEvent(new Event('vendorProductsUpdated'));
    }
  } catch { /* never block */ }

  // 2. Client catalogs — remove entries whose productCode matches masterProductCode
  try {
    const CLIENT_KEY = 'nido_client_catalogs';
    const clientStore: Record<string, Record<string, unknown>[]> =
      JSON.parse(localStorage.getItem(CLIENT_KEY) || '{}');
    let clientChanged = false;
    for (const clientId of Object.keys(clientStore)) {
      const before = clientStore[clientId].length;
      clientStore[clientId] = clientStore[clientId].filter((e) => e.productCode !== masterProductCode);
      if (clientStore[clientId].length !== before) clientChanged = true;
    }
    if (clientChanged) {
      localStorage.setItem(CLIENT_KEY, JSON.stringify(clientStore));
      window.dispatchEvent(new Event('clientCatalogUpdated'));
    }
  } catch { /* never block */ }

}

export function generateMasterProductCode(): string {
  const prefix = getPrefix('masterProductCode') || 'MPC-';
  const year = new Date().getFullYear();
  const counter = parseInt(localStorage.getItem(COUNTER_KEY) || '0', 10) + 1;
  localStorage.setItem(COUNTER_KEY, String(counter));
  return `${prefix}${year}-${String(counter).padStart(6, '0')}`;
}
