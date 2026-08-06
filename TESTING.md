# Importer regression tests

## Running the tests

```sh
pnpm test:importer
```

This runs all **ten** test suites in sequence and exits non-zero on any failure.

Individual suites (in execution order):

```sh
node artifacts/api-server/src/routes/importGear.test.mjs       # Excel extraction + classification
node artifacts/api-server/src/routes/importGear.pdf.test.mjs   # PDF parser fixture
node artifacts/api-server/src/routes/scanGear.test.mjs         # Image format rejection
node artifacts/pack-checklist/src/lib/categoryAliases.test.mjs # Shared category resolver
node artifacts/pack-checklist/src/hooks/usePackData.test.mjs   # Duplicate-category migration
node artifacts/pack-checklist/src/hooks/moveItem.test.mjs      # Move-item Store transformation
node artifacts/pack-checklist/src/hooks/pieColor.test.mjs      # Per-file palette persistence
node artifacts/pack-checklist/src/hooks/bgCollections.test.mjs # Photo collections data layer (updated Prompt 016A)
node artifacts/pack-checklist/src/hooks/bgCollections016A.test.mjs # Theme dropdown 016A requirements
node artifacts/pack-checklist/src/hooks/bgPhotoStore016B.test.mjs  # IndexedDB photo store (Prompt 016B)
```

**No build step required.** Each file inlines the relevant production functions in
plain JS so tests can run against source changes immediately.

**Current result:** 659 passed / 0 failed (confirmed Prompt 016B, 2026-08-06).

## What each suite protects

