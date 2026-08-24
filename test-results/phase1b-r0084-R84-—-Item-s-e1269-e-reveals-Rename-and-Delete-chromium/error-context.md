# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/r0084.spec.ts >> R84 — Item swipe reveal: Rename | Delete >> R84-06 item swipe reveals Rename and Delete
- Location: tests/e2e/phase1b/r0084.spec.ts:178:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-swipe-key^="item:Backpack:"]').first().locator('[data-testid="swipe-secondary-action"]')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('[data-swipe-key^="item:Backpack:"]').first().locator('[data-testid="swipe-secondary-action"]')

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
  87  | 
  88  |     expectClean(errors);
  89  |   });
  90  | 
  91  |   test('R84-02 category swipe Rename opens the rename sub-view pre-filled', async ({ page, errors }) => {
  92  |     const cat = await firstCatName(page);
  93  |     await openSwipeReveal(page, `cat:${cat}`);
  94  |     const renameBtn = page.locator(`[data-swipe-key="cat:${cat}"] [data-testid="swipe-secondary-action"]`);
  95  |     await renameBtn.click();
  96  |     await page.waitForTimeout(200);
  97  | 
  98  |     // Category Options Sheet rename sub-view
  99  |     await expect(page.locator('input[placeholder="Category name…"]')).toBeVisible({ timeout: 4000 });
  100 |     const inputVal = await page.locator('input[placeholder="Category name…"]').inputValue();
  101 |     expect(inputVal).toBe(cat);
  102 | 
  103 |     expectClean(errors);
  104 |   });
  105 | 
  106 |   test('R84-03 category rename completes and new name appears in bar', async ({ page, errors }) => {
  107 |     const cat = await firstCatName(page);
  108 |     await openSwipeReveal(page, `cat:${cat}`);
  109 |     await page.locator(`[data-swipe-key="cat:${cat}"] [data-testid="swipe-secondary-action"]`).click();
  110 |     await page.waitForTimeout(200);
  111 | 
  112 |     const input = page.locator('input[placeholder="Category name…"]');
  113 |     await expect(input).toBeVisible({ timeout: 4000 });
  114 |     await input.click({ clickCount: 3 });
  115 |     await input.fill('Renamed Category');
  116 | 
  117 |     // Confirm via Save button (R0084P3: was "Rename")
  118 |     await page.getByRole('button', { name: 'Save category name' }).click();
  119 |     await page.waitForTimeout(300);
  120 | 
  121 |     // Sheet closed — new name visible in category bar
  122 |     await expect(page.locator('[data-testid="cat-name-Renamed Category"]')).toBeVisible({ timeout: 3000 });
  123 |     // Old name gone
  124 |     await expect(page.locator(`[data-testid="cat-name-${cat}"]`)).toHaveCount(0);
  125 | 
  126 |     expectClean(errors);
  127 |   });
  128 | 
  129 |   test('R84-04 category rename Cancel leaves name unchanged', async ({ page, errors }) => {
  130 |     const cat = await firstCatName(page);
  131 |     await openSwipeReveal(page, `cat:${cat}`);
  132 |     await page.locator(`[data-swipe-key="cat:${cat}"] [data-testid="swipe-secondary-action"]`).click();
  133 |     await page.waitForTimeout(200);
  134 | 
  135 |     const input = page.locator('input[placeholder="Category name…"]');
  136 |     await expect(input).toBeVisible({ timeout: 4000 });
  137 |     await input.fill('Should Not Apply');
  138 |     await page.getByRole('button', { name: 'Cancel rename' }).click();
  139 |     await page.waitForTimeout(200);
  140 | 
  141 |     // Original category name still present
  142 |     await expect(page.locator(`[data-testid="cat-header-${cat}"]`)).toBeVisible({ timeout: 3000 });
  143 |     await expect(page.locator('[data-testid="cat-name-Should Not Apply"]')).toHaveCount(0);
  144 | 
  145 |     expectClean(errors);
  146 |   });
  147 | 
  148 |   test('R84-05 category swipe Delete still opens delete confirmation', async ({ page, errors }) => {
  149 |     const cat = await firstCatName(page);
  150 |     await openSwipeReveal(page, `cat:${cat}`);
  151 |     await page.locator(`[aria-label="Delete ${cat} category"]`).click();
  152 |     await page.waitForTimeout(200);
  153 | 
  154 |     // Delete confirmation sub-view in the Sheet
  155 |     await expect(page.getByRole('button', { name: `Confirm delete category ${cat}` })).toBeVisible({ timeout: 4000 });
  156 |     await expect(page.getByRole('button', { name: 'Cancel delete category' })).toBeVisible();
  157 | 
  158 |     // Dismiss — category must still exist
  159 |     await page.getByRole('button', { name: 'Cancel delete category' }).click();
  160 |     await page.waitForTimeout(200);
  161 |     await expect(page.locator(`[data-swipe-key="cat:${cat}"]`)).toBeVisible();
  162 | 
  163 |     expectClean(errors);
  164 |   });
  165 | 
  166 | });
  167 | 
  168 | // ═════════════════════════════════════════════════════════════════════════════
  169 | // PART 2 — Item swipe: Rename | Delete
  170 | // ═════════════════════════════════════════════════════════════════════════════
  171 | 
  172 | test.describe('R84 — Item swipe reveal: Rename | Delete', () => {
  173 | 
  174 |   test.beforeEach(async ({ page }) => {
  175 |     await gotoDemo(page);
  176 |   });
  177 | 
  178 |   test('R84-06 item swipe reveals Rename and Delete', async ({ page, errors }) => {
  179 |     const cat = await firstCatName(page);
  180 |     await openCategory(page, cat);
  181 | 
  182 |     const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
  183 |     await swipeLeft(page, itemRow);
  184 |     await expect(itemRow).toHaveAttribute('data-swipe-open', 'true');
  185 | 
  186 |     const renameBtn = itemRow.locator('[data-testid="swipe-secondary-action"]');
> 187 |     await expect(renameBtn).toBeVisible();
      |                             ^ Error: expect(locator).toBeVisible() failed
  188 |     // aria-label starts with "Edit " (R0084P2 changed from "Rename " to "Edit ")
  189 |     const label = await renameBtn.getAttribute('aria-label');
  190 |     expect(label).toMatch(/^Edit /);
  191 | 
  192 |     // Delete button also visible
  193 |     await expect(itemRow.locator('[aria-label^="Delete "]')).toBeVisible();
  194 | 
  195 |     expectClean(errors);
  196 |   });
  197 | 
  198 |   test('R84-07 item swipe Rename opens dialog pre-filled with item name', async ({ page, errors }) => {
  199 |     const cat = await firstCatName(page);
  200 |     await openCategory(page, cat);
  201 | 
  202 |     const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
  203 |     // Get the expected name from the aria-label of the Rename button
  204 |     await swipeLeft(page, itemRow);
  205 |     await expect(itemRow).toHaveAttribute('data-swipe-open', 'true');
  206 | 
  207 |     const renameBtn = itemRow.locator('[data-testid="swipe-secondary-action"]');
  208 |     const ariaLabel = (await renameBtn.getAttribute('aria-label'))!;
  209 |     const expectedName = ariaLabel.replace(/^Edit /, '');
  210 | 
  211 |     await renameBtn.click();
  212 |     await page.waitForTimeout(200);
  213 | 
  214 |     await expect(page.locator('[data-testid="item-rename-dialog"]')).toBeVisible({ timeout: 4000 });
  215 |     const inputVal = await page.locator('[data-testid="item-rename-input"]').inputValue();
  216 |     expect(inputVal).toBe(expectedName);
  217 | 
  218 |     expectClean(errors);
  219 |   });
  220 | 
  221 |   test('R84-08 item rename completes and new name appears in row', async ({ page, errors }) => {
  222 |     const cat = await firstCatName(page);
  223 |     await openCategory(page, cat);
  224 | 
  225 |     const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
  226 |     await swipeLeft(page, itemRow);
  227 |     await expect(itemRow).toHaveAttribute('data-swipe-open', 'true');
  228 | 
  229 |     await itemRow.locator('[data-testid="swipe-secondary-action"]').click();
  230 |     await page.waitForTimeout(200);
  231 | 
  232 |     const input = page.locator('[data-testid="item-rename-input"]');
  233 |     await expect(input).toBeVisible({ timeout: 4000 });
  234 |     await input.fill('My Renamed Item');
  235 |     await page.locator('[data-testid="item-rename-confirm"]').click();
  236 |     await page.waitForTimeout(300);
  237 | 
  238 |     // Dialog dismissed
  239 |     await expect(page.locator('[data-testid="item-rename-dialog"]')).toHaveCount(0);
  240 | 
  241 |     // New name appears somewhere in the category's item list
  242 |     await expect(page.getByText('My Renamed Item').first()).toBeVisible({ timeout: 3000 });
  243 | 
  244 |     expectClean(errors);
  245 |   });
  246 | 
  247 |   test('R84-09 item rename Cancel leaves name unchanged', async ({ page, errors }) => {
  248 |     const cat = await firstCatName(page);
  249 |     await openCategory(page, cat);
  250 | 
  251 |     const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
  252 |     await swipeLeft(page, itemRow);
  253 |     await expect(itemRow).toHaveAttribute('data-swipe-open', 'true');
  254 | 
  255 |     const renameBtn = itemRow.locator('[data-testid="swipe-secondary-action"]');
  256 |     const ariaLabel = (await renameBtn.getAttribute('aria-label'))!;
  257 |     const originalName = ariaLabel.replace(/^Edit /, '');
  258 | 
  259 |     await renameBtn.click();
  260 |     await page.waitForTimeout(200);
  261 | 
  262 |     await page.locator('[data-testid="item-rename-input"]').fill('Cancelled Name');
  263 |     await page.locator('[data-testid="item-rename-cancel"]').click();
  264 |     await page.waitForTimeout(200);
  265 | 
  266 |     // Dialog gone
  267 |     await expect(page.locator('[data-testid="item-rename-dialog"]')).toHaveCount(0);
  268 |     // Original name still present as expand button
  269 |     await expect(
  270 |       page.getByRole('button', { name: `${originalName} — expand details` })
  271 |     ).toBeVisible();
  272 | 
  273 |     expectClean(errors);
  274 |   });
  275 | 
  276 |   test('R84-10 item swipe Delete still opens delete confirmation', async ({ page, errors }) => {
  277 |     const cat = await firstCatName(page);
  278 |     await openCategory(page, cat);
  279 | 
  280 |     const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
  281 |     const renameBtn = itemRow.locator('[data-testid="swipe-secondary-action"]');
  282 |     await swipeLeft(page, itemRow);
  283 |     const ariaLabel = (await renameBtn.getAttribute('aria-label'))!;
  284 |     const itemName = ariaLabel.replace(/^Edit /, '');
  285 | 
  286 |     // Click the Delete button (not Rename)
  287 |     await itemRow.locator(`[aria-label="Delete ${itemName}"]`).click();
```