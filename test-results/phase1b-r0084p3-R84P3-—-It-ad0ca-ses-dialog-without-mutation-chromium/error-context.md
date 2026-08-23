# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/r0084p3.spec.ts >> R84P3 — Item rename dialog: Cancel | Save wording >> R84P3-ITEM-08: Cancel closes dialog without mutation
- Location: tests/e2e/phase1b/r0084p3.spec.ts:269:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('[data-swipe-key="item:Backpack:b1"]').locator('[data-testid="swipe-secondary-action"]')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - button "Open navigation menu" [ref=e6] [cursor=pointer]
      - generic [ref=e8]: TrailWeigh
    - generic [ref=e46]:
      - generic [ref=e53]:
        - generic [ref=e54]: Demo Pack List
        - generic [ref=e55]:
          - generic [ref=e56]: "21"
          - generic [ref=e57]: items
      - button "Collapse all categories" [ref=e58] [cursor=pointer]
      - generic [ref=e61]:
        - generic [ref=e62]: 6 categories
        - generic [ref=e63]: 16 Selected
    - toolbar "Checklist filter" [ref=e68]:
      - 'button "Filter: category" [ref=e69] [cursor=pointer]':
        - generic [ref=e70]: "Filter: Category"
    - generic [ref=e75]:
      - generic [ref=e76]:
        - generic [ref=e78]:
          - button [ref=e79] [cursor=pointer]: Edit
          - button [ref=e83] [cursor=pointer]: Delete
          - generic [ref=e88] [cursor=pointer]:
            - button "Close Backpack category" [expanded] [ref=e89]
            - generic [ref=e94]:
              - generic [ref=e96]:
                - generic [ref=e97]: Backpack
                - generic [ref=e98]: 3 items · 2 selected
              - generic [ref=e99]: 72.50 oz
        - generic [ref=e100]:
          - generic [ref=e102]:
            - button "Delete Osprey Atmos 65" [ref=e103] [cursor=pointer]: Delete
            - generic [ref=e108]:
              - 'checkbox "Osprey Atmos 65: selected for checklist" [checked] [ref=e109] [cursor=pointer]'
              - button "Osprey Atmos 65 — expand details" [active] [ref=e110] [cursor=pointer]:
                - generic [ref=e111]: Osprey Atmos 65
                - generic [ref=e112]: "1"
          - generic [ref=e114]:
            - button [ref=e115] [cursor=pointer]: Delete
            - generic [ref=e120]:
              - 'checkbox "Pack Rain Cover: selected for checklist" [checked] [ref=e121] [cursor=pointer]'
              - button "Pack Rain Cover — expand details" [ref=e122] [cursor=pointer]:
                - generic [ref=e123]: Pack Rain Cover
                - generic [ref=e124]: "1"
          - generic [ref=e126]:
            - button [ref=e127] [cursor=pointer]: Delete
            - generic [ref=e132]:
              - 'checkbox "Dry Bags: not selected for checklist" [ref=e133] [cursor=pointer]'
              - button "Dry Bags — expand details" [ref=e134] [cursor=pointer]:
                - generic [ref=e135]: Dry Bags
                - generic [ref=e136]: "2"
        - button "Add item to Backpack" [ref=e138] [cursor=pointer]:
          - generic [ref=e140]: Add Item
      - generic [ref=e143]:
        - button [ref=e144] [cursor=pointer]: Edit
        - button [ref=e148] [cursor=pointer]: Delete
        - generic [ref=e153] [cursor=pointer]:
          - button "Open Clothing category" [ref=e154]
          - generic [ref=e157]:
            - generic [ref=e159]:
              - generic [ref=e160]: Clothing
              - generic [ref=e161]: 5 items · 4 selected
            - generic [ref=e162]: 50.70 oz
      - generic [ref=e165]:
        - button [ref=e166] [cursor=pointer]: Edit
        - button [ref=e170] [cursor=pointer]: Delete
        - generic [ref=e175] [cursor=pointer]:
          - button "Open Toiletries category" [ref=e176]
          - generic [ref=e181]:
            - generic [ref=e183]:
              - generic [ref=e184]: Toiletries
              - generic [ref=e185]: 4 items · 2 selected
            - generic [ref=e186]: 2.60 oz
      - generic [ref=e189]:
        - button [ref=e190] [cursor=pointer]: Edit
        - button [ref=e194] [cursor=pointer]: Delete
        - generic [ref=e199] [cursor=pointer]:
          - button "Open Electronics category" [ref=e200]
          - generic [ref=e203]:
            - generic [ref=e205]:
              - generic [ref=e206]: Electronics
              - generic [ref=e207]: 3 items · 3 selected
            - generic [ref=e208]: 14.40 oz
      - generic [ref=e211]:
        - button [ref=e212] [cursor=pointer]: Edit
        - button [ref=e216] [cursor=pointer]: Delete
        - generic [ref=e221] [cursor=pointer]:
          - button "Open Shelter category" [ref=e222]
          - generic [ref=e227]:
            - generic [ref=e229]:
              - generic [ref=e230]: Shelter
              - generic [ref=e231]: 3 items · 3 selected
            - generic [ref=e232]: 90.00 oz
      - generic [ref=e235]:
        - button [ref=e236] [cursor=pointer]: Edit
        - button [ref=e240] [cursor=pointer]: Delete
        - generic [ref=e245] [cursor=pointer]:
          - button "Open Kitchen category" [ref=e246]
          - generic [ref=e252]:
            - generic [ref=e254]:
              - generic [ref=e255]: Kitchen
              - generic [ref=e256]: 3 items · 2 selected
            - generic [ref=e257]: 13.70 oz
    - generic [ref=e260]:
      - button "Locker — saved lists" [ref=e261] [cursor=pointer]:
        - generic [ref=e264]: Locker
      - button "Summary — pack weight and progress" [ref=e266] [cursor=pointer]:
        - generic [ref=e268]: Summary
      - button "Add — add items, categories, or import" [ref=e270] [cursor=pointer]:
        - generic [ref=e272]: Add
      - button "Search — find gear" [ref=e274] [cursor=pointer]:
        - generic [ref=e278]: Search
      - button "Next controls" [ref=e280] [cursor=pointer]:
        - generic [ref=e281]: Next
    - navigation [ref=e285]:
      - generic [ref=e286]: TrailWeigh
      - list [ref=e288]:
        - listitem [ref=e289]:
          - button [ref=e290] [cursor=pointer]:
            - generic [ref=e294]: Home
        - listitem [ref=e296]:
          - button [disabled] [ref=e297]:
            - generic [ref=e300]:
              - generic [ref=e301]: Master Library
              - generic [ref=e302]: Coming soon
        - listitem [ref=e303]:
          - button [ref=e304] [cursor=pointer]:
            - generic [ref=e307]: My Lists
        - listitem [ref=e309]:
          - button [ref=e310] [cursor=pointer]:
            - generic [ref=e314]: Help & Tutorials
        - listitem [ref=e316]:
          - button [ref=e317] [cursor=pointer]:
            - generic [ref=e321]: Settings
      - button [ref=e324] [cursor=pointer]:
        - generic [ref=e327]:
          - generic [ref=e328]: Right-handed
          - generic [ref=e329]: Tap to flip menu side
  - region "Notifications (F8)":
    - list
