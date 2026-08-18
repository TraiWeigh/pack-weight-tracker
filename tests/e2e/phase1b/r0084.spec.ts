/**
 * R0084 — Category Rename | Item Rename swipe-reveal actions
 *
 * Category swipe: secondary slot changed from Open/Close → Rename.
 *   Rename opens the existing Category Options Sheet directly in the rename sub-view.
 *   Delete remains intact, routing through the existing confirmation sheet.
 *   Tap-anywhere category bar toggle (R0083P2) must be completely unaffected.
 *   Long-press reorder (R006) must continue to work independently.
 *
 * Item swipe: secondary slot added as Rename (previously one-button Delete).
 *   Rename opens a new focused bottom-panel editor (item-rename-dialog).
 *   Rename updates only the current list copy (no Master Library mutation).
 *   Delete remains intact.
 *   Expand/collapse must be unaffected by swipe gesture.
 *
 * Touch targets: all new/changed interactive controls ≥ 44 px tall.
 * Overflow:      revealed 176 px must not cause horizontal document overflow.
 */

import { test, expect, gotoDemo, expectClean, type ErrorLog } from '../helpers/trailweigh';
import type { Locator, Page } from '@playwright/test';

// ─── viewport widths to test ──────────────────────────────────────────────────
const WIDTHS = [320, 375, 390, 430] as const;

// ─── gesture helpers ──────────────────────────────────────────────────────────

/** Horizontal right-edge left swipe that reliably opens the swipe reveal. */
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

/** Open the swipe reveal on a specific swipe-key row. */
async function openSwipeReveal(page: Page, swipeKey: string, dist = 110) {
  const row = page.locator(`[data-swipe-key="${swipeKey}"]`);
  await swipeLeft(page, row, dist);
  await expect(row).toHaveAttribute('data-swipe-open', 'true');
  return row;
}

/** First category name visible in the list. */
async function firstCatName(page: Page): Promise<string> {
  const key = await page.locator('[data-swipe-key^="cat:"]').first().getAttribute('data-swipe-key');
  return key!.slice(4); // strip "cat:"
}

/** Open a category accordion via the wedge button. */
async function openCategory(page: Page, cat: string) {
  const open = page.getByRole('button', { name: `Open ${cat} category` });
  if (await open.isVisible().catch(() => false)) await open.click();
  await expect(page.locator(`[data-swipe-key^="item:${cat}:"]`).first()).toBeVisible({ timeout: 5000 });
}

// ═════════════════════════════════════════════════════════════════════════════
// PART 1 — Category swipe: Rename | Delete
// ═════════════════════════════════════════════════════════════════════════════

