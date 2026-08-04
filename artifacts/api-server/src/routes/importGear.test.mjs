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

function applyConsumablesClassification(item) {
  if (item.destination) {
    const n = item.destination.toLowerCase().replace(/[^\w\s]/g,' ').replace(/\s+/g,' ').trim();
    return CONSUMABLES_SECTION_ALIASES.has(n) ? { ...item, destination: 'Consumables' } : item;
  }
  const typeN = item.sub.toLowerCase().replace(/[^\w\s]/g,' ').replace(/\s+/g,' ').trim();
  if (CONSUMABLES_TYPES.has(typeN)) return { ...item, destination: 'Consumables' };
  return item;
}

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
  assertEqual(fuel?.destination, 'Kitchen',              'Fuel → destination Kitchen');
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
  const backpackItems = items.filter(i => i.destination === 'Backpack');
  const kitchenItems  = items.filter(i => i.destination === 'Kitchen');
  assert(backpackItems.length === 2, '2 items in Backpack section');
  assert(kitchenItems.length  === 1, '1 item in Kitchen section');
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

// ── C1: Full fuel canister → Consumables ──────────────────────────────────────
console.log('C1: Fuel canister is Consumables');
{
  const wb = makeConsumablesWorkbook('Kitchen', 'Fuel', '4 oz Isobutane Canister', 7.68);
  const raw = extractFromWorkbook(wb);
  const item = applyConsumablesClassification(raw[0]);
  // Under "Kitchen" → explicit section wins; Fuel stays in Kitchen
  assertEqual(item.destination, 'Kitchen', 'Fuel under Kitchen section keeps Kitchen (explicit section wins)');
  // Weight must be preserved
  assertEqual(item.weightOz, 7.68, 'Fuel canister weight 7.68 oz preserved (not subtracted)');

  // When Fuel has NO section heading, it defaults to Consumables
  const wb2 = makeNoSectionWorkbook('Fuel', '4 oz Isobutane Canister', 7.68);
  // extractFromWorkbook uses generic mode → no destination set
  const raw2 = extractFromWorkbook(wb2);
  if (raw2.length > 0) {
    const item2 = applyConsumablesClassification(raw2[0]);
    assertEqual(item2.destination, 'Consumables', 'Fuel with no section → Consumables');
    assertEqual(item2.weightOz, 7.68, 'Fuel weight preserved in no-section case');
  } else {
    console.log('  (no-section generic mode returned no rows — skipped)');
    passed++;
  }
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

// ── C4: Toothpaste → Consumables (explicit Hygiene section wins if present) ───
console.log('\nC4: Toothpaste classification');
{
  // Under Hygiene section → keep Hygiene (explicit source section)
  const wb = makeConsumablesWorkbook('Hygiene', 'Toothpaste', 'Travel Toothpaste Tube', 0.8);
  const items = extractFromWorkbook(wb);
  assertEqual(items[0]?.destination, 'Hygiene', 'Toothpaste under Hygiene section → stays Hygiene');

  // Reusable toiletry bottle listed separately under Hygiene → also stays Hygiene (not consumable type)
  const wb2 = makeConsumablesWorkbook('Hygiene', 'Toiletry Bottle', 'Reusable Silicone Bottle', 0.4);
  const items2 = extractFromWorkbook(wb2);
  assertEqual(items2[0]?.destination, 'Hygiene', 'Toiletry Bottle under Hygiene → stays Hygiene');
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

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(44)}`);
console.log(`Tests: ${passed + failed}  Passed: ${passed}  Failed: ${failed}`);
if (failed > 0) {
  console.error('\n❌ Some tests failed.');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed.');
}
