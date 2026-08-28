import { Badge } from '@/components/ui/badge';
import { ProjectStatus, ParcelStatus, StageStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: ProjectStatus | ParcelStatus | StageStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
  let className = '';

  switch (status) {
    case 'PROPOSED':
    case 'PENDING':
      variant = 'outline';
      className = 'bg-yellow-100 text-yellow-800 border-yellow-200';
      break;
    case 'APPROVED':
      variant = 'default';
      className = 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      break;
    case 'ACTIVE':
    case 'IN_PROGRESS':
      variant = 'default';
      className = 'bg-orange-100 text-orange-800 hover:bg-orange-100';
      break;
    case 'COMPLETED':
      variant = 'secondary';
      className = 'bg-green-100 text-green-800';
      break;
    case 'REJECTED':
      variant = 'destructive';
      className = 'bg-red-100 text-red-800';
      break;
    case 'NOT_APPLICABLE':
      variant = 'secondary';
      className = 'bg-slate-100 text-slate-800';
      break;
    default:
      className = 'bg-gray-100 text-gray-800';
  }

  return <Badge variant={variant} className={className}>{status}</Badge>;
}
