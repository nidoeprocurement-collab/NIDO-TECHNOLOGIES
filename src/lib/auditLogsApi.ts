import { supabase } from '@/lib/supabase';

export interface SupabaseAuditLogEntry {
  id: string;
  event_type: string;
  outcome: string;
  actor_auth_user_id: string | null;
  target_auth_user_id: string | null;
  target_scope: string | null;
  target_email_masked: string | null;
  client_id: string | null;
  request_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export async function fetchNidoAuditLogsFromSupabase(options?: {
  limit?: number;
  eventPrefix?: string | null;
}): Promise<SupabaseAuditLogEntry[]> {
  const rpcFn = (supabase as unknown as { rpc?: unknown }).rpc;
  if (typeof rpcFn !== 'function') {
    throw new Error('Supabase RPC client is unavailable.');
  }

  const { data, error } = await supabase.rpc('get_nido_audit_logs', {
    p_limit: options?.limit ?? 150,
    p_event_prefix: options?.eventPrefix ?? null,
  });

  if (error) {
    throw new Error(error.message || 'Unable to load audit logs from Supabase.');
  }

  return (Array.isArray(data) ? data : []) as SupabaseAuditLogEntry[];
}

