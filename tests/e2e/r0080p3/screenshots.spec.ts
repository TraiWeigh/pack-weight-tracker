/**
 * R0080P3 — Screenshot capture: Group 1 and Group 4 label verification
 * Run with: pnpm exec playwright test tests/e2e/r0080p3/screenshots.spec.ts --project=chromium
 */
import { test } from '@playwright/test';
import path from 'path';

test.use({ viewport: { width: 390, height: 844 } });

const ROUTE = '/mobile-functional-v3';
const OUT   = path.resolve('screenshots');

async function waitReady(page: Parameters<typeof test>[1]['page']) {
  await page.waitForSelector('[data-testid="main-scroll"]', { timeout: 15_000 });
  await page.waitForTimeout(500);
}

async function clickNext(page: Parameters<typeof test>[1]['page']) {
  await page.locator('button[aria-label="Next controls"]').first()
    .evaluate(el => (el as HTMLElement).click());
  await page.waitForTimeout(400);
}

test('screenshot — Group 1 showing Next label', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  // Group 1 is the initial state
  await page.screenshot({ path: path.join(OUT, 'r0080p3-01-group1-next-label.png'), fullPage: false });
});

test('screenshot — Group 4 showing Back | Save | Share | More | Next', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  // Navigate to Group 4
  for (let i = 0; i < 3; i++) await clickNext(page);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, 'r0080p3-02-group4-back-save-share-more-next.png'), fullPage: false });
});
