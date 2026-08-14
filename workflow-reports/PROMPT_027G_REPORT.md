# PROMPT 027G REPORT
**Read-Only Diagnostic — Approved V3 Mobile Control-Mapping Audit**

Internal Version ID: `027G-V3-MOBILE-CONTROL-MAPPING-DIAGNOSTIC-2026-08-14-R1`

---

## 1. Internal Version
027G-V3-MOBILE-CONTROL-MAPPING-DIAGNOSTIC-2026-08-14-R1

## 2. Agent Mode
Economy / Read-Only Diagnostic

## 3. Elapsed Time / Actions
~12 minutes. 3 parallel subagent explorations. Zero file edits. Zero code changes.

## 4. Preflight Git Status
No application or prototype code changed. Only report + ZIP created.

## 5. Files Inspected
| File | Purpose |
|------|---------|
| `artifacts/pack-checklist/src/App.tsx` | Routes, ClerkProvider, wouter setup |
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | All production handlers, mobile toolbar (lg:hidden) |
| `artifacts/pack-checklist/src/components/MobileWedgeCategory.tsx` | Mobile category/item component |
| `artifacts/pack-checklist/src/components/GearCategory.tsx` | Desktop category component |
| `artifacts/pack-checklist/src/pages/ReviewPage.tsx` | Guest/review mode |
| `artifacts/pack-checklist/src/pages/SharedChecklistPage.tsx` | Read-only shared snapshot view |
| `artifacts/pack-checklist/src/components/ui/sheet.tsx` | Sheet primitive (Radix Dialog) |
| `artifacts/pack-checklist/src/components/ui/drawer.tsx` | Drawer primitive (vaul) |
| `artifacts/pack-checklist/src/components/ui/dropdown-menu.tsx` | DropdownMenu (Radix) |
| `artifacts/pack-checklist/src/components/ui/dialog.tsx` | Dialog (Radix) |
| `artifacts/pack-checklist/src/components/ui/popover.tsx` | Popover (Radix) |
| `artifacts/pack-checklist/src/lib/lockerApi.ts` | Server API calls |
| `artifacts/pack-checklist/src/lib/shareLink.ts` | Share/link creation |
| `artifacts/pack-checklist/src/lib/mobileCategoryTheme.ts` | Mobile icon/color data |
| `artifacts/pack-checklist/src/pages/MobileDesignPrototypeV3.tsx` | Approved V3 (READ ONLY) |

---

## 6. V3 Visual Freeze Confirmation

**CONFIRMED.** `/mobile-design-v3` Light design is visually frozen following 027F user approval. This report makes zero changes to it or any other file. All mapping recommendations below must adapt to the frozen geometry.

---

## 7. Current Real Mobile Control Inventory

### 7a. Current Production Mobile Toolbar (lg:hidden — Checklist.tsx lines 2787–2917)

The existing mobile toolbar contains these ACTIVE controls:

| Control | Icon | Handler | State |
|---------|------|---------|-------|
| Expand All | ChevronDown | `setOpenCatIds(new Set(categoryOrder)); setCatSeq(s => s+1)` | `openCatIds`, `catSeq` |
| Collapse All | ChevronUp | `setOpenCatIds(new Set<string>()); setCatSeq(s => s+1)` | `openCatIds`, `catSeq` |
| Hide | text | `triggerShowcase()` + `setBackgroundPickerOpen(false)` | showcase state |
| Checklist | text | `setShowPreview(true)` | `showPreview` |
| Light | Sun icon | `handleBgToneChange('light')` | `bgTone` (line 444) |
| Dark | Moon icon | `handleBgToneChange('dark')` | `bgTone` |
| Unit Toggle | Row 2 | `setSystem('imperial'/'metric')` via `useUnit()` | `UnitToggle` component |

### 7b. Controls Existing in Production But NOT Wired to Current Mobile Toolbar

