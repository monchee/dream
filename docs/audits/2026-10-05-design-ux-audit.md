⚠️ DEGRADED: single-context (spawn_agent unavailable in this session)

# DREAM design and UI/UX audit

**Audit date:** 2026-10-05  
**Scope:** static source review and committed screenshots only; no application launch  
**Judging bar:** a nurse working mid-procedure on a shared hospital terminal, and a 375px-wide phone in a procedure room  
**Product mode:** local-first clinical workbench, with a 4-digit privacy screen-lock and A4 clinical outputs

## 1. Executive summary

### Verdict

DREAM has a strong, recognisably clinical foundation. The current workbench is much more coherent than a collection of unrelated screens: the desktop sidebar/topbar system, patient context bar, seven-step testing workflow, report tabs, draft protection, and print identity treatment all support the right clinical story. The committed desktop and mobile goldens show a quiet navy-and-slate workbench with sensible density rather than a consumer dashboard (`e2e/screenshots/after/dashboard-desktop.png`, `e2e/screenshots/after/dashboard-mobile.png`, `e2e/screenshots/after/summary-desktop.png`, `e2e/screenshots/after/summary-mobile.png`).

This is a **conditional pass for continued pilot use, not a final clinical accessibility sign-off**. No P0 “cannot use the product” blocker was found in static review, but several P1 issues are close to the clinical interaction path: status colours do not consistently meet WCAG AA in both themes, important controls and fields are below the 44px touch target, some small controls have weak accessible names, and print code still contains contradictory page-break and colour rules. The highest-value next step is a short safety-and-operability pass, not another broad visual redesign.

### What matters most to a clinical stakeholder

- **Make the meaning of status colours dependable.** Several grade/status combinations are below 4.5:1 when used as text or white text on a coloured badge. Static calculations from the current HSL tokens give light-theme text ratios of 3.29:1 for success, 3.02:1 for warning, and 3.76:1 for danger on white; the dark-theme grade badges are also weak when they keep white or bright foreground text (`index.css:74-91`, `index.css:255-273`, `components/ui/badge.tsx:18-26`). A nurse should not need perfect eyesight or a perfect display to distinguish “safe”, “positive”, “urgent”, and “under review”.
- **Make every bedside interaction forgiving.** The shared Button primitive adds a 44px minimum below `xl`, but the shared Input and Select primitives remain 36px high and testing-specific controls explicitly shrink to 28–32px (`components/ui/button.tsx:7-27`, `components/ui/input.tsx:5-16`, `components/ui/select.tsx:19-25`, `src/features/testing/components/DrugTestGrid.tsx:253-259`). Tiny remove, clear, “add dilution”, and filter controls are especially difficult with a phone or gloved hand (`src/features/testing/components/DrugTestGrid.tsx:127-181`, `src/features/dashboard/components/AdvancedSearchFilters.tsx:303-309`).
- **Treat patient identity as a fixed safety rail, not a scrolling sentence.** The context bar intentionally uses `min-w-max` and horizontal scrolling on tablet/desktop; the mobile topbar can truncate the page title next to status badges and actions (`src/features/patients/components/ClinicalContextBar.tsx:141-186`, `src/core/components/navigation/AppTopBar.tsx:54-84`). This is a small visual compromise in a normal app but a patient-mix-up risk in a clinical workbench.
- **Make printed sheets truly monochrome-safe and page-safe.** The global print layer is thoughtful—A4 margins, animation removal, row avoidance, and orphan/widow controls are present (`index.css:623-667`)—but the main testing table opts into `print:break-inside-auto`, and print markup still uses raw slate/red/blue utilities (`src/features/testing/components/TestingPlanPrintView.tsx:374-390`, `src/features/testing/components/TestingPlanPrintView.tsx:230-296`, `src/features/reports/components/ClinicalReport.tsx:249-286`). A print test checks classes, not a rendered multi-page sheet.
- **Keep the lock screen quiet and honest.** The screen-lock is correctly treated as a privacy screen rather than enterprise access control in the product copy (`PRODUCT.md:21-31`, `src/features/info-pages/components/TechnicalDocumentationPage.tsx:92-95`), but the current implementation contains a source-visible PIN and a full-screen animated blur/grid treatment (`src/core/components/PasswordGate.tsx:9-39`, `src/core/components/PasswordGate.tsx:89-118`, `index.css:465-518`). The first screen a nurse sees should be calm, fast, high-contrast, and explicit about what protection it provides.

The good news is that the fixes are bounded. Focus-visible styles, skip navigation, dialog handling, patient-switch confirmation, draft protection, font scaling, lazy screen loading, and basic print safety are already in place (`index.css:40-49`, `src/core/components/ScreenLayout.tsx:125-131`, `src/core/components/ScreenLayout.tsx:241-260`, `src/core/components/navigation/AppNavigationDrawer.tsx:39-118`, `src/core/components/FontSizeProvider.tsx:18-71`, `App.tsx:31-48`).

## 2. Per-surface UX scorecard

The score uses the Impeccable critique scale: each Nielsen heuristic is scored from **0** (not addressed) to **4** (strong). The total is out of 40. “Operate” means a clinician is completing work; “Read” means the person is consulting information rather than entering a clinical record.

Abbreviations: **V** visibility of system status; **R** match to the real world; **C** user control and freedom; **S** consistency and standards; **E** error prevention; **N** recognition rather than recall; **F** flexibility and efficiency; **A** aesthetic/minimalist design; **Rv** error recovery; **H** help/documentation.

