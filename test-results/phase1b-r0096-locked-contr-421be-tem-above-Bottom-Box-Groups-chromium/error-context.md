# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/r0096-locked-controls.spec.ts >> R0096 — locked mobile control layers >> active bounded category replaces Filter and locks Add Item above Bottom Box Groups
- Location: tests/e2e/phase1b/r0096-locked-controls.spec.ts:128:7

# Error details

```
TimeoutError: page.waitForFunction: Timeout 2000ms exceeded.
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
    - generic [ref=e69]:
      - generic [ref=e70]:
        - generic [ref=e72]:
          - button [ref=e73] [cursor=pointer]: Edit
          - button [ref=e77] [cursor=pointer]: Delete
          - generic [ref=e82] [cursor=pointer]:
            - button "Close Backpack category" [expanded] [ref=e83]
            - generic [ref=e88]:
              - generic [ref=e90]:
                - generic [ref=e91]: Backpack
                - generic [ref=e92]: 17 items · 16 selected
              - generic [ref=e93]: 72.50 oz
        - generic [ref=e94]:
          - generic [ref=e96]:
            - button [ref=e97] [cursor=pointer]: Edit
            - button [ref=e101] [cursor=pointer]: Delete
            - generic [ref=e106]:
              - 'checkbox "Osprey Atmos 65: selected for checklist" [checked] [ref=e107] [cursor=pointer]'
              - button "Osprey Atmos 65 — expand details" [ref=e108] [cursor=pointer]:
                - generic [ref=e109]: Osprey Atmos 65
                - generic [ref=e110]: "1"
          - generic [ref=e112]:
            - button [ref=e113] [cursor=pointer]: Edit
            - button [ref=e117] [cursor=pointer]: Delete
            - generic [ref=e122]:
              - 'checkbox "Pack Rain Cover: selected for checklist" [checked] [ref=e123] [cursor=pointer]'
              - button "Pack Rain Cover — expand details" [ref=e124] [cursor=pointer]:
                - generic [ref=e125]: Pack Rain Cover
                - generic [ref=e126]: "1"
          - generic [ref=e128]:
            - button [ref=e129] [cursor=pointer]: Edit
            - button [ref=e133] [cursor=pointer]: Delete
            - generic [ref=e138]:
              - 'checkbox "Dry Bags: not selected for checklist" [ref=e139] [cursor=pointer]'
              - button "Dry Bags — expand details" [ref=e140] [cursor=pointer]:
                - generic [ref=e141]: Dry Bags
                - generic [ref=e142]: "2"
          - generic [ref=e144]:
            - button [ref=e145] [cursor=pointer]: Edit
            - button [ref=e149] [cursor=pointer]: Delete
            - generic [ref=e154]:
              - 'checkbox "Unnamed item: selected for checklist" [checked] [ref=e155] [cursor=pointer]'
              - button "Unnamed item — expand details" [ref=e156] [cursor=pointer]:
                - generic [ref=e157]: Unnamed item
                - generic [ref=e158]: "1"
          - generic [ref=e160]:
            - button [ref=e161] [cursor=pointer]: Edit
            - button [ref=e165] [cursor=pointer]: Delete
            - generic [ref=e170]:
              - 'checkbox "Unnamed item: selected for checklist" [checked] [ref=e171] [cursor=pointer]'
              - button "Unnamed item — expand details" [ref=e172] [cursor=pointer]:
                - generic [ref=e173]: Unnamed item
                - generic [ref=e174]: "1"
          - generic [ref=e176]:
            - button [ref=e177] [cursor=pointer]: Edit
            - button [ref=e181] [cursor=pointer]: Delete
            - generic [ref=e186]:
              - 'checkbox "Unnamed item: selected for checklist" [checked] [ref=e187] [cursor=pointer]'
              - button "Unnamed item — expand details" [ref=e188] [cursor=pointer]:
                - generic [ref=e189]: Unnamed item
                - generic [ref=e190]: "1"
          - generic [ref=e192]:
            - button [ref=e193] [cursor=pointer]: Edit
            - button [ref=e197] [cursor=pointer]: Delete
            - generic [ref=e202]:
              - 'checkbox "Unnamed item: selected for checklist" [checked] [ref=e203] [cursor=pointer]'
              - button "Unnamed item — expand details" [ref=e204] [cursor=pointer]:
                - generic [ref=e205]: Unnamed item
                - generic [ref=e206]: "1"
          - generic [ref=e208]:
            - button [ref=e209] [cursor=pointer]: Edit
            - button [ref=e213] [cursor=pointer]: Delete
            - generic [ref=e218]:
              - 'checkbox "Unnamed item: selected for checklist" [checked] [ref=e219] [cursor=pointer]'
              - button "Unnamed item — expand details" [ref=e220] [cursor=pointer]:
                - generic [ref=e221]: Unnamed item
                - generic [ref=e222]: "1"
          - generic [ref=e224]:
            - button [ref=e225] [cursor=pointer]: Edit
            - button [ref=e229] [cursor=pointer]: Delete
            - generic [ref=e234]:
              - 'checkbox "Unnamed item: selected for checklist" [checked] [ref=e235] [cursor=pointer]'
              - button "Unnamed item — expand details" [ref=e236] [cursor=pointer]:
                - generic [ref=e237]: Unnamed item
                - generic [ref=e238]: "1"
          - generic [ref=e240]:
            - button [ref=e241] [cursor=pointer]: Edit
            - button [ref=e245] [cursor=pointer]: Delete
            - generic [ref=e250]:
              - 'checkbox "Unnamed item: selected for checklist" [checked] [ref=e251] [cursor=pointer]'
              - button "Unnamed item — expand details" [ref=e252] [cursor=pointer]:
                - generic [ref=e253]: Unnamed item
                - generic [ref=e254]: "1"
          - generic [ref=e256]:
            - button [ref=e257] [cursor=pointer]: Edit
            - button [ref=e261] [cursor=pointer]: Delete
            - generic [ref=e266]:
              - 'checkbox "Unnamed item: selected for checklist" [checked] [ref=e267] [cursor=pointer]'
              - button "Unnamed item — expand details" [ref=e268] [cursor=pointer]:
                - generic [ref=e269]: Unnamed item
                - generic [ref=e270]: "1"
          - generic [ref=e272]:
            - button [ref=e273] [cursor=pointer]: Edit
            - button [ref=e277] [cursor=pointer]: Delete
            - generic [ref=e282]:
              - 'checkbox "Unnamed item: selected for checklist" [checked] [ref=e283] [cursor=pointer]'
              - button "Unnamed item — expand details" [ref=e284] [cursor=pointer]:
                - generic [ref=e285]: Unnamed item
                - generic [ref=e286]: "1"
          - generic [ref=e288]:
            - button [ref=e289] [cursor=pointer]: Edit
            - button [ref=e293] [cursor=pointer]: Delete
            - generic [ref=e298]:
              - 'checkbox "Unnamed item: selected for checklist" [checked] [ref=e299] [cursor=pointer]'
              - button "Unnamed item — expand details" [ref=e300] [cursor=pointer]:
                - generic [ref=e301]: Unnamed item
                - generic [ref=e302]: "1"
          - generic [ref=e304]:
            - button [ref=e305] [cursor=pointer]: Edit
            - button [ref=e309] [cursor=pointer]: Delete
            - generic [ref=e314]:
              - 'checkbox "Unnamed item: selected for checklist" [checked] [ref=e315] [cursor=pointer]'
              - button "Unnamed item — expand details" [ref=e316] [cursor=pointer]:
                - generic [ref=e317]: Unnamed item
                - generic [ref=e318]: "1"
          - generic [ref=e320]:
            - button [ref=e321] [cursor=pointer]: Edit
            - button [ref=e325] [cursor=pointer]: Delete
            - generic [ref=e330]:
              - 'checkbox "Unnamed item: selected for checklist" [checked] [ref=e331] [cursor=pointer]'
              - button "Unnamed item — expand details" [ref=e332] [cursor=pointer]:
                - generic [ref=e333]: Unnamed item
                - generic [ref=e334]: "1"
          - generic [ref=e336]:
            - button [ref=e337] [cursor=pointer]: Edit
            - button [ref=e341] [cursor=pointer]: Delete
            - generic [ref=e346]:
              - 'checkbox "Unnamed item: selected for checklist" [checked] [ref=e347] [cursor=pointer]'
              - button "Unnamed item — expand details" [ref=e348] [cursor=pointer]:
                - generic [ref=e349]: Unnamed item
                - generic [ref=e350]: "1"
          - generic [ref=e352]:
            - button [ref=e353] [cursor=pointer]: Edit
            - button [ref=e357] [cursor=pointer]: Delete
            - generic [ref=e362]:
              - 'checkbox "Unnamed item: selected for checklist" [checked] [ref=e363] [cursor=pointer]'
              - button "Unnamed item — expand details" [ref=e364] [cursor=pointer]:
                - generic [ref=e365]: Unnamed item
                - generic [ref=e366]: "1"
        - generic [ref=e367]:
          - button "Add item to Backpack" [active] [ref=e368] [cursor=pointer]:
            - generic [ref=e370]: Add Item
          - generic [ref=e371]:
            - button "Show earlier items" [ref=e372] [cursor=pointer]
            - button "Show later items" [disabled] [ref=e375]
      - generic [ref=e380]:
        - button [ref=e381] [cursor=pointer]: Edit
        - button [ref=e385] [cursor=pointer]: Delete
        - generic [ref=e390] [cursor=pointer]:
          - button "Open Clothing category" [ref=e391]
          - generic [ref=e394]:
            - generic [ref=e396]:
              - generic [ref=e397]: Clothing
              - generic [ref=e398]: 5 items · 4 selected
            - generic [ref=e399]: 50.70 oz
      - generic [ref=e402]:
        - button [ref=e403] [cursor=pointer]: Edit
        - button [ref=e407] [cursor=pointer]: Delete
        - generic [ref=e412] [cursor=pointer]:
          - button "Open Toiletries category" [ref=e413]
          - generic [ref=e418]:
            - generic [ref=e420]:
              - generic [ref=e421]: Toiletries
              - generic [ref=e422]: 4 items · 2 selected
            - generic [ref=e423]: 2.60 oz
      - generic [ref=e426]:
        - button [ref=e427] [cursor=pointer]: Edit
        - button [ref=e431] [cursor=pointer]: Delete
        - generic [ref=e436] [cursor=pointer]:
          - button "Open Electronics category" [ref=e437]
          - generic [ref=e440]:
            - generic [ref=e442]:
              - generic [ref=e443]: Electronics
              - generic [ref=e444]: 3 items · 3 selected
            - generic [ref=e445]: 14.40 oz
      - generic [ref=e448]:
        - button [ref=e449] [cursor=pointer]: Edit
        - button [ref=e453] [cursor=pointer]: Delete
        - generic [ref=e458] [cursor=pointer]:
          - button "Open Shelter category" [ref=e459]
          - generic [ref=e464]:
            - generic [ref=e466]:
              - generic [ref=e467]: Shelter
              - generic [ref=e468]: 3 items · 3 selected
            - generic [ref=e469]: 90.00 oz
      - generic [ref=e472]:
        - button [ref=e473] [cursor=pointer]: Edit
        - button [ref=e477] [cursor=pointer]: Delete
        - generic [ref=e482] [cursor=pointer]:
          - button "Open Kitchen category" [ref=e483]
          - generic [ref=e489]:
            - generic [ref=e491]:
              - generic [ref=e492]: Kitchen
              - generic [ref=e493]: 3 items · 2 selected
            - generic [ref=e494]: 13.70 oz
    - generic [ref=e497]:
      - button "Locker — saved lists" [ref=e498] [cursor=pointer]:
        - generic [ref=e501]: Locker
      - button "Summary — pack weight and progress" [ref=e503] [cursor=pointer]:
        - generic [ref=e505]: Summary
      - button "Add — add items, categories, or import" [ref=e507] [cursor=pointer]:
        - generic [ref=e509]: Add
      - button "Search — find gear" [ref=e511] [cursor=pointer]:
        - generic [ref=e515]: Search
      - button "Next controls" [ref=e517] [cursor=pointer]:
        - generic [ref=e518]: Next
    - navigation [ref=e522]:
      - generic [ref=e523]: TrailWeigh
      - list [ref=e525]:
        - listitem [ref=e526]:
          - button [ref=e527] [cursor=pointer]:
            - generic [ref=e531]: Home
        - listitem [ref=e533]:
          - button [disabled] [ref=e534]:
            - generic [ref=e537]:
              - generic [ref=e538]: Master Library
              - generic [ref=e539]: Coming soon
        - listitem [ref=e540]:
          - button [ref=e541] [cursor=pointer]:
            - generic [ref=e544]: My Lists
        - listitem [ref=e546]:
          - button [ref=e547] [cursor=pointer]:
            - generic [ref=e551]: Help & Tutorials
        - listitem [ref=e553]:
          - button [ref=e554] [cursor=pointer]:
            - generic [ref=e558]: Settings
      - button [ref=e561] [cursor=pointer]:
        - generic [ref=e564]:
          - generic [ref=e565]: Right-handed
          - generic [ref=e566]: Tap to flip menu side
  - region "Notifications (F8)":
    - list
```

