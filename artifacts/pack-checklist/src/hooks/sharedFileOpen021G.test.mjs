/**
 * 021G — Shared File Open + Scan Gear List Chevron
 *
 * Root cause: SharedLockerPanel file rows had no onClick handler — only the
 * small FolderOpen icon button (3.5×3.5px, opacity-60) responded to clicks.
 * Users who click the file NAME do nothing visible. The entire row is now the
 * click target (role="button", cursor-pointer, onClick, onKeyDown).
 *
 * Secondary fix: ImportGearPanel chevron now shows ChevronDown in both open
 * and closed states (visual-only — no behaviour change).
 *
 * Test groups:
 * A. Row click target — structural
 * B. switchToFile logic — code paths
 * C. File state isolation — per-file temp state
 * D. Shared view permissions — Rename/Delete absent
 * E. Scan Gear List chevron — visual fix
 * F. Share menu labels — 021F regression
 * G. Panel order — 021F regression
 * H. 021A/021B/021C regressions
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root      = path.resolve(__dirname, '../../../..');

const sharedPage   = readFileSync(path.join(root, 'artifacts/pack-checklist/src/pages/SharedChecklistPage.tsx'),  'utf8');
const importPanel  = readFileSync(path.join(root, 'artifacts/pack-checklist/src/components/ImportGearPanel.tsx'), 'utf8');
const checklist    = readFileSync(path.join(root, 'artifacts/pack-checklist/src/pages/Checklist.tsx'),            'utf8');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); console.log(`  ✓ ${name}`); passed++; }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); failed++; }
}

// Pull out the SharedLockerPanel function body for targeted assertions
const panelFnMatch = sharedPage.match(/function SharedLockerPanel[\s\S]*?\nfunction /);
const panelFn = panelFnMatch?.[0] ?? '';

// Pull out just the file-row JSX block for targeted assertions
const rowBlockMatch = sharedPage.match(/files\.map\(file => \([^)]*[\s\S]*?\/div>\s*\)\s*\)\s*\}\)\s*\}/);
const rowBlock = rowBlockMatch?.[0] ?? sharedPage.slice(
  sharedPage.indexOf('files.map(file =>'),
  sharedPage.indexOf('files.map(file =>') + 1500
);

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nA. Row click target — SharedLockerPanel (root cause fix)');

test('A1. Row div has onClick calling onOpen', () => {
  assert.match(rowBlock, /onClick=\{[^}]*onOpen\(file\)[^}]*\}/,
    'File row div must have onClick calling onOpen(file)');
});

test('A2. Row has role="button" for accessibility', () => {
  assert.match(rowBlock, /role="button"/,
    'Clickable row must have role="button" for screen readers');
});

test('A3. Row has cursor-pointer class', () => {
  assert.match(rowBlock, /cursor-pointer/,
    'File row must have cursor-pointer so users see it is clickable');
});

test('A4. Row has keyboard handler (Enter/Space)', () => {
  assert.match(rowBlock, /onKeyDown/,
    'Clickable row must support keyboard navigation (Enter/Space)');
  assert.match(rowBlock, /Enter.*onOpen|onOpen.*Enter/s,
    'Enter key must trigger onOpen in keyboard handler');
});

test('A5. FolderOpen icon is still present as visual affordance', () => {
  assert.match(panelFn, /FolderOpen/,
    'FolderOpen icon must remain as visual affordance for the open action');
});

test('A6. FolderOpen is now a <span> not a <button> (whole row is the button)', () => {
  // The inner button was changed to a <span aria-hidden> — row div is the button now
  const folderBtnMatch = panelFn.match(/<button[^>]*onClick[^>]*>[^<]*<FolderOpen/);
  assert.ok(folderBtnMatch === null,
    'FolderOpen must NOT be inside a <button onClick> — the whole row is the click target now');
});

test('A7. FolderOpen span has aria-hidden="true" (decorative)', () => {
  assert.match(panelFn, /aria-hidden="true"[\s\S]{0,200}FolderOpen|FolderOpen[\s\S]{0,200}aria-hidden="true"/,
    'FolderOpen span must be aria-hidden since the row itself announces the action');
});

test('A8. onOpen type accepts SharedLockerFile (correct prop type)', () => {
  assert.match(panelFn, /onOpen\s*:\s*\([^)]*SharedLockerFile[^)]*\)\s*=>/,
    'onOpen prop must accept SharedLockerFile argument');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nB. switchToFile logic — SharedChecklistContent');

test('B1. switchToFile is defined as useCallback', () => {
  assert.match(sharedPage, /const switchToFile = useCallback/,
    'switchToFile must be a useCallback');
});

test('B2. switchToFile early-returns for unknown fileId', () => {
  const block = sharedPage.slice(
    sharedPage.indexOf('const switchToFile = useCallback'),
    sharedPage.indexOf('const switchToFile = useCallback') + 2000
  );
  assert.match(block, /if\s*\(!file\)\s*return/,
    'switchToFile must guard against unknown file IDs');
});

test('B3. switchToFile sets store via setStore', () => {
  const block = sharedPage.slice(
    sharedPage.indexOf('const switchToFile = useCallback'),
    sharedPage.indexOf('const switchToFile = useCallback') + 2000
  );
  assert.match(block, /setStore\(next\.store\)/,
    'switchToFile must call setStore to update displayed categories/items');
});

test('B4. switchToFile updates activeFileId', () => {
  const block = sharedPage.slice(
    sharedPage.indexOf('const switchToFile = useCallback'),
    sharedPage.indexOf('const switchToFile = useCallback') + 2000
  );
  assert.match(block, /setActiveFileId\(fileId\)/,
    'switchToFile must update activeFileId so file highlights correctly');
});

test('B5. switchToFile updates background/bgFade/bgTone/bgSize', () => {
  const block = sharedPage.slice(
    sharedPage.indexOf('const switchToFile = useCallback'),
    sharedPage.indexOf('const switchToFile = useCallback') + 2000
  );
  assert.match(block, /setBackground\(next\.background\)/,  'setBackground must be called');
  assert.match(block, /setBgFade\(next\.bgFade\)/,          'setBgFade must be called');
  assert.match(block, /setBgTone\(next\.bgTone\)/,          'setBgTone must be called');
  assert.match(block, /setBgSize\(next\.bgSize\)/,          'setBgSize must be called');
});

test('B6. switchToFile resets undo/redo stacks on file switch', () => {
  const block = sharedPage.slice(
    sharedPage.indexOf('const switchToFile = useCallback'),
    sharedPage.indexOf('const switchToFile = useCallback') + 2000
  );
  assert.match(block, /undoStackRef\.current\s*=\s*\[\]/,
    'Undo stack must be reset on file switch');
  assert.match(block, /redoStackRef\.current\s*=\s*\[\]/,
    'Redo stack must be reset on file switch');
});

test('B7. switchToFile stashes current state before loading new file', () => {
  const block = sharedPage.slice(
    sharedPage.indexOf('const switchToFile = useCallback'),
    sharedPage.indexOf('const switchToFile = useCallback') + 2000
  );
  assert.match(block, /tempEditsRef\.current\.set\(currentKey/,
    'switchToFile must stash current state before switching');
});

test('B8. switchToFile loads stashed state for revisited files', () => {
  const block = sharedPage.slice(
    sharedPage.indexOf('const switchToFile = useCallback'),
    sharedPage.indexOf('const switchToFile = useCallback') + 2000
  );
  assert.match(block, /tempEditsRef\.current\.get\(newKey\)/,
    'switchToFile must retrieve stashed state for revisited files');
});

test('B9. Primary key constant defined for primary-snapshot stash', () => {
  assert.match(sharedPage, /const PRIMARY_KEY\s*=/,
    'PRIMARY_KEY constant must exist for stashing the primary snapshot state');
});

test('B10. onOpen passed to SharedLockerPanel calls switchToFile', () => {
  const panelUsage = sharedPage.slice(
    sharedPage.indexOf('<SharedLockerPanel'),
    sharedPage.indexOf('<SharedLockerPanel') + 300
  );
  assert.match(panelUsage, /onOpen=\{f => switchToFile\(f\.id\)\}/,
    'SharedLockerPanel onOpen must call switchToFile with the file ID');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nC. File name displayed in banner on switch');

test('C1. Banner shows activeFileId lookup for current file name', () => {
  assert.match(sharedPage, /snapshot\.lockerFiles\?\.find\(f => f\.id === activeFileId\)/,
    'Banner must look up the active file name from snapshot.lockerFiles using activeFileId');
});

test('C2. Banner shows primary snapshot name when no file is active', () => {
  // The banner computes: activeFileId ? find file name : snapshot.name
  // Search the full file for the fallback path
  assert.match(sharedPage, /:\s*snapshot\.name[;\s]/,
    'Banner must fall back to snapshot.name when activeFileId is null (?: snapshot.name)');
});

test('C3. activeFileId initialized to null (primary shown on load)', () => {
  assert.match(sharedPage, /useState<string \| null>\(null\)/,
    'activeFileId must start as null so primary snapshot is shown first');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nD. Shared view permissions — Rename/Delete absent (021C regression)');

test('D1. SharedLockerPanel has no Pencil (Rename) control', () => {
  assert.doesNotMatch(panelFn, /Pencil/,
    'SharedLockerPanel must NOT include a Pencil (rename) control');
});

test('D2. SharedLockerPanel has no Trash (Delete) control', () => {
  assert.doesNotMatch(panelFn, /Trash/,
    'SharedLockerPanel must NOT include a Trash (delete) control');
});

test('D3. TempFileState type defined for per-file isolation', () => {
  assert.match(sharedPage, /type TempFileState\s*=/,
    'TempFileState type must be defined for per-file temporary edit isolation');
});

test('D4. tempEditsRef is a Map keyed by file ID', () => {
  assert.match(sharedPage, /useRef<Map<string,\s*TempFileState>>/,
    'tempEditsRef must be Map<string, TempFileState> for per-file state isolation');
});

test('D5. No localStorage writes for temp edits (sender persistence protected)', () => {
  const switchBlock = sharedPage.slice(
    sharedPage.indexOf('const switchToFile = useCallback'),
    sharedPage.indexOf('const switchToFile = useCallback') + 2000
  );
  assert.doesNotMatch(switchBlock, /localStorage\.setItem/,
    'switchToFile must NOT write to localStorage — all changes are in-memory only');
});

test('D6. Save Your Own Copy writes only to recipient Locker (new UUID)', () => {
  const commitSave = sharedPage.slice(
    sharedPage.indexOf('const commitSave = useCallback'),
    sharedPage.indexOf('const commitSave = useCallback') + 600
  );
  assert.match(commitSave, /crypto\.randomUUID\(\)/,
    'commitSave must generate a new UUID — never overwrites sender files');
});

test('D7. SharedLockerPanel passed snapshot.lockerFiles directly', () => {
  const panelUsage = sharedPage.slice(
    sharedPage.indexOf('<SharedLockerPanel'),
    sharedPage.indexOf('<SharedLockerPanel') + 200
  );
  assert.match(panelUsage, /files=\{snapshot\.lockerFiles\}/,
    'SharedLockerPanel files prop must be snapshot.lockerFiles');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nE. Scan Gear List chevron — visual fix (021G)');

test('E1. ImportGearPanel no longer uses ChevronRight', () => {
  assert.doesNotMatch(importPanel, /ChevronRight/,
    'ImportGearPanel must not use ChevronRight after 021G visual fix');
});

test('E2. ImportGearPanel uses both ChevronDown and ChevronUp (021L: chevron now state-driven)', () => {
  // 021L fixed the static chevron: expanded → ChevronUp, collapsed → ChevronDown
  assert.match(importPanel, /ChevronDown/,
    'ImportGearPanel must use ChevronDown (collapsed state)');
  assert.match(importPanel, /ChevronUp/,
    'ImportGearPanel must use ChevronUp (expanded state) after 021L disclosure fix');
});

test('E3. Both ChevronDown and ChevronUp are imported from lucide-react in ImportGearPanel', () => {
  assert.match(importPanel, /import\s*\{[^}]*ChevronDown[^}]*\}\s*from\s*['"]lucide-react['"]/,
    'ChevronDown must be imported from lucide-react in ImportGearPanel');
  assert.match(importPanel, /import\s*\{[^}]*ChevronUp[^}]*\}\s*from\s*['"]lucide-react['"]/,
    'ChevronUp must be imported from lucide-react in ImportGearPanel after 021L fix');
});

test('E4. Scan Gear List open/close state drives chevron (021L: same state as visibility)', () => {
  assert.match(importPanel, /const\s+\[open,\s*setOpen\]\s*=\s*useState/,
    'ImportGearPanel open/close state must still exist');
  // Chevron must be conditional on the open state
  assert.match(importPanel, /open\s*\?\s*<ChevronUp|open\s*\?\s*<ChevronDown/,
    '021L: chevron must be conditional on the open state (not static)');
});

test('E5. Scan Gear List toggle button still present', () => {
  assert.match(importPanel, /onClick=\{[^}]*setOpen[^}]*\}/,
    'ImportGearPanel toggle button must still be present and call setOpen');
});

test('E6. SharedLockerPanel uses ChevronDown/ChevronUp pattern (021J corrected direction)', () => {
  // 021J corrected disclosure chevrons: expanded → ChevronUp, collapsed → ChevronDown
  assert.match(panelFn, /ChevronUp[\s\S]{0,200}ChevronDown|ChevronDown[\s\S]{0,200}ChevronUp/,
    'SharedLockerPanel must use ChevronUp (expanded) and ChevronDown (collapsed) after 021J chevron direction fix');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nF. Share menu labels — 021F regression');

test('F1. Owner Share menu still shows "Share Link"', () => {
  assert.match(checklist, /['"]Share Link['"]/,
    'Owner Share menu must still show "Share Link" (021F label)');
});

test('F2. Owner Share menu still shows "Share Pack List"', () => {
  assert.match(checklist, /Share Pack List/,
    'Owner Share menu must still show "Share Pack List"');
});

test('F3. Owner Share menu still shows "Copy link, read-only"', () => {
  assert.match(checklist, /Copy link, read-only/,
    'Share Pack List subtitle must still say "Copy link, read-only"');
});

test('F4. Share Link Anyway button still present (warning step)', () => {
  assert.match(checklist, /Share Link Anyway/,
    'Warning step confirm button must still say "Share Link Anyway"');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nG. Panel order — 021F regression');

test('G1. WeightSummary before SharedLockerPanel in SharedChecklistPage', () => {
  const sidebarBlock = sharedPage.slice(
    sharedPage.indexOf('Scrollable sidebar content'),
    sharedPage.indexOf('Scrollable sidebar content') + 1200
  );
  const weightPos = sidebarBlock.indexOf('WeightSummary');
  const lockerPos = sidebarBlock.indexOf('SharedLockerPanel');
  assert.ok(weightPos > -1 && lockerPos > -1, 'Both WeightSummary and SharedLockerPanel must exist');
  assert.ok(weightPos < lockerPos, 'WeightSummary must appear before SharedLockerPanel');
});

test('G2. ImportGearPanel before SharedLockerPanel in SharedChecklistPage', () => {
  const sidebarBlock = sharedPage.slice(
    sharedPage.indexOf('Scrollable sidebar content'),
    sharedPage.indexOf('Scrollable sidebar content') + 1200
  );
  const importPos = sidebarBlock.indexOf('ImportGearPanel');
  const lockerPos = sidebarBlock.indexOf('SharedLockerPanel');
  assert.ok(importPos > -1 && lockerPos > -1, 'Both ImportGearPanel and SharedLockerPanel must exist');
  assert.ok(importPos < lockerPos, 'ImportGearPanel must appear before SharedLockerPanel');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\nH. Prior prompt regressions');

test('H1. 021A — /checklist redirects unauthenticated users', () => {
  assert.match(checklist, /<Redirect\s+to=["']\/sign-in["']/,
    '/checklist must still redirect guests to /sign-in');
});

test('H2. 021B — Private Rename still exists', () => {
  assert.match(checklist, /handleRenameInLocker|onRename/,
    'Private owner rename must still be present');
});

test('H3. 021C — SharedLockerPanel is defined in SharedChecklistPage', () => {
  assert.match(sharedPage, /function SharedLockerPanel/,
    'SharedLockerPanel must still be defined');
});

test('H4. 021E — Share Pack List type payload still set', () => {
  const block = checklist.slice(
    checklist.indexOf('const handleSharePackList'),
    checklist.indexOf('const handleSharePackList') + 800
  );
  assert.match(block, /type\s*:\s*['"]pack-list['"]/,
    'handleSharePackList must still set type: "pack-list"');
});

test('H5. 020F — LOCKER_KEY exported from usePackData', () => {
  const usePackData = readFileSync(
    path.join(root, 'artifacts/pack-checklist/src/hooks/usePackData.ts'), 'utf8'
  );
  assert.match(usePackData, /export\s+const\s+LOCKER_KEY/,
    'LOCKER_KEY must still be exported from usePackData');
});

test('H6. normalizeLockerFile sanitizes items from raw payload', () => {
  assert.match(sharedPage, /function normalizeLockerFile/,
    'normalizeLockerFile must still exist to sanitize incoming file data');
  assert.match(sharedPage, /sanitizeItems\(raw\.store\.items/,
    'normalizeLockerFile must use sanitizeItems to normalize each file\'s items');
});

test('H7. SharedLockerPanel receives activeId for highlight styling', () => {
  const panelUsage = sharedPage.slice(
    sharedPage.indexOf('<SharedLockerPanel'),
    sharedPage.indexOf('<SharedLockerPanel') + 200
  );
  assert.match(panelUsage, /activeId=\{activeFileId\}/,
    'SharedLockerPanel must receive activeId to highlight the current file');
});

test('H8. Sender data never touched — no localStorage writes in switchToFile', () => {
  const switchBlock = sharedPage.slice(
    sharedPage.indexOf('const switchToFile = useCallback'),
    sharedPage.indexOf('const switchToFile = useCallback') + 2500
  );
  // Check specifically for localStorage/indexedDB writes — NOT Map.set (which is in-memory stash)
  assert.doesNotMatch(switchBlock, /localStorage\.setItem/,
    'switchToFile must not call localStorage.setItem (sender data protected)');
  assert.doesNotMatch(switchBlock, /indexedDB/,
    'switchToFile must not access indexedDB (sender data protected)');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n────────────────────────────────────────────────────────────');
console.log(`021G Shared File Open + Chevron: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
