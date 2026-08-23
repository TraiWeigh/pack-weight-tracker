# TrailWeigh Native — Migration Inventory
**v3 source:** `artifacts/pack-checklist/src/pages/MobileFunctionalV3.tsx`  
**Native target:** `artifacts/pack-checklist-mobile/`  
**Last updated:** 2026-08-23 (R0114 complete)

---

## Status Legend
| Symbol | Meaning |
|--------|---------|
| ✅ | Ported and wired |
| 🔶 | Partial / degraded parity (noted) |
| ❌ | Not yet started |
| 🚫 | Out of scope (documented decision) |

---

## Data Layer

| Feature | Status | Notes |
|---------|--------|-------|
| GearItem model (sub/desc/weightOz/qty/checked/expendable) | ✅ | `PackDataContext.tsx` |
| PackState by category | ✅ | AsyncStorage key `pack-checklist-mobile-v1` |
| categoryOrder (runtime, not static) | ✅ | `twm-catorder`; passed from context |
| listName persistence | ✅ | `twm-listname` |
| Seed / initial data | ✅ | `data/initialData.ts` |
| EXCLUSIVE_GROUPS (one Tent/one Backpack active) | ✅ | Enforced in `toggleItem` in context |
| Undo/Redo (30-step history on gear mutations) | ✅ | `mutate()` pattern; `undo`/`redo` exported |
| toggleItem bypasses undo (v3 parity) | ✅ | Matches v3 design decision |
| listName bypasses undo (v3 parity) | ✅ | User metadata, not pack data |
| Locker — save/load multiple lists | ✅ | `twm-locker-v1`; `NativeLockerEntry[]` |
| Locker — active entry tracking | ✅ | `twm-active-locker-id` |
| Locker — save, saveAs, load, delete, rename, new list | ✅ | All in context + LockerModal |

---

## AppBar

| Feature | Status | Notes |
|---------|--------|-------|
| Hamburger icon | ✅ | Visual only (no drawer) |
| TrailWeigh logo (CheckSquare + wordmark) | ✅ | `checkbox-outline` + `PlusJakartaSans_600` |
| 6 decorative shortcut icons | ✅ | Non-functional (v3 aria-hidden) |
| Safe-area paddingTop | ✅ | `useSafeAreaInsets()` |

---

## ListSummaryHero

