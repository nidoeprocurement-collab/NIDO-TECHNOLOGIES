import {
  cleanupAuthUser,
  createAdminClient,
  enforceRateLimit,
  envValue,
  HttpError,
  json,
  mapErrorToHttpResponse,
  optionalString,
  originAllowed,
  parseJsonBody,
  preflight,
  RATE_LIMITS,
  requireString,
  safeLogMessage,
  validateEmail,
  writeAudit,
} from '../_shared/core.ts';

function constantTimeEqual(a: string, b: string): boolean {
  const length = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < length; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

Deno.serve(async (req) => {
  const options = preflight(req);
  if (options) return options;
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405);
  if (!originAllowed(req)) return json(req, { error: 'Origin not allowed' }, 403);

  const requestId = req.headers.get('x-request-id');
  const configuredSecret = envValue('NIDO_BOOTSTRAP_SECRET');
  const suppliedSecret = req.headers.get('x-nido-bootstrap-secret') ?? '';
  if (
    !configuredSecret ||
    configuredSecret.length < 32 ||
    !constantTimeEqual(configuredSecret, suppliedSecret)
  ) {
    try {
      const auditAdmin = createAdminClient();
      await writeAudit(auditAdmin, {
        event_type: 'system_owner_bootstrap_failed',
        outcome: 'failure',
        target_auth_user_id: null,
        target_scope: 'nido_internal',
        request_id: requestId,
        details: { reason: 'invalid_bootstrap_secret', status: 401 },
      });
    } catch {
      // Do not fail 401 response if audit client is unavailable.
    }
    return json(req, { error: 'Bootstrap authorization failed' }, 401);
  }

  let admin: ReturnType<typeof createAdminClient> | undefined;
  let authUserId: string | undefined;
  let targetEmail: string | null = null;

  try {
    admin = createAdminClient();
    const body = await parseJsonBody(req);
    const email = validateEmail(body.email);
    targetEmail = email;
    const name = requireString(body.name, 'name', 120);
    const employeeId = requireString(body.employee_id, 'employee_id', 50);
    const phone = optionalString(body.phone, 40);

    // Pre-check before inviteUserByEmail so repeated attempts do not send
    // unnecessary invitation emails. The DB advisory lock and trigger remain
    // the authoritative concurrency and uniqueness guarantee.
    const { data: existingRole, error: roleCheckError } = await admin
      .from('nido_roles')
      .select('id,status')
      .eq('is_system_owner', true)
      .maybeSingle();

    if (roleCheckError) {
      throw new HttpError(
        500,
        'Unable to verify bootstrap eligibility',
        'bootstrap_precheck_failed',
        roleCheckError.message,
      );
    }

    if (existingRole) {
      const { data: existingOwner, error: ownerCheckError } = await admin
        .from('nido_users')
        .select('id')
        .eq('role_id', existingRole.id)
        .limit(1)
        .maybeSingle();

      if (ownerCheckError) {
        throw new HttpError(
          500,
          'Unable to verify bootstrap eligibility',
          'bootstrap_precheck_failed',
          ownerCheckError.message,
        );
      }

      if (existingOwner) {
        throw new HttpError(
          409,
          'System Owner already exists; bootstrap is one-time',
          'already_bootstrapped',
        );
      }

      if (existingRole.status !== 'Active') {
        throw new HttpError(
          409,
          'Existing System Owner role is inactive; manual review required',
          'inactive_system_owner_role',
        );
      }
    }

    await enforceRateLimit(admin, RATE_LIMITS.bootstrap_system_owner, 'global');

    const redirectTo = envValue('NIDO_INVITE_REDIRECT_URL');
    const { data: invite, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(email, {
        ...(redirectTo ? { redirectTo } : {}),
        data: { display_name: name, nido_scope: 'nido_internal', bootstrap: true },
      });
    if (inviteError || !invite.user?.id) {
      const msg = inviteError?.message ?? 'Invitation could not be created';
      if (/already been registered|already exists|duplicate/i.test(msg)) {
        throw new HttpError(
          409,
          'An account with this email already exists',
          'duplicate_auth_email',
          msg,
        );
      }
      throw new HttpError(
        500,
        'Unable to create System Owner invitation',
        'invite_creation_failed',
        msg,
      );
    }
    authUserId = invite.user.id;

    // Role + registry + profile + audit are one DB transaction. This is
    // required by the existing deferred System Owner invariant trigger.
    const { data: result, error: provisionError } = await admin.rpc(
      'bootstrap_nido_system_owner',
      {
        p_auth_user_id: authUserId,
        p_email: email,
        p_name: name,
        p_employee_id: employeeId,
        p_phone: phone,
        p_request_id: requestId,
      },
    );
    if (provisionError || !result?.profile_id) {
      throw (
        provisionError ??
        new HttpError(
          500,
          'System Owner profile could not be created',
          'bootstrap_rpc_failed',
        )
      );
    }

    authUserId = undefined; // Profile is committed; no rollback after this point.
    return json(req, {
      success: true,
      message:
        'System Owner invitation created. The account can sign in only after accepting the invitation and confirming the email.',
      profile_id: result.profile_id,
      employee_id: result.employee_id,
    });
  } catch (error) {
    if (admin && authUserId) {
      await cleanupAuthUser(admin, authUserId, 'nido_internal');
    }
    console.error('System Owner bootstrap failed:', safeLogMessage(error));
    const mapped = mapErrorToHttpResponse(error);
    if (admin) {
      await writeAudit(admin, {
        event_type: 'system_owner_bootstrap_failed',
        outcome: 'failure',
        target_auth_user_id: null,
        target_scope: 'nido_internal',
        target_email: targetEmail,
        request_id: requestId,
        details: { reason: mapped.reason, status: mapped.status },
      });
    }
    return json(
      req,
      { error: mapped.publicMessage },
      mapped.status,
      mapped.headers,
    );
  }
});
