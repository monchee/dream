import { act, renderHook, waitFor } from '@testing-library/react';
import type { SetStateAction } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePatientState } from '@features/patients/hooks/usePatientState';
import { useTestingState } from '@features/testing/hooks/useTestingState';
import { useDisclaimer } from '@shared/hooks/useDisclaimer';
import { generateLetterText } from '@shared/utils/reportExporter';
import { createMockLogFormData } from '@/src/test/factories/testingDataFactory';
import { createMockPatient } from '@/src/test/factories/patientFactory';
import type { LogFormData, Patient } from '@shared/types';
import { Screen } from '@shared/types';
import { useAppNavigation } from './useAppNavigation';
import { useAnaestheticApp } from './useAnaestheticApp';

vi.mock('@features/patients/hooks/usePatientState');
vi.mock('@features/testing/hooks/useTestingState');
vi.mock('@shared/hooks/useDisclaimer');
vi.mock('./useAppNavigation');

describe('useAnaestheticApp tryptase prefill', () => {
  let selectedPatient: Patient | null;
  let formData: LogFormData;
  let setFormData: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    selectedPatient = null;
    formData = createMockLogFormData();
    setFormData = vi.fn((next: SetStateAction<LogFormData>) => {
      formData = typeof next === 'function' ? next(formData) : next;
    });

    vi.mocked(usePatientState).mockImplementation(() => ({
      selectedPatient,
      setSelectedPatient: vi.fn(),
      isPatientDialogOpen: false,
      setIsPatientDialogOpen: vi.fn(),
      patients: [],
      databaseDate: '',
      hasUploadedData: false,
      patientDbSavedAt: null,
      isLoadingPatients: false,
      handlePatientSelect: vi.fn(),
      handleManualDetailChange: vi.fn(),
      handleUploadPatients: vi.fn(),
      toggleSuspectedAgent: vi.fn(),
    } as unknown as ReturnType<typeof usePatientState>));

    vi.mocked(useTestingState).mockImplementation(() => ({
      formData,
      setFormData,
      workContext: {
        schemaVersion: 1,
        sessionId: 'test-session-1',
        source: 'direct',
        firstName: '',
        lastName: '',
        mrn: '',
        testingVisitDate: '2026-03-18',
        patientSnapshot: null,
        createdAt: Date.now(),
      },
      setWorkContext: vi.fn(),
      activeReportContext: null,
      setActiveReportContext: vi.fn(),
      lastSavedRecord: null,
      setLastSavedRecord: vi.fn(),
      activeReportSavedAt: null,
      lastDraftSavedAt: null,
      isSavingDraft: false,
      testingPlanData: null,
      setTestingPlanData: vi.fn(),
      recentLogs: [],
      handleSubmit: vi.fn(() => formData),
      resetForm: vi.fn(),
      clearActiveReport: vi.fn(),
      persistDraftNow: vi.fn(),
      INITIAL_FORM_STATE: createMockLogFormData(),
      storageWarning: null,
      clearStorageWarning: vi.fn(),
    } as ReturnType<typeof useTestingState>));

    vi.mocked(useAppNavigation).mockReturnValue({
      screen: Screen.LOG,
      setScreen: vi.fn(),
      navigate: vi.fn(),
      hrefFor: vi.fn((s) => (s === Screen.LOG ? '/' : `/${s}`)),
      pendingNavigation: null,
      confirmNavigation: vi.fn(),
      cancelNavigation: vi.fn(),
      navigateTo: vi.fn(),
    });
    vi.mocked(useDisclaimer).mockReturnValue({
      showDisclaimer: false,
      handleDismissDisclaimer: vi.fn(),
    });
  });

  it('prefills referral values once and never produces a false not-obtained letter sentence', async () => {
    selectedPatient = createMockPatient({
      history: {
        ...createMockPatient().history,
        tryptases: [
          { time: '09:15', result: '4.2' },
          { result: '19.8' },
        ],
      },
    });

    const { rerender } = renderHook(() => useAnaestheticApp());

    await waitFor(() => expect(formData.tryptase).toEqual({
      obtained: true,
      significantElevation: false,
      values: [
        { time: '09:15', result: '4.2' },
        { time: '', result: '19.8' },
      ],
      source: 'referral',
      hadReferralData: true,
    }));

    const letter = generateLetterText(formData, selectedPatient);
    expect(letter).toContain('Serial serum tryptase samples were obtained and were not elevated (T1 (09:15): 4.2, T2: 19.8).');
    expect(letter).not.toContain('Serial serum tryptase samples were not obtained.');

    formData = {
      ...formData,
      tryptase: {
        ...formData.tryptase!,
        values: [{ time: 'clinician edit', result: '7.1' }],
        source: 'entered',
      },
    };
    selectedPatient = { ...selectedPatient, firstName: 'Updated name' };
    rerender();

    await waitFor(() => expect(formData.firstName).toBe('Updated name'));
    expect(formData.tryptase).toMatchObject({
      values: [{ time: 'clinician edit', result: '7.1' }],
      source: 'entered',
      hadReferralData: true,
    });
  });

  it('leaves existing tryptase state untouched when the patient has no referral samples', async () => {
    const existingTryptase: NonNullable<LogFormData['tryptase']> = {
      obtained: false,
      significantElevation: false,
      values: [],
      source: 'entered',
    };
    formData = createMockLogFormData({ tryptase: existingTryptase });
    selectedPatient = createMockPatient({
      history: { ...createMockPatient().history, tryptases: undefined },
    });

    renderHook(() => useAnaestheticApp());

    await waitFor(() => expect(formData.mrn).toBe(selectedPatient?.mrn));
    expect(formData.tryptase).toBe(existingTryptase);
  });

  it('prefills referral tryptase when switching between distinct manual records sharing sentinel id "manual"', async () => {
    const manual1 = createMockPatient({
      id: 'manual',
      firstName: 'John',
      lastName: 'Doe',
      mrn: 'MAN-001',
      dob: '1970-01-01',
      history: {
        ...createMockPatient().history,
        tryptases: [{ time: '10:00', result: '3.5' }],
      },
    });

    selectedPatient = manual1;
    const { rerender } = renderHook(() => useAnaestheticApp());

    await waitFor(() => expect(formData.tryptase).toEqual({
      obtained: true,
      significantElevation: false,
      values: [{ time: '10:00', result: '3.5' }],
      source: 'referral',
      hadReferralData: true,
    }));

    // Clinician edits tryptase values on manual1
    formData = {
      ...formData,
      tryptase: {
        ...formData.tryptase!,
        values: [{ time: '10:00', result: '9.9' }],
        source: 'entered',
      },
    };

    // Switch to manual2 (also id: "manual" but distinct identifying fields) with its own referral samples
    const manual2 = createMockPatient({
      id: 'manual',
      firstName: 'Jane',
      lastName: 'Smith',
      mrn: 'MAN-002',
      dob: '1980-02-02',
      history: {
        ...createMockPatient().history,
        tryptases: [{ time: '11:30', result: '18.2' }],
      },
    });

    selectedPatient = manual2;
    rerender();

    // Because manual2 is a different identity signature, it should prefill manual2's referral tryptase
    await waitFor(() => expect(formData.tryptase).toEqual({
      obtained: true,
      significantElevation: false,
      values: [{ time: '11:30', result: '18.2' }],
      source: 'referral',
      hadReferralData: true,
    }));
  });
});

