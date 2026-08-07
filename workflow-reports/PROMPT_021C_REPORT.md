# Prompt 021C — Add View-Only Shared Locker + Preserve Viewer Isolation

## Status

**021C = NOT USER-VERIFIED**

Browser acceptance tests A–I (below) still required from the user.

---

## Starting State

| Prompt | Status |
|--------|--------|
| 020F functional | USER-TESTED PASS |
| 021 core Share | USER-TESTED PASS |
| 021A /checklist protection | USER-TESTED PASS |
| 021A Cancel | USER-TESTED PASS |
| 021A password-verification | SUPERSEDED by 021B |
| 021B private-owner delete change | NOT YET USER-VERIFIED |
| 021B Shared Locker | INCOMPLETE |
| 021C | NOT STARTED |

---

## Why the Shared Locker Was Missing in 021B

The 021B report explicitly acknowledged the gap:

> "The `SharedChecklistPage.tsx` currently renders no `LockerPanel`, so the shared Locker requirement is INCOMPLETE."

The root cause: the `SharePayload` type only carried a **single file snapshot** (`data`, `categoryOrder`, `categoryMeta`, plus appearance fields). There was no array of Locker files in the payload, and `SharedChecklistPage.tsx` had no component to render a file list.

021B verified absence of rename/delete controls, but that test passed vacuously — the Locker panel itself was simply absent.

---

## Share Storage / Payload Architecture

### Before 021C

```ts
export interface SharePayload {
  data: PackState;              // ONE file's gear items
  categoryOrder: string[];
  categoryMeta: Record<string, CategoryMeta>;
  background?: Background | null;
  bgFade?: number;
  bgTone?: 'light' | 'dark';
  bgSize?: 'cover' | 'contain';
  unit?: UnitSystem;
  name?: string;               // ONE file's name (display only)
}
```

**SharedChecklistPage**: No LockerPanel. One file. No file-switching UI.

### After 021C

```ts
export interface SharedLockerFile {
  id: string;
  name: string;
  store: { items: PackState; order: string[]; meta: Record<string, CategoryMeta> };
  background?: Background | null;
  bgFade?: number;
  bgTone?: 'light' | 'dark';
  bgSize?: 'cover' | 'contain';
  chartPaletteKey?: string;
}

export interface SharePayload {
  // ... all existing fields unchanged ...
  lockerFiles?: SharedLockerFile[];   // NEW: snapshot of all saved Locker files
}
```

- `lockerFiles` is **optional** — pre-021C shares work exactly as before (no panel shown for single-file fallback)
- Contains **only saved file state** — never credentials, auth tokens, or private storage refs
- Captured at share-generation time in `handleCopyLink` — snapshot of the sender's Locker at that moment

---

## Exact Files Changed

| File | Change |
|------|--------|
| `artifacts/pack-checklist/src/lib/shareLink.ts` | Added `SharedLockerFile` interface; added `lockerFiles?: SharedLockerFile[]` to `SharePayload` |
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | Added `SharedLockerFile` import; extended `handleCopyLink` to read Locker entries and include them as `lockerFiles` in the payload |
| `artifacts/pack-checklist/src/pages/SharedChecklistPage.tsx` | Added `SharedLockerFile` import; added `TempFileState` type; added `PRIMARY_KEY` constant; added `SharedLockerPanel` component; added `activeFileId` state + `tempEditsRef`; added `switchToFile` callback; updated banner to show active file name; added `SharedLockerPanel` to sidebar; added `normalizeLockerFile` function; updated `normalizeSnapshot` to handle `lockerFiles`; added `FolderOpen`, `ChevronDown`, `ChevronRight` lucide imports |
| `artifacts/pack-checklist/src/hooks/sharedLocker021C.test.mjs` | New — 70 focused tests (groups A–K) |
| `package.json` | Added `sharedLocker021C.test.mjs` to `test:importer` (now 32 suites) |
| `TESTING.md` | 31 → 32 suites; 1,197 → 1,267 tests; 021C row added |
| `PRE_021C_MASTER_BACKUP.md` | Pre-021C snapshot |

---

## How the Shared Locker Is Populated

**At share-generation time (`handleCopyLink` in Checklist.tsx):**

