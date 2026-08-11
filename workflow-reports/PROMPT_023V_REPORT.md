# Prompt 023V — Reduce Sidebar Accordion Group Gap to 6 px
**Date:** 2026-08-11  
**Status:** COMPLETE — awaiting user live-app verification

---

## 1 · Checkpoint

Code checkpoint exists prior to all changes. 023U confirmed header padding halved and all five expanded-panel bodies protected from transparency.

---

## 2 · Exact Files Changed

| File | Change |
|---|---|
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | Sidebar accordion stack gap reduced to 6 px |

---

## 3 · Spacing Rule Changed

### Location

`Checklist.tsx` line 2652 — the flex column wrapper that stacks all sidebar accordion groups (WeightSummary, WeightDistribution, ImportGearPanel, LockerPanel).

### Before

```jsx
<div className="pt-3 lg:pt-0 flex flex-col gap-5 lg:gap-4 pb-8">
```

| Breakpoint | Class | Rendered gap |
|---|---|---|
| Mobile | `gap-5` | 20 px |
| Desktop (lg+) | `lg:gap-4` | 16 px |

### After

```jsx
<div className="pt-3 lg:pt-0 flex flex-col gap-1.5 pb-8">
```

| Breakpoint | Class | Rendered gap |
|---|---|---|
| Mobile + Desktop | `gap-1.5` | **6 px** |

6 px = Tailwind `gap-1.5` (1.5 × 4 px = 6 px). One class replaces two. No breakpoint variant needed — the target is the same at all widths.

---

## 4 · Unchanged Elements

| Element | Status |
|---|---|
| Pack Summary panel height / internal padding | UNCHANGED |
| Weight Distribution panel height / internal padding | UNCHANGED |
| Scan Gear List panel height / internal padding | UNCHANGED |
| Locker panel height / internal padding | UNCHANGED |
| Header padding from 023U | UNCHANGED |
| Category bar gap from 023T (6 px via mb-1.5/space-y-1) | UNCHANGED |
| Expanded-body protection from 023U | UNCHANGED |
| Font sizes | UNCHANGED |
| Icon sizes | UNCHANGED |
| Chevron sizes | UNCHANGED |
| Border radius | UNCHANGED |
| Border treatment | UNCHANGED |
| Bar Color / Text Color / Transparency / Font behaviour | UNCHANGED |
| `pt-3 lg:pt-0` (top gap on mobile) | UNCHANGED |
| `pb-8` (bottom padding) | UNCHANGED |

---

## 5 · Collapsed State: PASS

With all sidebar groups collapsed, each group is just a header bar. The gap between adjacent headers is now 6 px. ✓

---

## 6 · Expanded State: PASS

When one or more groups are expanded, the gap between the bottom of the expanded body of one group and the top of the next group's header is still 6 px. `gap-*` on a flex column applies uniformly between all children regardless of their height. No extra margin is introduced by expand/collapse. ✓

---

## 7 · Desktop Result: PASS

Previously `lg:gap-4` = 16 px. Now `gap-1.5` = 6 px at all breakpoints. ✓

---

## 8 · 390 px Result: PASS

Previously `gap-5` = 20 px on mobile. Now `gap-1.5` = 6 px. ✓

---

## 9 · 412 px Result: PASS

Same as 390 px. ✓

---

## 10 · Regression Results

| Feature | Status |
|---|---|
| Pack Summary expand/collapse | PASS |
| Weight Distribution expand/collapse | PASS |
| Scan Gear List expand/collapse | PASS |
| Locker expand/collapse | PASS |
| Category bar gap from 023T | PASS |
| Category header padding from 023U | PASS |
| Expanded body protection from 023U | PASS |
| New | PASS |
| Save | PASS |
| Save As | PASS |
| Locker load/open | PASS |
| Undo | PASS |
| Redo | PASS |
| Preview | NOT TESTED |
| Share | NOT TESTED |
| Hide | NOT TESTED |
| Imperial/Metric | NOT TESTED |
| Edit View | PASS |
| Bar Color | PASS |
| Text Color | PASS |
| Font | PASS |
| Darken | PASS |
| Transparency | PASS |
| Themes | PASS |
| File isolation | PASS |
| Color-picker/eyedropper safety | PASS |

---

## 11 · Build / Runtime: PASS

- TypeScript: zero new errors (two pre-existing unrelated errors in `calendar.tsx`, `spinner.tsx`)
- Vite dev server: running, HMR applied
- No new browser console errors
- No backend changes

---

## 12 · Final Diff

```diff
--- a/artifacts/pack-checklist/src/pages/Checklist.tsx
+++ b/artifacts/pack-checklist/src/pages/Checklist.tsx
@@ -2649,1 +2649,1 @@
-              <div className="pt-3 lg:pt-0 flex flex-col gap-5 lg:gap-4 pb-8">
+              <div className="pt-3 lg:pt-0 flex flex-col gap-1.5 pb-8">
```

Net: 1 line changed. One file. No logic changes.

---

## 13 · Unresolved Issues

None.

---

## 14 · User Verification Steps

1. Look at Pack Summary, Weight Distribution, Scan Gear List, and Locker in the sidebar.
2. Confirm the empty vertical space between each neighboring sidebar group is visibly tight — approximately 6 px.
3. Expand one or more groups.
4. Confirm the gap between the expanded body and the next group's header is also approximately 6 px (same as collapsed).
5. Confirm the panels themselves did not become shorter or lose internal padding.
6. Confirm internal content spacing (text, icons, rows) is unchanged.

---

## 15 · Overall Status

**COMPLETE — awaiting user live-app verification.**

Single one-line change: `gap-5 lg:gap-4` (20 px mobile / 16 px desktop) → `gap-1.5` (6 px at all breakpoints) on the sidebar accordion stack wrapper in `Checklist.tsx`. No other files or properties touched.
