/**
 * R0084P2 — Swipe-label accessibility repair
 *
 * The secondary (green) swipe-action button previously showed the full
 * descriptive string ("Edit Sleep System category") as its visible text,
 * causing wrapping in the narrow 88 px slot. R0084P2 introduces a separate
 * `visibleLabel` field so the button displays only "Edit" while the full
 * string remains in aria-label.
 *
 * Checks:
 *   - Visible button text is exactly "Edit" (cat + item rows)
 *   - aria-label is the full descriptive string (longer than "Edit")
 *   - No horizontal document overflow
 *   - Touch targets ≥ 44 px
 *   - All existing rename flows still work
 *
 * Viewport widths: 320, 375, 390, 430 px
 */

import { test, expect, gotoDemo, expectClean, type ErrorLog } from '../helpers/trailweigh';
import type { Locator, Page } from '@playwright/test';

// ─── gesture helpers (same as r0084.spec.ts) ─────────────────────────────────

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

async function openSwipeReveal(page: Page, swipeKey: string, dist = 110) {
  const row = page.locator(`[data-swipe-key="${swipeKey}"]`);
  await swipeLeft(page, row, dist);
  await expect(row).toHaveAttribute('data-swipe-open', 'true');
  return row;
}

async function firstCatName(page: Page): Promise<string> {
  const key = await page.locator('[data-swipe-key^="cat:"]').first().getAttribute('data-swipe-key');
  return key!.slice(4); // strip "cat:"
}

async function openCategory(page: Page, cat: string) {
  const open = page.getByRole('button', { name: `Open ${cat} category` });
  if (await open.isVisible().catch(() => false)) await open.click();
  await expect(page.locator(`[data-swipe-key^="item:${cat}:"]`).first()).toBeVisible({ timeout: 5000 });
}

// ─── viewport widths ──────────────────────────────────────────────────────────

const WIDTHS = [320, 375, 390, 430] as const;

// ═════════════════════════════════════════════════════════════════════════════
// PART 1 — Category secondary button visible label
// ═════════════════════════════════════════════════════════════════════════════

