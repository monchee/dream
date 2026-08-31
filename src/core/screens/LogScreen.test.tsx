import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Screen, Patient } from '@shared/types';
import { createMockLogFormData } from '@/src/test/factories/testingDataFactory';
import { createMockPatient } from '@/src/test/factories/patientFactory';
import { LogScreen } from './LogScreen';

vi.mock('@core/components/ScreenLayout', () => ({
  ScreenLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@features/patients/components/PatientSelector', () => ({
  default: ({ onSelectPatient }: { onSelectPatient: (p: Patient) => void }) => (
    <div>
      <span>Patient selector</span>
      <button
        type="button"
        onClick={() =>
          onSelectPatient(createMockPatient({ id: 'new-patient-99', firstName: 'Sarah', lastName: 'Connor' }))
        }
      >
        Select Candidate Patient
      </button>
    </div>
  ),
}));

describe('LogScreen clear-report confirmation', () => {
  it('names the patient and irreversible consequence, then clears the report', () => {
    const onClearActiveReport = vi.fn();

    function Harness() {
      const [confirmClearOpen, setConfirmClearOpen] = React.useState(false);

      return (
        <LogScreen
          chrome={{
            setScreen: vi.fn(),
            currentScreen: Screen.LOG,
            databaseDate: '',
            showDisclaimer: false,
            isCustomData: false,
            onDismissDisclaimer: vi.fn(),
            onUploadPatients: vi.fn(),
            csvUploadSheetOpen: false,
            onCSVUploadSheetOpenChange: vi.fn(),
          }}
          appSubtitle=""
          selectedPatient={null}
          lastSavedRecord={createMockLogFormData({ firstName: 'Avery', lastName: 'Ng' })}
          activeReportSavedAt={Date.now()}
          isPatientDialogOpen={false}
          setIsPatientDialogOpen={vi.fn()}
          confirmClearOpen={confirmClearOpen}
          setConfirmClearOpen={setConfirmClearOpen}
          patients={[]}
          onPatientSelect={vi.fn()}
          onManualDetailChange={vi.fn()}
          onToggleSuspectedAgent={vi.fn()}
          onSetTestingPlanData={vi.fn()}
          onProceedToTesting={vi.fn()}
          onStartDirectTesting={vi.fn()}
          onClearActiveReport={onClearActiveReport}
        />
      );
    }

    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.getByRole('dialog')).toHaveTextContent('Clear active report?');
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'This permanently removes the current report for Avery Ng and any in-progress testing draft from this device. This cannot be undone.',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Clear report' }));

    expect(onClearActiveReport).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('LogScreen Home quick-start actions', () => {
  const defaultChrome = {
    setScreen: vi.fn(),
    currentScreen: Screen.LOG,
    databaseDate: '',
    showDisclaimer: false,
    isCustomData: false,
    onDismissDisclaimer: vi.fn(),
    onUploadPatients: vi.fn(),
    csvUploadSheetOpen: false,
    onCSVUploadSheetOpenChange: vi.fn(),
  };

  it('renders quick-start actions with descriptions and accessible names when no patient is selected', () => {
    render(
      <LogScreen
        chrome={defaultChrome}
        appSubtitle=""
        selectedPatient={null}
        lastSavedRecord={null}
        activeReportSavedAt={null}
        isPatientDialogOpen={false}
        setIsPatientDialogOpen={vi.fn()}
        confirmClearOpen={false}
        setConfirmClearOpen={vi.fn()}
        patients={[]}
        onPatientSelect={vi.fn()}
        onManualDetailChange={vi.fn()}
        onToggleSuspectedAgent={vi.fn()}
        onSetTestingPlanData={vi.fn()}
        onProceedToTesting={vi.fn()}
        onStartDirectTesting={vi.fn()}
        onClearActiveReport={vi.fn()}
      />
    );

    const uploadBtn = screen.getByRole('button', { name: /Upload REDCap export & review cases/i });
    const testingBtn = screen.getByRole('button', { name: /Go straight to allergy testing/i });

    expect(uploadBtn).toBeInTheDocument();
    expect(testingBtn).toBeInTheDocument();
    expect(
      screen.getByText(
        'Import patient records from a REDCap CSV export, then review the clinic worklist and analytics in the Dashboard.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Open a fresh testing session for bedside entry — no patient record or testing plan required.'
      )
    ).toBeInTheDocument();
  });

  it('does not render quick-start actions when a patient is selected', () => {
    render(
      <LogScreen
        chrome={defaultChrome}
        appSubtitle=""
        selectedPatient={createMockPatient({ id: '1', firstName: 'Jane', lastName: 'Doe', mrn: '12345' })}
        lastSavedRecord={null}
        activeReportSavedAt={null}
        isPatientDialogOpen={false}
        setIsPatientDialogOpen={vi.fn()}
        confirmClearOpen={false}
        setConfirmClearOpen={vi.fn()}
        patients={[]}
        onPatientSelect={vi.fn()}
        onManualDetailChange={vi.fn()}
        onToggleSuspectedAgent={vi.fn()}
        onSetTestingPlanData={vi.fn()}
        onProceedToTesting={vi.fn()}
        onStartDirectTesting={vi.fn()}
        onClearActiveReport={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: /Upload REDCap export & review cases/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Go straight to allergy testing/i })).not.toBeInTheDocument();
  });

  it('opens the CSV upload sheet when upload quick-action is clicked', () => {
    const onCSVUploadSheetOpenChange = vi.fn();
    render(
      <LogScreen
        chrome={{
          ...defaultChrome,
          onCSVUploadSheetOpenChange,
        }}
        appSubtitle=""
        selectedPatient={null}
        lastSavedRecord={null}
        activeReportSavedAt={null}
        isPatientDialogOpen={false}
        setIsPatientDialogOpen={vi.fn()}
        confirmClearOpen={false}
        setConfirmClearOpen={vi.fn()}
        patients={[]}
        onPatientSelect={vi.fn()}
        onManualDetailChange={vi.fn()}
        onToggleSuspectedAgent={vi.fn()}
        onSetTestingPlanData={vi.fn()}
        onProceedToTesting={vi.fn()}
        onStartDirectTesting={vi.fn()}
        onClearActiveReport={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Upload REDCap export & review cases/i }));
    expect(onCSVUploadSheetOpenChange).toHaveBeenCalledWith(true);
  });

  it('calls onStartDirectTesting immediately when clicking Go straight to allergy testing without unsaved draft', () => {
    const onStartDirectTesting = vi.fn();
    render(
      <LogScreen
        chrome={defaultChrome}
        appSubtitle=""
        selectedPatient={null}
        lastSavedRecord={null}
        activeReportSavedAt={null}
        isPatientDialogOpen={false}
        setIsPatientDialogOpen={vi.fn()}
        confirmClearOpen={false}
        setConfirmClearOpen={vi.fn()}
        patients={[]}
        onPatientSelect={vi.fn()}
        onManualDetailChange={vi.fn()}
        onToggleSuspectedAgent={vi.fn()}
        onSetTestingPlanData={vi.fn()}
        onProceedToTesting={vi.fn()}
        onStartDirectTesting={onStartDirectTesting}
        onClearActiveReport={vi.fn()}
        isTestingDraftDirty={false}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Go straight to allergy testing/i }));
    expect(onStartDirectTesting).toHaveBeenCalledOnce();
  });

  it('prompts confirmation when clicking Go straight to allergy testing with an unsaved testing draft', () => {
    const onStartDirectTesting = vi.fn();
    render(
      <LogScreen
        chrome={defaultChrome}
        appSubtitle=""
        selectedPatient={null}
        lastSavedRecord={null}
        activeReportSavedAt={null}
        isPatientDialogOpen={false}
        setIsPatientDialogOpen={vi.fn()}
        confirmClearOpen={false}
        setConfirmClearOpen={vi.fn()}
        patients={[]}
        onPatientSelect={vi.fn()}
        onManualDetailChange={vi.fn()}
        onToggleSuspectedAgent={vi.fn()}
        onSetTestingPlanData={vi.fn()}
        onProceedToTesting={vi.fn()}
        onStartDirectTesting={onStartDirectTesting}
        onClearActiveReport={vi.fn()}
        isTestingDraftDirty={true}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Go straight to allergy testing/i }));

    expect(onStartDirectTesting).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toHaveTextContent('Start fresh testing session?');
    expect(screen.getByRole('dialog')).toHaveTextContent('You have unsaved changes in your current testing session.');

    fireEvent.click(screen.getByRole('button', { name: 'Start fresh session' }));
    expect(onStartDirectTesting).toHaveBeenCalledOnce();
  });
});

