# Maintainers Runbook

## Overview

DREAM (Drug Reaction Evaluation & Anaesthetic Management) is a private, local-first clinical Progressive Web App designed for the Royal Prince Alfred Hospital (RPAH) Department of Clinical Immunology & Allergy. It guides clinicians through perioperative anaesthetic allergy workups—from REDCap patient record import and tailored testing plan creation to skin prick/intradermal test logging, patient handouts, and eMR-ready clinical reports—all processed locally in the browser without transmitting identifiable patient data. Drug protocol definitions, dilution concentrations, and cross-reactivity guidance are tied to the SCRATCH drug library (repository `monchee/drug-library`, hosted at [scratch.yuson.au](https://scratch.yuson.au)), which serves as the source of truth that DREAM consumes as a pinned JSON snapshot schema 1.1 (`src/shared/data/protocols.snapshot.json`). All protocol and cross-reactivity changes originate in SCRATCH.

---

## Local Development

### Prerequisites
- Node.js 20 (`.nvmrc` / GitHub Actions target Node 20)
- npm (bundled with Node)

### Installation
```bash
npm ci
```

### Development Server
```bash
npm run dev -- --port 3002
```
Starts the Vite dev server at `http://localhost:3002` (ports 3000/3001 are occupied on this machine; CI e2e uses its own preview port 4173 and is unaffected).

### Validation & Code Quality
- **Type check**: `npx tsc --noEmit`
- **Lint**: `npm run lint` (runs ESLint with `--report-unused-disable-directives --max-warnings 0`)
- **Lint auto-fix**: `npm run lint:fix`

### Testing
- **Release guard**: `npm run check:release` (CI enforces it on every PR; `prebuild` runs it before every build)
- **Unit & component tests (single run)**: `npm run test:unit`
- **Unit tests (watch mode)**: `npm run test`
- **Unit tests (UI mode)**: `npm run test:ui`
- **Unit test coverage**: `npm run test:coverage`
- **End-to-end tests (Playwright)**: `npm run test:e2e`
- **End-to-end tests (interactive UI)**: `npm run test:e2e:ui`
- **End-to-end tests (CI/production preview)**: `npm run test:e2e:ci` (builds DREAM first, then runs non-visual Chromium tests against `npm run preview` with `CI=1`)

### Build & Preview
- **Production build**: `npm run build` (runs `prebuild` changelog sync then `vite build`)
- **Preview production build locally**: `npm run preview`
- **Changelog sync (manual)**: `npm run changelog:sync` (runs `scripts/generate-changelog.mjs` to update `src/shared/data/changelog.json` from `CHANGELOG.md`)

---

## Deployment

### Normal Path (Automated CI/CD)
1. Prepare release:
   - Update `version` in `package.json`.
   - Add release notes under a new version heading in `CHANGELOG.md` (include a `Summary:` line for in-app highlights).
   - Run `npm run changelog:sync`.
2. Validate locally with `npx tsc --noEmit && npm run lint && npm run test:unit && npm run build`.
3. Open a pull request or push directly to `main`.
4. The GitHub Actions workflow (`.github/workflows/ci.yml`) runs `test` and `e2e` jobs in parallel.
5. Upon successful completion of both test suites, the `deploy` job builds the application, strips sourcemaps (`find dist -name '*.map' -delete`), and publishes to Cloudflare Pages using `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

> **Note**: Both `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` must be configured in GitHub repository secrets. If either credential is missing, the `deploy` job fails loudly.

### Break-Glass Path (Emergency Manual Deployment)
If GitHub Actions is down, credentials fail, or an urgent hotfix must be shipped immediately:

1. Ensure local Wrangler authentication:
   ```bash
   npx wrangler login
   ```
2. Deploy directly to production (`main` branch on Cloudflare Pages):
   ```bash
   npm run deploy
   ```
   *This script runs `npm run build && find dist -name '*.map' -delete && wrangler pages deploy dist --project-name dream --commit-dirty=true --branch main`.*

3. Deploy to preview branch (optional):
   ```bash
   npm run deploy:preview
   ```

---

## Release Verification

After a deployment completes, verify the release with the following checklist:

1. **Check CI / Host Status**:
   - Confirm the GitHub Actions run on `main` succeeded.
   - Verify the deployment status in the Cloudflare Pages dashboard.

2. **Access the Live Application**:
   - Production URL: [https://dream.yuson.au](https://dream.yuson.au)
   - Cloudflare Pages fallback URL: [https://anaesthetic-allergy-log-7ya.pages.dev](https://anaesthetic-allergy-log-7ya.pages.dev) (not `dream.pages.dev` — see HANDOVER.md)

3. **Check PWA & Version**:
   - Trigger a refresh to allow the service worker to fetch the updated bundle.
   - Enter the PIN gate (`2050`) to unlock the app.
   - Confirm the version badge in the bottom-right corner matches the expected version from `package.json`.

4. **Verify Changelog**:
   - Open the "What's New" modal or navigate to `/changelog` to ensure the new release summary and notes are rendered.

5. **Smoke Test Core Features**:
   - Load or import a test patient record.
   - Navigate to Testing Plans and verify protocol generation.
   - Test logging and report generation (Clinical Report, Patient Handout).
   - Check browser console (`F12`) for any runtime exceptions.
