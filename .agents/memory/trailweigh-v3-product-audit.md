# TrailWeigh — MobileFunctionalV3 Exhaustive Product Audit
**Source:** `artifacts/pack-checklist/src/pages/MobileFunctionalV3.tsx` (7,925 lines)  
**Supporting sources:** `usePackData.ts`, `MobileWedgeCategory.tsx`, `LockerPanel.tsx`, `PreviewModal.tsx`, `NavDrawer.tsx`, `WeightSummary.tsx`, `exportPDF.ts`, `shareLink.ts`  
**Status:** Final pre-native-conversion state. No native-app rewrites have occurred. Read-only audit; no code was changed.

---

## 0. Purpose & Scope

MobileFunctionalV3 (`/v3` route, also the default mobile view) is the complete production-equivalent mobile web implementation of TrailWeigh. It is the product source of truth from which the React Native app (`pack-checklist-mobile`) was derived. This document describes every user-facing function exactly as it exists in that file — what each element looks like, what it does when tapped/swiped/long-pressed, what dialogs it spawns, and what state it mutates.

---

## 1. Visual Shell

### 1.1 Outer container

- Fixed, centred, 402 px wide, 100 dvh tall. Background colour `PAGE_BG = #F2EDE4` (warm off-white parchment).
- `overflow: hidden` on the shell — all scrolling is internal. No document-level scroll.
- Font family: `Inter Variable, Inter, system-ui, sans-serif` applied globally via `SANS` constant.
- Safe-area insets applied via utility classes (`tw-sa-*`) to ensure content clears iOS home-indicator and notch.

### 1.2 Layer stack (bottom to top, z-index)

| z-index | Layer |
|---------|-------|
| 0 | Main list scroll area |
| 5 | Sticky category headers (when open) |
| 7 | Add-Item accordion (inside open category) |
| 10 | Filter bar (locked slot, always visible) |
| 15 | List Summary bar |
| 20 | AppBar |
| 25 | Deck backdrop (frosted, when deck open) |
| 30 | Card deck panel |
| 35 | Home screen overlay / Master List screen overlay |
| 40 | Bottom navigation bar (BoxGroupBar) |
| 50–100 | Full-screen overlays (Checklist, Preview, Scanner, Summary, Share) |
| 100 | Navigation drawer |
| 200 | Dialogs (Save Chooser, Save As, Reset Confirm, Locker Delete, New List Name) |
| 201 | Locker Delete (elevated over Save Chooser when Save Chooser is open) |
| 205 | New List Name dialog |

---

## 2. AppBar

**Position:** Fixed, top of shell, full width, 58 px tall.

### 2.1 Layout (left → right)

| Slot | Element | Action |
|------|---------|--------|
| Left | Hamburger menu (☰, 44×44 tap area) | Opens Navigation Drawer |
| Centre | LogoMark (CheckSquare icon, 22 px, green `NAV_ACTIVE = #2A5740`) + "TrailWeigh" wordmark (18 px, 650 weight) | No action — decorative |
| Right | Six identity icons (each 36×36 tile, 18 px icon): Backpack, Train, Plane, Ship, Car, Package | All `aria-hidden`, no interactivity — decorative brand icons |

The six right-side icons are purely decorative. They do not open menus or perform any action when tapped.

---

## 3. List Summary Bar

**Position:** Fixed immediately below AppBar. Green background `SUMMARY_BG = #2A5740` at 94% opacity. Height: 66 px.

### 3.1 Elements

| Slot | Element | Behaviour |
|------|---------|-----------|
| Far left | Luggage icon tile (66×66, darker green bg) | No action — decorative |
| Centre-left | Active list name | Read-only display of `listName` state. Not tappable in this bar (rename is via item detail or category edit). |
| Centre | Large item count + "items" label | Reflects total item count across all categories. |
| Centre-right | Category count + selected count (checked items) | Read-only summary. |
| Right | Global expand/collapse chevron (ChevronDown / ChevronUp) | Toggles `allExpanded` state — when `true`, ALL categories open simultaneously and the Add Item bar creates items directly (no accordion). When `false`, one-at-a-time accordion mode. |

---

## 4. Filter Bar

**Position:** Fixed below the Summary bar, always visible ("locked slot"). White background, 46 px tall, 1 px bottom border.

### 4.1 Filter dropdown button

- Label: "Filter:" + current filter name (default: "Category").
- Left icon: SlidersHorizontal (14 px).
- Right icon: ChevronDown (14 px).
- Tap → opens filter dropdown overlay (positioned below the bar).

### 4.2 Filter options (dropdown)

| Option | Effect on list view |
|--------|---------------------|
| **Category** (default) | Shows category wedge bars with their items. |
| **Location** | Hides category bars; shows one wedge bar per named location. Items without a location remain in their category bar. Opening a location wedge shows: optional location photo (full-width), then items assigned to that location. |
| **Photo** | Shows only items that have a `photoDataUrl`. Items are still grouped inside their category accordion; items without photos render as normal rows; items with photos display their photo at full width (max 220 px tall) with Delete / Edit buttons beneath. |

**Closing the filter dropdown:** Tapping anywhere outside it, or tapping the dropdown button again. Opening a category accordion also closes the dropdown.

---

## 5. Category Bars (Category View)

Each category is represented by a single bar that serves as the accordion toggle.

### 5.1 Visual anatomy

- **Total height:** 64 px.
- **Left wedge:** 72 px wide, clip-path pentagon angled 17 px from the right edge. Coloured with the category's theme colour (from `getCategoryTheme(name, index)`). Contains: a Lucide category icon (white, 26 px) centred in the wedge.
- **Name + subtitle:** Category name (17 px, 650 weight, `PRIMARY = #1A2E1A`). Below it: item count + selected count string (e.g. "6 items · 2 selected").
- **Right weight display:** Current category weight (sum of checked items, formatted to unit, 13 px, muted). Hidden when weight is 0.
- **Right border/padding:** 14 px right gutter.

### 5.2 Tap: accordion toggle

Tapping anywhere on the bar (outside the swipe zone) opens or closes the category accordion. Only one category can be open at a time in normal mode. In `allExpanded` mode (global chevron toggled) all categories are open simultaneously.

When a category opens:
- Its header becomes sticky (`position: sticky`, `top: filterBarBottom`, `zIndex: 5`).
- Its items render in the space below the sticky header.
- The Add Item bar appears at the bottom of the item list.

