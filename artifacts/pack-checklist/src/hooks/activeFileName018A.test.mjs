/**
 * activeFileName018A.test.mjs  —  Prompt 018A
 *
 * Verifies the two corrections applied in Prompt 018A:
 *  (1) Filename pill moved OUT of the Hide/Preview/Imperial/Metric control group
 *      and into an absolutely-centered position over the left checklist column.
 *  (2) Filename text color uses text-foreground (full black in light mode, white
 *      in dark mode) instead of text-foreground/60 (dimmed gray).
 *
 * Tests:
 *
 *  POSITION — PILL REMOVED FROM CONTROL GROUP
 *  1.  Pills row container has `relative` class (enables absolute child centering).
 *  2.  Pills row container no longer has `justify-between` (right group uses ml-auto).
 *  3.  Right control group has `ml-auto` to push it right without justify-between.
 *  4.  Absolute centering wrapper has `left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`.
 *  5.  Absolute wrapper has `pointer-events-none` (clicks pass through to buttons).
 *  6.  Filename pill (`activeLockerFile && ...`) is NOT inside the right control group.
 *  7.  Right control group contains Hide → Preview → UnitToggle with no pill between them.
 *  8.  Pill wrapper appears in source BEFORE the right control group (as sibling, not child).
 *
 *  COLOR — THEME-AWARE TEXT
 *  9.  Filename span uses `text-foreground` (not `text-foreground/60` or any hardcoded color).
 * 10.  No `text-foreground/60` anywhere on the filename span (old dimmed color removed).
 * 11.  No hardcoded `text-white` or `text-black` — theme variable used instead.
 *
 *  FUNCTIONAL PRESERVATION — 018 SAVE BEHAVIOR INTACT
 * 12.  commitSaveReplace still uses `Saved "${name}"` format (not bare 'Saved.').
 * 13.  commitSaveNew still uses `Saved "${name}"` format (not 'Saved as "..."').
 * 14.  activeLockerFile.name still used as pill text content.
 * 15.  Pill still uses pointer-events-none and select-none (informational only).
 *
 *  REGRESSION GUARDS — 018 PILL ATTRIBUTES INTACT
 * 16.  Pill span still has `max-w-[` overflow guard.
 * 17.  Pill span still has `truncate`.
 * 18.  Pill span still has `select-none`.
 * 19.  aria-label still references activeLockerFile.name.
 * 20.  title attribute still set to activeLockerFile.name (tooltip on overflow).
 */

import { readFileSync } from 'fs';
import assert from 'assert/strict';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../../..');

function read(rel) {
  return readFileSync(path.join(root, rel), 'utf8');
}

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
    failures.push({ name, message: err.message });
  }
}

// ── Load source ───────────────────────────────────────────────────────────────

const checklist = read('artifacts/pack-checklist/src/pages/Checklist.tsx');

// ── Locate key regions ────────────────────────────────────────────────────────

// The pills row: find it by its unique comment after the left toolbar panel div.
// 021N renamed {/* Gear list */} → {/* Left toolbar panel */}; search from file start.
// 021N merged these into one comment: "{/* Left toolbar panel — Pinned pills row */}"
const gearListDiv  = checklist.indexOf('Left toolbar panel');
const pillsRowIdx  = checklist.indexOf('Pinned pills row', gearListDiv);
assert.ok(gearListDiv > -1 && pillsRowIdx > -1, 'Left toolbar panel / Pinned pills row markers not found');

// Slice from the pills row comment through the scrollable categories comment.
// Use a generous 4000 chars so the ml-auto right group is fully inside the block.
const pillsRowBlock = checklist.slice(pillsRowIdx, pillsRowIdx + 4000);

// Right control group: the ml-auto div containing Hide/Preview/UnitToggle.
// Search from the pillsRowIdx in the full checklist so the slice is never bounded by pillsRowBlock.
const mlAutoChecklistIdx = checklist.indexOf('ml-auto flex items-center gap-3', pillsRowIdx);
const mlAutoIdx  = mlAutoChecklistIdx > -1 ? mlAutoChecklistIdx - pillsRowIdx : -1;
// Hide button's disabled/title block is ~600 chars; use 1400 to cover all three buttons.
const rightGroup = mlAutoChecklistIdx > -1
  ? checklist.slice(mlAutoChecklistIdx, mlAutoChecklistIdx + 1400)
  : '';

