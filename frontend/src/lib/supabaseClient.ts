import { createClient } from '@supabase/supabase-js';
import { validateEmail } from './emailValidation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function signInWithGoogle() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    console.warn('Supabase URL not configured. Using demo auth workflow.');
    return { error: new Error('Supabase not configured. Please use Demo Login below.') };
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/onboarding` : undefined,
    },
  });

  return { data, error };
}

/**
 * Sends a one-time login code / magic link with strict email pre-validation.
 * Prevents invalid addresses from ever triggering Supabase email dispatches (eliminating bounces).
 */
export async function signInWithEmailOtp(email: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }

  const validation = validateEmail(email);
  if (!validation.isValid) {
    return { data: null, error: new Error(validation.error || 'Invalid email address format.') };
  }

  const { data, error } = await supabase.auth.signInWithOtp({
    email: validation.sanitizedEmail,
    options: {
      emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/onboarding` : undefined,
    },
  });

  return { data, error };
}

/**
 * Verifies a 6-digit OTP code against Supabase Auth.
 */
export async function verifyEmailOtp(email: string, token: string) {
  const validation = validateEmail(email);
  const cleanEmail = validation.isValid ? validation.sanitizedEmail : email.trim().toLowerCase();
  const cleanToken = token.trim();

  const { data, error } = await supabase.auth.verifyOtp({
    email: cleanEmail,
    token: cleanToken,
    type: 'email',
  });
  return { data, error };
}

/**
 * Resends verification email / OTP with validation.
 */
export async function resendVerificationOtp(email: string) {
  return signInWithEmailOtp(email);
}

/**
 * Dispatches a password reset link with strict email pre-validation.
 */
export async function resetPasswordForEmail(email: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
    return { data: null, error: new Error('Supabase is not configured.') };
  }

  const validation = validateEmail(email);
  if (!validation.isValid) {
    return { data: null, error: new Error(validation.error || 'Invalid email address format.') };
  }

  const { data, error } = await supabase.auth.resetPasswordForEmail(validation.sanitizedEmail, {
    redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/onboarding` : undefined,
  });

  return { data, error };
}