### 5.3 Long-press: drag reorder (400 ms hold)

- A stationary 400 ms press anywhere on the bar (outside the right-40%-swipe zone) enters reorder mode.
- **Visual:** The pressed bar lifts (box-shadow deepens, `scale(1.015)`). Other bars slide up or down with CSS `translateY` to show where the dragged bar would land. Target slot dims to 0.55 opacity. The six-dot handle was **removed** before app conversion; long-pressing anywhere is the only reorder gesture.
- **Commit:** Releasing the bar drops it into the glide-indicated position. `reorderCategories()` is called. Haptic feedback (if device supports). A 400 ms `reorderJustHappenedRef` flag prevents accidental accordion toggle on release.
- **DOM order** stays fixed during drag; all movement is visual CSS transform only.

### 5.4 Left-swipe from right edge: Edit + Delete reveal

- Swipe zone: right 40% of the bar only.
- Swiping left ≥ the threshold reveals two action buttons (each 88 px wide):
  - **Edit** (green, `NAV_ACTIVE`): Opens the Category Direct-Edit Dialog (§13.2).
  - **Delete** (red, `#dc2626`): Routes to the Category Options Sheet delete sub-view (§13.3), which shows item count and a two-button confirm.
- Tapping anywhere outside the revealed buttons closes the swipe reveal.

### 5.5 "Long mode" bounded scroll

When a category's item list is taller than the available viewport height (space from sticky header bottom to Add Item bar top), the container switches to `maxHeight = availItemH` with `overflow: hidden` (accepts `scrollTop`). Two chevron buttons — ▲ and ▼ — appear in the Add Item bar row to page through the bounded viewport.

---

## 6. Item Rows (inside open category)

### 6.1 Visual anatomy

- Min-height: 44 px. No fixed height — expands when detail panel is open.
- **Checkbox area** (left): 44×44 px tap target. Visual checkbox: 20×20 px, rounded 5 px. Unchecked = transparent + 1.5 px border. Checked = solid `NAV_ACTIVE` green fill with a white check icon.
- **Name + qty area** (rest of row): Item name (14 px) + quantity display (e.g. "× 2"). Tapping this area opens the Item Detail Panel.

### 6.2 Checkbox tap

Toggles `item.checked`. This is the item's "included in pack" state. It controls:
- Whether the item is counted in weight totals.
- Whether it appears in the Checklist overlay (which filters to `checked: true` only).
- Weight summary calculations.

### 6.3 Left-swipe from right edge: Delete reveal

- Swipe zone: right 40% of the row.
- Swiping left ≥ threshold reveals one button: **Delete** (88 px, red).
- Tapping Delete → opens Item Delete Confirmation dialog (§13.1).

### 6.4 Item Detail Panel (expanded, below the row)

Tapping the name+qty area opens a detail panel that appears below the row. Only one item can be expanded at a time per category. The expanded item is highlighted (light background).

The detail panel contains the following rows (top to bottom):

| Row | Icon | Control | Behaviour |
|-----|------|---------|-----------|
| 1. Name | Pencil | `<input type="text">` (inline, autoFocus when opened via Add Item) | Commits on blur/Enter. Reverts on Escape. Calls `updateItem` with `{ desc }`. |
| 2. Weight | Hash | `<input type="number">` + unit label (oz or g) | Commits on blur. Uses a local draft state to prevent snap-back while typing. Converts: imperial stores oz, metric input is in g but stored as equivalent oz. Calls `updateItem` with `{ weightOz }`. |
| 3. Quantity | PackageOpen | `<select>` (options 1–20) | Immediate commit on change. Calls `updateItem` with `{ qty }`. |
| 4. Total | Check | Read-only display | `weight × qty` formatted to current unit. Never interactive. |
| 5. Move | ArrowRightLeft | `<select>` listing all other categories | Moving item to another category calls `moveItem(fromCat, toCat, itemId)`. |
| 6. Location | MapPin | `<select>`: "No location" + all named locations + "— Create New Location… —" | Selecting an existing location assigns `item.locationId`. Selecting "Create New Location…" opens the Create Location Dialog (§13.4). Clearing to "No location" removes `locationId`. |
| 7. Photo | Camera | **No photo:** "Add Photo" button. **Has photo:** "View Photo" + "Edit Photo" buttons | See §9.1. |
| 8. Inline photo viewer | — | Shown below row 7 when "View Photo" active | Dark background, photo at full row width, "✕ Close" button. |
| 9. Delete Item | Trash2 | "Delete Item" button (full width, red text, white bg, red border) | Opens Item Delete Confirmation dialog (§13.1). |

---

## 7. Add Item Bar

**Position:** At the bottom of every open category's content area. Min-height 44 px. 1 px top border.

### 7.1 Main button

- Icon: Plus (14 px, green) when accordion is closed; ChevronDown (14 px) when accordion is open.
- Label: "Add Item" (13.5 px, green, 500 weight).
- Tap:
  - **Normal mode (`allExpanded = false`):** Toggles the Add Item Accordion (§8). If accordion is already open for this category, closes it.
  - **All-expanded mode (`allExpanded = true`):** Immediately calls `addItem(catName)` — creates a blank item and expands it.

### 7.2 Overflow paging chevrons (long-mode only)

Visible only when `isCatLong` is true AND the category is open AND not in allExpanded mode. Two buttons appear to the right of the Add Item button, separated by a 1 px divider:

| Button | Icon | State | Behaviour |
|--------|------|-------|-----------|
| ▲ | ChevronUp (18 px) | Disabled when no content above | Scrolls the bounded item viewport up |
| ▼ | ChevronDown (18 px) | Disabled when no content below | Scrolls the bounded item viewport down |

Both are always rendered (never hidden when isCatLong); disabled state uses `aria-disabled`, `opacity: 0.35`, and `cursor: default`.

---

## 8. Add Item Accordion

Rendered inside the open category, above the Add Item Bar. Only visible when `addItemAccordionCat === catName` (i.e., the Add Item bar for this category was tapped in normal mode).

Three rows, each full-width, 44 px tall, with a top divider:

| Option | Behaviour |
|--------|-----------|
| **Name** | Calls `addItem(catName)` → creates blank item → expands its detail panel → focuses the Name input (row 1 of detail panel). |
| **Photo** | Calls `addItem(catName)` → creates blank item → expands it → immediately opens the Item Photo Edit Sheet (§9.1). |
| **Master List** | Calls `closeDeck()` then `pushScreen({ screen: 'master-list' })` — navigates to the Master List screen (§17). |

