/**
 * 021M — Toolbar Edge Alignment Tests
 *
 * Two authorized CSS changes to Checklist.tsx:
 *
 *   A. Left checklist toolbar (pills row):
 *      lg:pr-3 (12px) → lg:pr-7 (28px)
 *      Extra 16px ≈ scrollbar-gutter(≈15px) so Imperial/Metric RIGHT edge
 *      aligns with category-card RIGHT edge (≤2px tolerance).
 *
 *   B. Sidebar toolbar (action bar):
 *      justify-center → justify-center lg:justify-end   (desktop right-align)
 *      lg:px-3        → lg:pl-3 lg:pr-9
 *      Extra right padding (36px) ≈ pr-5(20px) + scrollbar-gutter(≈15px) = 35px
 *      so Share RIGHT edge aligns with sidebar-panel RIGHT edge (≤2px tolerance).
 *
 * Protected / NOT changed:
 *   - lg:pr-3 on left scrollable categories div (021K restore)
 *   - lg:pl-1 lg:pr-5 on sidebar scrollable div (021L rebalance)
 *   - lg:[scrollbar-gutter:stable] on both scrollable divs
 *   - All panel widths, grid gap, outer padding, sidebar width (365px)
 *   - All button labels, sizes, functionality
 *   - filename pill absolute positioning (centered over left column)
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root      = path.resolve(__dirname, '../../../..');

const checklist = readFileSync(
  path.join(root, 'artifacts/pack-checklist/src/pages/Checklist.tsx'), 'utf8'
);

// Locate the two toolbar rows by their unique structural signatures
const lines = checklist.split('\n');

// 021O removed pt-8 from child panels; top spacing is now pt-4 on the toolbar group parent.
// Pills row is now identified by pb-3 + flex items-center + lg:pr-7 + flex-shrink-0 + relative.
const pillsRowLine = lines.find(l =>
  l.includes('pb-3') && l.includes('flex items-center') && l.includes('lg:pr-7') && l.includes('flex-shrink-0') && l.includes('relative') && !l.includes('inset-0')
);

// Action bar (sidebar bar): pb-3 + justify-center + gap-2 + flex-shrink-0 (no pt-8 post-021O).
const sidebarBarLine = lines.find(l =>
  l.includes('pb-3') && l.includes('justify-center') && l.includes('gap-2') && l.includes('flex-shrink-0') && !l.includes('items-center') && !l.includes('inset-0')
);

let passed = 0;
let failed = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✓ ${name}`); passed++; }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); failed++; }
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nA. Left checklist toolbar — right edge alignment (021M)');

test('A1. Pills row exists with expected structural classes', () => {
  assert.ok(pillsRowLine, 'Pills row (pb-3 flex items-center lg:pr-7 flex-shrink-0 relative) must exist — note: pt-8 moved to toolbar group parent in 021O');
});

test('A2. Pills row uses lg:pr-7 (28px) desktop right padding', () => {
  assert.ok(pillsRowLine, 'Pills row must exist');
  assert.match(pillsRowLine, /\blg:pr-7\b/,
    '021M: pills row must use lg:pr-7 (28px) — aligns Metric right edge with category-card right edge');
});

test('A3. Pills row no longer uses lg:pr-3 (replaced by lg:pr-7)', () => {
  assert.ok(pillsRowLine, 'Pills row must exist');
  // Pills row should not have the old lg:pr-3 — but the scrollable categories div still has it
  assert.doesNotMatch(pillsRowLine, /\blg:pr-3\b/,
    '021M: old lg:pr-3 must not be on the pills row — replaced by lg:pr-7');
});

test('A4. Left scrollable categories div still has lg:pr-3 (021K preserved)', () => {
  // The scrollable categories div is a sibling of the pills row — must NOT be changed
  assert.match(checklist, /lg:pr-3 lg:\[scrollbar-gutter:stable\]/,
    '021K restore: left scrollable div must still have lg:pr-3 lg:[scrollbar-gutter:stable]');
});

test('A5. Open/Close segmented control still present in pills row', () => {
  // Both setAllOpen(true) and setAllOpen(false) must still exist in the file
  assert.match(checklist, /setAllOpen\(true\)/,
    'setAllOpen(true) — Open button — must still be present in Checklist.tsx');
  assert.match(checklist, /setAllOpen\(false\)/,
    'setAllOpen(false) — Close button — must still be present in Checklist.tsx');
});

test('A6. Hide, Preview and UnitToggle still present in pills row', () => {
  assert.match(checklist, /triggerShowcase\(\)/,
    'triggerShowcase() — Hide button — must still be present');
  assert.match(checklist, /setShowPreview\(true\)/,
    'setShowPreview(true) — Preview button — must still be present');
  assert.match(checklist, /<UnitToggle/,
    '<UnitToggle — unit toggle — must still be present in pills row');
});

test('A7. Filename pill absolute positioning preserved (021O: pt-8 removed from overlay)', () => {
  // 021O moved pt-8 from child panels to the toolbar-group parent (pt-4).
  // Overlay now uses pb-3 only; inset-0 + flex items-center still centres correctly.
  assert.match(checklist, /absolute inset-0 pb-3 flex items-center justify-center pointer-events-none/,
    '021O: filename pill overlay must use pb-3 (pt-8 moved to toolbar group parent)');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nB. Sidebar toolbar — right edge alignment (021M)');

test('B1. Sidebar action bar exists with structural classes', () => {
  assert.ok(sidebarBarLine, 'Sidebar action bar (pt-8 pb-3 flex-wrap justify-center gap-2 flex-shrink-0) must exist');
});

test('B2. Sidebar action bar uses lg:justify-end (desktop right-align)', () => {
  assert.ok(sidebarBarLine, 'Sidebar action bar must exist');
  assert.match(sidebarBarLine, /\blg:justify-end\b/,
    '021M: sidebar action bar must use lg:justify-end to right-align Share with panel right edge');
});

test('B3. Sidebar action bar retains justify-center (mobile/tablet center)', () => {
  assert.ok(sidebarBarLine, 'Sidebar action bar must exist');
  assert.match(sidebarBarLine, /\bjustify-center\b/,
    'justify-center must remain for mobile/tablet stacked layout');
});

test('B4. Sidebar action bar uses lg:pl-3 (12px left padding preserved)', () => {
  assert.ok(sidebarBarLine, 'Sidebar action bar must exist');
  assert.match(sidebarBarLine, /\blg:pl-3\b/,
    '021M: sidebar action bar left padding stays 12px (lg:pl-3)');
});

test('B5. Sidebar action bar uses lg:pr-9 (36px right padding)', () => {
  assert.ok(sidebarBarLine, 'Sidebar action bar must exist');
  assert.match(sidebarBarLine, /\blg:pr-9\b/,
    '021M: sidebar action bar must use lg:pr-9 (36px) — aligns Share right edge with panel right edge');
});

test('B6. Old lg:px-3 no longer on sidebar action bar (replaced)', () => {
  assert.ok(sidebarBarLine, 'Sidebar action bar must exist');
  assert.doesNotMatch(sidebarBarLine, /\blg:px-3\b/,
    '021M: old lg:px-3 must be replaced by lg:pl-3 lg:pr-9 on sidebar action bar');
});

test('B7. Background Edit button still present in sidebar', () => {
  assert.match(checklist, /BackgroundPickerButton/,
    'BackgroundPickerButton must still exist in sidebar toolbar');
});

test('B8. Share pill still present in sidebar', () => {
  assert.match(checklist, /setShowShareMenu[\s\S]{0,50}Share/,
    'Share pill must still exist in sidebar toolbar');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nC. Protected spacing — gutters and sidebar unchanged');

test('C1. Sidebar scrollable div still uses lg:pl-1 lg:pr-5 (021L rebalance)', () => {
  assert.match(checklist, /lg:pl-1 lg:pr-5 lg:\[scrollbar-gutter:stable\]/,
    '021L: sidebar scrollable div must still have lg:pl-1 lg:pr-5 lg:[scrollbar-gutter:stable]');
});

test('C2. Outer page padding lg:px-8 unchanged', () => {
  const mainLine = lines.find(l => l.includes('max-w-full mx-auto') && l.includes('flex-1 min-h-0'));
  assert.ok(mainLine, '<main> with max-w-full must exist');
  assert.match(mainLine, /lg:px-8/, 'Outer main padding must remain lg:px-8');
});

test('C3. Grid column gap lg:gap-4 unchanged', () => {
  const gridLine = lines.find(l => l.includes('lg:grid-cols-[1fr_365px]'));
  assert.ok(gridLine, 'Grid line must exist');
  assert.match(gridLine, /lg:gap-4/, 'Desktop column gap must remain lg:gap-4');
});

test('C4. Sidebar column width 365px unchanged', () => {
  assert.match(checklist, /lg:grid-cols-\[1fr_365px\]/, 'Sidebar width must remain 365px');
});

test('C5. No transform:translateX (no position hacks)', () => {
  const checklistSection = checklist.slice(checklist.indexOf('<main'));
  assert.doesNotMatch(checklistSection, /translateX/, 'No translateX hacks allowed');
});

test('C6. No negative margin on toolbar rows', () => {
  assert.ok(pillsRowLine && !/-m[lrx]-/.test(pillsRowLine), 'No negative margin on pills row');
  assert.ok(sidebarBarLine && !/-m[lrx]-/.test(sidebarBarLine), 'No negative margin on sidebar bar');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nD. Disclosure chevron regression');

const weightSummary = readFileSync(
  path.join(root, 'artifacts/pack-checklist/src/components/WeightSummary.tsx'), 'utf8'
);
const gearCategory = readFileSync(
  path.join(root, 'artifacts/pack-checklist/src/components/GearCategory.tsx'), 'utf8'
);
const importPanel = readFileSync(
  path.join(root, 'artifacts/pack-checklist/src/components/ImportGearPanel.tsx'), 'utf8'
);

test('D1. Category panels: ChevronUp (expanded) + ChevronDown (collapsed)', () => {
  assert.match(gearCategory, /ChevronUp/, 'GearCategory must use ChevronUp');
  assert.doesNotMatch(gearCategory, /ChevronRight/, 'GearCategory must not use ChevronRight');
});

test('D2. Pack Summary / Weight Distribution: ChevronUp + ChevronDown', () => {
  assert.match(weightSummary, /ChevronUp/, 'WeightSummary must use ChevronUp');
  assert.doesNotMatch(weightSummary, /ChevronRight/, 'WeightSummary must not use ChevronRight');
});

test('D3. Scan Gear List: state-driven ChevronUp (expanded) + ChevronDown (collapsed)', () => {
  assert.match(importPanel, /open\s*\n?\s*\?\s*<Chevron(Up|Down)|open\s*\?\s*<Chevron(Up|Down)/,
    'ImportGearPanel chevron must be conditional on open state (021L fix)');
  assert.match(importPanel, /ChevronUp/, 'ImportGearPanel must have ChevronUp for expanded state');
  assert.match(importPanel, /ChevronDown/, 'ImportGearPanel must have ChevronDown for collapsed state');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(60)}`);
console.log(`021M Toolbar Alignment: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
