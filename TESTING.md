# Importer regression tests

## Running the tests

```sh
pnpm test:importer
```

This runs all **sixteen** test suites in sequence and exits non-zero on any failure.

Individual suites (in execution order):

```sh
node artifacts/api-server/src/routes/importGear.test.mjs            # Excel extraction + classification
node artifacts/api-server/src/routes/importGear.pdf.test.mjs        # PDF parser fixture (pure logic)
node artifacts/api-server/src/routes/importGear.pdf.api.test.mjs    # PDF API integration (pdf-parse v2 + real fixtures)
node artifacts/api-server/src/routes/scanGear.test.mjs              # Image format rejection
node artifacts/pack-checklist/src/lib/categoryAliases.test.mjs      # Shared category resolver
node artifacts/pack-checklist/src/hooks/usePackData.test.mjs        # Duplicate-category migration
node artifacts/pack-checklist/src/hooks/moveItem.test.mjs           # Move-item Store transformation
node artifacts/pack-checklist/src/hooks/pieColor.test.mjs           # Per-file palette persistence
node artifacts/pack-checklist/src/hooks/bgCollections.test.mjs      # Photo collections data layer (updated Prompt 016A)
node artifacts/pack-checklist/src/hooks/bgCollections016A.test.mjs  # Theme dropdown 016A requirements
node artifacts/pack-checklist/src/hooks/bgPhotoStore016B.test.mjs   # IndexedDB photo store (Prompt 016B)
node artifacts/pack-checklist/src/hooks/controls017.test.mjs        # Control reorganisation (Prompt 017)
node artifacts/pack-checklist/src/hooks/landscapeHover017B.test.mjs # Landscape thumbnail hover stability (Prompt 017B)
node artifacts/pack-checklist/src/hooks/landscapeActiveBackground017C.test.mjs # Active-background shaking fix (Prompt 017C)
node artifacts/pack-checklist/src/hooks/landscapeShake017D.test.mjs            # Landscape shaking root cause — compositing cascade fix (Prompt 017D)
node artifacts/pack-checklist/src/hooks/landscapeShake017E.test.mjs            # Image geometry stability — permanent box-shadow root cause (Prompt 017E)
```

**No build step required.** Each file inlines the relevant production functions in
plain JS so tests can run against source changes immediately.

**Current result:** 1041 passed / 0 failed (017E/017F/018C/019 USER-TESTED PASS; 020/020A/020B: New blank+Clear+Light + first-open appearance restoration implemented — 2026-08-07).

## What each suite protects

