# R3 — Risk-Graded Clinical Outputs (shape specification)

**Date:** 2026-10-05 · **Surface mode:** Operate · **Status:** Spec only — not approved for implementation
**Source audit:** `docs/audits/2026-10-05-design-ux-audit.md` (R3, lines 207–213)
**Plan:** `plans/003-dream-safety-refactor-shape-specs.md` (Milestone 3)

## 1. Job and audience

On the report screen, printing, copying, emailing, and research submission currently sit in one visual family (`SummaryScreen.tsx:211–267`) even though they have completely different risk profiles: printing and copying stay on the machine; email leaves it; research submission transmits a de-identified payload to a registry. During a busy clinic the safe local action should be the easiest to find, and anything that leaves the device should announce itself before it is clicked, not only inside the confirmation dialog (`OutboundActionDialog.tsx:135–218`).

Primary user: the clinician finalising a consultation who must choose the right output channel under time pressure.

## 2. Outcome and proof

- A clinician can correctly name each action's destination (local vs external vs research) **before activating any button**.
- The local print action is the visually dominant action in the group.
- Proof: comprehension check of the action group at 375px and 125% scaling; every external action's destination is stated on its control.

## 3. Selected direction and structural thesis

Rebuild the output area as **three risk tiers**, ordered by data boundary:

1. **Local clinical output (dominant):** Print as the primary button (existing visual treatment, top placement). Copy as a secondary utility in the same tier — explicitly labelled as local.
2. **External destination (visually separated):** Email in its own grouped zone with the destination address shown on or beside the control ("leaves this device → SLHD-RPA-allergynurses@…").
3. **Research submission (separated further):** Its own zone stating that only the de-identified research payload is transmitted; keeps duplicate-submission protection and the existing confirmation flow.

Thesis: the hierarchy does the safety work **before** the dialog opens. Confirmation dialogs verify a understood intent; they do not educate.

## 4. Scope and boundaries

- **In scope:** the report screen output actions group, the `OutboundActionDialog` content per tier, and their status feedback (success/failure/retry).
- **Out of scope:** report content and print CSS (governed by the U4 print policy), research payload contents, network layer, duplicate-submission logic.
- **Preserves:** local-first processing (PRODUCT.md:25–31) — no new external service, no auto-send, no background transmission.

## 5. States and realistic content ranges

| State | Behaviour |
|---|---|
| Report ready | Three tiers visible; print dominant; no action pending. |
| Research already submitted | Research tier shows submitted state with timestamp; control disabled with explanation. |
| Research in progress | Progress state scoped to the research zone only; other tiers remain usable. |
| Research failure | Inline error in the research zone with Retry; no global toast dependency. |
| Offline | External email and research tiers render their offline explanation and disable; local print/copy remain fully available. |
| Redacted report | Tier copy reflects redaction state (existing behaviour preserved). |

## 6. Layout, interaction, responsive, accessibility, constraints

- **Desktop:** three stacked zones with clear tier separation; print zone first.
- **375px:** zones stack vertically in the same priority order; each control ≥44px; destination text wraps.
- **Interaction:** keyboard order follows tier order (print → copy → email → research); focus moves into the confirmation dialog on open and restores to the triggering control on close (existing behaviour preserved); status announcements via `aria-live` for submission results.
- **Accessibility:** each control's accessible name includes its destination class (e.g. "Email to Allergy Nurse (leaves this device)"); tier zones are labelled groups; AA contrast both themes.
- **Constraints:** semantic status tokens for tier emphasis (warning/neutral — no new colours); zero radius; no alarm-styling that suggests danger for legitimate clinical email; no icons alone carrying risk meaning (text labels always present).

## 7. Proposed DESIGN.md replacement section

> `## Risk-Graded Clinical Outputs`
>
> Replaces generic output-action guidance with an explicit local-versus-external hierarchy aligned with the semantic status rules (DESIGN.md:177–182) and privacy requirements (DESIGN.md:314–330). Clinical output actions are grouped into three tiers by data boundary — local output (print dominant, copy utility), external destination (destination stated on the control), and research submission (de-identified payload stated, separated from ordinary output). The action hierarchy must communicate the data boundary before any confirmation opens; confirmations verify intent, never introduce it. Local actions remain available offline.

## 8. Open decisions and anti-goals

- **Open:** exact visual weight of the "external" zone (bordered group vs background tint) — decide in concept selection against the audit's "no alarming noise" caution.
- **Open:** whether research submission stays on the report screen or links to the research dashboard — product decision, not visual.
- **Anti-goals:** no hiding email/research behind menus (discoverability); no modal-only risk communication; no new destructive-styling for non-destructive actions; no telemetry or network calls beyond the existing research submission path.
