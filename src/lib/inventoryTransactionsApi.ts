import { supabase } from '@/lib/supabase';
import { isSupabaseUuid } from '@/lib/nidoRolesApi';
import type { StockAction, StockHistoryEntry } from '@/lib/stockHistoryStore';
import type { InventoryItemRecord } from '@/lib/clientInventoryStore';

export interface DbInventoryTransactionRow {
  id: string;
  transaction_reference: string;
  transaction_type: string;
  master_catalogue_item_id: string | null;
  master_product_code: string;
  product_name: string;
  vendor_id: string | null;
  vendor_name: string | null;
  client_id: string | null;
  field: 'physicalStock' | 'reservedStock' | 'clientInventory' | 'both';
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  transaction_date: string;
  performed_by: string;
  reason: string | null;
  document_reference: string | null;
}

export interface DbInventoryAdjustmentRow {
  id: string;
  adjustment_reference: string;
  vendor_id: string;
  vendor_product_id: string;
  master_catalogue_item_id: string;
  master_product_code: string;
  adjustment_type: 'Stock In' | 'Stock Out' | 'Stock Correction';
  quantity_delta: number;
  previous_physical_stock: number;
  new_physical_stock: number;
  reason: string;
  performed_by: string;
  created_at: string;
}

export interface DbClientInventoryRow {
  id: string;
  client_id: string;
  master_catalogue_item_id: string | null;
  goods_receipt_item_id: string | null;
  source_key: string | null;
  asset_id: string;
  name: string;
  asset_type: 'Physical Asset' | 'Digital License' | 'Consumable';
  category: string | null;
  serial_number: string | null;
  location: string | null;
  quantity: number;
  unit_label: string;
  condition: 'New' | 'Good' | 'Active' | 'Fair';
  status: 'available' | 'assigned' | 'reserved' | 'repair';
  warranty: string | null;
}

function assertSupabaseFrom() {
  if (typeof (supabase as { from?: unknown })?.from !== 'function') {
    throw new Error('Supabase client is not initialized.');
  }
}

export async function loadInventoryTransactionsFromSupabase(
  masterProductCode?: string,
): Promise<StockHistoryEntry[]> {
  assertSupabaseFrom();
  let query = supabase
    .from('inventory_transactions')
    .select('*')
    .order('transaction_date', { ascending: false });

  if (masterProductCode) {
    query = query.eq('master_product_code', masterProductCode);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || 'Unable to load inventory transactions from Supabase.');
  }

  const mapped: StockHistoryEntry[] = (
    Array.isArray(data) ? (data as DbInventoryTransactionRow[]) : []
  ).map((row) => ({
    id: row.transaction_reference || row.id,
    timestamp: row.transaction_date,
    masterProductCode: row.master_product_code,
    productName: row.product_name,
    vendorId: row.vendor_id || '',
    vendorName: row.vendor_name || '',
    action: (row.transaction_type === 'GRN Accepted' ? 'Stock In' : row.transaction_type) as StockAction,
    field: row.field === 'clientInventory' ? 'physicalStock' : row.field,
    qtyBefore: row.previous_quantity,
    qtyChanged: row.quantity,
    qtyAfter: row.new_quantity,
    reference: row.document_reference || row.reason || row.transaction_reference,
    user: row.performed_by,
  }));

  if (!masterProductCode && typeof window !== 'undefined' && mapped.length > 0) {
    localStorage.setItem('nido_stock_history', JSON.stringify([...mapped].reverse()));
    window.dispatchEvent(new Event('stockHistoryUpdated'));
  }

  return mapped;
}

export async function adjustVendorInventoryInSupabase(params: {
  vendorId: string;
  masterCatalogueItemId: string;
  adjustmentType: 'Stock In' | 'Stock Out' | 'Stock Correction';
  quantityDelta: number;
  reason: string;
  performedBy: string;
}): Promise<DbInventoryAdjustmentRow> {
  if (typeof (supabase as { rpc?: unknown })?.rpc !== 'function') {
    throw new Error('Supabase client is not initialized.');
  }
  const { data, error } = await supabase.rpc('adjust_vendor_inventory_atomic', {
    p_vendor_id: params.vendorId,
    p_master_catalogue_item_id: params.masterCatalogueItemId,
    p_adjustment_type: params.adjustmentType,
    p_quantity_delta: Math.trunc(params.quantityDelta),
    p_reason: params.reason,
    p_performed_by: params.performedBy,
  });
  if (error) {
    throw new Error(error.message || 'Unable to adjust vendor inventory.');
  }
  return data as DbInventoryAdjustmentRow;
}

export async function loadClientInventoryFromSupabase(
  clientId: string,
): Promise<InventoryItemRecord[]> {
  if (!isSupabaseUuid(clientId)) return [];
  assertSupabaseFrom();
  const { data, error } = await supabase
    .from('client_inventory_items')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Unable to load client inventory from Supabase.');
  }

  return (Array.isArray(data) ? (data as DbClientInventoryRow[]) : []).map((row) => ({
    id: row.id,
    sourceKey: row.source_key ?? undefined,
    assetId: row.asset_id,
    name: row.name,
    type: row.asset_type,
    category: row.category || 'General',
    serialNumber: row.serial_number || '',
    location: row.location || '',
    quantity: row.quantity,
    unitLabel: row.unit_label || 'units',
    condition: row.condition || 'New',
    status: row.status || 'available',
    idleDays: 0,
    warranty: row.warranty ?? undefined,
  }));
}
