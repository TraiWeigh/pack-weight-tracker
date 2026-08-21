---
name: R0105 bottom Camera/Photos contextual photo entry
description: How the Group 3 Camera and Photos buttons were wired to the real photo system with contextual logic.
---

# R0105 Bottom Camera / Photos Contextual Logic

## Rule
Group 3 Camera and Photos use three-case contextual logic keyed on `expandedItem` and `openCatName`/`allExpanded`.

- **Case 1** (`expandedItem !== null`): `setPhotoEditFor(expandedItem)` + trigger appropriate file input. No new item.
- **Case 2** (`openCatName && !allExpanded`, no item expanded): `addItem(openCatName, { id: newId })` + `setPhotoEditFor` + trigger input.
- **Case 3** (no single open category, or `allExpanded`): `setCatPhotoPickIntent('camera'|'photos')` → show `cat-photo-picker` sheet. When user picks a category: `addItem` + `setOpenCatName` + `setPhotoEditFor` + trigger input.

**Why:** The working photo flow requires a `{cat, id}` target. Global bottom buttons have no inherent item context — context must be inferred from UI state.

## Key testids added
- `cat-photo-picker` — category picker bottom sheet (Case 3)
- `cat-photo-pick-${catName}` — per-category pick button
- `cat-photo-pick-cancel` — dismiss picker

## Test lessons
- `itemCount(page, cat)` counts `[role="checkbox"]` inside `[data-cat="${cat}"]`. Items are only in DOM when the category is open — measure `before` with the category open, then close it before triggering the picker flow.
- `photoCameraRef.current?.click()` within a button onClick preserves the iOS user-gesture chain. In Playwright, capture the filechooser event with `page.waitForEvent('filechooser', { timeout: 2500 }).catch(() => null)` to prevent it from lingering.
- Cat photo picker: `setCatPhotoPickIntent(null)` must also be called in `handleViewModeChange`.
