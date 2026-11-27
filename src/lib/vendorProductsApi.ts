import { supabase } from '@/lib/supabase';
import { isSupabaseUuid } from '@/lib/nidoRolesApi';
import { getCatalogProducts, type CatalogVariation } from '@/lib/catalogStore';
import {
  getAllVendorProducts,
  saveVendorProducts,
  type VendorProduct,
} from '@/lib/vendorStore';
import { isDigitalOnlyType } from '@/lib/productTypeRules';

interface JoinedMasterItem {
  id: string;
  master_product_code: string;
  sku_code: string | null;
  product_name: string;
  category: string | null;
  brand: string | null;
  physical_type: string | null;
  images: string[] | null;
}

interface DbVendorProductRow {
  id: string;
  vendor_id: string;
  master_catalogue_item_id: string;
  vendor_product_code: string;
  vendor_sku: string | null;
  price: number | string | null;
  currency: string | null;
  moq: number | null;
  lead_time: string | null;
  physical_stock: number | null;
  reserved_stock: number | null;
  incoming_stock: number | null;
  handling_charge: number | string | null;
  delivery_charge: number | string | null;
  other_charge: number | string | null;
  tax_percentage: number | string | null;
  terms: string | null;
  variations: CatalogVariation[] | null;
  digital_availability: 'available' | 'not_available' | null;
  status: 'Active' | 'Inactive';
  last_stock_update: string | null;
  added_at: string;
  master_catalogue_items?: JoinedMasterItem | JoinedMasterItem[] | null;
}

const LOCAL_VP_MIGRATED_KEY = 'nido_vendor_products_supabase_migrated_v1';

const SELECT_COLUMNS =
  'id,vendor_id,master_catalogue_item_id,vendor_product_code,vendor_sku,price,currency,moq,lead_time,physical_stock,reserved_stock,incoming_stock,handling_charge,delivery_charge,other_charge,tax_percentage,terms,variations,digital_availability,status,last_stock_update,added_at,master_catalogue_items(id,master_product_code,sku_code,product_name,category,brand,physical_type,images)';

export function mapDbVendorProductRowToVendorProduct(
  row: DbVendorProductRow,
): VendorProduct & {
  assignmentId?: string;
  currency?: string;
  handlingCharge?: number;
  deliveryCharge?: number;
  otherCharge?: number;
  taxPercentage?: number;
  vendorSku?: string;
  terms?: string;
} {
  const joinedRaw = row.master_catalogue_items;
  const master = Array.isArray(joinedRaw) ? joinedRaw[0] : joinedRaw;
  const physicalType = master?.physical_type ?? 'Physical Product';
  const digitalOnly = isDigitalOnlyType(physicalType);
  const physStock = Number(row.physical_stock) || 0;

  return {
    id: String(row.master_catalogue_item_id),
    assignmentId: String(row.id),
    vendorId: String(row.vendor_id),
    masterProductCode: String(master?.master_product_code ?? ''),
    skuCode: String(master?.sku_code ?? ''),
    productName: String(master?.product_name ?? ''),
    category: String(master?.category ?? ''),
    brand: String(master?.brand ?? ''),
    physicalType,
    images: Array.isArray(master?.images) ? master.images : [],
    variations: Array.isArray(row.variations) ? row.variations : [],
    digitalAvailability: row.digital_availability ?? undefined,
    price: digitalOnly ? '0' : String(Number(row.price) || 0),
    currency: row.currency ?? 'INR',
    moq: String(Number(row.moq) || 1),
    leadTime: String(row.lead_time ?? ''),
    stock: String(physStock),
    physicalStock: String(physStock),
    reservedStock: String(Number(row.reserved_stock) || 0),
    incomingStock: String(Number(row.incoming_stock) || 0),
    handlingCharge: Number(row.handling_charge) || 0,
    deliveryCharge: Number(row.delivery_charge) || 0,
    otherCharge: Number(row.other_charge) || 0,
    taxPercentage: row.tax_percentage != null ? Number(row.tax_percentage) : undefined,
    vendorSku: row.vendor_sku ?? '',
    terms: row.terms ?? '',
    lastStockUpdate: row.last_stock_update ?? undefined,
    vendorProductCode: String(row.vendor_product_code ?? ''),
    addedAt: row.added_at ? String(row.added_at).split('T')[0] : new Date().toISOString().split('T')[0],
    status: row.status === 'Inactive' ? 'Inactive' : 'Active',
  };
}

function assertSupabaseFrom() {
  const fromFn = (supabase as unknown as { from?: (table: string) => unknown }).from;
  if (typeof fromFn !== 'function') {
    throw new Error('Supabase database client is unavailable.');
  }
}

