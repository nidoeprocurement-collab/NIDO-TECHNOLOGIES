-- Phase 2B: Users, Authentication Mapping, Security Helpers & RLS
-- Target: nido-dev (eicjhhmkpqcnmwrfztit)
-- Depends on: Phase 1 (000001-000003) and Phase 2A (000004)
-- Strictly adheres to Phase 2A schema and status values.

-- ============================================================================
-- 1. NON-EXPOSED SECURITY SCHEMA (app)
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS app;
REVOKE ALL ON SCHEMA app FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA app TO authenticated, service_role;

-- ============================================================================
-- 2. AUTH IDENTITY REGISTRY, PROFILE TABLES & LOGIN HISTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.auth_identity_registry (
  auth_user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  user_scope text NOT NULL CHECK (user_scope IN ('nido_internal', 'client_portal')),
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_auth_identity_registry_id_scope_email UNIQUE (auth_user_id, user_scope, email)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_auth_identity_registry_email_lower
  ON public.auth_identity_registry (lower(email));

DROP TRIGGER IF EXISTS trg_auth_identity_registry_updated_at ON public.auth_identity_registry;
CREATE TRIGGER trg_auth_identity_registry_updated_at
  BEFORE UPDATE ON public.auth_identity_registry
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.nido_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE RESTRICT,
  user_scope text NOT NULL DEFAULT 'nido_internal' CHECK (user_scope = 'nido_internal'),
  legacy_user_id text UNIQUE,
  nido_org_id uuid REFERENCES public.nido_organizations(id) ON DELETE RESTRICT,
  employee_id text NOT NULL UNIQUE,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  role_id uuid NOT NULL REFERENCES public.nido_roles(id) ON DELETE RESTRICT,
  job_title text,
  designation text,
  reporting_manager_id uuid REFERENCES public.nido_users(id) ON DELETE SET NULL,
  reporting_manager_name text,
  department text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended')),
  date_of_joining date,
  force_password_change boolean NOT NULL DEFAULT false,
  last_login_at timestamptz,
  deactivated_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT fk_nido_users_identity
    FOREIGN KEY (auth_user_id, user_scope, email)
    REFERENCES public.auth_identity_registry(auth_user_id, user_scope, email)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_nido_users_role ON public.nido_users (role_id);
CREATE INDEX IF NOT EXISTS idx_nido_users_status ON public.nido_users (status);
CREATE INDEX IF NOT EXISTS idx_nido_users_org ON public.nido_users (nido_org_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_nido_users_email_lower ON public.nido_users (lower(email));

DROP TRIGGER IF EXISTS trg_nido_users_updated_at ON public.nido_users;
CREATE TRIGGER trg_nido_users_updated_at
  BEFORE UPDATE ON public.nido_users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.client_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE RESTRICT,
  user_scope text NOT NULL DEFAULT 'client_portal' CHECK (user_scope = 'client_portal'),
  legacy_user_id text UNIQUE,
  client_id uuid NOT NULL REFERENCES public.client_organizations(id) ON DELETE RESTRICT,
  client_employee_code text,
  user_type text NOT NULL CHECK (user_type IN ('client_admin', 'client_user')),
  client_role_id uuid,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  department text,
  designation text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  provision_reason text,
  provisioned_at timestamptz,
  last_login_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT chk_client_users_role_required CHECK (
    user_type = 'client_admin' OR client_role_id IS NOT NULL
  ),
  CONSTRAINT fk_client_users_identity
    FOREIGN KEY (auth_user_id, user_scope, email)
    REFERENCES public.auth_identity_registry(auth_user_id, user_scope, email)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_client_users_role_tenant
    FOREIGN KEY (client_role_id, client_id)
    REFERENCES public.client_roles(id, client_id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_client_users_client ON public.client_users (client_id);
CREATE INDEX IF NOT EXISTS idx_client_users_status ON public.client_users (client_id, status);
CREATE INDEX IF NOT EXISTS idx_client_users_role ON public.client_users (client_role_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_client_users_email_lower ON public.client_users (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS uq_client_users_emp_code
  ON public.client_users (client_id, client_employee_code)
  WHERE client_employee_code IS NOT NULL;

DROP TRIGGER IF EXISTS trg_client_users_updated_at ON public.client_users;
CREATE TRIGGER trg_client_users_updated_at
  BEFORE UPDATE ON public.client_users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.nido_login_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  user_scope text NOT NULL CHECK (user_scope IN ('nido_internal', 'client_portal', 'unknown')),
  result text NOT NULL CHECK (
    result IN ('success', 'invalid_credentials', 'inactive', 'suspended', 'locked', 'unprovisioned')
  ),
  event_source text NOT NULL DEFAULT 'trusted_server' CHECK (
    event_source IN ('trusted_server', 'client_post_auth')
  ),
  ip_address inet,
  client_reported_device text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nido_login_history_auth_user
  ON public.nido_login_history (auth_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nido_login_history_created
  ON public.nido_login_history (created_at DESC);

-- Single System Owner role constraint on Phase 2A nido_roles
CREATE UNIQUE INDEX IF NOT EXISTS uq_nido_roles_single_system_owner
  ON public.nido_roles (is_system_owner)
  WHERE is_system_owner = true;

-- ============================================================================
-- 3. SECURITY HELPER FUNCTIONS (app SCHEMA — NON-EXPOSED)
-- ============================================================================

CREATE OR REPLACE FUNCTION app.is_trusted_backend()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT
    pg_catalog.current_setting('request.jwt.claim.role', true) = 'service_role'
    OR (
      auth.uid() IS NULL
      AND NULLIF(pg_catalog.current_setting('request.jwt.claim.role', true), '') IS NULL
      AND (
        SESSION_USER IN ('postgres', 'supabase_admin')
        OR pg_catalog.pg_has_role(SESSION_USER, 'postgres', 'MEMBER')
      )
    );
$$;

CREATE OR REPLACE FUNCTION app.has_verified_auth_email(
  p_auth_user_id uuid,
  p_profile_email text,
  p_metadata jsonb
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT
    COALESCE(p_metadata ->> 'email_sync_status', 'synced') <> 'mismatch_pending'
    AND EXISTS (
      SELECT 1
      FROM auth.users au
      WHERE au.id = p_auth_user_id
        AND au.email IS NOT NULL
        AND lower(pg_catalog.btrim(au.email)) = lower(pg_catalog.btrim(p_profile_email))
    );
$$;

CREATE OR REPLACE FUNCTION app.is_nido_internal()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.nido_users u
    JOIN public.nido_roles r ON r.id = u.role_id
    LEFT JOIN public.nido_organizations o ON o.id = u.nido_org_id
    WHERE u.auth_user_id = auth.uid()
      AND u.status = 'Active'
      AND r.status = 'Active'
      AND (u.nido_org_id IS NULL OR o.status = 'Active')
      AND app.has_verified_auth_email(u.auth_user_id, u.email, u.metadata)
  );
$$;

CREATE OR REPLACE FUNCTION app.is_system_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.nido_users u
    JOIN public.nido_roles r ON r.id = u.role_id
    LEFT JOIN public.nido_organizations o ON o.id = u.nido_org_id
    WHERE u.auth_user_id = auth.uid()
      AND u.status = 'Active'
      AND r.status = 'Active'
      AND r.is_system_owner = true
      AND (u.nido_org_id IS NULL OR o.status = 'Active')
      AND app.has_verified_auth_email(u.auth_user_id, u.email, u.metadata)
  );
$$;

CREATE OR REPLACE FUNCTION app.current_nido_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT u.id
  FROM public.nido_users u
  JOIN public.nido_roles r ON r.id = u.role_id
  LEFT JOIN public.nido_organizations o ON o.id = u.nido_org_id
  WHERE u.auth_user_id = auth.uid()
    AND u.status = 'Active'
    AND r.status = 'Active'
    AND (u.nido_org_id IS NULL OR o.status = 'Active')
    AND app.has_verified_auth_email(u.auth_user_id, u.email, u.metadata)
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION app.current_client_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT cu.client_id
  FROM public.client_users cu
  JOIN public.client_organizations co ON co.id = cu.client_id
  LEFT JOIN public.client_roles cr ON cr.id = cu.client_role_id AND cr.client_id = cu.client_id
  WHERE cu.auth_user_id = auth.uid()
    AND cu.status = 'active'
    AND co.status = 'Active'
    AND (cu.client_role_id IS NULL OR cr.status = 'active')
    AND (cu.user_type = 'client_admin' OR cu.client_role_id IS NOT NULL)
    AND app.has_verified_auth_email(cu.auth_user_id, cu.email, cu.metadata)
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION app.is_client_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.client_users cu
    JOIN public.client_organizations co ON co.id = cu.client_id
    LEFT JOIN public.client_roles cr ON cr.id = cu.client_role_id AND cr.client_id = cu.client_id
    WHERE cu.auth_user_id = auth.uid()
      AND cu.user_type = 'client_admin'
      AND cu.status = 'active'
      AND co.status = 'Active'
      AND (cu.client_role_id IS NULL OR cr.status = 'active')
      AND app.has_verified_auth_email(cu.auth_user_id, cu.email, cu.metadata)
  );
$$;

CREATE OR REPLACE FUNCTION app.has_nido_permission(
  p_module_key text,
  p_action text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_role_id uuid;
  v_is_owner boolean;
  v_parent_key text;
  v_allowed boolean;
BEGIN
  IF p_action NOT IN ('view','create','edit','delete','approve','export','import','manage','configure') THEN
    RETURN false;
  END IF;

  SELECT u.role_id, r.is_system_owner
  INTO v_role_id, v_is_owner
  FROM public.nido_users u
  JOIN public.nido_roles r ON r.id = u.role_id
  LEFT JOIN public.nido_organizations o ON o.id = u.nido_org_id
  WHERE u.auth_user_id = auth.uid()
    AND u.status = 'Active'
    AND r.status = 'Active'
    AND (u.nido_org_id IS NULL OR o.status = 'Active')
    AND app.has_verified_auth_email(u.auth_user_id, u.email, u.metadata)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_is_owner THEN
    RETURN true;
  END IF;

  SELECT CASE p_action
    WHEN 'view' THEN rp.can_view
    WHEN 'create' THEN rp.can_create
    WHEN 'edit' THEN rp.can_edit
    WHEN 'delete' THEN rp.can_delete
    WHEN 'approve' THEN rp.can_approve
    WHEN 'export' THEN rp.can_export
    WHEN 'import' THEN rp.can_import
    WHEN 'manage' THEN rp.can_manage
    WHEN 'configure' THEN rp.can_configure
  END
  INTO v_allowed
  FROM public.nido_role_permissions rp
  WHERE rp.role_id = v_role_id
    AND rp.module_key = p_module_key
  LIMIT 1;

  IF v_allowed IS NOT NULL THEN
    RETURN v_allowed;
  END IF;

  -- Fallback to parent core module if no explicit override exists
  SELECT mc.parent_module_key
  INTO v_parent_key
  FROM public.nido_module_catalog mc
  WHERE mc.module_key = p_module_key;

  IF v_parent_key IS NULL THEN
    RETURN false;
  END IF;

  SELECT CASE p_action
    WHEN 'view' THEN rp.can_view
    WHEN 'create' THEN rp.can_create
    WHEN 'edit' THEN rp.can_edit
    WHEN 'delete' THEN rp.can_delete
    WHEN 'approve' THEN rp.can_approve
    WHEN 'export' THEN rp.can_export
    WHEN 'import' THEN rp.can_import
    WHEN 'manage' THEN rp.can_manage
    WHEN 'configure' THEN rp.can_configure
  END
  INTO v_allowed
  FROM public.nido_role_permissions rp
  WHERE rp.role_id = v_role_id
    AND rp.module_key = v_parent_key
  LIMIT 1;

  RETURN COALESCE(v_allowed, false);
END;
$$;

CREATE OR REPLACE FUNCTION app.has_portal_permission(
  p_module_key text,
  p_action text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_client_id uuid;
  v_user_type text;
  v_role_id uuid;
  v_allowed boolean;
BEGIN
  IF p_action NOT IN ('view','create','edit','delete','approve','export','import','manage','configure') THEN
    RETURN false;
  END IF;

  SELECT cu.client_id, cu.user_type, cu.client_role_id
  INTO v_client_id, v_user_type, v_role_id
  FROM public.client_users cu
  JOIN public.client_organizations co ON co.id = cu.client_id
  JOIN public.client_roles cr ON cr.id = cu.client_role_id AND cr.client_id = cu.client_id
  WHERE cu.auth_user_id = auth.uid()
    AND cu.status = 'active'
    AND co.status = 'Active'
    AND cr.status = 'active'
    AND app.has_verified_auth_email(cu.auth_user_id, cu.email, cu.metadata)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Scoped admin management of client_users / client_roles is handled by app.is_client_admin()
  -- in RLS policies; business-module permissions are never unconditionally bypassed.

  SELECT CASE p_action
    WHEN 'view' THEN crp.can_view
    WHEN 'create' THEN crp.can_create
    WHEN 'edit' THEN crp.can_edit
    WHEN 'delete' THEN crp.can_delete
    WHEN 'approve' THEN crp.can_approve
    WHEN 'export' THEN crp.can_export
    WHEN 'import' THEN crp.can_import
    WHEN 'manage' THEN crp.can_manage
    WHEN 'configure' THEN crp.can_configure
  END
  INTO v_allowed
  FROM public.client_role_permissions crp
  WHERE crp.client_id = v_client_id
    AND crp.client_role_id = v_role_id
    AND crp.module_key = p_module_key
  LIMIT 1;

  IF COALESCE(v_allowed, false) THEN
    RETURN true;
  END IF;

  -- Preserve Dashboard (16 children) & Services (6 children) parent view inheritance
  IF p_action = 'view' AND p_module_key IN ('Dashboard', 'Services') THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.client_role_permissions crp
      JOIN public.client_module_catalog cmc ON cmc.module_key = crp.module_key
      WHERE crp.client_id = v_client_id
        AND crp.client_role_id = v_role_id
        AND cmc.parent_module_key = p_module_key
        AND crp.can_view = true
    );
  END IF;

  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION app.is_trusted_backend() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION app.has_verified_auth_email(uuid, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION app.is_nido_internal() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app.is_system_owner() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app.current_nido_user_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app.current_client_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app.is_client_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app.has_nido_permission(text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION app.has_portal_permission(text, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION app.is_trusted_backend() TO service_role;
GRANT EXECUTE ON FUNCTION app.has_verified_auth_email(uuid, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION app.is_nido_internal() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION app.is_system_owner() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION app.current_nido_user_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION app.current_client_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION app.is_client_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION app.has_nido_permission(text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION app.has_portal_permission(text, text) TO authenticated, service_role;

-- ============================================================================
-- 4. PUBLIC AUTH CONTEXT (STABLE) & LOGIN AUDIT (VOLATILE) RPCS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_my_auth_context()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_nido record;
  v_client record;
  v_perms jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('authenticated', false, 'reason', 'unauthenticated');
  END IF;

  SELECT
    u.id, u.employee_id, u.name, u.email, u.department, u.designation,
    u.status AS user_status, u.force_password_change, u.metadata,
    r.id AS role_id, r.name AS role_name, r.is_system_owner, r.status AS role_status,
    o.status AS org_status
  INTO v_nido
  FROM public.nido_users u
  JOIN public.nido_roles r ON r.id = u.role_id
  LEFT JOIN public.nido_organizations o ON o.id = u.nido_org_id
  WHERE u.auth_user_id = v_uid
  LIMIT 1;

  IF FOUND THEN
    IF NOT app.has_verified_auth_email(v_uid, v_nido.email, v_nido.metadata) THEN
      RETURN jsonb_build_object('authenticated', false, 'reason', 'email_mismatch_pending');
    END IF;
    IF v_nido.user_status <> 'Active' OR v_nido.role_status <> 'Active'
       OR (v_nido.org_status IS NOT NULL AND v_nido.org_status <> 'Active') THEN
      RETURN jsonb_build_object('authenticated', false, 'reason', 'inactive_or_suspended');
    END IF;

    IF v_nido.is_system_owner THEN
      SELECT COALESCE(jsonb_object_agg(mc.module_key, jsonb_build_object(
        'view', true, 'create', true, 'edit', true,
        'delete', true, 'approve', true, 'export', true,
        'import', true, 'manage', true, 'configure', true
      )), '{}'::jsonb)
      INTO v_perms
      FROM public.nido_module_catalog mc;
    ELSE
      SELECT COALESCE(jsonb_object_agg(mc.module_key, jsonb_build_object(
        'view',      COALESCE(rp.can_view,      prp.can_view,      false),
        'create',    COALESCE(rp.can_create,    prp.can_create,    false),
        'edit',      COALESCE(rp.can_edit,      prp.can_edit,      false),
        'delete',    COALESCE(rp.can_delete,    prp.can_delete,    false),
        'approve',   COALESCE(rp.can_approve,   prp.can_approve,   false),
        'export',    COALESCE(rp.can_export,    prp.can_export,    false),
        'import',    COALESCE(rp.can_import,    prp.can_import,    false),
        'manage',    COALESCE(rp.can_manage,    prp.can_manage,    false),
        'configure', COALESCE(rp.can_configure, prp.can_configure, false)
      )), '{}'::jsonb)
      INTO v_perms
      FROM public.nido_module_catalog mc
      LEFT JOIN public.nido_role_permissions rp
        ON rp.role_id = v_nido.role_id AND rp.module_key = mc.module_key
      LEFT JOIN public.nido_role_permissions prp
        ON prp.role_id = v_nido.role_id AND prp.module_key = mc.parent_module_key
      WHERE rp.module_key IS NOT NULL OR prp.module_key IS NOT NULL;
    END IF;

    RETURN jsonb_build_object(
      'authenticated', true,
      'user_scope', 'nido_internal',
      'profile', jsonb_build_object(
        'id', v_nido.id,
        'employee_id', v_nido.employee_id,
        'name', v_nido.name,
        'email', v_nido.email,
        'department', v_nido.department,
        'designation', v_nido.designation,
        'force_password_change', v_nido.force_password_change
      ),
      'role', jsonb_build_object(
        'id', v_nido.role_id,
        'name', v_nido.role_name,
        'is_system_owner', v_nido.is_system_owner
      ),
      'permissions', v_perms
    );
  END IF;

  SELECT
    cu.id, cu.client_id, cu.user_type, cu.name, cu.email, cu.department, cu.designation,
    cu.status AS user_status, cu.metadata,
    co.client_code, co.name AS client_name, co.status AS org_status,
    cr.id AS role_id, cr.name AS role_name, cr.status AS role_status
  INTO v_client
  FROM public.client_users cu
  JOIN public.client_organizations co ON co.id = cu.client_id
  LEFT JOIN public.client_roles cr ON cr.id = cu.client_role_id AND cr.client_id = cu.client_id
  WHERE cu.auth_user_id = v_uid
  LIMIT 1;

  IF FOUND THEN
    IF NOT app.has_verified_auth_email(v_uid, v_client.email, v_client.metadata) THEN
      RETURN jsonb_build_object('authenticated', false, 'reason', 'email_mismatch_pending');
    END IF;
    IF v_client.user_status <> 'active' OR v_client.org_status <> 'Active'
       OR (v_client.role_id IS NOT NULL AND v_client.role_status <> 'active')
       OR (v_client.user_type <> 'client_admin' AND v_client.role_id IS NULL) THEN
      RETURN jsonb_build_object('authenticated', false, 'reason', 'inactive_or_suspended');
    END IF;

    IF v_client.role_id IS NOT NULL THEN
      SELECT COALESCE(jsonb_object_agg(cmc.module_key, jsonb_build_object(
        'view', (
          COALESCE(crp.can_view, false)
          OR (
            cmc.module_key IN ('Dashboard', 'Services')
            AND EXISTS (
              SELECT 1
              FROM public.client_role_permissions child_rp
              JOIN public.client_module_catalog child_mc ON child_mc.module_key = child_rp.module_key
              WHERE child_rp.client_id = v_client.client_id
                AND child_rp.client_role_id = v_client.role_id
                AND child_mc.parent_module_key = cmc.module_key
                AND child_rp.can_view = true
            )
          )
        ),
        'create',    COALESCE(crp.can_create, false),
        'edit',      COALESCE(crp.can_edit, false),
        'delete',    COALESCE(crp.can_delete, false),
        'approve',   COALESCE(crp.can_approve, false),
        'export',    COALESCE(crp.can_export, false),
        'import',    COALESCE(crp.can_import, false),
        'manage',    COALESCE(crp.can_manage, false),
        'configure', COALESCE(crp.can_configure, false)
      )), '{}'::jsonb)
      INTO v_perms
      FROM public.client_module_catalog cmc
      LEFT JOIN public.client_role_permissions crp
        ON crp.client_id = v_client.client_id
       AND crp.client_role_id = v_client.role_id
       AND crp.module_key = cmc.module_key
      WHERE crp.module_key IS NOT NULL
         OR (
           cmc.module_key IN ('Dashboard', 'Services')
           AND EXISTS (
             SELECT 1
             FROM public.client_role_permissions child_rp
             JOIN public.client_module_catalog child_mc ON child_mc.module_key = child_rp.module_key
             WHERE child_rp.client_id = v_client.client_id
               AND child_rp.client_role_id = v_client.role_id
               AND child_mc.parent_module_key = cmc.module_key
               AND child_rp.can_view = true
           )
         );
    ELSE
      v_perms := '{}'::jsonb;
    END IF;

    RETURN jsonb_build_object(
      'authenticated', true,
      'user_scope', 'client_portal',
      'effective_admin_scope', (v_client.user_type = 'client_admin'),
      'profile', jsonb_build_object(
        'id', v_client.id,
        'client_id', v_client.client_id,
        'client_code', v_client.client_code,
        'client_name', v_client.client_name,
        'user_type', v_client.user_type,
        'name', v_client.name,
        'email', v_client.email,
        'department', v_client.department,
        'designation', v_client.designation
      ),
      'role', jsonb_build_object(
        'id', v_client.role_id,
        'name', v_client.role_name
      ),
      'permissions', v_perms
    );
  END IF;

  RETURN jsonb_build_object('authenticated', false, 'reason', 'unprovisioned');
END;
$$;

CREATE OR REPLACE FUNCTION public.record_my_login_event(
  p_client_reported_device text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_scope text := 'unknown';
  v_result text := 'unprovisioned';
  v_nido record;
  v_client record;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT lower(pg_catalog.btrim(email)) INTO v_email FROM auth.users WHERE id = v_uid;

  SELECT u.email, u.status AS user_status, u.metadata, r.status AS role_status, o.status AS org_status
  INTO v_nido
  FROM public.nido_users u
  JOIN public.nido_roles r ON r.id = u.role_id
  LEFT JOIN public.nido_organizations o ON o.id = u.nido_org_id
  WHERE u.auth_user_id = v_uid
  LIMIT 1;

  IF FOUND THEN
    v_scope := 'nido_internal';
    IF v_nido.user_status = 'Suspended' THEN
      v_result := 'suspended';
    ELSIF v_nido.user_status = 'Active'
          AND v_nido.role_status = 'Active'
          AND (v_nido.org_status IS NULL OR v_nido.org_status = 'Active')
          AND app.has_verified_auth_email(v_uid, v_nido.email, v_nido.metadata) THEN
      v_result := 'success';
      UPDATE public.nido_users SET last_login_at = now() WHERE auth_user_id = v_uid;
    ELSE
      v_result := 'inactive';
    END IF;
  ELSE
    SELECT
      cu.email, cu.status AS user_status, cu.user_type, cu.client_role_id, cu.metadata,
      co.status AS org_status, cr.id AS role_id, cr.status AS role_status
    INTO v_client
    FROM public.client_users cu
    JOIN public.client_organizations co ON co.id = cu.client_id
    LEFT JOIN public.client_roles cr ON cr.id = cu.client_role_id AND cr.client_id = cu.client_id
    WHERE cu.auth_user_id = v_uid
    LIMIT 1;

    IF FOUND THEN
      v_scope := 'client_portal';
      IF v_client.user_status = 'suspended' THEN
        v_result := 'suspended';
      ELSIF v_client.user_status = 'active'
            AND v_client.org_status = 'Active'
            AND (
              (v_client.user_type = 'client_admin' AND (v_client.client_role_id IS NULL OR v_client.role_status = 'active'))
              OR (v_client.role_id IS NOT NULL AND v_client.role_status = 'active')
            )
            AND app.has_verified_auth_email(v_uid, v_client.email, v_client.metadata) THEN
        v_result := 'success';
        UPDATE public.client_users SET last_login_at = now() WHERE auth_user_id = v_uid;
      ELSE
        v_result := 'inactive';
      END IF;
    END IF;
  END IF;

  INSERT INTO public.nido_login_history (
    auth_user_id, email, user_scope, result, event_source, ip_address, client_reported_device
  )
  VALUES (
    v_uid,
    COALESCE(v_email, 'unknown'),
    v_scope,
    v_result,
    'client_post_auth',
    NULL,
    left(NULLIF(pg_catalog.btrim(p_client_reported_device), ''), 255)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_auth_context() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_my_login_event(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_auth_context() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_my_login_event(text) TO authenticated, service_role;

COMMENT ON TABLE public.nido_login_history IS
  'Post-authentication login audit log. Rows with event_source = client_post_auth are client-reported via record_my_login_event() and are NOT authoritative server-side proof of login; authoritative login auditing requires Supabase Auth Hooks or server-side Auth log ingestion in a later phase.';

COMMENT ON FUNCTION public.record_my_login_event(text) IS
  'Records a client-reported post-authentication event (event_source = client_post_auth) and updates last_login_at when active. Callable by authenticated users; does not constitute authoritative server-side login proof.';

-- ============================================================================
-- 5. SECURITY TRIGGERS & DEFERRED INVARIANTS (app SCHEMA)
-- ============================================================================

-- 5A. Lowercase & trim email normalization
CREATE OR REPLACE FUNCTION app.trg_normalize_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.email := lower(pg_catalog.btrim(NEW.email));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auth_identity_registry_norm_email ON public.auth_identity_registry;
CREATE TRIGGER trg_auth_identity_registry_norm_email
  BEFORE INSERT OR UPDATE OF email ON public.auth_identity_registry
  FOR EACH ROW EXECUTE FUNCTION app.trg_normalize_email();

DROP TRIGGER IF EXISTS trg_nido_users_norm_email ON public.nido_users;
CREATE TRIGGER trg_nido_users_norm_email
  BEFORE INSERT OR UPDATE OF email ON public.nido_users
  FOR EACH ROW EXECUTE FUNCTION app.trg_normalize_email();

DROP TRIGGER IF EXISTS trg_client_users_norm_email ON public.client_users;
CREATE TRIGGER trg_client_users_norm_email
  BEFORE INSERT OR UPDATE OF email ON public.client_users
  FOR EACH ROW EXECUTE FUNCTION app.trg_normalize_email();

-- 5B. Immutability guards on Phase 2A organizational & RBAC tables
CREATE OR REPLACE FUNCTION app.trg_protect_nido_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.is_system_owner THEN
      RAISE EXCEPTION 'System Owner role cannot be deleted' USING ERRCODE = 'insufficient_privilege';
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.is_system_owner THEN
    IF NOT app.is_trusted_backend() THEN
      RAISE EXCEPTION 'System Owner role can only be modified by trusted backend' USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF NEW.is_system_owner IS DISTINCT FROM OLD.is_system_owner OR NEW.status <> 'Active' THEN
      RAISE EXCEPTION 'System Owner role must remain active and flagged as System Owner' USING ERRCODE = 'check_violation';
    END IF;
  ELSIF NEW.is_system_owner IS DISTINCT FROM OLD.is_system_owner THEN
    RAISE EXCEPTION 'is_system_owner flag is immutable' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_nido_roles_protect ON public.nido_roles;
CREATE TRIGGER trg_nido_roles_protect
  BEFORE UPDATE OR DELETE ON public.nido_roles
  FOR EACH ROW EXECUTE FUNCTION app.trg_protect_nido_roles();

CREATE OR REPLACE FUNCTION app.trg_protect_nido_role_permissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_role_id uuid;
  v_is_sys_owner boolean := false;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_role_id := OLD.role_id;
  ELSE
    v_role_id := NEW.role_id;
  END IF;

  SELECT is_system_owner INTO v_is_sys_owner
  FROM public.nido_roles
  WHERE id = v_role_id;

  IF COALESCE(v_is_sys_owner, false) AND NOT app.is_trusted_backend() THEN
    RAISE EXCEPTION 'System Owner role permissions are service_role-only'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF TG_OP = 'UPDATE' AND NOT app.is_trusted_backend() THEN
    IF NEW.role_id IS DISTINCT FROM OLD.role_id OR NEW.module_key IS DISTINCT FROM OLD.module_key THEN
      RAISE EXCEPTION 'role_id and module_key are immutable' USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_nido_role_permissions_protect ON public.nido_role_permissions;
CREATE TRIGGER trg_nido_role_permissions_protect
  BEFORE INSERT OR UPDATE OR DELETE ON public.nido_role_permissions
  FOR EACH ROW EXECUTE FUNCTION app.trg_protect_nido_role_permissions();

CREATE OR REPLACE FUNCTION app.trg_protect_client_orgs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NOT app.is_trusted_backend() AND NEW.client_code IS DISTINCT FROM OLD.client_code THEN
    RAISE EXCEPTION 'client_code is immutable' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('client_admin:' || OLD.id::text));
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_client_organizations_protect ON public.client_organizations;
CREATE TRIGGER trg_client_organizations_protect
  BEFORE UPDATE ON public.client_organizations
  FOR EACH ROW EXECUTE FUNCTION app.trg_protect_client_orgs();

CREATE OR REPLACE FUNCTION app.trg_protect_security_platform_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NOT app.is_trusted_backend() THEN
    IF (TG_OP IN ('INSERT', 'UPDATE') AND NEW.setting_key = 'auth_email_sync_trigger_status')
       OR (TG_OP IN ('UPDATE', 'DELETE') AND OLD.setting_key = 'auth_email_sync_trigger_status') THEN
      RAISE EXCEPTION 'Security platform setting auth_email_sync_trigger_status may only be modified by trusted backend operations'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION app.trg_protect_org_settings_immutable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NOT app.is_trusted_backend() THEN
    IF NEW.scope_type IS DISTINCT FROM OLD.scope_type
       OR NEW.nido_org_id IS DISTINCT FROM OLD.nido_org_id
       OR NEW.client_id IS DISTINCT FROM OLD.client_id THEN
      RAISE EXCEPTION 'Organization settings scope identifiers are immutable'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_organization_settings_immutable ON public.organization_settings;
CREATE TRIGGER trg_organization_settings_immutable
  BEFORE UPDATE ON public.organization_settings
  FOR EACH ROW EXECUTE FUNCTION app.trg_protect_org_settings_immutable();

CREATE OR REPLACE FUNCTION app.trg_protect_client_roles_immutable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NOT app.is_trusted_backend() AND NEW.client_id IS DISTINCT FROM OLD.client_id THEN
    RAISE EXCEPTION 'client_roles.client_id is immutable' USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_client_roles_immutable ON public.client_roles;
CREATE TRIGGER trg_client_roles_immutable
  BEFORE UPDATE ON public.client_roles
  FOR EACH ROW EXECUTE FUNCTION app.trg_protect_client_roles_immutable();

CREATE OR REPLACE FUNCTION app.trg_protect_client_role_perms_immutable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_self_role_id uuid;
  v_target_role_id uuid;
BEGIN
  IF NOT app.is_trusted_backend() THEN
    IF TG_OP = 'UPDATE' THEN
      IF NEW.client_id IS DISTINCT FROM OLD.client_id
         OR NEW.client_role_id IS DISTINCT FROM OLD.client_role_id
         OR NEW.module_key IS DISTINCT FROM OLD.module_key THEN
        RAISE EXCEPTION 'client_role_permissions identifiers are immutable'
          USING ERRCODE = 'insufficient_privilege';
      END IF;
    END IF;

    IF NOT app.has_nido_permission('clients', 'edit') AND app.is_client_admin() THEN
      SELECT cu.client_role_id
      INTO v_self_role_id
      FROM public.client_users cu
      WHERE cu.auth_user_id = auth.uid()
      LIMIT 1;

      v_target_role_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.client_role_id ELSE NEW.client_role_id END;
      IF v_self_role_id IS NOT NULL AND v_target_role_id = v_self_role_id THEN
        RAISE EXCEPTION 'Client Admin cannot modify permissions on their own assigned client role'
          USING ERRCODE = 'insufficient_privilege';
      END IF;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_client_role_permissions_immutable ON public.client_role_permissions;
CREATE TRIGGER trg_client_role_permissions_immutable
  BEFORE INSERT OR UPDATE OR DELETE ON public.client_role_permissions
  FOR EACH ROW EXECUTE FUNCTION app.trg_protect_client_role_perms_immutable();

-- 5C. nido_users column-level & System Owner lock trigger (explicit TG_OP & returns)
CREATE OR REPLACE FUNCTION app.trg_nido_users_protect()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_sys_owner_role_id uuid;
  v_involves_sys_owner boolean := false;
BEGIN
  SELECT id INTO v_sys_owner_role_id
  FROM public.nido_roles
  WHERE is_system_owner = true
  LIMIT 1;

  IF TG_OP = 'INSERT' THEN
    IF v_sys_owner_role_id IS NOT NULL AND NEW.role_id = v_sys_owner_role_id THEN
      v_involves_sys_owner := true;
    END IF;
    IF v_involves_sys_owner THEN
      PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('nido_system_owner'));
      IF NOT (app.is_trusted_backend() OR app.is_system_owner()) THEN
        RAISE EXCEPTION 'Only an authorized System Owner or trusted backend may assign System Owner'
          USING ERRCODE = 'insufficient_privilege';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF v_sys_owner_role_id IS NOT NULL AND OLD.role_id = v_sys_owner_role_id THEN
      PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('nido_system_owner'));
      IF NOT (app.is_trusted_backend() OR app.is_system_owner()) THEN
        RAISE EXCEPTION 'Only an authorized System Owner or trusted backend may remove System Owner'
          USING ERRCODE = 'insufficient_privilege';
      END IF;
    END IF;
    RETURN OLD;
  END IF;

  -- TG_OP = 'UPDATE'
  IF NOT app.is_trusted_backend() THEN
    IF NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id
       OR NEW.user_scope IS DISTINCT FROM OLD.user_scope
       OR NEW.legacy_user_id IS DISTINCT FROM OLD.legacy_user_id
       OR NEW.nido_org_id IS DISTINCT FROM OLD.nido_org_id
       OR NEW.employee_id IS DISTINCT FROM OLD.employee_id
       OR NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Immutable identity fields cannot be modified directly'
        USING ERRCODE = 'insufficient_privilege';
    END IF;

    IF NOT app.has_nido_permission('users', 'edit') THEN
      IF NEW.role_id IS DISTINCT FROM OLD.role_id
         OR NEW.status IS DISTINCT FROM OLD.status
         OR NEW.force_password_change IS DISTINCT FROM OLD.force_password_change
         OR NEW.deactivated_at IS DISTINCT FROM OLD.deactivated_at
         OR NEW.department IS DISTINCT FROM OLD.department
         OR NEW.designation IS DISTINCT FROM OLD.designation
         OR NEW.job_title IS DISTINCT FROM OLD.job_title
         OR NEW.reporting_manager_id IS DISTINCT FROM OLD.reporting_manager_id
         OR NEW.reporting_manager_name IS DISTINCT FROM OLD.reporting_manager_name
         OR NEW.date_of_joining IS DISTINCT FROM OLD.date_of_joining THEN
        RAISE EXCEPTION 'Self-service profile updates may only change name, phone, and metadata'
          USING ERRCODE = 'insufficient_privilege';
      END IF;
    END IF;
  END IF;

  IF v_sys_owner_role_id IS NOT NULL
     AND (OLD.role_id = v_sys_owner_role_id OR NEW.role_id = v_sys_owner_role_id) THEN
    PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('nido_system_owner'));
    IF NOT (app.is_trusted_backend() OR app.is_system_owner()) THEN
      RAISE EXCEPTION 'Only an authorized System Owner or trusted backend may modify System Owner assignments'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_nido_users_protect ON public.nido_users;
CREATE TRIGGER trg_nido_users_protect
  BEFORE INSERT OR UPDATE OR DELETE ON public.nido_users
  FOR EACH ROW EXECUTE FUNCTION app.trg_nido_users_protect();

-- 5D. Deferred System Owner existence invariant (runs at COMMIT with fresh snapshot)
CREATE OR REPLACE FUNCTION app.trg_nido_users_sys_owner_invariant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_sys_owner_role_id uuid;
BEGIN
  SELECT id INTO v_sys_owner_role_id
  FROM public.nido_roles
  WHERE is_system_owner = true
  LIMIT 1;

  IF v_sys_owner_role_id IS NOT NULL THEN
    PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('nido_system_owner'));
    IF NOT EXISTS (
      SELECT 1 FROM public.nido_users
      WHERE role_id = v_sys_owner_role_id
        AND status = 'Active'
    ) THEN
      RAISE EXCEPTION 'At least one active System Owner must remain in nido_users whenever a System Owner role exists'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_nido_users_sys_owner_invariant ON public.nido_users;
CREATE CONSTRAINT TRIGGER trg_nido_users_sys_owner_invariant
  AFTER INSERT OR UPDATE OR DELETE ON public.nido_users
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION app.trg_nido_users_sys_owner_invariant();

DROP TRIGGER IF EXISTS trg_nido_roles_sys_owner_invariant ON public.nido_roles;
CREATE CONSTRAINT TRIGGER trg_nido_roles_sys_owner_invariant
  AFTER INSERT OR UPDATE OF is_system_owner ON public.nido_roles
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION app.trg_nido_users_sys_owner_invariant();

-- 5E. client_users column-level, archived-org & sorted Client Admin lock trigger
-- Lock order invariant: ALWAYS lock client_organizations FOR UPDATE (sorted UUID order)
-- BEFORE acquiring pg_advisory_xact_lock('client_admin:' || client_id) (sorted UUID order),
-- matching PostgreSQL UPDATE client_organizations -> trg_protect_client_orgs().
CREATE OR REPLACE FUNCTION app.trg_client_users_protect()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_org_status text;
  v_new_org_status text;
  v_lock_1 uuid;
  v_lock_2 uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT status INTO v_org_status
    FROM public.client_organizations
    WHERE id = NEW.client_id
    FOR UPDATE;

    IF NEW.user_type = 'client_admin' THEN
      PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('client_admin:' || NEW.client_id::text));
    END IF;

    IF v_org_status = 'Archived' AND NOT app.is_trusted_backend() THEN
      RAISE EXCEPTION 'Cannot add users to an Archived client organization'
        USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.user_type = 'client_admin' THEN
      PERFORM 1
      FROM public.client_organizations
      WHERE id = OLD.client_id
      FOR UPDATE;

      PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('client_admin:' || OLD.client_id::text));
    END IF;
    RETURN OLD;
  END IF;

  -- TG_OP = 'UPDATE'
  IF NOT app.is_trusted_backend() THEN
    IF NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id
       OR NEW.user_scope IS DISTINCT FROM OLD.user_scope
       OR NEW.legacy_user_id IS DISTINCT FROM OLD.legacy_user_id
       OR NEW.client_id IS DISTINCT FROM OLD.client_id
       OR NEW.email IS DISTINCT FROM OLD.email
       OR NEW.provisioned_at IS DISTINCT FROM OLD.provisioned_at THEN
      RAISE EXCEPTION 'Client user identity and tenant fields are immutable'
        USING ERRCODE = 'insufficient_privilege';
    END IF;

    IF NEW.user_type IS DISTINCT FROM OLD.user_type AND NOT app.has_nido_permission('clients', 'manage') THEN
      RAISE EXCEPTION 'Only authorized NIDO administrators may change client user_type'
        USING ERRCODE = 'insufficient_privilege';
    END IF;

    IF NOT app.has_nido_permission('clients', 'edit') THEN
      IF NOT (app.is_client_admin() AND OLD.user_type = 'client_user') THEN
        IF NEW.client_role_id IS DISTINCT FROM OLD.client_role_id
           OR NEW.status IS DISTINCT FROM OLD.status
           OR NEW.department IS DISTINCT FROM OLD.department
           OR NEW.designation IS DISTINCT FROM OLD.designation
           OR NEW.client_employee_code IS DISTINCT FROM OLD.client_employee_code THEN
          RAISE EXCEPTION 'Only authorized administrators may modify role, status, or organization profile fields'
            USING ERRCODE = 'insufficient_privilege';
        END IF;
      END IF;
    END IF;
  END IF;

  IF OLD.client_id = NEW.client_id THEN
    SELECT status INTO v_org_status
    FROM public.client_organizations
    WHERE id = OLD.client_id
    FOR UPDATE;
  ELSE
    v_lock_1 := LEAST(OLD.client_id, NEW.client_id);
    v_lock_2 := GREATEST(OLD.client_id, NEW.client_id);
    PERFORM 1 FROM public.client_organizations WHERE id = v_lock_1 FOR UPDATE;
    PERFORM 1 FROM public.client_organizations WHERE id = v_lock_2 FOR UPDATE;
    SELECT status INTO v_org_status FROM public.client_organizations WHERE id = OLD.client_id;
    SELECT status INTO v_new_org_status FROM public.client_organizations WHERE id = NEW.client_id;
  END IF;

  IF NOT app.is_trusted_backend() THEN
    IF v_org_status = 'Archived' AND NOT app.has_nido_permission('clients', 'manage') THEN
      RAISE EXCEPTION 'Ordinary users cannot modify users of an Archived organization'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    IF v_new_org_status = 'Archived' AND NOT app.has_nido_permission('clients', 'manage') THEN
      RAISE EXCEPTION 'Cannot move users to an Archived organization'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  IF OLD.user_type = 'client_admin' OR NEW.user_type = 'client_admin' THEN
    IF OLD.client_id = NEW.client_id THEN
      PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('client_admin:' || OLD.client_id::text));
    ELSE
      PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('client_admin:' || v_lock_1::text));
      PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('client_admin:' || v_lock_2::text));
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_client_users_protect ON public.client_users;
CREATE TRIGGER trg_client_users_protect
  BEFORE INSERT OR UPDATE OR DELETE ON public.client_users
  FOR EACH ROW EXECUTE FUNCTION app.trg_client_users_protect();

-- 5F. Deferred Client Admin existence invariant (Active & Inactive orgs require >= 1 active client_admin)
CREATE OR REPLACE FUNCTION app.trg_client_admin_invariant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_client_ids uuid[];
  v_cid uuid;
  v_org_status text;
  v_org_found boolean := false;
BEGIN
  IF TG_TABLE_NAME = 'client_organizations' THEN
    v_client_ids := ARRAY[NEW.id];
  ELSIF TG_OP = 'DELETE' THEN
    v_client_ids := ARRAY[OLD.client_id];
  ELSIF TG_OP = 'UPDATE' AND OLD.client_id IS DISTINCT FROM NEW.client_id THEN
    -- Validate both OLD and NEW organizations in deterministic sorted UUID lock order
    v_client_ids := ARRAY[LEAST(OLD.client_id, NEW.client_id), GREATEST(OLD.client_id, NEW.client_id)];
  ELSE
    v_client_ids := ARRAY[NEW.client_id];
  END IF;

  FOREACH v_cid IN ARRAY v_client_ids LOOP
    SELECT status INTO v_org_status
    FROM public.client_organizations
    WHERE id = v_cid
    FOR UPDATE;
    v_org_found := FOUND;

    PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('client_admin:' || v_cid::text));

    IF v_org_found AND v_org_status IN ('Active', 'Inactive') THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.client_users
        WHERE client_id = v_cid
          AND user_type = 'client_admin'
          AND status = 'active'
      ) THEN
        RAISE EXCEPTION 'Every Active or Inactive client organization (%) must have at least one active Client Admin', v_cid
          USING ERRCODE = 'check_violation';
      END IF;
    END IF;
  END LOOP;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_client_users_admin_invariant ON public.client_users;
CREATE CONSTRAINT TRIGGER trg_client_users_admin_invariant
  AFTER INSERT OR UPDATE OR DELETE ON public.client_users
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION app.trg_client_admin_invariant();

DROP TRIGGER IF EXISTS trg_client_orgs_admin_invariant ON public.client_organizations;
CREATE CONSTRAINT TRIGGER trg_client_orgs_admin_invariant
  AFTER INSERT OR UPDATE OF status ON public.client_organizations
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION app.trg_client_admin_invariant();

-- 5G. Atomic Auth-to-Profile Email Sync (Path A; graceful notice if hosted Auth restricts trigger)
CREATE OR REPLACE FUNCTION app.trg_sync_auth_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email AND NEW.email IS NOT NULL THEN
    UPDATE public.auth_identity_registry
    SET email = lower(pg_catalog.btrim(NEW.email))
    WHERE auth_user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS trg_auth_users_sync_email ON auth.users;
  CREATE TRIGGER trg_auth_users_sync_email
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW EXECUTE FUNCTION app.trg_sync_auth_email();

  INSERT INTO public.platform_settings (setting_key, category, value, description, is_public)
  VALUES (
    'auth_email_sync_trigger_status',
    'security',
    jsonb_build_object('installed', true, 'fallback_required', false, 'checked_at', now()),
    'Verifiable installation status of auth.users email sync trigger.',
    false
  )
  ON CONFLICT (setting_key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = now();
EXCEPTION
  WHEN insufficient_privilege THEN
    INSERT INTO public.platform_settings (setting_key, category, value, description, is_public)
    VALUES (
      'auth_email_sync_trigger_status',
      'security',
      jsonb_build_object('installed', false, 'fallback_required', true, 'checked_at', now()),
      'auth.users trigger not installed due to hosted ownership; Stage 2C Edge Function/Webhook reconciliation required.',
      false
    )
    ON CONFLICT (setting_key) DO UPDATE SET
      value = EXCLUDED.value,
      updated_at = now();
    RAISE NOTICE 'auth.users email sync trigger NOT installed (recorded in platform_settings); Stage 2C reconciliation required.';
END $$;

DROP TRIGGER IF EXISTS trg_platform_settings_protect_security ON public.platform_settings;
CREATE TRIGGER trg_platform_settings_protect_security
  BEFORE INSERT OR UPDATE OR DELETE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION app.trg_protect_security_platform_settings();

REVOKE ALL ON FUNCTION app.trg_normalize_email() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION app.trg_protect_nido_roles() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION app.trg_protect_nido_role_permissions() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION app.trg_protect_client_orgs() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION app.trg_protect_org_settings_immutable() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION app.trg_protect_client_roles_immutable() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION app.trg_protect_client_role_perms_immutable() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION app.trg_nido_users_protect() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION app.trg_nido_users_sys_owner_invariant() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION app.trg_client_users_protect() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION app.trg_client_admin_invariant() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION app.trg_sync_auth_email() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION app.trg_protect_security_platform_settings() FROM PUBLIC, anon, authenticated;

-- ============================================================================
-- 6. RLS ENABLEMENT, GRANULAR GRANTS & POLICIES (ALL 16 TABLES)
-- ============================================================================

-- Enable RLS & revoke PUBLIC/anon on Phase 2B tables
ALTER TABLE public.auth_identity_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nido_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nido_login_history ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.auth_identity_registry FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.nido_users FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.client_users FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.nido_login_history FROM PUBLIC, anon, authenticated;

-- Keep Phase 1 document_sequences & migration_batches strictly service_role-only
REVOKE ALL ON TABLE public.document_sequences FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.migration_batches FROM PUBLIC, anon, authenticated;

-- Explicit service_role privileges across all 16 tables (no reliance on default privileges)
GRANT ALL ON TABLE public.auth_identity_registry TO service_role;
GRANT ALL ON TABLE public.nido_users TO service_role;
GRANT ALL ON TABLE public.client_users TO service_role;
GRANT ALL ON TABLE public.nido_login_history TO service_role;
GRANT ALL ON TABLE public.document_sequences TO service_role;
GRANT ALL ON TABLE public.migration_batches TO service_role;
GRANT ALL ON TABLE public.platform_settings TO service_role;
GRANT ALL ON TABLE public.nido_organizations TO service_role;
GRANT ALL ON TABLE public.client_organizations TO service_role;
GRANT ALL ON TABLE public.organization_settings TO service_role;
GRANT ALL ON TABLE public.nido_module_catalog TO service_role;
GRANT ALL ON TABLE public.nido_roles TO service_role;
GRANT ALL ON TABLE public.nido_role_permissions TO service_role;
GRANT ALL ON TABLE public.client_module_catalog TO service_role;
GRANT ALL ON TABLE public.client_roles TO service_role;
GRANT ALL ON TABLE public.client_role_permissions TO service_role;

-- platform_settings
GRANT SELECT, INSERT, UPDATE ON TABLE public.platform_settings TO authenticated;
DROP POLICY IF EXISTS platform_settings_select ON public.platform_settings;
CREATE POLICY platform_settings_select ON public.platform_settings
  FOR SELECT TO authenticated
  USING (app.is_nido_internal() AND (is_public OR app.has_nido_permission('configuration', 'view')));
DROP POLICY IF EXISTS platform_settings_insert ON public.platform_settings;
CREATE POLICY platform_settings_insert ON public.platform_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    app.has_nido_permission('configuration', 'configure')
    AND setting_key <> 'auth_email_sync_trigger_status'
  );
DROP POLICY IF EXISTS platform_settings_update ON public.platform_settings;
CREATE POLICY platform_settings_update ON public.platform_settings
  FOR UPDATE TO authenticated
  USING (
    app.has_nido_permission('configuration', 'configure')
    AND setting_key <> 'auth_email_sync_trigger_status'
  )
  WITH CHECK (
    app.has_nido_permission('configuration', 'configure')
    AND setting_key <> 'auth_email_sync_trigger_status'
  );

-- nido_organizations
GRANT SELECT, INSERT, UPDATE ON TABLE public.nido_organizations TO authenticated;
DROP POLICY IF EXISTS nido_organizations_select ON public.nido_organizations;
CREATE POLICY nido_organizations_select ON public.nido_organizations
  FOR SELECT TO authenticated
  USING (app.is_nido_internal());
DROP POLICY IF EXISTS nido_organizations_insert ON public.nido_organizations;
CREATE POLICY nido_organizations_insert ON public.nido_organizations
  FOR INSERT TO authenticated
  WITH CHECK (app.is_system_owner() OR app.has_nido_permission('configuration', 'configure'));
DROP POLICY IF EXISTS nido_organizations_update ON public.nido_organizations;
CREATE POLICY nido_organizations_update ON public.nido_organizations
  FOR UPDATE TO authenticated
  USING (app.is_system_owner() OR app.has_nido_permission('configuration', 'configure'))
  WITH CHECK (app.is_system_owner() OR app.has_nido_permission('configuration', 'configure'));

-- client_organizations
GRANT SELECT, INSERT, UPDATE ON TABLE public.client_organizations TO authenticated;
DROP POLICY IF EXISTS client_organizations_select ON public.client_organizations;
CREATE POLICY client_organizations_select ON public.client_organizations
  FOR SELECT TO authenticated
  USING (app.has_nido_permission('clients', 'view') OR id = app.current_client_id());
DROP POLICY IF EXISTS client_organizations_insert ON public.client_organizations;
CREATE POLICY client_organizations_insert ON public.client_organizations
  FOR INSERT TO authenticated
  WITH CHECK (app.has_nido_permission('clients', 'create'));
DROP POLICY IF EXISTS client_organizations_update ON public.client_organizations;
CREATE POLICY client_organizations_update ON public.client_organizations
  FOR UPDATE TO authenticated
  USING (app.has_nido_permission('clients', 'edit'))
  WITH CHECK (app.has_nido_permission('clients', 'edit'));

-- organization_settings
GRANT SELECT, INSERT, UPDATE ON TABLE public.organization_settings TO authenticated;
DROP POLICY IF EXISTS organization_settings_select ON public.organization_settings;
CREATE POLICY organization_settings_select ON public.organization_settings
  FOR SELECT TO authenticated
  USING (
    (scope_type = 'nido_org' AND app.has_nido_permission('configuration', 'view'))
    OR (scope_type = 'client_org' AND (app.has_nido_permission('clients', 'view') OR client_id = app.current_client_id()))
  );
DROP POLICY IF EXISTS organization_settings_insert ON public.organization_settings;
CREATE POLICY organization_settings_insert ON public.organization_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    (scope_type = 'nido_org' AND app.has_nido_permission('configuration', 'configure'))
    OR (scope_type = 'client_org' AND (app.has_nido_permission('clients', 'edit') OR (app.is_client_admin() AND client_id = app.current_client_id())))
  );
