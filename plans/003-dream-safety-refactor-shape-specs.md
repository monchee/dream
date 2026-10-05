# Plan 003: DREAM safety pass, behavior-preserving refactor, and redesign shape specifications

**Proposed file:** `plans/003-dream-safety-refactor-shape-specs.md`

**Executor:** ZCode — `glm-5.3-flash`, maximum reasoning.

**Plan choice:** Use one numbered plan with three sequential milestones because W1 must complete before W2, W2 must complete before W3, and one status row prevents partial execution being mistaken for completion.

## Executor contract

Read this entire plan before starting. Then read:

- `docs/audits/2026-10-05-design-ux-audit.md`
- `PRODUCT.md`
- `DESIGN.md`
- `REDESIGN_SUMMARY.md`
- `plans/README.md`

Honor every STOP condition. Do not improvise around a STOP condition. Update the `plans/README.md` row:

1. `TODO` before execution.
2. `IN PROGRESS` before the first implementation step.
3. `DONE` only after all milestones and verification pass.
4. `BLOCKED` with a one-line reason if a STOP condition prevents completion.
5. `REJECTED` only if the plan is explicitly rejected, with a one-line rationale.

Do not commit, push, deploy, install packages, reset files, clean the worktree, or use `git checkout`, `git restore`, or `git reset`.

## Status/index change

Add this row to `plans/README.md`:

| Plan | Title | Priority | Effort | Depends on | Status |
|---|---|---:|---:|---|---|
| 003 | DREAM safety, refactor, and redesign shape specifications | P1 | L | — | TODO |

The existing unrelated worktree changes belong to the user. Preserve them.

## Product and design baseline

- DREAM is a local-first clinical workbench for clinical immunologists, allergists, and allergy nurses working quickly on shared hospital terminals (`PRODUCT.md:9-32`).
- The application targets WCAG 2.1 AA and 85–125% font scaling (`PRODUCT.md:46-57`).
- The four-digit PIN is intentionally a shoulder-surfing privacy screen, not enterprise authentication (`PRODUCT.md:21-31`, `plans/README.md:28-31`).
- Printed output is A4 clinical documentation.
- The visual system requires semantic tokens, zero-radius geometry, visible focus indicators, AA contrast in both themes, no decorative gradients/neon, and print rows/signatures that do not split across pages (`DESIGN.md:106-182`, `DESIGN.md:261-329`).
- The recent workbench/sidebar/topbar/context consolidation is already complete. Do not re-recommend it (`REDESIGN_SUMMARY.md`, `docs/audits/2026-10-05-design-ux-audit.md:349-361`).
- The audit found a conditional pass for continued pilot use, not final AA or print sign-off (`docs/audits/2026-10-05-design-ux-audit.md:14-26`).

## Global implementation rules

Every UI change must:

- Use semantic CSS tokens such as `text-foreground`, `bg-card`, `border-border`, `text-status-*`, `bg-masthead`, and `text-masthead-*`.
- Preserve strict zero-radius styling. Use `rounded-none` or `0px`; do not add `rounded-md`, `rounded-lg`, `rounded-full`, or equivalent.
- Meet WCAG AA contrast in light and dark themes.
- Preserve visible `:focus-visible` indicators.
- Preserve or improve 44px touch targets.
- Avoid decorative gradients, glow, neon, or bouncy motion.
- Preserve local-first behaviour and never send patient identifiers to new external services.
- Preserve the existing clinical wording and severity meaning unless a step explicitly says otherwise.

The 76 Impeccable detector findings are all advisory print font-size findings and are allowed by `DESIGN.md:184-190` (`docs/audits/2026-10-05-design-ux-audit.md:330-347`). Do not replace print-specific 8px, 9px, or 10px typography merely to satisfy the detector.

The hardcoded PIN must remain hardcoded. Do not implement audit item U6. Do not move the PIN to environment variables, a backend, a deployment secret, or a remote validation service.

---

# Milestone 1 — W1 safety and operability pass

## Goal

Repair the high-risk clinical interaction issues first: contrast, touch targets, accessible names and states, print integrity, font availability, and PIN documentation.

Do not begin Milestone 2 until every W1 acceptance criterion passes.

## Ordered steps

### Step 1 — Preflight and drift check

Run:

```sh
git status --short
git diff -- index.css tailwind.config.js components/ui src/core/components/PasswordGate.tsx src/features src/shared public index.html vite.config.ts plans/README.md
```

Record unrelated changes mentally and do not modify them.

Compare the current files with the audit evidence. If any listed target file has unrelated edits that cannot be separated safely, STOP and mark plan `BLOCKED`.

Update only the new plan row in `plans/README.md` from `TODO` to `IN PROGRESS`.

### Step 2 — U1: repair the contrast matrix

Evidence:

- Light status tokens: `index.css:73-91`
- Dark status tokens: `index.css:255-273`
- Tailwind status namespace: `tailwind.config.js:62-87`
- Badge variants: `components/ui/badge.tsx:18-26`
- Existing safety tests: `src/core/components/SharedPolishSafety.test.tsx:20-37`
- Audit ratios and affected uses: `docs/audits/2026-10-05-design-ux-audit.md:73-80`

Change:

1. Add semantic foreground tokens for each grade:

   - `--status-grade1-foreground`
   - `--status-grade2-foreground`
   - `--status-grade3-foreground`
   - `--status-grade4-foreground`

   Define them independently in `:root` and `.dark`.

2. Add the corresponding Tailwind mappings under `status.grade1.foreground` through `status.grade4.foreground` in `tailwind.config.js`.

