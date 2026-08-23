# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/screen-efficiency.spec.ts >> R0088 — restore List Summary, preserve row density >> restores the pre-R0087 Summary at 402×754 without changing fixed layers
- Location: tests/e2e/phase1b/screen-efficiency.spec.ts:58:9

# Error details

```
Error: R0087 category-row density remains unchanged

expect(received).toBe(expected) // Object.is equality

Expected: 8
Received: 7
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
        - generic [ref=e62]: 8 categories
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
        - button [ref=e220] [cursor=pointer]: Edit
        - button [ref=e224] [cursor=pointer]: Delete
        - generic [ref=e229] [cursor=pointer]:
          - button "Open Density 754 A category" [ref=e230]
          - generic [ref=e237]:
            - generic [ref=e238]: Density 754 A
            - generic [ref=e239]: 0 items · 0 selected
      - generic [ref=e242]:
        - button [ref=e243] [cursor=pointer]: Edit
        - button [ref=e247] [cursor=pointer]: Delete
        - generic [ref=e252] [cursor=pointer]:
          - button "Open Density 754 B category" [ref=e253]
          - generic [ref=e260]:
            - generic [ref=e261]: Density 754 B
            - generic [ref=e262]: 0 items · 0 selected
    - generic [ref=e265]:
      - button "Locker — saved lists" [ref=e266] [cursor=pointer]:
        - generic [ref=e269]: Locker
      - button "Summary — pack weight and progress" [ref=e271] [cursor=pointer]:
        - generic [ref=e273]: Summary
      - button "Add — add items, categories, or import" [ref=e275] [cursor=pointer]:
        - generic [ref=e277]: Add
      - button "Search — find gear" [ref=e279] [cursor=pointer]:
        - generic [ref=e283]: Search
      - button "Next controls" [ref=e285] [cursor=pointer]:
        - generic [ref=e286]: Next
    - navigation [ref=e290]:
      - generic [ref=e291]: TrailWeigh
      - list [ref=e293]:
        - listitem [ref=e294]:
          - button [ref=e295] [cursor=pointer]:
            - generic [ref=e299]: Home
        - listitem [ref=e301]:
          - button [disabled] [ref=e302]:
            - generic [ref=e305]:
              - generic [ref=e306]: Master Library
              - generic [ref=e307]: Coming soon
        - listitem [ref=e308]:
          - button [ref=e309] [cursor=pointer]:
            - generic [ref=e312]: My Lists
        - listitem [ref=e314]:
          - button [ref=e315] [cursor=pointer]:
            - generic [ref=e319]: Help & Tutorials
        - listitem [ref=e321]:
          - button [ref=e322] [cursor=pointer]:
            - generic [ref=e326]: Settings
      - button [ref=e329] [cursor=pointer]:
        - generic [ref=e332]:
          - generic [ref=e333]: Right-handed
          - generic [ref=e334]: Tap to flip menu side
    - generic: Category "Density 754 B" added
  - region "Notifications (F8)":
    - list
```

# Test source

