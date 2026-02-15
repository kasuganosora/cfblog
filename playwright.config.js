import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:8787',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  globalSetup: './tests/e2e/global-setup.js',
  webServer: {
    command: 'npx wrangler dev --local --port 8787',
    port: 8787,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
