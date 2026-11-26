-- ============================================================================
-- NIDO Phase 3 – Wave 1.2: Vendors & Vendor Products + RLS
-- Target: nido-dev (eicjhhmkpqcnmwrfztit)
-- ============================================================================

INSERT INTO public.document_sequences (
  seq_key, prefix, next_value, pad_length, include_year, year_separator, description
)
VALUES (
  'VND', 'VND-', 1006, 4, false, '-', 'Vendor business code (VND-NNNN)'
)
ON CONFLICT (seq_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_code text NOT NULL UNIQUE,
  name text NOT NULL CHECK (btrim(name) <> ''),
  normalized_name text GENERATED ALWAYS AS (
    lower(btrim(regexp_replace(name, '\s+', ' ', 'g')))
  ) STORED,
  legal_business_name text NOT NULL DEFAULT '',
  vendor_type text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  primary_contact text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  rating numeric(3, 2) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  region text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Active'
    CHECK (status IN ('Active', 'Inactive', 'On Hold', 'Pending')),
  onboarding_status text NOT NULL DEFAULT 'Approved'
    CHECK (onboarding_status IN ('Pending', 'In Review', 'Approved', 'Rejected')),
  onboarded_date text NOT NULL DEFAULT '',
  archived boolean NOT NULL DEFAULT false,
  archived_on text NULL,
  month_spend numeric(14, 2) NOT NULL DEFAULT 0 CHECK (month_spend >= 0),
  total_spend numeric(14, 2) NOT NULL DEFAULT 0 CHECK (total_spend >= 0),
  score numeric(5, 2) NOT NULL DEFAULT 0 CHECK (score >= 0),
  compliance_issues integer NOT NULL DEFAULT 0 CHECK (compliance_issues >= 0),
  address text NOT NULL DEFAULT '',
  address_line1 text NOT NULL DEFAULT '',
  address_line2 text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  zip_code text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '',
  billing_address_line1 text NOT NULL DEFAULT '',
  billing_address_line2 text NOT NULL DEFAULT '',
  billing_city text NOT NULL DEFAULT '',
  billing_state text NOT NULL DEFAULT '',
  billing_zip text NOT NULL DEFAULT '',
  billing_country text NOT NULL DEFAULT '',
  shipping_address_line1 text NOT NULL DEFAULT '',
  shipping_address_line2 text NOT NULL DEFAULT '',
  shipping_city text NOT NULL DEFAULT '',
  shipping_state text NOT NULL DEFAULT '',
  shipping_zip text NOT NULL DEFAULT '',
  shipping_country text NOT NULL DEFAULT '',
  registration_no text NOT NULL DEFAULT '',
  tax_id text NOT NULL DEFAULT '',
  pan text NOT NULL DEFAULT '',
  founded text NOT NULL DEFAULT '',
  employees text NOT NULL DEFAULT '',
  annual_revenue text NOT NULL DEFAULT '',
  payment_mode text NOT NULL DEFAULT '',
  payment_terms text NOT NULL DEFAULT '',
  credit_period text NOT NULL DEFAULT '',
  bank_account text NOT NULL DEFAULT '',
  ifsc_code text NOT NULL DEFAULT '',
  bank_name text NOT NULL DEFAULT '',
  bank_branch text NOT NULL DEFAULT '',
  documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text NOT NULL DEFAULT '',
  performance_quality numeric(5, 2) NULL,
  performance_delivery numeric(5, 2) NULL,
  performance_responsiveness numeric(5, 2) NULL,
  performance_compliance numeric(5, 2) NULL,
  onboarding_form_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_updated_form_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by_name text NULL,
  created_by_employee_id text NULL,
  created_by_email text NULL,
  updated_by_name text NULL,
  updated_by_employee_id text NULL,
  updated_by_email text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_vendors_normalized_name UNIQUE (normalized_name)
);

CREATE INDEX IF NOT EXISTS idx_vendors_status ON public.vendors (status);
CREATE INDEX IF NOT EXISTS idx_vendors_archived ON public.vendors (archived);
CREATE INDEX IF NOT EXISTS idx_vendors_category ON public.vendors (category);
CREATE INDEX IF NOT EXISTS idx_vendors_created_at ON public.vendors (created_at DESC);

CREATE OR REPLACE FUNCTION app.trg_vendors_before_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.name := btrim(regexp_replace(COALESCE(NEW.name, ''), '\s+', ' ', 'g'));
  IF NEW.name = '' THEN
    RAISE EXCEPTION 'vendor name is required' USING ERRCODE = 'not_null_violation';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF btrim(COALESCE(NEW.vendor_code, '')) = '' THEN
      NEW.vendor_code := public.allocate_document_number('VND', NULL);
    ELSE
      NEW.vendor_code := btrim(NEW.vendor_code);
    END IF;
    NEW.created_at := COALESCE(NEW.created_at, now());
    NEW.created_by := COALESCE(auth.uid(), NEW.created_by);
  ELSE
    NEW.vendor_code := OLD.vendor_code;
    NEW.created_at := OLD.created_at;
    NEW.created_by := OLD.created_by;
  END IF;

  NEW.updated_at := now();
  NEW.updated_by := COALESCE(auth.uid(), NEW.updated_by);

  IF NEW.archived THEN
    NEW.archived_on := COALESCE(NULLIF(btrim(COALESCE(NEW.archived_on, '')), ''), to_char(now(), 'YYYY-MM-DD'));
  ELSE
    NEW.archived_on := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vendors_before_write ON public.vendors;
