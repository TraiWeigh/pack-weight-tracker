# TRAILWEIGH — PROMPT 024C REPORT
## Add CSV Support to the Existing "Scan Gear List" Importer

| Field | Value |
|---|---|
| Prompt number | 024C |
| Replit Agent mode used | Build (Economy-range; no Power-mode features used) |
| Time worked | ~10 minutes |
| Number of actions | 12 (2 subagent explorations, 4 reads, 4 edits, 2 shell tests) |
| Lines read | ~350 (ImportGearPanel.tsx, importGear.ts key sections) |
| Agent usage/cost | Economy-range |

---

## 1. Files Changed

| File | Change |
|---|---|
| `artifacts/api-server/src/routes/importGear.ts` | Added `expendable?` to `ExtractedItem`; added `CSV_COL_ALIASES`, `mapCsvHeader`, `parseCsvBool`, `parseCsvRows`, `parseCsvItems` functions; added `csv` branch in route handler; updated unsupported-type error message |
| `artifacts/pack-checklist/src/components/ImportGearPanel.tsx` | Added `.csv` to `ACCEPTED`; updated `ACCEPT_LABEL`; added `expendable?` to `ParsedItem`; updated `addSelected` to pass `expendable` to `onAddItem` |

No other files changed.

---

## 2. How CSV Files Are Detected and Parsed

**Detection:** The route handler checks `ext === 'csv'` (plus `mimetype === 'text/csv'` or `'application/csv'` as fallback). The frontend's `<input accept>` attribute now includes `.csv` so the OS file picker shows CSV files.

**Parsing pipeline:**
1. Buffer is decoded as UTF-8 text
2. `parseCsvRows()` — RFC 4180-compatible tokeniser: normalises CRLF/LF → LF, handles quoted fields with embedded commas and escaped quotes (`""`), skips blank rows
3. `parseCsvItems()` — maps the header row to field indices using `CSV_COL_ALIASES`, then iterates data rows, producing `ExtractedItem[]`
4. Each item is passed through `applyGearClassification()` (same as spreadsheet imports) so sub-type inference is consistent
5. Standard deduplication (existing pipeline) applied before response

CSV is **never** passed through OCR, Tesseract, image conversion, or `extractFromText`. It is parsed directly as structured data.

---

## 3. Recognised Heading Aliases

| TrailWeigh Field | Accepted Column Headings (case-insensitive) |
|---|---|
| Category / Destination | `Category`, `Section` |
| Description | `Description`, `Item`, `Gear` |
| Quantity | `Quantity`, `Qty` *(parsed; reserved for future qty propagation)* |
| Weight | `Weight` |
| Unit | `Unit` |
| Worn | `Worn` *(parsed; v1 does not alter checked state)* |
| Consumable / Expendable | `Consumable`, `Expendable` |

All column matching is case-insensitive (`h.toLowerCase().trim()`).

**Boolean values** accepted for Worn and Consumable/Expendable: `true`, `yes`, `1` → `true`; `false`, `no`, `0` → `false`; unrecognised values → default `false` (import not blocked).

---

## 4. Preview / Import Behaviour

CSV rows flow through the **identical preview/selection UI** as all other file types:

- Items arrive via the existing `data.items` JSON shape → `parsedToEdited()` → `EditedItem[]`
- The existing review table shows detected rows with editable fields (category, type, description, weight/unit)
- User selects/deselects items using existing checkboxes
- "Import Selected Items" uses the existing `addSelected()` action
- Categories not yet in the list are auto-created by the existing `Checklist.tsx` callback (`addCategory` + `addItem`)
- On successful import, the panel resets in exactly the same way as PDF/Excel imports

No silent import: the user always sees and confirms items before they are added.

---

## 5. Error Handling

| Condition | Response |
|---|---|
| No description column found | 422 + `"TrailWeigh could not identify an Item / Description / Gear column…"` |
| Empty CSV (0 rows) | 422 + `"The CSV file appears to be empty."` |
| Unexpected parse exception | 422 + message from caught error |
| Unsupported extension (unchanged) | 400 + message now includes "or CSV" |

Errors are shown inside the existing Scan Gear List error state — no stack traces exposed, no page crash.