Closing the accordion: tapping the Add Item bar again, or tapping anywhere on a category header, or selecting any accordion option.

---

## 9. Photo Flows

### 9.1 Item photos

**Accessing:** From Item Detail Panel, row 7.

- **"Add Photo"** → Item Photo Edit Sheet (bottom sheet, §13.5):
  - "Take New Photo" → triggers `<input type="file" accept="image/*" capture="environment">` → camera.
  - "Upload New Photo" → triggers `<input type="file" accept="image/*">` → photo library.
  - Photo is compressed: max 800 px on longest side, JPEG at 72% quality. Stored as `dataUrl` in `item.photoDataUrl`.
  - Calls `updateItem` with `{ photoDataUrl }`.
  - On cancel: no change.

- **"View Photo"** → Expands inline photo viewer below the row. Shows the photo at full row width on a dark background. "✕ Close" collapses it.

- **"Edit Photo"** (when photo already exists) → Item Photo Edit Sheet with an additional option:
  - "Delete Photo" → calls `updateItem` with `{ photoDataUrl: undefined }`. Toast: "Photo removed".

### 9.2 Location photos

**Accessing:** In Location view (Filter: Location), each location wedge has a Camera button in its right area.

- Tap Camera → Location Photo Edit Sheet (§13.6):
  - "Take New Photo" / "Upload New Photo" → same compression pipeline as item photos → stored in `location.photoDataUrl`.
  - "Delete Location Photo" (if exists) → removes `photoDataUrl` from the location.
  - Toast: "Location photo saved" / "Location photo removed".

### 9.3 Camera and Photos buttons (Group 3 bottom bar)

Three cases based on current app state:

| State | Behaviour |
|-------|-----------|
| An item detail panel is expanded | Opens Item Photo Edit Sheet targeting that item. |
| A category is open but no item is expanded | Creates a blank item in the open category → expands it → opens Item Photo Edit Sheet targeting the new item. |
| No category is open | Opens Category Picker Sheet (§13.7) — lists all categories; tapping one creates a blank item there and opens Item Photo Edit Sheet. |

Camera button uses `capture="environment"` (rear camera). Photos button uses standard file picker (no capture attribute, allows choosing from library).

---

## 10. Navigation Drawer

**Opening:** Hamburger (☰) in AppBar top-left.  
**Slide direction:** Always from the **left** (regardless of handedness setting — confirmed in code comment).  
**Width:** 55% of shell width, minimum 160 px, maximum 240 px.  
**Closing:** Tap the ✕ in the drawer header, swipe left ≥ 50 px, or tap the backdrop.

### 10.1 Header

"TrailWeigh" wordmark + ✕ close button.

### 10.2 Navigation rows (5 rows)

| Row | Icon | Label | State | Action |
|-----|------|-------|-------|--------|
| 1 | Home | Home | Always active | Closes drawer; ensures Home screen overlay is visible (if it was closed, no automatic re-show — user sees the list). Actually navigates by calling `setScreenStack([])` to reset to list root. |
| 2 | Library | Master Library | **Disabled** ("Coming soon" badge) | No action. |
| 3 | Folder | My Lists | Active | Closes drawer; calls `openDeck('locker')`. |
| 4 | HelpCircle | Help & Tutorials | Active | Closes drawer; pushes `{ screen: 'footer-page', footerPageId: 'help' }`. |
| 5 | Settings | Settings | Active | Closes drawer; calls `openDeck('more')`. |

### 10.3 Footer: handedness toggle

At the bottom of the drawer. Two-state toggle button: Right-handed / Left-handed.

- The dot indicator inside the toggle pill moves left/right to show the current setting.
- Persisted to `localStorage` key `tw-handedness`.
- **Note:** The setting does not currently change which side the drawer slides from (always left, per code comment). Its future purpose (e.g. repositioning a contextual action) is not yet implemented in V3.

---

## 11. Bottom Navigation Bar (BoxGroupBar)

**Position:** Fixed at bottom of shell, always visible, 60 px tall (plus safe-area inset). `zIndex: 40`.  
**Background:** White with `backdrop-filter: blur(12px)` on the deck backdrop when a deck is open.

Four groups rotate in a continuous loop. Navigation between groups:
- Tap the **Next** (→) or **Back** (←) chevron at each end.
- Horizontal swipe ≥ 44 px on the bar itself triggers a group change.
- After a swipe of ≥ 44 px, releasing commits the change with haptic feedback (if device supports `navigator.vibrate`).
- Groups wrap: Next from Group 4 → Group 1; Back from Group 1 → Group 4.

### 11.1 Group 1 — Primary controls

`Locker | Summary | Add | Search | [Next→]`

| Button | Icon | Action |
|--------|------|--------|
| Locker | Folder | Opens/closes Locker deck (§12.1). |
| Summary | BarChart2 | Opens/closes Summary deck (§12.2). |
| Add | Plus | Opens/closes Add deck (§12.3). |
| Search | Search | Opens/closes Search deck (§12.4). |

### 11.2 Group 2 — Edit controls

`[←Back] | Undo | Redo | Reset | [Next→]`

| Button | Icon | State | Action |
|--------|------|-------|--------|
| Undo | Undo2 | Disabled (greyed) when no history | Calls `undo()`. Reverts last sandbox mutation. History limit: 30 entries. |
| Redo | Redo2 | Disabled when at head | Calls `redo()`. Re-applies undone mutation. |
| Reset | RotateCcw | Always enabled | Opens Reset Checklist Confirmation dialog (§13.10). |

### 11.3 Group 3 — Media controls

`[←Back] | Camera | Photos | Preview | [Next→]`

| Button | Icon | Action |
|--------|------|--------|
| Camera | Camera | See §9.3 (contextual — targets expanded item, open category, or shows picker). |
| Photos | Image | Same as Camera but opens file library (no capture attribute). |
| Preview | Printer | Opens Preview overlay (§15.2). |

### 11.4 Group 4 — Persistence controls

`[←Back] | Save | Share | More | [→Next]`

| Button | Icon | Action |
|--------|------|--------|
| Save | Save | Opens Save Chooser dialog (§13.8). |
| Share | Share2 | Navigates to Share screen (§16). |
| More | MoreHorizontal | Opens/closes More deck (§12.5). |

