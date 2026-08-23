---
name: Batch H native parity repairs
description: 12 Batch H defect fixes for pack-checklist-mobile; status, key decisions, and device-test requirements.
---

## Status Summary

| ID | Description | Status |
|----|-------------|--------|
| N-01 | Handedness persisted to AsyncStorage | PASS (code + TS) |
| N-02 | Cat long-press 400 ms; Alert → drag-reorder overlay | CODE COMPLETE — DEVICE TEST REQUIRED |
| D-42 | "Create New Location…" in ItemDetailPanel location picker | CODE COMPLETE — iOS Alert.prompt only |
| D-46 | NavBox active visual state (bg + bold label + NAV_ACTIVE icon) | PASS (code + TS) |
| D-48p | More Deck Save → Save Chooser (not direct save) | PASS (code + TS) |
| D-54 | AddDeck Card 1 item creation → expand/focus new item | PASS (code + TS) |
| D-59–62 | ChecklistOverlay: ← Back, "Trail Checklist", Print, Share icons; banner | PASS (code + TS) |
| D-63/64 | LocationBar: Rename (pencil) + Camera buttons; location photo sheet | CODE COMPLETE — DEVICE TEST REQUIRED |
| D-65 | Location accordion: full-width photo above items when open | PASS (code + TS) |
| D-67 | Photo filter view: PhotoItemCard with Edit/Delete | PASS (code + TS) |
| N-03 | "View Photo" toggles inline viewer; "Edit Photo" opens sheet | PASS (code + TS) |
| N-04/N-05 | Logo icon 20→24; shortcut icons 17→18 in AppBar | PASS (code + TS) |

## Files Changed

- `context/PackDataContext.tsx` — added `updateLocation(id, patch)` callback
- `components/AddDeck.tsx` — `onItemAdded?(cat, id)` prop; `handleAddItem` captures return ID
- `components/ItemDetailPanel.tsx` — `onCreateLocation` prop; `showViewer` state; `promptCreateLocation` + updated `handleLocation`; "View Photo" toggles viewer, "Edit Photo" → sheet
- `components/ChecklistOverlay.tsx` — Share import; bg #F2EDE4; new header (← Back, title, Print, Share); banner; updated styles
- `app/(tabs)/index.tsx` — AsyncStorage import; N-01 effects; N-02 drag state/refs/helpers/overlay; D-46 NavBox isActive; D-48p MoreDeck chooser; D-54 AddDeck wiring; D-59–62 ChecklistOverlay change; D-63/64 LocationBar onRename/onCamera + locPhotoSheet; D-65 location photo; D-67 PhotoItemCard; N-03 onCreateLocation wiring; N-04/N-05 icon sizes; SectionList onScroll + listContainerRef; catHeaderLayout onLayout for drag drop slots; new styles block

## Key Architectural Decisions

**N-02 drag-reorder architecture:**
- `catBarYsRef`/`catBarHsRef` populated via `onLayout` on a `<View>` wrapping each category header return in `renderSectionHeader`.
- `listContainerRef.measure(...)` in `handleCatLongPress` records the list's absolute screen top into `listTopRef`.
- `computeTargetIdx(absY)` converts screen Y → content Y via `absY - listTopRef.current + scrollYRef.current`, then compares with recorded bar positions.
- Full-screen transparent `onStartShouldSetResponder` View catches all pointer events during drag; inner clone has `pointerEvents="none"`.
- `commitDrag` calls `reorderCategories`, fires haptic, sets 400 ms debounce flag, resets drag state.

**LocationBar restructure (D-63/64):**
- Outer `View` (not `TouchableOpacity`) holds the bar; inner `TouchableOpacity` covers the main area for toggle; separate `TouchableOpacity` buttons at right edge for rename/camera. Avoids nested-touchable event conflicts on iOS.

**updateLocation:**
- `setLocations_state(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l))` — Partial<Pick<PackLocation, 'name' | 'photoDataUrl'>>.
- Delete photo via `photoDataUrl: ''` (empty string = no photo).

**N-01 handedness persistence:**
- Skip-first-render pattern: `handednessInitRef.current` is `false` on mount; first save effect sets it to `true` and returns early; subsequent changes trigger `AsyncStorage.setItem`.

**D-46 activeAction:**
- Computed inline on `<BottomBox>`: first truthy open-deck state wins (`showLocker` → 'locker', `showSummary` → 'summary', etc.).
- NavBox receives `isActive` from `activeAction === cell.action`.
