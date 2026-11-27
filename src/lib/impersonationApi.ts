import { invokeSupabaseEdgeFunction } from '@/lib/edgeFunctionError';
import type { ImpersonationMode } from '@/lib/impersonationStore';

export interface ServerImpersonationSession {
  id: string;
  actor_nido_user_id: string;
  target_client_user_id: string;
  target_client_id: string;
  mode: ImpersonationMode;
  status: 'active' | 'ended' | 'expired' | 'revoked';
  started_at: string;
  expires_at: string;
  client_users?: {
    id: string;
    name: string;
    email: string;
    user_type: string;
    client_id: string;
  } | null;
  client_organizations?: {
    id: string;
    name: string;
  } | null;
}

export async function fetchActiveImpersonationSessionFromSupabase(): Promise<ServerImpersonationSession | null> {
  const res = await invokeSupabaseEdgeFunction<{ session?: ServerImpersonationSession | null }>(
    'manage-impersonation',
    { action: 'status' },
    'Unable to check active impersonation session.',
  );
  return res.session ?? null;
}

export async function startImpersonationInSupabase(
  targetClientUserId: string,
  mode: ImpersonationMode = 'VIEW_ONLY',
): Promise<ServerImpersonationSession> {
  const res = await invokeSupabaseEdgeFunction<{ session: ServerImpersonationSession }>(
    'manage-impersonation',
    {
      action: 'start',
      target_client_user_id: targetClientUserId,
      mode,
    },
    'Unable to start impersonation session.',
  );
  return res.session;
}

export async function stopImpersonationInSupabase(
  sessionId?: string,
  reason = 'manual',
): Promise<number> {
  const res = await invokeSupabaseEdgeFunction<{ ended_count?: number }>(
    'manage-impersonation',
    {
      action: 'stop',
      session_id: sessionId,
      reason,
    },
    'Unable to stop impersonation session.',
  );
  return Number(res.ended_count ?? 0);
}

