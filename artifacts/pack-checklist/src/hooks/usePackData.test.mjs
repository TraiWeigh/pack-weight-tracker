/**
 * Tests for the duplicate-category migration in usePackData.ts.
 *
 * Run with:
 *   node artifacts/pack-checklist/src/hooks/usePackData.test.mjs
 *
 * Uses Node.js built-in test runner (no extra deps).
 * Functions are inlined from usePackData.ts and categoryAliases.ts so tests
 * can run without a build step.
 */

// ── Inline from categoryAliases.ts ───────────────────────────────────────────

function normCat(s) {
  return s.trim().replace(/\s+/g, ' ').toLowerCase();
}

const CATEGORY_ROLE_ALIASES = {
  Shelter:           ['Shelter', 'Shelter System', 'Tent System', 'Tarp System',
                      'Hammock System', 'Camp Shelter'],
  Sleep:             ['Sleep', 'Sleep System', 'Sleeping System', 'Sleeping Gear',
                      'Sleep Gear', 'Bedding'],
  Consumables:       ['Consumables', 'Expendables', 'Consumable Weight', 'Expendable Weight',
                      'Trip Consumables', 'Used Up Items', 'Used-Up Items', 'Perishables',
                      'Food and Fuel', 'Consumable', 'Expendable'],
  Backpack:          ['Backpack', 'Pack'],
  Kitchen:           ['Kitchen', 'Kitchen Gear', 'Kitchen System', 'Kitchen Kit',
                      'Cooking', 'Cooking System', 'Cooking Set',
                      'Cook System', 'Cook Set', 'Cookset', 'Cook Kit', 'Cook Gear',
                      'Camp Kitchen'],
  Hydration:         ['Hydration', 'Water', 'Water System'],
  Electronics:       ['Electronics', 'Electronics System', 'Electronic Gear'],
  'Clothing Packed': ['Clothing Packed', 'Clothing', 'Clothing System', 'Packed Clothing'],
  'Clothing Worn':   ['Clothing Worn', 'Worn Clothing', 'Worn Items', 'Worn Weight', 'Worn'],
  'Dog Pack':        ['Dog Pack', 'Dog Gear', 'Pet Gear'],
  'Med Kit':         ['Med Kit', 'First Aid', 'First Aid Kit', 'Medical Kit'],
  'Repair Kit':      ['Repair Kit', 'Repair', 'Repair and Tools'],
  Toiletries:        ['Toiletries', 'Hygiene', 'Personal Care', 'Toiletry Kit'],
};

// ── Inline from usePackData.ts ────────────────────────────────────────────────

const DEFAULT_CATEGORY_ORDER = [
  'Backpack', 'Shelter', 'Sleep', 'Clothing Packed', 'Kitchen',
  'Electronics', 'Toiletries', 'Med Kit', 'Repair Kit', 'Hydration',
  'Clothing Worn', 'Dog Pack', 'Expendables',
];

function deduplicateCategoryAliases(stored) {
  let { items, order, meta } = stored;

  for (const aliases of Object.values(CATEGORY_ROLE_ALIASES)) {
    const matches = order.filter(o => aliases.some(a => normCat(a) === normCat(o)));
    if (matches.length < 2) continue;

    const nonDefaults = matches.filter(m => !DEFAULT_CATEGORY_ORDER.includes(m));
    const target  = nonDefaults.length > 0 ? nonDefaults[0] : matches[0];
    const sources = matches.filter(m => m !== target);

    const mergedItems = [
      ...(items[target] || []),
      ...sources.flatMap(src => items[src] || []),
    ];

    const newItems = {};
    for (const [k, v] of Object.entries(items)) {
      if (sources.includes(k)) continue;
      newItems[k] = k === target ? mergedItems : v;
    }

    const newMeta = {};
    for (const [k, v] of Object.entries(meta)) {
      if (!sources.includes(k)) newMeta[k] = v;
    }

    order = order.filter(o => !sources.includes(o));
    items = newItems;
    meta  = newMeta;
  }

  return { items, order, meta };
}

