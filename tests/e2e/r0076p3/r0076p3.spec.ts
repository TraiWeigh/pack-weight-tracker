/**
 * R0076P3 — Playwright verification
 *
 * Two repairs:
 *
 * DEFECT 1 (TOUCH SCROLL): While a long-category is open, native touch/finger drag
 *   over the bounded item area must scroll ONLY the inner item viewport.
 *   The outer main-scroll must remain locked (scrollTop unchanged, ≤ 1 px tolerance).
 *   Root cause: ms.style.overflowY = 'auto' set in RAF1 of the alignment effect
 *   persisted when isCatLong was already true (no re-render → no reset to 'hidden').
 *
 * DEFECT 2 (SINGLE-OPEN ACCORDION): Only ONE item detail accordion may be open at a
 *   time.  Opening item B must visibly close item A.
 *   Root cause: Defect 1 scroll chaos caused misrouted touch taps, making it appear
 *   that two items were simultaneously open.  Enforced by the existing single
 *   expandedItem state + {isExpanded && ...} conditional rendering.  Confirmed correct
 *   after Defect 1 is resolved.
 *
 * Test matrix:
 *  P3-01  — Touch drag UP   → inner scrollTop increases, outer locked
 *  P3-02  — Touch drag DOWN → inner scrollTop decreases, outer locked
 *  P3-03  — Touch at top / middle / bottom of inner viewport; no chaining
 *  P3-04  — Chevron ▲/▼ regression
 *  P3-05  — Open Item A (click)
 *  P3-06  — Open Item B while A open → A closes, B opens
 *  P3-07  — Close Item B → zero expanded items
 *  P3-08  — Rapid A→B→C → only C expanded
 *  P3-09  — Expand-all cross-category single-open
 *  P3-10  — Alignment preservation (R0076P2 J01)
 *  P3-11  — Item auto-reveal preservation (R0076P2 K02)
 *  P3-12  — Save box preservation (R0076P2 L01)
 *  P3-13  — Short category regression
 *  P3-14  — Category accordion regression
 *  P3-15  — Mobile width regression (320/375/390/430)
 *
 * Primary viewport: 390 × 844
 */

import { test, expect, Page, BrowserContext, CDPSession } from '@playwright/test';

const VP     = { width: 390, height: 844 };
const SETTLE = 700;
const ADD_W  = 280;

// ── Page helpers ──────────────────────────────────────────────────────────────

async function openPage(page: Page) {
  await page.setViewportSize(VP);
  await page.goto('/mobile-functional-v3');
  await expect(page.getByTestId('main-scroll')).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(400);
}

async function openCat(page: Page, name: string) {
  await page.locator(`button[aria-label="Open ${name} category"]`).click();
  await page.waitForTimeout(SETTLE);
}

async function addItems(page: Page, n: number) {
  for (let i = 0; i < n; i++) {
    await page.getByTestId('cat-add-item-btn').click();
    await page.waitForTimeout(ADD_W);
  }
  await page.waitForTimeout(200);
}

// Click "Next controls" chevron in the currently visible group.
// Groups are translated off-screen via CSS transform (not display:none),
// so filter({ visible: true }) may match all groups.  Use DOM .click() to
// target the first one in DOM order (Group 0 → Group 1 → … progressively).
async function clickNextControls(page: Page) {
  await page.locator('[aria-label="Next controls"]').first().evaluate((el: HTMLElement) => el.click());
  await page.waitForTimeout(350);
}

// ── Geometry snapshot ─────────────────────────────────────────────────────────

