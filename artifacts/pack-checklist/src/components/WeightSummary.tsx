import React from 'react';
import { PackState, CATEGORY_ORDER } from '../hooks/usePackData';
import { useUnit } from '../context/UnitContext';
import { calcTotalOz, formatWeight, ozToLbs } from '../lib/weightUtils';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface WeightSummaryProps {
  data: PackState;
}

export function WeightSummary({ data }: WeightSummaryProps) {
  const { unit, toggleUnit } = useUnit();

  let baseWeightOz = 0;
  let expendablesOz = 0;
  
  const categoryData = CATEGORY_ORDER.map((cat, index) => {
    const items = data[cat] || [];
    const catTotalOz = items
      .filter(i => i.checked)
      .reduce((sum, item) => sum + calcTotalOz(item.weightOz, item.qty), 0);

    // Calculate base vs expendable
    items.filter(i => i.checked).forEach(item => {
      const itemTotal = calcTotalOz(item.weightOz, item.qty);
      if (item.expendable) {
        expendablesOz += itemTotal;
      } else {
        baseWeightOz += itemTotal;
      }
    });

    return {
      name: cat,
      value: catTotalOz,
      // We map chart-1 through chart-10 variables based on index
      fill: `hsl(var(--chart-${(index % 10) + 1}))`
    };
  }).filter(d => d.value > 0); // Only show categories with weight

  const grandTotalOz = baseWeightOz + expendablesOz;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-popover-border p-2 rounded-md shadow-md text-sm">
          <div className="font-semibold text-foreground mb-1">{data.name}</div>
          <div className="font-mono text-muted-foreground">
            {formatWeight(data.value, unit)} {unit}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden sticky top-6">
      <div className="p-4 sm:p-5 border-b border-border bg-muted/20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-foreground text-lg">Pack Summary</h2>
          <button
            onClick={toggleUnit}
            className="text-xs font-semibold uppercase tracking-wide bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
          >
            Show {unit === 'oz' ? 'lbs' : 'oz'}
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <span className="text-sm font-medium text-muted-foreground">Base Weight</span>
            <div className="text-right">
              <div className="font-mono text-2xl font-bold text-foreground tabular-nums leading-none">
                {formatWeight(baseWeightOz, unit)}
                <span className="text-sm text-muted-foreground ml-1 font-sans">{unit}</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-end">
            <span className="text-sm font-medium text-muted-foreground">Expendables</span>
            <div className="text-right">
              <div className="font-mono text-lg font-semibold text-accent-foreground tabular-nums leading-none">
                {formatWeight(expendablesOz, unit)}
                <span className="text-xs text-muted-foreground ml-1 font-sans">{unit}</span>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-border my-2"></div>

          <div className="flex justify-between items-end">
            <span className="text-base font-bold text-foreground">Grand Total</span>
            <div className="text-right">
              <div className="font-mono text-3xl font-black text-primary tabular-nums leading-none">
                {formatWeight(grandTotalOz, unit)}
                <span className="text-base text-muted-foreground ml-1 font-sans">{unit}</span>
              </div>
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
              {categoryData.sort((a, b) => b.value - a.value).map((cat, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: cat.fill }}></div>
                    <span className="text-foreground font-medium truncate w-32">{cat.name}</span>
                  </div>
                  <span className="font-mono text-muted-foreground tabular-nums text-xs">
                    {formatWeight(cat.value, unit)} {unit}
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
