---
name: Mobile visual-viewport anchoring
description: Safari bottom-layer rule for document-scrolling mobile screens with changing browser chrome.
---

**Rule:** When a mobile Safari screen requires its app chrome to stay on physical screen
lines during normal checklist scrolling, use a route-scoped, fixed-height shell with a
dedicated middle scroll viewport. Keep the AppBar, Summary, and Bottom Box Groups as
non-scrolling shell layers; do not use document scrolling as the primary checklist path.

**Why:** Real iPhone Safari evidence showed that footer-only fixed-bottom and stable-top
experiments were insufficient: the AppBar, Summary, and Bottom Box Groups all moved when
the document scrolled and Safari browser chrome animated. An internal scroller prevents
that page movement; live-device evidence outranks Chromium geometry.

**How to apply:** Scope document/root overflow locking to the route, make the shell use a
stable layout height, and give only the checklist middle region `overflow-y:auto`. Preserve
the measured chrome clearances, keep existing bounded long-category item scrollers
intentional, and test that main scrollTop changes while window/document/body scroll remain
zero. Validate real iPhone slow/flick/reverse scrolling as final acceptance.