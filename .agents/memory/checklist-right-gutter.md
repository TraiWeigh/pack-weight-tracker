---
name: Checklist right-gutter rule
description: How to align mobile checklist right-side content without shrinking Summary text capacity.
---

**Rule:** Classify mobile right-edge content by visual risk: use a general checklist gutter, a deeper category-weight gutter, an independent AppBar icon-group gutter, and an internal Bottom Next visual offset. Preserve the List Summary’s pre-change flex space for its list name.

**Why:** Chromium-safe geometry with one shared gutter still looked clipped on a real iPhone. Long weight-plus-unit strings and the AppBar's rightmost icon require more visible clearance than normal controls; Summary metrics share flex space with the list name, so moving them inward can create new truncation. A bottom control can need visual clearance without moving its full hitbox or navigation group.

**How to apply:** Keep the app shell, rows, and left wedges full width. Validate candidate insets against real iPhone evidence and at 402px, 390px, and 360px. For Summary alignment, right-align the existing metric stack rather than adding a control. For Bottom Next, shift only the inner icon/label if the hitbox and group behavior are already correct. When moving Summary metrics inward, rebalance only its internal reserved chevron gap if needed; do not reduce type size or globally scale the app. Hidden swipe action rails are gesture-coupled and should be treated separately from resting content.