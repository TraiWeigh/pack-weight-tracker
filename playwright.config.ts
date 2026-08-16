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
    // Phase 1C note: WebKit and Firefox projects are defined here for future
    // use in a CI environment with proper system library support.  Both browsers
    // are environment-blocked in the current Replit NixOS container:
    //   - Firefox: NSS version conflict (needs NSS_3.107/3.113; Nix glibc-2.40-66
    //     provides an older NSS) + cascade of missing GTK3/X11 libs.
    //   - WebKit: 40+ missing libs (GTK4, GStreamer, ICU 74, Vulkan, Flite TTS…).
    // Install `playwright install-deps firefox webkit` in a standard Ubuntu CI
    // runner (e.g. ubuntu-24.04 on GitHub Actions) to enable both projects.
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
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
