# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r004/r004.spec.ts >> R004 category reorder >> pointer cancellation clears all drag effects and does NOT commit a reorder
- Location: tests/e2e/r004/r004.spec.ts:348:7

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('[data-floating="true"]')
Expected: 1
Received: 0
Timeout:  15000ms

Call log:
  - Expect "toHaveCount" with timeout 15000ms
  - waiting for locator('[data-floating="true"]')
    34 × locator resolved to 0 elements
       - unexpected value "0"

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]: TrailWeigh
      - generic "Search (not yet available)" [ref=e13]
    - generic [ref=e17]:
      - generic [ref=e21]:
        - generic [ref=e28]:
          - generic [ref=e29]: Demo Pack List
          - generic [ref=e30]:
            - generic [ref=e31]: "21"
            - generic [ref=e32]: items
        - generic [ref=e33]:
          - generic [ref=e34]: 6 categories
          - generic [ref=e35]: 16 Selected
      - generic [ref=e40]:
        - generic [ref=e42]:
          - button [ref=e43] [cursor=pointer]: Delete
          - generic [ref=e48]:
            - button "Open Backpack category" [ref=e49] [cursor=pointer]
            - generic [ref=e54]:
              - generic [ref=e55]:
                - button "Category options for Backpack" [ref=e56] [cursor=pointer]:
                  - generic [ref=e57]: Backpack
                - generic [ref=e58]: 3 items · 2 selected
              - button "Drag to reorder Backpack category" [ref=e59]
              - generic [ref=e67]: 72.50 oz
        - generic [ref=e69]:
          - button [ref=e70] [cursor=pointer]: Delete
          - generic [ref=e75]:
            - button "Open Clothing category" [ref=e76] [cursor=pointer]
            - generic [ref=e79]:
              - generic [ref=e80]:
                - button "Category options for Clothing" [ref=e81] [cursor=pointer]:
                  - generic [ref=e82]: Clothing
                - generic [ref=e83]: 5 items · 4 selected
              - button "Drag to reorder Clothing category" [ref=e84]
              - generic [ref=e92]: 50.70 oz
        - generic [ref=e94]:
          - button [ref=e95] [cursor=pointer]: Delete
          - generic [ref=e100]:
            - button "Open Toiletries category" [ref=e101] [cursor=pointer]
            - generic [ref=e106]:
              - generic [ref=e107]:
                - button "Category options for Toiletries" [ref=e108] [cursor=pointer]:
                  - generic [ref=e109]: Toiletries
                - generic [ref=e110]: 4 items · 2 selected
              - button "Drag to reorder Toiletries category" [ref=e111]
              - generic [ref=e119]: 2.60 oz
        - generic [ref=e121]:
          - button [ref=e122] [cursor=pointer]: Delete
          - generic [ref=e127]:
            - button "Open Electronics category" [ref=e128] [cursor=pointer]
            - generic [ref=e131]:
              - generic [ref=e132]:
                - button "Category options for Electronics" [ref=e133] [cursor=pointer]:
                  - generic [ref=e134]: Electronics
                - generic [ref=e135]: 3 items · 3 selected
              - button "Drag to reorder Electronics category" [ref=e136]
              - generic [ref=e144]: 14.40 oz
        - generic [ref=e146]:
          - button [ref=e147] [cursor=pointer]: Delete
          - generic [ref=e152]:
            - button "Open Shelter category" [ref=e153] [cursor=pointer]
            - generic [ref=e158]:
              - generic [ref=e159]:
                - button "Category options for Shelter" [ref=e160] [cursor=pointer]:
                  - generic [ref=e161]: Shelter
                - generic [ref=e162]: 3 items · 3 selected
              - button "Drag to reorder Shelter category" [ref=e163]
              - generic [ref=e171]: 90.00 oz
        - generic [ref=e173]:
          - button [ref=e174] [cursor=pointer]: Delete
          - generic [ref=e179]:
            - button "Open Kitchen category" [ref=e180] [cursor=pointer]
            - generic [ref=e186]:
              - generic [ref=e187]:
                - button "Category options for Kitchen" [ref=e188] [cursor=pointer]:
                  - generic [ref=e189]: Kitchen
                - generic [ref=e190]: 3 items · 2 selected
              - button "Drag to reorder Kitchen category" [ref=e191]
              - generic [ref=e199]: 13.70 oz
    - generic [ref=e201]:
      - button "Locker — saved lists" [ref=e202] [cursor=pointer]:
        - generic [ref=e205]: Locker
      - button "Summary — pack weight and progress" [ref=e206] [cursor=pointer]:
        - generic [ref=e208]: Summary
      - button "Add — add items, categories, or import a list" [ref=e209] [cursor=pointer]:
        - generic [ref=e211]: Add
      - button "Search — find gear" [ref=e212] [cursor=pointer]:
        - generic [ref=e216]: Search
      - button "More — settings and tools" [ref=e217] [cursor=pointer]:
        - generic [ref=e222]: More
  - region "Notifications (F8)":
    - list
