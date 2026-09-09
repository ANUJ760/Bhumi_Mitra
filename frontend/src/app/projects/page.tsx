'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, ProtectedRoute, hasRole } from '@/lib/auth';
import { apiGet, apiPost } from '@/lib/api';
import { Project, Agency, UserRole, GeoJSONGeometry } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import StatusBadge from '@/components/StatusBadge';
import BoundaryDrawer from '@/components/map/BoundaryDrawer';
import { FolderKanban, Plus, Search, Filter } from 'lucide-react';

const PROJECT_TYPES = [
  { value: 'road', label: 'Road / Highway' },
  { value: 'railway', label: 'Railway' },
  { value: 'irrigation', label: 'Irrigation' },
  { value: 'industrial', label: 'Industrial Corridor' },
  { value: 'urban', label: 'Urban Development' },
  { value: 'renewable_energy', label: 'Renewable Energy' },
  { value: 'other', label: 'Other Infrastructure' },
];

export default function ProjectsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [projectType, setProjectType] = useState('road');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [budget, setBudget] = useState('');
  const [geometry, setGeometry] = useState<GeoJSONGeometry | null>(null);
  const [reqBody, setReqBody] = useState('');
  const [implAgency, setImplAgency] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await apiGet<{ projects: Project[] } | Project[]>('/projects');
      const list = Array.isArray(data) ? data : data?.projects || [];
      setProjects(list);

      const ag = await apiGet<Agency[]>('/agencies');
      setAgencies(Array.isArray(ag) ? ag : []);
    } catch (e) {
      console.error('Failed to load projects:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      const payload: Record<string, unknown> = {
        name,
        project_type: projectType,
        state,
        district,
        budget: budget ? parseFloat(budget) : undefined,
        description: description || undefined,
      };
      if (geometry) payload.geometry = geometry;
      if (reqBody && reqBody !== 'none') payload.requiring_body_id = reqBody;
      if (implAgency && implAgency !== 'none') payload.implementing_agency_id = implAgency;

      await apiPost('/projects', payload);
      setOpen(false);
      // Reset
      setName(''); setProjectType('road'); setState(''); setDistrict('');
      setBudget(''); setGeometry(null); setReqBody(''); setImplAgency('');
      setDescription('');
      fetchProjects();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const canCreate = hasRole(user, UserRole.PROJECT_AGENCY, UserRole.CENTRAL_ADMIN);

  const filteredProjects = projects.filter(p =>
    !searchQuery ||
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.district.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FolderKanban className="w-6 h-6 text-emerald-600" />
                Projects
              </h1>
              <p className="text-gray-500 mt-1">
                Infrastructure project proposals and land acquisition tracker
              </p>
            </div>
            {canCreate && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm">
                    <Plus className="w-4 h-4" />
                    New Project Proposal
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-lg">New Project Proposal</DialogTitle>
                    <p className="text-sm text-gray-500">Submit a new infrastructure project for land acquisition</p>
                  </DialogHeader>
                  <form onSubmit={handleCreate} className="space-y-4 mt-4">
                    {errorMsg && (
                      <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                        {errorMsg}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Project Name *</Label>
                      <Input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mumbai-Pune Expressway Expansion" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Project Type *</Label>
                        <Select value={projectType} onValueChange={setProjectType}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {PROJECT_TYPES.map(t => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Estimated Budget (₹)</Label>
                        <Input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="e.g. 50000000" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>State *</Label>
                        <Input required value={state} onChange={e => setState(e.target.value)} placeholder="e.g. Maharashtra" />
                      </div>
                      <div className="space-y-2">
                        <Label>District *</Label>
                        <Input required value={district} onChange={e => setDistrict(e.target.value)} placeholder="e.g. Pune" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Requiring Body</Label>
                        <Select value={reqBody} onValueChange={setReqBody}>
                          <SelectTrigger><SelectValue placeholder="Select agency" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {agencies.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Implementing Agency</Label>
                        <Select value={implAgency} onValueChange={setImplAgency}>
                          <SelectTrigger><SelectValue placeholder="Select agency" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {agencies.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Project Description</Label>
                      <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of the project scope and objectives..." rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label>Project Boundary (GeoJSON Polygon)</Label>
                      <BoundaryDrawer onChange={setGeometry} />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                      <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Submit Proposal'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search projects by name, state, district..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-10 bg-white"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2 text-gray-600" disabled>
              <Filter className="w-4 h-4" />
              Filters
              <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Soon</span>
            </Button>
          </div>

          {/* Projects Table */}
          <Card className="border-gray-100 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="font-semibold">Project Name</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">State</TableHead>
                    <TableHead className="font-semibold">District</TableHead>
                    <TableHead className="font-semibold">Budget</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-12 text-gray-400">Loading projects...</TableCell></TableRow>
                  ) : filteredProjects.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-12 text-gray-400">
                      {searchQuery ? 'No projects match your search' : 'No projects found. Create your first project proposal above.'}
                    </TableCell></TableRow>
                  ) : (
                    filteredProjects.map(p => (
                      <TableRow
                        key={p.id}
                        className="cursor-pointer hover:bg-emerald-50/30 transition-colors"
                        onClick={() => router.push(`/projects/${p.id}`)}
                      >
                        <TableCell className="font-medium text-gray-900">{p.name}</TableCell>
                        <TableCell className="text-gray-600 capitalize">{p.project_type}</TableCell>
                        <TableCell className="text-gray-600">{p.state}</TableCell>
                        <TableCell className="text-gray-600">{p.district}</TableCell>
                        <TableCell className="text-gray-600 font-medium">
                          {p.budget ? `₹${(p.budget / 10000000).toFixed(1)} Cr` : '—'}
                        </TableCell>
                        <TableCell><StatusBadge status={p.status} /></TableCell>
                        <TableCell className="text-gray-500 text-sm">{new Date(p.created_at).toLocaleDateString('en-IN')}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
