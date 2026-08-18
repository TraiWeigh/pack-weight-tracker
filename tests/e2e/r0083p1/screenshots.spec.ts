/**
 * R0083P1 screenshots
 *
 * SS-01  Category list, right-handed — wedge on left, hamburger on left
 * SS-02  Category swipe reveal — Open + Delete both visible (closed category)
 * SS-03  Category swipe reveal — Close + Delete both visible (open category)
 * SS-04  Category open, items showing — checkbox on left
 */

import { test, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.use({ viewport: { width: 390, height: 844 } });

const ROUTE = '/mobile-functional-v3';
const OUT   = path.join(process.cwd(), 'screenshots', 'r0083p1');

async function waitReady(page: Page) {
  await page.waitForSelector('[data-testid="main-scroll"]', { timeout: 15_000 });
  await page.waitForTimeout(500);
}

test.beforeAll(() => { fs.mkdirSync(OUT, { recursive: true }); });

test('SS-01 — Category list, right-handed, wedge left, hamburger left', async ({ page }) => {
  await page.goto(ROUTE);
  await page.evaluate(() => localStorage.setItem('tw-handedness', 'right'));
  await page.reload();
  await waitReady(page);
  await page.screenshot({ path: path.join(OUT, '01-list-right-handed.png') });
});

test('SS-02 — Category swipe reveal: Open + Delete (closed category)', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  const row = page.locator('[data-swipe-key^="cat:"]').first();
  const bb = await row.boundingBox();
  if (bb) {
    const startX = bb.x + bb.width - 10;
    const startY = bb.y + bb.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX - 150, startY, { steps: 15 });
    await page.mouse.up();
    await page.waitForTimeout(400);
  }
  await page.screenshot({ path: path.join(OUT, '02-swipe-reveal-open-label.png') });
});

test('SS-03 — Category swipe reveal: Close + Delete (open category)', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  // Open via wedge first
  await page.getByRole('button', { name: /^Open .+ category$/ }).first().evaluate(el => (el as HTMLElement).click());
  await page.waitForTimeout(400);
  // Now swipe-reveal
  const row = page.locator('[data-swipe-key^="cat:"]').first();
  const bb = await row.boundingBox();
  if (bb) {
    const startX = bb.x + bb.width - 10;
    const startY = bb.y + bb.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX - 150, startY, { steps: 15 });
    await page.mouse.up();
    await page.waitForTimeout(400);
  }
  await page.screenshot({ path: path.join(OUT, '03-swipe-reveal-close-label.png') });
});

test('SS-04 — Category open, items visible, checkbox on left', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await page.getByRole('button', { name: /^Open .+ category$/ }).first().evaluate(el => (el as HTMLElement).click());
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, '04-category-open-checkbox-left.png') });
});
