# PROMPT 027L — Final Category-Handle Position Calibration
**Internal version:** 027L-CATEGORY-HANDLE-75-PERCENT-CALIBRATION-2026-08-14-R1  
**Report generated:** 2026-08-14  
**Routes affected:** `/mobile-design-v3` · `/mobile-functional-v3`  
**Production routes touched:** none

---

## 1. Internal Version

027L-CATEGORY-HANDLE-75-PERCENT-CALIBRATION-2026-08-14-R1

---

## 2. Time / Actions / Lines

- Grid column change: 2 files × 1 edit each
- Measurement effect (temporary): added + removed; left no permanent code
- Lines net changed: ~8 (grid template string only)
- Estimated agent time: ~7 minutes (including measurement loop)

---

## 3. Preflight Git Status

Two V3 prototype files modified since 027K. No production files touched.

---

## 4. Files Inspected

| File | Purpose |
|---|---|
| `src/pages/MobileDesignPrototypeV3.tsx` | Design master — grid calibration target |
| `src/pages/MobileFunctionalV3.tsx` | Functional preview — grid calibration target |
| `workflow-reports/PROMPT_027K_REPORT.md` | 027K context |

---

## 5. 027K Layout Found

```
gridTemplateColumns: 'minmax(0, 1fr) 32px 26px auto'
```

Four columns: text (flexible) · handle (32px) · gap (26px) · weight (auto).

First-pass DOM measurement with this layout:
- 375px: ratio ranged 0.717–0.745 (7 bars; 6 in range, 1 outlier)
- 390px: ratio ranged 0.729–0.755 (all in range)
- 430px: ratio ranged 0.756–0.780 (all in range / boundary)

**Root cause of the outlier:** The weight column was `auto` — sized to its content string. "Beach / Activities" displayed "12.5 oz" (≈43px wide), which is wider than the 6-character weights used by other categories (≈34px). Because text = grid − 32 − gap − weight_width, a wider weight column shrinks the text column, moving the handle left. At 375px this drove "Beach / Activities" to ratio 0.717, below the 0.72 floor.

---

## 6. Exact 027L Layout Change

```
// BEFORE (027K):
gridTemplateColumns: 'minmax(0, 1fr) 32px 26px auto'

// AFTER (027L):
gridTemplateColumns: 'minmax(0, 1fr) 32px 18px minmax(44px, auto)'
```

Applied identically in both V3 files.

---

## 7. Exact Handle Slot Width

**32px** — unchanged from 027K.

---

## 8. Exact Spacer/Gap and Weight Column Logic

**Gap column:** reduced from 26px → **18px**.

**Weight column:** changed from `auto` → **`minmax(44px, auto)`**.

`minmax(44px, auto)` means:
- When the displayed weight string is ≤ 44px wide: the column holds at exactly 44px, normalising handle position across all short/medium weight strings regardless of character count.
- When the weight string exceeds 44px (e.g. a future "900 g" label): the column expands gracefully; handle shifts left but text protection is maintained.

This eliminated the per-category handle variance that existed in 027K: all 7 measured bars now return **identical ratios** at each viewport.

**Geometry derivation (390px):**
- Bar width: 390 − 32 (outer padding) = 358px
- Wedge: 72px fixed
- Content area: 358 − 72 = 286px
- Content internal padding: 12px × 2 = 24px
- Grid width: 286 − 24 = 262px
- Grid columns: text + 32 + 18 + 44 = text + 94
- text = 262 − 94 = 168px
- Handle center in grid = 168 + 16 = 184px
- Handle center from bar left = 72 + 12 + 184 = 268px (DOM measured: 267px)
- ratio = 267 / 358 = **0.746** ✓

---

## 9. Measured Ratio — 375px

**DOM measurement via `getBoundingClientRect()` + `requestAnimationFrame`:**

All 7 bars returned identical measurements:

| Bar | barWidth | handleCx | ratio |
|---|---|---|---|
| bar[0] Luggage 3.0 lb | 343.0 | 252.0 | **0.735** |
| bar[1] Clothing 7.0 lb | 343.0 | 252.0 | **0.735** |
| bar[2] Documents 8.0 oz | 343.0 | 252.0 | **0.735** |
| bar[3] Electronics 2.0 lb | 343.0 | 252.0 | **0.735** |
| bar[4] Medication 4.5 oz | 343.0 | 252.0 | **0.735** |
| bar[5] Shoes 2.5 lb | 343.0 | 252.0 | **0.735** |
| bar[6] Beach/Activities 12.5 oz | 343.0 | 252.0 | **0.735** |

**375 representative ratio: 0.735 ✓** (0.72–0.78 range)

---

## 10. Measured Ratio — 390px

All 7 bars returned identical measurements:

| Bar | barWidth | handleCx | ratio |
|---|---|---|---|
| bar[0]–bar[6] (all) | 358.0 | 267.0 | **0.746** |

**390 representative ratio: 0.746 ✓** (0.72–0.78 range)

---

## 11. Measured Ratio — 430px

All 7 bars returned identical measurements:

| Bar | barWidth | handleCx | ratio |
|---|---|---|---|
| bar[0]–bar[6] (all) | 398.0 | 307.0 | **0.771** |

**430 representative ratio: 0.771 ✓** (0.72–0.78 range)

---

## 12. Summary — All Ratios in Range

