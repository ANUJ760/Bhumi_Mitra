'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/lib/auth';
import { apiGet, apiPost } from '@/lib/api';
import { User, UserRole, Agency } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.DISTRICT_AUTHORITY);
  const [agencyId, setAgencyId] = useState<string>('');
  const [stateScope, setStateScope] = useState('');
  const [districtScope, setDistrictScope] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const usersRes = await apiGet<{ users: User[] } | User[]>('/users');
      const usersList = Array.isArray(usersRes) ? usersRes : usersRes?.users || [];
      setUsers(usersList);

      const agenciesRes = await apiGet<Agency[]>('/agencies');
      const agenciesList = Array.isArray(agenciesRes) ? agenciesRes : [];
      setAgencies(agenciesList);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      const newUser = await apiPost<User>('/users', {
        name,
        email,
        password,
        role,
        agency_id: agencyId && agencyId !== 'none' ? agencyId : undefined,
        state_scope: stateScope || undefined,
        district_scope: districtScope || undefined,
      });
      setUsers([newUser, ...users]);
      setOpen(false);

      // Reset form
      setName('');
      setEmail('');
      setPassword('');
      setRole(UserRole.DISTRICT_AUTHORITY);
      setAgencyId('');
      setStateScope('');
      setDistrictScope('');
    } catch (error: unknown) {
      console.error('Failed to create user:', error);
      const msg = error instanceof Error ? error.message : 'Failed to create user';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={[UserRole.CENTRAL_ADMIN]}>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-500 mt-1">Manage stakeholder accounts and RBAC access roles</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-900 hover:bg-blue-800">Create User</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Stakeholder Account</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                {errorMsg && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                    {errorMsg}
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Rajesh Sharma" />
                </div>
                <div className="space-y-2">
                  <Label>Email Address *</Label>
                  <Input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="r.sharma@gov.in" />
                </div>
                <div className="space-y-2">
                  <Label>Temporary Password *</Label>
                  <Input type="password" required value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Role (RBAC) *</Label>
                  <Select value={role} onValueChange={(v: UserRole) => setRole(v)}>
                    <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      {Object.values(UserRole).map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Agency</Label>
                  <Select value={agencyId} onValueChange={setAgencyId}>
                    <SelectTrigger><SelectValue placeholder="Select agency" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {agencies.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>State Scope</Label>
                    <Input value={stateScope} onChange={e => setStateScope(e.target.value)} placeholder="e.g. Maharashtra" />
                  </div>
                  <div className="space-y-2">
                    <Label>District Scope</Label>
                    <Input value={districtScope} onChange={e => setDistrictScope(e.target.value)} placeholder="e.g. Pune" />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" className="bg-blue-900 hover:bg-blue-800" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Account'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">Loading users...</TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">No users found.</TableCell>
                </TableRow>
              ) : (
                users.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-gray-900">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <span className="font-mono text-xs bg-slate-100 text-slate-800 px-2 py-1 rounded font-semibold">
                        {u.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      {u.state_scope ? (
                        <span>{u.state_scope} {u.district_scope ? `(${u.district_scope})` : ''}</span>
                      ) : (
                        <span className="text-gray-400">National</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
