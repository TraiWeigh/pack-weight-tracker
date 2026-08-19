# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/print.spec.ts >> Print control >> Print entry exists in More menu with accessible label
- Location: tests/e2e/phase1b/print.spec.ts:25:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /^More — settings and tools/ })

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
  2  |  * Phase 1B — Print Control
  3  |  *
  4  |  * Target route: /mobile-functional-v3 (V3 sandbox)
  5  |  * Classification: A — sandbox route.
  6  |  *
  7  |  * Architecture finding: the Print button with aria-label="Print checklist" lives
  8  |  * inside the MobileChecklist overlay component, which is only mounted when the
  9  |  * user has switched to checklist mode. It is NOT present in the default demo
  10 |  * (gear-list) view. R002: the Print entry now lives in the More deck →
  11 |  * "Share & Print" card. All tests use that path.
  12 |  */
  13 | import { test, expect, gotoDemo } from '../helpers/trailweigh';
  14 | 
  15 | const PRINT_NAME = /^Print — Print your gear list/;
  16 | 
  17 | async function openMoreMenu(page: import('@playwright/test').Page) {
> 18 |   await page.getByRole('button', { name: /^More — settings and tools/ }).click();
     |                                                                          ^ Error: locator.click: Test timeout of 60000ms exceeded.
  19 |   await page.getByRole('button', { name: /^Share & Print — open card/ }).click();
  20 |   await expect(page.getByRole('button', { name: PRINT_NAME })).toBeVisible({ timeout: 5000 });
  21 | }
  22 | 
  23 | test.describe('Print control', () => {
  24 | 
  25 |   test('Print entry exists in More menu with accessible label', async ({ page, errors }) => {
  26 |     await gotoDemo(page);
  27 |     await openMoreMenu(page);
  28 |     const printBtn = page.getByRole('button', { name: PRINT_NAME });
  29 |     await expect(printBtn).toBeVisible();
  30 |     expect(errors.pageErrors).toEqual([]);
  31 |   });
  32 | 
  33 |   test('Print button in More menu calls window.print (stubbed)', async ({ page, errors }) => {
  34 |     await page.addInitScript(() => {
  35 |       (window as any).__printCallCount = 0;
  36 |       window.print = () => { (window as any).__printCallCount++; };
  37 |     });
  38 |     await gotoDemo(page);
  39 |     await openMoreMenu(page);
  40 |     await page.getByRole('button', { name: PRINT_NAME }).click();
  41 |     await page.waitForTimeout(300);
  42 |     const callCount = await page.evaluate(() => (window as any).__printCallCount);
  43 |     expect(callCount, 'window.print called once').toBe(1);
  44 |     expect(errors.pageErrors).toEqual([]);
  45 |   });
  46 | 
  47 |   test('Print via More menu calls window.print (stubbed) — second path', async ({ page, errors }) => {
  48 |     await page.addInitScript(() => {
  49 |       (window as any).__printCallCount = 0;
  50 |       window.print = () => { (window as any).__printCallCount++; };
  51 |     });
  52 |     await gotoDemo(page);
  53 |     await page.getByRole('button', { name: /^More — settings and tools/ }).click();
  54 |     await page.getByRole('button', { name: /^Share & Print — open card/ }).click();
  55 |     await expect(page.getByRole('button', { name: PRINT_NAME })).toBeVisible();
  56 |     await page.getByRole('button', { name: PRINT_NAME }).click();
  57 |     await page.waitForTimeout(300);
  58 |     const callCount = await page.evaluate(() => (window as any).__printCallCount);
  59 |     expect(callCount, 'window.print called once via menu').toBe(1);
  60 |     expect(errors.pageErrors).toEqual([]);
  61 |   });
  62 | 
  63 |   test('Print does not navigate away or corrupt list state', async ({ page, errors }) => {
  64 |     await page.addInitScript(() => { window.print = () => {}; });
  65 |     await gotoDemo(page);
  66 |     await openMoreMenu(page);
  67 |     await page.getByRole('button', { name: PRINT_NAME }).click();
  68 |     await page.waitForTimeout(500);
  69 |     // LIST SUMMARY must still be visible — page not navigated away
  70 |     await expect(page.getByText('LIST SUMMARY')).toBeVisible({ timeout: 5000 });
  71 |     expect(errors.pageErrors).toEqual([]);
  72 |   });
  73 | 
  74 |   test('Print does not raise a JS error or page error', async ({ page, errors }) => {
  75 |     await page.addInitScript(() => { window.print = () => {}; });
  76 |     await gotoDemo(page);
  77 |     await openMoreMenu(page);
  78 |     await page.getByRole('button', { name: PRINT_NAME }).click();
  79 |     await page.waitForTimeout(300);
  80 |     expect(errors.pageErrors, 'no uncaught JS errors on print').toEqual([]);
  81 |   });
  82 | 
  83 | });
  84 | 
```