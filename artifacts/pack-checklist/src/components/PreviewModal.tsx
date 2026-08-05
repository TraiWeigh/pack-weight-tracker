import React from 'react';
import { X } from 'lucide-react';
import { PackState, CategoryMeta } from '../hooks/usePackData';
import { UnitSystem, calcTotalOz, formatWeight, largeUnit, smallUnit } from '../lib/weightUtils';

interface PreviewModalProps {
  data: PackState;
  system: UnitSystem;
  categoryOrder: string[];
  categoryMeta: Record<string, CategoryMeta>;
  onClose: () => void;
}

export function PreviewModal({ data, system, categoryOrder, categoryMeta, onClose }: PreviewModalProps) {
  const lu = largeUnit(system);
  const su = smallUnit(system);

  // Identical total calculation to PrintLayout
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

  const hasCheckedItems = categoryOrder.some(cat => (data[cat] || []).some(i => i.checked));

  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const summaryCells: { label: string; oz: number }[] = [
    { label: 'Base Weight', oz: baseOz },
    ...nonBaseTotals.map(c => ({ label: c.name, oz: c.oz })),
    { label: 'Grand Total', oz: grandOz },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 overflow-y-auto py-8 px-4 screen-only">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-auto">
        {/* Modal toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Pack List Preview</h2>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Close
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-x-auto">
          {!hasCheckedItems ? (
            <p className="text-center text-gray-500 py-10 text-sm">
              No items are checked for preview.
            </p>
          ) : (
            <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", color: '#111', minWidth: 0 }}>

              {/* Header — mirrors print-header */}
              <div style={{ borderBottom: '2px solid #3c5a3c', paddingBottom: 6, marginBottom: 10 }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#2d5a27', margin: '0 0 2px 0', lineHeight: 1.1 }}>
                  TrailWeigh{' '}
                  <span style={{ fontWeight: 400, fontSize: 14, color: '#777', marginLeft: 8 }}>
                    Pack Checklist
                  </span>
                </h1>
                <p style={{ fontSize: 8.5, color: '#999', margin: 0 }}>{date}</p>
              </div>

              {/* Weight summary strip — mirrors print-summary */}
              <div style={{
                display: 'flex', alignItems: 'center', flexWrap: 'wrap',
                background: '#f4f8f4', border: '1px solid #c5d8c5',
                borderRadius: 6, padding: '8px 16px', marginBottom: 14,
              }}>
                {summaryCells.map(({ label, oz }, i) => (
                  <React.Fragment key={label}>
                    {i > 0 && (
                      <div style={{ width: 1, height: 28, background: '#c5d8c5', flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, textAlign: 'center', minWidth: 72 }}>
                      <div style={{
                        fontSize: 7.5, fontWeight: 600, textTransform: 'uppercase',
                        letterSpacing: 0.5, color: '#888', marginBottom: 2,
                      }}>
                        {label}
                      </div>
                      <div style={{
                        fontSize: label === 'Grand Total' ? 15 : 13,
                        fontWeight: 700,
                        color: label === 'Grand Total' ? '#2d5a27' : '#1a1a1a',
                      }}>
                        {formatWeight(oz, system, 'large')} {lu}
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>

              {/* Category blocks — mirrors print-category */}
              {categoryOrder.map(cat => {
                const items = (data[cat] || []).filter(i => i.checked);
                if (items.length === 0) return null;
                return (
                  <div key={cat} style={{ marginBottom: 10 }}>
                    {/* Category header bar */}
                    <div style={{
                      background: '#3c5a3c', color: '#fff',
                      fontSize: 8.5, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: 1.2,
                      padding: '3px 8px',
                    }}>
                      {cat}
                    </div>

                    {/* Column headers */}
                    <div style={{
                      display: 'flex', alignItems: 'center',
                      fontSize: 7, fontWeight: 600, color: '#aaa',
                      textTransform: 'uppercase', letterSpacing: 0.4,
                      padding: '2px 4px', borderBottom: '1px solid #e0e0e0',
                    }}>
                      <span style={{ width: 22, flexShrink: 0 }} />
                      <span style={{ width: 90, flexShrink: 0 }}>
                        {categoryMeta[cat]?.subLabel || 'Type'}
                      </span>
                      <span style={{ flex: 1 }}>
                        {categoryMeta[cat]?.descLabel || 'Description'}
                      </span>
                      <span style={{ width: 64, flexShrink: 0, textAlign: 'right' }}>Weight</span>
                    </div>

                    {/* Item rows */}
                    {items.map((item, idx) => (
                      <div key={item.id} style={{
                        display: 'flex', alignItems: 'center',
                        fontSize: 12, padding: '3px 4px',
                        borderBottom: '1px solid #f0f0f0',
                        background: idx % 2 === 0 ? '#f8fbf8' : undefined,
                      }}>
                        {/* Empty checkbox — same as print-check */}
                        <span style={{ width: 22, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                          <span style={{
                            display: 'inline-block', width: 16, height: 16,
                            border: '2px solid #333', borderRadius: 2, flexShrink: 0,
                          }} />
                        </span>
                        <span style={{ width: 90, flexShrink: 0, fontWeight: 700, color: '#666', fontSize: 11 }}>
                          {item.sub}
                        </span>
                        <span style={{ flex: 1 }}>{item.desc || '—'}</span>
                        <span style={{
                          width: 64, flexShrink: 0, textAlign: 'right',
                          fontWeight: 700, color: '#2d5a27', fontFamily: 'monospace', fontSize: 11,
                        }}>
                          {formatWeight(calcTotalOz(item.weightOz, item.qty), system, 'small')} {su}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })}

              {/* Footer — mirrors print-footer */}
              <div style={{
                marginTop: 18, paddingTop: 5,
                borderTop: '1px solid #e0e0e0',
                fontSize: 7, color: '#bbb', textAlign: 'center',
              }}>
                TrailWeigh Pack Checklist &nbsp;•&nbsp; Printed {date}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