CREATE TRIGGER trg_vendors_before_write
  BEFORE INSERT OR UPDATE ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION app.trg_vendors_before_write();

CREATE TABLE IF NOT EXISTS public.vendor_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  master_catalogue_item_id uuid NOT NULL REFERENCES public.master_catalogue_items(id) ON DELETE RESTRICT,
  vendor_product_code text NOT NULL,
  vendor_sku text NOT NULL DEFAULT '',
  price numeric(14, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  currency text NOT NULL DEFAULT 'INR',
  moq integer NOT NULL DEFAULT 1 CHECK (moq >= 0),
  lead_time text NOT NULL DEFAULT '',
  physical_stock integer NOT NULL DEFAULT 0 CHECK (physical_stock >= 0),
  reserved_stock integer NOT NULL DEFAULT 0 CHECK (reserved_stock >= 0),
  incoming_stock integer NOT NULL DEFAULT 0 CHECK (incoming_stock >= 0),
  handling_charge numeric(14, 2) NOT NULL DEFAULT 0 CHECK (handling_charge >= 0),
  delivery_charge numeric(14, 2) NOT NULL DEFAULT 0 CHECK (delivery_charge >= 0),
  other_charge numeric(14, 2) NOT NULL DEFAULT 0 CHECK (other_charge >= 0),
  tax_percentage numeric(5, 2) NULL CHECK (tax_percentage IS NULL OR (tax_percentage >= 0 AND tax_percentage <= 100)),
  terms text NOT NULL DEFAULT '',
  variations jsonb NOT NULL DEFAULT '[]'::jsonb,
  digital_availability text NULL CHECK (digital_availability IS NULL OR digital_availability IN ('available', 'not_available')),
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  last_stock_update timestamptz NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_vendor_products_vendor_master UNIQUE (vendor_id, master_catalogue_item_id)
);

