import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

/**
 * Design token contract (plan 003 / F5).
 *
 * Locks in the U1 safety work: every status/grade colour pair that clinical
 * UI consumes must stay at or above WCAG AA (4.5:1) in BOTH themes — as text
 * on the surfaces, on its own alpha tints, and as a solid badge with its
 * semantic foreground token. Also guards the monochrome print policy, the
 * zero-radius/focus baseline on the shared primitives, and keeps the raw
 * print colour families from returning to the four clinical documents.
 *
 * Bounded to the files this plan touches: it is a regression contract for
 * the repaired matrix, not a repo-wide style linter.
 */

const _dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(_dirname, '../../..');
const indexCss = readFileSync(resolve(root, 'index.css'), 'utf-8');

// ── HSL token parsing (pure text scan, no eval) ──────────────────────────

function extractBlock(css: string, selector: string): string {
  const marker = selector + ' {';
  const start = css.indexOf(marker);
  if (start === -1) throw new Error('block not found: ' + selector);
  const open = css.indexOf('{', start);
  let depth = 1;
  let i = open + 1;
  while (depth > 0 && i < css.length) {
    if (css[i] === '{') depth += 1;
    if (css[i] === '}') depth -= 1;
    i += 1;
  }
  return css.slice(open + 1, i - 1);
}

function parseTokens(block: string): Record<string, [number, number, number]> {
  const tokens: Record<string, [number, number, number]> = {};
  for (const rawLine of block.split('\n')) {
    const line = rawLine.trim();
    if (!line.startsWith('--')) continue;
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const name = line.slice(0, colon).trim().replace(/^--/, '');
    const parts = line.slice(colon + 1).trim().split(/\s+/);
    if (parts.length < 3) continue;
    const h = Number.parseFloat(parts[0]);
    const s = Number.parseFloat(parts[1]);
    const l = Number.parseFloat(parts[2]);
    if (Number.isNaN(h) || Number.isNaN(s) || Number.isNaN(l)) continue;
    tokens[name] = [h, s, l];
  }
  return tokens;
}

const lightTokens = parseTokens(extractBlock(indexCss, ':root'));
const darkBlockStart = indexCss.indexOf('.dark {');
const darkTokens = parseTokens(extractBlock(indexCss.slice(darkBlockStart), '.dark'));

// ── Colour math (pure functions) ─────────────────────────────────────────

type Rgb = [number, number, number];

function hslToRgb(h: number, s: number, l: number): Rgb {
  const sat = s / 100;
  const lig = l / 100;
  const hueToRgb = (p: number, q: number, t: number): number => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  if (sat === 0) return [lig, lig, lig];
  const q = lig < 0.5 ? lig * (1 + sat) : lig + sat - lig * sat;
  const p = 2 * lig - q;
  return [
    hueToRgb(p, q, h / 360 + 1 / 3),
    hueToRgb(p, q, h / 360),
    hueToRgb(p, q, h / 360 - 1 / 3),
  ];
}

function luminance(c: Rgb): number {
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: Rgb, b: Rgb): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function composite(fg: Rgb, alpha: number, bg: Rgb): Rgb {
  return [
    fg[0] * alpha + bg[0] * (1 - alpha),
    fg[1] * alpha + bg[1] * (1 - alpha),
    fg[2] * alpha + bg[2] * (1 - alpha),
  ];
}

const AA = 4.5;
const SURFACES = {
  light: { bg: hslToRgb(...lightTokens['background']), card: hslToRgb(...lightTokens['card']) },
  dark: { bg: hslToRgb(...darkTokens['background']), card: hslToRgb(...darkTokens['card']) },
} as const;

const STATUS_KEYS = ['success', 'warning', 'danger', 'info'] as const;
const GRADE_KEYS = ['grade1', 'grade2', 'grade3', 'grade4'] as const;
const ALL_KEYS = [...STATUS_KEYS, ...GRADE_KEYS] as const;

// ── The contrast matrix (U1 contract) ────────────────────────────────────

