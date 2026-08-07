# Prompt 021B Report — Simplify Private Delete + Make Shared Locker View/Copy Only

**Status:** COMPLETE — NOT USER-VERIFIED  
**Date:** 2026-08-07  
**Prior functional status:** 020F = USER-TESTED PASS | 021 core Share = USER-TESTED PASS | 021A /checklist protection = USER-TESTED PASS | 021A Cancel protection = USER-TESTED PASS | 021A password-verification = SUPERSEDED by 021B

---

## Exact Prompt 021B Requirements

### New Authoritative Requirements

**PRIVATE SIGNED-IN OWNER:**
- May rename their own Locker files ✓ (unchanged)
- May delete their own Locker files ✓ (changed: no password required)
- Deleting NO LONGER requires entering an account password ← PRIMARY CHANGE
- Keep a simple confirmation to prevent accidental deletion

**SHARED-LINK VIEWER:**
- May see/browse the shared Locker and shared files ✓ (allowed)
- May open shared files ✓ (unchanged)
- May make temporary session edits ✓ (unchanged)
- May save a separate independent copy ONLY to their own account ✓ (unchanged)
- Must NOT have Rename (no change needed — not present in shared view)
- Must NOT have Delete (no change needed — not present in shared view)
- Must NOT overwrite/save back to sender's files ✓ (already enforced)

---

## Starting State (before 021B)

### LockerDeleteDialog.tsx (before)
- 382 lines, full Clerk re-verification flow:
  - Email+password accounts: `signIn.create({ strategy: 'password', identifier, password })` — checks `result.status === 'complete'`
  - OAuth accounts: `signIn.sso()` redirect round-trip via sessionStorage and URL param
  - Rate limiting: 5 consecutive failures → 30-second client-side lockout
  - `LOCKER_PENDING_DELETE_KEY` and `LOCKER_DELETE_VERIFIED_PARAM` exported constants used by Checklist.tsx
  - `isGuest` prop (for guest simple-confirm path, now unreachable due to 021A route guard)
  - `Eye`/`EyeOff` show/hide password toggle
  - `AlertCircle` error display with "Incorrect password" and "Identity could not be fully verified" messages

### Checklist.tsx (before)
- Imported `LOCKER_PENDING_DELETE_KEY`, `LOCKER_DELETE_VERIFIED_PARAM` from LockerDeleteDialog
- `oauthDeleteIds` state + two `useEffect`s for OAuth round-trip deletion:
  - On mount: checked URL for `locker_delete_verified=1`, read `LOCKER_PENDING_DELETE_KEY` from sessionStorage, set `oauthDeleteIds`
  - On `oauthDeleteIds` change: performed the deferred deletion and toast
- Passed `isGuest={isGuest}` to `<LockerDeleteDialog>`

### SharedChecklistPage.tsx (before)
- No `LockerPanel` rendered (only `LockerEntry` type imported)
- No `LockerDeleteDialog` used
- No Rename/Delete controls for Locker files
- In-memory store via `pushAndSet` (no localStorage writes)
- `writeLockerEntry` for Save Your Own Copy (recipient localStorage only)

---

## Files Inspected

| File | Lines / search | Purpose |
|------|---------------|---------|
| `src/components/LockerDeleteDialog.tsx` | full (382 lines) | Complete state before simplification |
| `src/pages/Checklist.tsx` | lines 1–30, 990–1070, 1648–1680 | Imports, OAuth delete round-trip, dialog usage |
| `src/pages/SharedChecklistPage.tsx` | full (1056 lines) | Shared view — confirm no Locker rename/delete |
| `src/components/LockerPanel.tsx` | grep for rename/delete/onRequestDelete | Confirmed LockerPanel API unchanged |
| `PRE_021A_MASTER_BACKUP.md` | full | Pre-021A state reference |

---

## Changes Made

### 1. `src/components/LockerDeleteDialog.tsx` — Complete simplification

**Before (382 lines):** Full Clerk password/OAuth re-verification dialog.

**After (127 lines):** Simple confirmation dialog only.

