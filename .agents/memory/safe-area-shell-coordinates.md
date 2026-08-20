---
name: Safe-area shell coordinates
description: How TrailWeigh's fixed mobile shell must handle a real iPhone top safe area without moving the footer.
---

**Rule:** Place the TrailWeigh mobile shell at the runtime top safe-area inset and reduce its height by that same inset. Any absolute child whose vertical coordinate was measured from the layout viewport must subtract the shell inset to preserve its physical screen position.

**Why:** User iPhone Safari evidence showed the top AppBar could be outside the usable content origin when the fixed shell started at raw layout-viewport zero. Shifting only the shell would have moved Bottom Box Groups down by the same amount because its top position was an absolute child coordinate.

**How to apply:** Use a route-scoped CSS custom property derived from `env(safe-area-inset-top, 0px)` so the shell and Home share the same origin. Preserve the existing internal scroll model; do not compensate by hiding or shrinking the AppBar. Test a controlled nonzero custom-property override in Chromium, then require real iPhone Safari evidence for acceptance.