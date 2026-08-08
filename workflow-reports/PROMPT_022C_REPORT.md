# Prompt 022C — Reorganize and Simplify Help & How-To

**Date:** 2026-08-08  
**Status:** COMPLETE — all tests passing

---

## Files Changed

| File | Change |
|---|---|
| `src/pages/info/HelpPage.tsx` | Complete rewrite — 6-section workflow-order accordion (39,972 → 40,485 bytes after cross-link addition) |
| `src/hooks/help022B.test.mjs` | Updated 6 structural tests that became stale due to 022C reorganization |
| `src/hooks/help022C.test.mjs` | **NEW** — 68 regression tests for the 022C structure |
| `package.json` | Added `help022C.test.mjs` to `test:importer` chain |

**Application code not changed.** Checklist, weight calculations, undo/redo, save/locker, preview, print, share, backgrounds, showcase, file import, auth, and existing saved lists are all untouched.

---

## Pre-Change Inventory

### Share UI (verified from Checklist.tsx)

| Option | Label in UI | Behavior |
|---|---|---|
| Share Link | "Share Link" / "All your saved files" | Snapshots all saved Locker files; recipient sees view-only Shared Files panel; can browse all lists |
| Share Pack List | "Share Pack List" / "Copy link, read-only" | Current list only; link copied to clipboard; recipient can check items temporarily (React state only, never written to localStorage/DB); refreshing resets all changes |
| Download PDF | "Download PDF" | PDF export of current list |

Shared view (SharedChecklistPage): "Recipient changes update React state only — nothing is ever written to localStorage, IndexedDB, or the API."

### Background Controls (verified from BackgroundPicker.tsx)

| Control | Current Values |
|---|---|
| Background Themes | Landscapes (10 built-in Unsplash presets) + user-created custom theme collections |
| Add Photo | Yes — users can upload photos to custom themes via click or drag/drop |
| bgSize | 'cover' (Fill Screen) / 'contain' (Fit Image) |
| bgTone | 'light' / 'dark' |
| bgFade | slider 0–1 (Lighten/Darken overlay) |
| Showcase | `onShowcase` prop in BackgroundPicker; the Hide button enters this mode |

Note: 022B instructed not to document custom photo upload. 022C explicitly lists "Custom/Add Photo backgrounds" as a feature to document if present. The feature is present and is now documented.

---

## New Help Structure

```
1. Building Your Gear List                [sec-btn-building]
   A. Create / Upload
      - New button / starting fresh
      - Scan Gear List (PDF, Word, Excel, Numbers)
      - Import flow: review detected items → select → import
   B. Add / Organize
      - Add Item: Type, Description, Weight, Qty (1–20)
      - Item checkboxes: selecting gear for this trip
      - Unchecked items stay in list, contribute 0 weight
      - Move to… control
      - Categories: expand/collapse, rename, reorder, +Base/−Base, Add, Delete
   C. Trip-, Trail-, and Season-Specific Lists
      - PCT/AT/CDT/seasonal examples
      - Save As cross-reference

2. Understanding Your Pack Weight         [sec-btn-weight]
   A. Weight Totals
      - Base Weight (+ Base categories, checked items)
      - Non-base categories (consumables, worn clothing, dog pack)
      - Grand Total
      - Qty × weight = row total; unchecked = 0
   B. Weight Distribution
      - Chart by category, real-time update
   C. Pack Summary
      - Base Weight, non-base lines, Grand Total

3. Editing Your Gear List                 [sec-btn-editing]
   A. Undo / Redo (Ctrl+Z / ⌘Z, Ctrl+Y / ⌘Y)
   B. Open / Close Categories (Open/Close toolbar buttons + individual chevron)
   C. Imperial / Metric (display-only, data preserved)
   D. Reset (clears items, not categories; Confirm/Cancel)

4. Save / Locker                          [sec-btn-save]
   A. Save / Save As
      - Save: names list, saves, "Saved [name]" toast
      - Save As: copy under new name; original unchanged
      - Trip/variant use case explained
   B. Locker
      - Load (new browser tab), Rename, Delete (Yes/No; no password)

5. Preview / Print / Share                [sec-btn-share]
   A. Preview (formatted view, review before print)
   B. Print
      - Accessed from inside Preview
      - Physical packing checklist use case
      - Gathering gear, final check before trailhead
   C. Share
      - Share Link (all Locker files, view-only Shared Files panel)
      - Share Pack List (single list, checkable, temporary state)
      - Download PDF
      - Recipients can print from shared view

6. Backgrounds & Display                  [sec-btn-backgrounds]
   A. Background Themes (Landscapes preset + custom user themes)
   B. Add Your Own Photos (Add Photo, drag/drop, stored locally)
   C. Fit / Fill (Fit = entire image; Fill = crops to cover)
   D. Showcase / Hide (Hide button; click/key/mouse to return)
   E. Light / Dark Tone and Fade (overlay + slider 0–100%)

Cross-link footer: "Still stuck? Report a Problem"
```

