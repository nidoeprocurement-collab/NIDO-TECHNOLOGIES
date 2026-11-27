import { describe, expect, it, vi } from 'vitest';
import {
  REFERENCE_ROLES,
  REFERENCE_ROLES_VERSION,
} from '../../../supabase/functions/_shared/referenceRoles';
import {
  CANONICAL_ROLE_PERMISSION_MODULE_KEY,
  partitionCatalogModuleKeys,
  PayloadValidationError,
  prepareSyncReferenceRolesRpcPayload,
  toRpcPermissionArray,
  toRpcReferenceRolesPayload,
  type RpcPermissionRow,
  type RpcReferenceRoleRow,
} from '../../../supabase/functions/_shared/rolePayloads';
import { MODULES } from '../permissionsStore';

const ALL_NINE_CAN_KEYS: Array<keyof Omit<RpcPermissionRow, 'module_key'>> = [
  'can_view',
  'can_create',
  'can_edit',
  'can_delete',
  'can_approve',
  'can_export',
  'can_import',
  'can_manage',
  'can_configure',
];

/**
 * Simulates the SQL contract of public.sync_nido_reference_roles_atomic()
 * and public.save_nido_role_permissions_atomic() to verify payload compatibility.
 */
function simulateSyncReferenceRolesRpc(
  existingRoles: Map<string, { id: string; permissions: RpcPermissionRow[] }>,
  pRoles: RpcReferenceRoleRow[],
  catalogKeys: Set<string>,
): { inserted_count: number; skipped_count: number } {
  if (!Array.isArray(pRoles)) {
    throw new Error('Invalid reference roles payload');
  }
  let inserted = 0;
  let skipped = 0;

  for (const role of pRoles) {
    const normalizedName = role.name.trim().toLowerCase();
    if (!normalizedName || normalizedName === 'system owner') continue;
    if (existingRoles.has(normalizedName)) {
      skipped += 1;
      continue;
    }
    if (!Array.isArray(role.permissions)) {
      throw new Error(`Expected permissions array for ${role.name}`);
    }
    const filteredPerms = role.permissions.filter((p) => catalogKeys.has(p.module_key));
    existingRoles.set(normalizedName, {
      id: `uuid-${inserted + 1}`,
      permissions: filteredPerms,
    });
    inserted += 1;
  }

  return { inserted_count: inserted, skipped_count: skipped };
}

