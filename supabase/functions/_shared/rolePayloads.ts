export const CANONICAL_ROLE_PERMISSION_MODULE_KEY = 'roles' as const;

export interface RpcPermissionRow {
  module_key: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_approve: boolean;
  can_export: boolean;
  can_import: boolean;
  can_manage: boolean;
  can_configure: boolean;
}

export interface RpcReferenceRoleRow {
  name: string;
  department: string;
  description: string;
  permissions: RpcPermissionRow[];
}

export class PayloadValidationError extends Error {
  code: string;

  constructor(message: string, code = 'invalid_permissions_payload') {
    super(message);
    this.name = 'PayloadValidationError';
    this.code = code;
  }
}

const ACTION_KEYS = [
  ['view', 'can_view'],
  ['create', 'can_create'],
  ['edit', 'can_edit'],
  ['delete', 'can_delete'],
  ['approve', 'can_approve'],
  ['export', 'can_export'],
  ['import', 'can_import'],
  ['manage', 'can_manage'],
  ['configure', 'can_configure'],
] as const;

function readFlag(
  entry: Record<string, unknown>,
  shortKey: string,
  canKey: string,
  moduleKey: string,
): boolean {
  const hasCan = Object.prototype.hasOwnProperty.call(entry, canKey);
  const hasShort = Object.prototype.hasOwnProperty.call(entry, shortKey);
  const rawValue = hasCan ? entry[canKey] : hasShort ? entry[shortKey] : false;

  if (rawValue === undefined || rawValue === null) {
    return false;
  }
  if (typeof rawValue !== 'boolean') {
    throw new PayloadValidationError(
      `permissions.${moduleKey}.${hasCan ? canKey : shortKey} must be a boolean`,
      'invalid_permissions_payload',
    );
  }
  return rawValue;
}

function buildRpcPermissionRow(
  moduleKey: string,
  entry: Record<string, unknown>,
): RpcPermissionRow {
  const trimmedKey = moduleKey.trim();
  if (!trimmedKey) {
    throw new PayloadValidationError(
      'module_key must be a non-empty string',
      'invalid_permissions_payload',
    );
  }

  return {
    module_key: trimmedKey,
    can_view: readFlag(entry, 'view', 'can_view', trimmedKey),
    can_create: readFlag(entry, 'create', 'can_create', trimmedKey),
    can_edit: readFlag(entry, 'edit', 'can_edit', trimmedKey),
    can_delete: readFlag(entry, 'delete', 'can_delete', trimmedKey),
    can_approve: readFlag(entry, 'approve', 'can_approve', trimmedKey),
    can_export: readFlag(entry, 'export', 'can_export', trimmedKey),
    can_import: readFlag(entry, 'import', 'can_import', trimmedKey),
    can_manage: readFlag(entry, 'manage', 'can_manage', trimmedKey),
    can_configure: readFlag(entry, 'configure', 'can_configure', trimmedKey),
  };
}

/**
 * Converts either a frontend permission map ({ [module_key]: { view, ... } })
 * or an RPC permission array ([{ module_key, can_view, ... }]) into the exact
 * JSON array structure expected by public.save_nido_role_permissions_atomic()
 * and public.sync_nido_reference_roles_atomic().
 */
