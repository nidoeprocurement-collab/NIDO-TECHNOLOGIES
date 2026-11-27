-- ============================================================================
-- NIDO Phase 3 – Wave 1.3: Client Catalogue, Client Price Engine, Shop & Cart
-- ============================================================================
-- Preserves:
--   • Client-specific product assignments referencing master_catalogue_items
--   • 2-level Client Price Engine hierarchy (Client-Specific + Category Margin)
--   • Atomic stock reservation lifecycle (physical_stock vs reserved_stock)
--   • Multi-tenant RLS isolation (app.current_client_id() / app.is_nido_internal())
-- ============================================================================

INSERT INTO public.document_sequences (
  seq_key, prefix, next_value, pad_length, include_year, year_separator, description
)
VALUES (
  'CPC', 'CPC-', 1, 5, false, '-', 'Client product code (CPC-NNNNN)'
)
ON CONFLICT (seq_key) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 1. Client Catalogue Items
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_catalogue_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.client_organizations(id) ON DELETE CASCADE,
  master_catalogue_item_id uuid NOT NULL REFERENCES public.master_catalogue_items(id) ON DELETE RESTRICT,
  client_product_code text NOT NULL,
  client_sku text NULL,
  display_name text NULL,
  description_override text NULL,
  default_vendor_id uuid NULL REFERENCES public.vendors(id) ON DELETE SET NULL,
  assigned_vendor_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  allowed_roles jsonb NOT NULL DEFAULT '[]'::jsonb,
  preference text NOT NULL DEFAULT 'Standard',
  visibility text NOT NULL DEFAULT 'visible' CHECK (visibility IN ('visible', 'hidden')),
  publish_status text NOT NULL DEFAULT 'published' CHECK (publish_status IN ('published', 'draft', 'unpublished')),
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  client_moq integer NULL CHECK (client_moq IS NULL OR client_moq >= 1),
  cached_selling_price numeric(12, 2) NULL,
  cached_selling_price_display text NULL,
  product_notes text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by_name text NULL,
  updated_by_name text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_client_catalogue_client_master UNIQUE (client_id, master_catalogue_item_id),
  CONSTRAINT uq_client_catalogue_client_cpc UNIQUE (client_id, client_product_code)
);

CREATE INDEX IF NOT EXISTS idx_client_catalogue_client_id ON public.client_catalogue_items (client_id);
CREATE INDEX IF NOT EXISTS idx_client_catalogue_master_id ON public.client_catalogue_items (master_catalogue_item_id);
CREATE INDEX IF NOT EXISTS idx_client_catalogue_visibility ON public.client_catalogue_items (client_id, publish_status, status, visibility);

CREATE OR REPLACE FUNCTION app.trg_client_catalogue_before_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF btrim(COALESCE(NEW.client_product_code, '')) = '' THEN
      NEW.client_product_code := public.allocate_document_number('CPC', NULL);
    ELSE
      NEW.client_product_code := btrim(NEW.client_product_code);
    END IF;
    NEW.created_at := COALESCE(NEW.created_at, now());
    NEW.created_by := COALESCE(auth.uid(), NEW.created_by);
  ELSE
    NEW.client_id := OLD.client_id;
    NEW.master_catalogue_item_id := OLD.master_catalogue_item_id;
    NEW.created_at := OLD.created_at;
    NEW.created_by := OLD.created_by;
  END IF;
  NEW.updated_at := now();
  NEW.updated_by := COALESCE(auth.uid(), NEW.updated_by);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_client_catalogue_before_write ON public.client_catalogue_items;
CREATE TRIGGER trg_client_catalogue_before_write
  BEFORE INSERT OR UPDATE ON public.client_catalogue_items
  FOR EACH ROW
  EXECUTE FUNCTION app.trg_client_catalogue_before_write();

