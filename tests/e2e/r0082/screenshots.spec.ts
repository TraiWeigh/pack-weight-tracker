/**
 * R0082 — Screenshot capture spec
 * Run separately after r0082.spec.ts to produce reference images.
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.use({ viewport: { width: 390, height: 844 } });

const ROUTE   = '/mobile-functional-v3';
const OUT_DIR = path.resolve('screenshots/r0082');

test.beforeAll(() => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
});

async function waitReady(page: import('@playwright/test').Page) {
  await page.waitForSelector('[data-testid="main-scroll"]', { timeout: 15_000 });
  await page.waitForTimeout(400);
}

test('SS-01 — App bar with hamburger (right-handed, default)', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await page.screenshot({ path: path.join(OUT_DIR, '01-app-bar-hamburger.png'), fullPage: false });
});

test('SS-02 — Drawer open (right-handed)', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await page.locator('[data-testid="hamburger-btn"]').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT_DIR, '02-drawer-open-right-handed.png'), fullPage: false });
});

test('SS-03 — Drawer open (left-handed)', async ({ page }) => {
  await page.goto(ROUTE);
  await page.evaluate(() => localStorage.setItem('tw-handedness', 'left'));
  await page.reload();
  await waitReady(page);
  await page.locator('[data-testid="hamburger-btn"]').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT_DIR, '03-drawer-open-left-handed.png'), fullPage: false });
  await page.evaluate(() => localStorage.setItem('tw-handedness', 'right'));
});

test('SS-04 — Drawer closed (default state)', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await page.screenshot({ path: path.join(OUT_DIR, '04-drawer-closed.png'), fullPage: false });
});
