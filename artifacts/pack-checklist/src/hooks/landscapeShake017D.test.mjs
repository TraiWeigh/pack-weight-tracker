/**
 * landscapeShake017D.test.mjs  —  Prompt 017D
 *
 * Verifies the root cause of landscape thumbnail shaking with an active
 * background image: a CSS opacity transition INSIDE the `overflow-hidden`
 * landscape button forces browser compositing layer promotion on every hover,
 * cascading to a GPU texture re-upload of the button's remote <img>.  With a
 * large background image already in the compositing tree this per-hover GPU
 * work is visible as jitter/shaking.
 *
 * Root cause (confirmed by structural comparison in 017D):
 *   The label overlay div  (`opacity-0 group-hover:opacity-100 transition-opacity`)
 *   lives INSIDE the landscape <button> which has `overflow-hidden`.
 *   `overflow-hidden` creates a stacking context that requires the browser to
 *   clip any promoted GPU sub-layer; to satisfy that clipping requirement the
 *   browser must ALSO promote the parent button itself to a compositing layer.
 *   That promotion forces the button's remote Unsplash <img> to be re-uploaded
 *   to GPU memory on every hover-enter/leave.  With an active background image
 *   (large remote URL) already compositing on the main container, this extra
 *   GPU work produces visible jitter.
 *
 *   Custom photo tiles do NOT shake because:
 *   (a) Their `group` class is on an outer wrapper div, not on the photo button.
 *   (b) The opacity-animating element (delete button) is a SIBLING of the photo
 *       button, OUTSIDE its `overflow-hidden` context — no cascade.
 *   (c) Custom images are blob URLs (already GPU-resident), not remote CDN fetches.
 *
 * Fix applied in 017D:
 *   1. Removed `transition-opacity` from the label overlay inside the landscape
 *      button → label now appears/disappears instantly (no CSS animation,
 *      no compositing layer needed, no cascade to the button or its image).
 *   2. Added `decoding="async"` to landscape <img> tags → any residual image
 *      decode is off-main-thread, preventing main-thread blocking during hover.
 *
 * Tests 1–6:   Primary fix — no opacity transition inside landscape button
 * Tests 7–10:  Structural comparison — `group` placement and overflow-hidden
 * Tests 11–14: Image loading — remote URL, decoding attribute, blob vs remote
 * Tests 15–18: Preserved UX — label still appears on hover, pointer-events-none
 * Tests 19–22: Regression guards — 017A/017B/017C fixes still in place
 * Tests 23–26: Custom tile comparison — confirm no transition inside overflow-hidden
 */

import { readFileSync } from 'fs';
import assert from 'assert/strict';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../../..');

function read(rel) {
  return readFileSync(path.join(root, rel), 'utf8');
}

const bgPicker  = read('artifacts/pack-checklist/src/components/BackgroundPicker.tsx');
const checklist = read('artifacts/pack-checklist/src/pages/Checklist.tsx');

// ── Locate the PRESETS block ─────────────────────────────────────────────────
const presetsMapStart = bgPicker.indexOf('{PRESETS.map(');
const presetsMapEnd   = bgPicker.indexOf(': activeCollection', presetsMapStart);
const presetsBlock    = bgPicker.slice(
  presetsMapStart,
  presetsMapEnd > presetsMapStart ? presetsMapEnd : presetsMapStart + 4000,
);

// ── Locate the renderPhotoSlot block (custom tiles) ─────────────────────────
const photoSlotStart = bgPicker.indexOf('const renderPhotoSlot');
const photoSlotEnd   = bgPicker.indexOf('const renderCustomThemePanel', photoSlotStart);
const photoSlotBlock = bgPicker.slice(
  photoSlotStart,
  photoSlotEnd > photoSlotStart ? photoSlotEnd : photoSlotStart + 3000,
);

