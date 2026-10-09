import { test, expect } from './fixtures';

/**
 * Plan 004 M2 — service-worker update while an unlocked session is active.
 *
 * Uses the production preview (npm run test:e2e:ci builds with the real
 * generated sw.js). The current service worker registers normally; the
 * subsequent sw.js request is intercepted and served with a harmless byte
 * change, triggering the real update-detection path. While the session is
 * unlocked, the app must PROMPT ("A new version is ready") and never reload
 * on its own — the explicit "Reload now" action is the only reload path.
 */
test('unlocked service-worker update prompts without auto-reloading', async ({ page }) => {
  // First load: let the real sw.js register.
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  // From now on, serve sw.js with a harmless byte-level change so the
  // browser sees a new version.
  await page.route('**/sw.js', async (route) => {
    const response = await page.request.get(route.request().url());
    const body = await response.text();
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `${body}\n// plan-004 update-coverage build marker\n`,
    });
  });

  // Trigger the real update check through the browser's registration.
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) throw new Error('No service worker registration found');
    await registration.update();
  });

  // The prompt appears; the page does not reload on its own.
  await expect(page.getByText('A new version is ready')).toBeVisible({ timeout: 15_000 });

  // Mark the window before waiting — if the app auto-reloaded, the marker
  // disappears and the prompt would not come back by itself.
  await page.evaluate(() => {
    (window as unknown as { __plan004NoAutoReload: boolean }).__plan004NoAutoReload = true;
  });
  await page.waitForTimeout(2_000);
  expect(await page.evaluate(() => (window as unknown as { __plan004NoAutoReload?: boolean }).__plan004NoAutoReload)).toBe(true);
  await expect(page.getByText('A new version is ready')).toBeVisible();

  // The explicit Reload action is present — the only path that activates.
  await expect(page.getByRole('button', { name: /reload/i })).toBeVisible();
});
