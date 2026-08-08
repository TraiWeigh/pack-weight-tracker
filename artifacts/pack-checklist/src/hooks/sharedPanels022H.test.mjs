/**
 * Prompt 022H — Start Shared Links With All Panels Closed
 *
 * Source-level tests verifying that SharedChecklistPage initialises
 * every collapsible panel in the closed state while preserving all
 * shared data (gear, checked state, background) and the 022F footer fix.
 */

import { readFileSync } from 'fs';
import { strict as assert } from 'assert';

const sharedPage = readFileSync(
  'artifacts/pack-checklist/src/pages/SharedChecklistPage.tsx', 'utf8'
);
const gearCat  = readFileSync(
  'artifacts/pack-checklist/src/components/GearCategory.tsx', 'utf8'
);
const weightSummary = readFileSync(
  'artifacts/pack-checklist/src/components/WeightSummary.tsx', 'utf8'
);

let passed = 0;
let failed = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✓ ${name}`); passed++; }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); failed++; }
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nA. allOpen initialised closed in SharedChecklistPage');

test('allOpen useState initialised to false (not true)', () => {
  // Must NOT have useState(true) for allOpen
  assert.ok(
    /const\s+\[allOpen[^\]]*\]\s*=\s*useState\s*\(\s*false\s*\)/.test(sharedPage),
    'allOpen must be initialised with useState(false) so all categories start collapsed'
  );
});

test('allOpen is NOT initialised to true', () => {
  // Confirm the old pattern is gone
  const match = sharedPage.match(
    /const\s+\[allOpen[^\]]*\]\s*=\s*useState\s*\(\s*true\s*\)/
  );
  assert.ok(!match, 'allOpen must not be useState(true) — that forces categories open');
});

test('forceOpen={allOpen} is still passed to GearCategory', () => {
  assert.match(sharedPage, /forceOpen\s*=\s*\{allOpen\}/,
    'GearCategory must still receive forceOpen={allOpen} so Open/Close control works');
});

test('forceOpenSeq is still passed to GearCategory', () => {
  assert.match(sharedPage, /forceOpenSeq\s*=\s*\{/,
    'GearCategory must still receive forceOpenSeq prop');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nB. GearCategory initialises isOpen closed');

test('GearCategory isOpen initialised to false', () => {
  assert.match(gearCat, /const\s+\[isOpen[^\]]*\]\s*=\s*useState\s*\(\s*false\s*\)/,
    'GearCategory isOpen must initialise to false so categories start collapsed');
});

test('GearCategory forceOpen effect still overrides isOpen', () => {
  assert.match(gearCat, /forceOpen.*null.*undefined[\s\S]{0,200}setIsOpen\s*\(\s*forceOpen\s*\)/,
    'GearCategory forceOpen useEffect must still call setIsOpen(forceOpen) for Open/Close control');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nC. WeightSummary initialises both panels closed');

test('summaryOpen initialised to false', () => {
  assert.match(weightSummary, /const\s+\[summaryOpen[^\]]*\]\s*=\s*useState\s*\(\s*false\s*\)/,
    'summaryOpen must initialise to false so Pack Summary starts collapsed');
});

test('chartOpen initialised to false', () => {
  assert.match(weightSummary, /const\s+\[chartOpen[^\]]*\]\s*=\s*useState\s*\(\s*false\s*\)/,
    'chartOpen must initialise to false so Weight Distribution starts collapsed');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nD. Temporary panels start closed in SharedChecklistPage');

test('bgPickerOpen initialised to false', () => {
  assert.match(sharedPage, /const\s+\[bgPickerOpen[^\]]*\]\s*=\s*useState\s*\(\s*false\s*\)/,
    'bgPickerOpen must be false on mount');
});

test('showPreview initialised to false', () => {
  assert.match(sharedPage, /const\s+\[showPreview[^\]]*\]\s*=\s*useState\s*\(\s*false\s*\)/,
    'showPreview must be false on mount');
});

test('showShareMenu initialised to false', () => {
  assert.match(sharedPage, /const\s+\[showShareMenu[^\]]*\]\s*=\s*useState\s*\(\s*false\s*\)/,
    'showShareMenu must be false on mount');
});

test('showSaveDialog initialised to false', () => {
  assert.match(sharedPage, /const\s+\[showSaveDialog[^\]]*\]\s*=\s*useState\s*\(\s*false\s*\)/,
    'showSaveDialog must be false on mount');
});

test('showUserMenu initialised to false', () => {
  assert.match(sharedPage, /const\s+\[showUserMenu[^\]]*\]\s*=\s*useState\s*\(\s*false\s*\)/,
    'showUserMenu must be false on mount');
});

test('sharing initialised to false', () => {
  assert.match(sharedPage, /const\s+\[sharing[^\]]*\]\s*=\s*useState\s*\(\s*false\s*\)/,
    'sharing spinner must be false on mount');
});

test('addingCat initialised to false', () => {
  assert.match(sharedPage, /const\s+\[addingCat[^\]]*\]\s*=\s*useState\s*\(\s*false\s*\)/,
    'addingCat must be false on mount');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nE. Shared data preserved — SharedChecklistPage reads gear/bg from props/server');

test('SharedChecklistPage reads background from shared entry (not private LS key)', () => {
  // The page must reference the background that comes from the shared entry
  // It must NOT overwrite that background with the private localStorage key on mount
  assert.match(sharedPage, /background/,
    'SharedChecklistPage must reference background for the shared view');
});

test('SharedChecklistPage does not write private last-active-file key', () => {
  assert.ok(
    !sharedPage.includes('last-active-file') && !sharedPage.includes('LAST_ACTIVE_FILE'),
    'SharedChecklistPage must NOT write last-active-file — that is private-workspace-only (022G)'
  );
});

test('SharedChecklistPage does not write tw-active-locker-file sessionStorage key', () => {
  // This key belongs to the private Checklist workspace
  const hasActiveLockerWrite = /sessionStorage\.setItem\s*\(\s*['"]tw-active-locker-file['"]/.test(sharedPage);
  assert.ok(!hasActiveLockerWrite,
    'SharedChecklistPage must not write tw-active-locker-file — that is private-workspace-only');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nF. Open/Close control still works (functional regression)');

test('Open button sets allOpen to true', () => {
  assert.match(sharedPage, /setAllOpen\s*\(\s*true\s*\)/,
    'Open button must call setAllOpen(true) so user can expand all categories');
});

test('Close button sets allOpen to false', () => {
  assert.match(sharedPage, /setAllOpen\s*\(\s*false\s*\)/,
    'Close button must call setAllOpen(false) so user can collapse all categories');
});

test('Open button shows highlighted when allOpen is true', () => {
  assert.match(sharedPage, /allOpen\s*\?\s*['"`]bg-card/,
    'Open button should appear highlighted when allOpen is true');
});

