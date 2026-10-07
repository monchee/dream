import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppNavigation } from './useAppNavigation';
import { Screen } from '@shared/types';

describe('useAppNavigation', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Reset location and history for each test
    vi.stubGlobal('location', {
      ...originalLocation,
      pathname: '/',
    });
    window.history.replaceState({ screen: Screen.LOG, dreamNavigationIndex: 0 }, '', '/');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should initialize with Screen.LOG when path is /', () => {
    const { result } = renderHook(() => useAppNavigation());
    expect(result.current.screen).toBe(Screen.LOG);
    expect(result.current.hrefFor(Screen.LOG)).toBe('/');
  });

  it('should initialize with correct screen from URL', () => {
    vi.stubGlobal('location', {
      ...originalLocation,
      pathname: '/dashboard',
    });

    const { result } = renderHook(() => useAppNavigation());
    expect(result.current.screen).toBe(Screen.DASHBOARD);
    expect(result.current.hrefFor(Screen.DASHBOARD)).toBe('/dashboard');
  });

  it('should fall back to Screen.LOG for unknown paths', () => {
    vi.stubGlobal('location', {
      ...originalLocation,
      pathname: '/unknown-route-12345',
    });

    const { result } = renderHook(() => useAppNavigation());
    expect(result.current.screen).toBe(Screen.LOG);
  });

  it('should update URL and push indexed history state when navigate is called', () => {
    const pushStateSpy = vi.spyOn(window.history, 'pushState');
    const { result } = renderHook(() => useAppNavigation());

    act(() => {
      result.current.navigate(Screen.DASHBOARD);
    });

    expect(result.current.screen).toBe(Screen.DASHBOARD);
    expect(pushStateSpy).toHaveBeenCalledWith(
      { screen: Screen.DASHBOARD, dreamNavigationIndex: 1 },
      '',
      '/dashboard'
    );
  });

  it('should not push history when navigating to current screen', () => {
    const pushStateSpy = vi.spyOn(window.history, 'pushState');
    const { result } = renderHook(() => useAppNavigation());

    act(() => {
      result.current.navigate(Screen.LOG);
    });

    expect(result.current.screen).toBe(Screen.LOG);
    expect(pushStateSpy).not.toHaveBeenCalled();
  });

  it('should handle popstate events', () => {
    const { result } = renderHook(() => useAppNavigation());

    act(() => {
      vi.stubGlobal('location', {
        ...originalLocation,
        pathname: '/testing',
      });
      window.dispatchEvent(
        new PopStateEvent('popstate', {
          state: { screen: Screen.TESTING, dreamNavigationIndex: 2 },
        })
      );
    });

    expect(result.current.screen).toBe(Screen.TESTING);
  });

  it('should guard dirty testing navigation, allow cancel, and confirm with draft flush', () => {
    const persistDraftNow = vi.fn();
    const pushStateSpy = vi.spyOn(window.history, 'pushState');

    // Start on testing screen with dirty draft
    vi.stubGlobal('location', {
      ...originalLocation,
      pathname: '/testing',
    });

    const { result } = renderHook(() =>
      useAppNavigation({ isDirty: true, persistDraftNow })
    );

    expect(result.current.screen).toBe(Screen.TESTING);
    expect(result.current.pendingNavigation).toBeNull();

    // Attempt internal navigation to Dashboard
    act(() => {
      result.current.navigate(Screen.DASHBOARD);
    });

    // Screen should remain TESTING, pendingNavigation set to DASHBOARD, no pushState yet
    expect(result.current.screen).toBe(Screen.TESTING);
    expect(result.current.pendingNavigation).toBe(Screen.DASHBOARD);
    expect(pushStateSpy).not.toHaveBeenCalled();

    // Test Cancellation
    act(() => {
      result.current.cancelNavigation();
    });

    expect(result.current.screen).toBe(Screen.TESTING);
    expect(result.current.pendingNavigation).toBeNull();
    expect(persistDraftNow).not.toHaveBeenCalled();

    // Re-attempt navigation to Dashboard
    act(() => {
      result.current.navigate(Screen.DASHBOARD);
    });

    expect(result.current.pendingNavigation).toBe(Screen.DASHBOARD);

    // Test Confirmation
    act(() => {
      result.current.confirmNavigation();
    });

    expect(persistDraftNow).toHaveBeenCalledOnce();
    expect(result.current.screen).toBe(Screen.DASHBOARD);
    expect(result.current.pendingNavigation).toBeNull();
    expect(pushStateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ screen: Screen.DASHBOARD }),
      '',
      '/dashboard'
    );
  });

  it('should trigger beforeunload and persist draft synchronously when dirty on testing screen', () => {
    const persistDraftNow = vi.fn();
    vi.stubGlobal('location', {
      ...originalLocation,
      pathname: '/testing',
    });

    renderHook(() => useAppNavigation({ isDirty: true, persistDraftNow }));

    const event = new Event('beforeunload') as BeforeUnloadEvent;
    event.preventDefault = vi.fn();

    window.dispatchEvent(event);

    expect(persistDraftNow).toHaveBeenCalledOnce();
    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('should navigate via navigateTo compatibility helper', () => {
    const pushStateSpy = vi.spyOn(window.history, 'pushState');
    const { result } = renderHook(() => useAppNavigation());

    act(() => {
      result.current.navigateTo(Screen.DASHBOARD);
    });

    expect(result.current.screen).toBe(Screen.DASHBOARD);
    expect(pushStateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ screen: Screen.DASHBOARD }),
      '',
      '/dashboard'
    );
  });

  it('should bypass dirty guard when bypassGuard option is provided', () => {
    const pushStateSpy = vi.spyOn(window.history, 'pushState');
    vi.stubGlobal('location', {
      ...originalLocation,
      pathname: '/testing',
    });

    const { result } = renderHook(() => useAppNavigation({ isDirty: true }));

    act(() => {
      result.current.navigate(Screen.SUMMARY, { bypassGuard: true });
    });

    expect(result.current.screen).toBe(Screen.SUMMARY);
    expect(result.current.pendingNavigation).toBeNull();
    expect(pushStateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ screen: Screen.SUMMARY }),
      '',
      '/summary'
    );
  });

  it('should bypass dirty guard when navigateTo is called with bypassGuard', () => {
    const pushStateSpy = vi.spyOn(window.history, 'pushState');
    vi.stubGlobal('location', {
      ...originalLocation,
      pathname: '/testing',
    });

    const { result } = renderHook(() => useAppNavigation({ isDirty: true }));

    act(() => {
      result.current.navigateTo(Screen.SUMMARY, { bypassGuard: true });
    });

    expect(result.current.screen).toBe(Screen.SUMMARY);
    expect(result.current.pendingNavigation).toBeNull();
    expect(pushStateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ screen: Screen.SUMMARY }),
      '',
      '/summary'
    );
  });

  it('should restore history and retain original delta on dirty popstate, then cancel cleanly', () => {
    const persistDraftNow = vi.fn();
    const goSpy = vi.spyOn(window.history, 'go').mockImplementation(() => {});

    vi.stubGlobal('location', {
      ...originalLocation,
      pathname: '/testing',
    });
    window.history.replaceState({ screen: Screen.TESTING, dreamNavigationIndex: 2 }, '', '/testing');

    const { result } = renderHook(() =>
      useAppNavigation({ isDirty: true, persistDraftNow })
    );

    // Simulate browser Back to /dashboard (index 1)
    act(() => {
      vi.stubGlobal('location', {
        ...originalLocation,
        pathname: '/dashboard',
      });
      window.dispatchEvent(
        new PopStateEvent('popstate', {
          state: { screen: Screen.DASHBOARD, dreamNavigationIndex: 1 },
        })
      );
    });

    // Restores index 2 via go(+1), retains pending target
    expect(goSpy).toHaveBeenCalledWith(1);
    expect(result.current.pendingNavigation).toBe(Screen.DASHBOARD);
    expect(result.current.screen).toBe(Screen.TESTING);

    // Cancel leaves current screen and URL intact
    act(() => {
      result.current.cancelNavigation();
    });

    expect(result.current.pendingNavigation).toBeNull();
    expect(result.current.screen).toBe(Screen.TESTING);
    expect(persistDraftNow).not.toHaveBeenCalled();
  });

  it('should confirm dirty popstate by persisting once and replaying original delta without pushState', () => {
    const persistDraftNow = vi.fn();
    const goSpy = vi.spyOn(window.history, 'go').mockImplementation(() => {});
    const pushStateSpy = vi.spyOn(window.history, 'pushState');

    vi.stubGlobal('location', {
      ...originalLocation,
      pathname: '/testing',
    });
    window.history.replaceState({ screen: Screen.TESTING, dreamNavigationIndex: 2 }, '', '/testing');

    const { result } = renderHook(() =>
      useAppNavigation({ isDirty: true, persistDraftNow })
    );

    // Simulate browser Back to /dashboard (index 1)
    act(() => {
      vi.stubGlobal('location', {
        ...originalLocation,
        pathname: '/dashboard',
      });
      window.dispatchEvent(
        new PopStateEvent('popstate', {
          state: { screen: Screen.DASHBOARD, dreamNavigationIndex: 1 },
        })
      );
    });

    expect(goSpy).toHaveBeenCalledWith(1);

    // Simulate restoration popstate from history.go(1)
    act(() => {
      vi.stubGlobal('location', {
        ...originalLocation,
        pathname: '/testing',
      });
      window.dispatchEvent(
        new PopStateEvent('popstate', {
          state: { screen: Screen.TESTING, dreamNavigationIndex: 2 },
        })
      );
    });

    expect(result.current.pendingNavigation).toBe(Screen.DASHBOARD);

    goSpy.mockClear();
    pushStateSpy.mockClear();

    // Confirm navigation
    act(() => {
      result.current.confirmNavigation();
    });

    expect(persistDraftNow).toHaveBeenCalledOnce();
    // Replays originalDelta (-1)
    expect(goSpy).toHaveBeenCalledWith(-1);
    expect(pushStateSpy).not.toHaveBeenCalled();

    // Simulate the destination popstate arrival for /dashboard
    act(() => {
      vi.stubGlobal('location', {
        ...originalLocation,
        pathname: '/dashboard',
      });
      window.dispatchEvent(
        new PopStateEvent('popstate', {
          state: { screen: Screen.DASHBOARD, dreamNavigationIndex: 1 },
        })
      );
    });

    expect(result.current.screen).toBe(Screen.DASHBOARD);
    expect(pushStateSpy).not.toHaveBeenCalled();
  });

  it('should handle clean popstate and fallback for entries without DREAM metadata', () => {
    const { result } = renderHook(() => useAppNavigation());

    act(() => {
      vi.stubGlobal('location', {
        ...originalLocation,
        pathname: '/about',
      });
      window.dispatchEvent(
        new PopStateEvent('popstate', {
          state: {},
        })
      );
    });

    expect(result.current.screen).toBe(Screen.ABOUT);
  });
});
