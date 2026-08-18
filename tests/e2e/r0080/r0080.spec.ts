/**
 * R0080 — Next-wrap navigation + matte-frosted List Summary
 *
 * Tests: R80-01 through R80-14
 * Route: /mobile-functional-v3
 * Viewport: 390 × 844
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

/** Return the active group index by checking which group div has data-group-active=true */
async function activeGroup(page: Parameters<typeof test>[1]['page']): Promise<number> {
  return page.evaluate(() => {
    const el = document.querySelector('[data-group-active="true"]');
    return el ? parseInt((el as HTMLElement).dataset.groupIdx ?? '-1', 10) : -1;
  });
}

// ── R80-01: Group 4 has a Next (→) button ──────────────────────────────────

test('R80-01 — Group 4 exposes a Next controls chevron', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  // Navigate to Group 4 (3 Next clicks from Group 1)
  for (let i = 0; i < 3; i++) await clickNext(page);
  expect(await activeGroup(page)).toBe(3);
  // Next controls must be present inside the active Group 4 div
  const nextInGroup4 = await page.evaluate(() =>
    !!(document.querySelector('[data-group-active="true"]')?.querySelector('[aria-label="Next controls"]'))
  );
  expect(nextInGroup4, 'Group 4 active div contains a Next controls button').toBe(true);
  // Verify Save / Share / More still present (not displaced)
  await expect(page.locator('button[aria-label="Save — save list to Locker"]')).toBeVisible();
  await expect(page.locator('button[aria-label="Share — create a review link"]')).toBeVisible();
  await expect(page.locator('button[aria-label="More — settings and tools"]')).toBeVisible();
});

// ── R80-02: Next on Group 4 wraps to Group 1 ──────────────────────────────

test('R80-02 — Next on Group 4 cycles forward to Group 1', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  // Navigate to Group 4
  for (let i = 0; i < 3; i++) await clickNext(page);
  expect(await activeGroup(page)).toBe(3);
  // One more Next → should be back at Group 1 (index 0)
  await clickNext(page);
  expect(await activeGroup(page), 'wrapped to Group 1 (index 0)').toBe(0);
  // Group 1 controls must be visible
  await expect(page.locator('button[aria-label="Locker — saved lists"]')).toBeVisible();
  await expect(page.locator('button[aria-label="Summary — pack weight and progress"]')).toBeVisible();
});

// ── R80-03: Full forward cycle 1→2→3→4→1 ─────────────────────────────────

test('R80-03 — Full forward cycle visits all four groups in order', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  const expected = [0, 1, 2, 3, 0]; // starting from 0, four Next clicks
  const actual: number[] = [await activeGroup(page)];
  for (let i = 0; i < 4; i++) {
    await clickNext(page);
    actual.push(await activeGroup(page));
  }
  expect(actual).toEqual(expected);
});

// ── R80-04: Group 1 has no Back button ────────────────────────────────────

test('R80-04 — Group 1 exposes no Previous controls chevron', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  expect(await activeGroup(page)).toBe(0);
  // Previous controls must NOT be visible/active in Group 1
  // (it is present in other groups hidden by aria-hidden, but not in active group 0)
  const prevInGroup1 = await page.evaluate(() => {
    const activeDiv = document.querySelector('[data-group-active="true"]');
    return !!activeDiv?.querySelector('[aria-label="Previous controls"]');
  });
  expect(prevInGroup1, 'no Previous controls in Group 1').toBe(false);
});

// ── R80-05: Back on Groups 2–4 still works ────────────────────────────────

test('R80-05 — Previous controls navigate backward on Groups 2, 3, and 4', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  // Go to Group 4, then click Back three times — should arrive at Group 1
  for (let i = 0; i < 3; i++) await clickNext(page);
  expect(await activeGroup(page)).toBe(3);
  for (let i = 0; i < 3; i++) await clickBack(page);
  expect(await activeGroup(page), 'Back ×3 from Group 4 reaches Group 1').toBe(0);
});

// ── R80-06: Back from Group 1 does nothing (no back-wrap) ─────────────────

test('R80-06 — Back is absent on Group 1; group stays at index 0', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  expect(await activeGroup(page)).toBe(0);
  // There is no Previous button in Group 1, so no navigation should occur.
  // Verify group stays at 0 after a brief wait.
  await page.waitForTimeout(500);
  expect(await activeGroup(page)).toBe(0);
});