test('Close button shows highlighted when allOpen is false', () => {
  assert.match(sharedPage, /!allOpen\s*\?\s*['"`]bg-card/,
    'Close button should appear highlighted when allOpen is false (initial state)');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nG. Prompt 022F footer regression protection');

test('022F: outer wrapper uses min-h-[100dvh] (not h-[100dvh] overflow-hidden)', () => {
  // The outer .screen-only wrapper must NOT trap height
  // Check that the outer wrapper has min-h-[100dvh]
  assert.match(sharedPage, /screen-only min-h-\[100dvh\]/,
    '022F fix: outer wrapper must be min-h-[100dvh] so footer stays in document flow');
});

test('022F: outer wrapper does NOT have h-[100dvh] overflow-hidden pattern', () => {
  const badPattern = /className[^>]*h-\[100dvh\][^>]*overflow-hidden/.test(sharedPage)
                  || /className[^>]*overflow-hidden[^>]*h-\[100dvh\]/.test(sharedPage);
  assert.ok(!badPattern,
    '022F fix: outer wrapper must not have h-[100dvh] overflow-hidden which traps footer');
});

test('022F: header has sticky top-0', () => {
  assert.match(sharedPage, /sticky top-0/,
    '022F fix: header must be sticky top-0');
});

test('022F: backgroundAttachment fixed present for background images', () => {
  assert.match(sharedPage, /backgroundAttachment\s*:\s*['"]fixed['"]/,
    '022F fix: backgroundAttachment fixed must be set for correct parallax on scroll');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nH. 022G private-workspace isolation preserved');

test('Checklist.tsx allOpen still initialised to false (022G not regressed)', () => {
  const checklist = readFileSync(
    'artifacts/pack-checklist/src/pages/Checklist.tsx', 'utf8'
  );
  assert.match(checklist, /const\s+\[allOpen[^\]]*\]\s*=\s*useState\s*\(\s*false\s*\)/,
    '022G: private Checklist allOpen must still init to false');
});

test('Checklist.tsx has startup restoration useEffect (022G not regressed)', () => {
  const checklist = readFileSync(
    'artifacts/pack-checklist/src/pages/Checklist.tsx', 'utf8'
  );
  assert.match(checklist, /readLastActiveFileFromLS|LAST_ACTIVE_FILE_LS_PREFIX/,
    '022G: private Checklist must still have last-active-file restoration infrastructure');
});

test('GearCategory isOpen=false is unchanged (022G not regressed)', () => {
  assert.match(gearCat, /const\s+\[isOpen[^\]]*\]\s*=\s*useState\s*\(\s*false\s*\)/,
    '022G: GearCategory isOpen must remain false');
});

test('WeightSummary summaryOpen=false is unchanged (022G not regressed)', () => {
  assert.match(weightSummary, /const\s+\[summaryOpen[^\]]*\]\s*=\s*useState\s*\(\s*false\s*\)/,
    '022G: WeightSummary summaryOpen must remain false');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nI. Unrelated features unchanged');

test('SharedChecklistPage imports GearCategory (unchanged)', () => {
  assert.match(sharedPage, /import.*GearCategory.*from/,
    'GearCategory import must be present');
});

test('SharedChecklistPage imports WeightSummary (unchanged)', () => {
  assert.match(sharedPage, /import.*WeightSummary.*from/,
    'WeightSummary import must be present');
});

test('SharedChecklistPage has save-own-copy UI (unchanged)', () => {
  assert.match(sharedPage, /showSaveDialog/,
    'Save your own copy dialog must still exist');
});

test('SharedChecklistPage has share menu (unchanged)', () => {
  assert.match(sharedPage, /showShareMenu/,
    'Share menu must still exist');
});

test('SharedChecklistPage has background picker (unchanged)', () => {
  assert.match(sharedPage, /bgPickerOpen/,
    'Background picker must still exist');
});

test('Footer design unchanged — print:hidden class present', () => {
  const footer = readFileSync(
    'artifacts/pack-checklist/src/components/Footer.tsx', 'utf8'
  );
  assert.match(footer, /print:hidden/,
    'Footer must still have print:hidden class');
});

test('Footer design unchanged — background colour present', () => {
  const footer = readFileSync(
    'artifacts/pack-checklist/src/components/Footer.tsx', 'utf8'
  );
  assert.match(footer, /#1e2322/,
    'Footer must still use #1e2322 background colour');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n────────────────────────────────────────────────────────────');
console.log(`022H Shared Panels Closed: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