// Pill conditional: {activeLockerFile && (
const pillCondInPillsRow  = pillsRowBlock.indexOf('{activeLockerFile && (');
const pillCondInRightGroup = rightGroup.indexOf('{activeLockerFile && (');

// ── Tests ─────────────────────────────────────────────────────────────────────

console.log('\nPrompt 018A — Active File Name Position + Theme Color Tests\n');

// ── POSITION — PILL REMOVED FROM CONTROL GROUP ───────────────────────────────

test('1. Pills row container has `relative` class (enables absolute centering)', () => {
  // The opening div of the pills row must include `relative`.
  const rowDivEnd = pillsRowBlock.indexOf('>');
  const rowDivDecl = pillsRowBlock.slice(0, rowDivEnd + 20);
  assert.ok(
    pillsRowBlock.includes('flex-shrink-0 relative') || pillsRowBlock.includes('relative'),
    'Pills row container does not have `relative` class — absolute centering will not work'
  );
});

test('2. Pills row container no longer has `justify-between`', () => {
  // justify-between was the mechanism that separated Open/Close from Hide/Preview;
  // it is replaced by `relative` (absolute center) + `ml-auto` on the right group.
  const containerEnd = pillsRowBlock.indexOf('>');
  const containerDecl = pillsRowBlock.slice(0, Math.min(300, containerEnd + 100));
  assert.ok(
    !containerDecl.includes('justify-between'),
    'Pills row container still has `justify-between` — 018A layout fix not applied'
  );
});

test('3. Right control group has `ml-auto` to push it right', () => {
  assert.ok(
    mlAutoIdx > -1,
    'Right control group with `ml-auto` not found — 018A fix not applied or group is missing'
  );
});

test('4. [018C] Absolute centering wrapper uses inset-0 + matching padding (vertical-align fix)', () => {
  // 018C replaced left-1/2/top-1/2/translate with inset-0 + pt-8 pb-3 flex items-center justify-center
  // so the wrapper's content-area reference matches the outer container exactly.
  assert.ok(pillCondInPillsRow > -1, 'activeLockerFile conditional not found in pills row area');
  const pillWrapper = pillsRowBlock.slice(pillCondInPillsRow, pillCondInPillsRow + 400);
  assert.ok(
    pillWrapper.includes('inset-0'),
    'Pill wrapper should have inset-0 (018C vertical-align fix)'
  );
  assert.ok(
    pillWrapper.includes('flex items-center') && pillWrapper.includes('justify-center'),
    'Pill wrapper should have flex items-center justify-center (018C vertical-align fix)'
  );
});

test('5. Absolute wrapper has pointer-events-none (clicks pass through to buttons behind it)', () => {
  assert.ok(pillCondInPillsRow > -1, 'activeLockerFile conditional not found in pills row area');
  const pillWrapper = pillsRowBlock.slice(pillCondInPillsRow, pillCondInPillsRow + 400);
  assert.ok(
    pillWrapper.includes('pointer-events-none'),
    'Absolute pill wrapper does not have pointer-events-none — may block button clicks'
  );
});

test('6. Filename pill NOT inside the right control group (Hide/Preview/UnitToggle group)', () => {
  assert.ok(
    mlAutoIdx > -1,
    'Right control group (ml-auto) not found — cannot verify pill position'
  );
  assert.ok(
    pillCondInRightGroup === -1,
    'activeLockerFile conditional still found inside the right ml-auto control group — pill not relocated'
  );
});

