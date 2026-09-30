'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Search,
  MapPin,
  TrendingUp,
  Layers,
  GraduationCap,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/marketplace');
    }
  };

  const categories = [
    {
      name: 'Electronics & Tech',
      slug: 'electronics-tech',
      icon: Laptop,
      count: '34 items',
      desc: 'Graphing calculators, Arduino kits, cables, monitors, chargers',
    },
    {
      name: 'Subscriptions & Keys',
      slug: 'subscriptions-keys',
      icon: Key,
      count: '18 items',
      desc: 'Shared cloud storage, AI tools, developer seats, educational tools',
    },
    {
      name: 'Room & Flat Essentials',
      slug: 'room-essentials',
      icon: Home,
      count: '42 items',
      desc: 'Kettles, study lamps, induction cookers, mini fridges, kettles',
    },
    {
      name: 'Furniture',
      slug: 'furniture',
      icon: Armchair,
      count: '21 items',
      desc: 'Study tables, ergonomic chairs, shoe racks, laundry hampers',
    },
    {
      name: 'Academics & Books',
      slug: 'academics-books',
      icon: BookOpen,
      count: '65 items',
      desc: 'Textbooks, lab coats, course readers, drafting kits, calculators',
    },
  ];

  const quickSearchTags = [
    'TI-84',
    'Mini Fridge',
    'Lab Coat',
    'Desk Lamp',
    'Calculus Textbook',
    'Arduino',
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 bg-gradient-to-b from-indigo-50/50 via-white to-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            {/* Trust Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100/90 text-indigo-900 mb-6 border border-indigo-200/80 shadow-sm backdrop-blur-sm">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Verified College Students Only &bull; Zero Fees &bull; In-Person Safety
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
              Buy, Sell &amp; Giveaway on Campus.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800">
                Privacy First.
              </span>
            </h1>

            {/* Subhead */}
            <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              CampusSwap connects verified students (<code className="text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-mono text-sm">.edu</code>, <code className="text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-mono text-sm">.ac.in</code>) to pass down textbooks, dorm gear, electronics, and keys. Zero platform cuts, zero exposed personal numbers.
            </p>

            {/* Live Hero Search Bar */}
            <div className="mt-8 max-w-2xl mx-auto">
              <form
                onSubmit={handleHeroSearch}
                className="flex items-center bg-white p-2 rounded-2xl shadow-xl shadow-indigo-100/60 border border-slate-200/90 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100 transition-all"
              >
                <div className="pl-3 text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search campus gear (e.g. TI-84, lab coat, mini fridge)..."
                  className="w-full px-3 py-2 text-sm text-slate-900 placeholder-slate-400 bg-transparent focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 flex-shrink-0"
                >
                  Search
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Quick Suggestion Chips */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-500">
                <span className="font-semibold text-slate-400">Trending:</span>
                {quickSearchTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => router.push(`/marketplace?search=${encodeURIComponent(tag)}`)}
                    className="px-2.5 py-1 rounded-lg bg-white/80 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200/80 text-[11px] font-medium transition text-slate-600"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/marketplace"
                className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transition-all flex items-center justify-center gap-2 group"
              >
                Explore Marketplace
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/listing/new"
                className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-sm border border-slate-300 shadow-sm hover:border-slate-400 transition-all flex items-center justify-center gap-2"
              >
                Post an Item (Free)
              </Link>
              <Link
                href="/wanted"
                className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 font-bold text-sm transition-all flex items-center justify-center gap-2 border border-indigo-100"
              >
                <Compass className="w-4 h-4 text-indigo-600" />
                Student Wishlist Board
              </Link>
            </div>
          </div>
        </section>

        {/* LIVE CAMPUS STATS TICKER */}
        <section className="bg-white border-y border-slate-200/80 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="p-3">
                <p className="text-3xl sm:text-4xl font-black text-indigo-600">4,800+</p>
                <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                  Verified Students
                </p>
              </div>
              <div className="p-3">
                <p className="text-3xl sm:text-4xl font-black text-emerald-600">0%</p>
                <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                  Platform Fees Always
                </p>
              </div>
              <div className="p-3">
                <p className="text-3xl sm:text-4xl font-black text-slate-900">AES-256</p>
                <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                  Contact Privacy Shield
                </p>
              </div>
              <div className="p-3">
                <p className="text-3xl sm:text-4xl font-black text-purple-600">5 Hubs</p>
                <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                  Campus Micro-Networks
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3-STEP HOW IT WORKS */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Safe &bull; Direct &bull; Verified
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
              How CampusSwap Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl mx-auto">
              A private peer discovery workflow specifically designed for campus security.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-indigo-300 hover:shadow-lg transition-all">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-sm mb-4">
                1
              </div>
              <h3 className="font-bold text-base text-slate-900">Verified Discovery</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Browse listings posted by verified college peers. Public phone numbers and emails are completely hidden from scrapers and outsiders.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-indigo-600">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-500" />
                Institutional Domain Gated
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-indigo-300 hover:shadow-lg transition-all">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 font-extrabold flex items-center justify-center text-sm mb-4">
                2
              </div>
              <h3 className="font-bold text-base text-slate-900">Consent-Gated Request</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Send a 1-click contact request with an optional note. The seller receives an alert and personally approves or declines your access.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-indigo-600">
                <Lock className="w-4 h-4 mr-1.5 text-indigo-500" />
                AES-256-GCM Encrypted
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-indigo-300 hover:shadow-lg transition-all">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 font-extrabold flex items-center justify-center text-sm mb-4">
                3
              </div>
              <h3 className="font-bold text-base text-slate-900">Safe Campus Handoff</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Coordinate an in-person exchange at campus safe spots (Library, Student Center, Quad). Inspect item, hand off, and confirm.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-xs font-semibold text-emerald-600">
                <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-500" />
                Zero Transaction Fees
              </div>
            </div>
          </div>
        </section>

        {/* 5 CATEGORIES SHOWCASE */}
        <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Explore Popular Campus Categories
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Passed down by graduating seniors and fellow roommates.
              </p>
            </div>
            <Link
              href="/marketplace"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              View all marketplace items &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.slug}
                  href={`/marketplace?category=${cat.slug}`}
                  className="group bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-50/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                        {cat.count}
                      </span>
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
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <SafetyBanner />
        </section>
      </main>

      <Footer />
    </div>
  );
}
