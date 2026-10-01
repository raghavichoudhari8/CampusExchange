'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ItemCard from '@/components/ItemCard';
import SearchFilterSidebar from '@/components/SearchFilterSidebar';
import SafetyBanner from '@/components/SafetyBanner';
import { api } from '@/lib/api';
import { Listing, Category, Campus } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import {
  PlusCircle,
  ShoppingBag,
  Sparkles,
  Filter,
  X,
  ArrowUpDown,
  BookOpen,
  Laptop,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

export default function MarketplacePage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCampus, setSelectedCampus] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [isFreeOnly, setIsFreeOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Load initial categories and campuses
  useEffect(() => {
    Promise.all([api.getCategories(), api.getCampuses()])
      .then(([cats, camps]) => {
        setCategories(cats);
        setCampuses(camps);
      })
      .catch(console.error);
  }, []);

  // Fetch listings based on current filters
  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getListings({
        search: search.trim() || undefined,
        category_id: selectedCategory || undefined,
        campus_id: selectedCampus || undefined,
        condition: selectedCondition || undefined,
        is_free: isFreeOnly ? true : undefined,
        max_price: maxPrice ? Number(maxPrice) : undefined,
      });
      setListings(data);
    } catch (err) {
      console.error('Failed to load listings:', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedCampus, selectedCondition, isFreeOnly, maxPrice]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchListings();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchListings]);

  // Client-side sorting
  const sortedListings = useMemo(() => {
    const list = [...listings];
    if (sortBy === 'price_low') {
      return list.sort((a, b) => (a.is_free ? 0 : a.price) - (b.is_free ? 0 : b.price));
    }
    if (sortBy === 'price_high') {
      return list.sort((a, b) => (b.is_free ? 0 : b.price) - (a.is_free ? 0 : a.price));
    }
    if (sortBy === 'views') {
      return list.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
    }
    // Default newest
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [listings, sortBy]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedCampus('');
    setSelectedCondition('');
    setIsFreeOnly(false);
    setMaxPrice('');
    setSortBy('newest');
  };

  const handleQuickChip = (action: string) => {
    if (action === 'free') {
      setIsFreeOnly(true);
      setMaxPrice('');
    } else if (action === 'under500') {
      setIsFreeOnly(false);
      setMaxPrice('500');
    } else if (action === 'tech') {
      const techCat = categories.find((c) => c.slug.includes('electronics'));
      if (techCat) setSelectedCategory(techCat.id);
    } else if (action === 'books') {
      const bookCat = categories.find((c) => c.slug.includes('academics'));
      if (bookCat) setSelectedCategory(bookCat.id);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Banner with Campus Hub and Post CTA */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-indigo-950/10">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Campus Marketplace
                </span>
                {user?.campus_name && (
                  <span className="text-xs text-indigo-200 font-semibold bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                    📍 {user.campus_name}
                  </span>
                )}
                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Zero Platform Fees
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                Find Course Gear &amp; Dorm Essentials
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Peer-to-peer exchange for textbooks, graphing calculators, lab coats, and electronics. Personal contact info is strictly encrypted until seller consent.
              </p>
            </div>

            <Link
              href="/listing/new"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold text-sm shadow-xl shadow-indigo-950/30 transition-all transform hover:-translate-y-0.5 flex-shrink-0"
            >
              <PlusCircle className="w-5 h-5" />
              Post an Item
            </Link>
          </div>
        </div>

        {/* Quick Filter Shortcut Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 flex-shrink-0">
            Quick:
          </span>
          <button
            onClick={() => handleQuickChip('free')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition flex-shrink-0 ${
              isFreeOnly
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            Free Giveaways (₹0)
          </button>

          <button
            onClick={() => handleQuickChip('under500')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition flex-shrink-0 ${
              maxPrice === '500' && !isFreeOnly
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            Under ₹500
          </button>

          <button
            onClick={() => handleQuickChip('tech')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition flex-shrink-0"
          >
            <Laptop className="w-3.5 h-3.5 text-indigo-500" />
            Electronics &amp; Tech
          </button>

          <button
            onClick={() => handleQuickChip('books')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition flex-shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-500" />
            Textbooks &amp; Academics
          </button>
        </div>

        {/* Safety Banner */}
        <SafetyBanner />

        {/* Active Filter Tags Bar */}
        {(search || selectedCategory || selectedCampus || selectedCondition || isFreeOnly || maxPrice) && (
          <div className="flex items-center gap-2 flex-wrap bg-white px-4 py-2.5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Active Filters:
            </span>

            {search && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold">
                Keyword: &ldquo;{search}&rdquo;
                <X className="w-3.5 h-3.5 cursor-pointer hover:text-indigo-900" onClick={() => setSearch('')} />
              </span>
            )}

            {selectedCategory && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold">
                Category: {categories.find((c) => c.id === selectedCategory)?.name || 'Selected'}
                <X className="w-3.5 h-3.5 cursor-pointer hover:text-indigo-900" onClick={() => setSelectedCategory('')} />
              </span>
            )}

            {selectedCampus && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold">
                Campus: {campuses.find((c) => c.id === selectedCampus)?.name || 'Selected'}
                <X className="w-3.5 h-3.5 cursor-pointer hover:text-indigo-900" onClick={() => setSelectedCampus('')} />
              </span>
            )}

            {selectedCondition && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold">
                Condition: {selectedCondition.replace('_', ' ')}
                <X className="w-3.5 h-3.5 cursor-pointer hover:text-indigo-900" onClick={() => setSelectedCondition('')} />
              </span>
            )}

            {isFreeOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold">
                Free Only
                <X className="w-3.5 h-3.5 cursor-pointer hover:text-emerald-950" onClick={() => setIsFreeOnly(false)} />
              </span>
            )}

            {maxPrice && !isFreeOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold">
                Max ₹{maxPrice}
                <X className="w-3.5 h-3.5 cursor-pointer hover:text-indigo-900" onClick={() => setMaxPrice('')} />
              </span>
            )}

            <button
              onClick={handleResetFilters}
              className="text-xs text-rose-500 hover:text-rose-700 font-bold ml-auto"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden flex items-center justify-between">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs"
          >
            <Filter className="w-4 h-4 text-indigo-600" />
            {mobileFilterOpen ? 'Hide Filters' : 'Show Filters & Search'}
          </button>
          <span className="text-xs text-slate-500 font-semibold">
            {sortedListings.length} listing{sortedListings.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* Main Grid & Sidebar Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar */}
          <div className={`${mobileFilterOpen ? 'block' : 'hidden'} lg:block lg:col-span-4 xl:col-span-3 w-full`}>
            <SearchFilterSidebar
              categories={categories}
              campuses={campuses}
              search={search}
              onSearchChange={setSearch}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedCampus={selectedCampus}
              onCampusChange={setSelectedCampus}
              selectedCondition={selectedCondition}
              onConditionChange={setSelectedCondition}
              isFreeOnly={isFreeOnly}
              onFreeOnlyChange={setIsFreeOnly}
              maxPrice={maxPrice}
              onMaxPriceChange={setMaxPrice}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              onReset={handleResetFilters}
            />
          </div>

          {/* Listings Section */}
          <div className="lg:col-span-8 xl:col-span-9 w-full space-y-4">
            <div className="hidden lg:flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Showing {sortedListings.length} listing{sortedListings.length === 1 ? '' : 's'}
              </span>

              {/* Sort selector */}
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
                <span className="font-semibold">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="views">Most Viewed</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3 animate-pulse">
                    <div className="aspect-[4/3] bg-slate-200 rounded-2xl" />
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-5 bg-slate-200 rounded w-3/4" />
                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : sortedListings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {sortedListings.map((item) => (
                  <ItemCard key={item.id} listing={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 px-4 bg-white rounded-3xl border border-slate-200/90 shadow-2xs">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  No items found matching your filters
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Try clearing your search terms or expanding your category and campus filters.
                </p>
                <div className="mt-5 flex items-center justify-center gap-3">
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                  >
                    Reset All Filters
                  </button>
                  <Link
                    href="/listing/new"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition"
                  >
                    Post Wanted / Sell
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
