-- Fix save_client_role_permissions_atomic ON CONFLICT target to match
-- uq_client_role_permissions_role_module UNIQUE (client_role_id, module_key).

CREATE OR REPLACE FUNCTION public.save_client_role_permissions_atomic(
  p_client_id uuid,
  p_client_role_id uuid,
  p_permissions jsonb,
  p_actor_auth_user_id uuid DEFAULT NULL::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $function$
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
  ON CONFLICT (client_role_id, module_key) DO UPDATE SET
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
$function$;

