'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserProfile } from '@/types';
import { api } from '@/lib/api';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isVerified: boolean;
  loginDemo: (emailOrId: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isVerified: false,
  loginDemo: async () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('campusswap_token') : null;
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const profile = await api.getMe();
      setUser(profile);
    } catch (err) {
      console.warn('Failed to fetch user session:', err);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('campusswap_token');
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const loginDemo = async (emailOrId: string) => {
    setLoading(true);
    try {
      await api.loginDemo(emailOrId);
      await refreshUser();
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('campusswap_token');
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isVerified: !!user?.is_verified,
        loginDemo,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
