# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r001-experiment/gesture-probe.spec.ts >> G8 — Bottom handle vertical drag >> tap on bottom handle (< 8px) toggles More panel open
- Location: tests/e2e/r001-experiment/gesture-probe.spec.ts:367:7

# Error details

```
Error: expect(received).toBeLessThan(expected)

Expected: < 5
Received:   560
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]: TrailWeigh
      - generic "Search (not yet available)" [ref=e13]
    - generic [ref=e17]: Demo Pack List
    - generic [ref=e20]:
      - generic [ref=e23]:
        - generic [ref=e30]:
          - generic [ref=e31]: LIST SUMMARY
          - generic [ref=e32]:
            - generic [ref=e33]: "21"
            - generic [ref=e34]: items
        - generic [ref=e35]:
          - generic [ref=e36]: 6 categories
          - generic [ref=e37]: 16 Selected
          - generic [ref=e42]: 5 Not Selected
      - generic [ref=e45]:
        - generic [ref=e47]:
          - button "Open Backpack category" [ref=e48] [cursor=pointer]
          - generic [ref=e53]:
            - generic [ref=e54]:
              - button "Category options for Backpack" [ref=e55] [cursor=pointer]:
                - generic [ref=e56]: Backpack
              - generic [ref=e57]: 3 items · 2 selected
            - button "Drag to reorder Backpack category" [ref=e58]
            - generic [ref=e66]: 72.50 oz
        - generic [ref=e68]:
          - button "Open Clothing category" [ref=e69] [cursor=pointer]
          - generic [ref=e72]:
            - generic [ref=e73]:
              - button "Category options for Clothing" [ref=e74] [cursor=pointer]:
                - generic [ref=e75]: Clothing
              - generic [ref=e76]: 5 items · 4 selected
            - button "Drag to reorder Clothing category" [ref=e77]
            - generic [ref=e85]: 50.70 oz
        - generic [ref=e87]:
          - button "Open Toiletries category" [ref=e88] [cursor=pointer]
          - generic [ref=e93]:
            - generic [ref=e94]:
              - button "Category options for Toiletries" [ref=e95] [cursor=pointer]:
                - generic [ref=e96]: Toiletries
              - generic [ref=e97]: 4 items · 2 selected
            - button "Drag to reorder Toiletries category" [ref=e98]
            - generic [ref=e106]: 2.60 oz
        - generic [ref=e108]:
          - button "Open Electronics category" [ref=e109] [cursor=pointer]
          - generic [ref=e112]:
            - generic [ref=e113]:
              - button "Category options for Electronics" [ref=e114] [cursor=pointer]:
                - generic [ref=e115]: Electronics
              - generic [ref=e116]: 3 items · 3 selected
            - button "Drag to reorder Electronics category" [ref=e117]
            - generic [ref=e125]: 14.40 oz
        - generic [ref=e127]:
          - button "Open Shelter category" [ref=e128] [cursor=pointer]
          - generic [ref=e133]:
            - generic [ref=e134]:
              - button "Category options for Shelter" [ref=e135] [cursor=pointer]:
                - generic [ref=e136]: Shelter
              - generic [ref=e137]: 3 items · 3 selected
            - button "Drag to reorder Shelter category" [ref=e138]
            - generic [ref=e146]: 90.00 oz
        - generic [ref=e148]:
          - button "Open Kitchen category" [ref=e149] [cursor=pointer]
          - generic [ref=e155]:
            - generic [ref=e156]:
              - button "Category options for Kitchen" [ref=e157] [cursor=pointer]:
                - generic [ref=e158]: Kitchen
              - generic [ref=e159]: 3 items · 2 selected
            - button "Drag to reorder Kitchen category" [ref=e160]
            - generic [ref=e168]: 13.70 oz
        - button "Add a new category to this list" [ref=e170] [cursor=pointer]: Add Category
    - button "Open More panel" [ref=e173]
    - generic [ref=e175]:
      - button "List — current gear list" [ref=e176] [cursor=pointer]:
        - generic [ref=e181]: List
      - button "Locker — browse and load saved lists" [ref=e182] [cursor=pointer]:
        - generic [ref=e185]: Locker
      - generic "Catalog — coming soon" [ref=e186]: Catalog
      - button "Summary — pack weight and distribution" [ref=e190] [cursor=pointer]:
        - generic [ref=e192]: Summary
      - button "More — settings and tools" [ref=e193] [cursor=pointer]:
        - generic [ref=e198]: More
    - dialog "Navigation menu" [ref=e199]:
      - generic [ref=e200]: Menu
      - generic [ref=e202]:
        - generic [ref=e203]:
          - generic [ref=e204]: Units
          - generic [ref=e205]:
            - button "imperial" [pressed] [ref=e206] [cursor=pointer]
            - button "metric" [ref=e207] [cursor=pointer]
        - button "Checklist — Trail checklist for selected items" [ref=e209] [cursor=pointer]:
          - generic [ref=e215]:
            - generic [ref=e216]: Checklist
            - generic [ref=e217]: Trail checklist for selected items
        - button "Print — Print your gear list as PDF" [ref=e218] [cursor=pointer]:
          - generic [ref=e224]:
            - generic [ref=e225]: Print
            - generic [ref=e226]: Print your gear list as PDF
    - button "Open navigation menu" [ref=e227]
    - dialog "Add or create" [ref=e231]:
      - generic [ref=e232]: Start / Create
      - generic [ref=e234]:
        - generic "CREATE NEW LIST GUIDED FLOW = NOT YET IMPLEMENTED" [ref=e235]:
          - generic [ref=e238]:
            - generic [ref=e239]: Create New List
            - generic [ref=e240]: Guided setup — coming soon
        - button "Scan Gear List — import from PDF or DOCX file" [ref=e241] [cursor=pointer]:
          - generic [ref=e247]:
            - generic [ref=e248]: Scan Gear List
            - generic [ref=e249]: Import from PDF or Word document
    - button "Open add / create panel" [ref=e250]
    - dialog "More options" [ref=e254]:
      - generic [ref=e255]: More
      - generic [ref=e258]:
        - generic [ref=e259]: Actions
        - button "Save — Save current list as new Locker entry" [ref=e260] [cursor=pointer]:
          - generic [ref=e266]:
            - generic [ref=e267]: Save
            - generic [ref=e268]: Save current list as new Locker entry
        - button "Share — Get a review link" [ref=e269] [cursor=pointer]:
          - generic [ref=e277]:
            - generic [ref=e278]: Share
            - generic [ref=e279]: Get a review link
        - button "Undo" [disabled] [ref=e280]
        - button "Redo" [disabled] [ref=e287]
        - button "Reset — Re-load from your saved data" [ref=e294] [cursor=pointer]:
          - generic [ref=e299]:
            - generic [ref=e300]: Reset
            - generic [ref=e301]: Re-load from your saved data
        - button "Expand All" [ref=e302] [cursor=pointer]
        - button "Collapse All" [ref=e310] [cursor=pointer]
        - generic [ref=e317]: TrailWeigh
        - button "About TrailWeigh" [ref=e318] [cursor=pointer]
        - button "How It Works" [ref=e322] [cursor=pointer]
        - button "Sources & References" [ref=e326] [cursor=pointer]
        - generic [ref=e330]: Help
        - button "Help & How-To" [ref=e331] [cursor=pointer]
        - button "Report a Problem" [ref=e335] [cursor=pointer]
        - button "Contact Us" [ref=e339] [cursor=pointer]
        - generic [ref=e343]: Account & Privacy
        - button "Privacy Policy" [ref=e344] [cursor=pointer]
        - button "Terms of Use" [ref=e348] [cursor=pointer]
        - button "Affiliate Disclosure" [ref=e352] [cursor=pointer]
        - button "Accessibility" [ref=e356] [cursor=pointer]
        - paragraph [ref=e361]: © 2026 TrailWeigh · All rights reserved.
  - region "Notifications (F8)":
    - list
```

