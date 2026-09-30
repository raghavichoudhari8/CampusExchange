'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { signInWithGoogle } from '@/lib/supabaseClient';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { loginDemo } = useAuth();
  const [checkEmail, setCheckEmail] = useState('');
  const [checking, setChecking] = useState(false);
  const [domainCheckResult, setDomainCheckResult] = useState<any>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);

  const handleDomainCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkEmail || !checkEmail.includes('@')) return;
    setChecking(true);
    setDomainCheckResult(null);
    try {
      const res = await api.checkDomain(checkEmail);
      setDomainCheckResult(res);
    } catch (err: any) {
      setDomainCheckResult({
        is_allowed: false,
        reason: err.message || 'Error checking domain',
      });
    } finally {
      setChecking(false);
    }
  };

  const handleDemoLogin = async (email: string) => {
    await loginDemo(email);
    router.push('/marketplace');
  };

  const handleGoogleSignIn = async () => {
    setOauthError(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setOauthError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
            <GraduationCap className="w-7 h-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Student Verification & Login
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 max-w-sm mx-auto">
          CampusSwap is exclusively for verified college students. We verify your institutional email domain before access.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/60 rounded-2xl border border-slate-200 sm:px-10 space-y-6">
          {/* Institutional Domain Checker */}
          <div className="bg-indigo-50/60 rounded-xl p-4 border border-indigo-100">
            <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Check Your College Email Domain
            </h3>
            <form onSubmit={handleDomainCheck} className="flex gap-2">
              <input
                type="email"
                placeholder="yourname@college.edu"
                value={checkEmail}
                onChange={(e) => setCheckEmail(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={checking}
                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition flex-shrink-0 disabled:opacity-50"
              >
                {checking ? 'Checking...' : 'Check'}
              </button>
            </form>

            {domainCheckResult && (
              <div className="mt-3 text-xs">
                {domainCheckResult.is_allowed ? (
                  <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Approved Campus Domain!</p>
                      <p className="text-[11px] text-emerald-700">
                        {domainCheckResult.college_name || 'Accredited Higher-Ed Institution'}
                      </p>
                      <button
                        onClick={() => handleDemoLogin(checkEmail)}
                        className="mt-1.5 text-indigo-600 font-semibold underline text-[11px] hover:text-indigo-800"
                      >
                        Proceed to Login with this email &rarr;
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 bg-rose-50 text-rose-800 rounded-lg border border-rose-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Domain Not Allowed</p>
                      <p className="text-[11px] text-rose-700">
                        {domainCheckResult.reason || 'Only official college email addresses (.edu, .ac.in) are permitted.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Google Sign In */}
          <div>
            <button
              onClick={handleGoogleSignIn}
              type="button"
              className="w-full flex justify-center items-center gap-3 py-2.5 px-4 border border-slate-300 rounded-xl shadow-sm bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Sign in with Google OAuth
            </button>
            {oauthError && (
              <p className="mt-2 text-xs text-rose-600 text-center">{oauthError}</p>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-semibold">
                Or Instant Demo Access
              </span>
            </div>
          </div>

          {/* Quick Demo Role Switcher */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 text-center">
              Click any demo persona to test roles immediately:
            </p>

            <button
              onClick={() => handleDemoLogin('alex.chen@mit.edu')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition text-left"
            >
              <div>
                <p className="text-xs font-semibold text-slate-900">Alex Chen (Verified Student)</p>
                <p className="text-[11px] text-slate-500">alex.chen@mit.edu &bull; Next House</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                Verified
              </span>
            </button>

            <button
              onClick={() => handleDemoLogin('priya.sharma@iitb.ac.in')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition text-left"
            >
              <div>
                <p className="text-xs font-semibold text-slate-900">Priya Sharma (Verified Student)</p>
                <p className="text-[11px] text-slate-500">priya.sharma@iitb.ac.in &bull; Hostel 12</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                Verified
              </span>
            </button>

            <button
              onClick={() => handleDemoLogin('unverified.user@gmail.com')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition text-left"
            >
              <div>
                <p className="text-xs font-semibold text-slate-900">Guest User (Unverified)</p>
                <p className="text-[11px] text-slate-500">unverified.user@gmail.com &bull; Browse only</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                Unverified
              </span>
            </button>

            <button
              onClick={() => handleDemoLogin('admin@campusswap.edu')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-purple-200 hover:border-purple-400 hover:bg-purple-50/50 transition text-left"
            >
              <div>
                <p className="text-xs font-semibold text-purple-900">Campus Administrator</p>
                <p className="text-[11px] text-slate-500">admin@campusswap.edu &bull; Moderation & Logs</p>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold">
                Admin RBAC
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
