import { fireEvent, render, screen } from './test/helpers';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Screen } from '@shared/types';
import type { Patient, TestingPlanData } from '@shared/types';
import { useAnaestheticApp } from '@core/hooks/useAnaestheticApp';
import { AnaestheticLogApp } from '../App';

vi.mock('@core/hooks/useAnaestheticApp', () => ({
  useAnaestheticApp: vi.fn(),
}));

vi.mock('@core/components/GetStartedModal', () => ({
  GetStartedModal: () => null,
}));

const mockedUseAnaestheticApp = vi.mocked(useAnaestheticApp);

function createAppState(
  screen: Screen,
  overrides: Partial<ReturnType<typeof useAnaestheticApp>> = {}
) {
  return {
    screen,
    setScreen: vi.fn(),
    formData: {},
    setFormData: vi.fn(),
    selectedPatient: null,
    lastSavedRecord: null,
    setLastSavedRecord: vi.fn(),
    activeReportSavedAt: null,
    lastDraftSavedAt: null,
    isSavingDraft: false,
    testingPlanData: null,
    setTestingPlanData: vi.fn(),
    isPatientDialogOpen: false,
    setIsPatientDialogOpen: vi.fn(),
    patients: [],
    databaseDate: '',
    hasUploadedData: false,
    patientDbSavedAt: null,
    isLoadingPatients: false,
    recentLogs: [],
    showDisclaimer: false,
    handleDismissDisclaimer: vi.fn(),
    handlePatientSelect: vi.fn(),
    handleManualDetailChange: vi.fn(),
    handleSubmit: vi.fn(),
    handleUploadPatients: vi.fn(),
    handleDashboardPatientSelect: vi.fn(),
    resetForm: vi.fn(),
    clearActiveReport: vi.fn(),
    INITIAL_FORM_STATE: {},
    setSelectedPatient: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useAnaestheticApp>;
}

describe('AnaestheticLogApp guarded screens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows report recovery actions when the active report is missing', () => {
    const appState = createAppState(Screen.SUMMARY);
    mockedUseAnaestheticApp.mockReturnValue(appState);

    render(<AnaestheticLogApp />);

    expect(screen.getByRole('heading', { name: 'No active report', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('Reports are available after a testing session has been saved. The active report may also have expired on this device.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Go Home' }));
    fireEvent.click(screen.getByRole('button', { name: 'Go to Dashboard' }));

    expect(appState.setScreen).toHaveBeenNthCalledWith(1, Screen.LOG);
    expect(appState.setScreen).toHaveBeenNthCalledWith(2, Screen.DASHBOARD);
  });

  it.each([
    ['patient', { testingPlanData: {} as TestingPlanData }],
    ['testing plan', { selectedPatient: {} as Patient }],
  ])('shows testing-plan recovery actions when the %s is missing', (_missingValue, availableValue) => {
    const appState = createAppState(Screen.PRINT_PLAN, availableValue);
    mockedUseAnaestheticApp.mockReturnValue(appState);

    render(<AnaestheticLogApp />);

    expect(screen.getByRole('heading', { name: 'No active testing plan', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('This screen needs an active testing plan. Local data may have expired, or the page was reloaded.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Go Home' }));
    fireEvent.click(screen.getByRole('button', { name: 'Go to Dashboard' }));

    expect(appState.setScreen).toHaveBeenNthCalledWith(1, Screen.LOG);
    expect(appState.setScreen).toHaveBeenNthCalledWith(2, Screen.DASHBOARD);
  });

  it('triggers handleStartDirectTesting when direct testing action is clicked from Home', () => {
    const handleStartDirectTesting = vi.fn();
    const appState = createAppState(Screen.LOG, { handleStartDirectTesting, isTestingDraftDirty: false });
    mockedUseAnaestheticApp.mockReturnValue(appState);

    render(<AnaestheticLogApp />);

    fireEvent.click(screen.getByRole('button', { name: /Go straight to allergy testing/i }));
    expect(handleStartDirectTesting).toHaveBeenCalledOnce();
  });
});

describe('navigation guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not show dialog when pendingNavigation is null', () => {
    const confirmNavigation = vi.fn();
    const cancelNavigation = vi.fn();
    const appState = createAppState(Screen.LOG, {
      pendingNavigation: null,
      confirmNavigation,
      cancelNavigation,
      isTestingDraftDirty: true,
    });
    mockedUseAnaestheticApp.mockReturnValue(appState);

    render(<AnaestheticLogApp />);

    expect(screen.queryByText('Leave testing session?')).not.toBeInTheDocument();
  });

  it('shows dialog when pendingNavigation is set to a Screen with confirm/cancel navigation handlers', () => {
    const confirmNavigation = vi.fn();
    const cancelNavigation = vi.fn();
    const appState = createAppState(Screen.LOG, {
      pendingNavigation: Screen.DASHBOARD,
      confirmNavigation,
      cancelNavigation,
      isTestingDraftDirty: true,
    });
    mockedUseAnaestheticApp.mockReturnValue(appState);

    render(<AnaestheticLogApp />);

    expect(screen.getByText('Leave testing session?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Leave and keep draft' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stay in session' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete draft' })).toBeInTheDocument();
  });

  it('calls confirmNavigation exactly once when clicking "Leave and keep draft"', () => {
    const confirmNavigation = vi.fn();
    const cancelNavigation = vi.fn();
    const appState = createAppState(Screen.LOG, {
      pendingNavigation: Screen.DASHBOARD,
      confirmNavigation,
      cancelNavigation,
      isTestingDraftDirty: true,
    });
    mockedUseAnaestheticApp.mockReturnValue(appState);

    render(<AnaestheticLogApp />);

    fireEvent.click(screen.getByRole('button', { name: 'Leave and keep draft' }));
    expect(confirmNavigation).toHaveBeenCalledOnce();
    expect(cancelNavigation).not.toHaveBeenCalled();
  });

  it('calls cancelNavigation exactly once when clicking "Stay in session"', () => {
    const confirmNavigation = vi.fn();
    const cancelNavigation = vi.fn();
    const appState = createAppState(Screen.LOG, {
      pendingNavigation: Screen.DASHBOARD,
      confirmNavigation,
      cancelNavigation,
      isTestingDraftDirty: true,
    });
    mockedUseAnaestheticApp.mockReturnValue(appState);

    render(<AnaestheticLogApp />);

    fireEvent.click(screen.getByRole('button', { name: 'Stay in session' }));
    expect(cancelNavigation).toHaveBeenCalledOnce();
    expect(confirmNavigation).not.toHaveBeenCalled();
  });

  it('calls cancelNavigation first and resetForm second when clicking "Delete draft"', () => {
    const callOrder: string[] = [];
    const cancelNavigation = vi.fn(() => {
      callOrder.push('cancel');
    });
    const resetForm = vi.fn(() => {
      callOrder.push('reset');
    });
    const confirmNavigation = vi.fn();

    const appState = createAppState(Screen.LOG, {
      pendingNavigation: Screen.DASHBOARD,
      confirmNavigation,
      cancelNavigation,
      resetForm,
      isTestingDraftDirty: true,
    });
    mockedUseAnaestheticApp.mockReturnValue(appState);

    render(<AnaestheticLogApp />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete draft' }));

    expect(cancelNavigation).toHaveBeenCalledOnce();
    expect(resetForm).toHaveBeenCalledOnce();
    expect(callOrder).toEqual(['cancel', 'reset']);

    const cancelCallOrder = cancelNavigation.mock.invocationCallOrder[0];
    const resetCallOrder = resetForm.mock.invocationCallOrder[0];
    expect(cancelCallOrder).toBeLessThan(resetCallOrder);
  });
});

