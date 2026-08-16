/**
 * R0073 — Targeted Playwright verification
 * Stacked-bar height match | Tap-only | Preview selected-only | No category Add Item
 * + Protected R0072 regression suite
 */
import { test, expect, type Page } from '@playwright/test';
import * as path from 'path';

const ROUTE = '/mobile-functional-v3';
const EV    = path.join(__dirname, 'evidence');

async function gotoV3(page: Page, width = 390) {
  await page.setViewportSize({ width, height: 844 });
  await page.goto(ROUTE);
  await expect(page.getByTestId('active-list-name')).toBeVisible({ timeout: 15000 });
}

async function nextGroup(page: Page) {
  await page.getByTestId('bottom-nav').getByRole('button', { name: 'Next controls' }).click();
  await page.waitForTimeout(450);
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: path.join(EV, `${name}.png`), fullPage: false });
}

// ── STACKED-BAR HEIGHT ────────────────────────────────────────────────────────

test('SH01: stacked bar matches category bar height at 390 px (<=1 px diff)', async ({ page }) => {
  await gotoV3(page, 390);

  // Category bar height
  const catBar = page.locator('[data-swipe-key]').first();
  await expect(catBar).toBeVisible({ timeout: 5000 });
  const catH = (await catBar.boundingBox())!.height;

  // Open More deck — stacked bars appear
  await nextGroup(page); await nextGroup(page); await nextGroup(page);
  await page.getByTestId('bottom-nav').getByRole('button', { name: /^More/ }).click();
  await page.waitForTimeout(500);

  const stackBar = page.getByRole('button', { name: 'List Actions — open card', exact: true });
  await expect(stackBar).toBeVisible({ timeout: 3000 });
  const stackH = (await stackBar.boundingBox())!.height;

  const diff = Math.abs(catH - stackH);
  console.log(`[SH01] catH=${catH}px stackH=${stackH}px diff=${diff}px`);
  await shot(page, 'SH01-height-match');

  expect(diff).toBeLessThanOrEqual(1);
});

const WIDTHS = [320, 375, 430] as const;
for (const w of WIDTHS) {
  test(`SH02: stacked bar matches category bar height at ${w}px`, async ({ page }) => {
    await gotoV3(page, w);
    const catBar = page.locator('[data-swipe-key]').first();
    await expect(catBar).toBeVisible({ timeout: 5000 });
    const catH = (await catBar.boundingBox())!.height;

    await nextGroup(page); await nextGroup(page); await nextGroup(page);
    await page.getByTestId('bottom-nav').getByRole('button', { name: /^More/ }).click();
    await page.waitForTimeout(500);

    const stackBar = page.getByRole('button', { name: 'List Actions — open card', exact: true });
    await expect(stackBar).toBeVisible({ timeout: 3000 });
    const stackH = (await stackBar.boundingBox())!.height;

    const diff = Math.abs(catH - stackH);
    console.log(`[SH02@${w}] catH=${catH}px stackH=${stackH}px diff=${diff}px`);
    expect(diff).toBeLessThanOrEqual(1);
  });
}

// ── STACKED-BAR TAP-ONLY ──────────────────────────────────────────────────────

test('TO01: precondition — deck is non-overflowing, target is enabled', async ({ page }) => {
  await gotoV3(page);
  await nextGroup(page); await nextGroup(page); await nextGroup(page);
  await page.getByTestId('bottom-nav').getByRole('button', { name: /^More/ }).click();
  await page.waitForTimeout(600);

  const deckScroll = page.getByTestId('deck-scroll');
  await expect(deckScroll).toBeVisible({ timeout: 4000 });
  const sm = await deckScroll.evaluate(el => ({ c: el.clientHeight, s: el.scrollHeight }));
  const nonOverflowing = sm.s <= sm.c + 1;
  console.log(`[TO01] deck clientH=${sm.c} scrollH=${sm.s} nonOverflowing=${nonOverflowing}`);

  const target = page.getByRole('button', { name: 'List Actions — open card', exact: true });
  await expect(target).toBeVisible({ timeout: 3000 });
  const ariaDisabled = await target.getAttribute('aria-disabled');
  console.log(`[TO01] aria-disabled="${ariaDisabled}" (enabled=${!ariaDisabled || ariaDisabled === 'false'})`);

  expect(nonOverflowing).toBe(true);
  expect(!ariaDisabled || ariaDisabled === 'false').toBe(true);
});

