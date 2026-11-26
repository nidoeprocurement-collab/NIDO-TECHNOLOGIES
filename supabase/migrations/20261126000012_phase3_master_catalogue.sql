-- ============================================================================
-- NIDO Phase 3 â€“ Wave 1.1: Master Catalogue & Audit Tables + RLS
-- Target: nido-dev (eicjhhmkpqcnmwrfztit)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.master_catalogue_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_product_code text NOT NULL UNIQUE,
  sku_code text NOT NULL DEFAULT '',
  product_name text NOT NULL CHECK (btrim(product_name) <> ''),
  normalized_name text GENERATED ALWAYS AS (
    lower(btrim(regexp_replace(product_name, '\s+', ' ', 'g')))
  ) STORED,
  product_type text NOT NULL DEFAULT 'Product',
  physical_type text NOT NULL DEFAULT 'Physical Product' CHECK (btrim(physical_type) <> ''),
  category text NOT NULL DEFAULT '',
  subcategory text NOT NULL DEFAULT '',
  brand text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}'::text[],
  description text NOT NULL DEFAULT '',
  specifications jsonb NOT NULL DEFAULT '[]'::jsonb,
  general_specs jsonb NOT NULL DEFAULT '[]'::jsonb,
  variations jsonb NOT NULL DEFAULT '[]'::jsonb,
  product_notes text NOT NULL DEFAULT '',
  video_url text NOT NULL DEFAULT '',
  images text[] NOT NULL DEFAULT '{}'::text[],
  publish_status text NOT NULL DEFAULT 'draft'
    CHECK (publish_status IN ('draft', 'published', 'pending', 'archived')),
  is_active boolean GENERATED ALWAYS AS (publish_status <> 'archived') STORED,
  hsn_code text NOT NULL DEFAULT '',
  gst_percentage numeric(5, 2) NOT NULL DEFAULT 0
    CHECK (gst_percentage >= 0 AND gst_percentage <= 100),
  initial_stock integer NOT NULL DEFAULT 0 CHECK (initial_stock >= 0),
  min_stock_threshold integer NOT NULL DEFAULT 0 CHECK (min_stock_threshold >= 0),
  price numeric(14, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  moq integer NOT NULL DEFAULT 0 CHECK (moq >= 0),
  lead_time text NOT NULL DEFAULT '',
  warranty text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  archived_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_master_catalogue_items_normalized_name UNIQUE (normalized_name)
);

CREATE INDEX IF NOT EXISTS idx_master_catalogue_items_status
  ON public.master_catalogue_items (publish_status);
CREATE INDEX IF NOT EXISTS idx_master_catalogue_items_category
  ON public.master_catalogue_items (category);
CREATE INDEX IF NOT EXISTS idx_master_catalogue_items_physical_type
  ON public.master_catalogue_items (physical_type);
CREATE INDEX IF NOT EXISTS idx_master_catalogue_items_sku_code
  ON public.master_catalogue_items (sku_code);
CREATE INDEX IF NOT EXISTS idx_master_catalogue_items_created_at
  ON public.master_catalogue_items (created_at DESC);

CREATE TABLE IF NOT EXISTS public.master_catalogue_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NULL REFERENCES public.master_catalogue_items(id) ON DELETE SET NULL,
  legacy_item_id text NULL,
  event text NOT NULL CHECK (btrim(event) <> ''),
  detail text NOT NULL DEFAULT '',
  item_name text NULL,
  sku text NULL,
  actor_auth_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name text NOT NULL DEFAULT 'System Owner',
  status text NOT NULL DEFAULT 'Updated'
    CHECK (status IN ('Approved', 'Pending', 'Rejected', 'Draft', 'Archived', 'Updated', 'Deleted')),
  previous_value text NULL,
  new_value text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_master_catalogue_audit_logs_item_id
  ON public.master_catalogue_audit_logs (item_id);
CREATE INDEX IF NOT EXISTS idx_master_catalogue_audit_logs_created_at
  ON public.master_catalogue_audit_logs (created_at DESC);

CREATE OR REPLACE FUNCTION app.trg_master_catalogue_items_before_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.product_name := btrim(regexp_replace(COALESCE(NEW.product_name, ''), '\s+', ' ', 'g'));
  IF NEW.product_name = '' THEN
    RAISE EXCEPTION 'product_name is required' USING ERRCODE = 'not_null_violation';
  END IF;

  NEW.sku_code := btrim(COALESCE(NEW.sku_code, ''));
  NEW.physical_type := COALESCE(NULLIF(btrim(NEW.physical_type), ''), 'Physical Product');

  IF TG_OP = 'INSERT' THEN
    IF btrim(COALESCE(NEW.master_product_code, '')) = '' THEN
      NEW.master_product_code := public.allocate_document_number('MPC', NULL);
    ELSE
      NEW.master_product_code := btrim(NEW.master_product_code);
    END IF;
    NEW.created_at := COALESCE(NEW.created_at, now());
    NEW.created_by := COALESCE(auth.uid(), NEW.created_by);
  ELSE
    NEW.master_product_code := OLD.master_product_code;
    NEW.created_at := OLD.created_at;
    NEW.created_by := OLD.created_by;
  END IF;

  NEW.updated_at := now();
  NEW.updated_by := COALESCE(auth.uid(), NEW.updated_by);

  IF NEW.publish_status = 'archived' THEN
    NEW.archived_at := COALESCE(NEW.archived_at, now());
  ELSE
    NEW.archived_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_master_catalogue_items_before_write ON public.master_catalogue_items;
