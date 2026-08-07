# Prompt 021A Report — Protect Private Checklist Access + Repair Locker Delete Authentication

**Status:** COMPLETE — NOT USER-VERIFIED  
**Date:** 2026-08-07  
**Prior functional status:** 020F = USER-TESTED PASS | 021 core Share = USER-TESTED PASS

---

## Exact Prompt 021A Requirements

Three confirmed user-tested failures required fixes:

1. **FAILURE 1** — Signed-out user navigated to `/checklist` directly. Full private checklist, active file, backgrounds, and Locker were visible without any sign-in prompt.
2. **FAILURE 2** — While signed out (with the private Locker still visible due to Failure 1), user deleted file "fdfd" without entering any password or authentication.
3. **FAILURE 3** — While properly signed in, user attempted to delete a Locker file. Entered the correct account password. TrailWeigh returned "Incorrect password. Nothing was deleted."

Goals:
1. Make `/checklist` private — require authentication to access.
2. Keep `/s/:shareId` public (no sign-in required to view a shared pack).
3. Block all signed-out deletion paths, including defensive code guards.
4. Fix signed-in password re-verification so correct credentials are accepted.
5. Preserve all working Prompt 021 Share UX and 020F appearance/New behavior.
6. No localStorage/IndexedDB data deletion on sign-out.

---

## Starting State (before 021A)

### FAILURE 1 root cause — `/checklist` allowed unauthenticated access

`App.tsx` `ChecklistRoute`:
```javascript
function ChecklistRoute() {
  // Allow access whether signed in or not — guests use the local guest key
  return <Checklist />;
}
```

`Checklist.tsx` default export — final fallback (lines 1725–1729 before fix):
```javascript
return (
  <UnitProvider>
    <ChecklistContent key="guest" userId={undefined} isGuest />
  </UnitProvider>
);
```

When Clerk resolved with no signed-in user, the component fell through to `<ChecklistContent isGuest>`. This rendered the full checklist, reading from `localStorage` under the guest storage key. All locally stored gear items, Locker entries, filenames, backgrounds, and other private data were displayed to any visitor who typed `/checklist` into the address bar.

The `isLoaded` spinner was already correct — it showed a spinner with no private data during the Clerk loading phase. Only the post-load, signed-out branch was the problem.

### FAILURE 2 root cause — unauthenticated guest deletion path

`Checklist.tsx` `requestProtectedDelete` (lines 1042–1057 before fix):
```javascript
const requestProtectedDelete = useCallback((id: string) => {
  if (isGuest || !userId) {
    // No auth system available — delete directly (preserve existing guest UX).
    const updated = lockerEntries.filter(e => e.id !== id);
    setLockerEntries(updated);
    broadcastLocker(updated);
    const curA = readActiveLockerFileFromSS();
    const nextA = curA?.id === id ? null : curA;
    writeActiveLockerFileToSS(nextA);
    setActiveLockerFile(nextA);
    return;
  }
  setPendingDeleteIds([id]);
  setShowDeleteDialog(true);
}, [isGuest, userId, lockerEntries, broadcastLocker]);
```

When `isGuest=true` (which was true for any signed-out visitor who reached `/checklist`), this function **deleted the file immediately** — no password, no confirmation dialog, no identity verification. The Locker trash icon invoked this directly. Failure 1 enabling Failure 2: once the route was reachable while signed out, the guest delete path was exposed.

### FAILURE 3 root cause — invalid Clerk password verification API call

`LockerDeleteDialog.tsx` `handlePasswordSubmit` try block (before fix):
```javascript
const { error: clerkError } = await signIn.password({ emailAddress, password });

if (clerkError) {
  setError('Incorrect password. Nothing was deleted.');
  recordFailure();
  return;
}
```

`signIn.password()` is **not a documented method on Clerk v6's `SignInResource`**. The Clerk v6 API for password-based identity verification is `signIn.create({ strategy: 'password', identifier, password })`. Calling `signIn.password()` either:
- Throws a `TypeError` (if the property is `undefined`), caught by the catch block → "Verification failed. Please try again."
- Returns an error object (if some intermediate Clerk state set `password` to a non-function that resolves differently) → "Incorrect password. Nothing was deleted."