# Test source

```ts
  287 |     // Note: the bar captures pointerdown regardless of direction because it
  288 |     // uses setPointerCapture. This reveals that the current model does NOT
  289 |     // implement vertical-exemption within the bar region.
  290 |     // We just report the observed transform for the R001 findings.
  291 |     console.log('G6 OBSERVED: drawerX after purely-vertical drag:', parseTranslateX(tAfter));
  292 |   });
  293 | });
  294 | 
  295 | // ─────────────────────────────────────────────────────────────────────────────
  296 | // G7 — Category tap remains a category tap (tap on category name)
  297 | // ─────────────────────────────────────────────────────────────────────────────
  298 | 
  299 | test.describe('G7 — Category tap is not blocked by slider', () => {
  300 |   test.use({ viewport: VP });
  301 | 
  302 |   test('tapping a category wedge/name opens accordion independently of drawer', async ({ page }) => {
  303 |     await gotoAndWaitReady(page);
  304 | 
  305 |     // Tap the Backpack category wedge (accordion trigger button)
  306 |     const wedge = page.locator('button[aria-label="Open Backpack category"]');
  307 |     await wedge.click();
  308 | 
  309 |     // Accordion should be open — item "Osprey Atmos 65" should be visible
  310 |     await expect(page.locator('text=Osprey Atmos 65')).toBeVisible({ timeout: 3_000 });
  311 | 
  312 |     // Drawer should still be closed
  313 |     const t = await getDrawerTransform(page);
  314 |     const tx = parseTranslateX(t);
  315 |     console.log('G7 drawer transform after category tap:', t);
  316 |     expect(tx).toBeLessThan(-DRAWER_W * 0.9); // still closed
  317 |   });
  318 | });
  319 | 
  320 | // ─────────────────────────────────────────────────────────────────────────────
  321 | // G8 — Bottom Handle Vertical Drag
  322 | // ─────────────────────────────────────────────────────────────────────────────
  323 | 
  324 | test.describe('G8 — Bottom handle vertical drag', () => {
  325 |   test.use({ viewport: VP });
  326 | 
  327 |   test('dragging up on bottom handle opens More panel', async ({ page }) => {
  328 |     await gotoAndWaitReady(page);
  329 | 
  330 |     // Bottom handle is BOTTOM_HAND_H (14px) strip above BottomNavBar.
  331 |     // BottomNavBar is ~58px high, so handle top ≈ VP.height − 58 − 14 = 772
  332 |     const handleY = VP.height - 58 - BOTTOM_HAND_H + 7; // center of handle
  333 |     const handleX = VP.width / 2;
  334 | 
  335 |     const initialT = await getMoreTransform(page);
  336 |     console.log('G8 initial More transform:', initialT);
  337 | 
  338 |     await page.mouse.move(handleX, handleY);
  339 |     await page.mouse.down();
  340 |     // Drag up 200px
  341 |     await page.mouse.move(handleX, handleY - 200, { steps: 15 });
  342 | 
  343 |     const tDuring = await getMoreTransform(page);
  344 |     console.log('G8 More transform during upward drag:', tDuring);
  345 | 
  346 |     await page.mouse.up();
  347 |     await page.waitForTimeout(500);
  348 | 
  349 |     const tFinal = await getMoreTransform(page);
  350 |     console.log('G8 More transform after release:', tFinal);
  351 | 
  352 |     // Parse translateY — open = translateY(0), closed = translateY(morePanelH)
  353 |     const getTranslateY = (t: string) => {
  354 |       const m = t.match(/translateY\((-?[\d.]+)px\)/);
  355 |       return m ? parseFloat(m[1]) : NaN;
  356 |     };
  357 | 
  358 |     const tyDuring = getTranslateY(tDuring);
  359 |     const tyFinal  = getTranslateY(tFinal);
  360 |     console.log('G8 tyDuring:', tyDuring, 'tyFinal:', tyFinal);
  361 | 
  362 |     // During drag: should be less than initial (more open = smaller translateY)
  363 |     const tyInitial = getTranslateY(initialT);
  364 |     console.log('G8 tyInitial:', tyInitial, '(should be morePanelH ≈ min(0.82*844, 560)=560)');
  365 |   });
  366 | 
  367 |   test('tap on bottom handle (< 8px) toggles More panel open', async ({ page }) => {
  368 |     await gotoAndWaitReady(page);
  369 | 
  370 |     const handleY = VP.height - 58 - BOTTOM_HAND_H + 7;
  371 |     const handleX = VP.width / 2;
  372 | 
  373 |     await page.mouse.move(handleX, handleY);
  374 |     await page.mouse.down();
  375 |     await page.mouse.up();
  376 |     await page.waitForTimeout(500);
  377 | 
  378 |     const t = await getMoreTransform(page);
  379 |     console.log('G8 More after tap-toggle:', t);
  380 |     // Should be open (translateY ≈ 0)
  381 |     const getTranslateY = (t: string) => {
  382 |       const m = t.match(/translateY\((-?[\d.]+)px\)/);
  383 |       return m ? parseFloat(m[1]) : NaN;
  384 |     };
  385 |     const ty = getTranslateY(t);
  386 |     console.log('G8 ty after tap (should be ~0):', ty);
> 387 |     expect(Math.abs(ty)).toBeLessThan(5);
      |                          ^ Error: expect(received).toBeLessThan(expected)
  388 |   });
  389 | });
  390 | 
  391 | // ─────────────────────────────────────────────────────────────────────────────
  392 | // G9 — Bottom nav "More" tap opens panel
  393 | // ─────────────────────────────────────────────────────────────────────────────
  394 | 
  395 | test.describe('G9 — Bottom nav More tap', () => {
  396 |   test.use({ viewport: VP });
  397 | 
  398 |   test('tapping More in bottom nav calls snapMoreTo(morePanelH)', async ({ page }) => {
  399 |     await gotoAndWaitReady(page);
  400 |     await page.click('button[aria-label="More — settings and tools"]');
  401 |     await page.waitForTimeout(500);
  402 | 
  403 |     const t = await getMoreTransform(page);
  404 |     const getTranslateY = (t: string) => {
  405 |       const m = t.match(/translateY\((-?[\d.]+)px\)/);
  406 |       return m ? parseFloat(m[1]) : NaN;
  407 |     };
  408 |     const ty = getTranslateY(t);
  409 |     console.log('G9 ty after More tab click:', ty);
  410 |     expect(Math.abs(ty)).toBeLessThan(5); // fully open
  411 |   });
  412 | });
  413 | 
  414 | // ─────────────────────────────────────────────────────────────────────────────
  415 | // G10 — Right slider tap and drag
  416 | // ─────────────────────────────────────────────────────────────────────────────
  417 | 
  418 | test.describe('G10 — Right slider', () => {
  419 |   test.use({ viewport: VP });
  420 | 
  421 |   test('tapping right slider cap opens the add panel', async ({ page }) => {
  422 |     await gotoAndWaitReady(page);
  423 | 
  424 |     const btn = page.locator('[role="button"][aria-label="Open add / create panel"]');
  425 |     await expect(btn).toBeVisible();
  426 |     await btn.click();
  427 |     await page.waitForTimeout(400);
  428 | 
  429 |     const t = await getPlusTransform(page);
  430 |     console.log('G10 plus panel transform after tap:', t);
  431 |     // Open: translateX(panelW − plusX) = translateX(362 − 362) = translateX(0)
  432 |     const m = t.match(/translateX\((-?[\d.]+)px\)/);
  433 |     const tx = m ? parseFloat(m[1]) : NaN;
  434 |     console.log('G10 tx after open:', tx);
  435 |     expect(Math.abs(tx)).toBeLessThan(5);
  436 |   });
  437 | 
  438 |   test('right slider: drag LEFT 80px increases plusX (panel opens)', async ({ page }) => {
  439 |     await gotoAndWaitReady(page);
  440 | 
  441 |     // Right slider is at right=0 when closed (plusX=0).
  442 |     // Slider cap center: x = VP.width − SLIDER_W/2 = 390 − 14 = 376, y = APP_BAR_H + TITLE_BAND_H/2 = 72
  443 |     const startX = VP.width - SLIDER_W / 2;
  444 |     const startY = APP_BAR_H + TITLE_BAND_H / 2;
  445 | 
  446 |     await page.mouse.move(startX, startY);
  447 |     await page.mouse.down();
  448 |     // Drag 80px LEFT (opens right panel)
  449 |     await page.mouse.move(startX - 80, startY, { steps: 8 });
  450 | 
  451 |     const t = await getPlusTransform(page);
  452 |     console.log('G10 right drag 80px left, transform:', t);
  453 |     const m = t.match(/translateX\((-?[\d.]+)px\)/);
  454 |     const tx = m ? parseFloat(m[1]) : NaN;
  455 |     // translateX(DRAWER_W − plusX) = translateX(362 − 80) = translateX(282) — LESS than fully closed (362)
  456 |     console.log('G10 tx during left drag:', tx);
  457 |     expect(tx).toBeLessThan(DRAWER_W * 0.95); // Less than closed state
  458 | 
  459 |     await page.mouse.up();
  460 |   });
  461 | });
  462 | 
  463 | // ─────────────────────────────────────────────────────────────────────────────
  464 | // G11 — Slow vs Fast Movement (velocity)
  465 | // ─────────────────────────────────────────────────────────────────────────────
  466 | 
  467 | test.describe('G11 — Slow vs fast movement (velocity not measured)', () => {
  468 |   test.use({ viewport: VP });
  469 | 
  470 |   test('OBSERVATION: snap result is position-only (no velocity effect)', async ({ page }) => {
  471 |     await gotoAndWaitReady(page);
  472 | 
  473 |     // Move fast (few steps) to just below 40% threshold
  474 |     const startX = 14;
  475 |     const startY = APP_BAR_H + TITLE_BAND_H / 2;
  476 |     const dragTo = Math.round(DRAWER_W * 0.38); // just below 40%
  477 | 
  478 |     await page.mouse.move(startX, startY);
  479 |     await page.mouse.down();
  480 |     // Fast move (1 step = instant)
  481 |     await page.mouse.move(startX + dragTo, startY, { steps: 1 });
  482 |     await page.mouse.up();
  483 |     await page.waitForTimeout(400);
  484 | 
  485 |     const t = await getDrawerTransform(page);
  486 |     const tx = parseTranslateX(t);
  487 |     console.log('G11 fast move below threshold (38%), snap result:', tx);
```