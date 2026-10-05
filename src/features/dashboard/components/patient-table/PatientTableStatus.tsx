import React from 'react';
import { Badge } from '@/components/ui';
import { type PatientStatusResult, type PatientWorkflowStatus } from '@shared/utils/patientStatus';

const STATUS_BADGES: Record<PatientWorkflowStatus, {
  label: string;
  variant: 'outline' | 'info' | 'warning' | 'success';
}> = {
  referral: { label: 'Referral', variant: 'outline' },
  'plan-drafted': { label: 'Plan drafted', variant: 'info' },
  testing: { label: 'Testing', variant: 'warning' },
  reported: { label: 'Reported', variant: 'success' },
};

/**
 * Workflow status and outstanding-documents badges for a worklist row
 * (plan 003 / F1). Pure rendering.
 */
const PatientTableStatus: React.FC<{ result: PatientStatusResult }> = ({ result }) => {
  const statusBadge = STATUS_BADGES[result.status];

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Badge variant={statusBadge.variant} className="whitespace-nowrap px-2 py-0 text-xs leading-5">
        {statusBadge.label}
      </Badge>
      {result.docsOutstanding ? (
        <Badge variant="warning" className="whitespace-nowrap px-2 py-0 text-xs leading-5">
          Docs outstanding
        </Badge>
      ) : null}
    </div>
  );
};

export default PatientTableStatus;
