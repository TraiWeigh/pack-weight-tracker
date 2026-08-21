# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/r0101-category-anchor-restore.spec.ts >> R0101 anchors a short final category and restores scroll at 360×800
- Location: tests/e2e/phase1b/r0101-category-anchor-restore.spec.ts:15:7

# Error details

```
Error: expect(received).toBeCloseTo(expected, precision)

Expected: 190
Received: 130

Expected precision:    0
Expected difference: < 0.5
Received difference:   60
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
      - button "Collapse all categories" [ref=e58] [cursor=pointer]
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
      - generic [ref=e192]:
        - generic [ref=e194]:
          - button [ref=e195] [cursor=pointer]: Edit
          - button [ref=e199] [cursor=pointer]: Delete
          - generic [ref=e204] [cursor=pointer]:
            - button "Close Kitchen category" [expanded] [active] [ref=e205]
            - generic [ref=e211]:
              - generic [ref=e213]:
                - generic [ref=e214]: Kitchen
                - generic [ref=e215]: 3 items · 2 selected
              - generic [ref=e216]: 13.70 oz
        - generic [ref=e217]:
          - generic [ref=e219]:
            - button [ref=e220] [cursor=pointer]: Edit
            - button [ref=e224] [cursor=pointer]: Delete
            - generic [ref=e229]:
              - 'checkbox "Jetboil Stove: selected for checklist" [checked] [ref=e230] [cursor=pointer]'
              - button "Jetboil Stove — expand details" [ref=e231] [cursor=pointer]:
                - generic [ref=e232]: Jetboil Stove
                - generic [ref=e233]: "1"
          - generic [ref=e235]:
            - button [ref=e236] [cursor=pointer]: Edit
            - button [ref=e240] [cursor=pointer]: Delete
            - generic [ref=e245]:
              - 'checkbox "Titanium Spork: selected for checklist" [checked] [ref=e246] [cursor=pointer]'
              - button "Titanium Spork — expand details" [ref=e247] [cursor=pointer]:
                - generic [ref=e248]: Titanium Spork
                - generic [ref=e249]: "1"
          - generic [ref=e251]:
            - button [ref=e252] [cursor=pointer]: Edit
            - button [ref=e256] [cursor=pointer]: Delete
            - generic [ref=e261]:
              - 'checkbox "Freeze Dried Meals: not selected for checklist" [ref=e262] [cursor=pointer]'
              - button "Freeze Dried Meals — expand details" [ref=e263] [cursor=pointer]:
                - generic [ref=e264]: Freeze Dried Meals
                - generic [ref=e265]: "5"
        - button "Add item to Kitchen" [ref=e267] [cursor=pointer]:
          - generic [ref=e269]: Add Item
    - generic [ref=e272]:
      - button "Locker — saved lists" [ref=e273] [cursor=pointer]:
        - generic [ref=e276]: Locker
      - button "Summary — pack weight and progress" [ref=e278] [cursor=pointer]:
        - generic [ref=e280]: Summary
      - button "Add — add items, categories, or import" [ref=e282] [cursor=pointer]:
        - generic [ref=e284]: Add
      - button "Search — find gear" [ref=e286] [cursor=pointer]:
        - generic [ref=e290]: Search
      - button "Next controls" [ref=e292] [cursor=pointer]:
        - generic [ref=e293]: Next
    - navigation [ref=e297]:
      - generic [ref=e298]: TrailWeigh
      - list [ref=e300]:
        - listitem [ref=e301]:
          - button [ref=e302] [cursor=pointer]:
            - generic [ref=e306]: Home
        - listitem [ref=e308]:
          - button [disabled] [ref=e309]:
            - generic [ref=e312]:
              - generic [ref=e313]: Master Library
              - generic [ref=e314]: Coming soon
        - listitem [ref=e315]:
          - button [ref=e316] [cursor=pointer]:
            - generic [ref=e319]: My Lists
        - listitem [ref=e321]:
          - button [ref=e322] [cursor=pointer]:
            - generic [ref=e326]: Help & Tutorials
        - listitem [ref=e328]:
          - button [ref=e329] [cursor=pointer]:
            - generic [ref=e333]: Settings
      - button [ref=e336] [cursor=pointer]:
        - generic [ref=e339]:
          - generic [ref=e340]: Right-handed
          - generic [ref=e341]: Tap to flip menu side
  - region "Notifications (F8)":
    - list
```

# Test source

