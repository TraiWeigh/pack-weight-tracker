# Prompt 018C — Align Active File Name Pill to Top Control Row

---

## Identification

| Field | Value |
|-------|-------|
| **Prompt ID** | 018C |
| **Prompt title** | Align Active File Name Pill to Top Control Row (vertical alignment correction to 018B) |
| **Date** | 2026-08-07 |
| **Starting state** | 018B = PARTIAL — pill appearance correct, horizontal centering correct, but pill sits too high — not on the same vertical centerline as Hide/Preview/Imperial/Metric |
| **Purpose** | Fix vertical alignment only. No changes to pill appearance, horizontal centering, active-file logic, theme colors, or save behavior. |

---

## Root Cause — Exact Analysis

### Container structure

The pills-row container (outer) has:
```
className="pt-8 pb-3 flex items-center lg:pr-3 flex-shrink-0 relative"
```

- `pt-8` = 2rem = 32px top padding
- `pb-3` = 0.75rem = 12px bottom padding
- `flex items-center` = centers flex children vertically within the **content area** (after padding)

### How flex buttons are positioned

The flex content area starts at 32px from the container top and ends at `container_height − 12px`. Button height ≈ 28px (text-xs + py-1.5 × 2). `flex items-center` places button centers at:

```
32px + (28px / 2) = 32px + 14px = 46px from container top
```

### How the old absolute pill was positioned (018B)

```
className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
```

Container total height = 32px + 28px + 12px = **72px**.  
`top-1/2` = 72px / 2 = **36px from container top**.

### The gap

Pill center: 36px. Button center: 46px. **Difference: 10px** — pill was 10px too high, exactly matching the user's report.

### Why the asymmetric padding causes this

`top-1/2` references 50% of the full padded height. `flex items-center` references 50% of the content area (after padding). These are only equal when `pt === pb`. Since `pt-8 ≠ pb-3`, they diverge.

---

## Fix

Replace the absolute positioning approach with an `inset-0` overlay that carries the same padding as the outer container:

### Before (018B wrapper)
```tsx
<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
```

### After (018C wrapper)
```tsx
<div className="absolute inset-0 pt-8 pb-3 flex items-center justify-center pointer-events-none">
```

### Why this works — geometry

- `absolute inset-0`: overlay fills the exact dimensions of the positioned ancestor (the pills-row container). Its top/bottom edges are flush with the container's top/bottom edges.
- `pt-8 pb-3` on the overlay: creates an identical content area to the outer container (32px top padding, 12px bottom).
- `flex items-center` on the overlay: centers the span at 32px + 14px = **46px from top** — exactly matching the flex buttons. ✓
- `justify-center`: centers the span horizontally over the full width of the left checklist column (the pills-row spans the full 1fr column). ✓

The span's center and Hide's center now share the same Y coordinate by construction — they both use `items-center` within content areas bounded by identical padding values.

### Horizontal centering unchanged

`justify-center` on the `inset-0` overlay produces identical horizontal placement to the old `left-1/2 -translate-x-1/2` approach. The overlay spans the full pills-row width (= left checklist column, 1fr in `lg:grid-cols-[1fr_365px]`), so `justify-center` centers the pill over the left column. ✓

---

## Files Changed

| File | Change |
|------|--------|
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | Wrapper div className: one line |
| `artifacts/pack-checklist/src/hooks/activeFileName018.test.mjs` | Test 14 updated for 018C structure |
| `artifacts/pack-checklist/src/hooks/activeFileName018A.test.mjs` | Test 4 updated for 018C structure |
| `artifacts/pack-checklist/src/hooks/activeFileName018B.test.mjs` | Test 18 updated for 018C structure |
| `artifacts/pack-checklist/src/hooks/activeFileName018C.test.mjs` | Created — 29 new tests |
| `package.json` | Added `activeFileName018C.test.mjs` to `test:importer` chain |

---

## Files NOT Changed

| File / System | Status |
|---------------|--------|
| Span className (018B pill appearance — bg-muted, rounded-lg, px-3, py-1.5, text-xs, font-semibold, text-foreground) | ✅ Untouched |
| Outer container className (pt-8 pb-3 flex items-center lg:pr-3 flex-shrink-0 relative) | ✅ Untouched |
| Active file identity logic (`activeLockerFile` state, sessionStorage sync) | ✅ Untouched |
| `commitSaveNew` / `commitSaveReplace` toasts | ✅ Untouched |
| Hide, Preview, UnitToggle JSX | ✅ Untouched |
| `lg:grid-cols-[1fr_365px]` sidebar layout | ✅ Untouched |
| BackgroundPicker.tsx (017E shaking fix) | ✅ Untouched |
| importGear.ts / scanGear.ts / API server (017F) | ✅ Untouched |

