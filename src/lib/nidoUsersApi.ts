import { supabase } from '@/lib/supabase';
import { invokeSupabaseEdgeFunction } from '@/lib/edgeFunctionError';
import {
  type NidoUser,
  type LoginHistoryEntry,
  saveUsers,
} from '@/lib/nidoUsersStore';

interface DbNidoUserRow {
  id: string;
  auth_user_id: string | null;
  employee_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  role_id: string;
  job_title: string | null;
  designation: string | null;
  reporting_manager_name: string | null;
  department: string | null;
  status: string;
  date_of_joining: string | null;
  force_password_change: boolean | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  nido_roles?:
    | { id: string; name: string; is_system_owner: boolean | null }
    | Array<{ id: string; name: string; is_system_owner: boolean | null }>
    | null;
}

export function mapDbUserToNidoUser(row: DbNidoUserRow): NidoUser {
  const roleObj = Array.isArray(row.nido_roles) ? row.nido_roles[0] : row.nido_roles;
  const normalizedStatus: NidoUser['status'] =
    row.status === 'Inactive'
      ? 'Inactive'
      : row.status === 'Suspended'
        ? 'Suspended'
        : 'Active';

  return {
    id: String(row.id),
    employeeId: String(row.employee_id ?? ''),
    name: String(row.name ?? ''),
    email: String(row.email ?? ''),
    password: '',
    phone: String(row.phone ?? ''),
    role: String(roleObj?.name ?? ''),
    jobTitle: String(row.job_title ?? ''),
    designation: String(row.designation ?? ''),
    reportingManager: String(row.reporting_manager_name ?? ''),
    department: String(row.department ?? ''),
    status: normalizedStatus,
    dateOfJoining: row.date_of_joining ?? undefined,
    lastLogin: row.last_login_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    forcePasswordChange: Boolean(row.force_password_change),
    invitationStatus: row.last_login_at ? 'accepted' : 'sent',
    locked: normalizedStatus === 'Suspended',
  };
}

export async function loadNidoUsersFromSupabase(): Promise<NidoUser[]> {
  const fromFn = (supabase as unknown as { from?: (table: string) => unknown }).from;
  if (typeof fromFn !== 'function') {
    throw new Error('Supabase database client is unavailable.');
  }

  const query = supabase
    .from('nido_users')
    .select(
      'id,auth_user_id,employee_id,name,email,phone,role_id,job_title,designation,reporting_manager_name,department,status,date_of_joining,force_password_change,last_login_at,created_at,updated_at,nido_roles(id,name,is_system_owner)',
    );

  const { data, error } = await (
    typeof (query as unknown as { order?: unknown }).order === 'function'
      ? (query as unknown as { order: (col: string, opts: { ascending: boolean }) => Promise<{ data: unknown; error: { message?: string } | null }> }).order('created_at', { ascending: false })
      : (query as unknown as Promise<{ data: unknown; error: { message?: string } | null }>)
  );

  if (error) {
    throw new Error(error.message || 'Unable to load internal users from Supabase.');
  }

  const mapped = (Array.isArray(data) ? (data as DbNidoUserRow[]) : []).map(mapDbUserToNidoUser);
  localStorage.setItem('nido_users_backend_synced', '1');
  saveUsers(mapped);
  return mapped;
}

export async function updateNidoUserInSupabase(
  userId: string,
  payload: {
    name: string;
    role_id?: string;
    department?: string;
    designation?: string;
    job_title?: string;
    phone?: string;
  },
): Promise<void> {
  await invokeSupabaseEdgeFunction(
    'manage-nido-users',
    {
      action: 'update_user',
      user_id: userId,
      ...payload,
    },
    'Unable to update internal user in Supabase.',
  );
}

export async function setNidoUserStatusInSupabase(
  userId: string,
  status: 'Active' | 'Inactive' | 'Suspended',
): Promise<void> {
  await invokeSupabaseEdgeFunction(
    'manage-nido-users',
    {
      action: 'set_status',
      user_id: userId,
      status,
    },
    'Unable to update user status in Supabase.',
  );
}

export async function unlockNidoUserInSupabase(userId: string): Promise<void> {
  await invokeSupabaseEdgeFunction(
    'manage-nido-users',
    {
      action: 'unlock_user',
      user_id: userId,
    },
    'Unable to unlock user in Supabase.',
  );
}

export async function deactivateNidoUserInSupabase(userId: string): Promise<void> {
  await invokeSupabaseEdgeFunction(
    'manage-nido-users',
    {
      action: 'deactivate_user',
      user_id: userId,
    },
    'Unable to deactivate user in Supabase.',
  );
}

export async function fetchNidoUserLoginHistoryFromSupabase(
  userId: string,
): Promise<LoginHistoryEntry[]> {
  const res = await invokeSupabaseEdgeFunction<{
    history?: Array<{
      created_at: string;
      outcome: string;
      failure_reason?: string | null;
      ip_address?: string | null;
      user_agent?: string | null;
    }>;
  }>(
    'manage-nido-users',
    {
      action: 'list_login_history',
      user_id: userId,
    },
    'Unable to load user login history.',
  );

  return (res.history ?? []).map((entry) => ({
    timestamp: entry.created_at,
    result:
      entry.outcome === 'success'
        ? 'success'
        : entry.failure_reason === 'suspended'
          ? 'suspended'
          : entry.failure_reason === 'inactive'
            ? 'inactive'
            : entry.failure_reason === 'locked'
              ? 'locked'
              : 'invalid_password',
    ip: entry.ip_address ?? undefined,
    device: entry.user_agent ?? undefined,
  }));
}