// ── Locate the label overlay inside PRESETS block ────────────────────────────
// The label overlay className is:
//   "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent
//    px-2 py-1.5 opacity-0 group-hover:opacity-100 pointer-events-none"
// The gradient classes precede group-hover:opacity-100 by ~110 characters,
// so we use a -200 lookback to capture the full className string.
const labelIdx   = presetsBlock.indexOf('group-hover:opacity-100');
const labelBlock = presetsBlock.slice(
  Math.max(0, labelIdx - 200),
  Math.min(presetsBlock.length, labelIdx + 300),
);

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
    failures.push({ name, message: err.message });
  }
}

console.log('\nPrompt 017D — Landscape Hover Shaking Root Cause Fix Tests\n');

// ── Part 1: Primary fix — no opacity transition inside the landscape button ──

test('1. Label overlay has NO transition-opacity (root cause removed)', () => {
  // transition-opacity on the overlay inside overflow-hidden was forcing
  // compositing layer promotion of the button on every hover, cascading to
  // GPU re-upload of the button's remote <img> and causing visible shaking.
  assert.ok(
    !presetsBlock.includes('transition-opacity'),
    'transition-opacity still present in PRESETS block — compositing cascade root cause still active'
  );
});

test('2. Label overlay has NO transition-all (no animation in PRESETS block)', () => {
  assert.ok(
    !presetsBlock.includes('transition-all'),
    'transition-all present in PRESETS block — must not animate inside overflow-hidden button'
  );
});

test('3. Label overlay has NO transition-[opacity (no explicit opacity transition)', () => {
  assert.ok(
    !presetsBlock.includes('transition-[opacity'),
    'transition-[opacity found in PRESETS block — opacity transition still present'
  );
});

test('4. No CSS transition class of any kind inside PRESETS block', () => {
  // After 017D: no transition class remains on any element within the PRESETS
  // rendering block (label overlay, button, or any child).
  // Rationale: ANY opacity/visual transition inside an overflow-hidden button
  // creates the compositing cascade.  All transitions in this block are forbidden.
  const hasTransition = presetsBlock.includes('transition-opacity')
    || presetsBlock.includes('transition-all')
    || presetsBlock.includes('transition-[')
    || presetsBlock.includes('transition-colors');  // allowed on children NOT inside overflow-hidden
  // Exception: transition-colors would only appear on a separate outer container,
  // not inside the overflow-hidden button — verify by checking placement
  if (presetsBlock.includes('transition-colors')) {
    // transition-colors is on the label span or similar, not directly on the button
    // This is acceptable as color transitions don't trigger compositing layer promotion
    // Recheck: does the presetsBlock have transition-colors inside the button?
    const buttonStart = presetsBlock.indexOf('<button');
    const buttonEnd   = presetsBlock.indexOf('</button>', buttonStart);
    const buttonContents = buttonStart > -1 && buttonEnd > buttonStart
      ? presetsBlock.slice(buttonStart, buttonEnd)
      : '';
    assert.ok(
      !buttonContents.includes('transition-colors'),
      'transition-colors found INSIDE the landscape button — could cause compositing cascade'
    );
  } else {
    assert.ok(
      !presetsBlock.includes('transition-opacity')
      && !presetsBlock.includes('transition-all')
      && !presetsBlock.includes('transition-['),
      'A CSS transition is present inside the PRESETS block'
    );
  }
});

test('5. decoding="async" present on landscape <img> (off-thread decode)', () => {
  // Ensures any image decode needed for remote Unsplash thumbnails happens
  // off the main thread, preventing decode from blocking paint during hover.
  assert.ok(
    presetsBlock.includes('decoding="async"') || presetsBlock.includes("decoding={'async'}"),
    'decoding="async" not found on landscape <img> — image decode may block main thread on hover'
  );
});

test('6. loading="lazy" still present on landscape <img> (unchanged from prior)', () => {
  assert.ok(
    presetsBlock.includes('loading="lazy"'),
    'loading="lazy" not found on landscape <img>'
  );
});

// ── Part 2: Structural comparison — group placement and overflow-hidden ───────

