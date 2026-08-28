'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute, useAuth, hasRole } from '@/lib/auth';
import { apiGet, apiPost } from '@/lib/api';
import { Project, UserRole, Agency, GeoJSONGeometry } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BoundaryDrawer from '@/components/map/BoundaryDrawer';
import { useRouter } from 'next/navigation';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState('road');
  const [requiringBodyId, setRequiringBodyId] = useState('');
  const [implementingAgencyId, setImplementingAgencyId] = useState('');
  const [state, setStateName] = useState('');
  const [district, setDistrict] = useState('');
  const [budget, setBudget] = useState('');
  const [geometry, setGeometry] = useState<GeoJSONGeometry | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchProjects();
    fetchAgencies();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await apiGet<{ projects: Project[] } | Project[]>('/projects');
      const data = Array.isArray(res) ? res : res?.projects || [];
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgencies = async () => {
    try {
      const data = await apiGet<Agency[]>('/agencies');
      setAgencies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load agencies:', error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      const newProj = await apiPost<Project>('/projects', {
        name,
        project_type: type,
        requiring_body_id: requiringBodyId || undefined,
        implementing_agency_id: implementingAgencyId || undefined,
        state,
        district,
        budget: budget ? parseFloat(budget) : undefined,
        boundary_geojson: geometry || undefined,
      });
      setProjects([newProj, ...projects]);
      setOpen(false);
      // reset form
      setName('');
      setType('road');
      setRequiringBodyId('');
      setImplementingAgencyId('');
      setStateName('');
      setDistrict('');
      setBudget('');
      setGeometry(null);
    } catch (error: unknown) {
      console.error('Failed to create project:', error);
      const msg = error instanceof Error ? error.message : 'Failed to create project';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const canCreate = hasRole(user, UserRole.CENTRAL_ADMIN, UserRole.PROJECT_AGENCY);

  return (
    <ProtectedRoute>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-500 mt-1">Infrastructure project proposals and land acquisition tracker</p>
          </div>
          {canCreate && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-900 hover:bg-blue-800">New Project Proposal</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Project Proposal</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4 mt-4">
                  {errorMsg && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                      {errorMsg}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label>Project Name *</Label>
                      <Input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Pune Ring Road Expansion Phase 1" />
                    </div>
                    <div className="space-y-2">
                      <Label>Project Type *</Label>
                      <Select required value={type} onValueChange={setType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="road">Road</SelectItem>
                          <SelectItem value="rail">Rail</SelectItem>
                          <SelectItem value="irrigation">Irrigation</SelectItem>
                          <SelectItem value="industrial">Industrial</SelectItem>
                          <SelectItem value="renewable">Renewable</SelectItem>
                          <SelectItem value="urban">Urban</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Budget (INR)</Label>
                      <Input type="number" step="1000" value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g. 500000000" />
                    </div>
                    <div className="space-y-2">
                      <Label>State *</Label>
                      <Input required value={state} onChange={e => setStateName(e.target.value)} placeholder="e.g. Maharashtra" />
                    </div>
                    <div className="space-y-2">
                      <Label>District *</Label>
                      <Input required value={district} onChange={e => setDistrict(e.target.value)} placeholder="e.g. Pune" />
                    </div>
                    <div className="space-y-2">
                      <Label>Requiring Body</Label>
                      <Select value={requiringBodyId} onValueChange={setRequiringBodyId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select agency" />
                        </SelectTrigger>
                        <SelectContent>
                          {agencies.map(a => (
                            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Implementing Agency</Label>
                      <Select value={implementingAgencyId} onValueChange={setImplementingAgencyId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select agency" />
                        </SelectTrigger>
                        <SelectContent>
                          {agencies.map(a => (
                            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <Label>Project Boundary (GeoJSON Polygon)</Label>
                    <BoundaryDrawer onChange={setGeometry} />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit" className="bg-blue-900 hover:bg-blue-800" disabled={submitting}>
                      {submitting ? 'Submitting...' : 'Submit Proposal'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card className="shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>State</TableHead>
                <TableHead>District</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">Loading projects...</TableCell>
                </TableRow>
              ) : projects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">No projects found.</TableCell>
                </TableRow>
              ) : (
                projects.map(p => (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer hover:bg-gray-50 transition"
                    onClick={() => router.push(`/projects/${p.id}`)}
                  >
                    <TableCell className="font-medium text-blue-900">{p.name}</TableCell>
                    <TableCell className="capitalize">{p.project_type}</TableCell>
                    <TableCell>{p.state}</TableCell>
                    <TableCell>{p.district}</TableCell>
                    <TableCell>{p.budget ? `₹${p.budget.toLocaleString()}` : '-'}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                    <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
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
