import { supabase } from '@/lib/supabase';
import { isSupabaseUuid } from '@/lib/nidoRolesApi';
import type { MyOrder, MyOrderStatus, OrderCartItem } from '@/contexts/MyOrdersContext';

export interface DbProcurementOrderItemRow {
  id: string;
  order_id: string;
  sub_order_id: string;
  client_id: string;
  master_catalogue_item_id: string | null;
  vendor_id: string | null;
  vendor_product_id: string | null;
  product_code: string;
  sku_code: string | null;
  product_name: string;
  category: string | null;
  product_type: string | null;
  physical_type: string | null;
  fulfillment_type: 'physical' | 'digital' | 'hybrid' | null;
  image: string | null;
  specs: string[] | null;
  quantity: number;
  moq: number;
  unit_price: number | string;
  vendor_price: number | string;
  client_selling_price_excl_gst: number | string;
  landed_cost: number | string;
  checkout_unit_price_inclusive: number | string;
  checkout_unit_price_excl_gst: number | string;
  gst_rate: number | string | null;
  discount_pct: number | string;
  hsn_snapshot: string | null;
  selected_vendor_name: string | null;
  vendor_rating: number | string | null;
  lead_time: string | null;
  configuration: Record<string, string> | null;
  configuration_price_adjustment: number | string;
  commercial_terms: Record<string, unknown> | null;
  stock_reservation_id: string | null;
  vendor_allocations: OrderCartItem['vendorAllocations'] | null;
  item_status: string;
  metadata: Record<string, unknown> | null;
}

export interface DbProcurementOrderRow {
  id: string;
  order_number: string;
  client_id: string;
  client_name: string;
  po_number: string | null;
  requester_user_id: string | null;
  requester_name: string;
  requester_email: string | null;
  requester_role: string | null;
  ordered_for: string | null;
  assigned_name: string;
  assigned_role: string | null;
  assigned_on: string | null;
  assignment_notes: string | null;
  assignment_completed: boolean;
  auto_assignment_status: 'pending' | 'assigned' | 'unassigned' | 'disabled' | null;
  order_date: string;
  order_time: string | null;
  status: MyOrderStatus;
  approval_status: string;
  defer_purchase_orders: boolean;
  total_amount: number | string;
  initial_total_amount: number | string;
  total_amount_display: string;
  payment_method: string | null;
  payment_detail: string | null;
  payment_terms: string | null;
  order_notes: string | null;
  delivery_address: string | null;
  delivery_details: MyOrder['deliveryDetails'] | null;
  checkout_pricing_snapshot: MyOrder['checkoutPricingSnapshot'] | null;
  cancel_reason: string | null;
  sla_time: string | null;
  sla_alert: boolean;
  created_by_name: string | null;
  updated_by_name: string | null;
  update_count: number;
  created_at: string;
  updated_at: string;
  procurement_order_items?: DbProcurementOrderItemRow[] | null;
}

export type HydratedMyOrder = MyOrder & {
  dbOrderId?: string;
  approvalStatus?: string;
};

function assertSupabaseFrom() {
  if (typeof (supabase as { from?: unknown })?.from !== 'function') {
    throw new Error('Supabase client is not initialized.');
  }
}

