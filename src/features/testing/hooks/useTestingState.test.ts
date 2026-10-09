import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ACTIVE_REPORT_KEY,
  ACTIVE_REPORT_TTL_MS,
  TESTING_DRAFT_KEY,
} from '@shared/utils/ttlStorage';
import { LogFormData } from '../types';
import { useTestingState } from './useTestingState';

vi.mock('@shared/data/mockTestingLogs', () => ({
  MOCK_TESTING_LOGS: [
    {
      mrn: 'MOCK1',
      firstName: 'Mock',
      lastName: 'Patient',
      visitDate: '2026-06-10',
      controls: { histamineSpt: '', salineSpt: '', salineIdt: '' },
      testPanel: [],
      proceedToChallenge: false,
      challengeDrug: '',
      outcome: null,
      reactionTime: '',
      symptoms: [],
      symptomsOther: '',
      interventionType: '',
      interventionOther: '',
      plan: '',
    },
  ],
}));

const baseForm = (): LogFormData => ({
  mrn: '123456',
  firstName: 'Jane',
  lastName: 'Citizen',
  visitDate: '2026-06-10',
  controls: {
    histamineSpt: '5',
    salineSpt: '0',
    salineIdt: '0',
  },
  testPanel: [
    {
      drugName: 'Rocuronium',
      sptWheal: '3',
      idtResults: ['0', '4'],
      protocolIndex: 1,
      notes: 'Positive IDT',
    },
  ],
  proceedToChallenge: true,
  challengeDrug: 'Rocuronium',
  challengeDrugCustom: '',
  outcome: 'UNSUCCESS',
  reactionTime: '10 minutes',
  symptoms: ['Urticaria'],
  symptomsOther: '',
  interventionType: 'Antihistamine',
  interventionOther: '',
  plan: 'Avoid rocuronium',
  nurseNotes: {
    preTesting: 'Baseline observations normal',
    duringTesting: 'Observed wheal',
    postTesting: 'Stable on discharge',
    signedBy: 'RN Test',
  },
  tryptase: {
    obtained: true,
    significantElevation: false,
    values: [{ time: '1 hour', result: '8.1' }],
  },
});

const writeTTL = (key: string, value: LogFormData, savedAt = Date.now()) => {
  localStorage.setItem(key, JSON.stringify({ value, savedAt }));
};

const readTTL = <T,>(key: string): T | null => {
  const raw = localStorage.getItem(key);
  return raw ? (JSON.parse(raw).value as T) : null;
};

