/**
 * R0080P2 — screenshot capture
 * 6 required shots:
 *  01  List Summary subtle frost at 390px (categories visible underneath)
 *  02  Group 4 with Next chevron + all controls
 *  03  Group 1 after tap-Next wrap from Group 4
 *  04  Save chooser sheet open (Group 4)
 *  05  Long-category open — frosted bar geometry
 *  06  Multi-width composite: 320px Group 1 view
 */
import { test } from '@playwright/test';
test.use({ viewport: { width: 390, height: 844 } });
const BASE = '/mobile-functional-v3';

async function waitReady(page: Parameters<typeof test>[1]['page']) {
  await page.waitForSelector('[data-testid="main-scroll"]', { timeout: 15000 });
  await page.waitForTimeout(600);
}

async function clickNext(page: Parameters<typeof test>[1]['page']) {
  await page.locator('button[aria-label="Next controls"]').first().evaluate(el => (el as HTMLElement).click());
  await page.waitForTimeout(350);
}

test('capture R0080P2 screenshots', async ({ page }) => {
  // ── Shot 01: subtle frost, categories scrolled under ──────────────────────
  await page.goto(BASE);
  await waitReady(page);
  // Scroll a bit so categories appear under bar
  await page.locator('[data-testid="main-scroll"]').evaluate(el => { el.scrollTop = 70; });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'screenshots/r0080p2-01-subtle-frost-390.png' });

  // ── Shot 02: Group 4 with Next chevron ────────────────────────────────────
  await page.locator('[data-testid="main-scroll"]').evaluate(el => { el.scrollTop = 0; });
  for (let i = 0; i < 3; i++) await clickNext(page);
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'screenshots/r0080p2-02-group4-next-chevron.png' });

  // ── Shot 03: Group 1 after tap-Next wrap ──────────────────────────────────
  await clickNext(page);
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'screenshots/r0080p2-03-group1-after-tap-wrap.png' });

  // ── Shot 04: Save chooser open ────────────────────────────────────────────
  for (let i = 0; i < 3; i++) await clickNext(page);
  await page.waitForTimeout(200);
  await page.locator('button[aria-label="Save — save list to Locker"]').evaluate(el => (el as HTMLElement).click());
  await page.waitForSelector('[data-testid="save-chooser-save"]', { timeout: 5000 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'screenshots/r0080p2-04-save-chooser.png' });
  // Close chooser
  await page.locator('[data-testid="save-chooser-cancel"]').click();
  await page.waitForTimeout(200);

  // ── Shot 05: Long-category open — frosted bar geometry ───────────────────
  await page.goto(BASE);
  await waitReady(page);
  // Open first category to show items under frosted bar
  await page.getByRole('button', { name: /^Open .+ category$/ }).first().evaluate(el => (el as HTMLElement).click());
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/r0080p2-05-long-category-frost.png' });

  // ── Shot 06: 320px width layout ───────────────────────────────────────────
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto(BASE);
  await waitReady(page);
  await page.screenshot({ path: 'screenshots/r0080p2-06-320px-layout.png' });

  console.log('R0080P2 screenshots done');
});
