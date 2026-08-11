# Prompt 024Q — Rename the Visible Description Column to Name

**Prompt:** 024Q  
**Status:** COMPLETE — awaiting user verification  
**Mode:** Economy (Build)  
**Date:** 2026-08-11

---

## Actions Taken

### Phase 1 — Report stub
Created `workflow-reports/PROMPT_024Q_REPORT.md` before touching application code. Verified file existed on disk.

### Phase 2 — Identified every user-facing "Description" label

Grepped the entire `artifacts/pack-checklist/src` tree for `DESCRIPTION`, `Description`, and `placeholder.*[Dd]escription`. Locations found:

| File | Line | Context |
|------|------|---------|
| `components/GearCategory.tsx` | 300 | `placeholder="Description"` on the editable column header |
| `components/GearRow.tsx` | 79, 84 | Comment + `'Item description'` placeholder for the name input |
| `components/PrintLayout.tsx` | 75 | `descLabel \|\| 'Description'` fallback in print column headers |
| `components/PreviewModal.tsx` | 130 | `descLabel \|\| 'Description'` fallback in Scan Gear List preview |
| `components/ImportGearPanel.tsx` | 65 | Validation error text `'Type or Description is required'` |
| `components/ImportGearPanel.tsx` | 303 | Subtitle `'Upload a file to import Type, Description, and Weight.'` |
| `components/ImportGearPanel.tsx` | 393 | Preview-table column header span `Description` |
| `components/ImportGearPanel.tsx` | 459, 466 | Comment + `placeholder="Description"` on name input in preview rows |
| `lib/exportPDF.ts` | 101 | `descLabel \|\| 'Description'` fallback for PDF column header |

`components/ui/item.tsx` — `ItemDescription` is a generic shadcn-UI compound component; not the item identity field; not changed.  
`components/gearGrid.ts` — contains only developer comments; not changed.

### Phase 3 — Changes made (user-facing labels only)

**All changes are label/text changes only. No data migration. No schema change. The internal property names `desc` and `descLabel` are unchanged throughout.**

1. **`GearCategory.tsx`** — `placeholder="Description"` → `placeholder="Name"` (editable column heading placeholder shown when no custom label is set)
2. **`GearRow.tsx`** — fallback placeholder `'Item description'` → `'Item name'`; developer comment updated to `Col 3 — Name`
3. **`PrintLayout.tsx`** — `descLabel || 'Description'` → `descLabel || 'Name'`
4. **`PreviewModal.tsx`** — `descLabel || 'Description'` → `descLabel || 'Name'` (Scan Gear List preview column header)
5. **`ImportGearPanel.tsx`**:
   - Validation error: `'Type or Description is required'` → `'Type or Name is required'`
   - Subtitle text: `'Upload a file to import Type, Description, and Weight.'` → `'Upload a file to import Type, Name, and Weight.'`
   - Preview-table column header: `Description` → `Name`
   - Developer comment: `{/* Description */}` → `{/* Name */}`
   - Input placeholder: `placeholder="Description"` → `placeholder="Name"`
6. **`lib/exportPDF.ts`** — `descLabel || 'Description'` → `descLabel || 'Name'` (PDF print column header)

### Phase 4 — Semantic cleanup (status text as Name)

Reviewed `importGear.ts`. The `desc` field in `parseCsvItems` is populated from the `DESC_RE` column group (headers: `description/notes/details/name/item/gear`). Status/worn text lives in the `wornRaw` / `subcatRaw` paths only and is never assigned to `desc`. The prompt's concern (e.g. "Worn while hiking" appearing as the Name) cannot arise from the current parser. No change needed in `importGear.ts` for this prompt.

Header aliases already present for Name: `name`, `item name`, `item`, `gear`, `description`, `notes`, `details`. Headers `product`, `product name`, `model`, `item model` are not yet in the alias table — but adding them was explicitly scoped out of this prompt to avoid risking 024O behavior. Ambiguity documented here per prompt instructions.

---

## Internal field name

The internal data property remains **`desc`** (item) and **`descLabel`** (category metadata). Only the user-visible labels were changed. No database or schema migration was performed or is needed.

---

## Status text / Name guard

Status-derived text (`Worn while hiking`, `Pair weight`, `Consumable`, `TRUE`, etc.) is never placed into the `desc` / Name field by the importer. Verified by code inspection of `parseCsvItems` and `extractGenericMode`. No additional guard was needed.

---

## Regression results — 024O and 024P

| # | Check | Expected | Actual | Pass |
|---|-------|----------|--------|------|
| 1 | Test 01 item count | 9 | 9 | ✓ |
| 2 | Smartwater Bottle qty | 2 | 2 | ✓ |
| 3 | Fuel Canister → Consumables | ✓ | ✓ | ✓ |
| 4 | Hiking Shirt → Clothing Worn | ✓ | ✓ | ✓ |
| 5 | Test 02 item count | 7 | 7 | ✓ |
| 6 | Water qty | 2 | 2 | ✓ |
| 7 | Dog Food qty | 3 | 3 | ✓ |
| 8 | Trail Runners → Clothing Worn | ✓ | ✓ | ✓ |
| 9 | Test 05 item count | 12 | 12 | ✓ |
| 10 | Sun Hat → Clothing Worn (test 05) | ✓ | ✓ | ✓ |
| 11 | Test 06 item count | 10 | 10 | ✓ |
| 12 | Sun Hat → Clothing Worn (test 06) | ✓ | ✓ | ✓ |
| 13 | Fuel qty (test 06) | 2 | 2 | ✓ |
| 14 | Socks qty | 2 | 2 | ✓ |
| 15 | 77-item CSV regression | 77 | 77 | ✓ |
| 16 | 77-item PDF regression | 77 | 77 | ✓ |

All 16 checks pass. 024P worn routing fully preserved.

---

## Changed-file summary

| File | Change |
|------|--------|
| `artifacts/pack-checklist/src/components/GearCategory.tsx` | Column header placeholder `Description` → `Name` |
| `artifacts/pack-checklist/src/components/GearRow.tsx` | Fallback placeholder `Item description` → `Item name`; comment updated |
| `artifacts/pack-checklist/src/components/PrintLayout.tsx` | Fallback label `Description` → `Name` |
| `artifacts/pack-checklist/src/components/PreviewModal.tsx` | Fallback label `Description` → `Name` |
| `artifacts/pack-checklist/src/components/ImportGearPanel.tsx` | 5 label/text occurrences updated |
| `artifacts/pack-checklist/src/lib/exportPDF.ts` | PDF column header fallback `Description` → `Name` |

**Files NOT changed:** `importGear.ts`, PDF parser, DOCX parser, `GearCategory` routing logic, Locker, Share, Background, toolbar, footer, auth, themes, mobile artifact.

---

## Confirmation checklist

- [x] No database or schema migration performed
- [x] Internal field name remains `desc` / `descLabel`
- [x] Status text is not used as Name
- [x] PDF parsing not changed
- [x] DOCX parsing not changed
- [x] No unrelated changes made
- [x] Existing item values preserved (label-only rename)
- [x] Existing row layout preserved
- [x] Existing responsive behavior preserved
- [x] Existing edit/save/load/import behavior preserved

---

**User verification status: PENDING**
