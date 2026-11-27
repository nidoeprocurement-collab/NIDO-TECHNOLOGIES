import { supabase } from '@/lib/supabase';
import { isSupabaseUuid } from '@/lib/nidoRolesApi';
import { getCatalogProducts, type CatalogVariation } from '@/lib/catalogStore';
import {
  getClientCatalog,
  saveClientCatalog,
  type ClientCatalogEntry,
} from '@/lib/clientCatalogStore';

interface JoinedMasterProduct {
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
  specifications: unknown[] | null;
  general_specs: { label: string; value: string }[] | null;
  variations: CatalogVariation[] | null;
  product_notes: string | null;
  video_url: string | null;
  images: string[] | null;
  lead_time: string | null;
  moq: number | null;
  warranty: string | null;
}

export interface DbClientCatalogueRow {
  id: string;
  client_id: string;
  master_catalogue_item_id: string;
  client_product_code: string;
  client_sku: string | null;
  display_name: string | null;
  description_override: string | null;
  default_vendor_id: string | null;
  assigned_vendor_ids: string[] | null;
  allowed_roles: string[] | null;
  preference: string | null;
  visibility: 'visible' | 'hidden';
  publish_status: 'published' | 'draft' | 'unpublished';
  status: 'Active' | 'Inactive';
  client_moq: number | null;
  cached_selling_price: number | string | null;
  cached_selling_price_display: string | null;
  product_notes: string | null;
  metadata: Record<string, unknown> | null;
  master_catalogue_items?: JoinedMasterProduct | JoinedMasterProduct[] | null;
}

export type HydratedClientCatalogEntry = ClientCatalogEntry & {
  clientCatalogItemId?: string;
  masterCatalogueItemId?: string;
  publishStatus?: 'published' | 'draft' | 'unpublished';
  visibility?: 'visible' | 'hidden';
  status?: 'Active' | 'Inactive';
  defaultVendorId?: string | null;
};

const SELECT_COLUMNS =
  'id,client_id,master_catalogue_item_id,client_product_code,client_sku,display_name,description_override,default_vendor_id,assigned_vendor_ids,allowed_roles,preference,visibility,publish_status,status,client_moq,cached_selling_price,cached_selling_price_display,product_notes,metadata,master_catalogue_items(id,master_product_code,sku_code,product_name,product_type,physical_type,category,subcategory,brand,tags,description,specifications,general_specs,variations,product_notes,video_url,images,lead_time,moq,warranty)';

const MIGRATED_KEY_PREFIX = 'nido_client_catalog_supabase_migrated_v1:';

