# R1 — Two-Speed Testing Cockpit (shape specification)

**Date:** 2026-10-05 · **Surface mode:** Operate · **Status:** Spec only — not approved for implementation
**Source audit:** `docs/audits/2026-10-05-design-ux-audit.md` (R1, lines 191–197)
**Plan:** `plans/003-dream-safety-refactor-shape-specs.md` (Milestone 3)

## 1. Job and audience

The nurse running a skin testing session must record wheal/flare measurements the moment the patient is tested, while occasionally consulting — not operating — protocol configuration. Today the active section presents one dense wall of controls of equal visual rank: recording fields, protocol selectors, custom dilution editors, notes. On a 375px phone or a shared terminal, finding "where do I type the wheal I just measured" is a visual search repeated for every drug.

Primary user: allergy nurse mid-procedure, standing, possibly gloved, often interrupted. Secondary: the immunologist reviewing progress between sections.

## 2. Outcome and proof

- A measurement can be entered within one visual fixation of the section's first paint, without scrolling past configuration.
- Draft state never changes when expanding or collapsing the configuration lane.
- Proof: a nurse can complete "record all SPT wheals for 5 drugs" with zero interaction with the plan lane; usability check with a 375px device and 125% font scaling.

## 3. Selected direction and structural thesis

Keep the seven-step workflow index unchanged (it works). Rebuild the active section as **two speeds**:

1. **Record now lane (primary, always visible):** the wheal/flare measurement grid, challenge observations, and the section's Save/Next actions. Visually dominant, largest touch targets, first in DOM and reading order.
2. **Plan and reference lane (secondary, disclosed):** protocol selection, custom concentrations, document chasing, optional notes. Collapsed by default on mobile; summarized (not hidden) with a one-line status ("Protocol: standard · 3 dilutions") so its state is recognizable without opening.

Thesis: frequency of use — not information completeness — decides layout rank. The cockpit's primary speed is recording; the plan lane serves the slower planning speed performed once per session.

## 4. Scope and boundaries

- **In scope:** the active-section body of the testing workflow (`TestingLogForm`, section content components: `DrugTestPanelSection`, `DrugTestGrid`, and the per-section wrappers).
- **Out of scope:** the seven-step index (`TestingWorkflowIndex` — already split and conforming), the plan generator (`TestingPlanGenerator`), draft persistence, validation logic, and all clinical thresholds.
- **Composes with R2:** the sticky identity area comes from the identity rail spec; this spec does not duplicate identity content.

## 5. States and realistic content ranges

| State | Behaviour |
|---|---|
| Loading | Section skeleton; record lane placeholder preserves layout height. |
| Empty | No drugs selected → record lane shows the empty-state with a link into the plan lane. |
| Recording | Default state; fields keyboard-reachable in grid order. |
| Unsaved / dirty | Draft indicator (existing `DraftSaveIndicator`) remains in the shell; record lane shows no duplicate. |
| Positive result | +POS treatment (existing) unchanged; the record lane must not reflow when it appears. |
| Error / invalid | Validation message beside the offending field (existing pattern), never as a modal. |
| Locked (PIN) | Out of scope — shell behaviour. |

Content ranges to design for: 1 drug (minimum), 8–12 typical, 90 drugs (maximum observed in e2e), 0–6 IDT dilutions per drug, notes 0–500 chars.

## 6. Layout, interaction, responsive, accessibility, constraints

- **Desktop (≥1280px):** record lane left/full width; plan lane as a right rail disclosure or collapsible panel below — collapsed state persists per session.
- **Tablet (768px):** same priority order; plan lane full-width below the record lane, collapsed by default.
- **375px mobile:** record lane first, Save/Next reachable within the first viewport; plan lane behind a full-width disclosure button; no horizontal scrolling anywhere.
- **125% font scaling:** record lane fields keep 44px hit areas and wrap; nothing clips (verify at all breakpoints).
- **Interaction rules:** moving between measurements never loses draft state; disclosure state is not part of the clinical draft; validation anchors beside fields; focus order: record lane → section actions → plan lane.
- **Accessibility:** semantic tokens only; zero radius; 44px targets below `xl`; visible focus; screen-reader labels per drug row (already shipped in M1); AA contrast in both themes.
- **Constraints:** no decorative motion; entrance animations must not delay interaction; no changes to clinical thresholds, dilution math, or validation rules.

## 7. Proposed DESIGN.md replacement section

> `## Testing Cockpit: Two-Speed Bedside Operation`
>
> Replaces the general guidance under "High-Density Clinical Utility" (DESIGN.md:116–121) and the responsive testing notes (DESIGN.md:228–230). The active testing section presents two ranked speeds: the record-now lane (measurements, observations, and section save/next) is always visible and first in DOM order; the plan-and-reference lane (protocol configuration, custom concentrations, documents, optional notes) is disclosed and summarized. Configuration must never separate a measurement field from the section's primary action. All cockpit controls meet the 44px target below the desktop density breakpoint; validation is field-anchored; draft state is independent of disclosure state.

## 8. Open decisions and anti-goals

- **Open:** whether the plan lane lives as a right rail (desktop) or a bottom disclosure at all widths — decide in concept selection with a live prototype.
- **Open:** whether the disclosure summary line is per-section or global; per-section matches the mental model better.
- **Anti-goals:** no new visual world; no sticky footers that cover fields at 375px; no modal dialogs for validation; no auto-expanding configuration; no removal of any clinical field.

*Note: fullPage screenshot ghost rows are a known capture artifact of entrance animations, not a defect, unless corroborated in source (`docs/audits/2026-10-05-design-ux-audit.md:361`).*
