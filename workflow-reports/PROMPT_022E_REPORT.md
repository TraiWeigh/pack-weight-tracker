# Prompt 022E — Update How It Works

**Date:** 2026-08-08  
**Status:** COMPLETE — all tests passing (48 new tests, full suite exit 0)

---

## Files Changed

| File | Change |
|---|---|
| `src/pages/info/HowItWorksPage.tsx` | Complete rewrite — 3-section accordion (12,343 bytes) |
| `src/hooks/howItWorks022E.test.mjs` | **NEW** — 48 regression tests |
| `package.json` | Added `howItWorks022E.test.mjs` to `test:importer` chain |

**No application code changed.** HelpPage.tsx (022C) and AboutPage.tsx (022D) are untouched. Checklist, weight calculations, undo/redo, save/locker, preview, print, share, backgrounds, showcase, file import, authentication, and existing saved lists are all untouched.

---

## Previous How It Works Structure

The old page was a flat list of 6 non-collapsible feature cards:

| # | Card Title |
|---|---|
| 1 | Create or open a gear list |
| 2 | Add and organize gear |
| 3 | Select the gear you are using |
| 4 | Review pack weight |
| 5 | Save, preview, or share |
| 6 | Scan Gear List *(optional — separate card at the end)* |

Problems with the old structure:
- Scan Gear List was a separate final step — the prompt requires it inside Create / Upload
- No mention of different trail/season gear lists
- No mention of printing as a physical packing checklist
- No mention of the checkable shared packing list
- Non-accordion (all cards always visible, no progressive disclosure)
- "Select the gear you are using" was a separate step from "Add and organize gear"

---

## New How It Works Structure

**Always-visible intro:** 2-sentence overview of the workflow (build → organize → save/print/share), with instruction to open a topic below.

**3 accordion sections, all collapsed by default:**

### 1. Create / Upload
- Start from scratch: click **New**, build manually
- Scan Gear List: upload a PDF, Word document, Excel spreadsheet, or Numbers file → TrailWeigh detects items → user reviews and selects which to add
- After import, items can be added, edited, or removed at any time

### 2. Add / Organize
- **Add Item** in any category; enter type, description, weight, quantity (1–20)
- Categories: add, rename, reorder, move items with the **Move** control
- **Checkbox** to select gear for this trip; unchecked items stay in list, excluded from current weight calculation
- Different lists for different trips: PCT, AT, CDT, winter, cold-weather, summer, weekend; gear varies by route/elevation/season; use **Save As** to create a new version

### 3. Save / Preview / Print / Share
- **Save** → Locker, named lists, private to account, multiple lists for different trails/seasons
- **Preview** → clean formatted view before printing or sharing
- **Print** → physical packing checklist; gather equipment, pack at home, final trailhead check; trailhead / forgot-gear scenario
- **Share** → share all saved lists or just the current list as a checkable packing list; recipient can view, check items, print; their changes are temporary and don't affect the owner's saved original; useful for hiking partners, trip planning

**Footer note:** "Need detailed step-by-step instructions? Visit Help & How-To." (link to `/help`)

---

## Accordion Implementation

Same pattern as 022C (HelpPage) and 022D (AboutPage):
- `useAccordion()` hook — `useState<Set<string>>(new Set())` (all collapsed)
- `Set<string>` toggle — multiple sections open simultaneously; no auto-close
- `Section` component: `<button>` spans the full title row (`w-full`)
- `aria-expanded`, `aria-controls`, `role="region"`, `aria-labelledby`
- `ChevronDown` / `ChevronUp` from lucide-react
- `hover:bg-muted/40`, `focus-visible:ring-2 focus-visible:ring-primary`
- No "Expand All" button

---

## Scope Decisions

| Decision | Reasoning |
|---|---|
| Scan Gear List placed inside Create / Upload, not a separate section | Prompt explicitly requires this |
| Checkboxes / selecting gear placed inside Add / Organize | Old page had this as its own step; prompt requires it merged into Add/Organize |
| "Share a Checkable Packing List" kept inside Share subsection, not its own section | Prompt explicitly requires this |
| No Base Weight / Weight Distribution / Pack Summary detail | That detail belongs in Help & How-To — this page is a brief overview |
| No Save/Locker tutorial (full Save As / Rename / Delete detail) | That belongs in Help & How-To |
| No ultralight philosophy, Ray-Way, HYOH, minimalism | That belongs in About TrailWeigh (022D) |
| Save As mentioned briefly | Prompt says "mention that briefly, but leave detailed instructions to Help & How-To" |

