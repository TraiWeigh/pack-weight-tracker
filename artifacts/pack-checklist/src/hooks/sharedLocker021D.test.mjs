/**
 * 021D — Shared Locker Visible in Real Shared Link
 *
 * Tests verify:
 * A. bgSize added to LockerEntry interface (no longer hardcoded)
 * B. commitSaveNew/commitSaveReplace save bgSize
 * C. handleCopyLink uses e.bgSize (not hardcoded 'cover')
 * D. normalizeLockerFile preserves actual bgSize (contain vs cover)
 * E. handleCopyLink console.log present (debuggability)
 * F. normalizeSnapshot debug log present
 * G. SharedLockerPanel render condition unchanged
 * H. Viewer isolation preserved (no write to sender)
 * I. 021C auth regression preserved
 * J. 020F regression preserved
 * K. Private bgSize restored on Locker load (handleLoadFromLocker)
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root      = path.resolve(__dirname, '../../../..');

const lockerPanel  = readFileSync(path.join(root, 'artifacts/pack-checklist/src/components/LockerPanel.tsx'),       'utf8');
const checklist    = readFileSync(path.join(root, 'artifacts/pack-checklist/src/pages/Checklist.tsx'),              'utf8');
const sharedPage   = readFileSync(path.join(root, 'artifacts/pack-checklist/src/pages/SharedChecklistPage.tsx'),   'utf8');
const shareLink    = readFileSync(path.join(root, 'artifacts/pack-checklist/src/lib/shareLink.ts'),                 'utf8');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); console.log(`  ✓ ${name}`); passed++; }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); failed++; }
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nA. LockerEntry.bgSize — interface field added');

test('LockerEntry interface has bgSize field', () => {
  assert.match(lockerPanel, /bgSize\?\s*:\s*['"]cover['"]\s*\|\s*['"]contain['"]/,
    'LockerEntry must declare bgSize?: \'cover\' | \'contain\'');
});

test('bgSize field is optional (backward-compatible)', () => {
  assert.match(lockerPanel, /bgSize\?/,
    'bgSize must be optional (?) for backward compatibility with older entries');
});

test('LockerEntry bgSize comes after bgTone in interface', () => {
  const bgTonePos = lockerPanel.indexOf('bgTone');
  const bgSizePos = lockerPanel.indexOf('bgSize');
  assert.ok(bgSizePos > bgTonePos, 'bgSize field must appear after bgTone in LockerEntry interface');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nB. commitSaveNew includes bgSize');

test('commitSaveNew includes bgSize in entry object', () => {
  // Find the commitSaveNew function and check it has bgSize
  const saveNewBlock = checklist.slice(
    checklist.indexOf('commitSaveNew = useCallback'),
    checklist.indexOf('commitSaveNew = useCallback') + 800
  );
  assert.match(saveNewBlock, /bgSize[,\n]/, 'commitSaveNew must include bgSize in LockerEntry');
});

test('commitSaveNew dependency array includes bgSize', () => {
  const saveNewBlock = checklist.slice(
    checklist.indexOf('commitSaveNew = useCallback'),
    checklist.indexOf('commitSaveNew = useCallback') + 1200
  );
  assert.match(saveNewBlock, /bgSize.*chartPaletteKey|chartPaletteKey.*bgSize/s, 'commitSaveNew useCallback dependency array must include bgSize');
});

test('commitSaveReplace includes bgSize in entry object', () => {
  const saveReplaceBlock = checklist.slice(
    checklist.indexOf('commitSaveReplace = useCallback'),
    checklist.indexOf('commitSaveReplace = useCallback') + 1400
  );
  assert.match(saveReplaceBlock, /bgSize[,\n]/, 'commitSaveReplace must include bgSize in LockerEntry');
});

test('commitSaveReplace dependency array includes bgSize', () => {
  const saveReplaceBlock = checklist.slice(
    checklist.indexOf('commitSaveReplace = useCallback'),
    checklist.indexOf('commitSaveReplace = useCallback') + 1400
  );
  assert.match(saveReplaceBlock, /bgSize.*chartPaletteKey|chartPaletteKey.*bgSize/s, 'commitSaveReplace useCallback dependency array must include bgSize');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nC. handleCopyLink reads e.bgSize (not hardcoded)');

test('handleCopyLink does NOT hardcode bgSize as cover', () => {
  assert.doesNotMatch(checklist, /bgSize:\s*['"]cover['"]\s*as\s+const/,
    'handleCopyLink must not hardcode bgSize as \'cover\' as const — must read from entry');
});

test('handleCopyLink reads e.bgSize with fallback', () => {
  assert.match(checklist, /bgSize:\s*e\.bgSize\s*\?\?\s*['"]cover['"]/,
    'handleCopyLink must use e.bgSize ?? \'cover\' for backward-compatible bgSize');
});

test('handleCopyLink lockerFiles map still includes id, name, store fields', () => {
  const copyLinkBlock = checklist.slice(
    checklist.indexOf('handleCopyLink = async'),
    checklist.indexOf('handleCopyLink = async') + 1200
  );
  assert.match(copyLinkBlock, /id:\s*e\.id/, 'handleCopyLink must map e.id');
  assert.match(copyLinkBlock, /name:\s*e\.name/, 'handleCopyLink must map e.name');
  assert.match(copyLinkBlock, /store:\s*e\.store/, 'handleCopyLink must map e.store');
});

test('handleCopyLink lockerFiles still includes bgFade and bgTone', () => {
  const copyLinkBlock = checklist.slice(
    checklist.indexOf('handleCopyLink = async'),
    checklist.indexOf('handleCopyLink = async') + 1200
  );
  assert.match(copyLinkBlock, /bgFade:\s*e\.bgFade\s*\?\?/, 'handleCopyLink must read e.bgFade');
  assert.match(copyLinkBlock, /bgTone:\s*e\.bgTone\s*\?\?/, 'handleCopyLink must read e.bgTone');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nD. normalizeLockerFile preserves bgSize correctly');

test('normalizeLockerFile preserves contain when bgSize=contain', () => {
  assert.match(sharedPage, /raw\.bgSize\s*===\s*['"]contain['"]\s*\?\s*['"]contain['"]\s*:\s*['"]cover['"]/,
    'normalizeLockerFile must preserve contain and fall back to cover safely');
});

test('normalizeLockerFile does NOT hardcode bgSize to cover', () => {
  // The normalizeLockerFile function must use raw.bgSize check, not a hardcoded value
  const normalizeBlock = sharedPage.slice(
    sharedPage.indexOf('function normalizeLockerFile'),
    sharedPage.indexOf('function normalizeLockerFile') + 800
  );
  assert.doesNotMatch(normalizeBlock, /bgSize:\s*['"]cover['"]/,
    'normalizeLockerFile must not hardcode bgSize — it must check raw.bgSize');
});

test('SharePayload interface bgSize field present in shareLink.ts', () => {
  assert.match(shareLink, /bgSize\?\s*:\s*['"]cover['"]\s*\|\s*['"]contain['"]/,
    'SharedLockerFile in shareLink.ts must have bgSize?: \'cover\' | \'contain\'');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nE. handleCopyLink console.log for debuggability');

test('handleCopyLink logs number of lockerFiles included', () => {
  assert.match(checklist, /console\.log\(.*lockerFiles\.length/,
    'handleCopyLink must console.log the number of lockerFiles for debugging');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nF. normalizeSnapshot debug log');

test('normalizeSnapshot logs raw.lockerFiles count', () => {
  assert.match(sharedPage, /console\.log\(.*raw\.lockerFiles/,
    'normalizeSnapshot must console.log raw.lockerFiles count for debugging');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nG. SharedLockerPanel render condition unchanged');

test('SharedLockerPanel still rendered when snapshot.lockerFiles present', () => {
  assert.match(sharedPage, /snapshot\.lockerFiles\s*&&\s*snapshot\.lockerFiles\.length\s*>\s*0/,
    'SharedLockerPanel render condition must check snapshot.lockerFiles && length > 0');
});

test('SharedLockerPanel receives files={snapshot.lockerFiles}', () => {
  assert.match(sharedPage, /files=\{snapshot\.lockerFiles\}/,
    'SharedLockerPanel must receive files prop from snapshot.lockerFiles');
});

test('SharedLockerPanel has NO Rename/Pencil control', () => {
  const panelBlock = sharedPage.slice(
    sharedPage.indexOf('function SharedLockerPanel'),
    sharedPage.indexOf('function SharedLockerPanel') + 1500
  );
  assert.doesNotMatch(panelBlock, /Pencil/, 'SharedLockerPanel must have no Pencil rename control');
  assert.doesNotMatch(panelBlock, /onRename/, 'SharedLockerPanel must have no onRename prop');
});

test('SharedLockerPanel has NO Delete/Trash control', () => {
  const panelBlock = sharedPage.slice(
    sharedPage.indexOf('function SharedLockerPanel'),
    sharedPage.indexOf('function SharedLockerPanel') + 1500
  );
  assert.doesNotMatch(panelBlock, /Trash/, 'SharedLockerPanel must have no Trash delete control');
  assert.doesNotMatch(panelBlock, /onRequestDelete/, 'SharedLockerPanel must have no onRequestDelete');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nH. Viewer isolation — sender data never written');

test('pushAndSet in SharedChecklistPage has no localStorage.setItem', () => {
  // pushAndSet should only modify React state, never write to localStorage
  const pushAndSetBlock = sharedPage.slice(
    sharedPage.indexOf('function pushAndSet') > -1
      ? sharedPage.indexOf('function pushAndSet')
      : sharedPage.indexOf('pushAndSet ='),
    Math.min(
      sharedPage.indexOf('function pushAndSet') > -1
        ? sharedPage.indexOf('function pushAndSet') + 400
        : sharedPage.indexOf('pushAndSet =') + 400,
      sharedPage.length
    )
  );
  assert.doesNotMatch(pushAndSetBlock, /localStorage\.setItem/,
    'pushAndSet must not write to localStorage — viewer edits are session-only');
});

test('switchToFile does not write to localStorage', () => {
  const switchBlock = sharedPage.slice(
    sharedPage.indexOf('switchToFile'),
    sharedPage.indexOf('switchToFile') + 800
  );
  assert.doesNotMatch(switchBlock, /localStorage\.setItem/,
    'switchToFile must not write to localStorage — file switching is in-memory only');
});

test('commitSave in SharedChecklistPage uses crypto.randomUUID for new copy', () => {
  assert.match(sharedPage, /crypto\.randomUUID\(\)/,
    'Save Your Own Copy must generate a new UUID — never reuse sender file IDs');
});

test('commitSave writes only to LOCKER_KEY via writeLockerEntry (recipient own copy)', () => {
  // commitSave calls writeLockerEntry which writes to LOCKER_KEY — never sender's storage
  const startIdx = sharedPage.indexOf('const commitSave');
  const commitSaveBlock = sharedPage.slice(startIdx, startIdx + 600);
  assert.match(commitSaveBlock, /writeLockerEntry/, 'commitSave must call writeLockerEntry to write to viewer\'s own LOCKER_KEY');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nI. 021C auth regression preserved');

test('/checklist still redirects signed-out users (021A regression)', () => {
  assert.match(checklist, /<Redirect\s+to=["']\/sign-in["']/,
    'Checklist must still redirect unauthenticated users to /sign-in (021A regression)');
});

test('/s/:shareId SharedChecklistPage has no auth guard', () => {
  assert.doesNotMatch(sharedPage, /RedirectToSignIn/,
    'SharedChecklistPage must not redirect signed-out viewers to sign-in');
});

test('SharedLockerPanel is NOT the private LockerPanel component', () => {
  // SharedLockerPanel is defined inline, not imported from LockerPanel.tsx
  assert.doesNotMatch(sharedPage, /import.*LockerPanel.*from.*LockerPanel/,
    'SharedChecklistPage must not import private LockerPanel component');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nJ. 020F regression preserved');

test('LOCKER_KEY is still exported from usePackData', () => {
  const usePackData = readFileSync(
    path.join(root, 'artifacts/pack-checklist/src/hooks/usePackData.ts'), 'utf8'
  );
  assert.match(usePackData, /export\s+const\s+LOCKER_KEY/,
    'LOCKER_KEY must remain exported from usePackData (020F regression)');
});

test('Checklist.tsx still imports LOCKER_KEY', () => {
  assert.match(checklist, /import\s*\{[^}]*LOCKER_KEY[^}]*\}/,
    'Checklist.tsx must still import LOCKER_KEY (020F regression)');
});

test('newseed forkId preserved for new blank tab', () => {
  assert.match(checklist, /newseed|forkId/,
    'New blank tab via newseed/forkId must still be preserved (020F regression)');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nK. Private bgSize restored on Locker load (handleLoadFromLocker)');

test('handleLoadFromLocker restores bgSize from entry', () => {
  const loadBlock = checklist.slice(
    checklist.indexOf('handleLoadFromLocker'),
    checklist.indexOf('handleLoadFromLocker') + 2000
  );
  assert.match(loadBlock, /setBgSize\s*\(\s*entry\.bgSize/,
    'handleLoadFromLocker must call setBgSize(entry.bgSize ?? ...) to restore saved Fill/Fit');
});

test('handleLoadFromLocker uses ?? fallback for missing bgSize (backward-compat)', () => {
  const loadBlock = checklist.slice(
    checklist.indexOf('handleLoadFromLocker'),
    checklist.indexOf('handleLoadFromLocker') + 2000
  );
  assert.match(loadBlock, /setBgSize\s*\(\s*entry\.bgSize\s*\?\?/,
    'handleLoadFromLocker bgSize restore must have ?? fallback for older entries without bgSize');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n────────────────────────────────────────────────────────────');
console.log(`021D Shared Locker Visible: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
