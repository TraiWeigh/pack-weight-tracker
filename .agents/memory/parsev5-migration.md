---
name: parseV5 forward migration
description: Why existing v5 stores may be missing DEFAULT_CATEGORY_ORDER entries and how to handle it
---

`parseV5` loads `p.order` directly from localStorage without merging new DEFAULT categories.
If a user's v5 store was saved before a category was added to DEFAULT_CATEGORY_ORDER (e.g. "Kitchen"),
their order will permanently lack that category — causing import dropdowns to silently snap to the first
option (Backpack) because no matching `<option>` exists.

**Why:**
Discovered when PDF import correctly sent `destination: "Kitchen"` but the frontend review table showed
"Backpack" for all Kitchen items. Backend trace confirmed correct JSON; the bug was the missing option.

**Fix applied:**
- Added `mergeDefaultCategories(storedOrder)` helper in `usePackData.ts` that inserts any missing
  DEFAULT categories at their canonical position (after their rightmost DEFAULT predecessor, before
  their leftmost DEFAULT successor in the stored order).
- `parseV5` now calls `mergeDefaultCategories(p.order)` before building items/meta.
- Belt-and-suspenders in `ImportGearPanel.tsx`: `<select>` renders an extra `<option>` for
  `item.destination` when it's not in `categoryOrder`, so the dropdown always shows the correct value
  even before the next page load triggers the migration.
- `Checklist.tsx` `onAddItem` calls `addCategory(category)` before `addItem(category)` when the
  destination is missing from the pack's order, ensuring the tab appears after import.

**How to apply:**
Any time a new canonical category is added to `DEFAULT_CATEGORY_ORDER`, existing v5 stores will pick it
up automatically on the next page load via `mergeDefaultCategories`. No manual migration needed.
