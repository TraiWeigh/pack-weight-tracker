/**
 * sidebar019.test.mjs
 *
 * Prompt 019 — Background Edit Pill + Separate Collapsible Summary Panels
 *
 * Verifies:
 *   1. BackgroundPickerButton uses panelOpen (not just active) for open styling
 *   2. Open state uses bg-white (explicit white pill)
 *   3. Closed state uses bg-muted (matches normal inactive pills)
 *   4. WeightSummary (Pack Summary) is collapsible (ChevronDown/ChevronRight + summaryOpen state)
 *   5. WeightDistribution is a separate exported component
 *   6. WeightDistribution heading uses text-foreground (white in dark mode)
 *   7. Pack Summary no longer takes paletteKey/onPaletteChange
 *   8. Checklist.tsx renders WeightSummary and WeightDistribution as separate siblings
 *   9. Protected controls/features unchanged
 *
 * Automated tests cannot prove visual appearance, exact color rendering,
 * or independence of collapse states at runtime — those require user testing.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import assert from 'assert/strict';

const checklistPath  = resolve(process.cwd(), 'artifacts/pack-checklist/src/pages/Checklist.tsx');
const bgPickerPath   = resolve(process.cwd(), 'artifacts/pack-checklist/src/components/BackgroundPicker.tsx');
const weightSumPath  = resolve(process.cwd(), 'artifacts/pack-checklist/src/components/WeightSummary.tsx');

const checklist  = readFileSync(checklistPath,  'utf8');
const bgPicker   = readFileSync(bgPickerPath,   'utf8');
const weightSum  = readFileSync(weightSumPath,  'utf8');

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('\nPrompt 019 — Background Edit Pill + Separate Collapsible Panels\n');

// ── BACKGROUND EDIT PILL ──────────────────────────────────────────────────────

// Find the BackgroundPickerButton function in BackgroundPicker.tsx
const btnIdx = bgPicker.indexOf('export function BackgroundPickerButton');
assert.ok(btnIdx > -1, 'BackgroundPickerButton not found in BackgroundPicker.tsx');
const btnBlock = bgPicker.slice(btnIdx, btnIdx + 800);

test('1. BackgroundPickerButton has `panelOpen` prop in its signature', () => {
  assert.ok(btnBlock.includes('panelOpen'), 'panelOpen prop not found in BackgroundPickerButton signature');
});

test('2. Open state (panelOpen) uses `bg-white` (explicit white pill)', () => {
  assert.ok(btnBlock.includes('bg-white'), 'bg-white not found — open state should use white background');
});

test('3. Open state uses contrasting text color (text-gray-900 or text-zinc-900)', () => {
  assert.ok(
    btnBlock.includes('text-gray-900') || btnBlock.includes('text-zinc-900'),
    'Contrasting text color (text-gray-900 / text-zinc-900) not found for open state'
  );
});

test('4. Closed state uses `bg-muted` (matches normal inactive pills like Hide/Preview)', () => {
  assert.ok(btnBlock.includes('bg-muted'), 'bg-muted not found — closed state should match normal inactive pills');
});

test('5. Open/closed styling driven by `panelOpen` (not just `active`)', () => {
  // The ternary/conditional should reference panelOpen
  const ternaryBlock = btnBlock.slice(btnBlock.indexOf('className'), btnBlock.indexOf('className') + 400);
  assert.ok(ternaryBlock.includes('panelOpen'), 'panelOpen not used in className conditional');
});

test('6. BackgroundPickerButton no longer uses `bg-primary` for open state', () => {
  // bg-primary was the old "active background selected" style — should be gone
  // (or at least not triggered by panelOpen)
  const ternaryBlock = btnBlock.slice(btnBlock.indexOf('className'), btnBlock.indexOf('className') + 400);
  // panelOpen branch should not have bg-primary
  const openBranch = ternaryBlock.slice(0, ternaryBlock.indexOf('bg-muted'));
  assert.ok(!openBranch.includes('bg-primary'), 'bg-primary should not be the panelOpen=true style');
});

test('7. Checklist.tsx passes panelOpen={backgroundPickerOpen} to BackgroundPickerButton', () => {
  assert.ok(
    checklist.includes('panelOpen={backgroundPickerOpen}'),
    'panelOpen={backgroundPickerOpen} not found in Checklist.tsx BackgroundPickerButton call'
  );
});

// ── PACK SUMMARY — COLLAPSIBLE ────────────────────────────────────────────────

// WeightSummary export
const wsIdx = weightSum.indexOf('export function WeightSummary');
assert.ok(wsIdx > -1, 'WeightSummary export not found');
// 3500 chars covers the full WeightSummary function body including Grand Total
const wsBlock = weightSum.slice(wsIdx, wsIdx + 3500);

test('8. WeightSummary has collapse state (`summaryOpen`)', () => {
  assert.ok(wsBlock.includes('summaryOpen'), 'summaryOpen state not found in WeightSummary');
});

test('9. WeightSummary uses setSummaryOpen to toggle collapse', () => {
  assert.ok(wsBlock.includes('setSummaryOpen'), 'setSummaryOpen not found in WeightSummary');
});

test('10. WeightSummary has ChevronUp (expanded icon — 021J corrected direction)', () => {
  assert.ok(wsBlock.includes('ChevronUp'), 'ChevronUp not found in WeightSummary collapse control (expanded state must show UP)');
});

test('11. WeightSummary has ChevronDown (collapsed icon — 021J corrected direction)', () => {
  assert.ok(wsBlock.includes('ChevronDown'), 'ChevronDown not found in WeightSummary collapse control (collapsed state must show DOWN)');
});

test('12. WeightSummary body is conditionally rendered ({summaryOpen && ...})', () => {
  assert.ok(wsBlock.includes('summaryOpen &&'), 'summaryOpen && conditional not found — body not collapsible');
});

test('13. Pack Summary header has collapse button (aria-expanded or onClick with setSummaryOpen)', () => {
  assert.ok(
    wsBlock.includes('aria-expanded') || wsBlock.includes('setSummaryOpen(o =>'),
    'Collapse button with aria-expanded or setSummaryOpen toggle not found'
  );
});

test('14. WeightSummary no longer accepts paletteKey prop', () => {
  // The WeightSummary interface/props should not include paletteKey
  const wsPropsBlock = weightSum.slice(wsIdx - 200, wsIdx + 200);
  // paletteKey should only appear in WeightDistributionProps, not WeightSummary's direct signature
  // Check the WeightSummary function signature line
  const funcSig = wsBlock.slice(0, 200);
  assert.ok(!funcSig.includes('paletteKey'), 'WeightSummary function signature should not include paletteKey');
});

test('15. WeightSummary preserves Base Weight display', () => {
  assert.ok(wsBlock.includes('Base Weight'), 'Base Weight not found in WeightSummary body');
});

test('16. WeightSummary preserves Grand Total display', () => {
  assert.ok(wsBlock.includes('Grand Total'), 'Grand Total not found in WeightSummary body');
});

// ── WEIGHT DISTRIBUTION — SEPARATE COMPONENT ─────────────────────────────────

const wdIdx = weightSum.indexOf('export function WeightDistribution');
assert.ok(wdIdx > -1, 'WeightDistribution export not found in WeightSummary.tsx');
// 6000 chars covers the full WeightDistribution function including PieChart/ResponsiveContainer
const wdBlock = weightSum.slice(wdIdx, wdIdx + 6000);

test('17. WeightDistribution is a separately exported function', () => {
  assert.ok(wdIdx > -1, 'WeightDistribution not exported from WeightSummary.tsx');
});

test('18. WeightDistribution has its own card container (bg-card border rounded-xl)', () => {
  assert.ok(
    wdBlock.includes('bg-card') && wdBlock.includes('rounded-xl'),
    'WeightDistribution missing its own card container (bg-card rounded-xl)'
  );
});

test('19. WeightDistribution heading uses `text-foreground` (white in dark mode)', () => {
  // The visible span heading uses `uppercase tracking-wider` — find that span and check its class.
  // Note: 'Weight Distribution' also appears in aria-label strings, so we search for the span specifically.
  const spanHeadingIdx = wdBlock.indexOf('uppercase tracking-wider');
  assert.ok(spanHeadingIdx > -1, 'uppercase tracking-wider span not found in WeightDistribution heading');
  const spanContext = wdBlock.slice(Math.max(0, spanHeadingIdx - 150), spanHeadingIdx + 50);
  assert.ok(
    spanContext.includes('text-foreground'),
    'Weight Distribution heading span should use text-foreground (not text-muted-foreground) for white in dark mode'
  );
});

test('20. WeightDistribution heading does NOT use text-muted-foreground (old dimmed style)', () => {
  const spanHeadingIdx = wdBlock.indexOf('uppercase tracking-wider');
  assert.ok(spanHeadingIdx > -1, 'uppercase tracking-wider span not found');
  const spanContext = wdBlock.slice(Math.max(0, spanHeadingIdx - 150), spanHeadingIdx + 50);
  assert.ok(
    !spanContext.includes('text-muted-foreground'),
    'Weight Distribution heading span should not use text-muted-foreground — use text-foreground'
  );
});

test('21. WeightDistribution still has collapse state (chartOpen)', () => {
  assert.ok(wdBlock.includes('chartOpen'), 'chartOpen state not found in WeightDistribution');
});

test('22. WeightDistribution still has palette selector (Palette icon + PALETTES)', () => {
  assert.ok(wdBlock.includes('Palette') || wdBlock.includes('paletteKey'), 'Palette selector not found in WeightDistribution');
});

test('23. WeightDistribution still has PieChart / ResponsiveContainer', () => {
  assert.ok(wdBlock.includes('PieChart') && wdBlock.includes('ResponsiveContainer'), 'PieChart/ResponsiveContainer not found in WeightDistribution');
});

test('24. WeightDistribution still has onPaletteChange prop', () => {
  const wdFuncSig = wdBlock.slice(0, 300);
  assert.ok(wdFuncSig.includes('onPaletteChange'), 'onPaletteChange prop not found in WeightDistribution');
});

// ── CHECKLIST.TSX — SEPARATE SIDEBAR RENDERS ─────────────────────────────────

test('25. Checklist.tsx imports WeightDistribution from WeightSummary', () => {
  assert.ok(
    checklist.includes('WeightDistribution') && checklist.includes('WeightSummary'),
    'WeightDistribution not imported in Checklist.tsx'
  );
});

test('26. Checklist.tsx renders <WeightSummary without paletteKey', () => {
  const wsCallIdx = checklist.indexOf('<WeightSummary');
  assert.ok(wsCallIdx > -1, '<WeightSummary not found in Checklist.tsx');
  const wsCallBlock = checklist.slice(wsCallIdx, wsCallIdx + 300);
  assert.ok(!wsCallBlock.includes('paletteKey'), '<WeightSummary call should not include paletteKey');
});

test('27. Checklist.tsx renders <WeightDistribution with paletteKey and onPaletteChange', () => {
  const wdCallIdx = checklist.indexOf('<WeightDistribution');
  assert.ok(wdCallIdx > -1, '<WeightDistribution not found in Checklist.tsx');
  const wdCallBlock = checklist.slice(wdCallIdx, wdCallIdx + 300);
  assert.ok(wdCallBlock.includes('paletteKey'), '<WeightDistribution call missing paletteKey');
  assert.ok(wdCallBlock.includes('onPaletteChange'), '<WeightDistribution call missing onPaletteChange');
});

test('28. Both WeightSummary and WeightDistribution are siblings in the sidebar (WeightSummary before WeightDistribution)', () => {
  const wsCallIdx = checklist.indexOf('<WeightSummary');
  const wdCallIdx = checklist.indexOf('<WeightDistribution');
  assert.ok(wsCallIdx > -1 && wdCallIdx > -1, 'Both components must be present in Checklist.tsx');
  assert.ok(wsCallIdx < wdCallIdx, 'WeightSummary should appear before WeightDistribution in sidebar');
  // They should be close siblings (within 200 chars of each other in the flex col)
  const between = checklist.slice(wsCallIdx, wdCallIdx);
  assert.ok(between.length < 400, 'WeightSummary and WeightDistribution should be close sidebar siblings');
});

// ── PROTECTED FEATURES UNCHANGED ─────────────────────────────────────────────

// 018C filename pill
test('29. Filename pill: inset-0 centering preserved (018C fix, 021O updated padding)', () => {
  // 021O removed pt-8 from the overlay (moved to toolbar-group parent as pt-4).
  // 022W: pill is in normal flow on mobile; uses lg:absolute for desktop centering
  assert.ok(checklist.includes('lg:absolute lg:inset-0') && checklist.includes('pointer-events-none'), '022W: pill must use lg:absolute centering on desktop + pointer-events-none');
});

test('30. Filename pill: text-foreground preserved on span', () => {
  const pillIdx = checklist.indexOf('{activeLockerFile && (');
  assert.ok(pillIdx > -1, 'activeLockerFile conditional not found');
  const pillBlock = checklist.slice(pillIdx, pillIdx + 600);
  assert.ok(pillBlock.includes('text-foreground'), 'text-foreground missing from filename span');
});

// Control order
// 022W: desktop right group class is now 'hidden lg:flex items-center gap-3 ml-auto flex-shrink-0'
const mlAutoChecklistIdx = checklist.indexOf('hidden lg:flex items-center gap-3 ml-auto flex-shrink-0');
assert.ok(mlAutoChecklistIdx > -1, '022W: desktop right group (hidden lg:flex ... ml-auto) not found');
const rightGroup = checklist.slice(mlAutoChecklistIdx, mlAutoChecklistIdx + 1400);

test('31. Hide button still present in right control group', () => {
  assert.ok(rightGroup.includes('aria-label="Hide interface and show background view"'), 'Hide button not found');
});

test('32. Preview button still present in right control group', () => {
  assert.ok(rightGroup.includes('aria-label="Open checked-items preview"'), 'Preview button not found');
});

test('33. UnitToggle still present in right control group', () => {
  assert.ok(rightGroup.includes('<UnitToggle'), 'UnitToggle not found');
});

// Save confirmation
test('34. Save toast uses `Saved ${name}` (no extra quotes — 020F)', () => {
  // 020F: removed wrapping quotes so toast reads "Saved Sierra" not 'Saved "Sierra"'
  const toastStr = '`Saved ${name}`';
  assert.ok(checklist.indexOf(toastStr) > -1, `Save toast \`Saved \${name}\` not found`);
});

// WeightSummary.tsx still has PALETTES (no data loss)
test('35. PALETTES constant still present in WeightSummary.tsx (chart palettes preserved)', () => {
  assert.ok(weightSum.includes('const PALETTES'), 'PALETTES not found in WeightSummary.tsx');
});

// Both collapse states are independent (different state variable names in different functions)
test('36. summaryOpen (Pack Summary) and chartOpen (Weight Distribution) are separate state variables', () => {
  assert.ok(weightSum.includes('summaryOpen'), 'summaryOpen not found');
  assert.ok(weightSum.includes('chartOpen'), 'chartOpen not found');
  // summaryOpen must appear before WeightDistribution export (= in WeightSummary)
  assert.ok(weightSum.indexOf('summaryOpen') < wdIdx, 'summaryOpen should be in WeightSummary, before WeightDistribution');
  // chartOpen must appear in WeightDistribution
  assert.ok(weightSum.indexOf('chartOpen') > wsIdx, 'chartOpen should be in WeightDistribution or after WeightSummary');
});

console.log('\n────────────────────────────────────────────────────');
console.log('Tests: 36');
console.log('\n⚠️  Automated tests verify structural correctness only.');
console.log('Visual appearance, collapse animation, color rendering, and runtime');
console.log('independence of collapse states require the user\'s fresh-preview acceptance test.');