-- ----------------------------------------------------------------------------
-- 2. Client Price Engine Tables
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_pricing_settings (
  client_id uuid PRIMARY KEY REFERENCES public.client_organizations(id) ON DELETE CASCADE,
  per_unit_charges jsonb NOT NULL DEFAULT '[]'::jsonb,
  overhead_pct numeric(7, 3) NOT NULL DEFAULT 0,
  profit_pct numeric(7, 3) NOT NULL DEFAULT 0,
  discount_pct numeric(7, 3) NOT NULL DEFAULT 0,
  shipping_delivery_fee numeric(12, 2) NOT NULL DEFAULT 0,
  platform_fee numeric(12, 2) NOT NULL DEFAULT 0,
  round_off text NOT NULL DEFAULT 'none' CHECK (round_off IN ('none', 'nearest', 'up', 'down')),
  min_profit_pct numeric(7, 3) NOT NULL DEFAULT 0,
  min_profit_amount numeric(12, 2) NOT NULL DEFAULT 0,
  max_discount_allowed numeric(7, 3) NOT NULL DEFAULT 0,
  enable_manual_override boolean NOT NULL DEFAULT false,
  enable_market_price_validation boolean NOT NULL DEFAULT false,
  enable_smart_pricing boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.client_price_slabs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.client_organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  min_qty integer NOT NULL CHECK (min_qty >= 1),
  max_qty integer NOT NULL CHECK (max_qty >= min_qty),
  discount_pct numeric(7, 3) NOT NULL CHECK (discount_pct >= 0),
  apply_to text NOT NULL DEFAULT 'All Products',
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_client_price_slabs_client ON public.client_price_slabs (client_id);

CREATE TABLE IF NOT EXISTS public.global_category_pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL UNIQUE,
  margin_pct numeric(7, 3) NOT NULL DEFAULT 0,
  buffer_pct numeric(7, 3) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.client_product_profit_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.client_organizations(id) ON DELETE CASCADE,
  master_catalogue_item_id uuid NOT NULL REFERENCES public.master_catalogue_items(id) ON DELETE CASCADE,
  profit_pct numeric(7, 3) NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_client_product_profit UNIQUE (client_id, master_catalogue_item_id)
);

