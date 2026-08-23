---
name: Batch I native parity repairs
description: Five Batch I fixes applied to pack-checklist-mobile; status and device-test requirements.
---

## Tasks applied

### Task 1 — Summary Weight Distribution donut chart
- **File**: `app/(tabs)/summary.tsx` (full rewrite for clarity)
- **What**: Added `DonutChart` component using `react-native-svg` `Path` arcs. Each slice coloured by `getCategoryTheme(name, idx).bg`. Legend row below chart. Added to a "WEIGHT DISTRIBUTION" section below the existing "WEIGHT BREAKDOWN" bars.
- **Key details**: `polarToCart + slicePath` helpers with 359.98° clamp for single-slice edge-case; 1.5° gap between slices (0° gap when only one slice). Chart size 180×180, R=82, r=50. Sorted descending by weight. `catTotals` now uses `categoryOrder` (dynamic, from `usePackData`) instead of removed `CATEGORY_ORDER` (static).
- **Verification**: TypeScript clean; Expo bundled without errors. Visual confirm requires loading the Summary tab with checked items.
- **Device test required**: No — renders in web Expo preview.

### Task 2 — More Deck link rows wired
- **File**: `components/MoreDeck.tsx`
- **What**: Added `Alert` import. Wired Card 3 rows: "About TrailWeigh" → `https://trailweigh.com/about`; "How It Works" → `https://trailweigh.com/how-it-works`; "Report an Issue" → `mailto:hello@trailweigh.com` (fallback to `/contact`). Wired Card 4 rows: "Privacy Policy" → `/privacy`; "Terms of Service" → `/terms`; "Delete Account" → `Alert.alert` explaining web-based deletion with "Open Website" option.
- **Verification**: TypeScript clean; Expo bundled. Functional confirm requires tapping rows in Expo Go / device.
- **Device test required**: No for code correctness; Yes for actual URL opening behaviour on iOS.

### Task 3 — Location accordion photo edit button
- **File**: `app/(tabs)/index.tsx`
- **What**: Wrapped bare `<Image>` in location accordion into `<View style={{ position: 'relative' }}>`. Added absolutely-positioned `<TouchableOpacity style={styles.locAccordionPhotoEdit}>` with pencil icon (bottom-right, 36×36 dark circle) calling `setLocPhotoTarget + setShowLocPhotoSheet`. Added `locAccordionPhotoEdit` style entry.
- **Verification**: TypeScript clean; Expo bundled. Visual confirm requires a location with a saved photo and its accordion open.
- **Device test required**: No for layout; Yes to confirm sheet opens and photo saves correctly.

### Task 4 — N-02 sibling bar animation during drag
- **File**: `app/(tabs)/index.tsx`
- **What**:
  - Added `updateDragAnims(screenY)` callback using `Animated.spring` to shift sibling bars ±barH based on fromIdx vs toIdx.
  - Changed both `<View onLayout={catHeaderLayout}>` wrappers in `renderSectionHeader` to `<Animated.View onLayout={catHeaderLayout} style={{ transform: [{ translateY: getDragAnim(s.title) }] }}>` (both the `suppressSwipe` branch and the swipe branch).
  - Wired `updateDragAnims(e.nativeEvent.pageY)` in the drag overlay's `onResponderMove`.
- **Verification**: TypeScript clean; Expo bundled. Animation requires physical touch-drag on device (not testable in web Expo preview).
- **Device test required**: YES — `onResponderMove` with native touch events; Animated.spring visuals.

### Task 5 — Add Item accordion "Photo" auto-launches camera
- **File**: `app/(tabs)/index.tsx`
- **What**:
  - Added `itemPhotoInitialSource` state (`'camera' | 'library' | undefined`).
  - Accordion Photo handler now sets `itemPhotoInitialSource('camera')` and `setPendingNewItemCleanup` before opening the sheet.
  - `ItemPhotoSheet` receives `initialSource={itemPhotoInitialSource}`.
  - `onClose` and `onCancel` both reset `itemPhotoInitialSource` to `undefined`.
- **Verification**: TypeScript clean; Expo bundled. Camera auto-launch requires physical device (Expo Go on iOS/Android).
- **Device test required**: YES — `ImagePicker.launchCameraAsync` / `ImagePicker.launchImageLibraryAsync` require a physical camera.

## TypeScript status
`npx tsc --noEmit` → zero output (clean) after all five tasks.

## Expo bundler status
Restarted after all edits; Metro serving on port without syntax errors. No ERROR lines in new logs.
