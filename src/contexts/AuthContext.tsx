'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import {
  getImpersonationSession,
  startImpersonation as createImpersonationSession,
  endImpersonation as clearImpersonationSession,
  IMPERSONATION_EVENT,
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
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [impersonationSession, setImpersonationSession] = useState<ImpersonationSession | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('nido_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Back-compat: old sessions without userType default to nido_admin
        if (!parsedUser.userType) parsedUser.userType = 'nido_admin';
        setUser(parsedUser);
        setIsAuthenticated(true);
        const activeImpersonation = getImpersonationSession();
        setImpersonationSession(activeImpersonation);
        if (activeImpersonation) setUser(activeImpersonation.impersonatedUser);
      } catch {
        localStorage.removeItem('nido_user');
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const refresh = () => {
      const active = getImpersonationSession();
      setImpersonationSession(active);
      if (active) {
        setUser(active.impersonatedUser);
      } else {
        try {
          const stored = JSON.parse(localStorage.getItem("nido_user") || "null");
          if (stored) setUser(stored);
        } catch { /* ignore malformed session */ }
      }
    };
    window.addEventListener(IMPERSONATION_EVENT, refresh);
    window.addEventListener("storage", refresh);
    const timer = window.setInterval(refresh, 30_000);
    return () => {
      window.removeEventListener(IMPERSONATION_EVENT, refresh);
      window.removeEventListener("storage", refresh);
      window.clearInterval(timer);
    };
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('nido_user', JSON.stringify(userData));
  };

  const logout = () => {
    if (impersonationSession) clearImpersonationSession();
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('nido_user');
  };

  const originalUser = impersonationSession?.originalUser ?? user;
  const effectiveUser = impersonationSession?.impersonatedUser ?? user;
  const isImpersonating = Boolean(impersonationSession);
  const isNidoAdmin = effectiveUser?.userType === 'nido_admin';
  const isClientPortalUser = effectiveUser?.userType === 'client_admin' || effectiveUser?.userType === 'client_user';
  const beginImpersonation = (target: User) => {
    if (!user || user.userType !== "nido_admin") return false;
    const session = createImpersonationSession(user, target);
    if (!session) return false;
    setImpersonationSession(session);
    setUser(session.impersonatedUser);
    return true;
  };
  const endImpersonation = () => {
    const original = impersonationSession?.originalUser;
    clearImpersonationSession();
    setImpersonationSession(null);
    if (original) setUser(original);
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    login,
    logout,
    isLoading,
    isNidoAdmin,
    isClientPortalUser,
    originalUser,
    effectiveUser,
    isImpersonating,
    impersonationSession,
    startImpersonation: beginImpersonation,
    endImpersonation,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
