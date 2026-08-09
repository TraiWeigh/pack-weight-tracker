/**
 * signInVisibility022M.test.mjs — Prompt 022M: Sign-In Form Field Visibility
 *
 * Protects:
 *   • colorInput lightness darkened from 85% → visible (≤68%)
 *   • colorNeutral lightness darkened from 85% → visible (≤68%)
 *   • colorMutedForeground is readable (≤45% lightness)
 *   • formFieldInput has a background class (off-white differentiation)
 *   • otpCodeFieldInput has a background class
 *   • Authentication logic unchanged (Clerk SignIn/SignUp still used)
 *   • Card layout preserved (bg-white card, w-[440px])
 *   • colorPrimary (TrailWeigh green focus ring) unchanged
 *   • colorInputForeground (input text) unchanged
 *   • No auth logic removed or replaced
 *   • Clerk appearance object still references shadcn theme
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

// ── Tests: colorInput lightness improvement ───────────────────────────────────

suite('022M colorInput Visibility');

test('colorInput is no longer the invisible 85% value', () => {
  // The old value was 'hsl(140, 10%, 85%)' — nearly invisible on white
  assert.ok(
    !has("colorInput: 'hsl(140, 10%, 85%)'"),
    'colorInput must not remain at 85% lightness (too close to white card)',
  );
});

test('colorInput is present and uses a visible lightness (≤68%)', () => {
  // Extract the colorInput hsl value
  const match = appSrc.match(/colorInput:\s*'hsl\(\s*(\d+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)'/);
  assert.ok(match, 'colorInput must be set to an hsl value');
  const lightness = parseFloat(match[3]);
  assert.ok(
    lightness <= 68,
    `colorInput lightness must be ≤68% for visibility on white (got ${lightness}%)`,
  );
});

// ── Tests: colorNeutral (Google button) visibility ────────────────────────────

suite('022M colorNeutral Visibility');

test('colorNeutral is no longer the invisible 85% value', () => {
  assert.ok(
    !has("colorNeutral: 'hsl(140, 10%, 85%)'"),
    'colorNeutral must not remain at 85% lightness (Google button invisible)',
  );
});

test('colorNeutral is present and uses a visible lightness (≤68%)', () => {
  const match = appSrc.match(/colorNeutral:\s*'hsl\(\s*(\d+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)'/);
  assert.ok(match, 'colorNeutral must be set to an hsl value');
  const lightness = parseFloat(match[3]);
  assert.ok(
    lightness <= 68,
    `colorNeutral lightness must be ≤68% for visibility (got ${lightness}%)`,
  );
});

// ── Tests: Placeholder text readability ───────────────────────────────────────

suite('022M Placeholder Readability');

test('colorMutedForeground is present', () => {
  assert.ok(has('colorMutedForeground'), 'colorMutedForeground must be set in Clerk variables');
});

test('colorMutedForeground lightness is ≤45% for readable placeholders', () => {
  const match = appSrc.match(/colorMutedForeground:\s*'hsl\(\s*(\d+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)'/);
  assert.ok(match, 'colorMutedForeground must be set to an hsl value');
  const lightness = parseFloat(match[3]);
  assert.ok(
    lightness <= 45,
    `colorMutedForeground lightness must be ≤45% for readable placeholder text (got ${lightness}%)`,
  );
});

// ── Tests: Input field background differentiation ─────────────────────────────

suite('022M Input Background');

test('formFieldInput has a background class', () => {
  // Should have a bg- class to differentiate inputs from the white card
  const match = appSrc.match(/formFieldInput:\s*'([^']*)'/);
  assert.ok(match, 'formFieldInput element class must be present');
  assert.ok(
    match[1].includes('bg-') || match[1].includes('background'),
    `formFieldInput must include a background class (got: '${match[1]}')`,
  );
});

test('otpCodeFieldInput has a background class', () => {
  const match = appSrc.match(/otpCodeFieldInput:\s*'([^']*)'/);
  assert.ok(match, 'otpCodeFieldInput element class must be present');
  assert.ok(
    match[1].includes('bg-') || match[1].includes('background'),
    `otpCodeFieldInput must include a background class (got: '${match[1]}')`,
  );
});

// ── Tests: Focus ring / primary color preserved ───────────────────────────────

suite('022M Focus Ring Preserved');

test('colorPrimary (TrailWeigh green focus ring) unchanged', () => {
  assert.ok(
    has("colorPrimary: 'hsl(140, 15%, 35%)'"),
    'colorPrimary must remain hsl(140, 15%, 35%) for TrailWeigh green focus ring',
  );
});

test('colorInputForeground (input text) present and readable', () => {
  assert.ok(
    has('colorInputForeground'),
    'colorInputForeground must still be set for readable input text',
  );
});

// ── Tests: Authentication logic preserved ────────────────────────────────────

suite('022M Auth Logic Regression');

test('Clerk SignIn component still used (not replaced)', () => {
  assert.ok(
    has('<SignIn') && has('routing="path"'),
    'SignIn component with routing="path" must still be used',
  );
});

test('Clerk SignUp component still used (not replaced)', () => {
  assert.ok(
    has('<SignUp') && has('signInUrl='),
    'SignUp component must still be used with signInUrl prop',
  );
});

test('sign-in base path still set', () => {
  assert.ok(
    has('/sign-in') && has('signUpUrl='),
    'Sign-in path and signUpUrl must still be set',
  );
});

test('shadcn theme still applied', () => {
  assert.ok(
    has('theme: shadcn'),
    'Clerk appearance must still use the shadcn theme',
  );
});

test('cssLayerName clerk preserved', () => {
  assert.ok(
    has("cssLayerName: 'clerk'"),
    "cssLayerName: 'clerk' must still be set",
  );
});

// ── Tests: Card layout preserved ─────────────────────────────────────────────

suite('022M Card Layout Preserved');

test('White card preserved', () => {
  assert.ok(
    has('bg-white') && has('rounded-2xl'),
    'White card with rounded-2xl must still be present',
  );
});

test('Card width 440px preserved', () => {
  assert.ok(
    has('w-[440px]') || has('w-[440'),
    '440px card width must be preserved',
  );
});

test('Centered full-height sign-in layout preserved', () => {
  assert.ok(
    has('min-h-[100dvh]') && has('items-center') && has('justify-center'),
    'Full-height centered layout must be preserved',
  );
});

test('colorBackground (card background) preserved', () => {
  assert.ok(
    has("colorBackground: 'hsl(40, 20%, 97%)'"),
    'colorBackground must remain unchanged',
  );
});

// ── Tests: No visual regressions on other appearance elements ─────────────────

suite('022M Other Elements Preserved');

test('formFieldLabel font-medium preserved', () => {
  assert.ok(
    has("formFieldLabel: 'font-medium'"),
    'formFieldLabel must still have font-medium',
  );
});

test('footerActionLink font-semibold preserved', () => {
  assert.ok(
    has("footerActionLink: 'font-semibold'"),
    'footerActionLink font-semibold preserved',
  );
});

test('logoBox centering preserved', () => {
  assert.ok(
    has("logoBox: 'flex justify-center mb-2'"),
    'logoBox layout must be preserved',
  );
});

test('formButtonPrimary element present (not removed)', () => {
  assert.ok(
    has('formButtonPrimary'),
    'formButtonPrimary element key must still be present in appearance',
  );
});

// ── Results ───────────────────────────────────────────────────────────────────

const total = passed + failed;
console.log(`\n022M Sign-In Visibility: ${passed}/${total} passed${failed > 0 ? `, ${failed} failed` : ''}`);
if (failed > 0) process.exit(1);
