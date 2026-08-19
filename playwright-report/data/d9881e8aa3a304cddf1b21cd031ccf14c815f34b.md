# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/viewport-safe.spec.ts >> R0090/R0091 — bottom nav & safe-area CSS >> safe-area CSS classes are present in rendered CSSOM
- Location: tests/e2e/phase1b/viewport-safe.spec.ts:160:7

# Error details

```
Error: CSS class .tw-ms-sheet must be defined in embedded <style>

expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - button "Open navigation menu" [ref=e6] [cursor=pointer]
      - generic [ref=e8]: TrailWeigh
    - generic [ref=e45]:
      - generic [ref=e52]:
        - generic [ref=e53]: Demo Pack List
        - generic [ref=e54]:
          - generic [ref=e55]: "21"
          - generic [ref=e56]: items
      - button "Expand all categories" [ref=e57] [cursor=pointer]
      - generic [ref=e60]:
        - generic [ref=e61]: 6 categories
        - generic [ref=e62]: 16 Selected
    - generic [ref=e68]:
      - generic [ref=e70]:
        - button [ref=e71] [cursor=pointer]: Edit
        - button [ref=e75] [cursor=pointer]: Delete
        - generic [ref=e80] [cursor=pointer]:
          - button "Open Backpack category" [ref=e81]
          - generic [ref=e86]:
            - generic [ref=e88]:
              - generic [ref=e89]: Backpack
              - generic [ref=e90]: 3 items · 2 selected
            - generic [ref=e91]: 72.50 oz
      - generic [ref=e93]:
        - button [ref=e94] [cursor=pointer]: Edit
        - button [ref=e98] [cursor=pointer]: Delete
        - generic [ref=e103] [cursor=pointer]:
          - button "Open Clothing category" [ref=e104]
          - generic [ref=e107]:
            - generic [ref=e109]:
              - generic [ref=e110]: Clothing
              - generic [ref=e111]: 5 items · 4 selected
            - generic [ref=e112]: 50.70 oz
      - generic [ref=e114]:
        - button [ref=e115] [cursor=pointer]: Edit
        - button [ref=e119] [cursor=pointer]: Delete
        - generic [ref=e124] [cursor=pointer]:
          - button "Open Toiletries category" [ref=e125]
          - generic [ref=e130]:
            - generic [ref=e132]:
              - generic [ref=e133]: Toiletries
              - generic [ref=e134]: 4 items · 2 selected
            - generic [ref=e135]: 2.60 oz
      - generic [ref=e137]:
        - button [ref=e138] [cursor=pointer]: Edit
        - button [ref=e142] [cursor=pointer]: Delete
        - generic [ref=e147] [cursor=pointer]:
          - button "Open Electronics category" [ref=e148]
          - generic [ref=e151]:
            - generic [ref=e153]:
              - generic [ref=e154]: Electronics
              - generic [ref=e155]: 3 items · 3 selected
            - generic [ref=e156]: 14.40 oz
      - generic [ref=e158]:
        - button [ref=e159] [cursor=pointer]: Edit
        - button [ref=e163] [cursor=pointer]: Delete
        - generic [ref=e168] [cursor=pointer]:
          - button "Open Shelter category" [ref=e169]
          - generic [ref=e174]:
            - generic [ref=e176]:
              - generic [ref=e177]: Shelter
              - generic [ref=e178]: 3 items · 3 selected
            - generic [ref=e179]: 90.00 oz
      - generic [ref=e181]:
        - button [ref=e182] [cursor=pointer]: Edit
        - button [ref=e186] [cursor=pointer]: Delete
        - generic [ref=e191] [cursor=pointer]:
          - button "Open Kitchen category" [ref=e192]
          - generic [ref=e198]:
            - generic [ref=e200]:
              - generic [ref=e201]: Kitchen
              - generic [ref=e202]: 3 items · 2 selected
            - generic [ref=e203]: 13.70 oz
    - generic [ref=e206]:
      - button "Locker — saved lists" [ref=e207] [cursor=pointer]:
        - generic [ref=e210]: Locker
      - button "Summary — pack weight and progress" [ref=e212] [cursor=pointer]:
        - generic [ref=e214]: Summary
      - button "Add — add items, categories, or import" [ref=e216] [cursor=pointer]:
        - generic [ref=e218]: Add
      - button "Search — find gear" [ref=e220] [cursor=pointer]:
        - generic [ref=e224]: Search
      - button "Next controls" [ref=e226] [cursor=pointer]:
        - generic [ref=e229]: Next
    - navigation [ref=e230]:
      - generic [ref=e231]: TrailWeigh
      - list [ref=e233]:
        - listitem [ref=e234]:
          - button [ref=e235] [cursor=pointer]:
            - generic [ref=e239]: Home
        - listitem [ref=e241]:
          - button [disabled] [ref=e242]:
            - generic [ref=e245]:
              - generic [ref=e246]: Master Library
              - generic [ref=e247]: Coming soon
        - listitem [ref=e248]:
          - button [ref=e249] [cursor=pointer]:
            - generic [ref=e252]: My Lists
        - listitem [ref=e254]:
          - button [ref=e255] [cursor=pointer]:
            - generic [ref=e259]: Help & Tutorials
        - listitem [ref=e261]:
          - button [ref=e262] [cursor=pointer]:
            - generic [ref=e266]: Settings
      - button [ref=e269] [cursor=pointer]:
        - generic [ref=e272]:
          - generic [ref=e273]: Right-handed
          - generic [ref=e274]: Tap to flip menu side
  - region "Notifications (F8)":
    - list
```

