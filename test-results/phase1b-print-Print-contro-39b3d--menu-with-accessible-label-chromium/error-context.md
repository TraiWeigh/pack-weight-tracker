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
    - generic [ref=e5]: TrailWeigh
    - generic [ref=e42]:
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
      - generic [ref=e68]:
        - generic [ref=e70]:
          - button [ref=e71] [cursor=pointer]: Delete
          - generic [ref=e76]:
            - button "Open Backpack category" [ref=e77] [cursor=pointer]
            - generic [ref=e82]:
              - button "Category options for Backpack" [ref=e84] [cursor=pointer]:
                - generic [ref=e85]: Backpack
                - generic [ref=e86]: 3 items · 2 selected
              - generic [ref=e87]: 72.50 oz
        - generic [ref=e89]:
          - button [ref=e90] [cursor=pointer]: Delete
          - generic [ref=e95]:
            - button "Open Clothing category" [ref=e96] [cursor=pointer]
            - generic [ref=e99]:
              - button "Category options for Clothing" [ref=e101] [cursor=pointer]:
                - generic [ref=e102]: Clothing
                - generic [ref=e103]: 5 items · 4 selected
              - generic [ref=e104]: 50.70 oz
        - generic [ref=e106]:
          - button [ref=e107] [cursor=pointer]: Delete
          - generic [ref=e112]:
            - button "Open Toiletries category" [ref=e113] [cursor=pointer]
            - generic [ref=e118]:
              - button "Category options for Toiletries" [ref=e120] [cursor=pointer]:
                - generic [ref=e121]: Toiletries
                - generic [ref=e122]: 4 items · 2 selected
              - generic [ref=e123]: 2.60 oz
        - generic [ref=e125]:
          - button [ref=e126] [cursor=pointer]: Delete
          - generic [ref=e131]:
            - button "Open Electronics category" [ref=e132] [cursor=pointer]
            - generic [ref=e135]:
              - button "Category options for Electronics" [ref=e137] [cursor=pointer]:
                - generic [ref=e138]: Electronics
                - generic [ref=e139]: 3 items · 3 selected
              - generic [ref=e140]: 14.40 oz
        - generic [ref=e142]:
          - button [ref=e143] [cursor=pointer]: Delete
          - generic [ref=e148]:
            - button "Open Shelter category" [ref=e149] [cursor=pointer]
            - generic [ref=e154]:
              - button "Category options for Shelter" [ref=e156] [cursor=pointer]:
                - generic [ref=e157]: Shelter
                - generic [ref=e158]: 3 items · 3 selected
              - generic [ref=e159]: 90.00 oz
        - generic [ref=e161]:
          - button [ref=e162] [cursor=pointer]: Delete
          - generic [ref=e167]:
            - button "Open Kitchen category" [ref=e168] [cursor=pointer]
            - generic [ref=e174]:
              - button "Category options for Kitchen" [ref=e176] [cursor=pointer]:
                - generic [ref=e177]: Kitchen
                - generic [ref=e178]: 3 items · 2 selected
              - generic [ref=e179]: 13.70 oz
    - generic [ref=e182]:
      - button "Locker — saved lists" [ref=e183] [cursor=pointer]:
        - generic [ref=e186]: Locker
      - button "Summary — pack weight and progress" [ref=e188] [cursor=pointer]:
        - generic [ref=e190]: Summary
      - button "Add — add items, categories, or import" [ref=e192] [cursor=pointer]:
        - generic [ref=e194]: Add
      - button "Search — find gear" [ref=e196] [cursor=pointer]:
        - generic [ref=e200]: Search
      - button "Next controls" [ref=e202] [cursor=pointer]:
        - generic [ref=e205]: More
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