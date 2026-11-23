import {
  createAdminClient,
  enforceRateLimit,
  envValue,
  HttpError,
  json,
  mapErrorToHttpResponse,
  originAllowed,
  parseJsonBody,
  preflight,
  RATE_LIMITS,
  requireString,
  safeLogMessage,
  validateEmail,
  writeAudit,
} from '../_shared/core.ts';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function constantTimeEqual(a: string, b: string): boolean {
  const length = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < length; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildInvitationEmailHtml(recipientName: string, actionLink: string): string {
  const safeName = escapeHtml(recipientName);
  const safeLink = escapeHtml(actionLink);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NIDO Technologies – System Owner Invitation</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background-color:#0f172a;padding:24px 32px;">
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:0.3px;">NIDO Technologies</h1>
              <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;">Enterprise Procurement Platform</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 12px;font-size:18px;font-weight:700;color:#0f172a;">Complete Your System Owner Account Setup</h2>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#334155;">Hello ${safeName},</p>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#334155;">
                You have been invited as the <strong>System Owner</strong> for the NIDO Technologies platform. Use the button below to confirm your email address, set your password, and complete your account setup.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0;">
                <tr>
                  <td align="center" style="border-radius:8px;background-color:#2563eb;">
                    <a href="${safeLink}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                      Accept Invitation &amp; Set Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 12px;font-size:12px;line-height:1.6;color:#64748b;">
                This invitation link is for setting up your NIDO System Owner account and expires automatically. If you did not expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:11px;color:#64748b;">&copy; ${new Date().getUTCFullYear()} NIDO Technologies. Automated security invitation.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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
        event_type: 'system_owner_invitation_resend_failed',
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
  let targetEmail: string | null = null;
  let verifiedProfileId: string | null = null;
  let verifiedAuthUserId: string | null = null;

  try {
    admin = createAdminClient();
    const body = await parseJsonBody(req);
    const profileId = requireString(body.profile_id, 'profile_id', 80);
    if (!UUID_REGEX.test(profileId)) {
      throw new HttpError(400, 'profile_id is invalid', 'invalid_profile_id');
    }
    const email = validateEmail(body.email);
    targetEmail = email;

    const redirectTo = envValue('NIDO_INVITE_REDIRECT_URL');
    const resendApiKey = envValue('RESEND_API_KEY');
    const fromEmail = envValue('NIDO_FROM_EMAIL');
    if (!redirectTo || !resendApiKey || !fromEmail) {
      throw new HttpError(
        500,
        'Invitation delivery configuration is unavailable',
        'missing_email_delivery_config',
        'Required invitation redirect or Resend configuration is missing',
      );
    }

    // 1-2. Verify System Owner profile exists, is active, and matches email.
    const { data: profile, error: profileError } = await admin
      .from('nido_users')
      .select('id,auth_user_id,user_scope,employee_id,name,email,role_id,status')
      .eq('id', profileId)
      .maybeSingle();

    if (profileError) {
      throw new HttpError(
        500,
        'Unable to verify System Owner profile',
        'system_owner_profile_lookup_failed',
        profileError.message,
      );
    }
    if (!profile) {
      throw new HttpError(
        404,
        'System Owner profile was not found',
        'system_owner_profile_not_found',
      );
    }
    verifiedProfileId = profile.id;

    if (
      profile.user_scope !== 'nido_internal' ||
      profile.status !== 'Active' ||
      !profile.auth_user_id
    ) {
      throw new HttpError(
        403,
        'System Owner profile is not eligible for invitation resend',
        'system_owner_profile_ineligible',
      );
    }

    if (String(profile.email ?? '').trim().toLowerCase() !== email) {
      throw new HttpError(
        403,
        'Email does not match the registered System Owner profile',
        'system_owner_email_mismatch',
      );
    }

    // Verify protected System Owner role is intact and active.
    const { data: role, error: roleError } = await admin
      .from('nido_roles')
      .select('id,is_system_owner,status')
      .eq('id', profile.role_id)
      .maybeSingle();

    if (roleError) {
      throw new HttpError(
        500,
        'Unable to verify System Owner role',
        'system_owner_role_lookup_failed',
        roleError.message,
      );
    }
    if (!role || role.is_system_owner !== true || role.status !== 'Active') {
      throw new HttpError(
        403,
        'Protected System Owner role is missing or inactive',
        'system_owner_role_invalid',
      );
    }

    // 3-4. Verify existing Supabase Auth user exists and is still unconfirmed.
    const { data: authData, error: authLookupError } =
      await admin.auth.admin.getUserById(profile.auth_user_id);

    if (authLookupError || !authData?.user) {
      throw new HttpError(
        404,
        'Associated authentication account was not found',
        'auth_user_not_found',
        authLookupError?.message,
      );
    }

    const authUser = authData.user;
    verifiedAuthUserId = authUser.id;

    if ((authUser.email ?? '').trim().toLowerCase() !== email) {
      throw new HttpError(
        403,
        'Authentication account email does not match the System Owner profile',
        'auth_email_mismatch',
      );
    }

    if (authUser.email_confirmed_at) {
      throw new HttpError(
        409,
        'System Owner account is already confirmed. Please sign in or use password recovery.',
        'already_confirmed',
      );
    }

    // 5. Enforce database-backed rate limit (max 3 per hour).
    await enforceRateLimit(
      admin,
      RATE_LIMITS.resend_system_owner_invitation,
      'global',
    );

    // 6. Generate fresh invitation link for the existing unconfirmed account.
    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: 'invite',
        email,
        options: {
          redirectTo,
          data: {
            display_name: profile.name,
            nido_scope: 'nido_internal',
            bootstrap: true,
          },
        },
      });

    const actionLink = linkData?.properties?.action_link;
    if (linkError || !actionLink || !linkData?.user?.id) {
      throw new HttpError(
        500,
        'Unable to generate invitation link',
        'generate_invite_link_failed',
        linkError?.message ?? 'Missing action_link from generateLink',
      );
    }

    if (linkData.user.id !== authUser.id) {
      throw new HttpError(
        500,
        'Generated invitation did not match existing authentication account',
        'auth_user_id_mismatch',
      );
    }

    // 7. Deliver invitation email via Resend REST API.
    const resendController = new AbortController();
    const resendTimeoutId = setTimeout(() => resendController.abort(), 10_000);
    let resendResponse: Response;
    try {
      resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        signal: resendController.signal,
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: 'Complete your NIDO Technologies System Owner account setup',
          html: buildInvitationEmailHtml(profile.name, actionLink),
          text: `Hello ${profile.name},\n\nYou have been invited as the System Owner for NIDO Technologies. Open the link below to confirm your email and set your password:\n\n${actionLink}\n\nThis link is for setting up your NIDO System Owner account and expires automatically.`,
        }),
      });
    } catch (fetchErr) {
      const isAbort =
        fetchErr instanceof Error && fetchErr.name === 'AbortError';
      throw new HttpError(
        isAbort ? 504 : 502,
        isAbort
          ? 'Invitation email delivery timed out'
          : 'Unable to deliver invitation email',
        isAbort ? 'resend_delivery_timeout' : 'resend_network_error',
        isAbort
          ? 'Resend API request timed out after 10000ms'
          : safeLogMessage(fetchErr),
      );
    } finally {
      clearTimeout(resendTimeoutId);
    }

    if (!resendResponse.ok) {
      const resendErrText = await resendResponse.text().catch(() => '');
      throw new HttpError(
        502,
        'Unable to deliver invitation email',
        'resend_delivery_failed',
        `Resend API status ${resendResponse.status}: ${resendErrText.slice(0, 200)}`,
      );
    }

    await writeAudit(admin, {
      event_type: 'system_owner_invitation_resent',
      outcome: 'success',
      actor_auth_user_id: null,
      target_auth_user_id: authUser.id,
      target_scope: 'nido_internal',
      target_email: email,
      request_id: requestId,
      details: {
        profile_id: profile.id,
        employee_id: profile.employee_id,
      },
    });

    return json(req, {
      success: true,
      profile_id: profile.id,
      employee_id: profile.employee_id,
      message:
        'System Owner invitation email has been resent. The account can sign in after accepting the invitation and setting a password.',
    });
  } catch (error) {
    console.error('System Owner invitation resend failed:', safeLogMessage(error));
    const mapped = mapErrorToHttpResponse(error);
    if (admin) {
      await writeAudit(admin, {
        event_type: 'system_owner_invitation_resend_failed',
        outcome: 'failure',
        actor_auth_user_id: null,
        target_auth_user_id: verifiedAuthUserId,
        target_scope: 'nido_internal',
        target_email: targetEmail,
        request_id: requestId,
        details: {
          ...(verifiedProfileId ? { profile_id: verifiedProfileId } : {}),
          reason: mapped.reason,
          status: mapped.status,
        },
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
