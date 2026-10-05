import React from 'react';
import { Button } from '@/components/ui';
import { FileText, Stethoscope, TestTube2 } from 'lucide-react';
import { ClinicalContextBar } from '@features/patients/components/ClinicalContextBar';
import { ACTIVE_REPORT_TTL_MS } from '@shared/utils';
import { isDifferentPatient } from '@features/patients/utils/patientIdentity';
import { Patient, LogFormData, Screen, TestingPlanData } from '@shared/types';
import { ScreenChrome } from './types';
import { ScreenLayout } from '@core/components/ScreenLayout';
import LogPatientSelector from './log/LogPatientSelector';
import LogHistoryPanel from './log/LogHistoryPanel';
import LogEntryOptions from './log/LogEntryOptions';
import LogDialogs from './log/LogDialogs';

export interface LogScreenProps {
  chrome: ScreenChrome;
  appSubtitle: string;
  selectedPatient: Patient | null;
  lastSavedRecord: LogFormData | null;
  activeReportSavedAt: number | null;
  isPatientDialogOpen: boolean;
  setIsPatientDialogOpen: (open: boolean) => void;
  confirmClearOpen: boolean;
  setConfirmClearOpen: (open: boolean) => void;
  patients: Patient[];
  onPatientSelect: (patient: Patient) => void;
  onConfirmedPatientSelect?: (patient: Patient) => void;
  onManualDetailChange: (field: keyof Patient, value: string) => void;
  onToggleSuspectedAgent: (patientId: string, drugName: string) => void;
  onSetTestingPlanData: (data: TestingPlanData | null) => void;
  onProceedToTesting: () => void;
  onStartDirectTesting: () => void;
  onClearActiveReport: () => void;
  isTestingDraftDirty?: boolean;
  onResetForm?: () => void;
}

