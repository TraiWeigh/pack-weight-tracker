# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/r0099-bottom-group-loop.spec.ts >> R0099 loops Bottom Box Groups at 360×800
- Location: tests/e2e/phase1b/r0099-bottom-group-loop.spec.ts:81:7

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 3

- Array []
+ Array [
+   "503 POST https://causal-urchin-55.clerk.accounts.dev/v1/environment?__clerk_api_version=2026-05-12&_clerk_js_version=6.29.2&_method=PATCH&__clerk_db_jwt=dvb_3IGabyPr3uzLDD239KRYcrho3UG",
+ ]
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
      - button "Expand all categories" [ref=e58] [cursor=pointer]
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
      - generic [ref=e194]:
        - button [ref=e195] [cursor=pointer]: Edit
        - button [ref=e199] [cursor=pointer]: Delete
        - generic [ref=e204] [cursor=pointer]:
          - button "Open Kitchen category" [ref=e205]
          - generic [ref=e211]:
            - generic [ref=e213]:
              - generic [ref=e214]: Kitchen
              - generic [ref=e215]: 3 items · 2 selected
            - generic [ref=e216]: 13.70 oz
    - generic [ref=e219]:
      - button "Previous controls" [ref=e220] [cursor=pointer]:
        - generic [ref=e221]: Back
      - button "Save — save list to Locker" [ref=e226] [cursor=pointer]:
        - generic [ref=e231]: Save
      - button "Share — create a review link" [ref=e233] [cursor=pointer]:
        - generic [ref=e240]: Share
      - button "More — settings and tools" [ref=e242] [cursor=pointer]:
        - generic [ref=e247]: More
      - button "Next controls" [ref=e249] [cursor=pointer]:
        - generic [ref=e250]: Next
    - navigation [ref=e254]:
      - generic [ref=e255]: TrailWeigh
      - list [ref=e257]:
        - listitem [ref=e258]:
          - button [ref=e259] [cursor=pointer]:
            - generic [ref=e263]: Home
        - listitem [ref=e265]:
          - button [disabled] [ref=e266]:
            - generic [ref=e269]:
              - generic [ref=e270]: Master Library
              - generic [ref=e271]: Coming soon
        - listitem [ref=e272]:
          - button [ref=e273] [cursor=pointer]:
            - generic [ref=e276]: My Lists
        - listitem [ref=e278]:
          - button [ref=e279] [cursor=pointer]:
            - generic [ref=e283]: Help & Tutorials
        - listitem [ref=e285]:
          - button [ref=e286] [cursor=pointer]:
            - generic [ref=e290]: Settings
      - button [ref=e293] [cursor=pointer]:
        - generic [ref=e296]:
          - generic [ref=e297]: Right-handed
          - generic [ref=e298]: Tap to flip menu side
  - region "Notifications (F8)":
    - list
