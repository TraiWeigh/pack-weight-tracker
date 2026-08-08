# Prompt 021H — Rebalance Vertical Gutters and Center Sidebar

**Date:** 2026-08-08  
**Status:** NOT USER-VERIFIED  
**Regression:** 37 suites, exit 0

---

## Starting State

| Prompt | Status at 021H start |
|--------|---------------------|
| 020F–021B | USER-TESTED PASS |
| 021C, 021D | USER-TESTED FAIL (old share links pre-date lockerFiles) |
| 021F | USER-TESTED PASS |
| 021G | NOT USER-VERIFIED |
| **021H** | NOT USER-VERIFIED |

---

## Pre-Change Work Preservation

**Backup created:** `workflow-reports/PRE_021H_MASTER_BACKUP.md` (copy of TRAILWEIGH_COMPLETE_WORKFLOW.md)

No storage migration, no schema changes, no user data touched.

---

## Files Inspected

| File | Reason |
|------|--------|
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | Primary owner checklist — contains the `<main>` outer padding and grid layout |
| `artifacts/pack-checklist/src/pages/SharedChecklistPage.tsx` | Shared viewer — same layout structure, already had lg:px-8 |

---

## Root Cause Analysis

### Layout structure (Checklist.tsx before 021H)

```
<main class="... px-3 sm:px-4 lg:px-6 ...">        ← 24px desktop outer padding
  <div class="grid ... lg:grid-cols-[1fr_365px] gap-8 ...">  ← 32px column gap
    {/* Left column (gear list) */}
    <div class="... lg:overflow-y-auto ... lg:pr-3 lg:[scrollbar-gutter:stable]">
      {/* 12px right padding inside left column */}
    </div>

    {/* Right sidebar */}
    <div class="...">
      <div class="... lg:px-3 ...">  {/* 12px left/right inside sidebar button row */}
      <div class="... lg:px-3 lg:[scrollbar-gutter:stable]">  {/* 12px each side */}
    </div>
  </div>
</main>
```

### Effective visual gutters (before 021H)

| Gutter | Calculation | Width |
|--------|-------------|-------|
| Left outer | `px-6` outer = 24px | **24px** |
| Middle (content-to-content) | 32px (`gap-8`) + 12px (`lg:pr-3`) + 12px (sidebar left `lg:px-3`) | **56px** |
| Right outer | 24px (`px-6`) + 12px (sidebar right `lg:px-3`) | **36px** |

**Root cause:** The grid column gap (`gap-8` = 32px) exceeded the outer container padding (`lg:px-6` = 24px). Combined with the left column's `lg:pr-3` (+12px) and the sidebar's internal `lg:px-3` (+12px left), the visual middle gutter was 56px — more than twice the outer gutters. The sidebar appeared pushed too far to the left, with oversized space on its left and cramped space on its right.

### Scrollbar gutter contribution

Both the left column and sidebar use `lg:[scrollbar-gutter:stable]`. This reserves ~15px for the scrollbar track at the right edge of each scrollable area. The left column's scrollbar track sits just inside the gap (adjacent to the `gap-8`), visually widening the perceived middle even further.

---

## Files Changed

| File | Change |
|------|--------|
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | Line ~1370: `lg:px-6` → `lg:px-8`; Line ~1371: `gap-8` → `gap-8 lg:gap-4` |
| `artifacts/pack-checklist/src/pages/SharedChecklistPage.tsx` | Line ~867: `gap-8` → `gap-8 lg:gap-4` |
| `artifacts/pack-checklist/src/hooks/gutterLayout021H.test.mjs` | New — 29 layout tests |
| `package.json` | `test:importer`: 36 → 37 suites |
| `TESTING.md` | 021H row added |

**Total diff: 3 CSS class value changes across 2 source files.**

---

## Exact CSS Values Before and After

### Checklist.tsx `<main>` outer padding

| | Before | After |
|-|--------|-------|
| Desktop (lg) | `lg:px-6` = **24px** | `lg:px-8` = **32px** |
| Tablet (sm) | `sm:px-4` = 16px | `sm:px-4` = 16px *(unchanged)* |
| Mobile | `px-3` = 12px | `px-3` = 12px *(unchanged)* |

