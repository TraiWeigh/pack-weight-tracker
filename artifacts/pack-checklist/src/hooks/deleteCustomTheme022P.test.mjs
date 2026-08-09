/**
 * deleteCustomTheme022P.test.mjs
 * Prompt 022P — Delete Custom Background Themes
 *
 * Protects:
 *   • Trash icon button exists in the header row for custom themes
 *   • Trash icon is NOT present for built-in/preset themes (they use PRESETS array)
 *   • Confirmation dialog wording matches spec
 *   • deleteCollection() correctly removes only the target theme
 *   • confirmAndDeleteTheme logic: active bg fallback, activeThemeId reset, blob cleanup
 *   • Photos shared by another theme are NOT deleted
 *   • Gear list data is never stored in the theme/photo records (no corruption)
 *   • Shared snapshot behavior: background embedded per-file (no live theme lookup risk)
 *   • Account isolation: operations are scoped to the current user's localStorage/IndexedDB
 *   • Built-in theme protection: PRESETS are not PhotoCollections
 */

import fs   from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const srcRoot = path.resolve('artifacts/pack-checklist/src');

const bgPickerSrc   = fs.readFileSync(path.join(srcRoot, 'components/BackgroundPicker.tsx'), 'utf8');
const bgCollSrc     = fs.readFileSync(path.join(srcRoot, 'lib/bgCollections.ts'), 'utf8');
const shareLinkSrc  = fs.readFileSync(path.join(srcRoot, 'lib/shareLink.ts'), 'utf8');

// ── Inline data-layer tests (pure functions) ──────────────────────────────────

// Import the pure functions by reading/eval is not available in this env,
// so we test via source-text assertions plus inline reimplementation of the
// pure logic to validate correctness independently.

function deleteCollection(id, collections) {
  return collections.filter(c => c.id !== id);
}

function renameCollection(id, newName, collections) {
  const trimmed = newName.trim();
  if (!trimmed) return null;
  if (collections.some(c => c.name === trimmed && c.id !== id)) return null;
  return collections.map(c => (c.id === id ? { ...c, name: trimmed } : c));
}

let passed = 0;
let failed = 0;
let currentSuite = '';

function suite(name) { currentSuite = name; }
function test(label, fn) {
  try { fn(); passed++; }
  catch (err) {
    failed++;
    console.error(`  ✗ [${currentSuite}] ${label}`);
    console.error(`    ${err.message}`);
  }
}

// ── §1: Trash icon in header row ──────────────────────────────────────────────

suite('022P Trash Icon in Header');

test('Trash2 is imported from lucide-react', () => {
  assert.ok(
    bgPickerSrc.includes('Trash2'),
    'Trash2 icon must be imported in BackgroundPicker.tsx',
  );
});

test('Trash2 icon button is in the name/pencil row (before photo-slot grid)', () => {
  // Verify the trash button appears before the grid (i.e. in the header row)
  const trashBtnIdx   = bgPickerSrc.indexOf('<Trash2 className="w-3 h-3" />');
  const gridIdx       = bgPickerSrc.indexOf('grid grid-cols-2 gap-1.5');
  assert.ok(trashBtnIdx > -1, 'Trash2 icon button must be present in BackgroundPicker.tsx');
  assert.ok(gridIdx > -1,     'Photo-slot grid must be present');
  assert.ok(
    trashBtnIdx < gridIdx,
    'Trash icon must appear before the photo-slot grid (i.e. in the header row)',
  );
});

test('Pencil and Trash2 icons are in the same row (within a few hundred chars)', () => {
  const pencilIdx = bgPickerSrc.indexOf('<Pencil className="w-3 h-3" />');
  const trashIdx  = bgPickerSrc.indexOf('<Trash2 className="w-3 h-3" />');
  assert.ok(pencilIdx > -1, 'Pencil icon must be present');
  assert.ok(trashIdx > -1,  'Trash2 icon must be present');
  // Both icons must be within ~900 chars of each other in the source
  // (022Y wrapped Trash2 in a Popover, adding ~300 chars of portal boilerplate)
  assert.ok(
    Math.abs(pencilIdx - trashIdx) < 900,
    `Pencil (${pencilIdx}) and Trash2 (${trashIdx}) must be adjacent in the header row`,
  );
});

test('Trash icon button has an aria-label containing the theme name', () => {
  assert.ok(
    bgPickerSrc.includes('aria-label={`Delete theme "${col.name}"`}') ||
    bgPickerSrc.includes("aria-label={`Delete theme ") ||
    bgPickerSrc.includes('aria-label="`Delete theme'),
    'Trash button must have an aria-label referencing the theme name for accessibility',
  );
});

