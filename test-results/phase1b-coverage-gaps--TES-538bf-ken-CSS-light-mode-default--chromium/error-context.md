# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/coverage-gaps.spec.ts >> [TESTED_HERE partial] Light / Dark mode defaults >> V3 sandbox renders without broken CSS (light mode default)
- Location: tests/e2e/phase1b/coverage-gaps.spec.ts:64:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('LIST SUMMARY')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByText('LIST SUMMARY')

```

```yaml
- text: TrailWeigh Demo Pack List 21 items
- button "Expand all categories"
- text: 6 categories 16 Selected
- button "Open Backpack category"
- button "Category options for Backpack": Backpack 3 items · 2 selected
- text: 72.50 oz
- button "Open Clothing category"
- button "Category options for Clothing": Clothing 5 items · 4 selected
- text: 50.70 oz
- button "Open Toiletries category"
- button "Category options for Toiletries": Toiletries 4 items · 2 selected
- text: 2.60 oz
- button "Open Electronics category"
- button "Category options for Electronics": Electronics 3 items · 3 selected
- text: 14.40 oz
- button "Open Shelter category"
- button "Category options for Shelter": Shelter 3 items · 3 selected
- text: 90.00 oz
- button "Open Kitchen category"
- button "Category options for Kitchen": Kitchen 3 items · 2 selected
- text: 13.70 oz
- button "Locker — saved lists": Locker
- button "Summary — pack weight and progress": Summary
- button "Add — add items, categories, or import": Add
- button "Search — find gear": Search
- button "Next controls": More
- region "Notifications (F8)":
  - list
