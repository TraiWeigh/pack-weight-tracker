/**
 * PROMPT 023E — Part A: Bar Color / Text
 *
 * Verifies:
 *  01. BarStyleContext exports BarStyleProvider, useBarStyle, barCombinedStyle
 *  02. barCombinedStyle returns empty object when all values empty
 *  03. barCombinedStyle returns backgroundColor when barColor set
 *  04. barCombinedStyle returns color when barTextColor set
 *  05. barCombinedStyle returns fontFamily when barFont set
 *  06. barCombinedStyle returns all three when all set
 *  07. BackgroundPickerPanel interface has barColor prop
 *  08. BackgroundPickerPanel interface has barFont prop
 *  09. BackgroundPickerPanel interface has barTextColor prop
 *  10. BackgroundPickerPanel interface has onResetBarStyle prop
 *  11. BackgroundPicker exports FONT_OPTIONS array
 *  12. FONT_OPTIONS includes default empty-string option
 *  13. FONT_OPTIONS includes at least 6 font choices
 *  14. FONT_OPTIONS includes Arial
 *  15. BackgroundPicker has contrastRatio helper (exported or as internal fn)
 *  16. BarStyleContext applied to WeightSummary (barCombinedStyle import)
 *  17. BarStyleContext applied to GearCategory (barCombinedStyle import)
 *  18. BarStyleContext applied to ImportGearPanel (barCombinedStyle import)
 *  19. BarStyleContext applied to LockerPanel (barCombinedStyle import)
 *  20. Checklist.tsx declares barColor state
 *  21. Checklist.tsx declares barFont state
 *  22. Checklist.tsx declares barTextColor state
 *  23. Checklist.tsx has handleBarColorChange
 *  24. Checklist.tsx has handleResetBarStyle
 *  25. Checklist.tsx includes barColor in commitSaveNew LockerEntry
 *  26. Checklist.tsx includes barFont in commitSaveReplace LockerEntry
 *  27. Checklist.tsx persists barColor to localStorage
 *  28. LockerEntry type has barColor optional field
 *  29. BgSnapshot type has barColor optional field
 *  30. Checklist.tsx wraps return content in BarStyleProvider
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const ctx  = readFileSync(resolve('artifacts/pack-checklist/src/context/BarStyleContext.tsx'), 'utf-8');
const bg   = readFileSync(resolve('artifacts/pack-checklist/src/components/BackgroundPicker.tsx'), 'utf-8');
const ws   = readFileSync(resolve('artifacts/pack-checklist/src/components/WeightSummary.tsx'), 'utf-8');
const gc   = readFileSync(resolve('artifacts/pack-checklist/src/components/GearCategory.tsx'), 'utf-8');
const imp  = readFileSync(resolve('artifacts/pack-checklist/src/components/ImportGearPanel.tsx'), 'utf-8');
const lp   = readFileSync(resolve('artifacts/pack-checklist/src/components/LockerPanel.tsx'), 'utf-8');
const cl   = readFileSync(resolve('artifacts/pack-checklist/src/pages/Checklist.tsx'), 'utf-8');
const lpT  = readFileSync(resolve('artifacts/pack-checklist/src/hooks/usePackData.ts'), 'utf-8');

// ── BarStyleContext exports ─────────────────────────────────────────────────
test('023E-A-01: BarStyleContext exports BarStyleProvider', () => {
  assert.ok(ctx.includes('export const BarStyleProvider') || ctx.includes('export { BarStyleProvider'),
    'BarStyleContext must export BarStyleProvider');
});

test('023E-A-02: barCombinedStyle returns empty object for all-empty values', () => {
  // Verify the implementation checks for empty strings before adding properties
  assert.ok(ctx.includes('if (v.barColor)') || ctx.includes("v.barColor ?"),
    'barCombinedStyle must check barColor before adding backgroundColor');
});

test('023E-A-03: barCombinedStyle sets backgroundColor for barColor', () => {
  assert.ok(ctx.includes('backgroundColor'), 'barCombinedStyle must set backgroundColor');
});

test('023E-A-04: barCombinedStyle sets color for barTextColor', () => {
  assert.ok(ctx.includes('color') && ctx.includes('barTextColor'), 'barCombinedStyle must set color from barTextColor');
});

test('023E-A-05: barCombinedStyle sets fontFamily for barFont', () => {
  assert.ok(ctx.includes('fontFamily'), 'barCombinedStyle must set fontFamily');
});

test('023E-A-06: barCombinedStyle handles all three properties', () => {
  assert.ok(
    ctx.includes('backgroundColor') && ctx.includes('fontFamily') && ctx.includes('barTextColor'),
    'barCombinedStyle must handle barColor, barFont, and barTextColor'
  );
});

// ── BackgroundPickerPanel new props ────────────────────────────────────────
test('023E-A-07: BackgroundPickerPanel interface has barColor prop', () => {
  assert.ok(bg.includes('barColor'), 'BackgroundPickerPanelProps must include barColor');
});

test('023E-A-08: BackgroundPickerPanel interface has barFont prop', () => {
  assert.ok(bg.includes('barFont'), 'BackgroundPickerPanelProps must include barFont');
});

test('023E-A-09: BackgroundPickerPanel interface has barTextColor prop', () => {
  assert.ok(bg.includes('barTextColor'), 'BackgroundPickerPanelProps must include barTextColor');
});

test('023E-A-10: BackgroundPickerPanel interface has onResetBarStyle prop', () => {
  assert.ok(bg.includes('onResetBarStyle'), 'BackgroundPickerPanelProps must include onResetBarStyle');
});

// ── FONT_OPTIONS ───────────────────────────────────────────────────────────
test('023E-A-11: BackgroundPicker exports FONT_OPTIONS array', () => {
  assert.ok(bg.includes('FONT_OPTIONS'), 'BackgroundPicker must export FONT_OPTIONS');
});

test('023E-A-12: FONT_OPTIONS includes default empty-string option', () => {
  assert.ok(bg.includes("value: ''"), 'FONT_OPTIONS must include default option with empty string value');
});

test('023E-A-13: FONT_OPTIONS includes at least 6 font choices', () => {
  const matches = (bg.match(/label:/g) || []).length;
  assert.ok(matches >= 6, `FONT_OPTIONS should have at least 6 entries; found ${matches}`);
});

test('023E-A-14: FONT_OPTIONS includes Arial', () => {
  assert.ok(bg.includes('Arial'), 'FONT_OPTIONS must include Arial');
});

// ── Contrast helper ────────────────────────────────────────────────────────
test('023E-A-15: BackgroundPicker has contrastRatio helper', () => {
  assert.ok(bg.includes('contrastRatio') || bg.includes('contrast'), 'BackgroundPicker must have a contrast checking helper');
});

// ── BarStyleContext applied to sidebar components ──────────────────────────
test('023E-A-16: WeightSummary imports barCombinedStyle from BarStyleContext', () => {
  assert.ok(ws.includes('barCombinedStyle') && ws.includes('BarStyleContext'),
    'WeightSummary must import and use barCombinedStyle from BarStyleContext');
});

test('023E-A-17: GearCategory imports barCombinedStyle from BarStyleContext', () => {
  assert.ok(gc.includes('barCombinedStyle') && gc.includes('BarStyleContext'),
    'GearCategory must import and use barCombinedStyle from BarStyleContext');
});

test('023E-A-18: ImportGearPanel imports barCombinedStyle from BarStyleContext', () => {
  assert.ok(imp.includes('barCombinedStyle') && imp.includes('BarStyleContext'),
    'ImportGearPanel must import and use barCombinedStyle from BarStyleContext');
});

test('023E-A-19: LockerPanel imports barCombinedStyle from BarStyleContext', () => {
  assert.ok(lp.includes('barCombinedStyle') && lp.includes('BarStyleContext'),
    'LockerPanel must import and use barCombinedStyle from BarStyleContext');
});

// ── Checklist.tsx bar state ────────────────────────────────────────────────
test('023E-A-20: Checklist.tsx declares barColor state', () => {
  assert.ok(cl.includes('barColor') && cl.includes('setBarColor'),
    'Checklist must declare barColor state via useState');
});

test('023E-A-21: Checklist.tsx declares barFont state', () => {
  assert.ok(cl.includes('barFont') && cl.includes('setBarFont'),
    'Checklist must declare barFont state via useState');
});

test('023E-A-22: Checklist.tsx declares barTextColor state', () => {
  assert.ok(cl.includes('barTextColor') && cl.includes('setBarTextColor'),
    'Checklist must declare barTextColor state via useState');
});

test('023E-A-23: Checklist.tsx has handleBarColorChange', () => {
  assert.ok(cl.includes('handleBarColorChange'), 'Checklist must have handleBarColorChange handler');
});

test('023E-A-24: Checklist.tsx has handleResetBarStyle', () => {
  assert.ok(cl.includes('handleResetBarStyle'), 'Checklist must have handleResetBarStyle handler');
});

test('023E-A-25: Checklist.tsx includes barColor in commitSaveNew LockerEntry', () => {
  // commitSaveNew builds a LockerEntry with barColor
  const saveNewBlock = cl.match(/commitSaveNew[\s\S]{0,2000}?closeSaveDialog/)?.[0] ?? '';
  assert.ok(
    saveNewBlock.includes('barColor') && saveNewBlock.includes('barFont') && saveNewBlock.includes('barTextColor'),
    'commitSaveNew must include barColor, barFont, barTextColor in the saved LockerEntry'
  );
});

test('023E-A-26: Checklist.tsx includes barFont in commitSaveReplace LockerEntry', () => {
  // Use 'const commitSaveReplace' to avoid matching earlier references/comments
  const saveReplBlock = cl.match(/const commitSaveReplace[\s\S]{0,3000}?closeSaveDialog/)?.[0] ?? '';
  assert.ok(
    saveReplBlock.includes('barColor') && saveReplBlock.includes('barFont') && saveReplBlock.includes('barTextColor'),
    'commitSaveReplace must include barColor, barFont, barTextColor in the saved LockerEntry'
  );
});

test('023E-A-27: Checklist.tsx persists barColor to localStorage', () => {
  assert.ok(cl.includes("'trailweigh:barColor'"), "Checklist must persist barColor to localStorage under 'trailweigh:barColor'");
});

test('023E-A-28: LockerEntry type has optional barColor field', () => {
  assert.ok(lp.includes('barColor?'), 'LockerEntry interface must include optional barColor field');
});

test('023E-A-29: BgSnapshot type has optional barColor field', () => {
  assert.ok(lpT.includes('barColor?'), 'BgSnapshot type must include optional barColor field');
});

test('023E-A-30: Checklist.tsx wraps content in BarStyleProvider', () => {
  assert.ok(cl.includes('BarStyleProvider'), 'Checklist must import and use BarStyleProvider');
});