```ts
// Snapshot all saved Locker entries at share time
let lockerFiles: SharedLockerFile[] | undefined;
try {
  const rawLocker = localStorage.getItem(LOCKER_KEY);
  const entries: LockerEntry[] = rawLocker ? JSON.parse(rawLocker) : [];
  if (entries.length > 0) {
    lockerFiles = entries.map(e => ({
      id:              e.id,
      name:            e.name,
      store:           e.store,
      background:      e.background ?? null,
      bgFade:          e.bgFade ?? 1,
      bgTone:          e.bgTone ?? 'light',
      bgSize:          'cover',
      chartPaletteKey: e.chartPaletteKey,
    }));
  }
} catch { /* ignore — share works without locker snapshot */ }
```

This captures the **saved state** of all Locker files at the exact moment the user clicks Share. Unsaved working changes are not included (per the existing "Save first" warning).

**At view time (`normalizeSnapshot` in SharedChecklistPage.tsx):**

```ts
const lockerFiles = Array.isArray(raw.lockerFiles)
  ? raw.lockerFiles
      .map(normalizeLockerFile)
      .filter((f): f is SharedLockerFile => f !== null)
  : undefined;
```

`normalizeLockerFile` validates each entry: requires string `id`, string `name`, and `Array.isArray(store.order)`. Malformed entries are filtered to null and dropped.

---

## How the Shared Locker Is Isolated from the Private Locker

