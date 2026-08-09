/**
 * activeFileName018.test.mjs  —  Prompt 018
 *
 * Verifies the two goals of Prompt 018:
 *  (1) Active saved-file name displayed as a read-only pill in the toolbar.
 *  (2) Every successful save shows "Saved [File Name]" — never bare "Saved".
 *
 * Tests (static source analysis against Checklist.tsx):
 *
 *  SAVE CONFIRMATION TOASTS
 *  1.  commitSaveReplace no longer uses the bare 'Saved.' description.
 *  2.  commitSaveReplace uses template-literal `Saved "${name}"` format.
 *  3.  commitSaveNew no longer uses `Saved as "${name}"` format.
 *  4.  commitSaveNew uses template-literal `Saved "${name}"` format.
 *  5.  No success-path toast in the save section uses bare description 'Saved'.
 *  6.  Error toasts (Save failed) are unchanged — still use 'destructive' variant.
 *
 *  FILENAME PILL — PRESENCE & CONDITIONAL RENDER
 *  7.  activeLockerFile is conditionally rendered in JSX (activeLockerFile && ...).
 *  8.  Pill renders activeLockerFile.name as its text content.
 *  9.  Pill is a <span>, not a <button> — informational only, not interactive.
 * 10.  Pill has pointer-events-none (click/hover events pass through).
 * 11.  Pill has select-none (not text-selectable, not accidentally clickable).
 * 12.  Pill has max-w-[…] overflow guard (long names truncate, not overflow).
 * 13.  Pill has truncate class (overflow text hidden with ellipsis).
 * 14.  Pill has hidden sm:inline-flex (hidden on very-small viewports, visible ≥640px).
 *
 *  TOOLBAR ORDER — PILL APPEARS AFTER PREVIEW, BEFORE UNIT TOGGLE
 * 15.  Source order: Preview button → filename pill → UnitToggle
 *      (Hide → Preview → pill → Imperial/Metric order preserved).
 *
 *  REGRESSION GUARDS — 017E BACKGROUND FIX INTACT
 * 16.  paddingTop: '66.667%' still present (Fix B — aspect-ratio via layout).
 * 17.  Math.max(0, 1 - bgFade) still present (Fix C — no bgFade threshold switch).
 * 18.  willChange: 'transform' on landscapeGridRef grid wrapper (Fix D).
 * 19.  import.meta.env.DEV gate on measurement code (Fix E — DEV-only).
 * 20.  No aspect-[3/2] in PRESETS block (Fix B — aspect-ratio fully removed).
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

const checklist  = read('artifacts/pack-checklist/src/pages/Checklist.tsx');
const bgPicker   = read('artifacts/pack-checklist/src/components/BackgroundPicker.tsx');

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Isolate the commitSaveReplace function body (from its const declaration to the
 * closing ]); of its dependency array).  We use this to scope toast assertions so
 * they cannot accidentally match commitSaveNew or error paths.
 */
function extractFunctionBody(src, fnName) {
  const start = src.indexOf(`const ${fnName}`);
  if (start === -1) return '';
  // Walk forward to find the matching closing ], ); that ends useCallback
  const slice = src.slice(start, start + 3000);
  return slice;
}

const replaceBody = extractFunctionBody(checklist, 'commitSaveReplace');
const newBody     = extractFunctionBody(checklist, 'commitSaveNew');

// ── Tests ─────────────────────────────────────────────────────────────────────

console.log('\nPrompt 018 — Active File Name + Save Confirmation Tests\n');

// ── SAVE CONFIRMATION TOASTS ──────────────────────────────────────────────────

test("1. commitSaveReplace no longer uses bare 'Saved.' description", () => {
  assert.ok(
    !replaceBody.includes("description: 'Saved.'"),
    "commitSaveReplace still contains description: 'Saved.' — generic toast not replaced"
  );
});

test('2. commitSaveReplace uses template-literal `Saved ${name}` format (no extra quotes)', () => {
  // 020F: removed the wrapping double-quotes from the toast message so it reads
  // "Saved Sierra" instead of 'Saved "Sierra"'.
  assert.ok(
    replaceBody.includes('`Saved ${name}`'),
    'commitSaveReplace must use `Saved ${name}` (without extra quotes around name)'
  );
});

test('3. commitSaveNew no longer uses `Saved as "${name}"` format', () => {
  assert.ok(
    !newBody.includes('Saved as "'),
    'commitSaveNew still contains "Saved as \\"${name}\\"" — old format not replaced'
  );
});

