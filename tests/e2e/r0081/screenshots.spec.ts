/**
 * R0081 screenshot capture — 4 required shots:
 *  01  Main list with a mix of checked/unchecked items
 *  02  Preview open — same items + states visible
 *  03  Preview after Clear Checks — Undo pill shown
 *  04  Preview after Undo — Clear Checks pill restored
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

async function clickBack(page: Parameters<typeof test>[1]['page']) {
  await page.locator('button[aria-label="Previous controls"]').first()
    .evaluate(el => (el as HTMLElement).click());
  await page.waitForTimeout(400);
}

async function goToGroup(page: Parameters<typeof test>[1]['page'], idx: number) {
  for (let i = 0; i < 4; i++) {
    const hasBack = await page.evaluate(() =>
      !!(document.querySelector('[data-group-active="true"]')
        ?.querySelector('[aria-label="Previous controls"]'))
    );
    if (!hasBack) break;
    await clickBack(page);
  }
  for (let i = 0; i < idx; i++) await clickNext(page);
  await page.waitForTimeout(150);
}

test('screenshot 01 — main list mixed checked/unchecked', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  // Expand first category so mix of checked/unchecked items is visible
  await page.getByRole('button', { name: /^Open Backpack category$/ }).first().click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, 'r0081-01-main-list-mixed.png'), fullPage: false });
});

test('screenshot 02 — Preview open showing all items with checked state mirrored', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await goToGroup(page, 2);
  await page.locator('button[aria-label="Preview — view and print gear list"]')
    .evaluate(el => (el as HTMLElement).click());
  await page.locator('[data-testid="preview-overlay"]').waitFor({ timeout: 5_000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, 'r0081-02-preview-all-items-mirrored.png'), fullPage: false });
});

test('screenshot 03 — Preview after Clear Checks: Undo pill shown', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await goToGroup(page, 2);
  await page.locator('button[aria-label="Preview — view and print gear list"]')
    .evaluate(el => (el as HTMLElement).click());
  await page.locator('[data-testid="preview-overlay"]').waitFor({ timeout: 5_000 });
  await page.waitForTimeout(300);
  await page.locator('[data-testid="preview-clear-btn"]').click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, 'r0081-03-preview-after-clear-undo-pill.png'), fullPage: false });
});

test('screenshot 04 — Preview after Undo: Clear Checks pill restored', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await goToGroup(page, 2);
  await page.locator('button[aria-label="Preview — view and print gear list"]')
    .evaluate(el => (el as HTMLElement).click());
  await page.locator('[data-testid="preview-overlay"]').waitFor({ timeout: 5_000 });
  await page.waitForTimeout(300);
  await page.locator('[data-testid="preview-clear-btn"]').click();
  await page.waitForTimeout(300);
  await page.locator('[data-testid="preview-undo-btn"]').click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, 'r0081-04-preview-after-undo-clear-restored.png'), fullPage: false });
});
