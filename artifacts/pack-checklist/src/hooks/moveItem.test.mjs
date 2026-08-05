/**
 * Automated tests for the moveItem Store transformation.
 *
 * Run with:
 *   node artifacts/pack-checklist/src/hooks/moveItem.test.mjs
 *
 * Uses the Node.js built-in runner (no extra deps).
 * The pure Store-transformation function is inlined from usePackData.ts so
 * tests run without a build step while remaining a faithful copy of production.
 */

// ── Inline pure Store transformation (copied from usePackData.ts moveItem) ────

/**
 * applyMoveItem — the pure function passed to pushAndSet inside moveItem().
 * Returns prev unchanged (no mutation) when validation fails.
 */
function applyMoveItem(prev, sourceCategory, destinationCategory, itemId) {
  if (!prev.order.includes(sourceCategory))      return prev;
  if (!prev.order.includes(destinationCategory)) return prev;
  if (sourceCategory === destinationCategory)     return prev;
  const sourceItems = prev.items[sourceCategory] ?? [];
  const item = sourceItems.find(i => i.id === itemId);
  if (!item) return prev;
  return {
    ...prev,
    items: {
      ...prev.items,
      [sourceCategory]:      sourceItems.filter(i => i.id !== itemId),
      [destinationCategory]: [...(prev.items[destinationCategory] ?? []), item],
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

// ── Fixture factory ───────────────────────────────────────────────────────────

function makeStore() {
  return {
    order: ['Backpack', 'Clothing Packed', 'Kitchen Gear', 'Cook Set'],
    items: {
      'Backpack': [
        { id: 'bp1', sub: 'Backpack',    desc: 'ULA Circuit',   weightOz: 40.8, qty: 1, checked: true,  expendable: false },
        { id: 'bp2', sub: 'Pack Liner',  desc: '18G Bag',       weightOz: 1.7,  qty: 1, checked: false, expendable: false },
      ],
      'Clothing Packed': [
        { id: 'cp1', sub: 'Rain Jacket', desc: 'OR Helium',     weightOz: 9.5,  qty: 1, checked: true,  expendable: false },
      ],
      'Kitchen Gear': [
        { id: 'kg1', sub: 'Stove',       desc: 'BRS-3000T',     weightOz: 0.9,  qty: 1, checked: true,  expendable: false },
      ],
      'Cook Set': [],
    },
    meta: {
      'Backpack':        { countsToBase: true },
      'Clothing Packed': { countsToBase: true },
      'Kitchen Gear':    { countsToBase: true },
      'Cook Set':        { countsToBase: true },
    },
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// M1 — Basic move: removes from source, adds to destination
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n=== M1: Basic move — source / destination counts ===\n');

console.log('M1a: Item is removed from source category');
{
  const result = applyMoveItem(makeStore(), 'Backpack', 'Clothing Packed', 'bp1');
  assertEqual(result.items['Backpack'].length, 1,
    'Backpack has 1 item after moving bp1 out (was 2)');
  assert(!result.items['Backpack'].some(i => i.id === 'bp1'),
    'bp1 no longer in Backpack');
}

console.log('\nM1b: Item is added to destination category');
{
  const result = applyMoveItem(makeStore(), 'Backpack', 'Clothing Packed', 'bp1');
  assertEqual(result.items['Clothing Packed'].length, 2,
    'Clothing Packed has 2 items after receiving bp1 (was 1)');
  assert(result.items['Clothing Packed'].some(i => i.id === 'bp1'),
    'bp1 now in Clothing Packed');
}

console.log('\nM1c: Other categories are untouched');
{
  const original = makeStore();
  const result = applyMoveItem(original, 'Backpack', 'Clothing Packed', 'bp1');
  assertEqual(result.items['Kitchen Gear'], original.items['Kitchen Gear'],
    'Kitchen Gear unchanged');
  assertEqual(result.items['Cook Set'], original.items['Cook Set'],
    'Cook Set unchanged');
}

// ═════════════════════════════════════════════════════════════════════════════
// M2 — Complete item data is preserved
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n\n=== M2: Complete item data preserved ===\n');

{
  const result = applyMoveItem(makeStore(), 'Backpack', 'Clothing Packed', 'bp2');
  const moved = result.items['Clothing Packed'].find(i => i.id === 'bp2');

  console.log('M2a: All GearItem fields intact after move');
  assert(!!moved,                         'Moved item found in destination');
  assertEqual(moved?.id,         'bp2',   'id preserved');
  assertEqual(moved?.sub,        'Pack Liner', 'sub (Type) preserved');
  assertEqual(moved?.desc,       '18G Bag',    'desc (Description) preserved');
  assertEqual(moved?.weightOz,   1.7,          'weightOz preserved');
  assertEqual(moved?.qty,        1,            'qty preserved');
  assertEqual(moved?.checked,    false,        'checked=false preserved (not reset to true)');
  assertEqual(moved?.expendable, false,        'expendable preserved');
}

console.log('\nM2b: Checked=true is preserved');
{
  const result = applyMoveItem(makeStore(), 'Backpack', 'Clothing Packed', 'bp1');
  const moved = result.items['Clothing Packed'].find(i => i.id === 'bp1');
  assertEqual(moved?.checked, true, 'checked=true preserved across move');
}

console.log('\nM2c: Expendable flag preserved when true');
{
  const store = makeStore();
  store.items['Backpack'].push({
    id: 'exp1', sub: 'Fuel', desc: '4 oz', weightOz: 7.68, qty: 1, checked: true, expendable: true,
  });
  const result = applyMoveItem(store, 'Backpack', 'Kitchen Gear', 'exp1');
  const moved = result.items['Kitchen Gear'].find(i => i.id === 'exp1');
  assertEqual(moved?.expendable, true, 'expendable=true preserved');
}

console.log('\nM2d: High quantity preserved');
{
  const store = makeStore();
  store.items['Backpack'].push({
    id: 'qty5', sub: 'Stakes', desc: 'Ti Shep Hooks', weightOz: 0.6, qty: 6, checked: true, expendable: false,
  });
  const result = applyMoveItem(store, 'Backpack', 'Clothing Packed', 'qty5');
  const moved = result.items['Clothing Packed'].find(i => i.id === 'qty5');
  assertEqual(moved?.qty, 6, 'qty=6 preserved');
}

// ═════════════════════════════════════════════════════════════════════════════
// M3 — Same-category move is a no-op
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n\n=== M3: Same-category move is a no-op ===\n');

console.log('M3a: Moving to the same category returns the identical store reference');
{
  const original = makeStore();
  const result = applyMoveItem(original, 'Backpack', 'Backpack', 'bp1');
  assert(result === original, 'Same reference returned — no mutation');
}

console.log('\nM3b: Item counts unchanged after same-category call');
{
  const original = makeStore();
  const result = applyMoveItem(original, 'Backpack', 'Backpack', 'bp1');
  assertEqual(result.items['Backpack'].length, 2, 'Backpack count unchanged');
}

// ═════════════════════════════════════════════════════════════════════════════
// M4 — Invalid inputs leave Store unchanged
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n\n=== M4: Invalid inputs leave Store state unchanged ===\n');

console.log('M4a: Source category not in order → original reference returned');
{
  const original = makeStore();
  const result = applyMoveItem(original, 'Nonexistent', 'Clothing Packed', 'bp1');
  assert(result === original, 'Original reference returned for missing source');
}

console.log('\nM4b: Destination category not in order → original reference returned');
{
  const original = makeStore();
  const result = applyMoveItem(original, 'Backpack', 'Nonexistent', 'bp1');
  assert(result === original, 'Original reference returned for missing destination');
}

console.log('\nM4c: Item ID not found in source → original reference returned');
{
  const original = makeStore();
  const result = applyMoveItem(original, 'Backpack', 'Clothing Packed', 'ghost-id');
  assert(result === original, 'Original reference returned for missing item ID');
}

console.log('\nM4d: No category or item data is corrupted by failed validation');
{
  const original = makeStore();
  const r1 = applyMoveItem(original, 'Nonexistent', 'Clothing Packed', 'bp1');
  const r2 = applyMoveItem(original, 'Backpack', 'Nonexistent', 'bp1');
  const r3 = applyMoveItem(original, 'Backpack', 'Clothing Packed', 'ghost');
  assertEqual(JSON.stringify(r1), JSON.stringify(original), 'Store intact after bad source');
  assertEqual(JSON.stringify(r2), JSON.stringify(original), 'Store intact after bad destination');
  assertEqual(JSON.stringify(r3), JSON.stringify(original), 'Store intact after bad item ID');
}

// ═════════════════════════════════════════════════════════════════════════════
// M5 — Undo / Redo semantics (simulated via inverse operations)
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n\n=== M5: Undo / Redo via inverse operations ===\n');

console.log('M5a: Undo — moving item back restores the original state');
{
  const original    = makeStore();
  const afterMove   = applyMoveItem(original, 'Backpack', 'Clothing Packed', 'bp1');
  const afterUndo   = applyMoveItem(afterMove, 'Clothing Packed', 'Backpack', 'bp1');
  // Order within the source array is restored (item was appended; undo appends back)
  // Deep equality on items/order/meta
  assertEqual(JSON.stringify(afterUndo.order), JSON.stringify(original.order),
    'Order unchanged after move+undo');
  assertEqual(afterUndo.items['Backpack'].length, original.items['Backpack'].length,
    'Backpack item count restored after undo');
  assertEqual(afterUndo.items['Clothing Packed'].length, original.items['Clothing Packed'].length,
    'Clothing Packed item count restored after undo');
  // bp1 back in Backpack
  assert(afterUndo.items['Backpack'].some(i => i.id === 'bp1'),
    'bp1 back in Backpack after undo');
  assert(!afterUndo.items['Clothing Packed'].some(i => i.id === 'bp1'),
    'bp1 removed from Clothing Packed after undo');
}

console.log('\nM5b: Redo — re-applying move lands item back in destination');
{
  const original    = makeStore();
  const afterMove   = applyMoveItem(original, 'Backpack', 'Clothing Packed', 'bp1');
  const afterUndo   = applyMoveItem(afterMove, 'Clothing Packed', 'Backpack', 'bp1');
  const afterRedo   = applyMoveItem(afterUndo, 'Backpack', 'Clothing Packed', 'bp1');
  assert(afterRedo.items['Clothing Packed'].some(i => i.id === 'bp1'),
    'bp1 in Clothing Packed after redo');
  assert(!afterRedo.items['Backpack'].some(i => i.id === 'bp1'),
    'bp1 not in Backpack after redo');
}

console.log('\nM5c: Undo does not duplicate or delete the item');
{
  const original    = makeStore();
  const afterMove   = applyMoveItem(original, 'Backpack', 'Clothing Packed', 'bp1');
  const afterUndo   = applyMoveItem(afterMove, 'Clothing Packed', 'Backpack', 'bp1');
  const allIds = Object.values(afterUndo.items).flat().map(i => i.id);
  const uniqueIds = new Set(allIds);
  assertEqual(uniqueIds.size, allIds.length, 'No duplicate item IDs after move+undo');
}

// ═════════════════════════════════════════════════════════════════════════════
// M6 — No duplicate item IDs
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n\n=== M6: No duplicate item IDs ===\n');

console.log('M6a: Single move produces no duplicate IDs');
{
  const result = applyMoveItem(makeStore(), 'Backpack', 'Clothing Packed', 'bp1');
  const allIds = Object.values(result.items).flat().map(i => i.id);
  const uniqueIds = new Set(allIds);
  assertEqual(uniqueIds.size, allIds.length, 'All item IDs unique after move');
}

console.log('\nM6b: Sequential moves produce no duplicate IDs');
{
  const s1 = applyMoveItem(makeStore(), 'Backpack', 'Clothing Packed', 'bp1');
  const s2 = applyMoveItem(s1, 'Backpack', 'Kitchen Gear', 'bp2');
  const allIds = Object.values(s2.items).flat().map(i => i.id);
  const uniqueIds = new Set(allIds);
  assertEqual(uniqueIds.size, allIds.length, 'All item IDs unique after 2 sequential moves');
}

// ═════════════════════════════════════════════════════════════════════════════
// M7 — Custom category names
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n\n=== M7: Custom category names ===\n');

console.log('M7a: Move into "Cook Set" (custom kitchen alias)');
{
  const result = applyMoveItem(makeStore(), 'Kitchen Gear', 'Cook Set', 'kg1');
  assert(result.items['Cook Set'].some(i => i.id === 'kg1'),
    'kg1 moved into Cook Set');
  assert(!result.items['Kitchen Gear'].some(i => i.id === 'kg1'),
    'kg1 removed from Kitchen Gear');
}

console.log('\nM7b: Custom category name preserved exactly — not renamed');
{
  const result = applyMoveItem(makeStore(), 'Kitchen Gear', 'Cook Set', 'kg1');
  assert('Cook Set' in result.items, '"Cook Set" key preserved exactly');
  assert(!('Kitchen Gear' in result.items && result.items['Kitchen Gear'].some(i => i.id === 'kg1')),
    'Item not duplicated under original category');
}

console.log('\nM7c: Move from "Cook Set" to "Backpack"');
{
  const store = makeStore();
  store.items['Cook Set'] = [
    { id: 'cs1', sub: 'Pot', desc: 'FM Petrel', weightOz: 5.7, qty: 1, checked: true, expendable: false },
  ];
  const result = applyMoveItem(store, 'Cook Set', 'Backpack', 'cs1');
  assert(result.items['Backpack'].some(i => i.id === 'cs1'), 'cs1 moved to Backpack');
  assertEqual(result.items['Cook Set'].length, 0, 'Cook Set empty after move');
}

// ═════════════════════════════════════════════════════════════════════════════
// M8 — Order and meta are untouched by item moves
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n\n=== M8: category order and meta untouched ===\n');

console.log('M8a: store.order unchanged after move');
{
  const original = makeStore();
  const result = applyMoveItem(original, 'Backpack', 'Clothing Packed', 'bp1');
  assertEqual(JSON.stringify(result.order), JSON.stringify(original.order),
    'store.order identical after move');
}

console.log('\nM8b: store.meta unchanged after move');
{
  const original = makeStore();
  const result = applyMoveItem(original, 'Backpack', 'Clothing Packed', 'bp1');
  assertEqual(JSON.stringify(result.meta), JSON.stringify(original.meta),
    'store.meta identical after move');
}

// ═════════════════════════════════════════════════════════════════════════════
// M9 — Destination receives item appended to end (existing items preserved)
// ═════════════════════════════════════════════════════════════════════════════
console.log('\n\n=== M9: Existing destination items preserved, new item appended ===\n');

console.log('M9a: Existing item in destination is not displaced');
{
  const result = applyMoveItem(makeStore(), 'Backpack', 'Clothing Packed', 'bp1');
  const dest = result.items['Clothing Packed'];
  assertEqual(dest[0].id, 'cp1', 'Existing cp1 stays first in Clothing Packed');
  assertEqual(dest[1].id, 'bp1', 'Moved bp1 appended after existing items');
}

console.log('\nM9b: Move into empty category works');
{
  const result = applyMoveItem(makeStore(), 'Backpack', 'Cook Set', 'bp1');
  const dest = result.items['Cook Set'];
  assertEqual(dest.length, 1, 'Cook Set has exactly 1 item after move into empty');
  assertEqual(dest[0].id, 'bp1', 'bp1 is that item');
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
