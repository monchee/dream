# Handover & Succession Inventory

This document provides a comprehensive inventory of services, secrets, external dependencies, security considerations, and operational continuity procedures for the DREAM repository. It is written to ensure that a successor maintainer or the hospital department can maintain, operate, and migrate the application without reliance on the original author.

---

## Service & Asset Inventory

| Asset / Service | Current Owner | Required for Clinical Function? | Description & Risks |
| :--- | :--- | :--- | :--- |
| **GitHub Repository** (`monchee/dream`) | `monchee` (Personal Account) | **No** (needed for CI/CD & maintenance) | Source code, issues, and GitHub Actions workflows. Planned migration to an institutional organisation. |
| **Cloudflare Pages** (`dream` project) | `monchee` (Personal Account) | **Yes** (for hosting live PWA) | Static hosting platform serving the web application. |
| **Custom Domain** (`dream.yuson.au`) | `monchee` (Personal Domain) | **No** (fallback URL available) | Custom DNS domain. **Succession risk:** personal domain ownership. |
| **Sentry** (`monchee` / `dream`) | `monchee` (Personal Account) | **No** (optional monitoring) | Error monitoring and performance tracing. No-ops if DSN is omitted. |
| ~~**Supabase**~~ (research database) | — | Removed v0.91.0 | Feature retired unused; see section 5. If a Supabase project was provisioned, delete it from the Supabase dashboard. |
| **Access PIN** (`PasswordGate.tsx`) | Hardcoded in repository | **Yes** (deterrent gate) | Shoulder-surfing deterrent PIN (`2050`). Not a security boundary. |

---

## Detailed Component Analysis & Rotation Runbooks

### 1. GitHub Repository
- **Current State**: Hosted under personal GitHub account `monchee/dream`.
- **Functionality**: Houses source code, issue tracking, and GitHub Actions CI workflows.
- **Succession / Transfer Procedure**:
  1. In repository settings, navigate to **Settings** > **General** > **Danger Zone** > **Transfer ownership**.
  2. Specify the target GitHub Organisation (e.g. hospital/department organisation) or successor account.
  3. Ensure repository secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) are migrated or reconfigured under organisation/repository secrets.

---

### 2. Cloudflare Pages & Deployment Secrets
- **Current State**: Hosted on Cloudflare Pages under project `dream`.
- **Functionality**: Serves static web assets (`dist/`) over global CDN with automated HTTPS and caching headers (`public/_headers`).
- **Secrets**:
  - `CLOUDFLARE_API_TOKEN`: Cloudflare API token with `Cloudflare Pages: Edit` permissions.
  - `CLOUDFLARE_ACCOUNT_ID`: Cloudflare account ID.
  - Configured in GitHub repository secrets (**Settings** > **Secrets and variables** > **Actions**).
