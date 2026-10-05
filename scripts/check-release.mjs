#!/usr/bin/env node
// Release guard: a version may only be built, deployed, or merged when its
// changelog entry exists — and (for PRs) when the version actually moved.
//
// Usage:
//   node scripts/check-release.mjs                     # changelog entry must exist
//   node scripts/check-release.mjs --against <git-ref> # AND version must differ from <ref>
//     (CI passes --against origin/main on pull requests)
//
// Escape hatch: set ALLOW_UNRELEASED=1 to skip the guard for an exceptional
// build (e.g. a hotfix revert). The CI release job also skips PRs labelled
// `skip-release`.
//
// Runs automatically via the `prebuild` npm hook (so `build` and `deploy`
// both enforce it) and as the `release` job in CI.

import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
const againstIndex = args.indexOf('--against');
const againstRef = againstIndex !== -1 ? args[againstIndex + 1] : null;
let baseVersion = null;

if (process.env.ALLOW_UNRELEASED === '1') {
  console.log('check-release: ALLOW_UNRELEASED=1 — skipping release guard.');
  process.exit(0);
}

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
const version = pkg.version;
const failures = [];

// 1. The version must have a CHANGELOG.md entry — the source of truth the
//    prebuild hook merges into the in-app changelog.
const changelog = readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf-8');
const entryPattern = new RegExp(`^## \\[${version.replace(/\./g, '\\.')}\\]`, 'm');
if (!entryPattern.test(changelog)) {
  failures.push(
    `CHANGELOG.md has no entry for v${version}. Add a "## [${version}] — YYYY-MM-DD (Codename)" section before building or merging.`
  );
}

// 2. For PRs: the version must actually move relative to the base branch, so
//    a push to main can never ship the same version twice.
if (againstRef) {
  try {
    const basePkg = execSync(`git show ${againstRef}:package.json`, {
      cwd: ROOT,
      encoding: 'utf-8',
    });
    baseVersion = JSON.parse(basePkg).version;
  } catch {
    console.log(`check-release: could not read package.json from ${againstRef} — skipping bump comparison.`);
  }
  if (baseVersion && baseVersion === version) {
    failures.push(
      `Version is still ${version}, the same as ${againstRef}. Bump package.json (and add its CHANGELOG.md entry) before merging — or label the PR "skip-release".`
    );
  }
}

if (failures.length > 0) {
  console.error('check-release: FAILED');
  for (const f of failures) console.error(`  - ${f}`);
  console.error('Set ALLOW_UNRELEASED=1 to bypass for an exceptional build.');
  process.exit(1);
}

console.log(`check-release: OK — v${version} has a changelog entry${againstRef ? ` and differs from ${againstRef} (${baseVersion ?? 'unknown'})` : ''}.`);
