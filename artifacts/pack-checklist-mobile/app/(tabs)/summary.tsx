import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { useColors } from '@/hooks/useColors';
import { usePackData, CATEGORY_ORDER } from '@/context/PackDataContext';
import { calcWeights, calcTotalOz, ozToLbs } from '@/lib/weightUtils';

// ─── Weight Card ──────────────────────────────────────────────────────────────

function WeightCard({
  label,
  oz,
  large,
  accent,
}: {
  label: string;
  oz: number;
  large?: boolean;
  accent?: boolean;
}) {
  const colors = useColors();
  const lbs = ozToLbs(oz).toFixed(2);
  const kg = ((oz * 28.3495) / 1000).toFixed(3);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: accent ? colors.primary : colors.card,
          borderColor: accent ? colors.primary : colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.cardLabel,
          { color: accent ? colors.primaryForeground : colors.mutedForeground },
        ]}
      >
        {label}
      </Text>
      <View style={styles.cardWeightRow}>
        <Text
          style={[
            large ? styles.cardWeightLarge : styles.cardWeightMed,
            { color: accent ? colors.primaryForeground : colors.foreground },
          ]}
        >
          {lbs}
        </Text>
        <Text
          style={[
            styles.cardUnit,
            { color: accent ? colors.primaryForeground : colors.mutedForeground },
          ]}
        >
          lbs
        </Text>
      </View>
      <Text
        style={[
          styles.cardSub,
          {
            color: accent ? colors.primaryForeground : colors.mutedForeground,
            opacity: 0.75,
          },
        ]}
      >
        {oz.toFixed(1)} oz · {kg} kg
      </Text>
    </View>
  );
}

// ─── Category Bar ─────────────────────────────────────────────────────────────

function CategoryBar({
  name,
  oz,
  totalOz,
}: {
  name: string;
  oz: number;
  totalOz: number;
}) {
  const colors = useColors();
  const pct = totalOz > 0 ? (oz / totalOz) * 100 : 0;
  const lbs = ozToLbs(oz).toFixed(2);

  return (
    <View style={styles.catBarRow}>
      <View style={styles.catBarMeta}>
        <Text
          style={[styles.catBarName, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text style={[styles.catBarWeight, { color: colors.mutedForeground }]}>
          {lbs} lbs
        </Text>
      </View>
      <View style={[styles.catTrack, { backgroundColor: colors.muted }]}>
        <View
          style={[
            styles.catFill,
            { backgroundColor: colors.primary, width: `${pct}%` as any },
          ]}
        />
      </View>
    </View>
  );
}

// ─── Summary Screen ───────────────────────────────────────────────────────────

export default function SummaryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = usePackData();

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

  const { baseWeightOz, clothingWornOz, dogPackOz, expendablesOz, grandTotalOz } =
    calcWeights(data);

  const catTotals = CATEGORY_ORDER.map(cat => {
    const items = data[cat] || [];
    const oz = items
      .filter(i => i.checked)
      .reduce((sum, item) => sum + calcTotalOz(item.weightOz, item.qty), 0);
    return { name: cat, oz };
  }).filter(c => c.oz > 0);

  const totalChecked = Object.values(data)
    .flat()
    .filter(i => i.checked).length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: bottomPad + 12, paddingTop: Platform.OS === 'web' ? 67 : 0 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Screen identity header */}
      <View
        style={[
          styles.screenHeader,
          { borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.screenHeaderTitle, { color: colors.foreground }]}>
          TrailWeigh
        </Text>
        <Text style={[styles.screenHeaderSub, { color: colors.mutedForeground }]}>
          Weight Summary
        </Text>
      </View>

      {/* Packed count note */}
      <Text style={[styles.headerNote, { color: colors.mutedForeground }]}>
        {totalChecked} item{totalChecked !== 1 ? 's' : ''} packed
      </Text>

      {/* Weight cards */}
      <WeightCard label="Base Weight" oz={baseWeightOz} large accent />

      <View style={styles.smallCards}>
        <View style={styles.smallCardHalf}>
          <WeightCard label="Clothing Worn" oz={clothingWornOz} />
        </View>
        <View style={styles.smallCardHalf}>
          <WeightCard label="Dog Pack" oz={dogPackOz} />
        </View>
      </View>

      <WeightCard label="Expendables" oz={expendablesOz} />

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <WeightCard label="Grand Total" oz={grandTotalOz} large />

      {/* Category breakdown */}
      {catTotals.length > 0 && (
        <View
          style={[
            styles.breakdownSection,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.breakdownTitle, { color: colors.mutedForeground }]}>
            WEIGHT BREAKDOWN
          </Text>
          {catTotals
            .sort((a, b) => b.oz - a.oz)
            .map(cat => (
              <CategoryBar
                key={cat.name}
                name={cat.name}
                oz={cat.oz}
                totalOz={grandTotalOz}
              />
            ))}
        </View>
      )}

      {grandTotalOz === 0 && (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyIcon, { color: colors.mutedForeground }]}>
            Nothing packed yet
          </Text>
          <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
            Head to Gear to check off items
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  scrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },

  // Screen identity header (inline, scrolls with content)
  screenHeader: {
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 1,
    marginBottom: 2,
  },
  screenHeaderTitle: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: -0.3,
  },
  screenHeaderSub: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    letterSpacing: 0.2,
  },

  headerNote: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_500Medium',
    paddingTop: 2,
    paddingBottom: 2,
    letterSpacing: 0.3,
  },

  card: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 3,
  },
  cardLabel: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },
  cardWeightRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  cardWeightLarge: {
    fontSize: 42,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: -1,
    lineHeight: 48,
  },
  cardWeightMed: {
    fontSize: 28,
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  cardUnit: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans_500Medium',
    paddingBottom: 4,
  },
  cardSub: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
    letterSpacing: 0.2,
  },

  smallCards: {
    flexDirection: 'row',
    gap: 10,
  },
  smallCardHalf: {
    flex: 1,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },

  breakdownSection: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 10,
    marginTop: 4,
  },
  breakdownTitle: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  catBarRow: {
    gap: 5,
  },
  catBarMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catBarName: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_500Medium',
    flex: 1,
  },
  catBarWeight: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    letterSpacing: 0.2,
  },
  catTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  catFill: {
    height: 5,
    borderRadius: 3,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 6,
  },
  emptyIcon: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
  emptyHint: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans_400Regular',
    opacity: 0.7,
  },
});