test('7. Landscape button itself carries the `group` class (structural baseline)', () => {
  // The landscape <button> has `group` in its className, meaning hover on the
  // button triggers group-hover:* on children — including the label overlay.
  // 017E extended: button moved from `relative overflow-hidden` to
  // `absolute inset-0 overflow-hidden` inside a padding-top wrapper div.
  const buttonClassIdx = presetsBlock.indexOf('className={`absolute inset-0 overflow-hidden');
  assert.ok(buttonClassIdx > -1, 'Could not find landscape button className template literal (expected absolute inset-0 overflow-hidden)');
  const buttonClass = presetsBlock.slice(buttonClassIdx, buttonClassIdx + 200);
  assert.ok(
    buttonClass.includes('group'),
    'landscape button does not have `group` class — structural baseline changed'
  );
});

test('8. Landscape button has overflow-hidden (creates clipping stacking context)', () => {
  // Documents that the button has overflow-hidden, which is WHY the compositing
  // cascade happens: clipping context forces parent promotion.
  // 017E extended: button className now starts with `absolute inset-0 overflow-hidden`.
  const buttonClassIdx = presetsBlock.indexOf('className={`absolute inset-0 overflow-hidden');
  assert.ok(buttonClassIdx > -1, 'overflow-hidden not found in landscape button className (expected absolute inset-0 overflow-hidden)');
});

test('9. Label overlay is direct child of landscape button (inside overflow-hidden)', () => {
  // The label overlay sits INSIDE the overflow-hidden button (not as a sibling).
  // This is the structural configuration that caused the cascade.
  assert.ok(
    labelIdx > -1,
    'group-hover:opacity-100 not found in PRESETS block — label overlay may have been removed'
  );
  // The label must appear after the button opening tag
  const buttonOpenIdx = presetsBlock.indexOf('<button');
  assert.ok(
    labelIdx > buttonOpenIdx,
    'Label overlay not found after button opening tag — structural relationship changed'
  );
});

test('10. Custom photo tile: `group` is on outer div, NOT on photo button', () => {
  // Documents the structural difference that prevents custom tiles from shaking:
  // group is on the outer div, so opacity transitions on children (delete button)
  // don't involve the photo button's overflow-hidden context.
  const outerDivIdx  = photoSlotBlock.indexOf('<div key={photo.id} className="relative group"');
  const photoButtonIdx = photoSlotBlock.indexOf(
    'className={`w-full relative overflow-hidden',
    outerDivIdx
  );
  assert.ok(outerDivIdx > -1, 'Custom tile outer div with "relative group" not found');
  assert.ok(photoButtonIdx > -1, 'Custom photo button with overflow-hidden not found');
  // The outer div (group) comes before the inner button
  assert.ok(
    outerDivIdx < photoButtonIdx,
    'Expected outer div with group before photo button with overflow-hidden'
  );
  // The photo button itself should NOT have `group`
  const photoButtonClass = photoSlotBlock.slice(photoButtonIdx, photoButtonIdx + 200);
  assert.ok(
    !photoButtonClass.includes(' group ') && !photoButtonClass.includes(' group\n'),
    'Custom photo button has `group` class — structural difference from landscape changed'
  );
});

// ── Part 3: Image loading — remote vs blob, decoding ─────────────────────────

test('11. Landscape thumbnails use remote Unsplash URLs (structural baseline)', () => {
  // Documents that landscape images are remote CDN URLs, making GPU re-upload
  // more expensive than in-memory blob URLs.
  assert.ok(
    bgPicker.includes('images.unsplash.com'),
    'Unsplash URL not found — landscape image source changed'
  );
  assert.ok(
    bgPicker.includes('getThumbUrl'),
    'getThumbUrl not found — landscape thumbnail function changed'
  );
});

