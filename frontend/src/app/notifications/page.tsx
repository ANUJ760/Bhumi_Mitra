'use client';

import React from 'react';
import { ProtectedRoute } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Mail, MessageSquare, Clock, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

const PLACEHOLDER_NOTIFICATIONS = [
  {
    type: 'warning',
    icon: AlertTriangle,
    title: 'Pending Project Approval',
    desc: 'Project "Mumbai-Pune Highway Extension" is awaiting State Admin approval for 7 days.',
    time: '2 hours ago',
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-50',
  },
  {
    type: 'info',
    icon: Info,
    title: 'Compensation Assessment Due',
    desc: 'Parcel ULPIN-MH-PUN-1003 compensation assessment deadline approaching in 3 days.',
    time: '5 hours ago',
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-50',
  },
  {
    type: 'success',
    icon: CheckCircle2,
    title: 'Stage Completed',
    desc: 'Notification stage for ULPIN-MH-PUN-1001 has been marked as completed.',
    time: '1 day ago',
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-50',
  },
  {
    type: 'warning',
    icon: Clock,
    title: 'Statutory Timeline Alert',
    desc: 'R&R process for 3 parcels in Pune district is approaching statutory deadline.',
    time: '2 days ago',
    iconColor: 'text-orange-500',
    iconBg: 'bg-orange-50',
  },
];

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-6 h-6 text-emerald-600" />
              Notifications & Alerts
            </h1>
            <p className="text-gray-500 mt-1">
              Automated alerts for pending approvals, statutory timelines & milestone tracking
            </p>
          </div>

          {/* Integration Status */}
          <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-800">Notification Service — Placeholder</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Real-time notifications require integration with SMS Gateway (NIC/CDAC), Email APIs, and Push Notification services. 
                    These are configured as placeholders in the Government API Gateway module. When access to these services is granted, 
                    notifications will be delivered via SMS, email, and in-app alerts.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Channels */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Bell, label: 'In-App Alerts', status: 'Preview Mode', color: 'emerald' },
              { icon: MessageSquare, label: 'SMS Gateway', status: 'Pending API Access', color: 'gray' },
              { icon: Mail, label: 'Email Service', status: 'Pending API Access', color: 'gray' },
            ].map((ch, i) => (
              <Card key={i} className="border-gray-100 shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg ${ch.color === 'emerald' ? 'bg-emerald-50' : 'bg-gray-50'} flex items-center justify-center`}>
                    <ch.icon className={`w-4 h-4 ${ch.color === 'emerald' ? 'text-emerald-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{ch.label}</p>
                    <p className={`text-xs ${ch.color === 'emerald' ? 'text-emerald-600' : 'text-gray-400'}`}>{ch.status}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sample Notifications */}
          <Card className="border-gray-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900">
                Recent Alerts
                <span className="ml-2 text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Sample Data</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100">
                {PLACEHOLDER_NOTIFICATIONS.map((n, i) => {
                  const Icon = n.icon;
                  return (
                    <div key={i} className="flex items-start gap-3 p-4 hover:bg-gray-50/50 transition-colors">
                      <div className={`w-8 h-8 rounded-lg ${n.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Icon className={`w-4 h-4 ${n.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{n.desc}</p>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{n.time}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
