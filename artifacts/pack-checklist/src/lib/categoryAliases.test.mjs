/**
 * Tests for the shared category resolver in categoryAliases.ts.
 *
 * Run with:
 *   node artifacts/pack-checklist/src/lib/categoryAliases.test.mjs
 *
 * Uses Node.js built-in test runner (no extra deps).
 * Functions are inlined from categoryAliases.ts (TypeScript stripped) so tests
 * can run without a build step while remaining a faithful copy of production.
 */

// ── Inline production functions (copied verbatim from categoryAliases.ts) ──────

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
  Kitchen:           ['Kitchen', 'Kitchen Gear', 'Kitchen System', 'Cooking',
                      'Cooking System', 'Cook System', 'Cook Gear'],
  Hydration:         ['Hydration', 'Water', 'Water System'],
  Electronics:       ['Electronics', 'Electronics System', 'Electronic Gear'],
  'Clothing Packed': ['Clothing Packed', 'Clothing', 'Clothing System', 'Packed Clothing'],
  'Clothing Worn':   ['Clothing Worn', 'Worn Clothing', 'Worn Items', 'Worn Weight', 'Worn'],
  'Dog Pack':        ['Dog Pack', 'Dog Gear', 'Pet Gear'],
  'Med Kit':         ['Med Kit', 'First Aid', 'First Aid Kit', 'Medical Kit'],
  'Repair Kit':      ['Repair Kit', 'Repair', 'Repair and Tools'],
  Toiletries:        ['Toiletries', 'Hygiene', 'Personal Care', 'Toiletry Kit'],
};

function resolveDestination(destination, categoryOrder) {
  const norm = destination.trim().replace(/\s+/g, ' ');
  if (!norm) return categoryOrder[0] ?? '';

  // 1. Exact match
  if (categoryOrder.includes(norm)) return norm;

  // 2. Case-insensitive / whitespace-normalised match against the live list
  const normLower = normCat(norm);
  const ci = categoryOrder.find(c => normCat(c) === normLower);
  if (ci) return ci;

  // 3. Alias lookup — compare everything case-insensitively
  for (const aliases of Object.values(CATEGORY_ROLE_ALIASES)) {
    if (aliases.some(a => normCat(a) === normLower)) {
      for (const alias of aliases) {
        const match = categoryOrder.find(c => normCat(c) === normCat(alias));
        if (match) return match;
      }
    }
  }

  // No match — return the supplied value so the user can see and correct it.
  return norm;
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
  const ok = actual === expected;
  if (!ok) console.error(`    Expected: ${JSON.stringify(expected)}\n    Got:      ${JSON.stringify(actual)}`);
  assert(ok, message);
}

// ── Standard category order used by alias tests ───────────────────────────────
//
// Simulates a user who has renamed the default tabs to *System / *Gear variants.
const ALIAS_ORDER = [
  'Backpack',
  'Shelter System',   // alias for Shelter
  'Sleep System',     // alias for Sleep
  'Clothing Packed',
  'Kitchen Gear',     // alias for Kitchen
  'Electronics',
  'Toiletries',
  'Med Kit',
  'Repair Kit',
  'Hydration',
  'Clothing Worn',
  'Expendables',      // alias for Consumables
];

// Default category order — no aliases
const DEFAULT_ORDER = [
  'Backpack', 'Shelter', 'Sleep', 'Clothing Packed', 'Kitchen',
  'Electronics', 'Toiletries', 'Med Kit', 'Repair Kit',
  'Hydration', 'Clothing Worn', 'Expendables',
];

// ── A1: Shelter alias resolution ──────────────────────────────────────────────
console.log('\n=== A: Shelter / Sleep / Kitchen alias resolution ===\n');

console.log('A1: "Shelter" resolves to "Shelter System" when Shelter System is in the order');
assertEqual(resolveDestination('Shelter', ALIAS_ORDER), 'Shelter System',
  '"Shelter" → "Shelter System"');

console.log('\nA2: Leading/trailing whitespace is trimmed before matching');
assertEqual(resolveDestination(' shelter ', ALIAS_ORDER), 'Shelter System',
  '" shelter " → "Shelter System" (whitespace-trimmed)');

console.log('\nA3: Case-insensitive matching');
assertEqual(resolveDestination('SHELTER', ALIAS_ORDER), 'Shelter System',
  '"SHELTER" → "Shelter System" (case-insensitive)');
assertEqual(resolveDestination('SHELTEr', ALIAS_ORDER), 'Shelter System',
  '"SHELTEr" → "Shelter System" (case-insensitive)');

console.log('\nA4: Sleep resolves to Sleep System');
assertEqual(resolveDestination('Sleep', ALIAS_ORDER), 'Sleep System',
  '"Sleep" → "Sleep System"');
assertEqual(resolveDestination('SLEEP', ALIAS_ORDER), 'Sleep System',
  '"SLEEP" → "Sleep System" (case-insensitive)');
assertEqual(resolveDestination('sleep system', ALIAS_ORDER), 'Sleep System',
  '"sleep system" → "Sleep System" (case-insensitive exact)');

console.log('\nA5: Kitchen resolves to Kitchen Gear');
assertEqual(resolveDestination('Kitchen', ALIAS_ORDER), 'Kitchen Gear',
  '"Kitchen" → "Kitchen Gear"');
assertEqual(resolveDestination('Kitchen System', ALIAS_ORDER), 'Kitchen Gear',
  '"Kitchen System" → "Kitchen Gear" (alternate alias)');
assertEqual(resolveDestination('KITCHEN', ALIAS_ORDER), 'Kitchen Gear',
  '"KITCHEN" → "Kitchen Gear" (case-insensitive)');