| Surface | Mode | V | R | C | S | E | N | F | A | Rv | H | Total | Readout |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Dashboard | Operate | 3 | 4 | 3 | 3 | 3 | 4 | 3 | 3 | 3 | 2 | **31/40** | Clear worklist, filters, status badges, table/card responsive switch, and useful analytics. Dense filter controls and status contrast keep it from being excellent (`src/features/dashboard/components/PatientTable.tsx:153-185`, `src/features/dashboard/components/PatientTable.tsx:373-445`, `src/features/dashboard/components/AdvancedSearchFilters.tsx:105-185`, `e2e/screenshots/after/dashboard-desktop.png`). |
| Patients | Operate | 3 | 4 | 3 | 3 | 3 | 4 | 3 | 3 | 3 | 2 | **31/40** | Strong patient history, identity redaction, and timeline language. The context strip can scroll horizontally, and the history surface is large enough to deserve decomposition (`src/features/patients/components/ClinicalContextBar.tsx:141-186`, `src/features/patients/components/PatientHistory.tsx:196-520`). |
| Testing | Operate | 3 | 4 | 3 | 3 | 3 | 3 | 3 | 2 | 3 | 2 | **29/40** | The indexed workflow, draft indicator, validation summary, and previous/next controls are good clinical scaffolding. The active section still contains many small controls and dense protocol configuration, especially on mobile (`src/features/testing/components/TestingLogForm.tsx:145-176`, `src/features/testing/components/TestingLogForm.tsx:258-287`, `src/features/testing/components/DrugTestPanelSection.tsx:73-181`, `src/features/testing/components/DrugTestGrid.tsx:206-259`). |
| Reports | Operate | 3 | 4 | 3 | 3 | 3 | 3 | 3 | 3 | 4 | 2 | **31/40** | Report tabs, redaction, confirmation dialogs, print as primary action, and “start new log” protection create a sensible output flow (`src/core/screens/SummaryScreen.tsx:154-208`, `src/core/screens/SummaryScreen.tsx:211-290`). Raw print colours and the shared contrast problem weaken the clinical document experience. |
| Research | Operate | 3 | 4 | 3 | 3 | 3 | 4 | 3 | 3 | 3 | 2 | **31/40** | De-identified session language, explicit delete confirmation, expandable records, and empty/error states are appropriate. The surface is over-large in one file and its test-panel table headers omit `scope` (`src/features/research/components/ResearchDashboard.tsx:45-90`, `src/features/research/components/ResearchDashboard.tsx:481-539`). |
| Info pages | Read | 3 | 4 | 4 | 3 | 3 | 3 | 2 | 3 | 3 | 3 | **31/40** | Readable, consistent rectangular cards with useful FAQ, drug-reference, privacy, governance, and technical content. These pages are intentionally less efficient than the workbench because they are reference material; the repeated page scaffolding is a maintenance concern (`src/features/info-pages/components/AboutPage.tsx:1-107`, `src/features/info-pages/components/FAQPage.tsx:146-191`, `src/features/info-pages/components/DrugReferencePage.tsx:65-131`). |
| App shell | Operate | 3 | 4 | 3 | 3 | 3 | 3 | 3 | 2 | 3 | 2 | **29/40** | Sidebar/topbar variants, skip link, focus treatment, drawer focus trap, theme toggle, and 85–125% font scaling make a sound shell (`src/core/components/ScreenLayout.tsx:117-262`, `src/core/components/navigation/AppNavigationSections.tsx:68-155`, `src/core/components/FontSizeProvider.tsx:18-71`). The lock station is visually over-authored for a clinical tool, and sidebar links are 38px high (`src/core/components/navigation/AppNavigationSections.tsx:75-87`, `src/core/components/PasswordGate.tsx:89-122`). |

### Cognitive load

The workbench has **moderate cognitive load** rather than high load. The testing workflow reduces recall by showing section names and completion state (`src/features/testing/components/TestingWorkflowIndex.tsx:49-160`, `src/features/testing/components/TestingWorkflowIndex.tsx:251-300`), and the context bar repeats the active identity. The remaining load comes from the number of simultaneous drug-selection, protocol, result, and notes controls (`src/features/testing/components/DrugTestPanelSection.tsx:92-181`, `src/features/testing/components/DrugTestGrid.tsx:84-259`), plus output actions that sit in one visual family even though printing, copying, emailing, and research submission have different risk profiles (`src/core/screens/SummaryScreen.tsx:211-267`).

## 3. Technical audit

### Audit score

| Dimension | Score | Assessment |
|---|---:|---|
| Accessibility | **2/4** | Good focus, keyboard, dialog, skip-link, listbox, tab, and error foundations, but current status combinations and several mobile controls do not reliably meet the stated AA/touch bar (`index.css:40-49`, `components/ui/badge.tsx:18-26`, `src/features/testing/components/DrugTestGrid.tsx:253-259`). |
| Performance | **3/4** | Lazy screen chunks, post-paint telemetry, memoised rows, and reduced-motion support are sensible. Full-screen blurred animated lock fields, a remote font dependency, and several 500+ line components create avoidable cost (`App.tsx:31-48`, `src/core/routes/infoPageConfig.tsx:19-89`, `index.css:479-518`, `index.html:14-17`). No runtime timing was collected because the application was not allowed to launch. |
| Theming | **2/4** | The token model is broad and intentionally defines light/dark values, but 262 raw colour utility matches remain in production source and several token pairs fail AA in actual usage (`index.css:50-91`, `index.css:218-273`). |
| Responsive design | **3/4** | The committed mobile and desktop goldens show a coherent layout, mobile cards, and usable action hierarchy. Horizontal identity scrolling, title truncation, and undersized form controls remain at narrower widths and larger font settings (`e2e/screenshots/after/summary-mobile.png`, `src/features/patients/components/ClinicalContextBar.tsx:141-145`, `src/core/components/navigation/AppTopBar.tsx:60-72`). |
| Implementation integrity | **2/4** | Print controls, semantic shared components, and state guards are present, but print rules contradict each other, large components contain mixed responsibilities, and two likely-unused compatibility/animation utilities remain (`index.css:656-666`, `src/features/testing/components/TestingPlanPrintView.tsx:374`, `src/features/patients/components/PatientIdentityBar.tsx:1-39`, `src/shared/utils/animations.ts:1-36`). |
| **Total** | **12/20** | **Conditional: solid foundation, not ready for final AA/print sign-off without the P1 fixes below.** |