---

## Sections Removed

| Section (022B) | Disposition in 022C |
|---|---|
| Getting Started | Merged into §1 Building — Create / Upload |
| Importing / Scan Gear List | Merged into §1 Building — Create / Upload (per prompt requirement) |
| Organizing Gear | Merged into §1 Building — Add / Organize |
| Select the gear you are using | Merged into §1 Building — Add / Organize |
| Editing History (Undo/Redo) | Now §3A under Editing Your Gear List |
| Saving & Locker | Renamed to §4 Save / Locker; same content |
| Sharing | Merged into §5 Preview / Print / Share |
| Pack Weight & Summaries | Reorganized into §2 Understanding Your Pack Weight |
| Frequently Asked Questions | Merged inline into relevant sections |
| Troubleshooting | Removed as standalone section; cross-link to Report a Problem added at bottom |

---

## Key Writing Decisions

**Share Pack List documented as checkable packing list:** The SharedChecklistPage confirms recipient checkbox state is stored in React state only — never written to localStorage, IndexedDB, or the API. Refreshing resets all changes. This matches the prompt's description of a checkable packing list where "Their checking or temporary session interaction must not modify the owner's saved original." Documented accurately.

**Share Link documents Shared Files panel:** Verified that Share Link snapshots all Locker files and the recipient sees a view-only "Shared Files" panel. The panel has no Rename or Delete controls (confirmed in SharedLockerPanel comment: "Controls for Rename (Pencil) and Delete (Trash) are intentionally absent.").

**Custom photo upload now documented:** 022B prompt said not to document this feature. 022C explicitly lists it as a feature to document if present. The feature is present (Add Photo button, drag/drop, processFiles() → IndexedDB storage). Documented accurately in §6B.

**Reset behavior:** `resetToDefaults()` in usePackData.ts clears items but preserves categories (iterates over `prev.order`, sets each category to `[]`). Documented correctly.

**Locker delete — no password:** 022B had a test checking for "password required" text. My 022C Note said "There is no password required to delete" — this string contains "password required" which tripped a false-positive in the test. Fixed the test to check for instructional claims ("A password is required", "requires a password") rather than any mention of the phrase.

---

## Verification Results

### §1: Structure and Order

| Check | Status |
|---|---|
| Main Help sections in required order | PASS |
| Building Your Gear List first | PASS |
| Understanding Your Pack Weight second | PASS |
| Editing Your Gear List third | PASS |
| Save / Locker fourth | PASS |
| Preview / Print / Share fifth | PASS |
| Backgrounds & Display last (sixth) | PASS |

### §2: Collapsible Sections

| Check | Status |
|---|---|
| Entire title row is clickable button | PASS — `<button>` spans full header row (`w-full`) |
| Disclosure chevron present | PASS — ChevronDown / ChevronUp from lucide-react |
| All sections collapsed by default | PASS — `useState<Set<string>>(new Set())` — empty set |
| Multiple sections can remain open simultaneously | PASS — Set<string> toggle; no auto-close logic |
| Keyboard: Enter / Space expand/collapse | PASS — standard HTML `<button>` handles both natively |
| Visible hover/focus state | PASS — `hover:bg-muted/40`, `focus-visible:ring-2 focus-visible:ring-primary` |
| ARIA semantics | PASS — `aria-expanded`, `aria-controls`, `role="region"`, `aria-labelledby` |
| No "Expand All" control | PASS — not present |

