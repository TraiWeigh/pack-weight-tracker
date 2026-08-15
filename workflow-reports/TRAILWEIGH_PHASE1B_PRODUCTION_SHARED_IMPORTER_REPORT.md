# TrailWeigh Phase 1B — Production-Shared + Importers + Coverage Gaps
## Final Test Report

**Date:** 2026-08-15  
**Agent:** Replit Agent (main)  
**Playwright version:** 1.62.1 (Chromium only, workers=1, foreground)  
**App source modified:** NO — `git diff --name-only -- artifacts/` returned empty  
**Phase 1A suite intact:** YES — smoke + core tests untouched

---

## §1 — Suite Summary

| Chunk | Spec files | Tests | Pass | Fail | Time |
|-------|-----------|-------|------|------|------|
| A | production-shared-items, review-mocked | 19 | 19 | 0 | 43s |
| B | move, reorder, print | 17 | 17 | 0 | 50s |
| C | keyboard-tooltips | 13 | 13 | 0 | 32s |
| D | importer-csv, importer-pdf, importer-docx, importer-errors | 40 | 40 | 0 | 4s |
| E | network-errors, coverage-gaps | 17 | 17 | 0 | 26s |
| **TOTAL** | **10 spec files** | **106** | **106** | **0** | **2m 21s** |

Full-suite confirmation run: `pnpm exec playwright test tests/e2e/phase1b/ --workers=1` → **106 passed (2m 21s)**

---

## §2 — Test Files Created

| File | Tests | Classification |
|------|-------|----------------|
| `tests/e2e/phase1b/production-shared-items.spec.ts` | 8 | A — V3 sandbox weight/calc |
| `tests/e2e/phase1b/review-mocked.spec.ts` | 11 | D/F — production ReviewPage, mocked API |
| `tests/e2e/phase1b/move.spec.ts` | 8 | A — V3 sandbox item move |
| `tests/e2e/phase1b/reorder.spec.ts` | 4 | A — feasibility + BLOCKED verdict |
| `tests/e2e/phase1b/print.spec.ts` | 5 | A — V3 sandbox print via More menu |
| `tests/e2e/phase1b/keyboard-tooltips.spec.ts` | 13 | A — keyboard + a11y |
| `tests/e2e/phase1b/importer-csv.spec.ts` | 15 | E — API-level CSV |
| `tests/e2e/phase1b/importer-pdf.spec.ts` | 10 | E — API-level PDF |
| `tests/e2e/phase1b/importer-docx.spec.ts` | 6 | E — API-level DOCX |
| `tests/e2e/phase1b/importer-errors.spec.ts` | 9 | E — API-level error cases |
| `tests/e2e/phase1b/network-errors.spec.ts` | 11 | D/E — Review network errors + importer injection |
| `tests/e2e/phase1b/coverage-gaps.spec.ts` | 6 | Mixed — classification + spot checks |

### Fixtures created

| File | Purpose |
|------|---------|
| `tests/e2e/fixtures/simple-valid.csv` | Baseline CSV with 5 items |
| `tests/e2e/fixtures/empty.csv` | Zero-byte edge case |
| `tests/e2e/fixtures/malformed.csv` | No recognizable gear headers |
| `tests/e2e/fixtures/unicode.csv` | Non-ASCII item names (ñ, é, 充電バンク) |

---

## §3 — Architectural Findings (non-defects)

### F-001 · CSV parser stores item name in `sub`, not `desc`
**Impact:** Test design  
**Detail:** `POST /api/import-gear` with a CSV file returns `ExtractedItem` objects where the item name lives in `sub` (subtype/type) and the freeform description lives in `desc`. Initial test assertions on `item.desc` were corrected to check `item.sub || item.desc`. No app defect — this is the documented `ExtractedItem` schema.

### F-002 · ReviewPage Welcome modal is the correct "ready" signal
**Impact:** Test design  
**Detail:** `ChecklistContent` renders immediately when `setStatus('ready')` fires, but the Welcome modal ("Start Exploring" button) overlays the page. Playwright's `toBeVisible()` found `LIST SUMMARY` hidden behind the modal in some viewport/scroll positions. The correct readiness pattern is: wait for `getByRole('button', { name: 'Start Exploring' })` → click it → then assert content. All review-mocked and network-error tests updated to this pattern.

### F-003 · GearCategory toggle is a `<div onClick>`, not a `<button>`
**Impact:** Test design  
**Detail:** Category accordion headers in `ChecklistContent` / `GearCategory.tsx` use a styled `<div onClick>` not a semantic `<button>`. `getByRole('button', { name: /Shelter/i })` returns 0 elements. Correct selector is `getByText('Shelter').first()`. Category toggle in V3 sandbox (`MobileFunctionalV3`) uses real `<button>` elements — selector strategy differs between the two components.

