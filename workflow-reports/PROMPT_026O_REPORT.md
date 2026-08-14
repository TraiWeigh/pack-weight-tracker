# Prompt 026O — Diagnosis Report: Phone View-mode Failure

**Prompt ID**: 026O  
**Follows**: 026N (Owner View/Edit Mode)  
**Status**: DEFECT FOUND — root cause identified, patch applied  

---

## 1. Evidence & Symptom

User tested 026N on their phone. After opening a saved Locker file, **all structural
controls remained interactive**: name/weight/qty editable, Add Item visible, Add Category
visible, reorder handles active. View mode was not being applied.

---

## 2. Trace: All Saved-List Open Paths

026N introduced `ownerMode: 'view' | 'edit'` state in `ChecklistContent`.  
Three paths were identified and instrumented with `setOwnerMode('view')`:

| # | Path | Line | Trigger |
|---|------|------|---------|
| A1 | Startup last-active restoration | 1668 | Fresh open of primary tab |
| A2 | `?savedListId=` fork-tab mount effect | 1574 | New tab opened via `window.open` |
| A3 | In-place Locker open (`handleLoadFromLocker`) | 1956 | `totalItems === 0` path |

No fourth open path exists (verified: `LockerPanel.onLoad` has a single `onClick` at line 219;
`ReviewPage` always passes `isReview` which bypasses the ownerMode guard; `SharedChecklistPage`
is a separate component that does not use `ownerMode` at all).

---

## 3. Root Cause

**File**: `artifacts/pack-checklist/src/pages/Checklist.tsx`  
**Effect**: startup last-active restoration (lines 1593–1670)  
**Deps**: `[]` — ran exactly once at mount  

### Defective Sequence (mobile — server-only files, localStorage empty or stale)

```
1. Component mounts.
   lockerEntries = []  (localStorage cache empty on this device)
   userId = user.id    (always defined at mount — auth guard in parent)

2. Startup restoration effect fires (deps = []).
   readLastActiveFileFromLS(userId) → { id: "abc", name: "Summer Trip" }
   lockerEntries.find(e => e.id === "abc") → undefined   (list is empty)

3. Code reaches the "not found" branch:
     writeLastActiveFileToLS(userId, null);   ← DESTROYS the lastActive pointer
     return;

4. ownerMode stays 'edit' (no ACTIVE_LOCKER_FILE_SS_KEY in sessionStorage).

5. performLockerSync fires (userId-dep effect, runs after mount).
   Server returns [{ id: "abc", ... }] — the entry IS on the server.
   setLockerEntries([...]) → Locker panel now shows files.
   localStorage.setItem(LOCKER_KEY, ...) → local cache written.

6. Startup restoration does NOT re-run (deps = []).
   lastActive is now null → even if it did re-run, nothing would load.

7. User sees their Locker files listed (from step 5's state update)
   but the primary tab has ownerMode = 'edit'.
```

### Why Only the Primary Tab Is Affected

- **A2 (fork tab)**: `usePackData` reads from `localStorage.getItem(LOCKER_KEY)`.  
  By step 5 the key is written, so the fork tab finds the entry → `tw-savedlist-entry-id`
  set → `setOwnerMode('view')` ✅  
- **A3 (in-place)**: fires only when `totalItems === 0`. With a brand-new empty local store
  (step 1), `totalItems = 0` → in-place path → `setOwnerMode('view')` ✅  

**But** if the user has items in their current list from any previous unsaved session on this
device (rare but possible), `totalItems > 0` → A3 does not run → `window.open()` fires →
new tab enters view mode (A2) but the primary tab remains `'edit'`.

More commonly: the user is simply on the primary tab, still in `'edit'` because step 3
prematurely destroyed `lastActive`, and the entire startup flow never recovered.

---

## 4. Fix Applied

### Strategy

- Add a `startupRestoredRef` boolean ref so the effect can safely use `[lockerEntries]`
  as its dependency without re-running after a successful restoration.
- Guard the "file not found" branch behind a `lockerEntries.length === 0` check: when the
  list is empty, return without destroying `lastActive` — the sync may still be in flight.
- Once `lockerEntries` populates (sync completes), the effect re-fires, finds the entry,
  restores the file, and calls `setOwnerMode('view')`.

### Files Changed

| File | Change |
|------|--------|
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | startup restoration effect: add `startupRestoredRef`, add `lockerEntries.length === 0` guard, change deps from `[]` to `[lockerEntries]` |

No changes to `GearCategory.tsx` or `GearRow.tsx` — runtime tracing confirmed they are
correct. No database, API, auth, deployment, or package changes.

---

## 5. Runtime Verification

Screenshots taken at ~390 px viewport (portrait phone simulation):

- **View state**: structural controls hidden — item rows show read-only spans, Add Item
  button absent, Add Category section absent, drag handles absent, delete buttons absent.
  Edit button visible in lower toolbar.
- **Edit state**: all structural controls present — inputs for name/weight/qty, Add Item,
  Add Category, drag handles, delete buttons. Done button visible in lower toolbar.

---

## 6. Change Summary

```
Checklist.tsx:
  + const startupRestoredRef = useRef(false);       (before the effect)
  + startupRestoredRef.current = true               (all definitive exit branches)
  + if (lockerEntries.length === 0) return;          (guard — wait for sync)
  ~ deps: [] → [lockerEntries]                       (allow re-run after sync)
```

Total lines changed: ~10 (additions/edits in the startup restoration block).
