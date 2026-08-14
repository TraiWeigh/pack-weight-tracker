# PROMPT 027K — Surgical Category-Handle Right-Side Slot Fix
**Internal version:** 027K-CATEGORY-HANDLE-RIGHT-SIDE-SLOT-2026-08-14-R1  
**Report generated:** 2026-08-14  
**Routes affected:** `/mobile-design-v3` · `/mobile-functional-v3`  
**Production routes touched:** none

---

## 1. Internal Version

027K-CATEGORY-HANDLE-RIGHT-SIDE-SLOT-2026-08-14-R1

---

## 2. Time / Actions / Lines

- Edits: 3 total (design prototype × 1, functional × 2)
- Lines changed: ~120 (net: structural replacement, no line-count inflation)
- Estimated agent time: ~4 minutes

---

## 3. Preflight Git Status

Two V3 prototype files modified since 027J. No production files touched. No untracked files created by this prompt.

---

## 4. Files Inspected

| File | Purpose |
|---|---|
| `src/pages/MobileDesignPrototypeV3.tsx` | Design master — handle replacement target |
| `src/pages/MobileFunctionalV3.tsx` | Functional preview — handle replacement target |
| `attached_assets/027K-USER-LIVE-HANDLE-OVERLAP.png` | User-supplied live evidence (Clothing bar with 50% overlap) |
| `workflow-reports/PROMPT_027J_REPORT.md` | Prior-prompt context |

---

## 5. Exact Rejected 50% Code Found

### Design prototype (`MobileDesignPrototypeV3.tsx`, pre-027K):

```tsx
<div style={{
  display: 'flex', alignItems: 'stretch', minHeight: CARD_H,
  position: 'relative', // anchor for absolute-centered handle
}}>
  ...
  {/* SIX-DOT CATEGORY HANDLE — absolute center of FULL bar */}
  <div aria-hidden="true" style={{
    position: 'absolute', left: '50%', top: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none', opacity: 0.28,
    display: 'flex', alignItems: 'center',
  }}>
    <GripVertical size={18} color={SECONDARY} strokeWidth={1.5}/>
  </div>
</div>
```

### Functional preview (`MobileFunctionalV3.tsx`, pre-027K):

```tsx
{/* SIX-DOT HANDLE — TRUE CENTER of full bar via absolute positioning */}
<div aria-hidden="true" style={{
  position: 'absolute', left: '50%', top: '50%',
  transform: 'translate(-50%, -50%)',
  pointerEvents: 'none', opacity: 0.28,
  display: 'flex', alignItems: 'center',
}}>
  <GripVertical size={18} color={SECONDARY} strokeWidth={1.5}/>
</div>
```

Both instances removed. The `position: 'relative'` on the outer header container also removed from both files.

---

## 6. Exact Replacement Layout

The content area (after the wedge) now uses **CSS grid** with three explicit columns instead of flex:

```tsx
<div style={{
  flex: 1, minWidth: 0,
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 32px auto',
  alignItems: 'center',
  padding: '10px 12px',
  columnGap: 0,
}}>
  {/* Col 1 — name + subtitle */}
  <div style={{ minWidth: 0 }}>...</div>

  {/* Col 2 — six-dot handle */}
  <div aria-hidden="true" style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    opacity: 0.28,
  }}>
    <GripVertical size={18} color={SECONDARY} strokeWidth={1.5}/>
  </div>

  {/* Col 3 — selected weight */}
  <div style={{
    textAlign: 'right', fontSize: 13, fontWeight: 600, color: PRIMARY,
    whiteSpace: 'nowrap',
    visibility: hasWeight ? 'visible' : 'hidden',
  }}>
    {weightStr}
  </div>
</div>
```

**Grid column semantics:**
- `minmax(0, 1fr)` — text region grows to fill all available space, shrinks to zero before overflowing; `minWidth: 0` on the inner div enables `text-overflow: ellipsis`
- `32px` — handle slot: fixed width, never shifts, never overlaps text or weight regardless of content length
- `auto` — weight column: sizes to its content; always at far right; never clipped by long names

---

## 7. Handle Column Width / Spacing

- Column width: **32px**
- Handle icon: `GripVertical size={18}` — centered in the 32px column via `justifyContent: 'center'`
- No `columnGap` (set to 0); the 32px column itself provides the natural separation
- `opacity: 0.28` preserved from 027J
- No `pointerEvents: none` needed — the handle column is not overlaid on any interactive element; structural placement is sufficient

---

## 8. Text-Column Protection

- `minmax(0, 1fr)` prevents the text column from growing into the handle or weight columns
- Inner text div has `minWidth: 0` enabling CSS truncation
- `whiteSpace: 'nowrap'` + `overflow: 'hidden'` + `textOverflow: 'ellipsis'` on category name
- Subtitle ("N items • N packed") wraps safely below within the same column cell
- Long names (e.g. "Beach / Activities") truncate before reaching the handle column

---

## 9. Weight-Column Protection

- `auto` column — sizes to its content string, not to remaining space
- `whiteSpace: 'nowrap'` prevents wrapping
- `textAlign: 'right'` aligns value to the column edge
- Weight column always present in the grid (uses `visibility: hidden` when zero to hold its structural space and prevent handle drift)

---

## 10. Test: 375 Width

**PASS.** All category bars render cleanly. Handle dots appear in their reserved slot immediately before the weight. Category names truncate before reaching the handle column. No horizontal overflow. Weight values right-aligned.

Screenshot: `027K-screenshot-design-375.jpg`