describe('useAnaestheticApp direct testing session', () => {
  it('clears patient and testing plan, resets form, and navigates to testing screen', () => {
    const setSelectedPatient = vi.fn();
    const setTestingPlanData = vi.fn();
    const resetForm = vi.fn();
    const setScreen = vi.fn();

    vi.mocked(usePatientState).mockReturnValue({
      selectedPatient: createMockPatient(),
      setSelectedPatient,
      isPatientDialogOpen: false,
      setIsPatientDialogOpen: vi.fn(),
      patients: [],
      databaseDate: '',
      hasUploadedData: false,
      patientDbSavedAt: null,
      isLoadingPatients: false,
      handlePatientSelect: vi.fn(),
      handleManualDetailChange: vi.fn(),
      handleUploadPatients: vi.fn(),
      toggleSuspectedAgent: vi.fn(),
    } as unknown as ReturnType<typeof usePatientState>);

    vi.mocked(useTestingState).mockReturnValue({
      formData: createMockLogFormData(),
      setFormData: vi.fn(),
      workContext: {
        schemaVersion: 1,
        sessionId: 'test-session',
        source: 'direct',
        firstName: '',
        lastName: '',
        mrn: '',
        testingVisitDate: '2026-03-18',
        patientSnapshot: null,
        createdAt: Date.now(),
      },
      setWorkContext: vi.fn(),
      activeReportContext: null,
      setActiveReportContext: vi.fn(),
      lastSavedRecord: null,
      setLastSavedRecord: vi.fn(),
      activeReportSavedAt: null,
      lastDraftSavedAt: null,
      isSavingDraft: false,
      testingPlanData: { selectedDrugs: ['Propofol'] } as unknown as ReturnType<typeof useTestingState>['testingPlanData'],
      setTestingPlanData,
      recentLogs: [],
      handleSubmit: vi.fn(),
      resetForm,
      clearActiveReport: vi.fn(),
      persistDraftNow: vi.fn(),
      INITIAL_FORM_STATE: createMockLogFormData(),
      storageWarning: null,
      clearStorageWarning: vi.fn(),
    } as unknown as ReturnType<typeof useTestingState>);

    vi.mocked(useAppNavigation).mockReturnValue({
      screen: Screen.LOG,
      setScreen,
      navigate: setScreen,
      hrefFor: vi.fn((s) => (s === Screen.LOG ? '/' : `/${s}`)),
      pendingNavigation: null,
      confirmNavigation: vi.fn(),
      cancelNavigation: vi.fn(),
      navigateTo: vi.fn(),
    });

    const { result } = renderHook(() => useAnaestheticApp());

    result.current.handleStartDirectTesting();

    expect(setSelectedPatient).toHaveBeenCalledWith(null);
    expect(setTestingPlanData).toHaveBeenCalledWith(null);
    expect(resetForm).toHaveBeenCalled();
    expect(setScreen).toHaveBeenCalledWith(Screen.TESTING);
  });
});

