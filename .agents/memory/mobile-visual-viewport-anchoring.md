---
name: Mobile visual-viewport anchoring
description: Safari bottom-layer rule for document-scrolling mobile screens with changing browser chrome.
---

**Rule:** When a mobile screen deliberately uses native document scrolling so Safari browser chrome can retract, anchor a fixed bottom layer to the live difference between the layout viewport and visual viewport. Use that exact same offset for final-content clearance and any fixed layers that rise above the bar.

**Why:** A fixed `bottom: 0` layer can visually drift relative to Safari's usable viewport while browser chrome changes, even though no scroll handler is moving the layer. Fixing it by locking the body or replacing document scroll breaks the desired Safari behavior.

**How to apply:** Measure `innerHeight - (visualViewport.offsetTop + visualViewport.height)` on relevant window/visual-viewport changes, clamp it at zero, and apply the value consistently. Validate ordinary document scrolling, last-content clearance, and the fixed layer's stable viewport rect; treat real iPhone evidence as final authority over Chromium.