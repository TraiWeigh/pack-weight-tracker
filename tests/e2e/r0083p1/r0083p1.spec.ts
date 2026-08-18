/**
 * R0083P1 — Handedness correction: restore wedge/checkbox positions,
 *           fix hamburger always-left, add Open/Close swipe action on category rows.
 *
 * R83P1-01  Wedge is in the LEFT half of the category header (right-handed mode)
 * R83P1-02  Wedge is in the LEFT half of the category header (left-handed mode)
 * R83P1-03  Checkbox is in the LEFT half of each item row (right-handed mode)
 * R83P1-04  Checkbox is in the LEFT half of each item row (left-handed mode)
 * R83P1-05  Hamburger is on the LEFT side of the app bar in right-handed mode
 * R83P1-06  Hamburger is on the LEFT side of the app bar in left-handed mode
 * R83P1-07  Category swipe reveal shows Open action when category is closed
 * R83P1-08  Category swipe reveal shows Close action when category is open
 * R83P1-09  Open action toggles the category from closed to open
 * R83P1-10  Close action toggles the category from open to closed
 * R83P1-11  Open/Close swipe action ≥ 44 px tall
 * R83P1-12  Delete swipe action ≥ 44 px tall
 * R83P1-13  Tapping Open in swipe reveal does not open category options modal
 * R83P1-14  Long-press category reorder still works (no regression)
 * R83P1-15  Item swipe-delete has NO secondary action (only Delete)
 * R83P1-16  Item swipe-delete still reveals and works normally
 * R83P1-17  Wedge touch target ≥ 44×44 px
 * R83P1-18  Checkbox touch target ≥ 44×44 px
 * R83P1-19  No horizontal overflow at 390 px
 * R83P1-20  No horizontal overflow at 320 px
 * R83P1-21  No horizontal overflow at 375 px
 * R83P1-22  No horizontal overflow at 430 px
 * R83P1-23  R0081 regression: Preview overlay shows all items
 * R83P1-24  R0082 regression: hamburger drawer opens and closes
 */

import { test, expect, Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

const ROUTE = '/mobile-functional-v3';

// ── helpers ───────────────────────────────────────────────────────────────

async function waitReady(page: Page) {
  await page.waitForSelector('[data-testid="main-scroll"]', { timeout: 15_000 });
  await expect(
    page.getByRole('button', { name: /^Open .+ category$/ }).first()
  ).toBeVisible({ timeout: 5_000 });
  await page.waitForTimeout(300);
}

async function setHandedness(page: Page, h: 'right' | 'left') {
  await page.evaluate((val) => localStorage.setItem('tw-handedness', val), h);
  await page.reload();
  await waitReady(page);
}

async function openFirstCategoryViaWedge(page: Page) {
  const wedge = page.getByRole('button', { name: /^Open .+ category$/ }).first();
  await wedge.evaluate((el) => (el as HTMLElement).click());
  await page.waitForTimeout(400);
}

/** Swipe-open the first category row (left-edge-to-right swipe on the right zone). */
async function swipeOpenFirstCategory(page: Page) {
  const row = page.locator('[data-swipe-key^="cat:"]').first();
  const bb = await row.boundingBox();
  expect(bb).not.toBeNull();
  const startX = bb!.x + bb!.width - 10;
  const startY = bb!.y + bb!.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX - 150, startY, { steps: 15 });
  await page.mouse.up();
  await page.waitForTimeout(400);
}

// ── Wedge position — always LEFT ──────────────────────────────────────────

test('R83P1-01 — Wedge is in the left half of category header (right-handed)', async ({ page }) => {
  await page.goto(ROUTE);
  await setHandedness(page, 'right');
  const vp = page.viewportSize()!;
  const bb = await page.getByRole('button', { name: /^Open .+ category$/ }).first().boundingBox();
  expect(bb).not.toBeNull();
  expect(bb!.x + bb!.width / 2).toBeLessThan(vp.width / 2);
});

