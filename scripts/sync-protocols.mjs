#!/usr/bin/env node
// Syncs src/shared/data/protocols.snapshot.json from SCRATCH and regenerates
// src/shared/data/drugMasterlist.generated.ts.
//
// Run manually with `npm run protocols:sync`.
// Do NOT put in prebuild or any automatic hook.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { generateDrugMasterlist } from './generate-drug-masterlist.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = join(ROOT, 'src', 'shared', 'data', 'protocols.snapshot.json');
const DEFAULT_LOCAL_PATH = '/Users/monchee/Projects/scratch/docs/api/protocols.json';

// SCRATCH's published protocol export. Verified serving the SCRATCH handbook.
// Note: scratch.pages.dev belongs to MIT Scratch, not this project — a Pages
// project only gets its requested *.pages.dev name if it is free, and it was not.
export const PUBLISHED_PROTOCOLS_URL = 'https://scratch.yuson.au/api/protocols.json';

export const SUPPORTED_SCHEMA_VERSIONS = ['1.0', '1.1'];

export function isSupportedSchemaVersion(version) {
  return typeof version === 'string' && SUPPORTED_SCHEMA_VERSIONS.includes(version);
}

export function computeDoseLevelDiff(oldSnapshot, newSnapshot) {
  const diffs = [];
  const oldDrugs = new Map((oldSnapshot?.drugs || []).map((d) => [d.slug, d]));
  const newDrugs = new Map((newSnapshot?.drugs || []).map((d) => [d.slug, d]));

  for (const [slug, newDrug] of newDrugs) {
    const oldDrug = oldDrugs.get(slug);
    if (!oldDrug) {
      diffs.push({
        drug: newDrug.title || slug,
        type: 'DRUG_ADDED',
        details: [`New drug added with ${newDrug.protocols?.length || 0} protocol(s)`],
      });
      continue;
    }

    const drugChanges = [];
    if (oldDrug.version !== newDrug.version) {
      drugChanges.push(`version: "${oldDrug.version}" -> "${newDrug.version}"`);
    }
    if (oldDrug.last_reviewed !== newDrug.last_reviewed) {
      drugChanges.push(`last_reviewed: "${oldDrug.last_reviewed}" -> "${newDrug.last_reviewed}"`);
    }

    const oldProtocols = new Map((oldDrug.protocols || []).map((p) => [p.id, p]));
    const newProtocols = new Map((newDrug.protocols || []).map((p) => [p.id, p]));

    for (const [pId, newP] of newProtocols) {
      const oldP = oldProtocols.get(pId);
      if (!oldP) {
        drugChanges.push(`Protocol [${pId}] added: label="${newP.label}", type="${newP.test_type}"`);
        continue;
      }

      const pChanges = [];
      const scalarFields = ['label', 'test_type', 'presentation', 'diluent', 'under_review', 'review_note', 'needs_pharmacy_verification'];
      for (const field of scalarFields) {
        if (oldP[field] !== newP[field]) {
          pChanges.push(`${field}: ${JSON.stringify(oldP[field])} -> ${JSON.stringify(newP[field])}`);
        }
      }

      // Compare spt
      if (JSON.stringify(oldP.spt) !== JSON.stringify(newP.spt)) {
        if (!oldP.spt && newP.spt) {
          pChanges.push(`spt: added (${newP.spt.dilution || ''} / ${newP.spt.concentration || ''})`);
        } else if (oldP.spt && !newP.spt) {
          pChanges.push('spt: removed');
        } else {
          for (const k of ['dilution', 'concentration', 'positive_control', 'negative_control']) {
            if (oldP.spt?.[k] !== newP.spt?.[k]) {
              pChanges.push(`spt.${k}: ${JSON.stringify(oldP.spt?.[k])} -> ${JSON.stringify(newP.spt?.[k])}`);
            }
          }
        }
      }

      // Compare idt
      if (JSON.stringify(oldP.idt) !== JSON.stringify(newP.idt)) {
        const oldIdt = oldP.idt || [];
        const newIdt = newP.idt || [];
        if (oldIdt.length !== newIdt.length) {
          pChanges.push(`idt.length: ${oldIdt.length} -> ${newIdt.length}`);
        }
        const maxLen = Math.max(oldIdt.length, newIdt.length);
        for (let i = 0; i < maxLen; i++) {
          const sOld = oldIdt[i];
          const sNew = newIdt[i];
          if (!sOld && sNew) {
            pChanges.push(`idt[${i}]: added (ratio: ${sNew.dilution}, conc: ${sNew.concentration})`);
          } else if (sOld && !sNew) {
            pChanges.push(`idt[${i}]: removed`);
          } else if (sOld && sNew) {
            if (sOld.dilution !== sNew.dilution) {
              pChanges.push(`idt[${i}].dilution: "${sOld.dilution}" -> "${sNew.dilution}"`);
            }
            if (sOld.concentration !== sNew.concentration) {
              pChanges.push(`idt[${i}].concentration: "${sOld.concentration}" -> "${sNew.concentration}"`);
            }
            if (sOld.preparation !== sNew.preparation) {
              pChanges.push(`idt[${i}].preparation: "${sOld.preparation}" -> "${sNew.preparation}"`);
            }
          }
        }
      }

      // Compare challenge
      if (JSON.stringify(oldP.challenge) !== JSON.stringify(newP.challenge)) {
        const oldSteps = oldP.challenge?.steps || [];
        const newSteps = newP.challenge?.steps || [];
        if (oldP.challenge?.interval !== newP.challenge?.interval) {
          pChanges.push(`challenge.interval: "${oldP.challenge?.interval}" -> "${newP.challenge?.interval}"`);
        }
        if (oldSteps.length !== newSteps.length) {
          pChanges.push(`challenge.steps.length: ${oldSteps.length} -> ${newSteps.length}`);
        }
        const maxSteps = Math.max(oldSteps.length, newSteps.length);
        for (let i = 0; i < maxSteps; i++) {
          const cOld = oldSteps[i];
          const cNew = newSteps[i];
          if (!cOld && cNew) {
            pChanges.push(`challenge.steps[${i}]: added (dose: ${cNew.dose})`);
          } else if (cOld && !cNew) {
            pChanges.push(`challenge.steps[${i}]: removed`);
          } else if (cOld && cNew) {
            for (const k of ['dose', 'volume', 'cumulative', 'interval']) {
              if (cOld[k] !== cNew[k]) {
                pChanges.push(`challenge.steps[${i}].${k}: ${JSON.stringify(cOld[k])} -> ${JSON.stringify(cNew[k])}`);
              }
            }
          }
        }
      }

      if (pChanges.length > 0) {
        drugChanges.push(`Protocol [${pId}]:\n    ` + pChanges.join('\n    '));
      }
    }

    for (const [pId] of oldProtocols) {
      if (!newProtocols.has(pId)) {
        drugChanges.push(`Protocol [${pId}] removed`);
      }
    }

    if (drugChanges.length > 0) {
      diffs.push({
        drug: newDrug.title || slug,
        type: 'DRUG_MODIFIED',
        details: drugChanges,
      });
    }
  }

  for (const [slug, oldDrug] of oldDrugs) {
    if (!newDrugs.has(slug)) {
      diffs.push({
        drug: oldDrug.title || slug,
        type: 'DRUG_REMOVED',
        details: ['Drug removed from snapshot'],
      });
    }
  }

  return diffs;
}

