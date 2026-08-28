'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { apiGet, apiPost } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserRole, Agency, User } from '@/lib/types';

interface RegisterApiResponse {
  user: User;
  access_token: string;
  token_type: string;
}

const ROLE_INFO: Record<UserRole, { label: string; desc: string }> = {
  [UserRole.PROJECT_AGENCY]: {
    label: 'Project Agency (NHAI / MoRTH / PWD)',
    desc: 'Submit new infrastructure project proposals, budgets & GIS boundaries',
  },
  [UserRole.DISTRICT_AUTHORITY]: {
    label: 'District Authority (DM / CALA / Collector)',
    desc: 'Add land parcels, record awards, disbursals, & final possession',
  },
  [UserRole.STATE_ADMIN]: {
    label: 'State Administrator (State Revenue Dept)',
    desc: 'Review and approve/reject project proposals within state jurisdiction',
  },
  [UserRole.FIELD_OFFICER]: {
    label: 'Field Officer (Survey / Land Records)',
    desc: 'Ground inspection, R&R verification, and evidence document upload',
  },
  [UserRole.AUDITOR]: {
    label: 'Auditor (CAG / Ministry Oversight)',
    desc: 'Independent compliance audit and cross-stage monitoring',
  },
  [UserRole.VIEWER]: {
    label: 'Citizen / Observer (Viewer)',
    desc: 'Read-only inspection of land acquisition progress and status',
  },
  [UserRole.CENTRAL_ADMIN]: {
    label: 'Central Administrator',
    desc: 'National system administration and user account management',
  },
};

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.PROJECT_AGENCY);
  const [agencyId, setAgencyId] = useState<string>('');
  const [stateScope, setStateScope] = useState('');
  const [districtScope, setDistrictScope] = useState('');
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function loadAgencies() {
      try {
        const res = await apiGet<Agency[]>('/agencies');
        setAgencies(Array.isArray(res) ? res : []);
      } catch {
        // ignore if agencies fail to load
      }
    }
    loadAgencies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        name,
        email,
        password,
        role,
        agency_id: agencyId && agencyId !== 'none' ? agencyId : undefined,
        state_scope: stateScope || undefined,
        district_scope: districtScope || undefined,
      };

      const res = await apiPost<RegisterApiResponse>('/auth/register', payload);

      if (res?.access_token && res?.user) {
        localStorage.setItem('token', res.access_token);
        login(res.access_token, res.user);
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-16 flex items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-100 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-3xl shadow-2xl border-slate-200/80 rounded-2xl bg-white/95 backdrop-blur-sm p-4 sm:p-6">
        <CardHeader className="text-center space-y-3 pb-6">
          <div className="mx-auto w-18 h-18 bg-gradient-to-br from-blue-900 to-blue-800 rounded-2xl shadow-md flex items-center justify-center ring-4 ring-blue-100 mb-1">
            <span className="text-white text-2xl font-bold font-serif">भू</span>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-extrabold tracking-tight text-blue-950">
              Stakeholder Registration
            </CardTitle>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
              Bhumi Mitra • National Land Acquisition Platform
            </p>
          </div>
          <CardDescription className="text-base text-slate-600 max-w-xl mx-auto">
            Create an authorized stakeholder account with role-based jurisdiction access
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 px-4 sm:px-8">
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-200 font-medium flex items-center gap-2">
                <span className="text-base">⚠️</span> {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="name" className="text-sm font-semibold text-slate-800">
                  Full Name *
                </Label>
                <Input
                  id="name"
                  className="h-12 px-4 text-base rounded-xl border-slate-300 focus:border-blue-700 focus:ring-blue-700"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sunil Deshmukh"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-800">
                  Official Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  className="h-12 px-4 text-base rounded-xl border-slate-300 focus:border-blue-700 focus:ring-blue-700"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gov.in"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-800">
                  Password *
                </Label>
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
            </div>

            <div className="space-y-2 pt-1">
              <Label htmlFor="role" className="text-sm font-semibold text-slate-800">
                Stakeholder Role (RBAC Access Level) *
              </Label>
              <Select value={role} onValueChange={(v: UserRole) => setRole(v)}>
                <SelectTrigger id="role" className="h-auto py-3 px-4 rounded-xl border-slate-300 focus:border-blue-700 focus:ring-blue-700">
                  <SelectValue placeholder="Select your stakeholder role" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {Object.entries(ROLE_INFO).map(([rKey, info]) => (
                    <SelectItem key={rKey} value={rKey} className="py-2.5 px-3">
                      <div className="font-semibold text-gray-900">{info.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{info.desc}</div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agency" className="text-sm font-semibold text-slate-800">
                Affiliated Implementing / Requiring Agency (Optional)
              </Label>
              <Select value={agencyId} onValueChange={setAgencyId}>
                <SelectTrigger id="agency" className="h-12 px-4 rounded-xl border-slate-300 focus:border-blue-700 focus:ring-blue-700">
                  <SelectValue placeholder="Select agency (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Independent / State Government Department</SelectItem>
                  {agencies.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
              <div className="space-y-2">
                <Label htmlFor="state_scope" className="text-sm font-semibold text-slate-800">
                  State Jurisdiction Scope
                </Label>
                <Input
                  id="state_scope"
                  className="h-12 px-4 text-base rounded-xl border-slate-300 focus:border-blue-700 focus:ring-blue-700"
                  value={stateScope}
                  onChange={(e) => setStateScope(e.target.value)}
                  placeholder="e.g. Maharashtra"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="district_scope" className="text-sm font-semibold text-slate-800">
                  District Jurisdiction Scope
                </Label>
                <Input
                  id="district_scope"
                  className="h-12 px-4 text-base rounded-xl border-slate-300 focus:border-blue-700 focus:ring-blue-700"
                  value={districtScope}
                  onChange={(e) => setDistrictScope(e.target.value)}
                  placeholder="e.g. Pune"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 px-4 sm:px-8 pt-4 pb-6">
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold bg-blue-900 hover:bg-blue-800 text-white rounded-xl shadow-md transition duration-150"
              disabled={loading}
            >
              {loading ? 'Creating Authorized Account...' : 'Complete Stakeholder Registration'}
            </Button>
            <div className="text-center text-sm text-slate-600 pt-1">
              Already have an authorized account?{' '}
              <Link href="/login" className="text-blue-900 font-bold hover:underline">
                Sign in here &rarr;
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