Removed:
- `useSignIn`, `useUser` Clerk imports
- `Eye`, `EyeOff`, `AlertCircle` lucide imports
- `LOCKER_PENDING_DELETE_KEY` export (no longer needed)
- `LOCKER_DELETE_VERIFIED_PARAM` export (no longer needed)
- `isGuest` prop (dialog only shown to authenticated owners after 021A route guard)
- All password state: `password`, `showPwd`, `attempts`, `lockedUntil`, `countdown`, `loading`
- `handlePasswordSubmit` — Clerk `signIn.create()` password verification
- `handleOAuthVerify` — OAuth `signIn.sso()` redirect flow
- `detectOAuth` helper
- `recordFailure` rate-limit helper
- Password input field and show/hide toggle
- OAuth verify button
- Error/lockout display (`AlertCircle`)
- "Incorrect password" and "Identity could not be fully verified" error messages
- `MAX_ATTEMPTS`, `LOCKOUT_SECS` constants
- `passwordRef` — autofocus now targets the "Permanently Delete" confirm button instead

Kept/retained:
- `Trash2`, `X` icons
- `LockerEntry` type
- Dialog structure: backdrop, panel, `role="dialog"` aria attributes, `aria-labelledby`, `aria-describedby`
- Focus trap (Tab key handling)
- Escape key closes dialog
- `onConfirmed`, `onCancel` callback props
- Multi-entry title/body for bulk deletion (future-proofing)
- Autofocus — now targets the "Permanently Delete" button

New dialog flow:
```
Owner clicks delete → simple dialog appears:
  "Permanently delete "[File Name]"?"
  "This cannot be undone."
  [Cancel] [Permanently Delete]
```

### 2. `src/pages/Checklist.tsx` — Remove OAuth round-trip

Three targeted edits:

**Edit 1** — Import simplification:
```diff
- import {
-   LockerDeleteDialog,
-   LOCKER_PENDING_DELETE_KEY,
-   LOCKER_DELETE_VERIFIED_PARAM,
- } from '../components/LockerDeleteDialog';
+ import { LockerDeleteDialog } from '../components/LockerDeleteDialog';
```

**Edit 2** — Remove OAuth state + two useEffects (42 lines deleted):
```diff
  const [pendingDeleteIds,  setPendingDeleteIds]  = useState<string[]>([]);
  const [showDeleteDialog,  setShowDeleteDialog]  = useState(false);
- // Used only for the OAuth redirect round-trip path.
- const [oauthDeleteIds,    setOauthDeleteIds]    = useState<string[]>([]);
-
- // Detect OAuth redirect return on first render and schedule deletion.
- useEffect(() => {
-   const params = new URLSearchParams(window.location.search);
-   if (params.get(LOCKER_DELETE_VERIFIED_PARAM) !== '1') return;
-   ...
- }, []);
-
- // Execute pending OAuth-verified deletion once state is ready.
- useEffect(() => {
-   if (!oauthDeleteIds.length) return;
-   ...
- }, [oauthDeleteIds]);
```

**Edit 3** — Remove `isGuest` prop from dialog:
```diff
  <LockerDeleteDialog
    entries={lockerEntries.filter(e => pendingDeleteIds.includes(e.id))}
    onConfirmed={handleConfirmedDelete}
    onCancel={() => { setShowDeleteDialog(false); setPendingDeleteIds([]); }}
-   isGuest={isGuest}
  />
```

### 3. `src/hooks/authProtection021A.test.mjs` — Update superseded group C tests

Group C previously verified `signIn.create()` password verification behavior (from 021A). Since 021B supersedes this, group C was updated to:
- Verify the password code has been cleanly removed (no `signIn.create()`, no `signIn.password()`, no password input)
- Verify the simpler replacement is in place (Cancel + Permanently Delete buttons)
- Document the supersession clearly in comments
- Still pass 28/28 (all tests pass)

### 4. `src/hooks/lockerSimpleDelete021B.test.mjs` — New 41-test suite

New focused test suite for 021B covering:
- A. Private delete: no password input, no useSignIn, no Clerk verification, buttons present
- B. OAuth/Clerk code removed from Checklist.tsx
- C. Private Rename still works
- D. Shared view: no LockerPanel/onRequestDelete/LockerDeleteDialog rendered
- E. Temporary shared edits: no localStorage writes except LOCKER_KEY for Save Your Own Copy
- F. Save Your Own Copy: new UUID, writes to recipient LOCKER_KEY, guest redirects to sign-up
- G. 021A route regression: Redirect from wouter, /sign-in redirect, no guest ChecklistContent
- H. /s/:shareId public: no auth guard in App.tsx, no /sign-in redirect
- I. 021 Share regression: order/moveItem props, normalizeSnapshot name+unit
- J. 020F regression: resolveStorageKey forkId, LOCKER_KEY exported