export function printDoseDiff(diffs) {
  console.log('\n================================================================================');
  console.log('PROTOCOL SYNC REVIEW GATE — DOSE-LEVEL DIFF');
  console.log('================================================================================');

  if (diffs.length === 0) {
    console.log('No dose changes detected between existing snapshot and incoming data.\n');
    return;
  }

  for (const diff of diffs) {
    console.log(`\n• Drug: ${diff.drug} (${diff.type})`);
    for (const detail of diff.details) {
      console.log(`  ${detail}`);
    }
  }

  console.log('\n--------------------------------------------------------------------------------');
  console.log(`Summary: ${diffs.length} drug(s) with differences detected.`);
  console.log('================================================================================\n');
}

/**
 * Plan 004 M3: render the dose-level diff as a human-readable Markdown
 * review artifact for clinician sign-off. No patient data is involved —
 * protocol content only.
 */
/**
 * Stable fingerprint of a dose-level diff, used to tie a clinical sign-off
 * to exactly the changes being accepted.
 */
export function diffFingerprint(diffs) {
  return createHash('sha256').update(JSON.stringify(diffs)).digest('hex').slice(0, 16);
}

/**
 * Plan 004 M3 review gate: a pending diff may only be accepted when the
 * EXISTING review artifact carries the same diff fingerprint and a completed
 * clinical sign-off (non-PENDING decision, named reviewer, review date).
 * Returns { ok, reason }.
 */
