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

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterMode = 'all' | 'packed' | 'unpacked';

type Section = {
  title: string;
  data: GearItem[];
  checkedCount: number;
  totalCount: number;
};

// ─── App Header ───────────────────────────────────────────────────────────────

function AppHeader({ listName }: { listName: string }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.appHeader,
        { backgroundColor: colors.background, borderBottomColor: colors.border },
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

// ─── Summary Strip ────────────────────────────────────────────────────────────

function SummaryStrip({
  baseWeightOz,
  grandTotalOz,
}: {
  baseWeightOz: number;
  grandTotalOz: number;
}) {
  const colors = useColors();
  const bwLbs = ozToLbs(baseWeightOz).toFixed(2);
  const gtLbs = ozToLbs(grandTotalOz).toFixed(2);

  return (
    <View
      style={[
        styles.summaryStrip,
        { backgroundColor: colors.muted, borderBottomColor: colors.border },
      ]}
    >
      <View style={styles.summaryCell}>
        <Text style={[styles.summaryCellLabel, { color: colors.mutedForeground }]}>
          BASE WEIGHT
        </Text>
        <View style={styles.summaryValueRow}>
          <Text style={[styles.summaryCellValue, { color: colors.foreground }]}>
            {bwLbs}
          </Text>
          <Text style={[styles.summaryCellUnit, { color: colors.mutedForeground }]}>
            lbs
          </Text>
        </View>
      </View>

      <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />

      <View style={styles.summaryCell}>
        <Text style={[styles.summaryCellLabel, { color: colors.mutedForeground }]}>
          TOTAL
        </Text>
        <View style={styles.summaryValueRow}>
          <Text style={[styles.summaryCellValue, { color: colors.primary }]}>
            {gtLbs}
          </Text>
          <Text style={[styles.summaryCellUnit, { color: colors.primary }]}>
            lbs
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

const FILTER_OPTIONS: { key: FilterMode; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'packed', label: 'Packed' },
  { key: 'unpacked', label: 'Unpacked' },
];

function FilterBar({
  filter,
  onFilter,
}: {
  filter: FilterMode;
  onFilter: (f: FilterMode) => void;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.filterBar,
        { backgroundColor: colors.background, borderBottomColor: colors.border },
      ]}
    >
      <View style={[styles.filterTrack, { backgroundColor: colors.muted }]}>
        {FILTER_OPTIONS.map(opt => {
          const active = filter === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.filterPill,
                active && { backgroundColor: colors.card, shadowColor: colors.foreground },
              ]}
              onPress={() => onFilter(opt.key)}
              activeOpacity={0.7}
              testID={`filter-${opt.key}`}
            >
              <Text
                style={[
                  styles.filterPillText,
                  { color: active ? colors.foreground : colors.mutedForeground },
                  active && styles.filterPillTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Item Row ─────────────────────────────────────────────────────────────────

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
  const weightLabel = item.weightOz > 0 ? `${totalOz.toFixed(2)} oz` : null;

  return (
    <TouchableOpacity
      style={[
        styles.itemRow,
        { backgroundColor: colors.card, borderBottomColor: colors.border },
        item.checked && { backgroundColor: colors.muted },
      ]}
      onPress={handlePress}
      activeOpacity={0.65}
      testID={`gear-item-${item.id}`}
    >
      {/* Checkbox */}
      <View
        style={[
          styles.checkbox,
          {
            borderColor: item.checked ? colors.primary : colors.border,
            backgroundColor: item.checked ? colors.primary : 'transparent',
          },
        ]}
      >
        {item.checked && (
          <Ionicons name="checkmark" size={14} color={colors.primaryForeground} />
        )}
      </View>

      {/* Content */}
      <View style={styles.itemContent}>
        <Text
          style={[
            styles.itemSub,
            { color: item.checked ? colors.primary : colors.mutedForeground },
          ]}
          numberOfLines={1}
        >
          {item.sub}
        </Text>
        {item.desc ? (
          <Text
            style={[
              styles.itemDesc,
              { color: colors.foreground, opacity: item.checked ? 1 : 0.7 },
            ]}
            numberOfLines={2}
          >
            {item.desc}
          </Text>
        ) : null}
      </View>

      {/* Weight */}
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

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({
  title,
  checkedCount,
  totalCount,
}: {
  title: string;
  checkedCount: number;
  totalCount: number;
}) {
  const colors = useColors();
  const allDone = checkedCount === totalCount && totalCount > 0;
  return (
    <View
      style={[
        styles.sectionHeader,
        { backgroundColor: colors.background, borderBottomColor: colors.border },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {totalCount > 0 && (
        <View
          style={[
            styles.sectionBadge,
            { backgroundColor: allDone ? colors.primary : colors.secondary },
          ]}
        >
          <Text
            style={[
              styles.sectionBadgeText,
              { color: allDone ? colors.primaryForeground : colors.mutedForeground },
            ]}
          >
            {checkedCount}/{totalCount}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Bottom Box ───────────────────────────────────────────────────────────────

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

  return (
    <View
      style={[
        styles.bottomBox,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: bottomPad,
        },
      ]}
    >
      <View style={styles.bottomBoxInner}>
        {/* Progress group */}
        <View style={styles.bottomBoxLeft}>
          <View style={[styles.bottomBoxTrack, { backgroundColor: colors.muted }]}>
            <View
              style={[
                styles.bottomBoxFill,
                {
                  backgroundColor: colors.primary,
                  width: `${Math.round(progressPct * 100)}%` as any,
                },
              ]}
            />
          </View>
          <Text style={[styles.bottomBoxCount, { color: colors.mutedForeground }]}>
            {checkedItems} / {totalItems} packed
          </Text>
        </View>

        {/* Reset button */}
        <TouchableOpacity
          style={[styles.bottomBoxResetBtn, { backgroundColor: colors.secondary }]}
          onPress={onReset}
          activeOpacity={0.7}
          testID="reset-all-btn"
        >
          <Ionicons name="refresh" size={13} color={colors.mutedForeground} />
          <Text style={[styles.bottomBoxResetText, { color: colors.foreground }]}>
            Reset
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Gear Screen ──────────────────────────────────────────────────────────────

export default function GearScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data, toggleItem, isLoading } = usePackData();
  const [filter, setFilter] = useState<FilterMode>('all');

  // Weight totals from checked items
  const { baseWeightOz, grandTotalOz } = calcWeights(data);

  // Build sections — counts always reflect ALL items (not filtered)
  const allSections: Section[] = CATEGORY_ORDER.map(cat => {
    const items = data[cat] || [];
    const populated = items.filter(i => i.sub || i.desc);
    return {
      title: cat,
      data: populated,
      checkedCount: populated.filter(i => i.checked).length,
      totalCount: populated.length,
    };
  }).filter(s => s.totalCount > 0);

  // Apply filter to visible data; badge counts remain from allSections
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

  // Reset all checked items (haptic confirmation)
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
      <AppHeader listName="Backpacking Gear" />
      <SummaryStrip baseWeightOz={baseWeightOz} grandTotalOz={grandTotalOz} />
      <FilterBar filter={filter} onFilter={setFilter} />

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
        renderSectionHeader={({ section }) => (
          <SectionHeader
            title={(section as Section).title}
            checkedCount={(section as Section).checkedCount}
            totalCount={(section as Section).totalCount}
          />
        )}
        stickySectionHeadersEnabled
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />

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
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // App Header
  appHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 1,
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

  // Summary Strip
  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 0,
  },
  summaryCell: {
    flex: 1,
    gap: 2,
  },
  summaryCellLabel: {
    fontSize: 9,
    fontFamily: 'PlusJakartaSans_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.0,
  },
  summaryValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  summaryCellValue: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  summaryCellUnit: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    paddingBottom: 2,
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    marginHorizontal: 16,
  },

  // Filter Bar
  filterBar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterTrack: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
  },
  filterPill: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
    shadowOpacity: 0,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 0,
  },
  filterPillText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    letterSpacing: 0.1,
  },
  filterPillTextActive: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    flex: 1,
  },
  sectionBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sectionBadgeText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },

  // Item Row
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemContent: {
    flex: 1,
    gap: 1,
  },
  itemSub: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  itemDesc: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_400Regular',
    lineHeight: 19,
  },
  itemWeight: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    letterSpacing: 0.3,
    flexShrink: 0,
  },

  // List
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 4,
  },

  // Bottom Box
  bottomBox: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bottomBoxInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 12,
  },
  bottomBoxLeft: {
    flex: 1,
    gap: 5,
  },
  bottomBoxTrack: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  bottomBoxFill: {
    height: 3,
    borderRadius: 2,
  },
  bottomBoxCount: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_500Medium',
    letterSpacing: 0.2,
  },
  bottomBoxResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bottomBoxResetText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
});
