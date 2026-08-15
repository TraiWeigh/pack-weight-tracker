import {
  test, expect, expectClean, gotoDemo, openCategory, openItemDetail, menuAction,
  itemRows, itemCheckboxes, escapeRe, SEED,
} from '../helpers/trailweigh';

async function firstItemName(page: any) {
  const label = (await itemRows(page).first().getAttribute('aria-label')) ?? '';
  return label.replace(/ — (expand|collapse) details$/, '');
}

function weightInput(page: any, name: string) {
  return page.getByLabel(new RegExp(`^Weight of ${escapeRe(name)} in (oz|g)$`));
}

test.describe('E. Weight / quantity calculation', () => {
  test('seed category selected-weight totals render as expected', async ({ page, errors }) => {
    await gotoDemo(page);
    await expect(page.getByText(SEED.backpackSelectedOz)).toBeVisible(); // Backpack 72.50 oz
    await expect(page.getByText('90.00 oz')).toBeVisible(); // Shelter
    expectClean(errors);
  });

  test('quantity multiplication: qty 1 -> 2 doubles the item total', async ({ page, errors }) => {
    await gotoDemo(page);
    await openCategory(page, 'Backpack');
    const name = await firstItemName(page);
    await page.getByRole('button', { name: `${name} — expand details` }).click();
    await page.getByLabel(`Quantity of ${name}`).selectOption('1');
    const w = weightInput(page, name);
    await w.fill('10');
    await w.blur();
    await expect(page.getByText(/Total/).first()).toBeVisible();
    await expect(page.getByText('10.00 oz').first()).toBeVisible();
    await page.getByLabel(`Quantity of ${name}`).selectOption('2');
    await expect(page.getByText('20.00 oz').first()).toBeVisible();
    expectClean(errors);
  });

  test('decimal weight is accepted and multiplies correctly', async ({ page, errors }) => {
    await gotoDemo(page);
    await openCategory(page, 'Backpack');
    const name = await firstItemName(page);
    await page.getByRole('button', { name: `${name} — expand details` }).click();
    await page.getByLabel(`Quantity of ${name}`).selectOption('2');
    const w = weightInput(page, name);
    await w.fill('1.5');
    await w.blur();
    await expect(page.getByText('3.00 oz').first()).toBeVisible();
    expectClean(errors);
  });

  test('zero weight is accepted without NaN', async ({ page, errors }) => {
    await gotoDemo(page);
    await openCategory(page, 'Backpack');
    const name = await firstItemName(page);
    await page.getByRole('button', { name: `${name} — expand details` }).click();
    const w = weightInput(page, name);
    await w.fill('0');
    await w.blur();
    await expect(page.getByText(/NaN|Infinity|undefined/)).toHaveCount(0);
    expectClean(errors);
  });

  test('negative weight is rejected (value reverts)', async ({ page, errors }) => {
    await gotoDemo(page);
    await openCategory(page, 'Backpack');
    const name = await firstItemName(page);
    await page.getByRole('button', { name: `${name} — expand details` }).click();
    const w = weightInput(page, name);
    const before = await w.inputValue();
    await w.fill('-5');
    await w.blur();
    expect(await w.inputValue()).toBe(before);
    await expect(page.getByText(/NaN/)).toHaveCount(0);
    expectClean(errors);
  });

  test('non-numeric weight is rejected (value reverts)', async ({ page, errors }) => {
    await gotoDemo(page);
    await openCategory(page, 'Backpack');
    const name = await firstItemName(page);
    await page.getByRole('button', { name: `${name} — expand details` }).click();
    const w = weightInput(page, name);
    const before = await w.inputValue();
    // type=number inputs blank out alphabetic text; commit should not corrupt.
    await w.fill('');
    await w.blur();
    expect(await w.inputValue()).toBe(before);
    expectClean(errors);
  });

  test('deselecting an item removes it from the category selected-weight total', async ({ page, errors }) => {
    await gotoDemo(page);
    await openCategory(page, 'Shelter');
    // Shelter seed: 3 items all selected, total 90.00 oz.
    await expect(page.getByText('90.00 oz')).toBeVisible();
    await itemCheckboxes(page).first().click();
    await expect(page.getByText('90.00 oz')).not.toBeVisible();
    await itemCheckboxes(page).first().click();
    await expect(page.getByText('90.00 oz')).toBeVisible();
    expectClean(errors);
  });

  test('unit switch to Metric changes suffix to g; switching back preserves values', async ({ page, errors }) => {
    await gotoDemo(page);
    await expect(page.getByText(SEED.backpackSelectedOz)).toBeVisible();
    await menuAction(page, 'Metric');
    await expect(page.getByText(/\d[\d,.]* g\b/).first()).toBeVisible();
    await expect(page.getByText(SEED.backpackSelectedOz)).not.toBeVisible();
    await menuAction(page, 'Imperial');
    await expect(page.getByText(SEED.backpackSelectedOz)).toBeVisible(); // round-trip preserved
    expectClean(errors);
  });

  test('unit conversion math: 10 oz displays as 283.5 g and round-trips', async ({ page, errors }) => {
    await gotoDemo(page);
    await openCategory(page, 'Backpack');
    const name = await firstItemName(page);
    await page.getByRole('button', { name: `${name} — expand details` }).click();
    let w = weightInput(page, name);
    await w.fill('10');
    await w.blur();
    await menuAction(page, 'Metric');
    await openCategory(page, 'Backpack');
    await openItemDetail(page, name);
    w = weightInput(page, name);
    expect(parseFloat(await w.inputValue())).toBeCloseTo(283.5, 1);
    await menuAction(page, 'Imperial');
    await openCategory(page, 'Backpack');
    await openItemDetail(page, name);
    w = weightInput(page, name);
    expect(parseFloat(await w.inputValue())).toBeCloseTo(10, 2);
    expectClean(errors);
  });
});