DROP POLICY IF EXISTS organization_settings_update ON public.organization_settings;
CREATE POLICY organization_settings_update ON public.organization_settings
  FOR UPDATE TO authenticated
  USING (
    (scope_type = 'nido_org' AND app.has_nido_permission('configuration', 'configure'))
    OR (scope_type = 'client_org' AND (app.has_nido_permission('clients', 'edit') OR (app.is_client_admin() AND client_id = app.current_client_id())))
  )
  WITH CHECK (
    (scope_type = 'nido_org' AND app.has_nido_permission('configuration', 'configure'))
    OR (scope_type = 'client_org' AND (app.has_nido_permission('clients', 'edit') OR (app.is_client_admin() AND client_id = app.current_client_id())))
  );

-- nido_module_catalog
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.nido_module_catalog TO authenticated;
DROP POLICY IF EXISTS nido_module_catalog_select ON public.nido_module_catalog;
CREATE POLICY nido_module_catalog_select ON public.nido_module_catalog
  FOR SELECT TO authenticated
  USING (app.is_nido_internal());
DROP POLICY IF EXISTS nido_module_catalog_insert ON public.nido_module_catalog;
CREATE POLICY nido_module_catalog_insert ON public.nido_module_catalog
  FOR INSERT TO authenticated
  WITH CHECK (is_custom = true AND (app.is_system_owner() OR app.has_nido_permission('roles', 'configure')));
