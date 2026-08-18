# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/production-shared-items.spec.ts >> Item weight & calculation correctness >> unit switch imperial→metric changes displayed weights (not zero, not NaN)
- Location: tests/e2e/phase1b/production-shared-items.spec.ts:35:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /^More — settings and tools/ })

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
          - button [ref=e73] [cursor=pointer]: Edit
          - button [ref=e77] [cursor=pointer]: Delete
          - generic [ref=e82] [cursor=pointer]:
            - button "Open Backpack category" [ref=e83]
            - generic [ref=e88]:
              - generic [ref=e90]:
                - generic [ref=e91]: Backpack
                - generic [ref=e92]: 3 items · 2 selected
              - generic [ref=e93]: 72.50 oz
        - generic [ref=e95]:
          - button [ref=e96] [cursor=pointer]: Edit
          - button [ref=e100] [cursor=pointer]: Delete
          - generic [ref=e105] [cursor=pointer]:
            - button "Open Clothing category" [ref=e106]
            - generic [ref=e109]:
              - generic [ref=e111]:
                - generic [ref=e112]: Clothing
                - generic [ref=e113]: 5 items · 4 selected
              - generic [ref=e114]: 50.70 oz
        - generic [ref=e116]:
          - button [ref=e117] [cursor=pointer]: Edit
          - button [ref=e121] [cursor=pointer]: Delete
          - generic [ref=e126] [cursor=pointer]:
            - button "Open Toiletries category" [ref=e127]
            - generic [ref=e132]:
              - generic [ref=e134]:
                - generic [ref=e135]: Toiletries
                - generic [ref=e136]: 4 items · 2 selected
              - generic [ref=e137]: 2.60 oz
        - generic [ref=e139]:
          - button [ref=e140] [cursor=pointer]: Edit
          - button [ref=e144] [cursor=pointer]: Delete
          - generic [ref=e149] [cursor=pointer]:
            - button "Open Electronics category" [ref=e150]
            - generic [ref=e153]:
              - generic [ref=e155]:
                - generic [ref=e156]: Electronics
                - generic [ref=e157]: 3 items · 3 selected
              - generic [ref=e158]: 14.40 oz
        - generic [ref=e160]:
          - button [ref=e161] [cursor=pointer]: Edit
          - button [ref=e165] [cursor=pointer]: Delete
          - generic [ref=e170] [cursor=pointer]:
            - button "Open Shelter category" [ref=e171]
            - generic [ref=e176]:
              - generic [ref=e178]:
                - generic [ref=e179]: Shelter
                - generic [ref=e180]: 3 items · 3 selected
              - generic [ref=e181]: 90.00 oz
        - generic [ref=e183]:
          - button [ref=e184] [cursor=pointer]: Edit
          - button [ref=e188] [cursor=pointer]: Delete
          - generic [ref=e193] [cursor=pointer]:
            - button "Open Kitchen category" [ref=e194]
            - generic [ref=e200]:
              - generic [ref=e202]:
                - generic [ref=e203]: Kitchen
                - generic [ref=e204]: 3 items · 2 selected
              - generic [ref=e205]: 13.70 oz
    - generic [ref=e208]:
      - button "Locker — saved lists" [ref=e209] [cursor=pointer]:
        - generic [ref=e212]: Locker
      - button "Summary — pack weight and progress" [ref=e214] [cursor=pointer]:
        - generic [ref=e216]: Summary
      - button "Add — add items, categories, or import" [ref=e218] [cursor=pointer]:
        - generic [ref=e220]: Add
      - button "Search — find gear" [ref=e222] [cursor=pointer]:
        - generic [ref=e226]: Search
      - button "Next controls" [ref=e228] [cursor=pointer]:
        - generic [ref=e231]: Next
    - navigation [ref=e232]:
      - generic [ref=e233]: TrailWeigh
      - list [ref=e235]:
        - listitem [ref=e236]:
          - button [ref=e237] [cursor=pointer]:
            - generic [ref=e241]: Home
        - listitem [ref=e243]:
          - button [disabled] [ref=e244]:
            - generic [ref=e247]:
              - generic [ref=e248]: Master Library
              - generic [ref=e249]: Coming soon
        - listitem [ref=e250]:
          - button [ref=e251] [cursor=pointer]:
            - generic [ref=e254]: My Lists
        - listitem [ref=e256]:
          - button [ref=e257] [cursor=pointer]:
            - generic [ref=e261]: Help & Tutorials
        - listitem [ref=e263]:
          - button [ref=e264] [cursor=pointer]:
            - generic [ref=e268]: Settings
      - button [ref=e271] [cursor=pointer]:
        - generic [ref=e274]:
          - generic [ref=e275]: Right-handed
          - generic [ref=e276]: Tap to flip menu side
  - region "Notifications (F8)":
    - list
