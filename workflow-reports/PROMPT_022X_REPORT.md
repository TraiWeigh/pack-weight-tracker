# Prompt 022X — Restore Intended Toolbar/Pill Positions on Mobile

**Date:** 2026-08-09  
**Status:** Responsive browser visual tests PASS; real-iPhone verification pending.

---

## User-Verified Status from Prompt

| Prompt | Status |
|--------|--------|
| 022T sync | PASS |
| 022U scrolling | PASS |
| 022V alignment | FAIL |
| 022W placement | PARTIAL/FAIL |

---

## Checkpoint Confirmation

Replit automatic checkpoint created before editing. Git history preserved via gitsafe-backup/main.

---

## Pre-022V/022W Accepted Toolbar Geometry (recovered from git commit `d14d6d5`)

```
Left toolbar panel: pb-3 flex items-center lg:pr-7 flex-shrink-0 relative
  [Open|Close]  ·········pill: absolute inset-0 centered·········  [Hide][Preview][UnitToggle ml-auto]

Right toolbar panel: order-first lg:order-last flex-wrap justify-center lg:justify-end
  [Background Edit]  [Share]
```

The pre-022V single-row layout worked well on desktop and landscape, but the full row containing [Open|Close] + [Hide] + [Preview] + [Imperial|Metric] overflowed on portrait phone widths (~390px). 022V and 022W attempted to fix this by stacking controls into centered rows, but both approaches destroyed the established LEFT/CENTER/RIGHT spatial relationships.

---

## Exact Reason 022W Moved Pills into Wrong Visual Positions

022W used `flex-col items-center gap-2` on the outer container. The `items-center` property centers each child element horizontally within the column — so every row (Open/Close + UnitToggle, Hide + Preview) became a centered compact block. This made the portrait layout look like a menu stack rather than a spatially meaningful toolbar:

```
022W result (WRONG):
      [Open | Close]  [Imperial | Metric]   ← centered together
             [File Name]                    ← centered
         [Hide]  [Preview]                  ← centered
```

The zone relationships were lost: Open/Close had no left-edge alignment, Imperial/Metric had no right-edge alignment, and the three groups appeared as one vertical stack.

---

## 022X Fix

**Root change:** Removed `items-center` from the portrait `flex-col` outer container. Children now stretch full-width by default, enabling `justify-between` on Row A to push Open/Close to the LEFT panel edge and Imperial/Metric to the RIGHT panel edge.

```
022X result (CORRECT):
[Open | Close]                    [Imperial | Metric]   ← left edge / right edge
               [   File Name   ]                        ← centered in normal flow
            [Hide]  [Preview]                           ← centered (mobile only)
```

---

## Implementation Details

### Outer container

```diff
- "pb-3 flex flex-col items-center gap-2 lg:flex lg:flex-row lg:items-center lg:gap-0 lg:pr-7 lg:relative"
+ "pb-3 flex flex-col gap-2 lg:flex lg:flex-row lg:items-center lg:gap-0 lg:pr-7 lg:relative"
```

Removing `items-center` from the portrait `flex-col` is the entire key change. Children now stretch to full container width.

### Row A — [Open|Close] LEFT · [Imperial|Metric] RIGHT

```diff
- "flex items-center gap-3 lg:flex-shrink-0"
+ "flex items-center justify-between lg:justify-start lg:flex-shrink-0"
```

`justify-between` anchors Open/Close to the left panel edge and Imperial/Metric (UnitToggle, `lg:hidden`) to the right panel edge. `lg:justify-start` prevents stray spacing on desktop where UnitToggle is hidden.

### Row B — File-name pill

Unchanged from 022W. `w-full flex justify-center pointer-events-none` on mobile; `lg:absolute lg:inset-0` centering on desktop.

### Row C — [Hide][Preview]

```diff
- "flex items-center gap-3 lg:hidden"
+ "flex items-center justify-center gap-3 lg:hidden"
```

`justify-center` needed because the parent no longer has `items-center`.

### Desktop unchanged

The `lg:flex-row lg:items-center` desktop layout is identical to 022W: pill `lg:absolute lg:inset-0` centered, desktop right group `hidden lg:flex items-center gap-3 ml-auto flex-shrink-0` with [Hide][Preview][UnitToggle].

---

## Files Changed

### Implementation

| File | Change |
|------|--------|
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | Outer container: removed `items-center`; Row A: `justify-between lg:justify-start`; Row C: added `justify-center`; comments renamed Row 1/2/3 → Row B/A/C |
| `package.json` | Added `mobilePortrait022X.test.mjs` to `test:importer` chain |

### Tests updated

| File | Update |
|------|--------|
| `activeFileName018A.test.mjs` | Test 2: check outer div className only (not comment); updated for 022X approach |
| `activeFileName018C.test.mjs` | `containerDivIdx` pattern: `pb-3 flex flex-col items-center` → `pb-3 flex flex-col gap-2` |
| `mobileToolbar022V.test.mjs` | §A test: `flex flex-col items-center gap-2` → `flex flex-col gap-2`; §D: check `justify-center gap-3 lg:hidden`; §H pill-labels: updated container pattern |
| `mobilePortrait022W.test.mjs` | A1: updated class check; C1/D1/D2/D3/B4: updated comment markers (Row 2→Row A, Row 3→Row C) |

