/**
 * Focused automated tests for Prompt 021C
 * View-Only Shared Locker + Viewer Isolation
 *
 * Groups:
 *  A. SharePayload & SharedLockerFile type in shareLink.ts
 *  B. handleCopyLink in Checklist.tsx — lockerFiles included
 *  C. SharedLockerPanel — rendered, view-only (no Rename, no Delete)
 *  D. Multi-file state architecture in SharedChecklistPage.tsx
 *  E. Sender isolation — no persistence path to sender data
 *  F. Save Your Own Copy — viewer-edited state, new UUID
 *  G. normalizeLockerFile & normalizeSnapshot handle lockerFiles
 *  H. Private owner 021B regression — no password, Rename preserved
 *  I. Auth route regression — /checklist private, /s/:shareId public
 *  J. 021 Share regression — core share behavior preserved
 *  K. 020F regression — New/appearance behavior preserved
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..'); // artifacts/pack-checklist/src

const shareLink   = readFileSync(path.join(root, 'lib/shareLink.ts'),              'utf8');
const checklist   = readFileSync(path.join(root, 'pages/Checklist.tsx'),            'utf8');
const sharedPage  = readFileSync(path.join(root, 'pages/SharedChecklistPage.tsx'),  'utf8');
const lockerPanel = readFileSync(path.join(root, 'components/LockerPanel.tsx'),     'utf8');
const lockDlg     = readFileSync(path.join(root, 'components/LockerDeleteDialog.tsx'), 'utf8');
const app         = readFileSync(path.join(root, 'App.tsx'),                        'utf8');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${e.message}`);
    failed++;
  }
}

// ── A. SharePayload & SharedLockerFile ────────────────────────────────────────

console.log('\nA. SharePayload & SharedLockerFile type');

test('SharedLockerFile interface exported from shareLink.ts', () => {
  assert.match(shareLink, /export interface SharedLockerFile/,
    'SharedLockerFile must be exported from shareLink.ts');
});

test('SharedLockerFile has id field', () => {
  assert.match(shareLink, /SharedLockerFile[\s\S]*?id:\s*string/,
    'SharedLockerFile must have id: string');
});

test('SharedLockerFile has name field', () => {
  assert.match(shareLink, /SharedLockerFile[\s\S]*?name:\s*string/,
    'SharedLockerFile must have name: string');
});

test('SharedLockerFile has store field', () => {
  assert.match(shareLink, /SharedLockerFile[\s\S]*?store:\s*\{/,
    'SharedLockerFile must have store field');
});

test('SharePayload has lockerFiles field', () => {
  assert.match(shareLink, /lockerFiles\?:\s*SharedLockerFile\[\]/,
    'SharePayload must have lockerFiles?: SharedLockerFile[]');
});

test('lockerFiles field is optional (not required)', () => {
  assert.match(shareLink, /lockerFiles\?:/,
    'lockerFiles must be optional (?) for backward compatibility');
});

test('SharedLockerFile has background field', () => {
  assert.match(shareLink, /SharedLockerFile[\s\S]*?background\?:/,
    'SharedLockerFile must have optional background field');
});

test('SharedLockerFile has chartPaletteKey field', () => {
  assert.match(shareLink, /SharedLockerFile[\s\S]*?chartPaletteKey\?:/,
    'SharedLockerFile must have optional chartPaletteKey field');
});

// ── B. handleCopyLink — lockerFiles included ──────────────────────────────────

console.log('\nB. handleCopyLink includes lockerFiles');

test('Checklist.tsx imports SharedLockerFile from shareLink', () => {
  assert.match(checklist, /import.*SharedLockerFile.*from.*shareLink/,
    'Checklist.tsx must import SharedLockerFile from shareLink');
});

// Helper: extract handleShareLocker body from Checklist.tsx
// (021E renamed handleCopyLink → handleShareLocker; tests updated accordingly)
// Slices from the function start to just past buildShareURL(payload) call
function getHandleCopyLinkSection() {
  // 021E rename: function is now called handleShareLocker
  const start = checklist.indexOf('const handleShareLocker');
  const end   = checklist.indexOf('buildShareURL(payload)', start);
  return start >= 0 && end > start ? checklist.slice(start, end + 80) : '';
}

test('handleShareLocker reads LOCKER_KEY from localStorage', () => {
  const section = getHandleCopyLinkSection();
  assert.match(section, /localStorage\.getItem\(LOCKER_KEY\)/,
    'handleShareLocker must read LOCKER_KEY from localStorage to snapshot Locker files');
});

test('handleShareLocker builds lockerFiles array from Locker entries', () => {
  const section = getHandleCopyLinkSection();
  assert.match(section, /lockerFiles/,
    'handleShareLocker must build lockerFiles array');
});

test('handleShareLocker maps entries to SharedLockerFile shape (id, name, store)', () => {
  const section = getHandleCopyLinkSection();
  assert.match(section, /id:.*e\.id/,
    'handleShareLocker must map e.id to SharedLockerFile.id');
  assert.match(section, /name:.*e\.name/,
    'handleShareLocker must map e.name to SharedLockerFile.name');
  assert.match(section, /store:.*e\.store/,
    'handleShareLocker must map e.store to SharedLockerFile.store');
});

test('handleShareLocker includes lockerFiles in payload', () => {
  const section = getHandleCopyLinkSection();
  assert.match(section, /lockerFiles/,
    'handleShareLocker payload must include lockerFiles');
});

test('handleShareLocker wraps Locker read in try/catch (graceful failure)', () => {
  const section = getHandleCopyLinkSection();
  assert.match(section, /try[\s\S]*?catch/,
    'handleShareLocker Locker read must be wrapped in try/catch');
});

// ── C. SharedLockerPanel — rendered, view-only ────────────────────────────────

console.log('\nC. SharedLockerPanel — rendered, view-only (no Rename, no Delete)');

test('SharedLockerPanel component defined in SharedChecklistPage', () => {
  assert.match(sharedPage, /function SharedLockerPanel/,
    'SharedLockerPanel component must be defined in SharedChecklistPage.tsx');
});

test('SharedLockerPanel renders FolderOpen (open) button', () => {
  const panelFn = sharedPage.match(/function SharedLockerPanel[\s\S]*?\nfunction /)?.[0] ?? '';
  assert.match(panelFn, /FolderOpen/,
    'SharedLockerPanel must include FolderOpen button for opening files');
});

test('SharedLockerPanel has NO Pencil (rename) control', () => {
  const panelFn = sharedPage.match(/function SharedLockerPanel[\s\S]*?\nfunction /)?.[0] ?? '';
  assert.doesNotMatch(panelFn, /Pencil/,
    'SharedLockerPanel must NOT render a Pencil (rename) control');
});

test('SharedLockerPanel has NO Trash2/Trash (delete) control', () => {
  const panelFn = sharedPage.match(/function SharedLockerPanel[\s\S]*?\nfunction /)?.[0] ?? '';
  assert.doesNotMatch(panelFn, /Trash2|Trash/,
    'SharedLockerPanel must NOT render a Trash (delete) control');
});

test('SharedLockerPanel has NO onRequestDelete', () => {
  const panelFn = sharedPage.match(/function SharedLockerPanel[\s\S]*?\nfunction /)?.[0] ?? '';
  assert.doesNotMatch(panelFn, /onRequestDelete/,
    'SharedLockerPanel must not have onRequestDelete');
});

test('SharedLockerPanel shows file count badge', () => {
  const panelFn = sharedPage.match(/function SharedLockerPanel[\s\S]*?\nfunction /)?.[0] ?? '';
  assert.match(panelFn, /files\.length/,
    'SharedLockerPanel must display file count');
});

test('SharedLockerPanel is conditionally rendered only when lockerFiles present', () => {
  assert.match(sharedPage, /snapshot\.lockerFiles[\s\S]*?SharedLockerPanel/,
    'SharedLockerPanel must only render when snapshot.lockerFiles is present');
});

test('SharedLockerPanel is NOT the private LockerPanel component', () => {
  assert.doesNotMatch(sharedPage, /<LockerPanel/,
    'SharedChecklistPage must not render the private <LockerPanel> component');
});

// ── D. Multi-file state architecture ─────────────────────────────────────────

console.log('\nD. Multi-file state architecture');

test('activeFileId state declared in SharedChecklistContent', () => {
  assert.match(sharedPage, /activeFileId.*setActiveFileId.*useState/,
    'activeFileId state must be declared in SharedChecklistContent');
});

test('activeFileId initialized to null (primary snapshot first)', () => {
  assert.match(sharedPage, /\[activeFileId,.*useState<string \| null>\(null\)/,
    'activeFileId must initialize to null (primary snapshot shown first)');
});

test('tempEditsRef declared for per-file stash', () => {
  assert.match(sharedPage, /tempEditsRef.*useRef.*Map/,
    'tempEditsRef must be a useRef<Map> for per-file temp state stash');
});

test('PRIMARY_KEY constant defined for primary snapshot stash key', () => {
  assert.match(sharedPage, /PRIMARY_KEY\s*=\s*['"]__primary__['"]/,
    "PRIMARY_KEY must be '__primary__' for identifying the primary snapshot in tempEditsRef");
});

test('switchToFile function defined in SharedChecklistContent', () => {
  assert.match(sharedPage, /const switchToFile\s*=\s*useCallback/,
    'switchToFile must be defined as a useCallback in SharedChecklistContent');
});

test('switchToFile stashes current state before switching', () => {
  const switchFn = sharedPage.match(/const switchToFile[\s\S]*?setActiveFileId\(fileId\)/)?.[0] ?? '';
  assert.match(switchFn, /tempEditsRef\.current\.set/,
    'switchToFile must stash current temp state via tempEditsRef.current.set before switching');
});

test('switchToFile loads from stash or original snapshot', () => {
  const switchFn = sharedPage.match(/const switchToFile[\s\S]*?setActiveFileId\(fileId\)/)?.[0] ?? '';
  assert.match(switchFn, /tempEditsRef\.current\.get/,
    'switchToFile must load from tempEditsRef.current.get before falling back to original');
});

test('switchToFile resets undo/redo on file switch', () => {
  const switchFn = sharedPage.match(/const switchToFile[\s\S]*?setActiveFileId\(fileId\)/)?.[0] ?? '';
  assert.match(switchFn, /undoStackRef\.current\s*=\s*\[\]/,
    'switchToFile must reset undoStackRef to clear undo history for new file');
  assert.match(switchFn, /redoStackRef\.current\s*=\s*\[\]/,
    'switchToFile must reset redoStackRef to clear redo history for new file');
});

test('switchToFile calls setActiveFileId with new file ID', () => {
  const switchFn = sharedPage.match(/const switchToFile[\s\S]*?setActiveFileId\(fileId\)/)?.[0] ?? '';
  assert.match(switchFn, /setActiveFileId\(fileId\)/,
    'switchToFile must call setActiveFileId(fileId) to update active file');
});

test('switchToFile does NOT call pushAndSet (no undo entry for file switch)', () => {
  const switchFn = sharedPage.match(/const switchToFile[\s\S]*?setActiveFileId\(fileId\)/)?.[0] ?? '';
  assert.doesNotMatch(switchFn, /pushAndSet/,
    'switchToFile must not use pushAndSet — file switch is not an undoable action');
});

test('banner text uses activeFileId to find current file name', () => {
  assert.match(sharedPage, /activeFileId[\s\S]*?snapshot\.lockerFiles[\s\S]*?find/,
    'Banner must use activeFileId to look up current file name from snapshot.lockerFiles');
});

// ── E. Sender isolation ───────────────────────────────────────────────────────

console.log('\nE. Sender isolation — no persistence path to sender data');

test('pushAndSet contains no localStorage.setItem', () => {
  const pushAndSetFn = sharedPage.match(/const pushAndSet\s*=[\s\S]*?setHistoryVersion/)?.[0] ?? '';
  assert.doesNotMatch(pushAndSetFn, /localStorage\.setItem/,
    'pushAndSet must never write to localStorage — in-memory only');
});

test('switchToFile does NOT write to localStorage', () => {
  const switchFn = sharedPage.match(/const switchToFile[\s\S]*?setActiveFileId\(fileId\)/)?.[0] ?? '';
  assert.doesNotMatch(switchFn, /localStorage/,
    'switchToFile must not touch localStorage — file state is in-memory only');
});

test('SharedChecklistContent comment states changes never written to sender', () => {
  assert.match(sharedPage, /nothing is ever written to[\s\S]*?localStorage|changes update React state only/,
    'SharedChecklistPage must document that recipient changes never touch sender data');
});

test('tempEditsRef is a useRef (not useState) — no localStorage write path', () => {
  assert.match(sharedPage, /tempEditsRef\s*=\s*useRef/,
    'tempEditsRef must be a useRef (no persistence, no useState serialization)');
});

test('SharedLockerPanel onOpen calls switchToFile (in-memory switch only)', () => {
  // Find the JSX *usage* of <SharedLockerPanel (not the function definition)
  const jsxUsage = sharedPage.match(/<SharedLockerPanel[\s\S]*?\/>/)?.[0] ?? '';
  assert.match(jsxUsage, /switchToFile/,
    'SharedLockerPanel onOpen prop must call switchToFile (in-memory) not any API/storage call');
});

test('No sender LOCKER_KEY write in SharedChecklistPage', () => {
  // writeLockerEntry is the only localStorage.setItem allowed — and only for recipient's copy
  const allSetItems = [...sharedPage.matchAll(/localStorage\.setItem\(([^)]+)\)/g)].map(m => m[1]);
  const badWrites = allSetItems.filter(key => !key.includes('LOCKER_KEY'));
  assert.equal(badWrites.length, 0,
    `All localStorage.setItem in SharedChecklistPage must use LOCKER_KEY (recipient Locker only). Bad: ${badWrites.join(', ')}`);
});

// ── F. Save Your Own Copy ─────────────────────────────────────────────────────

console.log('\nF. Save Your Own Copy — viewer-edited state, new UUID');

test('commitSave uses crypto.randomUUID() for new copy', () => {
  assert.match(sharedPage, /crypto\.randomUUID\(\)/,
    'commitSave must use crypto.randomUUID() for a new unique file ID');
});

test('commitSave does NOT reuse snapshot.id (no field)', () => {
  const commitSaveFn = sharedPage.match(/const commitSave[\s\S]*?\}, \[store/)?.[0] ?? '';
  assert.doesNotMatch(commitSaveFn, /snapshot\.id/,
    'commitSave must not reference snapshot.id — the shared snapshot has no file ID to reuse');
});

test('commitSave writes to LOCKER_KEY (recipient Locker only)', () => {
  assert.match(sharedPage, /localStorage\.setItem\(LOCKER_KEY/,
    'writeLockerEntry must write only to LOCKER_KEY (recipient own Locker)');
});

test('Guest Save Your Own Copy redirects to sign-up', () => {
  assert.match(sharedPage, /isGuest[\s\S]*?sign-up/,
    'Guest clicking Save Your Own Copy must redirect to sign-up');
});

test('commitSave uses current in-memory store (includes viewer edits)', () => {
  const commitSaveFn = sharedPage.match(/const commitSave[\s\S]*?\}, \[store/)?.[0] ?? '';
  assert.match(commitSaveFn, /store[,\s]/,
    'commitSave must use the current in-memory store (which includes viewer temp edits)');
});

// ── G. normalizeLockerFile & normalizeSnapshot ────────────────────────────────

console.log('\nG. normalizeLockerFile & normalizeSnapshot');

test('normalizeLockerFile function defined in SharedChecklistPage', () => {
  assert.match(sharedPage, /function normalizeLockerFile/,
    'normalizeLockerFile must be defined in SharedChecklistPage.tsx');
});

test('normalizeLockerFile returns null for missing id', () => {
  assert.match(sharedPage, /normalizeLockerFile[\s\S]*?typeof raw\.id !== 'string'/,
    'normalizeLockerFile must reject entries missing a string id');
});

test('normalizeLockerFile returns null for missing name', () => {
  assert.match(sharedPage, /normalizeLockerFile[\s\S]*?typeof raw\.name !== 'string'/,
    'normalizeLockerFile must reject entries missing a string name');
});

test('normalizeLockerFile validates store.order is an array', () => {
  assert.match(sharedPage, /normalizeLockerFile[\s\S]*?Array\.isArray\(raw\.store\?\.order\)/,
    'normalizeLockerFile must validate store.order is an array');
});

test('normalizeLockerFile sanitizes items via sanitizeItems', () => {
  assert.match(sharedPage, /normalizeLockerFile[\s\S]*?sanitizeItems/,
    'normalizeLockerFile must call sanitizeItems to sanitize gear items');
});

test('normalizeLockerFile preserves bgTone dark/light safely', () => {
  const normFn = sharedPage.match(/function normalizeLockerFile[\s\S]*?return \{[\s\S]*?\};/)?.[0] ?? '';
  assert.match(normFn, /bgTone.*dark.*dark.*light/,
    'normalizeLockerFile must validate bgTone to "dark" or default "light"');
});

test('normalizeSnapshot handles lockerFiles field', () => {
  assert.match(sharedPage, /normalizeSnapshot[\s\S]*?lockerFiles/,
    'normalizeSnapshot must process the lockerFiles field from the raw payload');
});

test('normalizeSnapshot maps raw lockerFiles through normalizeLockerFile', () => {
  assert.match(sharedPage, /raw\.lockerFiles[\s\S]*?map\(normalizeLockerFile\)/,
    'normalizeSnapshot must map raw.lockerFiles through normalizeLockerFile');
});

test('normalizeSnapshot filters null normalizeLockerFile results', () => {
  assert.match(sharedPage, /map\(normalizeLockerFile\)[\s\S]*?filter.*f.*is.*SharedLockerFile/,
    'normalizeSnapshot must filter out null normalizeLockerFile results');
});

test('normalizeSnapshot returns undefined lockerFiles when none pass validation', () => {
  assert.match(sharedPage, /lockerFiles:.*lockerFiles.*&&.*lockerFiles\.length.*>.*0.*\?.*lockerFiles.*:.*undefined/,
    'normalizeSnapshot must return undefined (not empty array) when no lockerFiles survive validation');
});

// ── H. Private owner 021B regression ─────────────────────────────────────────

console.log('\nH. Private owner 021B regression — no password, Rename preserved');

test('LockerDeleteDialog has no password input (021B preserved)', () => {
  assert.doesNotMatch(lockDlg, /<input[^>]*type\s*=\s*["']password["']/,
    '021B regression: LockerDeleteDialog must not have a password input');
});

test('LockerDeleteDialog has Permanently Delete button (021B preserved)', () => {
  assert.match(lockDlg, /Permanently Delete/,
    '021B regression: LockerDeleteDialog must have Permanently Delete button');
});

test('LockerDeleteDialog has Cancel button (021B preserved)', () => {
  assert.match(lockDlg, /Cancel/,
    '021B regression: LockerDeleteDialog must have Cancel button');
});

test('LockerDeleteDialog does not import useSignIn (021B preserved)', () => {
  assert.doesNotMatch(lockDlg, /useSignIn/,
    '021B regression: LockerDeleteDialog must not import useSignIn');
});

test('Private LockerPanel still has onRename prop (021B preserved)', () => {
  assert.match(lockerPanel, /onRename.*\(id.*newName/,
    '021B regression: private LockerPanel must still have onRename prop');
});

test('Private LockerPanel still renders Pencil (rename) control', () => {
  assert.match(lockerPanel, /Pencil/,
    '021B regression: private LockerPanel must still render Pencil rename control');
});

// ── I. Auth route regression ──────────────────────────────────────────────────

console.log('\nI. Auth route regression');

test('/checklist route still redirects signed-out users (021A preserved)', () => {
  // The auth guard lives in Checklist.tsx (confirmed by 021A tests) — App.tsx delegates
  assert.match(checklist, /<Redirect\s+to=["']\/sign-in["']/,
    '021A regression: Checklist.tsx must render <Redirect to="/sign-in" /> for signed-out users');
});

test('/s/:shareId route has no auth guard in App.tsx', () => {
  const shareRoute = app.match(/\/s\/:[^}]+SharedChecklistPage[^}]*/s)?.[0] ?? '';
  assert.doesNotMatch(shareRoute, /RedirectToSignIn|requireAuth/,
    '021A regression: /s/:shareId route must not have an auth guard');
});

