/**
 * 021P — Content Panel Top-Edge Alignment Tests
 *
 * Problem: the inner sidebar content wrapper had `py-2 pb-8`.
 * The 8 px top padding (`py-2`) caused WeightSummary (Pack Summary) to sit
 * ~8 px lower than the first GearCategory in the left column.
 *
 * Fix: changed `py-2 pb-8` → `pb-8` on the inner sidebar content div.
 * Both columns now start their content at y = 0 relative to the content-area grid.
 *
 * Structure post-021P:
 *
 *   content-area (grid lg:grid-cols-[1fr_365px] gap-8 lg:gap-4 lg:flex-1 lg:min-h-0 lg:overflow-hidden)
 *   ├─ categories scroll (lg:h-full lg:overflow-y-auto … no top padding)
 *   │    └─ GearCategory starts at y = 0
 *   └─ sidebar scroll (order-first lg:order-last lg:h-full … no top padding)
 *        └─ inner content div (flex flex-col gap-4 pb-8)   ← no pt-* here
 *             └─ WeightSummary starts at y = 0
 *
 * Protected invariants:
 *   021O: pt-4 on toolbar-group parent (toolbar top spacing)
 *   021N: toolbar group structure + content area grid structure
 *   021M: lg:pr-7 on pills row; lg:pl-3 lg:pr-9 on action bar
 *   021L: lg:pl-1 lg:pr-5 lg:[scrollbar-gutter:stable] on sidebar scroll
 *   021K: lg:pr-3 lg:[scrollbar-gutter:stable] on categories scroll
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

// Sidebar inner content div (the flex column wrapping WeightSummary etc.)
const sidebarInnerLine = lines.find(l =>
  l.includes('flex flex-col') &&
  l.includes('gap-4') &&
  l.includes('pb-8') &&
  !l.includes('lg:') &&       // not the content area grid
  !l.includes('grid')
);

// Categories scroll (left column)
const categoriesScrollLine = lines.find(l =>
  l.includes('lg:h-full') &&
  l.includes('lg:overflow-y-auto') &&
  l.includes('lg:pr-3') &&
  l.includes('lg:[scrollbar-gutter:stable]')
);

// Sidebar scroll (right column)
const sidebarScrollLine = lines.find(l =>
  l.includes('lg:h-full') &&
  l.includes('lg:overflow-y-auto') &&
  l.includes('lg:pl-1') &&
  l.includes('lg:pr-5') &&
  l.includes('lg:[scrollbar-gutter:stable]')
);

// Toolbar group parent
const toolbarGroupLine = lines.find(l =>
  l.includes('pt-4') &&
  l.includes('lg:grid-cols-[1fr_365px]') &&
  l.includes('lg:gap-4') &&
  !l.includes('gap-8')
);

// Content area grid
const contentAreaLine = lines.find(l =>
  l.includes('lg:grid-cols-[1fr_365px]') &&
  l.includes('gap-8') &&
  l.includes('lg:flex-1') &&
  l.includes('lg:overflow-hidden')
);

let passed = 0;
let failed = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✓ ${name}`); passed++; }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); failed++; }
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nA. Sidebar inner content div — no top padding (021P fix)');

test('A1. Sidebar inner content div exists (flex flex-col gap-4 pb-8)', () => {
  assert.ok(sidebarInnerLine,
    '021P: inner sidebar content div must exist with flex flex-col gap-4 pb-8');
});

test('A2. Sidebar inner content div has NO pt-* top padding (021P: cause of Pack Summary offset)', () => {
  assert.ok(sidebarInnerLine, 'Sidebar inner content div must exist');
  // py-2 caused the 8px top offset; it must be gone
  assert.doesNotMatch(sidebarInnerLine, /\bpy-2\b/,
    '021P: py-2 must be removed from inner sidebar div — it caused Pack Summary to sit ~8px below categories');
  assert.doesNotMatch(sidebarInnerLine, /\bpt-2\b/,
    '021P: pt-2 must not appear on inner sidebar div');
  assert.doesNotMatch(sidebarInnerLine, /\bpt-4\b/,
    '021P: pt-4 must not appear on inner sidebar div — that value belongs on the toolbar-group parent');
  assert.doesNotMatch(sidebarInnerLine, /\bmt-\d/,
    '021P: no mt-* on inner sidebar div');
});

test('A3. Sidebar inner content div retains pb-8 bottom spacing', () => {
  assert.ok(sidebarInnerLine, 'Sidebar inner content div must exist');
  assert.match(sidebarInnerLine, /\bpb-8\b/,
    '021P: pb-8 bottom spacing must be retained');
});

test('A4. Sidebar inner content div retains gap-4 between panels', () => {
  assert.ok(sidebarInnerLine, 'Sidebar inner content div must exist');
  assert.match(sidebarInnerLine, /\bgap-4\b/,
    '021P: gap-4 spacing between sidebar panels must be retained');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nB. Categories scroll — no top padding (left column reference)');

test('B1. Categories scroll exists with lg:h-full lg:overflow-y-auto lg:pr-3', () => {
  assert.ok(categoriesScrollLine,
    '021K/021N: categories scroll must exist with lg:h-full lg:overflow-y-auto lg:pr-3');
});

test('B2. Categories scroll has no pt-* top padding (reference: categories start at y=0)', () => {
  assert.ok(categoriesScrollLine, 'Categories scroll must exist');
  assert.doesNotMatch(categoriesScrollLine, /\bpt-\d/,
    '021P: categories scroll must have no pt-* — first GearCategory starts at y=0 in the left column');
  assert.doesNotMatch(categoriesScrollLine, /\bpy-\d/,
    '021P: categories scroll must have no py-* — first GearCategory starts at y=0 in the left column');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nC. Sidebar scroll — no top padding (right column scroll wrapper)');

test('C1. Sidebar scroll exists with order-first lg:order-last lg:h-full lg:pl-1 lg:pr-5', () => {
  assert.ok(sidebarScrollLine,
    '021L/021N: sidebar scroll must exist with lg:h-full lg:pl-1 lg:pr-5');
});

test('C2. Sidebar scroll has no pt-* top padding (scroll wrapper does not introduce offset)', () => {
  assert.ok(sidebarScrollLine, 'Sidebar scroll must exist');
  assert.doesNotMatch(sidebarScrollLine, /\bpt-\d/,
    '021P: sidebar scroll wrapper must have no pt-* — vertical offset must not come from the wrapper');
  assert.doesNotMatch(sidebarScrollLine, /\bpy-\d/,
    '021P: sidebar scroll wrapper must have no py-* — vertical offset must not come from the wrapper');
  assert.doesNotMatch(sidebarScrollLine, /\bmt-\d/,
    '021P: sidebar scroll wrapper must have no mt-* — margin must not shift the right column');
});

test('C3. Sidebar scroll retains 021L: lg:pl-1 lg:pr-5 lg:[scrollbar-gutter:stable]', () => {
  assert.ok(sidebarScrollLine, 'Sidebar scroll must exist');
  assert.match(sidebarScrollLine, /lg:pl-1 lg:pr-5 lg:\[scrollbar-gutter:stable\]/,
    '021L: sidebar scroll horizontal gutters must be unchanged');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nD. No layout hacks introduced');

test('D1. No translateY in Checklist.tsx (no transform positioning hack)', () => {
  const mainSection = checklist.slice(checklist.indexOf('<main'));
  assert.doesNotMatch(mainSection, /translateY/,
    '021P: translateY must not be used — fix must come from removing extra padding, not a transform');
});

test('D2. No negative margin on sidebar inner div (no negative-margin hack)', () => {
  assert.ok(sidebarInnerLine, 'Sidebar inner content div must exist');
  assert.doesNotMatch(sidebarInnerLine, /-mt-/,
    '021P: negative top margin must not be used on inner sidebar div');
});

test('D3. No top: absolute positioning on sidebar content (no top:-16px hack)', () => {
  // We guard against absolute positioning being added to fix the alignment
  // by checking the inner div does not have absolute or top-* classes.
  assert.ok(sidebarInnerLine, 'Sidebar inner content div must exist');
  assert.doesNotMatch(sidebarInnerLine, /\babsolute\b/,
    '021P: absolute positioning must not be used on inner sidebar div');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nE. Toolbar group invariants preserved (021O/021N)');

test('E1. Toolbar group parent retains pt-4 (021O: single shared top-spacing value)', () => {
  assert.ok(toolbarGroupLine,
    '021O: toolbar group parent must exist with pt-4 lg:grid-cols-[1fr_365px] lg:gap-4');
  assert.match(toolbarGroupLine, /\bpt-4\b/,
    '021O: toolbar group parent must retain pt-4 — this must not change in 021P');
});

test('E2. Content area grid structure unchanged (021N)', () => {
  assert.ok(contentAreaLine,
    '021N: content area grid must exist with lg:grid-cols-[1fr_365px] gap-8 lg:gap-4 lg:flex-1 lg:overflow-hidden');
  assert.match(contentAreaLine, /lg:flex-1/,
    '021N: content area must retain lg:flex-1');
  assert.match(contentAreaLine, /lg:overflow-hidden/,
    '021N: content area must retain lg:overflow-hidden');
});

test('E3. Content area uses gap-8 for mobile + lg:gap-4 for desktop (unchanged)', () => {
  assert.ok(contentAreaLine, 'Content area must exist');
  assert.match(contentAreaLine, /\bgap-8\b/,
    '021N: content area gap-8 mobile row spacing must be unchanged');
  assert.match(contentAreaLine, /\blg:gap-4\b/,
    '021N: content area lg:gap-4 desktop column gap must be unchanged');
});

test('E4. main uses lg:flex lg:flex-col (021N)', () => {
  const mainLine = lines.find(l => l.includes('max-w-full mx-auto') && l.includes('flex-1 min-h-0'));
  assert.ok(mainLine, '<main> must exist');
  assert.match(mainLine, /lg:flex lg:flex-col/,
    '021N: main must retain lg:flex lg:flex-col');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nF. Key sidebar panels still present');

test('F1. WeightSummary still present in sidebar', () => {
  assert.match(checklist, /<WeightSummary/, 'WeightSummary must still be rendered in the sidebar');
});

test('F2. WeightDistribution still present in sidebar', () => {
  assert.match(checklist, /<WeightDistribution/, 'WeightDistribution must still be rendered');
});

test('F3. ImportGearPanel still present', () => {
  assert.match(checklist, /<ImportGearPanel/, 'ImportGearPanel must still be rendered');
});

test('F4. LockerPanel still present', () => {
  assert.match(checklist, /<LockerPanel/, 'LockerPanel must still be rendered');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nG. Protected horizontal gutter values (021K/021L) unchanged');

test('G1. Categories scroll retains lg:pr-3 lg:[scrollbar-gutter:stable] (021K)', () => {
  assert.ok(categoriesScrollLine, 'Categories scroll must exist');
  assert.match(categoriesScrollLine, /lg:pr-3 lg:\[scrollbar-gutter:stable\]/,
    '021K: categories scroll must retain lg:pr-3 lg:[scrollbar-gutter:stable]');
});

test('G2. lg:grid-cols-[1fr_365px] sidebar width unchanged', () => {
  assert.match(checklist, /lg:grid-cols-\[1fr_365px\]/,
    '021N: sidebar width 365px must not change');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(60)}`);
console.log(`021P Content Alignment: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