**Note:** Group 4 has BOTH a Back (←) and a Next (→) chevron (added in R0080) so Group 4 wraps forward to Group 1.

---

## 12. Card Decks

A card deck is a bottom-rising panel that appears above the navigation bar. Only one deck can be open at a time. Decks are conditionally rendered — when closed, they have no DOM presence and cannot intercept input.

**Anatomy:**
- Cards stack vertically. Each inactive card shows a 68 px "peek" bar (title strip with icon).
- The active card is at the top of the deck in "operational position" — it expands to show its content.
- A ✕ button in the deck header closes the entire deck.

**Inactive card interaction:**
- Tap = activate the card (move it to operational position). Tap-only — drag-to-lift was removed in R0073/R0074.
- Vertical drag on inactive bars: scrolls the deck if it overflows (non-overflowing deck ignores vertical drag).
- Disabled cards (e.g. Search deck): `cursor: not-allowed`, muted content, "not available yet" tooltip.

### 12.1 Locker Deck

**Trigger:** Group 1 → Locker button.

**Cards:** One card per saved Locker entry, newest first (`[...lockerEntries].reverse()`). If no saved lists, an empty-state note: "No saved lists yet. Use More → List Actions → Save to add one."

**Each inactive bar shows:**
- Folder icon
- List name (title)
- Saved date + item count (subtitle)

**Each active card shows:**
- Saved date
- Category count + item count + selected count
- Selected weight (if > 0)
- **"Load This List"** button (green, full-width): Loads the entry's store into the sandbox. Sets `listName` to the entry's name. Sets `listKind`. Sets `activeLockerEntryId` to track the loaded entry for subsequent Save operations. If it is a Photo List, stores the id in `sessionStorage` key `tw-v3-active-photo-list-id`. Shows toast: `Loaded "[name]"`. Closes the deck.
- **"Delete List"** button (red border, transparent bg): Opens Locker Delete Confirmation dialog (§13.11).

### 12.2 Summary Deck

**Trigger:** Group 1 → Summary button.

**Cards:** 2 fixed cards.

| Card | Icon | Title | Subtitle | Content |
|------|------|-------|----------|---------|
| 1 | Scale | Pack Summary | "Base, expendables, and total weight" | `WeightSummary` component rendered flat (inner collapsible header stripped, always open). Shows: Base Weight total, one row per non-base category with its weight, Grand Total. |
| 2 | BarChart2 | Weight Distribution | "Category share of pack weight" | `MobileWeightDistribution` component: donut pie chart + legend. Uses each category's theme colour (from `getCategoryTheme`). No palette picker (palette picker exists only in the desktop version). |

### 12.3 Add Deck

**Trigger:** Group 1 → Add button.

**Cards:** 4 fixed cards.

#### Card 1: Add Item
- **Icon:** Plus. **Subtitle:** "Add a new item to a category".
- **Content:** A scrollable list of all current categories. Each category is a full-width tap target (category theme colour + name).
- **Tap any category:** Calls `addItem(catName)`, shows toast "Item added to [catName]", closes deck. The new blank item is expanded and its Name input is focused.

#### Card 2: Add Category
- **Icon:** LayoutList. **Subtitle:** "Add a new category to this list".
- **Content:** A text input ("Category name") + "Add" button.
- **Tap Add (or Enter):** Calls `addCategory(name)`. Closes deck. Shows toast "Category added".
- **"Add" is disabled** until the input has at least one non-whitespace character AND the name does not already exist.

#### Card 3: Scan / Import
- **Icon:** ScanLine. **Subtitle:** "Import gear from a PDF or Word file".
- **Content:** A single "Open Scan Gear List" button.
- **Tap:** Closes deck, sets `showScanner = true` → opens Scanner overlay (§15.4).

#### Card 4: New List
- **Icon:** FilePlus. **Subtitle:** "Start a brand new list".
- **Content:** Two full-width tiles:
  - **Standard List** (ListChecks icon, dark green bg): "Track items with weights and checkboxes."
  - **Photo List** (Camera icon, lighter green bg): "Capture photos to build your list visually."
- **Tap either tile:** Closes deck. Sets `newListKindForName` to `'standard'` or `'photo'`. Opens New List Name Dialog (§13.12).

### 12.4 Search Deck

**Trigger:** Group 1 → Search button.

**Cards:** 3 fixed cards, all disabled.

| Card | Label | State |
|------|-------|-------|
| 1 | Search Current List | Disabled — "Not available yet" |
| 2 | Search Locker | Disabled — "Not available yet" |
| 3 | Search Catalog | Disabled — "Future feature" |

All three cards are rendered with `disabled: true`, `cursor: not-allowed`, muted text, and the aria-label suffix "— not available yet".

### 12.5 More Deck

**Trigger:** Group 4 → More button.

**Cards:** 4 fixed cards.

#### Card 1: List Actions
- **Icon:** ClipboardList. **Subtitle:** "Save, print, or check off your list".
- **Content:**
  - **Save** (Save icon) → Opens Save Chooser dialog (§13.8).
  - **Checklist** (CheckSquare icon, sublabel: "Track trail progress separately") → Closes deck, opens Checklist overlay (§15.1).

#### Card 2: List Settings
- **Icon:** Settings. **Subtitle:** "Units and display options".
- **Content:**
  - **Unit toggle row:** "Imperial" / "Metric". Current system shown; tap the inactive one to switch. Calls `setSystem()` in `UnitContext`. Persisted by the context.

#### Card 3: Help & TrailWeigh
- **Icon:** HelpCircle. **Subtitle:** "Tutorials, about, and feedback".
- **Content (6 link rows, each with a ChevronRight):**
  1. Help → `footer-page: 'help'`
  2. About TrailWeigh → `footer-page: 'about'`
  3. How It Works → `footer-page: 'how-it-works'`
  4. Sources & References → `screen: 'sources'`
  5. Report a Problem → `footer-page: 'report'`
  6. Contact → `footer-page: 'contact'`

#### Card 4: Account & Privacy
- **Icon:** User. **Subtitle:** "Your account, privacy, and legal".
- **Content (5 link rows):**
  1. Privacy Policy → `footer-page: 'privacy'`
  2. Terms of Use → `footer-page: 'terms'`
  3. Delete Account → `footer-page: 'delete-account'` (authentication-gated in the footer page itself)
  4. Affiliate Disclosure → `footer-page: 'affiliate'`
  5. Accessibility → `footer-page: 'accessibility'`

