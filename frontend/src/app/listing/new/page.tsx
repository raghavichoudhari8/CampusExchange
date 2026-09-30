'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthGuard from '@/components/AuthGuard';
import ImageUploader from '@/components/ImageUploader';
import { api } from '@/lib/api';
import { Category, Campus } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import {
  PlusCircle,
  Sparkles,
  Lock,
  ShieldCheck,
  Tag,
  MapPin,
  DollarSign,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export default function NewListingPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [campusId, setCampusId] = useState('');
  const [price, setPrice] = useState('20.00');
  const [isFree, setIsFree] = useState(false);
  const [condition, setCondition] = useState('good');
  const [locationNote, setLocationNote] = useState('Campus Library / Student Union');
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
  ]);

  // Private contact fields
  const [contactType, setContactType] = useState('email');
  const [contactValue, setContactValue] = useState(user?.email || '');
  const [preferredNote, setPreferredNote] = useState('Message me between 10am and 8pm');

  // ML Category suggestion state
  const [suggestingCategory, setSuggestingCategory] = useState(false);
  const [mlSuggested, setMlSuggested] = useState<{ id: string; name: string; conf: number } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getCategories(), api.getCampuses()])
      .then(([cats, camps]) => {
        setCategories(cats);
        setCampuses(camps);
        if (camps.length > 0 && !campusId) {
          setCampusId(user?.campus_id || camps[0].id);
        }
        if (cats.length > 0 && !categoryId) {
          setCategoryId(cats[0].id);
        }
      })
      .catch(console.error);
  }, [user]);

  // Trigger ML category auto-suggestion
  const handleAutoSuggestCategory = async () => {
    if (!title.trim() && !description.trim()) return;
    setSuggestingCategory(true);
    try {
      const pred = await api.predictCategory(title, description);
      setMlSuggested({
        id: pred.category_id,
        name: pred.category_name,
        conf: Math.round(pred.confidence * 100),
      });
      setCategoryId(pred.category_id);
    } catch (e) {
      console.warn('ML prediction error:', e);
    } finally {
      setSuggestingCategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !contactValue.trim()) {
      setError('Please fill out all required fields.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const created = await api.createListing({
        title: title.trim(),
        description: description.trim(),
        category_id: categoryId,
        campus_id: campusId,
        price: isFree ? 0 : parseFloat(price) || 0,
        is_free: isFree,
        condition,
        location_note: locationNote.trim(),
        images,
        contact_type: contactType,
        contact_value: contactValue.trim(),
        preferred_note: preferredNote.trim() || undefined,
      });

      if (created.status === 'flagged') {
        alert('Your listing has been submitted for moderation review.');
      }

      router.push(`/listing/${created.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        <AuthGuard fallbackMessage="Only verified college students with an approved institutional email (.edu, .ac.in) can create marketplace listings.">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 sm:p-10 space-y-8">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 mb-2">
                <PlusCircle className="w-3.5 h-3.5" />
                Verified Student Listing
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Post an Item on Campus
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Share textbook notes, dorm appliances, hardware kits, or subscriptions. Never publicly exposes your phone, email, or UPI.
              </p>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 text-rose-800 text-xs font-medium rounded-2xl border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title & Description */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Listing Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleAutoSuggestCategory}
                    placeholder="e.g. TI-84 Plus CE Color Graphing Calculator with Charger"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Item Description *
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoSuggestCategory}
                      disabled={suggestingCategory || !title}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 disabled:opacity-40"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      {suggestingCategory ? 'Analyzing...' : 'AI Auto-Suggest Category'}
                    </button>
                  </div>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the condition, usage, semester materials included, or pickup details..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Category & Campus Hub */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Category *</span>
                    {mlSuggested && (
                      <span className="text-[10px] text-emerald-600 font-normal">
                        AI: {mlSuggested.name} ({mlSuggested.conf}%)
                      </span>
                    )}
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.parent_id ? `— ${c.name}` : c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Campus Micro-Hub *
                  </label>
                  <select
                    value={campusId}
                    onChange={(e) => setCampusId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    {campuses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price, Free Toggle & Condition */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Price ($)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      disabled={isFree}
                      value={isFree ? '0.00' : price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-200 disabled:text-slate-400"
                    />
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                  <label className="mt-2 flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-emerald-700">
                    <input
                      type="checkbox"
                      checked={isFree}
                      onChange={(e) => setIsFree(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    Free Giveaway ($0)
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Condition *
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    <option value="brand_new">Brand New (Unopened)</option>
                    <option value="like_new">Like New (Mint)</option>
                    <option value="good">Good (Normal wear)</option>
                    <option value="fair">Fair (Usable)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Safe Meeting Spot
                  </label>
                  <input
                    type="text"
                    value={locationNote}
                    onChange={(e) => setLocationNote(e.target.value)}
                    placeholder="e.g. Student Union / Quad"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Photos */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Photos (Up to 5)
                </label>
                <ImageUploader images={images} onChange={setImages} />
              </div>

              {/* PRIVACY-CRITICAL CONTACT METHOD SECTION */}
              <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 space-y-4">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-600 text-white">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-indigo-950">
                      Private Encrypted Contact Details
                    </h3>
                    <p className="text-xs text-indigo-800 mt-0.5">
                      This information is <strong>encrypted at rest (AES-256-GCM)</strong> and stored in a segregated table. It is NEVER shown publicly. Only buyers you personally accept in your consent queue will receive this method.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                      Preferred Method
                    </label>
                    <select
                      value={contactType}
                      onChange={(e) => setContactType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="email">College / Private Email</option>
                      <option value="phone">Phone / SMS</option>
                      <option value="whatsapp">WhatsApp</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                      Contact Handle / Number / Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactValue}
                      onChange={(e) => setContactValue(e.target.value)}
                      placeholder={contactType === 'email' ? 'e.g. alex@mit.edu' : 'e.g. +1 (617) 555-0192'}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
                    Meeting Availability Note (Shared on Approval)
                  </label>
                  <input
                    type="text"
                    value={preferredNote}
                    onChange={(e) => setPreferredNote(e.target.value)}
                    placeholder="e.g. Available weekdays after 4pm at the CS lab"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Encrypting & Posting...' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </AuthGuard>
      </main>

      <Footer />
    </div>
  );
}
