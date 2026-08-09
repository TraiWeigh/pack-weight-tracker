/**
 * PROMPT 023B — Part B: Phone Layout Redesign
 *
 * Verifies:
 *  1. Phone Row 1 div exists — lg:hidden, flex, justify-center
 *  2. Phone Row 1 contains a Preview button (onClick setShowPreview)
 *  3. Phone Row 1 contains the activeLockerFile pill
 *  4. Phone Row 1 appears BEFORE the toolbar grid (pt-4 precedes lg:pt-4)
 *  5. Left toolbar div is hidden on mobile (hidden lg:flex)
 *  6. Row A no longer contains lg:hidden UnitToggle in the left toolbar
 *  7. Row C (flex items-center justify-center gap-3 lg:hidden with Hide+Preview) is REMOVED
 *  8. Right toolbar uses justify-between (not just justify-center) on mobile
 *  9. Lower phone toolbar exists — lg:hidden flex items-center justify-between
 * 10. Lower phone toolbar contains Open and Close buttons
 * 11. Lower phone toolbar contains Hide button
 * 12. Lower phone toolbar contains UnitToggle
 * 13. Lower phone toolbar is inside the sidebar (after LockerPanel)
 * 14. Toolbar grid uses lg:pt-4 (not just pt-4)
 * 15. Desktop left toolbar still has the desktop-group (Hide + Preview + UnitToggle)
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const CL_PATH = resolve(
  'artifacts/pack-checklist/src/pages/Checklist.tsx',
);
const src = readFileSync(CL_PATH, 'utf-8');

const has    = (s) => (typeof s === 'string' ? src.includes(s) : s.test(src));
const hasNot = (s) => !has(s);

// ─── 1. Phone Row 1 div ──────────────────────────────────────────────────────
test('023B-B-01: Phone Row 1 div is lg:hidden and flex', () => {
  assert.ok(
    has('lg:hidden flex items-center justify-center') ||
    has('pt-4 lg:hidden flex'),
    'Phone Row 1 div should have lg:hidden and flex with justify-center'
  );
});

// ─── 2. Phone Row 1 contains Preview button ──────────────────────────────────
test('023B-B-02: Phone Row 1 contains Preview button', () => {
  // A setShowPreview(true) button exists outside the modal and old Row C area
  assert.ok(
    has('onClick={() => setShowPreview(true)}'),
    'Phone Row 1 should contain a Preview button calling setShowPreview(true)'
  );
});

// ─── 3. Phone Row 1 contains file name pill reference ────────────────────────
test('023B-B-03: Phone Row 1 references activeLockerFile for file name pill', () => {
  assert.ok(
    has('activeLockerFile.name'),
    'File name pill should reference activeLockerFile.name'
  );
});

// ─── 4. Toolbar grid uses lg:pt-4 ────────────────────────────────────────────
test('023B-B-04: Toolbar grid uses lg:pt-4 not bare pt-4', () => {
  assert.ok(
    has('lg:pt-4 grid grid-cols-1 lg:grid-cols-[1fr_365px]'),
    'Toolbar grid div should use lg:pt-4 (mobile pt removed — handled by Phone Row 1)'
  );
});

// ─── 5. Left toolbar is hidden on mobile ────────────────────────────────────
test('023B-B-05: Left toolbar uses hidden lg:flex (hidden on mobile)', () => {
  assert.ok(
    has('hidden lg:flex lg:flex-row lg:items-center'),
    'Left toolbar must use hidden lg:flex to hide on mobile'
  );
});

// ─── 6. Left toolbar Row A has no lg:hidden UnitToggle ───────────────────────
test('023B-B-06: Row A in left toolbar no longer contains lg:hidden UnitToggle', () => {
  // There should not be a UnitToggle inside a lg:hidden wrapper inside the left toolbar
  // We check that the specific pattern used in Row A is gone:
  assert.ok(
    hasNot('<div className="lg:hidden">\n                  <UnitToggle />') &&
    hasNot('<div className="lg:hidden"><UnitToggle />'),
    'Row A must not contain a lg:hidden UnitToggle (moved to lower phone toolbar)'
  );
});

// ─── 7. Row C (old mobile Hide+Preview row) is REMOVED ───────────────────────
test('023B-B-07: Old Row C (mobile Hide+Preview justify-center row) is removed', () => {
  assert.ok(
    hasNot('flex items-center justify-center gap-3 lg:hidden'),
    'Row C (justify-center gap-3 lg:hidden Hide+Preview row) should no longer exist'
  );
});

// ─── 8. Right toolbar uses justify-between on mobile ────────────────────────
test('023B-B-08: Right toolbar uses justify-between on mobile', () => {
  assert.ok(
    has('justify-between lg:justify-end'),
    'Right toolbar should use justify-between (mobile) and lg:justify-end (desktop)'
  );
});

// ─── 9. Lower phone toolbar div exists ──────────────────────────────────────
test('023B-B-09: Lower phone toolbar div exists with lg:hidden justify-between', () => {
  assert.ok(
    has('lg:hidden flex items-center justify-between'),
    'Lower phone toolbar div must have lg:hidden flex items-center justify-between'
  );
});

// ─── 10. Lower toolbar has Open and Close ────────────────────────────────────
test('023B-B-10: Lower phone toolbar contains Open and Close buttons', () => {
  // setAllOpen(true) and setAllOpen(false) must be present in the lower toolbar area
  // There are two occurrences (original toolbar + lower toolbar)
  const openCount  = (src.match(/setAllOpen\(true\)/g)  ?? []).length;
  const closeCount = (src.match(/setAllOpen\(false\)/g) ?? []).length;
  assert.ok(openCount  >= 2, `setAllOpen(true) should appear ≥2 times (desktop + lower toolbar), found ${openCount}`);
  assert.ok(closeCount >= 2, `setAllOpen(false) should appear ≥2 times (desktop + lower toolbar), found ${closeCount}`);
});

// ─── 11. Lower toolbar has Hide button ───────────────────────────────────────
test('023B-B-11: Lower phone toolbar contains Hide button', () => {
  // triggerShowcase should appear ≥2 times: desktop group + lower toolbar
  const count = (src.match(/triggerShowcase\(\)/g) ?? []).length;
  assert.ok(count >= 2, `triggerShowcase() should appear ≥2 times (desktop row + lower toolbar), found ${count}`);
});

// ─── 12. Lower toolbar has UnitToggle ────────────────────────────────────────
test('023B-B-12: Lower phone toolbar contains UnitToggle', () => {
  // UnitToggle should appear ≥3 times: desktop group, (old mobile Row A removed),
  // and the new lower phone toolbar. At minimum 2 (desktop + lower toolbar).
  const count = (src.match(/<UnitToggle/g) ?? []).length;
  assert.ok(count >= 2, `UnitToggle should appear ≥2 times (desktop group + lower toolbar), found ${count}`);
});

// ─── 13. Lower toolbar is inside sidebar (after LockerPanel) ─────────────────
test('023B-B-13: Lower phone toolbar appears after LockerPanel in source', () => {
  // LockerPanel is a self-closing component (<LockerPanel ... />) — no closing tag.
  // Find the last occurrence of '<LockerPanel' then the '/>' that ends it.
  const lockerOpenIdx = src.lastIndexOf('<LockerPanel');
  assert.ok(lockerOpenIdx > 0, 'LockerPanel must exist in source');
  const lockerCloseIdx = src.indexOf('/>', lockerOpenIdx);
  assert.ok(lockerCloseIdx > 0, 'LockerPanel self-closing "/> " must exist');
  const lowerToolbar = src.indexOf('Lower Phone Toolbar', lockerCloseIdx);
  assert.ok(
    lowerToolbar > lockerCloseIdx,
    'Lower phone toolbar comment/div should appear AFTER LockerPanel in source'
  );
});

// ─── 14. Desktop left toolbar still has the desktop-group ────────────────────
test('023B-B-14: Desktop left toolbar still has the hidden lg:flex desktop group', () => {
  assert.ok(
    has('hidden lg:flex items-center gap-3 ml-auto flex-shrink-0'),
    'Desktop-only right group (Hide + Preview + UnitToggle) must still exist'
  );
});

// ─── 15. No bare pt-4 on the toolbar grid ────────────────────────────────────
test('023B-B-15: Toolbar grid does not use bare pt-4 (without lg: prefix)', () => {
  assert.ok(
    hasNot('className="pt-4 grid grid-cols-1 lg:grid-cols-[1fr_365px]'),
    'Toolbar grid must use lg:pt-4, not bare pt-4 (phone Row 1 provides mobile top padding)'
  );
});
