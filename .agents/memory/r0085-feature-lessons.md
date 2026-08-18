---
name: R0085 feature lessons
description: Location dropdown+wedge hybrid, Location Photo, narrowed auto-switch, label fixes implemented in R0085C correction pass.
---

## Narrowed Auto-switch pattern

Split `mutateSandbox` into two callbacks:
- `mutateSandbox` — records undo/redo only; does NOT call `switchGroup`
- `mutateSandboxEdit` — calls `mutateSandbox` + `switchGroup(1)`

`updateItem(cat, id, updates, { edit?: boolean })` selects which mutator to use via opts flag.

**Use `mutateSandboxEdit` for:** rename, weight/qty change, move, reorder, location assign/rename, photo add/change/delete.  
**Use plain `mutateSandbox` for:** check/uncheck, add/delete item, add/delete category, infrastructure CRUD (add/remove location), locker load, reset.

**Why:** check/uncheck and add/delete operations must NOT surface the Edit nav group — they are not user edits of existing data.

## Location view — wedge hybrid architecture

- catListRef div **always renders** (never `display:none`)
- In Location view: filter each category's items to only those WITHOUT a `locationId` before rendering
- After the catListRef closing div, render Location wedges for each `PackLocation` that has at least one item assigned to it
- Location wedge uses same visual style (CARD_H, WEDGE_W, WEDGE_POINT, NAV_ACTIVE bg, MapPin icon)
- Left slot: static text "Location"; right slot: `loc.name`
- `openLocId` state for one-open-at-a-time across categories AND location wedges
- `handleCatToggle` must call `setOpenLocId(null)` to close any open location when a category opens

## Location dropdown (replaces picker sheet)

- Native `<select data-testid="item-location-select">` with options: `""` (No location), each `loc.id` → `loc.name`, `"__create__"` (Create New Location…)
- Selecting `__create__` opens `[data-testid="create-location-dialog"]`; React re-render resets the select to the current `item.locationId ?? ''` automatically (no manual DOM reset needed since value prop is controlled)
- Rename is separated to a distinct `[data-testid="location-rename-dialog"]` triggered by pencil on the Location wedge bar

## Location Photo

- Property `photoDataUrl?: string` on `PackLocation` type
- Shared by all items with that `locationId`; independent from `GearItem.photoDataUrl`
- Edit sheet: `[data-testid="loc-photo-edit-sheet"]` with `loc-photo-take-btn`, `loc-photo-upload-btn`, `loc-photo-delete-btn`, `loc-photo-edit-cancel`
- Inline viewer: `loc-photo-view-btn`, `loc-photo-view-close` inside open Location wedge
- `locCameraRef` / `locUploadRef` refs separate from `photoCameraRef` / `photoUploadRef`
- Handlers: `handleLocPhotoAdd`, `handleLocPhotoDelete` — both use `mutateSandboxEdit`

## Locker save compatibility

`PackLocation.photoDataUrl` is stored as-is since the location array is already serialized. Loading path uses `(parsed.locations ?? []) as PackLocation[]` which naturally reads `photoDataUrl` if present.

## Item Photo label fix

- Button text: `'View'` → `'View Photo'`, `'Hide'` → `'Hide Photo'`, `'Edit'` → `'Edit Photo'`
- Aria-labels unchanged (still say "View photo of X" / "Edit photo of X")
