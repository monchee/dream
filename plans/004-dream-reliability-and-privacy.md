# Plan 004: DREAM reliability, clinical semantics, and documentation hygiene

**Proposed file:** `plans/004-dream-reliability-and-privacy.md`

**Executor:** ZCode — `glm-5.3-flash`, maximum reasoning.

**Plan choice:** Use one numbered plan with four sequential milestones because truthful persistence is the clinical prerequisite, failure-mode tests validate it, semantic safeguards follow, and documentation/tooling closes the release handoff.

## Executor contract

Read this entire plan before starting. Then read:

- `docs/audits/2026-10-05-design-ux-audit.md`
- `PRODUCT.md`
- `DESIGN.md`
- `plans/README.md`
- `README.md`
- `CONTRIBUTING.md`
- `MAINTAINERS.md`

Update the `plans/README.md` row:

1. `TODO` before execution.
2. `IN PROGRESS` before the first implementation step.
3. `DONE` only after every milestone and the final completion gate passes.
4. `BLOCKED` with a one-line reason when a STOP condition prevents safe completion.
5. `REJECTED` only when explicitly rejected, with a one-line rationale.

Do not:

- Commit, push, deploy, install packages, reset files, clean the worktree, or use `git checkout`, `git restore`, or `git reset`.
- Add cloud services, new dependencies, or a replacement service worker.
- Change clinical stored-data schemas, TTL duration, validation thresholds, protocol ordering, dilution values, tryptase meaning, or PIN behavior.
- Weaken or delete existing tests to make the suite pass.
- Change the hardcoded PIN. Its existing by-design documentation is at `src/core/components/PasswordGate.tsx:9-28`.
- Reintroduce the removed research/Supabase feature. Its removal is recorded in `CHANGELOG.md:1-15` and the current dependency list at `package.json:27-54`.
- Add decorative gradients, neon, new motion, non-zero radius, raw color utilities, or sub-44px touch targets below `xl`.

Preserve all unrelated worktree changes. At plan authoring time, unrelated untracked paths include `.github/agents/`, `.github/hooks/`, `.mimosa/`, `.zcode/`, and `home-375-dark.png`; do not delete or rewrite them.

## Status/index change

Add this row to `plans/README.md`:

| Plan | Title | Priority | Effort | Depends on | Status |
|---|---|---:|---:|---|---|
| 004 | DREAM reliability, clinical semantics, and documentation hygiene | P0 | L | 003 | TODO |

## Current evidence and invariants

- `setWithTTL` currently returns `void` and swallows storage failures at `src/shared/utils/ttlStorage.ts:30-41`.
- Autosave marks a draft as saved immediately after calling that non-reporting function at `src/features/testing/hooks/useTestingState.ts:219-230`.
- Manual persistence does the same at `src/features/testing/hooks/useTestingState.ts:237-285`.
- Final submission updates in-memory report state, calls storage, and then deletes the draft without checking whether the report write worked at `src/features/testing/hooks/useTestingState.ts:327-344`.
- The outer submit handler always announces success and navigates at `src/core/hooks/useAnaestheticApp.ts:176-182`.
- Existing draft status UI assumes a timestamp means a confirmed write at `src/features/testing/components/DraftSaveIndicator.tsx:20-45`.
- The navigation guard calls `persistDraftNow` and navigates without checking its outcome at `src/core/hooks/useAppNavigation.ts:132-149`.
- Patient database uploads also announce success without checking persistence at `src/features/dashboard/components/Dashboard.tsx:99-128`, `:192-201`, `src/shared/hooks/useRedcapCsvUpload.ts:23-40`, and `src/features/patients/hooks/usePatientState.ts:74-118`.
- The testing-plan builder marks drafts saved unconditionally at `src/features/testing/components/TestingPlanGenerator.tsx:168-185`.
- Existing navigation unit tests cover much of the guard logic but not real browser Back/Forward behavior at `src/core/hooks/useAppNavigation.test.ts:96-170`, `:232-375`.
- The dedicated axe contrast test enables `color-contrast` at `e2e/accessibility.spec.ts:213-244`; broad scans disable it at `e2e/accessibility.spec.ts:503-512`.
- Service-worker safety policy is already isolated at `src/shared/utils/pwaUpdatePolicy.ts:61-80`, `:94-147`, `:166-218`, with unit coverage at `src/shared/utils/pwaUpdatePolicy.test.ts:97-276`.
- Dashboard session grades are inferred heuristically at `src/features/dashboard/hooks/useDashboardAnalytics.ts:110-124`, then presented as a general severity distribution at `src/features/dashboard/components/AnalyticsPanel.tsx:120-153`.
- Protocol differences are currently printed only to the console at `scripts/sync-protocols.mjs:175-195`; the snapshot is written immediately afterward at `scripts/sync-protocols.mjs:260-270`.
- Protocol ordering is clinically significant because saved plans use `protocolIndex`, documented at `src/shared/data/drugMasterlist.ts:24-32` and tested at `src/shared/data/drugMasterlist.test.ts:14-88`.
- The current version is `0.91.0` at `package.json:4`, with a matching changelog entry at `CHANGELOG.md:1`.
- The release guard runs before builds at `package.json:8-12` and checks changelog presence at `scripts/check-release.mjs:34-74`.
- Local Playwright development currently assumes port 3000 at `playwright.config.ts:10-38`; this machine requires port 3002.

