import { describe, expect, it } from 'vitest';
import { formatDoseDiffReport, hasClinicalSignOff, parseArgs } from '../../../../scripts/sync-protocols.mjs';

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

describe('sign-off gate and argument parsing (plan 004 review fixes)', () => {
  it('rejects a missing report', () => {
    const result = hasClinicalSignOff(null, 'abc123');
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('No protocol review report');
  });

  it('rejects a report for different changes (fingerprint mismatch)', () => {
    const report = [
      '- Diff fingerprint: 0000000000000000',
      '- Decision: ACCEPTED',
      '- Reviewer: Dr. Clinical',
      '- Reviewed: 2026-10-06',
    ].join('\n');
    const result = hasClinicalSignOff(report, 'abc123');
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('different changes');
  });

  it('rejects an unsigned or pending report for the same fingerprint', () => {
    const pending = [
      '- Diff fingerprint: abc123',
      '- Decision: PENDING',
      '- Reviewer:',
      '- Reviewed:',
    ].join('\n');
    expect(hasClinicalSignOff(pending, 'abc123').ok).toBe(false);

    const missingFields = '- Diff fingerprint: abc123';
    expect(hasClinicalSignOff(missingFields, 'abc123').ok).toBe(false);
  });

  it('accepts a completed sign-off with matching fingerprint', () => {
    const signed = [
      '- Diff fingerprint: abc123',
      '- Decision: ACCEPTED',
      '- Reviewer: Dr. Clinical',
      '- Reviewed: 2026-10-06',
    ].join('\n');
    expect(hasClinicalSignOff(signed, 'abc123').ok).toBe(true);
  });

  it('rejects an explicit REJECTED decision (plan 004 review fix)', () => {
    const rejected = [
      '- Diff fingerprint: abc123',
      '- Decision: REJECTED',
      '- Reviewer: Dr. Clinical',
      '- Reviewed: 2026-10-06',
    ].join('\n');
    const result = hasClinicalSignOff(rejected, 'abc123');
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('REJECTED');
  });

  it('requires an affirmative decision keyword', () => {
    const unclear = [
      '- Diff fingerprint: abc123',
      '- Decision: maybe',
      '- Reviewer: Dr. Clinical',
      '- Reviewed: 2026-10-06',
    ].join('\n');
    const result = hasClinicalSignOff(unclear, 'abc123');
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('affirmative acceptance');
  });

  it('parses --review-only and --accept flags', () => {
    expect(parseArgs(['--review-only']).reviewOnly).toBe(true);
    expect(parseArgs(['--review-only']).accept).toBe(false);
    expect(parseArgs(['--accept']).accept).toBe(true);
    expect(parseArgs(['--accept']).reviewOnly).toBe(false);
    expect(parseArgs([]).reviewOnly).toBe(false);
    expect(parseArgs([]).accept).toBe(false);
  });
});
