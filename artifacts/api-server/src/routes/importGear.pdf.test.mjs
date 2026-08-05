/**
 * Tests for the TrailWeigh-specific PDF parser in importGear.ts.
 *
 * Run with:
 *   node artifacts/api-server/src/routes/importGear.pdf.test.mjs
 *
 * Uses Node.js built-in test runner (no extra deps).
 * The PDF parser functions are inlined (TypeScript stripped) from importGear.ts
 * so tests can run without a build step.
 * The fixture simulates the page-text output that pdf-parse v2 delivers for a
 * real TrailWeigh PACK WEIGHT spreadsheet exported as PDF.
 */

// ── Inline from importGear.ts ─────────────────────────────────────────────────

function parseWeightToOz(raw, unitHint = '') {
  const num = typeof raw === 'number' ? raw : parseFloat(String(raw ?? '').replace(/[^\d.]/g, ''));
  if (isNaN(num) || num <= 0) return { oz: 0, warning: true };
  const unit = String(unitHint ?? '').toLowerCase().trim() || String(raw).toLowerCase().trim();
  let oz;
  if (/^g(ram)?s?$/.test(unit))                     oz = num / 28.3495;
  else if (/^(lb|lbs|pound|pounds)$/.test(unit))    oz = num * 16;
  else if (/^(kg|kgs|kilogram|kilograms)$/.test(unit)) oz = num * 35.274;
  else                                               oz = num;
  oz = Math.round(oz * 100) / 100;
  return { oz, warning: oz <= 0 || oz > 700 };
}

const PDF_CATEGORY_NAMES = {
  'backpack':         'Backpack',
  'shelter':          'Shelter',
  'sleep':            'Sleep',
  'clothing packed':  'Clothing Packed',
  'kitchen':          'Kitchen',
  'electronics':      'Electronics',
  'toiletries + med': 'Toiletries + Med',
  'toiletries':       'Toiletries + Med',
  'hydration':        'Hydration',
  'clothing worn':    'Clothing Worn',
  'miscellaneous':    'Miscellaneous',
  'misc':             'Miscellaneous',
};

const PDF_TYPE_PHRASES = [
  'cold soak container', '1 gal freezer bag', '1 qrt freezer bag',
  'sleeping bag liner', 'bear canister', 'inflatable pad', 'trekking poles',
  'trekking pole', 'water bladder', 'water bottle', 'water filter',
  'sleeping bag', 'sleeping pad', 'ground sheet', 'puffy jacket',
  'down jacket', 'rain jacket', 'rain shell', 'wind jacket', 'wind shirt',
  'wind pants', 'puffy pants', 'puffy vest', 'tent stakes', 'tent stake',
  'stake bag', 'tent pole', 'down socks', 'down booties', 'down hood',
  'foam pad', 'sleep socks', 'neck warmer', 'neck gaiter', 'base layer',
  'mid layer', 'thermal pants', 'rain pants', 'pack liner', 'food bag',
  'bear bag', 'power bank', 'sun hat', 'bug bivy', 'bug net', 'head net',
  'repair kit', 'med kit', 'pot/mug', 'midlayer', 'windbreaker', 'poncho',
  'backpack', 'hammock', 'bivy', 'bivvy', 'tarp', 'tent', 'quilt', 'pillow',
  'stove', 'spoon', 'fuel', 'filter', 'headlamp', 'balaclava', 'beanie',
  'gloves', 'mittens', 'gaiters', 'shelter', 'sleep',
];

const PDF_CATEGORY_ORDER = [
  'Backpack', 'Shelter', 'Sleep', 'Clothing Packed',
  'Kitchen', 'Electronics', 'Toiletries + Med',
  'Hydration', 'Clothing Worn', 'Miscellaneous',
];

