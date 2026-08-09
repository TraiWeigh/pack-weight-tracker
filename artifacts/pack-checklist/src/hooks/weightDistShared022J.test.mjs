/**
 * Prompt 022J — Restore Weight Distribution to Shared TrailWeigh Links
 *
 * Source-level tests covering:
 * A. WeightDistribution is imported and rendered in SharedChecklistPage
 * B. WeightDistribution is NOT shown in checkable packing-list mode
 * C. WeightDistribution starts collapsed (chartOpen init false)
 * D. Palette state is present for the shared page
 * E. Calculation parity — shared page uses same data props as private Checklist
 * F. Data source: shared store (items/order/meta) passed to WeightDistribution
 * G. 022I Share menu regression (3 actions preserved)
 * H. 022I panel-collapse regression
 * I. 022F footer regression
 * J. 022G private workspace isolation
 * K. Private Checklist WeightDistribution unchanged
 */

import { readFileSync } from 'fs';
import { strict as assert } from 'assert';

const sharedPage = readFileSync(
  'artifacts/pack-checklist/src/pages/SharedChecklistPage.tsx', 'utf8'
);
const weightSummary = readFileSync(
  'artifacts/pack-checklist/src/components/WeightSummary.tsx', 'utf8'
);
const checklist = readFileSync(
  'artifacts/pack-checklist/src/pages/Checklist.tsx', 'utf8'
);
const shareLink = readFileSync(
  'artifacts/pack-checklist/src/lib/shareLink.ts', 'utf8'
);
const footer = readFileSync(
  'artifacts/pack-checklist/src/components/Footer.tsx', 'utf8'
);
const gearCat = readFileSync(
  'artifacts/pack-checklist/src/components/GearCategory.tsx', 'utf8'
);

