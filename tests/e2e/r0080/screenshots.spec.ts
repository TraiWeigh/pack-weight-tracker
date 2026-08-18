/**
 * R0080 — screenshot capture (4 required visual evidence shots).
 */
import { test } from '@playwright/test';
test.use({ viewport: { width: 390, height: 844 } });
const BASE = '/mobile-functional-v3';

test('capture R0080 screenshots', async ({ page }) => {
  await page.goto(BASE);
  await page.waitForSelector('[data-testid="main-scroll"]', { timeout: 15000 });
  await page.waitForTimeout(800);

  // Screenshot 1 — List Summary frosted glass (Group 1, categories scrolled under)
  await page.screenshot({ path: 'screenshots/r0080-01-list-summary-frosted.png' });

  // Navigate to Group 4 (3 Next clicks)
  const next = page.locator('button[aria-label="Next controls"]');
  for (let i = 0; i < 3; i++) {
    await next.first().evaluate(el => (el as HTMLElement).click());
    await page.waitForTimeout(350);
  }

  // Screenshot 2 — Group 4 with Next chevron visible
  await page.screenshot({ path: 'screenshots/r0080-02-group4-with-next.png' });

  // Screenshot 3 — After wrapping: click Next once more → lands on Group 1
  await next.first().evaluate(el => (el as HTMLElement).click());
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'screenshots/r0080-03-group1-after-wrap.png' });

  // Screenshot 4 — Scroll list a bit so categories are partially under frosted bar
  await page.locator('[data-testid="main-scroll"]').evaluate(el => { el.scrollTop = 80; });
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'screenshots/r0080-04-categories-under-frosted-bar.png' });

  console.log('R0080 screenshots done');
});
