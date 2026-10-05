import React from 'react';
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Input, Label } from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { LogFormData, Patient } from '@shared/types';

interface LogDialogsProps {
  selectedPatient: Patient | null;
  lastSavedRecord: LogFormData | null;
  confirmClearOpen: boolean;
  setConfirmClearOpen: (open: boolean) => void;
  confirmDiscardDraftOpen: boolean;
  setConfirmDiscardDraftOpen: (open: boolean) => void;
  confirmPatientSwitchOpen: boolean;
  setConfirmPatientSwitchOpen: (open: boolean) => void;
  setPendingPatientToSelect: (patient: Patient | null) => void;
  pendingPatientToSelect: Patient | null;
  onClearActiveReport: () => void;
  onConfirmDiscardDraft: () => void;
  onConfirmPatientSwitch: () => void;
  isPatientDialogOpen: boolean;
  setIsPatientDialogOpen: (open: boolean) => void;
  manualPatientErrors: Record<'firstName' | 'lastName' | 'mrn', string>;
  setManualPatientErrors: React.Dispatch<React.SetStateAction<Record<'firstName' | 'lastName' | 'mrn', string>>>;
  onManualDetailChange: (field: keyof Patient, value: string) => void;
  onManualPatientSave: () => void;
}

/**
 * All confirmations and the manual-patient editor dialog of the home screen
 * (plan 003 / F1). Pure rendering: every open/close and confirm handler is
 * owned by the parent LogScreen.
 */
