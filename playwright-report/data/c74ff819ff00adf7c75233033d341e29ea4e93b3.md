# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/r0084p2.spec.ts >> R84P2 — Item swipe secondary button label >> 430px >> R84P2-ITEM-NOWRAP-430: "Edit" button fits in 88px slot, no doc overflow
- Location: tests/e2e/phase1b/r0084p2.spec.ts:176:11

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.boundingBox: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('[data-swipe-key="item:Backpack:b1"]').locator('[data-testid="swipe-secondary-action"]')

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
      - generic [ref=e76]:
        - generic [ref=e78]:
          - button [ref=e79] [cursor=pointer]: Edit
          - button [ref=e83] [cursor=pointer]: Delete
          - generic [ref=e88] [cursor=pointer]:
            - button "Close Backpack category" [expanded] [ref=e89]
            - generic [ref=e94]:
              - generic [ref=e96]:
                - generic [ref=e97]: Backpack
                - generic [ref=e98]: 3 items · 2 selected
              - generic [ref=e99]: 72.50 oz
        - generic [ref=e100]:
          - generic [ref=e102]:
            - button "Delete Osprey Atmos 65" [ref=e103] [cursor=pointer]: Delete
            - generic [ref=e108]:
              - 'checkbox "Osprey Atmos 65: selected for checklist" [checked] [ref=e109] [cursor=pointer]'
              - button "Osprey Atmos 65 — expand details" [active] [ref=e110] [cursor=pointer]:
                - generic [ref=e111]: Osprey Atmos 65
                - generic [ref=e112]: "1"
          - generic [ref=e114]:
            - button [ref=e115] [cursor=pointer]: Delete
            - generic [ref=e120]:
              - 'checkbox "Pack Rain Cover: selected for checklist" [checked] [ref=e121] [cursor=pointer]'
              - button "Pack Rain Cover — expand details" [ref=e122] [cursor=pointer]:
                - generic [ref=e123]: Pack Rain Cover
                - generic [ref=e124]: "1"
          - generic [ref=e126]:
            - button [ref=e127] [cursor=pointer]: Delete
            - generic [ref=e132]:
              - 'checkbox "Dry Bags: not selected for checklist" [ref=e133] [cursor=pointer]'
              - button "Dry Bags — expand details" [ref=e134] [cursor=pointer]:
                - generic [ref=e135]: Dry Bags
                - generic [ref=e136]: "2"
        - button "Add item to Backpack" [ref=e138] [cursor=pointer]:
          - generic [ref=e140]: Add Item
      - generic [ref=e143]:
        - button [ref=e144] [cursor=pointer]: Edit
        - button [ref=e148] [cursor=pointer]: Delete
        - generic [ref=e153] [cursor=pointer]:
          - button "Open Clothing category" [ref=e154]
          - generic [ref=e157]:
            - generic [ref=e159]:
              - generic [ref=e160]: Clothing
              - generic [ref=e161]: 5 items · 4 selected
            - generic [ref=e162]: 50.70 oz
      - generic [ref=e165]:
        - button [ref=e166] [cursor=pointer]: Edit
        - button [ref=e170] [cursor=pointer]: Delete
        - generic [ref=e175] [cursor=pointer]:
          - button "Open Toiletries category" [ref=e176]
          - generic [ref=e181]:
            - generic [ref=e183]:
              - generic [ref=e184]: Toiletries
              - generic [ref=e185]: 4 items · 2 selected
            - generic [ref=e186]: 2.60 oz
      - generic [ref=e189]:
        - button [ref=e190] [cursor=pointer]: Edit
        - button [ref=e194] [cursor=pointer]: Delete
        - generic [ref=e199] [cursor=pointer]:
          - button "Open Electronics category" [ref=e200]
          - generic [ref=e203]:
            - generic [ref=e205]:
              - generic [ref=e206]: Electronics
              - generic [ref=e207]: 3 items · 3 selected
            - generic [ref=e208]: 14.40 oz
      - generic [ref=e211]:
        - button [ref=e212] [cursor=pointer]: Edit
        - button [ref=e216] [cursor=pointer]: Delete
        - generic [ref=e221] [cursor=pointer]:
          - button "Open Shelter category" [ref=e222]
          - generic [ref=e227]:
            - generic [ref=e229]:
              - generic [ref=e230]: Shelter
              - generic [ref=e231]: 3 items · 3 selected
            - generic [ref=e232]: 90.00 oz
      - generic [ref=e235]:
        - button [ref=e236] [cursor=pointer]: Edit
        - button [ref=e240] [cursor=pointer]: Delete
        - generic [ref=e245] [cursor=pointer]:
          - button "Open Kitchen category" [ref=e246]
          - generic [ref=e252]:
            - generic [ref=e254]:
              - generic [ref=e255]: Kitchen
              - generic [ref=e256]: 3 items · 2 selected
            - generic [ref=e257]: 13.70 oz
    - generic [ref=e260]:
      - button "Locker — saved lists" [ref=e261] [cursor=pointer]:
        - generic [ref=e264]: Locker
      - button "Summary — pack weight and progress" [ref=e266] [cursor=pointer]:
        - generic [ref=e268]: Summary
      - button "Add — add items, categories, or import" [ref=e270] [cursor=pointer]:
        - generic [ref=e272]: Add
      - button "Search — find gear" [ref=e274] [cursor=pointer]:
        - generic [ref=e278]: Search
      - button "Next controls" [ref=e280] [cursor=pointer]:
        - generic [ref=e281]: Next
    - navigation [ref=e285]:
      - generic [ref=e286]: TrailWeigh
      - list [ref=e288]:
        - listitem [ref=e289]:
          - button [ref=e290] [cursor=pointer]:
            - generic [ref=e294]: Home
        - listitem [ref=e296]:
          - button [disabled] [ref=e297]:
            - generic [ref=e300]:
              - generic [ref=e301]: Master Library
              - generic [ref=e302]: Coming soon
        - listitem [ref=e303]:
          - button [ref=e304] [cursor=pointer]:
            - generic [ref=e307]: My Lists
        - listitem [ref=e309]:
          - button [ref=e310] [cursor=pointer]:
            - generic [ref=e314]: Help & Tutorials
        - listitem [ref=e316]:
          - button [ref=e317] [cursor=pointer]:
            - generic [ref=e321]: Settings
      - button [ref=e324] [cursor=pointer]:
        - generic [ref=e327]:
          - generic [ref=e328]: Right-handed
          - generic [ref=e329]: Tap to flip menu side
  - region "Notifications (F8)":
    - list
