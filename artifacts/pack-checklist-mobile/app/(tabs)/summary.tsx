/**
 * summary.tsx — Weight Summary tab (v3 §12.2 two-card accordion deck)
 *
 * Rewritten from flat scroll to exact v3 parity.
 *
 * Card 1 — Pack Summary
 *   Icon: scale-outline (v3 Lucide Scale)
 *   Subtitle: "Base, expendables, and total weight" (§12.2)
 *   Rows: Base Weight, Clothing Worn*, Dog Pack*, Expendables*, Grand Total
 *   (* = only shown if category exists in data, v3 WeightSummary pattern)
 *
 * Card 2 — Weight Distribution
 *   Icon: bar-chart-outline (v3 Lucide BarChart2)
 *   Subtitle: "Category share of pack weight" (§12.2)
 *   Content: existing DonutChart component (unchanged)
 *
 * VF §12 card geometry (self-checked against authoritative spec):
 *   Active card: bg #FFFFFF; shadow 0 4px 18px rgba(0,0,0,0.18); header min-height=68px; icon slot 32×32
 *   Inactive bar: min-height=68px; padding=0 14px; border-top 1px rgba(0,0,0,0.07)
 *   Chevron: size=16 ChevronLeft-rotated-90 = ChevronDown (closed) / ChevronUp (open) in Ionicons
 */

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Ionicons } from '@expo/vector-icons';
import { usePackData } from '@/context/PackDataContext';
import { calcWeights, calcTotalOz, formatDisplayWeight } from '@/lib/weightUtils';
import { getCategoryTheme } from '@/lib/categoryTheme';
import { DonutChart, Slice } from '@/components/DonutChart';

// ─── Color tokens (v3 VF §2) ─────────────────────────────────────────────────

// Self-check: PAGE_BG = #F2EDE4 = OVERLAY_BG. The tab screen uses this as outer background so
// white cards visually "float" on the warm off-white, matching the deck-on-overlay appearance.
const PAGE_BG      = '#F2EDE4';  // Warm off-white shell/overlay background
const CARD_BG      = '#FFFFFF';  // Card surface
const PRIMARY_TEXT = '#1A2920';  // Dark forest-green body text
const NAV_ACTIVE   = '#2A5740';  // Active green — icon + Grand Total value
const NAV_INACTIVE = '#6E7672';  // Inactive — chevron
const MUTED        = '#667270';  // Sub-labels, meta text
const DIVIDER      = 'rgba(0,0,0,0.06)';   // Row separators (VF §2 DIVIDER)
const HEADER_BDR   = 'rgba(0,0,0,0.07)';   // Card inactive bar top border (VF §2 HEADER_BDR)

// Non-base categories as defined by calcWeights / v3 §12.2 Card 1 row order
const NON_BASE_CATS = ['Clothing Worn', 'Dog Pack', 'Expendables'] as const;

// ─── SummaryScreen ────────────────────────────────────────────────────────────

