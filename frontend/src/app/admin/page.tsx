'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StatusBadge from '@/components/StatusBadge';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Listing, AuditLog } from '@/types';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  ShoppingBag,
  AlertTriangle,
  FileText,
  CheckCircle,
  Trash2,
  Ban,
  Plus,
  RefreshCw,
  Clock,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const { user, loginDemo } = useAuth();
  const [activeTab, setActiveTab] = useState<'moderation' | 'domains' | 'users' | 'audit'>('moderation');

  // Stats
  const [stats, setStats] = useState<any>(null);
  const [flaggedListings, setFlaggedListings] = useState<Listing[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // New domain form
  const [newDomain, setNewDomain] = useState('');
  const [newCollegeName, setNewCollegeName] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);
  const [runningExpiry, setRunningExpiry] = useState(false);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [s, fList, doms, logs] = await Promise.all([
        api.getAdminStats(),
        api.getFlaggedListings(),
        api.getAllowedDomains(),
        api.getAuditLogs(),
      ]);
      setStats(s);
      setFlaggedListings(fList);
      setDomains(doms);
      setAuditLogs(logs);

      // Fetch users list
      const token = localStorage.getItem('campusswap_token');
      const resUsers = await fetch('http://localhost:8000/api/v1/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resUsers.ok) {
        setUsersList(await resUsers.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdminData();
    }
  }, [user]);

  const handleModerate = async (id: string, action: 'approve' | 'delete') => {
    try {
      await api.moderateListing(id, action);
      await loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Moderation action failed');
    }
  };

  const handleToggleBan = async (userId: string, currentBan: boolean) => {
    try {
      await api.toggleUserBan(userId, !currentBan);
      await loadAdminData();
    } catch (err: any) {
      alert(err.message || 'Ban action failed');
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim() || !newCollegeName.trim()) return;
    setAddingDomain(true);
    try {
      const token = localStorage.getItem('campusswap_token');
      const res = await fetch('http://localhost:8000/api/v1/admin/allowed-domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          domain: newDomain.trim(),
          college_name: newCollegeName.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to add domain');
      }
      setNewDomain('');
      setNewCollegeName('');
      await loadAdminData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAddingDomain(false);
    }
  };

  const handleDeleteDomain = async (id: string) => {
    try {
      const token = localStorage.getItem('campusswap_token');
      await fetch(`http://localhost:8000/api/v1/admin/allowed-domains/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadAdminData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRunExpiryScan = async () => {
    setRunningExpiry(true);
    try {
      const token = localStorage.getItem('campusswap_token');
      const res = await fetch('http://localhost:8000/api/v1/admin/run-expiry-check', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      alert(`Auto-expiry scan complete! Expired ${data.expired_listings} listings. Sent ${data.reminders_sent} reminder emails.`);
      await loadAdminData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRunningExpiry(false);
    }
  };

  // RBAC Access Control Guard
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 max-w-md mx-auto py-20 px-4 text-center">
          <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Privileges Required</h1>
          <p className="text-xs text-slate-500 mt-2 mb-6">
            The Admin Portal is restricted to verified campus moderators and administrators.
          </p>
          <button
            onClick={() => loginDemo('admin@campusswap.edu')}
            className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition"
          >
            Switch to Campus Admin Demo Account
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Admin Header */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/30 text-purple-200 border border-purple-400/30 mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              Role-Based Access Control (Admin)
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Campus Security &amp; Moderation
            </h1>
            <p className="text-xs sm:text-sm text-purple-200 mt-1 max-w-xl">
              Moderate flagged listings, manage institutional email whitelists, ban abusive users, and inspect security audit trails.
            </p>
          </div>

          <button
            onClick={handleRunExpiryScan}
            disabled={runningExpiry}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white font-semibold text-xs border border-purple-400/40 transition flex-shrink-0"
          >
            <Clock className="w-4 h-4" />
            {runningExpiry ? 'Scanning Expiry...' : 'Trigger 30d Expiry Job'}
          </button>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Users</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats.total_users}</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Verified Students</span>
              <p className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.verified_students}</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Active Listings</span>
              <p className="text-2xl font-extrabold text-indigo-600 mt-1">{stats.active_listings}</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Flagged Queue</span>
              <p className="text-2xl font-extrabold text-rose-600 mt-1">{stats.flagged_listings}</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Audit Events</span>
              <p className="text-2xl font-extrabold text-slate-700 mt-1">{stats.total_audit_events}</p>
            </div>
          </div>
        )}

        {/* Admin Tabs */}
        <div className="flex border-b border-slate-200 gap-4 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('moderation')}
            className={`pb-3 px-2 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'moderation'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Flagged Listings Queue ({flaggedListings.length})
          </button>
          <button
            onClick={() => setActiveTab('domains')}
            className={`pb-3 px-2 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'domains'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Allowed College Domains ({domains.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-2 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            User Access &amp; Bans ({usersList.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 px-2 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'audit'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            Security Audit Trail
          </button>
        </div>

        {/* TAB 1: FLAGGED LISTINGS MODERATION QUEUE */}
        {activeTab === 'moderation' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                AI / ML Flagged Queue (Prohibited Items &amp; Spam)
              </h2>
              <p className="text-xs text-slate-500">
                These listings were automatically held from public marketplace browsing because of high spam or prohibited item scores.
              </p>
            </div>

            {flaggedListings.length > 0 ? (
              <div className="space-y-4">
                {flaggedListings.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl border border-rose-200 bg-rose-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-xs">
                          Spam Score: {item.spam_score}
                        </span>
                        <span className="text-xs text-slate-500">
                          Seller: {item.seller_name}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>
                      <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-rose-100 max-w-2xl">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleModerate(item.id, 'approve')}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
                      >
                        Approve &amp; Publish
                      </button>
                      <button
                        onClick={() => handleModerate(item.id, 'delete')}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition"
                      >
                        Delete Listing
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800">Moderation Queue is Clean!</p>
                <p className="text-xs text-slate-400 mt-1">No items currently flagged for review.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ALLOWED COLLEGE DOMAINS */}
        {activeTab === 'domains' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Institutional Email Domain Whitelist
              </h2>
              <p className="text-xs text-slate-500">
                Students can only register and transact if their email matches one of these accredited college domains or suffix wildcards.
              </p>
            </div>

            {/* Add new domain form */}
            <form onSubmit={handleAddDomain} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="Domain (e.g. columbia.edu or .ac.uk)"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-purple-500"
              />
              <input
                type="text"
                required
                value={newCollegeName}
                onChange={(e) => setNewCollegeName(e.target.value)}
                placeholder="College / University Name"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={addingDomain}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition flex-shrink-0"
              >
                + Add Domain
              </button>
            </form>

            {/* Domains Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="pb-3">Domain</th>
                    <th className="pb-3">Institution Name</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {domains.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 font-mono font-bold text-purple-700">{d.domain}</td>
                      <td className="py-3 text-slate-900 font-medium">{d.college_name}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDeleteDomain(d.id)}
                          className="text-slate-400 hover:text-rose-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: USER MANAGEMENT & BANNING */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Student Accounts &amp; Access Control
              </h2>
              <p className="text-xs text-slate-500">
                Banning a user revokes their authentication token, hides all their listings, and prevents them from making contact requests.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="pb-3">Student</th>
                    <th className="pb-3">Email / Domain</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Verified</th>
                    <th className="pb-3 text-right">Access Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 font-bold text-slate-900">{u.display_name}</td>
                      <td className="py-3 text-slate-600 font-mono">{u.email}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3">
                        <StatusBadge type="verification" value={u.is_verified ? 'verified' : 'unverified'} />
                      </td>
                      <td className="py-3 text-right">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleBan(u.id, u.is_banned)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                              u.is_banned
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                          >
                            {u.is_banned ? 'Unban Account' : 'Ban User'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: SECURITY AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Security &amp; Privacy Audit Trail
              </h2>
              <p className="text-xs text-slate-500">
                Immutable record of contact requests, consent approvals, listings moderation, and user bans.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="pb-3">Timestamp</th>
                    <th className="pb-3">Action</th>
                    <th className="pb-3">Target</th>
                    <th className="pb-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 text-slate-400 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="py-3">
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600 font-mono">
                        {log.target_type}: {log.target_id?.substring(0, 8)}...
                      </td>
                      <td className="py-3 text-slate-500 font-mono text-[11px] truncate max-w-xs">
                        {JSON.stringify(log.details)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