The user observed "Incorrect password. Nothing was deleted." — meaning `signIn.password()` returned `{ error: something }` even for the correct password, indicating the method is present in Clerk v6's signal API but does not perform the expected password-based authentication.

---

## Files Inspected

| File | Lines / search | Purpose |
|------|---------------|---------|
| `src/App.tsx` | full (180 lines) | Route definitions, `ChecklistRoute`, auth patterns |
| `src/pages/Checklist.tsx` | 1–60, 990–1090, 1665–1730 | Default export, delete flow, render tree |
| `src/components/LockerDeleteDialog.tsx` | full (380 lines) | Current password verification code |
| `.local/skills/clerk-auth/SKILL.md` | full (174 lines) | Canonical Clerk setup and re-verification patterns |
| `.local/skills/clerk-auth/references/setup-and-customization.md` | full (610 lines) | Clerk v6 API reference |
| `node_modules/@clerk/react/dist/index.d.mts` | grep for useSignIn, SignInResource | Confirmed Clerk v6 exported types |

Additionally grep/shell searches for:
- `signIn.password` in `@clerk/react` bundle (not found as documented API)
- `signIn.create` in `@clerk/react` bundle (confirmed: `await signIn.create({ transfer: true })` appears)
- `useAuth`, `isSignedIn`, `isLoaded`, `SignedIn`, `SignedOut` across source files

---

## Auth Route Architecture — Before vs After

### Before (FAILURE 1)

```
/checklist → ChecklistRoute() → Checklist()
  → Clerk: isLoaded=false → spinner ✓
  → Clerk: isLoaded=true, user present → ChecklistContent (authenticated) ✓
  → Clerk: isLoaded=true, user absent → ChecklistContent (isGuest=true) ✗  ← BUG
                                         (full private data rendered)
```

### After (fixed)

```
/checklist → ChecklistRoute() → Checklist()
  → Clerk: isLoaded=false → spinner (no private data) ✓
  → Clerk: isLoaded=true, user present → ChecklistContent (authenticated) ✓
  → Clerk: isLoaded=true, user absent → <Redirect to="/sign-in" /> ✓
                                         (no private data rendered)
```

**Private data protection:** `ChecklistContent` with `isGuest=true` is now unreachable from the `/checklist` route for any signed-out visitor. The `usePackData` hook, Locker initialization, background hydration, and all localStorage reads that happen inside `ChecklistContent` are never triggered.

**No data deletion:** Locally stored data (gear items, Locker entries, backgrounds) in `localStorage` and `IndexedDB` is preserved as-is. The route guard prevents display; it does not erase data. When the user signs back in, all their data is still available.

**`/s/:shareId` unaffected:** `SharedChecklistPage` has its own separate auth path (`useUser()` inside `SharedChecklistInner`) and is not modified by this change. Unsigned-out recipients can still view shared packs.

---

## Locker Delete Authorization — Before vs After

### Before (FAILURE 2)

```
User clicks trash icon → requestProtectedDelete(id)
  → isGuest=true (signed out) → delete immediately, no auth ✗
  → isGuest=false (signed in) → open LockerDeleteDialog
```

### After (fixed)

```
User clicks trash icon → requestProtectedDelete(id)
  → isGuest=true OR !userId → return immediately (no deletion, no dialog) ✓
  → isGuest=false AND userId present → open LockerDeleteDialog
```

The unauthenticated direct-deletion branch (the 8 lines that called `setLockerEntries`, `broadcastLocker`, `readActiveLockerFileFromSS`, etc.) is removed entirely. The function now only opens the dialog when the user is authenticated.

**Defense in depth:** The route guard (Fix 1) prevents signed-out users from ever reaching `/checklist`. The delete guard (Fix 2) adds a second layer: even if an unauthenticated call somehow reached `requestProtectedDelete`, it would return immediately without deleting anything.

---

## Password Re-verification — Before vs After

### Before (FAILURE 3)

```javascript
const { error: clerkError } = await signIn.password({ emailAddress, password });
// ↑ signIn.password() is not a documented Clerk v6 API method
//   Returns an error object even for correct passwords
```

### After (fixed)

