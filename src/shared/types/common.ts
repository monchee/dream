export enum Screen {
  LOG = 'log',
  SUMMARY = 'summary',
  PATIENT_SUMMARY = 'patient-summary',
  DASHBOARD = 'dashboard',
  CHANGELOG = 'changelog',
  TESTING = 'testing',
  PRINT_PLAN = 'print-plan',
  ABOUT = 'about',
  FAQ = 'faq',
  DRUG_REFERENCE = 'drug-reference',
  CONTACT = 'contact',
  RESOURCES = 'resources',
  PRIVACY_POLICY = 'privacy-policy',
  CLINICAL_GOVERNANCE = 'clinical-governance',
  TERMS_OF_USE = 'terms-of-use',
  TECHNICAL_DOCUMENTATION = 'technical-documentation',
  DISCLAIMER = 'disclaimer',
}

export interface CategoryTheme {
  activeBg: string;
  activeRing: string;
  headerText: string;
  headerBorder: string;
  btnSelected: string;
  btnHover: string;
  pulse: string;
  rowBorder: string;
  actionText: string;
}
