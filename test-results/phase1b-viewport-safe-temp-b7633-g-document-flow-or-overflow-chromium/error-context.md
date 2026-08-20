# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/viewport-safe.spec.ts >> temporary real-device viewport diagnostic >> reports live geometry without adding document flow or overflow
- Location: tests/e2e/phase1b/viewport-safe.spec.ts:100:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Home', exact: true })
    - locator resolved to <button aria-label="Home" data-component-name="button" data-testid="drawer-nav-home" data-replit-metadata="artifacts/pack-checklist/src/components/NavDrawer.tsx:256:14">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not stable
    - retrying click action
    - waiting 20ms
    - waiting for element to be visible, enabled and stable
    - element is not stable
  2 × retrying click action
      - waiting 100ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <button type="button" data-component-name="button" data-testid="viewport-diagnostic-collapse" data-replit-metadata="artifacts/pack-checklist/src/components/ViewportDiagnostic.tsx:459:16">Hide</button> from <div data-component-name="div" data-testid="viewport-diagnostic" aria-label="Temporary viewport diagnostic" data-replit-metadata="artifacts/pack-checklist/src/components/ViewportDiagnostic.tsx:374:6">…</div> subtree intercepts pointer events
  112 × retrying click action
        - waiting 500ms
        - waiting for element to be visible, enabled and stable
        - element is visible, enabled and stable
        - scrolling into view if needed
        - done scrolling
        - <button type="button" data-component-name="button" data-testid="viewport-diagnostic-collapse" data-replit-metadata="artifacts/pack-checklist/src/components/ViewportDiagnostic.tsx:459:16">Hide</button> from <div data-component-name="div" data-testid="viewport-diagnostic" aria-label="Temporary viewport diagnostic" data-replit-metadata="artifacts/pack-checklist/src/components/ViewportDiagnostic.tsx:374:6">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=f1e1]:
  - generic [ref=f1e2]:
    - generic [ref=f1e4]:
      - generic [ref=f1e5]:
        - button "Open navigation menu" [active] [ref=f1e6] [cursor=pointer]
        - generic [ref=f1e8]: TrailWeigh
      - generic [ref=f1e45]:
        - generic [ref=f1e52]:
          - generic [ref=f1e53]: Demo Pack List
          - generic [ref=f1e54]:
            - generic [ref=f1e55]: "21"
            - generic [ref=f1e56]: items
        - button "Expand all categories" [ref=f1e57] [cursor=pointer]
        - generic [ref=f1e60]:
          - generic [ref=f1e61]: 6 categories
          - generic [ref=f1e62]: 16 Selected
      - generic [ref=f1e69]:
        - generic [ref=f1e71]:
          - button [ref=f1e72] [cursor=pointer]: Edit
          - button [ref=f1e76] [cursor=pointer]: Delete
          - generic [ref=f1e81] [cursor=pointer]:
            - button "Open Backpack category" [ref=f1e82]
            - generic [ref=f1e87]:
              - generic [ref=f1e89]:
                - generic [ref=f1e90]: Backpack
                - generic [ref=f1e91]: 3 items · 2 selected
              - generic [ref=f1e92]: 72.50 oz
        - generic [ref=f1e94]:
          - button [ref=f1e95] [cursor=pointer]: Edit
          - button [ref=f1e99] [cursor=pointer]: Delete
          - generic [ref=f1e104] [cursor=pointer]:
            - button "Open Clothing category" [ref=f1e105]
            - generic [ref=f1e108]:
              - generic [ref=f1e110]:
                - generic [ref=f1e111]: Clothing
                - generic [ref=f1e112]: 5 items · 4 selected
              - generic [ref=f1e113]: 50.70 oz
        - generic [ref=f1e115]:
          - button [ref=f1e116] [cursor=pointer]: Edit
          - button [ref=f1e120] [cursor=pointer]: Delete
          - generic [ref=f1e125] [cursor=pointer]:
            - button "Open Toiletries category" [ref=f1e126]
            - generic [ref=f1e131]:
              - generic [ref=f1e133]:
                - generic [ref=f1e134]: Toiletries
                - generic [ref=f1e135]: 4 items · 2 selected
              - generic [ref=f1e136]: 2.60 oz
        - generic [ref=f1e138]:
          - button [ref=f1e139] [cursor=pointer]: Edit
          - button [ref=f1e143] [cursor=pointer]: Delete
          - generic [ref=f1e148] [cursor=pointer]:
            - button "Open Electronics category" [ref=f1e149]
            - generic [ref=f1e152]:
              - generic [ref=f1e154]:
                - generic [ref=f1e155]: Electronics
                - generic [ref=f1e156]: 3 items · 3 selected
              - generic [ref=f1e157]: 14.40 oz
        - generic [ref=f1e159]:
          - button [ref=f1e160] [cursor=pointer]: Edit
          - button [ref=f1e164] [cursor=pointer]: Delete
          - generic [ref=f1e169] [cursor=pointer]:
            - button "Open Shelter category" [ref=f1e170]
            - generic [ref=f1e175]:
              - generic [ref=f1e177]:
                - generic [ref=f1e178]: Shelter
                - generic [ref=f1e179]: 3 items · 3 selected
              - generic [ref=f1e180]: 90.00 oz
        - generic [ref=f1e182]:
          - button [ref=f1e183] [cursor=pointer]: Edit
          - button [ref=f1e187] [cursor=pointer]: Delete
          - generic [ref=f1e192] [cursor=pointer]:
            - button "Open Kitchen category" [ref=f1e193]
            - generic [ref=f1e199]:
              - generic [ref=f1e201]:
                - generic [ref=f1e202]: Kitchen
                - generic [ref=f1e203]: 3 items · 2 selected
              - generic [ref=f1e204]: 13.70 oz
      - generic [ref=f1e207]:
        - button "Locker — saved lists" [ref=f1e208] [cursor=pointer]:
          - generic [ref=f1e211]: Locker
        - button "Summary — pack weight and progress" [ref=f1e213] [cursor=pointer]:
          - generic [ref=f1e215]: Summary
        - button "Add — add items, categories, or import" [ref=f1e217] [cursor=pointer]:
          - generic [ref=f1e219]: Add
        - button "Search — find gear" [ref=f1e221] [cursor=pointer]:
          - generic [ref=f1e225]: Search
        - button "Next controls" [ref=f1e227] [cursor=pointer]:
          - generic [ref=f1e230]: Next
      - navigation "Navigation menu" [ref=f1e232]:
        - generic [ref=f1e233]: TrailWeigh
        - list [ref=f1e235]:
          - listitem [ref=f1e236]:
            - button "Home" [ref=f1e237] [cursor=pointer]
          - listitem [ref=f1e243]:
            - button "Master Library — not yet available" [disabled] [ref=f1e244]:
              - generic [ref=f1e247]:
                - generic [ref=f1e248]: Master Library
                - generic [ref=f1e249]: Coming soon
          - listitem [ref=f1e250]:
            - button "My Lists" [ref=f1e251] [cursor=pointer]
          - listitem [ref=f1e256]:
            - button "Help & Tutorials" [ref=f1e257] [cursor=pointer]
          - listitem [ref=f1e263]:
            - button "Settings" [ref=f1e264] [cursor=pointer]
        - button "Switch to left-handed layout — menu on the right" [ref=f1e271] [cursor=pointer]:
          - generic [ref=f1e274]:
            - generic [ref=f1e275]: Right-handed
            - generic [ref=f1e276]: Tap to flip menu side
    - region "Notifications (F8)":
      - list
  - generic "Temporary viewport diagnostic":
    - generic:
      - generic:
        - strong: Viewport diagnostic
        - generic: Checklist
      - generic:
        - generic:
          - button "Hide" [ref=f1e277]
          - button "Refresh Snapshot" [ref=f1e278]
          - button "Copy Snapshot" [ref=f1e279]
        - generic:
          - generic: Live local-only snapshot · 2026-08-20T03:24:39.306Z
          - region "Viewport diagnostic key metrics":
            - strong: KEY METRICS
            - generic: "screen: 390 × 844 inner: 390 × 844 document client: 390 × 844 HIGHLIGHT document/client width: 390 visualViewport: 390 × 844 · offset 0 / 0 · scale 1 HIGHLIGHT visualViewport.height: 844 root shell: L 0 · R 390 · T 0 · B 844 · 390 × 844 HIGHLIGHT root bottom: 844 AppBar: L 0 · R 390 · T 0 · B 52 · 390 × 52 List Summary: L 0 · R 390 · T 52 · B 140.25 · 390 × 88.25 Bottom Box Groups: L 0 · R 390 · T 786 · B 844 · 390 × 58 HIGHLIGHT Bottom Box Groups top / bottom / height: 786 / 844 / 58 Home hero: unavailable checklist main content: L 0 · R 390 · T 52 · B 466 · 390 × 414 HIGHLIGHT checklist content right edge: 390 first visible category row: L 0 · R 390 · T 52 · B 121 · 390 × 69 HIGHLIGHT first visible category row right edge: 390 first visible wedge: L 0 · R 72 · T 52 · B 120 · 72 × 68 HIGHLIGHT first visible wedge right edge: 72"
          - generic: "{ \"timestamp\": \"2026-08-20T03:24:39.306Z\", \"screen\": { \"width\": 390, \"height\": 844, \"availWidth\": 390, \"availHeight\": 844, \"innerWidth\": 390, \"innerHeight\": 844, \"outerWidth\": 390, \"outerHeight\": 844, \"scrollX\": 0, \"scrollY\": 0, \"devicePixelRatio\": 1 }, \"document\": { \"clientWidth\": 390, \"clientHeight\": 844, \"scrollWidth\": 390, \"scrollHeight\": 844, \"bodyScrollWidth\": 390, \"bodyScrollHeight\": 844 }, \"visualViewport\": { \"available\": true, \"width\": 390, \"height\": 844, \"offsetLeft\": 0, \"offsetTop\": 0, \"pageLeft\": 0, \"pageTop\": 0, \"scale\": 1 }, \"trailweigh\": { \"pageState\": \"Checklist\", \"elements\": { \"rootMobileShell\": { \"selector\": \".tw-v3-root\", \"visible\": true, \"rect\": { \"top\": 0, \"bottom\": 844, \"left\": 0, \"right\": 390, \"width\": 390, \"height\": 844 } }, \"appBar\": { \"selector\": \"[data-testid=\\\"app-bar\\\"]\", \"visible\": true, \"rect\": { \"top\": 0, \"bottom\": 52, \"left\": 0, \"right\": 390, \"width\": 390, \"height\": 52 } }, \"listSummary\": { \"selector\": \"[data-testid=\\\"list-summary-bar\\\"]\", \"visible\": true, \"rect\": { \"top\": 52, \"bottom\": 140.25, \"left\": 0, \"right\": 390, \"width\": 390, \"height\": 88.25 } }, \"homeHero\": null, \"bottomBoxGroups\": { \"selector\": \"[data-testid=\\\"bottom-nav\\\"]\", \"visible\": true, \"rect\": { \"top\": 786, \"bottom\": 844, \"left\": 0, \"right\": 390, \"width\": 390, \"height\": 58 } }, \"homeContentScroller\": null, \"normalChecklistScroller\": { \"selector\": \"[data-testid=\\\"main-scroll\\\"]\", \"visible\": true, \"rect\": { \"top\": 52, \"bottom\": 466, \"left\": 0, \"right\": 390, \"width\": 390, \"height\": 414 } }, \"openLongCategoryViewport\": null, \"firstVisibleWedge\": { \"selector\": \"[data-cat] button[aria-expanded]\", \"visible\": true, \"rect\": { \"top\": 52, \"bottom\": 120, \"left\": 0, \"right\": 72, \"width\": 72, \"height\": 68 } } }, \"categorySamples\": { \"firstVisible\": { \"category\": \"Backpack\", \"selector\": \"[data-cat=\\\"Backpack\\\"]\", \"visible\": true, \"rect\": { \"top\": 52, \"bottom\": 121, \"left\": 0, \"right\": 390, \"width\": 390, \"height\": 69 } }, \"middleVisible\": { \"category\": \"Electronics\", \"selector\": \"[data-cat=\\\"Electronics\\\"]\", \"visible\": true, \"rect\": { \"top\": 259, \"bottom\": 328, \"left\": 0, \"right\": 390, \"width\": 390, \"height\": 69 } }, \"lastVisible\": { \"category\": \"Kitchen\", \"selector\": \"[data-cat=\\\"Kitchen\\\"]\", \"visible\": true, \"rect\": { \"top\": 397, \"bottom\": 466, \"left\": 0, \"right\": 390, \"width\": 390, \"height\": 69 } } }, \"computed\": { \"html\": { \"overflowX\": \"visible\", \"overflowY\": \"visible\" }, \"body\": { \"overflowX\": \"visible\", \"overflowY\": \"visible\" }, \"root\": { \"overflowX\": \"visible\", \"overflowY\": \"visible\", \"boxSizing\": \"border-box\", \"width\": \"390px\", \"maxWidth\": \"430px\", \"minHeight\": \"844px\" }, \"safeAreaInsets\": { \"top\": \"0px\", \"right\": \"0px\", \"bottom\": \"0px\", \"left\": \"0px\" }, \"orientation\": \"portrait\" } }, \"url\": \"/mobile-functional-v3?twViewportDebug=1\", \"userAgent\": \"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.7922.34 Safari/537.36\" }"
