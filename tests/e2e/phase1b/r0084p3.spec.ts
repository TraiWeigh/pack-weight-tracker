/**
 * R0084P3 — "Cancel | Save" button wording in name-edit dialogs
 *
 * Both the category rename sheet and the item rename dialog previously
 * showed "Rename" as the confirmation button. R0084P3 changes that visible
 * label to "Save". The two-button pattern is now "Cancel | Save" in both
 * dialogs. aria-labels are updated to match ("Save category name" /
 * "Save item name"). All validation, data mutation, and entry-point
 * behaviour is unchanged.
 *
 * Tests verify:
 *   - Visible button text is "Save" (not "Rename") in category sheet
 *   - Visible button text is "Save" (not "Rename") in item dialog
 *   - aria-labels are descriptive ("Save category name" / "Save item name")
 *   - "Cancel" label unchanged in both dialogs
 *   - Save disabled when value unchanged or empty (cat + item)
 *   - Save commits the edit and dismisses the dialog (cat + item)
 *   - Cancel dismisses without mutation (cat + item)
 *   - data-testid="item-rename-confirm" still present (other specs depend on it)
 */

import { test, expect, gotoDemo, expectClean } from '../helpers/trailweigh';
import type { Locator, Page } from '@playwright/test';

// ─── shared gesture helpers (same as r0084.spec.ts) ──────────────────────────

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

async function openSwipeReveal(page: Page, swipeKey: string) {
  const row = page.locator(`[data-swipe-key="${swipeKey}"]`);
  await swipeLeft(page, row);
  await expect(row).toHaveAttribute('data-swipe-open', 'true');
  return row;
}

async function firstCatName(page: Page): Promise<string> {
  const key = await page.locator('[data-swipe-key^="cat:"]').first().getAttribute('data-swipe-key');
  return key!.slice(4);
}

async function openCategory(page: Page, cat: string) {
  const open = page.getByRole('button', { name: `Open ${cat} category` });
  if (await open.isVisible().catch(() => false)) await open.click();
  await expect(page.locator(`[data-swipe-key^="item:${cat}:"]`).first()).toBeVisible({ timeout: 5000 });
}

// ─── open dialogs ─────────────────────────────────────────────────────────────

async function openCatRenameSheet(page: Page) {
  await gotoDemo(page);
  const cat = await firstCatName(page);
  const row = await openSwipeReveal(page, `cat:${cat}`);
  await row.locator('[data-testid="swipe-secondary-action"]').click();
  await page.waitForTimeout(200);
  await expect(page.locator('input[placeholder="Category name…"]')).toBeVisible({ timeout: 4000 });
  return cat;
}

async function openItemRenameDialog(page: Page) {
  await gotoDemo(page);
  const cat = await firstCatName(page);
  await openCategory(page, cat);
  const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
  const swipeKey = await itemRow.getAttribute('data-swipe-key');
  const row = await openSwipeReveal(page, swipeKey!);
  await row.locator('[data-testid="swipe-secondary-action"]').click();
  await page.waitForTimeout(200);
  await expect(page.locator('[data-testid="item-rename-dialog"]')).toBeVisible({ timeout: 4000 });
  return cat;
}

// ═════════════════════════════════════════════════════════════════════════════
// PART 1 — Category rename sheet button labels
// ═════════════════════════════════════════════════════════════════════════════