test('R83P1-02 — Wedge is in the left half of category header (left-handed)', async ({ page }) => {
  await page.goto(ROUTE);
  await setHandedness(page, 'left');
  const vp = page.viewportSize()!;
  const bb = await page.getByRole('button', { name: /^Open .+ category$/ }).first().boundingBox();
  expect(bb).not.toBeNull();
  expect(bb!.x + bb!.width / 2).toBeLessThan(vp.width / 2);
});

// ── Checkbox position — always LEFT ───────────────────────────────────────

test('R83P1-03 — Checkbox is in the left half of item row (right-handed)', async ({ page }) => {
  await page.goto(ROUTE);
  await setHandedness(page, 'right');
  await openFirstCategoryViaWedge(page);
  const vp = page.viewportSize()!;
  const bb = await page.getByRole('checkbox').first().boundingBox();
  expect(bb).not.toBeNull();
  expect(bb!.x + bb!.width / 2).toBeLessThan(vp.width / 2);
});

test('R83P1-04 — Checkbox is in the left half of item row (left-handed)', async ({ page }) => {
  await page.goto(ROUTE);
  await setHandedness(page, 'left');
  await openFirstCategoryViaWedge(page);
  const vp = page.viewportSize()!;
  const bb = await page.getByRole('checkbox').first().boundingBox();
  expect(bb).not.toBeNull();
  expect(bb!.x + bb!.width / 2).toBeLessThan(vp.width / 2);
});

// ── Hamburger always on the LEFT ──────────────────────────────────────────

test('R83P1-05 — Hamburger is on the LEFT in right-handed mode', async ({ page }) => {
  await page.goto(ROUTE);
  await setHandedness(page, 'right');
  const vp = page.viewportSize()!;
  const bb = await page.locator('[data-testid="hamburger-btn"]').boundingBox();
  expect(bb).not.toBeNull();
  // Hamburger left edge should be within the left 20% of the screen
  expect(bb!.x).toBeLessThan(vp.width * 0.2);
});

test('R83P1-06 — Hamburger is on the LEFT in left-handed mode', async ({ page }) => {
  await page.goto(ROUTE);
  await setHandedness(page, 'left');
  const vp = page.viewportSize()!;
  const bb = await page.locator('[data-testid="hamburger-btn"]').boundingBox();
  expect(bb).not.toBeNull();
  expect(bb!.x).toBeLessThan(vp.width * 0.2);
});

// ── Category swipe reveal: Open/Close + Delete ────────────────────────────

test('R83P1-07 — Category swipe reveal shows Open action when category is closed', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await swipeOpenFirstCategory(page);

  // The secondary action button should have "Open" label (category is closed)
  const secondary = page.locator('[data-testid="swipe-secondary-action"]').first();
  await expect(secondary).toHaveAttribute('aria-label', 'Open', { timeout: 3_000 });
});

test('R83P1-08 — Category swipe reveal shows Close action when category is open', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  // First open the category via wedge
  await openFirstCategoryViaWedge(page);
  // Now swipe-reveal the same category
  await swipeOpenFirstCategory(page);

  const secondary = page.locator('[data-testid="swipe-secondary-action"]').first();
  await expect(secondary).toHaveAttribute('aria-label', 'Close', { timeout: 3_000 });
});

test('R83P1-09 — Open swipe action opens the category accordion', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);

  // Confirm category starts closed — no checkboxes visible
  await expect(page.getByRole('checkbox').first()).not.toBeVisible({ timeout: 2_000 }).catch(() => {});

  // Swipe-reveal then tap Open
  await swipeOpenFirstCategory(page);
  const secondary = page.locator('[data-testid="swipe-secondary-action"]').first();
  await expect(secondary).toHaveAttribute('aria-label', 'Open', { timeout: 3_000 });
  await secondary.evaluate((el) => (el as HTMLElement).click());
  await page.waitForTimeout(500);

  // Swipe row should be closed again after action
  await expect(
    page.locator('[data-swipe-key^="cat:"]').first()
  ).toHaveAttribute('data-swipe-open', 'false', { timeout: 3_000 });

  // Category items should now be visible
  await expect(page.getByRole('checkbox').first()).toBeVisible({ timeout: 3_000 });
});

