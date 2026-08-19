---
name: Master List Phase 2 — UI screen
description: Lessons from wiring MasterListScreen into MobileFunctionalV3
---

## Layout: ML screen + bottom nav bar clearance

The ML screen uses `position: absolute, top: 52, bottom: 0, zIndex: 35`. The bottom nav bar is `zIndex: 40, height: 58px (NAV_H)`. Any sticky element inside the ML screen that must be clickable (e.g. the Add bar) must use `bottom: NAV_H` (58px), NOT `bottom: 0`. The scrollable list body needs `paddingBottom: ADD_BAR_H + NAV_H + 8px` so the last item scrolls above both the Add bar and the nav bar.

**Why:** The bottom nav (zIndex 40) sits above the ML screen (zIndex 35). A fixed-bottom bar at `bottom: 0` is visually hidden AND unclickable — Playwright reports the nav bar "intercepts pointer events."

## SwipeRow: setPointerCapture on the row div is safe here

Unlike BoxGroupBar (see boxgroupbar-pointer-capture.md), the SwipeRow in MasterListScreen calls `setPointerCapture` on the row's inner div, which is safe because the captured events only affect the row, not outer navigation containers.

## UndoToast: aria-label on the Undo button to avoid selector ambiguity

The BoxGroupBar also has a NavBox "Undo" button (`aria-label="Undo last change"`). The UndoToast's Undo button must have a distinct `aria-label="Undo delete"` to avoid `button:has-text("Undo")` selector collisions in tests (and to satisfy a11y).

## Toast timing: use waitForSelector, not isVisible()

`setItems(...)` and `setUndoToast(...)` are called in the same `.then()` microtask in `handleDelete`. Even though item removal is visible after 500ms, the toast render may not be committed yet. Always use `page.waitForSelector('...', { timeout: 3000 })` for the toast instead of `locator.isVisible()`.

## getCategoryTheme requires 2 arguments

`getCategoryTheme(name: string, index: number)` — the index is used for the fallback rotating palette. Pass `0` when no list index is available (single-item contexts like a badge pill). Pass the array index when rendering a list.

## putMasterItemAndPhoto: photoId is a separate 2nd argument

Signature: `putMasterItemAndPhoto(item, photoId, blob, mimeType, width, height)`. The `photoId` is NOT embedded in the item object that you pass — it is a separate positional argument. The function merges it into the item internally.

## WriteResult uses `message`, not `error`

The failure branch of `WriteResult` is `{ ok: false; reason: ...; message: string }`. There is no `.error` field.