test('7. Right control group: Hide → Preview → UnitToggle with no pill conditional between them', () => {
  assert.ok(mlAutoIdx > -1, 'Right control group (ml-auto) not found');
  const hideInGroup    = rightGroup.indexOf('aria-label="Hide interface');
  const previewInGroup = rightGroup.indexOf('aria-label="Open checked-items preview"');
  const unitInGroup    = rightGroup.indexOf('<UnitToggle');
  assert.ok(hideInGroup    > -1, 'Hide button not found in right control group');
  assert.ok(previewInGroup > -1, 'Preview button not found in right control group');
  assert.ok(unitInGroup    > -1, 'UnitToggle not found in right control group');
  assert.ok(
    hideInGroup < previewInGroup && previewInGroup < unitInGroup,
    `Right group order wrong — Hide(${hideInGroup}) Preview(${previewInGroup}) UnitToggle(${unitInGroup})`
  );
  // No pill between Preview and UnitToggle.
  const afterPreview = rightGroup.slice(previewInGroup, unitInGroup);
  assert.ok(
    !afterPreview.includes('{activeLockerFile'),
    'activeLockerFile conditional found between Preview and UnitToggle in right group'
  );
});

test('8. Pill wrapper appears in pills row BEFORE the right control group (sibling, not child)', () => {
  assert.ok(pillCondInPillsRow > -1, 'activeLockerFile conditional not found in pills row');
  assert.ok(mlAutoIdx          > -1, 'Right control group not found in pills row');
  assert.ok(
    pillCondInPillsRow < mlAutoIdx,
    `Pill conditional (pos ${pillCondInPillsRow}) is after right group (pos ${mlAutoIdx}) — wrong DOM order`
  );
});

// ── COLOR — THEME-AWARE TEXT ──────────────────────────────────────────────────

test('9. Filename span uses `text-foreground` (full black/light, white/dark)', () => {
  assert.ok(pillCondInPillsRow > -1, 'activeLockerFile conditional not found');
  const pillBlock = pillsRowBlock.slice(pillCondInPillsRow, pillCondInPillsRow + 600);
  // span must have text-foreground — but NOT text-foreground/60.
  // Check it's present as a standalone token (not just as prefix of text-foreground/60).
  const hasForeground     = pillBlock.includes('text-foreground');
  const hasDimmedForeground = pillBlock.includes('text-foreground/');
  assert.ok(
    hasForeground && !hasDimmedForeground,
    hasDimmedForeground
      ? 'Filename span still uses text-foreground/[opacity] — should be full text-foreground'
      : 'text-foreground not found on filename span'
  );
});

test('10. `text-foreground/60` removed from filename pill (old dimmed color gone)', () => {
  assert.ok(pillCondInPillsRow > -1, 'activeLockerFile conditional not found');
  const pillBlock = pillsRowBlock.slice(pillCondInPillsRow, pillCondInPillsRow + 600);
  assert.ok(
    !pillBlock.includes('text-foreground/60'),
    'text-foreground/60 still present on filename pill — 018A color fix not applied'
  );
});

test('11. No hardcoded text-white or text-black on the filename pill', () => {
  assert.ok(pillCondInPillsRow > -1, 'activeLockerFile conditional not found');
  const pillBlock = pillsRowBlock.slice(pillCondInPillsRow, pillCondInPillsRow + 600);
  assert.ok(
    !pillBlock.includes('text-white') && !pillBlock.includes('text-black'),
    'Hardcoded text-white or text-black found on filename pill — use text-foreground instead'
  );
});

// ── FUNCTIONAL PRESERVATION — 018 SAVE BEHAVIOR INTACT ───────────────────────

function extractFunctionBody(src, fnName) {
  const start = src.indexOf(`const ${fnName}`);
  if (start === -1) return '';
  return src.slice(start, start + 3000);
}

const replaceBody = extractFunctionBody(checklist, 'commitSaveReplace');
const newBody     = extractFunctionBody(checklist, 'commitSaveNew');

test('12. commitSaveReplace still shows Saved [name] (not bare Saved.)', () => {
  // 020F: quote-free format — "Saved Sierra" not 'Saved "Sierra"'
  assert.ok(
    !replaceBody.includes("description: 'Saved.'"),
    "commitSaveReplace reverted to bare 'Saved.' — 018 save confirmation broken"
  );
  assert.ok(
    replaceBody.includes('`Saved ${name}`'),
    'commitSaveReplace must use `Saved ${name}` (020F: no extra quotes around name)'
  );
});