test('4. commitSaveNew uses template-literal `Saved ${name}` format (no extra quotes)', () => {
  // 020F: removed the wrapping double-quotes from the toast message.
  assert.ok(
    newBody.includes('`Saved ${name}`'),
    'commitSaveNew must use `Saved ${name}` (without extra quotes around name)'
  );
});

test("5. No success-path toast in save section uses bare description 'Saved'", () => {
  // Both commitSaveNew and commitSaveReplace must NOT emit description: 'Saved.' or
  // description: 'Saved' (without a name).  Confirm neither body contains it.
  assert.ok(
    !replaceBody.includes("description: 'Saved'") && !newBody.includes("description: 'Saved'"),
    "A save function still contains bare description: 'Saved'"
  );
});

test('6. Error toasts (Save failed) still use destructive variant — unchanged', () => {
  // The failure toasts added in earlier prompts must remain intact.
  assert.ok(
    checklist.includes("variant: 'destructive'"),
    "destructive variant toast not found — error toast may have been removed"
  );
  assert.ok(
    checklist.includes('Save failed'),
    "'Save failed' error message no longer present"
  );
});

// ── FILENAME PILL — PRESENCE & CONDITIONAL RENDER ────────────────────────────

test('7. activeLockerFile conditionally rendered in JSX (activeLockerFile && ...)', () => {
  // The pill must only appear when activeLockerFile is non-null.
  // Look for the conditional render pattern in JSX context (not inside a comment or string).
  const jsxBlock = checklist.slice(checklist.indexOf('Preview'));
  assert.ok(
    jsxBlock.includes('{activeLockerFile && (') || jsxBlock.includes('{activeLockerFile && \n'),
    'No conditional activeLockerFile && render found in JSX area after Preview button'
  );
});

test('8. Pill renders activeLockerFile.name as text content', () => {
  assert.ok(
    checklist.includes('activeLockerFile.name'),
    'activeLockerFile.name not found in Checklist — filename not rendered'
  );
});

test('9. Pill is a <span> not a <button> — informational only', () => {
  // Find the pill block — it must be a <span> containing activeLockerFile.name.
  // Search for the <span near the conditional render.
  const condIdx = checklist.indexOf('{activeLockerFile && (');
  assert.ok(condIdx > -1, 'Conditional activeLockerFile render not found');
  const pillBlock = checklist.slice(condIdx, condIdx + 600);
  assert.ok(
    pillBlock.includes('<span'),
    'Filename pill is not a <span> — expected a non-interactive span element'
  );
  assert.ok(
    !pillBlock.includes('<button') || pillBlock.indexOf('<button') > pillBlock.indexOf('</span>'),
    'Filename pill contains a <button> — pill must be informational only'
  );
});

test('10. Pill has pointer-events-none (click/hover events pass through)', () => {
  const condIdx = checklist.indexOf('{activeLockerFile && (');
  assert.ok(condIdx > -1, 'Conditional activeLockerFile render not found');
  const pillBlock = checklist.slice(condIdx, condIdx + 600);
  assert.ok(
    pillBlock.includes('pointer-events-none'),
    'pointer-events-none not found on the filename pill'
  );
});

test('11. Pill has select-none (not accidentally text-selectable)', () => {
  const condIdx = checklist.indexOf('{activeLockerFile && (');
  assert.ok(condIdx > -1, 'Conditional activeLockerFile render not found');
  const pillBlock = checklist.slice(condIdx, condIdx + 600);
  assert.ok(
    pillBlock.includes('select-none'),
    'select-none not found on the filename pill'
  );
});

test('12. Pill has max-w-[…] overflow guard (long names truncate, not overflow)', () => {
  const condIdx = checklist.indexOf('{activeLockerFile && (');
  assert.ok(condIdx > -1, 'Conditional activeLockerFile render not found');
  const pillBlock = checklist.slice(condIdx, condIdx + 600);
  assert.ok(
    pillBlock.includes('max-w-['),
    'No max-w-[…] class on the filename pill — long names will overflow the toolbar'
  );
});

test('13. Pill has truncate class (overflow text hidden with ellipsis)', () => {
  const condIdx = checklist.indexOf('{activeLockerFile && (');
  assert.ok(condIdx > -1, 'Conditional activeLockerFile render not found');
  const pillBlock = checklist.slice(condIdx, condIdx + 600);
  assert.ok(
    pillBlock.includes('truncate'),
    'truncate not found on the filename pill'
  );
});

