import { supabase } from '@/lib/supabase';
import { isSupabaseUuid } from '@/lib/nidoRolesApi';
import {
  getCatalogProducts,
  normalizeCatalogProductName,
  setCatalogProductsCache,
  type CatalogProduct,
  type CatalogSpec,
  type CatalogVariation,
  type GeneralSpec,
} from '@/lib/catalogStore';
import type { CatalogAuditLog } from '@/lib/catalogAuditStore';

interface DbMasterCatalogueRow {
  id: string;
  master_product_code: string;
  sku_code: string | null;
  product_name: string;
  product_type: string | null;
  physical_type: string | null;
  category: string | null;
  subcategory: string | null;
  brand: string | null;
  tags: string[] | null;
  description: string | null;
  specifications: CatalogSpec[] | null;
  general_specs: GeneralSpec[] | null;
  variations: CatalogVariation[] | null;
  product_notes: string | null;
  video_url: string | null;
  images: string[] | null;
  publish_status: string | null;
  hsn_code: string | null;
  gst_percentage: number | string | null;
  initial_stock: number | null;
  min_stock_threshold: number | null;
  price: number | string | null;
  moq: number | null;
  lead_time: string | null;
  warranty: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

interface DbMasterCatalogueAuditRow {
  id: string;
  item_id: string | null;
  legacy_item_id: string | null;
  event: string;
  detail: string | null;
  item_name: string | null;
  sku: string | null;
  actor_name: string | null;
  status: string | null;
  previous_value: string | null;
  new_value: string | null;
  created_at: string;
}

const LOCAL_CATALOG_MIGRATED_KEY = 'nido_master_catalogue_supabase_migrated_v1';

const SELECT_COLUMNS =
  'id,master_product_code,sku_code,product_name,product_type,physical_type,category,subcategory,brand,tags,description,specifications,general_specs,variations,product_notes,video_url,images,publish_status,hsn_code,gst_percentage,initial_stock,min_stock_threshold,price,moq,lead_time,warranty,metadata,created_at,updated_at';

export function mapDbMasterCatalogueRowToProduct(row: DbMasterCatalogueRow): CatalogProduct {
  const meta = (row.metadata ?? {}) as Record<string, unknown>;
  const publishStatus =
    row.publish_status === 'published' ||
    row.publish_status === 'pending' ||
    row.publish_status === 'archived' ||
    row.publish_status === 'draft'
      ? row.publish_status
      : 'draft';

  return {
    ...meta,
    id: String(row.id),
    masterProductCode: String(row.master_product_code ?? ''),
    skuCode: String(row.sku_code ?? ''),
    productName: String(row.product_name ?? ''),
    productType: String(row.product_type ?? 'Product'),
    physicalType: String(row.physical_type ?? 'Physical Product'),
    category: String(row.category ?? ''),
    subcategory: String(row.subcategory ?? ''),
    brand: String(row.brand ?? ''),
    tags: Array.isArray(row.tags) ? row.tags : [],
    description: String(row.description ?? ''),
    specifications: Array.isArray(row.specifications) ? row.specifications : [],
    generalSpecs: Array.isArray(row.general_specs) ? row.general_specs : [],
    variations: Array.isArray(row.variations) ? row.variations : [],
    productNotes: String(row.product_notes ?? ''),
    videoUrl: String(row.video_url ?? ''),
    images: Array.isArray(row.images) ? row.images : [],
    publishStatus,
    hsnCode: String(row.hsn_code ?? ''),
    gstPercentage: Number(row.gst_percentage) || 0,
    initialStock: Number(row.initial_stock) || 0,
    minStockThreshold: Number(row.min_stock_threshold) || 0,
    price: Number(row.price) || 0,
    moq: Number(row.moq) || 0,
    leadTime: String(row.lead_time ?? ''),
    warranty: String(row.warranty ?? ''),
  };
}

function buildDbPayload(product: CatalogProduct) {
  const rec = product as unknown as Record<string, unknown>;
  const metadata: Record<string, unknown> = {};
  for (const key of [
    'dimensionL',
    'dimensionW',
    'dimensionH',
    'dimUnit',
    'weight',
    'weightUnit',
    'customsDeclaration',
    'discountPrice',
  ]) {
    if (rec[key] !== undefined && rec[key] !== '') {
      metadata[key] = rec[key];
    }
  }

  return {
    sku_code: String(product.skuCode ?? '').trim(),
    product_name: String(product.productName ?? '').trim(),
    product_type: String(product.productType ?? 'Product').trim() || 'Product',
    physical_type: String(product.physicalType ?? 'Physical Product').trim() || 'Physical Product',
    category: String(product.category ?? '').trim(),
    subcategory: String(product.subcategory ?? '').trim(),
    brand: String(product.brand ?? '').trim(),
    tags: Array.isArray(product.tags) ? product.tags : [],
    description: String(product.description ?? ''),
    specifications: Array.isArray(product.specifications) ? product.specifications : [],
    general_specs: Array.isArray(product.generalSpecs) ? product.generalSpecs : [],
    variations: Array.isArray(product.variations) ? product.variations : [],
    product_notes: String(product.productNotes ?? ''),
    video_url: String(product.videoUrl ?? '').trim(),
    images: Array.isArray(product.images) ? product.images : [],
    publish_status: product.publishStatus ?? 'draft',
    hsn_code: String(product.hsnCode ?? '').trim(),
    gst_percentage: Math.min(100, Math.max(0, Number(product.gstPercentage) || 0)),
    initial_stock: Math.max(0, Math.trunc(Number(product.initialStock) || 0)),
    min_stock_threshold: Math.max(0, Math.trunc(Number(product.minStockThreshold) || 0)),
    price: Math.max(0, Number(product.price) || 0),
    moq: Math.max(0, Math.trunc(Number(product.moq) || 0)),
    lead_time: String(product.leadTime ?? ''),
    warranty: String(product.warranty ?? ''),
    metadata,
  };
}

function assertSupabaseFrom() {
  const fromFn = (supabase as unknown as { from?: (table: string) => unknown }).from;
  if (typeof fromFn !== 'function') {
    throw new Error('Supabase database client is unavailable.');
  }
}

export async function loadMasterCatalogueFromSupabase(): Promise<CatalogProduct[]> {
  assertSupabaseFrom();
  const { data, error } = await supabase
    .from('master_catalogue_items')
    .select(SELECT_COLUMNS)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Unable to load master catalogue from Supabase.');
  }

