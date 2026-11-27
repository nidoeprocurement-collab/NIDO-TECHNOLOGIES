import { supabase } from '@/lib/supabase';
import { isSupabaseUuid } from '@/lib/nidoRolesApi';
import { getCatalogProducts } from '@/lib/catalogStore';
import {
  getAllPOs,
  type PODocument,
  type POLineItem,
  type PONote,
  type POStatus,
  type StoredPO,
} from '@/lib/purchaseOrderStore';

export interface DbPurchaseOrderItemRow {
  id: string;
  purchase_order_id: string;
  order_item_id: string | null;
  sub_order_id: string;
  master_catalogue_item_id: string | null;
  vendor_product_id: string | null;
  item_name: string;
  sku: string | null;
  product_code: string | null;
  category: string | null;
  hsn_code: string | null;
  specs: string[] | null;
  reference_number: string | null;
  serial_number: string | null;
  qty: number;
  unit_price: number | string;
  line_subtotal: number | string;
  gst_pct: number | string;
  product_type: string | null;
  commercial_terms: POLineItem['commercialTerms'] | null;
  configuration: Record<string, string> | null;
  configuration_price_adjustment: number | string;
  item_status: string;
  cancel_reason: string | null;
  cancel_source: 'vendor-po' | 'order-details' | null;
  provisioning_details: POLineItem['provisioningDetails'] | null;
  tracking: POLineItem['tracking'] | null;
}

export interface DbPurchaseOrderHistoryRow {
  id: string;
  purchase_order_id: string;
  event_id: string | null;
  kind: 'activity' | 'status-change';
  note_text: string;
  visibility: string;
  actor_name: string;
  initials: string | null;
  color: string | null;
  display_date: string | null;
  created_at: string;
}

export interface DbPurchaseOrderDocRow {
  id: string;
  purchase_order_id: string;
  doc_key: string;
  name: string;
  ext: string;
  doc_type: string;
  uploaded_by: string;
  uploaded_on: string;
  data_url: string | null;
}

export interface DbPurchaseOrderRow {
  id: string;
  po_number: string;
  order_id: string | null;
  order_number: string;
  client_id: string | null;
  vendor_id: string;
  vendor_name: string;
  vendor_contact: string | null;
  vendor_email: string | null;
  vendor_phone: string | null;
  vendor_gstin: string | null;
  vendor_address: string | null;
  vendor_address_line1: string | null;
  vendor_address_line2: string | null;
  vendor_city: string | null;
  vendor_state: string | null;
  vendor_pincode: string | null;
  sub_order_id: string;
  sub_order_ids: string[] | null;
  primary_item: string | null;
  primary_sku: string | null;
  category: string | null;
  hsn_code: string | null;
  specs: string[] | null;
  reference_number: string | null;
  serial_number: string | null;
  qty: number;
  unit_price: number | string;
  subtotal: number | string;
  sgst_pct: number | string;
  cgst_pct: number | string;
  sgst_amt: number | string;
  cgst_amt: number | string;
  grand_total: number | string;
  payment_terms: string;
  status: POStatus;
  stock_consumed: boolean;
  created_on: string;
  created_on_display: string;
  requested_delivery: string | null;
  cancel_reason: string | null;
  purchase_order_items?: DbPurchaseOrderItemRow[] | null;
  purchase_order_status_history?: DbPurchaseOrderHistoryRow[] | null;
  purchase_order_documents?: DbPurchaseOrderDocRow[] | null;
}

export type HydratedStoredPO = StoredPO & {
  dbPoId?: string;
  stockConsumed?: boolean;
};

const STORAGE_KEY = 'nido_all_purchase_orders';
const MIGRATED_KEY = 'nido_purchase_orders_supabase_migrated_v1';

function assertSupabaseFrom() {
  if (typeof (supabase as { from?: unknown })?.from !== 'function') {
    throw new Error('Supabase client is not initialized.');
  }
}

