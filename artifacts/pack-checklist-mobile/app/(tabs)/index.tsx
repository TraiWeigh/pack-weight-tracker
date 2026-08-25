/**
 * index.tsx — Gear screen (v3-parity) with full Photo List support
 *
 * R0113 repair pass — all 12 regressions fixed:
 *  1. NavigationDrawer wired to hamburger
 *  2. FilterControl always interactive; dropdown shows 3 options
 *  3. ItemRow split: checkbox zone vs name zone (expandedItemKey)
 *  4. CategorySwipeRow wraps SectionHeaders
 *  5. renderSectionFooter: AddItemBar per open category
 *  6. ItemDetailPanel inline below item
 *  7. PreviewOverlay (Group 3 Print btn)
 *  8. MoreDeck (Group 4 More btn)
 *  9. ChecklistOverlay (inside MoreDeck → Card 1)
 * 10. Toast: 3000ms, solid #2A5740
 * 11. SectionHeader weight: formatDisplayWeight
 * 12. SWIPE_BTN_W 80 → 88
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActionSheetIOS,
  Alert,
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Share,
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polygon } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import {
  usePackData, CATEGORY_ORDER, GearItem, PHOTO_ITEMS_CATEGORY, PackLocation,
} from '@/context/PackDataContext';
import { calcTotalOz, calcWeights, formatDisplayWeight, ozToLbs } from '@/lib/weightUtils';
import { getCategoryTheme } from '@/lib/categoryTheme';
import { AddDeck } from '@/components/AddDeck';
import { SearchModal } from '@/components/SearchModal';
import { LockerModal } from '@/components/LockerModal';
import { PhotoListSourceSheet } from '@/components/PhotoListSourceSheet';
import { PhotoListAssignmentSheet } from '@/components/PhotoListAssignmentSheet';
import { PhotoListLocationNameSheet } from '@/components/PhotoListLocationNameSheet';
import { PhotoListItemDestinationSheet } from '@/components/PhotoListItemDestinationSheet';
import { PhotoListItemNameSheet } from '@/components/PhotoListItemNameSheet';
import { NavigationDrawer } from '@/components/NavigationDrawer';
import { PreviewOverlay } from '@/components/PreviewOverlay';
import { MoreDeck } from '@/components/MoreDeck';
import { ChecklistOverlay } from '@/components/ChecklistOverlay';
import { FilterDropdown, FilterViewMode } from '@/components/FilterDropdown';
import { ItemDetailPanel } from '@/components/ItemDetailPanel';
import { CategorySwipeRow } from '@/components/CategorySwipeRow';
import { DonutChart } from '@/components/DonutChart';
import { CategoryPickerSheet } from '@/components/CategoryPickerSheet';
import { ItemPhotoSheet } from '@/components/ItemPhotoSheet';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { InfoPage, InfoScreen } from '@/components/InfoScreen';
import { PhotoListNameSheet } from '@/components/PhotoListNameSheet';
import { HomeOverlay } from '@/components/HomeOverlay';

// ─── v3 design constants ──────────────────────────────────────────────────────

const SUMMARY_BG   = '#2A5740';
const NAV_ACTIVE   = '#2A5740';
const NAV_INACTIVE = '#6E7672';
const CB_CHECKED   = '#4E7D5C';
const PRIMARY_TEXT = '#1A2920';
const PAGE_BG      = '#F2EDE4';
const MUTED        = '#667270';
const DIVIDER      = 'rgba(0,0,0,0.06)';

// v3 VF §1: WEDGE_W = 72px. Prior comment "F-18: v3-spec 58px" was factually wrong;
// N002 memory (section "Constants N003/R0111 — current") later confirmed 72. Now corrected.
// Self-check: VF §1 unambiguous. → MATCH after fix.
const TILE_W         = 72;
const WEDGE_POINT    = 17;
// v3 VF §1: CHECKLIST_ROW_H = 64px. Prior comment "F-18: v3-spec 62px" was factually wrong.
// Self-check: VF §1 unambiguous. → MATCH after fix.
const CAT_HEADER_H   = 64;
const RIGHT_INSET    = 44;
const ITEM_R_INSET   = 34;
const FILTER_H       = 50;
const NAV_H          = 58;
const APPBAR_H       = 52;
const CHECKBOX_HIT   = 44;
const SWIPE_BTN_W    = 88;   // v3-parity (was 80)
const SWIPE_REVEAL   = 88;
const NUM_GROUPS     = 4;
// P3 R0101: invisible trailing range lets the final short category reach the
// same anchored position beneath Filter as every earlier category.
const CATEGORY_TRAILING_SCROLL_H = 560;

// ─── Box Groups ───────────────────────────────────────────────────────────────

type BoxCell = { icon: string; label: string; action: string };

const BOX_GROUPS: BoxCell[][] = [
  [
    { icon: 'folder-outline',              label: 'Locker',   action: 'locker'   },
    { icon: 'bar-chart-outline',           label: 'Summary',  action: 'summary'  },
    { icon: 'add-circle-outline',          label: 'Add',      action: 'add'      },
    { icon: 'search-outline',              label: 'Search',   action: 'search'   },
    { icon: 'chevron-forward-outline',     label: 'Next',     action: 'next'     },
  ],
  [
    { icon: 'chevron-back-outline',        label: 'Back',     action: 'back'     },
    { icon: 'arrow-undo-outline',          label: 'Undo',     action: 'undo'     },
    { icon: 'arrow-redo-outline',          label: 'Redo',     action: 'redo'     },
    { icon: 'refresh-outline',             label: 'Reset',    action: 'reset'    },
    { icon: 'chevron-forward-outline',     label: 'Next',     action: 'next'     },
  ],
  [
    { icon: 'chevron-back-outline',        label: 'Back',     action: 'back'     },
    { icon: 'camera-outline',              label: 'Camera',   action: 'camera'   },
    { icon: 'images-outline',              label: 'Photos',   action: 'photos'   },
    { icon: 'print-outline',               label: 'Preview',  action: 'preview'  },
    { icon: 'chevron-forward-outline',     label: 'Next',     action: 'next'     },
  ],
  [
    { icon: 'chevron-back-outline',        label: 'Back',     action: 'back'     },
    { icon: 'save-outline',                label: 'Save',     action: 'save'     },
    { icon: 'share-social-outline',        label: 'Share',    action: 'share'    },
    { icon: 'ellipsis-horizontal-outline', label: 'More',     action: 'more'     },
    { icon: 'chevron-forward-outline',     label: 'Next',     action: 'next'     },
  ],
];

const APPBAR_SHORTCUT_ICONS = [
  'bag-outline', 'train-outline', 'airplane-outline',
  'boat-outline', 'car-outline',  'cube-outline',
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = {
  title:         string;
  catIndex:      number;
  data:          GearItem[];
  checkedCount:  number;
  totalCount:    number;
  checkedWeightOz: number;
  sectionKind?: 'normal' | 'add-photo-bar' | 'location';
  locId?:        string;
  locPhotoDataUrl?: string;
};

type InfoEntry = { page: InfoPage; sourceRef?: number | null };

// ─── AppBar ───────────────────────────────────────────────────────────────────

// F-02: handedness moves hamburger to the preferred thumb side
function AppBar({
  onMenuPress, handedness, homeVisible,
}: {
  onMenuPress: () => void;
  handedness: 'right' | 'left';
  homeVisible: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[
      styles.appBar,
      homeVisible && styles.appBarHome,
      { paddingTop: insets.top, minHeight: insets.top + APPBAR_H },
    ]}>
      <View style={styles.appBarInner}>
        {/* D-21: hamburger = NAV_ACTIVE per v3 §2 */}
        {handedness !== 'left' && (
          // Item 15: v3 VF §4 min-width/height=44px tap target; hitSlop=10 gave 42px
          <TouchableOpacity onPress={onMenuPress} style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="menu-outline" size={22} color={NAV_ACTIVE} />
          </TouchableOpacity>
        )}
        <View style={styles.appBarLogo}>
          {/* N-04: logo icon spec size=24 */}
          <Ionicons name="checkbox-outline" size={24} color={NAV_ACTIVE} />
          <Text style={styles.appBarTitle}>TrailWeigh</Text>
        </View>
        <View style={{ flex: 1 }} />
        {/* D-23: decorative icons = NAV_ACTIVE; N-05: spec size=18 */}
        <View style={styles.appBarShortcuts}>
          {APPBAR_SHORTCUT_ICONS.map((icon) => (
            <Ionicons key={icon} name={icon} size={18} color={NAV_ACTIVE} />
          ))}
        </View>
        {handedness === 'left' && (
          // Item 15: same 44×44 minimum for left-handed position
          <TouchableOpacity onPress={onMenuPress} style={{ marginLeft: 8, minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="menu-outline" size={22} color={NAV_ACTIVE} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── ListSummaryHero ──────────────────────────────────────────────────────────

function ListSummaryHero({
  listName, totalItems, catCount, selectedCount,
  allExpanded, onExpandToggle, onNameTap,
}: {
  listName: string; totalItems: number; catCount: number; selectedCount: number;
  allExpanded: boolean; onExpandToggle: () => void; onNameTap?: () => void;
}) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroTile}>
        <Ionicons name="bag-outline" size={34} color="rgba(255,255,255,0.90)" />
      </View>
      <View style={styles.heroContent}>
        <TouchableOpacity
          onPress={onNameTap} activeOpacity={onNameTap ? 0.65 : 1}
          hitSlop={{ top: 6, bottom: 6, left: 0, right: 0 }}
          style={styles.heroListNameRow}
        >
          <Text style={styles.heroListName} numberOfLines={1}>{listName}</Text>
          {onNameTap && (
            <Ionicons name="pencil-outline" size={11} color="rgba(255,255,255,0.45)" />
          )}
        </TouchableOpacity>
        <View style={styles.heroCountRow}>
          <Text style={styles.heroCount}>{totalItems}</Text>
          <Text style={styles.heroCountSuffix}> items</Text>
          <TouchableOpacity
            onPress={onExpandToggle}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            style={styles.heroChevronBtn}
          >
            {/* v3 VF §5: "Chevron: size=36". Prior size=16 was wrong. Self-check: MATCH. */}
            <Ionicons
              name={allExpanded ? 'chevron-up' : 'chevron-down'}
              size={36} color="rgba(255,255,255,0.78)"
            />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.heroRight}>
        <Text style={styles.heroCatCount}>
          {catCount} {catCount === 1 ? 'category' : 'categories'}
        </Text>
        <View style={styles.heroSelectedRow}>
          {/* Item 22: v3 VF §5 — exact 18px selected indicator with checkmark */}
          <View style={styles.heroSelectedIndicator}>
            <Ionicons name="checkmark" size={9} color="rgba(255,255,255,0.92)" />
          </View>
          <Text style={styles.heroSelectedText}>{selectedCount} Selected</Text>
        </View>
      </View>
    </View>
  );
}

// ─── FilterControl ────────────────────────────────────────────────────────────

function FilterControl({
  viewLabel, isOpen, onToggle,
}: { viewLabel: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <View style={styles.filterBar}>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Ionicons name="options-outline" size={15} color={NAV_ACTIVE} />
        {/* v3 §4.1: label prefix is "Filter:" — prior "View:" was wrong. Self-check: MATCH. */}
        <Text style={styles.filterLabel}>Filter: {viewLabel}</Text>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={17} color={NAV_INACTIVE}
        />
      </TouchableOpacity>
    </View>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

function SectionHeader({
  title, catIndex, checkedCount, totalCount, checkedWeightOz,
  isOpen, onToggle, onLongPress, onDragMove, onDragEnd, weightUnit,
}: {
  title: string; catIndex: number; checkedCount: number; totalCount: number;
  checkedWeightOz: number; isOpen: boolean; onToggle: () => void;
  // Drag stays owned by the original Touchable; a newly-rendered overlay cannot
  // reliably claim an already-active native touch sequence.
  onLongPress?: (pageX: number, pageY: number) => void;
  onDragMove?: (pageY: number) => void;
  onDragEnd?: (pageY: number) => void;
  weightUnit: 'imperial' | 'metric';
}) {
  const onToggleRef = useRef(onToggle);
  const onLongPressRef = useRef(onLongPress);
  const onDragMoveRef = useRef(onDragMove);
  const onDragEndRef = useRef(onDragEnd);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gestureMovedRef = useRef(false);
  const dragStartedRef = useRef(false);
  const startPointRef = useRef({ x: 0, y: 0 });

  onToggleRef.current = onToggle;
  onLongPressRef.current = onLongPress;
  onDragMoveRef.current = onDragMove;
  onDragEndRef.current = onDragEnd;

  const clearPressTimer = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    pressTimerRef.current = null;
  };

  // Own only touches that begin outside CategorySwipeRow's right 40% action
  // zone. This makes the drag continuous on native and web while preserving the
  // existing right-zone swipe reveal and allowing pre-lift drags to scroll.
  const headerPan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: e =>
      e.nativeEvent.pageX <= Dimensions.get('window').width * 0.60,
    onPanResponderGrant: e => {
      const { pageX, pageY } = e.nativeEvent;
      startPointRef.current = { x: pageX, y: pageY };
      gestureMovedRef.current = false;
      dragStartedRef.current = false;
      clearPressTimer();
      pressTimerRef.current = setTimeout(() => {
        if (!gestureMovedRef.current) {
          dragStartedRef.current = true;
          onLongPressRef.current?.(pageX, pageY);
        }
      }, 400);
    },
    onPanResponderMove: (e, gesture) => {
      if (!dragStartedRef.current && Math.hypot(gesture.dx, gesture.dy) > 8) {
        gestureMovedRef.current = true;
        clearPressTimer();
      }
      if (dragStartedRef.current) onDragMoveRef.current?.(e.nativeEvent.pageY);
    },
    onPanResponderRelease: e => {
      clearPressTimer();
      if (dragStartedRef.current) onDragEndRef.current?.(e.nativeEvent.pageY);
      else if (!gestureMovedRef.current) onToggleRef.current();
      dragStartedRef.current = false;
    },
    onPanResponderTerminate: e => {
      clearPressTimer();
      if (dragStartedRef.current) onDragEndRef.current?.(e.nativeEvent.pageY);
      dragStartedRef.current = false;
    },
    // Prior to lift, a parent ScrollView may take over a vertical drag. A live
    // reorder deliberately keeps ownership so the row stays under the finger.
    onPanResponderTerminationRequest: () => !dragStartedRef.current,
  })).current;

  return (
    <View {...(Platform.OS === 'web' ? {} : headerPan.panHandlers)}>
      <TouchableOpacity
        onPress={onToggle}
        // React Native Web's Touchable pressability reliably owns long-press
        // timing. Native uses headerPan above so it can retain the same finger
        // throughout an active reorder.
        onLongPress={Platform.OS === 'web'
          ? e => onLongPress?.(e.nativeEvent.pageX, e.nativeEvent.pageY)
          : undefined}
        onPressOut={Platform.OS === 'web'
          ? e => onDragEnd?.(e.nativeEvent.pageY)
          : undefined}
        delayLongPress={400}
        activeOpacity={0.78} style={styles.sectionCardTouchable}
        testID={`cat-header-${title}`}
      >
        <CategoryCardContent
          title={title} catIndex={catIndex} checkedCount={checkedCount}
          totalCount={totalCount} checkedWeightOz={checkedWeightOz} weightUnit={weightUnit}
        />
      </TouchableOpacity>
    </View>
  );
}

