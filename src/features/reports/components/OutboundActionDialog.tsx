import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
} from '@/components/ui';
import {
  Printer,
  Copy,
  Mail,
  Database,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { ClinicalWorkContext } from '@shared/types/clinicalWorkContext';
import { formatDate } from '@shared/utils';

export type OutboundActionType = 'print' | 'copy' | 'email' | 'research';

export interface OutboundActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionType: OutboundActionType;
  artifactTitle: string;
  workContext?: ClinicalWorkContext | null;
  patientName?: string;
  mrn?: string;
  dob?: string;
  testingDate?: string;
  destination?: string;
  disclosureMode?: string;
  isRedacted?: boolean;
  onConfirm: () => Promise<void> | void;
  researchAlreadySubmitted?: boolean;
}

const RESEARCH_FIELD_CATEGORIES = [
  'Visit date',
  'Control measurements (Histamine SPT, Saline SPT, Saline IDT)',
  'Tested drug names and skin/intradermal test wheal measurements',
  'Total drugs tested and positive test counts',
  'Drug challenge flag, challenge drug, and challenge outcome',
  'Reaction time, clinical symptoms, and intervention (when reaction occurred)',
  'Assessment & clinical plan',
  'App version and optional REDCap record ID (when present)',
];

export function OutboundActionDialog({
  open,
  onOpenChange,
  actionType,
  artifactTitle,
  workContext,
  patientName: propPatientName,
  mrn: propMrn,
  dob: propDob,
  testingDate: propTestingDate,
  destination: propDestination,
  disclosureMode: propDisclosureMode,
  isRedacted = false,
  onConfirm,
  researchAlreadySubmitted = false,
}: OutboundActionDialogProps) {
  const [isBusy, setIsBusy] = useState(false);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  // R3: the dialog is invoked without a Radix trigger, so focus restoration to
  // the output control that opened it is handled here.
  const returnFocusRef = useRef<HTMLElement | null>(null);

  // Restores focus to the control that opened the dialog; if that control was
  // removed while the dialog was open (e.g. a successful research submission
  // replaces its own button with a status banner), move focus to the status
  // banner instead so focus never falls back to the document.
  const restoreFocusToTrigger = () => {
    const target = returnFocusRef.current;
    returnFocusRef.current = null;
    if (!target) return;
    requestAnimationFrame(() => {
      if (target.isConnected) {
        target.focus();
        return;
      }
      const fallback = document.getElementById('research-submission-status');
      fallback?.focus?.();
    });
  };

  useEffect(() => {
    if (open) {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      // Production closes by unmounting this component (SummaryScreen renders
      // it conditionally), so the cleanup is the reliable restoration path.
      return () => restoreFocusToTrigger();
    }
    restoreFocusToTrigger();
    return undefined;
  }, [open]);

  const patientName =
    propPatientName ??
    (workContext ? `${workContext.lastName.toUpperCase()}, ${workContext.firstName}` : '—');
  const mrn = propMrn ?? workContext?.mrn ?? '—';
  const dob = propDob ?? workContext?.dob;
  const testingDate = propTestingDate ?? workContext?.testingVisitDate;

  const getActionDetails = () => {
    switch (actionType) {
      case 'print':
        return {
          title: `Confirm Print: ${artifactTitle}`,
          icon: <Printer className="w-5 h-5 text-primary" />,
          confirmLabel: 'Open Print Dialog',
          destination: propDestination || 'System Print Dialog',
          disclosure: propDisclosureMode || (isRedacted ? 'Redacted (Blackout Identifiers)' : 'Identified Clinical Document'),
          description: 'Review the document destination and bound clinical identity before printing.',
        };
      case 'copy':
        return {
          title: `Confirm Copy: ${artifactTitle}`,
          icon: <Copy className="w-5 h-5 text-primary" />,
          confirmLabel: 'Copy to Clipboard',
          destination: propDestination || 'Local Device Clipboard',
          disclosure: propDisclosureMode || (isRedacted ? 'Redacted Text (Identified Redacted)' : 'Full Plain Text with Identifiers'),
          description: 'The selected document text will be copied to your clipboard.',
        };
      case 'email':
        return {
          title: `Confirm Email: ${artifactTitle}`,
          icon: <Mail className="w-5 h-5 text-primary" />,
          confirmLabel: 'Open Email Client',
          destination: propDestination || 'Default Email Client (mailto)',
          disclosure: propDisclosureMode || (isRedacted ? 'Redacted Email Body' : 'Standard Clinical Email Body'),
          description: 'Review the email recipient and bound patient identity before launching your email client.',
        };
      case 'research':
        return {
          title: 'Confirm ANZTADC Research Submission',
          icon: <Database className="w-5 h-5 text-primary" />,
          confirmLabel: researchAlreadySubmitted ? 'Already Submitted' : 'Confirm & Submit to Research Registry',
          destination: propDestination || 'ANZTADC Secure Research Database',
          disclosure: propDisclosureMode || 'De-identified (patient direct identifiers: name, REDCap ID, DOB, contacts omitted)',
          description:
            'Confirm transmission of de-identified clinical testing results to the anaesthetic reaction registry. Patient direct identifiers (name, REDCap ID, DOB, contacts) are omitted prior to transmission.',
        };
    }
  };

  const details = getActionDetails();

  const handleConfirm = async () => {
    if (isBusy || (actionType === 'research' && researchAlreadySubmitted)) return;
    try {
      setIsBusy(true);
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-lg rounded-none border-border p-6 shadow-lg"
        aria-busy={isBusy}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          cancelBtnRef.current?.focus();
        }}
      >
        <DialogHeader className="space-y-2 border-b border-border pb-3">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <div className="bg-primary/10 p-1.5 rounded-none">{details.icon}</div>
            <span>{details.title}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {details.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm text-foreground">
          {/* Identity and Destination Summary */}
          <div className="border border-border bg-muted/30 p-3 space-y-2 rounded-none text-xs">
            <div className="grid grid-cols-[110px_1fr] gap-1">
              <span className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">
                Artifact:
              </span>
              <span className="font-medium text-foreground">{artifactTitle}</span>

              <span className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">
                Patient:
              </span>
              <span className="font-semibold text-foreground">{patientName}</span>

              <span className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">
                REDCap ID:
              </span>
              <span className="font-mono text-foreground">{mrn}</span>

              <span className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">
                DOB:
              </span>
              <span>{dob ? formatDate(dob) : 'Not recorded'}</span>

              <span className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">
                Visit Date:
              </span>
              <span>{testingDate ? formatDate(testingDate) : '—'}</span>

              <span className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">
                Destination:
              </span>
              <span className="font-mono text-foreground">{details.destination}</span>

              <span className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">
                Disclosure:
              </span>
              <span className="font-medium text-foreground">{details.disclosure}</span>
            </div>
          </div>

          {/* Special Research Details */}
          {actionType === 'research' && (
            <div className="space-y-2 border border-primary/20 bg-primary/5 p-3 rounded-none">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <ShieldAlert className="w-4 h-4" />
                <span>Transmitted Field Categories:</span>
              </div>
              <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1 pl-1">
                {RESEARCH_FIELD_CATEGORIES.map((cat, idx) => (
                  <li key={idx}>{cat}</li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground pt-1 border-t border-primary/10 italic">
                Note: Patient direct identifiers (name, REDCap ID, DOB, contacts) are omitted.
              </p>
            </div>
          )}

          {actionType === 'research' && researchAlreadySubmitted && (
            <div className="flex items-center gap-2 p-2 border border-status-success/30 bg-status-success/10 text-status-success text-xs font-medium rounded-none">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>This record has already been submitted to the research registry during this session.</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 border-t border-border pt-4 sm:justify-end">
          <Button
            ref={cancelBtnRef}
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isBusy}
            className="rounded-none min-h-[44px] px-4 btn-press"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isBusy || (actionType === 'research' && researchAlreadySubmitted)}
            className="rounded-none min-h-[44px] px-5 bg-primary text-primary-foreground font-semibold shadow-sm btn-press"
          >
            {isBusy ? 'Processing...' : details.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default OutboundActionDialog;