DROP POLICY IF EXISTS nido_module_catalog_update ON public.nido_module_catalog;
CREATE POLICY nido_module_catalog_update ON public.nido_module_catalog
  FOR UPDATE TO authenticated
  USING (is_custom = true AND (app.is_system_owner() OR app.has_nido_permission('roles', 'configure')))
  WITH CHECK (is_custom = true AND (app.is_system_owner() OR app.has_nido_permission('roles', 'configure')));
DROP POLICY IF EXISTS nido_module_catalog_delete ON public.nido_module_catalog;
CREATE POLICY nido_module_catalog_delete ON public.nido_module_catalog
  FOR DELETE TO authenticated
  USING (is_custom = true AND (app.is_system_owner() OR app.has_nido_permission('roles', 'configure')));

-- nido_roles (column-level UPDATE excludes is_system_owner)
GRANT SELECT, INSERT ON TABLE public.nido_roles TO authenticated;
GRANT UPDATE (name, department, description, status) ON TABLE public.nido_roles TO authenticated;
DROP POLICY IF EXISTS nido_roles_select ON public.nido_roles;
CREATE POLICY nido_roles_select ON public.nido_roles
  FOR SELECT TO authenticated
  USING (app.is_nido_internal());
DROP POLICY IF EXISTS nido_roles_insert ON public.nido_roles;
CREATE POLICY nido_roles_insert ON public.nido_roles
  FOR INSERT TO authenticated
  WITH CHECK (app.has_nido_permission('roles', 'create') AND is_system_owner = false);