```

# Test source

```ts
  86  | 
  87  |         const btn = row.locator('[data-testid="swipe-secondary-action"]');
  88  |         const ariaLabel = await btn.getAttribute('aria-label');
  89  | 
  90  |         expect(ariaLabel).toBeTruthy();
  91  |         // Must contain the category name (case-insensitive)
  92  |         expect(ariaLabel!.toLowerCase()).toContain(cat.toLowerCase());
  93  |         // Must be longer than the visible label alone
  94  |         expect(ariaLabel!.length).toBeGreaterThan('Edit'.length);
  95  | 
  96  |         expectClean(errors);
  97  |       });
  98  | 
  99  |       test(`R84P2-CAT-NOWRAP-${width}: "Edit" button fits in 88px slot, no doc overflow`, async ({ page, errors }) => {
  100 |         await gotoDemo(page);
  101 |         const cat = await firstCatName(page);
  102 |         const row = await openSwipeReveal(page, `cat:${cat}`);
  103 | 
  104 |         const btn = row.locator('[data-testid="swipe-secondary-action"]');
  105 |         const box = await btn.boundingBox();
  106 |         expect(box).not.toBeNull();
  107 |         expect(box!.width).toBeLessThanOrEqual(89); // 88px + 1px rounding
  108 | 
  109 |         const overflow = await page.evaluate(() =>
  110 |           document.documentElement.scrollWidth > document.documentElement.clientWidth
  111 |         );
  112 |         expect(overflow).toBe(false);
  113 | 
  114 |         expectClean(errors);
  115 |       });
  116 | 
  117 |       test(`R84P2-CAT-HEIGHT-${width}: "Edit" button meets 44px touch target`, async ({ page, errors }) => {
  118 |         await gotoDemo(page);
  119 |         const cat = await firstCatName(page);
  120 |         const row = await openSwipeReveal(page, `cat:${cat}`);
  121 | 
  122 |         const btn = row.locator('[data-testid="swipe-secondary-action"]');
  123 |         const box = await btn.boundingBox();
  124 |         expect(box!.height).toBeGreaterThanOrEqual(44);
  125 | 
  126 |         expectClean(errors);
  127 |       });
  128 |     });
  129 |   }
  130 | });
  131 | 
  132 | // ═════════════════════════════════════════════════════════════════════════════
  133 | // PART 2 — Item secondary button visible label
  134 | // ═════════════════════════════════════════════════════════════════════════════
  135 | 
  136 | test.describe('R84P2 — Item swipe secondary button label', () => {
  137 |   for (const width of WIDTHS) {
  138 |     test.describe(`${width}px`, () => {
  139 |       test.use({ viewport: { width, height: 844 } });
  140 | 
  141 |       test(`R84P2-ITEM-VIS-${width}: visible text is exactly "Edit"`, async ({ page, errors }) => {
  142 |         await gotoDemo(page);
  143 |         const cat = await firstCatName(page);
  144 |         await openCategory(page, cat);
  145 | 
  146 |         const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
  147 |         const swipeKey = await itemRow.getAttribute('data-swipe-key');
  148 |         const row = await openSwipeReveal(page, swipeKey!);
  149 | 
  150 |         const btn = row.locator('[data-testid="swipe-secondary-action"]');
  151 |         await expect(btn).toBeVisible();
  152 | 
  153 |         const text = (await btn.innerText()).trim();
  154 |         expect(text).toBe('Edit');
  155 | 
  156 |         expectClean(errors);
  157 |       });
  158 | 
  159 |       test(`R84P2-ITEM-ARIA-${width}: item aria-label is descriptive (longer than "Edit")`, async ({ page, errors }) => {
  160 |         await gotoDemo(page);
  161 |         const cat = await firstCatName(page);
  162 |         await openCategory(page, cat);
  163 | 
  164 |         const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
  165 |         const swipeKey = await itemRow.getAttribute('data-swipe-key');
  166 |         const row = await openSwipeReveal(page, swipeKey!);
  167 | 
  168 |         const btn = row.locator('[data-testid="swipe-secondary-action"]');
  169 |         const ariaLabel = await btn.getAttribute('aria-label');
  170 |         expect(ariaLabel).toBeTruthy();
  171 |         expect(ariaLabel!.length).toBeGreaterThan('Edit'.length);
  172 | 
  173 |         expectClean(errors);
  174 |       });
  175 | 
  176 |       test(`R84P2-ITEM-NOWRAP-${width}: "Edit" button fits in 88px slot, no doc overflow`, async ({ page, errors }) => {
  177 |         await gotoDemo(page);
  178 |         const cat = await firstCatName(page);
  179 |         await openCategory(page, cat);
  180 | 
  181 |         const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
  182 |         const swipeKey = await itemRow.getAttribute('data-swipe-key');
  183 |         const row = await openSwipeReveal(page, swipeKey!);
  184 | 
  185 |         const btn = row.locator('[data-testid="swipe-secondary-action"]');
> 186 |         const box = await btn.boundingBox();
      |                               ^ Error: locator.boundingBox: Test timeout of 60000ms exceeded.
  187 |         expect(box).not.toBeNull();
  188 |         expect(box!.width).toBeLessThanOrEqual(89);
  189 | 
  190 |         const overflow = await page.evaluate(() =>
  191 |           document.documentElement.scrollWidth > document.documentElement.clientWidth
  192 |         );
  193 |         expect(overflow).toBe(false);
  194 | 
  195 |         expectClean(errors);
  196 |       });
  197 | 
  198 |       test(`R84P2-ITEM-HEIGHT-${width}: "Edit" button meets 44px touch target`, async ({ page, errors }) => {
  199 |         await gotoDemo(page);
  200 |         const cat = await firstCatName(page);
  201 |         await openCategory(page, cat);
  202 | 
  203 |         const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
  204 |         const swipeKey = await itemRow.getAttribute('data-swipe-key');
  205 |         const row = await openSwipeReveal(page, swipeKey!);
  206 | 
  207 |         const btn = row.locator('[data-testid="swipe-secondary-action"]');
  208 |         const box = await btn.boundingBox();
  209 |         expect(box!.height).toBeGreaterThanOrEqual(44);
  210 | 
  211 |         expectClean(errors);
  212 |       });
  213 |     });
  214 |   }
  215 | });
  216 | 
  217 | // ═════════════════════════════════════════════════════════════════════════════
  218 | // PART 3 — Smoke: existing rename / delete flows still work
  219 | // ═════════════════════════════════════════════════════════════════════════════
  220 | 
  221 | test.describe('R84P2 — Smoke: rename + delete flows unchanged', () => {
  222 |   test.use({ viewport: { width: 390, height: 844 } });
  223 | 
  224 |   test('R84P2-SMOKE-CAT-RENAME: category Edit button still opens rename sheet pre-filled', async ({ page, errors }) => {
  225 |     await gotoDemo(page);
  226 |     const cat = await firstCatName(page);
  227 |     const row = await openSwipeReveal(page, `cat:${cat}`);
  228 | 
  229 |     await row.locator('[data-testid="swipe-secondary-action"]').click();
  230 |     await page.waitForTimeout(300);
  231 | 
  232 |     // Category Options Sheet uses a placeholder input, not a data-testid
  233 |     const input = page.locator('input[placeholder="Category name…"]');
  234 |     await expect(input).toBeVisible({ timeout: 4000 });
  235 |     expect(await input.inputValue()).toBe(cat);
  236 | 
  237 |     expectClean(errors);
  238 |   });
  239 | 
  240 |   test('R84P2-SMOKE-ITEM-RENAME: item Edit button still opens rename dialog pre-filled', async ({ page, errors }) => {
  241 |     await gotoDemo(page);
  242 |     const cat = await firstCatName(page);
  243 |     await openCategory(page, cat);
  244 | 
  245 |     const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
  246 |     const swipeKey = await itemRow.getAttribute('data-swipe-key');
  247 |     const row = await openSwipeReveal(page, swipeKey!);
  248 | 
  249 |     await row.locator('[data-testid="swipe-secondary-action"]').click();
  250 |     await page.waitForTimeout(300);
  251 | 
  252 |     await expect(page.locator('[data-testid="item-rename-dialog"]')).toBeVisible({ timeout: 4000 });
  253 |     await expect(page.locator('[data-testid="item-rename-input"]')).toBeVisible();
  254 | 
  255 |     expectClean(errors);
  256 |   });
  257 | 
  258 |   test('R84P2-SMOKE-CAT-DELETE: Delete button still intact on category row', async ({ page, errors }) => {
  259 |     await gotoDemo(page);
  260 |     const cat = await firstCatName(page);
  261 |     const row = await openSwipeReveal(page, `cat:${cat}`);
  262 | 
  263 |     const deleteBtn = row.locator(`button[aria-label="Delete ${cat} category"]`);
  264 |     await expect(deleteBtn).toBeVisible();
  265 | 
  266 |     expectClean(errors);
  267 |   });
  268 | 
  269 |   test('R84P2-SMOKE-ITEM-DELETE: Delete button still intact on item row', async ({ page, errors }) => {
  270 |     await gotoDemo(page);
  271 |     const cat = await firstCatName(page);
  272 |     await openCategory(page, cat);
  273 | 
  274 |     const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
  275 |     const swipeKey = await itemRow.getAttribute('data-swipe-key');
  276 |     const row = await openSwipeReveal(page, swipeKey!);
  277 | 
  278 |     const deleteBtn = row.locator('button[aria-label^="Delete"]');
  279 |     await expect(deleteBtn).toBeVisible();
  280 | 
  281 |     expectClean(errors);
  282 |   });
  283 | });
  284 | 
```