```javascript
const result = await signIn.create({
  strategy: 'password',
  identifier: emailAddress,
  password,
});
// signIn.create() is the documented Clerk v6 API for password-based authentication
// result.status === 'complete' means the password was correct
// setActive() is NOT called — existing session remains active
```

**Why `signIn.create()` without `setActive()`:**
- `signIn.create()` creates a new sign-in _attempt_ object and validates credentials against Clerk's server.
- The returned `result.status === 'complete'` confirms the credentials are correct.
- Without calling `clerk.setActive({ session: result.createdSessionId })`, the new session object is abandoned — the currently active user session is never replaced.
- This is the standard Clerk pattern for re-verification without session replacement.

**Wrong-password error handling:**
- In the old code: `{ error: clerkError }` destructured from a non-standard method.
- In the new code: Clerk throws a `ClerkAPIError` exception for wrong credentials, with `err.errors[0].code === 'form_password_incorrect'`. The catch block inspects this code to produce "Incorrect password. Nothing was deleted."
- Any other error (network, MFA state, etc.) produces "Verification failed. Please try again."

**Password never stored:** The `password` variable is React component state, cleared immediately after successful verification (`setPassword('')`). It is never written to `localStorage`, `sessionStorage`, any server, or any log. This is unchanged from before.

**No signIn.finalize() / setActive():** The old code's comment said "We deliberately do NOT call signIn.finalize()" — the new code preserves this intent: `setActive()` is absent from all executable code in `LockerDeleteDialog.tsx`.

---

## Exact Code Changes Made

### 1. `src/pages/Checklist.tsx` — Add `Redirect` import from wouter

```diff
- import { useLocation } from 'wouter';
+ import { useLocation, Redirect } from 'wouter';
```

### 2. `src/pages/Checklist.tsx` — `requestProtectedDelete` defensive guard

```diff
  const requestProtectedDelete = useCallback((id: string) => {
-   if (isGuest || !userId) {
-     // No auth system available — delete directly (preserve existing guest UX).
-     const updated = lockerEntries.filter(e => e.id !== id);
-     setLockerEntries(updated);
-     broadcastLocker(updated);
-     // If the deleted entry is the active file, detach — it no longer exists.
-     const curA = readActiveLockerFileFromSS();
-     const nextA = curA?.id === id ? null : curA;
-     writeActiveLockerFileToSS(nextA);
-     setActiveLockerFile(nextA);
-     return;
-   }
+   // Deletion requires authentication — signed-out sessions are redirected before
+   // reaching /checklist, but this guard ensures no unauthenticated deletion path exists.
+   if (isGuest || !userId) return;
    setPendingDeleteIds([id]);
    setShowDeleteDialog(true);
- }, [isGuest, userId, lockerEntries, broadcastLocker]);
+ }, [isGuest, userId]);
```

### 3. `src/pages/Checklist.tsx` — Default export signed-out path

```diff
  if (user) {
    return (
      <UnitProvider>
        <ChecklistContent key={user.id} userId={user.id} userEmail={user.primaryEmailAddress?.emailAddress} />
      </UnitProvider>
    );
  }

- return (
-   <UnitProvider>
-     <ChecklistContent key="guest" userId={undefined} isGuest />
-   </UnitProvider>
- );
+ // Signed out — require sign-in; do NOT render private checklist data.
+ return <Redirect to="/sign-in" />;
```

### 4. `src/components/LockerDeleteDialog.tsx` — Header comment

```diff
  *  • Email+password accounts:
- *      signIn.password({ emailAddress, password }) → check signIn.status === 'complete'
- *      signIn.finalize() is deliberately NOT called — we only verify, not replace the session.
+ *      signIn.create({ strategy: 'password', identifier, password }) → check result.status === 'complete'
+ *      setActive() is deliberately NOT called — we only verify, not replace the session.
```

### 5. `src/components/LockerDeleteDialog.tsx` — `handlePasswordSubmit` try block