```

# Test source

```ts
  1   | /**
  2   |  * R0084P3 — "Cancel | Save" button wording in name-edit dialogs
  3   |  *
  4   |  * Both the category rename sheet and the item rename dialog previously
  5   |  * showed "Rename" as the confirmation button. R0084P3 changes that visible
  6   |  * label to "Save". The two-button pattern is now "Cancel | Save" in both
  7   |  * dialogs. aria-labels are updated to match ("Save category name" /
  8   |  * "Save item name"). All validation, data mutation, and entry-point
  9   |  * behaviour is unchanged.
  10  |  *
  11  |  * Tests verify:
  12  |  *   - Visible button text is "Save" (not "Rename") in category sheet
  13  |  *   - Visible button text is "Save" (not "Rename") in item dialog
  14  |  *   - aria-labels are descriptive ("Save category name" / "Save item name")
  15  |  *   - "Cancel" label unchanged in both dialogs
  16  |  *   - Save disabled when value unchanged or empty (cat + item)
  17  |  *   - Save commits the edit and dismisses the dialog (cat + item)
  18  |  *   - Cancel dismisses without mutation (cat + item)
  19  |  *   - data-testid="item-rename-confirm" still present (other specs depend on it)
  20  |  */
  21  | 
  22  | import { test, expect, gotoDemo, expectClean } from '../helpers/trailweigh';
  23  | import type { Locator, Page } from '@playwright/test';
  24  | 
  25  | // ─── shared gesture helpers (same as r0084.spec.ts) ──────────────────────────
  26  | 
  27  | async function swipeLeft(page: Page, row: Locator, dist = 110) {
  28  |   const box = (await row.boundingBox())!;
  29  |   const startX = box.x + box.width - 6;
  30  |   const y = box.y + box.height / 2;
  31  |   await page.mouse.move(startX, y);
  32  |   await page.mouse.down();
  33  |   await page.mouse.move(startX - dist, y, { steps: 10 });
  34  |   await page.mouse.up();
  35  |   await page.waitForTimeout(350);
  36  | }
  37  | 
  38  | async function openSwipeReveal(page: Page, swipeKey: string) {
  39  |   const row = page.locator(`[data-swipe-key="${swipeKey}"]`);
  40  |   await swipeLeft(page, row);
  41  |   await expect(row).toHaveAttribute('data-swipe-open', 'true');
  42  |   return row;
  43  | }
  44  | 
  45  | async function firstCatName(page: Page): Promise<string> {
  46  |   const key = await page.locator('[data-swipe-key^="cat:"]').first().getAttribute('data-swipe-key');
  47  |   return key!.slice(4);
  48  | }
  49  | 
  50  | async function openCategory(page: Page, cat: string) {
  51  |   const open = page.getByRole('button', { name: `Open ${cat} category` });
  52  |   if (await open.isVisible().catch(() => false)) await open.click();
  53  |   await expect(page.locator(`[data-swipe-key^="item:${cat}:"]`).first()).toBeVisible({ timeout: 5000 });
  54  | }
  55  | 
  56  | // ─── open dialogs ─────────────────────────────────────────────────────────────
  57  | 
  58  | async function openCatRenameSheet(page: Page) {
  59  |   await gotoDemo(page);
  60  |   const cat = await firstCatName(page);
  61  |   const row = await openSwipeReveal(page, `cat:${cat}`);
  62  |   await row.locator('[data-testid="swipe-secondary-action"]').click();
  63  |   await page.waitForTimeout(200);
  64  |   await expect(page.locator('input[placeholder="Category name…"]')).toBeVisible({ timeout: 4000 });
  65  |   return cat;
  66  | }
  67  | 
  68  | async function openItemRenameDialog(page: Page) {
  69  |   await gotoDemo(page);
  70  |   const cat = await firstCatName(page);
  71  |   await openCategory(page, cat);
  72  |   const itemRow = page.locator(`[data-swipe-key^="item:${cat}:"]`).first();
  73  |   const swipeKey = await itemRow.getAttribute('data-swipe-key');
  74  |   const row = await openSwipeReveal(page, swipeKey!);
> 75  |   await row.locator('[data-testid="swipe-secondary-action"]').click();
      |                                                               ^ Error: locator.click: Test timeout of 60000ms exceeded.
  76  |   await page.waitForTimeout(200);
  77  |   await expect(page.locator('[data-testid="item-rename-dialog"]')).toBeVisible({ timeout: 4000 });
  78  |   return cat;
  79  | }
  80  | 
  81  | // ═════════════════════════════════════════════════════════════════════════════
  82  | // PART 1 — Category rename sheet button labels
  83  | // ═════════════════════════════════════════════════════════════════════════════
  84  | 
  85  | test.describe('R84P3 — Category rename sheet: Cancel | Save wording', () => {
  86  |   test.use({ viewport: { width: 390, height: 844 } });
  87  | 
  88  |   test('R84P3-CAT-01: confirmation button visible text is "Save"', async ({ page, errors }) => {
  89  |     await openCatRenameSheet(page);
  90  | 
  91  |     const saveBtn = page.getByRole('button', { name: 'Save category name' });
  92  |     await expect(saveBtn).toBeVisible();
  93  |     const text = (await saveBtn.innerText()).trim();
  94  |     expect(text).toBe('Save');
  95  | 
  96  |     expectClean(errors);
  97  |   });
  98  | 
  99  |   test('R84P3-CAT-02: confirmation button aria-label is "Save category name"', async ({ page, errors }) => {
  100 |     await openCatRenameSheet(page);
  101 | 
  102 |     const saveBtn = page.locator('button[aria-label="Save category name"]');
  103 |     await expect(saveBtn).toBeVisible();
  104 | 
  105 |     expectClean(errors);
  106 |   });
  107 | 
  108 |   test('R84P3-CAT-03: cancel button label is still "Cancel"', async ({ page, errors }) => {
  109 |     await openCatRenameSheet(page);
  110 | 
  111 |     const cancelBtn = page.locator('button[aria-label="Cancel rename"]');
  112 |     await expect(cancelBtn).toBeVisible();
  113 |     const text = (await cancelBtn.innerText()).trim();
  114 |     expect(text).toBe('Cancel');
  115 | 
  116 |     expectClean(errors);
  117 |   });
  118 | 
  119 |   test('R84P3-CAT-04: no button with visible text "Rename" in the sheet', async ({ page, errors }) => {
  120 |     await openCatRenameSheet(page);
  121 | 
  122 |     // Gather all visible button texts inside the sheet
  123 |     const buttons = page.locator('button:visible');
  124 |     const texts = await buttons.evaluateAll(els =>
  125 |       els.map(el => (el as HTMLElement).innerText.trim())
  126 |     );
  127 |     expect(texts).not.toContain('Rename');
  128 | 
  129 |     expectClean(errors);
  130 |   });
  131 | 
  132 |   test('R84P3-CAT-05: Save disabled when value unchanged', async ({ page, errors }) => {
  133 |     const cat = await openCatRenameSheet(page);
  134 |     // Input is pre-filled with current name — Save must be disabled
  135 |     const saveBtn = page.locator('button[aria-label="Save category name"]');
  136 |     await expect(saveBtn).toBeDisabled();
  137 | 
  138 |     expectClean(errors);
  139 |   });
  140 | 
  141 |   test('R84P3-CAT-06: Save disabled when input is empty', async ({ page, errors }) => {
  142 |     await openCatRenameSheet(page);
  143 |     await page.locator('input[placeholder="Category name…"]').fill('');
  144 |     const saveBtn = page.locator('button[aria-label="Save category name"]');
  145 |     await expect(saveBtn).toBeDisabled();
  146 | 
  147 |     expectClean(errors);
  148 |   });
  149 | 
  150 |   test('R84P3-CAT-07: Save commits edit and closes sheet', async ({ page, errors }) => {
  151 |     const cat = await openCatRenameSheet(page);
  152 |     const input = page.locator('input[placeholder="Category name…"]');
  153 |     await input.click({ clickCount: 3 });
  154 |     await input.fill('SavedCatName');
  155 | 
  156 |     await page.locator('button[aria-label="Save category name"]').click();
  157 |     await page.waitForTimeout(300);
  158 | 
  159 |     // Sheet closed; new name visible in category bar
  160 |     await expect(page.locator('[data-testid="cat-name-SavedCatName"]')).toBeVisible({ timeout: 3000 });
  161 |     await expect(page.locator(`[data-testid="cat-name-${cat}"]`)).toHaveCount(0);
  162 | 
  163 |     expectClean(errors);
  164 |   });
  165 | 
  166 |   test('R84P3-CAT-08: Cancel closes sheet without mutation', async ({ page, errors }) => {
  167 |     const cat = await openCatRenameSheet(page);
  168 |     const input = page.locator('input[placeholder="Category name…"]');
  169 |     await input.fill('ShouldNotApply');
  170 |     await page.locator('button[aria-label="Cancel rename"]').click();
  171 |     await page.waitForTimeout(200);
  172 | 
  173 |     // Original name still present
  174 |     await expect(page.locator(`[data-testid="cat-header-${cat}"]`)).toBeVisible({ timeout: 3000 });
  175 |     await expect(page.locator('[data-testid="cat-name-ShouldNotApply"]')).toHaveCount(0);
```