---

## Complete Diff — Checklist.tsx

```diff
-{/* Active file name — centered over the left checklist column.
-    Absolutely positioned so it never pushes Open/Close or Hide/Preview/Imperial/Metric. */}
+{/* Active file name — centered over the left checklist column.
+    Uses inset-0 + matching pt-8 pb-3 so flex items-center references the same
+    content area as the outer container, putting the pill on the exact same
+    vertical centerline as Hide / Preview / Imperial / Metric. */}
 {activeLockerFile && (
-  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
+  <div className="absolute inset-0 pt-8 pb-3 flex items-center justify-center pointer-events-none">
     <span
       aria-label={`Active file: ${activeLockerFile.name}`}
       title={activeLockerFile.name}
       className="flex items-center bg-muted rounded-lg px-3 py-1.5 text-xs font-semibold text-foreground max-w-[10rem] truncate select-none"
     >
       {activeLockerFile.name}
     </span>
   </div>
 )}
```

Span className: **unchanged from 018B**.

---

## Before / After Measurements

| Measurement | Before (018B) | After (018C) |
|-------------|---------------|--------------|
| Container height (pt-8 + ~28px + pb-3) | ~72px | ~72px (unchanged) |
| Pill vertical center (`top-1/2`) | 36px from top | — |
| Pill vertical center (inset-0 + pt-8 + items-center) | — | 46px from top |
| Button vertical center (flex items-center, content at 32–60px) | 46px from top | 46px from top |
| Vertical offset | **10px too high** | **0px — aligned** |

---

## Automated Test Results

**Command:** `pnpm test:importer`

| Suite | Tests | Result |
|-------|-------|--------|
| `importGear.test.mjs` | 219 | ✅ PASS |
| `importGear.pdf.test.mjs` | 54 | ✅ PASS |
| `importGear.pdf.api.test.mjs` | 53 | ✅ PASS |
| `scanGear.test.mjs` | 47 | ✅ PASS |
| `categoryAliases.test.mjs` | 77 | ✅ PASS |
| `usePackData.test.mjs` | 64 | ✅ PASS |
| `moveItem.test.mjs` | 47 | ✅ PASS |
| `pieColor.test.mjs` | 41 | ✅ PASS |
| `bgCollections.test.mjs` | — | ✅ PASS |
| `bgCollections016A.test.mjs` | — | ✅ PASS |
| `bgPhotoStore016B.test.mjs` | — | ✅ PASS |
| `controls017.test.mjs` | 24 | ✅ PASS |
| `landscapeHover017B.test.mjs` | 24 | ✅ PASS |
| `landscapeActiveBackground017C.test.mjs` | 22 | ✅ PASS |
| `landscapeShake017D.test.mjs` | 26 | ✅ PASS |
| `landscapeShake017E.test.mjs` | 38 | ✅ PASS |
| `activeFileName018.test.mjs` | 20 | ✅ PASS |
| `activeFileName018A.test.mjs` | 20 | ✅ PASS |
| `activeFileName018B.test.mjs` | 30 | ✅ PASS |
| `activeFileName018C.test.mjs` | 29 | ✅ PASS |

**Total passed: 925 / Total failed: 0 / Exit code: 0**  
**New tests in 018C: 29** (Tests 1–29 in `activeFileName018C.test.mjs`)  
**Tests updated for 018C: 3** (018.T14, 018A.T4, 018B.T18 — old translate checks replaced with inset-0 checks)

> ⚠️ Automated tests verify that the correct classes are present, the old translate classes are absent, the outer container padding is unchanged, and the span appearance is preserved. They cannot prove that the rendered vertical centerline of the pill exactly matches that of Hide — that requires the user's fresh-preview acceptance test.

---

## Rendered Testing Performed

| Check | Result |
|-------|--------|
| Vite HMR applied Checklist.tsx change cleanly — no compile errors | ✅ PASS |
| Browser console — no errors after change | ✅ PASS |
| Screenshot taken — app loads on landing page (screenshots/018C-landing.jpg) | ✅ PASS |
| Pill vertical alignment in checklist view | ⏳ Requires signed-in session — user fresh-preview test |

---

## Acceptance Checklist

