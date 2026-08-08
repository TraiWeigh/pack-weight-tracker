/**
 * howItWorks022E.test.mjs — Prompt 022E: How It Works Accordion Regression Tests
 *
 * Protects:
 *   • Page was actually modified (not the old 6-step flat layout)
 *   • Three sections: Create/Upload, Add/Organize, Save/Preview/Print/Share
 *   • Sections appear in required order
 *   • Scan Gear List inside Create/Upload (not a separate section)
 *   • File types accurate: PDF, Word, Excel, Numbers
 *   • No separate "Scan Gear List" or "Importing" top-level section
 *   • Checkbox / selecting gear in Add/Organize
 *   • Different trail/season list guidance present
 *   • PCT, AT, CDT examples present
 *   • Seasonal/condition examples present
 *   • Save As mentioned for creating new versions
 *   • Save/Locker described
 *   • Preview described
 *   • Print: physical packing checklist use case
 *   • Trailhead / forgot gear scenario
 *   • Share: checkable packing list described
 *   • Share: recipient changes temporary (don't affect original)
 *   • No separate "Share a Checkable Packing List" section
 *   • No ultralight philosophy (Ray-Way, HYOH, etc.)
 *   • Accordion: aria-expanded, aria-controls, role=region
 *   • Accordion: collapsed by default
 *   • Full title row clickable (w-full button)
 *   • Help & How-To link present
 *   • HelpPage (022C) unchanged
 *   • AboutPage (022D) unchanged
 *   • Footer unchanged
 *   • All routes intact
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const infoRoot = path.resolve('artifacts/pack-checklist/src/pages/info');
const root     = path.resolve('artifacts/pack-checklist/src');
const readInfo = (name) => fs.readFileSync(path.join(infoRoot, name), 'utf8');
const read     = (rel)  => fs.readFileSync(path.join(root, rel), 'utf8');

// ── Minimal test harness ──────────────────────────────────────────────────────

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
    console.error(`  ✗ ${label}`);
    console.error(`    ${err.message}`);
  }
}

// ── Source files ──────────────────────────────────────────────────────────────

const src       = readInfo('HowItWorksPage.tsx');
const helpSrc   = readInfo('HelpPage.tsx');
const aboutSrc  = readInfo('AboutPage.tsx');
const footerSrc = read('components/Footer.tsx');
const appSrc    = read('App.tsx');

const has = (str) => src.includes(str);
const idx = (str) => src.indexOf(str);

// ── Tests: Page was updated ───────────────────────────────────────────────────

suite('022E Page Updated');

test('Page no longer uses the old 6-step flat steps array', () => {
  assert.ok(
    !has("title: '1. Create or open a gear list'") &&
    !has("title: '6. Scan Gear List (optional)'"),
    'Old flat steps array must not be present',
  );
});

test('Page uses accordion (useState + toggle)', () => {
  assert.ok(
    has('useState') && has('toggle'),
    'New page must use accordion state management',
  );
});

test('How It Works heading present', () => {
  assert.ok(has('How It Works'), 'Missing "How It Works" heading');
});

// ── Tests: Three required sections ───────────────────────────────────────────

suite('022E Three Required Sections');

test('Section 1: Create / Upload present', () => {
  assert.ok(
    has('Create / Upload') || has('Create/Upload'),
    'Missing Create / Upload section',
  );
});

test('Section 2: Add / Organize present', () => {
  assert.ok(
    has('Add / Organize') || has('Add/Organize'),
    'Missing Add / Organize section',
  );
});

test('Section 3: Save / Preview / Print / Share present', () => {
  assert.ok(
    has('Save / Preview / Print / Share') ||
    (has('Save') && has('Preview') && has('Print') && has('Share')),
    'Missing Save / Preview / Print / Share section',
  );
});

test('Sections appear in correct order (Create → Organize → Save/Share)', () => {
  const posCreate  = idx('Create / Upload') !== -1 ? idx('Create / Upload') : idx('Create/Upload');
  const posOrg     = idx('Add / Organize')  !== -1 ? idx('Add / Organize')  : idx('Add/Organize');
  const posSave    = idx('Save / Preview')  !== -1 ? idx('Save / Preview')  : idx('Save');

  assert.ok(posCreate !== -1, 'Create/Upload section missing');
  assert.ok(posOrg    !== -1, 'Add/Organize section missing');
  assert.ok(posSave   !== -1, 'Save section missing');

  assert.ok(posCreate < posOrg,  'Create/Upload must come before Add/Organize');
  assert.ok(posOrg    < posSave, 'Add/Organize must come before Save');
});

// ── Tests: Accordion mechanics ────────────────────────────────────────────────

suite('022E Accordion Mechanics');

test('aria-expanded present', () => {
  assert.ok(has('aria-expanded'), 'Missing aria-expanded');
});

test('aria-controls present', () => {
  assert.ok(has('aria-controls'), 'Missing aria-controls');
});

test('role="region" present', () => {
  assert.ok(has('role="region"'), 'Missing role="region"');
});

test('aria-labelledby present', () => {
  assert.ok(has('aria-labelledby'), 'Missing aria-labelledby');
});

test('Collapsed by default (empty Set)', () => {
  assert.ok(
    has('new Set()') || has('new Set<string>()'),
    'Accordion must start with empty Set (all collapsed)',
  );
  assert.ok(
    !has("new Set(['") && !has('new Set(["'),
    'Must not pre-open any section',
  );
});

test('Full title row is button (w-full)', () => {
  assert.ok(has('w-full'), 'Button must use w-full for full-row click target');
});

test('ChevronDown / ChevronUp present', () => {
  assert.ok(
    (has('ChevronDown') || has('chevron-down')) &&
    (has('ChevronUp')   || has('chevron-up')),
    'Must have ChevronDown and ChevronUp disclosure chevrons',
  );
});

test('No Expand All button', () => {
  assert.ok(
    !has('Expand All') && !has('expandAll') && !has('expand-all'),
    'Must not have Expand All button',
  );
});

// ── Tests: Create / Upload content ───────────────────────────────────────────

suite('022E Create Upload Content');

test('Starting from scratch / New mentioned', () => {
  assert.ok(
    has('New') || has('new list') || has('fresh list') || has('manually'),
    'Must explain starting from scratch with New',
  );
});

test('Scan Gear List inside Create/Upload (not separate section)', () => {
  assert.ok(has('Scan Gear List'), 'Scan Gear List must be mentioned');
  // Must not exist as a standalone section title — only inside Create/Upload
  // i.e. it should not be a section button title itself
  assert.ok(
    !has("title=\"Scan Gear List\"") && !has("title='Scan Gear List'"),
    'Scan Gear List must not be its own accordion section title',
  );
});

test('PDF file type listed', () => {
  assert.ok(has('PDF') || has('pdf'), 'Must list PDF as a supported file type');
});

test('Word document file type listed', () => {
  assert.ok(has('Word') || has('Word document'), 'Must list Word document as a supported file type');
});

test('Excel spreadsheet file type listed', () => {
  assert.ok(has('Excel') || has('Excel spreadsheet'), 'Must list Excel spreadsheet as a supported file type');
});

test('Numbers file type listed', () => {
  assert.ok(has('Numbers') || has('Numbers file'), 'Must list Numbers as a supported file type');
});

test('Review detected items before importing', () => {
  assert.ok(
    has('review') || has('Review') || has('detected'),
    'Must explain user reviews detected items before importing',
  );
});

// ── Tests: Add / Organize content ─────────────────────────────────────────────

suite('022E Add Organize Content');

test('Checkbox / selecting gear mentioned', () => {
  assert.ok(
    has('checkbox') || has('Checkbox') || has('Check the items') || has('check the items'),
    'Must explain checkbox for selecting gear on this trip',
  );
});

test('Unchecked items excluded from weight calculation', () => {
  assert.ok(
    has('Unchecked') || has('unchecked') || has('excluded from'),
    'Must explain unchecked items are excluded from current calculation',
  );
});

test('Move control mentioned', () => {
  assert.ok(
    has('Move') || has('move items') || has('move between'),
    'Must mention moving items between categories',
  );
});

test('PCT example present', () => {
  assert.ok(has('PCT'), 'Must include PCT as a trail example');
});

test('AT example present', () => {
  assert.ok(has('AT') || has('Appalachian'), 'Must include AT as a trail example');
});

test('CDT example present', () => {
  assert.ok(has('CDT'), 'Must include CDT as a trail example');
});

test('Seasonal / condition examples present', () => {
  assert.ok(
    (has('summer') || has('Summer') || has('winter') || has('Winter') || has('cold') || has('Cold')),
    'Must include seasonal or condition-specific list examples',
  );
});

test('Save As mentioned for creating variants', () => {
  assert.ok(
    has('Save As') || has('save as') || has('Save as'),
    'Must mention Save As for creating new list versions',
  );
});

test('Different trails/seasons framing present', () => {
  assert.ok(
    (has('trail') || has('season')) && (has('different') || has('separate')),
    'Must explain using separate lists for different trails or seasons',
  );
});

// ── Tests: Save / Preview / Print / Share content ────────────────────────────

suite('022E Save Preview Print Share Content');

test('Save / Locker described', () => {
  assert.ok(
    has('Save') && has('Locker'),
    'Must describe saving gear lists to the Locker',
  );
});

test('Preview described', () => {
  assert.ok(
    has('Preview') || has('preview'),
    'Must describe the Preview feature',
  );
});

test('Print: physical packing checklist explained', () => {
  assert.ok(
    has('packing checklist') || has('physical') || has('print'),
    'Must explain printing as a physical packing checklist',
  );
});

test('Print: gathering/packing use case mentioned', () => {
  assert.ok(
    has('gathering') || has('packing') || has('Gathering') || has('Packing'),
    'Must mention gathering or packing gear as a use case for printing',
  );
});

test('Trailhead / forgot gear scenario present', () => {
  assert.ok(
    has('trailhead') || has('Trailhead'),
    'Must mention the trailhead scenario',
  );
});

test('Share: checkable packing list described', () => {
  assert.ok(
    has('checkable') || has('check items') || has('check off'),
    'Must describe sharing a checkable packing list',
  );
});

test('Share: recipient changes do not affect owner original', () => {
  assert.ok(
    has("doesn't affect") || has("does not affect") ||
    has("won't affect") || has("don't affect") ||
    has("temporary") || has("Temporary") ||
    has("doesn't modify") || has("does not modify"),
    "Must clarify recipient's changes don't affect the owner's saved list",
  );
});

test('No separate "Share a Checkable Packing List" section', () => {
  // Should not be its own section title
  assert.ok(
    !has('"Share a Checkable Packing List"') &&
    !has("'Share a Checkable Packing List'"),
    '"Share a Checkable Packing List" must not be its own section title',
  );
});

// ── Tests: Excluded philosophy content ───────────────────────────────────────

suite('022E No Ultralight Philosophy Here');

test('No Ray-Way / Ray Jardine content', () => {
  assert.ok(
    !has('Ray-Way') && !has('Ray Jardine') && !has('Jardine'),
    'How It Works must not contain Ray Jardine / Ray-Way content',
  );
});

test('No HYOH content', () => {
  assert.ok(!has('HYOH') && !has('Hike Your Own Hike'), 'How It Works must not contain HYOH content');
});

test('No "What Is Ultralight" content', () => {
  assert.ok(!has('What Is Ultralight'), 'How It Works must not contain "What Is Ultralight" section');
});

// ── Tests: Link to Help present ───────────────────────────────────────────────

suite('022E Help Link');

test('Link to Help & How-To present', () => {
  assert.ok(
    has('/help') && (has('Help') || has('Help &amp; How-To') || has('Help & How-To')),
    'Must include a link to Help & How-To',
  );
});

// ── Tests: 022C / 022D regression ─────────────────────────────────────────────

suite('022E 022C 022D Regression');

test('HelpPage 022C: six sections still present', () => {
  const titles = [
    'Building Your Gear List',
    'Understanding Your Pack Weight',
    'Editing Your Gear List',
    'Save / Locker',
    'Preview / Print / Share',
    'Backgrounds',
  ];
  titles.forEach(t => {
    assert.ok(helpSrc.includes(t), `HelpPage missing section: "${t}"`);
  });
});

test('AboutPage 022D: all 12 accordion section titles still present', () => {
  const titles = [
    'What Is Ultralight?',
    'Ray-Way',
    'The Minimalist Mindset',
    'One Tool, Many Uses',
    'Think in Systems',
    'Knowledge Weighs Nothing',
    'Do You Hike for the Trail or the Camp?',
    'Hike Your Own Hike',
    'Ultralight Is a Tool, Not a Contest',
    'Remember Why We',
    'Respect the Trail',
    'Where TrailWeigh Fits In',
  ];
  titles.forEach(t => {
    assert.ok(aboutSrc.includes(t), `AboutPage missing section: "${t}"`);
  });
});

// ── Tests: Footer / routing regression ────────────────────────────────────────

suite('022E Footer and Routing Regression');

test('Footer dark color unchanged', () => {
  assert.ok(
    footerSrc.includes('#1e2322') || footerSrc.includes('1e2322'),
    'Footer dark color must be unchanged',
  );
});

test('How It Works route still registered', () => {
  assert.ok(
    appSrc.includes('/how-it-works') && appSrc.includes('HowItWorksPage'),
    'How It Works route must remain registered in App.tsx',
  );
});

test('All 10 footer routes still in App.tsx', () => {
  const routes = [
    '/about', '/help', '/how-it-works', '/privacy', '/terms',
    '/affiliate', '/contact', '/accessibility', '/report-problem', '/delete-account',
  ];
  routes.forEach(r => {
    assert.ok(appSrc.includes(r), `Route missing: ${r}`);
  });
});

// ── Results ───────────────────────────────────────────────────────────────────

console.log(`\n022E How It Works: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
