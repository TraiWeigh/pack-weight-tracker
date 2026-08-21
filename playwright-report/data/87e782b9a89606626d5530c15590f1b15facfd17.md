# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/viewport-safe.spec.ts >> temporary real-device viewport diagnostic >> does not interfere with the bounded long-category item scroller
- Location: tests/e2e/phase1b/viewport-safe.spec.ts:265:7

# Error details

```
Error: long category must overflow its bounded viewport

expect(received).toBeGreaterThan(expected)

Expected: > 134
Received:   134
```

# Page snapshot

```yaml
- generic [ref=e1]:
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
        - generic [ref=e78]:
          - button [ref=e79] [cursor=pointer]: Edit
          - button [ref=e83] [cursor=pointer]: Delete
          - generic [ref=e88] [cursor=pointer]:
            - button "Open Backpack category" [ref=e89]
            - generic [ref=e94]:
              - generic [ref=e96]:
                - generic [ref=e97]: Backpack
                - generic [ref=e98]: 3 items · 2 selected
              - generic [ref=e99]: 72.50 oz
        - generic [ref=e102]:
          - button [ref=e103] [cursor=pointer]: Edit
          - button [ref=e107] [cursor=pointer]: Delete
          - generic [ref=e112] [cursor=pointer]:
            - button "Open Clothing category" [ref=e113]
            - generic [ref=e116]:
              - generic [ref=e118]:
                - generic [ref=e119]: Clothing
                - generic [ref=e120]: 5 items · 4 selected
              - generic [ref=e121]: 50.70 oz
        - generic [ref=e124]:
          - button [ref=e125] [cursor=pointer]: Edit
          - button [ref=e129] [cursor=pointer]: Delete
          - generic [ref=e134] [cursor=pointer]:
            - button "Open Toiletries category" [ref=e135]
            - generic [ref=e140]:
              - generic [ref=e142]:
                - generic [ref=e143]: Toiletries
                - generic [ref=e144]: 4 items · 2 selected
              - generic [ref=e145]: 2.60 oz
        - generic [ref=e148]:
          - button [ref=e149] [cursor=pointer]: Edit
          - button [ref=e153] [cursor=pointer]: Delete
          - generic [ref=e158] [cursor=pointer]:
            - button "Open Electronics category" [ref=e159]
            - generic [ref=e162]:
              - generic [ref=e164]:
                - generic [ref=e165]: Electronics
                - generic [ref=e166]: 3 items · 3 selected
              - generic [ref=e167]: 14.40 oz
        - generic [ref=e170]:
          - button [ref=e171] [cursor=pointer]: Edit
          - button [ref=e175] [cursor=pointer]: Delete
          - generic [ref=e180] [cursor=pointer]:
            - button "Open Shelter category" [ref=e181]
            - generic [ref=e186]:
              - generic [ref=e188]:
                - generic [ref=e189]: Shelter
                - generic [ref=e190]: 3 items · 3 selected
              - generic [ref=e191]: 90.00 oz
        - generic [ref=e192]:
          - generic [ref=e194]:
            - button [ref=e195] [cursor=pointer]: Edit
            - button [ref=e199] [cursor=pointer]: Delete
            - generic [ref=e204] [cursor=pointer]:
              - button "Close Kitchen category" [expanded] [ref=e205]
              - generic [ref=e211]:
                - generic [ref=e213]:
                  - generic [ref=e214]: Kitchen
                  - generic [ref=e215]: 3 items · 2 selected
                - generic [ref=e216]: 13.70 oz
          - generic [ref=e217]:
            - generic [ref=e219]:
              - button [ref=e220] [cursor=pointer]: Edit
              - button [ref=e224] [cursor=pointer]: Delete
              - generic [ref=e229]:
                - 'checkbox "Jetboil Stove: selected for checklist" [checked] [ref=e230] [cursor=pointer]'
                - button "Jetboil Stove — expand details" [ref=e231] [cursor=pointer]:
                  - generic [ref=e232]: Jetboil Stove
                  - generic [ref=e233]: "1"
            - generic [ref=e235]:
              - button [ref=e236] [cursor=pointer]: Edit
              - button [ref=e240] [cursor=pointer]: Delete
              - generic [ref=e245]:
                - 'checkbox "Titanium Spork: selected for checklist" [checked] [ref=e246] [cursor=pointer]'
                - button "Titanium Spork — expand details" [ref=e247] [cursor=pointer]:
                  - generic [ref=e248]: Titanium Spork
                  - generic [ref=e249]: "1"
            - generic [ref=e251]:
              - button [ref=e252] [cursor=pointer]: Edit
              - button [ref=e256] [cursor=pointer]: Delete
              - generic [ref=e261]:
                - 'checkbox "Freeze Dried Meals: not selected for checklist" [ref=e262] [cursor=pointer]'
                - button "Freeze Dried Meals — expand details" [ref=e263] [cursor=pointer]:
                  - generic [ref=e264]: Freeze Dried Meals
                  - generic [ref=e265]: "5"
          - button "Add item to Kitchen" [active] [ref=e267] [cursor=pointer]:
            - generic [ref=e269]: Add Item
      - generic [ref=e272]:
        - button "Locker — saved lists" [ref=e273] [cursor=pointer]:
          - generic [ref=e276]: Locker
        - button "Summary — pack weight and progress" [ref=e278] [cursor=pointer]:
          - generic [ref=e280]: Summary
        - button "Add — add items, categories, or import" [ref=e282] [cursor=pointer]:
          - generic [ref=e284]: Add
        - button "Search — find gear" [ref=e286] [cursor=pointer]:
          - generic [ref=e290]: Search
        - button "Next controls" [ref=e292] [cursor=pointer]:
          - generic [ref=e293]: Next
      - navigation [ref=e297]:
        - generic [ref=e298]: TrailWeigh
        - list [ref=e300]:
          - listitem [ref=e301]:
            - button [ref=e302] [cursor=pointer]:
              - generic [ref=e306]: Home
          - listitem [ref=e308]:
            - button [disabled] [ref=e309]:
              - generic [ref=e312]:
                - generic [ref=e313]: Master Library
                - generic [ref=e314]: Coming soon
          - listitem [ref=e315]:
            - button [ref=e316] [cursor=pointer]:
              - generic [ref=e319]: My Lists
          - listitem [ref=e321]:
            - button [ref=e322] [cursor=pointer]:
              - generic [ref=e326]: Help & Tutorials
          - listitem [ref=e328]:
            - button [ref=e329] [cursor=pointer]:
              - generic [ref=e333]: Settings
        - button [ref=e336] [cursor=pointer]:
          - generic [ref=e339]:
            - generic [ref=e340]: Right-handed
            - generic [ref=e341]: Tap to flip menu side
    - region "Notifications (F8)":
      - list
  - generic "Temporary viewport diagnostic":
    - generic:
      - generic:
        - strong: Viewport diagnostic
        - generic: Checklist
      - generic:
        - generic:
          - button "Hide" [ref=e342]
          - button "Refresh Snapshot" [ref=e343]
          - button "Copy Snapshot" [ref=e344]
        - generic:
          - generic: Live local-only snapshot · 2026-08-21T03:40:34.639Z
          - region "Viewport diagnostic key metrics":
            - strong: KEY METRICS
            - generic: "screen: 390 × 844 inner: 390 × 844 document client: 390 × 844 HIGHLIGHT document/client width: 390 visualViewport: 390 × 844 · offset 0 / 0 · scale 1 HIGHLIGHT visualViewport.height: 844 root shell: L 0 · R 390 · T 0 · B 844 · 390 × 844 HIGHLIGHT root bottom: 844 AppBar: L 0 · R 390 · T 0 · B 52 · 390 × 52 List Summary: L 0 · R 390 · T 52 · B 140.25 · 390 × 88.25 Bottom Box Groups: L 0 · R 390 · T 786 · B 844 · 390 × 58 HIGHLIGHT Bottom Box Groups top / bottom / height: 786 / 844 / 58 Home hero: unavailable checklist main content: L 0 · R 390 · T 102 · B 786 · 390 × 684 HIGHLIGHT checklist content right edge: 390 first visible category row: L 0 · R 390 · T 102 · B 167 · 390 × 65 HIGHLIGHT first visible category row right edge: 390 first visible wedge: L 0 · R 72 · T 102 · B 166 · 72 × 64 HIGHLIGHT first visible wedge right edge: 72"
          - generic: "{ \"timestamp\": \"2026-08-21T03:40:34.639Z\", \"screen\": { \"width\": 390, \"height\": 844, \"availWidth\": 390, \"availHeight\": 844, \"innerWidth\": 390, \"innerHeight\": 844, \"outerWidth\": 390, \"outerHeight\": 844, \"scrollX\": 0, \"scrollY\": 0, \"devicePixelRatio\": 1 }, \"document\": { \"clientWidth\": 390, \"clientHeight\": 844, \"scrollWidth\": 390, \"scrollHeight\": 844, \"bodyScrollWidth\": 390, \"bodyScrollHeight\": 844 }, \"visualViewport\": { \"available\": true, \"width\": 390, \"height\": 844, \"offsetLeft\": 0, \"offsetTop\": 0, \"pageLeft\": 0, \"pageTop\": 0, \"scale\": 1 }, \"trailweigh\": { \"pageState\": \"Checklist\", \"elements\": { \"rootMobileShell\": { \"selector\": \".tw-v3-root\", \"visible\": true, \"rect\": { \"top\": 0, \"bottom\": 844, \"left\": 0, \"right\": 390, \"width\": 390, \"height\": 844 } }, \"appBar\": { \"selector\": \"[data-testid=\\\"app-bar\\\"]\", \"visible\": true, \"rect\": { \"top\": 0, \"bottom\": 52, \"left\": 0, \"right\": 390, \"width\": 390, \"height\": 52 } }, \"listSummary\": { \"selector\": \"[data-testid=\\\"list-summary-bar\\\"]\", \"visible\": true, \"rect\": { \"top\": 52, \"bottom\": 140.25, \"left\": 0, \"right\": 390, \"width\": 390, \"height\": 88.25 } }, \"homeHero\": null, \"bottomBoxGroups\": { \"selector\": \"[data-testid=\\\"bottom-nav\\\"]\", \"visible\": true, \"rect\": { \"top\": 786, \"bottom\": 844, \"left\": 0, \"right\": 390, \"width\": 390, \"height\": 58 } }, \"homeContentScroller\": null, \"normalChecklistScroller\": { \"selector\": \"[data-testid=\\\"main-scroll\\\"]\", \"visible\": true, \"rect\": { \"top\": 102, \"bottom\": 786, \"left\": 0, \"right\": 390, \"width\": 390, \"height\": 684 } }, \"openLongCategoryViewport\": null, \"firstVisibleWedge\": { \"selector\": \"[data-cat] button[aria-expanded]\", \"visible\": true, \"rect\": { \"top\": 102, \"bottom\": 166, \"left\": 0, \"right\": 72, \"width\": 72, \"height\": 64 } } }, \"categorySamples\": { \"firstVisible\": { \"category\": \"Backpack\", \"selector\": \"[data-cat=\\\"Backpack\\\"]\", \"visible\": true, \"rect\": { \"top\": 102, \"bottom\": 167, \"left\": 0, \"right\": 390, \"width\": 390, \"height\": 65 } }, \"middleVisible\": { \"category\": \"Electronics\", \"selector\": \"[data-cat=\\\"Electronics\\\"]\", \"visible\": true, \"rect\": { \"top\": 297, \"bottom\": 362, \"left\": 0, \"right\": 390, \"width\": 390, \"height\": 65 } }, \"lastVisible\": { \"category\": \"Kitchen\", \"selector\": \"[data-cat=\\\"Kitchen\\\"]\", \"visible\": true, \"rect\": { \"top\": 427, \"bottom\": 492, \"left\": 0, \"right\": 390, \"width\": 390, \"height\": 65 } } }, \"computed\": { \"html\": { \"overflowX\": \"hidden\", \"overflowY\": \"hidden\" }, \"body\": { \"overflowX\": \"hidden\", \"overflowY\": \"hidden\" }, \"root\": { \"overflowX\": \"hidden\", \"overflowY\": \"hidden\", \"boxSizing\": \"border-box\", \"width\": \"390px\", \"maxWidth\": \"none\", \"minHeight\": \"0px\" }, \"safeAreaInsets\": { \"top\": \"0px\", \"right\": \"0px\", \"bottom\": \"0px\", \"left\": \"0px\" }, \"orientation\": \"portrait\" } }, \"url\": \"/mobile-functional-v3?twViewportDebug=1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36\" }"
```