```

# Test source

```ts
  51  |       wedgeGap: (() => {
  52  |         const wedges = Array.from(document.querySelectorAll<HTMLElement>('[data-cat] [data-testid^="cat-header-"] > button'));
  53  |         return wedges.length > 1
  54  |           ? wedges[1].getBoundingClientRect().top - wedges[0].getBoundingClientRect().bottom
  55  |           : null;
  56  |       })(),
  57  |       homeGap: (() => {
  58  |         const buttons = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="home-content-scroll"] button[aria-label^="Start Here"], [data-testid="home-content-scroll"] button[aria-label^="Tutorials"]'));
  59  |         return buttons.length > 1
  60  |           ? buttons[1].getBoundingClientRect().top - buttons[0].getBoundingClientRect().bottom
  61  |           : null;
  62  |       })(),
  63  |     };
  64  |   });
  65  | }
  66  | 
  67  | async function swipe(page: import('@playwright/test').Page, direction: 'forward' | 'reverse') {
  68  |   const box = await page.getByTestId('bottom-nav').boundingBox();
  69  |   expect(box).not.toBeNull();
  70  |   const y = box!.y + box!.height / 2;
  71  |   const startX = direction === 'forward' ? box!.x + box!.width * 0.75 : box!.x + box!.width * 0.25;
  72  |   const endX = direction === 'forward' ? startX - 100 : startX + 100;
  73  |   await page.mouse.move(startX, y);
  74  |   await page.mouse.down();
  75  |   await page.mouse.move(endX, y, { steps: 4 });
  76  |   await page.mouse.up();
  77  |   await page.waitForTimeout(430);
  78  | }
  79  | 
  80  | for (const viewport of VIEWPORTS) {
  81  |   test(`R0099 loops Bottom Box Groups at ${viewport.width}×${viewport.height}`, async ({ page, errors }) => {
  82  |     await page.setViewportSize(viewport);
  83  |     await page.goto('/mobile-functional-v3');
  84  |     await page.waitForSelector('[data-testid="bottom-nav"]');
  85  |     await page.waitForSelector('[data-testid="main-scroll"]');
  86  | 
  87  |     const initialShell = await shell(page);
  88  |     expect(await groupIndex(page)).toBe(0);
  89  | 
  90  |     const forwardSequence: number[] = [0];
  91  |     for (let i = 0; i < GROUP_COUNT; i++) {
  92  |       await next(page);
  93  |       forwardSequence.push(await groupIndex(page));
  94  |     }
  95  |     expect(forwardSequence).toEqual([0, 1, 2, 3, 0]);
  96  |     if (viewport.width === 402 && viewport.height === 714) {
  97  |       await page.screenshot({ path: 'reports/r0099/screenshots/01-forward-wrap-first-group-402x714.png', fullPage: false });
  98  |     }
  99  | 
  100 |     const reverseSequence: number[] = [0];
  101 |     // Group 1 has no visible Back box by design; its existing reverse interaction
  102 |     // is the horizontal swipe. Once wrapped to Group 4, the existing Back box
  103 |     // continues the reverse path without changing the five-box layout.
  104 |     await swipe(page, 'reverse');
  105 |     reverseSequence.push(await groupIndex(page));
  106 |     for (let i = 1; i < GROUP_COUNT; i++) {
  107 |       await back(page);
  108 |       reverseSequence.push(await groupIndex(page));
  109 |     }
  110 |     expect(reverseSequence).toEqual([0, 3, 2, 1, 0]);
  111 |     if (viewport.width === 402 && viewport.height === 714) {
  112 |       await page.screenshot({ path: 'reports/r0099/screenshots/02-reverse-wrap-last-group-402x714.png', fullPage: false });
  113 |     }
  114 | 
  115 |     for (let cycle = 0; cycle < 3; cycle++) {
  116 |       for (let i = 0; i < GROUP_COUNT; i++) await next(page);
  117 |       expect(await groupIndex(page)).toBe(0);
  118 |     }
  119 |     for (let cycle = 0; cycle < 3; cycle++) {
  120 |       await swipe(page, 'reverse');
  121 |       for (let i = 1; i < GROUP_COUNT; i++) await back(page);
  122 |       expect(await groupIndex(page)).toBe(0);
  123 |     }
  124 | 
  125 |     await next(page);
  126 |     await activeGroup(page).getByTestId('bottom-back-chevron').press('Enter');
  127 |     await page.waitForTimeout(430);
  128 |     expect(await groupIndex(page)).toBe(0);
  129 | 
  130 |     await swipe(page, 'forward');
  131 |     expect(await groupIndex(page)).toBe(1);
  132 |     await swipe(page, 'reverse');
  133 |     expect(await groupIndex(page)).toBe(0);
  134 |     await swipe(page, 'reverse');
  135 |     expect(await groupIndex(page)).toBe(3);
  136 |     if (viewport.width === 402 && viewport.height === 714) {
  137 |       await page.screenshot({ path: 'reports/r0099/screenshots/03-swipe-reverse-wrap-402x714.png', fullPage: false });
  138 |     }
  139 | 
  140 |     const finalShell = await shell(page);
  141 |     for (const key of ['app', 'summary', 'filter', 'main', 'nav'] as const) {
  142 |       expect(finalShell[key].top, `${key} top stays fixed`).toBeCloseTo(initialShell[key].top, 0);
  143 |       expect(finalShell[key].bottom, `${key} bottom stays fixed`).toBeCloseTo(initialShell[key].bottom, 0);
  144 |       expect(finalShell[key].height, `${key} height stays fixed`).toBeCloseTo(initialShell[key].height, 1);
  145 |     }
  146 |     expect(finalShell.rootWidth).toBe(viewport.width);
  147 |     expect(finalShell.documentWidth).toBe(viewport.width);
  148 |     expect(finalShell.wedgeGap).toBe(1);
  149 |     expect(finalShell.homeGap).toBeNull();
  150 |     expect(errors.pageErrors).toEqual([]);
> 151 |     expect(errors.serverErrors).toEqual([]);
      |                                 ^ Error: expect(received).toEqual(expected) // deep equality
  152 |     expect(errors.consoleErrors).toEqual([]);
  153 |   });
  154 | }
  155 | 
  156 | test('R0099 loops from Home without changing the checklist shell', async ({ page, errors }) => {
  157 |   await page.setViewportSize({ width: 402, height: 714 });
  158 |   await page.goto('/mobile-functional-v3');
  159 |   await page.waitForSelector('[data-testid="main-scroll"]');
  160 |   await page.getByTestId('hamburger-btn').click();
  161 |   await page.getByTestId('drawer-nav-home').click();
  162 |   await expect(page.getByTestId('home-screen')).toBeVisible();
  163 | 
  164 |   expect(await groupIndex(page)).toBe(0);
  165 |   await next(page);
  166 |   await next(page);
  167 |   await next(page);
  168 |   await next(page);
  169 |   expect(await groupIndex(page)).toBe(0);
  170 |   // Group 1 intentionally does not render a Back box in the five-box layout.
  171 |   // Verify Home's reverse loop through the existing swipe interaction instead.
  172 |   await swipe(page, 'reverse');
  173 |   expect(await groupIndex(page)).toBe(3);
  174 |   expect(errors.pageErrors).toEqual([]);
  175 |   expect(errors.serverErrors).toEqual([]);
  176 |   expect(errors.consoleErrors).toEqual([]);
  177 | });
```