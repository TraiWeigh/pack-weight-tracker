# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: core/categories.spec.ts >> C. Category core behavior >> after Expand All, the Close wedge of a category actually closes it
- Location: tests/e2e/core/categories.spec.ts:45:7

# Error details

```
Error: Backpack should be closed after pressing its Close control

expect(received).toBe(expected) // Object.is equality

Expected: false
Received: true
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - button "Open menu" [ref=e6] [cursor=pointer]
      - generic [ref=e8]: TrailWeigh
      - generic [ref=e15]:
        - generic "Search (not yet available)" [ref=e16]
        - button "Create or import — Start / Create" [ref=e20] [cursor=pointer]
    - generic [ref=e22]:
      - generic [ref=e23]:
        - generic [ref=e24]: Demo Pack List
        - generic [ref=e29]:
          - generic [ref=e36]:
            - generic [ref=e37]: LIST SUMMARY
            - generic [ref=e38]:
              - generic [ref=e39]: "21"
              - generic [ref=e40]: items
          - generic [ref=e41]:
            - generic [ref=e42]: 6 categories
            - generic [ref=e43]: 16 Selected
            - generic [ref=e48]: 5 Not Selected
      - generic [ref=e51]:
        - generic [ref=e52]:
          - generic [ref=e53]:
            - button "Close Backpack category" [expanded] [active] [ref=e54] [cursor=pointer]
            - generic [ref=e59]:
              - generic [ref=e60]:
                - button "Category options for Backpack" [ref=e61] [cursor=pointer]:
                  - generic [ref=e62]: Backpack
                - generic [ref=e63]: 3 items · 2 selected
              - button "Drag to reorder Backpack category" [ref=e64]
              - generic [ref=e72]: 72.50 oz
          - generic [ref=e73]:
            - button "Osprey Atmos 65 — expand details" [ref=e75] [cursor=pointer]:
              - checkbox "Osprey Atmos 65 selected for checklist" [checked] [ref=e76]
              - generic [ref=e79]: Osprey Atmos 65
              - generic [ref=e80]: "1"
              - button "Delete Osprey Atmos 65" [ref=e81]
            - button "Pack Rain Cover — expand details" [ref=e86] [cursor=pointer]:
              - checkbox "Pack Rain Cover selected for checklist" [checked] [ref=e87]
              - generic [ref=e90]: Pack Rain Cover
              - generic [ref=e91]: "1"
              - button "Delete Pack Rain Cover" [ref=e92]
            - button "Dry Bags — expand details" [ref=e97] [cursor=pointer]:
              - checkbox "Dry Bags not selected" [ref=e98]
              - generic [ref=e99]: Dry Bags
              - generic [ref=e100]: "2"
              - button "Delete Dry Bags" [ref=e101]
            - button "Add item to Backpack" [ref=e106] [cursor=pointer]: Add Item
        - generic [ref=e109]:
          - button "Open Clothing category" [ref=e110] [cursor=pointer]
          - generic [ref=e113]:
            - generic [ref=e114]:
              - button "Category options for Clothing" [ref=e115] [cursor=pointer]:
                - generic [ref=e116]: Clothing
              - generic [ref=e117]: 5 items · 4 selected
            - button "Drag to reorder Clothing category" [ref=e118]
            - generic [ref=e126]: 50.70 oz
        - generic [ref=e128]:
          - button "Open Toiletries category" [ref=e129] [cursor=pointer]
          - generic [ref=e134]:
            - generic [ref=e135]:
              - button "Category options for Toiletries" [ref=e136] [cursor=pointer]:
                - generic [ref=e137]: Toiletries
              - generic [ref=e138]: 4 items · 2 selected
            - button "Drag to reorder Toiletries category" [ref=e139]
            - generic [ref=e147]: 2.60 oz
        - generic [ref=e149]:
          - button "Open Electronics category" [ref=e150] [cursor=pointer]
          - generic [ref=e153]:
            - generic [ref=e154]:
              - button "Category options for Electronics" [ref=e155] [cursor=pointer]:
                - generic [ref=e156]: Electronics
              - generic [ref=e157]: 3 items · 3 selected
            - button "Drag to reorder Electronics category" [ref=e158]
            - generic [ref=e166]: 14.40 oz
        - generic [ref=e168]:
          - button "Open Shelter category" [ref=e169] [cursor=pointer]
          - generic [ref=e174]:
            - generic [ref=e175]:
              - button "Category options for Shelter" [ref=e176] [cursor=pointer]:
                - generic [ref=e177]: Shelter
              - generic [ref=e178]: 3 items · 3 selected
            - button "Drag to reorder Shelter category" [ref=e179]
            - generic [ref=e187]: 90.00 oz
        - generic [ref=e189]:
          - button "Open Kitchen category" [ref=e190] [cursor=pointer]
          - generic [ref=e196]:
            - generic [ref=e197]:
              - button "Category options for Kitchen" [ref=e198] [cursor=pointer]:
                - generic [ref=e199]: Kitchen
              - generic [ref=e200]: 3 items · 2 selected
            - button "Drag to reorder Kitchen category" [ref=e201]
            - generic [ref=e209]: 13.70 oz
        - button "Add a new category to this list" [ref=e211] [cursor=pointer]: Add Category
    - generic [ref=e214]:
      - button "List — current gear list" [ref=e215] [cursor=pointer]:
        - generic [ref=e220]: List
      - button "Locker — browse and load saved lists" [ref=e221] [cursor=pointer]:
        - generic [ref=e224]: Locker
      - generic "Catalog — coming soon" [ref=e225]: Catalog
      - button "Summary — pack weight and distribution" [ref=e229] [cursor=pointer]:
        - generic [ref=e231]: Summary
      - button "More — settings and tools" [ref=e232] [cursor=pointer]:
        - generic [ref=e237]: More
  - region "Notifications (F8)":
    - list
```

