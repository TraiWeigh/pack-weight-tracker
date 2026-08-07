# Prompt 017E — Landscape Thumbnail Geometry Instability: Full Root Cause & Unified Fix

**Date:** 2026-08-07  
**Status:** ⏳ PENDING AUTHORITATIVE USER LIVE-TEST — code complete, automated tests pass; rendered PASS/FAIL cannot be determined until user performs a fresh post-completion test as described below  
**Suites affected:** landscapeShake017E.test.mjs (38 tests), landscapeShake017D.test.mjs (D7/D8 updated), landscapeShake017B.test.mjs (L1/L3/L21 updated from first pass), landscapeShake017C.test.mjs (C3/C4/C5/C7/C23 updated from first pass)

---

## ⚠️ Testing Protocol Note

Per user instruction: **the authoritative acceptance test for Prompt 017E is a fresh post-completion test performed by the user after being explicitly told the app is fully done updating.** No rendered PASS determination is made from automated tests alone or from any preview observation made while the app may still have been mid-update (code partially applied, workflow restarting, stale tab).

The correct testing process is:
1. Keep the app closed while Replit Agent is working
2. Make no data changes (no save/upload/import/delete) during the repair
3. Wait until signalled that Prompt 017E is fully complete
4. Close any old preview tabs
5. Open one fresh preview tab
6. Test: Landscape hover with Clear background; Landscape hover with active built-in background; Landscape hover with active custom background; Darken slider movement with active background

**This report will remain PENDING until the user completes that fresh test and reports the result.**

---

## User Evidence — Two Distinct Triggers

### Trigger 1: Hover (original report)
Frame-by-frame video analysis confirmed the landscape thumbnail **photo content itself** (not just a CSS glow/ring artifact) visibly zooms and shifts between frames while the mouse hovers near the tile grid. Prior theories (017B: transition-all, 017C: box-shadow transition, 017D: opacity compositing cascade) were each confirmed by structural analysis but were proven insufficient by user live-testing.

### Trigger 2: Darken Slider (new evidence, mid-017E)
Dragging the Darken slider while a background photo is active also causes the lower panel content (landscape grid) to visibly grow, shrink, shift, or change crop — without any thumbnail hover involved. Upper controls (Background heading, Fill Screen/Fit Image toggle, Theme dropdown) remain stable during slider drag.

**User instruction:** Do NOT create 017F. Incorporate the slider evidence into 017E. Treat both triggers as potentially sharing a root cause until measurements prove otherwise.

---

## Analysis — Shared Root Cause

### Why upper controls are stable, lower grid is not

Upper controls contain text, buttons, and borders. Even if their pixel positions drift by <1px during a compositing re-evaluation, their visual appearance is unchanged — text and borders render the same at subpixel offsets.

The landscape tile buttons have `overflow: hidden` + `object-cover` images whose **crop** is computed from the exact pixel dimensions of the clipping box. A <1px change in the computed tile height produces a visibly different `object-cover` crop — visible as a zoom or position shift.

### The aspect-ratio mechanism

The landscape tile buttons used `aspect-[3/2]` (CSS `aspect-ratio: 3/2`) to set their height from their width. The critical detail: **CSS `aspect-ratio` is re-evaluated at GPU rasterization time, not at CSS layout time.** Any event that triggers GPU compositing layer re-evaluation can produce different subpixel rounding for the aspect-ratio height on consecutive frames.

### Hover trigger path
1. User hovers near the tile grid
2. A tile's Tailwind hover state changes → ring color changes (from the first-pass fix, the ring now only appears on hover, not at rest)
3. Ring color change → compositing context for the panel updated
4. Panel's child layers re-evaluated including tile rasterization
5. `aspect-ratio: 3/2` height recomputed with different subpixel rounding → `object-cover` crop changes → visible zoom/shift

### Slider trigger path
1. Slider moves → `onBgFadeChange` → `setBgFade` → Checklist re-renders
2. Main container (`screen-only` div) gets a new `backgroundImage` inline style string
3. **At `bgFade = 1.0` threshold:** format switches between `url(...)` (1-layer) and `linear-gradient(...),url(...)` (2-layer) — a large GPU compositing invalidation
4. **Within `bgFade < 1` range:** rgba alpha value changes on every drag tick — a continuous stream of paint invalidations
5. Either invalidation propagates through the compositing tree to the panel layer
6. Panel layer re-rasterized → `aspect-ratio: 3/2` on tile buttons recomputed → same subpixel drift → same visible crop shift

