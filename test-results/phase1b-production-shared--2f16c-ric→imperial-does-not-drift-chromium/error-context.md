# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/production-shared-items.spec.ts >> Item weight & calculation correctness >> repeated unit conversion imperial→metric→imperial does not drift
- Location: tests/e2e/phase1b/production-shared-items.spec.ts:49:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
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
        - button "Expand all categories" [ref=e58] [cursor=pointer]
        - generic [ref=e61]:
          - generic [ref=e62]: 6 categories
          - generic [ref=e63]: 16 Selected
      - generic [ref=e68]:
        - generic [ref=e70]:
          - button [ref=e71] [cursor=pointer]: Delete
          - generic [ref=e76]:
            - button "Open Backpack category" [ref=e77] [cursor=pointer]
            - generic [ref=e82]:
              - button "Category options for Backpack" [ref=e84] [cursor=pointer]:
                - generic [ref=e85]: Backpack
                - generic [ref=e86]: 3 items · 2 selected
              - generic [ref=e87]: 72.50 oz
        - generic [ref=e89]:
          - button [ref=e90] [cursor=pointer]: Delete
          - generic [ref=e95]:
            - button "Open Clothing category" [ref=e96] [cursor=pointer]
            - generic [ref=e99]:
              - button "Category options for Clothing" [ref=e101] [cursor=pointer]:
                - generic [ref=e102]: Clothing
                - generic [ref=e103]: 5 items · 4 selected
              - generic [ref=e104]: 50.70 oz
        - generic [ref=e106]:
          - button [ref=e107] [cursor=pointer]: Delete
          - generic [ref=e112]:
            - button "Open Toiletries category" [ref=e113] [cursor=pointer]
            - generic [ref=e118]:
              - button "Category options for Toiletries" [ref=e120] [cursor=pointer]:
                - generic [ref=e121]: Toiletries
                - generic [ref=e122]: 4 items · 2 selected
              - generic [ref=e123]: 2.60 oz
        - generic [ref=e125]:
          - button [ref=e126] [cursor=pointer]: Delete
          - generic [ref=e131]:
            - button "Open Electronics category" [ref=e132] [cursor=pointer]
            - generic [ref=e135]:
              - button "Category options for Electronics" [ref=e137] [cursor=pointer]:
                - generic [ref=e138]: Electronics
                - generic [ref=e139]: 3 items · 3 selected
              - generic [ref=e140]: 14.40 oz
        - generic [ref=e142]:
          - button [ref=e143] [cursor=pointer]: Delete
          - generic [ref=e148]:
            - button "Open Shelter category" [ref=e149] [cursor=pointer]
            - generic [ref=e154]:
              - button "Category options for Shelter" [ref=e156] [cursor=pointer]:
                - generic [ref=e157]: Shelter
                - generic [ref=e158]: 3 items · 3 selected
              - generic [ref=e159]: 90.00 oz
        - generic [ref=e161]:
          - button [ref=e162] [cursor=pointer]: Delete
          - generic [ref=e167]:
            - button "Open Kitchen category" [ref=e168] [cursor=pointer]
            - generic [ref=e174]:
              - button "Category options for Kitchen" [ref=e176] [cursor=pointer]:
                - generic [ref=e177]: Kitchen
                - generic [ref=e178]: 3 items · 2 selected
              - generic [ref=e179]: 13.70 oz
    - generic [ref=e182]:
      - button "Locker — saved lists" [ref=e183] [cursor=pointer]:
        - generic [ref=e186]: Locker
      - button "Summary — pack weight and progress" [ref=e188] [cursor=pointer]:
        - generic [ref=e190]: Summary
      - button "Add — add items, categories, or import" [ref=e192] [cursor=pointer]:
        - generic [ref=e194]: Add
      - button "Search — find gear" [ref=e196] [cursor=pointer]:
        - generic [ref=e200]: Search
      - button "Next controls" [ref=e202] [cursor=pointer]:
        - generic [ref=e205]: More
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
  39  |     await page.getByRole('button', { name: /^More — settings and tools/ }).click();
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
> 53  |     expect(summaryBefore).toBe(true);
      |                           ^ Error: expect(received).toBe(expected) // Object.is equality
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
  140 |     expect(errors.pageErrors).toEqual([]);
  141 |   });
  142 | 
  143 | });
  144 | 
```