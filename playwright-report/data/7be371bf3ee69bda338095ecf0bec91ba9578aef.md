# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/r0084.spec.ts >> R84 — Touch targets ≥ 44 px and no horizontal overflow >> R84-T430 item swipe: Rename button ≥ 44 px tall, no overflow at 430 px
- Location: tests/e2e/phase1b/r0084.spec.ts:464:9

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
  457 |         document.documentElement.scrollWidth > document.documentElement.clientWidth
  458 |       );
  459 |       expect(overflow, `horizontal overflow at ${width}px`).toBe(false);
  460 | 
  461 |       expectClean(errors);
  462 |     });
  463 | 
  464 |     test(`R84-T${width} item swipe: Rename button ≥ 44 px tall, no overflow at ${width} px`, async ({ page, errors }) => {
  465 |       await page.setViewportSize({ width, height: 844 });
  466 |       await gotoDemo(page);
  467 | 
  468 |       const cat = await firstCatName(page);
  469 |       await openCategory(page, cat);
  470 | 
  471 |       const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
  472 |       await swipeLeft(page, itemRow);
  473 |       await expect(itemRow).toHaveAttribute('data-swipe-open', 'true');
  474 | 
  475 |       const btn = itemRow.locator('[data-testid="swipe-secondary-action"]');
> 476 |       await expect(btn).toBeVisible();
      |                         ^ Error: expect(locator).toBeVisible() failed
  477 |       const box = (await btn.boundingBox())!;
  478 |       expect(box.height, `item Rename btn height at ${width}px`).toBeGreaterThanOrEqual(44);
  479 |       expect(box.width,  `item Rename btn width  at ${width}px`).toBeGreaterThanOrEqual(44);
  480 | 
  481 |       // No horizontal document overflow
  482 |       const overflow = await page.evaluate(() =>
  483 |         document.documentElement.scrollWidth > document.documentElement.clientWidth
  484 |       );
  485 |       expect(overflow, `horizontal overflow at ${width}px`).toBe(false);
  486 | 
  487 |       expectClean(errors);
  488 |     });
  489 |   }
  490 | 
  491 | });
  492 | 
```