3. Recalculate these combinations using relative luminance and alpha compositing:

   - Status text on the light background.
   - Status text on the light card.
   - Status text on the dark background.
   - Status text on the dark card.
   - Solid grade badge background with its grade foreground in both themes.
   - Tinted status background with status text in both themes.
   - Solid success, warning, danger, and info controls with their semantic foregrounds.

4. Make every normal-text pair at least 4.5:1. A 3:1 ratio is acceptable only for genuinely large text and must not be used for normal badge or form text.

5. Update `Badge` grade variants to use semantic foreground classes rather than fixed `text-white`:

   - `grade1`
   - `grade2`
   - `grade3`
   - `grade4`

6. Preserve grade meaning. Do not change which grade represents mild, moderate, severe, or critical reaction.

7. Preserve hover and focus contrast.

Do not use raw `text-white`, `text-black`, slate, red, blue, or amber utilities when a semantic token can express the same meaning.

### Step 3 — U2: bring bedside controls to 44px

Evidence:

- Shared Button: `components/ui/button.tsx:7-27`
- Shared Input: `components/ui/input.tsx:5-16`
- Shared Select: `components/ui/select.tsx:15-25`
- Shared Switch: `components/ui/switch.tsx:12-23`
- Testing controls: `src/features/testing/components/DrugTestGrid.tsx:127-181`, `253-259`
- Testing plan controls: `src/features/testing/components/TestingPlanGenerator.tsx:470-506`, `730-764`
- Dashboard filters: `src/features/dashboard/components/AdvancedSearchFilters.tsx:105-183`, `303-309`
- Audit finding: `docs/audits/2026-10-05-design-ux-audit.md:77-80`

Change:

1. Update shared `Input` and `SelectTrigger` to have a minimum 44px height below the desktop-only density breakpoint. Preserve compact desktop density only with an explicit `xl:` reduction.

2. Give `Switch` a 44px interactive hit area while keeping its visual switch track compact. The hit area may be a semantic wrapper around the visual track.

3. Preserve the Button’s existing mobile minimum-height behaviour. Do not remove its focus ring.

4. Remove or replace feature-level `h-7`, `h-8`, `sm:min-h-0`, and similarly undersized defaults in:

   - `DrugTestGrid.tsx`
   - `DrugTestPanelSection.tsx`
   - `TestingPlanGenerator.tsx`
   - `AdvancedSearchFilters.tsx`

5. Give these actions a minimum 44px hit area:

   - Clear filters.
   - Remove drug.
   - Remove dilution step.
   - Add dilution step.
   - Select All / Select None.
   - Drug filter controls.
   - Protocol controls.
   - Notes fields.
   - Category controls.
   - Custom drug add/remove actions.

6. Preserve visual density on large pointer-only desktop layouts only through `xl:` rules. Do not use `sm:` to shrink controls on touch-capable tablets.

7. Verify the result at:

   - 375px width.
   - 390px width.
   - 768px width.
   - 1280px width.
   - 125% font scaling.

Do not reduce the target below 44px to solve an overflow problem. Fix layout wrapping, spacing, or disclosure behaviour instead.

### Step 4 — U3: close accessible-name and state gaps

Evidence:

- Dashboard outcome filters: `src/features/dashboard/components/AdvancedSearchFilters.tsx:172-183`
- Dashboard clear action: `src/features/dashboard/components/AdvancedSearchFilters.tsx:303-309`
- Drug filter clear action: `src/features/testing/components/DrugTestPanelSection.tsx:82-88`
- Drug notes field: `src/features/testing/components/DrugTestGrid.tsx:253-259`
- Research table headings: `src/features/research/components/ResearchDashboard.tsx:61-70`
- Existing focus and shell foundations: `index.css:40-49`, `src/core/components/ScreenLayout.tsx:125-131`

Change:

1. Add an explicit accessible name to every icon-only clear/remove control.

   Examples:

   - `Clear agent search`
   - `Clear drug filter`
   - `Remove {drug name}`
   - `Remove IDT dilution step {number}`

2. Add a visible or screen-reader-only label and stable `id` for every drug-row notes field. The label must identify the drug row, for example `Notes for Rocuronium`.

3. Tie the notes label to the input with `htmlFor`, and use `aria-describedby` only for additional help or validation text.

4. Add `aria-pressed` to mutually exclusive or toggle-style outcome filter buttons, or use an explicit radio-group pattern if the existing behaviour is genuinely single-choice.

5. Preserve the current filter behaviour and selected state.

6. Add `scope="col"` to the research detail table headings.

7. Add or preserve `focus-visible` rings for every changed control.

8. Do not replace working patient-card keyboard behaviour unless a separate change is necessary. The existing path is documented at `src/features/dashboard/components/PatientTable.tsx:146-151`, `387-395`.

### Step 5 — U4: establish one print policy and test pagination

Evidence:

- Global print policy: `index.css:623-667`
- Testing plan raw print classes: `src/features/testing/components/TestingPlanPrintView.tsx:230-296`, `374-390`
- Clinical report print classes: `src/features/reports/components/ClinicalReport.tsx:249-286`
- Patient handout print classes: `src/features/reports/components/PatientHandout.tsx:45-115`
- Powerchart letter print classes: `src/features/reports/components/PowerchartLetter.tsx:65-216`
- Existing print tests: `src/features/testing/components/TestingPlanPrintView.test.tsx:90-109`, `150-154`; `src/features/reports/components/ReportsPrintSafety.test.tsx:23-73`
- Audit gap: `docs/audits/2026-10-05-design-ux-audit.md:117-131`

Change:

1. In the print section of `index.css`, define semantic print tokens:

   - `--print-paper`
   - `--print-ink`
   - `--print-muted-ink`
   - `--print-rule`
   - `--print-alert-ink`

