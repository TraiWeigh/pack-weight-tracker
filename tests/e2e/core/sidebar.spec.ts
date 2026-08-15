import { test, expect, expectClean, gotoDemo, backToList, menuAction, openCategory, isCategoryOpen } from '../helpers/trailweigh';

// TrailWeigh's mobile V3 UI uses full-screen overlays/sheets instead of a
// docked sidebar. These tests cover the current panel system.
test.describe('F. Panel / overlay core behavior', () => {
  test('Summary panel opens, shows content, and closes without stale state', async ({ page, errors }) => {
    await gotoDemo(page);
    await page.getByRole('button', { name: 'Summary — pack weight and distribution' }).click();
    await expect(page.getByRole('button', { name: 'Back to list' })).toBeVisible();
    await backToList(page);
    await expect(page.getByText('LIST SUMMARY')).toBeVisible();
    expectClean(errors);
  });

  test('switching between panels does not leave a stuck overlay', async ({ page, errors }) => {
    // NOTE: panels are full-screen and cover the bottom nav (by design), so
    // each switch goes back to the list first.
    await gotoDemo(page);
    await page.getByRole('button', { name: 'Locker — browse and load saved lists' }).click();
    await expect(page.getByRole('button', { name: 'Save current list to Locker' })).toBeVisible();
    await backToList(page);
    await page.getByRole('button', { name: 'Summary — pack weight and distribution' }).click();
    await expect(page.getByRole('button', { name: 'Save current list to Locker' })).not.toBeVisible();
    await backToList(page);
    await page.getByRole('button', { name: 'More — settings and tools' }).click();
    await expect(page.getByRole('button', { name: 'About TrailWeigh' })).toBeVisible();
    await backToList(page);
    await expect(page.getByText('LIST SUMMARY')).toBeVisible();
    expectClean(errors);
  });

  test('panels do not disturb main-list accordion state', async ({ page, errors }) => {
    await gotoDemo(page);
    await openCategory(page, 'Clothing');
    await page.getByRole('button', { name: 'Summary — pack weight and distribution' }).click();
    await backToList(page);
    expect(await isCategoryOpen(page, 'Clothing'), 'Clothing should still be open after panel round-trip').toBe(true);
    expectClean(errors);
  });

  test('Checklist overlay: open, toggle trail progress, clear, close', async ({ page, errors }) => {
    await gotoDemo(page);
    await menuAction(page, /^Checklist — /);
    await expect(page.getByRole('button', { name: 'Close checklist' })).toBeVisible();
    const boxes = page.locator('input[type="checkbox"]');
    if ((await boxes.count()) > 0) {
      await boxes.first().check();
      expect(await boxes.first().isChecked()).toBe(true);
      await page.getByRole('button', { name: 'Clear all checklist progress' }).click();
      expect(await boxes.first().isChecked()).toBe(false);
    }
    await page.getByRole('button', { name: 'Close checklist' }).click();
    await expect(page.getByText('LIST SUMMARY')).toBeVisible();
    expectClean(errors);
  });
});
