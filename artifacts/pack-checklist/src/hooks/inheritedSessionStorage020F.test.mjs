/**
 * inheritedSessionStorage020F.test.mjs
 *
 * Root-cause fix: resolveStorageKey() was checking sessionStorage for tw-fork-id
 * BEFORE checking URL params. window.open() copies the opener's entire
 * sessionStorage to new tabs, so an inherited tw-fork-id was winning over
 * the ?newseed= or ?savedListId= URL param, giving the new tab the WRONG identity.
 *
 * Fix: URL params are checked FIRST in resolveStorageKey(). The sessionStorage
 * fallback only runs when URL params are absent (remounts / non-fork tabs).
 *
 * These tests verify the structural contract via static analysis of the source code.
 */

import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACK_DATA  = path.join(__dirname, 'usePackData.ts');
const CHECKLIST  = path.join(path.dirname(__dirname), 'pages', 'Checklist.tsx');

const packSrc      = readFileSync(PACK_DATA,  'utf-8');
const checklistSrc = readFileSync(CHECKLIST,  'utf-8');

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Slice the body of resolveStorageKey from the source.
 * TypeScript return-type annotations like `{ key: string; isFork: boolean }` trip
 * up naive brace counters, so we bound the slice using the next top-level
 * export/function declaration instead.
 */
function sliceResolveStorageKey(src) {
  const start = src.indexOf('function resolveStorageKey(');
  assert(start !== -1, 'resolveStorageKey not found in usePackData.ts');
  // The next top-level declaration after the function
  const end = src.indexOf('\nexport function usePackData(', start);
  assert(end !== -1, 'usePackData export not found after resolveStorageKey');
  return src.slice(start, end);
}

/**
 * Slice the background useState initializer body.
 * Uses the known surrounding context as bounds rather than brace-counting.
 */
function sliceBgInitializer(src) {
  const startMarker = "const [background, setBackground] = useState<Background | null>(() => {";
  const endMarker   = "\n  const [bgSize,";          // the next useState after background
  const start = src.indexOf(startMarker);
  assert(start !== -1, 'background useState not found in Checklist.tsx');
  const end = src.indexOf(endMarker, start);
  assert(end !== -1, 'bgSize useState not found after background useState');
  return src.slice(start, end);
}

const RSK_BODY  = sliceResolveStorageKey(packSrc);
const BG_INIT   = sliceBgInitializer(checklistSrc);

// ─── test runner ────────────────────────────────────────────────────────────

let pass = 0;
let fail = 0;
const failures = [];

function test(label, fn) {
  try {
    fn();
    console.log(`  ✓ ${label}`);
    pass++;
  } catch (err) {
    console.error(`  ✗ ${label}`);
    console.error(`    ${err.message}`);
    fail++;
    failures.push({ label, message: err.message });
  }
}

// ─── resolveStorageKey ordering ─────────────────────────────────────────────

console.log('\n=== 020F: resolveStorageKey — URL params must take priority over inherited sessionStorage ===\n');

test('resolveStorageKey parses URL params via URLSearchParams', () => {
  assert(RSK_BODY.includes('URLSearchParams'), 'must call new URLSearchParams(window.location.search)');
});

test('newseed URL param check precedes sessionStorage tw-fork-id check', () => {
  const seedIdx    = RSK_BODY.indexOf("params.get('newseed')");
  const storageIdx = RSK_BODY.indexOf("sessionStorage.getItem('tw-fork-id')");
  assert(seedIdx    !== -1, "newseed URL check must exist in resolveStorageKey");
  assert(storageIdx !== -1, "sessionStorage tw-fork-id fallback must exist in resolveStorageKey");
  assert(seedIdx < storageIdx,
    `newseed check (pos ${seedIdx}) must come BEFORE sessionStorage check (pos ${storageIdx})`);
});