# Test source

```ts
  66  |   test('category view: no horizontal overflow at 320 px', async ({ browser, errors }) => {
  67  |     const ctx = await browser.newContext({ viewport: { width: 320, height: 700 } });
  68  |     const page = await ctx.newPage();
  69  |     page.on('pageerror', e => errors.pageErrors.push(e.message));
  70  |     await gotoDemo(page);
  71  | 
  72  |     const { body, html } = await getScrollWidths(page);
  73  |     expect(body, 'body must not overflow 320 px in category view').toBeLessThanOrEqual(320);
  74  |     expect(html,  'html  must not overflow 320 px in category view').toBeLessThanOrEqual(320);
  75  |     expect(errors.pageErrors).toEqual([]);
  76  |     await ctx.close();
  77  |   });
  78  | 
  79  |   test('category open + item expanded: no horizontal overflow at 320 px', async ({ browser, errors }) => {
  80  |     const ctx = await browser.newContext({ viewport: { width: 320, height: 700 } });
  81  |     const page = await ctx.newPage();
  82  |     page.on('pageerror', e => errors.pageErrors.push(e.message));
  83  |     await gotoDemo(page);
  84  | 
  85  |     // Open first category
  86  |     const firstCatBtn = page.getByRole('button', { name: /^Open .+ category$/ }).first();
  87  |     await firstCatBtn.click();
  88  |     await page.waitForTimeout(350);
  89  | 
  90  |     // Expand first item row (if one exists) to expose Location/Photo rows
  91  |     const firstItemRow = page.locator('[data-testid="main-scroll"] [data-swipe-key]').first();
  92  |     const rowVisible = await firstItemRow.isVisible().catch(() => false);
  93  |     if (rowVisible) {
  94  |       await firstItemRow.click();
  95  |       await page.waitForTimeout(350);
  96  |     }
  97  | 
  98  |     const { body, html } = await getScrollWidths(page);
  99  |     expect(body, 'body must not overflow 320 px after category/item expansion').toBeLessThanOrEqual(320);
  100 |     expect(html,  'html  must not overflow 320 px after category/item expansion').toBeLessThanOrEqual(320);
  101 |     expect(errors.pageErrors).toEqual([]);
  102 |     await ctx.close();
  103 |   });
  104 | 
  105 |   test('location view toggle: no horizontal overflow at 320 px', async ({ browser, errors }) => {
  106 |     const ctx = await browser.newContext({ viewport: { width: 320, height: 700 } });
  107 |     const page = await ctx.newPage();
  108 |     page.on('pageerror', e => errors.pageErrors.push(e.message));
  109 |     await gotoDemo(page);
  110 | 
  111 |     // The location/category toggle appears as an aria-pressed button.
  112 |     // It may be absent when the list has no locations — that is fine; we still
  113 |     // check that switching to location view (if available) doesn't overflow.
  114 |     const locBtn = page.locator('button[aria-pressed]').filter({ hasText: /location/i });
  115 |     const locVisible = await locBtn.first().isVisible().catch(() => false);
  116 |     if (locVisible) {
  117 |       await locBtn.first().click();
  118 |       await page.waitForTimeout(350);
  119 |     }
  120 | 
  121 |     const { body, html } = await getScrollWidths(page);
  122 |     expect(body, 'body must not overflow 320 px in location view').toBeLessThanOrEqual(320);
  123 |     expect(html,  'html  must not overflow 320 px in location view').toBeLessThanOrEqual(320);
  124 |     expect(errors.pageErrors).toEqual([]);
  125 |     await ctx.close();
  126 |   });
  127 | 
  128 | });
  129 | 
  130 | test.describe('R0090/R0091 — bottom nav & safe-area CSS', () => {
  131 | 
  132 |   test('bottom nav is visible and within viewport at 390×844 (iPhone 14)', async ({ browser, errors }) => {
  133 |     const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  134 |     const page = await ctx.newPage();
  135 |     page.on('pageerror', e => errors.pageErrors.push(e.message));
  136 |     await gotoDemo(page);
  137 | 
  138 |     const nav = page.locator('[data-testid="bottom-nav"]');
  139 |     await expect(nav).toBeVisible();
  140 | 
  141 |     const box = await nav.boundingBox();
  142 |     expect(box, 'bottom-nav bounding box must exist').not.toBeNull();
  143 | 
  144 |     // Nav bottom edge must not exceed viewport height (not clipped below fold)
  145 |     expect(
  146 |       box!.y + box!.height,
  147 |       'bottom-nav bottom edge must be within viewport',
  148 |     ).toBeLessThanOrEqual(844 + 2); // +2px rounding tolerance
  149 | 
  150 |     // Nav must occupy the lower portion of the screen (not floating in the middle)
  151 |     expect(box!.y, 'bottom-nav must be in the lower half of the 844px viewport').toBeGreaterThan(420);
  152 | 
  153 |     // Nav must have non-trivial height (proves it is rendered, not collapsed)
  154 |     expect(box!.height, 'bottom-nav must be at least 44 px tall').toBeGreaterThanOrEqual(44);
  155 | 
  156 |     expect(errors.pageErrors).toEqual([]);
  157 |     await ctx.close();
  158 |   });
  159 | 
  160 |   test('safe-area CSS classes are present in rendered CSSOM', async ({ page, errors }) => {
  161 |     await gotoDemo(page);
  162 | 
  163 |     // R0090 sheet-panel classes
  164 |     for (const token of ['tw-sa-36', 'tw-sa-40', 'tw-cat-sheet', 'tw-ms-sheet']) {
  165 |       const found = await stylesheetContains(page, token);
> 166 |       expect(found, `CSS class .${token} must be defined in embedded <style>`).toBe(true);
      |                                                                                ^ Error: CSS class .tw-ms-sheet must be defined in embedded <style>
  167 |     }
  168 | 
  169 |     // R0091 overlay scroll-area classes
  170 |     for (const token of ['tw-sa-8', 'tw-sa-12', 'tw-sa-32']) {
  171 |       const found = await stylesheetContains(page, token);
  172 |       expect(found, `CSS class .${token} must be defined in embedded <style>`).toBe(true);
  173 |     }
  174 | 
  175 |     expect(errors.pageErrors).toEqual([]);
  176 |   });
  177 | 
  178 |   test('dvh fallback: .tw-v3-root height:100vh class rule is present in CSSOM', async ({ page, errors }) => {
  179 |     await gotoDemo(page);
  180 |     // R0090 added height:100vh to .tw-v3-root as a dvh fallback for iOS < 15.4.
  181 |     // This verifies the embedded CSS rule was parsed correctly.
  182 |     const found = await page.evaluate(() => {
  183 |       for (const sheet of Array.from(document.styleSheets)) {
  184 |         try {
  185 |           const rules = Array.from(sheet.cssRules ?? []);
  186 |           for (const r of rules) {
  187 |             if (r.cssText.includes('tw-v3-root') && r.cssText.includes('100vh')) return true;
  188 |           }
  189 |         } catch { /* cross-origin */ }
  190 |       }
  191 |       return false;
  192 |     });
  193 |     expect(found, '.tw-v3-root must have a height:100vh rule in the embedded CSS').toBe(true);
  194 |     expect(errors.pageErrors).toEqual([]);
  195 |   });
  196 | 
  197 |   test('MasterList sheet .tw-ms-sheet max-height rule uses vh and/or dvh', async ({ page, errors }) => {
  198 |     await gotoDemo(page);
  199 |     const found = await page.evaluate(() => {
  200 |       for (const sheet of Array.from(document.styleSheets)) {
  201 |         try {
  202 |           const rules = Array.from(sheet.cssRules ?? []);
  203 |           for (const r of rules) {
  204 |             if (r.cssText.includes('tw-ms-sheet') && r.cssText.includes('max-height')) return true;
  205 |           }
  206 |         } catch { /* cross-origin */ }
  207 |       }
  208 |       return false;
  209 |     });
  210 |     expect(found, '.tw-ms-sheet must have a max-height rule').toBe(true);
  211 |     expect(errors.pageErrors).toEqual([]);
  212 |   });
  213 | 
  214 | });
  215 | 
```