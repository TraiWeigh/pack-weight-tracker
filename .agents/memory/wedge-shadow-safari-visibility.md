---
name: Wedge shadow Safari visibility
description: Why clipped category wedges use a rightward filter shadow matching the bottom bar's elevation character.
---

For the active mobile category wedge, keep a CSS filter drop-shadow on the
clipped colored button rather than adding elevation to the full category row.
Use the Bottom Box Groups bar's broad, low-opacity character (`3px` offset,
`10px` blur, `7%` black opacity), but direct the wedge shadow rightward toward
its exposed angled point.

**Why:** The category and swipe wrappers intentionally use overflow clipping.
A narrow or downward wedge shadow can be visually lost against the clipped row
edge on iPhone Safari. Directing the same soft shadow into the adjacent
white-content area leaves the layout untouched while making the angled point's
elevation visible.

**How to apply:** Preserve the wedge clip path and use a filter drop-shadow
rather than a rectangular box shadow when updating wedge-only elevation. Do not
change the category row's existing shadow, its overflow behavior, the 1px wedge
gap, or Bottom Box Groups styles.