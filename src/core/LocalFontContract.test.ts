import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Local font contract (plan 003 / U5).
 *
 * Public Sans must be served same-origin: no runtime request may go to
 * Google Fonts, and the @font-face declarations must resolve to the
 * vendored files under public/fonts/. Keeps the clinical offline promise
 * from PRODUCT.md honest.
 */
describe('local font contract', () => {
  const root = resolve(__dirname, '../..');
  const indexHtml = readFileSync(resolve(root, 'index.html'), 'utf-8');
  const indexCss = readFileSync(resolve(root, 'index.css'), 'utf-8');
  const prodHeaders = readFileSync(resolve(root, 'public/_headers'), 'utf-8');
  const viteConfig = readFileSync(resolve(root, 'vite.config.ts'), 'utf-8');

  it('never references Google Fonts from the document or stylesheets', () => {
    expect(indexHtml).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/);
    expect(indexCss).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/);
  });

  it('removes the Google font domains from every CSP directive', () => {
    expect(prodHeaders).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/);
    expect(viteConfig).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/);
  });

  it('declares Public Sans from same-origin vendored files with a swap display strategy', () => {
    const faces = indexCss.match(/@font-face\s*{[^}]*}/g) ?? [];
    const publicSansFaces = faces.filter((f) => f.includes("'Public Sans'"));
    expect(publicSansFaces.length).toBe(2); // normal + italic

    for (const face of publicSansFaces) {
      expect(face).toContain('font-weight: 100 900');
      expect(face).toContain('font-display: swap');
      expect(face).toMatch(/url\('\/fonts\/public-sans-latin-wght-(normal|italic)\.woff2'\)/);
      expect(face).not.toMatch(/https?:\/\//);
    }
  });

  it('ships the vendored Public Sans woff2 assets', () => {
    for (const file of [
      'public/fonts/public-sans-latin-wght-normal.woff2',
      'public/fonts/public-sans-latin-wght-italic.woff2',
    ]) {
      const buf = readFileSync(resolve(root, file));
      // WOFF2 magic bytes: "wOF2"
      expect(buf.subarray(0, 4).toString('latin1')).toBe('wOF2');
      expect(buf.byteLength).toBeGreaterThan(10_000);
    }
  });
});
