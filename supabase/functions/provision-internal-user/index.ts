import {
  cleanupAuthUser, inviteAuthUser, json, optionalString, preflight, requireCaller,
  requireInternalPermission, requireString, safeErrorMessage, validateEmail, writeAudit, originAllowed,
} from '../_shared/core.ts';

Deno.serve(async (req) => {
  const options = preflight(req);
  if (options) return options;
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405);
  if (!originAllowed(req)) return json(req, { error: 'Origin not allowed' }, 403);
  try {
    const { admin, authUserId: actorId, context } = await requireCaller(req);
    requireInternalPermission(context, 'users', 'create');
    requireInternalPermission(context, 'users', 'manage'); // role assignment is separately protected

    const body = await req.json();
    const email = validateEmail(body.email);
    const name = requireString(body.name, 'name', 120);
    const employeeId = requireString(body.employee_id, 'employee_id', 50);
    const roleId = requireString(body.role_id, 'role_id', 80);
    const nidoOrgId = optionalString(body.nido_org_id, 80);
    const phone = optionalString(body.phone, 40);
    const department = optionalString(body.department, 100) ?? '';
    const designation = optionalString(body.designation, 100);
    const jobTitle = optionalString(body.job_title, 100);
    const requestId = req.headers.get('x-request-id');

    const { data: role, error: roleError } = await admin.from('nido_roles')
      .select('id,status,is_system_owner').eq('id', roleId).maybeSingle();
    if (roleError || !role || role.status !== 'Active') throw new Error('Selected internal role is unavailable or inactive');
    if (role.is_system_owner) throw new Error('System Owner cannot be assigned through ordinary user provisioning');
    if (nidoOrgId) {
      const { data: org, error: orgError } = await admin.from('nido_organizations')
        .select('id,status').eq('id', nidoOrgId).maybeSingle();
      if (orgError || !org || org.status !== 'Active') throw new Error('Selected NIDO organization is unavailable or inactive');
    }

    const authId = await inviteAuthUser(admin, email, name, 'nido_internal');
    try {
      const { error: registryError } = await admin.from('auth_identity_registry').insert({
        auth_user_id: authId, user_scope: 'nido_internal', email,
      });
      if (registryError) throw registryError;
      const { data: profile, error: profileError } = await admin.from('nido_users').insert({
        auth_user_id: authId, user_scope: 'nido_internal', nido_org_id: nidoOrgId,
        employee_id: employeeId, name, email, phone, role_id: roleId,
        department, designation, job_title: jobTitle, status: 'Active', force_password_change: true,
        created_by: actorId, updated_by: actorId,
        metadata: { provisioning_source: 'phase2c', invitation_status: 'sent' },
      }).select('id,employee_id').single();
      if (profileError || !profile) throw profileError ?? new Error('Internal profile could not be created');
      await writeAudit(admin, {
        event_type: 'internal_user_invited', outcome: 'success', actor_auth_user_id: actorId,
        target_auth_user_id: authId, target_scope: 'nido_internal', target_email: email,
        request_id: requestId, details: { employee_id: employeeId, role_id: roleId },
      });
      return json(req, { success: true, profile_id: profile.id, employee_id: profile.employee_id, message: 'Invitation created. The user must accept the invitation and confirm their email before NIDO access is enabled.' });
    } catch (error) {
      await cleanupAuthUser(admin, authId, 'nido_internal');
      throw error;
    }
  } catch (error) {
    console.error('Internal user provisioning failed:', safeErrorMessage(error));
    const message = safeErrorMessage(error);
    const status = message.startsWith('Not authorized') || message.includes('session') ? 403 : 400;
    return json(req, { error: message }, status);
  }
});