| Suite | Behaviours protected |
|-------|---------------------|
| `importGear.test.mjs` | Excel extraction (section headers, TRUE/FALSE rows, column detection, Meal Planner skip); consumables routing; wearable-clothing routing; shelter/sleep routing; Bug Net → Clothing Packed; Fuel → Consumables, no warning; real-file regression (69 items, bug net, fuel) |
| `importGear.pdf.test.mjs` | TrailWeigh PDF parser: category headers, checkbox rows, greedy regex (model numbers not parsed as weights), numeric-leading types (1 Gal Freezer Bag), Fuel description vs. weight, Fuel → Expendables override, summary-row skipping, forward-only category guard, Meal Planner hard stop |
| `scanGear.test.mjs` | Image uploads (.png .jpg .jpeg .webp) rejected by /api/import-gear with a clear error; type="image" rejected by /api/scan-gear with code "unsupported_type" |
| `categoryAliases.test.mjs` | resolveDestination: Shelter/SHELTER/" shelter " → Shelter System; Sleep → Sleep System; Kitchen/Kitchen System → Kitchen Gear; Consumables → Expendables; Clothing Packed ≠ Clothing Worn; unknown category returned as-is (never silently becomes Backpack) |
| `usePackData.test.mjs` | deduplicateCategoryAliases: items merge into preferred (user-named) tab, existing items kept first, source tabs removed from order/items/meta, full item objects preserved (id/sub/desc/weightOz/qty/checked/expendable), idempotent on repeated runs; mergeDefaultCategories: skips DEFAULT names when an alias already exists |
| `moveItem.test.mjs` | applyMoveItem Store transformation: item removed from source and appended to destination (M1); all GearItem fields preserved across move — id, sub, desc, weightOz, qty, checked, expendable (M2); same-category move returns identical store reference — no mutation (M3); invalid inputs (unknown source, unknown destination, unknown item ID) leave store unchanged (M4); undo/redo via inverse operations — move+undo restores original state, no item duplication (M5); no duplicate item IDs after single or sequential moves (M6); custom category names preserved exactly (M7); store.order and store.meta untouched by item moves (M8); existing destination items not displaced — moved item appended; move into empty category works (M9) |
| `pieColor.test.mjs` | Per-file Weight Distribution palette persistence: chartPaletteKey serialized in LockerEntry (P1); in-place open, new-tab stash, and newseed bundle each restore the correct palette key (P2); File A and File B retain independent palette keys across all save/load operations (P3); commitSaveReplace updates only the active file (P4); Save As copies palette key into a new entry and leaves the original unchanged (P5, P6); New/newseed bundle carries current palette key to the forked tab (P7); refresh/session-stash restores active file's palette key; empty or null stash falls back to default (P8); older files without chartPaletteKey load safely with default palette (P9); saving an older file adds chartPaletteKey (P10); restored palette key is not overwritten by default init (P11); unknown or missing chartPaletteKey values do not crash loading (P12); gear data is byte-identical through the save-and-load round trip (P13) |
| `bgCollections.test.mjs` | Photo collections data layer (updated Prompt 016A): constants including MAX_COLLECTIONS=10 (P1); runMigration — null/empty no-op, fresh migration creates "My Photos", merges into existing, idempotent, My Photos first (P2); createCollection — trimmed name, blank blocked, **duplicate names now blocked** (Prompt 016A change), case-sensitive, appended last (P3); renameCollection — success, blank blocked, duplicate blocked, same-name allowed, others unaffected, **preserves photos** (P4); deleteCollection — by ID, nonexistent no-op, last → empty, **re-enables Add Theme** (P5); addPhotoToCollection — success, bad ID, MAX_PHOTOS_PER_COLLECTION enforced, appended, others unaffected (P6); deletePhotoFromCollection — success, others safe, nonexistent no-op, other collections safe (P7) |
| `bgCollections016A.test.mjs` | Prompt 016A theme dropdown data requirements: dropdown structure — Landscapes separate from custom, Add Theme gated on count, MAX_COLLECTIONS enforced, Landscapes not counted (A1); theme name save — valid creates collection, label format "Theme [Name]", blank rejected, duplicate rejected (A2); theme count limits — MAX_COLLECTIONS=10, Landscapes excluded, delete re-enables Add Theme (A3); photos per theme — MAX=10 enforced, add increases count, remove decreases count, order preserved (A4); migration — existing 016 collections preserved, idempotent (A5); rename preserves photos and order (A6); delete removes only the target theme (A7); JSON round-trip preserves all data — updated 016B: no dataUrl in photo records (A8) |
| `bgPhotoStore016B.test.mjs` | IndexedDB photo store (Prompt 016B): validateImageFile — JPEG/PNG/WebP/GIF accepted, TIFF/SVG rejected, >25 MB rejected, 25 MB boundary accepted (S1); dataUrlToBlob — JPEG and PNG data URLs decoded to Blob, malformed → null, correct MIME extracted (S2); isMigrationDone/markMigrationDone — absent flag false, set flag true, writes "1" to localStorage (S3); storePhoto/getPhotoBlob — store-and-retrieve, miss returns null, overwrite, mimeType/width/height persisted alongside blob (S4); deletePhoto/deletePhotos — remove by ID, no-op for missing ID, multiple IDs, empty array no-op (S5); getAllStoredPhotoIds — returns all keys; empty store → [] (S6); createPhotoObjectUrl/revokePhotoObjectUrl — non-empty URL, unique per call, revoke no-op for unknown URL, URL removed from pool (S7); getPhotoBlob returns null on IndexedDB unavailable — no uncaught exception (S8) |

## Where fixtures are stored

| Fixture | Location | Notes |
|---------|----------|-------|
| Excel in-memory workbooks | Inline in `importGear.test.mjs` via `xlsx.utils.aoa_to_sheet` | No files on disk |
| Real Excel workbook | `attached_assets/PACK_WEIGHT_&_MEAL_PLANNER_CHECKLIST_1785883024547.xlsx` | Read from disk; tests skip gracefully if missing |
| PDF page-text fixture | Inline string in `importGear.pdf.test.mjs` | Simulates `pdf-parse` v2 output for a real TrailWeigh export |
| Deduplication fixture | Inline JS object in `usePackData.test.mjs` | Mirrors a stored v5 checklist with all three duplicate pairs |
| Move-item fixture | Inline JS object in `moveItem.test.mjs` | Four-category store (Backpack, Clothing Packed, Kitchen Gear, Cook Set) |
| Pie-color fixture | Inline JS objects in `pieColor.test.mjs` | LockerEntry builders using inlined save/load helpers |

## Framework

Node.js built-in runner — no additional test dependencies.
All suites use the same `assert` / `assertEqual` helpers and exit with code 1 on failure.
