import {
  cleanupAuthUser, createAdminClient, inviteAuthUser, json, optionalString,
  preflight, requireCaller, requireInternalPermission, requireString,
  safeErrorMessage, validateEmail, writeAudit, originAllowed,
} from '../_shared/core.ts';

Deno.serve(async (req) => {
  const options = preflight(req);
  if (options) return options;
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405);
  if (!originAllowed(req)) return json(req, { error: 'Origin not allowed' }, 403);
  let createdAuthId: string | undefined;
  let cleanupScope: 'client_portal' = 'client_portal';
  let admin: ReturnType<typeof createAdminClient> | undefined;
  try {
    const caller = await requireCaller(req);
    admin = caller.admin;
    const { authUserId: actorId, context } = caller;
    const body = await req.json();
    const action = requireString(body.action, 'action', 40);
    const email = validateEmail(body.email);
    const name = requireString(body.name, 'name', 120);
    const phone = optionalString(body.phone, 40);
    const requestId = req.headers.get('x-request-id');

    if (action === 'create_client_organization_admin') {
      requireInternalPermission(context, 'clients', 'create');
      const clientName = requireString(body.client_name, 'client_name', 180);
      const category = optionalString(body.category, 100);
      const tier = optionalString(body.tier, 60);
      const repName = optionalString(body.rep_name, 120);
      const nidoOrgId = optionalString(body.nido_org_id, 80);
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
      if (error || !data?.client_id) throw error ?? new Error('Client organization provisioning failed');
      createdAuthId = undefined; // RPC committed the profile; do not roll it back.
      return json(req, {
        success: true, client_id: data.client_id, client_code: data.client_code,
        client_user_id: data.client_user_id,
        message: 'Client organization and initial Client Admin were created together. The admin must accept the invitation and confirm the email before portal access is enabled.',
      });
    }

    if (action === 'create_client_user') {
      const clientId = requireString(body.client_id, 'client_id', 80);
      const clientRoleId = requireString(body.client_role_id, 'client_role_id', 80);
      const employeeCode = optionalString(body.client_employee_code, 50);
      const department = optionalString(body.department, 100);
      const designation = optionalString(body.designation, 100);

      const isClientAdmin = context.user_scope === 'client_portal' && context.effective_admin_scope === true;
      if (isClientAdmin) {
        const ownClientId = String(context.profile?.client_id ?? '');
        if (ownClientId !== clientId) throw new Error('Client Admin cannot provision users for another organization');
      } else {
        requireInternalPermission(context, 'clients', 'manage');
      }

      const { data: role, error: roleError } = await admin.from('client_roles')
        .select('id,client_id,status').eq('id', clientRoleId).eq('client_id', clientId).maybeSingle();
      if (roleError || !role || role.status !== 'active') throw new Error('Selected client role is unavailable or inactive for this organization');
      const { data: org, error: orgError } = await admin.from('client_organizations')
        .select('id,status').eq('id', clientId).maybeSingle();
      if (orgError || !org || org.status !== 'Active') throw new Error('Client organization is unavailable or inactive');

      createdAuthId = await inviteAuthUser(admin, email, name, 'client_portal');
      try {
        const { error: registryError } = await admin.from('auth_identity_registry').insert({
          auth_user_id: createdAuthId, user_scope: 'client_portal', email,
        });
        if (registryError) throw registryError;
        const { data: profile, error: profileError } = await admin.from('client_users').insert({
          auth_user_id: createdAuthId, user_scope: 'client_portal', client_id: clientId,
          client_employee_code: employeeCode, user_type: 'client_user', client_role_id: clientRoleId,
          name, email, phone, department, designation, status: 'active',
          provision_reason: 'phase2c_invitation', provisioned_at: new Date().toISOString(),
          created_by: actorId, updated_by: actorId,
          metadata: { provisioning_source: 'phase2c', invitation_status: 'sent' },
        }).select('id').single();
        if (profileError || !profile) throw profileError ?? new Error('Client user profile could not be created');
        await writeAudit(admin, {
          event_type: 'client_user_invited', outcome: 'success', actor_auth_user_id: actorId,
          target_auth_user_id: createdAuthId, target_scope: 'client_portal', target_email: email,
          client_id: clientId, request_id: requestId,
          details: { client_user_id: profile.id, client_role_id: clientRoleId },
        });
        const result = json(req, { success: true, client_user_id: profile.id, message: 'Client user invitation created. Portal access is enabled after email confirmation.' });
        createdAuthId = undefined;
        return result;
      } catch (error) {
        await cleanupAuthUser(admin, createdAuthId, 'client_portal');
        createdAuthId = undefined;
        throw error;
      }
    }

    throw new Error('Unsupported action. Use create_client_organization_admin or create_client_user.');
  } catch (error) {
    if (admin && createdAuthId) {
      await cleanupAuthUser(admin, createdAuthId, cleanupScope);
    }
    console.error('Client access provisioning failed:', safeErrorMessage(error));
    const message = safeErrorMessage(error);
    const status = message.startsWith('Not authorized') || message.includes('session') ? 403 : 400;
    return json(req, { error: message }, status);
  }
});
