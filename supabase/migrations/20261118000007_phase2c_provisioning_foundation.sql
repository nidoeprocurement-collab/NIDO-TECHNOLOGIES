-- NIDO Phase 2C - Provisioning foundation
-- Target: nido-dev (eicjhhmkpqcnmwrfztit)
-- Review before applying. This migration does not seed users or organizations.
-- It adds a service-role-only audit table, a narrowly scoped atomic client
-- organization + first-admin RPC, and requires confirmed Auth email addresses.

BEGIN;

-- 1. Private provisioning audit trail. Never store passwords, invite tokens,
--    recovery codes, JWTs, or secret values in this table.
CREATE TABLE IF NOT EXISTS public.nido_provisioning_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('success', 'failure')),
  actor_auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_scope text NOT NULL CHECK (target_scope IN ('nido_internal', 'client_portal', 'system')),
  target_email text,
  client_id uuid REFERENCES public.client_organizations(id) ON DELETE SET NULL,
  request_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nido_provisioning_audit_created
  ON public.nido_provisioning_audit (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nido_provisioning_audit_target
  ON public.nido_provisioning_audit (target_auth_user_id, created_at DESC);

ALTER TABLE public.nido_provisioning_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nido_provisioning_audit FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.nido_provisioning_audit FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.nido_provisioning_audit TO service_role;

-- 2. Strengthen the existing email/profile consistency helper. The earlier
--    version compared email strings but did not require Auth confirmation.
--    Profiles remain unable to obtain a valid NIDO auth context until the
--    invitation/confirmation process has completed.
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
        AND au.email_confirmed_at IS NOT NULL
        AND lower(btrim(au.email)) = lower(btrim(p_profile_email))
    );
$$;

REVOKE ALL ON FUNCTION app.has_verified_auth_email(uuid, text, jsonb)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app.has_verified_auth_email(uuid, text, jsonb)
  TO authenticated, service_role;