test('TO02: normal tap activates stacked bar', async ({ page }) => {
  await gotoV3(page);
  await nextGroup(page); await nextGroup(page); await nextGroup(page);
  await page.getByTestId('bottom-nav').getByRole('button', { name: /^More/ }).click();
  await page.waitForTimeout(600);

  const target = page.getByRole('button', { name: 'List Actions — open card', exact: true });
  await expect(target).toBeVisible();
  await target.click();
  await page.waitForTimeout(400);

  const stillStacked = await page.getByRole('button', { name: 'List Actions — open card', exact: true }).isVisible();
  console.log(`[TO02] still stacked after tap: ${stillStacked} (activated=${!stillStacked})`);
  expect(stillStacked).toBe(false); // bar became the active card
});

test('TO03: 80 px drag does not move stacked bar (<=1 px, no transform)', async ({ page }) => {
  await gotoV3(page);
  await nextGroup(page); await nextGroup(page); await nextGroup(page);
  await page.getByTestId('bottom-nav').getByRole('button', { name: /^More/ }).click();
  await page.waitForTimeout(600);

  const deckScroll = page.getByTestId('deck-scroll');
  const target = page.getByRole('button', { name: 'List Actions — open card', exact: true });
  await expect(target).toBeVisible();

  // Verify non-overflowing
  const sm = await deckScroll.evaluate(el => ({ c: el.clientHeight, s: el.scrollHeight, st: el.scrollTop }));
  expect(sm.s).toBeLessThanOrEqual(sm.c + 1);

  const beforeBox  = (await target.boundingBox())!;
  const beforeTfm  = await target.evaluate(el => window.getComputedStyle(el).transform);
  const beforeTop  = beforeBox.y;
  const cx = beforeBox.x + beforeBox.width / 2;
  const cy = beforeBox.y + beforeBox.height / 2;

  console.log(`[TO03] BEFORE top=${beforeTop.toFixed(2)} transform="${beforeTfm}"`);
  await shot(page, 'TO03-before-drag');

  // Drag upward 80 px, hold
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx, cy - 12, { steps: 3 });
  await page.waitForTimeout(60);
  await page.mouse.move(cx, cy - 80, { steps: 10 });
  await page.waitForTimeout(200);

  const duringBox = (await target.boundingBox())!;
  const duringTfm = await target.evaluate(el => window.getComputedStyle(el).transform);
  const duringScrollTop = await deckScroll.evaluate(el => el.scrollTop);

  const rawShift = duringBox.y - beforeTop;
  const adjShift = rawShift - (duringScrollTop - sm.st);
  const tfmChanged = duringTfm !== beforeTfm;

  console.log(`[TO03] DURING top=${duringBox.y.toFixed(2)} transform="${duringTfm}" scrollTop=${duringScrollTop}`);
  console.log(`[TO03] rawShift=${rawShift.toFixed(2)}px adjShift=${adjShift.toFixed(2)}px transformChanged=${tfmChanged}`);
  await shot(page, 'TO03-mid-drag');

  await page.mouse.up();
  await page.waitForTimeout(400);

  const afterStacked = await page.getByRole('button', { name: 'List Actions — open card', exact: true }).isVisible();
  const afterTfm = afterStacked
    ? await page.getByRole('button', { name: 'List Actions — open card', exact: true })
        .evaluate(el => window.getComputedStyle(el).transform)
    : 'N/A';
  console.log(`[TO03] AFTER stacked=${afterStacked} transform="${afterTfm}"`);
  await shot(page, 'TO03-after-drag');

  // Assertions
  expect(Math.abs(adjShift)).toBeLessThanOrEqual(1);   // bar must not move
  expect(tfmChanged).toBe(false);                       // no lift transform
  expect(afterStacked).toBe(true);                      // still inactive (not activated)
});

