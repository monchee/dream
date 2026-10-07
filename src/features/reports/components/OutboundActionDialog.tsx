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
} from 'lucide-react';
import { ClinicalWorkContext } from '@shared/types/clinicalWorkContext';
import { formatDate } from '@shared/utils';

export type OutboundActionType = 'print' | 'copy' | 'email';

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
}

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
}: OutboundActionDialogProps) {
  const [isBusy, setIsBusy] = useState(false);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  // R3: the dialog is invoked without a Radix trigger, so focus restoration to
  // the output control that opened it is handled here.
  const returnFocusRef = useRef<HTMLElement | null>(null);

  // Restores focus to the control that opened the dialog after it closes or
  // unmounts (SummaryScreen renders this component conditionally).
  const restoreFocusToTrigger = () => {
    const target = returnFocusRef.current;
    returnFocusRef.current = null;
    if (!target) return;
    requestAnimationFrame(() => {
      if (target.isConnected) target.focus();
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
    }
  };

  const details = getActionDetails();

  const handleConfirm = async () => {
    if (isBusy) return;
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
            disabled={isBusy}
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
