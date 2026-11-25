import { supabase } from '@/lib/supabase';
import {
  type NidoRole,
  SYSTEM_OWNER_ROLE,
  replaceRolesFromBackend,
} from '@/lib/nidoUsersStore';
import {
  type ModulePermissions,
  type RolePermissionMap,
  replaceRolePermissionsFromBackend,
} from '@/lib/permissionsStore';
import { BUILTIN_REFERENCE_ROLE_NAMES } from '@/lib/rbacFrontendImport';

export const SUPABASE_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isSupabaseUuid(id: string | undefined | null): boolean {
  return Boolean(id && SUPABASE_UUID_RE.test(id));
}

interface DbNidoRoleRow {
  id: string;
  name: string;
  department: string | null;
  description: string | null;
  status: string | null;
  is_system_owner: boolean | null;
}

interface DbNidoRolePermissionRow {
  role_id: string;
  module_key: string;
  can_view?: boolean | null;
  can_create?: boolean | null;
  can_edit?: boolean | null;
  can_delete?: boolean | null;
  can_approve?: boolean | null;
  can_export?: boolean | null;
  can_import?: boolean | null;
  can_manage?: boolean | null;
  can_configure?: boolean | null;
}

export interface RoleMutationValues {
  department: string;
  name: string;
  description: string;
  status: 'Active' | 'Inactive';
}

export interface SyncRolesBackendResult {
  roles: NidoRole[];
  permissionsByRoleName: RolePermissionMap;
  syncedFromBackend: boolean;
}

let inFlightSyncPromise: Promise<void> | null = null;

async function extractManageRolesError(
  error: unknown,
  data: unknown,
  fallback: string,
): Promise<string> {
  if (data && typeof data === 'object' && 'error' in data && typeof (data as { error?: unknown }).error === 'string') {
    return (data as { error: string }).error;
  }
  if (error && typeof error === 'object') {
    const context = (error as { context?: { json?: () => Promise<unknown>; text?: () => Promise<string> } }).context;
    if (context?.json) {
      try {
        const parsed = await context.json();
        if (parsed && typeof parsed === 'object' && 'error' in parsed && typeof (parsed as { error?: unknown }).error === 'string') {
          return (parsed as { error: string }).error;
        }
      } catch {
        // ignore JSON parse errors
      }
    }
    if (context?.text) {
      try {
        const txt = await context.text();
        if (txt) return txt;
      } catch {
        // ignore text read errors
      }
    }
    if ('message' in error && typeof (error as { message?: unknown }).message === 'string') {
      return (error as { message: string }).message;
    }
  }
  return fallback;
}

async function invokeManageNidoRoles<T = Record<string, unknown>>(
  body: Record<string, unknown>,
  fallbackError: string,
): Promise<T> {
  const invokeFn = (supabase as unknown as { functions?: { invoke?: unknown } }).functions?.invoke;
  if (typeof invokeFn !== 'function') {
    throw new Error('Supabase Edge Function client is unavailable.');
  }

  const { data, error } = await supabase.functions.invoke('manage-nido-roles', { body });
  if (error || !(data as { success?: boolean } | null)?.success) {
    const message = await extractManageRolesError(error, data, fallbackError);
    throw new Error(message);
  }
  return data as T;
}

function mapDbRoles(rows: DbNidoRoleRow[]): NidoRole[] {
  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name ?? ''),
    department: String(row.department ?? ''),
    description: String(row.description ?? ''),
    status: row.status === 'Inactive' ? 'Inactive' : 'Active',
  }));
}

function mapDbPermissions(
  roleRows: DbNidoRoleRow[],
  permissionRows: DbNidoRolePermissionRow[],
): RolePermissionMap {
  const roleNameById = new Map<string, string>();
  for (const role of roleRows) {
    roleNameById.set(String(role.id), String(role.name ?? ''));
  }

  const map: RolePermissionMap = {};
  for (const row of permissionRows) {
    const roleName = roleNameById.get(String(row.role_id));
    if (!roleName || roleName === SYSTEM_OWNER_ROLE) continue;
    if (!map[roleName]) map[roleName] = {};
    const perms: ModulePermissions = {};
    if (row.can_view) perms.view = true;
    if (row.can_create) perms.create = true;
    if (row.can_edit) perms.edit = true;
    if (row.can_delete) perms.delete = true;
    if (row.can_approve) perms.approve = true;
    if (row.can_export) perms.export = true;
    if (row.can_import) perms.import = true;
    if (row.can_manage) perms.manage = true;
    if (row.can_configure) perms.configure = true;
    map[roleName][row.module_key] = perms;
  }
  return map;
}

export async function syncNidoReferenceRolesInSupabase(): Promise<void> {
  if (!inFlightSyncPromise) {
    inFlightSyncPromise = invokeManageNidoRoles(
      { action: 'sync_reference_roles' },
      'Unable to synchronize built-in NIDO roles.',
    ).then(() => undefined).finally(() => {
      inFlightSyncPromise = null;
    });
  }
  return inFlightSyncPromise;
}

