# Importer regression tests

## Running the tests

```sh
pnpm test:importer
```

This runs all five test suites in sequence and exits non-zero on any failure.

Individual suites:

```sh
node artifacts/api-server/src/routes/importGear.test.mjs       # Excel extraction + classification
node artifacts/api-server/src/routes/importGear.pdf.test.mjs   # PDF parser fixture
node artifacts/api-server/src/routes/scanGear.test.mjs         # Image format rejection
node artifacts/pack-checklist/src/lib/categoryAliases.test.mjs # Shared category resolver
node artifacts/pack-checklist/src/hooks/usePackData.test.mjs   # Duplicate-category migration
```

**No build step required.** Each file inlines the relevant production functions in
plain JS so tests can run against source changes immediately.

## What each suite protects

| Suite | Behaviours protected |
|-------|---------------------|
| `importGear.test.mjs` | Excel extraction (section headers, TRUE/FALSE rows, column detection, Meal Planner skip); consumables routing; wearable-clothing routing; shelter/sleep routing; Bug Net → Clothing Packed; Fuel → Consumables, no warning; real-file regression (69 items, bug net, fuel) |
| `importGear.pdf.test.mjs` | TrailWeigh PDF parser: category headers, checkbox rows, greedy regex (model numbers not parsed as weights), numeric-leading types (1 Gal Freezer Bag), Fuel description vs. weight, Fuel → Expendables override, summary-row skipping, forward-only category guard, Meal Planner hard stop |
| `scanGear.test.mjs` | Image uploads (.png .jpg .jpeg .webp) rejected by /api/import-gear with a clear error; type="image" rejected by /api/scan-gear with code "unsupported_type" |
| `categoryAliases.test.mjs` | resolveDestination: Shelter/SHELTER/" shelter " → Shelter System; Sleep → Sleep System; Kitchen/Kitchen System → Kitchen Gear; Consumables → Expendables; Clothing Packed ≠ Clothing Worn; unknown category returned as-is (never silently becomes Backpack) |
| `usePackData.test.mjs` | deduplicateCategoryAliases: items merge into preferred (user-named) tab, existing items kept first, source tabs removed from order/items/meta, full item objects preserved (id/sub/desc/weightOz/qty/checked/expendable), idempotent on repeated runs; mergeDefaultCategories: skips DEFAULT names when an alias already exists |

## Where fixtures are stored

| Fixture | Location | Notes |
|---------|----------|-------|
| Excel in-memory workbooks | Inline in `importGear.test.mjs` via `xlsx.utils.aoa_to_sheet` | No files on disk |
| Real Excel workbook | `attached_assets/PACK_WEIGHT_&_MEAL_PLANNER_CHECKLIST_1785883024547.xlsx` | Read from disk; tests skip gracefully if missing |
| PDF page-text fixture | Inline string in `importGear.pdf.test.mjs` | Simulates `pdf-parse` v2 output for a real TrailWeigh export |
| Deduplication fixture | Inline JS object in `usePackData.test.mjs` | Mirrors a stored v5 checklist with all three duplicate pairs |

## Framework

Node.js built-in runner — no additional test dependencies.
All suites use the same `assert` / `assertEqual` helpers and exit with code 1 on failure.
