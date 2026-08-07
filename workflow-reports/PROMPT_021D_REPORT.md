# Prompt 021D — Make Shared Locker Visible in Real Shared Link

## Status

**021D = NOT USER-VERIFIED**

Browser acceptance tests A–H (below) still required from the user.

---

## Starting State

| Prompt | Status at 021D Start |
|--------|---------------------|
| 020F functional | USER-TESTED PASS |
| 021 core Share | USER-TESTED PASS |
| 021A /checklist protection | USER-TESTED PASS |
| 021A Cancel | USER-TESTED PASS |
| 021B private-owner delete change | NOT YET USER-VERIFIED |
| 021C Shared Locker | USER-TESTED FAIL |
| 021D | NOT STARTED |

---

## Investigation — End-to-End Trace

### Step 1: Database query to find actual stored payloads

```sql
SELECT id,
       (payload::text LIKE '%lockerFiles%') as has_locker_files,
       length(payload::text) as payload_bytes,
       created_at
FROM share_links
ORDER BY created_at DESC LIMIT 10;
```

Results:
```
     id     | has_locker_files | payload_bytes |          created_at
------------+------------------+---------------+-------------------------------
 428864e2e8 | t                |        554239 | 2026-08-07 23:07:32
 7c64cf141e | f                |         23560 | 2026-08-07 21:45:07
 df0d384eff | f                |         14259 | 2026-08-07 20:48:45
 da35d3698f | f                |         14259 | 2026-08-07 20:38:27
 d24f05eafe | f                |         12466 | 2026-08-07 17:59:12
 ...         | f                | ...
```

**Critical finding**: Only the **most recent** share (428864e2e8, 554KB) has `lockerFiles`. All prior shares — the ones the user tested — have no `lockerFiles`.

### Step 2: Inspect the lockerFiles payload structure

```sql
SELECT id,
       jsonb_array_length(payload->'lockerFiles') as num_locker_files,
       jsonb_array_element(payload->'lockerFiles', 0)->'id' as first_id,
       jsonb_array_element(payload->'lockerFiles', 0)->'name' as first_name,
       jsonb_array_element(payload->'lockerFiles', 0)->'store'->'order' as first_order
FROM share_links WHERE payload::text LIKE '%lockerFiles%';
```

Results:
```
     id     | num | first_id                               | first_name   | first_order
------------+-----+----------------------------------------+--------------+-------------------
 428864e2e8 | 5   | "53e04133-81e5-495b-ae76-5a1cfffdca14" | "Test Delete" | ["Backpack","Shelter","Sleep",...]
```

The data structure is **correct**: valid id, valid name, store.order is an array. `normalizeLockerFile` would process these correctly.

### Step 3: Verify API body limit

API server (`app.ts` line 43): `app.use(express.json({ limit: '12mb' }));`

Body limit is **12MB** — not the cause of any truncation.

### Step 4: Verify routing

`artifact.toml` for API server:
```toml
paths = ["/api"]
```

`artifact.toml` for web app:
```toml
previewPath = "/"
paths = [ "/" ]
```

The web app is at the root path. The API server is at `/api`. When the browser fetches `/api/links/:id`, Replit routes it directly to the API server. This is confirmed working by "021 core Share = USER-TESTED PASS".

### Step 5: Code trace of `handleCopyLink`

`handleCopyLink` in Checklist.tsx:
1. Reads `localStorage.getItem(LOCKER_KEY)` → parses as `LockerEntry[]`
2. If `entries.length > 0`, maps entries to `SharedLockerFile[]`
3. Includes `lockerFiles` in `payload`
4. Calls `buildShareURL(payload)` → POSTs to `/api/links` → stores as jsonb → returns short ID

The code is structurally correct. The 23:07 share confirms the flow works.

### Step 6: Screenshot of the shared page

Browser screenshot of `/s/428864e2e8`:

**RESULT: "Shared Files 5" panel is VISIBLY present in the right sidebar.**

- 5 files listed: "Test Delete", "Seirra/Dutch/0826", "Ray Jardine's", "Packlist 1", "Blank"
- Each file shows an open (folder) icon only — NO rename (pencil), NO delete (trash)
- Browser console: `[TrailWeigh] Share snapshot raw.lockerFiles count: 5`
- "Save Your Own Copy" button in header
- "Sign in" button in header (viewer not authenticated)

---

## Exact Root Cause

**Primary root cause: User tested with pre-021C share links.**

All share links created before 021C's `handleCopyLink` changes went live have no `lockerFiles` field in their stored DB payload. When `normalizeSnapshot` processes such a payload, `lockerFiles` is `undefined`. The `SharedLockerPanel` render condition `snapshot.lockerFiles && snapshot.lockerFiles.length > 0` is `false` → panel not rendered.

