/**
 * Prompt 022J — Consistent Native Share + Default Panel State
 *
 * Source-level tests covering:
 * A. Private Checklist panel defaults (Scan Gear List open, Locker open)
 * B. Shared view panel defaults (Scan Gear List open, Shared Files open)
 * C. Gear categories remain collapsed
 * D. Pack Summary / Weight Distribution remain collapsed
 * E. Native share — private Checklist uses navigator.share
 * F. Native share — shared view uses navigator.share (both actions)
 * G. Consistent share labels across private and shared views
 * H. Copy-link fallback still present
 * I. Share Checkable Packing List uses type:'checkable' in private Checklist
 * J. 022I shared share menu regression (3 actions still present)
 * K. 022F footer regression
 * L. 022G private workspace isolation
 * M. handleShareCheckableList replaces handleSharePackList in private Checklist
 */

import { readFileSync } from 'fs';
import { strict as assert } from 'assert';

const checklist = readFileSync(
  'artifacts/pack-checklist/src/pages/Checklist.tsx', 'utf8'
);
const sharedPage = readFileSync(
  'artifacts/pack-checklist/src/pages/SharedChecklistPage.tsx', 'utf8'
);
const weightSummary = readFileSync(
  'artifacts/pack-checklist/src/components/WeightSummary.tsx', 'utf8'
);
const gearCat = readFileSync(
  'artifacts/pack-checklist/src/components/GearCategory.tsx', 'utf8'
);
const lockerPanel = readFileSync(
  'artifacts/pack-checklist/src/components/LockerPanel.tsx', 'utf8'
);
const importPanel = readFileSync(
  'artifacts/pack-checklist/src/components/ImportGearPanel.tsx', 'utf8'
);
const shareLink = readFileSync(
  'artifacts/pack-checklist/src/lib/shareLink.ts', 'utf8'
);
const footer = readFileSync(
  'artifacts/pack-checklist/src/components/Footer.tsx', 'utf8'
);

