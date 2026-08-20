---
name: Mobile visual-viewport anchoring
description: Safari bottom-layer rule for document-scrolling mobile screens with changing browser chrome.
---

**Rule:** For a mobile screen that uses native document scrolling, keep a bottom layer structurally fixed with a static CSS bottom value. Use its measured occupied height for content/deck clearance, but never update its position from visual-viewport or document scroll events.

**Why:** Continuous visual-viewport compensation made a CSS-fixed bottom layer visibly rise and fall in real iPhone Safari during ordinary finger scrolling, despite Chromium geometry appearing stable. Live-device evidence outranks the simulated browser result.

**How to apply:** Keep the footer a sibling/outside the moving content layer, use `position: fixed; bottom: 0`, and reserve its measured height below content and raised decks. Validate footer rect/style stability through scroll directions, then treat real iPhone evidence as final authority over Chromium.