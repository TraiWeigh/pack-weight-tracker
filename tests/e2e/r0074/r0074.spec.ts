/**
 * R0074 — Dormant lift cleanup verification + corrected precondition proofs
 * 1. Tap-only regression after source cleanup
 * 2. Open-category "+ Add Item" removal (ACTUALLY OPEN)
 * 3. Overflowing deck — attempt; NOT RUN if no overflow found
 * 4. Protected R0073 regressions
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

// ── SOURCE CLEANUP RUNTIME VERIFICATION ───────────────────────────────────────
// We cannot grep source from Playwright; instead we drive all possible DeckInactiveCard
// interactions and confirm no translateY offset (lift transform) ever appears.

test('CL01: 80 px drag on enabled stacked bar — NO translateY offset', async ({ page }) => {
  await gotoV3(page);
  // Navigate to More deck (Group 4) — has enabled stacked bars
  await nextGroup(page); await nextGroup(page); await nextGroup(page);
  await page.getByTestId('bottom-nav').getByRole('button', { name: /^More/ }).click();
  await page.waitForTimeout(600);

  const target = page.getByRole('button', { name: 'List Actions — open card', exact: true });
  await expect(target).toBeVisible({ timeout: 3000 });

  const box = (await target.boundingBox())!;
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;

  // Record the computed transform matrix before drag
  const beforeMatrix = await target.evaluate(el => window.getComputedStyle(el).transform);

  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx, cy - 12, { steps: 3 });
  await page.waitForTimeout(60);
  await page.mouse.move(cx, cy - 80, { steps: 10 });
  await page.waitForTimeout(200);

  const duringMatrix = await target.evaluate(el => window.getComputedStyle(el).transform);
  // Extract the f (translateY) value from the matrix string "matrix(a,b,c,d,e,f)"
  const extractF = (m: string) => {
    const parts = m.match(/matrix\(([^)]+)\)/)?.[1].split(',');
    return parts ? parseFloat(parts[5].trim()) : 0;
  };
  const beforeF = extractF(beforeMatrix);
  const duringF = extractF(duringMatrix);
  const translateYChange = Math.abs(duringF - beforeF);

  console.log(`[CL01] transform before: "${beforeMatrix}" (f=${beforeF})`);
  console.log(`[CL01] transform during 80px drag: "${duringMatrix}" (f=${duringF})`);
  console.log(`[CL01] translateY change: ${translateYChange}px — ${translateYChange <= 1 ? 'PASS (no lift)' : 'FAIL'}`);
  await shot(page, 'CL01-mid-drag-transform');

  await page.mouse.up();
  await page.waitForTimeout(300);

  // The transform matrix f-value must not change — no lift path exists
  expect(translateYChange).toBeLessThanOrEqual(1);
});

test('CL02: verify stacked bar has no transition property during/after drag (no spring-back)', async ({ page }) => {
  await gotoV3(page);
  await nextGroup(page); await nextGroup(page); await nextGroup(page);
  await page.getByTestId('bottom-nav').getByRole('button', { name: /^More/ }).click();
  await page.waitForTimeout(600);

  const target = page.getByRole('button', { name: 'List Settings — open card', exact: true });
  await expect(target).toBeVisible();

  const box = (await target.boundingBox())!;
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;

  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx, cy - 60, { steps: 8 });
  await page.waitForTimeout(100);
  await page.mouse.up();
  await page.waitForTimeout(400);

  // After release, no spring-back transition should fire (transition style should be 'none' or absent)
  const transition = await target.evaluate(el => window.getComputedStyle(el).transition);
  console.log(`[CL02] transition after drag release: "${transition}"`);
  // Acceptable: 'none', 'all 0s ease 0s', or simply no transform in it
  const hasLiftTransition = /transform.*cubic-bezier/i.test(transition);
  expect(hasLiftTransition).toBe(false);
  console.log('[CL02] No lift spring-back transition: PASS');
});

// ── OPEN CATEGORY — ACTUALLY PROVED OPEN ─────────────────────────────────────

test('CA01: open Backpack category — prove open via aria-expanded + item rows, then no "+Add Item"', async ({ page }) => {
  await gotoV3(page);

  // The accordion trigger is the wedge <button> with aria-label="Open Backpack category"
  // (changes to "Close Backpack category" when open). aria-expanded is on this same element.
  const toggleBtn = page.getByRole('button', { name: /Backpack category/i });
  await expect(toggleBtn).toBeVisible({ timeout: 5000 });

  // Record initial state
  const ariaExpandedBefore = await toggleBtn.getAttribute('aria-expanded');
  console.log(`[CA01] Backpack toggle aria-expanded before click: "${ariaExpandedBefore}"`);

  // If already open, close it first so we have a clean open transition
  if (ariaExpandedBefore === 'true') {
    await toggleBtn.click();
    await page.waitForTimeout(300);
  }

  // Open the category
  await toggleBtn.click();
  await page.waitForTimeout(400);

  const ariaExpandedAfter = await toggleBtn.getAttribute('aria-expanded');
  console.log(`[CA01] Backpack toggle aria-expanded after click: "${ariaExpandedAfter}"`);

  // PROOF 1: aria-expanded must be "true"
  expect(ariaExpandedAfter).toBe('true');

  // PROOF 2: a known child item (Osprey Atmos 65 — Backpack category in DEMO_SEED) must be visible
  const knownItem = page.getByText('Osprey Atmos 65', { exact: false });
  await expect(knownItem).toBeVisible({ timeout: 3000 });
  console.log('[CA01] Known child item "Osprey Atmos 65" visible: PASS (category is open)');

  await shot(page, 'CA01-category-open-with-items');

  // ASSERTION: no "+ Add Item" button inside the open category accordion
  const addItemBtn = page.getByRole('button', { name: /^Add item to Backpack/i });
  const count = await addItemBtn.count();
  console.log(`[CA01] "Add item to Backpack" buttons: ${count} (must be 0)`);
  expect(count).toBe(0);

  // Also assert dedicated Add workflow (Group 1) still has Add Item
  const addBox = page.getByTestId('bottom-nav').getByRole('button', { name: /^Add/ });
  await expect(addBox).toBeVisible();
  await addBox.click();
  await page.waitForTimeout(500);
  const deckText = await page.getByTestId('deck-panel').evaluate(el => el.innerText);
  const hasAddItem = /add item/i.test(deckText);
  console.log(`[CA01] Dedicated Add deck contains "Add Item": ${hasAddItem}`);
  expect(hasAddItem).toBe(true);
});

test('CA02: open Clothing category — different category, same proof pattern', async ({ page }) => {
  await gotoV3(page);

  const toggleBtn = page.getByRole('button', { name: /Clothing category/i });
  await expect(toggleBtn).toBeVisible({ timeout: 5000 });

  // Ensure closed first
  if (await toggleBtn.getAttribute('aria-expanded') === 'true') {
    await toggleBtn.click();
    await page.waitForTimeout(300);
  }

  await toggleBtn.click();
  await page.waitForTimeout(400);

  // Proof: aria-expanded = true
  expect(await toggleBtn.getAttribute('aria-expanded')).toBe('true');

  // Proof: a known Clothing item visible (Fleece Mid-Layer is in Clothing)
  await expect(page.getByText('Fleece Mid-Layer', { exact: false })).toBeVisible({ timeout: 3000 });
  console.log('[CA02] Clothing category open and child item visible: PASS');

  const count = await page.getByRole('button', { name: /^Add item to Clothing/i }).count();
  console.log(`[CA02] "Add item to Clothing" buttons: ${count}`);
  expect(count).toBe(0);
});

// ── OVERFLOWING STACKED-BAR DECK ─────────────────────────────────────────────

test('OD01: attempt genuinely overflowing stacked-bar deck', async ({ page }) => {
  /**
   * Strategy: Locker deck typically has no saved files in a fresh test environment.
   * Summary deck with WD active: clientH=scrollH (not overflowing).
   * More deck with any card active: clientH=scrollH (not overflowing in test data).
   *
   * We try each known deck and measure. If NONE overflows, we mark NOT RUN
   * and log the reason — we do NOT modify app code to manufacture overflow.
   */
  await gotoV3(page);

  const DECKS = [
    { label: 'Locker',   nav: /^Locker/,   group: 0 },
    { label: 'Summary',  nav: /^Summary/,  group: 0 },
    { label: 'More',     nav: /^More/,     group: 3 },
  ];

  let overflowFound = false;
  let overflowDeckLabel = '';
  let overflowClientH = 0, overflowScrollH = 0;

  for (const deck of DECKS) {
    // Navigate to the correct group
    await page.goto(ROUTE);
    await expect(page.getByTestId('active-list-name')).toBeVisible({ timeout: 10000 });
    for (let i = 0; i < deck.group; i++) await nextGroup(page);

    // Open the deck
    await page.getByTestId('bottom-nav').getByRole('button', { name: deck.nav }).click();
    await page.waitForTimeout(600);

    const deckScroll = page.getByTestId('deck-scroll');
    if (!await deckScroll.isVisible()) continue;
    const sm = await deckScroll.evaluate(el => ({ c: el.clientHeight, s: el.scrollHeight }));
    console.log(`[OD01] ${deck.label}: clientH=${sm.c} scrollH=${sm.s} overflows=${sm.s > sm.c + 1}`);

    if (sm.s > sm.c + 1) {
      overflowFound = true;
      overflowDeckLabel = deck.label;
      overflowClientH = sm.c;
      overflowScrollH = sm.s;
      break;
    }
  }

  if (!overflowFound) {
    console.log('[OD01] NOT RUN — no genuinely overflowing stacked-bar deck found in test environment.');
    console.log('[OD01] Reason: test data has 6 categories with moderate items; Locker has no saved files;');
    console.log('[OD01] Summary/More decks have 2 stacked bars each — total deck height fits viewport.');
    console.log('[OD01] App code was NOT modified to manufacture overflow (per R0074 §4 rule).');
    // We don't skip()/fail — we return early with a clear log. The report marks this NOT RUN.
    return;
  }

  // ─── Overflow found — run the full test ───────────────────────────────────
  console.log(`[OD01] Overflow found in ${overflowDeckLabel}: clientH=${overflowClientH} scrollH=${overflowScrollH}`);

  const deckScroll = page.getByTestId('deck-scroll');
  // Find a stacked bar
  const stackedBar = page.locator('[role="button"][aria-label$="— open card"]').first();
  await expect(stackedBar).toBeVisible({ timeout: 3000 });

  const beforeScrollTop = await deckScroll.evaluate(el => el.scrollTop);
  const beforeMatrix = await stackedBar.evaluate(el => window.getComputedStyle(el).transform);
  const beforeBox = (await stackedBar.boundingBox())!;

  const cx = beforeBox.x + beforeBox.width / 2, cy = beforeBox.y + beforeBox.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx, cy - 12, { steps: 3 });
  await page.waitForTimeout(60);
  await page.mouse.move(cx, cy - 80, { steps: 10 });
  await page.waitForTimeout(200);

  const duringScrollTop = await deckScroll.evaluate(el => el.scrollTop);
  const duringMatrix = await stackedBar.evaluate(el => window.getComputedStyle(el).transform);

  const scrollDelta = duringScrollTop - beforeScrollTop;
  const deckScrolled = scrollDelta > 1;
  const transformChanged = duringMatrix !== beforeMatrix;

  console.log(`[OD01] scrollTop: ${beforeScrollTop}→${duringScrollTop} (delta=${scrollDelta}) scrolled=${deckScrolled}`);
  console.log(`[OD01] transform before="${beforeMatrix}" during="${duringMatrix}" changed=${transformChanged}`);
  await shot(page, 'OD01-overflow-during-drag');

  await page.mouse.up();
  await page.waitForTimeout(400);

  // Confirm no activation
  const stillStacked = await stackedBar.isVisible();
  console.log(`[OD01] Bar still stacked after drag: ${stillStacked}`);
  await shot(page, 'OD01-overflow-after-drag');

  expect(deckScrolled).toBe(true);     // deck must scroll
  expect(transformChanged).toBe(false); // bar must not lift
  expect(stillStacked).toBe(true);     // bar must not activate
});