```diff
    try {
      const emailAddress = user.primaryEmailAddress?.emailAddress ?? '';

-     // Clerk v6: signIn.password() verifies credentials against Clerk's server.
-     // We deliberately do NOT call signIn.finalize() — this is verification only,
-     // not a session replacement. The existing session remains unchanged.
-     const { error: clerkError } = await signIn.password({ emailAddress, password });
-
-     if (clerkError) {
-       // Wrong password or other credential error.
-       setError('Incorrect password. Nothing was deleted.');
-       recordFailure();
-       return;
-     }
-
-     // Check the reactive status property on the signIn resource.
-     if (signIn.status === 'complete') {
+     // Clerk v6: create() with strategy='password' verifies credentials against Clerk's
+     // server. We do NOT call setActive() — this is verification only; the existing
+     // session remains unchanged.
+     const result = await signIn.create({
+       strategy: 'password',
+       identifier: emailAddress,
+       password,
+     });
+
+     if (result.status === 'complete') {
        setPassword('');
        onConfirmed();
      } else {
        // Unexpected intermediate status (e.g. MFA required) — treat as unverified.
        setError('Identity could not be fully verified. Nothing was deleted.');
        recordFailure();
      }
-   } catch {
-     // Unexpected network / Clerk exception.
-     setError('Verification failed. Please try again.');
+   } catch (err: unknown) {
+     // Wrong password → Clerk throws with err.errors[0].code === 'form_password_incorrect'
+     const clerkErr = err as { errors?: Array<{ code?: string }> };
+     const code = clerkErr?.errors?.[0]?.code ?? '';
+     if (code === 'form_password_incorrect' || code.includes('password')) {
+       setError('Incorrect password. Nothing was deleted.');
+     } else {
+       setError('Verification failed. Please try again.');
+     }
      recordFailure();
    } finally {
```

### 6. `src/App.tsx` — Remove misleading comment

```diff
  function ChecklistRoute() {
-   // Allow access whether signed in or not — guests use the local guest key
+   // Auth guard lives in the Checklist default export — redirects to /sign-in when signed out.
    return <Checklist />;
  }
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/pages/Checklist.tsx` | 3 edits: Redirect import; requestProtectedDelete guard; default export signed-out path |
| `src/components/LockerDeleteDialog.tsx` | 2 edits: header comment; handlePasswordSubmit try block |
| `src/App.tsx` | 1 edit: comment on ChecklistRoute |
| `src/hooks/authProtection021A.test.mjs` | New — 28 structural tests |
| `package.json` | `test:importer` script: added `authProtection021A` |
| `TESTING.md` | Suite count 29 → 30; added 021A suite entry |
| `TRAILWEIGH_COMPLETE_WORKFLOW.md` | 021A section appended |
| `workflow-reports/PROMPT_021A_REPORT.md` | This file |
| `PRE_021A_MASTER_BACKUP.md` | Pre-change state snapshot of all modified files |

---

## Security and Data Ownership Review

| Check | Result |
|-------|--------|
| Password stored in localStorage | NO — password is React state only, cleared after use |
| Password stored in sessionStorage | NO — sessionStorage is used only for OAuth redirect entry IDs (never credentials) |
| Password in console output | NO — no console.log of password variable |
| Password in report/tests | NO — no credential values in test file or this report |
| Password compared against local string | NO — Clerk server comparison only (via `signIn.create()`) |
| Password hard-coded | NO |
| Existing Locker data erased on sign-out | NO — localStorage and IndexedDB data preserved |
| Server-side data migration triggered | NO — all data remains client-side as before |
| signIn session replaced by delete verification | NO — `setActive()` is absent from LockerDeleteDialog |
| Signed-out deletion now possible | NO — blocked by both route guard and `requestProtectedDelete` guard |
| Cross-account deletion possible | NO — `LOCKER_KEY` in localStorage is browser-local; no server-side cross-account access |
| /s/:shareId viewers can access sender Locker | NO — SharedChecklistPage does not read from `LOCKER_KEY` |

---

## 021 Share Regression Verification (Structural)

| Check | Result |
|-------|--------|
| `order={store.order}` still in SharedChecklistPage GearCategory | ✅ verified (test E1) |
| `moveItem={moveItem}` still in SharedChecklistPage GearCategory | ✅ verified (test E2) |
| `normalizeSnapshot` still returns `name` and `unit` | ✅ verified (test E3) |
| Empty Share button aria-disabled/grayed | ✅ Checklist.tsx not modified in this area |
| Save-before-sharing warning step | ✅ Checklist.tsx Share section not touched |
| "Nothing to share" toast still absent | ✅ handleCopyLink not modified |

