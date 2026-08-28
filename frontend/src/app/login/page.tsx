'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { apiGet } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User } from '@/lib/types';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.detail || 'Invalid email or password');
      }

      const data = await response.json();

      localStorage.setItem('token', data.access_token);

      const userData = await apiGet<User>('/auth/me');
      login(data.access_token, userData);
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to login';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-xl shadow-2xl border-slate-200/80 rounded-2xl bg-white/95 backdrop-blur-sm p-2 sm:p-4">
        <CardHeader className="text-center space-y-3 pb-6">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl shadow-md flex items-center justify-center ring-4 ring-blue-100 mb-1">
            <span className="text-white text-3xl font-bold font-serif">भू</span>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-extrabold tracking-tight text-blue-950">
              Bhumi Mitra (भूमि मित्र)
            </CardTitle>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
              Government of India • SIH26016
            </p>
          </div>
          <CardDescription className="text-base text-slate-600 max-w-md mx-auto">
            National Infrastructure Land Acquisition & Workflow Monitoring Platform
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 px-6 sm:px-8">
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-200 font-medium flex items-center gap-2">
                <span className="text-base">⚠️</span> {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-slate-800">
                Official Email Address
              </Label>
              <Input
                id="email"
                type="email"
                className="h-12 px-4 text-base rounded-xl border-slate-300 focus:border-blue-700 focus:ring-blue-700"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@bhumimitra.gov.in"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-800">
                  Password
                </Label>
              </div>
              <Input
                id="password"
                type="password"
                className="h-12 px-4 text-base rounded-xl border-slate-300 focus:border-blue-700 focus:ring-blue-700"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 px-6 sm:px-8 pt-4 pb-6">
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow-md transition duration-150"
              disabled={loading}
            >
              {loading ? 'Signing in securely...' : 'Sign In to Portal'}
            </Button>
            <div className="text-center text-sm text-slate-600 pt-1">
              New stakeholder or official agency?{' '}
              <Link href="/register" className="text-blue-900 font-bold hover:underline">
                Register account here &rarr;
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
