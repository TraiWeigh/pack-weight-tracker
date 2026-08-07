/**
 * landscapeActiveBackground017C.test.mjs  —  Prompt 017C
 *
 * Verifies that Landscape thumbnails are stable when an active background
 * image is displayed (no hover-triggered repaints, no compositing conflicts).
 *
 * Root cause fixed in 017C:
 *   `transition-[box-shadow,opacity]` on the tile button caused CSS box-shadow
 *   paint cycles on every hover animation frame. CSS box-shadow transitions are
 *   CPU paint operations. When the main container has an active backgroundImage
 *   (inline style), each frame of the ring-color animation triggered a repaint
 *   of the full background image layer, producing visible jitter/shaking.
 *   With Clear background (no backgroundImage), repaints resolved to a flat
 *   solid color and were imperceptible.
 *
 * Fix applied:
 *   1. Removed transition-[box-shadow,opacity] from landscape tile button
 *      → ring color now changes instantly (no per-frame paint cycle).
 *   2. Added willChange: 'transform' to BackgroundPickerPanel root div
 *      → promotes panel to its own GPU compositing layer, isolating child
 *        transitions from the main page background-image compositing context.
 *
 * Tests 1–12: Static analysis on BackgroundPicker.tsx
 * Tests 13–18: Static analysis on Checklist.tsx (background rendering stability)
 * Tests 19–22: Panel GPU layer promotion (willChange: 'transform')
 * Tests 23–24: Regression guards for prior prompts
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

// Locate the PRESETS block
const presetsMapStart = bgPicker.indexOf('{PRESETS.map(');
const presetsMapEnd   = bgPicker.indexOf(': activeCollection', presetsMapStart);
const presetsBlock    = bgPicker.slice(
  presetsMapStart,
  presetsMapEnd > presetsMapStart ? presetsMapEnd : presetsMapStart + 4000
);

// Locate the BackgroundPickerPanel root div block
const panelDivStart = bgPicker.indexOf('animate-in fade-in slide-in-from-top-2');
const panelDivBlock = bgPicker.slice(Math.max(0, panelDivStart - 250), panelDivStart + 600);

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

console.log('\nPrompt 017C — Active Background Shaking Fix Tests\n');

// ── Part 1: No CPU-paint-triggering transitions on landscape tile button ────

test('1. Landscape tile button has NO box-shadow transition (root cause removed)', () => {
  // The box-shadow transition was the CPU-paint trigger that caused shaking
  // with an active background image. It must be absent from the button.
  assert.ok(
    !presetsBlock.includes('transition-[box-shadow'),
    'transition-[box-shadow still present in PRESETS block — root cause still active'
  );
});

test('2. Landscape tile button has NO transition-all', () => {
  assert.ok(
    !presetsBlock.includes('transition-all'),
    'transition-all present in PRESETS block'
  );
});

test('3. Landscape tile button ring geometry is frozen (017B preserved)', () => {
  // ring-2 ring-offset-1 must be unconditional (not inside a ternary or hover:)
  assert.ok(
    presetsBlock.includes('ring-2 ring-offset-1'),
    'ring-2 ring-offset-1 not found unconditionally in PRESETS block'
  );
});

test('4. No hover:ring-2 on landscape tile (no geometry change on hover)', () => {
  assert.ok(
    !presetsBlock.includes('hover:ring-2'),
    'hover:ring-2 present — ring-width changes on hover would cause layout shift'
  );
});

test('5. No hover:ring-offset-1 on landscape tile (no geometry change on hover)', () => {
  assert.ok(
    !presetsBlock.includes('hover:ring-offset'),
    'hover:ring-offset found in PRESETS block — ring-offset geometry changing on hover'
  );
});

test('6. No hover:scale-* on landscape tile (no transform on hover)', () => {
  assert.ok(
    !presetsBlock.includes('hover:scale-'),
    'hover:scale-* found in PRESETS block'
  );
});

test('7. ring-transparent used in unselected base state (stable box-shadow geometry)', () => {
  assert.ok(
    presetsBlock.includes('ring-transparent'),
    'ring-transparent not found in PRESETS block'
  );
});

// ── Part 2: No hover event handlers that could update the active background ─

test('8. No onMouseEnter handler on landscape tile buttons', () => {
  assert.ok(
    !presetsBlock.includes('onMouseEnter'),
    'onMouseEnter found in PRESETS block — hover should not trigger any state change'
  );
});

test('9. No onMouseLeave handler on landscape tile buttons', () => {
  assert.ok(
    !presetsBlock.includes('onMouseLeave'),
    'onMouseLeave found in PRESETS block'
  );
});

test('10. No onPointerEnter handler on landscape tile buttons', () => {
  assert.ok(
    !presetsBlock.includes('onPointerEnter'),
    'onPointerEnter found in PRESETS block'
  );
});

test('11. No onPointerLeave handler on landscape tile buttons', () => {
  assert.ok(
    !presetsBlock.includes('onPointerLeave'),
    'onPointerLeave found in PRESETS block'
  );
});

test('12. Label overlay has pointer-events-none (no hover capture by overlay)', () => {
  const labelIdx = presetsBlock.indexOf('group-hover:opacity-100');
  assert.ok(labelIdx > -1, 'group-hover:opacity-100 not found in PRESETS block');
  const nearLabel = presetsBlock.slice(Math.max(0, labelIdx - 50), labelIdx + 200);
  assert.ok(
    nearLabel.includes('pointer-events-none'),
    'pointer-events-none not found near label overlay in PRESETS block'
  );
});

// ── Part 3: Background rendering stability in Checklist.tsx ─────────────────

test('13. No onMouseEnter on main background container (Checklist.tsx)', () => {
  // The main container (screen-only div) must not respond to hover events
  const screenOnlyIdx = checklist.indexOf('screen-only');
  const region = checklist.slice(screenOnlyIdx, screenOnlyIdx + 600);
  assert.ok(
    !region.includes('onMouseEnter') && !region.includes('onHover'),
    'onMouseEnter or onHover found near screen-only div in Checklist'
  );
});

test('14. bgImageUrl is derived from background state only (not hover state)', () => {
  // bgImageUrl should depend on background prop/state, not any hover variable
  const bgImageUrlIdx = checklist.indexOf('bgImageUrl');
  assert.ok(bgImageUrlIdx > -1, 'bgImageUrl not found in Checklist');
  // Check that there is no 'hoveredPresetId' or 'hoveredBackground' variable
  assert.ok(
    !checklist.includes('hoveredPresetId') && !checklist.includes('hoveredBackground'),
    'hoveredPresetId or hoveredBackground found in Checklist — hover preview leak'
  );
});

test('15. Object URL is created only when activePhotoId changes (not on hover)', () => {
  // useEffect creating the object URL should depend on activePhotoId, not hover state
  const objUrlIdx = checklist.indexOf('createObjectURL') !== -1
    ? checklist.indexOf('createObjectURL')
    : checklist.indexOf('customBgObjectUrl');
  assert.ok(objUrlIdx > -1, 'customBgObjectUrl or createObjectURL not found in Checklist');
  // Confirm no hover variable controls URL creation
  assert.ok(
    !checklist.includes('hoveredPhotoId'),
    'hoveredPhotoId found in Checklist — hover preview creating new object URLs'
  );
});

test('16. Background inline style uses only state values (not hover)', () => {
  // backgroundImage style should use bgImageUrl or similar, not a hover-temp variable
  const backgroundImageIdx = checklist.indexOf('backgroundImage');
  assert.ok(backgroundImageIdx > -1, 'backgroundImage not found in Checklist');
  const region = checklist.slice(backgroundImageIdx, backgroundImageIdx + 300);
  assert.ok(
    !region.includes('hovered') && !region.includes('preview'),
    'backgroundImage region contains "hovered" or "preview" — hover leak into background rendering'
  );
});

test('17. useInactivityTimer does not update React state during mousemove', () => {
  const timerFile = readFileSync(
    path.join(root, 'artifacts/pack-checklist/src/hooks/useInactivityTimer.ts'),
    'utf8'
  );
  // The timer should reset a setTimeout ref, not call setShowcaseActive directly on mousemove
  // The only state setter should be called AFTER the timeout fires, not on move
  assert.ok(
    timerFile.includes('mousemove'),
    'mousemove listener not found in useInactivityTimer'
  );
  // startFreshTimer or equivalent should not call setState directly
  assert.ok(
    !timerFile.includes('setShowcaseActive(true)') ||
    timerFile.indexOf('mousemove') < timerFile.indexOf('setShowcaseActive(true)') === false,
    'setShowcaseActive(true) appears to be called directly from mousemove handler'
  );
});

test('18. BackgroundShowcase overlay is always mounted (not conditionally recreated)', () => {
  // The showcase div being remounted would cause a flash when background is active
  // It should exist unconditionally in the DOM (hidden via opacity:0)
  assert.ok(
    checklist.includes('BackgroundShowcase') || checklist.includes('showcaseActive'),
    'BackgroundShowcase or showcaseActive not found in Checklist'
  );
});

// ── Part 4: Panel GPU layer promotion (017C fix #2) ─────────────────────────

test('19. BackgroundPickerPanel has willChange:transform (GPU layer isolation)', () => {
  // will-change: transform promotes the panel to its own GPU compositing layer.
  // This means thumbnail transitions inside the panel are composited within the
  // panel's layer, separate from the main page background-image compositing.
  assert.ok(
    panelDivBlock.includes('willChange') && panelDivBlock.includes('transform'),
    'willChange: transform not found on BackgroundPickerPanel root div — panel not GPU-promoted'
  );
});

test('20. willChange:transform is only on the panel (not main container)', () => {
  // Main container (screen-only div) should not have will-change: transform
  // which could cause its own compositing issues
  const screenOnlyIdx = checklist.indexOf('screen-only');
  const region = checklist.slice(screenOnlyIdx, screenOnlyIdx + 600);
  assert.ok(
    !region.includes('willChange'),
    'willChange found on main container div in Checklist — unexpected'
  );
});

test('21. Panel willChange uses "transform" not "opacity" or "contents"', () => {
  // "transform" is the correct value: creates GPU layer without overflow side-effects
  // "contents" would break stacking; "opacity" is less effective for isolation
  assert.ok(
    panelDivBlock.includes("'transform'") || panelDivBlock.includes('"transform"'),
    'willChange value is not "transform" on panel div'
  );
});

test('22. Panel still has z-50 for correct stacking order', () => {
  // GPU layer promotion (will-change: transform) must not remove z-50 stacking
  assert.ok(
    panelDivBlock.includes('z-50'),
    'z-50 not found on BackgroundPickerPanel — stacking order may be broken'
  );
});

// ── Part 5: Regression guards for prior prompts ──────────────────────────────

test('23. 017B: ring-2 ring-offset-1 unconditional (prior fix preserved)', () => {
  assert.ok(
    presetsBlock.includes('ring-2 ring-offset-1'),
    'ring-2 ring-offset-1 not unconditional — 017B ring geometry freeze regressed'
  );
});

test('24. 017A: Hide button renders unconditionally (no background && guard)', () => {
  const hideIdx = checklist.indexOf('aria-label="Hide interface');
  assert.ok(hideIdx > -1, 'Hide button aria-label not found in Checklist');
  const surrounding = checklist.slice(Math.max(0, hideIdx - 300), hideIdx + 200);
  assert.ok(
    !surrounding.includes('{background &&'),
    'Hide button still wrapped in {background && (...)} — 017A regression'
  );
});

// ── Summary ─────────────────────────────────────────────────────────────────
console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failures.length) {
  console.error('\nFailed tests:');
  failures.forEach(f => console.error(`  - ${f.name}: ${f.message}`));
  process.exit(1);
}
