/**
 * Prompt 021A — Protect Private Checklist Access + Repair Locker Delete Authentication
 *
 * Structural tests verifying:
 *  A. Route guard — /checklist requires authentication
 *  B. Locker delete guard — signed-out deletion path removed
 *  C. Password re-verification API — signIn.create() replaces signIn.password()
 *  D. Public share route — /s/:id remains unauthenticated
 *  E. 021 share regressions — crash fix and data-ownership still intact
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const root  = join(__dir, '..', '..');

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${e.message}`);
    failed++;
  }
}

// ── Source files ──────────────────────────────────────────────────────────────

const checklist   = read('src/pages/Checklist.tsx');
const appTsx      = read('src/App.tsx');
const lockDlg     = read('src/components/LockerDeleteDialog.tsx');
const sharedPage  = read('src/pages/SharedChecklistPage.tsx');

// ── A. Route guard — /checklist requires authentication ───────────────────────

console.log('\nPrompt 021A — Protect Private Checklist Access\n');
console.log('A. Route guard — /checklist requires authentication');

test('Checklist default export imports Redirect from wouter', () => {
  assert.match(checklist, /import\s*\{[^}]*Redirect[^}]*\}\s*from\s*['"]wouter['"]/,
    'Redirect must be imported from wouter');
});

test('Checklist default export redirects to /sign-in when signed out', () => {
  assert.match(checklist, /<Redirect\s+to=["']\/sign-in["']/,
    'Must render <Redirect to="/sign-in" /> for unauthenticated users');
});

test('Signed-out path does NOT render ChecklistContent with isGuest', () => {
  // The old guest fallback was: <ChecklistContent key="guest" userId={undefined} isGuest />
  // It must no longer appear in the default export's signed-out branch.
  // Strategy: confirm key="guest" is not in the file at all (was only in guest fallback).
  assert.doesNotMatch(checklist, /key=["']guest["']/,
    'key="guest" (the old guest-access path) must not exist in Checklist.tsx');
});

test('Signed-out path does NOT render UnitProvider wrapping a guest ChecklistContent', () => {
  assert.doesNotMatch(checklist, /isGuest\s*\/>/,
    'isGuest self-closing (guest ChecklistContent render) must not appear in signed-out path');
});

test('Auth-loading state renders spinner, not private data', () => {
  // The !isLoaded branch must not render ChecklistContent
  const notLoadedBlock = checklist.match(/if\s*\(!isLoaded\)\s*\{([\s\S]*?)^\s*\}/m)?.[1] ?? '';
  assert.doesNotMatch(notLoadedBlock, /ChecklistContent/,
    'ChecklistContent must not render while !isLoaded');
});

test('Signed-in path still renders ChecklistContent with user.id key', () => {
  assert.match(checklist, /key=\{user\.id\}/,
    'Authenticated path must render ChecklistContent with key={user.id}');
});

test('Checklist default export checks isLoaded before rendering private content', () => {
  assert.match(checklist, /if\s*\(!isLoaded\)/,
    'isLoaded check must exist to show spinner before auth resolves');
});

test('/checklist route in App.tsx delegates to Checklist component (no inline auth bypass)', () => {
  assert.match(appTsx, /path="\/checklist"\s+component=\{ChecklistRoute\}/,
    '/checklist route must use ChecklistRoute component');
  // Must not have an old "guests use the local guest key" comment
  assert.doesNotMatch(appTsx, /guests use the local guest key/,
    'Old guest-access comment must be removed from App.tsx');
});

// ── B. Locker delete guard — signed-out deletion path removed ─────────────────

console.log('\nB. Locker delete guard — signed-out deletion path removed');

test('requestProtectedDelete returns early when isGuest=true', () => {
  // Must contain a guard that returns without deleting when isGuest/userId absent
  assert.match(checklist, /if\s*\(isGuest\s*\|\|\s*!userId\)\s*return/,
    'requestProtectedDelete must return early when isGuest || !userId');
});

test('requestProtectedDelete does NOT delete directly for unauthenticated users', () => {
  // The old unauthenticated path performed: lockerEntries.filter then setLockerEntries
  // inside the isGuest || !userId branch. This direct-delete path must be gone.
  const guardBlock = checklist.match(
    /requestProtectedDelete[\s\S]*?if\s*\(isGuest\s*\|\|\s*!userId\)([\s\S]*?)(?=setPendingDeleteIds|setShowDeleteDialog)/
  )?.[1] ?? '';
  assert.doesNotMatch(guardBlock, /setLockerEntries/,
    'setLockerEntries must NOT be called inside the unauthenticated guard block');
});

test('requestProtectedDelete proceeds to dialog only after auth check', () => {
  assert.match(checklist, /if\s*\(isGuest\s*\|\|\s*!userId\)\s*return;\s*\n\s*setPendingDeleteIds/,
    'After the auth guard return, setPendingDeleteIds must be the next statement');
});

test('isGuest prop still plumbed to LockerDeleteDialog (for dialog internal gating)', () => {
  assert.match(checklist, /isGuest=\{isGuest\}/,
    'isGuest prop must still be passed to LockerDeleteDialog');
});

test('No password or credential is written to localStorage in delete flow', () => {
  assert.doesNotMatch(checklist, /localStorage\.setItem\s*\(.*password/i,
    'No password should be written to localStorage');
  assert.doesNotMatch(lockDlg, /localStorage\.setItem\s*\(.*password/i,
    'LockerDeleteDialog must not write password to localStorage');
});

test('No password or credential is written to sessionStorage in delete flow', () => {
  // sessionStorage IS used for OAuth redirect IDs (entry IDs, not credentials) — allow that.
  // But no password value must be stored.
  assert.doesNotMatch(checklist, /sessionStorage\.setItem\s*\(.*password/i,
    'No password should be written to sessionStorage in Checklist');
  assert.doesNotMatch(lockDlg, /sessionStorage\.setItem\s*\(.*password/i,
    'LockerDeleteDialog must not write password to sessionStorage');
});

// ── C. Password re-verification API — signIn.create() replaces signIn.password() ──

console.log('\nC. Password re-verification API — signIn.create() instead of signIn.password()');

test('handlePasswordSubmit uses signIn.create() not signIn.password()', () => {
  assert.doesNotMatch(lockDlg, /signIn\.password\s*\(/,
    'signIn.password() must no longer be called — it is not a documented Clerk API');
  assert.match(lockDlg, /signIn\.create\s*\(/,
    'signIn.create() must be called for password verification');
});

test('signIn.create() receives strategy: "password"', () => {
  assert.match(lockDlg, /strategy:\s*['"]password['"]/,
    'create() call must specify strategy: "password"');
});

test('signIn.create() receives identifier field (not emailAddress field)', () => {
  assert.match(lockDlg, /identifier:\s*emailAddress/,
    'create() must use identifier field — not a custom emailAddress field');
});

test('signIn.create() receives password field', () => {
  assert.match(lockDlg, /password,/,
    'create() must receive the password shorthand field');
});

test('onConfirmed called when result.status === "complete"', () => {
  assert.match(lockDlg, /result\.status\s*===\s*['"]complete['"]/,
    'Must check result.status (from create()) not signIn.status');
});

test('setActive() is NOT called in code — existing session preserved', () => {
  // Strip single-line comment lines and JSDoc lines before checking, so that
  // the intentional "do NOT call setActive()" documentation doesn't false-positive.
  const codeLines = lockDlg.split('\n')
    .filter(l => !l.trim().startsWith('//') && !l.trim().startsWith('*'));
  const codeOnly = codeLines.join('\n');
  assert.doesNotMatch(codeOnly, /setActive\s*\(/,
    'setActive() must not appear in executable code — calling it replaces the active session');
});

test('Wrong-password error identified by Clerk error code', () => {
  assert.match(lockDlg, /form_password_incorrect/,
    'Must check for Clerk error code "form_password_incorrect" for wrong-password classification');
});

test('header comment updated to reflect signIn.create() (no signIn.password() documentation)', () => {
  assert.doesNotMatch(lockDlg, /signIn\.password\(\{/,
    'Header comment must no longer document signIn.password()');
  assert.match(lockDlg, /signIn\.create\(\{/,
    'Header comment must document signIn.create()');
});

// ── D. Public share route — /s/:id remains unauthenticated ───────────────────

console.log('\nD. Public share route — /s/:id remains publicly accessible');

test('/s/:id route in App.tsx has no auth guard', () => {
  assert.match(appTsx, /path="\/s\/:id"\s+component=\{SharedChecklistPage\}/,
    '/s/:id route must remain as-is (no auth wrapper)');
});

test('SharedChecklistPage does not import or use RedirectToSignIn', () => {
  assert.doesNotMatch(sharedPage, /RedirectToSignIn/,
    'SharedChecklistPage must not redirect unauthenticated viewers to sign-in');
});

test('SharedChecklistPage does not call setLocation("/sign-in") at top level', () => {
  // It can call setLocation for "Save Your Own Copy" sign-up redirect, but must not
  // redirect the viewer to /sign-in merely for viewing the shared pack.
  const topLevelRedirect = sharedPage.match(/setLocation\s*\(['"]\/sign-in['"]\)/g) ?? [];
  assert.equal(topLevelRedirect.length, 0,
    'SharedChecklistPage must not redirect to /sign-in for viewing');
});

// ── E. 021 Share regressions — crash fix and data-ownership still intact ─────

console.log('\nE. 021 share regression guard');

test('order prop still passed to GearCategory in SharedChecklistPage', () => {
  assert.match(sharedPage, /order=\{store\.order\}/,
    '021 crash fix — order={store.order} must still be in SharedChecklistPage');
});

test('moveItem prop still passed to GearCategory in SharedChecklistPage', () => {
  assert.match(sharedPage, /moveItem=\{moveItem\}/,
    '021 crash fix — moveItem={moveItem} must still be in SharedChecklistPage');
});

test('normalizeSnapshot still returns name and unit fields', () => {
  assert.match(sharedPage, /name:\s*typeof raw\.name/,
    'normalizeSnapshot must still forward name field');
  assert.match(sharedPage, /unit:\s*\(raw\.unit/,
    'normalizeSnapshot must still forward unit field');
});

// ── Results ───────────────────────────────────────────────────────────────────

console.log('\n────────────────────────────────────────────────────');
console.log(`021A tests: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.error(`\n${failed} test(s) failed.`);
  process.exit(1);
} else {
  console.log(`All ${passed} 021A tests passed.\n`);
  console.log('⚠️  Automated tests verify structural correctness only.');
  console.log('Auth gate, delete guard, and password re-verification');
  console.log('require the user\'s fresh signed-in/signed-out browser tests.');
}