- **Rotation / Replacement Procedure**:
  1. In Cloudflare Dashboard, go to **My Profile** > **API Tokens** > **Create Token**.
  2. Use the **Edit Cloudflare Workers/Pages** template (or create custom token with `Account.Cloudflare Pages:Edit` permissions).
  3. Copy Account ID from the Cloudflare Pages overview sidebar.
  4. Update `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in GitHub repository secrets.
  5. *Fail-safe note:* If `CLOUDFLARE_API_TOKEN` is unset or empty, the `Check Cloudflare credentials` guard step in the CI `deploy` job detects its absence and skips the build, sourcemap deletion, and deployment steps cleanly without failing builds.

---

### 3. Custom Domain & DNS Migration
- **Current State**: [dream.yuson.au](https://dream.yuson.au) is mapped via DNS to Cloudflare Pages.
- **Succession Risk**: `yuson.au` is a **personal domain** owned by the original author. If the personal
  domain lapses or becomes unavailable, the custom URL will stop resolving.
- **BOTH APPLICATIONS SHARE THIS DOMAIN.** SCRATCH, the drug-protocol source of truth, is served at
  [scratch.yuson.au](https://scratch.yuson.au) from the same personal domain. If `yuson.au` lapses,
  clinicians lose the reference handbook and the app that records the encounter **at the same time**,
  and DREAM's `npm run protocols:sync` stops resolving. Treat moving both to an institutional domain
  as a single piece of work, not two. The SCRATCH repository is `monchee/drug-library`; its Cloudflare
  Pages project is named `scratch`.
- **Domain Independence**: In `vite.config.ts`, `base: './'` is configured, ensuring all bundle assets and routes use relative paths. The application is completely domain-agnostic and functions identically under any hostname, subdirectory, or port.
- **Fallback URL**: [anaesthetic-allergy-log-7ya.pages.dev](https://anaesthetic-allergy-log-7ya.pages.dev)
  — **not** `dream.pages.dev`, which does not resolve. A Pages project's `*.pages.dev` hostname is
  fixed when the project is first created and does not follow later renames; this project was
  originally created under a different name. Verified serving the same production build as the
  custom domain (identical asset hashes). Confirm this URL still resolves whenever you touch the
  Cloudflare project — it is the address a successor falls back to if the personal domain lapses.
- **Migration to a New Domain (e.g., Hospital / NSW Health Domain)**:
  1. In Cloudflare Pages Dashboard, navigate to **dream** > **Custom domains** > **Set up a custom domain**.
  2. Enter the new FQDN (e.g. `dream.allergy.rpah.health.nsw.gov.au` or `dream.yourhospital.org.au`).
  3. In the hospital/department DNS provider, create a `CNAME` record:
     - **Host / Name**: `dream` (or desired subdomain)
     - **Target / Value**: `anaesthetic-allergy-log-7ya.pages.dev`
  4. Cloudflare automatically provisions and renews SSL/TLS certificates for the custom domain.
  5. Update clinic bookmarks and PWA shortcuts.

---

### 4. Sentry (Error Tracking & Crash Reporting)
- **Current State**: Integrated via `@sentry/react` in `src/lib/sentry.ts`.
- **Runtime Behavior** (verified in `src/lib/sentry.ts` and `src/lib/env.ts`):
  - Enabled only when `VITE_SENTRY_DSN` is set and `VITE_ENVIRONMENT !== 'test'`.
  - The Sentry library is dynamically imported (`loadSentry()`) only if enabled.
  - If `VITE_SENTRY_DSN` is absent or empty, Sentry remains uninitialized and all logging functions (`initSentry()`, `captureMessage()`, `captureException()`) safely no-op without throwing errors or impacting user experience.
  - **PHI Redaction**: `scrubPhiFromEvent()` in `src/lib/sentry.ts` redacts MRNs, record IDs, DOB-shaped date strings, cookies, user IDs, and IP addresses before sending error events.
- **Build Plugin**: `sentryVitePlugin` in `vite.config.ts` only activates if `SENTRY_AUTH_TOKEN` is present in the build environment.
- **Rotation / Replacement**:
  - To change Sentry instance, update `VITE_SENTRY_DSN` in build environment variables (or `.env`).
  - Update `SENTRY_AUTH_TOKEN` in CI secrets if sourcemap uploading is desired.

---

### 5. Supabase (Research Database) — REMOVED
- **Removed in v0.91.0.** The optional research submission feature was retired unused: the Supabase client, research feature folder, research screen and navigation, payload submission path, and the `supabase/` migration scripts are all deleted, and the `@supabase/supabase-js` dependency is dropped.
- **This resolves the previously documented open security issue** (anonymous SELECT/DELETE on `research_submissions`): there is no research table, client, or code path left in the product.
- **Operational follow-up (outside the repo):** the Supabase *project* itself, if one was provisioned, should be paused or deleted from the Supabase dashboard — the repository can no longer reach it.
- All clinical workflows remain local-first and were never dependent on Supabase.
### 6. Screen Lock Access PIN
- **Current State**: Hardcoded constant in `src/core/components/PasswordGate.tsx` line 9:
  ```typescript
  const HARDCODED_PIN = '2050';
  ```
- **Security Assessment**:
  - **Deterrent Only**: This is a front-of-screen shoulder-surfing deterrent intended for shared clinical workstations. It is **NOT** a cryptographic security boundary.
  - The PIN is plainly visible in client JavaScript bundles and can be bypassed via browser DevTools or by executing `sessionStorage.setItem('dream_unlocked', 'true')`.
- **How to Change the PIN**:
  1. Open `src/core/components/PasswordGate.tsx`.
  2. Update line 9: `const HARDCODED_PIN = 'XXXX';` (replace with desired 4-digit string).
  3. Rebuild and deploy (`npm run build` or push to `main`).

---

### 7. Degraded Fallback & Offline Independence

DREAM is engineered with zero runtime server requirements for clinical operations:
- **Plain Source in Git**: The entire application is authored in standard TypeScript and React.
- **Static Artifact**: Production builds (`npm run build`) produce standard static assets in `dist/` (HTML, CSS, JS, manifest, and icons).
- **Intranet / Local Hosting**: Even if GitHub, Cloudflare, Sentry, and Supabase accounts lapse or are closed:
  - The department can clone or copy the repository.
  - The application can be served from an internal hospital server, local intranet, static web server (Nginx, Apache, Caddy), or local machine (`npx serve dist` or `python3 -m http.server`).
  - Clinical workflows (REDCap CSV import, plan generation, test execution, report printing) will continue to operate with full functionality.
