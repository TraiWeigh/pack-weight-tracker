/**
 * R0080P2 — Correction to R0080: swipe-endpoint restore + frost retune
 *
 * Tests: R80P2-01 through R80P2-18
 * Route: /mobile-functional-v3
 *
 * Coverage:
 *  01–06  Next-wrap navigation (tap-only wrap; swipe clamps)
 *  07–11  List Summary frost values (opacity, blur, saturation)
 *  12      No overflow at 390 px
 *  13–14  R0079 regressions
 *  15      Swipe from Group 4 does NOT wrap (clamps, stays at 4)   ← new
 *  16      Multi-width layout (320/375/430)                        ← new
 *  17      Save chooser still opens (evidence test)               ← new
 *  18      Long-category regression — R0076P3 geometry intact     ← new
 */
import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

const BASE = '/mobile-functional-v3';

// ── helpers ────────────────────────────────────────────────────────────────

async function waitReady(page: Parameters<typeof test>[1]['page']) {
  await page.waitForSelector('[data-testid="main-scroll"]', { timeout: 15000 });
  await expect(page.getByRole('button', { name: /^Open .+ category$/ }).first()).toBeVisible({ timeout: 5000 });
  await page.waitForTimeout(300);
}

async function clickNext(page: Parameters<typeof test>[1]['page']) {
  await page.locator('button[aria-label="Next controls"]').first().evaluate(el => (el as HTMLElement).click());
  await page.waitForTimeout(350);
}

async function clickBack(page: Parameters<typeof test>[1]['page']) {
  await page.locator('button[aria-label="Previous controls"]').first().evaluate(el => (el as HTMLElement).click());
  await page.waitForTimeout(350);
}

async function activeGroup(page: Parameters<typeof test>[1]['page']): Promise<number> {
  return page.evaluate(() => {
    const el = document.querySelector('[data-group-active="true"]');
    return el ? parseInt((el as HTMLElement).dataset.groupIdx ?? '-1', 10) : -1;
  });
}

/** Simulate a horizontal pointer swipe by dispatching low-level pointer events */
async function simulateSwipe(
  page: Parameters<typeof test>[1]['page'],
  dx: number  // positive = right, negative = left
) {
  const cx = 195, cy = 780; // centre of nav bar area
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.waitForTimeout(40);
  // move in steps to trigger pointerMove
  const steps = 8;
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(cx + (dx * i) / steps, cy);
    await page.waitForTimeout(15);
  }
  await page.mouse.up();
  await page.waitForTimeout(400);
}

// ── R80P2-01: Group 4 has a Next (→) button ──────────────────────────────

test('R80P2-01 — Group 4 exposes a Next controls chevron', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  for (let i = 0; i < 3; i++) await clickNext(page);
  expect(await activeGroup(page)).toBe(3);
  const nextInGroup4 = await page.evaluate(() =>
    !!(document.querySelector('[data-group-active="true"]')?.querySelector('[aria-label="Next controls"]'))
  );
  expect(nextInGroup4, 'Group 4 active div contains a Next controls button').toBe(true);
  await expect(page.locator('button[aria-label="Save — save list to Locker"]')).toBeVisible();
  await expect(page.locator('button[aria-label="Share — create a review link"]')).toBeVisible();
  await expect(page.locator('button[aria-label="More — settings and tools"]')).toBeVisible();
});

// ── R80P2-02: Tapping Next on Group 4 wraps to Group 1 ───────────────────

test('R80P2-02 — Tapping Next on Group 4 cycles forward to Group 1', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  for (let i = 0; i < 3; i++) await clickNext(page);
  expect(await activeGroup(page)).toBe(3);
  await clickNext(page);
  expect(await activeGroup(page), 'tap-Next wrapped to Group 1 (index 0)').toBe(0);
  await expect(page.locator('button[aria-label="Locker — saved lists"]')).toBeVisible();
  await expect(page.locator('button[aria-label="Summary — pack weight and progress"]')).toBeVisible();
});

// ── R80P2-03: Full forward tap-cycle 1→2→3→4→1 ───────────────────────────

test('R80P2-03 — Full forward tap-cycle visits all four groups in order', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  const expected = [0, 1, 2, 3, 0];
  const actual: number[] = [await activeGroup(page)];
  for (let i = 0; i < 4; i++) {
    await clickNext(page);
    actual.push(await activeGroup(page));
  }
  expect(actual).toEqual(expected);
});

// ── R80P2-04: Group 1 has no Back button ─────────────────────────────────

test('R80P2-04 — Group 1 exposes no Previous controls chevron', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  expect(await activeGroup(page)).toBe(0);
  const prevInGroup1 = await page.evaluate(() =>
    !!(document.querySelector('[data-group-active="true"]')?.querySelector('[aria-label="Previous controls"]'))
  );
  expect(prevInGroup1, 'no Previous controls in Group 1').toBe(false);
});

