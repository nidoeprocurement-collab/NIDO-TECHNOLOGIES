-- NIDO Phase 2D - Batch 1: Identity, Tenant, Settings, Audit & Impersonation
-- Target: nido-dev (eicjhhmkpqcnmwrfztit)
-- Adds:
--   1. public.nido_impersonation_sessions (server-verified impersonation tracking + RLS)
--   2. public.save_client_role_permissions_atomic (service_role-only atomic client permission save)
--   3. public.get_nido_audit_logs (internal permission-gated read RPC for nido_provisioning_audit)
--   4. public.list_document_sequences & public.upsert_document_sequence (internal config-gated RPCs)

BEGIN;

-- ── 1. Server-verified Client User Impersonation Sessions ──────────────────────

CREATE TABLE IF NOT EXISTS public.nido_impersonation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_auth_user_id uuid NOT NULL,
  actor_nido_user_id uuid NOT NULL REFERENCES public.nido_users(id) ON DELETE RESTRICT,
  target_client_user_id uuid NOT NULL REFERENCES public.client_users(id) ON DELETE RESTRICT,
  target_client_id uuid NOT NULL REFERENCES public.client_organizations(id) ON DELETE RESTRICT,
  mode text NOT NULL DEFAULT 'VIEW_ONLY' CHECK (mode IN ('VIEW_ONLY', 'FULL_ACCESS')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'expired', 'revoked')),
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '1 hour'),
  ended_at timestamptz,
  ended_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nido_impersonation_actor_active
  ON public.nido_impersonation_sessions (actor_auth_user_id, status, expires_at DESC);

CREATE INDEX IF NOT EXISTS idx_nido_impersonation_client
  ON public.nido_impersonation_sessions (target_client_id, started_at DESC);

ALTER TABLE public.nido_impersonation_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS nido_impersonation_sessions_select ON public.nido_impersonation_sessions;
CREATE POLICY nido_impersonation_sessions_select
  ON public.nido_impersonation_sessions
  FOR SELECT
  TO authenticated
  USING (
    app.is_nido_internal()
    AND actor_auth_user_id = auth.uid()
    AND (
      app.is_system_owner()
      OR app.has_nido_permission('client_user_impersonation', 'view')
    )
  );

DROP TRIGGER IF EXISTS trg_nido_impersonation_sessions_updated_at ON public.nido_impersonation_sessions;
CREATE TRIGGER trg_nido_impersonation_sessions_updated_at
  BEFORE UPDATE ON public.nido_impersonation_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── 2. Atomic Client Role Permissions Save RPC (service_role only) ─────────────

CREATE OR REPLACE FUNCTION public.save_client_role_permissions_atomic(
  p_client_id uuid,
  p_client_role_id uuid,
  p_permissions jsonb,
  p_actor_auth_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_role_client_id uuid;
  v_saved_count integer := 0;
BEGIN
  IF NOT app.is_trusted_backend() THEN
    RAISE EXCEPTION 'Trusted backend required' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_client_id IS NULL OR p_client_role_id IS NULL OR p_permissions IS NULL OR jsonb_typeof(p_permissions) <> 'array' THEN
    RAISE EXCEPTION 'Invalid client role permission payload' USING ERRCODE = 'invalid_parameter_value';
  END IF;

  SELECT client_id INTO v_role_client_id
  FROM public.client_roles
  WHERE id = p_client_role_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Client role not found' USING ERRCODE = 'no_data_found';
  END IF;

  IF v_role_client_id <> p_client_id THEN
    RAISE EXCEPTION 'Client role does not belong to target client' USING ERRCODE = 'insufficient_privilege';
  END IF;

  DELETE FROM public.client_role_permissions
  WHERE client_id = p_client_id
    AND client_role_id = p_client_role_id;

  INSERT INTO public.client_role_permissions (
    client_id,
    client_role_id,
    module_key,
    can_view,
    can_create,
    can_edit,
    can_delete,
    can_approve,
    can_export,
    can_import,
    can_manage,
    can_configure,
    created_by,
    updated_by
  )
  SELECT
    p_client_id,
    p_client_role_id,
    cmc.module_key,
    COALESCE((elem ->> 'can_view')::boolean, false),
    COALESCE((elem ->> 'can_create')::boolean, false),
    COALESCE((elem ->> 'can_edit')::boolean, false),
    COALESCE((elem ->> 'can_delete')::boolean, false),
    COALESCE((elem ->> 'can_approve')::boolean, false),
    COALESCE((elem ->> 'can_export')::boolean, false),
    COALESCE((elem ->> 'can_import')::boolean, false),
    COALESCE((elem ->> 'can_manage')::boolean, false),
    COALESCE((elem ->> 'can_configure')::boolean, false),
    p_actor_auth_user_id,
    p_actor_auth_user_id
  FROM jsonb_array_elements(p_permissions) AS elem
  JOIN public.client_module_catalog cmc
    ON cmc.module_key = btrim(elem ->> 'module_key')
  WHERE COALESCE((elem ->> 'can_view')::boolean, false)
     OR COALESCE((elem ->> 'can_create')::boolean, false)
     OR COALESCE((elem ->> 'can_edit')::boolean, false)
     OR COALESCE((elem ->> 'can_delete')::boolean, false)
     OR COALESCE((elem ->> 'can_approve')::boolean, false)
     OR COALESCE((elem ->> 'can_export')::boolean, false)
     OR COALESCE((elem ->> 'can_import')::boolean, false)
     OR COALESCE((elem ->> 'can_manage')::boolean, false)
     OR COALESCE((elem ->> 'can_configure')::boolean, false)
  ON CONFLICT (client_id, client_role_id, module_key) DO UPDATE SET
    can_view = EXCLUDED.can_view,
    can_create = EXCLUDED.can_create,
    can_edit = EXCLUDED.can_edit,
    can_delete = EXCLUDED.can_delete,
    can_approve = EXCLUDED.can_approve,
    can_export = EXCLUDED.can_export,
    can_import = EXCLUDED.can_import,
    can_manage = EXCLUDED.can_manage,
    can_configure = EXCLUDED.can_configure,
    updated_by = EXCLUDED.updated_by,
    updated_at = now();

  GET DIAGNOSTICS v_saved_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'client_id', p_client_id,
    'client_role_id', p_client_role_id,
    'saved_module_count', v_saved_count
  );