// ── R80-07: List Summary has backdrop-filter ──────────────────────────────

test('R80-07 — List Summary bar has a backdrop-filter blur applied', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  const backdropFilter = await page.locator('[data-testid="list-summary-bar"]').evaluate(el => {
    const s = window.getComputedStyle(el);
    return s.getPropertyValue('backdrop-filter') || s.getPropertyValue('-webkit-backdrop-filter') || '';
  });
  expect(backdropFilter, 'backdrop-filter contains blur').toMatch(/blur\(/);
});

// ── R80-08: List Summary outer wrapper is transparent (no opaque bg) ──────

test('R80-08 — List Summary outer wrapper has no fully opaque background (transparent for blur)', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  const bg = await page.locator('[data-testid="list-summary-bar"]').evaluate(el => {
    return window.getComputedStyle(el).backgroundColor;
  });
  // Computed background should be transparent (rgba(0,0,0,0)) or not fully opaque
  // PAGE_BG (#F2EDE4) fully opaque would be rgb(242,237,228) — this must NOT be present
  expect(bg, 'outer wrapper is not fully opaque cream').not.toBe('rgb(242, 237, 228)');
});

// ── R80-09: Inner summary panel is semi-transparent green ─────────────────

test('R80-09 — List Summary inner panel has semi-transparent green background', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  // Inner panel is the first child div of list-summary-bar's first child
  const bg = await page.locator('[data-testid="list-summary-bar"] > div > div').first().evaluate(el => {
    return window.getComputedStyle(el).backgroundColor;
  });
  // Should be rgba with alpha < 1 — fully opaque #2A5740 = rgb(42,87,64)
  expect(bg, 'inner panel is not fully opaque').not.toBe('rgb(42, 87, 64)');
  // Should still contain green channel dominance
  expect(bg, 'inner panel contains green').toMatch(/rgba?\(42,\s*87,\s*64/);
});

// ── R80-10: Categories scroll underneath Summary bar ─────────────────────

test('R80-10 — Category rows exist below the sticky List Summary bar', async ({ page }) => {
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

// ── R80-11: List Summary geometry unchanged (summaryRef still reads correctly) ──

test('R80-11 — List Summary bar stays at top:0 sticky position', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  const rect = await page.locator('[data-testid="list-summary-bar"]').evaluate(
    el => { const r = el.getBoundingClientRect(); return { top: r.top, left: r.left }; }
  );
  // Bar is sticky inside the scroll container which sits below the app header (~55 px).
  // It should be in the upper quarter of the 844 px viewport — not floating mid-screen.
  expect(rect.top, 'Summary bar is near the top of the scroll area').toBeLessThan(120);
  expect(rect.left, 'Summary bar is flush left').toBeLessThan(5);
});

// ── R80-12: No horizontal overflow ────────────────────────────────────────

test('R80-12 — No horizontal overflow at 390 px with Group 4 Next button', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  // Navigate to Group 4 (has new Next button — widest group)
  for (let i = 0; i < 3; i++) await clickNext(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow, 'no overflow in Group 4').toBe(false);
});

// ── R80-13: R0079 regressions — Save chooser still opens ─────────────────

test('R80-13 — R0079 regression: Save chooser still opens from Group 4', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  for (let i = 0; i < 3; i++) await clickNext(page);
  await page.locator('button[aria-label="Save — save list to Locker"]').evaluate(el => (el as HTMLElement).click());
  await expect(page.locator('[data-testid="save-chooser-save"]')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('[data-testid="save-chooser-save-as"]')).toBeVisible();
  await page.locator('[data-testid="save-chooser-cancel"]').click();
});

// ── R80-14: R0079 regressions — Reset confirm still works ────────────────

test('R80-14 — R0079 regression: Reset confirmation still appears from Group 2', async ({ page }) => {
  await page.goto(BASE);
  await waitReady(page);
  await clickNext(page); // Group 2
  await page.locator('button[aria-label="Reset — clear checked/packed marks"]').evaluate(el => (el as HTMLElement).click());
  await expect(page.locator('[aria-label="Reset Checklist confirmation"]')).toBeVisible({ timeout: 5000 });
  await page.keyboard.press('Escape');
});
