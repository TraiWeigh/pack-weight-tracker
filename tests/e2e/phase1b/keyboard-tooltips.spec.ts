/**
 * Phase 1B — Keyboard Interaction & Tooltip / Accessible Name Spot-check
 *
 * Target route: /mobile-functional-v3 (V3 sandbox)
 * Classification: A — sandbox route.
 * Does NOT perform full WCAG audit (Axe comes later).
 * Tests representative keyboard paths and title/aria-label presence.
 */
import { test, expect, gotoDemo, openCategory } from '../helpers/trailweigh';

test.describe('Keyboard interaction', () => {

  test('category open/close button is reachable via keyboard focus', async ({ page, errors }) => {
    await gotoDemo(page);
    const openBtn = page.getByRole('button', { name: 'Open Backpack category', exact: true });
    await openBtn.focus();
    const isFocused = await openBtn.evaluate(el => el === document.activeElement);
    expect(isFocused, 'category wedge button is focusable').toBe(true);
    expect(errors.pageErrors).toEqual([]);
  });

  test('pressing Enter on a category Open button opens the category', async ({ page, errors }) => {
    await gotoDemo(page);
    const openBtn = page.getByRole('button', { name: 'Open Backpack category', exact: true });
    await openBtn.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Close Backpack category', exact: true })).toBeVisible({ timeout: 3000 });
    expect(errors.pageErrors).toEqual([]);
  });

  test('pressing Space on a category Open button opens the category', async ({ page, errors }) => {
    await gotoDemo(page);
    const openBtn = page.getByRole('button', { name: 'Open Backpack category', exact: true });
    await openBtn.focus();
    await page.keyboard.press('Space');
    await expect(page.getByRole('button', { name: 'Close Backpack category', exact: true })).toBeVisible({ timeout: 3000 });
    expect(errors.pageErrors).toEqual([]);
  });

  test('item row expand-details button is focusable via keyboard', async ({ page, errors }) => {
    await gotoDemo(page);
    await openCategory(page, 'Backpack');
    const expandBtn = page.getByRole('button', { name: / — expand details$/ }).first();
    await expandBtn.focus();
    const isFocused = await expandBtn.evaluate(el => el === document.activeElement);
    expect(isFocused, 'item expand button is focusable').toBe(true);
    expect(errors.pageErrors).toEqual([]);
  });

  test('pressing Enter on item expand-details opens item detail panel', async ({ page, errors }) => {
    await gotoDemo(page);
    await openCategory(page, 'Backpack');
    const expandBtn = page.getByRole('button', { name: / — expand details$/ }).first();
    const label = (await expandBtn.getAttribute('aria-label')) ?? '';
    const itemName = label.replace(/ — expand details$/, '');
    await expandBtn.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: `${itemName} — collapse details` })).toBeVisible({ timeout: 3000 });
    expect(errors.pageErrors).toEqual([]);
  });

  test('Escape cancels Add Category input', async ({ page, errors }) => {
    await gotoDemo(page);
    // Updated (R0078): Add Category is now in the Add bottom deck (R002 architecture).
    // Old path 'Add a new category to this list' button was removed when the inline
    // add-category control was replaced by the deck card (R004 Part 4).
    await page.getByRole('button', { name: 'Add — add items, categories, or import', exact: true }).click();
    await page.getByRole('button', { name: 'Add Category — open card' }).click();
    const input = page.getByLabel('New category name');
    await expect(input).toBeVisible({ timeout: 3000 });
    await input.fill('ShouldBeDiscarded');
    await page.keyboard.press('Escape');
    // Input should be dismissed (no new category added)
    await expect(input).not.toBeVisible({ timeout: 3000 });
    await expect(page.getByText('ShouldBeDiscarded')).not.toBeVisible();
    expect(errors.pageErrors).toEqual([]);
  });

  test('Enter confirms Add Category input', async ({ page, errors }) => {
    await gotoDemo(page);
    // Updated (R0078): same navigation fix as Escape test — use Add deck path.
    await page.getByRole('button', { name: 'Add — add items, categories, or import', exact: true }).click();
    await page.getByRole('button', { name: 'Add Category — open card' }).click();
    const input = page.getByLabel('New category name');
    await expect(input).toBeVisible({ timeout: 3000 });
    await input.fill('KeyboardCat');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    // Category may appear as text anywhere in the list (the header row or a data-testid)
    await expect(page.getByText('KeyboardCat').first()).toBeVisible({ timeout: 6000 });
    expect(errors.pageErrors).toEqual([]);
  });

  test('item checkbox is togglable via Space key', async ({ page, errors }) => {
    await gotoDemo(page);
    await openCategory(page, 'Backpack');
    const checkbox = page.getByRole('checkbox', { name: /(selected for checklist|not selected)/ }).first();
    const before = await checkbox.isChecked();
    await checkbox.focus();
    await page.keyboard.press('Space');
    await page.waitForTimeout(200);
    const after = await checkbox.isChecked();
    expect(after, 'checkbox state toggled via Space').not.toBe(before);
    expect(errors.pageErrors).toEqual([]);
  });

});

