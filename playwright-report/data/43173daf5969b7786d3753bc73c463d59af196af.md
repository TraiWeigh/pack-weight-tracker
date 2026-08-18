# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/production-shared-items.spec.ts >> Item weight & calculation correctness >> item total remains correct after renaming category
- Location: tests/e2e/phase1b/production-shared-items.spec.ts:129:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.textContent: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByText(/^\d+ Not Selected$/)

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - button "Open navigation menu" [ref=e6] [cursor=pointer]
      - generic [ref=e8]: TrailWeigh
    - generic [ref=e44]:
      - generic [ref=e48]:
        - generic [ref=e55]:
          - generic [ref=e56]: Demo Pack List
          - generic [ref=e57]:
            - generic [ref=e58]: "21"
            - generic [ref=e59]: items
        - button "Expand all categories" [ref=e60] [cursor=pointer]
        - generic [ref=e63]:
          - generic [ref=e64]: 6 categories
          - generic [ref=e65]: 16 Selected
      - generic [ref=e70]:
        - generic [ref=e72]:
          - button [ref=e73] [cursor=pointer]: Delete
          - generic [ref=e78]:
            - button "Open Backpack category" [ref=e79] [cursor=pointer]
            - generic [ref=e84]:
              - button "Category options for Backpack" [ref=e86] [cursor=pointer]:
                - generic [ref=e87]: Backpack
                - generic [ref=e88]: 3 items · 2 selected
              - generic [ref=e89]: 72.50 oz
        - generic [ref=e91]:
          - button [ref=e92] [cursor=pointer]: Delete
          - generic [ref=e97]:
            - button "Open Clothing category" [ref=e98] [cursor=pointer]
            - generic [ref=e101]:
              - button "Category options for Clothing" [ref=e103] [cursor=pointer]:
                - generic [ref=e104]: Clothing
                - generic [ref=e105]: 5 items · 4 selected
              - generic [ref=e106]: 50.70 oz
        - generic [ref=e108]:
          - button [ref=e109] [cursor=pointer]: Delete
          - generic [ref=e114]:
            - button "Open Toiletries category" [ref=e115] [cursor=pointer]
            - generic [ref=e120]:
              - button "Category options for Toiletries" [ref=e122] [cursor=pointer]:
                - generic [ref=e123]: Toiletries
                - generic [ref=e124]: 4 items · 2 selected
              - generic [ref=e125]: 2.60 oz
        - generic [ref=e127]:
          - button [ref=e128] [cursor=pointer]: Delete
          - generic [ref=e133]:
            - button "Open Electronics category" [ref=e134] [cursor=pointer]
            - generic [ref=e137]:
              - button "Category options for Electronics" [ref=e139] [cursor=pointer]:
                - generic [ref=e140]: Electronics
                - generic [ref=e141]: 3 items · 3 selected
              - generic [ref=e142]: 14.40 oz
        - generic [ref=e144]:
          - button [ref=e145] [cursor=pointer]: Delete
          - generic [ref=e150]:
            - button "Open Shelter category" [ref=e151] [cursor=pointer]
            - generic [ref=e156]:
              - button "Category options for Shelter" [ref=e158] [cursor=pointer]:
                - generic [ref=e159]: Shelter
                - generic [ref=e160]: 3 items · 3 selected
              - generic [ref=e161]: 90.00 oz
        - generic [ref=e163]:
          - button [ref=e164] [cursor=pointer]: Delete
          - generic [ref=e169]:
            - button "Open Kitchen category" [ref=e170] [cursor=pointer]
            - generic [ref=e176]:
              - button "Category options for Kitchen" [ref=e178] [cursor=pointer]:
                - generic [ref=e179]: Kitchen
                - generic [ref=e180]: 3 items · 2 selected
              - generic [ref=e181]: 13.70 oz
    - generic [ref=e184]:
      - button "Locker — saved lists" [ref=e185] [cursor=pointer]:
        - generic [ref=e188]: Locker
      - button "Summary — pack weight and progress" [ref=e190] [cursor=pointer]:
        - generic [ref=e192]: Summary
      - button "Add — add items, categories, or import" [ref=e194] [cursor=pointer]:
        - generic [ref=e196]: Add
      - button "Search — find gear" [ref=e198] [cursor=pointer]:
        - generic [ref=e202]: Search
      - button "Next controls" [ref=e204] [cursor=pointer]:
        - generic [ref=e207]: Next
    - navigation [ref=e208]:
      - generic [ref=e209]: TrailWeigh
      - list [ref=e211]:
        - listitem [ref=e212]:
          - button [ref=e213] [cursor=pointer]:
            - generic [ref=e217]: Home
        - listitem [ref=e219]:
          - button [disabled] [ref=e220]:
            - generic [ref=e223]:
              - generic [ref=e224]: Master Library
              - generic [ref=e225]: Coming soon
        - listitem [ref=e226]:
          - button [ref=e227] [cursor=pointer]:
            - generic [ref=e230]: My Lists
        - listitem [ref=e232]:
          - button [ref=e233] [cursor=pointer]:
            - generic [ref=e237]: Help & Tutorials
        - listitem [ref=e239]:
          - button [ref=e240] [cursor=pointer]:
            - generic [ref=e244]: Settings
      - button [ref=e247] [cursor=pointer]:
        - generic [ref=e250]:
          - generic [ref=e251]: Right-handed
          - generic [ref=e252]: Tap to flip menu side
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
  46  | /** Navigate to the isolated demo route and wait for full mount.
  47  |  *
  48  |  * Readiness condition updated (R0078): the V3 UI replaced the generic
  49  |  * "LIST SUMMARY" header with the active list name, so that text is no longer
  50  |  * a stable signal. We now wait for `[data-testid="main-scroll"]` (the outer
  51  |  * scroll container that mounts when the list is hydrated) plus at least one
  52  |  * visible category wedge button (proving the list rendered, not a blank page).
  53  |  */
  54  | export async function gotoDemo(page: Page) {
  55  |   const resp = await page.goto('/mobile-functional-v3');
  56  |   expect(resp, 'initial navigation response').not.toBeNull();
  57  |   expect(resp!.ok(), `document request failed: HTTP ${resp?.status()}`).toBe(true);
  58  |   // Wait for the stable V3 readiness signal (mounted + hydrated list).
  59  |   await page.waitForSelector('[data-testid="main-scroll"]', { timeout: 15000 });
  60  |   // Secondary check: at least one category wedge present → page is not blank/crashed.
  61  |   await expect(
  62  |     page.getByRole('button', { name: /^Open .+ category$/ }).first()
  63  |   ).toBeVisible({ timeout: 5000 });
  64  |   await page.waitForLoadState('networkidle');
  65  |   return resp!;
  66  | }
  67  | 
  68  | /** Read the LIST SUMMARY card counters. */
  69  | export async function summary(page: Page) {
  70  |   const selText = (await page.getByText(/^\d+ Selected$/).textContent()) ?? '';
> 71  |   const notText = (await page.getByText(/^\d+ Not Selected$/).textContent()) ?? '';
      |                                                               ^ Error: locator.textContent: Test timeout of 60000ms exceeded.
  72  |   const catText = (await page.getByText(/^\d+ categor(y|ies)$/).textContent()) ?? '';
  73  |   const selected = parseInt(selText, 10);
  74  |   const notSelected = parseInt(notText, 10);
  75  |   const categories = parseInt(catText, 10);
  76  |   return { selected, notSelected, categories, items: selected + notSelected };
  77  | }
  78  | 
  79  | /** Open the full-screen menu (hamburger). */
  80  | export async function openMenu(page: Page) {
  81  |   await page.getByRole('button', { name: 'Open menu' }).click();
  82  |   await expect(page.getByRole('button', { name: 'Undo', exact: true })).toBeVisible();
  83  | }
  84  | 
  85  | /** Close whatever overlay is showing via its Back to list control. */
  86  | export async function backToList(page: Page) {
  87  |   const back = page.getByRole('button', { name: 'Back to list' }).first();
  88  |   if (await back.isVisible().catch(() => false)) await back.click();
  89  |   // Readiness updated (R0078): wait for the stable V3 main-scroll container.
  90  |   await expect(page.locator('[data-testid="main-scroll"]')).toBeVisible();
  91  | }
  92  | 
  93  | /** Click a menu action then return to the list if the menu remains open. */
  94  | export async function menuAction(page: Page, name: string | RegExp) {
  95  |   await openMenu(page);
  96  |   await page.getByRole('button', { name }).click();
  97  |   // Some actions keep the menu open; normalize state back to the list view.
  98  |   const back = page.getByRole('button', { name: 'Back to list' }).first();
  99  |   if (await back.isVisible().catch(() => false)) await back.click();
  100 | }
  101 | 
  102 | /** The open/close wedge for a category (name reflects current state). */
  103 | export function wedge(page: Page, cat: string) {
  104 |   return page.getByRole('button', { name: new RegExp(`^(Open|Close) ${escapeRe(cat)} category$`) });
  105 | }
  106 | 
  107 | export async function openCategory(page: Page, cat: string) {
  108 |   // Tolerate an already-open category (e.g. after a menu/overlay round-trip).
  109 |   if (await page.getByRole('button', { name: `Close ${cat} category` }).isVisible().catch(() => false)) return;
  110 |   await page.getByRole('button', { name: `Open ${cat} category` }).click();
  111 |   await expect(page.getByRole('button', { name: `Close ${cat} category` })).toBeVisible();
  112 | }
  113 | 
  114 | export async function isCategoryOpen(page: Page, cat: string) {
  115 |   return page.getByRole('button', { name: `Close ${cat} category` }).isVisible().catch(() => false);
  116 | }
  117 | 
  118 | /** Open the Category Options sheet for a category. */
  119 | export async function openCategoryOptions(page: Page, cat: string) {
  120 |   await page.getByRole('button', { name: `Category options for ${cat}` }).click();
  121 |   await expect(page.getByText('Category Options')).toBeVisible();
  122 | }
  123 | 
  124 | /** Add a category through the bottom "Add Category" flow. Returns without asserting success.
  125 |  *
  126 |  * Path updated (R0078): Add Category moved to the Add bottom deck (R002/R004 architecture).
  127 |  * Old path: 'Add a new category to this list' inline button (removed in R004 Part 4).
  128 |  * New path: Add NavBox → 'Add Category — open card' → fill input → confirm.
  129 |  */
  130 | export async function addCategory(page: Page, name: string) {
  131 |   await page.getByRole('button', { name: 'Add — add items, categories, or import', exact: true }).click();
  132 |   await page.getByRole('button', { name: 'Add Category — open card' }).click();
  133 |   await page.getByLabel('New category name').fill(name);
  134 |   await page.getByRole('button', { name: 'Confirm add category' }).click();
  135 | }
  136 | 
  137 | /** First item row (expand-details button) currently visible in an open category. */
  138 | export function itemRows(page: Page) {
  139 |   return page.getByRole('button', { name: / — (expand|collapse) details$/ });
  140 | }
  141 | 
  142 | export function itemCheckboxes(page: Page) {
  143 |   return page.getByRole('checkbox', { name: /(selected for checklist|not selected)$/ });
  144 | }
  145 | 
  146 | /** Ensure an item's detail panel is open (tolerates already-open state). */
  147 | export async function openItemDetail(page: Page, name: string) {
  148 |   const expand = page.getByRole('button', { name: `${name} — expand details` });
  149 |   if (await expand.isVisible().catch(() => false)) await expand.click();
  150 |   await expect(page.getByRole('button', { name: `${name} — collapse details` })).toBeVisible();
  151 | }
  152 | 
  153 | /** Extract an item's display name from its row aria-label. */
  154 | export async function itemNameOf(rowAriaLabel: string) {
  155 |   return rowAriaLabel.replace(/ — (expand|collapse) details$/, '');
  156 | }
  157 | 
  158 | export function escapeRe(s: string) {
  159 |   return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  160 | }
  161 | 
  162 | /** Seed data facts for the unauthenticated demo list (fresh context). */
  163 | export const SEED = {
  164 |   listName: 'Demo Pack List',
  165 |   categories: ['Backpack', 'Clothing', 'Toiletries', 'Electronics', 'Shelter', 'Kitchen'],
  166 |   items: 21,
  167 |   selected: 16,
  168 |   notSelected: 5,
  169 |   backpackSelectedOz: '72.50 oz',
  170 | };
  171 | 
```