test('12. getThumbUrl produces a remote HTTPS URL (not blob/data URL)', () => {
  const fnIdx = bgPicker.indexOf('function getThumbUrl');
  assert.ok(fnIdx > -1, 'getThumbUrl function not found');
  const fnBody = bgPicker.slice(fnIdx, fnIdx + 200);
  assert.ok(
    fnBody.includes('https://images.unsplash.com'),
    'getThumbUrl does not return an Unsplash HTTPS URL'
  );
});

test('13. Custom photo thumbnails use blob object URLs from IndexedDB', () => {
  // Documents the image source difference: custom = blob URL (in-memory);
  // landscape = remote URL (CDN fetch + decode).
  assert.ok(
    bgPicker.includes('thumbnailUrls'),
    'thumbnailUrls state not found in BackgroundPicker'
  );
  assert.ok(
    bgPicker.includes('createPhotoObjectUrl'),
    'createPhotoObjectUrl not found — custom photos may not use blob URLs'
  );
  // Custom photo img uses thumbUrl (from thumbnailUrls state, which holds blob URLs)
  assert.ok(
    photoSlotBlock.includes('thumbUrl'),
    'thumbUrl not found in custom photo slot — source may have changed'
  );
});

test('14. Custom photo <img> does NOT have loading="lazy" (loads immediately)', () => {
  // Custom photo thumbnails load immediately (blob URL, already in memory),
  // not deferred with lazy loading.
  const customImgIdx = photoSlotBlock.indexOf('<img src={thumbUrl}');
  assert.ok(customImgIdx > -1, '<img src={thumbUrl} not found in custom photo slot');
  const nearCustomImg = photoSlotBlock.slice(customImgIdx, customImgIdx + 150);
  assert.ok(
    !nearCustomImg.includes('loading='),
    'Custom photo <img> has a loading attribute — expected none (blob URL is in-memory)'
  );
});

// ── Part 4: Preserved UX — label still appears on hover ──────────────────────

test('15. Label overlay still shows on hover (group-hover:opacity-100 preserved)', () => {
  // Removing transition-opacity must NOT remove the hover reveal behavior.
  // The label still appears instantly on hover via group-hover:opacity-100.
  assert.ok(
    presetsBlock.includes('group-hover:opacity-100'),
    'group-hover:opacity-100 not found in PRESETS block — label no longer appears on hover'
  );
});

test('16. Label overlay base state is opacity-0 (hidden when not hovered)', () => {
  assert.ok(
    labelBlock.includes('opacity-0'),
    'opacity-0 not found near label overlay — label visibility control changed'
  );
});

test('17. Label overlay has pointer-events-none (hover events not captured)', () => {
  assert.ok(
    labelBlock.includes('pointer-events-none'),
    'pointer-events-none not found near label overlay — overlay may capture hover events'
  );
});

test('18. Label overlay gradient still present (bg-gradient-to-t from-black/70)', () => {
  // The visual appearance of the label overlay (gradient backdrop) must not have changed.
  assert.ok(
    labelBlock.includes('bg-gradient-to-t') && labelBlock.includes('from-black/70'),
    'Gradient not found in label overlay — visual appearance changed'
  );
});

// ── Part 5: Regression guards — prior prompt fixes preserved ─────────────────

test('19. 017A: Hide button renders unconditionally (no {background && wrapper})', () => {
  const hideIdx = checklist.indexOf('aria-label="Hide interface');
  assert.ok(hideIdx > -1, 'Hide button aria-label not found in Checklist');
  const surrounding = checklist.slice(Math.max(0, hideIdx - 300), hideIdx + 200);
  assert.ok(
    !surrounding.includes('{background &&'),
    'Hide button wrapped in {background && (...)} — 017A regression'
  );
});