CREATE TRIGGER trg_master_catalogue_items_before_write
  BEFORE INSERT OR UPDATE ON public.master_catalogue_items
  FOR EACH ROW
  EXECUTE FUNCTION app.trg_master_catalogue_items_before_write();

-- ============================================================================
-- Row-Level Security (Default-Deny, Internal NIDO RBAC Only)
-- ============================================================================

ALTER TABLE public.master_catalogue_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_catalogue_audit_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.master_catalogue_items FROM PUBLIC, anon;
REVOKE ALL ON TABLE public.master_catalogue_audit_logs FROM PUBLIC, anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.master_catalogue_items TO authenticated;
GRANT SELECT, INSERT, DELETE ON TABLE public.master_catalogue_audit_logs TO authenticated;

DROP POLICY IF EXISTS master_catalogue_items_select ON public.master_catalogue_items;
CREATE POLICY master_catalogue_items_select ON public.master_catalogue_items
  FOR SELECT TO authenticated
  USING (
    app.is_nido_internal()
    AND (
      app.has_nido_permission('master_catalogue', 'view')
      OR app.has_nido_permission('platform_configuration_master_catalogue', 'view')
    )
  );

DROP POLICY IF EXISTS master_catalogue_items_insert ON public.master_catalogue_items;
CREATE POLICY master_catalogue_items_insert ON public.master_catalogue_items
  FOR INSERT TO authenticated
  WITH CHECK (
    app.is_nido_internal()
    AND (
      app.has_nido_permission('master_catalogue', 'create')
      OR app.has_nido_permission('platform_configuration_master_catalogue', 'create')
    )
  );

DROP POLICY IF EXISTS master_catalogue_items_update ON public.master_catalogue_items;
CREATE POLICY master_catalogue_items_update ON public.master_catalogue_items
  FOR UPDATE TO authenticated
  USING (
    app.is_nido_internal()
    AND (
      app.has_nido_permission('master_catalogue', 'edit')
      OR app.has_nido_permission('platform_configuration_master_catalogue', 'edit')
    )
  )
  WITH CHECK (
    app.is_nido_internal()
    AND (
      app.has_nido_permission('master_catalogue', 'edit')
      OR app.has_nido_permission('platform_configuration_master_catalogue', 'edit')
    )
  );

DROP POLICY IF EXISTS master_catalogue_items_delete ON public.master_catalogue_items;
CREATE POLICY master_catalogue_items_delete ON public.master_catalogue_items
  FOR DELETE TO authenticated
  USING (
    app.is_nido_internal()
    AND (
      app.has_nido_permission('master_catalogue', 'delete')
      OR app.has_nido_permission('platform_configuration_master_catalogue', 'delete')
    )
  );

DROP POLICY IF EXISTS master_catalogue_audit_logs_select ON public.master_catalogue_audit_logs;
CREATE POLICY master_catalogue_audit_logs_select ON public.master_catalogue_audit_logs
  FOR SELECT TO authenticated
  USING (
    app.is_nido_internal()
    AND (
      app.has_nido_permission('master_catalogue', 'view')
      OR app.has_nido_permission('platform_configuration_master_catalogue', 'view')
    )
  );

DROP POLICY IF EXISTS master_catalogue_audit_logs_insert ON public.master_catalogue_audit_logs;
CREATE POLICY master_catalogue_audit_logs_insert ON public.master_catalogue_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    app.is_nido_internal()
    AND (
      app.has_nido_permission('master_catalogue', 'create')
      OR app.has_nido_permission('master_catalogue', 'edit')
      OR app.has_nido_permission('platform_configuration_master_catalogue', 'create')
      OR app.has_nido_permission('platform_configuration_master_catalogue', 'edit')
    )
  );

DROP POLICY IF EXISTS master_catalogue_audit_logs_delete ON public.master_catalogue_audit_logs;
CREATE POLICY master_catalogue_audit_logs_delete ON public.master_catalogue_audit_logs
  FOR DELETE TO authenticated
  USING (
    app.is_nido_internal()
    AND (
      app.has_nido_permission('master_catalogue', 'delete')
      OR app.has_nido_permission('platform_configuration_master_catalogue', 'delete')
    )
  );
