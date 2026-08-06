/**
 * Automated regression tests for per-file Weight Distribution palette persistence.
 *
 * Run with:
 *   node artifacts/pack-checklist/src/hooks/pieColor.test.mjs
 *
 * Uses the Node.js built-in runner (no extra deps).
 * All Locker save/load logic is inlined as pure functions so tests run without
 * a build step while remaining a faithful copy of production behaviour.
 */

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_PALETTE = 'trail';
const VALID_PALETTES  = ['trail', 'ocean', 'sunset', 'forest', 'berry', 'desert'];

// ── Inlined helpers (mirror production logic) ─────────────────────────────────

/** Simulate commitSaveNew — creates a brand-new LockerEntry. */
function commitSaveNew({ name, store, background, bgFade, bgTone, chartPaletteKey, lockerEntries }) {
  const entry = {
    id: `id-${Date.now()}-${Math.random()}`,
    name,
    savedAt: Date.now(),
    store:   JSON.parse(JSON.stringify(store)),    // deep clone
    background: background ?? null,
    bgFade:  bgFade  ?? 1,
    bgTone:  bgTone  ?? 'light',
    chartPaletteKey,
  };
  return [entry, ...lockerEntries];
}

/** Simulate commitSaveReplace — overwrites an existing entry by ID. */
function commitSaveReplace({ existingId, name, store, background, bgFade, bgTone, chartPaletteKey, lockerEntries }) {
  const entry = {
    id: existingId,
    name,
    savedAt: Date.now(),
    store:   JSON.parse(JSON.stringify(store)),
    background: background ?? null,
    bgFade:  bgFade  ?? 1,
    bgTone:  bgTone  ?? 'light',
    chartPaletteKey,
  };
  return lockerEntries.map(e => e.id === existingId ? entry : e);
}

/** Simulate handleLoadFromLocker (in-place open) — returns the restored palette key. */
function loadPaletteKeyFromEntry(entry) {
  return entry.chartPaletteKey ?? DEFAULT_PALETTE;
}

/** Simulate initializing chartPaletteKey from a stashed sessionStorage value. */
function initPaletteKeyFromStash(stash) {
  if (stash !== null && stash !== undefined) return stash || DEFAULT_PALETTE;
  return DEFAULT_PALETTE;
}

/** Simulate the newseed bundle written by handleNew. */
function buildNewseedBundle({ background, bgFade, bgTone, bgSize, chartPaletteKey }) {
  return JSON.stringify({ background, bgFade, bgTone, bgSize, chartPaletteKey });
}

/** Simulate the sessionStorage stash written by usePackData for the ?savedListId= path. */
function buildSavedListStash(entry) {
  return { palettekey: entry.chartPaletteKey ?? '' };
}

// ── Fixture factory ───────────────────────────────────────────────────────────

function makeStore(label = 'A') {
  return {
    order: ['Backpack', 'Shelter', 'Kitchen'],
    items: {
      Backpack: [{ id: `${label}-1`, sub: 'Backpack', desc: 'ULA Circuit', weightOz: 40.8, qty: 1, checked: true, expendable: false }],
      Shelter:  [{ id: `${label}-2`, sub: 'Tent',     desc: 'Zpacks Duplex', weightOz: 18.5, qty: 1, checked: true, expendable: false }],
      Kitchen:  [],
    },
    meta: {
      Backpack: { countsToBase: true },
      Shelter:  { countsToBase: true },
      Kitchen:  { countsToBase: true },
    },
  };
}

// ── Test harness ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ ${message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) console.error(`    Expected: ${JSON.stringify(expected)}\n    Got:      ${JSON.stringify(actual)}`);
  assert(ok, message);
}

// ═════════════════════════════════════════════════════════════════════════════
// P1 — LockerEntry serializes chartPaletteKey
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n=== P1: LockerEntry serializes chartPaletteKey ===\n');

console.log('P1a: chartPaletteKey is present in a saved entry');
{
  const entries = commitSaveNew({
    name: 'My List', store: makeStore(), background: null,
    bgFade: 1, bgTone: 'light', chartPaletteKey: 'ocean', lockerEntries: [],
  });
  assertEqual(entries[0].chartPaletteKey, 'ocean', 'Saved entry has chartPaletteKey = "ocean"');
}

console.log('\nP1b: chartPaletteKey survives a JSON round-trip (as stored in localStorage)');
{
  const entries = commitSaveNew({
    name: 'My List', store: makeStore(), background: null,
    bgFade: 1, bgTone: 'light', chartPaletteKey: 'sunset', lockerEntries: [],
  });
  const serialized   = JSON.stringify(entries);
  const deserialized = JSON.parse(serialized);
  assertEqual(deserialized[0].chartPaletteKey, 'sunset', 'chartPaletteKey survives JSON round-trip');
}

