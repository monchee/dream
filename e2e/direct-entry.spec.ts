import { type Page } from '@playwright/test';
import { dismissHelpModal, expect, test } from './fixtures';

const CSV_FIXTURE = 'e2e/fixtures/redcap-sample.csv';

async function openHome(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await dismissHelpModal(page);
}

test.describe('Home quick-start entry points', () => {
  test('shows upload and direct Allergy Testing actions on Home', async ({ page }) => {
    await openHome(page);

    await expect(page.getByRole('button', { name: 'Upload REDCap export & review cases', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Go straight to allergy testing', exact: true })).toBeVisible();
  });

  test('opens direct Allergy Testing with editable identity and required-field validation', async ({ page }) => {
    await openHome(page);

    await page.getByRole('button', { name: 'Go straight to allergy testing', exact: true }).click();
    await expect(page).toHaveURL(/\/testing$/);
    await expect(page.getByRole('heading', { name: 'Allergy Testing', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Patient Identity', exact: true })).toBeVisible();
    await expect(page.getByLabel(/REDCap ID/i)).toBeEditable();
    await expect(page.getByLabel(/First Name/i)).toBeEditable();
    await expect(page.getByLabel(/Last Name/i)).toBeEditable();
    await expect(page.getByLabel(/Date of Birth/i)).toBeEditable();
    // R2 identity rail: always present; direct entry shows the NO IDENTITY ENTERED state
    const identityRail = page.getByLabel('Active patient identity');
    await expect(identityRail).toBeVisible();
    await expect(identityRail).toContainText('NO IDENTITY ENTERED');

    // Save is not rendered on section 0 for a first attempt — jump to Review and save
    // to trigger it. The failed validation (empty required fields) redirects back to
    // section 0, where each field shows its own inline error message (not a link).
    await page.getByRole('button', { name: /7\.\s*Review and save/i }).click();
    await page.getByRole('button', { name: 'Save Clinical Record', exact: true }).first().click();
    await expect(page.getByText('REDCap ID is required')).toBeVisible();
    await expect(page.getByText('First name is required')).toBeVisible();
    await expect(page.getByText('Last name is required')).toBeVisible();
  });

  test('supports the /testing deep link as a direct session', async ({ page }) => {
    await page.goto('/testing');
    await page.waitForLoadState('networkidle');
    await dismissHelpModal(page);

    await expect(page).toHaveURL(/\/testing$/);
    await expect(page.getByRole('heading', { name: 'Allergy Testing', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Patient Identity', exact: true })).toBeVisible();
    await expect(page.getByLabel(/REDCap ID/i)).toBeEditable();
    // R2 identity rail: always present; direct entry shows the NO IDENTITY ENTERED state
    const identityRail = page.getByLabel('Active patient identity');
    await expect(identityRail).toBeVisible();
    await expect(identityRail).toContainText('NO IDENTITY ENTERED');
  });

  test('routes a successful Home REDCap upload to Dashboard', async ({ page }) => {
    await openHome(page);

    await page.getByRole('button', { name: 'Upload REDCap export & review cases', exact: true }).click();
    const uploadSheet = page.getByRole('dialog', { name: 'Update Database' });
    await expect(uploadSheet).toBeVisible();
    await uploadSheet.locator('input[type="file"]').setInputFiles(CSV_FIXTURE);

    await expect(page).toHaveURL(/\/dashboard$/);
    const patientTable = page.getByRole('table', { name: 'Patient database' });
    await expect(patientTable.getByRole('button', { name: 'View details for patient: Avery Testpatient' })).toBeVisible({ timeout: 10_000 });
    await expect(patientTable.getByRole('button', { name: 'View details for patient: Jordan Samplepatient' })).toBeVisible();
  });
});