export function hasClinicalSignOff(existingReport, fingerprint) {
  if (!existingReport) {
    return { ok: false, reason: 'No protocol review report exists yet. Re-run without --accept to generate one, obtain clinical sign-off, then retry.' };
  }
  if (!existingReport.includes(`Diff fingerprint: ${fingerprint}`)) {
    return { ok: false, reason: 'The existing review report is for different changes. Re-run without --accept to refresh it, obtain clinical sign-off, then retry.' };
  }
  const decision = existingReport.match(/- Decision: (.+)/)?.[1]?.trim();
  const reviewer = existingReport.match(/- Reviewer: (.+)/)?.[1]?.trim();
  const reviewed = existingReport.match(/- Reviewed: (.+)/)?.[1]?.trim();
  if (!decision || decision.toUpperCase() === 'PENDING' || !reviewer || !reviewed) {
    return { ok: false, reason: 'docs/protocol-review/latest-diff.md has no completed clinical sign-off (Decision must not be PENDING; Reviewer and Reviewed must be filled). Obtain clinical sign-off, then retry with --accept.' };
  }
  if (decision.toUpperCase() === 'REJECTED') {
    return { ok: false, reason: 'The clinical decision for these changes is REJECTED. Rejected changes must not be accepted into protocol data.' };
  }
  if (!/^(ACCEPTED|APPROVED|ACCEPT)/i.test(decision)) {
    return { ok: false, reason: `The clinical decision "${decision}" is not an affirmative acceptance (expected ACCEPTED/APPROVED). Update the Decision line in docs/protocol-review/latest-diff.md.` };
  }
  return { ok: true };
}

export function formatDoseDiffReport(diffs, {
  sourceDescription,
  incomingSchemaVersion,
  generatedAt,
  statusOverride = null,
  existingSignOff = null,
}) {
  const hasDiffs = diffs.length > 0;
  const status = statusOverride ?? (hasDiffs ? 'PENDING CLINICIAN REVIEW' : 'NO CHANGES');
  const lines = [];
  lines.push('# Protocol Sync — Clinical Review');
  lines.push('');
  lines.push(`- Source: ${sourceDescription}`);
  lines.push(`- Incoming schema version: ${incomingSchemaVersion}`);
  lines.push(`- Generated: ${generatedAt}`);
  lines.push(`- Status: ${status}`);
  lines.push(`- Diff fingerprint: ${diffFingerprint(diffs)}`);
  lines.push('');

  if (!hasDiffs) {
    lines.push('No dose changes detected between the existing snapshot and the incoming data.');
    lines.push('');
  } else {
    for (const diff of diffs) {
      lines.push(`## ${diff.drug} (${diff.type})`);
      lines.push('');
      for (const detail of diff.details) {
        lines.push(`- ${detail}`);
      }
      lines.push('');
    }
  }

  lines.push('---');
  lines.push('');
  lines.push('Clinical sign-off:');

  if (status === 'ACCEPTED' && existingSignOff) {
    // Preserve the complete recorded sign-off verbatim (Decision, Reviewer,
    // Role, Reviewed, Scope/notes) so the durable artifact keeps the audit
    // trail that authorized these changes.
    const signed = existingSignOff.slice(existingSignOff.indexOf('- Decision:')).trim();
    for (const line of signed.split('\n')) {
      lines.push(line);
    }
    lines.push('');
    return lines.join('\n');
  }

  lines.push('- Decision: PENDING');
  lines.push('- Reviewer:');
  lines.push('- Role:');
  lines.push('- Reviewed:');
  lines.push('- Scope/notes:');
  lines.push('');
  return lines.join('\n');
}

export function writeProtocolDiffReport(report, {
  outputPath = join(ROOT, 'docs', 'protocol-review', 'latest-diff.md'),
} = {}) {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, report, 'utf8');
  console.log(`Protocol review report written: ${outputPath}`);
}

export async function fetchSnapshot(sourceUrl) {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch protocols from ${sourceUrl}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export function parseArgs(argv) {
  let fromPath = null;
  let fromUrl = null;
  let reviewOnly = false;
  let accept = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--from-path') {
      fromPath = argv[i + 1] || DEFAULT_LOCAL_PATH;
      i++;
    } else if (arg.startsWith('--from-path=')) {
      fromPath = arg.slice('--from-path='.length);
    } else if (arg === '--from-url') {
      fromUrl = argv[i + 1] || PUBLISHED_PROTOCOLS_URL;
      i++;
    } else if (arg.startsWith('--from-url=')) {
      fromUrl = arg.slice('--from-url='.length);
    } else if (arg === '--review-only') {
      reviewOnly = true;
    } else if (arg === '--accept') {
      accept = true;
    }
  }

  return { fromPath, fromUrl, reviewOnly, accept };
}

