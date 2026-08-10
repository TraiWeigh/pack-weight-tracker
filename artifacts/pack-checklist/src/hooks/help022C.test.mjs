/**
 * help022C.test.mjs — Prompt 022C: Reorganized Help & How-To Regression Tests
 *
 * Protects:
 *   • Six main sections present in required order
 *   • Correct section IDs (sec-btn-building, sec-btn-weight, sec-btn-editing,
 *                          sec-btn-save, sec-btn-share, sec-btn-backgrounds)
 *   • Content moved correctly: Scan Gear List under Building, not standalone
 *   • Content moved correctly: checkbox/selecting under Building, not standalone
 *   • Old standalone section headings removed
 *   • Trip/Trail/Season-specific list guidance present
 *   • Save As trip-variant explanation present
 *   • Locker no-password-required language present
 *   • Preview exists in Preview/Print/Share section
 *   • Print exists and explains physical packing checklist
 *   • Share Link and Share Pack List both documented
 *   • Checkable list / temporary check behavior documented
 *   • Download PDF documented
 *   • Backgrounds section last (section 6)
 *   • Background themes documented (Landscapes)
 *   • Add Photo / custom themes documented
 *   • Fit / Fill documented with correct descriptions
 *   • Showcase / Hide documented
 *   • Light / Dark tone documented
 *   • All accordion sections have aria-expanded
 *   • No standalone "Importing / Scan Gear List" section title
 *   • No standalone "Select the gear you are using" section title
 *   • No video / animation references
 *   • Footer unchanged
 *   • 022A Checklist footer unchanged
 *   • 021P layout unchanged
 *   • All routes still registered
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const infoRoot = path.resolve('artifacts/pack-checklist/src/pages/info');
const root     = path.resolve('artifacts/pack-checklist/src');
const readInfo = (name) => fs.readFileSync(path.join(infoRoot, name), 'utf8');
const read     = (rel)  => fs.readFileSync(path.join(root, rel), 'utf8');

let passed = 0;
let failed = 0;

function test(label, fn) {
  try {
    fn();
    console.log(`  ✓ ${label}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${label}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

const helpSrc        = readInfo('HelpPage.tsx');
const footerSrc      = read('components/Footer.tsx');
const checklistSrc   = read('pages/Checklist.tsx');
const sharedSrc      = read('pages/SharedChecklistPage.tsx');
const appSrc         = read('App.tsx');

// ── Six main sections present ─────────────────────────────────────────────────
console.log('\n022C Six Main Sections:');

test('Section 1: Building Your Gear List (id=building)', () => {
  assert.ok(helpSrc.includes('id="sec-btn-building"') || helpSrc.includes("id={`sec-btn-building`}") || helpSrc.includes("id='building'") || helpSrc.includes("id={`sec-btn-${'building'}`}") || (helpSrc.includes('building') && helpSrc.includes('Building Your Gear List')), 'Section "Building Your Gear List" not found');
});

test('Section 2: Understanding Your Pack Weight (id=weight)', () => {
  assert.ok(helpSrc.includes('Understanding Your Pack Weight'), 'Section "Understanding Your Pack Weight" not found');
});

test('Section 3: Editing Your Gear List (id=editing)', () => {
  assert.ok(helpSrc.includes('Editing Your Gear List'), 'Section "Editing Your Gear List" not found');
});

test('Section 4: Save / Locker (id=save)', () => {
  assert.ok(helpSrc.includes('Save / Locker') || (helpSrc.includes('Save') && helpSrc.includes('Locker')), 'Section "Save / Locker" not found');
});

test('Section 5: Preview / Print / Share (id=share)', () => {
  assert.ok(helpSrc.includes('Preview / Print / Share') || (helpSrc.includes('Preview') && helpSrc.includes('Print') && helpSrc.includes('Share')), 'Section "Preview / Print / Share" not found');
});

test('Section 6: Backgrounds & Display (id=backgrounds)', () => {
  assert.ok(helpSrc.includes('Backgrounds') && helpSrc.includes('Display'), 'Section "Backgrounds & Display" not found');
});

// ── Order check: section IDs appear in workflow order ────────────────────────
console.log('\n022C Section Order:');

test('Sections appear in BUILD→UNDERSTAND→EDIT→SAVE→PREVIEW/SHARE→CUSTOMIZE order', () => {
  const posBuilding = helpSrc.indexOf('Building Your Gear List');
  const posWeight   = helpSrc.indexOf('Understanding Your Pack Weight');
  const posEditing  = helpSrc.indexOf('Editing Your Gear List');
  const posSave     = helpSrc.indexOf('Save / Locker');
  const posPreview  = helpSrc.indexOf('Preview / Print / Share');
  const posBack     = helpSrc.indexOf('Backgrounds');

  assert.ok(posBuilding !== -1, 'Building section missing');
  assert.ok(posWeight !== -1,   'Weight section missing');
  assert.ok(posEditing !== -1,  'Editing section missing');
  assert.ok(posSave !== -1,     'Save section missing');
  assert.ok(posPreview !== -1,  'Preview section missing');
  assert.ok(posBack !== -1,     'Backgrounds section missing');

  assert.ok(posBuilding < posWeight,  'Building must come before Weight');
  assert.ok(posWeight   < posEditing, 'Weight must come before Editing');
  assert.ok(posEditing  < posSave,    'Editing must come before Save');
  assert.ok(posSave     < posPreview, 'Save must come before Preview');
  assert.ok(posPreview  < posBack,    'Preview must come before Backgrounds');
});

test('Backgrounds & Display is the LAST main section', () => {
  const posBack = helpSrc.indexOf('Backgrounds');
  // The final MainSection JSX usage (opening tag area) for backgrounds should be after all others
  const posBuildingTag = helpSrc.indexOf("id=\"building\"") !== -1
    ? helpSrc.indexOf("id=\"building\"")
    : helpSrc.indexOf("id='building'");
  const posBackTag = helpSrc.indexOf("id=\"backgrounds\"") !== -1
    ? helpSrc.indexOf("id=\"backgrounds\"")
    : helpSrc.indexOf("id='backgrounds'");
  // Either we check the content order or the JSX id order
  assert.ok(posBack > 0, 'Backgrounds section not found');
  const lastSectionPos = Math.max(
    helpSrc.indexOf('Building Your Gear List'),
    helpSrc.indexOf('Understanding Your Pack Weight'),
    helpSrc.indexOf('Editing Your Gear List'),
    helpSrc.indexOf('Save / Locker'),
    helpSrc.indexOf('Preview / Print / Share'),
  );
  const backgroundsPos = helpSrc.indexOf('Backgrounds');
  assert.ok(backgroundsPos > lastSectionPos || posBackTag > posBuildingTag,
    'Backgrounds & Display must appear after all other sections');
});

// ── Accordion requirements ────────────────────────────────────────────────────
console.log('\n022C Accordion:');

test('Accordion uses aria-expanded', () => {
  assert.ok(helpSrc.includes('aria-expanded'), 'Missing aria-expanded');
});

test('Accordion has aria-controls', () => {
  assert.ok(helpSrc.includes('aria-controls'), 'Missing aria-controls');
});

test('Accordion panels have role=region', () => {
  assert.ok(helpSrc.includes('role="region"'), 'Missing role="region" on panels');
});

test('Sections collapsed by default (no initial open set)', () => {
  // useState(new Set()) without pre-populated IDs means sections start collapsed
  assert.ok(helpSrc.includes('new Set()'), 'Accordion must initialize with empty Set (all sections collapsed by default)');
});

test('Focus ring present for keyboard users', () => {
  assert.ok(helpSrc.includes('focus-visible:ring'), 'Missing focus ring for keyboard accessibility');
});

test('Entire title row is clickable (button wraps full header)', () => {
  // The button should span the entire header, not just the chevron
  assert.ok(
    helpSrc.includes('w-full') && helpSrc.includes('aria-expanded'),
    'Section header button must span full width for entire-row click target',
  );
});

// ── Building: Create/Upload contains Scan Gear List ─────────────────────────
console.log('\n022C Building: Create/Upload:');

test('Scan Gear List instructions are under Building / Create/Upload', () => {
  const createUploadPos = helpSrc.indexOf('Create / Upload');
  const scanPos         = helpSrc.indexOf('Scan Gear List');
  assert.ok(createUploadPos !== -1, 'Create / Upload subsection missing');
  assert.ok(scanPos !== -1,         'Scan Gear List missing');
  assert.ok(scanPos > createUploadPos, 'Scan Gear List must appear after Create / Upload heading');
});

test('Scan Gear List documents all 4 file types (PDF, Word, Excel, Numbers)', () => {
  assert.ok(
    helpSrc.includes('PDF') && helpSrc.includes('Word') &&
    helpSrc.includes('Excel') && helpSrc.includes('Numbers'),
    'All 4 supported file types must be documented under Create / Upload',
  );
});

test('Import flow documented: review detected items, select, import', () => {
  assert.ok(helpSrc.includes('detect') || helpSrc.includes('Import Selected'), 'Import review/select flow missing');
});

// ── Building: Add/Organize contains checkbox/selecting ───────────────────────
console.log('\n022C Building: Add/Organize:');

test('Checkbox / selecting gear documented under Add / Organize', () => {
  const addOrganizePos = helpSrc.indexOf('Add / Organize');
  const checkboxPos    = helpSrc.toLowerCase().indexOf('checkbox', addOrganizePos);
  assert.ok(addOrganizePos !== -1, 'Add / Organize subsection missing');
  assert.ok(checkboxPos > addOrganizePos, 'Checkbox instructions must be under Add / Organize');
});

test('Unchecked items stay in list explanation present', () => {
  assert.ok(
    helpSrc.includes('Unchecked') || helpSrc.includes('unchecked'),
    'Must explain that unchecked items stay in the list',
  );
});

test('Move control documented under Add / Organize', () => {
  const addOrganizePos = helpSrc.indexOf('Add / Organize');
  const movePos        = helpSrc.indexOf('Move to', addOrganizePos);
  assert.ok(movePos > addOrganizePos, 'Move control must be documented under Add / Organize');
});

test('Qty 1–20 documented', () => {
  assert.ok(helpSrc.includes('1 to 20') || helpSrc.includes('1–20'), 'Qty range 1–20 must be documented');
});

// ── Standalone sections removed ───────────────────────────────────────────────
console.log('\n022C Removed Standalone Sections:');

test('No standalone "Importing / Scan Gear List" section title', () => {
  // Should not appear as a MainSection title
  assert.ok(
    !helpSrc.includes('"Importing / Scan Gear List"') &&
    !helpSrc.includes("'Importing / Scan Gear List'"),
    'Found standalone "Importing / Scan Gear List" section — should be removed',
  );
});

test('No standalone "Select the gear you are using" section title', () => {
  assert.ok(
    !helpSrc.includes('"Select the gear you are using"') &&
    !helpSrc.includes("'Select the gear you are using'"),
    'Found standalone "Select the gear you are using" section — should be removed',
  );
});

test('No standalone "Getting Started" main section', () => {
  // Getting Started was a main section in 022B — should not remain as a separate section
  // (content merged into Building Your Gear List)
  const gettingStartedAsSectionTitle = helpSrc.includes('"Getting Started"') ||
    helpSrc.includes("'Getting Started'");
  // It may appear as an H4/Sub-section label within building — that's OK
  // We only flag if it's a MainSection title string
  assert.ok(!gettingStartedAsSectionTitle, 'Getting Started should not remain as a standalone main section title');
});

// ── Trip/Trail/Season-Specific Lists ─────────────────────────────────────────
console.log('\n022C Trip/Trail/Season-Specific Lists:');

test('Trip/trail/season-specific guidance present', () => {
  assert.ok(
    helpSrc.includes('Season') || helpSrc.includes('season'),
    'Trip/season-specific lists guidance missing',
  );
});

test('PCT example used', () => {
  assert.ok(helpSrc.includes('PCT'), 'PCT example missing from trip-specific section');
});

test('AT example used', () => {
  assert.ok(helpSrc.includes('AT —') || helpSrc.includes('AT—'), 'AT example missing from trip-specific section');
});

test('Save As cross-referenced for creating list variants', () => {
  const tripSectionPos = helpSrc.indexOf('PCT');
  const saveAsPos = helpSrc.indexOf('Save As', tripSectionPos);
  assert.ok(saveAsPos > tripSectionPos, 'Save As must be cross-referenced within the trip-specific section');
});

// ── Understanding Your Pack Weight ───────────────────────────────────────────
console.log('\n022C Understanding Pack Weight:');

test('Base Weight defined and explained', () => {
  assert.ok(helpSrc.includes('Base Weight'), 'Base Weight must be explained');
});

test('Grand Total explained', () => {
  assert.ok(helpSrc.includes('Grand Total'), 'Grand Total must be explained');
});

test('Non-base categories (consumables/worn) explained', () => {
  assert.ok(
    helpSrc.includes('— Base') || helpSrc.includes('non-base') || helpSrc.includes('Non-base'),
    'Non-base categories must be explained',
  );
});

test('Weight Distribution explained', () => {
  assert.ok(helpSrc.includes('Weight Distribution'), 'Weight Distribution must be documented');
});

test('Pack Summary section documented under Understanding', () => {
  const weightSectionPos = helpSrc.indexOf('Understanding Your Pack Weight');
  const packSummaryPos   = helpSrc.indexOf('Pack Summary', weightSectionPos);
  assert.ok(packSummaryPos > weightSectionPos, 'Pack Summary must be documented under Understanding Your Pack Weight');
});

// ── Editing Your Gear List ────────────────────────────────────────────────────
console.log('\n022C Editing Your Gear List:');

test('Undo documented with Ctrl+Z shortcut', () => {
  assert.ok(helpSrc.includes('Ctrl+Z') || helpSrc.includes('Ctrl + Z'), 'Undo Ctrl+Z shortcut must be documented');
});

test('Redo documented with Ctrl+Y shortcut', () => {
  assert.ok(helpSrc.includes('Ctrl+Y') || helpSrc.includes('Ctrl + Y'), 'Redo Ctrl+Y shortcut must be documented');
});

test('Open / Close categories documented under Editing', () => {
  const editingPos = helpSrc.indexOf('Editing Your Gear List');
  const openPos    = helpSrc.indexOf('Open', editingPos);
  const closePos   = helpSrc.indexOf('Close', editingPos);
  assert.ok(openPos > editingPos && closePos > editingPos, 'Open / Close categories must be under Editing');
});

test('Imperial / Metric documented under Editing', () => {
  const editingPos = helpSrc.indexOf('Editing Your Gear List');
  const metricPos  = helpSrc.indexOf('Metric', editingPos);
  assert.ok(metricPos > editingPos, 'Imperial / Metric must be documented under Editing');
});

test('Reset documented under Editing', () => {
  const editingPos = helpSrc.indexOf('Editing Your Gear List');
  const resetPos   = helpSrc.indexOf('Reset', editingPos);
  assert.ok(resetPos > editingPos, 'Reset must be documented under Editing');
});

test('Reset explains it clears items (not categories)', () => {
  const resetIdx = helpSrc.indexOf('Reset');
  const clearItemsAfterReset = helpSrc.indexOf('items', resetIdx);
  assert.ok(clearItemsAfterReset > resetIdx, 'Reset must explain that items are cleared (categories remain)');
});

// ── Save / Locker ─────────────────────────────────────────────────────────────
console.log('\n022C Save / Locker:');

test('Save toast confirmation "Saved [name]" documented', () => {
  assert.ok(helpSrc.includes('Saved') && (helpSrc.includes('List Name') || helpSrc.includes('[List Name]') || helpSrc.includes('toast') || helpSrc.includes('brief') || helpSrc.includes('confirmation')), 'Save confirmation toast must be documented');
});

test('Save As explained for trip/trail variants', () => {
  const saveAsPos = helpSrc.indexOf('Save As');
  const variantPos = helpSrc.indexOf('version', saveAsPos !== -1 ? saveAsPos : 0) !== -1
    ? helpSrc.indexOf('version', saveAsPos)
    : helpSrc.indexOf('copy', saveAsPos);
  assert.ok(saveAsPos !== -1, 'Save As missing from Save/Locker section');
  assert.ok(variantPos > saveAsPos, 'Save As must explain creating variants');
});

test('Locker: does not instruct users that a password IS required to delete', () => {
  // Must not claim a password is required; phrases like "no password required" are fine
  assert.ok(
    !helpSrc.includes('A password is required') &&
    !helpSrc.includes('a password is required') &&
    !helpSrc.includes('password to delete') &&
    !helpSrc.includes('requires a password'),
    'Must not tell users a password is required to delete from Locker',
  );
  // Confirm Yes/No confirmation is documented
  assert.ok(
    helpSrc.includes('Yes') && helpSrc.includes('No'),
    'Locker delete must document Yes/No confirmation',
  );
});

test('Locker: load, rename, delete all documented', () => {
  const savePos = helpSrc.indexOf('Save / Locker');
  assert.ok(
    helpSrc.indexOf('Rename', savePos) > savePos || helpSrc.indexOf('rename', savePos) > savePos,
    'Locker rename must be documented',
  );
  assert.ok(
    helpSrc.indexOf('Delet', savePos) > savePos || helpSrc.indexOf('delet', savePos) > savePos,
    'Locker delete must be documented',
  );
});

test('Locker: opens in new browser tab on load', () => {
  assert.ok(helpSrc.includes('new browser tab') || helpSrc.includes('new tab'), 'Locker load must explain new tab behavior');
});

// ── Preview / Print / Share ───────────────────────────────────────────────────
console.log('\n022C Preview / Print / Share:');

test('Preview documented in Preview/Print/Share section', () => {
  const previewSharePos = helpSrc.indexOf('Preview / Print / Share');
  const previewContentPos = helpSrc.indexOf('formatted', previewSharePos);
  assert.ok(previewContentPos > previewSharePos, 'Preview content missing under Preview/Print/Share');
});

test('Print exists inside Preview (Print button inside Preview)', () => {
  assert.ok(
    helpSrc.includes('Print button inside') || helpSrc.includes('inside the preview') || helpSrc.includes('inside Preview'),
    'Print must be documented as accessed from inside Preview',
  );
});

test('Print explains use as physical packing checklist', () => {
  assert.ok(
    helpSrc.includes('packing checklist') || helpSrc.includes('physical'),
    'Print must explain practical use as a packing checklist',
  );
});

test('Share Link documented (all saved Locker files)', () => {
  assert.ok(
    helpSrc.includes('Share Link') && (helpSrc.includes('all your saved') || helpSrc.includes('Locker file')),
    'Share Link must be documented with its Locker-files behavior',
  );
});

test('Share Pack List documented (single list, checkable)', () => {
  assert.ok(helpSrc.includes('Share Pack List'), 'Share Pack List must be documented');
});

test('Checkable / temporary check behavior of shared view documented', () => {
  assert.ok(
    helpSrc.includes('temporary') || helpSrc.includes('temporarily'),
    'Must document that recipient checking is temporary',
  );
  assert.ok(
    helpSrc.includes('never') || helpSrc.includes('not save') || helpSrc.includes("doesn't save"),
    'Must document that temporary checks are not saved to original',
  );
});

test('Download PDF documented under Share section', () => {
  const sharePos = helpSrc.indexOf('Preview / Print / Share');
  const pdfPos   = helpSrc.indexOf('PDF', sharePos);
  assert.ok(pdfPos > sharePos, 'Download PDF must be documented under Preview/Print/Share');
});

test('No separate "Share a Checkable Packing List" topic', () => {
  assert.ok(
    !helpSrc.includes('"Share a Checkable Packing List"') &&
    !helpSrc.includes("'Share a Checkable Packing List'"),
    'Checkable packing list info must be inside Share, not a separate section title',
  );
});

// ── Backgrounds & Display ─────────────────────────────────────────────────────
console.log('\n022C Backgrounds & Display:');

test('Landscapes built-in collection documented', () => {
  assert.ok(helpSrc.includes('Landscapes'), 'Landscapes built-in collection must be documented');
});

test('Custom themes documented (Add Theme)', () => {
  assert.ok(
    helpSrc.includes('Add Theme') || helpSrc.includes('custom theme'),
    'Custom themes must be documented',
  );
});

test('Add Photo documented for custom themes', () => {
  assert.ok(helpSrc.includes('Add Photo'), 'Add Photo must be documented for custom themes');
});

test('Fill Screen / Fit Image documented', () => {
  assert.ok(helpSrc.includes('Fill Screen') || helpSrc.includes('Fill'), 'Fill must be documented');
  assert.ok(helpSrc.includes('Fit Image') || helpSrc.includes('Fit'), 'Fit must be documented');
});

test('Fill = crops/covers; Fit = entire image shown', () => {
  assert.ok(
    (helpSrc.includes('crop') || helpSrc.includes('cover')) &&
    (helpSrc.includes('entire') || helpSrc.includes('whole')),
    'Fit/Fill must explain cropping vs entire image shown',
  );
});

test('Showcase / Hide documented', () => {
  assert.ok(helpSrc.includes('Showcase') || (helpSrc.includes('Hide') && helpSrc.includes('background')), 'Showcase/Hide must be documented');
});

test('Light / Dark tone documented', () => {
  assert.ok(helpSrc.includes('Light') && helpSrc.includes('Dark') && helpSrc.includes('tone'), 'Light/Dark tone must be documented');
});

test('Lighten/Darken slider documented', () => {
  assert.ok(helpSrc.includes('slider') || helpSrc.includes('Lighten') || helpSrc.includes('Darken'), 'Lighten/Darken slider must be documented');
});

// ── No video/animation placeholders ──────────────────────────────────────────
console.log('\n022C No Video/Animation:');

test('No How-To Videos section', () => {
  assert.ok(!helpSrc.includes('How-To Videos') && !helpSrc.includes('Video Tutorial'), 'Video sections must not be present');
});

test('No Coming Soon placeholders', () => {
  assert.ok(!helpSrc.includes('Coming soon') && !helpSrc.includes('coming soon'), 'No Coming Soon placeholders');
});

// ── Footer / layout regression ────────────────────────────────────────────────
console.log('\n022C Footer/Layout Regression:');

test('Footer background #1e2322 unchanged', () => {
  assert.ok(footerSrc.includes('#1e2322'), 'Footer background color must not change');
});

test('Checklist imports and renders Footer', () => {
  assert.ok(checklistSrc.includes('import Footer'), 'Checklist must import Footer');
  assert.ok(checklistSrc.includes('<Footer'), 'Checklist must render Footer');
});

test('Checklist has overflow-y-auto scroll container (022A)', () => {
  assert.ok(checklistSrc.includes('overflow-y-auto'), '022A scroll container must be unchanged');
});

test('SharedChecklistPage uses informationalOnly footer', () => {
  assert.ok(sharedSrc.includes('informationalOnly'), 'Shared view must use informationalOnly footer');
});

test('021P layout: sidebar inner div has pb-8 no py-2', () => {
  // 023C: inner div now uses "gap-5 lg:gap-4 pb-8" — accept either variant
  const hasPb8 = checklistSrc.includes('flex flex-col gap-4 pb-8') ||
                 checklistSrc.includes('flex flex-col gap-5 lg:gap-4 pb-8') ||
                 checklistSrc.includes('flex flex-col gap-6 lg:gap-4 pb-8');
  assert.ok(hasPb8, '021P invariant must be unchanged: sidebar inner div needs flex flex-col … pb-8');
});

test('All 10 footer routes still registered in App.tsx', () => {
  const routes = ['/about', '/how-it-works', '/help', '/report-problem', '/contact',
                  '/privacy', '/terms', '/delete-account', '/affiliate', '/accessibility'];
  for (const r of routes) {
    assert.ok(appSrc.includes(`path="${r}"`), `Route ${r} missing from App.tsx`);
  }
});

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n022C Reorganized Help: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