describe('LogScreen Home layout ordering', () => {
  const baseProps = {
    chrome: {
      setScreen: vi.fn(),
      currentScreen: Screen.LOG,
      databaseDate: '',
      showDisclaimer: false,
      isCustomData: false,
      onDismissDisclaimer: vi.fn(),
      onUploadPatients: vi.fn(),
      csvUploadSheetOpen: false,
      onCSVUploadSheetOpenChange: vi.fn(),
    },
    appSubtitle: '',
    selectedPatient: null,
    lastSavedRecord: null,
    activeReportSavedAt: null,
    isPatientDialogOpen: false,
    setIsPatientDialogOpen: vi.fn(),
    confirmClearOpen: false,
    setConfirmClearOpen: vi.fn(),
    patients: [],
    onPatientSelect: vi.fn(),
    onManualDetailChange: vi.fn(),
    onToggleSuspectedAgent: vi.fn(),
    onSetTestingPlanData: vi.fn(),
    onProceedToTesting: vi.fn(),
    onStartDirectTesting: vi.fn(),
    onClearActiveReport: vi.fn(),
  };

  it('orders Patient Selection before Quick-start actions on Home', () => {
    render(<LogScreen {...baseProps} />);

    const patientCard = screen.getByText('Patient Selection');
    const directAction = screen.getByRole('button', { name: /Go straight to allergy testing/i });

    // Compare document order
    expect(patientCard.compareDocumentPosition(directAction)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });
});

describe('LogScreen active work banners', () => {
  const baseProps = {
    chrome: {
      setScreen: vi.fn(),
      currentScreen: Screen.LOG,
      databaseDate: '',
      showDisclaimer: false,
      isCustomData: false,
      onDismissDisclaimer: vi.fn(),
      onUploadPatients: vi.fn(),
      csvUploadSheetOpen: false,
      onCSVUploadSheetOpenChange: vi.fn(),
    },
    appSubtitle: '',
    selectedPatient: null,
    lastSavedRecord: createMockLogFormData({ firstName: 'Alex', lastName: 'Rivera' }),
    activeReportSavedAt: Date.now() - 5000,
    isPatientDialogOpen: false,
    setIsPatientDialogOpen: vi.fn(),
    confirmClearOpen: false,
    setConfirmClearOpen: vi.fn(),
    patients: [],
    onPatientSelect: vi.fn(),
    onManualDetailChange: vi.fn(),
    onToggleSuspectedAgent: vi.fn(),
    onSetTestingPlanData: vi.fn(),
    onProceedToTesting: vi.fn(),
    onStartDirectTesting: vi.fn(),
    onClearActiveReport: vi.fn(),
    isTestingDraftDirty: true,
  };

  it('orders Active Report before Testing Draft in active work banners', () => {
    render(<LogScreen {...baseProps} />);

    const activeReportText = screen.getByText(/Active report:/i);
    const draftText = screen.getByText(/In-progress testing session/i);

    expect(activeReportText).not.toHaveTextContent('Rivera');
    expect(activeReportText.compareDocumentPosition(draftText)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });
});

describe('LogScreen dirty patient switch confirmation', () => {
  const baseChrome = {
    setScreen: vi.fn(),
    currentScreen: Screen.LOG,
    databaseDate: '',
    showDisclaimer: false,
    isCustomData: false,
    onDismissDisclaimer: vi.fn(),
    onUploadPatients: vi.fn(),
    csvUploadSheetOpen: false,
    onCSVUploadSheetOpenChange: vi.fn(),
  };

  it('calls onConfirmedPatientSelect directly when confirmed and bypasses guarded onPatientSelect', () => {
    const onPatientSelect = vi.fn();
    const onConfirmedPatientSelect = vi.fn();
    const onResetForm = vi.fn();

    render(
      <LogScreen
        chrome={baseChrome}
        appSubtitle=""
        selectedPatient={createMockPatient({ id: 'current-patient-1', firstName: 'John', lastName: 'Doe' })}
        lastSavedRecord={null}
        activeReportSavedAt={null}
        isPatientDialogOpen={false}
        setIsPatientDialogOpen={vi.fn()}
        confirmClearOpen={false}
        setConfirmClearOpen={vi.fn()}
        patients={[]}
        onPatientSelect={onPatientSelect}
        onConfirmedPatientSelect={onConfirmedPatientSelect}
        onManualDetailChange={vi.fn()}
        onToggleSuspectedAgent={vi.fn()}
        onSetTestingPlanData={vi.fn()}
        onProceedToTesting={vi.fn()}
        onStartDirectTesting={vi.fn()}
        onClearActiveReport={vi.fn()}
        isTestingDraftDirty={true}
        onResetForm={onResetForm}
      />
    );

    // Click candidate patient
    fireEvent.click(screen.getByRole('button', { name: 'Select Candidate Patient' }));

    // Should open confirmation dialog and not switch immediately
    expect(screen.getByRole('dialog')).toHaveTextContent('Switch patient?');
    expect(screen.getByRole('dialog')).toHaveTextContent('You have unsaved changes in your current testing session.');
    expect(onConfirmedPatientSelect).not.toHaveBeenCalled();
    expect(onPatientSelect).not.toHaveBeenCalled();

    // Confirm switch
    fireEvent.click(screen.getByRole('button', { name: 'Switch patient' }));

    expect(onConfirmedPatientSelect).toHaveBeenCalledOnce();
    expect(onConfirmedPatientSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'new-patient-99', firstName: 'Sarah' })
    );
    expect(onPatientSelect).not.toHaveBeenCalled();
    expect(onResetForm).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('preserves cancel behavior when user dismisses the switch dialog', () => {
    const onPatientSelect = vi.fn();
    const onConfirmedPatientSelect = vi.fn();
    const onResetForm = vi.fn();

    render(
      <LogScreen
        chrome={baseChrome}
        appSubtitle=""
        selectedPatient={createMockPatient({ id: 'current-patient-1', firstName: 'John', lastName: 'Doe' })}
        lastSavedRecord={null}
        activeReportSavedAt={null}
        isPatientDialogOpen={false}
        setIsPatientDialogOpen={vi.fn()}
        confirmClearOpen={false}
        setConfirmClearOpen={vi.fn()}
        patients={[]}
        onPatientSelect={onPatientSelect}
        onConfirmedPatientSelect={onConfirmedPatientSelect}
        onManualDetailChange={vi.fn()}
        onToggleSuspectedAgent={vi.fn()}
        onSetTestingPlanData={vi.fn()}
        onProceedToTesting={vi.fn()}
        onStartDirectTesting={vi.fn()}
        onClearActiveReport={vi.fn()}
        isTestingDraftDirty={true}
        onResetForm={onResetForm}
      />
    );

    // Click candidate patient
    fireEvent.click(screen.getByRole('button', { name: 'Select Candidate Patient' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Switch patient?');

    // Cancel switch
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onConfirmedPatientSelect).not.toHaveBeenCalled();
    expect(onPatientSelect).not.toHaveBeenCalled();
    expect(onResetForm).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('falls back to calling onResetForm and onPatientSelect when onConfirmedPatientSelect is not provided', () => {
    const onPatientSelect = vi.fn();
    const onResetForm = vi.fn();

    render(
      <LogScreen
        chrome={baseChrome}
        appSubtitle=""
        selectedPatient={createMockPatient({ id: 'current-patient-1', firstName: 'John', lastName: 'Doe' })}
        lastSavedRecord={null}
        activeReportSavedAt={null}
        isPatientDialogOpen={false}
        setIsPatientDialogOpen={vi.fn()}
        confirmClearOpen={false}
        setConfirmClearOpen={vi.fn()}
        patients={[]}
        onPatientSelect={onPatientSelect}
        onManualDetailChange={vi.fn()}
        onToggleSuspectedAgent={vi.fn()}
        onSetTestingPlanData={vi.fn()}
        onProceedToTesting={vi.fn()}
        onStartDirectTesting={vi.fn()}
        onClearActiveReport={vi.fn()}
        isTestingDraftDirty={true}
        onResetForm={onResetForm}
      />
    );

    // Click candidate patient
    fireEvent.click(screen.getByRole('button', { name: 'Select Candidate Patient' }));

    // Confirm switch
    fireEvent.click(screen.getByRole('button', { name: 'Switch patient' }));

    expect(onResetForm).toHaveBeenCalledOnce();
    expect(onPatientSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'new-patient-99', firstName: 'Sarah' })
    );
  });

  it('completes patient switch exactly once without re-triggering the parent patient selection guard', () => {
    let pendingSelection: Patient | null = null;
    const guardedPatientSelect = vi.fn((_p: Patient) => {
      // If the old guarded onPatientSelect was called while dirty, it would set pending selection (re-prompting)
      pendingSelection = _p;
    });
    const confirmedPatientSelect = vi.fn();

    render(
      <LogScreen
        chrome={baseChrome}
        appSubtitle=""
        selectedPatient={createMockPatient({ id: 'current-patient-1', firstName: 'John', lastName: 'Doe' })}
        lastSavedRecord={null}
        activeReportSavedAt={null}
        isPatientDialogOpen={false}
        setIsPatientDialogOpen={vi.fn()}
        confirmClearOpen={false}
        setConfirmClearOpen={vi.fn()}
        patients={[]}
        onPatientSelect={guardedPatientSelect}
        onConfirmedPatientSelect={confirmedPatientSelect}
        onManualDetailChange={vi.fn()}
        onToggleSuspectedAgent={vi.fn()}
        onSetTestingPlanData={vi.fn()}
        onProceedToTesting={vi.fn()}
        onStartDirectTesting={vi.fn()}
        onClearActiveReport={vi.fn()}
        isTestingDraftDirty={true}
      />
    );

    // Select candidate
    fireEvent.click(screen.getByRole('button', { name: 'Select Candidate Patient' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Confirm switch
    fireEvent.click(screen.getByRole('button', { name: 'Switch patient' }));

    // The confirmed callback was invoked, and the guarded parent callback was NOT invoked
    expect(confirmedPatientSelect).toHaveBeenCalledOnce();
    expect(guardedPatientSelect).not.toHaveBeenCalled();
    expect(pendingSelection).toBeNull();
  });
});
