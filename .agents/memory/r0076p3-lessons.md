---
name: R0076P3 lessons
description: Outer scroll leak (overflow:hidden bypass), scroll chaining fix, Playwright touch test patterns, BoundingBox gotcha
---

## Rule 1 — overflow:hidden elements accept scrollTop (remove unlock pattern)

`ms.style.overflowY = 'auto'` before a `ms.scrollTop = X` assignment is NEVER needed.
The DOM spec allows programmatic `scrollTop` on `overflow: hidden` elements.
User gestures are blocked; JS assignments are not.

**Why:** R0076P3 Defect 1 — the inline DOM override persisted permanently when
`isCatLong` was already true (no re-render → React never reapplied `overflowY:'hidden'`).
Removing the assignment fixes the permanent outer-scroll unlock.

**How to apply:** Any time you need to programmatically set scrollTop on a React-managed
overflow:hidden element, do it directly. Never unlock first.

---

## Rule 2 — Add overscroll-behavior:contain to bounded inner scroll viewports

When a bounded inner scroll viewport (overflowY:'auto') is nested inside an outer
scroll container, add `overscrollBehavior: 'contain'` to the inner viewport's styles.

**Why:** Without it, when the inner viewport reaches its top/bottom boundary, the browser
chains the gesture to the outer scroll — even if the outer scroll is overflow:hidden.
This is the defence-in-depth layer protecting against future regressions.

---

## Rule 3 — Playwright BoundingBox is {x,y,width,height} NOT {top,bottom,left,right}

`(await el.boundingBox()).bottom` is always `undefined`. Use `bb.y + bb.height` for
the bottom edge.

`getBoundingClientRect()` inside `page.evaluate()` DOES return `.top`, `.bottom`, etc.
Use the evaluate path when you need `.top`/`.bottom` semantics.

---

## Rule 4 — CDP Input.dispatchTouchEvent for real native browser scrolling

Playwright tests that need to verify native scroll (not just event dispatch):
- DOM-dispatched `new TouchEvent(...)` from `page.evaluate()` does NOT trigger native scrolling.
- Use `context.newCDPSession(page)` + `cdp.send('Input.dispatchTouchEvent', {...})` with
  `touchStart` / `touchMove` (step loop) / `touchEnd` to send real input-pipeline touch events.
- `deltaY < 0` = finger moves UP = content scrolls DOWN = scrollTop INCREASES.
- `deltaY > 0` = finger moves DOWN = content scrolls UP = scrollTop DECREASES.

---

## Rule 5 — Nav group chevrons: use DOM .click() not Playwright .click()

BoxGroupBar renders all group chevrons in the DOM at once; off-screen groups use CSS
transform, not display:none. Playwright `.filter({ visible: true })` may match ALL of them.

Use `el.first().evaluate((el) => el.click())` to click by DOM order, which reliably
targets the current group's chevron.
