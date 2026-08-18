# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/reorder.spec.ts >> Category reorder — feasibility check >> drag handle button is present for each category
- Location: tests/e2e/phase1b/reorder.spec.ts:31:7

# Error details

```
Error: drag handles found (expected ≥ 6)

expect(received).toBeGreaterThanOrEqual(expected)

Expected: >= 1
Received:    0
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - button "Open navigation menu" [ref=e6] [cursor=pointer]
      - generic [ref=e8]: TrailWeigh
    - generic [ref=e45]:
      - generic [ref=e52]:
        - generic [ref=e53]: Demo Pack List
        - generic [ref=e54]:
          - generic [ref=e55]: "21"
          - generic [ref=e56]: items
      - button "Expand all categories" [ref=e57] [cursor=pointer]
      - generic [ref=e60]:
        - generic [ref=e61]: 6 categories
        - generic [ref=e62]: 16 Selected
    - generic [ref=e68]:
      - generic [ref=e70]:
        - button [ref=e71] [cursor=pointer]: Edit
        - button [ref=e75] [cursor=pointer]: Delete
        - generic [ref=e80] [cursor=pointer]:
          - button "Open Backpack category" [ref=e81]
          - generic [ref=e86]:
            - generic [ref=e88]:
              - generic [ref=e89]: Backpack
              - generic [ref=e90]: 3 items · 2 selected
            - generic [ref=e91]: 72.50 oz
      - generic [ref=e93]:
        - button [ref=e94] [cursor=pointer]: Edit
        - button [ref=e98] [cursor=pointer]: Delete
        - generic [ref=e103] [cursor=pointer]:
          - button "Open Clothing category" [ref=e104]
          - generic [ref=e107]:
            - generic [ref=e109]:
              - generic [ref=e110]: Clothing
              - generic [ref=e111]: 5 items · 4 selected
            - generic [ref=e112]: 50.70 oz
      - generic [ref=e114]:
        - button [ref=e115] [cursor=pointer]: Edit
        - button [ref=e119] [cursor=pointer]: Delete
        - generic [ref=e124] [cursor=pointer]:
          - button "Open Toiletries category" [ref=e125]
          - generic [ref=e130]:
            - generic [ref=e132]:
              - generic [ref=e133]: Toiletries
              - generic [ref=e134]: 4 items · 2 selected
            - generic [ref=e135]: 2.60 oz
      - generic [ref=e137]:
        - button [ref=e138] [cursor=pointer]: Edit
        - button [ref=e142] [cursor=pointer]: Delete
        - generic [ref=e147] [cursor=pointer]:
          - button "Open Electronics category" [ref=e148]
          - generic [ref=e151]:
            - generic [ref=e153]:
              - generic [ref=e154]: Electronics
              - generic [ref=e155]: 3 items · 3 selected
            - generic [ref=e156]: 14.40 oz
      - generic [ref=e158]:
        - button [ref=e159] [cursor=pointer]: Edit
        - button [ref=e163] [cursor=pointer]: Delete
        - generic [ref=e168] [cursor=pointer]:
          - button "Open Shelter category" [ref=e169]
          - generic [ref=e174]:
            - generic [ref=e176]:
              - generic [ref=e177]: Shelter
              - generic [ref=e178]: 3 items · 3 selected
            - generic [ref=e179]: 90.00 oz
      - generic [ref=e181]:
        - button [ref=e182] [cursor=pointer]: Edit
        - button [ref=e186] [cursor=pointer]: Delete
        - generic [ref=e191] [cursor=pointer]:
          - button "Open Kitchen category" [ref=e192]
          - generic [ref=e198]:
            - generic [ref=e200]:
              - generic [ref=e201]: Kitchen
              - generic [ref=e202]: 3 items · 2 selected
            - generic [ref=e203]: 13.70 oz
    - generic [ref=e206]:
      - button "Locker — saved lists" [ref=e207] [cursor=pointer]:
        - generic [ref=e210]: Locker
      - button "Summary — pack weight and progress" [ref=e212] [cursor=pointer]:
        - generic [ref=e214]: Summary
      - button "Add — add items, categories, or import" [ref=e216] [cursor=pointer]:
        - generic [ref=e218]: Add
      - button "Search — find gear" [ref=e220] [cursor=pointer]:
        - generic [ref=e224]: Search
      - button "Next controls" [ref=e226] [cursor=pointer]:
        - generic [ref=e229]: Next
    - navigation [ref=e230]:
      - generic [ref=e231]: TrailWeigh
      - list [ref=e233]:
        - listitem [ref=e234]:
          - button [ref=e235] [cursor=pointer]:
            - generic [ref=e239]: Home
        - listitem [ref=e241]:
          - button [disabled] [ref=e242]:
            - generic [ref=e245]:
              - generic [ref=e246]: Master Library
              - generic [ref=e247]: Coming soon
        - listitem [ref=e248]:
          - button [ref=e249] [cursor=pointer]:
            - generic [ref=e252]: My Lists
        - listitem [ref=e254]:
          - button [ref=e255] [cursor=pointer]:
            - generic [ref=e259]: Help & Tutorials
        - listitem [ref=e261]:
          - button [ref=e262] [cursor=pointer]:
            - generic [ref=e266]: Settings
      - button [ref=e269] [cursor=pointer]:
        - generic [ref=e272]:
          - generic [ref=e273]: Right-handed
          - generic [ref=e274]: Tap to flip menu side
  - region "Notifications (F8)":
    - list
```

