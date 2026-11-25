import {
  createAdminClient,
  enforceRateLimit,
  HttpError,
  json,
  mapErrorToHttpResponse,
  optionalString,
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

const ALLOWED_STATUSES = new Set(['Active', 'Inactive', 'Suspended']);

Deno.serve(async (req) => {
  const options = preflight(req);
  if (options) return options;
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405);
  if (!originAllowed(req)) return json(req, { error: 'Origin not allowed' }, 403);

  let admin: ReturnType<typeof createAdminClient> | undefined;
  let actorId: string | null = null;
  let actionName = 'unknown';
  let targetAuthUserId: string | null = null;
  const requestId = req.headers.get('x-request-id');

  try {
    const caller = await requireCaller(req);
    admin = caller.admin;
    actorId = caller.authUserId;
    const { context } = caller;

    if (context.user_scope !== 'nido_internal') {
      throw new HttpError(
        403,
        'Internal NIDO user context required',
        'internal_context_required',
      );
    }

    const body = await parseJsonBody(req);
    actionName = requireString(body.action, 'action', 64);

    await enforceRateLimit(
      admin,
      RATE_LIMITS.manage_nido_users,
      actorId,
      requestId,
    );

    if (actionName === 'list_login_history') {
      requireInternalPermission(context, 'users', 'view');
      const userId = assertUuid(body.user_id, 'user_id');

      const { data: history, error: histErr } = await admin
        .from('nido_login_history')
        .select('id,email,outcome,failure_reason,ip_address,user_agent,created_at')
        .eq('nido_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (histErr) {
        throw new HttpError(
          500,
          'Unable to load login history',
          'login_history_lookup_failed',
          histErr.message,
        );
      }

      return json(req, {
        success: true,
        action: actionName,
        history: history ?? [],
      });
    }

    const userId = assertUuid(body.user_id, 'user_id');

    const { data: targetUser, error: userLookupErr } = await admin
      .from('nido_users')
      .select(
        'id,auth_user_id,name,email,role_id,status,department,designation,job_title,phone,nido_roles(id,name,is_system_owner)',
      )
      .eq('id', userId)
      .maybeSingle();

    if (userLookupErr) {
      throw new HttpError(
        500,
        'Unable to load target user',
        'user_lookup_failed',
        userLookupErr.message,
      );
    }
    if (!targetUser) {
      throw new HttpError(404, 'Internal user not found', 'user_not_found');
    }

    targetAuthUserId = targetUser.auth_user_id ?? null;
    const targetRoleObj = Array.isArray(targetUser.nido_roles)
      ? targetUser.nido_roles[0]
      : targetUser.nido_roles;
    if (targetRoleObj?.is_system_owner) {
      throw new HttpError(
        403,
        'The System Owner account is protected and cannot be modified',
        'system_owner_protected',
      );
    }

    if (actionName === 'update_user') {
      requireInternalPermission(context, 'users', 'edit');

      const name = requireString(body.name, 'name', 120);
      const department = optionalString(body.department, 120) ?? '';
      const designation = optionalString(body.designation, 120);
      const jobTitle = optionalString(body.job_title, 120);
      const phone = optionalString(body.phone, 40);
      const roleId = body.role_id ? assertUuid(body.role_id, 'role_id') : targetUser.role_id;

      if (roleId !== targetUser.role_id) {
        requireInternalPermission(context, 'users', 'manage');
        const { data: nextRole, error: roleErr } = await admin
          .from('nido_roles')
          .select('id,status,is_system_owner')
          .eq('id', roleId)
          .maybeSingle();
        if (roleErr || !nextRole) {
          throw new HttpError(404, 'Selected role was not found', 'role_not_found');
        }
        if (nextRole.is_system_owner) {
          throw new HttpError(403, 'Cannot assign System Owner role', 'system_owner_protected');
        }
        if (nextRole.status !== 'Active') {
          throw new HttpError(409, 'Selected role is inactive', 'role_inactive');
        }
      }

      const { data: updated, error: updateErr } = await admin
        .from('nido_users')
        .update({
          name,
          department,
          designation,
          job_title: jobTitle,
          phone,
          role_id: roleId,
          updated_by: actorId,
        })
        .eq('id', userId)
        .select('id,auth_user_id,employee_id,name,email,phone,role_id,department,designation,job_title,status,last_login_at,updated_at')
        .single();

      if (updateErr) {
        throw new HttpError(
          500,
          'Unable to update internal user',
          'user_update_failed',
          updateErr.message,
        );
      }

      await writeAudit(admin, {
        actorAuthUserId: actorId,
        targetAuthUserId,
        targetEmail: targetUser.email,
        action: 'nido_users.update',
        targetTable: 'nido_users',
        targetId: userId,
        metadata: {
          previous_role_id: targetUser.role_id,
          next_role_id: roleId,
        },
        requestId,
      });

      return json(req, { success: true, action: actionName, user: updated });
    }

    if (actionName === 'set_status') {
      requireInternalPermission(context, 'users', 'manage');
      const nextStatus = requireString(body.status, 'status', 32);
      if (!ALLOWED_STATUSES.has(nextStatus)) {
        throw new HttpError(
          400,
          'status must be Active, Inactive, or Suspended',
          'invalid_user_status',
        );
      }
      if (targetUser.auth_user_id === actorId && nextStatus !== 'Active') {
        throw new HttpError(
          409,
          'You cannot deactivate or suspend your own active account',
          'self_status_change_blocked',
        );
      }

      const { data: updated, error: statusErr } = await admin
        .from('nido_users')
        .update({
          status: nextStatus,
          deactivated_at: nextStatus === 'Inactive' ? new Date().toISOString() : null,
          updated_by: actorId,
        })
        .eq('id', userId)
        .select('id,status,deactivated_at,updated_at')
        .single();

      if (statusErr) {
        throw new HttpError(
          500,
          'Unable to update user status',
          'user_status_update_failed',
          statusErr.message,
        );
      }

      await writeAudit(admin, {
        actorAuthUserId: actorId,
        targetAuthUserId,
        targetEmail: targetUser.email,
        action: 'nido_users.set_status',
        targetTable: 'nido_users',
        targetId: userId,
        metadata: { previous_status: targetUser.status, next_status: nextStatus },
        requestId,
      });

      return json(req, { success: true, action: actionName, user: updated });
    }

    if (actionName === 'unlock_user') {
      requireInternalPermission(context, 'users', 'manage');

      const { data: updated, error: unlockErr } = await admin
        .from('nido_users')
        .update({
          status: 'Active',
          updated_by: actorId,
        })
        .eq('id', userId)
        .select('id,status,updated_at')
        .single();

      if (unlockErr) {
        throw new HttpError(
          500,
          'Unable to unlock user',
          'user_unlock_failed',
          unlockErr.message,
        );
      }

      await writeAudit(admin, {
        actorAuthUserId: actorId,
        targetAuthUserId,
        targetEmail: targetUser.email,
        action: 'nido_users.unlock',
        targetTable: 'nido_users',
        targetId: userId,
        metadata: { previous_status: targetUser.status },
        requestId,
      });

      return json(req, { success: true, action: actionName, user: updated });
    }

    if (actionName === 'deactivate_user') {
      requireInternalPermission(context, 'users', 'delete');
      if (targetUser.auth_user_id === actorId) {
        throw new HttpError(
          409,
          'You cannot deactivate your own active account',
          'self_deactivation_blocked',
        );
      }

      // Safe deactivation preserves audit and foreign-key integrity
      const { data: updated, error: deactErr } = await admin
        .from('nido_users')
        .update({
          status: 'Inactive',
          deactivated_at: new Date().toISOString(),
          updated_by: actorId,
        })
        .eq('id', userId)
        .select('id,status,deactivated_at')
        .single();

      if (deactErr) {
        throw new HttpError(
          500,
          'Unable to deactivate user',
          'user_deactivate_failed',
          deactErr.message,
        );
      }

      await writeAudit(admin, {
        actorAuthUserId: actorId,
        targetAuthUserId,
        targetEmail: targetUser.email,
        action: 'nido_users.deactivate',
        targetTable: 'nido_users',
        targetId: userId,
        metadata: { previous_status: targetUser.status },
        requestId,
      });

      return json(req, { success: true, action: actionName, user: updated });
    }

    throw new HttpError(400, `Unsupported action: ${actionName}`, 'unsupported_action');
  } catch (err) {
    const mapped = mapErrorToHttpResponse(err);
    if (admin) {
      await writeAudit(admin, {
        actor_auth_user_id: actorId,
        target_auth_user_id: targetAuthUserId,
        target_scope: 'nido_internal',
        event_type: `nido_users.${actionName}.failed`,
        outcome: 'failure',
        details: {
          target_table: 'nido_users',
          reason: mapped.reason,
          status: mapped.status,
          error: safeLogMessage(err),
        },
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

