---
name: 026P owner-mode removal
description: 026N/O ownerMode/viewMode system was fully removed in 026P; Checklist renamed from Preview; PreviewModal redesigned as interactive.
---

## What was removed (026N/O additions)
- `ownerMode` state (`useState<'view'|'edit'>`) from ChecklistContent
- `viewGuardedUpdateItem` callback
- `setOwnerMode('view')` call sites: savedListId effect, startup restoration, in-place Locker open
- Desktop and phone Edit/Done toggle buttons
- IIFE `ownerViewMode` computation in category render loop
- `viewMode` prop + all guards from GearCategory.tsx and GearRow.tsx
- `startupRestoredRef` and `[lockerEntries]` dep in startup restoration → reverted to `[]`
- `{(isReview || ownerMode === 'edit') && ...}` guards on Add Category and Reset

## What changed
- "Preview" button renamed to "Checklist" (desktop + phone toolbars)
- PreviewModal.tsx: now shows ALL items (not just checked) with interactive checkboxes, Clear button, and optional onClear/onUpdateItem props
- PrintLayout.tsx: shows all items with true checked state (filled box / empty box); weight summary still sums checked only
- Add Category now guarded by `{!isReview && ...}` (cleaner than pre-026N unconditional)
- Reset is unconditional (pre-026N baseline)

**Why:** 026N's owner view/edit mode never worked on phone (ownerMode stuck at 'edit' because tw-savedlist-entry-id is absent in new-tab path). Entire system was superseded by 026P.

**How to apply:** If you see ownerMode, viewMode, or startupRestoredRef referenced anywhere in Checklist.tsx, GearCategory.tsx, or GearRow.tsx, those are stale — they were fully removed in 026P.
