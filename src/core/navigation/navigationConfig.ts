import {
  Stethoscope,
  LayoutDashboard,
  TestTube2,
  FileText,
  Info,
  HelpCircle,
  FlaskConical,
  Mail,
  BookOpen,
  ScrollText,
  Shield,
  ShieldCheck,
  FileCheck,
  Cpu,
  AlertTriangle,
  LucideIcon,
} from 'lucide-react';
import { Screen, LogFormData } from '@shared/types';
import { ACTIVE_REPORT_TTL_MS } from '@shared/utils';

export interface NavigationItem {
  screen: Screen;
  label: string;
  href: string;
  icon: LucideIcon;
  ariaLabel?: string;
  badge?: string;
}

export const SCREEN_URL_MAP: Record<string, Screen> = {
  '/': Screen.LOG,
  '/log': Screen.LOG,
  '/dashboard': Screen.DASHBOARD,
  '/testing': Screen.TESTING,
  '/summary': Screen.SUMMARY,
  '/patient-summary': Screen.PATIENT_SUMMARY,
  '/print-plan': Screen.PRINT_PLAN,
  '/about': Screen.ABOUT,
  '/faq': Screen.FAQ,
  '/drug-reference': Screen.DRUG_REFERENCE,
  '/contact': Screen.CONTACT,
  '/resources': Screen.RESOURCES,
  '/changelog': Screen.CHANGELOG,
  '/privacy-policy': Screen.PRIVACY_POLICY,
  '/clinical-governance': Screen.CLINICAL_GOVERNANCE,
  '/terms-of-use': Screen.TERMS_OF_USE,
  '/technical-documentation': Screen.TECHNICAL_DOCUMENTATION,
  '/disclaimer': Screen.DISCLAIMER,
};

export function screenFromPath(path: string): Screen {
  if (!path) return Screen.LOG;
  const normalizedPath = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
  return SCREEN_URL_MAP[normalizedPath] || Screen.LOG;
}

export function pathFromScreen(screen: Screen): string {
  if (screen === Screen.LOG) return '/';
  return `/${screen}`;
}

export const PRIMARY_NAV_ITEMS: NavigationItem[] = [
  {
    screen: Screen.LOG,
    label: 'Home',
    href: '/',
    icon: Stethoscope,
    ariaLabel: 'Home',
  },
  {
    screen: Screen.DASHBOARD,
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    ariaLabel: 'Dashboard',
  },
];

export function isReportActive(
  lastSavedRecord: LogFormData | null | undefined,
  savedAt: number | null | undefined
): boolean {
  if (!lastSavedRecord || !savedAt) return false;
  return Date.now() - savedAt < ACTIVE_REPORT_TTL_MS;
}

export interface ContextualNavOptions {
  currentScreen: Screen;
  isTestingDraftDirty: boolean;
  hasActiveReport: boolean;
}

export function getContextualNavItems(
  options: ContextualNavOptions
): NavigationItem[] {
  const { currentScreen, isTestingDraftDirty, hasActiveReport } = options;

  const showTesting = currentScreen === Screen.TESTING || isTestingDraftDirty;
  const showReports = hasActiveReport;

  const testingItem: NavigationItem = {
    screen: Screen.TESTING,
    label: 'Testing Session',
    href: '/testing',
    icon: TestTube2,
    ariaLabel: 'Testing Session',
    badge: isTestingDraftDirty ? 'Draft' : undefined,
  };

  const reportsItem: NavigationItem = {
    screen: Screen.SUMMARY,
    label: 'Reports',
    href: '/summary',
    icon: FileText,
    ariaLabel: 'Reports',
    badge: hasActiveReport ? 'Active' : undefined,
  };

  const items: NavigationItem[] = [];

  if (showReports) items.push(reportsItem);
  if (showTesting) items.push(testingItem);

  return items;
}

export const UTILITY_NAV_ITEMS: NavigationItem[] = [
  {
    screen: Screen.ABOUT,
    label: 'About',
    href: '/about',
    icon: Info,
  },
  {
    screen: Screen.FAQ,
    label: 'FAQ',
    href: '/faq',
    icon: HelpCircle,
  },
  {
    screen: Screen.DRUG_REFERENCE,
    label: 'Drug Reference',
    href: '/drug-reference',
    icon: FlaskConical,
  },
  {
    screen: Screen.CONTACT,
    label: 'Contact / Support',
    href: '/contact',
    icon: Mail,
  },
  {
    screen: Screen.RESOURCES,
    label: 'Resources / Links',
    href: '/resources',
    icon: BookOpen,
  },
  {
    screen: Screen.CHANGELOG,
    label: 'Changelog',
    href: '/changelog',
    icon: ScrollText,
  },
];

export const FOOTER_LEGAL_ITEMS: NavigationItem[] = [
  {
    screen: Screen.PRIVACY_POLICY,
    label: 'Privacy',
    href: '/privacy-policy',
    icon: Shield,
  },
  {
    screen: Screen.CLINICAL_GOVERNANCE,
    label: 'Governance',
    href: '/clinical-governance',
    icon: ShieldCheck,
  },
  {
    screen: Screen.TERMS_OF_USE,
    label: 'Terms',
    href: '/terms-of-use',
    icon: FileCheck,
  },
  {
    screen: Screen.TECHNICAL_DOCUMENTATION,
    label: 'Technical',
    href: '/technical-documentation',
    icon: Cpu,
  },
  {
    screen: Screen.DISCLAIMER,
    label: 'Disclaimer',
    href: '/disclaimer',
    icon: AlertTriangle,
  },
];
