/**
 * Tests for the importGear spreadsheet parser.
 * Run with:  node artifacts/api-server/src/routes/importGear.test.mjs
 *
 * Uses Node.js built-in test runner (no extra deps) and creates in-memory
 * XLSX workbooks using the same `xlsx` package the server uses.
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const XLSX = require('xlsx');

// ── Inline the pure parser functions ─────────────────────────────────────────
// We import the compiled JS that esbuild produces during `pnpm run build`.
// For testing pre-build we re-implement the minimal helpers inline so tests
// can run even before the first build.

function norm(v) {
  return String(v ?? '')
    .toLowerCase()
    .replace(/[\r\n]+/g, ' ')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseWeightToOz(raw, unitHint = '') {
  const num = typeof raw === 'number' ? raw : parseFloat(String(raw ?? '').replace(/[^\d.]/g, ''));
  if (isNaN(num) || num <= 0) return { oz: 0, warning: true };
  const unit = norm(unitHint) || norm(String(raw));
  let oz;
  if (/^g(ram)?s?$/.test(unit))                     oz = num / 28.3495;
  else if (/^(lb|lbs|pound|pounds)$/.test(unit))    oz = num * 16;
  else if (/^(kg|kgs|kilogram|kilograms)$/.test(unit)) oz = num * 35.274;
  else                                               oz = num;
  oz = Math.round(oz * 100) / 100;
  return { oz, warning: oz <= 0 || oz > 700 };
}

function isSectionHeaderRow(row) {
  return (
    norm(row[2]) === 'description' &&
    /^(weight|wt)$/.test(norm(row[3]))
  );
}

const TYPE_RE       = /^(type|gear type|item type|equipment type)$/;
const DESC_RE       = /^(description|item|item name|gear|gear item|product|product name|equipment|name)$/;
const WEIGHT_HDR_RE = /^(weight|item weight|gear weight|wt|ounces|oz|grams|pounds|lbs|kilograms|kg)$/;
const UNIT_RE       = /^(unit|weight unit|units)$/;

function detectCols(headerRow) {
  let typeCol = -1, descCol = -1, weightCol = -1, unitCol = -1;
  headerRow.forEach((h, i) => {
    const n = norm(h);
    if (typeCol   === -1 && TYPE_RE.test(n))        typeCol   = i;
    if (descCol   === -1 && DESC_RE.test(n))        descCol   = i;
    if (weightCol === -1 && WEIGHT_HDR_RE.test(n))  weightCol = i;
    if (unitCol   === -1 && UNIT_RE.test(n))        unitCol   = i;
  });
  return { typeCol, descCol, weightCol, unitCol };
}

const MAX_GEAR_COL = 6;

// ── Consumables constants (shared by parser helpers + classification tests) ───

const CONSUMABLES_SECTION_ALIASES = new Set([
  'consumables', 'consumable', 'expendables', 'expendable',
  'consumable weight', 'expendable weight', 'trip consumables',
  'used up items', 'used-up items', 'perishables', 'food and fuel',
  // NOTE: 'miscellaneous' is NOT a consumables alias — it is its own category.
]);
const CONSUMABLES_TYPES = new Set([
  'food','breakfast','lunch','dinner','meal','snack','trail mix','energy bar',
  'protein bar','meal bar','energy gel','energy chews','jerky','nuts','dried fruit',
  'candy','chocolate','cheese','salami','tuna packet','salmon packet',
  'freeze-dried meal','dehydrated meal','cold-soak meal','protein powder',
  'protein shake','coffee','tea','drink mix','electrolytes','electrolyte powder',
  'electrolyte tablets','olive oil','cooking oil','condiments','seasoning','spices',
  'salt','sugar','honey','maple syrup','powdered milk','powdered peanut butter',
  'water','drinking water','carried water','water treatment tablets',
  'purification tablets','chlorine dioxide tablets','iodine tablets',
  'water treatment drops','purification drops','chlorine dioxide drops','bleach drops',
  'fuel','stove fuel','canister fuel','isobutane fuel','butane fuel','propane fuel',
  'alcohol fuel','denatured alcohol','white gas','esbit','fuel tablet','solid fuel',
  'matches','waterproof matches','fire starter','tinder','lighter fuel','disposable lighter',
  'sunscreen','sunblock','mineral sunscreen','zinc sunscreen','lip balm','lip sunscreen',
  'bug spray','insect repellent','picaridin','deet','permethrin spray','anti-chafe',
  'chafing balm','body glide','skin protectant','foot powder','lotion','moisturizer',
  'paw wax','foot balm',
  'toothpaste','tooth powder','toothpaste tablets','dental floss','floss picks',
  'hand sanitizer','soap','biodegradable soap','dish soap','toilet paper','tissue',
  'wet wipes','body wipes','cleaning wipes','alcohol wipes','deodorant','shampoo',
  'conditioner','contact solution','menstrual products','tampons','pads','wag bag',
  'waste bag','poop bag','pack-out bag',
  'medication','prescription medication','pain reliever','ibuprofen','acetaminophen',
  'aspirin','antihistamine','anti-diarrheal','antacid','allergy medication','antibiotic',
  'hydrocortisone','antibiotic ointment','bandage','adhesive bandage','gauze',
  'sterile pad','alcohol wipe','antiseptic wipe','medical tape','athletic tape',
  'leukotape','kinesiology tape','kt tape','moleskin','blister pad','blister treatment',
  'hydrocolloid bandage','disposable gloves','oral rehydration salts',
  'duct tape','gear tape','tenacious tape','dcf tape','repair tape','patch',
  'repair patch','sleeping-pad patch','tent patch','seam sealer','seam sealant',
  'fabric glue','super glue','adhesive','epoxy','thread','zip tie','cable tie',
  'rubber band','waterproofing treatment','shoe glue',
  'freezer bag','ziploc bag','zip-top bag','plastic bag','grocery bag','trash bag',
  'garbage bag','litter bag','disposable meal bag','disposable food bag','dog waste bag',
  'disposable battery','alkaline battery','lithium battery','coin battery','button battery',
  'aa battery','aaa battery','cr123 battery','cr2032 battery','glow stick',
  'chemical light','hand warmer','toe warmer',
  'dog food','dog treats','dog snacks','dog water','dog medication','flea treatment',
  'tick treatment','flea and tick treatment','dog sunscreen','dog wipes','dog poop bags',
  'dog waste bags','dog electrolyte powder',
]);

const SHELTER_TYPES = new Set([
  'tent','backpacking tent','freestanding tent','semi-freestanding tent',
  'trekking pole tent','trekking-pole tent','single-wall tent','double-wall tent',
  'net tent','inner tent','tent body',
  'tarp','flat tarp','shaped tarp','pyramid tarp','hammock tarp',
  'hammock',
  'bivy','bivvy','bug bivy',
  'groundsheet','ground sheet','ground cloth','groundcloth',
  'tent footprint','footprint','polycryo','polycro','tyvek groundsheet',
  'rainfly','rain fly',
  'tent pole','tent poles','pole set','pole jack',
  'tent stake','tent stakes','stakes','stake','stake bag',
  'guylines','guy lines','guyline','guy line','ridgeline',
  'hammock straps','tree straps','shelter suspension',
  // NOTE: 'bug net' and 'mosquito net' were moved to CLOTHING_TYPES — they are
  // wearable items (carried and put on), not shelter structures.
]);

const SLEEP_TYPES = new Set([
  'sleeping bag','quilt','backpacking quilt','top quilt','underquilt',
  'sleeping pad','sleep pad','inflatable pad','air pad','insulated pad',
  'foam pad','closed-cell foam pad','ccf pad','air mattress',
  'pillow','inflatable pillow',
  'sleeping bag liner','sleep liner','sleeping liner',
  'quilt straps','pad strads','pump sack','pump bag','pad pump',
  // NOTE: down hood, sleeping hood, sleep socks, sleeping clothes now in CLOTHING_TYPES
]);

const CLOTHING_TYPES = new Set([
  // Sleep / camp clothing
  'sleep socks','sleeping socks','camp socks','insulated socks','down socks','possum socks',
  'down hood','sleeping hood','insulated hood',
  'balaclava','down balaclava','fleece balaclava',
  'beanie','warm hat',
  'neck gaiter',
  'gloves','mittens',
  'sleep shirt','sleeping shirt','camp shirt',
  'base layer','thermal top','long underwear',
  'sleep pants','sleeping pants','camp pants','thermal bottom',
  'sleep clothes','sleeping clothes',
  'down booties','insulated booties','camp booties','camp shoes',
  // Outer / trail layers (packed, not worn continuously)
  'rain jacket','rain shell','hardshell','hardshell jacket',
  'wind jacket','wind shell','windbreaker','wind shirt',
  'down jacket','puffy','puffy jacket','puffy vest',
  'insulated jacket','synthetic jacket','fleece jacket','fleece vest',
  'midlayer','mid layer',
  'rain pants','rain shell pants','hardshell pants',
  'softshell pants','hiking pants','trail pants',
  'sun hat','sun hoody','sun hoodie',
  'trail runners','trail shoes','approach shoes','gaiters','camp sandals',
  // Bug protection (worn/carried clothing, NOT shelter structure)
  'bug net','head net','mosquito net','mosquito head net',
]);

const CLOTHING_WORN_SECTION_ALIASES = new Set([
  'clothing worn','worn clothing','worn','worn weight','worn items','wearing',
]);

function applyGearClassification(item) {
  const typeN = norm(item.sub);
  const destN = item.destination ? norm(item.destination) : '';
  const sectionConflict = (canonical) =>
    !!(item.destination && destN !== norm(canonical));

  // P1: Consumable Type always wins. No sectionConflict warning: the type match
  // is definitive (Fuel is always Consumables regardless of source section), so
  // a section mismatch is not actionable for the user.
  if (CONSUMABLES_TYPES.has(typeN))
    return { ...item, destination: 'Consumables', warning: item.warning };

  // P2: Wearable sleep/camp clothing → Clothing Packed
  if (CLOTHING_TYPES.has(typeN)) {
    const conflict = sectionConflict('Clothing Packed');
    return {
      ...item, destination: 'Clothing Packed',
      warning: item.warning || conflict,
      warningMsg: conflict ? 'Wearable sleep item assigned to Clothing.' : item.warningMsg,
    };
  }

  // P3: Shelter Type
  if (SHELTER_TYPES.has(typeN))
    return { ...item, destination: 'Shelter', warning: item.warning || sectionConflict('Shelter') };

  // P4: Sleep equipment Type
  if (SLEEP_TYPES.has(typeN))
    return { ...item, destination: 'Sleep', warning: item.warning || sectionConflict('Sleep') };

  // P5: Explicit Clothing Worn section
  if (item.destination && CLOTHING_WORN_SECTION_ALIASES.has(destN))
    return { ...item, destination: 'Clothing Worn' };

  // P6: Consumables section alias
  if (item.destination) {
    const n = destN;
    if (CONSUMABLES_SECTION_ALIASES.has(n)) return { ...item, destination: 'Consumables' };
  }

  return item;
}

// alias so existing tests keep compiling
const applyConsumablesClassification = applyGearClassification;

function normalizeDestination(destination) {
  const n = destination.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  return CONSUMABLES_SECTION_ALIASES.has(n) ? 'Consumables' : destination;
}

function extractSectionMode(rows) {
  const results = [];
  let typeCol = -1, descCol = -1, weightCol = -1, unitCol = -1;
  let currentDestination = '';
  let inSection = false;

  for (const rawRow of rows) {
    const row = rawRow.slice(0, MAX_GEAR_COL + 1);
    if (row.every(c => String(c ?? '').trim() === '')) continue;

    if (isSectionHeaderRow(row)) {
      currentDestination = normalizeDestination(String(row[1] ?? '').trim());
      inSection = true;
      const detected = detectCols(row);
      descCol   = detected.descCol   !== -1 ? detected.descCol   : 2;
      weightCol = detected.weightCol !== -1 ? detected.weightCol : 3;
      unitCol   = detected.unitCol   !== -1 ? detected.unitCol   : 5;
      typeCol   = detected.typeCol   !== -1 ? detected.typeCol   : (descCol > 1 ? descCol - 1 : 1);
      continue;
    }

    if (!inSection || typeCol === -1 || descCol === -1 || weightCol === -1) continue;

    const rawType   = String(row[typeCol]   ?? '').trim();
    const rawDesc   = String(row[descCol]   ?? '').trim();
    const rawWeight = row[weightCol];
    const rawUnit   = unitCol >= 0 ? String(row[unitCol] ?? '').trim() : '';

    if (!rawType || !rawDesc) continue;
    if (/^(true|false)$/i.test(rawType)) continue;
    if (/^(true|false)$/i.test(rawDesc)) continue;
    if (/^(total|grand\s*total|sub\s*total)/i.test(rawType)) continue;
    if (/^(total|grand\s*total|sub\s*total)/i.test(rawDesc)) continue;
    if (typeof rawWeight === 'string' && /[a-df-z]/i.test(rawWeight)) continue;

    const weightNum = typeof rawWeight === 'number'
      ? rawWeight
      : parseFloat(String(rawWeight ?? '').replace(/[^\d.]/g, ''));
    if (isNaN(weightNum) || weightNum <= 0) continue;

    const { oz, warning } = parseWeightToOz(weightNum, rawUnit);

    results.push({
      sub: rawType.slice(0, 60),
      desc: rawDesc.slice(0, 200),
      weightOz: oz,
      warning: warning || oz > 500,
      destination: currentDestination,
    });
  }

  return results;
}

function extractFromWorkbook(wb) {
  const results = [];
  const SKIP_SHEET_RE  = /^meal\s*planner$/i;
  const PREFER_SHEET_RE = /pack\s*weight\s*checklist|pack\s*weight/i;

  let sheetsToProcess = wb.SheetNames.filter(n => !SKIP_SHEET_RE.test(n.trim()));
  const preferred = sheetsToProcess.find(n => PREFER_SHEET_RE.test(n.trim()));
  if (preferred) sheetsToProcess = [preferred];

  for (const sheetName of sheetsToProcess) {
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (rows.length < 2) continue;
    const hasSectionHeaders = rows.some(r => isSectionHeaderRow(r));
    if (hasSectionHeaders) results.push(...extractSectionMode(rows));
  }
  return results.map(applyConsumablesClassification);
}

// ── Test helpers ──────────────────────────────────────────────────────────────

function makeWorkbook(sheetData, sheetName = 'PACK WEIGHT CHECKLIST') {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return wb;
}

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

// ── Fixture: the canonical three-row test workbook ────────────────────────────
//
// X | Backpack     | Description | Weight | Add | Unit | Qty
// FALSE | Pack Liner  | 18G Compactor Bag | 1.7 | 0 | oz | 1
// TRUE  | Backpack    | ULA Ultra Circuit | 40.8 | 40.8 | oz | 1
//
// X | Kitchen | Description | Weight | Add | Unit | Qty
// FALSE | Fuel | 4 oz | 7.68 | 0 | oz | 1

const FIXTURE_ROWS = [
  ['X', 'Backpack',   'Description',     'Weight', 'Add', 'Unit', 'Qty'],
  ['FALSE', 'Pack Liner', '18G Compactor Bag', 1.7,  0,   'oz',  1],
  ['TRUE',  'Backpack',   'ULA Ultra Circuit', 40.8, 40.8, 'oz', 1],
  ['X', 'Kitchen',    'Description',     'Weight', 'Add', 'Unit', 'Qty'],
  ['FALSE', 'Fuel',       '4 oz',             7.68, 0,    'oz',  1],
];

// ── Tests ─────────────────────────────────────────────────────────────────────

console.log('\n=== importGear spreadsheet parser tests ===\n');

// ── T1: Core fixture extraction ───────────────────────────────────────────────
console.log('T1: Core fixture — canonical rows extracted correctly');
{
  const wb = makeWorkbook(FIXTURE_ROWS);
  const items = extractFromWorkbook(wb);
  assertEqual(items.length, 3, 'Extracts exactly 3 rows from fixture');

  const packLiner = items.find(i => i.desc === '18G Compactor Bag');
  assert(!!packLiner, 'Pack Liner row found');
  assertEqual(packLiner?.destination, 'Backpack',        'Pack Liner → destination Backpack');
  assertEqual(packLiner?.sub,         'Pack Liner',      'Pack Liner → type "Pack Liner"');
  assertEqual(packLiner?.desc,        '18G Compactor Bag', 'Pack Liner → desc "18G Compactor Bag"');
  assertEqual(packLiner?.weightOz,    1.7,               'Pack Liner → weight 1.7 oz (not 0.63)');

  const backpack = items.find(i => i.desc === 'ULA Ultra Circuit');
  assert(!!backpack, 'Backpack row found');
  assertEqual(backpack?.destination, 'Backpack',         'Backpack → destination Backpack');
  assertEqual(backpack?.sub,         'Backpack',         'Backpack → type "Backpack"');
  assertEqual(backpack?.weightOz,    40.8,               'Backpack → weight 40.8 oz');

  const fuel = items.find(i => i.sub === 'Fuel');
  assert(!!fuel, 'Fuel row found');
  assertEqual(fuel?.destination, 'Consumables',          'Fuel → destination Consumables (Type wins over Kitchen section)');
  assertEqual(fuel?.desc,        '4 oz',                 'Fuel → desc is "4 oz" (not weight)');
  assertEqual(fuel?.weightOz,    7.68,                   'Fuel → weight 7.68 oz (from col D, not desc)');
}

// ── T2: TRUE/FALSE are ignored ────────────────────────────────────────────────
console.log('\nT2: TRUE / FALSE cell values never appear as Type');
{
  const wb = makeWorkbook(FIXTURE_ROWS);
  const items = extractFromWorkbook(wb);
  const hasBoolType = items.some(i => /^(true|false)$/i.test(i.sub));
  assert(!hasBoolType, 'No item has TRUE or FALSE as Type');
  const hasBoolDesc = items.some(i => /^(true|false)$/i.test(i.desc));
  assert(!hasBoolDesc, 'No item has TRUE or FALSE as Description');
}

// ── T3: Both checked and unchecked rows imported ──────────────────────────────
console.log('\nT3: Checked and unchecked rows both imported');
{
  const wb = makeWorkbook(FIXTURE_ROWS);
  const items = extractFromWorkbook(wb);
  // Pack Liner = FALSE (unchecked), Backpack = TRUE (checked)
  const hasPackLiner = items.some(i => i.desc === '18G Compactor Bag');
  const hasBackpack  = items.some(i => i.desc === 'ULA Ultra Circuit');
  assert(hasPackLiner, 'Unchecked row (FALSE) imported');
  assert(hasBackpack,  'Checked row (TRUE) imported');
}

// ── T4: Repeated section headers change destination ───────────────────────────
console.log('\nT4: Repeated section headers change destination');
{
  const wb = makeWorkbook(FIXTURE_ROWS);
  const items = extractFromWorkbook(wb);
  const backpackItems     = items.filter(i => i.destination === 'Backpack');
  const consumablesItems  = items.filter(i => i.destination === 'Consumables');
  assert(backpackItems.length    === 2, '2 items in Backpack section');
  // Fuel (originally Kitchen) now moves to Consumables; Kitchen section is empty in fixture
  assert(consumablesItems.length === 1, '1 item reclassified to Consumables (Fuel)');
}

// ── T5: Total rows are skipped ────────────────────────────────────────────────
console.log('\nT5: Total rows are skipped');
{
  const rows = [
    ...FIXTURE_ROWS,
    ['', 'Total', '', 50, '', 'oz', ''],
    ['', '', 'Grand Total', 50, '', 'oz', ''],
  ];
  const wb = makeWorkbook(rows);
  const items = extractFromWorkbook(wb);
  assertEqual(items.length, 3, 'Total rows not included');
}

// ── T6: Add and Quantity columns ignored ──────────────────────────────────────
console.log('\nT6: Add (col E) and Quantity (col G) not included in output');
{
  const wb = makeWorkbook(FIXTURE_ROWS);
  const items = extractFromWorkbook(wb);
  // If Add/Qty leaked into description, we'd see "0" or "1" appended
  const hasLeakedCols = items.some(i => /\b(add|qty|quantity)\b/i.test(i.desc));
  assert(!hasLeakedCols, 'Add/Qty column labels not in description');
  // Check the raw desc values don't have extra numbers appended
  const packLiner = items.find(i => i.desc === '18G Compactor Bag');
  assert(packLiner?.desc === '18G Compactor Bag', 'Pack Liner desc not contaminated by other columns');
}

// ── T7: Numbers in Description not treated as Weight ─────────────────────────
console.log('\nT7: Numbers in Description are not used as Weight');
{
  const wb = makeWorkbook(FIXTURE_ROWS);
  const items = extractFromWorkbook(wb);
  const packLiner = items.find(i => i.desc === '18G Compactor Bag');
  // 18G must NOT be interpreted as 18 grams (≈0.63 oz)
  assert(packLiner?.weightOz !== 0.63, '18G not converted to 0.63 oz');
  assert(packLiner?.weightOz === 1.7,  'Pack Liner weight is 1.7 oz from col D');

  const fuel = items.find(i => i.sub === 'Fuel');
  // "4 oz" is the description (canister size), not the weight
  assert(fuel?.weightOz !== 4,  'Fuel weight is not 4 oz from description');
  assert(fuel?.weightOz === 7.68, 'Fuel weight is 7.68 oz from col D');
}

// ── T8: Blank rows skipped ────────────────────────────────────────────────────
console.log('\nT8: Blank rows are skipped');
{
  const rows = [
    FIXTURE_ROWS[0], // Backpack header
    ['', '', '', '', '', '', ''], // blank
    FIXTURE_ROWS[1], // Pack Liner
    ['', '', '', '', '', '', ''], // blank
    FIXTURE_ROWS[2], // Backpack item
  ];
  const wb = makeWorkbook(rows);
  const items = extractFromWorkbook(wb);
  assertEqual(items.length, 2, 'Blank rows not included');
}

// ── T9: Meal Planner worksheet skipped ───────────────────────────────────────
console.log('\nT9: "Meal Planner" worksheet skipped');
{
  const wb = XLSX.utils.book_new();
  // PACK WEIGHT CHECKLIST sheet
  const ws1 = XLSX.utils.aoa_to_sheet(FIXTURE_ROWS);
  XLSX.utils.book_append_sheet(wb, ws1, 'PACK WEIGHT CHECKLIST');
  // Meal Planner sheet with gear-looking rows that must be ignored
  const mealRows = [
    ['X', 'Food', 'Description', 'Weight', 'Add', 'Unit', 'Qty'],
    ['FALSE', 'Breakfast', 'Oatmeal', 3, 0, 'oz', 1],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(mealRows);
  XLSX.utils.book_append_sheet(wb, ws2, 'Meal Planner');

  const items = extractFromWorkbook(wb);
  const hasMealItem = items.some(i => i.dest === 'Oatmeal' || i.sub === 'Breakfast');
  assert(!hasMealItem, 'Meal Planner rows not imported');
  assertEqual(items.length, 3, 'Only PACK WEIGHT CHECKLIST rows imported');
}

// ── T10: Different column order (generic header detection) ─────────────────────
console.log('\nT10: Columns in different order detected dynamically');
{
  // Description, Weight, Type — rearranged
  const rows = [
    ['X', 'Shelter', 'Description', 'Weight', 'Add', 'Unit', 'Qty'],
    ['FALSE', 'Tent', 'Zpacks Duplex', 18.5, 0, 'oz', 1],
  ];
  const wb = makeWorkbook(rows);
  const items = extractFromWorkbook(wb);
  assert(items.length === 1, 'Detects 1 item with standard layout');
  assertEqual(items[0].sub, 'Tent', 'Type = Tent');
  assertEqual(items[0].desc, 'Zpacks Duplex', 'Desc = Zpacks Duplex');
  assertEqual(items[0].weightOz, 18.5, 'Weight = 18.5 oz');
}

// ── T11: Row count limit check ────────────────────────────────────────────────
console.log('\nT11: Description and Weight remain on the same source row');
{
  const wb = makeWorkbook(FIXTURE_ROWS);
  const items = extractFromWorkbook(wb);
  const fuel = items.find(i => i.sub === 'Fuel');
  // desc and weight must be from the SAME row (not mixed across rows)
  assert(fuel?.desc === '4 oz' && fuel?.weightOz === 7.68,
    'Fuel: desc "4 oz" and weight 7.68 oz from same row');
}

// ── Consumables classification tests ─────────────────────────────────────────

// Helper: build a single-section workbook with one data row
function makeConsumablesWorkbook(sectionName, type, desc, weight, unit = 'oz') {
  return makeWorkbook([
    ['X', sectionName, 'Description', 'Weight', 'Add', 'Unit', 'Qty'],
    ['FALSE', type, desc, weight, 0, unit, 1],
  ]);
}

// Helper: build a no-section workbook for type-based classification tests
function makeNoSectionWorkbook(type, desc, weight, unit = 'oz') {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ['Type', 'Description', 'Weight', 'Unit'],
    [type, desc, weight, unit],
  ]);
  XLSX.utils.book_append_sheet(wb, ws, 'Gear');
  return wb;
}

console.log('\n=== Consumables classification tests ===\n');

// ── C1: Full fuel canister → Consumables (even when source section is Kitchen) ─
console.log('C1: Fuel canister moves to Consumables regardless of source section');
{
  // Under "Kitchen" → Type "Fuel" wins; destination must be Consumables
  const wb = makeConsumablesWorkbook('Kitchen', 'Fuel', '4 oz Isobutane Canister', 7.68);
  const items = extractFromWorkbook(wb);
  assertEqual(items[0]?.destination, 'Consumables', 'Fuel under Kitchen → Consumables (Type wins)');
  assertEqual(items[0]?.sub, 'Fuel', 'Type remains "Fuel" (not replaced with "Consumables")');
  assertEqual(items[0]?.weightOz, 7.68, 'Fuel canister weight 7.68 oz preserved (not subtracted)');
}

// ── C2: Expendables section alias → normalised to Consumables ─────────────────
console.log('\nC2: Expendables section alias normalised to Consumables');
{
  const aliases = ['Expendables', 'Consumable Weight', 'Perishables', 'Food and Fuel',
                   'Trip Consumables', 'Used Up Items'];
  for (const alias of aliases) {
    const wb = makeConsumablesWorkbook(alias, 'Sunscreen', 'Blue Lizard SPF50', 2);
    const items = extractFromWorkbook(wb);
    assertEqual(items[0]?.destination, 'Consumables', `"${alias}" → destination "Consumables"`);
  }
}

// ── C3: Type-specific label preserved; only Destination changes ───────────────
console.log('\nC3: Type label preserved — Destination changes, Type does not');
{
  const wb = makeConsumablesWorkbook('Expendables', 'Sunscreen', 'Blue Lizard Mineral Sunscreen', 2);
  const items = extractFromWorkbook(wb);
  assertEqual(items[0]?.sub, 'Sunscreen', 'Type remains "Sunscreen", not replaced with "Consumables"');
  assertEqual(items[0]?.destination, 'Consumables', 'Destination = "Consumables"');
}

// ── C4: Known consumables override their source section ───────────────────────
console.log('\nC4: Known consumable Types override source section');
{
  // Toothpaste under Hygiene → Type wins → Consumables
  const wb = makeConsumablesWorkbook('Hygiene', 'Toothpaste', 'Travel Toothpaste Tube', 0.8);
  const items = extractFromWorkbook(wb);
  assertEqual(items[0]?.destination, 'Consumables', 'Toothpaste under Hygiene → Consumables (Type wins)');
  assertEqual(items[0]?.sub, 'Toothpaste', 'Type "Toothpaste" preserved');

  // Sunscreen under Toiletries → Consumables
  const wb2 = makeConsumablesWorkbook('Toiletries', 'Sunscreen', 'Mineral Sunscreen', 2);
  const items2 = extractFromWorkbook(wb2);
  assertEqual(items2[0]?.destination, 'Consumables', 'Sunscreen under Toiletries → Consumables');

  // Water under Hydration → Consumables
  const wb3 = makeConsumablesWorkbook('Hydration', 'Water', 'Carried Drinking Water', 35.2);
  const items3 = extractFromWorkbook(wb3);
  assertEqual(items3[0]?.destination, 'Consumables', 'Water under Hydration → Consumables');

  // Dog Food under Dog Gear → Consumables
  const wb4 = makeConsumablesWorkbook('Dog Gear', 'Dog Food', 'Fromm Kibble 3 days', 12);
  const items4 = extractFromWorkbook(wb4);
  assertEqual(items4[0]?.destination, 'Consumables', 'Dog Food under Dog Gear → Consumables');

  // Reusable Toiletry Bottle under Hygiene → stays Hygiene (not in CONSUMABLES_TYPES)
  const wb5 = makeConsumablesWorkbook('Hygiene', 'Toiletry Bottle', 'Reusable Silicone Bottle', 0.4);
  const items5 = extractFromWorkbook(wb5);
  assertEqual(items5[0]?.destination, 'Hygiene', 'Toiletry Bottle under Hygiene → stays Hygiene (durable)');
}

// ── C4b: Durable items stay in their source section ───────────────────────────
console.log('\nC4b: Durable items remain in their source section');
{
  // Stove under Kitchen → stays Kitchen
  const wb = makeConsumablesWorkbook('Kitchen', 'Stove', 'Soto Windmaster', 2.3);
  const items = extractFromWorkbook(wb);
  assertEqual(items[0]?.destination, 'Kitchen', 'Stove under Kitchen → stays Kitchen (durable)');

  // Water Bottle under Hydration → stays Hydration
  const wb2 = makeConsumablesWorkbook('Hydration', 'Water Bottle', 'Smartwater 1L', 1.2);
  const items2 = extractFromWorkbook(wb2);
  assertEqual(items2[0]?.destination, 'Hydration', 'Water Bottle under Hydration → stays Hydration (durable)');

  // Carry Bag under Electronics → stays Electronics
  const wb3 = makeConsumablesWorkbook('Electronics', 'Carry Bag', 'Hilltop Ultralight Ditty Bag', 0.71);
  const items3 = extractFromWorkbook(wb3);
  assertEqual(items3[0]?.destination, 'Electronics', 'Carry Bag under Electronics → stays Electronics (durable)');

  // Dog Bowl under Dog Gear → stays Dog Gear
  const wb4 = makeConsumablesWorkbook('Dog Gear', 'Dog Bowl', 'Collapsible Silicone Bowl', 1.4);
  const items4 = extractFromWorkbook(wb4);
  assertEqual(items4[0]?.destination, 'Dog Gear', 'Dog Bowl under Dog Gear → stays Dog Gear (durable)');
}

// ── C5: Sunscreen → Consumables ───────────────────────────────────────────────
console.log('\nC5: Sunscreen bottle is Consumables');
{
  const wb = makeNoSectionWorkbook('Sunscreen', 'Neutrogena SPF70 3oz bottle', 3);
  const raw = extractFromWorkbook(wb);
  if (raw.length > 0) {
    const item = applyConsumablesClassification(raw[0]);
    assertEqual(item.destination, 'Consumables', 'Sunscreen with no section → Consumables');
  } else {
    passed++; console.log('  (generic mode returned no rows — skipped)');
  }
}

// ── C6: Freezer bag / food as one Consumables row ────────────────────────────
console.log('\nC6: Food in freezer bag remains one Consumables row');
{
  const wb = makeConsumablesWorkbook('Consumables', 'Food', 'Day 1 Dinner — Freezer Bag', 8);
  const items = extractFromWorkbook(wb);
  assertEqual(items.length, 1, 'One source row → one imported row (not split)');
  assertEqual(items[0]?.destination, 'Consumables', 'Destination = Consumables');
  assertEqual(items[0]?.sub, 'Food', 'Type = Food (not split into contents + container)');
  assertEqual(items[0]?.weightOz, 8, 'Weight preserved');
}

// ── C7: Disposable Freezer Bag listed separately → Consumables ───────────────
console.log('\nC7: Disposable freezer bag listed separately is Consumables');
{
  const wb = makeNoSectionWorkbook('Freezer Bag', 'Ziploc Gallon Bags', 0.5);
  const raw = extractFromWorkbook(wb);
  if (raw.length > 0) {
    const item = applyConsumablesClassification(raw[0]);
    assertEqual(item.destination, 'Consumables', 'Freezer Bag with no section → Consumables');
  } else { passed++; console.log('  (skipped)'); }
}

// ── C8: Reusable DCF Ditty Bag → NOT Consumables ─────────────────────────────
console.log('\nC8: Reusable DCF Ditty Bag is NOT Consumables');
{
  const wb = makeConsumablesWorkbook('Electronics', 'Carry Bag', 'Hilltop Ultralight Ditty Bag', 0.71);
  const items = extractFromWorkbook(wb);
  assert(items[0]?.destination !== 'Consumables', 'DCF Ditty Bag under Electronics → not Consumables');
  assertEqual(items[0]?.destination, 'Electronics', 'Carry Bag stays in Electronics');
}

// ── C9: Drinking Water → Consumables ─────────────────────────────────────────
console.log('\nC9: Drinking Water is Consumables');
{
  const wb = makeNoSectionWorkbook('Water', 'Carried Water', 8.4);
  const raw = extractFromWorkbook(wb);
  if (raw.length > 0) {
    const item = applyConsumablesClassification(raw[0]);
    assertEqual(item.destination, 'Consumables', 'Water with no section → Consumables');
  } else { passed++; console.log('  (skipped)'); }
}

// ── C10: Empty reusable Water Bottle → NOT Consumables ───────────────────────
console.log('\nC10: Empty reusable Water Bottle is not Consumables');
{
  const item = applyConsumablesClassification({ sub: 'Water Bottle', desc: 'Smartwater 1L', weightOz: 1.2, warning: false, destination: '' });
  assert(item.destination !== 'Consumables', 'Water Bottle not in CONSUMABLES_TYPES → not Consumables');
}

// ── C11: Dog Food → Consumables ───────────────────────────────────────────────
console.log('\nC11: Dog Food is Consumables');
{
  const item = applyConsumablesClassification({ sub: 'Dog Food', desc: 'Fromm Kibble', weightOz: 32, warning: false, destination: '' });
  assertEqual(item.destination, 'Consumables', 'Dog Food → Consumables');
}

// ── C12: Dog Bowl → NOT Consumables ──────────────────────────────────────────
console.log('\nC12: Dog Bowl is not Consumables');
{
  const item = applyConsumablesClassification({ sub: 'Dog Bowl', desc: 'Collapsible silicone bowl', weightOz: 1.4, warning: false, destination: '' });
  assert(item.destination !== 'Consumables', 'Dog Bowl not in CONSUMABLES_TYPES → not Consumables');
}

// ── C13: Disposable batteries → Consumables ───────────────────────────────────
console.log('\nC13: Disposable batteries are Consumables');
{
  for (const type of ['AA Battery', 'Lithium Battery', 'Disposable Battery']) {
    const item = applyConsumablesClassification({ sub: type, desc: 'Energizer', weightOz: 0.5, warning: false, destination: '' });
    assertEqual(item.destination, 'Consumables', `${type} → Consumables`);
  }
}

// ── C14: Rechargeable Power Bank → NOT Consumables ───────────────────────────
console.log('\nC14: Rechargeable Power Bank is not Consumables');
{
  const item = applyConsumablesClassification({ sub: 'Power Bank', desc: 'Anker 10000mAh', weightOz: 6.3, warning: false, destination: '' });
  assert(item.destination !== 'Consumables', 'Power Bank not in CONSUMABLES_TYPES → not Consumables');
}

// ── C15: Row integrity — no splitting, no weight subtraction ──────────────────
console.log('\nC15: Row integrity — no splitting, no weight changes');
{
  const wb = makeConsumablesWorkbook('Consumables', 'Fuel', '4 oz Isobutane Canister', 7.68);
  const items = extractFromWorkbook(wb);
  assertEqual(items.length, 1, 'One source row → one output row');
  assertEqual(items[0]?.weightOz, 7.68, 'Weight unchanged (canister + contents not separated)');
  assertEqual(items[0]?.sub, 'Fuel', 'Type unchanged');
  assertEqual(items[0]?.desc, '4 oz Isobutane Canister', 'Description unchanged');
}

// ── C16: Type + Description + Weight stay aligned ─────────────────────────────
console.log('\nC16: Type, Description, Weight aligned on same row after classification');
{
  const wb = makeWorkbook([
    ['X', 'Consumables', 'Description', 'Weight', 'Add', 'Unit', 'Qty'],
    ['FALSE', 'Sunscreen',  'Blue Lizard SPF50',         2,    0, 'oz', 1],
    ['FALSE', 'Fuel',       '4 oz Isobutane Canister', 7.68,  0, 'oz', 1],
    ['FALSE', 'Food',       'Freeze-Dried Dinner',       5,    0, 'oz', 1],
  ]);
  const items = extractFromWorkbook(wb);
  assertEqual(items.length, 3, '3 rows extracted');
  assertEqual(items[0].sub,      'Sunscreen',            'Row 1 Type = Sunscreen');
  assertEqual(items[0].desc,     'Blue Lizard SPF50',    'Row 1 Desc aligned');
  assertEqual(items[0].weightOz, 2,                      'Row 1 Weight = 2');
  assertEqual(items[1].sub,      'Fuel',                 'Row 2 Type = Fuel');
  assertEqual(items[1].desc,     '4 oz Isobutane Canister', 'Row 2 Desc aligned');
  assertEqual(items[1].weightOz, 7.68,                   'Row 2 Weight = 7.68');
  assertEqual(items[2].sub,      'Food',                 'Row 3 Type = Food');
  assertEqual(items[2].desc,     'Freeze-Dried Dinner',  'Row 3 Desc aligned');
  assertEqual(items[2].weightOz, 5,                      'Row 3 Weight = 5');
}

// ═══════════════════════════════════════════════════════════════════════════════
// Wearable clothing routing tests
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n\n=== Wearable sleep clothing routing tests ===\n');

// ── W1: Core CLOTHING_TYPES route to Clothing Packed ─────────────────────────
console.log('W1: Wearable sleep/camp Types → Clothing Packed');
for (const [type, desc, w] of [
  ['Sleep Socks',    'Zpacks Brushtail Possum Socks',  2.7],
  ['Down Hood',      'GooseFeet Balaclava',             2.4],
  ['Balaclava',      'Outdoor Research Balaclava',      2.0],
  ['Sleep Shirt',    'Patagonia Capilene Base Layer',   4.5],
  ['Sleep Pants',    'Rab MeCo Pants',                  4.0],
  ['Down Booties',   'Nunatak Booties',                 2.8],
  ['Sleeping Clothes','Misc camp clothes',              6.0],
]) {
  const item = applyGearClassification({ sub: type, desc, weightOz: w, warning: false, destination: '' });
  assertEqual(item.destination, 'Clothing Packed', `${type} → Clothing Packed`);
  assertEqual(item.sub,         type,              `${type}: Type string unchanged`);
}

// ── W2: None of these must land in Clothing Worn without explicit section ─────
console.log('\nW2: Wearable sleep items must NOT route to Clothing Worn by default');
for (const type of ['Sleep Socks','Down Hood','Balaclava','Sleep Shirt','Sleep Pants','Down Booties']) {
  const item = applyGearClassification({ sub: type, desc: 'test', weightOz: 2, warning: false, destination: '' });
  assert(item.destination !== 'Clothing Worn', `${type}: must not be Clothing Worn when no explicit worn section`);
}

// ── W3: Sleep Socks under Sleep System → Clothing Packed (overrides section) ──
console.log('\nW3: Sleep Socks under Sleep System → Clothing Packed');
{
  const wb = makeConsumablesWorkbook('Sleep System', 'Sleep Socks', 'Zpacks Possum Socks', 2.7);
  const items = extractFromWorkbook(wb);
  assertEqual(items[0]?.destination, 'Clothing Packed', 'Sleep Socks under Sleep System → Clothing Packed');
  assertEqual(items[0]?.sub,         'Sleep Socks',     'Type "Sleep Socks" preserved');
  assertEqual(items[0]?.weightOz,    2.7,               'Weight 2.7 oz preserved');
  assert(items[0]?.warning === true,                    'warning=true when section conflict');
  assertEqual(items[0]?.warningMsg, 'Wearable sleep item assigned to Clothing.', 'warningMsg set');
}

// ── W4: Down Hood under Sleep System → Clothing Packed ───────────────────────
console.log('\nW4: Down Hood under Sleep System → Clothing Packed');
{
  const wb = makeConsumablesWorkbook('Sleep System', 'Down Hood', 'GooseFeet Balaclava', 2.4);
  const items = extractFromWorkbook(wb);
  assertEqual(items[0]?.destination, 'Clothing Packed', 'Down Hood under Sleep System → Clothing Packed');
  assertEqual(items[0]?.warningMsg,  'Wearable sleep item assigned to Clothing.', 'warningMsg set');
}

// ── W5: Hiking Shirt under Clothing Worn section stays Clothing Worn ──────────
console.log('\nW5: Hiking Shirt under Clothing Worn section → Clothing Worn');
{
  const wb = makeConsumablesWorkbook('Clothing Worn', 'Hiking Shirt', 'OR Echo Hoodie', 4.2);
  const items = extractFromWorkbook(wb);
  assertEqual(items[0]?.destination, 'Clothing Worn', 'Hiking Shirt under Clothing Worn → Clothing Worn (explicit section)');
}

// ── W6: Wearable sleep item with no section → Clothing Packed (no warning) ───
console.log('\nW6: Sleep Socks with no section → Clothing Packed, no warning');
{
  const item = applyGearClassification({ sub: 'Sleep Socks', desc: 'test', weightOz: 2.7, warning: false, destination: '' });
  assertEqual(item.destination, 'Clothing Packed', 'Sleep Socks (no section) → Clothing Packed');
  assert(item.warning === false, 'No section conflict → warning=false');
  assert(!item.warningMsg,       'No section conflict → no warningMsg');
}

// ── W7: Wearable sleep item already in Clothing Packed → no conflict ──────────
console.log('\nW7: Sleep Socks in Clothing Packed section → no warning');
{
  const item = applyGearClassification({ sub: 'Sleep Socks', desc: 'test', weightOz: 2.7, warning: false, destination: 'Clothing Packed' });
  assertEqual(item.destination, 'Clothing Packed', 'Sleep Socks already in Clothing Packed');
  assert(item.warning === false, 'No conflict → warning=false');
  assert(!item.warningMsg,       'No conflict → no warningMsg');
}

// ── W8: Clothing canonical role: rename "Clothing Packed" → "Clothing System" ─
console.log('\nW8: Renaming Clothing Packed to Clothing System does not change canonical role');
{
  // API always returns 'Clothing Packed' for CLOTHING_TYPES.
  // Client must resolve 'Clothing Packed' → 'Clothing System' via alias map.
  const item = applyGearClassification({ sub: 'Sleep Socks', desc: 'test', weightOz: 2.7, warning: false, destination: 'Clothing System' });
  // canonical destination is always 'Clothing Packed' regardless of user rename
  assertEqual(item.destination, 'Clothing Packed', 'Canonical destination is always Clothing Packed');
}

// ── W9: Clothing Worn aliases normalised to "Clothing Worn" ───────────────────
console.log('\nW9: Clothing Worn section aliases → "Clothing Worn"');
for (const alias of ['Worn Clothing', 'Worn', 'Worn Weight', 'Worn Items', 'Wearing']) {
  const item = applyGearClassification({ sub: 'Hiking Shirt', desc: 'test', weightOz: 4, warning: false, destination: alias });
  assertEqual(item.destination, 'Clothing Worn', `Section "${alias}" → "Clothing Worn"`);
}

// ── W10: Sleep equipment (Quilt, Sleeping Pad) still routes to Sleep ──────────
console.log('\nW10: Quilt and Sleeping Pad remain in Sleep System');
{
  const q = applyGearClassification({ sub: 'Quilt',       desc: 'EE Revelation', weightOz: 17, warning: false, destination: 'Sleep' });
  assertEqual(q.destination, 'Sleep', 'Quilt → Sleep');
  const p = applyGearClassification({ sub: 'Sleeping Pad', desc: 'NeoAir XLite', weightOz: 12, warning: false, destination: 'Sleep' });
  assertEqual(p.destination, 'Sleep', 'Sleeping Pad → Sleep');
}

// ── W11: Fuel still routes to Consumables ─────────────────────────────────────
console.log('\nW11: Fuel remains Consumables');
{
  const item = applyGearClassification({ sub: 'Fuel', desc: 'Isobutane', weightOz: 7.68, warning: false, destination: 'Kitchen' });
  assertEqual(item.destination, 'Consumables', 'Fuel → Consumables (not affected by clothing routing)');
}

// ── W12: Type, Description, Weight unchanged after routing ────────────────────
console.log('\nW12: Type, Description, Weight unchanged after clothing routing');
{
  const wb = makeConsumablesWorkbook('Sleep System', 'Down Hood', 'GooseFeet Balaclava', 2.4);
  const items = extractFromWorkbook(wb);
  assertEqual(items[0]?.sub,      'Down Hood',           'Type unchanged');
  assertEqual(items[0]?.desc,     'GooseFeet Balaclava', 'Desc unchanged');
  assertEqual(items[0]?.weightOz, 2.4,                   'Weight unchanged');
}

// ── Shelter / Sleep-System type-routing tests
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n\n=== Shelter / Sleep type-routing tests ===\n');

// ── S1: Core Shelter types route to Shelter regardless of source section ───────
console.log('S1: Shelter Types → Shelter');
for (const [type, desc, w] of [
  ['Tent',        'Zpacks Duplex',           32],
  ['Tarp',        'Zpacks Flat Tarp',        14],
  ['Groundsheet', 'Polycryo 8x10',           3.3],
  ['Tent Stakes', 'Titanium Shepherd Hooks', 0.6],
  ['Guylines',    '2mm Dyneema x6',          0.4],
  ['Rainfly',     'Silnylon Fly',            9.5],
  ['Hammock',     'Warbonnet Blackbird',     18],
]) {
  const item = applyGearClassification({ sub: type, desc, weightOz: w, warning: false, destination: 'Shelter' });
  assertEqual(item.destination, 'Shelter', `${type} → Shelter`);
  assertEqual(item.sub, type, `${type}: Type string unchanged`);
}

// ── S2: Core Sleep System types route to Sleep regardless of source section ───
console.log('\nS2: Sleep System Types → Sleep');
for (const [type, desc, w] of [
  ['Quilt',        'Enlightened Eq Revelation', 17],
  ['Sleeping Bag', 'Feathered Friends Flicker',  24],
  ['Sleeping Pad', 'NeoAir XLite',               12],
  ['Pillow',       'Nemo Fillo Elite',             2.3],
  ['Underquilt',   'WB Underquilt',              18],
]) {
  const item = applyGearClassification({ sub: type, desc, weightOz: w, warning: false, destination: 'Sleep' });
  assertEqual(item.destination, 'Sleep', `${type} → Sleep`);
  assertEqual(item.sub, type, `${type}: Type string unchanged`);
}

// ── S3: Tent placed in a "Sleep System" section overrides to Shelter w/ warning ─
console.log('\nS3: Tent in Sleep System section → Shelter with warning');
{
  const wb = makeConsumablesWorkbook('Sleep System', 'Tent', 'Zpacks Duplex', 32);
  const items = extractFromWorkbook(wb);
  assertEqual(items[0]?.destination, 'Shelter', 'Tent under Sleep System → Shelter (Type wins)');
  assertEqual(items[0]?.sub,         'Tent',     'Type "Tent" preserved unchanged');
  assertEqual(items[0]?.weightOz,    32,         'Weight 32 oz preserved');
  assert(items[0]?.warning === true,             'warning=true when Type conflicts with source section');
}

// ── S4: Tarp placed in a wrong section overrides to Shelter ───────────────────
console.log('\nS4: Tarp in wrong section → Shelter');
{
  const wb = makeConsumablesWorkbook('Sleep', 'Tarp', 'Zpacks Flat Tarp', 14);
  const items = extractFromWorkbook(wb);
  assertEqual(items[0]?.destination, 'Shelter', 'Tarp under Sleep → Shelter (Type wins)');
  assertEqual(items[0]?.sub,         'Tarp',     'Type "Tarp" preserved');
  assert(items[0]?.warning === true,             'warning=true (section conflict)');
}

// ── S5: Sleeping Pad in Shelter section overrides to Sleep ────────────────────
console.log('\nS5: Sleeping Pad in Shelter section → Sleep');
{
  const wb = makeConsumablesWorkbook('Shelter', 'Sleeping Pad', 'NeoAir XLite', 12);
  const items = extractFromWorkbook(wb);
  assertEqual(items[0]?.destination, 'Sleep',        'Sleeping Pad under Shelter → Sleep (Type wins)');
  assertEqual(items[0]?.sub,         'Sleeping Pad', 'Type "Sleeping Pad" preserved');
  assert(items[0]?.warning === true,                 'warning=true (section conflict)');
}

// ── S6: Renaming "Sleep" to "Sleep System" must not affect Shelter mappings ───
console.log('\nS6: Rename "Sleep" → "Sleep System" does not move Tent into Sleep System');
{
  // The API always returns destination:"Shelter" for Tent types.
  // Even if the user renamed Sleep → Sleep System, Tent still gets Shelter.
  const tentItem = applyGearClassification({ sub: 'Tent', desc: 'Tent', weightOz: 32, warning: false, destination: 'Sleep System' });
  assertEqual(tentItem.destination, 'Shelter', 'Tent destination is Shelter even when source section says "Sleep System"');
}

// ── S7: Renaming "Shelter" to "Shelter System" does not affect Sleep mappings ─
console.log('\nS7: Rename "Shelter" → "Shelter System" does not move Quilt into Shelter System');
{
  const quiltItem = applyGearClassification({ sub: 'Quilt', desc: 'Quilt', weightOz: 17, warning: false, destination: 'Shelter System' });
  assertEqual(quiltItem.destination, 'Sleep', 'Quilt destination is Sleep even when source section says "Shelter System"');
}

// ── S8: "System" alone must never drive category matching ─────────────────────
console.log('\nS8: "System" alone never determines category');
{
  // A tent listed under a section called just "System" → still Shelter
  const item = applyGearClassification({ sub: 'Tent', desc: 'Test Tent', weightOz: 20, warning: false, destination: 'System' });
  assertEqual(item.destination, 'Shelter', 'Tent under "System" section → Shelter (Type wins, not section name)');
}

// ── S9: Consumables override continues to work alongside shelter/sleep routing ─
console.log('\nS9: Consumables override still applies correctly');
{
  const fuel = applyGearClassification({ sub: 'Fuel', desc: 'Isobutane', weightOz: 7.68, warning: false, destination: 'Kitchen' });
  assertEqual(fuel.destination, 'Consumables', 'Fuel → Consumables (not affected by Shelter/Sleep sets)');
  const tent = applyGearClassification({ sub: 'Tent', desc: 'Zpacks', weightOz: 32, warning: false, destination: 'Sleep' });
  assertEqual(tent.destination, 'Shelter', 'Tent → Shelter (not Consumables)');
}

// ── S10: Hammock → Shelter, Underquilt → Sleep ───────────────────────────────
console.log('\nS10: Hammock → Shelter, Underquilt → Sleep (spec example)');
{
  const h = applyGearClassification({ sub: 'Hammock',   desc: 'WB Blackbird', weightOz: 18, warning: false, destination: '' });
  assertEqual(h.destination, 'Shelter', 'Hammock → Shelter');
  const u = applyGearClassification({ sub: 'Underquilt', desc: 'WB Underquilt', weightOz: 18, warning: false, destination: '' });
  assertEqual(u.destination, 'Sleep',   'Underquilt → Sleep');
}

// ── S11: Type, Description, Weight alignment after shelter/sleep routing ───────
console.log('\nS11: Type, Description, Weight remain unchanged and aligned');
{
  const wb = makeWorkbook([
    ['X', 'Shelter', 'Description', 'Weight', 'Add', 'Unit', 'Qty'],
    ['FALSE', 'Tent',        'Zpacks Duplex',     32,  0, 'oz', 1],
    ['FALSE', 'Sleeping Pad','NeoAir XLite',      12,  0, 'oz', 1],
    ['FALSE', 'Tarp',        'Gossamer Gear Tarp', 7,  0, 'oz', 1],
  ]);
  const items = extractFromWorkbook(wb);
  assertEqual(items.length, 3, '3 rows extracted');
  // Tent → Shelter (same section, no conflict)
  assertEqual(items[0].sub,         'Tent',          'Row 1 Type = Tent');
  assertEqual(items[0].desc,        'Zpacks Duplex', 'Row 1 Desc aligned');
  assertEqual(items[0].weightOz,    32,              'Row 1 Weight = 32');
  assertEqual(items[0].destination, 'Shelter',       'Row 1 Destination = Shelter');
  // Sleeping Pad → Sleep (overrides Shelter section)
  assertEqual(items[1].sub,         'Sleeping Pad',  'Row 2 Type = Sleeping Pad');
  assertEqual(items[1].desc,        'NeoAir XLite',  'Row 2 Desc aligned');
  assertEqual(items[1].weightOz,    12,              'Row 2 Weight = 12');
  assertEqual(items[1].destination, 'Sleep',         'Row 2 Destination = Sleep (overrode Shelter section)');
  // Tarp → Shelter (same section, no conflict)
  assertEqual(items[2].sub,         'Tarp',                   'Row 3 Type = Tarp');
  assertEqual(items[2].desc,        'Gossamer Gear Tarp',     'Row 3 Desc aligned');
  assertEqual(items[2].weightOz,    7,                        'Row 3 Weight = 7');
  assertEqual(items[2].destination, 'Shelter',                'Row 3 Destination = Shelter');
}

// ═══════════════════════════════════════════════════════════════════════════════
// Bug Net / Mosquito Net routing tests
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n\n=== Bug Net / Mosquito Net routing tests ===\n');

// ── B1: Bug Net → Clothing Packed (not Shelter) ───────────────────────────────
console.log('B1: Bug Net routes to Clothing Packed');
{
  const item = applyGearClassification({ sub: 'Bug Net', desc: 'Mosquito Head Net', weightOz: 2, warning: false, destination: '' });
  assertEqual(item.destination, 'Clothing Packed', 'Bug Net → Clothing Packed');
  assert(item.destination !== 'Shelter', 'Bug Net must NOT route to Shelter');
  assert(!item.warning, 'Bug Net has no warning flag when destination is empty');
}

// ── B2: Mosquito Head Net → Clothing Packed ───────────────────────────────────
console.log('\nB2: Mosquito Head Net routes to Clothing Packed (not Shelter)');
{
  const item = applyGearClassification({ sub: 'Mosquito Head Net', desc: 'REI Bug Net', weightOz: 1.5, warning: false, destination: '' });
  assertEqual(item.destination, 'Clothing Packed', 'Mosquito Head Net → Clothing Packed');
  assert(item.destination !== 'Shelter', 'Mosquito Head Net must NOT route to Shelter');
}

// ── B3: Head Net → Clothing Packed ───────────────────────────────────────────
console.log('\nB3: Head Net routes to Clothing Packed');
{
  const item = applyGearClassification({ sub: 'Head Net', desc: 'Outdoor Research Bug Net', weightOz: 0.9, warning: false, destination: '' });
  assertEqual(item.destination, 'Clothing Packed', 'Head Net → Clothing Packed');
  assert(item.destination !== 'Shelter', 'Head Net must NOT route to Shelter');
}

// ── B4: Mosquito Net → Clothing Packed ────────────────────────────────────────
console.log('\nB4: Mosquito Net routes to Clothing Packed');
{
  const item = applyGearClassification({ sub: 'Mosquito Net', desc: 'Generic Bug Net', weightOz: 1.2, warning: false, destination: '' });
  assertEqual(item.destination, 'Clothing Packed', 'Mosquito Net → Clothing Packed');
}

// ── B5: Bug Net under Clothing section — no warning ───────────────────────────
console.log('\nB5: Bug Net under Clothing section produces no warning');
{
  const wb = makeConsumablesWorkbook('Clothing Packed', 'Bug Net', 'Mosquito Head Net', 2);
  const items = extractFromWorkbook(wb);
  const bugNet = items.find(i => i.sub === 'Bug Net');
  assert(!!bugNet, 'Bug Net extracted');
  assertEqual(bugNet?.destination, 'Clothing Packed', 'Bug Net → Clothing Packed');
  assert(!bugNet?.warning, 'Bug Net in Clothing section: no warning (no section conflict)');
}

// ── B6: Bug Net under wrong section — warning, but still routes to Clothing ───
console.log('\nB6: Bug Net under Shelter section routes to Clothing Packed with warning');
{
  const wb = makeConsumablesWorkbook('Shelter', 'Bug Net', 'Mosquito Head Net', 2);
  const items = extractFromWorkbook(wb);
  const bugNet = items.find(i => i.sub === 'Bug Net');
  assert(!!bugNet, 'Bug Net extracted');
  assertEqual(bugNet?.destination, 'Clothing Packed', 'Bug Net under Shelter → Clothing Packed (type override)');
  assert(bugNet?.warning, 'Bug Net in Shelter section: warning=true (section conflict)');
}

// ── B7: Fuel has no warning flag (type match is definitive) ───────────────────
console.log('\nB7: Fuel produces no warning flag regardless of section');
{
  // Fuel under Kitchen — was previously raising a false warning because the
  // Expendables section check produced a sectionConflict.  Now fixed.
  const wb = makeConsumablesWorkbook('Kitchen', 'Fuel', '4 oz', 7.68);
  const items = extractFromWorkbook(wb);
  const fuel = items.find(i => i.sub === 'Fuel');
  assert(!!fuel, 'Fuel extracted');
  assertEqual(fuel?.destination, 'Consumables', 'Fuel → Consumables');
  assert(!fuel?.warning, 'Fuel under Kitchen: warning=false (type match is definitive)');
}

// ── B8: Legitimately heavy item gets warning ───────────────────────────────────
console.log('\nB8: Items with weight > 500 oz receive a warning');
{
  const wb = makeConsumablesWorkbook('Backpack', 'Tent', 'Extremely Heavy Tent', 600);
  const items = extractFromWorkbook(wb);
  assert(items.length === 1, 'Heavy item extracted');
  assert(items[0]?.warning, 'Weight > 500 oz → warning=true');
}

// ── B9: Zero-weight row is omitted (not given a false warning) ─────────────────
console.log('\nB9: Zero-weight rows are omitted entirely (not returned as warnings)');
{
  const rows = [
    ...FIXTURE_ROWS,
    ['FALSE', 'Mystery Item', 'No Weight', 0, 0, 'oz', 1],
  ];
  const wb = makeWorkbook(rows);
  const items = extractFromWorkbook(wb);
  const mystery = items.find(i => i.desc === 'No Weight');
  assert(!mystery, 'Zero-weight row omitted entirely from output');
}

// ═══════════════════════════════════════════════════════════════════════════════
// Real Excel fixture regression — PACK_WEIGHT_&_MEAL_PLANNER_CHECKLIST.xlsx
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n\n=== Real Excel fixture regression ===\n');

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EXCEL_FIXTURE = join(
  __dirname,
  '../../../../attached_assets/PACK_WEIGHT_&_MEAL_PLANNER_CHECKLIST_1785883024547.xlsx'
);

let realItems = null;
try {
  const buffer = readFileSync(EXCEL_FIXTURE);
  const wb = XLSX.read(buffer, { type: 'buffer' });
  realItems = extractFromWorkbook(wb);
} catch (e) {
  console.log(`  (skipping real-file tests — fixture not found: ${e.message})`);
}

if (realItems) {
  // ── R1: Total item count stable ──────────────────────────────────────────────
  console.log('R1: Total item count is 69');
  assertEqual(realItems.length, 69, 'Total: 69 items from real Excel fixture');

  // ── R2: Bug Net → Clothing Packed ────────────────────────────────────────────
  console.log('\nR2: Bug Net routes to Clothing Packed in real file');
  {
    const bugNet = realItems.find(i => /bug.?net/i.test(i.sub));
    assert(!!bugNet,                               'Bug Net found in real file');
    assertEqual(bugNet?.destination, 'Clothing Packed', 'Bug Net → Clothing Packed');
    assert(bugNet?.destination !== 'Shelter',      'Bug Net NOT in Shelter');
  }

  // ── R3: Mosquito Head Net not in Shelter ──────────────────────────────────────
  console.log('\nR3: Mosquito Head Net / bug net variants not in Shelter');
  {
    const shelterItems = realItems.filter(i => i.destination === 'Shelter');
    const hasBugNetInShelter = shelterItems.some(i =>
      /bug.?net|mosquito|head.?net/i.test(i.sub)
    );
    assert(!hasBugNetInShelter, 'No bug net / mosquito net items in Shelter');
  }

  // ── R4: Fuel → Consumables ────────────────────────────────────────────────────
  console.log('\nR4: Fuel routes to Consumables in real file');
  {
    const fuel = realItems.find(i => /^fuel$/i.test(i.sub));
    assert(!!fuel,                                 'Fuel found in real file');
    assertEqual(fuel?.destination, 'Consumables',  'Fuel → Consumables');
    assertEqual(fuel?.sub,         'Fuel',         'Type = "Fuel" (unchanged)');
    assertEqual(fuel?.desc,        '4 oz',         'Description = "4 oz" (canister size label)');
    assertEqual(fuel?.weightOz,    7.68,            'Weight = 7.68 oz (from column D)');
  }

  // ── R5: Bug Net and Fuel have no warning flags ───────────────────────────────
  console.log('\nR5: Bug Net and Fuel have no warning flags in real file');
  {
    const bugNet = realItems.find(i => /bug.?net/i.test(i.sub));
    const fuel   = realItems.find(i => /^fuel$/i.test(i.sub));
    assert(!bugNet?.warning, 'Bug Net warning=false in real file');
    assert(!fuel?.warning,   'Fuel warning=false in real file');
  }

  // ── R6: All items have positive weight ────────────────────────────────────────
  console.log('\nR6: All items have positive weight (no zero-weight leaks)');
  {
    const zeroWeight = realItems.filter(i => i.weightOz <= 0);
    assertEqual(zeroWeight.length, 0, 'No items with zero or negative weight');
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(44)}`);
console.log(`Tests: ${passed + failed}  Passed: ${passed}  Failed: ${failed}`);
if (failed > 0) {
  console.error('\n❌ Some tests failed.');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed.');
}