CREATE INDEX IF NOT EXISTS idx_vendor_products_vendor_id ON public.vendor_products (vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_products_master_id ON public.vendor_products (master_catalogue_item_id);
CREATE INDEX IF NOT EXISTS idx_vendor_products_status ON public.vendor_products (status);

CREATE OR REPLACE FUNCTION app.trg_vendor_products_before_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF btrim(COALESCE(NEW.vendor_product_code, '')) = '' THEN
      NEW.vendor_product_code := public.allocate_document_number('VPC', NULL);
    ELSE
      NEW.vendor_product_code := btrim(NEW.vendor_product_code);
    END IF;
    NEW.created_at := COALESCE(NEW.created_at, now());
    NEW.created_by := COALESCE(auth.uid(), NEW.created_by);
    NEW.added_at := COALESCE(NEW.added_at, now());
  ELSE
    NEW.vendor_id := OLD.vendor_id;
    NEW.master_catalogue_item_id := OLD.master_catalogue_item_id;
    NEW.created_at := OLD.created_at;
    NEW.created_by := OLD.created_by;
  END IF;

  NEW.updated_at := now();
  NEW.updated_by := COALESCE(auth.uid(), NEW.updated_by);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_vendor_products_before_write ON public.vendor_products;
CREATE TRIGGER trg_vendor_products_before_write
  BEFORE INSERT OR UPDATE ON public.vendor_products
  FOR EACH ROW
  EXECUTE FUNCTION app.trg_vendor_products_before_write();

CREATE TABLE IF NOT EXISTS public.vendor_price_engine_settings (
  vendor_id uuid PRIMARY KEY REFERENCES public.vendors(id) ON DELETE CASCADE,
  logistics_pct numeric(7, 2) NOT NULL DEFAULT 0 CHECK (logistics_pct >= 0),
  handling_pct numeric(7, 2) NOT NULL DEFAULT 0 CHECK (handling_pct >= 0),
  extra_charges jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================================
-- Row-Level Security (Default-Deny, Internal NIDO RBAC Only)
-- ============================================================================

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_price_engine_settings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.vendors FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.vendor_products FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.vendor_price_engine_settings FROM PUBLIC, anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.vendors TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.vendor_products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.vendor_price_engine_settings TO authenticated;

-- vendors policies
DROP POLICY IF EXISTS vendors_select ON public.vendors;
CREATE POLICY vendors_select ON public.vendors
  FOR SELECT TO authenticated
  USING (
    app.is_nido_internal()
    AND (
      app.has_nido_permission('vendors', 'view')
      OR app.has_nido_permission('platform_vendors', 'view')
      OR app.has_nido_permission('platform_vendors_onboarding', 'view')
    )
  );

DROP POLICY IF EXISTS vendors_insert ON public.vendors;
CREATE POLICY vendors_insert ON public.vendors
  FOR INSERT TO authenticated
  WITH CHECK (
    app.is_nido_internal()
    AND (
      app.has_nido_permission('vendors', 'create')
      OR app.has_nido_permission('platform_vendors', 'create')
      OR app.has_nido_permission('platform_vendors_onboarding', 'create')
    )
  );

DROP POLICY IF EXISTS vendors_update ON public.vendors;
CREATE POLICY vendors_update ON public.vendors
  FOR UPDATE TO authenticated
  USING (
    app.is_nido_internal()
    AND (
      app.has_nido_permission('vendors', 'edit')
      OR app.has_nido_permission('platform_vendors', 'edit')
      OR app.has_nido_permission('platform_vendors_onboarding', 'edit')
    )
  )
  WITH CHECK (
    app.is_nido_internal()
    AND (
      app.has_nido_permission('vendors', 'edit')
      OR app.has_nido_permission('platform_vendors', 'edit')
      OR app.has_nido_permission('platform_vendors_onboarding', 'edit')
    )
  );

DROP POLICY IF EXISTS vendors_delete ON public.vendors;
CREATE POLICY vendors_delete ON public.vendors
  FOR DELETE TO authenticated
  USING (
    app.is_nido_internal()
    AND (
      app.has_nido_permission('vendors', 'delete')
      OR app.has_nido_permission('platform_vendors', 'delete')
    )
  );

-- vendor_products policies
DROP POLICY IF EXISTS vendor_products_select ON public.vendor_products;
CREATE POLICY vendor_products_select ON public.vendor_products
  FOR SELECT TO authenticated
  USING (
    app.is_nido_internal()
    AND (
      app.has_nido_permission('vendors', 'view')
      OR app.has_nido_permission('platform_vendors', 'view')
      OR app.has_nido_permission('platform_configuration_pricing', 'view')
    )
  );

DROP POLICY IF EXISTS vendor_products_insert ON public.vendor_products;
CREATE POLICY vendor_products_insert ON public.vendor_products
  FOR INSERT TO authenticated
  WITH CHECK (
    app.is_nido_internal()
    AND (
      app.has_nido_permission('vendors', 'create')
      OR app.has_nido_permission('vendors', 'edit')
      OR app.has_nido_permission('platform_vendors', 'create')
      OR app.has_nido_permission('platform_vendors', 'edit')
    )
  );

DROP POLICY IF EXISTS vendor_products_update ON public.vendor_products;
CREATE POLICY vendor_products_update ON public.vendor_products
  FOR UPDATE TO authenticated
  USING (
    app.is_nido_internal()
    AND (
      app.has_nido_permission('vendors', 'edit')
      OR app.has_nido_permission('platform_vendors', 'edit')
      OR app.has_nido_permission('platform_configuration_pricing', 'edit')
    )
  )
  WITH CHECK (
    app.is_nido_internal()
    AND (
      app.has_nido_permission('vendors', 'edit')
      OR app.has_nido_permission('platform_vendors', 'edit')
      OR app.has_nido_permission('platform_configuration_pricing', 'edit')
    )
  );

DROP POLICY IF EXISTS vendor_products_delete ON public.vendor_products;
CREATE POLICY vendor_products_delete ON public.vendor_products
  FOR DELETE TO authenticated
  USING (
    app.is_nido_internal()
    AND (
      app.has_nido_permission('vendors', 'delete')
      OR app.has_nido_permission('platform_vendors', 'delete')
    )
  );

-- vendor_price_engine_settings policies
DROP POLICY IF EXISTS vendor_price_engine_settings_select ON public.vendor_price_engine_settings;
CREATE POLICY vendor_price_engine_settings_select ON public.vendor_price_engine_settings
  FOR SELECT TO authenticated
  USING (
    app.is_nido_internal()
    AND (
      app.has_nido_permission('vendors', 'view')
      OR app.has_nido_permission('platform_vendors', 'view')
      OR app.has_nido_permission('platform_configuration_pricing', 'view')
    )
  );

DROP POLICY IF EXISTS vendor_price_engine_settings_write ON public.vendor_price_engine_settings;
CREATE POLICY vendor_price_engine_settings_write ON public.vendor_price_engine_settings
  FOR ALL TO authenticated
  USING (
    app.is_nido_internal()
    AND (
      app.has_nido_permission('vendors', 'edit')
      OR app.has_nido_permission('platform_vendors', 'edit')
      OR app.has_nido_permission('platform_configuration_pricing', 'edit')
    )
  )
  WITH CHECK (
    app.is_nido_internal()
    AND (
      app.has_nido_permission('vendors', 'edit')
      OR app.has_nido_permission('platform_vendors', 'edit')
      OR app.has_nido_permission('platform_configuration_pricing', 'edit')
    )
  );
