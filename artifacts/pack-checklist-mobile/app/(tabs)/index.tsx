/**
 * index.tsx — Gear screen with full Photo List support
 *
 * Faithful port of MobileFunctionalV3.tsx including the complete Photo List
 * workflow (Task #140). All standard-list behaviour is preserved unchanged.
 *
 * Photo List additions:
 *   - Empty state card: camera badge, title, subtitle, 2-col VISUAL DESTINATIONS grid,
 *     pending capture image with "Choose Location or Item" + "Replace Photo" buttons,
 *     "Add Photo" CTA
 *   - PhotoListSourceSheet   → Camera / Photos / Cancel
 *   - PhotoListAssignmentSheet → What is this photo? (Location / Item / Decide later)
 *   - PhotoListLocationNameSheet → Name this location (autoFocus, Save Location)
 *   - PhotoListItemDestinationSheet → 2-col grid (Unassigned + location tiles)
 *   - PhotoListItemNameSheet → Name this item (auto-opens after assignment)
 *   - "Add another photo" bar above list when items exist
 *   - Location view: Items section + add-photo bar + location wedge bars
 *   - Filter control shows Category / Location; tappable in Photo List mode
 *   - Locker save/load preserves all Photo List state
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
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
import { Ionicons } from '@expo/vector-icons';
import {
  usePackData, CATEGORY_ORDER, GearItem, PHOTO_ITEMS_CATEGORY, PackLocation,
} from '@/context/PackDataContext';
import { calcTotalOz, calcWeights, ozToLbs } from '@/lib/weightUtils';
import { getCategoryTheme } from '@/lib/categoryTheme';
import { AddDeck } from '@/components/AddDeck';
import { SearchModal } from '@/components/SearchModal';
import { LockerModal } from '@/components/LockerModal';
import { PhotoListSourceSheet } from '@/components/PhotoListSourceSheet';
import { PhotoListAssignmentSheet } from '@/components/PhotoListAssignmentSheet';
import { PhotoListLocationNameSheet } from '@/components/PhotoListLocationNameSheet';
import { PhotoListItemDestinationSheet } from '@/components/PhotoListItemDestinationSheet';
import { PhotoListItemNameSheet } from '@/components/PhotoListItemNameSheet';

// ─── v3 design constants ──────────────────────────────────────────────────────

const SUMMARY_BG   = '#2A5740';
const NAV_ACTIVE   = '#2A5740';
const NAV_INACTIVE = '#6E7672';
const CB_CHECKED   = '#4E7D5C';
const PRIMARY_TEXT = '#1A2920';
const PAGE_BG      = '#F2EDE4';
const MUTED        = '#667270';
const DIVIDER      = 'rgba(0,0,0,0.06)';

const TILE_W         = 72;
const WEDGE_POINT    = 17;
const CAT_HEADER_H   = 64;
const RIGHT_INSET    = 44;
const ITEM_R_INSET   = 34;
const FILTER_H       = 50;
const NAV_H          = 58;
const APPBAR_H       = 52;
const CHECKBOX_HIT   = 44;
const SWIPE_BTN_W    = 80;
const SWIPE_REVEAL   = 80;
const NUM_GROUPS     = 4;

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
  // Photo List extensions
  sectionKind?: 'normal' | 'add-photo-bar' | 'location';
  locId?:        string;
  locPhotoDataUrl?: string;
};

// ─── AppBar ───────────────────────────────────────────────────────────────────

function AppBar() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.appBar, { paddingTop: insets.top, minHeight: insets.top + APPBAR_H }]}>
      <View style={styles.appBarInner}>
        <Ionicons name="menu-outline" size={22} color={PRIMARY_TEXT} />
        <View style={styles.appBarLogo}>
          <Ionicons name="checkbox-outline" size={20} color={NAV_ACTIVE} />
          <Text style={styles.appBarTitle}>TrailWeigh</Text>
        </View>
        <View style={{ flex: 1 }} />
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
            <Ionicons
              name={allExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="rgba(255,255,255,0.78)"
            />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.heroRight}>
        <Text style={styles.heroCatCount}>
          {catCount} {catCount === 1 ? 'category' : 'categories'}
        </Text>
        <View style={styles.heroSelectedRow}>
          <Ionicons name="checkmark-circle" size={13} color="rgba(255,255,255,0.80)" />
          <Text style={styles.heroSelectedText}>{selectedCount} Selected</Text>
        </View>
      </View>
    </View>
  );
}

// ─── FilterControl ────────────────────────────────────────────────────────────

function FilterControl({
  viewLabel, onToggle,
}: { viewLabel: string; onToggle?: () => void }) {
  return (
    <View style={styles.filterBar}>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={onToggle}
        activeOpacity={onToggle ? 0.7 : 1}
        disabled={!onToggle}
      >
        <Ionicons name="options-outline" size={15} color={NAV_ACTIVE} />
        <Text style={styles.filterLabel}>Filter: {viewLabel}</Text>
        <Ionicons name={onToggle ? 'chevron-down' : 'chevron-down'} size={17} color={NAV_INACTIVE} />
      </TouchableOpacity>
    </View>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────

function SectionHeader({
  title, catIndex, checkedCount, totalCount, checkedWeightOz,
  isOpen, onToggle, onLongPress,
}: {
  title: string; catIndex: number; checkedCount: number; totalCount: number;
  checkedWeightOz: number; isOpen: boolean; onToggle: () => void; onLongPress?: () => void;
}) {
  const theme = getCategoryTheme(title, catIndex);
  const weightOz = checkedWeightOz.toFixed(2);

  return (
    <TouchableOpacity
      onPress={onToggle} onLongPress={onLongPress} delayLongPress={500}
      activeOpacity={0.78} style={styles.sectionCardTouchable}
      testID={`cat-header-${title}`}
    >
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
            {totalCount} item{totalCount !== 1 ? 's' : ''}
            {checkedCount > 0 ? `  ·  ${checkedCount} selected` : ''}
          </Text>
        </View>
        <View style={styles.sectionRight}>
          {checkedWeightOz > 0 && (
            <Text style={styles.sectionWeight}>{weightOz} oz</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── LocationBar ─────────────────────────────────────────────────────────────
// v3 location wedge bar: same pentagon shape as category bar, NAV_ACTIVE bg,
// MapPin icon, 42×42 thumbnail, location name col right-aligned.
// From visual-formula audit §16: content grid padding 8px 34px 8px 12px;
// thumbnail 42×42 border-radius 8; name col fontSize=13 fontWeight=600 max-width=130 right.

function LocationBar({
  loc, totalCount, checkedCount, isOpen, onToggle,
}: {
  loc: PackLocation; totalCount: number; checkedCount: number;
  isOpen: boolean; onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.78}
      style={styles.sectionCardTouchable}
      testID={`loc-header-${loc.id}`}
    >
      <View style={styles.sectionCard}>
        {/* Wedge — NAV_ACTIVE green, MapPin icon */}
        <View style={[styles.sectionTile, { backgroundColor: NAV_ACTIVE }]}>
          <Ionicons name="location-outline" size={26} color="rgba(255,255,255,0.93)" />
          <Svg width={WEDGE_POINT} height={CAT_HEADER_H} style={styles.wedgeSvg}>
            <Polygon points={`0,0 ${WEDGE_POINT},0 ${WEDGE_POINT},${CAT_HEADER_H / 2}`} fill="#FFFFFF" />
            <Polygon points={`0,${CAT_HEADER_H} ${WEDGE_POINT},${CAT_HEADER_H} ${WEDGE_POINT},${CAT_HEADER_H / 2}`} fill="#FFFFFF" />
          </Svg>
        </View>

        {/* Content: thumbnail + name col + right meta */}
        <View style={styles.locBarContent}>
          {/* 42×42 thumbnail */}
          {loc.photoDataUrl ? (
            <Image
              source={{ uri: loc.photoDataUrl }}
              style={styles.locBarThumb}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.locBarThumb, styles.locBarThumbFallback]}>
              <Ionicons name="location-outline" size={18} color="rgba(255,255,255,0.6)" />
            </View>
          )}

          {/* Location name below thumbnail */}
          <Text style={styles.locBarName} numberOfLines={2}>{loc.name}</Text>
        </View>

        {/* Right meta: "Location" + item count */}
        <View style={styles.locBarRight}>
          <Text style={styles.locBarType}>Location</Text>
          <Text style={styles.locBarCount}>
            {totalCount} item{totalCount !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── AddAnotherPhotoBar ───────────────────────────────────────────────────────
// v3: Camera icon + "Add another photo" min-height=44 bg #f7faf7 border-bottom 1px rgba(0,0,0,0.06)

function AddAnotherPhotoBar({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.addPhotoBar} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name="camera-outline" size={16} color={NAV_ACTIVE} />
      <Text style={styles.addPhotoBarText}>Add another photo</Text>
    </TouchableOpacity>
  );
}

