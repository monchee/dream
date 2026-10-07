# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Clinical immunologists/allergists, allergy nurses, and authorised clinical staff assessing perioperative anaesthetic allergic reactions, planning skin prick and intradermal testing, recording clinical observations and results, and generating patient and specialist documentation.

## Product Purpose

DREAM (Drug Reaction Evaluation & Anaesthetic Management) is a local-first clinical workbench for anaesthetic drug allergy assessment, structured skin testing planning and execution, and clinical consultation report generation. It assists clinical workflows by providing structured testing dilutions and interpretation recording while processing clinical data locally in the browser.

## Positioning

Local-first clinical decision-support and documentation workbench built for perioperative anaesthetic drug allergy investigations, executing clinical calculations, testing workflows, and report generation locally in the browser. No clinical data leaves the device.

## Operating Context

Hospital clinic workstations, allergy procedure rooms, and shared clinical terminals. Operates in fast-paced clinical environments where workstations are shared among clinical staff, utilising PIN-based screen-lock shoulder-surfing protection. Common workflows include ingesting REDCap CSV exports, selecting suspected perioperative agents, referencing documented non-irritating test concentrations, logging wheal and flare measurements in real-time during clinic appointments, and generating printable A4 consultation letters, patient advice sheets, and testing sheets.

## Capabilities and Constraints

- Local-first architecture: All patient record parsing, test calculations, report generation, and session state remain in local browser storage (sessionStorage/localStorage with configurable TTL purge).
- Shoulder-surfing protection: 4-digit PIN screen-lock to shield patient information on shared hospital computers without replacing enterprise infrastructure access controls.
- Protocol reference: Documented skin prick test (SPT) and intradermal test (IDT) concentrations and dilution sequences.
- Print-formatted outputs: A4 printable clinical consultation letters, patient handouts, and nurse testing sheets structured with dedicated print page-break styling.
- Technology stack: React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui component primitives, lucide-react icons, Vitest, Playwright.

## Brand Commitments

- Name: DREAM (Drug Reaction Evaluation & Anaesthetic Management)
- Institutional alignment: NSW Health visual cues (NSW Health Navy #002664, NSW Blue #146CFD, high-contrast accessibility).
- Visual language: Clinical Workbench — sharp-edge (radius-zero) architecture, Public Sans typography, dense structured layouts, and clear severity grade color-coding.

## Evidence on Hand

- Complete working TypeScript/React frontend implementation with unit and integration test suites.
- Curated drug masterlist dataset containing perioperative anaesthetic agents, non-irritating concentrations, IDT steps, and cross-reactivity rules (`src/shared/data/drugMasterlist.ts`).
- Structured report templates for specialist letters, patient handouts, and clinical testing sheets.

## Product Principles

1. Patient Privacy & Local-First Processing: Patient data is processed locally in the browser session during standard operation; no external server transmission for patient identifying data.
2. Clinical Structure: Documented dilution protocols, positive/negative control recording, and severity grading support structured clinical documentation.
3. Ergonomic Clinical Density: High scannability, rapid keyboard and mouse data entry, clear visual hierarchy, and robust contrast designed for clinical and procedural environments.
4. Print Layout Intent: Consultation reports, patient handouts, and testing plans incorporate print-specific styling and page-break rules intended for physical A4 printing and document scanning workflows.

## Accessibility & Inclusion

- Designed toward WCAG 2.1 AA contrast and accessibility targets across light and dark theme surfaces.
- Robust keyboard navigation with visible focus rings (`*:focus-visible`), skip-to-content links, logical tab ordering, and screen-reader accessible form controls and tables.
- Accessible typography with dynamic font size scaling support (85% to 125%).