-- 3. Atomic first System Owner bootstrap. The existing Phase 2B deferred
--    invariant rejects a System Owner role unless an active owner profile exists
--    at COMMIT. Role creation and profile creation therefore must share one
--    transaction; do not create the role in a separate REST request.
CREATE OR REPLACE FUNCTION public.bootstrap_nido_system_owner(
  p_auth_user_id uuid,
  p_email text,
  p_name text,
  p_employee_id text,
  p_phone text DEFAULT NULL,
  p_request_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_role_id uuid;
  v_profile_id uuid;
  v_email text := lower(btrim(p_email));
BEGIN
  IF NOT app.is_trusted_backend() THEN
    RAISE EXCEPTION 'Trusted backend required' USING ERRCODE = 'insufficient_privilege';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('nido_system_owner'));

  IF p_auth_user_id IS NULL
     OR v_email IS NULL OR v_email = ''
     OR p_name IS NULL OR btrim(p_name) = ''
     OR p_employee_id IS NULL OR btrim(p_employee_id) = '' THEN
    RAISE EXCEPTION 'Required System Owner details are missing'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  SELECT id INTO v_role_id
  FROM public.nido_roles
  WHERE is_system_owner = true
  FOR UPDATE;

  IF v_role_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.nido_users WHERE role_id = v_role_id
  ) THEN
    RAISE EXCEPTION 'A System Owner profile already exists; bootstrap is one-time'
      USING ERRCODE = 'unique_violation';
  END IF;

  IF v_role_id IS NULL THEN
    INSERT INTO public.nido_roles (
      name, department, description, is_system_owner, status
    ) VALUES (
      'System Owner', 'Administration',
      'Protected platform-wide System Owner role', true, 'Active'
    ) RETURNING id INTO v_role_id;
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM public.nido_roles
      WHERE id = v_role_id AND status = 'Active'
    ) THEN
      RAISE EXCEPTION 'Existing System Owner role is inactive; manual review required'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  INSERT INTO public.auth_identity_registry (auth_user_id, user_scope, email)
  VALUES (p_auth_user_id, 'nido_internal', v_email);

  INSERT INTO public.nido_users (
    auth_user_id, user_scope, employee_id, name, email, phone, role_id,
    status, force_password_change, metadata
  ) VALUES (
    p_auth_user_id, 'nido_internal', btrim(p_employee_id), btrim(p_name),
    v_email, p_phone, v_role_id, 'Active', true,
    jsonb_build_object('provisioning_source', 'phase2c_bootstrap', 'invitation_status', 'sent')
  ) RETURNING id INTO v_profile_id;

  INSERT INTO public.nido_provisioning_audit (
    event_type, outcome, target_auth_user_id, target_scope, target_email,
    request_id, details
  ) VALUES (
    'system_owner_bootstrap_invited', 'success', p_auth_user_id,
    'nido_internal', v_email, p_request_id,
    jsonb_build_object('employee_id', btrim(p_employee_id), 'profile_id', v_profile_id)
  );

  RETURN jsonb_build_object(
    'profile_id', v_profile_id,
    'employee_id', btrim(p_employee_id),
    'role_id', v_role_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_nido_system_owner(
  uuid, text, text, text, text, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_nido_system_owner(
  uuid, text, text, text, text, text
) TO service_role;

-- 4. Atomic client organization + initial Client Admin provisioning.
--    The Phase 2B deferred invariant requires an active Client Admin for every
--    Active/Inactive client organization. This RPC inserts the organization,
--    identity registry row, and first admin in one database transaction.
CREATE OR REPLACE FUNCTION public.provision_client_org_admin(
  p_auth_user_id uuid,
  p_email text,
  p_name text,
  p_phone text,
  p_client_name text,
  p_category text DEFAULT NULL,
  p_tier text DEFAULT NULL,
  p_rep_name text DEFAULT NULL,
  p_nido_org_id uuid DEFAULT NULL,
  p_actor_auth_user_id uuid DEFAULT NULL,
  p_request_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_client_id uuid;
  v_client_code text;
  v_client_user_id uuid;
  v_client_admin_role_id uuid;
  v_email text := lower(btrim(p_email));
BEGIN
  IF NOT app.is_trusted_backend() THEN
    RAISE EXCEPTION 'Trusted backend required' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_auth_user_id IS NULL
     OR v_email IS NULL OR v_email = ''
     OR p_name IS NULL OR btrim(p_name) = ''
     OR p_client_name IS NULL OR btrim(p_client_name) = '' THEN
    RAISE EXCEPTION 'Required client and admin details are missing'
      USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF p_nido_org_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.nido_organizations
    WHERE id = p_nido_org_id AND status = 'Active'
  ) THEN
    RAISE EXCEPTION 'Selected NIDO organization is not active'
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  INSERT INTO public.auth_identity_registry (auth_user_id, user_scope, email)
  VALUES (p_auth_user_id, 'client_portal', v_email);

  v_client_code := public.allocate_document_number('CL', NULL);

  INSERT INTO public.client_organizations (
    client_code, nido_org_id, name, category, tier, rep_name, email, phone,
    status, created_by, updated_by
  ) VALUES (
    v_client_code, p_nido_org_id, btrim(p_client_name), p_category, p_tier,
    COALESCE(NULLIF(btrim(p_rep_name), ''), btrim(p_name)), v_email, p_phone,
    'Active', p_actor_auth_user_id, p_actor_auth_user_id
  ) RETURNING id INTO v_client_id;

  -- Option A: create a tenant-scoped Client Admin role with every catalogued
  -- portal module and all nine supported actions enabled. This is full access
  -- only inside this client organization; it grants no NIDO-internal authority.
  INSERT INTO public.client_roles (
    client_id, name, description, status, created_by, updated_by
  ) VALUES (
    v_client_id, 'Client Admin',
    'Default full-access role for the initial Client Admin; scoped to this client organization.',
    'active', p_actor_auth_user_id, p_actor_auth_user_id
  ) RETURNING id INTO v_client_admin_role_id;

   INSERT INTO public.client_role_permissions (
    client_id, client_role_id, module_key,
    can_view, can_create, can_edit, can_delete, can_approve,
    can_export, can_import, can_manage, can_configure,
    created_by, updated_by
  )
  SELECT
    v_client_id, v_client_admin_role_id, cmc.module_key,
    true, true, true, true, true, true, true, true, true,
    p_actor_auth_user_id, p_actor_auth_user_id
  FROM public.client_module_catalog cmc;

  INSERT INTO public.client_users (
    auth_user_id, user_scope, client_id, user_type, client_role_id, name, email, phone,
    status, provision_reason, provisioned_at, created_by, updated_by,
    metadata
  ) VALUES (
    p_auth_user_id, 'client_portal', v_client_id, 'client_admin', v_client_admin_role_id,
    btrim(p_name), v_email, p_phone, 'active', 'phase2c_invitation', now(),
    p_actor_auth_user_id, p_actor_auth_user_id,
    jsonb_build_object('provisioning_source', 'phase2c', 'invitation_status', 'sent')
  ) RETURNING id INTO v_client_user_id;

  INSERT INTO public.nido_provisioning_audit (
    event_type, outcome, actor_auth_user_id, target_auth_user_id,
    target_scope, target_email, client_id, request_id, details
  ) VALUES (
    'client_organization_and_admin_invited', 'success', p_actor_auth_user_id,
    p_auth_user_id, 'client_portal', v_email, v_client_id, p_request_id,
    jsonb_build_object('client_code', v_client_code, 'client_user_id', v_client_user_id)
  );

  RETURN jsonb_build_object(
    'client_id', v_client_id,
    'client_code', v_client_code,
    'client_user_id', v_client_user_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.provision_client_org_admin(
  uuid, text, text, text, text, text, text, text, uuid, uuid, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.provision_client_org_admin(
  uuid, text, text, text, text, text, text, text, uuid, uuid, text
) TO service_role;

COMMIT;