function assertSupabaseFrom() {
  if (typeof (supabase as { from?: unknown })?.from !== 'function') {
    throw new Error('Supabase client is not initialized.');
  }
}

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function mapDbClientCatalogueRow(row: DbClientCatalogueRow): HydratedClientCatalogEntry {
  const joined = Array.isArray(row.master_catalogue_items)
    ? row.master_catalogue_items[0]
    : row.master_catalogue_items;
  const master = joined ?? getCatalogProducts().find((m) => m.id === row.master_catalogue_item_id);
  const meta = (row.metadata && typeof row.metadata === 'object' ? row.metadata : {}) as Record<string, unknown>;

  const priceNum =
    row.cached_selling_price !== null && row.cached_selling_price !== undefined
      ? Number(row.cached_selling_price) || 0
      : typeof meta.priceNum === 'number'
        ? meta.priceNum
        : 0;
  const priceDisplay =
    row.cached_selling_price_display ||
    (priceNum > 0 ? formatInr(priceNum) : String(meta.price ?? '₹0.00'));

  const specsFromJoined = Array.isArray((joined as JoinedMasterProduct | undefined)?.specifications)
    ? ((joined as JoinedMasterProduct).specifications as unknown[]).map((s) =>
        typeof s === 'string' ? s : s && typeof s === 'object' && 'key' in s && 'value' in s ? `${(s as { key: string; value: string }).key}: ${(s as { value: string }).value}` : String(s),
      )
    : undefined;

  return {
    clientCatalogItemId: row.id,
    masterCatalogueItemId: row.master_catalogue_item_id,
    publishStatus: row.publish_status,
    visibility: row.visibility,
    status: row.status,
    defaultVendorId: row.default_vendor_id,
    productCode:
      (joined as JoinedMasterProduct | undefined)?.master_product_code ||
      (master && 'masterProductCode' in master ? master.masterProductCode : '') ||
      row.master_catalogue_item_id,
    sku:
      row.client_sku ||
      (joined as JoinedMasterProduct | undefined)?.sku_code ||
      (master && 'skuCode' in master ? master.skuCode : '') ||
      '',
    name:
      row.display_name ||
      (joined as JoinedMasterProduct | undefined)?.product_name ||
      (master && 'productName' in master ? master.productName : '') ||
      'Product',
    category:
      (joined as JoinedMasterProduct | undefined)?.category ||
      (master && 'category' in master ? master.category : '') ||
      'Uncategorized',
    subcategory:
      (joined as JoinedMasterProduct | undefined)?.subcategory ||
      (master && 'subcategory' in master ? master.subcategory : undefined) ||
      undefined,
    brand:
      (joined as JoinedMasterProduct | undefined)?.brand ||
      (master && 'brand' in master ? master.brand : undefined) ||
      undefined,
    tags: Array.isArray((joined as JoinedMasterProduct | undefined)?.tags)
      ? (joined as JoinedMasterProduct).tags ?? []
      : undefined,
    productType: (joined as JoinedMasterProduct | undefined)?.product_type || undefined,
    physicalType: (joined as JoinedMasterProduct | undefined)?.physical_type || undefined,
    roles: Array.isArray(row.allowed_roles) ? row.allowed_roles : [],
    preference: row.preference || 'Standard',
    cpc: row.client_product_code,
    price: priceDisplay,
    priceNum,
    availability: String(meta.availability ?? 'In Stock'),
    img:
      ((joined as JoinedMasterProduct | undefined)?.images ?? [])[0] ||
      String(meta.img ?? ''),
    images: (joined as JoinedMasterProduct | undefined)?.images ?? (Array.isArray(meta.images) ? (meta.images as string[]) : []),
    description:
      row.description_override ||
      (joined as JoinedMasterProduct | undefined)?.description ||
      (typeof meta.description === 'string' ? meta.description : undefined),
    specs: specsFromJoined ?? (Array.isArray(meta.specs) ? (meta.specs as string[]) : undefined),
    leadTime:
      (joined as JoinedMasterProduct | undefined)?.lead_time ||
      (typeof meta.leadTime === 'string' ? meta.leadTime : undefined),
    moq: row.client_moq ?? (joined as JoinedMasterProduct | undefined)?.moq ?? undefined,
    generalSpecs: (joined as JoinedMasterProduct | undefined)?.general_specs ?? undefined,
    variations: (joined as JoinedMasterProduct | undefined)?.variations ?? undefined,
    productNotes:
      row.product_notes ||
      (joined as JoinedMasterProduct | undefined)?.product_notes ||
      undefined,
    videoUrl: (joined as JoinedMasterProduct | undefined)?.video_url || undefined,
    warranty: (joined as JoinedMasterProduct | undefined)?.warranty || undefined,
  };
}

export async function loadClientCatalogFromSupabase(
  clientId: string,
): Promise<HydratedClientCatalogEntry[]> {
  if (!isSupabaseUuid(clientId)) {
    return getClientCatalog(clientId);
  }
  assertSupabaseFrom();
  const { data, error } = await supabase
    .from('client_catalogue_items')
    .select(SELECT_COLUMNS)
    .eq('client_id', clientId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message || 'Unable to load client catalogue from Supabase.');
  }

  const mapped = (Array.isArray(data) ? (data as DbClientCatalogueRow[]) : []).map(
    mapDbClientCatalogueRow,
  );
  saveClientCatalog(clientId, mapped);
  return mapped;
}

