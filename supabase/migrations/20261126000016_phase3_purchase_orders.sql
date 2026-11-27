-- ============================================================================
-- NIDO Phase 3 – Wave 2.2: Purchase Orders & Vendor Procurement + Stock RPCs
-- ============================================================================

INSERT INTO public.document_sequences (
  seq_key, prefix, next_value, pad_length, include_year, year_separator, description
)
VALUES (
  'PO', 'PO-', 1001, 4, false, '-', 'Purchase Order number (PO-NNNN)'
)
ON CONFLICT (seq_key) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 1. Purchase Orders, Line Items, Status History & Documents
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number text NOT NULL UNIQUE,
  order_id uuid NULL REFERENCES public.procurement_orders(id) ON DELETE RESTRICT,
  order_number text NOT NULL,
  client_id uuid NULL REFERENCES public.client_organizations(id) ON DELETE RESTRICT,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  vendor_name text NOT NULL,
  vendor_contact text NULL,
  vendor_email text NULL,
  vendor_phone text NULL,
  vendor_gstin text NULL,
  vendor_address text NULL,
  vendor_address_line1 text NULL,
  vendor_address_line2 text NULL,
  vendor_city text NULL,
  vendor_state text NULL,
  vendor_pincode text NULL,
  sub_order_id text NOT NULL DEFAULT '',
  sub_order_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  primary_item text NULL,
  primary_sku text NULL,
  category text NULL,
  hsn_code text NULL,
  specs jsonb NOT NULL DEFAULT '[]'::jsonb,
  reference_number text NULL,
  serial_number text NULL,
  qty integer NOT NULL DEFAULT 0,
  unit_price numeric(12, 2) NOT NULL DEFAULT 0,
  subtotal numeric(12, 2) NOT NULL DEFAULT 0,
  sgst_pct numeric(5, 2) NOT NULL DEFAULT 0,
  cgst_pct numeric(5, 2) NOT NULL DEFAULT 0,
  sgst_amt numeric(12, 2) NOT NULL DEFAULT 0,
  cgst_amt numeric(12, 2) NOT NULL DEFAULT 0,
  grand_total numeric(12, 2) NOT NULL DEFAULT 0,
  payment_terms text NOT NULL DEFAULT 'Net 30',
  status text NOT NULL DEFAULT 'Draft' CHECK (
    status IN ('Draft', 'Confirmed', 'Partially Shipped', 'Vendor Notified', 'Accepted', 'Dispatched', 'Delivered', 'Completed', 'Cancelled')
  ),
  stock_consumed boolean NOT NULL DEFAULT false,
  stock_consumed_at timestamptz NULL,
  created_on text NOT NULL,
  created_on_display text NOT NULL,
  requested_delivery text NULL,
  cancel_reason text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_number ON public.purchase_orders (order_number);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor_id ON public.purchase_orders (vendor_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders (status);

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  order_item_id uuid NULL REFERENCES public.procurement_order_items(id) ON DELETE SET NULL,
  sub_order_id text NOT NULL,
  master_catalogue_item_id uuid NULL REFERENCES public.master_catalogue_items(id) ON DELETE RESTRICT,
  vendor_product_id uuid NULL REFERENCES public.vendor_products(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  sku text NULL,
  product_code text NULL,
  category text NULL,
  hsn_code text NULL,
  specs jsonb NOT NULL DEFAULT '[]'::jsonb,
  reference_number text NULL,
  serial_number text NULL,
  qty integer NOT NULL CHECK (qty >= 1),
  unit_price numeric(12, 2) NOT NULL DEFAULT 0,
  line_subtotal numeric(12, 2) NOT NULL DEFAULT 0,
  gst_pct numeric(5, 2) NOT NULL DEFAULT 18,
  product_type text NULL,
  commercial_terms jsonb NOT NULL DEFAULT '{}'::jsonb,
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  configuration_price_adjustment numeric(12, 2) NOT NULL DEFAULT 0,
  item_status text NOT NULL DEFAULT 'Pending',
  cancel_reason text NULL,
  cancel_source text NULL,
  provisioning_details jsonb NULL,
  tracking jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_po_item_sub_order UNIQUE (purchase_order_id, sub_order_id)
);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po_id ON public.purchase_order_items (purchase_order_id);

CREATE TABLE IF NOT EXISTS public.purchase_order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  event_id text NULL UNIQUE,
  kind text NOT NULL DEFAULT 'activity',
  previous_status text NULL,
  new_status text NULL,
  note_text text NOT NULL,
  visibility text NOT NULL DEFAULT 'Internal Note',
  actor_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name text NOT NULL,
  initials text NULL,
  color text NULL,
  display_date text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.purchase_order_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  doc_key text NOT NULL,
  name text NOT NULL,
  ext text NOT NULL,
  doc_type text NOT NULL,
  uploaded_by text NOT NULL,
  uploaded_on text NOT NULL,
  data_url text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 2. Row-Level Security (Default-Deny, Internal NIDO RBAC Only)
-- ----------------------------------------------------------------------------
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_documents ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.purchase_orders FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.purchase_order_items FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.purchase_order_status_history FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.purchase_order_documents FROM PUBLIC, anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.purchase_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.purchase_order_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.purchase_order_status_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.purchase_order_documents TO authenticated;

DROP POLICY IF EXISTS purchase_orders_select ON public.purchase_orders;
CREATE POLICY purchase_orders_select ON public.purchase_orders
  FOR SELECT TO authenticated
  USING (
    app.is_nido_internal()
    AND (
      app.has_nido_permission('purchase_orders', 'view')
      OR app.has_nido_permission('orders', 'view')
      OR app.has_nido_permission('vendors', 'view')
    )
  );

DROP POLICY IF EXISTS purchase_orders_insert ON public.purchase_orders;
CREATE POLICY purchase_orders_insert ON public.purchase_orders
  FOR INSERT TO authenticated
  WITH CHECK (
    app.is_nido_internal()
    AND (
      app.has_nido_permission('purchase_orders', 'create')
      OR app.has_nido_permission('orders', 'edit')
    )
  );

DROP POLICY IF EXISTS purchase_orders_update ON public.purchase_orders;
CREATE POLICY purchase_orders_update ON public.purchase_orders
  FOR UPDATE TO authenticated
  USING (
    app.is_nido_internal()
    AND (
      app.has_nido_permission('purchase_orders', 'edit')
      OR app.has_nido_permission('orders', 'edit')
    )
  )
  WITH CHECK (
    app.is_nido_internal()
    AND (
      app.has_nido_permission('purchase_orders', 'edit')
      OR app.has_nido_permission('orders', 'edit')
    )
  );

DROP POLICY IF EXISTS purchase_orders_delete ON public.purchase_orders;
CREATE POLICY purchase_orders_delete ON public.purchase_orders
  FOR DELETE TO authenticated
  USING (
    app.is_nido_internal()
    AND status = 'Draft'
    AND (
      app.has_nido_permission('purchase_orders', 'delete')
      OR app.has_nido_permission('orders', 'edit')
    )
  );

DROP POLICY IF EXISTS purchase_order_items_rw ON public.purchase_order_items;
CREATE POLICY purchase_order_items_rw ON public.purchase_order_items
  FOR ALL TO authenticated
  USING (app.is_nido_internal())
  WITH CHECK (app.is_nido_internal());

DROP POLICY IF EXISTS purchase_order_status_history_rw ON public.purchase_order_status_history;
CREATE POLICY purchase_order_status_history_rw ON public.purchase_order_status_history
  FOR ALL TO authenticated
  USING (app.is_nido_internal())
  WITH CHECK (app.is_nido_internal());

DROP POLICY IF EXISTS purchase_order_documents_rw ON public.purchase_order_documents;
CREATE POLICY purchase_order_documents_rw ON public.purchase_order_documents
  FOR ALL TO authenticated
  USING (app.is_nido_internal())
  WITH CHECK (app.is_nido_internal());

-- ----------------------------------------------------------------------------
-- 3. Atomic PO Creation, Raise & Stock Transition RPCs
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_draft_purchase_orders_for_order(
  p_order_number text,
  p_payment_terms text DEFAULT 'Net 30'
)
RETURNS SETOF public.purchase_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_order public.procurement_orders%ROWTYPE;
  v_vendor RECORD;
  v_po public.purchase_orders%ROWTYPE;
  v_po_number text;
  v_subtotal numeric(12, 2);
  v_sgst numeric(12, 2);
  v_grand numeric(12, 2);
  v_first_item public.procurement_order_items%ROWTYPE;
  v_sub_ids jsonb;
  v_item RECORD;
  v_now_iso text := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');
  v_disp text := to_char(now(), 'DD/MM/YYYY');
BEGIN
  IF v_uid IS NULL OR NOT app.is_nido_internal() THEN
    RAISE EXCEPTION 'Forbidden: internal NIDO authorization required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_order
  FROM public.procurement_orders
  WHERE order_number = p_order_number
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Procurement order % not found', p_order_number USING ERRCODE = '23503';
  END IF;

  IF v_order.status IN ('Cancelled', 'Draft') THEN
    RETURN;
  END IF;

  FOR v_vendor IN
    SELECT DISTINCT v.*
    FROM public.procurement_order_items poi
    JOIN public.vendors v ON v.id = poi.vendor_id
    WHERE poi.order_id = v_order.id
      AND poi.vendor_id IS NOT NULL
      AND v.archived = false
      AND NOT EXISTS (
        SELECT 1
        FROM public.purchase_orders po
        JOIN public.purchase_order_items poitem ON poitem.purchase_order_id = po.id
        WHERE po.order_number = v_order.order_number
          AND po.status <> 'Cancelled'
          AND poitem.sub_order_id = poi.sub_order_id
      )
  LOOP
    v_po_number := public.allocate_document_number('PO', NULL);

    SELECT * INTO v_first_item
    FROM public.procurement_order_items
    WHERE order_id = v_order.id AND vendor_id = v_vendor.id
    ORDER BY sub_order_id ASC
    LIMIT 1;

    SELECT
      COALESCE(SUM(COALESCE(NULLIF(landed_cost, 0), NULLIF(vendor_price, 0), unit_price) * quantity), 0),
      COALESCE(ROUND(SUM(COALESCE(NULLIF(landed_cost, 0), NULLIF(vendor_price, 0), unit_price) * quantity * (COALESCE(gst_rate, 18) / 2.0) / 100.0), 2), 0),
      COALESCE(jsonb_agg(sub_order_id ORDER BY sub_order_id), '[]'::jsonb)
    INTO v_subtotal, v_sgst, v_sub_ids
    FROM public.procurement_order_items poi
    WHERE poi.order_id = v_order.id
      AND poi.vendor_id = v_vendor.id
      AND NOT EXISTS (
        SELECT 1
        FROM public.purchase_orders po
        JOIN public.purchase_order_items poitem ON poitem.purchase_order_id = po.id
        WHERE po.order_number = v_order.order_number
          AND po.status <> 'Cancelled'
          AND poitem.sub_order_id = poi.sub_order_id
      );

    v_grand := v_subtotal + v_sgst + v_sgst;

    INSERT INTO public.purchase_orders (
      po_number, order_id, order_number, client_id, vendor_id,
      vendor_name, vendor_contact, vendor_email, vendor_phone, vendor_gstin,
      vendor_address, vendor_address_line1, vendor_address_line2, vendor_city, vendor_state, vendor_pincode,
      sub_order_id, sub_order_ids, primary_item, primary_sku, category, hsn_code, specs,
      qty, unit_price, subtotal, sgst_pct, cgst_pct, sgst_amt, cgst_amt, grand_total,
      payment_terms, status, stock_consumed, created_on, created_on_display, created_by, updated_by
    ) VALUES (
      v_po_number, v_order.id, v_order.order_number, v_order.client_id, v_vendor.id,
      v_vendor.name, v_vendor.primary_contact, v_vendor.email, v_vendor.phone, v_vendor.tax_id,
      v_vendor.address, v_vendor.address_line1, v_vendor.address_line2, v_vendor.city, v_vendor.state, v_vendor.zip_code,
      v_first_item.sub_order_id, v_sub_ids, v_first_item.product_name, v_first_item.product_code,
      v_first_item.category, v_first_item.hsn_snapshot, COALESCE(v_first_item.specs, '[]'::jsonb),
      v_first_item.quantity, COALESCE(NULLIF(v_first_item.landed_cost, 0), NULLIF(v_first_item.vendor_price, 0), v_first_item.unit_price),
      v_subtotal, COALESCE(v_first_item.gst_rate, 18) / 2.0, COALESCE(v_first_item.gst_rate, 18) / 2.0,
      v_sgst, v_sgst, v_grand,
      COALESCE(NULLIF(btrim(p_payment_terms), ''), 'Net 30'), 'Draft', false, v_now_iso, v_disp, v_uid, v_uid
    )
    RETURNING * INTO v_po;

    FOR v_item IN
      SELECT poi.*
      FROM public.procurement_order_items poi
      WHERE poi.order_id = v_order.id
        AND poi.vendor_id = v_vendor.id
        AND NOT EXISTS (
          SELECT 1
          FROM public.purchase_orders po
          JOIN public.purchase_order_items poitem ON poitem.purchase_order_id = po.id
          WHERE po.order_number = v_order.order_number
            AND po.status <> 'Cancelled'
            AND poitem.sub_order_id = poi.sub_order_id
        )
    LOOP
      INSERT INTO public.purchase_order_items (
        purchase_order_id, order_item_id, sub_order_id, master_catalogue_item_id, vendor_product_id,
        item_name, sku, product_code, category, hsn_code, specs,
        qty, unit_price, line_subtotal, gst_pct, product_type, commercial_terms, configuration, configuration_price_adjustment
      ) VALUES (
        v_po.id, v_item.id, v_item.sub_order_id, v_item.master_catalogue_item_id, v_item.vendor_product_id,
        v_item.product_name, v_item.sku_code, v_item.product_code, v_item.category, v_item.hsn_snapshot, COALESCE(v_item.specs, '[]'::jsonb),
        v_item.quantity,
        COALESCE(NULLIF(v_item.landed_cost, 0), NULLIF(v_item.vendor_price, 0), v_item.unit_price),
        COALESCE(NULLIF(v_item.landed_cost, 0), NULLIF(v_item.vendor_price, 0), v_item.unit_price) * v_item.quantity,
        COALESCE(v_item.gst_rate, 18), v_item.product_type, COALESCE(v_item.commercial_terms, '{}'::jsonb),
        COALESCE(v_item.configuration, '{}'::jsonb), COALESCE(v_item.configuration_price_adjustment, 0)
      );
    END LOOP;

    INSERT INTO public.purchase_order_status_history (
      purchase_order_id, event_id, kind, new_status, note_text, actor_user_id, actor_name, initials, display_date
    ) VALUES (
      v_po.id, 'po_created_' || v_po.po_number, 'activity', 'Draft',
      'Draft PO ' || v_po.po_number || ' created for order ' || v_order.order_number || '.',
      v_uid, 'System', 'SY', v_disp
    );

    RETURN NEXT v_po;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.raise_purchase_order_and_consume_stock(
  p_po_number text
)
RETURNS public.purchase_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_po public.purchase_orders%ROWTYPE;
  v_updated public.purchase_orders%ROWTYPE;
  v_item RECORD;
  v_vp public.vendor_products%ROWTYPE;
  v_is_digital boolean;
BEGIN
  IF v_uid IS NULL OR NOT app.is_nido_internal() THEN
    RAISE EXCEPTION 'Forbidden: internal NIDO authorization required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_po
  FROM public.purchase_orders
  WHERE po_number = p_po_number
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase Order % not found', p_po_number USING ERRCODE = '23503';
  END IF;

  IF v_po.status = 'Cancelled' THEN
    RAISE EXCEPTION 'Cannot raise a cancelled Purchase Order' USING ERRCODE = '22023';
  END IF;

  -- Idempotency: never deduct stock twice if already consumed
  IF v_po.stock_consumed THEN
    IF v_po.status = 'Draft' THEN
      UPDATE public.purchase_orders
      SET status = 'Confirmed', updated_by = v_uid, updated_at = now()
      WHERE id = v_po.id
      RETURNING * INTO v_updated;
      RETURN v_updated;
    END IF;
    RETURN v_po;
  END IF;

  FOR v_item IN
    SELECT * FROM public.purchase_order_items
    WHERE purchase_order_id = v_po.id AND lower(COALESCE(item_status, '')) <> 'cancelled'
  LOOP
    v_is_digital := lower(COALESCE(v_item.product_type, '')) LIKE '%digital%'
      OR lower(COALESCE(v_item.product_type, '')) LIKE '%license%'
      OR lower(COALESCE(v_item.product_type, '')) LIKE '%subscription%'
      OR lower(COALESCE(v_item.product_type, '')) LIKE '%cloud%';

    IF NOT v_is_digital AND v_item.master_catalogue_item_id IS NOT NULL THEN
      SELECT * INTO v_vp
      FROM public.vendor_products
      WHERE vendor_id = v_po.vendor_id
        AND master_catalogue_item_id = v_item.master_catalogue_item_id
        AND status = 'Active'
      FOR UPDATE;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Vendor does not supply product %', v_item.item_name USING ERRCODE = '23503';
      END IF;

      IF v_item.qty < GREATEST(1, COALESCE(v_vp.moq, 1)) THEN
        RAISE EXCEPTION 'Quantity (%) for % is below vendor MOQ (%)', v_item.qty, v_item.item_name, GREATEST(1, COALESCE(v_vp.moq, 1)) USING ERRCODE = '22023';
      END IF;

      IF COALESCE(v_vp.physical_stock, 0) < v_item.qty THEN
        RAISE EXCEPTION 'Insufficient physical stock for % (% available, % required)', v_item.item_name, COALESCE(v_vp.physical_stock, 0), v_item.qty USING ERRCODE = '22023';
      END IF;

      UPDATE public.vendor_products
      SET physical_stock = GREATEST(0, COALESCE(physical_stock, 0) - v_item.qty),
          reserved_stock = GREATEST(0, COALESCE(reserved_stock, 0) - v_item.qty),
          last_stock_update = now()
      WHERE id = v_vp.id;

      IF v_po.order_id IS NOT NULL THEN
        UPDATE public.stock_reservations
        SET status = 'consumed', updated_at = now()
        WHERE order_id = v_po.order_id
          AND vendor_product_id = v_vp.id
          AND status IN ('ordered', 'active');
      END IF;
    END IF;
  END LOOP;

  UPDATE public.purchase_orders
  SET status = CASE WHEN status = 'Draft' THEN 'Confirmed' ELSE status END,
      stock_consumed = true,
      stock_consumed_at = now(),
      updated_by = v_uid,
      updated_at = now()
  WHERE id = v_po.id
  RETURNING * INTO v_updated;

  INSERT INTO public.purchase_order_status_history (
    purchase_order_id, event_id, kind, previous_status, new_status, note_text, actor_user_id, actor_name, initials
  ) VALUES (
    v_po.id, 'po_raised_' || v_po.po_number, 'status-change', v_po.status, v_updated.status,
    'Purchase Order ' || v_po.po_number || ' raised and stock transitioned.',
    v_uid, 'System', 'SY'
  ) ON CONFLICT (event_id) DO NOTHING;

  RETURN v_updated;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_purchase_order_and_release(
  p_po_number text,
  p_cancel_reason text DEFAULT NULL
)
RETURNS public.purchase_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_po public.purchase_orders%ROWTYPE;
  v_updated public.purchase_orders%ROWTYPE;
  v_item RECORD;
BEGIN
  IF v_uid IS NULL OR NOT app.is_nido_internal() THEN
    RAISE EXCEPTION 'Forbidden: internal NIDO authorization required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_po
  FROM public.purchase_orders
  WHERE po_number = p_po_number
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase Order % not found', p_po_number USING ERRCODE = '23503';
  END IF;

  IF v_po.status IN ('Cancelled', 'Delivered') THEN
    RETURN v_po;
  END IF;

  -- Only release reservations if physical stock was NOT yet consumed (Draft PO)
  IF NOT v_po.stock_consumed AND v_po.order_id IS NOT NULL THEN
    FOR v_item IN
      SELECT * FROM public.purchase_order_items WHERE purchase_order_id = v_po.id
    LOOP
      IF v_item.master_catalogue_item_id IS NOT NULL THEN
        UPDATE public.vendor_products
        SET reserved_stock = GREATEST(0, COALESCE(reserved_stock, 0) - v_item.qty),
            last_stock_update = now()
        WHERE vendor_id = v_po.vendor_id
          AND master_catalogue_item_id = v_item.master_catalogue_item_id;

        UPDATE public.stock_reservations
        SET status = 'released', updated_at = now()
        WHERE order_id = v_po.order_id
          AND vendor_id = v_po.vendor_id
          AND master_catalogue_item_id = v_item.master_catalogue_item_id
          AND status IN ('ordered', 'active');
      END IF;
    END LOOP;
  END IF;

  UPDATE public.purchase_orders
  SET status = 'Cancelled',
      cancel_reason = COALESCE(p_cancel_reason, cancel_reason),
      updated_by = v_uid,
      updated_at = now()
  WHERE id = v_po.id
  RETURNING * INTO v_updated;

  INSERT INTO public.purchase_order_status_history (
    purchase_order_id, kind, previous_status, new_status, note_text, actor_user_id, actor_name, initials
  ) VALUES (
    v_po.id, 'status-change', v_po.status, 'Cancelled',
    'Purchase Order ' || v_po.po_number || ' cancelled.' || COALESCE(' Reason: ' || p_cancel_reason, ''),
    v_uid, 'System', 'SY'
  );

  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.create_draft_purchase_orders_for_order(text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.raise_purchase_order_and_consume_stock(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cancel_purchase_order_and_release(text, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_draft_purchase_orders_for_order(text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.raise_purchase_order_and_consume_stock(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cancel_purchase_order_and_release(text, text) TO authenticated, service_role;