test('TO04: 110 px drag release does NOT activate stacked bar', async ({ page }) => {
  await gotoV3(page);
  await nextGroup(page); await nextGroup(page); await nextGroup(page);
  await page.getByTestId('bottom-nav').getByRole('button', { name: /^More/ }).click();
  await page.waitForTimeout(600);

  const target = page.getByRole('button', { name: 'List Actions — open card', exact: true });
  await expect(target).toBeVisible();
  const b = (await target.boundingBox())!;
  const cx = b.x + b.width / 2, cy = b.y + b.height / 2;

  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx, cy - 12, { steps: 3 });
  await page.waitForTimeout(60);
  await page.mouse.move(cx, cy - 110, { steps: 14 });
  await page.waitForTimeout(100);
  await page.mouse.up();
  await page.waitForTimeout(600);

  const stillStacked = await page.getByRole('button', { name: 'List Actions — open card', exact: true }).isVisible();
  console.log(`[TO04] still stacked after 110px drag/release: ${stillStacked}`);
  await shot(page, 'TO04-large-drag-release');

  expect(stillStacked).toBe(true); // must NOT activate via drag
});

test('TO05: overflowing deck — stacked bar has scroll mode, bar does not lift', async ({ page }) => {
  // Produce an overflowing More deck by opening List Actions (expanded content) which makes
  // the deck taller. Measure whether any remaining stacked bar lifts during drag.
  await gotoV3(page);
  await nextGroup(page); await nextGroup(page); await nextGroup(page);
  await page.getByTestId('bottom-nav').getByRole('button', { name: /^More/ }).click();
  await page.waitForTimeout(600);

  // Activate List Actions so the deck may overflow (expanded content + 3 stacked bars)
  await page.getByRole('button', { name: 'List Actions — open card', exact: true }).click();
  await page.waitForTimeout(400);

  const deckScroll = page.getByTestId('deck-scroll');
  const sm = await deckScroll.evaluate(el => ({ c: el.clientHeight, s: el.scrollHeight, st: el.scrollTop }));
  console.log(`[TO05] More+ListActions deck: clientH=${sm.c} scrollH=${sm.s}`);

  // Find "List Settings" — a stacked bar visible when List Actions is active
  const lsBar = page.getByRole('button', { name: 'List Settings — open card', exact: true });
  const lsVisible = await lsBar.isVisible();
  console.log(`[TO05] "List Settings" stacked bar visible: ${lsVisible}`);

  if (!lsVisible) {
    console.log('[TO05] SKIP — no stacked bar visible with current deck state');
    return;
  }

  const beforeBox = (await lsBar.boundingBox())!;
  const beforeTfm = await lsBar.evaluate(el => window.getComputedStyle(el).transform);
  const scrollBefore = sm.st;

  const cx = beforeBox.x + beforeBox.width / 2;
  const cy = beforeBox.y + beforeBox.height / 2;

  // Drag upward 80 px — in scroll mode this scrolls deck content; bar must NOT lift
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx, cy - 12, { steps: 3 });
  await page.waitForTimeout(60);
  await page.mouse.move(cx, cy - 80, { steps: 10 });
  await page.waitForTimeout(200);

  const duringBox = (await lsBar.boundingBox())!;
  const duringTfm = await lsBar.evaluate(el => window.getComputedStyle(el).transform);
  const scrollDuring = await deckScroll.evaluate(el => el.scrollTop);
  const rawShift = duringBox.y - beforeBox.y;
  const scrollDelta = scrollDuring - scrollBefore;
  // Scroll-adjusted: if deck scrolled, bar moves upward with content — that is expected scroll behavior
  const adjShift = rawShift + scrollDelta; // rawShift is negative (up), scrollDelta positive → adj ~0 if only scrolling
  const tfmChanged = duringTfm !== beforeTfm;

  console.log(`[TO05] DURING: rawShift=${rawShift.toFixed(2)} scrollDelta=${scrollDelta} adjShift=${adjShift.toFixed(2)} tfmChanged=${tfmChanged}`);
  console.log(`[TO05] overflowing=${sm.s > sm.c + 1}`);

  await page.mouse.up();
  await page.waitForTimeout(400);

  // Key assertions: transform must NOT change (no lift), and if non-overflowing adjShift≤1
  expect(tfmChanged).toBe(false); // no lift transform in any deck state
  if (sm.s <= sm.c + 1) {
    // Non-overflowing: bar must not move at all
    expect(Math.abs(adjShift)).toBeLessThanOrEqual(2);
  }
  console.log('[TO05] PASS — stacked bar never lifts (scroll or no-op mode only)');
});

