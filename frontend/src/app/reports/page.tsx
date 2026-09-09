'use client';

import React from 'react';
import { ProtectedRoute } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, FileText, Download, TrendingUp, PieChart, Calendar, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const REPORT_TYPES = [
  {
    icon: TrendingUp,
    title: 'Project Progress Report',
    desc: 'State-wise and district-wise progress on land acquisition projects, including timeline adherence and milestone tracking.',
    status: 'available',
  },
  {
    icon: PieChart,
    title: 'Compensation Analytics',
    desc: 'Compensation assessed vs. disbursed analysis, pending payments, and beneficiary coverage statistics.',
    status: 'available',
  },
  {
    icon: FileText,
    title: 'R&R Status Report',
    desc: 'Rehabilitation & Resettlement progress — affected families count, resettlement status, and entitlement distribution.',
    status: 'available',
  },
  {
    icon: Calendar,
    title: 'Timeline Adherence Report',
    desc: 'Statutory timeline monitoring for each acquisition stage with delay analysis and bottleneck identification.',
    status: 'coming_soon',
  },
  {
    icon: BarChart3,
    title: 'Executive Dashboard Export',
    desc: 'Customizable MIS reports with national/state/district level KPIs for decision-makers and policymakers.',
    status: 'coming_soon',
  },
  {
    icon: Download,
    title: 'Data Export (CSV/Excel)',
    desc: 'Bulk export of project, parcel, and stage data in CSV/Excel format for external analysis and reporting.',
    status: 'coming_soon',
  },
];

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-emerald-600" />
              Reports & Analytics
            </h1>
            <p className="text-gray-500 mt-1">
              Customizable MIS reports, trend analysis, and decision-support reports
            </p>
          </div>

          {/* Integration Notice */}
          <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-800">Report Generation — Placeholder</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Full report generation with PDF/Excel export, comparative analytics, and predictive insights 
                    requires integration with backend analytics engine and data aggregation services. 
                    Basic data is available through the Dashboard. Advanced reporting features are planned.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Types Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REPORT_TYPES.map((report, i) => {
              const Icon = report.icon;
              const isAvailable = report.status === 'available';
              return (
                <Card key={i} className={`border-gray-100 shadow-sm ${!isAvailable ? 'border-dashed opacity-75' : 'hover:shadow-md hover:border-emerald-100'} transition-all`}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg ${isAvailable ? 'bg-emerald-50' : 'bg-gray-50'} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${isAvailable ? 'text-emerald-600' : 'text-gray-400'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-gray-900">{report.title}</h3>
                          {!isAvailable && (
                            <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Coming Soon</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{report.desc}</p>
                        <div className="mt-3">
                          {isAvailable ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 gap-1.5 h-8 text-xs"
                              onClick={() => window.location.href = '/dashboard'}
                            >
                              <BarChart3 className="w-3 h-3" />
                              View in Dashboard
                            </Button>
                          ) : (
                            <span className="text-xs text-gray-400 italic">
                              Placeholder — requires analytics engine integration
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* API Integration Info */}
          <Card className="border-gray-100 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Government API Integration for Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { label: 'DILRMP Integration', desc: 'Land records cross-referencing for report validation' },
                  { label: 'PFMS Integration', desc: 'Real-time compensation payment status in financial reports' },
                  { label: 'NIC Cloud Analytics', desc: 'Hosted analytics engine for large-scale data processing' },
                  { label: 'DigiLocker', desc: 'Document verification and audit trail for report attachments' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-gray-50">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-gray-700">{item.label}</span>
                      <p className="text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