// ─── PhotoListEmptyCard ───────────────────────────────────────────────────────
// State 1: fresh empty state (no items, no pending capture)
// State 3: pending capture held (image + "Choose Location or Item" + "Replace Photo")
// State 6: locations exist but no items (VISUAL DESTINATIONS grid + Add Photo CTA)

function PhotoListEmptyCard({
  pendingCapture,
  locations,
  onAddPhoto,
  onChooseClassification,
  onReplacePhoto,
}: {
  pendingCapture: string | null;
  locations: PackLocation[];
  onAddPhoto: () => void;
  onChooseClassification: () => void;
  onReplacePhoto: () => void;
}) {
  // Locations with photos (shown in grid)
  const photoLocations = locations.filter(l => l.photoDataUrl);

  const subtitle = pendingCapture
    ? 'Your photo is saved and ready for the next Photo List step.'
    : 'Add your first photo when you are ready to begin organizing this list.';

  return (
    <View style={styles.emptyCard}>
      {/* Camera icon badge: 48×48, border-radius=14, bg rgba(42,87,64,0.10) */}
      <View style={styles.emptyCardBadge}>
        <Ionicons name="camera-outline" size={24} color={NAV_ACTIVE} strokeWidth={1.7} />
      </View>

      {/* Title */}
      <Text style={styles.emptyCardTitle}>Your Photo List is ready</Text>

      {/* Subtitle */}
      <Text style={styles.emptyCardSubtitle}>{subtitle}</Text>

      {/* Pending capture image (state 3) */}
      {pendingCapture ? (
        <View style={styles.pendingBlock}>
          <Image
            source={{ uri: pendingCapture }}
            style={styles.pendingImage}
            resizeMode="cover"
          />
          {/* "Choose Location or Item" — white bg, NAV_ACTIVE border */}
          <TouchableOpacity
            style={styles.chooseBtn}
            onPress={onChooseClassification}
            activeOpacity={0.8}
          >
            <Text style={styles.chooseBtnText}>Choose Location or Item</Text>
          </TouchableOpacity>
          {/* "Replace Photo" — NAV_ACTIVE bg (spec correction from screenshot 3) */}
          <TouchableOpacity
            style={styles.replaceBtn}
            onPress={onReplacePhoto}
            activeOpacity={0.8}
          >
            <Text style={styles.replaceBtnText}>Replace Photo</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* VISUAL DESTINATIONS grid (state 6 — shown when locations exist) */}
      {photoLocations.length > 0 && !pendingCapture && (
        <View style={styles.visualDestBlock}>
          <Text style={styles.visualDestLabel}>VISUAL DESTINATIONS</Text>
          <View style={styles.visualDestGrid}>
            {photoLocations.map(loc => (
              <View key={loc.id} style={styles.visualDestTile}>
                {loc.photoDataUrl ? (
                  <Image
                    source={{ uri: loc.photoDataUrl }}
                    style={styles.visualDestThumb}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.visualDestThumb, styles.visualDestThumbFallback]} />
                )}
                <Text style={styles.visualDestName} numberOfLines={1}>{loc.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* "Add Photo" CTA — always shown (hidden when pending + choose showing) */}
      {!pendingCapture && (
        <TouchableOpacity style={styles.addPhotoCTA} onPress={onAddPhoto} activeOpacity={0.85}>
          <Text style={styles.addPhotoCTAText}>Add Photo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── ItemRow ──────────────────────────────────────────────────────────────────

function ItemRow({
  item, category, onToggle,
}: {
  item: GearItem; category: string; onToggle: (category: string, id: string) => void;
}) {
  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(category, item.id);
  }, [category, item.id, onToggle]);

  const totalOz     = calcTotalOz(item.weightOz, item.qty);
  const weightLabel = item.weightOz > 0 ? `${totalOz.toFixed(1)} oz` : null;
  const displayName = item.desc || item.sub || 'Unnamed item';

  return (
    <TouchableOpacity
      style={styles.itemRow}
      onPress={handlePress}
      activeOpacity={0.65}
      testID={`gear-item-${item.id}`}
    >
      <View style={styles.checkboxArea}>
        <View style={[
          styles.checkbox,
          {
            borderColor:     item.checked ? CB_CHECKED : 'rgba(0,0,0,0.18)',
            backgroundColor: item.checked ? CB_CHECKED : 'transparent',
          },
        ]}>
          {item.checked && <Ionicons name="checkmark" size={11} color="#FFFFFF" />}
        </View>
      </View>
      <Text style={[styles.itemName, item.checked && styles.itemNameChecked]} numberOfLines={2}>
        {displayName}
      </Text>
      {weightLabel && (
        <Text style={[styles.itemWeight, item.checked && { color: NAV_ACTIVE }]}>
          {weightLabel}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ─── NavBox / BottomBox ───────────────────────────────────────────────────────

function NavBox({ cell, onAction, disabled }: { cell: BoxCell; onAction: (a: string) => void; disabled?: boolean }) {
  return (
    <TouchableOpacity
      style={[styles.navBox, disabled && { opacity: 0.30 }]}
      onPress={() => { if (!disabled) onAction(cell.action); }}
      activeOpacity={disabled ? 1 : 0.65}
      testID={`nav-${cell.label.toLowerCase().replace(/\s/g, '-')}`}
    >
      <Ionicons name={cell.icon as any} size={21} color={NAV_INACTIVE} />
      <Text style={styles.navLabel}>{cell.label}</Text>
    </TouchableOpacity>
  );
}

function BottomBox({
  groupIdx, onAction, bottomPad, disabledSet,
}: { groupIdx: number; onAction: (a: string) => void; bottomPad: number; disabledSet?: Set<string> }) {
  const cells = BOX_GROUPS[groupIdx];
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
          />
        ))}
      </View>
    </View>
  );
}

// ─── SummaryWeightRow / SummaryCatBar ─────────────────────────────────────────

function SummaryWeightRow({ label, oz, accent, half }: { label: string; oz: number; accent?: boolean; half?: boolean }) {
  const lbs = ozToLbs(oz).toFixed(2);
  const kg  = ((oz * 28.3495) / 1000).toFixed(3);
  const bg  = accent ? NAV_ACTIVE : '#F9FAFB';
  const fg  = accent ? '#FFFFFF'  : '#111827';
  const mu  = accent ? 'rgba(255,255,255,0.72)' : '#6B7280';
  return (
    <View style={[styles.sumCard, { backgroundColor: bg, borderColor: accent ? NAV_ACTIVE : 'rgba(0,0,0,0.08)' }, half && { flex: 1 }]}>
      <Text style={[styles.sumCardLabel, { color: mu }]}>{label}</Text>
      <Text style={[styles.sumCardValue, { color: fg }]}>{lbs} <Text style={[styles.sumCardUnit, { color: mu }]}>lbs</Text></Text>
      <Text style={[styles.sumCardSub, { color: mu }]}>{oz.toFixed(1)} oz · {kg} kg</Text>
    </View>
  );
}

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

// ─── AnimatedSwipeRow ─────────────────────────────────────────────────────────

let _closeOpenSwipe: (() => void) | null = null;

function AnimatedSwipeRow({
  item, category, onToggle, onDelete,
}: {
  item: GearItem; category: string;
  onToggle: (cat: string, id: string) => void;
  onDelete: (item: GearItem, cat: string) => void;
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
      onMoveShouldSetPanResponder: (_, g) =>
        !isSwipingRef.current && Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.4,
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
        if (!isOpenRef.current && g.dx < -50) {
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
        <TouchableOpacity
          style={[styles.swipeActionBtn, { backgroundColor: '#EF4444' }]}
          onPress={() => { closeRef.current(); onDelete(item, category); }}
        >
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={styles.swipeActionLabel}>Delete</Text>
        </TouchableOpacity>
      </View>
      <Animated.View style={{ transform: [{ translateX: tx }] }} {...pan.panHandlers}>
        <ItemRow item={item} category={category} onToggle={onToggle} />
      </Animated.View>
    </View>
  );
}

// ─── GearScreen ───────────────────────────────────────────────────────────────

export default function GearScreen() {
  const insets = useSafeAreaInsets();
  const {
    data, isLoading, categoryOrder,
    toggleItem, deleteItem, resetAll,
    listName, setListName,
    listKind, locations, photoListCaptureDataUrl,
    setPendingCapture,
    canUndo, canRedo, undo, redo,
    addCategory, deleteCategory, renameCategory, reorderCategories,
    saveToLocker, refreshLockerEntries,
  } = usePackData();

  // Standard list UI state
  const [openCatName, setOpenCatName] = useState<string | null>(null);
  const [allExpanded, setAllExpanded] = useState(false);
  const [groupIdx, setGroupIdx]       = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [showAdd, setShowAdd]         = useState(false);
  const [showSearch, setShowSearch]   = useState(false);
  const [showLocker, setShowLocker]   = useState(false);

  // Photo List UI state
  const [photoListView, setPhotoListView]       = useState<'category' | 'location'>('category');
  const [showSourceSheet, setShowSourceSheet]   = useState(false);
  const [showAssignment, setShowAssignment]     = useState(false);
  const [showLocName, setShowLocName]           = useState(false);
  const [showItemDest, setShowItemDest]         = useState(false);
  const [showItemName, setShowItemName]         = useState(false);
  const [newItemId, setNewItemId]               = useState<string | null>(null);
  // Tracks whether we came from source picker (for "Replace Photo" replace flow)
  const [openLocNames, setOpenLocNames]         = useState<Set<string>>(new Set());

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2200);
  }, []);

  // ── Photo List sheet cascade ──────────────────────────────────────────────

  /** Open source sheet (Camera/Photos). */
  const handleOpenSource = useCallback(() => {
    setShowSourceSheet(true);
  }, []);

  /** Image captured from camera or photos library. */
  const handleCaptured = useCallback((dataUrl: string) => {
    setPendingCapture(dataUrl);
    // Small delay so source sheet fully closes
    setTimeout(() => setShowAssignment(true), 300);
  }, [setPendingCapture]);

  /** Assignment sheet: user chose Location. */
  const handlePickLocation = useCallback(() => {
    setShowAssignment(false);
    setTimeout(() => setShowLocName(true), 200);
  }, []);

  /** Assignment sheet: user chose Item. */
  const handlePickItem = useCallback(() => {
    setShowAssignment(false);
    setTimeout(() => setShowItemDest(true), 200);
  }, []);

  /** Assignment sheet: user chose Decide later — pending capture retained. */
  const handleDecideLater = useCallback(() => {
    setShowAssignment(false);
    showToast('Photo saved — choose a location or item later');
  }, [showToast]);

  /** Location Name form: user saved. Switch to location view. */
  const handleLocationSaved = useCallback((locationId: string) => {
    setShowLocName(false);
    setPhotoListView('location');
    showToast(`Location saved`);
  }, [showToast]);

  /** Location Name form: back to assignment sheet. */
  const handleLocNameBack = useCallback(() => {
    setShowLocName(false);
    setTimeout(() => setShowAssignment(true), 200);
  }, []);

  /** Item Destination: back to assignment sheet. */
  const handleItemDestBack = useCallback(() => {
    setShowItemDest(false);
    setTimeout(() => setShowAssignment(true), 200);
  }, []);

  /** Item assigned to location or Unassigned. Open name sheet. */
  const handleItemAssigned = useCallback((itemId: string) => {
    setShowItemDest(false);
    setNewItemId(itemId);
    // Open Items category and open name sheet
    setOpenCatName(PHOTO_ITEMS_CATEGORY);
    setTimeout(() => {
      setShowItemName(true);
      showToast('Photo item saved');
    }, 200);
  }, [showToast]);

  /** Item Name sheet: closed. */
  const handleItemNameClose = useCallback(() => {
    setShowItemName(false);
    setNewItemId(null);
  }, []);

  /** Toggle location view accordion. */
  const handleLocToggle = useCallback((locId: string) => {
    setOpenLocNames(prev => {
      const next = new Set(prev);
      if (next.has(locId)) next.delete(locId);
      else next.add(locId);
      return next;
    });
  }, []);

  /** Filter toggle — only in Photo List mode. */
  const handleFilterToggle = useCallback(() => {
    if (listKind !== 'photo') return;
    setPhotoListView(v => v === 'category' ? 'location' : 'category');
  }, [listKind]);

  // ── Data computations ────────────────────────────────────────────────────

  const allSections: Section[] = categoryOrder.map((cat, catIndex) => {
    const items    = data[cat] || [];
    const populated = items.filter((i) => i.sub || i.desc || i.weightOz > 0 || i.photoDataUrl);
    const checkedWeightOz = populated.filter(i => i.checked)
      .reduce((sum, item) => sum + calcTotalOz(item.weightOz, item.qty), 0);
    return {
      title: cat, catIndex, data: populated,
      checkedCount:   populated.filter(i => i.checked).length,
      totalCount:     populated.length,
      checkedWeightOz,
    };
  }).filter(s => s.totalCount > 0 || s.title === PHOTO_ITEMS_CATEGORY);

  // Hero metrics
  const totalItems    = allSections.reduce((n, s) => n + s.totalCount, 0);
  const selectedCount = allSections.reduce((n, s) => n + s.checkedCount, 0);
  const catCount      = allSections.length;

  // Photo List: does the Items category have any items?
  const photoListHasItems = listKind === 'photo' &&
    (data[PHOTO_ITEMS_CATEGORY] || []).filter(i => i.sub || i.desc || i.photoDataUrl).length > 0;

  // Photo List: show empty card?
  const showPhotoListEmpty = listKind === 'photo' && !photoListHasItems;

  // ── Sections for SectionList ─────────────────────────────────────────────

  const sections: Section[] = useMemo(() => {
    if (listKind === 'photo') {
      if (photoListView === 'location') {
        // Location view: Items (unassigned) + add-photo-bar + location sections
        const itemsAll  = data[PHOTO_ITEMS_CATEGORY] || [];
        const itemsPopulated = itemsAll.filter(i => i.sub || i.desc || i.photoDataUrl);
        const unassigned = itemsPopulated.filter(i => !i.locationId);

        const itemsSection: Section = {
          title: PHOTO_ITEMS_CATEGORY, catIndex: 0, sectionKind: 'normal',
          data: (allExpanded || openCatName === PHOTO_ITEMS_CATEGORY) ? unassigned : [],
          checkedCount:   unassigned.filter(i => i.checked).length,
          totalCount:     unassigned.length,
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
            title: loc.name, catIndex: 0, sectionKind: 'location',
            locId: loc.id, locPhotoDataUrl: loc.photoDataUrl,
            data: openLocNames.has(loc.id) ? locItems : [],
            checkedCount:   locItems.filter(i => i.checked).length,
            totalCount:     locItems.length,
            checkedWeightOz: locItems.filter(i => i.checked)
              .reduce((s, i) => s + calcTotalOz(i.weightOz, i.qty), 0),
          };
        });

        return [itemsSection, addPhotoBarSection, ...locSections];
      } else {
        // Category view: just the Items category (standard rendering)
        return allSections.map(s => ({
          ...s,
          data: allExpanded || openCatName === s.title ? s.data : [],
        }));
      }
    }

    // Standard list: normal sections
    return allSections.map(s => ({
      ...s,
      data: allExpanded || openCatName === s.title ? s.data : [],
    }));
  }, [listKind, photoListView, data, allSections, allExpanded, openCatName, locations, openLocNames]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleCatToggle = useCallback((catName: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAllExpanded(false);
    setOpenCatName(prev => prev === catName ? null : catName);
  }, []);

  const handleExpandAll = useCallback(() => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAllExpanded(prev => { if (prev) setOpenCatName(null); return !prev; });
  }, []);

  const handleReset = useCallback(() => {
    Alert.alert('Clear All Checks', 'Remove all packed checkmarks from your list?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: () => {
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        resetAll();
      }},
    ]);
  }, [resetAll]);

  const handleItemDelete = useCallback((item: GearItem, cat: string) => {
    Alert.alert('Delete Item', `Remove "${item.desc || item.sub || 'this item'}" from your list?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteItem(cat, item.id) },
    ]);
  }, [deleteItem]);

  const handleCatLongPress = useCallback((catName: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Don't allow managing the structural Items category in Photo List mode
    if (listKind === 'photo' && catName === PHOTO_ITEMS_CATEGORY) return;
    const idx      = categoryOrder.indexOf(catName);
    const catItems = data[catName] || [];
    Alert.alert(catName,
      catItems.length > 0 ? `${catItems.length} item${catItems.length !== 1 ? 's' : ''}` : 'Empty category',
      [
        { text: 'Rename', onPress: () => {
          if (Platform.OS === 'ios') {
            Alert.prompt('Rename Category', undefined, (text) => {
              if (text?.trim()) renameCategory(catName, text.trim());
            }, 'plain-text', catName);
          } else Alert.alert('Rename', 'Renaming categories is available on iOS.');
        }},
        { text: 'Delete', style: 'destructive', onPress: () =>
          Alert.alert('Delete Category',
            catItems.length > 0
              ? `Remove "${catName}" and its ${catItems.length} item${catItems.length !== 1 ? 's' : ''}?`
              : `Remove the empty category "${catName}"?`,
            [{ text: 'Cancel', style: 'cancel' },
             { text: 'Delete', style: 'destructive', onPress: () => deleteCategory(catName) }],
          ),
        },
        ...(idx > 0 ? [{ text: '▲ Move Up', onPress: () => {
          const o = [...categoryOrder]; [o[idx-1],o[idx]] = [o[idx],o[idx-1]]; reorderCategories(o);
        }}] : []),
        ...(idx < categoryOrder.length - 1 ? [{ text: '▼ Move Down', onPress: () => {
          const o = [...categoryOrder]; [o[idx+1],o[idx]] = [o[idx],o[idx+1]]; reorderCategories(o);
        }}] : []),
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  }, [categoryOrder, data, renameCategory, deleteCategory, reorderCategories, listKind]);

  const handleHeroNameTap = useCallback(() => {
    if (Platform.OS === 'ios') {
      Alert.prompt('List Name', undefined, (text) => {
        if (text?.trim()) setListName(text.trim());
      }, 'plain-text', listName);
    } else Alert.alert('List Name', 'Tap-to-rename is available on iOS.');
  }, [listName, setListName]);

  const disabledActions = useMemo<Set<string>>(() => {
    const s = new Set<string>();
    if (!canUndo) s.add('undo');
    if (!canRedo) s.add('redo');
    return s;
  }, [canUndo, canRedo]);

  const handleBoxAction = useCallback((action: string) => {
    switch (action) {
      case 'next':
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setGroupIdx(g => (g + 1) % NUM_GROUPS);
        break;
      case 'back':
        if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setGroupIdx(g => (g - 1 + NUM_GROUPS) % NUM_GROUPS);
        break;
      case 'summary': setShowSummary(true); break;
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
        // Photo List: open source sheet for camera
        if (listKind === 'photo') {
          setShowSourceSheet(true);
        }
        break;
      case 'undo': undo(); break;
      case 'redo': redo(); break;
      case 'save':
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        saveToLocker();
        showToast('List saved');
        break;
      case 'share': {
        const packedLines = categoryOrder.flatMap(cat =>
          (data[cat] || []).filter(i => i.checked)
            .map(i => `• ${i.desc || i.sub}${i.qty > 1 ? ` ×${i.qty}` : ''}`)
        );
        const totalOz = categoryOrder.flatMap(cat => (data[cat] || []).filter(i => i.checked))
          .reduce((sum, i) => sum + calcTotalOz(i.weightOz, i.qty), 0);
        const lbs = ozToLbs(totalOz).toFixed(2);
        const message = [listName, '─────────────────',
          packedLines.length > 0 ? packedLines.join('\n') : '(No items packed yet)',
          '', `Packed: ${lbs} lbs (${totalOz.toFixed(1)} oz)`, 'via TrailWeigh'].join('\n');
        Share.share({ message, title: listName });
        break;
      }
      case 'reset': handleReset(); break;
      default: break;
    }
  }, [handleReset, undo, redo, saveToLocker, refreshLockerEntries, listName, categoryOrder, data, listKind, showToast]);

  const bottomPad = Platform.OS === 'web' ? 20 : insets.bottom;

  // Summary calculations
  const { baseWeightOz, clothingWornOz, dogPackOz, expendablesOz, grandTotalOz } = calcWeights(data);
  const summaryTotals = categoryOrder
    .map(cat => ({ name: cat, oz: (data[cat] || []).filter(i => i.checked)
      .reduce((s, i) => s + calcTotalOz(i.weightOz, i.qty), 0) }))
    .filter(c => c.oz > 0)
    .sort((a, b) => b.oz - a.oz);

  // Filter label
  const filterLabel = listKind === 'photo'
    ? (photoListView === 'location' ? 'Location' : 'Category')
    : 'Category';

  // ── Render ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: PAGE_BG }]}>
        <ActivityIndicator size="large" color={NAV_ACTIVE} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: PAGE_BG }]}>
      {/* ── Fixed top ──────────────────────────────────────────────────── */}
      <AppBar />
      <ListSummaryHero
        listName={listName} totalItems={totalItems} catCount={catCount}
        selectedCount={selectedCount} allExpanded={allExpanded}
        onExpandToggle={handleExpandAll} onNameTap={handleHeroNameTap}
      />
      <FilterControl
        viewLabel={filterLabel}
        onToggle={listKind === 'photo' ? handleFilterToggle : undefined}
      />

      {/* ── Photo List empty state card ─────────────────────────────────── */}
      {showPhotoListEmpty ? (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.photoListEmptyScroll}
          showsVerticalScrollIndicator={false}
        >
          <PhotoListEmptyCard
            pendingCapture={photoListCaptureDataUrl}
            locations={locations}
            onAddPhoto={handleOpenSource}
            onChooseClassification={() => setShowAssignment(true)}
            onReplacePhoto={handleOpenSource}
          />
        </ScrollView>
      ) : (
        <>
          {/* ── "Add another photo" bar — top of list in Photo List mode ── */}
          {listKind === 'photo' && photoListHasItems && photoListView === 'category' && (
            <AddAnotherPhotoBar onPress={handleOpenSource} />
          )}

          {/* ── Scrolling category / location list ──────────────────────── */}
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={({ item, section }) => {
              const s = section as Section;
              if (s.sectionKind === 'add-photo-bar') return null;
              return (
                <AnimatedSwipeRow
                  item={item}
                  category={s.sectionKind === 'location' ? PHOTO_ITEMS_CATEGORY : s.title}
                  onToggle={toggleItem}
                  onDelete={handleItemDelete}
                />
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
                  <LocationBar
                    loc={loc}
                    totalCount={s.totalCount}
                    checkedCount={s.checkedCount}
                    isOpen={openLocNames.has(s.locId)}
                    onToggle={() => handleLocToggle(s.locId!)}
                  />
                );
              }

              // Normal category header
              const full = allSections.find(a => a.title === s.title) || s;
              return (
                <SectionHeader
                  title={s.title}
                  catIndex={s.catIndex}
                  checkedCount={full.checkedCount}
                  totalCount={full.totalCount}
                  checkedWeightOz={full.checkedWeightOz}
                  isOpen={allExpanded || openCatName === s.title}
                  onToggle={() => handleCatToggle(s.title)}
                  onLongPress={() => handleCatLongPress(s.title)}
                />
              );
            }}
            stickySectionHeadersEnabled
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            style={styles.list}
          />
        </>
      )}

      {/* ── Fixed bottom ──────────────────────────────────────────────── */}
      <BottomBox
        groupIdx={groupIdx} onAction={handleBoxAction}
        bottomPad={bottomPad} disabledSet={disabledActions}
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
                      <SummaryCatBar key={cat.name} name={cat.name} oz={cat.oz} totalOz={grandTotalOz} />
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

      {/* ── Locker / Add / Search sheets ──────────────────────────────── */}
      <LockerModal visible={showLocker} onClose={() => setShowLocker(false)} />
      <AddDeck visible={showAdd} onClose={() => setShowAdd(false)} showToast={showToast} />
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

      {/* ── Toast overlay ─────────────────────────────────────────────── */}
      {!!toastMsg && (
        <View style={styles.toast} pointerEvents="none">
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
    backgroundColor: '#FFFFFF', paddingLeft: 8, paddingRight: 8,
    borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.07)',
    zIndex: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  appBarInner:    { height: APPBAR_H, flexDirection: 'row', alignItems: 'center', gap: 10 },
  appBarLogo:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  appBarTitle:    { fontSize: 19, fontFamily: 'PlusJakartaSans_600SemiBold', color: PRIMARY_TEXT, letterSpacing: 0.1 },
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
  heroListName: { fontSize: 15.5, fontFamily: 'PlusJakartaSans_700Bold', color: '#FFFFFF', lineHeight: 19, flexShrink: 1 },
  heroCountRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  heroCount: { fontSize: 40, fontFamily: 'PlusJakartaSans_700Bold', color: '#FFFFFF', letterSpacing: -1.5, lineHeight: 44 },
  heroCountSuffix: { fontSize: 17, fontFamily: 'PlusJakartaSans_500Medium', color: 'rgba(255,255,255,0.78)', paddingBottom: 3 },
  heroChevronBtn: { paddingBottom: 3, alignSelf: 'flex-end' },
  heroRight: { alignItems: 'flex-end', justifyContent: 'center', gap: 6, flexShrink: 0 },
  heroCatCount: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: 'rgba(255,255,255,0.58)', letterSpacing: 0.2 },
  heroSelectedRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroSelectedText: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: 'rgba(255,255,255,0.80)', letterSpacing: 0.1 },

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
  filterLabel: { flex: 1, fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: PRIMARY_TEXT, letterSpacing: 0.1 },

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
  sectionName: { fontSize: 17, fontFamily: 'PlusJakartaSans_500Medium', color: PRIMARY_TEXT, lineHeight: 20, letterSpacing: -0.1 },
  sectionSub: { fontSize: 12.5, fontFamily: 'PlusJakartaSans_400Regular', color: NAV_INACTIVE },
  sectionRight: { paddingRight: RIGHT_INSET, paddingVertical: 8, alignItems: 'flex-end', justifyContent: 'center', maxWidth: 96 + RIGHT_INSET },
  sectionWeight: { fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: PRIMARY_TEXT, letterSpacing: 0.1, textAlign: 'right' },

  // LocationBar content area (right of wedge)
  locBarContent: {
    flex: 1, paddingLeft: 12, paddingVertical: 8,
    flexDirection: 'column', justifyContent: 'center', gap: 4,
  },
  locBarThumb: {
    width: 42, height: 42, borderRadius: 8,
    backgroundColor: NAV_ACTIVE,
  },
  locBarThumbFallback: { alignItems: 'center', justifyContent: 'center' },
  locBarName: {
    fontSize: 13, fontFamily: 'PlusJakartaSans_600SemiBold', color: PRIMARY_TEXT,
    maxWidth: 130,
  },
  locBarRight: {
    paddingRight: ITEM_R_INSET, paddingVertical: 8, alignItems: 'flex-end', justifyContent: 'center', gap: 3,
  },
  locBarType: { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: NAV_INACTIVE },
  locBarCount: { fontSize: 11, fontFamily: 'PlusJakartaSans_400Regular', color: MUTED },

  // ItemRow
  itemRow: {
    flexDirection: 'row', alignItems: 'center', minHeight: 44, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: DIVIDER, paddingRight: ITEM_R_INSET,
  },
  checkboxArea: { width: CHECKBOX_HIT, height: 44, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  itemName: { flex: 1, fontSize: 14.5, fontFamily: 'PlusJakartaSans_500Medium', color: PRIMARY_TEXT, lineHeight: 20 },
  itemNameChecked: { color: NAV_INACTIVE, opacity: 0.8 },
  itemWeight: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: NAV_INACTIVE, letterSpacing: 0.2, flexShrink: 0, marginLeft: 8 },

  // List
  list:        { flex: 1 },
  listContent: { paddingBottom: 4 },
  photoListEmptyScroll: { flexGrow: 1, padding: 16 },

  // Photo List empty card
  emptyCard: {
    margin: 8, padding: 20, borderRadius: 16,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
  },
  emptyCardBadge: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: 'rgba(42,87,64,0.10)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  emptyCardTitle: {
    fontSize: 18, fontWeight: '700', color: PRIMARY_TEXT, textAlign: 'center', marginBottom: 6,
  },
  emptyCardSubtitle: {
    fontSize: 13.5, color: MUTED, lineHeight: 20, textAlign: 'center', marginBottom: 16,
  },
  // Pending capture block (state 3)
  pendingBlock: { width: '100%', marginBottom: 16 },
  pendingImage: { width: '100%', height: 168, borderRadius: 10, marginBottom: 10 },
  chooseBtn: {
    width: '100%', minHeight: 42, borderRadius: 9, borderWidth: 1, borderColor: NAV_ACTIVE,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  chooseBtnText: { fontSize: 14, fontWeight: '600', color: NAV_ACTIVE },
  replaceBtn: {
    width: '100%', minHeight: 42, borderRadius: 9, backgroundColor: NAV_ACTIVE,
    alignItems: 'center', justifyContent: 'center',
  },
  replaceBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  // VISUAL DESTINATIONS grid (state 6)
  visualDestBlock: { width: '100%', marginBottom: 16, alignItems: 'flex-start' },
  visualDestLabel: {
    fontSize: 11, fontWeight: '700', color: MUTED, letterSpacing: 1.2,
    textTransform: 'uppercase', marginBottom: 8, alignSelf: 'flex-start',
  },
  visualDestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%' },
  visualDestTile: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 9, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: '#FAFAF9', padding: 6,
  },
  visualDestThumb: { width: 34, height: 34, borderRadius: 6, backgroundColor: NAV_ACTIVE },
  visualDestThumbFallback: { backgroundColor: 'rgba(42,87,64,0.15)' },
  visualDestName: { fontSize: 12.5, fontWeight: '650' as any, color: PRIMARY_TEXT },
  // Add Photo CTA
  addPhotoCTA: {
    width: '100%', minHeight: 44, borderRadius: 10, backgroundColor: NAV_ACTIVE,
    alignItems: 'center', justifyContent: 'center',
  },
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
  navBox: { flex: 1, paddingTop: 9, paddingBottom: 8, alignItems: 'center', justifyContent: 'center', gap: 2 },
  navLabel: { fontSize: 10, fontFamily: 'PlusJakartaSans_400Regular', color: NAV_INACTIVE },

  // Summary sheet
  summarySheet: { flex: 1, backgroundColor: '#FFFFFF' },
  summaryHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,0,0,0.18)', alignSelf: 'center', marginTop: 8, marginBottom: 4 },
  summaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.10)' },
  summaryTitle: { fontSize: 20, fontFamily: 'PlusJakartaSans_700Bold', color: '#111827', letterSpacing: -0.3 },
  summarySubtitle: { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: '#6B7280', marginTop: 2 },
  summaryCloseBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  summaryScroll: { flex: 1 },
  summaryContent: { gap: 10 },
  summaryPairRow: { flexDirection: 'row', gap: 10 },
  summaryBreakdown: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(0,0,0,0.08)', backgroundColor: '#F9FAFB', padding: 14, gap: 10 },
  summaryBreakdownTitle: { fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', textTransform: 'uppercase', letterSpacing: 1.2, color: '#6B7280', marginBottom: 2 },
  summaryEmpty: { alignItems: 'center', paddingVertical: 48, gap: 6 },
  summaryEmptyText: { fontSize: 15, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#6B7280' },
  summaryEmptyHint: { fontSize: 13, fontFamily: 'PlusJakartaSans_400Regular', color: '#9CA3AF' },
  sumCard: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 3 },
  sumCardLabel: { fontSize: 10, fontFamily: 'PlusJakartaSans_700Bold', textTransform: 'uppercase', letterSpacing: 0.9 },
  sumCardValue: { fontSize: 34, fontFamily: 'PlusJakartaSans_700Bold', letterSpacing: -0.8, lineHeight: 40 },
  sumCardUnit: { fontSize: 16, fontFamily: 'PlusJakartaSans_500Medium' },
  sumCardSub: { fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', opacity: 0.85 },
  sumCatRow: { gap: 5 },
  sumCatMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sumCatName: { fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', color: '#111827', flex: 1 },
  sumCatWeight: { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#6B7280', letterSpacing: 0.2 },
  sumCatTrack: { height: 5, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.08)', overflow: 'hidden' },
  sumCatFill: { height: 5, borderRadius: 3, backgroundColor: NAV_ACTIVE },

  // Swipe
  swipeActionBtn: { width: SWIPE_BTN_W, alignItems: 'center', justifyContent: 'center', gap: 4, alignSelf: 'stretch' },
  swipeActionLabel: { fontSize: 11, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#FFFFFF', letterSpacing: 0.3 },

  // Toast
  toast: {
    position: 'absolute', bottom: 90, left: 20, right: 20,
    backgroundColor: 'rgba(26,41,32,0.92)', borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center',
    zIndex: 999, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18, shadowRadius: 6, elevation: 6,
  },
  toastText: { color: '#FFFFFF', fontSize: 13.5, fontWeight: '500' },
});