| Viewport | Ratio | In 0.72–0.78 | Handle position |
|---|---|---|---|
| 375px | 0.735 | ✓ | ~3/4 from left |
| 390px | 0.746 | ✓ | ~3/4 from left |
| 430px | 0.771 | ✓ | ~3/4 from left |

All categories at all viewports now return the same ratio — the `minmax(44px, auto)` normalization eliminated the per-weight-string variance present in 027K.

---

## 13. Clothing Result

"Clothing" bar with "7.0 lb" weight: ratio 0.735 / 0.746 / 0.771 at respective viewports. Name readable, dots clearly right of name/subtitle, weight far right. ✓

---

## 14. Toiletries Result

"Toiletries" bar with "1.3 lb" weight: ratio identical to all other bars (normalization working). Toothbrush SVG icon preserved in wedge. ✓

---

## 15. Long-Name Result

"Beach / Activities" (longest category name) with "12.5 oz" (previously the problematic outlier at 0.717 in 027K):

- 375px: 0.735 ✓ (was 0.717 in 027K — fixed)
- 390px: 0.746 ✓ (was 0.729 in 027K)
- 430px: 0.771 ✓ (was 0.756 in 027K)

Name truncates cleanly before the handle column on narrower viewports. No overlap. ✓

---

## 16. Short-Name Result

"Shoes", "Luggage", "Medication" — same ratio as all other bars (0.735 / 0.746 / 0.771). Handle does not drift toward center when name is short because the `minmax(44px, auto)` weight column normalizes the text column width. ✓

---

## 17. Different-Weight-Width Result

**Complete elimination of per-weight variance.** In 027K, "12.5 oz" (7 chars) produced a ratio 0.028 lower than "3.0 lb" (6 chars) at 375px. In 027L, all weight strings display identically because the grid column holds at 44px for any string ≤ 44px wide. The ratio is 0.735 whether the weight is "4.5 oz", "7.0 lb", "12.5 oz", or any string up to ~44px. ✓

---

## 18. Category Icon Accordion Test

`/mobile-functional-v3`: The wedge/icon `<button>` is the sole interactive accordion control — unchanged. No new click handlers on the handle column, gap column, or weight column. Handle column has `aria-hidden="true"` and no `onClick`. ✓

---

## 19. Item Move Protection

Design prototype: Sunscreen SPF 50 expanded row shows "Move: Toiletry Bag ∨" in the 430px screenshot. No item drag dots. Item rows unchanged from 027J/027K. ✓

---

## 20. `/checklist` Result

Not run (audit only). No production files modified. Vite HMR log shows only V3 files updated. ✓

---

## 21. Desktop Result

Not run (audit only). No desktop component files modified. ✓

---

## 22. Tests NOT RUN

| Test | Reason |
|---|---|
| Category touch reorder | DnD library not installed; deferred |
| Production `/checklist` render | Audit-only; no production files changed |
| Desktop layout | Audit-only; no desktop files changed |
| Auth / DB / API | Out of scope |

---

## 23. Unresolved Issues

None. The 027K outlier (ratio 0.717 for "Beach/Activities" at 375px) is resolved. All 7 bars at all 3 viewports now fall within 0.72–0.78.

---

## 24. Rollback

If this change must be reverted:
- In both V3 files, change `'minmax(0, 1fr) 32px 18px minmax(44px, auto)'` back to `'minmax(0, 1fr) 32px 26px auto'`
- This restores the 027K layout (with its known weight-string variance)

---

## 25. USER VERIFICATION = PENDING

---

## 26. Screenshots

| File | Description |
|---|---|
| `027L-screenshot-design-375.jpg` | `/mobile-design-v3` at 375px — handle ~73.5% |
| `027L-screenshot-design-390.jpg` | `/mobile-design-v3` at 390px — handle ~74.6% |
| `027L-screenshot-design-430.jpg` | `/mobile-design-v3` at 430px — handle ~77.1%; Documents visible |
| `027L-screenshot-functional-390.jpg` | `/mobile-functional-v3` at 390px — live data, all categories |

---

## 27. Final Status

```
027L HANDLE CALIBRATION = PASS

375 HANDLE RATIO = 0.735
390 HANDLE RATIO = 0.746
430 HANDLE RATIO = 0.771

ALL RATIOS BETWEEN 0.72 AND 0.78 = YES

CATEGORY NAME OVERLAPS DOTS = NO
ITEM COUNT OVERLAPS DOTS = NO
DOTS OVERLAP WEIGHT = NO
WEIGHT REMAINS FAR RIGHT = PASS

CATEGORY ICON ONLY PRIMARY ACCORDION TRIGGER = PASS
CATEGORY CHEVRON PRESENT = NO

ITEM DRAG DOTS PRESENT = NO
ITEM MOVE PRESERVED = PASS

TOILETRIES TOOTHBRUSH PRESERVED = PASS
HYDRATION WATER DROP PRESERVED = PASS (keyword helper covers it)

CATEGORY TOUCH REORDER FUNCTIONAL = BLOCKED (no DnD library)
NEW DEPENDENCY ADDED = NO

/CHECKLIST CHANGED = NO
DESKTOP CHANGED = NO
DATABASE/API/AUTH CHANGED = NO
REPLIT.MD CHANGED = NO
.AGENTS/MEMORY CHANGED = NO
DEPLOYMENT CHANGED = NO
UNRELATED FILES CHANGED = NO

USER VERIFICATION = PENDING
```