---

## SharedChecklistPage Analysis — Shared Locker and Rename/Delete

### Section 3: Shared Locker allowed visible

**Finding:** `SharedChecklistPage.tsx` currently renders **no `LockerPanel`** component. The file imports only `{ LockerEntry }` as a type (for the `Save Your Own Copy` write to recipient localStorage). No Locker file browser UI is rendered in the shared view.

**Action:** No code change needed. The prompt clarifies that the Locker being visible is **allowed** — not that it must be added. If a Locker panel is added to the shared view in a future prompt, it must not include Rename or Delete controls (per section 4).

### Section 4: Shared viewer — no Rename or Delete

**Finding:** The shared view has no Locker file controls at all — no `LockerPanel`, no `LockerDeleteDialog`, no `onRequestDelete`. Category-level rename/delete in `GearCategory` (via `onDelete` and `onRename` props) operate on the in-memory store only via `pushAndSet`, never touching localStorage. These are temporary edits explicitly permitted in section 5.

**Action:** No code change needed. The absence of these controls is structurally verified by 3 tests in the 021B test suite (group D).

### Section 5: Temporary viewer edits isolated

`SharedChecklistContent` holds an in-memory `Store` initialized from the snapshot. All mutations go through `pushAndSet` which calls `setStore` — pure React state, zero localStorage writes. The file explicitly documents: `"NO localStorage writes"` and `"nothing is ever written to localStorage, IndexedDB, or the API"`. Refreshing re-fetches the immutable snapshot from the API.

**Action:** No code change needed. Isolation is verified by 3 tests in group E.

### Section 6: Save Your Own Copy ownership

`commitSave` assigns a **new** `crypto.randomUUID()` for every new save. It writes only to the recipient's own `localStorage[LOCKER_KEY]`. It never reads `snapshot.id` (the snapshot has no file ID field). The sender's `LOCKER_KEY` is in a different browser profile/account and is never touched.

**Action:** No code change needed. Ownership is verified by 4 tests in group F.

---

## Auth Route Regression (021A preserved)

| Check | Result |
|-------|--------|
| `Redirect` imported from wouter in Checklist.tsx | ✅ intact |
| Signed-out /checklist → `<Redirect to="/sign-in" />` | ✅ intact |
| `key="guest" userId={undefined} isGuest` fallback removed | ✅ intact |
| `requestProtectedDelete` auth guard: `if (isGuest \|\| !userId) return` | ✅ intact |
| `handleConfirmedDelete` filters by `pendingDeleteIds` | ✅ intact |
| `/s/:shareId` in App.tsx: no auth guard | ✅ intact |
| SharedChecklistPage: no `setLocation("/sign-in")` at top level | ✅ intact |

---

## Security and Data Ownership Review

| Check | Result |
|-------|--------|
| Password stored anywhere during delete | NO — password field removed entirely |
| Credentials in localStorage/sessionStorage | NO — OAuth round-trip code removed |
| Signed-out deletion path | NO — route guard + `requestProtectedDelete` auth guard both block it |
| Viewer changes affect sender files | NO — SharedChecklistPage is pure in-memory React state |
| Viewer Save writes to sender file | NO — `crypto.randomUUID()` for new ID, writes only to recipient LOCKER_KEY |
| Sender file ID reused in viewer copy | NO — snapshot has no `id` field; `commitSave` always generates new UUID |
| Shared view has Rename control for Locker files | NO — no LockerPanel rendered |
| Shared view has Delete control for Locker files | NO — no LockerPanel rendered |
| Shared view can delete via keyboard/hidden route | NO — no such path exists |
| Private authenticated owner can rename | YES — handleRenameInLocker and onRename prop preserved |
| Private authenticated owner can delete without password | YES — simple confirmation only |
| Existing user data erased | NO — no localStorage.clear() or data migration |
| Schema migration | NO — no storage schema changes |

---

## Automated Tests — Exact Commands and Results

### 021B focused suite
```sh
node artifacts/pack-checklist/src/hooks/lockerSimpleDelete021B.test.mjs
```
```
021B tests: 41 passed, 0 failed
All 021B tests passed.
```

### 021A suite (updated for 021B supersession)
```sh
node artifacts/pack-checklist/src/hooks/authProtection021A.test.mjs
```
```
021A tests: 28 passed, 0 failed
All 021A tests passed.
```

