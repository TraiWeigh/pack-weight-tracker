# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/r0100-wedge-shadow.spec.ts >> R0100 keeps wedge-only shadow and shell geometry at 390×844
- Location: tests/e2e/phase1b/r0100-wedge-shadow.spec.ts:17:7

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 3

- Array []
+ Array [
+   "503 POST https://causal-urchin-55.clerk.accounts.dev/v1/environment?__clerk_api_version=2026-05-12&_clerk_js_version=6.29.2&_method=PATCH&__clerk_db_jwt=dvb_3IGagAAQFGjQODPgAZDZxms4l2O",
+ ]
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
  4   |  * Verifies the shadow belongs to the clipped wedge button only and that the
  5   |  * R0098/R0097 geometry remains unchanged at the required mobile viewports.
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
  16  | for (const viewport of VIEWPORTS) {
  17  |   test(`R0100 keeps wedge-only shadow and shell geometry at ${viewport.width}×${viewport.height}`, async ({ page, errors }) => {
  18  |     await page.setViewportSize(viewport);
  19  |     await page.goto('/mobile-functional-v3');
  20  |     await page.waitForSelector('[data-testid="main-scroll"]');
  21  | 
  22  |     const metrics = await page.evaluate(() => {
  23  |       const rect = (selector: string) => {
  24  |         const el = document.querySelector(selector) as HTMLElement;
  25  |         const r = el.getBoundingClientRect();
  26  |         return { top: r.top, bottom: r.bottom, height: r.height, left: r.left, right: r.right, width: r.width };
  27  |       };
  28  |       const wedges = Array.from(document.querySelectorAll<HTMLElement>(
  29  |         '[data-cat] [data-testid^="cat-header-"] > button',
  30  |       ));
  31  |       const rows = Array.from(document.querySelectorAll<HTMLElement>('[data-cat]'));
  32  |       const firstWedge = wedges[0];
  33  |       const secondWedge = wedges[1];
  34  |       const firstRow = rows[0];
  35  |       const wedgeShadow = document.querySelector<HTMLElement>('[data-testid^="cat-wedge-shadow-"]');
  36  |       const weight = document.querySelector<HTMLElement>('[data-cat] [data-testid^="cat-header-"] > div > div:last-child');
  37  |       const firstWedgeRect = firstWedge.getBoundingClientRect();
  38  |       const secondWedgeRect = secondWedge.getBoundingClientRect();
  39  |       return {
  40  |         wedgeCount: wedges.length,
  41  |         wedgeFilter: getComputedStyle(firstWedge).filter,
  42  |         wedgeBoxShadow: getComputedStyle(firstWedge).boxShadow,
  43  |         wedgeShadow: wedgeShadow ? {
  44  |           filter: getComputedStyle(wedgeShadow).filter,
  45  |           width: wedgeShadow.getBoundingClientRect().width,
  46  |           height: wedgeShadow.getBoundingClientRect().height,
  47  |           pointerEvents: getComputedStyle(wedgeShadow).pointerEvents,
  48  |           insideSwipeRow: !!wedgeShadow.closest('[data-swipe-key]'),
  49  |           insideCatHeader: !!wedgeShadow.closest('[data-testid^="cat-header-"]'),
  50  |           buttonZIndex: getComputedStyle(firstWedge).zIndex,
  51  |           parentPosition: getComputedStyle(wedgeShadow.parentElement!).position,
  52  |         } : null,
  53  |         rowBoxShadow: getComputedStyle(firstRow).boxShadow,
  54  |         wedge: {
  55  |           first: { ...rect('[data-cat] [data-testid^="cat-header-"] > button') },
  56  |           secondTop: secondWedgeRect.top,
  57  |           firstBottom: firstWedgeRect.bottom,
  58  |         },
  59  |         rowHeight: firstRow.getBoundingClientRect().height,
  60  |         weightRight: weight?.getBoundingClientRect().right ?? null,
  61  |         shell: {
  62  |           app: rect('[data-testid="app-bar"]'),
  63  |           summary: rect('[data-testid="list-summary-bar"]'),
  64  |           filter: rect('[data-testid="filter-bar"]'),
  65  |           main: rect('[data-testid="main-scroll"]'),
  66  |           nav: rect('[data-testid="bottom-nav"]'),
  67  |         },
  68  |         rootWidth: document.querySelector<HTMLElement>('.tw-v3-root')!.getBoundingClientRect().width,
  69  |         documentWidth: document.documentElement.scrollWidth,
  70  |       };
  71  |     });
  72  | 
  73  |     expect(metrics.wedgeCount).toBeGreaterThan(1);
  74  |     expect(metrics.wedgeFilter).toBe('none');
  75  |     expect(metrics.wedgeShadow).not.toBeNull();
  76  |     expect(metrics.wedgeShadow!.filter).toContain('drop-shadow');
  77  |     expect(metrics.wedgeShadow!.filter).toContain('rgba(0, 0, 0, 0.07)');
  78  |     expect(metrics.wedgeShadow!.filter).toContain('3px 0px 10px');
  79  |     expect(metrics.wedgeShadow!.width).toBe(72);
  80  |     expect(metrics.wedgeShadow!.height).toBe(64);
  81  |     expect(metrics.wedgeShadow!.pointerEvents).toBe('none');
  82  |     expect(metrics.wedgeShadow!.insideSwipeRow).toBe(true);
  83  |     expect(metrics.wedgeShadow!.insideCatHeader).toBe(true);
  84  |     expect(metrics.wedgeShadow!.buttonZIndex).toBe('1');
  85  |     expect(metrics.wedgeShadow!.parentPosition).toBe('relative');
  86  |     expect(metrics.wedgeBoxShadow).toBe('none');
  87  |     expect(metrics.rowBoxShadow).toContain('0px 3px 10px');
  88  |     expect(metrics.wedge.first.width).toBe(72);
  89  |     expect(metrics.wedge.first.height).toBe(64);
  90  |     expect(metrics.wedge.first.left).toBe(0);
  91  |     expect(metrics.wedge.first.right).toBe(72);
  92  |     expect(metrics.wedge.secondTop - metrics.wedge.firstBottom).toBe(1);
  93  |     expect(metrics.rowHeight).toBe(65);
  94  |     expect(metrics.weightRight).toBe(viewport.width - 44);
  95  |     expect(metrics.rootWidth).toBe(viewport.width);
  96  |     expect(metrics.documentWidth).toBe(viewport.width);
  97  |     expect(metrics.shell.app.height).toBe(52);
  98  |     expect(metrics.shell.summary.height).toBeCloseTo(88.25, 1);
  99  |     expect(metrics.shell.filter.height).toBe(50);
  100 |     expect(metrics.shell.nav.height).toBe(58);
  101 |     expect(metrics.shell.app.top).toBe(0);
  102 |     expect(metrics.shell.nav.bottom).toBe(viewport.height);
  103 |     expect(errors.pageErrors).toEqual([]);
> 104 |     expect(errors.serverErrors).toEqual([]);
      |                                 ^ Error: expect(received).toEqual(expected) // deep equality
  105 |     expect(errors.consoleErrors).toEqual([]);
  106 | 
  107 |     if (viewport.width === 402 && viewport.height === 714) {
  108 |       await page.screenshot({
  109 |         path: 'reports/r0100/screenshots/01-wedge-shadow-402x714.png',
  110 |         fullPage: false,
  111 |       });
  112 |     }
  113 |   });
  114 | }
```