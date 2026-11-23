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

  let createdAuthId: string | undefined;
  let admin: ReturnType<typeof createAdminClient> | undefined;
  let actorId: string | null = null;
  let targetEmail: string | null = null;
  let verifiedClientId: string | null = null;
  let requestedClientId: string | null = null;
  let actionName = 'unknown';
  const requestId = req.headers.get('x-request-id');

  try {
    const caller = await requireCaller(req);
    admin = caller.admin;
    actorId = caller.authUserId;
    const { context } = caller;

    const body = await parseJsonBody(req);
    const action = requireString(body.action, 'action', 40);
    actionName = action;
    const email = validateEmail(body.email);
    targetEmail = email;
    const name = requireString(body.name, 'name', 120);
    const phone = optionalString(body.phone, 40);

    if (action === 'create_client_organization_admin') {
      requireInternalPermission(context, 'clients', 'create');
      const clientName = requireString(body.client_name, 'client_name', 180);
      const category = optionalString(body.category, 100);
      const tier = optionalString(body.tier, 60);
      const repName = optionalString(body.rep_name, 120);
      const nidoOrgId = optionalString(body.nido_org_id, 80);

      await enforceRateLimit(
        admin,
        RATE_LIMITS.create_client_organization_admin,
        actorId,
      );

      createdAuthId = await inviteAuthUser(admin, email, name, 'client_portal');
      const { data, error } = await admin.rpc('provision_client_org_admin', {
        p_auth_user_id: createdAuthId,
        p_email: email,
        p_name: name,
        p_phone: phone,
        p_client_name: clientName,
        p_category: category,
        p_tier: tier,
        p_rep_name: repName,
        p_nido_org_id: nidoOrgId,
        p_actor_auth_user_id: actorId,
        p_request_id: requestId,
      });
      if (error || !data?.client_id) {
        throw (
          error ??
          new HttpError(
            500,
            'Client organization provisioning failed',
            'provision_org_admin_rpc_failed',
          )
        );
      }
      createdAuthId = undefined; // RPC committed the profile; do not roll it back.
      return json(req, {
        success: true,
        client_id: data.client_id,
        client_code: data.client_code,
        client_user_id: data.client_user_id,
        message:
          'Client organization and initial Client Admin were created together. The admin must accept the invitation and confirm the email before portal access is enabled.',
      });
    }

    if (action === 'create_client_user') {
      const clientId = requireString(body.client_id, 'client_id', 80);
      requestedClientId = clientId;
      const clientRoleId = requireString(body.client_role_id, 'client_role_id', 80);
      const employeeCode = optionalString(body.client_employee_code, 50);
      const department = optionalString(body.department, 100);
      const designation = optionalString(body.designation, 100);

      const isClientAdmin =
        context.user_scope === 'client_portal' &&
        context.effective_admin_scope === true;
      if (isClientAdmin) {
        const ownClientId = String(context.profile?.client_id ?? '');
        if (ownClientId !== clientId) {
          throw new HttpError(
            403,
            'Client Admin cannot provision users for another organization',
            'cross_tenant_provisioning_denied',
          );
        }
      } else {
        requireInternalPermission(context, 'clients', 'manage');
      }

      const { data: org, error: orgError } = await admin
        .from('client_organizations')
        .select('id,status')
        .eq('id', clientId)
        .maybeSingle();
      if (orgError) {
        throw new HttpError(
          500,
          'Unable to verify client organization',
          'client_org_lookup_failed',
          orgError.message,
        );
      }
      if (!org) {
        throw new HttpError(
          404,
          'Client organization was not found',
          'client_org_not_found',
        );
      }
      if (org.status !== 'Active') {
        throw new HttpError(
          409,
          'Client organization is inactive',
          'client_org_inactive',
        );
      }
      verifiedClientId = org.id;

      const { data: role, error: roleError } = await admin
        .from('client_roles')
        .select('id,client_id,status')
        .eq('id', clientRoleId)
        .eq('client_id', clientId)
        .maybeSingle();
      if (roleError) {
        throw new HttpError(
          500,
          'Unable to verify selected client role',
          'client_role_lookup_failed',
          roleError.message,
        );
      }
      if (!role) {
        throw new HttpError(
          404,
          'Selected client role was not found for this organization',
          'client_role_not_found',
        );
      }
      if (role.status !== 'active') {
        throw new HttpError(
          409,
          'Selected client role is inactive',
          'client_role_inactive',
        );
      }

      // Client Admins may assign only roles whose permissions are a subset of
      // their own. The initial Client Admin receives the tenant-scoped full
      // access role created atomically by provision_client_org_admin().
      if (isClientAdmin) {
        const { data: actorProfile, error: actorProfileError } = await admin
          .from('client_users')
          .select('client_role_id')
          .eq('auth_user_id', actorId)
          .eq('client_id', clientId)
          .eq('user_type', 'client_admin')
          .eq('status', 'active')
          .maybeSingle();
        if (actorProfileError || !actorProfile?.client_role_id) {
          throw new HttpError(
            403,
            'Client Admin must have an active permission role before assigning roles',
            'client_admin_missing_role',
            actorProfileError?.message,
          );
        }

        const permissionColumns =
          'module_key,can_view,can_create,can_edit,can_delete,can_approve,can_export,can_import,can_manage,can_configure';
        const [
          { data: ownPermissions, error: ownPermissionsError },
          { data: targetPermissions, error: targetPermissionsError },
        ] = await Promise.all([
          admin
            .from('client_role_permissions')
            .select(permissionColumns)
            .eq('client_id', clientId)
            .eq('client_role_id', actorProfile.client_role_id),
          admin
            .from('client_role_permissions')
            .select(permissionColumns)
            .eq('client_id', clientId)
            .eq('client_role_id', clientRoleId),
        ]);
        if (ownPermissionsError || targetPermissionsError) {
          throw new HttpError(
            500,
            'Unable to verify delegated role permissions',
            'delegated_role_check_failed',
            ownPermissionsError?.message ?? targetPermissionsError?.message,
          );
        }

        const ownByModule = new Map(
          (ownPermissions ?? []).map((row) => [row.module_key, row]),
        );
        const permissionKeys = [
          'can_view',
          'can_create',
          'can_edit',
          'can_delete',
          'can_approve',
          'can_export',
          'can_import',
          'can_manage',
          'can_configure',
        ] as const;
        for (const targetPermission of targetPermissions ?? []) {
          const ownPermission = ownByModule.get(targetPermission.module_key);
          for (const key of permissionKeys) {
            if (
              targetPermission[key] === true &&
              ownPermission?.[key] !== true
            ) {
              throw new HttpError(
                403,
                'Client Admin cannot assign a role with permissions they do not hold',
                'privilege_escalation_denied',
              );
            }
          }
        }
      }

      await enforceRateLimit(admin, RATE_LIMITS.create_client_user, actorId);

      createdAuthId = await inviteAuthUser(admin, email, name, 'client_portal');
      try {
        const { error: registryError } = await admin
          .from('auth_identity_registry')
          .insert({
            auth_user_id: createdAuthId,
            user_scope: 'client_portal',
            email,
          });
        if (registryError) throw registryError;

        const { data: profile, error: profileError } = await admin
          .from('client_users')
          .insert({
            auth_user_id: createdAuthId,
            user_scope: 'client_portal',
            client_id: clientId,
            client_employee_code: employeeCode,
            user_type: 'client_user',
            client_role_id: clientRoleId,
            name,
            email,
            phone,
            department,
            designation,
            status: 'active',
            provision_reason: 'phase2c_invitation',
            provisioned_at: new Date().toISOString(),
            created_by: actorId,
            updated_by: actorId,
            metadata: { provisioning_source: 'phase2c', invitation_status: 'sent' },
          })
          .select('id')
          .single();
        if (profileError || !profile) {
          throw (
            profileError ??
            new HttpError(
              500,
              'Client user profile could not be created',
              'client_profile_insert_failed',
            )
          );
        }

        await writeAudit(admin, {
          event_type: 'client_user_invited',
          outcome: 'success',
          actor_auth_user_id: actorId,
          target_auth_user_id: createdAuthId,
          target_scope: 'client_portal',
          target_email: email,
          client_id: clientId,
          request_id: requestId,
          details: { client_user_id: profile.id, client_role_id: clientRoleId },
        });
        createdAuthId = undefined;
        return json(req, {
          success: true,
          client_user_id: profile.id,
          message:
            'Client user invitation created. Portal access is enabled after email confirmation.',
        });
      } catch (error) {
        await cleanupAuthUser(admin, createdAuthId, 'client_portal');
        createdAuthId = undefined;
        throw error;
      }
    }

    throw new HttpError(
      400,
      'Unsupported action. Use create_client_organization_admin or create_client_user.',
      'unsupported_action',
    );
  } catch (error) {
    if (admin && createdAuthId) {
      await cleanupAuthUser(admin, createdAuthId, 'client_portal');
      createdAuthId = undefined;
    }
    console.error('Client access provisioning failed:', safeLogMessage(error));
    const mapped = mapErrorToHttpResponse(error);

    if (!admin) {
      try {
        admin = createAdminClient();
      } catch {
        // Ignore if server credentials are unavailable.
      }
    }

    if (admin) {
      const eventType =
        actionName === 'create_client_organization_admin'
          ? 'client_organization_and_admin_failed'
          : actionName === 'create_client_user'
            ? 'client_user_invite_failed'
            : 'client_provisioning_failed';

      await writeAudit(admin, {
        event_type: eventType,
        outcome: 'failure',
        actor_auth_user_id: actorId,
        target_auth_user_id: null,
        target_scope: 'client_portal',
        target_email: targetEmail,
        client_id: verifiedClientId,
        request_id: requestId,
        details: {
          action: actionName,
          reason: mapped.reason,
          status: mapped.status,
          ...(requestedClientId && !verifiedClientId
            ? { requested_client_id: requestedClientId }
            : {}),
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
