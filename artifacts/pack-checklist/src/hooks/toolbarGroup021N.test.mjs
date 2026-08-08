/**
 * 021N — Toolbar Group Tests
 *
 * 021N wraps all toolbar controls in a single parent container so the entire
 * toolbar can be repositioned by editing one element.
 *
 * Structure introduced:
 *
 *   <main class="... lg:flex lg:flex-col">
 *
 *     <!-- ── Toolbar group ── -->
 *     <div class="grid grid-cols-1 lg:grid-cols-[1fr_365px] lg:gap-4">
 *       <!-- Left toolbar panel (pills row) -->
 *       <div class="pt-8 pb-3 flex items-center lg:pr-7 flex-shrink-0 relative">
 *         Open/Close · filename pill · Hide · Preview · Imperial/Metric
 *       </div>
 *       <!-- Right toolbar panel (action bar) -->
 *       <div class="order-first lg:order-last relative flex flex-wrap justify-center lg:justify-end gap-2 pt-8 pb-3 lg:pl-3 lg:pr-9 flex-shrink-0">
 *         Background Edit · Share
 *       </div>
 *     </div><!-- end toolbar group -->
 *
 *     <!-- ── Content area ── -->
 *     <div class="grid grid-cols-1 lg:grid-cols-[1fr_365px] gap-8 lg:gap-4 lg:flex-1 lg:min-h-0 lg:overflow-hidden">
 *       <!-- categories scroll -->
 *       <div class="lg:h-full lg:overflow-y-auto lg:min-h-0 ..."> … </div>
 *       <!-- sidebar scroll -->
 *       <div class="order-first lg:order-last lg:h-full lg:overflow-y-auto ..."> … </div>
 *     </div><!-- end content area -->
 *
 *   </main>
 *
 * Protected values from previous prompts:
 *   021K: lg:pr-3 lg:[scrollbar-gutter:stable] on categories scroll
 *   021L: lg:pl-1 lg:pr-5 lg:[scrollbar-gutter:stable] on sidebar scroll
 *   021M: lg:pr-7 on pills row; lg:pl-3 lg:pr-9 lg:justify-end on action bar
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

const lines = checklist.split('\n');

// ─── Element finders ──────────────────────────────────────────────────────────

// Toolbar group: the single parent div that wraps both toolbar panels
const toolbarGroupLine = lines.find(l =>
  l.includes('lg:grid-cols-[1fr_365px]') &&
  l.includes('lg:gap-4') &&
  !l.includes('gap-8')          // distinguishes from content area
);

// Left toolbar panel (pills row) — 021O removed pt-8; now identified by pb-3 + lg:pr-7.
const pillsRowLine = lines.find(l =>
  l.includes('pb-3') &&
  l.includes('flex items-center') &&
  l.includes('lg:pr-7') &&
  l.includes('flex-shrink-0') &&
  l.includes('relative') &&
  !l.includes('inset-0')
);

// Right toolbar panel (action bar) — 021O removed pt-8; now identified by pb-3 + lg:pl-3 lg:pr-9.
const actionBarLine = lines.find(l =>
  l.includes('pb-3') &&
  l.includes('justify-center') &&
  l.includes('lg:justify-end') &&
  l.includes('lg:pl-3') &&
  l.includes('lg:pr-9') &&
  !l.includes('inset-0')
);

// Content area grid
const contentAreaLine = lines.find(l =>
  l.includes('lg:grid-cols-[1fr_365px]') &&
  l.includes('gap-8') &&
  l.includes('lg:flex-1') &&
  l.includes('lg:overflow-hidden')
);

// Categories scroll (left content column)
const categoriesScrollLine = lines.find(l =>
  l.includes('lg:h-full') &&
  l.includes('lg:overflow-y-auto') &&
  l.includes('lg:pr-3') &&
  l.includes('lg:[scrollbar-gutter:stable]')
);

// Sidebar scroll (right content column)
const sidebarScrollLine = lines.find(l =>
  l.includes('lg:h-full') &&
  l.includes('lg:overflow-y-auto') &&
  l.includes('lg:pl-1') &&
  l.includes('lg:pr-5') &&
  l.includes('lg:[scrollbar-gutter:stable]')
);

// main element
const mainLine = lines.find(l => l.includes('max-w-full mx-auto') && l.includes('flex-1 min-h-0'));

let passed = 0;
let failed = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✓ ${name}`); passed++; }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); failed++; }
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nA. Toolbar group — single parent container');

test('A1. Toolbar group div exists (lg:grid-cols-[1fr_365px] lg:gap-4, no gap-8)', () => {
  assert.ok(toolbarGroupLine,
    '021N: toolbar group div must exist with lg:grid-cols-[1fr_365px] and lg:gap-4 but NOT gap-8');
});

test('A2. Toolbar group uses grid layout with correct column template', () => {
  assert.ok(toolbarGroupLine, 'Toolbar group must exist');
  assert.match(toolbarGroupLine, /lg:grid-cols-\[1fr_365px\]/,
    '021N: toolbar group must use the same column template as the content area (1fr / 365px)');
});

test('A3. Toolbar group has no mobile row gap (not gap-8)', () => {
  assert.ok(toolbarGroupLine, 'Toolbar group must exist');
  assert.doesNotMatch(toolbarGroupLine, /\bgap-8\b/,
    '021N: toolbar group must not have gap-8 — only lg:gap-4 desktop column gap');
});

test('A4. main uses lg:flex lg:flex-col (enables toolbar-group + content-area stacking)', () => {
  assert.ok(mainLine, '<main> with max-w-full must exist');
  assert.match(mainLine, /lg:flex lg:flex-col/,
    '021N: main must be a flex column at desktop so toolbar-group and content-area stack vertically');
});

test('A5. main no longer uses lg:overflow-hidden (moved to content area)', () => {
  assert.ok(mainLine, '<main> with max-w-full must exist');
  assert.doesNotMatch(mainLine, /lg:overflow-hidden/,
    '021N: lg:overflow-hidden moved from main to the content area grid');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nB. Left toolbar panel (pills row) — position within toolbar group');

test('B1. Left toolbar panel (pills row) exists inside toolbar group', () => {
  assert.ok(pillsRowLine,
    '021N/021O: pills row must exist with pb-3 flex items-center lg:pr-7 (pt-8 moved to toolbar group parent)');
});

test('B2. Pills row retains lg:pr-7 alignment padding (021M preserved)', () => {
  assert.ok(pillsRowLine, 'Pills row must exist');
  assert.match(pillsRowLine, /lg:pr-7/,
    '021M: pills row lg:pr-7 right-padding must be preserved');
});

test('B3. Pills row retains relative positioning for filename pill (021M preserved)', () => {
  assert.ok(pillsRowLine, 'Pills row must exist');
  assert.match(pillsRowLine, /\brelative\b/,
    '021M: pills row must retain relative for filename pill absolute positioning');
});

test('B4. Open/Close buttons still present', () => {
  assert.match(checklist, /setAllOpen\(true\)/,
    'Open button must still be present in pills row');
  assert.match(checklist, /setAllOpen\(false\)/,
    'Close button must still be present in pills row');
});

test('B5. Hide, Preview, UnitToggle still present', () => {
  assert.match(checklist, /triggerShowcase\(\)/,
    'Hide button (triggerShowcase) must still be present');
  assert.match(checklist, /setShowPreview\(true\)/,
    'Preview button must still be present');
  assert.match(checklist, /<UnitToggle/,
    'UnitToggle must still be present');
});

test('B6. Filename pill absolute positioning — inset-0 pb-3 (021O removed pt-8 from overlay)', () => {
  // 021O moved pt-8 from both toolbar child panels and the pill overlay to the toolbar group parent (pt-4).
  assert.match(checklist, /absolute inset-0 pb-3 flex items-center justify-center pointer-events-none/,
    '021O: filename pill overlay must use pb-3 (not pt-8 pb-3) — top spacing is on toolbar group parent');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nC. Right toolbar panel (action bar) — position within toolbar group');

test('C1. Right toolbar panel (action bar) exists inside toolbar group', () => {
  assert.ok(actionBarLine,
    '021N/021O: action bar must exist with pb-3 justify-center lg:justify-end lg:pl-3 lg:pr-9 (pt-8 moved to toolbar group parent)');
});

test('C2. Action bar uses order-first lg:order-last (mobile appears first, desktop right)', () => {
  assert.ok(actionBarLine, 'Action bar must exist');
  assert.match(actionBarLine, /\border-first\b/,
    '021N: action bar must have order-first for correct mobile stacking within toolbar group');
  assert.match(actionBarLine, /\blg:order-last\b/,
    '021N: action bar must have lg:order-last for correct desktop placement in right column');
});

test('C3. Action bar retains lg:pr-9 lg:pl-3 alignment padding (021M preserved)', () => {
  assert.ok(actionBarLine, 'Action bar must exist');
  assert.match(actionBarLine, /lg:pl-3/,
    '021M: lg:pl-3 left padding must be preserved on action bar');
  assert.match(actionBarLine, /lg:pr-9/,
    '021M: lg:pr-9 right padding must be preserved on action bar');
});

test('C4. BackgroundPickerButton still present', () => {
  assert.match(checklist, /BackgroundPickerButton/,
    'BackgroundPickerButton must still be present in action bar');
});

test('C5. Share pill still present', () => {
  assert.match(checklist, /setShowShareMenu[\s\S]{0,50}Share/,
    'Share pill must still be present in action bar');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nD. Both toolbar panels are siblings inside the toolbar group');

test('D1. Both toolbar panels found in the file', () => {
  assert.ok(pillsRowLine, 'Left toolbar panel (pills row) must be found');
  assert.ok(actionBarLine, 'Right toolbar panel (action bar) must be found');
});

test('D2. Toolbar group comment present in source', () => {
  assert.match(checklist, /Toolbar group/,
    '021N: toolbar group comment must be present for future maintainers');
});

test('D3. No separate sidebar-column wrapper with lg:h-full lg:flex lg:flex-col lg:overflow-hidden', () => {
  // 021N removed the individual column wrappers. If this pattern appears, the old structure remains.
  assert.doesNotMatch(checklist, /order-first lg:order-last lg:h-full lg:flex lg:flex-col lg:overflow-hidden/,
    '021N: the old sidebar column wrapper must be gone — sidebar scroll carries these directly');
});

test('D4. No separate gear-list column wrapper with lg:h-full lg:flex lg:flex-col lg:overflow-hidden', () => {
  // 021N removed the individual column wrappers.
  // Note: sidebar scroll now has lg:h-full lg:overflow-y-auto (not flex-col).
  // The ONLY remaining lg:h-full lg:flex pattern would be a column wrapper.
  assert.doesNotMatch(checklist, /lg:h-full lg:flex lg:flex-col lg:overflow-hidden/,
    '021N: the old left column (gear list) wrapper must be gone');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nE. Content area — separate from toolbar group');

test('E1. Content area grid exists with lg:flex-1 lg:min-h-0 lg:overflow-hidden', () => {
  assert.ok(contentAreaLine,
    '021N: content area grid must exist with lg:grid-cols-[1fr_365px] gap-8 lg:gap-4 lg:flex-1 lg:min-h-0 lg:overflow-hidden');
});

test('E2. Content area uses gap-8 for mobile row-gap (preserved)', () => {
  assert.ok(contentAreaLine, 'Content area must exist');
  assert.match(contentAreaLine, /\bgap-8\b/,
    '021N: content area must keep gap-8 for mobile stacked section spacing');
});

test('E3. Content area uses lg:gap-4 for desktop column gap (preserved)', () => {
  assert.ok(contentAreaLine, 'Content area must exist');
  assert.match(contentAreaLine, /\blg:gap-4\b/,
    '021N: content area desktop column gap must remain lg:gap-4');
});

test('E4. Content area uses lg:flex-1 to fill remaining main height', () => {
  assert.ok(contentAreaLine, 'Content area must exist');
  assert.match(contentAreaLine, /lg:flex-1/,
    '021N: content area must use lg:flex-1 to fill remaining height below toolbar group');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nF. Categories scroll (left content column)');

test('F1. Categories scroll uses lg:h-full for height fill', () => {
  assert.ok(categoriesScrollLine,
    '021N: categories scroll must have lg:h-full lg:overflow-y-auto lg:pr-3 lg:[scrollbar-gutter:stable]');
  assert.match(categoriesScrollLine, /lg:h-full/,
    '021N: categories scroll must use lg:h-full (replaces lg:flex-1 from old column wrapper context)');
});

test('F2. Categories scroll retains 021K: lg:pr-3 lg:[scrollbar-gutter:stable]', () => {
  assert.ok(categoriesScrollLine, 'Categories scroll must exist');
  assert.match(categoriesScrollLine, /lg:pr-3 lg:\[scrollbar-gutter:stable\]/,
    '021K: categories scroll must retain lg:pr-3 lg:[scrollbar-gutter:stable]');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nG. Sidebar scroll (right content column)');

test('G1. Sidebar scroll uses order-first lg:order-last (mobile appears first)', () => {
  assert.ok(sidebarScrollLine,
    '021N: sidebar scroll must have order-first lg:order-last lg:h-full lg:pl-1 lg:pr-5');
  assert.match(sidebarScrollLine, /\border-first\b/,
    '021N: sidebar scroll must have order-first');
  assert.match(sidebarScrollLine, /\blg:order-last\b/,
    '021N: sidebar scroll must have lg:order-last');
});

test('G2. Sidebar scroll uses lg:h-full for height fill', () => {
  assert.ok(sidebarScrollLine, 'Sidebar scroll must exist');
  assert.match(sidebarScrollLine, /lg:h-full/,
    '021N: sidebar scroll must use lg:h-full');
});

test('G3. Sidebar scroll retains 021L: lg:pl-1 lg:pr-5 lg:[scrollbar-gutter:stable]', () => {
  assert.ok(sidebarScrollLine, 'Sidebar scroll must exist');
  assert.match(sidebarScrollLine, /lg:pl-1 lg:pr-5 lg:\[scrollbar-gutter:stable\]/,
    '021L: sidebar scroll must retain lg:pl-1 lg:pr-5 lg:[scrollbar-gutter:stable]');
});

test('G4. WeightSummary, WeightDistribution, ImportGearPanel, LockerPanel still present', () => {
  assert.match(checklist, /<WeightSummary/, 'WeightSummary must still be present');
  assert.match(checklist, /<WeightDistribution/, 'WeightDistribution must still be present');
  assert.match(checklist, /<ImportGearPanel/, 'ImportGearPanel must still be present');
  assert.match(checklist, /<LockerPanel/, 'LockerPanel must still be present');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nH. Protected values from previous prompts');

test('H1. lg:px-8 outer main padding unchanged', () => {
  assert.ok(mainLine, '<main> must exist');
  assert.match(mainLine, /lg:px-8/, 'Outer main padding must remain lg:px-8');
});

test('H2. lg:grid-cols-[1fr_365px] sidebar width 365px unchanged', () => {
  assert.match(checklist, /lg:grid-cols-\[1fr_365px\]/, 'Sidebar width must remain 365px');
});

test('H3. No transform:translateX (no position hacks)', () => {
  const checklistSection = checklist.slice(checklist.indexOf('<main'));
  assert.doesNotMatch(checklistSection, /translateX/, 'No translateX hacks allowed');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nI. Disclosure chevron regression (021J/021L)');

const gearCategory = readFileSync(
  path.join(root, 'artifacts/pack-checklist/src/components/GearCategory.tsx'), 'utf8'
);
const weightSummary = readFileSync(
  path.join(root, 'artifacts/pack-checklist/src/components/WeightSummary.tsx'), 'utf8'
);
const importPanel = readFileSync(
  path.join(root, 'artifacts/pack-checklist/src/components/ImportGearPanel.tsx'), 'utf8'
);

test('I1. GearCategory uses ChevronUp (not ChevronRight)', () => {
  assert.match(gearCategory, /ChevronUp/, 'GearCategory must use ChevronUp');
  assert.doesNotMatch(gearCategory, /ChevronRight/, 'GearCategory must not use ChevronRight');
});

test('I2. WeightSummary uses ChevronUp (not ChevronRight)', () => {
  assert.match(weightSummary, /ChevronUp/, 'WeightSummary must use ChevronUp');
  assert.doesNotMatch(weightSummary, /ChevronRight/, 'WeightSummary must not use ChevronRight');
});

test('I3. ImportGearPanel has state-driven ChevronUp (021L)', () => {
  assert.match(importPanel, /ChevronUp/, 'ImportGearPanel must have ChevronUp for expanded');
  assert.match(importPanel, /ChevronDown/, 'ImportGearPanel must have ChevronDown for collapsed');
  assert.doesNotMatch(importPanel, /ChevronRight/, 'ImportGearPanel must not use ChevronRight');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(60)}`);
console.log(`021N Toolbar Group: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