## Global implementation rules

Every UI change must:

- Use semantic tokens such as `text-foreground`, `bg-card`, `border-border`, `text-status-warning`, and `bg-status-warning/10`.
- Preserve zero-radius geometry with `rounded-none` or `0px`.
- Meet WCAG 2.1 AA contrast in light and dark themes.
- Preserve visible `:focus-visible` indicators.
- Preserve the 44px touch target below `xl`.
- Avoid decorative gradients, neon, glow, and unnecessary motion.
- Keep warnings visible but non-blocking.
- Never expose patient identifiers in console warnings, test failure messages, or generated protocol-review artifacts.
- Preserve local-first operation. No clinical data may be sent to a new service.
- Preserve the existing local storage keys, TTL, envelope shape, and clinical data schemas.
- Strengthen existing tests; do not weaken assertions or remove coverage.
- Avoid changing visual snapshots. If an unexpected visual snapshot changes, STOP.

The current design baseline is:

- Local-first clinical use and browser-only clinical processing: `PRODUCT.md:11-30`.
- WCAG 2.1 AA and 85–125% font scaling: `PRODUCT.md:46-57`.
- Zero radius, semantic tokens, focus, contrast, touch, motion, and print rules: `DESIGN.md:263-329`.

## Commands and release guard

Use these commands for verification:

```sh
npm run check:release
npx tsc --noEmit
npm run lint
npm run test:unit
npm run test:e2e:ci
```

`npm run test:e2e:ci` runs the production build and Chromium with `CI=1`, excluding `@visual` tests, as defined at `package.json:22-25`.

If a manual development server is needed, use:

```sh
npm run dev -- --port 3002
```

Never run bare `npm run dev` on this machine.

Do not use `ALLOW_UNRELEASED=1` to hide a release failure. The current standalone guard should pass for v0.91.0. If this work is prepared as a normal mergeable release, follow the existing release process without rewriting history: update the version and add a truthful matching `CHANGELOG.md` entry before running the guard with `--against`. If the version has advanced since this plan was written, do not overwrite it.

---

# Milestone 1 — M1 honest local saves

## Goal

Make every clinical save path report success only after a confirmed browser-storage write. A failed write must leave the clinician in the current workflow, retain in-memory data, avoid deleting drafts, and show a clear non-blocking warning.

Do not begin M2 until M1 is complete and verified.

## Ordered steps

### Step 1 — Preflight and scope check

Evidence:

- Current baseline: `package.json:4`.
- Plan index contract: `plans/README.md:1-20`.
- Existing persistence callers: `src/shared/utils/ttlStorage.ts:30-41`, `src/features/testing/hooks/useTestingState.ts:226`, `:280`, `:338`, `src/features/patients/hooks/usePatientState.ts:86`, `:112`, `src/features/testing/components/TestingPlanGenerator.tsx:172`.

Run:

```sh
git status --short
git diff --stat 1a89ecb -- \
  src/shared/utils/ttlStorage.ts \
  src/features/testing \
  src/features/patients \
  src/core/hooks \
  src/core/screens \
  src/shared/hooks \
  App.tsx \
  components/ui \
  plans/README.md
rg -n "setWithTTL|getSavedAt|Draft saved|Database updated|persistDraftNow|removeStored" \
  src App.tsx
```

Record unrelated changes. Update only the Plan 004 status row from `TODO` to `IN PROGRESS`.

If a target file contains unrelated edits that cannot be separated safely, STOP and mark the plan `BLOCKED`.

### Step 2 — Make `setWithTTL` truthful without breaking callers

Evidence:

- Current function: `src/shared/utils/ttlStorage.ts:30-41`.
- Storage keys and envelope boundary: `src/shared/utils/ttlStorage.ts:13-28`.
- Existing tests: `src/shared/utils/ttlStorage.test.ts:1-31`.

Change:

1. Keep the existing function parameters, generic type, keys, envelope shape, and TTL unchanged.
2. Change only the return type from `void` to `boolean`.
3. Serialize the envelope once.
4. Call `localStorage.setItem`.
5. Confirm the write by reading the same key and verifying the stored serialized value matches.
6. Return `true` only after the write and confirmation succeed.
7. Return `false` for quota errors, private-mode/security errors, unavailable storage, serialization errors, or read-back errors.
8. Keep failures non-throwing.
9. Log only a generic non-PHI warning. Do not include patient data or raw exception content.
10. Existing callers that ignore the return value must continue compiling and behaving normally on success.

Add unit coverage for:

- Successful write returns `true`.
- Quota failure returns `false` without throwing.
- Security/private-mode failure returns `false` without throwing.
- Read-back mismatch returns `false`.
- Existing TTL envelope remains unchanged.

Do not change `getIfFresh`, `getSavedAt`, TTL duration, storage keys, or `removeStored` in this step.

### Step 3 — Make autosave and manual persistence honest

Evidence:

- Autosave: `src/features/testing/hooks/useTestingState.ts:171-235`.
- Manual persistence: `src/features/testing/hooks/useTestingState.ts:237-286`.
- Existing status component: `src/features/testing/components/DraftSaveIndicator.tsx:3-47`.
- Testing screen props and indicator: `src/core/screens/TestingScreens.tsx:63-140`.
- App prop forwarding: `App.tsx:48-62`, `:224-237`.
- Navigation persistence call: `src/core/hooks/useAppNavigation.ts:132-149`.

