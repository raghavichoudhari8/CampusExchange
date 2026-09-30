'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ItemCard from '@/components/ItemCard';
import SearchFilterSidebar from '@/components/SearchFilterSidebar';
import SafetyBanner from '@/components/SafetyBanner';
import { api } from '@/lib/api';
import { Listing, Category, Campus } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { PlusCircle, ShoppingBag, Sparkles, Filter, AlertCircle } from 'lucide-react';
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

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedCampus('');
    setSelectedCondition('');
    setIsFreeOnly(false);
    setMaxPrice('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Campus micro-hub banner */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-lg shadow-indigo-950/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                P2P Campus Marketplace
              </span>
              {user?.campus_name && (
                <span className="text-xs text-indigo-300 font-medium">
                  &bull; Micro-Hub: {user.campus_name}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Buy, Sell & Giveaway on Campus
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Strictly peer-to-peer. Zero platform fees, zero payment middleman. Exchange course books, dorm essentials, tech, and subscriptions safely with fellow students.
            </p>
          </div>

          <Link
            href="/listing/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm shadow-md transition-all flex-shrink-0"
          >
            <PlusCircle className="w-5 h-5" />
            Post Item for Free
          </Link>
        </div>

        {/* Safety Banner */}
        <div className="mb-6">
          <SafetyBanner />
        </div>

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden mb-4 flex items-center justify-between">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm"
          >
            <Filter className="w-4 h-4 text-indigo-600" />
            {mobileFilterOpen ? 'Hide Filters' : 'Show Filters & Search'}
          </button>
          <span className="text-xs text-slate-500">
            {listings.length} item{listings.length === 1 ? '' : 's'} available
          </span>
        </div>

        {/* Main Grid & Sidebar Layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sidebar */}
          <div className={`${mobileFilterOpen ? 'block' : 'hidden'} lg:block w-full lg:w-64 flex-shrink-0`}>
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
              onReset={handleResetFilters}
            />
          </div>

          {/* Listings Section */}
          <div className="flex-1 w-full">
            <div className="hidden lg:flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Showing {listings.length} campus listing{listings.length === 1 ? '' : 's'}
              </span>
              {selectedCampus && (
                <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-medium border border-indigo-100">
                  Filtered by campus hub
                </span>
              )}
            </div>

            {loading ? (
              <div className="min-h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : listings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((item) => (
                  <ItemCard key={item.id} listing={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  No items match your filters
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Try clearing your search query or adjusting your category and campus filters.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
