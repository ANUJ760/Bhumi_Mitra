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
    desc: 'Submit new infrastructure project proposals & boundaries',
  },
  [UserRole.DISTRICT_AUTHORITY]: {
    label: 'District Authority (DM / CALA / Collector)',
    desc: 'Add land parcels, record awards, compensation, & possession',
  },
  [UserRole.STATE_ADMIN]: {
    label: 'State Administrator (State Revenue Dept)',
    desc: 'Review and approve/reject project proposals within state',
  },
  [UserRole.FIELD_OFFICER]: {
    label: 'Field Officer (Survey / Land Records)',
    desc: 'Ground inspection, R&R verification, document upload',
  },
  [UserRole.AUDITOR]: {
    label: 'Auditor (CAG / Ministry Oversight)',
    desc: 'Independent compliance audit and cross-stage monitoring',
  },
  [UserRole.VIEWER]: {
    label: 'Citizen / Observer (Viewer)',
    desc: 'Read-only inspection of land acquisition progress',
  },
  [UserRole.CENTRAL_ADMIN]: {
    label: 'Central Administrator',
    desc: 'National system administration and user management',
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
    <div className="min-h-screen py-10 flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 px-4">
      <Card className="w-full max-w-xl shadow-lg">
        <CardHeader className="text-center space-y-1">
          <div className="mx-auto w-14 h-14 bg-blue-900 rounded-full flex items-center justify-center mb-1">
            <span className="text-white text-xl font-bold">भू</span>
          </div>
          <CardTitle className="text-2xl font-bold text-blue-900">Stakeholder Registration</CardTitle>
          <CardDescription className="text-gray-500">
            Register your official account on Bhumi Mitra Land Acquisition Platform
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sunil Deshmukh"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Official Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gov.in"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <Label htmlFor="role">Stakeholder Role (RBAC) *</Label>
              <Select value={role} onValueChange={(v: UserRole) => setRole(v)}>
                <SelectTrigger id="role" className="h-auto py-2">
                  <SelectValue placeholder="Select your stakeholder role" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {Object.entries(ROLE_INFO).map(([rKey, info]) => (
                    <SelectItem key={rKey} value={rKey} className="py-2">
                      <div className="font-semibold text-gray-900">{info.label}</div>
                      <div className="text-xs text-gray-500">{info.desc}</div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agency">Affiliated Implementing / Requiring Agency</Label>
              <Select value={agencyId} onValueChange={setAgencyId}>
                <SelectTrigger id="agency">
                  <SelectValue placeholder="Select agency (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Independent / State Government</SelectItem>
                  {agencies.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="space-y-2">
                <Label htmlFor="state_scope">State Scope</Label>
                <Input
                  id="state_scope"
                  value={stateScope}
                  onChange={(e) => setStateScope(e.target.value)}
                  placeholder="e.g. Maharashtra"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="district_scope">District Scope</Label>
                <Input
                  id="district_scope"
                  value={districtScope}
                  onChange={(e) => setDistrictScope(e.target.value)}
                  placeholder="e.g. Pune"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3 pt-2">
            <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800" disabled={loading}>
              {loading ? 'Registering Account...' : 'Complete Registration'}
            </Button>
            <div className="text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-900 font-semibold hover:underline">
                Sign in here
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
