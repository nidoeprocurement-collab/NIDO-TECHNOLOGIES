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

function buildInvitationEmailHtml(
  recipientName: string,
  actionLink: string,
  assetOrigin: string,
): string {
  const safeName = escapeHtml(recipientName);
  const safeLink = escapeHtml(actionLink);
  const safeLogoUrl = escapeHtml(`${assetOrigin}/email/nido-logo.jpg`);
  const safeIllustrationUrl = escapeHtml(`${assetOrigin}/email/welcome-illustration.jpg`);
  const year = new Date().getUTCFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Nido Tech</title>
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    You have been invited to join Nido Tech&#39;s CorpEssentials platform. Set up your account and create your password.
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#eef2f7">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <!--[if mso]>
        <table role="presentation" width="580" cellspacing="0" cellpadding="0" align="center">
        <tr><td>
        <![endif]-->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;background-color:#ffffff;border:1px solid #dbe3ee;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background-color:#233b59;padding:20px 32px;" bgcolor="#233b59">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color:#ffffff;border-radius:8px;padding:6px 12px;" bgcolor="#ffffff">
                    <img src="${safeLogoUrl}" alt="Nido-Tech" width="146" height="67" style="display:block;border:0;width:146px;height:auto;max-width:100%;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:28px 32px 8px 32px;">
              <img src="${safeIllustrationUrl}" alt="Welcome to Nido Tech" width="260" height="154" style="display:block;border:0;width:260px;height:auto;max-width:100%;" />
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 32px 20px 32px;">
              <h1 style="margin:0;font-size:26px;line-height:1.25;font-weight:700;color:#1e293b;">Welcome to Nido Tech</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 36px 28px 36px;font-size:15px;line-height:1.6;color:#334155;">
              <p style="margin:0 0 16px;">Hello ${safeName},</p>
              <p style="margin:0 0 6px;">You have been invited to join Nido Tech&#39;s CorpEssentials platform.</p>
              <p style="margin:0 0 24px;">Click the button below to set up your account and <strong style="color:#0f172a;">create your password.</strong></p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
                <tr>
                  <td align="center">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${safeLink}" style="height:44px;v-text-anchor:middle;width:240px;" arcsize="14%" stroke="f" fillcolor="#2563eb">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;">Set Up Your Account</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${safeLink}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background-color:#2563eb;border:12px solid #2563eb;border-left-width:28px;border-right-width:28px;border-radius:6px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
                      Set Up Your Account
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#334155;word-break:break-all;">
                Invitation link: <a href="${safeLink}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;text-decoration:underline;">${safeLink}</a>
              </p>
              <p style="margin:0 0 20px;font-size:12px;line-height:1.5;color:#64748b;">
                This invitation link will expire automatically.
              </p>
              <p style="margin:0 0 20px;font-size:13px;line-height:1.6;color:#334155;">
                If you did not expect this invitation, you can safely ignore it.
              </p>
              <p style="margin:0 0 20px;font-size:13px;line-height:1.6;color:#334155;">
                We&#39;re excited to have you on board! If you have any questions or need help, feel free to contact us at <a href="mailto:support@nidotech.com" style="color:#2563eb;text-decoration:none;">support@nidotech.com</a>.
              </p>
              <p style="margin:0;font-size:13px;line-height:1.6;color:#334155;">
                Best regards.<br />
                <strong style="color:#0f172a;">Nido Tech</strong> Team
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:20px 32px;background-color:#f1f5f9;border-top:1px solid #e2e8f0;" bgcolor="#f1f5f9">
              <p style="margin:0 0 6px;font-size:12px;color:#64748b;">&copy; ${year} Nido Tech, All rights reserved.</p>
              <p style="margin:0;font-size:12px;color:#475569;"><a href="https://www.nidotech.com" target="_blank" rel="noopener noreferrer" style="color:#475569;text-decoration:none;">https://www.nidotech.com</a></p>
            </td>
          </tr>
        </table>
        <!--[if mso]>
        </td></tr></table>
        <![endif]-->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;">
          <tr>
            <td align="center" style="padding:16px 16px 0 16px;font-size:12px;color:#64748b;">
              &copy; ${year} Nido Tech, All rights reserved.
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
    const assetOrigin = new URL(redirectTo).origin;
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
          html: buildInvitationEmailHtml(profile.name, actionLink, assetOrigin),
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