DROP POLICY IF EXISTS nido_roles_update ON public.nido_roles;
CREATE POLICY nido_roles_update ON public.nido_roles
  FOR UPDATE TO authenticated
  USING (app.has_nido_permission('roles', 'edit') AND is_system_owner = false)
  WITH CHECK (app.has_nido_permission('roles', 'edit') AND is_system_owner = false);

-- nido_role_permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.nido_role_permissions TO authenticated;
DROP POLICY IF EXISTS nido_role_permissions_select ON public.nido_role_permissions;
CREATE POLICY nido_role_permissions_select ON public.nido_role_permissions
  FOR SELECT TO authenticated
  USING (app.is_nido_internal());
DROP POLICY IF EXISTS nido_role_permissions_write ON public.nido_role_permissions;
CREATE POLICY nido_role_permissions_write ON public.nido_role_permissions
  FOR ALL TO authenticated
  USING (
    (app.has_nido_permission('roles', 'configure') OR app.has_nido_permission('roles', 'manage'))
    AND NOT EXISTS (SELECT 1 FROM public.nido_roles r WHERE r.id = role_id AND r.is_system_owner = true)
  )
  WITH CHECK (
    (app.has_nido_permission('roles', 'configure') OR app.has_nido_permission('roles', 'manage'))
    AND NOT EXISTS (SELECT 1 FROM public.nido_roles r WHERE r.id = role_id AND r.is_system_owner = true)
  );

