---
name: Mobile visual-viewport anchoring
description: Safari bottom-layer rule for document-scrolling mobile screens with changing browser chrome.
---

**Rule:** For a native document-scrolling mobile screen that must stay on one physical
Safari screen line, anchor a fixed bottom layer from a stable layout-viewport top
coordinate (`documentElement.clientHeight − measured layer height`), not `bottom: 0`.
Use its measured occupied height for content/deck clearance.

**Why:** R0093 removed every JavaScript scroll compensator but a CSS-fixed `bottom: 0`
footer still visibly moved on the real iPhone as Safari browser chrome changed the dynamic
visual-viewport bottom. The AppBar and Summary stayed comparatively steady because they
already used fixed top coordinates. Live-device evidence outranks Chromium geometry.

**How to apply:** Keep the footer outside moving content, use `position: fixed` with
an authored `top` from layout clientHeight and `bottom: auto`, and reserve its measured
height below content and raised decks. Observe layout clientHeight only for genuine
layout/orientation changes; never use document/visual-viewport scroll or innerHeight.
Validate scroll, visual-viewport event immunity, true resize, and then real iPhone Safari.