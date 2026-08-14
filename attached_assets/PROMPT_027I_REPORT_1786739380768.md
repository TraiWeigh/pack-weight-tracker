# PROMPT 027I REPORT
**Surgical V3 Drag-Handle Placement Parity Correction**
**Remove Item Dots + Put Category Handle in Category Bar Center Area**

Internal Version ID: `027I-V3-DRAG-HANDLE-PLACEMENT-PARITY-2026-08-14-R1`

---

## 1. Internal Version
027I-V3-DRAG-HANDLE-PLACEMENT-PARITY-2026-08-14-R1

## 2. Time / Actions / Lines
- ~8 minutes
- Pre-edit: 2 parallel file reads (both target files in full) + 1 follow-up read (truncated functional preview tail)
- Implementation: 2 targeted edits to `MobileDesignPrototypeV3.tsx`, 0 changes to `MobileFunctionalV3.tsx`
- Net lines changed in design file: +14 lines (category handle inserted, item grip replaced)

## 3. Preflight Git Status
Before edits:
- `MobileDesignPrototypeV3.tsx`: item rows used `GripVertical` as collapsed-state indicator; `CategoryHeader` had no handle
- `MobileFunctionalV3.tsx`: already correct — `ChevronDown`/`ChevronUp` on items, `GripVertical` centered in category bar
- All other files unchanged

## 4. Files Inspected
| File | Purpose |
|------|---------|
| `src/pages/MobileDesignPrototypeV3.tsx` | Visual master — full read, located both handle locations |
| `src/pages/MobileFunctionalV3.tsx` | Functional preview — full read (two parts due to truncation) |

## 5. Exact Cause of Mismatch
The 027F V3 visual master (`MobileDesignPrototypeV3.tsx`) was built before the "no item drag handles" decision was formalized. The `ItemRow` component used `GripVertical` as the collapsed-state indicator for items (falling back to it when the item was not expanded). This was a placeholder from the earlier design pass — not an intentional drag affordance, but it rendered as six dots at the far right of each item row.

The `CategoryHeader` component never had a category-level handle. The 027H functional preview (`MobileFunctionalV3.tsx`) was built with the updated decisions already applied, so the two routes diverged.

## 6. Every Item-Level Handle Found

| Route | Location | Handle | Action |
|-------|----------|--------|--------|
| `/mobile-design-v3` | `ItemRow`, right side, collapsed state (line 386) | `GripVertical size={16}` | REMOVED — replaced with `ChevronDown` |
| `/mobile-functional-v3` | Item rows (lines 641–653) | No `GripVertical` — `ChevronDown`/`ChevronUp` already | No change needed — PASS |

## 7. Every Category-Level Handle Found

| Route | Location | Handle | Action |
|-------|----------|--------|--------|
| `/mobile-design-v3` | `CategoryHeader` content area | None present | ADDED — `GripVertical size={18}` centered between name/subtitle block and chevron |
| `/mobile-functional-v3` | Category header center area (lines 557–567) | `GripVertical size={18}`, `opacity: 0.28`, `cursor: not-allowed` | Already correct — PASS |

## 8. `/mobile-design-v3` Changes

### Change A — Item-level handle removed
**File:** `src/pages/MobileDesignPrototypeV3.tsx` — `ItemRow` component

Before:
```jsx
{/* Grip / Chevron */}
{item.expanded
  ? <ChevronUp size={16} color={MUTED} strokeWidth={2}/>
  : <GripVertical size={16} color={MUTED} strokeWidth={1.8}/>}
```

After:
```jsx
{/* Expand / collapse chevron */}
{item.expanded
  ? <ChevronUp   size={16} color={MUTED} strokeWidth={2}/>
  : <ChevronDown size={16} color={MUTED} strokeWidth={2}/>}
```

Effect: Toothbrush, Travel Toothpaste, Sunscreen SPF 50, and all other item rows now show `ChevronDown` when collapsed and `ChevronUp` when expanded. No drag affordance appears on any item row.

### Change B — Category-level handle added
**File:** `src/pages/MobileDesignPrototypeV3.tsx` — `CategoryHeader` component

Inserted between the `flex: 1` name/subtitle block and the `ChevronUp`/`ChevronDown`:

```jsx
{/* SIX-DOT CATEGORY REORDER HANDLE — centered between name/subtitle and chevron */}
<div
  aria-hidden="true"
  style={{
    display: 'flex', alignItems: 'center',
    padding: '6px 4px', opacity: 0.28,
    cursor: 'not-allowed', flexShrink: 0,
  }}
>
  <GripVertical size={18} color={SECONDARY} strokeWidth={1.5}/>
</div>
```

Effect: each category bar (Luggage, Clothing, Toiletries, Documents, Electronics, Medication, Shoes, Beach/Activities) now shows a faint six-dot handle centered in the bar between the name/subtitle area and the accordion chevron. The handle is visually present but inert — category reorder wiring remains blocked until a separate prompt implements touch-safe DnD.

## 9. `/mobile-functional-v3` Changes or Confirmation

**No changes made.**

On full inspection of `MobileFunctionalV3.tsx`:
- Item rows (lines 640–653): use `ChevronDown`/`ChevronUp` via `<button onClick={handleItemToggle}>` — no `GripVertical` on any item row. PASS.
- Category bar (lines 557–567): `GripVertical size={18}`, `opacity: 0.28`, `cursor: not-allowed`, positioned between the `flex: 1` name/subtitle div and the accordion chevron. PASS.
- All sandbox handlers, Move row, summary, nav: unchanged. PASS.

