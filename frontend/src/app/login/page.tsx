'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { signInWithGoogle, signInWithEmailOtp, verifyEmailOtp } from '@/lib/supabaseClient';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Mail,
  KeyRound,
  GraduationCap,
  ArrowRight,
  Loader2,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  // Domain Checker state
  const [checkEmail, setCheckEmail] = useState('');
  const [checkingDomain, setCheckingDomain] = useState(false);
  const [domainCheckResult, setDomainCheckResult] = useState<any>(null);

  // Email OTP / Magic Link state
  const [authEmail, setAuthEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [submittingAuth, setSubmittingAuth] = useState(false);
  const [authMessage, setAuthMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Google OAuth state
  const [oauthLoading, setOauthLoading] = useState(false);

  const handleDomainCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkEmail || !checkEmail.includes('@')) return;
    setCheckingDomain(true);
    setDomainCheckResult(null);
    try {
      const res = await api.checkDomain(checkEmail);
      setDomainCheckResult(res);
      if (res.is_allowed) {
        setAuthEmail(checkEmail);
      }
    } catch (err: any) {
      setDomainCheckResult({
        is_allowed: false,
        reason: err.message || 'Error checking domain',
      });
    } finally {
      setCheckingDomain(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthMessage(null);
    setOauthLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setAuthMessage({ type: 'error', text: error.message });
      }
    } catch (err: any) {
      setAuthMessage({ type: 'error', text: err.message || 'Failed to initiate Google sign in.' });
    } finally {
      setOauthLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authEmail.includes('@')) {
      setAuthMessage({ type: 'error', text: 'Please enter a valid college email address.' });
      return;
    }

    setSubmittingAuth(true);
    setAuthMessage(null);
    try {
      const { error } = await signInWithEmailOtp(authEmail.trim());
      if (error) {
        setAuthMessage({ type: 'error', text: error.message });
      } else {
        setOtpSent(true);
        setAuthMessage({
          type: 'success',
          text: `Verification code / magic link sent to ${authEmail}. Please check your inbox.`,
        });
      }
    } catch (err: any) {
      setAuthMessage({ type: 'error', text: err.message || 'Failed to send login code.' });
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setAuthMessage({ type: 'error', text: 'Please enter the 6-digit verification code.' });
      return;
    }

    setSubmittingAuth(true);
    setAuthMessage(null);
    try {
      const { data, error } = await verifyEmailOtp(authEmail.trim(), otpCode.trim());
      if (error) {
        setAuthMessage({ type: 'error', text: error.message });
      } else if (data?.session) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('campusswap_token', data.session.access_token);
        }
        await refreshUser();
        router.push('/onboarding');
      } else {
        router.push('/onboarding');
      }
    } catch (err: any) {
      setAuthMessage({ type: 'error', text: err.message || 'Invalid or expired verification code.' });
    } finally {
      setSubmittingAuth(false);
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
          College Verification &amp; Login
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 max-w-sm mx-auto">
          CampusSwap is exclusively for verified college students. Sign in with your official college email.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/60 rounded-2xl border border-slate-200 sm:px-10 space-y-6">
          {authMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                authMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {authMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed font-medium">{authMessage.text}</span>
            </div>
          )}

          {/* Google Workspace / OAuth Sign In */}
          <div>
            <button
              onClick={handleGoogleSignIn}
              type="button"
              disabled={oauthLoading}
              className="w-full flex justify-center items-center gap-3 py-2.5 px-4 border border-slate-300 rounded-xl shadow-sm bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
            >
              {oauthLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              ) : (
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
              )}
              Sign in with Google OAuth
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-semibold">
                Or Sign In with College Email OTP
              </span>
            </div>
          </div>

          {/* Email OTP Flow */}
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Institutional College Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="student@pict.edu or yourname@college.edu"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingAuth}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50"
              >
                {submittingAuth ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Sending Login Code...
                  </>
                ) : (
                  <>
                    Send Login Code &rarr;
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Enter 6-Digit Code sent to {authEmail}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-sm font-mono tracking-widest text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingAuth}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50"
              >
                {submittingAuth ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify &amp; Continue &rarr;
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtpCode('');
                }}
                className="w-full text-center text-xs text-slate-500 hover:text-indigo-600 font-semibold pt-1"
              >
                Use a different email address
              </button>
            </form>
          )}

          {/* Institutional Domain Verification Utility */}
          <div className="bg-indigo-50/60 rounded-xl p-4 border border-indigo-100">
            <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Check Your College Email Domain
            </h3>
            <form onSubmit={handleDomainCheck} className="flex gap-2">
              <input
                type="email"
                placeholder="yourname@pict.edu"
                value={checkEmail}
                onChange={(e) => setCheckEmail(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={checkingDomain}
                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition flex-shrink-0 disabled:opacity-50"
              >
                {checkingDomain ? 'Checking...' : 'Check'}
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
                      <p className="text-[11px] text-emerald-600 mt-1">
                        Use this email in the login form above to receive your verification code.
                      </p>
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
        </div>
      </div>
    </div>
  );
}
