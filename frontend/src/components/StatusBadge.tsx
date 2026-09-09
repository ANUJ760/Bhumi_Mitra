'use client';

import React from 'react';

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  // Project statuses
  PROPOSED: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  APPROVED: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  ACTIVE: { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500' },
  COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  REJECTED: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  // Parcel / Stage statuses
  PENDING: { bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400' },
  IN_PROGRESS: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  NOT_APPLICABLE: { bg: 'bg-gray-50', text: 'text-gray-500', dot: 'bg-gray-400' },
  // Payment statuses
  ASSESSED: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  DISBURSED: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' };
  const label = status.replace(/_/g, ' ');

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {label}
    </span>
  );
}

export default StatusBadge;
