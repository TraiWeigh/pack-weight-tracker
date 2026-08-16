# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r001-experiment/gesture-probe.spec.ts >> G12 — Reduced motion >> with prefers-reduced-motion, snap transition is near-instant
- Location: tests/e2e/r001-experiment/gesture-probe.spec.ts:504:7

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "0.01s"
Received string:    "0.28s (normal)"
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
  488 |     // Even fast, below 40% → snaps closed (no velocity adjustment)
  489 |     // This CONFIRMS velocity is not currently measured.
  490 |     console.log('G11 INFERENCE: if velocity were measured, a fast flick here would snap open.');
  491 |   });
  492 | });
  493 | 
  494 | // ─────────────────────────────────────────────────────────────────────────────
  495 | // G12 — Reduced Motion Observation
  496 | // ─────────────────────────────────────────────────────────────────────────────
  497 | 
  498 | test.describe('G12 — Reduced motion', () => {
  499 |   test.use({
  500 |     viewport: VP,
  501 |     reducedMotion: 'reduce',
  502 |   });
  503 | 
  504 |   test('with prefers-reduced-motion, snap transition is near-instant', async ({ page }) => {
  505 |     await gotoAndWaitReady(page);
  506 | 
  507 |     // Read motionDuration via injected check
  508 |     const duration = await page.evaluate(() => {
  509 |       return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  510 |         ? '0.01s (instant)' : '0.28s (normal)';
  511 |     });
  512 |     console.log('G12 motionDuration:', duration);
> 513 |     expect(duration).toContain('0.01s');
      |                      ^ Error: expect(received).toContain(expected) // indexOf
  514 | 
  515 |     // Open and measure time
  516 |     const t0 = Date.now();
  517 |     await page.locator('[role="button"][aria-label="Open navigation menu"]').click();
  518 |     await page.waitForTimeout(100);
  519 |     const elapsed = Date.now() - t0;
  520 |     console.log('G12 elapsed after click (reduced motion):', elapsed, 'ms');
  521 | 
  522 |     const t = await getDrawerTransform(page);
  523 |     const tx = parseTranslateX(t);
  524 |     console.log('G12 transform after 100ms (should be open if instant):', tx);
  525 |     // With 0.01s transition, 100ms wait is more than enough to settle
  526 |     expect(Math.abs(tx)).toBeLessThan(5);
  527 |   });
  528 | });
  529 | 
```