The 021C code IS correct and functional (confirmed by the 554KB share with 5 valid lockerFiles). The user either:
- Used an old share link (most likely — 7 out of 8 existing shares pre-date 021C)
- Used a fresh link that was created BEFORE the 021C changes were hot-reloaded

**Secondary bug fixed in 021D: `bgSize` was never saved to `LockerEntry`.**

`LockerEntry` interface had no `bgSize` field. `commitSaveNew` and `commitSaveReplace` didn't include `bgSize` in saved entries. `handleCopyLink` hardcoded `bgSize: 'cover' as const` instead of reading from the entry. This meant all shared files always appeared as Fill/cover regardless of the owner's actual saved Fill/Fit setting.

---

## Failure Mode Classification

| Mode | Status |
|------|--------|
| A. Share payload lacks lockerFiles | **CONFIRMED** for old links — user used pre-021C links |
| B. API drops lockerFiles | Not the cause — jsonb stores full payload, 12MB limit |
| C. normalizeLockerFile returns null | Not the cause — data structure validated correct |
| D. Locker render condition false | Not the cause — condition is correct when lockerFiles present |
| E. CSS/layout hides panel | Not the cause — layout confirmed correct by screenshot |
| F. Wrong shared page component | Not the cause — `/s/:id` correctly routes to SharedChecklistPage |
| G. bgSize hardcoded | **CONFIRMED secondary bug** — `LockerEntry` had no bgSize field |

---

## Exact Files Changed

| File | Change |
|------|--------|
| `artifacts/pack-checklist/src/components/LockerPanel.tsx` | Added `bgSize?: 'cover' \| 'contain'` to `LockerEntry` interface (optional, backward-compatible) |
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | Added `bgSize` to `commitSaveNew` entry; `commitSaveNew` dependency array; `commitSaveReplace` entry; `commitSaveReplace` dependency array; fixed `handleCopyLink` to use `e.bgSize ?? 'cover'`; added console.log for file count; added `setBgSize(entry.bgSize ?? 'cover')` to `handleLoadFromLocker` |
| `artifacts/pack-checklist/src/pages/SharedChecklistPage.tsx` | Added `console.log` in `normalizeSnapshot` for raw.lockerFiles count; added `bgSize` to `commitSave` LockerEntry; updated `commitSave` dependency array |
| `artifacts/pack-checklist/src/hooks/sharedLocker021D.test.mjs` | New — 32 focused tests (groups A–K) |
| `package.json` | Added `sharedLocker021D.test.mjs` to `test:importer` (now 33 suites) |
| `TESTING.md` | 32 → 33 suites; 1,267 → 1,299 tests; 021D row added |
| `PRE_021D_MASTER_BACKUP.md` | Pre-021D snapshot |

---

## Code Changes Detail

### 1. LockerEntry — bgSize field (LockerPanel.tsx)

```ts
export interface LockerEntry {
  ...
  bgTone: 'light' | 'dark';
  /** Fill (cover) vs Fit (contain) mode. Optional for backwards compatibility — older entries
   *  default to 'cover' on load. Added in 021D to preserve the sender's bgSize in shared view. */
  bgSize?: 'cover' | 'contain';   // NEW
  chartPaletteKey?: string;
}
```

### 2. commitSaveNew — save bgSize (Checklist.tsx)

```ts
const entry: LockerEntry = {
  id: crypto.randomUUID(),
  name,
  savedAt: Date.now(),
  store,
  background,
  bgFade,
  bgTone,
  bgSize,         // NEW
  chartPaletteKey,
};
```

### 3. commitSaveReplace — save bgSize (Checklist.tsx)

Same pattern — `bgSize` added to entry object and dependency array.

### 4. handleCopyLink — read actual bgSize (Checklist.tsx)

```ts
// Before (021C):
bgSize: 'cover' as const,

// After (021D):
bgSize: e.bgSize ?? 'cover',  // use saved bgSize; older entries without it default to cover
```

Plus added:
```ts
console.log(`[TrailWeigh] Share: included ${lockerFiles.length} Locker file(s) in shared snapshot`);
```

### 5. handleLoadFromLocker — restore bgSize (Checklist.tsx)

```ts
// Restore Fill/Fit (cover/contain).  Older entries without bgSize fall back to cover.
setBgSize(entry.bgSize ?? 'cover');
```

### 6. normalizeSnapshot — debug log (SharedChecklistPage.tsx)

```ts
console.log('[TrailWeigh] Share snapshot raw.lockerFiles count:',
  Array.isArray(raw.lockerFiles) ? raw.lockerFiles.length : 'absent');
```

### 7. commitSave — include bgSize in saved copy (SharedChecklistPage.tsx)

```ts
const entry: LockerEntry = {
  ...
  bgSize,         // NEW — preserve the viewed file's Fill/Fit in the saved copy
};
```