-- client_module_catalog (read-only for authenticated)
GRANT SELECT ON TABLE public.client_module_catalog TO authenticated;
DROP POLICY IF EXISTS client_module_catalog_select ON public.client_module_catalog;
CREATE POLICY client_module_catalog_select ON public.client_module_catalog
  FOR SELECT TO authenticated
  USING (app.is_nido_internal() OR app.current_client_id() IS NOT NULL);

-- client_roles (column-level UPDATE excludes client_id)
GRANT SELECT, INSERT ON TABLE public.client_roles TO authenticated;
GRANT UPDATE (name, description, status) ON TABLE public.client_roles TO authenticated;
DROP POLICY IF EXISTS client_roles_select ON public.client_roles;
CREATE POLICY client_roles_select ON public.client_roles
  FOR SELECT TO authenticated
  USING (app.has_nido_permission('clients', 'view') OR client_id = app.current_client_id());
DROP POLICY IF EXISTS client_roles_insert ON public.client_roles;
CREATE POLICY client_roles_insert ON public.client_roles
  FOR INSERT TO authenticated
  WITH CHECK (app.has_nido_permission('clients', 'edit') OR (app.is_client_admin() AND client_id = app.current_client_id()));
DROP POLICY IF EXISTS client_roles_update ON public.client_roles;
CREATE POLICY client_roles_update ON public.client_roles
  FOR UPDATE TO authenticated
  USING (app.has_nido_permission('clients', 'edit') OR (app.is_client_admin() AND client_id = app.current_client_id()))
  WITH CHECK (app.has_nido_permission('clients', 'edit') OR (app.is_client_admin() AND client_id = app.current_client_id()));

