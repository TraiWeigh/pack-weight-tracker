/**
 * coverage023G.test.mjs — Prompt 023G regression suite
 *
 * Covers all five parts of 023G:
 *   A — Window/tab isolation for barColor, barFont, barTextColor, barTransparency
 *   B — Text color coverage (all relevant elements receive barFgStyle)
 *   C — Weight Distribution bar split fixed (header row gets combined style)
 *   D — Background panel font applied to BackgroundPickerPanel outer div
 *   E — Transparency slider (barTransparency state + hexToRgba + slider UI)
 *
 * Run with: node --test artifacts/pack-checklist/src/hooks/coverage023G.test.mjs
 */
import { readFileSync } from 'fs';
import { resolve }      from 'path';
import { test, describe } from 'node:test';
import assert           from 'node:assert/strict';

// Run from workspace root: node --test artifacts/pack-checklist/src/hooks/coverage023G.test.mjs
const root = resolve('artifacts/pack-checklist/src');

const barStyleCtx   = readFileSync(resolve(root, 'context/BarStyleContext.tsx'),     'utf8');
const checklist     = readFileSync(resolve(root, 'pages/Checklist.tsx'),             'utf8');
const bgPicker      = readFileSync(resolve(root, 'components/BackgroundPicker.tsx'), 'utf8');
const weightSummary = readFileSync(resolve(root, 'components/WeightSummary.tsx'),    'utf8');
const lockerPanel   = readFileSync(resolve(root, 'components/LockerPanel.tsx'),      'utf8');
const usePackData   = readFileSync(resolve(root, 'hooks/usePackData.ts'),            'utf8');

// ── PART A — Window/tab isolation ────────────────────────────────────────────

test('A1: handleNew writes barColor default to newseed bundle', () => {
  assert.match(checklist, /barColor:\s*''/);
  assert.match(checklist, /barFont:\s*''/);
  assert.match(checklist, /barTextColor:\s*''/);
  assert.match(checklist, /barTransparency:\s*1/);
});

test('A2: background initializer stashes tw-newbg-barcolor to sessionStorage', () => {
  assert.ok(checklist.includes("sessionStorage.setItem('tw-newbg-barcolor'"));
  assert.ok(checklist.includes("sessionStorage.setItem('tw-newbg-barfont'"));
  assert.ok(checklist.includes("sessionStorage.setItem('tw-newbg-bartextcolor'"));
  assert.ok(checklist.includes("sessionStorage.setItem('tw-newbg-bartransparency'"));
});

test('A3: background initializer stashes fork-scoped restore keys for bar style', () => {
  assert.ok(checklist.includes('tw-fork-barcolor-restore-'));
  assert.ok(checklist.includes('tw-fork-barfont-restore-'));
  assert.ok(checklist.includes('tw-fork-bartextcolor-restore-'));
  assert.ok(checklist.includes('tw-fork-bartransparency-restore-'));
});

test('A4: barColor lazy initializer reads tw-newbg-barcolor before localStorage', () => {
  const initBlock = checklist.match(/\[barColor, setBarColor\] = useState[\s\S]+?removeItem\('tw-newbg-barcolor'\)/);
  assert.ok(initBlock, 'barColor initializer should check sessionStorage first');
});

test('A5: barFont lazy initializer reads tw-newbg-barfont before localStorage', () => {
  const initBlock = checklist.match(/\[barFont, setBarFont\] = useState[\s\S]+?removeItem\('tw-newbg-barfont'\)/);
  assert.ok(initBlock, 'barFont initializer should check sessionStorage first');
});

test('A6: barTextColor lazy initializer reads tw-newbg-bartextcolor before localStorage', () => {
  const initBlock = checklist.match(/\[barTextColor, setBarTextColor\] = useState[\s\S]+?removeItem\('tw-newbg-bartextcolor'\)/);
  assert.ok(initBlock, 'barTextColor initializer should check sessionStorage first');
});

test('A7: barTransparency lazy initializer reads tw-newbg-bartransparency before localStorage', () => {
  const initBlock = checklist.match(/\[barTransparency, setBarTransparency\] = useState[\s\S]+?removeItem\('tw-newbg-bartransparency'\)/);
  assert.ok(initBlock, 'barTransparency initializer should check sessionStorage first');
});

