'use client';

import Link from 'next/link';
import { useAuth, hasRole } from '@/lib/auth';
import { UserRole } from '@/lib/types';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <nav className="bg-blue-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-xl font-bold">
                Bhumi Mitra
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/dashboard" className="border-transparent text-gray-100 hover:border-gray-300 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Dashboard
              </Link>
              <Link href="/projects" className="border-transparent text-gray-100 hover:border-gray-300 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Projects
              </Link>
              {hasRole(user, UserRole.CENTRAL_ADMIN) && (
                <Link href="/admin/users" className="border-transparent text-gray-100 hover:border-gray-300 hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Users
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center">
            <div className="flex items-center mr-4">
              <span className="text-sm">{user?.name} ({user?.role})</span>
            </div>
            <Button variant="secondary" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