-- client_role_permissions (column-level UPDATE excludes client_id, client_role_id, module_key)
GRANT SELECT, INSERT, DELETE ON TABLE public.client_role_permissions TO authenticated;
GRANT UPDATE (
  can_view, can_create, can_edit, can_delete, can_approve, can_export, can_import, can_manage, can_configure
) ON TABLE public.client_role_permissions TO authenticated;
DROP POLICY IF EXISTS client_role_permissions_select ON public.client_role_permissions;
CREATE POLICY client_role_permissions_select ON public.client_role_permissions
  FOR SELECT TO authenticated
  USING (app.has_nido_permission('clients', 'view') OR client_id = app.current_client_id());
DROP POLICY IF EXISTS client_role_permissions_write ON public.client_role_permissions;
CREATE POLICY client_role_permissions_write ON public.client_role_permissions
  FOR ALL TO authenticated
  USING (
    app.has_nido_permission('clients', 'edit')
    OR (
      app.is_client_admin()
      AND client_id = app.current_client_id()
      AND client_role_id IS DISTINCT FROM (
        SELECT cu.client_role_id
        FROM public.client_users cu
        WHERE cu.auth_user_id = auth.uid()
        LIMIT 1
      )
    )
  )
  WITH CHECK (
    app.has_nido_permission('clients', 'edit')
    OR (
      app.is_client_admin()
      AND client_id = app.current_client_id()
      AND client_role_id IS DISTINCT FROM (
        SELECT cu.client_role_id
        FROM public.client_users cu
        WHERE cu.auth_user_id = auth.uid()
        LIMIT 1
      )
    )
  );

