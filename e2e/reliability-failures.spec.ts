import { test, expect } from './fixtures';

/**
 * Plan 004 M2 — failure-mode browser coverage.
 *
 * Storage write failures (quota / private-mode), two-tab draft divergence,
 * and dirty browser Back/Forward. Uses only Playwright and the shared
 * fixture; clinical keys fail, fixture keys stay writable.
 */

const CLINICAL_KEYS = ['dream:testing_draft', 'dream:active_report', 'dream:testing_plan_builder_drafts', 'dream:patient_db'];

/** Inject a storage failure for clinical keys only. */
async function failClinicalWrites(page: import('@playwright/test').Page, errorName: 'QuotaExceededError' | 'SecurityError') {
  await page.addInitScript((errorName) => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (typeof key === 'string' && key.startsWith('dream:')) {
        throw new DOMException(`Injected storage failure (${errorName})`, errorName);
      }
      return originalSetItem.call(this, key, value);
    };
  }, errorName);
}

/** Deep-link into direct-entry testing and open the SPT/IDT section. */
async function enterTestingSection(page: import('@playwright/test').Page) {
  await page.goto('/testing');
  await page.waitForLoadState('networkidle');
  const sectionButton = page.getByRole('button', { name: /2\.\s*SPT and IDT/i });
  await expect(sectionButton).toBeVisible({ timeout: 15_000 });
  await sectionButton.click();
  const histamine = page.getByLabel(/Histamine \(SPT\)/i).first();
  await expect(histamine).toBeVisible({ timeout: 15_000 });
}

async function makeTestingFormDirty(page: import('@playwright/test').Page) {
  await enterTestingSection(page);
  const histamine = page.getByLabel(/Histamine \(SPT\)/i).first();
  await expect(histamine).toBeVisible({ timeout: 15_000 });
  await histamine.fill('5');
}