test.describe('R84P3 — Category rename sheet: Cancel | Save wording', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('R84P3-CAT-01: confirmation button visible text is "Save"', async ({ page, errors }) => {
    await openCatRenameSheet(page);

    const saveBtn = page.getByRole('button', { name: 'Save category name' });
    await expect(saveBtn).toBeVisible();
    const text = (await saveBtn.innerText()).trim();
    expect(text).toBe('Save');

    expectClean(errors);
  });

  test('R84P3-CAT-02: confirmation button aria-label is "Save category name"', async ({ page, errors }) => {
    await openCatRenameSheet(page);

    const saveBtn = page.locator('button[aria-label="Save category name"]');
    await expect(saveBtn).toBeVisible();

    expectClean(errors);
  });

  test('R84P3-CAT-03: cancel button label is still "Cancel"', async ({ page, errors }) => {
    await openCatRenameSheet(page);

    const cancelBtn = page.locator('button[aria-label="Cancel rename"]');
    await expect(cancelBtn).toBeVisible();
    const text = (await cancelBtn.innerText()).trim();
    expect(text).toBe('Cancel');

    expectClean(errors);
  });

  test('R84P3-CAT-04: no button with visible text "Rename" in the sheet', async ({ page, errors }) => {
    await openCatRenameSheet(page);

    // Gather all visible button texts inside the sheet
    const buttons = page.locator('button:visible');
    const texts = await buttons.evaluateAll(els =>
      els.map(el => (el as HTMLElement).innerText.trim())
    );
    expect(texts).not.toContain('Rename');

    expectClean(errors);
  });

  test('R84P3-CAT-05: Save disabled when value unchanged', async ({ page, errors }) => {
    const cat = await openCatRenameSheet(page);
    // Input is pre-filled with current name — Save must be disabled
    const saveBtn = page.locator('button[aria-label="Save category name"]');
    await expect(saveBtn).toBeDisabled();

    expectClean(errors);
  });

  test('R84P3-CAT-06: Save disabled when input is empty', async ({ page, errors }) => {
    await openCatRenameSheet(page);
    await page.locator('input[placeholder="Category name…"]').fill('');
    const saveBtn = page.locator('button[aria-label="Save category name"]');
    await expect(saveBtn).toBeDisabled();

    expectClean(errors);
  });

  test('R84P3-CAT-07: Save commits edit and closes sheet', async ({ page, errors }) => {
    const cat = await openCatRenameSheet(page);
    const input = page.locator('input[placeholder="Category name…"]');
    await input.click({ clickCount: 3 });
    await input.fill('SavedCatName');

    await page.locator('button[aria-label="Save category name"]').click();
    await page.waitForTimeout(300);

    // Sheet closed; new name visible in category bar
    await expect(page.locator('[data-testid="cat-name-SavedCatName"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator(`[data-testid="cat-name-${cat}"]`)).toHaveCount(0);

    expectClean(errors);
  });

  test('R84P3-CAT-08: Cancel closes sheet without mutation', async ({ page, errors }) => {
    const cat = await openCatRenameSheet(page);
    const input = page.locator('input[placeholder="Category name…"]');
    await input.fill('ShouldNotApply');
    await page.locator('button[aria-label="Cancel rename"]').click();
    await page.waitForTimeout(200);

    // Original name still present
    await expect(page.locator(`[data-testid="cat-header-${cat}"]`)).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="cat-name-ShouldNotApply"]')).toHaveCount(0);

    expectClean(errors);
  });

  test('R84P3-CAT-09: Save touch target ≥ 44px', async ({ page, errors }) => {
    await openCatRenameSheet(page);
    const box = await page.locator('button[aria-label="Save category name"]').boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);

    expectClean(errors);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// PART 2 — Item rename dialog button labels
// ═════════════════════════════════════════════════════════════════════════════

test.describe('R84P3 — Item rename dialog: Cancel | Save wording', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('R84P3-ITEM-01: confirmation button visible text is "Save"', async ({ page, errors }) => {
    await openItemRenameDialog(page);

    const saveBtn = page.locator('[data-testid="item-rename-confirm"]');
    await expect(saveBtn).toBeVisible();
    const text = (await saveBtn.innerText()).trim();
    expect(text).toBe('Save');

    expectClean(errors);
  });

  test('R84P3-ITEM-02: confirmation button aria-label is "Save item name"', async ({ page, errors }) => {
    await openItemRenameDialog(page);

    const saveBtn = page.locator('button[aria-label="Save item name"]');
    await expect(saveBtn).toBeVisible();

    expectClean(errors);
  });

  test('R84P3-ITEM-03: cancel button label is still "Cancel"', async ({ page, errors }) => {
    await openItemRenameDialog(page);

    const cancelBtn = page.locator('[data-testid="item-rename-cancel"]');
    await expect(cancelBtn).toBeVisible();
    const text = (await cancelBtn.innerText()).trim();
    expect(text).toBe('Cancel');

    expectClean(errors);
  });

  test('R84P3-ITEM-04: no button with visible text "Rename" in the dialog', async ({ page, errors }) => {
    await openItemRenameDialog(page);

    const dialog = page.locator('[data-testid="item-rename-dialog"]');
    const buttons = dialog.locator('button');
    const texts = await buttons.evaluateAll(els =>
      els.map(el => (el as HTMLElement).innerText.trim())
    );
    expect(texts).not.toContain('Rename');

    expectClean(errors);
  });

  test('R84P3-ITEM-05: Save disabled when value unchanged', async ({ page, errors }) => {
    await openItemRenameDialog(page);
    await expect(page.locator('[data-testid="item-rename-confirm"]')).toBeDisabled();

    expectClean(errors);
  });

  test('R84P3-ITEM-06: Save disabled when input is empty', async ({ page, errors }) => {
    await openItemRenameDialog(page);
    await page.locator('[data-testid="item-rename-input"]').fill('');
    await expect(page.locator('[data-testid="item-rename-confirm"]')).toBeDisabled();

    expectClean(errors);
  });

  test('R84P3-ITEM-07: Save commits edit and closes dialog', async ({ page, errors }) => {
    await openItemRenameDialog(page);
    const input = page.locator('[data-testid="item-rename-input"]');
    await input.fill('SavedItemName');

    await page.locator('[data-testid="item-rename-confirm"]').click();
    await page.waitForTimeout(300);

    await expect(page.locator('[data-testid="item-rename-dialog"]')).toHaveCount(0);
    await expect(page.getByText('SavedItemName').first()).toBeVisible({ timeout: 3000 });

    expectClean(errors);
  });

  test('R84P3-ITEM-08: Cancel closes dialog without mutation', async ({ page, errors }) => {
    await openItemRenameDialog(page);
    const input = page.locator('[data-testid="item-rename-input"]');
    const originalValue = await input.inputValue();
    await input.fill('CancelledName');

    await page.locator('[data-testid="item-rename-cancel"]').click();
    await page.waitForTimeout(200);

    await expect(page.locator('[data-testid="item-rename-dialog"]')).toHaveCount(0);
    await expect(page.getByText('CancelledName')).toHaveCount(0);

    expectClean(errors);
  });

  test('R84P3-ITEM-09: Save touch target ≥ 44px', async ({ page, errors }) => {
    await openItemRenameDialog(page);
    const box = await page.locator('[data-testid="item-rename-confirm"]').boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);

    expectClean(errors);
  });

  test('R84P3-ITEM-10: data-testid="item-rename-confirm" still present (other specs depend on it)', async ({ page, errors }) => {
    await openItemRenameDialog(page);
    await expect(page.locator('[data-testid="item-rename-confirm"]')).toBeVisible();

    expectClean(errors);
  });
});
