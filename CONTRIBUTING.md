# Contributing

This repository is private clinical tooling. Contributions should preserve patient privacy, clinical document clarity, and the local-first data model.

## Local Setup

```bash
npm ci
npm run dev -- --port 3002
```

Open `http://localhost:3002`. Ports 3000 and 3001 are occupied on this machine — always pass `--port 3002` explicitly.

## Expected Checks

Run these before committing code or documentation that affects behavior:

```bash
npx tsc --noEmit
npm run lint
npm run test:unit
npm run build
```

Use `npm run test:e2e` for browser-flow changes and `npm run test:coverage` when you need a local coverage report.

## Privacy Rules

- Never commit real patient data, REDCap exports, identifiable screenshots, generated clinical reports, or print/PDF captures.
- Use demo or synthetic data for tests and screenshots.
- Keep clinical workflows fully local-first: identifiable patient data stays in the browser. No feature currently sends clinical data to an application backend (the research submission path was removed in v0.91.0).
- Avoid adding dependencies, logging, analytics, or network calls that could transmit clinical data without explicit review.

## Changelog and Release Notes

For user-visible changes:

1. Add a top entry to `CHANGELOG.md`.
2. Include a short `Summary:` line for the Quick Start "What's New" modal.
3. Run:
   ```bash
   npm run changelog:sync
   ```
4. Confirm `src/shared/data/changelog.json` changed as expected.

## Release Checklist

1. Bump `package.json`.
2. Update `CHANGELOG.md` with `Summary:`.
3. Run `npm run changelog:sync`.
4. Run the expected checks.
5. Commit with a release-focused message.
6. Tag and push the release.
7. Create the GitHub release.
8. Publish with `npm run deploy`.

These steps are enforced, not just recommended:

- **Every pull request into `main` must bump `package.json`** (patch is fine) and carry a matching `CHANGELOG.md` entry. CI's `release` job runs `npm run check:release -- --against origin/main` and fails otherwise. Add the `skip-release` label to exempt a PR (e.g. a stacked tooling change).
- **Every build and deploy runs the same guard** via the `prebuild` hook — a version without a changelog entry cannot be built or deployed. Set `ALLOW_UNRELEASED=1` to bypass for an exceptional build.

## Pull Requests

- Prefer focused changes with clear clinical/user impact.
- Keep generated local artifacts out of commits unless they are intentionally tracked.
- Use squash merge into `main`.
- Do not add open-source license language; this remains private/internal tooling.
