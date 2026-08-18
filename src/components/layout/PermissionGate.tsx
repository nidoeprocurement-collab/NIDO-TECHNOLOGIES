import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import { getModuleKeyForPath } from '@/lib/routePermissions';
import { getPlatformModuleForPath } from '@/lib/platformModuleCatalog';
import AccessDeniedPage from '@/pages/AccessDeniedPage';

/**
 * Enforces per-module RBAC on every admin (NIDO Owner Platform) route.
 * Resolves the current path to a permission module via routePermissions,
 * then checks the logged-in user's role permissions before rendering the
 * page. Super Administrators and Client Portal users (who have their own
 * separate permission system) always pass through.
 */
export default function PermissionGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { isClientPortalUser } = useAuth();
  const { hasPermission, hasRoutePermission, isSuperAdmin } = usePermissions();

  if (isClientPortalUser || isSuperAdmin) return <>{children}</>;

  const moduleKey = getModuleKeyForPath(location.pathname);
  if (!moduleKey) return <>{children}</>; // ungated page (home, cart, profile, etc.)

  const platformModule = getPlatformModuleForPath(location.pathname);
  const canView = platformModule
    ? hasRoutePermission(platformModule.key, platformModule.legacyKey, 'view')
    : hasPermission(moduleKey, 'view');

  if (!canView) {
    return <AccessDeniedPage />;
  }

  return <>{children}</>;
}