### F-004 · Print header button is inside MobileChecklist overlay
**Impact:** Test design  
**Detail:** The `aria-label="Print checklist"` button lives inside the `MobileChecklist` component, which is only mounted when the user has switched to checklist mode. It is NOT accessible from the default demo view. The More-menu `aria-label="Print"` button calls the same `handlePrint` handler and IS accessible from the default view. All print tests updated to use the More-menu path.

### F-005 · mergeDefaultCategories runs on Review page data
**Impact:** Observation  
**Detail:** When a reviewer visits a shared link whose mock store contains only `["Shelter", "Sleep System"]`, ChecklistContent's `parseV5` + `mergeDefaultCategories` adds all default TrailWeigh categories (Backpack, Kitchen, Electronics, etc.) at load time. The mock items for `Shelter` are correctly merged into the expanded category set. `Sleep System` items are also present in the rendered list (visible further down). This is intentional behavior per the `parseV5` forward-migration note in memory.

### F-006 · Review page CASE B: `lockerKey` is the safe marker target
**Impact:** Test design  
**Detail:** `usePackData` autosaves to `packKey` on every React commit, stripping non-standard fields. Any `__marker__` field added to `packKey` is stripped before the reload assertion can check it. The `lockerKey` (`trailweigh:review:{token}:locker`) is only written by `seedFromLiveFiles` — CASE B (same sourceVersion) skips `seedFromLiveFiles`, so a marker appended to `lockerKey` survives the reload and correctly verifies CASE B behavior.

---

## §4 — Defects Found

**No new application defects identified.** All 106 tests passed after test-code calibration. All prior Phase 1A defects (TW-P1-001/002/003) remain as previously classified.

---

## §5 — BLOCKED / NEEDS_AUTH areas

| Area | Classification | Reason |
|------|---------------|--------|
| Create New List / Save to Locker | NEEDS_AUTH | Requires signed-in user; owner-only Clerk-gated flow |
| Edit View (existing save) | NEEDS_AUTH | Owner Locker API requires userId |
| Track Weight (trail screen) | NEEDS_AUTH | Owner-only; requires saved items in authenticated Locker |
| Background Picker (live selection) | NEEDS_AUTH | Save-to-background requires owner account |
| Cross-device sync | NEEDS_AUTH | Requires two authenticated sessions |
| Real production share link | NEEDS_AUTH | Would require real owner account and real Locker data |
| Review: authenticated owner sharing flow | NEEDS_AUTH | Creating a share link requires userId |
| Visual regression (screenshot diff) | DEFERRED | Per Phase 1B standing rules — follow-up phase |

---

## §6 — Coverage by Area

### Production-shared / Review page (mocked)
- ✅ Live-locker mock returns and renders (6 tests)
- ✅ Welcome modal appears and can be dismissed
- ✅ CASE B (same sourceVersion) preserves reviewer localStorage
- ✅ Owner Locker API not called in isGuest mode
- ✅ No userId/ownerId exposed in rendered HTML
- ✅ 404, 500, invalid token, slow response, aborted request — all handled gracefully
- ✅ HTTP 400, 401, 403, 404, 429, 500 error codes — all show error state, no crash

### Item move
- ✅ Move select rendered inside item detail
- ✅ Placeholder option "Move to…" present
- ✅ Options include all other category names
- ✅ Item disappears from source category after move
- ✅ Item appears in destination category after move
- ✅ Total item count unchanged (no duplication / deletion)
- ✅ Move back to original category works
- ✅ No-op selection (placeholder) does not duplicate

### Category reorder
- ✅ Drag handle present for each category (`aria-label="Drag to reorder {name} category"`)
- ✅ Drag handle has accessible label and `title` attribute
- ✅ Drag handle receives keyboard focus
- ⚠️ Pointer-based drag NOT automated — verdict: BLOCKED (no keyboard alternative; pointer events unreliable in headless)

### Print
- ✅ Print entry exists in More menu
- ✅ More menu Print calls `window.print()` (stubbed × 2)
- ✅ Print does not navigate away or corrupt list state
- ✅ Print does not raise JS errors
- ⚠️ Header Print button (`aria-label="Print checklist"`) — inside MobileChecklist overlay only; tested via More menu path

### Keyboard / accessibility
- ✅ Category open/close reachable via Tab
- ✅ Enter and Space open category accordion
- ✅ Item expand-details button focusable via keyboard
- ✅ Enter opens item detail panel
- ✅ Escape cancels Add Category input
- ✅ Enter confirms Add Category input
- ✅ Checkbox togglable via Space key
- ✅ Print, drag-handle, Add Item buttons all have accessible labels
- ✅ Tab order does not trap in basic category workflow
- ✅ Item checkbox has accessible name