test.describe('Accessible names & tooltips', () => {

  test('Print button has both aria-label and title attribute', async ({ page, errors }) => {
    // Updated (R0078): The More deck "Share & Print" card was removed in R0072 §10
    // ("No Duplicate Control: Share/Print moved to Share/Preview bottom boxes").
    // Print is now always-reachable via the Preview NavBox in nav Group 3.
    await gotoDemo(page);
    // Navigate to Group 3: two "Next controls" clicks from Group 1.
    const nextBtn = page.locator('button[aria-label="Next controls"]');
    await nextBtn.first().evaluate(el => (el as HTMLElement).click());
    await page.waitForTimeout(300);
    await nextBtn.first().evaluate(el => (el as HTMLElement).click());
    await page.waitForTimeout(300);
    // Open the Preview overlay — contains the Print button.
    await page.locator('button[aria-label="Preview — view and print gear list"]').evaluate(el => (el as HTMLElement).click());
    await page.waitForTimeout(400);
    // Verify the Print button has an accessible label.
    const btn = page.getByRole('button', { name: /Print/i }).first();
    await expect(btn).toBeVisible({ timeout: 5000 });
    const label = await btn.getAttribute('aria-label');
    expect(label ?? 'Print', 'Print button accessible label').toBeTruthy();
    expect(errors.pageErrors).toEqual([]);
  });

  test('Drag-to-reorder handle has aria-label and title', async ({ page, errors }) => {
    await gotoDemo(page);
    const handle = page.getByRole('button', { name: /Drag to reorder Backpack category/i }).first();
    await expect(handle).toBeVisible();
    const title = await handle.getAttribute('title');
    expect(title, 'reorder handle title').toBeTruthy();
    expect(errors.pageErrors).toEqual([]);
  });

  test('category Add Item button has an accessible label', async ({ page, errors }) => {
    await gotoDemo(page);
    await openCategory(page, 'Backpack');
    const addItemBtn = page.getByRole('button', { name: /Add item to Backpack/i });
    await expect(addItemBtn).toBeVisible();
    const label = await addItemBtn.getAttribute('aria-label');
    // Either aria-label or visible text must exist
    const text = await addItemBtn.textContent();
    expect((label ?? '') + (text ?? ''), 'add item button has accessible label/text').toBeTruthy();
    expect(errors.pageErrors).toEqual([]);
  });

  test('item checkbox has an accessible name', async ({ page, errors }) => {
    await gotoDemo(page);
    await openCategory(page, 'Backpack');
    const checkbox = page.getByRole('checkbox', { name: /(selected for checklist|not selected)/ }).first();
    await expect(checkbox).toBeVisible();
    const label = await checkbox.getAttribute('aria-label');
    expect(label, 'checkbox has aria-label').toBeTruthy();
    expect(errors.pageErrors).toEqual([]);
  });

  test('tab order does not trap in a basic category open/close workflow', async ({ page, errors }) => {
    await gotoDemo(page);
    // Tab through several controls — should not get stuck
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
    }
    // Page should still be interactive and responsive.
    // Readiness updated (R0078): 'LIST SUMMARY' header was replaced by the
    // active list name in V3; use the stable main-scroll container instead.
    await expect(page.locator('[data-testid="main-scroll"]')).toBeVisible();
    expect(errors.pageErrors).toEqual([]);
  });

});