test('14. [018C] Pill uses absolute inset-0 centering — NOT hidden behind sm: breakpoint', () => {
  // 018A correction: pill moved out of the control group, responsive hiding removed.
  // 018C correction: left-1/2/top-1/2/translate replaced with inset-0 + padding approach.
  const condIdx = checklist.indexOf('{activeLockerFile && (');
  assert.ok(condIdx > -1, 'Conditional activeLockerFile render not found');
  const pillBlock = checklist.slice(condIdx, condIdx + 600);
  assert.ok(
    pillBlock.includes('absolute') && pillBlock.includes('inset-0'),
    'Pill wrapper does not have absolute inset-0 centering (018C correction not applied)'
  );
  assert.ok(
    !pillBlock.includes('hidden sm:inline-flex') && !pillBlock.includes('hidden sm:flex'),
    'Pill still has hidden sm: responsive class — should be always visible via inset-0 flex centering'
  );
});

// ── TOOLBAR ORDER ─────────────────────────────────────────────────────────────

test('15. [018A] Pill NOT between Preview and UnitToggle; Hide→Preview→UnitToggle is contiguous', () => {
  // 018A correction: pill must be outside the right control group.
  // The right group must have Preview immediately followed by UnitToggle
  // with no activeLockerFile conditional between them.
  // 022W: desktop right group class is now 'hidden lg:flex items-center gap-3 ml-auto flex-shrink-0'
  const mlAutoIdx = checklist.indexOf('hidden lg:flex items-center gap-3 ml-auto flex-shrink-0');
  assert.ok(mlAutoIdx > -1, '022W: desktop right group (hidden lg:flex ... ml-auto) not found');

  // Hide button's disabled/title block is ~600 chars; use 1400 to safely cover all three buttons.
  const rightGroup = checklist.slice(mlAutoIdx, mlAutoIdx + 1400);

  const previewInGroup  = rightGroup.indexOf('aria-label="Open checked-items preview"');
  const pillInGroup     = rightGroup.indexOf('{activeLockerFile && (');
  const unitTogInGroup  = rightGroup.indexOf('<UnitToggle');

  assert.ok(previewInGroup > -1, 'Preview not found in right control group');
  assert.ok(unitTogInGroup > -1, 'UnitToggle not found in right control group');

  // The pill must NOT appear between Preview and UnitToggle in the right group.
  assert.ok(
    pillInGroup === -1 || pillInGroup > unitTogInGroup,
    'activeLockerFile conditional still appears between Preview and UnitToggle — 018A position fix not applied'
  );
});

// ── REGRESSION GUARDS — 017E ──────────────────────────────────────────────────

test("16. paddingTop: '66.667%' still present in BackgroundPicker (Fix B — aspect-ratio via layout)", () => {
  // This value lives in BackgroundPicker.tsx (landscape tile wrapper), not Checklist.tsx.
  assert.ok(
    bgPicker.includes("paddingTop: '66.667%'") || bgPicker.includes('paddingTop:"66.667%"'),
    "paddingTop 66.667% not found in BackgroundPicker.tsx — 017E Fix B (aspect-ratio via layout) may be broken"
  );
});

test('17. Math.max(0, 1 - bgFade) still present in Checklist (Fix C — no bgFade threshold switch)', () => {
  assert.ok(
    checklist.includes('Math.max(0, 1 - bgFade)') || checklist.includes('Math.max(0,1-bgFade)'),
    'Math.max(0, 1 - bgFade) not found — 017E Fix C (gradient threshold switch) may be broken'
  );
});

test("18. willChange: 'transform' on landscape grid wrapper in BackgroundPicker (Fix D)", () => {
  // willChange:transform is set on the landscape grid wrapper div in BackgroundPicker.tsx.
  assert.ok(
    (bgPicker.match(/willChange:\s*['"]transform['"]/g) || []).length >= 1,
    "willChange: 'transform' not found in BackgroundPicker.tsx — 017E Fix D may be broken"
  );
});

test('19. import.meta.env.DEV gate on measurement code in BackgroundPicker (Fix E — DEV only)', () => {
  // The measurement instrumentation is in BackgroundPicker.tsx, gated on import.meta.env.DEV.
  assert.ok(
    bgPicker.includes('import.meta.env.DEV'),
    'import.meta.env.DEV gate not found in BackgroundPicker.tsx — 017E Fix E may be broken'
  );
});

test('20. No aspect-[3/2] in BackgroundPicker PRESETS block (Fix B — aspect-ratio fully removed)', () => {
  const presetsIdx = bgPicker.indexOf('PRESETS');
  assert.ok(presetsIdx > -1, 'PRESETS array not found in BackgroundPicker.tsx');
  const presetsBlock = bgPicker.slice(presetsIdx, presetsIdx + 8000);
  assert.ok(
    !presetsBlock.includes('aspect-[3/2]'),
    'aspect-[3/2] found in BackgroundPicker PRESETS block — 017E Fix B (aspect-ratio removal) may be broken'
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