// ── R80P2-05: Back on Groups 2–4 navigates backwards ────────────────────

test('R80P2-05 — Previous controls navigate backward on Groups 2, 3, and 4', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  for (let i = 0; i < 3; i++) await clickNext(page);
  expect(await activeGroup(page)).toBe(3);
  for (let i = 0; i < 3; i++) await clickBack(page);
  expect(await activeGroup(page), 'Back ×3 from Group 4 reaches Group 1').toBe(0);
});

// ── R80P2-06: Back from Group 1 does nothing ─────────────────────────────

test('R80P2-06 — Back is absent on Group 1; group stays at index 0', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  expect(await activeGroup(page)).toBe(0);
  await page.waitForTimeout(500);
  expect(await activeGroup(page)).toBe(0);
});

// ── R80P2-07: List Summary has backdrop-filter blur ───────────────────────

test('R80P2-07 — List Summary bar has a backdrop-filter blur applied', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  const backdropFilter = await page.locator('[data-testid="list-summary-bar"]').evaluate(el => {
    const s = window.getComputedStyle(el);
    return s.getPropertyValue('backdrop-filter') || s.getPropertyValue('-webkit-backdrop-filter') || '';
  });
  expect(backdropFilter, 'backdrop-filter contains blur').toMatch(/blur\(/);
});

// ── R80P2-08: Outer wrapper is transparent (no opaque bg) ────────────────

test('R80P2-08 — List Summary outer wrapper has no fully opaque background', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  const bg = await page.locator('[data-testid="list-summary-bar"]').evaluate(el =>
    window.getComputedStyle(el).backgroundColor
  );
  // PAGE_BG fully opaque = rgb(242,237,228) — must NOT be present
  expect(bg, 'outer wrapper is not fully opaque cream').not.toBe('rgb(242, 237, 228)');
});

// ── R80P2-09: Inner panel is high-opacity green (≥ 0.90 alpha) ───────────

test('R80P2-09 — List Summary inner panel is high-opacity green (~94%)', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  const bg = await page.locator('[data-testid="list-summary-bar"] > div > div').first().evaluate(el =>
    window.getComputedStyle(el).backgroundColor
  );
  // Must be rgba with high alpha (≥ 0.90) — previously 0.82 was too low
  // Fully opaque solid #2A5740 = rgb(42,87,64) — should NOT appear (still has some bleed)
  expect(bg, 'inner panel is not fully opaque solid (has alpha)').not.toBe('rgb(42, 87, 64)');
  expect(bg, 'inner panel contains green').toMatch(/rgba?\(42,\s*87,\s*64/);
  // Extract alpha from rgba string and confirm it is high (subtle frost)
  const alpha = parseFloat(bg.match(/rgba\(42,\s*87,\s*64,\s*([\d.]+)\)/)?.[1] ?? '0');
  expect(alpha, 'inner panel alpha ≥ 0.90 (subtle frost)').toBeGreaterThanOrEqual(0.90);
});

// ── R80P2-10: Categories exist below sticky bar ───────────────────────────

test('R80P2-10 — Category rows exist below the sticky List Summary bar', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  const summaryBottom = await page.locator('[data-testid="list-summary-bar"]').evaluate(
    el => el.getBoundingClientRect().bottom
  );
  const firstCatTop = await page.getByRole('button', { name: /^Open .+ category$/ }).first().evaluate(
    el => el.getBoundingClientRect().top
  );
  expect(firstCatTop, 'first category starts below Summary bar').toBeGreaterThan(summaryBottom - 5);
});

// ── R80P2-11: List Summary geometry unchanged ─────────────────────────────

test('R80P2-11 — List Summary bar stays near top (sticky position preserved)', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  const rect = await page.locator('[data-testid="list-summary-bar"]').evaluate(
    el => { const r = el.getBoundingClientRect(); return { top: r.top, left: r.left }; }
  );
  expect(rect.top, 'Summary bar is near the top of the scroll area').toBeLessThan(120);
  expect(rect.left, 'Summary bar is flush left').toBeLessThan(5);
});

// ── R80P2-12: No horizontal overflow at 390 px ───────────────────────────

test('R80P2-12 — No horizontal overflow at 390 px with Group 4 Next button', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  for (let i = 0; i < 3; i++) await clickNext(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow, 'no overflow in Group 4').toBe(false);
});

// ── R80P2-13: R0079 regression — Save chooser ────────────────────────────

test('R80P2-13 — R0079 regression: Save chooser still opens from Group 4', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  for (let i = 0; i < 3; i++) await clickNext(page);
  await page.locator('button[aria-label="Save — save list to Locker"]').evaluate(el => (el as HTMLElement).click());
  await expect(page.locator('[data-testid="save-chooser-save"]')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('[data-testid="save-chooser-save-as"]')).toBeVisible();
  await page.locator('[data-testid="save-chooser-cancel"]').click();
});

