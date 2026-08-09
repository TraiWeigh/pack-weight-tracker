/**
 * signInContrast022N.test.mjs — Prompt 022N: Increase Sign-In Contrast & Fix Button States
 *
 * Protects:
 *   • formFieldInput has explicit #9CA6A0-range border
 *   • formFieldInput has explicit #F5F6F5-range background (not just neutral-50)
 *   • formFieldInput has placeholder text color override
 *   • formButtonPrimary has !text-white (white text on green button)
 *   • formButtonPrimary has disabled-state styling (muted bg + text)
 *   • socialButtonsBlockButton has explicit border class
 *   • socialButtonsBlockButtonText has legible text color
 *   • otpCodeFieldInput has same border + background treatment
 *   • colorMutedForeground is dark enough (≤35% lightness)
 *   • colorInput updated to #9CA6A0-range (hsl ~63% lightness)
 *   • All 022M invariants still satisfied
 *   • Authentication logic unchanged
 *   • Card layout unchanged
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root   = path.resolve('artifacts/pack-checklist/src');
const appSrc = fs.readFileSync(path.join(root, 'App.tsx'), 'utf8');

const has = (s) => appSrc.includes(s);

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

// ── Tests: Input field border — #9CA6A0 range ─────────────────────────────────

suite('022N Input Border Contrast');

test('formFieldInput has explicit border color in #9CA6A0 range', () => {
  assert.ok(
    has('border-[#9CA6A0]') || has('border-[#9ca6a0]') ||
    has('border-[#A8B0AC]') || has('border-[#a8b0ac]') ||
    has('border-[#9ca6]')   || has('border-[hsl(162'),
    'formFieldInput must have an explicit border color in the #9CA6A0–#A8B0AC range',
  );
});

test('formFieldInput has a border width class', () => {
  const match = appSrc.match(/formFieldInput:\s*'([^']*)'/);
  assert.ok(match, 'formFieldInput element class must be present');
  assert.ok(
    match[1].includes('!border') || match[1].includes('border-['),
    'formFieldInput must include a border class for visible field boundary',
  );
});

// ── Tests: Input field background — #F5F6F5 range ────────────────────────────

suite('022N Input Background Contrast');

test('formFieldInput has explicit #F5F6F5-range background (not just neutral-50)', () => {
  // neutral-50 = #fafafa — too close to white. Need a more distinct surface.
  assert.ok(
    has('bg-[#F5F6F5]') || has('bg-[#f5f6f5]') ||
    has('bg-[#F5F5F5]') || has('bg-[#f5f5f5]') ||
    has('bg-[#F6F6F6]') || has('bg-neutral-100') ||
    has('bg-[#F7F8F7]') || has('bg-[#f7f8f7]'),
    'formFieldInput must have a clearly-distinct background (e.g. #F5F6F5), not just neutral-50',
  );
});

test('otpCodeFieldInput has matching distinct background', () => {
  const match = appSrc.match(/otpCodeFieldInput:\s*'([^']*)'/);
  assert.ok(match, 'otpCodeFieldInput element class must be present');
  assert.ok(
    match[1].includes('bg-[#F5') || match[1].includes('bg-[#f5') ||
    match[1].includes('bg-neutral-100') || match[1].includes('bg-[#F6') ||
    match[1].includes('bg-[#F7'),
    'otpCodeFieldInput must have the same distinct background treatment',
  );
});

// ── Tests: Placeholder text color ─────────────────────────────────────────────

suite('022N Placeholder Readability');

test('formFieldInput has placeholder text color override', () => {
  const match = appSrc.match(/formFieldInput:\s*'([^']*)'/);
  assert.ok(match, 'formFieldInput must be present');
  assert.ok(
    match[1].includes('placeholder:'),
    'formFieldInput must include a placeholder: text color override',
  );
});

test('colorMutedForeground is at most 35% lightness for readable placeholders', () => {
  const match = appSrc.match(/colorMutedForeground:\s*'hsl\(\s*(\d+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)'/);
  assert.ok(match, 'colorMutedForeground must be set to an hsl value');
  const lightness = parseFloat(match[3]);
  assert.ok(
    lightness <= 35,
    `colorMutedForeground must be ≤35% lightness for readable placeholder text (got ${lightness}%)`,
  );
});

// ── Tests: Primary button — white text ────────────────────────────────────────

suite('022N Continue Button White Text');

test('formButtonPrimary has !text-white', () => {
  assert.ok(
    has('!text-white'),
    'formButtonPrimary must include !text-white so enabled Continue button text is white on green bg',
  );
});

test('formButtonPrimary is not empty string', () => {
  const match = appSrc.match(/formButtonPrimary:\s*'([^']*)'/);
  assert.ok(match, 'formButtonPrimary element class must be present');
  assert.ok(
    match[1].length > 0,
    'formButtonPrimary must not be empty — it must set text-white at minimum',
  );
});

// ── Tests: Primary button — disabled state ────────────────────────────────────

suite('022N Continue Button Disabled State');

test('formButtonPrimary has disabled-state background override', () => {
  const match = appSrc.match(/formButtonPrimary:\s*'([^']*)'/);
  assert.ok(match, 'formButtonPrimary must be present');
  assert.ok(
    match[1].includes('disabled:') || match[1].includes('aria-disabled:'),
    'formButtonPrimary must include disabled: or aria-disabled: state styling',
  );
});

test('formButtonPrimary disabled state uses a muted background (not dark green)', () => {
  // Disabled bg should be light-ish (>60% lightness) — clearly different from primary green (35%)
  const disabledBgMatch = appSrc.match(/disabled:!\S*bg-\[hsl\(([^)]+)\)\]/);
  if (disabledBgMatch) {
    const parts = disabledBgMatch[1].split(',');
    const lightness = parseFloat(parts[2]);
    assert.ok(
      lightness > 55,
      `Disabled button bg must be >55% lightness (muted), got ${lightness}%`,
    );
  } else {
    // If not hsl format, just verify disabled: is present with a bg class
    assert.ok(
      appSrc.includes('disabled:!bg-') || appSrc.includes('aria-disabled:!bg-'),
      'formButtonPrimary must have a disabled-state background class',
    );
  }
});

test('formButtonPrimary disabled state has text color override', () => {
  assert.ok(
    appSrc.includes('disabled:!text-') || appSrc.includes('aria-disabled:!text-'),
    'formButtonPrimary must have disabled-state text color styling',
  );
});

// ── Tests: Google button boundary ─────────────────────────────────────────────

suite('022N Google Button Visibility');

test('socialButtonsBlockButton has an explicit border class', () => {
  const match = appSrc.match(/socialButtonsBlockButton:\s*'([^']*)'/);
  assert.ok(match, 'socialButtonsBlockButton element class must be present');
  assert.ok(
    match[1].includes('border-[') || match[1].includes('!border'),
    'socialButtonsBlockButton must have an explicit border for visible Google button outline',
  );
});

test('socialButtonsBlockButton border is in the #9CA6A0 range', () => {
  assert.ok(
    has('border-[#9CA6A0]') || has('border-[#9ca6a0]') ||
    has('border-[#A8B0AC]') || has('border-[#a8b0ac]'),
    'Google button border must use the #9CA6A0–#A8B0AC visible gray range',
  );
});

test('socialButtonsBlockButton preserves white/light background', () => {
  const match = appSrc.match(/socialButtonsBlockButton:\s*'([^']*)'/);
  assert.ok(match, 'socialButtonsBlockButton must be present');
  assert.ok(
    match[1].includes('!bg-white') || match[1].includes('bg-white') ||
    match[1].includes('!bg-[#F') || match[1].includes('!bg-neutral'),
    'socialButtonsBlockButton must keep a white or light background (not primary green)',
  );
});

test('socialButtonsBlockButtonText has legible text color', () => {
  const match = appSrc.match(/socialButtonsBlockButtonText:\s*'([^']*)'/);
  assert.ok(match, 'socialButtonsBlockButtonText element class must be present');
  assert.ok(
    match[1].length > 0 && (match[1].includes('text-') || match[1].includes('font-')),
    'socialButtonsBlockButtonText must not be empty — set legible text color',
  );
});

// ── Tests: Focus state ────────────────────────────────────────────────────────

suite('022N Focus State');

test('formFieldInput has focus-state border override (green on focus)', () => {
  const match = appSrc.match(/formFieldInput:\s*'([^']*)'/);
  assert.ok(match, 'formFieldInput must be present');
  assert.ok(
    match[1].includes('focus:') || match[1].includes('focus-visible:'),
    'formFieldInput must include a focus: state for visible TrailWeigh-green focus indication',
  );
});

test('colorPrimary (focus ring green) unchanged at hsl(140, 15%, 35%)', () => {
  assert.ok(
    has("colorPrimary: 'hsl(140, 15%, 35%)'"),
    'colorPrimary must remain hsl(140, 15%, 35%) for TrailWeigh green focus ring',
  );
});

// ── Tests: 022M regressions — all prior invariants still hold ─────────────────

suite('022N 022M Regression Check');

test('colorInput lightness still ≤68% (022M requirement)', () => {
  const match = appSrc.match(/colorInput:\s*'hsl\(\s*(\d+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)'/);
  assert.ok(match, 'colorInput must still be an hsl value');
  const lightness = parseFloat(match[3]);
  assert.ok(lightness <= 68, `colorInput lightness must be ≤68% (got ${lightness}%)`);
});

test('colorNeutral lightness still ≤68% (022M requirement)', () => {
  const match = appSrc.match(/colorNeutral:\s*'hsl\(\s*(\d+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)'/);
  assert.ok(match, 'colorNeutral must still be an hsl value');
  const lightness = parseFloat(match[3]);
  assert.ok(lightness <= 68, `colorNeutral lightness must be ≤68% (got ${lightness}%)`);
});

test('shadcn theme still applied', () => {
  assert.ok(has('theme: shadcn'), 'shadcn theme must still be applied');
});

test('Auth logic unchanged — SignIn routing="path" still present', () => {
  assert.ok(has('<SignIn') && has('routing="path"'), 'SignIn component with routing must be present');
});

test('Auth logic unchanged — SignUp still present', () => {
  assert.ok(has('<SignUp') && has('signInUrl='), 'SignUp component must still be present');
});

test('Card layout preserved — bg-white w-[440px] rounded-2xl', () => {
  assert.ok(
    has('bg-white') && has('w-[440px]') && has('rounded-2xl'),
    'White card layout must be preserved',
  );
});

test('formFieldLabel font-medium preserved', () => {
  assert.ok(has("formFieldLabel: 'font-medium'"), 'formFieldLabel must still have font-medium');
});

test('footerActionLink font-semibold preserved', () => {
  assert.ok(has("footerActionLink: 'font-semibold'"), 'footerActionLink font-semibold preserved');
});

// ── Results ───────────────────────────────────────────────────────────────────

const total = passed + failed;
console.log(`\n022N Sign-In Contrast: ${passed}/${total} passed${failed > 0 ? `, ${failed} failed` : ''}`);
if (failed > 0) process.exit(1);
