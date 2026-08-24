# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/r0084.spec.ts >> R84 — Item swipe reveal: Rename | Delete >> R84-10 item swipe Delete still opens delete confirmation
- Location: tests/e2e/phase1b/r0084.spec.ts:276:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.getAttribute: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('[data-swipe-key^="item:Backpack:"]').first().locator('[data-testid="swipe-secondary-action"]')

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
  183 |     await swipeLeft(page, itemRow);
  184 |     await expect(itemRow).toHaveAttribute('data-swipe-open', 'true');
  185 | 
  186 |     const renameBtn = itemRow.locator('[data-testid="swipe-secondary-action"]');
  187 |     await expect(renameBtn).toBeVisible();
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
> 283 |     const ariaLabel = (await renameBtn.getAttribute('aria-label'))!;
      |                                        ^ Error: locator.getAttribute: Test timeout of 60000ms exceeded.
  284 |     const itemName = ariaLabel.replace(/^Edit /, '');
  285 | 
  286 |     // Click the Delete button (not Rename)
  287 |     await itemRow.locator(`[aria-label="Delete ${itemName}"]`).click();
  288 |     await page.waitForTimeout(200);
  289 | 
  290 |     await expect(page.locator('[aria-label="Delete item confirmation"]')).toBeVisible({ timeout: 4000 });
  291 |     // Dismiss without deleting
  292 |     await page.locator('[aria-label="Cancel delete item"]').click();
  293 | 
  294 |     expectClean(errors);
  295 |   });
  296 | 
  297 |   test('R84-11 Rename button disabled when name unchanged', async ({ page, errors }) => {
  298 |     const cat = await firstCatName(page);
  299 |     await openCategory(page, cat);
  300 | 
  301 |     const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
  302 |     await swipeLeft(page, itemRow);
  303 |     await expect(itemRow).toHaveAttribute('data-swipe-open', 'true');
  304 |     await itemRow.locator('[data-testid="swipe-secondary-action"]').click();
  305 |     await page.waitForTimeout(200);
  306 | 
  307 |     // Input is pre-filled with current name → Rename button disabled
  308 |     await expect(page.locator('[data-testid="item-rename-confirm"]')).toBeDisabled();
  309 | 
  310 |     expectClean(errors);
  311 |   });
  312 | 
  313 |   test('R84-12 Rename button disabled when input is empty', async ({ page, errors }) => {
  314 |     const cat = await firstCatName(page);
  315 |     await openCategory(page, cat);
  316 | 
  317 |     const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
  318 |     await swipeLeft(page, itemRow);
  319 |     await expect(itemRow).toHaveAttribute('data-swipe-open', 'true');
  320 |     await itemRow.locator('[data-testid="swipe-secondary-action"]').click();
  321 |     await page.waitForTimeout(200);
  322 | 
  323 |     await page.locator('[data-testid="item-rename-input"]').fill('');
  324 |     await expect(page.locator('[data-testid="item-rename-confirm"]')).toBeDisabled();
  325 | 
  326 |     expectClean(errors);
  327 |   });
  328 | 
  329 | });
  330 | 
  331 | // ═════════════════════════════════════════════════════════════════════════════
  332 | // PART 3 — Tap-anywhere toggle, long-press, and gesture disambiguation
  333 | // ═════════════════════════════════════════════════════════════════════════════
  334 | 
  335 | test.describe('R84 — Category bar interactions: tap, long-press, swipe disambiguation', () => {
  336 | 
  337 |   test.beforeEach(async ({ page }) => {
  338 |     await gotoDemo(page);
  339 |   });
  340 | 
  341 |   test('R84-13 tap anywhere on category bar toggles open/close', async ({ page, errors }) => {
  342 |     const cat = await firstCatName(page);
  343 |     const header = page.locator(`[data-testid="cat-header-${cat}"]`);
  344 | 
  345 |     // Click the centre of the bar (not the wedge button)
  346 |     const box = (await header.boundingBox())!;
  347 |     await page.mouse.click(box.x + box.width * 0.5, box.y + box.height / 2);
  348 |     await page.waitForTimeout(200);
  349 | 
  350 |     // Category should now be open
  351 |     await expect(page.getByRole('button', { name: `Close ${cat} category` })).toBeVisible({ timeout: 3000 });
  352 | 
  353 |     // Click again → closed
  354 |     await page.mouse.click(box.x + box.width * 0.5, box.y + box.height / 2);
  355 |     await page.waitForTimeout(200);
  356 |     await expect(page.getByRole('button', { name: `Open ${cat} category` })).toBeVisible({ timeout: 3000 });
  357 | 
  358 |     expectClean(errors);
  359 |   });
  360 | 
  361 |   test('R84-14 long-press on category bar enters reorder state', async ({ page, errors }) => {
  362 |     const cat = await firstCatName(page);
  363 |     const bar = page.locator(`[data-swipe-key="cat:${cat}"]`);
  364 |     const b = (await bar.boundingBox())!;
  365 |     const x = b.x + b.width * 0.35;
  366 |     const y = b.y + b.height / 2;
  367 | 
  368 |     await page.mouse.move(x, y);
  369 |     await page.mouse.down();
  370 |     await page.waitForTimeout(600); // > 400 ms threshold
  371 | 
  372 |     // Reorder ghost: at least one category row should get a shadow/transform style
  373 |     // (we verify by checking drag state didn't abort — category count unchanged)
  374 |     const catCount = await page.locator('[data-swipe-key^="cat:"]').count();
  375 |     expect(catCount).toBeGreaterThan(0);
  376 | 
  377 |     await page.mouse.up();
  378 |     await page.waitForTimeout(200);
  379 | 
  380 |     expectClean(errors);
  381 |   });
  382 | 
  383 |   test('R84-15 horizontal swipe does NOT trigger item expand/collapse', async ({ page, errors }) => {
```