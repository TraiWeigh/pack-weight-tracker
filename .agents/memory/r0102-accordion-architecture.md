---
name: R0102 accordion architecture
description: How the Add Item creation accordion was built — state, geometry impact, Photo pre-id pattern, and R0096 helper update.
---

# R0102 — Add Item Creation Accordion

## Core pattern

Tapping Add Item no longer immediately creates an item. It toggles an accordion (`addItemAccordionCat: string | null` state). The accordion renders between the item container and the Add Item bar, in normal document flow.

Three methods:
- **Name** — `addItem(catName)` (same as before), closes accordion
- **Photo** — pre-generates a UUID, calls `addItem(catName, { id: newId })`, then `setPhotoEditFor({ cat: catName, id: newId })`. The item must exist in the sandbox before `photoEditFor` is set or the photo sheet won't find it.
- **Master List** — `pushScreen({ screen: 'master-list' })`, no item created. **Limitation:** MasterListScreen only has `onBack` prop; no `onAddToCategory` callback.

**Why pre-generate id for Photo:** `addItem` previously ignored `prefill.id`; add `id: prefill?.id ?? crypto.randomUUID()` so callers can know the id before the React state flush.

## Geometry impact on remeasureLongMode

The accordion adds `ADD_ITEM_ACCORDION_H = 3 * 44 = 132` px between the item container and the Add Item bar. Without accounting for it, `rawAvailH` is computed assuming only 44 px (Add Item bar) below items — the item container would visually overflow into the accordion.

Fix: in `remeasureLongMode`, read `catRow?.dataset.cat` and compare to `addItemAccordionCat`. Subtract `ADD_ITEM_ACCORDION_H` from `rawAvailH` when they match. Add `addItemAccordionCat` to the `useCallback` deps.

Trigger re-measurement: add a `useEffect(() => remeasureLongMode(), [addItemAccordionCat])` so `availItemH` updates immediately when the accordion opens or closes.

**How to apply:** Any future in-flow UI element added above the Add Item bar and below the item container must similarly be subtracted from `rawAvailH` in `remeasureLongMode`.

## Auto-close rules

```ts
useEffect(() => { setAddItemAccordionCat(null); }, [openCatName]);
```
Fires whenever the active category changes (opens, closes, or switches). Prevents stale accordion state on category re-open.

In `allExpanded` mode the button reverts to direct `addItem(catName)` — the accordion is never shown in that mode.

## R0103 follow-on: Name button now expands item + focuses name input

After R0103 the Name button onClick does:
  1. pre-generate UUID → addItem(catName, { id: newId })
  2. setExpandedItem({ cat: catName, id: newId })
  3. setFocusItemNameId(newId)  ← new state; useEffect queries [data-item-name-id="{id}"] post-paint
  4. setAddItemAccordionCat(null)

Escape fix: reset e.target.value to original BEFORE blur so onBlur sees no change and does not call updateItem.

SwipeDeleteRow secondaryAction removed from item rows (R0103). Category and master-list rows still have it.
Photo-mode <img> gains onClick → setPhotoEditFor (R0103 photo-box fix).

## Test helper update (R0096)

`makeBackpackLong()` in r0096-locked-controls.spec.ts used to click `cat-add-item-btn` N times directly. After R0102 that only toggles the accordion open/closed. Updated to: open accordion → click `add-item-by-name` → wait for accordion hidden — repeat N times.

**Why:** Any test that previously assumed a raw click on `cat-add-item-btn` created an item must now go through the accordion Name button.