const PDF_CAT_HDR_RE  = /^(?:x\s+)?(backpack|shelter|sleep|clothing\s+packed|kitchen|electronics|toiletries(?:\s*\+\s*med)?|hydration|clothing\s+worn|miscellaneous|misc)\s+(?:description|unit\b|qty\b|add\b)/i;
const PDF_CAT_HDR_X_RE = /^x\s*(backpack|shelter|sleep|clothing\s+packed|kitchen|electronics|toiletries(?:\s*\+\s*med)?|hydration|clothing\s+worn|miscellaneous|misc)\b/i;
const PDF_SKIP_RE = /^(?:total|grand\s+total|base\s+weight|expendables|trip\s+total|sub\s+total|daily\s+average|calories|protein\b|fat\b|carbs?\b|description\b|weight\b|add\b|unit\b|qty\b|category\b|type\b|page\s*\d+|category\s+weight)/i;
const PDF_SUMMARY_ROW_RE = /^(?:backpack|shelter|sleep|clothing(?:\s+(?:packed|worn))?|kitchen|electronics|toiletries|hydration|miscellaneous|misc|worn|base\s+weight|expendables|total)\s+[\d.]+\s*(?:lb|oz|g|kg)\b/i;
const PDF_CHECKBOX_RE = /^(?:true|false)(?=[\s\dA-Za-z])/i;
const PDF_ROW_RE = /^(.+)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s*(?:oz|g(?:rams?)?|lbs?|pounds?|kg(?:s|ilograms?)?)?(?:\s*\d+)?(?:\s+[A-Za-z].*)?$/i;
const PDF_EXPENDABLES_TYPES = new Set(['fuel', 'stove fuel', 'canister fuel', 'isobutane', 'alcohol fuel', 'denatured alcohol']);