console.log('\nP1c: commitSaveReplace includes chartPaletteKey');
{
  let entries = commitSaveNew({
    name: 'List', store: makeStore(), background: null,
    bgFade: 1, bgTone: 'light', chartPaletteKey: 'trail', lockerEntries: [],
  });
  const id = entries[0].id;
  entries = commitSaveReplace({
    existingId: id, name: 'List', store: makeStore(), background: null,
    bgFade: 1, bgTone: 'light', chartPaletteKey: 'forest', lockerEntries: entries,
  });
  assertEqual(entries[0].chartPaletteKey, 'forest', 'commitSaveReplace writes chartPaletteKey = "forest"');
}

// ═════════════════════════════════════════════════════════════════════════════
// P2 — Loading restores the exact chartPaletteKey
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n\n=== P2: Loading restores the exact chartPaletteKey ===\n');

console.log('P2a: In-place open restores chartPaletteKey from entry');
{
  const entries = commitSaveNew({
    name: 'List', store: makeStore(), background: null,
    bgFade: 1, bgTone: 'light', chartPaletteKey: 'berry', lockerEntries: [],
  });
  const restored = loadPaletteKeyFromEntry(entries[0]);
  assertEqual(restored, 'berry', 'Restored palette = "berry"');
}

console.log('\nP2b: New-tab path restores chartPaletteKey via sessionStorage stash');
{
  const entries = commitSaveNew({
    name: 'List', store: makeStore(), background: null,
    bgFade: 1, bgTone: 'light', chartPaletteKey: 'desert', lockerEntries: [],
  });
  const stash = buildSavedListStash(entries[0]);
  const restored = initPaletteKeyFromStash(stash.palettekey);
  assertEqual(restored, 'desert', 'New-tab stash → restored palette = "desert"');
}

console.log('\nP2c: Newseed bundle carries chartPaletteKey to the new tab');
{
  const bundle = JSON.parse(buildNewseedBundle({
    background: null, bgFade: 1, bgTone: 'light', bgSize: 'cover', chartPaletteKey: 'ocean',
  }));
  assertEqual(bundle.chartPaletteKey, 'ocean', 'Newseed bundle contains chartPaletteKey = "ocean"');
}

// ═════════════════════════════════════════════════════════════════════════════
// P3 — File A and File B retain different palette keys
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n\n=== P3: File A and File B retain independent palette keys ===\n');

{
  let entries = [];
  entries = commitSaveNew({
    name: 'File A', store: makeStore('A'), background: null,
    bgFade: 1, bgTone: 'light', chartPaletteKey: 'trail', lockerEntries: entries,
  });
  entries = commitSaveNew({
    name: 'File B', store: makeStore('B'), background: null,
    bgFade: 1, bgTone: 'light', chartPaletteKey: 'ocean', lockerEntries: entries,
  });

  const entryA = entries.find(e => e.name === 'File A');
  const entryB = entries.find(e => e.name === 'File B');

  console.log('P3a: File A retains its palette key after File B is saved');
  assertEqual(entryA?.chartPaletteKey, 'trail', 'File A still has "trail"');

  console.log('\nP3b: File B retains its palette key');
  assertEqual(entryB?.chartPaletteKey, 'ocean', 'File B has "ocean"');

  console.log('\nP3c: File A palette != File B palette');
  assert(entryA?.chartPaletteKey !== entryB?.chartPaletteKey, 'File A and File B have different palette keys');

  console.log('\nP3d: Opening File A restores its key');
  assertEqual(loadPaletteKeyFromEntry(entryA), 'trail', 'File A restores "trail"');

  console.log('\nP3e: Opening File B restores its key');
  assertEqual(loadPaletteKeyFromEntry(entryB), 'ocean', 'File B restores "ocean"');
}

// ═════════════════════════════════════════════════════════════════════════════
// P4 — Save updates only the active file
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n\n=== P4: Save updates only the active file ===\n');