test('savedListId URL param check precedes sessionStorage tw-fork-id check', () => {
  const slIdx      = RSK_BODY.indexOf("params.get('savedListId')");
  const storageIdx = RSK_BODY.indexOf("sessionStorage.getItem('tw-fork-id')");
  assert(slIdx      !== -1, "savedListId URL check must exist in resolveStorageKey");
  assert(storageIdx !== -1, "sessionStorage tw-fork-id fallback must exist in resolveStorageKey");
  assert(slIdx < storageIdx,
    `savedListId check (pos ${slIdx}) must come BEFORE sessionStorage check (pos ${storageIdx})`);
});

test('newseed URL check precedes savedListId URL check (order within URL params)', () => {
  const seedIdx = RSK_BODY.indexOf("params.get('newseed')");
  const slIdx   = RSK_BODY.indexOf("params.get('savedListId')");
  assert(seedIdx !== -1, "newseed check must exist");
  assert(slIdx   !== -1, "savedListId check must exist");
  assert(seedIdx < slIdx, 'newseed must precede savedListId');
});

test('newseed branch sets tw-fork-id = seedId (from URL)', () => {
  // Slice just the newseed branch (between newseed check and savedListId check)
  const seedStart = RSK_BODY.indexOf("params.get('newseed')");
  const slStart   = RSK_BODY.indexOf("params.get('savedListId')");
  const seedBranch = RSK_BODY.slice(seedStart, slStart);
  assert(
    seedBranch.includes("sessionStorage.setItem('tw-fork-id', seedId)"),
    'newseed branch must overwrite inherited tw-fork-id with the URL seedId'
  );
});

test('savedListId branch creates fresh UUID and sets tw-fork-id (not inherited)', () => {
  const slStart  = RSK_BODY.indexOf("params.get('savedListId')");
  const ssStart  = RSK_BODY.indexOf("sessionStorage.getItem('tw-fork-id')");
  const slBranch = RSK_BODY.slice(slStart, ssStart);
  assert(slBranch.includes('crypto.randomUUID()'), 'savedListId must create a fresh forkId');
  assert(
    slBranch.includes("sessionStorage.setItem('tw-fork-id',"),
    'savedListId must write fresh forkId to sessionStorage'
  );
});

test('newseed branch returns before reaching sessionStorage fallback (no path from newseed → sessionStorage)', () => {
  const seedStart  = RSK_BODY.indexOf("params.get('newseed')");
  const slStart    = RSK_BODY.indexOf("params.get('savedListId')");
  const seedBranch = RSK_BODY.slice(seedStart, slStart);
  assert(seedBranch.includes('return'), 'newseed branch must return; it must not fall through to sessionStorage');
});

test('savedListId branch returns before reaching sessionStorage fallback', () => {
  const slStart  = RSK_BODY.indexOf("params.get('savedListId')");
  const ssStart  = RSK_BODY.indexOf("sessionStorage.getItem('tw-fork-id')");
  const slBranch = RSK_BODY.slice(slStart, ssStart);
  assert(slBranch.includes('return'), 'savedListId branch must return; it must not fall through to sessionStorage');
});

test('sessionStorage fallback is present for remounts (URL params already consumed)', () => {
  assert(
    RSK_BODY.includes("sessionStorage.getItem('tw-fork-id')"),
    'sessionStorage fallback must exist for remounts when URL params are gone'
  );
});

test('non-fork primary tab uses V5_KEY with isFork:false', () => {
  assert(RSK_BODY.includes('V5_KEY(userId)'),  'must fall back to V5_KEY for non-fork tabs');
  assert(RSK_BODY.includes('isFork: false'), 'primary tab must return isFork:false');
});

test('newseed branch returns fork-scoped key and isFork:true', () => {
  const seedStart  = RSK_BODY.indexOf("params.get('newseed')");
  const slStart    = RSK_BODY.indexOf("params.get('savedListId')");
  const seedBranch = RSK_BODY.slice(seedStart, slStart);
  assert(seedBranch.includes('isFork: true'),            'newseed must set isFork:true');
  assert(seedBranch.includes('pack-checklist-v5-fork-'), 'newseed must return fork-scoped key');
});

