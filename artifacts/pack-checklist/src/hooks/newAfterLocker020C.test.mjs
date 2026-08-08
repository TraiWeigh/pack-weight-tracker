/**
 * newAfterLocker020C.test.mjs
 *
 * Prompt 020C — Make New Deterministically Reset to Clear + Light
 *
 * Root cause: handleLoadFromLocker in-place path (020B fix) wrote the opened
 * file's background to the SHARED localStorage keys (BG_STORAGE_KEY,
 * trailweigh:bgTone, trailweigh:bgFade).  Fork tabs (opened via New with
 * ?newseed=) correctly read their own tw-newseed-bg-uuid on first render, but
 * on ANY React remount (Clerk token refresh cycles isLoaded→false→true) that
 * key is gone and the initializers fall through to the shared localStorage
 * keys — showing the last-opened file's background on the New tab.
 *
 * Fix:
 *   1. Background initializer: after consuming tw-newseed-bg-uuid, stash the
 *      background in sessionStorage tw-fork-bg-restore.  On remount (newseed-bg
 *      gone), check tw-fork-bg-restore first.  Never fall through to the global
 *      BG_STORAGE_KEY on fork tabs.
 *   2. bgTone/bgFade initialisers: add tw-fork-bgtone-restore /
 *      tw-fork-bgfade-restore checks before localStorage fallbacks.
 *   3. handleLoadFromLocker in-place: fork tabs write ONLY to sessionStorage
 *      restore keys; non-fork (primary) tabs write to localStorage as before.
 *   4. handleBackgroundChange / handleBgToneChange / handleBgFadeChange: also
 *      update the sessionStorage restore keys so remounts reflect explicit
 *      user choices, not the stale Locker-load value.
 *
 * Tests verify structural correctness.  The rendered "no random background"
 * guarantee requires user's fresh-preview acceptance test.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import assert from 'assert/strict';

const checklistPath = resolve(process.cwd(), 'artifacts/pack-checklist/src/pages/Checklist.tsx');
const checklist = readFileSync(checklistPath, 'utf8');

// ── Locate key blocks ─────────────────────────────────────────────────────────

// Background initializer
const bgInitStart = checklist.indexOf('const [background, setBackground] = useState<Background | null>(() => {');
assert.ok(bgInitStart > -1, 'background useState initializer not found');
const bgInitEnd   = checklist.indexOf('\n  });', bgInitStart) + 5;
const bgInitBlock = checklist.slice(bgInitStart, bgInitEnd);

// bgFade initializer
const bgFadeInitStart = checklist.indexOf('const [bgFade, setBgFade] = useState<number>(() => {');
assert.ok(bgFadeInitStart > -1, 'bgFade useState initializer not found');
const bgFadeInitEnd   = checklist.indexOf('\n  });', bgFadeInitStart) + 5;
const bgFadeInitBlock = checklist.slice(bgFadeInitStart, bgFadeInitEnd);

// bgTone initializer
const bgToneInitStart = checklist.indexOf("const [bgTone, setBgTone] = useState<'light' | 'dark'>(() => {");
assert.ok(bgToneInitStart > -1, 'bgTone useState initializer not found');
const bgToneInitEnd   = checklist.indexOf('\n  });', bgToneInitStart) + 5;
const bgToneInitBlock = checklist.slice(bgToneInitStart, bgToneInitEnd);

// handleBackgroundChange
const bgChangeStart = checklist.indexOf('const handleBackgroundChange = (bg: Background | null)');
assert.ok(bgChangeStart > -1, 'handleBackgroundChange not found');
const bgChangeEnd   = checklist.indexOf('\n  };', bgChangeStart) + 4;
const bgChangeBlock = checklist.slice(bgChangeStart, bgChangeEnd);

// handleBgFadeChange
const bgFadeChangeStart = checklist.indexOf('const handleBgFadeChange = (v: number)');
assert.ok(bgFadeChangeStart > -1, 'handleBgFadeChange not found');
const bgFadeChangeEnd   = checklist.indexOf('\n  };', bgFadeChangeStart) + 4;
const bgFadeChangeBlock = checklist.slice(bgFadeChangeStart, bgFadeChangeEnd);

// handleBgToneChange
const bgToneChangeStart = checklist.indexOf("const handleBgToneChange = (t: 'light' | 'dark')");
assert.ok(bgToneChangeStart > -1, 'handleBgToneChange not found');
const bgToneChangeEnd   = checklist.indexOf('\n  };', bgToneChangeStart) + 4;
const bgToneChangeBlock = checklist.slice(bgToneChangeStart, bgToneChangeEnd);

// handleLoadFromLocker — generous slice: 020C added significant code to the in-place path
const lockerStart = checklist.indexOf('const handleLoadFromLocker = (entry: LockerEntry)');
assert.ok(lockerStart > -1, 'handleLoadFromLocker not found');
const lockerFnBody = checklist.slice(lockerStart, lockerStart + 8000);
const inPlaceStart = lockerFnBody.indexOf('if (totalItems === 0)');
// Extend to the non-empty path marker (or 4000 chars, whichever is smaller)
const nonEmptyMarker = lockerFnBody.indexOf('// ── Non-empty path', inPlaceStart);
const inPlaceBlock = nonEmptyMarker > -1
  ? lockerFnBody.slice(inPlaceStart, nonEmptyMarker)
  : lockerFnBody.slice(inPlaceStart, inPlaceStart + 4000);

// handleNew
const handleNewStart = checklist.indexOf('const handleNew = useCallback(');
assert.ok(handleNewStart > -1, 'handleNew not found');
const handleNewEnd  = checklist.indexOf('\n  }, [', handleNewStart) + 200;
const handleNewBody = checklist.slice(handleNewStart, handleNewEnd);

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('\nPrompt 020C — Make New Deterministically Reset to Clear + Light\n');

// ── BACKGROUND INITIALIZER CHANGES ───────────────────────────────────────────

test('1. bg initializer stashes scoped tw-fork-bg-restore-${forkId} after consuming newseed-bg', () => {
  // 020E: keys are now forkId-scoped to prevent inherited-sessionStorage leakage.
  assert.ok(
    bgInitBlock.includes("tw-fork-bg-restore-${forkId}"),
    "scoped tw-fork-bg-restore-\${forkId} not set in background initializer — cross-tab leakage possible"
  );
});

test('2. bg initializer stashes scoped tw-fork-bgtone-restore-${forkId} after consuming newseed-bg', () => {
  assert.ok(
    bgInitBlock.includes("tw-fork-bgtone-restore-${forkId}"),
    "scoped tw-fork-bgtone-restore-\${forkId} not set in background initializer"
  );
});

test('3. bg initializer stashes scoped tw-fork-bgfade-restore-${forkId} after consuming newseed-bg', () => {
  assert.ok(
    bgInitBlock.includes("tw-fork-bgfade-restore-${forkId}"),
    "scoped tw-fork-bgfade-restore-\${forkId} not set in background initializer"
  );
});

test('4. bg initializer checks scoped tw-fork-bg-restore-${forkId} on remount (before global BG_STORAGE_KEY)', () => {
  // 020E: remount check now uses forkId-scoped key (not generic, which is inherited by new tabs).
  assert.ok(
    bgInitBlock.includes("tw-fork-bg-restore-${forkId}"),
    "scoped tw-fork-bg-restore-\${forkId} not found in bg initializer — remount read would use wrong tab's key"
  );
  // Also verify the getItem call uses the scoped key
  assert.ok(
    bgInitBlock.includes("getItem(`tw-fork-bg-restore-${forkId}`)"),
    "sessionStorage.getItem(scoped key) missing in bg initializer remount path"
  );
});

test('5. bg initializer returns null as safe default when no fork snapshot exists (not global BG_STORAGE_KEY)', () => {
  // The fork path must contain "return null" BEFORE the actual localStorage.getItem(BG_STORAGE_KEY)
  // call in the non-fork path.  Note: BG_STORAGE_KEY also appears in inline comments inside the
  // fork block (e.g. "// rather than falling through to the global BG_STORAGE_KEY") — we must
  // search for the *call* not the bare string.  020D added a tw-savedlist-bg check between
  // tw-fork-bg-restore and return null, so we look at the whole fork section.
  const forkIdIdx       = bgInitBlock.indexOf('tw-fork-id');
  const bgGetCallIdx    = bgInitBlock.indexOf('localStorage.getItem(BG_STORAGE_KEY)');
  const returnNullIdx   = bgInitBlock.indexOf('return null;', forkIdIdx);
  assert.ok(forkIdIdx > -1, 'tw-fork-id not found in bg initializer');
  assert.ok(returnNullIdx > -1, 'return null not found after tw-fork-id in bg initializer');
  // localStorage.getItem(BG_STORAGE_KEY) must not exist in the fork path (or must appear
  // after return null — i.e. in the non-fork path).
  assert.ok(
    bgGetCallIdx === -1 || returnNullIdx < bgGetCallIdx,
    'fork tab should return null before reaching the global localStorage.getItem(BG_STORAGE_KEY) fallback'
  );
});

// ── bgFade INITIALIZER ────────────────────────────────────────────────────────

test('6. bgFade initializer checks tw-fork-bgfade-restore before localStorage fallback', () => {
  const restoreIdx  = bgFadeInitBlock.indexOf('tw-fork-bgfade-restore');
  const localIdx    = bgFadeInitBlock.indexOf("localStorage.getItem('trailweigh:bgFade')");
  assert.ok(restoreIdx > -1, "tw-fork-bgfade-restore not found in bgFade initializer");
  assert.ok(localIdx   > -1, "localStorage.getItem('trailweigh:bgFade') not found in bgFade initializer");
  assert.ok(restoreIdx < localIdx, 'fork restore check must appear BEFORE localStorage fallback in bgFade initializer');
});

// ── bgTone INITIALIZER ────────────────────────────────────────────────────────

test('7. bgTone initializer checks tw-fork-bgtone-restore before localStorage fallback', () => {
  const restoreIdx = bgToneInitBlock.indexOf('tw-fork-bgtone-restore');
  const localIdx   = bgToneInitBlock.indexOf("localStorage.getItem('trailweigh:bgTone')");
  assert.ok(restoreIdx > -1, "tw-fork-bgtone-restore not found in bgTone initializer");
  assert.ok(localIdx   > -1, "localStorage.getItem('trailweigh:bgTone') not found in bgTone initializer");
  assert.ok(restoreIdx < localIdx, 'fork restore check must appear BEFORE localStorage fallback in bgTone initializer');
});

// ── handleLoadFromLocker IN-PLACE PATH ───────────────────────────────────────

test('8. handleLoadFromLocker in-place path checks isForkTab before writing storage', () => {
  assert.ok(
    inPlaceBlock.includes("sessionStorage.getItem('tw-fork-id')"),
    "fork-tab detection (sessionStorage.getItem('tw-fork-id')) not found in in-place path"
  );
});

test('9. handleLoadFromLocker in-place path writes scoped tw-fork-bg-restore-${forkId} for fork tabs', () => {
  // 020E: scoped key prevents opener's key from polluting the new tab.
  assert.ok(
    inPlaceBlock.includes("tw-fork-bg-restore-${forkId}"),
    "scoped tw-fork-bg-restore-\${forkId} write missing from in-place path — cross-tab bg leakage possible"
  );
});

test('10. handleLoadFromLocker in-place path writes scoped tw-fork-bgtone-restore-${forkId} for fork tabs', () => {
  assert.ok(
    inPlaceBlock.includes("tw-fork-bgtone-restore-${forkId}"),
    "scoped tw-fork-bgtone-restore-\${forkId} write missing from in-place path"
  );
});

test('11. handleLoadFromLocker in-place path writes scoped tw-fork-bgfade-restore-${forkId} for fork tabs', () => {
  assert.ok(
    inPlaceBlock.includes("tw-fork-bgfade-restore-${forkId}"),
    "scoped tw-fork-bgfade-restore-\${forkId} write missing from in-place path"
  );
});

test('12. handleLoadFromLocker in-place path still writes BG_STORAGE_KEY for non-fork tabs', () => {
  assert.ok(
    inPlaceBlock.includes('BG_STORAGE_KEY'),
    'BG_STORAGE_KEY completely removed from in-place path — non-fork tabs need it for page-refresh recovery'
  );
});

test('13. handleLoadFromLocker in-place path still writes trailweigh:bgTone for non-fork tabs', () => {
  assert.ok(
    inPlaceBlock.includes("'trailweigh:bgTone'"),
    "trailweigh:bgTone completely removed from in-place path — non-fork tabs need it for page-refresh recovery"
  );
});

test('14. handleLoadFromLocker in-place path still calls setBackground (020B preserved)', () => {
  assert.ok(inPlaceBlock.includes('setBackground(entry.background'), 'setBackground missing from in-place path');
});

test('15. handleLoadFromLocker in-place path still calls setBgTone (020B preserved)', () => {
  assert.ok(inPlaceBlock.includes('setBgTone('), 'setBgTone missing from in-place path');
});

test('16. handleLoadFromLocker in-place path still calls setBgFade (020B preserved)', () => {
  assert.ok(inPlaceBlock.includes('setBgFade('), 'setBgFade missing from in-place path');
});

test('17. handleLoadFromLocker in-place path still calls replaceStore (020B preserved)', () => {
  assert.ok(inPlaceBlock.includes('replaceStore('), 'replaceStore missing from in-place path');
});

test('18. handleLoadFromLocker in-place path still sets activeLockerFile (020B preserved)', () => {
  assert.ok(inPlaceBlock.includes('writeActiveLockerFileToSS('), 'writeActiveLockerFileToSS missing from in-place path');
});

// ── HANDLER UPDATES: explicit user choices keep sessionStorage restore keys current ───

test('19. handleBackgroundChange updates scoped tw-fork-bg-restore-${forkId} (manual bg change on fork tab)', () => {
  // 020E: handler must write scoped key, not generic.
  assert.ok(
    bgChangeBlock.includes("tw-fork-bg-restore-${forkId}"),
    "scoped tw-fork-bg-restore-\${forkId} not updated in handleBackgroundChange — manual bg changes won't survive remounts"
  );
});

test('20. handleBgFadeChange updates scoped tw-fork-bgfade-restore-${forkId}', () => {
  assert.ok(
    bgFadeChangeBlock.includes("tw-fork-bgfade-restore-${forkId}"),
    "scoped tw-fork-bgfade-restore-\${forkId} not updated in handleBgFadeChange"
  );
});

test('21. handleBgToneChange updates scoped tw-fork-bgtone-restore-${forkId}', () => {
  assert.ok(
    bgToneChangeBlock.includes("tw-fork-bgtone-restore-${forkId}"),
    "scoped tw-fork-bgtone-restore-\${forkId} not updated in handleBgToneChange"
  );
});

// ── 020A New STILL Opens Clear + Light ───────────────────────────────────────

test('22. handleNew still writes background:null to newseed bundle (020A Clear preserved)', () => {
  assert.ok(handleNewBody.includes('background: null'), 'background:null missing from handleNew newseed bundle');
});

test('23. handleNew still writes bgTone:"light" to newseed bundle (020A Light preserved)', () => {
  assert.ok(
    handleNewBody.includes("bgTone: 'light'") || handleNewBody.includes('bgTone: "light"'),
    'bgTone:"light" missing from handleNew newseed bundle'
  );
});

test('24. handleNew still writes bgFade:1 to newseed bundle', () => {
  assert.ok(handleNewBody.includes('bgFade: 1'), 'bgFade:1 missing from handleNew newseed bundle');
});

test('25. handleNew still opens a new tab (window.open)', () => {
  assert.ok(handleNewBody.includes("window.open("), 'window.open missing — handleNew no longer opens a new tab');
});

test('26. handleNew still writes __blank:true (020 zero-category preserved)', () => {
  assert.ok(handleNewBody.includes('__blank: true'), '__blank:true missing from handleNew');
});

// ── PRIOR WORK PRESERVED ─────────────────────────────────────────────────────

test('27. 019 WeightDistribution still present', () => {
  assert.ok(checklist.includes('WeightDistribution'), 'WeightDistribution missing — 019 panel separation broken');
});

test('28. 018C filename pill centering preserved (inset-0 pb-3 — 021O removed pt-8)', () => {
  // 021O moved pt-8 from child panels to the toolbar-group parent (as pt-4).
  assert.ok(
    checklist.includes('absolute inset-0 pb-3 flex items-center justify-center pointer-events-none'),
    '018C filename pill centering classes not found — 021O: pt-8 removed from overlay'
  );
});

test('29. LOCKER_KEY still exported from usePackData', () => {
  const packData = readFileSync(resolve(process.cwd(), 'artifacts/pack-checklist/src/hooks/usePackData.ts'), 'utf8');
  assert.ok(packData.includes('export const LOCKER_KEY'), 'LOCKER_KEY missing');
});

test('30. tw-fork-id is set by resolveStorageKey in usePackData', () => {
  const packData = readFileSync(resolve(process.cwd(), 'artifacts/pack-checklist/src/hooks/usePackData.ts'), 'utf8');
  assert.ok(packData.includes("sessionStorage.setItem('tw-fork-id'"), "tw-fork-id not set by resolveStorageKey");
});

console.log('\n────────────────────────────────────────────────────');
console.log('Tests: 30');
console.log('\n⚠️  Automated tests verify structural correctness only.');
console.log('Rendered acceptance (New always clears, no random background after');
console.log('repeated Locker-open → New → Locker-open cycles) requires the');
console.log("user's fresh-preview acceptance test.\n");
