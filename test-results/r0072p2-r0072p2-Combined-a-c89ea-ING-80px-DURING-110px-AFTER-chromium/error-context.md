# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r0072p2/r0072p2.spec.ts >> Combined: authoritative measurement table — BEFORE / DURING-80px / DURING-110px / AFTER
- Location: tests/e2e/r0072p2/r0072p2.spec.ts:299:5

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.evaluate: Target page, context or browser has been closed
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e4]:
    - generic [ref=e5]: TrailWeigh
    - generic [ref=e42]:
      - generic [ref=e46]:
        - generic [ref=e53]:
          - generic [ref=e54]: Demo Pack List
          - generic [ref=e55]:
            - generic [ref=e56]: "21"
            - generic [ref=e57]: items
        - generic [ref=e58]:
          - generic [ref=e59]: 6 categories
          - generic [ref=e60]: 16 Selected
      - generic [ref=e65]:
        - generic [ref=e67]:
          - button [ref=e68] [cursor=pointer]: Delete
          - generic [ref=e73]:
            - button "Open Backpack category" [ref=e74] [cursor=pointer]
            - generic [ref=e79]:
              - generic [ref=e80]:
                - button "Category options for Backpack" [ref=e81] [cursor=pointer]:
                  - generic [ref=e82]: Backpack
                - generic [ref=e83]: 3 items · 2 selected
              - generic [ref=e84]: 72.50 oz
        - generic [ref=e86]:
          - button [ref=e87] [cursor=pointer]: Delete
          - generic [ref=e92]:
            - button "Open Clothing category" [ref=e93] [cursor=pointer]
            - generic [ref=e96]:
              - generic [ref=e97]:
                - button "Category options for Clothing" [ref=e98] [cursor=pointer]:
                  - generic [ref=e99]: Clothing
                - generic [ref=e100]: 5 items · 4 selected
              - generic [ref=e101]: 50.70 oz
        - generic [ref=e103]:
          - button [ref=e104] [cursor=pointer]: Delete
          - generic [ref=e109]:
            - button "Open Toiletries category" [ref=e110] [cursor=pointer]
            - generic [ref=e115]:
              - generic [ref=e116]:
                - button "Category options for Toiletries" [ref=e117] [cursor=pointer]:
                  - generic [ref=e118]: Toiletries
                - generic [ref=e119]: 4 items · 2 selected
              - generic [ref=e120]: 2.60 oz
        - generic [ref=e122]:
          - button [ref=e123] [cursor=pointer]: Delete
          - generic [ref=e128]:
            - button "Open Electronics category" [ref=e129] [cursor=pointer]
            - generic [ref=e132]:
              - generic [ref=e133]:
                - button "Category options for Electronics" [ref=e134] [cursor=pointer]:
                  - generic [ref=e135]: Electronics
                - generic [ref=e136]: 3 items · 3 selected
              - generic [ref=e137]: 14.40 oz
        - generic [ref=e139]:
          - button [ref=e140] [cursor=pointer]: Delete
          - generic [ref=e145]:
            - button "Open Shelter category" [ref=e146] [cursor=pointer]
            - generic [ref=e151]:
              - generic [ref=e152]:
                - button "Category options for Shelter" [ref=e153] [cursor=pointer]:
                  - generic [ref=e154]: Shelter
                - generic [ref=e155]: 3 items · 3 selected
              - generic [ref=e156]: 90.00 oz
        - generic [ref=e158]:
          - button [ref=e159] [cursor=pointer]: Delete
          - generic [ref=e164]:
            - button "Open Kitchen category" [ref=e165] [cursor=pointer]
            - generic [ref=e171]:
              - generic [ref=e172]:
                - button "Category options for Kitchen" [ref=e173] [cursor=pointer]:
                  - generic [ref=e174]: Kitchen
                - generic [ref=e175]: 3 items · 2 selected
              - generic [ref=e176]: 13.70 oz
    - generic [ref=e179]:
      - button "Previous controls" [ref=e180] [cursor=pointer]:
        - generic [ref=e183]: Back
      - button "Share — create a review link" [ref=e185] [cursor=pointer]:
        - generic [ref=e192]: Share
      - button "More — settings and tools" [ref=e194] [cursor=pointer]:
        - generic [ref=e199]: More
    - dialog "More" [ref=e201]:
      - generic [ref=e202]:
        - generic [ref=e203]: More
        - button "Close More" [ref=e204] [cursor=pointer]
      - generic [ref=e208]:
        - group "List Actions — active card" [ref=e209]:
          - generic [ref=e216]:
            - generic [ref=e217]: List Actions
            - generic [ref=e218]: Save and trail checklist
          - generic [ref=e220]:
            - button "Save — Save current list as a new Locker entry" [ref=e221] [cursor=pointer]:
              - generic [ref=e227]:
                - generic [ref=e228]: Save
                - generic [ref=e229]: Save current list as a new Locker entry
            - button "Checklist — Trail checklist for selected items" [ref=e230] [cursor=pointer]:
              - generic [ref=e236]:
                - generic [ref=e237]: Checklist
                - generic [ref=e238]: Trail checklist for selected items
        - button "List Settings — open card" [ref=e239] [cursor=pointer]:
          - generic [ref=e245]:
            - generic [ref=e246]: List Settings
            - generic [ref=e247]: "Units: Imperial (lb / oz)"
        - button "Help & TrailWeigh — open card" [ref=e250] [cursor=pointer]:
          - generic [ref=e255]:
            - generic [ref=e256]: Help & TrailWeigh
            - generic [ref=e257]: Guides, about, sources, contact
        - button "Account & Privacy — open card" [ref=e260] [cursor=pointer]:
          - generic [ref=e264]:
            - generic [ref=e265]: Account & Privacy
            - generic [ref=e266]: Policies and account data
  - region "Notifications (F8)":
    - list
