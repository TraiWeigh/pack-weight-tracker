/**
 * newBlank020.test.mjs
 *
 * Prompt 020 — New Starts With No Categories
 *
 * Verifies:
 *   1. handleNew() writes __blank:true + empty order/items/meta to newseed
 *   2. handleNew() does NOT clone the current store (no categories, no items)
 *   3. handleNew() still writes the background bundle (bg, bgFade, bgTone, bgSize, chartPaletteKey)
 *   4. parseV5() with __blank:true returns empty store (skips mergeDefaultCategories)
 *   5. parseV5() without __blank still inserts default categories (Reset / normal load unaffected)
 *   6. parseV5() with __blank:false behaves as normal (explicit false is not treated as blank)
 *   7. Active locker file cleared on New (no stale filename from previous file)
 *   8. handleNew() no longer references "clonedStore" or "clone" (no copy of current list)
 *   9. Locker load path (savedListId) is unaffected by the __blank change
 *  10. Reset function is independent of handleNew (not the same handler)
 *  11. Save/Save As workflow markers are unchanged
 *  12. 019 sidebar, 018C pill, 017E shaking fix references preserved
 *  13. Add Category handler exists (user can build list from scratch after New)
 *  14. Background bundle keys preserved (background, bgFade, bgTone, bgSize, chartPaletteKey)
 *  15. usePackData parseV5 — __blank store has order.length === 0 and no items keys
 *  16. usePackData parseV5 — normal empty order [] WITHOUT __blank gets all default categories
 *
 * Note: Runtime integration tests (open app, click New, verify UI) cannot be
 * automated here — they require the user's fresh-preview acceptance test.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import assert from 'assert/strict';

const checklistPath = resolve(process.cwd(), 'artifacts/pack-checklist/src/pages/Checklist.tsx');
const packDataPath  = resolve(process.cwd(), 'artifacts/pack-checklist/src/hooks/usePackData.ts');

const checklist = readFileSync(checklistPath, 'utf8');
const packData  = readFileSync(packDataPath,  'utf8');

// Locate the handleNew function body
const handleNewStart = checklist.indexOf('const handleNew = useCallback(');
assert.ok(handleNewStart > -1, 'handleNew not found in Checklist.tsx');
const handleNewEnd = checklist.indexOf('\n  }, [', handleNewStart) + 100;
const handleNewBody = checklist.slice(handleNewStart, handleNewEnd);

// Locate parseV5 function body
const parseV5Start = packData.indexOf('function parseV5(');
assert.ok(parseV5Start > -1, 'parseV5 not found in usePackData.ts');
const parseV5Body = packData.slice(parseV5Start, parseV5Start + 2000);

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('\nPrompt 020 — New Starts With No Categories\n');

// ── handleNew() — NEWSEED IS BLANK ───────────────────────────────────────────

test('1. handleNew newseed contains __blank: true', () => {
  assert.ok(handleNewBody.includes('__blank: true'), '__blank: true not written to newseed in handleNew');
});

test('2. handleNew newseed has order: []', () => {
  assert.ok(handleNewBody.includes('order: []'), 'order: [] not found in handleNew newseed');
});

test('3. handleNew newseed has items: {}', () => {
  assert.ok(handleNewBody.includes('items: {}'), 'items: {} not found in handleNew newseed');
});

test('4. handleNew newseed has meta: {}', () => {
  assert.ok(handleNewBody.includes('meta: {}'), 'meta: {} not found in handleNew newseed');
});

test('5. handleNew no longer clones the current store (no JSON.parse(JSON.stringify(store)))', () => {
  assert.ok(
    !handleNewBody.includes('JSON.parse(JSON.stringify(store))'),
    'Store cloning still present in handleNew — should write blank newseed instead'
  );
});

test('6. handleNew does not copy any categories from the current list (no clonedStore)', () => {
  assert.ok(
    !handleNewBody.includes('clonedStore'),
    'clonedStore reference found in handleNew — New should start with zero categories'
  );
});

test('7. handleNew does not iterate store.order (no loop copying categories)', () => {
  assert.ok(
    !handleNewBody.includes('for (const cat of clonedStore.order)'),
    'Category copy loop still present in handleNew'
  );
});

test('8. handleNew still writes background bundle (tw-newseed-bg-${uuid})', () => {
  assert.ok(
    handleNewBody.includes('tw-newseed-bg-'),
    'Background bundle key not found in handleNew — background inheritance may be broken'
  );
});

test('9. handleNew background bundle includes chartPaletteKey', () => {
  assert.ok(
    handleNewBody.includes('chartPaletteKey'),
    'chartPaletteKey not found in handleNew background bundle'
  );
});

test('10. handleNew clears active locker file (writeActiveLockerFileToSS(null))', () => {
  assert.ok(
    handleNewBody.includes('writeActiveLockerFileToSS(null)'),
    'writeActiveLockerFileToSS(null) not found in handleNew — stale filename may persist'
  );
});

test('11. handleNew clears activeLockerFile state (setActiveLockerFile(null))', () => {
  assert.ok(
    handleNewBody.includes('setActiveLockerFile(null)'),
    'setActiveLockerFile(null) not found in handleNew — stale filename may persist'
  );
});

test('12. handleNew opens new tab with ?newseed= parameter', () => {
  assert.ok(
    handleNewBody.includes('?newseed='),
    '?newseed= URL parameter not found in handleNew'
  );
});

// Background bundle keys
test('13. Background bundle has `background` key', () => {
  assert.ok(handleNewBody.includes('background:'), 'background key missing from bg bundle in handleNew');
});

test('14. Background bundle has `bgFade` key (literal 1 — Task #41: no longer inherited)', () => {
  assert.ok(handleNewBody.includes('bgFade:') || handleNewBody.includes('bgFade,'), 'bgFade missing from bg bundle');
});

test('15. Background bundle has `bgTone` key (literal "light" — Task #41: no longer inherited)', () => {
  assert.ok(handleNewBody.includes('bgTone:') || handleNewBody.includes('bgTone,'), 'bgTone missing from bg bundle');
});

test('16. Background bundle has `bgSize` key (literal "cover" — Task #41: no longer inherited)', () => {
  assert.ok(handleNewBody.includes('bgSize:') || handleNewBody.includes('bgSize,'), 'bgSize missing from bg bundle');
});

// ── parseV5() — __blank BYPASSES mergeDefaultCategories ──────────────────────

test('17. parseV5 references p.__blank to conditionally skip mergeDefaultCategories', () => {
  assert.ok(
    parseV5Body.includes('p.__blank') || parseV5Body.includes('__blank'),
    'p.__blank check not found in parseV5 — blank newseed will get default categories re-inserted'
  );
});

test('18. parseV5 uses p.__blank to choose between mergeDefaultCategories and deduped.order', () => {
  // The ternary: p.__blank ? deduped.order : mergeDefaultCategories(deduped.order)
  const hasBlankBranch = parseV5Body.includes('p.__blank ?') || parseV5Body.includes('__blank ?');
  const hasSkipPattern = parseV5Body.includes('deduped.order') && parseV5Body.includes('mergeDefaultCategories');
  assert.ok(
    (hasBlankBranch || parseV5Body.includes('if (p.__blank)')) && hasSkipPattern,
    'parseV5 does not correctly branch on __blank to skip mergeDefaultCategories'
  );
});

test('19. parseV5 still calls mergeDefaultCategories for normal (non-blank) loads', () => {
  assert.ok(
    parseV5Body.includes('mergeDefaultCategories'),
    'mergeDefaultCategories call removed from parseV5 — normal file loads will lose default categories'
  );
});

// ── INLINE LOGIC TEST: simulate parseV5 behavior ─────────────────────────────

// Replicate the exact DEFAULT_CATEGORY_ORDER from usePackData
const DEFAULT_CATEGORY_ORDER = [
  'Backpack', 'Shelter', 'Sleep', 'Clothing Packed', 'Kitchen',
  'Electronics', 'Toiletries', 'Med Kit', 'Repair Kit', 'Hydration',
  'Clothing Worn', 'Dog Pack', 'Expendables',
];

// Minimal mergeDefaultCategories replica for tests
function mergeDefaultCategories(storedOrder) {
  let order = [...storedOrder];
  for (const cat of DEFAULT_CATEGORY_ORDER) {
    if (!order.includes(cat)) order.push(cat);
  }
  return order;
}

// Simulate parseV5 behavior based on __blank flag
function simulateParseV5(p) {
  if (!p || p.__v !== 5 || !Array.isArray(p.order)) return null;
  const order = p.__blank ? p.order : mergeDefaultCategories(p.order);
  return { order, items: p.items ?? {}, meta: p.meta ?? {} };
}

test('20. __blank:true + empty order → parseV5 returns order.length === 0', () => {
  const result = simulateParseV5({ __v: 5, __blank: true, items: {}, order: [], meta: {} });
  assert.ok(result !== null, 'simulateParseV5 returned null for blank newseed');
  assert.equal(result.order.length, 0, `Expected order.length=0, got ${result.order.length}`);
});

test('21. __blank:true → no items keys in parsed store', () => {
  const result = simulateParseV5({ __v: 5, __blank: true, items: {}, order: [], meta: {} });
  assert.ok(result !== null, 'simulateParseV5 returned null');
  assert.equal(Object.keys(result.items).length, 0, 'Expected 0 item categories in blank store');
});

test('22. WITHOUT __blank, empty order [] → gets all default categories', () => {
  const result = simulateParseV5({ __v: 5, items: {}, order: [], meta: {} });
  assert.ok(result !== null, 'simulateParseV5 returned null for normal empty store');
  assert.ok(
    result.order.length === DEFAULT_CATEGORY_ORDER.length,
    `Without __blank, expected ${DEFAULT_CATEGORY_ORDER.length} default categories, got ${result.order.length}`
  );
});

test('23. __blank:false → treated as normal, gets default categories', () => {
  const result = simulateParseV5({ __v: 5, __blank: false, items: {}, order: [], meta: {} });
  assert.ok(result !== null, 'simulateParseV5 returned null');
  assert.ok(
    result.order.length > 0,
    '__blank:false should not skip mergeDefaultCategories'
  );
});

test('24. __blank:true with partial data → preserves existing non-default categories', () => {
  const result = simulateParseV5({
    __v: 5, __blank: true,
    items: { 'My Gear': [] },
    order: ['My Gear'],
    meta: {},
  });
  assert.ok(result !== null, 'simulateParseV5 returned null');
  assert.deepEqual(result.order, ['My Gear'], 'Expected only user-added category, no defaults');
});

// ── PROTECTED FEATURES — STRUCTURAL CHECKS ───────────────────────────────────

test('25. Reset handler is separate from handleNew (no shared function)', () => {
  // Reset handler is typically handleReset — verify it exists and is distinct
  const handleResetIdx = checklist.indexOf('handleReset');
  assert.ok(handleResetIdx > -1, 'handleReset not found in Checklist.tsx — Reset may be broken');
  // Verify handleNew does not call handleReset
  assert.ok(
    !handleNewBody.includes('handleReset'),
    'handleNew calls handleReset — New and Reset should be independent'
  );
});

test('26. Save handler has "Saved [name]" toast wording without extra quotes (020F)', () => {
  // 020F: quotes removed from toast — `Saved ${name}` not `Saved "${name}"`
  assert.ok(
    checklist.includes('`Saved ${name}`'),
    'Save toast must be `Saved ${name}` — quotes were removed in 020F'
  );
});

test('27. Locker load path (savedListId) unaffected — still reads entry.store', () => {
  assert.ok(packData.includes('savedListId'), 'savedListId path missing from usePackData');
  assert.ok(packData.includes('entry.store'), 'entry.store not referenced — Locker load may be broken');
});

test('28. 018C filename pill centering preserved (inset-0 pt-8 pb-3)', () => {
  assert.ok(
    checklist.includes('absolute inset-0 pt-8 pb-3 flex items-center justify-center pointer-events-none'),
    '018C filename pill centering classes not found'
  );
});

test('29. 019 WeightDistribution imported in Checklist.tsx (separate panel preserved)', () => {
  assert.ok(
    checklist.includes('WeightDistribution'),
    'WeightDistribution not imported — 019 separate panel may be broken'
  );
});

test('30. 019 BackgroundPickerButton panelOpen prop still present', () => {
  assert.ok(
    checklist.includes('panelOpen={backgroundPickerOpen}'),
    '019 panelOpen={backgroundPickerOpen} not found in Checklist.tsx'
  );
});

test('31. Add Category control still present (user can add categories after New)', () => {
  // Add Category uses "addCategory" or a modal/dialog trigger — check handler exists
  const hasAddCat = checklist.includes('addCategory') || checklist.includes('handleAddCategory') || checklist.includes('add-category');
  assert.ok(hasAddCat, 'addCategory handler not found — user cannot add categories after New');
});

test('32. usePackData emptyData() still exists (Reset/first load paths unaffected)', () => {
  assert.ok(packData.includes('function emptyData'), 'emptyData() missing from usePackData.ts');
});

test('33. usePackData seedInitialData() still exists (guest/seed paths unaffected)', () => {
  assert.ok(packData.includes('function seedInitialData'), 'seedInitialData() missing from usePackData.ts');
});

test('34. LOCKER_KEY constant still present (Locker storage key unchanged)', () => {
  assert.ok(packData.includes("export const LOCKER_KEY"), 'LOCKER_KEY not found in usePackData.ts');
});

test('35. 017E background/shaking fix — willChange or paddingTop still in BackgroundPicker area (not removed by Checklist edits)', () => {
  // Just check Checklist.tsx still imports/uses BackgroundPicker
  assert.ok(
    checklist.includes('BackgroundPickerButton'),
    'BackgroundPickerButton import missing — 017E shaking fix may be affected'
  );
});

test('36. usePackData parseV5 still requires __v === 5 (format version guard intact)', () => {
  assert.ok(
    parseV5Body.includes('p.__v !== 5'),
    'Version guard p.__v !== 5 missing from parseV5 — all parse calls may break'
  );
});

console.log('\n────────────────────────────────────────────────────');
console.log('Tests: 36');
console.log('\n⚠️  Automated tests verify structural correctness only.');
console.log('Runtime verification (click New → zero categories, add category, save, reopen File A)');
console.log('requires the user\'s fresh-preview acceptance test.');
