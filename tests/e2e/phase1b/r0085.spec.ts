/**
 * R0085 — Per-item Locations, Real Item Photos, Category Direct-Edit,
 *          Category|Location View Toggle, Auto-switch to Edit Group on Mutation
 *
 * Coverage:
 *   R85-01  Location row is visible inside item accordion
 *   R85-02  Location picker sheet opens when "No location" button is tapped
 *   R85-03  Typing a new name + Enter creates the location and assigns it
 *   R85-04  Assigned location name is displayed in the item accordion
 *   R85-05  Category|Location view bar is absent when no items have locations
 *   R85-06  Category|Location view bar appears after assigning a location
 *   R85-07  Switching to Location view regroups items under a location header
 *   R85-08  Switching back to Category view restores the category list
 *   R85-09  Location picker shows Remove option for item that already has a location
 *   R85-10  Photo row is visible inside item accordion (not disabled / aria-disabled)
 *   R85-11  "Add Photo" button opens the photo edit sheet
 *   R85-12  Photo edit sheet has Take New Photo, Upload New Photo, Cancel — no Delete when no photo
 *   R85-13  Photo edit sheet Cancel dismisses it
 *   R85-14  Category swipe Edit opens direct-edit dialog (not Category Options sheet)
 *   R85-15  Category direct-edit dialog shows current name pre-filled
 *   R85-16  Category direct-edit dialog Save renames the category
 *   R85-17  Category direct-edit dialog Cancel leaves name unchanged
 *   R85-18  Category direct-edit Save disabled when name unchanged
 *   R85-19  Category direct-edit Save disabled when input is empty
 *   R85-20  No page errors after exercising all location and photo flows
 */

import { test, expect, gotoDemo, expectClean, type ErrorLog } from '../helpers/trailweigh';
import type { Locator, Page } from '@playwright/test';

// ──────────────────────────────────────────────────────────────────────────────
// Shared gesture helpers (mirroring r0084 patterns)
// ──────────────────────────────────────────────────────────────────────────────

