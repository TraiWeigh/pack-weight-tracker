# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: core/items.spec.ts >> D. Item core behavior >> items have no name editor anywhere (rename-item capability check)
- Location: tests/e2e/core/items.spec.ts:83:7

# Error details

```
Error: expected a name/type editor for the new item

expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
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
              - generic [ref=e39]: "22"
              - generic [ref=e40]: items
          - generic [ref=e41]:
            - generic [ref=e42]: 6 categories
            - generic [ref=e43]: 17 Selected
            - generic [ref=e48]: 5 Not Selected
      - generic [ref=e51]:
        - generic [ref=e52]:
          - generic [ref=e53]:
            - button "Close Backpack category" [expanded] [ref=e54] [cursor=pointer]
            - generic [ref=e59]:
              - generic [ref=e60]:
                - button "Category options for Backpack" [ref=e61] [cursor=pointer]:
                  - generic [ref=e62]: Backpack
                - generic [ref=e63]: 4 items · 3 selected
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
            - generic [ref=e105]:
              - button "Unnamed item — collapse details" [expanded] [active] [ref=e106] [cursor=pointer]:
                - checkbox "Unnamed item selected for checklist" [checked] [ref=e107]
                - generic [ref=e110]: Unnamed item
                - generic [ref=e111]: "1"
                - button "Delete Unnamed item" [ref=e112]
              - generic [ref=e116]:
                - generic [ref=e117]:
                  - generic [ref=e121]: Weight
                  - spinbutton "Weight of Unnamed item in oz" [ref=e122]: "0"
                  - generic [ref=e123]: oz
                - generic [ref=e124]:
                  - generic [ref=e129]: Quantity
                  - combobox "Quantity of Unnamed item" [ref=e130]:
                    - option "1" [selected]
                    - option "2"
                    - option "3"
                    - option "4"
                    - option "5"
                    - option "6"
                    - option "7"
                    - option "8"
                    - option "9"
                    - option "10"
                    - option "11"
                    - option "12"
                    - option "13"
                    - option "14"
                    - option "15"
                    - option "16"
                    - option "17"
                    - option "18"
                    - option "19"
                    - option "20"
                - generic [ref=e131]:
                  - generic [ref=e134]: Total
                  - generic [ref=e135]: 0.00 oz
                - generic [ref=e136]:
                  - generic [ref=e140]: Move
                  - combobox "Move Unnamed item to another category" [ref=e141]:
                    - option "Move to…" [selected]
                    - option "Clothing"
                    - option "Toiletries"
                    - option "Electronics"
                    - option "Shelter"
                    - option "Kitchen"
                - generic "Photos not enabled yet — item photo backend pending implementation" [ref=e142]:
                  - generic [ref=e146]: Photo
                  - generic [ref=e147]: Photos not enabled yet
            - button "Add item to Backpack" [ref=e149] [cursor=pointer]: Add Item
        - generic [ref=e152]:
          - button "Open Clothing category" [ref=e153] [cursor=pointer]
          - generic [ref=e156]:
            - generic [ref=e157]:
              - button "Category options for Clothing" [ref=e158] [cursor=pointer]:
                - generic [ref=e159]: Clothing
              - generic [ref=e160]: 5 items · 4 selected
            - button "Drag to reorder Clothing category" [ref=e161]
            - generic [ref=e169]: 50.70 oz
        - generic [ref=e171]:
          - button "Open Toiletries category" [ref=e172] [cursor=pointer]
          - generic [ref=e177]:
            - generic [ref=e178]:
              - button "Category options for Toiletries" [ref=e179] [cursor=pointer]:
                - generic [ref=e180]: Toiletries
              - generic [ref=e181]: 4 items · 2 selected
            - button "Drag to reorder Toiletries category" [ref=e182]
            - generic [ref=e190]: 2.60 oz
        - generic [ref=e192]:
          - button "Open Electronics category" [ref=e193] [cursor=pointer]
          - generic [ref=e196]:
            - generic [ref=e197]:
              - button "Category options for Electronics" [ref=e198] [cursor=pointer]:
                - generic [ref=e199]: Electronics
              - generic [ref=e200]: 3 items · 3 selected
            - button "Drag to reorder Electronics category" [ref=e201]
            - generic [ref=e209]: 14.40 oz
        - generic [ref=e211]:
          - button "Open Shelter category" [ref=e212] [cursor=pointer]
          - generic [ref=e217]:
            - generic [ref=e218]:
              - button "Category options for Shelter" [ref=e219] [cursor=pointer]:
                - generic [ref=e220]: Shelter
              - generic [ref=e221]: 3 items · 3 selected
            - button "Drag to reorder Shelter category" [ref=e222]
            - generic [ref=e230]: 90.00 oz
        - generic [ref=e232]:
          - button "Open Kitchen category" [ref=e233] [cursor=pointer]
          - generic [ref=e239]:
            - generic [ref=e240]:
              - button "Category options for Kitchen" [ref=e241] [cursor=pointer]:
                - generic [ref=e242]: Kitchen
              - generic [ref=e243]: 3 items · 2 selected
            - button "Drag to reorder Kitchen category" [ref=e244]
            - generic [ref=e252]: 13.70 oz
        - button "Add a new category to this list" [ref=e254] [cursor=pointer]: Add Category
    - generic [ref=e257]:
      - button "List — current gear list" [ref=e258] [cursor=pointer]:
        - generic [ref=e263]: List
      - button "Locker — browse and load saved lists" [ref=e264] [cursor=pointer]:
        - generic [ref=e267]: Locker
      - generic "Catalog — coming soon" [ref=e268]: Catalog
      - button "Summary — pack weight and distribution" [ref=e272] [cursor=pointer]:
        - generic [ref=e274]: Summary
      - button "More — settings and tools" [ref=e275] [cursor=pointer]:
        - generic [ref=e280]: More
  - region "Notifications (F8)":
    - list
```