export default function SummaryScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, categoryOrder, weightUnit } = usePackData();

  // One card open at a time. Default: Card 1 open (v3 Summary deck shows first card active).
  const [openCard, setOpenCard] = useState<1 | 2>(1);

  // Bottom padding — same logic as prior summary.tsx (isLiquidGlassAvailable = iOS 26 native tabs)
  const isNativeTabs = isLiquidGlassAvailable();
  const bottomPad = Platform.OS === 'web'
    ? 84
    : isNativeTabs ? insets.bottom : insets.bottom + 49;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: PAGE_BG }]}>
        <ActivityIndicator size="large" color={NAV_ACTIVE} />
      </View>
    );
  }

  // ── Weight data ──────────────────────────────────────────────────────────────
  const { baseWeightOz, clothingWornOz, dogPackOz, expendablesOz, grandTotalOz } =
    calcWeights(data);

  // Non-base rows: show only categories that exist in data (user may have deleted some)
  // v3 §12.2: "one row per non-base category" — these three are the canonical non-base set
  const nonBaseRows = NON_BASE_CATS
    .filter(cat => cat in data)
    .map(cat => ({
      label: cat,
      oz: cat === 'Clothing Worn' ? clothingWornOz
        : cat === 'Dog Pack'      ? dogPackOz
        : expendablesOz,
    }));

  // ── Donut slices (Card 2) ────────────────────────────────────────────────────
  // Same computation as prior summary.tsx — checked items per category, sorted descending
  const catTotals = categoryOrder.map((cat, idx) => {
    const items = data[cat] || [];
    const oz = items
      .filter(i => i.checked)
      .reduce((sum, item) => sum + calcTotalOz(item.weightOz, item.qty), 0);
    return { name: cat, oz, color: getCategoryTheme(cat, idx).bg };
  }).filter(c => c.oz > 0);

  const sorted = [...catTotals].sort((a, b) => b.oz - a.oz);
  const donutSlices: Slice[] = sorted.map(c => ({
    name: c.name, oz: c.oz, color: c.color,
    pct: grandTotalOz > 0 ? (c.oz / grandTotalOz) * 100 : 0,
  }));

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: PAGE_BG }}
      contentContainerStyle={{
        paddingTop: Platform.OS === 'web' ? 67 : 0,
        paddingBottom: bottomPad + 16,
      }}
      showsVerticalScrollIndicator={false}
    >

      {/* ── Card 1: Pack Summary ──────────────────────────────────────────── */}
      {/* VF §12 active: bg #FFFFFF; shadow 0 4px 18px rgba(0,0,0,0.18) */}
      {/* VF §12 inactive: bg #FFFFFF; border-top 1px rgba(0,0,0,0.07) */}
      <View style={openCard === 1 ? styles.cardActive : styles.cardInactive}>
        {/* Card header — VF §12: min-height=68px; padding=0 14px */}
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => setOpenCard(1)}
          activeOpacity={0.65}
        >
          {/* Icon slot — VF §12: 32×32. Scale = v3 Lucide Scale → Ionicons scale-outline */}
          <View style={styles.iconSlot}>
            <Ionicons name="scale-outline" size={17} color={NAV_ACTIVE} />
          </View>
          <View style={styles.cardMeta}>
            {/* Self-check: title = "Pack Summary" per §12.2 Card 1 */}
            <Text style={styles.cardTitle}>Pack Summary</Text>
            {/* Self-check: subtitle = "Base, expendables, and total weight" per §12.2 */}
            <Text style={styles.cardSub}>Base, expendables, and total weight</Text>
          </View>
          {/* VF §12: ChevronLeft rotated 90° = pointing down when collapsed */}
          <Ionicons
            name={openCard === 1 ? 'chevron-up-outline' : 'chevron-down-outline'}
            size={16}
            color={NAV_INACTIVE}
          />
        </TouchableOpacity>

        {/* Card 1 content — only when expanded */}
        {openCard === 1 && (
          <View style={styles.cardContent}>
            {/* Base Weight — always first row, bold */}
            <View style={styles.summaryRow}>
              <Text style={styles.labelBold}>Base Weight</Text>
              <Text style={styles.valueBold}>
                {formatDisplayWeight(baseWeightOz, weightUnit)}
              </Text>
            </View>

            {/* Non-base category rows — Clothing Worn, Dog Pack, Expendables */}
            {nonBaseRows.map(row => (
              <React.Fragment key={row.label}>
                <View style={styles.rowDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.labelNormal}>{row.label}</Text>
                  <Text style={styles.valueNormal}>
                    {formatDisplayWeight(row.oz, weightUnit)}
                  </Text>
                </View>
              </React.Fragment>
            ))}

            {/* Grand Total — separated by a heavier divider gap */}
            <View style={styles.rowDivider} />
            <View style={[styles.summaryRow, styles.grandTotalRow]}>
              <Text style={styles.labelBold}>Grand Total</Text>
              {/* Grand Total value in NAV_ACTIVE green per v3 WeightSummary emphasis */}
              <Text style={[styles.valueBold, { color: NAV_ACTIVE }]}>
                {formatDisplayWeight(grandTotalOz, weightUnit)}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* ── Card 2: Weight Distribution ──────────────────────────────────── */}
      <View style={openCard === 2 ? styles.cardActive : styles.cardInactive}>
        {/* Card header */}
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => setOpenCard(2)}
          activeOpacity={0.65}
        >
          {/* BarChart2 = v3 Lucide BarChart2 → Ionicons bar-chart-outline */}
          <View style={styles.iconSlot}>
            <Ionicons name="bar-chart-outline" size={17} color={NAV_ACTIVE} />
          </View>
          <View style={styles.cardMeta}>
            {/* Self-check: title = "Weight Distribution" per §12.2 Card 2 */}
            <Text style={styles.cardTitle}>Weight Distribution</Text>
            {/* Self-check: subtitle = "Category share of pack weight" per §12.2 */}
            <Text style={styles.cardSub}>Category share of pack weight</Text>
          </View>
          <Ionicons
            name={openCard === 2 ? 'chevron-up-outline' : 'chevron-down-outline'}
            size={16}
            color={NAV_INACTIVE}
          />
        </TouchableOpacity>

        {/* Card 2 content — DonutChart (unchanged component) */}
        {openCard === 2 && (
          <View style={styles.cardContent}>
            {donutSlices.length > 0 ? (
              <DonutChart slices={donutSlices} />
            ) : (
              <Text style={styles.emptyNote}>No items packed yet</Text>
            )}
          </View>
        )}
      </View>

    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // ── Card states ────────────────────────────────────────────────────────────

  // VF §12 active card: bg #FFFFFF; shadow 0 4px 18px rgba(0,0,0,0.18)
  // Self-check: shadowOpacity=0.18, shadowRadius=18, height=4 ✓
  cardActive: {
    backgroundColor: CARD_BG,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },

  // VF §12 inactive bar: bg #FFFFFF; border-top 1px rgba(0,0,0,0.07)
  // Self-check: HEADER_BDR = rgba(0,0,0,0.07) ✓
  cardInactive: {
    backgroundColor: CARD_BG,
    borderTopWidth: 1, borderTopColor: HEADER_BDR,
  },

  // ── Card header ─────────────────────────────────────────────────────────────

  // VF §12: min-height=68px; padding=0 14px; gap between elements
  // Self-check: minHeight=68 ✓; paddingHorizontal=14 ✓
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    minHeight: 68, paddingHorizontal: 14, gap: 12,
  },

  // VF §12: icon slot 32×32
  // Self-check: width=32, height=32 ✓; borderRadius=8; bg rgba(42,87,64,0.10) = NAV_ACTIVE at 10% opacity
  iconSlot: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: 'rgba(42,87,64,0.10)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },

  cardMeta: { flex: 1, gap: 2 },

  // Card title — based on VF §12 deck label fontSize=16 fontWeight=700
  // Using fontSize=15 here (card header, not deck title bar) for proportional native sizing
  cardTitle: {
    fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: PRIMARY_TEXT,
  },

  cardSub: {
    fontSize: 12, fontFamily: 'PlusJakartaSans_400Regular', color: MUTED,
  },

  // ── Card content ────────────────────────────────────────────────────────────

  cardContent: {
    paddingHorizontal: 14, paddingBottom: 16,
  },

  // ── Pack Summary rows ────────────────────────────────────────────────────────

  summaryRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    minHeight: 44, paddingVertical: 6,
  },

  rowDivider: {
    height: 1, backgroundColor: DIVIDER,
  },

  // Grand Total row: extra visual separation — slight top margin + top border
  grandTotalRow: {
    marginTop: 4,
    borderTopWidth: 1, borderTopColor: DIVIDER,
  },

  // Normal non-base category rows
  labelNormal: {
    fontSize: 14, fontFamily: 'PlusJakartaSans_500Medium', color: PRIMARY_TEXT,
  },
  valueNormal: {
    fontSize: 14, fontFamily: 'PlusJakartaSans_600SemiBold', color: MUTED,
  },

  // Base Weight and Grand Total rows — bold emphasis
  labelBold: {
    fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: PRIMARY_TEXT,
  },
  valueBold: {
    fontSize: 15, fontFamily: 'PlusJakartaSans_700Bold', color: PRIMARY_TEXT,
  },

  emptyNote: {
    fontSize: 14, fontFamily: 'PlusJakartaSans_400Regular', color: MUTED,
    textAlign: 'center', paddingVertical: 20,
  },
});
