import {
  test, expect, expectClean, gotoDemo, summary, openCategory,
  itemRows, itemCheckboxes, SEED,
} from '../helpers/trailweigh';

test.describe('D. Item core behavior', () => {
  test('expanding an item row reveals its detail editors', async ({ page, errors }) => {
    await gotoDemo(page);
    await openCategory(page, 'Backpack');
    const row = itemRows(page).first();
    const label = (await row.getAttribute('aria-label')) ?? '';
    const name = label.replace(/ — (expand|collapse) details$/, '');
    await row.click();
    await expect(page.getByLabel(`Quantity of ${name}`)).toBeVisible();
    await expect(page.getByLabel(new RegExp(`^Weight of ${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} in (oz|g)$`))).toBeVisible();
    // collapse again
    await page.getByRole('button', { name: `${name} — collapse details` }).click();
    expectClean(errors);
  });

  test('checkbox toggle updates Selected / Not Selected counts and back', async ({ page, errors }) => {
    await gotoDemo(page);
    await openCategory(page, 'Backpack');
    const box = itemCheckboxes(page).first();
    const initiallyChecked = (await box.getAttribute('aria-checked')) === 'true';
    await box.click();
    let s = await summary(page);
    expect(s.selected).toBe(initiallyChecked ? SEED.selected - 1 : SEED.selected + 1);
    expect(s.items).toBe(SEED.items);
    await itemCheckboxes(page).first().click();
    s = await summary(page);
    expect(s.selected).toBe(SEED.selected);
    expectClean(errors);
  });

  test('delete item: cancel keeps the item', async ({ page, errors }) => {
    await gotoDemo(page);
    await openCategory(page, 'Backpack');
    const rowsBefore = await itemRows(page).count();
    await page.getByRole('button', { name: /^Delete / }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Delete item confirmation' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).not.toBeVisible();
    expect(await itemRows(page).count()).toBe(rowsBefore);
    expect((await summary(page)).items).toBe(SEED.items);
    expectClean(errors);
  });

  test('delete item: confirm removes exactly that item', async ({ page, errors }) => {
    await gotoDemo(page);
    await openCategory(page, 'Backpack');
    const rowsBefore = await itemRows(page).count();
    const firstLabel = (await itemRows(page).first().getAttribute('aria-label')) ?? '';
    const name = firstLabel.replace(/ — (expand|collapse) details$/, '');
    await page.getByRole('button', { name: `Delete ${name}` }).click();
    const dialog = page.getByRole('dialog', { name: 'Delete item confirmation' });
    await dialog.getByRole('button', { name: 'Delete Item' }).click();
    await expect(page.getByText(`Deleted "${name}"`)).toBeVisible();
    expect(await itemRows(page).count()).toBe(rowsBefore - 1);
    expect((await summary(page)).items).toBe(SEED.items - 1);
    expectClean(errors);
  });

  test('add item appends a new selected "Unnamed item" and opens it for editing', async ({ page, errors }) => {
    await gotoDemo(page);
    await openCategory(page, 'Backpack');
    const before = await summary(page);
    await page.getByRole('button', { name: 'Add item to Backpack' }).click();
    await expect(page.getByRole('button', { name: /^Unnamed item — (expand|collapse) details$/ })).toBeVisible();
    const after = await summary(page);
    expect(after.items).toBe(before.items + 1);
    expect(after.selected).toBe(before.selected + 1); // new items are created selected
    // User intent: a just-created item should open its detail editor so it can
    // be configured immediately.
    await expect(
      page.getByRole('button', { name: 'Unnamed item — collapse details' }),
      'newly added item should be expanded for editing',
    ).toBeVisible();
    expectClean(errors);
  });

  test('items have no name editor anywhere (rename-item capability check)', async ({ page, errors }) => {
    await gotoDemo(page);
    await openCategory(page, 'Backpack');
    await page.getByRole('button', { name: 'Add item to Backpack' }).click();
    const row = page.getByRole('button', { name: /^Unnamed item — (expand|collapse) details$/ }).first();
    if ((await row.getAttribute('aria-label'))?.includes('expand')) await row.click();
    // The detail panel exposes qty + weight editors. A name/type editor should
    // exist so a new item does not remain "Unnamed item" forever.
    await expect(page.getByLabel('Quantity of Unnamed item')).toBeVisible();
    // Semantic check: any plausible name/type editing control anywhere on the
    // screen while the new item's detail panel is open. Covers text/search
    // inputs, textareas, contenteditable regions, and an accessible textbox
    // labeled for the item. Page-wide absence implies item-scoped absence.
    const editors = page.locator(
      'input[type="text"], input[type="search"], input:not([type]), textarea, [contenteditable="true"]',
    );
    const labeledEditor = page.getByRole('textbox', { name: /name|type|Unnamed item/i });
    const count = (await editors.count()) + (await labeledEditor.count());
    expect(count, 'expected a name/type editor for the new item').toBeGreaterThan(0);
    expectClean(errors);
  });

  test('editing one item quantity does not mutate a neighboring item', async ({ page, errors }) => {
    await gotoDemo(page);
    await openCategory(page, 'Clothing');
    const rows = itemRows(page);
    expect(await rows.count()).toBeGreaterThanOrEqual(2);
    const nameA = ((await rows.nth(0).getAttribute('aria-label')) ?? '').replace(/ — (expand|collapse) details$/, '');
    const nameB = ((await rows.nth(1).getAttribute('aria-label')) ?? '').replace(/ — (expand|collapse) details$/, '');
    // open B, record qty
    await page.getByRole('button', { name: `${nameB} — expand details` }).click();
    const qtyBBefore = await page.getByLabel(`Quantity of ${nameB}`).inputValue();
    await page.getByRole('button', { name: `${nameB} — collapse details` }).click();
    // change A
    await page.getByRole('button', { name: `${nameA} — expand details` }).click();
    await page.getByLabel(`Quantity of ${nameA}`).selectOption('3');
    await page.getByRole('button', { name: `${nameA} — collapse details` }).click();
    // verify B unchanged
    await page.getByRole('button', { name: `${nameB} — expand details` }).click();
    expect(await page.getByLabel(`Quantity of ${nameB}`).inputValue()).toBe(qtyBBefore);
    expectClean(errors);
  });

  test('item stays in its category after an edit', async ({ page, errors }) => {
    await gotoDemo(page);
    await openCategory(page, 'Electronics');
    const rows = itemRows(page);
    const countBefore = await rows.count();
    const name = ((await rows.first().getAttribute('aria-label')) ?? '').replace(/ — (expand|collapse) details$/, '');
    await page.getByRole('button', { name: `${name} — expand details` }).click();
    await page.getByLabel(`Quantity of ${name}`).selectOption('2');
    await page.getByRole('button', { name: `${name} — collapse details` }).click();
    expect(await itemRows(page).count()).toBe(countBefore);
    await expect(page.getByRole('button', { name: `${name} — expand details` })).toBeVisible();
    expectClean(errors);
  });
});
