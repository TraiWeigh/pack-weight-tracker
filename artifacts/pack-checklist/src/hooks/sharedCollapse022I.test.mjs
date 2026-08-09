/**
 * Prompt 022I — Complete Shared-Link Collapse & Share Behavior
 *
 * Source-level tests covering:
 * 1. SharedLockerPanel starts collapsed
 * 2. ImportGearPanel starts collapsed in shared-link context (defaultOpen=false)
 * 3. Share menu has all three required actions
 * 4. Checkable packing-list mode hides Scan Gear List and bg picker
 * 5. shareLink.ts accepts 'checkable' type
 * 6. 022F/022G/022H regressions
 */

import { readFileSync } from 'fs';
import { strict as assert } from 'assert';

const sharedPage = readFileSync(
  'artifacts/pack-checklist/src/pages/SharedChecklistPage.tsx', 'utf8'
);
const importPanel = readFileSync(
  'artifacts/pack-checklist/src/components/ImportGearPanel.tsx', 'utf8'
);
const shareLink = readFileSync(
  'artifacts/pack-checklist/src/lib/shareLink.ts', 'utf8'
);
const gearCat = readFileSync(
  'artifacts/pack-checklist/src/components/GearCategory.tsx', 'utf8'
);
const weightSummary = readFileSync(
  'artifacts/pack-checklist/src/components/WeightSummary.tsx', 'utf8'
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
console.log('\nA. SharedLockerPanel starts collapsed');

test('SharedLockerPanel open state initialised to true (022J: Shared Files starts OPEN)', () => {
  // 022J intentionally changed Shared Files to start OPEN (was false in 022I)
  const panelBlock = sharedPage.slice(
    sharedPage.indexOf('SharedLockerPanel'),
    sharedPage.indexOf('SharedLockerPanel') + 800
  );
  assert.match(panelBlock, /useState\s*\(\s*true\s*\)/,
    'SharedLockerPanel must use useState(true) so Shared Files starts open (022J)');
});

test('SharedLockerPanel uses useState(true) for open state (022J: Shared Files starts OPEN)', () => {
  // 022J intentionally changed Shared Files to start open; useState(true) is now correct
  const panelBlock = sharedPage.slice(
    sharedPage.indexOf('SharedLockerPanel'),
    sharedPage.indexOf('SharedLockerPanel') + 800
  );
  assert.ok(
    /const\s+\[open[^\]]*\]\s*=\s*useState\s*\(\s*true\s*\)/.test(panelBlock),
    'SharedLockerPanel must initialise open to true (022J: starts open)'
  );
});

test('SharedLockerPanel header/chevron still renders (panel still exists)', () => {
  assert.match(sharedPage, /Shared Files/,
    'SharedLockerPanel must still render — do not remove it, just start it collapsed');
});