### Accessibility: WCAG 2.1 AA and clinical operability

#### What is already strong

- A global `:focus-visible` outline is present and is supplemented by component-level rings (`index.css:40-49`).
- The shell exposes a skip link and a focusable main landmark (`src/core/components/ScreenLayout.tsx:125-131`, `src/core/components/ScreenLayout.tsx:241-247`).
- The navigation drawer handles Escape, focus restore, focus trapping, `role="dialog"`, and `aria-modal` (`src/core/components/navigation/AppNavigationDrawer.tsx:39-118`, `src/core/components/navigation/AppNavigationDrawer.tsx:120-182`).
- Report tabs use `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, and a matching `tabpanel` (`src/core/screens/SummaryScreen.tsx:154-184`).
- Patient cards have a keyboard path even though they are implemented as `div role="button"` (`src/features/dashboard/components/PatientTable.tsx:146-151`, `src/features/dashboard/components/PatientTable.tsx:387-395`). A real button would still be clearer and less fragile.
- The PIN group has labels, instructions, invalid state, assertive error feedback, paste support, and focus movement (`src/core/components/PasswordGate.tsx:164-212`).
- The font-size provider clamps the setting to 85–125% in 5% steps and persists it (`src/core/components/FontSizeProvider.tsx:18-71`).

#### Verified gaps

1. **Status contrast is not consistently AA.** The current light tokens calculate to approximately 3.29:1 for success, 3.02:1 for warning, and 3.76:1 for danger against white. The dark tokens calculate to approximately 4.02:1 for danger against the dark background, 3.58:1 against the dark card, and 4.47:1 for info against the dark card. These are below the 4.5:1 normal-text target in the combinations used by badges and labels (`index.css:74-91`, `index.css:255-273`, `components/ui/badge.tsx:18-26`, `src/features/reports/components/PatientHandout.tsx:87-95`, `src/features/research/components/ResearchDashboard.tsx:65-83`).
2. **Grade badges keep a fixed white or bright foreground in both themes.** The grade 1, 3, and 4 variants use `text-white`; grade 2 uses `text-foreground`. In the dark theme, the calculated white-text ratios are about 2.16:1, 2.73:1, and 4.26:1 respectively, while grade 2’s bright foreground on the bright amber background is about 1.61:1 (`components/ui/badge.tsx:22-25`, `index.css:255-259`).
3. **Small touch targets are systemic below the button primitive.** The Button base provides `min-h-[44px]` only below `xl`, but Input and Select default to `h-9`, Switch is `h-5 w-9`, and testing overrides use `h-7`/`h-8` (`components/ui/button.tsx:7-27`, `components/ui/input.tsx:5-16`, `components/ui/select.tsx:19-25`, `components/ui/switch.tsx:12-23`, `src/features/testing/components/DrugTestGrid.tsx:142-181`, `src/features/dashboard/components/AdvancedSearchFilters.tsx:105-111`).
4. **Some icon-only or state controls lack an accessible name or state.** The dashboard agent-search clear button has no `aria-label` (`src/features/dashboard/components/AdvancedSearchFilters.tsx:303-309`); the testing drug-filter clear button has no label (`src/features/testing/components/DrugTestPanelSection.tsx:82-88`); the notes input has a placeholder but no `aria-label`, `id`, or visible label tied to the drug row (`src/features/testing/components/DrugTestGrid.tsx:253-259`); and the outcome filter buttons do not expose `aria-pressed` or a radio-group state (`src/features/dashboard/components/AdvancedSearchFilters.tsx:172-183`).
5. **One research table omits header scope.** The expandable research detail table uses `<th>` cells without `scope="col"`, unlike the stronger clinical tables elsewhere (`src/features/research/components/ResearchDashboard.tsx:61-70`, compare `src/features/dashboard/components/PatientTable.tsx:272-281`).
6. **Desktop sidebar links are 38px high.** This is acceptable for a mouse-only desktop rail but does not meet the design system’s stated 44px control target if the surface is used with touch input at a large viewport (`src/core/components/navigation/AppNavigationSections.tsx:75-87`, `DESIGN.md:316-322`).

### Responsive behaviour

The committed goldens support a positive baseline:

- Dashboard cards, worklist rows, and analytics remain readable on mobile (`e2e/screenshots/after/dashboard-mobile.png`).
- The home flow puts patient selection and the two testing paths near the top of the narrow screen (`e2e/screenshots/after/log-mobile.png`, `home-375-dark.png`).
- Reports use horizontally scrollable, 44px report tabs and stack output actions (`src/core/screens/SummaryScreen.tsx:154-238`, `e2e/screenshots/after/summary-mobile.png`).
- The visual Chrome snapshots cover desktop sidebar, desktop topbar, and mobile topbar variants (`e2e/visual-chrome.spec.ts-snapshots/desktop-sidebar-dashboard-chromium-darwin.png`, `e2e/visual-chrome.spec.ts-snapshots/desktop-topbar-dashboard-chromium-darwin.png`, `e2e/visual-chrome.spec.ts-snapshots/mobile-topbar-dashboard-chromium-darwin.png`).

The remaining responsive risks are concrete:

- The full identity strip is `overflow-x-auto` with a `min-w-max` child, so a long surname, long identifier, or 125% font setting can hide important identity fields off-screen (`src/features/patients/components/ClinicalContextBar.tsx:141-145`).
- The phone topbar intentionally truncates the page title while keeping draft/report badges and controls in the same row (`src/core/components/navigation/AppTopBar.tsx:54-84`).
- The testing form contains explicit 28px/32px fields and auxiliary buttons even though the main navigation is touch-sized (`src/features/testing/components/DrugTestGrid.tsx:142-181`, `src/features/testing/components/TestingPlanGenerator.tsx:738-764`).
- A 375px dark home screenshot is generally legible and not visibly clipped (`home-375-dark.png`), but it does not exercise the dense testing grid or the longest patient identity values.

### Performance and motion

Positive implementation choices include post-paint Sentry/web-vitals setup (`App.tsx:31-48`), lazy-loaded info and feature screens (`src/core/routes/infoPageConfig.tsx:19-89`, `src/core/screens/DashboardScreen.tsx:8-10`, `src/core/screens/SummaryScreen.tsx:29-31`), and memoised drug rows (`src/features/testing/components/DrugTestGrid.tsx:71-73`).

The main risks are:

- The lock station uses large blurred radial fields with `will-change` and infinite animations (`index.css:479-518`, `index.css:531-583`). This is expensive decoration on the first screen and is contrary to the “no decorative gradients/neon” rule (`DESIGN.md:324-327`).
- Reduced motion disables the ambient fields and common screen animations but still runs a 0.6s alert pulse and a 0.28s convergence animation (`index.css:669-703`). Those are understandable state feedback, but the alert pulse has a 140px/50px shadow (`index.css:585-608`) and should be replaced with a non-motion error state for the most conservative clinical setting.
- Public Sans is fetched from Google Fonts at runtime (`index.html:14-17`). That is not patient-data exfiltration, but it introduces an offline dependency and can cause a font swap in a procedure room. Self-hosting or a deliberate local fallback would make the offline claim more reliable.
- Seven component files exceed 400 lines, which raises the likelihood of unnecessary re-rendering and makes focused accessibility fixes harder to reason about (see the component inventory in section 4). This is an engineering risk, not a measured runtime failure.

No Lighthouse, browser performance trace, or live interaction timing was run because the brief explicitly prohibited launching the app. These are static risk findings, not measured Core Web Vitals defects.

### Theming and contrast

The token architecture is a real strength: light and dark core surfaces, status colours, drug-category namespaces, path tokens, and masthead tokens are defined centrally (`index.css:50-216`, `index.css:218-394`, `tailwind.config.js:21-222`). The current home dark golden also shows that the main dark surface is readable and visually coherent (`home-375-dark.png`).

The conformance problem is that raw colour utilities remain in production markup and the “hardcoded colour safety net” only overrides a few slate text/border classes in dark mode (`index.css:747-763`). A safety net is useful during migration but is not the same as every component consuming the correct semantic token. The most concentrated offenders are print documents (`src/features/testing/components/TestingPlanPrintView.tsx:230-296`, `src/features/reports/components/ClinicalReport.tsx:249-286`, `src/features/reports/components/PatientHandout.tsx:45-115`, `src/features/reports/components/PowerchartLetter.tsx:65-216`).

### Print integrity

#### What is already good

- A4 page size, explicit margins, 11px print base size, orphan/widow controls, no-print utilities, and global animation/transition removal are defined (`index.css:623-649`).
- Global table/row and clinical-section avoidance rules exist (`index.css:650-666`).
- The report and testing tests check that important pharmacy warnings and status badges become black-and-white print output (`src/features/testing/components/TestingPlanPrintView.test.tsx:90-109`, `src/features/testing/components/TestingPlanPrintView.test.tsx:150-154`, `src/features/reports/components/ReportsPrintSafety.test.tsx:23-73`).
- Patient handout entries use `avoid-entry` for the “avoid” and “safe” rows (`src/features/reports/components/PatientHandout.tsx:68-76`, `src/features/reports/components/PatientHandout.tsx:89-96`). Powerchart signature blocks also use break avoidance (`src/features/reports/components/PowerchartLetter.tsx:223-236`).

#### What still needs attention

- The main testing protocol table explicitly uses `print:break-inside-auto`, which conflicts with the stated requirement that clinical rows do not break across pages (`src/features/testing/components/TestingPlanPrintView.tsx:374-390`, `index.css:656-666`). The global `tr` rule is a useful backstop, but this deserves a rendered multi-page assertion rather than relying on browser interpretation.
- Testing plan print markup still uses `print:text-slate-600`, `print:text-slate-700`, `print:text-slate-400`, `print:text-red-700`, and `print:border-red-700` (`src/features/testing/components/TestingPlanPrintView.tsx:230-296`). These colours may print acceptably on a colour printer but they do not meet the explicit black-and-white legibility/conformance bar as consistently as the black/white alert overrides.
- Reports retain print slate/blue utilities instead of a single print token policy (`src/features/reports/components/ClinicalReport.tsx:249-286`, `src/features/reports/components/PatientHandout.tsx:45-115`, `src/features/reports/components/PowerchartLetter.tsx:65-216`).
- Existing tests inspect class names and content, but no committed test renders a long table/signature combination through actual paginated print output. This is a coverage gap, not evidence that every printed page currently breaks.

## 4. Design-system conformance

### Semantic tokens versus hardcoded colours

The counts below are lexical class matches in production source (`src`, `components`, `App.tsx`, `index.tsx`, `index.css`, and `tailwind.config.js`), excluding test files. They are counts of occurrences, not unique colours or rendered DOM nodes.

| Usage | Count | Interpretation |
|---|---:|---|
| Semantic colour utilities | **2,809** | Broad adoption of `bg-card`, `text-foreground`, `border-border`, `text-status-*`, `bg-category-*`, `text-masthead-*`, and related names. |
| Raw colour utilities | **262** | About 8.5% of the combined semantic/raw utility matches. Some are intentionally black/white for print or white text in masthead chrome, but they still need an explicit exception or token. |
| Detector findings | **76** | All are `design-system-font-size`, advisory, and point to print-specific sizes; see appendix. |

Worst production offenders by raw colour utility matches:

- `src/features/testing/components/TestingPlanPrintView.tsx` — **105** matches, mostly print black/white/slate/red utilities.
- `src/features/reports/components/ClinicalReport.tsx` — **32** matches, including print colours and blue nursing sections.
- `src/features/reports/components/PatientHandout.tsx` — **30** matches, including `bg-blue-50`, `bg-blue-900/20`, and print slate classes.
- `src/features/reports/components/PowerchartLetter.tsx` — **23** matches, including print slate borders and raw red text.
- `src/core/components/navigation/AppNavigationSections.tsx` — **16** matches, mostly `text-white`/`bg-white/*` in navy chrome. These are visually intentional but should be represented by `masthead-foreground`/masthead surface tokens under the hard rule.

The token migration is therefore substantially complete in ordinary workbench surfaces, but print and chrome code still create a visible exception cluster rather than one predictable system.

### Radius violations

The design system requires zero radius everywhere (`DESIGN.md:261-267`, `DESIGN.md:314-329`). Static production source contains:

- **9 non-`rounded-none` utility occurrences:** `PatientTable.tsx` 5, `PatientHistory.tsx` 1, `Changelog.tsx` 1, `AdvancedSearchFilters.tsx` 1, and `components/ui/scroll-area.tsx` 1.
- **2 non-zero CSS declarations:** the lock-screen ambient fields use `border-radius: 50%` (`index.css:488`, `index.css:504`).

The seven `rounded-full` instances are small timeline/status dots, and the scroll viewport uses `rounded-[inherit]` (`components/ui/scroll-area.tsx:15`); they are visually understandable exceptions, but they still violate the stated literal rule. The two 50% lock fields are decorative and should be removed with the lock-screen ambient treatment.

### Duplicated or near-duplicate components

- `PatientIdentityBar` is a 39-line compatibility wrapper around `ClinicalContextBar` (`src/features/patients/components/PatientIdentityBar.tsx:1-39`). Repository-wide production search found no consumer; only its own test imports it. Keep it only if an external API needs the name, otherwise remove the wrapper and its test in a separately approved cleanup.
- `ClinicalContextBar` is the active shared implementation and is used by the log, testing, print-plan, and report screens (`src/core/screens/LogScreen.tsx:31`, `src/core/screens/TestingScreens.tsx:8`, `src/core/screens/SummaryScreen.tsx:24`). This is a successful consolidation, not a redesign item.
- `src/shared/utils/animations.ts:1-36` is exported by `src/shared/utils/index.ts:9` but has no production consumers in the repository. It appears to be a leftover abstraction beside the active CSS animation utilities. Treat it as a dead-code candidate, not a runtime defect.
- Shared `StatTile`, `EmptyState`, `TableEmptyRow`, `LoadingState`, and `ErrorState` are used in multiple production surfaces (`src/shared/components/index.ts:1-2`, `src/features/dashboard/components/AnalyticsPanel.tsx:4`, `src/features/research/components/ResearchDashboard.tsx:20`, `src/core/components/ScreenLayout.tsx:16`). No new duplicate metric/state component should be introduced.

### Oversized component files

Every TSX component file over 400 lines is a refactor candidate. This is not a request to change behaviour; it is a warning that review, accessibility fixes, and future clinical changes will be safer when responsibilities are separated.

| File | Lines | Main reason to split |
|---|---:|---|
| `src/features/testing/components/TestingPlanGenerator.tsx` | **882** | State, drug selection, custom protocols, validation, and full rendering are mixed together (`TestingPlanGenerator.tsx:45-181`, `TestingPlanGenerator.tsx:368-865`). |
| `src/core/screens/LogScreen.tsx` | **639** | Home flow, patient selection, history, plan generation, manual entry, and dialogs live together (`LogScreen.tsx:152-633`). |
| `src/features/patients/components/PatientHistory.tsx` | **559** | Identity, risk context, details, timeline, medications, tryptase, and referral information share one component (`PatientHistory.tsx:113-552`). |
| `src/features/research/components/ResearchDashboard.tsx` | **549** | Loading/error state, statistics, charts, expandable records, and deletion detail share one file (`ResearchDashboard.tsx:240-549`). |
| `src/features/testing/components/TestingPlanPrintView.tsx` | **529** | Screen controls, print identity, medication chart, protocol tables, warnings, and signature areas share one render tree (`TestingPlanPrintView.tsx:174-521`). |
| `src/features/dashboard/components/PatientTable.tsx` | **498** | Filtering, pagination, desktop table, mobile cards, status, and timeline rendering share one component (`PatientTable.tsx:153-498`). |
| `src/features/testing/components/TestingWorkflowIndex.tsx` | **434** | Workflow metadata/state and desktop/mobile navigators share one component (`TestingWorkflowIndex.tsx:49-434`). |

## 5. Recommendations

Each item states **what**, **evidence**, **impact on clinical users**, **effort**, and **priority**. Priority follows the critique convention: P0 blocks the core workflow; P1 is a major safety/usability issue; P2 is a meaningful improvement; P3 is polish.

### REDESIGN — rethink the flow or surface

#### R1. Make testing a two-speed bedside cockpit

- **What:** Keep the current indexed workflow, but redesign the active testing section around two speeds: a large, always-visible “record now” lane for wheal/flare measurements, challenge observations, and save; and a secondary disclosure lane for protocol selection, custom concentrations, documents, and optional notes. Preserve the seven-step model, but do not make a nurse repeatedly cross a dense control wall to record the next measurement.
- **Evidence:** `src/features/testing/components/TestingLogForm.tsx:145-176`; `src/features/testing/components/TestingWorkflowIndex.tsx:329-407`; `src/features/testing/components/DrugTestPanelSection.tsx:73-181`; `src/features/testing/components/DrugTestGrid.tsx:206-259`.
- **Impact on clinical users:** Fewer visual searches and fewer missed fields while the nurse is moving between patient, tray, and workstation; safer use on a 375px phone or shared terminal.
- **Effort:** L
- **Priority:** P1

#### R2. Turn patient context into a persistent identity rail

- **What:** Replace the desktop/tablet horizontal sentence with a responsive identity rail that always keeps family name, given name, REDCap ID, and DOB together. Let secondary dates and source move into a details disclosure, but never scroll the primary identity off-screen. On mobile, allocate a dedicated row rather than asking the page title, draft/report badges, and controls to compete in one line.
- **Evidence:** `src/features/patients/components/ClinicalContextBar.tsx:60-83`, `src/features/patients/components/ClinicalContextBar.tsx:141-186`, `src/core/components/navigation/AppTopBar.tsx:54-84`, `e2e/screenshots/after/summary-mobile.png`.
- **Impact on clinical users:** Reduces the chance of carrying out a test or report action against the wrong patient when names or IDs are long and the screen is narrow.
- **Effort:** L
- **Priority:** P1

#### R3. Make outbound report actions visibly different by risk

- **What:** Treat local print as the dominant clinical output, keep local copy as a utility action, and visually separate email and research submission into an “external destination” zone with a clear data-boundary explanation. Keep the existing confirmation dialog, but make the action hierarchy do more work before the dialog opens.
- **Evidence:** `src/core/screens/SummaryScreen.tsx:211-267`; `src/features/reports/components/OutboundActionDialog.tsx:135-218`; `PRODUCT.md:25-31`.
- **Impact on clinical users:** Makes the safe local action obvious and lowers the risk of sending a document or research payload through the wrong channel during a busy clinic.
- **Effort:** M
- **Priority:** P1

#### R4. Reframe the PIN gate as a quiet clinical privacy station

- **What:** Keep the rectangular lock-station structure and the explicit privacy-screen wording, but remove the ambient blur, grid drift, glow pulse, and convergence spectacle. Use a flat masthead, one clear lock state, a high-contrast PIN module, and a restrained error state.
- **Evidence:** `src/core/components/PasswordGate.tsx:82-122`, `index.css:465-518`, `index.css:585-608`, `DESIGN.md:314-329`.
- **Impact on clinical users:** Faster visual orientation, less distraction in a procedure room, better low-power/offline performance, and closer alignment between the product’s clinical promise and its first impression.
- **Effort:** M
- **Priority:** P2

### UPDATE — targeted fixes and polish

#### U1. Repair the status contrast matrix in both themes

- **What:** Recalculate status and grade foreground/background pairs against the 4.5:1 target; change the light status text colours, add dark-theme foreground variants for grade badges, and test text-on-tint combinations rather than only solid badge combinations. Prefer semantic foreground tokens over `text-white`.
- **Evidence:** `index.css:74-91`, `index.css:255-273`, `components/ui/badge.tsx:18-26`, `src/features/reports/components/PatientHandout.tsx:87-95`.
- **Impact on clinical users:** Makes positive, safe, warning, and severity states readable in bright wards, dark terminals, and low-quality print previews.
- **Effort:** M
- **Priority:** P1

#### U2. Bring bedside fields and micro-actions to the 44px target

- **What:** Make mobile Input, Select, Switch, clear, remove, add, and category controls at least 44px in their hit area. Preserve compact desktop density through a desktop-only reduction if needed; do not use `h-7`/`h-8` as the mobile default.
- **Evidence:** `components/ui/input.tsx:5-16`, `components/ui/select.tsx:19-25`, `components/ui/switch.tsx:12-23`, `src/features/testing/components/DrugTestGrid.tsx:127-181`, `src/features/testing/components/TestingPlanGenerator.tsx:738-764`, `src/features/dashboard/components/AdvancedSearchFilters.tsx:105-111`.
- **Impact on clinical users:** Easier data entry with a phone, touch monitor, or gloved hand; fewer accidental taps on remove or clear actions.
- **Effort:** M
- **Priority:** P1

#### U3. Close the small accessible-name and state gaps

- **What:** Add accessible labels to icon-only clear/remove buttons, give each notes field an explicit label tied to its drug row, add `aria-pressed` or radio semantics to outcome filters, and add `scope="col"` to the research table headers.
- **Evidence:** `src/features/dashboard/components/AdvancedSearchFilters.tsx:172-183`, `src/features/dashboard/components/AdvancedSearchFilters.tsx:303-309`, `src/features/testing/components/DrugTestPanelSection.tsx:82-88`, `src/features/testing/components/DrugTestGrid.tsx:253-259`, `src/features/research/components/ResearchDashboard.tsx:61-70`.
- **Impact on clinical users:** Screen-reader users and keyboard users can understand which drug, outcome, or action each control belongs to without relying on proximity or placeholder text.
- **Effort:** S
- **Priority:** P1

#### U4. Make print styling one black-and-white policy

- **What:** Replace raw print slate/red/blue utilities with a small, documented print token policy; remove `print:break-inside-auto` from the main protocol table; add a fixture that renders enough drugs, warnings, signatures, and notes to force multiple pages and asserts row/signature integrity.
- **Evidence:** `index.css:623-667`, `src/features/testing/components/TestingPlanPrintView.tsx:230-296`, `src/features/testing/components/TestingPlanPrintView.tsx:374-390`, `src/features/reports/components/ClinicalReport.tsx:249-286`, `src/features/reports/components/PatientHandout.tsx:45-115`.
- **Impact on clinical users:** Fewer ambiguous photocopies, less risk that a nurse receives a split row or detached signature area, and more predictable A4 filing.
- **Effort:** M
- **Priority:** P1

#### U5. Remove the remote font dependency from the clinical path

- **What:** Self-host Public Sans or define a deliberate local/system fallback that is visually acceptable without a network connection. Keep the existing `font-display`/offline behaviour under test if a font package is added later.
- **Evidence:** `index.html:14-17`; `PRODUCT.md:21-32`.
- **Impact on clinical users:** The interface opens with a stable layout in a procedure room with poor connectivity and avoids a font swap while patient information is already on screen.
- **Effort:** S
- **Priority:** P2

#### U6. Make the privacy-screen credential deployment-controlled

- **What:** Remove the source-visible fixed PIN from application code or clearly supply it through a deployment-controlled mechanism. Keep the product wording that this is shoulder-surfing protection, not enterprise access control, and add an operational note for changing or rotating it.
- **Evidence:** `src/core/components/PasswordGate.tsx:7-39`, `src/features/info-pages/components/TechnicalDocumentationPage.tsx:92-95`, `PRODUCT.md:27-31`.
- **Impact on clinical users:** A shared workstation cannot be unlocked by anyone who can inspect the shipped bundle, while the threat model remains honest.
- **Effort:** M
- **Priority:** P1

### REFACTOR — improve structure without changing behaviour

#### F1. Split the seven oversized components along clinical responsibilities

- **What:** Extract stateful hooks, data adapters, desktop/mobile renderers, and clinical sub-sections from the seven files over 400 lines. Start with `TestingPlanGenerator`, `LogScreen`, and `TestingPlanPrintView`, where state, rendering, and document rules are most interleaved.
- **Evidence:** `TestingPlanGenerator.tsx` 882 lines; `LogScreen.tsx` 639; `PatientHistory.tsx` 559; `ResearchDashboard.tsx` 549; `TestingPlanPrintView.tsx` 529; `PatientTable.tsx` 498; `TestingWorkflowIndex.tsx` 434.
- **Impact on clinical users:** Smaller, safer changes to one workflow at a time; less chance that a print, mobile, or patient-identity fix changes an unrelated clinical path.
- **Effort:** L
- **Priority:** P2

#### F2. Remove or formally retain unused compatibility and animation utilities

- **What:** Decide whether `PatientIdentityBar` is still an external compatibility API. If not, remove it and its test; separately remove or document the unconsumed `animationConfig`/`transitions` export so future contributors do not build on a dead abstraction.
- **Evidence:** `src/features/patients/components/PatientIdentityBar.tsx:1-39`; `src/shared/utils/animations.ts:1-36`; `src/shared/utils/index.ts:9`; repository-wide production search found no consumers of either symbol beyond their export/wrapper definitions.
- **Impact on clinical users:** No direct visual change; reduces maintenance ambiguity and makes the active identity and motion patterns easier to find during a safety fix.
- **Effort:** S
- **Priority:** P2

#### F3. Centralise print document primitives and exceptions

- **What:** Create shared print classes/components for identity headers, monochrome status labels, section cards, table headings, and signature blocks. Keep document content separate from page-break and colour policy.
- **Evidence:** `src/features/reports/components/ReportPrintIdentity.tsx:22-31`; repeated raw print classes in `src/features/reports/components/ClinicalReport.tsx:249-286`, `src/features/reports/components/PatientHandout.tsx:45-115`, `src/features/reports/components/PowerchartLetter.tsx:65-216`, and `src/features/testing/components/TestingPlanPrintView.tsx:230-296`.
- **Impact on clinical users:** A single correction improves every letter, handout, and nurse sheet instead of relying on four parallel implementations.
- **Effort:** M
- **Priority:** P2

#### F4. Extract shared filter and compact-action patterns

- **What:** Create one accessible compact filter trigger, one labelled clear action, and one 44px mobile icon action for dashboard, drug selection, and protocol editing. Keep the visible language specific to each clinical domain.
- **Evidence:** Repeated small controls in `src/features/dashboard/components/AdvancedSearchFilters.tsx:105-183`, `src/features/dashboard/components/AdvancedSearchFilters.tsx:303-346`, `src/features/testing/components/DrugTestPanelSection.tsx:62-88`, `src/features/testing/components/DrugTestGrid.tsx:127-181`, and `src/features/testing/components/TestingPlanGenerator.tsx:500-506`.
- **Impact on clinical users:** Fixes target size, focus, and accessible names once, reducing inconsistent behaviour across the workbench.
- **Effort:** M
- **Priority:** P2

#### F5. Add a token-contract test for theme contrast and print exceptions

- **What:** Extend the existing shared design safety tests with a small matrix that checks status/grade foreground pairs, required semantic classes, zero-radius policy, and the approved print black/white exceptions.
- **Evidence:** Existing design assertions in `src/core/components/SharedPolishSafety.test.tsx:23-84`; token definitions in `index.css:50-91` and `index.css:218-273`; current raw-colour safety-net comments in `index.css:747-763`.
- **Impact on clinical users:** Prevents a future colour or theme change from silently making severity/status information unreadable.
- **Effort:** M
- **Priority:** P2

## 6. Top 10 quick wins

1. Change `Badge` grade foregrounds to theme-aware semantic foreground tokens and test them in light/dark (`components/ui/badge.tsx:18-26`).
2. Deepen or otherwise repair light success/warning/danger text tokens and dark danger/info combinations (`index.css:74-91`, `index.css:255-273`).
3. Add an explicit label and stable `id`/`aria-describedby` for each drug-row notes field (`src/features/testing/components/DrugTestGrid.tsx:253-259`).
4. Add `aria-label` and a 44px hit area to dashboard and testing filter clear buttons (`src/features/dashboard/components/AdvancedSearchFilters.tsx:303-309`, `src/features/testing/components/DrugTestPanelSection.tsx:82-88`).
5. Add `aria-pressed` or radio semantics to dashboard outcome filters (`src/features/dashboard/components/AdvancedSearchFilters.tsx:172-183`).
6. Add `scope="col"` to research detail table headers (`src/features/research/components/ResearchDashboard.tsx:61-70`).
7. Replace the identity strip’s `min-w-max` horizontal sentence with a wrapping/stacking layout (`src/features/patients/components/ClinicalContextBar.tsx:141-145`).
8. Remove `print:break-inside-auto` from the clinical protocol table and add a long-fixture pagination test (`src/features/testing/components/TestingPlanPrintView.tsx:374-390`).
9. Replace the highest-volume raw print colour classes with the approved monochrome print tokens (`src/features/testing/components/TestingPlanPrintView.tsx:230-296`).
10. Remove the lock station’s animated blur/grid layers and keep only a static, high-contrast lock state (`src/core/components/PasswordGate.tsx:89-118`, `index.css:479-518`).

## 7. Appendix

### A. Detector findings summary

The supplied detector file `/tmp/dream-impeccable-detect.json` contains **76 findings**. All 76 are advisory findings of one type:

| Antipattern | Count | Severity | Interpretation |
|---|---:|---|---|
| `design-system-font-size` | **76** | advisory | Literal `text-[8px]`, `text-[9px]`, or `text-[10px]`-style classes fall outside the detector’s general ramp. |

File distribution:

- `src/features/testing/components/TestingPlanPrintView.tsx` — 44
- `src/features/reports/components/PowerchartLetter.tsx` — 11
- `src/features/reports/components/PatientHandout.tsx` — 8
- `src/features/testing/components/ProtocolDoseTable.tsx` — 7
- `src/features/reports/components/ClinicalReport.tsx` — 4
- `src/features/reports/components/ReportPrintIdentity.tsx` — 2

Representative findings were verified against source before inclusion: `ClinicalReport.tsx:119-122`, `ClinicalReport.tsx:188-193`, `ProtocolDoseTable.tsx:22-29`, and `TestingPlanPrintView.tsx:230-249` contain the reported small-size classes. They are mostly print-specific. DESIGN.md explicitly allows print-specific sub-12px sizing (`DESIGN.md:184-190`), so these detector results are useful migration signals but are not independently P1 defects.

### B. Coverage and things checked that were fine

- **Product truth:** `PRODUCT.md:9-32` and `PRODUCT.md:46-57` were used as the clinical, local-first, shared-terminal, A4, and WCAG target.
- **Design conformance bar:** `DESIGN.md:106-182`, `DESIGN.md:261-329` were used for the clinical workbench, zero-radius, semantic-token, focus, contrast, motion, and print judgements.
- **Recent redesign boundary:** `REDESIGN_SUMMARY.md` was read as historical context. The report does not re-recommend the completed workbench/sidebar/topbar/clinical-context consolidation; it calls out only current code or evidence that remains non-conforming.
- **Dashboard:** desktop and mobile after/baseline goldens were inspected; the main table-to-card transition and analytics hierarchy are coherent (`e2e/screenshots/after/dashboard-desktop.png`, `e2e/screenshots/after/dashboard-mobile.png`, corresponding `baseline/` files).
- **Home/log:** desktop, mobile, and dark 375px goldens were inspected; the two entry paths and patient-start flow are visually clear (`e2e/screenshots/after/log-desktop.png`, `e2e/screenshots/after/log-mobile.png`, `home-375-dark.png`).
- **Reports:** desktop and mobile goldens were inspected; report tabs, context bar, output actions, and research confirmation are present and understandable (`e2e/screenshots/after/summary-desktop.png`, `e2e/screenshots/after/summary-mobile.png`).
- **Chrome variants:** sidebar and topbar desktop/mobile snapshots were inspected (`e2e/visual-chrome.spec.ts-snapshots/*.png`).
- **Testing workflow:** the mobile/desktop workflow navigation, draft state, validation summary, and previous/next controls are structurally present (`src/features/testing/components/TestingWorkflowIndex.tsx:251-434`, `src/features/testing/components/TestingLogForm.tsx:258-287`).
- **Safety guards:** patient-switch confirmation, dirty-testing navigation guard, report outbound confirmation, redaction, and local TTL purge paths are present (`App.tsx:289-300`, `src/core/components/ScreenLayout.tsx:298-308`, `src/features/reports/components/OutboundActionDialog.tsx:135-218`, `index.tsx:9-12`).
- **Print basics:** A4, no-print, no-animation, row-avoidance, signature/entry avoidance, and print-specific tests were checked (`index.css:623-667`, `src/features/reports/components/ReportsPrintSafety.test.tsx:23-73`, `src/features/testing/components/TestingPlanPrintView.test.tsx:90-109`).
- **Known screenshot gotcha:** `e2e/screenshots/baseline/testing-desktop.png`, `e2e/screenshots/after/testing-desktop.png`, and their mobile counterparts show faded/ghost rows consistent with an entrance-animation capture race. The code contains the corresponding entrance animation (`index.css:443-456`, `tailwind.config.js:261-287`), so those ghost rows were treated as capture artifacts rather than reported as clinical UI defects. No clipped drawer was reported without corroborating source evidence.

### C. Audit limitations

- The app was not launched, no live browser or accessibility tree was inspected, and no network request was made, as required by the brief.
- No real print-to-PDF rendering was performed; the print findings distinguish source-confirmed rules from unverified pagination outcomes.
- Performance scores are static risk assessments, not runtime measurements.
- The Impeccable critique snapshot was not persisted because the brief allowed exactly one new/modified file; this report is the sole deliverable.