Change:

1. Add React state for a storage-write warning in `useTestingState`. Store only a stable, generic user-facing message or error state, never the exception object.
2. In autosave:
   - Call `setWithTTL`.
   - Update `lastSavedDraftRef`, `lastDraftSavedAt`, and the saved state only when it returns `true`.
   - On `false`, leave the last confirmed timestamp and last confirmed draft unchanged.
   - Set `isSavingDraft` to `false`.
   - Set the visible warning.
3. In `persistDraftNow`:
   - Return `true` when there is no dirty draft or the write succeeds.
   - Return `false` when the write fails.
   - Do not update the confirmed draft reference or timestamp on failure.
4. Update `useAppNavigation` to accept `() => boolean | void`.
   - Treat an explicit `false` as a failed persistence.
   - Keep the clinician on the current screen and keep the navigation guard open when persistence fails.
   - Treat `undefined` as the legacy-success result so existing compatibility callers do not break.
5. Extend `DraftSaveIndicator` with an explicit failure state.
   - Failure takes precedence over “Draft saved”.
   - Use wording such as `Unable to save locally — keep this window open`.
   - Keep `aria-live="polite"` and `aria-atomic="true"`.
   - Use semantic warning tokens and no pulse animation for the failure state.
6. Pass the warning to `TestingScreen` and render it visibly beside the draft status.
7. Do not make the PIN gate depend on clinical local storage. A lock-screen storage-health indicator is optional only if it can be added without changing `PasswordGate` PIN or session logic.

Add or strengthen tests:

- Autosave failure leaves the prior confirmed timestamp unchanged.
- Manual persistence returns `false` and leaves the draft dirty.
- Navigation does not proceed when persistence returns `false`.
- Existing successful autosave/manual-save tests still pass.
- Failure indicator does not display “Draft saved”.

### Step 4 — Guard final report submission

Evidence:

- Final report write and draft deletion: `src/features/testing/hooks/useTestingState.ts:296-351`.
- Outer success toast and navigation: `src/core/hooks/useAnaestheticApp.ts:176-182`.
- Testing screen submit path: `App.tsx:224-237`.
- Existing successful submit tests: `src/features/testing/hooks/useTestingState.test.ts:223-311`.

Change:

1. Parse and validate the form exactly as today.
2. Build the existing `ActiveReportEnvelope` without changing its schema.
3. Attempt `setWithTTL(ACTIVE_REPORT_KEY, activeEnvelope)` before mutating:
   - `lastSavedRecord`
   - `activeReportContext`
   - `activeReportSavedAt`
   - `recentLogs`
   - draft references
4. If the report write returns `false`:
   - Keep the form mounted and unchanged.
   - Keep any existing testing draft.
   - Do not call `removeStored(TESTING_DRAFT_KEY)`.
   - Do not set active-report state.
   - Set the visible storage warning.
   - Return a failure result such as `null` to the internal caller.
5. Update `useAnaestheticApp.handleSubmit` to:
   - Show the existing success toast and navigate only for a confirmed record.
   - Stay on the testing screen without a success toast when the storage write fails.
6. Preserve the existing parser-error behavior. Validation/parser failures must remain distinguishable from storage failures.
7. On successful report write, preserve the existing cleanup order: only then remove the draft and update active-report state.

Add tests that inject an `ACTIVE_REPORT_KEY` write failure and assert:

- No active report is created.
- The draft key remains present if it existed.
- `lastSavedRecord` remains unchanged.
- No “Record saved” success message is emitted.
- Navigation is not triggered.
- Existing successful submission tests remain unchanged.

### Step 5 — Remove false success from other persistence callers

Evidence:

- Patient database writes: `src/features/patients/hooks/usePatientState.ts:74-118`.
- CSV upload success toast: `src/shared/hooks/useRedcapCsvUpload.ts:23-40`.
- Get Started import: `src/core/components/GetStartedModal.tsx:33-40`, `:98-107`.
- Screen-layout import: `src/core/components/ScreenLayout.tsx:101-107`.
- Dashboard upload toasts: `src/features/dashboard/components/Dashboard.tsx:99-128`, `:192-201`.
- Testing-plan builder write: `src/features/testing/components/TestingPlanGenerator.tsx:168-185`, `:371-396`.

Change:

1. `usePatientState.handleUploadPatients`:
   - Return `boolean`.
   - Keep in-memory imported data available.
   - Set `patientDbSavedAt` only after a confirmed `true`.
   - Return `false` and surface a generic storage warning when persistence fails.
2. `toggleSuspectedAgent`:
   - Check the boolean result when an uploaded database exists.
   - Do not update the confirmed saved timestamp on failure.
   - Show a non-blocking warning through the existing application notification path.
3. `useRedcapCsvUpload`:
   - Allow `onParsed` to return `boolean | void`.
   - Treat `false` as a persistence failure.
   - Do not emit “Database updated” or call completion callbacks after `false`.
   - Preserve legacy behavior for existing callbacks that return `void`.
4. Dashboard upload flows:
   - Show success only for `true`.
   - Show a non-blocking storage warning for `false`.
   - Do not claim that an imported database is persisted when only in-memory state changed.
