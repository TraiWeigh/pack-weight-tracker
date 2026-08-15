import {
  test, expect, expectClean, gotoDemo, summary, openCategory, isCategoryOpen,
  openCategoryOptions, addCategory, menuAction, SEED,
} from '../helpers/trailweigh';

test.describe('C. Category core behavior', () => {
  test('all six seed categories render closed', async ({ page, errors }) => {
    await gotoDemo(page);
    for (const cat of SEED.categories) {
      await expect(page.getByRole('button', { name: `Open ${cat} category` })).toBeVisible();
    }
    expectClean(errors);
  });

  test('open then close a single category via its wedge', async ({ page, errors }) => {
    await gotoDemo(page);
    await openCategory(page, 'Backpack');
    await page.getByRole('button', { name: 'Close Backpack category' }).click();
    await expect(page.getByRole('button', { name: 'Open Backpack category' })).toBeVisible();
    expectClean(errors);
  });

  test('single-open accordion: opening a second category closes the first', async ({ page, errors }) => {
    await gotoDemo(page);
    await openCategory(page, 'Backpack');
    await openCategory(page, 'Clothing');
    expect(await isCategoryOpen(page, 'Backpack'), 'Backpack should have auto-closed').toBe(false);
    expect(await isCategoryOpen(page, 'Clothing')).toBe(true);
    expectClean(errors);
  });

  test('Expand All opens every category; Collapse All closes every category', async ({ page, errors }) => {
    await gotoDemo(page);
    await menuAction(page, 'Expand All');
    for (const cat of SEED.categories) {
      expect(await isCategoryOpen(page, cat), `${cat} should be open after Expand All`).toBe(true);
    }
    await menuAction(page, 'Collapse All');
    for (const cat of SEED.categories) {
      expect(await isCategoryOpen(page, cat), `${cat} should be closed after Collapse All`).toBe(false);
    }
    expectClean(errors);
  });

  test('after Expand All, the Close wedge of a category actually closes it', async ({ page, errors }) => {
    await gotoDemo(page);
    await menuAction(page, 'Expand All');
    // User intent: pressing "Close Backpack category" while all are expanded
    // should close Backpack.
    await page.getByRole('button', { name: 'Close Backpack category' }).click();
    expect(await isCategoryOpen(page, 'Backpack'), 'Backpack should be closed after pressing its Close control').toBe(false);
    expectClean(errors);
  });

  test('add category: valid name appends and updates the count', async ({ page, errors }) => {
    await gotoDemo(page);
    await addCategory(page, 'Navigation');
    await expect(page.getByText('Category "Navigation" added')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open Navigation category' })).toBeVisible();
    const s = await summary(page);
    expect(s.categories).toBe(7);
    expectClean(errors);
  });

  test('add category: duplicate name is rejected with a toast', async ({ page, errors }) => {
    await gotoDemo(page);
    await addCategory(page, 'Kitchen');
    await expect(page.getByText('Category name already exists or is empty')).toBeVisible();
    const s = await summary(page);
    expect(s.categories).toBe(6);
    expectClean(errors);
  });

  test('add category: empty name is rejected', async ({ page, errors }) => {
    await gotoDemo(page);
    await page.getByRole('button', { name: 'Add a new category to this list' }).click();
    await page.getByRole('button', { name: 'Confirm add category' }).click();
    await expect(page.getByText('Category name already exists or is empty')).toBeVisible();
    const s = await summary(page);
    expect(s.categories).toBe(6);
    expectClean(errors);
  });

  test('rename category succeeds and updates the card', async ({ page, errors }) => {
    await gotoDemo(page);
    await openCategoryOptions(page, 'Kitchen');
    await page.getByRole('button', { name: 'Rename Category' }).click();
    const input = page.getByPlaceholder('Category name…');
    await input.fill('Cook Kit');
    await page.getByRole('button', { name: 'Rename', exact: true }).click();
    await expect(page.getByText('Renamed to "Cook Kit"')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open Cook Kit category' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open Kitchen category' })).not.toBeVisible();
    expectClean(errors);
  });

  test('rename category to an existing name is rejected', async ({ page, errors }) => {
    await gotoDemo(page);
    await openCategoryOptions(page, 'Kitchen');
    await page.getByRole('button', { name: 'Rename Category' }).click();
    await page.getByPlaceholder('Category name…').fill('Shelter');
    await page.getByRole('button', { name: 'Rename', exact: true }).click();
    await expect(page.getByText('Category name already exists')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open Kitchen category' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^(Open|Close) Shelter category$/ })).toHaveCount(1);
    expectClean(errors);
  });

  test('rename with empty value keeps Rename disabled', async ({ page, errors }) => {
    await gotoDemo(page);
    await openCategoryOptions(page, 'Kitchen');
    await page.getByRole('button', { name: 'Rename Category' }).click();
    await page.getByPlaceholder('Category name…').fill('');
    await expect(page.getByRole('button', { name: 'Rename', exact: true })).toBeDisabled();
    expectClean(errors);
  });

  test('delete an empty category removes only that category', async ({ page, errors }) => {
    await gotoDemo(page);
    await addCategory(page, 'TempCat');
    await expect(page.getByRole('button', { name: 'Open TempCat category' })).toBeVisible();
    await openCategoryOptions(page, 'TempCat');
    await page.getByRole('button', { name: 'Delete Category' }).click();
    await expect(page.getByText('Delete "TempCat"?')).toBeVisible();
    await expect(page.getByText(/This category is empty/)).toBeVisible();
    await page.getByRole('button', { name: 'Delete Category' }).click();
    await expect(page.getByRole('button', { name: 'Open TempCat category' })).not.toBeVisible();
    const s = await summary(page);
    expect(s.categories).toBe(6);
    expect(s.items).toBe(SEED.items);
    expectClean(errors);
  });

  test('cancel category deletion keeps the category and its items', async ({ page, errors }) => {
    await gotoDemo(page);
    await openCategoryOptions(page, 'Kitchen');
    await page.getByRole('button', { name: 'Delete Category' }).click();
    await expect(page.getByText('Delete "Kitchen"?')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Open Kitchen category' })).toBeVisible();
    const s = await summary(page);
    expect(s).toEqual({ selected: SEED.selected, notSelected: SEED.notSelected, categories: 6, items: SEED.items });
    expectClean(errors);
  });

  test('delete a category with items also removes its items from the totals', async ({ page, errors }) => {
    await gotoDemo(page);
    const before = await summary(page);
    await openCategoryOptions(page, 'Kitchen');
    await page.getByRole('button', { name: 'Delete Category' }).click();
    await expect(page.getByText(/This category contains \d+ item/)).toBeVisible();
    await page.getByRole('button', { name: 'Delete Category' }).click();
    await expect(page.getByText('Deleted "Kitchen"')).toBeVisible();
    const after = await summary(page);
    expect(after.categories).toBe(before.categories - 1);
    expect(after.items).toBe(before.items - 3); // Kitchen seed has 3 items
    expectClean(errors);
  });
});
