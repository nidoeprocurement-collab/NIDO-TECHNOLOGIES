// ── Permissions Context ───────────────────────────────────────────────────────
// Provides hasPermission(), hasRoutePermission(), and getModulePermissions()
// using the authoritative server-provided permissions from get_my_auth_context().
// Local permissionsStore is never used for authorization decisions.

import React, { createContext, useContext, useCallback, useMemo, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { ActionKey, ModulePermissions } from '@/lib/permissionsStore';

function findModulePermissions(
  permissions: Record<string, ModulePermissions>,
  moduleKey: string,
): ModulePermissions | undefined {
  const trimmed = moduleKey.trim();
  if (!trimmed) return undefined;

  if (Object.prototype.hasOwnProperty.call(permissions, trimmed)) {
    return permissions[trimmed];
  }

  const normalized = trimmed.toLowerCase();
  for (const key of Object.keys(permissions)) {
    if (key.trim().toLowerCase() === normalized) {
      return permissions[key];
    }
  }

  return undefined;
}

interface PermissionsContextType {
  /** Check if the current user has a specific permission. Always true for System Owner. */
  hasPermission: (moduleKey: string, action: ActionKey) => boolean;
  /** Check a page-level module first, then fall back to its legacy group. */
  hasRoutePermission: (moduleKey: string, legacyModuleKey: string, action: ActionKey) => boolean;
  /** Get all module permissions for the current user's role. */
  getModulePermissions: (moduleKey: string) => ModulePermissions;
  /** True if the current user is a Super Admin (System Owner). */
  isSuperAdmin: boolean;
  /** Current role name — empty string if not authenticated. */
  roleName: string;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, isNidoAdmin, authContext } = useAuth();

  // Only NIDO internal users participate in internal RBAC.
  // Client portal users (and impersonated sessions) never receive internal NIDO permissions.
  const isInternalActive =
    !isLoading &&
    isAuthenticated &&
    isNidoAdmin &&
    authContext?.user_scope === 'nido_internal';

  const roleName = isInternalActive ? (authContext?.role?.name ?? '') : '';
  const superAdmin = isInternalActive && Boolean(authContext?.role?.is_system_owner);
  const serverPermissions = useMemo(
    () => (isInternalActive ? (authContext?.permissions ?? {}) : {}),
    [isInternalActive, authContext?.permissions],
  );

  const hp = useCallback(
    (moduleKey: string, action: ActionKey): boolean => {
      if (!isInternalActive) return false;
      if (superAdmin) return true;
      const modPerms = findModulePermissions(serverPermissions, moduleKey);
      return Boolean(modPerms?.[action]);
    },
    [isInternalActive, superAdmin, serverPermissions],
  );

  const hrp = useCallback(
    (moduleKey: string, legacyModuleKey: string, action: ActionKey): boolean => {
      if (!isInternalActive) return false;
      if (superAdmin) return true;
      const primaryPerms = findModulePermissions(serverPermissions, moduleKey);
      if (primaryPerms !== undefined) {
        return Boolean(primaryPerms[action]);
      }
      const legacyPerms = findModulePermissions(serverPermissions, legacyModuleKey);
      return Boolean(legacyPerms?.[action]);
    },
    [isInternalActive, superAdmin, serverPermissions],
  );

  const gmp = useCallback(
    (moduleKey: string): ModulePermissions => {
      if (!isInternalActive) return {};
      return findModulePermissions(serverPermissions, moduleKey) ?? {};
    },
    [isInternalActive, serverPermissions],
  );

  const value = useMemo<PermissionsContextType>(
    () => ({
      hasPermission: hp,
      hasRoutePermission: hrp,
      getModulePermissions: gmp,
      isSuperAdmin: superAdmin,
      roleName,
    }),
    [hp, hrp, gmp, superAdmin, roleName],
  );

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions(): PermissionsContextType {
  const ctx = useContext(PermissionsContext);
  if (!ctx) throw new Error('usePermissions must be used within <PermissionsProvider>');
  return ctx;
}