test('SharedLockerPanel toggle handler still present', () => {
  // The panel must still be toggleable
  const panelBlock = sharedPage.slice(
    sharedPage.indexOf('SharedLockerPanel'),
    sharedPage.indexOf('SharedLockerPanel') + 800
  );
  assert.match(panelBlock, /setOpen/,
    'SharedLockerPanel must still have a setOpen toggle so user can expand it');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nB. ImportGearPanel defaultOpen prop');

test('ImportGearPanel has defaultOpen prop in interface', () => {
  assert.match(importPanel, /defaultOpen\s*\??\s*:\s*boolean/,
    'ImportGearPanelProps must include defaultOpen?: boolean');
});

test('ImportGearPanel uses defaultOpen to initialise open state', () => {
  assert.match(importPanel, /useState\s*\(\s*defaultOpen/,
    'ImportGearPanel must initialise open state from defaultOpen prop');
});

test('ImportGearPanel defaultOpen defaults to true (private Checklist preserved)', () => {
  assert.match(importPanel, /defaultOpen\s*=\s*true/,
    'defaultOpen must default to true so private Checklist behavior is unchanged');
});

test('ImportGearPanel does NOT hard-code useState(true) for open', () => {
  // The open state must no longer be a hard-coded true
  const componentBlock = importPanel.slice(importPanel.indexOf('export function ImportGearPanel'));
  // Should not start with useState(true) now
  assert.ok(
    !/const\s+\[open[^\]]*\]\s*=\s*useState\s*\(\s*true\s*\)/.test(componentBlock),
    'ImportGearPanel open must not be hard-coded to true — it must use defaultOpen'
  );
});

test('SharedChecklistPage passes defaultOpen={true} to ImportGearPanel (022J: Scan Gear List starts OPEN)', () => {
  // 022J intentionally changed Scan Gear List to start open in shared view
  assert.match(sharedPage, /defaultOpen\s*=\s*\{true\}/,
    'SharedChecklistPage must pass defaultOpen={true} to ImportGearPanel so Scan Gear List starts open (022J)');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nC. Share menu has all three required actions');

test('Share menu has Share TrailWeigh List action', () => {
  assert.match(sharedPage, /Share TrailWeigh List/,
    'Share menu must contain "Share TrailWeigh List" action');
});

test('Share menu has Share Checkable Packing List action', () => {
  assert.match(sharedPage, /Share Checkable Packing List/,
    'Share menu must contain "Share Checkable Packing List" action');
});

test('Share menu has Download PDF action', () => {
  assert.match(sharedPage, /Download PDF/,
    'Share menu must still contain "Download PDF" action');
});

test('Share TrailWeigh List uses current page URL (window.location.href)', () => {
  assert.match(sharedPage, /window\.location\.href/,
    'handleShareTrailWeighList must use window.location.href to share the current shared URL');
});

test('Share TrailWeigh List does not create a new owner record', () => {
  // It must use the current URL, not buildShareURL (which would create a new snapshot)
  const handlerBlock = sharedPage.slice(
    sharedPage.indexOf('handleShareTrailWeighList'),
    sharedPage.indexOf('handleShareTrailWeighList') + 600
  );
  assert.ok(
    !handlerBlock.includes('buildShareURL'),
    'handleShareTrailWeighList must NOT call buildShareURL — it re-uses the current URL'
  );
});

test('Share TrailWeigh List tries Web Share API first', () => {
  const handlerBlock = sharedPage.slice(
    sharedPage.indexOf('handleShareTrailWeighList'),
    sharedPage.indexOf('handleShareTrailWeighList') + 600
  );
  assert.match(handlerBlock, /navigator\.share/,
    'handleShareTrailWeighList should try navigator.share for native mobile sharing');
});

test('Share Checkable Packing List calls buildShareURL', () => {
  const handlerBlock = sharedPage.slice(
    sharedPage.indexOf('handleShareCheckableList'),
    sharedPage.indexOf('handleShareCheckableList') + 800
  );
  assert.match(handlerBlock, /buildShareURL/,
    'handleShareCheckableList must call buildShareURL to generate a new packing-list URL');
});

test('Share Checkable Packing List sets type to checkable', () => {
  const handlerBlock = sharedPage.slice(
    sharedPage.indexOf('handleShareCheckableList'),
    sharedPage.indexOf('handleShareCheckableList') + 800
  );
  assert.match(handlerBlock, /type\s*:\s*['"]checkable['"]/,
    'handleShareCheckableList must set type: "checkable" in the share payload');
});

test('Share Checkable Packing List does NOT assign lockerFiles in payload', () => {
  const handlerBlock = sharedPage.slice(
    sharedPage.indexOf('handleShareCheckableList'),
    sharedPage.indexOf('handleShareCheckableList') + 800
  );
  // The handler must not assign lockerFiles as a property (comments referencing it are fine)
  assert.ok(
    !/lockerFiles\s*:/.test(handlerBlock),
    'handleShareCheckableList must not set lockerFiles: in the share payload — checkable list is single-file only'
  );
});

test('Share menu has separator between share actions and PDF', () => {
  assert.match(sharedPage, /border-t border-border/,
    'Share menu should have a visual separator between sharing actions and Download PDF');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nD. Checkable packing-list mode hides tools');

test("'checkable' type hides ImportGearPanel", () => {
  assert.match(sharedPage, /snapshot\.type\s*!==\s*['"]checkable['"]/,
    'ImportGearPanel must be conditionally hidden when snapshot.type === "checkable"');
});

test("'checkable' type hides background picker button", () => {
  // The bg picker conditional must guard the BackgroundPickerButton render.
  // Find the second occurrence (first is the import line).
  const firstIdx = sharedPage.indexOf('BackgroundPickerButton');
  const renderIdx = sharedPage.indexOf('BackgroundPickerButton', firstIdx + 1);
  assert.ok(renderIdx !== -1, 'BackgroundPickerButton render site not found');
  // Walk back up to 400 chars to find the wrapping conditional
  const surroundingBlock = sharedPage.slice(Math.max(0, renderIdx - 400), renderIdx + 100);
  assert.match(surroundingBlock, /snapshot\.type\s*!==\s*['"]checkable['"]/,
    'Background picker must be conditionally hidden when snapshot.type === "checkable"');
});

test("Checkable mode does NOT hide gear categories or Pack Summary", () => {
  // allOpen, WeightSummary, and GearCategory must not be conditionally hidden by type
  // (they are simply collapsed, not removed)
  assert.ok(
    !sharedPage.includes("type !== 'checkable' && <WeightSummary"),
    'WeightSummary must NOT be conditionally removed for checkable mode — only collapsed'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nE. shareLink.ts accepts checkable type');

test("shareLink.ts type union includes 'checkable'", () => {
  assert.match(shareLink, /['"]checkable['"]/,
    "SharePayload.type must include 'checkable' so the type field is valid");
});

test("shareLink.ts still includes 'locker' and 'pack-list' (no regression)", () => {
  assert.match(shareLink, /['"]locker['"]/,
    "SharePayload.type must still include 'locker'");
  assert.match(shareLink, /['"]pack-list['"]/,
    "SharePayload.type must still include 'pack-list'");
});

test('buildShareURL is imported in SharedChecklistPage', () => {
  assert.match(sharedPage, /import.*buildShareURL.*from.*shareLink/s,
    'SharedChecklistPage must import buildShareURL to generate checkable-list URLs');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nF. 022H regressions — gear categories and WeightSummary still collapsed');

test('allOpen still initialised to false (022H not regressed)', () => {
  assert.match(sharedPage, /const\s+\[allOpen[^\]]*\]\s*=\s*useState\s*\(\s*false\s*\)/,
    '022H: allOpen must still init to false so gear categories start collapsed');
});

test('GearCategory isOpen still initialised to false (022G not regressed)', () => {
  assert.match(gearCat, /const\s+\[isOpen[^\]]*\]\s*=\s*useState\s*\(\s*false\s*\)/,
    '022G: GearCategory isOpen must remain false');
});

test('WeightSummary summaryOpen still initialised to false (022G not regressed)', () => {
  assert.match(weightSummary, /const\s+\[summaryOpen[^\]]*\]\s*=\s*useState\s*\(\s*false\s*\)/,
    '022G: summaryOpen must remain false');
});

test('WeightSummary chartOpen still initialised to false (022G not regressed)', () => {
  assert.match(weightSummary, /const\s+\[chartOpen[^\]]*\]\s*=\s*useState\s*\(\s*false\s*\)/,
    '022G: chartOpen must remain false');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nG. 022F footer regression protection');

test('022F: outer wrapper uses min-h-[100dvh]', () => {
  assert.match(sharedPage, /screen-only min-h-\[100dvh\]/,
    '022F: outer wrapper must be min-h-[100dvh]');
});

test('022F: header has sticky top-0', () => {
  assert.match(sharedPage, /sticky top-0/,
    '022F: header must be sticky top-0');
});

test('022F: backgroundAttachment fixed present', () => {
  assert.match(sharedPage, /backgroundAttachment\s*:\s*['"]fixed['"]/,
    '022F: backgroundAttachment must be fixed for scroll');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nH. 022G private-workspace isolation preserved');

test('SharedChecklistPage does not write last-active-file key', () => {
  assert.ok(
    !sharedPage.includes('last-active-file') && !sharedPage.includes('LAST_ACTIVE_FILE'),
    'SharedChecklistPage must not write to last-active-file (private workspace key)'
  );
});

test('handleShareCheckableList does not write to localStorage', () => {
  const handlerBlock = sharedPage.slice(
    sharedPage.indexOf('handleShareCheckableList'),
    sharedPage.indexOf('handleShareCheckableList') + 800
  );
  assert.ok(
    !handlerBlock.includes('localStorage'),
    'handleShareCheckableList must never write to localStorage'
  );
});

test('handleShareTrailWeighList does not write to localStorage', () => {
  const handlerBlock = sharedPage.slice(
    sharedPage.indexOf('handleShareTrailWeighList'),
    sharedPage.indexOf('handleShareTrailWeighList') + 600
  );
  assert.ok(
    !handlerBlock.includes('localStorage'),
    'handleShareTrailWeighList must never write to localStorage'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nI. Owner-file protection');

test('SharedChecklistPage never writes to owner Locker key', () => {
  // SharedChecklistPage must not write to 'trailweigh:locker' (owner's Locker)
  assert.ok(
    !sharedPage.includes("'trailweigh:locker'"),
    'SharedChecklistPage must never write to trailweigh:locker'
  );
});

test('Save Your Own Copy dialog still present (not merged into Share)', () => {
  assert.match(sharedPage, /showSaveDialog/,
    'Save Your Own Copy must still exist as a separate feature — not merged into Share');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nJ. Shared-link permissions unchanged');

test('SharedLockerPanel has no Rename button/handler', () => {
  const panelBlock = sharedPage.slice(
    sharedPage.indexOf('function SharedLockerPanel'),
    sharedPage.indexOf('function SharedLockerPanel') + 2000
  );
  // Check for absence of actual rename onClick/handler — comments documenting absence are fine
  assert.ok(
    !/onRename|onClick.*[Rr]ename|handleRename/.test(panelBlock),
    'SharedLockerPanel must not have an actual Rename onClick or handler'
  );
});

test('SharedLockerPanel has no Delete button/handler', () => {
  const panelBlock = sharedPage.slice(
    sharedPage.indexOf('function SharedLockerPanel'),
    sharedPage.indexOf('function SharedLockerPanel') + 2000
  );
  // Check for absence of actual delete onClick/handler — comments documenting absence are fine
  assert.ok(
    !/onDelete|onClick.*[Dd]elete|handleDelete/.test(panelBlock),
    'SharedLockerPanel must not have an actual Delete onClick or handler'
  );
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nK. Footer design unchanged');

test('Footer print:hidden class present', () => {
  assert.match(footer, /print:hidden/,
    'Footer must still have print:hidden class');
});

test('Footer background colour unchanged', () => {
  assert.match(footer, /#1e2322/,
    'Footer must still use #1e2322 background colour');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n────────────────────────────────────────────────────────────');
console.log(`022I Shared Collapse & Share: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