describe('useAnaestheticApp handleSubmit', () => {
  it('saves record and navigates to summary with bypassGuard', () => {
    const navigateMock = vi.fn();
    const mockRecord = createMockLogFormData({ firstName: 'Jane', lastName: 'Doe' });

    vi.mocked(useTestingState).mockReturnValue({
      formData: mockRecord,
      setFormData: vi.fn(),
      workContext: {
        schemaVersion: 1,
        sessionId: 'test-session',
        source: 'direct',
        firstName: 'Jane',
        lastName: 'Doe',
        mrn: '',
        testingVisitDate: '2026-03-18',
        patientSnapshot: null,
        createdAt: Date.now(),
      },
      setWorkContext: vi.fn(),
      activeReportContext: null,
      setActiveReportContext: vi.fn(),
      lastSavedRecord: null,
      setLastSavedRecord: vi.fn(),
      activeReportSavedAt: null,
      lastDraftSavedAt: null,
      isSavingDraft: false,
      testingPlanData: null,
      setTestingPlanData: vi.fn(),
      recentLogs: [],
      handleSubmit: vi.fn(() => mockRecord),
      resetForm: vi.fn(),
      clearActiveReport: vi.fn(),
      persistDraftNow: vi.fn(),
      INITIAL_FORM_STATE: createMockLogFormData(),
      storageWarning: null,
      clearStorageWarning: vi.fn(),
    } as unknown as ReturnType<typeof useTestingState>);

    vi.mocked(useAppNavigation).mockReturnValue({
      screen: Screen.TESTING,
      setScreen: vi.fn(),
      navigate: navigateMock,
      hrefFor: vi.fn((s) => (s === Screen.LOG ? '/' : `/${s}`)),
      pendingNavigation: null,
      confirmNavigation: vi.fn(),
      cancelNavigation: vi.fn(),
      navigateTo: vi.fn(),
    });

    const { result } = renderHook(() => useAnaestheticApp());
    const saved = result.current.handleSubmit();

    expect(saved).toBe(mockRecord);
    expect(navigateMock).toHaveBeenCalledWith(Screen.SUMMARY, { bypassGuard: true });
  });
});