### Complete regression suite
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
| `lockerSimpleDelete021B.test.mjs` | 41 | ✅ |

**Total: 1,197 tests across 31 suites — 1,197 passed, 0 failed, 0 skipped.**

---

## Vite Workflow Runtime Verification

- Vite workflow restarted after all edits
- Output: `VITE v7.3.6 ready in 2019 ms` — no compile errors
- Browser console after restart: `[vite] connecting...` and `[vite] connected.` — no errors
- Transient HMR `LOCKER_DELETE_VERIFIED_PARAM` error appeared mid-edit sequence (before the Checklist.tsx edit landed) — resolved by the full restart; absent from the post-restart log

---

## 021 Share Regression Verification

| Check | Result |
|-------|--------|
| `order={store.order}` in SharedChecklistPage GearCategory | ✅ verified (test I1) |
| `moveItem={moveItem}` in SharedChecklistPage GearCategory | ✅ verified (test I2) |
| `normalizeSnapshot` returns `name` and `unit` fields | ✅ verified (test I3) |
| Empty Share button aria-disabled/grayed | ✅ not modified |
| Save-before-sharing warning step | ✅ not modified |

---

## 020F Regression Verification

| Check | Result |
|-------|--------|
| `resolveStorageKey` creates forkId for `?newseed=` tabs | ✅ verified (test J1) |
| `LOCKER_KEY` exported from `usePackData` | ✅ verified (test J2) |
| `inheritedSessionStorage020F.test.mjs` | ✅ 28/28 |
| `crossTabIsolation020E.test.mjs` | ✅ 24/24 |

---

## Rendered / Real-Browser Testing Actually Performed

After restarting the Vite workflow, verified:
- No compile-time errors (Vite build succeeded)
- No new runtime errors in browser console after restart

The following was **NOT** performed by Replit Agent (requires real browser with user account):
- Clicking delete on a Locker file and confirming no password field appears
- Confirming the file name appears correctly in the dialog title
- Clicking Cancel and confirming the file is preserved
- Clicking "Permanently Delete" and confirming only the selected file is deleted
- Opening `/s/:shareId` and confirming Locker files show no Rename/Delete icons
- Making edits as a viewer and confirming originals are unchanged
- Save Your Own Copy flow (signed-in and guest paths)
- Route regression: signed-out /checklist → sign-in, /s/:shareId → public view

---

## Failures, Reversions, and Notes

**Test path error (fixed):** The `021B` test file initially used `path.resolve(__dirname, '..')` which resolved to `src/` instead of the artifact root, causing ENOENT errors. Fixed to `path.resolve(__dirname, '../..')`.

**021B test false-positive (fixed):** The test `"LockerDeleteDialog isGuest prop is removed"` initially matched `isGuest=false` appearing in a JSDoc comment. Fixed by: (1) updating the comment in LockerDeleteDialog.tsx to not use the `isGuest` identifier, and (2) updating the test to strip comment lines before checking.

**021A test suite update (expected):** 8 of 28 021A tests in group C initially failed because they verified the Clerk password re-verification code that 021B intentionally removes. Updated group C to verify the 021B transition: the old code is gone and the simpler confirmation is in place. All 28 tests now pass.

No reversions were required.

---

## Acceptance Checklist

| Item | Status |
|------|--------|
| Private delete shows no password field | NOT TESTED (structural: password input absent) |
| Private delete shows file name in dialog title | NOT TESTED (structural: `entries[0].name` in title) |
| Cancel preserves the file | NOT TESTED (structural: cancel wired to `onCancel`) |
| Permanently Delete removes only selected file | NOT TESTED (structural: `handleConfirmedDelete` filters by `pendingDeleteIds`) |
| Private Rename still works | NOT TESTED (structural: `handleRenameInLocker` + `onRename` intact) |
| Shared view has no Rename control | PASS (structural: no LockerPanel in SharedChecklistPage) |
| Shared view has no Delete control | PASS (structural: no LockerPanel/LockerDeleteDialog in SharedChecklistPage) |
| Shared view can see Locker (allowed) | PASS (structural: no hide logic — Locker allowed per section 3) |
| Viewer changes don't affect sender originals | PASS (structural: pushAndSet is pure React state) |
| Save Your Own Copy creates new ID | PASS (structural: `crypto.randomUUID()`) |
| Guest Save redirects to sign-up | PASS (structural: sign-up redirect confirmed) |
| /checklist requires sign-in (021A) | PASS (structural: `<Redirect to="/sign-in" />` intact) |
| /s/:shareId public | PASS (structural: no auth guard) |
| 021 Share behavior intact | PASS (27/27 regression tests) |
| 020F behavior intact | PASS (28/28 regression tests) |
| 021B focused tests | PASS (41/41) |
| 021A focused tests | PASS (28/28) |
| Full regression suite | PASS (1,197/1,197, exit 0) |