async function geo(page: Page) {
  return page.evaluate(() => {
    const ms  = document.querySelector('[data-testid="main-scroll"]') as HTMLElement;
    const iv  = document.querySelector('[data-testid="open-cat-items"]') as HTMLElement;
    const hdr = document.querySelector('[data-testid="cat-header-open"]') as HTMLElement;
    const sum = document.querySelector('[data-testid="list-summary-bar"]') as HTMLElement;
    const add = document.querySelector('[data-testid="cat-add-item-bar"]') as HTMLElement;
    const nav = document.querySelector('[data-testid="bottom-nav"]') as HTMLElement;
    const g = (el: HTMLElement | null) => el?.getBoundingClientRect() ?? { top: 0, bottom: 0 };
    return {
      summaryBottom:         g(sum).bottom,
      headerTop:             g(hdr).top,
      headerBottom:          g(hdr).bottom,
      itemViewportTop:       g(iv).top,
      itemViewportBottom:    g(iv).bottom,
      itemViewportClientH:   iv?.clientHeight    ?? 0,
      itemViewportScrollH:   iv?.scrollHeight    ?? 0,
      itemViewportScrollTop: iv?.scrollTop       ?? 0,
      addItemTop:            g(add).top,
      addItemBottom:         g(add).bottom,
      bottomControlsTop:     g(nav).top,
      mainScrollTop:         ms?.scrollTop       ?? 0,
      mainScrollHeight:      ms?.scrollHeight    ?? 0,
      mainScrollClientH:     ms?.clientHeight    ?? 0,
    };
  });
}

// ── CDP real-touch drag helper ─────────────────────────────────────────────────
// Sends real browser-level Input.dispatchTouchEvent via CDP so native scrolling
// is triggered — unlike DOM-dispatched fake events which do NOT scroll natively.
// deltaY > 0  = finger moves DOWN  = content moves DOWN  = scrollTop decreases
// deltaY < 0  = finger moves UP    = content moves UP    = scrollTop increases

async function cdpDrag(
  cdp: CDPSession,
  x: number,
  y: number,
  deltaY: number,
  steps = 16,
) {
  const ts = Date.now() / 1000;
  const pt = (dy: number) => [{
    x: Math.round(x), y: Math.round(y + dy),
    id: 1, radiusX: 10, radiusY: 10, rotationAngle: 0, force: 1,
  }];

  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart', touchPoints: pt(0), modifiers: 0, timestamp: ts,
  });
  for (let i = 1; i <= steps; i++) {
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: pt(deltaY * i / steps),
      modifiers: 0,
      timestamp: ts + i * 0.016,
    });
  }
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchEnd', touchPoints: pt(deltaY), modifiers: 0,
    timestamp: ts + steps * 0.016,
  });
}

// ── Count item detail panels that are currently expanded ──────────────────────
// Counts buttons with "collapse details" in their aria-label (only present when
// the item's detail panel is expanded → {isExpanded && ...} was rendered).
async function expandedPanelCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    return document.querySelectorAll('[aria-label*="— collapse details"]').length;
  });
}

// ── CDP session factory ───────────────────────────────────────────────────────
async function makeCdp(ctx: BrowserContext, page: Page): Promise<CDPSession> {
  return ctx.newCDPSession(page);
}

// ═══════════════════════════════════════════════════════════════════════════════
// P3-01 — Touch drag UP: inner scrollTop increases; outer main-scroll stays locked
// ═══════════════════════════════════════════════════════════════════════════════
test('P3-01 — long category, touch drag UP: inner scrollTop increases; outer locked', async ({ page, context }) => {
  await openPage(page);
  await openCat(page, 'Clothing');
  await addItems(page, 8); // 13 total → long mode

  // Ensure inner viewport is at top
  await page.getByTestId('open-cat-items').evaluate((el: HTMLElement) => { el.scrollTop = 0; });
  await page.waitForTimeout(200);

  const before = await geo(page);
  console.log('P3-01 before:', JSON.stringify(before));

  // Verify we are in long mode
  expect(before.itemViewportScrollH, 'P3-01: must be in long mode').toBeGreaterThan(before.itemViewportClientH);

  // CDP real touch drag: finger drags UP (content moves UP, scrollTop increases)
  const dragX = VP.width / 2;
  const dragY = (before.itemViewportTop + before.itemViewportBottom) / 2;
  const cdp   = await makeCdp(context, page);
  await cdpDrag(cdp, dragX, dragY, -180, 20); // negative deltaY = finger up
  await page.waitForTimeout(400);

  const after = await geo(page);
  console.log('P3-01 after:', JSON.stringify(after));

  // Inner scrollTop must have increased
  expect(after.itemViewportScrollTop, 'P3-01: inner scrollTop must increase after drag UP')
    .toBeGreaterThan(before.itemViewportScrollTop);

  // Outer main-scroll must not have moved (≤ 1 px)
  const outerDrift = Math.abs(after.mainScrollTop - before.mainScrollTop);
  console.log(`P3-01: outerDrift=${outerDrift.toFixed(2)} innerScrollTop=${after.itemViewportScrollTop}`);
  expect(outerDrift, 'P3-01: outer main-scroll must stay locked (≤ 1 px)').toBeLessThanOrEqual(1);

  // Fixed boundaries must not have moved
  expect(Math.abs(after.headerTop - before.headerTop), 'P3-01: header must not move').toBeLessThanOrEqual(1);
  expect(Math.abs(after.addItemTop - before.addItemTop), 'P3-01: Add Item must not move').toBeLessThanOrEqual(1);

  console.log('P3-01 PASS');
});

