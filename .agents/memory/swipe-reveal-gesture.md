---
name: Swipe-reveal + reorder gesture lessons (V3 mobile)
description: Durable gesture-implementation rules learned in the R004 round (slide-to-delete, floating reorder)
---

## Click-after-drag must be swallowed
A pointer drag (mouse or touch) is followed by a synthetic `click` on the same element. A reveal that opens on pointerup and closes on tap will immediately re-close itself unless the first post-drag click is consumed (`justDraggedRef` flag, reset in `onClickCapture`).
**Why:** first r004 test run opened and instantly closed every reveal.
**How to apply:** any translate-on-drag row with tap-to-close semantics.

## Reorder target dim: compute from the STABLE original order
With a live splice-preview reorder, the dragged card occupies the pointer's slot, so hit-testing rendered children under the pointer finds the dragged card and clears the target dim mid-cross. Target = `origOrder[dstIdx]` (the displaced category) — stable, exactly one, clears when dst===src.
**Why:** architect review failed the hit-test version for exactly this.

## Drag gestures need a cancellation path
Wire `pointercancel` AND `lostpointercapture` to an idempotent cancel handler that clears all drag state without committing. Guard on the drag ref so the lostpointercapture that follows a normal pointerup is a no-op.

## Misc V3 facts
- Item delete confirm dialog button label is "Delete Item" (dialog aria-label "Delete item confirmation").
- Save appends a timestamp: entry name is `<listName> — <Mon D> <h:mm>`.
- Playwright: `el.scrollBy()` on a non-overflowing container fires no scroll event — dispatch `new Event('scroll')` or make content overflow first.
- SERIF token now aliases the Inter stack (R004); Inter Variable loaded via `@fontsource-variable/inter` imported inside MobileFunctionalV3.tsx only.
