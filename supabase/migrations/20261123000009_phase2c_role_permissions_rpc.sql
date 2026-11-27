-- NIDO Phase 2C - Atomic NIDO Role & Permission Synchronization RPCs
-- Target: nido-dev (eicjhhmkpqcnmwrfztit)
-- Adds service-role-only atomic RPCs for saving role permissions and
-- idempotently syncing the 24 built-in non-System-Owner roles.

BEGIN;

CREATE OR REPLACE FUNCTION public.save_nido_role_permissions_atomic(
  p_role_id uuid,
  p_permissions jsonb,
  p_actor_auth_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_is_system_owner boolean;
  v_saved_count integer := 0;
BEGIN
  IF NOT app.is_trusted_backend() THEN
    RAISE EXCEPTION 'Trusted backend required' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_role_id IS NULL OR p_permissions IS NULL OR jsonb_typeof(p_permissions) <> 'array' THEN
    RAISE EXCEPTION 'Invalid role permission payload' USING ERRCODE = 'invalid_parameter_value';
  END IF;

  SELECT is_system_owner INTO v_is_system_owner
  FROM public.nido_roles
  WHERE id = p_role_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Role not found' USING ERRCODE = 'no_data_found';
  END IF;

  IF v_is_system_owner THEN
    RAISE EXCEPTION 'System Owner permissions cannot be modified'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  DELETE FROM public.nido_role_permissions
  WHERE role_id = p_role_id;

  INSERT INTO public.nido_role_permissions (
    role_id,
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
    p_role_id,
    mc.module_key,
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
  JOIN public.nido_module_catalog mc
    ON mc.module_key = btrim(elem ->> 'module_key')
  WHERE COALESCE((elem ->> 'can_view')::boolean, false)
     OR COALESCE((elem ->> 'can_create')::boolean, false)
     OR COALESCE((elem ->> 'can_edit')::boolean, false)
     OR COALESCE((elem ->> 'can_delete')::boolean, false)
     OR COALESCE((elem ->> 'can_approve')::boolean, false)
     OR COALESCE((elem ->> 'can_export')::boolean, false)
     OR COALESCE((elem ->> 'can_import')::boolean, false)
     OR COALESCE((elem ->> 'can_manage')::boolean, false)
     OR COALESCE((elem ->> 'can_configure')::boolean, false)
  ON CONFLICT (role_id, module_key) DO UPDATE SET
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
    'role_id', p_role_id,
    'saved_module_count', v_saved_count
  );
END;
$$;

REVOKE ALL ON FUNCTION public.save_nido_role_permissions_atomic(uuid, jsonb, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_nido_role_permissions_atomic(uuid, jsonb, uuid)
  TO service_role;

CREATE OR REPLACE FUNCTION public.sync_nido_reference_roles_atomic(
  p_roles jsonb,
  p_actor_auth_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_role jsonb;
  v_name text;
  v_department text;
  v_description text;
  v_role_id uuid;
  v_inserted integer := 0;
  v_skipped integer := 0;
BEGIN
  IF NOT app.is_trusted_backend() THEN
    RAISE EXCEPTION 'Trusted backend required' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF p_roles IS NULL OR jsonb_typeof(p_roles) <> 'array' THEN
    RAISE EXCEPTION 'Invalid reference roles payload' USING ERRCODE = 'invalid_parameter_value';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('nido_reference_roles_sync'));

  FOR v_role IN SELECT value FROM jsonb_array_elements(p_roles) LOOP
    v_name := btrim(COALESCE(v_role ->> 'name', ''));
    v_department := btrim(COALESCE(v_role ->> 'department', ''));
    v_description := btrim(COALESCE(v_role ->> 'description', ''));

    IF v_name = '' OR lower(v_name) = 'system owner' THEN
      CONTINUE;
    END IF;

    SELECT id INTO v_role_id
    FROM public.nido_roles
    WHERE lower(btrim(name)) = lower(v_name)
    LIMIT 1;

    IF v_role_id IS NOT NULL THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    INSERT INTO public.nido_roles (
      name,
      department,
      description,
      is_system_owner,
      status,
      created_by,
      updated_by
    ) VALUES (
      v_name,
      v_department,
      v_description,
      false,
      'Active',
      p_actor_auth_user_id,
      p_actor_auth_user_id
    )
    RETURNING id INTO v_role_id;

    IF jsonb_typeof(v_role -> 'permissions') = 'array' THEN
      INSERT INTO public.nido_role_permissions (
        role_id,
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
        v_role_id,
        mc.module_key,
        COALESCE((perm ->> 'can_view')::boolean, false),
        COALESCE((perm ->> 'can_create')::boolean, false),
        COALESCE((perm ->> 'can_edit')::boolean, false),
        COALESCE((perm ->> 'can_delete')::boolean, false),
        COALESCE((perm ->> 'can_approve')::boolean, false),
        COALESCE((perm ->> 'can_export')::boolean, false),
        COALESCE((perm ->> 'can_import')::boolean, false),
        COALESCE((perm ->> 'can_manage')::boolean, false),
        COALESCE((perm ->> 'can_configure')::boolean, false),
        p_actor_auth_user_id,
        p_actor_auth_user_id
      FROM jsonb_array_elements(v_role -> 'permissions') AS perm
      JOIN public.nido_module_catalog mc
        ON mc.module_key = btrim(perm ->> 'module_key')
      ON CONFLICT (role_id, module_key) DO NOTHING;
    END IF;

    v_inserted := v_inserted + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'inserted_count', v_inserted,
    'skipped_count', v_skipped,
    'total_processed', v_inserted + v_skipped
  );
END;
$$;

REVOKE ALL ON FUNCTION public.sync_nido_reference_roles_atomic(jsonb, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_nido_reference_roles_atomic(jsonb, uuid)
  TO service_role;

COMMIT;

