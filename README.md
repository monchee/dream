# The DREAM App

<div align="center">
<img width="1200" height="475" alt="Clinic Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

*Safe sleep, clear answers*
</div>

**DREAM** — Drug Reaction Evaluation & Anaesthetic Management.

A private clinical Progressive Web App for the Royal Prince Alfred Hospital Department of Clinical Immunology & Allergy. DREAM supports anaesthetic allergy workups from REDCap patient import through testing plans, clinical test logging, patient-facing handouts, and eMR-ready reports.

## Project Status

- **Current version:** v0.92.0
- **Live app:** [dream.yuson.au](https://dream.yuson.au)
- **Repository:** private/internal clinical tooling
- **Production host:** Cloudflare Pages
- **Release notes:** [GitHub Releases](https://github.com/monchee/dream/releases)
- **Data model:** fully local-first browser processing; no clinical data leaves the device

## Features

### Patient Workflow
- Import patient records from REDCap CSV exports.
- Search, filter, and review patient reaction histories.
- Review a missing-information checklist and high-risk clinical context before testing.
- Create manual patient entries when a record is not in the imported database.
- Keep in-progress testing data browser-local with time-limited persistence.

### Testing Plans
- Generate personalised testing plans from patient history and drug categories.
- Select protocol variants when a drug has more than one testing protocol or presentation.
- Autosave testing-plan builder drafts per patient under the same 6-hour TTL as other active clinical data.
- Print nursing request forms with B&W-safe styling and per-page patient identifiers.

### Testing and Reporting
- Record skin prick testing, intradermal testing, and IV challenge outcomes.
- Generate Clinical Report, Patient Handout, and Powerchart Letter views.
- Print reports with black-and-white safe AVOID/SAFE and positive/negative styling.
- Repeat patient identity in print headers/footers so separated pages remain identifiable.
- Copy eMR-ready text from reports where appropriate.

### Review
- View dashboard summaries of recent clinical activity and imported patient data.
- Use the dashboard worklist to track referral, plan-drafted, testing, and reported status and filter patients who need action.
- Track app changes through the in-app changelog and Quick Start "What's New" modal.
- Curate short changelog summaries with `Summary:` lines in `CHANGELOG.md`.

## Privacy and Clinical Use

DREAM is designed as local-first clinical support tooling. During normal clinical use, identifiable patient data is processed in the browser from local REDCap exports and is not transmitted to an application backend.

Do not commit real patient data, REDCap exports, screenshots containing identifiers, or generated clinical documents to this repository.

The screen lock is a shoulder-surfing control only. It is not a substitute for device, network, REDCap, or institutional access controls.

## Technology Stack

- **Frontend:** React 19 with TypeScript
- **Build tool:** Vite
- **Styling:** Tailwind CSS with shadcn/ui components
- **Icons:** Lucide React
- **Testing:** Vitest, Testing Library, Playwright, axe-core
- **PWA:** vite-plugin-pwa and Workbox
- **Hosting:** Cloudflare Pages via Wrangler

## Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/monchee/dream.git
   cd dream
   ```

2. **Install dependencies**
   ```bash
   npm ci
   ```

3. **Start the development server**
   ```bash
   npm run dev -- --port 3002
   ```

4. **Open the app**
   ```text
   http://localhost:3002
   ```

Port 3002 is required on this machine: ports 3000 and 3001 are occupied by other services. Pass it explicitly (`npm run dev -- --port 3002`) so Vite cannot fall back to a different port.

## Common Commands

- `npm run dev -- --port 3002` — start the Vite dev server
- `npm run check:release` — verify the current version has a changelog entry (also enforced by CI and `prebuild`)
- `npx tsc --noEmit` — type-check the app
- `npm run lint` — run ESLint
- `npm run test:unit` — run unit/component tests
- `npm run test:e2e` — run Playwright tests
- `npm run test:e2e:ci` — build DREAM first and run non-visual Chromium e2e tests against the production preview
- `npm run test:coverage` — generate local coverage reports
- `npm run build` — sync changelog data and build production assets
- `npm run preview` — preview the production build locally
- `npm run changelog:sync` — regenerate `src/shared/data/changelog.json` from `CHANGELOG.md`
- `npm run deploy` — build and publish `dist/` to Cloudflare Pages via Wrangler

## Release Process

1. Update `package.json` version.
2. Add a top entry to `CHANGELOG.md`.
3. Include a short `Summary:` line for the Quick Start "What's New" modal.
4. Run `npm run changelog:sync`.
5. Validate with:
   ```bash
   npx tsc --noEmit
   npm run lint
   npm run test:unit
   npm run build
   ```
6. Commit, tag, push, and create a GitHub release.
7. Publish production with:
   ```bash
   npm run deploy
   ```

## Deployment

Production is hosted on Cloudflare Pages at [dream.yuson.au](https://dream.yuson.au). GitHub Pages is intentionally not used for this project.

The deploy script runs a production build and then publishes with:

```bash
wrangler pages deploy dist --project-name dream --commit-dirty=true --branch main
```

For automated CI/CD deployment instructions, see [MAINTAINERS.md](MAINTAINERS.md). For service ownership, credentials, domain risks, and fallback procedures, see [HANDOVER.md](HANDOVER.md).

## Project Structure

```text
src/
├── features/            # Feature modules
│   ├── patients/        # Patient selection and history
│   ├── testing/         # Testing plans and clinical test logging
│   ├── reports/         # Clinical reports, handouts, and letters
│   ├── dashboard/       # Clinical dashboard and CSV upload
│   └── info-pages/      # About, FAQ, contact, legal, and changelog pages
├── core/                # App shell, routing, layout, and help modal
├── shared/              # Cross-feature hooks, types, utilities, and data
└── test/                # Test setup and factories
```

## Known Operational Notes

- GitHub Actions validate pushes and pull requests to `main`, with automated deployment to Cloudflare Pages on push to `main` when Cloudflare credentials (`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`) are configured.
- Maintainer runbook and testing scripts are documented in [MAINTAINERS.md](MAINTAINERS.md).
- Succession inventory, credential rotation, and continuity plans are documented in [HANDOVER.md](HANDOVER.md).
- Branch protection is not configured because GitHub reports it is unavailable for this private repository without GitHub Pro.
- Production assets are split into dedicated vendor chunks (React runtime, Sentry, Radix UI, forms, and icons) so production builds stay well within chunk-size limits without warnings.
- `/manifest.webmanifest` is generated from the Vite PWA configuration. The Vite config is the manifest source of truth.

## Internal Use and Licensing

This repository is private clinical tooling for use within the RPAH Department of Clinical Immunology & Allergy workflow. No open-source license is granted. Contact the development team for reuse, access, or licensing questions.

## Support

For technical support, feature requests, or clinical workflow questions, contact the DREAM development team through the Royal Prince Alfred Hospital Department of Clinical Immunology & Allergy.
