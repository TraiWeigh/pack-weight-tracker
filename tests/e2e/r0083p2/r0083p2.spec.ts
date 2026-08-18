/**
 * R0083P2 — Tap-anywhere category toggle on /mobile-functional-v3
 *
 * R83P2-01  Tapping the wedge button opens the category
 * R83P2-02  Tapping the category name area opens the category
 * R83P2-03  Tapping the weight display area opens the category
 * R83P2-04  Tapping the wedge again closes the category
 * R83P2-05  Long-press reorder does NOT accidentally toggle the category
 * R83P2-06  Horizontal swipe does NOT accidentally toggle the category
 * R83P2-07  Hamburger is on the LEFT in right-handed mode
 * R83P2-08  Hamburger is on the LEFT in left-handed mode
 * R83P2-09  Drawer slides from the LEFT in right-handed mode
 * R83P2-10  Drawer slides from the LEFT in left-handed mode
 * R83P2-11  Category swipe Open/Close action still works after P2 changes
 * R83P2-12  Category swipe Delete button still present after P2 changes
 * R83P2-13  Item row expand/collapse tap behavior unchanged
 * R83P2-14  Item swipe-delete still reveals correctly
 * R83P2-15  No horizontal overflow at 390 px
 * R83P2-16  No horizontal overflow at 320 px
 * R83P2-17  No horizontal overflow at 375 px
 * R83P2-18  No horizontal overflow at 430 px
 * R83P2-19  R0083P1 regression: wedge and checkbox in left positions
 * R83P2-20  R0082 regression: hamburger drawer opens and closes
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

/** Returns true if at least one checkbox (item row) is visible. */
async function itemsVisible(page: Page): Promise<boolean> {
  return page.getByRole('checkbox').first().isVisible().catch(() => false);
}

/** Swipe-open the first category's swipe reveal. */
async function swipeOpenFirstCat(page: Page) {
  const row = page.locator('[data-swipe-key^="cat:"]').first();
  const bb = await row.boundingBox();
  expect(bb).not.toBeNull();
  const sx = bb!.x + bb!.width - 10;
  const sy = bb!.y + bb!.height / 2;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(sx - 160, sy, { steps: 16 });
  await page.mouse.up();
  await page.waitForTimeout(400);
}

/** Click a point clearly inside the category bar but outside the swipe zone.
 *  SwipeDeleteRow ignores pointer events that start in the left 60% of a closed row.
 *  We click at x = wedge-right + 20 px, centered vertically. */
async function tapCatBarBody(page: Page) {
  const bar = page.locator('[data-testid^="cat-header-"]').first();
  const bb  = await bar.boundingBox();
  expect(bb).not.toBeNull();
  // WEDGE_W = 72px; click 40px into the content area — well left of the right-40% zone
  const cx = bb!.x + 72 + 40;
  const cy = bb!.y + bb!.height / 2;
  await page.mouse.click(cx, cy);
}

// ── Tap-anywhere toggle ───────────────────────────────────────────────────

test('R83P2-01 — Tapping the wedge button opens the category', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  expect(await itemsVisible(page)).toBe(false);

  const wedge = page.getByRole('button', { name: /^Open .+ category$/ }).first();
  await wedge.evaluate((el) => (el as HTMLElement).click());
  await page.waitForTimeout(400);

  expect(await itemsVisible(page)).toBe(true);
});

test('R83P2-02 — Tapping the category name area opens the category', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  expect(await itemsVisible(page)).toBe(false);

  // Click the cat-name div via Playwright's built-in click (fires real pointer+click events).
  // The div bubbles up to the outer category div's onClick → handleCatToggle.
  const nameDiv = page.locator('[data-testid^="cat-name-"]').first();
  await expect(nameDiv).toBeVisible({ timeout: 3_000 });
  await nameDiv.click();
  await page.waitForTimeout(400);

  expect(await itemsVisible(page)).toBe(true);
});

test('R83P2-03 — Tapping the bar body (content area) opens the category', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  expect(await itemsVisible(page)).toBe(false);

  // Tap at 72+40=112px from left — inside the content area, left of the right-40% swipe zone.
  await tapCatBarBody(page);
  await page.waitForTimeout(400);

  expect(await itemsVisible(page)).toBe(true);
});