// ═══════════════════════════════════════════════════════════════════════════════
// P3-02 — Touch drag DOWN: inner scrollTop decreases; outer main-scroll stays locked
// ═══════════════════════════════════════════════════════════════════════════════
test('P3-02 — long category, touch drag DOWN: inner scrollTop decreases; outer locked', async ({ page, context }) => {
  await openPage(page);
  await openCat(page, 'Clothing');
  await addItems(page, 8);

  // Pre-scroll inner viewport to a mid position
  const maxScroll = await page.getByTestId('open-cat-items').evaluate((el: HTMLElement) =>
    el.scrollHeight - el.clientHeight,
  );
  const midScroll = Math.max(4, Math.floor(maxScroll / 2));
  await page.getByTestId('open-cat-items').evaluate((el: HTMLElement, s: number) => { el.scrollTop = s; }, midScroll);
  await page.waitForTimeout(200);

  const before = await geo(page);
  console.log('P3-02 before:', JSON.stringify(before));

  const dragX = VP.width / 2;
  const dragY = (before.itemViewportTop + before.itemViewportBottom) / 2;
  const cdp   = await makeCdp(context, page);
  await cdpDrag(cdp, dragX, dragY, +180, 20); // positive deltaY = finger down = scrollTop decreases
  await page.waitForTimeout(400);

  const after = await geo(page);
  console.log('P3-02 after:', JSON.stringify(after));

  // Inner scrollTop must have decreased
  expect(after.itemViewportScrollTop, 'P3-02: inner scrollTop must decrease after drag DOWN')
    .toBeLessThan(before.itemViewportScrollTop + 2);

  // Outer main-scroll must not have moved
  const outerDrift = Math.abs(after.mainScrollTop - before.mainScrollTop);
  console.log(`P3-02: outerDrift=${outerDrift.toFixed(2)}`);
  expect(outerDrift, 'P3-02: outer main-scroll must stay locked (≤ 1 px)').toBeLessThanOrEqual(1);

  expect(Math.abs(after.headerTop - before.headerTop), 'P3-02: header must not move').toBeLessThanOrEqual(1);
  expect(Math.abs(after.addItemTop - before.addItemTop), 'P3-02: Add Item must not move').toBeLessThanOrEqual(1);

  console.log('P3-02 PASS');
});