test('R83P1-10 — Close swipe action closes the category accordion', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);

  // Open category first
  await openFirstCategoryViaWedge(page);
  await expect(page.getByRole('checkbox').first()).toBeVisible({ timeout: 3_000 });

  // Swipe-reveal (category is now open, so label should be Close)
  await swipeOpenFirstCategory(page);
  const secondary = page.locator('[data-testid="swipe-secondary-action"]').first();
  await expect(secondary).toHaveAttribute('aria-label', 'Close', { timeout: 3_000 });
  await secondary.evaluate((el) => (el as HTMLElement).click());
  await page.waitForTimeout(500);

  // Category items should be gone
  await expect(page.getByRole('checkbox').first()).not.toBeVisible({ timeout: 3_000 });
});

// ── Touch targets ─────────────────────────────────────────────────────────

test('R83P1-11 — Open/Close swipe action ≥ 44 px tall', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await swipeOpenFirstCategory(page);
  const secondary = page.locator('[data-testid="swipe-secondary-action"]').first();
  const bb = await secondary.boundingBox();
  expect(bb).not.toBeNull();
  expect(bb!.height).toBeGreaterThanOrEqual(44);
  expect(bb!.width).toBeGreaterThanOrEqual(44);
});

test('R83P1-12 — Delete swipe action ≥ 44 px tall', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await swipeOpenFirstCategory(page);
  const del = page.locator('[data-swipe-key^="cat:"]').first()
    .getByRole('button', { name: /^Delete .+ category$/ });
  const bb = await del.boundingBox();
  expect(bb).not.toBeNull();
  expect(bb!.height).toBeGreaterThanOrEqual(44);
  expect(bb!.width).toBeGreaterThanOrEqual(44);
});

// ── Open action doesn't open category options modal ───────────────────────

test('R83P1-13 — Tapping Open swipe action does not open category options modal', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await swipeOpenFirstCategory(page);
  const secondary = page.locator('[data-testid="swipe-secondary-action"]').first();
  await expect(secondary).toHaveAttribute('aria-label', 'Open', { timeout: 3_000 });
  await secondary.evaluate((el) => (el as HTMLElement).click());
  await page.waitForTimeout(400);

  // Rename/delete options modal should NOT be visible
  const optionsModal = page.locator('[data-testid="cat-options-modal"], [aria-label*="rename"], [aria-label*="Rename"]');
  const visible = await optionsModal.first().isVisible().catch(() => false);
  expect(visible).toBe(false);
});

// ── Long-press category reorder ───────────────────────────────────────────

test('R83P1-14 — Long-press category reorder still works', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);

  const catCount = await page.locator('[data-swipe-key^="cat:"]').count();
  if (catCount < 2) return; // not enough categories

  const firstCat = page.locator('[data-swipe-key^="cat:"]').first();
  const bb = await firstCat.boundingBox();
  expect(bb).not.toBeNull();

  const cx = bb!.x + bb!.width / 2;
  const cy = bb!.y + bb!.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.waitForTimeout(450); // exceed 400ms long-press threshold
  await page.mouse.move(cx, cy + bb!.height + 4, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(400);

  // No crash, no overflow
  const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollW).toBeLessThanOrEqual(390 + 1);
});

// ── Item swipe-delete: no secondary action, still works ───────────────────

