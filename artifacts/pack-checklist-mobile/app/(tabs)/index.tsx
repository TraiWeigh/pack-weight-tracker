/**
 * index.tsx — Gear screen (N002)
 *
 * Visual shell corrected to match /mobile-functional-v3:
 *   • AppHeader: white bg, proper insets.top clearance (fixes status-bar overlap)
 *   • ListSummaryHero: dominant dark-green panel (v3 list-summary-bar)
 *   • FilterControl: full-width button that cycles All/Packed/Unpacked (v3 style)
 *   • SectionHeader: coloured icon tile left, category name + weight (v3 wedge card)
 *   • ItemRow: rounded-square checkbox, desc as primary text, sub as tag
 *   • BottomBox: 4pt progress bar, upward shadow (v3 BoxGroup echo)
 *
 * Storage, toggles, haptics, weight calculations, exclusive groups, and all
 * PackDataContext logic are unchanged from N001.
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

// ─── Design constants ────────────────────────────────────────────────────────

/** v3 list-summary-bar dark forest green */
const SUMMARY_BG = '#2A5740';
/** Width of the coloured identity tile on each category header */
const TILE_W = 58;
/** Minimum height of a category section header */
const CAT_HEADER_H = 62;

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterMode = 'all' | 'packed' | 'unpacked';

const FILTER_LABELS: Record<FilterMode, string> = {
  all: 'All Items',
  packed: 'Packed Only',
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

// ─── AppHeader ────────────────────────────────────────────────────────────────
// White background; paddingTop = insets.top + content clearance so the title
// never overlaps the iOS status bar / Dynamic Island.

function AppHeader({ listName }: { listName: string }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.appHeader,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
          paddingTop: insets.top + 8,
        },
      ]}
    >
      <Text style={[styles.appHeaderTitle, { color: colors.foreground }]}>
        TrailWeigh
      </Text>
      <Text style={[styles.appHeaderSub, { color: colors.mutedForeground }]}>
        {listName}
      </Text>
    </View>
  );
}

// ─── ListSummaryHero ──────────────────────────────────────────────────────────
// Dominant dark-green panel: list name → large item count → weight row.
// Mirrors v3's rgba(42,87,64,0.94) list-summary-bar.

