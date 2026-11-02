'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import {
  signInWithGoogle,
  signInWithEmailOtp,
  verifyEmailOtp,
  resetPasswordForEmail,
} from '@/lib/supabaseClient';
import { validateEmail } from '@/lib/emailValidation';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Mail,
  KeyRound,
  GraduationCap,
  ArrowRight,
  Loader2,
  Sparkles,
  Clock,
  RefreshCw,
  HelpCircle,
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
  const [emailTypoSuggestion, setEmailTypoSuggestion] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [submittingAuth, setSubmittingAuth] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [rateLimitHit, setRateLimitHit] = useState(false);
  const [authMessage, setAuthMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Recovery state
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryCooldown, setRecoveryCooldown] = useState(0);
  const [recoverySubmitting, setRecoverySubmitting] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Google OAuth state
  const [oauthLoading, setOauthLoading] = useState(false);

  // Ref locks to synchronously prevent double-click race conditions
  const isSubmittingRef = useRef(false);
  const isRecoverySubmittingRef = useRef(false);

  // 60-Second Cooldown Timer for OTP Email
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  // 60-Second Cooldown Timer for Password Recovery Email
  useEffect(() => {
    if (recoveryCooldown <= 0) return;
    const interval = setInterval(() => {
      setRecoveryCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [recoveryCooldown]);

  // Handle email input change with real-time typo detection
  const handleEmailChange = (val: string) => {
    setAuthEmail(val);
    if (val.includes('@') && val.length > 5) {
      const result = validateEmail(val);
      if (result.suggestion && result.suggestion !== val.toLowerCase().trim()) {
        setEmailTypoSuggestion(result.suggestion);
      } else {
        setEmailTypoSuggestion(null);
      }
    } else {
      setEmailTypoSuggestion(null);
    }
  };

  const applyTypoSuggestion = () => {
    if (emailTypoSuggestion) {
      setAuthEmail(emailTypoSuggestion);
      setEmailTypoSuggestion(null);
    }
  };

  const handleDomainCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = checkEmail.trim().toLowerCase();
    if (!clean) return;

    const validation = validateEmail(clean);
    if (!validation.isValid) {
      setDomainCheckResult({
        is_allowed: false,
        reason: validation.error || 'Please enter a valid email format.',
      });
      return;
    }

    setCheckingDomain(true);
    setDomainCheckResult(null);
    try {
      const res = await api.checkDomain(validation.sanitizedEmail);
      setDomainCheckResult(res);
      if (res.is_allowed) {
        setAuthEmail(validation.sanitizedEmail);
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

  const handleInstitutionalLogin = async (emailToUse?: string) => {
    const raw = emailToUse || authEmail || checkEmail;
    const validation = validateEmail(raw);
    if (!validation.isValid) {
      setAuthMessage({ type: 'error', text: validation.error || 'Please enter a valid college or Google email.' });
      return;
    }

    setSubmittingAuth(true);
    setAuthMessage(null);
    try {
      await api.institutionalLogin(validation.sanitizedEmail);
      await refreshUser();
      router.push('/marketplace');
    } catch (err: any) {
      setAuthMessage({ type: 'error', text: err.message || 'Institutional login failed.' });
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Prevent double-clicking or rapid resubmissions
    if (isSubmittingRef.current || submittingAuth || cooldownSeconds > 0) {
      return;
    }

    const validation = validateEmail(authEmail);
    if (!validation.isValid) {
      setAuthMessage({ type: 'error', text: validation.error || 'Please enter a valid email address.' });
      return;
    }

    const cleanEmail = validation.sanitizedEmail;
    setAuthEmail(cleanEmail);
    setEmailTypoSuggestion(null);

    isSubmittingRef.current = true;
    setSubmittingAuth(true);
    setAuthMessage(null);
    setRateLimitHit(false);

    try {
      const { error } = await signInWithEmailOtp(cleanEmail);
      if (error) {
        const errorLower = error.message.toLowerCase();
        const isRateLimit = errorLower.includes('rate limit');
        const isDeliveryOrBounce =
          errorLower.includes('bounce') ||
          errorLower.includes('delivery') ||
          errorLower.includes('invalid') ||
          errorLower.includes('could not deliver');

        if (isRateLimit) {
          setRateLimitHit(true);
          setAuthMessage({
            type: 'error',
            text: 'Supabase email rate limit reached (free tier allows max 3 emails/hour). Please use Google Sign In or Instant Login below.',
          });
        } else if (isDeliveryOrBounce) {
          setAuthMessage({
            type: 'error',
            text: `Email could not be delivered to "${cleanEmail}". Please check for typos or sign in via Google.`,
          });
        } else {
          setAuthMessage({ type: 'error', text: error.message });
        }
      } else {
        // Confirmation is ONLY set on verified success
        setOtpSent(true);
        setCooldownSeconds(60); // 60s cooldown to prevent bounce spam
        setAuthMessage({
          type: 'success',
          text: `Verification code sent to ${cleanEmail}. Please check your inbox.`,
        });
      }
    } catch (err: any) {
      setAuthMessage({ type: 'error', text: err.message || 'Failed to send login code. Please try again.' });
    } finally {
      setSubmittingAuth(false);
      isSubmittingRef.current = false;
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = otpCode.trim();
    if (!cleanCode) {
      setAuthMessage({ type: 'error', text: 'Please enter the 6-digit verification code.' });
      return;
    }

    setSubmittingAuth(true);
    setAuthMessage(null);
    try {
      const { data, error } = await verifyEmailOtp(authEmail.trim(), cleanCode);
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

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRecoverySubmittingRef.current || recoverySubmitting || recoveryCooldown > 0) {
      return;
    }

    const validation = validateEmail(recoveryEmail);
    if (!validation.isValid) {
      setRecoveryMessage({ type: 'error', text: validation.error || 'Please enter a valid email address.' });
      return;
    }

    const cleanEmail = validation.sanitizedEmail;
    setRecoveryEmail(cleanEmail);

    isRecoverySubmittingRef.current = true;
    setRecoverySubmitting(true);
    setRecoveryMessage(null);

    try {
      const { error } = await resetPasswordForEmail(cleanEmail);
      if (error) {
        setRecoveryMessage({ type: 'error', text: error.message });
      } else {
        setRecoveryCooldown(60); // 60s cooldown for password recovery
        setRecoveryMessage({
          type: 'success',
          text: `Password reset instructions sent to ${cleanEmail}. Check your inbox.`,
        });
      }
    } catch (err: any) {
      setRecoveryMessage({ type: 'error', text: err.message || 'Failed to send recovery email.' });
    } finally {
      setRecoverySubmitting(false);
      isRecoverySubmittingRef.current = false;
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
          Welcome to CampusSwap
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 max-w-sm mx-auto">
          Sign in with your Google account or college email to buy, sell, and connect across campus.
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

          {rateLimitHit && (
            <div className="p-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-2xl border border-indigo-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span>Instant Account Login</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Supabase email hourly quota was reached. You can sign in immediately with Google or enter directly using Fast-Track Login:
              </p>
              <button
                type="button"
                onClick={() => handleInstitutionalLogin()}
                disabled={submittingAuth}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-indigo-100 disabled:opacity-50"
              >
                {submittingAuth ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                Verify &amp; Enter CampusSwap &rarr;
              </button>
            </div>
          )}

          {/* Google / Gmail Sign In */}
          <div>
            <button
              onClick={handleGoogleSignIn}
              type="button"
              disabled={oauthLoading}
              className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-slate-300 rounded-xl shadow-sm bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition disabled:opacity-50"
            >
              {oauthLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              Sign in with Google (Any Google / Gmail account)
            </button>
            <p className="text-center text-[11px] text-slate-500 mt-2 font-medium">
              Everyone can sign in instantly using any Google or Gmail account
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-semibold">
                Or Sign In with Email OTP
              </span>
            </div>
          </div>

          {/* Email OTP Flow */}
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address (Gmail or College Email)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="yourname@gmail.com or student@pict.edu"
                    value={authEmail}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className="block w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Inline Typo Suggestion to Prevent Bounced Emails */}
                {emailTypoSuggestion && (
                  <div className="mt-1.5 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center justify-between gap-2">
                    <span className="truncate">
                      Did you mean <strong>{emailTypoSuggestion}</strong>?
                    </span>
                    <button
                      type="button"
                      onClick={applyTypoSuggestion}
                      className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[10px] flex-shrink-0"
                    >
                      Use this
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submittingAuth || cooldownSeconds > 0}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50"
              >
                {submittingAuth ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Sending Login Code...
                  </>
                ) : cooldownSeconds > 0 ? (
                  <>
                    <Clock className="w-3.5 h-3.5" />
                    Resend Code in {cooldownSeconds}s
                  </>
                ) : (
                  <>Send Login Code &rarr;</>
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
                    onChange={(e) => setOtpCode(e.target.value.trim())}
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
                  <>Verify &amp; Continue &rarr;</>
                )}
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={submittingAuth || cooldownSeconds > 0}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold disabled:text-slate-400 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${submittingAuth ? 'animate-spin' : ''}`} />
                  {cooldownSeconds > 0 ? `Resend in ${cooldownSeconds}s` : 'Resend Verification Code'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtpCode('');
                    setAuthMessage(null);
                  }}
                  className="text-slate-500 hover:text-indigo-600 font-semibold"
                >
                  Change email
                </button>
              </div>
            </form>
          )}

          {/* Password Recovery Toggle */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => {
                setShowPasswordRecovery(!showPasswordRecovery);
                setRecoveryMessage(null);
              }}
              className="text-xs text-slate-500 hover:text-indigo-600 font-medium inline-flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              {showPasswordRecovery ? 'Hide Password Recovery' : 'Forgot password or need account recovery?'}
            </button>

            {showPasswordRecovery && (
              <form onSubmit={handlePasswordRecovery} className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-2">
                <p className="text-[11px] text-slate-600 font-medium">
                  Enter your email to receive a password reset / recovery link:
                </p>
                {recoveryMessage && (
                  <div
                    className={`p-2 rounded-lg text-xs ${
                      recoveryMessage.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {recoveryMessage.text}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="yourname@gmail.com or student@college.edu"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={recoverySubmitting || recoveryCooldown > 0}
                    className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900 transition flex-shrink-0 disabled:opacity-50"
                  >
                    {recoverySubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : recoveryCooldown > 0 ? (
                      `${recoveryCooldown}s`
                    ) : (
                      'Send Link'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Institutional Domain Verification Utility */}
          <div className="bg-indigo-50/60 rounded-xl p-4 border border-indigo-100">
            <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Check Your Email Domain
            </h3>
            <form onSubmit={handleDomainCheck} className="flex gap-2">
              <input
                type="email"
                placeholder="yourname@gmail.com or student@pict.edu"
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
                  <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Approved Domain!</p>
                        <p className="text-[11px] text-emerald-700">
                          {domainCheckResult.college_name || 'Verified Google Account / Higher-Ed Institution'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleInstitutionalLogin(checkEmail)}
                      disabled={submittingAuth}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs transition disabled:opacity-50"
                    >
                      {submittingAuth ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      )}
                      Instant Login with this Email &rarr;
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 bg-rose-50 text-rose-800 rounded-lg border border-rose-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Domain Not Allowed</p>
                      <p className="text-[11px] text-rose-700">
                        {domainCheckResult.reason || 'Please use a Google account (@gmail.com) or an official college email address.'}
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