| Requirement | Test | Status |
|-------------|------|--------|
| `absolute inset-0` on wrapper | 018C.1 | ✅ PASS |
| `pt-8 pb-3` on wrapper (padding reference match) | 018C.2 | ✅ PASS |
| `flex items-center` on wrapper | 018C.3 | ✅ PASS |
| `justify-center` on wrapper | 018C.4 | ✅ PASS |
| `top-1/2` removed | 018C.5 | ✅ PASS |
| `-translate-y-1/2` removed | 018C.6 | ✅ PASS |
| `left-1/2` removed | 018C.7 | ✅ PASS |
| `-translate-x-1/2` removed | 018C.8 | ✅ PASS |
| Outer container `pt-8 pb-3` unchanged | 018C.9 | ✅ PASS |
| Outer container `flex items-center` unchanged | 018C.10 | ✅ PASS |
| Outer container `relative` unchanged | 018C.11 | ✅ PASS |
| `pointer-events-none` on wrapper | 018C.12 | ✅ PASS |
| Span `bg-muted` (018B appearance) | 018C.13 | ✅ PASS |
| Span `rounded-lg` | 018C.14 | ✅ PASS |
| Span `px-3 py-1.5` | 018C.15 | ✅ PASS |
| Span `text-xs font-semibold` | 018C.16 | ✅ PASS |
| Span `flex items-center` | 018C.17 | ✅ PASS |
| Span `text-foreground` | 018C.18 | ✅ PASS |
| No `text-muted-foreground` / `text-foreground/60` | 018C.19 | ✅ PASS |
| `select-none` | 018C.20 | ✅ PASS |
| `max-w-[` and `truncate` | 018C.21 | ✅ PASS |
| No `hover:` classes | 018C.22 | ✅ PASS |
| `aria-label` intact | 018C.23 | ✅ PASS |
| `title` attribute intact | 018C.24 | ✅ PASS |
| `activeLockerFile.name` rendered | 018C.25 | ✅ PASS |
| Pill is sibling before right group | 018C.26 | ✅ PASS |
| Pill NOT inside right control group | 018C.27 | ✅ PASS |
| Hide → Preview → UnitToggle order | 018C.28 | ✅ PASS |
| Save toast `Saved "${name}"` | 018C.29 | ✅ PASS |
| All 925 tests pass | All suites | ✅ PASS |
| **Pill vertical center matches Hide/Preview centerline exactly** | Human | ⏳ NOT TESTED |
| **Pill horizontal center unchanged over left checklist column** | Human | ⏳ NOT TESTED |
| **Pill appearance (shape, color) unchanged from 018B** | Human | ⏳ NOT TESTED |
| **Dark mode: white text** | Human | ⏳ NOT TESTED |
| **Light mode: black text** | Human | ⏳ NOT TESTED |
| **Save confirmation `Saved "[name]"` correct** | Human | ⏳ NOT TESTED |

---

## Unresolved Issues

None. The geometry is correct by construction: both the overlay and the outer container use identical `pt-8 pb-3`, so `flex items-center` in both references the same content area.

---

## What Requires User Testing

Per testing protocol: app closed while Replit worked; one fresh preview tab opened only after completion.

**✅ Prompt 018C implementation is complete.**

Please test in a fresh preview (signed in, with a saved file active):
1. **Same horizontal line** — filename pill's vertical center exactly matches Hide, Preview, Imperial, Metric — not above or below, same line
2. **Centered over left column** — pill still floats centered over the checklist/category area, not centered on the full viewport
3. **Pill shape unchanged** — rounded chip with background, matching Hide's silhouette
4. **Hide → Preview → Imperial → Metric** — unchanged, filename not between them
5. **Dark mode** → white text; **light mode** → black text; switch updates live
6. **Save** → `Saved "[name]"` toast; **Save As** → pill immediately updates
7. **Long filename** → truncates, no overflow, no layout disruption
8. **Mobile** → readable, no overlap, no horizontal scroll

---

## Master History Record

| Prompt | Result |
|--------|--------|
| 017B / 017C / 017D | Failed user test |
| 017E | ✅ USER-TESTED PASS (background/shaking fix) |
| 017F | ✅ USER-TESTED PASS (Scan Gear List importer) |
| 018 | PARTIAL — filename visible but wrong position + wrong color |
| 018A | PARTIAL — filename centered but not pill-shaped, wrong vertical alignment |
| 018B | PARTIAL — pill shaped correctly, still too high vertically |
| 018C | NOT USER-VERIFIED — pending user's fresh post-completion test |
