# Security Policy

The DREAM App is private clinical tooling for the Royal Prince Alfred Hospital Department of Clinical Immunology & Allergy workflow.

## Reporting Security Issues

Do not open public GitHub issues for security concerns, suspected data exposure, patient privacy incidents, or vulnerabilities.

Report concerns through the internal DREAM development/support channel or the RPAH Department of Clinical Immunology & Allergy escalation path. Include:

- A short description of the concern.
- The affected app version or release URL, if known.
- Steps to reproduce, using demo or synthetic data only.
- Screenshots only if they contain no patient identifiers.
- Whether any real patient, REDCap, or research data may have been involved.

## Patient Data Rules

- Do not commit REDCap exports, patient data, identifiable screenshots, generated reports, or printed-document captures.
- Use demo or synthetic data for testing, debugging, screenshots, and issue reproduction.
- Treat local browser storage, downloaded files, and print/PDF outputs as clinical data when they contain identifiers.
- If you suspect identifiable data has been committed or exposed, stop work and escalate immediately through the internal clinical/support path.

## Security Model

DREAM is local-first. During normal clinical use, identifiable patient data is processed in the browser from local REDCap exports and is not sent to an application backend. The optional research submission path was removed in v0.91.0; no clinical data leaves the device through the application.

The app's screen lock reduces shoulder-surfing risk on shared workstations. It is not an authentication system and does not replace institutional device, network, REDCap, or cloud access controls.

## Supported Versions

Use the latest released version from the private repository and production Cloudflare Pages deployment. Security fixes are handled as new releases.
