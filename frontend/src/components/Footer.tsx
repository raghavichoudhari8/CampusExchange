import React from 'react';
import Link from 'next/link';
import { Sparkles, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-800 text-sm">
              CampusSwap Platform
            </span>
            <span className="text-xs text-slate-400">
              — Zero transaction fees. Discovery only.
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-1 text-emerald-700 font-medium">
              <ShieldCheck className="w-4 h-4" />
              Institutional Email Verified Only
            </div>
            <Link href="/marketplace" className="hover:text-indigo-600">
              Browse Listings
            </Link>
            <Link href="/wanted" className="hover:text-indigo-600">
              Wanted Board
            </Link>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>
            &copy; {new Date().getFullYear()} CampusSwap. Peer-to-peer campus exchange built for students.
          </p>
          <p className="mt-2 sm:mt-0 flex items-center gap-1">
            Encrypted contact privacy &bull; No public phone or payment exposure
          </p>
        </div>
      </div>
    </footer>
  );
}
