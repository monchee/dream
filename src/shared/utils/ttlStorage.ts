/**
 * Time-boxed localStorage for patient/clinical data.
 *
 * Privacy model: any patient data written to this device is stamped with a
 * write time and automatically expires after `ACTIVE_REPORT_TTL_MS`. Stale
 * keys are removed on read and swept once on app init, so clinical data never
 * lingers on a shared workstation beyond the window.
 */

/** Single source of truth for how long patient data may persist locally. */
export const ACTIVE_REPORT_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

/** Every localStorage key that may hold patient/clinical data. */
export const ACTIVE_REPORT_KEY = 'dream:active_report';
export const TESTING_DRAFT_KEY = 'dream:testing_draft';
export const TESTING_PLAN_BUILDER_DRAFTS_KEY = 'dream:testing_plan_builder_drafts';
export const PATIENT_DB_KEY = 'dream:patient_db';
export const PATIENT_DATA_KEYS = [
  ACTIVE_REPORT_KEY,
  TESTING_DRAFT_KEY,
  TESTING_PLAN_BUILDER_DRAFTS_KEY,
  PATIENT_DB_KEY,
] as const;

interface TTLEntry<T> {
  value: T;
  savedAt: number;
}

/**
 * Store a value alongside its write timestamp.
 *
 * Returns true only after the write is confirmed by reading the key back and
 * verifying the stored bytes match. Returns false (without throwing) for
 * quota errors, private-mode/security errors, unavailable storage,
 * serialization errors, or a read-back mismatch — so callers never report a
 * clinical save that did not happen.
 */
export function setWithTTL<T>(key: string, value: T): boolean {
  let serialized: string;
  try {
    const entry: TTLEntry<T> = { value, savedAt: Date.now() };
    serialized = JSON.stringify(entry);
    localStorage.setItem(key, serialized);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn(`Unable to save local clinical data for "${key}": browser storage quota exceeded.`);
    }
    // localStorage may be unavailable (private mode / quota) — non-fatal
    return false;
  }
  try {
    return localStorage.getItem(key) === serialized;
  } catch {
    return false;
  }
}

/** Refresh a stored entry's write timestamp without changing its value. */
export function refreshTTL(key: string): void {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    const entry = JSON.parse(raw) as TTLEntry<unknown>;
    localStorage.setItem(key, JSON.stringify({
      value: entry.value,
      savedAt: Date.now(),
    } satisfies TTLEntry<unknown>));
  } catch {
    // localStorage may be unavailable or the entry corrupt — non-fatal
  }
}

/**
 * Return the stored value if it was written within `ttlMs`, otherwise remove
 * the key and return null. Also returns null for missing/corrupt entries.
 */
export function getIfFresh<T>(key: string, ttlMs: number = ACTIVE_REPORT_TTL_MS): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as TTLEntry<T>;
    if (typeof entry?.savedAt !== 'number') {
      localStorage.removeItem(key);
      return null;
    }
    if (Date.now() - entry.savedAt < ttlMs) {
      return entry.value;
    }
    localStorage.removeItem(key);
    return null;
  } catch {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
    return null;
  }
}

/** Read the write timestamp of a stored entry, or null if missing/stale/corrupt. */
export function getSavedAt(key: string, ttlMs: number = ACTIVE_REPORT_TTL_MS): number | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as TTLEntry<unknown>;
    if (typeof entry?.savedAt !== 'number') return null;
    return Date.now() - entry.savedAt < ttlMs ? entry.savedAt : null;
  } catch {
    return null;
  }
}

/** Remove a stored key. Non-fatal on failure. */
export function removeStored(key: string): void {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

/** Sweep every patient-data key, removing any that are stale. Call on app init. */
export function purgeStale(
  keys: readonly string[] = PATIENT_DATA_KEYS,
  ttlMs: number = ACTIVE_REPORT_TTL_MS,
): void {
  for (const key of keys) {
    // getIfFresh removes the key as a side effect when stale.
    getIfFresh(key, ttlMs);
  }
}