  const mapped = (Array.isArray(data) ? (data as DbMasterCatalogueRow[]) : []).map(
    mapDbMasterCatalogueRowToProduct,
  );
  setCatalogProductsCache(mapped);
  return mapped;
}

export async function loadMasterCatalogueItemByIdFromSupabase(
  itemId: string,
): Promise<CatalogProduct | null> {
  if (!isSupabaseUuid(itemId)) return null;
  assertSupabaseFrom();

  const { data, error } = await supabase
    .from('master_catalogue_items')
    .select(SELECT_COLUMNS)
    .eq('id', itemId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || 'Unable to load master catalogue item from Supabase.');
  }

  if (!data) return null;
  return mapDbMasterCatalogueRowToProduct(data as DbMasterCatalogueRow);
}

export async function createMasterCatalogueItemInSupabase(
  product: CatalogProduct,
): Promise<CatalogProduct> {
  assertSupabaseFrom();
  const payload = buildDbPayload(product);
  if (!payload.product_name) {
    throw new Error('Product name is required.');
  }

  const insertPayload = {
    ...payload,
    ...(product.masterProductCode?.trim()
      ? { master_product_code: product.masterProductCode.trim() }
      : {}),
  };

  const { data, error } = await supabase
    .from('master_catalogue_items')
    .insert(insertPayload)
    .select(SELECT_COLUMNS)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`Product duplication found: "${payload.product_name}" already exists in the master catalog.`);
    }
    throw new Error(error.message || 'Unable to create master catalogue item.');
  }

  return mapDbMasterCatalogueRowToProduct(data as DbMasterCatalogueRow);
}

export async function updateMasterCatalogueItemInSupabase(
  product: CatalogProduct,
): Promise<CatalogProduct> {
  if (!isSupabaseUuid(product.id)) {
    throw new Error('Valid Supabase item ID is required to update.');
  }
  assertSupabaseFrom();
  const payload = buildDbPayload(product);
  if (!payload.product_name) {
    throw new Error('Product name is required.');
  }

  const { data, error } = await supabase
    .from('master_catalogue_items')
    .update(payload)
    .eq('id', product.id)
    .select(SELECT_COLUMNS)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(`Product duplication found: "${payload.product_name}" already exists in the master catalog.`);
    }
    throw new Error(error.message || 'Unable to update master catalogue item.');
  }

  return mapDbMasterCatalogueRowToProduct(data as DbMasterCatalogueRow);
}

export async function archiveMasterCatalogueItemInSupabase(
  itemId: string,
): Promise<CatalogProduct> {
  if (!isSupabaseUuid(itemId)) {
    throw new Error('Valid Supabase item ID is required to archive.');
  }
  assertSupabaseFrom();
  const { data, error } = await supabase
    .from('master_catalogue_items')
    .update({ publish_status: 'archived' })
    .eq('id', itemId)
    .select(SELECT_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message || 'Unable to archive master catalogue item.');
  }

  return mapDbMasterCatalogueRowToProduct(data as DbMasterCatalogueRow);
}

export async function deleteMasterCatalogueItemInSupabase(itemId: string): Promise<void> {
  if (!isSupabaseUuid(itemId)) {
    throw new Error('Valid Supabase item ID is required to delete.');
  }
  assertSupabaseFrom();
  const { error } = await supabase
    .from('master_catalogue_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    throw new Error(error.message || 'Unable to delete master catalogue item.');
  }
}

