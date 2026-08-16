/**
 * Phase 1B — Print Control
 *
 * Target route: /mobile-functional-v3 (V3 sandbox)
 * Classification: A — sandbox route.
 *
 * Architecture finding: the Print button with aria-label="Print checklist" lives
 * inside the MobileChecklist overlay component, which is only mounted when the
 * user has switched to checklist mode. It is NOT present in the default demo
 * (gear-list) view. R002: the Print entry now lives in the More deck →
 * "Share & Print" card. All tests use that path.
 */
import { test, expect, gotoDemo } from '../helpers/trailweigh';

const PRINT_NAME = /^Print — Print your gear list/;

async function openMoreMenu(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: /^More — settings and tools/ }).click();
  await page.getByRole('button', { name: /^Share & Print — open card/ }).click();
  await expect(page.getByRole('button', { name: PRINT_NAME })).toBeVisible({ timeout: 5000 });
}

test.describe('Print control', () => {

  test('Print entry exists in More menu with accessible label', async ({ page, errors }) => {
    await gotoDemo(page);
    await openMoreMenu(page);
    const printBtn = page.getByRole('button', { name: PRINT_NAME });
    await expect(printBtn).toBeVisible();
    expect(errors.pageErrors).toEqual([]);
  });

  test('Print button in More menu calls window.print (stubbed)', async ({ page, errors }) => {
    await page.addInitScript(() => {
      (window as any).__printCallCount = 0;
      window.print = () => { (window as any).__printCallCount++; };
    });
    await gotoDemo(page);
    await openMoreMenu(page);
    await page.getByRole('button', { name: PRINT_NAME }).click();
    await page.waitForTimeout(300);
    const callCount = await page.evaluate(() => (window as any).__printCallCount);
    expect(callCount, 'window.print called once').toBe(1);
    expect(errors.pageErrors).toEqual([]);
  });

  test('Print via More menu calls window.print (stubbed) — second path', async ({ page, errors }) => {
    await page.addInitScript(() => {
      (window as any).__printCallCount = 0;
      window.print = () => { (window as any).__printCallCount++; };
    });
    await gotoDemo(page);
    await page.getByRole('button', { name: /^More — settings and tools/ }).click();
    await page.getByRole('button', { name: /^Share & Print — open card/ }).click();
    await expect(page.getByRole('button', { name: PRINT_NAME })).toBeVisible();
    await page.getByRole('button', { name: PRINT_NAME }).click();
    await page.waitForTimeout(300);
    const callCount = await page.evaluate(() => (window as any).__printCallCount);
    expect(callCount, 'window.print called once via menu').toBe(1);
    expect(errors.pageErrors).toEqual([]);
  });

  test('Print does not navigate away or corrupt list state', async ({ page, errors }) => {
    await page.addInitScript(() => { window.print = () => {}; });
    await gotoDemo(page);
    await openMoreMenu(page);
    await page.getByRole('button', { name: PRINT_NAME }).click();
    await page.waitForTimeout(500);
    // LIST SUMMARY must still be visible — page not navigated away
    await expect(page.getByText('LIST SUMMARY')).toBeVisible({ timeout: 5000 });
    expect(errors.pageErrors).toEqual([]);
  });

  test('Print does not raise a JS error or page error', async ({ page, errors }) => {
    await page.addInitScript(() => { window.print = () => {}; });
    await gotoDemo(page);
    await openMoreMenu(page);
    await page.getByRole('button', { name: PRINT_NAME }).click();
    await page.waitForTimeout(300);
    expect(errors.pageErrors, 'no uncaught JS errors on print').toEqual([]);
  });

});
