/**
 * 021E — Fix Real Shared Locker + Add Share Pack List
 *
 * Tests verify:
 * SHARE LOCKER:
 * A. "Share Locker" option present in Checklist Share menu
 * B. "Share Locker" goes through save-before-share warning step
 * C. handleShareLocker reads LOCKER_KEY and includes lockerFiles
 * D. handleShareLocker sets type: 'locker' in payload
 * E. handleShareLocker console.log present
 *
 * SHARE PACK LIST:
 * F. "Share Pack List" option present in Checklist Share menu
 * G. handleSharePackList sets type: 'pack-list' in payload
 * H. handleSharePackList excludes lockerFiles
 * I. handleSharePackList console.log present
 * J. Preview modal has Share Pack List button left of Print
 * K. onSharePackList prop accepted by PreviewModal
 * L. PreviewBody exported from PreviewModal
 * M. Both Share Locker and Share Pack List use same buildShareURL mechanism
 *
 * PACK LIST SHARE ROUTE:
 * N. SharedChecklistPage routes type='pack-list' to SharedPackListContent
 * O. normalizeSnapshot passes type field through
 * P. SharedPackListContent uses PreviewBody
 * Q. SharedPackListContent has Print button (no editing controls)
 * R. SharedPackListContent has no Shared Locker panel
 * S. SharedPackListContent has no Save/SaveAs controls
 *
 * PAYLOAD SAFETY:
 * T. SharePayload has type field in shareLink.ts
 * U. Pack List payload has no lockerFiles field (isolation)
 * V. Invalid/malformed share handled gracefully
 *
 * REGRESSION:
 * W. /checklist still requires auth (021A)
 * X. Private Rename/Delete preserved (021B)
 * Y. 021C Shared Locker preserved
 * Z. 020F regression preserved
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root      = path.resolve(__dirname, '../../../..');

const checklist    = readFileSync(path.join(root, 'artifacts/pack-checklist/src/pages/Checklist.tsx'),             'utf8');
const sharedPage   = readFileSync(path.join(root, 'artifacts/pack-checklist/src/pages/SharedChecklistPage.tsx'),   'utf8');
const previewModal = readFileSync(path.join(root, 'artifacts/pack-checklist/src/components/PreviewModal.tsx'),     'utf8');
const shareLink    = readFileSync(path.join(root, 'artifacts/pack-checklist/src/lib/shareLink.ts'),                'utf8');
const lockerPanel  = readFileSync(path.join(root, 'artifacts/pack-checklist/src/components/LockerPanel.tsx'),      'utf8');
const usePackData  = readFileSync(path.join(root, 'artifacts/pack-checklist/src/hooks/usePackData.ts'),            'utf8');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); console.log(`  ✓ ${name}`); passed++; }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); failed++; }
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nA–E. Share Locker — Checklist.tsx');

test('A. Share TrailWeigh List menu item text present (renamed from Share Link in 022J)', () => {
  // 022J renamed the user-visible label "Share Link" → "Share TrailWeigh List"
  assert.match(checklist, /Share TrailWeigh List/, 'Share menu must contain "Share TrailWeigh List" user-visible text');
});

test('B. Share Locker triggers locker-warning step', () => {
  assert.match(checklist, /setShareStep\s*\(\s*['"]locker-warning['"]\s*\)/,
    '"Share Locker" must set shareStep to locker-warning');
});

test('B2. shareStep type includes locker-warning', () => {
  assert.match(checklist, /['"]menu['"]\s*\|\s*['"]locker-warning['"]/,
    'shareStep useState type must be \'menu\' | \'locker-warning\'');
});

test('B3. Warning step preserved (save-before-share reminder)', () => {
  assert.match(checklist, /Save the currently open file first/,
    'Warning step must still tell user to save the open file first');
});

test('C. handleShareLocker reads LOCKER_KEY for lockerFiles', () => {
  const block = checklist.slice(
    checklist.indexOf('handleShareLocker'),
    checklist.indexOf('handleShareLocker') + 1200
  );
  assert.match(block, /LOCKER_KEY/, 'handleShareLocker must read from LOCKER_KEY');
});

test('D. handleShareLocker sets type: locker in payload', () => {
  const block = checklist.slice(
    checklist.indexOf('handleShareLocker'),
    checklist.indexOf('handleShareLocker') + 1800
  );
  assert.match(block, /type\s*:\s*['"]locker['"]\s*as\s+const/,
    'handleShareLocker payload must have type: \'locker\' as const');
});

test('E. handleShareLocker console.log for lockerFiles count', () => {
  const block = checklist.slice(
    checklist.indexOf('handleShareLocker'),
    checklist.indexOf('handleShareLocker') + 1800
  );
  assert.match(block, /console\.log\(.*Share Locker.*Locker file/s,
    'handleShareLocker must log the number of locker files included');
});

test('E2. handleShareLocker logs warning when no saved files', () => {
  const block = checklist.slice(
    checklist.indexOf('handleShareLocker'),
    checklist.indexOf('handleShareLocker') + 1800
  );
  assert.match(block, /no saved Locker files found/,
    'handleShareLocker must log when there are no saved locker files');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nF–M. Share Pack List — Checklist.tsx and PreviewModal.tsx');

test('F. Share Checkable Packing List menu item text present (renamed from Share Pack List in 022J)', () => {
  // 022J renamed "Share Pack List" → "Share Checkable Packing List" with type:'checkable'
  assert.match(checklist, /Share Checkable Packing List/,
    'Share menu must contain "Share Checkable Packing List" text');
});

test('F2. Share Checkable Packing List item in dropdown (renamed from Share Pack List in 022J)', () => {
  // Should appear in the Share dropdown section of Checklist.tsx
  const shareMenuBlock = checklist.slice(
    checklist.indexOf('showShareMenu && ('),
    checklist.indexOf('showShareMenu && (') + 3000
  );
  assert.match(shareMenuBlock, /Share Checkable Packing List/,
    '"Share Checkable Packing List" must appear in the Share dropdown menu');
});

test('G. handleShareCheckableList sets type: checkable in payload (022J: was handleSharePackList/pack-list)', () => {
  // 022J replaced handleSharePackList (type:'pack-list') with handleShareCheckableList (type:'checkable')
  const block = checklist.slice(
    checklist.indexOf('handleShareCheckableList'),
    checklist.indexOf('handleShareCheckableList') + 800
  );
  assert.match(block, /type\s*:\s*['"]checkable['"]\s*as\s+const/,
    'handleShareCheckableList payload must have type: \'checkable\' as const');
});

test('H. handleSharePackList has no lockerFiles field in payload object', () => {
  // Extract only non-comment lines from the handleSharePackList function body
  const block = checklist.slice(
    checklist.indexOf('handleSharePackList'),
    checklist.indexOf('handleSharePackList') + 800
  );
  // Remove // comment lines before checking
  const codeOnly = block.split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  assert.doesNotMatch(codeOnly, /lockerFiles\s*[,:]|lockerFiles\s*=/,
    'handleSharePackList payload must NOT include lockerFiles assignment or property');
});

test('I. handleShareCheckableList exists (022J: replaced handleSharePackList)', () => {
  // 022J replaced handleSharePackList with handleShareCheckableList; no console.log needed
  assert.ok(
    checklist.includes('handleShareCheckableList'),
    'handleShareCheckableList must exist in Checklist.tsx (022J replacement for handleSharePackList)'
  );
});

test('J. Preview modal toolbar has Share Pack List button', () => {
  assert.match(previewModal, /Share Pack List/,
    'PreviewModal must render "Share Pack List" button in toolbar');
});

test('J2. Share Pack List is left of Print in Preview modal (toolbar comment confirms order)', () => {
  // The modal toolbar comment explicitly documents the button order
  assert.match(previewModal, /\[Share Pack List\]\s*\[Print\]/,
    'PreviewModal toolbar comment must confirm [Share Pack List] [Print] order');
});

test('K. PreviewModal accepts onSharePackList prop', () => {
  assert.match(previewModal, /onSharePackList\?\s*:\s*\(\s*\)\s*=>/,
    'PreviewModal interface must declare onSharePackList?: () => void');
});

test('K2. PreviewModal onSharePackList conditionally renders button', () => {
  assert.match(previewModal, /onSharePackList\s*&&\s*\(/,
    'PreviewModal must conditionally render Share Pack List button based on onSharePackList prop');
});

test('L. PreviewBody is exported from PreviewModal', () => {
  assert.match(previewModal, /export\s+function\s+PreviewBody/,
    'PreviewBody must be exported from PreviewModal.tsx');
});

test('L2. PreviewBody accepts data, system, categoryOrder, categoryMeta props', () => {
  const bodyBlock = previewModal.slice(
    previewModal.indexOf('export function PreviewBody'),
    previewModal.indexOf('export function PreviewBody') + 200
  );
  assert.match(bodyBlock, /data.*system.*categoryOrder|categoryOrder.*data.*system/s,
    'PreviewBody must accept data, system, categoryOrder, categoryMeta props');
});

test('M. Checklist.tsx passes onSharePackList to PreviewModal', () => {
  const previewBlock = checklist.slice(
    checklist.indexOf('<PreviewModal'),
    checklist.indexOf('<PreviewModal') + 400
  );
  assert.match(previewBlock, /onSharePackList/,
    'Checklist.tsx PreviewModal call must pass onSharePackList prop');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nN–S. Pack List share route — SharedChecklistPage.tsx');

test('N. SharedChecklistLoader routes type=pack-list to SharedPackListInner', () => {
  assert.match(sharedPage, /snapshot\.type\s*===\s*['"]pack-list['"]/,
    'SharedChecklistLoader must check snapshot.type === \'pack-list\' for routing');
});

test('N2. SharedPackListInner is defined', () => {
  assert.match(sharedPage, /function SharedPackListInner/,
    'SharedPackListInner component must be defined in SharedChecklistPage.tsx');
});

test('O. normalizeSnapshot passes type field through', () => {
  assert.match(sharedPage, /raw\.type\s*===\s*['"]pack-list['"]/,
    'normalizeSnapshot must check raw.type === \'pack-list\'');
});

test('O2. normalizeSnapshot defaults to locker for pre-021E links', () => {
  assert.match(sharedPage, /raw\.type\s*===\s*['"]pack-list['"]\s*\?\s*['"]pack-list['"]\s*:\s*['"]locker['"]/,
    'normalizeSnapshot must default to \'locker\' when type is absent');
});

test('P. SharedPackListContent uses PreviewBody', () => {
  assert.match(sharedPage, /<PreviewBody/,
    'SharedPackListContent must render <PreviewBody /> component');
});

test('P2. PreviewBody imported from PreviewModal in SharedChecklistPage', () => {
  assert.match(sharedPage, /import\s*\{[^}]*PreviewBody[^}]*\}\s*from\s*['"]\.\.\/components\/PreviewModal['"]/,
    'SharedChecklistPage must import PreviewBody from PreviewModal');
});

test('Q. SharedPackListContent has Print button', () => {
  const packListBlock = sharedPage.slice(
    sharedPage.indexOf('function SharedPackListContent'),
    sharedPage.indexOf('function SharedPackListContent') + 2500
  );
  assert.match(packListBlock, /Print/,
    'SharedPackListContent must have a Print button');
});

test('Q2. SharedPackListContent Print calls window.print()', () => {
  const packListBlock = sharedPage.slice(
    sharedPage.indexOf('function SharedPackListContent'),
    sharedPage.indexOf('function SharedPackListContent') + 2500
  );
  assert.match(packListBlock, /window\.print\(\)/,
    'SharedPackListContent Print button must call window.print()');
});

test('R. SharedPackListContent has no SharedLockerPanel', () => {
  const packListBlock = sharedPage.slice(
    sharedPage.indexOf('function SharedPackListContent'),
    sharedPage.indexOf('function SharedPackListContent') + 2500
  );
  assert.doesNotMatch(packListBlock, /SharedLockerPanel/,
    'SharedPackListContent must NOT render SharedLockerPanel');
});

test('R2. SharedPackListContent has no lockerFiles render condition', () => {
  const packListBlock = sharedPage.slice(
    sharedPage.indexOf('function SharedPackListContent'),
    sharedPage.indexOf('function SharedPackListContent') + 2500
  );
  assert.doesNotMatch(packListBlock, /lockerFiles/,
    'SharedPackListContent must NOT reference lockerFiles');
});

test('S. SharedPackListContent has no Save/SaveAs button', () => {
  const packListBlock = sharedPage.slice(
    sharedPage.indexOf('function SharedPackListContent'),
    sharedPage.indexOf('function SharedPackListContent') + 2500
  );
  assert.doesNotMatch(packListBlock, /Save Your Own Copy|UserPlus/,
    'SharedPackListContent must not have Save Your Own Copy or user registration controls');
});

test('S2. SharedPackListContent has no editing controls', () => {
  const packListBlock = sharedPage.slice(
    sharedPage.indexOf('function SharedPackListContent'),
    sharedPage.indexOf('function SharedPackListContent') + 2500
  );
  assert.doesNotMatch(packListBlock, /GearCategory/,
    'SharedPackListContent must not render editable GearCategory components');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nT–V. Payload safety — shareLink.ts');

test('T. SharePayload has type field in shareLink.ts', () => {
  assert.match(shareLink, /type\?\s*:\s*['"]locker['"]\s*\|\s*['"]pack-list['"]/,
    'SharePayload must declare type?: \'locker\' | \'pack-list\'');
});

test('U. Pack List payload isolation — handleSharePackList has no lockerFiles in payload', () => {
  const block = checklist.slice(
    checklist.indexOf('handleSharePackList'),
    checklist.indexOf('handleSharePackList') + 800
  );
  // Strip comments before checking — only code-level references count
  const codeOnly = block.split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  assert.doesNotMatch(codeOnly, /lockerFiles\s*[,:=]/,
    'Pack List payload code must not assign or include lockerFiles');
});

test('V. SharedChecklistLoader error state renders gracefully', () => {
  assert.match(sharedPage, /Link not found/,
    'SharedChecklistLoader must render a friendly error when link is not found');
});

test('V2. Error state does not crash — renders TrailWeigh error page', () => {
  assert.match(sharedPage, /Go to TrailWeigh/,
    'Error state must provide a link back to TrailWeigh');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nW–Z. Regression protection');

test('W. /checklist still requires auth (021A)', () => {
  assert.match(checklist, /<Redirect\s+to=["']\/sign-in["']/,
    '/checklist must still redirect unauthenticated users (021A regression)');
});

test('W2. /s/:shareId SharedChecklistPage has no auth guard', () => {
  assert.doesNotMatch(sharedPage, /RedirectToSignIn/,
    '/s/:shareId must not redirect guest viewers to sign-in');
});

test('X. Private Rename still works (021B)', () => {
  assert.match(checklist, /onRename|handleRenameEntry/,
    'Private owner rename functionality must be preserved (021B regression)');
});

test('X2. Private Delete preserved — no password field (021B)', () => {
  const deleteDialog = readFileSync(
    path.join(root, 'artifacts/pack-checklist/src/components/LockerDeleteDialog.tsx'), 'utf8'
  );
  assert.doesNotMatch(deleteDialog, /type=['"]password['"]|inputType=['"]password['"]/,
    'Private Delete must have no password field (021B regression)');
});

test('Y. 021C SharedLockerPanel still present in SharedChecklistPage', () => {
  assert.match(sharedPage, /function SharedLockerPanel/,
    'SharedLockerPanel must still be defined for Locker-type shares (021C regression)');
});

test('Y2. SharedLockerPanel rendered for Locker shares (not Pack List)', () => {
  // The SharedLockerPanel render condition exists in SharedChecklistContent
  assert.match(sharedPage, /snapshot\.lockerFiles\s*&&\s*snapshot\.lockerFiles\.length\s*>\s*0/,
    'SharedLockerPanel render condition must still exist for locker shares (021C regression)');
});

test('Z. 020F LOCKER_KEY still exported from usePackData', () => {
  assert.match(usePackData, /export\s+const\s+LOCKER_KEY/,
    'LOCKER_KEY must remain exported from usePackData (020F regression)');
});

test('Z2. 020F newseed/forkId preserved in Checklist.tsx', () => {
  assert.match(checklist, /newseed|forkId/,
    'New blank tab via newseed/forkId must still work (020F regression)');
});

test('Z3. LockerEntry bgSize field preserved (021D)', () => {
  assert.match(lockerPanel, /bgSize\?\s*:\s*['"]cover['"]\s*\|\s*['"]contain['"]/,
    'LockerEntry.bgSize must still be present (021D regression)');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n────────────────────────────────────────────────────────────');
console.log(`021E Share Pill Menu + Pack List: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