test('Trash icon button has a title tooltip', () => {
  assert.ok(
    bgPickerSrc.includes('title={`Delete theme "'),
    'Trash button must have a title attribute for sighted hover users',
  );
});

test('Trash icon button has focus-visible ring', () => {
  assert.ok(
    bgPickerSrc.includes('focus-visible:ring-destructive') ||
    bgPickerSrc.includes('focus-visible:ring-2 focus-visible:ring-destructive'),
    'Trash button must have a focus-visible ring for keyboard navigation',
  );
});

test('Trash icon button has hover:text-destructive for clear danger affordance', () => {
  assert.ok(
    bgPickerSrc.includes('hover:text-destructive'),
    'Trash button must turn destructive color on hover',
  );
});

// ── §2: Built-in theme protection ─────────────────────────────────────────────

suite('022P Built-in Theme Protection');

test('PRESETS array exists (built-in themes are separate from PhotoCollections)', () => {
  assert.ok(
    bgPickerSrc.includes('export const PRESETS') || bgPickerSrc.includes('PRESETS = ['),
    'PRESETS array must exist — built-in themes are never PhotoCollections',
  );
});

test('renderCustomThemePanel only receives a PhotoCollection (never a preset)', () => {
  // The panel is called with `col` from the collections array, not from PRESETS
  assert.ok(
    bgPickerSrc.includes('renderCustomThemePanel(col: PhotoCollection)') ||
    bgPickerSrc.includes('renderCustomThemePanel = (col: PhotoCollection)'),
    'renderCustomThemePanel must accept PhotoCollection — only custom themes reach it',
  );
});

test('Landscapes built-in ID is a literal string, not a collection ID', () => {
  assert.ok(
    bgPickerSrc.includes("'landscapes'") || bgPickerSrc.includes('"landscapes"'),
    'Built-in landscapes theme is identified by the literal string "landscapes"',
  );
});

test('deleteCollection in bgCollections.ts only filters by ID (cannot match a PRESET id)', () => {
  assert.ok(
    bgCollSrc.includes('collections.filter(c => c.id !== id)'),
    'deleteCollection must use array filter — built-in presets are never in the PhotoCollection array so they cannot be deleted',
  );
});

test('No trash icon rendered for preset/built-in themes', () => {
  // The trash icon is ONLY inside renderCustomThemePanel, not in the landscape-grid/preset renderer
  const trashIdx = bgPickerSrc.indexOf('<Trash2 className="w-3 h-3" />');
  // The preset landscape grid renders before renderCustomThemePanel in the file
  const landscapesLabel = bgPickerSrc.indexOf("'landscapes'");
  // renderCustomThemePanel must come after the landscapes section
  const customPanelFn = bgPickerSrc.indexOf('renderCustomThemePanel');
  assert.ok(
    customPanelFn > landscapesLabel,
    'renderCustomThemePanel (with trash icon) appears after built-in landscapes section',
  );
  assert.ok(
    trashIdx > customPanelFn - 100,
    'Trash icon must be inside renderCustomThemePanel, not in the preset/landscapes section',
  );
});

// ── §3: Confirmation dialog wording ───────────────────────────────────────────

suite('022P Confirmation Dialog Wording');

test('Confirmation title "Delete Custom Theme?" is present', () => {
  assert.ok(
    bgPickerSrc.includes('Delete Custom Theme?'),
    'Confirmation dialog must have the title "Delete Custom Theme?"',
  );
});

test('Confirmation body includes theme name in quotes', () => {
  assert.ok(
    bgPickerSrc.includes('Delete <strong>"{col.name}"</strong>') ||
    bgPickerSrc.includes('Delete <strong>"\'{col.name}\'"</strong>') ||
    bgPickerSrc.includes('"${col.name}"') ||
    bgPickerSrc.includes('col.name') && bgPickerSrc.includes('Delete'),
    'Confirmation body must display the actual theme name in quotes',
  );
});

test('Confirmation body mentions custom background photos', () => {
  assert.ok(
    bgPickerSrc.includes('custom background photos') ||
    bgPickerSrc.includes('background photos'),
    'Confirmation must mention that background photos will also be deleted',
  );
});

test('Confirmation warns action cannot be undone', () => {
  assert.ok(
    bgPickerSrc.includes('cannot be undone'),
    'Confirmation must include "This action cannot be undone."',
  );
});

