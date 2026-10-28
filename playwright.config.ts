import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  // Production cold-restart checks run against built output on port 4183.
  testIgnore: '**/pwa-production.spec.ts',
  fullyParallel: false,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:4173', timezoneId: 'Europe/Istanbul', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run dev -- --config vite.browser.config.ts --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
