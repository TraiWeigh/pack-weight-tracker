---
name: BoxGroupBar pointer-capture trap
description: setPointerCapture on a parent div redirects click events in Playwright and prevents child button onClick handlers from firing — use window listeners instead.
---

## Rule

Never call `element.setPointerCapture(pointerId)` on a container div that has child buttons with `onClick` handlers. The pointer capture redirects the synthesized `click` event to the capturing element, bypassing the original button target.

**Why:** In Playwright (and some real browsers), when pointer capture is active, the `click` event fires on the capturing element (the container), not on the original click target (the button). The container has no click handler, so `goLeft()`/`goRight()` (or any button action) is silently ignored. The drag gesture completes, but chevron/nav-button taps never register.

**How to apply:** In gesture-tracking components, attach `window.addEventListener('pointermove', ...)` and `window.addEventListener('pointerup', ...)` from inside `onPointerDown`, and remove them in the `onUp` handler. This achieves full-viewport drag tracking without stealing clicks from children. Keep `groupIdxRef` and `settleRef` as mutable refs so the window listeners always read current state without stale closure issues.

```tsx
// WRONG — steals clicks from child buttons
(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

// CORRECT — window listeners; no pointer capture
window.addEventListener('pointermove', onMove, { passive: true });
window.addEventListener('pointerup', onUp);
// remove both inside onUp
```
