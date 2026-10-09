import { useState, useEffect, useRef, useCallback } from 'react';
import { LogFormData, TestingPlanData } from '../types';
import { DEFAULT_SELECTED_DRUGS } from '@shared/utils/constants';
import {
  ACTIVE_REPORT_KEY, ACTIVE_REPORT_TTL_MS, TESTING_DRAFT_KEY,
  setWithTTL, getIfFresh, getSavedAt, removeStored,
} from '@shared/utils/ttlStorage';
import {
  ClinicalWorkContext,
  createClinicalWorkContext,
  migrateLegacyRecordToEnvelope,
  migrateLegacyDraftToEnvelope,
  TestingDraftEnvelope,
  ActiveReportEnvelope,
} from '@shared/types/clinicalWorkContext';
import { isTestingSessionDirty } from '../utils/isTestingSessionDirty';
import { parseLogFormData, safeParseLogFormData } from '../utils/logFormSchema';

const INITIAL_FORM_STATE: LogFormData = {
  mrn: '',
  firstName: '',
  lastName: '',
  visitDate: new Date().toISOString().split('T')[0],
  controls: {
    histamineSpt: '',
    salineSpt: '',
    salineIdt: '',
  },
  testPanel: DEFAULT_SELECTED_DRUGS.map(drugName => ({
    drugName,
    sptWheal: '',
    idtResults: [],
    protocolIndex: 0,
  })),
  proceedToChallenge: false,
  challengeDrug: '',
  challengeDrugCustom: '',
  outcome: null,
  reactionTime: '',
  symptoms: [],
  symptomsOther: '',
  interventionType: '',
  interventionOther: '',
  plan: ''
};

