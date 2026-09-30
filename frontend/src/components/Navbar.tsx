'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import StatusBadge from './StatusBadge';
import {
  Sparkles,
  ShoppingBag,
  PlusCircle,
  LayoutDashboard,
  ShieldAlert,
  LogOut,
  UserCheck,
  ChevronDown,
  Menu,
  X,
  Compass,
} from 'lucide-react';

export default function Navbar() {
  const { user, isVerified, loginDemo, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
    { href: '/wanted', label: 'Wanted Board', icon: Compass },
    { href: '/listing/new', label: 'Post an Item', icon: PlusCircle, highlight: true },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  if (user?.role === 'admin') {
    navLinks.push({ href: '/admin', label: 'Admin Portal', icon: ShieldAlert, highlight: false });
  }

  const handleDemoSwitch = async (email: string) => {
    await loginDemo(email);
    setUserDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Campus<span className="text-indigo-600">Swap</span>
                </span>
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Verified P2P Student Exchange
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                if (link.highlight) {
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="ml-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all"
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  );
                }
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-100 text-indigo-600 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header: User profile / Switcher */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-100 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                    {user.display_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-slate-800 leading-none">
                        {user.display_name}
                      </span>
                      <StatusBadge
                        type="verification"
                        value={user.is_verified ? 'verified' : 'unverified'}
                        className="text-[10px] py-0 px-1.5"
                      />
                    </div>
                    <span className="text-xs text-slate-500 leading-none block mt-0.5">
                      {user.email}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Active Campus Profile
                      </p>
                      <p className="text-sm font-medium text-slate-900 mt-1">{user.campus_name || 'No campus selected'}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {user.badges.map((b) => (
                          <StatusBadge key={b} type="badge" value={b} />
                        ))}
                      </div>
                    </div>

                    {/* Switch role preview helper */}
                    <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/80">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Switch Demo Role
                      </p>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleDemoSwitch('alex.chen@mit.edu')}
                          className="text-left text-xs px-2 py-1 rounded hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-between"
                        >
                          <span>Alex Chen (Verified Student)</span>
                          <span className="text-[10px] text-emerald-600 font-semibold">.edu</span>
                        </button>
                        <button
                          onClick={() => handleDemoSwitch('priya.sharma@iitb.ac.in')}
                          className="text-left text-xs px-2 py-1 rounded hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-between"
                        >
                          <span>Priya Sharma (Verified Student)</span>
                          <span className="text-[10px] text-emerald-600 font-semibold">.ac.in</span>
                        </button>
                        <button
                          onClick={() => handleDemoSwitch('unverified.user@gmail.com')}
                          className="text-left text-xs px-2 py-1 rounded hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-between"
                        >
                          <span>Guest User (Unverified)</span>
                          <span className="text-[10px] text-amber-600 font-semibold">gmail</span>
                        </button>
                        <button
                          onClick={() => handleDemoSwitch('admin@campusswap.edu')}
                          className="text-left text-xs px-2 py-1 rounded hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-between font-medium"
                        >
                          <span>Campus Admin</span>
                          <span className="text-[10px] text-purple-600 font-semibold">Admin</span>
                        </button>
                      </div>
                    </div>

                    <div className="pt-1">
                      <Link
                        href="/onboarding"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                      >
                        Edit Student Profile
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all"
                >
                  <UserCheck className="w-4 h-4" />
                  Verify College Email
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3">
          {user && (
            <div className="p-3 bg-slate-50 rounded-xl mb-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 text-sm">{user.display_name}</span>
                <StatusBadge type="verification" value={user.is_verified ? 'verified' : 'unverified'} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
            </div>
          )}

          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    link.highlight
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {user ? (
              <>
                <button
                  onClick={() => handleDemoSwitch('alex.chen@mit.edu')}
                  className="text-xs py-1.5 text-slate-600 hover:text-indigo-600 text-left font-medium"
                >
                  Switch to Alex Chen (.edu)
                </button>
                <button
                  onClick={() => handleDemoSwitch('unverified.user@gmail.com')}
                  className="text-xs py-1.5 text-slate-600 hover:text-indigo-600 text-left font-medium"
                >
                  Switch to Guest (Unverified)
                </button>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-rose-600 py-1.5 text-left font-medium"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 px-4 rounded-lg bg-indigo-600 text-white font-semibold text-sm"
              >
                Log In / Verify Email
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