# Test source

```ts
  1   | import {
  2   |   test, expect, expectClean, gotoDemo, summary, openCategory, isCategoryOpen,
  3   |   openCategoryOptions, addCategory, menuAction, SEED,
  4   | } from '../helpers/trailweigh';
  5   | 
  6   | test.describe('C. Category core behavior', () => {
  7   |   test('all six seed categories render closed', async ({ page, errors }) => {
  8   |     await gotoDemo(page);
  9   |     for (const cat of SEED.categories) {
  10  |       await expect(page.getByRole('button', { name: `Open ${cat} category` })).toBeVisible();
  11  |     }
  12  |     expectClean(errors);
  13  |   });
  14  | 
  15  |   test('open then close a single category via its wedge', async ({ page, errors }) => {
  16  |     await gotoDemo(page);
  17  |     await openCategory(page, 'Backpack');
  18  |     await page.getByRole('button', { name: 'Close Backpack category' }).click();
  19  |     await expect(page.getByRole('button', { name: 'Open Backpack category' })).toBeVisible();
  20  |     expectClean(errors);
  21  |   });
  22  | 
  23  |   test('single-open accordion: opening a second category closes the first', async ({ page, errors }) => {
  24  |     await gotoDemo(page);
  25  |     await openCategory(page, 'Backpack');
  26  |     await openCategory(page, 'Clothing');
  27  |     expect(await isCategoryOpen(page, 'Backpack'), 'Backpack should have auto-closed').toBe(false);
  28  |     expect(await isCategoryOpen(page, 'Clothing')).toBe(true);
  29  |     expectClean(errors);
  30  |   });
  31  | 
  32  |   test('Expand All opens every category; Collapse All closes every category', async ({ page, errors }) => {
  33  |     await gotoDemo(page);
  34  |     await menuAction(page, 'Expand All');
  35  |     for (const cat of SEED.categories) {
  36  |       expect(await isCategoryOpen(page, cat), `${cat} should be open after Expand All`).toBe(true);
  37  |     }
  38  |     await menuAction(page, 'Collapse All');
  39  |     for (const cat of SEED.categories) {
  40  |       expect(await isCategoryOpen(page, cat), `${cat} should be closed after Collapse All`).toBe(false);
  41  |     }
  42  |     expectClean(errors);
  43  |   });
  44  | 
  45  |   test('after Expand All, the Close wedge of a category actually closes it', async ({ page, errors }) => {
  46  |     await gotoDemo(page);
  47  |     await menuAction(page, 'Expand All');
  48  |     // User intent: pressing "Close Backpack category" while all are expanded
  49  |     // should close Backpack.
  50  |     await page.getByRole('button', { name: 'Close Backpack category' }).click();
> 51  |     expect(await isCategoryOpen(page, 'Backpack'), 'Backpack should be closed after pressing its Close control').toBe(false);
      |                                                                                                                  ^ Error: Backpack should be closed after pressing its Close control
  52  |     expectClean(errors);
  53  |   });
  54  | 
  55  |   test('add category: valid name appends and updates the count', async ({ page, errors }) => {
  56  |     await gotoDemo(page);
  57  |     await addCategory(page, 'Navigation');
  58  |     await expect(page.getByText('Category "Navigation" added')).toBeVisible();
  59  |     await expect(page.getByRole('button', { name: 'Open Navigation category' })).toBeVisible();
  60  |     const s = await summary(page);
  61  |     expect(s.categories).toBe(7);
  62  |     expectClean(errors);
  63  |   });
  64  | 
  65  |   test('add category: duplicate name is rejected with a toast', async ({ page, errors }) => {
  66  |     await gotoDemo(page);
  67  |     await addCategory(page, 'Kitchen');
  68  |     await expect(page.getByText('Category name already exists or is empty')).toBeVisible();
  69  |     const s = await summary(page);
  70  |     expect(s.categories).toBe(6);
  71  |     expectClean(errors);
  72  |   });
  73  | 
  74  |   test('add category: empty name is rejected', async ({ page, errors }) => {
  75  |     await gotoDemo(page);
  76  |     await page.getByRole('button', { name: 'Add a new category to this list' }).click();
  77  |     await page.getByRole('button', { name: 'Confirm add category' }).click();
  78  |     await expect(page.getByText('Category name already exists or is empty')).toBeVisible();
  79  |     const s = await summary(page);
  80  |     expect(s.categories).toBe(6);
  81  |     expectClean(errors);
  82  |   });
  83  | 
  84  |   test('rename category succeeds and updates the card', async ({ page, errors }) => {
  85  |     await gotoDemo(page);
  86  |     await openCategoryOptions(page, 'Kitchen');
  87  |     await page.getByRole('button', { name: 'Rename Category' }).click();
  88  |     const input = page.getByPlaceholder('Category name…');
  89  |     await input.fill('Cook Kit');
  90  |     await page.getByRole('button', { name: 'Rename', exact: true }).click();
  91  |     await expect(page.getByText('Renamed to "Cook Kit"')).toBeVisible();
  92  |     await expect(page.getByRole('button', { name: 'Open Cook Kit category' })).toBeVisible();
  93  |     await expect(page.getByRole('button', { name: 'Open Kitchen category' })).not.toBeVisible();
  94  |     expectClean(errors);
  95  |   });
  96  | 
  97  |   test('rename category to an existing name is rejected', async ({ page, errors }) => {
  98  |     await gotoDemo(page);
  99  |     await openCategoryOptions(page, 'Kitchen');
  100 |     await page.getByRole('button', { name: 'Rename Category' }).click();
  101 |     await page.getByPlaceholder('Category name…').fill('Shelter');
  102 |     await page.getByRole('button', { name: 'Rename', exact: true }).click();
  103 |     await expect(page.getByText('Category name already exists')).toBeVisible();
  104 |     await expect(page.getByRole('button', { name: 'Open Kitchen category' })).toBeVisible();
  105 |     await expect(page.getByRole('button', { name: /^(Open|Close) Shelter category$/ })).toHaveCount(1);
  106 |     expectClean(errors);
  107 |   });
  108 | 
  109 |   test('rename with empty value keeps Rename disabled', async ({ page, errors }) => {
  110 |     await gotoDemo(page);
  111 |     await openCategoryOptions(page, 'Kitchen');
  112 |     await page.getByRole('button', { name: 'Rename Category' }).click();
  113 |     await page.getByPlaceholder('Category name…').fill('');
  114 |     await expect(page.getByRole('button', { name: 'Rename', exact: true })).toBeDisabled();
  115 |     expectClean(errors);
  116 |   });
  117 | 
  118 |   test('delete an empty category removes only that category', async ({ page, errors }) => {
  119 |     await gotoDemo(page);
  120 |     await addCategory(page, 'TempCat');
  121 |     await expect(page.getByRole('button', { name: 'Open TempCat category' })).toBeVisible();
  122 |     await openCategoryOptions(page, 'TempCat');
  123 |     await page.getByRole('button', { name: 'Delete Category' }).click();
  124 |     await expect(page.getByText('Delete "TempCat"?')).toBeVisible();
  125 |     await expect(page.getByText(/This category is empty/)).toBeVisible();
  126 |     await page.getByRole('button', { name: 'Delete Category' }).click();
  127 |     await expect(page.getByRole('button', { name: 'Open TempCat category' })).not.toBeVisible();
  128 |     const s = await summary(page);
  129 |     expect(s.categories).toBe(6);
  130 |     expect(s.items).toBe(SEED.items);
  131 |     expectClean(errors);
  132 |   });
  133 | 
  134 |   test('cancel category deletion keeps the category and its items', async ({ page, errors }) => {
  135 |     await gotoDemo(page);
  136 |     await openCategoryOptions(page, 'Kitchen');
  137 |     await page.getByRole('button', { name: 'Delete Category' }).click();
  138 |     await expect(page.getByText('Delete "Kitchen"?')).toBeVisible();
  139 |     await page.getByRole('button', { name: 'Cancel' }).click();
  140 |     await page.keyboard.press('Escape');
  141 |     await expect(page.getByRole('button', { name: 'Open Kitchen category' })).toBeVisible();
  142 |     const s = await summary(page);
  143 |     expect(s).toEqual({ selected: SEED.selected, notSelected: SEED.notSelected, categories: 6, items: SEED.items });
  144 |     expectClean(errors);
  145 |   });
  146 | 
  147 |   test('delete a category with items also removes its items from the totals', async ({ page, errors }) => {
  148 |     await gotoDemo(page);
  149 |     const before = await summary(page);
  150 |     await openCategoryOptions(page, 'Kitchen');
  151 |     await page.getByRole('button', { name: 'Delete Category' }).click();
```