function mergeDefaultCategories(storedOrder) {
  let order = [...storedOrder];
  for (let di = 0; di < DEFAULT_CATEGORY_ORDER.length; di++) {
    const cat = DEFAULT_CATEGORY_ORDER[di];
    if (order.includes(cat)) continue;

    const catNorm    = normCat(cat);
    const aliasGroup = Object.values(CATEGORY_ROLE_ALIASES).find(aliases =>
      aliases.some(a => normCat(a) === catNorm)
    );
    if (aliasGroup?.some(a => order.some(o => normCat(o) === normCat(a)))) continue;

    let insertAt = order.length;

    for (let pi = di - 1; pi >= 0; pi--) {
      const idx = order.indexOf(DEFAULT_CATEGORY_ORDER[pi]);
      if (idx !== -1) { insertAt = idx + 1; break; }
    }
    for (let si = di + 1; si < DEFAULT_CATEGORY_ORDER.length; si++) {
      const idx = order.indexOf(DEFAULT_CATEGORY_ORDER[si]);
      if (idx !== -1 && idx < insertAt) { insertAt = idx; break; }
    }

    order = [...order.slice(0, insertAt), cat, ...order.slice(insertAt)];
  }
  return order;
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

// ── Fixture: stored data with all three duplicate pairs ───────────────────────
//
// Simulates what a user's localStorage looks like after the old importer
// created 'Shelter', 'Sleep', and 'Kitchen' tabs alongside their existing
// 'Shelter System', 'Sleep System', and 'Kitchen Gear' tabs.

function makeFixture() {
  return {
    order: [
      'Backpack',
      'Shelter',         // DEFAULT — duplicate of 'Shelter System'
      'Shelter System',  // user's preferred name
      'Sleep',           // DEFAULT — duplicate of 'Sleep System'
      'Sleep System',    // user's preferred name
      'Clothing Packed',
      'Kitchen',         // DEFAULT — duplicate of 'Kitchen Gear'
      'Kitchen Gear',    // user's preferred name
      'Electronics',
      'Hydration',
    ],
    items: {
      'Backpack':       [{ id: 'b1', sub: 'Backpack',     desc: 'ULA Circuit',      weightOz: 40.8, qty: 1, checked: false, expendable: false }],
      'Shelter':        [{ id: 's1', sub: 'Tent',         desc: 'Zpacks Duplex',    weightOz: 32,   qty: 1, checked: true,  expendable: false }],
      'Shelter System': [{ id: 's2', sub: 'Tent Stakes',  desc: 'Ti Shep Hooks',    weightOz: 0.6,  qty: 6, checked: false, expendable: false }],
      'Sleep':          [{ id: 'sl1', sub: 'Sleeping Bag', desc: 'UGQ Bandit 10F', weightOz: 26,   qty: 1, checked: false, expendable: false }],
      'Sleep System':   [{ id: 'sl2', sub: 'Sleeping Pad', desc: 'NeoAir XLite',  weightOz: 12,   qty: 1, checked: false, expendable: false }],
      'Clothing Packed':[{ id: 'c1', sub: 'Rain Jacket',  desc: 'OR Helium',        weightOz: 9.5,  qty: 1, checked: false, expendable: false }],
      'Kitchen':        [{ id: 'k1', sub: 'Fuel',         desc: '4 oz canister',    weightOz: 7.68, qty: 1, checked: false, expendable: true  }],
      'Kitchen Gear':   [{ id: 'k2', sub: 'Pot/Mug',      desc: 'FM Petrel G3',     weightOz: 5.7,  qty: 1, checked: false, expendable: false }],
      'Electronics':    [],
      'Hydration':      [],
    },
    meta: {
      'Backpack':        { countsToBase: true },
      'Shelter':         { countsToBase: true },
      'Shelter System':  { countsToBase: true },
      'Sleep':           { countsToBase: true },
      'Sleep System':    { countsToBase: true },
      'Clothing Packed': { countsToBase: true },
      'Kitchen':         { countsToBase: true },
      'Kitchen Gear':    { countsToBase: true },
      'Electronics':     { countsToBase: true },
      'Hydration':       { countsToBase: true },
    },
  };
}

// ── D1: Items move into preferred category ─────────────────────────────────────
console.log('\n=== D: deduplicateCategoryAliases ===\n');

console.log('D1: Items from Shelter move into Shelter System');
{
  const result = deduplicateCategoryAliases(makeFixture());
  const shelterItems = result.items['Shelter System'];
  const hasTent       = shelterItems?.some(i => i.id === 's1');
  const hasStakes     = shelterItems?.some(i => i.id === 's2');
  assert(hasTent,   'Tent (from Shelter) merged into Shelter System');
  assert(hasStakes, 'Tent Stakes (already in Shelter System) preserved in Shelter System');
}

console.log('\nD2: Items from Sleep move into Sleep System');
{
  const result = deduplicateCategoryAliases(makeFixture());
  const sleepItems = result.items['Sleep System'];
  const hasSleepingBag = sleepItems?.some(i => i.id === 'sl1');
  const hasSleepingPad = sleepItems?.some(i => i.id === 'sl2');
  assert(hasSleepingBag, 'Sleeping Bag (from Sleep) merged into Sleep System');
  assert(hasSleepingPad, 'Sleeping Pad (already in Sleep System) preserved');
}

console.log('\nD3: Items from Kitchen move into Kitchen Gear');
{
  const result = deduplicateCategoryAliases(makeFixture());
  const kitchenItems = result.items['Kitchen Gear'];
  const hasFuel   = kitchenItems?.some(i => i.id === 'k1');
  const hasPot    = kitchenItems?.some(i => i.id === 'k2');
  assert(hasFuel, 'Fuel (from Kitchen) merged into Kitchen Gear');
  assert(hasPot,  'Pot/Mug (already in Kitchen Gear) preserved');
}

// ── D4: Complete item objects preserved ───────────────────────────────────────
console.log('\nD4: Complete item objects preserved — all fields intact');
{
  const result = deduplicateCategoryAliases(makeFixture());
  const shelterItems = result.items['Shelter System'];
  const tent = shelterItems?.find(i => i.id === 's1');
  assert(!!tent,                           'Tent item is present');
  assertEqual(tent?.id,        's1',       'id preserved');
  assertEqual(tent?.sub,       'Tent',     'sub (Type) preserved');
  assertEqual(tent?.desc,      'Zpacks Duplex', 'desc (Description) preserved');
  assertEqual(tent?.weightOz,  32,         'weightOz (Weight) preserved');
  assertEqual(tent?.qty,       1,          'qty (Quantity) preserved');
  assertEqual(tent?.checked,   true,       'checked (Checked state) preserved');
  assertEqual(tent?.expendable,false,      'expendable (Expendable state) preserved');

  // Fuel (expendable=true) is preserved from Kitchen → Kitchen Gear
  const kitchenItems = result.items['Kitchen Gear'];
  const fuel = kitchenItems?.find(i => i.id === 'k1');
  assert(!!fuel,                           'Fuel item is present in Kitchen Gear');
  assertEqual(fuel?.expendable, true,      'expendable=true preserved on Fuel');
}

// ── D5: Existing items in preferred categories remain ─────────────────────────
console.log('\nD5: Existing items in preferred categories remain intact');
{
  const result = deduplicateCategoryAliases(makeFixture());

  // Tent Stakes were already in Shelter System — check they're still first (existing items first)
  const shelterItems = result.items['Shelter System'];
  assertEqual(shelterItems?.[0]?.id, 's2', 'Existing Tent Stakes item comes first in merged list');
  assertEqual(shelterItems?.[1]?.id, 's1', 'Imported Tent item appended after existing items');

  // Sleeping Pad already in Sleep System — check order
  const sleepItems = result.items['Sleep System'];
  assertEqual(sleepItems?.[0]?.id, 'sl2', 'Existing Sleeping Pad comes first');
  assertEqual(sleepItems?.[1]?.id, 'sl1', 'Imported Sleeping Bag appended after');

  // Non-duplicated category (Clothing Packed) is untouched
  const clothingItems = result.items['Clothing Packed'];
  assertEqual(clothingItems?.length, 1, 'Clothing Packed item count unchanged');
  assertEqual(clothingItems?.[0]?.id, 'c1', 'Clothing Packed item intact');
}

// ── D6: Duplicate source categories are removed from order ────────────────────
console.log('\nD6: Duplicate source categories removed from order');
{
  const result = deduplicateCategoryAliases(makeFixture());
  assert(!result.order.includes('Shelter'), '"Shelter" removed from order');
  assert(!result.order.includes('Sleep'),   '"Sleep" removed from order');
  assert(!result.order.includes('Kitchen'), '"Kitchen" removed from order');
}

// ── D7: Preferred categories remain in existing positions ─────────────────────
console.log('\nD7: Preferred categories remain in their existing positions');
{
  const result = deduplicateCategoryAliases(makeFixture());
  const ssIdx = result.order.indexOf('Shelter System');
  const slsIdx = result.order.indexOf('Sleep System');
  const kgIdx  = result.order.indexOf('Kitchen Gear');
  const bpIdx  = result.order.indexOf('Backpack');
  const elIdx  = result.order.indexOf('Electronics');

  assert(ssIdx > bpIdx,  'Shelter System remains after Backpack');
  assert(slsIdx > ssIdx, 'Sleep System remains after Shelter System');
  assert(kgIdx > slsIdx, 'Kitchen Gear remains after Sleep System');
  assert(elIdx > kgIdx,  'Electronics remains after Kitchen Gear');
  assert(result.order.includes('Shelter System'), 'Shelter System still in order');
  assert(result.order.includes('Sleep System'),   'Sleep System still in order');
  assert(result.order.includes('Kitchen Gear'),   'Kitchen Gear still in order');
}

// ── D8: Source categories removed from items and meta ────────────────────────
console.log('\nD8: Source categories removed from items and meta');
{
  const result = deduplicateCategoryAliases(makeFixture());
  assert(!('Shelter' in result.items), '"Shelter" removed from items');
  assert(!('Sleep'   in result.items), '"Sleep" removed from items');
  assert(!('Kitchen' in result.items), '"Kitchen" removed from items');
  assert(!('Shelter' in result.meta),  '"Shelter" removed from meta');
  assert(!('Sleep'   in result.meta),  '"Sleep" removed from meta');
  assert(!('Kitchen' in result.meta),  '"Kitchen" removed from meta');
}

// ── D9: Idempotent — second run makes no changes ──────────────────────────────
console.log('\nD9: Running migration a second time makes no additional changes');
{
  const first  = deduplicateCategoryAliases(makeFixture());
  const second = deduplicateCategoryAliases(first);
  assertEqual(JSON.stringify(second.order), JSON.stringify(first.order),
    'Order unchanged on second run');
  assertEqual(JSON.stringify(second.items), JSON.stringify(first.items),
    'Items unchanged on second run');
}

// ── E: mergeDefaultCategories — alias-aware ───────────────────────────────────
console.log('\n\n=== E: mergeDefaultCategories (alias-aware) ===\n');

console.log('E1: Shelter is NOT inserted when Shelter System is already present');
{
  const order = ['Backpack', 'Shelter System', 'Sleep System', 'Kitchen Gear', 'Electronics'];
  const result = mergeDefaultCategories(order);
  assert(!result.includes('Shelter'), '"Shelter" not inserted — Shelter System alias exists');
  assert(result.includes('Shelter System'), '"Shelter System" preserved in order');
}

console.log('\nE2: Sleep is NOT inserted when Sleep System is already present');
{
  const order = ['Backpack', 'Shelter System', 'Sleep System', 'Kitchen Gear', 'Electronics'];
  const result = mergeDefaultCategories(order);
  assert(!result.includes('Sleep'), '"Sleep" not inserted — Sleep System alias exists');
}

console.log('\nE3: Kitchen is NOT inserted when Kitchen Gear is already present');
{
  const order = ['Backpack', 'Shelter System', 'Sleep System', 'Kitchen Gear', 'Electronics'];
  const result = mergeDefaultCategories(order);
  assert(!result.includes('Kitchen'), '"Kitchen" not inserted — Kitchen Gear alias exists');
}

console.log('\nE4: Missing defaults without aliases ARE inserted');
{
  // Electronics and Hydration are missing — they have no alias in the user's order
  const order = ['Backpack', 'Shelter System', 'Sleep System', 'Clothing Packed', 'Kitchen Gear'];
  const result = mergeDefaultCategories(order);
  assert(result.includes('Electronics'), '"Electronics" inserted (no alias present)');
  assert(result.includes('Hydration'),   '"Hydration" inserted (no alias present)');
}

console.log('\nE3b: Kitchen is NOT inserted when Cook Set is already present');
{
  const order = ['Backpack', 'Shelter System', 'Sleep System', 'Cook Set', 'Electronics'];
  const result = mergeDefaultCategories(order);
  assert(!result.includes('Kitchen'),   '"Kitchen" not inserted — Cook Set alias exists');
  assert(result.includes('Cook Set'),   '"Cook Set" preserved in order');
}

console.log('\nE3c: Kitchen is NOT inserted when Cookset is already present');
{
  const order = ['Backpack', 'Shelter', 'Sleep', 'Cookset', 'Electronics'];
  const result = mergeDefaultCategories(order);
  assert(!result.includes('Kitchen'),   '"Kitchen" not inserted — Cookset alias exists');
  assert(result.includes('Cookset'),    '"Cookset" preserved in order');
}

console.log('\nE3d: Kitchen is NOT inserted when Camp Kitchen is already present');
{
  const order = ['Backpack', 'Shelter', 'Sleep', 'Camp Kitchen', 'Electronics'];
  const result = mergeDefaultCategories(order);
  assert(!result.includes('Kitchen'),   '"Kitchen" not inserted — Camp Kitchen alias exists');
  assert(result.includes('Camp Kitchen'), '"Camp Kitchen" preserved in order');
}

console.log('\nE3e: Kitchen is NOT inserted when Cook Kit is already present');
{
  const order = ['Backpack', 'Shelter', 'Sleep', 'Cook Kit', 'Electronics'];
  const result = mergeDefaultCategories(order);
  assert(!result.includes('Kitchen'),   '"Kitchen" not inserted — Cook Kit alias exists');
  assert(result.includes('Cook Kit'),   '"Cook Kit" preserved in order');
}

console.log('\nE3f: User-named categories are never renamed by migration');
{
  const order = ['Backpack', 'Cook Set', 'Electronics'];
  const result = mergeDefaultCategories(order);
  assert(result.includes('Cook Set'),   '"Cook Set" spelling preserved exactly');
  assert(!result.includes('Kitchen'),   '"Kitchen" not added');
  assert(!result.includes('Kitchen Gear'), '"Kitchen Gear" not added');
}

console.log('\nE5: Combined pipeline — dedup then mergeDefault produces clean order');
{
  const fixture = makeFixture();
  const deduped = deduplicateCategoryAliases(fixture);
  const merged  = mergeDefaultCategories(deduped.order);

  // Aliases survive
  assert(merged.includes('Shelter System'), '"Shelter System" in final order');
  assert(merged.includes('Sleep System'),   '"Sleep System" in final order');
  assert(merged.includes('Kitchen Gear'),   '"Kitchen Gear" in final order');

  // DEFAULT names not reinserted
  assert(!merged.includes('Shelter'), '"Shelter" NOT re-inserted after dedup');
  assert(!merged.includes('Sleep'),   '"Sleep" NOT re-inserted after dedup');
  assert(!merged.includes('Kitchen'), '"Kitchen" NOT re-inserted after dedup');

  // No duplicate categories at all
  const unique = new Set(merged);
  assertEqual(unique.size, merged.length, 'No duplicate category names in final order');
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
