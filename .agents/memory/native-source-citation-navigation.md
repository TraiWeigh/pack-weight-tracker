---
name: Native source citation navigation
description: Reliable source-reference jumps in the native informational screens.
---

For native Sources & References pages, use a section-aware list and `scrollToLocation` for citation targets rather than composing nested `onLayout` offsets inside a `ScrollView`.

**Why:** React Native Web reports nested layout coordinates relative to each parent, and initial modal/list layout can complete after a one-shot scroll attempt. This made later references open at the top despite correct route state.

**How to apply:** When an About-style citation opens a numbered reference, retain the internal screen stack for Back navigation and pass the target reference to a `SectionList`-style source screen. Resolve its section and item index, then retry `scrollToLocation` after initial list measurement.