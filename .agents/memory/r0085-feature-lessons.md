---
name: R0085 feature lessons
description: Per-item locations, photos, category direct-edit — implementation gotchas and backward-compat rules.
---

## Locker save must include `locations`

All 3 Locker save paths must include `locations: sandboxRef.current.locations` in the serialized store.
Use `as unknown as LockerEntry['store']` to bypass the type (LockerEntry['store'] has no `locations` field).
The load path already handles it: `locations: (store as any).locations ?? []`.

**Why:** `SandboxStore.locations` holds the canonical `PackLocation[]` list; without it, locations are silently dropped on every Save and all locationId references become dangling.

**How to apply:** Any new save path (e.g. auto-save, cloud sync) must also persist `locations`.

## Category swipe Edit: Cancel button must use aria-label "Cancel rename"

The category direct-edit dialog's Cancel button MUST have `aria-label="Cancel rename"` (not "Cancel edit category name").

**Why:** R84-04 (`getByRole('button', { name: 'Cancel rename' })`) tests this label. Changing it breaks that pre-existing test.

**How to apply:** If the dialog is redesigned, keep the Cancel button's accessible name as "Cancel rename". The Save button must keep `aria-label="Save category name"` (R84-03 also depends on it).

## Location view is display:none, not unmounted

When `viewMode === 'location'`, the catListRef div uses `display: viewMode === 'location' ? 'none' : 'flex'`. It is NOT conditionally rendered.

**Why:** Toggling between views must not remount the category DOM (scroll position, accordion state, long-press timers all preserved). The location view block is rendered separately above.

## Photo file inputs live outside the item accordion

The hidden `<input type="file">` elements (`photoCameraRef`, `photoUploadRef`) are rendered at the root overlay level, not inside the item accordion.

**Why:** If they were inside the accordion, collapsing/switching items would unmount them mid-file-selection on some browsers.

## Test selectors for R0085 flows

- Location "No location" button: `[data-testid="item-location-set-btn"]`
- Location picker sheet: `[data-testid="location-picker-sheet"]`
- Location picker input: `[data-testid="location-picker-input"]`
- View toggle bar: `[data-testid="view-mode-bar"]`
- Location view: `[data-testid="location-view"]`
- Category toggle: `[data-testid="view-mode-category"]`
- Location toggle: `[data-testid="view-mode-location"]`
- Photo add button: `[data-testid="item-photo-add-btn"]`
- Photo edit sheet: `[data-testid="photo-edit-sheet"]`
- Category direct-edit dialog: `[data-testid="cat-direct-edit-dialog"]`