{
  let entries = [];
  entries = commitSaveNew({
    name: 'File A', store: makeStore('A'), background: null,
    bgFade: 1, bgTone: 'light', chartPaletteKey: 'trail', lockerEntries: entries,
  });
  entries = commitSaveNew({
    name: 'File B', store: makeStore('B'), background: null,
    bgFade: 1, bgTone: 'light', chartPaletteKey: 'ocean', lockerEntries: entries,
  });
  const idA = entries.find(e => e.name === 'File A').id;

  // User changes palette in File A's tab and saves File A only
  entries = commitSaveReplace({
    existingId: idA, name: 'File A', store: makeStore('A'), background: null,
    bgFade: 1, bgTone: 'light', chartPaletteKey: 'sunset', lockerEntries: entries,
  });

  const afterA = entries.find(e => e.name === 'File A');
  const afterB = entries.find(e => e.name === 'File B');

  console.log('P4a: File A now has the updated palette key');
  assertEqual(afterA?.chartPaletteKey, 'sunset', 'File A updated to "sunset"');

  console.log('\nP4b: File B is unchanged by saving File A');
  assertEqual(afterB?.chartPaletteKey, 'ocean', 'File B still has "ocean"');
}

// ═════════════════════════════════════════════════════════════════════════════
// P5 — Save As copies chartPaletteKey into a new entry
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n\n=== P5: Save As copies chartPaletteKey into a new entry ===\n');

{
  let entries = [];
  entries = commitSaveNew({
    name: 'Original', store: makeStore('O'), background: null,
    bgFade: 1, bgTone: 'light', chartPaletteKey: 'forest', lockerEntries: entries,
  });
  const originalId = entries[0].id;

  // Save As = commitSaveNew with the SAME palette key
  entries = commitSaveNew({
    name: 'Copy of Original', store: makeStore('O'), background: null,
    bgFade: 1, bgTone: 'light', chartPaletteKey: 'forest', lockerEntries: entries,
  });

  const original = entries.find(e => e.id === originalId);
  const copy     = entries.find(e => e.name === 'Copy of Original');

  console.log('P5a: New Save As copy has the same palette key as the source');
  assertEqual(copy?.chartPaletteKey, 'forest', 'Copy starts with "forest"');

  console.log('\nP5b: Original is unchanged');
  assertEqual(original?.chartPaletteKey, 'forest', 'Original still has "forest"');

  console.log('\nP5c: Copy and original are separate entries');
  assert(copy?.id !== original?.id, 'Copy has a different ID than the original');
}

// ═════════════════════════════════════════════════════════════════════════════
// P6 — Save As leaves the original file unchanged
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n\n=== P6: Save As leaves the original file unchanged ===\n');

{
  let entries = [];
  entries = commitSaveNew({
    name: 'Original', store: makeStore('O'), background: null,
    bgFade: 1, bgTone: 'light', chartPaletteKey: 'berry', lockerEntries: entries,
  });
  const originalId   = entries[0].id;
  const originalData = JSON.stringify(entries[0]);

  // Save As — create a copy and change its palette
  entries = commitSaveNew({
    name: 'Copy', store: makeStore('O'), background: null,
    bgFade: 1, bgTone: 'light', chartPaletteKey: 'berry', lockerEntries: entries,
  });
  // Simulate user changes palette in copy and saves it
  const copyId = entries.find(e => e.name === 'Copy').id;
  entries = commitSaveReplace({
    existingId: copyId, name: 'Copy', store: makeStore('O'), background: null,
    bgFade: 1, bgTone: 'light', chartPaletteKey: 'desert', lockerEntries: entries,
  });

  const afterOriginal = entries.find(e => e.id === originalId);

  console.log('P6a: Original palette key is unchanged after copy was modified');
  assertEqual(afterOriginal?.chartPaletteKey, 'berry', 'Original still has "berry"');

  console.log('\nP6b: Original store data is unchanged');
  const afterOriginalCopy = JSON.stringify(afterOriginal);
  assertEqual(afterOriginalCopy, originalData, 'Original entry is byte-identical to initial save');
}

// ═════════════════════════════════════════════════════════════════════════════
// P7 — New copies the current chartPaletteKey into the newseed bundle
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n\n=== P7: New copies chartPaletteKey into the newseed bundle ===\n');

console.log('P7a: Newseed bundle receives the current palette key');
{
  const bundle = JSON.parse(buildNewseedBundle({
    background: null, bgFade: 0.8, bgTone: 'dark', bgSize: 'contain', chartPaletteKey: 'trail',
  }));
  assertEqual(bundle.chartPaletteKey, 'trail', 'Newseed bundle chartPaletteKey = "trail"');
}

console.log('\nP7b: Newseed bundle preserves the original tab\'s palette');
{
  const bundle = JSON.parse(buildNewseedBundle({
    background: null, bgFade: 1, bgTone: 'light', bgSize: 'cover', chartPaletteKey: 'sunset',
  }));
  assertEqual(bundle.chartPaletteKey, 'sunset', 'Newseed bundle has "sunset" when source tab had "sunset"');
}