export async function syncProtocols(options = {}) {
  const { fromPath, fromUrl } = options;
  let newSnapshotRaw;
  let sourceDescription;

  if (fromUrl) {
    sourceDescription = `URL: ${fromUrl}`;
    newSnapshotRaw = await fetchSnapshot(fromUrl);
  } else {
    const targetPath = fromPath || DEFAULT_LOCAL_PATH;
    sourceDescription = `Path: ${targetPath}`;
    if (!existsSync(targetPath)) {
      throw new Error(`Snapshot source path does not exist: ${targetPath}`);
    }
    const fileContent = readFileSync(targetPath, 'utf8');
    newSnapshotRaw = JSON.parse(fileContent);
  }

  if (!isSupportedSchemaVersion(newSnapshotRaw.schema_version)) {
    const errorMsg = `Unrecognised schema_version "${newSnapshotRaw.schema_version}". Supported versions: ${SUPPORTED_SCHEMA_VERSIONS.join(', ')}`;
    console.error(`\nError: ${errorMsg}`);
    throw new Error(errorMsg);
  }

  let oldSnapshot = null;
  if (existsSync(SNAPSHOT_PATH)) {
    try {
      oldSnapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8'));
    } catch {
      oldSnapshot = null;
    }
  }

  const diffs = computeDoseLevelDiff(oldSnapshot, newSnapshotRaw);
  printDoseDiff(diffs);

  // Read the EXISTING review report BEFORE any overwrite — it may hold the
  // clinical sign-off that gates acceptance of these changes.
  const reviewReportPath = join(ROOT, 'docs', 'protocol-review', 'latest-diff.md');
  const existingReport = existsSync(reviewReportPath)
    ? readFileSync(reviewReportPath, 'utf8')
    : null;
  const fingerprint = diffFingerprint(diffs);

  const writeReport = (statusOverride) => {
    const report = formatDoseDiffReport(diffs, {
      sourceDescription,
      incomingSchemaVersion: newSnapshotRaw.schema_version,
      generatedAt: new Date().toISOString(),
      statusOverride,
      existingSignOff: statusOverride === 'ACCEPTED' ? existingReport : null,
    });
    writeProtocolDiffReport(report);
    return report;
  };

  // --review-only NEVER writes clinical data files, in any branch.
  if (options.reviewOnly) {
    writeReport(diffs.length === 0 ? 'NO CHANGES' : 'PENDING CLINICIAN REVIEW');
    console.log('--review-only: snapshot and generated masterlist left unchanged.');
    return;
  }

  if (diffs.length > 0) {
    // Review gate (plan 004 M3): dose changes require a completed, AFFIRMATIVE
    // clinical sign-off in the existing review report. PENDING and REJECTED
    // decisions both refuse acceptance.
    const signOff = hasClinicalSignOff(existingReport, fingerprint);
    if (!signOff.ok) {
      // Refresh the pending report so the clinician reviews current changes.
      writeReport('PENDING CLINICIAN REVIEW');
      console.error(`\nRefusing to update protocol data: ${signOff.reason}`);
      throw new Error('Clinical sign-off required before protocol changes are accepted. After sign-off is recorded in docs/protocol-review/latest-diff.md, re-run with --accept.');
    }
    // Signed: write the ACCEPTED report BEFORE the snapshot write, so the
    // durable signed artifact is never behind the clinical data.
    writeReport('ACCEPTED');
    console.log(`Clinical sign-off verified for diff ${fingerprint}.`);
  } else {
    writeReport('NO CHANGES');
  }

  // Write new snapshot
  const formattedJson = JSON.stringify(newSnapshotRaw, null, 2) + '\n';
  writeFileSync(SNAPSHOT_PATH, formattedJson, 'utf8');
  console.log(`Updated ${SNAPSHOT_PATH} from ${sourceDescription}`);

  // Regenerate drugMasterlist.generated.ts
  const { protocolCount } = generateDrugMasterlist(SNAPSHOT_PATH);
  console.log(`Regenerated drugMasterlist.generated.ts with ${protocolCount} protocol records.`);
}

export async function main() {
  const args = parseArgs(process.argv.slice(2));
  try {
    await syncProtocols(args);
  } catch (err) {
    console.error(`Sync failed: ${err.message}`);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
