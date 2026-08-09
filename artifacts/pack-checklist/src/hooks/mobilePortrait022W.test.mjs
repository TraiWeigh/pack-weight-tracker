/**
 * mobilePortrait022W.test.mjs
 *
 * Prompt 022W — Correct Mobile Portrait Toolbar Layout with Explicit Rows
 *
 * Verifies that the left toolbar panel uses explicit flex-col rows on portrait
 * (instead of 022V's flex-wrap approach), eliminating the absolute-pill overlap
 * bug that was triggered on real iPhones.
 *
 * Layout guaranteed:
 *   Portrait mobile:
 *     Row 1: File-name pill (in normal flow, w-full centered)
 *     Row 2: [Open|Close] + [Imperial|Metric] (UnitToggle)
 *     Row 3: [Hide] + [Preview]
 *   Desktop (lg+):
 *     Single flex-row: [Open|Close] ... [pill: lg:absolute centered] ... [Hide][Preview][UnitToggle]
 *
 * Header portrait layout:
 *   Row 1: Logo + portrait-only Account/Guest button
 *   Row 2: New / Undo / Redo / Save / Reset (centered, scrollable)
 *   sm+: reverts to single-row layout
 *
 * Invariants preserved:
 *   - 022T/022U fixes (mergeLockerEntries, min-h-[100dvh])
 *   - Desktop two-column grid (lg:grid-cols-[1fr_365px])
 *   - lg:pr-7 on left panel
 *   - Open/Close always together (segmented control)
 *   - Imperial/Metric always together (segmented control)
 *   - Footer in normal document flow
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

console.log('\n022W — Mobile Portrait Toolbar: Explicit Rows\n');

// ─── §A  Left panel outer — flex-col on mobile ────────────────────────────────

console.log('A. Left toolbar panel outer container');

test('A1. Left panel outer uses flex-col items-center on mobile', () => {
  assert.ok(
    checklistSrc.includes('pb-3 flex flex-col items-center gap-2'),
    '022W: outer container must be "pb-3 flex flex-col items-center gap-2"',
  );
});

test('A2. Left panel switches to lg:flex-row on desktop', () => {
  assert.ok(
    checklistSrc.includes('lg:flex lg:flex-row lg:items-center'),
    '022W: outer container must switch to lg:flex-row on desktop',
  );
});

test('A3. Left panel retains lg:pr-7 (desktop spacing preserved)', () => {
  assert.ok(
    checklistSrc.includes('lg:pr-7'),
    '022W: lg:pr-7 must be present on the left panel',
  );
});

test('A4. Left panel uses lg:relative (not bare relative) for desktop pill positioning', () => {
  assert.ok(
    checklistSrc.includes('lg:relative'),
    '022W: pill absolute positioning requires lg:relative on the desktop flex-row container',
  );
});

test('A5. Left panel outer does NOT use flex-wrap (022V approach replaced)', () => {
  // 022V's flex-wrap approach is superseded by explicit rows in 022W.
  // The outer container comment and class must not contain flex-wrap.
  const leftPanelStart = checklistSrc.indexOf('Pinned pills row');
  const rightPanelStart = checklistSrc.indexOf('Right toolbar panel');
  const leftPanelBlock = checklistSrc.slice(leftPanelStart, leftPanelStart + 300);
  assert.ok(
    !leftPanelBlock.includes('flex-wrap'),
    '022W: outer container first 300 chars must not contain flex-wrap',
  );
});

// ─── §B  Row 1 — File-name pill in normal flow on mobile ─────────────────────

console.log('\nB. Row 1 — File-name pill');

test('B1. Pill is in normal flow on mobile (w-full flex justify-center)', () => {
  assert.ok(
    checklistSrc.includes('w-full flex justify-center pointer-events-none'),
    '022W: pill wrapper must use w-full flex justify-center on mobile (in normal flow)',
  );
});

test('B2. Pill uses lg:absolute lg:inset-0 for desktop centering', () => {
  assert.ok(
    checklistSrc.includes('lg:absolute lg:inset-0'),
    '022W: pill must use lg:absolute lg:inset-0 for desktop absolute centering',
  );
});

test('B3. Pill wrapper has pointer-events-none (clicks pass through)', () => {
  const pillStart = checklistSrc.indexOf('w-full flex justify-center pointer-events-none');
  assert.ok(pillStart > -1, 'Pill wrapper not found');
  const pillBlock = checklistSrc.slice(pillStart, pillStart + 200);
  assert.ok(pillBlock.includes('pointer-events-none'), 'pointer-events-none must be on pill wrapper');
});

test('B4. Pill appears before Open/Close in source order (Row 1 before Row 2)', () => {
  // Search within the left panel block to avoid the UnitToggle function definition which
  // uses the same container class and appears earlier in the file.
  const panelStart = checklistSrc.indexOf('Pinned pills row');
  assert.ok(panelStart > -1, 'Left panel marker not found');
  const panelBlock = checklistSrc.slice(panelStart, panelStart + 8000);
  const pillPos  = panelBlock.indexOf('w-full flex justify-center pointer-events-none');
  const openPos  = panelBlock.indexOf('setAllOpen(true)'); // unique to Open/Close segmented control
  assert.ok(pillPos  > -1, 'Pill wrapper not found in panel block');
  assert.ok(openPos  > -1, 'Open/Close setAllOpen(true) not found in panel block');
  assert.ok(pillPos < openPos, '022W: Pill (Row 1) must appear before Open/Close (Row 2) in source');
});

// ─── §C  Row 2 — [Open|Close] + [Imperial|Metric] ────────────────────────────

console.log('\nC. Row 2 — Open/Close + UnitToggle (mobile)');

test('C1. Open/Close segmented control is in Row 2', () => {
  const row2Start = checklistSrc.indexOf('Row 2 (mobile)');
  assert.ok(row2Start > -1, 'Row 2 comment marker not found');
  const row2Block = checklistSrc.slice(row2Start, row2Start + 1200);
  // setAllOpen(true) triggers Open, setAllOpen(false) triggers Close — both unique to this segmented control
  assert.ok(
    row2Block.includes('setAllOpen(true)'),
    '022W: Open button (setAllOpen(true)) must appear in Row 2 block',
  );
  assert.ok(
    row2Block.includes('setAllOpen(false)'),
    '022W: Close button (setAllOpen(false)) must appear in Row 2 block',
  );
});

test('C2. UnitToggle appears in Row 2 mobile context (lg:hidden wrapper)', () => {
  // The mobile UnitToggle in Row 2 is wrapped in a lg:hidden div so it disappears on desktop.
  assert.ok(
    checklistSrc.includes('lg:hidden') && checklistSrc.includes('<UnitToggle'),
    '022W: UnitToggle must have a lg:hidden wrapper for mobile Row 2',
  );
});

test('C3. Open/Close container has no flex-wrap (segmented control stays on one line)', () => {
  const containerStart = checklistSrc.indexOf('flex items-center bg-muted rounded-lg p-0.5 gap-0.5');
  const containerBlock = checklistSrc.slice(containerStart, containerStart + 50);
  assert.ok(!containerBlock.includes('flex-wrap'), 'Open/Close inner container must NOT have flex-wrap');
});

// ─── §D  Row 3 — Mobile-only [Hide] + [Preview] ──────────────────────────────

console.log('\nD. Row 3 — Hide + Preview (mobile-only, lg:hidden)');

test('D1. Row 3 mobile Hide+Preview div is lg:hidden', () => {
  const row3Start = checklistSrc.indexOf('Row 3 (mobile)');
  assert.ok(row3Start > -1, 'Row 3 comment marker not found');
  // Need 300 chars to cover the multiline comment + div opening tag
  const row3Block = checklistSrc.slice(row3Start, row3Start + 300);
  assert.ok(
    row3Block.includes('lg:hidden'),
    '022W: Row 3 mobile div must use lg:hidden to disappear on desktop',
  );
});

test('D2. Mobile Row 3 contains Hide button', () => {
  const row3Start = checklistSrc.indexOf('Row 3 (mobile)');
  const row3Block = checklistSrc.slice(row3Start, row3Start + 700);
  assert.ok(
    row3Block.includes('aria-label="Hide interface'),
    '022W: Row 3 must contain the Hide button',
  );
});

test('D3. Mobile Row 3 contains Preview button', () => {
  const row3Start = checklistSrc.indexOf('Row 3 (mobile)');
  // Need 1200 chars to cover comment + Hide button (with disabled/title logic) + Preview button
  const row3Block = checklistSrc.slice(row3Start, row3Start + 1200);
  assert.ok(
    row3Block.includes('setShowPreview(true)'),
    '022W: Row 3 must contain the Preview button (setShowPreview(true))',
  );
});

// ─── §E  Desktop-only right group ────────────────────────────────────────────

console.log('\nE. Desktop-only right group (hidden lg:flex ... ml-auto)');

test('E1. Desktop right group uses hidden lg:flex', () => {
  assert.ok(
    checklistSrc.includes('hidden lg:flex items-center gap-3 ml-auto flex-shrink-0'),
    '022W: desktop right group must use "hidden lg:flex items-center gap-3 ml-auto flex-shrink-0"',
  );
});

test('E2. Desktop right group contains Hide button', () => {
  const desktopGroupStart = checklistSrc.indexOf('hidden lg:flex items-center gap-3 ml-auto flex-shrink-0');
  const desktopBlock = checklistSrc.slice(desktopGroupStart, desktopGroupStart + 1400);
  assert.ok(
    desktopBlock.includes('aria-label="Hide interface'),
    '022W: desktop right group must contain Hide button',
  );
});

test('E3. Desktop right group contains Preview button', () => {
  const desktopGroupStart = checklistSrc.indexOf('hidden lg:flex items-center gap-3 ml-auto flex-shrink-0');
  const desktopBlock = checklistSrc.slice(desktopGroupStart, desktopGroupStart + 1400);
  assert.ok(
    desktopBlock.includes('setShowPreview(true)'),
    '022W: desktop right group must contain Preview button',
  );
});

test('E4. Desktop right group ends with UnitToggle (last item)', () => {
  // UnitToggle is the last element in the desktop right group.
  const desktopGroupStart = checklistSrc.indexOf('hidden lg:flex items-center gap-3 ml-auto flex-shrink-0');
  const desktopBlock = checklistSrc.slice(desktopGroupStart, desktopGroupStart + 1400);
  const previewPos   = desktopBlock.lastIndexOf('setShowPreview(true)');
  const unitTogglePos = desktopBlock.indexOf('<UnitToggle');
  assert.ok(previewPos   > -1, 'Preview not found in desktop right group');
  assert.ok(unitTogglePos > -1, 'UnitToggle not found in desktop right group');
  assert.ok(unitTogglePos > previewPos, '022W: UnitToggle must appear after Preview in desktop right group');
});

test('E5. Desktop right group source order: Hide → Preview → UnitToggle', () => {
  const hidePos    = checklistSrc.lastIndexOf('aria-label="Hide interface');
  const previewPos = checklistSrc.lastIndexOf('setShowPreview(true)');
  const togglePos  = checklistSrc.lastIndexOf('<UnitToggle');
  assert.ok(hidePos    > -1, 'Hide aria-label not found');
  assert.ok(previewPos > -1, 'setShowPreview(true) not found');
  assert.ok(togglePos  > -1, '<UnitToggle not found');
  assert.ok(hidePos < previewPos,  `Desktop: Hide (${hidePos}) must come before Preview (${previewPos})`);
  assert.ok(previewPos < togglePos, `Desktop: Preview (${previewPos}) must come before UnitToggle (${togglePos})`);
});

// ─── §F  Header two-row portrait layout ──────────────────────────────────────

console.log('\nF. Header two-row portrait layout');

test('F1. Header inner container uses flex-col sm:flex-row', () => {
  assert.ok(
    checklistSrc.includes('flex flex-col sm:flex-row'),
    '022W: header inner container must use flex-col on portrait, sm:flex-row on sm+',
  );
});

test('F2. Header has sm:h-16 (two-row portrait, single-row at sm+)', () => {
  assert.ok(
    checklistSrc.includes('sm:h-16'),
    '022W: header must use sm:h-16 so portrait can use two rows without fixed height',
  );
});

test('F3. Portrait-only Account/Guest button in logo row (sm:hidden)', () => {
  // A portrait-only copy of the Account/Guest button is in the logo row (sm:hidden).
  const logoRowStart = checklistSrc.indexOf('Logo row');
  assert.ok(logoRowStart > -1, 'Logo row marker not found');
  const logoRowBlock = checklistSrc.slice(logoRowStart, logoRowStart + 1200);
  assert.ok(
    logoRowBlock.includes('sm:hidden'),
    '022W: portrait-only Account button in logo row must use sm:hidden',
  );
});

test('F4. Actions row divider is hidden on portrait (hidden sm:block)', () => {
  assert.ok(
    checklistSrc.includes('hidden sm:block') &&
    checklistSrc.includes('bg-border') &&
    checklistSrc.includes('mx-1'),
    '022W: header divider must use hidden sm:block to hide on portrait',
  );
});

test('F5. sm+ Account/Guest block is hidden on portrait (hidden sm:flex)', () => {
  // The original Account/Guest block in the actions row is wrapped in hidden sm:flex.
  assert.ok(
    checklistSrc.includes('hidden sm:flex'),
    '022W: sm+ Account block in actions row must use hidden sm:flex',
  );
});

test('F6. Header retains px-4 sm:px-6 lg:px-8 padding', () => {
  const headerStart = checklistSrc.indexOf('<header ');
  const headerEnd   = checklistSrc.indexOf('</header>');
  const headerBlock = checklistSrc.slice(headerStart, headerEnd);
  assert.ok(
    headerBlock.includes('px-4') && headerBlock.includes('sm:px-6') && headerBlock.includes('lg:px-8'),
    '022W: header must retain full px-4 sm:px-6 lg:px-8 padding chain',
  );
});

// ─── §G  Desktop layout invariants preserved ─────────────────────────────────

console.log('\nG. Desktop layout preserved');

test('G1. Toolbar group uses two-column desktop grid', () => {
  assert.ok(
    checklistSrc.includes('grid grid-cols-1 lg:grid-cols-[1fr_365px]'),
    '022W: toolbar group grid must preserve lg:grid-cols-[1fr_365px] desktop layout',
  );
});

test('G2. Right panel retains order-first lg:order-last', () => {
  assert.ok(
    checklistSrc.includes('order-first lg:order-last'),
    '022W: right panel (Background Edit / Share) must retain order-first lg:order-last',
  );
});

test('G3. lg:pr-7 on left toolbar panel (desktop gutter preserved)', () => {
  assert.ok(
    checklistSrc.includes('lg:pr-7'),
    '022W: lg:pr-7 must be present on the left toolbar panel',
  );
});

// ─── §H  No floating pill on portrait ────────────────────────────────────────

console.log('\nH. Pill does not overlap controls on portrait');

test('H1. Pill wrapper is NOT bare absolute (would float over portrait rows)', () => {
  // The old 022V pill used 'absolute inset-0' unconditionally, which caused overlap.
  // In 022W the absolute positioning is lg:-prefixed (desktop only).
  // There must be no className that starts 'absolute inset-0 pb-3' without lg: prefix.
  assert.ok(
    !checklistSrc.includes('"absolute inset-0 pb-3'),
    '022W: pill wrapper must NOT start with bare "absolute inset-0" (old overlap-causing pattern)',
  );
});

test('H2. Pill wrapper mobile class starts with w-full (in-flow block)', () => {
  assert.ok(
    checklistSrc.includes('w-full flex justify-center pointer-events-none'),
    '022W: pill wrapper mobile class must start with w-full (puts pill in normal flow)',
  );
});

// ─── §I  Regression — 022T/022U preserved ────────────────────────────────────

console.log('\nI. Regression — prior fixes preserved');

test('I1. 022U min-h-[100dvh] mobile scroll fix preserved', () => {
  assert.ok(
    checklistSrc.includes('min-h-[100dvh]') && checklistSrc.includes('lg:h-[100dvh]'),
    '022U: mobile scroll fix must be preserved',
  );
});

test('I2. 022T mergeLockerEntries import preserved', () => {
  assert.ok(
    checklistSrc.includes('mergeLockerEntries'),
    '022T: mergeLockerEntries import must still exist',
  );
});

test('I3. Outer scroll container unchanged', () => {
  assert.ok(
    checklistSrc.includes('h-[100dvh] overflow-y-auto'),
    'Outer scroll container must be unchanged',
  );
});

test('I4. Footer is still after screen content in document flow', () => {
  const footerIdx      = checklistSrc.indexOf('<Footer');
  const screenCloseIdx = checklistSrc.indexOf('</div>{/* end screen content */}');
  assert.ok(footerIdx > screenCloseIdx, '022F: Footer must remain after screen content');
});

console.log('\nDone.');
