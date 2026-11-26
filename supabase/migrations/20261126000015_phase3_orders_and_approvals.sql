-- ============================================================================
-- NIDO Phase 3 – Wave 2.1: Orders & Approval Workflow + Checkout RPCs
-- ============================================================================

INSERT INTO public.document_sequences (
  seq_key, prefix, next_value, pad_length, include_year, year_separator, description
)
VALUES (
  'ORD', 'ORD-', 1, 6, false, '-', 'Procurement Order number (ORD-NNNNNN)'
)
ON CONFLICT (seq_key) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 1. Procurement Orders & Line Items
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.procurement_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL UNIQUE,
  client_id uuid NOT NULL REFERENCES public.client_organizations(id) ON DELETE RESTRICT,
  client_name text NOT NULL,
  po_number text NULL,
  requester_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  requester_name text NOT NULL,
  requester_email text NULL,
  requester_role text NULL,
  ordered_for text NULL,
  assigned_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_name text NOT NULL DEFAULT 'Unassigned',
  assigned_role text NULL,
  assigned_on text NULL,
  assignment_notes text NULL,
  assignment_completed boolean NOT NULL DEFAULT false,
  auto_assignment_status text NULL,
  order_date text NOT NULL,
  order_time text NULL,
  required_delivery_date date NULL,
  order_type text NOT NULL DEFAULT 'Standard',
  status text NOT NULL DEFAULT 'Processing',
  approval_status text NOT NULL DEFAULT 'Not Required' CHECK (
    approval_status IN ('Not Required', 'Pending', 'In Progress', 'Approved', 'Rejected', 'Sent Back', 'Cancelled', 'Escalated')
  ),
  defer_purchase_orders boolean NOT NULL DEFAULT false,
  subtotal numeric(12, 2) NOT NULL DEFAULT 0,
  total_gst numeric(12, 2) NOT NULL DEFAULT 0,
  total_discount numeric(12, 2) NOT NULL DEFAULT 0,
  shipping_delivery_fee numeric(12, 2) NOT NULL DEFAULT 0,
  platform_fee numeric(12, 2) NOT NULL DEFAULT 0,
  total_amount numeric(12, 2) NOT NULL DEFAULT 0,
  initial_total_amount numeric(12, 2) NOT NULL DEFAULT 0,
  total_amount_display text NOT NULL DEFAULT '₹0.00',
  payment_method text NULL,
  payment_detail text NULL,
  payment_terms text NULL,
  order_notes text NULL,
  delivery_address text NULL,
  delivery_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  checkout_pricing_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  cancel_reason text NULL,
  idempotency_key text NULL UNIQUE,
  sla_time text NULL,
  sla_alert boolean NOT NULL DEFAULT false,
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name text NULL,
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by_name text NULL,
  update_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_procurement_orders_client_id ON public.procurement_orders (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_procurement_orders_status ON public.procurement_orders (status);

CREATE TABLE IF NOT EXISTS public.procurement_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.procurement_orders(id) ON DELETE CASCADE,
  sub_order_id text NOT NULL,
  client_id uuid NOT NULL REFERENCES public.client_organizations(id) ON DELETE RESTRICT,
  master_catalogue_item_id uuid NULL REFERENCES public.master_catalogue_items(id) ON DELETE RESTRICT,
  client_catalogue_item_id uuid NULL REFERENCES public.client_catalogue_items(id) ON DELETE SET NULL,
  vendor_id uuid NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  vendor_product_id uuid NULL REFERENCES public.vendor_products(id) ON DELETE SET NULL,
  product_code text NOT NULL,
  sku_code text NULL,
  product_name text NOT NULL,
  category text NULL,
  product_type text NULL,
  physical_type text NULL,
  fulfillment_type text NULL,
  image text NULL,
  specs jsonb NOT NULL DEFAULT '[]'::jsonb,
  quantity integer NOT NULL CHECK (quantity >= 1),
  unit text NOT NULL DEFAULT 'Unit',
  moq integer NOT NULL DEFAULT 1,
  unit_price numeric(12, 2) NOT NULL DEFAULT 0,
  vendor_price numeric(12, 2) NOT NULL DEFAULT 0,
  client_selling_price_excl_gst numeric(12, 2) NOT NULL DEFAULT 0,
  landed_cost numeric(12, 2) NOT NULL DEFAULT 0,
  checkout_unit_price_inclusive numeric(12, 2) NOT NULL DEFAULT 0,
  checkout_unit_price_excl_gst numeric(12, 2) NOT NULL DEFAULT 0,
  gst_rate numeric(5, 2) NULL,
  discount_pct numeric(7, 3) NOT NULL DEFAULT 0,
  line_total numeric(12, 2) NOT NULL DEFAULT 0,
  hsn_snapshot text NULL,
  selected_vendor_name text NULL,
  vendor_rating numeric(4, 2) NULL,
  lead_time text NULL,
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  configuration_price_adjustment numeric(12, 2) NOT NULL DEFAULT 0,
  commercial_terms jsonb NOT NULL DEFAULT '{}'::jsonb,
  stock_reservation_id uuid NULL REFERENCES public.stock_reservations(id) ON DELETE SET NULL,
  vendor_allocations jsonb NOT NULL DEFAULT '[]'::jsonb,
  item_status text NOT NULL DEFAULT 'Processing',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_procurement_order_items_order_id ON public.procurement_order_items (order_id);

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.procurement_orders(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.client_organizations(id) ON DELETE CASCADE,
  event_id text NULL UNIQUE,
  event_type text NOT NULL DEFAULT 'activity',
  previous_status text NULL,
  new_status text NULL,
  note_text text NOT NULL,
  visibility text NOT NULL DEFAULT 'Internal Note',
  actor_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON public.order_status_history (order_id, created_at DESC);

-- Extend stock_reservations to link to procurement_orders and support 'ordered' state
ALTER TABLE public.stock_reservations
  ADD COLUMN IF NOT EXISTS order_id uuid NULL REFERENCES public.procurement_orders(id) ON DELETE SET NULL;

ALTER TABLE public.stock_reservations
  DROP CONSTRAINT IF EXISTS stock_reservations_status_check;

ALTER TABLE public.stock_reservations
  ADD CONSTRAINT stock_reservations_status_check
  CHECK (status IN ('active', 'ordered', 'released', 'consumed', 'expired'));

CREATE INDEX IF NOT EXISTS idx_stock_reservations_order_id ON public.stock_reservations (order_id);

-- ----------------------------------------------------------------------------
-- 2. Approval Workflow Tables
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.approval_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NULL REFERENCES public.client_organizations(id) ON DELETE CASCADE,
  client_name text NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  module text NOT NULL,
  trigger text NOT NULL DEFAULT 'Order created',
  workflow_type text NOT NULL DEFAULT 'Standard',
  status text NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Active', 'Inactive')),
  current_version integer NOT NULL DEFAULT 1,
  conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  levels jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by text NOT NULL DEFAULT 'system',
  updated_by text NOT NULL DEFAULT 'system',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approval_workflows_client ON public.approval_workflows (client_id, module, status);

CREATE TABLE IF NOT EXISTS public.approval_workflow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES public.approval_workflows(id) ON DELETE CASCADE,
  level_number integer NOT NULL,
  approver_type text NOT NULL,
  approver_role text NULL,
  specific_user_id text NULL,
  minimum_approvers integer NOT NULL DEFAULT 1,
  approval_mode text NOT NULL DEFAULT 'Sequential',
  sla_hours integer NOT NULL DEFAULT 24,
  escalation_enabled boolean NOT NULL DEFAULT false,
  escalation_approver text NULL,
  escalation_after_hours integer NULL
);

CREATE TABLE IF NOT EXISTS public.approval_workflow_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES public.approval_workflows(id) ON DELETE CASCADE,
  version integer NOT NULL,
  changed_by text NOT NULL,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'Saved',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES public.approval_workflows(id) ON DELETE RESTRICT,
  workflow_name text NOT NULL,
  workflow_version integer NOT NULL DEFAULT 1,
  client_id uuid NULL REFERENCES public.client_organizations(id) ON DELETE CASCADE,
  client_name text NULL,
  module text NOT NULL,
  trigger text NOT NULL,
  reference text NOT NULL,
  order_id uuid NULL REFERENCES public.procurement_orders(id) ON DELETE CASCADE,
  requested_by text NOT NULL,
  requested_by_name text NOT NULL,
  current_approver text NOT NULL,
  approver_type text NULL,
  current_level integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'Pending' CHECK (
    status IN ('Pending', 'In Progress', 'Approved', 'Rejected', 'Sent Back', 'Cancelled', 'Escalated')
  ),
  amount numeric(12, 2) NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  due_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approval_requests_client_ref ON public.approval_requests (client_id, reference, status);

CREATE TABLE IF NOT EXISTS public.approval_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.approval_requests(id) ON DELETE CASCADE,
  step_id text NULL,
  action text NOT NULL,
  user_id text NOT NULL,
  user_name text NOT NULL,
  user_role text NULL,
  comment text NOT NULL DEFAULT '',
  previous_status text NULL,
  new_status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approval_actions_request ON public.approval_actions (request_id, created_at ASC);

-- ----------------------------------------------------------------------------
-- 3. Row-Level Security (Default-Deny)
-- ----------------------------------------------------------------------------
ALTER TABLE public.procurement_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurement_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_workflow_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_actions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.procurement_orders FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.procurement_order_items FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.order_status_history FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.approval_workflows FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.approval_workflow_steps FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.approval_workflow_history FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.approval_requests FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.approval_actions FROM PUBLIC, anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.procurement_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.procurement_order_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.order_status_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.approval_workflows TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.approval_workflow_steps TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.approval_workflow_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.approval_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.approval_actions TO authenticated;

-- procurement_orders policies
DROP POLICY IF EXISTS procurement_orders_select ON public.procurement_orders;
CREATE POLICY procurement_orders_select ON public.procurement_orders
  FOR SELECT TO authenticated
  USING (
    (app.is_nido_internal() AND app.has_nido_permission('orders', 'view'))
    OR client_id = app.current_client_id()
  );

DROP POLICY IF EXISTS procurement_orders_insert ON public.procurement_orders;
CREATE POLICY procurement_orders_insert ON public.procurement_orders
  FOR INSERT TO authenticated
  WITH CHECK (
    (app.is_nido_internal() AND app.has_nido_permission('orders', 'create'))
    OR client_id = app.current_client_id()
  );

DROP POLICY IF EXISTS procurement_orders_update ON public.procurement_orders;
CREATE POLICY procurement_orders_update ON public.procurement_orders
  FOR UPDATE TO authenticated
  USING (
    (app.is_nido_internal() AND app.has_nido_permission('orders', 'edit'))
    OR client_id = app.current_client_id()
  )
  WITH CHECK (
    (app.is_nido_internal() AND app.has_nido_permission('orders', 'edit'))
    OR client_id = app.current_client_id()
  );

-- procurement_order_items policies
DROP POLICY IF EXISTS procurement_order_items_select ON public.procurement_order_items;
CREATE POLICY procurement_order_items_select ON public.procurement_order_items
  FOR SELECT TO authenticated
  USING (
    (app.is_nido_internal() AND app.has_nido_permission('orders', 'view'))
    OR client_id = app.current_client_id()
  );

DROP POLICY IF EXISTS procurement_order_items_write ON public.procurement_order_items;
CREATE POLICY procurement_order_items_write ON public.procurement_order_items
  FOR ALL TO authenticated
  USING (
    (app.is_nido_internal() AND app.has_nido_permission('orders', 'edit'))
    OR client_id = app.current_client_id()
  )
  WITH CHECK (
    (app.is_nido_internal() AND app.has_nido_permission('orders', 'edit'))
    OR client_id = app.current_client_id()
  );

-- order_status_history policies
DROP POLICY IF EXISTS order_status_history_select ON public.order_status_history;
CREATE POLICY order_status_history_select ON public.order_status_history
  FOR SELECT TO authenticated
  USING (
    (app.is_nido_internal() AND app.has_nido_permission('orders', 'view'))
    OR client_id = app.current_client_id()
  );

DROP POLICY IF EXISTS order_status_history_insert ON public.order_status_history;
CREATE POLICY order_status_history_insert ON public.order_status_history
  FOR INSERT TO authenticated
  WITH CHECK (
    (app.is_nido_internal() AND app.has_nido_permission('orders', 'edit'))
    OR client_id = app.current_client_id()
  );

-- approval_workflows policies
DROP POLICY IF EXISTS approval_workflows_select ON public.approval_workflows;
CREATE POLICY approval_workflows_select ON public.approval_workflows
  FOR SELECT TO authenticated
  USING (
    app.is_nido_internal()
    OR client_id = app.current_client_id()
  );

DROP POLICY IF EXISTS approval_workflows_write ON public.approval_workflows;
CREATE POLICY approval_workflows_write ON public.approval_workflows
  FOR ALL TO authenticated
  USING (
    (app.is_nido_internal() AND (app.has_nido_permission('approval_workflows', 'edit') OR app.has_nido_permission('platform_configuration_approvals', 'edit')))
    OR (client_id = app.current_client_id() AND app.has_portal_permission('approvals', 'edit'))
  )
  WITH CHECK (
    (app.is_nido_internal() AND (app.has_nido_permission('approval_workflows', 'edit') OR app.has_nido_permission('platform_configuration_approvals', 'edit')))
    OR (client_id = app.current_client_id() AND app.has_portal_permission('approvals', 'edit'))
  );

DROP POLICY IF EXISTS approval_workflow_steps_rw ON public.approval_workflow_steps;
CREATE POLICY approval_workflow_steps_rw ON public.approval_workflow_steps
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.approval_workflows wf
      WHERE wf.id = workflow_id
        AND (app.is_nido_internal() OR wf.client_id = app.current_client_id())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.approval_workflows wf
      WHERE wf.id = workflow_id
        AND (app.is_nido_internal() OR wf.client_id = app.current_client_id())
    )
  );

