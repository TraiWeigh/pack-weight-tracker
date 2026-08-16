/**
 * R0072P — Gold Standard Playwright Diagnostic
 * READ-ONLY: no application code is modified by this file.
 *
 * Diagnostics:
 *   A — Stacked bar height vs category bar height
 *   B — Stacked bar must not move/activate on drag
 *   C — Preview shows only selected items; no auto-print
 *   D — Weight Distribution complete panel + scroll ownership
 *   E — Pack Summary continuous panel + scroll ownership
 *   F — Box group contents + duplicate control audit
 *   G — Responsive checks (320/375/390/430)
 *   H — Category reorder + slide-to-delete regression
 */
import { test, expect, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const ROUTE = '/mobile-functional-v3';
const EVIDENCE = path.join(__dirname, 'evidence');

async function gotoV3(page: Page, width = 390) {
  await page.setViewportSize({ width, height: 844 });
  await page.goto(ROUTE);
  await expect(page.getByTestId('active-list-name')).toBeVisible({ timeout: 15000 });
}

async function nextGroup(page: Page) {
  await page.getByTestId('bottom-nav').getByRole('button', { name: 'Next controls' }).click();
  await page.waitForTimeout(450);
}

async function saveScreenshot(page: Page, name: string) {
  const p = path.join(EVIDENCE, `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  return p;
}

// ── Diagnostic A — Stacked bar height vs category bar height ─────────────────

test('DiagA: measure category bar height vs stacked bar height', async ({ page }) => {
  await gotoV3(page);

  // 1. Measure a collapsed category bar
  const catBar = page.locator('[data-swipe-key]').first();
  await expect(catBar).toBeVisible({ timeout: 5000 });
  const catBox = await catBar.boundingBox();
  const catH = catBox?.height ?? -1;
  console.log(`[DiagA] Category bar height: ${catH}px`);

  // 2. Open a deck that has stacked bars (Search — short, non-overflowing)
  await page.getByTestId('bottom-nav').getByRole('button', { name: /^Search/ }).click();
  await page.waitForTimeout(500);
  const deckScroll = page.getByTestId('deck-scroll');
  await expect(deckScroll).toBeVisible({ timeout: 3000 });

  // 3. Find an inactive stacked bar (role="button" inside deck-scroll)
  const stackedBar = deckScroll.getByRole('button').first();
  await expect(stackedBar).toBeVisible({ timeout: 3000 });
  const stackBox = await stackedBar.boundingBox();
  const stackH = stackBox?.height ?? -1;
  console.log(`[DiagA] Stacked bar height: ${stackH}px`);

  const diff = Math.abs(catH - stackH);
  console.log(`[DiagA] Difference: ${diff}px — ${diff <= 1 ? 'PASS' : 'FAIL'}`);

  await saveScreenshot(page, 'A-heights');

  // Assertions captured in log; raw values drive the report.
  // Store in global for report generation:
  expect(catH).toBeGreaterThan(0);
  expect(stackH).toBeGreaterThan(0);
});

// ── Diagnostic B — Stacked bar must not move/lift/activate on drag ──────────

test('DiagB1: stacked bar does not physically move during upward drag', async ({ page }) => {
  await gotoV3(page);
  // Use Search deck — 3 compact stacked bars, non-overflowing
  await page.getByTestId('bottom-nav').getByRole('button', { name: /^Search/ }).click();
  await page.waitForTimeout(500);

  const deckScroll = page.getByTestId('deck-scroll');
  const bar = deckScroll.getByRole('button').first();
  await expect(bar).toBeVisible();

  // Record position BEFORE
  const before = await bar.boundingBox();
  const transformBefore = await bar.evaluate(el => window.getComputedStyle(el).transform);
  console.log(`[DiagB1] Before — y:${before?.y?.toFixed(1)}, transform:${transformBefore}`);

  // Pointer down + move upward 80px, HOLD
  const cx = (before?.x ?? 0) + (before?.width ?? 0) / 2;
  const cy = (before?.y ?? 0) + (before?.height ?? 0) / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx, cy - 80, { steps: 10 });
  // Still holding — measure mid-drag
  await page.waitForTimeout(100);
  const during = await bar.boundingBox();
  const transformDuring = await bar.evaluate(el => window.getComputedStyle(el).transform);
  console.log(`[DiagB1] During drag — y:${during?.y?.toFixed(1)}, transform:${transformDuring}`);

  await saveScreenshot(page, 'B1-mid-drag');

  const yShift = Math.abs((during?.y ?? 0) - (before?.y ?? 0));
  console.log(`[DiagB1] Y shift during drag: ${yShift.toFixed(1)}px — ${yShift <= 1 ? 'PASS (no movement)' : 'FAIL (bar moved)'}`);

  // Transform changed?
  const transformChanged = transformBefore !== transformDuring && transformDuring !== 'none' && transformDuring !== 'matrix(1, 0, 0, 1, 0, 0)';
  console.log(`[DiagB1] Transform changed during drag: ${transformChanged} (before="${transformBefore}", during="${transformDuring}")`);

  await page.mouse.up();
  await page.waitForTimeout(300);
});

test('DiagB2: upward drag does not activate stacked bar on release', async ({ page }) => {
  await gotoV3(page);
  await page.getByTestId('bottom-nav').getByRole('button', { name: /^Search/ }).click();
  await page.waitForTimeout(500);

  const deckScroll = page.getByTestId('deck-scroll');
  const bar = deckScroll.getByRole('button').first();
  const label = await bar.getAttribute('aria-label');
  console.log(`[DiagB2] Testing bar: "${label}"`);

  // Count active-card indicators before drag
  const activeBefore = await page.locator('[data-testid="active-card"]').count();
  const activeCardBefore = await page.getByTestId('deck-active-card').count();
  console.log(`[DiagB2] Active card markers before: ${activeBefore + activeCardBefore}`);

  const b = await bar.boundingBox();
  const cx = (b?.x ?? 0) + (b?.width ?? 0) / 2;
  const cy = (b?.y ?? 0) + (b?.height ?? 0) / 2;

  // Drag upward well past DRAG_ACTIVATE threshold (48px) — use 100px
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx, cy - 100, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(600);

  await saveScreenshot(page, 'B2-after-drag-release');

  // Check if the bar became the active expanded card
  // The active card would have the deck-content visible for that bar's title
  const barTitle = label?.replace(' — open card', '').replace(' — not available yet', '') ?? '';
  console.log(`[DiagB2] Bar title: "${barTitle}"`);

  // If bar was activated, the deck would show expanded content for that item
  // Detect via: does the bar still render as a compact bar (role=button) or is it now expanded?
  const stillCompact = await deckScroll.getByRole('button').count();
  console.log(`[DiagB2] Stacked bars still visible after drag: ${stillCompact}`);
  console.log(`[DiagB2] If 0 bars remain, the bar was activated by drag (FAIL). If bars remain, PASS.`);
});

test('DiagB3: normal tap does activate stacked bar', async ({ page }) => {
  await gotoV3(page);
  await page.getByTestId('bottom-nav').getByRole('button', { name: /^Search/ }).click();
  await page.waitForTimeout(500);

  const deckScroll = page.getByTestId('deck-scroll');
  // The Search deck has 3 disabled stacked bars. Use the More deck which has enabled bars.
  // Close search and open More
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Navigate to Group 4 and open More
  for (let i = 0; i < 3; i++) await nextGroup(page);
  await page.getByTestId('bottom-nav').getByRole('button', { name: /^More/ }).click();
  await page.waitForTimeout(500);

  const moreDeck = page.getByTestId('deck-scroll');
  const firstBar = moreDeck.getByRole('button').first();
  const labelBefore = await firstBar.getAttribute('aria-label');
  console.log(`[DiagB3] Tapping bar: "${labelBefore}"`);

  // Normal tap (no drag)
  await firstBar.click();
  await page.waitForTimeout(400);

  // After tap, the deck-panel should show expanded content for this card
  const deckPanel = page.getByTestId('deck-panel');
  const isVisible = await deckPanel.isVisible();
  console.log(`[DiagB3] Deck panel visible after tap: ${isVisible} — ${isVisible ? 'PASS' : 'FAIL'}`);
  await saveScreenshot(page, 'B3-after-tap');
});

// ── Diagnostic C — Preview selected-items-only ───────────────────────────────

test('DiagC: Preview shows ALL items (filterToChecked=false) — check if unselected appear', async ({ page }) => {
  await gotoV3(page);

  // Establish known state from DEMO_SEED
  // checked=true: Osprey Atmos 65, Pack Rain Cover, Merino Wool Base Layer, Hiking Pants, Rain Jacket, Hiking Socks, Toothbrush, Biodegradable Soap, Headlamp, Power Bank, GPS Watch, Tent, Sleeping Bag, Sleeping Pad, Jetboil Stove, Titanium Spork
  // checked=false: Dry Bags, Fleece Mid-Layer, Travel Toothpaste, Sunscreen SPF 50, Freeze Dried Meals
  const selectedItem = 'Osprey Atmos 65';    // checked: true
  const unselectedItem = 'Fleece Mid-Layer'; // checked: false (in Clothing category)

  console.log(`[DiagC] Selected item (checked=true): "${selectedItem}"`);
  console.log(`[DiagC] Unselected item (checked=false): "${unselectedItem}"`);

  // Measure print calls before opening Preview
  await page.evaluate(() => {
    (window as any).__printCount = 0;
    window.print = () => { (window as any).__printCount++; };
  });

  // Navigate to Group 3 and click Preview
  await nextGroup(page); await nextGroup(page);
  await page.getByTestId('bottom-nav').getByRole('button', { name: /^Preview/ }).click();
  await page.waitForTimeout(800);

  // C4: check print was not called on open
  const printOnOpen = await page.evaluate(() => (window as any).__printCount ?? 0);
  console.log(`[DiagC4] window.print calls on Preview open: ${printOnOpen} — ${printOnOpen === 0 ? 'PASS (no auto-print)' : 'FAIL (auto-printed)'}`);

  // C5: Print control inside Preview
  const printBtn = page.getByTestId('preview-print-btn');
  const printBtnVisible = await printBtn.isVisible();
  console.log(`[DiagC5] Print button inside Preview: ${printBtnVisible} — ${printBtnVisible ? 'PASS' : 'FAIL'}`);

  // Screenshot of Preview
  await saveScreenshot(page, 'C-preview-open');

  // C2: selected item visible in Preview
  const selectedVisible = await page.getByText(selectedItem, { exact: false }).isVisible();
  console.log(`[DiagC2] Selected item "${selectedItem}" visible in Preview: ${selectedVisible} — ${selectedVisible ? 'PASS' : 'FAIL'}`);

  // C3: unselected item — should NOT be in Preview if filterToChecked=true (selected-only)
  //     With filterToChecked=false it WILL appear (at 0.5 opacity)
  const unselectedLocator = page.getByText(unselectedItem, { exact: false });
  const unselectedCount = await unselectedLocator.count();
  const unselectedVisible = unselectedCount > 0 && await unselectedLocator.first().isVisible();
  console.log(`[DiagC3] Unselected item "${unselectedItem}" in Preview: count=${unselectedCount}, visible=${unselectedVisible}`);
  console.log(`[DiagC3] filterToChecked=false means ALL items appear (unselected at 0.5 opacity) — ${!unselectedVisible ? 'PASS (excluded)' : 'FAIL (appears in preview)'}`);

  // Check opacity of unselected item if present
  if (unselectedCount > 0) {
    const opacity = await unselectedLocator.first().evaluate(el => {
      // Walk up to find the item row div with opacity set
      let node: HTMLElement | null = el as HTMLElement;
      while (node) {
        const s = window.getComputedStyle(node).opacity;
        if (s && parseFloat(s) < 1) return parseFloat(s);
        node = node.parentElement;
      }
      return 1;
    });
    console.log(`[DiagC3] Opacity of unselected item "${unselectedItem}": ${opacity} (0.5 = dimmed/shown, 1 = hidden by filter)`);
  }

  // Also check a second unselected item
  const unselected2 = 'Dry Bags'; // checked: false, Backpack category
  const unselected2Count = await page.getByText(unselected2, { exact: false }).count();
  console.log(`[DiagC3] Additional unselected item "${unselected2}" count in Preview: ${unselected2Count}`);

  expect(printOnOpen).toBe(0); // no auto-print — this must pass
});

test('DiagC-deliberate-print: tapping Print button inside Preview triggers window.print', async ({ page }) => {
  await gotoV3(page);
  await nextGroup(page); await nextGroup(page);
  await page.getByTestId('bottom-nav').getByRole('button', { name: /^Preview/ }).click();
  await page.waitForTimeout(700);

  // Stub print after overlay opens
  await page.evaluate(() => {
    (window as any).__printCount2 = 0;
    window.print = () => { (window as any).__printCount2++; };
  });

  await page.getByTestId('preview-print-btn').click();
  await page.waitForTimeout(400);
  const count = await page.evaluate(() => (window as any).__printCount2 ?? 0);
  console.log(`[DiagC5] Print calls after tapping Print button: ${count} — ${count > 0 ? 'PASS' : 'FAIL'}`);
  expect(count).toBeGreaterThan(0);
});

// ── Diagnostic D — Weight Distribution complete panel ───────────────────────

test('DiagD: Weight Distribution legend, scroll ownership, no nested scroller', async ({ page }) => {
  await gotoV3(page);
  await page.getByTestId('bottom-nav').getByRole('button', { name: /^Summary/ }).click();
  await page.waitForTimeout(500);

  // Activate Weight Distribution card
  await page.getByRole('button', { name: /Weight Distribution/ }).first().click();
  await page.waitForTimeout(600);

  await saveScreenshot(page, 'D-weight-dist-top');

  // Expected categories from DEMO_SEED that have checked items with weight:
  const expectedCats = ['Backpack', 'Clothing', 'Toiletries', 'Electronics', 'Shelter', 'Kitchen'];

  // D1: Check how many category legend entries appear in the panel
  const deckPanel = page.getByTestId('deck-panel');

  // Collect all text visible in the deck panel
  const panelText = await deckPanel.evaluate(el => el.innerText);
  console.log(`[DiagD1] Panel text excerpt (first 500 chars): ${panelText.substring(0, 500)}`);

  for (const cat of expectedCats) {
    const found = panelText.includes(cat);
    console.log(`[DiagD1] Category "${cat}" in legend: ${found ? 'PRESENT' : 'MISSING'}`);
  }

  // D2: Measure scroll ownership
  const deckScrollEl = page.getByTestId('deck-scroll');
  const scrollMetrics = await deckScrollEl.evaluate(el => ({
    clientHeight: el.clientHeight,
    scrollHeight: el.scrollHeight,
    overflowY: window.getComputedStyle(el).overflowY,
    scrollTop: el.scrollTop,
  }));
  console.log(`[DiagD2] deck-scroll: clientH=${scrollMetrics.clientHeight}, scrollH=${scrollMetrics.scrollHeight}, overflow=${scrollMetrics.overflowY}`);

  // D3: Check Weight Distribution content element for nested scroll
  // Find the active card content div (inside deck-panel, not the bar itself)
  const activeContent = deckPanel.locator('div').filter({ hasText: /Weight Distribution/i }).first();
  const contentMetrics = await activeContent.evaluate(el => {
    const allDivs = Array.from(el.querySelectorAll('*'));
    for (const d of allDivs) {
      const style = window.getComputedStyle(d as HTMLElement);
      if ((style.overflowY === 'auto' || style.overflowY === 'scroll') &&
          (d as HTMLElement).scrollHeight > (d as HTMLElement).clientHeight + 5) {
        return {
          found: true,
          tag: (d as HTMLElement).tagName,
          clientH: (d as HTMLElement).clientHeight,
          scrollH: (d as HTMLElement).scrollHeight,
          overflowY: style.overflowY,
          maxHeight: (d as HTMLElement).style.maxHeight || style.maxHeight,
        };
      }
    }
    return { found: false };
  });
  console.log(`[DiagD3] Nested vertical scroller inside active card: ${JSON.stringify(contentMetrics)}`);

  // D4: Scroll parent deck and see if bottom of panel becomes visible
  if (scrollMetrics.scrollHeight > scrollMetrics.clientHeight + 5) {
    await deckScrollEl.evaluate(el => { el.scrollTop = el.scrollHeight; });
    await page.waitForTimeout(300);
    await saveScreenshot(page, 'D-weight-dist-scrolled');
    const scrolledTop = await deckScrollEl.evaluate(el => el.scrollTop);
    console.log(`[DiagD4] After scrolling parent deck-scroll, scrollTop: ${scrolledTop}`);
  } else {
    console.log('[DiagD4] Parent deck does not need scrolling — all content visible in viewport');
  }

  expect(deckPanel).toBeVisible();
});

// ── Diagnostic E — Pack Summary continuous panel ────────────────────────────

test('DiagE: Pack Summary Grand Total and scroll ownership', async ({ page }) => {
  await gotoV3(page);
  await page.getByTestId('bottom-nav').getByRole('button', { name: /^Summary/ }).click();
  await page.waitForTimeout(500);

  // Pack Summary is usually the default active card; click if needed
  const psBtn = page.getByRole('button', { name: /Pack Summary/ }).first();
  if (await psBtn.isVisible()) { await psBtn.click(); await page.waitForTimeout(400); }

  await saveScreenshot(page, 'E-pack-summary');

  const deckPanel = page.getByTestId('deck-panel');
  const panelText = await deckPanel.evaluate(el => el.innerText);
  const hasGrandTotal = /Grand Total|Total/i.test(panelText);
  console.log(`[DiagE1] Grand Total present: ${hasGrandTotal} — ${hasGrandTotal ? 'PASS' : 'FAIL'}`);

  // Scroll ownership
  const deckScrollEl = page.getByTestId('deck-scroll');
  const scrollMetrics = await deckScrollEl.evaluate(el => ({
    clientHeight: el.clientHeight,
    scrollHeight: el.scrollHeight,
    overflowY: window.getComputedStyle(el).overflowY,
    scrollTop: el.scrollTop,
  }));
  console.log(`[DiagE2] deck-scroll: clientH=${scrollMetrics.clientHeight}, scrollH=${scrollMetrics.scrollHeight}, overflow=${scrollMetrics.overflowY}`);

  // Check for nested scroller in Pack Summary content
  const nestedScroller = await deckPanel.evaluate(el => {
    const divs = Array.from(el.querySelectorAll('*'));
    for (const d of divs) {
      const s = window.getComputedStyle(d as HTMLElement);
      if ((s.overflowY === 'auto' || s.overflowY === 'scroll') &&
          (d as HTMLElement).scrollHeight > (d as HTMLElement).clientHeight + 5) {
        return {
          found: true,
          clientH: (d as HTMLElement).clientHeight,
          scrollH: (d as HTMLElement).scrollHeight,
          overflowY: s.overflowY,
          maxHeight: (d as HTMLElement).style.maxHeight,
        };
      }
    }
    return { found: false };
  });
  console.log(`[DiagE2] Nested scroller inside Pack Summary: ${JSON.stringify(nestedScroller)}`);

  expect(hasGrandTotal).toBe(true);
});

// ── Diagnostic F — Box group contents + duplicate control audit ──────────────

test('DiagF: exact box group contents', async ({ page }) => {
  await gotoV3(page);
  const nav = page.getByTestId('bottom-nav');

  // Group 1
  const g1Buttons = await nav.getByRole('button').evaluateAll(
    els => els.map(e => (e as HTMLButtonElement).textContent?.trim() || (e as HTMLButtonElement).getAttribute('aria-label') || '')
  );
  console.log(`[DiagF] Group 1 buttons: ${JSON.stringify(g1Buttons)}`);
  await expect(nav.getByRole('button', { name: /^Locker/ })).toBeVisible();
  await expect(nav.getByRole('button', { name: /^Summary/ })).toBeVisible();
  await expect(nav.getByRole('button', { name: /^Add/ })).toBeVisible();
  await expect(nav.getByRole('button', { name: /^Search/ })).toBeVisible();

  // Group 2
  await nextGroup(page);
  const g2Buttons = await nav.getByRole('button').evaluateAll(
    els => els.map(e => (e as HTMLButtonElement).textContent?.trim() || (e as HTMLButtonElement).getAttribute('aria-label') || '')
  );
  console.log(`[DiagF] Group 2 buttons: ${JSON.stringify(g2Buttons)}`);

  // Group 3
  await nextGroup(page);
  const g3Buttons = await nav.getByRole('button').evaluateAll(
    els => els.map(e => (e as HTMLButtonElement).textContent?.trim() || (e as HTMLButtonElement).getAttribute('aria-label') || '')
  );
  console.log(`[DiagF] Group 3 buttons: ${JSON.stringify(g3Buttons)}`);

  // Group 4
  await nextGroup(page);
  const g4Buttons = await nav.getByRole('button').evaluateAll(
    els => els.map(e => (e as HTMLButtonElement).textContent?.trim() || (e as HTMLButtonElement).getAttribute('aria-label') || '')
  );
  console.log(`[DiagF] Group 4 buttons: ${JSON.stringify(g4Buttons)}`);

  await saveScreenshot(page, 'F-group4');
});

test('DiagF-duplicates: audit More deck for duplicate launch controls', async ({ page }) => {
  await gotoV3(page);
  for (let i = 0; i < 3; i++) await nextGroup(page);
  await page.getByTestId('bottom-nav').getByRole('button', { name: /^More/ }).click();
  await page.waitForTimeout(500);

  const deckPanel = page.getByTestId('deck-panel');
  const panelText = await deckPanel.evaluate(el => el.innerText);
  console.log(`[DiagF-dup] More deck full text:\n${panelText}`);

  // Check for known duplicate patterns that should have been removed by R0072
  const duplicates: string[] = [];

  // These should have been removed from More deck in R0072
  const removed = ['Undo', 'Redo', 'Reset', 'View / Print', 'Share & Print'];
  for (const label of removed) {
    // Look for clickable rows with these labels (not just headings)
    const found = panelText.includes(label);
    console.log(`[DiagF-dup] "${label}" text present in More deck: ${found} — ${!found ? 'PASS (removed)' : 'CHECK (may be duplicate)'}`);
    if (found) duplicates.push(label);
  }

  // Check for actual buttons (active click targets) with these names
  for (const label of ['Undo', 'Redo', 'Reset']) {
    const count = await deckPanel.getByRole('button', { name: new RegExp(`^${label}$`) }).count();
    console.log(`[DiagF-dup] Clickable button "${label}" in More deck: count=${count} — ${count === 0 ? 'PASS' : 'FAIL (duplicate)'}`);
  }

  await saveScreenshot(page, 'F-more-deck');

  // Share & Print card should be gone
  const sharePrintText = await deckPanel.getByText(/Share.*Print|Share &/i).count();
  console.log(`[DiagF-dup] "Share & Print" card title count: ${sharePrintText} — ${sharePrintText === 0 ? 'PASS' : 'FAIL (duplicate card present)'}`);
});

// ── Diagnostic G — Responsive ────────────────────────────────────────────────

const WIDTHS = [320, 375, 390, 430];

for (const w of WIDTHS) {
  test(`DiagG: responsive ${w}px — overflow, box clipping, header`, async ({ page }) => {
    await gotoV3(page, w);
    const overflow = await page.evaluate(() => {
      const r = document.querySelector('.tw-v3-root');
      return r ? r.scrollWidth - r.clientWidth : -1;
    });
    console.log(`[DiagG ${w}px] Document overflow: ${overflow}px — ${overflow <= 2 ? 'PASS' : 'FAIL'}`);

    // Count bottom-nav buttons (max 5)
    const btnCount = await page.getByTestId('bottom-nav').getByRole('button').count();
    console.log(`[DiagG ${w}px] Bottom nav buttons visible: ${btnCount} — ${btnCount <= 5 ? 'PASS' : 'FAIL (>5)'}`);

    // Header icons
    const appBar = page.locator('.tw-v3-root > div').first();
    const svgCount = await appBar.locator('svg[aria-hidden="true"]').count();
    console.log(`[DiagG ${w}px] Header aria-hidden SVGs: ${svgCount} — ${svgCount >= 7 ? 'PASS' : 'FAIL (<7)'}`);

    await saveScreenshot(page, `G-${w}px`);

    expect(overflow).toBeLessThanOrEqual(2);
    expect(btnCount).toBeLessThanOrEqual(5);
  });
}

// ── Diagnostic H — Category reorder + slide-to-delete regression ────────────

test('DiagH-reorder: long-press category reorder changes order', async ({ page }) => {
  await gotoV3(page);

  const catsBefore = await page.locator('[data-cat]').evaluateAll(
    els => els.map(e => (e as HTMLElement).dataset.cat!));
  console.log(`[DiagH-reorder] Categories before: ${JSON.stringify(catsBefore)}`);

  if (catsBefore.length < 2) {
    console.log('[DiagH-reorder] NOT RUN — fewer than 2 categories in list');
    return;
  }

  const bar = page.locator(`[data-swipe-key="cat:${catsBefore[0]}"]`);
  const b = (await bar.boundingBox())!;
  const x = b.x + b.width * 0.35, y = b.y + b.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.waitForTimeout(650); // long press
  await expect(page.locator('[data-floating="true"]')).toHaveCount(1);

  // Move down far enough to pass the next category midpoint
  await page.mouse.move(x, y + 100, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(500);

  const catsAfter = await page.locator('[data-cat]').evaluateAll(
    els => els.map(e => (e as HTMLElement).dataset.cat!));
  console.log(`[DiagH-reorder] Categories after: ${JSON.stringify(catsAfter)}`);

  const orderChanged = JSON.stringify(catsBefore) !== JSON.stringify(catsAfter);
  console.log(`[DiagH-reorder] Order changed: ${orderChanged} — ${orderChanged ? 'PASS' : 'FAIL (or minor move)'}`);

  await saveScreenshot(page, 'H-reorder-after');
});

test('DiagH-delete: slide-to-delete reveals Delete button', async ({ page }) => {
  await gotoV3(page);
  const cats = await page.locator('[data-cat]').evaluateAll(
    els => els.map(e => (e as HTMLElement).dataset.cat!));
  if (cats.length === 0) { console.log('[DiagH-delete] NOT RUN — no categories'); return; }

  const row = page.locator(`[data-swipe-key="cat:${cats[0]}"] > div`).last();
  const b = (await row.boundingBox())!;
  await page.mouse.move(b.x + b.width - 20, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width - 110, b.y + b.height / 2, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(400);

  const deleteBtn = page.getByRole('button', { name: /Delete/ }).first();
  const deleteVisible = await deleteBtn.isVisible();
  console.log(`[DiagH-delete] Delete button revealed: ${deleteVisible} — ${deleteVisible ? 'PASS' : 'FAIL'}`);
  await saveScreenshot(page, 'H-delete-reveal');
  expect(deleteVisible).toBe(true);
});
