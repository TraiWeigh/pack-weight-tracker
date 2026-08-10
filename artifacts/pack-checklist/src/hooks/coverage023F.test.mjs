/**
 * coverage023F.test.mjs — Prompt 023F tests
 *
 * Verifies complete bar/text/font coverage across all bars, pills,
 * and expanded panels.
 *
 * Run with: node --test artifacts/pack-checklist/src/hooks/coverage023F.test.mjs
 */
import { readFileSync } from 'fs';
import { resolve }      from 'path';
import { test }         from 'node:test';
import assert           from 'node:assert/strict';

const root = resolve('artifacts/pack-checklist/src');

const gear     = readFileSync(resolve(root, 'components/GearCategory.tsx'),    'utf8');
const weight   = readFileSync(resolve(root, 'components/WeightSummary.tsx'),   'utf8');
const locker   = readFileSync(resolve(root, 'components/LockerPanel.tsx'),     'utf8');
const importer = readFileSync(resolve(root, 'components/ImportGearPanel.tsx'), 'utf8');
const picker   = readFileSync(resolve(root, 'components/BackgroundPicker.tsx'),'utf8');
const ctx      = readFileSync(resolve(root, 'context/BarStyleContext.tsx'),    'utf8');
const cl       = readFileSync(resolve(root, 'pages/Checklist.tsx'),            'utf8');
const landing  = readFileSync(resolve(root, 'pages/LandingPage.tsx'),          'utf8');

// ── Part A: Bar Color Coverage ─────────────────────────────────────────────────

test('023F-A-01: Desert/Trail palette pill has barCombinedStyle applied', () => {
  // The palette pill button in WeightDistribution must have barCombinedStyle
  const paletteSection = weight.match(/Palette pill[\s\S]{0,600}?<\/button>/)?.[0] ?? '';
  assert.ok(
    paletteSection.includes('barCombinedStyle'),
    'Desert/Trail palette pill must receive barCombinedStyle'
  );
});

test('023F-A-02: BackgroundPickerButton imports and uses useBarStyle', () => {
  // BackgroundPicker.tsx must import useBarStyle
  assert.ok(
    picker.includes('useBarStyle'),
    'BackgroundPicker.tsx must import useBarStyle'
  );
});

test('023F-A-03: BackgroundPickerButton applies barCombinedStyle to its button', () => {
  // Capture from function start to the </button> that closes its return — avoids
  // the }: { parameter block whose leading } confuses \n} boundary detection.
  const startIdx  = picker.indexOf('export function BackgroundPickerButton');
  const closingBtn = picker.indexOf('</button>', startIdx);
  const btnSection = startIdx >= 0 && closingBtn >= 0
    ? picker.substring(startIdx, closingBtn + 10)
    : '';
  assert.ok(
    btnSection.includes('barCombinedStyle'),
    'BackgroundPickerButton must apply barCombinedStyle'
  );
});

test('023F-A-04: BackgroundPickerButton shows active/open ring with custom bar color', () => {
  const startIdx  = picker.indexOf('export function BackgroundPickerButton');
  const closingBtn = picker.indexOf('</button>', startIdx);
  const btnSection = startIdx >= 0 && closingBtn >= 0
    ? picker.substring(startIdx, closingBtn + 10)
    : '';
  assert.ok(
    btnSection.includes('outline') || btnSection.includes('boxShadow') || btnSection.includes('ring'),
    'BackgroundPickerButton must have outline/ring distinction when open with custom bar color'
  );
});

test('023F-A-05: +Base button has bar-color-aware style prop in GearCategory', () => {
  // The +Base button must have a conditional style prop that uses barColor.
  // Generous limit because the ternary style prop is multi-line and long.
  const baseSection = gear.match(/Base weight toggle[\s\S]{0,1400}?<\/button>/)?.[0] ?? '';
  assert.ok(
    baseSection.includes('barColor') || baseSection.includes('barStyle.barColor'),
    '+Base button must have bar-color-aware style prop'
  );
});

