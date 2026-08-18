/**
 * R0083 screenshots — wedge and checkbox placement in both handedness modes
 *
 * SS-01  List view, right-handed (wedge on right, list closed)
 * SS-02  List view, right-handed, category open (checkbox on right)
 * SS-03  List view, left-handed (wedge on left, list closed)
 * SS-04  List view, left-handed, category open (checkbox on left)
 */

import { test, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.use({ viewport: { width: 390, height: 844 } });

const ROUTE = '/mobile-functional-v3';
const OUT = path.join(process.cwd(), 'screenshots', 'r0083');

async function waitReady(page: Page) {
  await page.waitForSelector('[data-testid="main-scroll"]', { timeout: 15_000 });
  await page.waitForTimeout(500);
}

test.beforeAll(() => { fs.mkdirSync(OUT, { recursive: true }); });

test('SS-01 — Right-handed: wedge on right, categories closed', async ({ page }) => {
  await page.goto(ROUTE);
  await page.evaluate(() => localStorage.setItem('tw-handedness', 'right'));
  await page.reload();
  await waitReady(page);
  await page.screenshot({ path: path.join(OUT, '01-right-handed-closed.png') });
});

test('SS-02 — Right-handed: category open, checkbox on right', async ({ page }) => {
  await page.goto(ROUTE);
  await page.evaluate(() => localStorage.setItem('tw-handedness', 'right'));
  await page.reload();
  await waitReady(page);
  const wedge = page.getByRole('button', { name: /^Open .+ category$/ }).first();
  await wedge.evaluate((el) => (el as HTMLElement).click());
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, '02-right-handed-open.png') });
});

test('SS-03 — Left-handed: wedge on left, categories closed', async ({ page }) => {
  await page.goto(ROUTE);
  await page.evaluate(() => localStorage.setItem('tw-handedness', 'left'));
  await page.reload();
  await waitReady(page);
  await page.screenshot({ path: path.join(OUT, '03-left-handed-closed.png') });
});

test('SS-04 — Left-handed: category open, checkbox on left', async ({ page }) => {
  await page.goto(ROUTE);
  await page.evaluate(() => localStorage.setItem('tw-handedness', 'left'));
  await page.reload();
  await waitReady(page);
  const wedge = page.getByRole('button', { name: /^Open .+ category$/ }).first();
  await wedge.evaluate((el) => (el as HTMLElement).click());
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, '04-left-handed-open.png') });
});