function resolveMasterId(entry: ClientCatalogEntry): string | null {
  const ext = entry as HydratedClientCatalogEntry;
  if (ext.masterCatalogueItemId && isSupabaseUuid(ext.masterCatalogueItemId)) {
    return ext.masterCatalogueItemId;
  }
  const catalog = getCatalogProducts();
  const code = String(entry.productCode || '').trim().toLowerCase();
  const match = catalog.find(
    (c) =>
      isSupabaseUuid(c.id) &&
      (c.id.toLowerCase() === code || c.masterProductCode.trim().toLowerCase() === code),
  );
  return match ? match.id : null;
}

export async function assignClientCatalogItemsInSupabase(
  clientId: string,
  entries: ClientCatalogEntry[],
): Promise<HydratedClientCatalogEntry[]> {
  if (!isSupabaseUuid(clientId)) {
    throw new Error('Valid Supabase client ID is required.');
  }
  assertSupabaseFrom();
  if (entries.length === 0) return [];

  const rows = entries.map((entry) => {
    const masterId = resolveMasterId(entry);
    if (!masterId) {
      throw new Error(`Product "${entry.name || entry.productCode}" does not have a valid Master Catalogue UUID.`);
    }
    const ext = entry as HydratedClientCatalogEntry;
    return {
      client_id: clientId,
      master_catalogue_item_id: masterId,
      ...(entry.cpc?.trim() ? { client_product_code: entry.cpc.trim() } : {}),
      client_sku: entry.sku || null,
      display_name: entry.name || null,
      description_override: entry.description || null,
      default_vendor_id: ext.defaultVendorId && isSupabaseUuid(ext.defaultVendorId) ? ext.defaultVendorId : null,
      allowed_roles: Array.isArray(entry.roles) ? entry.roles : [],
      preference: entry.preference || 'Standard',
      visibility: ext.visibility ?? 'visible',
      publish_status: ext.publishStatus ?? 'published',
      status: ext.status ?? 'Active',
      client_moq: entry.moq && entry.moq > 0 ? Math.trunc(entry.moq) : null,
      cached_selling_price: typeof entry.priceNum === 'number' ? entry.priceNum : null,
      cached_selling_price_display: entry.price || null,
      product_notes: entry.productNotes || null,
      metadata: {
        availability: entry.availability || 'In Stock',
        img: entry.img || '',
        leadTime: entry.leadTime || '',
      },
    };
  });

  const { data, error } = await supabase
    .from('client_catalogue_items')
    .insert(rows)
    .select(SELECT_COLUMNS);

  if (error) {
    if (error.code === '23505') {
      throw new Error('One or more products are already assigned to this client.');
    }
    if (error.code === '23503') {
      throw new Error('Referenced client or Master Catalogue product does not exist.');
    }
    throw new Error(error.message || 'Unable to assign products to client catalogue.');
  }

  const mapped = (Array.isArray(data) ? (data as DbClientCatalogueRow[]) : []).map(
    mapDbClientCatalogueRow,
  );
  const existing = getClientCatalog(clientId);
  const seen = new Set(mapped.map((m) => m.productCode));
  saveClientCatalog(clientId, [...existing.filter((e) => !seen.has(e.productCode)), ...mapped]);
  return mapped;
}

