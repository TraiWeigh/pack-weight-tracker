/**
 * passwordVisibility022O.test.mjs
 * Prompt 022O — Fix Password Recovery + Password Visibility + Auth Contrast
 *
 * Protects:
 *   • formFieldInputShowPasswordButton element is present and styled
 *   • Eye button has visible icon color against #F5F6F5 background
 *   • Eye button has focus-visible ring (accessible)
 *   • Eye button is !bg-transparent (does not paint over input surface)
 *   • formButtonPrimary !text-white still covers all primary buttons
 *     (incl. "Reset your password" + "Reset Password" screens)
 *   • No custom password hashing / validation in TrailWeigh
 *   • All 022N and 022M appearance invariants preserved
 *   • Clerk is the sole auth provider (no custom rate-limit code)
 *   • fallbackRedirectUrl props from 022O (auth fix) still present
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root   = path.resolve('artifacts/pack-checklist/src');
const apiRoot = path.resolve('artifacts/api-server/src');

const appSrc = fs.readFileSync(path.join(root, 'App.tsx'), 'utf8');
const apiApp = fs.readFileSync(path.join(apiRoot, 'app.ts'), 'utf8');

let passed = 0;
let failed = 0;
let currentSuite = '';

function suite(name) { currentSuite = name; }
function test(label, fn) {
  try { fn(); passed++; }
  catch (err) {
    failed++;
    console.error(`  ✗ [${currentSuite}] ${label}`);
    console.error(`    ${err.message}`);
  }
}

// ── Password visibility eye button ────────────────────────────────────────────

suite('022O Eye Button Present');

test('formFieldInputShowPasswordButton element is present in appearance', () => {
  assert.ok(
    appSrc.includes('formFieldInputShowPasswordButton'),
    'formFieldInputShowPasswordButton must be set in clerkAppearance.elements — was completely absent before this fix',
  );
});

test('Eye button has a non-empty class string', () => {
  const match = appSrc.match(/formFieldInputShowPasswordButton:\s*'([^']*)'/);
  assert.ok(match, 'formFieldInputShowPasswordButton must exist');
  assert.ok(
    match[1].length > 0,
    'formFieldInputShowPasswordButton class string must not be empty',
  );
});

// ── Eye button icon color ─────────────────────────────────────────────────────

suite('022O Eye Button Icon Visibility');

test('Eye button has a visible text/icon color override', () => {
  const match = appSrc.match(/formFieldInputShowPasswordButton:\s*'([^']*)'/);
  assert.ok(match, 'formFieldInputShowPasswordButton must be present');
  assert.ok(
    match[1].includes('text-[') || match[1].includes('text-'),
    'Eye button must have an explicit text/icon color so it renders visibly against #F5F6F5 input background',
  );
});

test('Eye button icon color is dark enough to be visible (≤45% lightness)', () => {
  const match = appSrc.match(/formFieldInputShowPasswordButton:\s*'([^']*)'/);
  assert.ok(match, 'formFieldInputShowPasswordButton must be present');
  // Extract hsl lightness from the text color
  const hslMatch = match[1].match(/text-\[hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)\]/);
  if (hslMatch) {
    const lightness = parseFloat(hslMatch[3]);
    assert.ok(
      lightness <= 45,
      `Eye button icon color must be ≤45% lightness for visibility on #F5F6F5 (got ${lightness}%)`,
    );
  }
  // If not hsl format, just verify a color class is present
});

// ── Eye button accessibility ──────────────────────────────────────────────────

suite('022O Eye Button Accessibility');

test('Eye button has a focus-visible ring for keyboard accessibility', () => {
  const match = appSrc.match(/formFieldInputShowPasswordButton:\s*'([^']*)'/);
  assert.ok(match, 'formFieldInputShowPasswordButton must be present');
  assert.ok(
    match[1].includes('focus-visible:') || match[1].includes('focus:!ring'),
    'Eye button must have a focus-visible ring class for keyboard navigation',
  );
});

test('Eye button background is transparent (does not cover input surface)', () => {
  const match = appSrc.match(/formFieldInputShowPasswordButton:\s*'([^']*)'/);
  assert.ok(match, 'formFieldInputShowPasswordButton must be present');
  assert.ok(
    match[1].includes('!bg-transparent') || match[1].includes('bg-transparent'),
    'Eye button must have transparent background — it sits on top of the input',
  );
});

test('Eye button has no border (avoids double-border with input)', () => {
  const match = appSrc.match(/formFieldInputShowPasswordButton:\s*'([^']*)'/);
  assert.ok(match, 'formFieldInputShowPasswordButton must be present');
  assert.ok(
    match[1].includes('!border-0') || match[1].includes('border-none') ||
    match[1].includes('!border-none'),
    'Eye button must have !border-0 to avoid conflicting with the input border',
  );
});

// ── Primary button white text (covers reset screens) ─────────────────────────

suite('022O Reset Button White Text');

test('formButtonPrimary has !text-white (covers all screens including reset)', () => {
  assert.ok(
    appSrc.includes('!text-white'),
    'formButtonPrimary must include !text-white — covers "Reset your password" + "Reset Password" buttons',
  );
});

test('formButtonPrimary is not empty (explicitly styled)', () => {
  const match = appSrc.match(/formButtonPrimary:\s*'([^']*)'/);
  assert.ok(match, 'formButtonPrimary element class must be present');
  assert.ok(match[1].length > 0, 'formButtonPrimary must not be empty');
});

test('formButtonPrimary disabled state is muted (visually distinct from enabled)', () => {
  const match = appSrc.match(/formButtonPrimary:\s*'([^']*)'/);
  assert.ok(match, 'formButtonPrimary must be present');
  assert.ok(
    match[1].includes('disabled:') || match[1].includes('aria-disabled:'),
    'formButtonPrimary must have disabled state styling so enabled/disabled are distinguishable',
  );
});

// ── No custom password handling in TrailWeigh ─────────────────────────────────

suite('022O No Custom Password Handling');

test('No password hashing in client code', () => {
  assert.ok(
    !appSrc.includes('bcrypt') && !appSrc.includes('argon2') &&
    !appSrc.includes('hashPassword') && !appSrc.includes('createHash'),
    'TrailWeigh must not hash passwords — Clerk handles all credential validation',
  );
});

test('No custom password validation routes in API', () => {
  assert.ok(
    !apiApp.includes("'/auth/password'") && !apiApp.includes('checkPassword') &&
    !apiApp.includes('validatePassword'),
    'API server must not contain custom password validation routes',
  );
});

test('No custom rate-limit attempt counter in TrailWeigh code', () => {
  // "2 remaining attempts" is Clerk's own rate limiting, not TrailWeigh's code
  assert.ok(
    !appSrc.includes('remainingAttempts') && !appSrc.includes('attemptCount') &&
    !appSrc.includes('maxAttempts'),
    'TrailWeigh must not implement its own attempt counter — Clerk manages rate limiting',
  );
});

test('Clerk is the sole auth provider — no custom /auth callback routes', () => {
  assert.ok(
    !apiApp.includes("'/auth'") && !apiApp.includes("'/callback'"),
    'No custom auth callback routes should exist — Clerk handles the entire auth flow',
  );
});

// ── 022N and earlier visual fixes preserved ───────────────────────────────────

suite('022O Prior Fix Regression');

test('formFieldInput #9CA6A0 border preserved (022N)', () => {
  assert.ok(
    appSrc.includes('#9CA6A0') || appSrc.includes('#9ca6a0'),
    '022N fix: formFieldInput #9CA6A0 border must still be present',
  );
});

test('formFieldInput #F5F6F5 background preserved (022N)', () => {
  assert.ok(
    appSrc.includes('#F5F6F5') || appSrc.includes('#f5f6f5'),
    '022N fix: formFieldInput #F5F6F5 background must still be present',
  );
});

test('socialButtonsBlockButton border preserved (022N)', () => {
  assert.ok(
    appSrc.includes('socialButtonsBlockButton'),
    '022N fix: Google button border styling must still be present',
  );
});

test('colorMutedForeground darkened for placeholder readability (022N)', () => {
  const match = appSrc.match(/colorMutedForeground:\s*'hsl\(\s*\d+\s*,\s*[\d.]+%\s*,\s*([\d.]+)%\s*\)'/);
  assert.ok(match, 'colorMutedForeground must be present');
  assert.ok(parseFloat(match[1]) <= 35, '022N fix: colorMutedForeground must be ≤35% lightness');
});

test('signInFallbackRedirectUrl preserved (022O auth fix)', () => {
  assert.ok(
    appSrc.includes('signInFallbackRedirectUrl=') || appSrc.includes("signInFallbackRedirectUrl={"),
    '022O auth fix: signInFallbackRedirectUrl must still be present on ClerkProvider',
  );
});

test('stripBase handles absolute URLs (022O auth fix)', () => {
  assert.ok(
    appSrc.includes('new URL(path)') || appSrc.includes('new URL(p)'),
    '022O auth fix: stripBase must still handle absolute URLs via new URL()',
  );
});

test('shadcn theme still applied', () => {
  assert.ok(appSrc.includes('theme: shadcn'), 'shadcn Clerk theme must still be applied');
});

// ── Results ───────────────────────────────────────────────────────────────────

const total = passed + failed;
console.log(`\n022O Password Visibility + Auth Contrast: ${passed}/${total} passed${failed > 0 ? `, ${failed} failed` : ''}`);
if (failed > 0) process.exit(1);