const LogDialogs: React.FC<LogDialogsProps> = ({
  selectedPatient,
  lastSavedRecord,
  confirmClearOpen,
  setConfirmClearOpen,
  confirmDiscardDraftOpen,
  setConfirmDiscardDraftOpen,
  confirmPatientSwitchOpen,
  setConfirmPatientSwitchOpen,
  setPendingPatientToSelect,
  pendingPatientToSelect,
  onClearActiveReport,
  onConfirmDiscardDraft,
  onConfirmPatientSwitch,
  isPatientDialogOpen,
  setIsPatientDialogOpen,
  manualPatientErrors,
  setManualPatientErrors,
  onManualDetailChange,
  onManualPatientSave,
}) => {
  return (
    <>
      <ConfirmDialog
        open={confirmClearOpen}
        onOpenChange={setConfirmClearOpen}
        title="Clear active report?"
        message={`This permanently removes the current report${lastSavedRecord ? ` for ${lastSavedRecord.firstName} ${lastSavedRecord.lastName}` : ''} and any in-progress testing draft from this device. This cannot be undone.`}
        confirmLabel="Clear report"
        variant="danger"
        onConfirm={onClearActiveReport}
      />

      <ConfirmDialog
        open={confirmDiscardDraftOpen}
        onOpenChange={setConfirmDiscardDraftOpen}
        title="Start fresh testing session?"
        message="You have unsaved changes in your current testing session. Starting a fresh session will discard these changes. This cannot be undone."
        confirmLabel="Start fresh session"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={onConfirmDiscardDraft}
      />

      <ConfirmDialog
        open={confirmPatientSwitchOpen}
        onOpenChange={(open) => {
          setConfirmPatientSwitchOpen(open);
          if (!open) setPendingPatientToSelect(null);
        }}
        title="Switch patient?"
        message={`You have unsaved changes in your current testing session.${selectedPatient ? ` Current: ${selectedPatient.lastName ? `${selectedPatient.lastName.toUpperCase()}, ${selectedPatient.firstName}` : selectedPatient.firstName} (REDCap ID: ${selectedPatient.mrn || '—'}, DOB: ${selectedPatient.dob || 'not recorded'}).` : ''}${pendingPatientToSelect ? ` Target: ${pendingPatientToSelect.lastName ? `${pendingPatientToSelect.lastName.toUpperCase()}, ${pendingPatientToSelect.firstName}` : pendingPatientToSelect.firstName} (REDCap ID: ${pendingPatientToSelect.mrn || '—'}, DOB: ${pendingPatientToSelect.dob || 'not recorded'}).` : ''} Switching patients will discard these changes. This cannot be undone.`}
        confirmLabel="Switch patient"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={onConfirmPatientSwitch}
      />

      {/* Manual Patient Dialog */}
      {selectedPatient?.id === 'manual' && (
        <Dialog open={isPatientDialogOpen} onOpenChange={setIsPatientDialogOpen}>
          <DialogContent className="max-w-2xl rounded-none">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-foreground">
                New Patient Details
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="manual-first-name" className="section-label mb-1.5 block">
                    First Name<span className="text-destructive ml-0.5" aria-hidden="true">*</span>
                  </Label>
                  <Input
                    id="manual-first-name"
                    className="rounded-none"
                    value={selectedPatient.firstName}
                    onChange={(e) => {
                      onManualDetailChange('firstName', e.target.value);
                      setManualPatientErrors(prev => ({ ...prev, firstName: '' }));
                    }}
                    placeholder="Enter first name"
                    aria-invalid={!!manualPatientErrors.firstName}
                    aria-describedby={manualPatientErrors.firstName ? 'manual-first-name-error' : undefined}
                  />
                  {manualPatientErrors.firstName && (
                    <p id="manual-first-name-error" className="text-destructive text-xs mt-1">
                      {manualPatientErrors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="manual-last-name" className="section-label mb-1.5 block">
                    Last Name<span className="text-destructive ml-0.5" aria-hidden="true">*</span>
                  </Label>
                  <Input
                    id="manual-last-name"
                    className="rounded-none"
                    value={selectedPatient.lastName}
                    onChange={(e) => {
                      onManualDetailChange('lastName', e.target.value);
                      setManualPatientErrors(prev => ({ ...prev, lastName: '' }));
                    }}
                    placeholder="Enter last name"
                    aria-invalid={!!manualPatientErrors.lastName}
                    aria-describedby={manualPatientErrors.lastName ? 'manual-last-name-error' : undefined}
                  />
                  {manualPatientErrors.lastName && (
                    <p id="manual-last-name-error" className="text-destructive text-xs mt-1">
                      {manualPatientErrors.lastName}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="manual-mrn" className="section-label mb-1.5 block">
                    REDCap ID<span className="text-destructive ml-0.5" aria-hidden="true">*</span>
                  </Label>
                  <Input
                    id="manual-mrn"
                    className="rounded-none font-mono"
                    value={selectedPatient.mrn}
                    onChange={(e) => {
                      onManualDetailChange('mrn', e.target.value);
                      setManualPatientErrors(prev => ({ ...prev, mrn: '' }));
                    }}
                    placeholder="REDCap ID..."
                    aria-invalid={!!manualPatientErrors.mrn}
                    aria-describedby={manualPatientErrors.mrn ? 'manual-mrn-error' : undefined}
                  />
                  {manualPatientErrors.mrn && (
                    <p id="manual-mrn-error" className="text-destructive text-xs mt-1">
                      {manualPatientErrors.mrn}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="manual-redcap-id" className="section-label mb-1.5 block">
                    REDCap Record ID (secondary)
                  </Label>
                  <Input
                    id="manual-redcap-id"
                    className="rounded-none font-mono"
                    value={selectedPatient.redcapId || ''}
                    onChange={(e) => onManualDetailChange('redcapId', e.target.value)}
                    placeholder="Secondary ID..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="manual-dob" className="section-label mb-1.5 block">
                    Date of Birth
                  </Label>
                  <Input
                    id="manual-dob"
                    className="rounded-none"
                    type="date"
                    value={selectedPatient.dob}
                    onChange={(e) => onManualDetailChange('dob', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="manual-gender" className="section-label mb-1.5 block">
                    Gender
                  </Label>
                  <Input
                    id="manual-gender"
                    className="rounded-none"
                    value={selectedPatient.gender}
                    onChange={(e) => onManualDetailChange('gender', e.target.value)}
                    placeholder="Gender..."
                  />
                </div>
                <div>
                  <Label htmlFor="manual-city" className="section-label mb-1.5 block">
                    City / Suburb
                  </Label>
                  <Input
                    id="manual-city"
                    className="rounded-none"
                    value={selectedPatient.city}
                    onChange={(e) => onManualDetailChange('city', e.target.value)}
                    placeholder="City..."
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={onManualPatientSave}
                className="rounded-none btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Save & Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default LogDialogs;
