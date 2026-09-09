'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { apiPost, apiGet, setToken } from '@/lib/api';
import { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MapPin, Shield, BarChart3, LogIn, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiPost<{ access_token: string }>('/auth/login', { email, password });
      if (res?.access_token) {
        setToken(res.access_token);
        const me = await apiGet<User>('/auth/me');
        login(res.access_token, me);
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid email or password';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTR2MkgyNHYtMmgxMnptMC00djJIMjR2LTJoMTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-8 border border-white/20">
            <span className="text-white text-2xl font-bold font-serif">भू</span>
          </div>
          <h1 className="text-3xl xl:text-4xl font-bold leading-tight mb-4">
            National Land Acquisition<br />Management System
          </h1>
          <p className="text-emerald-100 text-lg leading-relaxed mb-10 max-w-md">
            Unified digital platform for end-to-end orchestration, GIS visualization & role-based tracking.
          </p>

          <div className="space-y-4">
            {[
              { icon: MapPin, text: 'GIS-enabled geo-tagging & spatial visualization' },
              { icon: Shield, text: 'Role-based access control for all stakeholders' },
              { icon: BarChart3, text: 'Real-time dashboards & analytics' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-emerald-100">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="text-xs text-emerald-200 uppercase tracking-wider font-medium">
              Smart India Hackathon 2026 • PS ID: SIH26016
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-gray-50/50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-bold font-serif">भू</span>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">Bhumi Mitra</div>
              <div className="text-[10px] text-emerald-700 font-medium uppercase tracking-wider">भूमि मित्र</div>
            </div>
          </div>

          <Card className="border-0 shadow-xl shadow-gray-200/50 bg-white">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold text-gray-900">Welcome back</CardTitle>
              <CardDescription className="text-gray-500">
                Sign in to your authorized account
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-100">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gov.in"
                    className="h-11 rounded-lg border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 rounded-lg border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                    required
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4 pt-2">
                <Button
                  type="submit"
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-sm gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </>
                  )}
                </Button>

                <div className="text-center text-sm text-gray-500">
                  Need a stakeholder account?{' '}
                  <Link href="/register" className="text-emerald-700 font-semibold hover:underline">
                    Register here
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>

          <p className="text-center text-xs text-gray-400 mt-6">
            Bhumi Mitra • Smart India Hackathon 2026
          </p>
        </div>
      </div>
    </div>
  );
}
