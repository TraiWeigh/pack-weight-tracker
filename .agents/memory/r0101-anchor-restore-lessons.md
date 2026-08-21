---
name: R0101 anchor & restore lessons
description: Why isCatLong never became true after auto-scroll, and the sticky-header fix for remeasureLongMode.
---

# R0101 — Category Anchor & Scroll Restore

## The isCatLong-never-true bug

**Rule:** Never use `itemsEl.getBoundingClientRect().top` to compute available height in `remeasureLongMode`. Use the **sticky category header's** `.getBoundingClientRect().bottom` instead.

**Why:** When Playwright (or a real touch gesture) auto-scrolls `main-scroll` to bring the Add Item button into view as items grow, `itemsEl.getBoundingClientRect().top` goes negative (the container scrolls above the viewport). This made `rawAvailH = navTop − itemsTop − 44` artificially large, so `itemsEl.scrollHeight < rawAvailH + 4` and `isCatLong` stayed false forever. The `data-long-mode` attribute and `cat-chevron-down` signals never appeared.

**Fix:** Climb from `itemsEl` to `[data-cat]` via `.closest('[data-cat]')`, then query `[data-testid^="cat-header-"]` inside it. Read `catHeaderEl.getBoundingClientRect().bottom` — the sticky header is pinned at `filterBtm` regardless of `main-scroll`'s scrollTop. Then:
```
rawAvailH = navTop − catHeaderBottom − addItemBarH(44)
```

**How to apply:** Any future `remeasureLongMode`-style measurement that needs "available height in the bounded item region" must use fixed/sticky element coordinates, not the scroll-dependent items container position.

## Explicit DOM test signals

Add a `data-long-mode="true"` attribute (or similar) to DOM elements whose state is toggled by React state changes. Using `waitForFunction` on computed style (`overflowY`, `scrollHeight > clientHeight`) is ambiguous during scroll-position transitions and causes intermittent timeouts. An explicit attribute is unambiguous.

## showFilterSlot constant

`showFilterSlot = true` is now a permanent constant (R0101). Removing it from effect deps is safe and removes one unnecessary re-fire source.

## Two-RAF scroll restore on close

On category close, assigning `listViewport.scrollTop = restore.scrollTop` twice across two RAF callbacks handles Safari's layout flush after the collapsed DOM settles. A single assignment sometimes races the collapse.