2. Define shared semantic print classes such as:

   - `.print-paper`
   - `.print-ink`
   - `.print-muted-ink`
   - `.print-rule`
   - `.print-keep-together`
   - `.print-signature-block`

   These classes must be print-specific and must not introduce screen styling.

3. Replace raw print slate, blue, red, and gray utilities in the testing plan and report documents with the semantic print policy.

4. Keep print-specific small typography where it is necessary for A4 output. Do not replace it with on-screen sizes.

5. Remove `print:break-inside-auto` from the main testing protocol table at `TestingPlanPrintView.tsx:374`.

6. Set the table itself to flow across pages while preventing individual clinical rows from splitting:

   - Table may use `break-inside: auto`.
   - `tbody tr` must use `break-inside: avoid` and `page-break-inside: avoid`.
   - Table headings must repeat with `display: table-header-group`.
   - Identity blocks, warning blocks, patient-handout entries, and signature blocks must use the shared keep-together rule.

7. Preserve:

   - A4 page size.
   - Existing margins.
   - `orphans` and `widows`.
   - No animation or transition during print.
   - Black-and-white distinction through text, borders, and labels, not colour alone.

8. Create `e2e/print-pagination.spec.ts` using the existing Playwright fixture in `e2e/fixtures.ts`.

   The test must:

   - Use the real testing-plan flow from `e2e/testing-day.spec.ts:15-100`.
   - Select enough drugs and protocol rows to force more than one A4 page.
   - Open the real testing-plan print view.
   - Call `page.emulateMedia({ media: 'print' })`.
   - Assert that the main table has multiple rows.
   - Assert that table rows compute to `break-inside: avoid` / `page-break-inside: avoid`.
   - Assert that the table header is configured as a repeating print header.
   - Assert that signature blocks compute to a keep-together rule.
   - Assert that animations and transitions are disabled in print.
   - Generate a Chromium PDF with A4 sizing and assert that it contains more than one page.

   Do not use a mocked DOM or a synthetic table that bypasses the real print view.

If the fixture cannot reliably create a multi-page plan without changing product behaviour, STOP and report the limitation.

### Step 6 — U5: self-host Public Sans

Evidence:

- Remote Google Font links: `index.html:14-17`
- Body font: `index.css:5-8`
- Tailwind font stack: `tailwind.config.js:14-19`
- Production CSP: `public/_headers:8`
- Development CSP: `vite.config.ts:124-138`
- Audit finding: `docs/audits/2026-10-05-design-ux-audit.md:102-109`

Change:

1. Add licensed local Public Sans WOFF2 assets under:

   - `public/fonts/public-sans-latin-wght-normal.woff2`
   - `public/fonts/public-sans-latin-wght-italic.woff2`

   Rename the files if the approved source uses different names, but keep the paths stable once chosen.

2. Add `@font-face` declarations in `index.css` with:

   - `font-family: 'Public Sans'`
   - `font-weight: 100 900`
   - Correct normal/italic styles.
   - `font-display: swap`.
   - Same-origin `/fonts/...` URLs.

3. Remove Google Fonts preconnect and stylesheet links from `index.html`.

4. Remove unnecessary Google font domains from `public/_headers` and `vite.config.ts` CSP directives.

5. Preserve the Public Sans declaration in `tailwind.config.js`.

6. Add a source or browser test that confirms:

   - No request is made to `fonts.googleapis.com` or `fonts.gstatic.com`.
   - Public Sans resolves from the local origin.
   - The app still renders if the font request is delayed.
   - The fallback remains readable.

If licensed Public Sans files are not available locally or through an approved source, STOP. Do not add an unlicensed font, replace Public Sans silently, or reintroduce the remote dependency.

### Step 7 — Improve PIN documentation only

Evidence:

- PIN constant and validation: `src/core/components/PasswordGate.tsx:7-39`
- Session unlock storage: `src/core/components/PasswordGate.tsx:11-14`, `src/shared/utils/pwaUpdatePolicy.ts:3-12`
- Existing PIN tests: `src/core/components/PasswordGate.test.tsx:144-161`, `241-266`
- Product wording: `PRODUCT.md:21-31`
- Existing decision: `plans/README.md:28-31`

Add an in-code documentation block immediately above `HARDCODED_PIN` in `src/core/components/PasswordGate.tsx:9` that states:

- This is intentionally a client-side privacy screen for reducing casual shoulder-surfing on shared terminals.
- It protects the visible browser session from casual observation.
- It does not provide enterprise authentication, database authorization, encryption, source-code secrecy, bundle secrecy, or network security.
- Unlock state is stored in browser `sessionStorage` for the current session.
- To change the PIN, replace the four digits in this constant and update the matching literals in `PasswordGate.test.tsx:144` and `241`, then run the required verification commands.
- The PIN must never be logged or sent to an external service.

Do not change:

- The PIN value.
- PIN length.
- Validation behaviour.
- Session storage behaviour.
- User-facing lock-screen behaviour.
- `TechnicalDocumentationPage.tsx`.

### Step 8 — Fold in the ten quick wins

Apply them as follows:

| Quick win | Workstream |
|---|---|
| Grade foregrounds use theme-aware semantic tokens | U1 — `components/ui/badge.tsx:18-26` |
| Repair light/dark status ratios | U1 — `index.css:74-91`, `255-273` |
| Label drug-row notes | U3 — `DrugTestGrid.tsx:253-259` |
| Label and enlarge clear buttons | U2/U3 — `AdvancedSearchFilters.tsx:303-309`, `DrugTestPanelSection.tsx:82-88` |
| Expose outcome state | U3 — `AdvancedSearchFilters.tsx:172-183` |
| Add research table scopes | U3 — `ResearchDashboard.tsx:61-70` |
| Replace identity-strip horizontal sentence | W3 R2 specification only; do not implement here |
| Remove table `break-inside-auto` and add pagination test | U4 — `TestingPlanPrintView.tsx:374-390` |
| Replace highest-volume raw print colours | U4 — `TestingPlanPrintView.tsx:230-296` |
| Remove animated lock ambience | W3 R4 specification only; do not implement here |

