/**
 * R0083P2 screenshots
 * SS-01  Category list closed — tap-anywhere bar visible
 * SS-02  Category open via name-area tap
 * SS-03  Swipe reveal: Open + Delete (category closed)
 * SS-04  Category open, items showing, checkbox left
 */

import { test, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.use({ viewport: { width: 390, height: 844 } });

const ROUTE = '/mobile-functional-v3';
const OUT   = path.join(process.cwd(), 'screenshots', 'r0083p2');

async function waitReady(page: Page) {
  await page.waitForSelector('[data-testid="main-scroll"]', { timeout: 15_000 });
  await page.waitForTimeout(500);
}

test.beforeAll(() => { fs.mkdirSync(OUT, { recursive: true }); });

test('SS-01 — Category list closed, tap-anywhere bar', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await page.screenshot({ path: path.join(OUT, '01-list-closed.png') });
});

test('SS-02 — Category opened via name-area tap', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  const nameDiv = page.locator('[data-testid^="cat-name-"]').first();
  await nameDiv.evaluate(el => (el as HTMLElement).click());
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, '02-opened-via-name-tap.png') });
});

test('SS-03 — Swipe reveal: Open + Delete', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  const row = page.locator('[data-swipe-key^="cat:"]').first();
  const bb = await row.boundingBox();
  if (bb) {
    await page.mouse.move(bb.x + bb.width - 10, bb.y + bb.height / 2);
    await page.mouse.down();
    await page.mouse.move(bb.x + bb.width - 170, bb.y + bb.height / 2, { steps: 15 });
    await page.mouse.up();
    await page.waitForTimeout(400);
  }
  await page.screenshot({ path: path.join(OUT, '03-swipe-reveal.png') });
});

test('SS-04 — Category open, checkbox left', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await page.getByRole('button', { name: /^Open .+ category$/ }).first().evaluate(el => (el as HTMLElement).click());
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, '04-category-open.png') });
});