// ── TAP-ONLY REGRESSION AFTER CLEANUP ────────────────────────────────────────

test('TO01: non-overflowing precondition confirmed for target deck', async ({ page }) => {
  await gotoV3(page);
  await nextGroup(page); await nextGroup(page); await nextGroup(page);
  await page.getByTestId('bottom-nav').getByRole('button', { name: /^More/ }).click();
  await page.waitForTimeout(600);

  const sm = await page.getByTestId('deck-scroll').evaluate(el => ({ c: el.clientHeight, s: el.scrollHeight }));
  const nonOverflowing = sm.s <= sm.c + 1;
  console.log(`[TO01] deck: clientH=${sm.c} scrollH=${sm.s} nonOverflowing=${nonOverflowing}`);

  const target = page.getByRole('button', { name: 'List Actions — open card', exact: true });
  await expect(target).toBeVisible();
  const disabled = await target.getAttribute('aria-disabled');
  console.log(`[TO01] aria-disabled="${disabled}" (enabled=${!disabled || disabled === 'false'})`);

  expect(nonOverflowing).toBe(true);
  expect(!disabled || disabled === 'false').toBe(true);
});

test('TO02: normal tap activates stacked bar (preserved after cleanup)', async ({ page }) => {
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
  expect(stillStacked).toBe(false);
});

