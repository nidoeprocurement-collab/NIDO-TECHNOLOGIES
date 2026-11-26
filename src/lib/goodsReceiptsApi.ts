import { supabase } from '@/lib/supabase';

export interface GoodsReceiptItemInput {
  sub_order_id: string;
  received_qty: number;
  accepted_qty?: number;
  rejected_qty?: number;
  damaged_qty?: number;
  batch_number?: string;
  serial_number?: string;
  expiry_date?: string;
  inspection_notes?: string;
  return_requested?: boolean;
  return_reason?: string;
}

export interface DbGoodsReceiptItemRow {
  id: string;
  goods_receipt_id: string;
  purchase_order_item_id: string;
  sub_order_id: string;
  master_catalogue_item_id: string | null;
  product_code: string | null;
  sku: string | null;
  product_name: string;
  ordered_qty: number;
  previously_received_qty: number;
  received_qty: number;
  accepted_qty: number;
  rejected_qty: number;
  damaged_qty: number;
  shortage_qty: number;
  excess_qty: number;
  batch_number: string | null;
  serial_number: string | null;
  expiry_date: string | null;
  inspection_notes: string | null;
  return_requested: boolean;
  return_reason: string | null;
}

export interface DbGoodsReceiptRow {
  id: string;
  grn_number: string;
  purchase_order_id: string;
  po_number: string;
  order_id: string | null;
  client_id: string | null;
  vendor_id: string;
  received_by: string;
  received_date: string;
  status: 'Draft' | 'Pending Inspection' | 'Partially Received' | 'Received' | 'Rejected' | 'Cancelled';
  inspection_notes: string | null;
  remarks: string | null;
  attachments: unknown[];
  goods_receipt_items?: DbGoodsReceiptItemRow[] | null;
  goods_receipt_status_history?: Array<{
    id: string;
    previous_status: string | null;
    new_status: string;
    note_text: string;
    actor_name: string;
    created_at: string;
  }> | null;
}

function assertSupabaseFrom() {
  if (typeof (supabase as { from?: unknown })?.from !== 'function') {
    throw new Error('Supabase client is not initialized.');
  }
}

export async function loadGoodsReceiptsFromSupabase(
  poNumber?: string,
): Promise<DbGoodsReceiptRow[]> {
  assertSupabaseFrom();
  let query = supabase
    .from('goods_receipts')
    .select('*,goods_receipt_items(*),goods_receipt_status_history(*)')
    .order('created_at', { ascending: false });

  if (poNumber) {
    query = query.eq('po_number', poNumber);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || 'Unable to load goods receipts from Supabase.');
  }
  return Array.isArray(data) ? (data as DbGoodsReceiptRow[]) : [];
}

export async function processGoodsReceiptInSupabase(params: {
  poNumber: string;
  receivedBy: string;
  items: GoodsReceiptItemInput[];
  idempotencyKey?: string;
  allowExcess?: boolean;
  inspectionNotes?: string;
  remarks?: string;
  attachments?: unknown[];
}): Promise<DbGoodsReceiptRow> {
  if (typeof (supabase as { rpc?: unknown })?.rpc !== 'function') {
    throw new Error('Supabase client is not initialized.');
  }
  const { data, error } = await supabase.rpc('process_goods_receipt', {
    p_po_number: params.poNumber,
    p_received_by: params.receivedBy,
    p_items: params.items,
    p_idempotency_key: params.idempotencyKey ?? null,
    p_allow_excess: Boolean(params.allowExcess),
    p_inspection_notes: params.inspectionNotes ?? null,
    p_remarks: params.remarks ?? null,
    p_attachments: params.attachments ?? [],
  });
  if (error) {
    throw new Error(error.message || 'Unable to process goods receipt.');
  }
  return data as DbGoodsReceiptRow;
}
