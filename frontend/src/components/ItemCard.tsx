import React from 'react';
import Link from 'next/link';
import { Listing } from '@/types';
import StatusBadge from './StatusBadge';
import { MapPin, Sparkles, Clock, Eye, ShieldCheck, ArrowUpRight } from 'lucide-react';

interface ItemCardProps {
  listing: Listing;
}

export default function ItemCard({ listing }: ItemCardProps) {
  const thumbnail =
    listing.images && listing.images.length > 0
      ? listing.images[0]
      : 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80';

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group bg-white rounded-3xl border border-slate-200/90 hover:border-indigo-400 hover:shadow-2xl hover:shadow-indigo-100/70 transition-all duration-300 flex flex-col overflow-hidden relative"
    >
      {/* Image Thumbnail Container with Aspect Ratio */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <img
          src={thumbnail}
          alt={listing.title}
          className="h-full w-full object-cover object-center group-hover:scale-108 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Gradient Overlay for Top Badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-black/20 pointer-events-none" />

        {/* Price Tag Pill */}
        <div className="absolute top-3 left-3 z-10">
          {listing.is_free ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-950/20 animate-pulse">
              <Sparkles className="w-3 h-3" />
              FREE
            </span>
          ) : (
            <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-extrabold bg-slate-900/85 backdrop-blur-md text-white shadow-lg border border-white/10">
              ₹{Number(listing.price).toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Condition Chip */}
        <div className="absolute top-3 right-3 z-10">
          <StatusBadge type="condition" value={listing.condition} />
        </div>

        {/* Bottom overlay inside photo: Views and Campus Hub */}
        <div className="absolute bottom-2.5 left-3 right-3 z-10 flex items-center justify-between text-[11px] text-white/90">
          <span className="flex items-center gap-1 font-semibold truncate drop-shadow-sm">
            <MapPin className="w-3 h-3 text-indigo-300 flex-shrink-0" />
            <span className="truncate">{listing.campus_name || 'Main Campus'}</span>
          </span>
          <span className="flex items-center gap-1 text-[10px] bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-full border border-white/10">
            <Eye className="w-2.5 h-2.5 text-slate-300" />
            {listing.view_count}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Category Chip & Status */}
          <div className="flex items-center justify-between text-[11px] font-bold text-indigo-600 mb-1.5">
            <span className="uppercase tracking-wider truncate mr-2">
              {listing.category_name || 'Campus Gear'}
            </span>
            <StatusBadge type="status" value={listing.status} className="text-[10px] py-0 px-2 flex-shrink-0" />
          </div>

          {/* Title */}
          <h3 className="font-extrabold text-slate-900 text-sm line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
            {listing.title}
          </h3>

          {/* Location note */}
          <p className="mt-2 text-xs text-slate-500 line-clamp-1 flex items-center gap-1">
            <span className="font-medium text-slate-700">Meetup:</span> {listing.location_note}
          </p>
        </div>

        {/* Seller Info & Trust Badges */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white font-black text-[10px] flex items-center justify-center flex-shrink-0 shadow-xs">
              {listing.seller_name ? listing.seller_name.charAt(0).toUpperCase() : 'S'}
            </div>
            <div className="truncate">
              <span className="text-xs font-bold text-slate-800 truncate block leading-tight">
                {listing.seller_name}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 leading-none mt-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                Verified Student
              </span>
            </div>
          </div>

          <div className="w-7 h-7 rounded-xl bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white text-slate-400 flex items-center justify-center transition-colors flex-shrink-0">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}