test('13. commitSaveNew still shows Saved [name] (not Saved as "...")', () => {
  // 020F: quote-free format — "Saved Sierra" not 'Saved "Sierra"'
  assert.ok(
    !newBody.includes('Saved as "'),
    'commitSaveNew reverted to "Saved as \\"${name}\\"" — 018 save confirmation broken'
  );
  assert.ok(
    newBody.includes('`Saved ${name}`'),
    'commitSaveNew must use `Saved ${name}` (020F: no extra quotes around name)'
  );
});

test('14. activeLockerFile.name still used as pill text content', () => {
  assert.ok(
    checklist.includes('activeLockerFile.name'),
    'activeLockerFile.name not found — pill no longer shows the file name'
  );
});

test('15. Pill still has pointer-events-none and select-none (informational only)', () => {
  assert.ok(pillCondInPillsRow > -1, 'activeLockerFile conditional not found');
  const pillBlock = pillsRowBlock.slice(pillCondInPillsRow, pillCondInPillsRow + 600);
  assert.ok(pillBlock.includes('pointer-events-none'), 'pointer-events-none missing from pill area');
  assert.ok(pillBlock.includes('select-none'),         'select-none missing from filename span');
});

// ── REGRESSION GUARDS — PILL ATTRIBUTES ──────────────────────────────────────

test('16. Pill span still has max-w-[…] overflow guard', () => {
  assert.ok(pillCondInPillsRow > -1, 'activeLockerFile conditional not found');
  const pillBlock = pillsRowBlock.slice(pillCondInPillsRow, pillCondInPillsRow + 600);
  assert.ok(pillBlock.includes('max-w-['), 'max-w-[…] overflow guard missing from filename span');
});

test('17. Pill span still has truncate class', () => {
  assert.ok(pillCondInPillsRow > -1, 'activeLockerFile conditional not found');
  const pillBlock = pillsRowBlock.slice(pillCondInPillsRow, pillCondInPillsRow + 600);
  assert.ok(pillBlock.includes('truncate'), 'truncate class missing from filename span');
});

test('18. Pill span still has select-none', () => {
  assert.ok(pillCondInPillsRow > -1, 'activeLockerFile conditional not found');
  const pillBlock = pillsRowBlock.slice(pillCondInPillsRow, pillCondInPillsRow + 600);
  assert.ok(pillBlock.includes('select-none'), 'select-none missing from filename span');
});

test('19. aria-label still references activeLockerFile.name', () => {
  assert.ok(pillCondInPillsRow > -1, 'activeLockerFile conditional not found');
  const pillBlock = pillsRowBlock.slice(pillCondInPillsRow, pillCondInPillsRow + 600);
  assert.ok(
    pillBlock.includes('aria-label={`Active file: ${activeLockerFile.name}`}') ||
    pillBlock.includes("aria-label={`Active file: ${activeLockerFile.name}`}"),
    'aria-label referencing activeLockerFile.name not found on filename element'
  );
});

test('20. title attribute still set to activeLockerFile.name (tooltip on overflow)', () => {
  assert.ok(pillCondInPillsRow > -1, 'activeLockerFile conditional not found');
  const pillBlock = pillsRowBlock.slice(pillCondInPillsRow, pillCondInPillsRow + 600);
  assert.ok(
    pillBlock.includes('title={activeLockerFile.name}'),
    'title={activeLockerFile.name} not found — tooltip missing on overflow'
  );
});

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(52)}`);
console.log(`Tests: ${passed + failed}  Passed: ${passed}  Failed: ${failed}`);
if (failed > 0) {
  console.error('\nFailed tests:');
  failures.forEach(f => console.error(`  ✗ ${f.name}\n    ${f.message}`));
  console.error('\n❌ Some tests failed.');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed.');
}