## Milestone 1 acceptance criteria

W1 is complete only when all of the following are true:

- Status and grade text combinations meet 4.5:1 for normal text in both themes.
- Grade badges no longer rely on fixed white text where a semantic foreground is required.
- All listed bedside controls have 44px hit areas below the desktop-only density breakpoint.
- No 375px layout clips, overflows, or hides essential fields at 125% scaling.
- Every listed icon-only control has an accessible name.
- Outcome controls expose their state.
- Drug notes fields have explicit labels and stable IDs.
- Research table headers have `scope="col"`.
- Print styling uses one documented monochrome policy.
- No testing-plan row or clinical signature can split across pages by CSS contract.
- The pagination test creates a real multi-page A4 PDF.
- Print disables animations and transitions.
- Public Sans loads locally without Google font requests.
- PIN behaviour is unchanged; only the in-code documentation is improved.
- No R1–R4 implementation has been added.

## Milestone 1 STOP conditions

Stop immediately if:

- A contrast pair cannot meet AA without changing the clinical meaning of a grade/status.
- A target-size fix creates clipping or horizontal overflow at 375px or 125%.
- A proposed accessible-name fix changes clinical behaviour or selection state.
- The print test cannot generate a deterministic multi-page real-world fixture.
- A row or signature block splits in the generated PDF.
- The font assets are unavailable or licensing is unclear.
- Any change attempts to remove, rotate, externalize, or otherwise alter the hardcoded PIN.
- Any source file outside the W1 manifest is required for an unrelated reason.

## Milestone 1 verification

Run, in order:

```sh
npx tsc --noEmit
npm run lint
npm run test:unit
npm run test:e2e:ci
```

`npm run test:e2e:ci` already runs a production build and Chromium with `CI=1`, excluding `@visual` tests (`package.json:24`).

For visual evidence after the safety changes, run without updating snapshots:

```sh
npm run build
CI=1 npx playwright test e2e/visual-chrome.spec.ts --project=chromium --grep @visual
```

If a local development server is needed for manual inspection, use:

```sh
npm run dev -- --port 3002
```

Never run bare `npm run dev`; the current Playwright configuration otherwise targets occupied port 3000.

## Milestone 1 risks and rollback

Risks:

- Dark-theme foreground choices may improve contrast while making a status appear visually louder.
- Enlarging controls may increase vertical density in the testing grid.
- Browser print engines may interpret page-break rules differently.
- Local fonts may alter line wrapping in dense print documents.

Rollback:

- Preserve all unrelated worktree changes.
- Revert only the executor’s W1 hunks, without `git restore`, `git checkout`, or reset.
- Do not roll back to raw colour utilities or undersized controls.
- If only the font causes layout drift, revert the font-face change while leaving the verified safety fixes in place and mark U5 `BLOCKED` until the font can be resolved safely.

---

# Milestone 2 — W2 behavior-preserving refactor

## Goal

Reduce maintenance risk without changing visible behaviour, clinical wording, DOM semantics, print output, or interaction flow.

Do not begin Milestone 3 until W2 is complete and visual snapshots show zero unintended change.

W2 changes are structural only. No redesign, new visual treatment, or clinical workflow change is allowed.

## Ordered steps

### Step 1 — Preflight W2 dependency gate

Confirm that Milestone 1 is marked complete and that:

```sh
npm run lint
npm run test:unit
npm run test:e2e:ci
```

passed after W1.

If W1 is incomplete or blocked, STOP. Do not start refactoring around an unresolved safety change.

### Step 2 — F1: split the seven oversized components

Evidence and current line counts:

| Component | Lines | Evidence |
|---|---:|---|
| `src/features/testing/components/TestingPlanGenerator.tsx` | 882 | `:45-181`, `:368-865` |
| `src/core/screens/LogScreen.tsx` | 639 | `:152-633` |
| `src/features/patients/components/PatientHistory.tsx` | 559 | `:113-552` |
| `src/features/research/components/ResearchDashboard.tsx` | 549 | `:240-549` |
| `src/features/testing/components/TestingPlanPrintView.tsx` | 529 | `:174-521` |
| `src/features/dashboard/components/PatientTable.tsx` | 498 | `:153-498` |
| `src/features/testing/components/TestingWorkflowIndex.tsx` | 434 | `:49-434` |

The seven-file inventory is also recorded at `docs/audits/2026-10-05-design-ux-audit.md:171-183`.

Use these extraction boundaries:

1. `TestingPlanGenerator.tsx`

   Create:

   - `src/features/testing/components/TestingPlanGeneratorDrugSelection.tsx`
   - `src/features/testing/components/TestingPlanGeneratorCustomDrug.tsx`
   - `src/features/testing/components/TestingPlanGeneratorProtocolDetails.tsx`
   - `src/features/testing/components/TestingPlanGeneratorActions.tsx`

   Keep state ownership and callbacks in the parent unless a pure hook extraction is necessary.

2. `LogScreen.tsx`

   Create:

   - `src/core/screens/log/LogPatientSelector.tsx`
   - `src/core/screens/log/LogHistoryPanel.tsx`
   - `src/core/screens/log/LogEntryOptions.tsx`
   - `src/core/screens/log/LogDialogs.tsx`

3. `PatientHistory.tsx`

   Create:

   - `src/features/patients/components/history/PatientHistoryIdentity.tsx`
   - `src/features/patients/components/history/PatientHistoryRiskContext.tsx`
   - `src/features/patients/components/history/PatientHistoryTimeline.tsx`
   - `src/features/patients/components/history/PatientHistoryDetails.tsx`

