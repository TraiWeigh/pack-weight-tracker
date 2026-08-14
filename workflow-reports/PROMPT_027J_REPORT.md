# PROMPT 027J — Category-Bar Cleanup
**Report generated:** 2026-08-14  
**Routes affected:** `/mobile-design-v3` · `/mobile-functional-v3`  
**Production routes touched:** none

---

## 1. Prompt Reference

027J — Category-Bar Cleanup. Five targeted changes to both prototype files: Toiletries icon → toothbrush (inline SVG), remove category accordion chevrons, remove item row accordion chevrons, add selected-category weight to right side of bar, reposition six-dot handle to true 50% horizontal center via `position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%)`.

---

## 2. Scope Confirmation

No production files were modified. Work was contained entirely to:
- `artifacts/pack-checklist/src/pages/MobileDesignPrototypeV3.tsx`
- `artifacts/pack-checklist/src/pages/MobileFunctionalV3.tsx`

---

## 3. Pre-Condition: Partial State Inherited from 027J Cut-Off

This prompt continued a mid-session interruption. At start-of-turn, two edits had already been applied to `MobileDesignPrototypeV3.tsx`:
1. Imports cleaned (`ChevronUp` and `Droplets` removed)
2. `ToothbrushIcon` inline SVG component added

All remaining changes were new work in this session.

---

## 4. Change 1 — Toiletries Icon: `Droplets` → Toothbrush SVG

**Rationale:** lucide-react contains no `Toothbrush` component. An inline SVG was created with three strokes (handle `path`, head `Z`-closed diamond, bristle `path`) matching lucide's visual convention (`strokeLinecap: round`, `strokeLinejoin: round`, no fill).

**Design prototype:** `CATEGORIES` array entry for `toiletries` had its `Icon` field set to `Briefcase` as a placeholder (never shown); the `CategoryHeader` component now detects `cat.id === 'toiletries'` and renders `<ToothbrushIcon>` instead of `<cat.Icon>`.

**Functional:** An `isToiletriesCategory(name: string): boolean` helper checks for keywords (`toilet`, `hygiene`, `grooming`, `personal care`, `wash`, `beauty`, `soap`) so the override works for any category named with those words — the demo seed data's "Toiletries" category is matched. The wedge button renders `<ToothbrushIcon>` in place of `<theme.Icon>` when the helper returns true.

---

## 5. Change 2 — Remove Category Accordion Chevrons

**Design prototype:** `CategoryHeader` previously had `{ isOpen: boolean }` prop and rendered `<ChevronUp>` or `<ChevronDown>` in the flex content area. Both the prop and the chevron JSX were removed. Both call sites that passed `isOpen={true}` / `isOpen={false}` were updated.

**Functional:** Same — the `isOpen`-conditional `<ChevronUp>`/`<ChevronDown>` block in the category header content div was removed. Import of `ChevronUp` was also removed (no longer needed). `ChevronDown` is still imported for item detail-row dropdowns.

**Accordion trigger:** The wedge/icon `<button>` remains the sole interactive accordion control in the functional file, unchanged.

---

## 6. Change 3 — Remove Item Row Accordion Chevrons

**Design prototype:** The `ItemRow` function's header div previously ended with a `<ChevronDown>`/`<ChevronUp>` conditional. This was removed. The `Qty` span now closes the row. The detail panel (`item.expanded`) remains unchanged — the prototype is static so expansion state comes from the seed array, not from user interaction.

**Functional:** The `<button>` element wrapping `<ChevronDown>`/`<ChevronUp>` for item expand/collapse was removed. The outer item `<div>` was promoted to `role="button"` with `tabIndex={0}`, `aria-expanded={isExpanded}`, `onClick={() => handleItemToggle(...)}`, and `onKeyDown` for Enter/Space. The checkbox `onClick` and `onKeyDown` gain `e.stopPropagation()` to prevent the row-level expand toggle from firing when only the checkbox is tapped. Checkbox `tabIndex` set to `-1` (row handles tab navigation; checkbox is click/Space-accessible but not a separate tab stop).

---

## 7. Change 4 — Selected-Category Weight on Right Side of Bar

**Design prototype:** Each entry in `CATEGORIES` gained a `selectedWeightOz: number` field with static illustrative values. `CategoryHeader` reads `cat.selectedWeightOz` and formats it as `X.X lb` (when ≥ 16 oz) or `X.X oz`, then renders it as a right-justified `div` with `flexShrink: 0` inside the content area. Zero values are suppressed.

