---
name: Swipe/drag gesture lessons (V3 mobile)
description: Pointer-gesture pitfalls in TrailWeigh V3 — swipe reveal, category reorder drag, pointer capture, finger-follow math
---

# Swipe-reveal lessons (R004)
- Swallow the click that follows a completed drag, or the row's tap action fires.
- Compute the reorder dim target from the ORIGINAL order, not hit-testing the live-spliced children.
- A cancel path (pointercancel) is required and must be idempotent.

# True finger-follow reorder (R005)
- **Element pointer capture cannot survive a live reorder preview**: when React moves the dragged card's DOM node (row crossing splice), the browser fires `lostpointercapture` immediately. If capture loss is treated as cancel, every crossing kills the drag. Fix: window-level pointermove/up/cancel listeners registered at pointerdown, removed on finish/cancel/unmount.
- **Never subtract a lift ref from a rect** to recover the untransformed slot center — the ref is ahead of the rendered transform between renders, so deltas get eaten (lift converges to ~one frame's delta). Read the actually rendered translateY from `getComputedStyle(el).transform` matrix f (index 5) instead.
- **The dragged card's own transform pollutes the slot midpoint scan** once lift is unclamped: its rect chases the finger and wedges newIdx. Subtract its rendered translateY when computing its midpoint in the scan.
- Lifecycle hardening: filter pointercancel by pointerId (unrelated pointer's cancel must not abort; but a cancel targeting the list container counts — synthetic gesture-takeover tests dispatch on the grip); replacement pointerdown must fully cancel the prior drag; resolve dragged category by NAME against saved order (rendered slot index diverges during preview); cancel on window blur/visibility hidden.

## R006 long-press reorder lifecycle
Long-press hold must be a pointer-ID-owned lifecycle registered on WINDOW listeners at pointerdown (move/up/cancel/blur/visibilitychange), never element-level handlers — a finger leaving the element misses terminal events and the timer fires for a released pointer (ghost drag). Ignore events from other pointer IDs (no cross-pointer defuse/hijack). Click-swallow flags after a drag must self-clear on a short timer, since cancel paths (pointercancel/blur/hidden) produce no click and would otherwise eat the next legitimate tap.
