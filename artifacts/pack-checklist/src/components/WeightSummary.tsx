import React from 'react';
import { PackState, CategoryMeta } from '../hooks/usePackData';
import { useUnit } from '../context/UnitContext';
import { calcTotalOz, formatWeight, largeUnit } from '../lib/weightUtils';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface WeightSummaryProps {
  data: PackState;
  categoryOrder: string[];
  categoryMeta: Record<string, CategoryMeta>;
}

export function WeightSummary({ data, categoryOrder, categoryMeta }: WeightSummaryProps) {
  const { system } = useUnit();
  const lu = largeUnit(system);

  // Tally base vs. non-base per category
  let baseWeightOz = 0;
  const nonBaseTotals: { name: string; oz: number }[] = [];

  const categoryData = categoryOrder.map((cat, index) => {
    const items = (data[cat] || []).filter(i => i.checked);
    const catTotalOz = items.reduce((sum, item) => sum + calcTotalOz(item.weightOz, item.qty), 0);
    const countsToBase = categoryMeta[cat]?.countsToBase ?? true;

    if (countsToBase) {
      baseWeightOz += catTotalOz;
    } else {
      nonBaseTotals.push({ name: cat, oz: catTotalOz });
    }

    return {
      name: cat,
      value: catTotalOz,
      fill: `hsl(var(--chart-${(index % 10) + 1}))`,
    };
  }).filter(d => d.value > 0);

  const grandTotalOz = baseWeightOz + nonBaseTotals.reduce((s, c) => s + c.oz, 0);

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

  return (
    <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden sticky top-6">
      <div className="p-4 sm:p-5 border-b border-border bg-muted/20">
        <h2 className="font-semibold text-foreground text-lg mb-4">Pack Summary</h2>

        <div className="space-y-3">
          {/* Base Weight — always shown */}
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
            <div className="font-mono text-3xl font-black text-primary tabular-nums leading-none">
              {formatWeight(grandTotalOz, system, 'large')}
              <span className="text-base text-muted-foreground ml-1 font-sans">{lu}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Weight Distribution</h3>

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
              {[...categoryData].sort((a, b) => b.value - a.value).map((cat, i) => (
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
    </div>
  );
}
