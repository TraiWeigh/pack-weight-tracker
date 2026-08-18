# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/keyboard-tooltips.spec.ts >> Accessible names & tooltips >> Drag-to-reorder handle has aria-label and title
- Location: tests/e2e/phase1b/keyboard-tooltips.spec.ts:133:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /Drag to reorder Backpack category/i }).first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByRole('button', { name: /Drag to reorder Backpack category/i }).first()

```

```yaml
- button "Open navigation menu"
- text: TrailWeigh Demo Pack List 21 items
- button "Expand all categories"
- text: 6 categories 16 Selected
- button "Open Backpack category"
- text: Backpack 3 items · 2 selected 72.50 oz
- button "Open Clothing category"
- text: Clothing 5 items · 4 selected 50.70 oz
- button "Open Toiletries category"
- text: Toiletries 4 items · 2 selected 2.60 oz
- button "Open Electronics category"
- text: Electronics 3 items · 3 selected 14.40 oz
- button "Open Shelter category"
- text: Shelter 3 items · 3 selected 90.00 oz
- button "Open Kitchen category"
- text: Kitchen 3 items · 2 selected 13.70 oz
- button "Locker — saved lists": Locker
- button "Summary — pack weight and progress": Summary
- button "Add — add items, categories, or import": Add
- button "Search — find gear": Search
- button "Next controls": Next
- region "Notifications (F8)":
  - list