4. `ResearchDashboard.tsx`

   Create:

   - `src/features/research/components/ResearchStatistics.tsx`
   - `src/features/research/components/ResearchRecordsTable.tsx`
   - `src/features/research/components/ResearchRecordDetails.tsx`
   - `src/features/research/components/ResearchDeleteDialog.tsx`

5. `TestingPlanPrintView.tsx`

   Create:

   - `src/features/testing/components/print/TestingPlanPrintHeader.tsx`
   - `src/features/testing/components/print/TestingPlanPrintTable.tsx`
   - `src/features/testing/components/print/TestingPlanPrintWarnings.tsx`
   - `src/features/testing/components/print/TestingPlanPrintSignatures.tsx`
   - `src/features/testing/components/print/TestingPlanPrintActions.tsx`

   Preserve all existing print class names until F3 is complete.

6. `PatientTable.tsx`

   Create:

   - `src/features/dashboard/components/patient-table/PatientTableDesktop.tsx`
   - `src/features/dashboard/components/patient-table/PatientTableMobile.tsx`
   - `src/features/dashboard/components/patient-table/PatientTablePagination.tsx`
   - `src/features/dashboard/components/patient-table/PatientTableStatus.tsx`

7. `TestingWorkflowIndex.tsx`

   Create:

   - `src/features/testing/components/workflow/TestingWorkflowStep.tsx`
   - `src/features/testing/components/workflow/TestingWorkflowDesktop.tsx`
   - `src/features/testing/components/workflow/TestingWorkflowMobile.tsx`

Rules:

- Preserve public exports and lazy-loading boundaries.
- Preserve text, test IDs, keys, callback order, state ownership, tab order, and DOM attributes.
- Do not fix contrast, spacing, radius, print colours, or touch targets inside F1; those belong to W1 or F3.
- Keep each extracted component focused and below 400 lines where practical.
- Do not introduce duplicate `ClinicalContextBar`, state, metric, or empty-state components.

### Step 3 — F2: remove dead code

Evidence:

- Wrapper: `src/features/patients/components/PatientIdentityBar.tsx:1-39`
- Wrapper test: `src/features/patients/components/PatientIdentityBar.test.tsx:1-59`
- Active implementation: `src/features/patients/components/ClinicalContextBar.tsx:1-193`
- Unused animation utility: `src/shared/utils/animations.ts:1-36`
- Export: `src/shared/utils/index.ts:9`
- Audit conclusion: `docs/audits/2026-10-05-design-ux-audit.md:164-169`

Run a repository-wide production search before deletion:

```sh
rg -n "PatientIdentityBar|animationConfig|transitions" src components App.tsx index.tsx
```

Under the current audit evidence:

1. Delete `PatientIdentityBar.tsx`.
2. Delete `PatientIdentityBar.test.tsx`.
3. Remove the animation export from `src/shared/utils/index.ts:9`.
4. Delete `src/shared/utils/animations.ts`.
5. Do not remove active CSS animation classes or animation declarations used by production components.

If a consumer outside the currently searched repository is discovered, STOP. Do not delete the wrapper; mark the plan `BLOCKED` with the consumer path.

### Step 4 — F3: centralise print primitives

Evidence:

- Existing report identity component: `src/features/reports/components/ReportPrintIdentity.tsx:22-31`
- Repeated print code: `src/features/reports/components/ClinicalReport.tsx:249-286`, `PatientHandout.tsx:45-115`, `PowerchartLetter.tsx:65-216`, `TestingPlanPrintView.tsx:230-296`
- Existing shared exports: `src/shared/components/index.ts:1-2`
- Audit recommendation: `docs/audits/2026-10-05-design-ux-audit.md:291-297`

Create:

- `src/shared/components/print/PrintPrimitives.tsx`
- `src/shared/components/print/index.ts`

The shared module should provide typed, minimal primitives for:

- Print document identity.
- Monochrome status labels.
- Print section wrappers.
- Signature blocks.
- Keep-together clinical entries.

Use the semantic print classes created in W1.

Keep `src/features/reports/components/ReportPrintIdentity.tsx` as a compatibility adapter around the shared identity primitive so existing imports and tests remain stable.

Update:

- `src/features/reports/components/ClinicalReport.tsx`
- `src/features/reports/components/PatientHandout.tsx`
- `src/features/reports/components/PowerchartLetter.tsx`
- `src/features/testing/components/TestingPlanPrintView.tsx`

The result must preserve the rendered DOM content, A4 structure, report identity, warning labels, signature placement, and print page-break behaviour.

### Step 5 — F4: extract shared filter and compact-action patterns

Evidence:

- Dashboard filters: `src/features/dashboard/components/AdvancedSearchFilters.tsx:105-183`, `303-346`
- Drug selection controls: `src/features/testing/components/DrugTestPanelSection.tsx:62-88`
- Drug-row actions: `src/features/testing/components/DrugTestGrid.tsx:127-181`
- Plan generator actions: `src/features/testing/components/TestingPlanGenerator.tsx:500-506`
- Audit recommendation: `docs/audits/2026-10-05-design-ux-audit.md:299-305`

Create:

- `src/shared/components/controls/CompactActionButton.tsx`
- `src/shared/components/controls/FilterClearButton.tsx`
- `src/shared/components/controls/index.ts`

Required behaviour:

- `FilterClearButton` accepts a domain-specific accessible label and preserves the caller’s clear callback.
- `CompactActionButton` provides a 44px hit area, focus-visible styling, optional tooltip/title, and an accessible name.
- The components must not hide or rewrite clinical domain text.
- Existing visual dimensions after W1 must remain unchanged except for the already-approved 44px target correction.

