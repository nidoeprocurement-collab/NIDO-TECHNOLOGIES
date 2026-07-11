'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('nido_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Back-compat: old sessions without userType default to nido_admin
        if (!parsedUser.userType) parsedUser.userType = 'nido_admin';
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch {
        localStorage.removeItem('nido_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('nido_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('nido_user');
  };

  const isNidoAdmin = user?.userType === 'nido_admin';
  const isClientPortalUser = user?.userType === 'client_admin' || user?.userType === 'client_user';

  const value: AuthContextType = {
    isAuthenticated,
    user,
    login,
    logout,
    isLoading,
    isNidoAdmin,
    isClientPortalUser,
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
