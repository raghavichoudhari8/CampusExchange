'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SafetyBanner from '@/components/SafetyBanner';
import StatusBadge from '@/components/StatusBadge';
import { api } from '@/lib/api';
import { Listing } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import {
  MapPin,
  Calendar,
  Eye,
  ShieldCheck,
  Send,
  Lock,
  Phone,
  Mail,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Share2,
  Clock,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isVerified, loginDemo } = useAuth();
  const listingId = params?.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  // Request contact modal / form state
  const [requestMessage, setRequestMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestSentSuccess, setRequestSentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchListing = async () => {
    try {
      const data = await api.getListing(listingId);
      setListing(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Listing not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (listingId) {
      fetchListing();
    }
  }, [listingId, user]);

  const handleRequestContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
      setErrorMessage('Institutional email verification is required to request contact.');
      return;
    }
    setSendingRequest(true);
    setErrorMessage(null);
    try {
      await api.requestContact(listingId, requestMessage.trim() || undefined);
      setRequestSentSuccess(true);
      await fetchListing();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send request');
    } finally {
      setSendingRequest(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 max-w-md mx-auto py-16 text-center px-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-800">Item Not Found</h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            This listing may have been sold, removed, or expired.
          </p>
          <Link
            href="/marketplace"
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
          >
            Back to Marketplace
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isSeller = user && user.id === listing.seller_id;
  const isApproved = listing.approved_contact !== null && listing.approved_contact !== undefined;
  const images = listing.images && listing.images.length > 0 ? listing.images : ['https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80'];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Back navigation */}
        <div className="mb-4">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Marketplace
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-7 space-y-4">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-sm relative">
              <img
                src={images[selectedImage]}
                alt={listing.title}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute top-4 left-4">
                {listing.is_free ? (
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-600 text-white shadow-lg">
                    FREE GIVEAWAY
                  </span>
                ) : (
                  <span className="px-3.5 py-1.5 rounded-full text-sm font-bold bg-slate-900/90 backdrop-blur text-white shadow-lg">
                    ${listing.price.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="absolute top-4 right-4">
                <StatusBadge type="condition" value={listing.condition} />
              </div>
            </div>

            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition ${
                      selectedImage === i ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Description Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Item Description
              </h2>
              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                {listing.description}
              </p>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Posted {new Date(listing.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-slate-400" />
                  <span>{listing.view_count} views</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Expires in 30 days</span>
                </div>
              </div>
            </div>

            {/* Campus Safety Warning Banner */}
            <SafetyBanner />
          </div>

          {/* Right Column: Title, Campus Location, Seller Trust Card & Privacy Contact Flow */}
          <div className="lg:col-span-5 space-y-6">
            {/* Header info */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block mb-1">
                  {listing.category_name || 'Campus Gear'}
                </span>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {listing.title}
                </h1>
              </div>

              {/* Price & Status */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">Price</span>
                  <span className="text-3xl font-extrabold text-slate-900">
                    {listing.is_free ? 'Free' : `$${listing.price.toFixed(2)}`}
                  </span>
                </div>
                <StatusBadge type="status" value={listing.status} />
              </div>

              {/* Campus Meeting Spot Note */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start gap-2.5">
                <MapPin className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Designated Meeting Spot</p>
                  <p className="text-xs text-slate-600 mt-0.5">{listing.location_note}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Campus: {listing.campus_name || 'Main Campus'}
                  </p>
                </div>
              </div>
            </div>

            {/* Seller Trust Profile Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Seller Identity & Trust Badges
              </h2>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 font-extrabold text-base flex items-center justify-center">
                  {listing.seller_name ? listing.seller_name.charAt(0).toUpperCase() : 'S'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-900">
                      {listing.seller_name}
                    </span>
                    <StatusBadge type="verification" value="verified" className="text-[10px] py-0 px-2" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verified College Student &bull; Campus Community
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-2">
                {(listing.seller_badges || []).map((b) => (
                  <StatusBadge key={b} type="badge" value={b} />
                ))}
              </div>
            </div>

            {/* PRIVACY-FIRST CONTACT SECTION */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Contact & Offline Handoff
                </h2>
              </div>

              {/* Case 1: Caller is the seller */}
              {isSeller && (
                <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl text-xs space-y-2">
                  <p className="font-bold text-indigo-900">You are the seller of this item.</p>
                  <p className="text-indigo-700">
                    Buyers cannot see your contact details until you explicitly approve their request in your Dashboard.
                  </p>
                  {listing.approved_contact && (
                    <div className="mt-2 p-2.5 bg-white rounded-xl border border-indigo-100">
                      <p className="font-semibold text-slate-700 text-[11px]">Your Encrypted Contact Method:</p>
                      <p className="font-mono text-xs text-indigo-800 font-bold mt-0.5">
                        {listing.approved_contact.contact_type.toUpperCase()}: {listing.approved_contact.contact_value}
                      </p>
                    </div>
                  )}
                  <Link
                    href="/dashboard"
                    className="inline-block mt-2 px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition"
                  >
                    Manage in Dashboard &rarr;
                  </Link>
                </div>
              )}

              {/* Case 2: Contact is APPROVED for this buyer */}
              {!isSeller && isApproved && listing.approved_contact && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-sm">Request Approved by Seller!</span>
                  </div>
                  <p className="text-xs text-emerald-700">
                    The seller accepted your request. Use the contact details below to coordinate offline meetup and item inspection:
                  </p>

                  <div className="p-3 bg-white rounded-xl border border-emerald-200 space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                      {listing.approved_contact.contact_type === 'phone' && <Phone className="w-4 h-4 text-emerald-600" />}
                      {listing.approved_contact.contact_type === 'whatsapp' && <MessageSquare className="w-4 h-4 text-emerald-600" />}
                      {listing.approved_contact.contact_type === 'email' && <Mail className="w-4 h-4 text-emerald-600" />}
                      <span className="font-mono text-base">{listing.approved_contact.contact_value}</span>
                    </div>
                    {listing.approved_contact.preferred_note && (
                      <p className="text-xs text-slate-500 italic">
                        Note: &ldquo;{listing.approved_contact.preferred_note}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Case 3: Request is PENDING */}
              {!isSeller && !isApproved && (listing.has_pending_request || requestSentSuccess) && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 font-bold">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Contact Request Pending</span>
                  </div>
                  <p className="text-amber-700">
                    You have requested contact for this item. The seller has been notified via WebSocket and email. Once they accept, their verified phone or email will unlock right here.
                  </p>
                </div>
              )}

              {/* Case 4: Not requested yet & User is Verified */}
              {!isSeller && !isApproved && !listing.has_pending_request && !requestSentSuccess && isVerified && (
                <form onSubmit={handleRequestContact} className="space-y-3">
                  <p className="text-xs text-slate-600">
                    Express interest to connect with the seller. No payment is made here — all transactions happen offline in person.
                  </p>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                      Short Note to Seller (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      placeholder="e.g. Hi! Can I inspect the calculator near Barker Library today?"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {errorMessage && (
                    <p className="text-xs text-rose-600 font-medium">{errorMessage}</p>
                  )}

                  <button
                    type="submit"
                    disabled={sendingRequest}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-md transition disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {sendingRequest ? 'Sending Request...' : 'Request Seller Contact'}
                  </button>
                </form>
              )}

              {/* Case 5: Unverified or Logged Out */}
              {!isSeller && !isVerified && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
                  <ShieldCheck className="w-8 h-8 text-indigo-600 mx-auto" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase">
                    College Verification Required
                  </h3>
                  <p className="text-xs text-slate-500">
                    To maintain strict campus safety, contact details can only be requested by verified students with an approved college email.
                  </p>
                  <div className="flex flex-col gap-2 pt-1">
                    <Link
                      href="/login"
                      className="w-full py-2 px-3 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition"
                    >
                      Log In with College Email
                    </Link>
                    <button
                      onClick={() => loginDemo('alex.chen@mit.edu')}
                      className="w-full py-2 px-3 rounded-xl border border-slate-300 bg-white text-slate-700 font-medium text-xs hover:bg-slate-50 transition"
                    >
                      Quick Demo: Login as Verified Student
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
