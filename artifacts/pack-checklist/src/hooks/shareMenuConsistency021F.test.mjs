/**
 * 021F — Fix Share Menu Consistency + Panel Order + Share Labels
 *
 * Four fixes:
 * 1. Share menu label: "Share Locker" → "Share Link"
 * 2. Share Pack List subtitle: "Current list, read-only" → "Copy link, read-only"
 * 3. Right sidebar panel order: SharedLockerPanel at bottom (after Pack Summary)
 * 4. Root cause of "Download PDF only" in one tab: SharedChecklistPage.tsx Share button is read-only
 *
 * Tests verify:
 * LABEL CHANGES:
 * A. "Share Link" is the user-visible label (not "Share Locker")
 * B. "Share Locker" no longer appears as a menu item label in owner Share menu
 * C. Share Link subtitle = "All your saved files"
 * D. Share Pack List subtitle = "Copy link, read-only" (not "Current list, read-only")
 * E. "Current list, read-only" no longer appears in the Share Pack List option
 * F. Warning step confirm button says "Share Link Anyway" (not "Share Locker Anyway")
 *
 * SHARE MENU STRUCTURE:
 * G. All 3 entries present in owner dropdown: Share Link + Share Pack List + Download PDF
 * H. Share menu opens for canShare=true state (Share button active)
 * I. Share Link still triggers locker-warning step (functionality unchanged)
 * J. Internal handleShareLocker function name unchanged (label change only)
 * K. type:'locker' payload still set (underlying behavior unchanged)
 *
 * PANEL ORDER:
 * L. WeightSummary (Pack Summary) comes before SharedLockerPanel in SharedChecklistPage
 * M. ImportGearPanel (Scan Gear List) comes before SharedLockerPanel in SharedChecklistPage
 * N. SharedLockerPanel render is after WeightSummary and ImportGearPanel in JSX
 * O. Normal owner sidebar order: WeightSummary → WeightDistribution → ImportGearPanel → LockerPanel
 *
 * SHARED VIEW ISOLATION (root cause of "Download PDF only"):
 * P. SharedChecklistPage Share button intentionally shows only Download PDF (read-only)
 * Q. SharedChecklistPage Share button comment documents this intent
 * R. Owner /checklist Share button is a different code path from SharedChecklistPage Share button
 *
 * REGRESSION:
 * S. "Share Link" functionality preserved — handleShareLocker builds lockerFiles
 * T. handleSharePackList unchanged — type:'pack-list', no lockerFiles
 * U. Preview modal still has Share Pack List button
 * V. SharePayload type field still present
 * W. 021A /checklist auth protection preserved
 * X. 021B private Rename/Delete preserved
 * Y. 021C SharedLockerPanel still view-only (no Rename/Delete)
 * Z. 020F LOCKER_KEY/newseed preserved
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
console.log('\nA–F. Label changes in Checklist.tsx');

test('A. "Share TrailWeigh List" is the user-visible label in owner Share menu (022J renamed from "Share Link")', () => {
  assert.match(checklist, /Share TrailWeigh List/,
    'Owner Share menu must show "Share TrailWeigh List" as the user-visible label (022J rename)');
});

test('B. "Share Locker" no longer appears as a user-visible menu item label', () => {
  // Extract the Share dropdown JSX block (between showShareMenu && and the closing)
  const menuBlock = checklist.slice(
    checklist.indexOf('{showShareMenu && ('),
    checklist.indexOf('{showShareMenu && (') + 4000
  );
  // Strip comment lines before checking — internal comments may still say Share Locker
  const codeLines = menuBlock.split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  // Check no JSX text node says "Share Locker" (e.g. {copied ? 'Copied!' : 'Share Locker'})
  assert.doesNotMatch(codeLines, /['"`]Share Locker['"`]/,
    'The label "Share Locker" must not appear in the user-visible Share menu JSX (label renamed to Share Link)');
});

test('C. Share TrailWeigh List subtitle = "Full list with all saved files" (022J updated subtitle)', () => {
  assert.match(checklist, /Full list with all saved files/,
    'Share TrailWeigh List subtitle must be "Full list with all saved files" (022J)');
});

test('D. Share Checkable Packing List subtitle present (022J renamed from Share Pack List)', () => {
  assert.match(checklist, /Simple checklist for packing/,
    'Share Checkable Packing List subtitle must be "Simple checklist for packing" (022J)');
});

test('E. "Current list, read-only" no longer appears in owner Share menu', () => {
  assert.doesNotMatch(checklist, /Current list, read-only/,
    '"Current list, read-only" must be replaced by "Copy link, read-only" (021F label change)');
});

test('F. Warning step confirm button says "Share Link Anyway"', () => {
  assert.match(checklist, /Share Link Anyway/,
    'Warning step confirm button must say "Share Link Anyway" (not "Share Locker Anyway")');
});

test('F2. "Share Locker Anyway" no longer appears in owner Share menu JSX', () => {
  const menuBlock = checklist.slice(
    checklist.indexOf('{showShareMenu && ('),
    checklist.indexOf('{showShareMenu && (') + 4000
  );
  const codeLines = menuBlock.split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  assert.doesNotMatch(codeLines, /['"`]Share Locker Anyway['"`]/,
    '"Share Locker Anyway" must be replaced by "Share Link Anyway" (021F label change)');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nG–K. Share menu structure — Checklist.tsx');

test('G. All 3 entries present in owner Share dropdown (022J labels)', () => {
  const menuBlock = checklist.slice(
    checklist.indexOf('{showShareMenu && ('),
    checklist.indexOf('{showShareMenu && (') + 4000
  );
  assert.match(menuBlock, /Share TrailWeigh List/, 'Share TrailWeigh List must be in dropdown (022J)');
  assert.match(menuBlock, /Share Checkable Packing List/, 'Share Checkable Packing List must be in dropdown (022J)');
  assert.match(menuBlock, /Download PDF/, 'Download PDF must be in dropdown');
});

test('H. Share button renders when canShare=true (active share path exists)', () => {
  // The active Share button (not the dimmed one) must be present in JSX
  assert.match(checklist, /setShowShareMenu\(o => !o\)/,
    'Active Share button must toggle showShareMenu state');
});

test('I. Share Link triggers locker-warning step', () => {
  assert.match(checklist, /setShareStep\(\s*['"]locker-warning['"]\s*\)/,
    'Share Link item must call setShareStep("locker-warning")');
});

test('J. Internal handleShareLocker function name unchanged', () => {
  assert.match(checklist, /const handleShareLocker = async/,
    'Internal function name handleShareLocker must not be renamed (label change only per spec)');
});

test('K. type:locker payload still set in handleShareLocker', () => {
  const block = checklist.slice(
    checklist.indexOf('const handleShareLocker'),
    checklist.indexOf('const handleShareLocker') + 1800
  );
  assert.match(block, /type\s*:\s*['"]locker['"]\s*as\s+const/,
    'handleShareLocker payload must still set type: "locker"');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nL–O. Right sidebar panel order');

test('L. WeightSummary appears before SharedLockerPanel in SharedChecklistPage sidebar', () => {
  const sidebarBlock = sharedPage.slice(
    sharedPage.indexOf('Scrollable sidebar content'),
    sharedPage.indexOf('Scrollable sidebar content') + 1800
  );
  const weightPos  = sidebarBlock.indexOf('WeightSummary');
  const lockerPos  = sidebarBlock.indexOf('SharedLockerPanel');
  assert.ok(weightPos > -1, 'WeightSummary must be present in sidebar');
  assert.ok(lockerPos > -1, 'SharedLockerPanel must be present in sidebar');
  assert.ok(weightPos < lockerPos,
    'WeightSummary (Pack Summary) must appear BEFORE SharedLockerPanel (Shared Files) in sidebar JSX');
});

test('M. ImportGearPanel appears before SharedLockerPanel in SharedChecklistPage sidebar', () => {
  const sidebarBlock = sharedPage.slice(
    sharedPage.indexOf('Scrollable sidebar content'),
    sharedPage.indexOf('Scrollable sidebar content') + 1800
  );
  const importPos  = sidebarBlock.indexOf('ImportGearPanel');
  const lockerPos  = sidebarBlock.indexOf('SharedLockerPanel');
  assert.ok(importPos > -1, 'ImportGearPanel must be present in sidebar');
  assert.ok(lockerPos > -1, 'SharedLockerPanel must be present in sidebar');
  assert.ok(importPos < lockerPos,
    'ImportGearPanel (Scan Gear List) must appear BEFORE SharedLockerPanel in sidebar JSX');
});

test('N. SharedLockerPanel is the LAST panel in the SharedChecklistPage sidebar', () => {
  const sidebarBlock = sharedPage.slice(
    sharedPage.indexOf('Scrollable sidebar content'),
    sharedPage.indexOf('Scrollable sidebar content') + 1800
  );
  const lockerPos    = sidebarBlock.lastIndexOf('SharedLockerPanel');
  const weightPos    = sidebarBlock.indexOf('WeightSummary');
  const importPos    = sidebarBlock.indexOf('ImportGearPanel');
  assert.ok(lockerPos > weightPos && lockerPos > importPos,
    'SharedLockerPanel must be the last panel in the sidebar (below Pack Summary and Scan Gear List)');
});

test('O. Normal owner sidebar order: WeightSummary → WeightDistribution → ImportGearPanel → LockerPanel', () => {
  const sidebarBlock = checklist.slice(
    checklist.indexOf('Scrollable sidebar content'),
    checklist.indexOf('Scrollable sidebar content') + 2000  // wider slice — LockerPanel is ~28 lines down
  );
  const summaryPos = sidebarBlock.indexOf('WeightSummary');
  const distPos    = sidebarBlock.indexOf('WeightDistribution');
  const importPos  = sidebarBlock.indexOf('ImportGearPanel');
  const lockerPos  = sidebarBlock.indexOf('LockerPanel');
  assert.ok(summaryPos > -1 && distPos > -1 && importPos > -1 && lockerPos > -1,
    'All four panels must appear in the sidebar block');
  assert.ok(summaryPos < distPos,  'WeightSummary must come before WeightDistribution');
  assert.ok(distPos    < importPos,'WeightDistribution must come before ImportGearPanel');
  assert.ok(importPos  < lockerPos,'ImportGearPanel must come before LockerPanel');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nP–R. Shared view isolation (root cause documentation)');

test('P. SharedChecklistPage Share menu has recipient-appropriate actions (updated by 022I)', () => {
  // handleSharePdf function must exist in SharedChecklistPage
  assert.match(sharedPage, /handleSharePdf/,
    'SharedChecklistPage must define handleSharePdf for its Download PDF button');
  // SharedChecklistPage must NOT use owner-only share handlers (handleShareLocker is private-checklist-only)
  assert.ok(
    !sharedPage.includes('handleShareLocker'),
    'SharedChecklistPage must not have handleShareLocker — that is private-checklist-only'
  );
  // 022I: recipient share menu must now contain multiple share options
  assert.match(sharedPage, /Share TrailWeigh List/,
    'SharedChecklistPage Share menu must contain Share TrailWeigh List (022I)');
  assert.match(sharedPage, /Share Checkable Packing List/,
    'SharedChecklistPage Share menu must contain Share Checkable Packing List (022I)');
});

test('Q. SharedChecklistPage Share button is for recipients only (no owner-only controls)', () => {
  // Must not expose owner handlers
  assert.ok(
    !sharedPage.includes('handleShareLocker'),
    'SharedChecklistPage must not include handleShareLocker (owner-only)'
  );
  // handleSharePdf, handleShareTrailWeighList, handleShareCheckableList are all recipient-safe
  assert.match(sharedPage, /handleShareTrailWeighList/,
    'SharedChecklistPage must have handleShareTrailWeighList for re-sharing current link');
  assert.match(sharedPage, /handleShareCheckableList/,
    'SharedChecklistPage must have handleShareCheckableList for packing-list view');
});

test('R. Owner /checklist Share is a separate code path (different component)', () => {
  // The owner Share is in ChecklistContent, not in SharedChecklistContent
  // Both use showShareMenu state but in completely independent component instances
  const ownerShare   = checklist.includes('handleShareLocker');
  const sharedHasNo  = !sharedPage.includes('handleShareLocker');
  assert.ok(ownerShare,  'Owner checklist must have handleShareLocker');
  assert.ok(sharedHasNo, 'SharedChecklistPage must NOT have handleShareLocker (separate code path)');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nS–Z. Regression protection');

test('S. handleShareLocker still builds lockerFiles from LOCKER_KEY', () => {
  const block = checklist.slice(
    checklist.indexOf('const handleShareLocker'),
    checklist.indexOf('const handleShareLocker') + 1800
  );
  assert.match(block, /localStorage\.getItem\(LOCKER_KEY\)/,
    'handleShareLocker must still read LOCKER_KEY to build lockerFiles');
});

test('T. handleShareCheckableList type:checkable, no lockerFiles (022J replaced handleSharePackList)', () => {
  // 022J replaced handleSharePackList (type:pack-list) with handleShareCheckableList (type:checkable)
  const block = checklist.slice(
    checklist.indexOf('const handleShareCheckableList'),
    checklist.indexOf('const handleShareCheckableList') + 800
  );
  assert.match(block, /type\s*:\s*['"]checkable['"]/,
    'handleShareCheckableList must set type: "checkable" (022J)');
  const codeOnly = block.split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  assert.doesNotMatch(codeOnly, /lockerFiles\s*[,:=]/,
    'handleShareCheckableList must not include lockerFiles');
});

test('U. Preview modal still has Share Pack List button', () => {
  assert.match(previewModal, /Share Pack List/,
    'PreviewModal must still render Share Pack List button in toolbar');
});

test('V. SharePayload type field still present in shareLink.ts', () => {
  assert.match(shareLink, /type\?\s*:\s*['"]locker['"]\s*\|\s*['"]pack-list['"]/,
    'SharePayload must still declare type?: "locker" | "pack-list"');
});

test('W. /checklist auth protection preserved (021A regression)', () => {
  assert.match(checklist, /<Redirect\s+to=["']\/sign-in["']/,
    '/checklist must still redirect unauthenticated users');
});

test('X. Private Rename preserved (021B regression)', () => {
  assert.match(checklist, /handleRenameInLocker|onRename/,
    'Private owner rename must still exist');
});

test('X2. Private Delete preserved — no password (021B regression)', () => {
  const deleteDialog = readFileSync(
    path.join(root, 'artifacts/pack-checklist/src/components/LockerDeleteDialog.tsx'), 'utf8'
  );
  assert.doesNotMatch(deleteDialog, /type=['"]password['"]/,
    'LockerDeleteDialog must still have no password field');
});

test('Y. SharedLockerPanel view-only — no Rename in shared view (021C regression)', () => {
  const panelFn = sharedPage.match(/function SharedLockerPanel[\s\S]*?\nfunction /)?.[0] ?? '';
  assert.doesNotMatch(panelFn, /Pencil/,
    'SharedLockerPanel must still have no Pencil (rename) control');
});

test('Y2. SharedLockerPanel view-only — no Delete in shared view (021C regression)', () => {
  const panelFn = sharedPage.match(/function SharedLockerPanel[\s\S]*?\nfunction /)?.[0] ?? '';
  assert.doesNotMatch(panelFn, /Trash/,
    'SharedLockerPanel must still have no Trash (delete) control');
});

test('Z. 020F LOCKER_KEY still exported from usePackData', () => {
  assert.match(usePackData, /export\s+const\s+LOCKER_KEY/,
    'LOCKER_KEY must remain exported from usePackData');
});

test('Z2. LockerEntry bgSize field preserved (021D regression)', () => {
  assert.match(lockerPanel, /bgSize\?\s*:\s*['"]cover['"]\s*\|\s*['"]contain['"]/,
    'LockerEntry.bgSize must still be present');
});

test('Z3. Share Link Anyway (warning step) triggers handleShareLocker', () => {
  // The warning step calls await handleShareLocker() — search the full file
  // (menuBlock slice from showShareMenu covers the warning step too, but using full file is safer)
  assert.match(checklist, /Share Link Anyway[\s\S]{0,300}handleShareLocker\(\)|handleShareLocker\(\)[\s\S]{0,300}Share Link Anyway/,
    'Share Link Anyway button must call handleShareLocker() in the warning step');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n────────────────────────────────────────────────────────────');
console.log(`021F Share Menu + Panel Order + Labels: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
