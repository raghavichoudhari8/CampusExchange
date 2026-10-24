'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { UserProfile } from '@/types';
import { api, getStoredToken } from '@/lib/api';
import { supabase } from '@/lib/supabaseClient';

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
      let token = getStoredToken();
      if (!token && typeof window !== 'undefined') {
        // Retrieve session directly from Supabase JS client
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          token = session.access_token;
          localStorage.setItem('campusswap_token', token);
        }
      }

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
    // 1. Initial user check
    refreshUser();

    // 2. Listen to Supabase auth state changes (e.g. Google OAuth redirect, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.access_token) {
        localStorage.setItem('campusswap_token', session.access_token);
        try {
          const profile = await api.getMe();
          setUser(profile);
        } catch (_) {}
      } else if (event === 'SIGNED_OUT') {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('campusswap_token');
        }
        setUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
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

  const logout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('campusswap_token');
    }
    try {
      await supabase.auth.signOut();
    } catch (_) {}
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
