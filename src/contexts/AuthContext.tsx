'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { supabase } from '@/lib/supabase';
import type { ActionKey, ModulePermissions } from '@/lib/permissionsStore';
import {
  getImpersonationSession,
  endImpersonation as clearImpersonationSession,
  type ImpersonationSession,
} from '@/lib/impersonationStore';

export type UserType = 'nido_admin' | 'client_admin' | 'client_user';
export type UserScope = 'nido_internal' | 'client_portal';

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  userType: UserType;
  clientId?: string;
  clientName?: string;
  department?: string;
}

export interface AuthContextProfile {
  id: string;
  employee_id?: string | null;
  client_id?: string | null;
  client_code?: string | null;
  client_name?: string | null;
  user_type?: string | null;
  name: string;
  email: string;
  department?: string | null;
  designation?: string | null;
  force_password_change?: boolean | null;
}

export interface AuthContextRole {
  id?: string | null;
  name?: string | null;
  is_system_owner?: boolean | null;
}

export interface AuthContextData {
  authenticated: true;
  user_scope: UserScope;
  effective_admin_scope?: boolean;
  profile: AuthContextProfile;
  role: AuthContextRole;
  permissions: Record<string, ModulePermissions>;
}

export interface AuthContextResult {
  authenticated: boolean;
  reason?: string;
  superseded?: boolean;
  user?: User;
  context?: AuthContextData;
}

export interface SignInResult {
  ok: boolean;
  user?: User;
  userScope?: UserScope;
  reason?: string;
  error?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  /** The identity that authenticated, never the impersonated effective user. */
  currentAuthenticatedUser: User | null;
  /** Deprecated local-only login stub; does not authenticate or write localStorage. */
  login: (user: User) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
  accessDenied: boolean;
  accessDeniedReason: string | null;
  isPasswordRecovery: boolean;
  authContext: AuthContextData | null;
  signInWithPassword: (
    email: string,
    password: string,
    deviceInfo?: string,
  ) => Promise<SignInResult>;
  refreshAuthContext: () => Promise<AuthContextResult>;
  hasClientPortalPermission: (moduleKey: string, action?: ActionKey) => boolean;
  isNidoAdmin: boolean;
  isClientPortalUser: boolean;
  originalUser: User | null;
  effectiveUser: User | null;
  isImpersonating: boolean;
  impersonationSession: ImpersonationSession | null;
  startImpersonation: (target: User) => boolean;
  endImpersonation: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LEGACY_USER_STORAGE_KEY = 'nido_user';
const LEGACY_AUTH_USER_SCOPE_KEY = 'nido_auth_user';

function clearLegacyUserStorage() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LEGACY_USER_STORAGE_KEY);
    localStorage.removeItem(LEGACY_AUTH_USER_SCOPE_KEY);
  } catch {
    // Never allow browser storage restrictions to interrupt authentication.
  }
}

function setLegacyAuthScope(userId: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LEGACY_USER_STORAGE_KEY);
    localStorage.setItem(LEGACY_AUTH_USER_SCOPE_KEY, JSON.stringify({ id: userId }));
  } catch {
    // Never allow browser storage restrictions to interrupt authentication.
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function mapAuthContextToUser(ctx: AuthContextData): User | null {
  const { user_scope, profile, role } = ctx;
  if (
    !profile ||
    !isNonEmptyString(profile.id) ||
    !isNonEmptyString(profile.email) ||
    !isNonEmptyString(profile.name)
  ) {
    return null;
  }

  if (user_scope === 'nido_internal') {
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: typeof role?.name === 'string' ? role.name : '',
      userType: 'nido_admin',
      department: profile.department ?? undefined,
    };
  }

  if (user_scope === 'client_portal') {
    if (!isNonEmptyString(profile.client_id)) return null;
    if (profile.user_type !== 'client_admin' && profile.user_type !== 'client_user') {
      return null;
    }
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: typeof role?.name === 'string' ? role.name : '',
      userType: profile.user_type,
      clientId: profile.client_id,
      clientName: profile.client_name ?? undefined,
      department: profile.department ?? undefined,
    };
  }

  return null;
}

