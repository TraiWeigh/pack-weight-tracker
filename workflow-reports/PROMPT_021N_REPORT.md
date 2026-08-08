# Prompt 021N — Toolbar Group Container

**Date:** 2026-08-08  
**Status:** COMPLETE — all tests passing

---

## Problem Statement

The left pills row and the right action bar were siblings in a flat two-column grid, each inside its own column wrapper div. Moving either toolbar panel required touching multiple elements in two separate DOM positions. The goal was to group both toolbar rows under a single parent container so the entire toolbar can be repositioned by editing one element.

---

## Structural Change

### Before 021N (per prompt)

```
<main lg:overflow-hidden>
  <div lg:grid-cols-[1fr_365px] lg:gap-4>     ← outer grid

    <!-- Left column wrapper (div) -->
    <div lg:h-full lg:flex lg:flex-col lg:overflow-hidden>
      <!-- pills row -->
      <div pt-8 pb-3 flex items-center lg:pr-7 …>  ← pills row inside
      <!-- categories scroll -->
      <div lg:flex-1 lg:overflow-y-auto lg:pr-3 …>

    <!-- Sidebar column wrapper (div) -->
    <div order-first lg:order-last lg:h-full lg:flex lg:flex-col lg:overflow-hidden>
      <!-- action bar -->
      <div pt-8 pb-3 lg:justify-end lg:pl-3 lg:pr-9 …>   ← action bar inside sidebar
      <!-- sidebar scroll -->
      <div lg:flex-1 lg:overflow-y-auto lg:pl-1 lg:pr-5 …>
```

### After 021N

```
<main lg:flex lg:flex-col>

  <!-- ── Toolbar group ── (new single parent for all toolbar controls) -->
  <div grid grid-cols-1 lg:grid-cols-[1fr_365px] lg:gap-4>
    <!-- Left toolbar panel — Pinned pills row -->
    <div pt-8 pb-3 flex items-center lg:pr-7 flex-shrink-0 relative>
    <!-- Right toolbar panel (action bar) -->
    <div order-first lg:order-last … pt-8 pb-3 lg:justify-end lg:pl-3 lg:pr-9 flex-shrink-0>
  </div>  ← end toolbar group

  <!-- ── Content area ── -->
  <div grid grid-cols-1 lg:grid-cols-[1fr_365px] gap-8 lg:gap-4 lg:flex-1 lg:min-h-0 lg:overflow-hidden>
    <!-- categories scroll -->
    <div lg:h-full lg:overflow-y-auto lg:min-h-0 … lg:pr-3 lg:[scrollbar-gutter:stable]>
    <!-- sidebar scroll -->
    <div order-first lg:order-last lg:h-full lg:overflow-y-auto … lg:pl-1 lg:pr-5 lg:[scrollbar-gutter:stable]>
  </div>  ← end content area

</main>
```

---

## Key Decisions

| Decision | Rationale |
|---|---|
| `main` changed from `lg:overflow-hidden` to `lg:flex lg:flex-col` | Needed to stack toolbar-group + content-area vertically on desktop |
| Column wrappers removed | No longer needed — each scroll div carries its own height constraint (`lg:h-full`) |
| `lg:flex-1` on content area | Fills remaining main height below toolbar group |
| `lg:overflow-hidden` moved to content area | Overflow clipping now lives where it belongs — on the scrollable grid |
| `order-first lg:order-last` on action bar | Mobile: action bar renders above pills row; desktop: right column |
| `lg:h-full` on both scroll divs | Replaces `lg:flex-1` that was previously provided by the column wrappers |

---

## Protected Values Preserved

| Value | Origin | Status |
|---|---|---|
| `lg:px-8` outer main padding | 021H | ✓ |
| `lg:gap-4` column gap | 021H | ✓ |
| `lg:grid-cols-[1fr_365px]` sidebar width 365px | 021H | ✓ |
| `lg:pr-3 lg:[scrollbar-gutter:stable]` categories scroll | 021K | ✓ |
| `lg:pl-1 lg:pr-5 lg:[scrollbar-gutter:stable]` sidebar scroll | 021L | ✓ |
| `lg:pr-7` pills row right padding | 021M | ✓ |
| `lg:pl-3 lg:pr-9 lg:justify-end` action bar | 021M | ✓ |
| ChevronDown=collapsed, ChevronUp=expanded on all panels | 021J/021L | ✓ |

---

## Files Changed

| File | Change |
|---|---|
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | Restructured: toolbar group + content area; removed column wrappers; updated scroll div classes |
| `artifacts/pack-checklist/src/hooks/gutterLayout021H.test.mjs` | Updated E1 and F1 tests to match new structure (column wrappers gone) |
| `artifacts/pack-checklist/src/hooks/toolbarGroup021N.test.mjs` | **NEW** — 36 tests covering all 021N structural assertions |
| `artifacts/pack-checklist/src/hooks/activeFileName018A.test.mjs` | Updated locator: `{/* Gear list */}` → `Left toolbar panel` (021N comment rename) |
| `package.json` | Added `toolbarGroup021N.test.mjs` to `test:importer` chain |

---

## Test Results

```
021H Gutter Layout:          29 passed, 0 failed
021L Sidebar Gutter:         26 passed, 0 failed
021M Toolbar Alignment:      24 passed, 0 failed
021N Toolbar Group:          36 passed, 0 failed
All other suites:            passing
Full pnpm test:importer:     EXIT 0
```

---

## Invariants for Next Prompt

- `lg:flex lg:flex-col` on `<main>` — never revert to `lg:overflow-hidden`
- Toolbar group div must remain `grid grid-cols-1 lg:grid-cols-[1fr_365px] lg:gap-4` (no `gap-8`)
- Content area must remain `grid … gap-8 lg:gap-4 lg:flex-1 lg:min-h-0 lg:overflow-hidden`
- Both scroll divs use `lg:h-full` (not `lg:flex-1`)
- Both scroll divs use `order-first lg:order-last` (sidebar: mobile appears first; right action bar: mobile appears first)
- All protected values from 021H, 021K, 021L, 021M remain unchanged