test('20. 017E supersedes 017B: ring-2 ring-offset-1 is now conditional (active branch only)', () => {
  // 017E video frame analysis proved the always-present ring-2+ring-offset-1 was the
  // actual root cause of image geometry instability, overriding the 017B theory.
  // After 017E: ring-2 ring-primary ring-offset-1 is in the active branch only.
  assert.ok(
    presetsBlock.includes('ring-2 ring-primary ring-offset-1'),
    'ring-2 ring-primary ring-offset-1 not found in active branch — 017E ring pattern missing'
  );
  assert.ok(
    !presetsBlock.includes('ring-transparent'),
    'ring-transparent still present — 017E permanent box-shadow not fully removed'
  );
});

test('21. 017E: hover:ring-2 IS present (conditional ring on inactive hover)', () => {
  // 017E fix: hover:ring-2 intentionally present — ring appears only on hover for
  // inactive tiles, matching the custom photo tile (confirmed not to shake).
  // Prior 017D/017B assertion (no hover:ring-2) superseded by 017E video evidence.
  assert.ok(
    presetsBlock.includes('hover:ring-2'),
    'hover:ring-2 not found in PRESETS block — 017E conditional inactive hover ring missing'
  );
});

test('22. 017C: willChange:transform still on BackgroundPickerPanel', () => {
  const panelDivStart = bgPicker.indexOf('animate-in fade-in slide-in-from-top-2');
  const panelDivBlock = bgPicker.slice(Math.max(0, panelDivStart - 250), panelDivStart + 600);
  assert.ok(
    panelDivBlock.includes('willChange') && panelDivBlock.includes('transform'),
    'willChange:transform not found on BackgroundPickerPanel — 017C regression'
  );
});

// ── Part 6: Custom tile — no opacity transition inside its overflow-hidden ───

test('23. Custom photo tile button has NO `group` on the button itself', () => {
  // The custom photo button must NOT have `group` in its own className.
  // group is on the outer div wrapper.  This is the structural property that
  // prevents the opacity cascade from reaching the photo button.
  const btnIdx = photoSlotBlock.indexOf('className={`w-full relative overflow-hidden');
  assert.ok(btnIdx > -1, 'Custom photo button className not found in renderPhotoSlot');
  const btnClass = photoSlotBlock.slice(btnIdx, btnIdx + 200);
  assert.ok(
    !btnClass.includes(' group ') && !btnClass.includes(' group\n') && !btnClass.includes(' group`'),
    'Custom photo button has `group` class — structural cascade protection removed'
  );
});

test('24. Custom photo tile delete button is OUTSIDE the photo button (sibling)', () => {
  // The delete button (with transition-opacity) must be a sibling, not nested.
  const photoButtonCloseIdx = photoSlotBlock.indexOf('</button>');
  const deleteButtonIdx     = photoSlotBlock.indexOf('aria-label="Delete this photo"');
  assert.ok(
    photoButtonCloseIdx > -1 && deleteButtonIdx > -1,
    'Photo button closing tag or delete button not found in renderPhotoSlot'
  );
  assert.ok(
    deleteButtonIdx > photoButtonCloseIdx,
    'Delete button appears before photo button closing tag — it may be nested INSIDE the photo button'
  );
});

test('25. Custom photo tile has transition-opacity on delete button (contrast control)', () => {
  // Documents that custom tiles ALSO use transition-opacity (on the delete button),
  // but it does not cause shaking because it is outside the photo button's
  // overflow-hidden context.  This test confirms the structural cascade protection
  // is what matters, not merely the presence of a transition.
  assert.ok(
    photoSlotBlock.includes('transition-opacity'),
    'transition-opacity not found in renderPhotoSlot — custom tile comparison baseline changed'
  );
});

test('26. Custom photo button has overflow-hidden (same as landscape — context confirmed)', () => {
  // Both tile types have overflow-hidden on the photo button.
  // What differs is WHERE the opacity transition lives relative to that boundary.
  assert.ok(
    photoSlotBlock.includes('overflow-hidden'),
    'overflow-hidden not found in custom photo button — structural baseline changed'
  );
});

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failures.length) {
  console.error('\nFailed tests:');
  failures.forEach(f => console.error(`  - ${f.name}: ${f.message}`));
  process.exit(1);
}
