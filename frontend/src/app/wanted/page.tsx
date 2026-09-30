'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StatusBadge from '@/components/StatusBadge';
import { api } from '@/lib/api';
import { WantedPost, Category, Campus } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/Toast';
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
  ArrowRight,
  Filter,
} from 'lucide-react';
import Link from 'next/link';

export default function WantedPage() {
  const { user, isVerified, loginDemo } = useAuth();
  const { showSuccess, showError } = useToast();
  const [posts, setPosts] = useState<WantedPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & filter state
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

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
      const err = 'College institutional verification required to post wanted requests.';
      setError(err);
      showError(err);
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
      showSuccess('Your wanted request is now live on the Student Wishlist!');
      await fetchPosts();
    } catch (err: any) {
      const errTxt = err.message || 'Failed to post wanted request';
      setError(errTxt);
      showError(errTxt);
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered posts
  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      !searchFilter.trim() ||
      p.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (p.campus_name && p.campus_name.toLowerCase().includes(searchFilter.toLowerCase()));

    const matchesCategory =
      selectedCategoryFilter === 'all' || p.category_id === selectedCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 mb-2">
              <Compass className="w-3.5 h-3.5" />
              Student Wishlist Board
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Looking For Something on Campus?
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">
              Post what you need for this semester (textbooks, lab coats, graphing calculators, room appliances). Fellow verified students who have matching items can post or connect.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xl shadow-indigo-100 transition-all flex-shrink-0"
          >
            <PlusCircle className="w-5 h-5" />
            Post Wanted Request
          </button>
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Live Search */}
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search wishlist items..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 shadow-sm"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
            <button
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategoryFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategoryFilter(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategoryFilter === c.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Wanted Items Grid */}
        {loading ? (
          <div className="min-h-[250px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p className="text-xs text-slate-400">Loading student requests...</p>
            </div>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-50/50 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-indigo-600 font-bold mb-2">
                    <span className="uppercase tracking-wider text-[11px]">{post.category_name}</span>
                    <span className="text-slate-400 font-medium text-[11px] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {post.campus_name}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    {post.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {post.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                        Max Budget
                      </span>
                      <span className="text-base font-extrabold text-slate-900">
                        {post.budget_max ? `$${post.budget_max.toFixed(2)}` : 'Flexible / Free'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-800 block">
                        {post.user_name}
                      </span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200 inline-block mt-0.5">
                        Verified Student
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/listing/new`}
                    className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-bold text-xs border border-slate-200 hover:border-indigo-200 transition flex items-center justify-center gap-1.5"
                  >
                    <span>I Have This Item &rarr; List It</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 shadow-sm">
            <Compass className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">No matching wanted requests</p>
            <p className="text-xs text-slate-500 mt-1">Try clearing your filters or be the first to post!</p>
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
                    placeholder="e.g. Need TI-84 or Casio calculator for Calculus I"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Description &amp; Specifications *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Specify acceptable condition, when you need it by, or course code..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
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
