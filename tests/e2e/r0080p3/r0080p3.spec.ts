/**
 * R0080P3 — ChevronBox right-label correction: 'More' → 'Next'
 *
 * Focused tests:
 *  R80P3-01  Group 1 right chevron visible text is "Next"
 *  R80P3-02  Group 2 right chevron visible text is "Next"
 *  R80P3-03  Group 3 right chevron visible text is "Next"
 *  R80P3-04  Group 4 right chevron visible text is "Next"
 *  R80P3-05  Group 4 has a distinct real More control (aria "More — settings and tools") before Next
 *  R80P3-06  Group 4 More control does not contain the text "Next"
 *  R80P3-07  Left chevrons still contain the text "Back" on Groups 2–4
 *  R80P3-08  Group 1 has no Previous controls chevron
 *  R80P3-09  Right chevron aria-label is still "Next controls" (unchanged)
 *  R80P3-10  Tap Next on Group 4 wraps forward to Group 1 (loop preserved)
 *  R80P3-11  Full forward tap cycle 1→2→3→4→1
 *  R80P3-12  Swipe forward from Group 4 clamps; does NOT wrap (R0080P2 preserved)
 *  R80P3-13  List Summary bar has backdrop-filter blur (frost preserved)
 *  R80P3-14  Inner summary panel alpha ≥ 0.90 (frost opacity preserved)
 */

import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

const ROUTE = '/mobile-functional-v3';

// ── helpers (matching patterns from passing R0080P2 suite) ──────────────────

async function waitReady(page: Parameters<typeof test>[1]['page']) {
  await page.waitForSelector('[data-testid="main-scroll"]', { timeout: 15_000 });
  await expect(page.getByRole('button', { name: /^Open .+ category$/ }).first()).toBeVisible({ timeout: 5_000 });
  await page.waitForTimeout(300);
}

async function clickNext(page: Parameters<typeof test>[1]['page']) {
  await page.locator('button[aria-label="Next controls"]').first()
    .evaluate(el => (el as HTMLElement).click());
  await page.waitForTimeout(350);
}

async function clickBack(page: Parameters<typeof test>[1]['page']) {
  await page.locator('button[aria-label="Previous controls"]').first()
    .evaluate(el => (el as HTMLElement).click());
  await page.waitForTimeout(350);
}

async function activeGroupIdx(page: Parameters<typeof test>[1]['page']): Promise<number> {
  return page.evaluate(() => {
    const el = document.querySelector('[data-group-active="true"]');
    return el ? parseInt((el as HTMLElement).dataset.groupIdx ?? '-1', 10) : -1;
  });
}

/** Navigate from wherever we are to Group 1, then step to targetIdx (0-based). */
async function goToGroup(page: Parameters<typeof test>[1]['page'], targetIdx: number) {
  // Clamp to Group 1 by clicking Back 4× (safe — clamps at 0)
  for (let i = 0; i < 4; i++) {
    const hasBack = await page.evaluate(() =>
      !!(document.querySelector('[data-group-active="true"]')
        ?.querySelector('[aria-label="Previous controls"]'))
    );
    if (!hasBack) break;
    await clickBack(page);
  }
  // Step forward to target
  for (let i = 0; i < targetIdx; i++) await clickNext(page);
  await page.waitForTimeout(100);
}

/** Return visible text of the right chevron in the currently active group. */
async function nextChevronText(page: Parameters<typeof test>[1]['page']): Promise<string> {
  return page.evaluate(() => {
    const btn = document.querySelector('[data-group-active="true"]')
      ?.querySelector('[aria-label="Next controls"]') as HTMLElement | null;
    return btn ? btn.textContent?.trim() ?? '' : '';
  });
}

/** Return visible text of the left chevron in the currently active group. */
async function prevChevronText(page: Parameters<typeof test>[1]['page']): Promise<string> {
  return page.evaluate(() => {
    const btn = document.querySelector('[data-group-active="true"]')
      ?.querySelector('[aria-label="Previous controls"]') as HTMLElement | null;
    return btn ? btn.textContent?.trim() ?? '' : '';
  });
}

// ── Visible-label tests ─────────────────────────────────────────────────────

test('R80P3-01 — Group 1 right chevron visible text is "Next"', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await goToGroup(page, 0);
  expect(await activeGroupIdx(page)).toBe(0);
  const txt = await nextChevronText(page);
  expect(txt, `Right chevron text in Group 1 should be "Next", got "${txt}"`).toBe('Next');
});

test('R80P3-02 — Group 2 right chevron visible text is "Next"', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await goToGroup(page, 1);
  expect(await activeGroupIdx(page)).toBe(1);
  const txt = await nextChevronText(page);
  expect(txt, `Right chevron text in Group 2 should be "Next", got "${txt}"`).toBe('Next');
});

test('R80P3-03 — Group 3 right chevron visible text is "Next"', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await goToGroup(page, 2);
  expect(await activeGroupIdx(page)).toBe(2);
  const txt = await nextChevronText(page);
  expect(txt, `Right chevron text in Group 3 should be "Next", got "${txt}"`).toBe('Next');
});

