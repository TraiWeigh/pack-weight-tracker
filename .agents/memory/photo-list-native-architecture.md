---
name: Photo List native architecture
description: Complete Photo List workflow implementation for the React Native Expo app (Task #140) — sheet cascade, SectionList section kinds, context fields, and deferred items.
---

# Photo List Native Architecture

## Context fields (PackDataContext.tsx)
`listKind: 'standard' | 'photo'`, `locations: PackLocation[]`, `photoListCaptureDataUrl: string | null`.
These three bypass the undo stack (same treatment as `listName` — list metadata, not pack data).
`PHOTO_ITEMS_CATEGORY = 'Items'` — structural category auto-created by `assignPhotoToItem`.

## Sheet cascade (5 sheets in index.tsx)
Source → Assignment → (Location path: LocationName → onSaved → switch to location view) / (Item path: ItemDest → onAssigned → ItemName → close).
Each sheet calls parent close + setTimeout 200ms before opening the next one so animations don't overlap.

## SectionList section kinds (Section type)
Section has an optional `sectionKind?: 'normal' | 'add-photo-bar' | 'location'`.
- `add-photo-bar` section: title = `'__add_photo_bar__'`, data = [] — renders "Add another photo" bar as the section header with no items below.
- `location` section: has `locId` and `locPhotoDataUrl`; `data` = items filtered by `i.locationId === loc.id`.
- In category view: normal sections, `add-photo-bar` rendered as `ListHeaderComponent` above SectionList.
- In location view: Items section (unassigned items) + add-photo-bar section + location sections.

## Photo List empty card states
- State 1 (no items, no pending): camera badge + title + subtitle + "Add Photo" CTA.
- State 3 (pending capture): pendingImage at height=168 + "Choose Location or Item" (outlined) + "Replace Photo" (NAV_ACTIVE filled, spec correction from screenshot 3).
- State 6 (locations exist, no items): VISUAL DESTINATIONS 2-col grid + "Add Photo" CTA.
All three handled by `PhotoListEmptyCard` in index.tsx; shown when `listKind === 'photo' && !photoListHasItems`.

## LocationBar
Pentagon wedge (NAV_ACTIVE bg) + MapPin icon + 42×42 thumbnail + location name + right meta ("Location" / "N items"). Same Svg/Polygon structure as SectionHeader but bg=NAV_ACTIVE.

## Filter control
In Photo List mode, FilterControl receives `onToggle` callback → toggles `photoListView` between `'category'` and `'location'`. In standard mode, `onToggle` is undefined (non-interactive).

## Typecheck baseline
The `typecheck` workflow fails on pre-existing errors in `artifacts/mockup-sandbox` (calendar.tsx, spinner.tsx — React ref type mismatch). The mobile app (`artifacts/pack-checklist-mobile`) passes `tsc --noEmit` cleanly.

## Deferred (follow-up tasks proposed)
- Item detail panel (Name, Weight, Qty, Location selector, Photo viewer, Delete) — Task #141
- Photo thumbnails on item rows — Task #143
- Locker round-trip automated test — Task #142

**Why:** Kept scope to the creation flow (Task #140) to deliver a working end-to-end Photo List without the item detail panel which requires a separate inline expansion system.