/** Swipe left on a locator — same mechanics as r0084. */
async function swipeLeft(page: Page, row: Locator, dist = 110) {
  const box = (await row.boundingBox())!;
  const startX = box.x + box.width - 6;
  const y = box.y + box.height / 2;
  await page.mouse.move(startX, y);
  await page.mouse.down();
  await page.mouse.move(startX - dist, y, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(350);
}

/** First visible category name (from data-swipe-key attribute). */
async function firstCatName(page: Page): Promise<string> {
  const key = await page.locator('[data-swipe-key^="cat:"]').first().getAttribute('data-swipe-key');
  return key!.slice(4); // strip "cat:"
}

/** Open a category accordion via its "Open X category" button. */
async function openCategory(page: Page, cat: string) {
  const openBtn = page.getByRole('button', { name: `Open ${cat} category` });
  if (await openBtn.isVisible().catch(() => false)) await openBtn.click();
  // Wait for at least one item row to appear
  await page.locator(`[data-swipe-key^="item:${cat}:"]`).first().waitFor({ state: 'visible', timeout: 6000 });
}

/**
 * Open the first category, then expand the first item accordion.
 * Returns the category name.
 */
async function openFirstItem(page: Page): Promise<string> {
  const cat = await firstCatName(page);
  await openCategory(page, cat);
  // Click the expand button on the first item in this category
  const expandBtn = page.getByRole('button', { name: /— expand details$/i }).first();
  await expandBtn.waitFor({ state: 'visible', timeout: 6000 });
  await expandBtn.click();
  // Wait for the item-level Location button to confirm expansion
  await page.waitForSelector(
    '[data-testid="item-location-set-btn"], [aria-label*="Change location"]',
    { timeout: 8000 },
  );
  return cat;
}

/**
 * Swipe-reveal the Edit (secondary) action on the first category,
 * then click it — opens the R0085 category direct-edit dialog.
 */
async function swipeEditFirstCat(page: Page) {
  const cat = await firstCatName(page);
  const row = page.locator(`[data-swipe-key="cat:${cat}"]`);
  await swipeLeft(page, row);
  await expect(row).toHaveAttribute('data-swipe-open', 'true');
  await row.locator('[data-testid="swipe-secondary-action"]').click();
  await page.waitForTimeout(200);
}

// ──────────────────────────────────────────────────────────────────────────────
// Location tests
// ──────────────────────────────────────────────────────────────────────────────

test.describe('R85 — Location', () => {

  test('R85-01 Location row visible inside item accordion', async ({ page, errors }) => {
    await gotoDemo(page);
    await openFirstItem(page);
    // The "No location" button or a "Change location" / "Remove location" aria-label must be present
    const locControls = page.locator(
      '[data-testid="item-location-set-btn"], [aria-label*="Change location"], [aria-label*="Remove location"]',
    );
    await expect(locControls.first()).toBeVisible();
    expectClean(errors);
  });

  test('R85-02 Location picker sheet opens when "No location" tapped', async ({ page, errors }) => {
    await gotoDemo(page);
    await openFirstItem(page);
    await page.locator('[data-testid="item-location-set-btn"]').first().click();
    await expect(page.locator('[data-testid="location-picker-sheet"]')).toBeVisible({ timeout: 5000 });
    expectClean(errors);
  });

  test('R85-03 Typing new location + Enter creates and assigns it', async ({ page, errors }) => {
    await gotoDemo(page);
    await openFirstItem(page);
    await page.locator('[data-testid="item-location-set-btn"]').first().click();
    const input = page.locator('[data-testid="location-picker-input"]');
    await input.fill('Bear Canister');
    await input.press('Enter');
    // Sheet must close
    await expect(page.locator('[data-testid="location-picker-sheet"]')).not.toBeVisible({ timeout: 5000 });
    // Location name must appear inside the item accordion
    await expect(page.locator('text=Bear Canister').first()).toBeVisible({ timeout: 5000 });
    expectClean(errors);
  });

  test('R85-04 Assigned location name displayed in accordion', async ({ page, errors }) => {
    await gotoDemo(page);
    await openFirstItem(page);
    await page.locator('[data-testid="item-location-set-btn"]').first().click();
    await page.locator('[data-testid="location-picker-input"]').fill('Hip Belt Pocket');
    await page.locator('[data-testid="location-picker-input"]').press('Enter');
    await expect(page.locator('text=Hip Belt Pocket').first()).toBeVisible({ timeout: 5000 });
    expectClean(errors);
  });

  test('R85-05 Category|Location view bar absent when no items have locations', async ({ page, errors }) => {
    await gotoDemo(page);
    // Fresh demo — no locations assigned
    await expect(page.locator('[data-testid="view-mode-bar"]')).not.toBeVisible();
    expectClean(errors);
  });

  test('R85-06 Category|Location view bar appears after assigning a location', async ({ page, errors }) => {
    await gotoDemo(page);
    await openFirstItem(page);
    await page.locator('[data-testid="item-location-set-btn"]').first().click();
    await page.locator('[data-testid="location-picker-input"]').fill('Pack Top');
    await page.locator('[data-testid="location-picker-input"]').press('Enter');
    // Bar must appear
    await expect(page.locator('[data-testid="view-mode-bar"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="view-mode-category"]')).toBeVisible();
    await expect(page.locator('[data-testid="view-mode-location"]')).toBeVisible();
    expectClean(errors);
  });

  test('R85-07 Switching to Location view shows items grouped under location header', async ({ page, errors }) => {
    await gotoDemo(page);
    await openFirstItem(page);
    await page.locator('[data-testid="item-location-set-btn"]').first().click();
    await page.locator('[data-testid="location-picker-input"]').fill('Tent Pocket');
    await page.locator('[data-testid="location-picker-input"]').press('Enter');
    // Switch view
    await page.locator('[data-testid="view-mode-location"]').click();
    const locView = page.locator('[data-testid="location-view"]');
    await expect(locView).toBeVisible({ timeout: 5000 });
    // Named location group header
    await expect(page.locator('text=Tent Pocket').first()).toBeVisible();
    // No Location group present (remaining items without a location)
    await expect(page.locator('text=No Location').first()).toBeVisible();
    expectClean(errors);
  });

  test('R85-08 Switching back to Category view restores category list', async ({ page, errors }) => {
    await gotoDemo(page);
    await openFirstItem(page);
    await page.locator('[data-testid="item-location-set-btn"]').first().click();
    await page.locator('[data-testid="location-picker-input"]').fill('Sleeping Bag');
    await page.locator('[data-testid="location-picker-input"]').press('Enter');
    await page.locator('[data-testid="view-mode-location"]').click();
    await expect(page.locator('[data-testid="location-view"]')).toBeVisible({ timeout: 5000 });
    // Switch back
    await page.locator('[data-testid="view-mode-category"]').click();
    await expect(page.locator('[data-testid="location-view"]')).not.toBeVisible();
    // Category list reappears
    await expect(page.locator('[data-swipe-key^="cat:"]').first()).toBeVisible();
    expectClean(errors);
  });

  test('R85-09 Location picker shows Remove option for item that already has a location', async ({ page, errors }) => {
    await gotoDemo(page);
    await openFirstItem(page);
    // Assign first
    await page.locator('[data-testid="item-location-set-btn"]').first().click();
    await page.locator('[data-testid="location-picker-input"]').fill('Dry Bag');
    await page.locator('[data-testid="location-picker-input"]').press('Enter');
    // Reopen via Change button
    await page.locator('[aria-label*="Change location"]').first().click();
    await expect(page.locator('[data-testid="location-picker-remove"]')).toBeVisible({ timeout: 5000 });
    expectClean(errors);
  });

});

// ──────────────────────────────────────────────────────────────────────────────
// Photo tests
// ──────────────────────────────────────────────────────────────────────────────

test.describe('R85 — Photos', () => {

  test('R85-10 Photo row visible in accordion — not disabled', async ({ page, errors }) => {
    await gotoDemo(page);
    await openFirstItem(page);
    const addBtn = page.locator('[data-testid="item-photo-add-btn"]').first();
    await expect(addBtn).toBeVisible();
    // Must NOT carry the old disabled styling / aria-disabled
    await expect(addBtn).not.toHaveAttribute('aria-disabled', 'true');
    expectClean(errors);
  });

  test('R85-11 Add Photo button opens photo edit sheet', async ({ page, errors }) => {
    await gotoDemo(page);
    await openFirstItem(page);
    await page.locator('[data-testid="item-photo-add-btn"]').first().click();
    await expect(page.locator('[data-testid="photo-edit-sheet"]')).toBeVisible({ timeout: 5000 });
    expectClean(errors);
  });

  test('R85-12 Photo edit sheet has Take, Upload, Cancel — no Delete when no photo', async ({ page, errors }) => {
    await gotoDemo(page);
    await openFirstItem(page);
    await page.locator('[data-testid="item-photo-add-btn"]').first().click();
    await expect(page.locator('[data-testid="photo-edit-sheet"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="photo-take-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="photo-upload-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="photo-edit-cancel"]')).toBeVisible();
    // Delete must NOT appear when item has no photo yet
    await expect(page.locator('[data-testid="photo-delete-btn"]')).not.toBeVisible();
    expectClean(errors);
  });

  test('R85-13 Photo edit sheet Cancel dismisses it', async ({ page, errors }) => {
    await gotoDemo(page);
    await openFirstItem(page);
    await page.locator('[data-testid="item-photo-add-btn"]').first().click();
    await expect(page.locator('[data-testid="photo-edit-sheet"]')).toBeVisible({ timeout: 5000 });
    await page.locator('[data-testid="photo-edit-cancel"]').click();
    await expect(page.locator('[data-testid="photo-edit-sheet"]')).not.toBeVisible({ timeout: 5000 });
    expectClean(errors);
  });

});

// ──────────────────────────────────────────────────────────────────────────────
// Category Direct-Edit tests
// ──────────────────────────────────────────────────────────────────────────────

test.describe('R85 — Category Direct-Edit', () => {

  test('R85-14 Category swipe Edit opens direct-edit dialog (not Options sheet)', async ({ page, errors }) => {
    await gotoDemo(page);
    await swipeEditFirstCat(page);
    await expect(page.locator('[data-testid="cat-direct-edit-dialog"]')).toBeVisible({ timeout: 6000 });
    // Old Category Options sheet must NOT be present
    await expect(page.locator('[data-testid="cat-options-sheet"]')).not.toBeVisible();
    expectClean(errors);
  });

  test('R85-15 Category direct-edit dialog shows current name pre-filled', async ({ page, errors }) => {
    await gotoDemo(page);
    const cat = await firstCatName(page);
    await swipeEditFirstCat(page);
    const input = page.locator('[data-testid="cat-direct-edit-input"]');
    await input.waitFor({ state: 'visible', timeout: 6000 });
    const val = await input.inputValue();
    expect(val).toBe(cat);
    expectClean(errors);
  });

  test('R85-16 Category direct-edit Save renames the category', async ({ page, errors }) => {
    await gotoDemo(page);
    const cat = await firstCatName(page);
    await swipeEditFirstCat(page);
    const input = page.locator('[data-testid="cat-direct-edit-input"]');
    await input.waitFor({ state: 'visible', timeout: 6000 });
    await input.clear();
    await input.fill('Renamed Category');
    await page.getByRole('button', { name: 'Save category name' }).click();
    // Dialog dismisses
    await expect(page.locator('[data-testid="cat-direct-edit-dialog"]')).not.toBeVisible({ timeout: 5000 });
    // New name appears in the category bar
    await expect(page.locator('[data-testid="cat-name-Renamed Category"]')).toBeVisible({ timeout: 5000 });
    // Old name is gone
    await expect(page.locator(`[data-testid="cat-name-${cat}"]`)).toHaveCount(0);
    expectClean(errors);
  });

  test('R85-17 Category direct-edit Cancel leaves name unchanged', async ({ page, errors }) => {
    await gotoDemo(page);
    const cat = await firstCatName(page);
    await swipeEditFirstCat(page);
    const input = page.locator('[data-testid="cat-direct-edit-input"]');
    await input.waitFor({ state: 'visible', timeout: 6000 });
    await input.fill('Should Not Apply');
    await page.getByRole('button', { name: 'Cancel rename' }).click();
    // Dialog dismisses
    await expect(page.locator('[data-testid="cat-direct-edit-dialog"]')).not.toBeVisible({ timeout: 5000 });
    // Original name still shows
    await expect(page.locator(`[data-testid="cat-header-${cat}"]`)).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="cat-name-Should Not Apply"]')).toHaveCount(0);
    expectClean(errors);
  });

  test('R85-18 Category direct-edit Save disabled when name unchanged', async ({ page, errors }) => {
    await gotoDemo(page);
    await swipeEditFirstCat(page);
    const saveBtn = page.locator('[data-testid="cat-direct-edit-save"]');
    await saveBtn.waitFor({ state: 'visible', timeout: 6000 });
    await expect(saveBtn).toBeDisabled();
    expectClean(errors);
  });

  test('R85-19 Category direct-edit Save disabled when input is empty', async ({ page, errors }) => {
    await gotoDemo(page);
    await swipeEditFirstCat(page);
    const input = page.locator('[data-testid="cat-direct-edit-input"]');
    await input.waitFor({ state: 'visible', timeout: 6000 });
    await input.fill('');
    await expect(page.locator('[data-testid="cat-direct-edit-save"]')).toBeDisabled();
    expectClean(errors);
  });

});

// ──────────────────────────────────────────────────────────────────────────────
// Clean run
// ──────────────────────────────────────────────────────────────────────────────

test('R85-20 No page errors after exercising location and photo flows', async ({ page, errors }) => {
  await gotoDemo(page);
  await openFirstItem(page);

  // Open location picker and cancel
  await page.locator('[data-testid="item-location-set-btn"]').first().click();
  await expect(page.locator('[data-testid="location-picker-sheet"]')).toBeVisible({ timeout: 5000 });
  await page.locator('[data-testid="location-picker-cancel"]').click();
  await expect(page.locator('[data-testid="location-picker-sheet"]')).not.toBeVisible({ timeout: 5000 });

  // Open photo edit sheet and cancel
  await page.locator('[data-testid="item-photo-add-btn"]').first().click();
  await expect(page.locator('[data-testid="photo-edit-sheet"]')).toBeVisible({ timeout: 5000 });
  await page.locator('[data-testid="photo-edit-cancel"]').click();
  await expect(page.locator('[data-testid="photo-edit-sheet"]')).not.toBeVisible({ timeout: 5000 });

  expectClean(errors);
});