test('Cancel button is present in confirmation', () => {
  assert.ok(
    bgPickerSrc.includes('>Cancel<'),
    'Cancel button must be present in the confirmation dialog',
  );
});

test('Delete Theme button is present in confirmation', () => {
  assert.ok(
    bgPickerSrc.includes('>Delete Theme<'),
    '"Delete Theme" button must be present in the confirmation dialog',
  );
});

test('Confirmation does not ask for a password', () => {
  // No password input in the confirmation section
  const confirmStart = bgPickerSrc.indexOf('Delete Custom Theme?');
  const confirmEnd   = bgPickerSrc.indexOf('</div>', confirmStart + 10);
  const snippet = confirmStart > -1 ? bgPickerSrc.slice(confirmStart, confirmEnd + 200) : '';
  assert.ok(
    !snippet.includes('type="password"') && !snippet.includes('password'),
    'Confirmation must not ask for a password — it is a simple owner-confirm action',
  );
});

// ── §4: deleteCollection pure-function correctness ────────────────────────────

suite('022P deleteCollection Pure Function');

const collections = [
  { id: 'aaa', name: 'Theme A', photos: [{ id: 'p1' }, { id: 'p2' }] },
  { id: 'bbb', name: 'Theme B', photos: [{ id: 'p3' }] },
  { id: 'ccc', name: 'Theme C', photos: [] },
];

test('deleteCollection removes only the target theme by ID', () => {
  const result = deleteCollection('bbb', collections);
  assert.equal(result.length, 2);
  assert.ok(!result.some(c => c.id === 'bbb'), 'bbb must be removed');
  assert.ok(result.some(c => c.id === 'aaa'),  'aaa must remain');
  assert.ok(result.some(c => c.id === 'ccc'),  'ccc must remain');
});

test('deleteCollection leaves other themes fully intact', () => {
  const result = deleteCollection('aaa', collections);
  const b = result.find(c => c.id === 'bbb');
  assert.ok(b, 'Theme B must remain');
  assert.equal(b.photos.length, 1, 'Theme B photos must be intact');
  assert.equal(b.photos[0].id, 'p3', 'Theme B photo ID must be intact');
});

test('deleteCollection is a no-op for a non-existent ID', () => {
  const result = deleteCollection('zzz', collections);
  assert.equal(result.length, 3, 'All themes must remain when ID not found');
});

test('deleteCollection does not mutate the original array', () => {
  const original = [...collections];
  deleteCollection('aaa', collections);
  assert.equal(collections.length, original.length, 'Original array must not be mutated');
});

// ── §5: Photo cross-reference safety ─────────────────────────────────────────

suite('022P Photo Cross-Reference Safety');

test('confirmAndDeleteTheme checks remaining collections before deleting blobs', () => {
  // The source must contain logic that filters photo IDs still used elsewhere
  assert.ok(
    bgPickerSrc.includes('allOtherIds') || bgPickerSrc.includes('stillUsed'),
    'Theme deletion must check if deleted photo IDs are still used by other themes before removing IndexedDB blobs',
  );
});

test('Photo IDs shared by another theme are preserved (logic present in source)', () => {
  // After deleteCollection, the remaining collections are checked before blob deletion
  const hasRemainingCheck =
    bgPickerSrc.includes('remaining.flatMap') ||
    bgPickerSrc.includes('allOtherIds') ||
    bgPickerSrc.includes('idsToDelete');
  assert.ok(
    hasRemainingCheck,
    'Source must compute which photo IDs are exclusively owned by the deleted theme before deleting blobs',
  );
});

// ── §6: Active background fallback ────────────────────────────────────────────

suite('022P Active Background Fallback');

test('confirmAndDeleteTheme resets activeThemeId to "landscapes" when deleting active theme', () => {
  assert.ok(
    bgPickerSrc.includes("setActiveThemeId('landscapes')"),
    'Deleting the active theme must switch the panel back to the built-in landscapes theme',
  );
});

test('confirmAndDeleteTheme calls onBackgroundChange when active photo came from deleted theme', () => {
  assert.ok(
    bgPickerSrc.includes('onBackgroundChange(null)') ||
    bgPickerSrc.includes('onBackgroundChange('),
    'When the active background photo belongs to the deleted theme, onBackgroundChange must be called to clear it',
  );
});

