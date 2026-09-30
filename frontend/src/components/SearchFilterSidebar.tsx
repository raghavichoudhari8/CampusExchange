import React from 'react';
import { Category, Campus } from '@/types';
import { Search, Filter, RotateCcw, Building2, Tag, DollarSign } from 'lucide-react';

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
  onReset,
}: SearchFilterSidebarProps) {
  // Top-level categories
  const topCategories = categories.filter((c) => !c.parent_id);

  return (
    <aside className="w-full lg:w-64 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-600" />
          <h2 className="font-bold text-slate-900 text-sm">Filters & Hubs</h2>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-slate-400 hover:text-indigo-600 flex items-center gap-1 font-medium transition"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* Fulltext Search Input */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          Keywords
        </label>
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search items, books..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Campus Micro-Hub */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <Building2 className="w-3.5 h-3.5 text-indigo-500" />
          Campus Micro-Hub
        </label>
        <select
          value={selectedCampus}
          onChange={(e) => onCampusChange(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white"
        >
          <option value="">All Campuses</option>
          {campuses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Category Filter */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
          <Tag className="w-3.5 h-3.5 text-indigo-500" />
          Category
        </label>
        <div className="space-y-1">
          <button
            onClick={() => onCategoryChange('')}
            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
              selectedCategory === ''
                ? 'bg-indigo-50 text-indigo-700 font-bold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Categories
          </button>
          {topCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                selectedCategory === cat.id
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Filter */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
          <DollarSign className="w-3.5 h-3.5 text-indigo-500" />
          Price
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
            <input
              type="checkbox"
              checked={isFreeOnly}
              onChange={(e) => onFreeOnlyChange(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
            />
            Free Items Only (Giveaways)
          </label>

          {!isFreeOnly && (
            <div className="pt-1">
              <span className="text-[11px] text-slate-500">Max Budget: {maxPrice ? `$${maxPrice}` : 'Any'}</span>
              <input
                type="range"
                min="5"
                max="250"
                step="5"
                value={maxPrice || '250'}
                onChange={(e) => onMaxPriceChange(e.target.value)}
                className="w-full accent-indigo-600 mt-1"
              />
            </div>
          )}
        </div>
      </div>

      {/* Condition Filter */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
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
              className={`px-2 py-1.5 rounded-lg text-xs font-medium text-center border transition ${
                selectedCondition === cond.id
                  ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
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