export async function loadVendorProductsFromSupabase(
  vendorId?: string,
): Promise<VendorProduct[]> {
  assertSupabaseFrom();
  let query = supabase
    .from('vendor_products')
    .select(SELECT_COLUMNS)
    .order('created_at', { ascending: false });

  if (vendorId && isSupabaseUuid(vendorId)) {
    query = query.eq('vendor_id', vendorId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || 'Unable to load vendor products from Supabase.');
  }

  const mapped = (Array.isArray(data) ? (data as DbVendorProductRow[]) : []).map(
    mapDbVendorProductRowToVendorProduct,
  );

  if (vendorId) {
    saveVendorProducts(vendorId, mapped);
  } else {
    const grouped: Record<string, VendorProduct[]> = {};
    for (const item of mapped) {
      if (!grouped[item.vendorId]) grouped[item.vendorId] = [];
      grouped[item.vendorId].push(item);
    }
    for (const [vId, items] of Object.entries(grouped)) {
      saveVendorProducts(vId, items);
    }
  }

  return mapped;
}

export async function assignVendorProductsInSupabase(
  vendorId: string,
  products: VendorProduct[],
): Promise<VendorProduct[]> {
  if (!isSupabaseUuid(vendorId)) {
    throw new Error('Valid Supabase vendor ID is required.');
  }
  assertSupabaseFrom();

  const rows = products.map((p) => {
    if (!isSupabaseUuid(p.id)) {
      throw new Error(`Invalid Master Catalogue product ID for "${p.productName}".`);
    }
    const digitalOnly = isDigitalOnlyType(p.physicalType || '');
    const ext = p as VendorProduct & {
      currency?: string;
      handlingCharge?: number;
      deliveryCharge?: number;
      otherCharge?: number;
      taxPercentage?: number;
      vendorSku?: string;
      terms?: string;
    };
    const physStock = Math.max(0, Math.trunc(Number(p.physicalStock ?? p.stock) || 0));
    return {
      vendor_id: vendorId,
      master_catalogue_item_id: p.id,
      ...(p.vendorProductCode?.trim() ? { vendor_product_code: p.vendorProductCode.trim() } : {}),
      vendor_sku: String(ext.vendorSku ?? ''),
      price: digitalOnly ? 0 : Math.max(0, Number(p.price) || 0),
      currency: String(ext.currency ?? 'INR') || 'INR',
      moq: Math.max(0, Math.trunc(Number(p.moq) || 1)),
      lead_time: String(p.leadTime ?? ''),
      physical_stock: physStock,
      reserved_stock: Math.max(0, Math.trunc(Number(p.reservedStock) || 0)),
      incoming_stock: Math.max(0, Math.trunc(Number(p.incomingStock) || 0)),
      handling_charge: Math.max(0, Number(ext.handlingCharge) || 0),
      delivery_charge: Math.max(0, Number(ext.deliveryCharge) || 0),
      other_charge: Math.max(0, Number(ext.otherCharge) || 0),
      tax_percentage: ext.taxPercentage != null ? Number(ext.taxPercentage) : null,
      terms: String(ext.terms ?? ''),
      variations: Array.isArray(p.variations) ? p.variations : [],
      digital_availability: p.digitalAvailability ?? null,
      status: p.status === 'Inactive' ? 'Inactive' : 'Active',
      last_stock_update: p.lastStockUpdate ?? new Date().toISOString(),
    };
  });

  const { data, error } = await supabase
    .from('vendor_products')
    .insert(rows)
    .select(SELECT_COLUMNS);

  if (error) {
    if (error.code === '23505') {
      throw new Error('One or more selected Master Catalogue products are already assigned to this vendor.');
    }
    if (error.code === '23503') {
      throw new Error('Referenced vendor or Master Catalogue product does not exist.');
    }
    throw new Error(error.message || 'Unable to assign products to vendor.');
  }

  return (Array.isArray(data) ? (data as DbVendorProductRow[]) : []).map(
    mapDbVendorProductRowToVendorProduct,
  );
}