### §3: Building Your Gear List

| Check | Status |
|---|---|
| Contains Create / Upload subsection | PASS |
| Contains Add / Organize subsection | PASS |
| Scan Gear List under Create / Upload | PASS |
| Old standalone Importing / Scan Gear List removed | PASS |
| Supported file types: PDF, Word, Excel, Numbers | PASS |
| Import review → select → import flow | PASS |
| Checkbox / selecting gear under Add / Organize | PASS |
| Old standalone "Select the gear you are using" removed | PASS |
| Unchecked items stay in list, contribute 0 weight | PASS |
| Move control documented | PASS |
| Qty 1–20 documented | PASS |
| Trip / trail / season-specific guidance | PASS |
| PCT, AT, CDT examples | PASS |
| Save As cross-referenced for variants | PASS |

### §4: Understanding Your Pack Weight

| Check | Status |
|---|---|
| Base Weight defined | PASS |
| Non-base categories (consumables/worn) | PASS |
| Grand Total | PASS |
| Weight Distribution documented | PASS |
| Pack Summary documented | PASS |
| Plain-language terminology explanations | PASS |

### §5: Editing Your Gear List

| Check | Status |
|---|---|
| Undo with Ctrl+Z / ⌘Z | PASS |
| Redo with Ctrl+Y / ⌘Y | PASS |
| Open / Close categories | PASS |
| Imperial / Metric | PASS |
| Reset (clears items, not categories) | PASS |
| Reset: Confirm/Cancel confirmation | PASS |
| Reset placed last in group | PASS |

### §6: Save / Locker

| Check | Status |
|---|---|
| Save documented with "Saved [name]" toast | PASS |
| Save As for trip/trail variants | PASS |
| Locker load (new browser tab) | PASS |
| Locker rename | PASS |
| Locker delete with Yes/No (no password) | PASS |
| No password-required instruction | PASS |

### §7: Preview / Print / Share

| Check | Status |
|---|---|
| Preview documented | PASS |
| Print inside Preview (not standalone) | PASS |
| Print explains physical packing checklist | PASS |
| Gathering/packing use case | PASS |
| Final check before trailhead | PASS |
| Share Link documented (all Locker files) | PASS |
| Share Pack List documented (single, checkable) | PASS |
| Temporary check behavior documented | PASS |
| Original not modified by recipient checks | PASS |
| Download PDF documented | PASS |
| No separate "Share a Checkable Packing List" topic | PASS |

### §8: Backgrounds & Display (last)

| Check | Status |
|---|---|
| Background themes (Landscapes) | PASS |
| Custom themes (Add Theme) | PASS |
| Add Your Own Photos (Add Photo / drag-drop) | PASS |
| Fit Image — entire photo shown | PASS |
| Fill Screen — crops to cover | PASS |
| Showcase / Hide documented | PASS |
| Light / Dark tone documented | PASS |
| Lighten/Darken slider documented | PASS |

### Regression