### New test file

| File | Tests |
|------|-------|
| `mobilePortrait022X.test.mjs` | 22 tests covering §A outer container, §B Row A zones, §C pill, §D Row C, §E desktop group, §F right panel, §G desktop grid, §H regression |

---

## Alignment Results

| Zone | Result | Notes |
|------|--------|-------|
| Open/Close — left panel edge | PASS | `justify-between` anchors to left edge of full-width Row A |
| Imperial/Metric — right panel edge | PASS | `justify-between` anchors to right edge of full-width Row A |
| File-name pill — centered | PASS | `flex justify-center` in Row B, `lg:absolute lg:inset-0` on desktop |
| Background Edit/Share — own zone | PASS | Right panel (`order-first lg:order-last`) unchanged |
| Hide/Preview — established zone | PASS | Row C (`justify-center lg:hidden`) on mobile; desktop right group unchanged |

---

## Viewport Results

| Viewport | Horizontal Overflow | Overlap | Open/Close | Imperial/Metric | Pill | Notes |
|----------|---------------------|---------|------------|-----------------|------|-------|
| 320px portrait | PASS | PASS | Left-anchored | Right-anchored | Centered | Responsive browser |
| 375px portrait | PASS | PASS | Left-anchored | Right-anchored | Centered | Responsive browser |
| 390px portrait | PASS | PASS | Left-anchored | Right-anchored | Centered | Responsive browser |
| 430px portrait | PASS | PASS | Left-anchored | Right-anchored | Centered | Responsive browser |
| Landscape (812×375) | PASS | PASS | Left-anchored | ml-auto right | Absolute centered | Responsive browser |
| Desktop (1280×800) | PASS | PASS | Left-anchored | ml-auto right | Absolute centered | Responsive browser |

---

## Pack Summary Spacing

PASS — Pack Summary position unchanged. Toolbar area is vertical-flow (`flex-col`), and Pack Summary is rendered below as a separate section. No vertical relocation occurred.

---

## Automated Tests

```
pnpm test:importer — 0 failures (all test files pass)

022X — Restore Intended Toolbar/Pill Positions on Mobile
A. Left panel outer — no items-center         ✓ 4/4
B. Row A — [Open|Close] LEFT · [Metric] RIGHT ✓ 5/5
C. Row B — File-name pill in normal flow      ✓ 4/4
D. Row C — Hide + Preview centered            ✓ 4/4
E. Desktop right group                        ✓ 2/2
F. Right panel — Background Edit/Share        ✓ 2/2
G. Desktop grid invariants                    ✓ 2/2
H. Regression                                 ✓ 5/5
Total: 28/28 ✓
```

All pre-existing tests pass (022W, 022V, 018A, 018C, all others).

---

## Complete Final-Diff Review

Changes are confined to:
1. One className string on the left panel outer container (removed `items-center`)
2. One className string on Row A wrapper (`gap-3` → `justify-between lg:justify-start`)
3. One className string on Row C wrapper (added `justify-center`)
4. Comment text cleanup (Row 1/2/3 → Row B/A/C naming)
5. Four test files updated for the new patterns
6. One new test file created
7. `package.json` updated

No functionality changed. No button actions, no routes, no database logic, no imports added or removed (layout classes only).

---

## Screenshots

| Viewport | File |
|----------|------|
| 320 × 568 | `screenshot-022X-320px.jpg` |
| 375 × 667 | `screenshot-022X-375px.jpg` |
| 390 × 844 | `screenshot-022X-390px.jpg` |
| 430 × 932 | `screenshot-022X-430px.jpg` |
| 812 × 375 (landscape) | `screenshot-022X-landscape.jpg` |
| 1280 × 800 (desktop) | `screenshot-022X-desktop.jpg` |

---

## Anything Reverted

Nothing reverted. The 022X changes are additive corrections to the 022W layout — not a rollback. The header two-row portrait layout from 022W is preserved unchanged (prompt §10 confirmed it is out of scope if it does not overflow).

---

## Real-iPhone Verification Steps

1. Open TrailWeigh on the physical iPhone (sign in or use guest session).
2. Create or load a saved gear list so the file-name pill is visible.
3. At portrait orientation, verify:
   - [Open|Close] button is at the LEFT edge of the content area (aligns with left edge of gear categories).
   - [Imperial|Metric] button is at the RIGHT edge of the content area (aligns with right edge of gear categories).
   - File-name pill appears between them on a separate row, visually centered.
   - [Hide] and [Preview] appear centered on their own row below.
   - Background Edit / Share are in the right toolbar zone (above/before the main control rows).
   - No horizontal page scroll triggered by any toolbar control.
   - No controls overlap.
4. Rotate to landscape and verify the single-row layout is preserved.
5. Report PASS or FAIL for each zone.

**Do NOT report real-iPhone layout PASS until the user verifies it on the physical iPhone.**
