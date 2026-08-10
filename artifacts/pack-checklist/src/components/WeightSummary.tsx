/**
 * WeightSummary.tsx — Prompt 019
 *
 * Split into two independent exported components:
 *   WeightSummary     — Pack Summary card (collapsible, chevron header)
 *   WeightDistribution — Chart + palette card (collapsible, own card, text-foreground heading)
 *
 * Both are rendered as separate sidebar siblings in Checklist.tsx.
 * Both collapse independently; neither affects the other's state.
 */
import React, { useState } from 'react';
import { PackState, CategoryMeta } from '../hooks/usePackData';
import { useUnit } from '../context/UnitContext';
import { calcTotalOz, formatWeight, largeUnit } from '../lib/weightUtils';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { ChevronDown, ChevronUp, Palette } from 'lucide-react';
import { useBarStyle, barCombinedStyle, barFgStyle, barFontStyle } from '../context/BarStyleContext';

// ── Chart palettes ────────────────────────────────────────────────────────────

const PALETTES: Record<string, { label: string; colors: string[] }> = {
  trail: {
    label: 'Trail',
    colors: ['#3d5c3a','#5e8f58','#7ba36e','#95b58a','#4d7a68','#6b8f7a','#8a9e7a','#aac29e','#3d6557','#c2d4b8'],
  },
  ocean: {
    label: 'Ocean',
    colors: ['#1a4a6e','#1e6a8e','#2589a8','#3baabf','#5cbfd0','#7dd4df','#2a7a9a','#4da8c0','#164d70','#93dce8'],
  },
  sunset: {
    label: 'Sunset',
    colors: ['#c0392b','#e05c35','#e67e22','#f39c12','#f1c40f','#d35400','#c0a020','#a04040','#8040a0','#c06080'],
  },
  forest: {
    label: 'Forest',
    colors: ['#1a4a1a','#2d6a2d','#3d8a3d','#4daa4d','#5dc05d','#2a7a3a','#507060','#3d7a4d','#6a9c5a','#8cba78'],
  },
  berry: {
    label: 'Berry',
    colors: ['#5b2c6f','#7d3c98','#9b59b6','#a569bd','#bb8fce','#8e44ad','#c39bd3','#6c3483','#d07dc0','#e8a8d8'],
  },
  desert: {
    label: 'Desert',
    colors: ['#7d5a3c','#a0724d','#c4935e','#d4a676','#e0b990','#8a6045','#b07a50','#c8a070','#9a7050','#ddc098'],
  },
};

// ── Shared prop types ─────────────────────────────────────────────────────────

interface WeightBaseProps {
  data: PackState;
  categoryOrder: string[];
  categoryMeta: Record<string, CategoryMeta>;
}

// ── Shared weight calculation ─────────────────────────────────────────────────

function calcWeights(data: PackState, categoryOrder: string[], categoryMeta: Record<string, CategoryMeta>) {
  let baseWeightOz = 0;
  const nonBaseTotals: { name: string; oz: number }[] = [];
  const grandTotalOz_parts: number[] = [];

  for (const cat of categoryOrder) {
    const items = (data[cat] || []).filter(i => i.checked);
    const catTotalOz = items.reduce((sum, item) => sum + calcTotalOz(item.weightOz, item.qty), 0);
    const countsToBase = categoryMeta[cat]?.countsToBase ?? true;
    if (countsToBase) {
      baseWeightOz += catTotalOz;
    } else {
      nonBaseTotals.push({ name: cat, oz: catTotalOz });
    }
    grandTotalOz_parts.push(catTotalOz);
  }
  const grandTotalOz = baseWeightOz + nonBaseTotals.reduce((s, c) => s + c.oz, 0);
  return { baseWeightOz, nonBaseTotals, grandTotalOz };
}

// ── Pack Summary ──────────────────────────────────────────────────────────────