---

## 13. Dialogs and Bottom Sheets

All dialogs are bottom sheets (rounded top corners 16 px, slide up from bottom). Backdrop tap closes. Escape key closes. Tab is trapped within the sheet. All have `role="dialog"` and `aria-modal="true"`.

### 13.1 Item Delete Confirmation

**Trigger:** Swipe-reveal Delete on any item row → tap Delete.

- **Title:** "Delete [item name]?"
- **Body:** "permanently remove… Other lists not affected."
- **Buttons:** Cancel (secondary) | Delete Item (red, `#dc2626`)
- **Focus:** Opens on Cancel button; Tab cycles between Cancel and Delete Item only.
- On Escape: closes without deleting.
- On "Delete Item": calls `deleteItem(cat, id)`. Closes dialog. Returns focus to the Add Item button of the category.

### 13.2 Category Direct-Edit Dialog

**Trigger:** Swipe-reveal Edit on a category bar.

- **Title:** "Edit Category"
- **Body:** "New name for [catName]:"
- **Input:** Text input (autoFocus, pre-filled with current name).
- **Buttons:** Cancel | Save (disabled until name is non-empty AND different from current name).
- On Save: calls `renameCategory(old, new)`. Closes dialog.
- On Escape: closes without saving.

### 13.3 Category Options Sheet (legacy path)

**Trigger:** An older code path accessible via specific UI states (preserved but no longer the primary rename/delete path in V3 UX). Opens as a Radix Sheet from the bottom.

- **Options:**
  - "Add Item" → calls `addItem(catName)`.
  - "Rename Category" → shows rename sub-view: text input + Save / Cancel.
  - "Delete Category" → shows delete sub-view: shows item count warning + "Delete Category" / Cancel.

### 13.4 Create New Location Dialog

**Trigger:** Selecting "— Create New Location… —" in the item detail panel Location dropdown.

- **Title:** "New Location"
- **Input:** "Location name" text field (autoFocus).
- **Buttons:** Cancel | Save (disabled until non-empty).
- On Save: Creates a new location with a UUID + the entered name. Assigns the location to the triggering item (`item.locationId = newLocId`). Closes dialog.

### 13.5 Item Photo Edit Sheet

**Trigger:** Tapping "Add Photo" or "Edit Photo" in the item detail panel; or via Camera/Photos bottom bar (§9.3).

- **Options:**
  - "Take New Photo" → triggers camera input.
  - "Upload New Photo" → triggers file library input.
  - "Delete Photo" (only shown when photo already exists) → calls `handlePhotoDelete`.
  - "Cancel" → closes sheet.

Photo compression: max 800 px, JPEG 72% quality, stored as `item.photoDataUrl`.

### 13.6 Location Photo Edit Sheet

**Trigger:** Camera button on a location wedge in Location view.

- **Options:**
  - "Take New Photo" / "Upload New Photo" → compressed to location.
  - "Delete Location Photo" (only when exists) → removes location.photoDataUrl.
  - "Cancel".

### 13.7 Category Picker Sheet

**Trigger:** Camera or Photos button (Group 3) when no category is open.

- **Title:** "Take a Photo" or "Choose a Photo" (based on which button).
- **Content:** Full-width buttons, one per category (name + category theme colour).
- **Tap any category:** Creates a blank item in that category → opens Item Photo Edit Sheet.
- **Cancel** button at bottom.

### 13.8 Save Chooser Sheet

**Trigger:** Group 4 → Save; or More deck → Card 1 → Save.

- **Header:** "SAVE LIST" (uppercase, grey, centred).
- **Buttons (top to bottom):**
  - **"Save"** (green, full-width): If `activeLockerEntryId` is set, updates the existing entry in the Locker. If not, creates a new entry with a timestamp-based name (e.g. "Backpacking Trip — Aug 23, 2026 3:42 PM"). Shows toast "List saved".
  - **"Save As"** (outlined, white bg): Opens Save As Dialog (§13.9).
  - **"Cancel"** (text-only, grey): Closes without saving.

### 13.9 Save As Dialog

**Trigger:** Save Chooser → "Save As".

- **Title:** "Save As"
- **Body:** "Enter a name for the new copy. It will be saved independently."
- **Input:** Text field (autoFocus, pre-filled with the current list name).
- **Buttons:** Cancel | "Save Copy" (green).
- On "Save Copy": Creates a new Locker entry with the entered name. Sets `activeLockerEntryId` to the new entry's id. Shows toast "Saved as '[name]'". Closes both dialogs.
- Enter key also triggers Save Copy.

### 13.10 Reset Checklist Confirmation

**Trigger:** Group 2 → Reset.

- **Title:** "Reset Checklist?"
- **Body:** "Clear all checked/packed marks in this list? Your items, categories, quantities, weights, and saved list will not be deleted."
- **Buttons:** Cancel | "Reset Checks" (amber: `#b45309`).
- On "Reset Checks": Sets `item.checked = false` for every item in every category. Clears undo history for this action (it is a bulk reset). Shows toast "Checked items cleared".
- **Note:** Does NOT delete items, categories, weights, names, or any saved Locker entry.

### 13.11 Locker Delete Confirmation

**Trigger:** Locker deck active card → "Delete List" button.

- **Title:** "Delete Saved List?" (red, `#dc2626`).
- **Body:** `Delete "[name]"? This removes the saved list only. Items in your Master Library will not be deleted.`
- **Buttons:** Cancel | "Delete List" (red, `#dc2626`).
- On "Delete List": Removes the entry from the Locker. If the deleted entry was the currently active (`activeLockerEntryId`), clears `activeLockerEntryId`. Shows toast "List deleted".

### 13.12 New List Name Dialog

**Trigger:** Add deck → Card 4 → Standard List or Photo List tile.

- **Title:** "Name your Photo List" (photo) or "Name your new list" (standard).
- **Body:** "This list will reopen in Photo List mode after you save it." (photo) or "Start with a clean, empty gear list." (standard).
- **Input:** "List name" text field (autoFocus, empty).
- **Buttons:** Cancel | "Create List" (green, disabled until non-empty).
- On "Create List": Calls `handleCreateNewList()`. Clears the sandbox (items, order, meta, locations, photoListCaptureDataUrl). Sets `listName` to the entered name. Sets `listKind` to `'standard'` or `'photo'`. Clears `activeLockerEntryId`. Closes dialog.
- Backdrop tap or Escape closes without creating.