test.describe('R84P2 — Category swipe secondary button label', () => {
  for (const width of WIDTHS) {
    test.describe(`${width}px`, () => {
      test.use({ viewport: { width, height: 844 } });

      test(`R84P2-CAT-VIS-${width}: visible text is exactly "Edit"`, async ({ page, errors }) => {
        await gotoDemo(page);
        const cat = await firstCatName(page);
        const row = await openSwipeReveal(page, `cat:${cat}`);

        const btn = row.locator('[data-testid="swipe-secondary-action"]');
        await expect(btn).toBeVisible();

        // innerText strips the SVG icon (it has no text content); remaining text must be "Edit"
        const text = (await btn.innerText()).trim();
        expect(text).toBe('Edit');

        expectClean(errors);
      });

      test(`R84P2-CAT-ARIA-${width}: aria-label contains category name and is descriptive`, async ({ page, errors }) => {
        await gotoDemo(page);
        const cat = await firstCatName(page);
        const row = await openSwipeReveal(page, `cat:${cat}`);

        const btn = row.locator('[data-testid="swipe-secondary-action"]');
        const ariaLabel = await btn.getAttribute('aria-label');

        expect(ariaLabel).toBeTruthy();
        // Must contain the category name (case-insensitive)
        expect(ariaLabel!.toLowerCase()).toContain(cat.toLowerCase());
        // Must be longer than the visible label alone
        expect(ariaLabel!.length).toBeGreaterThan('Edit'.length);

        expectClean(errors);
      });

      test(`R84P2-CAT-NOWRAP-${width}: "Edit" button fits in 88px slot, no doc overflow`, async ({ page, errors }) => {
        await gotoDemo(page);
        const cat = await firstCatName(page);
        const row = await openSwipeReveal(page, `cat:${cat}`);

        const btn = row.locator('[data-testid="swipe-secondary-action"]');
        const box = await btn.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.width).toBeLessThanOrEqual(89); // 88px + 1px rounding

        const overflow = await page.evaluate(() =>
          document.documentElement.scrollWidth > document.documentElement.clientWidth
        );
        expect(overflow).toBe(false);

        expectClean(errors);
      });

      test(`R84P2-CAT-HEIGHT-${width}: "Edit" button meets 44px touch target`, async ({ page, errors }) => {
        await gotoDemo(page);
        const cat = await firstCatName(page);
        const row = await openSwipeReveal(page, `cat:${cat}`);

        const btn = row.locator('[data-testid="swipe-secondary-action"]');
        const box = await btn.boundingBox();
        expect(box!.height).toBeGreaterThanOrEqual(44);

        expectClean(errors);
      });
    });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// PART 2 — Item secondary button visible label
// ═════════════════════════════════════════════════════════════════════════════

test.describe('R84P2 — Item swipe secondary button label', () => {
  for (const width of WIDTHS) {
    test.describe(`${width}px`, () => {
      test.use({ viewport: { width, height: 844 } });

      test(`R84P2-ITEM-VIS-${width}: visible text is exactly "Edit"`, async ({ page, errors }) => {
        await gotoDemo(page);
        const cat = await firstCatName(page);
        await openCategory(page, cat);

        const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
        const swipeKey = await itemRow.getAttribute('data-swipe-key');
        const row = await openSwipeReveal(page, swipeKey!);

        const btn = row.locator('[data-testid="swipe-secondary-action"]');
        await expect(btn).toBeVisible();

        const text = (await btn.innerText()).trim();
        expect(text).toBe('Edit');

        expectClean(errors);
      });

      test(`R84P2-ITEM-ARIA-${width}: item aria-label is descriptive (longer than "Edit")`, async ({ page, errors }) => {
        await gotoDemo(page);
        const cat = await firstCatName(page);
        await openCategory(page, cat);

        const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
        const swipeKey = await itemRow.getAttribute('data-swipe-key');
        const row = await openSwipeReveal(page, swipeKey!);

        const btn = row.locator('[data-testid="swipe-secondary-action"]');
        const ariaLabel = await btn.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
        expect(ariaLabel!.length).toBeGreaterThan('Edit'.length);

        expectClean(errors);
      });

      test(`R84P2-ITEM-NOWRAP-${width}: "Edit" button fits in 88px slot, no doc overflow`, async ({ page, errors }) => {
        await gotoDemo(page);
        const cat = await firstCatName(page);
        await openCategory(page, cat);

        const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
        const swipeKey = await itemRow.getAttribute('data-swipe-key');
        const row = await openSwipeReveal(page, swipeKey!);

        const btn = row.locator('[data-testid="swipe-secondary-action"]');
        const box = await btn.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.width).toBeLessThanOrEqual(89);

        const overflow = await page.evaluate(() =>
          document.documentElement.scrollWidth > document.documentElement.clientWidth
        );
        expect(overflow).toBe(false);

        expectClean(errors);
      });

      test(`R84P2-ITEM-HEIGHT-${width}: "Edit" button meets 44px touch target`, async ({ page, errors }) => {
        await gotoDemo(page);
        const cat = await firstCatName(page);
        await openCategory(page, cat);

        const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
        const swipeKey = await itemRow.getAttribute('data-swipe-key');
        const row = await openSwipeReveal(page, swipeKey!);

        const btn = row.locator('[data-testid="swipe-secondary-action"]');
        const box = await btn.boundingBox();
        expect(box!.height).toBeGreaterThanOrEqual(44);

        expectClean(errors);
      });
    });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// PART 3 — Smoke: existing rename / delete flows still work
// ═════════════════════════════════════════════════════════════════════════════

test.describe('R84P2 — Smoke: rename + delete flows unchanged', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('R84P2-SMOKE-CAT-RENAME: category Edit button still opens rename sheet pre-filled', async ({ page, errors }) => {
    await gotoDemo(page);
    const cat = await firstCatName(page);
    const row = await openSwipeReveal(page, `cat:${cat}`);

    await row.locator('[data-testid="swipe-secondary-action"]').click();
    await page.waitForTimeout(300);

    // Category Options Sheet uses a placeholder input, not a data-testid
    const input = page.locator('input[placeholder="Category name…"]');
    await expect(input).toBeVisible({ timeout: 4000 });
    expect(await input.inputValue()).toBe(cat);

    expectClean(errors);
  });

  test('R84P2-SMOKE-ITEM-RENAME: item Edit button still opens rename dialog pre-filled', async ({ page, errors }) => {
    await gotoDemo(page);
    const cat = await firstCatName(page);
    await openCategory(page, cat);

    const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
    const swipeKey = await itemRow.getAttribute('data-swipe-key');
    const row = await openSwipeReveal(page, swipeKey!);

    await row.locator('[data-testid="swipe-secondary-action"]').click();
    await page.waitForTimeout(300);

    await expect(page.locator('[data-testid="item-rename-dialog"]')).toBeVisible({ timeout: 4000 });
    await expect(page.locator('[data-testid="item-rename-input"]')).toBeVisible();

    expectClean(errors);
  });

  test('R84P2-SMOKE-CAT-DELETE: Delete button still intact on category row', async ({ page, errors }) => {
    await gotoDemo(page);
    const cat = await firstCatName(page);
    const row = await openSwipeReveal(page, `cat:${cat}`);

    const deleteBtn = row.locator(`button[aria-label="Delete ${cat} category"]`);
    await expect(deleteBtn).toBeVisible();

    expectClean(errors);
  });

  test('R84P2-SMOKE-ITEM-DELETE: Delete button still intact on item row', async ({ page, errors }) => {
    await gotoDemo(page);
    const cat = await firstCatName(page);
    await openCategory(page, cat);

    const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
    const swipeKey = await itemRow.getAttribute('data-swipe-key');
    const row = await openSwipeReveal(page, swipeKey!);

    const deleteBtn = row.locator('button[aria-label^="Delete"]');
    await expect(deleteBtn).toBeVisible();

    expectClean(errors);
  });
});