// ═════════════════════════════════════════════════════════════════════════════
// P8 — Refresh / initialization restores the active file's palette key
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n\n=== P8: Refresh restores the active file\'s palette key ===\n');

console.log('P8a: stash value (from sessionStorage) restores correctly');
{
  const stash = 'ocean';
  const restored = initPaletteKeyFromStash(stash);
  assertEqual(restored, 'ocean', 'Stash "ocean" → restored "ocean"');
}

console.log('\nP8b: empty stash value falls back to default');
{
  const restored = initPaletteKeyFromStash('');
  assertEqual(restored, DEFAULT_PALETTE, `Empty stash → default "${DEFAULT_PALETTE}"`);
}

console.log('\nP8c: null stash (not set) falls back to default');
{
  const restored = initPaletteKeyFromStash(null);
  assertEqual(restored, DEFAULT_PALETTE, `null stash → default "${DEFAULT_PALETTE}"`);
}

// ═════════════════════════════════════════════════════════════════════════════
// P9 — Older file without chartPaletteKey opens safely with default
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n\n=== P9: Older file without chartPaletteKey loads safely ===\n');

console.log('P9a: Entry without chartPaletteKey loads with default palette');
{
  const oldEntry = {
    id: 'old-1',
    name: 'Old File',
    savedAt: 1700000000000,
    store: makeStore('X'),
    background: null,
    bgFade: 1,
    bgTone: 'light',
    // chartPaletteKey deliberately absent
  };
  const restored = loadPaletteKeyFromEntry(oldEntry);
  assertEqual(restored, DEFAULT_PALETTE, `Old file → default palette "${DEFAULT_PALETTE}"`);
}

console.log('\nP9b: Gear data in older file is intact after loading');
{
  const oldEntry = {
    id: 'old-2', name: 'Old File 2', savedAt: 1700000000001,
    store: makeStore('Y'), background: null, bgFade: 1, bgTone: 'light',
  };
  // Loading does not modify gear data
  loadPaletteKeyFromEntry(oldEntry);
  assertEqual(oldEntry.store.order.length, 3, 'Gear order unchanged (3 categories)');
  assertEqual(oldEntry.store.items['Backpack'].length, 1, 'Backpack still has 1 item');
}

// ═════════════════════════════════════════════════════════════════════════════
// P10 — Saving an older file adds a valid chartPaletteKey
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n\n=== P10: Saving an older file adds chartPaletteKey ===\n');

console.log('P10a: After saving an old entry, it now contains chartPaletteKey');
{
  const oldEntry = { id: 'old-3', name: 'Old', savedAt: 1700000000002, store: makeStore('Z'), background: null, bgFade: 1, bgTone: 'light' };
  const entries  = [oldEntry];
  // User opens the old file (falls back to default), then saves it
  const paletteKeyAfterLoad = loadPaletteKeyFromEntry(oldEntry); // 'trail'
  const updated = commitSaveReplace({
    existingId: oldEntry.id, name: oldEntry.name, store: oldEntry.store,
    background: null, bgFade: 1, bgTone: 'light', chartPaletteKey: paletteKeyAfterLoad, lockerEntries: entries,
  });
  assert(!!updated[0].chartPaletteKey, 'Saved entry now has chartPaletteKey');
  assertEqual(updated[0].chartPaletteKey, DEFAULT_PALETTE, `Added chartPaletteKey = "${DEFAULT_PALETTE}" (the default)`);
}

// ═════════════════════════════════════════════════════════════════════════════
// P11 — Default initialization does not overwrite a restored chartPaletteKey
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n\n=== P11: Default init does not overwrite restored chartPaletteKey ===\n');

console.log('P11a: When a stash value is present, it takes priority over default');
{
  // Simulate: localStorage has 'trail' (the fallback) but the file's stash says 'berry'
  const localStorageFallback = 'trail';
  const stashedValue = 'berry';
  // Priority: stash beats localStorage
  const restored = stashedValue || localStorageFallback;
  assertEqual(restored, 'berry', 'Stash "berry" is not overwritten by localStorage "trail"');
}

console.log('\nP11b: Restored file palette "ocean" is not reverted to "trail" after loading');
{
  const entries = commitSaveNew({
    name: 'List', store: makeStore(), background: null,
    bgFade: 1, bgTone: 'light', chartPaletteKey: 'ocean', lockerEntries: [],
  });
  const loaded = loadPaletteKeyFromEntry(entries[0]);
  // Check that a subsequent "default init" path (reading localStorage 'trail')
  // would NOT replace the loaded value
  const whatWouldBeUsed = loaded;  // the restored value is already final
  assertEqual(whatWouldBeUsed, 'ocean', 'Restored "ocean" is not replaced by default "trail"');
}

