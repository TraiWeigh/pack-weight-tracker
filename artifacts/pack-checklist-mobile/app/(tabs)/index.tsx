/**
 * index.tsx — Gear screen  N004 / R0112
 *
 * Faithful port of the working /mobile-functional-v3 web screen.
 * All measurements, colors, and behaviors sourced directly from
 * MobileFunctionalV3.tsx and the live v3 screenshot.
 *
 * Changes from N003:
 *   - OLD Gear/Summary tab capsule removed (handled in _layout.tsx)
 *   - BottomBox: 4 correct groups, Group 1 = Locker|Summary|Add|Search|Next
 *   - Summary cell wired to /(tabs)/summary via useRouter
 *   - Category headers tappable: single-open collapse/expand (openCatName)
 *   - Expand-all/collapse-all chevron on hero
 *   - Hero right stack: catCount categories + ✓ selectedCount Selected
 *   - Filter label: static "Filter: Category" (v3 default state)
 *   - Category tile: angled wedge via react-native-svg Polygon overlay
 *   - Category weight: oz (not lbs)
 *   - Category subtitle: "N selected" (not "N packed")
 *   - AppBar: hamburger icon + 6 decorative shortcut icons (non-functional, matches v3)
 *   - bottomPad: insets.bottom only (tab bar hidden)
 *
 * Documented limitations (non-functional in N004, deferred):
 *   - Locker: no native Locker route yet — visual only
 *   - Add / Search: require data model work not in N004 scope — visual only
 *   - Undo / Redo: no undo history in native data layer — visual only
 *   - Camera / Photos / Save / Share / More / Preview: out of scope — visual only
 *   - AppBar hamburger: no drawer in native yet — visual only
 *   - AppBar shortcut icons: decorative, matching v3 aria-hidden treatment
 *   - Filter: Location/Photo viewModes require data model changes — static Category label
 *   - List name "Backpacking Gear": hardcoded; native PackDataContext has no list-name field
 *
 * Preserved: PackDataContext, weightUtils, initialData, haptics,
 *            item toggles, exclusive groups, AsyncStorage, routes,
 *            categoryTheme.ts, Expo SDK/runtime, web v3 (untouched).
 *
 * Unrepresentable in RN (noted inline):
 *   font-weight 800 → 700Bold (PlusJakartaSans max)
 *   font-weight 450 → 500Medium
 *   CSS filter: drop-shadow on wedge → SVG polygon overlay simulating clip-path
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  PanResponder,
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
import { Ionicons } from '@expo/vector-icons';
import { usePackData, CATEGORY_ORDER, GearItem } from '@/context/PackDataContext';
import { calcTotalOz, calcWeights, ozToLbs } from '@/lib/weightUtils';
import { getCategoryTheme } from '@/lib/categoryTheme';
import { AddItemModal } from '@/components/AddItemModal';
import { SearchModal } from '@/components/SearchModal';

// ─── v3 design constants (exact values from MobileFunctionalV3.tsx) ──────────

const SUMMARY_BG   = '#2A5740';   // rgba(42,87,64,0.94) → opaque native equiv
const NAV_ACTIVE   = '#2A5740';   // line 218
const NAV_INACTIVE = '#6E7672';   // line 219
const CB_CHECKED   = '#4E7D5C';   // line 220
const PRIMARY_TEXT = '#1A2920';   // line 211
const PAGE_BG      = '#F2EDE4';   // line 205
const DIVIDER      = 'rgba(0,0,0,0.06)';

const TILE_W         = 72;   // WEDGE_W  line 187
const WEDGE_POINT    = 17;   // WEDGE_POINT  line 190 — angled right edge depth
const CAT_HEADER_H   = 64;   // CHECKLIST_ROW_H  line 191
const RIGHT_INSET    = 44;   // CATEGORY_WEIGHT_RIGHT_INSET  line 195
const ITEM_R_INSET   = 34;   // CHECKLIST_RIGHT_INSET  line 194
const FILTER_H       = 50;   // FILTER_BAR_H  line 233
const NAV_H          = 58;   // NAV_H  line 228
const APPBAR_H       = 52;   // AppBar content height
const CHECKBOX_HIT   = 44;   // checkbox hit-target width (v3 line 5036)
const SWIPE_BTN_W    = 80;   // each swipe action button (Rename / Delete)
const SWIPE_REVEAL   = 160;  // total reveal = 2 × SWIPE_BTN_W

// ─── Box Groups (4 total, matching v3 exactly) ────────────────────────────────
// Source: MobileFunctionalV3.tsx lines 1227–1281

const NUM_GROUPS = 4;

type BoxCell = { icon: string; label: string; action: string };

const BOX_GROUPS: BoxCell[][] = [
  // Group 1 — default (v3 lines 1227–1238)
  [
    { icon: 'folder-outline',              label: 'Locker',   action: 'locker'   },
    { icon: 'bar-chart-outline',           label: 'Summary',  action: 'summary'  },
    { icon: 'add-circle-outline',          label: 'Add',      action: 'add'      },
    { icon: 'search-outline',              label: 'Search',   action: 'search'   },
    { icon: 'chevron-forward-outline',     label: 'Next',     action: 'next'     },
  ],
  // Group 2 (v3 lines 1241–1252)
  [
    { icon: 'chevron-back-outline',        label: 'Back',     action: 'back'     },
    { icon: 'arrow-undo-outline',          label: 'Undo',     action: 'undo'     },
    { icon: 'arrow-redo-outline',          label: 'Redo',     action: 'redo'     },
    { icon: 'refresh-outline',             label: 'Reset',    action: 'reset'    },
    { icon: 'chevron-forward-outline',     label: 'Next',     action: 'next'     },
  ],
  // Group 3 (v3 lines 1255–1266)
  [
    { icon: 'chevron-back-outline',        label: 'Back',     action: 'back'     },
    { icon: 'camera-outline',              label: 'Camera',   action: 'camera'   },
    { icon: 'images-outline',              label: 'Photos',   action: 'photos'   },
    { icon: 'print-outline',               label: 'Preview',  action: 'preview'  },
    { icon: 'chevron-forward-outline',     label: 'Next',     action: 'next'     },
  ],
  // Group 4 (v3 lines 1269–1281)
  [
    { icon: 'chevron-back-outline',        label: 'Back',     action: 'back'     },
    { icon: 'save-outline',                label: 'Save',     action: 'save'     },
    { icon: 'share-social-outline',        label: 'Share',    action: 'share'    },
    { icon: 'ellipsis-horizontal-outline', label: 'More',     action: 'more'     },
    { icon: 'chevron-forward-outline',     label: 'Next',     action: 'next'     },
  ],
];

// v3 AppBar decorative shortcut icons (right side, aria-hidden in v3, non-functional in N004)
// Source: MobileFunctionalV3.tsx lines 4319–4354
const APPBAR_SHORTCUT_ICONS = [
  'bag-outline',       // Backpack
  'train-outline',     // Train
  'airplane-outline',  // Plane
  'boat-outline',      // Ship
  'car-outline',       // Car
  'cube-outline',      // Package
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

type Section = {
  title: string;
  catIndex: number;
  data: GearItem[];
  checkedCount: number;
  totalCount: number;
  checkedWeightOz: number;
};

// ─── AppBar ───────────────────────────────────────────────────────────────────
// v3: hamburger left | CheckSquare + "TrailWeigh" | spacer | 6 shortcut icons right
// height 52pt content, safe-area paddingTop

function AppBar() {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.appBar,
        { paddingTop: insets.top, minHeight: insets.top + APPBAR_H },
      ]}
    >
      <View style={styles.appBarInner}>
        {/* Hamburger — v3 Menu button; non-functional in N004 (no drawer yet) */}
        <Ionicons name="menu-outline" size={22} color={PRIMARY_TEXT} />

        {/* Logo: mark + wordmark */}
        <View style={styles.appBarLogo}>
          <Ionicons name="checkbox-outline" size={20} color={NAV_ACTIVE} />
          <Text style={styles.appBarTitle}>TrailWeigh</Text>
        </View>

        {/* Flex spacer */}
        <View style={{ flex: 1 }} />

        {/* Decorative category shortcut icons — non-functional (v3 aria-hidden) */}
        <View style={styles.appBarShortcuts}>
          {APPBAR_SHORTCUT_ICONS.map((icon) => (
            <Ionicons key={icon} name={icon} size={17} color={NAV_INACTIVE} />
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── ListSummaryHero ──────────────────────────────────────────────────────────
// v3: horizontal row — 66×66 icon tile | content col (name + count + chevron) | right stack
// Right stack: catCount categories + ✓ selectedCount Selected
// Source: MobileFunctionalV3.tsx lines 4360–4465

function ListSummaryHero({
  listName,
  totalItems,
  catCount,
  selectedCount,
  allExpanded,
  onExpandToggle,
}: {
  listName: string;
  totalItems: number;
  catCount: number;
  selectedCount: number;
  allExpanded: boolean;
  onExpandToggle: () => void;
}) {
  return (
    <View style={styles.hero}>
      {/* Icon tile: 66×66, radius 14, dark overlay — Luggage/bag icon */}
      <View style={styles.heroTile}>
        <Ionicons name="bag-outline" size={34} color="rgba(255,255,255,0.90)" />
      </View>

      {/* Content column: list name + count row with expand/collapse chevron */}
      <View style={styles.heroContent}>
        {/* List name: 15.5pt/700/white (v3 line 4390) */}
        <Text style={styles.heroListName} numberOfLines={1}>
          {listName}
        </Text>
        {/* Count row: 40pt big number + "items" + chevron (v3 lines 4401–4436) */}
        <View style={styles.heroCountRow}>
          <Text style={styles.heroCount}>{totalItems}</Text>
          <Text style={styles.heroCountSuffix}> items</Text>
          {/* Expand/collapse all chevron — v3 global accordion control */}
          <TouchableOpacity
            onPress={onExpandToggle}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            style={styles.heroChevronBtn}
          >
            <Ionicons
              name={allExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="rgba(255,255,255,0.78)"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Right stack: category count + selected count (v3 lines 4440–4459) */}
      <View style={styles.heroRight}>
        {/* Category count: 12pt/600 rgba(.58) */}
        <Text style={styles.heroCatCount}>
          {catCount} {catCount === 1 ? 'category' : 'categories'}
        </Text>
        {/* ✓ Selected: checkmark-circle + count */}
        <View style={styles.heroSelectedRow}>
          <Ionicons
            name="checkmark-circle"
            size={13}
            color="rgba(255,255,255,0.80)"
          />
          <Text style={styles.heroSelectedText}>
            {selectedCount} Selected
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── FilterControl ────────────────────────────────────────────────────────────
// v3: static "Filter: Category" in default state (FILTER_BAR_H=50)
// Full filter (Location/Photo) requires data model changes not in N004 scope.
// Source: MobileFunctionalV3.tsx lines 4471–4577

function FilterControl() {
  return (
    <View style={styles.filterBar}>
      <View style={styles.filterButton}>
        {/* SlidersHorizontal icon → Ionicons options-outline */}
        <Ionicons name="options-outline" size={15} color={NAV_ACTIVE} />
        <Text style={styles.filterLabel}>Filter: Category</Text>
        <Ionicons name="chevron-down" size={17} color={NAV_INACTIVE} />
      </View>
    </View>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────
// v3: CHECKLIST_ROW_H=64, tappable row, collapses/expands items
// Wedge: clip-path polygon(0 0, calc(100%-17px) 0, 100% 50%, calc(100%-17px) 100%, 0 100%)
//        → approximated with react-native-svg Polygon overlay (two white corner triangles)
// Weight: oz (small unit, v3 line 4823)
// Subtitle: "N items · N selected" (not packed)
// Source: MobileFunctionalV3.tsx lines 4720–4830

function SectionHeader({
  title,
  catIndex,
  checkedCount,
  totalCount,
  checkedWeightOz,
  isOpen,
  onToggle,
}: {
  title: string;
  catIndex: number;
  checkedCount: number;
  totalCount: number;
  checkedWeightOz: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const theme = getCategoryTheme(title, catIndex);
  const weightOz = checkedWeightOz.toFixed(2);

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.78}
      style={styles.sectionCardTouchable}
      testID={`cat-header-${title}`}
    >
      <View style={styles.sectionCard}>
        {/* Coloured wedge tile — v3 WEDGE_W=72, clip-path polygon */}
        {/* SVG overlay simulates the angled right edge (WEDGE_POINT=17) */}
        <View style={[styles.sectionTile, { backgroundColor: theme.bg }]}>
          <Ionicons
            name={theme.icon as any}
            size={26}
            color="rgba(255,255,255,0.93)"
          />
          {/*
           * Wedge approximation: two white right-triangles positioned at the
           * top-right and bottom-right corners of the tile. Together they
           * replicate the v3 clip-path: polygon(0 0, 55px 0, 72px 32px, 55px 64px, 0 64px)
           *
           * SVG local coords (width=17, height=64, right:0 of tile):
           *   (0,0) = tile (55,0), (17,0) = tile (72,0)
           * Top white triangle:    (0,0)  (17,0)  (17,32)  — cuts top-right corner
           * Bottom white triangle: (0,64) (17,64) (17,32)  — cuts bottom-right corner
           */}
          <Svg
            width={WEDGE_POINT}
            height={CAT_HEADER_H}
            style={styles.wedgeSvg}
          >
            <Polygon
              points={`0,0 ${WEDGE_POINT},0 ${WEDGE_POINT},${CAT_HEADER_H / 2}`}
              fill="#FFFFFF"
            />
            <Polygon
              points={`0,${CAT_HEADER_H} ${WEDGE_POINT},${CAT_HEADER_H} ${WEDGE_POINT},${CAT_HEADER_H / 2}`}
              fill="#FFFFFF"
            />
          </Svg>
        </View>

        {/* Text content */}
        <View style={styles.sectionContent}>
          <Text style={styles.sectionName} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.sectionSub}>
            {totalCount} item{totalCount !== 1 ? 's' : ''}
            {checkedCount > 0 ? `  ·  ${checkedCount} selected` : ''}
          </Text>
        </View>

        {/* Right: weight in oz, paddingR 44 (RIGHT_INSET) */}
        <View style={styles.sectionRight}>
          {checkedWeightOz > 0 && (
            <Text style={styles.sectionWeight}>{weightOz} oz</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── ItemRow ──────────────────────────────────────────────────────────────────
// v3: minH 44, white bg, rounded-square checkbox, name only, weight right
// Source: MobileFunctionalV3.tsx lines 5028–5190

function ItemRow({
  item,
  category,
  onToggle,
}: {
  item: GearItem;
  category: string;
  onToggle: (category: string, id: string) => void;
}) {
  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onToggle(category, item.id);
  }, [category, item.id, onToggle]);

  const totalOz = calcTotalOz(item.weightOz, item.qty);
  const weightLabel = item.weightOz > 0 ? `${totalOz.toFixed(1)} oz` : null;
  const displayName = item.desc || item.sub || '';

  return (
    <TouchableOpacity
      style={styles.itemRow}
      onPress={handlePress}
      activeOpacity={0.65}
      testID={`gear-item-${item.id}`}
    >
      {/* Checkbox hit-target: 44pt wide (v3 line 5036) */}
      <View style={styles.checkboxArea}>
        <View
          style={[
            styles.checkbox,
            {
              borderColor: item.checked ? CB_CHECKED : 'rgba(0,0,0,0.18)',
              backgroundColor: item.checked ? CB_CHECKED : 'transparent',
            },
          ]}
        >
          {item.checked && (
            <Ionicons name="checkmark" size={11} color="#FFFFFF" />
          )}
        </View>
      </View>

      {/* Item name: 14.5pt/500/PRIMARY */}
      <Text
        style={[styles.itemName, item.checked && styles.itemNameChecked]}
        numberOfLines={2}
      >
        {displayName}
      </Text>

      {/* Weight in oz (native convenience — not in v3 row but useful without cat col) */}
      {weightLabel && (
        <Text
          style={[styles.itemWeight, item.checked && { color: NAV_ACTIVE }]}
        >
          {weightLabel}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ─── NavBox / BottomBox ───────────────────────────────────────────────────────
// v3: 4 groups × 5 cells, NAV_H=58, modulo Next/Back cycling
// Group 1 wired: Summary → router, Reset (Group 2) → handleReset, Next/Back → groupIdx
// All other cells: visual parity, documented non-functional
// Source: MobileFunctionalV3.tsx lines 982–1150, 1227–1281

function NavBox({
  cell,
  onAction,
}: {
  cell: BoxCell;
  onAction: (action: string) => void;
}) {
  return (
    <TouchableOpacity
      style={styles.navBox}
      onPress={() => onAction(cell.action)}
      activeOpacity={0.65}
      testID={`nav-${cell.label.toLowerCase().replace(/\s/g, '-')}`}
    >
      <Ionicons name={cell.icon as any} size={21} color={NAV_INACTIVE} />
      <Text style={styles.navLabel}>{cell.label}</Text>
    </TouchableOpacity>
  );
}

function BottomBox({
  groupIdx,
  onAction,
  bottomPad,
}: {
  groupIdx: number;
  onAction: (action: string) => void;
  bottomPad: number;
}) {
  const cells = BOX_GROUPS[groupIdx];
  return (
    <View style={[styles.bottomBox, { paddingBottom: bottomPad }]}>
      <View style={styles.bottomRow}>
        {cells.map((cell) => (
          <NavBox key={`g${groupIdx}-${cell.action}`} cell={cell} onAction={onAction} />
        ))}
      </View>
    </View>
  );
}

// ─── SummaryWeightRow ─────────────────────────────────────────────────────────
// Compact weight card used inside the Summary sheet modal.

function SummaryWeightRow({
  label, oz, accent, half,
}: { label: string; oz: number; accent?: boolean; half?: boolean }) {
  const lbs   = ozToLbs(oz).toFixed(2);
  const kg    = ((oz * 28.3495) / 1000).toFixed(3);
  const bg    = accent ? NAV_ACTIVE : '#F9FAFB';
  const fg    = accent ? '#FFFFFF'  : '#111827';
  const muted = accent ? 'rgba(255,255,255,0.72)' : '#6B7280';
  return (
    <View style={[
      styles.sumCard,
      { backgroundColor: bg, borderColor: accent ? NAV_ACTIVE : 'rgba(0,0,0,0.08)' },
      half && { flex: 1 },
    ]}>
      <Text style={[styles.sumCardLabel, { color: muted }]}>{label}</Text>
      <Text style={[styles.sumCardValue, { color: fg }]}>
        {lbs}{' '}
        <Text style={[styles.sumCardUnit, { color: muted }]}>lbs</Text>
      </Text>
      <Text style={[styles.sumCardSub, { color: muted }]}>{oz.toFixed(1)} oz · {kg} kg</Text>
    </View>
  );
}

// ─── SummaryCatBar ────────────────────────────────────────────────────────────
// Horizontal bar showing one category's share of packed weight.

function SummaryCatBar({ name, oz, totalOz }: { name: string; oz: number; totalOz: number }) {
  const pct = totalOz > 0 ? (oz / totalOz) * 100 : 0;
  const lbs = ozToLbs(oz).toFixed(2);
  return (
    <View style={styles.sumCatRow}>
      <View style={styles.sumCatMeta}>
        <Text style={styles.sumCatName} numberOfLines={1}>{name}</Text>
        <Text style={styles.sumCatWeight}>{lbs} lbs</Text>
      </View>
      <View style={styles.sumCatTrack}>
        <View style={[styles.sumCatFill, { width: `${pct}%` as any }]} />
      </View>
    </View>
  );
}

// ─── Module-level: only one swipe row open at a time ─────────────────────────
// Each AnimatedSwipeRow registers its close fn here when it opens.
let _closeOpenSwipe: (() => void) | null = null;

// ─── AnimatedSwipeRow ─────────────────────────────────────────────────────────
// v3 swipe-reveal equivalent: left-swipe exposes Rename + Delete actions.
// Pure Animated + PanResponder — no additional gesture-handler dependencies.

function AnimatedSwipeRow({
  item,
  category,
  onToggle,
  onRename,
  onDelete,
}: {
  item: GearItem;
  category: string;
  onToggle: (cat: string, id: string) => void;
  onRename: (item: GearItem, cat: string) => void;
  onDelete: (item: GearItem, cat: string) => void;
}) {
  const tx           = useRef(new Animated.Value(0)).current;
  const isOpenRef    = useRef(false);
  const isSwipingRef = useRef(false);

  // Stable close function — safe to capture inside PanResponder (all deps are refs)
  const closeRef = useRef(() => {
    Animated.spring(tx, {
      toValue: 0, useNativeDriver: true, tension: 220, friction: 22,
    }).start();
    isOpenRef.current = false;
    _closeOpenSwipe = null;
  });

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        !isSwipingRef.current &&
        Math.abs(g.dx) > 8 &&
        Math.abs(g.dx) > Math.abs(g.dy) * 1.4,
      onPanResponderGrant: () => {
        isSwipingRef.current = true;
        tx.stopAnimation();
        tx.setOffset(isOpenRef.current ? -SWIPE_REVEAL : 0);
        tx.setValue(0);
      },
      onPanResponderMove: (_, g) => {
        const base = isOpenRef.current ? -SWIPE_REVEAL : 0;
        tx.setValue(Math.max(-SWIPE_REVEAL, Math.min(0, base + g.dx)));
      },
      onPanResponderRelease: (_, g) => {
        tx.flattenOffset();
        isSwipingRef.current = false;

        if (!isOpenRef.current && g.dx < -50) {
          // Commit open — close any other open row first
          _closeOpenSwipe?.();
          _closeOpenSwipe = closeRef.current;
          isOpenRef.current = true;
          Animated.spring(tx, {
            toValue: -SWIPE_REVEAL, useNativeDriver: true, tension: 220, friction: 22,
          }).start();
        } else if (isOpenRef.current && g.dx > 50) {
          // Commit close
          closeRef.current();
        } else if (isOpenRef.current) {
          // Snap back to open
          Animated.spring(tx, {
            toValue: -SWIPE_REVEAL, useNativeDriver: true, tension: 220, friction: 22,
          }).start();
        } else {
          // Snap back to closed
          Animated.spring(tx, {
            toValue: 0, useNativeDriver: true, tension: 220, friction: 22,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        tx.flattenOffset();
        isSwipingRef.current = false;
        Animated.spring(tx, {
          toValue: isOpenRef.current ? -SWIPE_REVEAL : 0,
          useNativeDriver: true, tension: 220, friction: 22,
        }).start();
      },
    })
  ).current;

  return (
    <View style={{ overflow: 'hidden' }}>
      {/* Action buttons — visible behind the sliding row */}
      <View style={[StyleSheet.absoluteFillObject, { flexDirection: 'row', justifyContent: 'flex-end' }]}>
        <TouchableOpacity
          style={[styles.swipeActionBtn, { backgroundColor: '#3B82F6' }]}
          onPress={() => {
            closeRef.current();
            onRename(item, category);
          }}
        >
          <Ionicons name="pencil-outline" size={18} color="#fff" />
          <Text style={styles.swipeActionLabel}>Rename</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.swipeActionBtn, { backgroundColor: '#EF4444' }]}
          onPress={() => {
            closeRef.current();
            onDelete(item, category);
          }}
        >
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={styles.swipeActionLabel}>Delete</Text>
        </TouchableOpacity>
      </View>
      {/* Main item row slides left to reveal the action buttons */}
      <Animated.View
        style={{ transform: [{ translateX: tx }] }}
        {...pan.panHandlers}
      >
        <ItemRow item={item} category={category} onToggle={onToggle} />
      </Animated.View>
    </View>
  );
}

// ─── GearScreen ───────────────────────────────────────────────────────────────

export default function GearScreen() {
  const insets = useSafeAreaInsets();
  const {
    data, isLoading, toggleItem,
    deleteItem, renameItem, resetAll, listName,
  } = usePackData();

  // Category expand/collapse — single-open model matching v3 (openCatName = one open cat)
  // Default: all collapsed (openCatName=null, allExpanded=false) — v3 lines 2225–2228
  const [openCatName, setOpenCatName] = useState<string | null>(null);
  const [allExpanded, setAllExpanded] = useState(false);

  // Bottom box group index (0–3), matching v3 groupIdx — v3 lines 1054, 1092–1094
  const [groupIdx, setGroupIdx] = useState(0);

  // Summary sheet — shown as a native pageSheet modal instead of pushing a route
  const [showSummary, setShowSummary] = useState(false);

  // Add Item sheet — v3 "Add deck" accordion ported to a pageSheet modal
  const [showAdd,    setShowAdd]    = useState(false);

  // Search sheet — v3 "Search deck" ported to a pageSheet modal
  const [showSearch, setShowSearch] = useState(false);

  // ── Data computations ───────────────────────────────────────────────────────

  // allSections: full stats for all non-empty categories (used for header display)
  const allSections: Section[] = CATEGORY_ORDER.map((cat, catIndex) => {
    const items = data[cat] || [];
    const populated = items.filter((i) => i.sub || i.desc);
    const checkedWeightOz = populated
      .filter((i) => i.checked)
      .reduce((sum, item) => sum + calcTotalOz(item.weightOz, item.qty), 0);
    return {
      title: cat,
      catIndex,
      data: populated,
      checkedCount: populated.filter((i) => i.checked).length,
      totalCount: populated.length,
      checkedWeightOz,
    };
  }).filter((s) => s.totalCount > 0);

  // Hero metrics
  const totalItems   = allSections.reduce((n, s) => n + s.totalCount, 0);
  const selectedCount = allSections.reduce((n, s) => n + s.checkedCount, 0);
  const catCount     = allSections.length;

  // sections for SectionList: item rows only visible when category is expanded
  // Collapsed categories get data:[] — SectionList still renders their headers
  const sections: Section[] = allSections.map((s) => ({
    ...s,
    data: allExpanded || openCatName === s.title ? s.data : [],
  }));

  // ── Handlers ────────────────────────────────────────────────────────────────

  // Single-open toggle — v3 lines 2889–2911
  const handleCatToggle = useCallback(
    (catName: string) => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setAllExpanded(false);
      setOpenCatName((prev) => (prev === catName ? null : catName));
    },
    [],
  );

  // Expand-all / collapse-all — v3 lines 2927–2929
  const handleExpandAll = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setAllExpanded((prev) => {
      if (prev) setOpenCatName(null);
      return !prev;
    });
  }, []);

  // Reset — v3 onReset: confirmation before clearing all checked items
  const handleReset = useCallback(() => {
    Alert.alert(
      'Clear All Checks',
      'Remove all packed checkmarks from your list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            resetAll();
          },
        },
      ],
    );
  }, [resetAll]);

  // Item rename — v3 rename dialog; uses Alert.prompt on iOS
  const handleItemRename = useCallback((item: GearItem, cat: string) => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Rename Item',
        undefined,
        (text) => {
          const newName = text?.trim();
          if (newName && newName !== (item.desc || item.sub)) {
            renameItem(cat, item.id, newName);
          }
        },
        'plain-text',
        item.desc || item.sub,
      );
    } else {
      Alert.alert('Rename', `Item: "${item.desc || item.sub}"\n\nRename requires iOS.`);
    }
  }, [renameItem]);

  // Item delete — v3: confirmation before removing
  const handleItemDelete = useCallback((item: GearItem, cat: string) => {
    Alert.alert(
      'Delete Item',
      `Remove "${item.desc || item.sub}" from your list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteItem(cat, item.id),
        },
      ],
    );
  }, [deleteItem]);

  // Box group action dispatcher
  // Wired: next, back, summary, add, search, reset
  // Non-functional (visual parity only): locker, undo, redo,
  //   camera, photos, preview, save, share, more
  const handleBoxAction = useCallback(
    (action: string) => {
      switch (action) {
        case 'next':
          setGroupIdx((g) => (g + 1) % NUM_GROUPS);
          break;
        case 'back':
          setGroupIdx((g) => (g - 1 + NUM_GROUPS) % NUM_GROUPS);
          break;
        case 'summary':
          setShowSummary(true);
          break;
        case 'add':
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowAdd(true);
          break;
        case 'search':
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setShowSearch(true);
          break;
        case 'reset':
          handleReset();
          break;
        default:
          break;
      }
    },
    [handleReset],
  );

  // Bottom padding: tab bar is hidden, only safe-area inset needed
  const bottomPad = Platform.OS === 'web' ? 20 : insets.bottom;

  // Summary modal computations — same logic as summary.tsx, computed from live PackData
  const { baseWeightOz, clothingWornOz, dogPackOz, expendablesOz, grandTotalOz } =
    calcWeights(data);
  const summaryTotals = CATEGORY_ORDER
    .map(cat => {
      const oz = (data[cat] || [])
        .filter(i => i.checked)
        .reduce((sum, item) => sum + calcTotalOz(item.weightOz, item.qty), 0);
      return { name: cat, oz };
    })
    .filter(c => c.oz > 0)
    .sort((a, b) => b.oz - a.oz);

  // ── Render ───────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: PAGE_BG }]}>
        <ActivityIndicator size="large" color={NAV_ACTIVE} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: PAGE_BG }]}>
      {/* ── Fixed top ─────────────────────────────────────────────────── */}
      <AppBar />
      <ListSummaryHero
        listName={listName}
        totalItems={totalItems}
        catCount={catCount}
        selectedCount={selectedCount}
        allExpanded={allExpanded}
        onExpandToggle={handleExpandAll}
      />
      <FilterControl />

      {/* ── Scrolling category list ───────────────────────────────────── */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item, section }) => (
          <AnimatedSwipeRow
            item={item}
            category={(section as Section).title}
            onToggle={toggleItem}
            onRename={handleItemRename}
            onDelete={handleItemDelete}
          />
        )}
        renderSectionHeader={({ section }) => {
          const s = section as Section;
          // Use allSections for true stats (section.data may be [] when collapsed)
          const full = allSections.find((a) => a.title === s.title) || s;
          return (
            <SectionHeader
              title={s.title}
              catIndex={s.catIndex}
              checkedCount={full.checkedCount}
              totalCount={full.totalCount}
              checkedWeightOz={full.checkedWeightOz}
              isOpen={allExpanded || openCatName === s.title}
              onToggle={() => handleCatToggle(s.title)}
            />
          );
        }}
        stickySectionHeadersEnabled
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />

      {/* ── Fixed bottom ─────────────────────────────────────────────── */}
      <BottomBox
        groupIdx={groupIdx}
        onAction={handleBoxAction}
        bottomPad={bottomPad}
      />

      {/* ── Summary sheet ─────────────────────────────────────────────── */}
      {/* pageSheet = native iOS card sheet with swipe-to-dismiss built in */}
      <Modal
        visible={showSummary}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSummary(false)}
      >
        <View style={[
          styles.summarySheet,
          { paddingTop: Platform.OS === 'ios' ? 8 : insets.top + 8 },
        ]}>
          {/* Drag handle — communicates swipe-to-dismiss */}
          <View style={styles.summaryHandle} />

          {/* Header */}
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.summaryTitle}>Pack Summary</Text>
              <Text style={styles.summarySubtitle}>
                {selectedCount} item{selectedCount !== 1 ? 's' : ''} packed
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowSummary(false)}
              hitSlop={16}
              style={styles.summaryCloseBtn}
            >
              <Ionicons name="close" size={22} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Scrollable content */}
          <ScrollView
            style={styles.summaryScroll}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: insets.bottom + 24,
            }}
            showsVerticalScrollIndicator={false}
          >
            {grandTotalOz > 0 ? (
              <View style={styles.summaryContent}>
                <SummaryWeightRow label="Grand Total"  oz={grandTotalOz} accent />
                <View style={styles.summaryPairRow}>
                  <SummaryWeightRow label="Base Weight"   oz={baseWeightOz}   half />
                  <SummaryWeightRow label="Clothing Worn" oz={clothingWornOz} half />
                </View>
                <View style={styles.summaryPairRow}>
                  <SummaryWeightRow label="Dog Pack"    oz={dogPackOz}    half />
                  <SummaryWeightRow label="Expendables" oz={expendablesOz} half />
                </View>
                {summaryTotals.length > 0 && (
                  <View style={styles.summaryBreakdown}>
                    <Text style={styles.summaryBreakdownTitle}>WEIGHT BREAKDOWN</Text>
                    {summaryTotals.map(cat => (
                      <SummaryCatBar
                        key={cat.name}
                        name={cat.name}
                        oz={cat.oz}
                        totalOz={grandTotalOz}
                      />
                    ))}
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

      {/* ── Add Item sheet (v3 Add deck) ── */}
      <AddItemModal
        visible={showAdd}
        defaultCategory={openCatName || CATEGORY_ORDER[0]}
        onClose={() => setShowAdd(false)}
      />

      {/* ── Search sheet (v3 Search deck) ── */}
      <SearchModal
        visible={showSearch}
        onClose={() => setShowSearch(false)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // ── AppBar ──────────────────────────────────────────────────────────────────
  // v3: height 52, paddingL 8 paddingR 8, white, 1px border rgba(0,0,0,0.07)
  appBar: {
    backgroundColor: '#FFFFFF',
    paddingLeft:  8,
    paddingRight: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.07)',
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  appBarInner: {
    height: APPBAR_H,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  appBarLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appBarTitle: {
    fontSize: 19,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: PRIMARY_TEXT,
    letterSpacing: 0.1,
  },
  appBarShortcuts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  // ── ListSummaryHero ─────────────────────────────────────────────────────────
  // v3: bg rgba(42,87,64,0.94), paddingT 10 paddingB 12, paddingL 14 paddingR 44
  // horizontal row, gap 14, shadow 0 4px 12px rgba(0,0,0,0.22)
  hero: {
    backgroundColor: SUMMARY_BG,
    paddingTop:    10,
    paddingBottom: 12,
    paddingLeft:   14,
    paddingRight:  RIGHT_INSET,
    flexDirection: 'row',
    alignItems:    'center',
    gap:           14,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius:  12,
    shadowOffset:  { width: 0, height: 4 },
    elevation: 6,
    zIndex: 9,
  },
  heroTile: {
    width:           66,
    height:          66,
    borderRadius:    14,
    backgroundColor: 'rgba(0,0,0,0.20)',
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  heroContent: {
    flex: 1,
    gap:  6,
  },
  heroListName: {
    fontSize:   15.5,
    fontFamily: 'PlusJakartaSans_700Bold',
    color:      '#FFFFFF',
    lineHeight: 19,
  },
  // Count row: big number + "items" suffix + chevron
  heroCountRow: {
    flexDirection: 'row',
    alignItems:    'baseline',
    gap:           4,
  },
  heroCount: {
    fontSize:      40,
    fontFamily:    'PlusJakartaSans_700Bold',
    color:         '#FFFFFF',
    letterSpacing: -1.5,
    lineHeight:    44,
  },
  heroCountSuffix: {
    fontSize:   17,
    fontFamily: 'PlusJakartaSans_500Medium',
    color:      'rgba(255,255,255,0.78)',
    paddingBottom: 3,
  },
  heroChevronBtn: {
    paddingBottom: 3,
    alignSelf: 'flex-end',
  },
  // Right stack: category count + ✓ selected count
  heroRight: {
    alignItems:     'flex-end',
    justifyContent: 'center',
    gap: 6,
    flexShrink: 0,
  },
  heroCatCount: {
    fontSize:      12,
    fontFamily:    'PlusJakartaSans_600SemiBold',
    color:         'rgba(255,255,255,0.58)',
    letterSpacing: 0.2,
  },
  heroSelectedRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
  },
  heroSelectedText: {
    fontSize:      12,
    fontFamily:    'PlusJakartaSans_600SemiBold',
    color:         'rgba(255,255,255,0.80)',
    letterSpacing: 0.1,
  },

  // ── FilterControl ───────────────────────────────────────────────────────────
  // v3: FILTER_BAR_H=50, white, border-bottom 1px DIVIDER, shadow downward
  filterBar: {
    height:            FILTER_H,
    backgroundColor:   '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical:   5,
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
    justifyContent:    'center',
    shadowColor:   '#000',
    shadowOpacity: 0.08,
    shadowRadius:  8,
    shadowOffset:  { width: 0, height: 3 },
    elevation: 3,
    zIndex: 8,
  },
  filterButton: {
    minHeight:      36,
    flexDirection:  'row',
    alignItems:     'center',
    paddingVertical:   6,
    paddingHorizontal: 10,
    borderRadius:   8,
    borderWidth:    1,
    borderColor:    DIVIDER,
    backgroundColor: '#FFFFFF',
    gap: 7,
  },
  filterLabel: {
    flex:          1,
    fontSize:      13,
    fontFamily:    'PlusJakartaSans_600SemiBold',
    color:         PRIMARY_TEXT,
    letterSpacing: 0.1,
  },

  // ── SectionHeader ───────────────────────────────────────────────────────────
  // TouchableOpacity wrapper
  sectionCardTouchable: {
    zIndex: 5,
  },
  // v3: minH 64, white, shadow 0 3px 10px rgba(0,0,0,0.18), border-bottom 1px DIVIDER
  sectionCard: {
    flexDirection:   'row',
    alignItems:      'stretch',
    height:          CAT_HEADER_H,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
    shadowColor:   '#000',
    shadowOpacity: 0.18,
    shadowRadius:  10,
    shadowOffset:  { width: 0, height: 3 },
    elevation:     4,
  },
  // Tile: TILE_W=72, full height, category color, overflow visible for SVG
  sectionTile: {
    width:          TILE_W,
    height:         CAT_HEADER_H,
    alignItems:     'center',
    justifyContent: 'center',
  },
  // Wedge SVG: positioned at right edge of tile (right 17px strip)
  wedgeSvg: {
    position: 'absolute',
    right:    0,
    top:      0,
  },
  // Text content: paddingL 12, paddingV 8, column gap 10
  sectionContent: {
    flex:            1,
    paddingLeft:     12,
    paddingVertical: 8,
    justifyContent:  'center',
    gap:             10,
  },
  // Category name: 17px/500/PRIMARY, lh 20, ls -0.1
  sectionName: {
    fontSize:      17,
    fontFamily:    'PlusJakartaSans_500Medium',
    color:         PRIMARY_TEXT,
    lineHeight:    20,
    letterSpacing: -0.1,
  },
  // Subtitle: 12.5px/NAV_INACTIVE
  sectionSub: {
    fontSize:   12.5,
    fontFamily: 'PlusJakartaSans_400Regular',
    color:      NAV_INACTIVE,
  },
  // Right weight: oz, paddingR 44, 13px/600/PRIMARY
  sectionRight: {
    paddingRight:    RIGHT_INSET,
    paddingVertical: 8,
    alignItems:      'flex-end',
    justifyContent:  'center',
    maxWidth:        96 + RIGHT_INSET,
  },
  sectionWeight: {
    fontSize:      13,
    fontFamily:    'PlusJakartaSans_600SemiBold',
    color:         PRIMARY_TEXT,
    letterSpacing: 0.1,
    textAlign:     'right',
  },

  // ── ItemRow ─────────────────────────────────────────────────────────────────
  // v3: minH 44, white, borderBottom 1px DIVIDER, paddingR 34
  itemRow: {
    flexDirection:     'row',
    alignItems:        'center',
    minHeight:         44,
    backgroundColor:   '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
    paddingRight:      ITEM_R_INSET,
  },
  checkboxArea: {
    width:          CHECKBOX_HIT,
    height:         44,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  checkbox: {
    width:          20,
    height:         20,
    borderRadius:   5,
    borderWidth:    1.5,
    alignItems:     'center',
    justifyContent: 'center',
  },
  itemName: {
    flex:       1,
    fontSize:   14.5,
    fontFamily: 'PlusJakartaSans_500Medium',
    color:      PRIMARY_TEXT,
    lineHeight: 20,
  },
  itemNameChecked: {
    color:   NAV_INACTIVE,
    opacity: 0.8,
  },
  itemWeight: {
    fontSize:      12,
    fontFamily:    'PlusJakartaSans_600SemiBold',
    color:         NAV_INACTIVE,
    letterSpacing: 0.2,
    flexShrink:    0,
    marginLeft:    8,
  },

  // ── List ────────────────────────────────────────────────────────────────────
  list:        { flex: 1 },
  listContent: { paddingBottom: 4 },

  // ── BottomBox / NavBar ──────────────────────────────────────────────────────
  // v3: NAV_H=58, white, borderTop 1px rgba(0,0,0,0.07), shadow 0 -3px 10px rgba(0,0,0,0.07)
  bottomBox: {
    backgroundColor: '#FFFFFF',
    borderTopWidth:  1,
    borderTopColor:  'rgba(0,0,0,0.07)',
    shadowColor:     '#000',
    shadowOpacity:   0.07,
    shadowRadius:    10,
    shadowOffset:    { width: 0, height: -3 },
    elevation: 8,
    zIndex:    40,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems:    'stretch',
    minHeight:     NAV_H,
  },
  // NavBox: flex 1, col, paddingT 9 paddingB 8, gap 2, centered
  navBox: {
    flex:           1,
    paddingTop:     9,
    paddingBottom:  8,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            2,
  },
  // Nav label: 10px/400 NAV_INACTIVE
  navLabel: {
    fontSize:   10,
    fontFamily: 'PlusJakartaSans_400Regular',
    color:      NAV_INACTIVE,
  },

  // ── Summary sheet modal ──────────────────────────────────────────────────────
  summarySheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  summaryHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.10)',
  },
  summaryTitle: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#111827',
    letterSpacing: -0.3,
  },
  summarySubtitle: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  summaryCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryScroll: { flex: 1 },
  summaryContent: { gap: 10 },
  summaryPairRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryBreakdown: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#F9FAFB',
    padding: 14,
    gap: 10,
  },
  summaryBreakdownTitle: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: '#6B7280',
    marginBottom: 2,
  },
  summaryEmpty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 6,
  },
  summaryEmptyText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#6B7280',
  },
  summaryEmptyHint: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    color: '#9CA3AF',
  },
  sumCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 3,
  },
  sumCardLabel: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  sumCardValue: {
    fontSize: 34,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  sumCardUnit: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  sumCardSub: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
    opacity: 0.85,
  },
  sumCatRow: { gap: 5 },
  sumCatMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sumCatName: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: '#111827',
    flex: 1,
  },
  sumCatWeight: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#6B7280',
    letterSpacing: 0.2,
  },
  sumCatTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  sumCatFill: {
    height: 5,
    borderRadius: 3,
    backgroundColor: NAV_ACTIVE,
  },

  // ── Swipe action buttons (Rename / Delete) ────────────────────────────────
  swipeActionBtn: {
    width: SWIPE_BTN_W,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    alignSelf: 'stretch',
  },
  swipeActionLabel: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
