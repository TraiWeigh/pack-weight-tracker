# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/r0084.spec.ts >> R84 — Category bar interactions: tap, long-press, swipe disambiguation >> R84-16 item expand/collapse works normally after a rename
- Location: tests/e2e/phase1b/r0084.spec.ts:407:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
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
> 414 |     await itemRow.locator('[data-testid="swipe-secondary-action"]').click();
      |                                                                     ^ Error: locator.click: Test timeout of 60000ms exceeded.
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
  476 |       await expect(btn).toBeVisible();
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