describe('useAnaestheticApp patient switch guard', () => {
  it('requests confirmation when selecting a different patient while draft is dirty', () => {
    const handlePatientSelectMock = vi.fn();
    const currentPatient = createMockPatient({ id: 'P1', firstName: 'Alice' });
    const targetPatient = createMockPatient({ id: 'P2', firstName: 'Bob' });

    vi.mocked(usePatientState).mockReturnValue({
      selectedPatient: currentPatient,
      setSelectedPatient: vi.fn(),
      isPatientDialogOpen: false,
      setIsPatientDialogOpen: vi.fn(),
      patients: [currentPatient, targetPatient],
      databaseDate: '',
      hasUploadedData: false,
      patientDbSavedAt: null,
      isLoadingPatients: false,
      handlePatientSelect: handlePatientSelectMock,
      handleManualDetailChange: vi.fn(),
      handleUploadPatients: vi.fn(),
      toggleSuspectedAgent: vi.fn(),
    } as ReturnType<typeof usePatientState>);

    // Dirty draft with modified controls
    const dirtyForm = createMockLogFormData({
      controls: { histamineSpt: '5', salineSpt: '', salineIdt: '' },
    });

    vi.mocked(useTestingState).mockReturnValue({
      formData: dirtyForm,
      setFormData: vi.fn(),
      workContext: {
        schemaVersion: 1,
        sessionId: 'session-p1',
        source: 'database',
        firstName: 'Alice',
        lastName: '',
        mrn: '',
        testingVisitDate: '2026-03-18',
        patientSnapshot: currentPatient,
        createdAt: Date.now(),
      },
      setWorkContext: vi.fn(),
      activeReportContext: null,
      setActiveReportContext: vi.fn(),
      lastSavedRecord: null,
      setLastSavedRecord: vi.fn(),
      activeReportSavedAt: null,
      lastDraftSavedAt: null,
      isSavingDraft: false,
      testingPlanData: null,
      setTestingPlanData: vi.fn(),
      recentLogs: [],
      handleSubmit: vi.fn(),
      resetForm: vi.fn(),
      clearActiveReport: vi.fn(),
      persistDraftNow: vi.fn(),
      INITIAL_FORM_STATE: createMockLogFormData(),
      storageWarning: null,
      clearStorageWarning: vi.fn(),
    } as unknown as ReturnType<typeof useTestingState>);

    const { result } = renderHook(() => useAnaestheticApp());

    expect(result.current.isTestingDraftDirty).toBe(true);

    // Attempt to switch to Bob
    act(() => {
      result.current.handlePatientSelect(targetPatient);
    });

    expect(result.current.pendingPatientSelection).toEqual({
      patient: targetPatient,
      targetScreen: undefined,
    });
    expect(handlePatientSelectMock).not.toHaveBeenCalled();

    // Cancel patient select
    act(() => {
      result.current.cancelPatientSelect();
    });
    expect(result.current.pendingPatientSelection).toBeNull();
    expect(handlePatientSelectMock).not.toHaveBeenCalled();
  });

  it('confirms patient switch, resets form and selects target patient', () => {
    const handlePatientSelectMock = vi.fn();
    const resetFormMock = vi.fn();
    const navigateMock = vi.fn();
    const currentPatient = createMockPatient({ id: 'P1', firstName: 'Alice' });
    const targetPatient = createMockPatient({ id: 'P2', firstName: 'Bob' });

    vi.mocked(usePatientState).mockReturnValue({
      selectedPatient: currentPatient,
      setSelectedPatient: vi.fn(),
      isPatientDialogOpen: false,
      setIsPatientDialogOpen: vi.fn(),
      patients: [currentPatient, targetPatient],
      databaseDate: '',
      hasUploadedData: false,
      patientDbSavedAt: null,
      isLoadingPatients: false,
      handlePatientSelect: handlePatientSelectMock,
      handleManualDetailChange: vi.fn(),
      handleUploadPatients: vi.fn(),
      toggleSuspectedAgent: vi.fn(),
    } as ReturnType<typeof usePatientState>);

    const dirtyForm = createMockLogFormData({
      controls: { histamineSpt: '5', salineSpt: '', salineIdt: '' },
    });

    const setTestingPlanDataMock = vi.fn();

    vi.mocked(useTestingState).mockReturnValue({
      formData: dirtyForm,
      setFormData: vi.fn(),
      workContext: null,
      setWorkContext: vi.fn(),
      activeReportContext: null,
      setActiveReportContext: vi.fn(),
      lastSavedRecord: null,
      setLastSavedRecord: vi.fn(),
      activeReportSavedAt: null,
      lastDraftSavedAt: null,
      isSavingDraft: false,
      testingPlanData: { selectedDrugs: ['Cefazolin'] } as unknown as ReturnType<typeof useTestingState>['testingPlanData'],
      setTestingPlanData: setTestingPlanDataMock,
      recentLogs: [],
      handleSubmit: vi.fn(),
      resetForm: resetFormMock,
      clearActiveReport: vi.fn(),
      persistDraftNow: vi.fn(),
      INITIAL_FORM_STATE: createMockLogFormData(),
      storageWarning: null,
      clearStorageWarning: vi.fn(),
    } as unknown as ReturnType<typeof useTestingState>);

    vi.mocked(useAppNavigation).mockReturnValue({
      screen: Screen.LOG,
      setScreen: vi.fn(),
      navigate: navigateMock,
      hrefFor: vi.fn((s) => `/${s}`),
      pendingNavigation: null,
      confirmNavigation: vi.fn(),
      cancelNavigation: vi.fn(),
      navigateTo: vi.fn(),
    });

    const { result } = renderHook(() => useAnaestheticApp());

    act(() => {
      result.current.handleDashboardPatientSelect(targetPatient);
    });
    expect(result.current.pendingPatientSelection).toEqual({
      patient: targetPatient,
      targetScreen: Screen.LOG,
    });

    act(() => {
      result.current.confirmPatientSelect();
    });

    expect(resetFormMock).toHaveBeenCalledTimes(1);
    expect(setTestingPlanDataMock).toHaveBeenCalledWith(null);
    expect(handlePatientSelectMock).toHaveBeenCalledWith(targetPatient);
    expect(result.current.pendingPatientSelection).toBeNull();
    expect(navigateMock).toHaveBeenCalledWith(Screen.LOG, { bypassGuard: true });
  });

  it('triggers confirmation when switching between two manual records with same id "manual" but different fields', () => {
    const handlePatientSelectMock = vi.fn();
    const currentManual = createMockPatient({
      id: 'manual',
      firstName: 'John',
      lastName: 'Smith',
      mrn: 'MAN-001',
      dob: '1970-01-01',
    });
    const targetManual = createMockPatient({
      id: 'manual',
      firstName: 'Jane',
      lastName: 'Doe',
      mrn: 'MAN-002',
      dob: '1980-02-02',
    });

    vi.mocked(usePatientState).mockReturnValue({
      selectedPatient: currentManual,
      setSelectedPatient: vi.fn(),
      isPatientDialogOpen: false,
      setIsPatientDialogOpen: vi.fn(),
      patients: [],
      databaseDate: '',
      hasUploadedData: false,
      patientDbSavedAt: null,
      isLoadingPatients: false,
      handlePatientSelect: handlePatientSelectMock,
      handleManualDetailChange: vi.fn(),
      handleUploadPatients: vi.fn(),
      toggleSuspectedAgent: vi.fn(),
    } as ReturnType<typeof usePatientState>);

    const dirtyForm = createMockLogFormData({
      controls: { histamineSpt: '4', salineSpt: '', salineIdt: '' },
    });

    vi.mocked(useTestingState).mockReturnValue({
      formData: dirtyForm,
      setFormData: vi.fn(),
      workContext: null,
      setWorkContext: vi.fn(),
      activeReportContext: null,
      setActiveReportContext: vi.fn(),
      lastSavedRecord: null,
      setLastSavedRecord: vi.fn(),
      activeReportSavedAt: null,
      lastDraftSavedAt: null,
      isSavingDraft: false,
      testingPlanData: null,
      setTestingPlanData: vi.fn(),
      recentLogs: [],
      handleSubmit: vi.fn(),
      resetForm: vi.fn(),
      clearActiveReport: vi.fn(),
      persistDraftNow: vi.fn(),
      INITIAL_FORM_STATE: createMockLogFormData(),
      storageWarning: null,
      clearStorageWarning: vi.fn(),
    } as unknown as ReturnType<typeof useTestingState>);

    const { result } = renderHook(() => useAnaestheticApp());

    act(() => {
      result.current.handlePatientSelect(targetManual);
    });

    // Should prompt for confirmation because identity signatures differ
    expect(result.current.pendingPatientSelection).toEqual({
      patient: targetManual,
      targetScreen: undefined,
    });
    expect(handlePatientSelectMock).not.toHaveBeenCalled();
  });

  it('does not trigger confirmation when re-selecting the exact same manual patient', () => {
    const handlePatientSelectMock = vi.fn();
    const manualPatient = createMockPatient({
      id: 'manual',
      firstName: 'John',
      lastName: 'Smith',
      mrn: 'MAN-001',
      dob: '1970-01-01',
    });

    vi.mocked(usePatientState).mockReturnValue({
      selectedPatient: manualPatient,
      setSelectedPatient: vi.fn(),
      isPatientDialogOpen: false,
      setIsPatientDialogOpen: vi.fn(),
      patients: [],
      databaseDate: '',
      hasUploadedData: false,
      patientDbSavedAt: null,
      isLoadingPatients: false,
      handlePatientSelect: handlePatientSelectMock,
      handleManualDetailChange: vi.fn(),
      handleUploadPatients: vi.fn(),
      toggleSuspectedAgent: vi.fn(),
    } as ReturnType<typeof usePatientState>);

    const dirtyForm = createMockLogFormData({
      controls: { histamineSpt: '4', salineSpt: '', salineIdt: '' },
    });

    vi.mocked(useTestingState).mockReturnValue({
      formData: dirtyForm,
      setFormData: vi.fn(),
      workContext: null,
      setWorkContext: vi.fn(),
      activeReportContext: null,
      setActiveReportContext: vi.fn(),
      lastSavedRecord: null,
      setLastSavedRecord: vi.fn(),
      activeReportSavedAt: null,
      lastDraftSavedAt: null,
      isSavingDraft: false,
      testingPlanData: null,
      setTestingPlanData: vi.fn(),
      recentLogs: [],
      handleSubmit: vi.fn(),
      resetForm: vi.fn(),
      clearActiveReport: vi.fn(),
      persistDraftNow: vi.fn(),
      INITIAL_FORM_STATE: createMockLogFormData(),
      storageWarning: null,
      clearStorageWarning: vi.fn(),
    } as unknown as ReturnType<typeof useTestingState>);

    const { result } = renderHook(() => useAnaestheticApp());

    act(() => {
      result.current.handlePatientSelect({ ...manualPatient });
    });

    expect(result.current.pendingPatientSelection).toBeNull();
    expect(handlePatientSelectMock).toHaveBeenCalledWith(manualPatient);
  });

  it('handleConfirmedPatientSelect resets form and plan, binds target patient, and bypasses draft dirty guard without setting pendingPatientSelection', () => {
    const handlePatientSelectMock = vi.fn();
    const resetFormMock = vi.fn();
    const setTestingPlanDataMock = vi.fn();
    const currentPatient = createMockPatient({ id: 'P1', firstName: 'Alice' });
    const targetPatient = createMockPatient({ id: 'P2', firstName: 'Bob' });

    vi.mocked(usePatientState).mockReturnValue({
      selectedPatient: currentPatient,
      setSelectedPatient: vi.fn(),
      isPatientDialogOpen: false,
      setIsPatientDialogOpen: vi.fn(),
      patients: [currentPatient, targetPatient],
      databaseDate: '',
      hasUploadedData: false,
      patientDbSavedAt: null,
      isLoadingPatients: false,
      handlePatientSelect: handlePatientSelectMock,
      handleManualDetailChange: vi.fn(),
      handleUploadPatients: vi.fn(),
      toggleSuspectedAgent: vi.fn(),
    } as ReturnType<typeof usePatientState>);

    const dirtyForm = createMockLogFormData({
      controls: { histamineSpt: '5', salineSpt: '', salineIdt: '' },
    });

    vi.mocked(useTestingState).mockReturnValue({
      formData: dirtyForm,
      setFormData: vi.fn(),
      workContext: null,
      setWorkContext: vi.fn(),
      activeReportContext: null,
      setActiveReportContext: vi.fn(),
      lastSavedRecord: null,
      setLastSavedRecord: vi.fn(),
      activeReportSavedAt: null,
      lastDraftSavedAt: null,
      isSavingDraft: false,
      testingPlanData: { selectedDrugs: ['Cefazolin'] } as unknown as ReturnType<typeof useTestingState>['testingPlanData'],
      setTestingPlanData: setTestingPlanDataMock,
      recentLogs: [],
      handleSubmit: vi.fn(),
      resetForm: resetFormMock,
      clearActiveReport: vi.fn(),
      persistDraftNow: vi.fn(),
      INITIAL_FORM_STATE: createMockLogFormData(),
      storageWarning: null,
      clearStorageWarning: vi.fn(),
    } as unknown as ReturnType<typeof useTestingState>);

    const { result } = renderHook(() => useAnaestheticApp());

    expect(result.current.isTestingDraftDirty).toBe(true);

    act(() => {
      result.current.handleConfirmedPatientSelect(targetPatient);
    });

    expect(resetFormMock).toHaveBeenCalledTimes(1);
    expect(setTestingPlanDataMock).toHaveBeenCalledWith(null);
    expect(handlePatientSelectMock).toHaveBeenCalledWith(targetPatient);
    expect(result.current.pendingPatientSelection).toBeNull();
  });
});
