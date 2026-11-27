-- ============================================================================
-- NIDO Phase 3 – Wave 2.3: Goods Receipt, Delivery Tracking & Stock Ledger
-- ============================================================================

INSERT INTO public.document_sequences (
  seq_key, prefix, next_value, pad_length, include_year, year_separator, description
)
VALUES
  ('GRN', 'GRN-', 1, 5, false, '-', 'Goods Receipt Note number (GRN-NNNNN)'),
  ('SHP', 'SHP-', 1, 5, false, '-', 'Shipment reference (SHP-NNNNN)')
ON CONFLICT (seq_key) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 1. Goods Receipts (GRN), Items & Status History
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.goods_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grn_number text NOT NULL UNIQUE,
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE RESTRICT,
  po_number text NOT NULL,
  order_id uuid NULL REFERENCES public.procurement_orders(id) ON DELETE RESTRICT,
  client_id uuid NULL REFERENCES public.client_organizations(id) ON DELETE RESTRICT,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  received_by text NOT NULL,
  received_date timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'Received' CHECK (
    status IN ('Draft', 'Pending Inspection', 'Partially Received', 'Received', 'Rejected', 'Cancelled')
  ),
  inspection_notes text NULL,
  remarks text NULL,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  idempotency_key text NULL UNIQUE,
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goods_receipts_po ON public.goods_receipts (purchase_order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_goods_receipts_client ON public.goods_receipts (client_id);

CREATE TABLE IF NOT EXISTS public.goods_receipt_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goods_receipt_id uuid NOT NULL REFERENCES public.goods_receipts(id) ON DELETE CASCADE,
  purchase_order_item_id uuid NOT NULL REFERENCES public.purchase_order_items(id) ON DELETE RESTRICT,
  sub_order_id text NOT NULL,
  master_catalogue_item_id uuid NULL REFERENCES public.master_catalogue_items(id) ON DELETE RESTRICT,
  product_code text NULL,
  sku text NULL,
  product_name text NOT NULL,
  ordered_qty integer NOT NULL CHECK (ordered_qty >= 1),
  previously_received_qty integer NOT NULL DEFAULT 0 CHECK (previously_received_qty >= 0),
  received_qty integer NOT NULL CHECK (received_qty >= 0),
  accepted_qty integer NOT NULL DEFAULT 0 CHECK (accepted_qty >= 0),
  rejected_qty integer NOT NULL DEFAULT 0 CHECK (rejected_qty >= 0),
  damaged_qty integer NOT NULL DEFAULT 0 CHECK (damaged_qty >= 0),
  shortage_qty integer NOT NULL DEFAULT 0 CHECK (shortage_qty >= 0),
  excess_qty integer NOT NULL DEFAULT 0 CHECK (excess_qty >= 0),
  batch_number text NULL,
  serial_number text NULL,
  expiry_date date NULL,
  inspection_notes text NULL,
  return_requested boolean NOT NULL DEFAULT false,
  return_reason text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_grn_qty_partition CHECK (accepted_qty + rejected_qty + damaged_qty <= received_qty)
);

CREATE INDEX IF NOT EXISTS idx_goods_receipt_items_grn ON public.goods_receipt_items (goods_receipt_id);
CREATE INDEX IF NOT EXISTS idx_goods_receipt_items_po_item ON public.goods_receipt_items (purchase_order_item_id);

