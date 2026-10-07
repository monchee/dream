## [0.91.0] — 2026-10-06 (Less To Protect)

Summary: The optional research database feature is removed. It was never used in clinic, and the whole-project assessment flagged its Supabase configuration — anonymous read/delete on all submissions, with REDCap IDs in the payload — as the product's highest-priority privacy risk. Rather than patching permissions for an unused feature, the feature is gone: the Supabase client, research screens and navigation, submission path, and migration scripts are deleted, and the `@supabase/supabase-js` dependency is dropped. This resolves the long-standing open security issue documented in HANDOVER.md by deletion. Clinical workflows were always local-first and are unaffected; report outputs are now local print, local copy, and email.

### Removed
- **The research database and submission feature.** The Research screen, sidebar entry, `/research` route, "Save to Research Database" action, confirmation dialog, payload builder, Supabase client (`src/lib/supabase.ts`), environment variables, migration scripts, and the `@supabase/supabase-js` dependency are all removed.
- **Supabase from the Content-Security-Policy.** The production and dev CSPs no longer allow connections to `*.supabase.co`, and the Supabase vendor chunk is gone from the build.
- **The research tier from the report screen's risk-graded output actions.** Outputs are now: local print, local copy, and email to the allergy-nurse mailbox — each still stating its data boundary.

### Changed
- **Documentation updated to match reality.** PRODUCT.md no longer lists research submission as a capability; HANDOVER.md marks the Supabase section as removed and the previously open security issue as resolved; README and SECURITY.md now state that no clinical data leaves the device through the application.
- **Operational note:** if a Supabase project was provisioned for this app, it should be paused or deleted from the Supabase dashboard — the repository no longer references it.

