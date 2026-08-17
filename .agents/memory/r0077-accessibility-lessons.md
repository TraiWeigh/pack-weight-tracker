---
name: R0077 accessibility lessons
description: Key lessons from the R0077 mobile accessibility baseline pass — item row split, category header height, SwipeDeleteRow selector, React click triggering, NavBox aria-label.
---

## Item row split (interactive-inside-interactive fix)
Splitting `div[role="button"]` containing `div[role="checkbox"]` into two SIBLINGS:
1. `<button role="checkbox" tabIndex={0}>` (44px wide) — checklist toggle
2. `div[role="button" tabIndex={0}]` (flex:1) — expand/collapse

**Why:** WCAG prohibits interactive elements nested inside other interactive elements. The inner checkbox was also `tabIndex={-1}` making it keyboard-unreachable.

**How to apply:** The outer wrapper becomes a plain layout div with `display:flex, alignItems:stretch, minHeight:44`. Both children are independently focusable and keyboard-operable.

## Category header height constraint (P3-10)
Adding `minHeight:44` to the category options button **must NOT expand the 68px header** (CARD_H). Solution: move the subtitle div INSIDE the button. Natural content height ~40px + `minHeight:44` → button=44px. Grid padding=20px → total=64px < 68px (CARD_H). Header stays 68px.

**Why:** P3-10 measures `|headerTop - summaryBottom| ≤ 1px`. If header grows beyond 68px, the JavaScript positioning calc breaks.

**How to apply:** Whenever adding minHeight to a button inside a flex/grid container that has a fixed outer minHeight, verify the sum of (button height + padding) < outer minHeight, or refactor content into the button.

## SwipeDeleteRow delete button selector collision
`button[aria-label^="Delete "]` matches BOTH:
- SwipeDeleteRow item button: `"Delete [displayName]"` (hidden behind `aria-hidden=true` when not swiped)
- Category SwipeDeleteRow button: `"Delete [catName] category"` (ends with " category")
- Expanded detail panel button: `"Delete [displayName]"` (the one you want)

**Fix:** Use `:not([aria-label$=" category"])` to exclude category buttons. Then `.last()` in DOM order gets the expanded detail panel button (always comes after SwipeDeleteRow wrapper in DOM).

## React onClick via evaluate (bypassing pointer simulation)
`element.click({ force: true })` in Playwright fires pointer events (pointerdown/up) which can be intercepted by `SwipeDeleteRow`'s `handlePointerDown`. Use instead:
```js
await element.evaluate((el: HTMLElement) => el.click());
```
This fires a native MouseEvent with `bubbles:true` that reaches React's root-level synthetic event listener directly.

**Why:** React 17+ attaches all event listeners to the document/root, not individual elements. `el.click()` fires a native click that bubbles normally. SwipeDeleteRow's pointer handlers only intercept `pointerdown` events, not synthetic `click`.

## NavBox aria-label format
NavBox `<button>` elements use the `aria` prop, NOT the `label` prop. Format: `"Locker — saved lists"`, `"Summary — pack weight and progress"`, etc. Always include the full aria string when targeting NavBox buttons in tests.

**How to apply:** Use `button[aria-label="Locker — saved lists"]` (not "Locker" or "Open Locker").

## A04 scroll reset before CDP drag
When adding items to force long mode, the bounded item viewport may reach max scrollTop automatically. Always reset: `await page.getByTestId('open-cat-items').evaluate(el => el.scrollTop = 0)` before measuring before/after scrollTop in a CDP drag test.

## keyboard-tooltips.spec.ts pre-existing failures
7 tests in `tests/e2e/phase1b/keyboard-tooltips.spec.ts` fail with 17s timeouts regardless of R0077 changes. Confirmed by stash-and-retest. Classified TW-P1-001 (pre-existing, not caused by accessibility work).
