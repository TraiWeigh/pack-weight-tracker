# Prompt 022G — Restore Last Workspace With All Panels Closed

**Date:** 2026-08-08  
**Status:** COMPLETE ✅  
**Tests:** 56 passed, 0 failed (full suite: all prior suites clean)

---

## Exact Prompt ID / Title

**Prompt 022G — Restore Last Workspace With All Panels Closed**

---

## Existing Startup Behavior Discovered

**Before this prompt**, TrailWeigh's startup sequence (primary, non-fork tab):

1. `usePackData` initializer reads from `localStorage['pack-checklist-v5-${userId}']` — the auto-save key that persists every change in real time.
2. Result: user always returns to their last **unsaved working state**, not the last explicitly saved file.
3. No "last-active file" concept existed for cross-session restoration — `activeLockerFile` lived in `sessionStorage` only (tab-local, lost on browser close).

---

## Existing File-Persistence Architecture Discovered

| Key | Scope | Content |
|-----|-------|---------|
| `pack-checklist-v5-${userId}` | localStorage | Auto-saved working state (every change) |
| `trailweigh:locker` | localStorage | Array of `LockerEntry` objects (saved files) |
| `tw-active-locker-file` | sessionStorage | Active save target for current tab (tab-local) |
| `tw-fork-id` | sessionStorage | Identifies fork/new-tab tabs |
| `tw-savedlist-entry-id/name` | sessionStorage | Locker identity stash for fork tab mount |

Each `LockerEntry` has: `id` (UUID), `name`, `savedAt`, `store`, `background`, `bgFade`, `bgTone`, `bgSize`, `chartPaletteKey`.

**Auto-save:** `usePackData` writes every store change to `pack-checklist-v5-${userId}` via a `useEffect`. This is not "Save" — it's transparent crash recovery. Save/Save As explicitly write a `LockerEntry` to `trailweigh:locker`.

---

## Existing Background-Persistence Behavior Discovered

| What | Key | Scope |
|------|-----|-------|
| Background image | `trailweigh:background` (= `BG_STORAGE_KEY`) | localStorage, global |
| Fade/darken | `trailweigh:bgFade` | localStorage, global |
| Tone (dark/light) | `trailweigh:bgTone` | localStorage, global |
| Fill/Fit | `trailweigh:bgSize` | localStorage, global |
| Chart palette | `trailweigh:chartPalette` | localStorage, global |

Fork tabs use **scoped sessionStorage** keys (`tw-fork-bg-restore-${forkId}`) to avoid contaminating the shared global keys.

Each `LockerEntry` also stores `background`, `bgFade`, `bgTone`, `bgSize`, `chartPaletteKey` — per-file, restored when that file is loaded.

---

## How Last-Active-File Identity Is Stored

**New localStorage key:** `trailweigh:last-active-file-${userId}`  
**Value:** `{ id: string, name: string }` (JSON)  
**Key prefix constant:** `LAST_ACTIVE_FILE_LS_PREFIX = 'trailweigh:last-active-file-'`

Helpers added to `Checklist.tsx` (module-level, alongside existing session-storage helpers):
- `readLastActiveFileFromLS(uid)` — reads and parses; returns `ActiveLockerFile | null`
- `writeLastActiveFileToLS(uid, value)` — sets or removes the key

---

## How Account Isolation Is Enforced

The key is **scoped by Clerk user ID**: `trailweigh:last-active-file-${userId}`

- User A's key: `trailweigh:last-active-file-user_A_id`
- User B's key: `trailweigh:last-active-file-user_B_id`
- These keys never collide.
- The startup restoration effect has a `!userId` guard — guests never trigger it.
- `writeLastActiveFileToLS` is only called when `userId` is truthy.

---

## How Shared-Link Isolation Is Enforced

`SharedChecklistPage.tsx` **never** writes to:
- `writeLastActiveFileToLS`
- `LAST_ACTIVE_FILE_LS_PREFIX`
- `tw-active-locker-file` (sessionStorage)

The startup restoration in `Checklist.tsx` checks for `tw-fork-id` — shared-link views that happen to open a fork tab will not trigger last-active restoration. The private last-active file is preserved across shared-link browsing. ✓

---

## How Invalid/Deleted Files Are Handled

In the startup restoration effect:
1. `readLastActiveFileFromLS(userId)` returns the stored `{id, name}`.
2. `lockerEntries.find(e => e.id === lastActive.id)` searches the live Locker.
3. **If not found:** `writeLastActiveFileToLS(userId, null)` clears the stale reference, and the function returns early. TrailWeigh falls back to its normal startup (auto-saved working state from `pack-checklist-v5-${userId}`).
4. **No error loop.** No recreation of the deleted file. No loading spinner.