export function mapDbPurchaseOrderRow(row: DbPurchaseOrderRow): HydratedStoredPO {
  const items: POLineItem[] = (row.purchase_order_items || []).map((li) => ({
    subOrderId: li.sub_order_id,
    item: li.item_name,
    sku: li.sku || '',
    productCode: li.product_code || '',
    category: li.category || '',
    hsnCode: li.hsn_code || '',
    specs: Array.isArray(li.specs) ? li.specs : [],
    referenceNumber: li.reference_number || '',
    serialNumber: li.serial_number || undefined,
    qty: li.qty,
    unitPrice: Number(li.unit_price) || 0,
    lineSubtotal: Number(li.line_subtotal) || 0,
    gstPct: Number(li.gst_pct) || 18,
    productType: li.product_type || undefined,
    commercialTerms: li.commercial_terms || undefined,
    configuration: li.configuration || undefined,
    configurationPriceAdjustment: Number(li.configuration_price_adjustment) || 0,
    status: li.item_status || 'Pending',
    cancelReason: li.cancel_reason || undefined,
    cancelSource: li.cancel_source || undefined,
    provisioningDetails: li.provisioning_details || undefined,
    tracking: li.tracking || null,
  }));

  const notes: PONote[] = (row.purchase_order_status_history || []).map((n) => ({
    id: n.event_id || n.id,
    author: n.actor_name,
    initials: n.initials || n.actor_name.slice(0, 2).toUpperCase() || 'SY',
    color: n.color || (n.kind === 'status-change' ? '#d97706' : '#6b7280'),
    date: n.display_date || n.created_at,
    text: n.note_text,
    visibility: n.visibility || 'Internal Note',
    kind: n.kind,
  }));

  const documents: PODocument[] = (row.purchase_order_documents || []).map((d) => ({
    id: d.doc_key || d.id,
    name: d.name,
    ext: d.ext,
    type: d.doc_type,
    uploadedBy: d.uploaded_by,
    uploadedOn: d.uploaded_on,
    dataUrl: d.data_url || undefined,
  }));

  return {
    dbPoId: row.id,
    stockConsumed: Boolean(row.stock_consumed),
    poNumber: row.po_number,
    orderId: row.order_number,
    subOrderId: row.sub_order_id || items[0]?.subOrderId || '',
    subOrderIds: Array.isArray(row.sub_order_ids) ? row.sub_order_ids : items.map((i) => i.subOrderId),
    items,
    vendorId: row.vendor_id,
    vendorName: row.vendor_name,
    vendorContact: row.vendor_contact || '',
    vendorEmail: row.vendor_email || '',
    vendorPhone: row.vendor_phone || '',
    vendorGstin: row.vendor_gstin || '',
    vendorAddress: row.vendor_address || '',
    vendorAddressLine1: row.vendor_address_line1 || '',
    vendorAddressLine2: row.vendor_address_line2 || '',
    vendorCity: row.vendor_city || '',
    vendorState: row.vendor_state || '',
    vendorPincode: row.vendor_pincode || '',
    item: row.primary_item || items[0]?.item || '',
    sku: row.primary_sku || items[0]?.sku || '',
    category: row.category || items[0]?.category || '',
    hsnCode: row.hsn_code || items[0]?.hsnCode || '',
    specs: Array.isArray(row.specs) ? row.specs : [],
    referenceNumber: row.reference_number || '',
    serialNumber: row.serial_number || undefined,
    qty: row.qty,
    unitPrice: Number(row.unit_price) || 0,
    subtotal: Number(row.subtotal) || 0,
    sgstPct: Number(row.sgst_pct) || 0,
    cgstPct: Number(row.cgst_pct) || 0,
    sgstAmt: Number(row.sgst_amt) || 0,
    cgstAmt: Number(row.cgst_amt) || 0,
    grandTotal: Number(row.grand_total) || 0,
    paymentTerms: row.payment_terms || 'Net 30',
    status: row.status,
    createdOn: row.created_on,
    createdOnDisplay: row.created_on_display,
    requestedDelivery: row.requested_delivery || '',
    documents,
    notes,
    cancelReason: row.cancel_reason || undefined,
  };
}

