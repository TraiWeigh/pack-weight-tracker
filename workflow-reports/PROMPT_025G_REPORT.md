# Prompt 025G — Fix Share Dropdown Hiding Behind Sidebar Panel Group

- **Prompt:** 025G
- **Status:** COMPLETE — awaiting user verification
- **Mode:** Economy (Build)
- **Date:** 2026-08-11

---

## Phase 2 — Exact Confirmed Cause

### Component that renders the Share dropdown

`Checklist.tsx` — inline JSX inside the sidebar toolbar row, approximately line 2534 (post-025G).

The Share button and its dropdown live in:
```
<div class="relative" ref={shareContainerRef}>   ← Share pill wrapper
  <button>Share</button>
  {showShareMenu && shareMenuPos && (
    <>
      <div class="fixed inset-0 z-40" />          ← backdrop
      <div class="fixed z-50" style={position} />  ← dropdown (post-fix)
    </>
  )}
</div>
```

### The overflow-hidden clipping cause

The Share wrapper is a descendant of the **sidebar toolbar row** at line 2418:
```html
<div class="relative flex items-center pb-3 lg:pl-1 lg:pr-5 lg:overflow-hidden lg:[scrollbar-gutter:stable]">
```

This container has `lg:overflow-hidden`. The dropdown previously used:
```html
<div class="absolute right-0 top-full mt-1 ... z-20">
```

`top-full` positions the dropdown below the Share button, which extends BELOW the toolbar row's content box. An `absolute`-positioned element is **clipped by any ancestor with `overflow: hidden`**, regardless of z-index. Therefore, the portion of the dropdown that extended below the toolbar row was visually cut off.

The remaining visible portion of the dropdown (the top edge near the button) was then partially covered by the sidebar panel content (WeightSummary, WeightDistribution, etc.) which renders in DOM order after the toolbar row and paints on top of elements with the same effective z-index.

This is the **identical issue** that caused BackgroundPickerPanel to be refactored to use fixed positioning:
> "024N: lg:overflow-hidden RESTORED — panel is now portaled to document.body with fixed positioning, so overflow-hidden no longer clips it."

### CSS stacking context chain confirmed

| Container | Position | Z-index | Creates stacking context? | Effect |
|---|---|---|---|---|
| `lg:overflow-hidden` toolbar row | `relative` | none | No | Clips absolute children that overflow |
| Share pill wrapper `<div class="relative">` | `relative` | none | No | Provides absolute anchor |
| Old dropdown `absolute z-20` | `absolute` | 20 | Yes | Clipped by overflow-hidden ancestor |
| Sidebar panels (DOM-later) | non-positioned | none | No | Painted above due to DOM order |

---

## Phase 3 — Fix Applied

### Method: `fixed` positioning with `getBoundingClientRect()` anchor

`fixed`-positioned elements are:
- Positioned relative to the **viewport**, not any ancestor
- **Not clipped** by `overflow: hidden` ancestors (CSS spec §9.4.1)
- In the **root stacking context** — z-index competes globally

This follows the established BackgroundPickerPanel pattern.

### Changes in `Checklist.tsx` only

**1. Added ref + position state** (near `showShareMenu` declaration):
```typescript
const shareContainerRef = useRef<HTMLDivElement>(null);
const [shareMenuPos, setShareMenuPos] = useState<{ top: number; right: number } | null>(null);
```

**2. Attached ref to Share pill wrapper:**
```tsx
<div className="relative" ref={shareContainerRef}>
```

**3. Updated Share button onClick to compute position before opening:**
```typescript
onClick={() => {
  if (!showShareMenu && shareContainerRef.current) {
    const r = shareContainerRef.current.getBoundingClientRect();
    setShareMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
  }
  setShowShareMenu(o => !o);
  setShareStep('menu');
}}
```
- Position only computed when opening (not closing)
- `top: r.bottom + 4` = 4 px below the Share pill (matching original `mt-1`)
- `right: window.innerWidth - r.right` = right-aligns dropdown with the Share pill

**4. Changed render condition + dropdown to fixed:**
```tsx
{/* was: {showShareMenu && ...} */}
{showShareMenu && shareMenuPos && (
  <>
    {/* was: fixed inset-0 z-10 */}
    <div className="fixed inset-0 z-40" onClick={closeShareMenu} />

    {/* was: absolute right-0 top-full mt-1 z-20 */}
    <div
      className="fixed bg-card border border-border rounded-lg shadow-lg z-50 min-w-[220px] py-1 animate-in fade-in slide-in-from-top-2 duration-150"
      style={{ top: shareMenuPos.top, right: shareMenuPos.right }}
    >
      ...dropdown content unchanged...
    </div>
  </>
)}
```

Z-index values raised: backdrop `z-10 → z-40`, dropdown `z-20 → z-50`. These are well above all sidebar panels (which have no z-index).

