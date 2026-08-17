---
name: R0075 test infrastructure lessons
description: Three gotchas discovered when writing Playwright tests against MobileFunctionalV3 at mobile viewport
---

**Why:**  All 15 R0075 tests failed on first run due to three test-authoring errors.

**Lesson 1 — URL pattern for MobileFunctionalV3 tests**
Use `page.goto('/mobile-functional-v3')` (absolute path, no host). With playwright baseURL `http://localhost:80/pack-checklist`, this resolves to `http://localhost:80/mobile-functional-v3` — NOT the prefixed `/pack-checklist/` URL. Using the full `http://localhost:80/pack-checklist/mobile-functional-v3` produces a React Router 404 because the base-path prefix is not stripped by the router.

**Lesson 2 — Readiness signal at mobile viewport**
`getByText('LIST SUMMARY')` is the signal used by the phase1b `gotoDemo` helper, but that text was removed from MobileFunctionalV3 in a prior revision (replaced by the active list name). It is also only visible at desktop viewport widths. For mobile-viewport tests (390×844), use `getByTestId('active-list-name')` instead — it is always rendered after sandbox init.

**Lesson 3 — Counting new items after addItem()**
After clicking the Add Item button, the new row has an empty/default name ("Unnamed item"). Selectors that match `aria-label*="${catName}"` will miss it. Count item rows via `[role="button"][aria-label*="expand details"]` instead.
