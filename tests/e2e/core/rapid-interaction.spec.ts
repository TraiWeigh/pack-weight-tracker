import {
  test, expect, expectClean, gotoDemo, summary, wedge, isCategoryOpen,
  menuAction, SEED,
} from '../helpers/trailweigh';

test.describe('6. Rapid / repeated interaction', () => {
  test('rapid accordion toggling ends in a consistent state', async ({ page, errors }) => {
    await gotoDemo(page);
    const w = wedge(page, 'Backpack');
    for (let i = 0; i < 6; i++) await w.click();
    // 6 toggles from closed -> closed; state must be deterministic.
    expect(await isCategoryOpen(page, 'Backpack')).toBe(false);
    expect((await summary(page)).items).toBe(SEED.items);
    expectClean(errors);
  });

  test('double-click on Confirm add category does not create duplicates', async ({ page, errors }) => {
    await gotoDemo(page);
    await page.getByRole('button', { name: 'Add a new category to this list' }).click();
    await page.getByLabel('New category name').fill('DoubleClickCat');
    await page.getByRole('button', { name: 'Confirm add category' }).dblclick();
    await expect(page.getByRole('button', { name: /^(Open|Close) DoubleClickCat category$/ })).toHaveCount(1);
    expect((await summary(page)).categories).toBe(7);
    expectClean(errors);
  });

  test('rapid panel switching does not leave stuck overlays', async ({ page, errors }) => {
    await gotoDemo(page);
    // Panels are full-screen (bottom nav covered), so return via Back each time.
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: 'Locker — browse and load saved lists' }).click();
      await page.getByRole('button', { name: 'Back to list' }).click();
      await page.getByRole('button', { name: 'Summary — pack weight and distribution' }).click();
      await page.getByRole('button', { name: 'Back to list' }).click();
      await page.getByRole('button', { name: 'More — settings and tools' }).click();
      await page.getByRole('button', { name: 'Back to list' }).click();
    }
    await expect(page.getByText('LIST SUMMARY')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save current list to Locker' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'About TrailWeigh' })).not.toBeVisible();
    expectClean(errors);
  });

  test('rapid unit switching preserves data integrity', async ({ page, errors }) => {
    await gotoDemo(page);
    for (let i = 0; i < 3; i++) {
      await menuAction(page, 'Metric');
      await menuAction(page, 'Imperial');
    }
    await expect(page.getByText(SEED.backpackSelectedOz)).toBeVisible();
    const s = await summary(page);
    expect(s).toEqual({ selected: SEED.selected, notSelected: SEED.notSelected, categories: 6, items: SEED.items });
    expectClean(errors);
  });

  test('repeated add/cancel of the category editor leaves no residue', async ({ page, errors }) => {
    await gotoDemo(page);
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: 'Add a new category to this list' }).click();
      await page.getByLabel('New category name').fill('Ghost');
      await page.getByRole('button', { name: 'Cancel add category' }).click();
    }
    expect((await summary(page)).categories).toBe(6);
    await expect(page.getByRole('button', { name: /Ghost category/ })).toHaveCount(0);
    expectClean(errors);
  });
});