export function mapDbOrderRowToMyOrder(row: DbProcurementOrderRow): HydratedMyOrder {
  const items: OrderCartItem[] = (row.procurement_order_items || []).map((item, idx) => {
    const meta = (item.metadata && typeof item.metadata === 'object' ? item.metadata : {}) as Record<string, unknown>;
    return {
      id: typeof meta.legacyId === 'number' ? meta.legacyId : idx + 1,
      name: item.product_name,
      image: item.image || '',
      priceNum: Number(item.unit_price) || 0,
      quantity: item.quantity,
      category: item.category || '',
      specs: Array.isArray(item.specs) ? item.specs : [],
      moq: item.moq || 1,
      clientId: item.client_id,
      productCode: item.product_code,
      productType: item.product_type ?? undefined,
      physicalType: item.physical_type ?? undefined,
      fulfillmentType: item.fulfillment_type ?? undefined,
      commercialTerms: (item.commercial_terms as unknown as OrderCartItem['commercialTerms']) ?? undefined,
      vendorAllocations: Array.isArray(item.vendor_allocations) ? item.vendor_allocations : [],
      selectedVendorId: item.vendor_id ?? undefined,
      selectedVendorName: item.selected_vendor_name ?? undefined,
      vendorPrice: Number(item.vendor_price) || 0,
      clientSellingPriceExclGst: Number(item.client_selling_price_excl_gst) || 0,
      landedCost: Number(item.landed_cost) || 0,
      gstSnapshot: item.gst_rate !== null ? Number(item.gst_rate) : undefined,
      checkoutUnitPriceInclusive: Number(item.checkout_unit_price_inclusive) || 0,
      checkoutUnitPriceExclGst: Number(item.checkout_unit_price_excl_gst) || 0,
      checkoutGstRate: item.gst_rate !== null ? Number(item.gst_rate) : undefined,
      cartDiscountPct: Number(item.discount_pct) || 0,
      hsnSnapshot: item.hsn_snapshot ?? undefined,
      vendorRating: item.vendor_rating !== null ? Number(item.vendor_rating) : undefined,
      configuration: item.configuration ?? undefined,
      configurationPriceAdjustment: Number(item.configuration_price_adjustment) || 0,
      stockReservationId: item.stock_reservation_id ?? undefined,
      subOrderId: item.sub_order_id,
    };
  });

  const clientName = row.client_name || 'Client';
  const reqName = row.requester_name || 'User';
  const assignedName = row.assigned_name || 'Unassigned';

  return {
    id: row.order_number,
    dbOrderId: row.id,
    approvalStatus: row.approval_status,
    clientId: row.client_id,
    client: clientName,
    clientColor: '#2563eb',
    clientInitial: clientName.charAt(0).toUpperCase() || 'C',
    poNumber: row.po_number || '',
    requesterId: row.requester_user_id ?? undefined,
    requesterEmail: row.requester_email ?? undefined,
    requester: reqName,
    orderedFor: row.ordered_for ?? undefined,
    deferPurchaseOrders: Boolean(row.defer_purchase_orders),
    requesterRole: row.requester_role || '',
    requesterInitial: reqName.charAt(0).toUpperCase() || 'U',
    requesterColor: '#6b46c1',
    assigned: assignedName,
    assignedRole: row.assigned_role || '',
    assignedInitial: assignedName.charAt(0).toUpperCase() || 'U',
    assignedColor: '#276749',
    assignedOn: row.assigned_on ?? undefined,
    assignmentNotes: row.assignment_notes ?? undefined,
    assignmentCompleted: Boolean(row.assignment_completed),
    autoAssignmentStatus: row.auto_assignment_status ?? undefined,
    orderDate: row.order_date,
    orderTime: row.order_time || '',
    status: row.status,
    slaTime: row.sla_time,
    slaAlert: Boolean(row.sla_alert),
    totalAmount: row.total_amount_display || `₹${(Number(row.total_amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    totalAmountNum: Number(row.total_amount) || 0,
    initialTotalAmountNum: Number(row.initial_total_amount) || Number(row.total_amount) || 0,
    checkoutPricingSnapshot: row.checkout_pricing_snapshot ?? undefined,
    paymentMethod: row.payment_method ?? undefined,
    paymentDetail: row.payment_detail ?? undefined,
    paymentTerms: row.payment_terms ?? undefined,
    orderNotes: row.order_notes ?? undefined,
    deliveryAddress: row.delivery_address ?? undefined,
    deliveryDetails: row.delivery_details ?? undefined,
    cancelReason: row.cancel_reason ?? undefined,
    createdBy: row.created_by_name ?? reqName,
    createdAt: row.created_at,
    updatedBy: row.updated_by_name ?? reqName,
    updatedAt: row.updated_at,
    updateCount: row.update_count ?? 0,
    cartItems: items,
  };
}

export async function loadOrdersFromSupabase(clientId?: string): Promise<HydratedMyOrder[]> {
  assertSupabaseFrom();
  let query = supabase
    .from('procurement_orders')
    .select('*,procurement_order_items(*)')
    .order('created_at', { ascending: false });

  if (clientId && isSupabaseUuid(clientId)) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || 'Unable to load procurement orders from Supabase.');
  }

  return (Array.isArray(data) ? (data as DbProcurementOrderRow[]) : []).map(
    mapDbOrderRowToMyOrder,
  );
}

export async function checkoutCartToOrderInSupabase(params: {
  idempotencyKey: string;
  clientId?: string;
  orderedFor?: string;
  paymentMethod?: string;
  paymentDetail?: string;
  paymentTerms?: string;
  orderNotes?: string;
  deliveryAddress?: string;
  deliveryDetails?: Record<string, unknown>;
  checkoutPricingSnapshot?: Record<string, unknown>;
  subtotal: number;
  totalGst: number;
  totalDiscount: number;
  shippingDeliveryFee: number;
  platformFee: number;
  totalAmount: number;
}): Promise<HydratedMyOrder> {
  if (typeof (supabase as { rpc?: unknown })?.rpc !== 'function') {
    throw new Error('Supabase client is not initialized.');
  }

  const { data, error } = await supabase.rpc('checkout_cart_to_order', {
    p_idempotency_key: params.idempotencyKey,
    p_client_id: params.clientId && isSupabaseUuid(params.clientId) ? params.clientId : null,
    p_ordered_for: params.orderedFor ?? null,
    p_payment_method: params.paymentMethod ?? null,
    p_payment_detail: params.paymentDetail ?? null,
    p_payment_terms: params.paymentTerms ?? null,
    p_order_notes: params.orderNotes ?? null,
    p_delivery_address: params.deliveryAddress ?? null,
    p_delivery_details: params.deliveryDetails ?? {},
    p_checkout_pricing_snapshot: params.checkoutPricingSnapshot ?? {},
    p_subtotal: params.subtotal,
    p_total_gst: params.totalGst,
    p_total_discount: params.totalDiscount,
    p_shipping_delivery_fee: params.shippingDeliveryFee,
    p_platform_fee: params.platformFee,
    p_total_amount: params.totalAmount,
  });

  if (error) {
    throw new Error(error.message || 'Checkout failed while creating procurement order.');
  }

  const orderRow = data as DbProcurementOrderRow;
  // Fetch with line items so UI has the complete HydratedMyOrder immediately
  const { data: fullData } = await supabase
    .from('procurement_orders')
    .select('*,procurement_order_items(*)')
    .eq('id', orderRow.id)
    .maybeSingle();

  return mapDbOrderRowToMyOrder((fullData as DbProcurementOrderRow | null) || orderRow);
}

export async function updateOrderStatusInSupabase(
  orderNumberOrUuid: string,
  status: MyOrderStatus,
  cancelReason?: string,
  dbOrderId?: string,
): Promise<void> {
  assertSupabaseFrom();

  let targetUuid = dbOrderId && isSupabaseUuid(dbOrderId) ? dbOrderId : (isSupabaseUuid(orderNumberOrUuid) ? orderNumberOrUuid : undefined);
  if (!targetUuid) {
    const { data } = await supabase
      .from('procurement_orders')
      .select('id')
      .eq('order_number', orderNumberOrUuid)
      .maybeSingle();
    targetUuid = (data as { id?: string } | null)?.id;
  }
  if (!targetUuid) return;

  if (status === 'Cancelled') {
    const { error } = await supabase.rpc('cancel_procurement_order_and_release', {
      p_order_id: targetUuid,
      p_cancel_reason: cancelReason ?? null,
    });
    if (error) {
      throw new Error(error.message || 'Unable to cancel order and release stock reservations.');
    }
    return;
  }

  const { error } = await supabase
    .from('procurement_orders')
    .update({ status })
    .eq('id', targetUuid);
  if (error) {
    throw new Error(error.message || 'Unable to update order status.');
  }
}

export async function updateOrderApprovalMetaInSupabase(
  orderNumber: string,
  approvalStatus: string,
  deferPurchaseOrders: boolean,
): Promise<void> {
  assertSupabaseFrom();
  const { error } = await supabase
    .from('procurement_orders')
    .update({
      approval_status: approvalStatus,
      defer_purchase_orders: deferPurchaseOrders,
    })
    .eq('order_number', orderNumber);
  if (error) {
    throw new Error(error.message || 'Unable to update order approval status.');
  }
}
