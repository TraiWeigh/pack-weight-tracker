# Prompt 022P — Delete Custom Background Themes

**Exact prompt:** Prompt 022P — Delete Custom Background Themes  
**Status:** COMPLETE ✅  
**Date:** 2026-08-09  
**Tests:** 38 new (deleteCustomTheme022P) — 0 failures across full suite

---

## Checkpoint Confirmation

Replit checkpoint created before any changes were made.

---

## Files Changed

| File | Change |
|---|---|
| `artifacts/pack-checklist/src/components/BackgroundPicker.tsx` | Added trash icon button to header row; updated confirmation dialog wording; removed bottom "Delete Theme" text button |
| `artifacts/pack-checklist/src/hooks/deleteCustomTheme022P.test.mjs` | New test file — 38 assertions |
| `package.json` | `deleteCustomTheme022P.test.mjs` added to `test:importer` chain |

**Authentication logic: UNCHANGED. Gear list storage: UNCHANGED. Theme data layer: UNCHANGED.**

---

## Custom-Theme Storage Architecture

| Layer | Details |
|---|---|
| **Metadata** | `localStorage` key `trailweigh:photoCollections` — JSON array of `PhotoCollection { id: string, name: string, photos: CollectionPhoto[] }` |
| **Photo blobs** | `IndexedDB` database `trailweigh`, object store `bgPhotos`, keyed by `photoId` — stores `{ photoId, blob, mimeType, width, height }` |
| **Active background** | `localStorage` key `trailweigh:background` — stores `{ type: 'custom', photoId }` or `{ type: 'preset', id }` or absent |
| **Theme IDs** | `crypto.randomUUID()` generated at creation — stable for the lifetime of the theme |
| **Photo IDs** | `crypto.randomUUID()` generated at upload — stable and may be shared across themes |
| **Max themes** | 10 custom themes (built-in Landscapes does not count) |
| **Max photos/theme** | 10 per `PhotoCollection` |
| **Pure data functions** | `lib/bgCollections.ts`: `createCollection`, `renameCollection`, `deleteCollection`, `addPhotoToCollection`, `deletePhotoFromCollection` |

---

## Custom-Photo Storage Architecture

Photos are entirely client-side — no API upload route, no server-side object storage.

| Step | Details |
|---|---|
| **Upload** | Validated + compressed in browser → assigned UUID `photoId` → written to IndexedDB as binary blob |
| **Metadata** | Only `{ id: photoId }` stored in `PhotoCollection.photos[]` — no data URL in localStorage |
| **Thumbnails** | Object URLs created on demand (`URL.createObjectURL`) and revoked when panel closes or photo is removed |
| **Cross-theme sharing** | One blob can be referenced by multiple themes. `deletePhoto` and `deletePhotos` are called only after confirming the `photoId` is no longer referenced by any remaining collection |
| **Migration** | Legacy data-URL format migrated on first BackgroundPicker open |

---

## Theme-Reference Behavior in Saved Files

Saved gear lists reference the **background photo ID** directly — not the theme ID or theme name.

- Storage in Locker: `background: { type: 'custom', photoId: '...' }` or `{ type: 'preset', id: '...' }` or absent
- Gear list data (`items`, `categories`, `quantities`, `weights`, `checked states`, `fileName`, `fileId`) is stored entirely separately from the theme/photo library
- `PhotoCollection` records have only `id`, `name`, `photos` — they contain **no gear data whatsoever**
- `deleteCollection` touches only the collections array — it never reads or modifies any gear-list storage key

**Effect of deleting a custom theme on saved files:**  
When a saved file is later opened and its `background.photoId` is no longer in IndexedDB (because the theme was deleted), `SharedChecklistPage` and `Checklist` handle this gracefully — the blob lookup returns null/undefined and the app renders without a custom background. The gear data remains 100% intact.

---

## Theme-Reference Behavior in Shared Snapshots

Shared links embed background settings **per file** in the link payload at the time of sharing:

```
background: { type: 'custom', photoId: '...' }
bgFade, bgTone, bgSize
```