**Functional:** `catTotalOz` was already computed (selected items' total via `calcTotalOz` + `reduce`). It was previously embedded in the subtitle string as `catWeightStr`. The subtitle string variable was removed; `catTotalOz` now drives a right-side `div` rendered when `catTotalOz > 0`, formatted with `formatWeight(catTotalOz, system, 'small') + ' ' + su` so it respects the user's chosen unit system live.

---

## 8. Change 5 — Handle at True 50% Horizontal Center

**Previous layout:** Handle was a `div` inside the flex content area, positioned between the name/subtitle block and the (now-removed) chevron. Because the wedge has a fixed width and the content area is `flex: 1`, the "center" of the content area is not the center of the full bar — the handle shifted left/right depending on category name length.

**New layout (both files):**
```
CategoryHeader container: position: relative
  ├── Wedge button (fixed width, flex: 0)
  ├── Content div (flex: 1) → name left, weight right
  └── Handle div (position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); pointerEvents: none)
```

`left: 50%` is measured from the container's left edge, which spans the full bar (wedge + content). The handle is therefore at the true horizontal midpoint of the visible bar regardless of wedge width, name length, or weight string length. `pointerEvents: none` means it can never block the wedge tap or a weight-side tap.

---

## 9. `CATEGORIES` Array — Updated Fields

| Category | `selectedWeightOz` |
|---|---|
| Luggage | 48.0 (3.0 lb) |
| Clothing | 112.0 (7.0 lb) |
| Toiletries | 20.5 (1.3 lb) |
| Documents | 8.0 oz |
| Electronics | 32.0 (2.0 lb) |
| Medication | 4.5 oz |
| Shoes | 40.0 (2.5 lb) |
| Beach / Activities | 12.5 oz |

Note: `Toiletries.Icon` was set to `Briefcase` as a non-rendered placeholder; the actual wedge icon is always `ToothbrushIcon` when `cat.id === 'toiletries'`.

---

## 10. `isToiletriesCategory` Helper (Functional Only)

```ts
function isToiletriesCategory(name: string): boolean {
  const l = name.toLowerCase();
  return ['toilet', 'hygiene', 'grooming', 'personal care',
          'wash', 'beauty', 'soap'].some(kw => l.includes(kw));
}
```

Placed above the constants block. Does not call `mobileCategoryTheme.ts` (which remains untouched). Works for future user-created categories whose names contain these keywords.

---

## 11. `ToothbrushIcon` SVG Anatomy

```tsx
<svg viewBox="0 0 24 24" fill="none" stroke={color}
  strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
  <path d="M3 21L14 10"/>        {/* handle */}
  <path d="M12 8L16 4L21 9L17 13Z"/>  {/* head */}
  <path d="M14 6L19 11"/>        {/* bristle line */}
</svg>
```

Three paths. No fills. Consistent with lucide-react's visual grammar. Accepts `size`, `color`, and `strokeWidth` props with the same defaults used across the app (`size=26`, `color="rgba(255,255,255,0.93)"`, `strokeWidth=1.5`).

---

## 12. Accessibility

- Category wedge: `aria-expanded`, `aria-label` — unchanged
- Item rows (functional): promoted from `<div>` to `role="button" tabIndex={0} aria-expanded={isExpanded}` with keyboard handler
- Checkbox: `tabIndex={-1}` (row is the focus target; checkbox still responds to Space/Enter via `onKeyDown`)
- Handle: `aria-hidden="true"` on both files
- Toothbrush SVG: `aria-hidden="true"` (decorative)

---

## 13. Handle Positioning — Self-Check

| Scenario | Handle position |
|---|---|
| Short name ("Shoes") | left: 50% of full bar — stable ✓ |
| Long name ("Beach / Activities") | left: 50% of full bar — stable ✓ |
| High weight ("7.0 lb") | left: 50% of full bar — stable ✓ |
| No weight (0 oz) | left: 50% of full bar — stable ✓ |

Because the handle is absolutely positioned against the `position: relative` container that spans the entire bar width, it is immune to content-length variation.

---

## 14. Files Modified

| File | Change summary |
|---|---|
| `src/pages/MobileDesignPrototypeV3.tsx` | Imports cleaned; `ToothbrushIcon` added; `CATEGORIES` + `selectedWeightOz`; `CategoryHeader` rewritten (no chevron, absolute handle, weight right); `ItemRow` chevron removed; 2× call sites updated |
| `src/pages/MobileFunctionalV3.tsx` | `ChevronUp` import removed; `ToothbrushIcon` + `isToiletriesCategory` added; category header rewritten (toothbrush override, no chevron, absolute handle, weight right); item rows promoted to `role="button"` with `stopPropagation` on checkbox; `catWeightStr` removed |

---

## 15. Files NOT Modified

| File | Reason |
|---|---|
| `src/lib/mobileCategoryTheme.ts` | Shared library; override applied at render-time in both prototype files |
| `src/App.tsx` | Route already registered in 027H |
| `src/context/UnitContext.tsx` | Functional file already wraps in `UnitProvider` |
| Any production file | Strict sandbox policy |

---

## 16. Screenshot Evidence

All four screenshots saved to `workflow-reports/`:

1. `027J-screenshot-design-390.jpg` — `/mobile-design-v3` at 390 px: toothbrush wedge visible for Toiletries; no category chevrons; handle dots at center; weight values right-aligned; expanded item rows with Move row visible
2. `027J-screenshot-design-375.jpg` — same route at 375 px: layout stable at narrower width
3. `027J-screenshot-design-430.jpg` — same route at 430 px: Documents category visible below fold; handle stable at longer bar width
4. `027J-screenshot-functional-390.jpg` — `/mobile-functional-v3` at 390 px: live data from demo seed; all category bars show weight; toothbrush in Toiletries wedge; no chevrons; handle centered; units live (oz/lb per UnitContext)

---

## 17. Visual Verification Checklist

| Criterion | Design `/mobile-design-v3` | Functional `/mobile-functional-v3` |
|---|---|---|
| Toothbrush icon in Toiletries wedge | ✅ | ✅ |
| No chevron in any category bar | ✅ | ✅ |
| No chevron in collapsed item rows | ✅ | ✅ |
| Six-dot handle visible at center of bar | ✅ | ✅ |
| Weight displayed right side of category bar | ✅ | ✅ |
| Weight reflects selected items | N/A (static seed) | ✅ |
| Handle stable across long/short names | ✅ | ✅ |
| No production routes affected | ✅ | ✅ |

---

## 18. Deferred / Out of Scope (per 027J spec)

- **Category touch reorder:** handle is visual-only with `pointerEvents: none`; DnD library not installed; wiring deferred to a separate prompt
- **Nav wiring:** bottom-nav tabs remain non-functional in the prototype
- **Unit preference persistence:** not in scope for these prototype routes
- **Proceeding to 027K:** stopped; awaiting next prompt from user

---

## 19. Key Decisions Carried Forward

| Decision | Detail |
|---|---|
| `position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%)` | Authoritative centering method for handle in any future category-bar work |
| `pointerEvents: none` on handle | Required; handle must never block wedge tap or weight tap |
| `isToiletriesCategory()` keyword helper | Preferred over editing shared `mobileCategoryTheme.ts` |
| Checkbox `tabIndex={-1}` in item row | Row is the focus target; checkbox still keyboard-accessible via `onKeyDown` |
| Item row `role="button"` with `stopPropagation` on checkbox | Authoritative pattern for item expand in functional preview |

---

## 20. Regression Checks

- No `ChevronUp` import remains in either file (would cause unused-import lint warning)
- No `isOpen` prop remains on `CategoryHeader` in design prototype (removed from component and both call sites)
- `catWeightStr` variable removed from functional file (no dangling reference)
- `Droplets` import removed from design prototype (no dangling reference)
- `mobileCategoryTheme.ts` not edited — other categories continue to use their existing theme icons

---

## 21. Performance

No new runtime cost. The `isToiletriesCategory` helper is a plain string scan (O(n) tiny); `formatWeight` was already in use per 027H; absolute positioning is a layout-only CSS property with zero JavaScript overhead.

---

## 22. Compatibility

Both files are self-contained prototypes. Neither imports from the other. Both compile cleanly; Vite HMR shows no errors in the latest log entries after the final edits.

---

## 23. Deliverables

| File | Status |
|---|---|
| `workflow-reports/PROMPT_027J_REPORT.md` | ✅ This document |
| `workflow-reports/trailweigh-027J-report.zip` | ✅ (created next step) |
| `workflow-reports/027J-screenshot-design-390.jpg` | ✅ |
| `workflow-reports/027J-screenshot-design-375.jpg` | ✅ |
| `workflow-reports/027J-screenshot-design-430.jpg` | ✅ |
| `workflow-reports/027J-screenshot-functional-390.jpg` | ✅ |

---

## 24. Stop Condition

027J is complete. Agent has stopped. No 027K work has been begun.

---

## 25. Summary

Five targeted changes applied to both `/mobile-design-v3` and `/mobile-functional-v3`:

1. **Toiletries icon** — lucide `Droplets` (and `Heart` from shared theme) replaced by inline three-path SVG toothbrush, applied via `cat.id === 'toiletries'` check (design) and `isToiletriesCategory(name)` keyword helper (functional).
2. **Category chevrons removed** — no `ChevronUp`/`ChevronDown` in any category bar; wedge/icon button is the sole accordion trigger.
3. **Item row chevrons removed** — design: chevron div removed, row is static; functional: chevron `<button>` removed, row promoted to `role="button"` with keyboard handling.
4. **Selected weight right-aligned** — design: static `selectedWeightOz` per category; functional: live `catTotalOz` from `calcTotalOz` reduce, formatted with `formatWeight`/`su` to respect unit system.
5. **Handle at true center** — `position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); pointerEvents: none` against `position: relative` container; handle is immune to name/weight length variation.