Additionally, `handleConfirmedDelete` now also clears the last-active localStorage key when the deleted file was the last-active one.

**Fallback behavior:** When last-active lookup fails, TrailWeigh shows whatever `usePackData` loaded from the user's main storage key — the same behavior as before this prompt.

---

## Exact Panels Initialized Closed

| Panel | Component | Change |
|-------|-----------|--------|
| All gear categories | `GearCategory.tsx` | `isOpen` init: `true` → `false` |
| All gear categories (force) | `Checklist.tsx` | `allOpen` init: `true` → `false` |
| Pack Summary | `WeightSummary.tsx` | `summaryOpen` init: `true` → `false` |
| Weight Distribution | `WeightSummary.tsx` | `chartOpen` init: `true` → `false` |

**Temporary panels already start closed** (no change needed):
- `backgroundPickerOpen` → `false` ✓
- `showShareMenu` → `false` ✓
- `showPreview` → `false` ✓
- `showResetConfirm` → `false` ✓
- `showNewConfirm` → `false` ✓
- `showSaveDialog` → `false` ✓
- `showUserMenu` → `false` ✓

The `allOpen=false` init means the "Close" button in the Open/Close control appears highlighted on startup — correctly reflecting the collapsed state.

---

## Confirmation: Saved Checkbox State Preserved

`replaceStore(entry.store)` loads the exact saved `store` object, which includes each `GearItem.checked` field exactly as it was when the file was last saved. **No checkbox states are modified** by the panel collapse. Collapsing is purely visual React state — gear data is untouched. ✓

---

## Unsaved-Change Behavior

**Before this prompt:**  
Unsaved changes were automatically recovered on reload via `pack-checklist-v5-${userId}` (the auto-save key). Users always returned to their exact last-working state, including unsaved changes.

**After this prompt:**  
When a last-active saved file exists, startup loads the **saved state** from the Locker entry (via `replaceStore(entry.store)`). Any unsaved changes made after the last Save are **not restored**. This is exactly what the prompt specifies:  
> "Return to the same SAVED FILE. If the user modifies gear but does NOT save those modifications before closing TrailWeigh, do not silently save them merely because this prompt remembers the last active file."

**If no last-active saved file exists** (e.g. user never saved to Locker): startup behavior is unchanged — the auto-saved working state from `pack-checklist-v5-${userId}` loads as before.

---

## Files Changed

| File | Change |
|------|--------|
| `src/pages/Checklist.tsx` | +150 lines net: helpers, startup effect, write-last-active at 4 call sites, delete clear |
| `src/components/WeightSummary.tsx` | `summaryOpen` and `chartOpen` init: `true` → `false` |
| `src/components/GearCategory.tsx` | `isOpen` init: `true` → `false` |
| `src/hooks/workspace022G.test.mjs` | NEW — 56 source-level tests |
| `package.json` (root) | Added `workspace022G.test.mjs` to `test:importer` chain |

---

## Files Unchanged (regression-verified)

- `src/pages/SharedChecklistPage.tsx` — 022F fix intact; no last-active writes
- `src/pages/info/HelpPage.tsx` — 022C unchanged
- `src/pages/info/AboutPage.tsx` — 022D unchanged
- `src/pages/info/HowItWorksPage.tsx` — 022E unchanged
- `src/components/Footer.tsx` — unchanged
- `src/App.tsx` — unchanged
- `src/hooks/usePackData.ts` — unchanged
- All save/locker/share logic — unchanged

---

## Backups

- `workflow-reports/PRE_022G_Checklist_BACKUP.tsx`
- `workflow-reports/PRE_022G_WeightSummary_BACKUP.tsx`
- `workflow-reports/PRE_022G_GearCategory_BACKUP.tsx`

---

## Automated Tests Added

**File:** `src/hooks/workspace022G.test.mjs`  
**56 tests across 13 suites:**

| Suite | Tests |
|-------|-------|
| Last-Active Persistence Infrastructure | 7 |
| Startup Restoration useEffect | 14 |
| Write Last-Active on Save/Open | 4 |
| Clear Last-Active on Delete | 2 |
| All Panels Start Collapsed | 4 |
| Temporary Panels Already Start Closed | 3 |
| Shared-Link Isolation | 2 |
| Account Isolation | 3 |
| Open/Close Control Regression | 5 |
| Save Behavior Preserved | 3 |
| 022F Regression (Shared Footer) | 3 |
| Prior Prompt Regression (022C/D/E) | 3 |
| Footer Design Unchanged | 2 |

