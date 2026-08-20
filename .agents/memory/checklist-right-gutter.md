---
name: Checklist right-gutter rule
description: How to align mobile checklist right-side content without shrinking Summary text capacity.
---

**Rule:** Apply a single right-content gutter to visible checklist values and controls, while preserving the List Summary’s pre-change flex space for its list name.

**Why:** The Summary’s right metrics, chevron reserve, and flexible list-name block share one row. Moving the metrics inward consumes horizontal budget and can create new list-name truncation even though the gutter itself is correct.

**How to apply:** Keep the app shell, rows, and left wedges full width. When changing the common right gutter, inspect the Summary name at 402px and rebalance only its internal reserved gap if needed; do not reduce type size or apply global scaling. Hidden swipe action rails are gesture-coupled and should be treated separately from resting content.