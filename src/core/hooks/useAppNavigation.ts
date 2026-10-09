import { useState, useEffect, useCallback, useRef } from 'react';
import { Screen } from '@shared/types';
import {
  screenFromPath,
  pathFromScreen,
  SCREEN_URL_MAP,
} from '@core/navigation/navigationConfig';

export interface NavigateOptions {
  bypassGuard?: boolean;
}

export interface UseAppNavigationOptions {
  isDirty?: boolean;
  persistDraftNow?: () => boolean | void;
}

export interface AppNavigation {
  screen: Screen;
  hrefFor: (screen: Screen) => string;
  navigate: (screen: Screen, options?: NavigateOptions) => void;
  pendingNavigation: Screen | null;
  confirmNavigation: () => void;
  cancelNavigation: () => void;
  // Compatibility helpers for existing callers/tests
  setScreen: (newScreen: Screen | ((prev: Screen) => Screen), options?: NavigateOptions) => void;
  navigateTo: (screen: Screen, options?: NavigateOptions) => void;
}

interface DreamHistoryState {
  screen: Screen;
  dreamNavigationIndex: number;
}

export function useAppNavigation(options: UseAppNavigationOptions = {}): AppNavigation {
  const { isDirty = false, persistDraftNow } = options;

  // Initialize screen and navigation index from current location & history state
  const [screen, setScreenInternal] = useState<Screen>(() => {
    if (typeof window === 'undefined') return Screen.LOG;
    return screenFromPath(window.location.pathname);
  });

  const [pendingNavigation, setPendingNavigation] = useState<Screen | null>(null);

  const navIndexRef = useRef<number>(
    typeof window !== 'undefined' && typeof window.history.state?.dreamNavigationIndex === 'number'
      ? window.history.state.dreamNavigationIndex
      : 0
  );

  // Track latest isDirty and screen in refs for event callbacks
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  const currentScreenRef = useRef(screen);
  currentScreenRef.current = screen;

  const persistDraftNowRef = useRef(persistDraftNow);
  persistDraftNowRef.current = persistDraftNow;

  const isRestoringHistoryRef = useRef(false);
  const isBypassingPopStateGuardRef = useRef(false);
  const pendingPopStateRef = useRef<{ targetScreen: Screen; originalDelta: number } | null>(null);

  // Initialize history entry with indexed state if needed
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const initialScreen = screenFromPath(window.location.pathname);
    const existingIndex = window.history.state?.dreamNavigationIndex;
    if (typeof existingIndex === 'number') {
      navIndexRef.current = existingIndex;
    } else {
      const initialIndex = 0;
      navIndexRef.current = initialIndex;
      const historyState: DreamHistoryState = {
        screen: initialScreen,
        dreamNavigationIndex: initialIndex,
      };
      window.history.replaceState(historyState, '', pathFromScreen(initialScreen));
    }
  }, []);

  const hrefFor = useCallback((targetScreen: Screen): string => {
    return pathFromScreen(targetScreen);
  }, []);

  const focusMainContent = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    requestAnimationFrame(() => {
      const mainEl = document.getElementById('main-content');
      if (mainEl) {
        mainEl.focus();
      }
    });
  }, []);

  const commitNavigation = useCallback((nextScreen: Screen) => {
    const nextIndex = (navIndexRef.current ?? 0) + 1;
    navIndexRef.current = nextIndex;
    const historyState: DreamHistoryState = {
      screen: nextScreen,
      dreamNavigationIndex: nextIndex,
    };
    const path = pathFromScreen(nextScreen);
    if (typeof window !== 'undefined') {
      window.history.pushState(historyState, '', path);
    }
    setScreenInternal(nextScreen);
    focusMainContent();
  }, [focusMainContent]);

  const navigate = useCallback((targetScreen: Screen, navOptions?: NavigateOptions) => {
    if (targetScreen === currentScreenRef.current) {
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    // If currently on Testing with unsaved dirty changes, guard leaving unless bypassGuard is set
    if (!navOptions?.bypassGuard && currentScreenRef.current === Screen.TESTING && isDirtyRef.current) {
      pendingPopStateRef.current = null;
      setPendingNavigation(targetScreen);
      return;
    }

    commitNavigation(targetScreen);
  }, [commitNavigation]);

  const confirmNavigation = useCallback(() => {
    if (pendingNavigation !== null) {
      const target = pendingNavigation;
      const pendingPop = pendingPopStateRef.current;
      // Persist the draft before leaving; an explicit false means the local
      // write failed — keep the clinician here with the guard still open.
      const persisted = persistDraftNowRef.current?.();
      if (persisted === false) {
        return;
      }
      pendingPopStateRef.current = null;
      setPendingNavigation(null);

      if (pendingPop && pendingPop.originalDelta !== 0) {
        isBypassingPopStateGuardRef.current = true;
        if (typeof window !== 'undefined') {
          window.history.go(pendingPop.originalDelta);
        }
      } else {
        commitNavigation(target);
      }
    }
  }, [pendingNavigation, commitNavigation]);

  const cancelNavigation = useCallback(() => {
    pendingPopStateRef.current = null;
    setPendingNavigation(null);
  }, []);

  // Backward-compatible setScreen
  const setScreen = useCallback((newScreen: Screen | ((prev: Screen) => Screen), navOptions?: NavigateOptions) => {
    if (typeof newScreen === 'function') {
      const next = newScreen(currentScreenRef.current);
      navigate(next, navOptions);
    } else {
      navigate(newScreen, navOptions);
    }
  }, [navigate]);

  // Handle popstate (browser Back/Forward)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = (event: PopStateEvent) => {
      if (isRestoringHistoryRef.current) {
        isRestoringHistoryRef.current = false;
        return;
      }

      const targetPath = window.location.pathname;
      const targetScreen = screenFromPath(targetPath);
      const targetIndex = event.state?.dreamNavigationIndex;

      if (isBypassingPopStateGuardRef.current) {
        isBypassingPopStateGuardRef.current = false;
        if (typeof targetIndex === 'number') {
          navIndexRef.current = targetIndex;
        }
        setScreenInternal(targetScreen);
        focusMainContent();
        return;
      }

      // Check if we are attempting to leave dirty testing
      if (currentScreenRef.current === Screen.TESTING && isDirtyRef.current && targetScreen !== Screen.TESTING) {
        // Restore history entry to keep URL and history aligned with testing session
        const currentIndex = navIndexRef.current ?? 0;
        const originalDelta = typeof targetIndex === 'number' ? targetIndex - currentIndex : -1;
        const restoreDelta = -originalDelta;

        pendingPopStateRef.current = {
          targetScreen,
          originalDelta,
        };

        if (restoreDelta !== 0) {
          isRestoringHistoryRef.current = true;
          window.history.go(restoreDelta);
        } else {
          window.history.pushState(
            { screen: Screen.TESTING, dreamNavigationIndex: currentIndex },
            '',
            pathFromScreen(Screen.TESTING)
          );
        }

        setPendingNavigation(targetScreen);
        return;
      }

      // Normal popstate navigation
      if (typeof targetIndex === 'number') {
        navIndexRef.current = targetIndex;
      }
      setScreenInternal(targetScreen);
      focusMainContent();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [focusMainContent]);

  // Native beforeunload listener for refresh / tab close / external links
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentScreenRef.current === Screen.TESTING && isDirtyRef.current) {
        persistDraftNowRef.current?.();
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return {
    screen,
    hrefFor,
    navigate,
    pendingNavigation,
    confirmNavigation,
    cancelNavigation,
    setScreen,
    navigateTo: navigate,
  };
}

export { SCREEN_URL_MAP, screenFromPath as getScreenFromPath, pathFromScreen as getPathFromScreen };
