import {
  cleanupAuthUser, createAdminClient, envValue, json, optionalString,
  preflight, requireString, safeErrorMessage, validateEmail,
  originAllowed,
} from '../_shared/core.ts';

function constantTimeEqual(a: string, b: string): boolean {
  const length = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < length; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

Deno.serve(async (req) => {
  const options = preflight(req);
  if (options) return options;
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405);
  if (!originAllowed(req)) return json(req, { error: 'Origin not allowed' }, 403);

  const configuredSecret = envValue('NIDO_BOOTSTRAP_SECRET');
  const suppliedSecret = req.headers.get('x-nido-bootstrap-secret') ?? '';
  if (!configuredSecret || configuredSecret.length < 32 || !constantTimeEqual(configuredSecret, suppliedSecret)) {
    return json(req, { error: 'Bootstrap authorization failed' }, 401);
  }

  let admin: ReturnType<typeof createAdminClient> | undefined;
  let authUserId: string | undefined;
  try {
    const body = await req.json();
    const email = validateEmail(body.email);
    const name = requireString(body.name, 'name', 120);
    const employeeId = requireString(body.employee_id, 'employee_id', 50);
    const phone = optionalString(body.phone, 40);
    const requestId = req.headers.get('x-request-id');
    admin = createAdminClient();

    const { data: invite, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      ...(envValue('NIDO_INVITE_REDIRECT_URL') ? { redirectTo: envValue('NIDO_INVITE_REDIRECT_URL') } : {}),
      data: { display_name: name, nido_scope: 'nido_internal', bootstrap: true },
    });
    if (inviteError || !invite.user?.id) throw inviteError ?? new Error('Invitation could not be created');
    authUserId = invite.user.id;

    // Role + registry + profile + audit are one DB transaction. This is
    // required by the existing deferred System Owner invariant trigger.
    const { data: result, error: provisionError } = await admin.rpc('bootstrap_nido_system_owner', {
      p_auth_user_id: authUserId,
      p_email: email,
      p_name: name,
      p_employee_id: employeeId,
      p_phone: phone,
      p_request_id: requestId,
    });
    if (provisionError || !result?.profile_id) {
      throw provisionError ?? new Error('System Owner profile could not be created');
    }

    authUserId = undefined; // Profile is committed; no rollback after this point.
    return json(req, {
      success: true,
      message: 'System Owner invitation created. The account can sign in only after accepting the invitation and confirming the email.',
      profile_id: result.profile_id,
      employee_id: result.employee_id,
    });
  } catch (error) {
    if (admin && authUserId) {
      await cleanupAuthUser(admin, authUserId, 'nido_internal');
    }
    console.error('System Owner bootstrap failed:', safeErrorMessage(error));
    return json(req, { error: safeErrorMessage(error) }, 400);
  }
});
