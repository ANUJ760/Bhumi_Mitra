'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, UserRole } from './types';
import { apiGet, setToken as setLocalToken, clearToken as clearLocalToken } from './api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function initAuth() {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await apiGet<User>('/auth/me');
          setUser(userData);
        } catch (error) {
          console.error('Failed to authenticate:', error);
          clearLocalToken();
        }
      }
      setIsLoading(false);
    }

    initAuth();
  }, []);

  const login = (token: string, userData: User) => {
    setLocalToken(token);
    setUser(userData);
  };

  const logout = () => {
    clearLocalToken();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: UserRole[] }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-gray-500">Loading authentication...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col h-screen items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-bold text-gray-800">Access Restricted</h2>
        <p className="text-gray-500 max-w-md">Your current account role ({user.role}) does not have permission to access this page.</p>
      </div>
    );
  }

  return <>{children}</>;
}

export function hasRole(user: User | null, ...roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}