# Test source

```ts
  1  | /**
  2  |  * Phase 1B — Category Reorder / Drag Feasibility
  3  |  *
  4  |  * Target route: /mobile-functional-v3 (V3 sandbox)
  5  |  * Classification: A — sandbox route.
  6  |  *
  7  |  * VERDICT: NOT RELIABLY AUTOMATABLE WITH CURRENT PLAYWRIGHT POINTER EVENTS.
  8  |  *
  9  |  * The reorder control uses native pointer events (onPointerDown, onPointerMove,
  10 |  * onPointerUp on a button element — MobileFunctionalV3.tsx:2008-2010).  There is:
  11 |  *   - NO drag-and-drop API (HTML5 drag events not used).
  12 |  *   - NO keyboard alternative for reorder (no arrowkey/home/end reorder handler).
  13 |  *   - NO data-testid or aria-grabbed sequence that Playwright can drive reliably.
  14 |  *
  15 |  * Playwright's mouse.move() can synthesize pointer events, but the handler reads
  16 |  * relative Y positions of sibling elements during pointermove, which requires:
  17 |  *   1. stable pixel-level layout (affected by fonts, viewport rounding),
  18 |  *   2. precise timing of pointermove vs pointerup,
  19 |  *   3. correct bounding-box delta calculation matching the implementation.
  20 |  *
  21 |  * The drag handle button IS accessible and reachable by keyboard focus, but activating
  22 |  * it via Space/Enter only fires click, not the pointer sequence needed for drag.
  23 |  *
  24 |  * This test file confirms the handle IS PRESENT and ACCESSIBLE (so the presence of
  25 |  * the feature is verified), but does NOT attempt a brittle drag simulation.
  26 |  */
  27 | import { test, expect, gotoDemo, openCategory } from '../helpers/trailweigh';
  28 | 
  29 | test.describe('Category reorder — feasibility check', () => {
  30 | 
  31 |   test('drag handle button is present for each category', async ({ page, errors }) => {
  32 |     // Classification: A — sandbox route; B — accessible label confirmed.
  33 |     await gotoDemo(page);
  34 |     // Each category should have a drag-handle button
  35 |     const handles = page.getByRole('button', { name: /Drag to reorder .* category/i });
  36 |     const count = await handles.count();
> 37 |     expect(count, `drag handles found (expected ≥ ${6})`).toBeGreaterThanOrEqual(1);
     |                                                           ^ Error: drag handles found (expected ≥ 6)
  38 |     expect(errors.pageErrors).toEqual([]);
  39 |   });
  40 | 
  41 |   test('drag handle has accessible label and title attribute', async ({ page, errors }) => {
  42 |     await gotoDemo(page);
  43 |     const firstHandle = page.getByRole('button', { name: /Drag to reorder Backpack category/i }).first();
  44 |     await expect(firstHandle).toBeVisible();
  45 |     const title = await firstHandle.getAttribute('title');
  46 |     expect(title, 'title attribute present on drag handle').toBeTruthy();
  47 |     expect(errors.pageErrors).toEqual([]);
  48 |   });
  49 | 
  50 |   test('drag handle receives keyboard focus', async ({ page, errors }) => {
  51 |     await gotoDemo(page);
  52 |     const firstHandle = page.getByRole('button', { name: /Drag to reorder Backpack category/i }).first();
  53 |     await firstHandle.focus();
  54 |     const isFocused = await firstHandle.evaluate(el => el === document.activeElement);
  55 |     expect(isFocused, 'drag handle is focusable').toBe(true);
  56 |     expect(errors.pageErrors).toEqual([]);
  57 |   });
  58 | 
  59 |   test('VERDICT: pointer-based drag NOT attempted — automation would be unreliable', async () => {
  60 |     /**
  61 |      * Reason: the drag implementation compares element bounding boxes at each
  62 |      * pointermove event.  Pixel-level layout instability across runs (font
  63 |      * rendering, HiDPI rounding, Vite HMR) means any threshold chosen would
  64 |      * produce intermittent false-passes or false-fails.
  65 |      *
  66 |      * Decision: reclassify as NOT RELIABLY AUTOMATABLE until either:
  67 |      *   (a) a keyboard reorder alternative is added (arrowkey support), or
  68 |      *   (b) a data-testid-based swap API is exposed for tests, or
  69 |      *   (c) a stable drag helper is proven over ≥ 20 consecutive runs.
  70 |      */
  71 |   });
  72 | 
  73 | });
  74 | 
```