### CSV importer (API-level)
- ✅ Simple CSV → 200, items array, no NaN weightOz
- ✅ Consumable item routed to correct destination
- ✅ Lighterpack-style CSV → items with non-empty name (sub/desc)
- ✅ Metagear-style CSV → items; worn item → Clothing Worn
- ✅ Edge-case CSV: duplicates, blank weights — no crash
- ✅ Description-as-name-fallback: name in sub or desc
- ✅ Unicode names (ñ, é, Japanese) survive parsing in `sub`
- ✅ Empty CSV → non-200 or empty items
- ✅ Malformed CSV → 400/422 JSON
- ✅ Zero-byte file → non-200 error
- ✅ Missing file field → 400 JSON

### PDF importer (API-level)
- ✅ 77-item PDF → exactly 77 items (regression guard)
- ✅ 77-item PDF: no NaN weightOz
- ✅ 77-item PDF: no duplicate rows (sub|desc|weightOz composite key)
- ✅ 77-item PDF: all items have non-empty name (sub or desc)
- ✅ 77-item PDF: Backpack items present
- ✅ 77-item PDF: row count matches ground-truth CSV (77)
- ✅ 024K test PDF → no crash
- ✅ Gear-list fixture PDF → returns items
- ✅ Image-only PDF → 422 with `code:image_only_pdf`
- ✅ Corrupt PDF → 4xx, no server crash

### DOCX importer (API-level)
- ✅ Document-style DOCX → 200, no NaN weightOz, items have non-empty desc
- ✅ Plain-bold-headings DOCX (12 items) → 200, no duplicates
- ✅ Bullet-list DOCX (12 items) → 200

### Importer errors
- ✅ Empty file → non-200 JSON error
- ✅ Corrupt PDF → 4xx JSON, no 500
- ✅ Image-only PDF → 422 informative error
- ✅ Non-gear PDF → handled response, no crash
- ✅ Malformed CSV → 400/422 JSON
- ✅ Plain-text file as PDF → handled error, no 500
- ✅ Unsupported extension → 400 JSON
- ✅ Missing file field → 400 JSON

### Network error injection
- ✅ Import API 500 during upload → safe error state
- ✅ Import API 400 during upload → safe error state

### Coverage-gap classification
- ✅ Create New List disabled in V3 sandbox (classification confirmed)
- ✅ KIS mode absent from codebase (classification confirmed)
- ✅ Light mode renders without broken CSS
- ✅ Static theme asset "share-default" resolves with 200
- ✅ Be Creative / Guided List documented as NEEDS_AUTH
- ✅ Review page: no owner userId in HTML after mock 200 load

### Weight calculation
- ✅ DEMO_SEED totals render without NaN / Infinity / undefined
- ✅ Category-level weight displayed when items selected
- ✅ Imperial → metric conversion changes displayed weights (non-NaN)
- ✅ Repeated imperial↔metric round-trip does not drift
- ✅ qty > 1 multiplies weight in totals
- ✅ Checkbox state is independent between items
- ✅ Decimal weights render without truncation
- ✅ Category rename preserves total weight accuracy

---

## §7 — Test Calibration Notes (not defects)

These behaviors were discovered during test authoring and reflect accurate app behavior:

1. **CSV `sub` vs `desc`**: item name → `sub`, description text → `desc`. Tests updated to check `sub || desc`.
2. **Review Welcome modal as readiness signal**: Welcome modal (`Start Exploring`) is the authoritative indicator that `ChecklistContent` has mounted and data is seeded. Using it avoids visibility/scroll issues with `LIST SUMMARY` on first render.
3. **GearCategory header is `<div>`**: Accordion toggle is `div[onClick]`, not `<button>`. Use `getByText()` not `getByRole('button')` for category name assertions in ChecklistContent.
4. **Print button location**: More-menu Print button is the universally accessible print trigger; header Print button is inside MobileChecklist overlay (only mounted in checklist mode).
5. **CASE B marker must use `lockerKey`**: `usePackData` autosave overwrites `packKey`, stripping non-standard fields. `lockerKey` is safe for CASE B marker testing.

---

## §8 — Phase 1 + 1B Combined Totals

| Phase | Tests | Pass | Fail |
|-------|-------|------|------|
| Phase 1 (core) | 71 | 68 | 3 (reclassified: TW-P1-001 intentional; TW-P1-002/003 sandbox-only) |
| Phase 1B (this run) | 106 | 106 | 0 |
| **Combined** | **177** | **174** | **3 (intentional / sandbox)** |

---

## §9 — Next Step Recommendation

**Visual regression testing** is the natural follow-up. With 177 tests now providing behavioral coverage across the core checklist, importer pipeline, Review page, and error states, visual snapshot diffing can add a complementary layer without duplicating logic tests. This requires setting up a baseline screenshot library (Playwright `toHaveScreenshot`) and falls outside Phase 1B scope per standing rules.

**Recommended next phase:** Visual Regression — establish baseline screenshots for V3 sandbox, Review page, and error states, then diff on subsequent runs.

---

*Report generated: 2026-08-15 · Replit Agent (main) · Phase 1B complete*