| Control | Handler / Function | File / Line | Mutation |
|---------|-------------------|-------------|---------|
| New | `handleNew` (line 1212) | Checklist.tsx | localStorage + new tab |
| Save | `handleSaveMenuSave` (line 1657) | Checklist.tsx | API: `serverSaveNew` / `serverSaveReplace` |
| Share | `handleShare` (line 1180) | Checklist.tsx | API: `POST /api/links` |
| Reset | `handleReset` (line 1170) | Checklist.tsx | localStorage |
| Undo | `undo()` (line 1263) | Checklist.tsx | local state only |
| Redo | `redo()` (line 1264) | Checklist.tsx | local state only |
| Pack Summary | `sidebarForce.summary` | Checklist.tsx | none (display) |
| Weight Distribution | `sidebarForce.distribution` | Checklist.tsx | none (display) |
| Locker | `sidebarForce.locker` | Checklist.tsx | API: GET/PUT/PATCH/DELETE `/api/locker` |
| Scan Gear | `sidebarForce.import` | Checklist.tsx | API: PDF parse |
| Print | print entry point | Checklist.tsx | none (display) |
| Add Category | `addCategory()` | via usePackData | localStorage |
| Add Item | `addItem(categoryName)` | MobileWedgeCategory.tsx line 499 | localStorage |
| Item Delete | `removeItem(cat, id)` | MobileWedgeCategory.tsx | localStorage |
| Category Delete | `onDelete()` + confirm UI | MobileWedgeCategory.tsx lines 409–445 | localStorage |
| Category Rename | `onRename(newName)` (optional prop) | MobileWedgeCategory.tsx | localStorage |
| Move Item | `moveItem(src, dst, id)` | MobileWedgeCategory.tsx line 252 | localStorage |

**Search:** `NO CURRENT REAL SEARCH FUNCTION TO MAP` — no search input, handler, or state exists anywhere in the production mobile path (confirmed by full codebase grep).

---

## 8. Active Handler/State Trace

### Category Accordion (Production)
- **State:** `openCatIds: ReadonlySet<string>` (Checklist.tsx line ~974)
- **Normal toggle:** `handleCategoryToggle` — single-open: new Set with only the toggled id (or empty if closing)
- **After Expand All:** `openCatIds = new Set(categoryOrder)` — subsequent click closes all others (single-open reverts)
- **Collapse All:** `openCatIds = new Set<string>()`
- **MobileWedgeCategory sync:** `forceOpen` / `forceOpenSeq` props, local `isOpen` state, `onToggle` callback reports changes back to parent

### Category Tap Target (CRITICAL FINDING)
- **Current tap target:** Center card-title `<div role="button">` (MobileWedgeCategory.tsx lines 364–379)
- **Colored wedge/icon strip:** `aria-hidden="true"`, **NO onClick** — currently decorative only
- **User decision B says:** "wedge/icon is the primary open/close tap target"
- **Implementation needed:** Add onClick to the wedge strip (currently aria-hidden), keep card-title as secondary tap. OR make full row tappable and satisfy the user intent. This is **presentation-only** — does not change handler logic, only which element calls `handleToggle`.

### Item Expand/Collapse (MobileWedgeCategory)
- No production per-item expand/collapse exists yet — only the prototype has this
- MobileWedgeCategory renders weight/qty/move/total in **always-visible inline rows**, not an expandable detail panel
- The V3 approved design uses an expanded detail panel (triggered by ChevronUp per item)
- **Implementation will add** per-item `expanded` state to the production mobile component

### Weight
- **Stored as:** `item.weightOz` (ounces always)
- **Display:** `formatWeight(weightOz, system, 'small')` + `smallUnit(system)` — respects imperial/metric
- **Edit:** `<input type="number">` onChange → `updateItem(category, item.id, { weightOz: convertedValue })`
- **Mobile-only:** yes, in MobileWedgeCategory

### Quantity
- **Stored as:** `item.qty` (integer)
- **Edit:** `<select>` with options 1–20 (`QTY_OPTIONS`) onChange → `updateItem(category, item.id, { qty: parseInt(e.target.value) })`

### Total
- **Computed:** `calcTotalOz(item.weightOz, item.qty)` — not stored, derived
- **Category total:** `items.filter(i => i.checked).reduce((s, i) => s + calcTotalOz(i.weightOz, i.qty), 0)`

### Move
- **Handler:** `moveItem(category, destinationCat, item.id)` from usePackData
- **UI:** `<select>` of `order.filter(c => c !== category)` — mobile native select
- **Condition:** only shown when `otherCats.length > 0`
- **Touch:** native `<select>` works on touch today

### Imperial/Metric
- **State:** `useUnit()` hook → `system: 'imperial' | 'metric'`
- **Setter:** `setSystem(...)` in UnitToggle component (lines 62/78 in UnitToggle)
- **Shared:** yes — affects all weight display across web and mobile

### Light/Dark
- **State:** `bgTone: 'light' | 'dark'` declared Checklist.tsx line 444
- **Handler:** `handleBgToneChange(tone)` at line 478
- **Note:** On mobile, this currently affects the background theme tone. Future Dark mode for mobile V3 is separately scoped and not authorized yet.

---

## 9. V3 Mapping Matrix