export function LogScreen({
  chrome,
  appSubtitle,
  selectedPatient,
  lastSavedRecord,
  activeReportSavedAt,
  isPatientDialogOpen,
  setIsPatientDialogOpen,
  confirmClearOpen,
  setConfirmClearOpen,
  patients,
  onPatientSelect,
  onConfirmedPatientSelect,
  onManualDetailChange,
  onToggleSuspectedAgent,
  onSetTestingPlanData,
  onProceedToTesting,
  onStartDirectTesting,
  onClearActiveReport,
  isTestingDraftDirty = false,
  onResetForm,
}: LogScreenProps) {
  const [confirmDiscardDraftOpen, setConfirmDiscardDraftOpen] = React.useState(false);
  const [pendingPatientToSelect, setPendingPatientToSelect] = React.useState<Patient | null>(null);
  const [confirmPatientSwitchOpen, setConfirmPatientSwitchOpen] = React.useState(false);

  const [manualPatientErrors, setManualPatientErrors] = React.useState<Record<'firstName' | 'lastName' | 'mrn', string>>({
    firstName: '',
    lastName: '',
    mrn: '',
  });

  const handleDirectTestingClick = () => {
    if (isTestingDraftDirty) {
      setConfirmDiscardDraftOpen(true);
    } else {
      onStartDirectTesting();
    }
  };

  const handlePatientSelectCandidate = (candidate: Patient) => {
    if (isTestingDraftDirty && isDifferentPatient(selectedPatient, candidate)) {
      setPendingPatientToSelect(candidate);
      setConfirmPatientSwitchOpen(true);
    } else {
      onPatientSelect(candidate);
    }
  };

  const handleConfirmPatientSwitch = () => {
    if (pendingPatientToSelect) {
      if (onConfirmedPatientSelect) {
        onConfirmedPatientSelect(pendingPatientToSelect);
      } else {
        onResetForm?.();
        onSetTestingPlanData(null);
        onPatientSelect(pendingPatientToSelect);
      }
      setPendingPatientToSelect(null);
    }
  };

  const activeReportExpiresIn = activeReportSavedAt
    ? (() => {
        const msLeft = ACTIVE_REPORT_TTL_MS - (Date.now() - activeReportSavedAt);
        if (msLeft <= 0) return null;
        const h = Math.floor(msLeft / 3_600_000);
        const m = Math.floor((msLeft % 3_600_000) / 60_000);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
      })()
    : null;

  const activeReportInitials = lastSavedRecord
    ? [lastSavedRecord.firstName?.[0], lastSavedRecord.lastName?.[0]].filter(Boolean).map(initial => `${initial}.`).join(' ') || 'Active patient'
    : '';

  const handleManualPatientSave = () => {
    if (!selectedPatient) return;
    const errors = {
      firstName: selectedPatient.firstName.trim() ? '' : 'First name is required.',
      lastName: selectedPatient.lastName.trim() ? '' : 'Last name is required.',
      mrn: selectedPatient.mrn.trim() ? '' : 'REDCap ID is required.',
    };
    setManualPatientErrors(errors);
    if (Object.values(errors).some(Boolean)) return;
    setIsPatientDialogOpen(false);
  };

  // Active work banner items
  const renderActiveReportBanner = () => {
    if (!lastSavedRecord || !activeReportExpiresIn) return null;
    return (
      <div
        key="active-report-banner"
        className="no-print flex items-center justify-between px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-none gap-3"
      >
        <div className="flex items-center gap-2 text-sm min-w-0">
          <FileText className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
          <span className="truncate text-foreground">
            Active report: <strong>{activeReportInitials}</strong>
            <span className="text-muted-foreground text-xs ml-2">· expires in {activeReportExpiresIn}</span>
          </span>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => (chrome.navigate ? chrome.navigate(Screen.SUMMARY) : chrome.setScreen(Screen.SUMMARY))}
            className="rounded-none h-9 text-xs btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Open Report
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setConfirmClearOpen(true)}
            className="rounded-none h-9 text-xs text-muted-foreground hover:text-destructive btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Clear
          </Button>
        </div>
      </div>
    );
  };

  const renderTestingDraftBanner = () => {
    if (!isTestingDraftDirty) return null;
    return (
      <div
        key="testing-draft-banner"
        className="no-print flex items-center justify-between px-4 py-2.5 bg-status-warning/10 border border-status-warning/30 rounded-none gap-3"
      >
        <div className="flex items-center gap-2 text-sm min-w-0">
          <TestTube2 className="w-4 h-4 text-status-warning shrink-0" aria-hidden="true" />
          <span className="truncate text-foreground">
            In-progress testing session
            <span className="text-muted-foreground text-xs ml-2">· uncommitted draft kept locally</span>
          </span>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            size="sm"
            onClick={() => (chrome.navigate ? chrome.navigate(Screen.TESTING) : chrome.setScreen(Screen.TESTING))}
            className="rounded-none h-9 text-xs bg-status-warning hover:bg-status-warning/90 text-status-warning-foreground font-semibold btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-warning"
          >
            Resume Testing
          </Button>
        </div>
      </div>
    );
  };

  return (
    <ScreenLayout
      chrome={chrome}
      title="DREAM"
      subtitle={appSubtitle}
      icon={<Stethoscope className="w-5 h-5" />}
      contextBar={selectedPatient ? (
        <ClinicalContextBar
          firstName={selectedPatient.firstName}
          lastName={selectedPatient.lastName}
          mrn={selectedPatient.mrn}
          dob={selectedPatient.dob}
          reactionDate={selectedPatient.history?.date}
          source={selectedPatient.id === 'manual' ? 'manual' : 'database'}
        />
      ) : undefined}
      contentClassName="py-3 space-y-4"
      className="pb-10"
    >
      {/* Contextual Active Work Banners */}
      <div className="space-y-2">
        {renderActiveReportBanner()}
        {renderTestingDraftBanner()}
      </div>

      {/* Confirm dialogs and the manual patient editor */}
      <LogDialogs
        selectedPatient={selectedPatient}
        lastSavedRecord={lastSavedRecord}
        confirmClearOpen={confirmClearOpen}
        setConfirmClearOpen={setConfirmClearOpen}
        confirmDiscardDraftOpen={confirmDiscardDraftOpen}
        setConfirmDiscardDraftOpen={setConfirmDiscardDraftOpen}
        confirmPatientSwitchOpen={confirmPatientSwitchOpen}
        setConfirmPatientSwitchOpen={setConfirmPatientSwitchOpen}
        setPendingPatientToSelect={setPendingPatientToSelect}
        pendingPatientToSelect={pendingPatientToSelect}
        onClearActiveReport={onClearActiveReport}
        onConfirmDiscardDraft={onStartDirectTesting}
        onConfirmPatientSwitch={handleConfirmPatientSwitch}
        isPatientDialogOpen={isPatientDialogOpen}
        setIsPatientDialogOpen={setIsPatientDialogOpen}
        manualPatientErrors={manualPatientErrors}
        setManualPatientErrors={setManualPatientErrors}
        onManualDetailChange={onManualDetailChange}
        onManualPatientSave={handleManualPatientSave}
      />

      {/* Stable Home Layout: Patient Selection first, then Quick Start actions and Info Cards */}
      <LogPatientSelector
        selectedPatient={selectedPatient}
        patients={patients}
        onSelectPatient={handlePatientSelectCandidate}
        onEditDetails={() => setIsPatientDialogOpen(true)}
      />
      {!selectedPatient && <LogEntryOptions chrome={chrome} onStartTesting={handleDirectTestingClick} />}

      {/* Selected Patient History & Plan Generator */}
      {selectedPatient && (
        <LogHistoryPanel
          chrome={chrome}
          selectedPatient={selectedPatient}
          onToggleSuspectedAgent={onToggleSuspectedAgent}
          onSetTestingPlanData={onSetTestingPlanData}
          onProceedToTesting={onProceedToTesting}
        />
      )}
    </ScreenLayout>
  );
}

export default LogScreen;