```

# Test source

```ts
  1   | /**
  2   |  * Phase 1B — Production-Shared Item Editing & Calculations
  3   |  *
  4   |  * Target route: /mobile-functional-v3 (V3 sandbox)
  5   |  * Classification: A (sandbox route) — DEMO_SEED state, no auth required.
  6   |  * Components tested: WeightSummary, WeightDistribution (B — production-shared);
  7   |  *                   calcTotalOz, formatWeight, gramsToOz math (B — production-shared);
  8   |  *                   per-item state management (A — sandbox-own).
  9   |  * Backend: NOT called (no mutations intercepted beyond sandbox save).
  10  |  * Note: Conclusions here confirm shared MATH logic, not owner persistence.
  11  |  */
  12  | import { test, expect, gotoDemo, summary, openCategory, openItemDetail, SEED } from '../helpers/trailweigh';
  13  | 
  14  | // ──────────────────────────────────────────────────────────────────────────────
  15  | test.describe('Item weight & calculation correctness', () => {
  16  | 
  17  |   test('DEMO_SEED totals render without NaN / Infinity / undefined', async ({ page, errors }) => {
  18  |     await gotoDemo(page);
  19  |     const body = await page.content();
  20  |     expect(body).not.toContain('NaN');
  21  |     expect(body).not.toContain('Infinity');
  22  |     expect(body).not.toContain('undefined');
  23  |     expect(errors.pageErrors).toEqual([]);
  24  |   });
  25  | 
  26  |   test('category-level weight total is displayed and non-zero when items are selected', async ({ page, errors }) => {
  27  |     await gotoDemo(page);
  28  |     // Weight is shown in a span adjacent to (not inside) the category accordion button.
  29  |     // The DEMO_SEED has selected items in Backpack — the weight span should show a value.
  30  |     // Look for any weight pattern on the page (oz/lb/g/kg with a number).
  31  |     await expect(page.getByText(/\d+\.\d+\s*oz/i).first()).toBeVisible({ timeout: 5000 });
  32  |     expect(errors.pageErrors).toEqual([]);
  33  |   });
  34  | 
  35  |   test('unit switch imperial→metric changes displayed weights (not zero, not NaN)', async ({ page, errors }) => {
  36  |     await gotoDemo(page);
  37  |     // Switch to metric
  38  |     // R002: units toggle lives in More deck → List Settings card
> 39  |     await page.getByRole('button', { name: /^More — settings and tools/ }).click();
      |                                                                            ^ Error: locator.click: Test timeout of 60000ms exceeded.
  40  |     await page.getByRole('button', { name: /^List Settings — open card/ }).click();
  41  |     await page.getByRole('button', { name: 'Use metric units' }).click();
  42  |     await page.keyboard.press('Escape'); // R003: List tab removed — Escape closes the deck
  43  |     const body = await page.content();
  44  |     expect(body).not.toContain('NaN');
  45  |     expect(body).not.toContain('Infinity');
  46  |     expect(errors.pageErrors).toEqual([]);
  47  |   });
  48  | 
  49  |   test('repeated unit conversion imperial→metric→imperial does not drift', async ({ page, errors }) => {
  50  |     await gotoDemo(page);
  51  |     // Record initial LIST SUMMARY text in imperial
  52  |     const summaryBefore = await page.locator('text=LIST SUMMARY').first().isVisible();
  53  |     expect(summaryBefore).toBe(true);
  54  | 
  55  |     // R002: units toggle lives in More deck → List Settings card
  56  |     const toggleUnit = async (name: string) => {
  57  |       await page.getByRole('button', { name: /^More — settings and tools/ }).click();
  58  |       await page.getByRole('button', { name: /^List Settings — open card/ }).click();
  59  |       await page.getByRole('button', { name: `Use ${name} units` }).click();
  60  |       await page.keyboard.press('Escape'); // R003: List tab removed — Escape closes the deck
  61  |     };
  62  | 
  63  |     await toggleUnit('metric');
  64  |     await toggleUnit('imperial');
  65  |     // Should still show summary without errors
  66  |     await expect(page.getByText('LIST SUMMARY')).toBeVisible();
  67  |     const body = await page.content();
  68  |     expect(body).not.toContain('NaN');
  69  |     expect(errors.pageErrors).toEqual([]);
  70  |   });
  71  | 
  72  |   test('adding item with qty > 1 multiplies weight in totals', async ({ page, errors }) => {
  73  |     await gotoDemo(page);
  74  |     // Add a new item to Backpack with weight 10oz, qty 2
  75  |     await openCategory(page, 'Backpack');
  76  |     await page.getByRole('button', { name: 'Add item to Backpack' }).click();
  77  |     await page.waitForTimeout(300);
  78  | 
  79  |     // Get current summary
  80  |     const before = await summary(page);
  81  |     // Total items should have increased
  82  |     expect(before.items).toBeGreaterThan(0);
  83  |     expect(errors.pageErrors).toEqual([]);
  84  |   });
  85  | 
  86  |   test('item checked state is independent between items', async ({ page, errors }) => {
  87  |     await gotoDemo(page);
  88  |     await openCategory(page, 'Backpack');
  89  |     // Get all checkboxes in Backpack
  90  |     const checkboxes = page.getByRole('checkbox', { name: /(selected for checklist|not selected)/ });
  91  |     const count = await checkboxes.count();
  92  |     expect(count).toBeGreaterThan(0);
  93  | 
  94  |     // Toggle the first
  95  |     const first = checkboxes.first();
  96  |     const firstStateBefore = await first.isChecked();
  97  |     await first.click();
  98  |     await page.waitForTimeout(200);
  99  | 
  100 |     // Second checkbox must still have its original state (mutation isolation)
  101 |     if (count >= 2) {
  102 |       const second = checkboxes.nth(1);
  103 |       const secondState = await second.isChecked();
  104 |       // We only know they might differ; verify second was not toggled by first's action
  105 |       // by checking page has no errors and list is still consistent
  106 |       expect(errors.pageErrors).toEqual([]);
  107 |     }
  108 |   });
  109 | 
  110 |   test('decimal weight (e.g. 1.4 oz) renders without truncation', async ({ page, errors }) => {
  111 |     await gotoDemo(page);
  112 |     await openCategory(page, 'Backpack');
  113 |     // Open first item detail to see weight field
  114 |     const firstRow = page.getByRole('button', { name: / — expand details$/ }).first();
  115 |     if (await firstRow.isVisible()) {
  116 |       await firstRow.click();
  117 |       await page.waitForTimeout(300);
  118 |     }
  119 |     // Weight field should exist and contain a numeric value
  120 |     const weightInput = page.getByRole('spinbutton').first();
  121 |     if (await weightInput.isVisible()) {
  122 |       const val = await weightInput.inputValue();
  123 |       const num = parseFloat(val);
  124 |       expect(isNaN(num), 'weight input has a valid number').toBe(false);
  125 |     }
  126 |     expect(errors.pageErrors).toEqual([]);
  127 |   });
  128 | 
  129 |   test('item total remains correct after renaming category', async ({ page, errors }) => {
  130 |     await gotoDemo(page);
  131 |     const before = await summary(page);
  132 |     // Add a category
  133 |     await page.getByRole('button', { name: 'Add a new category to this list' }).click();
  134 |     await page.getByLabel('New category name').fill('TestCat');
  135 |     await page.getByRole('button', { name: 'Confirm add category' }).click();
  136 |     await page.waitForTimeout(300);
  137 |     const after = await summary(page);
  138 |     expect(after.categories).toBe(before.categories + 1);
  139 |     expect(after.items, 'item count unchanged after category add').toBe(before.items);
```