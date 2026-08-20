---
name: Wedge shadow Safari visibility
description: Why clipped category wedges use a rightward filter shadow matching the bottom bar's elevation character.
---

For the active mobile category wedge, keep elevation off the interactive clipped
button and off the full category row. Instead, render the CSS filter
drop-shadow on a non-interactive wedge-shaped sibling at the category-header
wrapper level, outside the transformed SwipeDeleteRow content layer. Use the
Bottom Box Groups bar's broad, low-opacity character (`3px` offset, `10px`
blur, `7%` black opacity), directed rightward toward the exposed angled point.

**Why:** The category and swipe wrappers intentionally use overflow clipping,
and SwipeDeleteRow renders the real content in a transformed layer. A filter on
the real button can be visually lost on iPhone Safari. A separate sibling avoids
that transformed content layer; directing the soft shadow into the adjacent
white-content area leaves layout and gesture clipping untouched.

**How to apply:** Preserve the wedge clip path and use a filter drop-shadow on
the decorative sibling rather than a rectangular box shadow. Keep it
pointer-events:none and behind the real trigger. Do not change the category
row's existing shadow, its overflow behavior, the 1px wedge gap, or Bottom Box
Groups styles.