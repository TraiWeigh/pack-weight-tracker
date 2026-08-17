---
name: R0076 bounded category viewport
description: Architecture for long-category bounded scroll viewport in MobileFunctionalV3; key pitfalls about stale state, parent-scroll locking, and two-chevron design.
---

## The rule
When a long category opens, the item container gets a bounded scroll viewport.
Add Item bar lives OUTSIDE the item container so it always stays pinned.
The PARENT main-scroll must be locked to overflowY:hidden in long mode so the
category header and Add Item bar cannot travel with parent scroll.

## Why
React state (navHeight, summaryH) can be stale at activation time.
main-scroll being scrollable while isCatLong=true allows the category header
to disappear upward and the Add Item bar to move below the nav.
The fix: freeze main-scroll (overflowY:hidden) after scroll-into-view completes.

## How to apply
1. In JSX: `overflowY: (isCatLong && !!openCatName && !allExpanded) ? 'hidden' : 'auto'`
   on main-scroll. The RAF must set `ms.style.overflowY = 'auto'` first (inline) so
   the initial scroll-into-view can still execute.

2. In remeasureLongMode(), use item container's OWN top (not summaryBtm − CARD_H):
   ```ts
   const itemsTop  = itemsEl.getBoundingClientRect().top;
   const navTop    = navEl.getBoundingClientRect().top;
   const rawAvailH = navTop − itemsTop − 44;   // 44 = Add Item bar height
   ```

3. Run remeasureLongMode() both at 420ms after openCatName changes AND
   150ms after openCatItemCount changes (SHORT↔LONG without close/reopen).

4. Two separate ▲/▼ buttons (cat-chevron-up / cat-chevron-down) with
   disabled + aria-disabled set programmatically. Both always present in long mode.

## Playwright lessons
- Mouse drag does NOT reliably scroll an overflowY:auto div. Use evaluate:
  `el.scrollTop += N` to set position, then measure geometry.
- Set el.scrollTop = 0 before checking "at top" state — prior test localStorage
  additions can leave the page in a scrolled position.
- Boundary stationarity: record geo() before and after scrollTop change;
  assert |before − after| ≤ 1px for headerTop, headerBottom, addItemTop, addItemBottom.

## Known artefacts
- headerTop lands ~2px above summaryBottom due to smooth-scroll sub-pixel rounding.
  The top 2px of header background overlaps the sticky bar (zIndex:4); content fully
  visible. Test tolerance set to 3px.
- dHdr=1px on each item-add in long mode — within tolerance; caused by CSS pixel
  rounding when maxHeight is re-applied.