---

## 020F Regression Verification

020F tests ran as part of the full regression suite and passed:
```
inheritedSessionStorage020F.test.mjs → 020F tests: 28 passed, 0 failed
crossTabIsolation020E.test.mjs → Tests: 24 | Passed: 24 | Failed: 0
```

---

## Focused Tests — Exact Command and Results

```sh
node artifacts/pack-checklist/src/hooks/authProtection021A.test.mjs
```

Output:
```
Prompt 021A — Protect Private Checklist Access

A. Route guard — /checklist requires authentication
  ✓ Checklist default export imports Redirect from wouter
  ✓ Checklist default export redirects to /sign-in when signed out
  ✓ Signed-out path does NOT render ChecklistContent with isGuest
  ✓ Signed-out path does NOT render UnitProvider wrapping a guest ChecklistContent
  ✓ Auth-loading state renders spinner, not private data
  ✓ Signed-in path still renders ChecklistContent with user.id key
  ✓ Checklist default export checks isLoaded before rendering private content
  ✓ /checklist route in App.tsx delegates to Checklist component (no inline auth bypass)

B. Locker delete guard — signed-out deletion path removed
  ✓ requestProtectedDelete returns early when isGuest=true
  ✓ requestProtectedDelete does NOT delete directly for unauthenticated users
  ✓ requestProtectedDelete proceeds to dialog only after auth check
  ✓ isGuest prop still plumbed to LockerDeleteDialog (for dialog internal gating)
  ✓ No password or credential is written to localStorage in delete flow
  ✓ No password or credential is written to sessionStorage in delete flow

C. Password re-verification API — signIn.create() instead of signIn.password()
  ✓ handlePasswordSubmit uses signIn.create() not signIn.password()
  ✓ signIn.create() receives strategy: "password"
  ✓ signIn.create() receives identifier field (not emailAddress field)
  ✓ signIn.create() receives password field
  ✓ onConfirmed called when result.status === "complete"
  ✓ setActive() is NOT called in code — existing session preserved
  ✓ Wrong-password error identified by Clerk error code
  ✓ header comment updated to reflect signIn.create() (no signIn.password() documentation)

D. Public share route — /s/:id remains publicly accessible
  ✓ /s/:id route in App.tsx has no auth guard
  ✓ SharedChecklistPage does not import or use RedirectToSignIn
  ✓ SharedChecklistPage does not call setLocation("/sign-in") at top level

E. 021 share regression guard
  ✓ order prop still passed to GearCategory in SharedChecklistPage
  ✓ moveItem prop still passed to GearCategory in SharedChecklistPage
  ✓ normalizeSnapshot still returns name and unit fields

────────────────────────────────────────────────────
021A tests: 28 passed, 0 failed
All 28 021A tests passed.
```

---

## Complete Regression Suite — Exact Command and Results

```sh
pnpm run test:importer
```

Exit code: **0 (all passed)**

| Suite | Tests | Result |
|-------|-------|--------|
| `importGear.test.mjs` | 219 | ✅ |
| `importGear.pdf.test.mjs` | 54 | ✅ |
| `importGear.pdf.api.test.mjs` | 53 | ✅ |
| `scanGear.test.mjs` | 47 | ✅ |
| `categoryAliases.test.mjs` | 77 | ✅ |
| `usePackData.test.mjs` | 64 | ✅ |
| `moveItem.test.mjs` | 47 | ✅ |
| `pieColor.test.mjs` | 41 | ✅ |
| `bgCollections.test.mjs` | 24 | ✅ |
| `bgCollections016A.test.mjs` | 22 | ✅ |
| `bgPhotoStore016B.test.mjs` | 24 | ✅ |
| `controls017.test.mjs` | 26 | ✅ |
| `landscapeHover017B.test.mjs` | 38 | ✅ |
| `landscapeActiveBackground017C.test.mjs` | 20 | ✅ |
| `landscapeShake017D.test.mjs` | 20 | ✅ |
| `landscapeShake017E.test.mjs` | 30 | ✅ |
| `activeFileName018.test.mjs` | 20 | ✅ |
| `activeFileName018A.test.mjs` | 29 | ✅ |
| `activeFileName018B.test.mjs` | 36 | ✅ |
| `activeFileName018C.test.mjs` | 36 | ✅ |
| `sidebar019.test.mjs` | 20 | ✅ |
| `newBlank020.test.mjs` | 24 | ✅ |
| `newClearLight041.test.mjs` | 30 | ✅ |
| `lockerFirstOpen020B.test.mjs` | 30 | ✅ |
| `newAfterLocker020C.test.mjs` | 29 | ✅ |
| `savedListRestore020D.test.mjs` | 30 | ✅ |
| `crossTabIsolation020E.test.mjs` | 24 | ✅ |
| `inheritedSessionStorage020F.test.mjs` | 28 | ✅ |
| `shareLink021.test.mjs` | 27 | ✅ |
| `authProtection021A.test.mjs` | 28 | ✅ |

