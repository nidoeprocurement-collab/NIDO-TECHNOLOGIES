import {
  createAdminClient,
  enforceRateLimit,
  HttpError,
  json,
  mapErrorToHttpResponse,
  originAllowed,
  parseJsonBody,
  preflight,
  RATE_LIMITS,
  requireCaller,
  requireInternalPermission,
  requireString,
  safeLogMessage,
  writeAudit,
} from '../_shared/core.ts';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertUuid(value: unknown, field: string): string {
  const str = requireString(value, field, 80);
  if (!UUID_REGEX.test(str)) {
    throw new HttpError(400, `${field} must be a valid UUID`, 'invalid_uuid');
  }
  return str;
}

Deno.serve(async (req) => {
  const options = preflight(req);
  if (options) return options;
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405);
  if (!originAllowed(req)) return json(req, { error: 'Origin not allowed' }, 403);

  let admin: ReturnType<typeof createAdminClient> | undefined;
  let actorId: string | null = null;
  let actionName = 'unknown';
  let targetClientId: string | null = null;
  const requestId = req.headers.get('x-request-id');

  try {
    const caller = await requireCaller(req);
    admin = caller.admin;
    actorId = caller.authUserId;
    const { context } = caller;

    if (context.user_scope !== 'nido_internal') {
      throw new HttpError(
        403,
        'Only internal NIDO users can manage impersonation sessions',
        'internal_context_required',
      );
    }

    const body = await parseJsonBody(req);
    actionName = requireString(body.action, 'action', 40);

    await enforceRateLimit(
      admin,
      RATE_LIMITS.manage_impersonation,
      actorId,
      requestId,
    );

    if (actionName === 'status') {
      requireInternalPermission(context, 'client_user_impersonation', 'view');

      const { data: active, error: activeErr } = await admin
        .from('nido_impersonation_sessions')
        .select(
          'id,actor_nido_user_id,target_client_user_id,target_client_id,mode,status,started_at,expires_at,client_users(id,name,email,user_type,client_id),client_organizations(id,name)',
        )
        .eq('actor_auth_user_id', actorId)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeErr) {
        throw new HttpError(
          500,
          'Unable to check impersonation session',
          'impersonation_status_failed',
          activeErr.message,
        );
      }

      return json(req, { success: true, session: active ?? null });
    }

    if (actionName === 'start') {
      requireInternalPermission(context, 'client_user_impersonation', 'manage');
      const targetClientUserId = assertUuid(body.target_client_user_id, 'target_client_user_id');
      const mode = body.mode === 'FULL_ACCESS' ? 'FULL_ACCESS' : 'VIEW_ONLY';

      const { data: targetUser, error: targetErr } = await admin
        .from('client_users')
        .select('id,auth_user_id,client_id,name,email,user_type,status')
        .eq('id', targetClientUserId)
        .maybeSingle();

      if (targetErr) {
        throw new HttpError(500, 'Unable to load target client user', 'client_user_lookup_failed', targetErr.message);
      }
      if (!targetUser) {
        throw new HttpError(404, 'Target client user not found', 'client_user_not_found');
      }
      if (String(targetUser.status ?? '').toLowerCase() !== 'active') {
        throw new HttpError(409, 'Only active client users can be impersonated', 'client_user_inactive');
      }

      targetClientId = targetUser.client_id;

      // End any previous active impersonation session for this actor
      await admin
        .from('nido_impersonation_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
          ended_reason: 'superseded',
        })
        .eq('actor_auth_user_id', actorId)
        .eq('status', 'active');

      const startedAt = new Date();
      const expiresAt = new Date(startedAt.getTime() + 60 * 60 * 1000);

      const { data: createdSession, error: insertErr } = await admin
        .from('nido_impersonation_sessions')
        .insert({
          actor_auth_user_id: actorId,
          actor_nido_user_id: context.profile.id,
          target_client_user_id: targetUser.id,
          target_client_id: targetUser.client_id,
          mode,
          status: 'active',
          started_at: startedAt.toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .select('id,actor_nido_user_id,target_client_user_id,target_client_id,mode,status,started_at,expires_at')
        .single();

      if (insertErr) {
        throw new HttpError(
          500,
          'Unable to start impersonation session',
          'impersonation_start_failed',
          insertErr.message,
        );
      }

      await writeAudit(admin, {
        actor_auth_user_id: actorId,
        target_auth_user_id: targetUser.auth_user_id,
        client_id: targetUser.client_id,
        target_scope: 'client_portal',
        event_type: 'impersonation.started',
        outcome: 'success',
        details: {
          target_table: 'nido_impersonation_sessions',
          target_id: createdSession.id,
          target_client_user_id: targetUser.id,
          mode,
          expires_at: createdSession.expires_at,
        },
        request_id: requestId,
      });

      return json(req, {
        success: true,
        action: actionName,
        session: createdSession,
        target_user: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          user_type: targetUser.user_type,
          client_id: targetUser.client_id,
        },
      }, 201);
    }

    if (actionName === 'stop') {
      requireInternalPermission(context, 'client_user_impersonation', 'view');
      const sessionId = body.session_id ? assertUuid(body.session_id, 'session_id') : null;
      const reason = typeof body.reason === 'string' && body.reason.trim() ? body.reason.trim() : 'manual';

      let query = admin
        .from('nido_impersonation_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
          ended_reason: reason,
        })
        .eq('actor_auth_user_id', actorId)
        .eq('status', 'active');

      if (sessionId) {
        query = query.eq('id', sessionId);
      }

      const { data: endedRows, error: stopErr } = await query
        .select('id,target_client_user_id,target_client_id,started_at,ended_at');

      if (stopErr) {
        throw new HttpError(
          500,
          'Unable to stop impersonation session',
          'impersonation_stop_failed',
          stopErr.message,
        );
      }

      for (const row of endedRows ?? []) {
        await writeAudit(admin, {
          actor_auth_user_id: actorId,
          client_id: row.target_client_id,
          target_scope: 'client_portal',
          event_type: 'impersonation.ended',
          outcome: 'success',
          details: {
            target_table: 'nido_impersonation_sessions',
            target_id: row.id,
            target_client_user_id: row.target_client_user_id,
            reason,
            started_at: row.started_at,
            ended_at: row.ended_at,
          },
          request_id: requestId,
        });
      }

      return json(req, {
        success: true,
        action: actionName,
        ended_count: (endedRows ?? []).length,
      });
    }

    throw new HttpError(400, `Unsupported action: ${actionName}`, 'unsupported_action');
  } catch (err) {
    const mapped = mapErrorToHttpResponse(err);
    if (admin) {
      await writeAudit(admin, {
        actor_auth_user_id: actorId,
        client_id: targetClientId,
        target_scope: 'client_portal',
        event_type: `impersonation.${actionName}.failed`,
        outcome: 'failure',
        details: { reason: mapped.reason, status: mapped.status, error: safeLogMessage(err) },
        request_id: requestId,
      });
    }
    return json(
      req,
      { error: mapped.publicMessage, reason: mapped.reason },
      mapped.status,
      mapped.headers,
    );
  }
});