| Suite | Behaviours protected |
|-------|---------------------|
| `importGear.test.mjs` | Excel extraction (section headers, TRUE/FALSE rows, column detection, Meal Planner skip); consumables routing; wearable-clothing routing; shelter/sleep routing; Bug Net → Clothing Packed; Fuel → Consumables, no warning; real-file regression (69 items, bug net, fuel) |
| `importGear.pdf.test.mjs` | TrailWeigh PDF parser: category headers, checkbox rows, greedy regex (model numbers not parsed as weights), numeric-leading types (1 Gal Freezer Bag), Fuel description vs. weight, Fuel → Expendables override, summary-row skipping, forward-only category guard, Meal Planner hard stop |
| `importGear.pdf.api.test.mjs` | PDF API integration (Prompt 016C): pdf-parse v2 loads correctly, PDFParse class + getText() + destroy() all present; real fixture PDF parses to structured result; gear items extracted with correct destination (Backpack, Shelter, Sleep, Clothing Packed, Kitchen, Expendables); image-only PDF yields empty text; corrupt PDF throws fast (no server hang); multipage fixture processed; timeout+destroy wrapper verified; error classification (timeout/password/generic); frontend non-JSON response handler; empty response body safety |
| `scanGear.test.mjs` | Image uploads (.png .jpg .jpeg .webp) rejected by /api/import-gear with a clear error; type="image" rejected by /api/scan-gear with code "unsupported_type" |
| `categoryAliases.test.mjs` | resolveDestination: Shelter/SHELTER/" shelter " → Shelter System; Sleep → Sleep System; Kitchen/Kitchen System → Kitchen Gear; Consumables → Expendables; Clothing Packed ≠ Clothing Worn; unknown category returned as-is (never silently becomes Backpack) |
| `usePackData.test.mjs` | deduplicateCategoryAliases: items merge into preferred (user-named) tab, existing items kept first, source tabs removed from order/items/meta, full item objects preserved (id/sub/desc/weightOz/qty/checked/expendable), idempotent on repeated runs; mergeDefaultCategories: skips DEFAULT names when an alias already exists |
| `moveItem.test.mjs` | applyMoveItem Store transformation: item removed from source and appended to destination (M1); all GearItem fields preserved across move — id, sub, desc, weightOz, qty, checked, expendable (M2); same-category move returns identical store reference — no mutation (M3); invalid inputs (unknown source, unknown destination, unknown item ID) leave store unchanged (M4); undo/redo via inverse operations — move+undo restores original state, no item duplication (M5); no duplicate item IDs after single or sequential moves (M6); custom category names preserved exactly (M7); store.order and store.meta untouched by item moves (M8); existing destination items not displaced — moved item appended; move into empty category works (M9) |
| `pieColor.test.mjs` | Per-file Weight Distribution palette persistence: chartPaletteKey serialized in LockerEntry (P1); in-place open, new-tab stash, and newseed bundle each restore the correct palette key (P2); File A and File B retain independent palette keys across all save/load operations (P3); commitSaveReplace updates only the active file (P4); Save As copies palette key into a new entry and leaves the original unchanged (P5, P6); New/newseed bundle carries current palette key to the forked tab (P7); refresh/session-stash restores active file's palette key; empty or null stash falls back to default (P8); older files without chartPaletteKey load safely with default palette (P9); saving an older file adds chartPaletteKey (P10); restored palette key is not overwritten by default init (P11); unknown or missing chartPaletteKey values do not crash loading (P12); gear data is byte-identical through the save-and-load round trip (P13) |
| `bgCollections.test.mjs` | Photo collections data layer (updated Prompt 016A): constants including MAX_COLLECTIONS=10 (P1); runMigration — null/empty no-op, fresh migration creates "My Photos", merges into existing, idempotent, My Photos first (P2); createCollection — trimmed name, blank blocked, **duplicate names now blocked** (Prompt 016A change), case-sensitive, appended last (P3); renameCollection — success, blank blocked, duplicate blocked, same-name allowed, others unaffected, **preserves photos** (P4); deleteCollection — by ID, nonexistent no-op, last → empty, **re-enables Add Theme** (P5); addPhotoToCollection — success, bad ID, MAX_PHOTOS_PER_COLLECTION enforced, appended, others unaffected (P6); deletePhotoFromCollection — success, others safe, nonexistent no-op, other collections safe (P7) |
| `bgCollections016A.test.mjs` | Prompt 016A theme dropdown data requirements: dropdown structure — Landscapes separate from custom, Add Theme gated on count, MAX_COLLECTIONS enforced, Landscapes not counted (A1); theme name save — valid creates collection, label format "Theme [Name]", blank rejected, duplicate rejected (A2); theme count limits — MAX_COLLECTIONS=10, Landscapes excluded, delete re-enables Add Theme (A3); photos per theme — MAX=10 enforced, add increases count, remove decreases count, order preserved (A4); migration — existing 016 collections preserved, idempotent (A5); rename preserves photos and order (A6); delete removes only the target theme (A7); JSON round-trip preserves all data — updated 016B: no dataUrl in photo records (A8) |
| `bgPhotoStore016B.test.mjs` | IndexedDB photo store (Prompt 016B): validateImageFile — JPEG/PNG/WebP/GIF accepted, TIFF/SVG rejected, >25 MB rejected, 25 MB boundary accepted (S1); dataUrlToBlob — JPEG and PNG data URLs decoded to Blob, malformed → null, correct MIME extracted (S2); isMigrationDone/markMigrationDone — absent flag false, set flag true, writes "1" to localStorage (S3); storePhoto/getPhotoBlob — store-and-retrieve, miss returns null, overwrite, mimeType/width/height persisted alongside blob (S4); deletePhoto/deletePhotos — remove by ID, no-op for missing ID, multiple IDs, empty array no-op (S5); getAllStoredPhotoIds — returns all keys; empty store → [] (S6); createPhotoObjectUrl/revokePhotoObjectUrl — non-empty URL, unique per call, revoke no-op for unknown URL, URL removed from pool (S7); getPhotoBlob returns null on IndexedDB unavailable — no uncaught exception (S8) |
| `controls017.test.mjs` | Control reorganisation (Prompt 017 + 017A): Showcase pill removed from BackgroundPicker panel (C1); Hide pill rendered unconditionally — no {background &&} wrapper (C4); Hide calls triggerShowcase — existing handler, no new state (C3); exactly one setShowPreview(true) in Checklist (C5); sidebar Preview removed (C6); UnitToggle follows Preview (C7); lg:grid-cols-[1fr_365px] preserved (C9); translate-x-3 preserved (C10); aria-labels on Hide and Preview (C17, C18); source order Hide→Preview→UnitToggle (C19) |
| `landscapeHover017B.test.mjs` | Landscape thumbnail hover stability (Prompt 017B): ring-2 always present in base state (L1); no hover:scale-* (L2); hover does not change ring-width — only color (L3); transition-all not used (L4); same ring-width for selected and unselected (L5); decorative label overlay has pointer-events-none (L6); selected checkmark has pointer-events-none (L7); onClick still selects background (L8); all built-in PRESETS present (L9); built-ins non-deletable (L10); custom thumbnails unchanged (L11); Hide unconditional — 017A preserved (L12); Preview wired (L13); UnitToggle present (L14); Undo/Redo wired (L15); bgPhotoStore imports preserved (L16); PDF timeout guard preserved (L17); grid 365px (L19); translate-x-3 (L20); ring-transparent in base state (L21); no transition-all and no box-shadow transition (L22 updated 017C) |
| `landscapeActiveBackground017C.test.mjs` | Active-background shaking fix (Prompt 017C): no box-shadow transition on tile button — root cause removed (C1); no transition-all (C2); ring geometry frozen — 017B preserved (C3); no hover:ring-2 (C4); no hover:ring-offset-1 (C5); no hover:scale-* (C6); ring-transparent in base state (C7); no onMouseEnter on tile buttons (C8); no onMouseLeave (C9); no onPointerEnter (C10); no onPointerLeave (C11); label overlay has pointer-events-none (C12); no onMouseEnter on main container (C13); bgImageUrl derived from state only — no hover leak (C14); object URL not recreated on hover (C15); background inline style from state only (C16); useInactivityTimer no React state on mousemove (C17); BackgroundShowcase always mounted (C18); panel has willChange:transform — GPU layer isolation (C19); willChange:transform only on panel not main container (C20); panel willChange value is "transform" (C21); panel has z-50 — stacking preserved (C22); 017E: ring-2+ring-offset-1 conditional (C23); 017A Hide unconditional (C24) |
| `landscapeShake017D.test.mjs` | Compositing cascade fix (Prompt 017D): no transition-opacity inside overflow-hidden landscape button (D1–D6); structural comparison — group placement and overflow-hidden (D7–D10); image loading — remote URL, decoding attribute, blob vs remote (D11–D14); preserved UX — label still appears on hover (D15–D18); regression guards — 017A/017B/017C + 017E-updated ring guards (D19–D22); custom tile comparison — transition-opacity outside overflow-hidden (D23–D26) |
| `landscapeShake017E.test.mjs` | Image geometry stability — permanent box-shadow root cause (Prompt 017E): no unconditional ring-2+ring-offset-1 at rest (E1–E6); conditional ring pattern in active and hover branches (E7–E10); image geometry setup unchanged — w-full h-full object-cover, getThumbUrl fixed dimensions, no JS inline style (E11–E14); custom tile structural comparison confirms fix matches no-shake pattern (E15–E18); visual UX preserved — ring on hover/active, label on hover, checkmark (E19–E22); prior fixes in place — decoding=async, no transition-opacity, no transition-all, willChange:transform (E23–E26); regression guards — no hover event handlers, pointer-events-none, Hide unconditional (E27–E30) |