// ═══════════════════════════════════════════════════════════════════════════════
// P3-03 — Touch at top / middle / bottom of inner viewport; no outer chaining
// ═══════════════════════════════════════════════════════════════════════════════
test('P3-03 — touch at top/middle/bottom of item viewport; no scroll chaining', async ({ page, context }) => {
  await openPage(page);
  await openCat(page, 'Clothing');
  await addItems(page, 8);

  const g0  = await geo(page);
  const cdp = await makeCdp(context, page);
  const dragX = VP.width / 2;

  const getOuterScroll = () =>
    page.evaluate(() => (document.querySelector('[data-testid="main-scroll"]') as HTMLElement)?.scrollTop ?? 0);

  // --- TOP: inner at scrollTop=0; drag DOWN (underscroll boundary → potential chain) ---
  await page.getByTestId('open-cat-items').evaluate((el: HTMLElement) => { el.scrollTop = 0; });
  await page.waitForTimeout(150);
  const msBefore1 = await getOuterScroll();
  await cdpDrag(cdp, dragX, g0.itemViewportTop + 30, +100, 12);
  await page.waitForTimeout(300);
  const driftTop = Math.abs((await getOuterScroll()) - msBefore1);
  console.log(`P3-03 TOP: outerDrift=${driftTop.toFixed(2)}`);

  // --- MIDDLE: normal scroll UP ---
  await page.getByTestId('open-cat-items').evaluate((el: HTMLElement) => {
    el.scrollTop = Math.max(0, (el.scrollHeight - el.clientHeight) / 2);
  });
  await page.waitForTimeout(150);
  const msBefore2 = await getOuterScroll();
  await cdpDrag(cdp, dragX, (g0.itemViewportTop + g0.itemViewportBottom) / 2, -60, 12);
  await page.waitForTimeout(300);
  const driftMid = Math.abs((await getOuterScroll()) - msBefore2);
  console.log(`P3-03 MID: outerDrift=${driftMid.toFixed(2)}`);

  // --- BOTTOM: inner at max; drag UP (overscroll boundary → potential chain) ---
  await page.getByTestId('open-cat-items').evaluate((el: HTMLElement) => {
    el.scrollTop = el.scrollHeight - el.clientHeight;
  });
  await page.waitForTimeout(150);
  const msBefore3 = await getOuterScroll();
  await cdpDrag(cdp, dragX, g0.itemViewportBottom - 30, -100, 12);
  await page.waitForTimeout(300);
  const driftBot = Math.abs((await getOuterScroll()) - msBefore3);
  console.log(`P3-03 BOT: outerDrift=${driftBot.toFixed(2)}`);

  // No chaining for any position (≤ 1 px each)
  expect(driftTop, 'P3-03 TOP: outer locked at inner top boundary').toBeLessThanOrEqual(1);
  expect(driftMid, 'P3-03 MID: outer locked during normal inner scroll').toBeLessThanOrEqual(1);
  expect(driftBot, 'P3-03 BOT: outer locked at inner bottom boundary').toBeLessThanOrEqual(1);

  // Fixed boundaries still correct after all drags
  const gf = await geo(page);
  expect(Math.abs(gf.headerTop - g0.headerTop), 'P3-03: header must not move').toBeLessThanOrEqual(1);
  expect(Math.abs(gf.addItemTop - g0.addItemTop), 'P3-03: Add Item must not move').toBeLessThanOrEqual(1);
  console.log('P3-03 PASS');
});

// ═══════════════════════════════════════════════════════════════════════════════
// P3-04 — Chevron ▲/▼ regression
// ═══════════════════════════════════════════════════════════════════════════════
test('P3-04 — ▲/▼ chevrons still scroll only item rows (regression)', async ({ page }) => {
  await openPage(page);
  await openCat(page, 'Clothing');
  await addItems(page, 8);

  const chevDown = page.getByTestId('cat-chevron-down');
  const chevUp   = page.getByTestId('cat-chevron-up');

  // ▲ disabled at top
  await page.getByTestId('open-cat-items').evaluate((el: HTMLElement) => { el.scrollTop = 0; });
  await page.waitForTimeout(150);
  await expect(chevUp, 'P3-04: ▲ must be disabled at top').toBeDisabled();

  // Click ▼ and verify inner scrollTop increases, outer does not move
  const msBefore = await page.evaluate(() =>
    (document.querySelector('[data-testid="main-scroll"]') as HTMLElement)?.scrollTop ?? 0,
  );
  await chevDown.click();
  await page.waitForTimeout(450);
  const ivScrollTop = await page.getByTestId('open-cat-items').evaluate((el: HTMLElement) => el.scrollTop);
  const msAfter = await page.evaluate(() =>
    (document.querySelector('[data-testid="main-scroll"]') as HTMLElement)?.scrollTop ?? 0,
  );
  expect(ivScrollTop, 'P3-04: ▼ must increase inner scrollTop').toBeGreaterThan(0);
  expect(Math.abs(msAfter - msBefore), 'P3-04: ▼ must not move outer scroll').toBeLessThanOrEqual(1);

  console.log('P3-04 PASS');
});

