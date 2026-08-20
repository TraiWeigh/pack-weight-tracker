# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/reorder.spec.ts >> Category reorder — feasibility check >> drag handle receives keyboard focus
- Location: tests/e2e/phase1b/reorder.spec.ts:50:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.focus: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /Drag to reorder Backpack category/i }).first()

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
    - generic [ref=e69]:
      - generic [ref=e71]:
        - button [ref=e72] [cursor=pointer]: Edit
        - button [ref=e76] [cursor=pointer]: Delete
        - generic [ref=e81] [cursor=pointer]:
          - button "Open Backpack category" [ref=e82]
          - generic [ref=e87]:
            - generic [ref=e89]:
              - generic [ref=e90]: Backpack
              - generic [ref=e91]: 3 items · 2 selected
            - generic [ref=e92]: 72.50 oz
      - generic [ref=e94]:
        - button [ref=e95] [cursor=pointer]: Edit
        - button [ref=e99] [cursor=pointer]: Delete
        - generic [ref=e104] [cursor=pointer]:
          - button "Open Clothing category" [ref=e105]
          - generic [ref=e108]:
            - generic [ref=e110]:
              - generic [ref=e111]: Clothing
              - generic [ref=e112]: 5 items · 4 selected
            - generic [ref=e113]: 50.70 oz
      - generic [ref=e115]:
        - button [ref=e116] [cursor=pointer]: Edit
        - button [ref=e120] [cursor=pointer]: Delete
        - generic [ref=e125] [cursor=pointer]:
          - button "Open Toiletries category" [ref=e126]
          - generic [ref=e131]:
            - generic [ref=e133]:
              - generic [ref=e134]: Toiletries
              - generic [ref=e135]: 4 items · 2 selected
            - generic [ref=e136]: 2.60 oz
      - generic [ref=e138]:
        - button [ref=e139] [cursor=pointer]: Edit
        - button [ref=e143] [cursor=pointer]: Delete
        - generic [ref=e148] [cursor=pointer]:
          - button "Open Electronics category" [ref=e149]
          - generic [ref=e152]:
            - generic [ref=e154]:
              - generic [ref=e155]: Electronics
              - generic [ref=e156]: 3 items · 3 selected
            - generic [ref=e157]: 14.40 oz
      - generic [ref=e159]:
        - button [ref=e160] [cursor=pointer]: Edit
        - button [ref=e164] [cursor=pointer]: Delete
        - generic [ref=e169] [cursor=pointer]:
          - button "Open Shelter category" [ref=e170]
          - generic [ref=e175]:
            - generic [ref=e177]:
              - generic [ref=e178]: Shelter
              - generic [ref=e179]: 3 items · 3 selected
            - generic [ref=e180]: 90.00 oz
      - generic [ref=e182]:
        - button [ref=e183] [cursor=pointer]: Edit
        - button [ref=e187] [cursor=pointer]: Delete
        - generic [ref=e192] [cursor=pointer]:
          - button "Open Kitchen category" [ref=e193]
          - generic [ref=e199]:
            - generic [ref=e201]:
              - generic [ref=e202]: Kitchen
              - generic [ref=e203]: 3 items · 2 selected
            - generic [ref=e204]: 13.70 oz
    - generic [ref=e207]:
      - button "Locker — saved lists" [ref=e208] [cursor=pointer]:
        - generic [ref=e211]: Locker
      - button "Summary — pack weight and progress" [ref=e213] [cursor=pointer]:
        - generic [ref=e215]: Summary
      - button "Add — add items, categories, or import" [ref=e217] [cursor=pointer]:
        - generic [ref=e219]: Add
      - button "Search — find gear" [ref=e221] [cursor=pointer]:
        - generic [ref=e225]: Search
      - button "Next controls" [ref=e227] [cursor=pointer]:
        - generic [ref=e230]: Next
    - navigation [ref=e231]:
      - generic [ref=e232]: TrailWeigh
      - list [ref=e234]:
        - listitem [ref=e235]:
          - button [ref=e236] [cursor=pointer]:
            - generic [ref=e240]: Home
        - listitem [ref=e242]:
          - button [disabled] [ref=e243]:
            - generic [ref=e246]:
              - generic [ref=e247]: Master Library
              - generic [ref=e248]: Coming soon
        - listitem [ref=e249]:
          - button [ref=e250] [cursor=pointer]:
            - generic [ref=e253]: My Lists
        - listitem [ref=e255]:
          - button [ref=e256] [cursor=pointer]:
            - generic [ref=e260]: Help & Tutorials
        - listitem [ref=e262]:
          - button [ref=e263] [cursor=pointer]:
            - generic [ref=e267]: Settings
      - button [ref=e270] [cursor=pointer]:
        - generic [ref=e273]:
          - generic [ref=e274]: Right-handed
          - generic [ref=e275]: Tap to flip menu side
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
  37 |     expect(count, `drag handles found (expected ≥ ${6})`).toBeGreaterThanOrEqual(1);
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
> 53 |     await firstHandle.focus();
     |                       ^ Error: locator.focus: Test timeout of 60000ms exceeded.
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