'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, ProtectedRoute } from '@/lib/auth';
import { apiGet } from '@/lib/api';
import { DashboardSummary, Project } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import StatusBadge from '@/components/StatusBadge';
import { FolderKanban, MapPin, CheckCircle2, Clock, TrendingUp, AlertTriangle, Bell } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  CENTRAL_ADMIN: 'Central Administrator',
  STATE_ADMIN: 'State Administrator',
  DISTRICT_AUTHORITY: 'District Authority',
  PROJECT_AGENCY: 'Project Agency',
  FIELD_OFFICER: 'Field Officer',
  AUDITOR: 'Auditor',
  VIEWER: 'Viewer',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sumData, projData] = await Promise.all([
          apiGet<DashboardSummary>('/dashboard/summary'),
          apiGet<{ projects: Project[] } | Project[]>('/projects'),
        ]);
        setSummary(sumData);
        const projList = Array.isArray(projData) ? projData : projData?.projects || [];
        setProjects(projList.slice(0, 8));
      } catch (e) {
        console.error('Dashboard load error:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const completedParcels = summary?.parcels_by_status?.COMPLETED || 0;
  const totalParcels = summary?.total_parcels || 0;
  const completionRate = totalParcels > 0 ? Math.round((completedParcels / totalParcels) * 100) : 0;

  const kpis = [
    {
      label: 'Total Projects',
      value: summary?.total_projects ?? '—',
      sub: `${summary?.projects_by_status?.APPROVED || 0} approved • ${summary?.projects_by_status?.ACTIVE || 0} active`,
      icon: FolderKanban,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      label: 'Total Parcels',
      value: summary?.total_parcels ?? '—',
      sub: `${summary?.parcels_by_status?.IN_PROGRESS || 0} in progress • ${summary?.parcels_by_status?.PENDING || 0} pending`,
      icon: MapPin,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
    },
    {
      label: 'Parcels Completed',
      value: completedParcels,
      sub: `${completionRate}% acquisition complete`,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      label: 'Pending Actions',
      value: (summary?.projects_by_status?.PROPOSED || 0) + (summary?.parcels_by_status?.PENDING || 0),
      sub: `${summary?.projects_by_status?.PROPOSED || 0} proposals awaiting review`,
      icon: Clock,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100',
    },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Header */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user ? `Welcome, ${user.name.split(' ')[0]}` : 'Dashboard'}
                </h1>
                <p className="text-gray-500 mt-1">
                  {user ? `${ROLE_LABELS[user.role] || user.role}${user.state_scope ? ` • ${user.state_scope}` : ''}${user.district_scope ? ` (${user.district_scope})` : ''}` : 'Land Acquisition Monitoring & Progress Overview'}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                Last updated: {new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 rounded-xl bg-white border border-gray-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpis.map((kpi, i) => {
                const Icon = kpi.icon;
                return (
                  <Card key={i} className={`border ${kpi.border} shadow-sm hover:shadow-md transition-shadow`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-500">{kpi.label}</p>
                          <p className="text-3xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                          <p className="text-xs text-gray-400 mt-1.5">{kpi.sub}</p>
                        </div>
                        <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${kpi.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Status */}
            <Card className="border-gray-100 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Project Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {['PROPOSED', 'APPROVED', 'ACTIVE', 'COMPLETED', 'REJECTED'].map(status => {
                  const count = summary?.projects_by_status?.[status] || 0;
                  const total = summary?.total_projects || 1;
                  const pct = Math.round((count / total) * 100);
                  const colors: Record<string, string> = {
                    PROPOSED: 'bg-blue-500',
                    APPROVED: 'bg-emerald-500',
                    ACTIVE: 'bg-teal-500',
                    COMPLETED: 'bg-green-500',
                    REJECTED: 'bg-red-400',
                  };
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <div className="w-24 text-xs font-medium text-gray-600">{status.replace('_', ' ')}</div>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${colors[status]} transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="w-12 text-right text-xs font-semibold text-gray-700">{count}</div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Placeholder: Alerts & Notifications */}
            <Card className="border-gray-100 shadow-sm border-dashed">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-500" />
                  Alerts & Notifications
                  <span className="ml-auto text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Coming Soon</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  </div>
                  <p className="text-sm text-gray-500 max-w-xs">
                    Automated alerts for pending approvals, delayed cases, statutory timelines & compensation disbursement will appear here.
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Placeholder — requires notification service integration (SMS Gateway, Email API)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Projects */}
          <Card className="border-gray-100 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-blue-600" />
                  Recent Projects
                </CardTitle>
                <button
                  onClick={() => router.push('/projects')}
                  className="text-sm text-emerald-700 font-medium hover:underline"
                >
                  View all →
                </button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="font-semibold">Project Name</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Location</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-400">Loading...</TableCell></TableRow>
                  ) : projects.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-400">No projects yet</TableCell></TableRow>
                  ) : (
                    projects.map(p => (
                      <TableRow
                        key={p.id}
                        className="cursor-pointer hover:bg-emerald-50/30 transition-colors"
                        onClick={() => router.push(`/projects/${p.id}`)}
                      >
                        <TableCell className="font-medium text-gray-900">{p.name}</TableCell>
                        <TableCell className="text-gray-600 capitalize">{p.project_type}</TableCell>
                        <TableCell className="text-gray-600">{p.district}, {p.state}</TableCell>
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