test('023F-A-06: GearCategory outer wrapper has fontFamily from barFontStyle', () => {
  // The outer div must have barFontStyle or fontWrapStyle applied
  assert.ok(
    gear.includes('barFontStyle') || gear.includes('fontWrapStyle'),
    'GearCategory outer wrapper must apply barFontStyle for font cascading'
  );
});

test('023F-A-07: WeightSummary outer wrapper has barFontStyle for font cascading', () => {
  assert.ok(
    weight.includes('barFontStyle'),
    'WeightSummary must import and apply barFontStyle to outer wrapper'
  );
});

test('023F-A-08: WeightDistribution outer wrapper has barFontStyle for font cascading', () => {
  // Both WeightSummary AND WeightDistribution outer wrappers must have barFontStyle.
  // Since both live in WeightSummary.tsx, check that barFontStyle appears at least twice
  // in that file (once per component's outer wrapper div).
  const matches = (weight.match(/barFontStyle/g) || []).length;
  assert.ok(
    matches >= 2,
    `WeightSummary.tsx must use barFontStyle at least twice (once per component), got ${matches}`
  );
});

test('023F-A-09: LockerPanel outer wrapper has barFontStyle for font cascading', () => {
  assert.ok(
    locker.includes('barFontStyle'),
    'LockerPanel must import and apply barFontStyle to outer wrapper'
  );
});

test('023F-A-10: ImportGearPanel outer wrapper has barFontStyle for font cascading', () => {
  assert.ok(
    importer.includes('barFontStyle'),
    'ImportGearPanel must import and apply barFontStyle to outer wrapper'
  );
});

// ── Part B: Text Color Coverage ────────────────────────────────────────────────

test('023F-B-01: Packed count span has barFgStyle in GearCategory', () => {
  const countSection = gear.match(/packed[\s\S]{0,300}?<\/span>/)?.[0] ?? '';
  assert.ok(
    countSection.includes('barFgStyle'),
    'Packed count span must have barFgStyle applied'
  );
});

test('023F-B-02: Drag handle has barFgStyle in GearCategory', () => {
  // Generous limit — the drag handle div has multi-line className and event props
  const dragSection = gear.match(/Drag handle[\s\S]{0,700}?<\/div>/)?.[0] ?? '';
  assert.ok(
    dragSection.includes('barFgStyle'),
    'Drag handle must have barFgStyle applied'
  );
});

test('023F-B-03: Trash button has barFgStyle in GearCategory', () => {
  // Use "Delete category" (the title attribute) to uniquely anchor this button
  const trashSection = gear.match(/Delete category[\s\S]{0,400}?<\/button>/)?.[0] ?? '';
  assert.ok(
    trashSection.includes('barFgStyle'),
    'Trash/delete button must have barFgStyle applied'
  );
});

test('023F-B-04: Weight value spans have barFgStyle in GearCategory', () => {
  const weightSection = gear.match(/Weight display[\s\S]{0,600}?<\/div>/)?.[0] ?? '';
  assert.ok(
    weightSection.includes('barFgStyle'),
    'Weight display spans must have barFgStyle applied'
  );
});

test('023F-B-05: Unit label spans have barFgStyle in GearCategory', () => {
  // The weight display outer div (ml-2 pl-2 border-l) contains two inner flex rows:
  //   row 1: displaySmall + su  (2 spans)
  //   row 2: / + displayLarge + lu  (3 spans, hidden on mobile)
  // The outer div closes two levels up. Capture all of it by matching to the
  // second </div> after the outer div opener.
  const outerStart = gear.indexOf('ml-2 pl-2 border-l');
  const firstClose  = gear.indexOf('</div>', outerStart);
  const secondClose = gear.indexOf('</div>', firstClose + 1);
  const weightSection = outerStart >= 0 && secondClose >= 0
    ? gear.substring(outerStart, secondClose + 6)
    : '';
  const fgMatches = (weightSection.match(/barFgStyle/g) || []).length;
  assert.ok(
    fgMatches >= 2,
    `Weight display section should have barFgStyle on at least 2 unit spans (got ${fgMatches})`
  );
});

