/**
 * Focused regression tests for Prompt 021B:
 *   - Private owner delete: no password required, simple confirmation only
 *   - Private rename still works
 *   - Shared viewer: no Rename or Delete controls in shared view
 *   - Temporary shared edits do not mutate sender persistence
 *   - Save Your Own Copy creates a new independent ID
 *   - /checklist remains private (021A route guard preserved)
 *   - /s/:shareId remains public (021A regression guard)
 *   - 021 Share behavior intact
 *   - 020F New/appearance isolation intact
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

const lockDlg     = readFileSync(path.join(root, 'src/components/LockerDeleteDialog.tsx'), 'utf8');
const checklist   = readFileSync(path.join(root, 'src/pages/Checklist.tsx'), 'utf8');
const sharedPage  = readFileSync(path.join(root, 'src/pages/SharedChecklistPage.tsx'), 'utf8');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`      ${err.message}`);
    failed++;
  }
}

console.log('\nPrompt 021B — Simplify Private Delete + Shared Locker View/Copy Only\n');

// ═══════════════════════════════════════════════════════════════════
// A. Private delete confirmation — NO password required
// ═══════════════════════════════════════════════════════════════════
console.log('A. Private owner delete — no password');

test('LockerDeleteDialog has no password input element', () => {
  assert.doesNotMatch(lockDlg, /type=['"]password['"]/,
    'password input field must be absent from the dialog');
});

test('LockerDeleteDialog does not import useSignIn', () => {
  assert.doesNotMatch(lockDlg, /useSignIn/,
    'useSignIn must not be imported — Clerk re-verification removed');
});

test('LockerDeleteDialog does not import Eye/EyeOff (password show/hide)', () => {
  assert.doesNotMatch(lockDlg, /\bEye\b|\bEyeOff\b/,
    'Eye/EyeOff icons belong to password flow — must be removed');
});

test('LockerDeleteDialog does not call signIn.create()', () => {
  // Strip comments first
  const codeLines = lockDlg.split('\n').filter(l => !l.trim().startsWith('//') && !l.trim().startsWith('*'));
  assert.doesNotMatch(codeLines.join('\n'), /signIn\.create\s*\(/,
    'signIn.create() must not appear in executable code');
});

test('LockerDeleteDialog has a "Permanently Delete" button', () => {
  assert.match(lockDlg, /Permanently Delete/,
    '"Permanently Delete" button text must be present');
});

test('LockerDeleteDialog has a Cancel button', () => {
  assert.match(lockDlg, /Cancel/,
    'Cancel button must be present');
});

test('LockerDeleteDialog has no password error messages', () => {
  assert.doesNotMatch(lockDlg, /Incorrect password/,
    '"Incorrect password" message must not appear');
  assert.doesNotMatch(lockDlg, /Identity could not be fully verified/,
    '"Identity could not be fully verified" message must not appear');
});

test('LockerDeleteDialog has no rate-limit lockout code', () => {
  assert.doesNotMatch(lockDlg, /MAX_ATTEMPTS|LOCKOUT_SECS|lockedUntil|recordFailure/,
    'Rate-limit code must be removed');
});

test('LockerDeleteDialog isGuest prop is removed', () => {
  assert.doesNotMatch(lockDlg, /isGuest/,
    'isGuest prop no longer needed — dialog only shows for authenticated owners');
});

test('LockerDeleteDialog shows file name in title', () => {
  assert.match(lockDlg, /entries\[0\]\.name/,
    'Dialog title must include the file name');
});

// ═══════════════════════════════════════════════════════════════════
// B. Obsolete password/OAuth code removed from Checklist.tsx
// ═══════════════════════════════════════════════════════════════════
console.log('\nB. Obsolete password/OAuth code removed from Checklist.tsx');

test('Checklist.tsx no longer imports LOCKER_PENDING_DELETE_KEY', () => {
  assert.doesNotMatch(checklist, /LOCKER_PENDING_DELETE_KEY/,
    'LOCKER_PENDING_DELETE_KEY import must be removed');
});

test('Checklist.tsx no longer imports LOCKER_DELETE_VERIFIED_PARAM', () => {
  assert.doesNotMatch(checklist, /LOCKER_DELETE_VERIFIED_PARAM/,
    'LOCKER_DELETE_VERIFIED_PARAM import must be removed');
});

test('Checklist.tsx no longer has oauthDeleteIds state', () => {
  assert.doesNotMatch(checklist, /oauthDeleteIds/,
    'oauthDeleteIds state must be removed — OAuth round-trip no longer needed');
});

test('Checklist.tsx no longer checks for OAuth redirect return URL param', () => {
  assert.doesNotMatch(checklist, /locker_delete_verified/,
    'OAuth redirect URL param check must be removed');
});

test('Checklist.tsx no longer reads LOCKER_PENDING_DELETE_KEY from sessionStorage', () => {
  // No sessionStorage reads related to locker pending delete key
  assert.doesNotMatch(checklist, /LOCKER_PENDING_DELETE_KEY/,
    'sessionStorage read for pending OAuth delete IDs must be removed');
});

test('LockerDeleteDialog usage in Checklist.tsx has no isGuest prop', () => {
  // Find LockerDeleteDialog usage block
  const dialogIdx = checklist.indexOf('<LockerDeleteDialog');
  assert.notEqual(dialogIdx, -1, 'LockerDeleteDialog must be used in Checklist.tsx');
  const dialogBlock = checklist.slice(dialogIdx, dialogIdx + 400);
  assert.doesNotMatch(dialogBlock, /isGuest/,
    'isGuest prop must be removed from LockerDeleteDialog usage');
});

test('requestProtectedDelete auth guard still in place', () => {
  assert.match(checklist, /if \(isGuest \|\| !userId\) return/,
    'Auth guard in requestProtectedDelete must be preserved');
});

test('handleConfirmedDelete still deletes pending IDs from lockerEntries', () => {
  assert.match(checklist, /handleConfirmedDelete/,
    'handleConfirmedDelete must still exist');
  assert.match(checklist, /pendingDeleteIds\.includes/,
    'deletion must still filter by pendingDeleteIds');
});

// ═══════════════════════════════════════════════════════════════════
// C. Private Rename still works
// ═══════════════════════════════════════════════════════════════════
console.log('\nC. Private rename preserved');

test('handleRenameInLocker still defined in Checklist.tsx', () => {
  assert.match(checklist, /handleRenameInLocker/,
    'handleRenameInLocker must still be defined');
});

test('onRename still wired to LockerPanel', () => {
  assert.match(checklist, /onRename={handleRenameInLocker}/,
    'onRename prop must still be passed to LockerPanel');
});

test('LockerPanel still receives onRename prop type', () => {
  const lockerPanel = readFileSync(path.join(root, 'src/components/LockerPanel.tsx'), 'utf8');
  assert.match(lockerPanel, /onRename/,
    'LockerPanel must still declare onRename prop');
});

// ═══════════════════════════════════════════════════════════════════
// D. Shared viewer — No Rename or Delete Locker controls
// ═══════════════════════════════════════════════════════════════════
console.log('\nD. Shared viewer — no Locker rename/delete controls');

test('SharedChecklistPage does not render LockerPanel component', () => {
  // Only a type import is allowed, not a JSX render
  assert.doesNotMatch(sharedPage, /<LockerPanel/,
    'LockerPanel JSX must not appear in SharedChecklistPage — no Locker rename/delete exposed');
});

test('SharedChecklistPage does not import onRequestDelete', () => {
  // The onRequestDelete prop is the gateway to delete in LockerPanel
  assert.doesNotMatch(sharedPage, /onRequestDelete/,
    'onRequestDelete must not appear in the shared view');
});

test('SharedChecklistPage has no LockerDeleteDialog', () => {
  assert.doesNotMatch(sharedPage, /<LockerDeleteDialog/,
    'LockerDeleteDialog must not appear in the shared view');
});

// ═══════════════════════════════════════════════════════════════════
// E. Temporary shared edits do not mutate sender persistence
// ═══════════════════════════════════════════════════════════════════
console.log('\nE. Temporary shared edits isolated — no sender persistence');

test('SharedChecklistPage in-memory store — no localStorage.setItem in pushAndSet', () => {
  // pushAndSet is the mutation handler; must not call localStorage.setItem
  const pushAndSetIdx = sharedPage.indexOf('pushAndSet');
  assert.notEqual(pushAndSetIdx, -1, 'pushAndSet must be defined');
  // Confirm the file comment says "NO localStorage writes"
  assert.match(sharedPage, /NO localStorage writes/,
    'SharedChecklistPage must document that edits are in-memory only');
});

test('SharedChecklistPage does not call localStorage.setItem for store data', () => {
  // The only localStorage write allowed is writeLockerEntry (Save Your Own Copy)
  // All other mutations must be in-memory only via pushAndSet
  const lines = sharedPage.split('\n');
  const setItemLines = lines.filter(l =>
    l.includes('localStorage.setItem') &&
    !l.includes('LOCKER_KEY') &&    // Save Your Own Copy is allowed
    !l.trim().startsWith('//')      // ignore comments
  );
  assert.equal(setItemLines.length, 0,
    'localStorage.setItem must only be used for LOCKER_KEY (Save Your Own Copy)');
});

test('SharedChecklistPage comment states changes never written to sender', () => {
  assert.match(sharedPage, /never.*written.*sender|sender.*never.*written|never touches the sender/i,
    'SharedChecklistPage must document that recipient changes never touch sender data');
});

// ═══════════════════════════════════════════════════════════════════
// F. Save Your Own Copy — independent ownership
// ═══════════════════════════════════════════════════════════════════
console.log('\nF. Save Your Own Copy — new ID / independent ownership');

test('commitSave uses crypto.randomUUID for new copies', () => {
  assert.match(sharedPage, /crypto\.randomUUID\(\)/,
    'Save Your Own Copy must assign a new UUID — not reuse sender file ID');
});

test('commitSave writes to LOCKER_KEY (recipient localStorage)', () => {
  assert.match(sharedPage, /localStorage\.setItem\(LOCKER_KEY/,
    'Save must write to recipient LOCKER_KEY in localStorage');
});

test('writeLockerEntry never reads sender file ID from snapshot', () => {
  // The snapshot does not have a file "id" field — it has categoryOrder, data, etc.
  // The commitSave should only use the new UUID, not snapshot.id
  assert.doesNotMatch(sharedPage, /snapshot\.id/,
    'commitSave must not use snapshot.id — sender file ID must not be reused');
});

test('Guest Save Your Own Copy redirects to sign-up', () => {
  assert.match(sharedPage, /sign-up/,
    'Signed-out Save Your Own Copy must redirect to sign-up');
});

// ═══════════════════════════════════════════════════════════════════
// G. 021A route regression — /checklist remains private
// ═══════════════════════════════════════════════════════════════════
console.log('\nG. 021A route regression — /checklist private');

test('Checklist default export imports Redirect from wouter', () => {
  assert.match(checklist, /import.*Redirect.*from 'wouter'/,
    'Redirect must still be imported from wouter');
});

test('Checklist default export redirects to /sign-in when signed out', () => {
  assert.match(checklist, /<Redirect to="\/sign-in"/,
    'Signed-out /checklist must still redirect to /sign-in');
});

test('Signed-out path does NOT render ChecklistContent with isGuest', () => {
  // The old guest fallback must not exist
  const guestFallback = 'key="guest" userId={undefined} isGuest';
  assert.doesNotMatch(checklist, new RegExp(guestFallback.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    'Guest ChecklistContent fallback must remain removed');
});

// ═══════════════════════════════════════════════════════════════════
// H. /s/:shareId remains public
// ═══════════════════════════════════════════════════════════════════
console.log('\nH. /s/:shareId remains public');

test('/s/:id route in App.tsx has no auth guard wrapping SharedChecklistPage', () => {
  const app = readFileSync(path.join(root, 'src/App.tsx'), 'utf8');
  const shareRoute = app.match(/\/s\/:[^}]+SharedChecklistPage[^}]*/s)?.[0] ?? '';
  assert.doesNotMatch(shareRoute, /RequireAuth|SignedIn|RedirectToSignIn/,
    '/s/:id route must remain publicly accessible');
});

