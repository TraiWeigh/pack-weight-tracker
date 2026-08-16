---
name: Measured nav-height gotchas
description: Why safe-area padding growth needs border-box ResizeObserver + callback ref in V3
---
Two silent failure modes when measuring the bottom nav's occupied height:
1. ResizeObserver defaults to content-box; safe-area insets grow only PADDING, so no event fires. Observe with { box: 'border-box' }.
2. The V3 page has a loading gate before the nav renders, so a one-shot useEffect sees a null ref. Use a callback ref that attaches/disconnects the observer on mount/unmount.
**How to apply:** any element whose size changes via padding (env(safe-area-inset-*)) or that mounts after a gate.
