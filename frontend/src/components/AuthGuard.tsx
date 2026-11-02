'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { ShieldAlert, UserCheck, ArrowRight } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  fallbackMessage?: string;
}

export default function AuthGuard({
  children,
  fallbackMessage = 'You must be logged in to perform this action. Sign in with your Google account or college email.',
}: AuthGuardProps) {
  const { user, isVerified, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user || !isVerified) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white border border-slate-200 rounded-2xl shadow-sm text-center">
        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Sign In Required
        </h2>
        <p className="text-slate-600 text-sm max-w-md mx-auto mb-6">
          {fallbackMessage} CampusSwap allows students and campus members with a Google account or college email to buy, sell, and connect safely.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition shadow-sm"
          >
            <UserCheck className="w-4 h-4" />
            Sign In with Google / Email
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
