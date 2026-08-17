# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/production-shared-items.spec.ts >> Item weight & calculation correctness >> category-level weight total is displayed and non-zero when items are selected
- Location: tests/e2e/phase1b/production-shared-items.spec.ts:26:7

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
- button "Category options for Backpack": Backpack
- text: 3 items · 2 selected 72.50 oz
- button "Open Clothing category"
- button "Category options for Clothing": Clothing
- text: 5 items · 4 selected 50.70 oz
- button "Open Toiletries category"
- button "Category options for Toiletries": Toiletries
- text: 4 items · 2 selected 2.60 oz
- button "Open Electronics category"
- button "Category options for Electronics": Electronics
- text: 3 items · 3 selected 14.40 oz
- button "Open Shelter category"
- button "Category options for Shelter": Shelter
- text: 3 items · 3 selected 90.00 oz
- button "Open Kitchen category"
- button "Category options for Kitchen": Kitchen
- text: 3 items · 2 selected 13.70 oz
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
  1   | import { test as base, expect, type Page } from '@playwright/test';
  2   | 
  3   | /** Collected runtime error evidence for one test. */
  4   | export interface ErrorLog {
  5   |   pageErrors: string[];
  6   |   failedRequests: string[];
  7   |   serverErrors: string[]; // HTTP >= 500
  8   |   consoleErrors: string[];
  9   | }
  10  | 
  11  | /**
  12  |  * Extended test fixture that records pageerror / requestfailed / 5xx /
  13  |  * console.error evidence for every test. Assert with `expectClean(errors)`
  14  |  * at the end of a test (or make targeted assertions for expected failures).
  15  |  */
  16  | export const test = base.extend<{ errors: ErrorLog }>({
  17  |   errors: async ({ page }, use) => {
  18  |     const log: ErrorLog = { pageErrors: [], failedRequests: [], serverErrors: [], consoleErrors: [] };
  19  |     page.on('pageerror', (e) => log.pageErrors.push(e.message));
  20  |     page.on('requestfailed', (r) => log.failedRequests.push(`${r.method()} ${r.url()} :: ${r.failure()?.errorText ?? 'unknown'}`));
  21  |     page.on('response', (r) => { if (r.status() >= 500) log.serverErrors.push(`${r.status()} ${r.request().method()} ${r.url()}`); });
  22  |     page.on('console', (m) => { if (m.type() === 'error') log.consoleErrors.push(m.text()); });
  23  |     await use(log);
  24  |   },
  25  | });
  26  | 
  27  | export { expect };
  28  | 
  29  | /**
  30  |  * Known-benign dev-environment noise that must not fail core tests.
  31  |  * Keep this list narrow and documented:
  32  |  * - net::ERR_ABORTED — requests canceled by navigation/reload, not app faults.
  33  |  * - Vite HMR/websocket churn in the dev server.
  34  |  */
  35  | const BENIGN_REQUEST_FAILURE = /net::ERR_ABORTED|\/@vite|vite.*(ws|hmr)|websocket/i;
  36  | 
  37  | /** All collected runtime errors must be empty (after the narrow allowlist). */
  38  | export function expectClean(errors: ErrorLog) {
  39  |   expect(errors.pageErrors, 'uncaught page errors').toEqual([]);
  40  |   expect(errors.serverErrors, 'unexpected HTTP 5xx responses').toEqual([]);
  41  |   expect(errors.consoleErrors, 'console.error output').toEqual([]);
  42  |   const realFailures = errors.failedRequests.filter((f) => !BENIGN_REQUEST_FAILURE.test(f));
  43  |   expect(realFailures, 'failed network requests (allowlist-filtered)').toEqual([]);
  44  | }
  45  | 
  46  | /** Navigate to the isolated demo route and wait for full mount. */
  47  | export async function gotoDemo(page: Page) {
  48  |   const resp = await page.goto('/mobile-functional-v3');
  49  |   expect(resp, 'initial navigation response').not.toBeNull();
  50  |   expect(resp!.ok(), `document request failed: HTTP ${resp?.status()}`).toBe(true);
> 51  |   await expect(page.getByText('LIST SUMMARY')).toBeVisible();
      |                                                ^ Error: expect(locator).toBeVisible() failed
  52  |   await page.waitForLoadState('networkidle');
  53  |   return resp!;
  54  | }
  55  | 
  56  | /** Read the LIST SUMMARY card counters. */
  57  | export async function summary(page: Page) {
  58  |   const selText = (await page.getByText(/^\d+ Selected$/).textContent()) ?? '';
  59  |   const notText = (await page.getByText(/^\d+ Not Selected$/).textContent()) ?? '';
  60  |   const catText = (await page.getByText(/^\d+ categor(y|ies)$/).textContent()) ?? '';
  61  |   const selected = parseInt(selText, 10);
  62  |   const notSelected = parseInt(notText, 10);
  63  |   const categories = parseInt(catText, 10);
  64  |   return { selected, notSelected, categories, items: selected + notSelected };
  65  | }
  66  | 
  67  | /** Open the full-screen menu (hamburger). */
  68  | export async function openMenu(page: Page) {
  69  |   await page.getByRole('button', { name: 'Open menu' }).click();
  70  |   await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeVisible();
  71  | }
  72  | 
  73  | /** Close whatever overlay is showing via its Back to list control. */
  74  | export async function backToList(page: Page) {
  75  |   const back = page.getByRole('button', { name: 'Back to list' }).first();
  76  |   if (await back.isVisible().catch(() => false)) await back.click();
  77  |   await expect(page.getByText('LIST SUMMARY')).toBeVisible();
  78  | }
  79  | 
  80  | /** Click a menu action then return to the list if the menu remains open. */
  81  | export async function menuAction(page: Page, name: string | RegExp) {
  82  |   await openMenu(page);
  83  |   await page.getByRole('button', { name }).click();
  84  |   // Some actions keep the menu open; normalize state back to the list view.
  85  |   const back = page.getByRole('button', { name: 'Back to list' }).first();
  86  |   if (await back.isVisible().catch(() => false)) await back.click();
  87  | }
  88  | 
  89  | /** The open/close wedge for a category (name reflects current state). */
  90  | export function wedge(page: Page, cat: string) {
  91  |   return page.getByRole('button', { name: new RegExp(`^(Open|Close) ${escapeRe(cat)} category$`) });
  92  | }
  93  | 
  94  | export async function openCategory(page: Page, cat: string) {
  95  |   // Tolerate an already-open category (e.g. after a menu/overlay round-trip).
  96  |   if (await page.getByRole('button', { name: `Close ${cat} category` }).isVisible().catch(() => false)) return;
  97  |   await page.getByRole('button', { name: `Open ${cat} category` }).click();
  98  |   await expect(page.getByRole('button', { name: `Close ${cat} category` })).toBeVisible();
  99  | }
  100 | 
  101 | export async function isCategoryOpen(page: Page, cat: string) {
  102 |   return page.getByRole('button', { name: `Close ${cat} category` }).isVisible().catch(() => false);
  103 | }
  104 | 
  105 | /** Open the Category Options sheet for a category. */
  106 | export async function openCategoryOptions(page: Page, cat: string) {
  107 |   await page.getByRole('button', { name: `Category options for ${cat}` }).click();
  108 |   await expect(page.getByText('Category Options')).toBeVisible();
  109 | }
  110 | 
  111 | /** Add a category through the bottom "Add Category" flow. Returns without asserting success. */
  112 | export async function addCategory(page: Page, name: string) {
  113 |   await page.getByRole('button', { name: 'Add a new category to this list' }).click();
  114 |   await page.getByLabel('New category name').fill(name);
  115 |   await page.getByRole('button', { name: 'Confirm add category' }).click();
  116 | }
  117 | 
  118 | /** First item row (expand-details button) currently visible in an open category. */
  119 | export function itemRows(page: Page) {
  120 |   return page.getByRole('button', { name: / — (expand|collapse) details$/ });
  121 | }
  122 | 
  123 | export function itemCheckboxes(page: Page) {
  124 |   return page.getByRole('checkbox', { name: /(selected for checklist|not selected)$/ });
  125 | }
  126 | 
  127 | /** Ensure an item's detail panel is open (tolerates already-open state). */
  128 | export async function openItemDetail(page: Page, name: string) {
  129 |   const expand = page.getByRole('button', { name: `${name} — expand details` });
  130 |   if (await expand.isVisible().catch(() => false)) await expand.click();
  131 |   await expect(page.getByRole('button', { name: `${name} — collapse details` })).toBeVisible();
  132 | }
  133 | 
  134 | /** Extract an item's display name from its row aria-label. */
  135 | export async function itemNameOf(rowAriaLabel: string) {
  136 |   return rowAriaLabel.replace(/ — (expand|collapse) details$/, '');
  137 | }
  138 | 
  139 | export function escapeRe(s: string) {
  140 |   return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  141 | }
  142 | 
  143 | /** Seed data facts for the unauthenticated demo list (fresh context). */
  144 | export const SEED = {
  145 |   listName: 'Demo Pack List',
  146 |   categories: ['Backpack', 'Clothing', 'Toiletries', 'Electronics', 'Shelter', 'Kitchen'],
  147 |   items: 21,
  148 |   selected: 16,
  149 |   notSelected: 5,
  150 |   backpackSelectedOz: '72.50 oz',
  151 | };
```