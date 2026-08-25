/**
 * DonutChart — shared weight-distribution ring chart
 *
 * Used by the Summary Tab screen (summary.tsx) and the in-list Summary Modal
 * in GearScreen (index.tsx). Matches v3 §12.2 "Weight Distribution" card.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function polarToCart(
  cx: number, cy: number, r: number, angleDeg: number,
): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function slicePath(
  cx: number, cy: number,
  R: number, r: number,
  startDeg: number, endDeg: number,
): string {
  const sweep = Math.min(endDeg - startDeg, 359.98);
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

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Slice {
  name: string;
  oz: number;
  color: string;
  pct: number; // 0-100
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CHART_SIZE = 180;
const CX         = CHART_SIZE / 2; // 90
const CY         = CHART_SIZE / 2; // 90
const R_OUTER    = 82;
const R_INNER    = 50;             // donut hole
const GAP_DEG    = 1.5;            // gap between slices (0.75 each side)

// ─── DonutChart ───────────────────────────────────────────────────────────────

export function DonutChart({ slices }: { slices: Slice[] }) {
  if (slices.length === 0) return null;

  const paths: Array<{ d: string; color: string; name: string; pct: number }> = [];
  let cursor = 0;

  slices.forEach((slice) => {
    const angleFull  = (slice.pct / 100) * 360;
    const gapEach    = slices.length === 1 ? 0 : GAP_DEG / 2;
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
    <View style={styles.root}>
      {/* SVG donut */}
      <View style={styles.svgWrap}>
        <Svg width={CHART_SIZE} height={CHART_SIZE} viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}>
          {paths.map((p, i) => (
            <Path key={i} d={p.d} fill={p.color} />
          ))}
        </Svg>
        {/* Centre label */}
        <View style={styles.centre} pointerEvents="none">
          <Text style={styles.centreTitle}>Weight</Text>
          <Text style={styles.centreSub}>by category</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {slices.map((slice) => (
          <View key={slice.name} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: slice.color }]} />
            <Text style={styles.legendName} numberOfLines={1}>{slice.name}</Text>
            <Text style={styles.legendPct}>{slice.pct.toFixed(0)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:        { alignItems: 'center', gap: 16, paddingVertical: 4 },
  svgWrap:     { width: CHART_SIZE, height: CHART_SIZE, alignItems: 'center', justifyContent: 'center' },
  centre:      { position: 'absolute', alignItems: 'center' },
  centreTitle: { fontSize: 13, fontFamily: 'Arial', color: '#1A2920', letterSpacing: -0.2 },
  centreSub:   { fontSize: 10, fontFamily: 'Arial', color: '#667270', marginTop: 1 },
  legend:      { width: '100%', gap: 6 },
  legendRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot:         { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  legendName:  { flex: 1, fontSize: 13, fontFamily: 'Arial', color: '#1A2920' },
  legendPct:   { fontSize: 12, fontFamily: 'Arial', color: '#667270', minWidth: 36, textAlign: 'right' },
});