export async function updateClientCatalogItemInSupabase(
  clientId: string,
  entry: ClientCatalogEntry,
  updates: Partial<HydratedClientCatalogEntry>,
): Promise<HydratedClientCatalogEntry> {
  if (!isSupabaseUuid(clientId)) {
    throw new Error('Valid Supabase client ID is required.');
  }
  assertSupabaseFrom();
  const ext = entry as HydratedClientCatalogEntry;
  const masterId = resolveMasterId(entry);

  const payload: Record<string, unknown> = {};
  if (updates.sku !== undefined) payload.client_sku = updates.sku || null;
  if (updates.name !== undefined) payload.display_name = updates.name || null;
  if (updates.description !== undefined) payload.description_override = updates.description || null;
  if (updates.roles !== undefined) payload.allowed_roles = updates.roles;
  if (updates.preference !== undefined) payload.preference = updates.preference;
  if (updates.cpc !== undefined) payload.client_product_code = updates.cpc;
  if (updates.moq !== undefined) payload.client_moq = updates.moq && updates.moq > 0 ? Math.trunc(updates.moq) : null;
  if (updates.priceNum !== undefined) payload.cached_selling_price = updates.priceNum;
  if (updates.price !== undefined) payload.cached_selling_price_display = updates.price;
  if (updates.productNotes !== undefined) payload.product_notes = updates.productNotes || null;
  if (updates.publishStatus !== undefined) payload.publish_status = updates.publishStatus;
  if (updates.visibility !== undefined) payload.visibility = updates.visibility;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.defaultVendorId !== undefined) payload.default_vendor_id = updates.defaultVendorId;

  let query = supabase.from('client_catalogue_items').update(payload).eq('client_id', clientId);
  if (ext.clientCatalogItemId && isSupabaseUuid(ext.clientCatalogItemId)) {
    query = query.eq('id', ext.clientCatalogItemId);
  } else if (masterId) {
    query = query.eq('master_catalogue_item_id', masterId);
  } else {
    throw new Error('Valid client catalogue item identifier is required.');
  }

  const { data, error } = await query.select(SELECT_COLUMNS).single();
  if (error) {
    throw new Error(error.message || 'Unable to update client catalogue item.');
  }

  const mapped = mapDbClientCatalogueRow(data as DbClientCatalogueRow);
  const current = getClientCatalog(clientId);
  saveClientCatalog(
    clientId,
    current.map((item) => (item.productCode === mapped.productCode ? mapped : item)),
  );
  return mapped;
}

export async function removeClientCatalogItemInSupabase(
  clientId: string,
  entry: ClientCatalogEntry,
): Promise<void> {
  if (!isSupabaseUuid(clientId)) {
    throw new Error('Valid Supabase client ID is required.');
  }
  assertSupabaseFrom();
  const ext = entry as HydratedClientCatalogEntry;
  const masterId = resolveMasterId(entry);

  let query = supabase.from('client_catalogue_items').delete().eq('client_id', clientId);
  if (ext.clientCatalogItemId && isSupabaseUuid(ext.clientCatalogItemId)) {
    query = query.eq('id', ext.clientCatalogItemId);
  } else if (masterId) {
    query = query.eq('master_catalogue_item_id', masterId);
  } else {
    throw new Error('Valid client catalogue item identifier is required.');
  }

  const { error } = await query;
  if (error) {
    throw new Error(error.message || 'Unable to remove product from client catalogue.');
  }

  saveClientCatalog(
    clientId,
    getClientCatalog(clientId).filter((e) => e.productCode !== entry.productCode),
  );
}

export async function migrateLocalClientCatalogToSupabaseIfNeeded(
  clientId: string,
): Promise<{ migrated: number; skipped: number; invalid: number }> {
  if (typeof window === 'undefined' || !isSupabaseUuid(clientId)) {
    return { migrated: 0, skipped: 0, invalid: 0 };
  }
  const flagKey = `${MIGRATED_KEY_PREFIX}${clientId}`;
  if (localStorage.getItem(flagKey) === 'done') {
    return { migrated: 0, skipped: 0, invalid: 0 };
  }

  const localEntries = getClientCatalog(clientId);
  if (localEntries.length === 0) {
    localStorage.setItem(flagKey, 'done');
    return { migrated: 0, skipped: 0, invalid: 0 };
  }

  const remote = await loadClientCatalogFromSupabase(clientId);
  const existingMasterIds = new Set(remote.map((r) => r.masterCatalogueItemId).filter(Boolean));
  const existingCodes = new Set(remote.map((r) => r.productCode.trim().toLowerCase()));

  let migrated = 0;
  let skipped = 0;
  let invalid = 0;

  for (const entry of localEntries) {
    const masterId = resolveMasterId(entry);
    if (!masterId) {
      invalid += 1;
      continue;
    }
    if (existingMasterIds.has(masterId) || existingCodes.has(entry.productCode.trim().toLowerCase())) {
      skipped += 1;
      continue;
    }
    try {
      await assignClientCatalogItemsInSupabase(clientId, [entry]);
      existingMasterIds.add(masterId);
      migrated += 1;
    } catch {
      skipped += 1;
    }
  }

  localStorage.setItem(flagKey, 'done');
  return { migrated, skipped, invalid };
}