DROP POLICY IF EXISTS approval_workflow_history_rw ON public.approval_workflow_history;
CREATE POLICY approval_workflow_history_rw ON public.approval_workflow_history
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.approval_workflows wf
      WHERE wf.id = workflow_id
        AND (app.is_nido_internal() OR wf.client_id = app.current_client_id())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.approval_workflows wf
      WHERE wf.id = workflow_id
        AND (app.is_nido_internal() OR wf.client_id = app.current_client_id())
    )
  );

DROP POLICY IF EXISTS approval_requests_rw ON public.approval_requests;
CREATE POLICY approval_requests_rw ON public.approval_requests
  FOR ALL TO authenticated
  USING (
    app.is_nido_internal()
    OR client_id = app.current_client_id()
  )
  WITH CHECK (
    app.is_nido_internal()
    OR client_id = app.current_client_id()
  );

DROP POLICY IF EXISTS approval_actions_rw ON public.approval_actions;
CREATE POLICY approval_actions_rw ON public.approval_actions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.approval_requests req
      WHERE req.id = request_id
        AND (app.is_nido_internal() OR req.client_id = app.current_client_id())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.approval_requests req
      WHERE req.id = request_id
        AND (app.is_nido_internal() OR req.client_id = app.current_client_id())
    )
  );