function isDraftEqual(a: LogFormData | null, b: LogFormData | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

export function useTestingState() {
  const [formData, setFormData] = useState<LogFormData>(INITIAL_FORM_STATE);
  const [workContext, setWorkContext] = useState<ClinicalWorkContext | null>(null);
  const [lastSavedRecord, setLastSavedRecord] = useState<LogFormData | null>(null);
  const [activeReportContext, setActiveReportContext] = useState<ClinicalWorkContext | null>(null);
  const [activeReportSavedAt, setActiveReportSavedAt] = useState<number | null>(null);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<number | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  // Set when a clinical storage write fails (quota, private mode, corruption).
  // Generic, PHI-free message only — never the exception text.
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const [testingPlanData, setTestingPlanData] = useState<TestingPlanData | null>(null);
  const [recentLogs, setRecentLogs] = useState<LogFormData[]>([]);

  const formDataRef = useRef<LogFormData>(formData);
  formDataRef.current = formData;
  const workContextRef = useRef<ClinicalWorkContext | null>(workContext);
  workContextRef.current = workContext;

  const lastSavedRecordRef = useRef<LogFormData | null>(lastSavedRecord);
  lastSavedRecordRef.current = lastSavedRecord;
  const activeReportSavedAtRef = useRef<number | null>(activeReportSavedAt);
  activeReportSavedAtRef.current = activeReportSavedAt;
  const lastDraftSavedAtRef = useRef<number | null>(lastDraftSavedAt);
  lastDraftSavedAtRef.current = lastDraftSavedAt;

  const lastSavedDraftRef = useRef<LogFormData | null>(null);
  const isInitialMount = useRef(true);

  // Deterministic mechanism to clear in-memory state and remove stale storage entries when TTL expires
  const checkExpiry = useCallback(() => {
    // 1. Check active report TTL expiry and purge stale storage entry
    const freshReport = getIfFresh<unknown>(ACTIVE_REPORT_KEY, ACTIVE_REPORT_TTL_MS);
    if (lastSavedRecordRef.current || activeReportSavedAtRef.current) {
      if (!freshReport) {
        setLastSavedRecord(null);
        setActiveReportContext(null);
        setActiveReportSavedAt(null);
      }
    }

    // 2. Check draft TTL expiry and purge stale storage entry
    const freshDraft = getIfFresh<unknown>(TESTING_DRAFT_KEY, ACTIVE_REPORT_TTL_MS);
    if (lastDraftSavedAtRef.current) {
      if (!freshDraft) {
        lastSavedDraftRef.current = null;
        setFormData(INITIAL_FORM_STATE);
        setWorkContext(null);
        setLastDraftSavedAt(null);
        setIsSavingDraft(false);
      }
    }
  }, []);

  useEffect(() => {
    // Restore active report envelope from localStorage if written within the TTL window.
    const rawReport = getIfFresh<unknown>(ACTIVE_REPORT_KEY, ACTIVE_REPORT_TTL_MS);
    const savedAt = getSavedAt(ACTIVE_REPORT_KEY, ACTIVE_REPORT_TTL_MS);
    const reportEnvelope = rawReport ? migrateLegacyRecordToEnvelope(rawReport, savedAt ?? undefined) : null;

    if (reportEnvelope) {
      const parsedRecord = safeParseLogFormData(reportEnvelope.record);
      if (parsedRecord) {
        setLastSavedRecord(parsedRecord);
        setActiveReportContext(reportEnvelope.workContext);
        setActiveReportSavedAt(reportEnvelope.savedAt);
      }
    }

    // Restore any fresh in-progress testing draft envelope.
    const rawDraft = getIfFresh<unknown>(TESTING_DRAFT_KEY, ACTIVE_REPORT_TTL_MS);
    const draftSavedAt = getSavedAt(TESTING_DRAFT_KEY, ACTIVE_REPORT_TTL_MS);
    const draftEnvelope = rawDraft ? migrateLegacyDraftToEnvelope(rawDraft, draftSavedAt ?? undefined) : null;

    if (draftEnvelope) {
      const parsedDraft = safeParseLogFormData(draftEnvelope.formData);
      if (parsedDraft) {
        lastSavedDraftRef.current = parsedDraft;
        setFormData(parsedDraft);
        setWorkContext(draftEnvelope.workContext);
        if (draftEnvelope.savedAt) {
          setLastDraftSavedAt(draftEnvelope.savedAt);
        }
      }
    }
  }, []);

  // Listen for storage changes, window focus, visibility changes, or interval checks to purge stale in-memory state
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      // Another tab wrote a newer draft while this tab holds unconfirmed
      // edits: warn visibly. Never auto-merge or overwrite — the clinician
      // decides by reloading or continuing in this tab.
      if (e.key === TESTING_DRAFT_KEY && e.newValue) {
        try {
          const incoming = JSON.parse(e.newValue) as { savedAt?: number };
          if (
            typeof incoming.savedAt === 'number'
            && incoming.savedAt > (lastDraftSavedAtRef.current ?? 0)
            && isTestingSessionDirty(formDataRef.current)
            && isDraftEqual(lastSavedDraftRef.current, formDataRef.current) === false
          ) {
            setStorageWarning('Another tab changed this draft. Reload before continuing.');
          }
        } catch {
          // malformed external payload — expiry check below still runs
        }
      }
      if (e.key === ACTIVE_REPORT_KEY || e.key === TESTING_DRAFT_KEY || e.key === null) {
        checkExpiry();
      }
    };

    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        checkExpiry();
      }
    };

    if (typeof window === 'undefined') return;

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    const intervalId = window.setInterval(checkExpiry, 60_000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.clearInterval(intervalId);
    };
  }, [checkExpiry]);

  // Debounced autosave of the in-progress session.
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!isTestingSessionDirty(formData)) {
      setIsSavingDraft(false);
      return;
    }
    if (isDraftEqual(lastSavedDraftRef.current, formData)) {
      setIsSavingDraft(false);
      return;
    }

    if (draftTimer.current) clearTimeout(draftTimer.current);
    setIsSavingDraft(true);
    draftTimer.current = setTimeout(() => {
      let currentContext = workContextRef.current;
      if (!currentContext) {
        currentContext = createClinicalWorkContext({
          source: 'direct',
          firstName: formData.firstName,
          lastName: formData.lastName,
          mrn: formData.mrn,
          dob: formData.dob,
          testingVisitDate: formData.visitDate,
        });
        setWorkContext(currentContext);
      } else if (currentContext.source === 'direct') {
        currentContext = {
          ...currentContext,
          firstName: formData.firstName,
          lastName: formData.lastName,
          mrn: formData.mrn,
          dob: formData.dob,
          testingVisitDate: formData.visitDate,
        };
        setWorkContext(currentContext);
      } else if (currentContext.testingVisitDate !== formData.visitDate) {
        currentContext = {
          ...currentContext,
          testingVisitDate: formData.visitDate,
        };
        setWorkContext(currentContext);
      }

      // Cross-tab guard: if another tab confirmed a newer draft after ours,
      // refuse to silently overwrite it. Warn and keep local edits in memory.
      const externalSavedAt = getSavedAt(TESTING_DRAFT_KEY, ACTIVE_REPORT_TTL_MS);
      if (
        externalSavedAt !== null
        && lastSavedDraftRef.current !== null
        && externalSavedAt > (lastDraftSavedAtRef.current ?? 0)
      ) {
        setStorageWarning('Another tab changed this draft. Reload before continuing.');
        setIsSavingDraft(false);
        draftTimer.current = null;
        return;
      }

      const draftEnvelope: TestingDraftEnvelope = {
        schemaVersion: 1,
        workContext: currentContext,
        formData,
        savedAt: Date.now(),
      };

      const writeOk = setWithTTL(TESTING_DRAFT_KEY, draftEnvelope);
      if (writeOk) {
        lastSavedDraftRef.current = formData;
        setLastDraftSavedAt(draftEnvelope.savedAt);
        setStorageWarning(null);
      } else {
        // Keep the last confirmed timestamp/draft; surface a visible warning.
        setStorageWarning('Unable to save locally — keep this window open');
      }
      setIsSavingDraft(false);
      draftTimer.current = null;
    }, 500);
    return () => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
  }, [formData]);

  const persistDraftNow = useCallback((): boolean => {
    if (draftTimer.current) {
      clearTimeout(draftTimer.current);
      draftTimer.current = null;
    }
    const current = formDataRef.current;
    if (isTestingSessionDirty(current)) {
      let currentContext = workContextRef.current;
      if (!currentContext) {
        currentContext = createClinicalWorkContext({
          source: 'direct',
          firstName: current.firstName,
          lastName: current.lastName,
          mrn: current.mrn,
          dob: current.dob,
          testingVisitDate: current.visitDate,
        });
        setWorkContext(currentContext);
      } else if (currentContext.source === 'direct') {
        currentContext = {
          ...currentContext,
          firstName: current.firstName,
          lastName: current.lastName,
          mrn: current.mrn,
          dob: current.dob,
          testingVisitDate: current.visitDate,
        };
        setWorkContext(currentContext);
      } else if (currentContext.testingVisitDate !== current.visitDate) {
        currentContext = {
          ...currentContext,
          testingVisitDate: current.visitDate,
        };
        setWorkContext(currentContext);
      }

      const draftEnvelope: TestingDraftEnvelope = {
        schemaVersion: 1,
        workContext: currentContext,
        formData: current,
        savedAt: Date.now(),
      };

      const writeOk = setWithTTL(TESTING_DRAFT_KEY, draftEnvelope);
      if (!writeOk) {
        setStorageWarning('Unable to save locally — keep this window open');
        setIsSavingDraft(false);
        return false;
      }
      lastSavedDraftRef.current = current;
      const now = Date.now();
      setLastDraftSavedAt(now);
      setStorageWarning(null);
      setIsSavingDraft(false);
      return true;
    }
    return true;
  }, []);

  useEffect(() => {
    import('@shared/data/mockTestingLogs').then(({ MOCK_TESTING_LOGS }) => {
      setRecentLogs(prev => prev.length === 0 ? MOCK_TESTING_LOGS : prev);
    }).catch((error) => {
      console.warn('Unable to load mock testing logs:', error);
    });
  }, []);

  const handleSubmit = (explicitContext?: ClinicalWorkContext | null): LogFormData | null => {
    try {
      const finalRecord = parseLogFormData(formData);
      const savedAt = Date.now();

      let finalContext = explicitContext || workContextRef.current;
      if (!finalContext) {
        finalContext = createClinicalWorkContext({
          source: 'direct',
          firstName: finalRecord.firstName,
          lastName: finalRecord.lastName,
          mrn: finalRecord.mrn,
          dob: finalRecord.dob,
          testingVisitDate: finalRecord.visitDate,
        });
      } else if (finalContext.source === 'direct') {
        finalContext = {
          ...finalContext,
          firstName: finalRecord.firstName,
          lastName: finalRecord.lastName,
          mrn: finalRecord.mrn,
          dob: finalRecord.dob,
          testingVisitDate: finalRecord.visitDate,
        };
      } else if (finalContext.testingVisitDate !== finalRecord.visitDate) {
        finalContext = {
          ...finalContext,
          testingVisitDate: finalRecord.visitDate,
        };
      }

      const activeEnvelope: ActiveReportEnvelope = {
        schemaVersion: 1,
        workContext: finalContext,
        record: finalRecord,
        savedAt,
      };

      // Write the report to storage FIRST. Only a confirmed write may mutate
      // in-memory report state, clear the draft, or report success.
      const writeOk = setWithTTL(ACTIVE_REPORT_KEY, activeEnvelope);
      if (!writeOk) {
        setStorageWarning('Unable to save this record locally — your testing draft is kept. Free up browser storage or use a regular (non-private) window, then save again.');
        return null;
      }

      setLastSavedRecord(finalRecord);
      setActiveReportContext(finalContext);
      setActiveReportSavedAt(savedAt);
      setRecentLogs(prev => [finalRecord, ...prev]);
      setStorageWarning(null);

      // Session is now committed to a confirmed report — drop the in-progress draft.
      lastSavedDraftRef.current = null;
      setLastDraftSavedAt(null);
      setIsSavingDraft(false);
      removeStored(TESTING_DRAFT_KEY);

      return finalRecord;
    } catch (error) {
      console.error('Error saving clinical record:', error);
      throw error;
    }
  };

  const resetForm = () => {
    if (draftTimer.current) {
      clearTimeout(draftTimer.current);
      draftTimer.current = null;
    }
    lastSavedDraftRef.current = null;
    setFormData(INITIAL_FORM_STATE);
    setWorkContext(null);
    setLastDraftSavedAt(null);
    setIsSavingDraft(false);
    removeStored(TESTING_DRAFT_KEY);
  };

  const clearActiveReport = () => {
    if (draftTimer.current) {
      clearTimeout(draftTimer.current);
      draftTimer.current = null;
    }
    lastSavedDraftRef.current = null;
    setLastSavedRecord(null);
    setActiveReportContext(null);
    setActiveReportSavedAt(null);
    setWorkContext(null);
    setLastDraftSavedAt(null);
    setIsSavingDraft(false);
    removeStored(ACTIVE_REPORT_KEY);
    removeStored(TESTING_DRAFT_KEY);
  };

  return {
    formData,
    setFormData,
    workContext,
    setWorkContext,
    lastSavedRecord,
    setLastSavedRecord,
    activeReportContext,
    setActiveReportContext,
    activeReportSavedAt,
    lastDraftSavedAt,
    isSavingDraft,
    testingPlanData,
    setTestingPlanData,
    recentLogs,
    handleSubmit,
    resetForm,
    clearActiveReport,
    persistDraftNow,
    storageWarning,
    clearStorageWarning: () => setStorageWarning(null),
    INITIAL_FORM_STATE,
  };
}
