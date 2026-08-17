# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase1b/keyboard-tooltips.spec.ts >> Keyboard interaction >> pressing Enter on item expand-details opens item detail panel
- Location: tests/e2e/phase1b/keyboard-tooltips.spec.ts:50:7

# Error details

```
Error: Channel closed
```

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('LIST SUMMARY')
Expected: visible
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByText('LIST SUMMARY')
  - Target page, context or browser has been closed

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

```
Error: apiRequestContext._wrapApiCall: Target page, context or browser has been closed
```