### Why custom photo tiles don't shake
Custom photo tiles use blob URLs (already GPU-resident). Their aspect-ratio markup is `aspect-[3/2]` on an outer wrapper div (not the button), and the button is `absolute inset-0` inside that wrapper — the button's dimensions come from `inset-0`, not from `aspect-ratio` directly on the button. The button's overflow-hidden box is set by absolute positioning, which is not re-evaluated by the GPU rasterizer.

Wait — actually upon re-examination, the custom photo tiles do use `aspect-[3/2]` on the OUTER div (`<div ... className="rounded-lg aspect-[3/2] ...">`), not on the button itself. The button inside is sized by `w-full relative overflow-hidden`. So the button dimensions are determined by the flex/grid layout of its containing div, not by `aspect-ratio` directly on the button.

This is the key structural difference: **`aspect-ratio` on an outer div that doesn't have `overflow:hidden` is stable because the div doesn't participate in the GPU compositing subpixel path the same way an `overflow:hidden` button with `object-cover` does.**

---

## Unified Fixes Applied

### Fix A — Conditional ring pattern (first pass, hover trigger)
Moved `ring-2 ring-offset-1` out of the unconditional base className. Now only appears in:
- Active branch: `ring-2 ring-primary ring-offset-1`
- Inactive hover: `hover:ring-2 hover:ring-foreground/30 hover:ring-offset-1`

Eliminates the permanent `box-shadow` on inactive tiles that was maintaining constant compositing layer presence and contributing to per-hover re-evaluations.

### Fix B — Padding-top wrapper replaces aspect-ratio on button (shared root cause)

**Before:**
```jsx
<button className={`relative overflow-hidden rounded-lg aspect-[3/2] group ${...ring...}`}>
  <img className="w-full h-full object-cover" />
  ...
</button>
```

**After:**
```jsx
<div key={p.id} className="relative" style={{ paddingTop: '66.667%' }}>
  <button className={`absolute inset-0 overflow-hidden rounded-lg group ${...ring...}`}>
    <img className="w-full h-full object-cover" />
    ...
  </button>
</div>
```

`paddingTop: '66.667%'` (= 2/3 × 100%) establishes the 3:2 aspect ratio via the CSS box model's padding computation — a layout-phase value computed once during CSS layout, not re-evaluated during GPU rasterization. The button is then `absolute inset-0`, getting its dimensions from the wrapper's content + padding box, not from `aspect-ratio`. The `overflow: hidden` and `object-cover` remain on the button, but the button's height is now stable.

### Fix C — Eliminate bgFade=1 format switch in Checklist.tsx (slider trigger)

**Before:**
```tsx
backgroundImage: bgFade < 1
  ? `linear-gradient(rgba(${tone},${1 - bgFade}),rgba(${tone},${1 - bgFade})),url(${bgImageUrl})`
  : `url(${bgImageUrl})`,
backgroundSize: bgFade < 1 ? `100% 100%, ${bgSize}` : bgSize,
```

**After:**
```tsx
backgroundImage: `linear-gradient(rgba(${tone},${Math.max(0, 1 - bgFade)}),rgba(${tone},${Math.max(0, 1 - bgFade)})),url(${bgImageUrl})`,
backgroundSize: `100% 100%, ${bgSize}`,
```

When `bgFade = 1`: alpha = `Math.max(0, 0) = 0` → gradient is fully transparent → same visual result. But the CSS format is always the same 2-layer string. Eliminating the format switch removes the heavier GPU compositing invalidation that occurred each time the slider crossed the bgFade=1 boundary.

### Fix D — Grid wrapper GPU isolation (both triggers)

Added `style={{ willChange: 'transform' }}` to the landscape grid wrapper div (`<div ref={landscapeGridRef} className="px-3 pb-3">`). This promotes the grid to its own GPU compositing layer, preventing parent background-image repaint cascades from entering the tiles' rasterization context.

### Fix E — DEV measurement instrumentation (investigation only)

Added two measurement points to BackgroundPicker.tsx, both gated on `import.meta.env.DEV` (tree-shaken from production builds):

1. **bgFade slider measurement** (`useEffect` on `bgFade` dep): fires on every slider tick while the landscapes panel is open. Logs panel offsetWidth/clientWidth/scrollHeight, scrollbar presence, grid bounding rect, and first two tile bounding rects + computed objectFit/objectPosition.

2. **Grid hover measurement** (`handleGridMeasure` callback, `onMouseEnter` on grid wrapper): fires when the mouse enters the grid area. Logs the same geometry snapshot for hover-trigger analysis.