# Test source

```ts
  181 |     await expect(collapse).toBeVisible();
  182 |     await expect(refresh).toBeVisible();
  183 |     await expect(copy).toBeVisible();
  184 |     await expect(keyMetrics).toContainText('KEY METRICS');
  185 |     await expect(keyMetrics).toContainText('Bottom Box Groups');
  186 |     await expect(keyMetrics).toContainText('first visible wedge');
  187 | 
  188 |     const beforeScroll = await page.evaluate(() => {
  189 |       const getRect = (testId: string) => {
  190 |         const element = document.querySelector(`[data-testid="${testId}"]`);
  191 |         if (!element) return null;
  192 |         const rect = element.getBoundingClientRect();
  193 |         return { top: rect.top, bottom: rect.bottom };
  194 |       };
  195 |       const scroll = document.querySelector<HTMLElement>('[data-testid="viewport-diagnostic-scroll"]');
  196 |       const details = document.querySelector<HTMLElement>('[data-testid="viewport-diagnostic-details"]');
  197 |       return {
  198 |         viewportHeight: window.visualViewport?.height ?? window.innerHeight,
  199 |         panelBottom: document.querySelector('[data-testid="viewport-diagnostic"]')?.getBoundingClientRect().bottom ?? 0,
  200 |         detailsHeight: details?.getBoundingClientRect().height ?? 0,
  201 |         scrollClientHeight: scroll?.clientHeight ?? 0,
  202 |         scrollHeight: scroll?.scrollHeight ?? 0,
  203 |         toolbar: getRect('viewport-diagnostic-toolbar'),
  204 |         collapse: getRect('viewport-diagnostic-collapse'),
  205 |         refresh: getRect('viewport-diagnostic-refresh'),
  206 |         copy: getRect('viewport-diagnostic-copy'),
  207 |       };
  208 |     });
  209 |     expect(beforeScroll.panelBottom, 'diagnostic panel must fit within the visual viewport').toBeLessThanOrEqual(beforeScroll.viewportHeight + 1);
  210 |     expect(beforeScroll.detailsHeight).toBeGreaterThan(0);
  211 |     expect(beforeScroll.scrollHeight, 'full snapshot must scroll inside its own region').toBeGreaterThan(beforeScroll.scrollClientHeight);
  212 |     for (const control of [beforeScroll.toolbar, beforeScroll.collapse, beforeScroll.refresh, beforeScroll.copy]) {
  213 |       expect(control).not.toBeNull();
  214 |       expect(control!.bottom, 'persistent controls must be visible without scrolling snapshot text').toBeLessThanOrEqual(beforeScroll.viewportHeight + 1);
  215 |     }
  216 | 
  217 |     await scrollRegion.evaluate((element: HTMLElement) => { element.scrollTop = element.scrollHeight; });
  218 |     const afterScroll = await page.evaluate(() => {
  219 |       const element = document.querySelector('[data-testid="viewport-diagnostic-toolbar"]');
  220 |       const rect = element?.getBoundingClientRect();
  221 |       return rect ? { top: rect.top, bottom: rect.bottom } : null;
  222 |     });
  223 |     expect(afterScroll).not.toBeNull();
  224 |     expect(Math.abs(afterScroll!.top - beforeScroll.toolbar!.top), 'toolbar must not scroll with JSON body').toBeLessThanOrEqual(1);
  225 | 
  226 |     const widths = await getScrollWidths(page);
  227 |     expect(widths.body).toBeLessThanOrEqual(402);
  228 |     expect(widths.html).toBeLessThanOrEqual(402);
  229 |     expect(errors.pageErrors).toEqual([]);
  230 |   });
  231 | 
  232 |   test('keeps the clipboard-denied fallback inside the diagnostic scroll region', async ({ page, errors }) => {
  233 |     await page.setViewportSize({ width: 402, height: 714 });
  234 |     await gotoDiagnosticDemo(page);
  235 | 
  236 |     await page.evaluate(() => {
  237 |       Object.defineProperty(navigator, 'clipboard', {
  238 |         configurable: true,
  239 |         value: {
  240 |           writeText: async () => {
  241 |             throw new Error('Clipboard deliberately denied for diagnostic fallback test');
  242 |           },
  243 |         },
  244 |       });
  245 |     });
  246 |     await page.getByTestId('viewport-diagnostic-copy').click();
  247 |     const fallback = page.getByTestId('viewport-diagnostic-fallback');
  248 |     await expect(fallback).toBeVisible();
  249 |     await expect(fallback).toHaveValue(/"innerWidth"/);
  250 | 
  251 |     const fallbackPlacement = await fallback.evaluate(element => {
  252 |       const scroll = document.querySelector('[data-testid="viewport-diagnostic-scroll"]');
  253 |       return {
  254 |         insideScrollRegion: Boolean(scroll?.contains(element)),
  255 |         documentWidth: document.documentElement.scrollWidth,
  256 |         bodyWidth: document.body.scrollWidth,
  257 |       };
  258 |     });
  259 |     expect(fallbackPlacement.insideScrollRegion).toBe(true);
  260 |     expect(fallbackPlacement.documentWidth).toBeLessThanOrEqual(402);
  261 |     expect(fallbackPlacement.bodyWidth).toBeLessThanOrEqual(402);
  262 |     expect(errors.pageErrors).toEqual([]);
  263 |   });
  264 | 
  265 |   test('does not interfere with the bounded long-category item scroller', async ({ page, errors }) => {
  266 |     await page.setViewportSize({ width: 390, height: 844 });
  267 |     await gotoDiagnosticDemo(page);
  268 | 
  269 |     await page.getByRole('button', { name: 'Open Kitchen category' }).click();
  270 |     for (let index = 0; index < 14; index += 1) {
  271 |       await page.getByTestId('cat-add-item-btn').click();
  272 |       await page.waitForTimeout(300);
  273 |     }
  274 |     await expect(page.getByTestId('open-cat-items')).toBeVisible({ timeout: 3000 });
  275 |     const innerScroll = await page.getByTestId('open-cat-items').evaluate((element: HTMLElement) => {
  276 |       element.scrollTop = 0;
  277 |       const before = element.scrollTop;
  278 |       element.scrollTop = 120;
  279 |       return { before, after: element.scrollTop, clientHeight: element.clientHeight, scrollHeight: element.scrollHeight };
  280 |     });
> 281 |     expect(innerScroll.scrollHeight, 'long category must overflow its bounded viewport').toBeGreaterThan(innerScroll.clientHeight);
      |                                                                                          ^ Error: long category must overflow its bounded viewport
  282 |     expect(innerScroll.after, 'bounded item viewport must remain scrollable').toBeGreaterThan(innerScroll.before);
  283 | 
  284 |     await page.getByTestId('viewport-diagnostic-refresh').click();
  285 |     const snapshot = await page.getByTestId('viewport-diagnostic-values').evaluate(element =>
  286 |       JSON.parse(element.textContent || '{}'),
  287 |     );
  288 |     expect(snapshot.trailweigh.elements.openLongCategoryViewport).not.toBeNull();
  289 |     expect(errors.pageErrors).toEqual([]);
  290 |   });
  291 | });
  292 | 
  293 | test.describe('R0090/R0091 — viewport width safety', () => {
  294 | 
  295 |   test('category view: no horizontal overflow at 320 px', async ({ browser, errors }) => {
  296 |     const ctx = await browser.newContext({ viewport: { width: 320, height: 700 } });
  297 |     const page = await ctx.newPage();
  298 |     page.on('pageerror', e => errors.pageErrors.push(e.message));
  299 |     await gotoDemo(page);
  300 | 
  301 |     const { body, html } = await getScrollWidths(page);
  302 |     expect(body, 'body must not overflow 320 px in category view').toBeLessThanOrEqual(320);
  303 |     expect(html,  'html  must not overflow 320 px in category view').toBeLessThanOrEqual(320);
  304 |     expect(errors.pageErrors).toEqual([]);
  305 |     await ctx.close();
  306 |   });
  307 | 
  308 |   test('category open + item expanded: no horizontal overflow at 320 px', async ({ browser, errors }) => {
  309 |     const ctx = await browser.newContext({ viewport: { width: 320, height: 700 } });
  310 |     const page = await ctx.newPage();
  311 |     page.on('pageerror', e => errors.pageErrors.push(e.message));
  312 |     await gotoDemo(page);
  313 | 
  314 |     // Open first category
  315 |     const firstCatBtn = page.getByRole('button', { name: /^Open .+ category$/ }).first();
  316 |     await firstCatBtn.click();
  317 |     await page.waitForTimeout(350);
  318 | 
  319 |     // Expand first item row (if one exists) to expose Location/Photo rows
  320 |     const firstItemRow = page.locator('[data-testid="main-scroll"] [data-swipe-key]').first();
  321 |     const rowVisible = await firstItemRow.isVisible().catch(() => false);
  322 |     if (rowVisible) {
  323 |       await firstItemRow.click();
  324 |       await page.waitForTimeout(350);
  325 |     }
  326 | 
  327 |     const { body, html } = await getScrollWidths(page);
  328 |     expect(body, 'body must not overflow 320 px after category/item expansion').toBeLessThanOrEqual(320);
  329 |     expect(html,  'html  must not overflow 320 px after category/item expansion').toBeLessThanOrEqual(320);
  330 |     expect(errors.pageErrors).toEqual([]);
  331 |     await ctx.close();
  332 |   });
  333 | 
  334 |   test('location view toggle: no horizontal overflow at 320 px', async ({ browser, errors }) => {
  335 |     const ctx = await browser.newContext({ viewport: { width: 320, height: 700 } });
  336 |     const page = await ctx.newPage();
  337 |     page.on('pageerror', e => errors.pageErrors.push(e.message));
  338 |     await gotoDemo(page);
  339 | 
  340 |     // The location/category toggle appears as an aria-pressed button.
  341 |     // It may be absent when the list has no locations — that is fine; we still
  342 |     // check that switching to location view (if available) doesn't overflow.
  343 |     const locBtn = page.locator('button[aria-pressed]').filter({ hasText: /location/i });
  344 |     const locVisible = await locBtn.first().isVisible().catch(() => false);
  345 |     if (locVisible) {
  346 |       await locBtn.first().click();
  347 |       await page.waitForTimeout(350);
  348 |     }
  349 | 
  350 |     const { body, html } = await getScrollWidths(page);
  351 |     expect(body, 'body must not overflow 320 px in location view').toBeLessThanOrEqual(320);
  352 |     expect(html,  'html  must not overflow 320 px in location view').toBeLessThanOrEqual(320);
  353 |     expect(errors.pageErrors).toEqual([]);
  354 |     await ctx.close();
  355 |   });
  356 | 
  357 | });
  358 | 
  359 | test.describe('R0090/R0091 — bottom nav & safe-area CSS', () => {
  360 | 
  361 |   test('bottom nav is visible and within viewport at 390×844 (iPhone 14)', async ({ browser, errors }) => {
  362 |     const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  363 |     const page = await ctx.newPage();
  364 |     page.on('pageerror', e => errors.pageErrors.push(e.message));
  365 |     await gotoDemo(page);
  366 | 
  367 |     const nav = page.locator('[data-testid="bottom-nav"]');
  368 |     await expect(nav).toBeVisible();
  369 | 
  370 |     const box = await nav.boundingBox();
  371 |     expect(box, 'bottom-nav bounding box must exist').not.toBeNull();
  372 | 
  373 |     // Nav bottom edge must not exceed viewport height (not clipped below fold)
  374 |     expect(
  375 |       box!.y + box!.height,
  376 |       'bottom-nav bottom edge must be within viewport',
  377 |     ).toBeLessThanOrEqual(844 + 2); // +2px rounding tolerance
  378 | 
  379 |     // Nav must occupy the lower portion of the screen (not floating in the middle)
  380 |     expect(box!.y, 'bottom-nav must be in the lower half of the 844px viewport').toBeGreaterThan(420);
  381 | 
```