### Checked, no change needed
- **Clinical workflows are untouched.** REDCap import, testing, reports, print policy, drafts, and the PIN lock are unchanged; the full unit suite (908 after removing research's own tests), e2e suite, and visual snapshots pass.

## [0.90.1] — 2026-10-06 (The Release Guard)

Summary: Tooling release. Version and changelog bumps are now enforced by CI and the build itself, closing the gap where three shipped merges (this release's own safety pass and redesigns included) went out still carrying the previous version. No application behaviour changed.

### Added
- **A release guard on every pull request.** CI's new `release` job fails a PR into `main` unless `package.json` is bumped relative to `main` and a matching `CHANGELOG.md` entry exists. The `skip-release` label exempts a stacked tooling change.
- **A release guard on every build and deploy.** The `prebuild` hook runs `npm run check:release` before the changelog sync — a version without its changelog entry cannot be built, previewed, or deployed. `ALLOW_UNRELEASED=1` bypasses it for exceptional builds.
- **`npm run check:release`** as a standalone command, with `--against <git-ref>` for the bump comparison.

### Changed
- **CONTRIBUTING.md now documents the enforcement**, not just the checklist: what fails, why, and the two escape hatches (label and environment variable).

## [0.90.0] — 2026-10-06 (A Safer, Quieter Workbench)

Summary: A full safety-and-redesign pass from the 2026-10-05 GPT design audit, executed through plan 003. Every clinical status colour now meets WCAG AA in both themes, every bedside field meets the 44px touch standard, printed clinical sheets follow one monochrome policy with a real multi-page pagination test, and the app's font loads locally so offline clinics get a stable first paint. Four audited redesigns reshape the daily surfaces: a two-speed testing cockpit that leads with recording, a patient identity rail that can never scroll a name off-screen, risk-graded output actions that state where data goes before you click, and a quiet lock station that trades the animated backdrop (introduced across v0.79.x and tuned in v0.79.17) for a flat, fast privacy screen. Clinical protocol values, thresholds, validation rules, draft persistence, PIN semantics, and research payloads are unchanged and covered by new regression tests.

### Added
- **A design token contract test** (62 assertions) locks the status/grade contrast matrix, the monochrome print policy, and the zero-radius/focus baseline of shared primitives, so a future colour or theme change cannot silently drop status text below WCAG AA again.
- **A print pagination e2e test** drives the real testing-plan flow with 90 drugs, emulates A4 print, and asserts rows never split, headers repeat on every page, identity and signature blocks stay whole, animations are off, and the generated PDF really spans multiple pages.
- **Offline behaviour for outbound actions.** When the browser is offline, email and research submission disable themselves with an explanation; local print and copy keep working — matching the local-first promise.
- **A plan-lane summary in the testing cockpit.** The disclosed "Testing plan & drug selection" lane shows a live one-line status (drugs selected, how many have protocol options, total dilution steps) so its state is readable without opening it.

### Changed
- **Status and severity colours meet WCAG AA in both themes.** Every status/grade text combination — on page background, on cards, on its own tinted chips, and as solid badges with theme-aware foregrounds — was recalculated and now clears 4.5:1 (the old light-theme success read 3.29:1 and dark-theme grade badges dropped to 1.61:1). Grade I–IV badges gained semantic foreground tokens instead of fixed white text.
- **Every bedside control meets the 44px touch standard below the desktop breakpoint.** Shared inputs, selects, and switches were enlarged for touch (desktop density preserved at `xl`), and the testing grid's measurement fields, dilution editors, filter fields, and micro-actions follow suit — no more 28px fields with a gloved hand.
- **The testing screen is now a two-speed cockpit.** Reference controls and the wheal/flare measurement grid lead; protocol switching, custom concentrations, dilution steps, and notes moved into a disclosed plan lane that sits after the section's actions. The lane opens itself when nothing is selected, collapses on the first selection, re-opens for an unconfigured custom drug, yields to manual control, and keeps its state while you move between workflow sections.
- **Patient identity is a fixed rail, not a scrolling sentence.** Family name, given name, REDCap ID, and DOB are permanently visible together on every screen size — they wrap, never truncate, and never scroll horizontally (previously a long name could push identity off-screen: a wrong-patient risk). Secondary dates live in the Details disclosure, visit dates are now redacted with the rest, and the phone top bar gives the page title its own wrapping row.
- **Output actions are risk-graded by data boundary.** Local print and copy lead; email states its destination on the control and actually addresses the message to the displayed allergy-nurse mailbox (it previously opened a blank-recipient draft); research submission states that only the de-identified payload is transmitted. All three keep their confirmation dialogs, and keyboard focus returns to the triggering control when the dialog closes — including when a successful submission replaces the button mid-flight.
- **The lock station is quiet.** The animated blurred light fields, drifting hairline grid, wrong-PIN glow pulse, and unlock convergence effect (introduced in v0.79.x and tuned in v0.79.17) are removed in favour of a flat masthead, a high-contrast rectangular PIN module, and a non-motion error state. First paint is lighter and reduced-motion users get a fully static screen. The PIN itself, its validation, and session storage are byte-for-byte unchanged, with its by-design privacy documentation strengthened in code.
- **The identity landmark is named for its job.** The context bar's accessible name is now "Active patient identity", and the research detail table headers carry proper column scopes.
- **Public Sans is self-hosted.** The variable WOFF2 files ship from the app origin (SIL OFL licensed), the Google Fonts requests and CSP allowances are gone, and a font contract test keeps it that way — no more font swap while patient data is on screen in a procedure room.
- **Print documents follow one monochrome policy.** Semantic print tokens (`--print-*`) and shared classes replaced the raw slate/red/blue classes across all four clinical documents, the protocol table may flow across pages while its rows and signatures cannot, and the A4 margins, orphans/widows, and print animation suppression are unchanged.

### Fixed
- **Visit dates leaked past redaction.** The identity rail's Details disclosure showed the visit date in clear even when redaction was active; it now follows the same redaction as every other field.
- **Printed clinical rows could split across pages.** The testing protocol table explicitly opted into `break-inside: auto` at the row level; rows are now protected by contract and verified by the pagination test.
- **Keyboard focus fell to the document after outbound dialogs closed.** The confirmation dialog now restores focus to the triggering control — or to the research status banner when a successful submission replaced it.
- **Seven oversized components were split along clinical responsibilities** (the 882-line testing plan generator alone became six focused files), unused compatibility code was removed, shared print and compact-control primitives were extracted, and behavior was verified unchanged by the visual snapshot suites (desktop snapshots byte-identical; the two mobile snapshots changed only by the intended identity-rail title row).

### Checked, no change needed
- **Clinical meaning is untouched.** Protocol values and ordering, the 3mm positive threshold, validation rules, draft persistence keys and TTLs, research payload fields, PIN value and storage, and outbound confirmation flows are unchanged and pinned by new regression tests.
- **Design-system conformance.** Zero radius, semantic tokens, and visible focus are asserted by the token contract; the impeccable design detector reports zero non-advisory findings on all changed files; the axe accessibility suite (30/30) passes on the redesigned surfaces.

## [0.80.0] — 2026-08-31 (One Coherent Workbench)

Summary: A whole-project incumbent-system polish pass across the clinical workbench. Strengthens touch and keyboard access at sub-desktop sizes, makes clinical measurement and collapsible controls explicit to assistive technology, removes a surname from the active-report banner, and keeps reduced-motion scrolling calm. Clinical copy, protocol values and order, storage, research payloads, PIN semantics, outbound confirmation, and infrastructure are unchanged.

### Changed
- **Shared touch targets now follow the workbench breakpoint.** Shared buttons are at least 44px high below `xl`, while the persistent desktop rail keeps its compact clinical density. Patient selection, worklist controls, report tabs, redaction, research rows, context details, and other below-desktop actions inherit the same touch-safe floor.
- **Clinical controls expose their state and purpose.** The testing-plan builder is keyboard-toggleable with expanded-content relationships, Nursing Notes exposes expanded state, patient selection returns focus to its trigger and identifies its listbox relationship, and every skin-test wheal field has an explicit measurement name.
- **The active-report banner is privacy safer.** It now shows first and last initials rather than the patient's surname. Wrong-patient and outbound confirmation dialogs remain explicit and identified so a clinician can verify the bound record before acting.
- **Reduced motion includes anchor navigation.** `prefers-reduced-motion: reduce` now disables the global smooth-scroll behavior as well as the existing authored animations.
- **Warning presentation stays within the icon system.** The testing-plan protocol review indicator uses the existing Lucide warning icon and the same readable “Review required” copy instead of a standalone glyph.

### Checked, no change needed
- **The existing PatientTable, SkinTestBreakdown, PatientHistory, and ResearchDashboard work remains integrated.** Their tracked changes were preserved and tested alongside this pass.
- **Clinical meaning and persistence contracts were not altered.** No protocol values or ordering, schemas, identifiers, storage keys, research payload fields, PIN behavior, outbound privacy checks, dependencies, backend, migrations, generated media, or infrastructure changed.

## [0.79.17] — 2026-08-20 (A Background That Breathes)

Summary: A tuning pass on the PIN gate's idle ambient background, requested after it read as barely perceptible in both themes. The ambient light fields only ever animated position — their color intensity was completely static — which is a large part of why they didn't register as "alive" even on a longer look. No component logic, markup, or the earlier state-feedback animations (wrong-PIN pulse, unlock convergence) changed.

### Changed
- **Ambient blob color intensity roughly doubled.** Gradient stop alphas increased in both themes (light: 0.22→0.38 / 0.14→0.24 and 0.18→0.32 / 0.12→0.20; dark mode matched proportionally), with blur reduced from 60px to 48px so the added color reads as a defined glow rather than an even softer wash.
- **The blobs now genuinely breathe.** Added an opacity keyframe (0.85 → 1.0 → 0.9) to the existing position-drift animation, so color intensity itself animates across each cycle instead of only position. Verified live: opacity sampled at 0.85, 0.90, and ~1.0 across a 12-second window, confirming real motion rather than a static value.
- **The architectural hairline grid bumped more modestly** (0.28→0.34 base, pulse range 0.24-0.34→0.30-0.42) — kept as the restrained secondary texture, with the ambient blobs carrying most of the increased presence.

### Checked, no change needed
- **Reduced motion.** Confirmed live rather than assumed from reading the media query: under `prefers-reduced-motion: reduce`, computed `animationName` is `none` and opacity is forced to `1` on both the blobs and the grid — the new breathing keyframe is fully disabled, same as the existing drift animation it was added to.
- **The wrong-PIN and unlock-convergence one-shot animations** (`lock-alert-pulse`, `lock-converge`) are untouched — this pass only tunes the idle/resting state.

## [0.79.16] — 2026-08-20 (One Line, Four Fields)

Summary: A bug fix on the `/testing` direct-entry route's "Patient Identity" card, reported with a screenshot. The Date of Birth input rendered visibly lower than MRN, First Name, and Last Name, and the MRN placeholder text was clipped mid-word. No validation logic, ids, or copy changed beyond the one placeholder string below.

### Fixed
- **Date of Birth input sat 16px lower than its siblings.** Its label — "Date of Birth (Optional)" — wraps to two lines at the column widths used in both the 4-column desktop grid and the 2-column tablet grid, while MRN/First Name/Last Name stay single-line. Since each field lays out its own label-then-input stack independently, the taller label pushed its input down with nothing to keep the row aligned. Measured before: label heights 14px vs 30px, input tops 314px vs 330px at 1440px. All four labels now reserve identical space (`min-h-[2rem]`, text bottom-anchored against it) regardless of whether their own text wraps, so every input starts at the same y-position in the 1-column, 2-column, and 4-column layouts alike. Measured after: all four inputs at `inputTop: 332` at desktop; the 2-column tablet arrangement pairs correctly row by row too.
- **MRN placeholder text was clipped.** `"Medical Record Number..."` (25 characters) in a monospace font inside a ~180px grid column rendered as roughly `"Medical Record Numl"` with the rest invisible. Shortened to `"Record number..."` (17 characters), which fits cleanly without touching the column width or the deliberate `font-mono` styling used for the typed value.

### Checked, no change needed
- **Accessibility.** The dedicated `direct-entry` e2e spec (4/4) and the full accessibility suite (31/31) both pass — the label markup changed shape (each label's text now sits inside an inner `<span>`) but every `id`, `htmlFor`, and `aria-*` association is unchanged.
- **Dark mode and mobile.** Verified visually at 1440px, 700px (2-column), 390px (1-column stacked), and dark mode — alignment holds in every arrangement, not just the one in the reported screenshot.

## [0.79.15] — 2026-08-20 (Solid, Slim, Self-Clearing)

Summary: A polish pass on the "Demo System" disclaimer banner shown above real content until dismissed. It was translucent, sized for a 44px touch target on every viewport including desktop, and stayed on screen indefinitely. No copy, props, or dismiss-persistence logic changed.

### Changed
- **Opaque background.** `bg-status-warning/15` (a 15%-opacity tint) is now solid `bg-status-warning`, paired with `text-status-warning-foreground` — the same token pairing this app already uses for solid warning surfaces elsewhere, not a new color. Verified by computed style, not by eye: light mode renders `rgb(206,132,8)` background; dark mode `rgb(243,184,22)` background against `rgb(26,26,26)` text, ~10.8:1 contrast.
- **Slimmer on desktop.** Banner height dropped from ~60px to 41px at desktop widths. The dismiss button — which was the actual height bottleneck, since a flex row's height follows its tallest child — shrinks to 28×28 at the `xl:` breakpoint and above, reusing the same desktop-is-mouse-only reasoning already shipped for the sidebar in v0.79.14. Mobile and tablet keep the full 44×44 touch target unchanged (measured live: 67px tall, 44×44 button at 390px).
- **Auto-dismisses after 10 seconds**, calling the same `onClose` the manual dismiss button already uses, so it persists identically and won't reappear. Pauses on hover or keyboard focus and restarts a fresh 10-second window on disengagement, per WCAG 2.2 SC 2.2.1 (Timing Adjustable) — a bare unpausable timer would be a real accessibility regression for anyone who takes longer than 10s to read or act on it. Verified with real timers: present at idle, gone within ~10-12s; held continuously present across an 11s hover; cleared shortly after the pointer moved away.

### Checked, no change needed
- **`TTLExpiryBanner.tsx`**, a near-identical sibling component, was deliberately left on the old translucent treatment. The two banners now visually diverge if shown back to back — whether to bring it in line is a follow-up decision, not made here.

## [0.79.14] — 2026-08-20 (Room to Breathe, Room to Grow)

Summary: A polish pass on the desktop sidebar. It shares its nav content with the mobile drawer through one component keyed by a `variant` prop, and every row in both variants was hard-coded to the same 44px touch-target height — including on the sidebar, which is `hidden xl:flex` and never rendered on a touch device. At 1280×800, a standard laptop and the exact viewport this repo's own visual-regression suite uses, the nav list overflowed by 12px and clipped the footer. No navigation logic, copy, or drawer behaviour changed.

### Fixed
- **The sidebar overflowed at 1280×800 and clipped its own footer.** 9 nav rows plus 2 action buttons at 44px, with three 24px section gaps, totalled 715px against 703px of available height. Rows in the sidebar variant only are now 38px — WCAG 2.2 AA's target-size minimum is 24×24px, and 44px is specifically the comfortable-touch figure this codebase already reserves correctly for the drawer, the only touch surface below `xl`. Section gaps tightened from 24px to 16px on the sidebar variant. Nav content height dropped from 715px to 601px, leaving 102px of genuine slack rather than a marginal fit.
- **The drawer variant is untouched.** Its rows stay 44px; a new test guards this explicitly so a future edit can't silently regress the one touch surface in the app below 1280px.

### Checked, no change needed
- **The delete-testing-draft icon button** keeps its 44px tap target in both variants — it's a precision icon-only control, not a text nav row, and stayed out of scope even inside the sidebar branch.
- **The brand lockup row** in the sidebar header was left at its existing size after visual comparison; it reads as a distinct header anchor rather than a nav row, and tightening it did not clearly improve the result.
- **Accessibility.** All 31 accessibility e2e checks pass. The two sidebar visual-regression baselines were re-recorded to reflect the intentional layout change; the two topbar baselines are unchanged.

## [0.79.13] — 2026-08-20 (The Padding That Wasn't There)

Summary: A polish pass on the PIN gate, the first surface anyone meets and one they hit many times a day on a shared terminal. Turned up a padding bug that is invisible in code review, 134px of dead space in the branding rail, and an 18px layout jolt on every mistyped PIN. No behaviour, copy, or PIN logic changes.

### Fixed
- **`p-0` was silently failing to remove the Card's padding.** The PIN module was wrapped in `<Card className="border-0 bg-transparent p-0">` — a wrapper that neutralises everything the Card provides. It leaked padding anyway: measured `0px` at 390px but **20px at 700px and 24px at 1024px+**, with `CardHeader`'s intended 24px bottom gap silently becoming 20px. The cause is that `tailwind-merge` treats `p-0` and `sm:p-5` / `lg:p-6` as separate keys — an unmodified utility never conflicts with a modified one — so `p-0` only ever cancelled the base `p-4`. The module was inset from where the markup said it was, by a different amount at each breakpoint. Removed the no-op wrapper entirely so the pane's own `p-6 sm:p-8 lg:p-10` is the single source of inset; the heading and the PIN row now share one left edge at every width.
- **134px of dead space in the branding rail.** The rail stretches to match the taller PIN pane, and with `justify-between` across two children all the slack pooled into one hole — 31% of the rail's height, bracketed by two rules so the emptiness was explicit. The branding block is now centred with the attribution pinned to the bottom, and the separator that divided nothing is gone. Residual gap is 53px and reads as centring.
- **The frame jumped 18px on every wrong PIN.** The status row mounted only when an error existed, so the whole centred card moved each time. The row's height is now reserved; measured shift is 0px.
- **Duplicate `tracking-widest`** on the wordmark, already supplied by `.app-wordmark`, and a `flex flex-col gap-2` wrapper around a single child.

### Changed
- **"Screen Lock" is now a real `<h2>`.** It was a `CardTitle`, which renders a generic element; removing the Card wrapper let it become a proper heading under the `DREAM` `h1`.

### Checked, no change needed
- **PIN cell sizing.** Widening the four cells to fill the pane was tried and reverted: at the real pane width they rendered 101×56, reading as four blank text fields rather than a 4-digit code. Restored to 56×56 squares — the tight, square group is the clearer affordance, and the ragged right edge beneath a full-width button is a measurement, not a defect anyone perceives.
- **Accessibility.** All 31 accessibility e2e checks pass, four of which target this gate directly. Every `aria-label`, `aria-describedby`, `aria-invalid`, `role`, and the `pin-instructions` / `pin-status` id relationships are preserved, as are the reduced-motion paths.

## [0.79.12] — 2026-08-20 (Micrograms, Not Milligrams)

Summary: A design polish pass on the Reaction History card that turned up a clinical units defect. The card was also rendering with roughly half its right-hand column empty, and had accumulated enough local drift — nested shadows, four different panel backgrounds, three shades of "secondary text" — that nothing on it carried visual hierarchy. No behaviour, data, or clinical logic changes.

### Fixed
- **Serum tryptase was displaying as "mg/L" when the value is in μg/L.** The header text is written `Result (μg/L)`, but `text-transform: uppercase` maps Greek small mu (U+03BC) to Greek capital Mu (U+039C) — a glyph visually identical to a Latin "M" — so the rendered header read `RESULT (MG/L)`. Tryptase reference range is roughly 0–11 μg/L, making this a 1000× unit misstatement on a clinical record. The unit is now excluded from the uppercase transform in both the Reaction History table and the Tryptase entry section, which carried the identical bug.
- **The card rendered with ~384px of dead space.** At 1440px with a populated patient the left column measured 784px against the right column's 400px, leaving the right side half empty. Rebalanced by relocating content rather than stretching containers: Serum Tryptase now sits under the timeline (T1/T2/T3 are timestamped serial measurements, so they belong with the chronology rather than among the narrative text blocks), and the Referring Doctor / Hospital bar became a full-width footer, since referral provenance is the lowest-priority content on the card. Columns now measure 543 / 511. Mobile reading order improved as a side effect — tryptase follows the timeline instead of preceding it.

### Changed
- **Nested shadows removed.** Seven `shadow-sm` instances sat inside a card that is already `elevation="raised"`, contradicting the Flat-By-Default Rule established in v0.79.10.
- **One panel treatment instead of four.** The card mixed `bg-background` (×7), `bg-card` (×6), `bg-muted` (×6) and four muted alpha variants. Content panels now use one recessed treatment and internal chrome strips one muted fill. This also fixes Additional Comments and Differential Diagnosis, which used `bg-card` — the same colour as the card behind them — and so rendered as fill-less outlines.
- **Secondary text uses real tokens.** Ten `text-foreground/70|80|90` alpha overrides produced three near-identical greys where the system defines exactly two roles; each now resolves to `text-foreground` or `text-muted-foreground`.
- **Icon sizing collapsed from five sizes to two**, including an 8px phone icon that was effectively invisible.
- **Decorative italics removed** from four sites — italic body text at `text-xs` costs legibility in a clinical UI, and the v0.79.10 pass had already removed ad-hoc italics elsewhere.
- **Header row tidied.** The date and procedure now share a type size and read as peers, and the divider is a 1px rule rather than a literal `|` glyph set at `text-xl` with a stray alpha.

### Checked, no change needed
- **Accessibility.** All 31 accessibility e2e checks pass, run specifically because the refactor touched heading structure, labels, and table semantics. Every `aria-label`, `aria-pressed`, `aria-labelledby`, `scope`, and `data-state` relationship is preserved.
- **Unit-label legibility tradeoff.** The tryptase unit now renders in normal case beside an uppercase label, which is marginally less uniform than the sibling column headers. Kept deliberately: correctness of a clinical unit outranks header typography.

## [0.79.11] — 2026-08-19 (A Background With a Job)

Summary: The PIN gate's ambient background — two drifting light blobs and a hairline architectural grid — was pure decoration with no connection to what the screen actually does. Gives it two authored, state-tied moments instead: a brief warning-tinted pulse on a wrong PIN, and a chrome-accent convergence glow on a correct one, both built on the existing `error`/`isExiting` state with no new logic.

### Added
- **Wrong-PIN background acknowledgment.** A one-shot `--destructive`-tinted glow (`lock-alert-pulse`, 0.6s) sweeps the ambient light fields on an incorrect entry and fully resolves back to idle — peripheral-vision feedback for a screen checked dozens of times a day on shared clinic terminals, on top of the existing input-field and alert-text feedback.
- **Correct-PIN convergence.** A one-shot `--masthead-accent` brighten and slight scale (`lock-converge`, 0.28s) plays across both ambient blobs and the hairline grid on a correct PIN, timed to finish inside the existing 300ms exit fade rather than fight it.

### Fixed
- **First implementation pass used `drop-shadow()`, which was invisible.** `drop-shadow()` derives its shape from the source element's own alpha channel; on a blurred, edge-fading radial-gradient blob that alpha is too diffuse to cast a visible shadow, so the first cut of the alert pulse computed correctly but rendered as nothing. Switched to `box-shadow`, which paints from box geometry instead — now clearly visible in both themes.

### Checked, no change needed
- **Reduced motion.** Both new classes keep their colour/glow acknowledgment under `prefers-reduced-motion: reduce` while dropping all spatial movement (`transform: none`), verified via computed-style inspection rather than assuming the media query alone was enough.
- **Convergence visibility.** The brighten/scale effect is real but largely masked by the pre-existing whole-page exit fade, which is already substantial within ~60ms. Left as-is rather than inflating the glow — the page-wide fade already delivers an unambiguous "unlocked" signal, and enlarging it further would read as a flash, not a restrained accent.

## [0.79.10] — 2026-08-19 (Primitives That Stop Fighting Back)

Summary: A full UI/UX polish pass with no functional change. The shared Card/Button primitives shipped defaults nobody wanted — a Tailwind shadow and a `pt-0` — so every call site overrode them, and the overrides disagreed with each other three ways. The same drift had reached typography (`h3` shipped at four different sizes), empty states (ten hand-rolled variants) and colour (raw palette utilities on-screen). This makes the primitives express the documented system so call sites stop fighting them, consolidates seven copy-pasted patterns into shared components, and reconciles DESIGN.md with what actually ships.

### Added
- **Shared state components** (`src/shared/components/states/`). `EmptyState` and `TableEmptyRow` replace ~10 divergent empty states that variously used `py-4`/`py-8`/`py-10`, italics, and three different icon treatments. `LoadingState` finally gives `components/ui/loading-spinner.tsx` a caller — it had been dead code with zero usages while `ScreenLayout` hand-rolled its own Suspense spinner. `ErrorState` is the shared shell behind `ErrorBoundary`, `ChunkErrorBoundary` and `ScreenUnavailable`, which were three independent centred-card layouts.
- **`StatTile`** (`src/shared/components/StatTile.tsx`) replaces 8 duplicated metric tiles across `ResearchDashboard` and `AnalyticsPanel` that disagreed on padding (`p-4` vs `p-3`), value size, and elevation.
- **`ChromeStatusBadge` and `ThemeToggleButton`** (`src/core/components/navigation/`) replace 6 hand-written status badges and 3 verbatim theme-toggle copies in `AppTopBar`. Both emit byte-identical class strings — the committed screenshot baselines pass unchanged.
- **Named heading utilities** — `.heading-page`, `.heading-section`, `.heading-subsection`, each carrying a deliberate `mb-0` so they compose inside `flex`/`gap` and `space-y` layouts without doubling margins.

### Changed
- **Surfaces are flat by default, as DESIGN.md always claimed.** `Card` no longer emits a shadow; raised surfaces opt in via `<Card elevation="raised">`. `Button`'s `default`/`destructive`/`outline`/`secondary` variants lost their resting shadows. This removes 11 `shadow-none` overrides and settles the `shadow-sm`-vs-`shadow-md` disagreement. `CardHeader` gained a `bordered` prop for the pattern 17 of 18 call sites hand-wrote; `CardContent` dropped the `pt-0` that 21 sites were adding back.
- **One typographic hierarchy.** The base ramp was overridden 48 times, so heading level carried no consistent visual meaning. Retargeted to a monotonic dense scale (h1 `text-2xl` → h4 `text-base`) with a single uniform `mb-2`, replacing four different responsive margin recipes.
- **Spacing normalised to the documented 4/8/16/24/32 rhythm.** `gap-2.5`/`gap-3.5`/`space-y-5`/`space-y-10`/`space-y-0.5` folded onto the baseline. The dense navigation chrome and the PIN entry grid deliberately keep their tighter tuned rhythm.
- **All remaining on-screen raw palette utilities are now semantic tokens.** The testing-draft banner uses `--status-warning`, the urgent label and error icon `--status-danger`, the nurse-note callouts `--status-info`. Print-scoped `print:` colours are untouched, as the Print Typography Exception Rule allows. With those gone, the dark-mode hardcoded-colour safety net shrank from 13 rules to the 5 that still cover live print-scoped classes.
- **DESIGN.md reconciled** — real type ramp, flat-by-default elevation vocabulary, and a new Shared UI Patterns section so the next contributor composes instead of copy-pasting.

### Fixed
- **The changelog page no longer scrolls sideways.** A `flex-1` column with the default `min-width: auto` could not shrink below its content, so long backticked file paths in release notes pushed the page to 1719px inside a 1280px viewport — at every viewport width and every font scale. Now `flex-1 min-w-0` with `break-words` on the text, and the version-header row (version, codename, date, "Latest" badge) wraps on mobile instead of running off the edge at 125% scale. Both pre-existing, neither introduced here; caught by a 180-combination sweep across 10 routes × light/dark × 85/100/125% font scale × 390/768/1280px, which now passes clean.
- **Heading colour was dead CSS.** The base rule used `text-[var(--primary)]`, which emits `color: var(--primary)` while `--primary` holds a bare HSL triplet — invalid, so browsers dropped it and headings silently inherited. Now a real `text-foreground`.
- **Tap targets meet the documented 44px floor.** Three stray `min-h-[40px]` controls raised; 50 controls now at `min-h-[44px]`, zero below.

### Checked, no change needed
- **Dashboard and AdvancedSearchFilters responsive behaviour** — both already reflow correctly via `flex-wrap` and `grid-cols-3`; no page-level overflow at 390/768/1280px. No speculative breakpoints added.
- **Print output** — all three report views render at A4 width (794px) with no overflow and no `.no-print` leakage; the Phase 5 token swaps did not reach the print stylesheets.

## [0.79.9] — 2026-08-19 (Desktop Sidebar Identity Rail)

Summary: Moves the SCRATCH red identity edge to the desktop navigation sidebar boundary while keeping the top bar and standalone headers on clean neutral dividers, and retains the red identity edge on the PIN gate lock-station frame.

### Changed
- **SCRATCH red identity edge relocated to desktop sidebar.** The restrained 3px red identity edge (`--masthead-edge`) now anchors the desktop application sidebar (`border-r-[3px] border-r-masthead-edge`) at the sidebar/content boundary, establishing clinical application branding without visual noise.
- **Top navigation and standalone headers use neutral dividers.** The outer application header and standalone screen headers now use clean neutral dividers (`border-b border-border` on outer header, `border-b border-masthead-border` on mobile/tablet identity rows) rather than red edges.
- **Retained PIN gate lock-station edge.** The central lock-station frame on the PIN gate screen continues to carry the 3px red identity accent (`border-b-[3px] border-b-masthead-edge`).

## [0.79.8] — 2026-08-19 (Actually Deleted This Time)

Summary: Closes a gap the v0.79.7 sourcemap fix didn't fully cover — this project has no CI/CD pipeline, so `npm run deploy` run locally (the only deploy path that exists) doesn't have `SENTRY_AUTH_TOKEN` set unless the person deploying has it in their shell, meaning the Sentry-upload-triggered deletion never ran and source maps were still shipping to production.

### Fixed
- **Source maps are stripped from `dist/` before every deploy, unconditionally.** `deploy` and `deploy:preview` now run `find dist -name '*.map' -delete` after the build and before the Cloudflare Pages upload — independent of whether Sentry's upload step ran. If it did, this is a no-op (already deleted); if it didn't (no token in the deploying shell), this is what actually closes the gap.

## [0.79.7] — 2026-08-19 (Review Follow-Through)

Summary: Fixes 3 should-fix findings from an independent review of the whole v0.78.6→v0.79.6 hardening pass (Phases 0-8). The review's verdict was "safe to deploy, zero blockers" — these close real but non-blocking gaps before shipping.

### Fixed
- **Source maps are now actually deleted from the public bundle after Sentry upload.** `sourcemap: 'hidden'` (v0.79.2) only removed the `sourceMappingURL` comment — the 34 `.map` files (7 MB) were still shipping to `dist/` and served at guessable URLs. `sentryVitePlugin` now deletes them (`filesToDeleteAfterUpload`) once Sentry has what it needs.
- **CSP `connect-src` now allows the Google Fonts domains the service worker fetches.** The now-enforcing CSP (v0.79.2) allowed Google Fonts under `style-src`/`font-src` for the page's own font loading, but not `connect-src` — and the PWA's Workbox `runtimeCaching` fetches those same domains from inside the service worker, which is evaluated against `connect-src`. Uncaught, this would have silently degraded to system fonts on cache misses in production.
- **Error boundary now always shows a support-friendly error ID.** Gating the full stack trace behind dev-mode (v0.79.1) left the "contact IT support with the error details below" instruction pointing at nothing in production. A short error ID is now generated on every crash, shown regardless of environment, and included in the Sentry report — the full message/stack stays dev-only.

## [0.79.6] — 2026-08-19 (No More Sideways Scrolling)

Summary: Final phase of the current hardening pass — fixes the one confirmed responsive gap in the Dashboard, and closes out with two other items checked live and found already sound.

### Fixed
- **Skin test breakdown table no longer forces horizontal scroll on phones.** `SkinTestBreakdown`'s table had a hard `min-w-[760px]` floor against a `md:` (768px) breakpoint just 8px above it — every phone hit the scroll. Now uses the same dual-render pattern already established by `PatientTable`: the table stays desktop-only (`hidden md:block`), and phones get a stacked category-accordion card list showing the identical data (SPT / IDT 1:100 / IDT 1:10 / IDT Neat / Challenge / Total per drug) — verified live in a real rendered browser at 390px width.

### Checked, no change needed
- **768–1279px tablet band** (iPad landscape gets the nav drawer, not the sidebar) — verified live at 1024×768, renders cleanly.
- **Large-monitor layout above 1536px** — verified with exact bounding-box measurements at 2560×1440: the content area is genuinely centered within the space available after the fixed sidebar (not lopsided as it first appeared), a deliberate readable-width constraint rather than a bug.

## [0.79.5] — 2026-08-19 (Sections That Can't Cross-Write)

Summary: Narrows three testing-form sections' write access from the entire clinical record down to only the field each one actually owns — encoding "the tryptase section cannot write the challenge panel" as a type-system guarantee instead of a convention.

### Changed
- **`TryptaseSection`, `NurseNotesSection`, `DrugTestPanelSection`** no longer receive the raw `setFormData` dispatcher for the whole form. Each now takes only its own data slice (`tryptase`, `nurseNotes`) plus a scoped `onChange`/`onClearPanel` callback owned by `TestingLogForm`. The other four sections in this form already worked this way — this closes the gap on the three that didn't. Purely a prop-narrowing refactor: every interaction (toggling tryptase obtained/significant-elevation, editing sample values, editing nurse notes, clearing the drug panel) behaves identically to before.

## [0.79.4] — 2026-08-19 (Testable Test Panel)

Summary: Extracts the domain logic that builds a testing session's drug panel out of `App.tsx` and into a pure, directly-unit-tested function — no behaviour change, just moving untested logic out of a routing component.

### Changed
- **`buildTestPanelFromPlan` extracted.** `App.tsx`'s `handleProceedToTesting` built the entire test panel inline — protocol lookup, IDT step arrays, custom-drug mapping, and the challenge-drug-from-custom-drug branch — with zero direct test coverage. That logic now lives in `src/features/testing/utils/buildTestPanelFromPlan.ts` as a pure function (plan in, panel out — no React state), with 17 new unit tests covering standard drugs, custom drugs, protocol-index edge cases, and the multi-custom-drug "first one wins" challenge selection. `App.tsx` now just calls it.

## [0.79.3] — 2026-08-19 (Regression Net, Widened)

Summary: Adds unit test coverage for 12 previously-untested files with real clinical/data consequences — skin-test grading, PHI de-identification for audit export, and all 4 clinical report renderers. Purely additive; zero existing test or source file touched.

### Added
- **87 new tests, 686 total.** New coverage for `gradingUtils` (skin-test grade classification), `testingPlanFormatter`, `auditExporter` (PHI de-identification and audit-ID generation for exports — the highest-stakes gap per the plan), `timelineUtils`, `dateUtils`, `patientRepository` (search/filter/sort), and the `useDashboardAnalytics`/`useAdvancedSearch` hooks.
- **Report renderer coverage.** `ClinicalReport`, `PatientHandout`, `PowerchartLetter`, and `ReportPrintIdentity` — previously only the print-safety wrapper was tested, not the renderers a clinician actually reads (positive/negative outcomes, cross-sensitization warnings, tolerated-drug badges).
- **Unit-level accessibility matcher.** `axe-core` was already wired into 7 e2e scans but had no unit-level equivalent. New `src/test/helpers/axe.ts` runs axe-core directly under Vitest+JSDOM (no new dependency), used across the new report-renderer tests. `color-contrast` is disabled to match the existing e2e scan config — JSDOM can't resolve this app's `hsl(var(--token))` custom properties, a documented pre-existing limitation, not a new one.

## [0.79.2] — 2026-08-19 (Lean and Locked Down)

Summary: Performance and hardening pass on the production bundle and headers — smaller eager JS, no publicly-discoverable source maps, and the CSP finally enforcing instead of report-only.

### Changed
- **113 KB lighter cold load.** `GetStartedModal` only ever needs the newest release's version/codename, but was statically importing the full changelog (113 KB, the entire release history back to v0.1) on every cold load. `scripts/generate-changelog.mjs` now also emits a small `src/shared/data/latest-release.json` sibling, and the modal reads from that instead. The main `index` chunk drops from ~422 KB to ~324 KB raw (~115 KB to ~82 KB gzip); the full changelog now loads as its own chunk only when the Changelog/Technical Documentation pages are actually visited.
- **Source maps no longer publicly discoverable.** Production builds set `sourcemap: 'hidden'` instead of `true` — Sentry's build-time upload still gets full symbolication, but shipped JS no longer carries a `sourceMappingURL` comment pointing at readable source.
- **CSP is enforcing, not report-only.** `public/_headers` flips `Content-Security-Policy-Report-Only` to `Content-Security-Policy` with the exact same policy value (already measured strict-and-correct) — violations are now actually blocked, not just logged.
- **Sentry trace volume reduced.** `tracesSampleRate` drops from 100% to 10% of transactions. Session replay sampling (`replaysSessionSampleRate`) is untouched — that's a PHI-app policy decision reserved for the product owner, not a performance tuning knob.
- **Fixed stale Sentry sourcemap-upload config.** `vite.config.ts`'s `sentryVitePlugin` had placeholder `org: 'your-org'` / `project: 'anaesthetic-clinic'` (the latter predates the 2026-08-17 repo rename to `dream`) — now `org: 'monchee'`, `project: 'dream'`.

## [0.79.1] — 2026-08-19 (Degrade Gracefully)

Summary: Defensive-only hardening — every change here adds a fallback for a scenario the app didn't handle before (storage-blocked browsers, a failed chunk load, a stale deployment), none of it changes normal-path behaviour.

### Fixed
- **Storage-blocked browsers no longer crash the app.** `FontSizeProvider` and `ThemeProvider` read/write `localStorage` directly with no guard — in Safari private mode or a storage-blocked iframe this threw during render, and since both sit inside the app's top-level `ErrorBoundary`, the result was the full-screen error page instead of a degraded-but-working app. Both are now wrapped in try/catch with sane in-memory fallbacks; `FontSizeProvider` also validates the parsed value (a corrupt stored value no longer produces `font-size: NaN%`).
- **A failed patient-data chunk load no longer hangs forever.** `usePatientState`'s dynamic `import()` of the mock patient dataset had no `.catch` — a chunk-load failure left the loading skeleton showing permanently. It now clears the loading state and logs a warning on rejection, matching the pattern already used elsewhere in the codebase.
- **Raw stack traces no longer render in production.** The top-level `ErrorBoundary`'s on-page error details unconditionally included `error.stack` — an information-disclosure surface. Now gated behind `import.meta.env.DEV`; console logging (for Sentry/support) is unchanged.

### Added
- **Scoped chunk-load error boundary.** A failed dynamic `import()` (stale chunk after a deploy, flaky hospital wifi) previously unmounted the entire app via the top-level boundary, with no retry. A new `ChunkErrorBoundary` wraps just the two `Suspense` boundaries around lazy-loaded route/screen chunks (`App.tsx`, `ScreenLayout.tsx`) and offers Retry / Reload affordances without touching the top-level boundary's deliberate all-or-nothing clinical-data-safety behaviour.

## [0.79.0] — 2026-08-19 (One Layout Chrome)

Summary: Collapses the app's duplicated screen-layout prop type into one canonical `ScreenChrome` object, passed as a named `chrome={}` prop rather than spread — closing the exact hole that let a live prop-shadowing bug slip in undetected. This is the main structural fix in the current hardening pass; everything from here builds on it.

### Fixed
- **Prop-shadowing bug eliminated by construction.** `LogScreen.tsx` was setting `isTestingDraftDirty`, `hasActiveReport`, and `onOpenGetStarted` explicitly on `<ScreenLayout>` and then spreading `{...layoutProps}` after them — silently discarding all three. It was harmless only by coincidence (the inline expression happened to match what the spread carried). The three shadowed props are removed; the bug class itself can no longer occur, because `chrome` is a nested object — a sibling prop and a chrome field can't collide on assignment order anymore.

### Changed
- **One `ScreenChrome` type, not two.** `CommonScreenLayoutProps` and `ScreenLayoutProps` were the same ~19-field shape declared twice and had drifted (a dead `onOpenHelp`, a missing `onDeleteTestingDraft`/`onOpenGetStarted`). `ScreenChrome` is now defined once in `ScreenLayout.tsx`; `ScreenLayoutProps = { chrome: ScreenChrome } & ScreenPresentation`; `src/core/screens/types.ts` is a thin re-export.
- **All 8 screen call sites** (`LogScreen`, `TestingScreen`, `PrintPlanScreen`, `InfoPageScreen`, `DashboardScreen`, `SummaryScreen`, `ResearchScreen`, `ScreenUnavailable`) now pass `chrome={chrome}` as a named object prop instead of spreading `{...layoutProps}`.
- **Memoized the chrome object** in `App.tsx` with `useMemo`, so it no longer gets a fresh identity — and fresh `onDeleteTestingDraft`/`onOpenGetStarted` closures — on every render.

## [0.78.9] — 2026-08-19 (One Types Barrel)

Summary: Unifies the type import path — the same `Screen`/`Patient`/etc. types were reachable via two different aliases (`@/types` and `@shared/types`) in files that talk directly to each other, which is exactly the kind of drift that produces "which one is the real one" bugs. Pure import-path codemod, zero behaviour change.

### Changed
- **Single canonical types barrel** — Every `@/types` import across the codebase (76 files) now goes through `@shared/types`. `src/shared/types/index.ts` now re-exports patient and testing feature types alongside `common` and `clinicalWorkContext`, completing it as the one barrel the old root shim used to be.
- **Deleted the migration shim** — Root `types.ts` (explicitly a "backward compatibility during migration" re-export) is gone now that nothing imports through it.

## [0.78.8] — 2026-08-19 (Strict Housekeeping)

Summary: Zero-behaviour-change cleanup — removes dead duplicate code, enables TypeScript strict mode across the codebase, and adds a global test coverage floor, closing the gap between this codebase's actual quality and its type-checking rigor ahead of the architecture work that follows.

### Removed
- **Dead duplicate dashboard components** — `components/dashboard/PatientTable.tsx`, `SkinTestBreakdown.tsx`, and `CSVUploadInstructions.tsx` were diverged, zero-importer duplicates of the live `src/features/dashboard/components/` versions.
- **Unreferenced files** — `hooks/use-mobile.ts` and the root `data/changelog.json` (the app reads `src/shared/data/changelog.json`).
- **8 unused navigation helpers** — `navigateToLog`/`navigateToDashboard`/`navigateToResearch`/`navigateToSummary`/`navigateToPatientSummary`/`navigateToTesting`/`navigateToPrintPlan`/`navigateToChangelog` in `useAppNavigation.ts`; all call sites already used the general `navigateTo`.
- **`Screen.POWERCHART_LETTER`** — an unused enum member with zero references (distinct from the still-live Powerchart Letter report tab).
- Stray untracked root artifacts (`build.log`, `test-results*.json`).

### Changed
- **TypeScript strict mode** — Enabled `strict`, `noImplicitReturns`, and `noFallthroughCasesInSwitch` in `tsconfig.json`. Fixed the ~7 resulting errors in place (no `any`/`@ts-expect-error` suppressions): explicit `ConfirmDialogConfig` interface, React 19 `RefObject<T | null>` typing, an explicit `PerformanceEntryMap` parameter type, and clean explicit returns in a couple of effects and `manualChunks`.
- **Global coverage floor** — `vitest.config.ts` now enforces a baseline coverage floor (statements 76% / branches 67% / functions 67% / lines 79%) across the whole codebase, alongside the existing higher per-path thresholds.

## [0.78.7] — 2026-08-19 (Regression Net)

Summary: Adds the Phase 0 regression net ahead of a broader architecture/correctness/performance pass — e2e wired into CI, characterization tests for the previously-untested navigation guard, prop-forwarding tests for ScreenLayout's chrome props, screenshot baselines for the nav chrome, and a temporary prop-key tripwire ahead of an upcoming layout-type refactor.

### Added
- **E2E in CI** — Adds a Playwright/Chromium job to `.github/workflows/ci.yml`, running the non-visual suite on every push.
- **Navigation guard test coverage** — Unit tests (`AppScreenFallbacks.test.tsx`) and a new e2e scenario (`e2e/testing-day.spec.ts`) covering the "leave testing session" dialog: dialog visibility, each button's callback, and the delete-draft cancel-then-reset ordering.
- **ScreenLayout prop-forwarding tests** — New `ScreenLayout.forwarding.test.tsx` asserting chrome and navigation props actually reach `AppSidebar`, `AppTopBar`, `AppNavigationDrawer`, and `Footer`.
- **Navigation chrome screenshot baselines** — `e2e/visual-chrome.spec.ts` now asserts real screenshot diffs (desktop/mobile, root/dashboard) instead of save-only capture.
- **Temporary prop-key tripwire** — `AppLayoutProps.test.tsx` pins the exact prop-key set `App.tsx` forwards to `ScreenLayout` via an inline snapshot, to be deleted once the layout-type refactor lands.

## [0.78.6] — 2026-08-18 (Safe PWA Updates)

Summary: Implements a safe PWA update policy that automatically refreshes waiting service workers at the PIN gate, protects active unlocked clinical sessions with persistent update prompts, coordinates explicit skipWaiting without clientsClaim to avoid reload loops, and cleans up outdated caches.

### Changed
- **Automatic refresh at PIN gate** — Silently activates waiting service workers and reloads the application when at the PIN screen lock, ensuring shared workstation devices stay up to date without clinician intervention.
- **Protected unlocked clinical sessions** — Preserves in-progress clinical drafts and workflows during active sessions by replacing automatic reloads with a non-disruptive persistent update prompt toast.
- **Explicit skipWaiting without clientsClaim** — Coordinates service worker activation explicitly via `updateSW(false)` and bounded reloads instead of `clientsClaim`, eliminating infinite reload loops on initial install.
- **Cache cleanup** — Cleans up outdated runtime and precache entries immediately upon service worker activation to prevent stale assets from lingering.

### Added
- **PWA update policy test coverage** — Adds unit test coverage for unlocked session detection, bounded idempotent update execution, PIN gate vs unlocked refresh routing, 5-minute background polling, and visibility-change update triggers.

## [0.78.5] — 2026-08-18 (Mobile Clinical Chrome)

Summary: Optimises phone viewports with a compact single-row top bar and 36px patient context strip featuring an accessible details popover, while preserving full layouts on tablet and desktop viewports.

### Changed
- **Compact phone header** — Streamlines the top bar on viewports below 768px (`md:hidden`) into a single compact ~56px row with drawer trigger, truncated title, active badges, actions, display settings, and theme toggle, omitting large icons and subtitles to avoid multi-row wrapping.
- **Compact phone patient context strip** — Condenses the patient context bar on mobile into a single ~36px strip displaying patient name and MRN with a popover trigger for full DOB, reaction date, visit date, and data source details.
- **Preserved tablet and desktop layouts** — Retains full multi-item inline context strips and rich masthead/top-bar headers with page icons and subtitles on tablet (`md` to `xl`) and desktop (`xl+`) viewports.

### Added
- **Mobile chrome regression coverage** — Adds unit and accessibility test coverage for compact phone header elements, popover patient details, fallback values, redaction support, and tablet/desktop responsive preservation.

## [0.78.4] — 2026-08-18 (Report Clarity)

Summary: Makes copied and emailed Clinical Reports readable as plain text with separated per-drug result blocks, and makes the PIN gate's architectural background pattern visibly animate while preserving reduced-motion support.

### Changed
- **Readable plain-text Clinical Report output** — Replaces the pipe-separated skin-testing table in Copy as Text and email output with blank-line-separated drug records containing labelled result, SPT, IDT, and optional notes fields. The on-screen and printed report tables remain unchanged.
- **Visible PIN gate motion** — Layers the architectural grid above the ambient light fields, relaxes its mask, and adds restrained drift and pulse motion so the pattern is visibly present without overwhelming the lock station.

### Added
- **Plain-text report regression coverage** — Covers current and legacy IDT formats, positive/negative result labels, missing values, notes, custom drugs, and preserved challenge and nursing-note output.

## [0.78.3] — 2026-08-18 (Clinical Lock Station)

Summary: Redesigns the PIN screen lock as a responsive clinical workstation lock station with an architectural hairline grid, restrained ambient lighting, preserved 4-digit PIN and session storage semantics, robust accessibility attributes, and reduced-motion support.

### Changed
- **Clinical workstation lock station layout** — Replaces the single-column centered card with a responsive two-column workstation frame (`PasswordGate`), featuring a NSW Health navy branding rail on the left and a structured PIN entry module on the right.
- **Ambient lighting and palette alignment** — Replaces the previous diffuse glow with refined ambient light fields tuned to masthead navy and accent tokens, creating visual depth without distraction.

### Added
- **Architectural hairline grid** — Integrates a subtle, radial-masked SVG hairline grid behind the lock station frame.
- **Accessibility and reduced-motion safeguards** — Ensures decorative grid and ambient lighting elements are explicitly `aria-hidden`, maintains tabular-num font alignment for PIN digit inputs, and preserves all existing keyboard, autofocus, and session unlock semantics under reduced-motion preferences.

## [0.78.2] — 2026-08-18 (Testing Draft Deletion)

Summary: Adds an explicit way to discard an in-progress testing draft, restores sticky positioning for the chrome header and Testing screen workflow index, fixes print output showing the print-confirmation dialog and wasting a page on the SPT/IDT protocol table, aligns the patient identity bar, and gives the top bar and identity bar a navy chrome-cohesion accent.

### Added
- **Delete testing draft** — Adds an explicit way to discard an in-progress testing session draft, from the sidebar's Testing Session nav item (with a confirmation dialog) and from the "Leave testing session?" dialog (a new "Delete draft" option), reusing the existing draft-reset logic.

### Fixed
- **Sticky chrome header and Testing workflow index** — Restores `position: sticky` for the top chrome header and the Testing screen's step index, both of which had regressed after an earlier `overflow-x-hidden` fix; also removes a lingering CSS transform left behind by the screen-entrance animation that was breaking sticky/fixed positioning for elements inside `<main>`.
- **Desktop sidebar clipping while scrolling** — The persistent sidebar no longer gets visually clipped during scroll; root cause was a permanent transform left on an ancestor by the screen-entrance animation.
- **Patient identity bar alignment** — The bar now aligns to the same content container as the header and page content, instead of using its own narrower padding.
- **Print preview showing the confirmation dialog** — The print-confirmation dialog is now hidden from print output instead of covering the printed testing plan.
- **SPT/IDT table print pagination** — The testing plan's protocol table can now paginate across pages instead of being forced entirely onto page 2, eliminating a page of wasted blank space above it.

### Changed
- **Top bar and patient identity bar chrome cohesion** — Extends the NSW Health Navy accent to the top bar's page icon and a desktop-only top edge stripe, and replaces the identity bar's diffuse border with a single left accent stripe, tying both more closely to the navy sidebar.
- **Upload REDCap card recoloured** — The front-page "Upload REDCap export & review cases" card now uses the red/danger accent instead of navy.

## [0.78.1] — 2026-08-18 (Responsive App Navigation)

Summary: Introduces a responsive app-navigation shell with a persistent desktop sidebar, mobile navigation drawer, and page top bar, with focused accessibility coverage.

### Changed
- **Responsive app-navigation shell** — Replaces the horizontal masthead navigation with a persistent desktop sidebar, a compact mobile/tablet navigation drawer, and a contextual page top bar across the application shell.
- **Navigation structure and responsive safeguards** — Consolidates workspace, current-work, reference, support, and action navigation sections while preserving draft and report status indicators and responsive no-overflow behavior.

### Added
- **Navigation regression coverage** — Adds focused unit coverage for the screen layout, sidebar, drawer, navigation sections, and page top bar, and updates end-to-end selectors for the responsive navigation surfaces.

## [0.78.0] — 2026-08-17 (Clinical Masthead Navigation)

Summary: Redesigns primary navigation with a persistent horizontal masthead and unified measured sticky chrome stack, surfaces display text size settings, fixes dark-mode contrast with dedicated masthead tokens, restores navigation on Reports, and removes the legacy desktop sidebar.

### Changed
- **Horizontal clinical masthead** — Primary navigation moves from a 288px desktop sidebar to a horizontal masthead (`AppMasthead`), freeing horizontal viewport width for dense clinical data grids and consultation letters.
- **Consolidated utility overflow menu** — Utility and reference links (`Research`, `About`, `FAQ`, `Drug Reference`, `Contact`, `Resources`, `Changelog`, `Upload CSV`, `Get Started`) are consolidated into a clean, accessible dropdown menu in the masthead right cluster.
- **Unified measured sticky chrome stack** — Replaces three competing sticky headers with a single sticky container measuring its combined height via `useChromeHeight` and publishing `--app-chrome-height` to manage scroll margins and anchor offsets without layout shift.
- **Dedicated masthead colour tokens** — Introduces `--masthead`, `--masthead-foreground`, `--masthead-accent`, and `--masthead-border` tokens that remain deep NSW Health navy in both light and dark themes, guaranteeing accessible WCAG AA contrast (≥12:1) across themes.

### Added
- **Display text-size controls** — Surfaces root font-scaling controls (85% to 125% in 5% increments with reset) via the masthead display settings menu, powered by `FontSizeProvider`.
- **Restored navigation on Reports screen** — Full application navigation is now accessible on the Reports view (`Screen.SUMMARY`), resolving a previous layout constraint.

### Removed
- **Legacy sidebar and unused primitives** — Completely removes `AppSidebar` and the unused shadcn sidebar primitive, pruning dead navigation code and unused styles.

## [0.77.5] — 2026-08-17 (Guided REDCap Import)

Summary: Turns the Get Started upload path into a guided two-step flow that shows the REDCap export instructions before the file picker, and gives the two onboarding paths distinct semantic colours.

### Changed
- **Guided REDCap import step** — `GetStartedModal` becomes a two-step flow: choosing "Upload REDCap export & review cases" now opens an in-modal *Import REDCap export* step presenting the full REDCap export instructions with the file input at the end, plus a Back control returning to the chooser. Replaces the previous immediate file picker and its separate export-steps link.
- **Distinct onboarding path colours** — The direct-testing card adopts a dedicated `--path-testing` teal token instead of `--status-info`, which was visually indistinguishable from the navy primary used by the import card. The token is deliberately outside the clinical `--status-*` family so severity semantics stay unambiguous.

### Added
- **Shared REDCap export steps component** — Extracts the export instructions and upload control into `RedcapExportSteps`, now shared by the Get Started modal and the Update Database sheet, with unit coverage.

### Fixed
- **Modal dialog overflow on narrow viewports** — The Get Started footer no longer forces the dialog past the viewport at 375px; the version line and dismiss control stack below the `sm` breakpoint.

## [0.77.4] — 2026-08-17 (Desktop Primary Navigation Redesign)

Summary: Redesigns the desktop AppSidebar navigation rail with a scrollable primary area and pinned utility region, introduces the Get Started modal workflow and unified REDCap upload hook, and strengthens navigation accessibility.

### Changed
- **Desktop navigation rail redesign** — Structures `AppSidebar` with a scrollable upper region for primary and contextual navigation and a pinned lower region for utility actions, settings, theme toggle, and system metadata.
- **Get Started modal and launcher** — Replaces legacy help modal with a streamlined `GetStartedModal` and `GetStartedActions` component offering direct action paths for REDCap import and bedside testing entry.
- **Unified REDCap CSV upload handling** — Consolidates CSV file handling and validation into the `useRedcapCsvUpload` hook across navigation and home screen entry points.

### Added
- **Desktop navigation regression coverage** — Adds comprehensive tests for `AppSidebar` pinned layout, keyboard navigation, focus rings, minimum target sizing, and ResizeObserver scroll bounds.

## [0.77.3] — 2026-08-16 (Location-First Workflow Navigator)

Summary: Redesigns the location-first workflow navigator with a shared desktop rail and mobile controller, readable full labels, an aggregate status summary, clear status semantics, and accessible section navigation.

### Changed
- **Location-first workflow navigator** — Unifies desktop and mobile section navigation while preserving clinical workflow and draft-safe behavior.

## [0.77.2] — 2026-08-16 (PIN Gate Redesign)

Summary: Redesigns the clinical workstation screen lock with clearer PIN feedback, accessible status messaging, responsive entry controls, and subtle motion that respects reduced-motion preferences.

### Changed
- **Clinical workstation lock redesign** — Refines the PIN gate with clearer lock-state hierarchy, larger responsive controls, filled and error states, keyboard-friendly feedback, and accessible live status messaging while preserving the existing PIN and session semantics.
- **Ambient light field motion** — Adds a restrained semantic light-field animation that supports light and dark themes and disables cleanly for reduced-motion preferences.

### Added
- **PIN gate regression coverage** — Adds focused component tests and accessibility coverage for the lock structure, input behaviour, error recovery, session persistence, decorative-layer semantics, and reduced-motion contract.

## [0.77.1] — 2026-08-16 (Testing Category Colours Restored)

Summary: Restores the distinct semantic drug-category colour palette across light and dark themes for all ten testing categories, protected by comprehensive regression tests.

### Fixed
- **Restored semantic drug-category colour palette** — Reinstates the distinct semantic category tokens across all ten drug categories in both light and dark themes, restoring visual distinction across testing plans, workbenches, and reports.

### Added
- **Category theme regression tests** — Adds automated regression tests in `constants.test.ts` verifying unique class mappings across all drug categories and distinct CSS token definitions in `index.css` for both light and dark themes.

## [0.77.0] — 2026-08-15 (Clinical Workflow Safeguards)

Summary: Implements clinical work context binding, patient-switch safeguards, progressive testing workflow, outbound action confirmation with redaction, active session TTL cleanup, and interface navigation polish.

### Added
- **Clinical work context binding & patient-switch safeguards** — Introduces `ClinicalWorkContext` model and `ClinicalContextBar` component to securely bind drafts and active reports to verified patient identity, preventing cross-patient data leakage during workflow transitions.
- **Progressive testing workflow & review** — Adds `TestingWorkflowIndex` and `ReviewSaveSection` to provide structured multi-step testing execution with pre-save clinical outcome reviews.
- **Outbound action confirmation dialog** — Introduces `OutboundActionDialog` across print, copy, and export actions with explicit PHI acknowledgement and redaction options.

### Changed
- **Active session TTL expiry & lifecycle management** — Enhances local draft and active report expiry monitoring across window focus, visibility changes, and storage events.
- **Navigation & Help modal polish** — Refines `AppSidebar`, `MobileNavigationDrawer`, and `HelpModal` with keyboard shortcut affordances, accessibility enhancements, and responsive layout polish.

## [0.76.5] — 2026-08-15 (Navigation without Workflow View)

Summary: Removed the unwanted Clinician/Nurse workflow view and mode-dependent layout while preserving direct Allergy Testing, REDCap review, draft protection, contextual navigation, mobile navigation, and clinical nurse notes.

### Removed
- **Clinician and Nurse workflow view mode** — Removes the workflow mode selector and mode-dependent view switching from desktop and mobile navigation.

### Changed
- **Unified Home layout** — Standardizes Home screen presentation with consistent patient selection, quick-start actions, and informational panels.
- **Stable contextual navigation** — Retains dynamic links for active reports and in-progress testing drafts in consistent order across navigation surfaces.

## [0.76.4] — 2026-08-15 (Navigation and Direct Entry Workbench)

Summary: Reworked navigation, added Home REDCap review and direct Allergy Testing entry points, strengthened draft-safe history behaviour, accessibility coverage, and autosave restore status.

### Added
- **Mode-aware navigation architecture** — Introduces `AppSidebar`, `MobileNavigationDrawer`, and `WorkflowModeControl` with tailored views for Clinician and Nurse workflows, integrated hash routing, and `NavigationGuardDialog` protection.
- **Direct entry and quick-start actions** — Adds prominent Home action cards for REDCap CSV review and direct Allergy Testing with active draft resume indicators and safe patient switching guards.
- **Synchronous draft persistence** — Adds `persistDraftNow` in `useTestingState` to immediately flush in-flight draft changes and prevent debounce race conditions during navigation.

### Changed
- **Autosave restore indicator accuracy** — Refines `DraftSaveIndicator` and testing draft restoration to avoid false saving states on mount and accurately reflect saved timestamps and unsaved edits.
- **Comprehensive test coverage** — Expands unit test suites for navigation components, workflow mode hooks, and draft lifecycle management, alongside updated accessibility and direct entry E2E specs.

## [0.76.3] — 2026-08-15 (Distinctive Quick-Start Colours)

Summary: Applies distinct semantic colour styling to Home quick-start entry points, styling REDCap review in cool blue/sky tones and Allergy Testing in warm amber tones while preserving all accessibility standards, responsive layouts, and clinical behaviours.

### Changed
- **Distinctive quick-start action colours** — Styles the REDCap CSV review action with cool blue (`sky`) accents and the direct Allergy Testing action with warm amber accents, enabling immediate visual distinction between administrative review and direct clinical testing entry points.
- **Preserved accessibility and interaction behaviour** — Maintains high-contrast iconography, theme-aware tinted backgrounds, visible keyboard focus rings, zero-radius geometry, responsive grid sizing, and existing modal and navigation workflows across both quick-start actions.

## [0.76.2] — 2026-08-15 (Quick Start Emphasis)

Summary: Strengthens Home quick-start entry points with prominent, equal-weight action cards for REDCap review and direct Allergy Testing, featuring responsive grid layouts and accessibility-preserving visual treatments.

### Changed
- **Equal-weight Home quick-start entry points** — Elevates REDCap CSV review and direct Allergy Testing into balanced, prominent action cards with clear descriptive copy.
- **Responsive and accessible visual treatment** — Refines quick-start cards with high-contrast iconography, theme-aware tinted surfaces, fluid responsive layout, and visible focus rings preserving accessibility standards.

## [0.76.1] — 2026-08-15 (Workbench Polish & Performance)

Summary: Removes known production build and Chromium console warnings with updated browser data, web-vitals compatibility, and granular code splitting, while completing whole-project Clinical Workbench design and print styling polish.

### Added
- **Granular vendor and runtime chunking** — Configures dedicated production chunk boundaries for React/DOM runtime, Supabase, Sentry, Radix UI components, forms, and icons, eliminating production chunk-size warnings.
- **Whole-project Clinical Workbench polish** — Finalizes semantic category and status tokens, zero-radius geometry, high-contrast focus rings, and print-safe typography across clinical reports, handouts, letters, and dashboard views.

### Changed
- **Warning-free telemetry and browser data** — Updates `web-vitals` and Browserslist data, with a scoped fallback for browsers without `visibility-state` performance entries while preserving all five reported metrics.
- **Operational documentation** — Updates README notes to reflect clean production chunking without expected warnings.

## [0.76.0] — 2026-08-14 (Clinical Workbench Refinement)

Summary: Refines the Clinical Workbench interface with semantic category and status tokens, improved typography and print scaling, responsive PatientTable workflows, enhanced draft and pharmacy verification affordances, and expanded regression coverage.

### Added
- **Semantic category and status tokens** — Extends Tailwind design tokens with semantic drug category palettes (`--cat-*`) and structured status color tokens (`success`, `warning`, `danger`, `info`, `neutral`) for consistent theme styling across clinical views.
- **Typography and print scaling** — Refines Public Sans font hierarchy and print stylesheets to guarantee legibility, optimal contrast, and robust black-and-white page scaling across clinical forms and reports.
- **Responsive PatientTable** — Improves table layout, quick filters (`Needs action`, `Reported`), search responsiveness, and pagination affordances on mobile and tablet viewport widths.
- **Draft and pharmacy affordances** — Streamlines in-progress session persistence indicators and highlights unverified masterlist preparations with clear pharmacy confirmation callouts.
- **Regression test coverage** — Adds comprehensive unit and component test suites covering patient worklist filtering, design token contracts, and draft lifecycle transitions.

## [0.75.0] — 2026-08-14 (Direct Testing Entry)

Summary: Adds quick-start entry points for REDCap review and direct Allergy Testing, with editable patient identity fields and safe draft protection.

### Added
- **Home quick-start actions** — users can upload a REDCap export and continue directly to Dashboard, or open Allergy Testing without first selecting a patient or creating a testing plan.
- **Direct Allergy Testing identity fields** — nurses can enter MRN, first name, last name, and optional DOB in a fresh testing session; required identity validation remains enforced before saving.
- **Safe direct-session entry** — the `/testing` route opens the same fresh-session state, while unsaved direct testing data triggers confirmation before it can be discarded.

### Changed
- **Patient-linked testing identity remains protected** — testing sessions opened from a patient record continue to show read-only identity information and preserve the existing selected drugs and plan workflow.
- **Help and FAQ guidance** — documents both the patient-linked workflow and the direct testing/REDCap review entry paths.

## [0.74.0] — 2026-08-14 (Clipboard Handoff)

Summary: Adds plain-text clipboard copying for the Testing Request Form preview with toast feedback, and updates FAQ export guidance.

### Added
- **Copy as Text for Testing Request Form preview** — Clinicians can now copy formatted testing request details directly to the clipboard from the print preview screen, reusing the email formatter while preserving all clinical and protocol details.
- **Clipboard feedback notifications** — Displays immediate success and failure toasts when copying testing request text to the clipboard.

### Changed
- **FAQ export guidance update** — Clarifies that both clinical reports and testing request forms support plain text clipboard export alongside email dispatch.

## [0.73.0] — 2026-08-14 (Clinical Workbench)

Summary: Adopts the Clinical Workbench design system across the interface with strict zero-radius geometry, semantic theme tokens, visible keyboard focus indicators, and formal design specifications in PRODUCT.md, DESIGN.md, and .impeccable/design.json.

### Added
- **Formal product specification (`PRODUCT.md`)** — Documents platform context, clinician workflows, local-first privacy principles, clinical calculation constraints, and accessibility targets.
- **Design system specification (`DESIGN.md`)** — Establishes the "Clinical Workbench" visual language, NSW Health color palette, Public Sans typographic scale, rectangular geometry, elevation rules, and component patterns.
- **Design tokens schema (`.impeccable/design.json`)** — Defines machine-readable design system tokens, color ramps, typography scales, shadows, breakpoints, and component examples.

### Changed
- **Strict zero-radius geometry across UI components** — Standardizes sharp rectangular corners (`rounded-none`) across buttons, cards, dialogs, badges, sidebars, dropdowns, hover cards, and skeleton loaders.
- **Enhanced keyboard focus visibility and tactile interactions** — Adds consistent high-contrast focus rings (`focus-visible:ring-2`) and tactile micro-press states across buttons, inputs, toggles, and report tabs.
- **Semantic theme token consolidation** — Replaces hardcoded color utilities with semantic theme tokens (`--background`, `--card`, `--border`, `--muted`, `--primary`) across info pages, testing forms, and research dashboards.

## [0.72.0] — 2026-07-14 (Referral Trust)

Summary: Tryptase results from the referral now prefill the testing record and Powerchart letter, preventing the clinically unsafe false claim that serial samples were "not obtained." This release also adds a persistent patient worklist, clearer clinical completeness cues, safer imports, and stronger privacy protections across the five-phase UX improvement programme.

### Added
- **Sticky patient identity at clinical decision points** — Testing Session and Summary screens keep the patient's name, MRN, and DOB visible while clinicians scroll, reducing wrong-patient risk during data entry and report review.
- **Visible autosave status** — testing-session and Testing Request Form drafts now show when they are saving and when they were last saved, making browser-local persistence explicit.
- **Persistent patient worklist with workflow status** — imported cohorts persist for 6 hours across refreshes, while the dashboard derives Referral, Plan drafted, Testing, and Reported states and adds Needs action and Reported filters.
- **Expiry warning for local clinical data** — a banner warns before the 6-hour browser-local TTL expires and offers a Keep working action to extend the active session.
- **Honest suspected-agent review** — an explicit empty state no longer implies an agent was identified when none was imported, and clinicians can tap medication-timeline entries to mark or unmark suspected agents.
- **Missing-information checklist** — patient history highlights absent anaesthetic charts, resuscitation charts, tryptase results, discharge letters, suspected agents, and differential diagnosis before testing proceeds.
- **High-risk context chips** — beta-blocker, ACE inhibitor, pregnancy, and asthma context now appears during patient review and testing where it can inform clinical decisions.
- **Pharmacy-verification flags** — testing-request builder and print views flag masterlist preparations whose concentration or preparation details still require pharmacy confirmation.

### Changed
- **Clinical terminology is consistent end to end** — screens and actions now use Testing Request Form, Testing Session, and Reports consistently instead of mixing plan, log, and summary labels.
- **Confirmation dialogs share one safety pattern** — destructive and high-impact actions now use the same accessible confirmation dialog, wording hierarchy, and destructive styling.
- **CSV uploads explain progress and outcomes** — upload surfaces show parsing state plus imported and skipped-row totals, so clinicians receive clear feedback instead of a silent transition.
- **Duplicate uploads can replace the cohort** — uploading an already loaded REDCap database now offers an explicit full-database replacement flow instead of rejecting the file.

### Fixed
- **Quoted multi-line CSV fields import correctly** — the REDCap parser now honours quoted records containing commas, escaped quotes, and embedded newlines instead of splitting one patient across multiple rows.
- **Sentry removes PHI from every event text surface** — identifiers and DOB-shaped dates are scrubbed from messages, exceptions, breadcrumbs, and extras; user and cookie data are removed before transmission.
- **MRNs retain their recorded casing** — patient identifiers are displayed verbatim instead of being incorrectly forced to lowercase.
- **Referral tryptase data reaches the Powerchart letter** — imported tryptase samples prefill the testing record and generated letter, so existing results are reported rather than falsely described as "not obtained."

## [0.71.0] — 2026-06-11 (Any Encoding)

Summary: Fixes CSV import rejecting valid REDCap exports with "Missing required columns" when the file isn't UTF-8. Excel "Save As" commonly writes UTF-16, which the app decoded as UTF-8 — garbling every column name so all required headers failed at once. Imports now work regardless of file encoding.

### Fixed
- **CSV upload now reads any file encoding** — all three upload paths (main upload sheet, Help modal, Dashboard) read the file as bytes and detect the byte-order mark (UTF-8, UTF-16LE, UTF-16BE) before decoding, instead of assuming UTF-8. A UTF-16 export from Excel no longer turns column names into mojibake. New `decodeCsvBytes` helper in `csvUtils.ts`.
- **Header matching tolerates invisible characters** — `normalizeHeader` strips BOM and zero-width spaces, converts non-breaking spaces (U+00A0) to regular spaces, and collapses doubled whitespace, applied once to every parsed header so both validation and column-mapping are resilient to REDCap/Excel label artifacts.

### Changed
- **CSV parse errors now name the detected columns** — the "Missing required columns" message lists the first few column names actually found in the file, so an encoding garble vs a genuine column rename is diagnosable at a glance.

## [0.70.0] — 2026-06-11 (Medication Chart)

Summary: Redesigns the testing plan request form to match the standard national medication chart (NIMC) template — patient ID label box header, one row per SPT/IDT step in a flat administration table — so the printed document is clinically familiar and audit-compliant.

### Changed
- **Testing plan print view now matches NIMC medication chart format** — replaces the accent-border / patient-banner layout with the standard two-column header: a bordered "Affix patient identification label here" box (pre-filled URN, family name, given names, address watermark, DOB, M/F checkboxes, red "First prescriber" warning) and a right column with the red "Attach ADR sticker" box and form title.
- **Flat per-step table replaces grouped drug table** — each drug now produces one row per test step (1 SPT row + 1 row per IDT dilution) instead of stacking all IDT concentrations in a single cell; columns match the NIMC "Once only and nurse initiated medicines" format: Date | Drug | Type | Concentration | Date | Time | Signature | Print name | Wheal (mm) | Time.
- **Reference controls moved to a bordered strip above the table** — Histamine SPT / Saline SPT / Saline IDT fill-in lines now sit in a clearly delineated section immediately above the protocol table.
- **Three blank rows added at table bottom** for handwritten additions at time of testing.
- **"not listed" badge preserved for REDCap-sourced custom drugs** — shown inline next to the drug name in the Type column.

## [0.69.0] — 2026-06-11 (Legible)

Summary: Design-audit remediation pass — closes the UI/UX and typography findings from the formal accessibility audit, prioritising the patient-safety items: legible wheal measurements, dark-mode-safe clinical notes, B&W-survivable printed reports, and colourblind-safe severity indicators.

### Fixed
- **Wheal-size inputs now use tabular figures** — every SPT and IDT result cell in `DrugTestGrid` is `font-mono tabular-nums` unconditionally (previously mono only on a positive result), so digits column-align across rows and a 3mm vs 13mm value can no longer be misread between IDT dilution columns at the positive/negative threshold.
- **Clinical notes are legible in dark mode** — the Assessment & Plan textareas (`AssessmentSection`, `AssessmentPlanSection`) used hardcoded `bg-white`/slate tokens that rendered near-white text on a white field in dark mode; they now use semantic `bg-background`/`text-foreground`/`border-border` tokens. Notes typed in dark mode are no longer invisible.
- **Printed reports survive B&W photocopying** — the print stylesheet forces all headings to `#000` and `--foreground` to black, so NSW Health Blue headings no longer wash out to grey on a ward printer; the "AVOID" drug labels in `ClinicalReport` and `PatientHandout` now print bold-black so the avoidance signal is unmistakable in monochrome.
- **Dark-mode secondary text meets WCAG AA** — `--muted-foreground` raised from `0 0% 60%` (#999, ~3.8:1) to `0 0% 65%` (#a6a6a6, ≥4.5:1), fixing contrast on every section label, table header and caption in dark mode.
- **Patient name no longer exposed on the active-report banner** — the banner now shows initials (e.g. "J. Smith") instead of the full name, so a previous patient's identity is not visible to the next person at a shared workstation.
- **Print header/footer no longer overlap content** — replaced the `print:fixed` running header/footer + `body` padding approach with proper `@page` margins (25mm top / 20mm bottom / 15mm sides), preventing the patient identifier from overlapping the first table row on A4.
- **Reference control inputs drop the number spinner** — Histamine/Saline control fields switched from `type="number"` to `type="text" inputMode="decimal"`, so a bedside scroll can no longer accidentally increment a control baseline.

### Added
- **Colourblind-safe severity distribution** — the dashboard severity bar now carries `role="img"` with a synthesised text summary, distinct diagonal pattern fills per grade, and legend chips that print the grade numeral (I–IV) as text rather than relying on a colour dot alone.
- **Full keyboard navigation for the patient selector** — `PatientSelector` now supports ArrowUp/ArrowDown/Enter/Escape with `aria-activedescendant`, so the list is operable without a mouse (WCAG 2.1.1).
- **Validation errors jump to their field** — the save-time error summary renders each message as a link to the offending control (`visit-date`, `drug-filter`, `clinical-plan`); a single click focuses the field instead of a manual scroll-hunt.
- **Required-field validation on manual patient entry** — First Name, Last Name and MRN now block "Save & Close" with inline error text, preventing an unidentifiable clinical record.
- **Report tabs expose proper ARIA roles** — the Clinical Report / Handout / Letter tab bar now uses `role="tablist"`/`role="tab"` with `aria-selected`.

### Changed
- **Type scale corrected** — `h4` changed from `text-base font-bold` to `text-lg font-semibold`, removing the inverted weight-to-size relationship against `h3`.
- **Section labels and heading consistency** — ad-hoc `uppercase tracking-wide` label strings across the testing and patient screens consolidated onto the `.section-label` utility; the Assessment & Plan report heading now matches the other section headings (uppercase, tracking-wider, primary underline).
- **Narrative measure controlled** — long narrative blocks in `PowerchartLetter`, `PatientHandout` and `PatientHistory` are now constrained with `max-w-prose` for a readable line length.
- **`.app-wordmark` class** — the login wordmark's `tracking-widest` is now an isolated utility class, reserved so functional headings don't inherit logotype spacing.

### Notes
- All original audit findings (Workstream A UI/UX + Workstream B Typography) are addressed; the full report lives at `plans/dream-design-audit-2026-06-11.md`.
- 216 unit tests pass; typecheck and lint clean; production build green. The testing-day E2E selector was updated for the new report-tab role.

### Chore
- Version bump to 0.69.0

## [0.68.0] — 2026-06-10 (Polished)

Summary: Final pass of the audit cycle — completes the section decomposition, hoists the help modal to the app root so it's a true singleton, and raises the coverage floor.

### Fixed
- **Help modal is now a single instance** — `HelpModal` is rendered once at the app root rather than inside each screen's `ScreenLayout`. This permanently resolves the re-opening-on-navigation bug that required a sessionStorage band-aid in the previous patch; the band-aid is removed. The modal auto-opens at most once per page load regardless of screen navigation.

### Changed
- **`TestingLogFormSections.tsx` fully decomposed** — the 766-line barrel of section components is now 7 individual files (`ControlsSection`, `DrugTestPanelSection`, `DrugChallengeSection`, `DrugChallengeReactionFields`, `TryptaseSection`, `AssessmentPlanSection`, `NurseNotesSection`), each under 200 lines. `TestingLogFormSections.tsx` becomes a 7-line re-export barrel for backwards-compatible imports.
- **Coverage thresholds raised** — vitest thresholds for `src/features/testing/**` raised from the initial floor (statements 63 → 64, branches 64 → 64.1, functions 49 → 51, lines 63 → 68).

### Notes
- Closes the audit backlog. All original findings (Milestone 0–3 + outstanding items RI-1 through RI-3) are complete.
- 213 unit tests pass; Playwright smoke and testing-day E2E unchanged.

### Chore
- Version bump to 0.68.0

## [0.67.0] — 2026-06-10 (Decomposed)

Summary: Structural refactor pass from the audit backlog — breaks the `App.tsx` routing god-component and the monolithic testing form into focused units, and replaces the hand-rolled save-path coercion with a single Zod schema applied at both the save and restore boundaries. No user-facing behavior change.

### Changed
- **`App.tsx` decomposed into screen components** — the 572-line routing god-component is now a ~200-line switcher that delegates each screen to a named component under `src/core/screens/` (Log, Testing, Summary, Dashboard, Research, InfoPage). Provider wiring moved to `AppProviders`.
- **`TestingLogForm` split** — the 769-line form shell is now ~115 lines; its section markup lives in `TestingLogFormSections`, keeping the form container thin.
- **Single Zod schema for clinical record sanitization** — the ~50-line manual field-by-field coercion in `handleSubmit` is replaced by `parseLogFormData`/`safeParseLogFormData` in `logFormSchema.ts`. The same schema now sanitizes records on **both** save and localStorage restore, so a malformed stored draft or report is normalized identically wherever it re-enters React state. Legacy IDT field fallback and tryptase/nurse-note handling are preserved.

### Added
- **Schema unit tests** — `logFormSchema.test.ts` covers field coercion, legacy IDT fallback, malformed-input guards, and the safe-parse path.

### Notes
- This is a pure structural pass: the 213-test unit suite and the Chromium E2E flow (patient → panel → save → report, plus draft restore) pass unchanged as the regression guard.
- `.gitignore` PII rule narrowed from `data/` to `/data/` so it no longer shadows tracked source under `src/shared/data/`.

### Chore
- Version bump to 0.67.0

## [0.66.0] — 2026-06-10 (Hardened)

Summary: Safety-net pass from the repo audit — fixes a silent draft-restore data-loss bug, adds focused tests around the clinical record save path, tightens type safety in form handlers, and enforces test coverage in CI.

### Fixed
- **In-progress testing drafts now restore after a reload** — the restore guard checked `window.location.pathname === '/testing'`, which never matches in this single-path SPA, so autosaved drafts were written but never restored. Clinicians who reloaded or were auto-updated mid-session silently lost uncommitted work. The TTL window, plus draft-clearing on submit and reset, already guarantees a stored draft only represents live uncommitted work.

### Added
- **Unit tests for the clinical save path** — `useTestingState` (draft restore, debounced autosave, `handleSubmit` field sanitization, reset/clear) and `TestingService` (validation edge cases, skin-test positivity thresholds) are now covered to 100% statements.
- **Unit tests for `isTestingSessionDirty`** — the autosave gate is now fully covered, including malformed-input guards.
- **End-to-end draft-restore test** — a Playwright spec enters a control reading, reloads, and asserts the form state and patient are preserved.

### Changed
- **Stronger types in form handlers** — replaced `field as any` / `value: any` in `handleManualDetailChange`, `ChallengeSection.onChange`, and `PatientTable.updateFilter` with keyed union types derived from the domain models.
- **Hardened `isTestingSessionDirty`** — dirty-checks now coerce values defensively and guard array fields, so a malformed restored draft cannot throw.
- **CI runs tests with coverage** — the unit-test step now runs `test:coverage`, and `vitest.config.ts` enforces minimum coverage thresholds on `src/features/testing/**` so the save-path safety net cannot silently regress.

### Removed
- **Redundant outcome re-check in `handleSubmit`** — the saved `outcome` is already coerced to `SUCCESS | UNSUCCESS | null` during sanitization, so the follow-up guard was dead code.

### Notes
- Larger audit items (decomposing `App.tsx` routing, replacing the `handleSubmit` JSON round-trip with a Zod schema parse, splitting `TestingLogForm.tsx`) remain deferred to a later pass.

### Chore
- Version bump to 0.66.0

## [0.65.0] — 2026-06-09 (Tidy)

Summary: Project cleanup pass covering generated-file hygiene, dead dependency removal, safer tryptase restore handling, shared skin-test threshold logic, and leaner startup bundling.

### Changed
- **Generated test artifacts untracked** — Playwright reports and Vitest result JSON files are now ignored instead of living in source control.
- **Shared skin-test positivity threshold** — the 3 mm threshold now lives in one constant used by clinical result utilities, dashboard analytics, testing services, and research deidentification.
- **Safer tryptase state handling** — restored tryptase samples are normalized before re-entering React state, and tryptase form updates no longer rely on non-null assertions.
- **Lazy Sentry loading** — Sentry initializes after first paint and is dynamically imported only when configured, while web-vital and error-boundary capture still route through Sentry helpers.

### Removed
- **Unused hot-toast compatibility layer** — removed the dead `LegacyToaster` export and dropped the unused `react-hot-toast` package.
- **Stray backup file** — removed `components/ui/index.tsx.backup`.
- **Empty React vendor chunk** — removed the manual chunk entry that produced an empty `react-vendor` build artifact.

### Notes
- CSP enforcement remains out of scope for this pass.
- `next-themes` stays because it is used by the active sonner toast component.
- The drug masterlist remains eagerly loaded; deferring it would require async refactors across synchronous consumers for a small gzip gain.

### Chore
- Version bump to 0.65.0

## [0.64.0] — 2026-06-09 (Measured)

Summary: Diluent text now includes sourced reconstitution volumes for the skin-test request entries that need bedside preparation, while RTU saline entries stay plain.

### Changed
- **Reconstitution volumes in diluent text** — skin/control/experimental protocols for penicillins, cephalosporins, selected anaesthetic agents, PPIs, steroids, vancomycin, and related "Others" entries now include the specific preparation volume in the stacked SPT preparation sub-line.
- **Special preparations preserved explicitly** — penicillin determinant entries now name the 1 mL supplied phosphate-buffered diluent, oral PPI tablet entries say "dissolve in 1 mL", and mepivacaine records the 3% stock dilution volume.

### Notes
- Diluent values still require clinician sign-off before release. Residual confirm items: Cephalexin, Levofloxacin, Levonorgestrel, and insulin SPT preparation volumes; Methoxybenzylpenicillin, Cefuroxime Suspension, Methylene Blue, IV Contrast, and Atropine diluent values.

### Tests
- Updated masterlist diluent coverage for RTU saline, WFI reconstitution volume, saline reconstitution volume, and supplied-buffer preparations.

### Chore
- Version bump to 0.64.0

## [0.63.0] — 2026-06-09 (Stacked)

Summary: Testing request print tables fit again by stacking diluent under SPT preparation, while REDCap "not listed" items stay visibly marked through builder and print.

### Changed
- **Stacked SPT preparation/diluent cell** — the printed skin-test table is back to five columns; diluent now appears as a smaller sub-line under the neat/SPT preparation value so long requests do not overflow the page width.
- **Mobile request preview matches print** — mobile cards now show the same stacked SPT preparation and diluent text instead of a separate Diluent field.

### Added
- **Persistent REDCap provenance marker** — custom items added from REDCap "Others (not listed)" now keep an amber-accented "(not listed)" marker in the builder after the pending callout disappears.
- **Print-safe not-listed tag** — REDCap-origin custom items print with a bordered `not listed` tag beside the item name so the source remains visible on black-and-white clinic printers.

### Tests
- Extended testing-plan builder and print-view coverage for REDCap provenance markers and stacked diluent rendering.

### Chore
- Version bump to 0.63.0

## [0.62.0] — 2026-06-09 (Solvent)

Summary: Testing request forms now omit challenge protocols, show per-drug diluents, and preserve REDCap "Others (not listed)" requests as addable custom items.

### Added
- **Diluent column on testing requests** — the printed skin-test request table now includes a per-drug Diluent column beside SPT Preparation, and the mobile request preview shows the same information.
- **Per-drug diluent dataset** — skin/control/experimental protocols now carry sourced diluent values mined from `/Users/monchee/Projects/scratch/docs/drugs/*.md`; challenge-only protocols keep a blank diluent because the printed challenge section has been removed.
- **REDCap "Others (not listed)" callout** — the testing-plan builder now surfaces imported `testingPlanCustom` text as a read-only callout with one-click "Add as custom item" handling.

### Changed
- **Printed testing request simplified** — removed the "Challenge / Desensitisation Protocols" section from the printed request while leaving the challenge protocol data and live challenge workflow untouched.

### Fixed
- **Cis-atracurium auto-selection** — the testing-plan builder now matches reaction-history drugs tolerant of hyphen/space/case, so a reaction recorded as REDCap's "Cisatracurium" correctly preselects the canonical "Cis-atracurium" (previously it silently dropped on the reaction-history path).
- **Muscle-relaxant recognition** — `MUSCLE_RELAXANTS` aligned to the canonical "Cis-atracurium" spelling so a positive result is correctly treated as a muscle relaxant (MedicAlert / cross-sensitization logic).

### Notes
- Diluent values require clinician sign-off before release. Residual confirm items: Levofloxacin tablet preparation; Methoxybenzylpenicillin, Cefuroxime Suspension, Methylene Blue, IV Contrast, and Atropine diluent values.

### Tests
- Added coverage for REDCap Others callout/add flow, print-view Diluent column plus removed challenge section, representative masterlist diluent values, and regression tests for the Cis-atracurium spelling-tolerant matching and muscle-relaxant recognition.

### Chore
- Version bump to 0.62.0

## [0.61.0] — 2026-06-09 (Lucid)

Summary: Dashboard accessibility, consistency, and clarity pass — semantic headings, keyboard-operable tables, reduced-motion support, and clearer record stats.

### Added
- **Reduced-motion support** — the dashboard count-up numbers and chart/section animations now respect the OS "reduce motion" setting (`useCountUp` short-circuits to the final value; chart width transitions and section reveals are disabled).
- **Timeline legend** — the Record Database table now shows an induction / reaction / medication legend, and each timeline dot carries an accessible label.

### Changed
- **Records overview shows REDCap records and session logs separately** — the "Records" figure now reports the REDCap database count (matching the table below it) with current-session logs shown as a separate "+N this session" line, instead of silently summing the two.
- **Consistent headline rates** — severe and abandoned percentages now share one denominator (REDCap record count) so each count and its percentage line up.
- **Dashboard accessibility** — every dashboard card title is now a real `<h2>`; the Recent Testing Activity rows and Skin Test Breakdown category toggles are keyboard-operable (`aria-expanded`, focus rings); remaining tables gained `scope="col"` headers.
- **Polish** — "Onset" relabelled "Avg Onset" with an explanatory tooltip; normalized chip/header styling to the app's `rounded-none` language; the Skin Test Breakdown table scrolls cleanly on mobile.

### Removed
- **Dead code** — deleted the unused `GradeDistributionChart`, `TopAgentsChart`, and the entire dashboard `services/AnalyticsService` (~360 lines reimplemented inline).

### Tests
- New `useCountUp` reduced-motion test and updated Dashboard tests for the separated record/session figures (175 unit tests).

### Notes
- The session-log severity inference on the dashboard remains a heuristic, flagged in-code for clinician review (no behaviour change).

### Chore
- Version bump to 0.61.0

## [0.60.0] — 2026-06-08 (Trend)

Summary: The Reaction History card now shows every serum tryptase sample with its time and value, peak highlighted, instead of "N samples".

### Changed
- **Full serum tryptase results in Reaction History** — when more than one sample was taken, the card previously collapsed them to "3 samples" / "4 samples", hiding the clinically important trend. It now renders a dedicated **Serum Tryptase** table (Sample · Time · Result μg/L) listing every timed sample in order, with the peak value highlighted (bold + a "Peak" tag, legible in black & white). The header chip is reduced to a short "Tryptase: peak X μg/L" summary.

### Tests
- New `PatientHistory.test.tsx` covering multi-sample ordering, peak highlighting + chip summary, single-sample, non-numeric results, legacy free-text, and the no-data case.

### Chore
- Version bump to 0.60.0

## [0.59.0] — 2026-06-08 (Guarded)

Summary: Hardened the clinical record logic with tests, removed a duplicated cross-sensitization rule, and added a Content-Security-Policy.

### Added
- **Content-Security-Policy (report-only)** — `public/_headers` now ships a `Content-Security-Policy-Report-Only` allowlisting only the origins the app uses (Supabase REST/realtime, Sentry, Google Fonts). Shipped report-only first so any missed origin surfaces in the console before the policy is enforced in a follow-up.
- **`getCrossSensitizedDrugs` helper** — a single tested source of truth in `testingUtils.ts` for the Rocuronium↔Vecuronium cross-sensitization drug list.

### Changed
- **Removed duplicated cross-sensitization logic** — the three report components and the two text exporters re-derived the cross-sensitized drug list by string-matching note text; they now all call `getCrossSensitizedDrugs`. Behaviour is unchanged (same Roc-only→Vecuronium, Vec-only→Rocuronium output).
- **Dev-server CSP tightened** — the Vite dev server CSP now matches production for connect/style/img/font/object directives (`script-src` keeps `'unsafe-inline'`/`'unsafe-eval'` as Vite requires in dev).

### Fixed
- **Cleared all npm audit vulnerabilities** — `npm audit` now reports 0 (bumped the `serialize-javascript` override).

### Tests
- New `reportExporter.test.ts` covering the eMR/handout/letter generators (tryptase sentences, positives/negatives/challenge, cross-sensitization, the redact path, manual-entry letters, and edge inputs).
- New `csvUtils.test.ts` covering REDCap import (valid export, missing required columns, quoted/escaped fields, `(choice=…)` parsing, time formats, empty/header-only files).
- New `getCrossSensitizedDrugs` cases in `testingUtils.test.ts`.

### Chore
- Version bump to 0.59.0

## [0.58.0] — 2026-06-08 (Headline)

Summary: Quick Start release notes now use curated changelog summaries instead of the first bullet.

### Added
- **Curated Quick Start release summaries** — `CHANGELOG.md` now supports a `Summary:` line per release, and the generated `changelog.json` uses it for the Quick Start "What's New" modal instead of always taking the first changelog bullet.

### Fixed
- **Existing release summaries can be refreshed** — the changelog sync script still adds missing versions conservatively, but now updates an existing entry's `summary` when explicit `Summary:` metadata is added to the markdown source.

### Tests
- New `generateChangelog` unit coverage for plain and bold summary metadata, first-bullet fallback behavior, and existing-entry summary refreshes.

### Chore
- Version bump to 0.58.0

## [0.57.0] — 2026-06-08 (Legible)

Summary: Safer B&W report printing, corrected handout contact details, and consistent report typography.

### Fixed
- **Patient Handout clinic phone** — corrected the rendered/printed Patient Handout phone from (02) 9515 8814 to (02) 9515 7586. The text export was fixed in v0.51.0 but the on-screen/printed document was missed, so patients were given the wrong number.
- **Black & white print legibility of all three reports** (the clinic printer is B&W):
  - **Clinical Report** drug-challenge outcome now prints as a **solid black** badge + thick black left rule for POSITIVE (Reaction) vs an **outlined** badge for NEGATIVE (Safe) — previously distinguished only by red/green, which is invisible in greyscale (a safe vs reaction confusion risk).
  - **Patient Handout** "AVOID" now prints as a solid black badge with a thick black left rule, and "SAFE" as an outlined badge — previously red/green only, which rendered as near-identical grey.
  - Patient name, section headings, and "AVOID" directives now print in solid black instead of greying out.
- **Per-page patient identifier on every report** — a print-only running header (Name · MRN · DOB) and footer now repeat on every printed page so a physically separated page stays identifiable (new shared `ReportPrintIdentity` component).
- **Powerchart Letter pagination** — tightened trailing spacing and kept the signature block together so the letter no longer spills a near-empty second page.

### Changed
- **Reports visual consistency** — replaced `rounded-lg` with the app's `rounded-none`, unified raw slate surfaces to theme tokens for dark-mode coherence, re-levelled headings (document title h1→h2 so it sits correctly under the page h1), raised the Contact Information heading off sub-12px, and bumped the 7px print timestamp to 9px.
- **Back button touch target** raised to 44px.

### Tests
- New `ReportsPrintSafety` unit tests covering the corrected phone, per-page print identity + heading levels, the B&W challenge and AVOID/SAFE badges, and blank-SPT formatting.

### Chore
- Version bump to 0.57.0

## [0.56.0] — 2026-06-08 (Composer)

### Added
- **Testing plan: protocol selection** — for drugs with more than one skin-test protocol/presentation, the builder now shows a "Protocol Choices" picker so the clinician chooses which protocol goes onto the request. Previously `selectedProtocols` was always empty, so the document, email export, and testing session silently used the first protocol with no way to choose.
- **Testing plan: draft autosave** — the builder's selections (drugs, protocol choices, custom drugs, notes, urgency, documents) are now saved per patient and restored if you leave and return to the LOG screen, under the same 6-hour TTL purge as other patient data. Previously navigating away discarded the whole plan.
- **Testing plan: duplicate-drug guard** — adding a custom drug that already exists in the master list (or in Additional Items) now selects the existing entry and explains why, instead of creating a confusing duplicate on the request.

### Fixed
- **HelpModal no longer hijacks navigation** — opening the app directly on `/dashboard` or `/research` (or auto-opening Quick Start) no longer forces the user back to the Home/LOG screen.
- **`/research` direct route** — loading `/research` now resolves to the Research screen (it was missing from the route map).
- **Grade III severity colour** — dashboard charts now use the shared `status-grade3` token instead of raw red/orange, so severity colours are consistent and contrast-checked.
- **Patient Handout dark-mode contrast** — "AVOID"/"SAFE" drug-name text now has explicit dark-mode colours so it stays legible.

### Changed
- **Testing plan builder UX** — opens by default when a patient is selected; shows a live "N drugs selected" count in the header; "Clear All" now asks for confirmation (and is disabled when empty).
- **Mobile navigation** — the active section now shows its label (not icon-only) and nav controls keep a ≥44px touch target.
- **Research empty state** — clearer "not configured" messaging with explicit status lines (research database / demo mode) and the setup link.

### Accessibility
- Drug toggle buttons expose `aria-pressed`; the custom-drug remove control is now a real, separately focusable button; the reaction-date field caps at today; Pin/History legend icons have tooltips.
- Stronger, consistent `focus-visible` rings across buttons, inputs, and other primitives; closed dialogs no longer capture pointer events; mobile patient cards are keyboard-activatable.

### Tests
- New unit coverage for the testing plan builder and app navigation; new UX-remediation e2e spec.

### Chore
- Version bump to 0.56.0

## [0.55.0] — 2026-06-07 (Carbon)

### Added
- **Per-page patient identifier on the printed Testing Plan** — the testing plan document now repeats a running header (Name · MRN · DOB) and footer (Name · MRN · date of request) on every printed page, so a page that becomes physically separated is still identifiable. Closes a patient-safety gap where page 2 onward carried no patient details.

### Fixed
- **Black & white printer legibility of the Testing Plan document** — the clinic printer is B&W, so elements that relied on colour now survive greyscale: the URGENT banner prints as a solid black bar, "Documents to Chase" badges print as black-outlined chips, the patient name and section/category headings print in black, and all fill-in-the-blank result lines print in solid black instead of faint grey
- **Testing Plan document heading order** — re-levelled headings (h2 → h3 → h4) so the page no longer skips levels or emits a second h1; added `scope="col"` to the skin-test and challenge tables (WCAG)
- **Sub-12px on-screen text** — the protocol-variant label in the skin-test table was 8px on screen; raised to 12px (A4 print density unchanged)

### Style
- **Testing Plan document visual consistency** — replaced `rounded-lg` corners with the app's sharp `rounded-none`, unified raw slate surfaces to theme tokens for dark-mode coherence, and switched the "Print Now" button to the standard primary variant

### Chore
- Version bump to 0.55.0

## [0.54.0] — 2026-06-07

### Style
- **Visual polish: Testing Plan / Request Form card** — unified raw slate surface tokens to theme tokens (`bg-muted`, `bg-muted/30`) for dark-mode coherence; removed phantom hover background from non-interactive section wrappers; replaced native `<input type="checkbox">` with shadcn `Checkbox` for "Include in drug challenge"; lightened CTA button shadow
- **Visual polish: Reaction History card** — fixed timeline dead space, de-noised nested panels, flattened Clinical Features highlights to label/value rows with left-border accent, fixed sub-12px text on symptom chips and metadata, unified surface tokens for dark mode

### Fixed
- **PWA update loop resolved** — removed `clientsClaim` from the workbox service-worker config, which caused an infinite reload cycle on live deployments after a worker update; the Reload Now toast now applies the update cleanly without looping
- **Service-worker update toast** — converted the `showToast.update` call in `index.tsx` to a static import to eliminate the dynamic-import overhead that could delay the update notification
- **PatientTable keyboard navigation** — removed misused `role="button"` from `<tr>` elements; patient rows now use a semantic `<button>` inside the name cell, restoring correct tab order and keyboard activation

### Improved
- **Privacy Policy and Technical Docs** — updated "local-only" framing to "local-first" to accurately reflect that optional research database submissions send only the deidentified research payload to the configured Supabase project; no identifiable patient data is transmitted

### Chore
- E2E test selectors updated for patient combobox UI
- README dev-server port and storage description updated
- Version bump to 0.54.0

## [0.51.1] — 2026-06-04

### Fixed
- **Changelog page was 3 releases behind** — the Quick Start "What's New" banner and the Changelog page read from `changelog.json`, which had drifted to v0.50.2; backfilled v0.50.3, v0.50.4, and v0.51.0 so both now show the current release
- **Multiple "Latest" badges** — the Changelog page tagged every highlighted version as "Latest" (four at once); now only the newest release carries the badge and emphasis styling
- **Quick Start version banner key** — fixed a corrupted localStorage key that tracked the last-seen version

### Added
- **Release dates on the Changelog page** — each version now shows its date next to the version number
- **Automatic changelog sync** — a `prebuild` script regenerates `changelog.json` from `CHANGELOG.md` before every build, so the in-app changelog can no longer fall behind

### Chore
- Version bump to 0.51.1

## [0.51.0] — 2026-06-04

### Fixed
- **Tryptase line always present in eMR letter** — the tryptase sentence now always appears in the PowerChart letter even when no tryptase data was entered in the form; defaults to "Serial serum tryptase samples were not obtained." so one of the three standardised sentences is always present
- **PowerChart paste encoding** — replaced em dashes (`—`) with ASCII-safe separators in the copied eMR letter text; results now paste cleanly into PowerChart and other legacy clinical systems without garbled characters
- **REDCap testing plan: Cis-atracurium** — fixed drug-name mismatch (`Cisatracurium` → `Cis-atracurium`) that caused Cis-atracurium to appear in the testing plan without its IDT protocol steps
- **Patient Handout phone number** — corrected clinic phone in the Patient Handout text export from (02) 9515 8814 to (02) 9515 7586

### Added
- **Referrer email in eMR letter** — if a referring doctor email address is present in the REDCap data, it now appears at the bottom of the PowerChart letter (both the rendered view and the copied text), making it easier to send correspondence directly from the report
- **REDCap testing plan: Sugammadex** — Sugammadex now auto-selects both Alone and + Rocuronium variants when checked in the REDCap testing plan instrument
- **REDCap testing plan: Parecoxib** — Parecoxib now recognised in the REDCap testing plan instrument

### Chore
- Version bump to 0.51.0

## [0.50.4] — 2026-05-14

### Fixed
- **Nav button transitions** — replaced `transition-all` with specific GPU-composited properties on nav pill buttons and menu trigger (missed in the 0.50.3 CSS utility class pass)

### Chore
- Version bump to 0.50.4

## [0.50.3] — 2026-05-14

### Fixed
- **Nav touch targets** — primary nav buttons and menu trigger increased from 36px (`h-9`) to 44px (`h-11`) to meet WCAG 2.5.5 minimum
- **Disclaimer dismiss button** — added `min-h-[44px] min-w-[44px]` to meet touch target requirements; upload link gets `min-h-[24px]`
- **Research page error state** — replaced raw `TypeError: Failed to fetch` with friendly state that detects unconfigured Supabase and shows contextual message
- **section-label font size** — raised from 10px to 11px (above 10px absolute minimum for readable UI text)
- **Select All/None buttons** — text size increased from 10px to 12px for legibility
- **Subtitle text size** — unified to `text-xs` (12px) for all viewports, removing 10px mobile-only sizing
- **Drug category heading semantics** — replaced `<h3>` with `<p>` for label-styled category headers (semantic/size mismatch)

### Changed
- **Transition performance** — replaced `transition-all` with specific GPU-composited properties (`color, background-color, border-color, transform, opacity, box-shadow`) across 5 utility classes
- **Dark mode color-scheme** — ThemeProvider now sets `root.style.colorScheme` so browser-native UI elements (scrollbars, inputs, date pickers) respect dark mode

### Chore
- Version bump to 0.50.3

## [0.50.2] — 2026-05-09

### Changed
- **PWA update notification** — replaced gradient purple DOM overlay (30s auto-dismiss) with persistent Sonner toast (duration: Infinity, close button, Reload now action).
- **Gate auto-update** — when Screen Lock gate is showing, new SW activates silently (no prompt, no work to lose).
- **Visibility-change polling** — registration.update() fires on visibilitychange for faster catch-up after tab is backgrounded.
- **registerType** — renamed from autoUpdate to prompt for accuracy.

### Chore
- Version bump to 0.50.2

## [0.50.1] — 2026-05-09

### Fixed
- **PIN session persistence** — unlock state now survives page reload via sessionStorage; deep-link redirects preserve original route
- **Dark mode header** — header bar now uses `bg-primary` theme token; no more light-blue residue in dark mode
- **Patient dropdown overflow** — popover capped at `max-h-80` with overflow scroll for 44+ patient lists
- **Mobile nav accessibility** — all icon-only nav buttons now carry `aria-label` attributes
- **Quick Start dialog** — added `DialogDescription` for proper `aria-describedby`; removed empty trailing parenthetical `()` in changelog header
- **Contact page** — email addresses are now clickable `mailto:` links with visible focus rings

### Changed
- **PIN gate copy** — reworded to "Screen Lock" with footnoted disclaimer clarifying it prevents shoulder-surfing; patient data security is governed by database access controls

### Chore
- Version bump to 0.50.1
## [0.50.0] — 2026-05-06

### Added
- **Print pagination** — CSS page-break rules prevent orphaned headings and split drug entries across pages in all three report types
- **Report generation timestamps** — footer on Clinical Report, PowerChart Letter, and Patient Handout shows when the report was saved (uses activeReportSavedAt)
- **Redacted view toggle** — new EyeOff button in the report tab bar replaces patient identifiers with ——- for demos and training; ephemeral (not persisted, print always shows full data)
- **Redact context provider** — useRedact.tsx hook provides isRedacted, toggleRedact, and redact() across all report components and text exports
- **Controls empty state** — Clinical Report shows No controls recorded when all control values are empty
- **Unit tests for testingUtils** — covers isSkinTestPositive, getPositiveResults, getNegativeResults, getCrossSensitizationNotes, buildRecommendations
- **Unit tests for deidentify** — 15 test cases covering name stripping, REDCap passthrough, challenge handling, legacy IDT fields, custom drug names

### Changed
- **ResearchDrugResult type** — idt_100, idt_10, idt_neat consolidated to single idt_results string field
- **ResearchDashboard** — IDT columns consolidated to match new type
- **testingDataFactory** — added missing selectedProtocols to TestingPlanData factory
- **Print headers** — section-card wrappers added to all major report sections

### Fixed
- **Flaky SPT input test** — simplified assertion from waitFor + toHaveValue to direct .value check after fireEvent.change

## [0.49.0] — 2026-05-06 (Pancuronium)

### Added
- **Tryptase paragraph in eMR letter** — new Tryptase section in the testing form captures whether samples were obtained, whether there was clinically significant dynamic elevation, and up to 4 timed sample values; renders as one of three standardised sentences in the PowerChart letter
- **Roc/Vec cross-sensitization** — if Rocuronium tests positive, a cross-sensitization note for Vecuronium is automatically added to both reports (and vice versa); cross-sensitized drug also appears in the AVOID list
- **Restructured Recommendations** — eMR letter and clinical report now lead with `AVOID [DRUG]` in bold for each positive result, followed by standardised bullets (updated eMR allergy, GP/MyHealth Record, MedicAlert for muscle relaxants, patient copy of letter); all-negative records show "No evidence of IgE-mediated allergy to medications tested."
- **Nursing Notes section** — collapsible blue card in the testing form for pre-testing, during, and post-testing observations plus nurse sign-off; renders in the clinical report only (excluded from the eMR PowerChart letter)
- **IV drug challenge in eMR letter** — challenge outcome (tolerated / reaction with details) now appears as a dedicated "Drug Challenge" block in the PowerChart letter
- **REDCap testing-plan parity** — app now reads the explicit testing-plan instrument checkboxes from the REDCap CSV and uses them as the source of truth for auto-selecting drugs; falls back to reaction-drug inference when not present; includes documents-to-chase parsing
- **6-hour report retention** — active report is persisted to localStorage with a 6-hour TTL; a banner on the log screen shows the active report with Open/Clear actions; "Exit" no longer clears the report

### Changed
- **eMR letter simplified** — removed SPT/IDT measurement table; eMR letter now lists drug names only (measurements stay in the full clinical report)
- **Patient handout** — AVOID list now includes cross-sensitized drugs with a "cross-sensitization risk" note

## [0.48.0] — 2025-05-16 (Atracurium)

### Fixed
- **Phone number** — updated contact number to (02) 9515 7586
- **Parecoxib IDT** — removed 1:1,000 dilution step from skin testing protocol
- **Propofol consolidation** — collapsed from two protocols to single IV protocol; removed IDT 1:100 step
- **Sugammadex multi-protocol selection** — Sugammadex Alone and +Rocuronium can now be selected simultaneously without deselecting each other
- **Print headers/footers** — suppressed browser-generated headers (URL, date, page numbers) in Chrome/Edge via `@page { margin: 0 }` with compensating body padding
- **Empty result fields** — changed input type from `number` to `text` with `inputMode="decimal"` so the "-" placeholder displays correctly on all browsers

### Added
- **Drug persistence from testing plan** — drugs selected in the testing plan now carry over to the testing panel when proceeding, pre-populating the test grid
- **`toggleDrugProtocol`** — new hook function allowing per-protocol drug toggling for multi-variant drugs

## [0.47.0] — 2026-05-14 (Neostigmine)

### Fixed
- **Toast notifications** — removed rounded corners from toast notifications for consistent clinical aesthetic
- **Print background** — forced pure white background in print view via CSS variable override
- **Print section headers** — removed gray backgrounds from section headers in print view
- **Signature lines** — signature fields now use bottom border with writing space above

## [0.46.0] — 2026-03-26 (Neostigmine)

### Added
- **Multi-sample tryptase model** — REDCap CSV now parses up to 4 timed tryptase samples (`Serum Tryptase Time/Result` × 4) per patient; clinic investigation fallback (`Biochemical Results: Tryptase 1–4`) also supported
- **Tryptase display with timestamps** — patient history card shows `T1 (08:45): 12 ng/mL · T2 (10:30): 45 ng/mL` for multi-sample data; single-string values from mock data display unchanged
- **Audit export updated** — `Tryptase` column in de-identified CSV serialises all samples as semicolon-separated entries

## [0.45.0] — 2026-03-26 (Suxamethonium-B)

### Added
- **Mock testing session logs** — 12 clinically realistic `LogFormData` records seeded on first load; powers "Recent Skin Testing Activity" in the Clinical Dashboard for demo
- **Mock patient coverage test** — 9 machine-checkable Vitest assertions guard NMBA / antibiotic / NSAID / Grade I–IV / Completed / Chlorhexidine+Latex coverage in `MOCK_PATIENTS`
- **NSAID mock patient** — Natalie Brennan (Aspirin/Celecoxib, Grade II, MRN 44) added to fill coverage gap
- **E2E testing day flow** — Playwright spec covering full hero workflow: patient select → drug grid → save → Clinical Report → print → Dashboard → Recent Testing Activity

---

## [0.44.0] — 2026-03-25 (Suxamethonium)

### Added
- **Drug protocol library** (`drugMasterlist.ts`) — SPT concentration, IDT dilution steps, and challenge flags for all 70+ supported drugs
- **Dynamic IDT columns** — testing grid columns driven by per-drug protocol (replaces hardcoded idt100/10/Neat columns)
- **Multi-variant protocol picker** — drugs with multiple protocols (e.g. Penicillin Major/Minor) show a variant selector
- **Custom protocol editor** — users can override SPT concentration, IDT dilution steps, and challenge flag per drug per session
- **Drug search/filter** — filter field in testing form and plan generator
- **Proton Pump Inhibitors category** — Esomeprazole, Lansoprazole, Omeprazole, Pantoprazole added to drug list

### Changed
- Reports updated with dynamic IDT result display + legacy fallback for older records

---

## [0.43.0] — 2026-03-23 (Rapacuronium)

### Added
- **Skeleton loaders** — PatientTable shows 10-row shimmer skeleton (desktop) / 5-card shimmer (mobile) while mock data loads asynchronously on first render
- **Context-aware empty states** — PatientTable now distinguishes between "no data loaded" (Upload icon + CTA) and "no filter matches" (italic hint), instead of a single generic message
- **Research shimmer** — ResearchDashboard replaces spinning icon with 4 shimmer bars during Supabase fetch
- **Export SkeletonText / SkeletonCard** from `components/ui/index.tsx`

### Changed
- `isLoadingPatients` flag threaded from `usePatientState` → `useAnaestheticApp` → `App.tsx` → `Dashboard` → `PatientTable`

---

## [0.42.0] — 2026-03-22 (Pancuronium)

### Changed
- **Bundle optimisation** — mock patient data lazy-loaded as a separate on-demand chunk (~44 kB removed from initial load); `react-hot-toast` removed from `notifications` manualChunks (stale entry)
- `requestAnimationFrame` replaces `setTimeout(50ms)` for chart animation trigger in Dashboard

---

## [0.41.0] — 2026-03-22 (Orocuronium)

### Added
- **Sonner toasts** — migrated all notifications from `react-hot-toast` to shadcn Sonner (`<Toaster />` already mounted); toast calls in Dashboard, ScreenLayout, HelpModal, and ResearchDashboard now use `title` + `description` API
- Save success toast after test record submission
- Delete feedback toasts in ResearchDashboard (success + error with detail)

### Fixed
- Silent broken toasts — `react-hot-toast` had no `<Toaster>` mounted; all CSV upload and save messages were swallowed

---

## [0.40.0] — 2026-03-21 (Neostigmine)

### Added
- **Required field indicators** (`*`) on Visit Date and "Select Drugs to Test" labels
- **Inline validation error summary** (role="alert") above submit button in TestingLogForm
- **Submit spinner** (Loader2) on save button while submitting
- **"Other" drug row validation** — custom name must be specified before saving

### Fixed
- `aria-label` replaces `title` on lucide Pin and History icons (TS prop error)
- Missing required fields in `testingDataFactory.ts` (`urgent`, `reactionDate`, `documentsToChase`)

---

## [0.39.0] — 2026-03-21 (Mivacuronium)

### Fixed
- ESLint error: removed unused `Plus` import from `App.tsx`
- ESLint: added `coverage/` to ignores to prevent false unused-directive errors
- TS: created missing `hooks/use-mobile.ts` (standard shadcn `useIsMobile`)
- TS: fixed `AdvancedSearchFilters` import alias in `PatientTable.tsx`
- TS: tightened `suggestions` type in `PatientTableProps` to explicit object shape
- TS: replaced `title=` with `aria-label=` on lucide icons in `TestingPlanGenerator.tsx`

---

## [0.38.0] — 2026-03-20 (Laudanosine)

### Added
- Lazy-loaded 7 feature modules (Dashboard, TestingLogForm, ClinicalReport, PatientHandout, PowerchartLetter, TestingPlanPrintView, ResearchDashboard) — initial bundle reduced by ~114 kB

### Changed
- Complete `src/` migration; all root shim directories deleted
