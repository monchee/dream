import { test } from './fixtures';

test('debug: prototype override intercepts app writes', async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    (window as any).__calls = [];
    Storage.prototype.setItem = function (key: string, value: string) {
      (window as any).__calls.push(key);
      if (typeof key === 'string' && key.startsWith('dream:')) {
        throw new DOMException('Full', 'QuotaExceededError');
      }
      return original.call(this, key, value);
    };
  });
  await page.goto('/testing');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /2\.\s*SPT and IDT/i }).click();
  await page.getByLabel(/Histamine \(SPT\)/i).first().fill('5');
  await page.waitForTimeout(1500);
  const calls = await page.evaluate(() => (window as any).__calls);
  const draftValue = await page.evaluate(() => localStorage.getItem('dream:testing_draft'));
  console.log('SETITEM CALLS:', JSON.stringify(calls));
  console.log('DRAFT WRITTEN:', draftValue !== null);
});
