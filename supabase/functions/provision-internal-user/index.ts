import {
  cleanupAuthUser,
  createAdminClient,
  enforceRateLimit,
  HttpError,
  inviteAuthUser,
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
  validateEmail,
  writeAudit,
} from '../_shared/core.ts';

Deno.serve(async (req) => {
  const options = preflight(req);
  if (options) return options;
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405);
  if (!originAllowed(req)) return json(req, { error: 'Origin not allowed' }, 403);

  let admin: ReturnType<typeof createAdminClient> | undefined;
  let actorId: string | null = null;
  let targetEmail: string | null = null;
  let createdAuthId: string | undefined;
  const requestId = req.headers.get('x-request-id');

  try {
    const caller = await requireCaller(req);
    admin = caller.admin;
    actorId = caller.authUserId;
    const { context } = caller;

    requireInternalPermission(context, 'users', 'create');
    requireInternalPermission(context, 'users', 'manage'); // role assignment is separately protected

    const body = await parseJsonBody(req);
    const email = validateEmail(body.email);
    targetEmail = email;
    const name = requireString(body.name, 'name', 120);
    const employeeId = requireString(body.employee_id, 'employee_id', 50);
    const roleId = requireString(body.role_id, 'role_id', 80);
    const nidoOrgId = optionalString(body.nido_org_id, 80);
    const phone = optionalString(body.phone, 40);
    const department = optionalString(body.department, 100) ?? '';
    const designation = optionalString(body.designation, 100);
    const jobTitle = optionalString(body.job_title, 100);

    const { data: role, error: roleError } = await admin
      .from('nido_roles')
      .select('id,status,is_system_owner')
      .eq('id', roleId)
      .maybeSingle();
    if (roleError) {
      throw new HttpError(
        500,
        'Unable to verify selected internal role',
        'internal_role_lookup_failed',
        roleError.message,
      );
    }
    if (!role) {
      throw new HttpError(
        404,
        'Selected internal role was not found',
        'internal_role_not_found',
      );
    }
    if (role.status !== 'Active') {
      throw new HttpError(
        409,
        'Selected internal role is inactive',
        'internal_role_inactive',
      );
    }
    if (role.is_system_owner) {
      throw new HttpError(
        403,
        'System Owner cannot be assigned through ordinary user provisioning',
        'system_owner_assignment_denied',
      );
    }

    if (nidoOrgId) {
      const { data: org, error: orgError } = await admin
        .from('nido_organizations')
        .select('id,status')
        .eq('id', nidoOrgId)
        .maybeSingle();
      if (orgError) {
        throw new HttpError(
          500,
          'Unable to verify selected NIDO organization',
          'nido_org_lookup_failed',
          orgError.message,
        );
      }
      if (!org) {
        throw new HttpError(
          404,
          'Selected NIDO organization was not found',
          'nido_org_not_found',
        );
      }
      if (org.status !== 'Active') {
        throw new HttpError(
          409,
          'Selected NIDO organization is inactive',
          'nido_org_inactive',
        );
      }
    }

    await enforceRateLimit(admin, RATE_LIMITS.create_internal_user, actorId);

    createdAuthId = await inviteAuthUser(admin, email, name, 'nido_internal');
    try {
      const { error: registryError } = await admin
        .from('auth_identity_registry')
        .insert({
          auth_user_id: createdAuthId,
          user_scope: 'nido_internal',
          email,
        });
      if (registryError) throw registryError;

      const { data: profile, error: profileError } = await admin
        .from('nido_users')
        .insert({
          auth_user_id: createdAuthId,
          user_scope: 'nido_internal',
          nido_org_id: nidoOrgId,
          employee_id: employeeId,
          name,
          email,
          phone,
          role_id: roleId,
          department,
          designation,
          job_title: jobTitle,
          status: 'Active',
          force_password_change: true,
          created_by: actorId,
          updated_by: actorId,
          metadata: { provisioning_source: 'phase2c', invitation_status: 'sent' },
        })
        .select('id,employee_id')
        .single();
      if (profileError || !profile) {
        throw (
          profileError ??
          new HttpError(
            500,
            'Internal profile could not be created',
            'internal_profile_insert_failed',
          )
        );
      }

      await writeAudit(admin, {
        event_type: 'internal_user_invited',
        outcome: 'success',
        actor_auth_user_id: actorId,
        target_auth_user_id: createdAuthId,
        target_scope: 'nido_internal',
        target_email: email,
        request_id: requestId,
        details: { employee_id: employeeId, role_id: roleId },
      });
      createdAuthId = undefined;
      return json(req, {
        success: true,
        profile_id: profile.id,
        employee_id: profile.employee_id,
        message:
          'Invitation created. The user must accept the invitation and confirm their email before NIDO access is enabled.',
      });
    } catch (error) {
      await cleanupAuthUser(admin, createdAuthId, 'nido_internal');
      createdAuthId = undefined;
      throw error;
    }
  } catch (error) {
    if (admin && createdAuthId) {
      await cleanupAuthUser(admin, createdAuthId, 'nido_internal');
      createdAuthId = undefined;
    }
    console.error('Internal user provisioning failed:', safeLogMessage(error));
    const mapped = mapErrorToHttpResponse(error);

    if (!admin) {
      try {
        admin = createAdminClient();
      } catch {
        // Ignore if server credentials are unavailable.
      }
    }

    if (admin) {
      await writeAudit(admin, {
        event_type: 'internal_user_invite_failed',
        outcome: 'failure',
        actor_auth_user_id: actorId,
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