-- ----------------------------------------------------------------------------
-- 4. Transactional Checkout & Cancellation RPCs
-- ----------------------------------------------------------------------------
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
      COALESCE(v_item.metadata->>'image', (v_item.images->>0), ''),
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

CREATE OR REPLACE FUNCTION public.cancel_procurement_order_and_release(
  p_order_id uuid,
  p_cancel_reason text DEFAULT NULL
)
RETURNS public.procurement_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_order public.procurement_orders%ROWTYPE;
  v_res RECORD;
  v_updated public.procurement_orders%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_order
  FROM public.procurement_orders
  WHERE id = p_order_id
    AND (app.is_nido_internal() OR client_id = app.current_client_id())
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found or access denied' USING ERRCODE = '42501';
  END IF;

  IF v_order.status IN ('Cancelled', 'Delivered') THEN
    RETURN v_order;
  END IF;

  FOR v_res IN
    SELECT * FROM public.stock_reservations
    WHERE order_id = v_order.id AND status IN ('ordered', 'active')
    FOR UPDATE
  LOOP
    UPDATE public.vendor_products
    SET reserved_stock = GREATEST(0, COALESCE(reserved_stock, 0) - v_res.quantity),
        last_stock_update = now()
    WHERE id = v_res.vendor_product_id;

    UPDATE public.stock_reservations
    SET status = 'released', updated_at = now()
    WHERE id = v_res.id;
  END LOOP;

  UPDATE public.procurement_order_items
  SET item_status = 'Cancelled', updated_at = now()
  WHERE order_id = v_order.id;

  UPDATE public.approval_requests
  SET status = 'Cancelled', updated_at = now()
  WHERE order_id = v_order.id AND status IN ('Pending', 'In Progress', 'Sent Back', 'Escalated');

  UPDATE public.procurement_orders
  SET status = 'Cancelled',
      cancel_reason = COALESCE(p_cancel_reason, cancel_reason),
      updated_by = v_uid,
      updated_at = now(),
      update_count = update_count + 1
  WHERE id = v_order.id
  RETURNING * INTO v_updated;

  INSERT INTO public.order_status_history (
    order_id, client_id, event_type, previous_status, new_status, note_text, actor_user_id, actor_name
  ) VALUES (
    v_order.id, v_order.client_id, 'status-change', v_order.status, 'Cancelled',
    'Order status changed from ' || v_order.status || ' to Cancelled.' || COALESCE(' Reason: ' || p_cancel_reason, ''),
    v_uid, 'System'
  );

  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.checkout_cart_to_order(text, uuid, text, text, text, text, text, text, jsonb, jsonb, numeric, numeric, numeric, numeric, numeric, numeric) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cancel_procurement_order_and_release(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.checkout_cart_to_order(text, uuid, text, text, text, text, text, text, jsonb, jsonb, numeric, numeric, numeric, numeric, numeric, numeric) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cancel_procurement_order_and_release(uuid, text) TO authenticated, service_role;
