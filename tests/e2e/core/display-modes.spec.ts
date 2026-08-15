import { test, expect, expectClean, gotoDemo, menuAction, openCategory, summary, SEED } from '../helpers/trailweigh';

// G. Edit View / display modes: the current /mobile-functional-v3 route has NO
// Edit View, Keep it Simple / Be Creative, or Light/Dark controls — those are
// documented as absent (not defects). The closest current "mode" controls are
// the Imperial/Metric unit toggle and the full-screen menu; this file verifies
// repeated mode-style switching leaves the app usable.
test.describe('G. Display-mode style controls (current UI)', () => {
  test('no light/dark or edit-view controls exist in this route (documented)', async ({ page, errors }) => {
    await gotoDemo(page);
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(page.getByRole('button', { name: /dark mode|light mode|edit view|keep it simple|be creative/i })).toHaveCount(0);
    await page.getByRole('button', { name: 'Back to list' }).click();
    expectClean(errors);
  });

  test('repeated unit-mode toggling remains usable and preserves data', async ({ page, errors }) => {
    await gotoDemo(page);
    for (let i = 0; i < 3; i++) {
      await menuAction(page, 'Metric');
      await menuAction(page, 'Imperial');
    }
    await expect(page.getByText(SEED.backpackSelectedOz)).toBeVisible();
    const s = await summary(page);
    expect(s.items).toBe(SEED.items);
    expectClean(errors);
  });

  test('core list remains operable after repeated menu open/close', async ({ page, errors }) => {
    await gotoDemo(page);
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: 'Open menu' }).click();
      await page.getByRole('button', { name: 'Back to list' }).click();
    }
    await openCategory(page, 'Backpack');
    await expect(page.getByRole('button', { name: 'Close Backpack category' })).toBeVisible();
    expectClean(errors);
  });
});
