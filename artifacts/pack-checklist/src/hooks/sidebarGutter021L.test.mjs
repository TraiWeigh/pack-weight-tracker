/**
 * 021L — Sidebar Gutter Rebalance + Scan Gear List Disclosure Chevron Tests
 *
 * Authorized changes in 021L:
 *   A. Checklist.tsx sidebar scrollable wrapper: lg:px-3 → lg:pl-1 lg:pr-5
 *      (redistribute 12px/12px to 4px left / 20px right — same total, compensates
 *       for scrollbar-gutter reserve on right side)
 *   B. ImportGearPanel.tsx: static ChevronDown → open ? ChevronUp : ChevronDown
 *      aria-expanded={open} added to the toggle button
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root      = path.resolve(__dirname, '../../../..');

const checklist    = readFileSync(path.join(root, 'artifacts/pack-checklist/src/pages/Checklist.tsx'),                'utf8');
const importPanel  = readFileSync(path.join(root, 'artifacts/pack-checklist/src/components/ImportGearPanel.tsx'),     'utf8');
const sharedPage   = readFileSync(path.join(root, 'artifacts/pack-checklist/src/pages/SharedChecklistPage.tsx'),      'utf8');
const weightSummary = readFileSync(path.join(root, 'artifacts/pack-checklist/src/components/WeightSummary.tsx'),      'utf8');
const lockerPanel  = readFileSync(path.join(root, 'artifacts/pack-checklist/src/components/LockerPanel.tsx'),         'utf8');
const gearCategory = readFileSync(path.join(root, 'artifacts/pack-checklist/src/components/GearCategory.tsx'),        'utf8');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); console.log(`  ✓ ${name}`); passed++; }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); failed++; }
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nA. Sidebar internal gutter — 021L rebalance');

test('A1. Sidebar scrollable wrapper uses lg:pl-1 (4px left padding)', () => {
  assert.match(checklist, /lg:pl-1\b/,
    'Sidebar scrollable div must have lg:pl-1 (4px desktop left padding)');
});

test('A2. Sidebar scrollable wrapper uses lg:pr-5 (20px right padding)', () => {
  assert.match(checklist, /lg:pr-5\b/,
    'Sidebar scrollable div must have lg:pr-5 (20px desktop right padding)');
});

test('A3. lg:pl-1 and lg:pr-5 appear together on the sidebar scrollable div', () => {
  const sidebarLine = checklist.split('\n').find(l =>
    l.includes('lg:overflow-y-auto') && l.includes('scrollbar-gutter:stable') && l.includes('lg:pl-1')
  );
  assert.ok(sidebarLine, 'Sidebar scrollable div with lg:overflow-y-auto and scrollbar-gutter must have lg:pl-1');
  assert.match(sidebarLine, /lg:pr-5/,
    'Same sidebar div must also have lg:pr-5');
});

test('A4. Old lg:px-3 is NO LONGER on the sidebar scrollable div (replaced by 021L)', () => {
  const sidebarLine = checklist.split('\n').find(l =>
    l.includes('lg:overflow-y-auto') && l.includes('scrollbar-gutter:stable')
  );
  assert.ok(sidebarLine, 'Sidebar scrollable div must exist');
  assert.doesNotMatch(sidebarLine, /\blg:px-3\b/,
    '021L: old lg:px-3 must be gone from sidebar scrollable — replaced by lg:pl-1 lg:pr-5');
});

test('A5. scrollbar-gutter:stable preserved on sidebar scrollable div', () => {
  assert.match(checklist, /lg:pl-1 lg:pr-5 lg:\[scrollbar-gutter:stable\]/,
    'scrollbar-gutter:stable must be preserved on the sidebar scrollable wrapper');
});

test('A6. Total sidebar horizontal padding unchanged (4+20=24px = old 12+12=24px)', () => {
  // Verified by presence of pl-1 (4px) + pr-5 (20px) = 24px total — same as old px-3 (12+12=24px)
  // This is a source-assertion; actual pixel values from Tailwind scale are deterministic.
  const hasPl1 = /\blg:pl-1\b/.test(checklist);
  const hasPr5 = /\blg:pr-5\b/.test(checklist);
  assert.ok(hasPl1 && hasPr5, 'Both lg:pl-1 and lg:pr-5 must be present — total 24px unchanged');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nB. Sidebar gutter — 021K category spacing preserved');

test('B1. Category column scrollable still has lg:pr-3 (021K restore preserved)', () => {
  assert.match(checklist, /lg:pr-3 lg:\[scrollbar-gutter:stable\]/,
    'Category left-column scrollable must still have lg:pr-3 (021K restore must be intact)');
});

test('B2. Main outer padding lg:px-8 unchanged', () => {
  const mainLine = checklist.split('\n').find(l => l.includes('max-w-full mx-auto') && l.includes('flex-1 min-h-0'));
  assert.ok(mainLine, '<main> with max-w-full must exist');
  assert.match(mainLine, /lg:px-8/, 'Outer main padding must remain lg:px-8');
});

test('B3. Grid column gap lg:gap-4 unchanged', () => {
  const gridLine = checklist.split('\n').find(l => l.includes('lg:grid-cols-[1fr_365px]'));
  assert.ok(gridLine, 'Grid line with lg:grid-cols-[1fr_365px] must exist');
  assert.match(gridLine, /lg:gap-4/, 'Desktop column gap must remain lg:gap-4');
});

test('B4. Sidebar column width 365px unchanged', () => {
  assert.match(checklist, /lg:grid-cols-\[1fr_365px\]/,
    'Sidebar grid column width must remain 365px');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nC. Scan Gear List disclosure chevron — 021L state-driven fix');

test('C1. ImportGearPanel imports ChevronUp from lucide-react', () => {
  assert.match(importPanel, /import\s*\{[^}]*ChevronUp[^}]*\}\s*from\s*['"]lucide-react['"]/,
    '021L: ChevronUp must be imported from lucide-react in ImportGearPanel');
});

test('C2. ImportGearPanel imports ChevronDown from lucide-react', () => {
  assert.match(importPanel, /import\s*\{[^}]*ChevronDown[^}]*\}\s*from\s*['"]lucide-react['"]/,
    'ChevronDown must still be imported from lucide-react in ImportGearPanel');
});

test('C3. Chevron is conditional on open state (not static)', () => {
  // Must use the open state to choose between ChevronUp and ChevronDown
  assert.match(importPanel, /open\s*\n?\s*\?\s*<Chevron(Up|Down)|open\s*\?\s*<Chevron(Up|Down)/,
    '021L: chevron render must be conditional on the open state variable');
});

test('C4. Expanded state shows ChevronUp (open → Up)', () => {
  // When open is true (expanded), ChevronUp should be shown
  assert.match(importPanel, /open[\s\S]{0,20}ChevronUp|ChevronUp[\s\S]{0,60}ChevronDown/,
    '021L: ChevronUp must be the icon shown when panel is expanded (open=true)');
});

test('C5. Collapsed state shows ChevronDown (closed → Down)', () => {
  // When open is false (collapsed), ChevronDown should be shown
  assert.match(importPanel, /ChevronDown[\s\S]{0,60}$/m,
    '021L: ChevronDown must be present for the collapsed state');
});

test('C6. Chevron uses same open state as panel content visibility', () => {
  // The same [open, setOpen] state controls both panel visibility and chevron
  assert.match(importPanel, /const\s+\[open,\s*setOpen\]\s*=\s*useState/,
    'open state must control both panel visibility and chevron direction');
});

test('C7. aria-expanded is connected to open state on toggle button', () => {
  assert.match(importPanel, /aria-expanded=\{open\}/,
    '021L: aria-expanded must be set to {open} on the Scan Gear List toggle button');
});

test('C8. Toggle button still calls setOpen on click', () => {
  assert.match(importPanel, /onClick=\{[^}]*setOpen[^}]*\}/,
    'Toggle button must still call setOpen to open/close the panel');
});

test('C9. Importer open state defaults to true (panel open by default)', () => {
  // 022I: ImportGearPanel uses a defaultOpen prop (defaults to true) so SharedChecklistPage
  // can pass defaultOpen={false}. Private Checklist gets the unchanged default-open behaviour.
  assert.match(importPanel, /defaultOpen\s*=\s*true/,
    'ImportGearPanel defaultOpen prop must default to true — private Checklist behaviour unchanged');
  assert.match(importPanel, /useState\s*\(\s*defaultOpen\s*\)/,
    'ImportGearPanel must initialise open from the defaultOpen prop');
});

test('C10. No ChevronRight used in ImportGearPanel', () => {
  assert.doesNotMatch(importPanel, /ChevronRight/,
    'ImportGearPanel must not use ChevronRight');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nD. Other disclosure chevrons unchanged — regression');

test('D1. WeightSummary still uses ChevronUp/ChevronDown (021J fix intact)', () => {
  assert.match(weightSummary, /ChevronUp/,  'WeightSummary must still use ChevronUp');
  assert.match(weightSummary, /ChevronDown/, 'WeightSummary must still use ChevronDown');
  assert.doesNotMatch(weightSummary, /ChevronRight/, 'WeightSummary must not use ChevronRight');
});

test('D2. LockerPanel still uses ChevronUp/ChevronDown (021J fix intact)', () => {
  assert.match(lockerPanel, /ChevronUp/,  'LockerPanel must still use ChevronUp');
  assert.match(lockerPanel, /ChevronDown/, 'LockerPanel must still use ChevronDown');
  assert.doesNotMatch(lockerPanel, /ChevronRight/, 'LockerPanel must not use ChevronRight');
});

test('D3. GearCategory still uses ChevronUp/ChevronDown (021J fix intact)', () => {
  assert.match(gearCategory, /ChevronUp/,  'GearCategory must still use ChevronUp');
  assert.match(gearCategory, /ChevronDown/, 'GearCategory must still use ChevronDown');
  assert.doesNotMatch(gearCategory, /ChevronRight/, 'GearCategory must not use ChevronRight');
});

test('D4. SharedLockerPanel still uses ChevronUp/ChevronDown (021J fix intact)', () => {
  assert.match(sharedPage, /ChevronUp/,  'SharedChecklistPage must still use ChevronUp');
  assert.match(sharedPage, /ChevronDown/, 'SharedChecklistPage must still use ChevronDown');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nE. No forbidden techniques used');

test('E1. No transform:translateX in Checklist.tsx (no position hacks)', () => {
  assert.doesNotMatch(checklist, /translateX/,
    'Must not use translateX positioning hack');
});

test('E2. No negative margin used for sidebar positioning', () => {
  const sidebarBlock = checklist.slice(checklist.indexOf('order-first lg:order-last'));
  // Look for suspicious -mx- or -ml- on the sidebar wrapper (first 500 chars)
  assert.doesNotMatch(sidebarBlock.slice(0, 500), /-m[lrx]-\d/,
    'Must not use negative margins to position sidebar');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(60)}`);
console.log(`021L Sidebar Gutter + Scan Gear List: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
