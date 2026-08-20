# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/r0084.spec.ts >> R84 — Category bar interactions: tap, long-press, swipe disambiguation >> R84-13 tap anywhere on category bar toggles open/close
- Location: tests/e2e/phase1b/r0084.spec.ts:341:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Open Backpack category' })
Expected: visible
Timeout: 3000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 3000ms
  - waiting for getByRole('button', { name: 'Open Backpack category' })

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
- 'checkbox "Osprey Atmos 65: selected for checklist" [checked]'
- button "Osprey Atmos 65 — collapse details" [expanded]: Osprey Atmos 65 1
- text: Weight
- spinbutton "Weight of Osprey Atmos 65 in oz": "68"
- text: oz Quantity
- combobox "Quantity of Osprey Atmos 65":
  - option "1" [selected]
  - option "2"
  - option "3"
  - option "4"
  - option "5"
  - option "6"
  - option "7"
  - option "8"
  - option "9"
  - option "10"
  - option "11"
  - option "12"
  - option "13"
  - option "14"
  - option "15"
  - option "16"
  - option "17"
  - option "18"
  - option "19"
  - option "20"
- text: Total 68.00 oz Move
- combobox "Move Osprey Atmos 65 to another category":
  - option "Move to…" [selected]
  - option "Clothing"
  - option "Toiletries"
  - option "Electronics"
  - option "Shelter"
  - option "Kitchen"
- text: Location
- combobox "Location for Osprey Atmos 65":
  - option "No location" [selected]
  - option "— Create New Location… —"
- text: Photo
- button "Add photo to Osprey Atmos 65": Add Photo
- button "Delete Osprey Atmos 65": Delete Item
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
> 356 |     await expect(page.getByRole('button', { name: `Open ${cat} category` })).toBeVisible({ timeout: 3000 });
      |                                                                              ^ Error: expect(locator).toBeVisible() failed
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
  384 |     const cat = await firstCatName(page);
  385 |     await openCategory(page, cat);
  386 | 
  387 |     const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
  388 |     const renameBtn = itemRow.locator('[data-testid="swipe-secondary-action"]');
  389 | 
  390 |     // Get item name
  391 |     const ariaLabel = (await renameBtn.getAttribute('aria-label'))!;
  392 |     const itemName = ariaLabel.replace(/^Edit /, '');
  393 | 
  394 |     // Swipe open
  395 |     await swipeLeft(page, itemRow);
  396 |     await expect(itemRow).toHaveAttribute('data-swipe-open', 'true');
  397 | 
  398 |     // Expand panel must NOT be visible (swipe did not trigger expand)
  399 |     await expect(page.locator('[data-testid="expanded-weight-input"]')).toHaveCount(0);
  400 | 
  401 |     // The expand button must still read "expand" (not collapsed)
  402 |     await expect(page.getByRole('button', { name: `${itemName} — expand details` })).toBeVisible();
  403 | 
  404 |     expectClean(errors);
  405 |   });
  406 | 
  407 |   test('R84-16 item expand/collapse works normally after a rename', async ({ page, errors }) => {
  408 |     const cat = await firstCatName(page);
  409 |     await openCategory(page, cat);
  410 | 
  411 |     const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
  412 |     await swipeLeft(page, itemRow);
  413 |     await expect(itemRow).toHaveAttribute('data-swipe-open', 'true');
  414 |     await itemRow.locator('[data-testid="swipe-secondary-action"]').click();
  415 |     await page.waitForTimeout(200);
  416 | 
  417 |     await page.locator('[data-testid="item-rename-input"]').fill('Expand After Rename');
  418 |     await page.locator('[data-testid="item-rename-confirm"]').click();
  419 |     await page.waitForTimeout(300);
  420 | 
  421 |     // Expand the renamed item
  422 |     await page.getByRole('button', { name: 'Expand After Rename — expand details' }).click();
  423 |     await expect(page.locator('[data-testid="expanded-weight-input"]')).toBeVisible({ timeout: 3000 });
  424 | 
  425 |     // Collapse
  426 |     await page.getByRole('button', { name: 'Expand After Rename — collapse details' }).click();
  427 |     await page.waitForTimeout(200);
  428 |     await expect(page.locator('[data-testid="expanded-weight-input"]')).toHaveCount(0);
  429 | 
  430 |     expectClean(errors);
  431 |   });
  432 | 
  433 | });
  434 | 
  435 | // ═════════════════════════════════════════════════════════════════════════════
  436 | // PART 4 — Touch targets and overflow
  437 | // ═════════════════════════════════════════════════════════════════════════════
  438 | 
  439 | test.describe('R84 — Touch targets ≥ 44 px and no horizontal overflow', () => {
  440 | 
  441 |   for (const width of WIDTHS) {
  442 |     test(`R84-T${width} category swipe: Rename button ≥ 44 px tall, no overflow at ${width} px`, async ({ page, errors }) => {
  443 |       await page.setViewportSize({ width, height: 844 });
  444 |       await gotoDemo(page);
  445 | 
  446 |       const cat = await firstCatName(page);
  447 |       const row = await openSwipeReveal(page, `cat:${cat}`);
  448 | 
  449 |       const btn = row.locator('[data-testid="swipe-secondary-action"]');
  450 |       await expect(btn).toBeVisible();
  451 |       const box = (await btn.boundingBox())!;
  452 |       expect(box.height, `Rename btn height at ${width}px`).toBeGreaterThanOrEqual(44);
  453 |       expect(box.width,  `Rename btn width  at ${width}px`).toBeGreaterThanOrEqual(44);
  454 | 
  455 |       // No horizontal document overflow
  456 |       const overflow = await page.evaluate(() =>
```