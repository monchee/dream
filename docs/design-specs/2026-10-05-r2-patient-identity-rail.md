# R2 — Persistent Patient Identity Rail (shape specification)

**Date:** 2026-10-05 · **Surface mode:** Operate · **Status:** Spec only — not approved for implementation
**Source audit:** `docs/audits/2026-10-05-design-ux-audit.md` (R2, lines 199–205)
**Plan:** `plans/003-dream-safety-refactor-shape-specs.md` (Milestone 3)

## 1. Job and audience

Every clinical action in DREAM is taken **for one specific patient**. The current context bar lays identity out as a horizontal sentence inside an `overflow-x-auto` / `min-w-max` strip (`ClinicalContextBar.tsx:141–186`), and on phones the page title, draft/report badges, and actions share one row with it (`AppTopBar.tsx:54–84`). A long surname, long ID, or 125% font scaling can push the DOB or REDCap ID off-screen — a wrong-patient risk, not a cosmetic one.

Primary user: any clinician about to record a result, print a document, or submit research for the displayed patient.

## 2. Outcome and proof

- Family name, given name, REDCap ID, and DOB are visible **together, without interaction**, at 375px, 768px, 1280px, and 125% scaling.
- The primary identity never scrolls horizontally and is never truncated.
- Proof: automated visual assertions at the three widths plus a long-string fixture (longest realistic surname + longest ID + 125%).

## 3. Selected direction and structural thesis

Replace the scrolling sentence with a **fixed identity rail**: a dedicated safety surface inside the content area, distinct from app navigation and app status.

- **Desktop/tablet:** one always-visible identity block pinned above the work area: family name (semibold, uppercase) + given name on the first line; REDCap ID and DOB as labelled mono values on the second line. Secondary data (reaction date, visit date, source) moves into an inline details disclosure at the rail's end.
- **Mobile:** the identity rail gets its own row **below** the top bar and above content; the page title keeps its own row. Top-bar badges and actions no longer compete with identity for space.
- Long values **wrap**, never truncate and never scroll. The rail is the same height at a given breakpoint regardless of value length (wrapping changes height predictably).

Thesis: identity is a safety rail, not a status sentence. It is always the same component in the same place on every clinical screen (log, testing, print plan, reports), so "whose record am I touching" has one answer.

## 4. Scope and boundaries

- **In scope:** `ClinicalContextBar` (replacement), its composition points (`LogScreen`, `TestingScreens`, `SummaryScreen`, print plan screen), and the mobile top bar's title/badge row.
- **Out of scope:** the sidebar/topbar navigation consolidation (complete — do not revisit), the PIN lock screen (R4), redaction logic (behaviour preserved as-is).
- **Depends on R1** for composition inside the testing cockpit (rail above the record lane; R1 must not duplicate identity).

## 5. States and realistic content ranges

| State | Behaviour |
|---|---|
| No patient | Rail renders `NO IDENTITY ENTERED` (existing wording) in muted ink; no empty gaps. |
| Manual patient | REDCap ID shows the manual value; secondary ID goes in the disclosure. |
| Redacted | Redaction applies to every identity field including the disclosure (behaviour preserved). |
| Long values | 30-char surname + 12-char ID + full DOB wrap to a third rail line; nothing clips. |
| 125% scaling | Rail wraps to at most one extra line; Save/Next and tab order unaffected. |
| Patient switch | Existing confirmation dialog unchanged; rail updates only after confirmation. |

## 6. Layout, interaction, responsive, accessibility, constraints

- **Wireframe (1280px):** `[FAMILY, Given | REDCap 123456 | DOB 01/05/1980 | ▸ details]` — single row, wraps to two lines at long values.
- **Wireframe (375px):** row 1: `FAMILY, Given`; row 2: `REDCap 123456 · DOB 01/05/1980`; row 3: `▸ details` — full-width stack inside one bordered rail block.
- **Interaction:** the details disclosure is a native-disclosure-pattern button; opening it never moves the primary fields; patient-switch affordance keeps its current position and confirmation.
- **Accessibility:** rail is one landmark region (`aria-label="Active patient identity"`); reading order = family, given, REDCap, DOB; disclosure content is excluded from the rail's accessible name; AA contrast both themes; 44px disclosure target.
- **Constraints:** semantic tokens; zero radius; no horizontal scroll (`overflow-x` is banned in the rail); no truncation of the four primary fields; print identity is governed by the print primitives, not this rail.

## 7. Proposed DESIGN.md replacement section

> `## Patient Identity Rail and Anti-Mix-Up Context`
>
> Replaces the `ClinicalContextBar` guidance inside the clinical workbench section (DESIGN.md:167–168) and sharpens the no-overflow requirement (DESIGN.md:232–235). The identity rail is a safety surface, not a navigation surface: family name, given name, REDCap ID, and DOB are permanently visible together, wrap instead of truncating, never scroll horizontally, and occupy a dedicated row on mobile. Secondary dates and source live in a disclosure that does not displace the primary fields. Redaction and patient-switch confirmation apply to the rail in all states.

## 8. Open decisions and anti-goals

- **Open:** whether the rail pins (`sticky`) during long-page scrolls at desktop widths, or remains in flow with the existing "identity bar stays visible while scrolling" e2e behaviour — decide with the R1 cockpit prototype.
- **Open:** whether source ("database"/"manual") belongs in the disclosure or as a small suffix chip.
- **Anti-goals:** no marquee/scrolling values; no abbreviation of DOB; no merge with draft/report status badges; no new accent colours; no duplicated identity inside section content.