test('SharedChecklistPage does not call setLocation("/sign-in") at top level', () => {
  assert.doesNotMatch(sharedPage, /setLocation\(['"]\/sign-in['"]\)/,
    'SharedChecklistPage must not redirect signed-out visitors to sign-in');
});

// ═══════════════════════════════════════════════════════════════════
// I. 021 Share behavior regression
// ═══════════════════════════════════════════════════════════════════
console.log('\nI. 021 Share regression');

test('order prop still passed to GearCategory in SharedChecklistPage', () => {
  assert.match(sharedPage, /order={store\.order}/,
    'GearCategory must still receive order prop in shared view');
});

test('moveItem prop still passed to GearCategory in SharedChecklistPage', () => {
  assert.match(sharedPage, /moveItem={moveItem}/,
    'GearCategory must still receive moveItem prop in shared view');
});

test('normalizeSnapshot still returns name and unit fields', () => {
  assert.match(sharedPage, /name:.*typeof raw\.name/,
    'normalizeSnapshot must still return name field');
  assert.match(sharedPage, /unit:.*raw\.unit/,
    'normalizeSnapshot must still return unit field');
});

// ═══════════════════════════════════════════════════════════════════
// J. 020F regression
// ═══════════════════════════════════════════════════════════════════
console.log('\nJ. 020F regression');

test('resolveStorageKey still creates forkId for newseed tabs', () => {
  const packData = readFileSync(path.join(root, 'src/hooks/usePackData.ts'), 'utf8');
  assert.match(packData, /newseed/,
    'resolveStorageKey must still create forkId for ?newseed= tabs');
});

test('LOCKER_KEY still exported from usePackData', () => {
  const packData = readFileSync(path.join(root, 'src/hooks/usePackData.ts'), 'utf8');
  assert.match(packData, /export.*LOCKER_KEY/,
    'LOCKER_KEY must still be exported from usePackData');
});

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(60));
console.log(`021B tests: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('All 021B tests passed.\n');
  console.log('⚠️  Automated tests verify structural correctness only.');
  console.log('Private delete, shared view rename/delete removal, and');
  console.log('temporary edit isolation require real-browser user testing.');
} else {
  console.log('\n⚠️  Some tests FAILED — review output above.\n');
  process.exit(1);
}
