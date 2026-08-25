# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/r0084p2.spec.ts >> R84P2 — Item swipe secondary button label >> 430px >> R84P2-ITEM-VIS-430: visible text is exactly "Edit"
- Location: tests/e2e/phase1b/r0084p2.spec.ts:141:11

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-swipe-key="item:Backpack:b1"]').locator('[data-testid="swipe-secondary-action"]')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('[data-swipe-key="item:Backpack:b1"]').locator('[data-testid="swipe-secondary-action"]')

```

```yaml
- button "Open navigation menu"
- text: TrailWeigh Demo Pack List 21 items
- button "Collapse all categories"
- text: 6 categories 16 Selected
- toolbar "Checklist filter":
  - 'button "Filter: category"': "Filter: Category"
- button "Close Backpack category" [expanded]
- text: Backpack 3 items · 2 selected 72.50 oz
- button "Delete Osprey Atmos 65": Delete
- 'checkbox "Osprey Atmos 65: selected for checklist" [checked]'
- button "Osprey Atmos 65 — expand details": Osprey Atmos 65 1
- 'checkbox "Pack Rain Cover: selected for checklist" [checked]'
- button "Pack Rain Cover — expand details": Pack Rain Cover 1
- 'checkbox "Dry Bags: not selected for checklist"'
- button "Dry Bags — expand details": Dry Bags 2
- button "Add item to Backpack": Add Item
- button "Open Clothing category"
- text: Clothing 5 items · 4 selected 50.70 oz
- button "Open Toiletries category"
- text: Toiletries 4 items · 2 selected 2.60 oz
- button "Open Electronics category"
- text: Electronics 3 items · 3 selected 14.40 oz
- button "Open Shelter category"
- text: Shelter 3 items · 3 selected 90.00 oz
- button "Open Kitchen category"
- text: Kitchen 3 items · 2 selected 13.70 oz
- button "Locker — saved lists": Locker
- button "Summary — pack weight and progress": Summary
- button "Add — add items, categories, or import": Add
- button "Search — find gear": Search
- button "Next controls": Next
- region "Notifications (F8)":
  - list
```

# Test source

```ts
  51  |   await expect(page.locator(`[data-swipe-key^="item:${cat}:"]`).first()).toBeVisible({ timeout: 5000 });
  52  | }
  53  | 
  54  | // ─── viewport widths ──────────────────────────────────────────────────────────
  55  | 
  56  | const WIDTHS = [320, 375, 390, 430] as const;
  57  | 
  58  | // ═════════════════════════════════════════════════════════════════════════════
  59  | // PART 1 — Category secondary button visible label
  60  | // ═════════════════════════════════════════════════════════════════════════════
  61  | 
  62  | test.describe('R84P2 — Category swipe secondary button label', () => {
  63  |   for (const width of WIDTHS) {
  64  |     test.describe(`${width}px`, () => {
  65  |       test.use({ viewport: { width, height: 844 } });
  66  | 
  67  |       test(`R84P2-CAT-VIS-${width}: visible text is exactly "Edit"`, async ({ page, errors }) => {
  68  |         await gotoDemo(page);
  69  |         const cat = await firstCatName(page);
  70  |         const row = await openSwipeReveal(page, `cat:${cat}`);
  71  | 
  72  |         const btn = row.locator('[data-testid="swipe-secondary-action"]');
  73  |         await expect(btn).toBeVisible();
  74  | 
  75  |         // innerText strips the SVG icon (it has no text content); remaining text must be "Edit"
  76  |         const text = (await btn.innerText()).trim();
  77  |         expect(text).toBe('Edit');
  78  | 
  79  |         expectClean(errors);
  80  |       });
  81  | 
  82  |       test(`R84P2-CAT-ARIA-${width}: aria-label contains category name and is descriptive`, async ({ page, errors }) => {
  83  |         await gotoDemo(page);
  84  |         const cat = await firstCatName(page);
  85  |         const row = await openSwipeReveal(page, `cat:${cat}`);
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
> 151 |         await expect(btn).toBeVisible();
      |                           ^ Error: expect(locator).toBeVisible() failed
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
  186 |         const box = await btn.boundingBox();
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
```