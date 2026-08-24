---
name: Native category reorder gestures
description: Cross-platform touch ownership rules for TrailWeigh category long-press reordering.
---

## Rule

Keep the native category long-press gesture owned by its original header surface from touch start, excluding the right-side swipe-action zone. On React Native Web, retain the `Touchable` long-press trigger and track the already-active pointer globally only after drag activation.

**Why:** A floating row mounted after long-press cannot reliably take ownership of the touch sequence that began on the original header. RN Web also does not consistently pass that active pointer through its responder layer. The result is a reorder on release without finger-follow motion unless the platform-specific ownership is explicit.

**How to apply:** Keep the hold at 400 ms, cancel before lift after meaningful movement so list scrolling remains normal, and suppress the post-drag tap. Preserve the right action zone for CategorySwipeRow. Verify web with a real CDP touch sequence; treat physical iPhone gesture and haptic validation as a separate device check.