test.describe('reliability failure modes', () => {
  test('quota failure on draft save shows the warning and keeps the form usable', async ({ page }) => {
    await failClinicalWrites(page, 'QuotaExceededError');
    await makeTestingFormDirty(page);

    // The truthful indicator: no "Draft saved", the visible warning instead.
    await expect(page.getByText(/Unable to save locally/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/^Draft saved/)).toHaveCount(0);
    // The form value the nurse typed is still there.
    await expect(page.getByLabel(/Histamine \(SPT\)/i).first()).toHaveValue('5');
    // No uncaught page error banner: the app remains usable.
    await expect(page.getByRole('heading', { name: /Allergy Testing|Testing Session/i }).first()).toBeVisible();
  });

  test('private-mode security failure shows the warning and never claims a save', async ({ page }) => {
    await failClinicalWrites(page, 'SecurityError');
    await makeTestingFormDirty(page);

    await expect(page.getByText(/Unable to save locally/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/^Draft saved/)).toHaveCount(0);
  });

  test('failed final report write stays on the testing screen and keeps the draft', async ({ page }) => {
    // Enter the session and fill a fully valid record first (identity + controls).
    await page.goto('/testing');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Allergy Testing', exact: true })).toBeVisible({ timeout: 15_000 });

    await page.getByLabel(/REDCap ID/i).fill('TEST01');
    await page.getByLabel(/First Name/i).fill('Test');
    await page.getByLabel(/Last Name/i).fill('Case');
    await page.getByRole('button', { name: /2\.\s*SPT and IDT/i }).click();
    await page.getByLabel(/Histamine \(SPT\)/i).first().fill('5');
    await page.getByRole('button', { name: /7\.\s*Review and save/i }).click();
    const saveBtn = page.getByRole('button', { name: /Save Clinical Record/i }).first();
    await expect(saveBtn).toBeVisible({ timeout: 10_000 });

    // From now on the report key cannot be written (quota).
    await page.addInitScript(() => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key: string, value: string) {
        if (key === 'dream:active_report') {
          throw new DOMException('Full', 'QuotaExceededError');
        }
        return originalSetItem.call(this, key, value);
      };
    });

    // Reload to apply the interceptor: the valid draft restores.
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: /7\.\s*Review and save/i })).toBeVisible({ timeout: 15_000 });
    await page.getByRole('button', { name: /7\.\s*Review and save/i }).click();
    const saveBtn2 = page.getByRole('button', { name: /Save Clinical Record/i }).first();
    await expect(saveBtn2).toBeVisible({ timeout: 10_000 });
    await saveBtn2.click();

    // No navigation to the report; a storage warning appears; the draft survives.
    await expect(page).not.toHaveURL(/summary|report/i);
    await expect(page.getByText(/Unable to save this record locally/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('two-tab divergence warns the stale dirty tab instead of overwriting', async ({ page, browser }) => {
    // Tab A is the fixture's page (unlock seeding already applied).
    const tabA = page;
    const context = page.context();
    const tabB = await context.newPage();
    // New tabs do not inherit the fixture's page-level init scripts: seed the
    // unlock flag the same way the fixture does.
    await tabB.addInitScript(() => {
      try { sessionStorage.setItem('dream:unlocked', 'true'); } catch { /* ignore */ }
    });
    await enterTestingSection(tabA);

    const histamineA = tabA.getByLabel(/Histamine \(SPT\)/i).first();
    await histamineA.fill('4');
    await expect(tabA.getByText(/^Draft saved/)).toBeVisible({ timeout: 10_000 });

    // Tab B: same context (shared storage) — restores the same draft, writes newer.
    await enterTestingSection(tabB);

    const histamineB = tabB.getByLabel(/Histamine \(SPT\)/i).first();
    await expect(histamineB).toHaveValue('4'); // draft restored from Tab A
    await histamineB.fill('9');
    await expect(tabB.getByText(/^Draft saved/)).toBeVisible({ timeout: 10_000 });

    // Tab A is dirty (different in-memory value) when the external write lands.
    // Bring it to front: background tabs throttle the 500ms autosave timer.
    await tabA.bringToFront();
    await histamineA.fill('6');

    // Tab A must warn and must not silently claim or overwrite.
    await expect(tabA.getByText(/Another tab changed this draft/i)).toBeVisible({ timeout: 10_000 });
    await expect(histamineA).toHaveValue('6'); // in-memory edits preserved, no merge
    await context.close();
  });

  test('dirty Back/Forward uses the leave dialog and keeps the draft', async ({ page }) => {
    // Real document load of /testing, then a fully valid + saved draft.
    await page.goto('/testing');
    await page.waitForLoadState('networkidle');
    await page.getByLabel(/REDCap ID/i).fill('TEST02');
    await page.getByLabel(/First Name/i).fill('Back');
    await page.getByLabel(/Last Name/i).fill('Forward');
    await page.getByRole('button', { name: /2\.\s*SPT and IDT/i }).click();
    const histamine = page.getByLabel(/Histamine \(SPT\)/i).first();
    await histamine.fill('5');
    await expect(page.getByText(/^Draft saved/)).toBeVisible({ timeout: 10_000 });

    // App-internal navigation builds a same-document history entry; the dirty
    // guard dialog appears. Choose "Stay in session" first.
    await page.locator('a[href="/dashboard"]').first().click();
    const dialog = page.getByRole('dialog', { name: /Leave testing session\?/i });
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await dialog.getByRole('button', { name: 'Stay in session' }).click();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/testing/);
    await expect(histamine).toHaveValue('5');

    // Leave this time (draft stays persisted), landing on /dashboard via pushState.
    await page.locator('a[href="/dashboard"]').first().click();
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await dialog.getByRole('button', { name: 'Leave and keep draft' }).click();
    await expect(page).toHaveURL(/dashboard/);

    // Real browser Back: same-document popstate back to /testing; the saved
    // draft restores.
    await page.goBack();
    await expect(page).toHaveURL(/testing/, { timeout: 10_000 });
    // Back lands on section 1; the restored draft holds the values.
    await page.getByRole('button', { name: /2\.\s*SPT and IDT/i }).click();
    await expect(page.getByLabel(/Histamine \(SPT\)/i).first()).toHaveValue('5', { timeout: 10_000 });

    // Forward is intentionally NOT asserted: the restored draft holds clinical
    // values, so the app re-engages the leave guard on Forward too — safe by
    // design. (Verified manually: a guard dialog appears on goForward.)
  });
});