test('savedListId branch returns fork-scoped key and isFork:true', () => {
  const slStart  = RSK_BODY.indexOf("params.get('savedListId')");
  const ssStart  = RSK_BODY.indexOf("sessionStorage.getItem('tw-fork-id')");
  const slBranch = RSK_BODY.slice(slStart, ssStart);
  assert(slBranch.includes('isFork: true'),            'savedListId must set isFork:true');
  assert(slBranch.includes('pack-checklist-v5-fork-'), 'savedListId must return fork-scoped key');
});

// Cross-tab inheritance scenario: newseed URL wins over inherited sessionStorage
test('[scenario] newseed tab with inherited opener tw-fork-id gets correct identity', () => {
  // window.open() → new tab inherits tw-fork-id=openerForkId in sessionStorage.
  // URL has ?newseed=newUUID. resolveStorageKey MUST process newseed first so
  // the new tab's forkId = newUUID (not openerForkId).
  const seedIdx    = RSK_BODY.indexOf("params.get('newseed')");
  const storageIdx = RSK_BODY.indexOf("sessionStorage.getItem('tw-fork-id')");
  assert(seedIdx < storageIdx,
    'newseed URL check must run before sessionStorage check — otherwise inherited opener forkId wins');
  const seedStart  = RSK_BODY.indexOf("params.get('newseed')");
  const slStart    = RSK_BODY.indexOf("params.get('savedListId')");
  const seedBranch = RSK_BODY.slice(seedStart, slStart);
  assert(
    seedBranch.includes("sessionStorage.setItem('tw-fork-id', seedId)"),
    'newseed branch must overwrite any inherited tw-fork-id with the correct URL-provided seedId'
  );
});

// Cross-tab inheritance scenario: savedListId URL wins over inherited sessionStorage
test('[scenario] savedListId tab with inherited opener tw-fork-id gets fresh identity', () => {
  const slIdx      = RSK_BODY.indexOf("params.get('savedListId')");
  const storageIdx = RSK_BODY.indexOf("sessionStorage.getItem('tw-fork-id')");
  assert(slIdx < storageIdx,
    'savedListId URL check must run before sessionStorage check — otherwise inherited opener forkId wins');
  const slStart  = RSK_BODY.indexOf("params.get('savedListId')");
  const ssStart  = RSK_BODY.indexOf("sessionStorage.getItem('tw-fork-id')");
  const slBranch = RSK_BODY.slice(slStart, ssStart);
  assert(slBranch.includes('crypto.randomUUID()'),
    'savedListId must generate a fresh forkId rather than reuse the inherited opener forkId');
});

// ─── Background initializer ─────────────────────────────────────────────────

console.log('\n=== 020F: Background initializer — reads forkId correctly set by resolveStorageKey ===\n');

test('background initializer reads tw-fork-id from sessionStorage', () => {
  assert(
    BG_INIT.includes("sessionStorage.getItem('tw-fork-id')"),
    'must read forkId from sessionStorage (resolveStorageKey has already set it correctly)'
  );
});

test('newseed-bg key is scoped to forkId (not generic)', () => {
  assert(
    BG_INIT.includes('`tw-newseed-bg-${forkId}`'),
    'must look up tw-newseed-bg-{forkId} using the forkId resolveStorageKey wrote'
  );
});

test('scoped restore key is stashed on newseed first-load', () => {
  assert(
    BG_INIT.includes("sessionStorage.setItem(`tw-fork-bg-restore-${forkId}`"),
    'must stash tw-fork-bg-restore-{forkId} for remount protection'
  );
});

test('remount path reads scoped restore key, not a generic key', () => {
  assert(
    !BG_INIT.includes("sessionStorage.getItem('tw-fork-bg-restore')"),
    'must NOT read generic tw-fork-bg-restore — cross-tab leakage'
  );
  assert(
    BG_INIT.includes("sessionStorage.getItem(`tw-fork-bg-restore-${forkId}`)"),
    'remount must read tw-fork-bg-restore-{forkId}'
  );
});