| # | Approved V3 Element | Existing Real Function Candidate | Current Handler/State Path | Confidence | Visual Change Required | User Decision Required | Notes / Risks |
|---|--------------------|---------------------------------|---------------------------|------------|----------------------|----------------------|---------------|
| 1 | Hamburger | Menu/slide-out for secondary controls (New, Save, Share, Reset, Undo, Redo, Light/Dark, Imperial/Metric, Help, Print) | `handleNew`, `handleShare`, `handleSaveMenuSave`, `handleReset`, `undo`, `redo`, `handleBgToneChange`, `useUnit` | HIGH | NO — Sheet opens over content | NO | Use existing Sheet primitive; no geometry change |
| 2 | TrailWeigh logo/wordmark | No action (brand identity only) | — | HIGH | NO | NO | Static; tapping logo could navigate to home but not required now |
| 3 | Search circle | NO CURRENT REAL SEARCH FUNCTION TO MAP | — | HIGH | NO | YES — does user want future search scoped to gear list, Locker, or catalog? | Leave visually present, no handler wired |
| 4 | Green plus circle | Add Item (most frequent add action in list context) OR Add Category OR New List | `addItem`, `addCategory`, `handleNew` | MEDIUM | NO | YES — which add action does plus trigger? See §12 | Multiple plausible meanings |
| 5 | List/trip title area | Active pack list name (from `usePackData` `listName` or equivalent) | usePackData list name state | HIGH | NO — data substitution only | NO | Replace static "Italy Adventure Trip" with real list name |
| 6 | Title chevron | Locker file chooser (list switcher) | `sidebarForce.locker` → Locker component | MEDIUM | NO — Sheet/panel over content | YES — user must confirm chevron = open Locker | Currently Locker is a sidebar panel; can open as Sheet without geometry change |
| 7 | Summary card | Checklist item counts + (optionally) total pack weight | `items.filter(i=>i.checked)` counts; `categoryTotalOz` sum | HIGH | NO | NO | "48 items / 31 Packed / 17 Remaining" → real `selected` / `checked` counts. See §14 |
| 8 | Summary main metric | Item count (total selected items) | derived from usePackData items | HIGH | NO | NO | Could also be total weight — see §14 for recommendation |
| 9 | Summary secondary metrics | Packed / Remaining counts | `items.filter(i=>i.checked).length` | HIGH | NO | NO | Straightforward count substitution |
| 10 | Wedge/icon (tap target) | Category open/close | `handleToggle` in MobileWedgeCategory | HIGH | YES — add onClick to wedge strip (currently aria-hidden) | NO | Small tap-target addition; does not change geometry or handler logic |
| 11 | Category title | Category name (read) | `cat.name` / `meta.name` | HIGH | NO | NO | Already uses real category name in MobileWedgeCategory |
| 12 | Category subtitle | Item count • packed count | `items.length` / `packedCount` | HIGH | NO | NO | Already computed in MobileWedgeCategory |
| 13 | Right chevron (category) | Category open/close (secondary tap target) | `handleToggle` | HIGH | NO | NO | Chevron already exists in MobileWedgeCategory header area |
| 14 | Category color/icon | mobileCategoryTheme.ts data | `lib/mobileCategoryTheme.ts` | HIGH | NO | NO | Already wired in MobileWedgeCategory |
| 15 | Open category body | Item rows (real GearItem data) | `items` prop from usePackData | HIGH | NO | NO | Already rendered in MobileWedgeCategory |
| 16 | Category-item checkbox | Item selection (`item.checked`) | `updateItem(cat, id, { checked: !item.checked })` | HIGH | NO | NO | Already wired in MobileWedgeCategory |
| 17 | Item name | `item.desc` | GearItem.desc | HIGH | NO | NO | Already displayed in MobileWedgeCategory |
| 18 | Item qty (right-side value) | `item.qty` | GearItem.qty | HIGH | NO | NO | Already displayed |
| 19 | Item detail chevron | Per-item expand/collapse (new local state) | No production equivalent yet | HIGH | NO — add local `expandedId` state | NO | Add `useState<string|null>(null)` for expanded item; presentation only |
| 20a | Weight detail row | `item.weightOz` + edit input | `updateItem(cat, id, { weightOz })` | HIGH | NO | NO | Already in MobileWedgeCategory; move inside collapsed panel |
| 20b | Quantity detail row | `item.qty` + select | `updateItem(cat, id, { qty })` | HIGH | NO | NO | Already in MobileWedgeCategory; move inside collapsed panel |
| 20c | Total detail row | `calcTotalOz(weightOz, qty)` | computed, not stored | HIGH | NO | NO | Already displayed in MobileWedgeCategory |
| 20d | Move detail row | `moveItem(src, dst, id)` native select | `moveItem` from usePackData | HIGH | NO | NO | Already in MobileWedgeCategory; move inside collapsed panel |
| 21 | Pack List nav tab | Current checklist/list view (already active) | Checklist route `/checklist` | HIGH | NO | NO | Pack List = current screen; tab is active state |
| 22 | Summary nav tab | PackSummaryPanel + WeightDistribution | `sidebarForce.summary` / `sidebarForce.distribution` | MEDIUM | NO — open as Sheet | YES — which panel? summary only, or distribution too? | |
| 23 | Gear nav tab | Locker (saved gear files) OR future gear catalog | `sidebarForce.locker` | LOW | NO | YES — Gear = Locker? or future catalog? | See §22 |
| 24 | Trips nav tab | Locker list selection / saved trips | `sidebarForce.locker` | LOW | NO | YES — Trips = saved Locker files? overlaps with Gear? | See §22 |
| 25 | More nav tab | Utility controls (Scan Gear, Print, Help, Checklist, Expand/Collapse) | various handlers | MEDIUM | NO — open as Sheet/menu | YES — grouping? | |