test('023F-B-06: LockerPanel count badge has barFgStyle', () => {
  const countSection = locker.match(/entries\.length > 0[\s\S]{0,400}?<\/span>/)?.[0] ?? '';
  assert.ok(
    countSection.includes('barFgStyle'),
    'LockerPanel entry count badge must have barFgStyle applied'
  );
});

test('023F-B-07: LockerPanel description has barFgStyle', () => {
  // barFgStyle is on the <p> opening tag, not between the text and </p>.
  // Find the <p> tag whose content contains "Your saved gear lists".
  const descIdx = locker.indexOf('Your saved gear lists');
  const tagStart = descIdx >= 0 ? locker.lastIndexOf('<p', descIdx) : -1;
  const descElement = tagStart >= 0 ? locker.substring(tagStart, descIdx) : '';
  assert.ok(
    descElement.includes('barFgStyle'),
    'LockerPanel description paragraph must have barFgStyle on its opening <p> tag'
  );
});

// ── Part C: Font List ──────────────────────────────────────────────────────────

test('023F-C-01: FONT_OPTIONS has exactly 8 entries (Default + 7 fonts)', () => {
  // Count entries by matching "label: '" (with string value) to avoid the
  // TypeScript type annotation "{ label: string; value: string }[]" being counted.
  const options = picker.match(/FONT_OPTIONS[^=]*=\s*\[[\s\S]*?\];/)?.[0] ?? '';
  const labelMatches = (options.match(/label:\s*'/g) || []).length;
  assert.ok(
    labelMatches === 8,
    `FONT_OPTIONS must have exactly 8 entries, got ${labelMatches}`
  );
});

test('023F-C-02: FONT_OPTIONS includes Helvetica', () => {
  assert.ok(picker.includes('Helvetica'), 'FONT_OPTIONS must include Helvetica');
});

test('023F-C-03: FONT_OPTIONS includes Times New Roman', () => {
  assert.ok(picker.includes('Times New Roman'), 'FONT_OPTIONS must include Times New Roman');
});

test('023F-C-04: FONT_OPTIONS does NOT include Impact', () => {
  // Impact should not be in the font options list
  const fontSection = picker.match(/FONT_OPTIONS[\s\S]{0,600}?\];/)?.[0] ?? '';
  assert.ok(
    !fontSection.includes('Impact'),
    'FONT_OPTIONS must not include Impact'
  );
});

test('023F-C-05: FONT_OPTIONS does NOT include Palatino', () => {
  const fontSection = picker.match(/FONT_OPTIONS[\s\S]{0,600}?\];/)?.[0] ?? '';
  assert.ok(
    !fontSection.includes('Palatino'),
    'FONT_OPTIONS must not include Palatino'
  );
});

test('023F-C-06: FONT_OPTIONS includes Arial', () => {
  assert.ok(picker.includes("label: 'Arial'") || picker.includes('label: "Arial"'), 'FONT_OPTIONS must include Arial');
});

test('023F-C-07: FONT_OPTIONS includes Georgia', () => {
  assert.ok(picker.includes("label: 'Georgia'") || picker.includes('label: "Georgia"'), 'FONT_OPTIONS must include Georgia');
});

test('023F-C-08: FONT_OPTIONS includes Courier New', () => {
  assert.ok(picker.includes('Courier New'), 'FONT_OPTIONS must include Courier New');
});

// ── Part D: BarStyleContext helper ─────────────────────────────────────────────

test('023F-D-01: BarStyleContext exports barFontStyle helper', () => {
  assert.ok(
    ctx.includes('export function barFontStyle'),
    'BarStyleContext must export barFontStyle helper function'
  );
});

test('023F-D-02: barFontStyle returns fontFamily when barFont set', () => {
  // Check the implementation returns fontFamily
  const fnSection = ctx.match(/export function barFontStyle[\s\S]{0,200}?\}/)?.[0] ?? '';
  assert.ok(
    fnSection.includes('fontFamily'),
    'barFontStyle must return { fontFamily } when barFont is set'
  );
});