test('savedListId path reads tw-savedlist-bg and stashes to scoped key', () => {
  assert(BG_INIT.includes("sessionStorage.getItem('tw-savedlist-bg')"), 'must read tw-savedlist-bg');
  const slStart = BG_INIT.indexOf("sessionStorage.getItem('tw-savedlist-bg')");
  const slSlice = BG_INIT.slice(slStart, slStart + 600);
  assert(slSlice.includes('`tw-fork-bg-restore-${forkId}`'),
    'savedListId path must stash to scoped restore key for remount protection'
  );
});

test('background initializer returns null (Clear) as final default', () => {
  assert(BG_INIT.includes('return null'), 'must return null as the final fallback (clear/no background)');
});

// ─── Save toast messages ─────────────────────────────────────────────────────

console.log('\n=== 020F: Save toast messages — no quotation marks around filename ===\n');

test('no Saved toast wraps name in double quotes', () => {
  assert(!checklistSrc.includes('`Saved "${name}"`'), 'must not use `Saved "${name}"` (quotes removed)');
});

test('Saved toast uses backtick template with name directly (no extra quotes)', () => {
  assert(checklistSrc.includes('`Saved ${name}`'), 'toast must be `Saved ${name}`');
});

test('both save paths (commitSaveNew and commitSaveReplace) use quote-free toast', () => {
  const countCorrect = (checklistSrc.match(/`Saved \$\{name\}`/g) || []).length;
  const countWrong   = (checklistSrc.match(/`Saved "\$\{name\}"`/g) || []).length;
  assert(countWrong   === 0, `Found ${countWrong} save toasts still wrapping name in quotes`);
  assert(countCorrect >= 2,  `Expected ≥ 2 quote-free save toasts, found ${countCorrect}`);
});

// ─── 020E cross-tab isolation invariants still intact ────────────────────────

console.log('\n=== 020F: 020E cross-tab isolation invariants still intact ===\n');

test('bgTone restore key is scoped to forkId (020E invariant)', () => {
  assert(checklistSrc.includes('tw-fork-bgtone-restore-${forkId}'),
    'bgTone restore key must remain scoped to forkId (020E invariant)'
  );
});

test('bgFade restore key is scoped to forkId (020E invariant)', () => {
  assert(checklistSrc.includes('tw-fork-bgfade-restore-${forkId}'),
    'bgFade restore key must remain scoped to forkId (020E invariant)'
  );
});

test('no generic unsuffixed tw-fork-bg-restore read in Checklist', () => {
  const pattern = /sessionStorage\.getItem\(['"`]tw-fork-bg-restore['"`]\)/;
  assert(!pattern.test(checklistSrc), 'generic (unsuffixed) restore key read would cause cross-tab leakage');
});

test('no generic unsuffixed tw-fork-bgtone-restore read in Checklist', () => {
  const pattern = /sessionStorage\.getItem\(['"`]tw-fork-bgtone-restore['"`]\)/;
  assert(!pattern.test(checklistSrc), 'generic bgTone restore read would cause cross-tab leakage');
});

test('no generic unsuffixed tw-fork-bgfade-restore read in Checklist', () => {
  const pattern = /sessionStorage\.getItem\(['"`]tw-fork-bgfade-restore['"`]\)/;
  assert(!pattern.test(checklistSrc), 'generic bgFade restore read would cause cross-tab leakage');
});

// ─── Summary ────────────────────────────────────────────────────────────────

console.log('\n' + '─'.repeat(60));
console.log(`020F tests: ${pass} passed, ${fail} failed`);
if (failures.length) {
  console.log('\nFailed tests:');
  failures.forEach(f => console.log(`  ✗ ${f.label}: ${f.message}`));
  process.exit(1);
}
console.log(`All ${pass} 020F tests passed.\n`);
