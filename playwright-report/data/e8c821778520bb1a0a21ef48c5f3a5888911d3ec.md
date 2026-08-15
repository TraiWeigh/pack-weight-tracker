# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: core/items.spec.ts >> D. Item core behavior >> add item appends a new selected "Unnamed item" and opens it for editing
- Location: tests/e2e/core/items.spec.ts:65:7

# Error details

```
Error: newly added item should be expanded for editing

expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Unnamed item — collapse details' })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - newly added item should be expanded for editing with timeout 15000ms
  - waiting for getByRole('button', { name: 'Unnamed item — collapse details' })

```

```yaml
- button "Open menu"
- text: TrailWeigh
- button "Create or import — Start / Create"
- text: Demo Pack List LIST SUMMARY 22 items 6 categories 17 Selected 5 Not Selected
- button "Close Backpack category" [expanded]
- button "Category options for Backpack": Backpack
- text: 4 items · 3 selected
- button "Drag to reorder Backpack category"
- text: 72.50 oz
- button "Osprey Atmos 65 — expand details":
  - checkbox "Osprey Atmos 65 selected for checklist" [checked]
  - text: Osprey Atmos 65 1
  - button "Delete Osprey Atmos 65"
- button "Pack Rain Cover — expand details":
  - checkbox "Pack Rain Cover selected for checklist" [checked]
  - text: Pack Rain Cover 1
  - button "Delete Pack Rain Cover"
- button "Dry Bags — expand details":
  - checkbox "Dry Bags not selected"
  - text: Dry Bags 2
  - button "Delete Dry Bags"
- button "Unnamed item — expand details":
  - checkbox "Unnamed item selected for checklist" [checked]
  - text: Unnamed item 1
  - button "Delete Unnamed item"
- button "Add item to Backpack": Add Item
- button "Open Clothing category"
- button "Category options for Clothing": Clothing
- text: 5 items · 4 selected
- button "Drag to reorder Clothing category"
- text: 50.70 oz
- button "Open Toiletries category"
- button "Category options for Toiletries": Toiletries
- text: 4 items · 2 selected
- button "Drag to reorder Toiletries category"
- text: 2.60 oz
- button "Open Electronics category"
- button "Category options for Electronics": Electronics
- text: 3 items · 3 selected
- button "Drag to reorder Electronics category"
- text: 14.40 oz
- button "Open Shelter category"
- button "Category options for Shelter": Shelter
- text: 3 items · 3 selected
- button "Drag to reorder Shelter category"
- text: 90.00 oz
- button "Open Kitchen category"
- button "Category options for Kitchen": Kitchen
- text: 3 items · 2 selected
- button "Drag to reorder Kitchen category"
- text: 13.70 oz
- button "Add a new category to this list": Add Category
- button "List — current gear list": List
- button "Locker — browse and load saved lists": Locker
- text: Catalog
- button "Summary — pack weight and distribution": Summary
- button "More — settings and tools": More
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
> 79  |     ).toBeVisible();
      |       ^ Error: newly added item should be expanded for editing
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
  101 |     expect(count, 'expected a name/type editor for the new item').toBeGreaterThan(0);
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