export async function loadPurchaseOrdersFromSupabase(): Promise<HydratedStoredPO[]> {
  assertSupabaseFrom();
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*,purchase_order_items(*),purchase_order_status_history(*),purchase_order_documents(*)')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Unable to load purchase orders from Supabase.');
  }

  const mapped = (Array.isArray(data) ? (data as DbPurchaseOrderRow[]) : []).map(
    mapDbPurchaseOrderRow,
  );
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
    window.dispatchEvent(new CustomEvent('poCreated', { detail: { synced: true } }));
  }
  return mapped;
}

export async function createDraftPOsForOrderInSupabase(
  orderNumber: string,
  paymentTerms = 'Net 30',
): Promise<HydratedStoredPO[]> {
  if (typeof (supabase as { rpc?: unknown })?.rpc !== 'function') {
    throw new Error('Supabase client is not initialized.');
  }
  const { data, error } = await supabase.rpc('create_draft_purchase_orders_for_order', {
    p_order_number: orderNumber,
    p_payment_terms: paymentTerms,
  });
  if (error) {
    throw new Error(error.message || 'Unable to create draft purchase orders.');
  }
  const all = await loadPurchaseOrdersFromSupabase();
  const createdNumbers = new Set(
    (Array.isArray(data) ? (data as DbPurchaseOrderRow[]) : []).map((r) => r.po_number),
  );
  return all.filter((po) => createdNumbers.has(po.poNumber));
}

export async function raisePOAndConsumeStockInSupabase(
  poNumber: string,
): Promise<HydratedStoredPO> {
  if (typeof (supabase as { rpc?: unknown })?.rpc !== 'function') {
    throw new Error('Supabase client is not initialized.');
  }
  const { error } = await supabase.rpc('raise_purchase_order_and_consume_stock', {
    p_po_number: poNumber,
  });
  if (error) {
    throw new Error(error.message || 'Unable to raise Purchase Order and transition stock.');
  }
  const all = await loadPurchaseOrdersFromSupabase();
  const match = all.find((po) => po.poNumber === poNumber);
  if (!match) {
    throw new Error(`Purchase Order ${poNumber} could not be reloaded after raising.`);
  }
  return match;
}

export async function cancelPOInSupabase(
  poNumber: string,
  cancelReason?: string,
): Promise<void> {
  if (typeof (supabase as { rpc?: unknown })?.rpc !== 'function') {
    throw new Error('Supabase client is not initialized.');
  }
  const { error } = await supabase.rpc('cancel_purchase_order_and_release', {
    p_po_number: poNumber,
    p_cancel_reason: cancelReason ?? null,
  });
  if (error) {
    throw new Error(error.message || 'Unable to cancel Purchase Order.');
  }
  await loadPurchaseOrdersFromSupabase();
}

