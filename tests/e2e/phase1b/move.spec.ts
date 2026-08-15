/**
 * Phase 1B — Item Move Control
 *
 * Target route: /mobile-functional-v3 (V3 sandbox)
 * Classification: A — sandbox route.
 * The Move control is a native <select> (aria-label: "Move {name} to another category")
 * visible only inside an open item's detail panel when ≥ 2 categories exist.
 * Backend: NOT called (no locker mutations expected from Move).
 */
import { test, expect, gotoDemo, openCategory, openItemDetail, summary } from '../helpers/trailweigh';

async function openFirstItemDetail(page: import('@playwright/test').Page, cat: string) {
  await openCategory(page, cat);
  const rows = page.getByRole('button', { name: / — expand details$/ });
  const count = await rows.count();
  if (count === 0) return null;
  const btn = rows.first();
  const label = (await btn.getAttribute('aria-label')) ?? '';
  const name  = label.replace(/ — expand details$/, '');
  await btn.click();
  return name;
}

test.describe('Item Move — native select control', () => {

  test('Move select is visible inside an open item detail', async ({ page, errors }) => {
    await gotoDemo(page);
    const itemName = await openFirstItemDetail(page, 'Backpack');
    expect(itemName, 'found at least one item').not.toBeNull();
    // Move select should be visible (there are multiple categories)
    const moveSelect = page.getByRole('combobox', { name: /Move .* to another category/i }).first();
    await expect(moveSelect).toBeVisible({ timeout: 5000 });
    expect(errors.pageErrors).toEqual([]);
  });

  test('Move select placeholder option is "Move to…"', async ({ page, errors }) => {
    await gotoDemo(page);
    await openFirstItemDetail(page, 'Backpack');
    const moveSelect = page.getByRole('combobox', { name: /Move .* to another category/i }).first();
    await expect(moveSelect).toBeVisible();
    // Default value should be "" / placeholder
    const value = await moveSelect.inputValue();
    expect(value, 'placeholder is empty string').toBe('');
    expect(errors.pageErrors).toEqual([]);
  });

  test('Move select options include other category names', async ({ page, errors }) => {
    await gotoDemo(page);
    await openFirstItemDetail(page, 'Backpack');
    const moveSelect = page.getByRole('combobox', { name: /Move .* to another category/i }).first();
    // Collect option text values
    const options = await moveSelect.evaluate((sel: HTMLSelectElement) =>
      Array.from(sel.options).map(o => o.text),
    );
    expect(options.length).toBeGreaterThan(1); // placeholder + at least 1 destination
    // "Backpack" must NOT be in the destination list (can't move to same cat)
    const destOptions = options.slice(1); // skip placeholder
    expect(destOptions).not.toContain('Backpack');
    // Other SEED categories should appear
    const hasShelter = destOptions.some(o => o === 'Clothing' || o === 'Electronics' || o === 'Shelter');
    expect(hasShelter, 'other categories available as destinations').toBe(true);
    expect(errors.pageErrors).toEqual([]);
  });

  test('Move item from source to destination — item disappears from source', async ({ page, errors }) => {
    await gotoDemo(page);
    const before = await summary(page);
    const itemName = await openFirstItemDetail(page, 'Backpack');
    expect(itemName).not.toBeNull();

    const moveSelect = page.getByRole('combobox', { name: /Move .* to another category/i }).first();
    await expect(moveSelect).toBeVisible();

    // Pick "Clothing" as destination (guaranteed by SEED)
    await moveSelect.selectOption({ label: 'Clothing' });
    await page.waitForTimeout(400);

    // Item's expand-details button should no longer be in Backpack
    // (We re-open Backpack and check)
    await openCategory(page, 'Backpack');
    const backpackRows = page.getByRole('button', { name: / — expand details$/ });
    const rowLabels = await backpackRows.all();
    for (const row of rowLabels) {
      const label = await row.getAttribute('aria-label') ?? '';
      expect(label, `${itemName} must not remain in Backpack`).not.toContain(itemName!);
    }
    expect(errors.pageErrors).toEqual([]);
  });

  test('Move item from source to destination — item appears in destination', async ({ page, errors }) => {
    await gotoDemo(page);
    const itemName = await openFirstItemDetail(page, 'Backpack');
    expect(itemName).not.toBeNull();

    const moveSelect = page.getByRole('combobox', { name: /Move .* to another category/i }).first();
    await moveSelect.selectOption({ label: 'Clothing' });
    await page.waitForTimeout(400);

    // Open Clothing and verify item is there
    await openCategory(page, 'Clothing');
    const clothingRows = page.getByRole('button', { name: / — expand details$/ });
    const labels = await clothingRows.evaluateAll((btns: HTMLElement[]) =>
      btns.map(b => b.getAttribute('aria-label') ?? ''),
    );
    expect(labels.some(l => l.includes(itemName!)), `${itemName} in Clothing after move`).toBe(true);
    expect(errors.pageErrors).toEqual([]);
  });

  test('Move item — total item count is unchanged (no duplication / deletion)', async ({ page, errors }) => {
    await gotoDemo(page);
    const before = await summary(page);
    await openFirstItemDetail(page, 'Backpack');
    const moveSelect = page.getByRole('combobox', { name: /Move .* to another category/i }).first();
    await moveSelect.selectOption({ label: 'Clothing' });
    await page.waitForTimeout(400);
    const after = await summary(page);
    expect(after.items, 'total item count unchanged after move').toBe(before.items);
    expect(errors.pageErrors).toEqual([]);
  });

  test('Move back to original category works', async ({ page, errors }) => {
    await gotoDemo(page);
    // Get item name before first move
    const itemName = await openFirstItemDetail(page, 'Backpack');
    expect(itemName).not.toBeNull();
    const moveSelect = page.getByRole('combobox', { name: /Move .* to another category/i }).first();
    await moveSelect.selectOption({ label: 'Clothing' });
    await page.waitForTimeout(400);

    // Now move back from Clothing to Backpack
    await openCategory(page, 'Clothing');
    // The moved item should now be in Clothing — open its detail
    const clothingExpand = page.getByRole('button', { name: `${itemName} — expand details` });
    if (await clothingExpand.isVisible()) await clothingExpand.click();
    const moveBack = page.getByRole('combobox', { name: /Move .* to another category/i }).first();
    if (await moveBack.isVisible()) {
      await moveBack.selectOption({ label: 'Backpack' });
      await page.waitForTimeout(400);
    }
    // Verify item is back in Backpack
    await openCategory(page, 'Backpack');
    const backpackExpand = page.getByRole('button', { name: `${itemName} — expand details` });
    await expect(backpackExpand).toBeVisible({ timeout: 4000 });
    expect(errors.pageErrors).toEqual([]);
  });

  test('No-op selection (placeholder) does not duplicate item', async ({ page, errors }) => {
    await gotoDemo(page);
    const before = await summary(page);
    await openFirstItemDetail(page, 'Backpack');
    const moveSelect = page.getByRole('combobox', { name: /Move .* to another category/i }).first();
    // Select placeholder value (no-op) — handler only fires for truthy value
    await moveSelect.selectOption({ value: '' });
    await page.waitForTimeout(300);
    const after = await summary(page);
    expect(after.items, 'no duplication on no-op select').toBe(before.items);
    expect(errors.pageErrors).toEqual([]);
  });

});