function ListSummaryHero({
  listName,
  totalItems,
  checkedItems,
  baseWeightOz,
  grandTotalOz,
}: {
  listName: string;
  totalItems: number;
  checkedItems: number;
  baseWeightOz: number;
  grandTotalOz: number;
}) {
  const bwLbs = ozToLbs(baseWeightOz).toFixed(2);
  const gtLbs = ozToLbs(grandTotalOz).toFixed(2);

  return (
    <View style={styles.hero}>
      {/* List identity */}
      <Text style={styles.heroListName} numberOfLines={1}>
        {listName}
      </Text>

      {/* Large item count — mirrors v3's 40px/800 count number */}
      <View style={styles.heroCountRow}>
        <Text style={styles.heroCount}>{checkedItems}</Text>
        <Text style={styles.heroCountOf}>/{totalItems}</Text>
        <Text style={styles.heroCountLabel}>  items packed</Text>
      </View>

      {/* Weight row */}
      <View style={styles.heroWeightRow}>
        <View style={styles.heroWeightCell}>
          <Text style={styles.heroWeightLabel}>BASE WEIGHT</Text>
          <Text style={styles.heroWeightValue}>{bwLbs} lbs</Text>
        </View>
        <View style={styles.heroWeightDivider} />
        <View style={styles.heroWeightCell}>
          <Text style={styles.heroWeightLabel}>GRAND TOTAL</Text>
          <Text style={[styles.heroWeightValue, styles.heroWeightValueAccent]}>
            {gtLbs} lbs
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── FilterControl ────────────────────────────────────────────────────────────
// Single full-width button (v3 filter-control style).
// Tapping cycles through All → Packed → Unpacked.

function FilterControl({
  filter,
  onFilter,
}: {
  filter: FilterMode;
  onFilter: (f: FilterMode) => void;
}) {
  const colors = useColors();

  const handlePress = useCallback(() => {
    const idx = FILTER_CYCLE.indexOf(filter);
    onFilter(FILTER_CYCLE[(idx + 1) % FILTER_CYCLE.length]);
  }, [filter, onFilter]);

  return (
    <View
      style={[
        styles.filterBar,
        { backgroundColor: colors.card, borderBottomColor: colors.border },
      ]}
    >
      <TouchableOpacity
        style={[styles.filterButton, { borderColor: colors.border }]}
        onPress={handlePress}
        activeOpacity={0.7}
        testID={`filter-${filter}`}
      >
        <Ionicons
          name="options-outline"
          size={16}
          color={colors.primary}
          style={styles.filterIcon}
        />
        <Text
          style={[styles.filterButtonText, { color: colors.primary }]}
          numberOfLines={1}
        >
          {FILTER_LABELS[filter]}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.mutedForeground} />
      </TouchableOpacity>
    </View>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────
// v3-style card: coloured identity tile (left) + icon, category name + subtitle,
// category packed weight (right). Sticky via stickySectionHeadersEnabled.

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
  const colors = useColors();
  const theme = getCategoryTheme(title, catIndex);
  const allDone = checkedCount === totalCount && totalCount > 0;
  const weightLbs = ozToLbs(checkedWeightOz).toFixed(2);

  return (
    <View
      style={[
        styles.sectionCard,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
          shadowColor: '#000',
        },
      ]}
    >
      {/* Coloured identity tile (native equivalent of v3 polygon wedge) */}
      <View style={[styles.sectionTile, { backgroundColor: theme.bg, width: TILE_W }]}>
        <Ionicons name={theme.icon as any} size={24} color="rgba(255,255,255,0.92)" />
      </View>

      {/* Text content */}
      <View style={styles.sectionContent}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
          {totalCount} item{totalCount !== 1 ? 's' : ''}
          {checkedCount > 0 ? `  ·  ${checkedCount} packed` : ''}
        </Text>
      </View>

      {/* Right: packed weight + done indicator */}
      <View style={styles.sectionRight}>
        {checkedWeightOz > 0 && (
          <Text style={[styles.sectionWeight, { color: allDone ? colors.primary : colors.mutedForeground }]}>
            {weightLbs} lbs
          </Text>
        )}
        {allDone && (
          <View style={[styles.sectionDoneDot, { backgroundColor: colors.primary }]}>
            <Ionicons name="checkmark" size={9} color={colors.primaryForeground} />
          </View>
        )}
      </View>
    </View>
  );
}

// ─── ItemRow ──────────────────────────────────────────────────────────────────
// v3-aligned: rounded-square checkbox (borderRadius 5), desc as primary text,
// sub shown as a small muted tag below. Minimum height 44 pt.

function ItemRow({
  item,
  category,
  onToggle,
}: {
  item: GearItem;
  category: string;
  onToggle: (category: string, id: string) => void;
}) {
  const colors = useColors();

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onToggle(category, item.id);
  }, [category, item.id, onToggle]);

  const totalOz = calcTotalOz(item.weightOz, item.qty);
  const weightLabel = item.weightOz > 0 ? `${totalOz.toFixed(1)} oz` : null;

  // desc is the item name; sub is the type tag
  const primaryText = item.desc || item.sub || '';
  const tagText = item.desc && item.sub ? item.sub : null;

  return (
    <TouchableOpacity
      style={[
        styles.itemRow,
        {
          backgroundColor: item.checked ? colors.muted : colors.card,
          borderBottomColor: colors.border,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.65}
      testID={`gear-item-${item.id}`}
    >
      {/* Rounded-square checkbox (v3: borderRadius 5, not a circle) */}
      <View
        style={[
          styles.checkbox,
          {
            borderColor: item.checked ? colors.primary : 'rgba(0,0,0,0.18)',
            backgroundColor: item.checked ? colors.primary : 'transparent',
          },
        ]}
      >
        {item.checked && (
          <Ionicons name="checkmark" size={12} color={colors.primaryForeground} />
        )}
      </View>

      {/* Content: primary name + optional type tag */}
      <View style={styles.itemContent}>
        <Text
          style={[
            styles.itemName,
            { color: item.checked ? colors.mutedForeground : colors.foreground,
              opacity: item.checked ? 0.8 : 1 },
          ]}
          numberOfLines={2}
        >
          {primaryText}
        </Text>
        {tagText ? (
          <Text style={[styles.itemTag, { color: colors.mutedForeground }]} numberOfLines={1}>
            {tagText}
          </Text>
        ) : null}
      </View>

      {/* Weight — shown right; useful since native lacks a category-header weight tile in scroll */}
      {weightLabel ? (
        <Text
          style={[
            styles.itemWeight,
            { color: item.checked ? colors.primary : colors.mutedForeground },
          ]}
        >
          {weightLabel}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

// ─── BottomBox ────────────────────────────────────────────────────────────────
// Echoes v3 BoxGroup bar: upward shadow, 4pt progress bar, packed count, Reset.

function BottomBox({
  checkedItems,
  totalItems,
  onReset,
  bottomPad,
}: {
  checkedItems: number;
  totalItems: number;
  onReset: () => void;
  bottomPad: number;
}) {
  const colors = useColors();
  const progressPct = totalItems > 0 ? checkedItems / totalItems : 0;
  const allDone = checkedItems === totalItems && totalItems > 0;

  return (
    <View
      style={[
        styles.bottomBox,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: bottomPad,
          // Upward shadow — mirrors v3 BoxGroupBar
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: -3 },
          elevation: 8,
        },
      ]}
    >
      <View style={styles.bottomInner}>
        {/* Progress + count */}
        <View style={styles.bottomLeft}>
          <View style={[styles.bottomTrack, { backgroundColor: colors.muted }]}>
            <View
              style={[
                styles.bottomFill,
                {
                  backgroundColor: allDone ? colors.primary : colors.primary,
                  width: `${Math.round(progressPct * 100)}%` as any,
                  opacity: allDone ? 1 : 0.75,
                },
              ]}
            />
          </View>
          <Text style={[styles.bottomCount, { color: colors.mutedForeground }]}>
            {checkedItems} / {totalItems} packed
            {allDone && totalItems > 0 ? '  ✓' : ''}
          </Text>
        </View>

        {/* Reset — v3 Group 2 Reset action style */}
        <TouchableOpacity
          style={[
            styles.resetBtn,
            { backgroundColor: colors.secondary, borderColor: colors.border },
          ]}
          onPress={onReset}
          activeOpacity={0.7}
          testID="reset-all-btn"
        >
          <Ionicons name="refresh-outline" size={14} color={colors.foreground} />
          <Text style={[styles.resetText, { color: colors.foreground }]}>Reset</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── GearScreen ───────────────────────────────────────────────────────────────

export default function GearScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data, toggleItem, isLoading } = usePackData();
  const [filter, setFilter] = useState<FilterMode>('all');

  // Weight totals from all checked items
  const { baseWeightOz, grandTotalOz } = calcWeights(data);

  // Build sections — badge counts always reflect ALL items, not filtered view
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

  // Apply filter to visible rows; section badge counts remain from allSections
  const sections: Section[] = allSections
    .map(s => {
      let visibleData = s.data;
      if (filter === 'packed') visibleData = s.data.filter(i => i.checked);
      if (filter === 'unpacked') visibleData = s.data.filter(i => !i.checked);
      return { ...s, data: visibleData };
    })
    .filter(s => s.data.length > 0);

  const totalItems = allSections.reduce((n, s) => n + s.totalCount, 0);
  const checkedItems = allSections.reduce((n, s) => n + s.checkedCount, 0);

  // Reset all checked items (haptic confirmation — identical to N001)
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

  // Bottom padding: NativeTabs manages its own safe area; ClassicTabs is
  // position:absolute so we need to clear its 49pt bar + bottom inset.
  const isNativeTabs = isLiquidGlassAvailable();
  const bottomPad =
    Platform.OS === 'web'
      ? 84
      : isNativeTabs
      ? insets.bottom
      : insets.bottom + 49;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Fixed top: header + summary hero + filter */}
      <AppHeader listName="Backpacking Gear" />
      <ListSummaryHero
        listName="Backpacking Gear"
        totalItems={totalItems}
        checkedItems={checkedItems}
        baseWeightOz={baseWeightOz}
        grandTotalOz={grandTotalOz}
      />
      <FilterControl filter={filter} onFilter={setFilter} />

      {/* Scrollable gear list */}
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

      {/* Fixed bottom: v3 BoxGroup echo */}
      <BottomBox
        checkedItems={checkedItems}
        totalItems={totalItems}
        onReset={handleReset}
        bottomPad={bottomPad}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // ── AppHeader (white, safe-area-aware) ──────────────────────────────────────
  appHeader: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 1,
    // Shadow below header (v3 HEADER_BDR equivalent)
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
    zIndex: 10,
  },
  appHeaderTitle: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: -0.3,
  },
  appHeaderSub: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    letterSpacing: 0.2,
  },

  // ── ListSummaryHero (v3 dark-green panel) ───────────────────────────────────
  hero: {
    backgroundColor: SUMMARY_BG,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 6,
  },
  heroListName: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: 'rgba(255,255,255,0.62)',
    textTransform: 'uppercase',
    letterSpacing: 1.0,
  },
  heroCountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 0,
  },
  heroCount: {
    fontSize: 40,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#FFFFFF',
    letterSpacing: -1,
    lineHeight: 46,
  },
  heroCountOf: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: -0.5,
    paddingBottom: 2,
  },
  heroCountLabel: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_500Medium',
    color: 'rgba(255,255,255,0.72)',
    paddingBottom: 3,
  },
  heroWeightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.20)',
    gap: 0,
  },
  heroWeightCell: {
    flex: 1,
    gap: 2,
  },
  heroWeightDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginHorizontal: 14,
  },
  heroWeightLabel: {
    fontSize: 9,
    fontFamily: 'PlusJakartaSans_700Bold',
    color: 'rgba(255,255,255,0.52)',
    textTransform: 'uppercase',
    letterSpacing: 1.0,
  },
  heroWeightValue: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    color: 'rgba(255,255,255,0.88)',
    letterSpacing: -0.2,
  },
  heroWeightValueAccent: {
    color: '#7ECFA0', // mint accent for grand total
  },

  // ── FilterControl (v3 full-width button) ────────────────────────────────────
  filterBar: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  filterIcon: {
    // provided by Ionicons
  },
  filterButtonText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    letterSpacing: 0.1,
  },

  // ── SectionHeader (v3 wedge card equivalent) ─────────────────────────────────
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: CAT_HEADER_H,
    borderBottomWidth: StyleSheet.hairlineWidth,
    // Subtle downward shadow like v3 category card
    shadowOpacity: 0.10,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    zIndex: 5,
  },
  sectionTile: {
    // width set inline from TILE_W
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: CAT_HEADER_H,
  },
  sectionContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    gap: 3,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_500Medium',
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
    letterSpacing: 0.1,
  },
  sectionRight: {
    paddingRight: 14,
    paddingVertical: 10,
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 5,
    minWidth: 56,
  },
  sectionWeight: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    letterSpacing: 0.2,
    textAlign: 'right',
  },
  sectionDoneDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── ItemRow (v3 aligned) ────────────────────────────────────────────────────
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  // Rounded-square checkbox — v3 uses borderRadius 5 (not a circle)
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemContent: {
    flex: 1,
    gap: 2,
  },
  // Primary text: item.desc (the actual product name)
  itemName: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    lineHeight: 19,
  },
  // Secondary tag: item.sub (subcategory type)
  itemTag: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    opacity: 0.65,
  },
  itemWeight: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    letterSpacing: 0.2,
    flexShrink: 0,
    textAlign: 'right',
  },

  // ── List ────────────────────────────────────────────────────────────────────
  list: { flex: 1 },
  listContent: { paddingBottom: 4 },

  // ── BottomBox (v3 BoxGroup echo) ────────────────────────────────────────────
  bottomBox: {
    borderTopWidth: StyleSheet.hairlineWidth,
    zIndex: 20,
  },
  bottomInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 14,
  },
  bottomLeft: {
    flex: 1,
    gap: 6,
  },
  bottomTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  bottomFill: {
    height: 4,
    borderRadius: 2,
  },
  bottomCount: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    letterSpacing: 0.2,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  resetText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    letterSpacing: 0.1,
  },
});