export async function loadMasterCatalogueAuditLogsFromSupabase(): Promise<CatalogAuditLog[]> {
  assertSupabaseFrom();
  const { data, error } = await supabase
    .from('master_catalogue_audit_logs')
    .select('id,item_id,legacy_item_id,event,detail,item_name,sku,actor_name,status,previous_value,new_value,created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    throw new Error(error.message || 'Unable to load master catalogue audit logs.');
  }

  return (Array.isArray(data) ? (data as DbMasterCatalogueAuditRow[]) : []).map((row) => ({
    id: String(row.id),
    event: String(row.event ?? 'Updated'),
    detail: String(row.detail ?? ''),
    itemId: row.item_id ?? row.legacy_item_id ?? undefined,
    itemName: row.item_name ?? undefined,
    sku: row.sku ?? undefined,
    user: row.actor_name || 'System Owner',
    date: row.created_at
      ? new Date(row.created_at).toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      : '',
    timestamp: row.created_at ? new Date(row.created_at).getTime() : 0,
    status:
      row.status === 'Approved' ||
      row.status === 'Pending' ||
      row.status === 'Rejected' ||
      row.status === 'Draft' ||
      row.status === 'Archived' ||
      row.status === 'Updated' ||
      row.status === 'Deleted'
        ? row.status
        : 'Updated',
    previousValue: row.previous_value ?? undefined,
    newValue: row.new_value ?? undefined,
  }));
}

export async function addMasterCatalogueAuditLogInSupabase(entry: {
  itemId?: string;
  event: string;
  detail: string;
  itemName?: string;
  sku?: string;
  actorName?: string;
  status: CatalogAuditLog['status'];
  previousValue?: string;
  newValue?: string;
}): Promise<void> {
  assertSupabaseFrom();
  const isUuid = Boolean(entry.itemId && isSupabaseUuid(entry.itemId));
  const { error } = await supabase.from('master_catalogue_audit_logs').insert({
    item_id: isUuid ? entry.itemId : null,
    legacy_item_id: !isUuid && entry.itemId ? entry.itemId : null,
    event: entry.event,
    detail: entry.detail,
    item_name: entry.itemName ?? null,
    sku: entry.sku ?? null,
    actor_name: entry.actorName || 'System Owner',
    status: entry.status,
    previous_value: entry.previousValue ?? null,
    new_value: entry.newValue ?? null,
  });

  if (error) {
    throw new Error(error.message || 'Unable to write master catalogue audit log.');
  }
}

export async function deleteMasterCatalogueAuditLogInSupabase(logId: string): Promise<void> {
  if (!isSupabaseUuid(logId)) return;
  assertSupabaseFrom();
  const { error } = await supabase
    .from('master_catalogue_audit_logs')
    .delete()
    .eq('id', logId);
  if (error) {
    throw new Error(error.message || 'Unable to delete master catalogue audit log.');
  }
}

/**
 * Idempotently migrates valid non-seed localStorage catalogue records into
 * Supabase without overwriting existing Supabase rows.
 */
export async function migrateLocalCatalogToSupabaseIfNeeded(): Promise<{
  migrated: number;
  skipped: number;
}> {
  if (typeof window === 'undefined') return { migrated: 0, skipped: 0 };
  if (localStorage.getItem(LOCAL_CATALOG_MIGRATED_KEY) === 'done') {
    return { migrated: 0, skipped: 0 };
  }

  const localProducts = getCatalogProducts().filter(
    (p) =>
      !String(p.id).startsWith('seed-') &&
      !isSupabaseUuid(p.id) &&
      String(p.productName ?? '').trim().length > 0 &&
      p.productName.trim() !== 'Untitled Product',
  );

  if (localProducts.length === 0) {
    localStorage.setItem(LOCAL_CATALOG_MIGRATED_KEY, 'done');
    return { migrated: 0, skipped: 0 };
  }

  const remoteExisting = await loadMasterCatalogueFromSupabase();
  const existingNames = new Set(
    remoteExisting.map((p) => normalizeCatalogProductName(p.productName)),
  );
  const existingCodes = new Set(
    remoteExisting.map((p) => String(p.masterProductCode ?? '').trim()).filter(Boolean),
  );

  let migrated = 0;
  let skipped = 0;

  for (const localProduct of localProducts) {
    const normName = normalizeCatalogProductName(localProduct.productName);
    const code = String(localProduct.masterProductCode ?? '').trim();
    if (!normName || existingNames.has(normName) || (code && existingCodes.has(code))) {
      skipped += 1;
      continue;
    }

    try {
      const created = await createMasterCatalogueItemInSupabase(localProduct);
      existingNames.add(normalizeCatalogProductName(created.productName));
      if (created.masterProductCode) existingCodes.add(created.masterProductCode);
      migrated += 1;
    } catch {
      skipped += 1;
    }
  }

  localStorage.setItem(LOCAL_CATALOG_MIGRATED_KEY, 'done');
  return { migrated, skipped };
}
