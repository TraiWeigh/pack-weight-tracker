/**
 * lockerFirstOpen020B.test.mjs
 *
 * Prompt 020B — Restore Saved Appearance on First Open After New
 *
 * Root cause: handleLoadFromLocker's in-place path (totalItems===0, used when
 * the current list is blank) previously restored only chartPaletteKey + gear store,
 * leaving background/bgTone/bgFade at the New tab's null/light/1 values.
 *
 * Verifies:
 *   1.  In-place path calls setBackground (not just setChartPaletteKey)
 *   2.  In-place path persists background to BG_STORAGE_KEY localStorage
 *   3.  In-place path removes BG_STORAGE_KEY when entry.background is null
 *   4.  In-place path calls setBgTone to restore dark/light tone
 *   5.  In-place path persists bgTone to trailweigh:bgTone
 *   6.  In-place path calls setBgFade to restore fade/darken value
 *   7.  In-place path persists bgFade to trailweigh:bgFade
 *   8.  In-place path still restores chartPaletteKey (020 baseline intact)
 *   9.  In-place path still calls replaceStore (gear items restored)
 *  10.  In-place path still sets active file identity (writeActiveLockerFileToSS + setActiveLockerFile)
 *  11.  "Background is already in React state" stale comment no longer present
 *  12.  Non-empty path still opens ?savedListId= new tab (unchanged)
 *  13.  New still writes background:null (020A preserved)
 *  14.  New still writes bgTone:'light' (020A preserved)
 *  15.  New still writes __blank:true (020 preserved)
 *  16.  019 WeightDistribution + panelOpen preserved
 *  17.  018C filename pill centering preserved
 *  18.  parseV5 __blank branch preserved (020 fix)
 *  19.  Older entry fallback: code uses ?? 'light' for missing bgTone
 *  20.  Older entry fallback: code uses ?? 1 for missing bgFade
 *
 * NOTE: First-open visual rendering (background visible, Dark mode active on
 * first click) cannot be proved by static tests — requires user's acceptance test.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import assert from 'assert/strict';

const checklistPath = resolve(process.cwd(), 'artifacts/pack-checklist/src/pages/Checklist.tsx');
const packDataPath  = resolve(process.cwd(), 'artifacts/pack-checklist/src/hooks/usePackData.ts');

const checklist = readFileSync(checklistPath, 'utf8');
const packData  = readFileSync(packDataPath,  'utf8');

// Locate handleLoadFromLocker body
const fnStart = checklist.indexOf('const handleLoadFromLocker = (entry: LockerEntry)');
assert.ok(fnStart > -1, 'handleLoadFromLocker not found');
// Slice is generous: 020C added significant code to the in-place path
const fnBody = checklist.slice(fnStart, fnStart + 6000);

// Locate the in-place path block (between totalItems===0 check and the non-empty path)
const inPlaceStart = fnBody.indexOf('if (totalItems === 0)');
assert.ok(inPlaceStart > -1, 'in-place path (if totalItems===0) not found');
const inPlaceEnd   = fnBody.indexOf('// ── Non-empty path');
const inPlaceBlock = inPlaceStart > -1 && inPlaceEnd > -1
  ? fnBody.slice(inPlaceStart, inPlaceEnd)
  : fnBody.slice(inPlaceStart, inPlaceStart + 4000);

// Locate handleNew body for 020A checks
const handleNewStart = checklist.indexOf('const handleNew = useCallback(');
assert.ok(handleNewStart > -1, 'handleNew not found');
const handleNewEnd  = checklist.indexOf('\n  }, [', handleNewStart) + 200;
const handleNewBody = checklist.slice(handleNewStart, handleNewEnd);
const bgBundleBlock = handleNewBody.slice(handleNewBody.indexOf('tw-newseed-bg-'));

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('\nPrompt 020B — Restore Saved Appearance on First Open After New\n');

// ── IN-PLACE PATH: APPEARANCE RESTORATION ────────────────────────────────────

test('1. In-place path calls setBackground to restore background image', () => {
  assert.ok(
    inPlaceBlock.includes('setBackground(entry.background'),
    'setBackground(entry.background) not found in in-place path — background will not restore on first open'
  );
});

test('2. In-place path writes background to BG_STORAGE_KEY (non-null branch)', () => {
  assert.ok(
    inPlaceBlock.includes('BG_STORAGE_KEY, JSON.stringify(entry.background)'),
    'BG_STORAGE_KEY write with entry.background not found — localStorage will be stale'
  );
});

test('3. In-place path removes BG_STORAGE_KEY when entry.background is null', () => {
  assert.ok(
    inPlaceBlock.includes('localStorage.removeItem(BG_STORAGE_KEY)'),
    'localStorage.removeItem(BG_STORAGE_KEY) not found — stale bg may persist when entry has no background'
  );
});

test('4. In-place path calls setBgTone to restore dark/light tone', () => {
  assert.ok(
    inPlaceBlock.includes('setBgTone('),
    'setBgTone not called in in-place path — Dark/Light mode will not restore on first open'
  );
});

test('5. In-place path writes bgTone to trailweigh:bgTone localStorage', () => {
  assert.ok(
    inPlaceBlock.includes("'trailweigh:bgTone'"),
    "localStorage key 'trailweigh:bgTone' not written in in-place path — tone persistence missing"
  );
});

test('6. In-place path calls setBgFade to restore fade/darken value', () => {
  assert.ok(
    inPlaceBlock.includes('setBgFade('),
    'setBgFade not called in in-place path — fade/darken will not restore on first open'
  );
});

test('7. In-place path writes bgFade to trailweigh:bgFade localStorage', () => {
  assert.ok(
    inPlaceBlock.includes("'trailweigh:bgFade'"),
    "localStorage key 'trailweigh:bgFade' not written in in-place path — fade persistence missing"
  );
});

test('8. In-place path still restores chartPaletteKey', () => {
  assert.ok(
    inPlaceBlock.includes('setChartPaletteKey('),
    'setChartPaletteKey not found in in-place path — palette restoration removed'
  );
});

test('9. In-place path still calls replaceStore (gear items)', () => {
  assert.ok(
    inPlaceBlock.includes('replaceStore('),
    'replaceStore not found in in-place path — gear items will not load on first open'
  );
});

test('10. In-place path still sets active file identity (writeActiveLockerFileToSS)', () => {
  assert.ok(
    inPlaceBlock.includes('writeActiveLockerFileToSS('),
    'writeActiveLockerFileToSS not found in in-place path — filename pill will be blank'
  );
});

test('11. In-place path still sets setActiveLockerFile', () => {
  assert.ok(
    inPlaceBlock.includes('setActiveLockerFile('),
    'setActiveLockerFile not found in in-place path — active file identity not tracked'
  );
});

test('12. Stale "Background is already in React state" comment removed', () => {
  assert.ok(
    !inPlaceBlock.includes('Background is already in React state'),
    'Stale comment still present — update or remove to reflect correct behavior'
  );
});

// ── FALLBACK FOR OLDER LOCKER ENTRIES ─────────────────────────────────────────

test('19. Missing bgTone fallback: code uses ?? \'light\' (older entries)', () => {
  assert.ok(
    inPlaceBlock.includes("?? 'light'") || inPlaceBlock.includes('?? "light"'),
    "Missing bgTone fallback (?? 'light') not found — older entries without bgTone may break"
  );
});

test('20. Missing bgFade fallback: code uses ?? 1 (older entries)', () => {
  assert.ok(
    inPlaceBlock.includes('?? 1'),
    'Missing bgFade fallback (?? 1) not found — older entries without bgFade may break'
  );
});

// ── NON-EMPTY PATH UNCHANGED ─────────────────────────────────────────────────

test('13. Non-empty path still opens ?savedListId= new tab', () => {
  const nonEmptyIdx = fnBody.indexOf('savedListId=');
  assert.ok(nonEmptyIdx > -1, '?savedListId= not found in handleLoadFromLocker — non-empty path may be broken');
});

// ── 020A New STILL Opens Clear + Light ───────────────────────────────────────

test('14. New still writes background:null (020A Clear preserved)', () => {
  assert.ok(bgBundleBlock.includes('background: null'), 'background:null not in handleNew bg bundle — 020A Clear may be broken');
});

test('15. New still writes bgTone:"light" (020A Light mode preserved)', () => {
  assert.ok(
    bgBundleBlock.includes("bgTone: 'light'") || bgBundleBlock.includes('bgTone: "light"'),
    'bgTone:"light" not in handleNew bg bundle — 020A Light mode may be broken'
  );
});

test('16. New still writes __blank:true (020 zero-category preserved)', () => {
  assert.ok(handleNewBody.includes('__blank: true'), '__blank:true not in handleNew — 020 zero-category fix may be broken');
});

// ── PRIOR WORK PRESERVED ─────────────────────────────────────────────────────

test('17. 019 WeightDistribution imported in Checklist.tsx', () => {
  assert.ok(checklist.includes('WeightDistribution'), 'WeightDistribution missing — 019 panel separation broken');
});

test('18. 019 panelOpen prop present', () => {
  assert.ok(checklist.includes('panelOpen={backgroundPickerOpen}'), '019 panelOpen prop missing');
});

test('21. 018C filename pill centering preserved (inset-0 pb-3 — 021O removed pt-8)', () => {
  // 021O moved pt-8 from child panels to the toolbar-group parent (as pt-4).
  assert.ok(
    checklist.includes('absolute inset-0 pb-3 flex items-center justify-center pointer-events-none'),
    '018C filename pill centering classes not found — 021O: pt-8 removed from overlay'
  );
});

test('22. parseV5 __blank branch preserved (020 fix)', () => {
  assert.ok(packData.includes('p.__blank'), 'p.__blank missing from parseV5 — 020 zero-category fix broken');
});

test('23. Save toast wording correct (Saved [name], no extra quotes — 020F)', () => {
  // 020F removed wrapping quotes: toast reads "Saved Sierra" not 'Saved "Sierra"'
  assert.ok(checklist.includes('`Saved ${name}`'), 'Save toast must be `Saved ${name}` (no extra quotes)');
});

test('24. LOCKER_KEY still exported from usePackData', () => {
  assert.ok(packData.includes('export const LOCKER_KEY'), 'LOCKER_KEY missing — Locker storage broken');
});

console.log('\n────────────────────────────────────────────────────');
console.log('Tests: 24');
console.log('\n⚠️  Automated tests verify structural correctness only.');
console.log('First-open visual rendering (background visible, Dark mode active without');
console.log('a second open) requires the user\'s fresh-preview acceptance test.');