function CategoryCardContent({ title, catIndex, checkedCount, totalCount, checkedWeightOz, weightUnit }: {
  title: string; catIndex: number; checkedCount: number; totalCount: number;
  checkedWeightOz: number; weightUnit: 'imperial' | 'metric';
}) {
  const theme = getCategoryTheme(title, catIndex);
  const weightLabel = checkedWeightOz > 0 ? formatDisplayWeight(checkedWeightOz, weightUnit) : null;
  return (
    <View style={styles.sectionCard}>
      <View style={[styles.sectionTile, { backgroundColor: theme.bg }]}>
        <Ionicons name={theme.icon as any} size={26} color="rgba(255,255,255,0.93)" />
        <Svg width={WEDGE_POINT} height={CAT_HEADER_H} style={styles.wedgeSvg}>
          <Polygon points={`0,0 ${WEDGE_POINT},0 ${WEDGE_POINT},${CAT_HEADER_H / 2}`} fill="#FFFFFF" />
          <Polygon points={`0,${CAT_HEADER_H} ${WEDGE_POINT},${CAT_HEADER_H} ${WEDGE_POINT},${CAT_HEADER_H / 2}`} fill="#FFFFFF" />
        </Svg>
      </View>
      <View style={styles.sectionContent}>
        <Text style={styles.sectionName} numberOfLines={1}>{title}</Text>
        <Text style={styles.sectionSub}>
          {totalCount} item{totalCount !== 1 ? 's' : ''}{checkedCount > 0 ? `  ·  ${checkedCount} selected` : ''}
        </Text>
      </View>
      <View style={styles.sectionRight}>{weightLabel && <Text style={styles.sectionWeight}>{weightLabel}</Text>}</View>
    </View>
  );
}

// ─── LocationBar ─────────────────────────────────────────────────────────────
// D-63/64: Restructured so rename/camera buttons don't nest inside the toggle TouchableOpacity