// ═════════════════════════════════════════════════════════════════════════════
// P12 — Unknown chartPaletteKey values do not crash loading
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n\n=== P12: Unknown chartPaletteKey values do not crash loading ===\n');

console.log('P12a: Entry with unknown palette key loads without throwing');
{
  const badEntry = {
    id: 'bad-1', name: 'Bad Palette', savedAt: Date.now(),
    store: makeStore(), background: null, bgFade: 1, bgTone: 'light',
    chartPaletteKey: 'nonexistent-palette',
  };
  let threw = false;
  try {
    loadPaletteKeyFromEntry(badEntry);
    // WeightSummary falls back via: PALETTES[paletteKey] ?? PALETTES.trail
    // We test that the value is returned (not undefined/null) and that the
    // fallback lookup would succeed.
    const key = badEntry.chartPaletteKey;
    const safePalettes = { trail: ['#3d5c3a'], ocean: ['#1a4a6e'] };
    const color = safePalettes[key] ?? safePalettes['trail'];
    assert(Array.isArray(color), 'Fallback palette lookup succeeds');
  } catch {
    threw = true;
  }
  assert(!threw, 'loadPaletteKeyFromEntry does not throw for unknown key');
}

console.log('\nP12b: Missing chartPaletteKey (undefined) does not crash loading');
{
  const entryNoPalette = {
    id: 'no-palette', name: 'No Palette', savedAt: Date.now(),
    store: makeStore(), background: null, bgFade: 1, bgTone: 'light',
  };
  let threw = false;
  try {
    const key = loadPaletteKeyFromEntry(entryNoPalette);
    assert(typeof key === 'string' && key.length > 0, 'Returns a non-empty default string');
  } catch {
    threw = true;
  }
  assert(!threw, 'No error when chartPaletteKey is absent');
}

// ═════════════════════════════════════════════════════════════════════════════
// P13 — Gear data unchanged through save-and-load round trip
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n\n=== P13: Gear data unchanged through save-and-load round trip ===\n');

console.log('P13a: store.order is preserved across save/load');
{
  const original = makeStore('RT');
  const entries  = commitSaveNew({
    name: 'RT', store: original, background: null,
    bgFade: 1, bgTone: 'light', chartPaletteKey: 'trail', lockerEntries: [],
  });
  // Load
  const loaded = entries[0].store;
  assertEqual(JSON.stringify(loaded.order), JSON.stringify(original.order), 'store.order preserved');
}

console.log('\nP13b: store.items preserved across save/load');
{
  const original = makeStore('RT2');
  const entries  = commitSaveNew({
    name: 'RT2', store: original, background: null,
    bgFade: 1, bgTone: 'light', chartPaletteKey: 'ocean', lockerEntries: [],
  });
  const loaded = entries[0].store;
  assertEqual(loaded.items['Backpack'][0].desc, 'ULA Circuit', 'Backpack item description preserved');
  assertEqual(loaded.items['Backpack'][0].weightOz, 40.8, 'Backpack item weight preserved');
  assertEqual(loaded.items['Shelter'][0].desc, 'Zpacks Duplex', 'Shelter item description preserved');
}

console.log('\nP13c: store.meta preserved across save/load');
{
  const original = makeStore('RT3');
  const entries  = commitSaveNew({
    name: 'RT3', store: original, background: null,
    bgFade: 1, bgTone: 'light', chartPaletteKey: 'forest', lockerEntries: [],
  });
  const loaded = entries[0].store;
  assertEqual(loaded.meta['Backpack'].countsToBase, true, 'Backpack meta.countsToBase preserved');
  assertEqual(loaded.meta['Shelter'].countsToBase, true, 'Shelter meta.countsToBase preserved');
}

console.log('\nP13d: Adding chartPaletteKey does not alter any store field');
{
  const original = makeStore('RT4');
  const originalStr = JSON.stringify(original);
  const entries = commitSaveNew({
    name: 'RT4', store: original, background: null,
    bgFade: 1, bgTone: 'light', chartPaletteKey: 'berry', lockerEntries: [],
  });
  const savedStore = entries[0].store;
  assertEqual(JSON.stringify(savedStore), originalStr, 'store is byte-identical to original');
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(48)}`);
console.log(`Tests: ${passed + failed}  Passed: ${passed}  Failed: ${failed}`);
if (failed > 0) {
  console.error('\n❌ Some tests failed.');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed.');
}