# Test source

```ts
  37  | }
  38  | 
  39  | test.describe('R0096 — locked mobile control layers', () => {
  40  |   for (const viewport of [
  41  |     { width: 402, height: 714 },
  42  |     { width: 402, height: 754 },
  43  |     { width: 390, height: 844 },
  44  |     { width: 360, height: 800 },
  45  |   ]) {
  46  |     test(`keeps the normal Filter slot and chrome locked at ${viewport.width}×${viewport.height}`, async ({ page, errors }) => {
  47  |       await page.setViewportSize(viewport);
  48  |       await gotoDemo(page);
  49  |       for (const suffix of ['A', 'B', 'C', 'D', 'E', 'F']) {
  50  |         await addCategory(page, `R0096 Scroll ${viewport.width} ${suffix}`);
  51  |       }
  52  |       await page.waitForTimeout(200);
  53  | 
  54  |       const before = {
  55  |         appBar: await rectOf(page, '[data-testid="app-bar"]'),
  56  |         summary: await rectOf(page, '[data-testid="list-summary-bar"]'),
  57  |         filter: await rectOf(page, '[data-testid="filter-bar"]'),
  58  |         nav: await rectOf(page, '[data-testid="bottom-nav"]'),
  59  |         row: await rectOf(page, `[data-cat="R0096 Scroll ${viewport.width} A"]`),
  60  |       };
  61  |       await scrollMain(page, 0.75);
  62  |       const after = {
  63  |         appBar: await rectOf(page, '[data-testid="app-bar"]'),
  64  |         summary: await rectOf(page, '[data-testid="list-summary-bar"]'),
  65  |         filter: await rectOf(page, '[data-testid="filter-bar"]'),
  66  |         nav: await rectOf(page, '[data-testid="bottom-nav"]'),
  67  |         row: await rectOf(page, `[data-cat="R0096 Scroll ${viewport.width} A"]`),
  68  |         scroll: await page.evaluate(() => ({
  69  |           main: (document.querySelector('[data-testid="main-scroll"]') as HTMLElement).scrollTop,
  70  |           window: window.scrollY,
  71  |           document: document.documentElement.scrollTop,
  72  |           body: document.body.scrollTop,
  73  |         })),
  74  |       };
  75  | 
  76  |       expect(before.filter.top).toBeCloseTo(before.summary.bottom, 0);
  77  |       expect(after.appBar.top).toBeCloseTo(before.appBar.top, 0);
  78  |       expect(after.summary.top).toBeCloseTo(before.summary.top, 0);
  79  |       expect(after.filter.top).toBeCloseTo(before.filter.top, 0);
  80  |       expect(after.nav.top).toBeCloseTo(before.nav.top, 0);
  81  |       expect(Math.abs(after.row.top - before.row.top)).toBeGreaterThan(20);
  82  |       expect(after.scroll.main).toBeGreaterThan(0);
  83  |       expect(after.scroll.window).toBe(0);
  84  |       expect(after.scroll.document).toBe(0);
  85  |       expect(after.scroll.body).toBe(0);
  86  |       expectClean(errors);
  87  |     });
  88  |   }
  89  | 
  90  |   test('Filter opens the three choices and reflects each active choice', async ({ page, errors }) => {
  91  |     await page.setViewportSize({ width: 402, height: 714 });
  92  |     await gotoDemo(page);
  93  |     await page.getByTestId('filter-control').click();
  94  |     await expect(page.getByTestId('filter-menu')).toBeVisible();
  95  |     await expect(page.getByTestId('filter-option-category')).toBeVisible();
  96  |     await expect(page.getByTestId('filter-option-location')).toBeVisible();
  97  |     await expect(page.getByTestId('filter-option-photo')).toBeVisible();
  98  | 
  99  |     await page.getByTestId('filter-option-location').click();
  100 |     await expect(page.getByTestId('filter-control')).toContainText('Filter: Location');
  101 |     await chooseFilter(page, 'photo');
  102 |     await expect(page.getByTestId('filter-control')).toContainText('Filter: Photo');
  103 |     await chooseFilter(page, 'category');
  104 |     await expect(page.getByTestId('filter-control')).toContainText('Filter: Category');
  105 |     await expect(page.getByTestId('filter-menu')).not.toBeVisible();
  106 |     expectClean(errors);
  107 |   });
  108 | 
  109 |   test('Photo view reuses the item-owned editor and renders only Delete/Edit below a saved photo', async ({ page, errors }) => {
  110 |     await page.setViewportSize({ width: 402, height: 714 });
  111 |     await gotoDemo(page);
  112 |     await chooseFilter(page, 'photo');
  113 |     await page.getByRole('button', { name: 'Open Backpack category' }).click();
  114 |     await page.getByRole('button', { name: /— expand details$/ }).first().click();
  115 |     await page.getByTestId('item-photo-add-btn').click();
  116 |     await page.locator('input[aria-label="Upload a photo from device library"]').setInputFiles(
  117 |       'artifacts/pack-checklist/public/icon-512.png'
  118 |     );
  119 |     await expect(page.getByTestId('photo-mode-item')).toBeVisible({ timeout: 8000 });
  120 |     const photoItem = page.getByTestId('photo-mode-item').first();
  121 |     await expect(photoItem.locator('img')).toBeVisible();
  122 |     await expect(photoItem.getByTestId('photo-mode-delete-btn')).toBeVisible();
  123 |     await expect(photoItem.getByTestId('photo-mode-edit-btn')).toBeVisible();
  124 |     await expect(photoItem.getByTestId('photo-take-btn')).not.toBeVisible();
  125 |     expectClean(errors);
  126 |   });
  127 | 
  128 |   test('active bounded category replaces Filter and locks Add Item above Bottom Box Groups', async ({ page, errors }) => {
  129 |     await page.setViewportSize({ width: 402, height: 714 });
  130 |     await gotoDemo(page);
  131 |     await makeBackpackLong(page);
  132 | 
  133 |     await expect(page.getByTestId('filter-bar')).not.toBeVisible();
  134 |     // The Summary's ResizeObserver may report its final fractional height on the
  135 |     // frame after the rapid item additions. Assert the settled shared-slot geometry,
  136 |     // not the transitional pre-measurement frame.
> 137 |     await page.waitForFunction(() => {
      |                ^ TimeoutError: page.waitForFunction: Timeout 2000ms exceeded.
  138 |       const summary = document.querySelector('[data-testid="list-summary-bar"]')?.getBoundingClientRect();
  139 |       const active = document.querySelector('[data-testid="active-category-bar"]')?.getBoundingClientRect();
  140 |       return !!summary && !!active && Math.abs(summary.bottom - active.top) <= 1;
  141 |     }, undefined, { timeout: 2000 });
  142 |     const before = {
  143 |       summary: await rectOf(page, '[data-testid="list-summary-bar"]'),
  144 |       active: await rectOf(page, '[data-testid="active-category-bar"]'),
  145 |       items: await rectOf(page, '[data-testid="open-cat-items"]'),
  146 |       add: await rectOf(page, '[data-testid="cat-add-item-bar"]'),
  147 |       nav: await rectOf(page, '[data-testid="bottom-nav"]'),
  148 |     };
  149 |     expect(before.active.top).toBeCloseTo(before.summary.bottom, 0);
  150 |     expect(Math.abs(before.add.bottom - before.nav.top)).toBeLessThanOrEqual(1);
  151 | 
  152 |     await page.evaluate(() => {
  153 |       const items = document.querySelector('[data-testid="open-cat-items"]') as HTMLElement;
  154 |       items.scrollTop = Math.max(0, items.scrollHeight - items.clientHeight);
  155 |       items.dispatchEvent(new Event('scroll', { bubbles: true }));
  156 |     });
  157 |     await page.waitForTimeout(100);
  158 |     const after = {
  159 |       active: await rectOf(page, '[data-testid="active-category-bar"]'),
  160 |       add: await rectOf(page, '[data-testid="cat-add-item-bar"]'),
  161 |       nav: await rectOf(page, '[data-testid="bottom-nav"]'),
  162 |       itemScrollTop: await page.getByTestId('open-cat-items').evaluate((el: HTMLElement) => el.scrollTop),
  163 |     };
  164 |     expect(after.active.top).toBeCloseTo(before.active.top, 0);
  165 |     expect(after.add.top).toBeCloseTo(before.add.top, 0);
  166 |     expect(Math.abs(after.add.bottom - after.nav.top)).toBeLessThanOrEqual(1);
  167 |     expect(after.itemScrollTop).toBeGreaterThan(0);
  168 | 
  169 |     await page.getByRole('button', { name: 'Close Backpack category' }).click();
  170 |     await expect(page.getByTestId('filter-bar')).toBeVisible();
  171 |     expectClean(errors);
  172 |   });
  173 | 
  174 |   test('hamburger frame remains fixed while its separate interior remains scrollable', async ({ page, errors }) => {
  175 |     await page.setViewportSize({ width: 402, height: 714 });
  176 |     await gotoDemo(page);
  177 |     await page.getByTestId('hamburger-btn').click();
  178 |     await expect(page.getByTestId('nav-drawer')).toHaveAttribute('data-open', 'true');
  179 | 
  180 |     const before = await rectOf(page, '[data-testid="nav-drawer"]');
  181 |     await page.evaluate(() => {
  182 |       const main = document.querySelector('[data-testid="main-scroll"]') as HTMLElement;
  183 |       main.scrollTop = 240;
  184 |       main.dispatchEvent(new Event('scroll', { bubbles: true }));
  185 |     });
  186 |     await page.waitForTimeout(100);
  187 |     const after = await rectOf(page, '[data-testid="nav-drawer"]');
  188 |     const scrollStyles = await page.getByTestId('nav-drawer-scroll').evaluate((el: HTMLElement) => ({
  189 |       panelOverflow: getComputedStyle(el.parentElement!).overflowY,
  190 |       interiorOverflow: getComputedStyle(el).overflowY,
  191 |     }));
  192 |     expect(after.top).toBeCloseTo(before.top, 0);
  193 |     expect(after.bottom).toBeCloseTo(before.bottom, 0);
  194 |     expect(scrollStyles.panelOverflow).toBe('hidden');
  195 |     expect(scrollStyles.interiorOverflow).toBe('auto');
  196 |     await page.getByTestId('nav-drawer-backdrop').click({ position: { x: 350, y: 350 } });
  197 |     await expect(page.getByTestId('nav-drawer')).toHaveAttribute('data-open', 'false');
  198 |     expectClean(errors);
  199 |   });
  200 | 
  201 |   test('Home keeps its own scroll region without releasing document scroll', async ({ page, errors }) => {
  202 |     await page.setViewportSize({ width: 402, height: 714 });
  203 |     await gotoDemo(page);
  204 |     await page.getByTestId('hamburger-btn').click();
  205 |     await page.getByTestId('drawer-nav-home').click();
  206 |     await expect(page.getByTestId('home-screen')).toBeVisible();
  207 |     await page.evaluate(() => {
  208 |       const home = document.querySelector('[data-testid="home-content-scroll"]') as HTMLElement;
  209 |       home.scrollTop = Math.max(0, home.scrollHeight - home.clientHeight);
  210 |       home.dispatchEvent(new Event('scroll', { bubbles: true }));
  211 |     });
  212 |     const state = await page.evaluate(() => ({
  213 |       homeScroll: (document.querySelector('[data-testid="home-content-scroll"]') as HTMLElement).scrollTop,
  214 |       window: window.scrollY,
  215 |       document: document.documentElement.scrollTop,
  216 |     }));
  217 |     expect(state.homeScroll).toBeGreaterThanOrEqual(0);
  218 |     expect(state.window).toBe(0);
  219 |     expect(state.document).toBe(0);
  220 |     expectClean(errors);
  221 |   });
  222 | });
```