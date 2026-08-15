import {
  test, expect, expectClean, gotoDemo, summary, addCategory, openCategory,
  itemRows, escapeRe, SEED,
} from '../helpers/trailweigh';

test.describe('5. Edge-case / torture inputs (core only)', () => {
  test('whitespace-only category name is rejected', async ({ page, errors }) => {
    await gotoDemo(page);
    await addCategory(page, '    ');
    await expect(page.getByText('Category name already exists or is empty')).toBeVisible();
    expect((await summary(page)).categories).toBe(6);
    expectClean(errors);
  });

  test('leading/trailing spaces are trimmed on category add', async ({ page, errors }) => {
    await gotoDemo(page);
    await addCategory(page, '   Trimmed Cat   ');
    await expect(page.getByRole('button', { name: 'Open Trimmed Cat category' })).toBeVisible();
    expectClean(errors);
  });

  test('very long category name does not crash or corrupt the list', async ({ page, errors }) => {
    await gotoDemo(page);
    const long = 'Very Long Category Name '.repeat(4).trim(); // ~95 chars
    await addCategory(page, long);
    await expect(page.getByRole('button', { name: `Open ${long} category` })).toBeVisible();
    expect((await summary(page)).categories).toBe(7);
    await expect(page.getByText('LIST SUMMARY')).toBeVisible(); // layout still usable
    expectClean(errors);
  });

  test('punctuation, quotes, ampersand, slash, emoji, and unicode names render', async ({ page, errors }) => {
    await gotoDemo(page);
    const names = [`Bob's "Kit" & Co. / Misc`, 'Ropa técnica 🏕️ Überzelt'];
    for (const n of names) {
      await addCategory(page, n);
      await expect(page.getByRole('button', { name: `Open ${n} category` })).toBeVisible();
    }
    expect((await summary(page)).categories).toBe(8);
    expectClean(errors);
  });

  test('quantity control only offers integers 1-20 (no 0/negative/decimal)', async ({ page, errors }) => {
    await gotoDemo(page);
    await openCategory(page, 'Backpack');
    const label = (await itemRows(page).first().getAttribute('aria-label')) ?? '';
    const name = label.replace(/ — (expand|collapse) details$/, '');
    await page.getByRole('button', { name: `${name} — expand details` }).click();
    const qty = page.getByLabel(`Quantity of ${name}`);
    const options = await qty.locator('option').allTextContents();
    expect(options).toEqual(Array.from({ length: 20 }, (_, i) => String(i + 1)));
    expectClean(errors);
  });

  test('unusually large weight is handled without NaN/Infinity', async ({ page, errors }) => {
    await gotoDemo(page);
    await openCategory(page, 'Backpack');
    const label = (await itemRows(page).first().getAttribute('aria-label')) ?? '';
    const name = label.replace(/ — (expand|collapse) details$/, '');
    await page.getByRole('button', { name: `${name} — expand details` }).click();
    const w = page.getByLabel(new RegExp(`^Weight of ${escapeRe(name)} in (oz|g)$`));
    await w.fill('99999');
    await w.blur();
    await expect(page.getByText(/NaN|Infinity|undefined/)).toHaveCount(0);
    await expect(page.getByText('LIST SUMMARY')).toBeVisible();
    expectClean(errors);
  });

  test('partially-numeric weight input is either rejected or normalized consistently', async ({ page, errors }) => {
    await gotoDemo(page);
    await openCategory(page, 'Backpack');
    const label = (await itemRows(page).first().getAttribute('aria-label')) ?? '';
    const name = label.replace(/ — (expand|collapse) details$/, '');
    await page.getByRole('button', { name: `${name} — expand details` }).click();
    const w = page.getByLabel(new RegExp(`^Weight of ${escapeRe(name)} in (oz|g)$`));
    const before = await w.inputValue();
    // type=number field: programmatic assignment of invalid text is blanked by
    // the browser, so simulate what a real user can produce — keystrokes.
    // Number inputs drop non-numeric characters as typed, so "12abc" becomes "12".
    await w.click();
    await w.press('ControlOrMeta+a');
    await w.pressSequentially('12abc');
    await w.blur();
    const after = await w.inputValue();
    // Accept either revert-to-previous or normalization to 12; anything else
    // (NaN, corrupted neighbors, empty commit) is a failure.
    expect([before, '12', '12.00']).toContain(after);
    await expect(page.getByText(/NaN/)).toHaveCount(0);
    expectClean(errors);
  });

  test('duplicate item names are tolerated without cross-item corruption', async ({ page, errors }) => {
    await gotoDemo(page);
    await openCategory(page, 'Kitchen');
    const before = await summary(page);
    await page.getByRole('button', { name: 'Add item to Kitchen' }).click();
    await page.getByRole('button', { name: 'Add item to Kitchen' }).click();
    const s = await summary(page);
    expect(s.items).toBe(before.items + 2); // two identical "Unnamed item" entries
    expect(await page.getByRole('button', { name: /^Unnamed item — (expand|collapse) details$/ }).count()).toBe(2);
    expectClean(errors);
  });
});
