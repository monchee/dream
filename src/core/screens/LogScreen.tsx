import React from 'react';
import {
  ChevronRight,
  FileText,
  Info,
  Pencil,
  Shield,
  Stethoscope,
  Target,
  TestTube2,
  User,
  Users,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@/components/ui';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import PatientSelector from '@features/patients/components/PatientSelector';
import PatientHistory from '@features/patients/components/PatientHistory';
import { ClinicalContextBar } from '@features/patients/components/ClinicalContextBar';
import TestingPlanGenerator from '@features/testing/components/TestingPlanGenerator';
import { ACTIVE_REPORT_TTL_MS } from '@shared/utils';
import { DRUG_CATEGORIES } from '@shared/utils/constants';
import { isDifferentPatient } from '@features/patients/utils/patientIdentity';
import { Patient, LogFormData, Screen, TestingPlanData } from '@shared/types';
import { ScreenChrome } from './types';
import { ScreenLayout } from '@core/components/ScreenLayout';
import { GetStartedActions } from '@core/components/GetStartedActions';

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

  const renderActiveWorkBanners = () => (
    <div className="space-y-2">
      {renderActiveReportBanner()}
      {renderTestingDraftBanner()}
    </div>
  );

  // Quick-start actions panel
  const renderQuickStartActions = () => (
    <GetStartedActions
      variant="page"
      onUpload={() => (chrome.onCSVUploadSheetOpenChange ? chrome.onCSVUploadSheetOpenChange(true) : undefined)}
      onStartTesting={handleDirectTestingClick}
    />
  );

  // Patient selection card
  const renderPatientSelectionCard = () => (
    <Card elevation="raised">
      <CardHeader bordered className="bg-card">
        <CardTitle as="h2" className="flex items-center gap-2 text-base text-foreground">
          <div className="bg-primary/10 dark:bg-primary/20 p-1.5 rounded-none">
            <User className="w-4 h-4 text-primary" aria-hidden="true" />
          </div>
          Patient Selection
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          <div className="flex items-end gap-2 w-full">
            <PatientSelector
              onSelectPatient={handlePatientSelectCandidate}
              selectedPatientId={selectedPatient?.id}
              patients={patients}
            />
            {selectedPatient?.id === 'manual' && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsPatientDialogOpen(true)}
                className="mb-[1px] shrink-0 h-10 w-10 rounded-none btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                title="Edit Details"
                aria-label="Edit manual patient details"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Info and getting started cards
  const renderInfoCards = () => (
    <>
      <Card elevation="raised" className="border-primary/20 bg-primary/5 dark:bg-card/40">
        <CardContent>
          <div className="flex gap-3">
            <div className="bg-primary/10 dark:bg-primary/20 p-1.5 rounded-none h-fit mt-0.5">
              <Info className="w-4 h-4 text-primary" aria-hidden="true" />
            </div>
            <div className="space-y-3">
              <CardTitle as="h2" className="text-sm text-foreground">
                Welcome — here's how to get started
              </CardTitle>
              <ol className="space-y-1.5 text-sm text-foreground/85">
                <li className="flex gap-2">
                  <span className="font-semibold text-primary shrink-0">1.</span>
                  <span>
                    Select a patient from the dropdown above — search by name, ID, or date of birth. Choose <strong>New Patient (Manual Entry)</strong> if the patient is not in the database.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-primary shrink-0">2.</span>
                  <span>
                    If your patient database isn't loaded yet,{' '}
                    <button
                      onClick={() => (chrome.onCSVUploadSheetOpenChange ? chrome.onCSVUploadSheetOpenChange(true) : undefined)}
                      className="underline text-primary hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      upload a patient CSV
                    </button>
                    .
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-primary shrink-0">3.</span>
                  <span>
                    Once a patient is selected, review their allergy history and generate a personalised drug testing plan.
                  </span>
                </li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card elevation="flat">
          <CardContent>
            <div className="flex items-start gap-3">
              <Stethoscope className="w-6 h-6 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <CardTitle as="h2" className="text-sm text-foreground mb-1">The DREAM App</CardTitle>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  A specialist service for patients who have experienced a suspected allergic reaction
                  during an anaesthetic. Our team investigates these reactions to identify the drug
                  responsible and help plan safe anaesthesia for future procedures.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid sm:grid-cols-2 gap-4">
          <Card elevation="flat">
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-primary" aria-hidden="true" />
                <CardTitle as="h2" className="text-sm text-foreground">Purpose</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Helps clinicians prepare for allergy clinic appointments — reviewing patient histories,
                recording test results, and generating reports and testing plans.
              </p>
            </CardContent>
          </Card>
          <Card elevation="flat">
            <CardContent>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-primary" aria-hidden="true" />
                <CardTitle as="h2" className="text-sm text-foreground">Data Privacy</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Patient data is processed on your own device and never sent to external servers.
                Anything held locally is automatically cleared after 6 hours, so nothing lingers
                on a shared workstation.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card elevation="flat">
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-primary" aria-hidden="true" />
              <CardTitle as="h2" className="text-sm text-foreground">Key Features</CardTitle>
            </div>
            <ul className="grid sm:grid-cols-2 gap-2">
              {[
                'Dashboard showing patient statistics at a glance',
                'Search and filter patients by name, reaction grade, and date',
                'Detailed patient history and timeline views',
                'Skin test and drug challenge result recording',
                'Three report types: clinical report, patient handout, and Powerchart Letter',
                'Create and print testing plan request forms for nursing staff',
                'Import patient records from your clinic database',
                'Works offline — use the app without internet access',
              ].map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-0.5 shrink-0" aria-hidden="true">
                    •
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );

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
      {renderActiveWorkBanners()}

      {/* Confirm dialogs */}
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
        onConfirm={onStartDirectTesting}
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
        onConfirm={handleConfirmPatientSwitch}
      />

      {/* Stable Home Layout: Patient Selection first, then Quick Start actions and Info Cards */}
      {renderPatientSelectionCard()}
      {!selectedPatient && renderQuickStartActions()}
      {!selectedPatient && renderInfoCards()}

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
                onClick={handleManualPatientSave}
                className="rounded-none btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Save & Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Selected Patient History & Plan Generator */}
      {selectedPatient && (
        <div key={selectedPatient.id} className="space-y-8">
          {selectedPatient.id !== 'manual' && (
            <div style={{ '--section-index': 0 } as React.CSSProperties} className="animate-section-reveal">
              <PatientHistory
                patient={selectedPatient}
                onToggleSuspectedAgent={(drugName) => onToggleSuspectedAgent(selectedPatient.id, drugName)}
              />
            </div>
          )}
          <div style={{ '--section-index': selectedPatient.id !== 'manual' ? 1 : 0 } as React.CSSProperties} className="animate-section-reveal">
            <TestingPlanGenerator
              patient={selectedPatient}
              drugCategories={DRUG_CATEGORIES}
              onPreview={(data) => {
                onSetTestingPlanData(data);
                if (chrome.navigate) {
                  chrome.navigate(Screen.PRINT_PLAN);
                } else {
                  chrome.setScreen(Screen.PRINT_PLAN);
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
          <div style={{ '--section-index': selectedPatient.id !== 'manual' ? 2 : 1 } as React.CSSProperties} className="animate-section-reveal">
            <div className="flex justify-end pt-4">
              <Button
                size="lg"
                className="w-full sm:w-auto text-base py-6 rounded-none bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors btn-press focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={onProceedToTesting}
              >
                Start Testing Session <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </ScreenLayout>
  );
}

export default LogScreen;