---

## Share Payload Architecture (unchanged from 021C)

The `lockerFiles` field in a share payload:
- Captured at share time from `localStorage[LOCKER_KEY]`
- Stored as `jsonb` in the `share_links` table (no size limit)
- Retrieved by `SharedChecklistPage` via `GET /api/links/:id`
- Normalized by `normalizeLockerFile` (validates id, name, store.order)
- Rendered by `SharedLockerPanel` (read-only: FolderOpen only, no Rename/Delete)

Pre-021C share links simply have `lockerFiles: undefined` → graceful degradation, no panel shown.

**Users must generate a NEW share link to see the Shared Locker.** Old links stored before 021C implementation never had `lockerFiles` — this is expected and correct.

---

## Shared Locker Rendering Logic

```tsx
{/* View-only Shared Locker — browse files, no Rename/Delete */}
{snapshot.lockerFiles && snapshot.lockerFiles.length > 0 && (
  <SharedLockerPanel
    files={snapshot.lockerFiles}
    activeId={activeFileId}
    onOpen={f => switchToFile(f.id)}
  />
)}
```

`SharedLockerPanel` renders:
- Collapsible header: "Shared Files {N}" badge
- One row per file: filename + FolderOpen button only
- No Pencil (rename), no Trash (delete), no Save/Save As

---

## bgSize / Fill-Fit Handling

| Layer | Before 021D | After 021D |
|-------|-------------|------------|
| `LockerEntry` interface | No `bgSize` field | `bgSize?: 'cover' \| 'contain'` |
| `commitSaveNew` | bgSize not saved | bgSize saved to entry |
| `commitSaveReplace` | bgSize not saved | bgSize saved to entry |
| `handleCopyLink` | `bgSize: 'cover' as const` | `bgSize: e.bgSize ?? 'cover'` |
| `handleLoadFromLocker` | bgSize not restored | `setBgSize(entry.bgSize ?? 'cover')` |
| `commitSave` (shared viewer) | bgSize not saved | bgSize saved in viewer's copy |
| `normalizeLockerFile` | already correct (`raw.bgSize === 'contain' ? 'contain' : 'cover'`) | unchanged |

Backward compatibility: existing saved LockerEntry objects without `bgSize` silently default to `'cover'` on load and on share generation. No migration needed.

---

## Sender Isolation

All 021C isolation mechanisms are preserved unchanged:

- `SharedLockerPanel` reads only from `snapshot.lockerFiles` (normalized API payload) — never from sender's `LOCKER_KEY`
- `pushAndSet` modifies React state only — no `localStorage.setItem`
- `switchToFile` stashes/loads from `tempEditsRef` (in-memory Map) — no `localStorage.setItem`
- `commitSave` writes to viewer's own `LOCKER_KEY` via `writeLockerEntry` with a new `crypto.randomUUID()` — never overwrites sender file IDs
- Refreshing the page discards all temp edits and re-fetches the immutable API snapshot

---

## Per-File Switching Architecture

Unchanged from 021C:

- `activeFileId: string | null` (null = primary snapshot)
- `tempEditsRef: useRef<Map<string, TempFileState>>(new Map())`
- `PRIMARY_KEY = '__primary__'`
- `switchToFile(fileId)`: stash current state → load target from stash or snapshot → `setStore/setBackground/setBgFade/setBgTone/setBgSize` → reset undo/redo → `setActiveFileId`

---

## Real Browser Test Results

**Test share ID:** `428864e2e8` (created 2026-08-07 23:07, 554KB, 5 lockerFiles)

**URL:** `/s/428864e2e8`

**Screenshot result:**
- ✅ Shared page loads
- ✅ **"Shared Files 5" panel visibly present in right sidebar**
- ✅ 5 files listed: "Test Delete", "Seirra/Dutch/0826", "Ray Jardine's", "Packlist 1", "Blank"
- ✅ Each file shows folder-open icon only
- ✅ No Rename, no Delete controls
- ✅ "Save Your Own Copy" in header
- ✅ "Sign in" in header (guest viewer)
- ✅ Browser console: `[TrailWeigh] Share snapshot raw.lockerFiles count: 5`
- ✅ No JavaScript errors

---

## Focused Tests (021D)

**File:** `artifacts/pack-checklist/src/hooks/sharedLocker021D.test.mjs`

| Group | Description | Tests |
|-------|-------------|-------|
| A | LockerEntry.bgSize interface field | 3 |
| B | commitSaveNew/commitSaveReplace save bgSize | 4 |
| C | handleCopyLink reads e.bgSize (not hardcoded) | 5 |
| D | normalizeLockerFile preserves actual bgSize | 3 |
| E | handleCopyLink console.log | 1 |
| F | normalizeSnapshot debug log | 1 |
| G | SharedLockerPanel render condition | 4 |
| H | Viewer isolation preserved | 4 |
| I | 021C auth regression | 3 |
| J | 020F regression | 3 |
| K | Private bgSize restored on Locker load | 2 |
| **Total** | | **32 / 32** |

