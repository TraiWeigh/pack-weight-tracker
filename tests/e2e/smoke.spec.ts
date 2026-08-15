import { test, expect } from '@playwright/test';

/**
 * TrailWeigh foundation smoke test (non-destructive).
 *
 * Opens the demo-mode mobile route (no authentication, no database writes;
 * only harmless sessionStorage initialization in the isolated test context)
 * and verifies the application actually renders.
 */
test('TrailWeigh renders the demo checklist without page errors', async ({ page }, testInfo) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (err) => pageErrors.push(err));

  // Verify the initial document request itself succeeds.
  const response = await page.goto('/mobile-functional-v3');
  expect(response, 'initial navigation should return a response').not.toBeNull();
  expect(response!.ok(), `document request failed: HTTP ${response?.status()}`).toBe(true);

  // Stable UI elements identified during the audit.
  await expect(page.getByText('TrailWeigh').first()).toBeVisible();
  await expect(page.getByText('LIST SUMMARY')).toBeVisible();

  // Proof screenshot after successful render.
  const screenshotPath = testInfo.outputPath('smoke-proof.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  await testInfo.attach('smoke-proof', { path: screenshotPath, contentType: 'image/png' });

  // Bounded post-render settle so late startup errors are also captured.
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1_000);

  // Fail on uncaught application JavaScript errors (console warnings are ignored).
  expect(
    pageErrors.map((e) => e.message),
    'application produced uncaught page errors',
  ).toEqual([]);
});
