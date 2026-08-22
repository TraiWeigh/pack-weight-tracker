/**
 * index.tsx — Gear screen  N003 / R0111
 *
 * Exact v3 visual recreation in React Native — all measurements sourced from
 * /mobile-functional-v3 line-by-line inspection (R0111 geometry report).
 *
 * Visual targets:
 *   AppBar        — 52pt content + insets.top, single row, paddingL 14 paddingR 44
 *   ListSummary   — horizontal: 66×66 tile | name+count col | right stack (packed+weight)
 *   Filter        — 50pt slot, 36pt button, exact padding/shadow from v3
 *   SectionHeader — 72pt wide tile, 64pt height, 17pt name, 44pt right inset, v3 shadow
 *   ItemRow       — clean 44pt row, rounded-square checkbox, CB_CHECKED, no sub-tag
 *   BottomBox     — 58pt, 4 icon+label columns (v3 NavBox geometry), upward shadow
 *
 * Unchanged: PackDataContext, weightUtils, initialData, haptics, toggles, routes,
 *            categoryTheme.ts, Expo SDK/runtime, all web files.
 *
 * Unrepresentable in RN (noted inline):
 *   clip-path polygon wedge → rectangular tile ✓
 *   filter: drop-shadow(rightward) on wedge → thin right-edge border on tile
 *   per-header sticky-state style → permanent v3 resting shadow applied to all headers
 *   font-weight 800 → 700Bold (PlusJakartaSans max)
 *   font-weight 450 → 500Medium
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { useColors } from '@/hooks/useColors';
import { usePackData, CATEGORY_ORDER, GearItem } from '@/context/PackDataContext';
import { calcTotalOz, calcWeights, ozToLbs } from '@/lib/weightUtils';
import { getCategoryTheme } from '@/lib/categoryTheme';

// ─── v3 design constants (exact values from MobileFunctionalV3.tsx) ─────────

const SUMMARY_BG   = '#2A5740';   // rgba(42,87,64,0.94) → opaque native equiv
const NAV_ACTIVE   = '#2A5740';   // line 218
const NAV_INACTIVE = '#6E7672';   // line 219
const CB_CHECKED   = '#4E7D5C';   // line 220
const PRIMARY_TEXT = '#1A2920';   // line 211
const PAGE_BG      = '#F2EDE4';   // line 205
const DIVIDER      = 'rgba(0,0,0,0.06)'; // CARD_BORDER

const TILE_W         = 72;   // WEDGE_W  line 187
const CAT_HEADER_H   = 64;   // CHECKLIST_ROW_H  line 191
const RIGHT_INSET    = 44;   // CATEGORY_WEIGHT_RIGHT_INSET  line 195
const ITEM_R_INSET   = 34;   // CHECKLIST_RIGHT_INSET  line 194
const FILTER_H       = 50;   // FILTER_BAR_H  line 233
const NAV_H          = 58;   // NAV_H  line 228
const APPBAR_H       = 52;   // derived from v3 app bar height
const CHECKBOX_HIT   = 44;   // checkbox hit-target width (v3 touch target)

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterMode = 'all' | 'packed' | 'unpacked';

const FILTER_LABELS: Record<FilterMode, string> = {
  all:      'All Items',
  packed:   'Packed Only',
  unpacked: 'Unpacked Only',
};

const FILTER_CYCLE: FilterMode[] = ['all', 'packed', 'unpacked'];

type Section = {
  title: string;
  catIndex: number;
  data: GearItem[];
  checkedCount: number;
  totalCount: number;
  checkedWeightOz: number;
};

// ─── AppBar ───────────────────────────────────────────────────────────────────
// v3: height 52px content, paddingL 8 paddingR 44, HEADER_BG #FFFFFF, 1px border rgba(0,0,0,0.07)
// Native: paddingTop = insets.top (safe-area); content height 52pt.

function AppBar() {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.appBar,
        {
          paddingTop: insets.top,
          minHeight: insets.top + APPBAR_H,
        },
      ]}
    >
      <View style={styles.appBarInner}>
        {/* Logo mark substitute — Ionicons checkmark-circle */}
        <Ionicons name="checkmark-circle" size={22} color={NAV_ACTIVE} />
        {/* Wordmark: v3 19px/600/PRIMARY */}
        <Text style={styles.appBarTitle}>TrailWeigh</Text>
      </View>
    </View>
  );
}