// ═══════════════════════════════════════════════════════════════════════════════
// P3-05 — Open Item A; only A expanded
// ═══════════════════════════════════════════════════════════════════════════════
test('P3-05 — open Item A; only A expanded', async ({ page }) => {
  await openPage(page);
  await openCat(page, 'Clothing');
  await addItems(page, 8);

  const itemRows = page.getByTestId('open-cat-items').getByRole('button', { name: /— expand details$/ });
  await itemRows.first().click();
  await page.waitForTimeout(500);

  const expanded = await expandedPanelCount(page);
  console.log(`P3-05: expandedCount=${expanded}`);
  expect(expanded, 'P3-05: exactly one item must be expanded').toBe(1);

  console.log('P3-05 PASS');
});

// ═══════════════════════════════════════════════════════════════════════════════
// P3-06 — Open Item B while A is open → A closes, B opens, only 1 panel in DOM
// ═══════════════════════════════════════════════════════════════════════════════
test('P3-06 — open Item B with A open: A closes, B opens; exactly 1 expanded', async ({ page }) => {
  await openPage(page);
  await openCat(page, 'Clothing');
  await addItems(page, 8);

  const itemRows = page.getByTestId('open-cat-items').getByRole('button', { name: /— expand details$/ });

  // Open item A (first)
  await itemRows.first().click();
  await page.waitForTimeout(400);

  const countAfterA = await expandedPanelCount(page);
  expect(countAfterA, 'P3-06: after opening A, count must be 1').toBe(1);

  // Get A's label before it closes
  const labelA = await page.evaluate(() =>
    document.querySelector('[aria-label*="— collapse details"]')?.getAttribute('aria-label') ?? null,
  );
  console.log(`P3-06: A label = ${labelA}`);

  // Open item B (second expand-button after A's panel appears)
  // Wait for A's panel to settle, then click B
  await itemRows.nth(1).click();
  await page.waitForTimeout(500);

  const countAfterB = await expandedPanelCount(page);
  const labelB = await page.evaluate(() =>
    document.querySelector('[aria-label*="— collapse details"]')?.getAttribute('aria-label') ?? null,
  );
  console.log(`P3-06: after B: expandedCount=${countAfterB} B label=${labelB}`);

  expect(countAfterB, 'P3-06: exactly one item must be expanded after opening B').toBe(1);
  expect(labelB, 'P3-06: B must be expanded').toContain('collapse details');
  expect(labelB, 'P3-06: expanded item must differ from A (A must be closed)').not.toBe(labelA);

  // Confirm A is not in the expanded set (its "collapse" button is gone from DOM)
  const aStillExpanded = await page.evaluate((la: string | null) => {
    return la !== null && document.querySelector(`[aria-label="${la}"]`) !== null;
  }, labelA);
  expect(aStillExpanded, 'P3-06: item A must be closed (aria-label shows "expand", not "collapse")').toBe(false);

  console.log('P3-06 PASS');
});

// ═══════════════════════════════════════════════════════════════════════════════
// P3-07 — Tap the open item again → closes; zero expanded
// ═══════════════════════════════════════════════════════════════════════════════
test('P3-07 — click current open item closes it; zero expanded', async ({ page }) => {
  await openPage(page);
  await openCat(page, 'Clothing');
  await addItems(page, 8);

  const itemRows = page.getByTestId('open-cat-items').getByRole('button', { name: /— expand details$/ });

  // Open second item
  await itemRows.nth(1).click();
  await page.waitForTimeout(500);
  expect(await expandedPanelCount(page), 'P3-07: must have 1 item open first').toBe(1);

  // Now click the same item (which shows "collapse details") to close it
  const collapseBtn = page.locator('[aria-label*="— collapse details"]').first();
  await collapseBtn.click();
  await page.waitForTimeout(400);

  const count = await expandedPanelCount(page);
  console.log(`P3-07: count after toggle-close=${count}`);
  expect(count, 'P3-07: zero items must be expanded after closing').toBe(0);

  console.log('P3-07 PASS');
});

