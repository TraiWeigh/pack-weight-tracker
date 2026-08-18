# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/network-errors.spec.ts >> V3 sandbox — importer API error injection >> import API 500 during file upload shows safe error state, no crash
- Location: tests/e2e/phase1b/network-errors.spec.ts:117:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('LIST SUMMARY')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
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
  23  |     savedAt: '2026-08-15T00:00:00.000Z',
  24  |     store: {
  25  |       items: { Trail: [{ id: 'n1', desc: 'Trail Shoes', sub: 'Footwear', weightOz: 22, qty: 1, checked: false }] },
  26  |       order: ['Trail'],
  27  |       meta: {},
  28  |     },
  29  |     background: null, bgFade: 1, bgTone: 'light', bgSize: 'cover',
  30  |     barColor: '', barFont: '', barTextColor: '', barTransparency: 1,
  31  |   }],
  32  | };
  33  | 
  34  | // ──────────────────────────────────────────────────────────────────────────────
  35  | test.describe('Review page — network error conditions', () => {
  36  | 
  37  |   test('HTTP 400 — shows error state, no crash', async ({ page, errors }) => {
  38  |     await page.route(API_PAT, r => r.fulfill({ status: 400, body: JSON.stringify({ error: 'Bad request' }) }));
  39  |     await page.goto(REVIEW_ROUTE);
  40  |     await expect(page.getByText(/could not be loaded|error/i)).toBeVisible({ timeout: 10_000 });
  41  |     expect(errors.pageErrors).toEqual([]);
  42  |   });
  43  | 
  44  |   test('HTTP 401 — shows error state, no crash', async ({ page, errors }) => {
  45  |     await page.route(API_PAT, r => r.fulfill({ status: 401, body: JSON.stringify({ error: 'Unauthorized' }) }));
  46  |     await page.goto(REVIEW_ROUTE);
  47  |     await expect(page.getByText(/could not be loaded|error/i)).toBeVisible({ timeout: 10_000 });
  48  |     expect(errors.pageErrors).toEqual([]);
  49  |   });
  50  | 
  51  |   test('HTTP 403 — shows error state, no crash', async ({ page, errors }) => {
  52  |     await page.route(API_PAT, r => r.fulfill({ status: 403, body: JSON.stringify({ error: 'Forbidden' }) }));
  53  |     await page.goto(REVIEW_ROUTE);
  54  |     await expect(page.getByText(/could not be loaded|error/i)).toBeVisible({ timeout: 10_000 });
  55  |     expect(errors.pageErrors).toEqual([]);
  56  |   });
  57  | 
  58  |   test('HTTP 404 — shows safe not-found message, no crash', async ({ page, errors }) => {
  59  |     await page.route(API_PAT, r => r.fulfill({ status: 404, body: JSON.stringify({ error: 'Not found' }) }));
  60  |     await page.goto(REVIEW_ROUTE);
  61  |     await expect(page.getByText('could not be loaded', { exact: false }).first()).toBeVisible({ timeout: 10_000 });
  62  |     expect(errors.pageErrors).toEqual([]);
  63  |   });
  64  | 
  65  |   test('HTTP 429 — shows error state, no crash (no infinite spinner)', async ({ page, errors }) => {
  66  |     await page.route(API_PAT, r => r.fulfill({
  67  |       status: 429,
  68  |       headers: { 'Retry-After': '60' },
  69  |       body: JSON.stringify({ error: 'Too many requests' }),
  70  |     }));
  71  |     await page.goto(REVIEW_ROUTE);
  72  |     await expect(page.getByText(/loading shared list/i)).not.toBeVisible({ timeout: 12_000 }).catch(() => {});
  73  |     expect(errors.pageErrors).toEqual([]);
  74  |   });
  75  | 
  76  |   test('HTTP 500 — shows error state, no crash', async ({ page, errors }) => {
  77  |     await page.route(API_PAT, r => r.fulfill({ status: 500, body: JSON.stringify({ error: 'Server error' }) }));
  78  |     await page.goto(REVIEW_ROUTE);
  79  |     await expect(page.getByText(/could not be loaded|error/i)).toBeVisible({ timeout: 10_000 });
  80  |     expect(errors.pageErrors).toEqual([]);
  81  |   });
  82  | 
  83  |   test('slow response (2s) — shows loading then data, no crash', async ({ page, errors }) => {
  84  |     await page.route(API_PAT, async r => {
  85  |       await new Promise(res => setTimeout(res, 2000));
  86  |       await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(MOCK_LIVE) });
  87  |     });
  88  |     await page.goto(REVIEW_ROUTE);
  89  |     // Wait for Welcome modal — signals ChecklistContent is ready after the delayed response.
  90  |     const welcomeBtn = page.getByRole('button', { name: 'Start Exploring', exact: true });
  91  |     await expect(welcomeBtn).toBeVisible({ timeout: 15_000 });
  92  |     await welcomeBtn.click();
  93  |     await page.waitForTimeout(300);
  94  |     expect(errors.pageErrors).toEqual([]);
  95  |   });
  96  | 
  97  |   test('dropped / aborted request — no infinite spinner, error shown', async ({ page, errors }) => {
  98  |     await page.route(API_PAT, r => r.abort('connectionreset'));
  99  |     await page.goto(REVIEW_ROUTE);
  100 |     // Must exit loading state within 12s
  101 |     await expect(page.getByText(/loading shared list/i)).not.toBeVisible({ timeout: 12_000 }).catch(() => {});
  102 |     expect(errors.pageErrors).toEqual([]);
  103 |   });
  104 | 
  105 |   test('offline-simulated (abort connectionfailed) — error shown without crash', async ({ page, errors }) => {
  106 |     await page.route(API_PAT, r => r.abort('failed'));
  107 |     await page.goto(REVIEW_ROUTE);
  108 |     await expect(page.getByText(/could not be loaded|connection|error/i)).toBeVisible({ timeout: 12_000 });
  109 |     expect(errors.pageErrors).toEqual([]);
  110 |   });
  111 | 
  112 | });
  113 | 
  114 | // ──────────────────────────────────────────────────────────────────────────────
  115 | test.describe('V3 sandbox — importer API error injection', () => {
  116 | 
  117 |   test('import API 500 during file upload shows safe error state, no crash', async ({ page, errors }) => {
  118 |     // Block /api/import-gear with a 500
  119 |     await page.route('**/api/import-gear', r =>
  120 |       r.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Server error' }) }),
  121 |     );
  122 |     await page.goto('/mobile-functional-v3');
> 123 |     await expect(page.getByText('LIST SUMMARY')).toBeVisible({ timeout: 10_000 });
      |                                                  ^ Error: expect(locator).toBeVisible() failed
  124 |     // The app must still be functional (not crashed) — list summary still visible
  125 |     await expect(page.getByText('LIST SUMMARY')).toBeVisible();
  126 |     // The mocked 500 on /api/import-gear is expected — filter it
  127 |     const realServerErrors = errors.serverErrors.filter(e => !e.includes('/api/import-gear'));
  128 |     expect(realServerErrors, 'no unexpected 5xx errors').toEqual([]);
  129 |     expect(errors.pageErrors, 'no JS crashes').toEqual([]);
  130 |   });
  131 | 
  132 |   test('import API 400 during file upload shows safe error state, no crash', async ({ page, errors }) => {
  133 |     await page.route('**/api/import-gear', r =>
  134 |       r.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'Bad request' }) }),
  135 |     );
  136 |     await page.goto('/mobile-functional-v3');
  137 |     await expect(page.getByText('LIST SUMMARY')).toBeVisible({ timeout: 10_000 });
  138 |     expect(errors.pageErrors).toEqual([]);
  139 |   });
  140 | 
  141 | });
  142 | 
```