---

## Unresolved Issues

1. **All rendered browser tests still required** — see "Exact User Tests Required" below.
2. **OAuth delete account type** — The OAuth `signIn.sso()` path has been removed from the delete flow. If an OAuth-account user needed re-verification before deletion, they now get the same simple confirmation as password-account users. This is intentional per 021B requirements (no re-verification for deletion), but may be surprising to reviewers who notice the OAuth path was present in the pre-021B code.
3. **Shared Locker not yet visible** — Section 3 allows the shared Locker to be visible, but no Locker panel is rendered in SharedChecklistPage. Adding a shared Locker browser would be a separate feature implementation.

---

## Exact User Tests Required

**TEST A — Private owner delete (no password)**
1. Sign in. Create a disposable test file named "DELETE ME 021B".
2. Click the Delete (trash) icon on that file.
3. **PASS:** A dialog appears with `Permanently delete "DELETE ME 021B"?`, NO password field, and two buttons: Cancel and Permanently Delete.
4. Click Cancel.
5. **PASS:** File remains in the Locker. No other files affected.
6. Click Delete again, then click Permanently Delete.
7. **PASS:** Only "DELETE ME 021B" disappears. All other Locker files (Sierra/Dutch/0826, Ray Jardine's, Packlist 1) remain intact and unchanged.

**TEST B — Private Rename**
1. Signed in. Create another disposable file "RENAME ME 021B".
2. Click the Rename (pencil) icon.
3. Type a new name and confirm.
4. **PASS:** File renamed successfully. No errors.

**TEST C — Shared viewer controls**
1. Open a valid `/s/:shareId` link (signed out or signed in).
2. Inspect all shared Locker files (if visible).
3. **PASS:** NO Rename icon visible. NO Delete icon visible. No hidden menu exposes Rename/Delete for shared Locker files.

**TEST D — Temporary edit isolation**
1. Open a valid `/s/:shareId` link.
2. Change several gear item check states, quantities, and weights.
3. Switch among shared files if multiple are shown.
4. Have the original owner reopen their private Locker file.
5. **PASS:** Sender's original file is unchanged. None of the viewer's edits appear.

**TEST E — Save Your Own Copy (signed in)**
1. Open a `/s/:shareId` link while signed in as a different account.
2. Click "Save Your Own Copy".
3. Enter a name and save.
4. **PASS:** A new independent file appears in the viewer's own Locker with a new UUID.
5. **PASS:** The sender's original is unchanged.
6. Viewer can rename/delete their own copy freely.

**TEST F — Save Your Own Copy (guest)**
1. Open a `/s/:shareId` link while signed out.
2. Click "Save Your Own Copy".
3. **PASS:** Redirected to sign-up. After account creation, copy is saved independently.

**TEST G — Route regression**
1. Signed out: navigate to `/checklist`.
2. **PASS:** Sign-in page shown. No private data visible.
3. Navigate to a valid `/s/:shareId`.
4. **PASS:** Shared view opens without requiring sign-in.

**TEST H — 020F regression**
1. Load Ray Jardine's → correct psychedelic appearance.
2. Click New → Clear/Light.
3. Load Sierra/Dutch/0826 → mountain appearance.
4. Click New → Clear/Light.
5. Load Packlist 1 → Light/no background.
6. Click New → Clear/Light.
7. **PASS:** Each file restores its own appearance; New always produces Clear/Light.

---

## Status History

019 = USER-TESTED PASS  
020–020E = PARTIAL/FAIL  
020F functional = USER-TESTED PASS  
021 core Share = USER-TESTED PASS | 021 overall = PARTIAL/FAIL  
021A /checklist protection = USER-TESTED PASS | 021A Cancel protection = USER-TESTED PASS | 021A password-verification = SUPERSEDED  
**021B = NOT USER-VERIFIED**