---

## 6. Test CSV Structure Used

`workflow-reports/test-024C.csv` — 15 data rows covering:

| Test Case | Row |
|---|---|
| Category, Description, Weight, Unit, Worn, Consumable | Tent - 2P Ultralight (Shelter) |
| Quoted text containing a comma | `"Energy Bars, Assorted (3-day)"` |
| Blank optional weight + unit + worn + consumable | Blister Treatment (First Aid) |
| Consumable=yes / Expendable=true | Iodine Tablets, Extra Batteries |
| Category that must be auto-created in a blank list | New Gear Category (Headlamp, Extra Batteries) |
| Multiple categories: Shelter, Sleep System, Clothing, Food & Water, Navigation, First Aid, New Gear Category | ✓ |

---

## 7. Test / Build Results

### Functional tests (curl against live server)

| Check | Result |
|---|---|
| `.csv` accepted by Scan Gear List | ✓ PASS — 200 OK with 15 items |
| CSV parsed directly (not OCR) | ✓ PASS — no extractFromText path used |
| `Category`/`Section` → `destination` | ✓ PASS |
| `Description`/`Item`/`Gear` → `desc` | ✓ PASS |
| `Consumable`/`Expendable` → `expendable: true/false` | ✓ PASS (Iodine Tablets, Energy Bars, Extra Batteries → `true`) |
| Quoted comma `"Energy Bars, Assorted (3-day)"` parses correctly | ✓ PASS — desc = `"Energy Bars, Assorted (3-day)"` |
| Blank Weight/Unit → `weightOz: 0` (Blister Treatment) | ✓ PASS — item included, not blocked |
| New category `"New Gear Category"` preserved | ✓ PASS — destination = `"New Gear Category"` |
| No description column → 422 + clear message | ✓ PASS |
| Unsupported extension → 400 + updated message including CSV | ✓ PASS |

### TypeScript

| Package | Result |
|---|---|
| `@workspace/api-server` | PASS — zero errors in `importGear.ts`; pre-existing unrelated error in `locker.ts` unchanged |
| `@workspace/pack-checklist` | PASS — zero new errors |

### Runtime

| Check | Result |
|---|---|
| API server builds and starts | ✓ PASS — esbuild + node startup clean |
| Frontend HMR update | ✓ PASS — `ImportGearPanel.tsx` hot-updated without errors |
| All 4 workflows running | ✓ PASS |

---

## 8. Existing Non-CSV Import Behaviour Preserved

| Format | Status |
|---|---|
| PDF (text + TrailWeigh structured) | UNCHANGED — separate branch, no shared code modified |
| Word (.docx/.doc) | UNCHANGED |
| Excel (.xlsx/.xls) | UNCHANGED |
| Numbers (.numbers) | UNCHANGED |
| `extractFromText` fallback | UNCHANGED |
| `applyGearClassification` | UNCHANGED — reused for CSV items |
| Deduplication logic | UNCHANGED — applied after CSV parse |
| 200-item cap | UNCHANGED — `deduped.slice(0, 200)` applies to CSV too |

The only shared-pipeline changes are:
- `expendable?` added as optional field to `ExtractedItem` — all existing parsers return `undefined` for it, which defaults to `false` in `addSelected`. Zero behaviour change for non-CSV imports.
- `addSelected` now passes `expendable: it.expendable ?? false` — for non-CSV items this is always `false`, identical to the prior hardcoded absence.

---

## 9. Unrelated Changes Confirmation

No changes were made to:
- Prompt 024A/024B toolbar alignment (Checklist.tsx untouched)
- Background, Share, Locker, themes, authentication, footer
- Stripe, payments, AI credits
- Mobile app
- Any other component, hook, page, or utility outside the two listed files

---

## 10. User Verification Status

**PENDING** — user must test the live app:
1. Open Scan Gear List in the Edit View
2. Upload or drop `test-024C.csv` (or any CSV with Description/Item/Gear column)
3. Confirm rows appear in the preview table
4. Select items and click "Import Selected Items"
5. Verify categories (including "New Gear Category") are created and items appear in the list
6. Verify quoted-comma item name is intact
7. Confirm existing PDF/Excel import still works