---

## 10. Hamburger Recommendation

**RECOMMENDED: YES — hamburger opens a Sheet slide-out menu.**

The approved V3 header has no room for additional icons beyond search + plus. The hamburger is the natural home for all secondary/file/utility controls currently inaccessible on mobile:

Recommended hamburger menu contents:
1. **Save** (`handleSaveMenuSave`)
2. **New** (`handleNew`)
3. **Share** (`handleShare`)
4. **Reset** (`handleReset`)
5. **Undo / Redo** (`undo()` / `redo()`)
6. **Checklist** (`setShowPreview(true)`)
7. **Expand All / Collapse All**
8. **Imperial / Metric** (UnitToggle inline or as menu item)
9. **Light / Dark** (future; placeholder slot)
10. **Locker** (`sidebarForce.locker`)
11. **Scan Gear** (`sidebarForce.import`)
12. **Print**
13. **Help / About** (static routes)

**Implementation:** Use existing `Sheet` primitive (already imported from `@radix-ui/react-dialog` via `components/ui/sheet.tsx`). No new package needed.

**Does not change header geometry.** Sheet renders as an overlay.

---

## 11. Search Recommendation

**NO CURRENT REAL SEARCH FUNCTION TO MAP.**

No search input, handler, state, or index exists anywhere in the production mobile path. The search circle should remain visually present in the frozen V3 geometry but have no handler wired in the next implementation prompt.

**USER DECISION REQUIRED:** What should search do? Options:
- Search within the current gear list (filter items by name)
- Search the Locker for saved files
- Search a future gear catalog
- Leave unwired until a future prompt

---

## 12. Green Plus Circle Recommendation

**USER DECISION REQUIRED.** Three plausible meanings:

| Option | Function | Handler |
|--------|---------|---------|
| A | Add Item (to currently open/selected category) | `addItem(categoryName)` |
| B | Add Category | `addCategory()` |
| C | Context-sensitive: if category is open → Add Item; else → Add Category | conditional |

**Recommendation (architectural):** Option C is the most iOS-natural pattern and matches how the V3 design flows (user is looking at a category → plus adds to it). But this requires tracking "currently active category" on mobile.

**Do not implement.** USER must decide which meaning to assign before 027H.

---

## 13. List Title Chevron Recommendation

**RECOMMENDED: Chevron opens Locker (file/list switcher) as a Sheet.**

Production Locker (`sidebarForce.locker`) lists all saved pack files. On mobile, opening it from the list title is the natural "switch list" gesture (matches iOS/Android patterns). Implementation is event-handler + Sheet only — no geometry change.

**Confidence: MEDIUM.** Needs user confirmation: does the list-title chevron mean "switch list via Locker" specifically, or something broader?

---

## 14. Summary Card Real-Data Recommendation

**For Backpacking lists — recommended mapping:**

| V3 Element | Real Data | Source |
|-----------|----------|--------|
| Main metric ("48 items") | Total selected item count (`items.filter(i=>i.checked).length`) | usePackData |
| "31 Packed" | Items with `checked: true` (Checklist-use packed state) | usePackData |
| "17 Remaining" | selected − packed | derived |
| Luggage icon | Static (generic pack icon) | no change needed |

**Alternative main metric:** total pack weight (more backpacking-relevant). However, the approved V3 geometry shows "48 items" — changing to weight requires a label change ("lbs" etc.) but no geometry change. **USER DECISION:** item count (approved visual) vs. total pack weight as the primary number?

**Future list-type note:** The "TRIP SUMMARY" label and suitcase icon are backpacking-specific. Future list types (day hike, travel, etc.) may need different labels. Do not implement future list types now.

---

## 15. Category Wedge/Open-Close Mapping

**Current state:** Center card-title `<div role="button">` is the tap target. The colored wedge/icon strip is `aria-hidden` with no onClick.

**User decision B says:** wedge/icon = primary open/close target.

