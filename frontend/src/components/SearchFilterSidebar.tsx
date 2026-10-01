import React from 'react';
import { Category, Campus } from '@/types';
import { Search, Filter, RotateCcw, Building2, Tag, IndianRupee, Sparkles, ArrowUpDown, X } from 'lucide-react';

interface SearchFilterSidebarProps {
  categories: Category[];
  campuses: Campus[];
  search: string;
  onSearchChange: (val: string) => void;
  selectedCategory: string;
  onCategoryChange: (id: string) => void;
  selectedCampus: string;
  onCampusChange: (id: string) => void;
  selectedCondition: string;
  onConditionChange: (cond: string) => void;
  isFreeOnly: boolean;
  onFreeOnlyChange: (val: boolean) => void;
  maxPrice: string;
  onMaxPriceChange: (val: string) => void;
  sortBy?: string;
  onSortByChange?: (val: string) => void;
  onReset: () => void;
}

export default function SearchFilterSidebar({
  categories,
  campuses,
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedCampus,
  onCampusChange,
  selectedCondition,
  onConditionChange,
  isFreeOnly,
  onFreeOnlyChange,
  maxPrice,
  onMaxPriceChange,
  sortBy = 'newest',
  onSortByChange,
  onReset,
}: SearchFilterSidebarProps) {
  const topCategories = categories.filter((c) => !c.parent_id);

  // Active filters count
  const activeCount =
    (search ? 1 : 0) +
    (selectedCategory ? 1 : 0) +
    (selectedCampus ? 1 : 0) +
    (selectedCondition ? 1 : 0) +
    (isFreeOnly ? 1 : 0) +
    (maxPrice ? 1 : 0);

  return (
    <aside className="w-full bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900 text-sm">Filters &amp; Hubs</h2>
            {activeCount > 0 && (
              <span className="text-[10px] text-indigo-600 font-bold">
                {activeCount} active filter{activeCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        {activeCount > 0 && (
          <button
            onClick={onReset}
            className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 font-bold transition px-2 py-1 rounded-lg hover:bg-rose-50"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      {/* Fulltext Search Input */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Search Marketplace
        </label>
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search items, books, models..."
            className="w-full pl-9 pr-8 py-2.5 rounded-2xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2.5 p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Sort By Dropdown */}
      {onSortByChange && (
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white"
          >
            <option value="newest">Newest First</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="views">Most Popular / Viewed</option>
          </select>
        </div>
      )}

      {/* Campus Micro-Hub */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <Building2 className="w-3.5 h-3.5 text-indigo-500" />
          Campus Micro-Hub
        </label>
        <select
          value={selectedCampus}
          onChange={(e) => onCampusChange(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition"
        >
          <option value="">All Campus Hubs (Global)</option>
          {campuses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.city})
            </option>
          ))}
        </select>
        <p className="text-[10px] text-slate-400 mt-1">
          Listings in your micro-hub appear first in search rankings.
        </p>
      </div>

      {/* Price & Giveaway Filter */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
          <IndianRupee className="w-3.5 h-3.5 text-indigo-500" />
          Price Range
        </label>
        <div className="space-y-2.5">
          <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-800 font-semibold p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 hover:bg-emerald-50 transition">
            <input
              type="checkbox"
              checked={isFreeOnly}
              onChange={(e) => onFreeOnlyChange(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
            />
            <span className="flex items-center gap-1 text-emerald-800">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Free Giveaways Only (₹0)
            </span>
          </label>

          {!isFreeOnly && (
            <div className="pt-1 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                <span>Budget Cap:</span>
                <span className="text-indigo-600 font-extrabold">
                  {maxPrice ? `₹${maxPrice}` : 'Unlimited'}
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="5000"
                step="100"
                value={maxPrice || '5000'}
                onChange={(e) => onMaxPriceChange(e.target.value)}
                className="w-full accent-indigo-600 mt-1"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5 font-mono">
                <span>₹100</span>
                <span>₹2,500</span>
                <span>₹5,000+</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
          <Tag className="w-3.5 h-3.5 text-indigo-500" />
          Categories
        </label>
        <div className="space-y-1">
          <button
            onClick={() => onCategoryChange('')}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-between ${
              selectedCategory === ''
                ? 'bg-indigo-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>All Categories</span>
          </button>
          {topCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-between ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Condition Filter */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Condition
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { id: '', label: 'Any' },
            { id: 'brand_new', label: 'Brand New' },
            { id: 'like_new', label: 'Like New' },
            { id: 'good', label: 'Good' },
            { id: 'fair', label: 'Fair' },
          ].map((cond) => (
            <button
              key={cond.id}
              onClick={() => onConditionChange(cond.id)}
              className={`px-2.5 py-2 rounded-xl text-xs font-bold text-center border transition ${
                selectedCondition === cond.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cond.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