test('SharedChecklistPage does not redirect signed-out viewers', () => {
  assert.doesNotMatch(sharedPage, /setLocation\(['"]\/sign-in['"]\)/,
    '/s/:shareId must not redirect signed-out visitors to sign-in');
});

// ── J. 021 Share regression ───────────────────────────────────────────────────

console.log('\nJ. 021 Share regression');

test('order prop still passed to GearCategory in SharedChecklistPage', () => {
  assert.match(sharedPage, /order=\{store\.order\}/,
    '021 regression: GearCategory must still receive order={store.order}');
});

test('moveItem prop still passed to GearCategory in SharedChecklistPage', () => {
  assert.match(sharedPage, /moveItem=\{moveItem\}/,
    '021 regression: GearCategory must still receive moveItem={moveItem}');
});

test('normalizeSnapshot validates categoryOrder (021 regression)', () => {
  assert.match(sharedPage, /normalizeSnapshot[\s\S]*?Array\.isArray\(raw\.categoryOrder\)/,
    '021 regression: normalizeSnapshot must still validate categoryOrder');
});

test('normalizeSnapshot preserves name and unit fields (021 regression)', () => {
  assert.match(sharedPage, /name:.*typeof raw\.name.*string.*raw\.name/,
    '021 regression: normalizeSnapshot must preserve name field');
  assert.match(sharedPage, /unit:.*raw\.unit.*===.*metric.*imperial/,
    '021 regression: normalizeSnapshot must preserve unit field');
});

// ── K. 020F regression ────────────────────────────────────────────────────────

console.log('\nK. 020F regression');

test('LOCKER_KEY exported from usePackData (020F regression)', () => {
  const usePackData = readFileSync(path.join(root, 'hooks/usePackData.ts'), 'utf8');
  assert.match(usePackData, /export.*LOCKER_KEY/,
    '020F regression: LOCKER_KEY must still be exported from usePackData');
});

test('Checklist.tsx still imports LOCKER_KEY (020F regression)', () => {
  assert.match(checklist, /LOCKER_KEY.*from.*usePackData/,
    '020F regression: Checklist.tsx must still import LOCKER_KEY from usePackData');
});

test('newseed forkId still used for new blank tab (020F regression)', () => {
  assert.match(checklist, /forkId|tw-fork-id/,
    '020F regression: Checklist.tsx must still use forkId for new blank tab isolation');
});

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(60)}`);
console.log(`021C Shared Locker: ${passed} passed, ${failed} failed`);

if (failed > 0) process.exit(1);