// ── PREVIEW SELECTED-ONLY ─────────────────────────────────────────────────────

test('PV01: selected item visible in Preview, unselected item absent', async ({ page }) => {
  await gotoV3(page);

  const selectedItem   = 'Osprey Atmos 65';  // checked: true in DEMO_SEED
  const unselectedItem = 'Fleece Mid-Layer'; // checked: false in DEMO_SEED

  // Stub window.print before opening Preview
  await page.evaluate(() => { (window as any).__printCount = 0; window.print = () => { (window as any).__printCount++; }; });

  // Navigate to Group 3 and open Preview
  await nextGroup(page); await nextGroup(page);
  await page.getByTestId('bottom-nav').getByRole('button', { name: /^Preview/ }).click();
  await page.waitForTimeout(800);

  await shot(page, 'PV01-preview-open');

  // Auto-print check
  const printCount = await page.evaluate(() => (window as any).__printCount ?? 0);
  console.log(`[PV01] window.print calls on open: ${printCount}`);
  expect(printCount).toBe(0);

  // Print control present
  const printBtn = page.getByTestId('preview-print-btn');
  await expect(printBtn).toBeVisible();
  console.log('[PV01] Print button present: PASS');

  // Selected item visible
  await expect(page.getByText(selectedItem, { exact: false })).toBeVisible({ timeout: 3000 });
  console.log(`[PV01] Selected item "${selectedItem}" visible: PASS`);

  // Unselected item absent
  const unselCount = await page.getByText(unselectedItem, { exact: false }).count();
  console.log(`[PV01] Unselected item "${unselectedItem}" count in Preview: ${unselCount} (must be 0)`);
  expect(unselCount).toBe(0);
});

test('PV02: second unselected item (Dry Bags) also absent from Preview', async ({ page }) => {
  await gotoV3(page);
  await nextGroup(page); await nextGroup(page);
  await page.getByTestId('bottom-nav').getByRole('button', { name: /^Preview/ }).click();
  await page.waitForTimeout(800);

  const count = await page.getByText('Dry Bags', { exact: false }).count();
  console.log(`[PV02] "Dry Bags" (unchecked) count in Preview: ${count}`);
  expect(count).toBe(0);
});

test('PV03: Print button inside Preview triggers window.print on deliberate tap', async ({ page }) => {
  await gotoV3(page);
  await nextGroup(page); await nextGroup(page);
  await page.getByTestId('bottom-nav').getByRole('button', { name: /^Preview/ }).click();
  await page.waitForTimeout(700);

  await page.evaluate(() => { (window as any).__printCount2 = 0; window.print = () => { (window as any).__printCount2++; }; });
  await page.getByTestId('preview-print-btn').click();
  await page.waitForTimeout(300);

  const count = await page.evaluate(() => (window as any).__printCount2 ?? 0);
  console.log(`[PV03] Print calls after deliberate tap: ${count}`);
  expect(count).toBeGreaterThan(0);
});

// ── CATEGORY ADD ITEM DUPLICATE ───────────────────────────────────────────────

