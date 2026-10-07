import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const _dirname = dirname(fileURLToPath(import.meta.url));
const changelogData = JSON.parse(readFileSync(resolve(_dirname, '../src/shared/data/changelog.json'), 'utf-8')) as Array<{ version: string }>;
const CURRENT_VERSION = changelogData[0].version;
const appBaseUrl = process.env.UI_UX_BASE_URL ?? '';

function appPath(path: string) {
  return `${appBaseUrl}${path}`;
}

async function unlockAndSuppressVersionBanner(page: import('@playwright/test').Page) {
  await page.addInitScript((version) => {
    sessionStorage.setItem('dream:unlocked', 'true');
    localStorage.setItem('dream:last_seen_version', version);
  }, CURRENT_VERSION);
}

test.describe('UI/UX remediation regressions', () => {
  test('Get Started closes from the close button', async ({ page }) => {
    await unlockAndSuppressVersionBanner(page);
    await page.goto(appPath('/'));

    const dialog = page.getByRole('dialog', { name: 'Get Started' });
    await expect(dialog).toBeVisible();

    await dialog.getByRole('button', { name: 'Close Get Started' }).click();

    await expect(dialog).toBeHidden();
  });

  test('Get Started closes with Escape', async ({ page }) => {
    await unlockAndSuppressVersionBanner(page);
    await page.goto(appPath('/'));

    const dialog = page.getByRole('dialog', { name: 'Get Started' });
    await expect(dialog).toBeVisible();

    await page.keyboard.press('Escape');

    await expect(dialog).toBeHidden();
  });

  test('auto-open Get Started does not redirect direct Dashboard route', async ({ page }) => {
    await unlockAndSuppressVersionBanner(page);
    await page.goto(appPath('/dashboard'));

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: 'Clinical Dashboard' })).toBeVisible();
  });

  test('auto-open Get Started does not redirect direct About route', async ({ page }) => {
    await unlockAndSuppressVersionBanner(page);
    await page.goto(appPath('/about'));

    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByRole('heading', { name: 'The DREAM App', exact: true })).toBeVisible();
  });

  test('mobile primary nav exposes the active route label', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await unlockAndSuppressVersionBanner(page);
    await page.goto(appPath('/dashboard'));

    const dialog = page.getByRole('dialog', { name: 'Get Started' });
    if (await dialog.isVisible().catch(() => false)) {
      await dialog.getByRole('button', { name: 'Close' }).click();
    }

    const menuTrigger = page.getByRole('button', { name: 'Open navigation menu' });
    await expect(menuTrigger).toBeVisible({ timeout: 5000 });
    await menuTrigger.click();

    const drawer = page.getByRole('dialog', { name: 'Navigation Drawer' });
    await expect(drawer).toBeVisible({ timeout: 5000 });

    const activeDashboard = drawer
      .locator('nav[aria-label="Workspace mobile navigation"] a[aria-current="page"]')
      .filter({ hasText: 'Dashboard' });

    await expect(activeDashboard).toBeVisible();
  });
});