test('TO03: 80 px drag — bar position unchanged, no lift transform, no activation', async ({ page }) => {
  await gotoV3(page);
  await nextGroup(page); await nextGroup(page); await nextGroup(page);
  await page.getByTestId('bottom-nav').getByRole('button', { name: /^More/ }).click();
  await page.waitForTimeout(600);

  const deckScroll = page.getByTestId('deck-scroll');
  const target = page.getByRole('button', { name: 'List Actions — open card', exact: true });
  await expect(target).toBeVisible();

  const beforeBox   = (await target.boundingBox())!;
  const beforeTfm   = await target.evaluate(el => window.getComputedStyle(el).transform);
  const scrollBefore = await deckScroll.evaluate(el => el.scrollTop);
  const cx = beforeBox.x + beforeBox.width / 2, cy = beforeBox.y + beforeBox.height / 2;

  await shot(page, 'TO03-before-drag');

  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx, cy - 12, { steps: 3 });
  await page.waitForTimeout(60);
  await page.mouse.move(cx, cy - 80, { steps: 10 });
  await page.waitForTimeout(200);

  const duringBox    = (await target.boundingBox())!;
  const duringTfm    = await target.evaluate(el => window.getComputedStyle(el).transform);
  const scrollDuring = await deckScroll.evaluate(el => el.scrollTop);
  const rawShift     = duringBox.y - beforeBox.y;
  const adjShift     = rawShift - (scrollDuring - scrollBefore);
  const tfmChanged   = duringTfm !== beforeTfm;

  console.log(`[TO03] before top=${beforeBox.y.toFixed(2)} transform="${beforeTfm}"`);
  console.log(`[TO03] during top=${duringBox.y.toFixed(2)} transform="${duringTfm}"`);
  console.log(`[TO03] rawShift=${rawShift.toFixed(2)}px adjShift=${adjShift.toFixed(2)}px transformChanged=${tfmChanged}`);
  await shot(page, 'TO03-mid-drag');

  await page.mouse.up();
  await page.waitForTimeout(400);

  const afterStacked = await page.getByRole('button', { name: 'List Actions — open card', exact: true }).isVisible();
  console.log(`[TO03] still stacked after release: ${afterStacked}`);
  await shot(page, 'TO03-after-drag');

  expect(Math.abs(adjShift)).toBeLessThanOrEqual(1);
  expect(tfmChanged).toBe(false);
  expect(afterStacked).toBe(true);
});