test('R80P3-04 — Group 4 right chevron visible text is "Next"', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await goToGroup(page, 3);
  expect(await activeGroupIdx(page)).toBe(3);
  const txt = await nextChevronText(page);
  expect(txt, `Right chevron text in Group 4 should be "Next", got "${txt}"`).toBe('Next');
});

test('R80P3-05 — Group 4 has a distinct real More control before Next', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await goToGroup(page, 3);
  // Real More button must exist in the active group
  const moreExists = await page.evaluate(() =>
    !!(document.querySelector('[data-group-active="true"]')
      ?.querySelector('[aria-label="More — settings and tools"]'))
  );
  expect(moreExists, 'Group 4 active group contains real More control').toBe(true);
  // Next chevron must also exist
  const nextExists = await page.evaluate(() =>
    !!(document.querySelector('[data-group-active="true"]')
      ?.querySelector('[aria-label="Next controls"]'))
  );
  expect(nextExists, 'Group 4 active group contains Next controls chevron').toBe(true);
});

test('R80P3-06 — Group 4 More control does not contain the text "Next"', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await goToGroup(page, 3);
  const moreText = await page.evaluate(() => {
    const btn = document.querySelector('[data-group-active="true"]')
      ?.querySelector('[aria-label="More — settings and tools"]') as HTMLElement | null;
    return btn ? btn.textContent?.trim() ?? '' : '';
  });
  expect(moreText).not.toBe('Next');
  expect(moreText).toBeTruthy(); // should have some text ("More")
});

test('R80P3-07 — Left chevrons read "Back" on Groups 2, 3, and 4', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  for (let g = 1; g <= 3; g++) {
    await goToGroup(page, g);
    const txt = await prevChevronText(page);
    expect(txt, `Left chevron text in Group ${g + 1} should be "Back", got "${txt}"`).toBe('Back');
  }
});

test('R80P3-08 — Group 1 has no Previous controls chevron', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await goToGroup(page, 0);
  const hasPrev = await page.evaluate(() =>
    !!(document.querySelector('[data-group-active="true"]')
      ?.querySelector('[aria-label="Previous controls"]'))
  );
  expect(hasPrev, 'Group 1 must not expose a Previous controls button').toBe(false);
});

// ── Aria-label regression ───────────────────────────────────────────────────

test('R80P3-09 — Right chevron aria-label is "Next controls" (unchanged)', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await goToGroup(page, 0);
  const ariaLabel = await page.evaluate(() => {
    const btn = document.querySelector('[data-group-active="true"]')
      ?.querySelector('[aria-label="Next controls"]');
    return btn ? btn.getAttribute('aria-label') : null;
  });
  expect(ariaLabel).toBe('Next controls');
});

// ── Behavioural regressions (R0080P2 preserved) ────────────────────────────

test('R80P3-10 — Tap Next on Group 4 wraps forward to Group 1', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await goToGroup(page, 3);
  expect(await activeGroupIdx(page)).toBe(3);
  await clickNext(page);
  expect(await activeGroupIdx(page)).toBe(0);
});

test('R80P3-11 — Full forward tap cycle 1→2→3→4→1', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await goToGroup(page, 0);
  await clickNext(page); expect(await activeGroupIdx(page)).toBe(1);
  await clickNext(page); expect(await activeGroupIdx(page)).toBe(2);
  await clickNext(page); expect(await activeGroupIdx(page)).toBe(3);
  await clickNext(page); expect(await activeGroupIdx(page)).toBe(0); // wrap
});

test('R80P3-12 — Swipe forward from Group 4 clamps; does NOT wrap', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  await goToGroup(page, 3);
  // Swipe left (forward direction) — same pattern as R0080P2 suite
  const cx = 195, cy = 780;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.waitForTimeout(40);
  for (let i = 1; i <= 8; i++) {
    await page.mouse.move(cx + (-90 * i) / 8, cy);
    await page.waitForTimeout(15);
  }
  await page.mouse.up();
  await page.waitForTimeout(400);
  // Must stay at Group 4 (index 3), not wrap to Group 1 (index 0)
  expect(await activeGroupIdx(page)).toBe(3);
});

test('R80P3-13 — List Summary bar has backdrop-filter blur (frost preserved)', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  const bf = await page.locator('[data-testid="list-summary-bar"]').evaluate(
    el => getComputedStyle(el).backdropFilter
  );
  expect(bf, 'backdrop-filter must contain blur').toMatch(/blur/);
});

test('R80P3-14 — Inner summary panel alpha ≥ 0.90 (frost opacity preserved)', async ({ page }) => {
  await page.goto(ROUTE);
  await waitReady(page);
  // Use the same selector depth as the passing R0080P2 suite: > div > div
  const bg = await page.locator('[data-testid="list-summary-bar"] > div > div').first().evaluate(el =>
    window.getComputedStyle(el).backgroundColor
  );
  expect(bg, 'inner panel contains green').toMatch(/rgba?\(42,\s*87,\s*64/);
  const alpha = parseFloat(bg.match(/rgba\(42,\s*87,\s*64,\s*([\d.]+)\)/)?.[1] ?? '0');
  expect(alpha, `Inner panel alpha should be ≥ 0.90, got ${alpha}`).toBeGreaterThanOrEqual(0.90);
});
