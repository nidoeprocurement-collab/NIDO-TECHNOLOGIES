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
import { useClerk, useUser } from '@clerk/react';
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
  /** Kept for older components; local credentials no longer establish sessions. */
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
  const { isLoaded: clerkLoaded, isSignedIn, user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const [authenticatedProfile, setAuthenticatedProfile] = useState<User | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [impersonationSession, setImpersonationSession] =
    useState<ImpersonationSession | null>(null);

  useEffect(() => {
    if (!clerkLoaded) {
      setIsLoading(true);
      return;
    }

    if (!isSignedIn || !clerkUser) {
      setAuthenticatedProfile(null);
      setAccessDenied(false);
      setImpersonationSession(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('nido_user');
      }
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setAccessDenied(false);

    fetch('/api/auth/me', { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) {
          if (!cancelled) {
            setAuthenticatedProfile(null);
            setAccessDenied(true);
          }
          return null;
        }
        return parseProfile(await response.json());
      })
      .then((profile) => {
        if (cancelled || !profile) {
          if (!cancelled && !accessDenied) {
            setAuthenticatedProfile(null);
            setAccessDenied(true);
          }
          return;
        }
        setAuthenticatedProfile(profile);
        setAccessDenied(false);
      })
      .catch(() => {
        if (!cancelled) {
          setAuthenticatedProfile(null);
          setAccessDenied(true);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clerkLoaded, isSignedIn, clerkUser?.id]);

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

  const login = useCallback((_userData: User) => {
    // Authentication is controlled by Clerk; this deliberately cannot create a
    // session from localStorage or a browser-supplied user object.
  }, []);

  const logout = useCallback(() => {
    if (impersonationSession) clearImpersonationSession();
    setAuthenticatedProfile(null);
    setImpersonationSession(null);
    setAccessDenied(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nido_user');
    }
    void signOut({ redirectUrl: '/sign-in' });
  }, [impersonationSession, signOut]);

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