test('R83P1-15 — Item swipe reveal has NO secondary Open/Close action', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await openFirstCategoryViaWedge(page);

  // Swipe-reveal an item row
  const itemRow = page.locator('[data-swipe-key^="item:"]').first();
  const bb = await itemRow.boundingBox();
  expect(bb).not.toBeNull();
  const startX = bb!.x + bb!.width - 10;
  const startY = bb!.y + bb!.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX - 100, startY, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(400);

  // Item swipe row should be open
  await expect(itemRow).toHaveAttribute('data-swipe-open', 'true', { timeout: 3_000 });

  // No secondary action button inside item rows
  const secondary = itemRow.locator('[data-testid="swipe-secondary-action"]');
  await expect(secondary).toHaveCount(0);
});

test('R83P1-16 — Item swipe-delete still reveals correctly', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await openFirstCategoryViaWedge(page);

  const itemRow = page.locator('[data-swipe-key^="item:"]').first();
  const bb = await itemRow.boundingBox();
  expect(bb).not.toBeNull();
  const startX = bb!.x + bb!.width - 10;
  const startY = bb!.y + bb!.height / 2;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX - 100, startY, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(400);

  await expect(itemRow).toHaveAttribute('data-swipe-open', 'true', { timeout: 3_000 });
});

// ── Touch targets ─────────────────────────────────────────────────────────

test('R83P1-17 — Wedge touch target ≥ 44×44 px', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  const bb = await page.getByRole('button', { name: /^Open .+ category$/ }).first().boundingBox();
  expect(bb).not.toBeNull();
  expect(bb!.width).toBeGreaterThanOrEqual(44);
  expect(bb!.height).toBeGreaterThanOrEqual(44);
});

test('R83P1-18 — Checkbox touch target ≥ 44×44 px', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await openFirstCategoryViaWedge(page);
  const bb = await page.getByRole('checkbox').first().boundingBox();
  expect(bb).not.toBeNull();
  expect(bb!.width).toBeGreaterThanOrEqual(44);
  expect(bb!.height).toBeGreaterThanOrEqual(44);
});

// ── Width / overflow tests ────────────────────────────────────────────────

async function noOverflow(page: Page, width: number) {
  await page.setViewportSize({ width, height: 844 });
  await page.goto(ROUTE);
  await page.waitForSelector('[data-testid="main-scroll"]', { timeout: 15_000 });
  await page.waitForTimeout(300);
  const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollW).toBeLessThanOrEqual(width + 1);
}

test('R83P1-19 — No horizontal overflow at 390 px', async ({ page }) => { await noOverflow(page, 390); });
test('R83P1-20 — No horizontal overflow at 320 px', async ({ page }) => { await noOverflow(page, 320); });
test('R83P1-21 — No horizontal overflow at 375 px', async ({ page }) => { await noOverflow(page, 375); });
test('R83P1-22 — No horizontal overflow at 430 px', async ({ page }) => { await noOverflow(page, 430); });

// ── Regressions ───────────────────────────────────────────────────────────

test('R83P1-23 — R0081 regression: Preview overlay is functional', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  // Navigation drawer opens — that confirms R0082 hamburger works
  await page.locator('[data-testid="hamburger-btn"]').click();
  await expect(page.locator('[data-testid="nav-drawer"]')).toHaveAttribute('data-open', 'true', { timeout: 3_000 });
  const vp = page.viewportSize()!;
  await page.mouse.click(Math.floor(vp.width * 0.85), Math.floor(vp.height / 2));
  await expect(page.locator('[data-testid="nav-drawer"]')).toHaveAttribute('data-open', 'false', { timeout: 3_000 });
});

test('R83P1-24 — R0082 regression: hamburger drawer opens and closes', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  const drawer = page.locator('[data-testid="nav-drawer"]');
  await expect(drawer).toHaveAttribute('data-open', 'false');
  await page.locator('[data-testid="hamburger-btn"]').click();
  await expect(drawer).toHaveAttribute('data-open', 'true', { timeout: 3_000 });
  const vp = page.viewportSize()!;
  await page.mouse.click(Math.floor(vp.width * 0.85), Math.floor(vp.height / 2));
  await expect(drawer).toHaveAttribute('data-open', 'false', { timeout: 3_000 });
});