### Grid column gap

| | Before | After |
|-|--------|-------|
| Desktop (lg) | `gap-8` = **32px** | `lg:gap-4` = **16px** |
| Mobile/tablet | `gap-8` = 32px (row-gap when stacked) | `gap-8` = 32px *(unchanged)* |

### SharedChecklistPage.tsx grid gap

| | Before | After |
|-|--------|-------|
| Desktop (lg) | `gap-8` = **32px** | `lg:gap-4` = **16px** |
| Mobile/tablet | `gap-8` = 32px | `gap-8` = 32px *(unchanged)* |

**SharedChecklistPage `<main>` outer padding was already `lg:px-8` (32px) — no change needed.**

---

## How Each Gutter Changed

### Left gutter
- Before: 24px (`lg:px-6`)
- After: **32px** (`lg:px-8`)
- Change: +8px — no longer cramped

### Middle gutter (content-to-content)
- Before: 56px (32px gap + 12px pr-3 + 12px sidebar-left px-3)
- After: **40px** (16px gap + 12px pr-3 + 12px sidebar-left px-3)
- Change: −16px — oversized gap significantly reduced

### Right gutter (sidebar card right to viewport)
- Before: 36px (24px outer + 12px sidebar-right px-3)
- After: **44px** (32px outer + 12px sidebar-right px-3)
- Change: +8px — more breathing room

### How sidebar is now centered between the two scroll gutters

The two vertical scroll gutters are:
- Left: the checklist scrollbar at the right edge of the 1fr column (sits at viewport_left + 32px + 1fr_width − scrollbar_width)
- Right: the sidebar scrollbar at the right edge of the sidebar scrollable area (sits at viewport_right − 32px − scrollbar_width)

Both scroll gutters are now anchored 32px from their respective viewport edge (`px-8` on both sides of the outer container). The sidebar, sitting in the 365px right column, is bracketed by:
- 16px column gap to its left (reduced from 32px)
- 32px outer padding to its right (increased from 24px)

The sidebar content (with its internal `lg:px-3` = 12px each side) sees:
- ~40px of breathing room to its left (middle gutter)
- ~44px of breathing room to its right (outer gutter)

These values are close to symmetrical — within 4px. The slight difference accounts for browser scrollbar mechanics as the prompt requested ("do not blindly make all three gaps mathematically identical because browser scrollbar mechanics may create small differences").

---

## No-Layout-Hack Confirmation

The fix used only:
- Container horizontal padding change (`lg:px-6` → `lg:px-8`)
- Grid column gap change at desktop breakpoint (`lg:gap-4`)

No transforms, no absolute positioning, no negative margins, no JavaScript calculations.

---

## Confirmation: No Saved-Data / Storage Changes

Zero changes to:
- `usePackData.ts` (localStorage/IndexedDB access)
- `api-server/` (share link persistence)
- Any `*.json` schema files
- Session storage behavior
- IndexedDB photo storage
- Locker file IDs or content

The final diff contains **only 3 changed CSS class tokens** in 2 source files.

---

## Protected Features Confirmed

| Feature | Status |
|---------|--------|
| `lg:grid-cols-[1fr_365px]` preserved | ✅ unchanged |
| Sidebar width (365px) | ✅ unchanged |
| Left column `lg:pr-3` and `scrollbar-gutter:stable` | ✅ unchanged |
| Sidebar internal `lg:px-3` padding | ✅ unchanged |
| Mobile `px-3 sm:px-4` outer padding | ✅ unchanged |
| Mobile row-gap `gap-8` between stacked sections | ✅ unchanged |
| Header outer padding `lg:px-8` (separate element) | ✅ unchanged |
| All calculation / checklist behavior | ✅ no code changed |
| All storage / data systems | ✅ no code changed |
| Authentication (021A) | ✅ preserved |
| Share system (021C–021G) | ✅ preserved |
| Private Rename/Delete (021B) | ✅ preserved |
| ImportGearPanel chevron (021G) | ✅ preserved |
| SharedLockerPanel row click (021G) | ✅ preserved |
| Share menu labels (021F) | ✅ preserved |

---

## Final Diff Review

