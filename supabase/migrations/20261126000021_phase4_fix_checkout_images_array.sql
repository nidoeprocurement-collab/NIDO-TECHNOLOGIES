-- Phase 4.1 Hotfix: Fix text[] subscript in checkout_cart_to_order
-- master_catalogue_items.images is text[], so PostgreSQL requires v_item.images[1] instead of JSONB (v_item.images->>0).

CREATE OR REPLACE FUNCTION public.checkout_cart_to_order(
  p_idempotency_key text,
  p_client_id uuid DEFAULT NULL,
  p_ordered_for text DEFAULT NULL,
  p_payment_method text DEFAULT NULL,
  p_payment_detail text DEFAULT NULL,
  p_payment_terms text DEFAULT NULL,
  p_order_notes text DEFAULT NULL,
  p_delivery_address text DEFAULT NULL,
  p_delivery_details jsonb DEFAULT '{}'::jsonb,
  p_checkout_pricing_snapshot jsonb DEFAULT '{}'::jsonb,
  p_subtotal numeric DEFAULT 0,
  p_total_gst numeric DEFAULT 0,
  p_total_discount numeric DEFAULT 0,
  p_shipping_delivery_fee numeric DEFAULT 0,
  p_platform_fee numeric DEFAULT 0,
  p_total_amount numeric DEFAULT 0
)
RETURNS public.procurement_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_is_internal boolean := app.is_nido_internal();
  v_client_id uuid;
  v_client_name text;
  v_existing public.procurement_orders%ROWTYPE;
  v_order public.procurement_orders%ROWTYPE;
  v_order_number text;
  v_cart_count integer := 0;
  v_item RECORD;
  v_idx integer := 0;
  v_res_id uuid;
  v_requester_name text;
  v_requester_email text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF btrim(COALESCE(p_idempotency_key, '')) <> '' THEN
    SELECT * INTO v_existing
    FROM public.procurement_orders
    WHERE idempotency_key = p_idempotency_key;
    IF FOUND THEN
      RETURN v_existing;
    END IF;
  END IF;

  IF v_is_internal THEN
    v_client_id := COALESCE(p_client_id, app.current_client_id());
  ELSE
    v_client_id := app.current_client_id();
    IF p_client_id IS NOT NULL AND p_client_id <> v_client_id THEN
      RAISE EXCEPTION 'Forbidden client scope' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'Client organization could not be resolved' USING ERRCODE = '42501';
  END IF;

  SELECT name INTO v_client_name FROM public.client_organizations WHERE id = v_client_id;
  SELECT COALESCE(raw_user_meta_data->>'name', email, 'User'), email
  INTO v_requester_name, v_requester_email
  FROM auth.users WHERE id = v_uid;

  SELECT COUNT(*) INTO v_cart_count
  FROM public.cart_items
  WHERE user_id = v_uid AND client_id = v_client_id;

  IF v_cart_count = 0 THEN
    RAISE EXCEPTION 'Your cart is empty' USING ERRCODE = '22023';
  END IF;

  v_order_number := public.allocate_document_number('ORD', NULL);

  INSERT INTO public.procurement_orders (
    order_number, client_id, client_name, requester_user_id, requester_name, requester_email,
    ordered_for, order_date, order_time, status, approval_status, defer_purchase_orders,
    subtotal, total_gst, total_discount, shipping_delivery_fee, platform_fee,
    total_amount, initial_total_amount, total_amount_display,
    payment_method, payment_detail, payment_terms, order_notes,
    delivery_address, delivery_details, checkout_pricing_snapshot,
    idempotency_key, created_by, created_by_name, updated_by, updated_by_name
  ) VALUES (
    v_order_number, v_client_id, COALESCE(v_client_name, 'Client'), v_uid, COALESCE(v_requester_name, 'User'), v_requester_email,
    p_ordered_for, to_char(now(), 'Mon DD, YYYY'), to_char(now(), 'HH12:MI AM'), 'Processing', 'Not Required', false,
    COALESCE(p_subtotal, 0), COALESCE(p_total_gst, 0), COALESCE(p_total_discount, 0),
    COALESCE(p_shipping_delivery_fee, 0), COALESCE(p_platform_fee, 0),
    COALESCE(p_total_amount, 0), COALESCE(p_total_amount, 0),
    '₹' || to_char(COALESCE(p_total_amount, 0), 'FM999,999,990.00'),
    p_payment_method, p_payment_detail, p_payment_terms, p_order_notes,
    p_delivery_address, COALESCE(p_delivery_details, '{}'::jsonb), COALESCE(p_checkout_pricing_snapshot, '{}'::jsonb),
    NULLIF(btrim(COALESCE(p_idempotency_key, '')), ''), v_uid, v_requester_name, v_uid, v_requester_name
  )
  RETURNING * INTO v_order;

  FOR v_item IN
    SELECT ci.*, mci.master_product_code, mci.sku_code, mci.product_name, mci.category, mci.product_type, mci.physical_type, mci.images, v.name AS vendor_name
    FROM public.cart_items ci
    JOIN public.master_catalogue_items mci ON mci.id = ci.master_catalogue_item_id
    LEFT JOIN public.vendors v ON v.id = ci.vendor_id
    WHERE ci.user_id = v_uid AND ci.client_id = v_client_id
    ORDER BY ci.created_at ASC
    FOR UPDATE OF ci
  LOOP
    v_idx := v_idx + 1;
    SELECT id INTO v_res_id
    FROM public.stock_reservations
    WHERE cart_item_id = v_item.id AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;

    -- Transition reservation to 'ordered' and bind to order_id (do NOT deduct physical_stock or release reserved_stock)
    UPDATE public.stock_reservations
    SET status = 'ordered',
        order_id = v_order.id,
        cart_item_id = NULL,
        updated_at = now()
    WHERE cart_item_id = v_item.id AND status = 'active';

    INSERT INTO public.procurement_order_items (
      order_id, sub_order_id, client_id, master_catalogue_item_id, vendor_id, vendor_product_id,
      product_code, sku_code, product_name, category, product_type, physical_type, fulfillment_type,
      image, quantity, moq, unit_price, vendor_price, client_selling_price_excl_gst, landed_cost,
      checkout_unit_price_inclusive, checkout_unit_price_excl_gst, gst_rate, line_total, hsn_snapshot,
      selected_vendor_name, vendor_rating, lead_time, configuration, configuration_price_adjustment,
      stock_reservation_id, vendor_allocations, item_status, metadata
    ) VALUES (
      v_order.id,
      'SO-' || v_order.order_number || '-' || lpad(v_idx::text, 3, '0'),
      v_client_id, v_item.master_catalogue_item_id, v_item.vendor_id, v_item.vendor_product_id,
      COALESCE(v_item.master_product_code, v_item.master_catalogue_item_id::text),
      v_item.sku_code,
      COALESCE(v_item.metadata->>'name', v_item.product_name),
      COALESCE(v_item.metadata->>'category', v_item.category),
      COALESCE(v_item.metadata->>'productType', v_item.product_type),
      COALESCE(v_item.metadata->>'physicalType', v_item.physical_type),
      v_item.fulfillment_type,
      COALESCE(v_item.metadata->>'image', v_item.images[1], ''),
      v_item.quantity, COALESCE(v_item.moq, 1),
      COALESCE(v_item.unit_price_inclusive, 0), COALESCE(v_item.vendor_price, 0),
      COALESCE(v_item.client_selling_price_excl_gst, 0), COALESCE(v_item.landed_cost, 0),
      COALESCE(v_item.unit_price_inclusive, 0), COALESCE(v_item.client_selling_price_excl_gst, 0),
      v_item.gst_snapshot,
      COALESCE(v_item.unit_price_inclusive, 0) * v_item.quantity,
      v_item.hsn_snapshot,
      COALESCE(v_item.metadata->>'selectedVendorName', v_item.vendor_name),
      v_item.vendor_rating, v_item.lead_time,
      COALESCE(v_item.configuration, '{}'::jsonb), COALESCE(v_item.configuration_price_adjustment, 0),
      v_res_id,
      CASE WHEN v_item.vendor_id IS NOT NULL THEN jsonb_build_array(jsonb_build_object(
        'vendorId', v_item.vendor_id,
        'vendorProductId', COALESCE(v_item.vendor_product_id::text, ''),
        'vendorName', COALESCE(v_item.metadata->>'selectedVendorName', v_item.vendor_name, ''),
        'allocated', v_item.quantity
      )) ELSE '[]'::jsonb END,
      'Processing',
      COALESCE(v_item.metadata, '{}'::jsonb)
    );
  END LOOP;

  DELETE FROM public.cart_items WHERE user_id = v_uid AND client_id = v_client_id;

  INSERT INTO public.order_status_history (
    order_id, client_id, event_id, event_type, new_status, note_text, actor_user_id, actor_name
  ) VALUES (
    v_order.id, v_client_id, 'activity_order_placed_' || v_order.order_number, 'activity',
    'Processing', 'Order ' || v_order.order_number || ' was placed.', v_uid, COALESCE(v_requester_name, 'User')
  );

  RETURN v_order;
END;
$$;

REVOKE ALL ON FUNCTION public.checkout_cart_to_order(text, uuid, text, text, text, text, text, text, jsonb, jsonb, numeric, numeric, numeric, numeric, numeric, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.checkout_cart_to_order(text, uuid, text, text, text, text, text, text, jsonb, jsonb, numeric, numeric, numeric, numeric, numeric, numeric) TO authenticated;

