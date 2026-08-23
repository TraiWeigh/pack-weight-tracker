---
name: R0113-R0114 Native Migration (v3→native) — completed
description: Architecture decisions for the native port of MobileFunctionalV3, through R0114 (Locker, undo/redo, category management, share).
---

## Context architecture (R0114 final state)

- Single `NativeState = { data: PackState; categoryOrder: string[] }` — unified runtime state.
- `mutate(fn)` helper: pushes snapshot to undoStack first, then applies change. ALL gear mutations use it; `toggleItem` and `listName` bypass it (v3 parity).
- Undo/redo stacks are refs (not state) to avoid re-renders; `canUndo`/`canRedo` are state booleans updated after each mutation.
- HISTORY_LIMIT = 30 snapshots.

**Why:** Mirrors v3's `mutateSandbox` pattern exactly: check/uncheck does not pollute history; list name is user metadata.

**How to apply:** Any new gear mutation must call `mutate()`; display-only changes (filters, UI state) never touch `mutate()`.

## categoryOrder is runtime, not static

- `CATEGORY_ORDER` constant is still exported from context as a seed/fallback.
- At runtime, `categoryOrder` comes from `usePackData()` — it is stored in AsyncStorage (`twm-catorder`) and can be reordered by the user.
- All components (index.tsx, AddItemModal, SearchModal) use `categoryOrder` from hook, NOT the static constant.

**Why:** Required for Locker (each saved list can have different category order) and category reorder feature.

## Modal structure

- `AddItemModal`: pageSheet; uses `categoryOrder` from `usePackData()`; has "New Category" pill → `Alert.prompt` → `addCategory()` → auto-select.
- `SearchModal`: pageSheet; uses `categoryOrder` from `usePackData()` for iteration order.
- `LockerModal`: pageSheet; uses `usePackData()` internally for all locker ops; no props except `visible`/`onClose`.
- Summary: pageSheet Modal inside `index.tsx` (not a route).

## Category long-press management

`handleCatLongPress(catName)` in index.tsx shows an Alert with:
- Rename (iOS Alert.prompt only)
- Delete (with item count confirmation)
- ▲ Move Up / ▼ Move Down (only shown when possible, via spread conditional options)

Uses `reorderCategories(newOrder)` for move — creates a copy of `categoryOrder` and swaps adjacent elements.

**Why:** v3 uses complex Pointer drag; native minimum viable parity = alert-based. Proper DnD is a follow-up.

## Native Share

`Share.share({ message, title })` with a formatted text list of packed items + total weight. No API server dependency.

**Why:** v3's Share requires API server + Clerk to generate a URL. Text-based share works offline and is simpler.

## Disabled NavBox actions

`disabledActions = useMemo(() => new Set([!canUndo && 'undo', !canRedo && 'redo'].filter(Boolean)), [canUndo, canRedo])` passed as `disabledSet` to `BottomBox`. NavBox applies `opacity: 0.30` and blocks `onPress` when disabled.

## Hero list name tap-to-edit

`ListSummaryHero` accepts `onNameTap?` prop. When provided, the name text is wrapped in a `TouchableOpacity` with a pencil icon hint. Uses `Alert.prompt` on iOS; graceful fallback on Android.

## AnimatedSwipeRow

Module-level `_closeOpenSwipe` ref ensures only one swipe row is open at a time. Left swipe reveals Rename + Delete actions.
