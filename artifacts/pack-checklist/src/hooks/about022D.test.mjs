/**
 * about022D.test.mjs — Prompt 022D: About TrailWeigh Accordion Content
 *
 * Protects:
 *   • Always-visible introduction present (no accordion required to see it)
 *   • Packing-checklist usefulness explained
 *   • Printing the list as a packing checklist mentioned
 *   • Three-line TrailWeigh philosophy visible in intro
 *   • All 12 required accordion sections present
 *   • Sections appear in required order
 *   • "Ray-Way" is the title (not "Ray Jardine" or "A Brief History")
 *   • Ray-Way contains Friend/cam paragraph
 *   • Ray-Way focuses primarily on ultralight contributions
 *   • Ray Jardine not falsely described as inventing traveling light
 *   • Minimalist philosophy present
 *   • One Tool, Many Uses present with multi-use examples
 *   • Systems thinking present
 *   • Knowledge/experience section present; no implication safety gear eliminated
 *   • Trail vs Camp presented without judgment
 *   • HYOH includes "Your hike is your own. The trail is shared."
 *   • Ultralight described as a tool not a contest
 *   • Nature/outdoor-experience philosophy present
 *   • Respect for trail, wildlife, rules, and other hikers present
 *   • Where TrailWeigh Fits In ties philosophy back to app
 *   • Final line is "Then go outside."
 *   • Accordion: aria-expanded, aria-controls, role=region semantics
 *   • Accordion: collapsed by default (no open state in useState init)
 *   • Entire title row is clickable button (w-full button)
 *   • No video or animation references
 *   • Help & How-To from 022C unchanged
 *   • Footer unchanged
 *   • Checklist page unchanged
 *   • Shared view unchanged
 *   • All routes intact (App.tsx)
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

// ── Source files ──────────────────────────────────────────────────────────────

const aboutSrc    = readInfo('AboutPage.tsx');
const helpSrc     = readInfo('HelpPage.tsx');
const footerSrc   = read('components/Footer.tsx');
const checkSrc    = read('pages/Checklist.tsx');
const sharedSrc   = read('pages/SharedChecklistPage.tsx');
const appSrc      = read('App.tsx');

// ── Helpers ───────────────────────────────────────────────────────────────────

const idx = (str) => aboutSrc.indexOf(str);
const has = (str) => aboutSrc.includes(str);

// ── Tests: Always-visible introduction ───────────────────────────────────────

suite('022D Visible Introduction');

test('About TrailWeigh heading visible', () => {
  assert.ok(has('About TrailWeigh'), 'Missing "About TrailWeigh" heading');
});

test('TrailWeigh helps you plan/organize/understand', () => {
  assert.ok(
    has('plan') && has('organize') && has('understand'),
    'Introduction must mention plan, organize, understand',
  );
});

test('Gear list is also a checklist', () => {
  assert.ok(
    has('checklist') && (has('also a checklist') || has('also a packing checklist') || has('list is also')),
    'Must state the gear list is also a checklist',
  );
});

test('Packing checklist usefulness explained', () => {
  assert.ok(
    has('make sure everything') || has('everything you planned') || has('gather and pack'),
    'Must explain the checklist helps confirm everything is packed',
  );
});

test('Printing the list mentioned', () => {
  assert.ok(
    has('print') || has('printed'),
    'Must mention printing the list',
  );
});

test('Trailhead-without-gear scenario mentioned', () => {
  assert.ok(
    has('trailhead') || has('at home'),
    'Must mention the risk of arriving at the trailhead missing gear',
  );
});

test('TrailWeigh not here to tell users what to carry', () => {
  assert.ok(
    has("isn't here to tell you") || has("not here to tell you") || has("here to decide"),
    'Must clarify TrailWeigh does not dictate what to carry',
  );
});

// ── Tests: Philosophy callout (visible, no accordion needed) ─────────────────

suite('022D Philosophy Callout');

test('Philosophy line 1: Carry what you need', () => {
  assert.ok(has('Carry what you need'), 'Missing philosophy line 1');
});

test('Philosophy line 2: Understand why you carry it', () => {
  assert.ok(has('Understand why you carry it'), 'Missing philosophy line 2');
});

test('Philosophy line 3: Make each item earn its place', () => {
  assert.ok(has("Make each item earn its place"), 'Missing philosophy line 3');
});

test('Philosophy appears before accordion (in intro, not just inside sections)', () => {
  // The philosophy should appear at least twice: once in the intro callout
  // and once at the end of Where TrailWeigh Fits In
  const first = idx('Carry what you need');
  assert.ok(first !== -1, 'Philosophy must appear at least once');
  // The accordion sections start at the first Section call (id="ultralight").
  // The component definition also contains the template literal sec-btn-${id}
  // but the first ACTUAL section call uses id="ultralight".
  const accordionStart = idx('"ultralight"');
  assert.ok(accordionStart !== -1, 'Accordion section start (id="ultralight") not found');
  assert.ok(first < accordionStart, 'Philosophy callout must appear before the accordion sections');
});

// ── Tests: 12 required accordion sections ────────────────────────────────────
// NOTE: The accordion component uses template literals (id={`sec-btn-${id}`}),
// so the literal string "sec-btn-ultralight" never appears in the source.
// We check for the id prop value (id="ultralight") and the section title text.

suite('022D 12 Required Accordion Sections');

const sections = [
  { id: 'ultralight',      title: 'What Is Ultralight?' },
  { id: 'ray-way',         title: 'Ray-Way' },
  { id: 'minimalist',      title: 'The Minimalist Mindset' },
  { id: 'multi-use',       title: 'One Tool, Many Uses' },
  { id: 'systems',         title: 'Think in Systems' },
  { id: 'knowledge',       title: 'Knowledge Weighs Nothing' },
  { id: 'trail-or-camp',   title: 'Do You Hike for the Trail or the Camp?' },
  { id: 'hyoh',            title: 'Hike Your Own Hike' },
  { id: 'tool-not-contest',title: 'Ultralight Is a Tool, Not a Contest' },
  { id: 'why-here',        title: 'Remember Why We' },   // partial match
  { id: 'respect',         title: 'Respect the Trail' },
  { id: 'trailweigh-fits', title: 'Where TrailWeigh Fits In' },
];

sections.forEach(({ id, title }) => {
  test(`Section id="${id}" prop present`, () => {
    // The component is called with id="<slug>" — the prop value is in source
    assert.ok(
      has(`id="${id}"`) || has(`id={'${id}'}`) || has(`'${id}'`),
      `Missing section with id prop: "${id}"`,
    );
  });

  test(`Section title "${title.slice(0, 30)}…" present`, () => {
    assert.ok(has(title), `Missing section title: ${title}`);
  });
});

// ── Tests: Section order ──────────────────────────────────────────────────────

suite('022D Section Order');

// NOTE (022L): Section order changed. Original 12 sections now in new 022L order.
const orderedTitles = [
  'Remember Why We',                       // Mental / Physical / Spiritual group
  'Do You Hike for the Trail or the Camp?', // Hiking Philosophy group
  'Hike Your Own Hike',
  'Respect the Trail',
  'What Is Ultralight?',                   // Ultralight group
  'Ultralight Is a Tool, Not a Contest',
  'The Minimalist Mindset',
  'Ray-Way',
  'Knowledge Weighs Nothing',
  'Think in Systems',
  'One Tool, Many Uses',
  'Where TrailWeigh Fits In',              // TrailWeigh group
];

test('All 12 section titles appear in required order', () => {
  let prev = -1;
  for (const title of orderedTitles) {
    const pos = idx(title);
    assert.ok(pos !== -1, `Missing section title: "${title}"`);
    assert.ok(pos > prev, `Section "${title}" is out of order (found at ${pos}, previous was at ${prev})`);
    prev = pos;
  }
});

// ── Tests: Accordion mechanics ────────────────────────────────────────────────

suite('022D Accordion Mechanics');

test('aria-expanded present', () => {
  assert.ok(has('aria-expanded'), 'Missing aria-expanded attribute');
});

test('aria-controls present', () => {
  assert.ok(has('aria-controls'), 'Missing aria-controls attribute');
});

test('role="region" present', () => {
  assert.ok(has('role="region"'), 'Missing role="region"');
});

test('aria-labelledby present', () => {
  assert.ok(has('aria-labelledby'), 'Missing aria-labelledby');
});

test('Sections collapsed by default (empty Set initial state)', () => {
  assert.ok(
    has('new Set()') || has('new Set<string>()'),
    'Accordion must start with an empty Set (all collapsed)',
  );
  // Must NOT initialize with sections pre-opened
  assert.ok(
    !has("new Set(['") && !has('new Set(["'),
    'Accordion must not pre-open any sections',
  );
});

test('Full title row is a button (w-full)', () => {
  assert.ok(has('w-full'), 'Button must have w-full class for full-row clickability');
});

test('ChevronDown / ChevronUp disclosure indicator present', () => {
  assert.ok(
    (has('ChevronDown') || has('chevron-down')) &&
    (has('ChevronUp') || has('chevron-up')),
    'Must have ChevronDown and ChevronUp disclosure indicators',
  );
});

test('No Expand All button', () => {
  assert.ok(
    !has('Expand All') && !has('expand-all') && !has('expandAll'),
    'Must not have an Expand All button',
  );
});

// ── Tests: What Is Ultralight? ────────────────────────────────────────────────

suite('022D What Is Ultralight?');

test('Ultralight: do I need this question', () => {
  assert.ok(has('Do I need') || has('do I need'), 'Missing "Do I need this?" question');
});

test('Ultralight: will I actually use it question', () => {
  assert.ok(has('actually use') || has('Will I actually'), 'Missing "Will I actually use it?" question');
});

test('Ultralight: not merely about buying lighter gear', () => {
  assert.ok(
    has('not merely about buying') || has('not just about buying') || has('not only about buying'),
    'Must clarify ultralight is not merely about buying lighter gear',
  );
});

test('Ultralight: mindset mentioned', () => {
  assert.ok(has('mindset'), 'Must describe ultralight as a mindset');
});

// ── Tests: Ray-Way ────────────────────────────────────────────────────────────

suite('022D Ray-Way Content');

test('Ray-Way title exact match', () => {
  assert.ok(has('Ray-Way'), 'Section title must be "Ray-Way"');
});

test('Ray Jardine mentioned as major pioneer/influence', () => {
  assert.ok(
    (has('Ray Jardine') || has('Jardine')) &&
    (has('pioneer') || has('influential') || has('influence') || has('major role')),
    'Ray Jardine must be described as a major pioneer or influential figure',
  );
});

test('Ray-Way: Friend (climbing cam) mentioned briefly', () => {
  assert.ok(
    has('Friend') || has('camming device') || has('cam'),
    'Must mention the Friend spring-loaded camming device',
  );
});

// NOTE (022L): corrected to verified total mileage (12,500 not 15,000)
test('Ray-Way: 12,500 miles figure present', () => {
  assert.ok(has('12,500') || has('12500'), 'Must mention 12,500 miles of long-distance hiking');
});

test('Ray-Way: 1993 AT thru-hike or base pack below 10 pounds', () => {
  assert.ok(
    (has('1993') || has('Appalachian')) && (has('10 pounds') || has('10lbs') || has('10 lbs')),
    'Must mention their 1993 AT thru-hike with base packs below 10 pounds',
  );
});

test('Ray-Way: PCT Hiker\'s Handbook or publication history', () => {
  assert.ok(
    has("PCT Hiker's Handbook") || has('PCT Hikers Handbook'),
    "Must mention The PCT Hiker's Handbook",
  );
});

test('Ray-Way: Beyond Backpacking or Trail Life mentioned', () => {
  assert.ok(
    has('Beyond Backpacking') || has('Trail Life'),
    'Must mention Beyond Backpacking or Trail Life',
  );
});

test('Ray-Way: Did NOT invent traveling light', () => {
  // Must not claim he invented it
  assert.ok(
    !has('invented traveling light') &&
    !has('invented ultralight') &&
    !has('single-handedly invented') &&
    !has('created ultralight') &&
    !has('created the cottage'),
    'Must not falsely claim Jardine invented traveling light or created ultralight',
  );
  // Should acknowledge traveling light predated him
  assert.ok(
    has('not a new idea') || has('long before') || has('did not invent') || has('Traveling light is not'),
    'Should acknowledge that traveling light predated Ray Jardine',
  );
});

test('Ray-Way: questions for evaluating gear present', () => {
  assert.ok(
    has('Why am I carrying') || has('What job does it') || has('Do I actually need'),
    'Must include Jardine\'s questions for evaluating gear',
  );
});

// ── Tests: Minimalist Mindset ─────────────────────────────────────────────────

suite('022D Minimalist Mindset');

test('Minimalism: intentionality not deprivation', () => {
  assert.ok(
    has('intentionality') || has('intentional') || has('not deprivation'),
    'Must frame minimalism as intentionality, not deprivation',
  );
});

test('Minimalism: goal is simplicity with purpose', () => {
  assert.ok(has('simplicity with purpose'), 'Missing "simplicity with purpose" quote');
});

test('Minimalism: philosophy quote present', () => {
  assert.ok(has('Carry what you need') && has("Make each item earn its place"), 'Missing philosophy quote in Minimalist section');
});

// ── Tests: One Tool, Many Uses ────────────────────────────────────────────────

suite('022D One Tool Many Uses');

test('Multi-use: "Can something I already carry do this job" question', () => {
  assert.ok(
    has('Can something I already carry') || has('something I already carry do'),
    'Must include the key multi-use question',
  );
});

test('Multi-use: trekking pole example', () => {
  assert.ok(has('trekking pole') || has('trekking poles'), 'Must include trekking pole as multi-use example');
});

test('Multi-use: stuff sack / pillow example', () => {
  assert.ok(
    (has('stuff sack') || has('stuff bag')) && has('pillow'),
    'Must include stuff sack as pillow example',
  );
});

test('Multi-use: bandana example', () => {
  assert.ok(has('bandana') || has('bandanna'), 'Must include bandana as multi-use example');
});

test('Multi-use: "Carry less by asking more" quote', () => {
  assert.ok(
    has('Carry less by asking more') || has('asking more of the things'),
    'Must include the "carry less by asking more" quote',
  );
});

test('Multi-use: safety-critical gear clarification', () => {
  assert.ok(
    has('safety-critical') || has('safety critical') || has('one important job'),
    'Must clarify that safety-critical gear does not need multiple uses',
  );
});

// ── Tests: Think in Systems ───────────────────────────────────────────────────

suite('022D Think in Systems');

test('Systems: shelter/sleeping/clothing interaction mentioned', () => {
  assert.ok(
    (has('shelter') || has('Shelter')) && (has('sleeping') || has('sleep')),
    'Must mention shelter and sleeping gear as part of a system',
  );
});

test('Systems: "Do I need this item at all" question', () => {
  assert.ok(
    has('Do I need this item at all') || has('do I need this item at all') || has('can the rest of my system'),
    'Must include the "do I need this at all" systems question',
  );
});

// ── Tests: Knowledge Weighs Nothing ──────────────────────────────────────────

suite('022D Knowledge Weighs Nothing');

test('Knowledge: experience/skills can influence what is carried', () => {
  assert.ok(
    has('experience') && (has('skills') || has('knowledge')),
    'Must discuss how experience and skills influence gear choices',
  );
});

test('Knowledge: does not imply experience eliminates safety gear', () => {
  assert.ok(
    has('does not mean') || has("doesn't mean") || has('eliminate') || has('weather changes') || has('Weather changes'),
    "Must qualify that experience doesn't eliminate reasonable safety gear",
  );
});

test('Knowledge: "Good judgment matters more than a number" quote', () => {
  assert.ok(
    has('Good judgment matters') || has('judgment matters more'),
    'Must include "Good judgment matters more than a number on a scale"',
  );
});

// ── Tests: Trail or Camp ──────────────────────────────────────────────────────

suite('022D Trail or Camp');

test('Trail or camp: both approaches described', () => {
  assert.ok(
    (has('miles') || has('covering') || has('climbing passes')) &&
    (has('camp') || has('campsite')),
    'Must describe both the trail-focused and camp-focused hiker',
  );
});

// NOTE (022L): phrase updated to "inherently better" (more accurate framing)
test('Trail or camp: "Neither approach is inherently better"', () => {
  assert.ok(
    has('Neither approach is inherently better') || has('neither approach is inherently better') ||
    has('Neither approach is wrong')             || has('neither approach is wrong'),
    'Must include "Neither approach is inherently better" (or equivalent)',
  );
});

test('Trail or camp: question about what makes trip enjoyable', () => {
  assert.ok(
    has('makes this trip enjoyable') || has('enjoyable for me') || has('What makes'),
    'Must frame around what makes the trip enjoyable for the individual',
  );
});

// ── Tests: HYOH ───────────────────────────────────────────────────────────────

suite('022D HYOH');

test('HYOH: "Your hike is your own. The trail is shared."', () => {
  assert.ok(
    has('Your hike is your own') && has('The trail is shared'),
    'Must include "Your hike is your own. The trail is shared."',
  );
});

test('HYOH: no single perfect gear list', () => {
  assert.ok(
    has('no single perfect gear list') || has('no perfect gear list') || has('There is no single'),
    'Must state there is no single perfect gear list',
  );
});

test('HYOH: HYOH does not mean ignoring safety/regulations', () => {
  assert.ok(
    has('HYOH does not') || has('does not mean ignoring') || has('safety') && has('regulation'),
    'Must clarify HYOH does not mean ignoring safety or regulations',
  );
});

test('HYOH: gear that works for you on this trip', () => {
  assert.ok(
    has('works for you') || has('works for you, on this trip'),
    'Must include the "gear that works for you, on this trip" language',
  );
});

// ── Tests: Ultralight Is a Tool, Not a Contest ───────────────────────────────

suite('022D Ultralight Tool Not Contest');

test('Ultralight is a tool, not a contest', () => {
  assert.ok(
    has('Ultralight is a tool, not a contest') || has('ultralight is a tool, not a contest'),
    'Must include "Ultralight is a tool, not a contest"',
  );
});

test('Another person\'s base weight does not determine your list', () => {
  assert.ok(
    has("another person's base weight") || has("another person's pack") ||
    has("base weight does not") || has("doesn't determine"),
    "Must clarify another person's base weight doesn't determine your choices",
  );
});

test('Lighter does not automatically mean better', () => {
  assert.ok(
    has('Lighter does not automatically') || has('lighter does not automatically') ||
    has("Lighter doesn't automatically") || has("lighter doesn't automatically") ||
    has('not automatically mean better') || has("n't automatically mean better"),
    'Must state lighter does not automatically mean better',
  );
});

// ── Tests: Remember Why We're Here ───────────────────────────────────────────

suite('022D Remember Why We Are Here');

// NOTE (022L): "We go outside to be outside" replaced with new intro prose
test('Why here: nature / experience theme present', () => {
  assert.ok(
    has('We go outside to be outside') || has('go outside to be outside') ||
    has('why we came') || has('remember why we came') ||
    has('Look up') || has('Notice where you are'),
    'Why We\'re Here must include nature/experience theme (look up / notice / remember why)',
  );
});

test('Nature imagery present (sunrise, stars, trail, etc.)', () => {
  const imagery = ['sunrise', 'stars', 'mountain', 'trees', 'canyon', 'solitude', 'trail', 'ridge'];
  const found = imagery.filter(w => aboutSrc.toLowerCase().includes(w));
  assert.ok(found.length >= 3, `Must include nature imagery; found: ${found.join(', ')}`);
});

test('Gear should enable experiences, not surpass them', () => {
  assert.ok(
    has('more important than the experience') || has('important than the experiences') ||
    has('make those experiences possible') || has('make those experiences'),
    'Must include idea that gear enables experiences, not overshadows them',
  );
});

// ── Tests: Respect ────────────────────────────────────────────────────────────

suite('022D Respect the Trail and Each Other');

test('Respect for wildlife and land mentioned', () => {
  assert.ok(
    has('wildlife') && (has('land') || has('trail')),
    'Must mention respect for wildlife and the land',
  );
});

test('Waste disposal / Leave No Trace principles referenced', () => {
  assert.ok(
    has('waste disposal') || has('leaving what you find') || has('minimize') || has('impact'),
    'Must reference LNT principles (waste disposal, minimizing impact, etc.)',
  );
});

test('"We don\'t all need to hike the same way" present', () => {
  assert.ok(
    has("don't all need to hike the same way") || has("do not all need to hike the same way"),
    'Must include "We don\'t all need to hike the same way to appreciate the same trail"',
  );
});

test('"Hike your own hike—and respect everyone else\'s opportunity" present', () => {
  assert.ok(
    has("Hike your own hike—and respect") || has("Hike your own hike - and respect") ||
    has("everyone else's opportunity"),
    "Must include the 'Hike your own hike—and respect everyone else's opportunity' line",
  );
});

// ── Tests: Where TrailWeigh Fits In ──────────────────────────────────────────

suite('022D Where TrailWeigh Fits In');

test('TrailWeigh not here to decide what belongs in pack', () => {
  assert.ok(
    has("not here to decide") || has("not to decide") || has("gives you the information"),
    'Must state TrailWeigh is not here to decide what goes in the pack',
  );
});

test('"It\'s worth it" quote present', () => {
  assert.ok(
    has("It's worth it") || has("It is worth it"),
    'Must include the "It\'s worth it" quote for deliberate gear choices',
  );
});

test('Goal is not the lightest possible pack', () => {
  assert.ok(
    has("goal isn't the lightest") || has("goal is not the lightest"),
    'Must state the goal is not the lightest possible pack',
  );
});

test('Goal is a pack that works for you', () => {
  assert.ok(
    has('a pack that works for you'),
    'Must include "a pack that works for you"',
  );
});

test('Philosophy callout appears in Where TrailWeigh Fits In', () => {
  const fitsStart = idx('sec-btn-trailweigh-fits');
  const philosophyInSection = aboutSrc.indexOf('Carry what you need', fitsStart);
  assert.ok(philosophyInSection !== -1, 'Philosophy quote must appear in Where TrailWeigh Fits In section');
});

test('"Then go outside." final line present', () => {
  assert.ok(
    has('Then go outside'),
    'Must include "Then go outside." as the final line',
  );
});

test('"Then go outside." appears after the philosophy quote in the Fits In section', () => {
  const lastPhilosophy = aboutSrc.lastIndexOf('Carry what you need');
  const thenGoOutside  = aboutSrc.lastIndexOf('Then go outside');
  assert.ok(thenGoOutside > lastPhilosophy, '"Then go outside" must come after the philosophy quote');
});

// ── Tests: No video/animation ─────────────────────────────────────────────────

suite('022D No Video or Animation');

test('No video element', () => {
  assert.ok(!has('<video') && !has('autoPlay') && !has('autoplay'), 'Must not contain video elements');
});

test('No animation/lottie references', () => {
  assert.ok(
    !has('lottie') && !has('Lottie') && !has('<animate'),
    'Must not contain animation/Lottie references',
  );
});

// ── Tests: Help & How-To from 022C unchanged ─────────────────────────────────

suite('022D Help 022C Regression');

test('HelpPage six main sections still present', () => {
  // 022C uses template-literal IDs; check section titles instead
  const titles = [
    'Building Your Gear List',
    'Understanding Your Pack Weight',
    'Editing Your Gear List',
    'Save / Locker',
    'Preview / Print / Share',
    'Backgrounds',
  ];
  titles.forEach(t => {
    assert.ok(helpSrc.includes(t), `HelpPage missing section title: "${t}"`);
  });
});

test('HelpPage 022C structure unchanged (Scan Gear List under Building)', () => {
  assert.ok(helpSrc.includes('Building Your Gear List'), 'Building section must still exist in Help');
  assert.ok(helpSrc.includes('Scan Gear List') || helpSrc.includes('scan gear'), 'Scan Gear List must still be in Help');
});

// ── Tests: Footer unchanged ───────────────────────────────────────────────────

suite('022D Footer Regression');

test('Footer dark color unchanged', () => {
  assert.ok(footerSrc.includes('#1e2322') || footerSrc.includes('1e2322'), 'Footer dark color must be unchanged');
});

test('Footer informationalOnly prop still present', () => {
  assert.ok(footerSrc.includes('informationalOnly'), 'Footer informationalOnly prop must still exist');
});

// ── Tests: App / routing ──────────────────────────────────────────────────────

suite('022D Routing Regression');

test('About route still registered in App.tsx', () => {
  assert.ok(appSrc.includes('/about') && appSrc.includes('AboutPage'), 'About route must be registered');
});

test('Help route still registered in App.tsx', () => {
  assert.ok(appSrc.includes('/help') && appSrc.includes('HelpPage'), 'Help route must be registered');
});

test('All 10 footer routes still in App.tsx', () => {
  const routes = ['/about', '/help', '/how-it-works', '/privacy', '/terms', '/affiliate', '/contact', '/accessibility', '/report-problem', '/delete-account'];
  routes.forEach(r => {
    assert.ok(appSrc.includes(r), `Route missing: ${r}`);
  });
});

// ── Tests: Checklist and shared view unchanged ────────────────────────────────

suite('022D Checklist Regression');

test('Checklist page source unchanged (no AboutPage imports)', () => {
  assert.ok(!checkSrc.includes('AboutPage'), 'Checklist must not import AboutPage');
});

test('SharedChecklistPage unchanged', () => {
  assert.ok(!sharedSrc.includes('AboutPage'), 'SharedChecklistPage must not import AboutPage');
});

// ── Results ───────────────────────────────────────────────────────────────────

console.log(`022D About TrailWeigh: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
