-- Phase 4.4: Secure Client Portal Self-Profile RPCs
-- Allows authenticated client_portal users to read and update ONLY their own
-- permitted profile fields (name, phone, designation, department).
-- Never allows changing client_id, client_role_id, user_type, status, or email.
-- Never exposes internal nido_users records.

CREATE OR REPLACE FUNCTION public.get_my_client_profile()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row RECORD;
BEGIN
  IF v_uid IS NULL OR app.is_nido_internal() THEN
    RAISE EXCEPTION 'Forbidden: client portal authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT
    cu.id,
    cu.auth_user_id,
    cu.name,
    cu.email,
    cu.phone,
    cu.designation,
    cu.department,
    cu.client_employee_code,
    cu.status,
    cu.user_type,
    cu.last_login_at,
    co.id AS client_id,
    co.name AS organization_name,
    co.client_code,
    cr.name AS role_name
  INTO v_row
  FROM public.client_users cu
  JOIN public.client_organizations co ON co.id = cu.client_id
  LEFT JOIN public.client_roles cr ON cr.id = cu.client_role_id
  WHERE cu.auth_user_id = v_uid
    AND cu.user_scope = 'client_portal'
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Client profile not found' USING ERRCODE = '42501';
  END IF;

  RETURN jsonb_build_object(
    'id', v_row.id,
    'auth_user_id', v_row.auth_user_id,
    'name', v_row.name,
    'email', v_row.email,
    'phone', v_row.phone,
    'designation', v_row.designation,
    'department', v_row.department,
    'client_employee_code', v_row.client_employee_code,
    'status', v_row.status,
    'user_type', v_row.user_type,
    'last_login_at', v_row.last_login_at,
    'client_id', v_row.client_id,
    'organization_name', v_row.organization_name,
    'client_code', v_row.client_code,
    'role_name', v_row.role_name
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_my_client_profile(
  p_name text,
  p_phone text DEFAULT NULL,
  p_designation text DEFAULT NULL,
  p_department text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_clean_name text := btrim(COALESCE(p_name, ''));
  v_clean_phone text := NULLIF(btrim(COALESCE(p_phone, '')), '');
  v_clean_designation text := NULLIF(btrim(COALESCE(p_designation, '')), '');
  v_clean_department text := NULLIF(btrim(COALESCE(p_department, '')), '');
BEGIN
  IF v_uid IS NULL OR app.is_nido_internal() THEN
    RAISE EXCEPTION 'Forbidden: client portal authentication required' USING ERRCODE = '42501';
  END IF;

  IF char_length(v_clean_name) < 2 OR char_length(v_clean_name) > 120 THEN
    RAISE EXCEPTION 'Display name must be between 2 and 120 characters' USING ERRCODE = '22023';
  END IF;

  IF v_clean_phone IS NOT NULL AND char_length(v_clean_phone) > 30 THEN
    RAISE EXCEPTION 'Phone number cannot exceed 30 characters' USING ERRCODE = '22023';
  END IF;

  UPDATE public.client_users
  SET
    name = v_clean_name,
    phone = v_clean_phone,
    designation = v_clean_designation,
    department = v_clean_department,
    updated_by = v_uid,
    updated_at = now()
  WHERE auth_user_id = v_uid
    AND user_scope = 'client_portal';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Client profile not found' USING ERRCODE = '42501';
  END IF;

  RETURN public.get_my_client_profile();
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_client_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_client_profile() TO authenticated;

REVOKE ALL ON FUNCTION public.update_my_client_profile(text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_my_client_profile(text, text, text, text) TO authenticated;