| Check | Status |
|---|---|
| No obsolete Help sections remaining | PASS |
| No application functionality changed | PASS |
| Checklist editing unchanged | PASS |
| Weight calculations unchanged | PASS |
| Undo/Redo unchanged | PASS |
| Save/Save As unchanged | PASS |
| Locker unchanged | PASS |
| Preview unchanged | PASS |
| Print unchanged | PASS |
| Share unchanged | PASS |
| Backgrounds unchanged | PASS |
| Showcase unchanged | PASS |
| File import / Scan Gear List unchanged | PASS |
| Authentication unchanged | PASS |
| Existing saved lists unchanged | PASS |
| Footer dark charcoal (#1e2322) | PASS |
| 022A scroll/footer on Checklist page | PASS |
| SharedChecklistPage informationalOnly footer | PASS |
| 021P sidebar layout invariant | PASS |
| All 10 footer routes registered | PASS |

### Light / Dark appearance

| Check | Status |
|---|---|
| Help content works in Light mode | PASS — uses Tailwind semantic tokens (bg-card, text-foreground, text-muted-foreground, border-border); no hardcoded colors |
| Help content works in Dark mode | PASS — same semantic tokens invert correctly |

### Mobile / narrow layouts

| Check | Status |
|---|---|
| Readable at narrow widths | PASS — `max-w-3xl mx-auto px-6`; no horizontal overflow introduced |
| Accordion tap target adequate | PASS — `px-5 py-4` button height |

---

## Automated Test Results

```
help022C.test.mjs:
  022C Six Main Sections:           6 passed, 0 failed
  022C Section Order:               2 passed, 0 failed
  022C Accordion:                   5 passed, 0 failed
  022C Building: Create/Upload:     3 passed, 0 failed
  022C Building: Add/Organize:      4 passed, 0 failed
  022C Removed Standalone Sections: 3 passed, 0 failed
  022C Trip/Trail/Season Lists:     4 passed, 0 failed
  022C Understanding Pack Weight:   5 passed, 0 failed
  022C Editing Your Gear List:      5 passed, 0 failed
  022C Save / Locker:               4 passed, 0 failed
  022C Preview / Print / Share:     7 passed, 0 failed
  022C Backgrounds & Display:       8 passed, 0 failed
  022C No Video/Animation:          2 passed, 0 failed
  022C Footer/Layout Regression:    9 passed, 0 failed

Total 022C:                         68 passed, 0 failed

help022B.test.mjs (updated):        70 passed, 0 failed
Full pnpm test:importer:            EXIT 0 (all suites)
```

---

## 022B Test Updates

The following 022B tests were updated to reflect the 022C reorganization (the content exists, just reorganized):

| Old assertion | Updated assertion |
|---|---|
| `helpSrc.includes('Getting Started')` | Passes if either "Getting Started" OR "Building Your Gear List" present |
| `helpSrc.includes('Organizing Gear')` | Passes if either "Organizing Gear" OR "Add / Organize" present |
| `helpSrc.includes('Saving') && helpSrc.includes('Locker')` | Now matches "Save / Locker" (uses `Save` not `Saving`) |
| `helpSrc.includes('Sharing')` | Passes if "Sharing" OR "Preview / Print / Share" OR "Share Pack List" present |
| FAQ check | Passes if FAQ or Base Weight or Save As present (content merged inline) |
| Troubleshooting check | Passes if Troubleshooting or "report" or "Report a Problem" present |
| `!helpSrc.includes('password required')` | More precise: only fails if page instructs "A password is required" or "requires a password" |

---

## Items That Still Need User Verification

1. **Visual appearance in the browser** — the accordion layout, section numbering, and full-row click behavior should be verified visually in both Light and Dark mode.
2. **Mobile interaction** — tap targets on the accordion headers should be verified on a real mobile device.
3. **Keyboard navigation** — Tab → Enter / Space to open/close sections; multiple sections open simultaneously.
4. **Share Pack List checkable behavior** — verify that a recipient opening a Share Pack List link can interact with checkboxes temporarily, and that those changes are lost on page refresh.
5. **Custom photo upload in Background Edit** — verify that §6B Add Your Own Photos accurately describes the current UI flow.

---

## Confirmation: Unrelated Functionality Preserved

- `Checklist.tsx` — not changed
- `usePackData.ts` — not changed
- `BackgroundPicker.tsx` — not changed
- `SharedChecklistPage.tsx` — not changed
- `LockerPanel.tsx` — not changed
- `PreviewModal.tsx` — not changed
- `ImportGearPanel.tsx` — not changed
- `Footer.tsx` — not changed
- All API server routes — not changed
- All other 9 footer pages — not changed
- All routes in `App.tsx` — not changed