**Total: 1,156 tests across 30 suites — 1,156 passed, 0 failed, 0 skipped.**

---

## Rendered / Real-Browser Testing Actually Performed

The following was observed after restarting the Vite dev server with the changes applied:
- The Vite workflow accepted the HMR updates for `Checklist.tsx`, `LockerDeleteDialog.tsx`, and `App.tsx` without compile errors.
- No new runtime errors appeared in the browser console log after the changes.

The following was **NOT** performed:
- Opening `/checklist` while signed out and confirming the sign-in page appears.
- Opening `/checklist` while signed in and confirming the checklist loads normally.
- Signing out from the checklist and confirming that `/checklist` then requires sign-in.
- Navigating to `/checklist` via Back/Forward after sign-out.
- Attempting deletion while signed out (confirming no dialog appears).
- Signed-in delete with correct credentials (confirming `signIn.create()` succeeds).
- Signed-in delete with wrong credentials (confirming "Incorrect password" message).
- Signed-in delete cancel (confirming nothing deleted).
- Opening a valid `/s/:shareId` while signed out (confirming view loads).
- Opening `/checklist` after viewing a shared link (confirming sign-in is still required).

---

## Failures, Reversions, and Notes

- No failures occurred. All edits compiled and all tests passed on the first attempt.
- One test (`setActive() is NOT called`) initially failed because the regex matched `setActive()` in comment text. Fixed by stripping comment lines before checking — the 28th test was adjusted and now passes.
- No reversions were required.

---

## Important Architectural Note

The `/checklist` private route protection is implemented at the **render level** inside the `Checklist` component (not at the router level in `App.tsx`). This is consistent with the existing pattern — `Checklist` already does `isLoaded` checking. The `ChecklistRoute` function in `App.tsx` delegates to `Checklist`, which now owns the auth guard.

This approach does **not** use Clerk's `<RedirectToSignIn>` component (which per the Clerk skill is appropriate for base paths and known-broken in some configurations), but instead uses wouter's `<Redirect to="/sign-in" />` which is already used elsewhere in the app (see `HomeRedirect` in `App.tsx`).

**Data-security limitation (pre-existing, out of scope):** All TrailWeigh data lives in browser `localStorage` and `IndexedDB`. This means anyone with physical access to the browser profile can read the data without signing in. This is an architectural characteristic of the current client-side-only design. Fixing it would require migrating data to server-side authenticated storage — a separate architectural change explicitly out of scope per the prompt.

---

## Acceptance Checklist

| Item | Status |
|------|--------|
| Signed-out /checklist redirects to sign-in | NOT TESTED (structural: Redirect rendered) |
| No private data visible before auth resolves | PASS (structural: spinner shown, no ChecklistContent) |
| Sign-in page shown after sign-out + navigate to /checklist | NOT TESTED |
| Hard refresh to /checklist while signed out | NOT TESTED |
| New tab /checklist while signed out | NOT TESTED |
| Back/Forward does not expose cached private checklist | NOT TESTED |
| Signed-in /checklist loads normally | NOT TESTED (structural: user.id path unchanged) |
| /s/:shareId works signed out | NOT TESTED (structural: route and component unchanged) |
| Signed-out deletion impossible | PASS (structural: route guard + delete guard) |
| Signed-in correct password delete succeeds | NOT TESTED |
| Signed-in wrong password shows "Incorrect password" | NOT TESTED |
| Signed-in cancel leaves file intact | NOT TESTED (Cancel path unchanged) |
| Existing Locker data preserved after sign-out | PASS (structural: no data deletion in changes) |
| 020F appearance behavior intact | PASS (28/28 regression tests) |
| 021 Share behavior intact | PASS (27/27 regression tests) |
| 021A structural tests | PASS (28/28) |
| Full regression suite | PASS (1,156/1,156, exit 0) |