function LocationBar({
  loc, totalCount, checkedCount, isOpen, onToggle, onRename, onCamera,
}: {
  loc: PackLocation; totalCount: number; checkedCount: number;
  isOpen: boolean; onToggle: () => void;
  onRename?: () => void;   // D-63: pencil → Alert.prompt rename
  onCamera?: () => void;   // D-64: camera → location photo sheet
}) {
  return (
    <View style={[styles.sectionCard, { zIndex: 5 }]} testID={`loc-header-${loc.id}`}>
      {/* Toggle area covers the full bar except the action buttons */}
      <TouchableOpacity
        onPress={onToggle} activeOpacity={0.78}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'stretch' }}
      >
        <View style={[styles.sectionTile, { backgroundColor: NAV_ACTIVE }]}>
          <Ionicons name="location-outline" size={26} color="rgba(255,255,255,0.93)" />
          <Svg width={WEDGE_POINT} height={CAT_HEADER_H} style={styles.wedgeSvg}>
            <Polygon points={`0,0 ${WEDGE_POINT},0 ${WEDGE_POINT},${CAT_HEADER_H / 2}`} fill="#FFFFFF" />
            <Polygon points={`0,${CAT_HEADER_H} ${WEDGE_POINT},${CAT_HEADER_H} ${WEDGE_POINT},${CAT_HEADER_H / 2}`} fill="#FFFFFF" />
          </Svg>
        </View>
        <View style={styles.locBarContent}>
          {loc.photoDataUrl ? (
            <Image source={{ uri: loc.photoDataUrl }} style={styles.locBarThumb} resizeMode="cover" />
          ) : (
            <View style={[styles.locBarThumb, styles.locBarThumbFallback]}>
              <Ionicons name="location-outline" size={18} color="rgba(255,255,255,0.6)" />
            </View>
          )}
          <Text style={styles.locBarName} numberOfLines={2}>{loc.name}</Text>
        </View>
        <View style={[styles.locBarRight, { paddingRight: 8 }]}>
          <Text style={styles.locBarType}>Location</Text>
          <Text style={styles.locBarCount}>{totalCount} item{totalCount !== 1 ? 's' : ''}</Text>
        </View>
      </TouchableOpacity>
      {/* D-63/64: Rename + Camera action buttons — separate from the toggle area */}
      {(onRename || onCamera) && (
        <View style={styles.locBarActions}>
          {onRename && (
            <TouchableOpacity onPress={onRename} hitSlop={8} style={styles.locBarActionBtn}>
              <Ionicons name="pencil-outline" size={16} color={NAV_ACTIVE} />
            </TouchableOpacity>
          )}
          {onCamera && (
            <TouchableOpacity onPress={onCamera} hitSlop={8} style={styles.locBarActionBtn}>
              <Ionicons name="camera-outline" size={16} color={NAV_ACTIVE} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

// ─── AddItemBar ───────────────────────────────────────────────────────────────

// D-35: Add Item bar — accordion toggle
// v3 §7.1 self-check:
//   closed icon = Plus (14px, green) → Ionicons "add-outline" (RN translation, documented)
//   open icon   = ChevronDown (14px) → "chevron-down" (prior "chevron-up" was wrong direction)
//   size: 16 → 14 (prior value wrong)
//   label: always "Add Item" regardless of open/closed state (prior showed category name — wrong)
//   catName prop kept for API compatibility; no longer shown in label per v3 spec.
function AddItemBar({ catName: _catName, accordionOpen, onPress, style }: { catName: string; accordionOpen?: boolean; onPress: () => void; style?: any }) {
  return (
    <TouchableOpacity style={[styles.addItemBar, style]} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={accordionOpen ? 'chevron-down' : 'add-outline'} size={14} color={NAV_ACTIVE} />
      <Text style={styles.addItemBarText}>Add Item</Text>
    </TouchableOpacity>
  );
}

// ─── AddAnotherPhotoBar ───────────────────────────────────────────────────────

function AddAnotherPhotoBar({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.addPhotoBar} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name="camera-outline" size={16} color={NAV_ACTIVE} />
      <Text style={styles.addPhotoBarText}>Add another photo</Text>
    </TouchableOpacity>
  );
}

// ─── PhotoListEmptyCard ───────────────────────────────────────────────────────

function PhotoListEmptyCard({
  pendingCapture, locations, onAddPhoto, onChooseClassification, onReplacePhoto,
}: {
  pendingCapture: string | null; locations: PackLocation[];
  onAddPhoto: () => void; onChooseClassification: () => void; onReplacePhoto: () => void;
}) {
  const photoLocations = locations.filter(l => l.photoDataUrl);
  const subtitle = pendingCapture
    ? 'Your photo is saved and ready for the next Photo List step.'
    : 'Add your first photo when you are ready to begin organizing this list.';
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyCardBadge}>
        <Ionicons name="camera-outline" size={24} color={NAV_ACTIVE} />
      </View>
      <Text style={styles.emptyCardTitle}>Your Photo List is ready</Text>
      <Text style={styles.emptyCardSubtitle}>{subtitle}</Text>
      {pendingCapture ? (
        <View style={styles.pendingBlock}>
          <Image source={{ uri: pendingCapture }} style={styles.pendingImage} resizeMode="cover" />
          <TouchableOpacity style={styles.chooseBtn} onPress={onChooseClassification} activeOpacity={0.8}>
            <Text style={styles.chooseBtnText}>Choose Location or Item</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.replaceBtn} onPress={onReplacePhoto} activeOpacity={0.8}>
            <Text style={styles.replaceBtnText}>Replace Photo</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {photoLocations.length > 0 && !pendingCapture && (
        <View style={styles.visualDestBlock}>
          <Text style={styles.visualDestLabel}>VISUAL DESTINATIONS</Text>
          <View style={styles.visualDestGrid}>
            {photoLocations.map(loc => (
              <View key={loc.id} style={styles.visualDestTile}>
                {loc.photoDataUrl ? (
                  <Image source={{ uri: loc.photoDataUrl }} style={styles.visualDestThumb} resizeMode="cover" />
                ) : (
                  <View style={[styles.visualDestThumb, styles.visualDestThumbFallback]} />
                )}
                <Text style={styles.visualDestName} numberOfLines={1}>{loc.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      {!pendingCapture && (
        <TouchableOpacity style={styles.addPhotoCTA} onPress={onAddPhoto} activeOpacity={0.85}>
          <Text style={styles.addPhotoCTAText}>Add Photo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── ItemRow ──────────────────────────────────────────────────────────────────
// Split into two touch zones: checkbox (toggles checked) and name/weight (opens detail panel).

// F-07: ItemRow now receives weightUnit and uses formatDisplayWeight for the weight badge
function ItemRow({
  item, category, onToggle, onTapName, weightUnit,
}: {
  item: GearItem; category: string;
  onToggle: (category: string, id: string) => void;
  onTapName: (category: string, id: string) => void;
  weightUnit: 'imperial' | 'metric';
}) {
  const handleCheck = useCallback(() => {
    onToggle(category, item.id);
  }, [category, item.id, onToggle]);

  const handleTapName = useCallback(() => {
    onTapName(category, item.id);
  }, [category, item.id, onTapName]);

  const totalOz     = calcTotalOz(item.weightOz, item.qty);
  const weightLabel = item.weightOz > 0 ? formatDisplayWeight(totalOz, weightUnit) : null; // F-07
  const displayName = item.desc || item.sub || 'Unnamed item';

  return (
    <View style={styles.itemRow} testID={`gear-item-${item.id}`}>
      {/* Checkbox zone */}
      <TouchableOpacity
        style={styles.checkboxArea}
        onPress={handleCheck}
        activeOpacity={0.65}
        hitSlop={{ top: 0, bottom: 0, left: 0, right: 4 }}
      >
        <View style={[
          styles.checkbox,
          {
            borderColor:     item.checked ? CB_CHECKED : 'rgba(0,0,0,0.18)',
            backgroundColor: item.checked ? CB_CHECKED : 'transparent',
          },
        ]}>
          {item.checked && <Ionicons name="checkmark" size={11} color="#FFFFFF" />}
        </View>
      </TouchableOpacity>
      {/* Name + weight zone → opens detail panel */}
      <TouchableOpacity
        style={styles.itemNameZone}
        onPress={handleTapName}
        activeOpacity={0.55}
      >
        <Text style={[styles.itemName, item.checked && styles.itemNameChecked]} numberOfLines={2}>
          {displayName}
        </Text>
        {weightLabel && (
          <Text style={[styles.itemWeight, item.checked && { color: NAV_ACTIVE }]}>
            {weightLabel}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── NavBox / BottomBox ───────────────────────────────────────────────────────

// D-46: isActive shows the active deck/screen highlight (bg + heavier icon + bold label)
function NavBox({ cell, onAction, disabled, isActive }: { cell: BoxCell; onAction: (a: string) => void; disabled?: boolean; isActive?: boolean }) {
  return (
    <TouchableOpacity
      style={[styles.navBox, disabled && { opacity: 0.30 }, isActive && styles.navBoxActive]}
      onPress={() => { if (!disabled) onAction(cell.action); }}
      activeOpacity={disabled ? 1 : 0.65}
      testID={`nav-${cell.label.toLowerCase().replace(/\s/g, '-')}`}
    >
      <Ionicons name={cell.icon as any} size={21} color={isActive ? NAV_ACTIVE : NAV_INACTIVE} />
      <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{cell.label}</Text>
    </TouchableOpacity>
  );
}

// F-02: handedness reverses cell order so primary thumb gets the most-used actions
function BottomBox({
  groupIdx, onAction, bottomPad, disabledSet, handedness, activeAction,
}: { groupIdx: number; onAction: (a: string) => void; bottomPad: number; disabledSet?: Set<string>; handedness?: 'right' | 'left'; activeAction?: string }) {
  const rawCells = BOX_GROUPS[groupIdx];
  const cells = handedness === 'left' ? [...rawCells].reverse() : rawCells;
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -44) {
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onActionRef.current('next');
        } else if (g.dx > 44) {
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onActionRef.current('back');
        }
      },
      onPanResponderTerminate: () => {},
    })
  ).current;

  return (
    <View style={[styles.bottomBox, { paddingBottom: bottomPad }]} {...pan.panHandlers}>
      <View style={styles.bottomRow}>
        {cells.map((cell) => (
          <NavBox
            key={`g${groupIdx}-${cell.action}`}
            cell={cell} onAction={onAction}
            disabled={disabledSet?.has(cell.action)}
            isActive={activeAction === cell.action}
          />
        ))}
      </View>
    </View>
  );
}

// ─── SummaryWeightRow / SummaryCatBar ─────────────────────────────────────────

// D-53: both summary widgets respect weightUnit
function SummaryWeightRow({
  label, oz, accent, half, weightUnit = 'imperial',
}: { label: string; oz: number; accent?: boolean; half?: boolean; weightUnit?: 'imperial' | 'metric' }) {
  const grams = oz * 28.3495;
  const displayVal  = weightUnit === 'metric'
    ? (grams >= 1000 ? (grams / 1000).toFixed(2) : Math.round(grams).toString())
    : ozToLbs(oz).toFixed(2);
  const displayUnit = weightUnit === 'metric' ? (grams >= 1000 ? 'kg' : 'g') : 'lbs';
  const subLine     = weightUnit === 'metric'
    ? `${Math.round(grams)} g · ${ozToLbs(oz).toFixed(2)} lbs`
    : `${oz.toFixed(1)} oz · ${(grams / 1000).toFixed(3)} kg`;
  const bg  = accent ? NAV_ACTIVE : '#F9FAFB';
  const fg  = accent ? '#FFFFFF'  : '#111827';
  const mu  = accent ? 'rgba(255,255,255,0.72)' : '#6B7280';
  return (
    <View style={[styles.sumCard, { backgroundColor: bg, borderColor: accent ? NAV_ACTIVE : 'rgba(0,0,0,0.08)' }, half && { flex: 1 }]}>
      <Text style={[styles.sumCardLabel, { color: mu }]}>{label}</Text>
      <Text style={[styles.sumCardValue, { color: fg }]}>
        {displayVal} <Text style={[styles.sumCardUnit, { color: mu }]}>{displayUnit}</Text>
      </Text>
      <Text style={[styles.sumCardSub, { color: mu }]}>{subLine}</Text>
    </View>
  );
}

function SummaryCatBar({
  name, oz, totalOz, weightUnit = 'imperial',
}: { name: string; oz: number; totalOz: number; weightUnit?: 'imperial' | 'metric' }) {
  const pct   = totalOz > 0 ? (oz / totalOz) * 100 : 0;
  const grams = oz * 28.3495;
  const displayVal = weightUnit === 'metric'
    ? (grams >= 1000 ? `${(grams / 1000).toFixed(2)} kg` : `${Math.round(grams)} g`)
    : `${ozToLbs(oz).toFixed(2)} lbs`;
  return (
    <View style={styles.sumCatRow}>
      <View style={styles.sumCatMeta}>
        <Text style={styles.sumCatName} numberOfLines={1}>{name}</Text>
        <Text style={styles.sumCatWeight}>{displayVal}</Text>
      </View>
      <View style={styles.sumCatTrack}>
        <View style={[styles.sumCatFill, { width: `${pct}%` as any }]} />
      </View>
    </View>
  );
}

// ─── AnimatedSwipeRow ─────────────────────────────────────────────────────────

let _closeOpenSwipe: (() => void) | null = null;

function AnimatedSwipeRow({
  item, category, onToggle, onTapName, onDelete, weightUnit,
}: {
  item: GearItem; category: string;
  onToggle: (cat: string, id: string) => void;
  onTapName: (cat: string, id: string) => void;
  onDelete: (item: GearItem, cat: string) => void;
  weightUnit: 'imperial' | 'metric';
}) {
  const tx           = useRef(new Animated.Value(0)).current;
  const isOpenRef    = useRef(false);
  const isSwipingRef = useRef(false);

  const closeRef = useRef(() => {
    Animated.spring(tx, { toValue: 0, useNativeDriver: true, tension: 220, friction: 22 }).start();
    isOpenRef.current = false;
    _closeOpenSwipe = null;
  });

  const pan = useRef(
    PanResponder.create({
      // D-45: swipe only activates from right 40% of screen (pageX > 60% width)
      onMoveShouldSetPanResponder: (evt, g) =>
        !isSwipingRef.current && Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.4
        && evt.nativeEvent.pageX > Dimensions.get('window').width * 0.60,
      onPanResponderGrant: () => {
        isSwipingRef.current = true;
        tx.stopAnimation();
        tx.setOffset(isOpenRef.current ? -SWIPE_REVEAL : 0);
        tx.setValue(0);
      },
      onPanResponderMove: (_, g) => {
        tx.setValue(Math.max(-SWIPE_REVEAL, Math.min(0, (isOpenRef.current ? -SWIPE_REVEAL : 0) + g.dx)));
      },
      onPanResponderRelease: (_, g) => {
        tx.flattenOffset();
        isSwipingRef.current = false;
        if (!isOpenRef.current && g.dx < -SWIPE_BTN_W) { // Item 5: commit = full button width (88px), not 50px
          _closeOpenSwipe?.();
          _closeOpenSwipe = closeRef.current;
          isOpenRef.current = true;
          Animated.spring(tx, { toValue: -SWIPE_REVEAL, useNativeDriver: true, tension: 220, friction: 22 }).start();
        } else if (isOpenRef.current && g.dx > 50) {
          closeRef.current();
        } else if (isOpenRef.current) {
          Animated.spring(tx, { toValue: -SWIPE_REVEAL, useNativeDriver: true, tension: 220, friction: 22 }).start();
        } else {
          Animated.spring(tx, { toValue: 0, useNativeDriver: true, tension: 220, friction: 22 }).start();
        }
      },
      onPanResponderTerminate: () => {
        tx.flattenOffset();
        isSwipingRef.current = false;
        Animated.spring(tx, { toValue: isOpenRef.current ? -SWIPE_REVEAL : 0, useNativeDriver: true, tension: 220, friction: 22 }).start();
      },
    })
  ).current;

  return (
    <View style={{ overflow: 'hidden' }}>
      <View style={[StyleSheet.absoluteFillObject, { flexDirection: 'row', justifyContent: 'flex-end' }]}>
        {/* D-44: delete button = DELETE_RED_SWIPE #B03A2E per v3 §6.3 */}
        <TouchableOpacity
          style={[styles.swipeActionBtn, { backgroundColor: '#B03A2E' }]}
          onPress={() => { closeRef.current(); onDelete(item, category); }}
        >
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={styles.swipeActionLabel}>Delete</Text>
        </TouchableOpacity>
      </View>
      <Animated.View style={{ transform: [{ translateX: tx }] }} {...pan.panHandlers}>
        <ItemRow item={item} category={category} onToggle={onToggle} onTapName={onTapName} weightUnit={weightUnit} />
      </Animated.View>
    </View>
  );
}

// ─── PhotoItemCard ─────────────────────────────────────────────────────────────
// D-67: full-width photo card for the photo filter view (shows image + Edit/Delete controls)

function PhotoItemCard({
  item, onDelete, onEditPhoto, weightUnit,
}: {
  item: GearItem; onDelete: () => void; onEditPhoto: () => void; weightUnit: 'imperial' | 'metric';
}) {
  const displayName = item.desc || item.sub || 'Unnamed item';
  const totalOz     = calcTotalOz(item.weightOz, item.qty);
  const wtLabel     = item.weightOz > 0 ? formatDisplayWeight(totalOz, weightUnit) : null;
  return (
    <View style={styles.photoItemCard}>
      <Image source={{ uri: item.photoDataUrl! }} style={styles.photoItemImg} resizeMode="cover" />
      <View style={styles.photoItemMeta}>
        <Text style={styles.photoItemName} numberOfLines={2}>{displayName}</Text>
        {wtLabel && <Text style={styles.photoItemWeight}>{wtLabel}</Text>}
      </View>
      <View style={styles.photoItemActions}>
        <TouchableOpacity style={styles.photoItemBtn} onPress={onEditPhoto} activeOpacity={0.7}>
          <Ionicons name="pencil-outline" size={14} color={NAV_ACTIVE} />
          <Text style={styles.photoItemBtnText}>Edit Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.photoItemBtn, styles.photoItemDeleteBtn]} onPress={onDelete} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={14} color="#B03A2E" />
          <Text style={[styles.photoItemBtnText, { color: '#B03A2E' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── GearScreen ───────────────────────────────────────────────────────────────

export default function GearScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    data, isLoading, categoryOrder,
    toggleItem, addItem, deleteItem, updateItem, renameItem, moveItem, resetAll,
    listName, setListName,
    listKind, locations, photoListCaptureDataUrl,
    setPendingCapture, addLocation, updateLocation,
    canUndo, canRedo, undo, redo,
    addCategory, deleteCategory, renameCategory, reorderCategories,
    saveToLocker, saveAsToLocker, refreshLockerEntries,
    weightUnit, setWeightUnit,
    checklistUse, toggleChecklistItem, clearChecklistUse,
  } = usePackData();

  // ── Standard list UI state ──────────────────────────────────────────────────
  const [openCatName, setOpenCatName] = useState<string | null>(null);
  const [allExpanded, setAllExpanded] = useState(false);
  // D-35: track which category's add-item accordion is open (normal mode only)
  const [addItemAccordionCat, setAddItemAccordionCat] = useState<string | null>(null);
  const [groupIdx, setGroupIdx]       = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [showAdd, setShowAdd]         = useState(false);
  const [showSearch, setShowSearch]   = useState(false);
  const [showLocker, setShowLocker]   = useState(false);

  // ── New overlay/deck state ──────────────────────────────────────────────────
  const [showDrawer,   setShowDrawer]   = useState(false);
  const [showHome,     setShowHome]     = useState(true);
  const [showPreview,  setShowPreview]  = useState(false);
  const [showMore,     setShowMore]     = useState(false);
  const [moreInitialCard, setMoreInitialCard] = useState<'actions' | 'settings' | 'help' | 'account'>('actions');
  const [showChecklist,setShowChecklist]= useState(false);
  const [showFilterDD, setShowFilterDD] = useState(false);
  // Item 10: custom amber confirm sheet replaces Alert.alert for Reset Checks (v3 §13.10)
  const [showResetSheet, setShowResetSheet] = useState(false);
  const [infoStack, setInfoStack] = useState<InfoEntry[]>([]);
  const [filterView,   setFilterView]   = useState<FilterViewMode>('category');
  const [handedness,   setHandedness]   = useState<'left' | 'right'>('right');

  // ── Item detail panel state ─────────────────────────────────────────────────
  const [expandedItemKey, setExpandedItemKey] = useState<{ cat: string; id: string } | null>(null);

  // ── Item photo sheet state ──────────────────────────────────────────────────
  const [showItemPhotoSheet,    setShowItemPhotoSheet]    = useState(false);
  const [photoTarget,           setPhotoTarget]           = useState<{ cat: string; id: string } | null>(null);
  // Task 5 (Batch I): source passed to ItemPhotoSheet so accordion "Photo" auto-launches camera
  const [itemPhotoInitialSource, setItemPhotoInitialSource] = useState<'camera' | 'library' | undefined>(undefined);

  // ── Category picker state (contextual camera/photos case 3) ────────────────
  const [showCatPicker,  setShowCatPicker]  = useState(false);
  const [showStandardListName, setShowStandardListName] = useState(false);
  const [catPickerSource,setCatPickerSource]= useState<'camera' | 'photos'>('camera');

  // ── Photo List UI state ─────────────────────────────────────────────────────
  const [showSourceSheet, setShowSourceSheet] = useState(false);
  const [showAssignment,  setShowAssignment]  = useState(false);
  const [showLocName,     setShowLocName]     = useState(false);
  const [showItemDest,    setShowItemDest]    = useState(false);
  const [showItemName,    setShowItemName]    = useState(false);
  const [newItemId,       setNewItemId]       = useState<string | null>(null);
  const [openLocNames,    setOpenLocNames]    = useState<Set<string>>(new Set());

  // ── SectionList ref (F-10: scroll-to-category) ───────────────────────────────
  const sectionListRef = useRef<any>(null);
  const [filterBarBottom,  setFilterBarBottom]  = useState(0);  // F-12
  const [listViewportH, setListViewportH] = useState(0);
  const lockedItemsRef = useRef<ScrollView>(null);
  const lockedContentHRef = useRef(0);
  const lockedViewportHRef = useRef(0);
  const [lockedScrollY, setLockedScrollY] = useState(0);
  const [lockedCanScrollDown, setLockedCanScrollDown] = useState(false);

  // ── Pending new-item cleanup (F-06: cancel after contextual photo add) ───────
  const [pendingNewItemCleanup, setPendingNewItemCleanup] = useState<{ cat: string; id: string } | null>(null);

  // N-01: skip first render when saving handedness
  const handednessInitRef = useRef(false);

  // N-02: category drag-reorder state + refs
  const [draggingCat,  setDraggingCat]  = useState<string | null>(null);
  const [dragOverlayY, setDragOverlayY] = useState(0);
  const [dragTargetIdx, setDragTargetIdx] = useState<number | null>(null);
  const dragCatRef               = useRef<string | null>(null);
  const reorderJustHappenedRef   = useRef(false);
  const catBarYsRef              = useRef<Map<string, number>>(new Map());
  const catBarHsRef              = useRef<Map<string, number>>(new Map());
  const catBarRefsRef            = useRef<Map<string, any>>(new Map());
  const scrollYRef               = useRef(0);
  const openCategoryScrollRef    = useRef<{ catName: string; y: number } | null>(null);
  const listContainerRef         = useRef<View>(null);
  const rootTopRef               = useRef(0);
  const catDragAnimsRef          = useRef<Map<string, Animated.Value>>(new Map());

  // D-63/64: location photo sheet
  const [locPhotoTarget,    setLocPhotoTarget]    = useState<string | null>(null);
  const [showLocPhotoSheet, setShowLocPhotoSheet] = useState(false);

  // ── Toast ───────────────────────────────────────────────────────────────────
  const [toastMsg,  setToastMsg]  = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast  = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 3000);   // 3000ms (was 2200)
  }, []);

  // N-01: persist handedness to AsyncStorage across app restarts
  useEffect(() => {
    AsyncStorage.getItem('twm-handedness').then((v) => {
      if (v === 'left' || v === 'right') setHandedness(v as 'left' | 'right');
    }).catch(() => {});
  }, []);
  useEffect(() => {
    if (!handednessInitRef.current) { handednessInitRef.current = true; return; }
    AsyncStorage.setItem('twm-handedness', handedness).catch(() => {});
  }, [handedness]);

  // ── Photo List sheet cascade ──────────────────────────────────────────────

  const handleOpenSource = useCallback(() => {
    setShowSourceSheet(true);
  }, []);

  const handleCaptured = useCallback((dataUrl: string) => {
    setPendingCapture(dataUrl);
    setTimeout(() => setShowAssignment(true), 300);
  }, [setPendingCapture]);

  const handlePickLocation = useCallback(() => {
    setShowAssignment(false);
    setTimeout(() => setShowLocName(true), 200);
  }, []);

  const handlePickItem = useCallback(() => {
    setShowAssignment(false);
    setTimeout(() => setShowItemDest(true), 200);
  }, []);

  const handleDecideLater = useCallback(() => {
    setShowAssignment(false);
    showToast('Photo saved — choose a location or item later');
  }, [showToast]);

  const handleLocationSaved = useCallback((locationId: string, name?: string) => {
    setShowLocName(false);
    setFilterView('location');
    showToast(name ? `Location "${name}" saved` : 'Location saved');
  }, [showToast]);

  const handleLocNameBack = useCallback(() => {
    setShowLocName(false);
    setTimeout(() => setShowAssignment(true), 200);
  }, []);

  const handleItemDestBack = useCallback(() => {
    setShowItemDest(false);
    setTimeout(() => setShowAssignment(true), 200);
  }, []);

  const handleItemAssigned = useCallback((itemId: string) => {
    setShowItemDest(false);
    setNewItemId(itemId);
    setOpenCatName(PHOTO_ITEMS_CATEGORY);
    setTimeout(() => {
      setShowItemName(true);
      showToast('Photo item saved');
    }, 200);
  }, [showToast]);

  const handleItemNameClose = useCallback(() => {
    setShowItemName(false);
    setNewItemId(null);
  }, []);

  const handleLocToggle = useCallback((locId: string) => {
    setOpenLocNames(prev => {
      const next = new Set(prev);
      if (next.has(locId)) next.delete(locId);
      else next.add(locId);
      return next;
    });
  }, []);

  // ── Contextual camera/photos handler (standard list) ──────────────────────

  const openItemPhotoSheetFor = useCallback((
    source: 'camera' | 'photos',
    cat: string,
    id: string,
  ) => {
    setPhotoTarget({ cat, id });
    setShowItemPhotoSheet(true);
    // Note: ItemPhotoSheet handles source internally via its own pickers
  }, []);

  const handleContextualMediaAction = useCallback((source: 'camera' | 'photos') => {
    // Case 1: item detail panel is open → use that item
    if (expandedItemKey) {
      openItemPhotoSheetFor(source, expandedItemKey.cat, expandedItemKey.id);
      return;
    }
    // Case 2: category is open → create new item, open its photo flow
    if (openCatName) {
      const newId = addItem(openCatName, '', 0, 1);
      setExpandedItemKey({ cat: openCatName, id: newId });
      setPhotoTarget({ cat: openCatName, id: newId });
      setPendingNewItemCleanup({ cat: openCatName, id: newId });  // F-06: cleanup on cancel
      setShowItemPhotoSheet(true);
      return;
    }
    // Case 3: nothing open → open category picker
    setCatPickerSource(source);
    setShowCatPicker(true);
  }, [expandedItemKey, openCatName, addItem, openItemPhotoSheetFor]);

  const handleCatPickerSelect = useCallback((cat: string) => {
    setShowCatPicker(false);
    const newId = addItem(cat, '', 0, 1);
    setOpenCatName(cat);
    setExpandedItemKey({ cat, id: newId });
    setPhotoTarget({ cat, id: newId });
    setPendingNewItemCleanup({ cat, id: newId });  // F-06: cleanup on cancel
    setShowItemPhotoSheet(true);
  }, [addItem]);

  const handleItemPhotoCapture = useCallback((dataUrl: string) => {
    if (!photoTarget) return;
    updateItem(photoTarget.cat, photoTarget.id, { photoDataUrl: dataUrl });
    setPendingNewItemCleanup(null);   // F-06: capture succeeded — no cleanup needed
    showToast('Photo saved');
  }, [photoTarget, updateItem, showToast]);

  const handleItemPhotoDelete = useCallback(() => {
    if (!photoTarget) return;
    updateItem(photoTarget.cat, photoTarget.id, { photoDataUrl: undefined });
    showToast('Photo removed');
  }, [photoTarget, updateItem, showToast]);

  // ── Category handlers ─────────────────────────────────────────────────────

  const handleCatToggle = useCallback((catName: string) => {
    if (dragCatRef.current || reorderJustHappenedRef.current) return;
    // Suppress the tap emitted after a completed long-press drag.
    if (dragCatRef.current || reorderJustHappenedRef.current) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAllExpanded(false);
    setExpandedItemKey(null);   // close item detail panel when switching categories
    setOpenCatName(prev => {
      const closing = prev === catName;
      if (!closing) openCategoryScrollRef.current = { catName, y: scrollYRef.current };
      return closing ? null : catName;
    });
  }, []);

  // P3 R0101: anchor the opened category beneath Filter. On close, restore the
  // exact pre-open category-list position saved by handleCatToggle.
  useEffect(() => {
    if (!openCatName || allExpanded) {
      const restore = openCategoryScrollRef.current;
      if (!restore) return;
      const t = setTimeout(() => {
        sectionListRef.current?.getScrollResponder()?.scrollTo({ y: restore.y, animated: false });
        openCategoryScrollRef.current = null;
      }, 40);
      return () => clearTimeout(t);
    }
    const idx = sections.findIndex(s => s.title === openCatName);
    if (idx < 0) return;
    const t = setTimeout(() => {
      try {
        sectionListRef.current?.scrollToLocation({
          sectionIndex: idx, itemIndex: 0, animated: false, viewOffset: 0,
        });
      } catch { /* ignore — section may not be measured yet */ }
    }, 80);
    return () => clearTimeout(t);
  }, [openCatName, allExpanded]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExpandAll = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAllExpanded(prev => { if (prev) setOpenCatName(null); return !prev; });
  }, []);

  const handleReset = useCallback(() => {
    // Item 10: open amber ConfirmSheet instead of Alert.alert — v3 §13.10 exact spec.
    // Title, body, label, and amber colour (#b45309) now all match. Toast also corrected.
    setShowResetSheet(true);
  }, [setShowResetSheet]);

  const handleItemDelete = useCallback((item: GearItem, cat: string) => {
    // Items 6 & 7: exact final-v3 title and body.
    const name = item.desc || item.sub || 'this item';
    Alert.alert(
      `Delete "${name}"?`,
      'This will permanently remove this item from the current list. Other lists are not affected.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Item', style: 'destructive', onPress: () => {
          deleteItem(cat, item.id);
          if (expandedItemKey?.id === item.id) setExpandedItemKey(null);
        }},
      ],
    );
  }, [deleteItem, expandedItemKey]);

  // N-02: drag-reorder helper — create/return Animated.Value per category bar
  const getDragAnim = useCallback((cat: string): Animated.Value => {
    if (!catDragAnimsRef.current.has(cat)) {
      catDragAnimsRef.current.set(cat, new Animated.Value(0));
    }
    return catDragAnimsRef.current.get(cat)!;
  }, []);

  // N-02: compute target drop index from absolute screen Y
  const computeTargetIdx = useCallback((absY: number): number => {
    const order    = categoryOrder;
    let best = order.length - 1;
    for (let i = 0; i < order.length; i++) {
      const barTop = catBarYsRef.current.get(order[i]) ?? 0;
      const barH   = catBarHsRef.current.get(order[i]) ?? 62;
      if (absY < barTop + barH / 2) { best = i; break; }
    }
    return best;
  }, [categoryOrder]);

  // N-02: commit the drag — reorder categories and clean up
  const commitDrag = useCallback((absY: number) => {
    const dragging = dragCatRef.current;
    if (!dragging) return;
    const fromIdx  = categoryOrder.indexOf(dragging);
    const toIdx    = computeTargetIdx(absY);
    if (fromIdx !== toIdx && fromIdx >= 0) {
      const o = [...categoryOrder];
      o.splice(fromIdx, 1);
      o.splice(toIdx, 0, dragging);
      reorderCategories(o);
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    reorderJustHappenedRef.current = true;
    setTimeout(() => { reorderJustHappenedRef.current = false; }, 400);
    // reset all anims
    catDragAnimsRef.current.forEach((anim) => { anim.setValue(0); });
    dragCatRef.current = null;
    setDragTargetIdx(null);
    setDraggingCat(null);
  }, [categoryOrder, computeTargetIdx, reorderCategories]);

  // Long-press activates drag only outside CategorySwipeRow's right-side action zone.
  const handleCatLongPress = useCallback((catName: string, pageX: number, pageY: number) => {
    if (reorderJustHappenedRef.current) return;
    if (pageX > Dimensions.get('window').width * 0.60) return;
    if (openCatName || allExpanded) return;
    if (listKind === 'photo' && catName === PHOTO_ITEMS_CATEGORY) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    categoryOrder.forEach((cat) => {
      catBarRefsRef.current.get(cat)?.measureInWindow((_x: number, y: number, _w: number, h: number) => {
        catBarYsRef.current.set(cat, y);
        catBarHsRef.current.set(cat, h);
      });
    });
    dragCatRef.current = catName;
    setDraggingCat(catName);
    setDragTargetIdx(categoryOrder.indexOf(catName));
    setDragOverlayY(pageY - rootTopRef.current - (catBarHsRef.current.get(catName) ?? CAT_HEADER_H) / 2);
  }, [allExpanded, categoryOrder, listKind, openCatName]);

  // Task 4 (Batch I): animate sibling bars to show drop target while dragging
  const updateDragAnims = useCallback((screenY: number) => {
    const dragging = dragCatRef.current;
    if (!dragging) return;
    const fromIdx = categoryOrder.indexOf(dragging);
    const toIdx   = computeTargetIdx(screenY);
    setDragTargetIdx(toIdx);
    const barH    = catBarHsRef.current.get(dragging) ?? CAT_HEADER_H;
    categoryOrder.forEach((cat, i) => {
      if (cat === dragging) return;
      let shift = 0;
      if (fromIdx < toIdx && i > fromIdx && i <= toIdx)  shift = -barH; // drag down: gap opens above
      if (fromIdx > toIdx && i >= toIdx  && i < fromIdx) shift =  barH; // drag up: gap opens below
      Animated.spring(getDragAnim(cat), {
        toValue: shift, useNativeDriver: true, tension: 300, friction: 26,
      }).start();
    });
  }, [categoryOrder, computeTargetIdx, getDragAnim]);

  const cancelDrag = useCallback(() => {
    catDragAnimsRef.current.forEach((anim) => { anim.setValue(0); });
    dragCatRef.current = null;
    setDragTargetIdx(null);
    setDraggingCat(null);
  }, []);

  // Once a web Touchable has crossed the 400ms long-press threshold, follow
  // the same active pointer globally. RN Web does not forward moves from an
  // already-active Touchable to a newly-rendered floating overlay.
  useEffect(() => {
    if (Platform.OS !== 'web' || !draggingCat || typeof document === 'undefined') return;
    const move = (screenY: number) => {
      setDragOverlayY(screenY - rootTopRef.current - (catBarHsRef.current.get(draggingCat) ?? CAT_HEADER_H) / 2);
      updateDragAnims(screenY);
    };
    const onPointerMove = (event: PointerEvent) => move(event.pageY);
    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (touch) move(touch.pageY);
    };
    document.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('touchmove', onTouchMove);
    };
  }, [draggingCat, updateDragAnims]);

  const handleHeroNameTap = useCallback(() => {
    if (Platform.OS === 'ios') {
      Alert.prompt('List Name', undefined, (text) => {
        if (text?.trim()) setListName(text.trim());
      }, 'plain-text', listName);
    } else Alert.alert('List Name', 'Tap-to-rename is available on iOS.');
  }, [listName, setListName]);

  // ── Item detail panel handlers ─────────────────────────────────────────────

  const handleTapItemName = useCallback((cat: string, id: string) => {
    setExpandedItemKey(prev => {
      if (prev?.cat === cat && prev?.id === id) return null;  // toggle off same item
      return { cat, id };
    });
  }, []);

  const handleDetailRename = useCallback((cat: string, id: string, newName: string) => {
    renameItem(cat, id, newName);
  }, [renameItem]);

  const handleDetailUpdate = useCallback((
    cat: string, id: string,
    patch: Partial<Pick<GearItem, 'weightOz' | 'qty' | 'expendable' | 'sub' | 'photoDataUrl' | 'locationId'>>,
  ) => {
    updateItem(cat, id, patch);
  }, [updateItem]);

  const handleDetailMove = useCallback((cat: string, id: string, newCat: string) => {
    moveItem(cat, newCat, id);
    setExpandedItemKey({ cat: newCat, id });
    setOpenCatName(newCat);
  }, [moveItem]);

  const handleDetailDelete = useCallback((cat: string, id: string) => {
    deleteItem(cat, id);
    setExpandedItemKey(null);
  }, [deleteItem]);

  // ── Box actions ────────────────────────────────────────────────────────────

  const disabledActions = useMemo<Set<string>>(() => {
    const s = new Set<string>();
    if (!canUndo) s.add('undo');
    if (!canRedo) s.add('redo');
    return s;
  }, [canUndo, canRedo]);

  const handleBoxAction = useCallback((action: string) => {
    // BottomBox remains usable above Home. Navigating to an actual list action
    // returns to the still-mounted checklist before opening that action.
    if (showHome && action !== 'next' && action !== 'back') setShowHome(false);
    switch (action) {
      case 'next':
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setGroupIdx(g => (g + 1) % NUM_GROUPS);
        break;
      case 'back':
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setGroupIdx(g => (g - 1 + NUM_GROUPS) % NUM_GROUPS);
        break;
      case 'summary': router.push('/summary'); break;
      case 'add':
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowAdd(true);
        break;
      case 'search':
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setShowSearch(true);
        break;
      case 'locker':
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        refreshLockerEntries();
        setShowLocker(true);
        break;
      case 'camera':
        if (listKind === 'photo') {
          setShowSourceSheet(true);
        } else {
          handleContextualMediaAction('camera');
        }
        break;
      case 'photos':
        if (listKind === 'photo') {
          setShowSourceSheet(true);
        } else {
          handleContextualMediaAction('photos');
        }
        break;
      case 'preview':
        setShowPreview(true);
        break;
      case 'more':
        setShowMore(true);
        break;
      case 'undo': undo(); break;
      case 'redo': redo(); break;
      case 'save':
        // D-47: v3 §13.8 — open Save Chooser (Save / Save As / Cancel) instead of direct save
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (Platform.OS === 'ios') {
          ActionSheetIOS.showActionSheetWithOptions(
            { title: 'Save List', options: ['Save', 'Save As…', 'Cancel'], cancelButtonIndex: 2 },
            (idx) => {
              if (idx === 0) {
                if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                saveToLocker(); showToast('List saved');
              } else if (idx === 1) {
                Alert.prompt('Save As', 'Name for the new copy:',
                  (text) => { if (text?.trim()) { saveAsToLocker(text.trim()); showToast(`Saved as '${text.trim()}'`); } },
                  'plain-text', listName);
              }
            }
          );
        } else {
          Alert.alert('Save List', undefined, [
            { text: 'Save', onPress: () => { saveToLocker(); showToast('List saved'); } },
            { text: 'Save As…', onPress: () => { Alert.alert('Save As', 'Saving as a copy is available on iOS.'); } },
            { text: 'Cancel', style: 'cancel' },
          ]);
        }
        break;
      case 'share': {
        const packedLines = categoryOrder.flatMap(cat =>
          (data[cat] || []).filter(i => i.checked)
            .map(i => `• ${i.desc || i.sub}${i.qty > 1 ? ` ×${i.qty}` : ''}`)
        );
        const totalOz = categoryOrder.flatMap(cat => (data[cat] || []).filter(i => i.checked))
          .reduce((sum, i) => sum + calcTotalOz(i.weightOz, i.qty), 0);
        const lbsVal  = ozToLbs(totalOz).toFixed(2);
        const message = [listName, '─────────────────',
          packedLines.length > 0 ? packedLines.join('\n') : '(No items packed yet)',
          '', `Packed: ${lbsVal} lbs (${totalOz.toFixed(1)} oz)`, 'via TrailWeigh'].join('\n');
        Share.share({ message, title: listName });
        break;
      }
      case 'reset': handleReset(); break;
      default: break;
    }
  }, [
    handleReset, handleContextualMediaAction,
    undo, redo, saveToLocker, saveAsToLocker, refreshLockerEntries,
    listName, categoryOrder, data, listKind, showHome, showToast,
  ]);

  const bottomPad = Platform.OS === 'web' ? 20 : insets.bottom;

  // ── Data computations ─────────────────────────────────────────────────────

  const allSections: Section[] = categoryOrder.map((cat, catIndex) => {
    const items      = data[cat] || [];
    const populated  = items.filter(i => i.sub || i.desc || i.weightOz > 0 || i.photoDataUrl);
    const checkedWeightOz = populated.filter(i => i.checked)
      .reduce((sum, item) => sum + calcTotalOz(item.weightOz, item.qty), 0);
    return {
      title: cat, catIndex, data: populated,
      checkedCount:   populated.filter(i => i.checked).length,
      totalCount:     populated.length,
      checkedWeightOz,
    };
  }).filter(s => s.totalCount > 0 || s.title === PHOTO_ITEMS_CATEGORY);

  const totalItems    = allSections.reduce((n, s) => n + s.totalCount, 0);
  const selectedCount = allSections.reduce((n, s) => n + s.checkedCount, 0);
  const catCount      = allSections.length;

  const photoListHasItems = listKind === 'photo' &&
    (data[PHOTO_ITEMS_CATEGORY] || []).filter(i => i.sub || i.desc || i.photoDataUrl).length > 0;

  const showPhotoListEmpty = listKind === 'photo' && !photoListHasItems;

  // filterView label
  const filterLabel = filterView === 'location' ? 'Location'
    : filterView === 'photo' ? 'Photo'
    : 'Category';

  // ── Sections for SectionList ──────────────────────────────────────────────

  const sections: Section[] = useMemo(() => {
    if (listKind === 'photo') {
      if (filterView === 'location') {
        const itemsAll       = data[PHOTO_ITEMS_CATEGORY] || [];
        const itemsPopulated = itemsAll.filter(i => i.sub || i.desc || i.photoDataUrl);
        if (showPhotoListEmpty) {
          // State 6: locations exist but no items — show location sections only
          return locations.map(loc => ({
            title: loc.name, catIndex: 0, sectionKind: 'location' as const,
            locId: loc.id, locPhotoDataUrl: loc.photoDataUrl,
            data: [],
            checkedCount: 0, totalCount: 0, checkedWeightOz: 0,
          }));
        }
        const unassigned = itemsPopulated.filter(i => !i.locationId);
        const itemsSection: Section = {
          title: PHOTO_ITEMS_CATEGORY, catIndex: 0, sectionKind: 'normal',
          data: (allExpanded || openCatName === PHOTO_ITEMS_CATEGORY) ? unassigned : [],
          checkedCount:    unassigned.filter(i => i.checked).length,
          totalCount:      unassigned.length,
          checkedWeightOz: unassigned.filter(i => i.checked)
            .reduce((s, i) => s + calcTotalOz(i.weightOz, i.qty), 0),
        };
        const addPhotoBarSection: Section = {
          title: '__add_photo_bar__', catIndex: -1, sectionKind: 'add-photo-bar',
          data: [], checkedCount: 0, totalCount: 0, checkedWeightOz: 0,
        };
        const locSections: Section[] = locations.map(loc => {
          const locItems = itemsPopulated.filter(i => i.locationId === loc.id);
          return {
            title: loc.name, catIndex: 0, sectionKind: 'location' as const,
            locId: loc.id, locPhotoDataUrl: loc.photoDataUrl,
            data: openLocNames.has(loc.id) ? locItems : [],
            checkedCount:    locItems.filter(i => i.checked).length,
            totalCount:      locItems.length,
            checkedWeightOz: locItems.filter(i => i.checked)
              .reduce((s, i) => s + calcTotalOz(i.weightOz, i.qty), 0),
          };
        });
        // F-20: omit itemsSection when there are no unassigned items
        return [
          ...(unassigned.length > 0 ? [itemsSection] : []),
          addPhotoBarSection,
          ...locSections,
        ];
      }
      // Photo List category view (filterView === 'category')
      return allSections.map(s => ({
        ...s,
        data: allExpanded || openCatName === s.title ? s.data : [],
      }));
    }

    // Standard list
    if (filterView === 'photo') {
      // Show only items that have a photoDataUrl
      return allSections.map(s => {
        const photoItems = s.data.filter(i => !!i.photoDataUrl);
        return {
          ...s, data: (allExpanded || openCatName === s.title) ? photoItems : [],
          totalCount: photoItems.length,
          checkedCount: photoItems.filter(i => i.checked).length,
        };
      }).filter(s => s.totalCount > 0);
    }

    return allSections.map(s => ({
      ...s,
      data: allExpanded || openCatName === s.title ? s.data : [],
    }));
  }, [
    listKind, filterView, data, allSections,
    allExpanded, openCatName, locations, openLocNames, showPhotoListEmpty,
  ]);

  // Summary calculations
  const { baseWeightOz, clothingWornOz, dogPackOz, expendablesOz, grandTotalOz } = calcWeights(data);
  const summaryTotals = categoryOrder
    .map(cat => ({ name: cat, oz: (data[cat] || []).filter(i => i.checked)
      .reduce((s, i) => s + calcTotalOz(i.weightOz, i.qty), 0) }))
    .filter(c => c.oz > 0).sort((a, b) => b.oz - a.oz);

  // Item 3: weight-distribution slices for DonutChart in Summary Modal — v3 §12.2 Card 2
  const donutSlices = grandTotalOz > 0
    ? summaryTotals.map(c => ({
        name: c.name,
        oz: c.oz,
        color: getCategoryTheme(c.name, categoryOrder.indexOf(c.name)).bg,
        pct: (c.oz / grandTotalOz) * 100,
      }))
    : [];

  // P3 R0076/R0101: only a genuinely long single-open category gets a
  // bounded item viewport. Header and Add Item remain stationary around it.
  const lockedSection = openCatName && !allExpanded
    ? allSections.find(section => section.title === openCatName) ?? null
    : null;
  const lockedAvailH = Math.max(44, listViewportH - CAT_HEADER_H - 44);
  const expandedExtraH = expandedItemKey?.cat === openCatName ? 352 : 0;
  const isLongCategoryOpen = !!lockedSection && filterView === 'category' &&
    (lockedSection.data.length * 44 + expandedExtraH > lockedAvailH + 4);

  const recalcLockedOverflow = useCallback((y: number) => {
    const maxY = Math.max(0, lockedContentHRef.current - lockedViewportHRef.current);
    setLockedScrollY(y);
    setLockedCanScrollDown(y < maxY - 4);
  }, []);

  useEffect(() => {
    setLockedScrollY(0);
    if (isLongCategoryOpen) {
      requestAnimationFrame(() => lockedItemsRef.current?.scrollTo({ y: 0, animated: false }));
    }
  }, [openCatName, isLongCategoryOpen]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: PAGE_BG }]}>
        <ActivityIndicator size="large" color={NAV_ACTIVE} />
      </View>
    );
  }

  return (
    <View
      ref={(node) => node?.measureInWindow((_x, y) => { rootTopRef.current = y; })}
      style={[styles.container, { backgroundColor: PAGE_BG }]}
    >
      {/* ── Fixed top ──────────────────────────────────────────────────── */}
      <AppBar onMenuPress={() => setShowDrawer(true)} handedness={handedness} homeVisible={showHome} />
      <ListSummaryHero
        listName={listName} totalItems={totalItems} catCount={catCount}
        selectedCount={selectedCount} allExpanded={allExpanded}
        onExpandToggle={handleExpandAll} onNameTap={handleHeroNameTap}
      />
      {/* F-12: measure filter bar bottom for dropdown positioning */}
      <View onLayout={e => setFilterBarBottom(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}>
        <FilterControl
          viewLabel={filterLabel}
          isOpen={showFilterDD}
          onToggle={() => setShowFilterDD(v => !v)}
        />
      </View>

      {/* ── Filter dropdown overlay ──────────────────────────────────── */}
      {showFilterDD && (
        <View style={[styles.filterDDContainer, { top: filterBarBottom }]} pointerEvents="box-none">
          <FilterDropdown
            visible={showFilterDD}
            current={filterView}
            onSelect={(mode) => { setFilterView(mode); setShowFilterDD(false); }}
            onClose={() => setShowFilterDD(false)}
          />
        </View>
      )}

      {/* ── Photo List empty state — via ListHeaderComponent ────────── */}
      {/* Main SectionList always rendered; empty card shows as header */}

      {/* ── "Add another photo" bar (top of Photo List, has items) ──── */}
      {listKind === 'photo' && photoListHasItems && filterView === 'category' && (
        <AddAnotherPhotoBar onPress={handleOpenSource} />
      )}

      {/* ── Scrolling category / location list ──────────────────────── */}
      <View
        ref={listContainerRef}
        style={{ flex: 1 }}
        onLayout={e => setListViewportH(e.nativeEvent.layout.height)}
      >
      <SectionList
        ref={sectionListRef}
        sections={sections}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={showPhotoListEmpty && !(filterView === 'location' && locations.length > 0) ? ( // F-19
          <PhotoListEmptyCard
            pendingCapture={photoListCaptureDataUrl}
            locations={locations}
            onAddPhoto={handleOpenSource}
            onChooseClassification={() => setShowAssignment(true)}
            onReplacePhoto={handleOpenSource}
          />
        ) : null}
        renderItem={({ item, section }) => {
          const s = section as Section;
          if (s.sectionKind === 'add-photo-bar') return null;
          const isExpanded = expandedItemKey?.cat === s.title && expandedItemKey?.id === item.id;
          // D-67: in photo filter view, render full-width photo card instead of swipe row
          if (filterView === 'photo' && !!item.photoDataUrl) {
            const picCat = s.sectionKind === 'location' ? PHOTO_ITEMS_CATEGORY : s.title;
            return (
              <PhotoItemCard
                item={item}
                weightUnit={weightUnit}
                onDelete={() => handleItemDelete(item, picCat)}
                onEditPhoto={() => { setPhotoTarget({ cat: picCat, id: item.id }); setShowItemPhotoSheet(true); }}
              />
            );
          }
          return (
            <View>
              <AnimatedSwipeRow
                item={item}
                category={s.sectionKind === 'location' ? PHOTO_ITEMS_CATEGORY : s.title}
                onToggle={toggleItem}
                onTapName={handleTapItemName}
                onDelete={handleItemDelete}
                weightUnit={weightUnit}
              />
              {isExpanded && (() => {
                const itemCat = s.sectionKind === 'location' ? PHOTO_ITEMS_CATEGORY : s.title;
                const liveItem = (data[itemCat] || []).find(i => i.id === item.id);
                if (!liveItem) return null;
                return (
                  <ItemDetailPanel
                    item={liveItem}
                    category={itemCat}
                    categories={categoryOrder}
                    locations={locations}
                    weightUnit={weightUnit}
                    onRename={(name) => handleDetailRename(itemCat, item.id, name)}
                    onUpdate={(patch) => handleDetailUpdate(itemCat, item.id, patch)}
                    onMove={(newCat)  => handleDetailMove(itemCat, item.id, newCat)}
                    onDelete={()      => handleDetailDelete(itemCat, item.id)}
                    onPhoto={()       => { setPhotoTarget({ cat: itemCat, id: item.id }); setShowItemPhotoSheet(true); }}
                    onClose={()       => setExpandedItemKey(null)}
                    onCreateLocation={(name, cb) => { const locId = addLocation(name, ''); cb(locId); }}
                  />
                );
              })()}
            </View>
          );
        }}
        renderSectionHeader={({ section }) => {
          const s = section as Section;

          if (s.sectionKind === 'add-photo-bar') {
            return <AddAnotherPhotoBar onPress={handleOpenSource} />;
          }

          if (s.sectionKind === 'location' && s.locId) {
            const loc = locations.find(l => l.id === s.locId);
            if (!loc) return null;
            return (
              <View>
                <LocationBar
                  loc={loc}
                  totalCount={s.totalCount}
                  checkedCount={s.checkedCount}
                  isOpen={openLocNames.has(s.locId)}
                  onToggle={() => handleLocToggle(s.locId!)}
                  onRename={() => {
                    if (Platform.OS === 'ios') {
                      Alert.prompt('Rename Location', undefined, (text) => {
                        if (text?.trim()) updateLocation(s.locId!, { name: text.trim() });
                      }, 'plain-text', loc.name);
                    } else {
                      Alert.alert('Rename Location', 'Renaming is available on iOS.');
                    }
                  }}
                  onCamera={() => { setLocPhotoTarget(s.locId!); setShowLocPhotoSheet(true); }}
                />
                {/* D-65: full-width location photo + D-66: pencil edit overlay (Task 3 / Batch I) */}
                {openLocNames.has(s.locId) && !!loc.photoDataUrl && (
                  <View style={{ position: 'relative' }}>
                    <Image
                      source={{ uri: loc.photoDataUrl }}
                      style={styles.locAccordionPhoto}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.locAccordionPhotoEdit}
                      onPress={() => { setLocPhotoTarget(s.locId!); setShowLocPhotoSheet(true); }}
                      hitSlop={8}
                    >
                      <Ionicons name="pencil-outline" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }

          // Normal category header — wrapped in CategorySwipeRow for swipe reveal
          const full = allSections.find(a => a.title === s.title) || s;
          // Suppress swipe on Photo List structural category
          const suppressSwipe = listKind === 'photo' && s.title === PHOTO_ITEMS_CATEGORY;
          const catHeaderLayout = (e: any) => {
            catBarHsRef.current.set(s.title, e.nativeEvent.layout.height);
            requestAnimationFrame(() => {
              catBarRefsRef.current.get(s.title)?.measureInWindow((_x: number, y: number, _w: number, h: number) => {
                catBarYsRef.current.set(s.title, y);
                catBarHsRef.current.set(s.title, h);
              });
            });
          };
          const header = (
            <SectionHeader
              title={s.title}
              catIndex={s.catIndex}
              checkedCount={full.checkedCount}
              totalCount={full.totalCount}
              checkedWeightOz={full.checkedWeightOz}
              isOpen={allExpanded || openCatName === s.title}
              onToggle={() => handleCatToggle(s.title)}
              onLongPress={(x, y) => handleCatLongPress(s.title, x, y)}
              onDragMove={updateDragAnims}
              onDragEnd={commitDrag}
              weightUnit={weightUnit}
            />
          );
          // Task 4 (Batch I): wrap in Animated.View so sibling bars shift during drag
          if (suppressSwipe) return (
            <Animated.View ref={(node) => { catBarRefsRef.current.set(s.title, node); }} onLayout={catHeaderLayout} style={{
              transform: [{ translateY: getDragAnim(s.title) }],
              opacity: draggingCat === s.title ? 0 : (dragTargetIdx === categoryOrder.indexOf(s.title) ? 0.55 : 1),
            }}>
              {header}
            </Animated.View>
          );
          return (
            <Animated.View ref={(node) => { catBarRefsRef.current.set(s.title, node); }} onLayout={catHeaderLayout} style={{
              transform: [{ translateY: getDragAnim(s.title) }],
              opacity: draggingCat === s.title ? 0 : (dragTargetIdx === categoryOrder.indexOf(s.title) ? 0.55 : 1),
            }}>
              <CategorySwipeRow
                catName={s.title}
                itemCount={(data[s.title] || []).length}
                onRename={(oldName) => {
                  if (Platform.OS === 'ios') {
                    Alert.prompt('Rename Category', undefined, (text) => {
                      if (text?.trim()) renameCategory(oldName, text.trim());
                    }, 'plain-text', oldName);
                  }
                }}
                onDelete={(catName) => deleteCategory(catName)}
              >
                {header}
              </CategorySwipeRow>
            </Animated.View>
          );
        }}
        renderSectionFooter={({ section }) => {
          const s = section as Section;
          if (s.sectionKind === 'add-photo-bar' || s.sectionKind === 'location') return null;
          const isOpen = allExpanded || openCatName === s.title;
          if (!isOpen) return null;
          // D-35: normal mode shows 3-option accordion; all-expanded goes direct
          const showAccordion = !allExpanded && addItemAccordionCat === s.title;
          return (
            <View>
              <AddItemBar
                catName={s.title}
                accordionOpen={showAccordion}
                onPress={() => {
                  if (allExpanded) {
                    // all-expanded: direct add (correct for that mode per spec §8)
                    const newId = addItem(s.title, '', 0, 1);
                    setExpandedItemKey({ cat: s.title, id: newId });
                  } else {
                    // normal mode: toggle the 3-option accordion
                    setAddItemAccordionCat(prev => prev === s.title ? null : s.title);
                  }
                }}
              />
              {showAccordion && (
                <View style={styles.addItemAccordion}>
                  {/* Row 1: Name — create item + expand name input */}
                  <TouchableOpacity style={styles.accordionRow} activeOpacity={0.7} onPress={() => {
                    const newId = addItem(s.title, '', 0, 1);
                    setExpandedItemKey({ cat: s.title, id: newId });
                    setAddItemAccordionCat(null);
                  }}>
                    <Ionicons name="pencil-outline" size={14} color={NAV_ACTIVE} />
                    <Text style={styles.accordionRowText}>Name</Text>
                  </TouchableOpacity>
                  {/* Row 2: Photo — create item + immediately launch camera (Task 5 / F-05) */}
                  <TouchableOpacity style={styles.accordionRow} activeOpacity={0.7} onPress={() => {
                    const newId = addItem(s.title, '', 0, 1);
                    setPhotoTarget({ cat: s.title, id: newId });
                    setExpandedItemKey({ cat: s.title, id: newId });
                    setPendingNewItemCleanup({ cat: s.title, id: newId }); // F-06: cleanup on cancel
                    setItemPhotoInitialSource('camera');                   // Task 5: skip sheet → camera
                    setAddItemAccordionCat(null);
                    setTimeout(() => setShowItemPhotoSheet(true), 50);
                  }}>
                    <Ionicons name="camera-outline" size={14} color={NAV_ACTIVE} />
                    <Text style={styles.accordionRowText}>Photo</Text>
                  </TouchableOpacity>
                  {/* Row 3: Master List — coming soon placeholder */}
                  <TouchableOpacity style={styles.accordionRow} activeOpacity={0.7} onPress={() => {
                    setAddItemAccordionCat(null);
                    Alert.alert('Master List', 'Master List search is coming soon on mobile.');
                  }}>
                    <Ionicons name="library-outline" size={14} color={NAV_ACTIVE} />
                    <Text style={styles.accordionRowText}>Master List</Text>
                  </TouchableOpacity>
                </View>
              )}
              {listKind === 'photo' && s.title === PHOTO_ITEMS_CATEGORY && (
                <AddAnotherPhotoBar onPress={handleOpenSource} />
              )}
            </View>
          );
        }}
        stickySectionHeadersEnabled
        ListFooterComponent={filterView === 'category'
          ? <View style={{ height: CATEGORY_TRAILING_SCROLL_H }} pointerEvents="none" />
          : null}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        style={styles.list}
        onScroll={e => { scrollYRef.current = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
      />

      {isLongCategoryOpen && lockedSection && (
        <View style={styles.lockedCategoryViewport}>
          <CategorySwipeRow
            catName={lockedSection.title}
            itemCount={(data[lockedSection.title] || []).length}
            onRename={(oldName) => {
              if (Platform.OS === 'ios') {
                Alert.prompt('Rename Category', undefined, (text) => {
                  if (text?.trim()) renameCategory(oldName, text.trim());
                }, 'plain-text', oldName);
              }
            }}
            onDelete={(catName) => deleteCategory(catName)}
          >
            <SectionHeader
              title={lockedSection.title}
              catIndex={lockedSection.catIndex}
              checkedCount={lockedSection.checkedCount}
              totalCount={lockedSection.totalCount}
              checkedWeightOz={lockedSection.checkedWeightOz}
              isOpen
              onToggle={() => handleCatToggle(lockedSection.title)}
              onLongPress={(x, y) => handleCatLongPress(lockedSection.title, x, y)}
              onDragMove={updateDragAnims}
              onDragEnd={commitDrag}
              weightUnit={weightUnit}
            />
          </CategorySwipeRow>

          <ScrollView
            ref={lockedItemsRef}
            style={styles.lockedItems}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            onLayout={e => {
              lockedViewportHRef.current = e.nativeEvent.layout.height;
              recalcLockedOverflow(lockedScrollY);
            }}
            onContentSizeChange={(_w, h) => {
              lockedContentHRef.current = h;
              recalcLockedOverflow(lockedScrollY);
            }}
            onScroll={e => recalcLockedOverflow(e.nativeEvent.contentOffset.y)}
            scrollEventThrottle={16}
          >
            {lockedSection.data.map(item => {
              const isExpanded = expandedItemKey?.cat === lockedSection.title && expandedItemKey?.id === item.id;
              const liveItem = (data[lockedSection.title] || []).find(i => i.id === item.id);
              return (
                <View key={item.id}>
                  <AnimatedSwipeRow
                    item={item}
                    category={lockedSection.title}
                    onToggle={toggleItem}
                    onTapName={handleTapItemName}
                    onDelete={handleItemDelete}
                    weightUnit={weightUnit}
                  />
                  {isExpanded && liveItem && (
                    <ItemDetailPanel
                      item={liveItem}
                      category={lockedSection.title}
                      categories={categoryOrder}
                      locations={locations}
                      weightUnit={weightUnit}
                      onRename={(name) => handleDetailRename(lockedSection.title, item.id, name)}
                      onUpdate={(patch) => handleDetailUpdate(lockedSection.title, item.id, patch)}
                      onMove={(newCat) => handleDetailMove(lockedSection.title, item.id, newCat)}
                      onDelete={() => handleDetailDelete(lockedSection.title, item.id)}
                      onPhoto={() => { setPhotoTarget({ cat: lockedSection.title, id: item.id }); setShowItemPhotoSheet(true); }}
                      onClose={() => setExpandedItemKey(null)}
                      onCreateLocation={(name, cb) => { const locId = addLocation(name, ''); cb(locId); }}
                    />
                  )}
                </View>
              );
            })}
          </ScrollView>

          {addItemAccordionCat === lockedSection.title && (
            <View style={styles.addItemAccordion}>
              <TouchableOpacity style={styles.accordionRow} activeOpacity={0.7} onPress={() => {
                const newId = addItem(lockedSection.title, '', 0, 1);
                setExpandedItemKey({ cat: lockedSection.title, id: newId });
                setAddItemAccordionCat(null);
              }}>
                <Ionicons name="pencil-outline" size={14} color={NAV_ACTIVE} />
                <Text style={styles.accordionRowText}>Name</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.accordionRow} activeOpacity={0.7} onPress={() => {
                const newId = addItem(lockedSection.title, '', 0, 1);
                setPhotoTarget({ cat: lockedSection.title, id: newId });
                setExpandedItemKey({ cat: lockedSection.title, id: newId });
                setPendingNewItemCleanup({ cat: lockedSection.title, id: newId });
                setItemPhotoInitialSource('camera');
                setAddItemAccordionCat(null);
                setTimeout(() => setShowItemPhotoSheet(true), 50);
              }}>
                <Ionicons name="camera-outline" size={14} color={NAV_ACTIVE} />
                <Text style={styles.accordionRowText}>Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.accordionRow} activeOpacity={0.7} onPress={() => {
                setAddItemAccordionCat(null);
                Alert.alert('Master List', 'Master List search is coming soon on mobile.');
              }}>
                <Ionicons name="library-outline" size={14} color={NAV_ACTIVE} />
                <Text style={styles.accordionRowText}>Master List</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.lockedAddRow}>
            <AddItemBar
              catName={lockedSection.title}
              accordionOpen={addItemAccordionCat === lockedSection.title}
              style={{ flex: 1, borderBottomWidth: 0 }}
              onPress={() => setAddItemAccordionCat(prev => prev === lockedSection.title ? null : lockedSection.title)}
            />
            <TouchableOpacity
              style={[styles.lockedPageButton, lockedScrollY <= 4 && styles.lockedPageButtonDisabled]}
              disabled={lockedScrollY <= 4}
              onPress={() => lockedItemsRef.current?.scrollTo({ y: Math.max(0, lockedScrollY - lockedViewportHRef.current), animated: true })}
              accessibilityLabel="Show earlier items"
            >
              <Ionicons name="chevron-up" size={18} color={NAV_INACTIVE} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.lockedPageButton, !lockedCanScrollDown && styles.lockedPageButtonDisabled]}
              disabled={!lockedCanScrollDown}
              onPress={() => lockedItemsRef.current?.scrollTo({ y: lockedScrollY + lockedViewportHRef.current, animated: true })}
              accessibilityLabel="Show later items"
            >
              <Ionicons name="chevron-down" size={18} color={NAV_INACTIVE} />
            </TouchableOpacity>
          </View>
        </View>
      )}
      </View>

      {/* Home is an absolute sibling of the list, preserving all list state and
          refs underneath while BottomBox stays above it at z-index 40. */}
      {showHome && (
        <HomeOverlay
          top={insets.top + APPBAR_H}
          bottomInset={bottomPad}
          onStartHere={() => { setShowHome(false); setShowAdd(true); }}
          onMyLists={() => {
            setShowHome(false);
            refreshLockerEntries();
            setShowLocker(true);
          }}
          onMasterList={() => {
            setShowHome(false);
            Alert.alert('Master List', 'Master List search is coming soon on mobile.');
          }}
          onSettings={() => {
            setShowHome(false);
            setMoreInitialCard('settings');
            setShowMore(true);
          }}
        />
      )}

      {/* ── Fixed bottom ──────────────────────────────────────────────── */}
      <BottomBox
        groupIdx={groupIdx} onAction={handleBoxAction}
        bottomPad={bottomPad} disabledSet={disabledActions}
        handedness={handedness}
        activeAction={
          showLocker    ? 'locker'    :
          showSummary   ? 'summary'   :
          showAdd       ? 'add'       :
          showSearch    ? 'search'    :
          showMore      ? 'more'      :
          showChecklist ? 'checklist' :
          undefined
        }
      />

      {/* ── Summary sheet ─────────────────────────────────────────────── */}
      <Modal
        visible={showSummary}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSummary(false)}
      >
        <View style={[styles.summarySheet, { paddingTop: Platform.OS === 'ios' ? 8 : insets.top + 8 }]}>
          <View style={styles.summaryHandle} />
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.summaryTitle}>Pack Summary</Text>
              <Text style={styles.summarySubtitle}>{selectedCount} item{selectedCount !== 1 ? 's' : ''} packed</Text>
            </View>
            <TouchableOpacity onPress={() => setShowSummary(false)} hitSlop={16} style={styles.summaryCloseBtn}>
              <Ionicons name="close" size={22} color="#374151" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.summaryScroll}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: insets.bottom + 24 }}
            showsVerticalScrollIndicator={false}
          >
            {grandTotalOz > 0 ? (
              <View style={styles.summaryContent}>
                {/* D-53: pass weightUnit to all summary rows */}
                <SummaryWeightRow label="Grand Total"  oz={grandTotalOz} accent weightUnit={weightUnit} />
                <View style={styles.summaryPairRow}>
                  <SummaryWeightRow label="Base Weight"   oz={baseWeightOz}   half weightUnit={weightUnit} />
                  <SummaryWeightRow label="Clothing Worn" oz={clothingWornOz} half weightUnit={weightUnit} />
                </View>
                <View style={styles.summaryPairRow}>
                  <SummaryWeightRow label="Dog Pack"    oz={dogPackOz}    half weightUnit={weightUnit} />
                  <SummaryWeightRow label="Expendables" oz={expendablesOz} half weightUnit={weightUnit} />
                </View>
                {summaryTotals.length > 0 && (
                  <View style={styles.summaryBreakdown}>
                    <Text style={styles.summaryBreakdownTitle}>WEIGHT BREAKDOWN</Text>
                    {summaryTotals.map(cat => (
                      <SummaryCatBar key={cat.name} name={cat.name} oz={cat.oz} totalOz={grandTotalOz} weightUnit={weightUnit} />
                    ))}
                  </View>
                )}
                {/* Item 3: Weight Distribution donut chart — v3 §12.2 Card 2 */}
                {donutSlices.length > 0 && (
                  <View style={styles.summaryBreakdown}>
                    <Text style={styles.summaryBreakdownTitle}>WEIGHT DISTRIBUTION</Text>
                    <DonutChart slices={donutSlices} />
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.summaryEmpty}>
                <Text style={styles.summaryEmptyText}>Nothing packed yet</Text>
                <Text style={styles.summaryEmptyHint}>Check off items in the gear list</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* ── Locker / Add / Search sheets ──────────────────────────────── */}
      <LockerModal
        visible={showLocker}
        onClose={() => setShowLocker(false)}
        showToast={showToast}
        onNewList={() => setShowStandardListName(true)}
      />
      <PhotoListNameSheet
        visible={showStandardListName}
        kind="standard"
        onClose={() => setShowStandardListName(false)}
        onCreated={(name) => {
          setShowStandardListName(false);
          showToast(`Created '${name}'`);
        }}
      />
      {/* D-54: onItemAdded expands/focuses the new item after creation from the Add Deck */}
      <AddDeck
        visible={showAdd} onClose={() => setShowAdd(false)} showToast={showToast}
        onItemAdded={(cat, id) => { setOpenCatName(cat); setExpandedItemKey({ cat, id }); }}
      />
      <SearchModal visible={showSearch} onClose={() => setShowSearch(false)} />

      {/* ── Photo List sheets (cascade chain) ─────────────────────────── */}
      <PhotoListSourceSheet
        visible={showSourceSheet}
        onClose={() => setShowSourceSheet(false)}
        onCapture={handleCaptured}
      />
      <PhotoListAssignmentSheet
        visible={showAssignment}
        photoDataUrl={photoListCaptureDataUrl}
        onDecideLater={handleDecideLater}
        onPickLocation={handlePickLocation}
        onPickItem={handlePickItem}
      />
      <PhotoListLocationNameSheet
        visible={showLocName}
        photoDataUrl={photoListCaptureDataUrl}
        onBack={handleLocNameBack}
        onSaved={handleLocationSaved}
      />
      <PhotoListItemDestinationSheet
        visible={showItemDest}
        locations={locations}
        onBack={handleItemDestBack}
        onAssigned={handleItemAssigned}
      />
      <PhotoListItemNameSheet
        visible={showItemName}
        itemId={newItemId}
        onClose={handleItemNameClose}
      />

      {/* ── New overlays (repair pass) ─────────────────────────────────── */}
      <NavigationDrawer
        visible={showDrawer}
        handedness={handedness}
        onClose={() => setShowDrawer(false)}
        onToggleHandedness={() => setHandedness(h => h === 'right' ? 'left' : 'right')}
        onMyLists={() => {
          setShowDrawer(false);
          setTimeout(() => { refreshLockerEntries(); setShowLocker(true); }, 200);
        }}
        onOpenMore={() => { setShowDrawer(false); setMoreInitialCard('actions'); setTimeout(() => setShowMore(true), 300); }}
        onOpenHome={() => {
          // Home starts from a clean navigation layer without unmounting or
          // mutating the underlying list, so returning preserves its state.
          setShowSummary(false);
          setShowLocker(false);
          setShowMore(false);
          setShowAdd(false);
          setShowChecklist(false);
          setShowPreview(false);
          setShowFilterDD(false);
          setShowResetSheet(false);
          setInfoStack([]);
          setShowSourceSheet(false);
          setShowAssignment(false);
          setShowLocName(false);
          setShowItemDest(false);
          setShowItemName(false);
          setShowItemPhotoSheet(false);
          setShowLocPhotoSheet(false);
          setShowCatPicker(false);
          setShowHome(true);
        }}
        onOpenHelp={() => {
          setShowDrawer(false);
          setShowMore(false);
          setInfoStack([{ page: 'help' }]);
        }}
      />

      <PreviewOverlay
        visible={showPreview}
        onClose={() => setShowPreview(false)}
        weightUnit={weightUnit}
      />

      <MoreDeck
        visible={showMore}
        onClose={() => setShowMore(false)}
        onOpenInfo={(page) => {
          setShowMore(false);
          setShowDrawer(false);
          setInfoStack([{ page }]);
        }}
        onSave={() => {
          // D-48p: More Deck Save shows the Save Chooser (same as Group 4 Save button)
          setShowMore(false);
          setTimeout(() => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Alert.alert('Save List', undefined, [
              { text: 'Save', onPress: () => { saveToLocker(); showToast('List saved'); } },
              { text: 'Save As Copy…', onPress: () => {
                if (Platform.OS === 'ios') {
                  Alert.prompt('Save As', 'Name for the new copy:', (text) => {
                    if (text?.trim()) { saveAsToLocker(text.trim()); showToast(`Saved as '${text.trim()}'`); }
                  }, 'plain-text', listName);
                } else Alert.alert('Save As', 'Saving as a copy is available on iOS.');
              }},
              { text: 'Cancel', style: 'cancel' },
            ]);
          }, 300);
        }}
        onSaveAs={() => {
          if (Platform.OS === 'ios') {
            Alert.prompt('Save As', 'Name for the new copy:', (text) => {
              if (text?.trim()) { saveAsToLocker(text.trim()); showToast(`Saved as '${text.trim()}'`); }
            }, 'plain-text', listName);
          } else {
            Alert.alert('Save As', 'Saving as a copy is available on iOS.');
          }
        }}
        onOpenChecklist={() => { setShowMore(false); setTimeout(() => setShowChecklist(true), 200); }}
        weightUnit={weightUnit}
        onSetWeightUnit={setWeightUnit}
        initialCard={moreInitialCard}
      />

      <InfoScreen
        visible={infoStack.length > 0}
        page={infoStack.at(-1)?.page ?? null}
        sourceRef={infoStack.at(-1)?.sourceRef}
        onBack={() => setInfoStack((stack) => stack.length > 1 ? stack.slice(0, -1) : [])}
        onOpenHelp={() => setInfoStack((stack) => [...stack, { page: 'help' }])}
        onOpenSources={(ref) => setInfoStack((stack) => [...stack, { page: 'sources', sourceRef: ref ?? null }])}
      />

      <ChecklistOverlay
        visible={showChecklist}
        onClose={() => setShowChecklist(false)}
        weightUnit={weightUnit}
      />

      <CategoryPickerSheet
        visible={showCatPicker}
        categories={categoryOrder}
        source={catPickerSource}
        onSelect={handleCatPickerSelect}
        onClose={() => setShowCatPicker(false)}
      />

      <ItemPhotoSheet
        visible={showItemPhotoSheet}
        hasPhoto={!!(photoTarget && (data[photoTarget.cat] || []).find(i => i.id === photoTarget?.id)?.photoDataUrl)}
        onCapture={handleItemPhotoCapture}
        onDelete={handleItemPhotoDelete}
        initialSource={itemPhotoInitialSource}
        onClose={() => { setShowItemPhotoSheet(false); setItemPhotoInitialSource(undefined); }}
        onCancel={() => {    // F-06: delete blank item if user cancels without taking a photo
          if (pendingNewItemCleanup) {
            deleteItem(pendingNewItemCleanup.cat, pendingNewItemCleanup.id);
            setExpandedItemKey(null);
            setPendingNewItemCleanup(null);
          }
          setShowItemPhotoSheet(false);
          setItemPhotoInitialSource(undefined);
        }}
      />

      {/* D-64: Location photo sheet — updates location.photoDataUrl via updateLocation */}
      <ItemPhotoSheet
        visible={showLocPhotoSheet}
        hasPhoto={!!(locPhotoTarget && locations.find(l => l.id === locPhotoTarget)?.photoDataUrl)}
        onCapture={(dataUrl) => {
          if (locPhotoTarget) updateLocation(locPhotoTarget, { photoDataUrl: dataUrl });
          setShowLocPhotoSheet(false);
        }}
        onDelete={() => {
          if (locPhotoTarget) updateLocation(locPhotoTarget, { photoDataUrl: '' });
          setShowLocPhotoSheet(false);
        }}
        onClose={() => setShowLocPhotoSheet(false)}
        onCancel={() => setShowLocPhotoSheet(false)}
      />

      {/* N-02: Drag-reorder floating category header overlay */}
      {draggingCat !== null && (() => {
        const catIdx   = categoryOrder.indexOf(draggingCat);
        const catItems = data[draggingCat] || [];
        return (
          <View
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 998 }}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderMove={(e) => {
              setDragOverlayY(e.nativeEvent.pageY - rootTopRef.current - (catBarHsRef.current.get(draggingCat) ?? CAT_HEADER_H) / 2);
              updateDragAnims(e.nativeEvent.pageY); // Task 4: animate siblings to show drop slot
            }}
            onResponderRelease={(e) => commitDrag(e.nativeEvent.pageY)}
            onResponderTerminate={cancelDrag}
          >
            <View
              style={[
                {
                  position: 'absolute', left: 0, right: 0,
                  top: dragOverlayY,
                  transform: [{ scale: 1.015 }],
                  // Item 24: v3 VF §8 drag shadow dominant layer = 0 8px 26px rgba(0,0,0,0.24)
                  // RN only supports one shadow; approximate with opacity=0.24, radius=26
                  shadowOpacity: 0.24, shadowRadius: 26,
                  shadowOffset: { width: 0, height: 8 }, elevation: 10,
                },
              ]}
              pointerEvents="none"
            >
              <CategoryCardContent
                title={draggingCat}
                catIndex={catIdx}
                checkedCount={catItems.filter(i => i.checked).length}
                totalCount={catItems.length}
                checkedWeightOz={catItems.filter(i => i.checked).reduce((s, i) => s + calcTotalOz(i.weightOz, i.qty), 0)}
                weightUnit={weightUnit}
              />
            </View>
          </View>
        );
      })()}

      {/* ── Item 10: Reset Checks confirm sheet ─────────────────────────── */}
      {/* v3 §13.10: title/body/label/colour all match exactly now. */}
      {/* VF §13: bg #fff; radius 16/16/0/0; shadow 0 -4px 32px rgba(0,0,0,0.18); z-index 200 */}
      <ConfirmSheet
        visible={showResetSheet}
        onClose={() => setShowResetSheet(false)}
        title="Reset Checklist?"
        body="Clear all checked/packed marks in this list? Your items, categories, quantities, weights, and saved list will not be deleted."
        confirmLabel="Reset Checks"
        confirmColor="#b45309"
        onConfirm={() => {
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          resetAll();
          showToast('Checked items cleared'); // v3 §13.10: "Checked items cleared" (was "Checklist reset")
        }}
      />

      {/* ── Toast overlay ─────────────────────────────────────────────── */}
      {/* v3 §24: bottom = insets.bottom + 76 (76px above safe-area edge). Prior NAV_H+insets.bottom+8 ≈ 66px was wrong. MATCH. */}
      {!!toastMsg && (
        <View style={[styles.toast, { bottom: insets.bottom + 76 }]} pointerEvents="none">
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // AppBar
  appBar: {
    // Item 16: v3 VF §4 padding: 0 44px 0 8px (paddingRight=RIGHT_INSET=44, not 8)
    // Item 32: normal-state AppBar has only the border; Home adds the v3 shadow below.
    backgroundColor: '#FFFFFF', paddingLeft: 8, paddingRight: RIGHT_INSET,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.07)',
    zIndex: 10,
  },
  // Item 32: v3 Home-only shadow = 0 2px 10px rgba(0,0,0,0.10).
  // React Native's shadow properties are the native equivalent; elevation keeps
  // the same subtle separation on Android.
  appBarHome: {
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  appBarInner:    { height: APPBAR_H, flexDirection: 'row', alignItems: 'center', gap: 10 },
  appBarLogo:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  appBarTitle:    { fontSize: 19, fontFamily: 'Arial', color: PRIMARY_TEXT, letterSpacing: 0.1 },
  appBarShortcuts: { flexDirection: 'row', alignItems: 'center', gap: 5 },

  // Hero
  hero: {
    backgroundColor: SUMMARY_BG, paddingTop: 10, paddingBottom: 12,
    paddingLeft: 14, paddingRight: RIGHT_INSET, flexDirection: 'row',
    alignItems: 'center', gap: 14, shadowColor: '#000', shadowOpacity: 0.22,
    shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6, zIndex: 9,
  },
  heroTile: { width: 66, height: 66, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.20)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  heroContent: { flex: 1, gap: 6 },
  heroListNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroListName: { fontSize: 15.5, fontFamily: 'Arial', color: '#FFFFFF', lineHeight: 19, flexShrink: 1 },
  heroCountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  heroCount: { fontSize: 40, fontFamily: 'Arial', color: '#FFFFFF', letterSpacing: -1.5, lineHeight: 44 },
  heroCountSuffix: { fontSize: 17, fontFamily: 'Arial', color: 'rgba(255,255,255,0.78)', paddingBottom: 3 },
  heroChevronBtn: { paddingBottom: 3, alignSelf: 'flex-end' },
  heroRight: { alignItems: 'flex-end', justifyContent: 'center', gap: 6, flexShrink: 0 },
  heroCatCount: { fontSize: 12, fontFamily: 'Arial', color: 'rgba(255,255,255,0.58)', letterSpacing: 0.2 },
  heroSelectedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroSelectedIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.50)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heroSelectedText: { fontSize: 12, fontFamily: 'Arial', color: 'rgba(255,255,255,0.80)', letterSpacing: 0.1 },

  // FilterControl
  filterBar: {
    height: FILTER_H, backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 5,
    borderBottomWidth: 1, borderBottomColor: DIVIDER, justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
    elevation: 3, zIndex: 8,
  },
  filterButton: {
    minHeight: 36, flexDirection: 'row', alignItems: 'center', paddingVertical: 6,
    paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: DIVIDER,
    backgroundColor: '#FFFFFF', gap: 7,
  },
  filterLabel: { flex: 1, fontSize: 13, fontFamily: 'Arial', color: PRIMARY_TEXT, letterSpacing: 0.1 },

  // Filter dropdown container — sits below filter bar at z=100
  // F-12: `top` is applied inline via filterBarBottom measurement; bottom:0 lets it fill down
  filterDDContainer: {
    position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 100,
  },

  // SectionHeader
  sectionCardTouchable: { zIndex: 5 },
  sectionCard: {
    flexDirection: 'row', alignItems: 'stretch', height: CAT_HEADER_H,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: DIVIDER,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  sectionTile: { width: TILE_W, height: CAT_HEADER_H, alignItems: 'center', justifyContent: 'center' },
  wedgeSvg: { position: 'absolute', right: 0, top: 0 },
  sectionContent: { flex: 1, paddingLeft: 12, paddingVertical: 8, justifyContent: 'center', gap: 10 },
  sectionName: { fontSize: 17, fontFamily: 'Arial', color: PRIMARY_TEXT, lineHeight: 20, letterSpacing: -0.1 },
  sectionSub: { fontSize: 12.5, fontFamily: 'Arial', color: NAV_INACTIVE },
  sectionRight: { paddingLeft: 10, paddingRight: RIGHT_INSET, paddingVertical: 8, alignItems: 'flex-end', justifyContent: 'center', maxWidth: 96 + RIGHT_INSET }, // Item 21: v3 VF §8 column-gap=10px between name col and weight col
  sectionWeight: { fontSize: 13, fontFamily: 'Arial', color: PRIMARY_TEXT, letterSpacing: -0.2, textAlign: 'right' }, // Item 17: v3 VF §8 letterSpacing=-0.2 (was +0.1)

  // LocationBar
  locBarContent: {
    flex: 1, paddingLeft: 12, paddingVertical: 8,
    flexDirection: 'column', justifyContent: 'center', gap: 4,
  },
  locBarThumb: { width: 42, height: 42, borderRadius: 8, backgroundColor: NAV_ACTIVE },
  locBarThumbFallback: { alignItems: 'center', justifyContent: 'center' },
  locBarName: { fontSize: 13, fontFamily: 'Arial', color: PRIMARY_TEXT, maxWidth: 130 },
  locBarRight: { paddingRight: ITEM_R_INSET, paddingVertical: 8, alignItems: 'flex-end', justifyContent: 'center', gap: 3 },
  locBarType: { fontSize: 11, fontFamily: 'Arial', color: NAV_INACTIVE },
  locBarCount: { fontSize: 11, fontFamily: 'Arial', color: MUTED },

  // ItemRow
  itemRow: {
    flexDirection: 'row', alignItems: 'center', minHeight: 44, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: DIVIDER,
  },
  checkboxArea: { width: CHECKBOX_HIT, height: 44, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  itemNameZone: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingRight: ITEM_R_INSET, minHeight: 44, justifyContent: 'space-between' },
  itemName: { flex: 1, fontSize: 14.5, fontFamily: 'Arial', color: PRIMARY_TEXT, lineHeight: 20 },
  itemNameChecked: { color: NAV_INACTIVE, opacity: 0.8 },
  itemWeight: { fontSize: 12, fontFamily: 'Arial', color: NAV_INACTIVE, letterSpacing: 0.2, flexShrink: 0, marginLeft: 8 },

  // AddItemBar (D-35)
  addItemBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, minHeight: 44, backgroundColor: 'rgba(42,87,64,0.04)', // Item 18: v3 VF §10 min-height=44 (was 42)
    borderBottomWidth: 1, borderBottomColor: DIVIDER, borderTopWidth: 1, borderTopColor: DIVIDER,
  },
  addItemBarText: { fontSize: 13.5, fontFamily: 'Arial', color: NAV_ACTIVE }, // Item 19: v3 §7.1 weight=500 (was 600)
  // D-35: accordion rows below AddItemBar in normal mode
  addItemAccordion: {
    backgroundColor: '#FAFDF9',
    borderBottomWidth: 1, borderBottomColor: 'rgba(42,87,64,0.12)',
  },
  accordionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 24, minHeight: 44,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(42,87,64,0.15)',
  },
  accordionRowText: { fontSize: 13.5, fontFamily: 'Arial', color: NAV_ACTIVE }, // Item 20: v3 VF §10 fontSize=13.5 (was 14)

  // List
  list:        { flex: 1 },
  listContent: { paddingBottom: 4 },
  lockedCategoryViewport: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: PAGE_BG,
    zIndex: 7,
  },
  lockedItems: { flex: 1, backgroundColor: '#FFFFFF' },
  lockedAddRow: {
    minHeight: 44, flexDirection: 'row', backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: DIVIDER,
  },
  lockedPageButton: {
    width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center',
    borderLeftWidth: 1, borderLeftColor: DIVIDER,
  },
  lockedPageButtonDisabled: { opacity: 0.35 },

  // Photo List empty card
  emptyCard: {
    margin: 8, paddingHorizontal: 20, paddingVertical: 24, borderRadius: 16,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
  },
  emptyCardBadge: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(42,87,64,0.10)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  emptyCardTitle: { fontSize: 18, fontWeight: '700', color: PRIMARY_TEXT, textAlign: 'center', marginBottom: 6 },
  emptyCardSubtitle: { fontSize: 13.5, color: MUTED, lineHeight: 20, textAlign: 'center', marginBottom: 16 },
  pendingBlock: { width: '100%', marginBottom: 16 },
  pendingImage: { width: '100%', height: 168, borderRadius: 10, marginBottom: 10 },
  chooseBtn: {
    width: '100%', minHeight: 42, borderRadius: 9, borderWidth: 1, borderColor: NAV_ACTIVE,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  chooseBtnText: { fontSize: 14, fontWeight: '600', color: NAV_ACTIVE },
  replaceBtn: { width: '100%', minHeight: 42, borderRadius: 9, backgroundColor: NAV_ACTIVE, alignItems: 'center', justifyContent: 'center' },
  replaceBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  visualDestBlock: { width: '100%', marginBottom: 16, alignItems: 'flex-start' },
  visualDestLabel: { fontSize: 11, fontWeight: '700', color: MUTED, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8, alignSelf: 'flex-start' },
  visualDestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%' },
  visualDestTile: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 9, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', backgroundColor: '#FAFAF9', padding: 6 },
  visualDestThumb: { width: 34, height: 34, borderRadius: 6, backgroundColor: NAV_ACTIVE },
  visualDestThumbFallback: { backgroundColor: 'rgba(42,87,64,0.15)' },
  visualDestName: { fontSize: 12.5, fontWeight: '650' as any, color: PRIMARY_TEXT },
  addPhotoCTA: { width: '100%', minHeight: 44, borderRadius: 10, backgroundColor: NAV_ACTIVE, alignItems: 'center', justifyContent: 'center' },
  addPhotoCTAText: { fontSize: 14.5, fontWeight: '650' as any, color: '#fff' },

  // "Add another photo" bar
  addPhotoBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, minHeight: 44, backgroundColor: '#f7faf7',
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  addPhotoBarText: { fontSize: 14, fontWeight: '600', color: NAV_ACTIVE },

  // BottomBox
  bottomBox: {
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.07)',
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 }, elevation: 8, zIndex: 40,
  },
  bottomRow: { flexDirection: 'row', alignItems: 'stretch', minHeight: NAV_H },
  // v3 VF §11: "padding: 7px 0 8px". Prior paddingTop=9 was wrong. Self-check: MATCH.
  navBox: { flex: 1, paddingTop: 7, paddingBottom: 8, alignItems: 'center', justifyContent: 'center', gap: 2 },
  navLabel: { fontSize: 10, fontFamily: 'Arial', color: NAV_INACTIVE },

  // Summary sheet
  summarySheet: { flex: 1, backgroundColor: '#FFFFFF' },
  summaryHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.18)', alignSelf: 'center', marginTop: 8, marginBottom: 4 },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.10)' },
  summaryTitle: { fontSize: 20, fontFamily: 'Arial', color: '#111827', letterSpacing: -0.3 },
  summarySubtitle: { fontSize: 13, fontFamily: 'Arial', color: '#6B7280', marginTop: 2 },
  summaryCloseBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  summaryScroll: { flex: 1 },
  summaryContent: { gap: 10 },
  summaryPairRow: { flexDirection: 'row', gap: 10 },
  summaryBreakdown: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.08)', backgroundColor: '#F9FAFB', padding: 14, gap: 10 },
  summaryBreakdownTitle: { fontSize: 10, fontFamily: 'Arial', textTransform: 'uppercase', letterSpacing: 1.2, color: '#6B7280', marginBottom: 2 },
  summaryEmpty: { alignItems: 'center', paddingVertical: 48, gap: 6 },
  summaryEmptyText: { fontSize: 15, fontFamily: 'Arial', color: '#6B7280' },
  summaryEmptyHint: { fontSize: 13, fontFamily: 'Arial', color: '#9CA3AF' },
  sumCard: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 3 },
  sumCardLabel: { fontSize: 10, fontFamily: 'Arial', textTransform: 'uppercase', letterSpacing: 0.9 },
  sumCardValue: { fontSize: 34, fontFamily: 'Arial', letterSpacing: -0.8, lineHeight: 40 },
  sumCardUnit: { fontSize: 16, fontFamily: 'Arial' },
  sumCardSub: { fontSize: 12, fontFamily: 'Arial', opacity: 0.85 },
  sumCatRow: { gap: 5 },
  sumCatMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sumCatName: { fontSize: 13, fontFamily: 'Arial', color: '#111827', flex: 1 },
  sumCatWeight: { fontSize: 12, fontFamily: 'Arial', color: '#6B7280', letterSpacing: 0.2 },
  sumCatTrack: { height: 5, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.08)', overflow: 'hidden' },
  sumCatFill: { height: 5, borderRadius: 3, backgroundColor: NAV_ACTIVE },

  // Swipe
  swipeActionBtn: { width: SWIPE_BTN_W, alignItems: 'center', justifyContent: 'center', gap: 4, alignSelf: 'stretch' },
  swipeActionLabel: { fontSize: 11, fontFamily: 'Arial', color: '#FFFFFF', letterSpacing: 0.3 },

  // Toast — v3 §24. Self-check:
  //   backgroundColor #2A5740 ✅ (MATCH)
  //   borderRadius: 10 → 12 (v3 §24: "12px border-radius") ✅ MATCH after fix
  //   fontSize: 13.5 → 14 (v3 §24: "14px font") ✅ MATCH after fix
  //   bottom applied inline (see above): insets.bottom + 76 ✅ MATCH after fix
  toast: {
    position: 'absolute', left: 20, right: 20,
    backgroundColor: '#2A5740', borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center',
    zIndex: 999, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18, shadowRadius: 6, elevation: 6,
  },
  toastText: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Arial' },

  // D-46: NavBox active state (active deck/screen highlight)
  navBoxActive: { backgroundColor: 'rgba(42,87,64,0.10)', borderRadius: 10 },
  navLabelActive: { fontFamily: 'Arial', color: NAV_ACTIVE },

  // D-63/64: LocationBar rename + camera action buttons
  locBarActions: { flexDirection: 'row', alignItems: 'center', paddingRight: 10, gap: 2 },
  locBarActionBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },

  // D-65: full-width location photo shown below open LocationBar accordion
  locAccordionPhoto: { width: '100%', height: 200, backgroundColor: 'rgba(0,0,0,0.05)' },
  // D-66 (Task 3 / Batch I): pencil edit button overlaid on location accordion photo
  locAccordionPhotoEdit: {
    position: 'absolute', bottom: 10, right: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },

  // D-67: PhotoItemCard — full-width photo card for photo filter view
  photoItemCard: {
    margin: 8, backgroundColor: '#FFFFFF', borderRadius: 12,
    overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  photoItemImg:     { width: '100%', height: 200 },
  photoItemMeta:    { paddingHorizontal: 12, paddingVertical: 10, gap: 4 },
  photoItemName:    { fontSize: 15, fontFamily: 'Arial', color: PRIMARY_TEXT, lineHeight: 20 },
  photoItemWeight:  { fontSize: 13, fontFamily: 'Arial', color: MUTED },
  photoItemActions: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 12, gap: 10 },
  photoItemBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 9, borderRadius: 9,
    borderWidth: 1, borderColor: 'rgba(42,87,64,0.3)', backgroundColor: 'rgba(42,87,64,0.05)',
  },
  photoItemDeleteBtn: { borderColor: 'rgba(176,58,46,0.3)', backgroundColor: 'rgba(176,58,46,0.05)' },
  photoItemBtnText: { fontSize: 13, fontFamily: 'Arial', color: NAV_ACTIVE },
});