```ts
  1  | /**
  2  |  * R0101 — any category anchors beneath the locked Filter and restores the
  3  |  * outer category scroller's pre-open position on close.
  4  |  */
  5  | import { test, expect, gotoDemo, expectClean } from '../helpers/trailweigh';
  6  | 
  7  | type Viewport = { width: number; height: number };
  8  | 
  9  | for (const viewport of [
  10 |   { width: 402, height: 714 },
  11 |   { width: 402, height: 754 },
  12 |   { width: 390, height: 844 },
  13 |   { width: 360, height: 800 },
  14 | ] satisfies Viewport[]) {
  15 |   test(`R0101 anchors a short final category and restores scroll at ${viewport.width}×${viewport.height}`, async ({ page, errors }) => {
  16 |     await page.setViewportSize(viewport);
  17 |     await gotoDemo(page);
  18 |     await expect(page.getByTestId('filter-bar')).toBeVisible();
  19 | 
  20 |     const before = await page.evaluate(() => {
  21 |       const main = document.querySelector('[data-testid="main-scroll"]') as HTMLElement;
  22 |       const kitchen = document.querySelector('[data-cat="Kitchen"]') as HTMLElement;
  23 |       return {
  24 |         scrollTop: main.scrollTop,
  25 |         scrollHeight: main.scrollHeight,
  26 |         clientHeight: main.clientHeight,
  27 |         kitchenTop: kitchen.getBoundingClientRect().top,
  28 |       };
  29 |     });
  30 | 
  31 |     await page.getByRole('button', { name: 'Open Kitchen category' }).click();
  32 |     await expect(page.getByTestId('active-category-bar')).toBeVisible();
  33 |     await expect(page.getByTestId('filter-bar')).toBeVisible();
  34 | 
  35 |     const anchored = await page.waitForFunction(() => {
  36 |       const filter = document.querySelector('[data-testid="filter-bar"]')?.getBoundingClientRect();
  37 |       const active = document.querySelector('[data-testid="active-category-bar"]')?.getBoundingClientRect();
  38 |       const main = document.querySelector('[data-testid="main-scroll"]') as HTMLElement | null;
  39 |       return !!filter && !!active && !!main &&
  40 |         Math.abs(active.top - filter.bottom) <= 1 &&
  41 |         main.scrollTop > 0;
  42 |     }, undefined, { timeout: 3000 });
  43 |     expect(await anchored).toBeTruthy();
  44 | 
  45 |     const openState = await page.evaluate(() => {
  46 |       const filter = document.querySelector('[data-testid="filter-bar"]')!.getBoundingClientRect();
  47 |       const active = document.querySelector('[data-testid="active-category-bar"]')!.getBoundingClientRect();
  48 |       const main = document.querySelector('[data-testid="main-scroll"]') as HTMLElement;
  49 |       const style = getComputedStyle(main);
  50 |       return {
  51 |         filterTop: filter.top,
  52 |         filterBottom: filter.bottom,
  53 |         activeTop: active.top,
  54 |         scrollTop: main.scrollTop,
  55 |         overflowY: style.overflowY,
  56 |         trailingSpace: document.querySelector('[data-testid="category-trailing-scroll-space"]')?.getBoundingClientRect().height ?? 0,
  57 |       };
  58 |     });
  59 |     expect(openState.activeTop).toBeCloseTo(openState.filterBottom, 0);
  60 |     expect(openState.scrollTop).toBeGreaterThan(0);
  61 |     expect(openState.overflowY).toBe('auto');
  62 |     expect(openState.trailingSpace).toBe(560);
  63 | 
  64 |     // The short category remains anchored while the dedicated outer category
  65 |     // scroller moves through the middle region.
  66 |     await page.evaluate(() => {
  67 |       const main = document.querySelector('[data-testid="main-scroll"]') as HTMLElement;
  68 |       main.scrollTop += 60;
  69 |       main.dispatchEvent(new Event('scroll', { bubbles: true }));
  70 |     });
  71 |     await page.waitForTimeout(80);
  72 |     const duringScroll = await page.getByTestId('active-category-bar').evaluate(el => ({
  73 |       top: el.getBoundingClientRect().top,
  74 |       filterBottom: document.querySelector('[data-testid="filter-bar"]')!.getBoundingClientRect().bottom,
  75 |     }));
> 76 |     expect(duringScroll.top).toBeCloseTo(duringScroll.filterBottom, 0);
     |                              ^ Error: expect(received).toBeCloseTo(expected, precision)
  77 | 
  78 |     await page.getByRole('button', { name: 'Close Kitchen category' }).click();
  79 |     await expect(page.getByTestId('filter-bar')).toBeVisible();
  80 |     await page.waitForTimeout(100);
  81 |     const after = await page.evaluate(() => ({
  82 |       scrollTop: (document.querySelector('[data-testid="main-scroll"]') as HTMLElement).scrollTop,
  83 |       windowScroll: window.scrollY,
  84 |       documentScroll: document.documentElement.scrollTop,
  85 |       bodyScroll: document.body.scrollTop,
  86 |     }));
  87 |     expect(after.scrollTop).toBeCloseTo(before.scrollTop, 0);
  88 |     expect(after.windowScroll).toBe(0);
  89 |     expect(after.documentScroll).toBe(0);
  90 |     expect(after.bodyScroll).toBe(0);
  91 |     expectClean(errors);
  92 |   });
  93 | }
```