Replace repeated clear/remove actions in:

- `AdvancedSearchFilters.tsx`
- `DrugTestPanelSection.tsx`
- `DrugTestGrid.tsx`
- `TestingPlanGenerator.tsx`

Do not use the generic compact action for ordinary text actions such as `Select All` if a normal labelled Button is clearer.

### Step 6 — F5: add the token-contract test after U1

Evidence:

- Existing safety tests: `src/core/components/SharedPolishSafety.test.tsx:11-84`
- Light tokens: `index.css:50-91`
- Dark tokens: `index.css:218-273`
- Tailwind semantic mapping: `tailwind.config.js:62-87`
- Raw-colour safety-net comments: `index.css:747-763`
- Audit recommendation: `docs/audits/2026-10-05-design-ux-audit.md:307-313`

Create:

- `src/core/components/DesignTokenContract.test.ts`

The test must:

1. Read the current `index.css` token declarations.
2. Parse HSL token values for both `:root` and `.dark`.
3. Calculate relative luminance and contrast.
4. Assert the U1 contrast matrix remains at or above 4.5:1 for normal text.
5. Assert semantic grade foreground tokens exist in both themes.
6. Assert `Badge` grade variants do not use fixed `text-white` foregrounds.
7. Assert the shared Button, Input, Select, and Switch still carry `rounded-none` and visible focus classes.
8. Assert the semantic print policy is present.
9. Assert raw print slate/blue/red utility families do not return to the documents fixed by U4/F3.
10. Allow the documented print font-size detector findings because the design system explicitly permits them.
11. Check only the bounded files in this plan rather than failing on every pre-existing raw utility elsewhere in the repository.

F5 must be added after U1’s token changes. Do not write the test against the old failing matrix.

## Milestone 2 acceptance criteria

- All seven oversized components are split by responsibility.
- No public behaviour, text, DOM state, focus order, or clinical interaction changes.
- No component remains over 400 lines without a documented reason.
- `PatientIdentityBar` is removed only after confirming no production consumer.
- `animations.ts` and its export are removed only after confirming no production consumer.
- Print primitives are shared by reports and testing plans.
- Filter and compact-action patterns are shared by dashboard and testing surfaces.
- F5 fails if U1 tokens regress below AA.
- Existing visual snapshots show zero visual change for W2 refactors.
- The W2 diff contains no redesign or new visual treatment.

## Milestone 2 STOP conditions

Stop if:

- Extracting a component changes callback order, state ownership, or visible DOM.
- A visual snapshot changes for a reason not explained by W1.
- A print page, row, signature, warning, or identity block changes unexpectedly.
- `PatientIdentityBar` or `animations.ts` has an undiscovered consumer.
- A shared abstraction requires feature-specific conditionals that obscure clinical meaning.
- F5 needs to weaken its contrast threshold to pass.
- Any refactor introduces a new hardcoded colour, radius, gradient, or motion pattern.

## Milestone 2 verification

Run:

```sh
npx tsc --noEmit
npm run lint
npm run test:unit
npm run test:e2e:ci
```

Then run the existing visual suite without updating snapshots:

```sh
npm run build
CI=1 npx playwright test e2e/visual-chrome.spec.ts --project=chromium --grep @visual
```

The six existing Chrome snapshots under `e2e/visual-chrome.spec.ts-snapshots/` must remain visually unchanged. Do not use `--update-snapshots` to conceal a regression.

If manual inspection is required:

```sh
npm run dev -- --port 3002
```

## Milestone 2 risks and rollback

Risks:

- Moving closures across component boundaries can change stale-state behaviour.
- Print extraction can accidentally change CSS specificity.
- Generic controls can erase domain-specific accessible names.
- Deleting compatibility code can break an untracked external import.

Rollback:

- Revert only the executor’s extraction/deletion hunks.
- Restore deleted files from the exact pre-change content using a targeted patch, never a broad Git restore.
- Keep W1 safety fixes in place while rolling back only the failing refactor.
- If a visual diff remains unexplained, mark W2 `BLOCKED` rather than updating snapshots.

---

# Milestone 3 — W3 redesign shape specifications only

## Goal

Produce four complete, implementation-ready design specifications. Do not implement R1–R4.

The specifications must follow the Impeccable shape brief structure:

1. Job and audience.
2. Outcome and proof.
3. Selected direction and structural thesis.
4. Scope and boundaries.
5. States and realistic content ranges.
6. Layout, interaction, responsive behaviour, accessibility, and constraints.
7. Proposed durable `DESIGN.md` replacement section.
8. Open decisions and explicit anti-goals.

Create only:

- `docs/design-specs/2026-10-05-r1-testing-cockpit.md`
- `docs/design-specs/2026-10-05-r2-patient-identity-rail.md`
- `docs/design-specs/2026-10-05-r3-risk-graded-output-actions.md`
- `docs/design-specs/2026-10-05-r4-quiet-lock-station.md`

Do not modify:

- `src/**`
- `components/**`
- `index.css`
- `tailwind.config.js`
- `DESIGN.md`
- `REDESIGN_SUMMARY.md`
- screenshots or goldens
- `.impeccable` generated assets

The proposed `DESIGN.md` replacement sections belong inside the four specification documents. They are not approval to edit `DESIGN.md`.

The existing Clinical Workbench visual world remains the authority. Do not invent a new brand, gradient system, or rounded visual language. If the executor believes a concept-selection round is required, STOP and record the unresolved decision rather than silently choosing a new visual world.

## R1 — two-speed testing cockpit

**Specification file:** `docs/design-specs/2026-10-05-r1-testing-cockpit.md`

**Surface mode:** Operate.