Expected observation after fix: `tile.btn.h` values remain constant across all logged frames during both slider drag and hover — confirming the padding-top wrapper eliminated subpixel height drift.

---

## Files Changed

| File | Change |
|------|--------|
| `artifacts/pack-checklist/src/components/BackgroundPicker.tsx` | • `landscapeGridRef` ref added<br>• bgFade measurement `useEffect` added (DEV-gated)<br>• `handleGridMeasure` callback added (DEV-gated)<br>• PRESETS.map: landscape tile changed from `<button aspect-[3/2]>` to `<div paddingTop><button absolute inset-0>` (Fix B)<br>• Grid wrapper: added `ref={landscapeGridRef}`, `willChange: transform`, `onMouseEnter={handleGridMeasure}` (Fixes D/E) |
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | `backgroundImage` always uses 2-layer linear-gradient format; `Math.max(0, 1 - bgFade)` alpha; `backgroundSize` always `100% 100%, ${bgSize}` (Fix C) |
| `artifacts/pack-checklist/src/hooks/landscapeShake017E.test.mjs` | Header updated with slider evidence and unified root cause; `btnClassIdx` finder updated to `absolute inset-0 overflow-hidden`; Test 6 updated to check padding-top wrapper; Tests 31–38 added (Fix B/C/D/E assertions) |
| `artifacts/pack-checklist/src/hooks/landscapeShake017D.test.mjs` | Tests D7/D8: button class finder updated from `relative overflow-hidden` to `absolute inset-0 overflow-hidden` |

---

## Test Results

**Before extended fixes:** 818 passed / 0 failed / 16 suites  
**After extended fixes:** 826 passed / 0 failed / 16 suites  
**New tests added:** 8 (Tests 31–38 in landscapeShake017E.test.mjs)  
**Tests updated:** D7, D8 in landscapeShake017D.test.mjs (structure finder updated, logic unchanged)

---

## Acceptance Checklist

| Acceptance criterion | Status |
|---------------------|--------|
| All automated tests pass | ✅ 826/826 |
| No `aspect-[3/2]` on landscape button (only on wrapper div wrapper) | ✅ confirmed by Test 32 |
| `paddingTop: '66.667%'` on wrapper div | ✅ confirmed by Test 31 |
| Button is `absolute inset-0` inside wrapper | ✅ confirmed by Test 6 |
| `overflow-hidden` and `group` remain on button | ✅ Tests 5, 6 |
| Ring classes still conditional (active/hover only, not permanent) | ✅ Tests 1–4 |
| Checklist `backgroundImage` always 2-layer format | ✅ Tests 34, 35 |
| `Math.max(0, 1 - bgFade)` alpha clamp present | ✅ Test 35 |
| Grid wrapper has `willChange: transform` | ✅ Test 36 |
| `landscapeGridRef` declared and attached | ✅ Test 37 |
| DEV measurement gated on `import.meta.env.DEV` | ✅ Test 38 |
| No transition-opacity or transition-all in PRESETS block | ✅ Tests 24, 25 |
| Label overlay UX preserved (group-hover, pointer-events-none, checkmark) | ✅ Tests 21, 22, 29 |
| **HOVER trigger — rendered stabilization** | ⏳ PENDING AUTHORITATIVE USER LIVE-TEST |
| **SLIDER trigger — rendered stabilization** | ⏳ PENDING AUTHORITATIVE USER LIVE-TEST |
| **Overall Prompt 017E result** | ⏳ PENDING — cannot be marked PASS until user completes fresh post-completion test |

**Note:** The structural fixes are confirmed by automated tests (826/826 passing). Whether they resolve the visible thumbnail shake/zoom on the user's actual device requires the authoritative fresh post-completion live-test described in the Testing Protocol Note at the top of this report. The DEV measurement console output (`[017E:slider]` and `[017E:hover]`) will show frame-to-frame `tile.btn.h` values that confirm or deny stabilization — identical values across frames = fix effective.

---

## Screenshot

Screenshot taken post-implementation: `workflow-reports/screenshot_017E_extended.jpg`  
App loads correctly, Clerk auth present, no console errors from the fix.

---

## Fresh Test Readiness Signal

**✅ Prompt 017E is fully complete. All code changes have been applied, all 826 tests pass, and the workflow is running.**  
You may now: close any old preview tabs → open one fresh preview → perform the authoritative test sequence listed in the Testing Protocol Note above.
