/**
 * Prompt 020D — Separate New Appearance From Saved-File Appearance
 *
 * Root cause: resolveStorageKey() sets tw-fork-id for BOTH ?newseed= (New)
 * and ?savedListId= tabs.  020C's remount guard returns null inside the
 * if (forkId) block BEFORE the existing tw-savedlist-bg check at line ~186,
 * making that check dead code for all fork tabs.  bgFade/bgTone consumed
 * tw-savedlist-bgfade/bgtone on first render but never stashed the values
 * to their fork-local restore keys, so remounts fell through to global
 * localStorage.
 *
 * Fix:
 *   1. Background initializer: inside the if (forkId) block, check
 *      tw-savedlist-bg before returning null; stash to tw-fork-bg-restore.
 *   2. bgFade initializer: after consuming tw-savedlist-bgfade, also stash
 *      to tw-fork-bgfade-restore.
 *   3. bgTone initializer: after consuming tw-savedlist-bgtone, also stash
 *      to tw-fork-bgtone-restore.
 */

import { strict as assert } from 'assert';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

const checklist = readFileSync(
  path.join(root, 'src/pages/Checklist.tsx'),
  'utf8',
);

const usePackData = readFileSync(
  path.join(root, '../pack-checklist/src/hooks/usePackData.ts'),
  'utf8',
);

// ── Extract the background initializer ───────────────────────────────────────
const bgInitStart = checklist.indexOf("const [background, setBackground] = useState<Background | null>(() => {");
assert.ok(bgInitStart > -1, 'background useState not found');
const bgInit = checklist.slice(bgInitStart, bgInitStart + 5000);

// ── Extract bgFade initializer ────────────────────────────────────────────────
const bgFadeStart = checklist.indexOf("const [bgFade, setBgFade] = useState<number>(() => {");
assert.ok(bgFadeStart > -1, 'bgFade useState not found');
const bgFadeInit = checklist.slice(bgFadeStart, bgFadeStart + 1500);

// ── Extract bgTone initializer ────────────────────────────────────────────────
const bgToneStart = checklist.indexOf("const [bgTone, setBgTone] = useState<'light' | 'dark'>(() => {");
assert.ok(bgToneStart > -1, 'bgTone useState not found');
const bgToneInit = checklist.slice(bgToneStart, bgToneStart + 1500);

// ── Helper: assert with message ───────────────────────────────────────────────
let passed = 0;
let failed = 0;
function test(n, label, cond, msg = '') {
  if (cond) {
    console.log(`  ✓ ${n}. ${label}`);
    passed++;
  } else {
    console.log(`  ✗ ${n}. ${label}`);
    if (msg) console.log(`    ${msg}`);
    failed++;
  }
}

console.log('\nPrompt 020D — Separate New Appearance From Saved-File Appearance\n');

// ── Background initializer — savedListId path ─────────────────────────────────

// 1. Inside the if (forkId) block, tw-savedlist-bg is checked (before return null)
// Verify that 'tw-savedlist-bg' appears BEFORE the final 'return null' inside if(forkId)
const ifForkEnd = bgInit.indexOf('return null;');
const savedBgIdx = bgInit.indexOf("'tw-savedlist-bg'");
test(1, "bg initializer checks tw-savedlist-bg inside if(forkId) block (before return null)",
  savedBgIdx > -1 && savedBgIdx < ifForkEnd,
  "tw-savedlist-bg check not found before return null — savedListId bg will be lost"
);

// 2. After consuming tw-savedlist-bg, stash to scoped tw-fork-bg-restore-${forkId} (scoped in 020E)
// The savedBg block must also set the scoped tw-fork-bg-restore-${forkId} key
const savedBgBlock = bgInit.slice(savedBgIdx, bgInit.indexOf('return null;'));
test(2, "bg initializer stashes scoped tw-fork-bg-restore-${forkId} after consuming tw-savedlist-bg",
  savedBgBlock.includes("tw-fork-bg-restore-${forkId}"),
  "scoped tw-fork-bg-restore stash missing — savedListId tab bg will be lost on Clerk remount or inherited by wrong tab"
);

// 3. tw-savedlist-bg is removed when found (removeItem)
test(3, "bg initializer removes tw-savedlist-bg after consuming it",
  savedBgBlock.includes("removeItem('tw-savedlist-bg')"),
  "tw-savedlist-bg not removed — will be re-read on remount with stale value"
);

// 4. The scoped remount path is still present (020C preserved, scoped in 020E)
test(4, "bg initializer still checks scoped tw-fork-bg-restore-${forkId} on remount (020C+E preserved)",
  bgInit.includes("tw-fork-bg-restore-${forkId}") &&
  bgInit.indexOf("tw-fork-bg-restore-${forkId}") < savedBgIdx,
  "scoped tw-fork-bg-restore remount check missing or wrong order"
);

// 5. newseed path still stashes scoped tw-fork-bg-restore-${forkId} (020C preserved, scoped in 020E)
const newseedBlock = bgInit.slice(0, bgInit.indexOf('// ── Remount path'));
test(5, "bg initializer still stashes scoped tw-fork-bg-restore-${forkId} from newseed bundle (020C+E preserved)",
  newseedBlock.includes("tw-fork-bg-restore-${forkId}"),
  "newseed stash of scoped tw-fork-bg-restore missing — 020C regression"
);

