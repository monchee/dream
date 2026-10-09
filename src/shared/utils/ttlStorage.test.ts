import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { refreshTTL, setWithTTL } from './ttlStorage';

/** Replace the global localStorage with a throwing/fake double for failure injection. */
const originalStorage = window.localStorage;
function useFakeStorage(overrides: Partial<Storage>): void {
  const fake = {
    length: 0,
    clear: vi.fn(),
    getItem: vi.fn(() => null),
    key: vi.fn(() => null),
    removeItem: vi.fn(),
    setItem: vi.fn(),
    ...overrides,
  } as unknown as Storage;
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    get: () => fake,
  });
}

function useRealStorage(): void {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    get: () => originalStorage,
  });
}

describe('refreshTTL', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('preserves the stored value and refreshes its timestamp', () => {
    const value = { patientId: 'example', draft: ['one', 'two'] };
    localStorage.setItem('clinical-key', JSON.stringify({ value, savedAt: 1_000 }));
    vi.setSystemTime(50_000);

    refreshTTL('clinical-key');

    expect(JSON.parse(localStorage.getItem('clinical-key')!)).toEqual({
      value,
      savedAt: 50_000,
    });
  });

  it('does nothing and does not throw for a missing key', () => {
    expect(() => refreshTTL('missing-key')).not.toThrow();
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });
});

describe('setWithTTL — truthful persistence (plan 004 M1)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(50_000);
  });

  afterEach(() => {
    useRealStorage();
    vi.useRealTimers();
  });

  it('returns true and stores the TTL envelope on a successful write', () => {
    const value = { clinical: 'example-entry' };

    expect(setWithTTL('clinical-key', value)).toBe(true);
    expect(JSON.parse(localStorage.getItem('clinical-key')!)).toEqual({
      value,
      savedAt: 50_000,
    });
  });

  it('returns false without throwing when storage quota is exceeded', () => {
    useFakeStorage({
      setItem: vi.fn(() => {
        throw new DOMException('Full', 'QuotaExceededError');
      }),
    });

    expect(() => setWithTTL('clinical-key', { clinical: 'example-entry' })).not.toThrow();
    expect(setWithTTL('clinical-key', { clinical: 'example-entry' })).toBe(false);
  });

  it('returns false without throwing when storage is unavailable (private mode)', () => {
    useFakeStorage({
      setItem: vi.fn(() => {
        throw new DOMException('Denied', 'SecurityError');
      }),
    });

    expect(setWithTTL('clinical-key', { clinical: 'example-entry' })).toBe(false);
  });

  it('returns false without throwing when setItem fails for any other reason', () => {
    useFakeStorage({
      setItem: vi.fn(() => {
        throw new Error('storage unavailable');
      }),
    });

    expect(setWithTTL('clinical-key', { clinical: 'example-entry' })).toBe(false);
  });

  it('returns false when the write cannot be read back (silent corruption)', () => {
    useFakeStorage({
      setItem: vi.fn(),
      getItem: vi.fn(() => '{"tampered":true}'),
    });

    expect(setWithTTL('clinical-key', { clinical: 'example-entry' })).toBe(false);
  });

  it('stores an unchanged TTL envelope shape that getIfFresh still reads', () => {
    setWithTTL('clinical-key', { clinical: 'example-entry' });

    const raw = JSON.parse(localStorage.getItem('clinical-key')!);
    expect(Object.keys(raw).sort()).toEqual(['savedAt', 'value']);
    expect(raw.savedAt).toBe(50_000);
  });
});