---

## 14. Location View

**Activated by:** Filter dropdown → "Location".

Shows one wedge bar per named location. Items without a location are NOT shown in this view. Items with a location are hidden from the Category view while Location view is active.

### 14.1 Location wedge bar

Same wedge geometry as category bars (72 px, angled). Theme colour and icon from `getCategoryTheme(name, index)`.

- **Right elements:**
  - Pencil icon button → Location Rename Dialog.
  - Camera icon button → Location Photo Edit Sheet (§13.6).
- **Tap bar:** Accordion toggle. Only one location open at a time.

### 14.2 Location accordion content

- **Location photo** (if exists): Full-width, cover-cropped, rounded, with a pencil overlay button to edit.
- **Item rows:** All items assigned to this location. Each row shows: item name + parent category name + weight. An "Edit" button → switches Filter back to "Category" view and opens the item's category accordion with that item expanded.

### 14.3 Location Rename Dialog

- **Title:** "Rename Location"
- **Input:** Pre-filled with current name.
- **Buttons:** Cancel | Save.
- On Save: calls `renameLocation(locId, newName)` which updates all items that reference this location.

---

## 15. Overlays (Full-Screen)

All overlays occupy the full shell area (position: fixed, inset: 0) at high z-index. They render above the main list.

### 15.1 Checklist Overlay

**Purpose:** Trail progress tracking, separate from item selection (checked state).

**Trigger:** More deck → Card 1 → Checklist.

- **Header (left → right):** ← Back | "Checklist" | Clear | Printer | Share2.
- **Banner:** "Showing your selected items. Tick boxes track trail progress separately."
- **Content:** `PreviewBody` component, `filterToChecked = true` — only items with `item.checked = true` are listed. Items are grouped by category.
- **Checkboxes:** These use a SEPARATE `checklistUse` tick state (not `item.checked`). Ticking here tracks trail progress without affecting pack weight calculations. Ticked items show a green checkbox; unticked show an empty box.
- **Clear button:** Clears all `checklistUse` ticks. Does NOT touch `item.checked`.
- **Printer icon:** Calls `generatePackPDF(...)` (§18) and `window.print()`.
- **Share2 icon:** Calls `closeDeck()` and navigates to Share screen (§16).
- **← Back:** Closes overlay, returns to list.

### 15.2 Preview Overlay

**Purpose:** Full-list printable view showing ALL items (checked and unchecked).

**Trigger:** Group 3 → Preview.

- **Header:** ← Back | "Preview" | Printer.
- **Banner:** "All items in this list — tap the printer icon to print or download."
- **Content:** `PreviewBody` component, `filterToChecked = false` — all items shown. Groups by category.
- **Checkboxes:** Preview-local state only, never written back to sandbox. Used to mark items in the preview view. Not the same as `item.checked` or `checklistUse`.
- **Clear Checks / Undo pill:** Full-width green button below the banner; clears all preview-local checkbox state. Shows/hides based on whether any preview checkboxes are ticked.
- **Printer icon:** Calls `generatePackPDF(...)` + `window.print()`.
- **← Back:** Closes overlay.

### 15.3 Summary Overlay

**Purpose:** Standalone full-screen weight breakdown.

**Trigger:** Internal (e.g., from a footer page link or direct call).

- **Header:** ← | "Summary".
- **Content:**
  - `WeightSummary` (forced open): Base Weight + non-base categories + Grand Total.
  - `MobileWeightDistribution`: Donut pie chart + legend using category theme colours. No palette selector.

### 15.4 Scanner Overlay

**Purpose:** Import gear items from a PDF or Word document.

**Trigger:** Add deck → Card 3 → "Open Scan Gear List".

- **Header:** ← | "Scan Gear List".
- **Content:** `ImportGearPanel` component — full UI for uploading and parsing a PDF or Word file, reviewing extracted items, and assigning them to categories.
- **← Back:** Closes overlay.

---

## 16. Share Screen

**Trigger:** Group 4 → Share.

Pushes `{ screen: 'share' }` onto `screenStack` — renders as a full-screen view above the list.

- **Header:** ← Back (pops screen, clears `shareLink`) | "Share This List".
- **On mount:** Calls `buildShareURL(packData)` which POSTs `{ payload: <serialised store> }` to `/api/links` → returns a `/s/<id>` short URL.
- **Share loading spinner:** While POST is in flight, a modal overlay shows "Generating share link…"
- **Success state:**
  - URL text (monospace, selectable, `data-testid="share-link"`).
  - **"Copy Link"** button → `navigator.clipboard.writeText(url)`. Button turns green and shows "Copied!" for 2 seconds.
  - **"Share via…"** button (only if `navigator.share` is available) → calls Web Share API with URL and title.
- **Failure state:** "Share link could not be generated. Sign in required to share a list." The share feature requires a signed-in user; unauthenticated users see this error.

---

## 17. Master List Screen

**Trigger:** Add deck → Card 4 (from accordion Option 3: Master List), or Home screen → Master List bar.

Pushes `{ screen: 'master-list' }` onto `screenStack`.

- **Header:** ← Back.
- **Content:** `MasterListScreen` component — a browseable library of gear items.
- **Note:** The "Add to category" callback is **not wired** in V3 (browsing only). Items can be viewed but not transferred to the active list from this screen.
- **← Back:** Pops screen.

---

## 18. Home Screen

**Position:** Absolute overlay inside the shell, `zIndex: 35` (below bottom bar at 40). Shown when `screenStack` is empty AND `showHome` state is true (set on initial load).

### 18.1 Hero section

- Background: `SUMMARY_BG = #2A5740` (dark green), 90 px tall.
- Left: "TrailWeigh" (white, 20 px, 700 weight) + "Checklist Engine" tagline (13.5 px, 80% opacity).
- Right: "Create your own custom checklist or let AI do it for you!" (13 px).

### 18.2 Use-case grid

2-column icon grid with 6 use-case tiles: Backpacking, Travel, Camping, Cargo, Moving, Inventory. Purely decorative — not interactive.

### 18.3 Destination bars (7 rows)