CREATE TABLE IF NOT EXISTS public.retail_market_prices (
  master_catalogue_item_id uuid PRIMARY KEY REFERENCES public.master_catalogue_items(id) ON DELETE CASCADE,
  retail_price numeric(12, 2) NOT NULL DEFAULT 0 CHECK (retail_price >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ----------------------------------------------------------------------------
-- 3. Cart Items & Stock Reservations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.client_organizations(id) ON DELETE CASCADE,
  master_catalogue_item_id uuid NOT NULL REFERENCES public.master_catalogue_items(id) ON DELETE RESTRICT,
  vendor_id uuid NULL REFERENCES public.vendors(id) ON DELETE SET NULL,
  vendor_product_id uuid NULL REFERENCES public.vendor_products(id) ON DELETE SET NULL,
  quantity integer NOT NULL CHECK (quantity >= 1),
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb,
  configuration_key text NOT NULL DEFAULT '',
  configuration_price_adjustment numeric(12, 2) NOT NULL DEFAULT 0,
  unit_price_inclusive numeric(12, 2) NOT NULL DEFAULT 0,
  client_selling_price_excl_gst numeric(12, 2) NOT NULL DEFAULT 0,
  vendor_price numeric(12, 2) NOT NULL DEFAULT 0,
  landed_cost numeric(12, 2) NOT NULL DEFAULT 0,
  gst_snapshot numeric(5, 2) NULL,
  hsn_snapshot text NULL,
  vendor_rating numeric(4, 2) NULL,
  lead_time text NULL,
  moq integer NOT NULL DEFAULT 1,
  fulfillment_type text NULL,
  product_notes text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_cart_item_user_line
  ON public.cart_items (user_id, client_id, master_catalogue_item_id, COALESCE(vendor_id, '00000000-0000-0000-0000-000000000000'::uuid), configuration_key);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_client ON public.cart_items (user_id, client_id);

CREATE TABLE IF NOT EXISTS public.stock_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.client_organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cart_item_id uuid NULL REFERENCES public.cart_items(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  vendor_product_id uuid NOT NULL REFERENCES public.vendor_products(id) ON DELETE CASCADE,
  master_catalogue_item_id uuid NOT NULL REFERENCES public.master_catalogue_items(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity >= 1),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'released', 'consumed', 'expired')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_reservations_active
  ON public.stock_reservations (vendor_product_id, status)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_stock_reservations_user
  ON public.stock_reservations (user_id, client_id, status);

-- ----------------------------------------------------------------------------
-- 4. Row-Level Security (Default-Deny)
-- ----------------------------------------------------------------------------
ALTER TABLE public.client_catalogue_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_pricing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_price_slabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_category_pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_product_profit_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retail_market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.client_catalogue_items FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.client_pricing_settings FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.client_price_slabs FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.global_category_pricing_rules FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.client_product_profit_rules FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.retail_market_prices FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.cart_items FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.stock_reservations FROM PUBLIC, anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.client_catalogue_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.client_pricing_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.client_price_slabs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.global_category_pricing_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.client_product_profit_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.retail_market_prices TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cart_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.stock_reservations TO authenticated;

-- client_catalogue_items policies
DROP POLICY IF EXISTS client_catalogue_select ON public.client_catalogue_items;
CREATE POLICY client_catalogue_select ON public.client_catalogue_items
  FOR SELECT TO authenticated
  USING (
    (
      app.is_nido_internal()
      AND (
        app.has_nido_permission('clients', 'view')
        OR app.has_nido_permission('platform_configuration_pricing', 'view')
        OR app.has_nido_permission('shop', 'view')
      )
    )
    OR (
      client_id = app.current_client_id()
      AND publish_status = 'published'
      AND status = 'Active'
      AND visibility = 'visible'
    )
  );

DROP POLICY IF EXISTS client_catalogue_insert ON public.client_catalogue_items;
CREATE POLICY client_catalogue_insert ON public.client_catalogue_items
  FOR INSERT TO authenticated
  WITH CHECK (
    app.is_nido_internal()
    AND (
      app.has_nido_permission('clients', 'edit')
      OR app.has_nido_permission('clients', 'create')
    )
  );

DROP POLICY IF EXISTS client_catalogue_update ON public.client_catalogue_items;
CREATE POLICY client_catalogue_update ON public.client_catalogue_items
  FOR UPDATE TO authenticated
  USING (
    app.is_nido_internal()
    AND (
      app.has_nido_permission('clients', 'edit')
      OR app.has_nido_permission('platform_configuration_pricing', 'edit')
    )
  )
  WITH CHECK (
    app.is_nido_internal()
    AND (
      app.has_nido_permission('clients', 'edit')
      OR app.has_nido_permission('platform_configuration_pricing', 'edit')
    )
  );

DROP POLICY IF EXISTS client_catalogue_delete ON public.client_catalogue_items;
CREATE POLICY client_catalogue_delete ON public.client_catalogue_items
  FOR DELETE TO authenticated
  USING (
    app.is_nido_internal()
    AND (
      app.has_nido_permission('clients', 'edit')
      OR app.has_nido_permission('clients', 'delete')
    )
  );

-- Client Price Engine tables policies
DROP POLICY IF EXISTS client_pricing_settings_select ON public.client_pricing_settings;
CREATE POLICY client_pricing_settings_select ON public.client_pricing_settings
  FOR SELECT TO authenticated
  USING (
    (app.is_nido_internal() AND (app.has_nido_permission('clients', 'view') OR app.has_nido_permission('platform_configuration_pricing', 'view')))
    OR client_id = app.current_client_id()
  );

DROP POLICY IF EXISTS client_pricing_settings_write ON public.client_pricing_settings;
CREATE POLICY client_pricing_settings_write ON public.client_pricing_settings
  FOR ALL TO authenticated
  USING (app.is_nido_internal() AND (app.has_nido_permission('clients', 'edit') OR app.has_nido_permission('platform_configuration_pricing', 'edit')))
  WITH CHECK (app.is_nido_internal() AND (app.has_nido_permission('clients', 'edit') OR app.has_nido_permission('platform_configuration_pricing', 'edit')));

DROP POLICY IF EXISTS client_price_slabs_select ON public.client_price_slabs;
CREATE POLICY client_price_slabs_select ON public.client_price_slabs
  FOR SELECT TO authenticated
  USING (
    (app.is_nido_internal() AND (app.has_nido_permission('clients', 'view') OR app.has_nido_permission('platform_configuration_pricing', 'view')))
    OR client_id = app.current_client_id()
  );

DROP POLICY IF EXISTS client_price_slabs_write ON public.client_price_slabs;
CREATE POLICY client_price_slabs_write ON public.client_price_slabs
  FOR ALL TO authenticated
  USING (app.is_nido_internal() AND (app.has_nido_permission('clients', 'edit') OR app.has_nido_permission('platform_configuration_pricing', 'edit')))
  WITH CHECK (app.is_nido_internal() AND (app.has_nido_permission('clients', 'edit') OR app.has_nido_permission('platform_configuration_pricing', 'edit')));

DROP POLICY IF EXISTS global_category_pricing_rules_select ON public.global_category_pricing_rules;
CREATE POLICY global_category_pricing_rules_select ON public.global_category_pricing_rules
  FOR SELECT TO authenticated
  USING (app.is_nido_internal() OR app.current_client_id() IS NOT NULL);

DROP POLICY IF EXISTS global_category_pricing_rules_write ON public.global_category_pricing_rules;
CREATE POLICY global_category_pricing_rules_write ON public.global_category_pricing_rules
  FOR ALL TO authenticated
  USING (app.is_nido_internal() AND app.has_nido_permission('platform_configuration_pricing', 'edit'))
  WITH CHECK (app.is_nido_internal() AND app.has_nido_permission('platform_configuration_pricing', 'edit'));

DROP POLICY IF EXISTS client_product_profit_rules_select ON public.client_product_profit_rules;
CREATE POLICY client_product_profit_rules_select ON public.client_product_profit_rules
  FOR SELECT TO authenticated
  USING (
    (app.is_nido_internal() AND (app.has_nido_permission('clients', 'view') OR app.has_nido_permission('platform_configuration_pricing', 'view')))
    OR client_id = app.current_client_id()
  );

DROP POLICY IF EXISTS client_product_profit_rules_write ON public.client_product_profit_rules;
CREATE POLICY client_product_profit_rules_write ON public.client_product_profit_rules
  FOR ALL TO authenticated
  USING (app.is_nido_internal() AND (app.has_nido_permission('clients', 'edit') OR app.has_nido_permission('platform_configuration_pricing', 'edit')))
  WITH CHECK (app.is_nido_internal() AND (app.has_nido_permission('clients', 'edit') OR app.has_nido_permission('platform_configuration_pricing', 'edit')));

DROP POLICY IF EXISTS retail_market_prices_select ON public.retail_market_prices;
CREATE POLICY retail_market_prices_select ON public.retail_market_prices
  FOR SELECT TO authenticated
  USING (app.is_nido_internal() AND (app.has_nido_permission('clients', 'view') OR app.has_nido_permission('platform_configuration_pricing', 'view')));

DROP POLICY IF EXISTS retail_market_prices_write ON public.retail_market_prices;
CREATE POLICY retail_market_prices_write ON public.retail_market_prices
  FOR ALL TO authenticated
  USING (app.is_nido_internal() AND (app.has_nido_permission('clients', 'edit') OR app.has_nido_permission('platform_configuration_pricing', 'edit')))
  WITH CHECK (app.is_nido_internal() AND (app.has_nido_permission('clients', 'edit') OR app.has_nido_permission('platform_configuration_pricing', 'edit')));

-- cart_items & stock_reservations policies
DROP POLICY IF EXISTS cart_items_owner ON public.cart_items;
CREATE POLICY cart_items_owner ON public.cart_items
  FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    AND (client_id = app.current_client_id() OR app.is_nido_internal())
  )
  WITH CHECK (
    user_id = auth.uid()
    AND (client_id = app.current_client_id() OR app.is_nido_internal())
  );

DROP POLICY IF EXISTS stock_reservations_owner ON public.stock_reservations;
CREATE POLICY stock_reservations_owner ON public.stock_reservations
  FOR ALL TO authenticated
  USING (
    (user_id = auth.uid() AND (client_id = app.current_client_id() OR app.is_nido_internal()))
    OR (app.is_nido_internal() AND app.has_nido_permission('vendors', 'view'))
  )
  WITH CHECK (
    user_id = auth.uid()
    AND (client_id = app.current_client_id() OR app.is_nido_internal())
  );

-- ----------------------------------------------------------------------------
-- 5. Atomic Stock Reservation & Shop Vendor RPCs
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_shop_vendor_options(
  p_client_id uuid,
  p_master_catalogue_item_id uuid
)
RETURNS TABLE (
  vendor_id uuid,
  vendor_name text,
  vendor_rating numeric,
  payment_terms text,
  vendor_product_id uuid,
  vendor_product_code text,
  base_price numeric,
  moq integer,
  lead_time text,
  physical_stock integer,
  reserved_stock integer,
  available_stock integer,
  incoming_stock integer,
  digital_availability text,
  variations jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF NOT (app.is_nido_internal() OR app.current_client_id() = p_client_id) THEN
    RAISE EXCEPTION 'Forbidden client scope' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.client_catalogue_items cci
    WHERE cci.client_id = p_client_id
      AND cci.master_catalogue_item_id = p_master_catalogue_item_id
      AND cci.status = 'Active'
      AND (app.is_nido_internal() OR (cci.publish_status = 'published' AND cci.visibility = 'visible'))
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    v.id AS vendor_id,
    v.name AS vendor_name,
    COALESCE(v.rating, 0) AS vendor_rating,
    COALESCE(v.payment_terms, '') AS payment_terms,
    vp.id AS vendor_product_id,
    vp.vendor_product_code,
    COALESCE(vp.price, 0) AS base_price,
    COALESCE(vp.moq, 1) AS moq,
    COALESCE(vp.lead_time, '') AS lead_time,
    COALESCE(vp.physical_stock, 0) AS physical_stock,
    COALESCE(vp.reserved_stock, 0) AS reserved_stock,
    GREATEST(0, COALESCE(vp.physical_stock, 0) - COALESCE(vp.reserved_stock, 0)) AS available_stock,
    COALESCE(vp.incoming_stock, 0) AS incoming_stock,
    vp.digital_availability,
    COALESCE(vp.variations, '[]'::jsonb) AS variations
  FROM public.vendor_products vp
  JOIN public.vendors v ON v.id = vp.vendor_id
  WHERE vp.master_catalogue_item_id = p_master_catalogue_item_id
    AND vp.status = 'Active'
    AND v.archived = false
    AND v.status = 'Active'
  ORDER BY COALESCE(vp.price, 0) ASC, COALESCE(v.rating, 0) DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.reserve_cart_item_stock(
  p_client_id uuid,
  p_master_catalogue_item_id uuid,
  p_vendor_id uuid,
  p_quantity integer,
  p_configuration jsonb DEFAULT '{}'::jsonb,
  p_configuration_key text DEFAULT '',
  p_configuration_price_adjustment numeric DEFAULT 0,
  p_unit_price_inclusive numeric DEFAULT 0,
  p_client_selling_price_excl_gst numeric DEFAULT 0,
  p_landed_cost numeric DEFAULT 0,
  p_gst_snapshot numeric DEFAULT NULL,
  p_hsn_snapshot text DEFAULT NULL,
  p_fulfillment_type text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS public.cart_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_vp public.vendor_products%ROWTYPE;
  v_vendor public.vendors%ROWTYPE;
  v_available integer;
  v_is_digital boolean;
  v_existing public.cart_items%ROWTYPE;
  v_cart_item public.cart_items%ROWTYPE;
  v_new_qty integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF NOT (app.is_nido_internal() OR app.current_client_id() = p_client_id) THEN
    RAISE EXCEPTION 'Cannot reserve stock for another client' USING ERRCODE = '42501';
  END IF;
  IF p_quantity IS NULL OR p_quantity < 1 THEN
    RAISE EXCEPTION 'Quantity must be at least 1' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.client_catalogue_items cci
    WHERE cci.client_id = p_client_id
      AND cci.master_catalogue_item_id = p_master_catalogue_item_id
      AND cci.status = 'Active'
      AND (app.is_nido_internal() OR (cci.publish_status = 'published' AND cci.visibility = 'visible'))
  ) THEN
    RAISE EXCEPTION 'Product is not assigned or published for this client' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_vendor FROM public.vendors WHERE id = p_vendor_id AND archived = false;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Selected vendor is unavailable' USING ERRCODE = '23503';
  END IF;

  SELECT * INTO v_vp
  FROM public.vendor_products
  WHERE vendor_id = p_vendor_id
    AND master_catalogue_item_id = p_master_catalogue_item_id
    AND status = 'Active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Selected vendor does not supply this product' USING ERRCODE = '23503';
  END IF;

  v_is_digital := lower(COALESCE(p_fulfillment_type, '')) = 'digital';
  IF NOT v_is_digital THEN
    IF p_quantity < GREATEST(1, COALESCE(v_vp.moq, 1)) THEN
      RAISE EXCEPTION 'Quantity (%) is below vendor MOQ (%)', p_quantity, GREATEST(1, COALESCE(v_vp.moq, 1)) USING ERRCODE = '22023';
    END IF;
    v_available := GREATEST(0, COALESCE(v_vp.physical_stock, 0) - COALESCE(v_vp.reserved_stock, 0));
    IF v_available < p_quantity THEN
      RAISE EXCEPTION 'Insufficient stock available (% available, % requested)', v_available, p_quantity USING ERRCODE = '22023';
    END IF;
    UPDATE public.vendor_products
    SET reserved_stock = COALESCE(reserved_stock, 0) + p_quantity,
        last_stock_update = now()
    WHERE id = v_vp.id;
  END IF;

  SELECT * INTO v_existing
  FROM public.cart_items
  WHERE user_id = v_uid
    AND client_id = p_client_id
    AND master_catalogue_item_id = p_master_catalogue_item_id
    AND COALESCE(vendor_id, '00000000-0000-0000-0000-000000000000'::uuid) = p_vendor_id
    AND configuration_key = COALESCE(p_configuration_key, '');

  IF FOUND THEN
    v_new_qty := v_existing.quantity + p_quantity;
    UPDATE public.cart_items
    SET quantity = v_new_qty,
        unit_price_inclusive = COALESCE(NULLIF(p_unit_price_inclusive, 0), unit_price_inclusive),
        client_selling_price_excl_gst = COALESCE(NULLIF(p_client_selling_price_excl_gst, 0), client_selling_price_excl_gst),
        vendor_price = COALESCE(v_vp.price, vendor_price),
        landed_cost = COALESCE(NULLIF(p_landed_cost, 0), landed_cost),
        updated_at = now()
    WHERE id = v_existing.id
    RETURNING * INTO v_cart_item;
  ELSE
    INSERT INTO public.cart_items (
      user_id, client_id, master_catalogue_item_id, vendor_id, vendor_product_id,
      quantity, configuration, configuration_key, configuration_price_adjustment,
      unit_price_inclusive, client_selling_price_excl_gst, vendor_price, landed_cost,
      gst_snapshot, hsn_snapshot, vendor_rating, lead_time, moq, fulfillment_type, metadata
    ) VALUES (
      v_uid, p_client_id, p_master_catalogue_item_id, p_vendor_id, v_vp.id,
      p_quantity, COALESCE(p_configuration, '{}'::jsonb), COALESCE(p_configuration_key, ''),
      COALESCE(p_configuration_price_adjustment, 0),
      COALESCE(p_unit_price_inclusive, 0), COALESCE(p_client_selling_price_excl_gst, 0),
      COALESCE(v_vp.price, 0), COALESCE(p_landed_cost, 0),
      p_gst_snapshot, p_hsn_snapshot, v_vendor.rating, v_vp.lead_time,
      GREATEST(1, COALESCE(v_vp.moq, 1)), p_fulfillment_type, COALESCE(p_metadata, '{}'::jsonb)
    )
    RETURNING * INTO v_cart_item;
  END IF;

  IF NOT v_is_digital THEN
    INSERT INTO public.stock_reservations (
      client_id, user_id, cart_item_id, vendor_id, vendor_product_id,
      master_catalogue_item_id, quantity, status
    ) VALUES (
      p_client_id, v_uid, v_cart_item.id, p_vendor_id, v_vp.id,
      p_master_catalogue_item_id, p_quantity, 'active'
    );
  END IF;

  RETURN v_cart_item;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_cart_item_quantity_atomic(
  p_cart_item_id uuid,
  p_new_quantity integer
)
RETURNS public.cart_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_item public.cart_items%ROWTYPE;
  v_vp public.vendor_products%ROWTYPE;
  v_delta integer;
  v_available integer;
  v_is_digital boolean;
  v_updated public.cart_items%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_item
  FROM public.cart_items
  WHERE id = p_cart_item_id
    AND user_id = v_uid
    AND (app.is_nido_internal() OR client_id = app.current_client_id())
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cart item not found or access denied' USING ERRCODE = '42501';
  END IF;

  IF p_new_quantity <= 0 THEN
    PERFORM public.remove_cart_item_and_release(p_cart_item_id);
    RETURN NULL;
  END IF;

  v_is_digital := lower(COALESCE(v_item.fulfillment_type, '')) = 'digital';
  IF NOT v_is_digital AND p_new_quantity < GREATEST(1, COALESCE(v_item.moq, 1)) THEN
    RAISE EXCEPTION 'Quantity cannot be below MOQ (%)' , GREATEST(1, COALESCE(v_item.moq, 1)) USING ERRCODE = '22023';
  END IF;

  v_delta := p_new_quantity - v_item.quantity;
  IF NOT v_is_digital AND v_delta <> 0 AND v_item.vendor_product_id IS NOT NULL THEN
    SELECT * INTO v_vp FROM public.vendor_products WHERE id = v_item.vendor_product_id FOR UPDATE;
    IF FOUND THEN
      IF v_delta > 0 THEN
        v_available := GREATEST(0, COALESCE(v_vp.physical_stock, 0) - COALESCE(v_vp.reserved_stock, 0));
        IF v_available < v_delta THEN
          RAISE EXCEPTION 'Insufficient stock available (% available, % additional requested)', v_available, v_delta USING ERRCODE = '22023';
        END IF;
        UPDATE public.vendor_products
        SET reserved_stock = COALESCE(reserved_stock, 0) + v_delta,
            last_stock_update = now()
        WHERE id = v_vp.id;

        INSERT INTO public.stock_reservations (
          client_id, user_id, cart_item_id, vendor_id, vendor_product_id,
          master_catalogue_item_id, quantity, status
        ) VALUES (
          v_item.client_id, v_uid, v_item.id, v_vp.vendor_id, v_vp.id,
          v_item.master_catalogue_item_id, v_delta, 'active'
        );
      ELSE
        UPDATE public.vendor_products
        SET reserved_stock = GREATEST(0, COALESCE(reserved_stock, 0) + v_delta),
            last_stock_update = now()
        WHERE id = v_vp.id;
      END IF;
    END IF;
  END IF;

  UPDATE public.cart_items
  SET quantity = p_new_quantity,
      updated_at = now()
  WHERE id = v_item.id
  RETURNING * INTO v_updated;

  RETURN v_updated;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_cart_item_and_release(
  p_cart_item_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_item public.cart_items%ROWTYPE;
  v_is_digital boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_item
  FROM public.cart_items
  WHERE id = p_cart_item_id
    AND user_id = v_uid
    AND (app.is_nido_internal() OR client_id = app.current_client_id())
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_is_digital := lower(COALESCE(v_item.fulfillment_type, '')) = 'digital';
  IF NOT v_is_digital AND v_item.vendor_product_id IS NOT NULL THEN
    UPDATE public.vendor_products
    SET reserved_stock = GREATEST(0, COALESCE(reserved_stock, 0) - v_item.quantity),
        last_stock_update = now()
    WHERE id = v_item.vendor_product_id;
  END IF;

  UPDATE public.stock_reservations
  SET status = 'released', updated_at = now()
  WHERE cart_item_id = v_item.id AND status = 'active';

  DELETE FROM public.cart_items WHERE id = v_item.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.clear_user_cart_and_release(
  p_client_id uuid,
  p_consume boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_item RECORD;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF NOT (app.is_nido_internal() OR app.current_client_id() = p_client_id) THEN
    RAISE EXCEPTION 'Forbidden client scope' USING ERRCODE = '42501';
  END IF;

  IF NOT p_consume THEN
    FOR v_item IN
      SELECT id, vendor_product_id, quantity, fulfillment_type
      FROM public.cart_items
      WHERE user_id = v_uid AND client_id = p_client_id
    LOOP
      IF lower(COALESCE(v_item.fulfillment_type, '')) <> 'digital' AND v_item.vendor_product_id IS NOT NULL THEN
        UPDATE public.vendor_products
        SET reserved_stock = GREATEST(0, COALESCE(reserved_stock, 0) - v_item.quantity),
            last_stock_update = now()
        WHERE id = v_item.vendor_product_id;
      END IF;
    END LOOP;
  END IF;

  UPDATE public.stock_reservations
  SET status = CASE WHEN p_consume THEN 'consumed' ELSE 'released' END,
      updated_at = now()
  WHERE user_id = v_uid AND client_id = p_client_id AND status = 'active';

  DELETE FROM public.cart_items WHERE user_id = v_uid AND client_id = p_client_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_shop_vendor_options(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reserve_cart_item_stock(uuid, uuid, uuid, integer, jsonb, text, numeric, numeric, numeric, numeric, numeric, text, text, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_cart_item_quantity_atomic(uuid, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.remove_cart_item_and_release(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.clear_user_cart_and_release(uuid, boolean) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_shop_vendor_options(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reserve_cart_item_stock(uuid, uuid, uuid, integer, jsonb, text, numeric, numeric, numeric, numeric, numeric, text, text, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_cart_item_quantity_atomic(uuid, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.remove_cart_item_and_release(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.clear_user_cart_and_release(uuid, boolean) TO authenticated, service_role;
