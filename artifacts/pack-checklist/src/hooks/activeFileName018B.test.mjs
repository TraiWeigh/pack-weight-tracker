/**
 * activeFileName018B.test.mjs
 *
 * Prompt 018B — Match Active File Name Pill to Hide (visual correction)
 *
 * Verifies that the filename pill's className matches the Hide pill's exact
 * visual pattern (bg-muted, rounded-lg, px-3, py-1.5, text-xs, font-semibold,
 * flex items-center) and uses text-foreground for guaranteed black/white in
 * light/dark mode. Functional logic (activeLockerFile identity, save
 * confirmations, Hide/Preview/UnitToggle order) is also re-confirmed.
 *
 * Automated tests cannot prove exact pixel alignment or rendered color — those
 * require the user's fresh-preview acceptance test.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import assert from 'assert/strict';

const checklistPath = resolve(
  process.cwd(),
  'artifacts/pack-checklist/src/pages/Checklist.tsx'
);
const checklist = readFileSync(checklistPath, 'utf8');

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

// ── Locate pill region ────────────────────────────────────────────────────────

const pillsRowIdx  = checklist.indexOf('Pinned pills row');
assert.ok(pillsRowIdx > -1, 'Pinned pills row marker not found');
// 022W: the left panel is more verbose (explicit mobile rows + desktop group) so we need
// a larger slice to cover all content including the desktop right group at the end.
const pillsRowBlock = checklist.slice(pillsRowIdx, pillsRowIdx + 8000);

const pillCondIdx = pillsRowBlock.indexOf('{activeLockerFile && (');
assert.ok(pillCondIdx > -1, 'activeLockerFile conditional not found in pills row');

// Slice the pill block — 800 chars covers the wrapper div + span + closing
const pillBlock = pillsRowBlock.slice(pillCondIdx, pillCondIdx + 800);

// Locate the span's className specifically
const spanIdx = pillBlock.indexOf('<span');
assert.ok(spanIdx > -1, 'filename <span> not found in pill block');
const spanBlock = pillBlock.slice(spanIdx, spanIdx + 400);

// ── Locate right control group ────────────────────────────────────────────────

// 022W: desktop right group class is now 'hidden lg:flex items-center gap-3 ml-auto flex-shrink-0'
const mlAutoChecklistIdx = checklist.indexOf('hidden lg:flex items-center gap-3 ml-auto flex-shrink-0', pillsRowIdx);
assert.ok(mlAutoChecklistIdx > -1, '022W: desktop right group (hidden lg:flex ... ml-auto) not found');
// Use 1400 chars from checklist to safely cover the verbose Hide disabled block + Preview + UnitToggle
const rightGroup = checklist.slice(mlAutoChecklistIdx, mlAutoChecklistIdx + 1400);

// ── Tests ─────────────────────────────────────────────────────────────────────

console.log('\nPrompt 018B — Filename Pill Matches Hide (Visual Correction)\n');

// ── PILL APPEARANCE — matches Hide exactly ────────────────────────────────────

test('1. Filename span has `bg-muted` (matches Hide background)', () => {
  assert.ok(spanBlock.includes('bg-muted'), 'bg-muted not found on filename span');
});

test('2. Filename span has `rounded-lg` (matches Hide border radius)', () => {
  assert.ok(spanBlock.includes('rounded-lg'), 'rounded-lg not found on filename span');
});

test('3. Filename span has `px-3` (matches Hide horizontal padding)', () => {
  assert.ok(spanBlock.includes('px-3'), 'px-3 not found on filename span');
});

test('4. Filename span has `py-1.5` (matches Hide vertical padding — same height)', () => {
  assert.ok(spanBlock.includes('py-1.5'), 'py-1.5 not found on filename span — required to align vertically with Hide');
});

test('5. Filename span has `text-xs` (matches Hide font size)', () => {
  assert.ok(spanBlock.includes('text-xs'), 'text-xs not found on filename span');
});

test('6. Filename span has `font-semibold` (matches Hide font weight)', () => {
  assert.ok(spanBlock.includes('font-semibold'), 'font-semibold not found on filename span');
});

test('7. Filename span has `flex items-center` (matches Hide layout)', () => {
  assert.ok(spanBlock.includes('flex items-center'), 'flex items-center not found on filename span');
});

// ── THEME TEXT COLOR ──────────────────────────────────────────────────────────

test('8. Filename span uses `text-foreground` (black in light, white in dark — CSS var)', () => {
  assert.ok(spanBlock.includes('text-foreground'), 'text-foreground not found on filename span');
});

test('9. Filename span does NOT use `text-muted-foreground` (would be gray, not black/white)', () => {
  assert.ok(!spanBlock.includes('text-muted-foreground'), 'text-muted-foreground must not appear — use text-foreground for guaranteed black/white');
});

test('10. Filename span does NOT use `text-foreground/60` (dim gray — removed in 018A)', () => {
  assert.ok(!spanBlock.includes('text-foreground/60'), 'text-foreground/60 must not appear on filename span');
});

test('11. Filename span has no hardcoded `text-white` or `text-black`', () => {
  assert.ok(!spanBlock.includes('text-white'), 'text-white must not appear — use text-foreground');
  assert.ok(!spanBlock.includes('text-black'), 'text-black must not appear — use text-foreground');
});

// ── INFORMATIONAL ONLY — no interactive styling ───────────────────────────────

test('12. Filename span has no `hover:` classes (not clickable)', () => {
  assert.ok(!spanBlock.includes('hover:'), 'hover: classes must not appear on filename span — it is informational only');
});

test('13. Filename span has no `cursor-pointer` (not a button)', () => {
  assert.ok(!spanBlock.includes('cursor-pointer'), 'cursor-pointer must not appear on filename span');
});

test('14. Outer wrapper div has `pointer-events-none` (clicks/hover pass through)', () => {
  assert.ok(pillBlock.includes('pointer-events-none'), 'pointer-events-none not found on filename wrapper div');
});

test('15. Filename span has `select-none` (text not user-selectable)', () => {
  assert.ok(spanBlock.includes('select-none'), 'select-none not found on filename span');
});

// ── OVERFLOW / TRUNCATION ─────────────────────────────────────────────────────

test('16. Filename span has `max-w-[` overflow guard (long names do not overflow)', () => {
  assert.ok(spanBlock.includes('max-w-['), 'max-w-[ not found on filename span');
});

test('17. Filename span has `truncate` (ellipsis on overflow)', () => {
  assert.ok(spanBlock.includes('truncate'), 'truncate not found on filename span');
});

// ── CENTERING STRUCTURE PRESERVED FROM 018A ───────────────────────────────────

test('18. [018C] Centering wrapper uses inset-0 + matching padding (not left-1/2/top-1/2/translate)', () => {
  // 018C replaced the translate approach with inset-0 + flex items-center justify-center.
  // 022W: uses lg:absolute lg:inset-0 (responsive prefix — still centering on desktop).
  // Substrings 'inset-0', 'items-center', 'justify-center' all exist in the lg:-prefixed classes.
  assert.ok(pillBlock.includes('inset-0'), '022W: inset-0 must be present (lg:inset-0 counts)');
  assert.ok(
    pillBlock.includes('items-center') && pillBlock.includes('justify-center'),
    '022W: items-center + justify-center must be present (lg:-prefixed variants count)'
  );
  assert.ok(!pillBlock.includes('top-1/2'), 'top-1/2 should be removed (old centering approach replaced in 018C)');
});

test('19. Pill wrapper appears as sibling before the right control group (not inside it)', () => {
  const pillCondInPillsRow = pillsRowBlock.indexOf('{activeLockerFile && (');
  // 022W: updated to new desktop right group pattern
  const mlAutoInPillsRow   = pillsRowBlock.indexOf('hidden lg:flex items-center gap-3 ml-auto flex-shrink-0');
  assert.ok(pillCondInPillsRow > -1, 'Pill conditional not found in pills row block');
  assert.ok(mlAutoInPillsRow > -1, '022W: desktop right group (hidden lg:flex) not found in pills row block');
  assert.ok(
    pillCondInPillsRow < mlAutoInPillsRow,
    'Pill conditional should appear before the ml-auto right group (sibling, not child)'
  );
  // Pill must NOT be inside the right control group
  assert.ok(
    !rightGroup.includes('{activeLockerFile && ('),
    'Pill conditional must NOT be inside the ml-auto right control group'
  );
});

// ── ACCESSIBILITY ATTRIBUTES ──────────────────────────────────────────────────

test('20. Filename span has aria-label referencing activeLockerFile.name', () => {
  assert.ok(spanBlock.includes('aria-label={`Active file: ${activeLockerFile.name}`}'), 'aria-label not found on filename span');
});

test('21. Filename span has title attribute for tooltip on truncation', () => {
  assert.ok(spanBlock.includes('title={activeLockerFile.name}'), 'title not found on filename span');
});

test('22. Filename pill renders activeLockerFile.name as its text content', () => {
  assert.ok(pillBlock.includes('{activeLockerFile.name}'), 'activeLockerFile.name not found in pill block');
});

// ── HIDE / PREVIEW / UNITTOGGLE ORDER UNCHANGED ──────────────────────────────

test('23. Right control group: Hide button present', () => {
  assert.ok(
    rightGroup.includes('aria-label="Hide interface and show background view"'),
    'Hide button not found in right control group'
  );
});

test('24. Right control group: Preview button present', () => {
  assert.ok(
    rightGroup.includes('aria-label="Open checked-items preview"'),
    'Preview button not found in right control group'
  );
});

test('25. Right control group: UnitToggle present', () => {
  assert.ok(rightGroup.includes('<UnitToggle'), 'UnitToggle not found in right control group');
});

test('26. Right control group: Hide appears before Preview', () => {
  const hideIdx    = rightGroup.indexOf('aria-label="Hide interface and show background view"');
  const previewIdx = rightGroup.indexOf('aria-label="Open checked-items preview"');
  assert.ok(hideIdx < previewIdx, `Hide (${hideIdx}) should appear before Preview (${previewIdx})`);
});

test('27. Right control group: Preview appears before UnitToggle', () => {
  const previewIdx = rightGroup.indexOf('aria-label="Open checked-items preview"');
  const unitIdx    = rightGroup.indexOf('<UnitToggle');
  assert.ok(previewIdx < unitIdx, `Preview (${previewIdx}) should appear before UnitToggle (${unitIdx})`);
});

test('28. Pill conditional NOT between Preview and UnitToggle in right group', () => {
  const previewIdx = rightGroup.indexOf('aria-label="Open checked-items preview"');
  const unitIdx    = rightGroup.indexOf('<UnitToggle');
  const between    = rightGroup.slice(previewIdx, unitIdx);
  assert.ok(!between.includes('{activeLockerFile'), 'Pill conditional must NOT be between Preview and UnitToggle');
});

// ── SAVE CONFIRMATIONS (018 behavior unchanged) ───────────────────────────────

test('29. Save toast uses `Saved ${name}` pattern (no quotes) — not bare "Saved." (global search)', () => {
  // 020F: quotes removed from save toast — "Saved Sierra" not 'Saved "Sierra"'.
  // Both commitSaveNew and commitSaveReplace emit the same toast; verify it appears
  // at least twice in the file (once per function). Function bodies can exceed 600
  // chars, so search globally rather than from the function name.
  const toastStr = '`Saved ${name}`';
  const first = checklist.indexOf(toastStr);
  assert.ok(first > -1, `toast \`Saved \${name}\` not found in Checklist.tsx`);
  const second = checklist.indexOf(toastStr, first + 1);
  assert.ok(second > -1, `toast \`Saved \${name}\` should appear at least twice (commitSaveNew + commitSaveReplace)`);
});

test('30. Save toast never uses bare "Saved." or "Saved as" (global search)', () => {
  // Confirm the old form is absent.
  assert.ok(!checklist.includes("description: 'Saved.'"), 'Bare "Saved." toast must not exist');
  assert.ok(!checklist.includes('Saved as "'), 'Old "Saved as …" form must not exist');
});

// ── SUMMARY ───────────────────────────────────────────────────────────────────

const totalTests = 30;
const passed = totalTests - (process.exitCode === 1 ? 1 : 0); // approximate; exact via exit code
console.log('\n────────────────────────────────────────────────────');
console.log(`Tests: ${totalTests}  Passed: see exit code  Failed: see above`);
console.log('\n⚠️  Automated tests verify structural/class correctness only.');
console.log('Exact visual match, pixel alignment, and rendered colors require a human fresh-preview test.');
