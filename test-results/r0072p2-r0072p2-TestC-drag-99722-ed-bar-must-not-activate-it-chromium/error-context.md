# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r0072p2/r0072p2.spec.ts >> TestC: drag 110 px upward on ENABLED stacked bar must not activate it
- Location: tests/e2e/r0072p2/r0072p2.spec.ts:199:5

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
  140 |     return;
  141 |   }
  142 | 
  143 |   const deckScroll = page.getByTestId('deck-scroll');
  144 | 
  145 |   // ── BEFORE ──
  146 |   const beforeBox = await targetBar.boundingBox();
  147 |   const beforeTransform = await targetBar.evaluate(el => window.getComputedStyle(el).transform);
  148 |   const beforeScrollTop = preSM.scrollTop;
  149 | 
  150 |   console.log(`[TestB] BEFORE: top=${beforeBox?.y?.toFixed(2)}, bottom=${((beforeBox?.y ?? 0) + (beforeBox?.height ?? 0)).toFixed(2)}, height=${beforeBox?.height?.toFixed(2)}, transform="${beforeTransform}", scrollTop=${beforeScrollTop}`);
  151 | 
  152 |   await saveEvidence(page, 'B-before-drag');
  153 | 
  154 |   // Center of the bar
  155 |   const cx = (beforeBox?.x ?? 0) + (beforeBox?.width ?? 0) / 2;
  156 |   const cy = (beforeBox?.y ?? 0) + (beforeBox?.height ?? 0) / 2;
  157 | 
  158 |   // ── POINTER DOWN + drag upward — incremental so gesture mode locks ──
  159 |   await page.mouse.move(cx, cy);
  160 |   await page.mouse.down();
  161 |   // Move past DRAG_SLOP_PX (8 px) to lock gesture mode
  162 |   await page.mouse.move(cx, cy - 12, { steps: 3 });
  163 |   await page.waitForTimeout(60);
  164 |   // Continue to 80 px — beyond slop, well before DRAG_ACTIVATE (48 px)
  165 |   await page.mouse.move(cx, cy - 80, { steps: 10 });
  166 |   await page.waitForTimeout(200); // hold here
  167 | 
  168 |   // ── DURING (pointer still held) ──
  169 |   const duringBox = await targetBar.boundingBox();
  170 |   const duringTransform = await targetBar.evaluate(el => window.getComputedStyle(el).transform);
  171 |   const duringScrollTop = await deckScroll.evaluate(el => el.scrollTop);
  172 | 
  173 |   const rawShift = (duringBox?.y ?? 0) - (beforeBox?.y ?? 0);
  174 |   const scrollAdjShift = rawShift - (duringScrollTop - beforeScrollTop);
  175 |   const transformChanged = duringTransform !== beforeTransform;
  176 |   const physicallyMoved = Math.abs(scrollAdjShift) > 1;
  177 | 
  178 |   console.log(`[TestB] DURING: top=${duringBox?.y?.toFixed(2)}, transform="${duringTransform}", scrollTop=${duringScrollTop}`);
  179 |   console.log(`[TestB] rawYshift=${rawShift.toFixed(2)} px, scrollAdjusted=${scrollAdjShift.toFixed(2)} px`);
  180 |   console.log(`[TestB] transformChanged=${transformChanged} (before="${beforeTransform}", during="${duringTransform}")`);
  181 |   console.log(`[TestB] parentScrollChanged=${duringScrollTop !== beforeScrollTop}`);
  182 |   console.log(`[TestB] physicallyMoved (>1 px): ${physicallyMoved} — ${!physicallyMoved ? 'PASS (no lift)' : 'FAIL (bar moved)'}`);
  183 | 
  184 |   await saveEvidence(page, 'B-mid-drag');
  185 | 
  186 |   // ── RELEASE ──
  187 |   await page.mouse.up();
  188 |   await page.waitForTimeout(400);
  189 | 
  190 |   const afterTransform = await targetBar.evaluate(el => window.getComputedStyle(el).transform);
  191 |   const afterScrollTop = await deckScroll.evaluate(el => el.scrollTop);
  192 |   console.log(`[TestB] AFTER RELEASE: transform="${afterTransform}", scrollTop=${afterScrollTop}`);
  193 | });
  194 | 
  195 | // ─────────────────────────────────────────────────────────────────────────────
  196 | // TEST C — DRAG/RELEASE MUST NOT ACTIVATE
  197 | // ─────────────────────────────────────────────────────────────────────────────
  198 | 
  199 | test('TestC: drag 110 px upward on ENABLED stacked bar must not activate it', async ({ page }) => {
  200 |   await gotoV3(page);
  201 |   await openMoreDeck(page);
  202 | 
  203 |   const { sm: preSM, nonOverflowing, isEnabled } = await verifyPreconditions(page, 'TestC');
  204 |   if (!nonOverflowing || !isEnabled) {
  205 |     console.log('[TestC] NOT RUN — preconditions not met');
  206 |     return;
  207 |   }
  208 | 
  209 |   const deckScroll = page.getByTestId('deck-scroll');
  210 |   const targetBar = page.getByRole('button', { name: TARGET_LABEL, exact: true });
  211 | 
  212 |   const beforeBox = await targetBar.boundingBox();
  213 |   const beforeTransform = await targetBar.evaluate(el => window.getComputedStyle(el).transform);
  214 |   const beforeScrollTop = preSM.scrollTop;
  215 | 
  216 |   console.log(`[TestC] BEFORE: top=${beforeBox?.y?.toFixed(2)}, transform="${beforeTransform}", scrollTop=${beforeScrollTop}`);
  217 |   console.log(`[TestC] Dragging 110 px upward (> DRAG_ACTIVATE threshold of 48 px)…`);
  218 | 
  219 |   await saveEvidence(page, 'C-before-drag-release');
  220 | 
  221 |   const cx = (beforeBox?.x ?? 0) + (beforeBox?.width ?? 0) / 2;
  222 |   const cy = (beforeBox?.y ?? 0) + (beforeBox?.height ?? 0) / 2;
  223 | 
  224 |   await page.mouse.move(cx, cy);
  225 |   await page.mouse.down();
  226 |   await page.mouse.move(cx, cy - 12, { steps: 3 }); // past DRAG_SLOP_PX (8 px)
  227 |   await page.waitForTimeout(60);
  228 |   await page.mouse.move(cx, cy - 110, { steps: 14 }); // 110 px > DRAG_ACTIVATE (48 px)
  229 |   await page.waitForTimeout(100);
  230 |   await page.mouse.up();
  231 |   await page.waitForTimeout(700); // let any animation settle
  232 | 
  233 |   // ── AFTER RELEASE ──
  234 |   const stillStacked = await page.getByRole('button', { name: TARGET_LABEL, exact: true }).isVisible();
  235 |   let afterTransform = 'N/A';
  236 |   try {
  237 |     afterTransform = await page.getByRole('button', { name: TARGET_LABEL, exact: true })
  238 |       .evaluate(el => window.getComputedStyle(el).transform);
  239 |   } catch {}
> 240 |   const afterScrollTop = await deckScroll.evaluate(el => el.scrollTop);
      |                                           ^ Error: locator.evaluate: Target page, context or browser has been closed
  241 | 
  242 |   const activated = !stillStacked;
  243 |   console.log(`[TestC] Target still in stacked state: ${stillStacked}`);
  244 |   console.log(`[TestC] Target activated by drag: ${activated}`);
  245 |   console.log(`[TestC] Transform after release: "${afterTransform}"`);
  246 |   console.log(`[TestC] ScrollTop after release: ${afterScrollTop}`);
  247 |   console.log(`[TestC] RESULT: drag/release activated bar = ${activated} — ${!activated ? 'PASS (not activated)' : 'FAIL (activated by drag)'}`);
  248 | 
  249 |   await saveEvidence(page, 'C-after-drag-release');
  250 | });
  251 | 
  252 | // ─────────────────────────────────────────────────────────────────────────────
  253 | // TEST D — SCROLL SAFETY
  254 | // ─────────────────────────────────────────────────────────────────────────────
  255 | 
  256 | test('TestD: parent scrollTop unchanged during drag (non-overflowing deck)', async ({ page }) => {
  257 |   await gotoV3(page);
  258 |   await openMoreDeck(page);
  259 | 
  260 |   const { sm: preSM, nonOverflowing } = await verifyPreconditions(page, 'TestD');
  261 |   if (!nonOverflowing) {
  262 |     console.log('[TestD] NOT RUN');
  263 |     return;
  264 |   }
  265 | 
  266 |   const deckScroll = page.getByTestId('deck-scroll');
  267 |   const targetBar = page.getByRole('button', { name: TARGET_LABEL, exact: true });
  268 |   const beforeBox = await targetBar.boundingBox();
  269 |   const cx = (beforeBox?.x ?? 0) + (beforeBox?.width ?? 0) / 2;
  270 |   const cy = (beforeBox?.y ?? 0) + (beforeBox?.height ?? 0) / 2;
  271 | 
  272 |   const scrollBefore = preSM.scrollTop;
  273 |   console.log(`[TestD] scrollTop BEFORE: ${scrollBefore}`);
  274 | 
  275 |   await page.mouse.move(cx, cy);
  276 |   await page.mouse.down();
  277 |   await page.mouse.move(cx, cy - 12, { steps: 3 });
  278 |   await page.waitForTimeout(60);
  279 |   await page.mouse.move(cx, cy - 80, { steps: 10 });
  280 |   await page.waitForTimeout(200);
  281 | 
  282 |   const scrollDuring = await deckScroll.evaluate(el => el.scrollTop);
  283 |   console.log(`[TestD] scrollTop DURING: ${scrollDuring}`);
  284 | 
  285 |   await page.mouse.up();
  286 |   await page.waitForTimeout(400);
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
```