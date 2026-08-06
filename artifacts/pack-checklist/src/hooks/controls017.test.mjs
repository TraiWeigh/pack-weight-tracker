/**
 * controls017.test.mjs  —  Prompt 017
 *
 * Verifies control reorganisation:
 *  1.  "Showcase" pill no longer appears in normal view source.
 *  2.  "Hide" pill is rendered (in the main control row).
 *  3.  Hide calls triggerShowcase (the existing Showcase handler).
 *  4.  DOM order: Hide → Preview → Imperial (source order check).
 *  5.  Only one normal-view Preview trigger exists in Checklist.tsx.
 *  6.  The sidebar Preview pill above Pack Summary is removed.
 *  7.  UnitToggle (Imperial) remains after Preview in the control row.
 *  8.  BackgroundPicker panel no longer renders a Showcase button.
 *  9.  Main grid remains lg:grid-cols-[1fr_365px].
 * 10.  QTY translate-x-3 is preserved.
 * 11.  Prompt 015 per-file palette state variable still present.
 * 12.  Prompt 016B bgPhotoStore imports still present.
 * 13.  Prompt 016C PDF timeout guard still present.
 * 14.  Hide button uses triggerShowcase (not a new state).
 * 15.  BackgroundShowcase overlay still wired (exitShowcase / onWake).
 * 16.  Hide disabled conditions match original isShowcaseBlocked logic.
 * 17.  Hide has aria-label for accessibility.
 * 18.  Preview has aria-label for accessibility.
 * 19.  Hide → Preview → Imperial appear in that source order.
 * 20.  SharedChecklistPage Preview trigger is not modified.
 * 21.  PreviewModal is still imported/rendered in Checklist.
 * 22.  onShowcase prop still accepted by BackgroundPickerPanel (no TS break).
 * 23.  Sidebar action bar still contains Share.
 * 24.  pnpm test:importer script includes importGear.pdf.api.test.mjs.
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

// ── Load source files ──────────────────────────────────────────────────────

const checklist   = read('artifacts/pack-checklist/src/pages/Checklist.tsx');
const bgPicker    = read('artifacts/pack-checklist/src/components/BackgroundPicker.tsx');
const gearCat     = read('artifacts/pack-checklist/src/components/GearCategory.tsx');
const shared      = read('artifacts/pack-checklist/src/pages/SharedChecklistPage.tsx');
const importGear  = read('artifacts/api-server/src/routes/importGear.ts');
const pkgJson     = read('package.json');

// ── Tests ─────────────────────────────────────────────────────────────────

console.log('\nPrompt 017 — Control Reorganisation Tests\n');

// 1. Showcase label gone from normal interface
test('1. "Showcase" pill no longer rendered in BackgroundPicker panel', () => {
  // The button JSX ">Showcase<" must not appear in the panel source
  assert.ok(
    !bgPicker.includes('>Showcase<'),
    'BackgroundPicker still renders >Showcase< button text'
  );
});

// 2. Hide pill rendered in Checklist
test('2. "Hide" pill rendered in Checklist main control row', () => {
  assert.ok(
    checklist.includes('>Hide<') || checklist.includes('Hide\n'),
    'Checklist does not render a Hide button'
  );
});

// 3. Hide calls triggerShowcase
test('3. Hide button calls triggerShowcase (existing handler)', () => {
  // The Hide button onClick must reference triggerShowcase
  const hideIdx = checklist.indexOf('Hide');
  assert.ok(hideIdx > -1, 'No Hide text found in Checklist');
  // Find the block containing Hide and check it has triggerShowcase nearby
  const nearHide = checklist.slice(Math.max(0, hideIdx - 300), hideIdx + 600);
  assert.ok(
    nearHide.includes('triggerShowcase'),
    'triggerShowcase not found near the Hide button'
  );
});

// 4. DOM order: Hide appears before Preview in source
test('4. Hide appears before Preview in Checklist source order', () => {
  const hideIdx    = checklist.lastIndexOf('>Hide<') > -1
    ? checklist.lastIndexOf('>Hide<')
    : checklist.indexOf('Hide\n');
  // Main-row Preview button (not in shared, not in sidebar)
  // Find setShowPreview(true) occurrences and their positions
  const previewMatches = [...checklist.matchAll(/setShowPreview\(true\)/g)].map(m => m.index);
  assert.ok(previewMatches.length > 0, 'No setShowPreview(true) found');
  // Hide must appear before at least one of them in source
  const anyPreviewAfterHide = previewMatches.some(pi => pi > hideIdx);
  assert.ok(anyPreviewAfterHide, `Hide (pos ${hideIdx}) is not before any Preview trigger in source`);
});

// 5. Only ONE normal-view Preview button in Checklist (sidebar one removed)
test('5. Only one setShowPreview(true) call in Checklist.tsx (sidebar removed)', () => {
  const matches = [...checklist.matchAll(/setShowPreview\(true\)/g)];
  assert.equal(
    matches.length, 1,
    `Expected 1 setShowPreview(true) in Checklist, found ${matches.length}`
  );
});

// 6. Sidebar Preview button (flex-wrap action bar) is removed
test('6. Sidebar action bar no longer contains a Preview button', () => {
  // The sidebar Preview had the distinctive class "bg-card hover:bg-muted/50"
  // and was near the Share button. Verify no second Preview with that style.
  const sidebarPreviewPattern = /bg-card hover:bg-muted\/50[^<]*Preview|Preview[^<]*bg-card hover:bg-muted\/50/;
  assert.ok(
    !sidebarPreviewPattern.test(checklist),
    'Sidebar Preview button (bg-card style) still present in Checklist'
  );
});

// 7. UnitToggle (Imperial) follows Preview in the control row
test('7. UnitToggle appears after the Preview button in Checklist source', () => {
  const previewIdx   = checklist.lastIndexOf('setShowPreview(true)');
  const unitToggleIdx = checklist.indexOf('<UnitToggle');
  assert.ok(previewIdx  > -1, 'setShowPreview(true) not found');
  assert.ok(unitToggleIdx > -1, '<UnitToggle not found');
  assert.ok(
    unitToggleIdx > previewIdx,
    `UnitToggle (pos ${unitToggleIdx}) is not after Preview (pos ${previewIdx})`
  );
});

// 8. BackgroundPicker panel header has no Showcase button
test('8. BackgroundPicker panel header has no Showcase button', () => {
  // The old pattern was: {onShowcase && (<button ...>Showcase</button>)}
  assert.ok(
    !bgPicker.includes('>Showcase</button>'),
    'BackgroundPicker still has >Showcase</button>'
  );
  assert.ok(
    !bgPicker.includes('>Showcase<'),
    'BackgroundPicker still has >Showcase< text'
  );
});

// 9. Desktop grid still lg:grid-cols-[1fr_365px]
test('9. Desktop grid remains lg:grid-cols-[1fr_365px]', () => {
  assert.ok(
    checklist.includes('lg:grid-cols-[1fr_365px]'),
    'lg:grid-cols-[1fr_365px] not found in Checklist'
  );
});

// 10. QTY translate-x-3 preserved (lives in GearCategory.tsx, not Checklist.tsx)
test('10. QTY translate-x-3 is preserved in GearCategory.tsx', () => {
  assert.ok(
    gearCat.includes('translate-x-3'),
    'translate-x-3 not found in GearCategory.tsx'
  );
});

// 11. Per-file palette state (chartPaletteKey) still present in Checklist
test('11. Per-file palette state (chartPaletteKey) still present in Checklist', () => {
  assert.ok(
    checklist.includes('chartPaletteKey'),
    'chartPaletteKey reference not found in Checklist'
  );
});

// 12. bgPhotoStore imports still present in BackgroundPicker
test('12. bgPhotoStore imports still present in BackgroundPicker', () => {
  assert.ok(
    bgPicker.includes('bgPhotoStore'),
    'bgPhotoStore import not found in BackgroundPicker'
  );
});

// 13. PDF timeout guard (parsePdfWithTimeout or PDF_PARSE_TIMEOUT) still present
test('13. PDF timeout guard still present in importGear.ts', () => {
  assert.ok(
    importGear.includes('PDF_PARSE_TIMEOUT') || importGear.includes('parsePdfWithTimeout') || importGear.includes('Promise.race'),
    'PDF timeout guard not found in importGear.ts'
  );
});

// 14. No new isHide or isHideMode state created
test('14. No new isHide / isHideMode state variable introduced', () => {
  assert.ok(
    !checklist.includes('isHideMode') && !checklist.includes('isHide,'),
    'New isHide* state variable found in Checklist — should reuse showcaseActive'
  );
  assert.ok(
    !checklist.includes("useState(false)") || checklist.indexOf('showcaseActive') > -1,
    'showcaseActive state is missing'
  );
});

// 15. BackgroundShowcase overlay still wired with exitShowcase
test('15. BackgroundShowcase overlay still wired with onWake={exitShowcase}', () => {
  assert.ok(
    checklist.includes('onWake={exitShowcase}'),
    'onWake={exitShowcase} not found — overlay exit may be broken'
  );
  assert.ok(
    checklist.includes('BackgroundShowcase'),
    'BackgroundShowcase overlay not found in Checklist'
  );
});

// 16. Hide disabled conditions include showPreview and showResetConfirm
test('16. Hide disabled conditions include showResetConfirm and showPreview', () => {
  const hideIdx = checklist.indexOf('aria-label="Hide interface');
  assert.ok(hideIdx > -1, 'Hide aria-label not found');
  const nearHide = checklist.slice(Math.max(0, hideIdx - 50), hideIdx + 500);
  assert.ok(nearHide.includes('showResetConfirm'), 'showResetConfirm not in Hide disabled conditions');
  assert.ok(nearHide.includes('showPreview'),      'showPreview not in Hide disabled conditions');
});

// 17. Hide has aria-label
test('17. Hide button has aria-label', () => {
  assert.ok(
    checklist.includes('aria-label="Hide interface'),
    'Hide button missing aria-label'
  );
});

// 18. Preview has aria-label
test('18. Preview button has aria-label', () => {
  assert.ok(
    checklist.includes('aria-label="Open checked-items preview"'),
    'Preview button missing aria-label'
  );
});

// 19. Source order: Hide → Preview → Imperial (UnitToggle)
test('19. Source order: Hide → Preview → UnitToggle', () => {
  const hidePos    = checklist.indexOf('aria-label="Hide interface');
  const previewPos = checklist.indexOf('aria-label="Open checked-items preview"');
  const togglePos  = checklist.indexOf('<UnitToggle');
  assert.ok(hidePos    > -1, 'Hide aria-label not found');
  assert.ok(previewPos > -1, 'Preview aria-label not found');
  assert.ok(togglePos  > -1, '<UnitToggle not found');
  assert.ok(hidePos    < previewPos, `Hide (${hidePos}) must come before Preview (${previewPos})`);
  assert.ok(previewPos < togglePos,  `Preview (${previewPos}) must come before UnitToggle (${togglePos})`);
});

// 20. SharedChecklistPage Preview trigger is unchanged
test('20. SharedChecklistPage still has its own Preview trigger', () => {
  assert.ok(
    shared.includes('setShowPreview(true)') || shared.includes('Preview'),
    'SharedChecklistPage Preview trigger appears missing'
  );
});

// 21. PreviewModal still imported and rendered in Checklist
test('21. PreviewModal still imported and rendered in Checklist', () => {
  assert.ok(
    checklist.includes('PreviewModal'),
    'PreviewModal not found in Checklist'
  );
  assert.ok(
    checklist.includes('showPreview &&'),
    'showPreview && conditional render not found'
  );
});

// 22. BackgroundPickerPanel still accepts onShowcase prop (no TS break)
test('22. BackgroundPickerPanel onShowcase prop still passed from Checklist', () => {
  assert.ok(
    checklist.includes('onShowcase={'),
    'onShowcase prop no longer passed to BackgroundPickerPanel — may cause TS error if still required'
  );
});

// 23. Sidebar action bar still contains Share
test('23. Share button still present in sidebar action bar', () => {
  assert.ok(
    checklist.includes('Share') && checklist.includes('showShareMenu'),
    'Share button not found in Checklist'
  );
});

// 24. pnpm test:importer includes the PDF API test suite
test('24. pnpm test:importer includes importGear.pdf.api.test.mjs', () => {
  assert.ok(
    pkgJson.includes('importGear.pdf.api.test.mjs'),
    'importGear.pdf.api.test.mjs not in pnpm test:importer'
  );
});

// ── Summary ───────────────────────────────────────────────────────────────

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failures.length) {
  console.error('\nFailed tests:');
  failures.forEach(f => console.error(`  - ${f.name}: ${f.message}`));
  process.exit(1);
}