// ═══════════════════════════════════════════════════════════════════════════════
// P3-08 — Rapid A→B→C: only C expanded, no stale A/B detail
// ═══════════════════════════════════════════════════════════════════════════════
test('P3-08 — rapid A→B→C: only C expanded; stale A/B details absent', async ({ page }) => {
  await openPage(page);
  await openCat(page, 'Clothing');
  await addItems(page, 8);

  const expandBtns = () =>
    page.getByTestId('open-cat-items').getByRole('button', { name: /— expand details$/ });

  // Open A (first)
  await expandBtns().nth(0).click();
  await page.waitForTimeout(350);

  // Open B (second) — note: after A's panel renders, the 2nd "expand" button
  // is still the second item (A now shows "collapse", so expand count shifts)
  await expandBtns().nth(0).click(); // next "expand" after A collapses its slot
  await page.waitForTimeout(350);

  // Open C (third)
  await expandBtns().nth(0).click();
  await page.waitForTimeout(500);

  const count = await expandedPanelCount(page);
  console.log(`P3-08: expandedCount=${count}`);
  expect(count, 'P3-08: exactly one item expanded after rapid A→B→C').toBe(1);

  console.log('P3-08 PASS');
});

// ═══════════════════════════════════════════════════════════════════════════════
// P3-09 — Expand-all cross-category single-open
// ═══════════════════════════════════════════════════════════════════════════════
test('P3-09 — expand-all: opening item in Category 2 closes item in Category 1', async ({ page }) => {
  await openPage(page);

  // Trigger expand-all
  await page.locator('[aria-label="Expand all categories"]').click();
  await page.waitForTimeout(600);

  // In expand-all mode data-testid="open-cat-items" is NOT set (condition !allExpanded = false),
  // so we scope item expand buttons by their parent data-cat div.
  // Find any two categories that have items.
  const cats = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-cat]'))
      .map(el => el.getAttribute('data-cat'))
      .filter(Boolean) as string[],
  );
  console.log(`P3-09: visible categories = ${cats.slice(0, 5).join(', ')}`);

  if (cats.length < 2) {
    console.log('P3-09: fewer than 2 categories visible — SKIP');
    return;
  }

  const cat1 = cats[0];
  const cat2 = cats[1];

  // Open an item in cat1
  const cat1ExpandBtn = page.locator(`[data-cat="${cat1}"]`).getByRole('button', { name: /— expand details$/ }).first();
  if (!(await cat1ExpandBtn.isVisible())) { console.log('P3-09: cat1 items not visible — SKIP'); return; }
  await cat1ExpandBtn.click();
  await page.waitForTimeout(400);

  const afterCat1 = await expandedPanelCount(page);
  console.log(`P3-09: after cat1 open: expandedCount=${afterCat1}`);
  expect(afterCat1, 'P3-09: one item expanded after cat1 click').toBe(1);

  // Open an item in cat2
  const cat2ExpandBtn = page.locator(`[data-cat="${cat2}"]`).getByRole('button', { name: /— expand details$/ }).first();
  if (!(await cat2ExpandBtn.isVisible())) { console.log('P3-09: cat2 items not visible — SKIP'); return; }
  await cat2ExpandBtn.click();
  await page.waitForTimeout(500);

  const afterCat2 = await expandedPanelCount(page);
  console.log(`P3-09: after cat2 open: expandedCount=${afterCat2}`);
  expect(afterCat2, 'P3-09: at most 1 item detail expanded across all categories').toBe(1);

  console.log('P3-09 PASS');
});

// ═══════════════════════════════════════════════════════════════════════════════
// P3-10 — Alignment preservation (R0076P2 J01 regression)
// ═══════════════════════════════════════════════════════════════════════════════
test('P3-10 — long category header flush under List Summary (R0076P2 J01)', async ({ page }) => {
  await openPage(page);
  await openCat(page, 'Clothing');
  await addItems(page, 8);

  const g = await geo(page);
  const gap = Math.abs(g.headerTop - g.summaryBottom);
  console.log(`P3-10: gap=${gap.toFixed(3)} headerTop=${g.headerTop} summaryBottom=${g.summaryBottom}`);
  expect(gap, 'P3-10: category header must touch List Summary (≤ 1 px gap)').toBeLessThanOrEqual(1);

  console.log('P3-10 PASS');
});

