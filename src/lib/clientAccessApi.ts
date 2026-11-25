import { supabase } from '@/lib/supabase';
import { invokeSupabaseEdgeFunction } from '@/lib/edgeFunctionError';
import type { ModulePermissions, RolePermissionMap } from '@/lib/permissionsStore';

export interface SupabaseClientRole {
  id: string;
  client_id: string;
  name: string;
  description: string;
  status: 'Active' | 'Inactive';
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseClientUser {
  id: string;
  auth_user_id: string | null;
  client_id: string;
  client_employee_code: string;
  user_type: 'client_admin' | 'client_user';
  client_role_id: string | null;
  role_name: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  last_login_at?: string | null;
  created_at?: string;
}

export interface SupabaseClientModule {
  module_key: string;
  label: string;
  description: string;
}

export async function loadClientAccessDataFromSupabase(clientId?: string): Promise<{
  roles: SupabaseClientRole[];
  users: SupabaseClientUser[];
  permissionsByRoleId: RolePermissionMap;
  modules: SupabaseClientModule[];
}> {
  const fromFn = (supabase as unknown as { from?: (table: string) => unknown }).from;
  if (typeof fromFn !== 'function') {
    throw new Error('Supabase database client is unavailable.');
  }

  let rolesQuery = supabase
    .from('client_roles')
    .select('id,client_id,name,description,status,created_at,updated_at')
    .order('created_at', { ascending: true });
  if (clientId) rolesQuery = rolesQuery.eq('client_id', clientId);

  let usersQuery = supabase
    .from('client_users')
    .select(
      'id,auth_user_id,client_id,client_employee_code,user_type,client_role_id,name,email,phone,department,designation,status,last_login_at,created_at',
    )
    .order('created_at', { ascending: false });
  if (clientId) usersQuery = usersQuery.eq('client_id', clientId);

  let permsQuery = supabase
    .from('client_role_permissions')
    .select(
      'client_role_id,module_key,can_view,can_create,can_edit,can_delete,can_approve,can_export,can_import,can_manage,can_configure',
    );
  if (clientId) permsQuery = permsQuery.eq('client_id', clientId);

  const catalogQuery = supabase
    .from('client_module_catalog')
    .select('module_key,label,description')
    .order('display_order', { ascending: true });

  const [rolesRes, usersRes, permsRes, catalogRes] = await Promise.all([
    rolesQuery,
    usersQuery,
    permsQuery,
    catalogQuery,
  ]);

  if (rolesRes.error) throw new Error(rolesRes.error.message);
  if (usersRes.error) throw new Error(usersRes.error.message);
  if (permsRes.error) throw new Error(permsRes.error.message);
  if (catalogRes.error) throw new Error(catalogRes.error.message);

  const roles: SupabaseClientRole[] = (rolesRes.data ?? []).map((r) => ({
    id: String(r.id),
    client_id: String(r.client_id),
    name: String(r.name ?? ''),
    description: String(r.description ?? ''),
    status: String(r.status ?? '').toLowerCase() === 'inactive' ? 'Inactive' : 'Active',
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));

  const roleNameById = new Map(roles.map((r) => [r.id, r.name]));

  const users: SupabaseClientUser[] = (usersRes.data ?? []).map((u) => ({
    id: String(u.id),
    auth_user_id: u.auth_user_id ?? null,
    client_id: String(u.client_id),
    client_employee_code: String(u.client_employee_code ?? ''),
    user_type: u.user_type === 'client_admin' ? 'client_admin' : 'client_user',
    client_role_id: u.client_role_id ? String(u.client_role_id) : null,
    role_name: u.client_role_id
      ? (roleNameById.get(String(u.client_role_id)) ?? (u.user_type === 'client_admin' ? 'Client Admin' : 'Unassigned'))
      : u.user_type === 'client_admin'
        ? 'Client Admin'
        : 'Unassigned',
    name: String(u.name ?? ''),
    email: String(u.email ?? ''),
    phone: String(u.phone ?? ''),
    department: String(u.department ?? ''),
    designation: String(u.designation ?? ''),
    status: (() => {
      const normalized = String(u.status ?? '').toLowerCase();
      if (normalized === 'inactive') return 'Inactive' as const;
      if (normalized === 'suspended') return 'Suspended' as const;
      return 'Active' as const;
    })(),
    last_login_at: u.last_login_at ?? null,
    created_at: u.created_at,
  }));

  const permissionsByRoleId: RolePermissionMap = {};
  for (const row of permsRes.data ?? []) {
    const rid = String(row.client_role_id);
    if (!permissionsByRoleId[rid]) permissionsByRoleId[rid] = {};
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
    permissionsByRoleId[rid][String(row.module_key)] = perms;
  }

  const modules: SupabaseClientModule[] = (catalogRes.data ?? []).map((m) => ({
    module_key: String(m.module_key),
    label: String(m.label ?? m.module_key),
    description: String(m.description ?? ''),
  }));

  return { roles, users, permissionsByRoleId, modules };
}

export async function provisionClientUserInSupabase(payload: {
  client_id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  designation?: string;
  client_role_id?: string | null;
  user_type?: 'client_admin' | 'client_user';
}): Promise<void> {
  await invokeSupabaseEdgeFunction(
    'provision-client-access',
    {
      action: 'create_client_user',
      ...payload,
    },
    'Unable to provision client user.',
  );
}

export async function createClientRoleInSupabase(
  clientId: string,
  values: { name: string; description: string; status: 'Active' | 'Inactive' },
): Promise<SupabaseClientRole> {
  const res = await invokeSupabaseEdgeFunction<{ role: SupabaseClientRole }>(
    'manage-client-access',
    {
      action: 'create_client_role',
      client_id: clientId,
      ...values,
    },
    'Unable to create client role.',
  );
  return {
    ...res.role,
    status: String(res.role.status ?? '').toLowerCase() === 'inactive' ? 'Inactive' : 'Active',
  };
}

export async function updateClientRoleInSupabase(
  clientId: string,
  clientRoleId: string,
  values: { name: string; description: string; status: 'Active' | 'Inactive' },
): Promise<SupabaseClientRole> {
  const res = await invokeSupabaseEdgeFunction<{ role: SupabaseClientRole }>(
    'manage-client-access',
    {
      action: 'update_client_role',
      client_id: clientId,
      client_role_id: clientRoleId,
      ...values,
    },
    'Unable to update client role.',
  );
  return {
    ...res.role,
    status: String(res.role.status ?? '').toLowerCase() === 'inactive' ? 'Inactive' : 'Active',
  };
}

export async function saveClientRolePermissionsInSupabase(
  clientId: string,
  clientRoleId: string,
  permissions: Record<string, ModulePermissions>,
): Promise<void> {
  await invokeSupabaseEdgeFunction(
    'manage-client-access',
    {
      action: 'save_client_role_permissions',
      client_id: clientId,
      client_role_id: clientRoleId,
      permissions,
    },
    'Unable to save client role permissions.',
  );
}

export async function updateClientUserInSupabase(
  clientId: string,
  clientUserId: string,
  values: {
    name: string;
    phone?: string;
    department?: string;
    designation?: string;
    status: 'Active' | 'Inactive' | 'Suspended';
    client_role_id?: string | null;
  },
): Promise<void> {
  await invokeSupabaseEdgeFunction(
    'manage-client-access',
    {
      action: 'update_client_user',
      client_id: clientId,
      client_user_id: clientUserId,
      ...values,
    },
    'Unable to update client user.',
  );
}