console.log('\nA6: Kitchen Gear remains Kitchen Gear (exact match, no re-aliasing)');
assertEqual(resolveDestination('Kitchen Gear', ALIAS_ORDER), 'Kitchen Gear',
  '"Kitchen Gear" → "Kitchen Gear" (exact match wins)');

console.log('\nA7: Consumables resolves to Expendables when Expendables exists in order');
assertEqual(resolveDestination('Consumables', ALIAS_ORDER), 'Expendables',
  '"Consumables" → "Expendables" (alias match)');

// ── A8: Fuel's destination (Expendables) passes through unchanged ──────────────
console.log('\nA8: Fuel\'s "Expendables" destination passes through unchanged');
assertEqual(resolveDestination('Expendables', ALIAS_ORDER), 'Expendables',
  '"Expendables" → "Expendables" (exact match — Fuel\'s destination is already correct)');

// ── A9: Clothing Packed and Clothing Worn are kept separate ───────────────────
console.log('\nA9: Clothing Packed and Clothing Worn are kept separate');
assertEqual(resolveDestination('Clothing Packed', ALIAS_ORDER), 'Clothing Packed',
  '"Clothing Packed" stays "Clothing Packed" — never routes to "Clothing Worn"');
assertEqual(resolveDestination('Clothing Worn', ALIAS_ORDER), 'Clothing Worn',
  '"Clothing Worn" stays "Clothing Worn" — never routes to "Clothing Packed"');
assert(
  resolveDestination('Clothing Packed', ALIAS_ORDER) !== resolveDestination('Clothing Worn', ALIAS_ORDER),
  'Clothing Packed and Clothing Worn resolve to different categories',
);

// ── A10: Unknown category does not silently become Backpack ───────────────────
console.log('\nA10: Unknown category does not silently become Backpack');
const unknownResult = resolveDestination('Completely Unknown Tab', ALIAS_ORDER);
assert(unknownResult !== 'Backpack', '"Completely Unknown Tab" must not silently become "Backpack"');
assertEqual(unknownResult, 'Completely Unknown Tab',
  '"Completely Unknown Tab" → returned as-is so the UI can flag it');

// ── B: Default order (no aliases) ────────────────────────────────────────────
console.log('\n\n=== B: resolveDestination with default order (no aliases) ===\n');

console.log('B1: Exact-match categories pass through unchanged in default order');
for (const cat of ['Backpack', 'Shelter', 'Sleep', 'Kitchen', 'Electronics', 'Hydration']) {
  assertEqual(resolveDestination(cat, DEFAULT_ORDER), cat, `"${cat}" → "${cat}" (exact)`);
}

console.log('\nB2: Expendables resolves correctly in default order');
// DEFAULT_ORDER uses "Expendables" (not "Consumables") — they are aliases,
// so resolveDestination("Consumables", DEFAULT_ORDER) → "Expendables".
assertEqual(resolveDestination('Consumables', DEFAULT_ORDER), 'Expendables',
  '"Consumables" → "Expendables" (DEFAULT_ORDER contains Expendables, the alias)');
// When neither Consumables nor Expendables is in the order, the value is returned as-is.
const noExpendablesOrder = DEFAULT_ORDER.filter(c => c !== 'Expendables' && c !== 'Consumables');
const unknownConsumables = resolveDestination('Consumables', noExpendablesOrder);
assert(unknownConsumables === 'Consumables',
  '"Consumables" returned as-is when no Consumables/Expendables alias is in the order');

// ── C: Edge cases ─────────────────────────────────────────────────────────────
console.log('\n\n=== C: Edge cases ===\n');

console.log('C1: Empty string returns first category in order');
assertEqual(resolveDestination('', ALIAS_ORDER), 'Backpack',
  'Empty string → first category (Backpack)');
assertEqual(resolveDestination('   ', ALIAS_ORDER), 'Backpack',
  'Whitespace-only → first category (Backpack)');

console.log('\nC2: Alias matching is whitespace-collapsed (internal spaces)');
assertEqual(resolveDestination('Shelter  System', ALIAS_ORDER), 'Shelter System',
  '"Shelter  System" (double space) → "Shelter System"');

console.log('\nC3: All Shelter alias variants resolve to Shelter System');
for (const alias of ['Shelter System', 'Tent System', 'Tarp System', 'Hammock System', 'Camp Shelter']) {
  assertEqual(resolveDestination(alias, ALIAS_ORDER), 'Shelter System',
    `"${alias}" → "Shelter System"`);
}

console.log('\nC4: All Sleep alias variants resolve to Sleep System');
for (const alias of ['Sleep System', 'Sleeping System', 'Sleeping Gear', 'Sleep Gear', 'Bedding']) {
  assertEqual(resolveDestination(alias, ALIAS_ORDER), 'Sleep System',
    `"${alias}" → "Sleep System"`);
}

console.log('\nC5: All Kitchen alias variants resolve to Kitchen Gear');
for (const alias of ['Kitchen', 'Kitchen Gear', 'Kitchen System', 'Cooking', 'Cooking System', 'Cook System']) {
  assertEqual(resolveDestination(alias, ALIAS_ORDER), 'Kitchen Gear',
    `"${alias}" → "Kitchen Gear"`);
}

console.log('\nC6: Non-empty unknown destination never falls back to categoryOrder[0]');
const result = resolveDestination('My Custom Gear Tab', ALIAS_ORDER);
assert(result !== ALIAS_ORDER[0], '"My Custom Gear Tab" must not silently become first category');
assertEqual(result, 'My Custom Gear Tab', '"My Custom Gear Tab" returned as-is');

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(48)}`);
console.log(`Tests: ${passed + failed}  Passed: ${passed}  Failed: ${failed}`);
if (failed > 0) {
  console.error('\n❌ Some tests failed.');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed.');
}
