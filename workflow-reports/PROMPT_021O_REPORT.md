# Prompt 021O — Move the Entire Toolbar Group Up

**Date:** 2026-08-08  
**Status:** COMPLETE — all tests passing

---

## Problem Statement

Both child toolbar panels each carried their own `pt-8` (32 px) top padding.  
Vertical toolbar position was therefore duplicated across two elements instead of controlled by a single value.  
The goal: consolidate top spacing on the toolbar-group parent and reduce it from ~32 px to ~16 px.

---

## Exact Change

| Element | Before | After |
|---|---|---|
| Toolbar-group parent | `grid grid-cols-1 lg:grid-cols-[1fr_365px] lg:gap-4` | `pt-4 grid grid-cols-1 lg:grid-cols-[1fr_365px] lg:gap-4` |
| Left toolbar panel | `pt-8 pb-3 flex items-center lg:pr-7 …` | `pb-3 flex items-center lg:pr-7 …` |
| Filename pill overlay | `absolute inset-0 pt-8 pb-3 flex items-center …` | `absolute inset-0 pb-3 flex items-center …` |
| Right toolbar panel | `… pt-8 pb-3 lg:pl-3 lg:pr-9 …` | `… pb-3 lg:pl-3 lg:pr-9 …` |

**Old toolbar top spacing:** `pt-8` = 32 px (per-child, duplicated)  
**New toolbar top spacing:** `pt-4` = 16 px (single value on toolbar-group parent)  
**Net change:** toolbar moves up ~16 px

**Parent element controlling vertical position:** the toolbar-group `<div>` at the top of `<main>`'s flex column — the element that also carries `lg:grid-cols-[1fr_365px] lg:gap-4`.

---

## Why the Filename Pill Overlay Also Changed

The pill overlay uses `absolute inset-0` to fill the left toolbar panel's box, then `flex items-center` to vertically center the pill within that box.  
After removing `pt-8` from the left panel, the panel box has no top padding — so the overlay's `pt-8` would have pushed the pill down 32 px below the content-area top, misaligning it with the Open/Close buttons.  
Removing `pt-8` from the overlay (`pb-3 flex items-center`) means both the buttons and the pill now center within the same zero-top-padding content area. ✓

---

## What Was NOT Changed

| Area | Status |
|---|---|
| `pt-4` is applied at all breakpoints | shared spacing works at mobile and desktop |
| Horizontal positions (lg:pr-7, lg:pl-3, lg:pr-9, lg:justify-end) | unchanged |
| lg:grid-cols-[1fr_365px] sidebar width | unchanged |
| lg:gap-4 column gap | unchanged |
| lg:px-8 outer main padding | unchanged |
| All content area scroll div classes | unchanged |
| Open/Close/Hide/Preview/UnitToggle/BackgroundEdit/Share controls | unchanged |
| 021N structure (toolbar group + content area) | intact |

---

## Files Changed

| File | Change |
|---|---|
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | Added `pt-4` to toolbar group parent; removed `pt-8` from left panel, pill overlay, right panel |
| `artifacts/pack-checklist/src/hooks/toolbarSpacing021O.test.mjs` | **NEW** — 25 tests covering all 021O spacing assertions |
| `artifacts/pack-checklist/src/hooks/toolbarGroup021N.test.mjs` | Updated finders + B6 pill overlay assertion (pt-8 → pb-3) |
| `artifacts/pack-checklist/src/hooks/toolbarAlign021M.test.mjs` | Updated finders (A1, A7) to use pb-3-based locators |
| `artifacts/pack-checklist/src/hooks/gutterLayout021H.test.mjs` | Updated E4, F2 locators (removed pt-8 from locator strings) |
| `artifacts/pack-checklist/src/hooks/activeFileName018C.test.mjs` | Updated locator + tests 2, 9 (pt-8 removed from panel and overlay) |
| `artifacts/pack-checklist/src/hooks/sidebar019.test.mjs` | Updated test 29 (pill overlay string) |
| `artifacts/pack-checklist/src/hooks/newBlank020.test.mjs` | Updated test 28 (pill overlay string) |
| `artifacts/pack-checklist/src/hooks/lockerFirstOpen020B.test.mjs` | Updated test 21 (pill overlay string) |
| `artifacts/pack-checklist/src/hooks/newAfterLocker020C.test.mjs` | Updated test 28 (pill overlay string) |
| `artifacts/pack-checklist/src/hooks/newClearLight041.test.mjs` | Updated test 16 (pill overlay string) |
| `artifacts/pack-checklist/src/hooks/savedListRestore020D.test.mjs` | Updated test 26 (pill overlay string) |
| `package.json` | Added `toolbarSpacing021O.test.mjs` to `test:importer` chain |

---

## Invariants for Next Prompt

- **One value controls toolbar top position:** `pt-4` on the toolbar-group parent div only.
- Neither child toolbar panel may carry an independent `pt-*` for vertical placement.
- The filename pill overlay uses `pb-3` only (no `pt-*`) — top spacing from parent.
- All 021N structural invariants remain (see 021N report).
- All 021M, 021L, 021K, 021H values remain unchanged.

---

## Test Results

```
021H Gutter Layout:          29 passed, 0 failed
021L Sidebar Gutter:         26 passed, 0 failed
021M Toolbar Alignment:      24 passed, 0 failed
021N Toolbar Group:          36 passed, 0 failed
021O Toolbar Spacing:        25 passed, 0 failed
All other suites:            passing
Full pnpm test:importer:     EXIT 0  (41 suites)
```
