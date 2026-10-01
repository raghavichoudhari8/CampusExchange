'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SafetyBanner from '@/components/SafetyBanner';
import StatusBadge from '@/components/StatusBadge';
import ItemCard from '@/components/ItemCard';
import { api } from '@/lib/api';
import { Listing } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/Toast';
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
  Copy,
  Check,
  CheckCircle2,
  Building,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isVerified, loginDemo } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const listingId = params?.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [relatedListings, setRelatedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  // Request contact modal / form state
  const [requestMessage, setRequestMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestSentSuccess, setRequestSentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedContact, setCopiedContact] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const fetchListing = async () => {
    try {
      const data = await api.getListing(listingId);
      setListing(data);

      // Fetch related items in same category or general active listings
      try {
        const related = await api.getListings({
          category_id: data.category_id,
          status: 'active',
        });
        setRelatedListings(related.filter((item) => item.id !== listingId).slice(0, 3));
      } catch (_) {
        // Non-critical
      }
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
      const err = 'Institutional email verification (.edu, .ac.in) is required to request contact.';
      setErrorMessage(err);
      showError(err);
      return;
    }
    setSendingRequest(true);
    setErrorMessage(null);
    try {
      await api.requestContact(listingId, requestMessage.trim() || undefined);
      setRequestSentSuccess(true);
      showSuccess('Contact request submitted! The seller was alerted.');
      await fetchListing();
    } catch (err: any) {
      const errTxt = err.message || 'Failed to send request';
      setErrorMessage(errTxt);
      showError(errTxt);
    } finally {
      setSendingRequest(false);
    }
  };

  const handleShareListing = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      showSuccess('Listing link copied to clipboard!');
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  const handleCopyContact = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedContact(true);
    showSuccess('Contact handle copied to clipboard!');
    setTimeout(() => setCopiedContact(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="text-xs text-slate-400 font-medium">Loading verified campus listing...</p>
          </div>
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
  const images =
    listing.images && listing.images.length > 0
      ? listing.images
      : ['https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80'];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Navigation & Actions Top Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Marketplace
          </Link>

          <button
            onClick={handleShareListing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-sm transition"
          >
            {copiedShare ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Share Listing</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Image Gallery & Description */}
          <div className="lg:col-span-7 space-y-6">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-sm relative group">
              <img
                src={images[selectedImage]}
                alt={listing.title}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4">
                {listing.is_free ? (
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-600 text-white shadow-lg flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    FREE GIVEAWAY
                  </span>
                ) : (
                  <span className="px-3.5 py-1.5 rounded-full text-base font-extrabold bg-slate-900/90 backdrop-blur-md text-white shadow-lg">
                    ₹{Number(listing.price).toLocaleString('en-IN')}
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
                    className={`w-20 h-20 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition ${
                      selectedImage === i
                        ? 'border-indigo-600 ring-4 ring-indigo-100 scale-95'
                        : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Description Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Item Description
              </h2>
              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed font-normal">
                {listing.description}
              </p>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Posted {new Date(listing.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-slate-400" />
                  <span>{listing.view_count} student views</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Active 30-day listing</span>
                </div>
              </div>
            </div>

            {/* SAFE CAMPUS MEETUP CHECKLIST CARD */}
            <div className="bg-gradient-to-br from-indigo-50/70 to-purple-50/50 rounded-3xl border border-indigo-100 p-6 space-y-3">
              <div className="flex items-center gap-2 text-indigo-950 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span>Campus Safe Meetup Protocol</span>
              </div>
              <p className="text-xs text-indigo-800 leading-relaxed">
                For complete student safety, CampusSwap has no payment gateway. Follow this checklist when meeting:
              </p>
              <ul className="space-y-2 text-xs text-indigo-900/90 font-medium">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Designated Meeting Spot:</strong> Meet at public campus hubs (Main Library, Student Union, Quad, Dining Commons).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Inspect Before Payment:</strong> Turn on electronics, test chargers, and inspect condition before handing off cash.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>No Advance Wire Requests:</strong> Never send cryptocurrency, wire transfers, or gift cards in advance.</span>
                </li>
              </ul>
            </div>

            {/* Campus Safety Warning Banner */}
            <SafetyBanner />
          </div>

          {/* Right Column: Title, Campus Location, Seller Trust Card & Privacy Contact Flow */}
          <div className="lg:col-span-5 space-y-6">
            {/* Header info */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block mb-1">
                  {listing.category_name || 'Campus Gear'}
                </span>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {listing.title}
                </h1>
              </div>

              {/* Price & Status */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div>
                  <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">
                    Asking Price
                  </span>
                  <span className="text-3xl font-black text-slate-900">
                    {listing.is_free ? 'Free' : `₹${Number(listing.price).toLocaleString('en-IN')}`}
                  </span>
                </div>
                <StatusBadge type="status" value={listing.status} />
              </div>

              {/* Campus Meeting Spot Note */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Designated Meeting Spot</p>
                  <p className="text-xs text-slate-700 font-medium mt-0.5">{listing.location_note}</p>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                    <Building className="w-3 h-3 text-slate-400" />
                    Campus: {listing.campus_name || 'Main Campus'}
                  </p>
                </div>
              </div>
            </div>

            {/* Seller Trust Profile Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Seller Identity & Trust Badges
              </h2>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-base flex items-center justify-center shadow-md shadow-indigo-100">
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
                    Verified College Student &bull; Peer Community
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
                  Contact &amp; Offline Handoff
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
                    <div className="mt-2 p-3 bg-white rounded-xl border border-indigo-100">
                      <p className="font-semibold text-slate-700 text-[11px]">Your Encrypted Contact Method:</p>
                      <p className="font-mono text-xs text-indigo-800 font-bold mt-0.5">
                        {listing.approved_contact.contact_type.toUpperCase()}: {listing.approved_contact.contact_value}
                      </p>
                    </div>
                  )}
                  <Link
                    href="/dashboard"
                    className="inline-block mt-2 px-3.5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition shadow-sm"
                  >
                    Manage Consent Queue in Dashboard &rarr;
                  </Link>
                </div>
              )}

              {/* Case 2: Contact is APPROVED for this buyer */}
              {!isSeller && isApproved && listing.approved_contact && (
                <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span className="font-bold text-sm">Request Approved by Seller!</span>
                  </div>
                  <p className="text-xs text-emerald-700">
                    The seller accepted your request. Use the contact details below to coordinate offline meetup and item inspection:
                  </p>

                  <div className="p-3.5 bg-white rounded-xl border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between text-slate-800">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        {listing.approved_contact.contact_type === 'phone' && <Phone className="w-4 h-4 text-emerald-600" />}
                        {listing.approved_contact.contact_type === 'whatsapp' && <MessageSquare className="w-4 h-4 text-emerald-600" />}
                        {listing.approved_contact.contact_type === 'email' && <Mail className="w-4 h-4 text-emerald-600" />}
                        <span className="font-mono text-sm">{listing.approved_contact.contact_value}</span>
                      </div>
                      <button
                        onClick={() => handleCopyContact(listing.approved_contact!.contact_value)}
                        className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold flex items-center gap-1 transition"
                      >
                        {copiedContact ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    {listing.approved_contact.preferred_note && (
                      <p className="text-xs text-slate-500 italic border-t border-slate-100 pt-1.5">
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
                  <p className="text-amber-700 leading-relaxed">
                    You have requested contact for this item. The seller has been notified. Once they accept, their verified phone or email will unlock right here.
                  </p>
                </div>
              )}

              {/* Case 4: Not requested yet & User is Verified */}
              {!isSeller && !isApproved && !listing.has_pending_request && !requestSentSuccess && isVerified && (
                <form onSubmit={handleRequestContact} className="space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Express interest to connect with the seller. No payment is made here — all transactions happen offline in person.
                  </p>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
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
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
                  <ShieldCheck className="w-8 h-8 text-indigo-600 mx-auto" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase">
                    College Verification Required
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    To maintain strict campus safety, contact details can only be requested by verified students with an approved college email.
                  </p>
                  <div className="flex flex-col gap-2 pt-1">
                    <Link
                      href="/login"
                      className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition shadow-sm"
                    >
                      Log In with College Email
                    </Link>
                    <button
                      onClick={() => {
                        loginDemo('alex.chen@mit.edu');
                        showSuccess('Logged in as verified MIT student Alex Chen!');
                      }}
                      className="w-full py-2 px-3 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
                    >
                      Quick Demo: Login as Verified Student
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RELATED CAMPUS ITEMS */}
        {relatedListings.length > 0 && (
          <div className="pt-10 border-t border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  More Campus Items in {listing.category_name || 'this Category'}
                </h3>
                <p className="text-xs text-slate-500">
                  Check out other items available from fellow students.
                </p>
              </div>
              <Link
                href="/marketplace"
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                Browse all &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {relatedListings.map((item) => (
                <ItemCard key={item.id} listing={item} />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