# Test source

```ts
  1   | import {
  2   |   test, expect, expectClean, gotoDemo, summary, openCategory,
  3   |   itemRows, itemCheckboxes, SEED,
  4   | } from '../helpers/trailweigh';
  5   | 
  6   | test.describe('D. Item core behavior', () => {
  7   |   test('expanding an item row reveals its detail editors', async ({ page, errors }) => {
  8   |     await gotoDemo(page);
  9   |     await openCategory(page, 'Backpack');
  10  |     const row = itemRows(page).first();
  11  |     const label = (await row.getAttribute('aria-label')) ?? '';
  12  |     const name = label.replace(/ — (expand|collapse) details$/, '');
  13  |     await row.click();
  14  |     await expect(page.getByLabel(`Quantity of ${name}`)).toBeVisible();
  15  |     await expect(page.getByLabel(new RegExp(`^Weight of ${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} in (oz|g)$`))).toBeVisible();
  16  |     // collapse again
  17  |     await page.getByRole('button', { name: `${name} — collapse details` }).click();
  18  |     expectClean(errors);
  19  |   });
  20  | 
  21  |   test('checkbox toggle updates Selected / Not Selected counts and back', async ({ page, errors }) => {
  22  |     await gotoDemo(page);
  23  |     await openCategory(page, 'Backpack');
  24  |     const box = itemCheckboxes(page).first();
  25  |     const initiallyChecked = (await box.getAttribute('aria-checked')) === 'true';
  26  |     await box.click();
  27  |     let s = await summary(page);
  28  |     expect(s.selected).toBe(initiallyChecked ? SEED.selected - 1 : SEED.selected + 1);
  29  |     expect(s.items).toBe(SEED.items);
  30  |     await itemCheckboxes(page).first().click();
  31  |     s = await summary(page);
  32  |     expect(s.selected).toBe(SEED.selected);
  33  |     expectClean(errors);
  34  |   });
  35  | 
  36  |   test('delete item: cancel keeps the item', async ({ page, errors }) => {
  37  |     await gotoDemo(page);
  38  |     await openCategory(page, 'Backpack');
  39  |     const rowsBefore = await itemRows(page).count();
  40  |     await page.getByRole('button', { name: /^Delete / }).first().click();
  41  |     const dialog = page.getByRole('dialog', { name: 'Delete item confirmation' });
  42  |     await expect(dialog).toBeVisible();
  43  |     await dialog.getByRole('button', { name: 'Cancel' }).click();
  44  |     await expect(dialog).not.toBeVisible();
  45  |     expect(await itemRows(page).count()).toBe(rowsBefore);
  46  |     expect((await summary(page)).items).toBe(SEED.items);
  47  |     expectClean(errors);
  48  |   });
  49  | 
  50  |   test('delete item: confirm removes exactly that item', async ({ page, errors }) => {
  51  |     await gotoDemo(page);
  52  |     await openCategory(page, 'Backpack');
  53  |     const rowsBefore = await itemRows(page).count();
  54  |     const firstLabel = (await itemRows(page).first().getAttribute('aria-label')) ?? '';
  55  |     const name = firstLabel.replace(/ — (expand|collapse) details$/, '');
  56  |     await page.getByRole('button', { name: `Delete ${name}` }).click();
  57  |     const dialog = page.getByRole('dialog', { name: 'Delete item confirmation' });
  58  |     await dialog.getByRole('button', { name: 'Delete Item' }).click();
  59  |     await expect(page.getByText(`Deleted "${name}"`)).toBeVisible();
  60  |     expect(await itemRows(page).count()).toBe(rowsBefore - 1);
  61  |     expect((await summary(page)).items).toBe(SEED.items - 1);
  62  |     expectClean(errors);
  63  |   });
  64  | 
  65  |   test('add item appends a new selected "Unnamed item" and opens it for editing', async ({ page, errors }) => {
  66  |     await gotoDemo(page);
  67  |     await openCategory(page, 'Backpack');
  68  |     const before = await summary(page);
  69  |     await page.getByRole('button', { name: 'Add item to Backpack' }).click();
  70  |     await expect(page.getByRole('button', { name: /^Unnamed item — (expand|collapse) details$/ })).toBeVisible();
  71  |     const after = await summary(page);
  72  |     expect(after.items).toBe(before.items + 1);
  73  |     expect(after.selected).toBe(before.selected + 1); // new items are created selected
  74  |     // User intent: a just-created item should open its detail editor so it can
  75  |     // be configured immediately.
  76  |     await expect(
  77  |       page.getByRole('button', { name: 'Unnamed item — collapse details' }),
  78  |       'newly added item should be expanded for editing',
  79  |     ).toBeVisible();
  80  |     expectClean(errors);
  81  |   });
  82  | 
  83  |   test('items have no name editor anywhere (rename-item capability check)', async ({ page, errors }) => {
  84  |     await gotoDemo(page);
  85  |     await openCategory(page, 'Backpack');
  86  |     await page.getByRole('button', { name: 'Add item to Backpack' }).click();
  87  |     const row = page.getByRole('button', { name: /^Unnamed item — (expand|collapse) details$/ }).first();
  88  |     if ((await row.getAttribute('aria-label'))?.includes('expand')) await row.click();
  89  |     // The detail panel exposes qty + weight editors. A name/type editor should
  90  |     // exist so a new item does not remain "Unnamed item" forever.
  91  |     await expect(page.getByLabel('Quantity of Unnamed item')).toBeVisible();
  92  |     // Semantic check: any plausible name/type editing control anywhere on the
  93  |     // screen while the new item's detail panel is open. Covers text/search
  94  |     // inputs, textareas, contenteditable regions, and an accessible textbox
  95  |     // labeled for the item. Page-wide absence implies item-scoped absence.
  96  |     const editors = page.locator(
  97  |       'input[type="text"], input[type="search"], input:not([type]), textarea, [contenteditable="true"]',
  98  |     );
  99  |     const labeledEditor = page.getByRole('textbox', { name: /name|type|Unnamed item/i });
  100 |     const count = (await editors.count()) + (await labeledEditor.count());
> 101 |     expect(count, 'expected a name/type editor for the new item').toBeGreaterThan(0);
      |                                                                   ^ Error: expected a name/type editor for the new item
  102 |     expectClean(errors);
  103 |   });
  104 | 
  105 |   test('editing one item quantity does not mutate a neighboring item', async ({ page, errors }) => {
  106 |     await gotoDemo(page);
  107 |     await openCategory(page, 'Clothing');
  108 |     const rows = itemRows(page);
  109 |     expect(await rows.count()).toBeGreaterThanOrEqual(2);
  110 |     const nameA = ((await rows.nth(0).getAttribute('aria-label')) ?? '').replace(/ — (expand|collapse) details$/, '');
  111 |     const nameB = ((await rows.nth(1).getAttribute('aria-label')) ?? '').replace(/ — (expand|collapse) details$/, '');
  112 |     // open B, record qty
  113 |     await page.getByRole('button', { name: `${nameB} — expand details` }).click();
  114 |     const qtyBBefore = await page.getByLabel(`Quantity of ${nameB}`).inputValue();
  115 |     await page.getByRole('button', { name: `${nameB} — collapse details` }).click();
  116 |     // change A
  117 |     await page.getByRole('button', { name: `${nameA} — expand details` }).click();
  118 |     await page.getByLabel(`Quantity of ${nameA}`).selectOption('3');
  119 |     await page.getByRole('button', { name: `${nameA} — collapse details` }).click();
  120 |     // verify B unchanged
  121 |     await page.getByRole('button', { name: `${nameB} — expand details` }).click();
  122 |     expect(await page.getByLabel(`Quantity of ${nameB}`).inputValue()).toBe(qtyBBefore);
  123 |     expectClean(errors);
  124 |   });
  125 | 
  126 |   test('item stays in its category after an edit', async ({ page, errors }) => {
  127 |     await gotoDemo(page);
  128 |     await openCategory(page, 'Electronics');
  129 |     const rows = itemRows(page);
  130 |     const countBefore = await rows.count();
  131 |     const name = ((await rows.first().getAttribute('aria-label')) ?? '').replace(/ — (expand|collapse) details$/, '');
  132 |     await page.getByRole('button', { name: `${name} — expand details` }).click();
  133 |     await page.getByLabel(`Quantity of ${name}`).selectOption('2');
  134 |     await page.getByRole('button', { name: `${name} — collapse details` }).click();
  135 |     expect(await itemRows(page).count()).toBe(countBefore);
  136 |     await expect(page.getByRole('button', { name: `${name} — expand details` })).toBeVisible();
  137 |     expectClean(errors);
  138 |   });
  139 | });
  140 | 
```