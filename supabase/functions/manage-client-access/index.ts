import {
  createAdminClient,
  enforceRateLimit,
  HttpError,
  isSystemOwner,
  json,
  mapErrorToHttpResponse,
  optionalString,
  originAllowed,
  parseJsonBody,
  preflight,
  RATE_LIMITS,
  requireCaller,
  requireString,
  safeLogMessage,
  writeAudit,
  type AuthContext,
} from '../_shared/core.ts';
import {
  partitionCatalogModuleKeys,
  PayloadValidationError,
  toRpcPermissionArray,
} from '../_shared/rolePayloads.ts';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertUuid(value: unknown, field: string): string {
  const str = requireString(value, field, 80);
  if (!UUID_REGEX.test(str)) {
    throw new HttpError(400, `${field} must be a valid UUID`, 'invalid_uuid');
  }
  return str;
}

function authorizeClientScope(
  context: AuthContext,
  targetClientId: string,
  internalAction: 'view' | 'create' | 'edit' | 'manage',
): void {
  if (context.user_scope === 'nido_internal') {
    if (isSystemOwner(context)) return;
    if (
      context.permissions?.clients?.[internalAction] ||
      context.permissions?.platform_clients_users?.[internalAction] ||
      context.permissions?.platform_clients_roles?.[internalAction]
    ) {
      return;
    }
    throw new HttpError(
      403,
      'Missing internal permission for client management',
      'forbidden_client_management',
    );
  }

  if (context.user_scope === 'client_portal') {
    const callerClientId = context.profile?.client_id;
    const isClientAdmin =
      context.profile?.user_type === 'client_admin' || Boolean(context.effective_admin_scope);
    if (!callerClientId || callerClientId !== targetClientId || !isClientAdmin) {
      throw new HttpError(
        403,
        'Client admin permission for this organization is required',
        'forbidden_client_scope',
      );
    }
    return;
  }

  throw new HttpError(403, 'Unauthorized scope', 'unauthorized_scope');
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

    const body = await parseJsonBody(req);
    actionName = requireString(body.action, 'action', 64);
    const clientId = assertUuid(body.client_id, 'client_id');
    targetClientId = clientId;

    await enforceRateLimit(
      admin,
      RATE_LIMITS.manage_client_access,
      actorId,
      requestId,
    );

    if (actionName === 'create_client_role') {
      authorizeClientScope(context, clientId, 'edit');
      const name = requireString(body.name, 'name', 120);
      const description = optionalString(body.description, 500) ?? '';
      const status = body.status === 'Inactive' || body.status === 'inactive' ? 'inactive' : 'active';

      const { data: created, error } = await admin
        .from('client_roles')
        .insert({
          client_id: clientId,
          name,
          description,
          status,
          created_by: actorId,
          updated_by: actorId,
        })
        .select('id,client_id,name,description,status,created_at,updated_at')
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new HttpError(409, `Client role "${name}" already exists`, 'client_role_conflict');
        }
        throw new HttpError(500, 'Unable to create client role', 'client_role_create_failed', error.message);
      }

      await writeAudit(admin, {
        actor_auth_user_id: actorId,
        client_id: clientId,
        target_scope: 'client_portal',
        event_type: 'client_roles.create',
        outcome: 'success',
        details: { target_table: 'client_roles', target_id: created.id, name: created.name, status: created.status },
        request_id: requestId,
      });

      return json(req, { success: true, action: actionName, role: created }, 201);
    }

    if (actionName === 'update_client_role') {
      authorizeClientScope(context, clientId, 'edit');
      const clientRoleId = assertUuid(body.client_role_id, 'client_role_id');
      const name = requireString(body.name, 'name', 120);
      const description = optionalString(body.description, 500) ?? '';
      const status = body.status === 'Inactive' || body.status === 'inactive' ? 'inactive' : 'active';

      const { data: updated, error } = await admin
        .from('client_roles')
        .update({
          name,
          description,
          status,
          updated_by: actorId,
        })
        .eq('id', clientRoleId)
        .eq('client_id', clientId)
        .select('id,client_id,name,description,status,created_at,updated_at')
        .maybeSingle();

      if (error) {
        if (error.code === '23505') {
          throw new HttpError(409, `Client role "${name}" already exists`, 'client_role_conflict');
        }
        throw new HttpError(500, 'Unable to update client role', 'client_role_update_failed', error.message);
      }
      if (!updated) {
        throw new HttpError(404, 'Client role not found', 'client_role_not_found');
      }

      await writeAudit(admin, {
        actor_auth_user_id: actorId,
        client_id: clientId,
        target_scope: 'client_portal',
        event_type: 'client_roles.update',
        outcome: 'success',
        details: { target_table: 'client_roles', target_id: clientRoleId, name: updated.name, status: updated.status },
        request_id: requestId,
      });

      return json(req, { success: true, action: actionName, role: updated });
    }

    if (actionName === 'save_client_role_permissions') {
      authorizeClientScope(context, clientId, 'edit');
      const clientRoleId = assertUuid(body.client_role_id, 'client_role_id');

      let parsedRows;
      try {
        parsedRows = toRpcPermissionArray(body.permissions);
      } catch (err) {
        if (err instanceof PayloadValidationError) {
          throw new HttpError(400, err.message, err.code);
        }
        throw err;
      }

      const { data: catalogRows, error: catErr } = await admin
        .from('client_module_catalog')
        .select('module_key');
      if (catErr) {
        throw new HttpError(500, 'Unable to load client module catalog', 'client_catalog_failed', catErr.message);
      }

      const validKeys = new Set(
        (catalogRows ?? []).map((r) => String((r as { module_key?: string }).module_key ?? '').trim()).filter(Boolean),
      );
      const { valid, unmappedModuleKeys } = partitionCatalogModuleKeys(parsedRows, validKeys);
      if (unmappedModuleKeys.length > 0) {
        throw new HttpError(
          400,
          `Unknown client module_key(s): ${unmappedModuleKeys.join(', ')}`,
          'invalid_client_module_key',
        );
      }

      const { data: rpcRes, error: rpcErr } = await admin.rpc(
        'save_client_role_permissions_atomic',
        {
          p_client_id: clientId,
          p_client_role_id: clientRoleId,
          p_permissions: valid,
          p_actor_auth_user_id: actorId,
        },
      );

      if (rpcErr) {
        throw new HttpError(500, 'Unable to save client role permissions', 'client_perms_save_failed', rpcErr.message);
      }

      await writeAudit(admin, {
        actor_auth_user_id: actorId,
        client_id: clientId,
        target_scope: 'client_portal',
        event_type: 'client_role_permissions.save',
        outcome: 'success',
        details: { target_table: 'client_role_permissions', target_id: clientRoleId, result: rpcRes },
        request_id: requestId,
      });

      return json(req, { success: true, action: actionName, result: rpcRes });
    }

    if (actionName === 'update_client_user') {
      authorizeClientScope(context, clientId, 'edit');
      const clientUserId = assertUuid(body.client_user_id, 'client_user_id');
      const name = requireString(body.name, 'name', 120);
      const phone = optionalString(body.phone, 40);
      const department = optionalString(body.department, 120) ?? '';
      const designation = optionalString(body.designation, 120);
      const rawStatus = typeof body.status === 'string' ? body.status.trim().toLowerCase() : 'active';
      const status = rawStatus === 'inactive' || rawStatus === 'suspended' ? rawStatus : 'active';
      const clientRoleId = body.client_role_id ? assertUuid(body.client_role_id, 'client_role_id') : null;

      if (clientRoleId) {
        const { data: roleRow, error: roleErr } = await admin
          .from('client_roles')
          .select('id,client_id,status')
          .eq('id', clientRoleId)
          .eq('client_id', clientId)
          .maybeSingle();
        if (roleErr || !roleRow) {
          throw new HttpError(404, 'Client role not found for organization', 'client_role_not_found');
        }
      }

      const { data: updated, error: updateErr } = await admin
        .from('client_users')
        .update({
          name,
          phone,
          department,
          designation,
          status,
          client_role_id: clientRoleId,
          updated_by: actorId,
        })
        .eq('id', clientUserId)
        .eq('client_id', clientId)
        .select('id,auth_user_id,client_id,client_employee_code,user_type,client_role_id,name,email,phone,department,designation,status,updated_at')
        .maybeSingle();

      if (updateErr) {
        throw new HttpError(500, 'Unable to update client user', 'client_user_update_failed', updateErr.message);
      }
      if (!updated) {
        throw new HttpError(404, 'Client user not found', 'client_user_not_found');
      }

      await writeAudit(admin, {
        actor_auth_user_id: actorId,
        target_auth_user_id: updated.auth_user_id,
        client_id: clientId,
        target_scope: 'client_portal',
        event_type: 'client_users.update',
        outcome: 'success',
        details: { target_table: 'client_users', target_id: clientUserId, status: updated.status, client_role_id: updated.client_role_id },
        request_id: requestId,
      });

      return json(req, { success: true, action: actionName, user: updated });
    }

    throw new HttpError(400, `Unsupported action: ${actionName}`, 'unsupported_action');
  } catch (err) {
    const mapped = mapErrorToHttpResponse(err);
    if (admin) {
      await writeAudit(admin, {
        actor_auth_user_id: actorId,
        client_id: targetClientId,
        target_scope: 'client_portal',
        event_type: `client_access.${actionName}.failed`,
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