export async function updateVendorProductInSupabase(
  vendorId: string,
  masterCatalogueItemId: string,
  updates: Partial<VendorProduct> & {
    currency?: string;
    handlingCharge?: number;
    deliveryCharge?: number;
    otherCharge?: number;
    taxPercentage?: number;
    vendorSku?: string;
    terms?: string;
  },
): Promise<VendorProduct> {
  if (!isSupabaseUuid(vendorId) || !isSupabaseUuid(masterCatalogueItemId)) {
    throw new Error('Valid Supabase vendor ID and product ID are required.');
  }
  assertSupabaseFrom();

  const patch: Record<string, unknown> = {};
  if (updates.price !== undefined) patch.price = Math.max(0, Number(updates.price) || 0);
  if (updates.moq !== undefined) patch.moq = Math.max(0, Math.trunc(Number(updates.moq) || 0));
  if (updates.leadTime !== undefined) patch.lead_time = String(updates.leadTime ?? '');
  if (updates.physicalStock !== undefined || updates.stock !== undefined) {
    patch.physical_stock = Math.max(
      0,
      Math.trunc(Number(updates.physicalStock ?? updates.stock) || 0),
    );
    patch.last_stock_update = updates.lastStockUpdate ?? new Date().toISOString();
  }
  if (updates.reservedStock !== undefined) {
    patch.reserved_stock = Math.max(0, Math.trunc(Number(updates.reservedStock) || 0));
  }
  if (updates.incomingStock !== undefined) {
    patch.incoming_stock = Math.max(0, Math.trunc(Number(updates.incomingStock) || 0));
  }
  if (updates.vendorProductCode !== undefined) {
    patch.vendor_product_code = String(updates.vendorProductCode ?? '').trim();
  }
  if (updates.variations !== undefined) patch.variations = updates.variations ?? [];
  if (updates.digitalAvailability !== undefined) {
    patch.digital_availability = updates.digitalAvailability ?? null;
  }
  if (updates.status !== undefined) {
    patch.status = updates.status === 'Inactive' ? 'Inactive' : 'Active';
  }
  if (updates.currency !== undefined) patch.currency = String(updates.currency || 'INR');
  if (updates.handlingCharge !== undefined) patch.handling_charge = Math.max(0, Number(updates.handlingCharge) || 0);
  if (updates.deliveryCharge !== undefined) patch.delivery_charge = Math.max(0, Number(updates.deliveryCharge) || 0);
  if (updates.otherCharge !== undefined) patch.other_charge = Math.max(0, Number(updates.otherCharge) || 0);
  if (updates.taxPercentage !== undefined) patch.tax_percentage = updates.taxPercentage;
  if (updates.vendorSku !== undefined) patch.vendor_sku = String(updates.vendorSku ?? '');
  if (updates.terms !== undefined) patch.terms = String(updates.terms ?? '');

  const { data, error } = await supabase
    .from('vendor_products')
    .update(patch)
    .eq('vendor_id', vendorId)
    .eq('master_catalogue_item_id', masterCatalogueItemId)
    .select(SELECT_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message || 'Unable to update vendor product.');
  }

  return mapDbVendorProductRowToVendorProduct(data as DbVendorProductRow);
}

export async function removeVendorProductInSupabase(
  vendorId: string,
  masterCatalogueItemId: string,
): Promise<void> {
  if (!isSupabaseUuid(vendorId) || !isSupabaseUuid(masterCatalogueItemId)) {
    throw new Error('Valid Supabase vendor ID and product ID are required.');
  }
  assertSupabaseFrom();

  const { error } = await supabase
    .from('vendor_products')
    .delete()
    .eq('vendor_id', vendorId)
    .eq('master_catalogue_item_id', masterCatalogueItemId);

  if (error) {
    throw new Error(error.message || 'Unable to remove vendor product.');
  }
}

export async function migrateLocalVendorProductsToSupabaseIfNeeded(
  vendorIdMap: Record<string, string> = {},
): Promise<{ migrated: number; skipped: number; invalid: number }> {
  if (typeof window === 'undefined') return { migrated: 0, skipped: 0, invalid: 0 };
  if (localStorage.getItem(LOCAL_VP_MIGRATED_KEY) === 'done') {
    return { migrated: 0, skipped: 0, invalid: 0 };
  }

  const rawLocalAll = getAllVendorProducts() as unknown;
  const localAll: VendorProduct[] = Array.isArray(rawLocalAll)
    ? rawLocalAll
    : rawLocalAll && typeof rawLocalAll === 'object'
      ? Object.values(rawLocalAll as Record<string, VendorProduct[]>).flat()
      : [];
  if (localAll.length === 0) {
    localStorage.setItem(LOCAL_VP_MIGRATED_KEY, 'done');
    return { migrated: 0, skipped: 0, invalid: 0 };
  }

  const catalog = getCatalogProducts();
  const catalogByCode = new Map(
    catalog
      .filter((c) => isSupabaseUuid(c.id) && c.masterProductCode)
      .map((c) => [c.masterProductCode.trim().toLowerCase(), c.id]),
  );
  const catalogIds = new Set(catalog.filter((c) => isSupabaseUuid(c.id)).map((c) => c.id));

  let migrated = 0;
  let skipped = 0;
  let invalid = 0;

  for (const vp of localAll) {
    const targetVendorId = isSupabaseUuid(vp.vendorId)
      ? vp.vendorId
      : vendorIdMap[vp.vendorId];
    const targetMasterId = isSupabaseUuid(vp.id) && catalogIds.has(vp.id)
      ? vp.id
      : catalogByCode.get(String(vp.masterProductCode ?? '').trim().toLowerCase());

    if (!targetVendorId || !targetMasterId) {
      invalid += 1;
      continue;
    }

    try {
      await assignVendorProductsInSupabase(targetVendorId, [
        { ...vp, id: targetMasterId, vendorId: targetVendorId },
      ]);
      migrated += 1;
    } catch {
      skipped += 1;
    }
  }

  localStorage.setItem(LOCAL_VP_MIGRATED_KEY, 'done');
  return { migrated, skipped, invalid };
}