-- nido_users (no direct INSERT/DELETE; column-level UPDATE)
GRANT SELECT ON TABLE public.nido_users TO authenticated;
GRANT UPDATE (
  name, phone, job_title, designation, department,
  reporting_manager_id, reporting_manager_name, date_of_joining,
  role_id, status, force_password_change, deactivated_at, metadata
) ON TABLE public.nido_users TO authenticated;
DROP POLICY IF EXISTS nido_users_select ON public.nido_users;
CREATE POLICY nido_users_select ON public.nido_users
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid() OR app.has_nido_permission('users', 'view'));
DROP POLICY IF EXISTS nido_users_update ON public.nido_users;
CREATE POLICY nido_users_update ON public.nido_users
  FOR UPDATE TO authenticated
  USING ((auth_user_id = auth.uid() AND app.is_nido_internal()) OR app.has_nido_permission('users', 'edit'))
  WITH CHECK ((auth_user_id = auth.uid() AND app.is_nido_internal()) OR app.has_nido_permission('users', 'edit'));

-- client_users (no direct INSERT/DELETE; column-level UPDATE)
GRANT SELECT ON TABLE public.client_users TO authenticated;
GRANT UPDATE (
  name, phone, department, designation, client_role_id, status, client_employee_code, metadata
) ON TABLE public.client_users TO authenticated;
DROP POLICY IF EXISTS client_users_select ON public.client_users;
CREATE POLICY client_users_select ON public.client_users
  FOR SELECT TO authenticated
  USING (
    app.has_nido_permission('clients', 'view')
    OR (client_id = app.current_client_id() AND (app.is_client_admin() OR auth_user_id = auth.uid()))
  );
DROP POLICY IF EXISTS client_users_update ON public.client_users;
CREATE POLICY client_users_update ON public.client_users
  FOR UPDATE TO authenticated
  USING (
    app.has_nido_permission('clients', 'edit')
    OR (client_id = app.current_client_id() AND ((app.is_client_admin() AND user_type = 'client_user') OR auth_user_id = auth.uid()))
  )
  WITH CHECK (
    app.has_nido_permission('clients', 'edit')
    OR (client_id = app.current_client_id() AND ((app.is_client_admin() AND user_type = 'client_user') OR auth_user_id = auth.uid()))
  );

-- nido_login_history (SELECT only for authenticated)
GRANT SELECT ON TABLE public.nido_login_history TO authenticated;
DROP POLICY IF EXISTS nido_login_history_select ON public.nido_login_history;
CREATE POLICY nido_login_history_select ON public.nido_login_history
  FOR SELECT TO authenticated
  USING (
    auth_user_id = auth.uid()
    OR app.has_nido_permission('audit_logs', 'view')
    OR app.is_system_owner()
  );