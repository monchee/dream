import { describe, expect, it } from 'vitest';
import { formatDoseDiffReport } from '../../../../scripts/sync-protocols.mjs';

describe('formatDoseDiffReport (plan 004 M3)', () => {
  const metadata = {
    sourceDescription: 'Path: local/source.json',
    incomingSchemaVersion: 2,
    generatedAt: '2026-10-06T00:00:00.000Z',
  };

  it('marks a no-diff report as NO CHANGES', () => {
    const report = formatDoseDiffReport([], metadata);
    expect(report).toContain('Status: NO CHANGES');
    expect(report).not.toContain('PENDING CLINICIAN REVIEW');
    expect(report).toContain('No dose changes detected');
  });

  it('marks a diff report as PENDING CLINICIAN REVIEW with all details', () => {
    const diffs = [{
      drug: 'Rocuronium',
      type: 'dose',
      details: [
        'SPT concentration changed: 10mg/mL -> 5mg/mL',
        'IDT step 1 ratio changed: 1:100 -> 1:200',
        'Preparation changed',
        'Pharmacy verification flag added',
      ],
    }];
    const report = formatDoseDiffReport(diffs, metadata);
    expect(report).toContain('Status: PENDING CLINICIAN REVIEW');
    expect(report).toContain('## Rocuronium (dose)');
    expect(report).toContain('- SPT concentration changed: 10mg/mL -> 5mg/mL');
    expect(report).toContain('- IDT step 1 ratio changed: 1:100 -> 1:200');
    expect(report).toContain('- Preparation changed');
    expect(report).toContain('- Pharmacy verification flag added');
  });

  it('includes source, schema version, timestamp, and a blank sign-off block', () => {
    const report = formatDoseDiffReport([], metadata);
    expect(report).toContain('- Source: Path: local/source.json');
    expect(report).toContain('- Incoming schema version: 2');
    expect(report).toContain('- Generated: 2026-10-06T00:00:00.000Z');
    expect(report).toContain('Clinical sign-off:');
    expect(report).toContain('- Decision: PENDING');
    expect(report).toContain('- Reviewer:');
    expect(report).toContain('- Reviewed:');
  });

  it('never includes patient identifiers in protocol reports', () => {
    const report = formatDoseDiffReport([], metadata);
    expect(report.toLowerCase()).not.toMatch(/patient name|redcap id|first name|last name/);
  });
});
