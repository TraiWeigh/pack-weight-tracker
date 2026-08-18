# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/print.spec.ts >> Print control >> Print does not navigate away or corrupt list state
- Location: tests/e2e/phase1b/print.spec.ts:63:7

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
          - button [ref=e73] [cursor=pointer]: Edit
          - button [ref=e77] [cursor=pointer]: Delete
          - generic [ref=e82] [cursor=pointer]:
            - button "Open Backpack category" [ref=e83]
            - generic [ref=e88]:
              - generic [ref=e90]:
                - generic [ref=e91]: Backpack
                - generic [ref=e92]: 3 items · 2 selected
              - generic [ref=e93]: 72.50 oz
        - generic [ref=e95]:
          - button [ref=e96] [cursor=pointer]: Edit
          - button [ref=e100] [cursor=pointer]: Delete
          - generic [ref=e105] [cursor=pointer]:
            - button "Open Clothing category" [ref=e106]
            - generic [ref=e109]:
              - generic [ref=e111]:
                - generic [ref=e112]: Clothing
                - generic [ref=e113]: 5 items · 4 selected
              - generic [ref=e114]: 50.70 oz
        - generic [ref=e116]:
          - button [ref=e117] [cursor=pointer]: Edit
          - button [ref=e121] [cursor=pointer]: Delete
          - generic [ref=e126] [cursor=pointer]:
            - button "Open Toiletries category" [ref=e127]
            - generic [ref=e132]:
              - generic [ref=e134]:
                - generic [ref=e135]: Toiletries
                - generic [ref=e136]: 4 items · 2 selected
              - generic [ref=e137]: 2.60 oz
        - generic [ref=e139]:
          - button [ref=e140] [cursor=pointer]: Edit
          - button [ref=e144] [cursor=pointer]: Delete
          - generic [ref=e149] [cursor=pointer]:
            - button "Open Electronics category" [ref=e150]
            - generic [ref=e153]:
              - generic [ref=e155]:
                - generic [ref=e156]: Electronics
                - generic [ref=e157]: 3 items · 3 selected
              - generic [ref=e158]: 14.40 oz
        - generic [ref=e160]:
          - button [ref=e161] [cursor=pointer]: Edit
          - button [ref=e165] [cursor=pointer]: Delete
          - generic [ref=e170] [cursor=pointer]:
            - button "Open Shelter category" [ref=e171]
            - generic [ref=e176]:
              - generic [ref=e178]:
                - generic [ref=e179]: Shelter
                - generic [ref=e180]: 3 items · 3 selected
              - generic [ref=e181]: 90.00 oz
        - generic [ref=e183]:
          - button [ref=e184] [cursor=pointer]: Edit
          - button [ref=e188] [cursor=pointer]: Delete
          - generic [ref=e193] [cursor=pointer]:
            - button "Open Kitchen category" [ref=e194]
            - generic [ref=e200]:
              - generic [ref=e202]:
                - generic [ref=e203]: Kitchen
                - generic [ref=e204]: 3 items · 2 selected
              - generic [ref=e205]: 13.70 oz
    - generic [ref=e208]:
      - button "Locker — saved lists" [ref=e209] [cursor=pointer]:
        - generic [ref=e212]: Locker
      - button "Summary — pack weight and progress" [ref=e214] [cursor=pointer]:
        - generic [ref=e216]: Summary
      - button "Add — add items, categories, or import" [ref=e218] [cursor=pointer]:
        - generic [ref=e220]: Add
      - button "Search — find gear" [ref=e222] [cursor=pointer]:
        - generic [ref=e226]: Search
      - button "Next controls" [ref=e228] [cursor=pointer]:
        - generic [ref=e231]: Next
    - navigation [ref=e232]:
      - generic [ref=e233]: TrailWeigh
      - list [ref=e235]:
        - listitem [ref=e236]:
          - button [ref=e237] [cursor=pointer]:
            - generic [ref=e241]: Home
        - listitem [ref=e243]:
          - button [disabled] [ref=e244]:
            - generic [ref=e247]:
              - generic [ref=e248]: Master Library
              - generic [ref=e249]: Coming soon
        - listitem [ref=e250]:
          - button [ref=e251] [cursor=pointer]:
            - generic [ref=e254]: My Lists
        - listitem [ref=e256]:
          - button [ref=e257] [cursor=pointer]:
            - generic [ref=e261]: Help & Tutorials
        - listitem [ref=e263]:
          - button [ref=e264] [cursor=pointer]:
            - generic [ref=e268]: Settings
      - button [ref=e271] [cursor=pointer]:
        - generic [ref=e274]:
          - generic [ref=e275]: Right-handed
          - generic [ref=e276]: Tap to flip menu side
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