// ─── ListSummaryHero ──────────────────────────────────────────────────────────
// v3: horizontal row — 66×66 icon tile | content col | right stack
// paddingL 14, paddingR 44, paddingT 10, paddingB 12, gap 14, bg #2A5740
// shadow: 0 4px 12px rgba(0,0,0,0.22)

function ListSummaryHero({
  listName,
  totalItems,
  checkedItems,
  baseWeightOz,
}: {
  listName: string;
  totalItems: number;
  checkedItems: number;
  baseWeightOz: number;
}) {
  const bwLbs = ozToLbs(baseWeightOz).toFixed(1);

  return (
    <View style={styles.hero}>
      {/* Icon tile: 66×66, radius 14, dark overlay — v3 Luggage icon substitute */}
      <View style={styles.heroTile}>
        <Ionicons name="bag-outline" size={34} color="rgba(255,255,255,0.90)" />
      </View>

      {/* Content column: list name + large count row */}
      <View style={styles.heroContent}>
        {/* List name: 15.5pt/700/white — v3 line 4390 */}
        <Text style={styles.heroListName} numberOfLines={1}>
          {listName}
        </Text>
        {/* Count row: 40pt/700 + "items" 17pt/500 — v3 lines 4401–4408 */}
        <View style={styles.heroCountRow}>
          <Text style={styles.heroCount}>{totalItems}</Text>
          <Text style={styles.heroCountSuffix}> items</Text>
        </View>
      </View>

      {/* Right stack: packed count + indicator + base weight — v3 lines 4440–4457 */}
      <View style={styles.heroRight}>
        {/* Category/packed count: 12pt/600 rgba(.58) */}
        <Text style={styles.heroCatCount}>
          {checkedItems} packed
        </Text>
        {/* Selected indicator circle */}
        {checkedItems > 0 && (
          <View style={styles.heroIndicator}>
            <Ionicons
              name="checkmark"
              size={9}
              color="rgba(255,255,255,0.92)"
            />
          </View>
        )}
        {/* Base weight */}
        <Text style={styles.heroWeight}>{bwLbs} lbs</Text>
      </View>
    </View>
  );
}

// ─── FilterControl ────────────────────────────────────────────────────────────
// v3: FILTER_BAR_H=50, padding 5/14, button minH 36, padding 6/10, radius 8
// border 1px rgba(0,0,0,0.06), shadow 0 3px 8px rgba(0,0,0,0.08)
// SlidersH 15px NAV_ACTIVE, label 13/600 PRIMARY, ChevronDown 17px NAV_INACTIVE

