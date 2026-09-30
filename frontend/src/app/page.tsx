import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SafetyBanner from '@/components/SafetyBanner';
import {
  Sparkles,
  ShieldCheck,
  Lock,
  ArrowRight,
  Laptop,
  Key,
  Home,
  Armchair,
  BookOpen,
  CheckCircle2,
  Users,
  Compass,
} from 'lucide-react';

export default function HomePage() {
  const categories = [
    { name: 'Electronics & Tech', slug: 'electronics-tech', icon: Laptop, desc: 'Laptops, TI-84 calculators, Arduino kits, cables' },
    { name: 'Subscriptions & Keys', slug: 'subscriptions-keys', icon: Key, desc: 'Shared cloud storage, AI tools, developer seats' },
    { name: 'Room & Flat Essentials', slug: 'room-essentials', icon: Home, desc: 'Kettles, study lamps, induction cookers, mini fridges' },
    { name: 'Furniture', slug: 'furniture', icon: Armchair, desc: 'Study tables, ergonomic chairs, racks, bins' },
    { name: 'Academics & Books', slug: 'academics-books', icon: BookOpen, desc: 'Textbooks, lab coats, course readers, drafting kits' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 mb-6 border border-indigo-200 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Verified College Students Only &bull; Zero Fees
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
              Buy, Sell &amp; Giveaway on Campus.{' '}
              <span className="text-indigo-600">Privacy First.</span>
            </h1>

            {/* Subhead */}
            <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              CampusSwap is a discovery platform built exclusively for verified students (.edu, .ac.in). No payment fees, no ads, and <strong>no exposed personal info</strong>. Connect with classmates and exchange items safely in person.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/marketplace"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2"
              >
                Browse Campus Listings
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/listing/new"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-sm border border-slate-300 shadow-sm transition-all"
              >
                Post an Item (Free)
              </Link>
              <Link
                href="/wanted"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <Compass className="w-4 h-4" />
                Wanted Board
              </Link>
            </div>
          </div>
        </section>

        {/* TRUST & PRIVACY GUARANTEE BANNER */}
        <section className="bg-white border-y border-slate-200/80 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Institutional Verification</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Mandatory .edu, .ac.in institutional email domain check. Spammers and outside scammers cannot post or request contacts.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">AES-256-GCM Privacy</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Contact details are encrypted at rest and never public. Only buyers you personally accept receive your contact method.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Zero Transaction Fees</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Discovery layer only. Handoffs and payments happen directly between students in campus public spots.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5 CATEGORIES SHOWCASE */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Explore Popular Campus Categories
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Find items passed down by graduating seniors and fellow roommates.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.slug}
                  href={`/marketplace`}
                  className="group bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-50/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      {cat.desc}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                    Explore items &rarr;
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* SAFETY REMINDER CALLOUT */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <SafetyBanner />
        </section>
      </main>

      <Footer />
    </div>
  );
}
