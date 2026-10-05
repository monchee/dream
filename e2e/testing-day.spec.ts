import { test, expect } from './fixtures';

/**
 * Dismiss the HelpModal "Quick Start" dialog that auto-opens in demo mode.
 */
async function dismissHelpModal(page: any) {
  await page.waitForTimeout(400);
  const dialog = page.locator('[role="dialog"]');
  const isDialogVisible = await dialog.isVisible().catch(() => false);
  if (!isDialogVisible) return;
  const skipBtn = dialog.locator('button', { hasText: /skip for now/i });
  const gotItBtn = dialog.locator('button', { hasText: /got it/i });
  for (const btn of [skipBtn, gotItBtn]) {
    const count = await btn.count();
    if (count > 0) {
      try {
        await btn.first().waitFor({ state: 'stable', timeout: 3000 });
        await btn.first().click({ timeout: 5000 });
        await dialog.waitFor({ state: 'hidden', timeout: 5000 });
        return;
      } catch { /* try next */ }
    }
  }
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
}

test.describe('Testing Day Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // Dismiss the auto-open HelpModal
    await dismissHelpModal(page);
    // Clear persisted patient data so mock patients load fresh
    await page.evaluate(() => {
      localStorage.removeItem('anaesthetic_patients');
      localStorage.removeItem('dream:patient_db');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await dismissHelpModal(page);
  });

  test('full testing day: patient selection → testing panel → save → report → dashboard activity', async ({ page }) => {
    // ── Step 1: Patient selector visible ──────────────────────────────────
    const patientSelector = page.getByRole('button', { name: /Select Patient from Database/i });
    await expect(patientSelector).toBeVisible({ timeout: 10000 });

    // ── Step 2: Select Wei Chen (first mock patient) ───────────────────────
    await patientSelector.click();
    const patientSearch = page.getByRole('textbox', { name: /Filter patients by ID or name/i });
    await expect(patientSearch).toBeVisible({ timeout: 5000 });
    await patientSearch.fill('Wei');
    await page.waitForTimeout(300); // debounce
    const weiOption = page.getByRole('option').filter({ hasText: /Chen, Wei|Wei Chen/i }).first();
    await expect(weiOption).toBeVisible({ timeout: 5000 });
    await weiOption.click();

    // ── Step 3: Start Testing Session ──────────────────────────────────
    await page.getByText('Metoclopramide', { exact: true }).first().click();
    const proceedBtn = page.getByRole('button', { name: /Start Testing Session/i });
    await expect(proceedBtn).toBeVisible({ timeout: 5000 });
    await proceedBtn.click();
    await page.waitForLoadState('networkidle');
    await dismissHelpModal(page);

    // ── Step 4: Advance to SPT and IDT section ─────────────────────────
    await page.getByRole('button', { name: 'Next Section', exact: true }).click();
    await expect(page.getByLabel(/histamine/i).first()).toBeVisible({ timeout: 10000 });

    // ── Step 5: Fill histamine control ────────────────────────────────────
    // Input found by label text instead (the placeholder approach is less reliable)
    // Try by label text proximity
    const histamineField = page.getByLabel(/histamine/i).first();
    if (await histamineField.isVisible()) {
      await histamineField.fill('5');
    }

    // ── Step 6: Enter and read back a positive SPT wheal ──────────────────
    const sptWhealField = page.getByPlaceholder('-').first();
    await expect(sptWhealField).toBeVisible();
    await sptWhealField.fill('3');
    await expect(sptWhealField).toHaveValue('3');
    await expect(page.getByText('+POS').first()).toBeVisible();

    // ── Step 7: Save clinical record ──────────────────────────────────────
    // Two buttons share this accessible name on this section (the footer strip's
    // swapped-in Next-to-Save button, and ReviewSaveSection's own save button) — use .first().
    await page.getByRole('button', { name: /7\.\s*Review and save/i }).click();
    const saveBtn = page.getByRole('button', { name: /Save Clinical Record/i }).first();
    await expect(saveBtn).toBeVisible({ timeout: 10000 });
    await saveBtn.click();
    await dismissHelpModal(page);

    // ── Step 8: Report screen appears (SUMMARY) ────────────────────────────
    await expect(page.getByRole('tab', { name: 'Clinical Report' })).toBeVisible({ timeout: 10000 });

    // ── Step 9: Print button is present ───────────────────────────────────
    const printBtn = page.getByRole('button', { name: /print/i }).first();
    await expect(printBtn).toBeVisible({ timeout: 5000 });

    // ── Step 10: Navigate back to the log, then to Dashboard ───────────────
    await page.getByRole('button', { name: /Start New Log/i }).click();
    await dismissHelpModal(page);
    const dashboardLink = page.locator('a[href="/dashboard"]').first();
    await expect(dashboardLink).toBeVisible({ timeout: 5000 });
    await dashboardLink.click();
    await expect(page.getByRole('heading', { name: 'Clinical Dashboard' })).toBeVisible({ timeout: 10000 });
    // The former "Recent Testing Activity" assertion was removed with the
    // RecentTestingActivity component itself. Reaching the dashboard is still
    // asserted above; there is no longer a recent-sessions panel to check.
  });

  test('restores in-progress testing draft after reload', async ({ page }) => {
    await page.goto('/testing');
    await page.waitForLoadState('networkidle');
    await dismissHelpModal(page);

    await page.getByLabel(/^REDCap ID/i).fill('1');
    await page.getByLabel(/first name/i).fill('Wei');
    await page.getByLabel(/last name/i).fill('Chen');

    await page.getByRole('button', { name: 'Next Section', exact: true }).click();
    const histamineField = page.getByLabel(/histamine/i).first();
    await expect(histamineField).toBeVisible({ timeout: 5000 });
    await histamineField.fill('5');

    // Draft autosave is debounced by 500ms.
    await page.waitForTimeout(700);
    await expect(page.getByText(/Draft saved/)).toBeVisible({ timeout: 5000 });

    await page.reload();
    await page.waitForLoadState('networkidle');
    await dismissHelpModal(page);

    // Reload resets to Section 0; identity fields and the draft indicator restore immediately.
    await expect(page.getByText(/Draft saved/)).toBeVisible({ timeout: 5000 });
    await expect(page.getByLabel(/first name/i)).toHaveValue('Wei');
    await expect(page.getByLabel(/last name/i)).toHaveValue('Chen');
    await expect(page.getByLabel(/^REDCap ID/i)).toHaveValue('1');

    // Section 1's field values are also preserved in the draft.
    await page.getByRole('button', { name: 'Next Section', exact: true }).click();
    await expect(page.getByLabel(/histamine/i).first()).toHaveValue('5');
  });

  test('marks only required manual patient fields with asterisks', async ({ page }) => {
    const patientSelector = page.getByRole('button', { name: /Select Patient from Database/i });
    await expect(patientSelector).toBeVisible({ timeout: 10000 });
    await patientSelector.click();
    await page.getByRole('option', { name: /New Patient \(Manual Entry\)/i }).click();

    const dialog = page.getByRole('dialog', { name: 'New Patient Details' });
    await expect(dialog).toBeVisible();

    for (const fieldId of ['manual-first-name', 'manual-last-name', 'manual-mrn']) {
      await expect(dialog.locator(`label[for="${fieldId}"] span[aria-hidden="true"]`)).toHaveText('*');
    }

    await expect(dialog.locator('label span[aria-hidden="true"]')).toHaveCount(3);
    for (const fieldId of ['manual-redcap-id', 'manual-dob', 'manual-gender', 'manual-city']) {
      await expect(dialog.locator(`label[for="${fieldId}"] span[aria-hidden="true"]`)).toHaveCount(0);
    }
  });

  test('patient identity bar stays visible while scrolling the drug grid', async ({ page }) => {
    const patientSelector = page.getByRole('button', { name: /Select Patient from Database/i });
    await expect(patientSelector).toBeVisible({ timeout: 10000 });

    await patientSelector.click();
    const patientSearch = page.getByRole('textbox', { name: /Filter patients by ID or name/i });
    await expect(patientSearch).toBeVisible({ timeout: 5000 });
    await patientSearch.fill('Wei');
    await page.waitForTimeout(300);
    await page.getByRole('option').filter({ hasText: /Chen, Wei|Wei Chen/i }).first().click();

    const proceedBtn = page.getByRole('button', { name: /Start Testing Session/i });
    await expect(proceedBtn).toBeVisible({ timeout: 5000 });
    await proceedBtn.click();
    await dismissHelpModal(page);

    const identityBar = page.locator('[aria-label="Active patient identity"]');
    await expect(identityBar).toBeVisible({ timeout: 10000 });
    await expect(identityBar).toContainText(/Chen, Wei|Wei Chen/i);

    // Scroll the page well past the top of the drug grid; the bar must remain on screen.
    await page.mouse.wheel(0, 1500);
    await expect(identityBar).toBeInViewport();
    await expect(identityBar).toContainText(/Chen, Wei|Wei Chen/i);
  });

  test('navigation guard prevents accidental loss of dirty testing draft', async ({ page }) => {
    // 1. Click the button named /Select Patient from Database/i
    const patientSelector = page.getByRole('button', { name: /Select Patient from Database/i });
    await expect(patientSelector).toBeVisible({ timeout: 10000 });
    await patientSelector.click();

    // 2. Fill the textbox named /Filter patients by ID or name/i with 'Wei', wait 300ms for debounce
    const patientSearch = page.getByRole('textbox', { name: /Filter patients by ID or name/i });
    await expect(patientSearch).toBeVisible({ timeout: 5000 });
    await patientSearch.fill('Wei');
    await page.waitForTimeout(300);

    // 3. Click the option matching /Chen, Wei|Wei Chen/i
    const weiOption = page.getByRole('option').filter({ hasText: /Chen, Wei|Wei Chen/i }).first();
    await expect(weiOption).toBeVisible({ timeout: 5000 });
    await weiOption.click();

    // 4. Click text 'Metoclopramide' (exact) to select a drug
    await page.getByText('Metoclopramide', { exact: true }).first().click();

    // 5. Click the button /Start Testing Session/i, then waitForLoadState('networkidle'), then dismissHelpModal(page)
    const proceedBtn = page.getByRole('button', { name: /Start Testing Session/i });
    await expect(proceedBtn).toBeVisible({ timeout: 5000 });
    await proceedBtn.click();
    await page.waitForLoadState('networkidle');
    await dismissHelpModal(page);

    // 6. Click the button named 'Next Section' (exact), then fill the field getByLabel(/histamine/i).first() with '5' — this dirties the draft
    await page.getByRole('button', { name: 'Next Section', exact: true }).click();
    const histamineField = page.getByLabel(/histamine/i).first();
    await expect(histamineField).toBeVisible({ timeout: 10000 });
    await histamineField.fill('5');

    // 7. Click a dashboard nav link to attempt navigation away
    const dashboardLink = page.locator('a[href="/dashboard"]').first();
    await expect(dashboardLink).toBeVisible({ timeout: 5000 });
    await dashboardLink.click();

    // 8. Assert a dialog containing /Leave testing session\?/i becomes visible
    const guardDialog = page.getByRole('dialog', { name: /Leave testing session\?/i });
    await expect(guardDialog).toBeVisible({ timeout: 5000 });

    // 9. Click its 'Stay in session' button; assert the dialog hides AND page.url() still contains '/testing'
    await guardDialog.getByRole('button', { name: 'Stay in session' }).click();
    await expect(guardDialog).toBeHidden({ timeout: 5000 });
    expect(page.url()).toContain('/testing');

    // 10. Click the dashboard link again; assert the dialog reappears; click 'Leave and keep draft'; assert the dialog hides AND page.url() contains '/dashboard'
    await dashboardLink.click();
    await expect(guardDialog).toBeVisible({ timeout: 5000 });
    await guardDialog.getByRole('button', { name: 'Leave and keep draft' }).click();
    await expect(guardDialog).toBeHidden({ timeout: 5000 });
    expect(page.url()).toContain('/dashboard');
    await expect(page.getByRole('heading', { name: 'Clinical Dashboard' })).toBeVisible({ timeout: 10000 });
  });
});
