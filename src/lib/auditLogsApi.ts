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

export interface BusinessAuditLogRow {
  id: string;
  event_id: string | null;
  module: string;
  action: string;
  entity_type: string;
  entity_id: string;
  actor_id: string | null;
  actor_name: string;
  client_id: string | null;
  previous_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
  reason: string | null;
  is_internal_only: boolean;
  created_at: string;
}

export async function loadBusinessAuditLogsFromSupabase(options?: {
  limit?: number;
  module?: string;
}): Promise<BusinessAuditLogRow[]> {
  if (typeof (supabase as { from?: unknown })?.from !== 'function') {
    throw new Error('Supabase client is not initialized.');
  }
  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(options?.limit ?? 200);

  if (options?.module) {
    query = query.eq('module', options.module);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || 'Unable to load business audit logs.');
  }
  return Array.isArray(data) ? (data as BusinessAuditLogRow[]) : [];
}

export async function appendBusinessAuditLogInSupabase(params: {
  module: string;
  action: string;
  entityType: string;
  entityId: string;
  actorName: string;
  clientId?: string | null;
  previousValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  reason?: string;
  isInternalOnly?: boolean;
  eventId?: string;
}): Promise<BusinessAuditLogRow> {
  if (typeof (supabase as { rpc?: unknown })?.rpc !== 'function') {
    throw new Error('Supabase client is not initialized.');
  }
  const { data, error } = await supabase.rpc('append_audit_log', {
    p_module: params.module,
    p_action: params.action,
    p_entity_type: params.entityType,
    p_entity_id: params.entityId,
    p_actor_name: params.actorName,
    p_client_id: params.clientId ?? null,
    p_previous_values: params.previousValues ?? {},
    p_new_values: params.newValues ?? {},
    p_reason: params.reason ?? null,
    p_is_internal_only: Boolean(params.isInternalOnly),
    p_event_id: params.eventId ?? null,
  });
  if (error) {
    throw new Error(error.message || 'Unable to append audit log.');
  }
  return data as BusinessAuditLogRow;
}