test('R83P2-04 — Tapping the wedge again closes an open category', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);

  // Open via wedge
  const openWedge = page.getByRole('button', { name: /^Open .+ category$/ }).first();
  await openWedge.evaluate((el) => (el as HTMLElement).click());
  await page.waitForTimeout(400);
  expect(await itemsVisible(page)).toBe(true);

  // Close via wedge
  const closeWedge = page.getByRole('button', { name: /^Close .+ category$/ }).first();
  await closeWedge.evaluate((el) => (el as HTMLElement).click());
  await page.waitForTimeout(400);
  expect(await itemsVisible(page)).toBe(false);
});

// ── Gesture disambiguation ────────────────────────────────────────────────

test('R83P2-05 — Long-press reorder does NOT accidentally toggle the category', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);

  const catCount = await page.locator('[data-swipe-key^="cat:"]').count();
  if (catCount < 2) return; // not enough categories to reorder

  // Record open state before
  const openBefore = await itemsVisible(page);

  // Simulate long-press (450 ms) + small drag to commit a reorder
  const bar = page.locator('[data-testid^="cat-header-"]').first();
  const bb  = await bar.boundingBox();
  expect(bb).not.toBeNull();
  const cx = bb!.x + bb!.width / 2;
  const cy = bb!.y + bb!.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.waitForTimeout(450); // exceed 400ms threshold
  await page.mouse.move(cx, cy + bb!.height + 4, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(500);

  // Category open state must be unchanged — reorder must not toggle
  const openAfter = await itemsVisible(page);
  expect(openAfter).toBe(openBefore);
});

test('R83P2-06 — Horizontal swipe does NOT accidentally toggle the category', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);

  const openBefore = await itemsVisible(page);

  // Swipe the category row horizontally to reveal actions
  await swipeOpenFirstCat(page);

  // Swipe reveal should be open
  const swipeRow = page.locator('[data-swipe-key^="cat:"]').first();
  await expect(swipeRow).toHaveAttribute('data-swipe-open', 'true', { timeout: 3_000 });

  // Category accordion must be unchanged
  const openAfter = await itemsVisible(page);
  expect(openAfter).toBe(openBefore);
});

// ── Hamburger always left ─────────────────────────────────────────────────

test('R83P2-07 — Hamburger is on the LEFT in right-handed mode', async ({ page }) => {
  await page.goto(ROUTE);
  await setHandedness(page, 'right');
  const vp = page.viewportSize()!;
  const bb = await page.locator('[data-testid="hamburger-btn"]').boundingBox();
  expect(bb).not.toBeNull();
  expect(bb!.x).toBeLessThan(vp.width * 0.2);
});

test('R83P2-08 — Hamburger is on the LEFT in left-handed mode', async ({ page }) => {
  await page.goto(ROUTE);
  await setHandedness(page, 'left');
  const vp = page.viewportSize()!;
  const bb = await page.locator('[data-testid="hamburger-btn"]').boundingBox();
  expect(bb).not.toBeNull();
  expect(bb!.x).toBeLessThan(vp.width * 0.2);
});

// ── Drawer slides from left ───────────────────────────────────────────────

async function drawerIsOnLeft(page: Page) {
  await page.locator('[data-testid="hamburger-btn"]').click();
  await expect(page.locator('[data-testid="nav-drawer"]')).toHaveAttribute('data-open', 'true', { timeout: 3_000 });
  await page.waitForTimeout(300);
  // Panel left edge must be at/near x=0 (left side of viewport)
  const bb = await page.locator('[data-testid="nav-drawer"]').boundingBox();
  expect(bb).not.toBeNull();
  const vp = page.viewportSize()!;
  expect(bb!.x).toBeLessThan(vp.width * 0.1);
}

test('R83P2-09 — Drawer slides from the LEFT in right-handed mode', async ({ page }) => {
  await page.goto(ROUTE);
  await setHandedness(page, 'right');
  await drawerIsOnLeft(page);
});

test('R83P2-10 — Drawer slides from the LEFT in left-handed mode', async ({ page }) => {
  await page.goto(ROUTE);
  await setHandedness(page, 'left');
  await drawerIsOnLeft(page);
});

// ── Category swipe actions still work ────────────────────────────────────

test('R83P2-11 — Category swipe Open/Close action still works after P2', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);

  // Category closed — swipe reveal shows Open
  await swipeOpenFirstCat(page);
  const secondary = page.locator('[data-testid="swipe-secondary-action"]').first();
  await expect(secondary).toHaveAttribute('aria-label', 'Open', { timeout: 3_000 });

  // Tap Open — should open the category and close the swipe reveal
  await secondary.evaluate((el) => (el as HTMLElement).click());
  await page.waitForTimeout(500);

  await expect(
    page.locator('[data-swipe-key^="cat:"]').first()
  ).toHaveAttribute('data-swipe-open', 'false', { timeout: 3_000 });
  expect(await itemsVisible(page)).toBe(true);
});