CREATE TABLE IF NOT EXISTS public.goods_receipt_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goods_receipt_id uuid NOT NULL REFERENCES public.goods_receipts(id) ON DELETE CASCADE,
  previous_status text NULL,
  new_status text NOT NULL,
  note_text text NOT NULL,
  actor_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 2. Delivery Tracking & Events
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.delivery_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_reference text NOT NULL UNIQUE,
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  po_number text NOT NULL,
  order_id uuid NULL REFERENCES public.procurement_orders(id) ON DELETE RESTRICT,
  client_id uuid NULL REFERENCES public.client_organizations(id) ON DELETE RESTRICT,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  carrier text NULL,
  tracking_number text NULL,
  tracking_link text NULL,
  dispatch_date timestamptz NULL,
  expected_delivery_date date NULL,
  actual_delivery_date timestamptz NULL,
  delivery_status text NOT NULL DEFAULT 'Pending' CHECK (
    delivery_status IN ('Pending', 'Processing', 'Partially Shipped', 'Shipped', 'Partially Delivered', 'Delivered', 'Cancelled')
  ),
  proof_of_delivery text NULL,
  received_by text NULL,
  delivery_notes text NULL,
  shipment_documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_tracking_po ON public.delivery_tracking (purchase_order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_client ON public.delivery_tracking (client_id);

CREATE TABLE IF NOT EXISTS public.delivery_tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_tracking_id uuid NOT NULL REFERENCES public.delivery_tracking(id) ON DELETE CASCADE,
  previous_status text NULL,
  new_status text NOT NULL,
  event_note text NOT NULL,
  location text NULL,
  actor_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 3. Inventory Transactions, Adjustments & Client Inventory
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_reference text NOT NULL UNIQUE,
  idempotency_key text NULL UNIQUE,
  transaction_type text NOT NULL CHECK (
    transaction_type IN (
      'Order Reserved', 'Reservation Released', 'PO Raised', 'PO Cancelled',
      'GRN Accepted', 'Stock In', 'Stock Out', 'Stock Correction', 'Vendor Stock Updated'
    )
  ),
  master_catalogue_item_id uuid NULL REFERENCES public.master_catalogue_items(id) ON DELETE RESTRICT,
  master_product_code text NOT NULL,
  product_name text NOT NULL,
  vendor_id uuid NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  vendor_name text NULL,
  client_id uuid NULL REFERENCES public.client_organizations(id) ON DELETE RESTRICT,
  purchase_order_id uuid NULL REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  purchase_order_item_id uuid NULL REFERENCES public.purchase_order_items(id) ON DELETE SET NULL,
  goods_receipt_id uuid NULL REFERENCES public.goods_receipts(id) ON DELETE SET NULL,
  goods_receipt_item_id uuid NULL REFERENCES public.goods_receipt_items(id) ON DELETE SET NULL,
  field text NOT NULL DEFAULT 'physicalStock' CHECK (field IN ('physicalStock', 'reservedStock', 'clientInventory', 'both')),
  quantity integer NOT NULL,
  previous_quantity integer NOT NULL DEFAULT 0,
  new_quantity integer NOT NULL DEFAULT 0,
  transaction_date timestamptz NOT NULL DEFAULT now(),
  performed_by text NOT NULL,
  reason text NULL,
  document_reference text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product ON public.inventory_transactions (master_product_code, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_client ON public.inventory_transactions (client_id);

CREATE TABLE IF NOT EXISTS public.inventory_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adjustment_reference text NOT NULL UNIQUE,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  vendor_product_id uuid NOT NULL REFERENCES public.vendor_products(id) ON DELETE RESTRICT,
  master_catalogue_item_id uuid NOT NULL REFERENCES public.master_catalogue_items(id) ON DELETE RESTRICT,
  master_product_code text NOT NULL,
  adjustment_type text NOT NULL CHECK (adjustment_type IN ('Stock In', 'Stock Out', 'Stock Correction')),
  quantity_delta integer NOT NULL,
  previous_physical_stock integer NOT NULL,
  new_physical_stock integer NOT NULL CHECK (new_physical_stock >= 0),
  reason text NOT NULL,
  performed_by text NOT NULL,
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.client_inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.client_organizations(id) ON DELETE CASCADE,
  master_catalogue_item_id uuid NULL REFERENCES public.master_catalogue_items(id) ON DELETE RESTRICT,
  goods_receipt_item_id uuid NULL REFERENCES public.goods_receipt_items(id) ON DELETE SET NULL,
  source_key text NULL UNIQUE,
  asset_id text NOT NULL,
  name text NOT NULL,
  asset_type text NOT NULL DEFAULT 'Physical Asset',
  category text NULL,
  serial_number text NULL,
  location text NULL,
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit_label text NOT NULL DEFAULT 'units',
  condition text NOT NULL DEFAULT 'New',
  status text NOT NULL DEFAULT 'available',
  warranty text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_inventory_client ON public.client_inventory_items (client_id);

-- ----------------------------------------------------------------------------
-- 4. Row-Level Security (Default-Deny)
-- ----------------------------------------------------------------------------
ALTER TABLE public.goods_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goods_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goods_receipt_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_inventory_items ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.goods_receipts FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.goods_receipt_items FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.goods_receipt_status_history FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.delivery_tracking FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.delivery_tracking_events FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.inventory_transactions FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.inventory_adjustments FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.client_inventory_items FROM PUBLIC, anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.goods_receipts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.goods_receipt_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.goods_receipt_status_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.delivery_tracking TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.delivery_tracking_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.inventory_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.inventory_adjustments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.client_inventory_items TO authenticated;

-- Internal-only GRN, Inventory Transactions & Adjustments
DROP POLICY IF EXISTS goods_receipts_internal ON public.goods_receipts;
CREATE POLICY goods_receipts_internal ON public.goods_receipts
  FOR ALL TO authenticated
  USING (app.is_nido_internal() AND (app.has_nido_permission('purchase_orders', 'view') OR app.has_nido_permission('orders', 'view')))
  WITH CHECK (app.is_nido_internal() AND (app.has_nido_permission('purchase_orders', 'edit') OR app.has_nido_permission('orders', 'edit')));

DROP POLICY IF EXISTS goods_receipt_items_internal ON public.goods_receipt_items;
CREATE POLICY goods_receipt_items_internal ON public.goods_receipt_items
  FOR ALL TO authenticated
  USING (app.is_nido_internal())
  WITH CHECK (app.is_nido_internal());

DROP POLICY IF EXISTS goods_receipt_history_internal ON public.goods_receipt_status_history;
CREATE POLICY goods_receipt_history_internal ON public.goods_receipt_status_history
  FOR ALL TO authenticated
  USING (app.is_nido_internal())
  WITH CHECK (app.is_nido_internal());

DROP POLICY IF EXISTS inventory_transactions_internal ON public.inventory_transactions;
CREATE POLICY inventory_transactions_internal ON public.inventory_transactions
  FOR ALL TO authenticated
  USING (app.is_nido_internal())
  WITH CHECK (app.is_nido_internal());

DROP POLICY IF EXISTS inventory_adjustments_internal ON public.inventory_adjustments;
CREATE POLICY inventory_adjustments_internal ON public.inventory_adjustments
  FOR ALL TO authenticated
  USING (app.is_nido_internal())
  WITH CHECK (app.is_nido_internal());

-- Delivery Tracking: internal R/W, client portal read-only for own client_id
DROP POLICY IF EXISTS delivery_tracking_select ON public.delivery_tracking;
CREATE POLICY delivery_tracking_select ON public.delivery_tracking
  FOR SELECT TO authenticated
  USING (app.is_nido_internal() OR client_id = app.current_client_id());

DROP POLICY IF EXISTS delivery_tracking_write ON public.delivery_tracking;
CREATE POLICY delivery_tracking_write ON public.delivery_tracking
  FOR ALL TO authenticated
  USING (app.is_nido_internal())
  WITH CHECK (app.is_nido_internal());

DROP POLICY IF EXISTS delivery_tracking_events_select ON public.delivery_tracking_events;
CREATE POLICY delivery_tracking_events_select ON public.delivery_tracking_events
  FOR SELECT TO authenticated
  USING (
    app.is_nido_internal()
    OR EXISTS (
      SELECT 1 FROM public.delivery_tracking dt
      WHERE dt.id = delivery_tracking_id AND dt.client_id = app.current_client_id()
    )
  );

DROP POLICY IF EXISTS delivery_tracking_events_write ON public.delivery_tracking_events;
CREATE POLICY delivery_tracking_events_write ON public.delivery_tracking_events
  FOR ALL TO authenticated
  USING (app.is_nido_internal())
  WITH CHECK (app.is_nido_internal());

-- Client Inventory: internal R/W, client portal scoped to own client_id
DROP POLICY IF EXISTS client_inventory_items_rw ON public.client_inventory_items;
CREATE POLICY client_inventory_items_rw ON public.client_inventory_items
  FOR ALL TO authenticated
  USING (app.is_nido_internal() OR client_id = app.current_client_id())
  WITH CHECK (app.is_nido_internal() OR client_id = app.current_client_id());

-- ----------------------------------------------------------------------------
-- 5. Transactional GRN, Delivery Tracking & Stock Adjustment RPCs
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.process_goods_receipt(
  p_po_number text,
  p_received_by text,
  p_items jsonb,
  p_idempotency_key text DEFAULT NULL,
  p_allow_excess boolean DEFAULT false,
  p_inspection_notes text DEFAULT NULL,
  p_remarks text DEFAULT NULL,
  p_attachments jsonb DEFAULT '[]'::jsonb
)
RETURNS public.goods_receipts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_po public.purchase_orders%ROWTYPE;
  v_existing public.goods_receipts%ROWTYPE;
  v_grn public.goods_receipts%ROWTYPE;
  v_grn_number text;
  v_item jsonb;
  v_po_item public.purchase_order_items%ROWTYPE;
  v_prev_received integer;
  v_recv integer;
  v_acc integer;
  v_rej integer;
  v_dmg integer;
  v_short integer;
  v_excess integer;
  v_grn_item_id uuid;
  v_all_delivered boolean := true;
  v_any_received boolean := false;
  v_po_status text;
  v_total_accepted integer;
  v_prev_client_qty integer;
BEGIN
  IF v_uid IS NULL OR NOT app.is_nido_internal() THEN
    RAISE EXCEPTION 'Forbidden: internal NIDO authorization required' USING ERRCODE = '42501';
  END IF;

  IF btrim(COALESCE(p_idempotency_key, '')) <> '' THEN
    SELECT * INTO v_existing
    FROM public.goods_receipts
    WHERE idempotency_key = p_idempotency_key;
    IF FOUND THEN
      RETURN v_existing;
    END IF;
  END IF;

  SELECT * INTO v_po
  FROM public.purchase_orders
  WHERE po_number = p_po_number
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase Order % not found', p_po_number USING ERRCODE = '23503';
  END IF;

  IF v_po.status IN ('Draft', 'Cancelled') THEN
    RAISE EXCEPTION 'Cannot receive goods for a % Purchase Order', v_po.status USING ERRCODE = '22023';
  END IF;

  v_grn_number := public.allocate_document_number('GRN', NULL);

  INSERT INTO public.goods_receipts (
    grn_number, purchase_order_id, po_number, order_id, client_id, vendor_id,
    received_by, status, inspection_notes, remarks, attachments, idempotency_key, created_by
  ) VALUES (
    v_grn_number, v_po.id, v_po.po_number, v_po.order_id, v_po.client_id, v_po.vendor_id,
    COALESCE(NULLIF(btrim(p_received_by), ''), 'Warehouse Team'), 'Received',
    p_inspection_notes, p_remarks, COALESCE(p_attachments, '[]'::jsonb),
    NULLIF(btrim(COALESCE(p_idempotency_key, '')), ''), v_uid
  )
  RETURNING * INTO v_grn;

  FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(p_items, '[]'::jsonb))
  LOOP
    SELECT * INTO v_po_item
    FROM public.purchase_order_items
    WHERE purchase_order_id = v_po.id
      AND sub_order_id = (v_item->>'sub_order_id')
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PO item % not found on %', COALESCE(v_item->>'sub_order_id', ''), p_po_number USING ERRCODE = '23503';
    END IF;

    SELECT COALESCE(SUM(gri.received_qty), 0) INTO v_prev_received
    FROM public.goods_receipt_items gri
    JOIN public.goods_receipts gr ON gr.id = gri.goods_receipt_id
    WHERE gri.purchase_order_item_id = v_po_item.id
      AND gr.status <> 'Cancelled';

    v_recv := GREATEST(0, COALESCE((v_item->>'received_qty')::integer, 0));
    v_acc := GREATEST(0, COALESCE((v_item->>'accepted_qty')::integer, v_recv));
    v_rej := GREATEST(0, COALESCE((v_item->>'rejected_qty')::integer, 0));
    v_dmg := GREATEST(0, COALESCE((v_item->>'damaged_qty')::integer, 0));

    IF v_acc + v_rej + v_dmg > v_recv THEN
      RAISE EXCEPTION 'Accepted + rejected + damaged quantities cannot exceed received quantity for %', v_po_item.item_name USING ERRCODE = '22023';
    END IF;

    IF NOT p_allow_excess AND (v_prev_received + v_recv > v_po_item.qty) THEN
      RAISE EXCEPTION 'Received quantity (%) exceeds remaining PO quantity (%) for %', v_recv, GREATEST(0, v_po_item.qty - v_prev_received), v_po_item.item_name USING ERRCODE = '22023';
    END IF;

    v_short := GREATEST(0, v_po_item.qty - (v_prev_received + v_recv));
    v_excess := GREATEST(0, (v_prev_received + v_recv) - v_po_item.qty);

    INSERT INTO public.goods_receipt_items (
      goods_receipt_id, purchase_order_item_id, sub_order_id, master_catalogue_item_id,
      product_code, sku, product_name, ordered_qty, previously_received_qty,
      received_qty, accepted_qty, rejected_qty, damaged_qty, shortage_qty, excess_qty,
      batch_number, serial_number, expiry_date, inspection_notes, return_requested, return_reason
    ) VALUES (
      v_grn.id, v_po_item.id, v_po_item.sub_order_id, v_po_item.master_catalogue_item_id,
      v_po_item.product_code, v_po_item.sku, v_po_item.item_name, v_po_item.qty, v_prev_received,
      v_recv, v_acc, v_rej, v_dmg, v_short, v_excess,
      v_item->>'batch_number', v_item->>'serial_number',
      NULLIF(v_item->>'expiry_date', '')::date,
      v_item->>'inspection_notes',
      COALESCE((v_item->>'return_requested')::boolean, false),
      v_item->>'return_reason'
    )
    RETURNING id INTO v_grn_item_id;

    -- Record accepted goods in client inventory & inventory_transactions (NEVER deduct vendor stock again!)
    IF v_acc > 0 THEN
      v_any_received := true;
      v_prev_client_qty := 0;
      IF v_po.client_id IS NOT NULL THEN
        SELECT COALESCE(quantity, 0) INTO v_prev_client_qty
        FROM public.client_inventory_items
        WHERE source_key = 'grn_' || v_po_item.sub_order_id;

        INSERT INTO public.client_inventory_items (
          client_id, master_catalogue_item_id, goods_receipt_item_id, source_key,
          asset_id, name, category, serial_number, quantity
        ) VALUES (
          v_po.client_id, v_po_item.master_catalogue_item_id, v_grn_item_id,
          'grn_' || v_po_item.sub_order_id,
          COALESCE(v_po_item.product_code, v_po_item.sub_order_id),
          v_po_item.item_name, v_po_item.category, v_item->>'serial_number', v_acc
        )
        ON CONFLICT (source_key) DO UPDATE
        SET quantity = public.client_inventory_items.quantity + EXCLUDED.quantity,
            goods_receipt_item_id = EXCLUDED.goods_receipt_item_id,
            updated_at = now();
      END IF;

      INSERT INTO public.inventory_transactions (
        transaction_reference, idempotency_key, transaction_type,
        master_catalogue_item_id, master_product_code, product_name,
        vendor_id, vendor_name, client_id, purchase_order_id, purchase_order_item_id,
        goods_receipt_id, goods_receipt_item_id, field, quantity, previous_quantity, new_quantity,
        performed_by, reason, document_reference
      ) VALUES (
        'TXN-' || v_grn_number || '-' || v_po_item.sub_order_id,
        'grn_acc_' || v_grn_item_id::text,
        'GRN Accepted',
        v_po_item.master_catalogue_item_id, COALESCE(v_po_item.product_code, v_po_item.sub_order_id), v_po_item.item_name,
        v_po.vendor_id, v_po.vendor_name, v_po.client_id, v_po.id, v_po_item.id,
        v_grn.id, v_grn_item_id, 'clientInventory', v_acc, v_prev_client_qty, v_prev_client_qty + v_acc,
        COALESCE(NULLIF(btrim(p_received_by), ''), 'Warehouse Team'),
        'Accepted goods via ' || v_grn_number,
        v_grn_number
      ) ON CONFLICT (idempotency_key) DO NOTHING;
    END IF;

    -- Update PO item status based on cumulative accepted quantity
    SELECT COALESCE(SUM(gri.accepted_qty), 0) INTO v_total_accepted
    FROM public.goods_receipt_items gri
    JOIN public.goods_receipts gr ON gr.id = gri.goods_receipt_id
    WHERE gri.purchase_order_item_id = v_po_item.id AND gr.status <> 'Cancelled';

    UPDATE public.purchase_order_items
    SET item_status = CASE
          WHEN v_total_accepted >= v_po_item.qty THEN 'Delivered'
          WHEN v_total_accepted > 0 THEN 'Partially Delivered'
          ELSE item_status
        END,
        updated_at = now()
    WHERE id = v_po_item.id;
  END LOOP;

  SELECT NOT EXISTS (
    SELECT 1 FROM public.purchase_order_items
    WHERE purchase_order_id = v_po.id
      AND lower(COALESCE(item_status, '')) NOT IN ('delivered', 'cancelled')
  ) INTO v_all_delivered;

  v_po_status := CASE
    WHEN v_all_delivered THEN 'Delivered'
    WHEN v_any_received THEN 'Partially Shipped'
    ELSE v_po.status
  END;

  UPDATE public.goods_receipts
  SET status = CASE WHEN v_all_delivered THEN 'Received' WHEN v_any_received THEN 'Partially Received' ELSE 'Rejected' END,
      updated_at = now()
  WHERE id = v_grn.id
  RETURNING * INTO v_grn;

  INSERT INTO public.goods_receipt_status_history (
    goods_receipt_id, new_status, note_text, actor_user_id, actor_name
  ) VALUES (
    v_grn.id, v_grn.status, 'GRN ' || v_grn_number || ' processed for ' || v_po.po_number,
    v_uid, COALESCE(NULLIF(btrim(p_received_by), ''), 'Warehouse Team')
  );

  IF v_po_status <> v_po.status THEN
    UPDATE public.purchase_orders
    SET status = v_po_status, updated_by = v_uid, updated_at = now()
    WHERE id = v_po.id;

    INSERT INTO public.purchase_order_status_history (
      purchase_order_id, kind, previous_status, new_status, note_text, actor_user_id, actor_name, initials
    ) VALUES (
      v_po.id, 'status-change', v_po.status, v_po_status,
      'PO status updated via ' || v_grn_number || '.',
      v_uid, 'System', 'SY'
    );
  END IF;

  RETURN v_grn;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_delivery_tracking_update(
  p_po_number text,
  p_delivery_status text,
  p_carrier text DEFAULT NULL,
  p_tracking_number text DEFAULT NULL,
  p_tracking_link text DEFAULT NULL,
  p_expected_delivery_date date DEFAULT NULL,
  p_proof_of_delivery text DEFAULT NULL,
  p_received_by text DEFAULT NULL,
  p_delivery_notes text DEFAULT NULL,
  p_shipment_reference text DEFAULT NULL
)
RETURNS public.delivery_tracking
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_po public.purchase_orders%ROWTYPE;
  v_ref text;
  v_dt public.delivery_tracking%ROWTYPE;
  v_prev_status text;
BEGIN
  IF v_uid IS NULL OR NOT app.is_nido_internal() THEN
    RAISE EXCEPTION 'Forbidden: internal NIDO authorization required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_po FROM public.purchase_orders WHERE po_number = p_po_number FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase Order % not found', p_po_number USING ERRCODE = '23503';
  END IF;

  v_ref := COALESCE(NULLIF(btrim(p_shipment_reference), ''), public.allocate_document_number('SHP', NULL));

  SELECT delivery_status INTO v_prev_status FROM public.delivery_tracking WHERE shipment_reference = v_ref;

  INSERT INTO public.delivery_tracking (
    shipment_reference, purchase_order_id, po_number, order_id, client_id, vendor_id,
    carrier, tracking_number, tracking_link, expected_delivery_date,
    dispatch_date, actual_delivery_date, delivery_status, proof_of_delivery, received_by, delivery_notes, created_by
  ) VALUES (
    v_ref, v_po.id, v_po.po_number, v_po.order_id, v_po.client_id, v_po.vendor_id,
    p_carrier, p_tracking_number, p_tracking_link, p_expected_delivery_date,
    CASE WHEN p_delivery_status IN ('Shipped', 'Partially Shipped') THEN now() ELSE NULL END,
    CASE WHEN p_delivery_status = 'Delivered' THEN now() ELSE NULL END,
    p_delivery_status, p_proof_of_delivery, p_received_by, p_delivery_notes, v_uid
  )
  ON CONFLICT (shipment_reference) DO UPDATE
  SET carrier = COALESCE(EXCLUDED.carrier, public.delivery_tracking.carrier),
      tracking_number = COALESCE(EXCLUDED.tracking_number, public.delivery_tracking.tracking_number),
      tracking_link = COALESCE(EXCLUDED.tracking_link, public.delivery_tracking.tracking_link),
      expected_delivery_date = COALESCE(EXCLUDED.expected_delivery_date, public.delivery_tracking.expected_delivery_date),
      dispatch_date = COALESCE(public.delivery_tracking.dispatch_date, EXCLUDED.dispatch_date),
      actual_delivery_date = COALESCE(EXCLUDED.actual_delivery_date, public.delivery_tracking.actual_delivery_date),
      delivery_status = EXCLUDED.delivery_status,
      proof_of_delivery = COALESCE(EXCLUDED.proof_of_delivery, public.delivery_tracking.proof_of_delivery),
      received_by = COALESCE(EXCLUDED.received_by, public.delivery_tracking.received_by),
      delivery_notes = COALESCE(EXCLUDED.delivery_notes, public.delivery_tracking.delivery_notes),
      updated_at = now()
  RETURNING * INTO v_dt;

  INSERT INTO public.delivery_tracking_events (
    delivery_tracking_id, previous_status, new_status, event_note, actor_user_id, actor_name
  ) VALUES (
    v_dt.id, v_prev_status, p_delivery_status,
    COALESCE(NULLIF(btrim(p_delivery_notes), ''), 'Shipment status updated to ' || p_delivery_status),
    v_uid, 'System'
  );

  RETURN v_dt;
END;
$$;

CREATE OR REPLACE FUNCTION public.adjust_vendor_inventory_atomic(
  p_vendor_id uuid,
  p_master_catalogue_item_id uuid,
  p_adjustment_type text,
  p_quantity_delta integer,
  p_reason text,
  p_performed_by text
)
RETURNS public.inventory_adjustments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_vp public.vendor_products%ROWTYPE;
  v_master public.master_catalogue_items%ROWTYPE;
  v_vendor public.vendors%ROWTYPE;
  v_prev integer;
  v_next integer;
  v_adj_ref text := 'ADJ-' || to_char(now(), 'YYYYMMDDHH24MISS') || '-' || substr(gen_random_uuid()::text, 1, 6);
  v_adj public.inventory_adjustments%ROWTYPE;
BEGIN
  IF v_uid IS NULL OR NOT app.is_nido_internal() THEN
    RAISE EXCEPTION 'Forbidden: internal NIDO authorization required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_vp
  FROM public.vendor_products
  WHERE vendor_id = p_vendor_id AND master_catalogue_item_id = p_master_catalogue_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vendor product record not found' USING ERRCODE = '23503';
  END IF;

  SELECT * INTO v_master FROM public.master_catalogue_items WHERE id = p_master_catalogue_item_id;
  SELECT * INTO v_vendor FROM public.vendors WHERE id = p_vendor_id;

  v_prev := COALESCE(v_vp.physical_stock, 0);
  v_next := v_prev + p_quantity_delta;
  IF v_next < 0 THEN
    RAISE EXCEPTION 'Stock adjustment would result in negative physical stock (% + % < 0)', v_prev, p_quantity_delta USING ERRCODE = '22023';
  END IF;

  UPDATE public.vendor_products
  SET physical_stock = v_next, last_stock_update = now()
  WHERE id = v_vp.id;

  INSERT INTO public.inventory_adjustments (
    adjustment_reference, vendor_id, vendor_product_id, master_catalogue_item_id,
    master_product_code, adjustment_type, quantity_delta, previous_physical_stock,
    new_physical_stock, reason, performed_by, created_by
  ) VALUES (
    v_adj_ref, p_vendor_id, v_vp.id, p_master_catalogue_item_id,
    v_master.master_product_code, p_adjustment_type, p_quantity_delta, v_prev,
    v_next, p_reason, COALESCE(NULLIF(btrim(p_performed_by), ''), 'Admin'), v_uid
  )
  RETURNING * INTO v_adj;

  INSERT INTO public.inventory_transactions (
    transaction_reference, transaction_type, master_catalogue_item_id,
    master_product_code, product_name, vendor_id, vendor_name,
    field, quantity, previous_quantity, new_quantity, performed_by, reason, document_reference
  ) VALUES (
    'TXN-' || v_adj_ref, p_adjustment_type, p_master_catalogue_item_id,
    v_master.master_product_code, v_master.product_name, p_vendor_id, v_vendor.name,
    'physicalStock', p_quantity_delta, v_prev, v_next,
    COALESCE(NULLIF(btrim(p_performed_by), ''), 'Admin'), p_reason, v_adj_ref
  );

  RETURN v_adj;
END;
$$;

REVOKE ALL ON FUNCTION public.process_goods_receipt(text, text, jsonb, text, boolean, text, text, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_delivery_tracking_update(text, text, text, text, text, date, text, text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.adjust_vendor_inventory_atomic(uuid, uuid, text, integer, text, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.process_goods_receipt(text, text, jsonb, text, boolean, text, text, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_delivery_tracking_update(text, text, text, text, text, date, text, text, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.adjust_vendor_inventory_atomic(uuid, uuid, text, integer, text, text) TO authenticated, service_role;
