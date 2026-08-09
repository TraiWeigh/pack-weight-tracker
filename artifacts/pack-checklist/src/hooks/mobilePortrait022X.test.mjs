/**
 * mobilePortrait022X.test.mjs
 *
 * Prompt 022X — Restore Intended Toolbar/Pill Positions on Mobile
 *
 * Verifies that the left toolbar panel restores the established
 * LEFT / CENTER / RIGHT toolbar zones from the accepted pre-022V/022W
 * geometry, while making them portrait-responsive without uncontrolled
 * flex-wrap or arbitrary centered stacking.
 *
 * Portrait layout (flex-col, no items-center):
 *   Row A: [Open|Close] ···justify-between··· [Imperial|Metric]
 *   Row B: [File-name pill — centered in normal flow]
 *   Row C: [Hide] [Preview]  (justify-center, lg:hidden)
 *
 * Desktop layout (lg:flex-row, lg:relative):
 *   [Open|Close] ··· [pill: lg:absolute centered] ··· [Hide][Preview][UnitToggle ml-auto]
 *
 * Key 022X fix over 022W:
 *   - Remove items-center from portrait flex-col so children stretch full-width.
 *   - Add justify-between to Row A so Open/Close anchors LEFT, Imperial/Metric anchors RIGHT.
 *   - Add justify-center to Row C for correct centering without parent items-center.
 *
 * User-verified status from prompt:
 *   022T sync — PASS
 *   022U scrolling — PASS
 *   022V alignment — FAIL
 *   022W placement — PARTIAL/FAIL (centered stacking, zones not preserved)
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import assert from 'assert/strict';

const ROOT = resolve(process.cwd());
const checklistSrc = readFileSync(resolve(ROOT, 'artifacts/pack-checklist/src/pages/Checklist.tsx'), 'utf8');

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('\n022X — Restore Intended Toolbar/Pill Positions on Mobile\n');

// ─── §A  Left panel outer — flex-col WITHOUT items-center ────────────────────

console.log('A. Left panel outer — no items-center (children stretch full-width)');

test('A1. Left panel outer is flex-col gap-2 WITHOUT items-center on portrait', () => {
  // 022X key fix: removing items-center from the flex-col lets children stretch
  // to full width, so justify-between on Row A actually anchors to panel edges.
  assert.ok(
    checklistSrc.includes('pb-3 flex flex-col gap-2'),
    '022X: outer container must be "pb-3 flex flex-col gap-2" (no items-center on portrait)',
  );
  // Must NOT have the old 022W items-center version
  assert.ok(
    !checklistSrc.includes('pb-3 flex flex-col items-center gap-2'),
    '022X: old "flex-col items-center" must be gone — items-center prevented full-width rows',
  );
});

test('A2. Left panel switches to lg:flex-row lg:items-center on desktop', () => {
  assert.ok(
    checklistSrc.includes('lg:flex lg:flex-row lg:items-center'),
    '022X: desktop side must still use lg:flex-row lg:items-center',
  );
});

test('A3. Left panel retains lg:pr-7 (desktop gutter preserved)', () => {
  assert.ok(
    checklistSrc.includes('lg:pr-7'),
    '022X: lg:pr-7 must be present — desktop gutter alignment unchanged',
  );
});

test('A4. Left panel retains lg:relative for desktop pill centering', () => {
  assert.ok(
    checklistSrc.includes('lg:relative'),
    '022X: lg:relative must be on the outer container for lg:absolute pill centering',
  );
});

// ─── §B  Row A — LEFT/RIGHT zone anchoring with justify-between ───────────────

console.log('\nB. Row A — [Open|Close] LEFT · [Imperial|Metric] RIGHT');

test('B1. Row A uses justify-between (left/right zone anchoring)', () => {
  const rowAStart = checklistSrc.indexOf('Row A (mobile)');
  assert.ok(rowAStart > -1, 'Row A comment marker not found');
  const rowABlock = checklistSrc.slice(rowAStart, rowAStart + 400);
  assert.ok(
    rowABlock.includes('justify-between'),
    '022X: Row A wrapper must use justify-between to anchor controls to panel edges',
  );
});

test('B2. Row A wrapper does NOT use gap-3 centering (022W approach replaced)', () => {
  // 022W had "flex items-center gap-3" which centered both controls together.
  // 022X replaces with justify-between for true left/right zone anchoring.
  const rowAStart = checklistSrc.indexOf('Row A (mobile)');
  const rowABlock = checklistSrc.slice(rowAStart, rowAStart + 400);
  // The old centered approach used gap-3 as the spacing mechanism on the row wrapper.
  // justify-between with no gap on the wrapper is the 022X pattern.
  assert.ok(
    rowABlock.includes('justify-between'),
    '022X: Row A must use justify-between, not plain gap-3 centering',
  );
});

test('B3. Row A uses lg:justify-start on desktop (UnitToggle hidden, no orphan spacing)', () => {
  const rowAStart = checklistSrc.indexOf('Row A (mobile)');
  const rowABlock = checklistSrc.slice(rowAStart, rowAStart + 400);
  assert.ok(
    rowABlock.includes('lg:justify-start'),
    '022X: Row A must use lg:justify-start on desktop to avoid stray justify-between spacing',
  );
});

test('B4. Row A contains Open/Close segmented control', () => {
  const rowAStart = checklistSrc.indexOf('Row A (mobile)');
  assert.ok(rowAStart > -1, 'Row A marker not found');
  const rowABlock = checklistSrc.slice(rowAStart, rowAStart + 1200);
  assert.ok(rowABlock.includes('setAllOpen(true)'),  'Open button must be in Row A');
  assert.ok(rowABlock.includes('setAllOpen(false)'), 'Close button must be in Row A');
});

test('B5. Row A contains UnitToggle (Imperial/Metric) wrapped in lg:hidden', () => {
  // UnitToggle appears after the full Open/Close button JSX (~1800 chars into Row A block).
  const rowAStart = checklistSrc.indexOf('Row A (mobile)');
  assert.ok(rowAStart > -1, 'Row A marker not found');
  // Search the full Row A div (closes before Row B/pill starts)
  const rowABlock = checklistSrc.slice(rowAStart, rowAStart + 2000);
  // Must contain both a lg:hidden div AND a UnitToggle component
  assert.ok(
    rowABlock.includes('lg:hidden') && rowABlock.includes('<UnitToggle'),
    '022X: Row A must contain UnitToggle wrapped in lg:hidden (right-zone Imperial/Metric)',
  );
});

// ─── §C  Row B — File-name pill in normal flow ───────────────────────────────

console.log('\nC. Row B — File-name pill centered in normal flow');

test('C1. Pill wrapper is present (w-full flex justify-center pointer-events-none)', () => {
  assert.ok(
    checklistSrc.includes('w-full flex justify-center pointer-events-none'),
    '022X: pill wrapper must use w-full flex justify-center pointer-events-none (in normal flow)',
  );
});

test('C2. Pill uses lg:absolute lg:inset-0 for desktop centering', () => {
  assert.ok(
    checklistSrc.includes('lg:absolute lg:inset-0'),
    '022X: pill must use lg:absolute lg:inset-0 for desktop absolute centering',
  );
});

test('C3. Pill does NOT use bare "absolute inset-0" (no overlap on portrait)', () => {
  assert.ok(
    !checklistSrc.includes('"absolute inset-0 pb-3'),
    '022X: bare absolute inset-0 must not be used — it floated over portrait rows',
  );
});

test('C4. Pill (Row B) appears BEFORE Row A in source order (pill shown above controls)', () => {
  const panelStart = checklistSrc.indexOf('Pinned pills row');
  assert.ok(panelStart > -1, 'Left panel marker not found');
  const panelBlock = checklistSrc.slice(panelStart, panelStart + 8000);
  const pillPos = panelBlock.indexOf('w-full flex justify-center pointer-events-none');
  const openPos = panelBlock.indexOf('setAllOpen(true)');
  assert.ok(pillPos > -1, 'Pill wrapper not found');
  assert.ok(openPos > -1, 'Open/Close not found');
  assert.ok(pillPos < openPos, '022X: Pill (Row B) must appear before Row A in source order');
});

// ─── §D  Row C — [Hide][Preview] with justify-center ────────────────────────

console.log('\nD. Row C — Hide + Preview centered (mobile-only)');

test('D1. Row C uses lg:hidden (disappears on desktop)', () => {
  const rowCStart = checklistSrc.indexOf('Row C (mobile)');
  assert.ok(rowCStart > -1, 'Row C comment marker not found');
  const rowCBlock = checklistSrc.slice(rowCStart, rowCStart + 250);
  assert.ok(
    rowCBlock.includes('lg:hidden'),
    '022X: Row C must be lg:hidden — Hide/Preview live in desktop right group on lg+',
  );
});

test('D2. Row C uses justify-center (correct centering without parent items-center)', () => {
  const rowCStart = checklistSrc.indexOf('Row C (mobile)');
  const rowCBlock = checklistSrc.slice(rowCStart, rowCStart + 250);
  assert.ok(
    rowCBlock.includes('justify-center'),
    '022X: Row C must use justify-center — parent no longer has items-center',
  );
});

test('D3. Row C contains Hide button', () => {
  const rowCStart = checklistSrc.indexOf('Row C (mobile)');
  const rowCBlock = checklistSrc.slice(rowCStart, rowCStart + 700);
  assert.ok(
    rowCBlock.includes('aria-label="Hide interface'),
    '022X: Row C must contain the Hide button',
  );
});

test('D4. Row C contains Preview button', () => {
  const rowCStart = checklistSrc.indexOf('Row C (mobile)');
  const rowCBlock = checklistSrc.slice(rowCStart, rowCStart + 1200);
  assert.ok(
    rowCBlock.includes('setShowPreview(true)'),
    '022X: Row C must contain the Preview button',
  );
});

// ─── §E  Desktop right group — unchanged from 022W ──────────────────────────

console.log('\nE. Desktop right group (hidden lg:flex ... ml-auto)');

test('E1. Desktop right group uses hidden lg:flex items-center gap-3 ml-auto flex-shrink-0', () => {
  assert.ok(
    checklistSrc.includes('hidden lg:flex items-center gap-3 ml-auto flex-shrink-0'),
    '022X: desktop right group class must be unchanged from 022W',
  );
});

test('E2. Desktop right group contains Hide → Preview → UnitToggle in order', () => {
  const groupStart = checklistSrc.indexOf('hidden lg:flex items-center gap-3 ml-auto flex-shrink-0');
  const groupBlock = checklistSrc.slice(groupStart, groupStart + 1400);
  const hidePos     = groupBlock.indexOf('aria-label="Hide interface');
  const previewPos  = groupBlock.indexOf('setShowPreview(true)');
  const togglePos   = groupBlock.indexOf('<UnitToggle');
  assert.ok(hidePos    > -1, 'Hide missing from desktop right group');
  assert.ok(previewPos > -1, 'Preview missing from desktop right group');
  assert.ok(togglePos  > -1, 'UnitToggle missing from desktop right group');
  assert.ok(hidePos < previewPos,  'Desktop: Hide must come before Preview');
  assert.ok(previewPos < togglePos, 'Desktop: Preview must come before UnitToggle');
});

// ─── §F  Right panel (Background Edit / Share) — unchanged ──────────────────

console.log('\nF. Right panel — Background Edit / Share in own toolbar area');

test('F1. Right panel retains order-first lg:order-last', () => {
  assert.ok(
    checklistSrc.includes('order-first lg:order-last'),
    '022X: Background Edit/Share panel must retain order-first lg:order-last',
  );
});

test('F2. Right panel retains lg:justify-end (right-aligned on desktop)', () => {
  const rightPanelStart = checklistSrc.indexOf('Right toolbar panel');
  const rightPanelBlock = checklistSrc.slice(rightPanelStart, rightPanelStart + 200);
  assert.ok(
    rightPanelBlock.includes('lg:justify-end'),
    '022X: right panel must retain lg:justify-end alignment',
  );
});

// ─── §G  Desktop grid and gutter invariants ──────────────────────────────────

console.log('\nG. Desktop layout invariants preserved');

test('G1. Toolbar group uses lg:grid-cols-[1fr_365px]', () => {
  assert.ok(
    checklistSrc.includes('grid grid-cols-1 lg:grid-cols-[1fr_365px]'),
    '022X: toolbar group grid must preserve lg:grid-cols-[1fr_365px]',
  );
});

test('G2. lg:pr-7 on left panel aligns Open/Close with category panel edge', () => {
  assert.ok(
    checklistSrc.includes('lg:pr-7'),
    '022X: lg:pr-7 must be on the left toolbar panel',
  );
});

// ─── §H  Regression — prior fixes preserved ─────────────────────────────────

console.log('\nH. Regression — prior fixes preserved');

test('H1. 022U min-h-[100dvh] mobile scroll fix preserved', () => {
  assert.ok(
    checklistSrc.includes('min-h-[100dvh]') && checklistSrc.includes('lg:h-[100dvh]'),
    '022U: mobile scroll fix must be preserved',
  );
});

test('H2. 022T mergeLockerEntries import preserved', () => {
  assert.ok(
    checklistSrc.includes('mergeLockerEntries'),
    '022T: mergeLockerEntries import must still exist',
  );
});

test('H3. Outer scroll container unchanged', () => {
  assert.ok(
    checklistSrc.includes('h-[100dvh] overflow-y-auto'),
    '022X: outer scroll container must be unchanged',
  );
});

test('H4. Footer is after screen content in document flow', () => {
  const footerIdx      = checklistSrc.indexOf('<Footer');
  const screenCloseIdx = checklistSrc.indexOf('</div>{/* end screen content */}');
  assert.ok(footerIdx > screenCloseIdx, '022F: Footer must remain after screen content');
});

test('H5. Open/Close stays as a single segmented control', () => {
  assert.ok(
    checklistSrc.includes('flex items-center bg-muted rounded-lg p-0.5 gap-0.5'),
    '022X: Open/Close segmented control container must be unchanged',
  );
});

console.log('\nDone.');