| Feature | Status | Notes |
|---------|--------|-------|
| Luggage icon tile (66×66) | ✅ | |
| List name display | ✅ | |
| List name tap-to-edit | ✅ | `Alert.prompt` (iOS); graceful fallback Android |
| Pencil hint icon beside name | ✅ | `pencil-outline` at 11pt opacity 0.45 |
| Total item count + "items" label | ✅ | |
| Expand/collapse all chevron | ✅ | |
| Category count + ✓ selected count | ✅ | |
| SUMMARY_BG (#2A5740) | ✅ | |

---

## Filter Bar

| Feature | Status | Notes |
|---------|--------|-------|
| "Filter: Category" static bar | ✅ | Static visual; full filter out of scope for N004 |

---

## Category (SectionHeader) — wedge tile rows

| Feature | Status | Notes |
|---------|--------|-------|
| 64pt height row | ✅ | `CAT_HEADER_H = 64` |
| Coloured wedge tile (72pt, angled right edge) | ✅ | SVG Polygon overlay approximation |
| Category icon from `getCategoryTheme` | ✅ | `lib/categoryTheme.ts` |
| Category name + item count + selected count | ✅ | |
| Checked weight in oz | ✅ | |
| Tap to expand/collapse | ✅ | Single-open accordion |
| Expand-all / collapse-all from hero chevron | ✅ | |
| Long-press for category management | ✅ | Alert: Rename / Delete / Move Up / Move Down |
| Category rename (iOS) | ✅ | `Alert.prompt` |
| Category delete (with confirmation) | ✅ | `Alert.alert` |
| Category reorder (Move Up / Move Down) | 🔶 | Alert-based; native drag-to-reorder not yet |
| Sticky headers | ✅ | `stickySectionHeadersEnabled` |

---

## ItemRow

| Feature | Status | Notes |
|---------|--------|-------|
| 44pt+ min height | ✅ | |
| Rounded-square checkbox | ✅ | `CB_CHECKED = #4E7D5C` |
| Item name display | ✅ | `item.desc \|\| item.sub` |
| Weight in oz | ✅ | Calculated total via `calcTotalOz` |
| Tap to toggle check (with haptic) | ✅ | |
| Swipe-left to reveal Rename + Delete | ✅ | `AnimatedSwipeRow` / `PanResponder` |
| Item rename (iOS Alert.prompt) | ✅ | |
| Item delete (with confirmation) | ✅ | |

---

## Add Item Modal

| Feature | Status | Notes |
|---------|--------|-------|
| pageSheet modal | ✅ | |
| Item name TextInput | ✅ | Autofocus on open |
| Weight (oz) numeric input | ✅ | |
| Quantity picker (1–20 pill scroll) | ✅ | |
| Category pill picker | ✅ | Uses runtime `categoryOrder` from context |
| "New Category" pill | ✅ | `Alert.prompt` → `addCategory` → auto-select |
| Save and close | ✅ | |
| Save and add another | ✅ | Resets name/weight, keeps category |

---

## Search Modal

| Feature | Status | Notes |
|---------|--------|-------|
| pageSheet modal | ✅ | |
| Autofocused text filter | ✅ | |
| Results grouped by category | ✅ | Uses runtime `categoryOrder` |
| Interactive results (toggle checked) | ✅ | Haptic + toggleItem |
| Empty query → prompt state | ✅ | |
| Result count display | ✅ | |

---

## Locker Modal

| Feature | Status | Notes |
|---------|--------|-------|
| pageSheet modal | ✅ | |
| Save button (update active entry) | ✅ | |
| Save As button (new named copy, iOS prompt) | ✅ | |
| New List button (blank slate, clears history) | ✅ | |
| Saved list rows (name + date + item count) | ✅ | |
| Load a saved list | ✅ | Confirmation alert |
| Delete a saved list | ✅ | Swipe or long-press → confirm |
| Rename a saved list (iOS) | ✅ | Long-press → `Alert.prompt` |
| Active entry badge | ✅ | Highlighted row |
| Saving indicator | ✅ | `ActivityIndicator` |

---

## Summary Modal

| Feature | Status | Notes |
|---------|--------|-------|
| pageSheet modal | ✅ | |
| Grand Total weight | ✅ | |
| Base Weight / Clothing Worn / Dog Pack / Expendables | ✅ | |
| Weight breakdown by category (bar chart) | ✅ | `SummaryCatBar` |
| lbs / oz / kg display | ✅ | |
| Empty state | ✅ | |

---

## Bottom Box / NavBox Groups

| Feature | Status | Notes |
|---------|--------|-------|
| 4 groups × 5 cells (NAV_H=58) | ✅ | |
| Next / Back cycling | ✅ | |
| Summary → opens Summary modal | ✅ | |
| Add → opens Add Item modal | ✅ | |
| Search → opens Search modal | ✅ | |
| Locker → opens Locker modal | ✅ | |
| Undo / Redo | ✅ | Context undo()/redo(); disabled state dimmed |
| Save → saves to Locker | ✅ | `saveToLocker()` + haptic |
| Share → native text share | ✅ | `Share.share()` with packed item summary |
| Reset → clear all checks | ✅ | Confirmation alert |
| Disabled state visual dimming | ✅ | `disabledSet` + opacity 0.30 |
| Camera / Photos / Preview / More | 🔶 | Visual parity; non-functional (out of N004 scope) |

---

## Navigation / Layout

| Feature | Status | Notes |
|---------|--------|-------|
| Tab bar hidden | ✅ | `tabBarStyle: { display:'none' }` in `_layout.tsx` |
| Safe-area insets | ✅ | top (AppBar) + bottom (BottomBox pad) |
| Summary as pageSheet Modal (not a route) | ✅ | |

---

## Out-of-Scope (Documented Decisions)

| Feature | Decision |
|---------|---------|
| Native drag-to-reorder categories | Deferred; Alert Move Up/Down as minimum viable parity |
| Background / theme in Locker entries | Not in native data model; web-only feature |
| Camera / Photos / Location for items | Requires camera permission + data model changes; post-N004 |
| URL-based Share (API server + Clerk) | No native equivalent; text-based Share.share() chosen |
| Full filter (Location, Photo) | Requires photo/location data model; post-N004 |

---

## Files Modified / Created

| File | Status | Description |
|------|--------|-------------|
| `context/PackDataContext.tsx` | Modified | Full rewrite — unified NativeState, mutate(), undo/redo, Locker |
| `components/LockerModal.tsx` | Created | pageSheet Locker modal |
| `components/AddItemModal.tsx` | Modified | Dynamic categoryOrder + New Category pill |
| `components/SearchModal.tsx` | Modified | Dynamic categoryOrder |
| `app/(tabs)/index.tsx` | Modified | All R0114 wiring — hero tap, cat long-press, undo/redo, locker, share |
| `app/(tabs)/_layout.tsx` | Modified | Tab bar hidden |
| `app/(tabs)/summary.tsx` | Untouched | Old standalone route (no longer reachable) |
| `lib/weightUtils.ts` | Untouched | calcTotalOz, calcWeights, ozToLbs |
| `lib/categoryTheme.ts` | Untouched | getCategoryTheme(name, index) |
| `data/initialData.ts` | Untouched | Native seed data |
| `app/_layout.tsx` | Untouched | GestureHandlerRootView, KeyboardProvider, PackDataProvider |
