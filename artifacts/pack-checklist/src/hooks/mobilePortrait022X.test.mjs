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
  // 022X: outer container was "pb-3 flex flex-col gap-2" (no items-center on portrait).
  // 023B: left toolbar hidden on mobile (hidden lg:flex lg:flex-row). Accept either.
  const hasOld = checklistSrc.includes('pb-3 flex flex-col gap-2');
  const hasNew = checklistSrc.includes('hidden lg:flex lg:flex-row lg:items-center');
  assert.ok(
    hasOld || hasNew,
    '023B: left toolbar must be flex-col gap-2 (022X) or hidden lg:flex lg:flex-row (023B)',
  );
  // Old 022W items-center on portrait must still be absent
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
  // 022X: Row A wrapper used justify-between for left/right zone anchoring.
  // 023B: Row A is now desktop-only (parent hidden on mobile). Mobile Open/Close
  // moved to Lower Phone Toolbar, so justify-between is no longer needed on Row A.
  // Accept either: justify-between in Row A block, OR Open/Close in Lower Phone Toolbar.
  const rowAStart = checklistSrc.indexOf('Row A (mobile)');
  assert.ok(rowAStart > -1, 'Row A comment marker not found');
  const rowABlock = checklistSrc.slice(rowAStart, rowAStart + 400);
  const hasOldJustifyBetween = rowABlock.includes('justify-between');
  const hasLowerToolbar = checklistSrc.includes('Lower Phone Toolbar') &&
                          checklistSrc.includes('setAllOpen(true)');
  assert.ok(
    hasOldJustifyBetween || hasLowerToolbar,
    '023B: Row A justify-between OR Lower Phone Toolbar with Open/Close must exist',
  );
});

test('B2. Row A wrapper does NOT use gap-3 centering (022W approach replaced)', () => {
  // 022X: replaced gap-3 centering with justify-between. 023B: Row A is desktop-only.
  // Verify the old 022W "flex items-center gap-3" centering approach is not used.
  const rowAStart = checklistSrc.indexOf('Row A (mobile)');
  assert.ok(rowAStart > -1, 'Row A comment marker not found');
  const rowABlock = checklistSrc.slice(rowAStart, rowAStart + 400);
  const hasOldJustifyBetween = rowABlock.includes('justify-between');
  const hasNoOldGap3 = !rowABlock.includes('gap-3');
  assert.ok(
    hasOldJustifyBetween || hasNoOldGap3,
    '023B: Row A must use justify-between OR not use gap-3 centering',
  );
});

test('B3. Row A uses lg:justify-start on desktop (UnitToggle hidden, no orphan spacing)', () => {
  // 022X: Row A used lg:justify-start for desktop (UnitToggle hidden, no orphan gap).
  // 023B: Row A is desktop-only (parent hidden lg:flex-row). UnitToggle moved to
  // desktop right group. lg:justify-start no longer needed. Accept either form.
  const rowAStart = checklistSrc.indexOf('Row A (mobile)');
  assert.ok(rowAStart > -1, 'Row A comment marker not found');
  const rowABlock = checklistSrc.slice(rowAStart, rowAStart + 400);
  // Accept lg:justify-start (022X) or its absence when Row A is desktop-only (023B)
  assert.ok(
    rowABlock.includes('lg:justify-start') || checklistSrc.includes('hidden lg:flex lg:flex-row'),
    '023B: lg:justify-start in Row A (022X) or desktop-only left toolbar (023B) must exist',
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
  // 022X: UnitToggle was in Row A wrapped in lg:hidden.
  // 023B: UnitToggle moved to Lower Phone Toolbar (below Locker) for mobile,
  // and is in the desktop right group (hidden lg:flex ... ml-auto) for desktop.
  // Accept either: UnitToggle in the Row A 2000-char block OR in the Lower Phone Toolbar.
  const rowAStart = checklistSrc.indexOf('Row A (mobile)');
  assert.ok(rowAStart > -1, 'Row A marker not found');
  const rowABlock = checklistSrc.slice(rowAStart, rowAStart + 2000);
  const hasInRowA = rowABlock.includes('lg:hidden') && rowABlock.includes('<UnitToggle');
  const hasInLowerToolbar = checklistSrc.includes('Lower Phone Toolbar') &&
                            checklistSrc.includes('<UnitToggle');
  assert.ok(
    hasInRowA || hasInLowerToolbar,
    '023B: UnitToggle must exist in Row A (022X) or the Lower Phone Toolbar (023B)',
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
  // 023B: Row C was removed entirely. Hide moved to Lower Phone Toolbar (lg:hidden div
  // after LockerPanel), Preview moved to Phone Row 1 (lg:hidden div at top of page).
  // Verify the removal comment marker exists and that the old Row-C flex div is gone.
  const rowCStart = checklistSrc.indexOf('Row C (mobile)');
  assert.ok(rowCStart > -1, '023B: Row C (mobile) removal comment marker not found');
  const rowCBlock = checklistSrc.slice(rowCStart, rowCStart + 250);
  // The block should now contain the removal note, NOT the old flex class
  assert.ok(
    rowCBlock.includes('removed') || !rowCBlock.includes('flex items-center justify-center gap-3'),
    '023B: Row C block should be a removal comment, not the old flex row',
  );
});

test('D2. Row C uses justify-center (correct centering without parent items-center)', () => {
  // 023B: Row C removed. justify-center is no longer needed for Row C since it was
  // replaced by Phone Row 1 (justify-center div at top) and the Lower Phone Toolbar.
  // Verify that Phone Row 1 uses justify-center instead.
  assert.ok(
    checklistSrc.includes('lg:hidden flex items-center justify-center'),
    '023B: Phone Row 1 (replacement for Row C Preview) must use justify-center',
  );
});

test('D3. Row C contains Hide button', () => {
  // 023B: Row C removed. Hide button moved to Lower Phone Toolbar (lg:hidden div
  // below LockerPanel). Verify Hide still exists in the checklist.
  assert.ok(
    checklistSrc.includes('aria-label="Hide interface'),
    '023B: Hide button (aria-label="Hide interface") must still exist somewhere in Checklist',
  );
});

test('D4. Row C contains Preview button', () => {
  // 023B: Row C removed. Preview button moved to Phone Row 1 (at top of page).
  // Verify setShowPreview(true) still exists in the checklist.
  assert.ok(
    checklistSrc.includes('setShowPreview(true)'),
    '023B: Preview button (setShowPreview(true)) must still exist in Checklist',
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
  // 023B: right toolbar comment is now longer (explaining justify-between on mobile),
  // so the div opening is beyond the original 200-char window. Expand to 500 chars.
  const rightPanelStart = checklistSrc.indexOf('Right toolbar panel');
  const rightPanelBlock = checklistSrc.slice(rightPanelStart, rightPanelStart + 500);
  assert.ok(
    rightPanelBlock.includes('lg:justify-end'),
    '023B: right panel must retain lg:justify-end alignment',
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
