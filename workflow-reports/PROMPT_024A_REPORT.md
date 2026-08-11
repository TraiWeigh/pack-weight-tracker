# PROMPT 024A REPORT
## Sidebar Toolbar Alignment Fix

**Date:** 2026-08-11  
**Prompt:** 024A  
**Status:** ✅ Complete

---

## Problem

`scrollbar-gutter: stable` on the scrollable sidebar content div reserves ~15 px of gutter on the right for the scrollbar track, narrowing that container's content box. The sidebar toolbar (Background + Share buttons) lived in a *separate* pinned div that did **not** have `scrollbar-gutter: stable`, so its right edge extended ~15 px further right than Pack Summary's right edge. This caused visible misalignment between the toolbar and the Pack Summary card below it.

**Root cause:** The toolbar was outside the `lg:[scrollbar-gutter:stable]` wrapper; Pack Summary was inside it.

---

## Fix

Moved the entire sidebar toolbar row **inside** the `lg:overflow-y-auto lg:[scrollbar-gutter:stable]` scrollable wrapper, making it subject to the same content-box narrowing as Pack Summary.

### Changes — `artifacts/pack-checklist/src/pages/Checklist.tsx`

- **Removed** the separate `flex-shrink-0` pinned action bar div that sat outside the scrollable wrapper
- **Added** toolbar row as the first child of the scrollable wrapper's inner `flex flex-col` div
- Toolbar row layout: `flex items-center gap-2 pt-8 pb-3`
  - **Left:** `ChevronsUpDown` icon button — toggles all categories open/close (reuses existing `setAllOpen` / `setOpenCloseSeq` state, same behaviour as the Open/Close toggle in the gear-list column)
  - **Centre:** `flex-1` spacer
  - **Right:** `BackgroundPickerButton` + `BackgroundPickerPanel` (unchanged) and Share pill + dropdown (unchanged)
- Replaced old `flex flex-col gap-4 py-2 pb-8` inner wrapper with a two-level structure:
  - Outer `flex flex-col pb-8` (toolbar + panels)
  - Inner `flex flex-col gap-4` (WeightSummary, WeightDistribution, ImportGearPanel, LockerPanel)

### Alignment result

| Edge | Before | After |
|------|--------|-------|
| Left of arrow group vs left of Pack Summary | misaligned (toolbar had no gutter offset) | **flush** (both in same content box) |
| Right of Share vs right of Pack Summary | misaligned (~15 px over-run) | **flush** (both in same content box) |
| All three controls on one row | Background + Share only (no arrows) | ✅ arrows · Background · Share |

---

## Constraints respected

- ✅ Scrollbar behaviour unchanged (`scrollbar-gutter: stable` kept on same div)
- ✅ Pack Summary not resized or moved
- ✅ Background picker behaviour unchanged (same component, same props, same `bgPickerContainerRef`)
- ✅ Share dropdown behaviour unchanged
- ✅ Open/Close text buttons in the gear-list column unchanged
- ✅ No unrelated changes
- ✅ TypeScript clean (pre-existing errors in calendar.tsx / spinner.tsx / SharedChecklistPage.tsx are unrelated and pre-dated this prompt)

---

## Files changed

| File | Change |
|------|--------|
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | Moved sidebar toolbar into scrollable wrapper; added ChevronsUpDown expand/collapse button |