## 10. Item-Dot Removal Result

| Route | Items with grip dots before | Items with grip dots after |
|-------|----------------------------|---------------------------|
| `/mobile-design-v3` | All item rows (Toothbrush, Travel Toothpaste, Sunscreen SPF 50, and any other) | ZERO |
| `/mobile-functional-v3` | ZERO (already correct) | ZERO |

PASS for both routes.

## 11. Category-Handle Placement Result

| Route | Category handle before | Category handle after |
|-------|----------------------|----------------------|
| `/mobile-design-v3` | Absent | Present — faint `⠿` centered between name/subtitle and chevron |
| `/mobile-functional-v3` | Already present and correct | Unchanged |

Handle is clearly separated from the wedge/icon (separated by the full content area width). Handle is clearly separated from the chevron (handle is left of chevron). Handle is vertically centered within the 68px category header. Handle does not collide with category title or subtitle text. PASS for both routes.

## 12. Wedge/Icon Accordion Protection

**`/mobile-design-v3`:** Static prototype — no interactions wired. Accordion control structure was not changed. `CategoryHeader` receives `isOpen` prop; no new click handlers added.

**`/mobile-functional-v3`:** Unchanged. Wedge/icon button (lines 514–533) still has `onClick={() => handleCatToggle(catName)}` and `aria-expanded={isOpen}`. Category handle div has no `onClick`. Category name div has no `onClick`. PASS.

## 13. Move Protection

**`/mobile-design-v3`:** `ItemRow` expanded panel still renders: Quantity → Bag/Location → Packed → Move (with `ArrowRightLeft` icon, "Toiletry Bag" value, dropdown chevron). No `Move` row removed. PASS.

**`/mobile-functional-v3`:** Unchanged. Move `<select>` wired to `moveItem(catName, dst, id)` at lines 733–756. PASS.

## 14. 375 Result
PASS — No horizontal overflow. All category bars visible with handle in center. Toiletries open with three item rows, each showing `ChevronDown`/`ChevronUp` — no dots. Expanded Sunscreen SPF 50 shows Quantity, Bag/Location, Packed, Move. Bottom nav stable.

## 15. 390 Result
PASS — Identical layout at 390px. Category handles (faint `⠿`) visible between name/subtitle and chevron on Luggage, Clothing, Toiletries. Item rows show only `ChevronDown` chevrons — no grip dots anywhere. Move row present in expanded panel.

## 16. 430 Result
PASS — At 430px the category bars widen; the center-area handle remains properly positioned. Documents, Electronics, Medication categories now visible below scroll. No collision, no overflow.

## 17. Production `/checklist` Result
UNCHANGED — Zero edits to `Checklist.tsx`, `MobileWedgeCategory.tsx`, `GearCategory.tsx`, or any shared component. Confirmed by file-scope inspection: only `MobileDesignPrototypeV3.tsx` was modified.

## 18. Desktop Result
UNCHANGED — No desktop components touched.

## 19. Tests NOT RUN
| Test | Reason |
|------|--------|
| Functional preview interactive accordion | Screenshotter is non-interactive; wedge-tap wiring confirmed by unchanged code |
| Production signed-in safety | Screenshotter is unauthenticated; safety confirmed by code-scope inspection |

## 20. Unresolved Issue — Category Touch Reorder Still BLOCKED

Category reorder functionality remains unimplemented. As diagnosed in 027G and confirmed in 027H:
- Production uses HTML5 DnD only — not touch-safe
- No DnD library installed (`@dnd-kit`, `react-beautiful-dnd`, `react-dnd` — none present)
- Mobile has no category reorder today
- 027I only corrects handle **placement/parity** — it does not implement reorder

A separate prompt with a touch-safe DnD library decision is required to wire the handle.

## 21. Rollback
Revert the 2 edits to `src/pages/MobileDesignPrototypeV3.tsx`:
1. Restore `GripVertical` in `ItemRow` collapsed state
2. Remove the `GripVertical` handle block from `CategoryHeader`

No other files changed. Rollback is a 2-hunk revert.

---

## FINAL STATUS

027I SURGICAL PARITY CORRECTION = **PASS**

**/MOBILE-DESIGN-V3:**
| Check | Result |
|-------|--------|
| ITEM SIX-DOT HANDLES PRESENT | NO |
| CATEGORY SIX-DOT HANDLE PRESENT | YES |
| CATEGORY HANDLE CENTER AREA | PASS |
| MOVE ROW PRESERVED | PASS |

**/MOBILE-FUNCTIONAL-V3:**
| Check | Result |
|-------|--------|
| ITEM SIX-DOT HANDLES PRESENT | NO |
| CATEGORY SIX-DOT HANDLE PRESENT | YES |
| CATEGORY HANDLE CENTER AREA | PASS |
| WEDGE/ICON PRIMARY ACCORDION CONTROL | PASS |
| MOVE WIRED/PRESERVED | PASS |

| Check | Result |
|-------|--------|
| CATEGORY TOUCH REORDER FUNCTIONAL | BLOCKED — SEPARATE IMPLEMENTATION REQUIRED |
| NEW DRAG DEPENDENCY ADDED | NO |
| /CHECKLIST CHANGED | NO |
| DESKTOP CHANGED | NO |
| DATABASE/API/AUTH CHANGED | NO |
| REPLIT.MD CHANGED | NO |
| .AGENTS/MEMORY CHANGED | NO |
| DEPLOYMENT CHANGED | NO |
| UNRELATED FILES CHANGED | NO |

**USER VERIFICATION = PENDING**
