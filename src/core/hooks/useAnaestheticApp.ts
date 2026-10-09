import { useState, useEffect, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { usePatientState } from '@features/patients/hooks/usePatientState';
import { useTestingState } from '@features/testing/hooks/useTestingState';
import { isTestingSessionDirty } from '@features/testing/utils/isTestingSessionDirty';
import { isDifferentPatient, getPatientIdentitySignature } from '@features/patients/utils/patientIdentity';
import { useAppNavigation } from './useAppNavigation';
import { useDisclaimer } from '@shared/hooks/useDisclaimer';
import { LogFormData, Patient, Screen } from '@shared/types';
import { createClinicalWorkContext } from '@shared/types/clinicalWorkContext';

export function useAnaestheticApp() {
  const patientState = usePatientState();
  const { selectedPatient, handleManualDetailChange: originalHandleManualDetailChange } = patientState;
  const testingState = useTestingState();
  const {
    setFormData,
    workContext,
    setWorkContext,
    activeReportContext,
    setActiveReportContext,
    handleSubmit: originalHandleSubmit,
    resetForm: originalResetForm,
    clearActiveReport: originalClearActiveReport,
    persistDraftNow,
  } = testingState;

  const isTestingDraftDirty = useMemo(() => {
    return (
      isTestingSessionDirty(testingState.formData, {
        includeIdentity: !selectedPatient,
      }) ||
      (!selectedPatient && testingState.formData.visitDate !== testingState.INITIAL_FORM_STATE.visitDate)
    );
  }, [testingState.formData, testingState.INITIAL_FORM_STATE.visitDate, selectedPatient]);

  const navigation = useAppNavigation({
    isDirty: isTestingDraftDirty,
    persistDraftNow,
  });

  const disclaimer = useDisclaimer();
  const lastTryptasePrefillPatientSignature = useRef<string | null>(null);

  const [pendingPatientSelection, setPendingPatientSelection] = useState<{ patient: Patient; targetScreen?: Screen } | null>(null);

  const handleConfirmedPatientSelect = (patient: Patient, targetScreen?: Screen) => {
    originalResetForm();
    testingState.setTestingPlanData(null);
    patientState.handlePatientSelect(patient);
    setPendingPatientSelection(null);
    if (targetScreen) {
      navigation.navigate(targetScreen, { bypassGuard: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const requestPatientSelect = (
    patient: Patient,
    targetScreen?: Screen,
    options?: { bypassGuard?: boolean }
  ) => {
    if (options?.bypassGuard) {
      handleConfirmedPatientSelect(patient, targetScreen);
      return;
    }
    if (isTestingDraftDirty && isDifferentPatient(selectedPatient, patient)) {
      setPendingPatientSelection({ patient, targetScreen });
      return;
    }
    patientState.handlePatientSelect(patient);
    if (targetScreen) {
      navigation.navigate(targetScreen);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const confirmPatientSelect = () => {
    if (pendingPatientSelection) {
      const { patient, targetScreen } = pendingPatientSelection;
      handleConfirmedPatientSelect(patient, targetScreen);
    }
  };

  const cancelPatientSelect = () => {
    setPendingPatientSelection(null);
  };

  // Compose handlers that need cross-concern coordination
  const handleDashboardPatientSelect = (patient: Patient) => {
    requestPatientSelect(patient, Screen.LOG);
  };

  const handlePatientSelect = (patient: Patient, options?: { bypassGuard?: boolean }) => {
    requestPatientSelect(patient, undefined, options);
  };

  useEffect(() => {
    if (!selectedPatient) {
      lastTryptasePrefillPatientSignature.current = null;
      return;
    }

    const currentPatientSignature = getPatientIdentitySignature(selectedPatient);
    const isNewPatientSelection = lastTryptasePrefillPatientSignature.current !== currentPatientSignature;
    const referralTryptases = selectedPatient.history.tryptases;

    if (isNewPatientSelection) {
      lastTryptasePrefillPatientSignature.current = currentPatientSignature;

      // Create new workflow context with stable sessionId for this patient
      const nextContext = createClinicalWorkContext({
        source: selectedPatient.id === 'manual' ? 'manual' : 'database',
        patient: selectedPatient,
        firstName: selectedPatient.firstName || '',
        lastName: selectedPatient.lastName || '',
        mrn: selectedPatient.mrn || '',
        dob: selectedPatient.dob || '',
        reactionDate: selectedPatient.history?.date,
        testingVisitDate: testingState.formData.visitDate,
      });
      setWorkContext(nextContext);
    } else {
      // Existing patient session: update identity/visitDate if changed, preserving sessionId
      setWorkContext(prev => {
        if (!prev) return null;
        return {
          ...prev,
          firstName: selectedPatient.firstName || '',
          lastName: selectedPatient.lastName || '',
          mrn: selectedPatient.mrn || '',
          dob: selectedPatient.dob || '',
          patientSnapshot: selectedPatient,
          testingVisitDate: testingState.formData.visitDate,
        };
      });
    }

    setFormData(prev => ({
      ...prev,
      firstName: selectedPatient.firstName || '',
      lastName: selectedPatient.lastName || '',
      mrn: selectedPatient.mrn || '',
      dob: selectedPatient.dob || '',
      ...(isNewPatientSelection && referralTryptases?.length
        ? {
            tryptase: {
              obtained: true,
              significantElevation: false,
              values: referralTryptases.map(({ time, result }) => ({ time: time ?? '', result })),
              source: 'referral' as const,
              hadReferralData: true,
            },
          }
        : {}),
    }));
  }, [selectedPatient, setFormData, setWorkContext, testingState.formData.visitDate]);

  const handleManualDetailChange = (field: keyof Patient, value: string) => {
    originalHandleManualDetailChange(field, value);
    if (field === 'firstName' || field === 'lastName' || field === 'mrn' || field === 'dob') {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
      setWorkContext(prev => {
        if (!prev) return null;
        return {
          ...prev,
          [field]: value,
        };
      });
    }
  };

  const handleSubmit = (): LogFormData | null => {
    const savedRecord = originalHandleSubmit(workContext);
    if (!savedRecord) {
      // Storage write failed; the testing hook has shown the storage warning
      // and kept the draft. Stay put — no success toast, no navigation.
      return null;
    }
    toast.success(`Record saved for ${savedRecord.lastName}, ${savedRecord.firstName}`, { duration: 4000 });
    navigation.navigate(Screen.SUMMARY, { bypassGuard: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return savedRecord;
  };

  const handleStartDirectTesting = () => {
    patientState.setSelectedPatient(null);
    testingState.setTestingPlanData(null);
    originalResetForm();

    const directContext = createClinicalWorkContext({
      source: 'direct',
      patient: null,
      testingVisitDate: testingState.INITIAL_FORM_STATE.visitDate,
    });
    setWorkContext(directContext);

    navigation.navigate(Screen.TESTING);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    originalResetForm();
    patientState.setSelectedPatient(null);
    testingState.setTestingPlanData(null);
    setWorkContext(null);
    navigation.navigate(Screen.LOG);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearActiveReport = () => {
    originalClearActiveReport();
    patientState.setSelectedPatient(null);
    testingState.setTestingPlanData(null);
    originalResetForm();
    setWorkContext(null);
    navigation.navigate(Screen.LOG);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return {
    // Navigation
    screen: navigation.screen,
    setScreen: navigation.setScreen,
    navigate: navigation.navigate,
    hrefFor: navigation.hrefFor,
    pendingNavigation: navigation.pendingNavigation,
    confirmNavigation: navigation.confirmNavigation,
    cancelNavigation: navigation.cancelNavigation,

    // Workflow & Testing state
    workContext,
    setWorkContext,
    activeReportContext,
    setActiveReportContext,
    formData: testingState.formData,
    setFormData: testingState.setFormData,
    lastSavedRecord: testingState.lastSavedRecord,
    setLastSavedRecord: testingState.setLastSavedRecord,
    activeReportSavedAt: testingState.activeReportSavedAt,
    lastDraftSavedAt: testingState.lastDraftSavedAt,
    isSavingDraft: testingState.isSavingDraft,
    storageWarning: testingState.storageWarning,
    testingPlanData: testingState.testingPlanData,
    setTestingPlanData: testingState.setTestingPlanData,
    recentLogs: testingState.recentLogs,
    INITIAL_FORM_STATE: testingState.INITIAL_FORM_STATE,
    isTestingDraftDirty,
    persistDraftNow,

    // Patient state
    selectedPatient: patientState.selectedPatient,
    setSelectedPatient: patientState.setSelectedPatient,
    isPatientDialogOpen: patientState.isPatientDialogOpen,
    setIsPatientDialogOpen: patientState.setIsPatientDialogOpen,
    patients: patientState.patients,
    databaseDate: patientState.databaseDate,
    hasUploadedData: patientState.hasUploadedData,
    patientDbSavedAt: patientState.patientDbSavedAt,
    isLoadingPatients: patientState.isLoadingPatients,

    // Disclaimer
    showDisclaimer: disclaimer.showDisclaimer,

    // Patient switch guard
    pendingPatientSelection,
    confirmPatientSelect,
    cancelPatientSelect,
    requestPatientSelect,
    handleConfirmedPatientSelect,

    // Handlers
    handleDismissDisclaimer: disclaimer.handleDismissDisclaimer,
    handlePatientSelect,
    handleManualDetailChange,
    handleSubmit,
    handleStartDirectTesting,
    handleUploadPatients: patientState.handleUploadPatients,
    toggleSuspectedAgent: patientState.toggleSuspectedAgent,
    handleDashboardPatientSelect,
    resetForm,
    clearActiveReport,
  };
}