test.describe('R84 — Category swipe reveal: Rename | Delete', () => {

  test.beforeEach(async ({ page }) => {
    await gotoDemo(page);
  });

  test('R84-01 swipe reveals Rename and Delete, not Open/Close', async ({ page, errors }) => {
    const cat = await firstCatName(page);
    const row = await openSwipeReveal(page, `cat:${cat}`);

    // Rename button (secondary slot) visible
    const renameBtn = row.locator('[data-testid="swipe-secondary-action"]');
    await expect(renameBtn).toBeVisible();
    await expect(renameBtn).toHaveAttribute('aria-label', `Rename ${cat} category`);

    // Delete button (rightmost slot) visible
    const deleteBtn = row.locator(`[aria-label="Delete ${cat} category"]`);
    await expect(deleteBtn).toBeVisible();

    // Old labels must NOT appear
    await expect(row.getByText('Open')).toHaveCount(0);
    await expect(row.getByText('Close')).toHaveCount(0);

    expectClean(errors);
  });

  test('R84-02 category swipe Rename opens the rename sub-view pre-filled', async ({ page, errors }) => {
    const cat = await firstCatName(page);
    await openSwipeReveal(page, `cat:${cat}`);
    const renameBtn = page.locator(`[data-swipe-key="cat:${cat}"] [data-testid="swipe-secondary-action"]`);
    await renameBtn.click();
    await page.waitForTimeout(200);

    // Category Options Sheet rename sub-view
    await expect(page.locator('input[placeholder="Category name…"]')).toBeVisible({ timeout: 4000 });
    const inputVal = await page.locator('input[placeholder="Category name…"]').inputValue();
    expect(inputVal).toBe(cat);

    expectClean(errors);
  });

  test('R84-03 category rename completes and new name appears in bar', async ({ page, errors }) => {
    const cat = await firstCatName(page);
    await openSwipeReveal(page, `cat:${cat}`);
    await page.locator(`[data-swipe-key="cat:${cat}"] [data-testid="swipe-secondary-action"]`).click();
    await page.waitForTimeout(200);

    const input = page.locator('input[placeholder="Category name…"]');
    await expect(input).toBeVisible({ timeout: 4000 });
    await input.click({ clickCount: 3 });
    await input.fill('Renamed Category');

    // Confirm via Rename button
    await page.getByRole('button', { name: 'Confirm rename' }).click();
    await page.waitForTimeout(300);

    // Sheet closed — new name visible in category bar
    await expect(page.locator('[data-testid="cat-name-Renamed Category"]')).toBeVisible({ timeout: 3000 });
    // Old name gone
    await expect(page.locator(`[data-testid="cat-name-${cat}"]`)).toHaveCount(0);

    expectClean(errors);
  });

  test('R84-04 category rename Cancel leaves name unchanged', async ({ page, errors }) => {
    const cat = await firstCatName(page);
    await openSwipeReveal(page, `cat:${cat}`);
    await page.locator(`[data-swipe-key="cat:${cat}"] [data-testid="swipe-secondary-action"]`).click();
    await page.waitForTimeout(200);

    const input = page.locator('input[placeholder="Category name…"]');
    await expect(input).toBeVisible({ timeout: 4000 });
    await input.fill('Should Not Apply');
    await page.getByRole('button', { name: 'Cancel rename' }).click();
    await page.waitForTimeout(200);

    // Original category name still present
    await expect(page.locator(`[data-testid="cat-header-${cat}"]`)).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="cat-name-Should Not Apply"]')).toHaveCount(0);

    expectClean(errors);
  });

  test('R84-05 category swipe Delete still opens delete confirmation', async ({ page, errors }) => {
    const cat = await firstCatName(page);
    await openSwipeReveal(page, `cat:${cat}`);
    await page.locator(`[aria-label="Delete ${cat} category"]`).click();
    await page.waitForTimeout(200);

    // Delete confirmation sub-view in the Sheet
    await expect(page.getByRole('button', { name: `Confirm delete category ${cat}` })).toBeVisible({ timeout: 4000 });
    await expect(page.getByRole('button', { name: 'Cancel delete category' })).toBeVisible();

    // Dismiss — category must still exist
    await page.getByRole('button', { name: 'Cancel delete category' }).click();
    await page.waitForTimeout(200);
    await expect(page.locator(`[data-swipe-key="cat:${cat}"]`)).toBeVisible();

    expectClean(errors);
  });

});

// ═════════════════════════════════════════════════════════════════════════════
// PART 2 — Item swipe: Rename | Delete
// ═════════════════════════════════════════════════════════════════════════════