function FilterControl({
  filter,
  onFilter,
}: {
  filter: FilterMode;
  onFilter: (f: FilterMode) => void;
}) {
  const handlePress = useCallback(() => {
    const idx = FILTER_CYCLE.indexOf(filter);
    onFilter(FILTER_CYCLE[(idx + 1) % FILTER_CYCLE.length]);
  }, [filter, onFilter]);

  return (
    <View style={styles.filterBar}>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={handlePress}
        activeOpacity={0.7}
        testID={`filter-${filter}`}
      >
        <Ionicons name="options-outline" size={15} color={NAV_ACTIVE} />
        <Text style={styles.filterLabel} numberOfLines={1}>
          {FILTER_LABELS[filter]}
        </Text>
        <Ionicons name="chevron-down" size={17} color={NAV_INACTIVE} />
      </TouchableOpacity>
    </View>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────
// v3: CHECKLIST_ROW_H=64, white bg, shadow 0 3px 10px rgba(0,0,0,0.18)
// Tile: WEDGE_W=72, full height, clip-path→rectangular tile, icon 26px rgba(.93)
// Tile right-edge: thin border simulates drop-shadow(3px 0 ...)
// Text: paddingL 12, paddingR 44 (RIGHT_INSET), paddingV 8, column gap 10
// Name: 17px/500/PRIMARY, lh 1.2→20, ls -0.1
// Subtitle: 12.5px/NAV_INACTIVE
// Weight right: 13px/600/PRIMARY, paddingR 44

function SectionHeader({
  title,
  catIndex,
  checkedCount,
  totalCount,
  checkedWeightOz,
}: {
  title: string;
  catIndex: number;
  checkedCount: number;
  totalCount: number;
  checkedWeightOz: number;
}) {
  const theme = getCategoryTheme(title, catIndex);
  const allDone = checkedCount === totalCount && totalCount > 0;
  const weightLbs = ozToLbs(checkedWeightOz).toFixed(2);

  return (
    <View style={styles.sectionCard}>
      {/* Coloured identity tile — rectangular native equiv of v3 72px polygon wedge */}
      <View style={[styles.sectionTile, { backgroundColor: theme.bg }]}>
        <Ionicons
          name={theme.icon as any}
          size={26}
          color="rgba(255,255,255,0.93)"
        />
      </View>

      {/* Text content */}
      <View style={styles.sectionContent}>
        {/* Category name: 17pt/500/PRIMARY, lh 20, ls -0.1 */}
        <Text style={styles.sectionName} numberOfLines={1}>
          {title}
        </Text>
        {/* Subtitle: 12.5pt/NAV_INACTIVE */}
        <Text style={styles.sectionSub}>
          {totalCount} item{totalCount !== 1 ? 's' : ''}
          {checkedCount > 0 ? `  ·  ${checkedCount} packed` : ''}
        </Text>
      </View>

      {/* Right: packed weight — paddingR 44, 13pt/600/PRIMARY */}
      <View style={styles.sectionRight}>
        {checkedWeightOz > 0 && (
          <Text
            style={[
              styles.sectionWeight,
              allDone && { color: NAV_ACTIVE },
            ]}
          >
            {weightLbs} lbs
          </Text>
        )}
        {allDone && (
          <View style={styles.sectionDone}>
            <Ionicons name="checkmark" size={9} color="#FFFFFF" />
          </View>
        )}
      </View>
    </View>
  );
}

// ─── ItemRow ──────────────────────────────────────────────────────────────────
// v3: minH 44, CARD_BG #FFF unchanged on checked (no muted bg)
// Checkbox: hit target 44px wide, visual 20×20 radius 5 border 1.5
// Checked: CB_CHECKED #4E7D5C; unchecked: rgba(0,0,0,0.18); check 11px
// Content: paddingR 34 (CHECKLIST_RIGHT_INSET), gap 0 (single text item)
// Name: 14.5pt/500/PRIMARY — no sub-category tag (v3 has no tag)
// Weight: kept as native-justified exception (v3 hides it; native has no cat-header weight col)

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

  // In v3, name is the single item name. Native: item.desc is the product name.
  const displayName = item.desc || item.sub || '';

  return (
    <TouchableOpacity
      style={styles.itemRow}
      onPress={handlePress}
      activeOpacity={0.65}
      testID={`gear-item-${item.id}`}
    >
      {/* Checkbox hit-target area: 44pt wide (v3 line 5036) */}
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
            /* Check: 11px (v3 line 5057) */
            <Ionicons name="checkmark" size={11} color="#FFFFFF" />
          )}
        </View>
      </View>

      {/* Item name: 14.5pt/500/PRIMARY — no sub-tag */}
      <Text
        style={[
          styles.itemName,
          item.checked && styles.itemNameChecked,
        ]}
        numberOfLines={2}
      >
        {displayName}
      </Text>

      {/* Weight — native-only; not in v3 row but useful without category col */}
      {weightLabel && (
        <Text
          style={[
            styles.itemWeight,
            item.checked && { color: NAV_ACTIVE },
          ]}
        >
          {weightLabel}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ─── BottomBox ────────────────────────────────────────────────────────────────
// v3 NavBox geometry: NAV_H=58, paddingT 7 paddingB 8, col gap 2, icon 21px label 10px
// Active bg rgba(42,87,64,0.10), active icon NAV_ACTIVE 700, inactive NAV_INACTIVE 400
// Border: 1px rgba(0,0,0,0.07), shadow 0 -3px 10px rgba(0,0,0,0.07)
// v3 Group 2: Undo · Redo · Reset · (nav) → N003 shows: Summary · Reset · Add · Search

type NavBoxProps = {
  icon: string;
  label: string;
  active?: boolean;
  onPress?: () => void;
};

function NavBox({ icon, label, active = false, onPress }: NavBoxProps) {
  return (
    <TouchableOpacity
      style={[styles.navBox, active && styles.navBoxActive]}
      onPress={onPress}
      activeOpacity={active ? 0.7 : 1}
      disabled={!onPress}
      testID={`nav-${label.toLowerCase()}`}
    >
      <Ionicons
        name={icon as any}
        size={21}
        color={active ? NAV_ACTIVE : NAV_INACTIVE}
        style={{ opacity: active ? 1 : 0.9 }}
      />
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function BottomBox({
  onReset,
  bottomPad,
}: {
  onReset: () => void;
  bottomPad: number;
}) {
  return (
    <View style={[styles.bottomBox, { paddingBottom: bottomPad }]}>
      <View style={styles.bottomRow}>
        <NavBox icon="bar-chart-outline"     label="Summary"  />
        <NavBox icon="refresh-outline"       label="Reset"    active onPress={onReset} />
        <NavBox icon="add-circle-outline"    label="Add"      />
        <NavBox icon="search-outline"        label="Search"   />
      </View>
    </View>
  );
}

// ─── GearScreen ───────────────────────────────────────────────────────────────

export default function GearScreen() {
  const insets = useSafeAreaInsets();
  const { data, toggleItem, isLoading } = usePackData();
  const [filter, setFilter] = useState<FilterMode>('all');

  const { baseWeightOz, grandTotalOz } = calcWeights(data);

  const allSections: Section[] = CATEGORY_ORDER.map((cat, catIndex) => {
    const items = data[cat] || [];
    const populated = items.filter(i => i.sub || i.desc);
    const checkedWeightOz = populated
      .filter(i => i.checked)
      .reduce((sum, item) => sum + calcTotalOz(item.weightOz, item.qty), 0);
    return {
      title: cat,
      catIndex,
      data: populated,
      checkedCount: populated.filter(i => i.checked).length,
      totalCount: populated.length,
      checkedWeightOz,
    };
  }).filter(s => s.totalCount > 0);

  const sections: Section[] = allSections
    .map(s => {
      let visibleData = s.data;
      if (filter === 'packed')   visibleData = s.data.filter(i => i.checked);
      if (filter === 'unpacked') visibleData = s.data.filter(i => !i.checked);
      return { ...s, data: visibleData };
    })
    .filter(s => s.data.length > 0);

  const totalItems   = allSections.reduce((n, s) => n + s.totalCount, 0);
  const checkedItems = allSections.reduce((n, s) => n + s.checkedCount, 0);

  const handleReset = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    CATEGORY_ORDER.forEach(cat => {
      (data[cat] || []).forEach(item => {
        if (item.checked) toggleItem(cat, item.id);
      });
    });
  }, [data, toggleItem]);

  // Bottom pad: NativeTabs manages insets; ClassicTabs is position:absolute 49pt bar.
  const isNativeTabs = isLiquidGlassAvailable();
  const bottomPad =
    Platform.OS === 'web'
      ? 84
      : isNativeTabs
      ? insets.bottom
      : insets.bottom + 49;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: PAGE_BG }]}>
        <ActivityIndicator size="large" color={NAV_ACTIVE} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: PAGE_BG }]}>
      {/* ── Fixed top ───────────────────────────────────────────────────── */}
      <AppBar />
      <ListSummaryHero
        listName="Backpacking Gear"
        totalItems={totalItems}
        checkedItems={checkedItems}
        baseWeightOz={baseWeightOz}
      />
      <FilterControl filter={filter} onFilter={setFilter} />

      {/* ── Scrolling middle ─────────────────────────────────────────────── */}
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={({ item, section }) => (
          <ItemRow
            item={item}
            category={(section as Section).title}
            onToggle={toggleItem}
          />
        )}
        renderSectionHeader={({ section }) => {
          const s = section as Section;
          return (
            <SectionHeader
              title={s.title}
              catIndex={s.catIndex}
              checkedCount={s.checkedCount}
              totalCount={s.totalCount}
              checkedWeightOz={s.checkedWeightOz}
            />
          );
        }}
        stickySectionHeadersEnabled
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />

      {/* ── Fixed bottom ─────────────────────────────────────────────────── */}
      <BottomBox onReset={handleReset} bottomPad={bottomPad} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // ── AppBar ─────────────────────────────────────────────────────────────────
  // v3: height 52, paddingL 8 paddingR 44, white, 1px border rgba(0,0,0,0.07)
  appBar: {
    backgroundColor: '#FFFFFF',
    paddingLeft: 14,          // generous left (v3=8; 14 aligns with hero for native)
    paddingRight: RIGHT_INSET, // 44 — matches v3 APPBAR_RIGHT_INSET
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.07)',
    zIndex: 10,
    // Shadow below: v3 home-only 0 2px 10px rgba(0,0,0,0.10)
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  appBarInner: {
    height: APPBAR_H,         // 52pt content height, matching v3
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,                   // v3 logo gap 6 → 8 for native
  },
  appBarTitle: {
    fontSize: 19,             // v3 wordmark 19px
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: PRIMARY_TEXT,      // #1A2920
    letterSpacing: 0.1,
  },

  // ── ListSummaryHero ────────────────────────────────────────────────────────
  // v3: bg rgba(42,87,64,0.94), paddingT 10 paddingB 12, paddingL 14 paddingR 44
  // horizontal row, gap 14, shadow 0 4px 12px rgba(0,0,0,0.22)
  hero: {
    backgroundColor: SUMMARY_BG,
    paddingTop:    10,
    paddingBottom: 12,
    paddingLeft:   14,
    paddingRight:  RIGHT_INSET,  // 44
    flexDirection: 'row',
    alignItems:    'center',
    gap:           14,           // v3 icon-to-content gap 14
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius:  12,
    shadowOffset:  { width: 0, height: 4 },
    elevation: 6,
    zIndex: 9,
  },
  // Icon tile: 66×66, radius 14, rgba(0,0,0,0.20) over hero bg
  heroTile: {
    width:           66,
    height:          66,
    borderRadius:    14,
    backgroundColor: 'rgba(0,0,0,0.20)',
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  // Content column
  heroContent: {
    flex: 1,
    gap:  8,    // v3 flex column gap 8
  },
  // List name: 15.5px/700/white, marginBottom 3 inside col
  heroListName: {
    fontSize:    15.5,
    fontFamily:  'PlusJakartaSans_700Bold',
    color:       '#FFFFFF',
    lineHeight:  19,
  },
  // Count row: baseline aligned
  heroCountRow: {
    flexDirection: 'row',
    alignItems:    'baseline',
    gap:           5,   // v3 baseline row gap 5
  },
  // Count number: 40px/800(→700)/white, ls -1.5
  heroCount: {
    fontSize:      40,
    fontFamily:    'PlusJakartaSans_700Bold',
    color:         '#FFFFFF',
    letterSpacing: -1.5,
    lineHeight:    44,
  },
  // "items" suffix: 17px/500, rgba(.78)
  heroCountSuffix: {
    fontSize:   17,
    fontFamily: 'PlusJakartaSans_500Medium',
    color:      'rgba(255,255,255,0.78)',
    paddingBottom: 3,
  },
  // Right stack: gap 6, right-aligned — v3 lines 4440–4457
  heroRight: {
    alignItems:     'flex-end',
    justifyContent: 'center',
    gap: 5,
    flexShrink: 0,
  },
  // Cat/packed count: 12px/600 rgba(.58)
  heroCatCount: {
    fontSize:      12,
    fontFamily:    'PlusJakartaSans_600SemiBold',
    color:         'rgba(255,255,255,0.58)',
    letterSpacing: 0.2,
  },
  // Selected indicator: 18×18, radius 9, rgba(.18) bg, 1.5px border rgba(.50)
  heroIndicator: {
    width:           18,
    height:          18,
    borderRadius:    9,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth:     1.5,
    borderColor:     'rgba(255,255,255,0.50)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  // Base weight: 12px/600 rgba(.62)
  heroWeight: {
    fontSize:      12,
    fontFamily:    'PlusJakartaSans_600SemiBold',
    color:         'rgba(255,255,255,0.62)',
    letterSpacing: 0.1,
  },

  // ── FilterControl ──────────────────────────────────────────────────────────
  // v3: FILTER_BAR_H=50, padding 5/14, bg white, border-bottom 1px DIVIDER
  // shadow 0 3px 8px rgba(0,0,0,0.08)
  filterBar: {
    height:            FILTER_H,
    backgroundColor:   '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical:   5,
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
    justifyContent:    'center',
    // Downward shadow (renders above list content)
    shadowColor:  '#000',
    shadowOpacity: 0.08,
    shadowRadius:  8,
    shadowOffset:  { width: 0, height: 3 },
    elevation: 3,
    zIndex: 8,
  },
  // Button: minH 36, padding 6/10, radius 8, border 1px DIVIDER, white
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
    gap:            7,  // v3 inner gap 7
  },
  // Label: 13px/600/PRIMARY
  filterLabel: {
    flex:          1,
    fontSize:      13,
    fontFamily:    'PlusJakartaSans_600SemiBold',
    color:         PRIMARY_TEXT,
    letterSpacing: 0.1,
  },

  // ── SectionHeader / Category Card ─────────────────────────────────────────
  // v3: minH 64, white, shadow 0 3px 10px rgba(0,0,0,0.18), border-bottom 1px DIVIDER
  sectionCard: {
    flexDirection:  'row',
    alignItems:     'stretch',
    minHeight:      CAT_HEADER_H,  // 64
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
    shadowColor:   '#000',
    shadowOpacity: 0.18,
    shadowRadius:  10,
    shadowOffset:  { width: 0, height: 3 },
    elevation:     4,
    zIndex:        5,
  },
  // Tile: TILE_W=72, full height, theme.bg
  // Right-edge thin border simulates drop-shadow(3px 0 10px ...) — not reproducible in RN exactly
  sectionTile: {
    width:          TILE_W,  // 72
    minHeight:      CAT_HEADER_H,
    alignItems:     'center',
    justifyContent: 'center',
    // Thin right border mimics v3 wedge right drop-shadow
    borderRightWidth: 2,
    borderRightColor: 'rgba(0,0,0,0.08)',
  },
  // Text content: paddingL 12, paddingR 0 (handled by sectionRight padding), paddingV 8
  sectionContent: {
    flex:          1,
    paddingLeft:   12,       // v3 text grid paddingL 12
    paddingRight:  0,
    paddingVertical: 8,      // v3 paddingT/B 8
    justifyContent: 'center',
    gap:           10,       // v3 column gap 10 (was 3 in N002 — biggest text gap fix)
  },
  // Category name: 17px/500/PRIMARY, lh 20 (1.2×17≈20.4), ls -0.1
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
  // Right weight: paddingR 44 (RIGHT_INSET), 13px/600/PRIMARY, maxW 96
  sectionRight: {
    paddingRight:   RIGHT_INSET,  // 44
    paddingVertical: 8,
    alignItems:     'flex-end',
    justifyContent: 'center',
    gap:            5,
    maxWidth:       96 + RIGHT_INSET,  // maxW 96 + padding
  },
  sectionWeight: {
    fontSize:      13,
    fontFamily:    'PlusJakartaSans_600SemiBold',
    color:         PRIMARY_TEXT,
    letterSpacing: 0.1,
    textAlign:     'right',
  },
  sectionDone: {
    width:           16,
    height:          16,
    borderRadius:    8,
    backgroundColor: NAV_ACTIVE,
    alignItems:      'center',
    justifyContent:  'center',
  },

  // ── ItemRow ────────────────────────────────────────────────────────────────
  // v3: minH 44, CARD_BG #FFF (no checked-bg change), borderBottom 1px DIVIDER
  // paddingR 34 (ITEM_R_INSET), checkbox hit-target 44pt wide
  itemRow: {
    flexDirection:  'row',
    alignItems:     'center',
    minHeight:      44,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
    paddingRight:   ITEM_R_INSET,  // 34 — CHECKLIST_RIGHT_INSET
  },
  // Checkbox touch area: 44pt wide (v3 line 5036)
  checkboxArea: {
    width:          CHECKBOX_HIT,  // 44
    height:         44,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  // Visual checkbox: 20×20, radius 5, border 1.5 — v3 lines 5040–5044
  checkbox: {
    width:          20,
    height:         20,
    borderRadius:   5,
    borderWidth:    1.5,
    alignItems:     'center',
    justifyContent: 'center',
  },
  // Name: 14.5pt/500/PRIMARY — v3 14.5px weight450(→500)
  itemName: {
    flex:          1,
    fontSize:      14.5,
    fontFamily:    'PlusJakartaSans_500Medium',
    color:         PRIMARY_TEXT,
    lineHeight:    20,
  },
  // Checked name: muted
  itemNameChecked: {
    color:   NAV_INACTIVE,
    opacity: 0.8,
  },
  // Weight — native-only justified exception (v3 hides weight in row)
  itemWeight: {
    fontSize:      12,
    fontFamily:    'PlusJakartaSans_600SemiBold',
    color:         NAV_INACTIVE,
    letterSpacing: 0.2,
    flexShrink:    0,
    marginLeft:    8,
  },

  // ── List ───────────────────────────────────────────────────────────────────
  list:        { flex: 1 },
  listContent: { paddingBottom: 4 },

  // ── BottomBox / NavBar ─────────────────────────────────────────────────────
  // v3: NAV_H=58, white, borderTop 1px rgba(0,0,0,0.07), shadow 0 -3px 10px rgba(0,0,0,0.07)
  bottomBox: {
    backgroundColor: '#FFFFFF',
    borderTopWidth:  1,
    borderTopColor:  'rgba(0,0,0,0.07)',
    shadowColor:     '#000',
    shadowOpacity:   0.07,
    shadowRadius:    10,
    shadowOffset:    { width: 0, height: -3 },
    elevation:       8,
    zIndex:          40,
  },
  bottomRow: {
    flexDirection:  'row',
    alignItems:     'stretch',
    minHeight:      NAV_H,  // 58
  },
  // NavBox: flex 1, paddingT 7 paddingB 8, col, gap 2, centered — v3 lines 982–991
  navBox: {
    flex:           1,
    paddingTop:     9,
    paddingBottom:  8,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            2,
  },
  navBoxActive: {
    backgroundColor: 'rgba(42,87,64,0.10)',  // v3 active bg
  },
  // Nav label: 10px — active 700 NAV_ACTIVE, inactive 400 NAV_INACTIVE
  navLabel: {
    fontSize:   10,
    fontFamily: 'PlusJakartaSans_400Regular',
    color:      NAV_INACTIVE,
  },
  navLabelActive: {
    fontFamily: 'PlusJakartaSans_700Bold',
    color:      NAV_ACTIVE,
  },
});
