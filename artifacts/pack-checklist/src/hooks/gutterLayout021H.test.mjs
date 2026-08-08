/**
 * 021H — Vertical Gutter / Sidebar Centering Layout Tests
 *
 * Verifies the two CSS changes that rebalance the desktop gutters:
 *   1. Checklist.tsx <main>:  lg:px-6  → lg:px-8  (outer padding 24→32px)
 *   2. Both pages grid:       gap-8     → gap-8 lg:gap-4  (desktop col-gap 32→16px)
 *
 * These tests validate that the exact class strings are present and that no
 * unrelated layout classes were accidentally changed.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root      = path.resolve(__dirname, '../../../..');

const checklist   = readFileSync(path.join(root, 'artifacts/pack-checklist/src/pages/Checklist.tsx'),           'utf8');
const sharedPage  = readFileSync(path.join(root, 'artifacts/pack-checklist/src/pages/SharedChecklistPage.tsx'), 'utf8');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); console.log(`  ✓ ${name}`); passed++; }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); failed++; }
}

// Extract the <main> line and grid line from Checklist.tsx for targeted assertions
const checklistMainLine  = checklist.split('\n').find(l => l.includes('max-w-full mx-auto') && l.includes('flex-1 min-h-0'));
const checklistGridLine  = checklist.split('\n').find(l => l.includes('lg:grid-cols-[1fr_365px]'));

// Extract from SharedChecklistPage
const sharedMainLine     = sharedPage.split('\n').find(l => l.includes('max-w-full mx-auto') && l.includes('flex-1 min-h-0'));
const sharedGridLine     = sharedPage.split('\n').find(l => l.includes('lg:grid-cols-12'));

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nA. Checklist.tsx — outer container padding (021H change 1)');

test('A1. <main> uses lg:px-8 at desktop (increased from lg:px-6)', () => {
  assert.ok(checklistMainLine, '<main> with max-w-full must exist in Checklist.tsx');
  assert.match(checklistMainLine, /lg:px-8/,
    'Checklist.tsx <main> must have lg:px-8 (32px outer padding) after 021H');
});

test('A2. <main> does NOT still use the old lg:px-6 value', () => {
  assert.ok(checklistMainLine, '<main> with max-w-full must exist');
  assert.doesNotMatch(checklistMainLine, /lg:px-6/,
    'Checklist.tsx <main> must NOT have lg:px-6 (old 24px value replaced by lg:px-8)');
});

test('A3. <main> retains sm:px-4 for tablet (responsive intact)', () => {
  assert.ok(checklistMainLine, '<main> with max-w-full must exist');
  assert.match(checklistMainLine, /sm:px-4/,
    'Tablet (sm) padding must remain sm:px-4 — only lg breakpoint was changed');
});

test('A4. <main> retains px-3 for mobile (responsive intact)', () => {
  assert.ok(checklistMainLine, '<main> with max-w-full must exist');
  assert.match(checklistMainLine, /\bpx-3\b/,
    'Mobile base padding must remain px-3 — only lg breakpoint was changed');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nB. Checklist.tsx — grid column gap (021H change 2)');

test('B1. Grid uses lg:gap-4 at desktop (reduced from gap-8 only)', () => {
  assert.ok(checklistGridLine, 'Grid line with lg:grid-cols-[1fr_365px] must exist');
  assert.match(checklistGridLine, /lg:gap-4/,
    'Checklist grid must have lg:gap-4 (16px) at desktop to reduce middle gutter');
});

test('B2. Grid retains gap-8 for mobile/tablet row-gap', () => {
  assert.ok(checklistGridLine, 'Grid line must exist');
  assert.match(checklistGridLine, /\bgap-8\b/,
    'Mobile row-gap gap-8 must remain so stacked sections have breathing room');
});

test('B3. Grid preserves lg:grid-cols-[1fr_365px] (sidebar width unchanged)', () => {
  assert.ok(checklistGridLine, 'Grid line must exist');
  assert.match(checklistGridLine, /lg:grid-cols-\[1fr_365px\]/,
    'Grid column definition must be unchanged — sidebar still 365px, content still 1fr');
});

test('B4. Grid retains lg:h-full (height behavior unchanged)', () => {
  assert.ok(checklistGridLine, 'Grid line must exist');
  assert.match(checklistGridLine, /lg:h-full/,
    'lg:h-full must still be present — full-height layout behavior unchanged');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nC. SharedChecklistPage.tsx — outer padding (already correct pre-021H)');

test('C1. Shared <main> has lg:px-8 (pre-existing, not regressed)', () => {
  assert.ok(sharedMainLine, 'Shared <main> with max-w-full must exist');
  assert.match(sharedMainLine, /lg:px-8/,
    'SharedChecklistPage <main> must keep lg:px-8 (was already correct pre-021H)');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nD. SharedChecklistPage.tsx — grid column gap (021H change)');

test('D1. Shared grid uses lg:gap-4 at desktop', () => {
  assert.ok(sharedGridLine, 'Shared grid line with lg:grid-cols-12 must exist');
  assert.match(sharedGridLine, /lg:gap-4/,
    'SharedChecklistPage grid must have lg:gap-4 at desktop for visual consistency');
});

test('D2. Shared grid retains gap-8 for mobile row-gap', () => {
  assert.ok(sharedGridLine, 'Shared grid line must exist');
  assert.match(sharedGridLine, /\bgap-8\b/,
    'SharedChecklistPage mobile row-gap gap-8 must remain');
});

test('D3. Shared grid preserves lg:grid-cols-12 (column structure unchanged)', () => {
  assert.ok(sharedGridLine, 'Shared grid line must exist');
  assert.match(sharedGridLine, /lg:grid-cols-12/,
    'Shared page grid column definition must be unchanged');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nE. Sidebar structure preserved (no sidebar width / content changes)');

test('E1. Sidebar outer wrapper classes unchanged', () => {
  assert.match(checklist, /order-first lg:order-last lg:h-full lg:flex lg:flex-col lg:overflow-hidden/,
    'Sidebar outer wrapper classes must be unchanged');
});

test('E2. Left column scrollable lg:pr-3 RESTORED (021K — user-tested 021J gutter worse)', () => {
  // 021J removed lg:pr-3 from the left column scrollable div.
  // User-tested 021J gutter result as FAIL / visibly worse.
  // 021K restores lg:pr-3 exactly as it was before 021J.
  assert.match(checklist, /lg:pr-3 lg:\[scrollbar-gutter:stable\]/,
    '021K: lg:pr-3 must be restored on left column scrollable div (021J removal made layout worse)');
});

test('E3. Sidebar scrollable uses lg:pl-1 lg:pr-5 (021L gutter rebalance: 4px left, 20px right)', () => {
  // 021L authorized change: sidebar internal padding redistributed from equal 12px/12px
  // to asymmetric 4px left / 20px right to compensate for scrollbar-gutter reserve on right.
  assert.match(checklist, /lg:pl-1 lg:pr-5 lg:\[scrollbar-gutter:stable\]/,
    '021L: sidebar scrollable must use lg:pl-1 (4px) left and lg:pr-5 (20px) right padding');
});

test('E4. Sidebar button-row uses lg:pl-3 lg:pr-9 lg:justify-end (021M toolbar alignment)', () => {
  // 021M aligned Share button's right edge with sidebar-panel right edge.
  // justify-center → justify-center lg:justify-end (desktop right-align)
  // lg:px-3 → lg:pl-3 lg:pr-9 (left 12px, right 36px; total 48px vs old 24px;
  //   extra 24px right = pr-5(20px) + scrollbar-gutter(≈15px) ≈ 35px — nearest standard token pr-9=36px)
  const buttonRowLine = checklist.split('\n').find(l =>
    l.includes('justify-center') && l.includes('lg:justify-end') &&
    l.includes('pt-8 pb-3') && l.includes('lg:pl-3') && l.includes('lg:pr-9')
  );
  assert.ok(buttonRowLine, '021M: sidebar button row must have lg:justify-end, lg:pl-3, and lg:pr-9 for Share-to-panel right-edge alignment');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nF. No unrelated Checklist.tsx layout changes');

test('F1. Left column outer wrapper classes unchanged', () => {
  assert.match(checklist, /lg:h-full lg:flex lg:flex-col lg:overflow-hidden/,
    'Left column (gear list) outer wrapper must be unchanged');
});

test('F2. Left column pills row uses lg:pr-7 (021M toolbar alignment — Metric right edge to card right edge)', () => {
  // 021M changed lg:pr-3 (12px) → lg:pr-7 (28px) on the checklist toolbar row.
  // Extra 16px right ≈ scrollbar-gutter(≈15px) so Metric's right edge aligns with card right edges.
  const pillsLine = checklist.split('\n').find(l => l.includes('pt-8 pb-3 flex items-center lg:pr-7 flex-shrink-0'));
  assert.ok(pillsLine, '021M: Pinned pills row must use lg:pr-7 (28px right) for Metric-to-card-panel right-edge alignment');
});

test('F3. Header outer padding unchanged (separate from main)', () => {
  const headerLine = checklist.split('\n').find(l => l.includes('px-4 sm:px-6 lg:px-8 h-16 flex items-center'));
  assert.ok(headerLine, 'Header should still have its own lg:px-8 padding (unchanged)');
});

test('F4. grid-cols-1 (mobile single-column) still present', () => {
  assert.ok(checklistGridLine, 'Grid line must exist');
  assert.match(checklistGridLine, /grid-cols-1/,
    'Mobile single-column layout (grid-cols-1) must still be present');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nG. 021G + 021F regression — share/checklist functionality');

test('G1. 021G — SharedLockerPanel row is still clickable', () => {
  assert.match(sharedPage, /role="button"[\s\S]{0,100}onOpen\(file\)|onOpen\(file\)[\s\S]{0,100}role="button"/s,
    '021G row click target must still be present in SharedLockerPanel');
});

test('G2. 021G — ImportGearPanel no longer uses ChevronRight', () => {
  const importPanel = readFileSync(
    path.join(root, 'artifacts/pack-checklist/src/components/ImportGearPanel.tsx'), 'utf8'
  );
  assert.doesNotMatch(importPanel, /ChevronRight/,
    '021G ImportGearPanel must still not use ChevronRight');
});

test('G3. 021F — Share Link label preserved', () => {
  assert.match(checklist, /['"]Share Link['"]/,
    '021F Share Link menu label must still be present');
});

test('G4. 021F — Copy link, read-only label preserved', () => {
  assert.match(checklist, /Copy link, read-only/,
    '021F Share Pack List subtitle must still be present');
});

test('G5. 021C — SharedLockerPanel still defined', () => {
  assert.match(sharedPage, /function SharedLockerPanel/,
    '021C SharedLockerPanel must still be present');
});

test('G6. 021A — /checklist auth redirect still present', () => {
  assert.match(checklist, /<Redirect\s+to=["']\/sign-in["']/,
    '021A auth redirect must still be present');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nH. Responsive — mobile/tablet not harmed');

test('H1. No lg: breakpoint classes added to mobile base (gap-8 unchanged)', () => {
  // Mobile uses gap-8 for vertical row-gap when grid is single-column
  // If we had changed just "gap-8" to "gap-4" without the lg: prefix, mobile row-gap would shrink
  assert.ok(checklistGridLine?.includes('gap-8 lg:gap-4') || checklistGridLine?.includes('lg:gap-4') && checklistGridLine?.includes('gap-8'),
    'Desktop gap must be lg:gap-4 while mobile gap-8 is preserved');
});

test('H2. SharedChecklistPage mobile gap-8 preserved', () => {
  assert.ok(sharedGridLine?.includes('gap-8'), 'Mobile row-gap gap-8 on shared page must be preserved');
});

test('H3. No new max-width constraints added that could clip mobile', () => {
  assert.doesNotMatch(checklistMainLine ?? '', /max-w-(?!full)/,
    '<main> must keep max-w-full — no new max-width constraint that could clip content on mobile');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n────────────────────────────────────────────────────────────');
console.log(`021H Gutter Layout: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