let passed = 0;
let failed = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✓ ${name}`); passed++; }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); failed++; }
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nA. Private Checklist — Scan Gear List and Locker start open');

test('ImportGearPanel defaultOpen defaults to true (component)', () => {
  // Component default parameter or internal useState must be true
  assert.ok(
    importPanel.includes('defaultOpen = true') || importPanel.includes("defaultOpen: true"),
    'ImportGearPanel must default to open (defaultOpen = true)'
  );
});

test('ImportGearPanel open state initialised from defaultOpen', () => {
  assert.ok(
    importPanel.includes('useState(defaultOpen)'),
    'ImportGearPanel must init open state from defaultOpen prop'
  );
});

test('Private Checklist does not pass defaultOpen={false} to ImportGearPanel', () => {
  // Find the ImportGearPanel usage in Checklist.tsx
  const importIdx = checklist.indexOf('<ImportGearPanel');
  const block = checklist.slice(importIdx, importIdx + 400);
  assert.ok(
    !block.includes('defaultOpen={false}'),
    'Private Checklist must not pass defaultOpen={false} to ImportGearPanel (should start open)'
  );
});

test('LockerPanel starts open via internal useState(true)', () => {
  assert.ok(
    lockerPanel.includes('useState(true)'),
    'LockerPanel must initialise open to true'
  );
});

test('LockerPanel has no defaultOpen prop (always starts open)', () => {
  // LockerPanel has no external defaultOpen prop — it always starts open
  assert.ok(
    !lockerPanel.includes('defaultOpen'),
    'LockerPanel should not have a defaultOpen prop; open state is internal'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nB. Shared view — Scan Gear List and Shared Files start open');

test('SharedLockerPanel (Shared Files) initialises open to true', () => {
  // The SharedLockerPanel sub-component in SharedChecklistPage must init open = true
  const panelStart = sharedPage.indexOf('function SharedLockerPanel');
  const panelBlock = sharedPage.slice(panelStart, panelStart + 800);
  const match = panelBlock.match(/const\s*\[open[^\]]*\]\s*=\s*useState\(([^)]+)\)/);
  assert.ok(match, 'SharedLockerPanel must have useState for open');
  assert.strictEqual(match[1].trim(), 'true', 'SharedLockerPanel open must init to true (022J)');
});

test('ImportGearPanel receives defaultOpen={true} in shared context', () => {
  // Find the ImportGearPanel usage in SharedChecklistPage
  const importIdx = sharedPage.indexOf('<ImportGearPanel');
  assert.ok(importIdx !== -1, '<ImportGearPanel must exist in SharedChecklistPage');
  const block = sharedPage.slice(importIdx, importIdx + 300);
  assert.ok(
    block.includes('defaultOpen={true}') || !block.includes('defaultOpen={false}'),
    'ImportGearPanel in shared context must not pass defaultOpen={false}'
  );
});

test('SharedChecklistPage ImportGearPanel explicitly sets defaultOpen={true}', () => {
  const importIdx = sharedPage.indexOf('<ImportGearPanel');
  const block = sharedPage.slice(importIdx, importIdx + 300);
  assert.ok(
    block.includes('defaultOpen={true}'),
    'SharedChecklistPage should explicitly pass defaultOpen={true} to ImportGearPanel'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nC. Gear categories remain collapsed');

test('GearCategory isOpen initialised to false', () => {
  const match = gearCat.match(/const\s*\[isOpen[^\]]*\]\s*=\s*useState\(([^)]+)\)/);
  assert.ok(match, 'isOpen useState must exist in GearCategory');
  assert.strictEqual(match[1].trim(), 'false', 'isOpen must initialise to false');
});

test('Private Checklist allOpen initialised to false', () => {
  const match = checklist.match(/const\s*\[allOpen[^\]]*\]\s*=\s*useState\(([^)]+)\)/);
  assert.ok(match, 'allOpen must exist in Checklist');
  assert.strictEqual(match[1].trim(), 'false', 'allOpen must start false (categories collapsed)');
});

test('SharedChecklistPage allOpen initialised to false', () => {
  const match = sharedPage.match(/const\s*\[allOpen[^\]]*\]\s*=\s*useState\(([^)]+)\)/);
  assert.ok(match, 'allOpen must exist in SharedChecklistPage');
  assert.strictEqual(match[1].trim(), 'false', 'allOpen must start false (categories collapsed)');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nD. Pack Summary and Weight Distribution remain collapsed');

test('WeightSummary summaryOpen initialised to false', () => {
  const match = weightSummary.match(/const\s*\[summaryOpen[^\]]*\]\s*=\s*useState\(([^)]+)\)/);
  assert.ok(match, 'summaryOpen must exist in WeightSummary');
  assert.strictEqual(match[1].trim(), 'false', 'summaryOpen must init false');
});

test('WeightDistribution chartOpen initialised to false', () => {
  const match = weightSummary.match(/const\s*\[chartOpen[^\]]*\]\s*=\s*useState\(([^)]+)\)/);
  assert.ok(match, 'chartOpen must exist in WeightSummary');
  assert.strictEqual(match[1].trim(), 'false', 'chartOpen must init false');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nE. Native share — private Checklist uses navigator.share');

test('handleShareLocker uses navigator.share', () => {
  const fnStart = checklist.indexOf('handleShareLocker');
  const fnBlock = checklist.slice(fnStart, fnStart + 2500);
  assert.ok(
    fnBlock.includes('navigator.share'),
    'handleShareLocker must call navigator.share when available'
  );
});

test('handleShareCheckableList in private Checklist uses navigator.share', () => {
  // handleShareCheckableList must be defined in Checklist and use navigator.share
  assert.ok(
    checklist.includes('handleShareCheckableList'),
    'handleShareCheckableList must exist in Checklist.tsx'
  );
  const fnStart = checklist.indexOf('const handleShareCheckableList');
  const fnBlock = checklist.slice(fnStart, fnStart + 1000);
  assert.ok(
    fnBlock.includes('navigator.share'),
    'handleShareCheckableList must call navigator.share when available'
  );
});

test('Private Checklist has try/catch around navigator.share', () => {
  // navigator.share throws if user dismisses — must be caught
  const fnStart = checklist.indexOf('const handleShareCheckableList');
  const fnBlock = checklist.slice(fnStart, fnStart + 1000);
  assert.ok(
    fnBlock.includes('try') && fnBlock.includes('catch'),
    'navigator.share must be wrapped in try/catch to handle user dismissal'
  );
});

test('Private handleShareLocker has try/catch around navigator.share', () => {
  const fnStart = checklist.indexOf('handleShareLocker =');
  const fnBlock = checklist.slice(fnStart, fnStart + 2500);
  assert.ok(
    fnBlock.includes('try') && fnBlock.includes('catch'),
    'handleShareLocker navigator.share must be wrapped in try/catch'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nF. Native share — shared view uses navigator.share for both actions');

test('handleShareTrailWeighList in SharedChecklistPage uses navigator.share', () => {
  const fnStart = sharedPage.indexOf('handleShareTrailWeighList');
  const fnBlock = sharedPage.slice(fnStart, fnStart + 600);
  assert.ok(
    fnBlock.includes('navigator.share'),
    'handleShareTrailWeighList must use navigator.share'
  );
});

test('handleShareCheckableList in SharedChecklistPage uses navigator.share', () => {
  const fnStart = sharedPage.indexOf('handleShareCheckableList');
  const fnBlock = sharedPage.slice(fnStart, fnStart + 1000);
  assert.ok(
    fnBlock.includes('navigator.share'),
    'handleShareCheckableList in SharedChecklistPage must use navigator.share (022J update)'
  );
});

test('SharedChecklistPage handleShareCheckableList has try/catch', () => {
  const fnStart = sharedPage.indexOf('const handleShareCheckableList');
  const fnBlock = sharedPage.slice(fnStart, fnStart + 1000);
  assert.ok(
    fnBlock.includes('try') && fnBlock.includes('catch'),
    'handleShareCheckableList must wrap navigator.share in try/catch'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nG. Consistent share labels across private and shared views');

test('Private Checklist menu has Share TrailWeigh List label', () => {
  assert.ok(
    checklist.includes('Share TrailWeigh List'),
    'Private Checklist share menu must use label "Share TrailWeigh List"'
  );
});

test('Private Checklist menu has Share Checkable Packing List label', () => {
  assert.ok(
    checklist.includes('Share Checkable Packing List'),
    'Private Checklist share menu must use label "Share Checkable Packing List"'
  );
});

test('SharedChecklistPage has Share TrailWeigh List label', () => {
  assert.ok(
    sharedPage.includes('Share TrailWeigh List'),
    'SharedChecklistPage share menu must use label "Share TrailWeigh List"'
  );
});

test('SharedChecklistPage has Share Checkable Packing List label', () => {
  assert.ok(
    sharedPage.includes('Share Checkable Packing List'),
    'SharedChecklistPage share menu must use label "Share Checkable Packing List"'
  );
});

test('Private Checklist no longer uses "Share Link" label', () => {
  // The old "Share Link" label should be replaced with "Share TrailWeigh List"
  // Note: the locker-warning text "Share Link Anyway" is still valid — we check only the menu item label
  const menuBlock = checklist.slice(
    checklist.indexOf('shareStep === \'menu\''),
    checklist.indexOf('shareStep === \'menu\'') + 800
  );
  assert.ok(
    !menuBlock.includes("'Share Link'") && !menuBlock.includes('"Share Link"'),
    'Private Checklist menu item should use "Share TrailWeigh List" not "Share Link"'
  );
});

test('Private Checklist no longer uses "Share Pack List" label', () => {
  // Old "Share Pack List" replaced by "Share Checkable Packing List"
  assert.ok(
    !checklist.includes("'Share Pack List'") && !checklist.includes('"Share Pack List"'),
    'Private Checklist must not use "Share Pack List" label'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nH. Copy-link fallback still present');

test('Private Checklist copyUrlToClipboard still used as fallback', () => {
  const fn1Start = checklist.indexOf('const handleShareCheckableList');
  const fn1Block = checklist.slice(fn1Start, fn1Start + 1000);
  assert.ok(
    fn1Block.includes('copyUrlToClipboard'),
    'handleShareCheckableList must use copyUrlToClipboard as fallback'
  );
});

test('handleShareLocker still uses copyUrlToClipboard as fallback', () => {
  const fnStart = checklist.indexOf('handleShareLocker =');
  const fnBlock = checklist.slice(fnStart, fnStart + 2500);
  assert.ok(
    fnBlock.includes('copyUrlToClipboard'),
    'handleShareLocker must use copyUrlToClipboard when navigator.share unavailable'
  );
});

test('SharedChecklistPage copyUrlToClipboard still present', () => {
  assert.ok(
    sharedPage.includes('copyUrlToClipboard'),
    'SharedChecklistPage must still have copyUrlToClipboard fallback'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nI. Share Checkable Packing List uses type:checkable in private Checklist');

test("handleShareCheckableList in Checklist builds type:'checkable' payload", () => {
  const fnStart = checklist.indexOf('const handleShareCheckableList');
  const fnBlock = checklist.slice(fnStart, fnStart + 800);
  assert.ok(
    fnBlock.includes("'checkable'") || fnBlock.includes('"checkable"'),
    "handleShareCheckableList must build a type:'checkable' payload"
  );
});

test('handleShareCheckableList in Checklist has no lockerFiles', () => {
  const fnStart = checklist.indexOf('const handleShareCheckableList');
  const fnBlock = checklist.slice(fnStart, fnStart + 800);
  // Checkable list must not include lockerFiles to avoid exposing all saved files
  assert.ok(
    !fnBlock.includes('lockerFiles'),
    'Checkable Packing List share must not include lockerFiles'
  );
});

test("checkable type is defined in shareLink.ts", () => {
  assert.ok(
    shareLink.includes("'checkable'") || shareLink.includes('"checkable"'),
    "shareLink.ts must define 'checkable' as a valid SharePayload type"
  );
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nJ. 022I shared share menu regression');

test('SharedChecklistPage Share TrailWeigh List still present', () => {
  assert.ok(sharedPage.includes('Share TrailWeigh List'), 'Share TrailWeigh List must remain');
});

test('SharedChecklistPage Share Checkable Packing List still present', () => {
  assert.ok(sharedPage.includes('Share Checkable Packing List'), 'Share Checkable Packing List must remain');
});

test('SharedChecklistPage Download PDF still present', () => {
  assert.ok(sharedPage.includes('Download PDF'), 'Download PDF must remain in shared view');
});

test('Private Checklist Download PDF still present', () => {
  assert.ok(checklist.includes('Download PDF'), 'Download PDF must remain in private Checklist');
});

test('Private Checklist has 3 share actions (TrailWeigh List, Checkable, PDF)', () => {
  assert.ok(checklist.includes('Share TrailWeigh List'), 'Share TrailWeigh List present');
  assert.ok(checklist.includes('Share Checkable Packing List'), 'Share Checkable Packing List present');
  assert.ok(checklist.includes('Download PDF'), 'Download PDF present');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nK. 022F footer regression');

test('SharedChecklistPage footer wrapper has min-h-[100dvh] flex flex-col', () => {
  assert.ok(
    sharedPage.includes('min-h-[100dvh]') && sharedPage.includes('flex flex-col'),
    'SharedChecklistPage wrapper must maintain min-h-[100dvh] flex flex-col'
  );
});

test('Footer has flex-shrink-0', () => {
  assert.ok(footer.includes('flex-shrink-0'), 'Footer must have flex-shrink-0');
});

test('SharedChecklistPage uses informationalOnly footer', () => {
  assert.ok(sharedPage.includes('informationalOnly'), 'Footer must be informationalOnly in shared view');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nL. 022G private workspace isolation');

test('SharedChecklistPage does not write last-active-file', () => {
  assert.ok(
    !sharedPage.includes('last-active-file'),
    'SharedChecklistPage must not touch last-active-file LS key'
  );
});

test('Private Checklist has last-active-file restoration logic', () => {
  assert.ok(
    checklist.includes('last-active-file'),
    'Checklist must retain last-active-file logic for 022G workspace restore'
  );
});

test('SharedChecklistPage does not write to localStorage', () => {
  assert.ok(
    !sharedPage.includes("localStorage.setItem('trailweigh:"),
    'SharedChecklistPage must not write trailweigh: localStorage keys'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nM. handleShareCheckableList replaces handleSharePackList in private Checklist');

test('handleSharePackList no longer exists in private Checklist', () => {
  assert.ok(
    !checklist.includes('handleSharePackList'),
    'handleSharePackList should be replaced by handleShareCheckableList'
  );
});

test('copiedPackList state replaced by copiedCheckable', () => {
  assert.ok(
    !checklist.includes('copiedPackList'),
    'copiedPackList state should be replaced by copiedCheckable'
  );
  assert.ok(
    checklist.includes('copiedCheckable'),
    'copiedCheckable state must exist in Checklist'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
const total = passed + failed;
console.log(`\n022J Panel Defaults + Native Share — ${passed}/${total} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
