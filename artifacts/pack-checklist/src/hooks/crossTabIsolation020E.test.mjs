/**
 * 020E — Cross-Tab Background Isolation Tests
 *
 * Proves that scoped sessionStorage restore keys prevent cross-tab background
 * leakage.  window.open() inherits the opener's sessionStorage to the new tab;
 * forkId-scoped keys (e.g. tw-fork-bg-restore-${forkId}) are ignored by any
 * tab whose resolveStorageKey assigned it a different forkId.
 *
 * These are STRUCTURAL tests (static source analysis).  They verify the code
 * architecture is correct, but do NOT prove real browser cross-tab behaviour —
 * that requires the user's manual acceptance test.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import assert from 'assert';

const __dirname = dirname(fileURLToPath(import.meta.url));
// __dirname = .../artifacts/pack-checklist/src/hooks → '../..' → .../artifacts/pack-checklist/
const root = resolve(__dirname, '../..');

const checklist  = readFileSync(resolve(root, 'src/pages/Checklist.tsx'), 'utf8');
const usePackData = readFileSync(resolve(root, 'src/hooks/usePackData.ts'), 'utf8');

let passed = 0, failed = 0;
function test(n, desc, cond, msg) {
  if (cond) {
    console.log(`  ✓ ${n}. ${desc}`);
    passed++;
  } else {
    console.error(`  ✗ ${n}. ${desc}\n       ↳ ${msg}`);
    failed++;
  }
}

console.log('\n020E — Cross-Tab Background Isolation\n');

// ── 1. No generic (unscoped) restore keys exist ───────────────────────────────
// If any of these appear as plain quoted strings, the fix is incomplete.

const genericBgSet   = checklist.includes("setItem('tw-fork-bg-restore'")    || checklist.includes('setItem("tw-fork-bg-restore"');
const genericFadeSet = checklist.includes("setItem('tw-fork-bgfade-restore'") || checklist.includes('setItem("tw-fork-bgfade-restore"');
const genericToneSet = checklist.includes("setItem('tw-fork-bgtone-restore'") || checklist.includes('setItem("tw-fork-bgtone-restore"');
const genericBgGet   = checklist.includes("getItem('tw-fork-bg-restore')")    || checklist.includes('getItem("tw-fork-bg-restore")');
const genericFadeGet = checklist.includes("getItem('tw-fork-bgfade-restore')") || checklist.includes('getItem("tw-fork-bgfade-restore")');
const genericToneGet = checklist.includes("getItem('tw-fork-bgtone-restore')") || checklist.includes('getItem("tw-fork-bgtone-restore")');

test(1, "No unscoped setItem('tw-fork-bg-restore') in source — all writes are forkId-scoped", !genericBgSet,
  "UNSCOPED tw-fork-bg-restore setItem found — new tabs inherit this key from opener; cross-tab bg leakage UNFIXED");

test(2, "No unscoped setItem('tw-fork-bgfade-restore') in source", !genericFadeSet,
  "UNSCOPED tw-fork-bgfade-restore setItem found — cross-tab fade leakage possible");

test(3, "No unscoped setItem('tw-fork-bgtone-restore') in source", !genericToneSet,
  "UNSCOPED tw-fork-bgtone-restore setItem found — cross-tab tone leakage possible");

test(4, "No unscoped getItem('tw-fork-bg-restore') in source — all reads are forkId-scoped", !genericBgGet,
  "UNSCOPED tw-fork-bg-restore getItem found — tab reads opener's inherited key; cross-tab bg leakage UNFIXED");

test(5, "No unscoped getItem('tw-fork-bgfade-restore') in source", !genericFadeGet,
  "UNSCOPED tw-fork-bgfade-restore getItem found — cross-tab fade read possible");

test(6, "No unscoped getItem('tw-fork-bgtone-restore') in source", !genericToneGet,
  "UNSCOPED tw-fork-bgtone-restore getItem found — cross-tab tone read possible");

// ── 2. Scoped keys ARE present ────────────────────────────────────────────────

test(7, "Scoped tw-fork-bg-restore-\${forkId} present in source",
  checklist.includes("tw-fork-bg-restore-${forkId}"),
  "scoped key pattern missing — restoration uses no key at all");

test(8, "Scoped tw-fork-bgfade-restore-\${forkId} present in source",
  checklist.includes("tw-fork-bgfade-restore-${forkId}"),
  "scoped bgfade key pattern missing");

test(9, "Scoped tw-fork-bgtone-restore-\${forkId} present in source",
  checklist.includes("tw-fork-bgtone-restore-${forkId}"),
  "scoped bgtone key pattern missing");

// ── 3. newseed tabs: forkId is read BEFORE the scoped key is written ──────────
// The background initializer must read forkId from sessionStorage first, then
// construct the scoped key — guarantee that forkId is in scope at stash-time.

const bgInitStart = checklist.indexOf('const [background, setBackground] = useState<Background | null>(() => {');
const bgInitEnd   = checklist.indexOf('\n  });', bgInitStart) + 6;
const bgInit      = checklist.slice(bgInitStart, bgInitEnd);

const forkIdReadIdx  = bgInit.indexOf("sessionStorage.getItem('tw-fork-id')");
const scopedWriteIdx = bgInit.indexOf("tw-fork-bg-restore-${forkId}");

test(10, "Background initializer reads tw-fork-id before writing scoped restore key",
  forkIdReadIdx > -1 && scopedWriteIdx > -1 && forkIdReadIdx < scopedWriteIdx,
  "tw-fork-id not read before scoped key write — forkId variable unavailable at stash-time");

// ── 4. handleLoadFromLocker in-place: reads forkId, uses scoped key ───────────

const lockerStart = checklist.indexOf('// Persist appearance for React-remount resilience.');
const lockerBlock = checklist.slice(lockerStart, lockerStart + 2500);

test(11, "handleLoadFromLocker in-place path reads tw-fork-id into forkId variable",
  lockerBlock.includes("sessionStorage.getItem('tw-fork-id')"),
  "tw-fork-id not read in handleLoadFromLocker in-place path");

test(12, "handleLoadFromLocker in-place path uses scoped tw-fork-bg-restore-\${forkId}",
  lockerBlock.includes("tw-fork-bg-restore-${forkId}"),
  "in-place path writes unscoped key — loading file A from file B's tab leaks bg to next tab opened");

test(13, "handleLoadFromLocker in-place path uses scoped tw-fork-bgtone-restore-\${forkId}",
  lockerBlock.includes("tw-fork-bgtone-restore-${forkId}"),
  "in-place path writes unscoped tone key");

test(14, "handleLoadFromLocker in-place path uses scoped tw-fork-bgfade-restore-\${forkId}",
  lockerBlock.includes("tw-fork-bgfade-restore-${forkId}"),
  "in-place path writes unscoped fade key");

// ── 5. handlers: all three update the scoped key (reads forkId at call time) ──

const bgChangeStart    = checklist.indexOf('const handleBackgroundChange = ');
const bgChangeBody     = checklist.slice(bgChangeStart, bgChangeStart + 900);
const bgFadeChangeStart = checklist.indexOf('const handleBgFadeChange = ');
const bgFadeChangeBody  = checklist.slice(bgFadeChangeStart, bgFadeChangeStart + 400);
const bgToneChangeStart = checklist.indexOf('const handleBgToneChange = ');
const bgToneChangeBody  = checklist.slice(bgToneChangeStart, bgToneChangeStart + 400);

test(15, "handleBackgroundChange reads tw-fork-id and writes scoped restore key",
  bgChangeBody.includes("sessionStorage.getItem('tw-fork-id')") &&
  bgChangeBody.includes("tw-fork-bg-restore-${forkId}"),
  "handleBackgroundChange does not write scoped key — manual bg change after Locker-open leaks on remount");

test(16, "handleBgFadeChange reads tw-fork-id and writes scoped restore key",
  bgFadeChangeBody.includes("sessionStorage.getItem('tw-fork-id')") &&
  bgFadeChangeBody.includes("tw-fork-bgfade-restore-${forkId}"),
  "handleBgFadeChange does not write scoped key");

test(17, "handleBgToneChange reads tw-fork-id and writes scoped restore key",
  bgToneChangeBody.includes("sessionStorage.getItem('tw-fork-id')") &&
  bgToneChangeBody.includes("tw-fork-bgtone-restore-${forkId}"),
  "handleBgToneChange does not write scoped key");

// ── 6. newseed path: return null is the clear-background sentinel ─────────────

test(18, "Background initializer returns null (Clear) as final fallback inside if(forkId) block",
  bgInit.includes('return null;'),
  "return null missing — newseed/New remounts may inherit random background");

// ── 7. savedListId: tw-savedlist-bg is still consumed before scoped stash ─────

const savedBgIdx  = bgInit.indexOf("'tw-savedlist-bg'");

test(19, "Background initializer still reads tw-savedlist-bg (savedListId first render path preserved)",
  savedBgIdx > -1,
  "tw-savedlist-bg check missing — savedListId tabs get no background on first render");

// Find the scoped stash AFTER savedBgIdx — the newseed stash appears earlier so indexOf from 0 is wrong.
const scopedBgAfterSaved = bgInit.indexOf("tw-fork-bg-restore-${forkId}", savedBgIdx);
test(20, "scoped stash appears after tw-savedlist-bg consumption — correct order in savedList block",
  savedBgIdx > -1 && scopedBgAfterSaved > savedBgIdx,
  "scoped tw-fork-bg-restore stash not found after tw-savedlist-bg read — savedListId bg lost on remount");

// ── 8. no saved-file data is erased by the fix ───────────────────────────────
// The fix only changes which sessionStorage key names are used.
// It must NOT add any IndexedDB clears, localStorage.clear, or locker-data resets.

test(21, "Fix adds no localStorage.clear() call",
  !checklist.includes('localStorage.clear()'),
  "localStorage.clear() found in Checklist.tsx — user data at risk");

test(22, "Fix adds no sessionStorage.clear() call",
  !checklist.includes('sessionStorage.clear()'),
  "sessionStorage.clear() found in Checklist.tsx — all tabs would lose their appearance on every load");

// ── 9. Architecture: resolveStorageKey uniquely identifies each tab ───────────

test(23, "resolveStorageKey creates a unique forkId for ?newseed= tabs (uuid)",
  usePackData.includes("crypto.randomUUID()") || usePackData.includes("seedId"),
  "unique forkId generation missing — two tabs could share the same forkId and still collide");

test(24, "resolveStorageKey creates a unique forkId for ?savedListId= tabs",
  usePackData.includes("tw-fork-id"),
  "tw-fork-id not set in usePackData — savedListId tabs have no forkId for scoped keys");

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(60));
console.log(`Tests: ${passed + failed}  |  Passed: ${passed}  |  Failed: ${failed}`);
if (failed > 0) {
  console.log(`\n${failed} test(s) FAILED`);
  process.exit(1);
}
console.log('\n⚠️  Automated tests verify structural (source-code) correctness only.');
console.log('Cross-tab leakage requires the user\'s manual browser acceptance test:');
console.log('  Ray → Sierra → Ray → New → Sierra → New → Packlist1 → Ray (cycle × N).');
console.log('At every step: correct filename, correct bg, correct tone, no second open.');
