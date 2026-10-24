'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from './Toast';
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
  Search,
  Check,
} from 'lucide-react';

export default function Navbar() {
  const { user, isVerified, logout } = useAuth();
  const { toast } = useToast();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
    { href: '/wanted', label: 'Wishlist Board', icon: Compass },
    { href: '/listing/new', label: 'Post Item', icon: PlusCircle, highlight: true },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  if (user?.role === 'admin') {
    navLinks.push({ href: '/admin', label: 'Admin Portal', icon: ShieldAlert, highlight: false });
  }

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    toast({
      type: 'info',
      title: 'Signed Out',
      message: 'You are now browsing as a public campus guest.',
    });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 group-hover:shadow-indigo-300 transition-all duration-300">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Campus<span className="text-indigo-600">Swap</span>
                </span>
                <span className="block text-[9.5px] uppercase font-bold text-slate-400 tracking-wider">
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
                      className="ml-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-200 transition-all duration-200"
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
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
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
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border border-slate-200/90 hover:border-indigo-300 bg-white hover:bg-slate-50 shadow-2xs transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-800 font-extrabold flex items-center justify-center text-xs shadow-inner">
                    {user.display_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800 leading-none">
                        {user.display_name}
                      </span>
                      <StatusBadge
                        type="verification"
                        value={user.is_verified ? 'verified' : 'unverified'}
                        className="text-[9px] py-0 px-1.5"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono leading-none block mt-1">
                      {user.email}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-slate-200/90 py-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-5 py-3 border-b border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Active Campus Profile
                      </p>
                      <p className="text-sm font-bold text-slate-900 mt-1">
                        {user.campus_name || 'No campus selected'}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {user.badges.map((b) => (
                          <StatusBadge key={b} type="badge" value={b} />
                        ))}
                      </div>
                    </div>

                    <div className="pt-1.5 px-2">
                      <Link
                        href="/onboarding"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 font-semibold rounded-xl"
                      >
                        Edit Profile Details
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-semibold rounded-xl"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/login"
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-indigo-600 transition"
                >
                  Log In
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all"
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
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {user && (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 mb-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{user.display_name}</span>
                <StatusBadge type="verification" value={user.is_verified ? 'verified' : 'unverified'} />
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{user.email}</p>
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
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold ${
                    link.highlight
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  href="/onboarding"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs py-2 text-slate-700 hover:text-indigo-600 font-semibold"
                >
                  Edit Profile Details
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-rose-600 py-2 text-left font-bold"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 px-4 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md"
              >
                Log In / Verify College Email
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