async function queryRolesAndPermissions(): Promise<{
  roleRows: DbNidoRoleRow[];
  permissionRows: DbNidoRolePermissionRow[];
}> {
  const fromFn = (supabase as unknown as { from?: (table: string) => unknown }).from;
  if (typeof fromFn !== 'function') {
    throw new Error('Supabase database client is unavailable.');
  }

  const roleQuery = supabase
    .from('nido_roles')
    .select('id, name, department, description, status, is_system_owner');
  const { data: roleData, error: roleError } = await (
    typeof (roleQuery as unknown as { order?: unknown }).order === 'function'
      ? (roleQuery as unknown as { order: (col: string, opts: { ascending: boolean }) => Promise<{ data: unknown; error: { message?: string } | null }> }).order('created_at', { ascending: true })
      : (roleQuery as unknown as Promise<{ data: unknown; error: { message?: string } | null }>)
  );

  if (roleError) {
    throw new Error(roleError.message || 'Failed to load NIDO roles from Supabase.');
  }

  const roleRows = Array.isArray(roleData) ? (roleData as DbNidoRoleRow[]) : [];

  const { data: permData, error: permError } = await supabase
    .from('nido_role_permissions')
    .select(
      'role_id, module_key, can_view, can_create, can_edit, can_delete, can_approve, can_export, can_import, can_manage, can_configure',
    );

  if (permError) {
    throw new Error(permError.message || 'Failed to load NIDO role permissions from Supabase.');
  }

  const permissionRows = Array.isArray(permData) ? (permData as DbNidoRolePermissionRow[]) : [];
  return { roleRows, permissionRows };
}

export async function loadNidoRolesAndPermissionsFromSupabase(options?: {
  autoSyncIfMissing?: boolean | 'if_empty';
}): Promise<SyncRolesBackendResult> {
  let { roleRows, permissionRows } = await queryRolesAndPermissions();
  let syncedFromBackend = false;

  const existingRoleNames = new Set(
    roleRows.map((r) => String(r.name ?? '').trim().toLowerCase()),
  );
  const hasNonSystemOwnerRoles = roleRows.some(
    (r) => !r.is_system_owner && r.name !== SYSTEM_OWNER_ROLE,
  );
  const hasMissingBuiltInRoles = BUILTIN_REFERENCE_ROLE_NAMES.some(
    (name) => !existingRoleNames.has(name.trim().toLowerCase()),
  );

  // When 'if_empty', only auto-sync if zero non-System-Owner roles exist.
  // When true, auto-sync whenever any built-in reference role is missing, even if custom roles exist.
  const shouldAutoSync =
    options?.autoSyncIfMissing === 'if_empty'
      ? !hasNonSystemOwnerRoles
      : options?.autoSyncIfMissing === true && hasMissingBuiltInRoles;

  if (shouldAutoSync) {
    await syncNidoReferenceRolesInSupabase();
    syncedFromBackend = true;
    const reloaded = await queryRolesAndPermissions();
    roleRows = reloaded.roleRows;
    permissionRows = reloaded.permissionRows;
  }

  const mappedRoles = mapDbRoles(roleRows);
  const permissionsByRoleName = mapDbPermissions(roleRows, permissionRows);

  const hydratedRoles = replaceRolesFromBackend(mappedRoles);
  replaceRolePermissionsFromBackend(permissionsByRoleName);

  return {
    roles: hydratedRoles,
    permissionsByRoleName,
    syncedFromBackend,
  };
}

export async function createNidoRoleInSupabase(
  values: RoleMutationValues,
): Promise<NidoRole> {
  const res = await invokeManageNidoRoles<{ role: DbNidoRoleRow }>(
    {
      action: 'create_role',
      name: values.name,
      department: values.department,
      description: values.description,
      status: values.status,
    },
    'Unable to create role in Supabase.',
  );

  return {
    id: String(res.role.id),
    name: String(res.role.name),
    department: String(res.role.department ?? ''),
    description: String(res.role.description ?? ''),
    status: res.role.status === 'Inactive' ? 'Inactive' : 'Active',
  };
}

export async function updateNidoRoleInSupabase(
  roleId: string,
  values: RoleMutationValues,
): Promise<NidoRole> {
  const res = await invokeManageNidoRoles<{ role: DbNidoRoleRow }>(
    {
      action: 'update_role',
      role_id: roleId,
      name: values.name,
      department: values.department,
      description: values.description,
      status: values.status,
    },
    'Unable to update role in Supabase.',
  );

  return {
    id: String(res.role.id),
    name: String(res.role.name),
    department: String(res.role.department ?? ''),
    description: String(res.role.description ?? ''),
    status: res.role.status === 'Inactive' ? 'Inactive' : 'Active',
  };
}

export async function saveNidoRolePermissionsInSupabase(
  roleId: string,
  permissions: Record<string, ModulePermissions>,
): Promise<void> {
  await invokeManageNidoRoles(
    {
      action: 'save_role_permissions',
      role_id: roleId,
      permissions,
    },
    'Unable to save role permissions in Supabase.',
  );
}

export async function deleteNidoRoleInSupabase(roleId: string): Promise<void> {
  await invokeManageNidoRoles(
    {
      action: 'delete_role',
      role_id: roleId,
    },
    'Unable to delete role in Supabase.',
  );
}