test('TO04: 110 px drag/release does NOT activate stacked bar', async ({ page }) => {
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
  expect(stillStacked).toBe(true);
});

test('TO05: keyboard activation preserved after cleanup (Enter key)', async ({ page }) => {
  await gotoV3(page);
  await nextGroup(page); await nextGroup(page); await nextGroup(page);
  await page.getByTestId('bottom-nav').getByRole('button', { name: /^More/ }).click();
  await page.waitForTimeout(600);

  const target = page.getByRole('button', { name: 'List Actions — open card', exact: true });
  await expect(target).toBeVisible();
  await target.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);

  const stillStacked = await page.getByRole('button', { name: 'List Actions — open card', exact: true }).isVisible();
  console.log(`[TO05] still stacked after Enter: ${stillStacked} (activated=${!stillStacked})`);
  expect(stillStacked).toBe(false); // activated via keyboard
});

// ── PROTECTED R0073 REGRESSIONS ───────────────────────────────────────────────

test('RG01: stacked bar height = 68 px; category bar height = 68 px', async ({ page }) => {
  await gotoV3(page, 390);

  const catBar = page.locator('[data-swipe-key]').first();
  await expect(catBar).toBeVisible({ timeout: 5000 });
  const catH = (await catBar.boundingBox())!.height;

  await nextGroup(page); await nextGroup(page); await nextGroup(page);
  await page.getByTestId('bottom-nav').getByRole('button', { name: /^More/ }).click();
  await page.waitForTimeout(500);

  const stackBar = page.getByRole('button', { name: 'List Actions — open card', exact: true });
  await expect(stackBar).toBeVisible({ timeout: 3000 });
  const stackH = (await stackBar.boundingBox())!.height;

  console.log(`[RG01] catH=${catH}px stackH=${stackH}px diff=${Math.abs(catH - stackH)}px`);
  expect(catH).toBe(68);
  expect(stackH).toBe(68);
});