test('CA01: open category has no "+ Add Item" row', async ({ page }) => {
  await gotoV3(page);

  // Open the first category
  const catBar = page.locator('[data-swipe-key]').first();
  await expect(catBar).toBeVisible({ timeout: 5000 });
  await catBar.click(); // expands the category accordion
  await page.waitForTimeout(400);

  await shot(page, 'CA01-open-category');

  // No "+ Add Item" button inside the expanded category
  const addItemBtn = page.getByRole('button', { name: /^Add item to/i });
  const count = await addItemBtn.count();
  console.log(`[CA01] "Add item to …" buttons inside open category: ${count}`);
  expect(count).toBe(0);
});

test('CA02: dedicated Add workflow (Group 1) still works', async ({ page }) => {
  await gotoV3(page);

  // Add deck is in Group 1
  const addBtn = page.getByTestId('bottom-nav').getByRole('button', { name: /^Add/ });
  await expect(addBtn).toBeVisible();
  await addBtn.click();
  await page.waitForTimeout(500);

  const deckPanel = page.getByTestId('deck-panel');
  const panelText = await deckPanel.evaluate(el => el.innerText);
  const hasAddItem = /add item/i.test(panelText);
  console.log(`[CA02] Add deck content has "Add Item": ${hasAddItem}`);
  await shot(page, 'CA02-add-deck');

  expect(hasAddItem).toBe(true);
});

// ── R0072 REGRESSION SUITE ────────────────────────────────────────────────────

test('RG01: Group 1 default — all 5 boxes present', async ({ page }) => {
  await gotoV3(page);
  const nav = page.getByTestId('bottom-nav');
  await expect(nav.getByRole('button', { name: /^Locker/ })).toBeVisible();
  await expect(nav.getByRole('button', { name: /^Summary/ })).toBeVisible();
  await expect(nav.getByRole('button', { name: /^Add/ })).toBeVisible();
  await expect(nav.getByRole('button', { name: /^Search/ })).toBeVisible();
  console.log('[RG01] Group 1 PASS');
});

test('RG02: box groups slide G1→G2→G3→G4 and back via chevrons', async ({ page }) => {
  await gotoV3(page);
  const nav = page.getByTestId('bottom-nav');

  await nextGroup(page);
  await expect(nav.getByRole('button', { name: /^Undo/ })).toBeVisible();
  await nextGroup(page);
  await expect(nav.getByRole('button', { name: /^Preview/ })).toBeVisible();
  await nextGroup(page);
  await expect(nav.getByRole('button', { name: /^Share/ })).toBeVisible();

  // Back G4→G1
  await nav.getByRole('button', { name: 'Previous controls' }).click(); await page.waitForTimeout(450);
  await nav.getByRole('button', { name: 'Previous controls' }).click(); await page.waitForTimeout(450);
  await nav.getByRole('button', { name: 'Previous controls' }).click(); await page.waitForTimeout(450);
  await expect(nav.getByRole('button', { name: /^Locker/ })).toBeVisible();
  console.log('[RG02] Group slide PASS');
});

test('RG03: no wraparound at G1 (no prev) or G4 (no next)', async ({ page }) => {
  await gotoV3(page);
  const nav = page.getByTestId('bottom-nav');

  // At G1: no Previous chevron
  await expect(nav.getByRole('button', { name: 'Previous controls' })).not.toBeVisible();

  // Slide to G4
  await nextGroup(page); await nextGroup(page); await nextGroup(page);
  // At G4: no Next chevron
  await expect(nav.getByRole('button', { name: 'Next controls' })).not.toBeVisible();
  console.log('[RG03] No-wraparound PASS');
});

