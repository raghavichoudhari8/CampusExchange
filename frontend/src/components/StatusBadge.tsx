import React from 'react';
import { CheckCircle2, Clock, ShieldAlert, Award, Sparkles, Building, User } from 'lucide-react';
import { ListingCondition, ListingStatus } from '@/types';

interface StatusBadgeProps {
  type: 'condition' | 'status' | 'badge' | 'verification';
  value: string;
  className?: string;
}

export default function StatusBadge({ type, value, className = '' }: StatusBadgeProps) {
  if (type === 'verification') {
    if (value === 'verified') {
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 ${className}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Verified Student
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 ${className}`}>
        <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
        Unverified Account
      </span>
    );
  }

  if (type === 'condition') {
    const conditionLabels: Record<string, { label: string; style: string }> = {
      brand_new: { label: 'Brand New', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      like_new: { label: 'Like New', style: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      good: { label: 'Good', style: 'bg-blue-50 text-blue-700 border-blue-200' },
      fair: { label: 'Fair', style: 'bg-amber-50 text-amber-700 border-amber-200' },
    };
    const c = conditionLabels[value] || { label: value, style: 'bg-slate-100 text-slate-700 border-slate-200' };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${c.style} ${className}`}>
        {c.label}
      </span>
    );
  }

  if (type === 'status') {
    const statusStyles: Record<string, { label: string; style: string }> = {
      active: { label: 'Active', style: 'bg-emerald-100 text-emerald-800' },
      reserved: { label: 'Reserved', style: 'bg-amber-100 text-amber-800' },
      sold: { label: 'Sold', style: 'bg-slate-200 text-slate-700' },
      expired: { label: 'Expired', style: 'bg-red-100 text-red-800' },
      flagged: { label: 'Under Review', style: 'bg-rose-100 text-rose-800' },
    };
    const s = statusStyles[value] || { label: value, style: 'bg-slate-100 text-slate-800' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.style} ${className}`}>
        {s.label}
      </span>
    );
  }

  // Trust Badges
  let icon = <Award className="w-3 h-3 text-indigo-500" />;
  if (value.includes('Quick Responder')) icon = <Clock className="w-3 h-3 text-amber-500" />;
  if (value.includes('Hostel') || value.includes('Resident')) icon = <Building className="w-3 h-3 text-cyan-600" />;
  if (value.includes('Batch')) icon = <Sparkles className="w-3 h-3 text-purple-500" />;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 ${className}`}>
      {icon}
      {value}
    </span>
  );
}