END;
$$;

REVOKE ALL ON FUNCTION public.save_client_role_permissions_atomic(uuid, uuid, jsonb, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_client_role_permissions_atomic(uuid, uuid, jsonb, uuid)
  TO service_role;

-- ── 3. Internal Audit Log Read RPC (masked & permission-gated) ─────────────────

CREATE OR REPLACE FUNCTION public.get_nido_audit_logs(
  p_limit integer DEFAULT 100,
  p_event_prefix text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  event_type text,
  outcome text,
  actor_auth_user_id uuid,
  target_auth_user_id uuid,
  target_scope text,
  target_email_masked text,
  client_id uuid,
  request_id text,
  details jsonb,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_limit integer := LEAST(GREATEST(COALESCE(p_limit, 100), 1), 500);
BEGIN
  IF NOT app.is_nido_internal() THEN
    RAISE EXCEPTION 'Internal NIDO user context required' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NOT (app.is_system_owner() OR app.has_nido_permission('audit_logs', 'view')) THEN
    RAISE EXCEPTION 'Missing audit_logs.view permission' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN QUERY
  SELECT
    a.id,
    a.event_type,
    a.outcome,
    a.actor_auth_user_id,
    a.target_auth_user_id,
    a.target_scope,
    CASE
      WHEN a.target_email IS NULL OR a.target_email = '' THEN NULL
      ELSE left(a.target_email, 2) || '***@' || split_part(a.target_email, '@', 2)
    END AS target_email_masked,
    a.client_id,
    a.request_id,
    a.details,
    a.created_at
  FROM public.nido_provisioning_audit a
  WHERE p_event_prefix IS NULL OR a.event_type ILIKE (p_event_prefix || '%')
  ORDER BY a.created_at DESC
  LIMIT v_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.get_nido_audit_logs(integer, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_nido_audit_logs(integer, text)
  TO authenticated, service_role;

-- ── 4. Document Sequences Read & Configuration RPCs ────────────────────────────

CREATE OR REPLACE FUNCTION public.list_document_sequences()
RETURNS TABLE (
  id uuid,
  seq_key text,
  prefix text,
  next_value bigint,
  pad_length integer,
  include_year boolean,
  year_separator text,
  description text,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NOT app.is_nido_internal() THEN
    RAISE EXCEPTION 'Internal NIDO user context required' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NOT (
    app.is_system_owner()
    OR app.has_nido_permission('configuration', 'view')
    OR app.has_nido_permission('platform_configuration', 'view')
  ) THEN
    RAISE EXCEPTION 'Missing configuration.view permission' USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN QUERY
  SELECT
    ds.id,
    ds.seq_key,
    ds.prefix,
    ds.next_value,
    ds.pad_length,
    ds.include_year,
    ds.year_separator,
    ds.description,
    ds.updated_at
  FROM public.document_sequences ds
  ORDER BY ds.seq_key ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.list_document_sequences()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_document_sequences()
  TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.upsert_document_sequence(
  p_seq_key text,
  p_prefix text,
  p_pad_length integer DEFAULT 5,
  p_include_year boolean DEFAULT false,
  p_year_separator text DEFAULT '-',
  p_description text DEFAULT NULL
)
RETURNS public.document_sequences
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_key text := btrim(COALESCE(p_seq_key, ''));
  v_prefix text := btrim(COALESCE(p_prefix, ''));
  v_row public.document_sequences;
BEGIN
  IF NOT app.is_nido_internal() THEN
    RAISE EXCEPTION 'Internal NIDO user context required' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NOT (
    app.is_system_owner()
    OR app.has_nido_permission('configuration', 'configure')
    OR app.has_nido_permission('configuration', 'edit')
  ) THEN
    RAISE EXCEPTION 'Missing configuration.configure permission' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF v_key = '' OR v_prefix = '' THEN
    RAISE EXCEPTION 'seq_key and prefix are required' USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF p_pad_length < 2 OR p_pad_length > 12 THEN
    RAISE EXCEPTION 'pad_length must be between 2 and 12' USING ERRCODE = 'invalid_parameter_value';
  END IF;

  INSERT INTO public.document_sequences (
    seq_key,
    prefix,
    next_value,
    pad_length,
    include_year,
    year_separator,
    description
  ) VALUES (
    v_key,
    v_prefix,
    1,
    p_pad_length,
    COALESCE(p_include_year, false),
    COALESCE(p_year_separator, '-'),
    p_description
  )
  ON CONFLICT (seq_key) DO UPDATE SET
    prefix = EXCLUDED.prefix,
    pad_length = EXCLUDED.pad_length,
    include_year = EXCLUDED.include_year,
    year_separator = EXCLUDED.year_separator,
    description = COALESCE(EXCLUDED.description, public.document_sequences.description),
    updated_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_document_sequence(text, text, integer, boolean, text, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_document_sequence(text, text, integer, boolean, text, text)
  TO authenticated, service_role;

COMMIT;

