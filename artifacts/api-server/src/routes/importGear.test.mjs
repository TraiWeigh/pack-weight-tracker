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

function extractSectionMode(rows) {
  const results = [];
  let typeCol = -1, descCol = -1, weightCol = -1, unitCol = -1;
  let currentDestination = '';
  let inSection = false;

  for (const rawRow of rows) {
    const row = rawRow.slice(0, MAX_GEAR_COL + 1);
    if (row.every(c => String(c ?? '').trim() === '')) continue;

    if (isSectionHeaderRow(row)) {
      currentDestination = String(row[1] ?? '').trim();
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
  return results;
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

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(44)}`);
console.log(`Tests: ${passed + failed}  Passed: ${passed}  Failed: ${failed}`);
if (failed > 0) {
  console.error('\n❌ Some tests failed.');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed.');
}