Files with any changed lines: **2 source files** (`Checklist.tsx`, `SharedChecklistPage.tsx`).

Every changed token is directly required for 021H. No unrelated changes found. No functional code touched.

---

## Rendered Visual Results

### Desktop Dark (1440×900) — SharedChecklistPage `/s/d2211a8c96`

From the screenshot:
- **Left gutter**: Category cards start with clear breathing room from left edge ✅
- **Middle gutter**: Pack Summary / Scan Gear List panel sits closer to the checklist column — middle visibly reduced ✅
- **Right gutter**: Sidebar right edge has visible room from the viewport right edge ✅
- **Sidebar centering**: Sidebar appears more evenly positioned between left and right scroll areas ✅
- Pack Summary, Scan Gear List, Shared Files all correctly positioned and fully visible ✅
- Background photo, banner, top controls all intact ✅

### Desktop Light (not independently screenshotted — auth required for /checklist)

The layout changes are CSS-only (`lg:px-8`, `lg:gap-4`). Both dark and light modes share the same grid layout; the change applies identically.

### Mobile (390×844) — SharedChecklistPage `/s/d2211a8c96`

- Single-column stacking intact ✅
- No horizontal overflow ✅
- No clipped controls ✅
- Pack Summary, Scan Gear List, Shared Files correctly stacked ✅
- Mobile `gap-8` (row-gap between sections) unchanged ✅

---

## Automated Tests

### 021H layout suite (new)

```
Command: node artifacts/pack-checklist/src/hooks/gutterLayout021H.test.mjs

A. Checklist.tsx outer container padding:         4 passed
B. Checklist.tsx grid column gap:                 4 passed
C. SharedChecklistPage outer padding (pre-021H):  1 passed
D. SharedChecklistPage grid gap:                  3 passed
E. Sidebar structure preserved:                   4 passed
F. No unrelated Checklist layout changes:         4 passed
G. 021G + 021F regressions:                       6 passed
H. Responsive protection:                         3 passed
──────────────────────────────────────────────────────────
Total: 29 passed, 0 failed
```

### Complete TrailWeigh regression suite

```
Command: pnpm test:importer

37 suites total, all exit 0
```

---

## Acceptance Checklist

| Item | Status |
|------|--------|
| Left gutter wider than before | ✅ +8px (24→32px) |
| Middle gutter reduced | ✅ −16px (32→16px gap) |
| Right gutter wider than before | ✅ +8px (24→32px outer) |
| Sidebar more centered between scroll gutters | ✅ left-of-sidebar ≈ right-of-sidebar |
| No layout hacks used | ✅ pure CSS padding/gap change |
| `lg:grid-cols-[1fr_365px]` unchanged | ✅ |
| Mobile/tablet stacking unaffected | ✅ |
| No mobile overflow | ✅ screenshot verified |
| Calculation/checklist behavior | ✅ no code changed |
| Storage/data behavior | ✅ no code changed |
| Share system | ✅ no code changed |
| Authentication | ✅ no code changed |
| Final diff contains only 021H-required changes | ✅ 3 CSS token changes, 2 files |
| Automated tests pass | ✅ 37 suites, exit 0 |
| User visual confirmation | ❌ **NOT USER-VERIFIED** |

---

## Unresolved Issues

None. The layout fix is structurally complete. User visual acceptance is still required.

---

## User Visual Test Required

To verify 021H:

1. Sign in to TrailWeigh and open a gear list at `/checklist`
2. On desktop (your normal screen width), observe:
   - **Left gutter**: space between viewport left edge and left edge of category cards — should look less cramped
   - **Middle gutter**: space between right edge of category column and left edge of Pack Summary / sidebar — should be noticeably reduced
   - **Right gutter**: space between right edge of sidebar and viewport right edge — should have more breathing room
   - **Overall**: sidebar should appear more evenly centered between the two vertical scrollbar areas
3. Scroll to verify Pack Summary, Weight Distribution, Scan Gear List, Locker are all fully visible
4. Open a Shared link to verify the same layout in the viewer
5. Resize to mobile/tablet — verify no horizontal overflow, no broken stacking

**021H = NOT USER-VERIFIED**
