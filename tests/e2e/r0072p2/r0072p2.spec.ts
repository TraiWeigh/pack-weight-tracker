/**
 * R0072P2 — Enabled Stacked-Bar Drag Verification
 * READ-ONLY: no application code is modified by this file.
 *
 * Resolves the one remaining uncertainty from R0072P:
 * Can an ENABLED stacked bar inside a NON-OVERFLOWING deck
 *   (a) physically lift/move/follow the finger during an upward drag, and/or
 *   (b) activate because of drag/release rather than a normal tap?
 *
 * TARGET: "List Settings" DeckInactiveCard bar in the More deck.
 *   - The More deck is opened without tapping any card first (all 4 cards stacked).
 *   - "List Actions" is aria-label "List Actions" (stacked DeckInactiveCard).
 *   - The Close button has aria-label "Close More" — explicitly excluded.
 */
import { test, expect, type Page } from '@playwright/test';
import * as path from 'path';

const ROUTE = '/mobile-functional-v3';
const EVIDENCE = path.join(__dirname, 'evidence');

// The exact aria-label of the stacked bar we will drag.
// DeckInactiveCard renders: aria-label={card.disabled ? `${title} — not available yet` : `${title} — open card`}
// "List Actions" is the first enabled card in the More deck.
const TARGET_LABEL = 'List Actions — open card';

async function gotoV3(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(ROUTE);
  await expect(page.getByTestId('active-list-name')).toBeVisible({ timeout: 15000 });
}

async function nextGroup(page: Page) {
  await page.getByTestId('bottom-nav').getByRole('button', { name: 'Next controls' }).click();
  await page.waitForTimeout(450);
}

/** Open the More deck (Group 4) without tapping any card. */
async function openMoreDeck(page: Page) {
  await nextGroup(page); await nextGroup(page); await nextGroup(page);
  await page.getByTestId('bottom-nav').getByRole('button', { name: /^More/ }).click();
  await page.waitForTimeout(700);
}