describe('manage-nido-roles RPC payload transformations', () => {
  it('transforms all 24 built-in roles into the exact array contract for sync_nido_reference_roles_atomic', () => {
    expect(REFERENCE_ROLES_VERSION).toBe('rbac-reference-v2');
    expect(REFERENCE_ROLES).toHaveLength(24);
    expect(REFERENCE_ROLES.some((r) => r.name.toLowerCase() === 'system owner')).toBe(false);

    const { roles, unmappedByRole } = toRpcReferenceRolesPayload(REFERENCE_ROLES);
    expect(unmappedByRole).toEqual([]);
    expect(roles).toHaveLength(24);

    for (let i = 0; i < roles.length; i += 1) {
      const src = REFERENCE_ROLES[i];
      const rpcRole = roles[i];
      expect(rpcRole.name).toBe(src.name);
      expect(rpcRole.department).toBe(src.department);
      expect(rpcRole.description).toBe(src.description);
      expect(Array.isArray(rpcRole.permissions)).toBe(true);
      expect(rpcRole.permissions.length).toBe(Object.keys(src.permissions).length);

      for (const perm of rpcRole.permissions) {
        expect(typeof perm.module_key).toBe('string');
        expect(perm.module_key.length).toBeGreaterThan(0);
        for (const key of ALL_NINE_CAN_KEYS) {
          expect(typeof perm[key]).toBe('boolean');
        }
      }
    }

    // Verify exact permission mapping for System Administrator -> dashboard
    const sysAdmin = roles.find((r) => r.name === 'System Administrator')!;
    const dashboard = sysAdmin.permissions.find((p) => p.module_key === 'dashboard')!;
    expect(dashboard).toEqual({
      module_key: 'dashboard',
      can_view: true,
      can_create: false,
      can_edit: false,
      can_delete: false,
      can_approve: false,
      can_export: true,
      can_import: false,
      can_manage: true,
      can_configure: true,
    });
  });

  it('transforms custom role permissions object into exact 9-field array for save_nido_role_permissions_atomic', () => {
    const rpcArray = toRpcPermissionArray({
      orders: { view: true, create: true, edit: false, approve: true },
      reports: { view: true, export: true },
    });

    expect(rpcArray).toEqual([
      {
        module_key: 'orders',
        can_view: true,
        can_create: true,
        can_edit: false,
        can_delete: false,
        can_approve: true,
        can_export: false,
        can_import: false,
        can_manage: false,
        can_configure: false,
      },
      {
        module_key: 'reports',
        can_view: true,
        can_create: false,
        can_edit: false,
        can_delete: false,
        can_approve: false,
        can_export: true,
        can_import: false,
        can_manage: false,
        can_configure: false,
      },
    ]);
  });

  it('handles empty permission objects and empty permission arrays cleanly', () => {
    expect(toRpcPermissionArray({})).toEqual([]);
    expect(toRpcPermissionArray([])).toEqual([]);
  });

  it('detects and reports unmapped/invalid module keys without inventing keys and rejects invalid types', () => {
    const catalog = new Set(['dashboard', 'orders', 'reports']);
    const parsed = toRpcPermissionArray({
      dashboard: { view: true },
      nonexistent_module: { view: true, edit: true },
    });

    const { valid, unmappedModuleKeys } = partitionCatalogModuleKeys(parsed, catalog);
    expect(valid).toHaveLength(1);
    expect(valid[0].module_key).toBe('dashboard');
    expect(unmappedModuleKeys).toEqual(['nonexistent_module']);

    const { roles, unmappedByRole } = toRpcReferenceRolesPayload(
      [
        {
          name: 'Test Role',
          department: 'Ops',
          description: 'Desc',
          permissions: { dashboard: { view: true }, bogus_key: { view: true } },
        },
      ],
      catalog,
    );
    expect(roles[0].permissions).toHaveLength(1);
    expect(unmappedByRole).toEqual([{ role: 'Test Role', moduleKeys: ['bogus_key'] }]);

    expect(() =>
      toRpcPermissionArray({ dashboard: { view: 'yes' } }),
    ).toThrow(PayloadValidationError);
  });

  it('keeps repeated synchronization idempotent and preserves existing customized permissions', () => {
    const catalog = new Set(
      REFERENCE_ROLES.flatMap((r) => Object.keys(r.permissions)),
    );
    const { roles } = toRpcReferenceRolesPayload(REFERENCE_ROLES, catalog);

    const existingDb = new Map<string, { id: string; permissions: RpcPermissionRow[] }>();
    const customPerms: RpcPermissionRow[] = [
      {
        module_key: 'dashboard',
        can_view: true,
        can_create: false,
        can_edit: false,
        can_delete: false,
        can_approve: false,
        can_export: false,
        can_import: false,
        can_manage: false,
        can_configure: false,
      },
    ];
    const targetRoleKey = REFERENCE_ROLES[1].name.trim().toLowerCase();
    existingDb.set(targetRoleKey, {
      id: 'existing-custom-uuid',
      permissions: customPerms,
    });

    const firstRun = simulateSyncReferenceRolesRpc(existingDb, roles, catalog);
    expect(firstRun).toEqual({ inserted_count: 23, skipped_count: 1 });
    expect(existingDb.get(targetRoleKey)?.permissions).toEqual(customPerms);

    const secondRun = simulateSyncReferenceRolesRpc(existingDb, roles, catalog);
    expect(secondRun).toEqual({ inserted_count: 0, skipped_count: 24 });
    expect(existingDb.get(targetRoleKey)?.permissions).toEqual(customPerms);
  });

  it('rejects the entire initial synchronization and sends zero roles to the RPC if any required module_key is unmapped', () => {
    const allCatalogKeys = new Set(
      REFERENCE_ROLES.flatMap((r) => Object.keys(r.permissions)),
    );
    const missingKey = 'dashboard';
    const incompleteCatalog = new Set(
      Array.from(allCatalogKeys).filter((k) => k !== missingKey),
    );
    const rpcSpy = vi.fn();

    const preparedFail = prepareSyncReferenceRolesRpcPayload(
      REFERENCE_ROLES,
      incompleteCatalog,
    );
    if (preparedFail.ok) {
      rpcSpy(preparedFail.roles);
    }

    expect(preparedFail.ok).toBe(false);
    expect(preparedFail.roles).toBeNull();
    expect(preparedFail.unmappedByRole.length).toBeGreaterThan(0);
    expect(
      preparedFail.unmappedByRole.some((entry) => entry.moduleKeys.includes(missingKey)),
    ).toBe(true);
    expect(rpcSpy).not.toHaveBeenCalled();

    // When all required module keys are present in nido_module_catalog, sync proceeds with all 24 roles
    const preparedSuccess = prepareSyncReferenceRolesRpcPayload(
      REFERENCE_ROLES,
      allCatalogKeys,
    );
    if (preparedSuccess.ok) {
      rpcSpy(preparedSuccess.roles);
    }

    expect(preparedSuccess.ok).toBe(true);
    expect(preparedSuccess.unmappedByRole).toEqual([]);
    expect(rpcSpy).toHaveBeenCalledTimes(1);
    expect(rpcSpy).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ name: REFERENCE_ROLES[0].name }),
    ]));
    expect(rpcSpy.mock.calls[0][0]).toHaveLength(24);
  });

  it('uses the canonical "roles" module key consistently across catalog, reference roles, and Edge Function auth', () => {
    expect(CANONICAL_ROLE_PERMISSION_MODULE_KEY).toBe('roles');
    expect(MODULES.some((m) => m.key === CANONICAL_ROLE_PERMISSION_MODULE_KEY)).toBe(true);
    expect(
      REFERENCE_ROLES.some((r) =>
        Object.prototype.hasOwnProperty.call(r.permissions, CANONICAL_ROLE_PERMISSION_MODULE_KEY),
      ),
    ).toBe(true);
    expect(
      REFERENCE_ROLES.some((r) =>
        Object.prototype.hasOwnProperty.call(r.permissions, 'user_roles'),
      ),
    ).toBe(false);
  });
});