---

## Unresolved Issues

1. **All rendered browser tests still required** — see "Exact User Tests Still Required" below.
2. **OAuth account deletion** — The OAuth re-verification path (`signIn.sso()`) was not changed. If an OAuth user attempts deletion, the SSO redirect flow triggers. This path was not broken by 021A and is structurally identical to before.
3. **MFA accounts** — If a user has MFA enabled, `signIn.create()` may return a status other than `'complete'` (e.g. `'needs_second_factor'`). The code handles this by showing "Identity could not be fully verified. Nothing was deleted." and declining to delete. A full MFA re-verification path would require additional dialog steps. This is a pre-existing limitation, not introduced by 021A.
4. **Client-side-only data** — All data lives in browser localStorage/IndexedDB. The route guard prevents display but not access by anyone with physical browser profile access. This is an architectural concern out of scope.

---

## Exact User Tests Still Required

**TEST A — Signed-out direct /checklist**
1. Sign out of TrailWeigh. Confirm sign-in/landing page is shown.
2. Manually type `/checklist` in the address bar and press Enter.
3. **PASS:** Sign-in page shown. No private checklist, no Locker, no filenames, no private gear visible.
4. Repeat: hard refresh on `/checklist` while signed out.
5. Repeat: open `/checklist` in a new browser tab while signed out.
6. Repeat: navigate to `/checklist` via browser Back button after sign-out.

**TEST B — Sign out from private checklist**
1. Sign in. Open `/checklist`. Confirm private data is visible.
2. Sign out using the TrailWeigh sign-out button.
3. **PASS:** Private checklist becomes inaccessible immediately.
4. Navigate directly back to `/checklist`.
5. **PASS:** Sign-in page shown. No private data visible.

**TEST C — Public share link while signed out**
1. Remain signed out.
2. Open a valid `/s/:shareId` URL.
3. **PASS:** Shared pack opens. No sign-in required to view. No `order.filter` crash. Sender's private Locker is not visible. `/checklist` still requires sign-in.

**TEST D — Signed-out delete (must be impossible)**
1. Remain signed out.
2. Attempt to navigate to `/checklist` and access the Locker.
3. **PASS:** Redirect to sign-in prevents reaching the Locker. No deletion possible.

**TEST E — Signed-in correct credential delete**
1. Sign in. Create a disposable test Locker file (e.g. name it "DELETE ME TEST").
2. Click the trash icon on that file. Confirm the password dialog appears.
3. Enter the correct account password and click "Permanently Delete".
4. **PASS:** Only the disposable test file is deleted. Other files (Sierra/Dutch/0826, Ray Jardine's, Packlist 1) remain intact.

**TEST F — Wrong credential**
1. Signed in. Create another disposable test Locker file.
2. Click trash. Enter an **incorrect** password.
3. **PASS:** "Incorrect password. Nothing was deleted." message shown. File remains. No other changes.

**TEST G — Cancel**
1. Signed in. Click trash on any file. When dialog appears, click Cancel.
2. **PASS:** Nothing deleted.

**TEST H — Share recipient ownership**
1. Signed out: open a shared link. Confirm sender's private Locker is not accessible.
2. Sign in as a recipient. Use "Save Your Own Copy". Confirm the saved file is a new independent copy. Confirm the sender's original is unchanged.

---

## Status History

019 = USER-TESTED PASS  
020 = PARTIAL | 020A = PARTIAL | 020B = PARTIAL | 020C = PARTIAL/FAIL | 020D = FAIL/PARTIAL | 020E = PARTIAL/FAIL  
020F functional = USER-TESTED PASS  
021 core Share = USER-TESTED PASS | 021 overall = PARTIAL/FAIL  
**021A = NOT USER-VERIFIED**
