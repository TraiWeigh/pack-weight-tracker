import React from 'react';
import { PackState, CategoryMeta } from '../hooks/usePackData';
import { UnitSystem, calcTotalOz, formatWeight, largeUnit, smallUnit } from '../lib/weightUtils';

interface PrintLayoutProps {
  data: PackState;
  system: UnitSystem;
  categoryOrder: string[];
  categoryMeta: Record<string, CategoryMeta>;
}

export function PrintLayout({ data, system, categoryOrder, categoryMeta }: PrintLayoutProps) {
  const lu = largeUnit(system);
  const su = smallUnit(system);

  let baseOz = 0;
  const nonBaseTotals: { name: string; oz: number }[] = [];

  categoryOrder.forEach(cat => {
    const items = (data[cat] || []).filter(i => i.checked);
    const catOz = items.reduce((s, item) => s + calcTotalOz(item.weightOz, item.qty), 0);
    const countsToBase = categoryMeta[cat]?.countsToBase ?? true;
    if (countsToBase) {
      baseOz += catOz;
    } else {
      nonBaseTotals.push({ name: cat, oz: catOz });
    }
  });

  const grandOz = baseOz + nonBaseTotals.reduce((s, c) => s + c.oz, 0);

  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const summaryCells: { label: string; oz: number }[] = [
    { label: 'Base Weight', oz: baseOz },
    ...nonBaseTotals.filter(c => c.oz > 0).map(c => ({ label: c.name, oz: c.oz })),
    { label: 'Grand Total', oz: grandOz },
  ];

  return (
    <div className="print-layout">
      {/* Header */}
      <div className="print-header">
        <h1>TrailWeigh <span>Pack Checklist</span></h1>
        <p className="print-date">{date}</p>
      </div>

      {/* Weight Summary */}
      <div className="print-summary">
        {summaryCells.map(({ label, oz }, i) => (
          <React.Fragment key={label}>
            {i > 0 && <div className="print-summary-divider" />}
            <div className="print-summary-cell">
              <div className="print-summary-label">{label}</div>
              <div className={`print-summary-value${label === 'Grand Total' ? ' print-summary-total' : ''}`}>
                {formatWeight(oz, system, 'large')} {lu}
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Category rows */}
      {categoryOrder.map(cat => {
        const items = (data[cat] || []).filter(i => i.checked);
        if (items.length === 0) return null;
        return (
          <div key={cat} className="print-category">
            <div className="print-cat-header">{cat}</div>
            <div className="print-col-headers">
              <span className="pcol-check" />
              <span className="pcol-type">Type</span>
              <span className="pcol-desc">Description</span>
              <span className="pcol-weight">Weight</span>
            </div>
            {items.map((item, idx) => (
              <div key={item.id} className={`print-item${idx % 2 === 0 ? ' print-item-alt' : ''}`}>
                <span className="pcol-check print-check">☑</span>
                <span className="pcol-type print-type">{item.sub}</span>
                <span className="pcol-desc">{item.desc || '—'}</span>
                <span className="pcol-weight print-wt">
                  {formatWeight(calcTotalOz(item.weightOz, item.qty), system, 'small')} {su}
                </span>
              </div>
            ))}
          </div>
        );
      })}

      <div className="print-footer">
        TrailWeigh Pack Checklist &nbsp;•&nbsp; Printed {date}
      </div>
    </div>
  );
}
