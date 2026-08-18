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
    - generic [ref=e44]:
      - generic [ref=e48]:
        - generic [ref=e55]:
          - generic [ref=e56]: Demo Pack List
          - generic [ref=e57]:
            - generic [ref=e58]: "21"
            - generic [ref=e59]: items
        - button "Expand all categories" [ref=e60] [cursor=pointer]
        - generic [ref=e63]:
          - generic [ref=e64]: 6 categories
          - generic [ref=e65]: 16 Selected
      - generic [ref=e70]:
        - generic [ref=e72]:
          - button [ref=e73] [cursor=pointer]: Delete
          - generic [ref=e78]:
            - button "Open Backpack category" [ref=e79] [cursor=pointer]
            - generic [ref=e84]:
              - button "Category options for Backpack" [ref=e86] [cursor=pointer]:
                - generic [ref=e87]: Backpack
                - generic [ref=e88]: 3 items · 2 selected
              - generic [ref=e89]: 72.50 oz
        - generic [ref=e91]:
          - button [ref=e92] [cursor=pointer]: Delete
          - generic [ref=e97]:
            - button "Open Clothing category" [ref=e98] [cursor=pointer]
            - generic [ref=e101]:
              - button "Category options for Clothing" [ref=e103] [cursor=pointer]:
                - generic [ref=e104]: Clothing
                - generic [ref=e105]: 5 items · 4 selected
              - generic [ref=e106]: 50.70 oz
        - generic [ref=e108]:
          - button [ref=e109] [cursor=pointer]: Delete
          - generic [ref=e114]:
            - button "Open Toiletries category" [ref=e115] [cursor=pointer]
            - generic [ref=e120]:
              - button "Category options for Toiletries" [ref=e122] [cursor=pointer]:
                - generic [ref=e123]: Toiletries
                - generic [ref=e124]: 4 items · 2 selected
              - generic [ref=e125]: 2.60 oz
        - generic [ref=e127]:
          - button [ref=e128] [cursor=pointer]: Delete
          - generic [ref=e133]:
            - button "Open Electronics category" [ref=e134] [cursor=pointer]
            - generic [ref=e137]:
              - button "Category options for Electronics" [ref=e139] [cursor=pointer]:
                - generic [ref=e140]: Electronics
                - generic [ref=e141]: 3 items · 3 selected
              - generic [ref=e142]: 14.40 oz
        - generic [ref=e144]:
          - button [ref=e145] [cursor=pointer]: Delete
          - generic [ref=e150]:
            - button "Open Shelter category" [ref=e151] [cursor=pointer]
            - generic [ref=e156]:
              - button "Category options for Shelter" [ref=e158] [cursor=pointer]:
                - generic [ref=e159]: Shelter
                - generic [ref=e160]: 3 items · 3 selected
              - generic [ref=e161]: 90.00 oz
        - generic [ref=e163]:
          - button [ref=e164] [cursor=pointer]: Delete
          - generic [ref=e169]:
            - button "Open Kitchen category" [ref=e170] [cursor=pointer]
            - generic [ref=e176]:
              - button "Category options for Kitchen" [ref=e178] [cursor=pointer]:
                - generic [ref=e179]: Kitchen
                - generic [ref=e180]: 3 items · 2 selected
              - generic [ref=e181]: 13.70 oz
    - generic [ref=e184]:
      - button "Locker — saved lists" [ref=e185] [cursor=pointer]:
        - generic [ref=e188]: Locker
      - button "Summary — pack weight and progress" [ref=e190] [cursor=pointer]:
        - generic [ref=e192]: Summary
      - button "Add — add items, categories, or import" [ref=e194] [cursor=pointer]:
        - generic [ref=e196]: Add
      - button "Search — find gear" [ref=e198] [cursor=pointer]:
        - generic [ref=e202]: Search
      - button "Next controls" [ref=e204] [cursor=pointer]:
        - generic [ref=e207]: Next
    - navigation [ref=e208]:
      - generic [ref=e209]: TrailWeigh
      - list [ref=e211]:
        - listitem [ref=e212]:
          - button [ref=e213] [cursor=pointer]:
            - generic [ref=e217]: Home
        - listitem [ref=e219]:
          - button [disabled] [ref=e220]:
            - generic [ref=e223]:
              - generic [ref=e224]: Master Library
              - generic [ref=e225]: Coming soon
        - listitem [ref=e226]:
          - button [ref=e227] [cursor=pointer]:
            - generic [ref=e230]: My Lists
        - listitem [ref=e232]:
          - button [ref=e233] [cursor=pointer]:
            - generic [ref=e237]: Help & Tutorials
        - listitem [ref=e239]:
          - button [ref=e240] [cursor=pointer]:
            - generic [ref=e244]: Settings
      - button [ref=e247] [cursor=pointer]:
        - generic [ref=e250]:
          - generic [ref=e251]: Right-handed
          - generic [ref=e252]: Tap to flip menu side
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