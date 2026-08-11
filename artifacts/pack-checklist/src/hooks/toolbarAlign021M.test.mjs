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

// 021O removed pt-8 from child panels; 022V added flex-wrap, removed flex-shrink-0.
// Pills row is now identified by pb-3 + flex + items-center + lg:pr-7 + relative (no inset-0).
const pillsRowLine = lines.find(l =>
  l.includes('pb-3') && l.includes('flex') && l.includes('items-center') && l.includes('lg:pr-7') && l.includes('relative') && !l.includes('inset-0')
);

// 024A: Sidebar toolbar moved INSIDE the scrollable sidebar wrapper (no longer a separate
// flex-shrink-0 pinned bar). The toolbar row is now a plain flex row inside the scrollable div
// that also contains Pack Summary, Weight Distribution, etc. This gives all controls the exact
// same content box — scrollbar-gutter: stable narrows it identically for toolbar and panels.
// Detect by: relative flex items-center pb-3, no flex-shrink-0, no justify-center, no lg:pr-7.
const sidebarBarLine = lines.find(l =>
  l.includes('relative') && l.includes('flex') && l.includes('items-center') &&
  l.includes('pb-3') && !l.includes('flex-shrink-0') && !l.includes('justify-center') &&
  !l.includes('lg:pr-7') && !l.includes('inset-0')
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
  // 022W: pill wrapper now uses lg:absolute for desktop; in normal flow on mobile
  assert.ok(checklist.includes('lg:absolute lg:inset-0') && checklist.includes('pointer-events-none'),
    '021O: filename pill overlay must use pb-3 (pt-8 moved to toolbar group parent)');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nB. Sidebar toolbar — alignment (024A: toolbar inside scrollable wrapper)');

test('B1. Sidebar toolbar row exists inside scrollable wrapper (024A)', () => {
  assert.ok(sidebarBarLine,
    '024A: sidebar toolbar row (relative flex items-center pb-3, no flex-shrink-0) must exist inside scrollable');
});

test('B2. Sidebar toolbar is NOT a separate pinned bar with flex-shrink-0 (024A)', () => {
  // 024A moved the toolbar inside the scrollable div — no separate pinned bar should exist.
  const pinnedBar = lines.find(l =>
    l.includes('flex-shrink-0') &&
    (l.includes('justify-center') || l.includes('justify-between')) &&
    l.includes('pb-3') && l.includes('gap-2')
  );
  assert.ok(!pinnedBar,
    '024A: no separate flex-shrink-0 pinned action bar should exist — toolbar is inside scrollable');
});

test('B3. Sidebar toolbar row has no padding-offset alignment hacks (lg:pr-9 etc.)', () => {
  // 024A uses containment (same scrollable wrapper) for alignment, not padding offsets.
  assert.ok(sidebarBarLine, 'Sidebar toolbar row must exist');
  assert.doesNotMatch(sidebarBarLine, /\blg:pr-9\b/,
    '024A: alignment via containment, not lg:pr-9 offset — pr-9 must not be on toolbar row');
});

test('B4. Sidebar toolbar contains ChevronDown/Up open-close controls', () => {
  // 023W/024A: down/up arrows are the sidebar open-all / close-all controls.
  assert.match(checklist, /setSidebarAllOpen\(true\)/,
    'setSidebarAllOpen(true) — ChevronDown open button — must be in sidebar toolbar');
  assert.match(checklist, /setSidebarAllOpen\(false\)/,
    'setSidebarAllOpen(false) — ChevronUp close button — must be in sidebar toolbar');
});

test('B5. Sidebar scrollable div still uses lg:pl-1 lg:pr-5 (021L alignment wrapper)', () => {
  // 024A: alignment is achieved by placing controls inside this wrapper — padding must be preserved.
  assert.match(checklist, /lg:pl-1 lg:pr-5 lg:\[scrollbar-gutter:stable\]/,
    '021L/024A: sidebar scrollable wrapper must keep lg:pl-1 lg:pr-5 lg:[scrollbar-gutter:stable]');
});

test('B6. No free-standing lg:px-3 on sidebar toolbar row (old pre-024A padding)', () => {
  assert.ok(sidebarBarLine, 'Sidebar toolbar row must exist');
  assert.doesNotMatch(sidebarBarLine, /\blg:px-3\b/,
    '024A: old lg:px-3 standalone must not appear on toolbar row — alignment by containment');
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
  // 024A: sidebar toolbar row inside scrollable — no negative margin needed or allowed.
  assert.ok(sidebarBarLine && !/-m[lrx]-/.test(sidebarBarLine), 'No negative margin on sidebar toolbar row');
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
