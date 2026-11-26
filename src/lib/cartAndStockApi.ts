import { supabase } from '@/lib/supabase';
import { isSupabaseUuid } from '@/lib/nidoRolesApi';
import type { CartItem } from '@/contexts/CartContext';
import { formatConfigurationLabel } from '@/lib/productConfiguration';

export interface ShopVendorOptionRow {
  vendor_id: string;
  vendor_name: string;
  vendor_rating: number;
  payment_terms: string;
  vendor_product_id: string;
  vendor_product_code: string;
  base_price: number;
  moq: number;
  lead_time: string;
  physical_stock: number;
  reserved_stock: number;
  available_stock: number;
  incoming_stock: number;
  digital_availability: 'available' | 'not_available' | null;
  variations: unknown[];
}

export interface DbCartItemRow {
  id: string;
  user_id: string;
  client_id: string;
  master_catalogue_item_id: string;
  vendor_id: string | null;
  vendor_product_id: string | null;
  quantity: number;
  configuration: Record<string, string> | null;
  configuration_key: string;
  configuration_price_adjustment: number | string;
  unit_price_inclusive: number | string;
  client_selling_price_excl_gst: number | string;
  vendor_price: number | string;
  landed_cost: number | string;
  gst_snapshot: number | string | null;
  hsn_snapshot: string | null;
  vendor_rating: number | string | null;
  lead_time: string | null;
  moq: number;
  fulfillment_type: 'physical' | 'digital' | 'hybrid' | null;
  metadata: Record<string, unknown> | null;
  master_catalogue_items?: {
    master_product_code: string;
    product_name: string;
    category: string | null;
    product_type: string | null;
    physical_type: string | null;
    images: string[] | null;
  } | null;
  vendors?: {
    name: string;
  } | null;
}

export type HydratedCartItem = CartItem & {
  dbCartItemId?: string;
  masterCatalogueItemId?: string;
};

function assertSupabaseRpc() {
  if (typeof (supabase as { rpc?: unknown })?.rpc !== 'function') {
    throw new Error('Supabase client is not initialized.');
  }
}

export function buildConfigKey(configuration?: Record<string, string>): string {
  if (!configuration) return '';
  return Object.entries(configuration)
    .map(([key, value]) => [formatConfigurationLabel(key).toLowerCase(), value] as [string, string])
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
}

function stableNumericIdFromUuid(uuid: string): number {
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    hash = ((hash << 5) - hash + uuid.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || 1;
}

export function mapDbCartRowToCartItem(row: DbCartItemRow): HydratedCartItem {
  const meta = (row.metadata && typeof row.metadata === 'object' ? row.metadata : {}) as Record<string, unknown>;
  const master = row.master_catalogue_items;
  const vendor = row.vendors;

  return {
    id: typeof meta.legacyId === 'number' ? meta.legacyId : stableNumericIdFromUuid(row.id),
    dbCartItemId: row.id,
    masterCatalogueItemId: row.master_catalogue_item_id,
    name: String(meta.name ?? master?.product_name ?? 'Product'),
    image: String(meta.image ?? master?.images?.[0] ?? ''),
    specs: Array.isArray(meta.specs) ? (meta.specs as string[]) : [],
    moq: row.moq || 1,
    totalStock: Number(meta.totalStock ?? 0) || 0,
    priceNum: Number(row.unit_price_inclusive) || 0,
    quantity: row.quantity,
    clientId: row.client_id,
    category: String(meta.category ?? master?.category ?? ''),
    productCode: String(meta.productCode ?? master?.master_product_code ?? row.master_catalogue_item_id),
    productType: String(meta.productType ?? master?.product_type ?? ''),
    physicalType: String(meta.physicalType ?? master?.physical_type ?? ''),
    fulfillmentType: row.fulfillment_type ?? undefined,
    leadTime: row.lead_time ?? undefined,
    selectedVendorId: row.vendor_id ?? undefined,
    selectedVendorName: String(meta.selectedVendorName ?? vendor?.name ?? ''),
    vendorProductCode: typeof meta.vendorProductCode === 'string' ? meta.vendorProductCode : undefined,
    vendorPrice: Number(row.vendor_price) || 0,
    clientSellingPriceExclGst: Number(row.client_selling_price_excl_gst) || 0,
    landedCost: Number(row.landed_cost) || 0,
    gstSnapshot: row.gst_snapshot !== null ? Number(row.gst_snapshot) : undefined,
    hsnSnapshot: row.hsn_snapshot ?? undefined,
    vendorRating: row.vendor_rating !== null ? Number(row.vendor_rating) : undefined,
    configuration: row.configuration ?? undefined,
    configurationPriceAdjustment: Number(row.configuration_price_adjustment) || 0,
    vendorAllocations: row.vendor_id
      ? [
          {
            vendorId: row.vendor_id,
            vendorProductId: row.vendor_product_id || '',
            vendorName: String(meta.selectedVendorName ?? vendor?.name ?? ''),
            allocated: row.quantity,
          },
        ]
      : [],
  };
}

export async function loadShopVendorOptionsFromSupabase(
  clientId: string,
  masterCatalogueItemId: string,
): Promise<ShopVendorOptionRow[]> {
  if (!isSupabaseUuid(clientId) || !isSupabaseUuid(masterCatalogueItemId)) {
    return [];
  }
  assertSupabaseRpc();
  const { data, error } = await supabase.rpc('get_shop_vendor_options', {
    p_client_id: clientId,
    p_master_catalogue_item_id: masterCatalogueItemId,
  });
  if (error) {
    throw new Error(error.message || 'Unable to load vendor options.');
  }
  return Array.isArray(data) ? (data as ShopVendorOptionRow[]) : [];
}

export async function loadCartFromSupabase(clientId?: string): Promise<HydratedCartItem[]> {
  if (!clientId || !isSupabaseUuid(clientId)) {
    return [];
  }
  if (typeof (supabase as { from?: unknown })?.from !== 'function') {
    throw new Error('Supabase client is not initialized.');
  }
  const { data, error } = await supabase
    .from('cart_items')
    .select(
      '*,master_catalogue_items(master_product_code,product_name,category,product_type,physical_type,images),vendors(name)',
    )
    .eq('client_id', clientId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message || 'Unable to load cart from Supabase.');
  }
  return (Array.isArray(data) ? (data as DbCartItemRow[]) : []).map(mapDbCartRowToCartItem);
}

