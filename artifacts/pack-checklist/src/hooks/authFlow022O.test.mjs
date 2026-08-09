/**
 * authFlow022O.test.mjs — Prompt 022O: Diagnose & Fix Replit Auth Sign-In Failure
 *
 * Protects:
 *   • stripBase handles absolute URLs (OAuth callback protection)
 *   • <SignIn> and <SignUp> in App.tsx have fallbackRedirectUrl
 *   • <ClerkProvider> has signInFallbackRedirectUrl + signUpFallbackRedirectUrl
 *   • No custom password validation anywhere in TrailWeigh
 *   • No express-session / custom session middleware in API server
 *   • Clerk is the sole auth provider (no custom /auth or /callback routes)
 *   • 022N visual fixes preserved (formButtonPrimary !text-white, formFieldInput border)
 *   • Dead SignInPage.tsx / SignUpPage.tsx updated with fallbackRedirectUrl
 */

import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve('artifacts/pack-checklist/src');
const apiRoot = path.resolve('artifacts/api-server/src');

const appSrc     = fs.readFileSync(path.join(root, 'App.tsx'), 'utf8');
const signInPage = fs.readFileSync(path.join(root, 'pages/SignInPage.tsx'), 'utf8');
const signUpPage = fs.readFileSync(path.join(root, 'pages/SignUpPage.tsx'), 'utf8');
const apiApp     = fs.readFileSync(path.join(apiRoot, 'app.ts'), 'utf8');

let passed = 0;
let failed = 0;

function suite(name) { currentSuite = name; }
let currentSuite = '';

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

// ── stripBase absolute-URL fix ────────────────────────────────────────────────

suite('022O stripBase Absolute URL Fix');

test('stripBase function handles absolute URLs via URL constructor (new URL)', () => {
  assert.ok(
    appSrc.includes('new URL(path)') || appSrc.includes('new URL(p)'),
    'stripBase must use new URL() to handle absolute URLs from Clerk OAuth callbacks',
  );
});

test('stripBase still strips basePath from relative paths', () => {
  assert.ok(
    appSrc.includes('p.startsWith(basePath)') ||
    appSrc.includes('path.startsWith(basePath)'),
    'stripBase must still strip basePath from relative path strings',
  );
});

test('stripBase handles URL parse failure gracefully (try/catch)', () => {
  assert.ok(
    appSrc.includes('try {') && appSrc.includes('} catch {'),
    'stripBase must wrap new URL() in try/catch for non-URL strings',
  );
});

// ── <SignIn> fallbackRedirectUrl ───────────────────────────────────────────────

suite('022O SignIn fallbackRedirectUrl');

test('ClerkProvider in App.tsx has signInFallbackRedirectUrl', () => {
  assert.ok(
    appSrc.includes('signInFallbackRedirectUrl='),
    '<ClerkProvider> must have signInFallbackRedirectUrl so Clerk always has a post-sign-in destination',
  );
});

test('ClerkProvider in App.tsx has signUpFallbackRedirectUrl', () => {
  assert.ok(
    appSrc.includes('signUpFallbackRedirectUrl='),
    '<ClerkProvider> must have signUpFallbackRedirectUrl so Clerk always has a post-sign-up destination',
  );
});

test('Inline SignInPage in App.tsx has fallbackRedirectUrl', () => {
  // The inline SignInPage function defined directly in App.tsx must have fallbackRedirectUrl
  assert.ok(
    appSrc.includes('fallbackRedirectUrl='),
    'Inline <SignIn> in App.tsx must have fallbackRedirectUrl prop',
  );
});

test('Inline SignUpPage in App.tsx has fallbackRedirectUrl', () => {
  // Count occurrences — should be in both SignIn and SignUp
  const count = (appSrc.match(/fallbackRedirectUrl=/g) || []).length;
  assert.ok(
    count >= 2,
    `Both <SignIn> and <SignUp> in App.tsx must have fallbackRedirectUrl (found ${count})`,
  );
});

test('fallbackRedirectUrl references basePath', () => {
  assert.ok(
    appSrc.includes('fallbackRedirectUrl={`${basePath}/`}') ||
    appSrc.includes("fallbackRedirectUrl={`${basePath}/`}") ||
    appSrc.includes('fallbackRedirectUrl={basePath'),
    'fallbackRedirectUrl must be based on basePath to work with the Vite base URL',
  );
});