let passed = 0;
let failed = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✓ ${name}`); passed++; }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); failed++; }
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nA. WeightDistribution imported and rendered in SharedChecklistPage');

test('WeightDistribution is imported from WeightSummary', () => {
  assert.ok(
    /import\s*\{[^}]*WeightDistribution[^}]*\}\s*from\s*['"][^'"]*WeightSummary['"]/.test(sharedPage),
    'WeightDistribution should be imported from WeightSummary'
  );
});

test('WeightDistribution is rendered in SharedChecklistPage', () => {
  assert.ok(
    sharedPage.includes('<WeightDistribution'),
    'SharedChecklistPage should render <WeightDistribution'
  );
});

test('WeightDistribution receives data prop from store.items', () => {
  const distIdx = sharedPage.indexOf('<WeightDistribution');
  assert.ok(distIdx !== -1, '<WeightDistribution must be present');
  const block = sharedPage.slice(distIdx, distIdx + 400);
  assert.ok(
    block.includes('store.items') || block.includes('data={store.items}'),
    'WeightDistribution data prop should use store.items'
  );
});

test('WeightDistribution receives categoryOrder from store.order', () => {
  const distIdx = sharedPage.indexOf('<WeightDistribution');
  const block = sharedPage.slice(distIdx, distIdx + 400);
  assert.ok(
    block.includes('store.order') || block.includes('categoryOrder={store.order}'),
    'WeightDistribution categoryOrder prop should use store.order'
  );
});

test('WeightDistribution receives categoryMeta from store.meta', () => {
  const distIdx = sharedPage.indexOf('<WeightDistribution');
  const block = sharedPage.slice(distIdx, distIdx + 400);
  assert.ok(
    block.includes('store.meta') || block.includes('categoryMeta={store.meta}'),
    'WeightDistribution categoryMeta prop should use store.meta'
  );
});

test('WeightDistribution receives paletteKey prop', () => {
  const distIdx = sharedPage.indexOf('<WeightDistribution');
  const block = sharedPage.slice(distIdx, distIdx + 400);
  assert.ok(
    block.includes('paletteKey='),
    'WeightDistribution should receive paletteKey prop'
  );
});

test('WeightDistribution receives onPaletteChange prop', () => {
  const distIdx = sharedPage.indexOf('<WeightDistribution');
  const block = sharedPage.slice(distIdx, distIdx + 400);
  assert.ok(
    block.includes('onPaletteChange='),
    'WeightDistribution should receive onPaletteChange prop'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nB. WeightDistribution NOT shown in checkable packing-list mode');

test('WeightDistribution is gated on snapshot.type !== checkable', () => {
  const distIdx = sharedPage.indexOf('<WeightDistribution');
  assert.ok(distIdx !== -1, '<WeightDistribution must be present');
  // Search backwards up to 300 chars for the checkable guard
  const preceding = sharedPage.slice(Math.max(0, distIdx - 300), distIdx);
  assert.ok(
    preceding.includes("snapshot.type !== 'checkable'") ||
    preceding.includes('snapshot.type !== "checkable"'),
    'WeightDistribution should be inside a checkable-type guard'
  );
});

test('WeightDistribution guard appears before the component JSX', () => {
  const guardIdx = sharedPage.indexOf("snapshot.type !== 'checkable'");
  const altGuardIdx = sharedPage.indexOf('snapshot.type !== "checkable"');
  const firstGuard = Math.min(
    guardIdx === -1 ? Infinity : guardIdx,
    altGuardIdx === -1 ? Infinity : altGuardIdx
  );
  const distIdx = sharedPage.indexOf('<WeightDistribution');
  assert.ok(firstGuard < distIdx, 'The guard must appear before <WeightDistribution');
});

test('Checkable guard wraps WeightDistribution (not just ImportGearPanel)', () => {
  // There should be a checkable guard that contains WeightDistribution specifically
  // (separate from the ImportGearPanel guard which existed pre-022J)
  const allGuards = [];
  let searchFrom = 0;
  const needle = "snapshot.type !== 'checkable'";
  while (true) {
    const idx = sharedPage.indexOf(needle, searchFrom);
    if (idx === -1) break;
    allGuards.push(idx);
    searchFrom = idx + 1;
  }
  // At least one guard should be immediately before WeightDistribution
  const distIdx = sharedPage.indexOf('<WeightDistribution');
  const closestGuard = allGuards.filter(i => i < distIdx && distIdx - i < 400);
  assert.ok(closestGuard.length > 0, 'A checkable guard within 400 chars before WeightDistribution must exist');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nC. WeightDistribution starts collapsed');

test('chartOpen initialised to false in WeightSummary (WeightDistribution)', () => {
  const chartOpenMatch = weightSummary.match(/const\s*\[chartOpen[^\]]*\]\s*=\s*useState\(([^)]+)\)/);
  assert.ok(chartOpenMatch, 'chartOpen useState should be present');
  assert.strictEqual(
    chartOpenMatch[1].trim(),
    'false',
    'chartOpen must initialise to false (022G requirement)'
  );
});

test('SharedChecklistPage does not force-override chartOpen', () => {
  // The shared page must not pass an open= or forceOpen= prop to WeightDistribution
  const distIdx = sharedPage.indexOf('<WeightDistribution');
  const block = sharedPage.slice(distIdx, distIdx + 400);
  assert.ok(
    !block.includes('forceOpen=') && !block.includes('open='),
    'SharedChecklistPage must not pass forceOpen or open to WeightDistribution'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nD. Palette state present in SharedChecklistContent');

test('chartPaletteKey state is declared in SharedChecklistPage', () => {
  assert.ok(
    sharedPage.includes('chartPaletteKey'),
    'chartPaletteKey state must be present in SharedChecklistPage'
  );
});

test('chartPaletteKey initialised to trail palette', () => {
  const match = sharedPage.match(/useState\(['"]trail['"]\)/);
  assert.ok(match, "chartPaletteKey should default to 'trail'");
});

test('setChartPaletteKey is passed as onPaletteChange', () => {
  const distIdx = sharedPage.indexOf('<WeightDistribution');
  const block = sharedPage.slice(distIdx, distIdx + 400);
  assert.ok(
    block.includes('setChartPaletteKey'),
    'onPaletteChange should use setChartPaletteKey'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nE. Calculation parity — same component + logic used by both views');

test('Both private Checklist and SharedChecklistPage use WeightDistribution from WeightSummary', () => {
  assert.ok(
    /import\s*\{[^}]*WeightDistribution[^}]*\}\s*from\s*['"][^'"]*WeightSummary['"]/.test(sharedPage),
    'SharedChecklistPage imports WeightDistribution from WeightSummary'
  );
  assert.ok(
    /import\s*\{[^}]*WeightDistribution[^}]*\}\s*from\s*['"][^'"]*WeightSummary['"]/.test(checklist),
    'Checklist.tsx imports WeightDistribution from WeightSummary'
  );
});

test('calcWeights function exists and uses checked items only', () => {
  assert.ok(
    weightSummary.includes('function calcWeights'),
    'calcWeights must exist in WeightSummary.tsx'
  );
  assert.ok(
    weightSummary.includes('.filter(i => i.checked)'),
    'calcWeights must filter by i.checked'
  );
});

test('calcWeights respects countsToBase via categoryMeta', () => {
  assert.ok(
    weightSummary.includes('countsToBase'),
    'calcWeights must handle countsToBase for Base Weight / non-base partitioning'
  );
});

test('calcTotalOz is used for per-item weight calculation', () => {
  assert.ok(
    weightSummary.includes('calcTotalOz'),
    'WeightSummary should use calcTotalOz for item weight × qty'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nF. Data source: shared store used (not owner private data)');

test('SharedChecklistContent store is initialised from snapshot (not localStorage)', () => {
  // The store should be initialised from snapshot.data, snapshot.categoryOrder, snapshot.categoryMeta
  const storeInit = sharedPage.match(/useState<Store>\(\(\)\s*=>\s*\(\{[\s\S]{0,200}snapshot\.data[\s\S]{0,100}snapshot\.categoryOrder[\s\S]{0,100}snapshot\.categoryMeta/);
  assert.ok(storeInit, 'store must be initialised from snapshot data');
});

test('WeightDistribution data is from store (in-memory, not localStorage reads)', () => {
  // store is never written to localStorage in SharedChecklistPage
  assert.ok(
    !sharedPage.includes("localStorage.setItem('trailweigh:"),
    'SharedChecklistPage must not write trailweigh: localStorage keys'
  );
});

test('SharedChecklistPage does not write last-active-file LS key', () => {
  assert.ok(
    !sharedPage.includes('last-active-file'),
    'SharedChecklistPage must not write or read last-active-file'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nG. 022I Share menu regression');

test('Share TrailWeigh List action still present', () => {
  assert.ok(
    sharedPage.includes('Share TrailWeigh List'),
    'Share TrailWeigh List must remain in Share menu'
  );
});

test('Share Checkable Packing List action still present', () => {
  assert.ok(
    sharedPage.includes('Share Checkable Packing List'),
    'Share Checkable Packing List must remain in Share menu'
  );
});

test('Download PDF action still present', () => {
  assert.ok(
    sharedPage.includes('Download PDF'),
    'Download PDF must remain in Share menu'
  );
});

test('buildShareURL still imported', () => {
  assert.ok(
    sharedPage.includes('buildShareURL'),
    'buildShareURL must still be imported and used'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nH. 022I panel-collapse regression');

test('allOpen initialised to false (022H)', () => {
  const match = sharedPage.match(/const\s*\[allOpen[^\]]*\]\s*=\s*useState\(([^)]+)\)/);
  assert.ok(match, 'allOpen useState must exist');
  assert.strictEqual(match[1].trim(), 'false', 'allOpen must initialise to false');
});

test('SharedLockerPanel open state true (022J: Shared Files starts OPEN)', () => {
  // 022J intentionally changed Shared Files to start OPEN
  const panelBlock = sharedPage.slice(
    sharedPage.indexOf('SharedLockerPanel'),
    sharedPage.indexOf('SharedLockerPanel') + 1200
  );
  const openMatch = panelBlock.match(/const\s*\[open[^\]]*\]\s*=\s*useState\(([^)]+)\)/);
  if (openMatch) {
    assert.strictEqual(openMatch[1].trim(), 'true', 'SharedLockerPanel open must be true (022J: starts open)');
  } else {
    assert.ok(
      panelBlock.includes('useState(true)'),
      'SharedLockerPanel must initialise open to true (022J)'
    );
  }
});

test('ImportGearPanel receives defaultOpen={true} in shared context (022J: Scan Gear List starts OPEN)', () => {
  // 022J intentionally changed Scan Gear List to start open in shared view
  const importIdx = sharedPage.indexOf('<ImportGearPanel');
  const block = sharedPage.slice(importIdx, importIdx + 300);
  assert.ok(
    block.includes('defaultOpen={true}'),
    'ImportGearPanel in shared context must pass defaultOpen={true} (022J: starts open)'
  );
});

test('GearCategory isOpen initialised to false', () => {
  const match = gearCat.match(/const\s*\[isOpen[^\]]*\]\s*=\s*useState\(([^)]+)\)/);
  assert.ok(match, 'isOpen useState must exist in GearCategory');
  assert.strictEqual(match[1].trim(), 'false', 'isOpen must initialise to false');
});

test('WeightSummary summaryOpen initialised to false', () => {
  const match = weightSummary.match(/const\s*\[summaryOpen[^\]]*\]\s*=\s*useState\(([^)]+)\)/);
  assert.ok(match, 'summaryOpen useState must exist');
  assert.strictEqual(match[1].trim(), 'false', 'summaryOpen must initialise to false (022G)');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nI. 022F footer regression');

test('Footer used with informationalOnly in SharedChecklistPage', () => {
  assert.ok(
    sharedPage.includes('informationalOnly'),
    'SharedChecklistPage Footer must use informationalOnly prop'
  );
});

test('Footer has flex-shrink-0 class', () => {
  assert.ok(
    footer.includes('flex-shrink-0'),
    'Footer must have flex-shrink-0 to stay in document flow'
  );
});

test('SharedChecklistPage outer wrapper has min-h-[100dvh] flex flex-col', () => {
  assert.ok(
    sharedPage.includes('min-h-[100dvh]') && sharedPage.includes('flex flex-col'),
    'SharedChecklistPage wrapper must have min-h-[100dvh] flex flex-col for footer to stay below content'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nJ. 022G private workspace isolation');

test('SharedChecklistPage does not write tw-active-locker-file key', () => {
  assert.ok(
    !sharedPage.includes('tw-active-locker-file'),
    'SharedChecklistPage must not touch tw-active-locker-file sessionStorage key'
  );
});

test('Checklist.tsx has last-active-file LS key for workspace restore', () => {
  assert.ok(
    checklist.includes('last-active-file'),
    'Checklist.tsx must have last-active-file logic for 022G workspace restore'
  );
});

test('SharedChecklistPage does not contain last-active-file writes', () => {
  assert.ok(
    !sharedPage.includes('last-active-file'),
    'SharedChecklistPage must not write last-active-file (022G isolation)'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nK. Private Checklist WeightDistribution unchanged');

test('Private Checklist still renders WeightDistribution', () => {
  assert.ok(
    checklist.includes('<WeightDistribution'),
    'Private Checklist must still render WeightDistribution'
  );
});

test('Private WeightDistribution still receives paletteKey', () => {
  const distIdx = checklist.indexOf('<WeightDistribution');
  const block = checklist.slice(distIdx, distIdx + 300);
  assert.ok(
    block.includes('paletteKey='),
    'Private WeightDistribution must still receive paletteKey'
  );
});

test('Private WeightDistribution still receives onPaletteChange', () => {
  const distIdx = checklist.indexOf('<WeightDistribution');
  const block = checklist.slice(distIdx, distIdx + 300);
  assert.ok(
    block.includes('onPaletteChange='),
    'Private WeightDistribution must still receive onPaletteChange'
  );
});

test('WeightDistribution exported from WeightSummary.tsx', () => {
  assert.ok(
    /export\s+function\s+WeightDistribution/.test(weightSummary),
    'WeightDistribution must be exported from WeightSummary.tsx'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nL. Checkable packing list remains simple');

test('checkable type defined in shareLink.ts', () => {
  assert.ok(
    shareLink.includes("'checkable'") || shareLink.includes('"checkable"'),
    "shareLink.ts must define 'checkable' type"
  );
});

test('WeightSummary also absent from checkable guard area (PackSummary not gated, WeightDistribution is)', () => {
  // WeightSummary (Pack Summary) does NOT need a checkable guard — verify WeightDistribution
  // is the one that's gated
  const summaryIdx = sharedPage.indexOf('<WeightSummary');
  const distIdx = sharedPage.indexOf('<WeightDistribution');
  assert.ok(summaryIdx !== -1 && distIdx !== -1, 'Both components must be present');
  // The WeightDistribution guard should be between WeightSummary and WeightDistribution
  const guardIdx = sharedPage.indexOf("snapshot.type !== 'checkable'", summaryIdx);
  assert.ok(
    guardIdx !== -1 && guardIdx < distIdx,
    'The checkable guard should appear after WeightSummary but before WeightDistribution'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
const total = passed + failed;
console.log(`\n022J Weight Distribution Shared — ${passed}/${total} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