export async function reserveAndAddToCartInSupabase(
  clientId: string,
  masterCatalogueItemId: string,
  item: Omit<CartItem, 'quantity' | 'vendorAllocations'>,
  quantity: number,
): Promise<HydratedCartItem> {
  if (!isSupabaseUuid(clientId) || !isSupabaseUuid(masterCatalogueItemId) || !item.selectedVendorId || !isSupabaseUuid(item.selectedVendorId)) {
    throw new Error('Valid client, product, and vendor IDs are required to reserve stock.');
  }
  assertSupabaseRpc();

  const { data, error } = await supabase.rpc('reserve_cart_item_stock', {
    p_client_id: clientId,
    p_master_catalogue_item_id: masterCatalogueItemId,
    p_vendor_id: item.selectedVendorId,
    p_quantity: Math.max(1, Math.trunc(quantity)),
    p_configuration: item.configuration ?? {},
    p_configuration_key: buildConfigKey(item.configuration),
    p_configuration_price_adjustment: item.configurationPriceAdjustment ?? 0,
    p_unit_price_inclusive: item.priceNum ?? 0,
    p_client_selling_price_excl_gst: item.clientSellingPriceExclGst ?? 0,
    p_landed_cost: item.landedCost ?? 0,
    p_gst_snapshot: item.gstSnapshot ?? null,
    p_hsn_snapshot: item.hsnSnapshot ?? null,
    p_fulfillment_type: item.fulfillmentType ?? null,
    p_metadata: {
      legacyId: item.id,
      name: item.name,
      image: item.image,
      specs: item.specs,
      totalStock: item.totalStock,
      category: item.category,
      productCode: item.productCode,
      productType: item.productType,
      physicalType: item.physicalType,
      selectedVendorName: item.selectedVendorName,
      vendorProductCode: item.vendorProductCode,
    },
  });

  if (error) {
    throw new Error(error.message || 'Unable to reserve stock and add item to cart.');
  }
  return mapDbCartRowToCartItem(data as DbCartItemRow);
}

export async function updateCartItemQuantityInSupabase(
  cartItemId: string,
  newQuantity: number,
): Promise<HydratedCartItem | null> {
  if (!isSupabaseUuid(cartItemId)) {
    throw new Error('Valid Supabase cart item ID is required.');
  }
  assertSupabaseRpc();
  const { data, error } = await supabase.rpc('update_cart_item_quantity_atomic', {
    p_cart_item_id: cartItemId,
    p_new_quantity: Math.trunc(newQuantity),
  });
  if (error) {
    throw new Error(error.message || 'Unable to update cart quantity.');
  }
  return data ? mapDbCartRowToCartItem(data as DbCartItemRow) : null;
}

export async function removeCartItemInSupabase(cartItemId: string): Promise<void> {
  if (!isSupabaseUuid(cartItemId)) return;
  assertSupabaseRpc();
  const { error } = await supabase.rpc('remove_cart_item_and_release', {
    p_cart_item_id: cartItemId,
  });
  if (error) {
    throw new Error(error.message || 'Unable to remove cart item.');
  }
}

export async function clearCartInSupabase(
  clientId: string,
  consume = false,
): Promise<void> {
  if (!isSupabaseUuid(clientId)) return;
  assertSupabaseRpc();
  const { error } = await supabase.rpc('clear_user_cart_and_release', {
    p_client_id: clientId,
    p_consume: consume,
  });
  if (error) {
    throw new Error(error.message || 'Unable to clear cart.');
  }
}
