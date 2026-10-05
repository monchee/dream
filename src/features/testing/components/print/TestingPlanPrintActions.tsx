import React, { useState } from 'react';
import { Button } from '@/components/ui';
import { Copy, Mail, Printer } from 'lucide-react';
import { Patient } from '@shared/types';
import { OutboundActionDialog, OutboundActionType } from '@features/reports/components/OutboundActionDialog';

interface TestingPlanPrintActionsProps {
  patient: Patient;
  reactionDate?: string;
  onPrint: () => void;
  onCopy: () => Promise<void>;
  onEmail: () => void;
}

/**
 * Screen-only controls of the testing request form: copy / email / print
 * triggers and the shared outbound confirmation dialog (plan 003 / F1).
 * The confirm handlers stay with the parent; this component owns only the
 * which-action-is-pending state. Hidden entirely in print.
 */
const TestingPlanPrintActions: React.FC<TestingPlanPrintActionsProps> = ({
  patient,
  reactionDate,
  onPrint,
  onCopy,
  onEmail,
}) => {
  const [activeOutboundAction, setActiveOutboundAction] = useState<OutboundActionType | null>(null);

  return (
    <>
      {/* Screen-only Controls */}
      <div className="p-4 border-b border-border bg-muted flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-2 rounded-none print:hidden">
        <p className="text-lg font-semibold tracking-tight text-foreground">Testing Request Form</p>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button size="sm" variant="outline" onClick={() => setActiveOutboundAction('copy')} className="rounded-none">
            <Copy className="w-4 h-4 mr-2" /> Copy as Text
          </Button>
          <Button size="sm" variant="outline" onClick={() => setActiveOutboundAction('email')} className="rounded-none">
            <Mail className="w-4 h-4 mr-2" /> Email to Allergy Nurse
          </Button>
          <Button size="sm" onClick={() => setActiveOutboundAction('print')} className="rounded-none">
            <Printer className="w-4 h-4 mr-2" /> Print Now
          </Button>
        </div>
      </div>

      {activeOutboundAction && (
        <OutboundActionDialog
          open={Boolean(activeOutboundAction)}
          onOpenChange={(open) => {
            if (!open) setActiveOutboundAction(null);
          }}
          actionType={activeOutboundAction}
          artifactTitle="Testing Request Form"
          patientName={`${patient.lastName.toUpperCase()}, ${patient.firstName}`}
          mrn={patient.mrn}
          dob={patient.dob}
          testingDate={reactionDate || undefined}
          destination={
            activeOutboundAction === 'email'
              ? 'SLHD-RPA-allergynurses@health.nsw.gov.au'
              : undefined
          }
          disclosureMode="Identified Clinical Request Form"
          onConfirm={async () => {
            if (activeOutboundAction === 'print') {
              onPrint();
            } else if (activeOutboundAction === 'copy') {
              await onCopy();
            } else if (activeOutboundAction === 'email') {
              onEmail();
            }
          }}
        />
      )}
    </>
  );
};

export default TestingPlanPrintActions;
