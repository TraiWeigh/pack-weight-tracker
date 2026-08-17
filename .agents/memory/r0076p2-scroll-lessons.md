---
name: R0076P2 scroll-clamp + isCatLong dep lessons
description: Three root causes found during R0076P2 repair; scroll mechanics, effect deps, and Playwright test patterns for off-screen BoxGroupBar buttons.
---

## Three root causes

### 1 — Scroll clamping on first open (J defect)
`openCatName` useEffect fires when a category is tapped, but at that moment the category may have few items and `main-scroll.scrollHeight` is barely larger than `clientHeight`. Setting `ms.scrollTop = target` is silently **clamped** to the available max (may be 30–40 px when 69 px is needed). The scroll appears to succeed (no error) but leaves a visible gap.

**Fix:** Add `isCatLong` to the effect's dependency array. When `isCatLong` transitions `false → true` (content now tall enough), the effect re-fires and the corrective scroll lands without clamping.

**Why:** Content height grows as items are added; the scroll that "sticks" must run after the content is tall enough.

**How to apply:** Deps for the category-scroll/remeasure effect must include every state that gates whether the scroll can succeed, not just what triggers it semantically.

### 2 — `behavior: 'instant'` is async in Chrome
`element.scrollTo({ top: N, behavior: 'instant' })` is **not** synchronous in Chrome/Chromium — it queues an animation microtask like smooth scroll. A second RAF fired mid-animation reads a partial (wrong) scroll position.

**Fix:** Always use `element.scrollTop = N` (direct property assignment) for synchronous instant scroll. Reserve `scrollTo()` for intentional smooth scroll only.

**How to apply:** Wherever a RAF callback needs to read a settled scroll position immediately after setting it, use `.scrollTop = N`, never `.scrollTo({ behavior: 'instant' })`.

### 3 — `overflow: hidden` + `scrollTop` interaction
When `main-scroll` has `overflow: hidden` applied by React, setting `.scrollTop` may produce unexpected results because the browser restricts scrolling on hidden-overflow elements. Always set `ms.style.overflowY = 'auto'` inline in the RAF **before** measuring and scrolling, then let React re-apply `hidden` after `remeasureLongMode()` fires.

---

## Playwright test patterns

### Off-screen BoxGroupBar buttons
`[aria-label="Next controls"]` / `[aria-label="Previous controls"]` have multiple instances in DOM (one per group, inactive groups hidden). Patterns:
- Use `.first()` to avoid strict-mode violations.
- Use `.filter({ visible: true })` to get the currently-active one.
- Use `locator.evaluate(el => el.click())` for JS-dispatch when elements are outside the Playwright viewport box (`{ force: true }` alone doesn't work for truly out-of-viewport elements).

### Scope `[aria-expanded="true"]` within item container
`page.locator('[aria-expanded="true"]')` matches the **category header** button (which also has `aria-expanded`) as well as individual item accordion buttons. Always scope to `page.getByTestId('open-cat-items').locator('[aria-expanded="true"]')` to target only item accordions.

### CSS `!=` attribute selector is invalid
`[attr!="value"]` is not valid CSS in Playwright selectors. Use `.filter({ visible: true })` instead of appending `[aria-hidden!="true"]`.