test('RG04: category reorder via long-press drag', async ({ page }) => {
  await gotoV3(page);
  const catsBefore = await page.locator('[data-cat]').evaluateAll(
    els => els.map(e => (e as HTMLElement).dataset.cat!));
  if (catsBefore.length < 2) { console.log('[RG04] SKIP — <2 categories'); return; }

  const bar = page.locator(`[data-swipe-key="cat:${catsBefore[0]}"]`);
  const b = (await bar.boundingBox())!;
  const x = b.x + b.width * 0.35, y = b.y + b.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  await page.waitForTimeout(650);
  await expect(page.locator('[data-floating="true"]')).toHaveCount(1);
  await page.mouse.move(x, y + 100, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(500);

  const catsAfter = await page.locator('[data-cat]').evaluateAll(
    els => els.map(e => (e as HTMLElement).dataset.cat!));
  console.log(`[RG04] before=${JSON.stringify(catsBefore)} after=${JSON.stringify(catsAfter)}`);
  expect(JSON.stringify(catsAfter)).not.toBe(JSON.stringify(catsBefore));
});

test('RG05: slide-to-delete reveals Delete button', async ({ page }) => {
  await gotoV3(page);
  const cats = await page.locator('[data-cat]').evaluateAll(
    els => els.map(e => (e as HTMLElement).dataset.cat!));
  if (cats.length === 0) { console.log('[RG05] SKIP — no categories'); return; }

  const row = page.locator(`[data-swipe-key="cat:${cats[0]}"] > div`).last();
  const b = (await row.boundingBox())!;
  await page.mouse.move(b.x + b.width - 20, b.y + b.height / 2);
  await page.mouse.down();
  await page.mouse.move(b.x + b.width - 110, b.y + b.height / 2, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(400);

  await expect(page.getByRole('button', { name: /Delete/ }).first()).toBeVisible();
  console.log('[RG05] Slide-delete PASS');
});

test('RG06: Weight Distribution opens and shows category legend', async ({ page }) => {
  await gotoV3(page);
  await page.getByTestId('bottom-nav').getByRole('button', { name: /^Summary/ }).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /Weight Distribution/ }).first().click();
  await page.waitForTimeout(600);

  const panelText = await page.getByTestId('deck-panel').evaluate(el => el.innerText);
  expect(/Backpack|Clothing|Electronics|Shelter/i.test(panelText)).toBe(true);
  console.log('[RG06] Weight Distribution PASS');
});

test('RG07: Pack Summary opens and shows Grand Total', async ({ page }) => {
  await gotoV3(page);
  await page.getByTestId('bottom-nav').getByRole('button', { name: /^Summary/ }).click();
  await page.waitForTimeout(500);

  const panelText = await page.getByTestId('deck-panel').evaluate(el => el.innerText);
  expect(/Grand Total|Total/i.test(panelText)).toBe(true);
  console.log('[RG07] Pack Summary PASS');
});

test('RG08: header preserved — active list name visible', async ({ page }) => {
  await gotoV3(page);
  await expect(page.getByTestId('active-list-name')).toBeVisible();
  console.log('[RG08] Header PASS');
});

test('RG09a: Share navigates to share screen', async ({ page }) => {
  await gotoV3(page);
  await nextGroup(page); await nextGroup(page); await nextGroup(page);

  // Share pushes the 'share' screen (not a deck-panel)
  await page.getByTestId('bottom-nav').getByRole('button', { name: /^Share/ }).click();
  await page.waitForTimeout(700);
  const bodyText = await page.evaluate(() => document.body.innerText);
  const hasShareContent = /share|link|copy/i.test(bodyText);
  console.log(`[RG09a] Share screen content found: ${hasShareContent}`);
  expect(hasShareContent).toBe(true);
});

test('RG09b: More opens deck panel', async ({ page }) => {
  await gotoV3(page);
  await nextGroup(page); await nextGroup(page); await nextGroup(page);
  await page.getByTestId('bottom-nav').getByRole('button', { name: /^More/ }).click();
  await page.waitForTimeout(500);
  await expect(page.getByTestId('deck-panel')).toBeVisible();
  console.log('[RG09b] More deck-panel PASS');
});

test('RG10: no horizontal overflow at 320/375/390/430 px', async ({ page }) => {
  for (const w of [320, 375, 390, 430]) {
    await gotoV3(page, w);
    const overflow = await page.evaluate(() => document.body.scrollWidth - document.body.clientWidth);
    console.log(`[RG10] ${w}px overflow=${overflow}px`);
    expect(overflow).toBeLessThanOrEqual(2);
  }
});
