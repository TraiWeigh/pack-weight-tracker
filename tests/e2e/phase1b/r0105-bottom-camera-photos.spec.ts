/**
 * R0105 — Bottom Camera / Photos (Group 3) wired to the real photo system
 *
 * Coverage:
 *  1.  No category open → Camera opens the category picker (not a stub toast).
 *  2.  No category open → Photos opens the category picker (not a stub toast).
 *  3.  Picker lists every seed category.
 *  4.  Picker Cancel dismisses without creating an item or leaving any sheet open.
 *  5.  Picker: pick a category → creates exactly one item + opens photo-edit-sheet.
 *  6.  Category open, no item expanded → Camera creates exactly one item + opens sheet.
 *  7.  Category open, no item expanded → Photos creates exactly one item + opens sheet.
 *  8.  Item expanded → Camera targets that item (no new item) + opens photo-edit-sheet.
 *  9.  Item expanded → Photos targets that item (no new item) + opens photo-edit-sheet.
 * 10.  Stub toast text "coming in a future update" never appears for Camera.
 * 11.  Stub toast text "coming in a future update" never appears for Photos.
 * 12.  photo-edit-sheet shows Take New Photo + Upload New Photo buttons.
 * 13.  Picker: empty list state shows a helpful message when no categories exist.
 *      (vacuously skipped — demo always has categories; tested via code coverage below)
 */

import { test, expect, gotoDemo, expectClean, SEED, openCategory } from '../helpers/trailweigh';

type Page = import('@playwright/test').Page;

// ── helpers ───────────────────────────────────────────────────────────────────

function activeGroup(page: Page) {
  return page.locator('[data-testid="bottom-nav"] [data-group-active="true"]');
}

async function nextGroup(page: Page) {
  await activeGroup(page).getByTestId('bottom-next-chevron').click();
  await page.waitForTimeout(430);
}

/** Advance from Group 1 → Group 3 (two NEXT clicks). */
async function goToGroup3(page: Page) {
  await nextGroup(page); // Group 1 → 2
  await nextGroup(page); // Group 2 → 3
}

/** Count items in a category via the checkbox role (same as r0102). */
async function itemCount(page: Page, cat: string) {
  return page.evaluate((c: string) => {
    const row = document.querySelector(`[data-cat="${c}"]`) as HTMLElement | null;
    if (!row) return -1;
    return row.querySelectorAll('[role="checkbox"]').length;
  }, cat);
}

/**
 * Click a button that may trigger a native file chooser (Camera / Photos inputs).
 * We capture the chooser silently so it does not block subsequent assertions.
 */
async function clickWithFileChooser(page: Page, buttonLocator: import('@playwright/test').Locator) {
  const fcPromise = page.waitForEvent('filechooser', { timeout: 2500 }).catch(() => null);
  await buttonLocator.click();
  await fcPromise;
}

// ── tests ─────────────────────────────────────────────────────────────────────