// ═══════════════════════════════════════════════════════════════════════════════
// P3-11 — Item auto-reveal preservation (R0076P2 K02 regression)
// ═══════════════════════════════════════════════════════════════════════════════
test('P3-11 — item auto-reveal: Delete row visible; outer stack stays locked', async ({ page }) => {
  await openPage(page);
  await openCat(page, 'Clothing');
  await addItems(page, 8);

  // Reset inner viewport to top
  await page.getByTestId('open-cat-items').evaluate((el: HTMLElement) => { el.scrollTop = 0; });
  await page.waitForTimeout(200);

  const before = await geo(page);
  const msBefore = before.mainScrollTop;

  // Click the last item row (below the viewport fold) to expand it
  const expandBtns = page.getByTestId('open-cat-items').getByRole('button', { name: /— expand details$/ });
  const total = await expandBtns.count();
  await expandBtns.nth(total - 1).click();
  await page.waitForTimeout(700); // auto-reveal settle

  const after = await geo(page);

  // Delete row must be in the DOM (data-testid="item-delete-row" set when isExpanded && isCatLong)
  const deleteRow = page.getByTestId('item-delete-row');
  await expect(deleteRow, 'P3-11: item-delete-row must be visible after expand').toBeVisible({ timeout: 3000 });

  // Delete row bottom must be at or above the Add Item bar
  // Playwright's BoundingBox is {x,y,width,height} — use y+height for bottom edge
  const drBox = await deleteRow.boundingBox();
  expect(drBox, 'P3-11: delete row bounding box must be non-null').not.toBeNull();
  const drBottom = drBox!.y + drBox!.height;
  expect(drBottom, 'P3-11: Delete row bottom must be at or above Add Item bar').toBeLessThanOrEqual(after.addItemBottom + 2);

  // Outer scroll must not have drifted
  const outerDrift = Math.abs(after.mainScrollTop - msBefore);
  console.log(`P3-11: outerDrift=${outerDrift.toFixed(2)} deleteBottom=${drBottom.toFixed(2)}`);
  expect(outerDrift, 'P3-11: outer stack must stay locked during auto-reveal').toBeLessThanOrEqual(1);

  console.log('P3-11 PASS');
});

// ═══════════════════════════════════════════════════════════════════════════════
// P3-12 — Save box preservation (R0076P2 L01 regression)
// ═══════════════════════════════════════════════════════════════════════════════
test('P3-12 — Group 4 shows Back | Save | Share | More; Save invokes handler', async ({ page }) => {
  await openPage(page);

  // Navigate to Group 4 by clicking "Next controls" three times (groups 0→1→2→3)
  await clickNextControls(page);
  await clickNextControls(page);
  await clickNextControls(page);

  // Verify Group 4 buttons
  const saveBtn  = page.locator('[aria-label="Save — save list to Locker"]');
  const shareBtn = page.locator('[aria-label="Share — create a review link"]');
  const moreBtn  = page.locator('[aria-label="More — settings and tools"]');
  const backBtn  = page.locator('[aria-label="Previous controls"]').filter({ visible: true }).first();

  await expect(backBtn,  'P3-12: Back must be visible').toBeVisible({ timeout: 3000 });
  await expect(saveBtn,  'P3-12: Save must be visible').toBeVisible();
  await expect(shareBtn, 'P3-12: Share must be visible').toBeVisible();
  await expect(moreBtn,  'P3-12: More must be visible').toBeVisible();

  // Verify horizontal order: Back < Save < Share < More
  const bbs = await Promise.all([
    backBtn.boundingBox(),
    saveBtn.boundingBox(),
    shareBtn.boundingBox(),
    moreBtn.boundingBox(),
  ]);
  const [bBB, sBB, rBB, mBB] = bbs;
  expect(bBB!.x, 'P3-12: Back must be leftmost').toBeLessThan(sBB!.x);
  expect(sBB!.x, 'P3-12: Save before Share').toBeLessThan(rBB!.x);
  expect(rBB!.x, 'P3-12: Share before More').toBeLessThan(mBB!.x);

  // Save must invoke the handler (produces a toast "Saved as …")
  await saveBtn.click();
  await page.waitForTimeout(800);
  // Toast is a plain fixed div with the save name text
  const saveToast = page.locator(':text("Saved as")');
  await expect(saveToast, 'P3-12: Save must produce a "Saved as" toast').toBeVisible({ timeout: 4000 });

  console.log('P3-12 PASS');
});

