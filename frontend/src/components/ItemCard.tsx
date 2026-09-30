import React from 'react';
import Link from 'next/link';
import { Listing } from '@/types';
import StatusBadge from './StatusBadge';
import { MapPin, Sparkles, Clock } from 'lucide-react';

interface ItemCardProps {
  listing: Listing;
}

export default function ItemCard({ listing }: ItemCardProps) {
  const thumbnail = listing.images && listing.images.length > 0
    ? listing.images[0]
    : 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80';

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-50/50 transition-all duration-300 flex flex-col overflow-hidden"
    >
      {/* Image Thumbnail Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <img
          src={thumbnail}
          alt={listing.title}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        {/* Price Tag Pill */}
        <div className="absolute top-3 left-3">
          {listing.is_free ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-md">
              FREE
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-900/90 backdrop-blur text-white shadow-md">
              ${listing.price.toFixed(2)}
            </span>
          )}
        </div>

        {/* Condition Chip */}
        <div className="absolute top-3 right-3">
          <StatusBadge type="condition" value={listing.condition} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category Chip */}
          <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-600 mb-1">
            <span>{listing.category_name || 'Campus Gear'}</span>
            <span className="text-slate-400 font-normal">{listing.campus_name}</span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-slate-900 text-sm line-clamp-2 group-hover:text-indigo-600 transition-colors">
            {listing.title}
          </h3>

          {/* Location note */}
          <div className="mt-2 flex items-center text-xs text-slate-500 gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">{listing.location_note}</span>
          </div>
        </div>

        {/* Seller Info & Trust Badges */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
              {listing.seller_name ? listing.seller_name.charAt(0).toUpperCase() : 'S'}
            </div>
            <span className="text-xs font-medium text-slate-700 truncate">
              {listing.seller_name}
            </span>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {listing.seller_badges && listing.seller_badges.length > 0 && (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                Verified
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
