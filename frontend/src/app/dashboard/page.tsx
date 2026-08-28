'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/lib/auth';
import { apiGet } from '@/lib/api';
import { DashboardSummary, Project } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        const sumData = await apiGet<DashboardSummary>('/dashboard/summary');
        setSummary(sumData);

        const projRes = await apiGet<{ projects: Project[] } | Project[]>('/projects');
        const projects = Array.isArray(projRes) ? projRes : projRes?.projects || [];
        setRecentProjects(projects.slice(0, 5));
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const completedParcels = summary?.parcels_by_status?.COMPLETED || 0;
  const inProgressParcels = summary?.parcels_by_status?.IN_PROGRESS || 0;
  const pendingParcels = summary?.parcels_by_status?.PENDING || 0;
  const totalParcels = summary?.total_parcels || 0;
  const completionPercentage = totalParcels > 0 ? Math.round((completedParcels / totalParcels) * 100) : 0;

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
  }

  return (
    <ProtectedRoute>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Land Acquisition Monitoring and Progress Overview</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-t-4 border-t-blue-600 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{summary?.total_projects || 0}</div>
              <div className="text-xs text-gray-500 mt-2 flex flex-wrap gap-2">
                <span>Proposed: {summary?.projects_by_status?.PROPOSED || 0}</span>
                <span>•</span>
                <span>Approved: {summary?.projects_by_status?.APPROVED || 0}</span>
                <span>•</span>
                <span>Active: {summary?.projects_by_status?.ACTIVE || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-amber-500 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Parcels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalParcels}</div>
              <div className="text-xs text-gray-500 mt-2 flex flex-wrap gap-2">
                <span>Pending: {pendingParcels}</span>
                <span>•</span>
                <span>In Progress: {inProgressParcels}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-emerald-600 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Parcels Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{completedParcels}</div>
              <div className="text-xs text-gray-500 mt-2">
                <span className="font-semibold text-emerald-600">{completionPercentage}%</span> possession acquired
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Projects</h2>
          <Card className="shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentProjects.map((project) => (
                  <TableRow
                    key={project.id}
                    className="cursor-pointer hover:bg-gray-50 transition"
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
                    <TableCell className="font-medium text-blue-900">{project.name}</TableCell>
                    <TableCell className="capitalize">{project.project_type}</TableCell>
                    <TableCell>{project.district}, {project.state}</TableCell>
                    <TableCell><StatusBadge status={project.status} /></TableCell>
                    <TableCell>{new Date(project.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
                {recentProjects.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No projects found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