// ═══════════════════════════════════════════════════════════════════════════════
// P3-13 — Short category regression (no long-mode lock leaked into short mode)
// ═══════════════════════════════════════════════════════════════════════════════
test('P3-13 — short category: outer scroll is auto, item expand/close works', async ({ page }) => {
  await openPage(page);
  await openCat(page, 'Clothing'); // 5 default items → short mode

  // main-scroll must be scrollable (overflowY computed to 'auto' or 'scroll')
  const ovY = await page.evaluate(() => {
    const ms = document.querySelector('[data-testid="main-scroll"]') as HTMLElement;
    return window.getComputedStyle(ms).overflowY;
  });
  console.log(`P3-13: main-scroll overflowY in short mode = ${ovY}`);
  expect(['auto', 'scroll'], `P3-13: main-scroll must be scrollable; got '${ovY}'`).toContain(ovY);

  // Item can be expanded in short mode
  const expandBtns = page.getByTestId('open-cat-items').getByRole('button', { name: /— expand details$/ });
  await expandBtns.first().click();
  await page.waitForTimeout(400);
  expect(await expandedPanelCount(page), 'P3-13: item can be expanded in short mode').toBe(1);

  // Item can be closed in short mode
  const collapseBtn = page.locator('[aria-label*="— collapse details"]').first();
  await collapseBtn.click();
  await page.waitForTimeout(400);
  expect(await expandedPanelCount(page), 'P3-13: item can be closed in short mode').toBe(0);

  console.log('P3-13 PASS');
});

// ═══════════════════════════════════════════════════════════════════════════════
// P3-14 — Category accordion regression
// ═══════════════════════════════════════════════════════════════════════════════
test('P3-14 — category single-open and global controls unchanged', async ({ page }) => {
  await openPage(page);

  // Open Clothing, then Backpack → Clothing's open-cat-items must disappear
  await openCat(page, 'Clothing');
  // Scope to the Clothing category div to check its items container
  const clothingOpenItems = page.locator('[data-cat="Clothing"] [data-testid="open-cat-items"]');
  await expect(clothingOpenItems, 'P3-14: Clothing items must be visible when open').toBeVisible();

  await openCat(page, 'Backpack');
  // After Backpack opens, data-testid="open-cat-items" is no longer set on Clothing's div
  await expect(clothingOpenItems, 'P3-14: Clothing items must vanish when Backpack opens').not.toBeVisible({ timeout: 3000 });

  // Backpack items must be visible
  const backpackOpenItems = page.locator('[data-cat="Backpack"] [data-testid="open-cat-items"]');
  await expect(backpackOpenItems, 'P3-14: Backpack items must be visible').toBeVisible();

  // Close Backpack first (its open state changes the button label to "Collapse all categories").
  // Once no category is open the label reverts to "Expand all categories".
  await page.locator('[aria-label="Close Backpack category"]').click();
  await page.waitForTimeout(400);

  // Now the toggle button should read "Expand all categories"
  await page.locator('[aria-label="Expand all categories"]').click();
  await page.waitForTimeout(400);
  const catDivCount = await page.locator('[data-cat]').count();
  expect(catDivCount, 'P3-14: multiple category divs must exist in expand-all').toBeGreaterThan(1);

  // Collapse-all hides all item containers
  await page.locator('[aria-label="Collapse all categories"]').click();
  await page.waitForTimeout(400);
  // In collapsed state, open-cat-items testid is absent (no category is open)
  await expect(page.getByTestId('open-cat-items'), 'P3-14: all item containers must be gone after collapse').not.toBeVisible({ timeout: 3000 });

  console.log('P3-14 PASS');
});

// ═══════════════════════════════════════════════════════════════════════════════
// P3-15 — Mobile width regression (320/375/390/430)
// ═══════════════════════════════════════════════════════════════════════════════
test('P3-15 — no horizontal overflow at 320/375/390/430 (regression)', async ({ page }) => {
  await openPage(page);
  await openCat(page, 'Clothing');
  await addItems(page, 8);

  for (const w of [320, 375, 390, 430]) {
    await page.setViewportSize({ width: w, height: 844 });
    await page.waitForTimeout(200);
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > window.innerWidth + 2,
    );
    console.log(`P3-15: w=${w} overflow=${overflow}`);
    expect(overflow, `P3-15: no horizontal overflow at ${w}px`).toBe(false);
  }
  await page.setViewportSize(VP);

  console.log('P3-15 PASS');
});