function findNormalizedModulePermissions(
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

function mapSignInErrorMessage(message?: string): string {
  if (!message) return 'Invalid email or password.';
  if (/rate limit|too many requests|locked/i.test(message)) {
    return 'Too many sign-in attempts. Please wait a moment or reset your password.';
  }
  if (/network|fetch|timeout|failed to fetch/i.test(message)) {
    return 'Unable to reach the authentication service. Please check your connection and try again.';
  }
  return 'Invalid email or password.';
}

function isUrlRecoveryFlow(): boolean {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash || '';
  const search = window.location.search || '';
  const searchParams = new URLSearchParams(search);
  return (
    hash.includes('type=recovery') ||
    search.includes('type=recovery') ||
    (window.location.pathname === '/reset-password' && searchParams.has('code'))
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticatedProfile, setAuthenticatedProfile] = useState<User | null>(null);
  const [authContext, setAuthContext] = useState<AuthContextData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [accessDeniedReason, setAccessDeniedReason] = useState<string | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(() =>
    isUrlRecoveryFlow(),
  );
  const [impersonationSession, setImpersonationSession] =
    useState<ImpersonationSession | null>(null);

  const requestCounterRef = useRef(0);
  const explicitSignInInFlightRef = useRef(false);
  const inFlightContextPromiseRef = useRef<Promise<AuthContextResult> | null>(null);

  const clearAuthState = useCallback((denied = false, reason: string | null = null) => {
    clearLegacyUserStorage();
    if (getImpersonationSession()) clearImpersonationSession();
    setAuthenticatedProfile(null);
    setAuthContext(null);
    setImpersonationSession(null);
    setAccessDenied(denied);
    setAccessDeniedReason(reason);
  }, []);

  const fetchAuthoritativeAuthContext = useCallback(async (): Promise<AuthContextResult> => {
    const requestId = ++requestCounterRef.current;
    const run = async (): Promise<AuthContextResult> => {
      try {
        const { data, error } = await supabase.rpc('get_my_auth_context');

        if (requestId !== requestCounterRef.current) {
          if (inFlightContextPromiseRef.current) {
            return await inFlightContextPromiseRef.current;
          }
          return { authenticated: false, reason: 'superseded', superseded: true };
        }

        if (error) {
          clearAuthState(true, 'auth_context_error');
          return { authenticated: false, reason: 'auth_context_error' };
        }

        const payload = data as
          | (AuthContextData & { reason?: string })
          | { authenticated: false; reason?: string }
          | null;

        if (!payload || payload.authenticated !== true) {
          const reason = payload?.reason ?? 'unprovisioned';
          const isUnauth = reason === 'unauthenticated';
          clearAuthState(!isUnauth, isUnauth ? null : reason);
          return { authenticated: false, reason };
        }

        const mappedUser = mapAuthContextToUser(payload);
        if (!mappedUser) {
          clearAuthState(true, 'invalid_profile');
          return { authenticated: false, reason: 'invalid_profile' };
        }

        setLegacyAuthScope(mappedUser.id);
        setAuthContext(payload);
        setAuthenticatedProfile(mappedUser);
        setAccessDenied(false);
        setAccessDeniedReason(null);

        return {
          authenticated: true,
          user: mappedUser,
          context: payload,
        };
      } catch {
        if (requestId !== requestCounterRef.current) {
          if (inFlightContextPromiseRef.current) {
            return await inFlightContextPromiseRef.current;
          }
          return { authenticated: false, reason: 'superseded', superseded: true };
        }
        clearAuthState(true, 'auth_context_error');
        return { authenticated: false, reason: 'auth_context_error' };
      }
    };

    const promise = run();
    inFlightContextPromiseRef.current = promise;
    try {
      return await promise;
    } finally {
      if (inFlightContextPromiseRef.current === promise) {
        inFlightContextPromiseRef.current = null;
      }
    }
  }, [clearAuthState]);

  useEffect(() => {
    clearLegacyUserStorage();
    let mounted = true;
    const pendingTimers: number[] = [];

    const scheduleAsync = (fn: () => Promise<void>) => {
      const timerId = window.setTimeout(() => {
        if (!mounted) return;
        void fn();
      }, 0);
      pendingTimers.push(timerId);
    };

    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!mounted) return;
        if (error || !data.session) {
          clearAuthState(false, null);
          setIsLoading(false);
          return;
        }
        await fetchAuthoritativeAuthContext();
      } catch {
        if (mounted) {
          clearAuthState(false, null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      } else if (event === 'SIGNED_OUT') {
        setIsPasswordRecovery(false);
      }

      if (!session || event === 'SIGNED_OUT') {
        requestCounterRef.current += 1;
        clearAuthState(false, null);
        setIsLoading(false);
        return;
      }

      // Avoid competing with an explicit signInWithPassword() call; it performs
      // the single authoritative context fetch for that sign-in.
      if (event === 'SIGNED_IN' && explicitSignInInFlightRef.current) {
        return;
      }

      if (
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED' ||
        event === 'PASSWORD_RECOVERY'
      ) {
        scheduleAsync(async () => {
          await fetchAuthoritativeAuthContext();
          if (mounted) setIsLoading(false);
        });
      }
    });

    return () => {
      mounted = false;
      pendingTimers.forEach((id) => window.clearTimeout(id));
      subscription.unsubscribe();
    };
  }, [clearAuthState, fetchAuthoritativeAuthContext]);

  useEffect(() => {
    // Browser-only impersonation is temporarily disabled; safely invalidate any
    // existing impersonation session on initialization or account change.
    if (getImpersonationSession()) clearImpersonationSession();
    setImpersonationSession(null);
  }, [authenticatedProfile?.id, authContext?.user_scope]);

  // Deprecated stub: local objects can never authenticate a user.
  const login = useCallback((_userData: User) => {
    clearLegacyUserStorage();
  }, []);

  const signInWithPassword = useCallback(
    async (
      email: string,
      password: string,
      deviceInfo?: string,
    ): Promise<SignInResult> => {
      clearLegacyUserStorage();
      setIsPasswordRecovery(false);
      explicitSignInInFlightRef.current = true;

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error || !data.session) {
          return {
            ok: false,
            error: mapSignInErrorMessage(error?.message),
          };
        }

        let ctxResult = await fetchAuthoritativeAuthContext();
        if (ctxResult.superseded && inFlightContextPromiseRef.current) {
          ctxResult = await inFlightContextPromiseRef.current;
        }

        // Best-effort login history event; do not block sign-in if logging fails.
        void Promise.resolve(
          supabase.rpc('record_my_login_event', {
            p_client_reported_device: deviceInfo ?? null,
          }),
        ).catch(() => undefined);

        if (ctxResult.superseded) {
          return { ok: false, reason: 'superseded' };
        }

        if (!ctxResult.authenticated || !ctxResult.user || !ctxResult.context) {
          await supabase.auth.signOut().catch(() => undefined);
          clearAuthState(false, null);
          return {
            ok: false,
            reason: ctxResult.reason ?? 'unprovisioned',
          };
        }

        return {
          ok: true,
          user: ctxResult.user,
          userScope: ctxResult.context.user_scope,
        };
      } catch (err) {
        await supabase.auth.signOut().catch(() => undefined);
        clearAuthState(false, null);
        const msg = err instanceof Error ? err.message : undefined;
        return {
          ok: false,
          error: mapSignInErrorMessage(msg),
        };
      } finally {
        explicitSignInInFlightRef.current = false;
      }
    },
    [clearAuthState, fetchAuthoritativeAuthContext],
  );

  const logout = useCallback(async () => {
    requestCounterRef.current += 1;
    explicitSignInInFlightRef.current = false;
    setIsPasswordRecovery(false);
    clearAuthState(false, null);
    try {
      await supabase.auth.signOut();
    } catch {
      // State is already cleared locally
    }
  }, [clearAuthState]);

  const originalUser = authenticatedProfile;
  const effectiveUser = impersonationSession?.impersonatedUser ?? originalUser;
  const isImpersonating = Boolean(impersonationSession);
  const isNidoAdmin = effectiveUser?.userType === 'nido_admin';
  const isClientPortalUser =
    effectiveUser?.userType === 'client_admin' ||
    effectiveUser?.userType === 'client_user';

  const beginImpersonation = useCallback(
    (_target: User) => {
      // Temporarily disabled until server-side impersonation is implemented.
      // Only System Owners or internal users with `client_user_impersonation.manage`
      // will be permitted to use server-backed impersonation once available.
      return false;
    },
    [],
  );

  const endImpersonation = useCallback(() => {
    clearImpersonationSession();
    setImpersonationSession(null);
  }, []);

  const hasClientPortalPermission = useCallback(
    (moduleKey: string, action: ActionKey = 'view'): boolean => {
      if (isLoading || !authenticatedProfile || isImpersonating) return false;
      if (!authContext || authContext.user_scope !== 'client_portal') {
        return false;
      }

      const perms = authContext.permissions ?? {};
      const modulePerms = findNormalizedModulePermissions(perms, moduleKey);
      return Boolean(modulePerms?.[action]);
    },
    [isLoading, authenticatedProfile, isImpersonating, authContext],
  );

  const value = useMemo<AuthContextType>(
    () => ({
      isAuthenticated: Boolean(authenticatedProfile),
      user: effectiveUser,
      currentAuthenticatedUser: originalUser,
      login,
      logout,
      isLoading,
      accessDenied,
      accessDeniedReason,
      isPasswordRecovery,
      authContext,
      signInWithPassword,
      refreshAuthContext: fetchAuthoritativeAuthContext,
      hasClientPortalPermission,
      isNidoAdmin,
      isClientPortalUser,
      originalUser,
      effectiveUser,
      isImpersonating,
      impersonationSession,
      startImpersonation: beginImpersonation,
      endImpersonation,
    }),
    [
      authenticatedProfile,
      effectiveUser,
      originalUser,
      login,
      logout,
      isLoading,
      accessDenied,
      accessDeniedReason,
      isPasswordRecovery,
      authContext,
      signInWithPassword,
      fetchAuthoritativeAuthContext,
      hasClientPortalPermission,
      isNidoAdmin,
      isClientPortalUser,
      isImpersonating,
      impersonationSession,
      beginImpersonation,
      endImpersonation,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
