-- NIDO Phase 2B security authorization corrections
-- Target: nido-dev (eicjhhmkpqcnmwrfztit) ONLY
-- Additive migration. Does not modify existing frontend files or business data.
-- Apply only after reviewing this migration in the nido-dev SQL/migration workflow.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Dedicated internal security capabilities
--    users.manage != suspend users != force password change.
--    System Owner can configure role capabilities through the guarded RPC below.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.nido_role_security_capabilities (
  role_id uuid PRIMARY KEY REFERENCES public.nido_roles(id) ON DELETE CASCADE,
  can_suspend_users boolean NOT NULL DEFAULT false,
  can_force_password_change boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.nido_role_security_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nido_role_security_capabilities FORCE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.nido_role_security_capabilities FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.nido_role_security_capabilities TO service_role;

CREATE OR REPLACE FUNCTION app.has_nido_security_capability(p_capability text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_role_id uuid;
  v_allowed boolean := false;
BEGIN
  IF p_capability NOT IN ('suspend_users', 'force_password_change') THEN
    RETURN false;
  END IF;

  IF app.is_system_owner() THEN
    RETURN true;
  END IF;

  SELECT u.role_id INTO v_role_id
  FROM public.nido_users u
  JOIN public.nido_roles r ON r.id = u.role_id
  LEFT JOIN public.nido_organizations o ON o.id = u.nido_org_id
  WHERE u.auth_user_id = auth.uid()
    AND u.status = 'Active'
    AND r.status = 'Active'
    AND (u.nido_org_id IS NULL OR o.status = 'Active')
    AND app.has_verified_auth_email(u.auth_user_id, u.email, u.metadata)
  LIMIT 1;

  IF v_role_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT CASE p_capability
    WHEN 'suspend_users' THEN c.can_suspend_users
    WHEN 'force_password_change' THEN c.can_force_password_change
  END
  INTO v_allowed
  FROM public.nido_role_security_capabilities c
  WHERE c.role_id = v_role_id;

  RETURN COALESCE(v_allowed, false);
END;
$$;

REVOKE ALL ON FUNCTION app.has_nido_security_capability(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app.has_nido_security_capability(text) TO authenticated, service_role;

-- Only the active System Owner (or trusted backend) may configure these elevated
-- capabilities. This RPC intentionally does not grant ordinary role editors access.
CREATE OR REPLACE FUNCTION app.set_nido_role_security_capabilities(
  p_role_id uuid,
  p_can_suspend_users boolean,
  p_can_force_password_change boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NOT (app.is_trusted_backend() OR app.is_system_owner()) THEN
    RAISE EXCEPTION 'Only System Owner or trusted backend may configure security capabilities'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.nido_roles r WHERE r.id = p_role_id AND r.is_system_owner = false) THEN
    RAISE EXCEPTION 'A valid non-System-Owner role is required'
      USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO public.nido_role_security_capabilities (
    role_id, can_suspend_users, can_force_password_change, created_by, updated_by
  ) VALUES (
    p_role_id, p_can_suspend_users, p_can_force_password_change,
    auth.uid(), auth.uid()
  )
  ON CONFLICT (role_id) DO UPDATE SET
    can_suspend_users = EXCLUDED.can_suspend_users,
    can_force_password_change = EXCLUDED.can_force_password_change,
    updated_at = now(),
    updated_by = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION app.set_nido_role_security_capabilities(uuid, boolean, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app.set_nido_role_security_capabilities(uuid, boolean, boolean) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 2. Internal NIDO user authorization boundaries
--    * users.edit: ordinary profile fields only
--    * users.manage: assign another user's role
--    * suspend_users: change account status/deactivation fields
--    * force_password_change: change force_password_change only
--    * self-role changes are always denied
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app.trg_nido_users_protect()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_sys_owner_role_id uuid;
  v_involves_sys_owner boolean := false;
  v_is_trusted boolean := app.is_trusted_backend();
  v_is_self boolean := false;
BEGIN
  SELECT id INTO v_sys_owner_role_id
  FROM public.nido_roles
  WHERE is_system_owner = true
  LIMIT 1;

  IF TG_OP = 'INSERT' THEN
    IF v_sys_owner_role_id IS NOT NULL AND NEW.role_id = v_sys_owner_role_id THEN
      PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('nido_system_owner'));
      IF NOT (v_is_trusted OR app.is_system_owner()) THEN
        RAISE EXCEPTION 'Only System Owner or trusted backend may assign System Owner'
          USING ERRCODE = 'insufficient_privilege';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF v_sys_owner_role_id IS NOT NULL AND OLD.role_id = v_sys_owner_role_id THEN
      PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('nido_system_owner'));
      IF NOT (v_is_trusted OR app.is_system_owner()) THEN
        RAISE EXCEPTION 'Only System Owner or trusted backend may remove System Owner'
          USING ERRCODE = 'insufficient_privilege';
      END IF;
    END IF;
    RETURN OLD;
  END IF;

  v_is_self := OLD.auth_user_id = auth.uid();

  IF NOT v_is_trusted THEN
    IF NEW.auth_user_id IS DISTINCT FROM OLD.auth_user_id
       OR NEW.user_scope IS DISTINCT FROM OLD.user_scope
       OR NEW.legacy_user_id IS DISTINCT FROM OLD.legacy_user_id
       OR NEW.nido_org_id IS DISTINCT FROM OLD.nido_org_id
       OR NEW.employee_id IS DISTINCT FROM OLD.employee_id
       OR NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Immutable identity fields cannot be modified directly'
        USING ERRCODE = 'insufficient_privilege';
    END IF;

    IF NEW.role_id IS DISTINCT FROM OLD.role_id THEN
      IF v_is_self THEN
        RAISE EXCEPTION 'Users cannot change their own role'
          USING ERRCODE = 'insufficient_privilege';
      END IF;
      IF NOT app.has_nido_permission('users', 'manage') THEN
        RAISE EXCEPTION 'users.manage permission is required to assign roles'
          USING ERRCODE = 'insufficient_privilege';
      END IF;
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.deactivated_at IS DISTINCT FROM OLD.deactivated_at THEN
      IF NOT app.has_nido_security_capability('suspend_users') THEN
        RAISE EXCEPTION 'Dedicated suspend_users capability is required to change user status'
          USING ERRCODE = 'insufficient_privilege';
      END IF;
    END IF;

    IF NEW.force_password_change IS DISTINCT FROM OLD.force_password_change
       AND NOT app.has_nido_security_capability('force_password_change') THEN
      RAISE EXCEPTION 'Dedicated force_password_change capability is required'
        USING ERRCODE = 'insufficient_privilege';
    END IF;

    IF v_is_self THEN
      IF NEW.name IS DISTINCT FROM OLD.name
         OR NEW.phone IS DISTINCT FROM OLD.phone
         OR NEW.metadata IS DISTINCT FROM OLD.metadata THEN
        NULL; -- permitted self-service fields
      END IF;
      IF NEW.job_title IS DISTINCT FROM OLD.job_title
         OR NEW.designation IS DISTINCT FROM OLD.designation
         OR NEW.department IS DISTINCT FROM OLD.department
         OR NEW.reporting_manager_id IS DISTINCT FROM OLD.reporting_manager_id
         OR NEW.reporting_manager_name IS DISTINCT FROM OLD.reporting_manager_name
         OR NEW.date_of_joining IS DISTINCT FROM OLD.date_of_joining THEN
        RAISE EXCEPTION 'Self-service updates may only change name, phone, and metadata'
          USING ERRCODE = 'insufficient_privilege';
      END IF;
    ELSE
      IF NEW.name IS DISTINCT FROM OLD.name
         OR NEW.phone IS DISTINCT FROM OLD.phone
         OR NEW.job_title IS DISTINCT FROM OLD.job_title
         OR NEW.designation IS DISTINCT FROM OLD.designation
         OR NEW.department IS DISTINCT FROM OLD.department
         OR NEW.reporting_manager_id IS DISTINCT FROM OLD.reporting_manager_id
         OR NEW.reporting_manager_name IS DISTINCT FROM OLD.reporting_manager_name
         OR NEW.date_of_joining IS DISTINCT FROM OLD.date_of_joining
         OR NEW.metadata IS DISTINCT FROM OLD.metadata THEN
        IF NOT app.has_nido_permission('users', 'edit') THEN
          RAISE EXCEPTION 'users.edit permission is required to edit user profile details'
            USING ERRCODE = 'insufficient_privilege';
        END IF;
      END IF;
    END IF;
  END IF;

  IF v_sys_owner_role_id IS NOT NULL
     AND (OLD.role_id = v_sys_owner_role_id OR NEW.role_id = v_sys_owner_role_id) THEN
    PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('nido_system_owner'));
    IF NOT (v_is_trusted OR app.is_system_owner()) THEN
      RAISE EXCEPTION 'Only System Owner or trusted backend may modify System Owner assignments'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS nido_users_update ON public.nido_users;
CREATE POLICY nido_users_update ON public.nido_users
  FOR UPDATE TO authenticated
  USING (
    (auth_user_id = auth.uid() AND app.is_nido_internal())
    OR app.has_nido_permission('users', 'edit')
    OR app.has_nido_permission('users', 'manage')
  )
  WITH CHECK (
    (auth_user_id = auth.uid() AND app.is_nido_internal())
    OR app.has_nido_permission('users', 'edit')
    OR app.has_nido_permission('users', 'manage')
  );

-- ---------------------------------------------------------------------------
-- 3. Client Admin may delegate only permissions held by their own assigned role.
--    Missing role/permission row means no grant (default deny).
--    NIDO clients.edit administrators retain their existing cross-client control.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app.trg_protect_client_role_perms_immutable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_self_role_id uuid;
  v_target_role_id uuid;
  v_target_client_id uuid;
  v_own_permissions public.client_role_permissions%ROWTYPE;
  v_has_own_permissions boolean := false;
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

    IF app.is_client_admin() AND NOT app.has_nido_permission('clients', 'edit') THEN
      SELECT cu.client_role_id, cu.client_id
      INTO v_self_role_id, v_target_client_id
      FROM public.client_users cu
      WHERE cu.auth_user_id = auth.uid()
      LIMIT 1;

      v_target_role_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.client_role_id ELSE NEW.client_role_id END;
      IF v_target_role_id IS NOT NULL AND v_target_role_id = v_self_role_id THEN
        RAISE EXCEPTION 'Client Admin cannot modify permissions on their own assigned role'
          USING ERRCODE = 'insufficient_privilege';
      END IF;

      IF TG_OP <> 'DELETE' THEN
        SELECT own.* INTO v_own_permissions
        FROM public.client_role_permissions own
        WHERE own.client_id = v_target_client_id
          AND own.client_role_id = v_self_role_id
          AND own.module_key = NEW.module_key
        LIMIT 1;
        v_has_own_permissions := FOUND;

        IF (NEW.can_view AND NOT COALESCE(v_own_permissions.can_view, false))
           OR (NEW.can_create AND NOT COALESCE(v_own_permissions.can_create, false))
           OR (NEW.can_edit AND NOT COALESCE(v_own_permissions.can_edit, false))
           OR (NEW.can_delete AND NOT COALESCE(v_own_permissions.can_delete, false))
           OR (NEW.can_approve AND NOT COALESCE(v_own_permissions.can_approve, false))
           OR (NEW.can_export AND NOT COALESCE(v_own_permissions.can_export, false))
           OR (NEW.can_import AND NOT COALESCE(v_own_permissions.can_import, false))
           OR (NEW.can_manage AND NOT COALESCE(v_own_permissions.can_manage, false))
           OR (NEW.can_configure AND NOT COALESCE(v_own_permissions.can_configure, false)) THEN
          RAISE EXCEPTION 'Client Admin cannot delegate permissions they do not hold'
            USING ERRCODE = 'insufficient_privilege';
        END IF;
      END IF;
    END IF;
  END IF;

  IF app.is_trusted_backend() THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.created_by := auth.uid();
    NEW.updated_by := auth.uid();
    NEW.created_at := now();
    NEW.updated_at := now();
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.created_by := OLD.created_by;
    NEW.created_at := OLD.created_at;
    NEW.updated_by := auth.uid();
    NEW.updated_at := now();
    RETURN NEW;
  END IF;
  RETURN OLD;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Prevent deactivating a client role while active users are assigned to it.
--    Also protect role audit actor/timestamp fields from caller spoofing.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION app.trg_protect_client_role_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NOT app.is_trusted_backend() AND NEW.client_id IS DISTINCT FROM OLD.client_id THEN
      RAISE EXCEPTION 'client_roles.client_id is immutable'
        USING ERRCODE = 'insufficient_privilege';
    END IF;

    IF OLD.status = 'active' AND NEW.status = 'inactive'
       AND EXISTS (
         SELECT 1 FROM public.client_users cu
         WHERE cu.client_id = OLD.client_id
           AND cu.client_role_id = OLD.id
           AND cu.status = 'active'
       ) THEN
      RAISE EXCEPTION 'Reassign or deactivate active users before deactivating this role'
        USING ERRCODE = 'foreign_key_violation';
    END IF;

    IF NOT app.is_trusted_backend() THEN
      NEW.created_by := OLD.created_by;
      NEW.created_at := OLD.created_at;
      NEW.updated_by := auth.uid();
      NEW.updated_at := now();
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    IF NOT app.is_trusted_backend() THEN
      NEW.created_by := auth.uid();
      NEW.updated_by := auth.uid();
      NEW.created_at := now();
      NEW.updated_at := now();
    END IF;
    RETURN NEW;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_client_roles_immutable ON public.client_roles;
DROP TRIGGER IF EXISTS trg_client_roles_lifecycle ON public.client_roles;
CREATE TRIGGER trg_client_roles_lifecycle
  BEFORE INSERT OR UPDATE ON public.client_roles
  FOR EACH ROW EXECUTE FUNCTION app.trg_protect_client_role_lifecycle();

COMMIT;

-- Post-apply verification (run separately in nido-dev SQL Editor):
-- SELECT to_regclass('public.nido_role_security_capabilities') AS capability_table;
-- SELECT policyname, cmd FROM pg_policies WHERE schemaname='public' AND tablename='nido_users';
-- SELECT tgname, tgenabled FROM pg_trigger WHERE tgrelid='public.client_roles'::regclass AND NOT tgisinternal;
-- Confirm this migration is applied to nido-dev only before proceeding to Phase 2C.