// 6. newseed path still returns null when no newseed-bg key exists (020C Clear preserved)
// This is confirmed by the 'return null' being the last fallback inside if(forkId)
test(6, "bg initializer still returns null as final fallback in if(forkId) (Clear for newseed remounts)",
  bgInit.includes('return null;'),
  "return null missing from if(forkId) block — newseed remount may inherit random bg"
);

// ── bgFade initializer — savedListId path ────────────────────────────────────

// 7. tw-savedlist-bgfade is consumed (already existed; check still present)
test(7, "bgFade initializer still checks tw-savedlist-bgfade (first render path preserved)",
  bgFadeInit.includes("'tw-savedlist-bgfade'"),
  "tw-savedlist-bgfade check missing — savedListId fade will not restore"
);

// 8. After consuming tw-savedlist-bgfade, stash to scoped tw-fork-bgfade-restore-${forkId} (020D new, scoped in 020E)
const savedFadeBlock = bgFadeInit.slice(
  bgFadeInit.indexOf("'tw-savedlist-bgfade'"),
  bgFadeInit.indexOf("// ── Remount path for fork tabs")
);
test(8, "bgFade initializer stashes scoped tw-fork-bgfade-restore-${forkId} after consuming tw-savedlist-bgfade",
  savedFadeBlock.includes("tw-fork-bgfade-restore-${forkId}"),
  "scoped tw-fork-bgfade-restore stash missing — savedListId fade lost on Clerk remount or inherited by wrong tab"
);

// 9. scoped tw-fork-bgfade-restore remount path still present (020C preserved, scoped in 020E)
test(9, "bgFade initializer still checks scoped tw-fork-bgfade-restore-${forkId} on remount (020C+E preserved)",
  bgFadeInit.includes("tw-fork-bgfade-restore-${forkId}"),
  "scoped tw-fork-bgfade-restore remount check missing"
);

// ── bgTone initializer — savedListId path ────────────────────────────────────

// 10. tw-savedlist-bgtone is consumed (already existed; check still present)
test(10, "bgTone initializer still checks tw-savedlist-bgtone (first render path preserved)",
  bgToneInit.includes("'tw-savedlist-bgtone'"),
  "tw-savedlist-bgtone check missing — savedListId tone will not restore"
);

// 11. After consuming tw-savedlist-bgtone, stash to scoped tw-fork-bgtone-restore-${forkId} (020D new, scoped in 020E)
const savedToneBlock = bgToneInit.slice(
  bgToneInit.indexOf("'tw-savedlist-bgtone'"),
  bgToneInit.indexOf("// ── Remount path for fork tabs")
);
test(11, "bgTone initializer stashes scoped tw-fork-bgtone-restore-${forkId} after consuming tw-savedlist-bgtone",
  savedToneBlock.includes("tw-fork-bgtone-restore-${forkId}"),
  "scoped tw-fork-bgtone-restore stash missing — savedListId tone lost on Clerk remount or inherited by wrong tab"
);

// 12. scoped tw-fork-bgtone-restore remount path still present (020C preserved, scoped in 020E)
test(12, "bgTone initializer still checks scoped tw-fork-bgtone-restore-${forkId} on remount (020C+E preserved)",
  bgToneInit.includes("tw-fork-bgtone-restore-${forkId}"),
  "scoped tw-fork-bgtone-restore remount check missing"
);

// ── usePackData — savedListId stash confirmed ────────────────────────────────

// 13. usePackData writes tw-savedlist-bg for ?savedListId= tabs
test(13, "usePackData store initializer writes tw-savedlist-bg for ?savedListId= tabs",
  usePackData.includes("'tw-savedlist-bg'"),
  "tw-savedlist-bg not written by usePackData — stash unavailable for background initializer"
);

// 14. usePackData writes tw-savedlist-bgfade
test(14, "usePackData store initializer writes tw-savedlist-bgfade",
  usePackData.includes("'tw-savedlist-bgfade'"),
  "tw-savedlist-bgfade not written"
);

// 15. usePackData writes tw-savedlist-bgtone
test(15, "usePackData store initializer writes tw-savedlist-bgtone",
  usePackData.includes("'tw-savedlist-bgtone'"),
  "tw-savedlist-bgtone not written"
);

// 16. resolveStorageKey sets tw-fork-id for ?newseed= tabs (020C preserved)
test(16, "resolveStorageKey sets tw-fork-id for ?newseed= tabs (020C preserved)",
  usePackData.includes("sessionStorage.setItem('tw-fork-id', seedId)"),
  "newseed fork-id stash missing"
);

// 17. resolveStorageKey sets tw-fork-id for ?savedListId= tabs (architecture confirmed)
test(17, "resolveStorageKey sets tw-fork-id for ?savedListId= tabs (fork isolation preserved)",
  usePackData.includes("sessionStorage.setItem('tw-fork-id', newForkId)"),
  "savedListId fork-id stash missing"
);