| Row | Label | State | Action |
|-----|-------|-------|--------|
| 1 | Start Here | Active | Closes Home; calls `openDeck('add')` |
| 2 | Tutorials | **Disabled** ("Soon" badge) | No action |
| 3 | Controls | **Disabled** ("Soon" badge) | No action |
| 4 | My Lists | Active | Closes Home; calls `openDeck('locker')` |
| 5 | Master List | Active | Closes Home; calls `pushScreen({ screen: 'master-list' })` |
| 6 | Locations | **Disabled** ("Soon" badge) | No action |
| 7 | Settings | Active | Closes Home; calls `openDeck('more')` |

"Closing Home" sets `showHome = false` and navigates behind the overlay so the main list becomes visible.

---

## 19. Footer Pages

**Trigger:** Links in More deck cards, or Navigation Drawer rows.

Each footer page pushes `{ screen: 'footer-page', footerPageId: <id> }` onto `screenStack`. The screen renders with a ← Back header and the content component for that page.

| footerPageId | Title | Content component |
|-------------|-------|-------------------|
| `help` | Help & Tutorials | `HelpContent` |
| `about` | About TrailWeigh | `AboutContent` |
| `how-it-works` | How It Works | `HowItWorksContent` |
| `report` | Report a Problem | Feedback form or contact info |
| `contact` | Contact | Contact info |
| `privacy` | Privacy Policy | Legal text |
| `terms` | Terms of Use | Legal text |
| `delete-account` | Delete Account | Auth-gated; requires sign-in to proceed |
| `affiliate` | Affiliate Disclosure | Disclosure text |
| `accessibility` | Accessibility | Accessibility statement |

Sources & References is handled separately as `{ screen: 'sources' }` → `SourcesContent` component.

---

## 20. Photo List Mode

Photo Lists are a distinct list kind (`listKind: 'photo'`). Created via Add deck → Card 4 → "Photo List".

### 20.1 Empty state (no categories yet)

When `sandbox.order.length === 0` and `listKind === 'photo'`, a welcome card appears:
- "Your Photo List is ready" (Camera icon, 18 px bold).
- If no pending capture: "Add your first photo when you are ready to begin organizing this list."
- If `photoListCaptureDataUrl` exists (a photo was captured but not yet assigned):
  - Shows the pending photo thumbnail (168 px tall, cover-cropped).
  - "Choose Location or Item" button → opens Photo List Assignment Sheet (§20.3).
- "Visual destinations" 2-col grid: shows thumbnails of any photographed locations, tappable → switches to Location view with that location open.
- Primary CTA: "Add Photo" (green, full-width) or "Replace Photo" if pending capture exists → opens Photo List Source Sheet (§20.2).

### 20.2 Photo List Source Sheet

**Trigger:** "Add Photo" on empty state card, Camera/Photos bar (Group 3) when list is a Photo List, or "Add another photo" inline button.

- "Add a Photo" title.
- **Camera** → triggers camera capture. Photo stored as `sandbox.photoListCaptureDataUrl`.
- **Photos** → triggers file picker. Same storage.
- **Cancel**.

After capture: If no existing categories, shows empty-state card again. If categories exist, shows inline "Choose Location or Item" button. Either way, capture is held at list level until the user assigns it.

### 20.3 Photo List Assignment Sheet

**Trigger:** "Choose Location or Item" (or after capture, auto-shown).

Shows the captured photo thumbnail + "What is this photo?" prompt.

| Option | Next step |
|--------|-----------|
| **Location** | Opens Photo List Location Name Dialog (§20.4) |
| **Item** | Opens Photo List Item Destination Sheet (§20.5) |
| **Decide later** | Closes sheet; capture remains in `sandbox.photoListCaptureDataUrl` for later assignment |

### 20.4 Photo List Location Name Dialog

- "Name this location" title.
- Text input for location name.
- Back / Save Location buttons.
- On Save: Creates a new location with UUID + entered name + the captured photo as `location.photoDataUrl`. Clears `sandbox.photoListCaptureDataUrl`. Auto-switches to Location view with the new location open. Toast: `Location "[name]" saved`.

### 20.5 Photo List Item Destination Sheet

"Where does this item belong?" title.

- 2-column grid of location tiles: "Unassigned" + all photographed locations (photo thumbnail + name).
- **Tap any tile:** Creates a new item with the captured photo in a category named `PHOTO_LIST_ITEMS_CATEGORY` (auto-created if not present, `countsToBase: true`). Sets `item.locationId` to the chosen location (or leaves undefined for Unassigned). Clears `sandbox.photoListCaptureDataUrl`. Switches to Category view, opens the items category, expands the new item, focuses its Name input. Toast: "Photo assigned to location" or "Photo item saved as Unassigned".

### 20.6 Inline "Add another photo" bar

When `listKind === 'photo'` AND categories already exist, a green-bordered "Add another photo" (Camera icon) button appears above the category list, always visible.

---

## 21. Weight System

### 21.1 Storage

All weights are stored as **ounces** (`item.weightOz: number`) internally, regardless of the active unit system.

### 21.2 Display (imperial)

- Input label: "oz"
- Display: if < 16 oz → show as oz (e.g. "4.5 oz"); if ≥ 16 oz → show as lb (e.g. "2.8 lb")
- Totals: same threshold logic.

### 21.3 Display (metric)

- Input label: "g"
- Input value: displayed as grams (converted from stored oz)
- Display: if < 1000 g → show as "g"; if ≥ 1000 g → show as "kg"
- Storage: converts back to oz on commit.

### 21.4 Toggle

More deck → Card 2 (List Settings). Persisted via `UnitContext`. Affects all weight displays and inputs across the entire app simultaneously.

---

## 22. Save and Persistence Model

### 22.1 Sandbox isolation

MobileFunctionalV3 reads from production `localStorage` ONCE on mount (key: `pack-checklist-v5-${userId}` or `pack-checklist-v5-guest`) into a local `sandbox` state. All subsequent mutations affect only this in-memory sandbox state. The production store is never mutated during a V3 session except via an explicit Save action.

### 22.2 Locker

Saved lists are stored in `localStorage` key `trailweigh:locker` as an array of `LockerEntry` objects. Each entry contains: `id`, `name`, `savedAt`, `store` (items/order/meta/locations/photoListCaptureDataUrl), `listKind`, plus visual configuration fields (`background`, `bgFade`, `bgTone`, `bgSize`, `chartPaletteKey`, `barColor`, `barFont`, `barTextColor`, `barTransparency`).