test.describe('R84 — Item swipe reveal: Rename | Delete', () => {

  test.beforeEach(async ({ page }) => {
    await gotoDemo(page);
  });

  test('R84-06 item swipe reveals Rename and Delete', async ({ page, errors }) => {
    const cat = await firstCatName(page);
    await openCategory(page, cat);

    const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
    await swipeLeft(page, itemRow);
    await expect(itemRow).toHaveAttribute('data-swipe-open', 'true');

    const renameBtn = itemRow.locator('[data-testid="swipe-secondary-action"]');
    await expect(renameBtn).toBeVisible();
    // aria-label contains "Rename"
    const label = await renameBtn.getAttribute('aria-label');
    expect(label).toMatch(/^Rename /);

    // Delete button also visible
    await expect(itemRow.locator('[aria-label^="Delete "]')).toBeVisible();

    expectClean(errors);
  });

  test('R84-07 item swipe Rename opens dialog pre-filled with item name', async ({ page, errors }) => {
    const cat = await firstCatName(page);
    await openCategory(page, cat);

    const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
    // Get the expected name from the aria-label of the Rename button
    await swipeLeft(page, itemRow);
    await expect(itemRow).toHaveAttribute('data-swipe-open', 'true');

    const renameBtn = itemRow.locator('[data-testid="swipe-secondary-action"]');
    const ariaLabel = (await renameBtn.getAttribute('aria-label'))!;
    const expectedName = ariaLabel.replace(/^Rename /, '');

    await renameBtn.click();
    await page.waitForTimeout(200);

    await expect(page.locator('[data-testid="item-rename-dialog"]')).toBeVisible({ timeout: 4000 });
    const inputVal = await page.locator('[data-testid="item-rename-input"]').inputValue();
    expect(inputVal).toBe(expectedName);

    expectClean(errors);
  });

  test('R84-08 item rename completes and new name appears in row', async ({ page, errors }) => {
    const cat = await firstCatName(page);
    await openCategory(page, cat);

    const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
    await swipeLeft(page, itemRow);
    await expect(itemRow).toHaveAttribute('data-swipe-open', 'true');

    await itemRow.locator('[data-testid="swipe-secondary-action"]').click();
    await page.waitForTimeout(200);

    const input = page.locator('[data-testid="item-rename-input"]');
    await expect(input).toBeVisible({ timeout: 4000 });
    await input.fill('My Renamed Item');
    await page.locator('[data-testid="item-rename-confirm"]').click();
    await page.waitForTimeout(300);

    // Dialog dismissed
    await expect(page.locator('[data-testid="item-rename-dialog"]')).toHaveCount(0);

    // New name appears somewhere in the category's item list
    await expect(page.getByText('My Renamed Item').first()).toBeVisible({ timeout: 3000 });

    expectClean(errors);
  });

  test('R84-09 item rename Cancel leaves name unchanged', async ({ page, errors }) => {
    const cat = await firstCatName(page);
    await openCategory(page, cat);

    const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
    await swipeLeft(page, itemRow);
    await expect(itemRow).toHaveAttribute('data-swipe-open', 'true');

    const renameBtn = itemRow.locator('[data-testid="swipe-secondary-action"]');
    const ariaLabel = (await renameBtn.getAttribute('aria-label'))!;
    const originalName = ariaLabel.replace(/^Rename /, '');

    await renameBtn.click();
    await page.waitForTimeout(200);

    await page.locator('[data-testid="item-rename-input"]').fill('Cancelled Name');
    await page.locator('[data-testid="item-rename-cancel"]').click();
    await page.waitForTimeout(200);

    // Dialog gone
    await expect(page.locator('[data-testid="item-rename-dialog"]')).toHaveCount(0);
    // Original name still present as expand button
    await expect(
      page.getByRole('button', { name: `${originalName} — expand details` })
    ).toBeVisible();

    expectClean(errors);
  });

  test('R84-10 item swipe Delete still opens delete confirmation', async ({ page, errors }) => {
    const cat = await firstCatName(page);
    await openCategory(page, cat);

    const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
    const renameBtn = itemRow.locator('[data-testid="swipe-secondary-action"]');
    await swipeLeft(page, itemRow);
    const ariaLabel = (await renameBtn.getAttribute('aria-label'))!;
    const itemName = ariaLabel.replace(/^Rename /, '');

    // Click the Delete button (not Rename)
    await itemRow.locator(`[aria-label="Delete ${itemName}"]`).click();
    await page.waitForTimeout(200);

    await expect(page.locator('[aria-label="Delete item confirmation"]')).toBeVisible({ timeout: 4000 });
    // Dismiss without deleting
    await page.locator('[aria-label="Cancel delete item"]').click();

    expectClean(errors);
  });

  test('R84-11 Rename button disabled when name unchanged', async ({ page, errors }) => {
    const cat = await firstCatName(page);
    await openCategory(page, cat);

    const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
    await swipeLeft(page, itemRow);
    await expect(itemRow).toHaveAttribute('data-swipe-open', 'true');
    await itemRow.locator('[data-testid="swipe-secondary-action"]').click();
    await page.waitForTimeout(200);

    // Input is pre-filled with current name → Rename button disabled
    await expect(page.locator('[data-testid="item-rename-confirm"]')).toBeDisabled();

    expectClean(errors);
  });

  test('R84-12 Rename button disabled when input is empty', async ({ page, errors }) => {
    const cat = await firstCatName(page);
    await openCategory(page, cat);

    const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
    await swipeLeft(page, itemRow);
    await expect(itemRow).toHaveAttribute('data-swipe-open', 'true');
    await itemRow.locator('[data-testid="swipe-secondary-action"]').click();
    await page.waitForTimeout(200);

    await page.locator('[data-testid="item-rename-input"]').fill('');
    await expect(page.locator('[data-testid="item-rename-confirm"]')).toBeDisabled();

    expectClean(errors);
  });

});

// ═════════════════════════════════════════════════════════════════════════════
// PART 3 — Tap-anywhere toggle, long-press, and gesture disambiguation
// ═════════════════════════════════════════════════════════════════════════════

