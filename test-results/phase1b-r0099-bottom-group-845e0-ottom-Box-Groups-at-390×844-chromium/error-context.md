# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/r0099-bottom-group-loop.spec.ts >> R0099 loops Bottom Box Groups at 390×844
- Location: tests/e2e/phase1b/r0099-bottom-group-loop.spec.ts:83:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('[data-testid="bottom-nav"] [data-group-active="true"]').getByTestId('bottom-back-chevron')

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
  1   | /**
  2   |  * R0099 — Bottom Box Groups continuous looping regression coverage.
  3   |  *
  4   |  * The current bar has four groups. This suite verifies button, keyboard, and
  5   |  * horizontal swipe paths without changing the bar's geometry or shell owner.
  6   |  */
  7   | import { test, expect } from '../helpers/trailweigh';
  8   | 
  9   | const VIEWPORTS = [
  10  |   { width: 402, height: 714 },
  11  |   { width: 402, height: 754 },
  12  |   { width: 390, height: 844 },
  13  |   { width: 360, height: 800 },
  14  | ];
  15  | 
  16  | const GROUP_COUNT = 4;
  17  | 
  18  | function activeGroup(page: import('@playwright/test').Page) {
  19  |   return page.locator('[data-testid="bottom-nav"] [data-group-active="true"]');
  20  | }
  21  | 
  22  | async function groupIndex(page: import('@playwright/test').Page) {
  23  |   return Number(await activeGroup(page).getAttribute('data-group-idx'));
  24  | }
  25  | 
  26  | async function next(page: import('@playwright/test').Page) {
  27  |   await activeGroup(page).getByTestId('bottom-next-chevron').click();
  28  |   await page.waitForTimeout(430);
  29  | }
  30  | 
  31  | async function back(page: import('@playwright/test').Page) {
> 32  |   await activeGroup(page).getByTestId('bottom-back-chevron').click();
      |                                                              ^ Error: locator.click: Test timeout of 60000ms exceeded.
  33  |   await page.waitForTimeout(430);
  34  | }
  35  | 
  36  | async function shell(page: import('@playwright/test').Page) {
  37  |   return page.evaluate(() => {
  38  |     const rect = (selector: string) => {
  39  |       const el = document.querySelector(selector) as HTMLElement;
  40  |       const r = el.getBoundingClientRect();
  41  |       return { top: r.top, bottom: r.bottom, height: r.height };
  42  |     };
  43  |     return {
  44  |       app: rect('[data-testid="app-bar"]'),
  45  |       summary: rect('[data-testid="list-summary-bar"]'),
  46  |       filter: rect('[data-testid="filter-bar"]'),
  47  |       main: rect('[data-testid="main-scroll"]'),
  48  |       nav: rect('[data-testid="bottom-nav"]'),
  49  |       rootWidth: (document.querySelector('.tw-v3-root') as HTMLElement).getBoundingClientRect().width,
  50  |       documentWidth: document.documentElement.scrollWidth,
  51  |       wedgeGap: (() => {
  52  |         const wedges = Array.from(document.querySelectorAll<HTMLElement>('[data-cat] [data-testid^="cat-header-"] > button'));
  53  |         return wedges.length > 1
  54  |           ? wedges[1].getBoundingClientRect().top - wedges[0].getBoundingClientRect().bottom
  55  |           : null;
  56  |       })(),
  57  |       homeGap: (() => {
  58  |         const buttons = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="home-content-scroll"] button[aria-label^="Start Here"], [data-testid="home-content-scroll"] button[aria-label^="Tutorials"]'));
  59  |         return buttons.length > 1
  60  |           ? buttons[1].getBoundingClientRect().top - buttons[0].getBoundingClientRect().bottom
  61  |           : null;
  62  |       })(),
  63  |     };
  64  |   });
  65  | }
  66  | 
  67  | async function swipe(page: import('@playwright/test').Page, direction: 'forward' | 'reverse') {
  68  |   const box = await activeGroup(page).getByTestId(
  69  |     direction === 'forward' ? 'bottom-next-chevron-content' : 'bottom-back-chevron-content',
  70  |   ).boundingBox();
  71  |   expect(box).not.toBeNull();
  72  |   const y = box!.y + box!.height / 2;
  73  |   const startX = direction === 'forward' ? box!.x + 4 : box!.x + box!.width - 4;
  74  |   const endX = direction === 'forward' ? startX - 100 : startX + 100;
  75  |   await page.mouse.move(startX, y);
  76  |   await page.mouse.down();
  77  |   await page.mouse.move(endX, y, { steps: 4 });
  78  |   await page.mouse.up();
  79  |   await page.waitForTimeout(430);
  80  | }
  81  | 
  82  | for (const viewport of VIEWPORTS) {
  83  |   test(`R0099 loops Bottom Box Groups at ${viewport.width}×${viewport.height}`, async ({ page, errors }) => {
  84  |     await page.setViewportSize(viewport);
  85  |     await page.goto('/mobile-functional-v3');
  86  |     await page.waitForSelector('[data-testid="bottom-nav"]');
  87  |     await page.waitForSelector('[data-testid="main-scroll"]');
  88  | 
  89  |     const initialShell = await shell(page);
  90  |     expect(await groupIndex(page)).toBe(0);
  91  | 
  92  |     const forwardSequence: number[] = [0];
  93  |     for (let i = 0; i < GROUP_COUNT; i++) {
  94  |       await next(page);
  95  |       forwardSequence.push(await groupIndex(page));
  96  |     }
  97  |     expect(forwardSequence).toEqual([0, 1, 2, 3, 0]);
  98  |     if (viewport.width === 402 && viewport.height === 714) {
  99  |       await page.screenshot({ path: 'reports/r0099/screenshots/01-forward-wrap-first-group-402x714.png', fullPage: false });
  100 |     }
  101 | 
  102 |     const reverseSequence: number[] = [0];
  103 |     for (let i = 0; i < GROUP_COUNT; i++) {
  104 |       await back(page);
  105 |       reverseSequence.push(await groupIndex(page));
  106 |     }
  107 |     expect(reverseSequence).toEqual([0, 3, 2, 1, 0]);
  108 |     if (viewport.width === 402 && viewport.height === 714) {
  109 |       await page.screenshot({ path: 'reports/r0099/screenshots/02-reverse-wrap-last-group-402x714.png', fullPage: false });
  110 |     }
  111 | 
  112 |     for (let cycle = 0; cycle < 3; cycle++) {
  113 |       for (let i = 0; i < GROUP_COUNT; i++) await next(page);
  114 |       expect(await groupIndex(page)).toBe(0);
  115 |     }
  116 |     for (let cycle = 0; cycle < 3; cycle++) {
  117 |       for (let i = 0; i < GROUP_COUNT; i++) await back(page);
  118 |       expect(await groupIndex(page)).toBe(0);
  119 |     }
  120 | 
  121 |     await next(page);
  122 |     await activeGroup(page).getByTestId('bottom-back-chevron').press('Enter');
  123 |     await page.waitForTimeout(430);
  124 |     expect(await groupIndex(page)).toBe(0);
  125 | 
  126 |     await swipe(page, 'forward');
  127 |     expect(await groupIndex(page)).toBe(1);
  128 |     await swipe(page, 'reverse');
  129 |     expect(await groupIndex(page)).toBe(0);
  130 |     await swipe(page, 'reverse');
  131 |     expect(await groupIndex(page)).toBe(3);
  132 |     if (viewport.width === 402 && viewport.height === 714) {
```