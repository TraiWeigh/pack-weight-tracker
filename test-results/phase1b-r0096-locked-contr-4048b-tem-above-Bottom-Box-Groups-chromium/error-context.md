# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/r0096-locked-controls.spec.ts >> R0096 — locked mobile control layers >> active bounded category keeps Filter visible and locks Add Item above Bottom Box Groups
- Location: tests/e2e/phase1b/r0096-locked-controls.spec.ts:134:7

# Error details

```
TimeoutError: page.waitForFunction: Timeout 6000ms exceeded.
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
          - generic [ref=e56]: "35"
          - generic [ref=e57]: items
      - button "Collapse all categories" [ref=e58] [cursor=pointer]
      - generic [ref=e61]:
        - generic [ref=e62]: 6 categories
        - generic [ref=e63]: 30 Selected
    - toolbar "Checklist filter" [ref=e68]:
      - 'button "Filter: category" [ref=e69] [cursor=pointer]':
        - generic [ref=e70]: "Filter: Category"
    - generic [ref=e75]:
      - generic [ref=e76]:
        - generic [ref=e78]:
          - button [ref=e79] [cursor=pointer]: Edit
          - button [ref=e83] [cursor=pointer]: Delete
          - generic [ref=e88] [cursor=pointer]:
            - button "Close Backpack category" [expanded] [ref=e89]
            - generic [ref=e94]:
              - generic [ref=e96]:
                - generic [ref=e97]: Backpack
                - generic [ref=e98]: 17 items · 16 selected
              - generic [ref=e99]: 72.50 oz
        - generic [ref=e100]:
          - generic [ref=e102]:
            - button [ref=e103] [cursor=pointer]: Edit
            - button [ref=e107] [cursor=pointer]: Delete
            - generic [ref=e112]:
              - 'checkbox "Osprey Atmos 65: selected for checklist" [checked] [ref=e113] [cursor=pointer]'
              - button "Osprey Atmos 65 — expand details" [ref=e114] [cursor=pointer]:
                - generic [ref=e115]: Osprey Atmos 65
                - generic [ref=e116]: "1"
          - generic [ref=e118]:
            - button [ref=e119] [cursor=pointer]: Edit
            - button [ref=e123] [cursor=pointer]: Delete
            - generic [ref=e128]:
              - 'checkbox "Pack Rain Cover: selected for checklist" [checked] [ref=e129] [cursor=pointer]'
              - button "Pack Rain Cover — expand details" [ref=e130] [cursor=pointer]:
                - generic [ref=e131]: Pack Rain Cover
                - generic [ref=e132]: "1"
          - generic [ref=e134]:
            - button [ref=e135] [cursor=pointer]: Edit
            - button [ref=e139] [cursor=pointer]: Delete
            - generic [ref=e144]:
              - 'checkbox "Dry Bags: not selected for checklist" [ref=e145] [cursor=pointer]'
              - button "Dry Bags — expand details" [ref=e146] [cursor=pointer]:
                - generic [ref=e147]: Dry Bags
                - generic [ref=e148]: "2"
          - generic [ref=e150]:
            - button [ref=e151] [cursor=pointer]: Edit
            - button [ref=e155] [cursor=pointer]: Delete
            - generic [ref=e160]:
              - 'checkbox "Unnamed item: selected for checklist" [checked] [ref=e161] [cursor=pointer]'
              - button "Unnamed item — expand details" [ref=e162] [cursor=pointer]:
                - generic [ref=e163]: Unnamed item
                - generic [ref=e164]: "1"
          - generic [ref=e166]:
            - button [ref=e167] [cursor=pointer]: Edit
            - button [ref=e171] [cursor=pointer]: Delete
            - generic [ref=e176]:
              - 'checkbox "Unnamed item: selected for checklist" [checked] [ref=e177] [cursor=pointer]'
              - button "Unnamed item — expand details" [ref=e178] [cursor=pointer]:
                - generic [ref=e179]: Unnamed item
                - generic [ref=e180]: "1"
          - generic [ref=e182]:
            - button [ref=e183] [cursor=pointer]: Edit
            - button [ref=e187] [cursor=pointer]: Delete
            - generic [ref=e192]:
              - 'checkbox "Unnamed item: selected for checklist" [checked] [ref=e193] [cursor=pointer]'
              - button "Unnamed item — expand details" [ref=e194] [cursor=pointer]:
                - generic [ref=e195]: Unnamed item
                - generic [ref=e196]: "1"
          - generic [ref=e198]:
            - button [ref=e199] [cursor=pointer]: Edit
            - button [ref=e203] [cursor=pointer]: Delete
            - generic [ref=e208]:
              - 'checkbox "Unnamed item: selected for checklist" [checked] [ref=e209] [cursor=pointer]'
              - button "Unnamed item — expand details" [ref=e210] [cursor=pointer]:
                - generic [ref=e211]: Unnamed item
                - generic [ref=e212]: "1"
          - generic [ref=e214]:
            - button [ref=e215] [cursor=pointer]: Edit
            - button [ref=e219] [cursor=pointer]: Delete
            - generic [ref=e224]:
              - 'checkbox "Unnamed item: selected for checklist" [checked] [ref=e225] [cursor=pointer]'
              - button "Unnamed item — expand details" [ref=e226] [cursor=pointer]:
                - generic [ref=e227]: Unnamed item
                - generic [ref=e228]: "1"
          - generic [ref=e230]:
            - button [ref=e231] [cursor=pointer]: Edit
            - button [ref=e235] [cursor=pointer]: Delete
            - generic [ref=e240]:
              - 'checkbox "Unnamed item: selected for checklist" [checked] [ref=e241] [cursor=pointer]'
              - button "Unnamed item — expand details" [ref=e242] [cursor=pointer]:
                - generic [ref=e243]: Unnamed item
                - generic [ref=e244]: "1"
          - generic [ref=e246]:
            - button [ref=e247] [cursor=pointer]: Edit
            - button [ref=e251] [cursor=pointer]: Delete
            - generic [ref=e256]:
              - 'checkbox "Unnamed item: selected for checklist" [checked] [ref=e257] [cursor=pointer]'
              - button "Unnamed item — expand details" [ref=e258] [cursor=pointer]:
                - generic [ref=e259]: Unnamed item
                - generic [ref=e260]: "1"
          - generic [ref=e262]:
            - button [ref=e263] [cursor=pointer]: Edit
            - button [ref=e267] [cursor=pointer]: Delete
            - generic [ref=e272]:
              - 'checkbox "Unnamed item: selected for checklist" [checked] [ref=e273] [cursor=pointer]'
              - button "Unnamed item — expand details" [ref=e274] [cursor=pointer]:
                - generic [ref=e275]: Unnamed item
                - generic [ref=e276]: "1"
          - generic [ref=e278]:
            - button [ref=e279] [cursor=pointer]: Edit
            - button [ref=e283] [cursor=pointer]: Delete
            - generic [ref=e288]:
              - 'checkbox "Unnamed item: selected for checklist" [checked] [ref=e289] [cursor=pointer]'
              - button "Unnamed item — expand details" [ref=e290] [cursor=pointer]:
                - generic [ref=e291]: Unnamed item
                - generic [ref=e292]: "1"
          - generic [ref=e294]:
            - button [ref=e295] [cursor=pointer]: Edit
            - button [ref=e299] [cursor=pointer]: Delete
            - generic [ref=e304]:
              - 'checkbox "Unnamed item: selected for checklist" [checked] [ref=e305] [cursor=pointer]'
              - button "Unnamed item — expand details" [ref=e306] [cursor=pointer]:
                - generic [ref=e307]: Unnamed item
                - generic [ref=e308]: "1"
          - generic [ref=e310]:
            - button [ref=e311] [cursor=pointer]: Edit
            - button [ref=e315] [cursor=pointer]: Delete
            - generic [ref=e320]:
              - 'checkbox "Unnamed item: selected for checklist" [checked] [ref=e321] [cursor=pointer]'
              - button "Unnamed item — expand details" [ref=e322] [cursor=pointer]:
                - generic [ref=e323]: Unnamed item
                - generic [ref=e324]: "1"
          - generic [ref=e326]:
            - button [ref=e327] [cursor=pointer]: Edit
            - button [ref=e331] [cursor=pointer]: Delete
            - generic [ref=e336]:
              - 'checkbox "Unnamed item: selected for checklist" [checked] [ref=e337] [cursor=pointer]'
              - button "Unnamed item — expand details" [ref=e338] [cursor=pointer]:
                - generic [ref=e339]: Unnamed item
                - generic [ref=e340]: "1"
          - generic [ref=e342]:
            - button [ref=e343] [cursor=pointer]: Edit
            - button [ref=e347] [cursor=pointer]: Delete
            - generic [ref=e352]:
              - 'checkbox "Unnamed item: selected for checklist" [checked] [ref=e353] [cursor=pointer]'
              - button "Unnamed item — expand details" [ref=e354] [cursor=pointer]:
                - generic [ref=e355]: Unnamed item
                - generic [ref=e356]: "1"
          - generic [ref=e358]:
            - button [ref=e359] [cursor=pointer]: Edit
            - button [ref=e363] [cursor=pointer]: Delete
            - generic [ref=e368]:
              - 'checkbox "Unnamed item: selected for checklist" [checked] [ref=e369] [cursor=pointer]'
              - button "Unnamed item — expand details" [ref=e370] [cursor=pointer]:
                - generic [ref=e371]: Unnamed item
                - generic [ref=e372]: "1"
        - button "Add item to Backpack" [active] [ref=e374] [cursor=pointer]:
          - generic [ref=e376]: Add Item
      - generic [ref=e379]:
        - button [ref=e380] [cursor=pointer]: Edit
        - button [ref=e384] [cursor=pointer]: Delete
        - generic [ref=e389] [cursor=pointer]:
          - button "Open Clothing category" [ref=e390]
          - generic [ref=e393]:
            - generic [ref=e395]:
              - generic [ref=e396]: Clothing
              - generic [ref=e397]: 5 items · 4 selected
            - generic [ref=e398]: 50.70 oz
      - generic [ref=e401]:
        - button [ref=e402] [cursor=pointer]: Edit
        - button [ref=e406] [cursor=pointer]: Delete
        - generic [ref=e411] [cursor=pointer]:
          - button "Open Toiletries category" [ref=e412]
          - generic [ref=e417]:
            - generic [ref=e419]:
              - generic [ref=e420]: Toiletries
              - generic [ref=e421]: 4 items · 2 selected
            - generic [ref=e422]: 2.60 oz
      - generic [ref=e425]:
        - button [ref=e426] [cursor=pointer]: Edit
        - button [ref=e430] [cursor=pointer]: Delete
        - generic [ref=e435] [cursor=pointer]:
          - button "Open Electronics category" [ref=e436]
          - generic [ref=e439]:
            - generic [ref=e441]:
              - generic [ref=e442]: Electronics
              - generic [ref=e443]: 3 items · 3 selected
            - generic [ref=e444]: 14.40 oz
      - generic [ref=e447]:
        - button [ref=e448] [cursor=pointer]: Edit
        - button [ref=e452] [cursor=pointer]: Delete
        - generic [ref=e457] [cursor=pointer]:
          - button "Open Shelter category" [ref=e458]
          - generic [ref=e463]:
            - generic [ref=e465]:
              - generic [ref=e466]: Shelter
              - generic [ref=e467]: 3 items · 3 selected
            - generic [ref=e468]: 90.00 oz
      - generic [ref=e471]:
        - button [ref=e472] [cursor=pointer]: Edit
        - button [ref=e476] [cursor=pointer]: Delete
        - generic [ref=e481] [cursor=pointer]:
          - button "Open Kitchen category" [ref=e482]
          - generic [ref=e488]:
            - generic [ref=e490]:
              - generic [ref=e491]: Kitchen
              - generic [ref=e492]: 3 items · 2 selected
            - generic [ref=e493]: 13.70 oz
    - generic [ref=e496]:
      - button "Locker — saved lists" [ref=e497] [cursor=pointer]:
        - generic [ref=e500]: Locker
      - button "Summary — pack weight and progress" [ref=e502] [cursor=pointer]:
        - generic [ref=e504]: Summary
      - button "Add — add items, categories, or import" [ref=e506] [cursor=pointer]:
        - generic [ref=e508]: Add
      - button "Search — find gear" [ref=e510] [cursor=pointer]:
        - generic [ref=e514]: Search
      - button "Next controls" [ref=e516] [cursor=pointer]:
        - generic [ref=e517]: Next
    - navigation [ref=e521]:
      - generic [ref=e522]: TrailWeigh
      - list [ref=e524]:
        - listitem [ref=e525]:
          - button [ref=e526] [cursor=pointer]:
            - generic [ref=e530]: Home
        - listitem [ref=e532]:
          - button [disabled] [ref=e533]:
            - generic [ref=e536]:
              - generic [ref=e537]: Master Library
              - generic [ref=e538]: Coming soon
        - listitem [ref=e539]:
          - button [ref=e540] [cursor=pointer]:
            - generic [ref=e543]: My Lists
        - listitem [ref=e545]:
          - button [ref=e546] [cursor=pointer]:
            - generic [ref=e550]: Help & Tutorials
        - listitem [ref=e552]:
          - button [ref=e553] [cursor=pointer]:
            - generic [ref=e557]: Settings
      - button [ref=e560] [cursor=pointer]:
        - generic [ref=e563]:
          - generic [ref=e564]: Right-handed
          - generic [ref=e565]: Tap to flip menu side
  - region "Notifications (F8)":
    - list
```