**Recommended implementation:** Add `onClick={handleToggle}` and remove `aria-hidden` from the wedge strip. Keep the card-title onClick as well (full-row tappable). The `handleToggle` logic (single-open, forceOpen sync, onToggle callback, Expand/Collapse All behavior) is **unchanged** — only the tap surface expands.

**Visual change required:** NO (wedge geometry unchanged). Behavior change: tap surface widens to include icon.
**Keyboard:** card-title already has `role="button"` + Enter/Space. Wedge strip will need `role="button"` and keydown handler too for accessibility.
**Expand All / Collapse All:** unaffected — they operate on `openCatIds` state directly, not through tap target.

---

## 16. Category-Item Checkbox Mapping

**CONFIRMED — direct reuse.**

`updateItem(category, item.id, { checked: !item.checked })` is already wired in MobileWedgeCategory. The V3 checkbox visual can call this handler directly. No structural change needed.

**Note:** `item.checked` = inclusion in Checklist (user decision E), NOT Checklist-use progress. Clear resets only Checklist-use checkmarks, not `item.checked`. This must be preserved exactly.

---

## 17. Item Detail Expand/Collapse Mapping

**No production equivalent yet.** MobileWedgeCategory currently shows Weight/Qty/Move/Total in always-visible inline rows.

**Recommended implementation:** Add local `expandedItemId: string | null` state to MobileWedgeCategory. The item-row ChevronUp/Down toggles this. The detail panel (Weight, Qty, Total, Move) renders conditionally beneath the item row when `expandedItemId === item.id`.

**This is presentation-only** — the handlers (`updateItem`, `moveItem`, `calcTotalOz`) are unchanged. No API impact.

---

## 18. Weight Mapping

- **Real field:** `item.weightOz` (always stored in oz)
- **Display path:** `formatWeight(weightOz, system, 'small')` + `smallUnit(system)` (respects imperial/metric)
- **Edit path:** `<input type="number">` → `updateItem(category, item.id, { weightOz: convertedValue })`
- **V3 detail row:** Replace static "1" with real weight display; edit input opens on tap
- **No geometry change required** — detail row height matches V3 approved 42px rows

---

## 19. Quantity Mapping

- **Real field:** `item.qty` (integer 1–20)
- **Edit path:** `<select>` with QTY_OPTIONS → `updateItem(cat, id, { qty })`
- **V3 detail row:** Replace static "1" with `item.qty`; select opens on tap (native mobile select)
- **No geometry change required**

---

## 20. Total Mapping

- **Computed:** `calcTotalOz(item.weightOz, item.qty)` — displayed via `formatWeight`
- **Not stored** — always derived
- **V3 detail row:** Replace static display with computed value
- **No geometry change required**

---

## 21. Move Mapping

- **Handler:** `moveItem(src, dst, item.id)` from usePackData
- **Current UI:** native `<select>` of other categories
- **Touch:** native select works on mobile today
- **Condition:** only shown when `otherCats.length > 0` (hide row entirely if only one category)
- **V3 detail row "Move":** wires directly — replace static "Toiletry Bag" dropdown with real select
- **No drag/reorder** — confirmed by user decision D

---

## 22. Bottom Nav Mapping

| Tab | Current Production Equivalent | Recommendation |
|-----|------------------------------|----------------|
| **Pack List** | Current checklist/list view | → Active state = current screen. Handler = no-op (already here). **IDENTIFIED** |
| **Summary** | PackSummaryPanel + optional WeightDistribution | → Open PackSummaryPanel as a Sheet or full-screen overlay. **USER DECISION:** summary only, or distribution too? |
| **Gear** | Locker (saved gear files) OR future gear catalog | → **USER DECISION REQUIRED.** "Gear" could mean Locker (saved lists), a future gear database, or Scan Gear import. No clear single production mapping today. |
| **Trips** | Saved Locker files (list switcher) | → **USER DECISION REQUIRED.** Overlaps with Gear if Gear=Locker. Could mean "saved trips/lists" distinct from "gear items". |
| **More** | All utility actions without a dedicated home (Scan Gear, Print, Help, Checklist, Expand/Collapse, Hide) | → Open a Sheet/menu of remaining utility controls. **USER DECISION:** what goes in More vs hamburger? |

**CRITICAL:** Gear and Trips cannot both map to Locker without a clear product distinction. This requires user product decisions before implementation.

---

## 23. Current Controls With No Obvious V3 Home

