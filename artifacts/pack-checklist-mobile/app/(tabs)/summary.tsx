/**
 * summary.tsx — Weight Summary screen (Expo tab)
 *
 * Items 1 & 2 repair: WeightCard and CategoryBar now respect the active
 * weightUnit setting from context. Previously both hardcoded lbs.
 * DonutChart extracted to components/DonutChart.tsx (shared with GearScreen modal).
 */

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
import { usePackData } from '@/context/PackDataContext';
import { calcWeights, calcTotalOz, ozToLbs, formatDisplayWeight } from '@/lib/weightUtils';
import { getCategoryTheme } from '@/lib/categoryTheme';
import { DonutChart, Slice } from '@/components/DonutChart';

// ─── WeightCard ───────────────────────────────────────────────────────────────

function WeightCard({
  label,
  oz,
  large,
  accent,
  weightUnit,
}: {
  label: string;
  oz: number;
  large?: boolean;
  accent?: boolean;
  weightUnit: 'imperial' | 'metric';
}) {
  const colors = useColors();
  const grams = oz * 28.3495;

  // Primary display — respects active unit. Items 1 & 2: prior code ignored weightUnit.
  // Self-check: imperial oz<16 → oz/oz; ≥16 → lbs/lbs. metric g<1000 → g/g; ≥1000 → kg/kg. MATCH.
  let displayVal: string;
  let displayUnitStr: string;
  if (weightUnit === 'metric') {
    if (grams >= 1000) {
      displayVal = (grams / 1000).toFixed(3);
      displayUnitStr = 'kg';
    } else {
      displayVal = Math.round(grams).toString();
      displayUnitStr = 'g';
    }
  } else {
    if (oz >= 16) {
      displayVal = ozToLbs(oz).toFixed(2);
      displayUnitStr = 'lbs';
    } else {
      displayVal = oz.toFixed(1);
      displayUnitStr = 'oz';
    }
  }

  // Sub-line: always show both reference values
  const subLine = `${oz.toFixed(1)} oz · ${(grams / 1000).toFixed(3)} kg`;

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
          {displayVal}
        </Text>
        <Text
          style={[
            styles.cardUnit,
            { color: accent ? colors.primaryForeground : colors.mutedForeground },
          ]}
        >
          {displayUnitStr}
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
        {subLine}
      </Text>
    </View>
  );
}

// ─── CategoryBar ─────────────────────────────────────────────────────────────

function CategoryBar({
  name,
  oz,
  totalOz,
  weightUnit,
}: {
  name: string;
  oz: number;
  totalOz: number;
  weightUnit: 'imperial' | 'metric';
}) {
  const colors = useColors();
  const pct = totalOz > 0 ? (oz / totalOz) * 100 : 0;
  // Item 2: prior code hardcoded lbs. formatDisplayWeight respects active unit.
  const displayWt = formatDisplayWeight(oz, weightUnit);

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
          {displayWt}
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
  // Items 1 & 2: add weightUnit to destructure so WeightCard + CategoryBar respect it
  const { data, isLoading, categoryOrder, weightUnit } = usePackData();

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

  // Use dynamic categoryOrder so custom/renamed cats appear
  const catTotals = categoryOrder.map((cat, idx) => {
    const items = data[cat] || [];
    const oz = items
      .filter(i => i.checked)
      .reduce((sum, item) => sum + calcTotalOz(item.weightOz, item.qty), 0);
    return { name: cat, oz, color: getCategoryTheme(cat, idx).bg };
  }).filter(c => c.oz > 0);

  const totalChecked = Object.values(data)
    .flat()
    .filter(i => i.checked).length;

  // Build donut slices — sorted descending so largest slice starts at top
  const sorted = [...catTotals].sort((a, b) => b.oz - a.oz);
  const donutSlices: Slice[] = sorted.map(c => ({
    name: c.name,
    oz: c.oz,
    color: c.color,
    pct: grandTotalOz > 0 ? (c.oz / grandTotalOz) * 100 : 0,
  }));

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

      {/* Weight cards — all pass weightUnit */}
      <WeightCard label="Base Weight" oz={baseWeightOz} large accent weightUnit={weightUnit} />

      <View style={styles.smallCards}>
        <View style={styles.smallCardHalf}>
          <WeightCard label="Clothing Worn" oz={clothingWornOz} weightUnit={weightUnit} />
        </View>
        <View style={styles.smallCardHalf}>
          <WeightCard label="Dog Pack" oz={dogPackOz} weightUnit={weightUnit} />
        </View>
      </View>

      <WeightCard label="Expendables" oz={expendablesOz} weightUnit={weightUnit} />

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <WeightCard label="Grand Total" oz={grandTotalOz} large weightUnit={weightUnit} />

      {/* Category breakdown bars — each passes weightUnit */}
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
          {[...catTotals]
            .sort((a, b) => b.oz - a.oz)
            .map(cat => (
              <CategoryBar
                key={cat.name}
                name={cat.name}
                oz={cat.oz}
                totalOz={grandTotalOz}
                weightUnit={weightUnit}
              />
            ))}
        </View>
      )}

      {/* Weight Distribution donut chart — v3 §12.2 Card 2 equivalent */}
      {donutSlices.length > 0 && (
        <View
          style={[
            styles.breakdownSection,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.breakdownTitle, { color: colors.mutedForeground }]}>
            WEIGHT DISTRIBUTION
          </Text>
          <DonutChart slices={donutSlices} />
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