5. Get Started and `ScreenLayout` upload flows:
   - Keep the import surface open or otherwise visibly warn when persistence fails.
   - Do not silently close the flow and announce success.
6. `TestingPlanGenerator`:
   - Update `lastDraftSavedAt` only after `setWithTTL` returns `true`.
   - Pass failure state into `DraftSaveIndicator`.
7. Keep all messages generic and PHI-free.

Add tests for each changed callback path. The import parser tests at `src/shared/hooks/useRedcapCsvUpload.test.ts:21-55` must retain their successful-upload assertions and add a failed-persistence case.

## M1 acceptance criteria

M1 is complete only when:

- `setWithTTL` returns `true` only for a confirmed write and `false` for quota/private-mode/security failures.
- Existing callers that ignore its return value still compile.
- Autosave and manual persistence never show a saved timestamp after a failed write.
- A failed final report write never deletes the testing draft.
- A failed final report write never navigates away or emits a success toast.
- Patient import and plan-builder UI do not claim persistence after a failed write.
- Failure messages are visible, non-blocking, semantic-token based, zero-radius, and PHI-free.
- Existing storage keys, TTL, envelope schemas, parser behavior, clinical thresholds, and PIN behavior are unchanged.
- All new and existing tests pass.

## M1 STOP conditions

Stop immediately if:

- Any failed write still updates a saved timestamp or removes a draft.
- The final submit path navigates after a failed report write.
- A storage warning includes identifiers, raw serialized clinical data, or raw exception text.
- A fix requires changing `PasswordGate` PIN validation or session storage.
- A change modifies the clinical storage envelope or key names.
- Patient import success/failure behavior cannot be made explicit without inventing a new clinical workflow.
- A test must be removed or weakened.
- Any UI fix violates semantic-token, zero-radius, focus, contrast, touch, or motion rules.

## M1 verification

Run in order:

```sh
npm run check:release
npx tsc --noEmit
npm run lint
npm run test:unit
npm run test:e2e:ci
```

Run targeted tests while iterating:

```sh
npx vitest run \
  src/shared/utils/ttlStorage.test.ts \
  src/features/testing/hooks/useTestingState.test.ts \
  src/core/hooks/useAppNavigation.test.ts \
  src/shared/hooks/useRedcapCsvUpload.test.ts \
  src/features/testing/components/DraftSaveIndicator.test.tsx
```

If manual inspection is needed:

```sh
npm run dev -- --port 3002
```

## M1 risks and rollback

Risks:

- A storage failure could be reported after the form has already changed in memory.
- Returning `false` from manual persistence could alter navigation-guard timing.
- Existing upload callback callers may rely on `void` return types.
- A read-back confirmation adds a second storage operation.

Rollback:

- Revert only the executor’s M1 hunks with a targeted patch.
- Preserve the truthful `boolean` contract and tests while isolating any UI integration issue.
- Do not revert to unconditional “saved” indicators.
- Do not remove failure tests to make the suite pass.

---

# Milestone 2 — M2 failure-mode tests

## Goal

Add reliable tests for the failure modes most likely to lose work or mislead clinicians: storage failure, multiple tabs, dirty browser history, service-worker updates during an unlocked session, and dark-theme contrast.

M2 starts only after M1’s confirmed-write contract passes.

## Ordered steps

### Step 1 — M2 preflight and test contract

Evidence:

- Existing draft lifecycle tests: `src/features/testing/hooks/useTestingState.test.ts:186-311`, `:458-479`.
- Existing navigation tests: `src/core/hooks/useAppNavigation.test.ts:96-170`, `:232-375`.
- Existing E2E fixture: `e2e/fixtures.ts:43-76`.
- Existing CI E2E command: `package.json:22-25`.

Confirm:

```sh
git status --short
rg -n "Draft saved|Unable to save|storage|persistDraftNow|goBack|goForward|serviceWorker|color-contrast" \
  src e2e
```

Do not modify existing assertions merely to make new tests pass.

### Step 2 — Unit-test storage failure and final-save guarantees

Evidence:

- `setWithTTL`: `src/shared/utils/ttlStorage.ts:30-41`.
- Testing state write points: `src/features/testing/hooks/useTestingState.ts:226`, `:280`, `:338`.
- Existing storage tests: `src/shared/utils/ttlStorage.test.ts:1-31`.
- Existing submit tests: `src/features/testing/hooks/useTestingState.test.ts:223-311`.

Add unit tests for:

- `QuotaExceededError`.
- `SecurityError`/private-mode behavior.
- Generic `localStorage.setItem` failure.
- Read-back mismatch.
- Autosave failure preserving the previous confirmed draft.
- Manual persistence failure returning `false`.
- Final report failure preserving the draft and active in-memory form.
- Successful final report still deleting the draft after confirmed report storage.

### Step 3 — Browser storage-failure injection

Add an E2E spec, preferably `e2e/reliability-failures.spec.ts`, using the existing fixture and Playwright only.

Evidence:

- Fixture storage setup: `e2e/fixtures.ts:43-59`.
- Draft flow: `e2e/testing-day.spec.ts:114-145`.
- Storage utility: `src/shared/utils/ttlStorage.ts:30-41`.
- Testing warning surface created in M1.

Use `page.addInitScript` to override `Storage.prototype.setItem` only for clinical keys:

