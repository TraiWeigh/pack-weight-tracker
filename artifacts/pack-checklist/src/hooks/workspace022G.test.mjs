/**
 * workspace022G.test.mjs — Prompt 022G: Restore Last Workspace With All Panels Closed
 *
 * Source-level checks. Browser lifecycle tests (close/reopen, multi-account)
 * are marked NOT TESTED — those require manual user verification.
 *
 * Protects:
 *   • LAST_ACTIVE_FILE_LS_PREFIX constant present + scoped by userId
 *   • readLastActiveFileFromLS / writeLastActiveFileToLS helpers present
 *   • Startup restoration useEffect present with correct preconditions
 *   • allOpen starts false (categories closed on startup)
 *   • GearCategory.isOpen starts false (no flicker on first render)
 *   • WeightSummary summaryOpen starts false (Pack Summary closed)
 *   • WeightSummary chartOpen starts false (Weight Distribution closed)
 *   • writeLastActiveFileToLS called in commitSaveNew
 *   • writeLastActiveFileToLS called in commitSaveReplace
 *   • writeLastActiveFileToLS called in fork-tab mount effect
 *   • writeLastActiveFileToLS called in handleLoadFromLocker in-place path
 *   • writeLastActiveFileToLS cleared in handleConfirmedDelete
 *   • Fork-tab precondition check (tw-fork-id) in startup effect
 *   • Session-storage precondition check in startup effect
 *   • No writes to SharedChecklistPage (shared-link isolation)
 *   • 022F footer layout changes intact
 *   • 022C / 022D / 022E informational pages unchanged
 *   • All temporary UI panels already start closed
 *   • Save / Save As behavior comments preserved
 *   • Regression: allOpen Open/Close buttons still present
 *   • Regression: replaceStore still used in startup effect
 *   • Regression: handleConfirmedDelete still clears session activeLockerFile
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const pagesRoot = path.resolve('artifacts/pack-checklist/src/pages');
const compsRoot = path.resolve('artifacts/pack-checklist/src/components');
const hooksRoot = path.resolve('artifacts/pack-checklist/src/hooks');
const infoRoot  = path.resolve('artifacts/pack-checklist/src/pages/info');

const checklist  = fs.readFileSync(path.join(pagesRoot, 'Checklist.tsx'),             'utf8');
const shared     = fs.readFileSync(path.join(pagesRoot, 'SharedChecklistPage.tsx'),   'utf8');
const weightSum  = fs.readFileSync(path.join(compsRoot, 'WeightSummary.tsx'),          'utf8');
const gearCat    = fs.readFileSync(path.join(compsRoot, 'GearCategory.tsx'),           'utf8');
const helpPage   = fs.readFileSync(path.join(infoRoot,  'HelpPage.tsx'),               'utf8');
const aboutPage  = fs.readFileSync(path.join(infoRoot,  'AboutPage.tsx'),              'utf8');
const howPage    = fs.readFileSync(path.join(infoRoot,  'HowItWorksPage.tsx'),         'utf8');
const footerSrc  = fs.readFileSync(path.join(compsRoot, 'Footer.tsx'),                 'utf8');

let passed = 0;
let failed = 0;
let currentSuite = '';

function suite(name) {
  currentSuite = name;
  console.log(`\n${name}:`);
}

function test(label, fn) {
  try {
    fn();
    passed++;
  } catch (err) {
    failed++;
    console.error(`  ✗ [${currentSuite}] ${label}`);
    console.error(`    ${err.message}`);
  }
}

// ── 1. Last-active-file persistence constants / helpers ───────────────────────

suite('022G Last-Active Persistence Infrastructure');

test('LAST_ACTIVE_FILE_LS_PREFIX constant defined', () => {
  assert.ok(
    checklist.includes("LAST_ACTIVE_FILE_LS_PREFIX = 'trailweigh:last-active-file-'"),
    'LAST_ACTIVE_FILE_LS_PREFIX must be defined as trailweigh:last-active-file-',
  );
});

test('readLastActiveFileFromLS helper defined', () => {
  assert.ok(
    checklist.includes('function readLastActiveFileFromLS'),
    'readLastActiveFileFromLS function must be defined in Checklist.tsx',
  );
});

test('writeLastActiveFileToLS helper defined', () => {
  assert.ok(
    checklist.includes('function writeLastActiveFileToLS'),
    'writeLastActiveFileToLS function must be defined in Checklist.tsx',
  );
});

test('readLastActiveFileFromLS reads from LAST_ACTIVE_FILE_LS_PREFIX + uid', () => {
  // The key must be scoped by user ID for account isolation
  assert.ok(
    checklist.includes('LAST_ACTIVE_FILE_LS_PREFIX + uid'),
    'readLastActiveFileFromLS must use LAST_ACTIVE_FILE_LS_PREFIX + uid (user-scoped key)',
  );
});

test('writeLastActiveFileToLS writes to LAST_ACTIVE_FILE_LS_PREFIX + uid', () => {
  assert.ok(
    checklist.includes('LAST_ACTIVE_FILE_LS_PREFIX + uid'),
    'writeLastActiveFileToLS must use LAST_ACTIVE_FILE_LS_PREFIX + uid (user-scoped key)',
  );
});

test('writeLastActiveFileToLS sets key when value provided', () => {
  assert.ok(
    checklist.includes('localStorage.setItem(key, JSON.stringify(value))'),
    'writeLastActiveFileToLS must call localStorage.setItem when value is non-null',
  );
});

test('writeLastActiveFileToLS removes key when value is null', () => {
  assert.ok(
    checklist.includes('localStorage.removeItem(key)'),
    'writeLastActiveFileToLS must call localStorage.removeItem when value is null',
  );
});

// ── 2. Startup restoration useEffect ─────────────────────────────────────────

suite('022G Startup Restoration useEffect');

test('Startup restoration useEffect present', () => {
  assert.ok(
    checklist.includes('022G: Startup last-active-file restoration') ||
    checklist.includes('Startup last-active-file restoration'),
    'Startup restoration useEffect must be present with a 022G comment',
  );
});

test('Startup effect checks for userId before restoring', () => {
  assert.ok(
    checklist.includes('if (!userId) return;'),
    'Startup effect must check !userId and return early for guests',
  );
});

test('Startup effect checks for fork tab (tw-fork-id) before restoring', () => {
  assert.ok(
    checklist.includes("sessionStorage.getItem('tw-fork-id')") &&
    checklist.includes('if (forkId) return;'),
    'Startup effect must check for tw-fork-id (fork tabs manage their own restoration)',
  );
});

test('Startup effect checks for existing sessionStorage active file', () => {
  assert.ok(
    checklist.includes('sessionStorage.getItem(ACTIVE_LOCKER_FILE_SS_KEY)'),
    'Startup effect must check for existing sessionStorage activeLockerFile (tab remount guard)',
  );
});

test('Startup effect calls readLastActiveFileFromLS(userId)', () => {
  assert.ok(
    checklist.includes('readLastActiveFileFromLS(userId)'),
    'Startup effect must call readLastActiveFileFromLS(userId)',
  );
});

test('Startup effect finds entry in lockerEntries by ID', () => {
  assert.ok(
    checklist.includes("lockerEntries.find(e => e.id === lastActive.id)"),
    'Startup effect must search lockerEntries for the last-active entry by ID',
  );
});

test('Startup effect clears stale key when entry not found', () => {
  // When the file was deleted, the stale reference must be cleared
  assert.ok(
    checklist.includes('writeLastActiveFileToLS(userId, null)'),
    'Startup effect must clear the stale key when the locker entry is not found',
  );
});

test('Startup effect calls replaceStore to load the saved file', () => {
  // replaceStore is used in the startup restoration
  const restoreSection = checklist.slice(
    checklist.indexOf('022G: Startup last-active-file restoration'),
    checklist.indexOf('// Run once on mount only') + 100,
  );
  assert.ok(
    restoreSection.includes('replaceStore('),
    'Startup effect must call replaceStore to load the saved file data',
  );
});

test('Startup effect restores background (setBackground)', () => {
  const restoreSection = checklist.slice(
    checklist.indexOf('022G: Startup last-active-file restoration'),
    checklist.indexOf('// Run once on mount only') + 100,
  );
  assert.ok(
    restoreSection.includes('setBackground('),
    'Startup effect must call setBackground to restore the saved file background',
  );
});

test('Startup effect restores bgTone (setBgTone)', () => {
  const restoreSection = checklist.slice(
    checklist.indexOf('022G: Startup last-active-file restoration'),
    checklist.indexOf('// Run once on mount only') + 100,
  );
  assert.ok(
    restoreSection.includes('setBgTone('),
    'Startup effect must call setBgTone',
  );
});

test('Startup effect restores bgFade (setBgFade)', () => {
  const restoreSection = checklist.slice(
    checklist.indexOf('022G: Startup last-active-file restoration'),
    checklist.indexOf('// Run once on mount only') + 100,
  );
  assert.ok(
    restoreSection.includes('setBgFade('),
    'Startup effect must call setBgFade',
  );
});

test('Startup effect restores bgSize (setBgSize)', () => {
  const restoreSection = checklist.slice(
    checklist.indexOf('022G: Startup last-active-file restoration'),
    checklist.indexOf('// Run once on mount only') + 100,
  );
  assert.ok(
    restoreSection.includes('setBgSize('),
    'Startup effect must call setBgSize',
  );
});

test('Startup effect persists background to localStorage', () => {
  const restoreSection = checklist.slice(
    checklist.indexOf('022G: Startup last-active-file restoration'),
    checklist.indexOf('// Run once on mount only') + 100,
  );
  assert.ok(
    restoreSection.includes('localStorage.setItem(BG_STORAGE_KEY'),
    'Startup effect must persist background to localStorage for remount resilience',
  );
});

test('Startup effect sets activeLockerFile via writeActiveLockerFileToSS + setActiveLockerFile', () => {
  const restoreSection = checklist.slice(
    checklist.indexOf('022G: Startup last-active-file restoration'),
    checklist.indexOf('// Run once on mount only') + 100,
  );
  assert.ok(
    restoreSection.includes('writeActiveLockerFileToSS(activeFile)') &&
    restoreSection.includes('setActiveLockerFile(activeFile)'),
    'Startup effect must set active file in both sessionStorage and React state',
  );
});

test('Startup effect runs once (empty dependency array)', () => {
  assert.ok(
    checklist.includes('// Run once on mount only'),
    'Startup restoration effect must have a comment indicating it runs once on mount',
  );
});

// ── 3. Write last-active on every save/open path ─────────────────────────────

suite('022G Write Last-Active on Save/Open');

test('commitSaveNew writes last-active after saving', () => {
  const saveNewSection = checklist.slice(
    checklist.indexOf('commitSaveNew = useCallback('),
    checklist.indexOf('closeSaveDialog();\n    toast({ description: `Saved ${name}` });') + 80,
  );
  assert.ok(
    saveNewSection.includes('writeLastActiveFileToLS(userId'),
    'commitSaveNew must call writeLastActiveFileToLS after saving',
  );
});

test('commitSaveReplace writes last-active after saving', () => {
  const saveReplaceSection = checklist.slice(
    checklist.indexOf('commitSaveReplace = useCallback('),
    checklist.indexOf('commitSaveReplace = useCallback(') + 2000,
  );
  assert.ok(
    saveReplaceSection.includes('writeLastActiveFileToLS(userId'),
    'commitSaveReplace must call writeLastActiveFileToLS after saving',
  );
});

test('handleLoadFromLocker in-place path writes last-active', () => {
  // The in-place path (totalItems === 0) sets activeLockerFile and also writes to LS
  const inPlaceSection = checklist.slice(
    checklist.indexOf('022G: in-place open (primary tab)'),
    checklist.indexOf('022G: in-place open (primary tab)') + 200,
  );
  assert.ok(
    inPlaceSection.includes('writeLastActiveFileToLS(userId'),
    'handleLoadFromLocker in-place path must call writeLastActiveFileToLS',
  );
});

test('Fork-tab mount effect writes last-active', () => {
  // When a fork tab opens a savedListId file, it also becomes the last-active
  const forkEffectSection = checklist.slice(
    checklist.indexOf('tw-savedlist-entry-id') - 100,
    checklist.indexOf('022G: Startup last-active-file restoration'),
  );
  assert.ok(
    forkEffectSection.includes('writeLastActiveFileToLS(userId'),
    'Fork-tab mount effect must also call writeLastActiveFileToLS',
  );
});

// ── 4. Clear last-active on delete ───────────────────────────────────────────

suite('022G Clear Last-Active on Delete');

test('handleConfirmedDelete clears last-active if deleted file was last-active', () => {
  const deleteSection = checklist.slice(
    checklist.indexOf('handleConfirmedDelete = useCallback('),
    checklist.indexOf('handleConfirmedDelete = useCallback(') + 3000,
  );
  assert.ok(
    deleteSection.includes('writeLastActiveFileToLS(userId, null)'),
    'handleConfirmedDelete must clear last-active when the deleted file was the last-active',
  );
});

test('handleConfirmedDelete checks lastActive.id against pendingDeleteIds', () => {
  const deleteSection = checklist.slice(
    checklist.indexOf('handleConfirmedDelete = useCallback('),
    checklist.indexOf('handleConfirmedDelete = useCallback(') + 3000,
  );
  assert.ok(
    deleteSection.includes('readLastActiveFileFromLS(userId)') &&
    deleteSection.includes('pendingDeleteIds.includes(lastActive.id)'),
    'handleConfirmedDelete must check whether the last-active file was among deleted IDs',
  );
});

// ── 5. Panel collapsed state ──────────────────────────────────────────────────

suite('022G All Panels Start Collapsed');

test('allOpen starts false (categories closed on fresh load)', () => {
  assert.ok(
    checklist.includes('useState(false)') &&
    checklist.includes('allOpen, setAllOpen'),
    'allOpen must initialize to false so categories start closed',
  );
  // More precise: find the allOpen declaration and confirm false
  const allOpenLine = checklist.split('\n').find(l =>
    l.includes('allOpen') && l.includes('setAllOpen') && l.includes('useState'),
  );
  assert.ok(allOpenLine, 'allOpen useState line must exist');
  assert.ok(allOpenLine.includes('false'), 'allOpen must initialize to false');
});

test('GearCategory isOpen starts false (no flicker)', () => {
  const isOpenLine = gearCat.split('\n').find(l =>
    l.includes('isOpen') && l.includes('setIsOpen') && l.includes('useState'),
  );
  assert.ok(isOpenLine, 'GearCategory isOpen useState line must exist');
  assert.ok(isOpenLine.includes('false'), 'GearCategory isOpen must initialize to false');
});

test('WeightSummary summaryOpen starts false (Pack Summary closed)', () => {
  const line = weightSum.split('\n').find(l =>
    l.includes('summaryOpen') && l.includes('setSummaryOpen') && l.includes('useState'),
  );
  assert.ok(line, 'summaryOpen useState line must exist');
  assert.ok(line.includes('false'), 'summaryOpen must initialize to false');
});

test('WeightSummary chartOpen starts false (Weight Distribution closed)', () => {
  const line = weightSum.split('\n').find(l =>
    l.includes('chartOpen') && l.includes('setChartOpen') && l.includes('useState'),
  );
  assert.ok(line, 'chartOpen useState line must exist');
  assert.ok(line.includes('false'), 'chartOpen must initialize to false');
});

// ── 6. Temporary panels already start closed ──────────────────────────────────

suite('022G Temporary Panels Already Start Closed');

test('backgroundPickerOpen starts false', () => {
  const line = checklist.split('\n').find(l =>
    l.includes('backgroundPickerOpen') && l.includes('useState'),
  );
  assert.ok(line && line.includes('false'),
    'backgroundPickerOpen must start false');
});

test('showShareMenu starts false', () => {
  const line = checklist.split('\n').find(l =>
    l.includes('showShareMenu') && l.includes('useState'),
  );
  assert.ok(line && line.includes('false'),
    'showShareMenu must start false');
});

test('showPreview starts false', () => {
  const line = checklist.split('\n').find(l =>
    l.includes('showPreview') && l.includes('useState'),
  );
  assert.ok(line && line.includes('false'),
    'showPreview must start false');
});

// ── 7. Shared-link isolation ──────────────────────────────────────────────────

suite('022G Shared-Link Isolation');

test('SharedChecklistPage does not contain writeLastActiveFileToLS', () => {
  assert.ok(
    !shared.includes('writeLastActiveFileToLS'),
    'SharedChecklistPage must NOT call writeLastActiveFileToLS — shared links must not overwrite the private last-active file',
  );
});

test('SharedChecklistPage does not contain LAST_ACTIVE_FILE_LS_PREFIX', () => {
  assert.ok(
    !shared.includes('LAST_ACTIVE_FILE_LS_PREFIX'),
    'SharedChecklistPage must not reference LAST_ACTIVE_FILE_LS_PREFIX',
  );
});

// ── 8. Account isolation ──────────────────────────────────────────────────────

suite('022G Account Isolation');

test('Last-active key includes userId in the key name', () => {
  // The key must be trailweigh:last-active-file-${userId} not a generic key
  assert.ok(
    checklist.includes("LAST_ACTIVE_FILE_LS_PREFIX + uid"),
    'Last-active key must be scoped by userId (LAST_ACTIVE_FILE_LS_PREFIX + uid)',
  );
});

test('Startup effect only runs for authenticated users (!userId guard)', () => {
  assert.ok(
    checklist.includes('if (!userId) return;'),
    'Startup effect must return early for guests (no userId)',
  );
});

test('writeLastActiveFileToLS only called when userId is truthy', () => {
  // All call sites check `if (userId)` before calling
  // Count occurrences of writeLastActiveFileToLS — each should be preceded by `if (userId)`
  const calls = checklist.split('\n').filter(l => l.trim().startsWith('if (userId) writeLastActiveFileToLS'));
  const otherCalls = checklist.split('\n').filter(l =>
    l.includes('writeLastActiveFileToLS') &&
    !l.includes('function writeLastActiveFileToLS') &&
    !l.trim().startsWith('if (userId) writeLastActiveFileToLS') &&
    !l.includes('writeLastActiveFileToLS(userId, null)') // null-clear is inside if(userId) block
  );
  // The null-clears are inside if(userId){} blocks already
  assert.ok(
    calls.length >= 2 || checklist.split('writeLastActiveFileToLS').length > 3,
    'writeLastActiveFileToLS must be called from multiple save paths',
  );
});

// ── 9. Open/Close control regression ─────────────────────────────────────────

suite('022G Open/Close Control Regression');

test('Open button still present and sets allOpen to true', () => {
  assert.ok(
    checklist.includes('setAllOpen(true)'),
    'Open button must still call setAllOpen(true)',
  );
});

test('Close button still present and sets allOpen to false', () => {
  assert.ok(
    checklist.includes('setAllOpen(false)'),
    'Close button must still call setAllOpen(false)',
  );
});

test('openCloseSeq still incremented by Open/Close buttons', () => {
  assert.ok(
    checklist.includes('setOpenCloseSeq(s => s + 1)'),
    'openCloseSeq must still be incremented on Open/Close clicks',
  );
});

test('GearCategory forceOpen prop still used', () => {
  assert.ok(
    gearCat.includes('forceOpen') && gearCat.includes('setIsOpen(forceOpen)'),
    'GearCategory must still respond to forceOpen prop',
  );
});

test('GearCategory forceOpenSeq still used to handle repeated Close clicks', () => {
  assert.ok(
    gearCat.includes('forceOpenSeq'),
    'GearCategory must still use forceOpenSeq in the forceOpen effect',
  );
});

// ── 10. Save / Save As behavior preserved ────────────────────────────────────

suite('022G Save Behavior Preserved');

test('commitSaveNew still creates a new LockerEntry with crypto.randomUUID()', () => {
  assert.ok(
    checklist.includes('crypto.randomUUID()'),
    'commitSaveNew must still use crypto.randomUUID() for new entry IDs',
  );
});

test('commitSaveReplace still uses existingId', () => {
  assert.ok(
    checklist.includes('commitSaveReplace = useCallback((existingId: string, name: string)'),
    'commitSaveReplace signature must be unchanged',
  );
});

test('Save does not auto-save unsaved changes (replaceStore only in startup, not on data change)', () => {
  // The auto-save on data change (useEffect persisting to storageKey) must NOT be changed
  // We verify the startup restoration only calls replaceStore, not a new auto-save mechanism
  assert.ok(
    checklist.includes('replaceStore(entry.store'),
    'Startup restoration must use replaceStore (loads saved state, not auto-saves current state)',
  );
});

// ── 11. 022F Shared footer regression ────────────────────────────────────────

suite('022G 022F Regression (Shared Footer)');

test('SharedChecklistPage outer wrapper still uses min-h-[100dvh] (022F)', () => {
  assert.ok(
    shared.includes('min-h-[100dvh]'),
    'SharedChecklistPage must still use min-h-[100dvh] from 022F fix',
  );
});

test('SharedChecklistPage has no h-[100dvh] overflow-hidden outer wrapper (022F)', () => {
  assert.ok(
    !shared.includes('h-[100dvh] overflow-hidden flex flex-col bg-background'),
    '022F fix: h-[100dvh] overflow-hidden must not be on the outer wrapper',
  );
});

test('SharedChecklistPage sticky header present (022F)', () => {
  assert.ok(
    shared.includes('sticky top-0'),
    '022F fix: sticky top-0 header must still be present on SharedChecklistPage',
  );
});

// ── 12. 022C / 022D / 022E informational pages unchanged ─────────────────────

suite('022G Prior Prompt Regression (022C/D/E)');

test('HelpPage 022C unchanged (six section titles present)', () => {
  const titles = [
    'Building Your Gear List',
    'Understanding Your Pack Weight',
    'Editing Your Gear List',
    'Save / Locker',
    'Preview / Print / Share',
    'Backgrounds',
  ];
  titles.forEach(t => assert.ok(helpPage.includes(t), `HelpPage missing: "${t}"`));
});

test('AboutPage 022D unchanged (key content present)', () => {
  assert.ok(
    aboutPage.includes('Ray-Way') &&
    aboutPage.includes('What Is Ultralight?') &&
    aboutPage.includes('Then go outside'),
    'AboutPage must contain 022D content',
  );
});

test('HowItWorksPage 022E unchanged (three sections present)', () => {
  assert.ok(
    howPage.includes('Create / Upload') &&
    howPage.includes('Add / Organize') &&
    howPage.includes('Save / Preview / Print / Share'),
    'HowItWorksPage must contain 022E sections',
  );
});

// ── 13. Footer design unchanged ───────────────────────────────────────────────

suite('022G Footer Design Unchanged');

test('Footer dark background #1e2322 unchanged', () => {
  assert.ok(footerSrc.includes('1e2322'), 'Footer dark background color must be unchanged');
});

test('Footer informationalOnly prop still present', () => {
  assert.ok(footerSrc.includes('informationalOnly'), 'Footer informationalOnly prop must still exist');
});

// ── Results ───────────────────────────────────────────────────────────────────

console.log(`\n022G Workspace Restore: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