## Where fixtures are stored

| Fixture | Location | Notes |
|---------|----------|-------|
| Excel in-memory workbooks | Inline in `importGear.test.mjs` via `xlsx.utils.aoa_to_sheet` | No files on disk |
| Real Excel workbook | `attached_assets/PACK_WEIGHT_&_MEAL_PLANNER_CHECKLIST_1785883024547.xlsx` | Read from disk; tests skip gracefully if missing |
| PDF page-text fixture | Inline string in `importGear.pdf.test.mjs` | Simulates `pdf-parse` v2 output for a real TrailWeigh export |
| **Real gear-list PDF fixture** | `attached_assets/trailweigh_gear_list_fixture.pdf` | **Added Prompt 016C** — valid PDF binary parsed by actual pdf-parse v2; 15 items across 7 categories |
| **Image-only PDF fixture** | `attached_assets/trailweigh_image_only_fixture.pdf` | **Added Prompt 016C** — valid PDF with no text content; tests no-readable-text path |
| **Corrupt PDF fixture** | `attached_assets/trailweigh_corrupt_fixture.pdf` | **Added Prompt 016C** — invalid PDF bytes; tests fast-fail error path |
| Deduplication fixture | Inline JS object in `usePackData.test.mjs` | Mirrors a stored v5 checklist with all three duplicate pairs |
| Move-item fixture | Inline JS object in `moveItem.test.mjs` | Four-category store (Backpack, Clothing Packed, Kitchen Gear, Cook Set) |
| Pie-color fixture | Inline JS objects in `pieColor.test.mjs` | LockerEntry builders using inlined save/load helpers |

## Framework

Node.js built-in runner — no additional test dependencies.
All suites use the same `assert` / `assertEqual` helpers and exit with code 1 on failure.