- `dream:testing_draft`
- `dream:active_report`
- `dream:testing_plan_builder_drafts`
- `dream:patient_db`

Leave fixture keys and theme/session setup writable.

Cover two injected failures:

1. `QuotaExceededError`.
2. `SecurityError` representing private-mode or storage-blocked behavior.

Assert:

- The page remains usable.
- No uncaught page error occurs.
- The testing form retains entered values.
- “Draft saved” is not shown after the failed write.
- The visible non-blocking warning is shown.
- A failed final report write remains on the testing screen.
- An existing draft is not removed by the failed final save.

Do not use real patient identifiers in the fixture.

### Step 4 — Two-tab divergence

Evidence:

- Storage event listener currently only checks expiry: `src/features/testing/hooks/useTestingState.ts:141-169`.
- Draft restore path: `src/features/testing/hooks/useTestingState.ts:123-139`.
- Draft key: `src/shared/utils/ttlStorage.ts:15-16`.

Use two pages in the same Playwright browser context so they share local storage.

Test sequence:

1. Open the testing workflow in Tab A and enter a synthetic identity/value.
2. Wait for a confirmed draft save.
3. Open Tab B and confirm it restores the same draft.
4. Make a different edit in Tab B and wait for its confirmed save.
5. Return focus to Tab A while Tab A still has a dirty or stale in-memory draft.
6. Assert the app does not silently claim Tab A’s stale values are saved or overwrite Tab B’s newer confirmed write.

The minimum safe contract is:

- A fresh external draft change is detected.
- A dirty stale tab receives a visible warning such as `Another tab changed this draft. Reload before continuing.`
- The stale tab remains dirty and cannot silently overwrite the newer write.
- No automatic merge algorithm is introduced.

If the implementation requires a clinical decision between merge, overwrite, or discard, STOP and mark the plan `BLOCKED`; do not guess.

### Step 5 — Dirty Back/Forward browser coverage

Evidence:

- Internal navigation guard: `src/core/hooks/useAppNavigation.ts:114-149`.
- Popstate guard: `src/core/hooks/useAppNavigation.ts:167-228`.
- Browser fixture flow: `e2e/testing-day.spec.ts:192-220`.

Add a real browser test that:

1. Enters `/testing`.
2. Makes the form dirty.
3. Uses application navigation to establish a prior and next history entry.
4. Presses browser Back.
5. Confirms the leave dialog appears and the testing URL/screen is restored.
6. Chooses “Stay in session” and confirms the dirty form remains.
7. Repeats with Forward where supported.
8. Chooses “Leave and keep draft”.
9. Returns to testing and confirms the draft is restored.

The test must use browser history APIs through Playwright, not only a mocked `PopStateEvent`.

### Step 6 — Service-worker update while unlocked

Evidence:

- Update policy contract: `src/shared/utils/pwaUpdatePolicy.ts:61-80`, `:94-147`, `:172-218`.
- Existing unit tests: `src/shared/utils/pwaUpdatePolicy.test.ts:112-132`, `:162-245`.
- Production registration: `index.tsx:26-30`.
- Generated service-worker configuration: `vite.config.ts:11-101`.
- Update toast: `src/shared/utils/toast-config.ts:35-44`.

Add browser coverage against the production preview created by `npm run test:e2e:ci`.

Preferred deterministic approach:

1. Use a fresh browser context with service workers allowed.
2. Let the current generated `sw.js` register normally.
3. Intercept only the subsequent service-worker script request and serve the same current script with a harmless byte-level version change, such as a comment.
4. Trigger the existing registration update path.
5. Keep `sessionStorage['dream:unlocked'] = 'true'`.
6. Assert the visible `A new version is ready` prompt appears.
7. Assert the page does not reload automatically and draft fields remain mounted.
8. Assert the explicit `Reload now` action is the only path that activates/reloads the update.

Do not replace the production service worker, add a test-only production route, or disable service-worker registration.

If the generated worker cannot be updated deterministically through Playwright without replacing production behavior or adding a new dependency, STOP and report the limitation. Do not downgrade this to unit-only coverage silently.

### Step 7 — Dark-mode contrast E2E

Evidence:

- Existing contrast-enabled pattern: `e2e/accessibility.spec.ts:213-244`.
- Broad contrast exclusion that must not be treated as coverage: `e2e/accessibility.spec.ts:503-512`.
- Theme storage and class application: `src/core/components/ThemeProvider.tsx:31-65`.
- Theme toggle accessible name: `src/core/components/navigation/ThemeToggleButton.tsx:16-29`.

Extend the dedicated contrast test or add a companion test that scans both themes with `color-contrast` enabled.

Required coverage:

- Light home/workbench surface.
- Dark home/workbench surface.
- At least one populated testing surface containing status and grade tokens.
- Existing toaster exclusion only.
- No broad `color-contrast: enabled: false` configuration.

Use the actual theme provider or accessible theme toggle, not a CSS-only test shortcut.

## M2 acceptance criteria

- Storage quota/private-mode tests fail safely and show the M1 warning.
- Two-tab divergence cannot silently overwrite a newer confirmed draft.
- Dirty browser Back and Forward are guarded in a real browser.
- An unlocked service-worker update prompts instead of auto-reloading.
- Light and dark axe contrast scans run with contrast enabled.
- Existing accessibility and navigation tests remain intact.
- No new dependency, service-worker replacement, or production test hook is added.
- No visual snapshot is updated.