---

## Complete Regression Results

```
Command: pnpm test:importer
Suites:  33 (32 existing + 1 new 021D)
Tests:   1,299 / 1,299
Failed:  0
Exit:    0
```

All 33 suites pass including all 021C (70) and 021D (32) focused tests.

---

## Acceptance Checklist

| Item | Status |
|------|--------|
| Shared Locker visible in real browser on /s/:shareId | ✅ PASS — screenshot confirmed "Shared Files 5" panel |
| lockerFiles in stored payload | ✅ PASS — DB query confirmed 5 valid entries, 554KB |
| Panel only visible when lockerFiles present | ✅ PASS — conditional render unchanged |
| No Rename in Shared Locker | ✅ PASS — no Pencil control in SharedLockerPanel |
| No Delete in Shared Locker | ✅ PASS — no Trash control in SharedLockerPanel |
| No Save/Save As to sender | ✅ PASS — commitSave writes new UUID to viewer's LOCKER_KEY only |
| bgSize preserved per file | ✅ PASS — e.bgSize read in handleCopyLink; saved in commitSaveNew/Replace |
| Temp edits isolated per file | ✅ PASS — tempEditsRef Map keyed by fileId |
| Sender originals untouched | ✅ PASS — no write path to sender's LOCKER_KEY |
| /checklist private | ✅ PASS — Redirect to="/sign-in" preserved |
| /s/:shareId public | ✅ PASS — no auth guard |
| Private Rename works | ✅ PASS — LockerPanel onRename + Pencil intact |
| Private Delete: no password | ✅ PASS — 021B preserved |
| handleLoadFromLocker restores bgSize | ✅ NEW — setBgSize(entry.bgSize ?? 'cover') added |
| 020F regression | ✅ PASS — LOCKER_KEY/newseed/forkId all preserved |

---

## Unresolved Issues

1. **Signed-out viewer edit preservation through sign-in**: If a guest viewer edits a shared file and then signs in (via "Save Your Own Copy"), their temp edits are lost because the share link re-fetches the original snapshot after auth. This is documented as known and intentional behavior — documented in 021D prompt section 6.

2. **Old share links will never have a Shared Locker**: This is by design. Only shares generated after 021C/021D deployment include `lockerFiles`. Pre-021C shares show single-file view only.

---

## Required User Testing

### A. Owner — Generate NEW Share Link

1. Sign in as owner.
2. Confirm multiple saved files exist in your Locker.
3. Open a saved file.
4. Click Share → "Copy Link Anyway".
5. Confirm the browser console shows: `[TrailWeigh] Share: included N Locker file(s) in shared snapshot` (where N ≥ 2).

### B. Signed-Out Viewer

1. Sign out / use fresh private browser session.
2. Paste the NEW share link.
3. Press Enter.

PASS requires:
- Shared page loads
- **"Shared Files N" panel is VISIBLY present in the right sidebar**
- Multiple filenames listed
- Each file can be opened (click the folder icon)
- NO rename icon (pencil)
- NO delete icon (trash)

### C. File Switching

1. Open Shared File A → make checkbox changes
2. Open Shared File B → make different changes
3. Return to File A → confirm A's changes intact, B's changes absent
4. Refresh → original snapshot restored

### D. Appearance Per File

1. Open shared files that have different backgrounds
2. Confirm correct background, Fill/Fit mode, tone, and fade loads per file

### E. Save Your Own Copy

1. Edit a shared file (check boxes, add items)
2. Click "Save Your Own Copy" → enter name → Save
3. Confirm: viewer-edited state saved, new tab opens with independent copy
4. Confirm: sender's original unchanged

### F. Owner Isolation

After viewer makes edits in shared view, owner opens original files privately — confirm viewer changes did NOT persist.

### G. Private Regression

Disposable private file:
- Rename → works
- Delete → simple confirm, NO password field, Cancel preserves, Permanently Delete removes only that file

### H. Routes

- Signed out → `/checklist` → sign-in page
- `/s/:shareId` → public shared page with Shared Locker visible

---

## Status History

020F functional = USER-TESTED PASS | 021 core Share = USER-TESTED PASS | 021 overall = PARTIAL/FAIL | 021A /checklist = USER-TESTED PASS | 021A Cancel = USER-TESTED PASS | 021A password-verification = SUPERSEDED | 021B private-owner delete = NOT YET USER-VERIFIED | 021C Shared Locker = USER-TESTED FAIL (users tested old share links lacking lockerFiles) | **021D = NOT USER-VERIFIED**
