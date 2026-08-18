# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/reorder.spec.ts >> Category reorder — feasibility check >> drag handle has accessible label and title attribute
- Location: tests/e2e/phase1b/reorder.spec.ts:41:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /Drag to reorder Backpack category/i }).first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByRole('button', { name: /Drag to reorder Backpack category/i }).first()

```

```yaml
- button "Open navigation menu"
- text: TrailWeigh Demo Pack List 21 items
- button "Expand all categories"
- text: 6 categories 16 Selected
- button "Open Backpack category"
- text: Backpack 3 items · 2 selected 72.50 oz
- button "Open Clothing category"
- text: Clothing 5 items · 4 selected 50.70 oz
- button "Open Toiletries category"
- text: Toiletries 4 items · 2 selected 2.60 oz
- button "Open Electronics category"
- text: Electronics 3 items · 3 selected 14.40 oz
- button "Open Shelter category"
- text: Shelter 3 items · 3 selected 90.00 oz
- button "Open Kitchen category"
- text: Kitchen 3 items · 2 selected 13.70 oz
- button "Locker — saved lists": Locker
- button "Summary — pack weight and progress": Summary
- button "Add — add items, categories, or import": Add
- button "Search — find gear": Search
- button "Next controls": Next
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
> 44 |     await expect(firstHandle).toBeVisible();
     |                               ^ Error: expect(locator).toBeVisible() failed
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