# Test source

```ts
  1   | /**
  2   |  * R0096 — locked Filter / active-category / Add Item shell slots.
  3   |  *
  4   |  * Chromium verifies shell ownership and geometry. Physical iPhone Safari remains
  5   |  * the final authority for browser-chrome behaviour.
  6   |  */
  7   | import { test, expect, gotoDemo, expectClean, addCategory } from '../helpers/trailweigh';
  8   | 
  9   | type Rect = { top: number; bottom: number; height: number };
  10  | 
  11  | async function rectOf(page: import('@playwright/test').Page, selector: string): Promise<Rect> {
  12  |   return page.locator(selector).evaluate((el: HTMLElement) => {
  13  |     const r = el.getBoundingClientRect();
  14  |     return { top: r.top, bottom: r.bottom, height: r.height };
  15  |   });
  16  | }
  17  | 
  18  | async function scrollMain(page: import('@playwright/test').Page, fraction: number) {
  19  |   await page.evaluate((targetFraction) => {
  20  |     const main = document.querySelector('[data-testid="main-scroll"]') as HTMLElement;
  21  |     main.scrollTop = Math.max(0, (main.scrollHeight - main.clientHeight) * targetFraction);
  22  |     main.dispatchEvent(new Event('scroll', { bubbles: true }));
  23  |   }, fraction);
  24  |   await page.waitForTimeout(100);
  25  | }
  26  | 
  27  | async function chooseFilter(page: import('@playwright/test').Page, option: 'category' | 'location' | 'photo') {
  28  |   await page.getByTestId('filter-control').click();
  29  |   await page.getByTestId(`filter-option-${option}`).click();
  30  | }
  31  | 
  32  | async function makeBackpackLong(page: import('@playwright/test').Page) {
  33  |   await page.getByRole('button', { name: 'Open Backpack category' }).click();
  34  |   const addItem = page.getByTestId('cat-add-item-btn');
  35  |   for (let i = 0; i < 14; i++) await addItem.click();
  36  |   // R0101 makes active-category-bar visible for every open category. Wait for
  37  |   // the actual bounded item viewport before asserting Add Item geometry.
> 38  |   await page.waitForFunction(() => {
      |              ^ TimeoutError: page.waitForFunction: Timeout 6000ms exceeded.
  39  |     const items = document.querySelector('[data-testid="open-cat-items"]') as HTMLElement | null;
  40  |     return !!items && getComputedStyle(items).overflowY === 'auto' &&
  41  |       items.scrollHeight > items.clientHeight;
  42  |   }, undefined, { timeout: 6000 });
  43  | }
  44  | 
  45  | test.describe('R0096 — locked mobile control layers', () => {
  46  |   for (const viewport of [
  47  |     { width: 402, height: 714 },
  48  |     { width: 402, height: 754 },
  49  |     { width: 390, height: 844 },
  50  |     { width: 360, height: 800 },
  51  |   ]) {
  52  |     test(`keeps the normal Filter slot and chrome locked at ${viewport.width}×${viewport.height}`, async ({ page, errors }) => {
  53  |       await page.setViewportSize(viewport);
  54  |       await gotoDemo(page);
  55  |       for (const suffix of ['A', 'B', 'C', 'D', 'E', 'F']) {
  56  |         await addCategory(page, `R0096 Scroll ${viewport.width} ${suffix}`);
  57  |       }
  58  |       await page.waitForTimeout(200);
  59  | 
  60  |       const before = {
  61  |         appBar: await rectOf(page, '[data-testid="app-bar"]'),
  62  |         summary: await rectOf(page, '[data-testid="list-summary-bar"]'),
  63  |         filter: await rectOf(page, '[data-testid="filter-bar"]'),
  64  |         nav: await rectOf(page, '[data-testid="bottom-nav"]'),
  65  |         row: await rectOf(page, `[data-cat="R0096 Scroll ${viewport.width} A"]`),
  66  |       };
  67  |       await scrollMain(page, 0.75);
  68  |       const after = {
  69  |         appBar: await rectOf(page, '[data-testid="app-bar"]'),
  70  |         summary: await rectOf(page, '[data-testid="list-summary-bar"]'),
  71  |         filter: await rectOf(page, '[data-testid="filter-bar"]'),
  72  |         nav: await rectOf(page, '[data-testid="bottom-nav"]'),
  73  |         row: await rectOf(page, `[data-cat="R0096 Scroll ${viewport.width} A"]`),
  74  |         scroll: await page.evaluate(() => ({
  75  |           main: (document.querySelector('[data-testid="main-scroll"]') as HTMLElement).scrollTop,
  76  |           window: window.scrollY,
  77  |           document: document.documentElement.scrollTop,
  78  |           body: document.body.scrollTop,
  79  |         })),
  80  |       };
  81  | 
  82  |       expect(before.filter.top).toBeCloseTo(before.summary.bottom, 0);
  83  |       expect(after.appBar.top).toBeCloseTo(before.appBar.top, 0);
  84  |       expect(after.summary.top).toBeCloseTo(before.summary.top, 0);
  85  |       expect(after.filter.top).toBeCloseTo(before.filter.top, 0);
  86  |       expect(after.nav.top).toBeCloseTo(before.nav.top, 0);
  87  |       expect(Math.abs(after.row.top - before.row.top)).toBeGreaterThan(20);
  88  |       expect(after.scroll.main).toBeGreaterThan(0);
  89  |       expect(after.scroll.window).toBe(0);
  90  |       expect(after.scroll.document).toBe(0);
  91  |       expect(after.scroll.body).toBe(0);
  92  |       expectClean(errors);
  93  |     });
  94  |   }
  95  | 
  96  |   test('Filter opens the three choices and reflects each active choice', async ({ page, errors }) => {
  97  |     await page.setViewportSize({ width: 402, height: 714 });
  98  |     await gotoDemo(page);
  99  |     await page.getByTestId('filter-control').click();
  100 |     await expect(page.getByTestId('filter-menu')).toBeVisible();
  101 |     await expect(page.getByTestId('filter-option-category')).toBeVisible();
  102 |     await expect(page.getByTestId('filter-option-location')).toBeVisible();
  103 |     await expect(page.getByTestId('filter-option-photo')).toBeVisible();
  104 | 
  105 |     await page.getByTestId('filter-option-location').click();
  106 |     await expect(page.getByTestId('filter-control')).toContainText('Filter: Location');
  107 |     await chooseFilter(page, 'photo');
  108 |     await expect(page.getByTestId('filter-control')).toContainText('Filter: Photo');
  109 |     await chooseFilter(page, 'category');
  110 |     await expect(page.getByTestId('filter-control')).toContainText('Filter: Category');
  111 |     await expect(page.getByTestId('filter-menu')).not.toBeVisible();
  112 |     expectClean(errors);
  113 |   });
  114 | 
  115 |   test('Photo view reuses the item-owned editor and renders only Delete/Edit below a saved photo', async ({ page, errors }) => {
  116 |     await page.setViewportSize({ width: 402, height: 714 });
  117 |     await gotoDemo(page);
  118 |     await chooseFilter(page, 'photo');
  119 |     await page.getByRole('button', { name: 'Open Backpack category' }).click();
  120 |     await page.getByRole('button', { name: /— expand details$/ }).first().click();
  121 |     await page.getByTestId('item-photo-add-btn').click();
  122 |     await page.locator('input[aria-label="Upload a photo from device library"]').setInputFiles(
  123 |       'artifacts/pack-checklist/public/icon-512.png'
  124 |     );
  125 |     await expect(page.getByTestId('photo-mode-item')).toBeVisible({ timeout: 8000 });
  126 |     const photoItem = page.getByTestId('photo-mode-item').first();
  127 |     await expect(photoItem.locator('img')).toBeVisible();
  128 |     await expect(photoItem.getByTestId('photo-mode-delete-btn')).toBeVisible();
  129 |     await expect(photoItem.getByTestId('photo-mode-edit-btn')).toBeVisible();
  130 |     await expect(photoItem.getByTestId('photo-take-btn')).not.toBeVisible();
  131 |     expectClean(errors);
  132 |   });
  133 | 
  134 |   test('active bounded category keeps Filter visible and locks Add Item above Bottom Box Groups', async ({ page, errors }) => {
  135 |     await page.setViewportSize({ width: 402, height: 714 });
  136 |     await gotoDemo(page);
  137 |     await makeBackpackLong(page);
  138 | 
```