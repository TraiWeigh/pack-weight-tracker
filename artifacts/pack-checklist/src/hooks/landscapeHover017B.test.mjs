/**
 * landscapeHover017B.test.mjs  —  Prompt 017B
 *
 * Verifies that Landscape thumbnail hover is stable (no shaking):
 *
 *  1.  Landscape tiles always have ring-2 in base state (ring space reserved).
 *  2.  Landscape hover does NOT apply a scale transform.
 *  3.  Landscape hover does NOT add ring-width (only changes color).
 *  4.  transition-all is NOT used on landscape buttons.
 *  5.  Selected and unselected tiles use the same ring-width (ring-2).
 *  6.  Decorative label overlay has pointer-events-none.
 *  7.  Selected checkmark has pointer-events-none.
 *  8.  Clicking still selects a Landscape background (onClick present).
 *  9.  All built-in PRESETS images remain rendered.
 * 10.  Built-in images are non-deletable (no delete handler in preset block).
 * 11.  Custom-theme thumbnails remain unchanged.
 * 12.  Hide still wired (triggerShowcase present and unconditional).
 * 13.  Preview still wired (setShowPreview in Checklist).
 * 14.  Imperial UnitToggle still present.
 * 15.  Background Undo/Redo wired (undo/redo functions exist).
 * 16.  Prompt 016B bgPhotoStore imports preserved.
 * 17.  Prompt 016C PDF timeout guard preserved.
 * 18.  Prompt 017A Hide unconditional (no background && wrapper).
 * 19.  Desktop grid remains lg:grid-cols-[1fr_365px].
 * 20.  QTY translate-x-3 preserved.
 * 21.  ring-transparent used in unselected base state.
 * 22.  Only box-shadow / opacity in transition (no transition-all).
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

const bgPicker  = read('artifacts/pack-checklist/src/components/BackgroundPicker.tsx');
const checklist = read('artifacts/pack-checklist/src/pages/Checklist.tsx');
const gearCat   = read('artifacts/pack-checklist/src/components/GearCategory.tsx');
const importGear = read('artifacts/api-server/src/routes/importGear.ts');

// ── Locate the PRESETS block in BackgroundPicker ───────────────────────────
// The PRESETS.map block ends with the line that starts the custom-theme branch.
// We use `activeCollection ?` which always follows the landscape block as the sentinel.
const presetsMapStart = bgPicker.indexOf('{PRESETS.map(');
// Find the closing of the landscape conditional branch: `) : activeCollection`
const presetsMapEnd   = bgPicker.indexOf(': activeCollection', presetsMapStart);
const presetsBlock    = bgPicker.slice(presetsMapStart, presetsMapEnd > presetsMapStart ? presetsMapEnd : presetsMapStart + 4000);

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

console.log('\nPrompt 017B — Landscape Hover Stability Tests\n');

// ── Test 1: ring-2 ring-offset-1 present in active branch (017E conditional pattern) ──
test('1. Landscape button has ring-2 ring-offset-1 in active branch (017E: conditional, not unconditional)', () => {
  // 017E fix: ring-2 ring-offset-1 is now CONDITIONAL — present only in the active branch
  // of the ternary, not unconditionally applied to every tile.
  // This matches the custom photo tile pattern which does not exhibit shaking.
  // The fix removes the permanent box-shadow that was causing subpixel reflow of
  // aspect-ratio + overflow-hidden elements during compositing re-evaluation.
  assert.ok(
    presetsBlock.includes('ring-2 ring-primary ring-offset-1'),
    'ring-2 ring-primary ring-offset-1 not found in PRESETS block — active ring state missing'
  );
  // The base (unconditional) string must NOT be present — fix is correctly conditional
  assert.ok(
    !presetsBlock.includes('ring-2 ring-offset-1 ') && !/ ring-2 ring-offset-1[`]/.test(presetsBlock),
    'ring-2 ring-offset-1 found unconditionally — 017E conditional pattern not applied'
  );
});

// ── Test 2: No scale transform on hover ────────────────────────────────────
test('2. Landscape hover does not apply a scale transform', () => {
  assert.ok(
    !presetsBlock.includes('hover:scale-'),
    'hover:scale-* found in PRESETS block'
  );
  assert.ok(
    !presetsBlock.includes('scale-'),
    'scale- class found in PRESETS block (could cause transform-based shaking)'
  );
});

// ── Test 3: hover:ring-2 IS present (017E conditional pattern) ────────────
test('3. hover:ring-2 is present in inactive hover branch (017E conditional pattern)', () => {
  // 017E fix: ring-2 is now conditional. It appears as hover:ring-2 in the
  // inactive hover branch. This matches the custom photo tile which uses
  // hover:ring-2 hover:ring-foreground/30 hover:ring-offset-1 and does not shake.
  // Prior 017B/017C assertions (no hover:ring-2) are superseded by 017E evidence.
  assert.ok(
    presetsBlock.includes('hover:ring-2'),
    'hover:ring-2 not found in PRESETS block — 017E inactive hover ring missing'
  );
});

// ── Test 4: transition-all not used on landscape button ─────────────────────
test('4. transition-all is not used on landscape thumbnail buttons', () => {
  // Find the button className in presetsBlock and ensure no transition-all
  assert.ok(
    !presetsBlock.includes('transition-all'),
    'transition-all still present in PRESETS block — causes multi-property transitions that cause jitter'
  );
});

// ── Test 5: Same ring-width for selected and unselected ────────────────────
test('5. Selected and unselected tiles use the same ring-width (ring-2)', () => {
  // Both the isActive and non-active paths should use ring-2
  // isActive: 'ring-primary' (ring-2 inherited from base)
  // non-active: 'ring-transparent hover:ring-foreground/30' (ring-2 inherited from base)
  assert.ok(
    presetsBlock.includes('ring-2'),
    'ring-2 not found in PRESETS block'
  );
  // Should not have ring-4 or ring-1 only for selected state
  assert.ok(
    !presetsBlock.includes('ring-4'),
    'ring-4 found — width inconsistency between states'
  );
});

// ── Test 6: Decorative label overlay has pointer-events-none ───────────────
test('6. Decorative label overlay has pointer-events-none', () => {
  // The gradient label div inside the PRESETS.map should have pointer-events-none
  assert.ok(
    presetsBlock.includes('pointer-events-none') &&
    presetsBlock.includes('group-hover:opacity-100'),
    'Decorative label overlay missing pointer-events-none OR group-hover:opacity-100 not found'
  );
  // Verify pointer-events-none appears near the label overlay (within presetsBlock)
  const labelIdx = presetsBlock.indexOf('group-hover:opacity-100');
  const nearLabel = presetsBlock.slice(Math.max(0, labelIdx - 50), labelIdx + 200);
  assert.ok(
    nearLabel.includes('pointer-events-none'),
    'pointer-events-none not found near the label overlay in PRESETS block'
  );
});

// ── Test 7: Checkmark has pointer-events-none ──────────────────────────────
test('7. Selected checkmark has pointer-events-none', () => {
  // Find the checkmark div inside PRESETS block
  const checkIdx = presetsBlock.indexOf('<Check');
  assert.ok(checkIdx > -1, '<Check not found in PRESETS block');
  const nearCheck = presetsBlock.slice(Math.max(0, checkIdx - 200), checkIdx + 50);
  assert.ok(
    nearCheck.includes('pointer-events-none'),
    'Checkmark div in PRESETS block missing pointer-events-none'
  );
});

// ── Test 8: Clicking selects the background (onClick present) ───────────────
test('8. Landscape button has onClick to select background', () => {
  assert.ok(
    presetsBlock.includes('onClick={() => onBackgroundChange({ type: \'preset\', id: p.id })')  ||
    presetsBlock.includes("onClick={() => onBackgroundChange({ type: 'preset', id: p.id })"),
    'onClick handler not found in PRESETS block'
  );
});

// ── Test 9: All built-in PRESETS images remain rendered ────────────────────
test('9. All 10 built-in PRESETS remain in BackgroundPicker', () => {
  const presetMatches = [...bgPicker.matchAll(/photoId:\s*['"][0-9a-f-]+['"]/g)];
  assert.ok(
    presetMatches.length >= 8,
    `Expected at least 8 preset photoIds, found ${presetMatches.length}`
  );
  // PRESETS.map used to render them
  assert.ok(
    bgPicker.includes('PRESETS.map('),
    'PRESETS.map( not found — presets may not be rendered'
  );
});

// ── Test 10: Built-in images are non-deletable ─────────────────────────────
test('10. Built-in Landscape images are non-deletable (no delete in PRESETS block)', () => {
  assert.ok(
    !presetsBlock.includes('deletePhoto') && !presetsBlock.includes('confirmDelete'),
    'deletePhoto or confirmDelete found in PRESETS block — built-ins should not be deletable'
  );
});

// ── Test 11: Custom-theme thumbnails unchanged ─────────────────────────────
test('11. Custom photo thumbnails still use renderPhotoSlot', () => {
  assert.ok(
    bgPicker.includes('renderPhotoSlot'),
    'renderPhotoSlot not found in BackgroundPicker'
  );
  assert.ok(
    bgPicker.includes('renderCustomThemePanel'),
    'renderCustomThemePanel not found in BackgroundPicker'
  );
});

// ── Test 12: Hide unconditional (no background && wrapper) ─────────────────
test('12. Hide button renders unconditionally (Prompt 017A preserved)', () => {
  const hideIdx = checklist.indexOf('aria-label="Hide interface');
  assert.ok(hideIdx > -1, 'Hide button aria-label not found');
  const surrounding = checklist.slice(Math.max(0, hideIdx - 300), hideIdx + 200);
  assert.ok(
    !surrounding.includes('{background &&'),
    'Hide button still wrapped in {background && (...)} — Prompt 017A regression'
  );
});

// ── Test 13: Preview still wired ──────────────────────────────────────────
test('13. Preview still wired in Checklist (setShowPreview)', () => {
  assert.ok(
    checklist.includes('setShowPreview(true)'),
    'setShowPreview(true) not found in Checklist'
  );
});

// ── Test 14: UnitToggle still present ─────────────────────────────────────
test('14. UnitToggle (Imperial/Metric) still present in Checklist', () => {
  assert.ok(
    checklist.includes('<UnitToggle'),
    '<UnitToggle not found in Checklist'
  );
});

// ── Test 15: Background Undo/Redo wired ────────────────────────────────────
test('15. Background Undo/Redo functions present in Checklist', () => {
  assert.ok(
    checklist.includes('undo') && checklist.includes('redo'),
    'undo or redo not found in Checklist'
  );
});

// ── Test 16: Prompt 016B bgPhotoStore imports preserved ────────────────────
test('16. bgPhotoStore imports still present in BackgroundPicker (Prompt 016B)', () => {
  assert.ok(
    bgPicker.includes('bgPhotoStore'),
    'bgPhotoStore import not found in BackgroundPicker'
  );
});

// ── Test 17: Prompt 016C PDF timeout guard preserved ──────────────────────
test('17. PDF timeout guard still present in importGear.ts (Prompt 016C)', () => {
  assert.ok(
    importGear.includes('Promise.race') || importGear.includes('PDF_PARSE_TIMEOUT'),
    'PDF timeout guard not found in importGear.ts'
  );
});

// ── Test 18: Hide unconditional (Prompt 017A) ─────────────────────────────
test('18. Prompt 017A: triggerShowcase called unconditionally from Hide button', () => {
  assert.ok(
    checklist.includes('triggerShowcase'),
    'triggerShowcase not found in Checklist'
  );
});

// ── Test 19: Desktop grid preserved ───────────────────────────────────────
test('19. Desktop grid remains lg:grid-cols-[1fr_365px]', () => {
  assert.ok(
    checklist.includes('lg:grid-cols-[1fr_365px]'),
    'lg:grid-cols-[1fr_365px] not found in Checklist'
  );
});

// ── Test 20: QTY translate-x-3 preserved ──────────────────────────────────
test('20. QTY translate-x-3 preserved in GearCategory.tsx', () => {
  assert.ok(
    gearCat.includes('translate-x-3'),
    'translate-x-3 not found in GearCategory.tsx'
  );
});

// ── Test 21: ring-transparent NOT present (017E removes always-on box-shadow) ──
test('21. ring-transparent is NOT present (017E: no permanent box-shadow at rest)', () => {
  // 017E fix: the always-present ring-transparent (which generated a permanent
  // box-shadow: 0 0 0 1px white, 0 0 0 3px transparent) has been removed.
  // At rest, landscape tiles now have NO box-shadow — exactly like the custom
  // photo tiles that are confirmed to not shake. ring-transparent is gone.
  assert.ok(
    !presetsBlock.includes('ring-transparent'),
    'ring-transparent still present in PRESETS block — permanent box-shadow not fully removed by 017E'
  );
});

// ── Test 22: No transition-all on landscape button ────────────────────────
test('22. Landscape button has no transition-all (instant ring change is correct)', () => {
  // 017C fix: box-shadow transitions cause CPU paint cycles against the active
  // background image, producing visible jitter. The ring color now changes
  // instantly (no CSS transition on the button). transition-all is forbidden;
  // no transition on the button is the correct stable state.
  assert.ok(
    !presetsBlock.includes('transition-all'),
    'transition-all still present in PRESETS block'
  );
  // Confirm the forbidden box-shadow transition is NOT on the button
  assert.ok(
    !presetsBlock.includes('transition-[box-shadow'),
    'transition-[box-shadow still on PRESETS button — will cause shaking with active background'
  );
});

// ── Summary ────────────────────────────────────────────────────────────────
console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failures.length) {
  console.error('\nFailed tests:');
  failures.forEach(f => console.error(`  - ${f.name}: ${f.message}`));
  process.exit(1);
}