describe('status/grade contrast matrix (U1 contract)', () => {
  for (const theme of ['light', 'dark'] as const) {
    const tokens = theme === 'light' ? lightTokens : darkTokens;
    const surfaces = SURFACES[theme];

    it.each([...ALL_KEYS])(theme + ': %s text meets AA on background and card', (key) => {
      const c = hslToRgb(...tokens['status-' + key]);
      expect(contrast(c, surfaces.bg)).toBeGreaterThanOrEqual(AA);
      expect(contrast(c, surfaces.card)).toBeGreaterThanOrEqual(AA);
    });

    it.each([...ALL_KEYS])(theme + ': %s text meets AA on its own /15 and /10 tints', (key) => {
      const c = hslToRgb(...tokens['status-' + key]);
      expect(contrast(c, composite(c, 0.15, surfaces.card))).toBeGreaterThanOrEqual(AA);
      expect(contrast(c, composite(c, 0.1, surfaces.card))).toBeGreaterThanOrEqual(AA);
    });

    it.each([...ALL_KEYS])(theme + ': %s solid badge meets AA with its foreground token', (key) => {
      const bg = hslToRgb(...tokens['status-' + key]);
      const fg = hslToRgb(...tokens['status-' + key + '-foreground']);
      expect(contrast(fg, bg)).toBeGreaterThanOrEqual(AA);
    });
  }

  it('both themes define grade foreground tokens', () => {
    for (const key of GRADE_KEYS) {
      expect(lightTokens['status-' + key + '-foreground']).toBeDefined();
      expect(darkTokens['status-' + key + '-foreground']).toBeDefined();
    }
  });
});

// ── Primitive baseline ───────────────────────────────────────────────────

describe('shared primitive contract', () => {
  const read = (p: string): string => readFileSync(resolve(root, p), 'utf-8');

  it('Badge grade variants use semantic foreground tokens, never fixed text-white', () => {
    const badge = read('components/ui/badge.tsx');
    for (const key of GRADE_KEYS) {
      const line = badge.split('\n').find((l) => l.trim().startsWith(key + ':'));
      expect(line, 'grade variant ' + key).toBeTruthy();
      expect(line!).toContain('text-status-' + key + '-foreground');
      expect(line!).not.toContain('text-white');
      expect(line!).not.toMatch(/text-foreground(?!-)/);
    }
  });

  it.each(['components/ui/button.tsx', 'components/ui/input.tsx', 'components/ui/select.tsx', 'components/ui/switch.tsx'])(
    '%s keeps rounded-none and visible focus styling',
    (file) => {
      const src = read(file);
      expect(src).toContain('rounded-none');
      // Radix primitives conventionally use focus:ring; plain inputs use
      // focus-visible:ring. Either pattern is a visible focus indicator.
      expect(src).toMatch(/focus(-visible)?:/);
    }
  );

  it('shared Input and SelectTrigger keep the 44px mobile target with xl density', () => {
    expect(read('components/ui/input.tsx')).toContain('h-11 xl:h-9');
    expect(read('components/ui/select.tsx')).toContain('h-11 xl:h-9');
  });
});

// ── Print policy (U4 contract) ───────────────────────────────────────────

describe('monochrome print policy (U4 contract)', () => {
  const printBlock = indexCss.slice(indexCss.indexOf('@media print'));

  it('defines the semantic print tokens and shared classes', () => {
    for (const token of ['print-paper', 'print-ink', 'print-muted-ink', 'print-rule', 'print-alert-ink']) {
      expect(indexCss).toContain('--' + token);
    }
    for (const cls of ['print-paper', 'print-ink', 'print-muted-ink', 'print-rule', 'print-alert-ink', 'print-keep-together', 'print-signature-block']) {
      expect(indexCss).toContain('.' + cls);
    }
  });

  it('keeps table flow with row protection and repeating headers in print', () => {
    expect(printBlock).toContain('page-break-inside: auto');
    expect(printBlock).toContain('display: table-header-group');
    expect(printBlock).toContain('page-break-inside: avoid');
  });

  it.each([
    'src/features/testing/components/TestingPlanPrintView.tsx',
    'src/features/reports/components/ClinicalReport.tsx',
    'src/features/reports/components/PatientHandout.tsx',
    'src/features/reports/components/PowerchartLetter.tsx',
  ])('%s carries no raw print slate/blue/red families', (file) => {
    const src = readFileSync(resolve(root, file), 'utf-8');
    for (const family of ['slate', 'blue', 'red', 'gray']) {
      expect(src).not.toContain('print:text-' + family + '-');
      expect(src).not.toContain('print:border-' + family + '-');
      expect(src).not.toContain('print:bg-' + family + '-');
    }
  });

  it('keeps the testing protocol table free of print:break-inside-auto', () => {
    const src = readFileSync(resolve(root, 'src/features/testing/components/TestingPlanPrintView.tsx'), 'utf-8');
    expect(src).not.toContain('print:break-inside-auto');
  });
});