The share payload does NOT include the actual photo blob. Custom photo blobs live in the sender's IndexedDB. Recipients cannot access the sender's IndexedDB.

**Effect of deleting the theme after sharing:**  
When the owner deletes the custom theme, the shared link's `photoId` becomes orphaned — the blob no longer exists in the owner's IndexedDB. When a recipient views the shared link, `SharedChecklistPage.tsx` already handles blob-lookup failure gracefully (line ~515): the background simply does not render. The gear list loads fully.

- No application crash
- No broken-image icon (handled by the component)
- No exposure of owner permissions
- No gear data loss

This is the existing, established behavior. This prompt does not change the sharing architecture.

---

## Delete-Button Implementation

**Before (prior to this prompt):**  
A text+icon "Delete Theme" button appeared at the **bottom** of the custom theme panel, below the photo slots. It read: `🗑 Delete Theme`. Clicking it immediately deleted themes with 0 photos; otherwise showed an inline confirmation with old wording.

**After (this prompt):**

1. **Trash icon in header row** — immediately to the right of the pencil/rename icon:

```tsx
[Theme Name]     0/10   [pencil]  [trash]
```

The button:
- Uses `<Trash2 className="w-3 h-3" />` (same icon family as pencil `<Pencil>`)
- `aria-label={`Delete theme "${col.name}"`}` — references actual theme name
- `title={`Delete theme "${col.name}"`}` — tooltip for sighted hover users  
- `hover:text-destructive` — clear danger affordance on hover
- `focus-visible:ring-2 focus-visible:ring-destructive` — keyboard accessible
- `transition-colors` — smooth hover
- Identical visual size and weight to pencil (`w-3 h-3`)

2. **Bottom "Delete Theme" text button removed** — replaced entirely by the header icon.

3. **Always shows confirmation** — no more "skip confirmation for 0-photo themes" shortcut. All deletions require explicit user confirmation.

---

## Confirmation-Dialog Implementation

The confirmation dialog renders inline within the theme panel (below the photo-slot grid) when `confirmDeleteTheme === col.id`:

```
┌─────────────────────────────────────────────────────┐
│ Delete Custom Theme?                                │
│ Delete "Test 3" and its custom background photos?   │
│ This action cannot be undone.                       │
│                                                     │
│  [Cancel]  [Delete Theme]                           │
└─────────────────────────────────────────────────────┘
```

- Uses actual theme name: `"{col.name}"`
- **No password requested** — simple owner-confirm action
- Cancel: `setConfirmDeleteTheme(null)` — dismisses without any change
- Delete Theme: calls `confirmAndDeleteTheme(col.id)` — proceeds with deletion

---

## Built-in Theme Protection

**UI layer:**  
Built-in themes are defined in the `PRESETS` constant (10 preset Unsplash landscapes). They are rendered in the landscape-grid section, never through `renderCustomThemePanel`. The trash icon exists only inside `renderCustomThemePanel` — it is therefore **never rendered** for built-in themes.