test('R83P2-12 — Category swipe Delete button still present after P2', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await swipeOpenFirstCat(page);

  const delBtn = page.locator('[data-swipe-key^="cat:"]').first()
    .getByRole('button', { name: /^Delete .+ category$/ });
  await expect(delBtn).toBeVisible({ timeout: 3_000 });
  const bb = await delBtn.boundingBox();
  expect(bb).not.toBeNull();
  expect(bb!.height).toBeGreaterThanOrEqual(44);
});

// ── Item row behavior unchanged ───────────────────────────────────────────

test('R83P2-13 — Item row expand/collapse tap behavior unchanged', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);

  // Open first category via wedge
  const wedge = page.getByRole('button', { name: /^Open .+ category$/ }).first();
  await wedge.evaluate((el) => (el as HTMLElement).click());
  await page.waitForTimeout(400);
  expect(await itemsVisible(page)).toBe(true);

  // Expand first item
  const expandBtn = page.locator('[role="button"][aria-label*="expand details"]').first();
  await expect(expandBtn).toBeVisible({ timeout: 3_000 });
  await expandBtn.evaluate((el) => (el as HTMLElement).click());
  await page.waitForTimeout(300);

  // Weight/qty inputs should appear
  await expect(page.locator('[data-testid="expanded-weight-input"]').first()).toBeVisible({ timeout: 3_000 });

  // Collapse
  const collapseBtn = page.locator('[role="button"][aria-label*="collapse details"]').first();
  await collapseBtn.evaluate((el) => (el as HTMLElement).click());
  await page.waitForTimeout(300);
  await expect(page.locator('[data-testid="expanded-weight-input"]').first()).not.toBeVisible({ timeout: 3_000 });
});

test('R83P2-14 — Item swipe-delete still reveals correctly', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);

  // Open first category
  const wedge = page.getByRole('button', { name: /^Open .+ category$/ }).first();
  await wedge.evaluate((el) => (el as HTMLElement).click());
  await page.waitForTimeout(400);

  const itemRow = page.locator('[data-swipe-key^="item:"]').first();
  const bb = await itemRow.boundingBox();
  expect(bb).not.toBeNull();
  const sx = bb!.x + bb!.width - 10;
  const sy = bb!.y + bb!.height / 2;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(sx - 100, sy, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(400);

  await expect(itemRow).toHaveAttribute('data-swipe-open', 'true', { timeout: 3_000 });

  // Item rows must NOT have a secondary action button
  await expect(itemRow.locator('[data-testid="swipe-secondary-action"]')).toHaveCount(0);
});

// ── Overflow tests ────────────────────────────────────────────────────────

async function noOverflow(page: Page, width: number) {
  await page.setViewportSize({ width, height: 844 });
  await page.goto(ROUTE);
  await page.waitForSelector('[data-testid="main-scroll"]', { timeout: 15_000 });
  await page.waitForTimeout(300);
  const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollW).toBeLessThanOrEqual(width + 1);
}

test('R83P2-15 — No overflow at 390 px', async ({ page }) => { await noOverflow(page, 390); });
test('R83P2-16 — No overflow at 320 px', async ({ page }) => { await noOverflow(page, 320); });
test('R83P2-17 — No overflow at 375 px', async ({ page }) => { await noOverflow(page, 375); });
test('R83P2-18 — No overflow at 430 px', async ({ page }) => { await noOverflow(page, 430); });

// ── Regressions ───────────────────────────────────────────────────────────

test('R83P2-19 — R0083P1 regression: wedge and checkbox in left positions', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  const vp = page.viewportSize()!;

  // Wedge left
  const wedgeBB = await page.getByRole('button', { name: /^Open .+ category$/ }).first().boundingBox();
  expect(wedgeBB).not.toBeNull();
  expect(wedgeBB!.x + wedgeBB!.width / 2).toBeLessThan(vp.width / 2);

  // Open category, confirm checkbox left
  await page.getByRole('button', { name: /^Open .+ category$/ }).first()
    .evaluate(el => (el as HTMLElement).click());
  await page.waitForTimeout(400);
  const cbBB = await page.getByRole('checkbox').first().boundingBox();
  expect(cbBB).not.toBeNull();
  expect(cbBB!.x + cbBB!.width / 2).toBeLessThan(vp.width / 2);
});

test('R83P2-20 — R0082 regression: hamburger drawer opens and closes', async ({ page }) => {
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