---

## Manual / Runtime Tests — Verification Status

| Test | Status | Notes |
|------|--------|-------|
| 18. Normal reopen — same file, name, background, checked gear, all panels closed | **NOT TESTED** | Requires browser close/reopen |
| 18. Pack Summary closed | **NOT TESTED** | Source confirms `summaryOpen=false` init |
| 18. Weight Distribution closed | **NOT TESTED** | Source confirms `chartOpen=false` init |
| 18. All gear categories closed | **NOT TESTED** | Source confirms `isOpen=false`, `allOpen=false` |
| 18. No temporary menus open | **PARTIAL** — source confirms all temp panels init to `false` | Runtime verify |
| 19. Switch files (File A then File B → reopen shows B) | **NOT TESTED** | Requires runtime |
| 20. Save As becomes new active file on reopen | **NOT TESTED** | Requires runtime |
| 21. Deleted file — no error loop, safe fallback | **PARTIAL** — source confirms stale-key clear + entry-not-found guard | Runtime verify |
| 22. Account isolation (User A's file not shown to User B) | **NOT TESTED** | Requires two accounts and browser |
| 23. Shared link does not replace private last-active | **PARTIAL** — confirmed SharedChecklistPage never writes last-active key | Runtime verify |
| 24. No hidden autosave — Save/Save As behavior unchanged | **PARTIAL** — confirmed `commitSaveNew`/`commitSaveReplace` unchanged; only adds one `writeLastActiveFileToLS` line each | Runtime verify |

---

## Failed Attempts / Issues During Implementation

1. **021D test regression (handleLoadFromLocker string collision):** The startup restoration comment originally contained the text `handleLoadFromLocker`. The 021D test finds this function via `checklist.indexOf('handleLoadFromLocker')` — my comment was found first, causing the 2000-char test slice to read the wrong code block. **Fixed:** changed comment to `"mirrors the in-place Locker-load non-fork path"` (no collision).

2. **021F comment-rename collision:** Changed `"Scrollable sidebar content"` comment in SharedChecklistPage.tsx during 022F — the 021F test found this literal string. **Fixed in 022F:** reverted comment to its exact original text.

---

## Confirmation: Prompt 022F Intact

- `SharedChecklistPage.tsx` outer wrapper: `min-h-[100dvh] flex flex-col` ✓
- No `h-[100dvh] overflow-hidden` on outer wrapper ✓
- Sticky header present ✓
- Footer in normal document flow ✓
- `backgroundAttachment: 'fixed'` for background images ✓

---

## Anything Requiring User Verification

1. **Browser close/reopen:** Open a saved file → close browser entirely → reopen → confirm correct file, background, checked gear, all panels collapsed.
2. **Browser refresh:** Open saved file → press F5 → confirm same file reloads with all panels collapsed.
3. **Switch files:** Open File A, then open File B from Locker → close → reopen → confirm File B (not A) opens.
4. **Save As:** Use Save As → close → reopen → confirm new file opens.
5. **Delete last-active:** Open a saved file, then delete it → close → reopen → confirm fallback (no error, no recreation).
6. **Account isolation:** User A opens file, signs out, User B signs in → confirm User A's file is not shown.
7. **Shared link isolation:** Open saved file → open shared link → navigate back → close → reopen → confirm original private file still opens.
8. **Unsaved changes:** Open saved file, add gear but don't save → close → reopen → confirm only the saved state is loaded (unsaved changes not present).

---

## Test Results Summary

```
Full suite: all prior suites 0 failed ✅

022G Last-Active Persistence Infrastructure:  7 tests  ✅
022G Startup Restoration useEffect:          14 tests  ✅
022G Write Last-Active on Save/Open:          4 tests  ✅
022G Clear Last-Active on Delete:             2 tests  ✅
022G All Panels Start Collapsed:              4 tests  ✅
022G Temporary Panels Already Start Closed:   3 tests  ✅
022G Shared-Link Isolation:                   2 tests  ✅
022G Account Isolation:                       3 tests  ✅
022G Open/Close Control Regression:           5 tests  ✅
022G Save Behavior Preserved:                 3 tests  ✅
022G 022F Regression (Shared Footer):         3 tests  ✅
022G Prior Prompt Regression (022C/D/E):      3 tests  ✅
022G Footer Design Unchanged:                 2 tests  ✅
──────────────────────────────────────────────────────
022G Workspace Restore: 56 passed, 0 failed   ✅
```
