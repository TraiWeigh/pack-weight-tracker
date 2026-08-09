/**
 * newClearLight041.test.mjs
 *
 * Task #41 — New always starts with no background (Clear) and Light mode
 *
 * Verifies:
 *   1.  handleNew bg bundle always sets background: null  (Clear)
 *   2.  handleNew bg bundle always sets bgTone: 'light'
 *   3.  handleNew bg bundle uses default bgFade: 1
 *   4.  handleNew bg bundle uses default bgSize: 'cover'
 *   5.  handleNew bg bundle still includes chartPaletteKey (palette inherited)
 *   6.  handleNew useCallback deps no longer list background / bgFade / bgTone / bgSize
 *   7.  Gear newseed still carries __blank:true  (Prompt 020 zero-category fix intact)
 *   8.  Active file identity still cleared on New
 *   9.  Reset handler separate from handleNew (Reset unchanged)
 *  10.  LOCKER_KEY present (Locker data unaffected)
 *  11.  Background library keys (IndexedDB / photo-collection / BG_STORAGE) NOT written
 *       inside handleNew (libraries are untouched)
 *  12.  019 WeightDistribution + panelOpen still present (prior work intact)
 *  13.  018C filename pill centering preserved
 *  14.  parseV5 __blank branch still present (020 fix intact)
 *  15.  bgTone literal in bg bundle is exactly 'light' (not a variable)
 *  16.  background literal in bg bundle is null (not a variable reference)
 *
 * NOTE: Runtime tests (click New → verify no background, Light mode, add category,
 * import auto-category, save, reopen File A) require manual acceptance testing.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import assert from 'assert/strict';

const checklistPath = resolve(process.cwd(), 'artifacts/pack-checklist/src/pages/Checklist.tsx');
const packDataPath  = resolve(process.cwd(), 'artifacts/pack-checklist/src/hooks/usePackData.ts');

const checklist = readFileSync(checklistPath, 'utf8');
const packData  = readFileSync(packDataPath,  'utf8');

// Locate handleNew body
const handleNewStart = checklist.indexOf('const handleNew = useCallback(');
assert.ok(handleNewStart > -1, 'handleNew not found in Checklist.tsx');
// Capture from start through the closing dependency array line
const handleNewEnd = checklist.indexOf('\n  }, [', handleNewStart) + 200;
const handleNewBody = checklist.slice(handleNewStart, handleNewEnd);

// Locate the bg bundle object (tw-newseed-bg-) within handleNew
const bgBundleStart = handleNewBody.indexOf('tw-newseed-bg-');
assert.ok(bgBundleStart > -1, 'tw-newseed-bg- key not found in handleNew');
const bgBundleBlock = handleNewBody.slice(bgBundleStart, bgBundleStart + 400);

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('\nTask #41 — New always starts Clear + Light mode\n');

// ── BACKGROUND BUNDLE: FIXED VALUES ──────────────────────────────────────────

test('1. bg bundle: background is null (Clear — no inherited background)', () => {
  assert.ok(
    bgBundleBlock.includes('background: null'),
    'background: null not found in bg bundle — New may still inherit source background'
  );
});

test('2. bg bundle: bgTone is literal "light" (Light mode — not inherited)', () => {
  assert.ok(
    bgBundleBlock.includes("bgTone: 'light'") || bgBundleBlock.includes('bgTone: "light"'),
    "bgTone: 'light' not found in bg bundle — New may still inherit source tone"
  );
});

test('3. bg bundle: bgFade is 1 (default — not inherited)', () => {
  assert.ok(
    bgBundleBlock.includes('bgFade: 1'),
    'bgFade: 1 not found in bg bundle — New may still inherit source fade'
  );
});

test('4. bg bundle: bgSize is literal "cover" (default — not inherited)', () => {
  assert.ok(
    bgBundleBlock.includes("bgSize: 'cover'") || bgBundleBlock.includes('bgSize: "cover"'),
    "bgSize: 'cover' not found in bg bundle — New may still inherit source size"
  );
});

test('5. bg bundle still includes chartPaletteKey (palette still inherited)', () => {
  assert.ok(
    bgBundleBlock.includes('chartPaletteKey'),
    'chartPaletteKey not found in bg bundle — chart palette inheritance removed'
  );
});

// ── DEPENDENCY ARRAY: NO LIVE BACKGROUND STATE ────────────────────────────────

// The dep array is the `}, [...]` at the end of useCallback
const depsStart = handleNewBody.lastIndexOf('}, [');
const depsEnd   = handleNewBody.indexOf(']', depsStart);
const depsStr   = depsStart > -1 ? handleNewBody.slice(depsStart, depsEnd + 1) : '';

test('6a. useCallback deps no longer include `background`', () => {
  // background should not be a dep since we write null unconditionally
  // Allow 'background' appearing only inside chartPaletteKey or similar — check the deps array
  assert.ok(
    !depsStr.includes('background,') && !depsStr.match(/\bbackground\b/),
    '`background` still in useCallback deps — should be removed since it is no longer read'
  );
});

test('6b. useCallback deps no longer include `bgFade`', () => {
  assert.ok(!depsStr.includes('bgFade'), '`bgFade` still in useCallback deps');
});

test('6c. useCallback deps no longer include `bgTone`', () => {
  assert.ok(!depsStr.includes('bgTone'), '`bgTone` still in useCallback deps');
});

test('6d. useCallback deps no longer include `bgSize`', () => {
  assert.ok(!depsStr.includes('bgSize'), '`bgSize` still in useCallback deps');
});

test('6e. useCallback deps still include `chartPaletteKey`', () => {
  assert.ok(depsStr.includes('chartPaletteKey'), '`chartPaletteKey` missing from useCallback deps');
});

// ── PROMPT 020 ZERO-CATEGORY FIX INTACT ──────────────────────────────────────

test('7. Gear newseed still carries __blank: true (Prompt 020 intact)', () => {
  assert.ok(handleNewBody.includes('__blank: true'), '__blank: true not found — 020 zero-category fix may be broken');
});

test('8. Gear newseed still has order: [] (Prompt 020 intact)', () => {
  assert.ok(handleNewBody.includes('order: []'), 'order: [] not found — 020 fix may be broken');
});

// ── ACTIVE FILE IDENTITY CLEARED ─────────────────────────────────────────────

test('9. Active locker file cleared on New (writeActiveLockerFileToSS(null))', () => {
  assert.ok(handleNewBody.includes('writeActiveLockerFileToSS(null)'), 'writeActiveLockerFileToSS(null) not found');
});

test('10. setActiveLockerFile(null) still called on New', () => {
  assert.ok(handleNewBody.includes('setActiveLockerFile(null)'), 'setActiveLockerFile(null) not found');
});

// ── PROTECTED FEATURES ────────────────────────────────────────────────────────

test('11. Reset handler is separate from handleNew', () => {
  assert.ok(checklist.includes('handleReset'), 'handleReset not found — Reset may be broken');
  assert.ok(!handleNewBody.includes('handleReset'), 'handleNew calls handleReset — they must be independent');
});

test('12. LOCKER_KEY still present (Locker data unaffected)', () => {
  assert.ok(packData.includes("export const LOCKER_KEY"), 'LOCKER_KEY missing from usePackData.ts');
});

test('13. handleNew does NOT write to IndexedDB/photo-collection keys (libraries untouched)', () => {
  // Background libraries live in IndexedDB or 'trailweigh:photoCollections' —
  // handleNew should never reference those keys
  assert.ok(
    !handleNewBody.includes('trailweigh:photoCollections') && !handleNewBody.includes('photoCollections'),
    'handleNew references photo-collection storage — should never touch background libraries'
  );
});

test('14. 019 WeightDistribution import present (019 work intact)', () => {
  assert.ok(checklist.includes('WeightDistribution'), 'WeightDistribution missing — 019 may be broken');
});

test('15. 019 panelOpen prop present (019 work intact)', () => {
  assert.ok(checklist.includes('panelOpen={backgroundPickerOpen}'), '019 panelOpen prop missing');
});

test('16. 018C filename pill centering preserved (021O: pt-8 moved to toolbar group parent)', () => {
  // 021O removed pt-8 from the overlay; top spacing is now on the toolbar-group parent (pt-4).
  assert.ok(
    // 022W: pill wrapper now uses lg:absolute for desktop centering (in-flow on mobile)
    checklist.includes('lg:absolute lg:inset-0') && checklist.includes('pointer-events-none'),
    '018C filename pill centering classes not found — 021O: pt-8 removed from overlay'
  );
});

test('17. parseV5 __blank branch still present (020 fix intact)', () => {
  assert.ok(packData.includes('p.__blank'), 'p.__blank branch missing from parseV5 — 020 fix may be broken');
});

// ── LITERALNESS GUARD ─────────────────────────────────────────────────────────

test('18. bgTone value in bg bundle is the string literal "light" (not a variable)', () => {
  // The bgTone line should be a literal, not `bgTone,` (shorthand from variable)
  // Presence of `bgTone: 'light'` already tested; ensure `bgTone,` (shorthand) is NOT there
  // Allow bgTone shorthand OUTSIDE the bg bundle (e.g. in state declarations)
  // Just check the bundle block itself
  const hasBgToneShorthand = bgBundleBlock.includes('bgTone,');
  const hasBgToneLiteral   = bgBundleBlock.includes("bgTone: 'light'") || bgBundleBlock.includes('bgTone: "light"');
  assert.ok(!hasBgToneShorthand || hasBgToneLiteral, 'bgTone in bg bundle appears to be a variable reference, not the literal "light"');
});

test('19. background value in bg bundle is null literal (not a variable reference)', () => {
  const hasBgRef    = bgBundleBlock.includes('background: background') || bgBundleBlock.includes('background ?? null');
  const hasBgNull   = bgBundleBlock.includes('background: null');
  assert.ok(!hasBgRef && hasBgNull, 'background in bg bundle still references the live `background` variable — should be null literal');
});

// ── NEW TAB INIT PATH: bgTone initialiser reads 'light' ──────────────────────

test('20. bgTone initializer reads tw-newbg-tone from sessionStorage (consumed in new tab)', () => {
  // Lines 141–189 show the background initializer; a sister initializer reads bgTone.
  // Confirm the sessionStorage key tw-newbg-tone is present so Light mode is picked up.
  assert.ok(
    checklist.includes('tw-newbg-tone'),
    'tw-newbg-tone sessionStorage key not found — bgTone may not be restored on new tab'
  );
});

console.log('\n────────────────────────────────────────────────────');
console.log('Tests: 20');
console.log('\n⚠️  Automated tests verify structural correctness only.');
console.log('Runtime acceptance (click New → Clear background, Light mode, add category,');
console.log('import auto-category, save, reopen File A) requires manual testing.');