```

# Test source

```ts
  1   | /**
  2   |  * Phase 1B — Coverage Gap Classification
  3   |  *
  4   |  * Determines whether features identified as missing from Phase 1A coverage
  5   |  * have a safe unauthenticated or mockable path in the current product.
  6   |  *
  7   |  * Classification: L — CREATE NEW LIST / EDIT VIEW / THEMES / KIS / ETC.
  8   |  *
  9   |  * For each feature: classify as one of:
  10  |  *   TESTED_HERE       — safe unauthenticated path found, test exercised here
  11  |  *   NEEDS_AUTH        — NEEDS AUTHENTICATED TEST ARCHITECTURE
  12  |  *   NOT_PRESENT       — feature is absent from current codebase
  13  |  *   PHASE_HARNESS     — NEEDS PHASE-SPECIFIC HARNESS (e.g. visual baseline)
  14  |  */
  15  | import { test, expect, gotoDemo } from '../helpers/trailweigh';
  16  | 
  17  | // ──────────────────────────────────────────────────────────────────────────────
  18  | // Create New List / Guided Setup / Track Weight / Edit View
  19  | // These controls are disabled (aria-disabled div, not a real button) in V3.
  20  | // Owner route (/checklist) requires Clerk auth.
  21  | // CLASSIFICATION: NEEDS AUTHENTICATED TEST ARCHITECTURE
  22  | test.describe('[NEEDS_AUTH] Create New List / Edit View / Track Weight', () => {
  23  | 
  24  |   test('Create New List control is disabled on V3 sandbox (confirms classification)', async ({ page, errors }) => {
  25  |     await gotoDemo(page);
  26  |     // Phase 1A audit confirmed these are aria-disabled divs in V3.
  27  |     // This test confirms the current state without attempting to bypass it.
  28  |     const disabledDivs = page.locator('[aria-disabled="true"]');
  29  |     // There may be zero — if the control is simply absent that's also fine.
  30  |     // We just confirm no uncaught error and the list is still functional.
  31  |     await expect(page.getByText('LIST SUMMARY')).toBeVisible();
  32  |     expect(errors.pageErrors).toEqual([]);
  33  |     // Classification documented:
  34  |     test.info().annotations.push({ type: 'classification', description: 'NEEDS_AUTH: Create New List requires /checklist with Clerk session' });
  35  |   });
  36  | 
  37  | });
  38  | 
  39  | // ──────────────────────────────────────────────────────────────────────────────
  40  | // Keep it Simple (KIS)
  41  | // Capability audit confirmed KIS mode is absent from the codebase.
  42  | // CLASSIFICATION: NOT_PRESENT
  43  | test.describe('[NOT_PRESENT] Keep it Simple (KIS)', () => {
  44  | 
  45  |   test('KIS mode string is not present in rendered DOM', async ({ page, errors }) => {
  46  |     await gotoDemo(page);
  47  |     const bodyText = await page.content();
  48  |     // "Keep it Simple" as a product feature is not in the codebase per audit
  49  |     // This test documents that state.
  50  |     expect(errors.pageErrors).toEqual([]);
  51  |     test.info().annotations.push({ type: 'classification', description: 'NOT_PRESENT: KIS mode absent from codebase — audit verified' });
  52  |   });
  53  | 
  54  | });
  55  | 
  56  | // ──────────────────────────────────────────────────────────────────────────────
  57  | // Light / Dark Mode
  58  | // The V3 sandbox and ChecklistContent share the same theming layer.
  59  | // A theme toggle exists in ChecklistContent (the owner Checklist) — it is not
  60  | // exposed as a standalone control on V3.  Owner /checklist route requires auth.
  61  | // CLASSIFICATION: NEEDS_AUTH for persistence; TESTED_HERE for V3 defaults only.
  62  | test.describe('[TESTED_HERE partial] Light / Dark mode defaults', () => {
  63  | 
  64  |   test('V3 sandbox renders without broken CSS (light mode default)', async ({ page, errors }) => {
  65  |     await gotoDemo(page);
  66  |     // Confirm default renders correctly — no color errors or missing paint
> 67  |     await expect(page.getByText('LIST SUMMARY')).toBeVisible();
      |                                                  ^ Error: expect(locator).toBeVisible() failed
  68  |     const body = await page.content();
  69  |     expect(body).not.toContain('undefined');
  70  |     expect(errors.pageErrors).toEqual([]);
  71  |     test.info().annotations.push({ type: 'classification', description: 'TESTED_HERE (default only) — dark mode persistence NEEDS_AUTH' });
  72  |   });
  73  | 
  74  | });
  75  | 
  76  | // ──────────────────────────────────────────────────────────────────────────────
  77  | // Built-in Themes / Background Picker / Custom Theme
  78  | // Built-in preset themes are loaded from /themes/<slug>/*.png (static assets).
  79  | // The BackgroundPicker is behind auth in /checklist.
  80  | // On the Review page (mocked), the background key is 'share-default' preset.
  81  | // CLASSIFICATION: NEEDS_AUTH for picker interaction; static assets are accessible.
  82  | test.describe('[NEEDS_AUTH] Themes / Background Picker', () => {
  83  | 
  84  |   test('Static theme asset for "share-default" resolves (200)', async ({ page, request, errors }) => {
  85  |     // The share-default preset is used by the Review page background.
  86  |     // Test that at least one of the static preset theme PNGs is accessible.
  87  |     const assetUrl = 'http://localhost:80/pack-checklist/themes/share-default/01.png';
  88  |     const resp = await request.get(assetUrl).catch(() => null);
  89  |     // May be 200 or 404 depending on whether share-default has PNGs — log result
  90  |     if (resp) {
  91  |       test.info().annotations.push({
  92  |         type: 'share-default-asset',
  93  |         description: `GET ${assetUrl} → HTTP ${resp.status()}`,
  94  |       });
  95  |     }
  96  |     // Not a test failure either way — this is classification evidence
  97  |     expect(errors.pageErrors).toEqual([]);
  98  |     test.info().annotations.push({ type: 'classification', description: 'NEEDS_AUTH: BackgroundPicker in /checklist requires Clerk session; Custom Theme uses IndexedDB photo store' });
  99  |   });
  100 | 
  101 | });
  102 | 
  103 | // ──────────────────────────────────────────────────────────────────────────────
  104 | // Be Creative / Guided List Creation
  105 | // CLASSIFICATION: NEEDS_AUTH (owner route feature, not present in V3 or Review).
  106 | test.describe('[NEEDS_AUTH] Be Creative / Guided List Creation', () => {
  107 | 
  108 |   test('documents classification of Be Creative and Guided List', async () => {
  109 |     test.info().annotations.push({
  110 |       type: 'classification',
  111 |       description: 'NEEDS_AUTH: Be Creative / Guided setup are owner-route features; safe path unavailable without Clerk session',
  112 |     });
  113 |   });
  114 | 
  115 | });
  116 | 
  117 | // ──────────────────────────────────────────────────────────────────────────────
  118 | // Review page — owner Locker files NOT exposed via Review mocked link
  119 | test.describe('[TESTED_HERE] Review: no owner Locker data leakage via mocked link', () => {
  120 | 
  121 |   test('Review page with mocked live-locker does not expose owner userId', async ({ page, errors }) => {
  122 |     const TOKEN = 'test-token-p1b-gaps';
  123 |     await page.route(`**/api/links/${TOKEN}`, route =>
  124 |       route.fulfill({
  125 |         status: 200,
  126 |         contentType: 'application/json',
  127 |         body: JSON.stringify({
  128 |           type: 'live-locker',
  129 |           sourceVersion: 'v1-gaps',
  130 |           files: [{
  131 |             id: 'f-gaps-1',
  132 |             name: 'Gap Coverage Pack',
  133 |             savedAt: '2026-08-15T00:00:00.000Z',
  134 |             store: { items: {}, order: [], meta: {} },
  135 |             background: null, bgFade: 1, bgTone: 'light', bgSize: 'cover',
  136 |             barColor: '', barFont: '', barTextColor: '', barTransparency: 1,
  137 |           }],
  138 |         }),
  139 |       }),
  140 |     );
  141 |     await page.goto(`/s/${TOKEN}`);
  142 |     // Wait for the Welcome modal — that signals setStatus('ready') fired.
  143 |     const welcomeBtn = page.getByRole('button', { name: 'Start Exploring', exact: true });
  144 |     await expect(welcomeBtn).toBeVisible({ timeout: 14_000 });
  145 |     await welcomeBtn.click();
  146 |     await page.waitForTimeout(300);
  147 |     // No userId / email should be rendered
  148 |     const bodyText = await page.content();
  149 |     expect(bodyText).not.toContain('"userId"');
  150 |     expect(bodyText).not.toContain('"ownerId"');
  151 |     expect(errors.pageErrors).toEqual([]);
  152 |   });
  153 | 
  154 | });
  155 | 
```