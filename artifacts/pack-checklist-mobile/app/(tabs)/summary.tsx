/**
 * summary.tsx — Weight Summary screen
 *
 * Task 1 (Batch I): Added Weight Distribution donut chart (react-native-svg)
 * to match v3 §12.2 Card 2 "MobileWeightDistribution" behaviour.
 * Each slice uses getCategoryTheme colour; legend rendered below the chart.
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
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { useColors } from '@/hooks/useColors';
import { usePackData } from '@/context/PackDataContext';
import { calcWeights, calcTotalOz, ozToLbs } from '@/lib/weightUtils';
import { getCategoryTheme } from '@/lib/categoryTheme';

// ─── Donut chart helpers ───────────────────────────────────────────────────────

function polarToCart(
  cx: number, cy: number, r: number, angleDeg: number,
): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** Build an SVG donut-slice path string. Handles full-circle edge-case. */
function slicePath(
  cx: number, cy: number,
  R: number, r: number,
  startDeg: number, endDeg: number,
): string {
  const sweep = Math.min(endDeg - startDeg, 359.98); // clamp to avoid degenerate full-circle
  const large = sweep > 180 ? 1 : 0;
  const p1 = polarToCart(cx, cy, R, startDeg);
  const p2 = polarToCart(cx, cy, R, startDeg + sweep);
  const p3 = polarToCart(cx, cy, r, startDeg + sweep);
  const p4 = polarToCart(cx, cy, r, startDeg);
  return [
    `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
    `A ${R} ${R} 0 ${large} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    `L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
    `A ${r} ${r} 0 ${large} 0 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

// ─── DonutChart ───────────────────────────────────────────────────────────────

interface Slice {
  name: string;
  oz: number;
  color: string;
  pct: number; // 0-100
}

const CHART_SIZE = 180;
const CX = CHART_SIZE / 2;   // 90
const CY = CHART_SIZE / 2;   // 90
const R_OUTER = 82;
const R_INNER = 50;           // donut hole
const GAP_DEG = 1.5;          // gap between slices (0.75 each side)

function DonutChart({ slices }: { slices: Slice[] }) {
  if (slices.length === 0) return null;

  // build path + angle data
  const paths: Array<{ d: string; color: string; name: string; pct: number }> = [];
  let cursor = 0;

  slices.forEach((slice) => {
    const angleFull = (slice.pct / 100) * 360;
    // if only one slice, skip gap so we don't get a gap on a 100% ring
    const gapEach = slices.length === 1 ? 0 : GAP_DEG / 2;
    const startAngle = cursor + gapEach;
    const endAngle   = cursor + angleFull - gapEach;
    if (endAngle > startAngle) {
      paths.push({
        d: slicePath(CX, CY, R_OUTER, R_INNER, startAngle, endAngle),
        color: slice.color,
        name: slice.name,
        pct: slice.pct,
      });
    }
    cursor += angleFull;
  });

  return (
    <View style={chartStyles.root}>
      {/* SVG donut */}
      <View style={chartStyles.svgWrap}>
        <Svg width={CHART_SIZE} height={CHART_SIZE} viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}>
          {paths.map((p, i) => (
            <Path key={i} d={p.d} fill={p.color} />
          ))}
        </Svg>
        {/* centre label */}
        <View style={chartStyles.centre} pointerEvents="none">
          <Text style={chartStyles.centreTitle}>Weight</Text>
          <Text style={chartStyles.centreSub}>by category</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={chartStyles.legend}>
        {slices.map((slice) => (
          <View key={slice.name} style={chartStyles.legendRow}>
            <View style={[chartStyles.dot, { backgroundColor: slice.color }]} />
            <Text style={chartStyles.legendName} numberOfLines={1}>{slice.name}</Text>
            <Text style={chartStyles.legendPct}>{slice.pct.toFixed(0)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  root: { alignItems: 'center', gap: 16, paddingVertical: 4 },
  svgWrap: { width: CHART_SIZE, height: CHART_SIZE, alignItems: 'center', justifyContent: 'center' },
  centre: { position: 'absolute', alignItems: 'center' },
  centreTitle: { fontSize: 13, fontFamily: 'PlusJakartaSans_700Bold', color: '#1A2920', letterSpacing: -0.2 },
  centreSub:   { fontSize: 10, fontFamily: 'PlusJakartaSans_400Regular', color: '#667270', marginTop: 1 },
  legend: { width: '100%', gap: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  legendName: { flex: 1, fontSize: 13, fontFamily: 'PlusJakartaSans_500Medium', color: '#1A2920' },
  legendPct:  { fontSize: 12, fontFamily: 'PlusJakartaSans_600SemiBold', color: '#667270', minWidth: 36, textAlign: 'right' },
});

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
  const { data, isLoading, categoryOrder } = usePackData();

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

  // Use dynamic categoryOrder (not static CATEGORY_ORDER) so custom/renamed cats appear
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

      {/* Category breakdown bars */}
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
