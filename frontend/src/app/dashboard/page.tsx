'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StatusBadge from '@/components/StatusBadge';
import AuthGuard from '@/components/AuthGuard';
import { api } from '@/lib/api';
import { Listing, ContactRequest } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/Toast';
import {
  LayoutDashboard,
  ShoppingBag,
  Send,
  CheckCircle,
  XCircle,
  RotateCw,
  Trash2,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  MapPin,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Building,
  User,
  Copy,
  Check,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const [activeTab, setActiveTab] = useState<'seller' | 'buyer'>('seller');
  const [sellerStatusFilter, setSellerStatusFilter] = useState<string>('all');

  // Seller data
  const [sellerListings, setSellerListings] = useState<Listing[]>([]);
  const [sellerRequests, setSellerRequests] = useState<ContactRequest[]>([]);

  // Buyer data
  const [buyerRequests, setBuyerRequests] = useState<ContactRequest[]>([]);

  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allListings, sReqs, bReqs] = await Promise.all([
        api.getListings({ status: '' }), // all statuses
        api.getSellerRequests(),
        api.getMyRequests(),
      ]);

      if (user) {
        setSellerListings(allListings.filter((l) => l.seller_id === user.id));
      }
      setSellerRequests(sReqs);
      setBuyerRequests(bReqs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleStatusChange = async (listingId: string, newStatus: string) => {
    try {
      await api.updateListingStatus(listingId, newStatus);
      showSuccess(`Listing status updated to ${newStatus.toUpperCase()}`);
      await fetchData();
    } catch (err: any) {
      showError(err.message || 'Failed to update status');
    }
  };

  const handleRenew = async (listingId: string) => {
    try {
      await api.renewListing(listingId);
      showSuccess('Listing renewed for 30 more days!');
      await fetchData();
    } catch (err: any) {
      showError(err.message || 'Failed to renew listing');
    }
  };

  const handleRespondToRequest = async (requestId: string, action: 'approve' | 'decline' | 'revoke') => {
    try {
      await api.respondToContactRequest(requestId, action);
      if (action === 'approve') {
        showSuccess('Contact request approved! The buyer received your contact method.');
      } else if (action === 'decline') {
        showInfo('Contact request declined.');
      } else {
        showInfo('Access revoked.');
      }
      await fetchData();
    } catch (err: any) {
      showError(err.message || 'Failed to respond to request');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showSuccess('Contact info copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const pendingSellerRequests = sellerRequests.filter((r) => r.status === 'pending');
  const activeListingsCount = sellerListings.filter((l) => l.status === 'active').length;
  const soldListingsCount = sellerListings.filter((l) => l.status === 'sold').length;

  const filteredSellerListings = sellerListings.filter((l) => {
    if (sellerStatusFilter === 'all') return true;
    return l.status === sellerStatusFilter;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <AuthGuard fallbackMessage="Please log in with your verified college email to view your dashboard.">
          {/* User Profile Bar */}
          {user && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                  {user.display_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-extrabold text-slate-900">
                      {user.display_name}
                    </h1>
                    <StatusBadge
                      type="verification"
                      value={user.is_verified ? 'verified' : 'unverified'}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>{user.email}</span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <MapPin className="w-3 h-3 text-indigo-600" />
                      {user.campus_name || 'Campus Hub'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {user.badges.map((b) => (
                  <StatusBadge key={b} type="badge" value={b} />
                ))}
                <Link
                  href="/onboarding"
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold px-3 py-1.5 rounded-xl border border-indigo-100 hover:bg-indigo-50 transition"
                >
                  Edit Profile
                </Link>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-200 gap-4">
            <button
              onClick={() => setActiveTab('seller')}
              className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
                activeTab === 'seller'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Seller Hub
              {pendingSellerRequests.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white animate-pulse">
                  {pendingSellerRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('buyer')}
              className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
                activeTab === 'buyer'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Send className="w-4 h-4" />
              My Requests (Buyer)
              {buyerRequests.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                  {buyerRequests.length}
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: SELLER HUB */}
          {activeTab === 'seller' && (
            <div className="space-y-8">
              {/* Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Active Listings
                  </span>
                  <p className="text-3xl font-black text-slate-900 mt-1">
                    {activeListingsCount}
                  </p>
                </div>
                <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Pending Requests
                  </span>
                  <p className="text-3xl font-black text-indigo-600 mt-1">
                    {pendingSellerRequests.length}
                  </p>
                </div>
                <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Items Sold / Handed Off
                  </span>
                  <p className="text-3xl font-black text-emerald-600 mt-1">
                    {soldListingsCount}
                  </p>
                </div>
              </div>

              {/* Incoming Contact Requests Queue */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Incoming Buyer Requests (Consent Queue)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Accept to share your encrypted contact method with the buyer for offline pickup.
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                    {sellerRequests.length} Total
                  </span>
                </div>

                {sellerRequests.length > 0 ? (
                  <div className="space-y-3">
                    {sellerRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900">
                              {req.listing_title}
                            </span>
                            <span className="text-xs text-slate-400">&bull;</span>
                            <span className="text-xs font-medium text-slate-700">
                              Buyer: <strong>{req.buyer_name}</strong> ({req.buyer_campus || 'Campus'})
                            </span>
                            <StatusBadge type="status" value={req.status} />
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {req.buyer_badges.map((b) => (
                              <StatusBadge key={b} type="badge" value={b} />
                            ))}
                          </div>

                          {req.message && (
                            <p className="text-xs text-slate-600 italic bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                              &ldquo;{req.message}&rdquo;
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {req.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleRespondToRequest(req.id, 'decline')}
                                className="px-3.5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
                              >
                                Decline
                              </button>
                              <button
                                onClick={() => handleRespondToRequest(req.id, 'approve')}
                                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition"
                              >
                                Accept &amp; Share Contact
                              </button>
                            </>
                          )}
                          {req.status === 'approved' && (
                            <button
                              onClick={() => handleRespondToRequest(req.id, 'revoke')}
                              className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition"
                            >
                              Revoke Access
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 text-center py-6">
                    No buyer contact requests yet.
                  </p>
                )}
              </div>

              {/* My Listings Table / Manager with Filter */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      My Posted Listings ({filteredSellerListings.length})
                    </h2>
                    <p className="text-xs text-slate-500">
                      Manage item availability, status, and 30-day renewals.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status filter buttons */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                      {['all', 'active', 'sold', 'expired'].map((st) => (
                        <button
                          key={st}
                          onClick={() => setSellerStatusFilter(st)}
                          className={`px-2.5 py-1 rounded-lg capitalize transition ${
                            sellerStatusFilter === st
                              ? 'bg-white text-indigo-700 shadow-sm font-bold'
                              : 'text-slate-500 hover:text-slate-900'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>

                    <Link
                      href="/listing/new"
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition shadow-sm flex items-center gap-1"
                    >
                      + Post Item
                    </Link>
                  </div>
                </div>

                {filteredSellerListings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 text-slate-400 uppercase font-semibold">
                        <tr>
                          <th className="pb-3">Item</th>
                          <th className="pb-3">Price</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3">Expires</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredSellerListings.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/60 transition">
                            <td className="py-3">
                              <Link
                                href={`/listing/${item.id}`}
                                className="font-bold text-slate-900 hover:text-indigo-600 line-clamp-1"
                              >
                                {item.title}
                              </Link>
                              <span className="text-[11px] text-slate-400">
                                {item.category_name} &bull; {item.view_count} views
                              </span>
                            </td>
                            <td className="py-3 font-semibold text-slate-900">
                              {item.is_free ? 'Free' : `₹${Number(item.price).toLocaleString('en-IN')}`}
                            </td>
                            <td className="py-3">
                              <select
                                value={item.status}
                                onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
                              >
                                <option value="active">Active</option>
                                <option value="reserved">Reserved</option>
                                <option value="sold">Sold</option>
                                <option value="expired">Expired</option>
                              </select>
                            </td>
                            <td className="py-3 text-slate-500">
                              {new Date(item.expires_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 text-right space-x-2">
                              <button
                                onClick={() => handleRenew(item.id)}
                                title="Renew listing for 30 days"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold transition"
                              >
                                <RotateCw className="w-3 h-3" />
                                Renew (30d)
                              </button>
                              <Link
                                href={`/listing/${item.id}`}
                                className="inline-flex items-center px-2 py-1 text-slate-600 hover:text-slate-900"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 text-center py-6">
                    No listings match the &ldquo;{sellerStatusFilter}&rdquo; filter.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BUYER REQUESTS */}
          {activeTab === 'buyer' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-6">
              <div className="pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">
                  My Contact Requests &amp; Unlocked Contacts
                </h2>
                <p className="text-xs text-slate-500">
                  Track sellers who have accepted your contact requests. Unlocked contact details are visible only to you.
                </p>
              </div>

              {buyerRequests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {buyerRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Link
                            href={`/listing/${req.listing_id}`}
                            className="font-bold text-slate-900 hover:text-indigo-600 line-clamp-1"
                          >
                            {req.listing_title}
                          </Link>
                          <StatusBadge type="status" value={req.status} />
                        </div>

                        <p className="text-xs text-slate-500">
                          Seller: <strong>{req.seller_name}</strong> &bull; Requested on{' '}
                          {new Date(req.created_at).toLocaleDateString()}
                        </p>

                        {/* Approved Contact Box */}
                        {req.status === 'approved' && req.contact_details && (
                          <div className="mt-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                Unlocked Contact
                              </span>
                              <button
                                onClick={() =>
                                  copyToClipboard(req.contact_details!.contact_value, req.id)
                                }
                                className="text-[11px] text-emerald-700 hover:text-emerald-900 flex items-center gap-1 font-semibold"
                              >
                                {copiedId === req.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    Copy
                                  </>
                                )}
                              </button>
                            </div>

                            <div className="flex items-center gap-2 text-slate-900 font-bold font-mono text-sm">
                              {req.contact_details.contact_type === 'phone' && (
                                <Phone className="w-4 h-4 text-emerald-600" />
                              )}
                              {req.contact_details.contact_type === 'whatsapp' && (
                                <MessageSquare className="w-4 h-4 text-emerald-600" />
                              )}
                              {req.contact_details.contact_type === 'email' && (
                                <Mail className="w-4 h-4 text-emerald-600" />
                              )}
                              <span>{req.contact_details.contact_value}</span>
                            </div>

                            {req.contact_details.preferred_note && (
                              <p className="text-[11px] text-slate-600 italic border-t border-emerald-100 pt-1.5">
                                Note: &ldquo;{req.contact_details.preferred_note}&rdquo;
                              </p>
                            )}

                            {/* Safe Meetup Reminder */}
                            <div className="pt-2 text-[10px] text-emerald-700 flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                              <span>Coordinate in a public campus spot (Library, Student Center).</span>
                            </div>
                          </div>
                        )}

                        {req.status === 'pending' && (
                          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                            <span>Awaiting seller consent. You will receive an alert once approved.</span>
                          </div>
                        )}

                        {req.status === 'declined' && (
                          <div className="mt-3 p-3 bg-slate-100 rounded-xl text-xs text-slate-600">
                            Seller declined this request (item was likely claimed).
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                        <Link
                          href={`/listing/${req.listing_id}`}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                        >
                          View Item Page &rarr;
                        </Link>
                        {req.status === 'pending' && (
                          <button
                            onClick={() => handleRespondToRequest(req.id, 'revoke')}
                            className="text-xs text-slate-400 hover:text-rose-600 transition"
                          >
                            Cancel Request
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 text-center py-8">
                  You haven&apos;t requested contact for any items yet. Browse the marketplace to find items you need.
                </p>
              )}
            </div>
          )}
        </AuthGuard>
      </main>

      <Footer />
    </div>
  );
}
