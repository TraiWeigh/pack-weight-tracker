# PROMPT 021I — Pixel Baseline Diagnostic Report

**Date:** 2026-08-08  
**Type:** DIAGNOSTIC ONLY — zero application code changes  
**Purpose:** Produce a comprehensive DOM pixel baseline so the next prompt can prescribe an exact gutter fix.

---

## Methodology

Measurements were taken using Playwright 1.62.1 with Chromium 138.0.7204.100 (system binary). The script navigated to the shared view `/s/d2211a8c96` (auth-free, same CSS classes and grid as the owner's Checklist page). At each viewport width, `element.getBoundingClientRect()` and `window.getComputedStyle()` were called for every structural element. All values are in CSS pixels (device pixel ratio = 1 for all measured viewports).

**Source URL measured:** `http://127.0.0.1:80/s/d2211a8c96`  
**Limitation:** The owner's `/checklist` page requires authentication and was not directly measurable. `Checklist.tsx` uses `lg:grid-cols-[1fr_365px]` (fixed 365px sidebar) while `SharedChecklistPage.tsx` uses `lg:grid-cols-12` (12-column equal grid). Both apply the same `lg:px-8`, `lg:gap-4`, and `lg:pr-3` tokens, so the gutter composition analysis below applies equally to both pages.

---

## TRAILWEIGH PIXEL BASELINE

### §1 — Viewport Geometry (all breakpoints)

| Viewport | innerWidth | innerHeight | DPR | Page scrollbarW | main.left | main.right | main.w | mainPL | mainPR |
|----------|-----------|-------------|-----|----------------|-----------|-----------|--------|--------|--------|
| 1440×900 | 1440 | 900 | 1 | 0px | 32.1px | 1407.9px | 1375.8px | 32px | 32px |
| 1280×800 | 1280 | 800 | 1 | 0px | **0px** | 1280px | 1280px | 32px | 32px |
| 1024×768 | 1024 | 768 | 1 | 0px | **0px** | 1024px | 1024px | 32px | 32px |
| 768×1024 | 768 | 1024 | 1 | 0px | 0px | 768px | 768px | 24px | 24px |
| 430×932 | 430 | 932 | 1 | 0px | 0px | 430px | 430px | 16px | 16px |
| 390×844 | 390 | 844 | 1 | 0px | 0px | 390px | 390px | 16px | 16px |

**Note — 1440 anomaly:** `main.left = 32.1px` at 1440px only. At all other desktop widths main.left = 0. The shared page may have a `max-w-` container that kicks in near 1440px, centering main with 32px auto-margins. The grid geometry inside main is correct regardless; G1/G3 values at 1440 are 64px because they include this outer margin. The 1280/1024 rows are the canonical desktop references.

---

### §2 — Header

Measured at 1440×900 (consistent across all desktop widths).

| Element | x | y | w | h |
|---------|---|---|---|---|
| `<header>` | 0 | 0 | 1440 | 98 |
| Header inner row (`px-8` row) | 0 | 0 | 1440 | 64 | 
| Banner row (Viewing notice) | — | 64 | — | 34 |

**Header inner padding:** pl=32px, pr=32px  
**Header total height:** 98px (64px nav + 34px "Viewing" banner on shared page; owner page header = 64px with no banner)  
**Main `top`:** 98px (content starts just below header)

**Header buttons (1440):**
| Button | x | y | w | h | fontSize |
|--------|---|---|---|---|----------|
| Undo | 955.9 | 16 | 75.4 | 32 | 12px |
| Redo | 1035.3 | 16 | 74.1 | 32 | 12px |
| Save Your Own Copy | 1113.4 | 17 | 184.8 | 30 | 12px |
| Sign in | 1315.3 | 17 | 92.7 | 30 | 12px |

---

### §3 — Desktop 2-Column Grid (primary: 1280×800)

At ≥1024px (`lg:` breakpoint active), both pages use a 2-column grid.

**Page:** SharedChecklistPage uses `lg:grid-cols-12`; Checklist.tsx uses `lg:grid-cols-[1fr_365px]`.

| Property | 1280×800 | 1024×768 | 1440×900 (anomalous) |
|----------|----------|----------|----------------------|
| `display` | grid | grid | grid |
| `gridTemplateColumns` | 12 × 86.66px | 12 × 65.33px | 12 × 94.64px |
| `columnGap` | **16px** | **16px** | **16px** |
| `rowGap` | 16px | 16px | 16px |
| Grid left edge | 32px | 32px | 64.1px |
| Grid right edge | 1248px | 992px | 1375.9px |
| Grid width | 1216px | 960px | 1311.8px |

**Confirmation:** `lg:gap-4` (16px column gap) is active at all desktop widths — the 021H CSS change is applied correctly.

---

### §4 — Left Column (gear list)

| Property | 1280×800 | 1024×768 | 1440×900 |
|----------|----------|----------|----------|
| left | 32 | 32 | 64.1 |
| right | 837.3 | 666.7 | 933.3 |
| width | 805.3 | 634.7 | 869.2 |
| height | 702 | 670 | 802 |

---

### §5 — Left Column Scrollable Area

The left col has a scrollable div with `lg:pr-3 lg:[scrollbar-gutter:stable]`.

| Property | 1280×800 | 1024×768 | 1440×900 |
|----------|----------|----------|----------|
| left | 32 | 32 | 64.1 |
| right | 837.3 | 666.7 | 933.3 |
| width | 805.3 | 634.7 | 869.2 |
| padding-right | **12px** | **12px** | **12px** |
| scrollbar-gutter | `stable` | `stable` | `stable` |
| scrollbarWidth (offsetW − clientW) | **15px** | **15px** | **15px** |

**Key finding:** The scrollable div's `right` edge equals the left column's `right` edge — meaning the 15px scrollbar track is reserved INSIDE the element at its right edge. Category card content ends 12px (pr-3) + 15px (gutter) = **27px** before the column's right edge.

---

### §6 — Category Card (first card in left column)

Measured at 1440×900 (SharedChecklistPage):

| Property | Value |
|----------|-------|
| card.left | 64.1px |
| card.right | 906.3px |
| card.width | 842.2px |
| card.height | 346px |
| card.padding | 0px all sides (no card-level padding) |
| card border-radius | 8px |
| card border-width | 1px |
| card border-color | `rgb(50, 54, 62)` |
| card background | `rgb(30, 34, 41)` |
| card count (total in left col) | 15 |

**Card header row:**
| Property | Value |
|----------|-------|
| header.left | 65.1px |
| header.right | 905.3px |
| header.height | 60px |
| header padding | pl=16px, pr=16px, pt=16px, pb=16px |

**Category title (sample: "Backpack2 / 4 packed"):**
| Property | Value |
|----------|-------|
| fontSize | 16px |
| fontWeight | 600 |
| lineHeight | 24px |

**Derivation at 1280:** card.right = leftCol.right − pr-3 − scrollbarGutter = 837.3 − 12 − 15 = **810.3px** ✓ (matches measured `firstCard.right = 810.3` at 1280)

---

### §7 — Right Column (sidebar)

| Property | 1280×800 | 1024×768 | 1440×900 |
|----------|----------|----------|----------|
| left | 853.3 | 682.7 | 949.3 |
| right | 1248 | 992 | 1375.9 |
| width | 394.7 | 309.3 | 426.6 |
| height | 702 | 670 | 802 |

**Note:** Width is not 365px here because the shared page uses a 12-column grid (4 cols wide). On `Checklist.tsx` the sidebar is a fixed 365px column. The sidebar detection on the shared page correctly identified the rightmost grid column.

---

### §8 — G1 / G2 / G3 Gutter Breakdown

**Definitions:**
- **G1** = viewport left edge → category card left edge (left outer visual gutter)
- **G2** = category card right edge → sidebar column left edge (middle visual gutter, content-to-content)
- **G3** = sidebar column right edge → viewport right edge (right outer visual gutter)

| Viewport | G1 (left outer) | G2 raw (col gap) | G2 content-to-content | G3 (right outer) | G1 = G3? | Middle excess |
|----------|----------------|----------------|-----------------------|-----------------|-----------|--------------|
| 1280×800 | **32px** | 16px | **43px** | **32px** | ✅ Equal | +11px |
| 1024×768 | **32px** | 16px | **43px** | **32px** | ✅ Equal | +11px |
| 1440×900 | 64.1px | 16px | 43px | 64.1px | ✅ Equal | −21px |

**G2 content-to-content decomposition (canonical, all desktop widths):**
```
G2 = column_gap + left_pr-3 + left_scrollbar_gutter
G2 = 16px      + 12px      + 15px
G2 = 43px
```

**Comparison — before vs. after 021H (at 1280px):**

| Metric | Before 021H | After 021H | Δ |
|--------|-------------|------------|---|
| G1 = G3 (outer gutters) | 24px | **32px** | +8px |
| Column gap (`lg:gap`) | 32px | 16px | −16px |
| G2 content-to-content | **59px** | **43px** | −16px |
| Middle excess (G2 − G1) | **35px** | **11px** | −24px |

**Finding:** 021H DID make a mathematically significant change — the middle gutter excess dropped from 35px to 11px. The 021H changes are confirmed active (columnGap=16px is present). The user reporting "no meaningful visible change" may indicate: (a) browser/HMR cache was stale during testing, (b) the change is subtle at the user's zoom level/monitor, or (c) 11px remaining excess is still perceptible as an asymmetry. Either way, the measurements give an exact target for the next fix.

---

### §9 — Prescriptive Target for Next Prompt

To make **G2 = G1 = G3** (perfect balance at 1280px):

| Option | Change | Resulting G2 | Balance |
|--------|--------|--------------|---------|
| **A (recommended)** | Remove `lg:pr-3` from left scroll div | 0 + 15 + 16 = **31px** | 1px under outer (32px) |
| B | Remove scrollbar-gutter:stable | 12 + 0 + 16 = **28px** | Not stable (scrollbar appears dynamically) |
| C | Remove `lg:pr-3` AND change `lg:gap-4` → `lg:gap-5` | 0 + 15 + 20 = **35px** | 3px over outer (32px) |
| D | Change `lg:gap-4` → `lg:gap-0` | 12 + 15 + 0 = **27px** | 5px under outer |

**Option A is the surgical fix:** removing `lg:pr-3` from the left scroll area's `className` produces G2 = 31px ≈ G1 = G3 = 32px — a 1px rounding difference, visually indistinguishable from perfect balance.

**File to change:** `artifacts/pack-checklist/src/pages/Checklist.tsx` — the left col scrollable div's `className` that currently contains `lg:pr-3 lg:[scrollbar-gutter:stable]`.

---

### §10 — Controls Row (pill buttons)

Measured at 1440×900. The controls row sits at the top of the left column.

| Property | Value |
|----------|-------|
| row.x | 64.1 |
| row.y | 98 (flush below header) |
| row.width | 869.2 |
| row.height | 76px |

**Pills measured:**

| Button | x | y | w | h | padding | fontSize | fontWeight | border-radius |
|--------|---|---|---|---|---------|----------|------------|---------------|
| Open | 66.1 | 132 | 59.5 | 28 | pl/pr 12px, pt/pb 6px | 12px | 600 | 6px |
| Close | 127.6 | 132 | 60.5 | 28 | pl/pr 12px, pt/pb 6px | 12px | 600 | 6px |
| Preview | 678.4 | 132 | 78 | 28 | pl/pr 12px, pt/pb 6px | 12px | 600 | 8px |
| Imperial | 770.4 | 132 | 80 | 28 | pl/pr 12px, pt/pb 6px | 12px | 600 | 6px |
| Metric | 852.3 | 132 | 67 | 28 | pl/pr 12px, pt/pb 6px | 12px | 600 | 6px |

Row top = 98px (header bottom), pill center-y = 146px, pill height = 28px.

---

### §11 — Sidebar Panels (1440×900)

The sidebar panel detection on the shared page returned an empty array — the sidebar's scrollable inner div was not reached by the detection logic (likely because `overflow-y: auto` resolved differently in the shared view at this content length). The sidebar's outer column geometry was correctly measured (§7). Sidebar scrollbar-gutter status could not be confirmed for the right column from the shared view; source code shows `lg:[scrollbar-gutter:stable]` is also applied to the sidebar's inner scroll div.

**Derived sidebar right padding space (from source code):**
```
sidebar_scrollable.px-3 = 12px each side
sidebar_scrollable.scrollbar-gutter: stable ≈ 15px reserved at right
Effective sidebar content width = sidebar.w − 12(pl) − 12(pr) − 15(right gutter) = sidebar.w − 39px
```

---

### §12 — Typography

Measured at 1440×900:

| Element | fontFamily | fontSize | fontWeight | lineHeight | color |
|---------|-----------|----------|------------|------------|-------|
| Body | "Helvetica Neue" | 16px | — | 24px | — |
| Category weight total ("0.00lbs") | "Space Mono" | 18px | 600 | 18px | rgb(237,237,237) |
| Body/label (text-sm) | "Helvetica Neue" | 14px | 500 | 20px | rgb(158,158,158) |
| XS / logo ("Gear Tracker") | "Helvetica Neue" | 12px | 600 | 16px | rgb(158,158,158) |
| Pill buttons | "Helvetica Neue" | 12px | 600 | — | — |

---

### §13 — Colors and Borders

Measured at 1440×900:

| Token | Value |
|-------|-------|
| Body background | `rgb(249, 248, 246)` (light cream — likely light mode) |
| Card background | `rgb(30, 34, 41)` (dark card — component uses dark bg) |
| Card border-color | `rgb(50, 54, 62)` |
| Card border-width | 1px |
| Card border-radius | 8px |
| App color mode | Light (`<html>` does not have `class="dark"`) |

---

### §14 — Mobile / Stacked Layouts

At <1024px, the grid collapses to a single column. The sidebar renders **above** the category list (sidebar = `order-first` on mobile).

| Viewport | Layout | mainPL | Grid single-col width | Card width | G1 outer |
|----------|--------|--------|----------------------|------------|---------|
| 768×1024 | Single col | 24px (sm:px-6) | 720px | 720px | 24px |
| 430×932 | Single col | 16px (px-4) | 398px | 398px | 16px |
| 390×844 | Single col | 16px (px-4) | 358px | 358px | 16px |

Row gap between stacked panels (sidebar and card list): 32px (`gap-8`). No horizontal overflow at any measured mobile width.

---

### §15 — Responsive Breakpoint Boundaries

| Breakpoint | Width threshold | Effect |
|------------|----------------|--------|
| `sm:` | ≥640px | `sm:px-6` applies (24px outer padding) |
| `lg:` | ≥1024px | 2-column grid, `lg:px-8` (32px), `lg:gap-4` (16px col gap), `lg:pr-3` (12px right on left scroll), `lg:[scrollbar-gutter:stable]`, `lg:overflow-hidden` on main |

No `md:` breakpoint classes are used on these layout elements.

---

### §16 — Scroll Area Details

| Element | scrollbar-gutter | scrollbarWidth (measured) |
|---------|-----------------|--------------------------|
| Left col scrollable div | `stable` | **15px** reserved |
| Sidebar scrollable div | `stable` (from source; not captured by detector) | ~15px expected |
| Page / body | none (auto) | 0px (no page scrollbar at any measured viewport) |

The 15px scrollbar reservation is the dominant contributor to why G2 exceeds G1. Even if the column gap and pr-3 were zeroed, the 15px gutter alone would bring G2 to 15px (vs 32px outer) — still under, so the scrollbar gutter does not need removal; reducing `pr-3` to 0 is sufficient.

---

### §17 — Summary Table for ChatGPT Fix Prescription

| Token | Current value | CSS class | File |
|-------|--------------|-----------|------|
| Outer padding (both pages) | 32px | `lg:px-8` | `Checklist.tsx` `<main>` |
| Column gap | 16px | `lg:gap-4` | `Checklist.tsx` grid, `SharedChecklistPage.tsx` grid |
| Left col right padding | **12px** | `lg:pr-3` | `Checklist.tsx` left scroll div |
| Left scrollbar gutter | 15px reserved | `lg:[scrollbar-gutter:stable]` | `Checklist.tsx` left scroll div |
| Sidebar px | 12px each side | `lg:px-3` | `Checklist.tsx` sidebar scroll div |
| Sidebar scrollbar gutter | 15px reserved | `lg:[scrollbar-gutter:stable]` | `Checklist.tsx` sidebar scroll div |

**G2 = column_gap + left_pr + left_scrollbar_gutter**  
**G2 = 16 + 12 + 15 = 43px** (after 021H)  
**G1 = G3 = 32px** (after 021H)  
**Imbalance = 11px** (G2 too wide by 11px)  
**Fix: remove `lg:pr-3`** → G2 = 16 + 0 + 15 = 31px ≈ 32px ✓

---

### §18 — Application Code Diff

```
ZERO application code changes in this prompt.
```

Verification:
```
git diff --name-only   →   (empty)
git status --short     →   ?? measure021I.mjs   (untracked temp script, not committed)
```

---

## Deliverable Checklist

- [x] Real DOM measurements via Playwright + getBoundingClientRect()
- [x] All 6 viewport widths measured: 1440, 1280, 1024, 768, 430, 390
- [x] G1/G2/G3 gutter values confirmed with exact pixel decomposition
- [x] 021H CSS changes confirmed active (col gap = 16px ✓)
- [x] Prescriptive Option A identified (remove `lg:pr-3`)
- [x] Zero application code diff
- [x] PROMPT_021I_REPORT.md written
- [x] TRAILWEIGH_COMPLETE_WORKFLOW.md appended
- [x] ZIP created with 4 entries
