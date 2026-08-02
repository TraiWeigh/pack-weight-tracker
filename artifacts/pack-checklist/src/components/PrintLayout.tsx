import React from 'react';
import { PackState, CATEGORY_ORDER } from '../hooks/usePackData';
import { UnitSystem, calcTotalOz, formatWeight, largeUnit, smallUnit } from '../lib/weightUtils';

const DOG_PACK = 'Dog Pack';

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
      if (cat === DOG_PACK)            dogOz  += oz;
      else if (cat === 'Clothing Worn') wornOz += oz;
      else if (item.expendable)        expOz  += oz;
      else                             baseOz += oz;
    });
  });
  const grandOz = baseOz + dogOz + wornOz + expOz;

  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="print-layout">
      {/* Header */}
      <div className="print-header">
        <h1>TrailWeigh <span>Pack Checklist</span></h1>
        <p className="print-date">{date}</p>
      </div>

      {/* Weight Summary */}
      <div className="print-summary">
        <div className="print-summary-cell">
          <div className="print-summary-label">Base Weight</div>
          <div className="print-summary-value">{formatWeight(baseOz, system, 'large')} {lu}</div>
        </div>
        <div className="print-summary-divider" />
        <div className="print-summary-cell">
          <div className="print-summary-label">Clothing Worn</div>
          <div className="print-summary-value">{formatWeight(wornOz, system, 'large')} {lu}</div>
        </div>
        <div className="print-summary-divider" />
        <div className="print-summary-cell">
          <div className="print-summary-label">Dog Pack</div>
          <div className="print-summary-value">{formatWeight(dogOz, system, 'large')} {lu}</div>
        </div>
        <div className="print-summary-divider" />
        <div className="print-summary-cell">
          <div className="print-summary-label">Grand Total</div>
          <div className="print-summary-value print-summary-total">{formatWeight(grandOz, system, 'large')} {lu}</div>
        </div>
      </div>

      {/* Category rows */}
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