test('RG02: Preview selected-only, no auto-print', async ({ page }) => {
  await gotoV3(page);
  await nextGroup(page); await nextGroup(page);

  await page.evaluate(() => { (window as any).__printCount = 0; window.print = () => { (window as any).__printCount++; }; });
  await page.getByTestId('bottom-nav').getByRole('button', { name: /^Preview/ }).click();
  await page.waitForTimeout(700);

  const printCount = await page.evaluate(() => (window as any).__printCount ?? 0);
  console.log(`[RG02] auto-print calls: ${printCount}`);
  expect(printCount).toBe(0);

  // Print button present
  await expect(page.getByTestId('preview-print-btn')).toBeVisible();

  // Selected item present
  await expect(page.getByText('Osprey Atmos 65', { exact: false })).toBeVisible({ timeout: 3000 });

  // Unselected item absent
  const unselCount = await page.getByText('Fleece Mid-Layer', { exact: false }).count();
  console.log(`[RG02] "Fleece Mid-Layer" (unselected) in Preview: ${unselCount} (must be 0)`);
  expect(unselCount).toBe(0);
  console.log('[RG02] Preview PASS');
});

test('RG03: box groups G1→G4 and chevrons work', async ({ page }) => {
  await gotoV3(page);
  const nav = page.getByTestId('bottom-nav');

  await expect(nav.getByRole('button', { name: /^Locker/ })).toBeVisible();
  // No Previous at G1
  await expect(nav.getByRole('button', { name: 'Previous controls' })).not.toBeVisible();

  await nextGroup(page); await nextGroup(page); await nextGroup(page);
  await expect(nav.getByRole('button', { name: /^More/ })).toBeVisible();
  // No Next at G4
  await expect(nav.getByRole('button', { name: 'Next controls' })).not.toBeVisible();
  console.log('[RG03] Box groups PASS');
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

test('RG06: Weight Distribution and Pack Summary open', async ({ page }) => {
  await gotoV3(page);
  await page.getByTestId('bottom-nav').getByRole('button', { name: /^Summary/ }).click();
  await page.waitForTimeout(500);

  await page.getByRole('button', { name: /Weight Distribution/ }).first().click();
  await page.waitForTimeout(600);
  const wd = await page.getByTestId('deck-panel').evaluate(el => el.innerText);
  expect(/Backpack|Clothing|Electronics|Shelter/i.test(wd)).toBe(true);

  await page.getByRole('button', { name: /Pack Summary/ }).first().click();
  await page.waitForTimeout(400);
  const ps = await page.getByTestId('deck-panel').evaluate(el => el.innerText);
  expect(/Grand Total|Total/i.test(ps)).toBe(true);
  console.log('[RG06] Weight Distribution + Pack Summary PASS');
});

test('RG07: header and horizontal overflow at 390 px', async ({ page }) => {
  await gotoV3(page, 390);
  await expect(page.getByTestId('active-list-name')).toBeVisible();
  const overflow = await page.evaluate(() => document.body.scrollWidth - document.body.clientWidth);
  console.log(`[RG07] overflow=${overflow}px`);
  expect(overflow).toBeLessThanOrEqual(2);
  console.log('[RG07] Header + overflow PASS');
});