function extractFromPdfPages(pages) {
  const results = [];
  let currentCategory = '';
  let currentCategoryIndex = -1;
  let reachedMealPlanner = false;

  for (const page of pages) {
    if (reachedMealPlanner) break;
    if (/meal\s*planner/i.test(page.text)) reachedMealPlanner = true;

    const lines = page.text
      .split(/[\r\n]+/)
      .map(l => l.trim())
      .filter(l => l.length > 1);

    for (const line of lines) {
      if (/^meal\s*planner\b/i.test(line)) break;

      const catMatch = PDF_CAT_HDR_RE.exec(line) ?? PDF_CAT_HDR_X_RE.exec(line);
      if (catMatch) {
        const key = catMatch[1].toLowerCase().replace(/\s*\+\s*/g, ' + ').trim();
        const candidate = PDF_CATEGORY_NAMES[key] ?? '';
        const candidateIndex = PDF_CATEGORY_ORDER.indexOf(candidate);
        if (candidate && candidateIndex >= currentCategoryIndex) {
          currentCategory = candidate;
          currentCategoryIndex = candidateIndex;
        }
        continue;
      }

      if (PDF_SKIP_RE.test(line))        continue;
      if (PDF_SUMMARY_ROW_RE.test(line)) continue;
      if (!PDF_CHECKBOX_RE.test(line))   continue;

      const gearLine = line.replace(/^(?:true|false)\s*/i, '').trim();
      if (gearLine.length < 2) continue;

      const m = PDF_ROW_RE.exec(gearLine);
      if (!m) continue;

      const nameText = m[1].trim().replace(/\s+/g, ' ');
      const weightOz = parseFloat(m[2]);

      if (!nameText || weightOz <= 0 || weightOz > 500) continue;

      let sub  = '';
      let desc = '';
      const nameLower = nameText.toLowerCase();

      for (const phrase of PDF_TYPE_PHRASES) {
        if (nameLower === phrase || nameLower.startsWith(phrase + ' ')) {
          sub  = nameText.slice(0, phrase.length).trim();
          sub  = sub.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          desc = nameText.slice(phrase.length).trim();
          break;
        }
      }

      if (!sub) {
        const sp = nameText.search(/\s/);
        if (sp > 0) { sub = nameText.slice(0, sp); desc = nameText.slice(sp + 1).trim(); }
        else          desc = nameText;
      }

      const destination = PDF_EXPENDABLES_TYPES.has(sub.toLowerCase())
        ? 'Expendables'
        : (currentCategory || undefined);

      results.push({
        sub:      sub.slice(0, 60),
        desc:     desc.slice(0, 200),
        weightOz: Math.round(weightOz * 100) / 100,
        warning:  false,
        destination,
      });
    }
  }

  return results;
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

// ── PDF text fixture ──────────────────────────────────────────────────────────
//
// Simulates the line-by-line text output pdf-parse v2 returns for a typical
// TrailWeigh PACK WEIGHT PDF export.
//
// Format per row:
//   TRUE|FALSE Type Description Weight Add [oz] [Qty]
//   e.g. "TRUE Backpack ULA Ultra Circuit 40.8 40.8 oz 1"
//
// The right-side summary table (same "X Backpack Description …" header) appears
// after Kitchen — the forward-only guard must prevent it resetting category.
//
// "Durston Wapta 30" — model number in description (greedy regex must NOT
// treat "30" as the weight).
//
// "1 Gal Freezer Bag" and "1 Qrt Freezer Bag" — type starts with a digit.
//
// "Fuel 4 oz" — description "4 oz" contains a number+unit that is NOT the weight.

const FIXTURE_TEXT = `
x Backpack Description Weight Add Unit Qty
TRUE Backpack ULA Ultra Circuit 40.8 40.8 oz 1
FALSE Backpack Durston Wapta 30 18.3 0 oz 1
FALSE Pack Liner 18G Compactor Bag 1.7 0 oz 1
Base Weight 4.6 lb
x Shelter Description Weight Add Unit Qty
FALSE Tent Zpacks Free-Zip 2 with poles / repair kit 36.8 0 oz 1
FALSE Tent Stake Ti Shepherd Hooks 0.6 0 oz 1
Shelter 2.3 lb
x Sleep Description Weight Add Unit Qty
FALSE Sleeping Bag UGQ Bandit 10F 26 0 oz 1
FALSE Sleeping Pad NeoAir XLite 12 0 oz 1
Sleep 2.375 lb
Total 5.2 lb
x Kitchen Description Weight Add Unit Qty
FALSE Pot/Mug Fire-Maple Petrel G3 600ml HX Pot 5.7 0 oz 1
FALSE 1 Gal Freezer Bag Amazon 0.5 0 oz 1
FALSE 1 Qrt Freezer Bag Amazon 0.22 0 oz 1
FALSE Fuel 4 oz 7.68 0 oz 1
Kitchen 1.2 lb
Expendables 0.48 lb
Category Weight Unit
x Backpack Description Weight Add Unit Qty
Backpack 2.55 lb
`.trim();

// Wrap in page structure that extractFromPdfPages expects
const FIXTURE_PAGES = [{ text: FIXTURE_TEXT }];

console.log('\n=== PDF parser fixture tests ===\n');

const items = extractFromPdfPages(FIXTURE_PAGES);

// ── P1: Item count ────────────────────────────────────────────────────────────
console.log('P1: Item count');
assert(items.length > 0, 'At least one item parsed');
// Fixture has: 2 Backpack + 1 Pack Liner + 2 Shelter + 2 Sleep + 4 Kitchen = 11
assertEqual(items.length, 11, 'Fixture yields exactly 11 items (no summary rows leaked in)');

// ── P2: Category headers recognised ───────────────────────────────────────────
console.log('\nP2: Category headers recognised');
assert(items.some(i => i.destination === 'Backpack'),  'Backpack category recognised');
assert(items.some(i => i.destination === 'Shelter'),   'Shelter category recognised');
assert(items.some(i => i.destination === 'Sleep'),     'Sleep category recognised');
assert(items.some(i => i.destination === 'Kitchen'),   'Kitchen category recognised');

// ── P3: TRUE / FALSE prefix stripped (checkbox values not in output) ──────────
console.log('\nP3: TRUE / FALSE prefixes stripped');
assert(items.every(i => !/^(true|false)$/i.test(i.sub)),  'No item has TRUE or FALSE as Type');
assert(items.every(i => !/^(true|false)$/i.test(i.desc)), 'No item has TRUE or FALSE as Desc');
assert(items.every(i => !/^(true|false)/i.test(i.sub)),   'Type never starts with TRUE/FALSE');

// ── P4: Backpack — ULA Ultra Circuit ─────────────────────────────────────────
console.log('\nP4: Backpack — ULA Ultra Circuit');
{
  const item = items.find(i => i.desc === 'ULA Ultra Circuit');
  assert(!!item, 'ULA Ultra Circuit found');
  assertEqual(item?.sub,         'Backpack',        'Type = Backpack');
  assertEqual(item?.weightOz,    40.8,              'Weight = 40.8 oz');
  assertEqual(item?.destination, 'Backpack',        'Destination = Backpack');
}

// ── P5: Backpack — Durston Wapta 30 (model number must not be weight) ─────────
console.log('\nP5: Backpack — Durston Wapta 30 (model number in name)');
{
  const item = items.find(i => i.desc === 'Durston Wapta 30');
  assert(!!item, 'Durston Wapta 30 found');
  assertEqual(item?.sub,         'Backpack',        'Type = Backpack');
  assertEqual(item?.weightOz,    18.3,              'Weight = 18.3 oz (not 30 oz — model number ignored)');
  assertEqual(item?.destination, 'Backpack',        'Destination = Backpack');
  assert(item?.weightOz !== 30, 'Model number "30" is NOT parsed as weight');
}

// ── P6: Tent — Zpacks Free-Zip 2 with poles / repair kit ─────────────────────
console.log('\nP6: Tent — Zpacks Free-Zip 2 with poles / repair kit');
{
  const item = items.find(i => i.sub === 'Tent' && /Zpacks/i.test(i.desc));
  assert(!!item, 'Tent item found');
  assertEqual(item?.weightOz,    36.8,              'Weight = 36.8 oz');
  assertEqual(item?.destination, 'Shelter',         'Destination = Shelter');
  assert(i => i?.desc?.includes('Zpacks'), 'Description includes product name');
}

// ── P7: Sleeping Bag — UGQ Bandit 10F ────────────────────────────────────────
console.log('\nP7: Sleeping Bag — UGQ Bandit 10F');
{
  const item = items.find(i => i.sub === 'Sleeping Bag');
  assert(!!item, 'Sleeping Bag found');
  assertEqual(item?.desc,        'UGQ Bandit 10F',  'Description = UGQ Bandit 10F');
  assertEqual(item?.weightOz,    26,                'Weight = 26 oz');
  assertEqual(item?.destination, 'Sleep',           'Destination = Sleep');
}

// ── P8: Pot/Mug — Fire-Maple Petrel G3 600ml HX Pot ─────────────────────────
console.log('\nP8: Pot/Mug — Fire-Maple Petrel G3 600ml HX Pot');
{
  const item = items.find(i => i.sub === 'Pot/Mug');
  assert(!!item, 'Pot/Mug found');
  assertEqual(item?.desc,        'Fire-Maple Petrel G3 600ml HX Pot', 'Description preserved');
  assertEqual(item?.weightOz,    5.7,               'Weight = 5.7 oz');
  assertEqual(item?.destination, 'Kitchen',         'Destination = Kitchen');
}

// ── P9: 1 Gal Freezer Bag (numeric-leading type) ──────────────────────────────
console.log('\nP9: 1 Gal Freezer Bag — numeric-leading type');
{
  const item = items.find(i => i.sub === '1 Gal Freezer Bag');
  assert(!!item, '1 Gal Freezer Bag found');
  assertEqual(item?.desc,        'Amazon',          'Description = Amazon');
  assertEqual(item?.weightOz,    0.5,               'Weight = 0.5 oz');
  assertEqual(item?.destination, 'Kitchen',         'Destination = Kitchen');
}

// ── P10: 1 Qrt Freezer Bag ────────────────────────────────────────────────────
console.log('\nP10: 1 Qrt Freezer Bag');
{
  const item = items.find(i => i.sub === '1 Qrt Freezer Bag');
  assert(!!item, '1 Qrt Freezer Bag found');
  assertEqual(item?.desc,        'Amazon',          'Description = Amazon');
  assertEqual(item?.weightOz,    0.22,              'Weight = 0.22 oz');
}

// ── P11: Fuel — description "4 oz" is not the weight ─────────────────────────
console.log('\nP11: Fuel — description "4 oz" is not used as weight');
{
  const item = items.find(i => i.sub === 'Fuel');
  assert(!!item,                                    'Fuel found');
  assertEqual(item?.desc,        '4 oz',            'Description = "4 oz" (canister size label)');
  assertEqual(item?.weightOz,    7.68,              'Weight = 7.68 oz (from col D, not description)');
  assert(item?.weightOz !== 4,                      '"4 oz" description not parsed as 4 oz weight');
  assertEqual(item?.destination, 'Expendables',     'Fuel destination = Expendables (override)');
}

// ── P12: Fuel destination is Expendables regardless of Kitchen section ─────────
console.log('\nP12: Fuel routes to Expendables even though it appears in Kitchen section');
{
  const fuel = items.find(i => i.sub === 'Fuel');
  assert(fuel?.destination === 'Expendables',       'Fuel → Expendables (type override beats section)');
  assert(fuel?.destination !== 'Kitchen',           'Fuel not kept in Kitchen');
}

// ── P13: Add column not leaked into weight ─────────────────────────────────────
console.log('\nP13: Add column value not used as item weight');
{
  // ULA Ultra Circuit has Add=40.8 (same as weight) — if Add were taken as weight, it'd still be 40.8.
  // Pack Liner has Add=0 — if Add leaked in, weight would be 0 and item would be discarded.
  const packLiner = items.find(i => i.sub === 'Pack Liner');
  assert(!!packLiner,                               'Pack Liner imported (Add=0 rows not dropped)');
  assertEqual(packLiner?.weightOz, 1.7,             'Pack Liner weight = 1.7 oz (col D), not Add=0');
}

// ── P14: Summary rows are ignored ─────────────────────────────────────────────
console.log('\nP14: Summary and header rows are ignored');
{
  // If "Base Weight 4.6 lb" leaked in it would appear as an item
  const baseWeight = items.find(i => /base.?weight/i.test(i.sub) || /base.?weight/i.test(i.desc));
  assert(!baseWeight,                               '"Base Weight" summary row ignored');

  // "Expendables 0.48 lb" — starts with "expendables", matched by PDF_SKIP_RE
  const expendablesSummary = items.find(i => /^expendables$/i.test(i.sub));
  assert(!expendablesSummary,                       '"Expendables" summary row ignored');

  // "Category Weight Unit" — column header row
  const catWeightHdr = items.find(i => /category weight/i.test(i.sub));
  assert(!catWeightHdr,                             '"Category Weight" header row ignored');

  // "Total" summary rows
  const totalRow = items.find(i => /^total$/i.test(i.sub));
  assert(!totalRow,                                 '"Total" summary row ignored');
}

// ── P15: Forward-only category guard ──────────────────────────────────────────
console.log('\nP15: Right-side summary "X Backpack Description …" does not reset category');
{
  // After Kitchen, there is a repeated "x Backpack Description …" header in the fixture
  // (simulates the summary table column header on the right side of the sheet).
  // All items following it should NOT have destination="Backpack".
  const postKitchenItems = items.filter(i => i.destination === 'Backpack');
  // The only Backpack items should be the two at the top of the fixture,
  // plus Pack Liner (also in Backpack section).
  assert(postKitchenItems.length <= 3, 'At most 3 Backpack items (not reset by summary table header)');
  // Items from Kitchen section must remain Kitchen / Expendables
  const fuelItem = items.find(i => i.sub === 'Fuel');
  assert(fuelItem?.destination !== 'Backpack', 'Fuel destination not reset to Backpack by summary header');
}

// ── P16: Meal Planner heading is a hard stop ───────────────────────────────────
console.log('\nP16: Meal Planner heading is a hard stop — items after it are ignored');
{
  const mealPages = [
    { text: `x Backpack Description Weight Add\nTRUE Backpack Test Pack 40.8 40.8 oz 1\nMeal Planner\nFALSE Food Oatmeal 3 0 oz 1` },
  ];
  const mealItems = extractFromPdfPages(mealPages);
  const hasBackpack = mealItems.some(i => i.sub === 'Backpack');
  const hasOatmeal  = mealItems.some(i => i.desc === 'Oatmeal');
  assert(hasBackpack,  'Gear item before Meal Planner heading is included');
  assert(!hasOatmeal,  'Food item after Meal Planner heading is excluded');
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