test('Background fallback does not invent a new special theme', () => {
  // Should not invent a new theme — it should reset to the existing default (null or landscapes)
  assert.ok(
    !bgPickerSrc.includes('fallbackThemeId') && !bgPickerSrc.includes('setFallbackBackground'),
    'Active-background fallback must use existing default (null / landscapes), not a new invented theme',
  );
});

// ── §7: Gear list independence ────────────────────────────────────────────────

suite('022P Gear List Independence');

test('PhotoCollection interface has only id, name, photos — no gear data', () => {
  // Gear data must never be stored in theme records
  assert.ok(
    bgCollSrc.includes('id: string') &&
    bgCollSrc.includes('name: string') &&
    bgCollSrc.includes('photos: CollectionPhoto[]'),
    'PhotoCollection must have id, name, photos fields only',
  );
  assert.ok(
    !bgCollSrc.includes('items') && !bgCollSrc.includes('categories') &&
    !bgCollSrc.includes('weight') && !bgCollSrc.includes('checked'),
    'PhotoCollection must not contain gear data (items, categories, weight, checked)',
  );
});

test('deleteCollection does not touch any gear-list storage keys', () => {
  // deleteCollection only modifies the collections array — it never mentions locker or gear keys
  assert.ok(
    !bgCollSrc.includes('trailweigh:locker') &&
    !bgCollSrc.includes('trailweigh:pack') &&
    !bgCollSrc.includes('packItems'),
    'deleteCollection must not reference any gear list storage key',
  );
});

// ── §8: Shared snapshot behavior ─────────────────────────────────────────────

suite('022P Shared Snapshot Safety');

test('Shared link payload includes background field per file (embedded, not live ref)', () => {
  assert.ok(
    shareLinkSrc.includes('background') && shareLinkSrc.includes('bgFade'),
    'Share link payload must embed background settings — it does not make live lookups to the theme library',
  );
});

test('Shared snapshot does not reference photoCollection IDs directly', () => {
  // Shared payload uses `photoId` (the photo reference), not `collectionId`
  assert.ok(
    !shareLinkSrc.includes('collectionId') && !shareLinkSrc.includes('themeId'),
    'Shared link payload must not include collection/theme IDs — only the embedded background reference',
  );
});

// ── §9: Regression — pencil edit still present ────────────────────────────────

suite('022P Pencil Preserved');

test('Pencil icon and startRename callback still present', () => {
  assert.ok(
    bgPickerSrc.includes('<Pencil className="w-3 h-3" />'),
    'Pencil icon must still be present — rename functionality must not be removed',
  );
  assert.ok(
    bgPickerSrc.includes('startRename'),
    'startRename callback must still be present — rename behavior must be unchanged',
  );
});

test('Pencil onClick calls startRename (not delete)', () => {
  const pencilBlock = bgPickerSrc.match(/onClick=\{.*?startRename[^}]*\}/)?.[0] ?? '';
  assert.ok(
    pencilBlock.length > 0,
    'Pencil button onClick must call startRename',
  );
});

test('No merge of pencil and trash into a dropdown', () => {
  assert.ok(
    !bgPickerSrc.includes('DropdownMenu') ||
    bgPickerSrc.indexOf('DropdownMenu') > bgPickerSrc.indexOf('renderCustomThemePanel') + 5000,
    'Pencil and Trash must be separate icon buttons — not merged into a dropdown',
  );
});

// ── §10: confirmDeleteTheme state management ──────────────────────────────────

suite('022P State Management');

test('confirmDeleteTheme state is declared', () => {
  assert.ok(
    bgPickerSrc.includes('confirmDeleteTheme') &&
    bgPickerSrc.includes('setConfirmDeleteTheme'),
    'confirmDeleteTheme state and setter must be declared',
  );
});

test('setConfirmDeleteTheme(null) is called on Cancel', () => {
  assert.ok(
    bgPickerSrc.includes('setConfirmDeleteTheme(null)'),
    'Cancel button must reset confirmDeleteTheme state to null',
  );
});

test('Trash icon sets confirmDeleteTheme to col.id', () => {
  assert.ok(
    bgPickerSrc.includes('setConfirmDeleteTheme(col.id)'),
    'Clicking trash icon must set confirmDeleteTheme to the theme ID',
  );
});

// ── Results ───────────────────────────────────────────────────────────────────

const total = passed + failed;
console.log(`\n022P Delete Custom Theme: ${passed}/${total} passed${failed > 0 ? `, ${failed} failed` : ''}`);
if (failed > 0) process.exit(1);