```ts
  1   | /**
  2   |  * R0088 — List Summary restoration and preserved R0087 row-density coverage.
  3   |  *
  4   |  * Chromium verifies CSS geometry and interaction safety. It does not reproduce
  5   |  * iPhone Safari browser chrome; Kevin's device remains the final authority.
  6   |  */
  7   | import { test, expect, gotoDemo, addCategory } from '../helpers/trailweigh';
  8   | 
  9   | type DensityMetrics = {
  10  |   viewportWidth: number;
  11  |   appBar: { top: number; bottom: number; height: number } | null;
  12  |   summary: { top: number; bottom: number; height: number } | null;
  13  |   nav: { top: number; bottom: number; height: number } | null;
  14  |   contentHeight: number;
  15  |   completeRows: number;
  16  |   partialRows: number;
  17  |   rowHeights: number[];
  18  |   documentWidth: number;
  19  |   bodyWidth: number;
  20  | };
  21  | 
  22  | async function densityMetrics(page: import('@playwright/test').Page): Promise<DensityMetrics> {
  23  |   return page.evaluate(() => {
  24  |     const rect = (selector: string) => {
  25  |       const element = document.querySelector(selector);
  26  |       if (!element) return null;
  27  |       const value = element.getBoundingClientRect();
  28  |       return { top: value.top, bottom: value.bottom, height: value.height };
  29  |     };
  30  |     const summary = rect('[data-testid="list-summary-bar"]');
  31  |     const nav = rect('[data-testid="bottom-nav"]');
  32  |     const rows = Array.from(document.querySelectorAll<HTMLElement>('[data-cat]'))
  33  |       .map(element => element.getBoundingClientRect());
  34  |     // The fixed Summary's fractional pixel edge can overlap the category border
  35  |     // by 0.25px. Treat a one-pixel edge tolerance as visually complete.
  36  |     const edgeTolerance = 1;
  37  |     const inContent = (row: DOMRect) => summary && nav && row.bottom > summary.bottom && row.top < nav.top;
  38  |     const complete = (row: DOMRect) => summary && nav
  39  |       && row.top >= summary.bottom - edgeTolerance
  40  |       && row.bottom <= nav.top + edgeTolerance;
  41  |     return {
  42  |       viewportWidth: window.innerWidth,
  43  |       appBar: rect('[data-testid="app-bar"]'),
  44  |       summary,
  45  |       nav,
  46  |       contentHeight: summary && nav ? nav.top - summary.bottom : 0,
  47  |       completeRows: rows.filter(complete).length,
  48  |       partialRows: rows.filter(row => inContent(row) && !complete(row)).length,
  49  |       rowHeights: rows.map(row => row.height),
  50  |       documentWidth: document.documentElement.scrollWidth,
  51  |       bodyWidth: document.body.scrollWidth,
  52  |     };
  53  |   });
  54  | }
  55  | 
  56  | test.describe('R0088 — restore List Summary, preserve row density', () => {
  57  |   for (const height of [714, 754]) {
  58  |     test(`restores the pre-R0087 Summary at 402×${height} without changing fixed layers`, async ({ page, errors }) => {
  59  |       await page.setViewportSize({ width: 402, height });
  60  |       await gotoDemo(page);
  61  | 
  62  |       // The demo starts with six categories. Add two through normal UI behavior
  63  |       // to measure the content capacity of a realistically longer checklist.
  64  |       await addCategory(page, `Density ${height} A`);
  65  |       await addCategory(page, `Density ${height} B`);
  66  | 
  67  |       const metrics = await densityMetrics(page);
  68  |       expect(metrics.viewportWidth).toBe(402);
  69  |       expect(metrics.appBar).not.toBeNull();
  70  |       expect(metrics.summary).not.toBeNull();
  71  |       expect(metrics.nav).not.toBeNull();
  72  | 
  73  |       expect(metrics.appBar!.top, 'AppBar remains fixed at the viewport top').toBe(0);
  74  |       expect(metrics.appBar!.height, 'AppBar height must remain protected').toBe(52);
  75  |       expect(metrics.summary!.top, 'Summary remains directly below AppBar').toBe(52);
  76  |       expect(metrics.summary!.height, 'Summary returns to its exact pre-R0087 height range')
  77  |         .toBeGreaterThanOrEqual(88);
  78  |       expect(metrics.summary!.height, 'Summary returns to its exact pre-R0087 height range')
  79  |         .toBeLessThan(89);
  80  |       expect(metrics.nav!.bottom, 'Bottom Box Groups remain fixed to viewport bottom').toBeLessThanOrEqual(height + 1);
  81  |       expect(metrics.nav!.height, 'Bottom Box Groups height remains protected').toBe(58);
  82  | 
  83  |       expect(metrics.contentHeight, 'measured spacer must follow the restored Summary height').toBeGreaterThanOrEqual(
  84  |         height === 714 ? 515 : 555,
  85  |       );
> 86  |       expect(metrics.completeRows, 'R0087 category-row density remains unchanged').toBe(height === 714 ? 7 : 8);
      |                                                                                    ^ Error: R0087 category-row density remains unchanged
  87  |       expect(metrics.partialRows, 'the restored Summary leaves only the expected eighth-row clipping at 402×714').toBe(height === 714 ? 1 : 0);
  88  |       expect(metrics.rowHeights.every(value => value >= 64 && value <= 65), 'category rows remain comfortable 64px mobile targets').toBe(true);
  89  |       expect(metrics.documentWidth).toBeLessThanOrEqual(402);
  90  |       expect(metrics.bodyWidth).toBeLessThanOrEqual(402);
  91  | 
  92  |       const firstWeight = page.getByText('72.50 oz', { exact: true });
  93  |       const weightBox = await firstWeight.boundingBox();
  94  |       expect(weightBox, 'first category weight must render').not.toBeNull();
  95  |       expect(weightBox!.x + weightBox!.width, 'right-edge category weight must remain inside the viewport').toBeLessThanOrEqual(402);
  96  | 
  97  |       const firstCategoryName = page.getByTestId('cat-name-Backpack');
  98  |       await expect(firstCategoryName).toContainText('Backpack');
  99  |       const categoryStyles = await firstCategoryName.evaluate(element => {
  100 |         const title = element.firstElementChild;
  101 |         const style = title ? getComputedStyle(title) : null;
  102 |         return {
  103 |           minHeight: getComputedStyle(element).minHeight,
  104 |           overflow: style?.overflow,
  105 |           textOverflow: style?.textOverflow,
  106 |         };
  107 |       });
  108 |       expect(categoryStyles.minHeight).toBe('44px');
  109 |       expect(categoryStyles.overflow).toBe('hidden');
  110 |       expect(categoryStyles.textOverflow).toBe('ellipsis');
  111 |       expect(errors.pageErrors).toEqual([]);
  112 |     });
  113 |   }
  114 | 
  115 |   test('keeps category interaction and the Home fixed hero usable after Summary restoration', async ({ page, errors }) => {
  116 |     await page.setViewportSize({ width: 402, height: 714 });
  117 |     await gotoDemo(page);
  118 | 
  119 |     await page.getByRole('button', { name: 'Open Backpack category' }).click();
  120 |     await expect(page.getByRole('button', { name: 'Close Backpack category' })).toBeVisible();
  121 | 
  122 |     await page.getByTestId('hamburger-btn').click();
  123 |     await page.getByRole('button', { name: 'Home', exact: true }).click();
  124 |     const hero = page.getByTestId('home-hero');
  125 |     await expect(hero).toBeVisible();
  126 |     const homeState = await hero.evaluate(element => ({
  127 |       position: getComputedStyle(element).position,
  128 |       top: element.getBoundingClientRect().top,
  129 |       height: element.getBoundingClientRect().height,
  130 |     }));
  131 |     expect(homeState.position).toBe('fixed');
  132 |     expect(homeState.top).toBe(52);
  133 |     expect(homeState.height).toBeGreaterThan(0);
  134 |     expect(errors.pageErrors).toEqual([]);
  135 |   });
  136 | });
```