| Control | Current Path | Recommended V3 Home |
|---------|-------------|---------------------|
| Undo | `undo()` keyboard only | Hamburger menu |
| Redo | `redo()` keyboard only | Hamburger menu |
| Save | `handleSaveMenuSave` desktop only | Hamburger menu |
| Reset | `handleReset` desktop only | Hamburger menu |
| New | `handleNew` desktop only | Hamburger menu |
| Share | `handleShare` desktop only | Hamburger menu |
| Expand All | mobile toolbar today | Hamburger menu OR More tab |
| Collapse All | mobile toolbar today | Hamburger menu OR More tab |
| Hide | `triggerShowcase()` mobile toolbar today | Hamburger menu (or remove from mobile — USER DECISION) |
| Checklist | `setShowPreview(true)` mobile toolbar today | Hamburger menu OR dedicated bottom-nav destination |
| Light/Dark | `handleBgToneChange` mobile toolbar today | Hamburger menu (future, after Dark mode authorized) |
| Imperial/Metric | `useUnit()` mobile toolbar today | Hamburger menu (inline toggle) |
| Add Category | `addCategory()` | Hamburger menu OR green-plus context |
| Item Delete | `removeItem()` | Contextual swipe/long-press OR item detail row action — USER DECISION |
| Category Delete | `onDelete()` with confirm | Hamburger menu within open category OR long-press — USER DECISION |
| Category Rename | `onRename()` | Tap category title (separate from wedge tap-open) — presentation only |
| Scan Gear | `sidebarForce.import` | More tab OR hamburger |
| Locker | `sidebarForce.locker` | Trips OR Gear tab OR hamburger OR title chevron |
| Pack Summary | `sidebarForce.summary` | Summary tab |
| Weight Distribution | `sidebarForce.distribution` | Summary tab (secondary) |
| Print | print entry | Hamburger menu |
| Help/About | static routes | Hamburger menu |

---

## 24. Menu/Sheet Primitive Audit

**Recommended primitive: `Sheet` (`components/ui/sheet.tsx`)**

| Property | Status |
|----------|--------|
| Source | `@radix-ui/react-dialog` (already installed) |
| Focus trap | YES — Radix Dialog handles focus trap correctly |
| Touch/keyboard access | YES — Radix primitives support both |
| Renders without main-screen geometry change | YES — portal, overlays content |
| No new package required | CONFIRMED |
| Side: left or bottom | Both supported via `SheetContent side="left"` or `"bottom"` |

**Alternative: `Drawer` (vaul)** — also installed. Provides bottom-sheet swipe-dismiss. Better UX for bottom-sheet patterns (More tab, Summary). Both are available; no install needed.

**Recommendation:**
- Hamburger → `Sheet side="left"` (slide-in from left, matches platform convention)
- Bottom nav destinations (Summary, Gear, Trips, More) → `Drawer` from vaul (bottom-sheet swipe, native-feeling on mobile)

---

## 25. Light/Dark Future Placement Recommendation

**Recommended: Hamburger menu** (inline toggle or menu item).

Rationale: Light/Dark is a per-session preference. It belongs near other user preferences (Imperial/Metric) which are also recommended for hamburger. Placing both together is consistent and avoids cluttering the bottom nav.

The existing `handleBgToneChange` handler can be called directly from the hamburger menu without any geometry change to the main screen.

**Not recommended: More tab** — More is better reserved for infrequent utility actions; toggling appearance is a frequent preference.

---

## 26. Imperial/Metric Placement Recommendation

**Recommended: Hamburger menu** — inline `UnitToggle` component or equivalent toggle row.

The `UnitToggle` component already encapsulates `useUnit()`. It can render inside a Sheet without any prop changes. This replaces the current mobile Row 2 toolbar location (which will be hidden when hamburger menu takes over those controls).

---

## 27. Share Placement Recommendation

**Recommended: Hamburger menu.**

`handleShare` (Checklist.tsx line 1180) is already wired. It calls `sharePackList(data, system, categoryOrder, categoryMeta)` → `POST /api/links`. Placing it in the hamburger is a handler-wiring-only change; no geometry change.

**Secondary option:** List-title area (share = sharing this specific list). Could be a context action from the title chevron row. USER DECISION if they prefer title-area over hamburger.

---

## 28. Print Placement Recommendation

**Recommended: Hamburger menu.**

Print is infrequent and not touch-primary. Hamburger is the right secondary-utility home. No geometry change.

---

## 29. Review-Mode Implications

**ReviewPage.tsx** renders `<ChecklistContent isGuest reviewToken>` which:
- Uses review-local pack/locker keys (not owner data)
- Skips owner Locker API calls (line 224–230)
- Does not perform server mutations