export async function savePOToSupabase(po: StoredPO): Promise<void> {
  assertSupabaseFrom();
  if (!isSupabaseUuid(po.vendorId)) return;

  let orderUuid: string | null = null;
  let clientUuid: string | null = null;
  if (po.orderId) {
    const { data: ord } = await supabase
      .from('procurement_orders')
      .select('id,client_id')
      .eq('order_number', po.orderId)
      .maybeSingle();
    if (ord) {
      orderUuid = (ord as { id: string }).id;
      clientUuid = (ord as { client_id: string }).client_id;
    }
  }

  const { data: savedPo, error: poErr } = await supabase
    .from('purchase_orders')
    .upsert(
      {
        po_number: po.poNumber,
        order_id: orderUuid,
        order_number: po.orderId,
        client_id: clientUuid,
        vendor_id: po.vendorId,
        vendor_name: po.vendorName,
        vendor_contact: po.vendorContact || null,
        vendor_email: po.vendorEmail || null,
        vendor_phone: po.vendorPhone || null,
        vendor_gstin: po.vendorGstin || null,
        vendor_address: po.vendorAddress || null,
        vendor_address_line1: po.vendorAddressLine1 || null,
        vendor_address_line2: po.vendorAddressLine2 || null,
        vendor_city: po.vendorCity || null,
        vendor_state: po.vendorState || null,
        vendor_pincode: po.vendorPincode || null,
        sub_order_id: po.subOrderId || '',
        sub_order_ids: po.subOrderIds || [],
        primary_item: po.item || null,
        primary_sku: po.sku || null,
        category: po.category || null,
        hsn_code: po.hsnCode || null,
        specs: po.specs || [],
        reference_number: po.referenceNumber || null,
        serial_number: po.serialNumber || null,
        qty: po.qty || 0,
        unit_price: po.unitPrice || 0,
        subtotal: po.subtotal || 0,
        sgst_pct: po.sgstPct || 0,
        cgst_pct: po.cgstPct || 0,
        sgst_amt: po.sgstAmt || 0,
        cgst_amt: po.cgstAmt || 0,
        grand_total: po.grandTotal || 0,
        payment_terms: po.paymentTerms || 'Net 30',
        status: po.status || 'Draft',
        created_on: po.createdOn,
        created_on_display: po.createdOnDisplay,
        requested_delivery: po.requestedDelivery || null,
        cancel_reason: po.cancelReason || null,
      },
      { onConflict: 'po_number' },
    )
    .select('id')
    .single();

  if (poErr || !savedPo) {
    throw new Error(poErr?.message || 'Unable to save Purchase Order.');
  }

  const poId = (savedPo as { id: string }).id;
  const catalog = getCatalogProducts();
  const byCode = new Map(
    catalog
      .filter((c) => isSupabaseUuid(c.id) && c.masterProductCode)
      .map((c) => [c.masterProductCode.trim().toLowerCase(), c.id]),
  );

  if (po.items?.length) {
    await supabase.from('purchase_order_items').upsert(
      po.items.map((li) => ({
        purchase_order_id: poId,
        sub_order_id: li.subOrderId,
        master_catalogue_item_id: li.productCode
          ? byCode.get(li.productCode.trim().toLowerCase()) ?? null
          : null,
        item_name: li.item,
        sku: li.sku || null,
        product_code: li.productCode || null,
        category: li.category || null,
        hsn_code: li.hsnCode || null,
        specs: li.specs || [],
        reference_number: li.referenceNumber || null,
        serial_number: li.serialNumber || null,
        qty: li.qty,
        unit_price: li.unitPrice,
        line_subtotal: li.lineSubtotal,
        gst_pct: li.gstPct ?? 18,
        product_type: li.productType || null,
        commercial_terms: li.commercialTerms || {},
        configuration: li.configuration || {},
        configuration_price_adjustment: li.configurationPriceAdjustment || 0,
        item_status: li.status || 'Pending',
        cancel_reason: li.cancelReason || null,
        cancel_source: li.cancelSource || null,
        provisioning_details: li.provisioningDetails || null,
        tracking: li.tracking || null,
      })),
      { onConflict: 'purchase_order_id,sub_order_id' },
    );
  }
}

export async function updatePOInSupabase(
  poNumber: string,
  changes: Partial<StoredPO>,
): Promise<void> {
  if (changes.status === 'Confirmed') {
    await raisePOAndConsumeStockInSupabase(poNumber);
  } else if (changes.status === 'Cancelled') {
    await cancelPOInSupabase(poNumber, changes.cancelReason);
    return;
  }

  const full = getAllPOs().find((p) => p.poNumber === poNumber);
  if (full) {
    await savePOToSupabase({ ...full, ...changes });
  }
}

export async function deleteDraftPOInSupabase(poNumber: string): Promise<void> {
  assertSupabaseFrom();
  const { error } = await supabase
    .from('purchase_orders')
    .delete()
    .eq('po_number', poNumber)
    .eq('status', 'Draft');
  if (error) {
    throw new Error(error.message || 'Unable to delete Draft Purchase Order.');
  }
}

export async function migrateLocalPOsToSupabaseIfNeeded(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(MIGRATED_KEY) === 'done') return;

  const localPOs = getAllPOs();
  for (const po of localPOs) {
    if (!isSupabaseUuid(po.vendorId)) continue;
    try {
      await savePOToSupabase(po);
    } catch {
      // Skip invalid/legacy records safely
    }
  }
  localStorage.setItem(MIGRATED_KEY, 'done');
}