```

# Test source

```ts
  47  |       }
  48  |     }
  49  |     return false;
  50  |   }, token);
  51  | }
  52  | 
  53  | /** Open the isolated mobile demo with the temporary Safari diagnostic enabled. */
  54  | async function gotoDiagnosticDemo(page: import('@playwright/test').Page) {
  55  |   const response = await page.goto('/mobile-functional-v3?twViewportDebug=1');
  56  |   expect(response, 'diagnostic navigation response').not.toBeNull();
  57  |   expect(response!.ok(), `diagnostic document request failed: HTTP ${response?.status()}`).toBe(true);
  58  |   await page.waitForSelector('[data-testid="main-scroll"]', { timeout: 15000 });
  59  |   await expect(page.getByTestId('viewport-diagnostic')).toBeVisible();
  60  |   await page.getByTestId('viewport-diagnostic-toggle').click();
  61  |   await expect(page.getByTestId('viewport-diagnostic-values')).toContainText('"innerWidth"');
  62  | }
  63  | 
  64  | async function coreGeometry(page: import('@playwright/test').Page) {
  65  |   return page.evaluate(() => {
  66  |     const box = (selector: string) => {
  67  |       const element = document.querySelector(selector);
  68  |       if (!element) return null;
  69  |       const rect = element.getBoundingClientRect();
  70  |       return { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right };
  71  |     };
  72  |     return {
  73  |       documentHeight: document.documentElement.scrollHeight,
  74  |       documentWidth: document.documentElement.scrollWidth,
  75  |       bodyWidth: document.body.scrollWidth,
  76  |       appBar: box('[data-testid="app-bar"]'),
  77  |       summary: box('[data-testid="list-summary-bar"]'),
  78  |       nav: box('[data-testid="bottom-nav"]'),
  79  |     };
  80  |   });
  81  | }
  82  | 
  83  | // ── Tests ─────────────────────────────────────────────────────────────────────
  84  | 
  85  | test.describe('temporary real-device viewport diagnostic', () => {
  86  |   test('is absent by default and has no normal-mode footprint', async ({ page, errors }) => {
  87  |     await page.setViewportSize({ width: 390, height: 844 });
  88  |     await gotoDemo(page);
  89  | 
  90  |     await expect(page.getByTestId('viewport-diagnostic')).toHaveCount(0);
  91  |     const geometry = await coreGeometry(page);
  92  |     expect(geometry.documentWidth).toBeLessThanOrEqual(390);
  93  |     expect(geometry.bodyWidth).toBeLessThanOrEqual(390);
  94  |     expect(geometry.appBar).not.toBeNull();
  95  |     expect(geometry.summary).not.toBeNull();
  96  |     expect(geometry.nav).not.toBeNull();
  97  |     expect(errors.pageErrors).toEqual([]);
  98  |   });
  99  | 
  100 |   test('reports live geometry without adding document flow or overflow', async ({ page, errors }) => {
  101 |     await page.setViewportSize({ width: 390, height: 844 });
  102 |     await gotoDemo(page);
  103 |     const baseline = await coreGeometry(page);
  104 | 
  105 |     await gotoDiagnosticDemo(page);
  106 |     const diagnostic = page.getByTestId('viewport-diagnostic');
  107 |     await expect(diagnostic).toBeVisible();
  108 |     await expect(page.getByTestId('viewport-diagnostic-values')).toContainText('"visualViewport"');
  109 | 
  110 |     const snapshot = await page.getByTestId('viewport-diagnostic-values').evaluate(element =>
  111 |       JSON.parse(element.textContent || '{}'),
  112 |     );
  113 |     expect(snapshot.screen.innerWidth).toBe(390);
  114 |     expect(snapshot.visualViewport.available, 'Chromium exposes visualViewport').toBe(true);
  115 |     expect(snapshot.trailweigh.elements.rootMobileShell).not.toBeNull();
  116 |     expect(snapshot.trailweigh.elements.appBar).not.toBeNull();
  117 |     expect(snapshot.trailweigh.elements.listSummary).not.toBeNull();
  118 |     expect(snapshot.trailweigh.elements.bottomBoxGroups).not.toBeNull();
  119 |     expect(snapshot.trailweigh.categorySamples.firstVisible).not.toBeNull();
  120 |     expect(snapshot.trailweigh.elements.firstVisibleWedge).not.toBeNull();
  121 | 
  122 |     const diagnosticStyle = await diagnostic.evaluate(element => getComputedStyle(element).position);
  123 |     expect(diagnosticStyle, 'diagnostic must be out of document flow').toBe('fixed');
  124 | 
  125 |     const debugGeometry = await coreGeometry(page);
  126 |     expect(debugGeometry.documentWidth, 'diagnostic must not introduce horizontal document overflow').toBeLessThanOrEqual(390);
  127 |     expect(debugGeometry.bodyWidth, 'diagnostic must not introduce horizontal body overflow').toBeLessThanOrEqual(390);
  128 |     expect(
  129 |       Math.abs(debugGeometry.documentHeight - baseline.documentHeight),
  130 |       'diagnostic must not add document-flow height',
  131 |     ).toBeLessThanOrEqual(2);
  132 |     for (const layer of ['appBar', 'summary', 'nav'] as const) {
  133 |       expect(debugGeometry[layer]).not.toBeNull();
  134 |       expect(baseline[layer]).not.toBeNull();
  135 |       expect(
  136 |         Math.abs(debugGeometry[layer]!.top - baseline[layer]!.top),
  137 |         `${layer} top must remain unchanged with diagnostic enabled`,
  138 |       ).toBeLessThanOrEqual(2);
  139 |       expect(
  140 |         Math.abs(debugGeometry[layer]!.bottom - baseline[layer]!.bottom),
  141 |         `${layer} bottom must remain unchanged with diagnostic enabled`,
  142 |       ).toBeLessThanOrEqual(2);
  143 |     }
  144 | 
  145 |     // Verify the Home-owned scroller remains usable while the overlay is enabled.
  146 |     await page.getByTestId('hamburger-btn').click();
> 147 |     await page.getByRole('button', { name: 'Home', exact: true }).click();
      |                                                                   ^ Error: locator.click: Test timeout of 60000ms exceeded.
  148 |     await expect(page.getByTestId('home-screen')).toBeVisible();
  149 |     const homeScrollTop = await page.getByTestId('home-content-scroll').evaluate((element: HTMLElement) => {
  150 |       element.scrollTop = 120;
  151 |       return element.scrollTop;
  152 |     });
  153 |     expect(homeScrollTop, 'Home content must remain scrollable').toBeGreaterThan(0);
  154 | 
  155 |     await page.getByTestId('viewport-diagnostic-refresh').click();
  156 |     const homeSnapshot = await page.getByTestId('viewport-diagnostic-values').evaluate(element =>
  157 |       JSON.parse(element.textContent || '{}'),
  158 |     );
  159 |     expect(homeSnapshot.trailweigh.pageState).toBe('Home');
  160 |     expect(homeSnapshot.trailweigh.elements.homeContentScroller).not.toBeNull();
  161 |     expect(errors.pageErrors).toEqual([]);
  162 |   });
  163 | 
  164 |   test('keeps diagnostic controls persistent above a scrollable snapshot at constrained iPhone height', async ({ page, errors }) => {
  165 |     await page.setViewportSize({ width: 402, height: 714 });
  166 |     await gotoDiagnosticDemo(page);
  167 | 
  168 |     const toolbar = page.getByTestId('viewport-diagnostic-toolbar');
  169 |     const details = page.getByTestId('viewport-diagnostic-details');
  170 |     const scrollRegion = page.getByTestId('viewport-diagnostic-scroll');
  171 |     const keyMetrics = page.getByTestId('viewport-diagnostic-key-metrics');
  172 |     const collapse = page.getByTestId('viewport-diagnostic-collapse');
  173 |     const refresh = page.getByTestId('viewport-diagnostic-refresh');
  174 |     const copy = page.getByTestId('viewport-diagnostic-copy');
  175 | 
  176 |     await expect(toolbar).toBeVisible();
  177 |     await expect(collapse).toBeVisible();
  178 |     await expect(refresh).toBeVisible();
  179 |     await expect(copy).toBeVisible();
  180 |     await expect(keyMetrics).toContainText('KEY METRICS');
  181 |     await expect(keyMetrics).toContainText('Bottom Box Groups');
  182 |     await expect(keyMetrics).toContainText('first visible wedge');
  183 | 
  184 |     const beforeScroll = await page.evaluate(() => {
  185 |       const getRect = (testId: string) => {
  186 |         const element = document.querySelector(`[data-testid="${testId}"]`);
  187 |         if (!element) return null;
  188 |         const rect = element.getBoundingClientRect();
  189 |         return { top: rect.top, bottom: rect.bottom };
  190 |       };
  191 |       const scroll = document.querySelector<HTMLElement>('[data-testid="viewport-diagnostic-scroll"]');
  192 |       const details = document.querySelector<HTMLElement>('[data-testid="viewport-diagnostic-details"]');
  193 |       return {
  194 |         viewportHeight: window.visualViewport?.height ?? window.innerHeight,
  195 |         panelBottom: document.querySelector('[data-testid="viewport-diagnostic"]')?.getBoundingClientRect().bottom ?? 0,
  196 |         detailsHeight: details?.getBoundingClientRect().height ?? 0,
  197 |         scrollClientHeight: scroll?.clientHeight ?? 0,
  198 |         scrollHeight: scroll?.scrollHeight ?? 0,
  199 |         toolbar: getRect('viewport-diagnostic-toolbar'),
  200 |         collapse: getRect('viewport-diagnostic-collapse'),
  201 |         refresh: getRect('viewport-diagnostic-refresh'),
  202 |         copy: getRect('viewport-diagnostic-copy'),
  203 |       };
  204 |     });
  205 |     expect(beforeScroll.panelBottom, 'diagnostic panel must fit within the visual viewport').toBeLessThanOrEqual(beforeScroll.viewportHeight + 1);
  206 |     expect(beforeScroll.detailsHeight).toBeGreaterThan(0);
  207 |     expect(beforeScroll.scrollHeight, 'full snapshot must scroll inside its own region').toBeGreaterThan(beforeScroll.scrollClientHeight);
  208 |     for (const control of [beforeScroll.toolbar, beforeScroll.collapse, beforeScroll.refresh, beforeScroll.copy]) {
  209 |       expect(control).not.toBeNull();
  210 |       expect(control!.bottom, 'persistent controls must be visible without scrolling snapshot text').toBeLessThanOrEqual(beforeScroll.viewportHeight + 1);
  211 |     }
  212 | 
  213 |     await scrollRegion.evaluate((element: HTMLElement) => { element.scrollTop = element.scrollHeight; });
  214 |     const afterScroll = await page.evaluate(() => {
  215 |       const element = document.querySelector('[data-testid="viewport-diagnostic-toolbar"]');
  216 |       const rect = element?.getBoundingClientRect();
  217 |       return rect ? { top: rect.top, bottom: rect.bottom } : null;
  218 |     });
  219 |     expect(afterScroll).not.toBeNull();
  220 |     expect(Math.abs(afterScroll!.top - beforeScroll.toolbar!.top), 'toolbar must not scroll with JSON body').toBeLessThanOrEqual(1);
  221 | 
  222 |     const widths = await getScrollWidths(page);
  223 |     expect(widths.body).toBeLessThanOrEqual(402);
  224 |     expect(widths.html).toBeLessThanOrEqual(402);
  225 |     expect(errors.pageErrors).toEqual([]);
  226 |   });
  227 | 
  228 |   test('does not interfere with the bounded long-category item scroller', async ({ page, errors }) => {
  229 |     await page.setViewportSize({ width: 390, height: 844 });
  230 |     await gotoDiagnosticDemo(page);
  231 | 
  232 |     await page.getByRole('button', { name: 'Open Kitchen category' }).click();
  233 |     for (let index = 0; index < 14; index += 1) {
  234 |       await page.getByTestId('cat-add-item-btn').click();
  235 |       await page.waitForTimeout(300);
  236 |     }
  237 |     await expect(page.getByTestId('open-cat-items')).toBeVisible({ timeout: 3000 });
  238 |     const innerScroll = await page.getByTestId('open-cat-items').evaluate((element: HTMLElement) => {
  239 |       element.scrollTop = 0;
  240 |       const before = element.scrollTop;
  241 |       element.scrollTop = 120;
  242 |       return { before, after: element.scrollTop, clientHeight: element.clientHeight, scrollHeight: element.scrollHeight };
  243 |     });
  244 |     expect(innerScroll.scrollHeight, 'long category must overflow its bounded viewport').toBeGreaterThan(innerScroll.clientHeight);
  245 |     expect(innerScroll.after, 'bounded item viewport must remain scrollable').toBeGreaterThan(innerScroll.before);
  246 | 
  247 |     await page.getByTestId('viewport-diagnostic-refresh').click();
```