test('023F-D-03: barFontStyle returns empty object when no barFont', () => {
  // Capture from function start to its closing brace (which is at column 0, \n})
  // Use a broad-enough range and look for ternary `: {}` pattern.
  const startIdx = ctx.indexOf('export function barFontStyle');
  const endIdx   = startIdx >= 0 ? ctx.indexOf('\n}', startIdx) + 2 : -1;
  const fnSection = startIdx >= 0 && endIdx > startIdx ? ctx.substring(startIdx, endIdx) : '';
  assert.ok(
    fnSection.includes(': {}') || fnSection.includes('? {} :') || fnSection.includes('return {}'),
    'barFontStyle must return empty object when barFont is empty'
  );
});

// ── Part E: Regressions ────────────────────────────────────────────────────────

test('023F-E-01: Share hover behavior preserved (onMouseEnter handler present)', () => {
  const shareSection = cl.match(/Active: normal Share button[\s\S]{0,1500}?<\/button>/)?.[0] ?? '';
  assert.ok(
    shareSection.includes('onMouseEnter'),
    'Share button must still have onMouseEnter for user-verified hover fix'
  );
});

test('023F-E-02: Share hover does NOT revert to hover:bg-muted/50', () => {
  const shareSection = cl.match(/Active: normal Share button[\s\S]{0,1500}?<\/button>/)?.[0] ?? '';
  assert.ok(
    !shareSection.includes('hover:bg-muted/50'),
    'Share button must not have hover:bg-muted/50 (reverts user-verified fix)'
  );
});

test('023F-E-03: Hide fix preserved (closeSaveDialog calls setHasInputFocus(false))', () => {
  const closeBlock = cl.match(/const closeSaveDialog[\s\S]{0,500}?\};/)?.[0] ?? '';
  assert.ok(
    closeBlock.includes('setHasInputFocus(false)'),
    'closeSaveDialog must still call setHasInputFocus(false)'
  );
});

test('023F-E-04: 023D theme cleanup intact (no retro-outdoors built-in preset)', () => {
  assert.ok(
    !picker.includes('retro-outdoors') || !picker.includes('RETRO_PRESETS'),
    '023D removed retro-outdoors built-in preset; must remain removed'
  );
});

test('023F-E-05: 023E landing page unchanged (Build smarter lists headline present)', () => {
  assert.ok(
    landing.includes('Build smarter lists'),
    '023E landing page headline must still be present'
  );
});

test('023F-E-06: BarStyleProvider wraps ChecklistContent return', () => {
  assert.ok(
    cl.includes('BarStyleProvider'),
    'Checklist.tsx must still use BarStyleProvider to supply context values'
  );
});

test('023F-E-07: GearCategory still imports barCombinedStyle and barFgStyle', () => {
  assert.ok(
    gear.includes('barCombinedStyle') && gear.includes('barFgStyle'),
    'GearCategory must still import barCombinedStyle and barFgStyle'
  );
});

test('023F-E-08: WeightSummary palette pill uses barCombinedStyle (not reverted)', () => {
  assert.ok(
    weight.includes('barCombinedStyle'),
    'WeightSummary.tsx must still use barCombinedStyle on headers'
  );
});

test('023F-E-09: BackgroundPicker still exports FONT_OPTIONS', () => {
  assert.ok(
    picker.includes('export const FONT_OPTIONS'),
    'BackgroundPicker must still export FONT_OPTIONS'
  );
});

test('023F-E-10: GearCategory outer wrapper applies font style (fontWrapStyle or barFontStyle inline)', () => {
  // Either fontWrapStyle variable applied to div, or barFontStyle directly inline
  assert.ok(
    gear.includes('fontWrapStyle') || gear.match(/style=\{barFontStyle/),
    'GearCategory outer wrapper must propagate fontWrapStyle to the card div'
  );
});
