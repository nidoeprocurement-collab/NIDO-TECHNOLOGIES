'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getImpersonationSession,
  startImpersonation as createImpersonationSession,
  endImpersonation as clearImpersonationSession,
  type ImpersonationSession,
} from '@/lib/impersonationStore';

export type UserType = 'nido_admin' | 'client_admin' | 'client_user';

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

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  /** The identity that authenticated, never the impersonated effective user. */
  currentAuthenticatedUser: User | null;
  /** Local prototype session; stored in this browser only. */
  login: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
  accessDenied: boolean;
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

function parseProfile(value: unknown): User | null {
  if (!value || typeof value !== 'object') return null;
  const profile = value as Partial<User>;
  if (
    typeof profile.id !== 'string' ||
    typeof profile.email !== 'string' ||
    typeof profile.name !== 'string' ||
    typeof profile.role !== 'string' ||
    !['nido_admin', 'client_admin', 'client_user'].includes(
      String(profile.userType),
    )
  ) {
    return null;
  }
  if (
    profile.userType !== 'nido_admin' &&
    (typeof profile.clientId !== 'string' || !profile.clientId)
  ) {
    return null;
  }
  return profile as User;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticatedProfile, setAuthenticatedProfile] = useState<User | null>(() => {
    try {
      return parseProfile(JSON.parse(localStorage.getItem('nido_user') || 'null'));
    } catch {
      return null;
    }
  });
  const [isLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [impersonationSession, setImpersonationSession] =
    useState<ImpersonationSession | null>(null);

  useEffect(() => {
    if (!authenticatedProfile) {
      if (getImpersonationSession()) clearImpersonationSession();
      setImpersonationSession(null);
      return;
    }

    const stored = getImpersonationSession();
    if (
      stored &&
      authenticatedProfile.userType === 'nido_admin' &&
      stored.originalUser.id === authenticatedProfile.id
    ) {
      setImpersonationSession(stored);
    } else {
      if (stored) clearImpersonationSession();
      setImpersonationSession(null);
    }
  }, [authenticatedProfile?.id, authenticatedProfile?.userType]);

  const login = useCallback((userData: User) => {
    const profile = parseProfile({ ...userData, role: userData.role || '' });
    if (!profile) return;
    localStorage.setItem('nido_user', JSON.stringify(profile));
    setAuthenticatedProfile(profile);
    setAccessDenied(false);
  }, []);

  const logout = useCallback(() => {
    if (impersonationSession) clearImpersonationSession();
    setAuthenticatedProfile(null);
    setImpersonationSession(null);
    setAccessDenied(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nido_user');
    }
  }, [impersonationSession]);

  const originalUser = authenticatedProfile;
  const effectiveUser = impersonationSession?.impersonatedUser ?? originalUser;
  const isImpersonating = Boolean(impersonationSession);
  const isNidoAdmin = effectiveUser?.userType === 'nido_admin';
  const isClientPortalUser =
    effectiveUser?.userType === 'client_admin' ||
    effectiveUser?.userType === 'client_user';

  const beginImpersonation = useCallback(
    (target: User) => {
      if (
        !originalUser ||
        originalUser.userType !== 'nido_admin' ||
        isImpersonating
      ) {
        return false;
      }
      const session = createImpersonationSession(originalUser, target);
      if (!session) return false;
      setImpersonationSession(session);
      return true;
    },
    [originalUser, isImpersonating],
  );

  const endImpersonation = useCallback(() => {
    clearImpersonationSession();
    setImpersonationSession(null);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      isAuthenticated: Boolean(authenticatedProfile),
      user: effectiveUser,
      currentAuthenticatedUser: originalUser,
      login,
      logout,
      isLoading,
      accessDenied,
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