export function toRpcPermissionArray(raw: unknown): RpcPermissionRow[] {
  if (!raw || typeof raw !== 'object') {
    throw new PayloadValidationError(
      'permissions must be an object keyed by module_key or an array of module permissions',
      'invalid_permissions_payload',
    );
  }

  const deduped = new Map<string, RpcPermissionRow>();

  if (Array.isArray(raw)) {
    for (let i = 0; i < raw.length; i += 1) {
      const item = raw[i];
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        throw new PayloadValidationError(
          `permissions[${i}] must be an object`,
          'invalid_permissions_payload',
        );
      }
      const record = item as Record<string, unknown>;
      if (typeof record.module_key !== 'string' || !record.module_key.trim()) {
        throw new PayloadValidationError(
          `permissions[${i}].module_key must be a non-empty string`,
          'invalid_permissions_payload',
        );
      }
      const row = buildRpcPermissionRow(record.module_key, record);
      deduped.set(row.module_key, row);
    }
    return Array.from(deduped.values());
  }

  for (const [moduleKey, actions] of Object.entries(raw)) {
    if (!moduleKey.trim()) {
      throw new PayloadValidationError(
        'permissions keys must be non-empty module_key strings',
        'invalid_permissions_payload',
      );
    }
    if (!actions || typeof actions !== 'object' || Array.isArray(actions)) {
      throw new PayloadValidationError(
        `permissions.${moduleKey} must be an object`,
        'invalid_permissions_payload',
      );
    }
    const row = buildRpcPermissionRow(moduleKey, actions as Record<string, unknown>);
    deduped.set(row.module_key, row);
  }

  return Array.from(deduped.values());
}

export function partitionCatalogModuleKeys(
  rows: RpcPermissionRow[],
  validModuleKeys: Set<string>,
): { valid: RpcPermissionRow[]; unmappedModuleKeys: string[] } {
  const valid: RpcPermissionRow[] = [];
  const unmappedModuleKeys: string[] = [];

  for (const row of rows) {
    if (validModuleKeys.has(row.module_key)) {
      valid.push(row);
    } else {
      unmappedModuleKeys.push(row.module_key);
    }
  }

  return { valid, unmappedModuleKeys };
}

export function toRpcReferenceRolesPayload(
  roles: Array<{
    name: string;
    department: string;
    description: string;
    permissions: unknown;
  }>,
  validModuleKeys?: Set<string>,
): {
  roles: RpcReferenceRoleRow[];
  unmappedByRole: Array<{ role: string; moduleKeys: string[] }>;
} {
  const transformedRoles: RpcReferenceRoleRow[] = [];
  const unmappedByRole: Array<{ role: string; moduleKeys: string[] }> = [];

  for (const role of roles) {
    const rpcPerms = toRpcPermissionArray(role.permissions);
    if (validModuleKeys) {
      const { valid, unmappedModuleKeys } = partitionCatalogModuleKeys(
        rpcPerms,
        validModuleKeys,
      );
      if (unmappedModuleKeys.length > 0) {
        unmappedByRole.push({ role: role.name, moduleKeys: unmappedModuleKeys });
      }
      transformedRoles.push({
        name: role.name,
        department: role.department,
        description: role.description,
        permissions: valid,
      });
    } else {
      transformedRoles.push({
        name: role.name,
        department: role.department,
        description: role.description,
        permissions: rpcPerms,
      });
    }
  }

  return { roles: transformedRoles, unmappedByRole };
}

export type SyncReferenceRolesPreparation =
  | { ok: true; roles: RpcReferenceRoleRow[]; unmappedByRole: [] }
  | { ok: false; roles: null; unmappedByRole: Array<{ role: string; moduleKeys: string[] }> };

/**
 * Validates every required reference-role module_key against nido_module_catalog
 * before invoking sync_nido_reference_roles_atomic. Rejects the entire sync if any
 * required module_key is missing so incomplete permission matrices are never inserted.
 */
export function prepareSyncReferenceRolesRpcPayload(
  roles: Array<{
    name: string;
    department: string;
    description: string;
    permissions: unknown;
  }>,
  validModuleKeys: Set<string>,
): SyncReferenceRolesPreparation {
  const { roles: transformedRoles, unmappedByRole } = toRpcReferenceRolesPayload(
    roles,
    validModuleKeys,
  );
  if (unmappedByRole.length > 0) {
    return {
      ok: false,
      roles: null,
      unmappedByRole,
    };
  }
  return {
    ok: true,
    roles: transformedRoles,
    unmappedByRole: [],
  };
}

export { ACTION_KEYS };

