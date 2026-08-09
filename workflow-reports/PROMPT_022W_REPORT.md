# Prompt 022W — Correct Mobile Portrait Toolbar Layout with Explicit Rows

**Date:** 2026-08-09  
**Prompt sequence:** 022W (follows 022V)  
**Status:** ✅ COMPLETE — all tests pass

---

## 1. Problem

Prompt 022V introduced `flex-wrap` on the left toolbar panel so controls could wrap to a second row on narrow portrait phones. It worked on desktop (wide single-row container), but on a real iPhone the file-name pill used `absolute inset-0` positioning — which expanded to cover *all* wrapped rows, floating the pill over the middle of the controls on the second row.

Root cause: `inset-0` fills the entire multi-row flex container when `flex-wrap` creates more than one row.

---

## 2. Solution

**Replace `flex-wrap` with explicit `flex-col` rows on portrait, then `lg:flex-row` on desktop.**

### Header — two portrait rows
| Row | Content | Visibility |
|-----|---------|-----------|
| 1 (logo row) | Logo + portrait-only Account/Guest button | Always |
| 2 (actions row) | New / Undo / Redo / Save / Divider / Reset | Always |
| Single row | Logo + all header icons | `sm+` (overridden by `sm:flex-row`) |

- Header inner container: `flex flex-col sm:flex-row sm:h-16 sm:items-center sm:justify-between py-2 sm:py-0 gap-y-1.5`
- Portrait Account/Guest duplicated in logo row with `sm:hidden`
- Original Account/Guest in actions row wrapped in `hidden sm:flex`
- Divider changed to `hidden sm:block` (no room on portrait)

### Left toolbar panel — three portrait rows
| Row | Content | Visibility |
|-----|---------|-----------|
| 1 | File-name pill — **in normal flow** (w-full centered) | Conditional on `activeLockerFile` |
| 2 | [Open\|Close] + [Imperial\|Metric] | Always (UnitToggle div is `lg:hidden`) |
| 3 | [Hide] + [Preview] | Mobile only (`lg:hidden` wrapper) |
| Desktop right group | [Hide] [Preview] [UnitToggle] | `hidden lg:flex ... ml-auto` |

- Outer container: `pb-3 flex flex-col items-center gap-2 lg:flex lg:flex-row lg:items-center lg:gap-0 lg:pr-7 lg:relative`
- Pill wrapper (mobile): `w-full flex justify-center pointer-events-none`
- Pill wrapper (desktop): adds `lg:absolute lg:inset-0 lg:pb-3 lg:flex lg:items-center lg:justify-center lg:w-auto`
- Desktop right group: `hidden lg:flex items-center gap-3 ml-auto flex-shrink-0`

---

## 3. Files Changed

### Implementation
| File | Change |
|------|--------|
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | Header restructured to two-row portrait layout; left panel outer uses `flex-col`; explicit Row 1/2/3 for portrait; desktop right group `hidden lg:flex`; divider `hidden sm:block`; portrait Account in logo row |

### Tests updated (pattern changes from 022W)
| File | Update |
|------|--------|
| `controls017.test.mjs` | Tests 5/7/19: accept 1–2 Preview calls; use `lastIndexOf` for desktop group |
| `activeFileName018.test.mjs` | `ml-auto` pattern → `hidden lg:flex … ml-auto` |
| `activeFileName018A.test.mjs` | Same; slice +100 chars; `flex items-center` → `items-center` |
| `activeFileName018B.test.mjs` | Same; slice 4000→8000 |
| `activeFileName018C.test.mjs` | Same; `absolute inset-0` → `absolute + inset-0`; `flex items-center` → `items-center`; slice 4000→8000 |
| `sidebar019.test.mjs` | Pill wrapper → `lg:absolute lg:inset-0` |
| `newBlank020.test.mjs` | Pill wrapper → `lg:absolute lg:inset-0` |
| `lockerFirstOpen020B.test.mjs` | Pill wrapper → `lg:absolute lg:inset-0` |
| `newAfterLocker020C.test.mjs` | Pill wrapper → `lg:absolute lg:inset-0` |
| `savedListRestore020D.test.mjs` | Pill wrapper → `lg:absolute lg:inset-0` |
| `newClearLight041.test.mjs` | Pill wrapper → `lg:absolute lg:inset-0` |
| `toolbarGroup021N.test.mjs` | Pill wrapper → `lg:absolute lg:inset-0` |
| `toolbarAlign021M.test.mjs` | Pill wrapper → `lg:absolute lg:inset-0` |
| `gutterLayout021H.test.mjs` | F3: search header block for padding (multi-line className) |
| `toolbarSpacing021O.test.mjs` | `filenamePillLine`: match `pointer-events-none + justify-center` |
| `mobileToolbar022V.test.mjs` | §A: `flex-col` rows; §D: `hidden lg:flex`; §H: `min-w-0`; §J: `lastIndexOf` |

### New test file
| File | Tests |
|------|-------|
| `mobilePortrait022W.test.mjs` | 35 tests covering §A outer container, §B pill mobile/desktop, §C Row 2, §D Row 3, §E desktop right group, §F header two-row, §G desktop grid, §H no-overlap, §I regression |

---

## 4. Test Results

```
pnpm test:importer — PASS (0 failures)

022W — Mobile Portrait Toolbar: Explicit Rows
A. Left toolbar panel outer container        ✓ 5/5
B. Row 1 — File-name pill                   ✓ 4/4
C. Row 2 — Open/Close + UnitToggle (mobile)  ✓ 3/3
D. Row 3 — Hide + Preview (mobile-only)      ✓ 3/3
E. Desktop-only right group                  ✓ 5/5
F. Header two-row portrait layout            ✓ 6/6
G. Desktop layout preserved                  ✓ 3/3
H. Pill does not overlap controls on portrait ✓ 2/2
I. Regression — prior fixes preserved        ✓ 4/4
Total: 35/35 ✓
```

All pre-existing tests updated and passing.

---

## 5. Screenshots

| Viewport | File |
|----------|------|
| 320 × 568 (portrait narrow) | `screenshot-022W-320px.jpg` |
| 375 × 667 (iPhone SE) | `screenshot-022W-375px.jpg` |
| 390 × 844 (iPhone 14 Pro) | `screenshot-022W-390px.jpg` |
| 430 × 932 (iPhone 14 Plus) | `screenshot-022W-430px.jpg` |
| 812 × 375 (landscape) | `screenshot-022W-landscape.jpg` |
| 1280 × 800 (desktop) | `screenshot-022W-desktop.jpg` |

---

## 6. Invariants Preserved

- `LOCKER_KEY = 'trailweigh:locker'` — unchanged
- `locker_entries` / `share_links` DB tables and routes — unchanged
- 022T/022U fixes (mergeLockerEntries import, min-h-[100dvh] scroll) — preserved
- Footer in normal document flow (022F) — preserved
- Desktop two-column layout (`lg:grid-cols-[1fr_365px]`) — preserved
- `lg:pr-7` on left toolbar panel — preserved
- Open/Close stays together as segmented control — preserved
- Imperial/Metric stays together as segmented control — preserved
- All button functions unchanged (layout only) — preserved