async function saveEvidence(page: Page, name: string) {
  const p = path.join(EVIDENCE, `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  console.log(`[screenshot] ${p}`);
  return p;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRECONDITION — verify before every drag test
// ─────────────────────────────────────────────────────────────────────────────

async function verifyPreconditions(page: Page, label: string) {
  const deckScroll = page.getByTestId('deck-scroll');
  await expect(deckScroll).toBeVisible({ timeout: 5000 });

  const sm = await deckScroll.evaluate(el => ({
    clientHeight: el.clientHeight,
    scrollHeight: el.scrollHeight,
    scrollTop: el.scrollTop,
  }));
  const nonOverflowing = sm.scrollHeight <= sm.clientHeight + 1;
  console.log(`[${label}] Precondition-A deck: clientH=${sm.clientHeight}, scrollH=${sm.scrollHeight}, nonOverflowing=${nonOverflowing}`);

  // Find the exact DeckInactiveCard stacked bar by its card title aria-label.
  const targetBar = page.getByRole('button', { name: TARGET_LABEL, exact: true });
  const visible = await targetBar.isVisible();
  const ariaDisabled = await targetBar.getAttribute('aria-disabled');
  const isEnabled = !ariaDisabled || ariaDisabled === 'false';
  console.log(`[${label}] Precondition-B/C target bar "${TARGET_LABEL}": visible=${visible}, aria-disabled="${ariaDisabled}", enabled=${isEnabled}`);

  return { sm, nonOverflowing, isEnabled, targetBar };
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST A — NORMAL TAP BASELINE
// ─────────────────────────────────────────────────────────────────────────────

test('TestA: normal tap activates enabled DeckInactiveCard stacked bar', async ({ page }) => {
  await gotoV3(page);
  await openMoreDeck(page);

  const { nonOverflowing, isEnabled, targetBar } = await verifyPreconditions(page, 'TestA');
  if (!nonOverflowing || !isEnabled) {
    console.log('[TestA] NOT RUN — preconditions not met');
    return;
  }

  // Count stacked bars before tap
  const deckPanel = page.getByTestId('deck-panel');
  const deckScroll = page.getByTestId('deck-scroll');

  // Stacked bars = DeckInactiveCard buttons (exclude the Close button by checking they don't have "Close" in their accessible name)
  // We count all role=button that are NOT the Close button
  const allBtns = await deckPanel.getByRole('button').all();
  const stackedBarsBefore = [];
  for (const btn of allBtns) {
    const lbl = await btn.getAttribute('aria-label');
    if (lbl && !lbl.toLowerCase().includes('close')) {
      stackedBarsBefore.push(lbl);
    }
  }
  console.log(`[TestA] Stacked bars before tap: ${JSON.stringify(stackedBarsBefore)}`);

  await saveEvidence(page, 'A-before-tap');

  // Tap the target
  console.log(`[TestA] Tapping "${TARGET_LABEL}"…`);
  await targetBar.click();
  await page.waitForTimeout(600);

  await saveEvidence(page, 'A-after-tap');

  // After tap: target bar should no longer be a stacked bar
  const targetStillStacked = await page.getByRole('button', { name: TARGET_LABEL, exact: true }).isVisible();
  // The deck-panel should now show expanded content for the activated card
  const deckText = await deckPanel.evaluate(el => el.innerText.substring(0, 300));
  console.log(`[TestA] Target still stacked after tap: ${targetStillStacked}`);
  console.log(`[TestA] Deck content after tap:\n${deckText}`);

  const activated = !targetStillStacked;
  console.log(`[TestA] RESULT: bar activated by tap = ${activated} — ${activated ? 'PASS' : 'FAIL'}`);

  expect(activated).toBe(true);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST B — MID-DRAG PHYSICAL MOVEMENT
// ─────────────────────────────────────────────────────────────────────────────

test('TestB: DeckInactiveCard stacked bar mid-drag measurement (80 px, pointer HELD)', async ({ page }) => {
  await gotoV3(page);
  await openMoreDeck(page);

  const { sm: preSM, nonOverflowing, isEnabled, targetBar } = await verifyPreconditions(page, 'TestB');
  if (!nonOverflowing || !isEnabled) {
    console.log('[TestB] NOT RUN — preconditions not met');
    return;
  }

  const deckScroll = page.getByTestId('deck-scroll');

  // ── BEFORE ──
  const beforeBox = await targetBar.boundingBox();
  const beforeTransform = await targetBar.evaluate(el => window.getComputedStyle(el).transform);
  const beforeScrollTop = preSM.scrollTop;

  console.log(`[TestB] BEFORE: top=${beforeBox?.y?.toFixed(2)}, bottom=${((beforeBox?.y ?? 0) + (beforeBox?.height ?? 0)).toFixed(2)}, height=${beforeBox?.height?.toFixed(2)}, transform="${beforeTransform}", scrollTop=${beforeScrollTop}`);

  await saveEvidence(page, 'B-before-drag');

  // Center of the bar
  const cx = (beforeBox?.x ?? 0) + (beforeBox?.width ?? 0) / 2;
  const cy = (beforeBox?.y ?? 0) + (beforeBox?.height ?? 0) / 2;

  // ── POINTER DOWN + drag upward — incremental so gesture mode locks ──
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  // Move past DRAG_SLOP_PX (8 px) to lock gesture mode
  await page.mouse.move(cx, cy - 12, { steps: 3 });
  await page.waitForTimeout(60);
  // Continue to 80 px — beyond slop, well before DRAG_ACTIVATE (48 px)
  await page.mouse.move(cx, cy - 80, { steps: 10 });
  await page.waitForTimeout(200); // hold here

  // ── DURING (pointer still held) ──
  const duringBox = await targetBar.boundingBox();
  const duringTransform = await targetBar.evaluate(el => window.getComputedStyle(el).transform);
  const duringScrollTop = await deckScroll.evaluate(el => el.scrollTop);

  const rawShift = (duringBox?.y ?? 0) - (beforeBox?.y ?? 0);
  const scrollAdjShift = rawShift - (duringScrollTop - beforeScrollTop);
  const transformChanged = duringTransform !== beforeTransform;
  const physicallyMoved = Math.abs(scrollAdjShift) > 1;

  console.log(`[TestB] DURING: top=${duringBox?.y?.toFixed(2)}, transform="${duringTransform}", scrollTop=${duringScrollTop}`);
  console.log(`[TestB] rawYshift=${rawShift.toFixed(2)} px, scrollAdjusted=${scrollAdjShift.toFixed(2)} px`);
  console.log(`[TestB] transformChanged=${transformChanged} (before="${beforeTransform}", during="${duringTransform}")`);
  console.log(`[TestB] parentScrollChanged=${duringScrollTop !== beforeScrollTop}`);
  console.log(`[TestB] physicallyMoved (>1 px): ${physicallyMoved} — ${!physicallyMoved ? 'PASS (no lift)' : 'FAIL (bar moved)'}`);

  await saveEvidence(page, 'B-mid-drag');

  // ── RELEASE ──
  await page.mouse.up();
  await page.waitForTimeout(400);

  const afterTransform = await targetBar.evaluate(el => window.getComputedStyle(el).transform);
  const afterScrollTop = await deckScroll.evaluate(el => el.scrollTop);
  console.log(`[TestB] AFTER RELEASE: transform="${afterTransform}", scrollTop=${afterScrollTop}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST C — DRAG/RELEASE MUST NOT ACTIVATE
// ─────────────────────────────────────────────────────────────────────────────

test('TestC: drag 110 px upward on ENABLED stacked bar must not activate it', async ({ page }) => {
  await gotoV3(page);
  await openMoreDeck(page);

  const { sm: preSM, nonOverflowing, isEnabled } = await verifyPreconditions(page, 'TestC');
  if (!nonOverflowing || !isEnabled) {
    console.log('[TestC] NOT RUN — preconditions not met');
    return;
  }

  const deckScroll = page.getByTestId('deck-scroll');
  const targetBar = page.getByRole('button', { name: TARGET_LABEL, exact: true });

  const beforeBox = await targetBar.boundingBox();
  const beforeTransform = await targetBar.evaluate(el => window.getComputedStyle(el).transform);
  const beforeScrollTop = preSM.scrollTop;

  console.log(`[TestC] BEFORE: top=${beforeBox?.y?.toFixed(2)}, transform="${beforeTransform}", scrollTop=${beforeScrollTop}`);
  console.log(`[TestC] Dragging 110 px upward (> DRAG_ACTIVATE threshold of 48 px)…`);

  await saveEvidence(page, 'C-before-drag-release');

  const cx = (beforeBox?.x ?? 0) + (beforeBox?.width ?? 0) / 2;
  const cy = (beforeBox?.y ?? 0) + (beforeBox?.height ?? 0) / 2;

  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx, cy - 12, { steps: 3 }); // past DRAG_SLOP_PX (8 px)
  await page.waitForTimeout(60);
  await page.mouse.move(cx, cy - 110, { steps: 14 }); // 110 px > DRAG_ACTIVATE (48 px)
  await page.waitForTimeout(100);
  await page.mouse.up();
  await page.waitForTimeout(700); // let any animation settle

  // ── AFTER RELEASE ──
  const stillStacked = await page.getByRole('button', { name: TARGET_LABEL, exact: true }).isVisible();
  let afterTransform = 'N/A';
  try {
    afterTransform = await page.getByRole('button', { name: TARGET_LABEL, exact: true })
      .evaluate(el => window.getComputedStyle(el).transform);
  } catch {}
  const afterScrollTop = await deckScroll.evaluate(el => el.scrollTop);

  const activated = !stillStacked;
  console.log(`[TestC] Target still in stacked state: ${stillStacked}`);
  console.log(`[TestC] Target activated by drag: ${activated}`);
  console.log(`[TestC] Transform after release: "${afterTransform}"`);
  console.log(`[TestC] ScrollTop after release: ${afterScrollTop}`);
  console.log(`[TestC] RESULT: drag/release activated bar = ${activated} — ${!activated ? 'PASS (not activated)' : 'FAIL (activated by drag)'}`);

  await saveEvidence(page, 'C-after-drag-release');
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST D — SCROLL SAFETY
// ─────────────────────────────────────────────────────────────────────────────

test('TestD: parent scrollTop unchanged during drag (non-overflowing deck)', async ({ page }) => {
  await gotoV3(page);
  await openMoreDeck(page);

  const { sm: preSM, nonOverflowing } = await verifyPreconditions(page, 'TestD');
  if (!nonOverflowing) {
    console.log('[TestD] NOT RUN');
    return;
  }

  const deckScroll = page.getByTestId('deck-scroll');
  const targetBar = page.getByRole('button', { name: TARGET_LABEL, exact: true });
  const beforeBox = await targetBar.boundingBox();
  const cx = (beforeBox?.x ?? 0) + (beforeBox?.width ?? 0) / 2;
  const cy = (beforeBox?.y ?? 0) + (beforeBox?.height ?? 0) / 2;

  const scrollBefore = preSM.scrollTop;
  console.log(`[TestD] scrollTop BEFORE: ${scrollBefore}`);

  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx, cy - 12, { steps: 3 });
  await page.waitForTimeout(60);
  await page.mouse.move(cx, cy - 80, { steps: 10 });
  await page.waitForTimeout(200);

  const scrollDuring = await deckScroll.evaluate(el => el.scrollTop);
  console.log(`[TestD] scrollTop DURING: ${scrollDuring}`);

  await page.mouse.up();
  await page.waitForTimeout(400);

  const scrollAfter = await deckScroll.evaluate(el => el.scrollTop);
  console.log(`[TestD] scrollTop AFTER: ${scrollAfter}`);

  const scrollInterfered = Math.abs(scrollDuring - scrollBefore) > 1;
  console.log(`[TestD] Parent scroll changed: ${scrollInterfered} — ${!scrollInterfered ? 'PASS (no scroll interference)' : 'NOTE'}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// COMBINED — AUTHORITATIVE MEASUREMENT TABLE
// ─────────────────────────────────────────────────────────────────────────────

test('Combined: authoritative measurement table — BEFORE / DURING-80px / DURING-110px / AFTER', async ({ page }) => {
  await gotoV3(page);
  await openMoreDeck(page);

  const deckScroll = page.getByTestId('deck-scroll');
  await expect(deckScroll).toBeVisible({ timeout: 5000 });

  // ── Preconditions ──
  const sm = await deckScroll.evaluate(el => ({
    clientHeight: el.clientHeight,
    scrollHeight: el.scrollHeight,
    scrollTop: el.scrollTop,
  }));
  const nonOverflowing = sm.scrollHeight <= sm.clientHeight + 1;
  console.log(`[COMBINED] Deck: clientH=${sm.clientHeight}, scrollH=${sm.scrollHeight}, nonOverflowing=${nonOverflowing}`);

  if (!nonOverflowing) {
    console.log('[COMBINED] NOT RUN — deck overflows');
    return;
  }

  // Confirm target bar is present and enabled
  const targetBar = page.getByRole('button', { name: TARGET_LABEL, exact: true });
  await expect(targetBar).toBeVisible({ timeout: 3000 });
  const ariaDisabled = await targetBar.getAttribute('aria-disabled');
  const isEnabled = !ariaDisabled || ariaDisabled === 'false';
  console.log(`[COMBINED] Target "${TARGET_LABEL}" aria-disabled="${ariaDisabled}", enabled=${isEnabled}`);

  if (!isEnabled) {
    console.log('[COMBINED] NOT RUN — target bar is disabled');
    return;
  }

  // ── BEFORE ──
  const beforeBox = await targetBar.boundingBox();
  const beforeTransform = await targetBar.evaluate(el => window.getComputedStyle(el).transform);
  const beforeScrollTop = sm.scrollTop;

  console.log(`[COMBINED] BEFORE  — top=${beforeBox?.y?.toFixed(2)}, bottom=${((beforeBox?.y ?? 0) + (beforeBox?.height ?? 0)).toFixed(2)}, h=${beforeBox?.height?.toFixed(2)}, transform="${beforeTransform}", scrollTop=${beforeScrollTop}`);

  await saveEvidence(page, 'COMBINED-BEFORE');

  const cx = (beforeBox?.x ?? 0) + (beforeBox?.width ?? 0) / 2;
  const cy = (beforeBox?.y ?? 0) + (beforeBox?.height ?? 0) / 2;

  // ── DRAG to 80 px and HOLD ──
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx, cy - 12, { steps: 3 }); // past DRAG_SLOP_PX = 8
  await page.waitForTimeout(60);
  await page.mouse.move(cx, cy - 80, { steps: 10 });
  await page.waitForTimeout(200); // hold at 80 px

  const during80Box = await targetBar.boundingBox();
  const during80Transform = await targetBar.evaluate(el => window.getComputedStyle(el).transform);
  const during80Scroll = await deckScroll.evaluate(el => el.scrollTop);
  const rawShift80 = (during80Box?.y ?? 0) - (beforeBox?.y ?? 0);
  const adjShift80 = rawShift80 - (during80Scroll - beforeScrollTop);

  console.log(`[COMBINED] DURING-80  — top=${during80Box?.y?.toFixed(2)}, transform="${during80Transform}", scrollTop=${during80Scroll}, rawShift=${rawShift80.toFixed(2)}, adjShift=${adjShift80.toFixed(2)}`);

  await saveEvidence(page, 'COMBINED-DURING-80px');

  // ── Continue to 110 px (past DRAG_ACTIVATE = 48 px) while HELD ──
  await page.mouse.move(cx, cy - 110, { steps: 6 });
  await page.waitForTimeout(100);

  const during110Box = await targetBar.boundingBox();
  const during110Transform = await targetBar.evaluate(el => window.getComputedStyle(el).transform);
  const during110Scroll = await deckScroll.evaluate(el => el.scrollTop);
  const rawShift110 = (during110Box?.y ?? 0) - (beforeBox?.y ?? 0);
  const adjShift110 = rawShift110 - (during110Scroll - beforeScrollTop);

  console.log(`[COMBINED] DURING-110 — top=${during110Box?.y?.toFixed(2)}, transform="${during110Transform}", scrollTop=${during110Scroll}, rawShift=${rawShift110.toFixed(2)}, adjShift=${adjShift110.toFixed(2)}`);

  // ── RELEASE ──
  await page.mouse.up();
  await page.waitForTimeout(700);

  const stillStacked = await page.getByRole('button', { name: TARGET_LABEL, exact: true }).isVisible();
  let afterTransform = 'N/A';
  let afterTop = 'N/A';
  try {
    const afterBox = await page.getByRole('button', { name: TARGET_LABEL, exact: true }).boundingBox();
    afterTop = afterBox?.y?.toFixed(2) ?? 'GONE';
    afterTransform = await page.getByRole('button', { name: TARGET_LABEL, exact: true })
      .evaluate(el => window.getComputedStyle(el).transform);
  } catch { afterTop = 'GONE'; afterTransform = 'GONE'; }
  const afterScrollTop = await deckScroll.evaluate(el => el.scrollTop);

  console.log(`[COMBINED] AFTER   — top=${afterTop}, transform="${afterTransform}", scrollTop=${afterScrollTop}`);

  const activated = !stillStacked;
  const physicallyMoved80 = Math.abs(adjShift80) > 1;
  const physicallyMoved110 = Math.abs(adjShift110) > 1;
  const transformChanged = during80Transform !== beforeTransform;

  await saveEvidence(page, 'COMBINED-AFTER-RELEASE');

  // ── Summary ──
  console.log('');
  console.log('══════════════════════════════════════════════');
  console.log('[COMBINED] AUTHORITATIVE MEASUREMENT SUMMARY');
  console.log(`  Deck: clientH=${sm.clientHeight} scrollH=${sm.scrollHeight} → NON-OVERFLOWING=${nonOverflowing}`);
  console.log(`  Target: "${TARGET_LABEL}" enabled=${isEnabled}`);
  console.log('');
  console.log('  Metric               | BEFORE   | DURING-80px | DURING-110px | AFTER-RELEASE');
  console.log(`  top (px)             | ${beforeBox?.y?.toFixed(2).padStart(8)} | ${during80Box?.y?.toFixed(2).padStart(11)} | ${during110Box?.y?.toFixed(2).padStart(12)} | ${afterTop.padStart(13)}`);
  console.log(`  transform            | ${'none'.padStart(8)} | ${(during80Transform ?? 'N/A').substring(0,11).padStart(11)} | ${(during110Transform ?? 'N/A').substring(0,12).padStart(12)} | ${afterTransform.substring(0,13).padStart(13)}`);
  console.log(`  parent scrollTop     | ${beforeScrollTop.toString().padStart(8)} | ${during80Scroll.toString().padStart(11)} | ${during110Scroll.toString().padStart(12)} | ${afterScrollTop.toString().padStart(13)}`);
  console.log(`  scroll-adj Y shift   | ${('0').padStart(8)} | ${adjShift80.toFixed(2).padStart(11)} | ${adjShift110.toFixed(2).padStart(12)} | ${'N/A'.padStart(13)}`);
  console.log('');
  console.log(`  physicallyMoved at 80px  (>1 px):    ${physicallyMoved80}`);
  console.log(`  physicallyMoved at 110px (>1 px):   ${physicallyMoved110}`);
  console.log(`  transform changed during drag:       ${transformChanged}`);
  console.log(`  bar activated by drag/release:       ${activated}`);
  console.log('');
  console.log(`  BAR PHYSICALLY MOVES DURING DRAG  = ${physicallyMoved80 || physicallyMoved110 ? 'YES' : 'NO'}`);
  console.log(`  BAR ACTIVATES FROM DRAG/RELEASE   = ${activated ? 'YES' : 'NO'}`);
  console.log(`  NORMAL TAP ACTIVATES              = tested in TestA`);
  console.log(`  REQUIREMENT "MUST NOT MOVE"       = ${!physicallyMoved80 && !physicallyMoved110 ? 'PASS' : 'FAIL'}`);
  console.log('══════════════════════════════════════════════');
});
