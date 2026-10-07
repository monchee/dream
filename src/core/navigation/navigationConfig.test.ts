import { describe, it, expect } from 'vitest';
import { Screen } from '@shared/types';
import {
  screenFromPath,
  pathFromScreen,
  PRIMARY_NAV_ITEMS,
  FOOTER_LEGAL_ITEMS,
  getContextualNavItems,
  isReportActive,
} from './navigationConfig';
import { ACTIVE_REPORT_TTL_MS } from '@shared/utils';
import { createMockLogFormData } from '@/src/test/factories/testingDataFactory';

describe('navigationConfig', () => {
  describe('Route and Path Codec', () => {
    it('maps all defined routes correctly between path and Screen', () => {
      expect(screenFromPath('/')).toBe(Screen.LOG);
      expect(screenFromPath('/log')).toBe(Screen.LOG);
      expect(screenFromPath('/dashboard')).toBe(Screen.DASHBOARD);
      expect(screenFromPath('/testing')).toBe(Screen.TESTING);
      expect(screenFromPath('/summary')).toBe(Screen.SUMMARY);
      expect(screenFromPath('/changelog')).toBe(Screen.CHANGELOG);
      expect(screenFromPath('/about')).toBe(Screen.ABOUT);
      expect(screenFromPath('/faq')).toBe(Screen.FAQ);
      expect(screenFromPath('/drug-reference')).toBe(Screen.DRUG_REFERENCE);
      expect(screenFromPath('/contact')).toBe(Screen.CONTACT);
      expect(screenFromPath('/resources')).toBe(Screen.RESOURCES);
      expect(screenFromPath('/privacy-policy')).toBe(Screen.PRIVACY_POLICY);
      expect(screenFromPath('/clinical-governance')).toBe(Screen.CLINICAL_GOVERNANCE);
      expect(screenFromPath('/terms-of-use')).toBe(Screen.TERMS_OF_USE);
      expect(screenFromPath('/technical-documentation')).toBe(Screen.TECHNICAL_DOCUMENTATION);
      expect(screenFromPath('/disclaimer')).toBe(Screen.DISCLAIMER);
    });

    it('normalizes trailing slashes on sub-paths', () => {
      expect(screenFromPath('/dashboard/')).toBe(Screen.DASHBOARD);
      expect(screenFromPath('/testing/')).toBe(Screen.TESTING);
    });

    it('falls back to Screen.LOG for unknown paths and empty inputs', () => {
      expect(screenFromPath('')).toBe(Screen.LOG);
      expect(screenFromPath('/non-existent-screen-slug')).toBe(Screen.LOG);
    });

    it('returns valid URLs from pathFromScreen', () => {
      expect(pathFromScreen(Screen.LOG)).toBe('/');
      expect(pathFromScreen(Screen.DASHBOARD)).toBe('/dashboard');
      expect(pathFromScreen(Screen.TESTING)).toBe('/testing');
      expect(pathFromScreen(Screen.SUMMARY)).toBe('/summary');
    });
  });

  describe('Primary Navigation definitions', () => {
    it('defines Home and Dashboard as permanent primary items', () => {
      expect(PRIMARY_NAV_ITEMS).toHaveLength(2);
      expect(PRIMARY_NAV_ITEMS[0].screen).toBe(Screen.LOG);
      expect(PRIMARY_NAV_ITEMS[0].label).toBe('Home');
      expect(PRIMARY_NAV_ITEMS[1].screen).toBe(Screen.DASHBOARD);
      expect(PRIMARY_NAV_ITEMS[1].label).toBe('Dashboard');
    });
  });

  describe('Active report predicate isReportActive', () => {
    it('returns true when record and valid recent timestamp exist', () => {
      const mockRecord = createMockLogFormData();
      const freshTime = Date.now() - 10_000; // 10s ago
      expect(isReportActive(mockRecord, freshTime)).toBe(true);
    });

    it('returns false when record or timestamp is missing', () => {
      const mockRecord = createMockLogFormData();
      expect(isReportActive(null, Date.now())).toBe(false);
      expect(isReportActive(mockRecord, null)).toBe(false);
      expect(isReportActive(undefined, undefined)).toBe(false);
    });

    it('returns false when record TTL has expired', () => {
      const mockRecord = createMockLogFormData();
      const expiredTime = Date.now() - (ACTIVE_REPORT_TTL_MS + 10_000);
      expect(isReportActive(mockRecord, expiredTime)).toBe(false);
    });
  });

  describe('Contextual Navigation Items ordering', () => {
    it('orders Reports before Testing in contextual navigation', () => {
      const items = getContextualNavItems({
        currentScreen: Screen.LOG,
        isTestingDraftDirty: true,
        hasActiveReport: true,
      });

      expect(items).toHaveLength(2);
      expect(items[0].screen).toBe(Screen.SUMMARY);
      expect(items[0].label).toBe('Reports');
      expect(items[1].screen).toBe(Screen.TESTING);
      expect(items[1].label).toBe('Testing Session');
    });

    it('shows only active work items that exist', () => {
      const onlyTesting = getContextualNavItems({
        currentScreen: Screen.LOG,
        isTestingDraftDirty: true,
        hasActiveReport: false,
      });
      expect(onlyTesting).toHaveLength(1);
      expect(onlyTesting[0].screen).toBe(Screen.TESTING);

      const onlyReports = getContextualNavItems({
        currentScreen: Screen.LOG,
        isTestingDraftDirty: false,
        hasActiveReport: true,
      });
      expect(onlyReports).toHaveLength(1);
      expect(onlyReports[0].screen).toBe(Screen.SUMMARY);

      const none = getContextualNavItems({
        currentScreen: Screen.LOG,
        isTestingDraftDirty: false,
        hasActiveReport: false,
      });
      expect(none).toHaveLength(0);
    });

    it('always shows Testing when currently on Testing screen', () => {
      const items = getContextualNavItems({
        currentScreen: Screen.TESTING,
        isTestingDraftDirty: false,
        hasActiveReport: false,
      });
      expect(items).toHaveLength(1);
      expect(items[0].screen).toBe(Screen.TESTING);
    });

    it('does not show Reports when currentScreen is Screen.SUMMARY if hasActiveReport is false', () => {
      const items = getContextualNavItems({
        currentScreen: Screen.SUMMARY,
        isTestingDraftDirty: false,
        hasActiveReport: false,
      });
      expect(items).toHaveLength(0);
      expect(items.some(item => item.screen === Screen.SUMMARY)).toBe(false);
    });
  });

  describe('Utility Navigation and Footer items', () => {
    it('contains all required legal/governance items for the reduced footer', () => {
      const legalScreens = FOOTER_LEGAL_ITEMS.map(item => item.screen);
      expect(legalScreens).toEqual([
        Screen.PRIVACY_POLICY,
        Screen.CLINICAL_GOVERNANCE,
        Screen.TERMS_OF_USE,
        Screen.TECHNICAL_DOCUMENTATION,
        Screen.DISCLAIMER,
      ]);
    });
  });
});