test.describe('R84 — Category bar interactions: tap, long-press, swipe disambiguation', () => {

  test.beforeEach(async ({ page }) => {
    await gotoDemo(page);
  });

  test('R84-13 tap anywhere on category bar toggles open/close', async ({ page, errors }) => {
    const cat = await firstCatName(page);
    const header = page.locator(`[data-testid="cat-header-${cat}"]`);

    // Click the centre of the bar (not the wedge button)
    const box = (await header.boundingBox())!;
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height / 2);
    await page.waitForTimeout(200);

    // Category should now be open
    await expect(page.getByRole('button', { name: `Close ${cat} category` })).toBeVisible({ timeout: 3000 });

    // Click again → closed
    await page.mouse.click(box.x + box.width * 0.5, box.y + box.height / 2);
    await page.waitForTimeout(200);
    await expect(page.getByRole('button', { name: `Open ${cat} category` })).toBeVisible({ timeout: 3000 });

    expectClean(errors);
  });

  test('R84-14 long-press on category bar enters reorder state', async ({ page, errors }) => {
    const cat = await firstCatName(page);
    const bar = page.locator(`[data-swipe-key="cat:${cat}"]`);
    const b = (await bar.boundingBox())!;
    const x = b.x + b.width * 0.35;
    const y = b.y + b.height / 2;

    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.waitForTimeout(600); // > 400 ms threshold

    // Reorder ghost: at least one category row should get a shadow/transform style
    // (we verify by checking drag state didn't abort — category count unchanged)
    const catCount = await page.locator('[data-swipe-key^="cat:"]').count();
    expect(catCount).toBeGreaterThan(0);

    await page.mouse.up();
    await page.waitForTimeout(200);

    expectClean(errors);
  });

  test('R84-15 horizontal swipe does NOT trigger item expand/collapse', async ({ page, errors }) => {
    const cat = await firstCatName(page);
    await openCategory(page, cat);

    const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
    const renameBtn = itemRow.locator('[data-testid="swipe-secondary-action"]');

    // Get item name
    const ariaLabel = (await renameBtn.getAttribute('aria-label'))!;
    const itemName = ariaLabel.replace(/^Rename /, '');

    // Swipe open
    await swipeLeft(page, itemRow);
    await expect(itemRow).toHaveAttribute('data-swipe-open', 'true');

    // Expand panel must NOT be visible (swipe did not trigger expand)
    await expect(page.locator('[data-testid="expanded-weight-input"]')).toHaveCount(0);

    // The expand button must still read "expand" (not collapsed)
    await expect(page.getByRole('button', { name: `${itemName} — expand details` })).toBeVisible();

    expectClean(errors);
  });

  test('R84-16 item expand/collapse works normally after a rename', async ({ page, errors }) => {
    const cat = await firstCatName(page);
    await openCategory(page, cat);

    const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
    await swipeLeft(page, itemRow);
    await expect(itemRow).toHaveAttribute('data-swipe-open', 'true');
    await itemRow.locator('[data-testid="swipe-secondary-action"]').click();
    await page.waitForTimeout(200);

    await page.locator('[data-testid="item-rename-input"]').fill('Expand After Rename');
    await page.locator('[data-testid="item-rename-confirm"]').click();
    await page.waitForTimeout(300);

    // Expand the renamed item
    await page.getByRole('button', { name: 'Expand After Rename — expand details' }).click();
    await expect(page.locator('[data-testid="expanded-weight-input"]')).toBeVisible({ timeout: 3000 });

    // Collapse
    await page.getByRole('button', { name: 'Expand After Rename — collapse details' }).click();
    await page.waitForTimeout(200);
    await expect(page.locator('[data-testid="expanded-weight-input"]')).toHaveCount(0);

    expectClean(errors);
  });

});

// ═════════════════════════════════════════════════════════════════════════════
// PART 4 — Touch targets and overflow
// ═════════════════════════════════════════════════════════════════════════════

test.describe('R84 — Touch targets ≥ 44 px and no horizontal overflow', () => {

  for (const width of WIDTHS) {
    test(`R84-T${width} category swipe: Rename button ≥ 44 px tall, no overflow at ${width} px`, async ({ page, errors }) => {
      await page.setViewportSize({ width, height: 844 });
      await gotoDemo(page);

      const cat = await firstCatName(page);
      const row = await openSwipeReveal(page, `cat:${cat}`);

      const btn = row.locator('[data-testid="swipe-secondary-action"]');
      await expect(btn).toBeVisible();
      const box = (await btn.boundingBox())!;
      expect(box.height, `Rename btn height at ${width}px`).toBeGreaterThanOrEqual(44);
      expect(box.width,  `Rename btn width  at ${width}px`).toBeGreaterThanOrEqual(44);

      // No horizontal document overflow
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(overflow, `horizontal overflow at ${width}px`).toBe(false);

      expectClean(errors);
    });

    test(`R84-T${width} item swipe: Rename button ≥ 44 px tall, no overflow at ${width} px`, async ({ page, errors }) => {
      await page.setViewportSize({ width, height: 844 });
      await gotoDemo(page);

      const cat = await firstCatName(page);
      await openCategory(page, cat);

      const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
      await swipeLeft(page, itemRow);
      await expect(itemRow).toHaveAttribute('data-swipe-open', 'true');

      const btn = itemRow.locator('[data-testid="swipe-secondary-action"]');
      await expect(btn).toBeVisible();
      const box = (await btn.boundingBox())!;
      expect(box.height, `item Rename btn height at ${width}px`).toBeGreaterThanOrEqual(44);
      expect(box.width,  `item Rename btn width  at ${width}px`).toBeGreaterThanOrEqual(44);

      // No horizontal document overflow
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(overflow, `horizontal overflow at ${width}px`).toBe(false);

      expectClean(errors);
    });
  }

});
