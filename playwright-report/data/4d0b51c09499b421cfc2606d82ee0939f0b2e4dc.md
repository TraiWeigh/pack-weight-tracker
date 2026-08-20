# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/print.spec.ts >> Print control >> Print button in More menu calls window.print (stubbed)
- Location: tests/e2e/phase1b/print.spec.ts:33:7

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
    - generic [ref=e46]:
      - generic [ref=e53]:
        - generic [ref=e54]: Demo Pack List
        - generic [ref=e55]:
          - generic [ref=e56]: "21"
          - generic [ref=e57]: items
      - button "Expand all categories" [ref=e58] [cursor=pointer]
      - generic [ref=e61]:
        - generic [ref=e62]: 6 categories
        - generic [ref=e63]: 16 Selected
    - toolbar "Checklist filter" [ref=e68]:
      - 'button "Filter: category" [ref=e69] [cursor=pointer]':
        - generic [ref=e70]: "Filter: Category"
    - generic [ref=e75]:
      - generic [ref=e78]:
        - button [ref=e79] [cursor=pointer]: Edit
        - button [ref=e83] [cursor=pointer]: Delete
        - generic [ref=e88] [cursor=pointer]:
          - button "Open Backpack category" [ref=e89]
          - generic [ref=e94]:
            - generic [ref=e96]:
              - generic [ref=e97]: Backpack
              - generic [ref=e98]: 3 items · 2 selected
            - generic [ref=e99]: 72.50 oz
      - generic [ref=e102]:
        - button [ref=e103] [cursor=pointer]: Edit
        - button [ref=e107] [cursor=pointer]: Delete
        - generic [ref=e112] [cursor=pointer]:
          - button "Open Clothing category" [ref=e113]
          - generic [ref=e116]:
            - generic [ref=e118]:
              - generic [ref=e119]: Clothing
              - generic [ref=e120]: 5 items · 4 selected
            - generic [ref=e121]: 50.70 oz
      - generic [ref=e124]:
        - button [ref=e125] [cursor=pointer]: Edit
        - button [ref=e129] [cursor=pointer]: Delete
        - generic [ref=e134] [cursor=pointer]:
          - button "Open Toiletries category" [ref=e135]
          - generic [ref=e140]:
            - generic [ref=e142]:
              - generic [ref=e143]: Toiletries
              - generic [ref=e144]: 4 items · 2 selected
            - generic [ref=e145]: 2.60 oz
      - generic [ref=e148]:
        - button [ref=e149] [cursor=pointer]: Edit
        - button [ref=e153] [cursor=pointer]: Delete
        - generic [ref=e158] [cursor=pointer]:
          - button "Open Electronics category" [ref=e159]
          - generic [ref=e162]:
            - generic [ref=e164]:
              - generic [ref=e165]: Electronics
              - generic [ref=e166]: 3 items · 3 selected
            - generic [ref=e167]: 14.40 oz
      - generic [ref=e170]:
        - button [ref=e171] [cursor=pointer]: Edit
        - button [ref=e175] [cursor=pointer]: Delete
        - generic [ref=e180] [cursor=pointer]:
          - button "Open Shelter category" [ref=e181]
          - generic [ref=e186]:
            - generic [ref=e188]:
              - generic [ref=e189]: Shelter
              - generic [ref=e190]: 3 items · 3 selected
            - generic [ref=e191]: 90.00 oz
      - generic [ref=e194]:
        - button [ref=e195] [cursor=pointer]: Edit
        - button [ref=e199] [cursor=pointer]: Delete
        - generic [ref=e204] [cursor=pointer]:
          - button "Open Kitchen category" [ref=e205]
          - generic [ref=e211]:
            - generic [ref=e213]:
              - generic [ref=e214]: Kitchen
              - generic [ref=e215]: 3 items · 2 selected
            - generic [ref=e216]: 13.70 oz
    - generic [ref=e219]:
      - button "Locker — saved lists" [ref=e220] [cursor=pointer]:
        - generic [ref=e223]: Locker
      - button "Summary — pack weight and progress" [ref=e225] [cursor=pointer]:
        - generic [ref=e227]: Summary
      - button "Add — add items, categories, or import" [ref=e229] [cursor=pointer]:
        - generic [ref=e231]: Add
      - button "Search — find gear" [ref=e233] [cursor=pointer]:
        - generic [ref=e237]: Search
      - button "Next controls" [ref=e239] [cursor=pointer]:
        - generic [ref=e240]: Next
    - navigation [ref=e244]:
      - generic [ref=e245]: TrailWeigh
      - list [ref=e247]:
        - listitem [ref=e248]:
          - button [ref=e249] [cursor=pointer]:
            - generic [ref=e253]: Home
        - listitem [ref=e255]:
          - button [disabled] [ref=e256]:
            - generic [ref=e259]:
              - generic [ref=e260]: Master Library
              - generic [ref=e261]: Coming soon
        - listitem [ref=e262]:
          - button [ref=e263] [cursor=pointer]:
            - generic [ref=e266]: My Lists
        - listitem [ref=e268]:
          - button [ref=e269] [cursor=pointer]:
            - generic [ref=e273]: Help & Tutorials
        - listitem [ref=e275]:
          - button [ref=e276] [cursor=pointer]:
            - generic [ref=e280]: Settings
      - button [ref=e283] [cursor=pointer]:
        - generic [ref=e286]:
          - generic [ref=e287]: Right-handed
          - generic [ref=e288]: Tap to flip menu side
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