```

# Test source

```ts
  260 |     await gotoV3(page);
  261 |     const row = firstCatRow(page);
  262 |     await swipeLeft(page, row);
  263 |     await expect(row).toHaveAttribute('data-swipe-open', 'true');
  264 |     await page.getByTestId('main-scroll').evaluate(el => {
  265 |       el.scrollBy(0, 120);
  266 |       // list may be shorter than the viewport — the scroll EVENT is the trigger
  267 |       el.dispatchEvent(new Event('scroll', { bubbles: true }));
  268 |     });
  269 |     await expect(row).toHaveAttribute('data-swipe-open', 'false');
  270 |   });
  271 | 
  272 |   test('opening a deck closes an open reveal', async ({ page }) => {
  273 |     await gotoV3(page);
  274 |     const row = firstCatRow(page);
  275 |     await swipeLeft(page, row);
  276 |     await expect(row).toHaveAttribute('data-swipe-open', 'true');
  277 |     await openDeck(page, NAV.more);
  278 |     await expect(row).toHaveAttribute('data-swipe-open', 'false');
  279 |   });
  280 | 
  281 |   test('accessible non-swipe delete paths exist (category options sheet; item detail panel)', async ({ page }) => {
  282 |     await gotoV3(page);
  283 |     const cat = await openFirstCategory(page);
  284 |     // Item path: expand detail panel → Delete Item row
  285 |     const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
  286 |     await itemRow.locator('[role="button"][aria-expanded]').click();
  287 |     await expect(page.getByRole('button', { name: 'Delete Item' }).or(
  288 |       page.getByRole('button', { name: /^Delete .+/ }).filter({ hasText: 'Delete Item' })).first()).toBeVisible();
  289 |     // Category path: name tap → Category Options sheet contains Delete
  290 |     await page.getByRole('button', { name: `Category options for ${cat}` }).click();
  291 |     await expect(page.getByRole('button', { name: /delete/i }).first()).toBeVisible();
  292 |   });
  293 | });
  294 | 
  295 | // ─── Part 2 — category reorder floating drag ────────────────────────────────────
  296 | 
  297 | test.describe('R004 category reorder', () => {
  298 |   test('dragged category floats (elevated shadow) and styling stays on the ACTUAL dragged category after crossing', async ({ page }) => {
  299 |     await gotoV3(page);
  300 |     const cats = page.locator('[data-swipe-key^="cat:"]');
  301 |     test.skip(await cats.count() < 2, 'needs 2+ categories');
  302 |     const firstName = await firstCatName(page);
  303 |     const grip = page.getByRole('button', { name: `Drag to reorder ${firstName} category` });
  304 |     const gBox = (await grip.boundingBox())!;
  305 |     const secondCard = page.locator('[data-cat]').nth(1);
  306 |     const sBox = (await secondCard.boundingBox())!;
  307 |     await page.mouse.move(gBox.x + gBox.width / 2, gBox.y + gBox.height / 2);
  308 |     await page.mouse.down();
  309 |     // cross into the second category's territory
  310 |     await page.mouse.move(gBox.x + gBox.width / 2, sBox.y + sBox.height * 0.8, { steps: 10 });
  311 |     await page.waitForTimeout(120);
  312 |     const floating = page.locator('[data-floating="true"]');
  313 |     await expect(floating).toHaveCount(1);
  314 |     expect(await floating.getAttribute('data-cat')).toBe(firstName); // name-keyed, not index
  315 |     const shadow = await floating.evaluate(el => getComputedStyle(el).boxShadow);
  316 |     expect(shadow).not.toBe('none');
  317 |     await page.mouse.up();
  318 |   });
  319 | 
  320 |   test('exactly one valid target dims while touched; undims on release; all effects cleared', async ({ page }) => {
  321 |     await gotoV3(page);
  322 |     const cats = page.locator('[data-cat]');
  323 |     test.skip(await cats.count() < 2, 'needs 2+ categories');
  324 |     const firstName = await firstCatName(page);
  325 |     const grip = page.getByRole('button', { name: `Drag to reorder ${firstName} category` });
  326 |     const gBox = (await grip.boundingBox())!;
  327 |     const second = cats.nth(1);
  328 |     const sBox = (await second.boundingBox())!;
  329 |     await page.mouse.move(gBox.x + gBox.width / 2, gBox.y + gBox.height / 2);
  330 |     await page.mouse.down();
  331 |     const secondName = await second.getAttribute('data-cat');
  332 |     // drag deep into the second slot — the DISPLACED category must dim
  333 |     await page.mouse.move(gBox.x + gBox.width / 2, sBox.y + sBox.height * 0.8, { steps: 8 });
  334 |     await page.waitForTimeout(120);
  335 |     const dimmed = page.locator('[data-dimtarget="true"]');
  336 |     await expect(dimmed).toHaveCount(1);
  337 |     expect(await dimmed.getAttribute('data-cat')).toBe(secondName);
  338 |     // move back to the original slot — the target must undim immediately
  339 |     await page.mouse.move(gBox.x + gBox.width / 2, gBox.y + gBox.height / 2, { steps: 8 });
  340 |     await page.waitForTimeout(120);
  341 |     await expect(page.locator('[data-dimtarget="true"]')).toHaveCount(0);
  342 |     await page.mouse.up();
  343 |     await page.waitForTimeout(250);
  344 |     await expect(page.locator('[data-dimtarget="true"]')).toHaveCount(0);
  345 |     await expect(page.locator('[data-floating="true"]')).toHaveCount(0);
  346 |   });
  347 | 
  348 |   test('pointer cancellation clears all drag effects and does NOT commit a reorder', async ({ page }) => {
  349 |     await gotoV3(page);
  350 |     const cats = page.locator('[data-cat]');
  351 |     test.skip(await cats.count() < 2, 'needs 2+ categories');
  352 |     const beforeOrder = await cats.evaluateAll(els => els.map(e => (e as HTMLElement).dataset.cat));
  353 |     const firstName = beforeOrder[0]!;
  354 |     const grip = page.getByRole('button', { name: `Drag to reorder ${firstName} category` });
  355 |     const gBox = (await grip.boundingBox())!;
  356 |     const sBox = (await cats.nth(1).boundingBox())!;
  357 |     await page.mouse.move(gBox.x + gBox.width / 2, gBox.y + gBox.height / 2);
  358 |     await page.mouse.down();
  359 |     await page.mouse.move(gBox.x + gBox.width / 2, sBox.y + sBox.height * 0.8, { steps: 8 });
> 360 |     await expect(page.locator('[data-floating="true"]')).toHaveCount(1);
      |                                                          ^ Error: expect(locator).toHaveCount(expected) failed
  361 |     // simulate an interrupted gesture (browser gesture takeover, incoming call, …)
  362 |     await grip.dispatchEvent('pointercancel');
  363 |     await page.waitForTimeout(250);
  364 |     await expect(page.locator('[data-floating="true"]')).toHaveCount(0);
  365 |     await expect(page.locator('[data-dimtarget="true"]')).toHaveCount(0);
  366 |     const afterOrder = await page.locator('[data-cat]').evaluateAll(els => els.map(e => (e as HTMLElement).dataset.cat));
  367 |     expect(afterOrder).toEqual(beforeOrder); // no commit on cancellation
  368 |     await page.mouse.up();
  369 |   });
  370 | 
  371 |   test('drag reorder persists new order after release', async ({ page }) => {
  372 |     await gotoV3(page);
  373 |     const cats = page.locator('[data-cat]');
  374 |     test.skip(await cats.count() < 2, 'needs 2+ categories');
  375 |     const beforeOrder = await cats.evaluateAll(els => els.map(e => (e as HTMLElement).dataset.cat));
  376 |     const firstName = beforeOrder[0]!;
  377 |     const grip = page.getByRole('button', { name: `Drag to reorder ${firstName} category` });
  378 |     const gBox = (await grip.boundingBox())!;
  379 |     const second = cats.nth(1);
  380 |     const sBox = (await second.boundingBox())!;
  381 |     await page.mouse.move(gBox.x + gBox.width / 2, gBox.y + gBox.height / 2);
  382 |     await page.mouse.down();
  383 |     await page.mouse.move(gBox.x + gBox.width / 2, sBox.y + sBox.height - 4, { steps: 10 });
  384 |     await page.mouse.up();
  385 |     await page.waitForTimeout(300);
  386 |     const afterOrder = await page.locator('[data-cat]').evaluateAll(els => els.map(e => (e as HTMLElement).dataset.cat));
  387 |     expect(afterOrder[1]).toBe(firstName);
  388 |     expect(afterOrder[0]).toBe(beforeOrder[1]);
  389 |   });
  390 | 
  391 |   test('starting a reorder closes any open delete reveal', async ({ page }) => {
  392 |     await gotoV3(page);
  393 |     const cats = page.locator('[data-cat]');
  394 |     test.skip(await cats.count() < 2, 'needs 2+ categories');
  395 |     const row = firstCatRow(page);
  396 |     await swipeLeft(page, row);
  397 |     await expect(row).toHaveAttribute('data-swipe-open', 'true');
  398 |     const secondName = await cats.nth(1).getAttribute('data-cat');
  399 |     const grip = page.getByRole('button', { name: `Drag to reorder ${secondName} category` });
  400 |     const gBox = (await grip.boundingBox())!;
  401 |     await page.mouse.move(gBox.x + gBox.width / 2, gBox.y + gBox.height / 2);
  402 |     await page.mouse.down();
  403 |     await page.mouse.move(gBox.x + gBox.width / 2, gBox.y + 30, { steps: 4 });
  404 |     await page.mouse.up();
  405 |     await expect(row).toHaveAttribute('data-swipe-open', 'false');
  406 |   });
  407 | });
  408 | 
  409 | // ─── Part 3 — typography ────────────────────────────────────────────────────────
  410 | 
  411 | test.describe('R004 Inter typography', () => {
  412 |   test('category names, list name, and app bar use Inter (no Georgia/serif)', async ({ page }) => {
  413 |     await gotoV3(page);
  414 |     const targets = [
  415 |       page.getByTestId('active-list-name'),
  416 |       page.getByRole('button', { name: /Category options for/ }).first(),
  417 |     ];
  418 |     for (const t of targets) {
  419 |       const ff = await t.evaluate(el => getComputedStyle(el.querySelector('div') ?? el).fontFamily);
  420 |       expect(ff).toContain('Inter');
  421 |       expect(ff).not.toMatch(/Georgia|Palatino/);
  422 |     }
  423 |   });
  424 | 
  425 |   test('Inter Variable @font-face is registered and loaded', async ({ page }) => {
  426 |     await gotoV3(page);
  427 |     const loaded = await page.evaluate(async () => {
  428 |       await (document as any).fonts.ready;
  429 |       return [...(document as any).fonts].some((f: any) => /Inter/i.test(f.family) && f.status === 'loaded');
  430 |     });
  431 |     expect(loaded).toBe(true);
  432 |   });
  433 | 
  434 |   test('no visible Georgia-rendered text remains on the main V3 screen', async ({ page }) => {
  435 |     await gotoV3(page);
  436 |     const georgiaCount = await page.evaluate(() => {
  437 |       let n = 0;
  438 |       document.querySelectorAll<HTMLElement>('body *').forEach(el => {
  439 |         if (!el.offsetParent) return;
  440 |         const ff = getComputedStyle(el).fontFamily;
  441 |         if (/Georgia|Palatino/.test(ff) && el.textContent?.trim()) n++;
  442 |       });
  443 |       return n;
  444 |     });
  445 |     expect(georgiaCount).toBe(0);
  446 |   });
  447 | });
  448 | 
  449 | // ─── Part 4 — inline Add Category removed ───────────────────────────────────────
  450 | 
  451 | test.describe('R004 inline Add Category removal', () => {
  452 |   test('dashed inline Add Category control is gone from the main list', async ({ page }) => {
  453 |     await gotoV3(page);
  454 |     await expect(page.getByRole('button', { name: 'Add a new category to this list' })).toHaveCount(0);
  455 |   });
  456 | 
  457 |   test('Add deck → Add Category still creates a category', async ({ page }) => {
  458 |     await gotoV3(page);
  459 |     await openDeck(page, NAV.add);
  460 |     await page.getByText('Add Category', { exact: true }).click();
```