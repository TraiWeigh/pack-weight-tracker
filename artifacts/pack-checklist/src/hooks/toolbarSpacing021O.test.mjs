/**
 * 021O — Toolbar Spacing Tests
 *
 * 021O moves the entire toolbar group upward ~16 px by:
 *   1. Placing shared top spacing on the toolbar-group parent: `pt-4` (16 px)
 *   2. Removing the duplicated `pt-8` (32 px) from each child toolbar panel
 *
 * Before 021O:
 *   toolbar-group parent  → no top padding
 *   left toolbar panel    → pt-8  (32 px)
 *   right toolbar panel   → pt-8  (32 px)
 *
 * After 021O:
 *   toolbar-group parent  → pt-4  (16 px)  ← single source of truth
 *   left toolbar panel    → no pt-*        ← delegated to parent
 *   right toolbar panel   → no pt-*        ← delegated to parent
 *
 * All 021N structural invariants and all earlier padding invariants are preserved.
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

const toolbarGroupLine = lines.find(l =>
  l.includes('lg:grid-cols-[1fr_365px]') &&
  l.includes('lg:gap-4') &&
  !l.includes('gap-8')
);

// 022V: flex-shrink-0 removed; flex-wrap added; gap classes added
const leftPanelLine = lines.find(l =>
  l.includes('pb-3') &&
  l.includes('flex') &&
  l.includes('items-center') &&
  l.includes('lg:pr-7') &&
  l.includes('relative') &&
  !l.includes('inset-0')
);

const rightPanelLine = lines.find(l =>
  l.includes('pb-3') &&
  l.includes('lg:justify-end') &&
  l.includes('lg:pl-3') &&
  l.includes('lg:pr-9') &&
  l.includes('order-first')
);

const filenamePillLine = lines.find(l =>
  l.includes('absolute inset-0') &&
  l.includes('flex items-center justify-center pointer-events-none')
);

let passed = 0;
let failed = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✓ ${name}`); passed++; }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); failed++; }
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nA. Toolbar-group parent — shared top spacing');

test('A1. Toolbar group parent has pt-4 (single shared top-spacing value)', () => {
  assert.ok(toolbarGroupLine,
    'Toolbar group parent div must exist');
  assert.match(toolbarGroupLine, /\bpt-4\b/,
    '021O: toolbar group parent must have pt-4 — the single shared top-spacing value');
});

test('A2. Toolbar group parent does NOT have pt-8 (old per-child value not on parent)', () => {
  assert.ok(toolbarGroupLine, 'Toolbar group parent must exist');
  assert.doesNotMatch(toolbarGroupLine, /\bpt-8\b/,
    '021O: toolbar group parent must not use pt-8 — that was the old per-child value');
});

test('A3. Toolbar group still has grid layout and correct column template', () => {
  assert.ok(toolbarGroupLine, 'Toolbar group must exist');
  assert.match(toolbarGroupLine, /lg:grid-cols-\[1fr_365px\]/,
    '021N: toolbar group grid column template must be unchanged');
  assert.match(toolbarGroupLine, /lg:gap-4/,
    '021N: toolbar group lg:gap-4 must be unchanged');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nB. Left toolbar panel — top-spacing delegated to parent');

test('B1. Left toolbar panel exists', () => {
  assert.ok(leftPanelLine,
    '021N/021O: left toolbar panel must exist with pb-3 flex items-center lg:pr-7 relative');
});

test('B2. Left toolbar panel has NO standalone pt-8 (removed in 021O)', () => {
  assert.ok(leftPanelLine, 'Left toolbar panel must exist');
  assert.doesNotMatch(leftPanelLine, /\bpt-8\b/,
    '021O: pt-8 must be removed from the left toolbar panel — top spacing is now on the parent');
});

test('B3. Left toolbar panel retains pb-3 bottom padding', () => {
  assert.ok(leftPanelLine, 'Left toolbar panel must exist');
  assert.match(leftPanelLine, /\bpb-3\b/,
    '021O: left toolbar panel must retain pb-3 bottom padding');
});

test('B4. Left toolbar panel retains 021M lg:pr-7 horizontal alignment', () => {
  assert.ok(leftPanelLine, 'Left toolbar panel must exist');
  assert.match(leftPanelLine, /lg:pr-7/,
    '021M: lg:pr-7 on left toolbar panel must not change — horizontal position is unchanged');
});

test('B5. Left toolbar panel has no standalone top margin or translateY', () => {
  assert.ok(leftPanelLine, 'Left toolbar panel must exist');
  assert.doesNotMatch(leftPanelLine, /\bmt-\d/,
    '021O: no mt-* on left panel — vertical position controlled by parent only');
  assert.doesNotMatch(leftPanelLine, /translateY/,
    '021O: no translateY on left panel');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nC. Right toolbar panel — top-spacing delegated to parent');

test('C1. Right toolbar panel exists', () => {
  assert.ok(rightPanelLine,
    '021N/021O: right toolbar panel must exist with pb-3 lg:justify-end lg:pl-3 lg:pr-9 order-first');
});

test('C2. Right toolbar panel has NO standalone pt-8 (removed in 021O)', () => {
  assert.ok(rightPanelLine, 'Right toolbar panel must exist');
  assert.doesNotMatch(rightPanelLine, /\bpt-8\b/,
    '021O: pt-8 must be removed from the right toolbar panel — top spacing is now on the parent');
});

test('C3. Right toolbar panel retains pb-3 bottom padding', () => {
  assert.ok(rightPanelLine, 'Right toolbar panel must exist');
  assert.match(rightPanelLine, /\bpb-3\b/,
    '021O: right toolbar panel must retain pb-3 bottom padding');
});

test('C4. Right toolbar panel retains 021M lg:pl-3 lg:pr-9 lg:justify-end (horizontal unchanged)', () => {
  assert.ok(rightPanelLine, 'Right toolbar panel must exist');
  assert.match(rightPanelLine, /lg:pl-3/,
    '021M: lg:pl-3 must not change — horizontal position is unchanged');
  assert.match(rightPanelLine, /lg:pr-9/,
    '021M: lg:pr-9 must not change — horizontal position is unchanged');
  assert.match(rightPanelLine, /lg:justify-end/,
    '021M: lg:justify-end must not change — horizontal alignment is unchanged');
});

test('C5. Right toolbar panel retains order-first lg:order-last (021N mobile order)', () => {
  assert.ok(rightPanelLine, 'Right toolbar panel must exist');
  assert.match(rightPanelLine, /\border-first\b/,
    '021N: order-first must be retained on right panel');
  assert.match(rightPanelLine, /\blg:order-last\b/,
    '021N: lg:order-last must be retained on right panel');
});

test('C6. Right toolbar panel has no standalone top margin or translateY', () => {
  assert.ok(rightPanelLine, 'Right toolbar panel must exist');
  assert.doesNotMatch(rightPanelLine, /\bmt-\d/,
    '021O: no mt-* on right panel — vertical position controlled by parent only');
  assert.doesNotMatch(rightPanelLine, /translateY/,
    '021O: no translateY on right panel');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nD. Filename pill overlay — matches child panel (no independent pt-8)');

test('D1. Filename pill overlay div exists', () => {
  assert.ok(filenamePillLine,
    'Filename pill overlay (absolute inset-0 flex items-center justify-center pointer-events-none) must exist');
});

test('D2. Filename pill overlay has no pt-8 (removed to match panel — both have no top padding)', () => {
  assert.ok(filenamePillLine, 'Filename pill overlay must exist');
  assert.doesNotMatch(filenamePillLine, /\bpt-8\b/,
    '021O: pt-8 removed from filename pill overlay to match the left panel having no top padding');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nE. 021N structural invariants still intact');

test('E1. main uses lg:flex lg:flex-col (021N)', () => {
  const mainLine = lines.find(l => l.includes('max-w-full mx-auto') && l.includes('flex-1 min-h-0'));
  assert.ok(mainLine, '<main> must exist');
  assert.match(mainLine, /lg:flex lg:flex-col/, '021N: main must retain lg:flex lg:flex-col');
  assert.doesNotMatch(mainLine, /lg:overflow-hidden/, '021N: main must not revert to lg:overflow-hidden');
});

test('E2. Content area grid still has lg:flex-1 lg:min-h-0 lg:overflow-hidden (021N)', () => {
  const contentAreaLine = lines.find(l =>
    l.includes('lg:grid-cols-[1fr_365px]') &&
    l.includes('gap-8') &&
    l.includes('lg:flex-1') &&
    l.includes('lg:overflow-hidden')
  );
  assert.ok(contentAreaLine,
    '021N: content area grid must retain lg:flex-1 lg:min-h-0 lg:overflow-hidden');
});

test('E3. Categories scroll retains 021K: lg:pr-3 lg:[scrollbar-gutter:stable]', () => {
  const categoriesScrollLine = lines.find(l =>
    l.includes('lg:h-full') &&
    l.includes('lg:overflow-y-auto') &&
    l.includes('lg:pr-3') &&
    l.includes('lg:[scrollbar-gutter:stable]')
  );
  assert.ok(categoriesScrollLine,
    '021K: categories scroll must retain lg:pr-3 lg:[scrollbar-gutter:stable]');
});

test('E4. Sidebar scroll retains 021L: lg:pl-1 lg:pr-5 lg:[scrollbar-gutter:stable]', () => {
  const sidebarScrollLine = lines.find(l =>
    l.includes('lg:h-full') &&
    l.includes('lg:overflow-y-auto') &&
    l.includes('lg:pl-1') &&
    l.includes('lg:pr-5') &&
    l.includes('lg:[scrollbar-gutter:stable]')
  );
  assert.ok(sidebarScrollLine,
    '021L: sidebar scroll must retain lg:pl-1 lg:pr-5 lg:[scrollbar-gutter:stable]');
});

test('E5. Toolbar group uses lg:gap-4 (no gap-8) — unchanged from 021N', () => {
  assert.ok(toolbarGroupLine, 'Toolbar group must exist');
  assert.doesNotMatch(toolbarGroupLine, /\bgap-8\b/,
    '021N: toolbar group must not have gap-8');
  assert.match(toolbarGroupLine, /lg:gap-4/,
    '021N: toolbar group must retain lg:gap-4');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nF. Protected horizontal padding values unchanged');

test('F1. lg:px-8 outer main padding unchanged (021H)', () => {
  const mainLine = lines.find(l => l.includes('max-w-full mx-auto') && l.includes('lg:px-8'));
  assert.ok(mainLine, 'lg:px-8 outer main padding must be unchanged');
});

test('F2. lg:grid-cols-[1fr_365px] sidebar width 365px unchanged', () => {
  assert.match(checklist, /lg:grid-cols-\[1fr_365px\]/,
    'Sidebar width 365px must not change');
});

test('F3. Open / Close / Hide / Preview / UnitToggle controls still present', () => {
  assert.match(checklist, /setAllOpen\(true\)/, 'Open button must exist');
  assert.match(checklist, /setAllOpen\(false\)/, 'Close button must exist');
  assert.match(checklist, /triggerShowcase\(\)/, 'Hide button must exist');
  assert.match(checklist, /setShowPreview\(true\)/, 'Preview button must exist');
  assert.match(checklist, /<UnitToggle/, 'UnitToggle must exist');
});

test('F4. BackgroundPickerButton + Share pill still present', () => {
  assert.match(checklist, /BackgroundPickerButton/, 'BackgroundPickerButton must exist');
  assert.match(checklist, /setShowShareMenu/, 'Share pill must exist');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(60)}`);
console.log(`021O Toolbar Spacing: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
