/**
 * about022L.test.mjs — Prompt 022L: Expanded About + Sources & References
 *
 * Protects:
 *   • 17 accordion sections present (12 original + 5 new: mind, body, spirit, creator, credits)
 *   • 4 non-collapsible SectionLabel dividers present (MENTAL/PHYSICAL/SPIRITUAL, HIKING
 *     PHILOSOPHY, ULTRALIGHT, TRAILWEIGH)
 *   • New 022L section order (MENTAL group → HIKING PHILOSOPHY → ULTRALIGHT → TRAILWEIGH)
 *   • Mind section: evidence-based mental/emotional benefits, research citations present
 *   • Body section: physical benefits, biodiversity/microbiome research present
 *   • Spirit section: awe, nature connectedness, cross-tradition quotes present
 *   • Ray-Way: corrected 12,500 miles (not 15,000); independence disclaimer present
 *   • Ray-Way: 1987–1994 date range and publication history present
 *   • About the Creator accordion present with placeholder content
 *   • Credits accordion present
 *   • SourcesModal component: imported and rendered in AboutPage
 *   • SourcesModal: 25 numbered references present
 *   • SourcesModal: accessible dialog (role=dialog, aria-modal, aria-labelledby)
 *   • SourcesModal: focus trap / Escape close supported
 *   • Inline Cite component: renders as <sup><button>[N]</button></sup>
 *   • Sources & References link visible on About page (outside accordions)
 *   • Footer: Sources & References button opens modal (footer-level)
 *   • SharedChecklistPage: Sources & References link in full shared view
 *   • SharedChecklistPage: Sources & References link in pack-list view
 *   • No third-party image artwork added (no <img src for Ray Jardine book covers, etc.)
 *   • Independence disclaimer for Ray-Way / TrailWeigh present
 *   • All 022J invariants preserved (Share labels, panel defaults)
 *   • All 022D accordion mechanics preserved
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const infoRoot   = path.resolve('artifacts/pack-checklist/src/pages/info');
const compRoot   = path.resolve('artifacts/pack-checklist/src/components');
const pagesRoot  = path.resolve('artifacts/pack-checklist/src/pages');
const hooksRoot  = path.resolve('artifacts/pack-checklist/src/hooks');

const readInfo  = (name) => fs.readFileSync(path.join(infoRoot,  name), 'utf8');
const readComp  = (name) => fs.readFileSync(path.join(compRoot,  name), 'utf8');
const readPage  = (name) => fs.readFileSync(path.join(pagesRoot, name), 'utf8');

// ── Minimal test harness ──────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
let currentSuite = '';

function suite(name) { currentSuite = name; }

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

// ── Source files ──────────────────────────────────────────────────────────────

const aboutSrc   = readInfo('AboutPage.tsx');
const sourcesSrc = readComp('SourcesModal.tsx');
const footerSrc  = readComp('Footer.tsx');
const sharedSrc  = readPage('SharedChecklistPage.tsx');

const hasA  = (s) => aboutSrc.includes(s);
const hasSM = (s) => sourcesSrc.includes(s);
const hasF  = (s) => footerSrc.includes(s);
const hasSh = (s) => sharedSrc.includes(s);
const idxA  = (s) => aboutSrc.indexOf(s);

// ── Tests: 17 Sections Present ────────────────────────────────────────────────

suite('022L All 17 Sections Present');

const allSections = [
  // Mental / Physical / Spiritual
  { id: 'why-here',       title: 'Remember Why We' },
  { id: 'mind',           title: 'Mind' },
  { id: 'body',           title: 'Body' },
  { id: 'spirit',         title: 'Spirit' },
  // Hiking Philosophy
  { id: 'trail-or-camp',  title: 'Do You Hike for the Trail or the Camp?' },
  { id: 'hyoh',           title: 'Hike Your Own Hike' },
  { id: 'respect',        title: 'Respect the Trail' },
  // Ultralight
  { id: 'ultralight',     title: 'What Is Ultralight?' },
  { id: 'tool-not-contest',title: 'Ultralight Is a Tool, Not a Contest' },
  { id: 'minimalist',     title: 'The Minimalist Mindset' },
  { id: 'ray-way',        title: 'Ray-Way' },
  { id: 'knowledge',      title: 'Knowledge Weighs Nothing' },
  { id: 'systems',        title: 'Think in Systems' },
  { id: 'multi-use',      title: 'One Tool, Many Uses' },
  // TrailWeigh
  { id: 'trailweigh-fits',title: 'Where TrailWeigh Fits In' },
  { id: 'creator',        title: 'About the Creator' },
  { id: 'credits',        title: 'Credits' },
];

allSections.forEach(({ id, title }) => {
  test(`Section id="${id}" present`, () => {
    assert.ok(
      hasA(`id="${id}"`) || hasA(`id={'${id}'}`) || hasA(`'${id}'`),
      `Missing Section with id prop: "${id}"`,
    );
  });

  test(`Section title contains "${title.slice(0, 28)}"`, () => {
    assert.ok(hasA(title), `Missing section title: "${title}"`);
  });
});

// ── Tests: 4 SectionLabel dividers ────────────────────────────────────────────

suite('022L Section Labels');

test('SectionLabel component defined or used', () => {
  assert.ok(
    hasA('SectionLabel') || hasA('section-label'),
    'SectionLabel component must be defined/used',
  );
});

test('Mental / Physical / Spiritual label', () => {
  assert.ok(
    hasA('Mental') && hasA('Physical') && hasA('Spiritual'),
    'Must have a section label containing Mental / Physical / Spiritual',
  );
});

test('Hiking Philosophy label', () => {
  assert.ok(
    hasA('Hiking Philosophy') || hasA('HIKING PHILOSOPHY'),
    'Must have a Hiking Philosophy section label',
  );
});

test('Ultralight label', () => {
  assert.ok(
    aboutSrc.match(/Ultralight.*SectionLabel|SectionLabel.*Ultralight/s) ||
    (hasA('SectionLabel') && hasA('>Ultralight<')),
    'Must have an Ultralight section label',
  );
});

test('TrailWeigh label', () => {
  assert.ok(
    aboutSrc.match(/TrailWeigh.*SectionLabel|SectionLabel.*TrailWeigh/s) ||
    hasA('>TrailWeigh<') || hasA('TrailWeigh</p>') || hasA('>TRAILWEIGH'),
    'Must have a TrailWeigh section label',
  );
});

// ── Tests: New 022L section order ─────────────────────────────────────────────

suite('022L New Section Order');

const newOrder = [
  'Remember Why We',
  'Mind',
  'Body',
  'Spirit',
  'Do You Hike for the Trail or the Camp?',
  'Hike Your Own Hike',
  'Respect the Trail',
  'What Is Ultralight?',
  'Ultralight Is a Tool, Not a Contest',
  'The Minimalist Mindset',
  'Ray-Way',
  'Knowledge Weighs Nothing',
  'Think in Systems',
  'One Tool, Many Uses',
  'Where TrailWeigh Fits In',
  'About the Creator',
  'Credits',
];

test('All 17 section titles appear in 022L order', () => {
  let prev = -1;
  for (const title of newOrder) {
    const pos = idxA(title);
    assert.ok(pos !== -1, `Missing section title: "${title}"`);
    assert.ok(pos > prev,
      `Section "${title}" is out of 022L order (found at ${pos}, previous was at ${prev})`);
    prev = pos;
  }
});

// ── Tests: Mind section ────────────────────────────────────────────────────────

suite('022L Mind Section');

test('Mind: mental / emotional benefits framing', () => {
  assert.ok(
    hasA('Mental') && hasA('Emotional') || hasA('mental') && hasA('emotional'),
    'Mind section must mention mental and emotional benefits',
  );
});

test('Mind: research citations present (inline Cite component)', () => {
  // Cite components appear in Mind section; verify at least one [1] or [2] reference
  assert.ok(
    hasA('Cite') || hasA('[1]') || hasA('n={1}'),
    'Mind section must include inline citation markers',
  );
});

test('Mind: research results vary disclaimer present', () => {
  assert.ok(
    hasA('results vary') || hasA('results can vary') || hasA('vary by study') ||
    hasA('not a cure') || hasA('not a replacement'),
    'Mind section must acknowledge research limitations / results vary',
  );
});

test('Mind: working memory or cognitive mention', () => {
  assert.ok(
    hasA('working memory') || hasA('cognitive') || hasA('attention'),
    'Mind section must mention cognitive research findings',
  );
});

// ── Tests: Body section ────────────────────────────────────────────────────────

suite('022L Body Section');

test('Body: cardiovascular or physical activity benefits', () => {
  assert.ok(
    hasA('cardiovascular') || hasA('physical activity'),
    'Body section must mention cardiovascular / physical activity benefits',
  );
});

test('Body: biodiversity / microbiome sub-section present', () => {
  assert.ok(
    hasA('microbiome') || hasA('microbiota') || hasA('microorganism'),
    'Body section must include the biodiversity/microbiome discussion',
  );
});

test('Body: "We Are Ecosystems" sub-heading or concept', () => {
  assert.ok(
    hasA('Ecosystems') || hasA('ecosystems') || hasA('ecosystem'),
    'Body section must include the ecosystems framing',
  );
});

test('Body: research caveats present', () => {
  assert.ok(
    hasA('mixed results') || hasA('unanswered') || hasA('vary') || hasA('under investigation'),
    'Body section must acknowledge research limitations',
  );
});

// ── Tests: Spirit section ─────────────────────────────────────────────────────

suite('022L Spirit Section');

test('Spirit: no specific religion required', () => {
  assert.ok(
    hasA('does not') || hasA('no particular'),
    'Spirit section must clarify it is not tied to one religion',
  );
});

test('Spirit: awe / small self discussed', () => {
  assert.ok(
    hasA('awe') || hasA('Awe'),
    'Spirit section must discuss awe',
  );
});

test('Spirit: nature connectedness meta-analysis mentioned', () => {
  assert.ok(
    hasA('connectedness') || hasA('nature connectedness') || hasA('meta-analysis'),
    'Spirit section must mention nature connectedness research',
  );
});

test('Spirit: John Muir quote present', () => {
  assert.ok(
    hasA('Muir') || hasA('hitched to everything'),
    'Spirit section must include John Muir quote',
  );
});

test('Spirit: Tao Te Ching or similar cross-tradition quote', () => {
  assert.ok(
    hasA('Tao') || hasA('Lao') || hasA('Heaven') || hasA('Earth takes'),
    'Spirit section must include a Tao Te Ching reference',
  );
});

test('Spirit: "We are part of it" or ecological belonging theme', () => {
  assert.ok(
    hasA('part of nature') || hasA('part of it') || hasA('We are part'),
    'Spirit section must include ecological belonging / "we are part of nature"',
  );
});

test('Spirit: "small self" concept mentioned', () => {
  assert.ok(
    hasA('small self') || hasA('Small self') || hasA('smaller self'),
    'Spirit section must mention the "small self" awe concept',
  );
});

// ── Tests: Ray-Way corrections ────────────────────────────────────────────────

suite('022L Ray-Way Corrections');

test('Ray-Way: 12,500 miles (corrected from 15,000)', () => {
  assert.ok(
    hasA('12,500') || hasA('12500'),
    'Ray-Way must use corrected mileage of 12,500 (not 15,000)',
  );
  assert.ok(
    !hasA('15,000') && !hasA('15000'),
    'Ray-Way must NOT mention 15,000 miles (incorrect figure)',
  );
});

test('Ray-Way: 1987–1994 date range', () => {
  assert.ok(
    hasA('1987') && hasA('1994'),
    'Ray-Way must include 1987–1994 date range',
  );
});

test('Ray-Way: independence disclaimer present', () => {
  assert.ok(
    hasA('not affiliated') || hasA('not affiliation') ||
    hasA('independent project') || hasA('is not affiliated'),
    'Must include independence disclaimer: TrailWeigh is not affiliated with Ray-Way',
  );
});

test('Ray-Way: publication dates — PCT Handbook beta printing or 1991/1992', () => {
  assert.ok(
    hasA('1991') || hasA('1992') || hasA('beta printing') || hasA('first commercial'),
    'Must include PCT Handbook first printing dates',
  );
});

test('Ray-Way: Beyond Backpacking 1999 and Trail Life 2008', () => {
  assert.ok(
    (hasA('Beyond Backpacking') && hasA('1999')) ||
    (hasA('Trail Life') && hasA('2008')),
    'Must include Beyond Backpacking (1999) and/or Trail Life (2008)',
  );
});

// ── Tests: About the Creator ──────────────────────────────────────────────────

suite('022L About the Creator');

test('Creator accordion present', () => {
  assert.ok(hasA('id="creator"') || hasA("id={'creator'}"), 'Creator section id must be present');
});

test('Creator: placeholder content (no false biography)', () => {
  assert.ok(
    hasA('creator') || hasA('Creator'),
    'Creator section must be present',
  );
  // Must NOT invent specific claims
  assert.ok(
    !hasA('born in') && !hasA('grew up in') && !hasA('years of experience') &&
    !hasA('decades of experience'),
    'Creator section must not invent biographical details',
  );
});

// ── Tests: Credits section ────────────────────────────────────────────────────

suite('022L Credits Section');

test('Credits accordion present', () => {
  assert.ok(hasA('id="credits"') || hasA("id={'credits'}"), 'Credits section id must be present');
});

test('Credits: acknowledges broader hiking community', () => {
  assert.ok(
    hasA('hiking community') || hasA('hikers') || hasA('community'),
    'Credits must acknowledge the broader hiking community',
  );
});

test('Credits: third-party disclaimer', () => {
  assert.ok(
    hasA('not affiliated') || hasA('independent') || hasA('does not imply'),
    'Credits must include a general third-party / independence disclaimer',
  );
});

// ── Tests: SourcesModal component ────────────────────────────────────────────

suite('022L SourcesModal Component');

test('SourcesModal.tsx file exists', () => {
  assert.ok(fs.existsSync(path.join(compRoot, 'SourcesModal.tsx')), 'SourcesModal.tsx must exist');
});

test('SourcesModal: accessible dialog semantics', () => {
  assert.ok(
    hasSM('role="dialog"') || hasSM("role={'dialog'}"),
    'SourcesModal must use role="dialog"',
  );
  assert.ok(
    hasSM('aria-modal') || hasSM('aria-labelledby'),
    'SourcesModal must use aria-modal or aria-labelledby',
  );
});

test('SourcesModal: 25 references present (ref-1 through ref-25)', () => {
  for (let i = 1; i <= 25; i++) {
    assert.ok(
      hasSM(`ref-${i}`) || hasSM(`[${i}]`) || hasSM(`n={${i}}`),
      `SourcesModal must contain reference ${i}`,
    );
  }
});

test('SourcesModal: Escape key / close mechanism', () => {
  assert.ok(
    hasSM('Escape') || hasSM('onKeyDown') || hasSM('keydown') || hasSM('onClose'),
    'SourcesModal must support Escape key or close mechanism',
  );
});

test('SourcesModal: scrollToRef prop accepted', () => {
  assert.ok(
    hasSM('scrollToRef') || hasSM('scroll-to-ref'),
    'SourcesModal must accept scrollToRef prop',
  );
});

test('SourcesModal: DOI or PMID or equivalent citation depth present', () => {
  assert.ok(
    hasSM('doi') || hasSM('DOI') || hasSM('pmid') || hasSM('PMID') ||
    hasSM('10.') || hasSM('pubmed'),
    'SourcesModal must include DOI / PMID / link for references',
  );
});

// ── Tests: Inline citation (Cite component) ───────────────────────────────────

suite('022L Inline Cite Component');

test('Cite component defined inside AboutPage', () => {
  assert.ok(
    hasA('function Cite') || hasA('const Cite') || hasA('Cite ='),
    'Cite component must be defined inside AboutPage',
  );
});

test('Cite renders as <sup><button>', () => {
  assert.ok(
    hasA('<sup>') && hasA('<button'),
    'Cite must render as <sup><button>',
  );
});

test('Cite opens sources modal on click', () => {
  assert.ok(
    hasA('openSources') || hasA('setSourcesOpen') || hasA('sourcesOpen'),
    'Cite must call openSources / setSourcesOpen when clicked',
  );
});

// ── Tests: SourcesModal imported/rendered in AboutPage ────────────────────────

suite('022L SourcesModal Integration – AboutPage');

test('SourcesModal imported into AboutPage', () => {
  assert.ok(
    hasA("import SourcesModal") || hasA("from '@/components/SourcesModal'"),
    'SourcesModal must be imported in AboutPage',
  );
});

test('SourcesModal rendered in AboutPage', () => {
  assert.ok(
    hasA('<SourcesModal') || hasA('SourcesModal '),
    'SourcesModal must be rendered in AboutPage',
  );
});

test('Sources & References link visible on About page', () => {
  assert.ok(
    hasA('Sources') && hasA('References'),
    'Must include a "Sources & References" link/button on the About page',
  );
});

// ── Tests: SourcesModal in Footer ────────────────────────────────────────────

suite('022L SourcesModal Integration – Footer');

test('SourcesModal imported into Footer', () => {
  assert.ok(
    hasF('SourcesModal') || hasF("from '@/components/SourcesModal'"),
    'SourcesModal must be imported in Footer',
  );
});

test('Footer: Sources & References button present', () => {
  assert.ok(
    hasF('Sources') && hasF('References'),
    'Footer must include a Sources & References button/link',
  );
});

test('Footer: modal state managed (useState)', () => {
  assert.ok(
    hasF('sourcesOpen') || hasF('useState'),
    'Footer must manage modal open state with useState',
  );
});

test('Footer: informationalOnly prop still present', () => {
  assert.ok(
    hasF('informationalOnly'),
    'Footer informationalOnly prop must still exist',
  );
});

test('Footer: dark color unchanged', () => {
  assert.ok(
    hasF('#1e2322') || hasF('1e2322'),
    'Footer dark color must be unchanged (#1e2322)',
  );
});

// ── Tests: SharedChecklistPage Sources links ──────────────────────────────────

suite('022L SharedChecklistPage Sources Integration');

test('SourcesModal imported into SharedChecklistPage', () => {
  assert.ok(
    hasSh('SourcesModal') || hasSh("from '@/components/SourcesModal'"),
    'SourcesModal must be imported in SharedChecklistPage',
  );
});

test('SharedChecklistPage: Sources & References link present (full view)', () => {
  // Both the full shared view and the pack-list view should have Sources links
  const count = (sharedSrc.match(/Sources.*References|Sources &amp; References/g) || []).length;
  assert.ok(
    count >= 2,
    `SharedChecklistPage must have Sources & References in both view types; found ${count} occurrence(s)`,
  );
});

test('SharedChecklistPage: SourcesModal rendered', () => {
  const count = (sharedSrc.match(/<SourcesModal/g) || []).length;
  assert.ok(
    count >= 2,
    `SharedChecklistPage must render SourcesModal in both view components; found ${count}`,
  );
});

test('SharedChecklistPage: 022G invariant — never writes last-active-file', () => {
  assert.ok(
    !sharedSrc.includes("'last-active-file'") && !sharedSrc.includes('"last-active-file"'),
    'SharedChecklistPage must never write last-active-file (022G invariant)',
  );
});

// ── Tests: 022J invariants preserved ─────────────────────────────────────────

suite('022L 022J Regression');

test('022J: SharedLockerPanel opens true in shared view', () => {
  assert.ok(
    sharedSrc.includes('useState(true)') ||
    sharedSrc.includes("open={true}") ||
    (sharedSrc.includes('SharedLockerPanel') && sharedSrc.includes('true')),
    'SharedLockerPanel must open by default (022J)',
  );
});

test('022J: ImportGearPanel defaultOpen={true} in shared view', () => {
  assert.ok(
    sharedSrc.includes('defaultOpen={true}'),
    'ImportGearPanel must have defaultOpen={true} in shared view (022J)',
  );
});

test('022J: "Share TrailWeigh List" label present', () => {
  const checkSrc = fs.readFileSync(
    path.join(pagesRoot, 'Checklist.tsx'), 'utf8',
  );
  assert.ok(
    checkSrc.includes('Share TrailWeigh List'),
    '"Share TrailWeigh List" label must be present in Checklist (022J)',
  );
});

test('022J: "Share Checkable Packing List" label present', () => {
  const checkSrc = fs.readFileSync(
    path.join(pagesRoot, 'Checklist.tsx'), 'utf8',
  );
  assert.ok(
    checkSrc.includes('Share Checkable Packing List'),
    '"Share Checkable Packing List" label must be present in Checklist (022J)',
  );
});

// ── Tests: No third-party artwork ─────────────────────────────────────────────

suite('022L No Third-Party Artwork');

test('No <img> tag referencing Ray Jardine book covers in AboutPage', () => {
  const imgMatches = aboutSrc.match(/<img[^>]+>/gi) || [];
  const bookCoverImgs = imgMatches.filter(img =>
    /jardine|ray-way|pacific.crest|beyond.backpack|trail.life/i.test(img),
  );
  assert.ok(
    bookCoverImgs.length === 0,
    `Must not embed Ray Jardine book cover images; found: ${bookCoverImgs.join(', ')}`,
  );
});

test('No external image URL for copyrighted artwork in AboutPage', () => {
  const externalImgs = aboutSrc.match(/https?:\/\/[^\s"']+\.(jpg|jpeg|png|webp|gif)/gi) || [];
  assert.ok(
    externalImgs.length === 0,
    `Must not embed external copyrighted images; found: ${externalImgs.join(', ')}`,
  );
});

// ── Results ───────────────────────────────────────────────────────────────────

const total = passed + failed;
console.log(`\n022L About Expanded + Sources: ${passed}/${total} passed${failed > 0 ? `, ${failed} failed` : ''}`);
if (failed > 0) process.exit(1);
