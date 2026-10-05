# R4 — Quiet Lock Station (shape specification)

**Date:** 2026-10-05 · **Surface mode:** Operate · **Status:** Spec only — not approved for implementation
**Source audit:** `docs/audits/2026-10-05-design-ux-audit.md` (R4, lines 215–221)
**Plan:** `plans/003-dream-safety-refactor-shape-specs.md` (Milestone 3)

## 1. Job and audience

The lock screen is the first thing clinic staff see on every shared terminal. The current implementation is the most decorated surface in the product: full-screen animated blurred radial fields, drifting architectural grid, glow pulse, and a convergence spectacle (`PasswordGate.tsx:82–122`, `index.css:465–518`, `585–608`) — all contrary to the design system's own bans on decorative gradients and bouncy motion (DESIGN.md:314–329), and all paid for on the first paint in a procedure room.

Primary user: a nurse or clinician unlocking a shared workstation between patients — speed and calm matter more than anything.

## 2. Outcome and proof

- First interactive paint is fast (no large blurred animated layers); unlock is reachable immediately at 375px and 125% scaling.
- The screen reads as clinical, honest, and quiet: one lock state, one high-contrast PIN module, one restrained error state.
- Proof: visual review in both themes; reduced-motion and offline behaviour verified; no animated blur/grid/glow elements present in the DOM.

## 3. Selected direction and structural thesis

Keep the rectangular lock-station structure and the masthead identity; **remove the spectacle**. Replace the ambient animated fields with a flat masthead surface (existing `--masthead` tokens) over the plain `--background`. The lock card becomes one clear state machine:

- **Locked (default):** masthead + app name + "Privacy screen" wording + rectangular PIN module (four 44px fields) + unlock control.
- **Verifying/unlock animation:** the existing brief transition, minus convergence effects.
- **Error:** inline message + field shake replaced by a **non-motion error treatment** (border + message colour change); announcement via `aria-live` (already present).

Thesis: the lock screen's job is orientation and honest privacy, not ambience. Every decorative layer removed is a faster, calmer first impression.

## 4. Scope and boundaries

- **In scope:** `PasswordGate` presentation layer and its dedicated CSS (`index.css` lock-station and ambient-field blocks).
- **Out of scope (explicitly):** the PIN value, its storage, validation model, and session behaviour — the 2026-06-12 by-design ruling and its 2026-10-05 reaffirmation stand; credential handling is outside R4 entirely. Also out: the disclaimer banner and post-unlock routing.

## 5. States and realistic content ranges

| State | Behaviour |
|---|---|
| Locked | Masthead, privacy wording, PIN module, unlock control. |
| Partial entry | Fields advance automatically (existing behaviour). |
| Incorrect PIN | Non-motion error state: destructive border on the module, inline message, `aria-live` assertive announcement, fields cleared, focus returned to first field (existing). |
| Unlocking | Brief opacity/translate exit (existing, ≤300ms). |
| Reduced motion | No ambient animation exists to disable anymore; exit transition collapses per existing `prefers-reduced-motion` rules. |
| Offline | Identical — no font or asset fetch beyond the self-hosted font (M1). |

## 6. Layout, interaction, responsive, accessibility, constraints

- **Desktop:** masthead strip (existing tokens) above a centred, left-aligned lock card; version string visually subordinate at the card's foot.
- **375px:** card fits the first viewport; fields stay 44px; no horizontal scroll.
- **125% scaling:** module wraps gracefully; wording remains visible.
- **Interaction:** paste, auto-advance, backspace, Enter, and focus restoration behaviour unchanged (all shipped and tested); the four fields keep labels, instructions, invalid state, and assertive feedback.
- **Accessibility:** unchanged PIN semantics (labels, `aria-describedby`, status) — this spec changes presentation only; AA contrast in both themes using masthead/card tokens.
- **Constraints:** zero radius; semantic tokens only; **no gradients, no blur, no glow, no grid overlay, no pulse**; the privacy wording keeps its honest "shoulder-surfing protection, not enterprise access control" framing.

## 7. Proposed DESIGN.md replacement section

> `## Privacy Screen Lock Station`
>
> Replaces the decorative lock-station treatment implied by the masthead guidance (DESIGN.md:159–165) and clarifies the PIN rule (DESIGN.md:314–323). The lock station is a quiet clinical privacy surface: flat masthead, one lock state, a high-contrast rectangular PIN module, and a restrained non-motion error state. Decorative ambience (animated blur fields, grid drift, glow pulse, convergence effects) is prohibited on this surface. The four-digit PIN remains a shoulder-surfing safeguard, not enterprise access control; its storage and validation model are out of scope for visual guidance.

## 8. Open decisions and anti-goals

- **Open:** whether the masthead keeps the SCRATCH red identity edge (`--masthead-edge`) on the lock screen or reserves it for in-app chrome — decide in concept selection.
- **Open:** exact wording of the privacy line (keep current honest framing; only shorten if it wraps at 375px/125%).
- **Anti-goals:** no decorative motion of any kind; no app icon redesign; no change to PIN handling; no spinner-only feedback; no auto-focus traps beyond the existing PIN behaviour; no removal of the version string (kept, subordinate).
