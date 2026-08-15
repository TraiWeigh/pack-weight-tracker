import { test, expect, expectClean, gotoDemo, summary, backToList, SEED } from '../helpers/trailweigh';

test.describe('A. Startup / basic navigation', () => {
  test('demo route loads: 200, header identity, core content, no redirect, no fatal errors', async ({ page, errors }) => {
    await gotoDemo(page);
    expect(page.url()).toContain('/mobile-functional-v3');
    await expect(page.getByText('TrailWeigh').first()).toBeVisible();
    await expect(page.getByText(SEED.listName)).toBeVisible();
    for (const cat of SEED.categories) {
      await expect(page.getByRole('button', { name: `Open ${cat} category` })).toBeVisible();
    }
    const s = await summary(page);
    expect(s).toEqual({ selected: SEED.selected, notSelected: SEED.notSelected, categories: 6, items: SEED.items });
    expectClean(errors);
  });

  test('bottom nav: Locker opens and returns', async ({ page, errors }) => {
    await gotoDemo(page);
    await page.getByRole('button', { name: 'Locker — browse and load saved lists' }).click();
    await expect(page.getByRole('button', { name: 'Save current list to Locker' })).toBeVisible();
    await backToList(page);
    expectClean(errors);
  });

  test('bottom nav: Summary opens and returns', async ({ page, errors }) => {
    await gotoDemo(page);
    await page.getByRole('button', { name: 'Summary — pack weight and distribution' }).click();
    await expect(page.getByRole('button', { name: 'Back to list' })).toBeVisible();
    await backToList(page);
    expectClean(errors);
  });

  test('bottom nav: More opens and returns', async ({ page, errors }) => {
    await gotoDemo(page);
    await page.getByRole('button', { name: 'More — settings and tools' }).click();
    await expect(page.getByRole('button', { name: 'About TrailWeigh' })).toBeVisible();
    await backToList(page);
    expectClean(errors);
  });

  test('menu opens and closes cleanly', async ({ page, errors }) => {
    await gotoDemo(page);
    await page.getByRole('button', { name: 'Open menu' }).click();
    await expect(page.getByRole('button', { name: 'Undo' })).toBeVisible();
    await backToList(page);
    await expect(page.getByText('LIST SUMMARY')).toBeVisible();
    expectClean(errors);
  });

  test('disabled controls are marked disabled: Search and Catalog', async ({ page, errors }) => {
    await gotoDemo(page);
    // TESTABILITY NOTE: these are divs with aria-disabled, not buttons.
    await expect(page.locator('[aria-label="Search (not yet available)"]')).toHaveAttribute('aria-disabled', 'true');
    await expect(page.locator('[aria-label="Catalog — coming soon"]')).toHaveAttribute('aria-disabled', 'true');
    expectClean(errors);
  });

  test('More screen sub-pages navigate and return (About, Help)', async ({ page, errors }) => {
    await gotoDemo(page);
    await page.getByRole('button', { name: 'More — settings and tools' }).click();
    await page.getByRole('button', { name: 'About TrailWeigh' }).click();
    await page.getByRole('button', { name: 'Back', exact: true }).first().click();
    await page.getByRole('button', { name: 'Help & How-To' }).click();
    await page.getByRole('button', { name: 'Back', exact: true }).first().click();
    await backToList(page);
    expectClean(errors);
  });
});
