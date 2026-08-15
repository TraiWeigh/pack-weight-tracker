import { defineConfig, devices } from '@playwright/test';

/**
 * TrailWeigh Playwright foundation configuration.
 *
 * Values established by the read-only audit:
 * - Dev server: `pnpm --filter @workspace/pack-checklist run dev` (Vite, requires
 *   Replit-injected PORT/BASE_PATH env vars, so Playwright must NOT cold-start it).
 * - Stable test URL: http://localhost:80/pack-checklist via the Replit proxy.
 * - Chromium requires --no-sandbox in this container.
 */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  outputDir: 'test-results',
  use: {
    baseURL: 'http://localhost:80/pack-checklist',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
      },
    },
  ],
  webServer: {
    // The Replit workflow keeps the dev server running with the required
    // PORT/BASE_PATH environment. Playwright must only ever REUSE it — it must
    // never cold-start Vite itself (the env vars would be missing). If the
    // managed server is down, fail fast with a clear message instead.
    command:
      'echo "ERROR: TrailWeigh dev server is not running. Start the Replit workflow (artifacts/pack-checklist: web) before running e2e tests." && exit 1',
    url: 'http://localhost:80/pack-checklist/',
    reuseExistingServer: true,
    timeout: 15_000,
  },
});