```

# Test source

```ts
  36  |     await expect(page.getByRole('button', { name: 'Close Backpack category', exact: true })).toBeVisible({ timeout: 3000 });
  37  |     expect(errors.pageErrors).toEqual([]);
  38  |   });
  39  | 
  40  |   test('item row expand-details button is focusable via keyboard', async ({ page, errors }) => {
  41  |     await gotoDemo(page);
  42  |     await openCategory(page, 'Backpack');
  43  |     const expandBtn = page.getByRole('button', { name: / — expand details$/ }).first();
  44  |     await expandBtn.focus();
  45  |     const isFocused = await expandBtn.evaluate(el => el === document.activeElement);
  46  |     expect(isFocused, 'item expand button is focusable').toBe(true);
  47  |     expect(errors.pageErrors).toEqual([]);
  48  |   });
  49  | 
  50  |   test('pressing Enter on item expand-details opens item detail panel', async ({ page, errors }) => {
  51  |     await gotoDemo(page);
  52  |     await openCategory(page, 'Backpack');
  53  |     const expandBtn = page.getByRole('button', { name: / — expand details$/ }).first();
  54  |     const label = (await expandBtn.getAttribute('aria-label')) ?? '';
  55  |     const itemName = label.replace(/ — expand details$/, '');
  56  |     await expandBtn.focus();
  57  |     await page.keyboard.press('Enter');
  58  |     await expect(page.getByRole('button', { name: `${itemName} — collapse details` })).toBeVisible({ timeout: 3000 });
  59  |     expect(errors.pageErrors).toEqual([]);
  60  |   });
  61  | 
  62  |   test('Escape cancels Add Category input', async ({ page, errors }) => {
  63  |     await gotoDemo(page);
  64  |     // Updated (R0078): Add Category is now in the Add bottom deck (R002 architecture).
  65  |     // Old path 'Add a new category to this list' button was removed when the inline
  66  |     // add-category control was replaced by the deck card (R004 Part 4).
  67  |     await page.getByRole('button', { name: 'Add — add items, categories, or import', exact: true }).click();
  68  |     await page.getByRole('button', { name: 'Add Category — open card' }).click();
  69  |     const input = page.getByLabel('New category name');
  70  |     await expect(input).toBeVisible({ timeout: 3000 });
  71  |     await input.fill('ShouldBeDiscarded');
  72  |     await page.keyboard.press('Escape');
  73  |     // Input should be dismissed (no new category added)
  74  |     await expect(input).not.toBeVisible({ timeout: 3000 });
  75  |     await expect(page.getByText('ShouldBeDiscarded')).not.toBeVisible();
  76  |     expect(errors.pageErrors).toEqual([]);
  77  |   });
  78  | 
  79  |   test('Enter confirms Add Category input', async ({ page, errors }) => {
  80  |     await gotoDemo(page);
  81  |     // Updated (R0078): same navigation fix as Escape test — use Add deck path.
  82  |     await page.getByRole('button', { name: 'Add — add items, categories, or import', exact: true }).click();
  83  |     await page.getByRole('button', { name: 'Add Category — open card' }).click();
  84  |     const input = page.getByLabel('New category name');
  85  |     await expect(input).toBeVisible({ timeout: 3000 });
  86  |     await input.fill('KeyboardCat');
  87  |     await page.keyboard.press('Enter');
  88  |     await page.waitForTimeout(500);
  89  |     // Category may appear as text anywhere in the list (the header row or a data-testid)
  90  |     await expect(page.getByText('KeyboardCat').first()).toBeVisible({ timeout: 6000 });
  91  |     expect(errors.pageErrors).toEqual([]);
  92  |   });
  93  | 
  94  |   test('item checkbox is togglable via Space key', async ({ page, errors }) => {
  95  |     await gotoDemo(page);
  96  |     await openCategory(page, 'Backpack');
  97  |     const checkbox = page.getByRole('checkbox', { name: /(selected for checklist|not selected)/ }).first();
  98  |     const before = await checkbox.isChecked();
  99  |     await checkbox.focus();
  100 |     await page.keyboard.press('Space');
  101 |     await page.waitForTimeout(200);
  102 |     const after = await checkbox.isChecked();
  103 |     expect(after, 'checkbox state toggled via Space').not.toBe(before);
  104 |     expect(errors.pageErrors).toEqual([]);
  105 |   });
  106 | 
  107 | });
  108 | 
  109 | test.describe('Accessible names & tooltips', () => {
  110 | 
  111 |   test('Print button has both aria-label and title attribute', async ({ page, errors }) => {
  112 |     // Updated (R0078): The More deck "Share & Print" card was removed in R0072 §10
  113 |     // ("No Duplicate Control: Share/Print moved to Share/Preview bottom boxes").
  114 |     // Print is now always-reachable via the Preview NavBox in nav Group 3.
  115 |     await gotoDemo(page);
  116 |     // Navigate to Group 3: two "Next controls" clicks from Group 1.
  117 |     const nextBtn = page.locator('button[aria-label="Next controls"]');
  118 |     await nextBtn.first().evaluate(el => (el as HTMLElement).click());
  119 |     await page.waitForTimeout(300);
  120 |     await nextBtn.first().evaluate(el => (el as HTMLElement).click());
  121 |     await page.waitForTimeout(300);
  122 |     // Open the Preview overlay — contains the Print button.
  123 |     await page.locator('button[aria-label="Preview — view and print gear list"]').evaluate(el => (el as HTMLElement).click());
  124 |     await page.waitForTimeout(400);
  125 |     // Verify the Print button has an accessible label.
  126 |     const btn = page.getByRole('button', { name: /Print/i }).first();
  127 |     await expect(btn).toBeVisible({ timeout: 5000 });
  128 |     const label = await btn.getAttribute('aria-label');
  129 |     expect(label ?? 'Print', 'Print button accessible label').toBeTruthy();
  130 |     expect(errors.pageErrors).toEqual([]);
  131 |   });
  132 | 
  133 |   test('Drag-to-reorder handle has aria-label and title', async ({ page, errors }) => {
  134 |     await gotoDemo(page);
  135 |     const handle = page.getByRole('button', { name: /Drag to reorder Backpack category/i }).first();
> 136 |     await expect(handle).toBeVisible();
      |                          ^ Error: expect(locator).toBeVisible() failed
  137 |     const title = await handle.getAttribute('title');
  138 |     expect(title, 'reorder handle title').toBeTruthy();
  139 |     expect(errors.pageErrors).toEqual([]);
  140 |   });
  141 | 
  142 |   test('category Add Item button has an accessible label', async ({ page, errors }) => {
  143 |     await gotoDemo(page);
  144 |     await openCategory(page, 'Backpack');
  145 |     const addItemBtn = page.getByRole('button', { name: /Add item to Backpack/i });
  146 |     await expect(addItemBtn).toBeVisible();
  147 |     const label = await addItemBtn.getAttribute('aria-label');
  148 |     // Either aria-label or visible text must exist
  149 |     const text = await addItemBtn.textContent();
  150 |     expect((label ?? '') + (text ?? ''), 'add item button has accessible label/text').toBeTruthy();
  151 |     expect(errors.pageErrors).toEqual([]);
  152 |   });
  153 | 
  154 |   test('item checkbox has an accessible name', async ({ page, errors }) => {
  155 |     await gotoDemo(page);
  156 |     await openCategory(page, 'Backpack');
  157 |     const checkbox = page.getByRole('checkbox', { name: /(selected for checklist|not selected)/ }).first();
  158 |     await expect(checkbox).toBeVisible();
  159 |     const label = await checkbox.getAttribute('aria-label');
  160 |     expect(label, 'checkbox has aria-label').toBeTruthy();
  161 |     expect(errors.pageErrors).toEqual([]);
  162 |   });
  163 | 
  164 |   test('tab order does not trap in a basic category open/close workflow', async ({ page, errors }) => {
  165 |     await gotoDemo(page);
  166 |     // Tab through several controls — should not get stuck
  167 |     for (let i = 0; i < 10; i++) {
  168 |       await page.keyboard.press('Tab');
  169 |     }
  170 |     // Page should still be interactive and responsive.
  171 |     // Readiness updated (R0078): 'LIST SUMMARY' header was replaced by the
  172 |     // active list name in V3; use the stable main-scroll container instead.
  173 |     await expect(page.locator('[data-testid="main-scroll"]')).toBeVisible();
  174 |     expect(errors.pageErrors).toEqual([]);
  175 |   });
  176 | 
  177 | });
  178 | 
```