/** Pack Summary card — collapsible, independent of Weight Distribution. */
export function WeightSummary({ data, categoryOrder, categoryMeta }: WeightBaseProps) {
  const { system } = useUnit();
  const lu = largeUnit(system);
  // 022G: start collapsed — Pack Summary is closed on every fresh open/refresh
  const [summaryOpen, setSummaryOpen] = useState(false);
  const barStyle = useBarStyle();

  const { baseWeightOz, nonBaseTotals, grandTotalOz } = calcWeights(data, categoryOrder, categoryMeta);

  // 023F: font cascades to expanded body via outer wrapper
  return (
    <div className="bg-card border border-card-border rounded-xl shadow-sm" style={barFontStyle(barStyle)}>
      {/* Collapsible header — same chevron pattern as Weight Distribution */}
      <button
        onClick={() => setSummaryOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 sm:px-5 py-3 text-left hover:bg-muted/30 transition-colors rounded-xl"
        style={barCombinedStyle(barStyle)}
        aria-expanded={summaryOpen}
        aria-label={summaryOpen ? 'Collapse Pack Summary' : 'Expand Pack Summary'}
      >
        {summaryOpen
          ? <ChevronUp   className="w-4 h-4 text-muted-foreground flex-shrink-0" style={barFgStyle(barStyle)} />
          : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" style={barFgStyle(barStyle)} />
        }
        <span className="text-sm font-semibold text-foreground uppercase tracking-wider" style={barFgStyle(barStyle)}>
          Pack Summary
        </span>
      </button>

      {/* Collapsible body */}
      {summaryOpen && (
        <div className="p-4 sm:p-5 border-t border-border animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-3">
            {/* Base Weight */}
            <div className="flex justify-between items-end">
              <span className="text-sm font-medium text-muted-foreground">Base Weight</span>
              <div className="font-mono text-2xl font-bold text-foreground tabular-nums leading-none">
                {formatWeight(baseWeightOz, system, 'large')}
                <span className="text-sm text-muted-foreground ml-1 font-sans">{lu}</span>
              </div>
            </div>

            {/* Dynamic non-base categories */}
            {nonBaseTotals.map(({ name, oz }) => (
              <div key={name} className="flex justify-between items-end">
                <span className="text-sm font-medium text-muted-foreground">{name}</span>
                <div className="font-mono text-lg font-semibold text-foreground tabular-nums leading-none">
                  {formatWeight(oz, system, 'large')}
                  <span className="text-xs text-muted-foreground ml-1 font-sans">{lu}</span>
                </div>
              </div>
            ))}

            <div className="h-px w-full bg-border my-2" />

            {/* Grand Total */}
            <div className="flex justify-between items-end">
              <span className="text-base font-bold text-foreground">Grand Total</span>
              <div className="font-mono text-3xl font-black text-foreground tabular-nums leading-none">
                {formatWeight(grandTotalOz, system, 'large')}
                <span className="text-base text-muted-foreground ml-1 font-sans">{lu}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Weight Distribution ───────────────────────────────────────────────────────

interface WeightDistributionProps extends WeightBaseProps {
  /** Current palette key for this file. Controlled by the parent (Checklist). */
  paletteKey: string;
  /** Called when the user picks a different palette. Parent updates its state. */
  onPaletteChange: (key: string) => void;
}

/** Weight Distribution card — its own independent sidebar panel. */
export function WeightDistribution({
  data,
  categoryOrder,
  categoryMeta,
  paletteKey,
  onPaletteChange,
}: WeightDistributionProps) {
  const { system } = useUnit();
  const lu = largeUnit(system);
  // 022G: start collapsed — Weight Distribution is closed on every fresh open/refresh
  const [chartOpen, setChartOpen] = useState(false);
  const [showPaletteMenu, setShowPaletteMenu] = useState(false);
  const barStyle = useBarStyle();

  const palette = PALETTES[paletteKey] ?? PALETTES.trail;

  // Build category data for the pie chart
  const { grandTotalOz } = calcWeights(data, categoryOrder, categoryMeta);

  const categoryData = categoryOrder.map((cat, index) => {
    const items = (data[cat] || []).filter(i => i.checked);
    const catTotalOz = items.reduce((sum, item) => sum + calcTotalOz(item.weightOz, item.qty), 0);
    return {
      name: cat,
      value: catTotalOz,
      fill: palette.colors[index % palette.colors.length],
    };
  }).filter(d => d.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-popover border border-popover-border p-2 rounded-md shadow-md text-sm">
          <div className="font-semibold text-foreground mb-1">{d.name}</div>
          <div className="font-mono text-muted-foreground">
            {formatWeight(d.value, system, 'large')} {lu}
          </div>
        </div>
      );
    }
    return null;
  };

  // 023F: font cascades to expanded body (chart + legend) via outer wrapper
  return (
    <div className="bg-card border border-card-border rounded-xl shadow-sm" style={barFontStyle(barStyle)}>
      {/* Header row: collapse toggle + palette pill */}
      <div className="flex items-center">
        <button
          onClick={() => setChartOpen(o => !o)}
          className="flex-1 flex items-center gap-2 px-4 sm:px-5 py-3 text-left hover:bg-muted/30 transition-colors"
          style={barCombinedStyle(barStyle)}
          aria-expanded={chartOpen}
          aria-label={chartOpen ? 'Collapse Weight Distribution' : 'Expand Weight Distribution'}
        >
          {chartOpen
            ? <ChevronUp   className="w-4 h-4 text-muted-foreground flex-shrink-0" style={barFgStyle(barStyle)} />
            : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" style={barFgStyle(barStyle)} />
          }
          {/* text-foreground → white in dark mode, black in light mode */}
          <span className="text-sm font-semibold text-foreground uppercase tracking-wider" style={barFgStyle(barStyle)}>
            Weight Distribution
          </span>
        </button>

        {/* Palette pill — 023F: participates in bar color system */}
        <div className="relative pr-4 sm:pr-5">
          <button
            onClick={() => setShowPaletteMenu(o => !o)}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 bg-card hover:bg-muted/50 px-3 py-1.5 rounded-lg transition-colors"
            style={barCombinedStyle(barStyle)}
          >
            <Palette className="w-3.5 h-3.5" />
            {palette.label}
          </button>
          {showPaletteMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowPaletteMenu(false)} />
              <div className="absolute right-4 sm:right-5 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-20 min-w-[160px] py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                {Object.entries(PALETTES).map(([key, p]) => (
                  <button
                    key={key}
                    onClick={() => { onPaletteChange(key); setShowPaletteMenu(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-muted/60 ${
                      paletteKey === key ? 'text-foreground font-semibold' : 'text-foreground'
                    }`}
                  >
                    <span className="flex gap-0.5 flex-shrink-0">
                      {p.colors.slice(0, 3).map((c, i) => (
                        <span key={i} className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: c }} />
                      ))}
                    </span>
                    {p.label}
                    {paletteKey === key && <span className="ml-auto text-primary text-xs">✓</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chart body */}
      {chartOpen && (
        <div className="p-4 sm:p-5 pt-2 border-t border-border animate-in fade-in slide-in-from-top-2 duration-200">
          {grandTotalOz > 0 ? (
            <>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 space-y-2">
                {categoryData.map((cat, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: cat.fill }} />
                      <span className="text-foreground font-medium truncate w-32">{cat.name}</span>
                    </div>
                    <span className="font-mono text-muted-foreground tabular-nums text-xs">
                      {formatWeight(cat.value, system, 'large')} {lu}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm italic">
              No items packed yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}