## M2 STOP conditions

Stop if:

- A test passes only after disabling an existing assertion or axe rule.
- The two-tab test requires an unapproved merge policy.
- Service-worker coverage requires replacing the generated worker.
- A browser test is flaky because it relies on arbitrary sleeps instead of observable state.
- The dark-mode test reuses the broad contrast-disabled scan.
- Any test fixture contains real patient data.
- A failure-mode test changes clinical behavior beyond the minimum safety warning/guard.

## M2 verification

```sh
npm run check:release
npx tsc --noEmit
npm run lint
npm run test:unit
npm run test:e2e:ci
```

Targeted browser run:

```sh
CI=1 npx playwright test \
  e2e/reliability-failures.spec.ts \
  e2e/accessibility.spec.ts \
  --project=chromium \
  --grep-invert @visual
```

Do not use `--update-snapshots`.

## M2 risks and rollback

Risks:

- Browser storage injection can accidentally block fixture initialization.
- Service-worker update tests can become timing-sensitive.
- Two-tab tests may expose an unresolved product decision rather than a coding defect.
- Dark-mode axe may report a real regression hidden by the broad scan.

Rollback:

- Remove only newly added tests or test helpers if they are proven invalid.
- Keep all existing tests and the M1 production safeguards.
- If a test exposes a product ambiguity, mark the milestone `BLOCKED`; do not weaken the assertion.

---

# Milestone 3 — M3 clinical semantics

## Goal

Prevent inferred dashboard severity from appearing to be clinician-recorded, and make protocol synchronization produce a reviewable clinical diff before protocol changes are accepted.

No clinical stored data or meaning may change in this milestone.

## Ordered steps

### Step 1 — Preflight clinical invariants

Evidence:

- Dashboard inference: `src/features/dashboard/hooks/useDashboardAnalytics.ts:55-73`, `:110-124`.
- Skin-test threshold: `src/features/testing/services/TestingService.ts:67-75`.
- Protocol masterlist ordering contract: `src/shared/data/drugMasterlist.ts:24-32`.
- Ordering tests: `src/shared/data/drugMasterlist.test.ts:14-88`.
- Current protocol diff implementation: `scripts/sync-protocols.mjs:28-172`.

Confirm that the current protocol snapshot and generated masterlist are unchanged before M3. Do not run a network-backed protocol sync.

### Step 2 — Label inferred dashboard grades

Evidence:

- Inference logic: `src/features/dashboard/hooks/useDashboardAnalytics.ts:110-124`.
- Combined distribution title and legend: `src/features/dashboard/components/AnalyticsPanel.tsx:120-153`.
- Dashboard wiring: `src/features/dashboard/components/Dashboard.tsx:223-236`.
- Existing analytics tests: `src/features/dashboard/hooks/useDashboardAnalytics.test.ts:45-186`.

Change presentation only:

1. Keep the existing stored `LogFormData`, patient records, and grade values unchanged.
2. Preserve the existing inference algorithm and counts.
3. Add an explicit derived flag or metadata indicating that current-session severity is inferred.
4. Update the visible distribution heading or adjacent note to state that session-log grades are inferred from outcome/intervention and imported REDCap grades are recorded.
5. Make the same distinction available in the chart’s accessible name.
6. Do not label recorded REDCap grades as inferred.
7. Keep the headline REDCap severity count behavior unchanged.

Add tests that assert:

- A session log produces the inference metadata.
- A REDCap record remains described as recorded.
- The visible dashboard copy includes “inferred” when session logs contribute to the distribution.
- No persisted record or stored schema changes.

### Step 3 — Add a human-readable protocol diff artifact

Evidence:

- Current diff computation: `scripts/sync-protocols.mjs:28-172`.
- Current console-only output: `scripts/sync-protocols.mjs:175-195`.
- Current snapshot write: `scripts/sync-protocols.mjs:260-270`.
- Protocol schema tests: `src/shared/data/__tests__/syncProtocols.test.ts:8-103`.

Add a formatter such as `formatDoseDiffReport(diffs, metadata)` to `scripts/sync-protocols.mjs`.

The generated Markdown artifact must be:

```text
docs/protocol-review/latest-diff.md
```

It must contain:

- Source description.
- Existing and incoming schema versions.
- Generation timestamp.
- Status:
  - `NO CHANGES` when there are no differences.
  - `PENDING CLINICIAN REVIEW` when differences exist.
- Human-readable drug and protocol headings.
- Every detail already produced by `computeDoseLevelDiff`, including:
  - Added/removed drugs.
  - Protocol additions/removals.
  - Label and test-type changes.
  - SPT changes.
  - IDT ratio/concentration/preparation changes.
  - Challenge interval and dose-step changes.
  - Review-note and pharmacy-verification changes.
- A blank sign-off block:

```text
Clinical sign-off:
- Decision: PENDING
- Reviewer:
- Role:
- Reviewed:
- Scope/notes:
```

Keep the existing console output for compatibility, but make the Markdown artifact the review source.

Write the report before writing `protocols.snapshot.json`. If report generation fails, do not write the snapshot or regenerate the masterlist.

Add a `--review-only` option to `parseArgs` and `syncProtocols` if it can be done without changing existing default arguments:

- `--review-only` generates the report and exits before changing snapshot/generated files.
- The normal sync path remains available.
- Document that a clinician must review `latest-diff.md` before generated protocol changes are accepted.

Do not include patient data in the report.

### Step 4 — Document the clinician sign-off workflow

Create:

```text
docs/protocol-review/README.md
```

Document:

1. Run protocol sync against an approved local source.
2. Prefer `--review-only` first.
3. Read `docs/protocol-review/latest-diff.md`.
4. Ask an appropriate clinician to review every changed dose, dilution, preparation, challenge step, and pharmacy-verification flag.
5. Record reviewer name/role/date and decision.
6. Only then accept changes to `src/shared/data/protocols.snapshot.json` and regenerate `src/shared/data/drugMasterlist.generated.ts`.
7. Re-run the protocol ordering, threshold, and full application test suites.
8. Do not treat a console diff or automated test as clinical sign-off.

Do not fabricate a reviewer, approval, date, or clinical decision in the new documentation.

### Step 5 — Test the report formatter and semantic labels

Extend:

- `src/shared/data/__tests__/syncProtocols.test.ts:29-103`
- `src/features/dashboard/hooks/useDashboardAnalytics.test.ts:45-186`
- `src/features/dashboard/components/Dashboard.test.tsx`

Test:

- No-diff report status.
- Pending-review report status.
- Human-readable formatting of all diff categories.
- `--review-only` parsing.
- Inferred-versus-recorded dashboard language.
- Existing protocol ordering and clinical threshold tests.

Do not modify:

- `src/shared/data/protocols.snapshot.json`
- `src/shared/data/drugMasterlist.generated.ts`
- `src/features/testing/services/TestingService.ts`
- Stored report or draft schemas

unless a separate clinician-approved protocol change is explicitly in scope. It is not in this plan.

## M3 acceptance criteria

- Dashboard users can see when session severity is inferred.
- Recorded REDCap grades are not relabeled as inferred.
- Stored clinical data and schemas are unchanged.
- Protocol sync creates `docs/protocol-review/latest-diff.md`.
- A protocol diff is human-readable and includes all computed changes.
- A changed report is explicitly marked `PENDING CLINICIAN REVIEW`.
- `--review-only` creates the report without changing clinical snapshot files.
- `docs/protocol-review/README.md` documents the sign-off process.
- No protocol change is accepted without a documented clinician decision.
- Existing protocol ordering, dilution, threshold, tryptase, and validation tests remain unchanged and passing.

## M3 STOP conditions

Stop if:

- The dashboard changes stored grade values or inference logic.
- A UI label still presents inferred severity as recorded.
- A protocol snapshot or generated masterlist changes without explicit clinician review.
- The diff report omits any dose, dilution, preparation, challenge, or review-note change.
- A report marks a change approved automatically.
- The implementation requires a new backend, network submission, or dependency.
- The protocol source contains a clinical change that cannot be reviewed by an appropriate clinician.

## M3 verification

```sh
npm run check:release
npx tsc --noEmit
npm run lint
npm run test:unit
npm run test:e2e:ci
```

Targeted tests:

```sh
npx vitest run \
  src/shared/data/__tests__/syncProtocols.test.ts \
  src/shared/data/drugMasterlist.test.ts \
  src/features/dashboard/hooks/useDashboardAnalytics.test.ts \
  src/features/dashboard/components/Dashboard.test.tsx
```

Confirm no clinical snapshot changed:

```sh
git diff -- src/shared/data/protocols.snapshot.json src/shared/data/drugMasterlist.generated.ts
```

The command must produce no output for this plan.

## M3 risks and rollback

Risks:

- Combined dashboard counts may require careful wording to avoid implying every grade has the same provenance.
- Protocol reports can become stale if generated artifacts are not reviewed alongside source changes.
- A report formatter can accidentally omit nested IDT or challenge details.

Rollback:

- Revert only dashboard presentation and report-documentation hunks.
- Do not revert or rewrite historical protocol data.
- If provenance cannot be communicated clearly, mark M3 `BLOCKED` rather than changing the inference algorithm.

---

# Milestone 4 — M4 documentation and tooling hygiene

## Goal

Make the current version, local development port, release guard, and developer instructions agree with the actual repository and this Mac Mini.

## Ordered steps

### Step 1 — Audit current documentation claims

Evidence:

- Stale version: `README.md:13-20`.
- Stale development command and port: `README.md:81-103`.
- Stale contribution instructions: `CONTRIBUTING.md:5-25`.
- Stale privacy exception referring to removed research: `CONTRIBUTING.md:27-32`.
- Stale maintainer port: `MAINTAINERS.md:20-24`.
- Current version source: `package.json:4`, `CHANGELOG.md:1`, `src/shared/data/latest-release.json:1-5`.

Run:

```sh
rg -n -i "v0\\.80\\.0|localhost:3000|port 3000|npm run dev|research|supabase|deidentified" \
  README.md CONTRIBUTING.md MAINTAINERS.md
```

Inspect every match before editing. Do not rewrite historical changelog entries or old planning documents.

### Step 2 — Update README, CONTRIBUTING, and MAINTAINERS

Change only current operational guidance:

1. `README.md`
   - Change current version from v0.80.0 to the actual current release source.
   - Use:
     ```sh
     npm run dev -- --port 3002
     ```
   - Use `http://localhost:3002`.
   - Explain that port 3002 is the required local port in this execution environment because 3000 and 3001 are occupied.
   - Add `npm run check:release` to common validation commands.
   - Keep the local-first statement consistent with `CHANGELOG.md:1-15`.
2. `CONTRIBUTING.md`
   - Update setup to use port 3002.
   - Replace the removed research exception with the current rule: normal clinical workflows remain local-first and no clinical data is sent to an application backend.
   - Add `npm run check:release` to expected checks.
3. `MAINTAINERS.md`
   - Update the local development command and URL to port 3002.
   - State that `npm run test:e2e:ci` uses the CI preview port and does not require the local development port.
   - Document the release guard as part of the validation sequence.
   - Do not add claims about deployments or release history that are not already supported.

### Step 3 — Align local Playwright tooling

Evidence:

- Local base URL: `playwright.config.ts:10-12`.
- Local web-server command and port: `playwright.config.ts:33-38`.
- Vite default port: `vite.config.ts:124-126`.

Update `playwright.config.ts` so:

- CI continues using `http://localhost:4173` and `npm run preview`.
- Local mode defaults to port 3002.
- The local server command explicitly passes `--port 3002`.
- An optional environment override such as `DREAM_DEV_PORT` is allowed without changing CI behavior.

Do not change Vite’s production behavior or add a new server.

### Step 4 — Respect the release guard without inventing history

Evidence:

- Build guard: `package.json:8-12`.
- Guard implementation: `scripts/check-release.mjs:34-74`.
- CI release job: `.github/workflows/ci.yml:38-50`.
- Existing release documentation: `CONTRIBUTING.md:46-60`.

Rules:

- Do not change old changelog entries.
- Do not claim that v0.91.0 shipped changes it did not ship.
- Do not use `ALLOW_UNRELEASED=1`.
- Run standalone `npm run check:release`.
- If this work is being prepared for a normal PR into `main`, apply the repository’s existing process: choose the next authorized version, add a matching truthful `CHANGELOG.md` entry with `Summary:`, run `npm run changelog:sync`, and verify with:
  ```sh
  npm run check:release -- --against origin/main
  ```
- If the version has advanced since the plan baseline, preserve the newer version and update documentation from the current source of truth.

## M4 acceptance criteria

- No target documentation says the current version is v0.80.0.
- No target documentation instructs this machine to use port 3000.
- README, CONTRIBUTING, MAINTAINERS, and Playwright agree on port 3002 for local development.
- CI E2E remains on preview port 4173.
- Current local-first privacy wording contains no removed Supabase/research exception.
- Release guard commands are documented and pass without bypassing the guard.
- Historical changelog and planning documents remain unchanged.

## M4 STOP conditions

Stop if:

- The current package version has advanced and its source of truth is unclear.
- Updating the docs would require inventing a release date, codename, or historical claim.
- Port 3002 changes CI or production behavior.
- The release guard fails and the only proposed workaround is `ALLOW_UNRELEASED=1`.
- Documentation still claims that removed research/Supabase functionality exists.
- A deployment or production change is proposed.

## M4 verification

```sh
npm run check:release
npx tsc --noEmit
npm run lint
npm run test:unit
npm run test:e2e:ci
```

Check the documentation claims:

```sh
! rg -n "v0\\.80\\.0|localhost:3000|port 3000" README.md CONTRIBUTING.md MAINTAINERS.md
rg -n "3002|check:release|local-first" README.md CONTRIBUTING.md MAINTAINERS.md playwright.config.ts
```

If manual development inspection is needed:

```sh
npm run dev -- --port 3002
```

## M4 risks and rollback

Risks:

- Documentation may drift again if the version is manually copied into multiple files.
- Changing Playwright local defaults can affect developers who already use port 3000.
- Release-guard enforcement may reveal an unapproved versioning decision.

Rollback:

- Revert only documentation and local Playwright configuration hunks.
- Preserve current release metadata and all historical entries.
- Do not restore port 3000 as the documented machine-local command.
- If the release version is unresolved, mark M4 `BLOCKED` instead of inventing metadata.

---

# Final completion gate

Plan 004 is complete only when:

1. M1 reports confirmed local writes and preserves drafts on failure.
2. M2 covers storage failure, two-tab divergence, dirty Back/Forward, unlocked service-worker update, and dark-mode contrast.
3. M3 labels inferred grades clearly and provides a clinician-reviewable protocol diff workflow.
4. M4 documentation and local tooling use the current version and port 3002.
5. Existing tests remain intact and all new tests strengthen coverage.
6. No clinical stored-data schema, threshold, protocol value/order, tryptase behavior, TTL, PIN behavior, or local-first guarantee changed.
7. No new dependency, cloud service, deployment, or service-worker replacement was added.
8. No visual snapshots were updated to hide a regression.
9. The Plan 004 row in `plans/README.md` is `DONE`, or `BLOCKED` with a one-line reason.
10. The final verification has run:

```sh
npm run check:release
npx tsc --noEmit
npm run lint
npm run test:unit
npm run test:e2e:ci
git diff --check
git status --short
```

The executor must report:

- Selected executor and model.
- Final status-row value.
- Changed files.
- Verification results.
- Any unresolved risks or clinician-review items.
- Confirmation that no commit, push, deploy, install, reset, checkout, restore, or clean operation was performed.