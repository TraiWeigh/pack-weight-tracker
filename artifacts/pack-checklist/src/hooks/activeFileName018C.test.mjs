/**
 * activeFileName018C.test.mjs
 *
 * Prompt 018C — Align Active File Name Pill to Top Control Row
 *
 * Root cause: the outer pills-row container has pt-8 pb-3 (asymmetric padding).
 * `top-1/2 -translate-y-1/2` anchored the pill to the midpoint of the full
 * padded height, placing it ~10px above the Hide/Preview/UnitToggle centerline.
 *
 * Fix: replace `absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2`
 * with `absolute inset-0 pt-8 pb-3 flex items-center justify-center`.
 * The overlay shares the container's padding, so flex items-center references
 * the exact same content area as the outer flex container — perfect alignment.
 *
 * Automated tests cannot prove exact pixel-level vertical alignment — that
 * requires the user's fresh-preview acceptance test.
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

// ── Locate key regions ────────────────────────────────────────────────────────

const pillsRowIdx = checklist.indexOf('Pinned pills row');
assert.ok(pillsRowIdx > -1, 'Pinned pills row marker not found');
const pillsRowBlock = checklist.slice(pillsRowIdx, pillsRowIdx + 4000);

// Outer container className — 021O moved pt-8 to the toolbar-group parent; panel now has pb-3 only.
const containerDivIdx = pillsRowBlock.indexOf('pb-3 flex items-center');
assert.ok(containerDivIdx > -1, 'Outer container (pb-3 flex items-center) not found — 021O: pt-8 moved to toolbar group parent');
const containerDecl = pillsRowBlock.slice(containerDivIdx, containerDivIdx + 200);

// Filename pill conditional
const pillCondIdx = pillsRowBlock.indexOf('{activeLockerFile && (');
assert.ok(pillCondIdx > -1, 'activeLockerFile conditional not found in pills row');
const pillBlock = pillsRowBlock.slice(pillCondIdx, pillCondIdx + 800);

// Span within the pill block
const spanIdx = pillBlock.indexOf('<span');
assert.ok(spanIdx > -1, 'filename <span> not found in pill block');
const spanBlock = pillBlock.slice(spanIdx, spanIdx + 400);

// Right control group (1400 chars for verbose Hide button)
const mlAutoChecklistIdx = checklist.indexOf('ml-auto flex items-center gap-3', pillsRowIdx);
assert.ok(mlAutoChecklistIdx > -1, 'ml-auto right control group not found');
const rightGroup = checklist.slice(mlAutoChecklistIdx, mlAutoChecklistIdx + 1400);

// ── Tests ─────────────────────────────────────────────────────────────────────

console.log('\nPrompt 018C — Filename Pill Vertical Alignment Fix\n');

// ── ROOT CAUSE ELIMINATED — new wrapper structure ─────────────────────────────

test('1. Wrapper has `absolute inset-0` (fills container dimensions for correct reference frame)', () => {
  assert.ok(
    pillBlock.includes('absolute inset-0'),
    'absolute inset-0 not found — old top-1/2 approach may still be in place'
  );
});

test('2. Wrapper has `pb-3` (matches outer container bottom padding — establishes same content area)', () => {
  // 021O moved pt-8 to the toolbar-group parent. Both the outer panel and this overlay
  // now have pb-3 only; items-center references the same (padded) content area for alignment.
  assert.ok(
    pillBlock.includes('pb-3'),
    'pb-3 not found on wrapper — vertical alignment reference mismatch'
  );
  // pt-8 must NOT be on the overlay (it moved to the toolbar group parent in 021O).
  assert.ok(
    !pillBlock.slice(0, pillBlock.indexOf('pointer-events-none') + 30).includes('pt-8'),
    '021O: pt-8 must be removed from the overlay div — top spacing is on the toolbar-group parent'
  );
});

test('3. Wrapper has `flex items-center` (vertically centers within the padded content area)', () => {
  // With matching pt-8 pb-3, items-center references the same content area as the
  // outer container's flex items-center, placing the pill on the same centerline.
  assert.ok(
    pillBlock.indexOf('flex items-center') < pillBlock.indexOf('<span'),
    'flex items-center not found on wrapper div (before the span)'
  );
});

test('4. Wrapper has `justify-center` (horizontally centers over the full left-column width)', () => {
  assert.ok(
    pillBlock.indexOf('justify-center') < pillBlock.indexOf('<span'),
    'justify-center not found on wrapper div (before the span)'
  );
});

test('5. Old `top-1/2` removed from wrapper (no longer used for vertical positioning)', () => {
  // The wrapper div content (before the span) must not contain top-1/2.
  const wrapperDiv = pillBlock.slice(0, spanIdx);
  assert.ok(!wrapperDiv.includes('top-1/2'), 'top-1/2 must be removed from wrapper — replaced by inset-0 + padding approach');
});

test('6. Old `-translate-y-1/2` removed from wrapper (no longer used)', () => {
  const wrapperDiv = pillBlock.slice(0, spanIdx);
  assert.ok(!wrapperDiv.includes('-translate-y-1/2'), '-translate-y-1/2 must be removed from wrapper');
});

test('7. Old `left-1/2` removed from wrapper (justify-center handles horizontal centering now)', () => {
  const wrapperDiv = pillBlock.slice(0, spanIdx);
  assert.ok(!wrapperDiv.includes('left-1/2'), 'left-1/2 must be removed from wrapper — replaced by justify-center');
});

test('8. Old `-translate-x-1/2` removed from wrapper (justify-center handles horizontal centering)', () => {
  const wrapperDiv = pillBlock.slice(0, spanIdx);
  assert.ok(!wrapperDiv.includes('-translate-x-1/2'), '-translate-x-1/2 must be removed from wrapper');
});

// ── OUTER CONTAINER UNCHANGED ─────────────────────────────────────────────────

test('9. Outer container has `pb-3` bottom padding (021O moved pt-8 to toolbar-group parent)', () => {
  // 021O: pt-8 was removed from this container and placed on the toolbar-group parent as pt-4.
  // pb-3 remains to provide bottom breathing room within the toolbar row.
  assert.ok(
    containerDecl.includes('pb-3'),
    'Outer container must still have pb-3 bottom padding'
  );
  assert.ok(
    !containerDecl.includes('pt-8'),
    '021O: outer container must NOT have pt-8 — top spacing moved to toolbar-group parent'
  );
});

test('10. Outer container still has `flex items-center` (buttons centered in content area)', () => {
  assert.ok(containerDecl.includes('flex items-center'), 'flex items-center missing from outer container');
});

test('11. Outer container still has `relative` (positions the absolute overlay correctly)', () => {
  assert.ok(containerDecl.includes('relative'), 'relative missing from outer container — absolute overlay will be mispositioned');
});

// ── WRAPPER NON-INTERACTIVITY ─────────────────────────────────────────────────

test('12. Wrapper has `pointer-events-none` (clicks pass through)', () => {
  assert.ok(
    pillBlock.indexOf('pointer-events-none') < pillBlock.indexOf('<span'),
    'pointer-events-none missing from wrapper div'
  );
});

// ── SPAN / PILL APPEARANCE UNCHANGED FROM 018B ───────────────────────────────

test('13. Span has `bg-muted` (018B pill appearance preserved)', () => {
  assert.ok(spanBlock.includes('bg-muted'), 'bg-muted missing from span');
});

test('14. Span has `rounded-lg` (018B pill appearance preserved)', () => {
  assert.ok(spanBlock.includes('rounded-lg'), 'rounded-lg missing from span');
});

test('15. Span has `px-3 py-1.5` (018B pill height/padding preserved)', () => {
  assert.ok(spanBlock.includes('px-3') && spanBlock.includes('py-1.5'), 'px-3 py-1.5 missing from span');
});

test('16. Span has `text-xs font-semibold` (018B font appearance preserved)', () => {
  assert.ok(spanBlock.includes('text-xs') && spanBlock.includes('font-semibold'), 'text-xs font-semibold missing from span');
});

test('17. Span has `flex items-center` (018B layout preserved)', () => {
  assert.ok(spanBlock.includes('flex items-center'), 'flex items-center missing from span');
});

// ── THEME TEXT COLOR UNCHANGED ────────────────────────────────────────────────

test('18. Span has `text-foreground` (black in light, white in dark — unchanged)', () => {
  assert.ok(spanBlock.includes('text-foreground'), 'text-foreground missing from span');
});

test('19. Span does NOT have `text-muted-foreground` or `text-foreground/60`', () => {
  assert.ok(!spanBlock.includes('text-muted-foreground'), 'text-muted-foreground must not appear on span');
  assert.ok(!spanBlock.includes('text-foreground/60'), 'text-foreground/60 must not appear on span');
});

// ── NON-INTERACTIVITY OF SPAN ─────────────────────────────────────────────────

test('20. Span has `select-none` (not text-selectable)', () => {
  assert.ok(spanBlock.includes('select-none'), 'select-none missing from span');
});

test('21. Span has `max-w-[` and `truncate` (overflow guard preserved)', () => {
  assert.ok(spanBlock.includes('max-w-[') && spanBlock.includes('truncate'), 'max-w-[ or truncate missing from span');
});

test('22. Span has no `hover:` classes (informational only)', () => {
  assert.ok(!spanBlock.includes('hover:'), 'hover: classes must not appear on span');
});

// ── ACCESSIBILITY ─────────────────────────────────────────────────────────────

test('23. Span has `aria-label` referencing activeLockerFile.name', () => {
  assert.ok(spanBlock.includes('aria-label={`Active file: ${activeLockerFile.name}`}'), 'aria-label missing');
});

test('24. Span has `title` attribute for tooltip on truncation', () => {
  assert.ok(spanBlock.includes('title={activeLockerFile.name}'), 'title missing from span');
});

test('25. Span renders `{activeLockerFile.name}` as text content', () => {
  assert.ok(pillBlock.includes('{activeLockerFile.name}'), 'activeLockerFile.name not found in pill block');
});

// ── PILL POSITION — NOT INSIDE RIGHT CONTROL GROUP ───────────────────────────

test('26. Pill conditional appears in pills row before the right control group', () => {
  const pillCondInPillsRow = pillsRowBlock.indexOf('{activeLockerFile && (');
  const mlAutoInPillsRow   = pillsRowBlock.indexOf('ml-auto flex items-center gap-3');
  assert.ok(pillCondInPillsRow > -1, 'Pill conditional not found in pills row block');
  assert.ok(mlAutoInPillsRow   > -1, 'ml-auto group not found in pills row block');
  assert.ok(pillCondInPillsRow < mlAutoInPillsRow, 'Pill conditional should appear before ml-auto group');
});

test('27. Pill conditional NOT inside the right control group', () => {
  assert.ok(!rightGroup.includes('{activeLockerFile && ('), 'Pill must NOT be inside the ml-auto right group');
});

// ── HIDE / PREVIEW / UNITTOGGLE ORDER ────────────────────────────────────────

test('28. Hide → Preview → UnitToggle order preserved in right group', () => {
  const hideIdx    = rightGroup.indexOf('aria-label="Hide interface and show background view"');
  const previewIdx = rightGroup.indexOf('aria-label="Open checked-items preview"');
  const unitIdx    = rightGroup.indexOf('<UnitToggle');
  assert.ok(hideIdx > -1,    'Hide button not found in right group');
  assert.ok(previewIdx > -1, 'Preview button not found in right group');
  assert.ok(unitIdx > -1,    'UnitToggle not found in right group');
  assert.ok(hideIdx < previewIdx, 'Hide should appear before Preview');
  assert.ok(previewIdx < unitIdx, 'Preview should appear before UnitToggle');
});

// ── SAVE CONFIRMATION ─────────────────────────────────────────────────────────

test('29. Save toast uses `Saved ${name}` (no quotes, not bare "Saved." or "Saved as")', () => {
  // 020F: quotes removed from save toast — "Saved Sierra" not 'Saved "Sierra"'.
  const toastStr = '`Saved ${name}`';
  const first  = checklist.indexOf(toastStr);
  const second = checklist.indexOf(toastStr, first + 1);
  assert.ok(first  > -1, `toast \`Saved \${name}\` not found`);
  assert.ok(second > -1, `toast \`Saved \${name}\` should appear at least twice`);
  assert.ok(!checklist.includes("description: 'Saved.'"), 'Bare "Saved." must not exist');
});

// ── SUMMARY ───────────────────────────────────────────────────────────────────

console.log('\n────────────────────────────────────────────────────');
console.log('Tests: 29');
console.log('\n⚠️  Automated tests verify structural class correctness only.');
console.log('Exact vertical centerline alignment requires the user\'s fresh-preview acceptance test.');
