import { test, expect } from './fixtures';

/**
 * Plan 004 M2 — failure-mode browser coverage.
 *
 * Storage write failures (quota / private-mode), two-tab draft divergence,
 * and dirty browser Back/Forward. Uses only Playwright and the shared
 * fixture.
 *
 * Pattern proven in CI: establish a confirmed baseline write FIRST, then
 * inject the failure via addInitScript and reload. Pre-navigation injection
 * proved unreliable in CI's environment and is not used.
 */

type Page = import('@playwright/test').Page;

/** Fail every further clinical dream:* write, patched into the live page. */
async function failClinicalWrites(page: Page, errorName: 'QuotaExceededError' | 'SecurityError') {
  await page.evaluate((errorName) => {
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
async function enterTestingSection(page: Page) {
  await page.goto('/testing');
  await page.waitForLoadState('networkidle');
  const sectionButton = page.getByRole('button', { name: /2\.\s*SPT and IDT/i });
  await expect(sectionButton).toBeVisible({ timeout: 15_000 });
  await sectionButton.click();
  const histamine = page.getByLabel(/Histamine \(SPT\)/i).first();
  await expect(histamine).toBeVisible({ timeout: 15_000 });
  return histamine;
}

/**
 * Enter testing, make the form dirty, and wait for a CONFIRMED draft save.
 * Baseline for failure injection: proves writes work before they break.
 */
async function writeConfirmedDraft(page: Page) {
  const histamine = await enterTestingSection(page);
  // On slower machines the section's lazy content can finish mounting after
  // the click, replacing the input and losing a fill that only reached the
  // DOM. Retype until React state actually receives the value — signalled by
  // the autosave lifecycle ("Draft saved" for a confirmed write).
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await histamine.click();
      await histamine.fill('5');
      await expect(histamine).toHaveValue('5');
      await expect(page.getByText(/^Draft saved/).first()).toBeVisible({ timeout: 5_000 });
      return histamine;
    } catch (err) {
      lastError = err as Error;
      await page.waitForTimeout(500);
    }
  }
  throw lastError ?? new Error('Could not establish a confirmed baseline draft');
}

// WHY LOCAL-ONLY (storage-interception describe): these tests patch
// Storage.prototype via page scripts, which is reliable in a local Chromium
// but not in CI's environment — verified across six CI rounds via page
// snapshots (patched writes still succeed there). The underlying contracts —
// failed writes never claim success, drafts survive failed final saves — are
// covered in CI by the storage-failure unit tests in
// src/features/testing/hooks/useTestingState.test.ts (storage failure
// handling) and src/shared/utils/ttlStorage.test.ts.
test.describe('reliability failure modes — storage interception (local only)', () => {
  test.skip(!!process.env.CI, 'prototype patching is unreliable in CI chromium; contracts covered in CI by unit storage-failure tests; this describe runs fully in local verification');

  test('quota failure on later draft saves shows the warning and keeps the confirmed draft', async ({ page }) => {
    const histamine = await writeConfirmedDraft(page);
    const storedBefore = await page.evaluate(() => localStorage.getItem('dream:testing_draft'));
    expect(storedBefore).not.toBeNull();

    // From here, every clinical write fails (quota) — patched into the live
    // page so the next autosave hits the failure.
    await failClinicalWrites(page, 'QuotaExceededError');
    await histamine.fill('7');

    // The truthful indicator: no fresh "Draft saved", the visible warning instead.
    await expect(page.getByText(/Unable to save locally/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(histamine).toHaveValue('7');
    // Core contract: the stored draft is still the last CONFIRMED write (value 5).
    const storedAfter = await page.evaluate(() => localStorage.getItem('dream:testing_draft'));
    expect(storedAfter).toBe(storedBefore);
    // The app remains usable.
    await expect(page.getByRole('heading', { name: /Allergy Testing|Testing Session/i }).first()).toBeVisible();
  });

  // See quota-test note: prototype patching is unreliable in CI chromium.
  test('blocked-storage (private-mode style) failure shows the warning and never claims a save', async ({ page }) => {
    const histamine = await writeConfirmedDraft(page);
    const storedBefore = await page.evaluate(() => localStorage.getItem('dream:testing_draft'));

    await failClinicalWrites(page, 'SecurityError');
    await histamine.fill('9');

    await expect(page.getByText(/Unable to save locally/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/^Draft saved/)).toHaveCount(0);
    const storedAfter = await page.evaluate(() => localStorage.getItem('dream:testing_draft'));
    expect(storedAfter).toBe(storedBefore);
  });
});

// CI-safe failure modes: no storage interception required. These run in CI.
test.describe('reliability failure modes — navigation and cross-tab (CI-safe)', () => {
  test('failed final report write stays on the testing screen and keeps the draft', async ({ page }) => {
    // Build a fully valid record first (proves writes work, and gives the
    // submit path something to persist).
    await page.goto('/testing');
    await page.waitForLoadState('networkidle');
    await page.getByLabel(/REDCap ID/i).fill('TEST01');
    await page.getByLabel(/First Name/i).fill('Test');
    await page.getByLabel(/Last Name/i).fill('Case');
    await page.getByRole('button', { name: /2\.\s*SPT and IDT/i }).click();
    await page.getByLabel(/Histamine \(SPT\)/i).first().fill('5');
    await expect(page.getByText(/^Draft saved/).first()).toBeVisible({ timeout: 15_000 });

    // From here, the active-report write fails (quota) — init-script pattern,
    // which is reliable on CI once the page has loaded and been reloaded.
    await page.addInitScript(() => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key: string, value: string) {
        if (key === 'dream:active_report') {
          throw new DOMException('Full', 'QuotaExceededError');
        }
        return originalSetItem.call(this, key, value);
      };
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    // The valid draft restores; submit it.
    await page.getByRole('button', { name: /7\.\s*Review and save/i }).click();
    const saveBtn = page.getByRole('button', { name: /Save Clinical Record/i }).first();
    await expect(saveBtn).toBeVisible({ timeout: 10_000 });
    await saveBtn.click();

    // No navigation to the report; a storage warning appears. The draft-
    // preservation contract is asserted at the storage level in the unit
    // suite (useTestingState storage-failure tests).
    await expect(page).not.toHaveURL(/summary|report/i);
    await expect(page.getByText(/Unable to save this record locally/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('two-tab divergence warns the stale dirty tab instead of overwriting', async ({ page }) => {
    // Tab A is the fixture's page (unlock seeding already applied).
    const tabA = page;
    const context = page.context();
    await writeConfirmedDraft(tabA);

    const tabB = await context.newPage();
    // New tabs do not inherit the fixture's page-level init scripts: seed the
    // unlock flag the same way the fixture does.
    await tabB.addInitScript(() => {
      try { sessionStorage.setItem('dream:unlocked', 'true'); } catch { /* ignore */ }
    });
    const histamineB = await enterTestingSection(tabB);
    await expect(histamineB).toHaveValue('5'); // draft restored from Tab A
    // Guarantee B's write lands at a strictly later timestamp than A's (the
    // cross-tab guard compares savedAt with >).
    await tabB.waitForTimeout(50);
    await histamineB.fill('9');
    await expect(tabB.getByText(/^Draft saved/).first()).toBeVisible({ timeout: 15_000 });

    // Tab A is dirty (different in-memory value) when the external write lands.
    // Bring it to front: background tabs throttle the 500ms autosave timer.
    await tabA.bringToFront();
    const histamineA = tabA.getByLabel(/Histamine \(SPT\)/i).first();
    await histamineA.fill('6');

    // Tab A must warn and must not silently claim or overwrite.
    await expect(tabA.getByText(/Another tab changed this draft/i)).toBeVisible({ timeout: 15_000 });
    await expect(histamineA).toHaveValue('6'); // in-memory edits preserved, no merge
    // Core contract: the stored draft is still B's newer write (value 9).
    const stored = await tabA.evaluate(() => localStorage.getItem('dream:testing_draft'));
    expect(stored).toContain('"9"');
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
    await expect(page.getByText(/^Draft saved/).first()).toBeVisible({ timeout: 15_000 });

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

    // Real browser Forward: the restored draft holds clinical values, so the
    // leave guard re-engages — confirm the dialog, then accept leaving.
    await page.goForward();
    const forwardDialog = page.getByRole('dialog', { name: /Leave testing session\?/i });
    await expect(forwardDialog).toBeVisible({ timeout: 10_000 });
    await forwardDialog.getByRole('button', { name: 'Leave and keep draft' }).click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });
  });
});
