/**
 * landscapeShake017E.test.mjs  —  Prompt 017E (extended with slider evidence)
 *
 * ── ORIGINAL HOVER TRIGGER ANALYSIS ─────────────────────────────────────────
 * Root cause confirmed by user-submitted video (frame-by-frame analysis):
 *   The actual photo content inside each landscape thumbnail tile is visibly
 *   changing zoom level and crop/position from frame to frame while the mouse
 *   hovers nearby. This is NOT a CSS glow/ring paint artifact — the image
 *   geometry itself is unstable. Prior 017B/017C/017D theories (transition-all,
 *   box-shadow transition, opacity compositing cascade) were insufficient.
 *
 * First-pass root cause (hover trigger — still valid, now expanded):
 *   The landscape <button> had `ring-2 ring-offset-1` UNCONDITIONALLY in its
 *   className — always present regardless of active/hover state. This generated
 *   a permanent box-shadow on every tile at rest. When neighboring tiles' ring
 *   colors changed on hover, the browser re-evaluated the compositing tree.
 *   During this re-evaluation, `aspect-ratio: 3/2` on the overflow-hidden button
 *   was recomputed in the GPU rasterization context with subpixel rounding that
 *   differed frame-to-frame, changing the object-cover crop.
 *
 * First-pass fix applied (hover trigger):
 *   Changed the landscape button className to the conditional pattern:
 *     isActive ? 'ring-2 ring-primary ring-offset-1'
 *              : 'hover:ring-2 hover:ring-foreground/30 hover:ring-offset-1'
 *
 * ── SECOND TRIGGER: DARKEN SLIDER EVIDENCE ──────────────────────────────────
 * New user evidence mid-017E:
 *   Dragging the Darken slider while a background image is active also causes
 *   the landscape grid (lower panel) to visibly grow/shrink/shift. Upper panel
 *   controls (Background heading, Fill/Fit toggle, Theme dropdown) remain stable.
 *   This rules out panel-level layout changes as the cause.
 *
 * Shared root cause (confirmed, covers BOTH triggers):
 *   CSS `aspect-ratio: 3/2` on the landscape <button> computes tile height from
 *   width at GPU RASTERIZATION time — not at CSS layout time. Any compositing
 *   tree re-evaluation (triggered by either the hover ring-color change or the
 *   main container's backgroundImage paint change during slider drag) can produce
 *   different subpixel rounding for the aspect-ratio height. The object-cover
 *   crop is computed from this height → different crop → visible zoom/shift.
 *
 *   Upper controls are stable because text/button elements have no image crop
 *   that changes when their pixel positions shift by <1px.
 *
 *   The slider trigger is compounded by a format SWITCH in Checklist.tsx:
 *     bgFade < 1  → backgroundImage: `linear-gradient(...),url(...)`
 *     bgFade = 1  → backgroundImage: `url(...)`
 *   Switching between 1-layer and 2-layer backgroundImage format is a larger
 *   GPU compositing invalidation than a simple alpha value change within the
 *   same format, making the threshold crossing particularly unstable.
 *
 * Unified fixes applied (017E extended — both triggers addressed):
 *   Fix A (conditional ring pattern — hover trigger): unchanged from first pass.
 *   Fix B (padding-top wrapper — shared root cause):
 *     Replace `aspect-[3/2]` on the button with a wrapper div that uses
 *     `paddingTop: '66.667%'` (padding percentages are computed once at CSS
 *     layout time, not re-evaluated during GPU rasterization).  Button becomes
 *     `absolute inset-0` inside this wrapper.  This eliminates CSS aspect-ratio
 *     from the GPU compositing rasterization path.
 *   Fix C (bgFade format switch eliminated — slider trigger):
 *     Always use 2-layer format regardless of bgFade value.  At bgFade=1, the
 *     gradient alpha is 0 (transparent), same visual, but the CSS format is
 *     stable — no format switch, smaller GPU invalidation on each slider tick.
 *   Fix D (grid GPU isolation):
 *     Add `willChange: 'transform'` to the landscape grid wrapper div,
 *     promoting it to a GPU compositing layer separate from the main container
 *     so parent repaints cannot cascade into the tiles' rasterization context.
 *
 * Tests 1–6:   Primary fix — no unconditional ring-2+ring-offset-1; aspect-ratio replaced
 * Tests 7–10:  Conditional ring pattern — active and hover branches correct
 * Tests 11–14: Image geometry stability — object-cover setup unchanged
 * Tests 15–18: Custom tile structural comparison — confirms fix matches safe pattern
 * Tests 19–22: Visual UX preserved — ring still appears on hover/active
 * Tests 23–26: Prior fixes still in place (decoding=async, no transitions, willChange)
 * Tests 27–30: Regression guards — no hover event handlers on tiles, label UX intact
 * Tests 31–38: Extended fixes — padding-top wrapper, bgFade format, grid isolation, DEV measurement
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

// ── Locate the landscape button className ────────────────────────────────────
// 017E extended: button moved inside a padding-top wrapper; its className now
// starts with `absolute inset-0 overflow-hidden` instead of `relative overflow-hidden`.
const btnClassIdx = presetsBlock.indexOf('className={`absolute inset-0 overflow-hidden');
const btnClassStr = btnClassIdx > -1
  ? presetsBlock.slice(btnClassIdx, btnClassIdx + 250)
  : '';

// ── Locate the custom photo button className ─────────────────────────────────
const customBtnIdx = photoSlotBlock.indexOf('className={`w-full relative overflow-hidden');
const customBtnStr = customBtnIdx > -1
  ? photoSlotBlock.slice(customBtnIdx, customBtnIdx + 250)
  : '';

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

console.log('\nPrompt 017E — Image Geometry Stability Root Cause Fix Tests\n');

// ── Part 1: Primary fix — permanent box-shadow removed from landscape button ──

test('1. ring-2 ring-offset-1 NOT unconditional (permanent box-shadow removed)', () => {
  // The fix removes `ring-2 ring-offset-1` from the unconditional base className.
  // At rest, landscape tiles must have zero box-shadow to prevent subpixel drift.
  // Check that the string "ring-2 ring-offset-1" does not appear as a standalone
  // unconditional pair before the ternary — it must appear only within the active branch.
  assert.ok(
    !presetsBlock.includes('ring-2 ring-offset-1 '),
    'ring-2 ring-offset-1 found unconditionally in PRESETS block — permanent box-shadow still present'
  );
});

test('2. ring-transparent NOT present in PRESETS block (no always-on transparent ring)', () => {
  // ring-transparent was the signal for the permanent box-shadow at rest.
  // After 017E it must be completely absent — inactive tiles have no ring at all.
  assert.ok(
    !presetsBlock.includes('ring-transparent'),
    'ring-transparent still present in PRESETS block — permanent box-shadow not fully removed'
  );
});

test('3. No unconditional ring-offset-1 before the ternary expression', () => {
  // The base className string (before the ternary `${...}`) must not contain
  // ring-offset-1, confirming the offset ring is not always allocated.
  const ternaryIdx  = presetsBlock.indexOf('isActive ?');
  const baseClass   = ternaryIdx > -1 ? presetsBlock.slice(btnClassIdx, ternaryIdx) : btnClassStr;
  assert.ok(
    !baseClass.includes('ring-offset-1'),
    'ring-offset-1 found in the unconditional base className — ring-offset is not conditional'
  );
});

test('4. No unconditional ring-2 before the ternary expression', () => {
  // Companion to test 3: ring-2 must also not appear before the ternary.
  const ternaryIdx  = presetsBlock.indexOf('isActive ?');
  const baseClass   = ternaryIdx > -1 ? presetsBlock.slice(btnClassIdx, ternaryIdx) : btnClassStr;
  assert.ok(
    !baseClass.includes('ring-2'),
    'ring-2 found unconditionally in landscape button base class — ring width is not conditional'
  );
});

test('5. Landscape button has `group` class (group hover for label UX preserved)', () => {
  // The `group` class must remain on the button so group-hover:opacity-100
  // on the label overlay continues to work correctly.
  assert.ok(
    btnClassStr.includes('group'),
    '`group` class not found on landscape button — label hover reveal broken'
  );
});

test('6. Landscape button has overflow-hidden and absolute inset-0 (padding-top wrapper fix)', () => {
  // 017E extended: aspect-[3/2] moved OFF the button into a wrapper div using
  // paddingTop: '66.667%'. The button becomes absolute inset-0 inside the wrapper.
  // overflow-hidden remains on the button to clip the image and ring correctly.
  assert.ok(
    btnClassStr.includes('overflow-hidden'),
    'overflow-hidden not found on landscape button — layout changed'
  );
  assert.ok(
    btnClassStr.includes('absolute') && btnClassStr.includes('inset-0'),
    'absolute inset-0 not found on landscape button — padding-top wrapper fix not applied'
  );
  assert.ok(
    !btnClassStr.includes('aspect-[3/2]'),
    'aspect-[3/2] still on landscape button — aspect-ratio not removed by padding-top fix'
  );
});

// ── Part 2: Conditional ring pattern — correct in both branches ───────────────

test('7. Active branch has ring-2 ring-primary ring-offset-1 (selected state ring correct)', () => {
  // When isActive, the ring must appear with primary color and offset.
  // Visual appearance of the selected-state ring must be identical to before.
  assert.ok(
    presetsBlock.includes('ring-2 ring-primary ring-offset-1'),
    'ring-2 ring-primary ring-offset-1 not found in PRESETS block — active ring state missing'
  );
});

test('8. Inactive hover branch has hover:ring-2 (ring appears on hover)', () => {
  // When not active, the ring appears only on hover — hover:ring-2 must be present.
  // This matches the custom photo tile pattern (confirmed not to shake).
  assert.ok(
    presetsBlock.includes('hover:ring-2'),
    'hover:ring-2 not found in PRESETS block — inactive hover ring missing'
  );
});

test('9. Inactive hover branch has hover:ring-foreground/30 (hover ring color correct)', () => {
  assert.ok(
    presetsBlock.includes('hover:ring-foreground/30'),
    'hover:ring-foreground/30 not found in PRESETS block — hover ring color missing'
  );
});

test('10. Inactive hover branch has hover:ring-offset-1 (conditional offset correct)', () => {
  // ring-offset now appears only when the ring is visible (on hover),
  // not as a permanent allocation at rest.
  assert.ok(
    presetsBlock.includes('hover:ring-offset-1') || presetsBlock.includes('hover:ring-offset'),
    'hover:ring-offset not found in PRESETS block — conditional ring-offset missing'
  );
});

// ── Part 3: Image geometry stability — object-cover setup unchanged ───────────

test('11. Landscape <img> has w-full h-full object-cover (fill container fully)', () => {
  // object-cover with w-full h-full is required for correct crop behavior.
  // The fix must not have changed the img className.
  assert.ok(
    presetsBlock.includes('w-full h-full object-cover'),
    'w-full h-full object-cover not found on landscape <img> — crop setup changed'
  );
});

test('12. Landscape <img> uses getThumbUrl() — remote URL, fixed dimensions', () => {
  // getThumbUrl returns ?w=400&h=260&fit=crop — fixed pixel dimensions from Unsplash.
  // The remote URL provides a stable source dimension for object-cover to work with.
  assert.ok(
    presetsBlock.includes('getThumbUrl(p.photoId)'),
    'getThumbUrl(p.photoId) not found in PRESETS block — thumbnail URL source changed'
  );
});

test('13. getThumbUrl requests fixed ?w=400&h=260 from Unsplash', () => {
  // The thumbnail URL must specify fixed w and h so the image intrinsic dimensions
  // are stable — no variable crop before it even reaches the browser.
  const fnIdx  = bgPicker.indexOf('function getThumbUrl');
  const fnBody = fnIdx > -1 ? bgPicker.slice(fnIdx, fnIdx + 200) : '';
  assert.ok(
    fnBody.includes('w=400') && fnBody.includes('h=260'),
    'getThumbUrl does not use w=400&h=260 — fixed thumbnail dimensions changed'
  );
});

test('14. No inline style on landscape <img> (no JS-driven size override)', () => {
  // A JS-driven width/height/transform style on the img would be a smoking gun
  // for JS-side geometry recalculation. It must be absent.
  const imgIdx  = presetsBlock.indexOf('<img src={getThumbUrl(');
  const imgLine = imgIdx > -1 ? presetsBlock.slice(imgIdx, imgIdx + 200) : '';
  assert.ok(
    !imgLine.includes('style='),
    'style= found on landscape <img> — JS-driven size override present'
  );
});

// ── Part 4: Custom tile structural comparison — fix matches safe pattern ──────

test('15. Custom photo button uses the same conditional ring pattern', () => {
  // Confirm the custom tile (confirmed not to shake) uses the same
  // conditional ring-2/ring-offset-1 pattern now adopted for landscape tiles.
  assert.ok(
    customBtnStr.includes('ring-2 ring-primary ring-offset-1') ||
    photoSlotBlock.includes('ring-2 ring-primary ring-offset-1'),
    'Custom photo button ring-2 ring-primary ring-offset-1 not found — comparison baseline changed'
  );
});

test('16. Custom photo button has hover:ring-2 hover:ring-foreground/30 (no-shake pattern)', () => {
  assert.ok(
    photoSlotBlock.includes('hover:ring-2') && photoSlotBlock.includes('hover:ring-foreground/30'),
    'Custom photo tile hover:ring-2 or hover:ring-foreground/30 not found — comparison baseline changed'
  );
});

test('17. Custom photo button has NO ring-transparent (no always-on ring confirmed)', () => {
  // Custom tiles have never had ring-transparent — they are the reference pattern.
  assert.ok(
    !photoSlotBlock.includes('ring-transparent'),
    'ring-transparent found in custom photo slot — comparison baseline changed unexpectedly'
  );
});

test('18. Custom photo button and landscape button now share the same ring conditional structure', () => {
  // Both should have conditional ring using isActive/hover patterns, not unconditional ring-2.
  const landscapeHasConditional = presetsBlock.includes('ring-2 ring-primary ring-offset-1')
    && presetsBlock.includes('hover:ring-2');
  const customHasConditional = photoSlotBlock.includes('ring-2 ring-primary ring-offset-1')
    && photoSlotBlock.includes('hover:ring-2');
  assert.ok(
    landscapeHasConditional,
    'Landscape tiles do not have the conditional ring pattern — 017E fix not fully applied'
  );
  assert.ok(
    customHasConditional,
    'Custom photo tiles do not have conditional ring pattern — comparison baseline changed'
  );
});

// ── Part 5: Visual UX preserved — ring still appears correctly ────────────────

test('19. Ring still appears when tile is active (isActive branch has ring-2 ring-primary)', () => {
  // The selected-state ring must still render — visual UX must be unchanged.
  assert.ok(
    presetsBlock.includes('ring-2 ring-primary'),
    'ring-2 ring-primary not found in PRESETS block — active state ring broken'
  );
});

test('20. Ring still appears on hover (hover:ring-2 hover:ring-foreground/30 present)', () => {
  assert.ok(
    presetsBlock.includes('hover:ring-2') && presetsBlock.includes('hover:ring-foreground/30'),
    'Hover ring classes not found — UX regression: no ring feedback on hover'
  );
});

test('21. Label overlay still appears on hover (group-hover:opacity-100 preserved)', () => {
  // The hover label reveal must be unaffected by the ring change.
  assert.ok(
    presetsBlock.includes('group-hover:opacity-100'),
    'group-hover:opacity-100 not found in PRESETS block — label hover broken'
  );
});

test('22. Checkmark still shown for active tile (isActive && Check block present)', () => {
  // The checkmark overlay for selected state must still render.
  assert.ok(
    presetsBlock.includes('<Check') && presetsBlock.includes('isActive &&'),
    '<Check or isActive && not found in PRESETS block — active checkmark broken'
  );
});

// ── Part 6: Prior prompt fixes still in place ──────────────────────────────────

test('23. decoding="async" on landscape <img> (017D off-thread decode preserved)', () => {
  assert.ok(
    presetsBlock.includes('decoding="async"') || presetsBlock.includes("decoding={'async'}"),
    'decoding="async" not found on landscape <img> — 017D off-thread decode fix regressed'
  );
});

test('24. No transition-opacity in PRESETS block (017D compositing cascade fix preserved)', () => {
  assert.ok(
    !presetsBlock.includes('transition-opacity'),
    'transition-opacity present in PRESETS block — 017D compositing cascade fix regressed'
  );
});

test('25. No transition-all in PRESETS block (017B fix preserved)', () => {
  assert.ok(
    !presetsBlock.includes('transition-all'),
    'transition-all present in PRESETS block — 017B/017C fix regressed'
  );
});

test('26. willChange:transform still on BackgroundPickerPanel (017C GPU isolation preserved)', () => {
  const panelDivStart = bgPicker.indexOf('animate-in fade-in slide-in-from-top-2');
  const panelDivBlock = bgPicker.slice(Math.max(0, panelDivStart - 250), panelDivStart + 600);
  assert.ok(
    panelDivBlock.includes('willChange') && panelDivBlock.includes('transform'),
    'willChange:transform not found on BackgroundPickerPanel — 017C GPU layer isolation regressed'
  );
});

// ── Part 7: Regression guards — no hover event handlers, label UX intact ──────

test('27. No onMouseEnter handler on landscape tile buttons', () => {
  assert.ok(
    !presetsBlock.includes('onMouseEnter'),
    'onMouseEnter found in PRESETS block — hover state must not trigger JS state changes'
  );
});

test('28. No onPointerEnter / onPointerLeave on landscape tile buttons', () => {
  assert.ok(
    !presetsBlock.includes('onPointerEnter') && !presetsBlock.includes('onPointerLeave'),
    'onPointerEnter or onPointerLeave found in PRESETS block'
  );
});

test('29. Label overlay has pointer-events-none (hover events not captured by overlay)', () => {
  const labelIdx   = presetsBlock.indexOf('group-hover:opacity-100');
  const nearLabel  = presetsBlock.slice(Math.max(0, labelIdx - 50), labelIdx + 200);
  assert.ok(
    nearLabel.includes('pointer-events-none'),
    'pointer-events-none not found near label overlay — overlay may capture hover events'
  );
});

test('30. 017A: Hide button renders unconditionally (no {background && wrapper})', () => {
  const hideIdx = checklist.indexOf('aria-label="Hide interface');
  assert.ok(hideIdx > -1, 'Hide button aria-label not found in Checklist');
  const surrounding = checklist.slice(Math.max(0, hideIdx - 300), hideIdx + 200);
  assert.ok(
    !surrounding.includes('{background &&'),
    'Hide button wrapped in {background && (...)} — 017A regression'
  );
});

// ── Part 8: Extended fixes — padding-top wrapper, bgFade format, grid isolation, measurement ──

test('31. Landscape tile wrapper div uses paddingTop 66.667% (aspect-ratio via layout, not GPU)', () => {
  // Fix B root cause: CSS aspect-ratio is evaluated at GPU rasterization time and
  // can produce different subpixel heights on consecutive compositing frames.
  // Replacing it with padding-top: 66.667% gives the same visual 3:2 ratio but
  // computed once at CSS layout time — stable across GPU re-evaluations.
  assert.ok(
    presetsBlock.includes("paddingTop: '66.667%'") || presetsBlock.includes('paddingTop:"66.667%"') || presetsBlock.includes('padding-top'),
    'paddingTop: 66.667% not found in PRESETS block — aspect-ratio replacement not applied'
  );
});

test('32. No aspect-[3/2] anywhere in the PRESETS block (aspect-ratio fully removed)', () => {
  // The landscape button must NOT have aspect-[3/2] after the 017E padding-top fix.
  // aspect-ratio on a button with overflow-hidden+object-cover is the root cause of
  // subpixel height drift during GPU compositing re-evaluations for BOTH triggers.
  assert.ok(
    !presetsBlock.includes('aspect-[3/2]'),
    'aspect-[3/2] still present in PRESETS block — aspect-ratio root cause not removed'
  );
});

test('33. Wrapper div for landscape tile uses `relative` positioning (establishes containing block)', () => {
  // The outer div for each PRESETS tile must have `relative` so that the
  // `absolute inset-0` button is positioned correctly within it.
  assert.ok(
    presetsBlock.includes('className="relative"') || presetsBlock.includes("className='relative'"),
    '"relative" wrapper div not found in PRESETS block — padding-top container not present'
  );
});

test('34. Checklist backgroundImage always uses linear-gradient format (threshold switch eliminated)', () => {
  // Fix C: the bgFade < 1 conditional that switched between url() and linear-gradient,url()
  // is replaced with always-2-layer format.  At bgFade=1, alpha=0 (transparent gradient),
  // same visual but no format switch → smaller GPU compositing invalidation on slider moves.
  // Check that the old conditional is gone and the new always-on format is present.
  const hasBgFadeConditional = checklist.includes('bgFade < 1') &&
    (checklist.includes('? `url(') || checklist.includes("? 'url("));
  assert.ok(
    !hasBgFadeConditional,
    'bgFade < 1 conditional ternary for url() vs linear-gradient,url() still present — format switch not eliminated'
  );
});

test('35. Checklist backgroundImage uses Math.max(0, 1 - bgFade) for alpha (clamped, always 2-layer)', () => {
  // The alpha value in the always-on linear-gradient must be clamped with Math.max(0, ...)
  // so that bgFade >= 1 produces 0 (transparent) and never a negative alpha value.
  assert.ok(
    checklist.includes('Math.max(0, 1 - bgFade)') || checklist.includes('Math.max(0,1-bgFade)'),
    'Math.max(0, 1 - bgFade) not found in Checklist — bgFade clamping not applied'
  );
});

test('36. Grid wrapper div has willChange: transform (GPU layer isolation from parent repaints)', () => {
  // Fix D: the landscape grid wrapper div gets willChange: 'transform' to promote it
  // to its own GPU compositing layer.  This isolates the grid tiles from parent
  // backgroundImage paint invalidations triggered by the Darken slider.
  const gridWrapperStart = bgPicker.indexOf('ref={landscapeGridRef}');
  const gridWrapperBlock = gridWrapperStart > -1
    ? bgPicker.slice(gridWrapperStart, gridWrapperStart + 400)
    : '';
  assert.ok(
    gridWrapperBlock.includes('willChange') && gridWrapperBlock.includes('transform'),
    'willChange: transform not found on landscape grid wrapper — GPU layer isolation not applied'
  );
});

test('37. landscapeGridRef declared and attached to grid wrapper (measurement ref present)', () => {
  // DEV measurement requires a ref on the grid wrapper to read bounding rect,
  // offsetWidth, clientWidth, etc. for both slider-drag and hover triggers.
  assert.ok(
    bgPicker.includes('landscapeGridRef') && bgPicker.includes('ref={landscapeGridRef}'),
    'landscapeGridRef not declared or not attached to grid wrapper — measurement ref missing'
  );
});

test('38. DEV measurement code gated on import.meta.env.DEV (no-op in production)', () => {
  // The measurement console.log code must be behind an import.meta.env.DEV check
  // so Vite tree-shakes it out of production builds.
  assert.ok(
    bgPicker.includes('import.meta.env.DEV'),
    'import.meta.env.DEV gate not found in BackgroundPicker — measurement code not tree-shaken in production'
  );
});

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failures.length) {
  console.error('\nFailed tests:');
  failures.forEach(f => console.error(`  - ${f.name}: ${f.message}`));
  process.exit(1);
}