```

# Test source

```ts
  287 | 
  288 |   const scrollAfter = await deckScroll.evaluate(el => el.scrollTop);
  289 |   console.log(`[TestD] scrollTop AFTER: ${scrollAfter}`);
  290 | 
  291 |   const scrollInterfered = Math.abs(scrollDuring - scrollBefore) > 1;
  292 |   console.log(`[TestD] Parent scroll changed: ${scrollInterfered} — ${!scrollInterfered ? 'PASS (no scroll interference)' : 'NOTE'}`);
  293 | });
  294 | 
  295 | // ─────────────────────────────────────────────────────────────────────────────
  296 | // COMBINED — AUTHORITATIVE MEASUREMENT TABLE
  297 | // ─────────────────────────────────────────────────────────────────────────────
  298 | 
  299 | test('Combined: authoritative measurement table — BEFORE / DURING-80px / DURING-110px / AFTER', async ({ page }) => {
  300 |   await gotoV3(page);
  301 |   await openMoreDeck(page);
  302 | 
  303 |   const deckScroll = page.getByTestId('deck-scroll');
  304 |   await expect(deckScroll).toBeVisible({ timeout: 5000 });
  305 | 
  306 |   // ── Preconditions ──
  307 |   const sm = await deckScroll.evaluate(el => ({
  308 |     clientHeight: el.clientHeight,
  309 |     scrollHeight: el.scrollHeight,
  310 |     scrollTop: el.scrollTop,
  311 |   }));
  312 |   const nonOverflowing = sm.scrollHeight <= sm.clientHeight + 1;
  313 |   console.log(`[COMBINED] Deck: clientH=${sm.clientHeight}, scrollH=${sm.scrollHeight}, nonOverflowing=${nonOverflowing}`);
  314 | 
  315 |   if (!nonOverflowing) {
  316 |     console.log('[COMBINED] NOT RUN — deck overflows');
  317 |     return;
  318 |   }
  319 | 
  320 |   // Confirm target bar is present and enabled
  321 |   const targetBar = page.getByRole('button', { name: TARGET_LABEL, exact: true });
  322 |   await expect(targetBar).toBeVisible({ timeout: 3000 });
  323 |   const ariaDisabled = await targetBar.getAttribute('aria-disabled');
  324 |   const isEnabled = !ariaDisabled || ariaDisabled === 'false';
  325 |   console.log(`[COMBINED] Target "${TARGET_LABEL}" aria-disabled="${ariaDisabled}", enabled=${isEnabled}`);
  326 | 
  327 |   if (!isEnabled) {
  328 |     console.log('[COMBINED] NOT RUN — target bar is disabled');
  329 |     return;
  330 |   }
  331 | 
  332 |   // ── BEFORE ──
  333 |   const beforeBox = await targetBar.boundingBox();
  334 |   const beforeTransform = await targetBar.evaluate(el => window.getComputedStyle(el).transform);
  335 |   const beforeScrollTop = sm.scrollTop;
  336 | 
  337 |   console.log(`[COMBINED] BEFORE  — top=${beforeBox?.y?.toFixed(2)}, bottom=${((beforeBox?.y ?? 0) + (beforeBox?.height ?? 0)).toFixed(2)}, h=${beforeBox?.height?.toFixed(2)}, transform="${beforeTransform}", scrollTop=${beforeScrollTop}`);
  338 | 
  339 |   await saveEvidence(page, 'COMBINED-BEFORE');
  340 | 
  341 |   const cx = (beforeBox?.x ?? 0) + (beforeBox?.width ?? 0) / 2;
  342 |   const cy = (beforeBox?.y ?? 0) + (beforeBox?.height ?? 0) / 2;
  343 | 
  344 |   // ── DRAG to 80 px and HOLD ──
  345 |   await page.mouse.move(cx, cy);
  346 |   await page.mouse.down();
  347 |   await page.mouse.move(cx, cy - 12, { steps: 3 }); // past DRAG_SLOP_PX = 8
  348 |   await page.waitForTimeout(60);
  349 |   await page.mouse.move(cx, cy - 80, { steps: 10 });
  350 |   await page.waitForTimeout(200); // hold at 80 px
  351 | 
  352 |   const during80Box = await targetBar.boundingBox();
  353 |   const during80Transform = await targetBar.evaluate(el => window.getComputedStyle(el).transform);
  354 |   const during80Scroll = await deckScroll.evaluate(el => el.scrollTop);
  355 |   const rawShift80 = (during80Box?.y ?? 0) - (beforeBox?.y ?? 0);
  356 |   const adjShift80 = rawShift80 - (during80Scroll - beforeScrollTop);
  357 | 
  358 |   console.log(`[COMBINED] DURING-80  — top=${during80Box?.y?.toFixed(2)}, transform="${during80Transform}", scrollTop=${during80Scroll}, rawShift=${rawShift80.toFixed(2)}, adjShift=${adjShift80.toFixed(2)}`);
  359 | 
  360 |   await saveEvidence(page, 'COMBINED-DURING-80px');
  361 | 
  362 |   // ── Continue to 110 px (past DRAG_ACTIVATE = 48 px) while HELD ──
  363 |   await page.mouse.move(cx, cy - 110, { steps: 6 });
  364 |   await page.waitForTimeout(100);
  365 | 
  366 |   const during110Box = await targetBar.boundingBox();
  367 |   const during110Transform = await targetBar.evaluate(el => window.getComputedStyle(el).transform);
  368 |   const during110Scroll = await deckScroll.evaluate(el => el.scrollTop);
  369 |   const rawShift110 = (during110Box?.y ?? 0) - (beforeBox?.y ?? 0);
  370 |   const adjShift110 = rawShift110 - (during110Scroll - beforeScrollTop);
  371 | 
  372 |   console.log(`[COMBINED] DURING-110 — top=${during110Box?.y?.toFixed(2)}, transform="${during110Transform}", scrollTop=${during110Scroll}, rawShift=${rawShift110.toFixed(2)}, adjShift=${adjShift110.toFixed(2)}`);
  373 | 
  374 |   // ── RELEASE ──
  375 |   await page.mouse.up();
  376 |   await page.waitForTimeout(700);
  377 | 
  378 |   const stillStacked = await page.getByRole('button', { name: TARGET_LABEL, exact: true }).isVisible();
  379 |   let afterTransform = 'N/A';
  380 |   let afterTop = 'N/A';
  381 |   try {
  382 |     const afterBox = await page.getByRole('button', { name: TARGET_LABEL, exact: true }).boundingBox();
  383 |     afterTop = afterBox?.y?.toFixed(2) ?? 'GONE';
  384 |     afterTransform = await page.getByRole('button', { name: TARGET_LABEL, exact: true })
  385 |       .evaluate(el => window.getComputedStyle(el).transform);
  386 |   } catch { afterTop = 'GONE'; afterTransform = 'GONE'; }
> 387 |   const afterScrollTop = await deckScroll.evaluate(el => el.scrollTop);
      |                                           ^ Error: locator.evaluate: Target page, context or browser has been closed
  388 | 
  389 |   console.log(`[COMBINED] AFTER   — top=${afterTop}, transform="${afterTransform}", scrollTop=${afterScrollTop}`);
  390 | 
  391 |   const activated = !stillStacked;
  392 |   const physicallyMoved80 = Math.abs(adjShift80) > 1;
  393 |   const physicallyMoved110 = Math.abs(adjShift110) > 1;
  394 |   const transformChanged = during80Transform !== beforeTransform;
  395 | 
  396 |   await saveEvidence(page, 'COMBINED-AFTER-RELEASE');
  397 | 
  398 |   // ── Summary ──
  399 |   console.log('');
  400 |   console.log('══════════════════════════════════════════════');
  401 |   console.log('[COMBINED] AUTHORITATIVE MEASUREMENT SUMMARY');
  402 |   console.log(`  Deck: clientH=${sm.clientHeight} scrollH=${sm.scrollHeight} → NON-OVERFLOWING=${nonOverflowing}`);
  403 |   console.log(`  Target: "${TARGET_LABEL}" enabled=${isEnabled}`);
  404 |   console.log('');
  405 |   console.log('  Metric               | BEFORE   | DURING-80px | DURING-110px | AFTER-RELEASE');
  406 |   console.log(`  top (px)             | ${beforeBox?.y?.toFixed(2).padStart(8)} | ${during80Box?.y?.toFixed(2).padStart(11)} | ${during110Box?.y?.toFixed(2).padStart(12)} | ${afterTop.padStart(13)}`);
  407 |   console.log(`  transform            | ${'none'.padStart(8)} | ${(during80Transform ?? 'N/A').substring(0,11).padStart(11)} | ${(during110Transform ?? 'N/A').substring(0,12).padStart(12)} | ${afterTransform.substring(0,13).padStart(13)}`);
  408 |   console.log(`  parent scrollTop     | ${beforeScrollTop.toString().padStart(8)} | ${during80Scroll.toString().padStart(11)} | ${during110Scroll.toString().padStart(12)} | ${afterScrollTop.toString().padStart(13)}`);
  409 |   console.log(`  scroll-adj Y shift   | ${('0').padStart(8)} | ${adjShift80.toFixed(2).padStart(11)} | ${adjShift110.toFixed(2).padStart(12)} | ${'N/A'.padStart(13)}`);
  410 |   console.log('');
  411 |   console.log(`  physicallyMoved at 80px  (>1 px):    ${physicallyMoved80}`);
  412 |   console.log(`  physicallyMoved at 110px (>1 px):   ${physicallyMoved110}`);
  413 |   console.log(`  transform changed during drag:       ${transformChanged}`);
  414 |   console.log(`  bar activated by drag/release:       ${activated}`);
  415 |   console.log('');
  416 |   console.log(`  BAR PHYSICALLY MOVES DURING DRAG  = ${physicallyMoved80 || physicallyMoved110 ? 'YES' : 'NO'}`);
  417 |   console.log(`  BAR ACTIVATES FROM DRAG/RELEASE   = ${activated ? 'YES' : 'NO'}`);
  418 |   console.log(`  NORMAL TAP ACTIVATES              = tested in TestA`);
  419 |   console.log(`  REQUIREMENT "MUST NOT MOVE"       = ${!physicallyMoved80 && !physicallyMoved110 ? 'PASS' : 'FAIL'}`);
  420 |   console.log('══════════════════════════════════════════════');
  421 | });
  422 | 
```