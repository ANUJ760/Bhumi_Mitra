'use client';

import { useEffect, useState, useCallback } from 'react';
import { ProtectedRoute, useAuth, hasRole } from '@/lib/auth';
import { apiGet, apiPatch, apiPost } from '@/lib/api';
import { Project, Parcel, UserRole, GeoJSONGeometry } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ProjectMap from '@/components/map/ProjectMap';
import BoundaryDrawer from '@/components/map/BoundaryDrawer';
import { useRouter } from 'next/navigation';

export default function ProjectDetail({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  // Parcel form
  const [ulpin, setUlpin] = useState('');
  const [area, setArea] = useState('');
  const [geometry, setGeometry] = useState<GeoJSONGeometry | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const proj = await apiGet<Project>(`/projects/${params.id}`);
      setProject(proj);
      const prclsRes = await apiGet<{ parcels: Parcel[] } | Parcel[]>(`/projects/${params.id}/parcels`);
      const prcls = Array.isArray(prclsRes) ? prclsRes : prclsRes?.parcels || [];
      setParcels(prcls);
    } catch (error) {
      console.error('Error fetching details:', error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const updated = await apiPatch<Project>(`/projects/${params.id}/status`, { status: newStatus });
      setProject(updated);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Error';
      alert(`Failed to update status: ${msg}`);
    }
  };

  const handleCreateParcel = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      const prcl = await apiPost<Parcel>(`/projects/${params.id}/parcels`, {
        ulpin,
        area_hectares: parseFloat(area),
        geometry: geometry || undefined,
      });
      setParcels([...parcels, prcl]);
      setOpen(false);
      setUlpin('');
      setArea('');
      setGeometry(null);
    } catch (error: unknown) {
      console.error('Failed to create parcel:', error);
      const msg = error instanceof Error ? error.message : 'Failed to create parcel';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const canApprove = hasRole(user, UserRole.CENTRAL_ADMIN, UserRole.STATE_ADMIN) && project?.status === 'PROPOSED';
  const canAddParcel = hasRole(user, UserRole.CENTRAL_ADMIN, UserRole.DISTRICT_AUTHORITY) && (project?.status === 'APPROVED' || project?.status === 'ACTIVE');

  if (loading) return <div className="p-8 text-center text-gray-500">Loading project details...</div>;
  if (!project) return <div className="p-8 text-center text-gray-500">Project not found.</div>;

  return (
    <ProtectedRoute>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-900" onClick={() => router.push('/projects')}>
                &larr; Back to Projects
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-500 mt-1">{project.district}, {project.state}</p>
          </div>
          <div className="flex space-x-3 items-center">
            <StatusBadge status={project.status} />
            {canApprove && (
              <>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleStatusChange('APPROVED')}>
                  Approve Proposal
                </Button>
                <Button variant="destructive" onClick={() => handleStatusChange('REJECTED')}>
                  Reject
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="col-span-1 lg:col-span-2 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Project GIS Map View</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectMap
                boundary={project.geometry}
                parcels={parcels}
                onParcelClick={(id) => router.push(`/parcels/${id}`)}
              />
              <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500/20 border border-blue-700"></span> Project Boundary</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-500"></span> Pending</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-500"></span> In Progress</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500"></span> Completed</span>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium">Type</div>
                <div className="font-semibold capitalize text-gray-900">{project.project_type}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium">Estimated Budget</div>
                <div className="font-semibold text-gray-900">{project.budget ? `₹${project.budget.toLocaleString()}` : 'Not specified'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium">Total Parcels</div>
                <div className="font-semibold text-gray-900">{parcels.length}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium">Created On</div>
                <div className="font-semibold text-gray-900">{new Date(project.created_at).toLocaleDateString()}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <div className="flex justify-between items-center p-6 border-b">
            <div>
              <CardTitle className="text-lg">Parcels ({parcels.length})</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">Click any parcel row to view acquisition stages and record workflow events</p>
            </div>
            {canAddParcel && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-blue-900 hover:bg-blue-800">Add Parcel</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Parcel to Project</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateParcel} className="space-y-4 mt-4">
                    {errorMsg && (
                      <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                        {errorMsg}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>ULPIN (Unique Land Parcel Identification Number) *</Label>
                        <Input required value={ulpin} onChange={e => setUlpin(e.target.value)} placeholder="e.g. ULPIN-MH-PUN-1001" />
                      </div>
                      <div className="space-y-2">
                        <Label>Area (Hectares) *</Label>
                        <Input type="number" step="0.01" required value={area} onChange={e => setArea(e.target.value)} placeholder="e.g. 2.5" />
                      </div>
                    </div>
                    <div className="space-y-2 mt-4">
                      <Label>Parcel Geometry (GeoJSON Polygon)</Label>
                      <BoundaryDrawer onChange={setGeometry} />
                    </div>
                    <div className="flex justify-end pt-4">
                      <Button type="submit" className="bg-blue-900 hover:bg-blue-800" disabled={submitting}>
                        {submitting ? 'Adding...' : 'Add Parcel'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ULPIN</TableHead>
                <TableHead>Area (Hectares)</TableHead>
                <TableHead>Acquisition Status</TableHead>
                <TableHead>Added On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parcels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    No parcels added yet. Click &quot;Add Parcel&quot; above.
                  </TableCell>
                </TableRow>
              ) : (
                parcels.map(p => (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer hover:bg-gray-50 transition"
                    onClick={() => router.push(`/parcels/${p.id}`)}
                  >
                    <TableCell className="font-semibold text-blue-900">{p.ulpin}</TableCell>
                    <TableCell>{p.area_hectares} Ha</TableCell>
                    <TableCell><StatusBadge status={p.overall_status} /></TableCell>
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
