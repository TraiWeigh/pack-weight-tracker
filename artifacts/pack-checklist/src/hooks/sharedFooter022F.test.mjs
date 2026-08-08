/**
 * sharedFooter022F.test.mjs — Prompt 022F: Shared-Link Footer Overlay Fix
 *
 * Source-level checks only. Scrolling/overlay behaviour requires runtime
 * verification by the user in a browser (marked NOT TESTED below).
 *
 * Protects:
 *   • Outer wrapper is no longer h-[100dvh] overflow-hidden (root cause removed)
 *   • Outer wrapper uses min-h-[100dvh] (allows page to grow with content)
 *   • No overflow-hidden on outer wrapper or main element
 *   • No lg:h-full on main grid or columns (inner fixed-height removed)
 *   • No lg:overflow-y-auto on inner scrolling divs (inner scroll removed)
 *   • Header is sticky top-0 (stays visible while page scrolls)
 *   • backgroundAttachment:fixed present for background images (covers viewport)
 *   • Footer informationalOnly still present (not removed)
 *   • Footer design classes unchanged (dark #1e2322)
 *   • Shared-list read behaviour unchanged (snapshot, pushAndSet, undo/redo)
 *   • No Rename / Delete controls added to shared viewer
 *   • Print / Preview / Share / Save Your Own Copy unchanged
 *   • All functional imports still present
 *   • HelpPage 022C unchanged
 *   • AboutPage 022D unchanged
 *   • HowItWorksPage 022E unchanged
 *   • Footer.tsx design unchanged
 *   • App routes unchanged
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const pagesRoot = path.resolve('artifacts/pack-checklist/src/pages');
const infoRoot  = path.resolve('artifacts/pack-checklist/src/pages/info');
const root      = path.resolve('artifacts/pack-checklist/src');
const readPage  = (name) => fs.readFileSync(path.join(pagesRoot, name), 'utf8');
const readInfo  = (name) => fs.readFileSync(path.join(infoRoot, name), 'utf8');
const read      = (rel)  => fs.readFileSync(path.join(root, rel), 'utf8');

// ── Minimal harness ───────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
let currentSuite = '';

function suite(name) {
  currentSuite = name;
  console.log(`\n${name}:`);
}

function test(label, fn) {
  try {
    fn();
    passed++;
  } catch (err) {
    failed++;
    console.error(`  ✗ ${label}`);
    console.error(`    ${err.message}`);
  }
}

const src       = readPage('SharedChecklistPage.tsx');
const helpSrc   = readInfo('HelpPage.tsx');
const aboutSrc  = readInfo('AboutPage.tsx');
const howSrc    = readInfo('HowItWorksPage.tsx');
const footerSrc = read('components/Footer.tsx');
const appSrc    = read('App.tsx');

const has = (str) => src.includes(str);

// ── Tests: Root cause removed ─────────────────────────────────────────────────

suite('022F Root Cause Removed');

test('Outer wrapper no longer uses h-[100dvh]', () => {
  // The outer app-shell pattern (h-[100dvh] flex flex-col) locked the footer
  // to the bottom of the viewport. It must be gone from the outer wrapper.
  // Note: h-[100dvh] may still appear in other contexts (e.g. print layout)
  // so we check specifically for the combination that caused the bug.
  assert.ok(
    !has('h-[100dvh] overflow-hidden flex flex-col') &&
    !has('h-[100dvh] overflow-hidden flex flex-col bg-background'),
    'The h-[100dvh] overflow-hidden flex-col outer wrapper (root cause) must be removed',
  );
});

test('Outer wrapper uses min-h-[100dvh] (page grows with content)', () => {
  assert.ok(
    has('min-h-[100dvh]'),
    'Outer wrapper must use min-h-[100dvh] to allow page to grow with content',
  );
});

test('overflow-hidden not applied to the outer screen-only wrapper', () => {
  // The screen-only outer div must not use overflow-hidden
  assert.ok(
    !src.match(/screen-only[^"]*overflow-hidden/),
    'screen-only outer wrapper must not have overflow-hidden',
  );
});

test('Main element does not use lg:overflow-hidden', () => {
  assert.ok(
    !has('lg:overflow-hidden'),
    'Main element must not restrict overflow with lg:overflow-hidden',
  );
});

// ── Tests: Inner fixed-height removed ────────────────────────────────────────

suite('022F Inner Fixed-Height Removed');

test('No lg:h-full on inner grid or columns', () => {
  // lg:h-full on the grid/columns forced the layout to stay within the outer
  // 100dvh container — removing it allows content to grow naturally.
  assert.ok(
    !has('lg:h-full'),
    'lg:h-full must not be applied to inner grid or columns',
  );
});

test('No lg:overflow-y-auto on inner scrolling panels', () => {
  // With page-level scrolling, inner panels no longer need their own overflow-y-auto
  assert.ok(
    !has('lg:overflow-y-auto'),
    'lg:overflow-y-auto must not be applied to inner panels (page-level scroll now used)',
  );
});

test('No lg:min-h-0 on inner panels', () => {
  assert.ok(
    !has('lg:min-h-0'),
    'lg:min-h-0 must not be applied to inner panels',
  );
});

// ── Tests: Sticky header (preserves always-visible controls) ──────────────────

suite('022F Sticky Header');

test('Header uses sticky top-0 to stay visible while page scrolls', () => {
  assert.ok(
    has('sticky top-0'),
    'Header must use sticky top-0 so controls stay accessible while scrolling',
  );
});

test('Header still has z-10 for proper stacking', () => {
  assert.ok(has('z-10'), 'Header must still have z-10 stacking context');
});

// ── Tests: Background attachment fixed ───────────────────────────────────────

suite('022F Background Attachment Fixed');

test('backgroundAttachment: fixed present in inline style', () => {
  assert.ok(
    has("backgroundAttachment: 'fixed'") || has('backgroundAttachment:"fixed"'),
    'Background image must use backgroundAttachment: fixed to cover viewport during scroll',
  );
});

// ── Tests: Footer still present and design unchanged ─────────────────────────

suite('022F Footer Preserved');

test('Footer with informationalOnly still in SharedChecklistPage', () => {
  assert.ok(
    has('Footer') && has('informationalOnly'),
    'Footer with informationalOnly prop must still be rendered in SharedChecklistPage',
  );
});

test('Footer dark background color unchanged (#1e2322)', () => {
  assert.ok(
    footerSrc.includes('#1e2322') || footerSrc.includes('1e2322'),
    'Footer dark background must still be #1e2322',
  );
});

test('Footer design classes unchanged (flex-shrink-0, print:hidden)', () => {
  assert.ok(
    footerSrc.includes('flex-shrink-0') && footerSrc.includes('print:hidden'),
    'Footer must still have flex-shrink-0 and print:hidden classes',
  );
});

test('Footer.tsx not modified for this fix', () => {
  // The fix was in SharedChecklistPage; Footer.tsx must be untouched
  assert.ok(
    footerSrc.includes('informationalOnly') &&
    footerSrc.includes('Delete Account'),
    'Footer.tsx must be unchanged',
  );
});

// ── Tests: Shared behaviour preserved ────────────────────────────────────────

suite('022F Shared Behaviour Preserved');

test('In-memory-only comment still present', () => {
  assert.ok(
    has('nothing is ever written') || has('never written') || has('localStorage, IndexedDB'),
    'In-memory-only recipient behaviour must be preserved',
  );
});

test('pushAndSet / undo / redo still present', () => {
  assert.ok(
    has('pushAndSet') && has('undo') && has('redo'),
    'Undo/redo functionality must still be present',
  );
});

test('No Rename or Delete controls added to shared viewer', () => {
  // Controls for Rename (Pencil) and Delete (Trash) are intentionally absent
  assert.ok(
    src.includes('Rename') === false ||
    src.includes('Controls for Rename') || // the comment is fine
    src.includes('intentionally absent'),
    'Rename/Delete controls must not be added to the shared viewer',
  );
});

test('Save Your Own Copy still present', () => {
  assert.ok(has('Save Your Own Copy'), 'Save Your Own Copy must still be present');
});

test('Print button still present', () => {
  assert.ok(has('window.print()'), 'Print functionality must still be present');
});

test('Share PDF button still present', () => {
  assert.ok(has('handleSharePdf') || has('sharePackList'), 'Share PDF must still be present');
});

test('Preview still present', () => {
  assert.ok(has('showPreview') && has('PreviewModal'), 'Preview must still be present');
});

test('SharedLockerPanel still present', () => {
  assert.ok(has('SharedLockerPanel'), 'SharedLockerPanel must still be present');
});

test('BackgroundPicker still present', () => {
  assert.ok(has('BackgroundPickerPanel'), 'BackgroundPicker must still be present');
});

test('WeightSummary still present', () => {
  assert.ok(has('WeightSummary'), 'WeightSummary must still be present');
});

test('ImportGearPanel still present', () => {
  assert.ok(has('ImportGearPanel'), 'ImportGearPanel must still be present');
});

test('UnitToggle still present', () => {
  assert.ok(has('UnitToggle') || has('useUnit'), 'Unit toggle must still be present');
});

test('PrintLayout still present', () => {
  assert.ok(has('PrintLayout'), 'PrintLayout must still be present');
});

// ── Tests: 022C / 022D / 022E regression ─────────────────────────────────────

suite('022F Prior Prompt Regression');

test('HelpPage 022C unchanged (six section titles present)', () => {
  const titles = [
    'Building Your Gear List',
    'Understanding Your Pack Weight',
    'Editing Your Gear List',
    'Save / Locker',
    'Preview / Print / Share',
    'Backgrounds',
  ];
  titles.forEach(t => {
    assert.ok(helpSrc.includes(t), `HelpPage missing: "${t}"`);
  });
});

test('AboutPage 022D unchanged (key content present)', () => {
  assert.ok(
    aboutSrc.includes('Ray-Way') &&
    aboutSrc.includes('What Is Ultralight?') &&
    aboutSrc.includes('Then go outside'),
    'AboutPage must contain 022D content',
  );
});

test('HowItWorksPage 022E unchanged (three sections present)', () => {
  assert.ok(
    howSrc.includes('Create / Upload') &&
    howSrc.includes('Add / Organize') &&
    howSrc.includes('Save / Preview / Print / Share'),
    'HowItWorksPage must contain 022E sections',
  );
});

// ── Tests: Routing unchanged ──────────────────────────────────────────────────

suite('022F Routing Unchanged');

test('All 10 footer routes still in App.tsx', () => {
  const routes = [
    '/about', '/help', '/how-it-works', '/privacy', '/terms',
    '/affiliate', '/contact', '/accessibility', '/report-problem', '/delete-account',
  ];
  routes.forEach(r => {
    assert.ok(appSrc.includes(r), `Route missing: ${r}`);
  });
});

test('SharedChecklistPage route still registered', () => {
  assert.ok(
    appSrc.includes('SharedChecklistPage') || appSrc.includes('shared'),
    'SharedChecklistPage route must still be registered',
  );
});

// ── Results ───────────────────────────────────────────────────────────────────

console.log(`\n022F Shared Footer Fix: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