describe('useTestingState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('initializes with an empty form and loads recent mock logs', async () => {
    const { result } = renderHook(() => useTestingState());

    expect(result.current.formData.mrn).toBe('');
    expect(result.current.formData.testPanel).toHaveLength(2);

    await waitFor(() => {
      expect(result.current.recentLogs).toHaveLength(1);
    });
  });

  it('restores a fresh active report and testing draft from TTL storage', async () => {
    const activeReport = baseForm();
    const savedAt = Date.now();
    const draft = {
      ...baseForm(),
      mrn: '654321',
      firstName: 'Draft',
      tryptase: {
        obtained: true,
        significantElevation: true,
        values: [{ time: 30, result: 12.4 }],
      },
    } as unknown as LogFormData;

    writeTTL(ACTIVE_REPORT_KEY, activeReport, savedAt);
    writeTTL(TESTING_DRAFT_KEY, draft, savedAt);

    const { result } = renderHook(() => useTestingState());

    await waitFor(() => {
      expect(result.current.lastSavedRecord?.mrn).toBe('123456');
      expect(result.current.formData.mrn).toBe('654321');
    });
    expect(result.current.formData.tryptase).toEqual({
      obtained: true,
      significantElevation: true,
      values: [{ time: '30', result: '12.4' }],
    });
    expect(result.current.activeReportSavedAt).toBe(savedAt);
    expect(result.current.lastDraftSavedAt).toBe(savedAt);
    expect(result.current.isSavingDraft).toBe(false);
  });

  it('does not re-save or mark restored draft as saving on reload', async () => {
    const initialSavedAt = Date.now();
    writeTTL(TESTING_DRAFT_KEY, baseForm(), initialSavedAt);

    const { result } = renderHook(() => useTestingState());

    await waitFor(() => {
      expect(result.current.formData.mrn).toBe('123456');
    });

    expect(result.current.lastDraftSavedAt).toBe(initialSavedAt);
    expect(result.current.isSavingDraft).toBe(false);
  });

  it('does not restore stale drafts', () => {
    writeTTL(TESTING_DRAFT_KEY, baseForm(), Date.now() - ACTIVE_REPORT_TTL_MS - 1);

    const { result } = renderHook(() => useTestingState());

    expect(result.current.formData.mrn).toBe('');
    expect(localStorage.getItem(TESTING_DRAFT_KEY)).toBeNull();
  });

  it('normalizes malformed tryptase drafts', async () => {
    writeTTL(TESTING_DRAFT_KEY, {
      ...baseForm(),
      tryptase: {
        obtained: '',
        significantElevation: 1,
        values: [null, { time: 60 }],
      },
    } as unknown as LogFormData);

    const { result } = renderHook(() => useTestingState());

    await waitFor(() => {
      expect(result.current.formData.tryptase).toEqual({
        obtained: false,
        significantElevation: true,
        values: [
          { time: '', result: '' },
          { time: '60', result: '' },
        ],
      });
    });
  });

  it('autosaves dirty sessions after the debounce delay', async () => {
    vi.useFakeTimers();
    const initialTime = new Date(2026, 5, 10, 14, 5);
    vi.setSystemTime(initialTime);
    const { result } = renderHook(() => useTestingState());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.lastDraftSavedAt).toBeNull();
    expect(result.current.isSavingDraft).toBe(false);

    act(() => {
      result.current.setFormData({ ...result.current.formData, controls: { ...result.current.formData.controls, histamineSpt: '5' } });
    });

    expect(result.current.isSavingDraft).toBe(true);
    expect(result.current.lastDraftSavedAt).toBeNull();

    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(localStorage.getItem(TESTING_DRAFT_KEY)).toBeNull();
    expect(result.current.lastDraftSavedAt).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    const storedDraft = readTTL<any>(TESTING_DRAFT_KEY);
    const draftControls = storedDraft?.formData ? storedDraft.formData.controls : storedDraft?.controls;
    expect(draftControls?.histamineSpt).toBe('5');
    expect(result.current.lastDraftSavedAt).toBe(initialTime.getTime() + 500);
    expect(result.current.isSavingDraft).toBe(false);
  });

  it('sanitizes and saves submitted records, then clears the draft', async () => {
    const unsafeForm = {
      ...baseForm(),
      id: 123,
      timestamp: 456,
      controls: {
        histamineSpt: 5,
        salineSpt: 0,
        salineIdt: null,
      },
      testPanel: [
        {
          id: 99,
          drugName: 'Rocuronium',
          sptWheal: 3,
          idtResults: [0, 4, null],
          protocolIndex: 'bad',
          customName: 42,
          notes: 17,
        },
      ],
      symptoms: ['Urticaria', 123],
      nurseNotes: {
        preTesting: 1,
        duringTesting: 2,
        postTesting: 3,
        signedBy: 4,
      },
      tryptase: {
        obtained: 1,
        significantElevation: 0,
        values: [{ time: 30, result: 12.4 }],
      },
    } as unknown as LogFormData;

    writeTTL(TESTING_DRAFT_KEY, baseForm());
    const { result } = renderHook(() => useTestingState());

    act(() => {
      result.current.setFormData(unsafeForm);
    });

    await waitFor(() => {
      expect(result.current.formData.mrn).toBe('123456');
    });

    let saved: LogFormData | null | undefined;
    act(() => {
      saved = result.current.handleSubmit();
    });

    expect(saved).toMatchObject({
      id: '123',
      timestamp: '456',
      controls: {
        histamineSpt: '5',
        salineSpt: '',
        salineIdt: '',
      },
      testPanel: [
        {
          id: '99',
          drugName: 'Rocuronium',
          sptWheal: '3',
          idtResults: ['0', '4', ''],
          protocolIndex: 0,
          customName: '42',
          notes: '17',
        },
      ],
      symptoms: ['Urticaria', '123'],
      nurseNotes: {
        preTesting: '1',
        duringTesting: '2',
        postTesting: '3',
        signedBy: '4',
      },
      tryptase: {
        obtained: true,
        significantElevation: false,
        values: [{ time: '30', result: '12.4' }],
      },
    });
    expect(result.current.lastSavedRecord).toEqual(saved);
    const storedReport = readTTL<any>(ACTIVE_REPORT_KEY);
    const reportRecord = storedReport?.record || storedReport;
    expect(reportRecord).toEqual(saved);
    expect(localStorage.getItem(TESTING_DRAFT_KEY)).toBeNull();
  });

  it('preserves legacy IDT fields and normalizes invalid optional fields on submit', async () => {
    const legacyForm = {
      ...baseForm(),
      id: '',
      timestamp: '',
      testPanel: [
        {
          drugName: 'Legacy row',
          sptWheal: '',
          idt100: '',
          idt10: '5',
          idtNeat: '',
          protocolIndex: 2,
          customName: '',
          notes: '',
        },
      ],
      challengeDrugCustom: '',
      outcome: 'UNKNOWN',
      nurseNotes: undefined,
      tryptase: undefined,
    } as unknown as LogFormData;

    const { result } = renderHook(() => useTestingState());

    act(() => {
      result.current.setFormData(legacyForm);
    });

    await waitFor(() => {
      expect(result.current.formData.testPanel[0].drugName).toBe('Legacy row');
    });

    let saved: LogFormData | null | undefined;
    act(() => {
      saved = result.current.handleSubmit();
    });

    expect(saved).toMatchObject({
      id: undefined,
      timestamp: undefined,
      outcome: null,
      challengeDrugCustom: undefined,
      nurseNotes: undefined,
      tryptase: undefined,
      testPanel: [
        {
          drugName: 'Legacy row',
          idtResults: ['', '5'],
          protocolIndex: 2,
          customName: undefined,
          notes: undefined,
        },
      ],
    });
  });

  it('saves partial nurse notes and malformed tryptase shapes defensively', async () => {
    const partialForm = {
      ...baseForm(),
      nurseNotes: {
        preTesting: '',
        duringTesting: 'During',
      },
      tryptase: {
        obtained: false,
        significantElevation: false,
        values: 'not-an-array',
      },
    } as unknown as LogFormData;
    const { result } = renderHook(() => useTestingState());

    act(() => {
      result.current.setFormData(partialForm);
    });

    await waitFor(() => {
      expect(result.current.formData.nurseNotes?.duringTesting).toBe('During');
    });

    let saved: LogFormData | null | undefined;
    act(() => {
      saved = result.current.handleSubmit();
    });

    expect(saved?.nurseNotes).toEqual({
      preTesting: undefined,
      duringTesting: 'During',
      postTesting: undefined,
      signedBy: undefined,
    });
    expect(saved?.tryptase).toEqual({
      obtained: false,
      significantElevation: false,
      values: [],
    });
  });

  it('logs and rethrows submit parser failures', () => {
    const invalidForm = { ...baseForm() };
    Object.defineProperty(invalidForm, 'mrn', {
      get() {
        throw new TypeError('Unreadable MRN');
      },
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { result } = renderHook(() => useTestingState());

    act(() => {
      result.current.setFormData(invalidForm);
    });

    expect(() => result.current.handleSubmit()).toThrow(TypeError);
    expect(errorSpy).toHaveBeenCalledWith('Error saving clinical record:', expect.any(TypeError));
  });

  it('resets the form and clears only the testing draft', () => {
    writeTTL(TESTING_DRAFT_KEY, baseForm());
    const { result } = renderHook(() => useTestingState());

    act(() => {
      result.current.setLastSavedRecord(baseForm());
      result.current.resetForm();
    });

    expect(result.current.formData.mrn).toBe('');
    expect(result.current.lastSavedRecord?.mrn).toBe('123456');
    expect(localStorage.getItem(TESTING_DRAFT_KEY)).toBeNull();
  });

  it('clears the active report and draft', () => {
    writeTTL(ACTIVE_REPORT_KEY, baseForm());
    writeTTL(TESTING_DRAFT_KEY, baseForm());
    const { result } = renderHook(() => useTestingState());

    act(() => {
      result.current.clearActiveReport();
    });

    expect(result.current.lastSavedRecord).toBeNull();
    expect(result.current.activeReportSavedAt).toBeNull();
    expect(localStorage.getItem(ACTIVE_REPORT_KEY)).toBeNull();
    expect(localStorage.getItem(TESTING_DRAFT_KEY)).toBeNull();
  });

  it('synchronously persists dirty draft and cancels debounce when persistDraftNow is called', () => {
    const { result } = renderHook(() => useTestingState());
    const modifiedForm = baseForm();

    act(() => {
      result.current.setFormData(modifiedForm);
    });

    expect(result.current.isSavingDraft).toBe(true);

    act(() => {
      result.current.persistDraftNow();
    });

    expect(result.current.isSavingDraft).toBe(false);
    expect(result.current.lastDraftSavedAt).not.toBeNull();
    const stored = localStorage.getItem(TESTING_DRAFT_KEY);
    expect(stored).not.toBeNull();
    const storedValue = JSON.parse(stored!).value;
    const storedMrn = storedValue?.formData ? storedValue.formData.mrn : storedValue?.mrn;
    expect(storedMrn).toBe('123456');
  });

  it('warns when mock testing logs fail to load', async () => {
    vi.resetModules();
    vi.doMock('@shared/data/mockTestingLogs', () => {
      throw new Error('mock load failed');
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { useTestingState: useTestingStateWithFailedImport } = await import('./useTestingState');

    renderHook(() => useTestingStateWithFailedImport());

    await waitFor(() => {
      expect(warnSpy).toHaveBeenCalledWith('Unable to load mock testing logs:', expect.any(Error));
    });
  });

  it('clears in-memory active report and draft state when TTL storage expires on storage event', async () => {
    const savedAt = Date.now();
    writeTTL(ACTIVE_REPORT_KEY, baseForm(), savedAt);
    writeTTL(TESTING_DRAFT_KEY, baseForm(), savedAt);
    localStorage.setItem('dream_patients_v1', JSON.stringify({ value: [{ id: 'p1' }], savedAt }));

    const { result } = renderHook(() => useTestingState());

    await waitFor(() => {
      expect(result.current.lastSavedRecord?.mrn).toBe('123456');
      expect(result.current.formData.mrn).toBe('123456');
    });

    // Simulate storage key expiry/removal
    localStorage.removeItem(ACTIVE_REPORT_KEY);
    localStorage.removeItem(TESTING_DRAFT_KEY);

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: ACTIVE_REPORT_KEY }));
    });

    expect(result.current.lastSavedRecord).toBeNull();
    expect(result.current.activeReportContext).toBeNull();
    expect(result.current.activeReportSavedAt).toBeNull();

    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: TESTING_DRAFT_KEY }));
    });

    expect(result.current.formData.mrn).toBe('');
    expect(result.current.lastDraftSavedAt).toBeNull();

    // Verify unrelated patient database state is preserved
    expect(localStorage.getItem('dream_patients_v1')).not.toBeNull();
  });

  it('clears in-memory active report and draft state on focus or visibilitychange after TTL expiry', async () => {
    const savedAt = Date.now();
    writeTTL(ACTIVE_REPORT_KEY, baseForm(), savedAt);
    writeTTL(TESTING_DRAFT_KEY, baseForm(), savedAt);

    const { result } = renderHook(() => useTestingState());

    await waitFor(() => {
      expect(result.current.lastSavedRecord?.mrn).toBe('123456');
    });

    // Remove from storage to simulate TTL expiry
    localStorage.removeItem(ACTIVE_REPORT_KEY);
    localStorage.removeItem(TESTING_DRAFT_KEY);

    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    expect(result.current.lastSavedRecord).toBeNull();
    expect(result.current.formData.mrn).toBe('');

    // Re-seed and test visibilitychange
    writeTTL(ACTIVE_REPORT_KEY, baseForm(), savedAt);
    act(() => {
      result.current.setLastSavedRecord(baseForm());
    });
    localStorage.removeItem(ACTIVE_REPORT_KEY);

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(result.current.lastSavedRecord).toBeNull();
  });

  it('removes stale active report and draft keys from localStorage during checkExpiry while preserving patient db', async () => {
    const freshTimestamp = Date.now();
    writeTTL(ACTIVE_REPORT_KEY, baseForm(), freshTimestamp);
    writeTTL(TESTING_DRAFT_KEY, baseForm(), freshTimestamp);
    localStorage.setItem('dream:patient_db', JSON.stringify({ value: { patients: [] }, savedAt: freshTimestamp }));

    const { result } = renderHook(() => useTestingState());

    await waitFor(() => {
      expect(result.current.lastSavedRecord?.mrn).toBe('123456');
      expect(result.current.formData.mrn).toBe('123456');
    });

    // Make entries stale in localStorage without manual removal (simulating elapsed time > TTL)
    const staleTimestamp = Date.now() - ACTIVE_REPORT_TTL_MS - 5000;
    writeTTL(ACTIVE_REPORT_KEY, baseForm(), staleTimestamp);
    writeTTL(TESTING_DRAFT_KEY, baseForm(), staleTimestamp);

    // Trigger checkExpiry via focus event
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    // In-memory state should be cleared
    expect(result.current.lastSavedRecord).toBeNull();
    expect(result.current.formData.mrn).toBe('');

    // Stale keys should have been purged from localStorage by getIfFresh
    expect(localStorage.getItem(ACTIVE_REPORT_KEY)).toBeNull();
    expect(localStorage.getItem(TESTING_DRAFT_KEY)).toBeNull();

    // Patient DB key must remain untouched
    expect(localStorage.getItem('dream:patient_db')).not.toBeNull();
  });

  it('retains stable session ID and updates context identity on direct entry edits and visitDate changes', () => {
    const { result } = renderHook(() => useTestingState());

    act(() => {
      result.current.setFormData({
        ...result.current.formData,
        mrn: 'DIR-123',
        firstName: 'Alex',
        lastName: 'Direct',
        visitDate: '2026-07-01',
        controls: {
          histamineSpt: '5',
          salineSpt: '0',
          salineIdt: '0',
        },
      });
    });

    act(() => {
      result.current.persistDraftNow();
    });

    const sessionId1 = result.current.workContext?.sessionId;
    expect(sessionId1).toBeDefined();
    expect(result.current.workContext?.firstName).toBe('Alex');
    expect(result.current.workContext?.testingVisitDate).toBe('2026-07-01');

    // Change visitDate only
    act(() => {
      result.current.setFormData(prev => ({
        ...prev,
        visitDate: '2026-07-05',
      }));
    });

    act(() => {
      result.current.persistDraftNow();
    });

    expect(result.current.workContext?.sessionId).toBe(sessionId1);
    expect(result.current.workContext?.testingVisitDate).toBe('2026-07-05');

    // Submit preserves the exact session context
    let saved: LogFormData | null | undefined;
    act(() => {
      saved = result.current.handleSubmit();
    });

    expect(result.current.activeReportContext?.sessionId).toBe(sessionId1);
    expect(result.current.activeReportContext?.testingVisitDate).toBe('2026-07-05');
    expect(saved?.visitDate).toBe('2026-07-05');
  });

  describe('storage failure handling (plan 004 M1/M2)', () => {
    function useFailingStorage(): void {
      const fake = {
        length: 0,
        clear: vi.fn(),
        getItem: vi.fn(() => null),
        key: vi.fn(() => null),
        removeItem: vi.fn(),
        setItem: vi.fn(() => {
          throw new DOMException('Full', 'QuotaExceededError');
        }),
      } as unknown as Storage;
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get: () => fake,
      });
    }

    function useOriginalStorage(): void {
      const iframe = document.createElement('iframe');
      document.body.appendChild(iframe);
      const real = iframe.contentWindow?.localStorage;
      iframe.remove();
      if (real) {
        Object.defineProperty(window, 'localStorage', {
          configurable: true,
          get: () => real,
        });
      }
    }

    afterEach(() => {
      useOriginalStorage();
      localStorage.clear();
    });

    it('keeps the previous confirmed timestamp when an autosave write fails', async () => {
      vi.useFakeTimers();
      const initialTime = new Date(2026, 5, 10, 14, 5);
      vi.setSystemTime(initialTime);
      const { result } = renderHook(() => useTestingState());

      await act(async () => {
        await Promise.resolve();
      });
      act(() => {
        result.current.setFormData({ ...result.current.formData, controls: { ...result.current.formData.controls, histamineSpt: '5' } });
      });
      act(() => {
        vi.advanceTimersByTime(500);
      });
      const confirmedAt = result.current.lastDraftSavedAt;
      expect(confirmedAt).not.toBeNull();

      useFailingStorage();
      act(() => {
        result.current.setFormData({ ...result.current.formData, controls: { ...result.current.formData.controls, histamineSpt: '7' } });
      });
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current.lastDraftSavedAt).toBe(confirmedAt);
      expect(result.current.storageWarning).toBe('Unable to save locally — keep this window open');
      expect(result.current.isSavingDraft).toBe(false);
      vi.useRealTimers();
    });

    it('returns false from manual persistence when the write fails', () => {
      useFailingStorage();
      const { result } = renderHook(() => useTestingState());

      act(() => {
        result.current.setFormData({ ...result.current.formData, controls: { ...result.current.formData.controls, histamineSpt: '5' } });
      });

      let persisted: boolean | undefined;
      act(() => {
        persisted = result.current.persistDraftNow();
      });
      expect(persisted).toBe(false);
      expect(result.current.lastDraftSavedAt).toBeNull();
      expect(result.current.storageWarning).not.toBeNull();
    });

    it('does not create the active report or clear the draft when the final save write fails', () => {
      useFailingStorage();
      const { result } = renderHook(() => useTestingState());

      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          mrn: 'MRN1',
          firstName: 'Test',
          lastName: 'Case',
        });
      });

      let saved: LogFormData | null | undefined;
      act(() => {
        saved = result.current.handleSubmit();
      });

      expect(saved).toBeNull();
      expect(result.current.lastSavedRecord).toBeNull();
      expect(result.current.activeReportSavedAt).toBeNull();
      expect(result.current.storageWarning).toContain('Unable to save this record locally');
    });

    it('clears the draft only after a confirmed final report write', () => {
      const { result } = renderHook(() => useTestingState());

      act(() => {
        result.current.setFormData({
          ...result.current.formData,
          mrn: 'MRN2',
          firstName: 'Write',
          lastName: 'Succeeds',
          controls: { ...result.current.formData.controls, histamineSpt: '4' },
        });
      });
      act(() => {
        result.current.persistDraftNow();
      });
      expect(localStorage.getItem(TESTING_DRAFT_KEY)).not.toBeNull();

      let saved: LogFormData | null | undefined;
      act(() => {
        saved = result.current.handleSubmit();
      });

      expect(saved).not.toBeNull();
      expect(result.current.lastSavedRecord).not.toBeNull();
      expect(localStorage.getItem(TESTING_DRAFT_KEY)).toBeNull();
      expect(result.current.storageWarning).toBeNull();
    });
  });
});
