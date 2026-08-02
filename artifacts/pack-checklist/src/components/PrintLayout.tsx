import React from 'react';
import { PackState, CATEGORY_ORDER } from '../hooks/usePackData';
import { UnitSystem, calcTotalOz, formatWeight, largeUnit, smallUnit } from '../lib/weightUtils';

interface PrintLayoutProps {
  data: PackState;
  system: UnitSystem;
}

export function PrintLayout({ data, system }: PrintLayoutProps) {
  const lu = largeUnit(system);
  const su = smallUnit(system);

  let baseOz = 0, dogOz = 0, wornOz = 0, expOz = 0;
  CATEGORY_ORDER.forEach(cat => {
    (data[cat] || []).filter(i => i.checked).forEach(item => {
      const oz = calcTotalOz(item.weightOz, item.qty);
      if (cat === 'Dog Pack')         dogOz  += oz;
      else if (cat === 'Clothing Worn') wornOz += oz;
      else if (cat === 'Expendables' || item.expendable) expOz += oz;
      else                             baseOz += oz;
    });
  });
  const grandOz = baseOz + dogOz + wornOz + expOz;

  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  // Build summary cells dynamically — Dog Pack and Expendables only if non-zero
  const summaryCells: { label: string; oz: number }[] = [
    { label: 'Base Weight', oz: baseOz },
    { label: 'Clothing Worn', oz: wornOz },
    ...(dogOz > 0 ? [{ label: 'Dog Pack', oz: dogOz }] : []),
    ...(expOz > 0 ? [{ label: 'Expendables', oz: expOz }] : []),
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

      {/* Category rows — Dog Pack only appears if items are checked */}
      {CATEGORY_ORDER.map(cat => {
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
