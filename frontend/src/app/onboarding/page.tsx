'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { Campus } from '@/types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StatusBadge from '@/components/StatusBadge';
import { UserCheck, Building, GraduationCap, Sparkles, Check } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isVerified, refreshUser, loading: authLoading } = useAuth();

  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [campusId, setCampusId] = useState('');
  const [hostelBuilding, setHostelBuilding] = useState('');
  const [batchYear, setBatchYear] = useState<number>(2026);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    api.getCampuses().then(setCampuses).catch(console.error);
  }, []);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || '');
      setCampusId(user.campus_id || (campuses[0]?.id || ''));
      setHostelBuilding(user.hostel_building || '');
      setBatchYear(user.batch_year || 2026);
    }
  }, [user, campuses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !campusId) {
      setError('Please provide your display name and campus.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.updateOnboarding({
        display_name: displayName.trim(),
        campus_id: campusId,
        hostel_building: hostelBuilding.trim() || undefined,
        batch_year: Number(batchYear),
      });
      await refreshUser();
      setSavedSuccess(true);
      setTimeout(() => {
        router.push('/marketplace');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Student Profile Onboarding
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Set up your public campus identity. Sensitive personal information remains encrypted and hidden.
            </p>
          </div>

          {user && (
            <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Linked Student Email</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{user.email}</p>
              </div>
              <StatusBadge
                type="verification"
                value={user.is_verified ? 'verified' : 'unverified'}
              />
            </div>
          )}

          {!isVerified && user && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              <strong>Notice:</strong> Your current email domain (<span className="font-mono">@{user.domain}</span>) is not an approved institutional domain. You can browse public listings, but you will not be able to post items or request contact details until you log in with an approved college email.
            </div>
          )}

          {error && (
            <div className="mb-6 p-3 bg-rose-50 text-rose-700 text-xs font-medium rounded-lg border border-rose-200">
              {error}
            </div>
          )}

          {savedSuccess && (
            <div className="mb-6 p-3 bg-emerald-50 text-emerald-800 text-xs font-medium rounded-lg border border-emerald-200 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              Profile updated successfully! Redirecting to marketplace...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Display Name (Visible to other students)
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex Chen"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Campus / Micro-Hub
              </label>
              <select
                value={campusId}
                onChange={(e) => setCampusId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              >
                <option value="">Select your campus</option>
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.city})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Local listings near your campus will be prioritized.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Hostel / Residence Hall
                </label>
                <input
                  type="text"
                  value={hostelBuilding}
                  onChange={(e) => setHostelBuilding(e.target.value)}
                  placeholder="e.g. Hostel 4 / Next House"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Graduation / Batch Year
                </label>
                <select
                  value={batchYear}
                  onChange={(e) => setBatchYear(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                >
                  {[2024, 2025, 2026, 2027, 2028, 2029].map((yr) => (
                    <option key={yr} value={yr}>
                      Class of {yr}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition shadow-sm disabled:opacity-50"
              >
                {submitting ? 'Saving Profile...' : 'Complete Profile'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
