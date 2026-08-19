---
name: Document scroll architecture
description: Durable constraints for Safari address-bar retraction and testing document-level scrolling in TrailWeigh V3.
---

The normal V3 list must use the document/window as its scroller. Do not add 1px shims, hidden filler, fake scroll positions, or an always-scrollable empty state just to make address-bar tests pass.

**Why:** A short seeded list can legitimately fit one viewport, so `window.scrollY` will remain zero even when the architecture is correct. Also, CSS computes `overflow-y: visible` as `auto` when paired with `overflow-x: hidden`, silently recreating an inner scroller.

**How to apply:** Test with genuinely taller content (a lower viewport, opened categories, or real additional list content). Keep the outer content flow visible and use a non-coercing horizontal constraint such as `overflow-x: clip` when needed. Long-category mode may temporarily use the canonical body lock, saving and restoring the exact document scroll position.