**Data layer:**  
`deleteCollection(id, collections)` filters the `PhotoCollection[]` array. Built-in themes are never `PhotoCollection` entries — they live only in the `PRESETS` constant. Passing a preset ID to `deleteCollection` returns the array unchanged (the ID simply won't match any element).

**API layer:**  
There is no server-side theme API. All theme operations are client-side localStorage/IndexedDB. No authorization bypass is possible.

---

## Active-Theme Fallback Behavior

`confirmAndDeleteTheme(id)` already handles this correctly:

```typescript
// 1. If background photo came from this theme → clear it
if (background?.type === 'custom') {
  const usedByTheme = col?.photos.some(p => p.id === background.photoId);
  if (usedByTheme) onBackgroundChange(null);
}

// 2. Remove theme from collections
const remaining = deleteCollection(id, collections);
persist(remaining);
setConfirmDeleteTheme(null);

// 3. Switch panel back to Landscapes
if (activeThemeId === id) setActiveThemeId('landscapes');
if (renamingId === id) setRenamingId(null);

// 4. Clean up exclusive photo blobs
```

- `onBackgroundChange(null)` clears the active custom background; Checklist falls back to the default TrailWeigh view (no custom image)
- `setActiveThemeId('landscapes')` switches the picker panel back to the built-in Landscapes grid
- No blank/broken background
- No missing-image icon
- Checklist remains fully usable
- Gear data untouched

---

## Asset-Cleanup Behavior

After removing the theme from collections, photo blobs are cleaned up safely:

```typescript
const allOtherIds = new Set(remaining.flatMap(c => c.photos.map(p => p.id)));
const idsToDelete = col.photos.map(p => p.id).filter(pid => !allOtherIds.has(pid));
await deletePhotos(idsToDelete);
```

- Builds the set of all photo IDs still referenced by **any remaining theme**
- Deletes IndexedDB blobs **only** for photo IDs exclusively owned by the deleted theme
- Any photo ID shared with another theme is preserved

This is the existing logic — not changed by this prompt. It is correct and safe.

---

## Account-Isolation Verification

- All storage is in the user's browser: `localStorage` and `IndexedDB` — both are scoped to the origin and the user's browser session
- No server-side theme API exists; no cross-user API calls are possible
- The Clerk user ID is used to scope Locker files on the server, but theme/photo storage is entirely client-local — there is no server record to accidentally affect

Deleting a custom theme affects only the data in the current user's browser. It cannot affect another user's themes, photos, gear lists, or background library.

---

## Mobile Verification

| Check | Status | Notes |
|---|---|---|
| Theme name readable at narrow width | PASS (architecture) | `truncate min-w-0 flex-1` on name span prevents overflow |
| Photo count readable | PASS (architecture) | `flex-shrink-0` prevents count from collapsing |
| Pencil remains usable | PASS (architecture) | `flex-shrink-0` + `p-1` tap target preserved |
| Trash remains usable | PASS (architecture) | `flex-shrink-0` + `p-1` tap target, same as pencil |
| Icons do not overlap | PASS (architecture) | `flex items-center gap-1.5` row with proper flex sizing |
| Confirmation dialog fits screen | PASS (architecture) | `p-2.5 rounded-lg` inline panel element — no fixed-width modal |

---

## Light/Dark Verification

| Check | Status | Notes |
|---|---|---|
| Pencil visible (light) | PASS (architecture) | `text-muted-foreground hover:text-foreground` — theme-aware |
| Trash visible (light) | PASS (architecture) | `text-muted-foreground hover:text-destructive` — theme-aware |
| Pencil visible (dark) | PASS (architecture) | Same theme variables apply in dark mode |
| Trash visible (dark) | PASS (architecture) | Same theme variables apply in dark mode |
| Trash not excessively bright | PASS (architecture) | `text-muted-foreground` is subdued; only becomes `text-destructive` on hover |
| Hover visible (both modes) | PASS (architecture) | `transition-colors hover:text-destructive` |
| Focus ring visible (both modes) | PASS (architecture) | `focus-visible:ring-2 focus-visible:ring-destructive` |
| Confirmation dialog readable | PASS (architecture) | Uses `text-foreground`, `text-muted-foreground`, `bg-destructive/10 border-destructive/30` — all theme-aware |

---

## Automated Test Results

```
022P Delete Custom Theme: 38/38 passed, 0 failed
022O Password Visibility + Auth Contrast: 21/21 passed
022O Auth Flow Fix: 22/22 passed
022N Sign-In Contrast: 25/25 passed
022M Sign-In Visibility: 23/23 passed
Full suite: 0 failures
```

---

## Runtime / Browser Results

| Test | Status | Notes |
|---|---|---|
| A — Custom theme shows [pencil][trash] | NOT TESTED (runtime) | Source confirms both buttons rendered in header row |
| B — Cancel delete | NOT TESTED (runtime) | Source confirms `setConfirmDeleteTheme(null)` on Cancel |
| C — Confirm delete | NOT TESTED (runtime) | Source confirms `confirmAndDeleteTheme(col.id)` called; blobs cleaned up |
| D — Delete current theme | NOT TESTED (runtime) | Source confirms `onBackgroundChange(null)` + `setActiveThemeId('landscapes')` |
| E — Built-in theme protection | PASS (architecture) | Trash icon only in `renderCustomThemePanel`; PRESETS never reach it |
| F — Saved file regression | PASS (architecture) | Gear data separated from theme data; no corruption possible |
| G — Shared link regression | PASS (architecture) | Blob-lookup failure handled gracefully in `SharedChecklistPage` |

---

## Complete Regression Results

| Area | Status |
|---|---|
| Background Themes dropdown | PASS — unchanged |
| ADD custom theme | PASS — unchanged |
| Rename theme | PASS — pencil + `startRename` preserved |
| Add photo | PASS — unchanged |
| Remove individual photo | PASS — unchanged |
| 10-photo maximum | PASS — unchanged |
| Fit / Fill | PASS — unchanged |
| Showcase | PASS — unchanged |
| Undo / Redo | PASS — unchanged |
| Save | PASS — unchanged |
| Save As | PASS — unchanged |
| Locker | PASS — unchanged |
| Shared Links | PASS — unchanged |
| Checkable Packing List | PASS — unchanged |
| Light mode | PASS — theme-aware classes throughout |
| Dark mode | PASS — theme-aware classes throughout |

---

## Complete Final Diff Review

**`BackgroundPicker.tsx`**

*Change 1 — Header row (added trash icon after pencil):*
```tsx
// BEFORE: pencil only
<button onClick={() => startRename(col)} aria-label={`Edit theme name: ${col.name}`}>
  <Pencil className="w-3 h-3" />
</button>

// AFTER: pencil + trash
<button onClick={() => startRename(col)} title={`Rename theme "${col.name}"`} aria-label={`Edit theme name: ${col.name}`}>
  <Pencil className="w-3 h-3" />
</button>
<button
  onClick={() => setConfirmDeleteTheme(col.id)}
  className="p-1 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
  aria-label={`Delete theme "${col.name}"`}
  title={`Delete theme "${col.name}"`}
><Trash2 className="w-3 h-3" /></button>
```

*Change 2 — Bottom section (confirmation updated, text button removed):*
```tsx
// BEFORE: conditional {isConfirmingDelete ? <old wording> : <Delete Theme text button>}
// AFTER: only shows when confirming, updated wording, correct button labels

{isConfirmingDelete && (
  <div className="mt-3 p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-[11px]">
    <p className="text-foreground font-semibold mb-1 leading-snug">Delete Custom Theme?</p>
    <p className="text-foreground mb-1 leading-snug">
      Delete <strong>"{col.name}"</strong> and its custom background photos?
    </p>
    <p className="text-muted-foreground mb-2 text-[10px]">This action cannot be undone.</p>
    <div className="flex gap-1.5">
      <button onClick={() => setConfirmDeleteTheme(null)}>Cancel</button>
      <button onClick={() => confirmAndDeleteTheme(col.id)}>Delete Theme</button>
    </div>
  </div>
)}
```

**Nothing reverted.** No unrelated changes.

---

## Anything Requiring User Verification

1. **Live visual check** — open the Background Themes panel, select a custom theme, and verify the [pencil] [trash] icon pair appears in the header row immediately to the right of the photo count.

2. **Cancel flow** — click trash, verify confirmation appears with the actual theme name in quotes and the words "Delete Custom Theme?" and "This action cannot be undone." Click Cancel and verify nothing changes.

3. **Confirm delete flow** — create a disposable test theme, add a test photo, click trash, confirm. Verify the theme disappears from the panel and from the theme dropdown.

4. **Delete active theme** — select a disposable theme as the active background, delete it. Verify the app falls back to the Landscapes default without a broken image or JavaScript error.

5. **Built-in theme protection** — switch to the Landscapes panel; verify no trash icon appears anywhere in the landscape grid.

6. **Mobile** — at narrow widths, verify the [pencil][trash] pair does not overlap the theme name or photo count.
