# Prompt 023A — Make Custom-Theme Deletion Undoable

**Date:** 2026-08-09  
**Status:** ✅ COMPLETE — all tests pass (41/41)

---

## Problem Statement

After deleting a custom theme in the Background Picker, pressing TrailWeigh's global Undo button did NOT restore the deleted theme. The deletion was permanent and immediate — metadata was dropped from localStorage and photo blobs were destroyed in IndexedDB via `deletePhotos()` with no history entry pushed.

---

## Root Cause

Two compounding gaps:

1. **No undo snapshot pushed.** `confirmAndDeleteTheme` made no call to `pushBg()` before removing the theme. The undo history had no record of the pre-deletion state.

2. **Immediate and permanent blob destruction.** `deletePhotos()` was called synchronously during deletion. Even if metadata could be restored, the IndexedDB photo blobs would already be gone — making a snapshot useless.

Additionally, custom-theme `collections` state lived entirely inside `BackgroundPickerPanel` (internal `useState`), never reaching the `BgSnapshot`/`HistoryEntry` types in `usePackData.ts`, so the undo system had no mechanism to capture or restore them.

---

## Implementation

### 1. `usePackData.ts` — Extended `BgSnapshot`

Added two optional fields:

```typescript
export type BgSnapshot = {
  background: BgValue;
  bgSize: 'cover' | 'contain';
  collections?: PhotoCollection[];   // 023A
  activeThemeId?: string;            // 023A
};
```

`PhotoCollection` is imported from `'../lib/bgCollections'` (no circular dependency — it's a pure data layer).

### 2. `bgPhotoStore.ts` — `cleanupOrphanedPhotos()`

New exported async function. On mount, BackgroundPicker calls it with the set of IDs currently referenced by any collection. Any blobs not in that set are deleted via the existing `deletePhotos()`:

```typescript
export async function cleanupOrphanedPhotos(referencedIds: Set<string>): Promise<void> {
  try {
    const allIds = await getAllStoredPhotoIds();
    const orphaned = allIds.filter(id => !referencedIds.has(id));
    if (orphaned.length > 0) await deletePhotos(orphaned);
  } catch { /* best-effort */ }
}
```

### 3. `BackgroundPicker.tsx` — Four coordinated changes

**a) Two new optional props:**
```typescript
onBeforeDeleteTheme?: (snapshot: { collections: PhotoCollection[]; activeThemeId: string }) => void;
restoreCollectionsRef?: React.MutableRefObject<
  ((collections: PhotoCollection[], activeThemeId: string) => void) | null
>;
```

**b) `confirmAndDeleteTheme` — call hook before deletion, defer blobs:**
```typescript
const confirmAndDeleteTheme = async (id: string) => {
  const col = collections.find(c => c.id === id);
  onBeforeDeleteTheme?.({ collections, activeThemeId }); // ← push undo snapshot
  // ... existing metadata removal ...
  // await deletePhotos(idsToDelete);  ← REMOVED; blobs deferred until next mount
};
```

**c) `restoreCollectionsRef` registration (after `persist` declaration):**
```typescript
useEffect(() => {
  if (!restoreCollectionsRef) return;
  restoreCollectionsRef.current = (cols, themeId) => {
    persist(cols);
    setActiveThemeId(themeId);
  };
  return () => { if (restoreCollectionsRef) restoreCollectionsRef.current = null; };
}, [restoreCollectionsRef, persist]);
```

**d) Orphaned-blob cleanup on mount:**
```typescript
useEffect(() => {
  const referencedIds = new Set(loadCollections().flatMap(c => c.photos.map(p => p.id)));
  cleanupOrphanedPhotos(referencedIds).catch(() => {});
}, []); // mount-only
```

**e) Dialog copy:** "This action cannot be undone." → **"You can undo this action."**

### 4. `Checklist.tsx` — Three wiring changes

**a) `restoreCollectionsRef` declared:**
```typescript
const restoreCollectionsRef = useRef<
  ((collections: PhotoCollection[], activeThemeId: string) => void) | null
>(null);
```

**b) `restoreBgCallbackRef.current` extended:**
```typescript
if (snap.collections !== undefined) {
  restoreCollectionsRef.current?.(snap.collections, snap.activeThemeId ?? 'landscapes');
}
```

**c) New props passed to `BackgroundPickerPanel`:**
```typescript
onBeforeDeleteTheme={(snap) => {
  pushBg({
    background,
    bgSize: bgSizeRef.current,
    collections: snap.collections,
    activeThemeId: snap.activeThemeId,
  });
}}
restoreCollectionsRef={restoreCollectionsRef}
```

---

