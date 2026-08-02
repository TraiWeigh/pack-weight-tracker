import React, { useCallback, useRef } from 'react';
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
import { useColors } from '@/hooks/useColors';
import { usePackData, CATEGORY_ORDER, GearItem } from '@/context/PackDataContext';
import { calcTotalOz, formatWeight } from '@/lib/weightUtils';

type Section = {
  title: string;
  data: GearItem[];
  checkedCount: number;
  totalCount: number;
};

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
  const weightLabel = item.weightOz > 0
    ? `${formatWeight(totalOz, 'imperial', 'small')} oz`
    : null;

  return (
    <TouchableOpacity
      style={[
        styles.itemRow,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
        },
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
              {
                color: item.checked ? colors.foreground : colors.foreground,
                opacity: item.checked ? 1 : 0.7,
              },
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
  return (
    <View
      style={[
        styles.sectionHeader,
        { backgroundColor: colors.background, borderBottomColor: colors.border },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        {title}
      </Text>
      {totalCount > 0 && (
        <View
          style={[
            styles.sectionBadge,
            {
              backgroundColor:
                checkedCount === totalCount ? colors.primary : colors.secondary,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionBadgeText,
              {
                color:
                  checkedCount === totalCount
                    ? colors.primaryForeground
                    : colors.mutedForeground,
              },
            ]}
          >
            {checkedCount}/{totalCount}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function GearScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data, toggleItem, isLoading } = usePackData();

  const sections: Section[] = CATEGORY_ORDER.map(cat => {
    const items = data[cat] || [];
    const populated = items.filter(i => i.sub || i.desc);
    return {
      title: cat,
      data: populated,
      checkedCount: populated.filter(i => i.checked).length,
      totalCount: populated.length,
    };
  }).filter(s => s.totalCount > 0);

  const totalItems = sections.reduce((n, s) => n + s.totalCount, 0);
  const checkedItems = sections.reduce((n, s) => n + s.checkedCount, 0);
  const progressPct = totalItems > 0 ? checkedItems / totalItems : 0;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Progress bar */}
      <View
        style={[
          styles.progressContainer,
          {
            backgroundColor: colors.muted,
            paddingTop: Platform.OS === 'web' ? 67 : 0,
          },
        ]}
      >
        <View style={styles.progressRow}>
          <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
            {checkedItems} of {totalItems} packed
          </Text>
          <Text style={[styles.progressPct, { color: colors.primary }]}>
            {Math.round(progressPct * 100)}%
          </Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: `${progressPct * 100}%` as any,
              },
            ]}
          />
        </View>
      </View>

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
        contentContainerStyle={{
          paddingBottom: insets.bottom + (Platform.OS === 'web' ? 84 : 90),
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    letterSpacing: 0.2,
  },
  progressPct: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
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
});