// ── 020C regressions: newseed/New still deterministic ───────────────────────

// 18. handleNew still writes background:null (020A)
const handleNewStart = checklist.indexOf('const handleNew = ');
const handleNewBody = checklist.slice(handleNewStart, handleNewStart + 2000);
test(18, "handleNew still writes background:null to newseed bundle (020A + 020C preserved)",
  handleNewBody.includes('background: null'),
  "handleNew background:null missing"
);

// 19. handleNew still writes bgTone:'light' (020A)
test(19, "handleNew still writes bgTone:'light' (020A + 020C preserved)",
  handleNewBody.includes("bgTone: 'light'"),
  "handleNew bgTone:'light' missing"
);

// 20. handleNew still opens a new tab
test(20, "handleNew still opens new tab via window.open (020C preserved)",
  handleNewBody.includes("window.open("),
  "window.open missing from handleNew"
);

// ── 020B regressions: in-place Locker open preserved ─────────────────────────

// 21. handleLoadFromLocker in-place path still calls setBackground
const lockerStart = checklist.indexOf('const handleLoadFromLocker = (entry: LockerEntry)');
const lockerFnBody = checklist.slice(lockerStart, lockerStart + 8000);
const inPlaceStart = lockerFnBody.indexOf('if (totalItems === 0)');
const nonEmptyMarker = lockerFnBody.indexOf('// ── Non-empty path', inPlaceStart);
const inPlaceBlock = nonEmptyMarker > -1
  ? lockerFnBody.slice(inPlaceStart, nonEmptyMarker)
  : lockerFnBody.slice(inPlaceStart, inPlaceStart + 4000);

test(21, "handleLoadFromLocker in-place path still calls setBackground (020B preserved)",
  inPlaceBlock.includes('setBackground('),
  "setBackground missing from in-place path"
);

// 22. handleLoadFromLocker in-place path still calls setBgTone
test(22, "handleLoadFromLocker in-place path still calls setBgTone (020B preserved)",
  inPlaceBlock.includes('setBgTone('),
  "setBgTone missing from in-place path"
);

// 23. handleLoadFromLocker in-place path still calls setBgFade
test(23, "handleLoadFromLocker in-place path still calls setBgFade (020B preserved)",
  inPlaceBlock.includes('setBgFade('),
  "setBgFade missing from in-place path"
);

// 24. handleLoadFromLocker in-place path still calls replaceStore
test(24, "handleLoadFromLocker in-place path still calls replaceStore (020B preserved)",
  inPlaceBlock.includes('replaceStore('),
  "replaceStore missing from in-place path"
);

// ── Other regression guards ──────────────────────────────────────────────────

// 25. 019 WeightDistribution
test(25, "019 WeightDistribution still present",
  checklist.includes('WeightDistribution'),
  "WeightDistribution removed — 019 regression"
);

// 26. 018C filename pill — 021O removed pt-8 from overlay (moved to toolbar-group parent as pt-4)
test(26, "018C filename pill centering preserved (inset-0 pb-3 — 021O moved pt-8 to parent)",
  // 022W: pill wrapper now uses lg:absolute for desktop centering (in-flow on mobile)
  checklist.includes('lg:absolute lg:inset-0') && checklist.includes('pointer-events-none'),
  "filename pill centering broken — 021O: pt-8 removed from overlay, now on toolbar group parent"
);

// 27. LOCKER_KEY exported
test(27, "LOCKER_KEY still exported from usePackData",
  usePackData.includes('export') && usePackData.includes('LOCKER_KEY'),
  "LOCKER_KEY not exported"
);

// 28. tw-fork-id set by resolveStorageKey (020C foundation)
test(28, "tw-fork-id set by resolveStorageKey (020C foundation preserved)",
  usePackData.includes("sessionStorage.setItem('tw-fork-id'"),
  "tw-fork-id not set — 020C foundation broken"
);

// 29. parseV5 __blank branch preserved
test(29, "parseV5 __blank branch preserved (020 fix intact)",
  usePackData.includes('__blank'),
  "__blank branch missing from parseV5"
);

// 30. handleBackgroundChange updates scoped tw-fork-bg-restore-${forkId} (020C preserved, scoped in 020E)
const bgChangeStart = checklist.indexOf('const handleBackgroundChange = ');
const bgChangeBody = checklist.slice(bgChangeStart, bgChangeStart + 900);
test(30, "handleBackgroundChange updates scoped tw-fork-bg-restore-${forkId} on explicit change (020C+E preserved)",
  bgChangeBody.includes("tw-fork-bg-restore-${forkId}"),
  "scoped tw-fork-bg-restore update missing from handleBackgroundChange"
);

// ── Summary ──────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(52));
console.log(`Tests: ${passed + failed}`);
if (failed > 0) {
  console.log(`\n${failed} test(s) FAILED`);
  process.exit(1);
}
console.log('\n⚠️  Automated tests verify structural correctness only.');
console.log('Rendered acceptance (Sierra → New → Sierra → New → File B → New → Sierra');
console.log('sequence: every New = Clear/Light, every file open = its own appearance)');
console.log('requires the user\'s fresh-preview acceptance test.');