**V3 mobile control mapping implications:**
- Hamburger in Review: can open a Sheet, but should only expose Review-appropriate actions (Share would be re-share the review link, not owner save; Save/Reset/New are owner-only)
- Item edit controls (Weight, Qty, Move) in Review: the `updateItem` call writes to the review-local copy only — this is safe and already how production ReviewPage works
- Checkboxes in Review: write to review-local checked state — also safe and existing behavior
- Category wedge tap: uses same `handleToggle` flow — no owner data involved
- Bottom nav in Review: Pack List/Summary tabs are fine; Locker/Trips tabs should not expose the owner's Locker in Review

**No changes needed to Review.** The mapping is compatible. The implementation prompt should pass a `isGuest` flag to suppress hamburger items that are owner-only (Save, Reset, Undo, Redo, New, Locker).

---

## 30. Visual-Freeze Risks

| Recommendation | Implementation Type | Geometry Risk |
|---------------|--------------------|----|
| Hamburger → Sheet | event-handler wiring + existing Sheet primitive | NONE — Sheet is an overlay |
| Search circle → no-op | no-op handler | NONE |
| Plus circle → add action | event-handler wiring | NONE |
| Title text → real data | data substitution | NONE |
| Title chevron → Locker Sheet | event-handler wiring | NONE |
| Summary card → real data | data substitution | NONE |
| Wedge tap target → add onClick | event-handler addition | NONE — wedge geometry unchanged |
| Item detail panel → expandedItemId state | local state + conditional render | NONE — detail rows match approved 42px height |
| Weight/Qty/Total/Move → real data | data substitution + existing handlers | NONE |
| Bottom nav → Sheet/Drawer | event-handler wiring + existing Drawer | NONE — Drawer is overlay |

**NO recommended mapping requires a geometry/layout change to the approved V3 design.**

---

## 31. Recommended Implementation Sequence

**TWO IMPLEMENTATION PROMPTS RECOMMENDED.**

**Reason for split:** The bottom nav (Gear/Trips/More semantics) and green plus require USER DECISIONS before safe implementation. Splitting allows:
- 027H to implement all mappings with known answers (header + category + item data)
- 027I to implement bottom-nav destinations and green-plus after user decides their meanings

**027H scope (safe to implement now):**
- Hamburger → Sheet (New, Save, Share, Reset, Undo, Redo, Checklist, Expand All, Collapse All, Imperial/Metric, Print, Help)
- Title text → real list name
- Summary card → real item counts
- Wedge tap target → add onClick to icon strip
- Category-item checkbox → `updateItem` wired
- Per-item expand/collapse → `expandedItemId` local state
- Weight/Qty/Total/Move detail rows → real data + handlers
- Pack List tab → active state (already current screen)

**027I scope (after user decisions):**
- Green plus → assigned meaning
- Search circle → assigned meaning (or confirmed unwired)
- Summary/Gear/Trips/More tabs → assigned destinations
- Light/Dark toggle → slot in hamburger (after Dark authorized)

---

## 32. Expected Files for 027H Implementation

| File | Expected Change |
|------|---------------|
| `src/components/MobileWedgeCategory.tsx` | Wedge onClick, per-item expandedId state, detail panel, real weight/qty/total/move wiring |
| `src/pages/Checklist.tsx` | Mobile header: hamburger Sheet, title real data, summary real data, Pack List active state |

Maximum: 2 files. No new components required for 027H.

---

## 33. Expected DB/API/Auth Impact

- **027H:** No new API endpoints. Existing `updateItem`, `moveItem`, `addItem`, `removeItem` → all write to localStorage via usePackData (no server call). Locker sync only when Locker is explicitly opened (unchanged). Auth: all within existing Clerk guard.
- **027I (nav destinations):** May open Locker panel → existing `GET /api/locker` call. No new endpoints.

---

## 34. Material User Decisions Required

| # | Decision | Blocking |
|---|----------|---------|
| **U1** | What does the **green plus circle** do? Options: Add Item (to open category), Add Category, or context-sensitive | Blocks 027I |
| **U2** | What does the **Gear tab** map to? Locker (saved files)? Future gear database? Scan Gear? | Blocks 027I |
| **U3** | What does the **Trips tab** map to? Saved Locker lists? Something distinct from Gear? | Blocks 027I |
| **U4** | What does the **More tab** contain? Overlap with hamburger needs resolution | Blocks 027I |
| **U5** | What does the **Summary tab** show? Pack Summary only, or Pack Summary + Weight Distribution? | Blocks 027I |
| **U6** | What does the **search circle** map to? Gear-list filter, Locker search, catalog search, or leave unwired? | Blocks 027I |
| **U7** | **Summary card main metric:** "48 items" (selected count, as approved visual) or total pack weight? | Could be resolved in 027H with item count as default |
| **U8** | Does the **title chevron** open Locker (file switcher) specifically, or a broader list-management sheet? | Blocks 027H partially — can defer chevron |

