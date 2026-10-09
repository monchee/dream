import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.CI ? 'http://localhost:4173' : `http://localhost:${process.env.DREAM_DEV_PORT ?? 3002}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Pin the browser clock to the clinic's timezone. Tests that assert a
    // formatted wall-clock time would otherwise pass only on a machine set to
    // Sydney and fail on CI runners, which are UTC.
    timezoneId: 'Australia/Sydney',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: process.env.CI ? 'npm run preview' : 'npm run dev -- --port 3002',
    port: process.env.CI ? 4173 : Number(process.env.DREAM_DEV_PORT ?? 3002),
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