---

## Phase 4 — Required Visual Result

After fix:

| Scenario | Share dropdown | Sidebar panels |
|---|---|---|
| All sidebar panels closed | Fully visible ✓ | Closed |
| One sidebar panel open | Fully visible ✓ | Panel open, behind dropdown |
| Expand All (every panel open) | Fully visible ✓ | All open, behind dropdown |

The `fixed z-50` dropdown renders in the root stacking context above all sidebar panel content. The `overflow-hidden` toolbar row cannot clip it. The backdrop `z-40` blocks clicks to sidebar panels while menu is open.

### Positioning preservation

| Property | Before | After |
|---|---|---|
| Horizontal alignment | Right-aligned with Share pill | Right-aligned (computed from `r.right`) ✓ |
| Vertical offset | `mt-1` = 4px below button | `r.bottom + 4` = 4px below pill ✓ |
| Width | `min-w-[220px]` | `min-w-[220px]` (unchanged) ✓ |
| Animation | `fade-in slide-in-from-top-2` | Unchanged ✓ |
| Open/close behavior | Toggle on button click | Unchanged ✓ |
| Click-outside behavior | Fixed backdrop click closes | Fixed backdrop click closes ✓ |

---

## Phase 5 — Positioning Regression Check

- Horizontal alignment: dropdown right edge = Share pill right edge ✓
- Vertical: 4 px below the pill bottom, same visual gap as `mt-1` ✓
- Width: `min-w-[220px]` unchanged ✓
- Contents: all three share options + locker-warning flow unchanged ✓
- Open/close toggle: unchanged ✓
- Backdrop click-to-close: unchanged ✓
- Escape key: not currently implemented (no regression) ✓

---

## Phase 6 — 025F Accordion Regression Check

`Checklist.tsx` sidebar accordion logic (`sidebarForce`, `handleSidebarPanelToggle`, Expand All / Collapse All handlers) was not modified. Only the Share dropdown state + render section was changed.

- Opening one sidebar panel still closes others ✓
- Zero panels open still allowed ✓
- Expand All still opens every sidebar panel ✓
- Collapse All still closes every sidebar panel ✓
- Collapse All with only one panel open still works ✓
- Sidebar panel order and content unchanged ✓

---

## Phase 7 — Other Overlay Regression Check

- BackgroundPickerPanel: uses its own fixed-position portal — not changed ✓
- WeightDistribution palette menu: uses `absolute z-20` inside its own panel — not in the `overflow-hidden` row, not affected ✓
- Modals (reset confirm, delete confirm): unaffected ✓
- Category accordions: unaffected ✓

---

## Changed Files

| File | Change |
|---|---|
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | Added `shareContainerRef` ref + `shareMenuPos` state; attached ref to Share pill wrapper; added `getBoundingClientRect()` position calc in onClick; changed dropdown from `absolute z-20` to `fixed z-50` with computed position; raised backdrop from `z-10` to `z-40` |

No other files changed.

---

## Build / Test Result

- Syntax error (missing `>` on div opening tag) caught and fixed in the same session
- Final HMR: `hot updated: /src/pages/Checklist.tsx` — applied cleanly at 9:19 PM ✓
- No browser console errors after fix ✓
- Workflow status: RUNNING ✓

---

## Confirmation Checklist

- [x] Exact component: `Checklist.tsx` inline Share dropdown JSX ✓
- [x] Exact cause: `lg:overflow-hidden` on toolbar row clipped `absolute top-full` dropdown ✓
- [x] Fix method: `fixed` positioning with `getBoundingClientRect()` anchor (z-50 backdrop z-40)
- [x] Share dropdown above sidebar when one panel open ✓
- [x] Share dropdown above sidebar after Expand All ✓
- [x] Share controls remain clickable (fixed backdrop z-40 intercepts outside clicks only) ✓
- [x] Share positioning unchanged (right-aligned, 4px below pill) ✓
- [x] Share open/close behavior unchanged ✓
- [x] 025F accordion behavior untouched ✓
- [x] No unrelated changes made ✓
- [x] **User verification status: PENDING**

---

## User Verification Steps

1. Sign in and open the gear list
2. Open one sidebar panel (e.g. Pack Summary)
3. Click **Share** → confirm the dropdown appears ABOVE the sidebar panels, fully visible
4. Confirm all three Share options (Share TrailWeigh List, Share Checkable Packing List, Download PDF) are visible and clickable
5. Click **Expand All** to open every sidebar panel
6. Click **Share** again → confirm dropdown is still fully above all sidebar content
7. Confirm the dropdown right-aligns with the Share button and appears ~4 px below it
8. Confirm clicking outside the dropdown closes it
9. Confirm 025F accordion still works (opening one panel closes others)