**027H can proceed without U1–U6.** Only U7/U8 touch 027H, and both have safe defaults (item count, title chevron wired to Locker Sheet).

---

## 35. Observed Facts vs Recommendations vs Unknowns

**FACTS (from source inspection):**
- The mobile toolbar (`lg:hidden`) currently shows: Expand/Collapse All, Hide, Checklist, Light/Dark, UnitToggle
- The wedge/icon strip has `aria-hidden` and no onClick — it is currently decorative only
- `item.weightOz`, `item.qty`, `calcTotalOz` are the real data fields — no `weight` or `totalWeight` stored fields exist
- `Sheet`, `Drawer`, `DropdownMenu`, `Dialog`, `Popover` primitives are all installed — no new package needed
- No search handler or state exists anywhere in production mobile code
- `MoveItem`, `addItem`, `removeItem`, `updateItem` all write to localStorage only (no direct API call)

**RECOMMENDATIONS (architectural judgment):**
- Hamburger → Sheet left slide-out
- Hamburger contents: all secondary controls listed in §10
- Bottom nav destinations via Drawer bottom-sheet
- Per-item expand: local `expandedItemId` state

**UNKNOWNS (require user decisions before implementation):**
- Green plus meaning
- Gear / Trips / More tab semantics
- Search circle assignment
- Whether title chevron = Locker specifically

---

## 36. Source-Only vs Runtime-Observed

All findings are **source-code observed** (static analysis via subagent exploration). No runtime instrumentation was performed. Handler names, state variables, and file paths are confirmed from actual source files. Component behavior (accordion rules, single-open, forceOpen sync) is confirmed from code, not from live interaction.

---

## 37. User Verification
`NOT APPLICABLE — DIAGNOSTIC ONLY`

---

## FINAL STATUS

| Check | Result |
|-------|--------|
| 027G DIAGNOSTIC COMPLETE | YES |
| APPLICATION CODE CHANGED | NO |
| PROTOTYPE CODE CHANGED | NO |
| DATABASE/API/AUTH CHANGED | NO |
| PACKAGE FILES CHANGED | NO |
| REPLIT.MD CHANGED | NO |
| .AGENTS/MEMORY CHANGED | NO |
| DEPLOYMENT CHANGED | NO |
| UNRELATED FILES CHANGED | NO |
| V3 VISUAL FREEZE CONFIRMED | YES |
| REAL MOBILE CONTROL INVENTORY COMPLETE | YES |
| ACTIVE HANDLER PATHS IDENTIFIED | YES |
| V3 MAPPING MATRIX COMPLETE | YES |
| HAMBURGER MAPPING RECOMMENDED | YES |
| SEARCH MAPPING IDENTIFIED | NO CURRENT FUNCTION |
| GREEN PLUS MAPPING IDENTIFIED | USER DECISION |
| LIST TITLE CHEVRON MAPPING IDENTIFIED | YES (Locker Sheet — medium confidence) |
| SUMMARY REAL-DATA MAPPING IDENTIFIED | YES |
| CATEGORY WEDGE MAPPING IDENTIFIED | YES |
| CATEGORY CHECKBOX MAPPING IDENTIFIED | YES |
| ITEM DETAIL MAPPING IDENTIFIED | YES |
| WEIGHT PATH IDENTIFIED | YES |
| QUANTITY PATH IDENTIFIED | YES |
| TOTAL PATH IDENTIFIED | YES |
| MOVE PATH IDENTIFIED | YES |
| PACK LIST NAV MAPPING | IDENTIFIED |
| SUMMARY NAV MAPPING | USER DECISION (which panels) |
| GEAR NAV MAPPING | USER DECISION |
| TRIPS NAV MAPPING | USER DECISION |
| MORE NAV MAPPING | USER DECISION |
| LIGHT/DARK FUTURE PLACEMENT IDENTIFIED | YES — hamburger |
| IMPERIAL/METRIC PLACEMENT IDENTIFIED | YES — hamburger |
| SHARE PLACEMENT IDENTIFIED | YES — hamburger |
| PRINT PLACEMENT IDENTIFIED | YES — hamburger |
| MOBILE DRAG/REORDER RECOMMENDED | NO |
| MOVE PRESERVED AS MOBILE RELOCATION | YES |
| ONE IMPLEMENTATION PROMPT RECOMMENDED | NO |
| TWO IMPLEMENTATION PROMPTS RECOMMENDED | YES |
| MATERIAL USER DECISIONS REQUIRED | YES (U1–U8, U1–U6 block 027I only) |
| MATERIAL UNCERTAINTY REMAINS | YES — bottom nav + green plus semantics |

`USER VERIFICATION = NOT APPLICABLE — DIAGNOSTIC ONLY`
