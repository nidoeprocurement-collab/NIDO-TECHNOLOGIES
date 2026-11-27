import { supabase } from '@/lib/supabase';

export type DeliveryStatusValue =
  | 'Pending'
  | 'Processing'
  | 'Partially Shipped'
  | 'Shipped'
  | 'Partially Delivered'
  | 'Delivered'
  | 'Cancelled';

export interface DbDeliveryTrackingRow {
  id: string;
  shipment_reference: string;
  purchase_order_id: string;
  po_number: string;
  order_id: string | null;
  client_id: string | null;
  vendor_id: string;
  carrier: string | null;
  tracking_number: string | null;
  tracking_link: string | null;
  dispatch_date: string | null;
  expected_delivery_date: string | null;
  actual_delivery_date: string | null;
  delivery_status: DeliveryStatusValue;
  proof_of_delivery: string | null;
  received_by: string | null;
  delivery_notes: string | null;
  shipment_documents: unknown[];
  created_at: string;
  updated_at: string;
  delivery_tracking_events?: Array<{
    id: string;
    previous_status: string | null;
    new_status: string;
    event_note: string;
    location: string | null;
    actor_name: string;
    created_at: string;
  }> | null;
}

function assertSupabaseFrom() {
  if (typeof (supabase as { from?: unknown })?.from !== 'function') {
    throw new Error('Supabase client is not initialized.');
  }
}

export async function loadDeliveryTrackingFromSupabase(
  poNumber?: string,
): Promise<DbDeliveryTrackingRow[]> {
  assertSupabaseFrom();
  let query = supabase
    .from('delivery_tracking')
    .select('*,delivery_tracking_events(*)')
    .order('created_at', { ascending: false });

  if (poNumber) {
    query = query.eq('po_number', poNumber);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || 'Unable to load delivery tracking from Supabase.');
  }
  return Array.isArray(data) ? (data as DbDeliveryTrackingRow[]) : [];
}

export async function recordDeliveryTrackingUpdateInSupabase(params: {
  poNumber: string;
  deliveryStatus: DeliveryStatusValue;
  carrier?: string;
  trackingNumber?: string;
  trackingLink?: string;
  expectedDeliveryDate?: string;
  proofOfDelivery?: string;
  receivedBy?: string;
  deliveryNotes?: string;
  shipmentReference?: string;
}): Promise<DbDeliveryTrackingRow> {
  if (typeof (supabase as { rpc?: unknown })?.rpc !== 'function') {
    throw new Error('Supabase client is not initialized.');
  }
  const { data, error } = await supabase.rpc('record_delivery_tracking_update', {
    p_po_number: params.poNumber,
    p_delivery_status: params.deliveryStatus,
    p_carrier: params.carrier ?? null,
    p_tracking_number: params.trackingNumber ?? null,
    p_tracking_link: params.trackingLink ?? null,
    p_expected_delivery_date: params.expectedDeliveryDate ?? null,
    p_proof_of_delivery: params.proofOfDelivery ?? null,
    p_received_by: params.receivedBy ?? null,
    p_delivery_notes: params.deliveryNotes ?? null,
    p_shipment_reference: params.shipmentReference ?? null,
  });
  if (error) {
    throw new Error(error.message || 'Unable to record delivery tracking update.');
  }
  return data as DbDeliveryTrackingRow;
}