### 22.3 Active entry tracking

`activeLockerEntryId` state tracks which Locker entry the current sandbox corresponds to. Set when loading from Locker or after Save/Save As. Used by Save to decide whether to update existing vs. create new.

### 22.4 Photo List session tracking

`sessionStorage` key `tw-v3-active-photo-list-id` stores the active Locker entry ID for Photo Lists, so it survives a page reload (session only, not cross-tab).

---

## 23. Undo / Redo System

### 23.1 Operations tracked

Every call to `mutateSandbox()` (item add, item update, category add, category rename, reorder) pushes a snapshot to the undo history. `mutateSandboxEdit()` (used for "edit" mutations — weight/name changes) additionally auto-navigates to Group 2 of the bottom bar (where Undo/Redo are visible).

### 23.2 History limit

30 entries (vs. 200 in the production `usePackData` hook). Oldest entries are dropped when limit is reached.

### 23.3 Controls

- **Undo** (Group 2): Greyed and disabled when history is empty. Each tap reverts one mutation.
- **Redo** (Group 2): Greyed and disabled when at the most-recent state. Each tap re-applies one reverted mutation.
- Redo history is cleared by any new mutation (standard linear undo model).

---

## 24. Toast Notifications

- **Position:** Fixed, horizontally centred, 76 px above bottom of shell.
- **Appearance:** Dark green (`TOAST_BG = #2A5740`), white text, 12 px border-radius, 14 px font.
- **Duration:** 3000 ms auto-dismiss.
- **Interaction:** `pointer-events: none` — passes through to the list below.
- **Queue:** Single toast; a new toast replaces any currently showing one (resets the 3 s timer).

**Representative toasts:**
- "Item added to [category]"
- "Category added"
- "Loaded '[name]'"
- "List saved"
- "Saved as '[name]'"
- "Checked items cleared"
- "List deleted"
- "Photo removed"
- "Location photo saved"
- "Location '[name]' saved"
- "Photo assigned to location"
- "Photo item saved as Unassigned"

---

## 25. PDF Generation

**Function:** `generatePackPDF(title, items, order, meta, system)` in `exportPDF.ts`.

**Format:** A4 portrait, jsPDF.

**Contents:**
1. List name (title, bold, 18 pt).
2. Generation date (13 pt, grey).
3. Weight summary table (Base Weight, non-base totals, Grand Total).
4. Category blocks (heading + item rows). Only items with `item.checked = true` are included.
5. Each item row: empty checkbox square (for manual pencil-marking) + Type column + Name column + Weight column.
6. Footer: "Generated by TrailWeigh" + URL.

**File name:** `pack-checklist.pdf`.

**Also triggers:** `window.print()` for browser print dialog in addition to the download.

---

## 26. Share Link Architecture

**Function:** `buildShareURL(packData)` in `shareLink.ts`.

- POSTs `{ payload: serialisedStore }` to `/api/links`.
- Returns `/s/<id>` short URL.
- No hash-URL fallback — server-side storage is required.
- Requires an authenticated user. Unauthenticated requests result in an error response; the Share screen shows "Sign in required to share a list."
- `buildLiveShareURL()` creates live links (`{ type: 'live-locker' }`) — used by the production desktop checklist, not exposed in the V3 Share screen UI.

---

## 27. Demo / Initial Data

When no saved data is found in `localStorage` on mount (first-time users or cleared storage), the sandbox is pre-populated with demo data:

- **6 categories** in this order: Backpack, Clothing, Toiletries, Electronics, Shelter, Kitchen.
- **~19 sample items** distributed across categories with realistic weights (e.g. "Osprey Atmos 65 AG" at 4 lb 14 oz, "Tent" at 2 lb 5 oz, etc.).
- Several items are pre-checked (`item.checked = true`).

---

## 28. Accessibility

### 28.1 Keyboard navigation

- All interactive elements have `tabIndex` and `onKeyDown` (Enter/Space activate, Escape closes dialogs).
- Dialogs trap Tab focus within their focusable descendants.
- Focus is returned to the triggering element after a dialog closes.

### 28.2 ARIA

- Category bars: `aria-expanded` reflects accordion state.
- Add Item button: `aria-expanded` reflects accordion state.
- Inactive deck cards: `aria-disabled` + `aria-label` suffix "— not available yet".
- Chevron paging: `aria-disabled` + `disabled` on boundary.
- Overlay containers: `aria-hidden` on the background when a full-screen overlay is active.
- Navigation bar groups: `aria-hidden` on non-active groups; `aria-label` on each NavBox.

### 28.3 Known gaps (documented in code)

- **Drag-to-reorder** (category long-press): No keyboard equivalent exists. Code comments flag this as a "SERIOUS a11y gap" — an acknowledged open issue.

---

## 29. Constants Reference

| Constant | Value | Usage |
|----------|-------|-------|
| `PAGE_BG` | `#F2EDE4` | Shell background |
| `PRIMARY` | `#1A2E1A` | Primary text |
| `SECONDARY` | `#4A6741` | Secondary text |
| `MUTED` | `#8E9E8A` | Disabled / hint text |
| `NAV_ACTIVE` | `#2A5740` | Green — active elements, buttons, checkboxes |
| `SUMMARY_BG` | `#2A5740` | Green — Summary bar + Hero bg |
| `CARD_BG` | `#FAFAF8` | Card/sheet surface |
| `CARD_BORDER` | `#E5E0D8` | Card border colour |
| `DIVIDER` | `#E5E0D8` | Row dividers |
| `TOAST_BG` | `#2A5740` | Toast background |
| `CHECKLIST_RIGHT_INSET` | `14px` | Right padding for item rows |
| `BAR_PEEK_H` | `68px` | Deck inactive card height |
| `TAP_MAX_PX` | `8px` | Max movement for a gesture to count as a tap |
| `DRAG_SLOP_PX` | `5px` | Movement threshold before a scroll gesture is locked in |
| `PHOTO_LIST_ITEMS_CATEGORY` | `"Items"` | Auto-created category for Photo List item assignments |
| `ACTIVE_PHOTO_LIST_KEY` | `"tw-v3-active-photo-list-id"` | sessionStorage key for Photo List identity |
| `LOCKER_KEY` | `"trailweigh:locker"` | localStorage key for saved lists |

---

*End of audit. All content derived from direct source-code reading. No assumptions or inferences from external documentation.*