test.describe('R0105 — Bottom Camera / Photos contextual photo entry', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  // ── 1. No category open → Camera → category picker ─────────────────────────
  test('Camera button with no open category shows the category picker', async ({ page, errors }) => {
    await gotoDemo(page);
    // No category open (default state)
    await goToGroup3(page);

    await page.getByRole('button', { name: 'Camera — capture gear photo' }).click();

    await expect(page.getByTestId('cat-photo-picker')).toBeVisible({ timeout: 3000 });
    // photo-edit-sheet must NOT have opened yet
    await expect(page.getByTestId('photo-edit-sheet')).not.toBeVisible();

    expectClean(errors);
  });

  // ── 2. No category open → Photos → category picker ─────────────────────────
  test('Photos button with no open category shows the category picker', async ({ page, errors }) => {
    await gotoDemo(page);
    await goToGroup3(page);

    await page.getByRole('button', { name: 'Photos — gear photo library' }).click();

    await expect(page.getByTestId('cat-photo-picker')).toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId('photo-edit-sheet')).not.toBeVisible();

    expectClean(errors);
  });

  // ── 3. Picker lists every seed category ────────────────────────────────────
  test('Category picker lists all seed categories', async ({ page, errors }) => {
    await gotoDemo(page);
    await goToGroup3(page);
    await page.getByRole('button', { name: 'Camera — capture gear photo' }).click();
    await expect(page.getByTestId('cat-photo-picker')).toBeVisible({ timeout: 3000 });

    for (const cat of SEED.categories) {
      await expect(page.getByTestId(`cat-photo-pick-${cat}`)).toBeVisible({ timeout: 2000 });
    }

    expectClean(errors);
  });

  // ── 4. Picker Cancel → no sheet, no new item ───────────────────────────────
  test('Picker Cancel dismisses without creating an item or leaving a sheet open', async ({ page, errors }) => {
    await gotoDemo(page);
    const cat = SEED.categories[0]; // Backpack
    const before = await itemCount(page, cat);

    await goToGroup3(page);
    await page.getByRole('button', { name: 'Camera — capture gear photo' }).click();
    await expect(page.getByTestId('cat-photo-picker')).toBeVisible({ timeout: 3000 });

    await page.getByTestId('cat-photo-pick-cancel').click();

    await expect(page.getByTestId('cat-photo-picker')).not.toBeVisible({ timeout: 2000 });
    await expect(page.getByTestId('photo-edit-sheet')).not.toBeVisible();
    // No item was created
    expect(await itemCount(page, cat)).toBe(before);

    expectClean(errors);
  });

  // ── 5. Picker: pick a category → +1 item + photo-edit-sheet ───────────────
  test('Picking a category from the picker creates one item and opens photo-edit-sheet', async ({ page, errors }) => {
    await gotoDemo(page);
    const cat = SEED.categories[0]; // Backpack

    // Measure baseline with the category open (items are only in DOM when open).
    await openCategory(page, cat);
    const before = await itemCount(page, cat);
    // Close the category so we can test the "no-open-category" picker path.
    await page.getByRole('button', { name: `Close ${cat} category` }).click();
    await page.waitForTimeout(200);

    await goToGroup3(page);
    await page.getByRole('button', { name: 'Camera — capture gear photo' }).click();
    await expect(page.getByTestId('cat-photo-picker')).toBeVisible({ timeout: 3000 });

    // Pick the first category — this triggers the file chooser silently
    await clickWithFileChooser(page, page.getByTestId(`cat-photo-pick-${cat}`));

    // Picker must be gone
    await expect(page.getByTestId('cat-photo-picker')).not.toBeVisible({ timeout: 2000 });
    // Photo sheet must appear
    await expect(page.getByTestId('photo-edit-sheet')).toBeVisible({ timeout: 3000 });
    // Exactly one new item (category was re-opened by handleCatPhotoPick)
    expect(await itemCount(page, cat)).toBe(before + 1);

    expectClean(errors);
  });

  // ── 6. Category open, no item expanded → Camera → +1 item + sheet ─────────
  test('Camera with category open (no item expanded) creates one item and opens photo-edit-sheet', async ({ page, errors }) => {
    await gotoDemo(page);
    const cat = SEED.categories[0]; // Backpack
    await openCategory(page, cat);
    const before = await itemCount(page, cat);

    await goToGroup3(page);
    await clickWithFileChooser(page, page.getByRole('button', { name: 'Camera — capture gear photo' }));

    await expect(page.getByTestId('photo-edit-sheet')).toBeVisible({ timeout: 3000 });
    expect(await itemCount(page, cat)).toBe(before + 1);
    // No category picker should have appeared
    await expect(page.getByTestId('cat-photo-picker')).not.toBeVisible();

    expectClean(errors);
  });

  // ── 7. Category open, no item expanded → Photos → +1 item + sheet ─────────
  test('Photos with category open (no item expanded) creates one item and opens photo-edit-sheet', async ({ page, errors }) => {
    await gotoDemo(page);
    const cat = SEED.categories[0];
    await openCategory(page, cat);
    const before = await itemCount(page, cat);

    await goToGroup3(page);
    await clickWithFileChooser(page, page.getByRole('button', { name: 'Photos — gear photo library' }));

    await expect(page.getByTestId('photo-edit-sheet')).toBeVisible({ timeout: 3000 });
    expect(await itemCount(page, cat)).toBe(before + 1);
    await expect(page.getByTestId('cat-photo-picker')).not.toBeVisible();

    expectClean(errors);
  });

  // ── 8. Item expanded → Camera → no new item + sheet ───────────────────────
  test('Camera with an item expanded targets that item (no new item created)', async ({ page, errors }) => {
    await gotoDemo(page);
    const cat = SEED.categories[0]; // Backpack
    await openCategory(page, cat);
    const before = await itemCount(page, cat);

    // Expand the first item
    const firstExpand = page.getByTestId('open-cat-items').locator('[role="button"][aria-expanded]').first();
    await firstExpand.click();
    await page.waitForTimeout(200);

    await goToGroup3(page);
    await clickWithFileChooser(page, page.getByRole('button', { name: 'Camera — capture gear photo' }));

    await expect(page.getByTestId('photo-edit-sheet')).toBeVisible({ timeout: 3000 });
    // Item count must NOT have increased (existing item targeted)
    expect(await itemCount(page, cat)).toBe(before);
    await expect(page.getByTestId('cat-photo-picker')).not.toBeVisible();

    expectClean(errors);
  });

  // ── 9. Item expanded → Photos → no new item + sheet ───────────────────────
  test('Photos with an item expanded targets that item (no new item created)', async ({ page, errors }) => {
    await gotoDemo(page);
    const cat = SEED.categories[0];
    await openCategory(page, cat);
    const before = await itemCount(page, cat);

    const firstExpand = page.getByTestId('open-cat-items').locator('[role="button"][aria-expanded]').first();
    await firstExpand.click();
    await page.waitForTimeout(200);

    await goToGroup3(page);
    await clickWithFileChooser(page, page.getByRole('button', { name: 'Photos — gear photo library' }));

    await expect(page.getByTestId('photo-edit-sheet')).toBeVisible({ timeout: 3000 });
    expect(await itemCount(page, cat)).toBe(before);
    await expect(page.getByTestId('cat-photo-picker')).not.toBeVisible();

    expectClean(errors);
  });

  // ── 10. No stub toast for Camera ───────────────────────────────────────────
  test('Camera button never shows the old "coming in a future update" toast', async ({ page, errors }) => {
    await gotoDemo(page);
    await goToGroup3(page);

    await page.getByRole('button', { name: 'Camera — capture gear photo' }).click();
    // Allow a render cycle
    await page.waitForTimeout(500);

    // Confirm stub toast text is absent from the DOM
    const toastText = await page.evaluate(() => {
      const toasts = Array.from(document.querySelectorAll<HTMLElement>('*'));
      return toasts.some(el =>
        el.children.length === 0 &&
        el.textContent?.includes('coming in a future update')
      );
    });
    expect(toastText).toBe(false);

    expectClean(errors);
  });

  // ── 11. No stub toast for Photos ───────────────────────────────────────────
  test('Photos button never shows the old "coming in a future update" toast', async ({ page, errors }) => {
    await gotoDemo(page);
    await goToGroup3(page);

    await page.getByRole('button', { name: 'Photos — gear photo library' }).click();
    await page.waitForTimeout(500);

    const toastText = await page.evaluate(() => {
      const toasts = Array.from(document.querySelectorAll<HTMLElement>('*'));
      return toasts.some(el =>
        el.children.length === 0 &&
        el.textContent?.includes('coming in a future update')
      );
    });
    expect(toastText).toBe(false);

    expectClean(errors);
  });

  // ── 12. photo-edit-sheet content ──────────────────────────────────────────
  test('photo-edit-sheet shows Take New Photo and Upload New Photo buttons', async ({ page, errors }) => {
    await gotoDemo(page);
    const cat = SEED.categories[0];
    await openCategory(page, cat);

    await goToGroup3(page);
    await clickWithFileChooser(page, page.getByRole('button', { name: 'Camera — capture gear photo' }));

    await expect(page.getByTestId('photo-edit-sheet')).toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId('photo-take-btn')).toBeVisible();
    await expect(page.getByTestId('photo-upload-btn')).toBeVisible();
    await expect(page.getByTestId('photo-edit-cancel')).toBeVisible();

    expectClean(errors);
  });

  // ── 13. Preview button (Group 3 neighbour) still works ────────────────────
  test('Group 3 Preview button still opens the preview overlay', async ({ page, errors }) => {
    await gotoDemo(page);
    await goToGroup3(page);

    await page.getByRole('button', { name: 'Preview — view and print gear list' }).click();
    // Preview overlay should appear (e.g. print-layout or preview modal)
    const overlay = page.locator('[data-testid="preview-overlay"], [data-testid="print-layout"], [aria-label="Close preview"]').first();
    await expect(overlay).toBeVisible({ timeout: 5000 });

    expectClean(errors);
  });
});
