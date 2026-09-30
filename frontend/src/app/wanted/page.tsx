'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StatusBadge from '@/components/StatusBadge';
import { api } from '@/lib/api';
import { WantedPost, Category, Campus } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import {
  Compass,
  PlusCircle,
  MapPin,
  Tag,
  DollarSign,
  User,
  CheckCircle,
  X,
  Search,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function WantedPage() {
  const { user, isVerified, loginDemo } = useAuth();
  const [posts, setPosts] = useState<WantedPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);

  // New wanted item modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [campusId, setCampusId] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    try {
      const data = await api.getWantedPosts();
      setPosts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([api.getCategories(), api.getCampuses()])
      .then(([cats, camps]) => {
        setCategories(cats);
        setCampuses(camps);
        if (cats.length > 0) setCategoryId(cats[0].id);
        if (camps.length > 0) setCampusId(user?.campus_id || camps[0].id);
      })
      .catch(console.error);

    fetchPosts();
  }, [user]);

  const handleCreateWanted = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
      setError('College institutional verification required to post wanted requests.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.createWantedPost({
        title: title.trim(),
        description: description.trim(),
        category_id: categoryId,
        campus_id: campusId,
        budget_max: budgetMax ? parseFloat(budgetMax) : undefined,
      });
      setTitle('');
      setDescription('');
      setBudgetMax('');
      setModalOpen(false);
      await fetchPosts();
    } catch (err: any) {
      setError(err.message || 'Failed to post wanted request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 mb-2">
              <Compass className="w-3.5 h-3.5" />
              Student Wishlist Board
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Looking For Something?
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
              Post what you need for this semester (textbooks, adapters, lab coats, hardware). Fellow verified campus students who have matching items can reach out.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all flex-shrink-0"
          >
            <PlusCircle className="w-5 h-5" />
            Post Wanted Request
          </button>
        </div>

        {/* Wanted Items Grid */}
        {loading ? (
          <div className="min-h-[250px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:border-indigo-300 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-indigo-600 font-semibold mb-2">
                    <span>{post.category_name}</span>
                    <span className="text-slate-400 font-normal">{post.campus_name}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    {post.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {post.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      Max Budget
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {post.budget_max ? `$${post.budget_max.toFixed(2)}` : 'Flexible'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-700 block">
                      {post.user_name}
                    </span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold border border-emerald-200">
                      Verified Student
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
            <Compass className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">No active wanted requests</p>
            <p className="text-xs text-slate-500 mt-1">Be the first to post what you need!</p>
          </div>
        )}

        {/* Modal for creating wanted post */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-indigo-600">
                  <Compass className="w-5 h-5" />
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    Post a Wanted Request
                  </h3>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!isVerified && (
                <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200">
                  You must be logged in as a verified student to post. Use the quick demo switcher in the navbar to test.
                </div>
              )}

              {error && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateWanted} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    What item do you need? *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Need Arduino UNO kit for CS101"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Description & Specifications *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Specify condition acceptable, when you need it by, or course code..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Category
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Campus Micro-Hub
                    </label>
                    <select
                      value={campusId}
                      onChange={(e) => setCampusId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      {campuses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Maximum Budget ($) (Optional)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    placeholder="e.g. 25"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                  >
                    {submitting ? 'Posting...' : 'Post to Wishlist'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