| Isolation layer | Mechanism |
|----------------|-----------|
| **Data source** | `SharedLockerPanel` reads only from `snapshot.lockerFiles` (already normalized from the API payload) — never from the sender's `LOCKER_KEY` localStorage |
| **No write path** | `SharedLockerPanel` has no save/rename/delete; `switchToFile` only mutates React state via `tempEditsRef` |
| **Snapshot immutability** | `snapshot` object is created once from the API response and never mutated |
| **Private Locker untouched** | `LOCKER_KEY` is only read/written by `readLockerEntries`/`writeLockerEntry` (recipient's own copy) and the sender's session (completely separate browser context) |

---

## Shared File Switching Architecture

**State:**
- `activeFileId: string | null` — which file is currently shown (`null` = primary snapshot)
- `tempEditsRef: useRef<Map<string, TempFileState>>(new Map())` — per-file in-memory stash keyed by file ID or `'__primary__'`

**`switchToFile(fileId: string | null)`:**
1. Save current `{store, background, bgFade, bgTone, bgSize}` into `tempEditsRef.current.set(currentKey, ...)`
2. Look up target file in stash (`tempEditsRef.current.get(newKey)`)
3. If not stashed: load from `snapshot.lockerFiles` (or primary snapshot)
4. Apply via `setStore`, `setBackground`, `setBgFade`, `setBgTone`, `setBgSize` (direct state set — not `pushAndSet`, so no undo entry for file switch)
5. Reset `undoStackRef.current = []` and `redoStackRef.current = []` (undo history is per-file context)
6. `setActiveFileId(fileId)`

**Result:** File A's temp edits cannot contaminate File B. Each file's appearance is fully isolated. Refreshing the page re-fetches the immutable API snapshot, restoring the original saved state.

---

## Temporary Edit State Architecture

- All mutations go through `pushAndSet` (same as before 021C)
- `pushAndSet` only writes to React state — never to localStorage, IndexedDB, or any API
- When the viewer switches files, their current temp edits for the old file are stashed in `tempEditsRef` (in-memory Map)
- `tempEditsRef` is a `useRef` — no persistence layer, no serialization, session-scoped only
- Refreshing the page destroys all temp state and re-fetches the original snapshot

---

## Save Your Own Copy Behavior

| Scenario | Behavior |
|----------|---------|
| Viewer is signed in | Dialog shown; viewer enters a name; `commitSave` uses current in-memory `store + background + bgFade + bgTone`; new `crypto.randomUUID()` ID assigned; written only to viewer's own `LOCKER_KEY` localStorage |
| Viewer is guest | Redirected to `/sign-up`; after auth, viewer can open any shared file and save |
| Name conflict | Replace or Save as New options |
| After save | Viewer's copy opens in a new tab via `/checklist?savedListId=<newId>`; sender's Locker unchanged |

`commitSave` always uses `crypto.randomUUID()` — it never reads `snapshot.id` (the shared snapshot has no file ID field; sharing is anonymous by design).

---

## Private Owner 021B Regression

Verified preserved:

- `LockerDeleteDialog.tsx`: no password input, no `useSignIn`, `Permanently Delete` + `Cancel` buttons only
- `LockerPanel.tsx`: `onRename` prop intact, `Pencil` icon rendered
- `requestProtectedDelete` auth guard in `Checklist.tsx`: still present as defense-in-depth
- No `isGuest` prop on `<LockerDeleteDialog>` (removed in 021B)

---

## Auth Route Regression

| Route | Behavior | Status |
|-------|----------|--------|
| `/checklist` (signed out) | `<Redirect to="/sign-in" />` in `Checklist.tsx` | ✅ Preserved |
| `/checklist` (signed in) | Renders private checklist + Locker | ✅ Preserved |
| `/s/:shareId` | No auth guard in App.tsx; public access | ✅ Preserved |
| `/s/:shareId` (signed out) | SharedLockerPanel visible from share snapshot | ✅ New (021C) |

The public viewer never gains access to the sender's private live Locker — the Shared Locker reads only from the normalized share snapshot, which contains only what the sender explicitly included at share time.

---

## Focused Tests (021C)

**File:** `artifacts/pack-checklist/src/hooks/sharedLocker021C.test.mjs`

| Group | Description | Tests |
|-------|-------------|-------|
| A | SharePayload & SharedLockerFile type | 8 |
| B | handleCopyLink includes lockerFiles | 6 |
| C | SharedLockerPanel — rendered, view-only | 8 |
| D | Multi-file state architecture | 11 |
| E | Sender isolation | 6 |
| F | Save Your Own Copy | 5 |
| G | normalizeLockerFile & normalizeSnapshot | 10 |
| H | Private owner 021B regression | 6 |
| I | Auth route regression | 3 |
| J | 021 Share regression | 4 |
| K | 020F regression | 3 |
| **Total** | | **70 / 70** |

---

## Complete Regression Results

```
Command: pnpm test:importer
Suites:  32 (31 existing + 1 new 021C)
Tests:   1,267 / 1,267
Failed:  0
Exit:    0
```

| Suite | Result |
|-------|--------|
| importGear.test.mjs | ✅ |
| importGear.pdf.test.mjs | ✅ |
| importGear.pdf.api.test.mjs | ✅ |
| scanGear.test.mjs | ✅ |
| categoryAliases.test.mjs | ✅ |
| usePackData.test.mjs | ✅ |
| moveItem.test.mjs | ✅ |
| pieColor.test.mjs | ✅ |
| bgCollections.test.mjs | ✅ |
| bgCollections016A.test.mjs | ✅ |
| bgPhotoStore016B.test.mjs | ✅ |
| controls017.test.mjs | ✅ 24/24 |
| landscapeHover017B.test.mjs | ✅ 22/22 |
| landscapeActiveBackground017C.test.mjs | ✅ 38/38 |
| landscapeShake017D.test.mjs | ✅ |
| landscapeShake017E.test.mjs | ✅ |
| activeFileName018.test.mjs | ✅ |
| activeFileName018A.test.mjs | ✅ |
| activeFileName018B.test.mjs | ✅ |
| activeFileName018C.test.mjs | ✅ |
| sidebar019.test.mjs | ✅ |
| newBlank020.test.mjs | ✅ |
| newClearLight041.test.mjs | ✅ |
| lockerFirstOpen020B.test.mjs | ✅ |
| newAfterLocker020C.test.mjs | ✅ |
| savedListRestore020D.test.mjs | ✅ |
| crossTabIsolation020E.test.mjs | ✅ |
| inheritedSessionStorage020F.test.mjs | ✅ 28/28 |
| shareLink021.test.mjs | ✅ 27/27 |
| authProtection021A.test.mjs | ✅ 28/28 |
| lockerSimpleDelete021B.test.mjs | ✅ 41/41 |
| **sharedLocker021C.test.mjs** | ✅ **70/70** |

Vite workflow: running cleanly, HMR updates only, no runtime errors in browser console.

---

## Acceptance Checklist

| Item | Status |
|------|--------|
| Shared Locker visible on /s/:shareId | ✅ PASS (SharedLockerPanel renders when lockerFiles present) |
| Rename absent from Shared Locker | ✅ PASS (no Pencil control in SharedLockerPanel) |
| Delete absent from Shared Locker | ✅ PASS (no Trash control in SharedLockerPanel) |
| Shared viewer cannot save to sender file | ✅ PASS (commitSave writes only to viewer's LOCKER_KEY with new UUID) |
| Temporary edits don't modify sender originals | ✅ PASS (all mutations in-memory via pushAndSet; no localStorage writes) |
| Viewer copy gets new unique ID | ✅ PASS (crypto.randomUUID() always) |
| Shared Locker from snapshot, not live private Locker | ✅ PASS (reads snapshot.lockerFiles, never sender's LOCKER_KEY) |
| File switching: no appearance/content leak | ✅ PASS (tempEditsRef keyed by file ID; setStore resets to file's own state) |
| Save Your Own Copy: preserves viewer edits | ✅ PASS (commitSave uses current in-memory store) |
| signed-out /checklist inaccessible | ✅ PASS (Redirect to="/sign-in" preserved) |
| public /s/:shareId works | ✅ PASS (no auth guard) |
| Private owner Rename works | ✅ PASS (LockerPanel onRename + Pencil intact) |
| Private owner Delete: no password | ✅ PASS (021B preserved — simple confirm only) |
| No existing user data erased | ✅ PASS (no schema migration; no localStorage.clear) |
| 020F appearance regression | ✅ PASS (LOCKER_KEY exported; forkId preserved; newseed intact) |

---

## Unresolved Issues

None at the structural/code level. All requirements satisfied in code. Browser acceptance by user still required.

---

## Required User Testing

### A. Create Share

1. Sign in as owner.
2. Ensure multiple saved files exist in your Locker.
3. Open a saved file.
4. Share → save-first warning.
5. Copy Link Anyway.

### B. Signed-Out Shared Locker

Open the Share Link while signed out.

Confirm:
- Public shared page opens
- **"Shared Files" panel visible in sidebar** with file count badge
- Expected filenames listed
- Clicking the open (folder) icon switches to that file
- **NO rename (pencil) icon**
- **NO delete (trash) icon**
- **NO normal Save/Save As to originals**
- "Save Your Own Copy" button available

### C. Multi-File Isolation

1. Open Shared File A → make checkbox changes
2. Open Shared File B → make different changes
3. Return to File A → confirm A's changes are intact and B's changes are absent
4. Open File B → confirm B's changes are intact and A's changes are absent
5. Confirm background/appearance is correct per file
6. Refresh the Share Link → original snapshot restored (not viewer edits)

### D. Original Owner Isolation

After viewer edits:
- Owner opens File A privately → no viewer changes
- Owner opens File B privately → no viewer changes

### E. Save Your Own Copy — Signed In

1. Edit a shared file (check boxes, add items)
2. Click "Save Your Own Copy" → enter name → Save
3. Confirm: viewer-edited state saved, new unique file ID, independent private file
4. Confirm: sender's original unchanged

### F. Save Your Own Copy — Signed Out

1. As signed-out viewer, edit a shared file
2. Click "Save Your Own Copy" → redirected to sign-up/sign-in
3. After auth, return and complete copy
4. Confirm: independent copy created

### G. Private Owner 021B Regression

Use a disposable file:
- Private Rename → works
- Private Delete → simple confirmation, NO password field, Cancel preserves, Permanently Delete removes only that file

### H. Routes

- Signed out → /checklist → sign-in page
- /s/:shareId → public Shared Locker visible

### I. 020F Regression

Ray → psychedelic · New → Clear/Light · Sierra → mountain · New → Clear/Light · Packlist 1 → Light/no bg · New → Clear/Light

---

## Status History

020F = USER-TESTED PASS | 021 core Share = USER-TESTED PASS | 021 overall = PARTIAL/FAIL | 021A /checklist = USER-TESTED PASS | 021A Cancel = USER-TESTED PASS | 021A password-verification = SUPERSEDED | 021B private-owner delete = NOT YET USER-VERIFIED | 021B Shared Locker = INCOMPLETE (fixed by 021C) | **021C = NOT USER-VERIFIED**