test('Standalone SignInPage.tsx updated with fallbackRedirectUrl', () => {
  assert.ok(
    signInPage.includes('fallbackRedirectUrl='),
    'Standalone SignInPage.tsx must also have fallbackRedirectUrl (kept in sync)',
  );
});

test('Standalone SignUpPage.tsx updated with fallbackRedirectUrl', () => {
  assert.ok(
    signUpPage.includes('fallbackRedirectUrl='),
    'Standalone SignUpPage.tsx must also have fallbackRedirectUrl (kept in sync)',
  );
});

// ── No custom password validation ─────────────────────────────────────────────

suite('022O No Password Validation in TrailWeigh');

test('App.tsx does not contain password hashing (bcrypt/argon2/crypto.hash)', () => {
  assert.ok(
    !appSrc.includes('bcrypt') && !appSrc.includes('argon2') &&
    !appSrc.includes('createHash') && !appSrc.includes('hashSync'),
    'TrailWeigh must not hash passwords — Clerk handles all credential validation',
  );
});

test('API server does not store or compare passwords', () => {
  assert.ok(
    !apiApp.includes('password') && !apiApp.includes('bcrypt') &&
    !apiApp.includes('hashPassword'),
    'API server must not contain password storage or comparison logic',
  );
});

test('No /auth or /callback custom route in API server', () => {
  // Clerk handles auth entirely — no custom auth callback routes should exist
  assert.ok(
    !apiApp.includes("'/auth'") && !apiApp.includes('"/auth"') &&
    !apiApp.includes("'/callback'") && !apiApp.includes('"/callback"'),
    'API server must not define custom /auth or /callback routes — Clerk handles auth',
  );
});

// ── No express-session (auth managed by Clerk) ────────────────────────────────

suite('022O No Custom Session Middleware');

test('API server does not use express-session', () => {
  assert.ok(
    !apiApp.includes('express-session') && !apiApp.includes('session({'),
    'API server must not use express-session — Clerk manages auth state',
  );
});

test('API server does not set custom session cookies', () => {
  assert.ok(
    !apiApp.includes("res.cookie('session") && !apiApp.includes('Set-Cookie'),
    'API server must not set manual session cookies',
  );
});

// ── Clerk is the sole auth provider ───────────────────────────────────────────

suite('022O Clerk as Sole Auth Provider');

test('ClerkProvider wraps the entire app', () => {
  assert.ok(
    appSrc.includes('<ClerkProvider') && appSrc.includes('</ClerkProvider>'),
    'ClerkProvider must wrap the app as the sole auth provider',
  );
});

test('publishableKeyFromHost is used (Replit-managed Clerk pattern)', () => {
  assert.ok(
    appSrc.includes('publishableKeyFromHost'),
    'publishableKeyFromHost must be used for Replit-managed Clerk key selection',
  );
});

test('routing="path" on both SignIn and SignUp', () => {
  const count = (appSrc.match(/routing="path"/g) || []).length;
  assert.ok(
    count >= 2,
    `routing="path" must appear on both <SignIn> and <SignUp> (found ${count})`,
  );
});

test('Clerk proxy is production-only (not breaking development auth)', () => {
  const proxyMiddlewareSrc = fs.readFileSync(
    path.resolve('artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts'), 'utf8'
  );
  assert.ok(
    proxyMiddlewareSrc.includes("NODE_ENV !== 'production'") ||
    proxyMiddlewareSrc.includes('NODE_ENV !== "production"'),
    'Clerk proxy middleware must be production-only — dev auth must go direct',
  );
});

// ── 022N visual regression check ──────────────────────────────────────────────

suite('022O 022N Visual Regression');

test('formButtonPrimary !text-white preserved from 022N', () => {
  assert.ok(
    appSrc.includes('!text-white'),
    '022N fix: formButtonPrimary !text-white must still be present',
  );
});

test('formFieldInput explicit #9CA6A0 border preserved from 022N', () => {
  assert.ok(
    appSrc.includes('#9CA6A0') || appSrc.includes('#9ca6a0'),
    '022N fix: explicit #9CA6A0 border on formFieldInput must still be present',
  );
});

test('shadcn theme still applied', () => {
  assert.ok(appSrc.includes('theme: shadcn'), 'shadcn Clerk theme must still be applied');
});

// ── Results ───────────────────────────────────────────────────────────────────

const total = passed + failed;
console.log(`\n022O Auth Flow Fix: ${passed}/${total} passed${failed > 0 ? `, ${failed} failed` : ''}`);
if (failed > 0) process.exit(1);
