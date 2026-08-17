---
name: R0076 bounded category viewport
description: Architecture for long-category bounded scroll viewport in MobileFunctionalV3; key pitfall about stale state in availItemH calculation.
---

## The rule
When a long category opens (>availH items), the item container gets a bounded scroll viewport.
Add Item bar lives OUTSIDE the item container so it always stays pinned at the boundary.
availItemH must be computed from ACTUAL DOM positions at activation time, NOT from React state.

## Why
React state (navHeight, summaryH) can be stale at the moment isCatLong first fires.
The summary bar may grow after mount (dynamic content), so the ResizeObserver-updated state
may lag by one render cycle. Using `document.querySelector('[data-testid="list-summary-bar"]').getBoundingClientRect().bottom`
and `document.querySelector('[data-testid="bottom-nav"]').getBoundingClientRect().top` inside
the 420ms timeout gives the exact live values and eliminates the ~50px gap.

## How to apply
In the 420ms timeout (useEffect on openCatName):
```ts
const summaryEl = document.querySelector('[data-testid="list-summary-bar"]');
const navEl     = document.querySelector('[data-testid="bottom-nav"]');
const summaryBtm = summaryEl ? summaryEl.getBoundingClientRect().bottom : summaryH;
const navTop     = navEl     ? navEl.getBoundingClientRect().top         : (window.innerHeight - navHeight);
const rawAvailH  = navTop - summaryBtm - CARD_H - 44;
setAvailItemH(Math.max(44, rawAvailH));
setIsCatLong(itemsEl.scrollHeight > rawAvailH + 4);
```
Store availItemH as a state variable (not a render-body const).

## Geometry contract (390×844)
- category header top ≈ summaryBottom (sticky scrolled into view)  
- item container: maxHeight = availItemH, overflowY: auto, scrollbarWidth: none  
- Add Item bar: 44px, sits directly below item container  
- addItemBottom flush with bottomBoxTop (≤2px in practice)