test('A8: handleBarColorChange updates fork-scoped restore key', () => {
  const block = checklist.match(/handleBarColorChange[\s\S]{0,500}updateBarForkKey\('barcolor'/);
  assert.ok(block, 'handleBarColorChange must call updateBarForkKey');
});

test('A9: handleBarFontChange updates fork-scoped restore key', () => {
  const block = checklist.match(/handleBarFontChange[\s\S]{0,500}updateBarForkKey\('barfont'/);
  assert.ok(block, 'handleBarFontChange must call updateBarForkKey');
});

test('A10: handleBarTextColorChange updates fork-scoped restore key', () => {
  const block = checklist.match(/handleBarTextColorChange[\s\S]{0,500}updateBarForkKey\('bartextcolor'/);
  assert.ok(block, 'handleBarTextColorChange must call updateBarForkKey');
});

test('A11: handleResetBarStyle resets fork-scoped keys for all bar style props', () => {
  const block = checklist.match(/handleResetBarStyle[\s\S]+?updateBarForkKey\('bartransparency'/);
  assert.ok(block, 'handleResetBarStyle must reset all fork-scoped keys');
});

test('A12: restoreBgCallbackRef updates fork-scoped keys on undo/redo', () => {
  const block = checklist.match(/restoreBgCallbackRef[\s\S]{0,3000}updateBarForkKey\('barcolor'/);
  assert.ok(block, 'undo/redo restore must update fork-scoped keys');
});

// ── PART B — Text color coverage ─────────────────────────────────────────────

test('B1: WeightSummary applies barFgStyle to chevron icons', () => {
  assert.ok(weightSummary.includes('barFgStyle(barStyle)'));
  const lines = weightSummary.split('\n').filter(l => l.includes('ChevronUp') || l.includes('ChevronDown'));
  assert.ok(lines.some(l => l.includes('barFgStyle')), 'Chevron icons must have barFgStyle');
});

test('B2: WeightSummary applies barFgStyle to section title span', () => {
  assert.match(weightSummary, /Weight Distribution[\s\S]{0,200}barFgStyle/);
});

test('B3: BarStyleContext exports barFgStyle helper', () => {
  assert.ok(barStyleCtx.includes('export function barFgStyle'));
});

test('B4: BarStyleContext exports barBgStyle helper', () => {
  assert.ok(barStyleCtx.includes('export function barBgStyle'));
});

test('B5: BarStyleContext exports barFontStyle helper', () => {
  assert.ok(barStyleCtx.includes('export function barFontStyle'));
});

// ── PART C — Weight Distribution header row fix ───────────────────────────────

test('C1: header row div receives barCombinedStyle', () => {
  assert.match(weightSummary, /<div[^>]*flex items-center[^>]*style=\{barCombinedStyle/);
});

test('C2: outer card has overflow-hidden so bar colour stays within rounded corners', () => {
  assert.ok(weightSummary.includes('overflow-hidden'));
});

test('C3: palette pill has visual distinction (ring or border) when bar color is set', () => {
  assert.match(weightSummary, /outline|ring/);
  assert.ok(weightSummary.includes('showPaletteMenu'));
});

test('C4: collapse toggle button background inherits from parent (no own barCombinedStyle for bg)', () => {
  // The button that sets chartOpen should no longer set barCombinedStyle —
  // it now inherits from the parent div.  We check barCombinedStyle does NOT
  // appear immediately after aria-expanded on that button.
  const collapseArea = weightSummary.match(/aria-expanded[\s\S]{0,200}/);
  if (collapseArea) {
    assert.ok(!collapseArea[0].includes('barCombinedStyle'), 'collapse button must not set its own barCombinedStyle');
  }
});

// ── PART D — Background panel font ───────────────────────────────────────────

test('D1: BackgroundPickerPanel outer div applies barFont via fontFamily style', () => {
  assert.match(bgPicker, /fontFamily.*barFont|barFont.*fontFamily/s);
});

test('D2: barFontStyle is imported in BackgroundPicker.tsx', () => {
  assert.ok(bgPicker.includes('barFontStyle'));
});

test('D3: Panel outer panel div (with absolute positioning) has font style', () => {
  // The panel outer div className starts with "absolute left-1/2 -translate-x-1/2 ..."
  // and its style block includes fontFamily a few lines later (~400 chars total).
  const panelDiv = bgPicker.match(/absolute[\s\S]{0,500}fontFamily/);
  assert.ok(panelDiv, 'Panel outer div should have fontFamily style');
});

// ── PART E — Transparency slider ─────────────────────────────────────────────

test('E1: BarStyleContextValue includes barTransparency field', () => {
  assert.ok(barStyleCtx.includes('barTransparency: number'));
});

test('E2: DEFAULT_BAR_STYLE has barTransparency = 1', () => {
  assert.match(barStyleCtx, /barTransparency:\s*1/);
});

test('E3: hexToRgba helper is implemented', () => {
  assert.ok(barStyleCtx.includes('hexToRgba'));
  assert.ok(barStyleCtx.includes('rgba('));
});

test('E4: hexToRgba handles 3-char hex shorthand', () => {
  assert.match(barStyleCtx, /cleaned\.length === 3/);
});

test('E5: barCombinedStyle applies alpha to backgroundColor', () => {
  assert.match(barStyleCtx, /barTransparency[\s\S]{0,300}backgroundColor/s);
});

test('E6: barBgStyle also applies transparency', () => {
  assert.match(barStyleCtx, /barBgStyle[\s\S]{0,400}barTransparency/s);
});

test('E7: BackgroundPicker has barTransparency and onBarTransparencyChange in props interface', () => {
  assert.ok(bgPicker.includes('barTransparency: number'));
  assert.ok(bgPicker.includes('onBarTransparencyChange'));
});

test('E8: Transparency slider input is rendered in BackgroundPickerPanel', () => {
  assert.match(bgPicker, /type="range"[\s\S]{0,300}barTransparency/s);
});

test('E9: Transparency slider label is present', () => {
  assert.ok(bgPicker.includes('Transparency'));
});

test('E10: Transparency slider has Transparent and Solid endpoint labels', () => {
  assert.ok(bgPicker.includes('Transparent'));
  assert.ok(bgPicker.includes('Solid'));
});

test('E11: BgSnapshot type in usePackData includes barTransparency', () => {
  assert.ok(usePackData.includes('barTransparency'));
});

test('E12: LockerEntry type includes barTransparency', () => {
  assert.ok(lockerPanel.includes('barTransparency'));
});

test('E13: Checklist has barTransparency state with setter', () => {
  assert.ok(checklist.includes('barTransparency'));
  assert.ok(checklist.includes('setBarTransparency'));
});

test('E14: handleBarTransparencyChange is implemented', () => {
  assert.ok(checklist.includes('handleBarTransparencyChange'));
});

test('E15: handleResetBarStyle resets barTransparency to 1', () => {
  assert.match(checklist, /handleResetBarStyle[\s\S]{0,600}setBarTransparency\(1\)/);
});

test('E16: commitSaveNew saves barTransparency to LockerEntry', () => {
  const saveBlocks = checklist.match(/LockerEntry = \{[\s\S]+?barTransparency/g) ?? [];
  assert.ok(saveBlocks.length >= 1, 'commitSaveNew must include barTransparency in entry');
});

test('E17: commitSaveReplace saves barTransparency to LockerEntry', () => {
  const saveBlocks = checklist.match(/LockerEntry = \{[\s\S]+?barTransparency/g) ?? [];
  assert.ok(saveBlocks.length >= 2, 'both commitSaveNew and commitSaveReplace must include barTransparency');
});

test('E18: Locker load restores barTransparency from entry', () => {
  assert.ok(checklist.includes('entry.barTransparency'));
  assert.ok(checklist.includes('setBarTransparency(startBarTransparency)'));
});

test('E19: BarStyleProvider value includes barTransparency', () => {
  assert.match(checklist, /BarStyleProvider value=\{[\s\S]{0,200}barTransparency/);
});

test('E20: BackgroundPickerPanel call site passes barTransparency and handler', () => {
  assert.ok(checklist.includes('barTransparency={barTransparency}'));
  assert.ok(checklist.includes('onBarTransparencyChange={handleBarTransparencyChange}'));
});

test('E21: barTransparencyRef declared in Checklist', () => {
  assert.ok(checklist.includes('barTransparencyRef'));
  assert.ok(checklist.includes('useRef(1)'));
});

test('E22: barTransparencyRef.current kept in sync', () => {
  assert.ok(checklist.includes('barTransparencyRef.current = barTransparency'));
});

test('E23: restoreBgCallbackRef restores barTransparency on undo/redo', () => {
  assert.match(checklist, /restoreBgCallbackRef[\s\S]{0,3000}setBarTransparency/);
});

test('E24: onBeforeDeleteTheme pushBg includes barTransparency', () => {
  // The pushBg inside onBeforeDeleteTheme is ~700 chars after "onBeforeDeleteTheme".
  assert.match(checklist, /onBeforeDeleteTheme[\s\S]{0,1000}barTransparency/);
});

test('E25: all pushBg calls include barTransparency', () => {
  const pushBgCalls = checklist.match(/pushBg\(\{[\s\S]+?\}\)/g) ?? [];
  assert.ok(pushBgCalls.length > 0, 'Must have pushBg calls');
  const missing = pushBgCalls.filter(call => !call.includes('barTransparency'));
  assert.strictEqual(missing.length, 0, `pushBg calls missing barTransparency:\n${missing.join('\n')}`);
});

// ── Architecture sanity ───────────────────────────────────────────────────────

test('SA1: BarStyleProvider is Provider alias (not arrow function — HMR safe)', () => {
  assert.ok(barStyleCtx.includes('export const BarStyleProvider = BarStyleContext.Provider'));
});

test('SA2: BackgroundPicker imports barFontStyle from BarStyleContext', () => {
  assert.match(bgPicker, /import.*barFontStyle.*from.*BarStyleContext/);
});

test('SA3: barTransparency is clamped to [0,1] in handleBarTransparencyChange', () => {
  assert.match(checklist, /handleBarTransparencyChange[\s\S]{0,300}Math\.max\(0,\s*Math\.min\(1/);
});

test('SA4: barTransparency falls back to 1 when localStorage value is NaN', () => {
  assert.ok(checklist.includes("isNaN(n) ? 1"));
});

test('SA5: localStorage key for barTransparency is trailweigh:barTransparency', () => {
  assert.ok(checklist.includes("'trailweigh:barTransparency'"));
});