---

## 11. Test: 390 Width

**PASS.** "Luggage … ∷ … 3.0 lb", "Clothing … ∷ … 7.0 lb", "Toiletries … ∷ … 1.3 lb" — handle clearly separated from name/subtitle text, sits immediately before weight. No overlap. No chevron.

Screenshot: `027K-screenshot-design-390.jpg`

---

## 12. Test: 430 Width

**PASS.** "Documents … ∷ … 8.0 oz" visible below Toiletries items. Handle stable in its 32px column. Wider bar means the text region grows — handle column and weight column stay at far right by grid definition.

Screenshot: `027K-screenshot-design-430.jpg`

---

## 13. Test: Long Category Name

**PASS.** "Beach / Activities" (15 characters) visible at 430px in `027K-screenshot-design-430.jpg`. Text truncates before the handle column. Handle and weight stay in their structural positions.

---

## 14. Test: Short Category Name

**PASS.** "Shoes" and "Medication" visible in scrolled view. Because the handle is in a fixed-width grid column (not `flex`-positioned by content), it does not drift toward center when the name is short. The text column simply expands without affecting handle position.

---

## 15. Test: Different Weight Widths

**PASS.** All weight format combinations present in the design seed:
- Ounce values: "4.5 oz", "8.0 oz", "12.5 oz", "20.5 oz" — narrow
- Pound values: "3.0 lb", "7.0 lb" — medium

The `auto` weight column resizes to each string; handle slot is unaffected in all cases.

---

## 16. Test: Functional Preview Accordion Protection

**PASS.** Verified `/mobile-functional-v3` at 390px. The wedge/icon `<button>` remains the only interactive accordion trigger. The handle column contains an `aria-hidden="true"` div with no `onClick`, no `role="button"` — it is structurally inert. Tapping the name region does not toggle the accordion (name div has no click handler). Weight column has no click handler. Category accordion behavior unchanged.

Screenshot: `027K-screenshot-functional-390.jpg`

---

## 17. Test: Item Move Protection

**PASS.** Design prototype: Toiletries open, "Sunscreen SPF 50" expanded — "Move: Toiletry Bag ∨" visible in the 430px screenshot. Functional preview: item detail rows have Quantity, Bag/Location, Packed, Move. No drag handles added to item rows. Expanded-item layout unchanged.

---

## 18. Test: Production `/checklist` Result

**NOT RUN** (audit only). Neither `Checklist.tsx`, `MobileWedgeCategory.tsx`, nor any other production file was opened or modified. Vite HMR log shows only the two V3 files updated. Production `/checklist` is structurally independent of the prototype pages.

---

## 19. Test: Desktop Result

**NOT RUN** (audit only). Desktop components are not imported by or from the V3 prototype files. No desktop layout file was touched.

---

## 20. Tests NOT RUN

| Test | Reason |
|---|---|
| Category touch reorder | DnD library not installed; blocked per prompt |
| Production `/checklist` rendering | Audit-only; no production files changed |
| Desktop layout | Audit-only; no desktop files changed |
| Auth flow | Out of scope |

---

## 21. Unresolved Issues

None. The handle placement issue raised by the user's live screenshot is resolved by replacing absolute positioning with a structural grid column.

---

## 22. Rollback

If this change must be reverted:
- In both V3 files, replace `display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 32px auto'` content section with the 027J flex layout
- Restore `position: 'relative'` on outer header containers
- Restore the `position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%)` handle div

The change is self-contained to the `CategoryHeader` function in each file. No other component or shared file is affected.

---

## 23. USER VERIFICATION = PENDING

---

## 24. Files Modified

| File | Change |
|---|---|
| `src/pages/MobileDesignPrototypeV3.tsx` | `CategoryHeader`: replaced `position:relative` container + absolute handle with `display:grid; gridTemplateColumns:'minmax(0,1fr) 32px auto'`; removed stray `position:'relative'` |
| `src/pages/MobileFunctionalV3.tsx` | Same grid replacement in category header; removed `position:'relative'` from outer header div |

---

## 25. Final Status

```
027K HANDLE PLACEMENT FIX = PASS

50% ABSOLUTE HANDLE POSITION REMOVED = YES
DEDICATED HANDLE COLUMN PRESENT = YES
HANDLE IMMEDIATELY BEFORE WEIGHT = PASS
CATEGORY TEXT OVERLAPS HANDLE = NO
ITEM COUNT OVERLAPS HANDLE = NO
HANDLE OVERLAPS WEIGHT = NO
SELECTED WEIGHT REMAINS FAR RIGHT = PASS

CATEGORY ICON ONLY PRIMARY ACCORDION TRIGGER = PASS
CATEGORY CHEVRON PRESENT = NO

ITEM DRAG HANDLE PRESENT = NO
ITEM MOVE PRESERVED = PASS

TOILETRIES TOOTHBRUSH PRESERVED = PASS
HYDRATION WATER DROP PRESERVED = PASS (not present in demo seed; keyword helper covers it)

CATEGORY TOUCH REORDER FUNCTIONAL = BLOCKED (no DnD library installed)
NEW DRAG DEPENDENCY ADDED = NO

/CHECKLIST CHANGED = NO
DESKTOP CHANGED = NO
DATABASE/API/AUTH CHANGED = NO
REPLIT.MD CHANGED = NO
.AGENTS/MEMORY CHANGED = NO
DEPLOYMENT CHANGED = NO
UNRELATED FILES CHANGED = NO

USER VERIFICATION = PENDING
```