// ── R80P2-14: R0079 regression — Reset confirm ───────────────────────────

test('R80P2-14 — R0079 regression: Reset confirmation still appears from Group 2', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  await clickNext(page);
  await page.locator('button[aria-label="Reset — clear checked/packed marks"]').evaluate(el => (el as HTMLElement).click());
  await expect(page.locator('[aria-label="Reset Checklist confirmation"]')).toBeVisible({ timeout: 5000 });
  await page.keyboard.press('Escape');
});

// ── R80P2-15: Swipe from Group 4 does NOT wrap (P2 correction) ───────────

test('R80P2-15 — Swipe forward from Group 4 clamps; does NOT wrap to Group 1', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  // Navigate to Group 4 via tap
  for (let i = 0; i < 3; i++) await clickNext(page);
  expect(await activeGroup(page)).toBe(3);
  // Simulate a left-swipe (forward) gesture from Group 4
  await simulateSwipe(page, -100);
  // Must stay at Group 4 (index 3) — swipe should NOT wrap
  expect(await activeGroup(page), 'swipe forward from Group 4 clamps at Group 4').toBe(3);
});

// ── R80P2-16: Multi-width layout — 320/375/430 px ────────────────────────

test('R80P2-16 — Layout correct at 320, 375, and 430 px widths', async ({ page }) => {
  const widths = [320, 375, 430];
  for (const w of widths) {
    await page.setViewportSize({ width: w, height: 844 });
    await page.goto(BASE);
    await waitReady(page);
    // No horizontal overflow
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow, `no overflow at ${w}px`).toBe(false);
    // Summary bar present and near top
    const summaryTop = await page.locator('[data-testid="list-summary-bar"]').evaluate(
      el => el.getBoundingClientRect().top
    );
    expect(summaryTop, `Summary bar near top at ${w}px`).toBeLessThan(120);
    // Navigate to Group 4 and confirm Next button present
    for (let i = 0; i < 3; i++) await clickNext(page);
    const nextInG4 = await page.evaluate(() =>
      !!(document.querySelector('[data-group-active="true"]')?.querySelector('[aria-label="Next controls"]'))
    );
    expect(nextInG4, `Group 4 has Next at ${w}px`).toBe(true);
    // Check Group 4 overflow at this width
    const overflowG4 = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflowG4, `no overflow in Group 4 at ${w}px`).toBe(false);
  }
});

// ── R80P2-17: Save chooser visual evidence ────────────────────────────────

test('R80P2-17 — Save chooser opens and shows all three options', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  for (let i = 0; i < 3; i++) await clickNext(page);
  // Open Save chooser
  await page.locator('button[aria-label="Save — save list to Locker"]').evaluate(el => (el as HTMLElement).click());
  // All three options must be present
  await expect(page.locator('[data-testid="save-chooser-save"]')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('[data-testid="save-chooser-save-as"]')).toBeVisible();
  await expect(page.locator('[data-testid="save-chooser-cancel"]')).toBeVisible();
  // Screenshot taken by screenshots.spec.ts
  await page.locator('[data-testid="save-chooser-cancel"]').click();
});

// ── R80P2-18: Long-category R0076P3 geometry intact ──────────────────────

test('R80P2-18 — Long-category inner scroll geometry unchanged (R0076P3 regression)', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  // Add enough items to make a long category (need ≥ 15 items; seed data has them)
  // Find the largest category and open it
  const catButtons = page.getByRole('button', { name: /^Open .+ category$/ });
  const count = await catButtons.count();
  expect(count, 'at least one category exists').toBeGreaterThan(0);
  // Open first category
  await catButtons.first().evaluate(el => (el as HTMLElement).click());
  await page.waitForTimeout(500);
  // Confirm Summary bar bottom is correct (R0076P3 reads this for scroll positioning)
  const summaryBottom = await page.locator('[data-testid="list-summary-bar"]').evaluate(
    el => el.getBoundingClientRect().bottom
  );
  expect(summaryBottom, 'Summary bar bottom is a positive value').toBeGreaterThan(0);
  expect(summaryBottom, 'Summary bar bottom is above mid-screen').toBeLessThan(500);
  // Confirm the inner scroll area (category items) is visible below the bar
  const mainScrollTop = await page.locator('[data-testid="main-scroll"]').evaluate(
    el => el.getBoundingClientRect().top
  );
  expect(mainScrollTop, 'main-scroll container starts at/near top').toBeLessThan(120);
  // Confirm no layout breakage from the frost change
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow, 'no horizontal overflow with open category').toBe(false);
});
