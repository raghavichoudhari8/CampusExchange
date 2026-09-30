'use client';

import React, { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { api } from '@/lib/api';
import StatusBadge from './StatusBadge';
import {
  BellRing,
  CheckCircle,
  XCircle,
  ShieldCheck,
  User,
  MapPin,
  MessageSquare,
  X,
} from 'lucide-react';

interface IncomingRequestData {
  request_id: string;
  listing_id: string;
  listing_title: string;
  buyer_name: string;
  buyer_campus?: string;
  buyer_badges: string[];
  message?: string;
  created_at: string;
}

export default function SellerConsentModal() {
  const { subscribe } = useWebSocket();
  const [activeRequest, setActiveRequest] = useState<IncomingRequestData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionDone, setActionDone] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribe('new_contact_request', (data: IncomingRequestData) => {
      setActiveRequest(data);
      setActionDone(null);
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe]);

  if (!activeRequest) return null;

  const handleRespond = async (action: 'approve' | 'decline') => {
    setSubmitting(true);
    try {
      await api.respondToContactRequest(activeRequest.request_id, action);
      setActionDone(action === 'approve' ? 'Approved! Contact details sent to buyer.' : 'Request Declined.');
      setTimeout(() => {
        setActiveRequest(null);
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to process request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-indigo-600">
            <div className="p-2 bg-indigo-50 rounded-xl">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                New Buyer Contact Request!
              </h3>
              <p className="text-xs text-slate-500">Live Seller Consent Alert</p>
            </div>
          </div>
          <button
            onClick={() => setActiveRequest(null)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Listing Title */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            For Your Item:
          </span>
          <span className="text-sm font-bold text-slate-900 line-clamp-1 mt-0.5">
            {activeRequest.listing_title}
          </span>
        </div>

        {/* Buyer Identity Profile */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
            Buyer Verification Profile:
          </span>
          <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-200 text-indigo-800 font-bold text-xs flex items-center justify-center">
                  {activeRequest.buyer_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{activeRequest.buyer_name}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {activeRequest.buyer_campus || 'Campus Hub'}
                  </p>
                </div>
              </div>
              <StatusBadge type="verification" value="verified" />
            </div>

            <div className="flex flex-wrap gap-1 pt-1">
              {activeRequest.buyer_badges.map((b) => (
                <StatusBadge key={b} type="badge" value={b} />
              ))}
            </div>

            {activeRequest.message && (
              <div className="pt-2 text-xs text-slate-700 bg-white/80 p-2.5 rounded-xl border border-indigo-100/60 flex items-start gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <span>&ldquo;{activeRequest.message}&rdquo;</span>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Accepting this request will decrypt and share your designated contact method exclusively with this student. Declining will reject the request without exposing anything.
        </p>

        {actionDone ? (
          <div className="p-3 bg-emerald-50 text-emerald-800 text-center rounded-xl text-xs font-bold border border-emerald-200">
            {actionDone}
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => handleRespond('decline')}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition disabled:opacity-50"
            >
              Decline Request
            </button>
            <button
              onClick={() => handleRespond('approve')}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              {submitting ? 'Sharing...' : 'Accept & Share Contact'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
