'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { UserRole } from '@/lib/types';
import { LayoutDashboard, FolderKanban, Users, LogOut, Menu, X, Bell, FileText, MapPin, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ROLE_LABELS: Record<string, string> = {
  CENTRAL_ADMIN: 'Central Admin',
  STATE_ADMIN: 'State Admin',
  DISTRICT_AUTHORITY: 'District Authority',
  PROJECT_AGENCY: 'Project Agency',
  FIELD_OFFICER: 'Field Officer',
  AUDITOR: 'Auditor',
  VIEWER: 'Viewer',
};

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!isAuthenticated) return null;

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/projects', label: 'Projects', icon: FolderKanban },
    { href: '/notifications', label: 'Notifications', icon: Bell },
    { href: '/reports', label: 'Reports', icon: BarChart3 },
    ...(user?.role === UserRole.CENTRAL_ADMIN
      ? [{ href: '/admin/users', label: 'Users', icon: Users }]
      : []),
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-border/60 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <span className="text-white text-sm font-bold font-serif">भू</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-base font-bold text-gray-900 leading-tight">Bhumi Mitra</div>
              <div className="text-[10px] text-emerald-700 font-medium tracking-wider uppercase">भूमि मित्र • Land Acquisition</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900 leading-tight">{user.name}</div>
                  <div className="text-[10px] font-medium text-emerald-700 uppercase tracking-wide">
                    {ROLE_LABELS[user.role] || user.role}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-700 font-semibold text-xs border border-emerald-200">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
            <div className="w-px h-8 bg-gray-200" />
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-gray-500 hover:text-red-600 hover:bg-red-50 gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden lg:inline">Logout</span>
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    active
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
            <div className="border-t border-gray-100 pt-2 mt-2">
              {user && (
                <div className="px-3 py-2 text-sm">
                  <div className="font-medium text-gray-900">{user.name}</div>
                  <div className="text-xs text-emerald-700 uppercase">{ROLE_LABELS[user.role]}</div>
                </div>
              )}
              <button
                onClick={logout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
