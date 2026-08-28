'use client';

import { Stage, StageName, StageStatus } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';

interface StageStatusListProps {
  stages: Stage[];
  onRecordEvent: (stageName: StageName) => void;
  canRecord: (stageName: StageName) => boolean;
}

export function StageStatusList({ stages, onRecordEvent, canRecord }: StageStatusListProps) {
  const order = [
    StageName.NOTIFICATION,
    StageName.AWARD,
    StageName.COMPENSATION,
    StageName.RNR,
    StageName.POSSESSION,
  ];

  const sortedStages = [...stages].sort((a, b) => {
    return order.indexOf(a.stage_name) - order.indexOf(b.stage_name);
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Stage Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Started</TableHead>
          <TableHead>Completed</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedStages.map((stage) => (
          <TableRow key={stage.id}>
            <TableCell className="font-semibold text-gray-900">{stage.stage_name}</TableCell>
            <TableCell>
              <StatusBadge status={stage.status} />
            </TableCell>
            <TableCell>
              {stage.started_at ? new Date(stage.started_at).toLocaleDateString() : '-'}
            </TableCell>
            <TableCell>
              {stage.completed_at ? new Date(stage.completed_at).toLocaleDateString() : '-'}
            </TableCell>
            <TableCell className="text-right">
              {stage.status !== StageStatus.COMPLETED && stage.status !== StageStatus.NOT_APPLICABLE && canRecord(stage.stage_name) && (
                <Button size="sm" className="bg-blue-900 hover:bg-blue-800 text-white" onClick={() => onRecordEvent(stage.stage_name)}>
                  Record Event
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
