---
name: Three-slider V3 architecture
description: How the three-slider edge-control system is built in MobileFunctionalV3.tsx — constants, components, state, gesture handlers, and render structure.
---

## Rule
The V3 phone UI uses three gesture-driven edge controls (LeftSlider, RightSlider, BottomHandle+MorePanel) instead of Radix Sheet components. All live in `MobileFunctionalV3.tsx` with no external libraries for gesture logic.

**Why:** Spec required 1:1 drag tracking, proportional backdrop, and thumb-friendly bars — incompatible with Radix Sheet's instant-open/close behavior.

**How to apply:** For any new panel or drawer in V3, follow the same pattern: gesture state (X/Y + snapping bool + dragRef), pointer handlers (down/move/up/cancel), snapTo callback, and an absolutely-positioned component that uses `transform: translateX/Y(...)` with `transition: none` during drag and `transition: ${motionDuration()} cubic-bezier(0.4,0,0.2,1)` during snap.

## Constants (module-level, after color tokens)
```
SLIDER_W      = 28   // touch-target width (px)
BAR_VIS_W     = 10   // visual bar width inside touch zone (px)
SLIDER_BG     = '#4E5D58'  // muted slate-green
APP_BAR_H     = 52   // logo header height (px)
TITLE_BAND_H  = 40   // list-title band height (px)
BOTTOM_HAND_H = 14   // bottom drag-handle strip height (px)
BOTTOM_NAV_H  = 62   // bottom nav approximate height (px)
motionDuration()     // respects prefers-reduced-motion
```

## Layout structure (flex column inside phone frame)
1. App bar (52px, flexShrink:0) — logo + search only; no FAB
2. Title band (40px, flexShrink:0) — centered list name; left+right SLIDER_W placeholders
3. Scrollable content (flex:1) — paddingLeft/Right: SLIDER_W to create gutters
4. Bottom handle (14px, flexShrink:0) — SLIDER_BG, drag handler
5. Bottom nav (~62px, flexShrink:0) — unchanged BottomNavBar component

## Absolute overlays (zIndex layers)
- LeftSlider: zIndex 202 (slider element), 201 (drawer panel), 200 (backdrop)
- RightSlider: same z-index pattern
- BottomMorePanel: zIndex 199 (panel), 198 (backdrop)
- Sliders positioned: `top: APP_BAR_H, bottom: BOTTOM_HAND_H + BOTTOM_NAV_H`
- MorePanel positioned: `bottom: BOTTOM_HAND_H + BOTTOM_NAV_H, height: morePanelH`

## State in MobileFunctionalV3Inner
- drawerX/drawerSnapping/drawerDragRef — left slider (pre-existing pattern)
- drawerW/panelW: `Math.min(window.innerWidth, 430) - SLIDER_W` (recomputed on resize)
- plusX/plusSnapping/plusDragRef — right slider
- moreY/moreSnapping/moreDragRef — bottom panel
- morePanelH: `Math.min(Math.round(window.innerHeight * 0.82), 560)` (recomputed on resize)

## Gesture direction conventions
- Left slider: rightward drag increases drawerX (opens); leftward decreases
- Right slider: LEFTWARD drag increases plusX (opens); rightward decreases
  → `dx = startX - e.clientX` (inverted because panel slides from right)
- Bottom handle: UPWARD drag increases moreY (opens); downward decreases
  → `dy = startY - e.clientY` (inverted because panel slides from bottom)

## Snap threshold
- dx/dy < 8px → treat as tap → toggle
- otherwise → snap open if past 40% (left/right) or 35% (bottom) of panel size

## 320px narrow-viewport behavior
At 320px, content width = 320 - 28 - 28 = 264px. Category names truncate (e.g. "B..."). Summary card is tight but usable. This is expected and documented.
