import React, { useMemo } from 'react';
import { decodeSharePayload } from '../lib/shareLink';
import { UnitProvider, useUnit } from '../context/UnitContext';
import { calcTotalOz, formatWeight, smallUnit, largeUnit } from '../lib/weightUtils';
import { Tent, Scale, AlertTriangle } from 'lucide-react';

function SharedContent() {
  const { system } = useUnit();

  const payload = useMemo(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return null;
    return decodeSharePayload(hash);
  }, []);

  if (!payload) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center space-y-3 max-w-sm">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
          <h1 className="text-xl font-bold text-foreground">Link not valid</h1>
          <p className="text-muted-foreground text-sm">
            This share link is missing or corrupted. Ask the owner to copy a fresh link.
          </p>
        </div>
      </div>
    );
  }

  const { data, categoryOrder, categoryMeta } = payload;

  const grandTotalOz = categoryOrder.reduce((sum, cat) => {
    const items = data[cat] ?? [];
    return sum + items
      .filter(i => i.checked)
      .reduce((s, i) => s + calcTotalOz(i.weightOz, i.qty), 0);
  }, 0);

  const su = smallUnit(system);
  const lu = largeUnit(system);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-primary/10 p-1.5 rounded-lg text-primary">
              <Tent className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-foreground text-lg leading-tight">TrailWeigh</h1>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Shared Pack List</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 border border-border px-3 py-1.5 rounded-lg">
            <Scale className="w-3.5 h-3.5" />
            View only
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        {/* Grand total banner */}
        <div className="bg-card border border-card-border rounded-xl p-4 flex items-center justify-between shadow-sm">
          <span className="text-sm font-semibold text-muted-foreground">Grand Total</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-primary tabular-nums">
              {formatWeight(grandTotalOz, system, 'large')}
            </span>
            <span className="text-sm font-semibold text-muted-foreground">{lu}</span>
          </div>
        </div>

        {/* Categories */}
        {categoryOrder.map(cat => {
          const items = (data[cat] ?? []).filter(i => i.checked);
          if (items.length === 0) return null;
          const catOz = items.reduce((s, i) => s + calcTotalOz(i.weightOz, i.qty), 0);

          return (
            <div key={cat} className="bg-card border border-card-border rounded-xl overflow-hidden shadow-sm">
              {/* Category header */}
              <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{cat}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {items.length} item{items.length !== 1 ? 's' : ''}
                  </span>
                  {categoryMeta[cat]?.countsToBase === false && (
                    <span className="text-[10px] font-semibold text-muted-foreground border border-border px-1.5 py-0.5 rounded-full">
                      Not base
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono font-bold text-primary tabular-nums text-sm">
                    {formatWeight(catOz, system, 'small')}
                  </span>
                  <span className="text-xs text-muted-foreground">{su}</span>
                  <span className="text-muted-foreground/40 mx-1">/</span>
                  <span className="font-mono text-muted-foreground tabular-nums text-sm">
                    {formatWeight(catOz, system, 'large')}
                  </span>
                  <span className="text-xs text-muted-foreground">{lu}</span>
                </div>
              </div>

              {/* Items */}
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2">Type</th>
                    <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2">Description</th>
                    <th className="text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2">Weight</th>
                    <th className="text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2">Qty</th>
                    <th className="text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => {
                    const totalOz = calcTotalOz(item.weightOz, item.qty);
                    return (
                      <tr key={item.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-2.5 text-foreground font-medium">{item.sub}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{item.desc}</td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums text-foreground">
                          {formatWeight(item.weightOz, system, 'small')} {su}
                        </td>
                        <td className="px-4 py-2.5 text-right text-muted-foreground">{item.qty}</td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                          <div className="font-bold text-foreground">
                            {formatWeight(totalOz, system, 'small')} {su}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {formatWeight(totalOz, system, 'large')} {lu}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}

        <p className="text-center text-xs text-muted-foreground pt-4">
          Shared via <span className="font-semibold">TrailWeigh</span> · View only
        </p>
      </main>
    </div>
  );
}

export default function SharedPackView() {
  return (
    <UnitProvider>
      <SharedContent />
    </UnitProvider>
  );
}