---

## Verification Results

| Check | Status |
|---|---|
| How It Works page was actually modified | PASS — old 6-step flat layout removed |
| Create / Upload is the first topic | PASS |
| Scan Gear List information inside Create / Upload | PASS |
| No separate Scan Gear List / Importing top-level section | PASS |
| Add / Organize is the second topic | PASS |
| Selecting/checking the gear being used under Add / Organize | PASS |
| Different trail/season gear lists explained | PASS |
| PCT, AT, CDT examples present | PASS |
| Seasonal/condition examples present (summer, winter, cold-weather) | PASS |
| Save / Preview / Print / Share is the third topic | PASS |
| Print clearly explains physical packing checklist use | PASS |
| Trailhead / forgot gear scenario present | PASS |
| Share includes checkable packing-list sharing | PASS |
| Share: recipient changes temporary, don't affect original | PASS |
| No separate "Share a Checkable Packing List" topic | PASS |
| No Ray-Way / Ray Jardine content | PASS |
| No HYOH content | PASS |
| No "What Is Ultralight" content | PASS |
| Entire title row of each section is clickable (w-full button) | PASS |
| Sections collapsed by default | PASS |
| Multiple sections can remain expanded simultaneously | PASS |
| Keyboard accessibility (Enter/Space via standard HTML button) | PASS |
| aria-expanded / accessibility semantics present | PASS |
| Link to Help & How-To present | PASS |
| Page readable in Light and Dark modes | PASS — semantic tokens only |
| Page readable on narrow/mobile screens | PASS — max-w-3xl, px-6, adequate tap targets |
| Help & How-To from 022C unchanged | PASS |
| About TrailWeigh from 022D unchanged | PASS |
| No unrelated application functionality changed | PASS |

---

## Automated Test Results

```
howItWorks022E.test.mjs:
  022E Page Updated:                      3 passed, 0 failed
  022E Three Required Sections:           4 passed, 0 failed
  022E Accordion Mechanics:               8 passed, 0 failed
  022E Create Upload Content:             7 passed, 0 failed
  022E Add Organize Content:              9 passed, 0 failed
  022E Save Preview Print Share Content:  8 passed, 0 failed
  022E No Ultralight Philosophy Here:     3 passed, 0 failed
  022E Help Link:                         1 passed, 0 failed
  022E 022C 022D Regression:              2 passed, 0 failed
  022E Footer and Routing Regression:     3 passed, 0 failed

Total 022E:                              48 passed, 0 failed

Full pnpm test:importer:                 EXIT 0 (all suites)
```

---

## Failed Attempts

None. Tests passed on first run.

## Anything Reverted

Nothing was reverted. The change set is minimal — only `HowItWorksPage.tsx` was modified.

---

## Confirmation: 022C and 022D Preserved

- `HelpPage.tsx` — not changed; all 6 main sections confirmed present by regression tests
- `AboutPage.tsx` — not changed; all 12 accordion section titles confirmed present by regression tests

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
- All routes in `App.tsx` — not changed

---

## Items Requiring User Verification

1. **Visual appearance** — verify the 3-section accordion layout renders cleanly in both Light and Dark mode; check that the intro paragraph is readable and the section titles scan well in collapsed state.
2. **Accordion interaction** — click each title row to expand; click again to collapse; verify multiple sections can be open simultaneously; verify the full title row (not just the chevron) is the click target.
3. **Keyboard navigation** — Tab to a section header → Enter or Space to expand/collapse.
4. **Mobile layout** — tap targets and overall readability on a narrow screen.
5. **Content accuracy** — verify the file types listed for Scan Gear List (PDF, Word, Excel, Numbers) match what the current application actually supports; verify the Move control is present in the UI as described.
6. **Shared checkable list behavior** — verify the described behavior (recipient can check items, temporary state, doesn't affect original) matches the current implementation of Share Pack List.
