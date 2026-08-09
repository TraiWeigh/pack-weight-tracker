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
  // Locate by aria-label (unique to this button) rather than plain 'Hide' text,
  // which may appear in comments or other elements before the actual button.
  const hideIdx = checklist.indexOf('aria-label="Hide interface');
  assert.ok(hideIdx > -1, 'Hide aria-label not found in Checklist');
  // Check triggerShowcase appears in the surrounding block.
  const nearHide = checklist.slice(Math.max(0, hideIdx - 300), hideIdx + 600);
  assert.ok(
    nearHide.includes('triggerShowcase'),
    'triggerShowcase not found near the Hide button'
  );
});

// 4. Hide is NOT wrapped in a background-presence condition
test('4. Hide is not wrapped in {background && (...)} — renders unconditionally', () => {
  // Find the Hide aria-label (unique to this button) and check no `background &&`
  // guard appears in the surrounding 500-char window
  const hideIdx = checklist.indexOf('aria-label="Hide interface');
  assert.ok(hideIdx > -1, 'Hide aria-label not found in Checklist');
  const surrounding = checklist.slice(Math.max(0, hideIdx - 300), hideIdx + 600);
  assert.ok(
    !surrounding.includes('{background &&'),
    'Hide button is still wrapped in {background && (...)} — it will not render without a background'
  );
  assert.ok(
    !surrounding.includes('background &&\n') && !surrounding.includes('background && ('),
    'Hide button has a background-presence conditional guard'
  );
});

// 5. Preview calls in Checklist (sidebar one removed; 022W adds mobile+desktop copies)
test('5. Only one setShowPreview(true) call in Checklist.tsx (sidebar removed)', () => {
  // 022W: mobile portrait row 3 (lg:hidden) and desktop right group (hidden lg:flex) each have
  // one Preview button — both trigger setShowPreview(true). The sidebar Preview (bg-card style)
  // remains absent. Accept 1 or 2 calls; reject 0 or 3+.
  const matches = [...checklist.matchAll(/setShowPreview\(true\)/g)];
  assert.ok(
    matches.length >= 1 && matches.length <= 2,
    `Expected 1 or 2 setShowPreview(true) in Checklist (022W mobile+desktop rows), found ${matches.length}`,
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

// 7. UnitToggle (Imperial) follows Preview in the desktop right group
test('7. UnitToggle appears after the Preview button in Checklist source', () => {
  // 022W: desktop right group order is Hide → Preview → UnitToggle.
  // Use lastIndexOf so we find the desktop group's instances (not the mobile ones).
  const previewIdx    = checklist.lastIndexOf('setShowPreview(true)');
  const unitToggleIdx = checklist.lastIndexOf('<UnitToggle');
  assert.ok(previewIdx    > -1, 'setShowPreview(true) not found');
  assert.ok(unitToggleIdx > -1, '<UnitToggle not found');
  assert.ok(
    unitToggleIdx > previewIdx,
    `Last UnitToggle (pos ${unitToggleIdx}) must be after last Preview (pos ${previewIdx})`,
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

// 19. Source order: Hide → Preview → UnitToggle (in the desktop right group)
test('19. Source order: Hide → Preview → UnitToggle', () => {
  // 022W: mobile and desktop each have their own Hide/Preview/UnitToggle.
  // 023B: a second Hide also appears in the Lower Phone Toolbar (sidebar, after the
  //        desktop group in source order), so lastIndexOf no longer targets the desktop
  //        group reliably. Scope the check to the desktop-only right group section.
  const groupStart = checklist.indexOf('hidden lg:flex items-center gap-3 ml-auto flex-shrink-0');
  assert.ok(groupStart > -1, 'Desktop right group anchor not found');
  const section    = checklist.slice(groupStart, groupStart + 1500);
  const hidePos    = section.indexOf('aria-label="Hide interface');
  const previewPos = section.indexOf('aria-label="Open checked-items preview"');
  const togglePos  = section.indexOf('<UnitToggle');
  assert.ok(hidePos    > -1, 'Hide aria-label not found in desktop right group');
  assert.ok(previewPos > -1, 'Preview aria-label not found in desktop right group');
  assert.ok(togglePos  > -1, '<UnitToggle not found in desktop right group');
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
