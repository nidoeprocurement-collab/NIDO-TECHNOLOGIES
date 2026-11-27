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
  requireInternalPermission,
  requireString,
  safeLogMessage,
  writeAudit,
  type CallerContext,
} from '../_shared/core.ts';
import {
  REFERENCE_ROLES,
  REFERENCE_ROLES_VERSION,
} from '../_shared/referenceRoles.ts';
import {
  CANONICAL_ROLE_PERMISSION_MODULE_KEY,
  partitionCatalogModuleKeys,
  PayloadValidationError,
  prepareSyncReferenceRolesRpcPayload,
  toRpcPermissionArray,
  type RpcPermissionRow,
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

function normalizeStatus(value: unknown): 'Active' | 'Inactive' {
  if (value === undefined || value === null || value === '') return 'Active';
  if (value === 'Active' || value === 'Inactive') return value;
  throw new HttpError(
    400,
    'status must be Active or Inactive',
    'invalid_role_status',
  );
}

function hasInternalPermission(
  context: CallerContext,
  moduleKey: string,
  action: string,
): boolean {
  if (context.user_scope !== 'nido_internal') return false;
  if (isSystemOwner(context)) return true;
  const mod = context.permissions[moduleKey];
  return Boolean(mod?.[action]);
}

function requireAnyInternalRolePermission(
  context: CallerContext,
  checks: Array<[string, string]>,
): void {
  if (context.user_scope !== 'nido_internal') {
    throw new HttpError(
      403,
      'Internal NIDO user context required',
      'internal_context_required',
    );
  }
  if (isSystemOwner(context)) return;
  const allowed = checks.some(([moduleKey, action]) =>
    hasInternalPermission(context, moduleKey, action),
  );
  if (!allowed) {
    throw new HttpError(
      403,
      'Missing internal permission for role management',
      'forbidden_internal_permission',
    );
  }
}

function assertNotSystemOwnerName(name: string): void {
  if (name.trim().toLowerCase() === 'system owner') {
    throw new HttpError(
      403,
      'The System Owner role is protected and cannot be created or modified',
      'system_owner_protected',
    );
  }
}

async function loadCatalogModuleKeys(
  admin: ReturnType<typeof createAdminClient>,
): Promise<Set<string>> {
  const { data, error } = await admin
    .from('nido_module_catalog')
    .select('module_key');

  if (error) {
    throw new HttpError(
      500,
      'Unable to load NIDO module catalog',
      'module_catalog_lookup_failed',
      error.message,
    );
  }

  return new Set(
    (Array.isArray(data) ? data : [])
      .map((row) => String((row as { module_key?: unknown }).module_key ?? '').trim())
      .filter(Boolean),
  );
}

function parseRpcPermissions(raw: unknown): RpcPermissionRow[] {
  try {
    return toRpcPermissionArray(raw);
  } catch (err) {
    if (err instanceof PayloadValidationError) {
      throw new HttpError(400, err.message, err.code);
    }
    throw err;
  }
}

Deno.serve(async (req) => {
  const options = preflight(req);
  if (options) return options;
  if (req.method !== 'POST') return json(req, { error: 'Method not allowed' }, 405);
  if (!originAllowed(req)) return json(req, { error: 'Origin not allowed' }, 403);

  let admin: ReturnType<typeof createAdminClient> | undefined;
  let actorId: string | null = null;
  let actionName = 'unknown';
  let targetRoleId: string | null = null;
  const requestId = req.headers.get('x-request-id');

  try {
    const caller = await requireCaller(req);
    admin = caller.admin;
    actorId = caller.authUserId;
    const { context } = caller;

    if (context.user_scope !== 'nido_internal') {
      throw new HttpError(
        403,
        'Only internal NIDO users can manage NIDO roles',
        'internal_context_required',
      );
    }

    const body = await parseJsonBody(req);
    actionName = requireString(body.action, 'action', 64);

    await enforceRateLimit(
      admin,
      RATE_LIMITS.manage_nido_roles,
      actorId,
      requestId,
    );

    if (actionName === 'sync_reference_roles') {
      requireAnyInternalRolePermission(context, [
        [CANONICAL_ROLE_PERMISSION_MODULE_KEY, 'view'],
        [CANONICAL_ROLE_PERMISSION_MODULE_KEY, 'create'],
        [CANONICAL_ROLE_PERMISSION_MODULE_KEY, 'edit'],
        [CANONICAL_ROLE_PERMISSION_MODULE_KEY, 'configure'],
        [CANONICAL_ROLE_PERMISSION_MODULE_KEY, 'manage'],
        ['users', 'create'],
        ['users', 'manage'],
      ]);

      const validModuleKeys = await loadCatalogModuleKeys(admin);
      const prepared = prepareSyncReferenceRolesRpcPayload(
        REFERENCE_ROLES,
        validModuleKeys,
      );

      if (!prepared.ok) {
        await writeAudit(admin, {
          actorAuthUserId: actorId,
          action: 'nido_roles.sync_reference.failed',
          targetTable: 'nido_roles',
          targetId: null,
          metadata: {
            version: REFERENCE_ROLES_VERSION,
            reason: 'unmapped_reference_module_keys',
            unmapped_module_keys: prepared.unmappedByRole,
          },
          requestId,
        });

        return json(
          req,
          {
            success: false,
            error:
              'Reference role synchronization aborted: one or more required module keys are missing from public.nido_module_catalog',
            code: 'unmapped_reference_module_keys',
            unmapped_module_keys: prepared.unmappedByRole,
          },
          400,
        );
      }

      const { data: syncResult, error: syncError } = await admin.rpc(
        'sync_nido_reference_roles_atomic',
        {
          p_roles: prepared.roles,
          p_actor_auth_user_id: actorId,
        },
      );

      if (syncError) {
        throw new HttpError(
          500,
          'Failed to synchronize reference roles',
          'reference_role_sync_failed',
          syncError.message,
        );
      }

      await writeAudit(admin, {
        actorAuthUserId: actorId,
        action: 'nido_roles.sync_reference',
        targetTable: 'nido_roles',
        targetId: null,
        metadata: {
          version: REFERENCE_ROLES_VERSION,
          result: syncResult,
        },
        requestId,
      });

      return json(req, {
        success: true,
        action: actionName,
        version: REFERENCE_ROLES_VERSION,
        result: syncResult,
      });
    }

    if (actionName === 'create_role') {
      requireInternalPermission(context, CANONICAL_ROLE_PERMISSION_MODULE_KEY, 'create');

      const name = requireString(body.name, 'name', 120);
      assertNotSystemOwnerName(name);
      const department = optionalString(body.department, 120) ?? '';
      const description = optionalString(body.description, 500) ?? '';
      const status = normalizeStatus(body.status);

      const { data: createdRole, error: createError } = await admin
        .from('nido_roles')
        .insert({
          name,
          department,
          description,
          status,
          is_system_owner: false,
          created_by: actorId,
        })
        .select('id,name,department,description,status,is_system_owner,created_at,updated_at')
        .single();

      if (createError) {
        if (createError.code === '23505') {
          throw new HttpError(
            409,
            `A role named "${name}" already exists`,
            'role_name_conflict',
            createError.message,
          );
        }
        throw new HttpError(
          500,
          'Unable to create role',
          'role_create_failed',
          createError.message,
        );
      }

      targetRoleId = createdRole.id;

      await writeAudit(admin, {
        actorAuthUserId: actorId,
        action: 'nido_roles.create',
        targetTable: 'nido_roles',
        targetId: createdRole.id,
        metadata: {
          name: createdRole.name,
          department: createdRole.department,
          status: createdRole.status,
        },
        requestId,
      });

      return json(
        req,
        {
          success: true,
          action: actionName,
          role: createdRole,
        },
        201,
      );
    }

    if (actionName === 'update_role') {
      requireInternalPermission(context, CANONICAL_ROLE_PERMISSION_MODULE_KEY, 'edit');

      const roleId = assertUuid(body.role_id, 'role_id');
      targetRoleId = roleId;

      const { data: existingRole, error: lookupError } = await admin
        .from('nido_roles')
        .select('id,name,department,description,status,is_system_owner')
        .eq('id', roleId)
        .maybeSingle();

      if (lookupError) {
        throw new HttpError(
          500,
          'Unable to load existing role',
          'role_lookup_failed',
          lookupError.message,
        );
      }
      if (!existingRole) {
        throw new HttpError(404, 'Role not found', 'role_not_found');
      }
      if (existingRole.is_system_owner) {
        throw new HttpError(
          403,
          'The System Owner role cannot be modified',
          'system_owner_protected',
        );
      }

      const name = requireString(body.name, 'name', 120);
      assertNotSystemOwnerName(name);
      const department = optionalString(body.department, 120) ?? '';
      const description = optionalString(body.description, 500) ?? '';
      const status = normalizeStatus(body.status);

      const { data: updatedRole, error: updateError } = await admin
        .from('nido_roles')
        .update({
          name,
          department,
          description,
          status,
        })
        .eq('id', roleId)
        .select('id,name,department,description,status,is_system_owner,created_at,updated_at')
        .single();

      if (updateError) {
        if (updateError.code === '23505') {
          throw new HttpError(
            409,
            `A role named "${name}" already exists`,
            'role_name_conflict',
            updateError.message,
          );
        }
        throw new HttpError(
          500,
          'Unable to update role',
          'role_update_failed',
          updateError.message,
        );
      }

      await writeAudit(admin, {
        actorAuthUserId: actorId,
        action: 'nido_roles.update',
        targetTable: 'nido_roles',
        targetId: roleId,
        metadata: {
          previous: {
            name: existingRole.name,
            department: existingRole.department,
            status: existingRole.status,
          },
          next: {
            name: updatedRole.name,
            department: updatedRole.department,
            status: updatedRole.status,
          },
        },
        requestId,
      });

      return json(req, {
        success: true,
        action: actionName,
        role: updatedRole,
      });
    }

    if (actionName === 'save_role_permissions') {
      requireAnyInternalRolePermission(context, [
        [CANONICAL_ROLE_PERMISSION_MODULE_KEY, 'configure'],
        [CANONICAL_ROLE_PERMISSION_MODULE_KEY, 'edit'],
      ]);

      const roleId = assertUuid(body.role_id, 'role_id');
      targetRoleId = roleId;
      const permissionRows = parseRpcPermissions(body.permissions);

      const validModuleKeys = await loadCatalogModuleKeys(admin);
      const { valid: validPermissions, unmappedModuleKeys } = partitionCatalogModuleKeys(
        permissionRows,
        validModuleKeys,
      );
      if (unmappedModuleKeys.length > 0) {
        throw new HttpError(
          400,
          `Unknown module_key(s): ${unmappedModuleKeys.join(', ')}`,
          'invalid_module_key',
        );
      }

      const { data: existingRole, error: lookupError } = await admin
        .from('nido_roles')
        .select('id,name,is_system_owner')
        .eq('id', roleId)
        .maybeSingle();

      if (lookupError) {
        throw new HttpError(
          500,
          'Unable to load role',
          'role_lookup_failed',
          lookupError.message,
        );
      }
      if (!existingRole) {
        throw new HttpError(404, 'Role not found', 'role_not_found');
      }
      if (existingRole.is_system_owner) {
        throw new HttpError(
          403,
          'System Owner permissions cannot be modified',
          'system_owner_protected',
        );
      }

      const { data: saveResult, error: saveError } = await admin.rpc(
        'save_nido_role_permissions_atomic',
        {
          p_role_id: roleId,
          p_permissions: validPermissions,
          p_actor_auth_user_id: actorId,
        },
      );

      if (saveError) {
        throw new HttpError(
          500,
          'Unable to save role permissions',
          'role_permissions_save_failed',
          saveError.message,
        );
      }

      await writeAudit(admin, {
        actorAuthUserId: actorId,
        action: 'nido_roles.save_permissions',
        targetTable: 'nido_role_permissions',
        targetId: roleId,
        metadata: {
          role_name: existingRole.name,
          module_count: validPermissions.length,
          result: saveResult,
        },
        requestId,
      });

      return json(req, {
        success: true,
        action: actionName,
        role_id: roleId,
        result: saveResult,
      });
    }

    if (actionName === 'delete_role') {
      requireInternalPermission(context, CANONICAL_ROLE_PERMISSION_MODULE_KEY, 'delete');

      const roleId = assertUuid(body.role_id, 'role_id');
      targetRoleId = roleId;

      const { data: existingRole, error: lookupError } = await admin
        .from('nido_roles')
        .select('id,name,is_system_owner')
        .eq('id', roleId)
        .maybeSingle();

      if (lookupError) {
        throw new HttpError(
          500,
          'Unable to load role',
          'role_lookup_failed',
          lookupError.message,
        );
      }
      if (!existingRole) {
        throw new HttpError(404, 'Role not found', 'role_not_found');
      }
      if (existingRole.is_system_owner) {
        throw new HttpError(
          403,
          'The System Owner role cannot be deleted',
          'system_owner_protected',
        );
      }

      const { count: assignedCount, error: countError } = await admin
        .from('nido_users')
        .select('id', { count: 'exact', head: true })
        .eq('role_id', roleId);

      if (countError) {
        throw new HttpError(
          500,
          'Unable to verify assigned users for role',
          'role_usage_check_failed',
          countError.message,
        );
      }

      if ((assignedCount ?? 0) > 0) {
        throw new HttpError(
          409,
          `Cannot delete "${existingRole.name}" while ${assignedCount} user(s) are assigned to it`,
          'role_in_use',
        );
      }

      const { error: deleteError } = await admin
        .from('nido_roles')
        .delete()
        .eq('id', roleId)
        .eq('is_system_owner', false);

      if (deleteError) {
        throw new HttpError(
          500,
          'Unable to delete role',
          'role_delete_failed',
          deleteError.message,
        );
      }

      await writeAudit(admin, {
        actorAuthUserId: actorId,
        action: 'nido_roles.delete',
        targetTable: 'nido_roles',
        targetId: roleId,
        metadata: {
          name: existingRole.name,
        },
        requestId,
      });

      return json(req, {
        success: true,
        action: actionName,
        deleted_role_id: roleId,
      });
    }

    throw new HttpError(
      400,
      `Unsupported action: ${actionName}`,
      'unsupported_action',
    );
  } catch (err) {
    const mapped = mapErrorToHttpResponse(err);
    if (admin) {
      await writeAudit(admin, {
        actor_auth_user_id: actorId,
        target_scope: 'nido_internal',
        event_type: `nido_roles.${actionName}.failed`,
        outcome: 'failure',
        details: {
          target_table: 'nido_roles',
          target_id: targetRoleId,
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

