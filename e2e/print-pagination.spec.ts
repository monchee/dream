import { test, expect } from './fixtures';

/**
 * Print pagination integrity for the nurse testing sheet (U4 / plan 003).
 *
 * Uses the real LogScreen → TestingPlanGenerator → TestingPlanPrintView flow:
 * every drug category is selected so the A4 medication chart must span
 * multiple pages. Chromium print emulation must then show:
 *  - the clinical protocol table flowing across pages (table break-inside auto)
 *  - individual rows never splitting (tr break-inside avoid)
 *  - the table header configured as a repeating print header
 *  - identity header and signature blocks kept together
 *  - all animations and transitions disabled in print
 *  - a real multi-page A4 PDF
 */

async function dismissHelpModal(page: import('@playwright/test').Page) {
  const dialog = page.locator('[role="dialog"]');
  if (!(await dialog.isVisible().catch(() => false))) return;
  const btn = dialog.locator('button', { hasText: /skip for now|got it|close/i });
  if (await btn.first().isVisible().catch(() => false)) {
    await btn.first().click();
    await dialog.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
  } else {
    await page.keyboard.press('Escape');
  }
}

test.describe('Testing plan print pagination', () => {
  // Selecting every drug category, rendering the full plan, and generating a
  // multi-page PDF is heavier than the default 30s test budget.
  test.setTimeout(120_000);

  test('multi-page plan keeps rows, header, identity and signatures print-safe', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await dismissHelpModal(page);

    // Fresh mock-patient database
    await page.evaluate(() => {
      localStorage.removeItem('anaesthetic_patients');
      localStorage.removeItem('dream:patient_db');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await dismissHelpModal(page);

    // ── Select a patient (real selector flow) ───────────────────────────
    const patientSelector = page.getByRole('button', { name: /Select Patient from Database/i });
    await expect(patientSelector).toBeVisible({ timeout: 10_000 });
    await patientSelector.click();
    const patientSearch = page.getByRole('textbox', { name: /Filter patients by ID or name/i });
    await expect(patientSearch).toBeVisible({ timeout: 5_000 });
    await patientSearch.fill('Wei');
    const weiOption = page.getByRole('option').filter({ hasText: /Chen, Wei|Wei Chen/i }).first();
    await expect(weiOption).toBeVisible({ timeout: 5_000 });
    await weiOption.click();

    // ── Select every drug so the plan forces multiple A4 pages ─────────
    // Click the FIRST 'Select All' repeatedly: each click renames that
    // category's button to 'Select None', so first() advances to the next
    // category until none remain.
    const initialCount = await page.getByRole('button', { name: 'Select All', exact: true }).count();
    expect(initialCount).toBeGreaterThan(2); // real category controls, not a stub
    for (let guard = 0; guard < 30; guard++) {
      const next = page.getByRole('button', { name: 'Select All', exact: true }).first();
      if (!(await next.isVisible().catch(() => false))) break;
      await next.click();
    }
    expect(await page.getByRole('button', { name: 'Select All', exact: true }).count()).toBe(0);

    // ── Advance to the real print view screen (PrintPlanScreen) ─────────
    const previewBtn = page.getByRole('button', { name: /Preview & Print Request Form/i });
    await expect(previewBtn).toBeVisible({ timeout: 10_000 });
    await previewBtn.click();

    const protocolTable = page.locator('table').filter({ has: page.locator('th', { hasText: 'Signature' }) });
    await expect(protocolTable).toBeVisible({ timeout: 10_000 });
    const rowCount = await protocolTable.locator('tbody tr').count();
    expect(rowCount).toBeGreaterThan(20); // enough content to paginate

    // ── Print emulation: computed page-break contract ───────────────────
    await page.emulateMedia({ media: 'print' });

    const tableBreak = await protocolTable.evaluate(
      (el) => getComputedStyle(el).breakInside || getComputedStyle(el).pageBreakInside
    );
    expect(tableBreak).toBe('auto'); // the table may flow across pages

    const firstRowBreak = await protocolTable
      .locator('tbody tr')
      .first()
      .evaluate((el) => getComputedStyle(el).breakInside || getComputedStyle(el).pageBreakInside);
    expect(firstRowBreak).toBe('avoid'); // a clinical row never splits

    const theadDisplay = await protocolTable.locator('thead').evaluate((el) => getComputedStyle(el).display);
    expect(theadDisplay).toBe('table-header-group'); // header repeats on every page

    const signatureBreak = await page
      .locator('.print-signature-block')
      .first()
      .evaluate((el) => getComputedStyle(el).breakInside || getComputedStyle(el).pageBreakInside);
    expect(signatureBreak).toBe('avoid');

    const identityBreak = await page
      .locator('.print-keep-together')
      .first()
      .evaluate((el) => getComputedStyle(el).breakInside || getComputedStyle(el).pageBreakInside);
    expect(identityBreak).toBe('avoid');

    // Animations must be off in print (global print rule)
    const animationName = await page
      .locator('main, [class*="animate-"]')
      .first()
      .evaluate((el) => getComputedStyle(el).animationName);
    expect(animationName).toBe('none');

    // ── Real multi-page A4 PDF ──────────────────────────────────────────
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    const pdfText = pdf.toString('latin1');
    const pageMatches = pdfText.match(/\/Type\s*\/Page(?![sA-Za-z])/g) ?? [];
    expect(pageMatches.length).toBeGreaterThan(1); // more than one A4 page
  });
});