Evidence:

- `src/features/testing/components/TestingLogForm.tsx:145-176`, `258-287`
- `src/features/testing/components/TestingWorkflowIndex.tsx:329-407`
- `src/features/testing/components/DrugTestPanelSection.tsx:73-181`
- `src/features/testing/components/DrugTestGrid.tsx:206-259`
- Existing workflow and mobile evidence: `e2e/screenshots/after/testing-desktop.png`, `e2e/screenshots/after/testing-mobile.png`
- Audit recommendation: `docs/audits/2026-10-05-design-ux-audit.md:191-197`

The specification must define:

- A primary “Record now” lane for wheal/flare measurements, challenge observations, and save/next actions.
- A secondary “Plan and reference” lane for protocol selection, custom concentrations, document chasing, and optional notes.
- The seven-step workflow as the persistent orientation model.
- A desktop first viewport with the active recording lane visually dominant and the plan lane available without forcing the nurse through a dense control wall.
- A 375px layout where “Record now” appears first, secondary configuration is collapsed or disclosed, and Save/Next remains reachable.
- A 768px/tablet layout that preserves the same priority order.
- A sticky identity/context area that composes with R2 without duplicating identity.
- Direct manipulation rules for moving between measurements without losing draft state.
- Validation rules that expose missing or invalid values beside the relevant field.
- Loading, empty, saved, unsaved, urgent, error, offline, and locked states.
- 44px targets, focus order, keyboard operation, screen-reader labels, and AA contrast.
- A realistic minimum, typical, and maximum drug/protocol range.
- No invented clinical thresholds or changes to existing validation.

Acceptance criteria for the specification:

- A different executor can implement the flow without needing this session’s context.
- The first viewport clearly distinguishes recording from configuration.
- All mandatory clinical fields remain discoverable.
- The spec includes desktop, tablet, 375px mobile, and 125% font-scaling behaviour.
- The spec explicitly says ghost rows in full-page screenshots are not a defect unless corroborated by source (`docs/audits/2026-10-05-design-ux-audit.md:361`).
- The spec names semantic tokens, zero-radius geometry, focus-visible treatment, and no decorative motion.

Proposed durable design section:

> `## Testing Cockpit: Two-Speed Bedside Operation`

State that this section replaces or expands the current broad “High-Density Clinical Utility” guidance at `DESIGN.md:116-121` and the general responsive testing guidance at `DESIGN.md:228-230`. It must define the priority order of record-now versus configure/reference, not prescribe implementation details.

## R2 — persistent patient identity rail

**Specification file:** `docs/design-specs/2026-10-05-r2-patient-identity-rail.md`

**Surface mode:** Operate.

Evidence:

- `src/features/patients/components/ClinicalContextBar.tsx:60-83`, `141-186`
- `src/core/components/navigation/AppTopBar.tsx:54-84`
- `e2e/screenshots/after/summary-mobile.png`
- `DESIGN.md:159-168`, `220-235`
- Audit recommendation: `docs/audits/2026-10-05-design-ux-audit.md:199-205`

The specification must define:

- A persistent identity rail inside the content workbench, distinct from application navigation.
- Desktop/tablet presentation that keeps family name, given name, REDCap ID, and DOB visible together.
- A mobile presentation with a dedicated identity row that does not compete with the page title, draft/report badges, or top-bar actions.
- Secondary reaction date, visit date, and source in a details disclosure.
- Redaction behaviour for all identity values.
- Patient-switch affordance and the existing confirmation requirement.
- Empty identity state: `NO IDENTITY ENTERED`.
- Long family names, long IDs, long DOB/source strings, and 125% font scaling.
- No horizontal scrolling of the primary identity.
- No truncation of the primary identity fields.
- Clear distinction between patient identity, app status, and navigation.
- Screen-reader ordering and accessible naming.
- Light and dark theme contrast.

Acceptance criteria for the specification:

- The primary identity never scrolls out of view on a 375px screen.
- A nurse can confirm family name, given name, REDCap ID, and DOB without opening a secondary control.
- Secondary context can be disclosed without moving or hiding the primary identity.
- The spec does not re-recommend the already-completed sidebar/topbar consolidation.
- The spec includes a wireframe or text layout for 375px, 768px, and 1280px.
- The spec preserves redaction and patient-switch safety behaviour.

Proposed durable design section:

> `## Patient Identity Rail and Anti-Mix-Up Context`

State that this replaces the current `ClinicalContextBar` guidance within `DESIGN.md:167-168` and sharpens the no-overflow requirement in `DESIGN.md:232-235`. The replacement must define the identity rail as a safety surface rather than another navigation surface.

## R3 — risk-graded outbound actions

**Specification file:** `docs/design-specs/2026-10-05-r3-risk-graded-output-actions.md`

**Surface mode:** Operate.

Evidence:

- `src/core/screens/SummaryScreen.tsx:211-280`
- `src/features/reports/components/OutboundActionDialog.tsx:135-235`
- `PRODUCT.md:25-31`
- Audit recommendation: `docs/audits/2026-10-05-design-ux-audit.md:207-213`

The specification must define three action tiers:

1. **Local clinical output**

   - Print as the dominant action.
   - Copy as a local utility.
   - No network destination.

2. **External destination**

   - Email or other external transfer.
   - Visually separated from local actions.
   - Explicit destination and data-boundary explanation.

3. **Research submission**

   - Separate from ordinary output.
   - Clearly states that only the de-identified research payload is transmitted.
   - Preserves duplicate-submission protection and existing confirmation.

The specification must define:

- Action grouping and visual hierarchy.
- The information shown before a confirmation dialog opens.
- Confirmation-dialog content by risk tier.
- Redacted versus identified output states.
- Research already submitted, in-progress, success, failure, and retry states.
- Offline behaviour.
- Keyboard order and focus restoration.
- Accessible names and status announcements.
- How action hierarchy works at 375px and 125% scaling.
- No auto-send or implicit external transmission.
- No new external service.

Acceptance criteria for the specification:

- A clinician can distinguish local print, local copy, external email, and research submission before activating an action.
- Every external or research action states its destination and data boundary.
- The safe local action remains the easiest action to find.
- The existing confirmation flow remains part of the design.
- The spec explicitly preserves local-first processing from `PRODUCT.md:25-31`.
- The spec uses semantic status/risk tokens, zero radius, and no decorative risk gradients.

Proposed durable design section:

> `## Risk-Graded Clinical Outputs`

State that this replaces generic output-action guidance with an explicit local-versus-external hierarchy. The section must align with the semantic status rules at `DESIGN.md:177-182` and the privacy requirements at `DESIGN.md:314-330`.

## R4 — quiet lock station

**Specification file:** `docs/design-specs/2026-10-05-r4-quiet-lock-station.md`

**Surface mode:** Operate.

Evidence:

- `src/core/components/PasswordGate.tsx:82-122`, `164-212`
- `index.css:465-518`, `585-608`, `669-703`
- `DESIGN.md:159-165`, `314-329`
- `PRODUCT.md:21-31`
- Audit recommendation: `docs/audits/2026-10-05-design-ux-audit.md:215-221`

The specification must define:

- A flat, quiet clinical privacy station.
- One clear lock state with a rectangular high-contrast PIN module.
- No animated blur fields.
- No architectural grid drift.
- No glow pulse.
- No convergence spectacle.
- A concise explanation that the lock protects against casual shoulder-surfing and is not enterprise access control.
- Four PIN fields with 44px interaction areas.
- Existing paste, automatic advance, backspace, Enter, error announcement, and focus restoration behaviour.
- A restrained non-motion error state.
- Light and dark theme treatment using semantic masthead/card tokens.
- Reduced-motion behaviour.
- Offline behaviour.
- Version information kept visually subordinate.
- No change to the hardcoded PIN or validation model.

Acceptance criteria for the specification:

- A nurse can understand the lock state and next action immediately.
- The privacy limitation is clear without implying authentication.
- The first interaction is available at 375px and 125% scaling.
- Error feedback is visible, announced, and not dependent on animation.
- No gradients, neon, blur, or decorative motion are required.
- The spec explicitly states that PIN implementation and credential storage are outside R4.

Proposed durable design section:

> `## Privacy Screen Lock Station`

State that this replaces the decorative lock-screen treatment implied by the current masthead/lock-station styling at `DESIGN.md:159-165` and clarifies the PIN rule at `DESIGN.md:314-323`. The section must preserve the PIN as a shoulder-surfing safeguard while defining a calmer visual and motion contract.

## Milestone 3 acceptance criteria

- All four specification documents exist at the exact paths above.
- Each document states `Operate` mode.
- Each document contains job/audience, outcome/proof, layout, interaction rules, responsive behaviour, states, accessibility, constraints, acceptance criteria, anti-goals, and a proposed `DESIGN.md` replacement section.
- Each document cites current source and screenshot evidence.
- Each document is implementation-ready for an executor with no memory of this session.
- No R1–R4 source implementation is present.
- `DESIGN.md` itself is unchanged.
- No new visual assets, gradients, rounded geometry, or generated `.impeccable` artifacts are added.

## Milestone 3 STOP conditions

Stop if:

- The executor starts implementing R1, R2, R3, or R4.
- The spec requires changing the hardcoded PIN.
- A spec invents clinical data, thresholds, or claims not present in `PRODUCT.md` or current code.
- A direction requires a new visual identity rather than extending the established Clinical Workbench.
- The proposed `DESIGN.md` section cannot be reconciled with zero radius, semantic tokens, AA contrast, or print rules.
- Any source file is changed while producing the specs.

## Milestone 3 verification

Run:

```sh
npm run lint
npm run test:unit
npm run test:e2e:ci
```

Verify the specification files exist:

```sh
test -f docs/design-specs/2026-10-05-r1-testing-cockpit.md
test -f docs/design-specs/2026-10-05-r2-patient-identity-rail.md
test -f docs/design-specs/2026-10-05-r3-risk-graded-output-actions.md
test -f docs/design-specs/2026-10-05-r4-quiet-lock-station.md
```

Confirm that only the intended W3 documentation paths changed in the W3 portion of the diff. Do not run a visual snapshot update.

If a local server is needed for a final read-through, use port 3002:

```sh
npm run dev -- --port 3002
```

## Milestone 3 risks and rollback

Risks:

- A spec may accidentally prescribe implementation details instead of a durable design contract.
- R1 and R2 may overlap identity placement or sticky chrome responsibilities.
- R3 may make external actions visually alarming without making the data boundary understandable.
- R4 may remove useful orientation if “quiet” is interpreted as visually empty.

Rollback:

- Delete only the newly created W3 specification documents if the milestone is rejected.
- Do not remove or revert W1/W2 source changes.
- Do not edit `DESIGN.md` or `REDESIGN_SUMMARY.md` as a substitute for the specs.

---

# Final completion gate

The plan is complete only when:

1. W1 is verified and marked complete.
2. W2 is verified with unchanged visual snapshots.
3. W3 contains four design specifications and no implementation.
4. `plans/README.md` has the final status row set to `DONE`, or `BLOCKED` with a one-line reason.
5. The executor has not committed, pushed, deployed, installed packages, or altered unrelated files.
6. Final verification has been run:

```sh
git status --short
git diff --check
```

Report the selected executor, changed files, verification results, and any unresolved risks.