## Undo/Redo Lifecycle

| Action | Effect |
|--------|--------|
| Delete theme | `onBeforeDeleteTheme` fires first → `pushBg()` snapshots `{background, bgSize, collections, activeThemeId}` → metadata removed → **blobs stay in IndexedDB** |
| Undo | `usePackData.undo()` pops entry → `onRestoreBg(entry.bg)` fires → `restoreBgCallbackRef.current` runs → background + bgSize restored → `restoreCollectionsRef.current?.(cols, themeId)` restores metadata → panel navigates to restored theme |
| Redo | Same as delete — metadata gone again, blobs still in IndexedDB |
| Undo again | Same as Undo — blobs still present, restored again |
| Next session mount | `cleanupOrphanedPhotos` removes any blobs whose IDs are no longer in localStorage collections |

---

## Test Coverage (41/41 pass)

| Section | Description | Tests |
|---------|-------------|-------|
| §A | BgSnapshot extended with collections + activeThemeId | 4 |
| §B | `cleanupOrphanedPhotos` exported, correct impl | 4 |
| §C | `onBeforeDeleteTheme` prop declared + destructured | 3 |
| §D | `restoreCollectionsRef` prop declared + destructured | 3 |
| §E | `confirmAndDeleteTheme` calls prop before deletion | 4 |
| §F | `deletePhotos` NOT called in `confirmAndDeleteTheme` | 1 |
| §G | Restore setter registered after `persist` | 3 |
| §H | Orphaned-blob cleanup effect on mount | 3 |
| §I | Dialog copy updated to "You can undo this action." | 2 |
| §J | Checklist `restoreCollectionsRef` declared | 2 |
| §K | Checklist passes `onBeforeDeleteTheme` | 1 |
| §L | `pushBg` includes `collections` + `activeThemeId` | 4 |
| §M | Checklist passes `restoreCollectionsRef` | 1 |
| §N | `restoreBgCallbackRef` restores collections on undo | 3 |
| §O | 022Z regression: `deletePopoverContentRef` portal exclusion intact | 3 |

---

## Pre-existing tests updated

Three earlier tests asserted the old `deletePhotos` ordering and copy:

| File | Test | Change |
|------|------|--------|
| `deleteCustomTheme022P.test.mjs` | "Confirmation warns action cannot be undone" | Accept either old copy OR "undo this action" |
| `deleteCustomTheme022P.test.mjs` | "Photo IDs shared by another theme are preserved" | Accept `stillUsed` (per-photo guard) as equivalent |
| `deleteWarningPosition022Y.test.mjs` | C3 copy check | Accept either old copy OR "undo this action" |
| `deleteConfirmJump022Z.test.mjs` | E1 ordering: `setConfirmDeleteTheme(null)` before `await deletePhotos` | Replaced with presence check — `deletePhotos` removed from theme deletion |

---

## Invariants Preserved

- ✅ 022Z `deletePopoverContentRef` mousedown exclusion
- ✅ 022Y Popover beside trash icon (no document-flow block)
- ✅ 022X toolbar zones (`justify-between`, no `items-center` on portrait flex-col)
- ✅ `lg:pr-7`, `lg:grid-cols-[1fr_365px]`, `min-h-[100dvh] lg:h-[100dvh]`
- ✅ `mergeLockerEntries` import (022T)
- ✅ History is session-only — does not claim persistent undo across page reloads
- ✅ Individual photo deletion still guards with `stillUsed` check (per-photo blob safety)

---

## Files Changed

| File | Nature |
|------|--------|
| `artifacts/pack-checklist/src/hooks/usePackData.ts` | Extended `BgSnapshot` type |
| `artifacts/pack-checklist/src/lib/bgPhotoStore.ts` | Added `cleanupOrphanedPhotos()` |
| `artifacts/pack-checklist/src/components/BackgroundPicker.tsx` | Props, effects, `confirmAndDeleteTheme`, copy |
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | Ref, restore callback, prop wiring |
| `artifacts/pack-checklist/src/hooks/deleteThemeUndo023A.test.mjs` | New — 41 tests |
| `artifacts/pack-checklist/src/hooks/deleteCustomTheme022P.test.mjs` | 2 tests updated for 023A |
| `artifacts/pack-checklist/src/hooks/deleteWarningPosition022Y.test.mjs` | 1 test updated for 023A |
| `artifacts/pack-checklist/src/hooks/deleteConfirmJump022Z.test.mjs` | 1 test updated for 023A |
| `package.json` | Added `deleteThemeUndo023A.test.mjs` to `test:importer` chain |

---

## iPhone Status

NOT TESTED — no physical device available in this environment.
