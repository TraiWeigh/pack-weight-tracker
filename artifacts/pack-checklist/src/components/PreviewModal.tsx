import React from 'react';
import { X, Printer, Share2, Eraser } from 'lucide-react';
import { PackState, CategoryMeta, GearItem } from '../hooks/usePackData';
import { UnitSystem, calcTotalOz, formatWeight, largeUnit, smallUnit } from '../lib/weightUtils';

export interface PreviewBodyProps {
  data: PackState;
  system: UnitSystem;
  categoryOrder: string[];
  categoryMeta: Record<string, CategoryMeta>;
  /**
   * Legacy: called when the user toggles an item checkbox. Used by SharedChecklistPage.
   * Kept for backward compatibility; in Checklist modal, use onToggle + checklistUse instead.
   */
  onUpdateItem?: (category: string, id: string, checked: boolean) => void;
  /**
   * When true, only source-selected (item.checked === true) items are shown.
   * Used by the Checklist modal so excluded category items do not appear.
   */
  filterToChecked?: boolean;
  /**
   * Separate checklist-use checkbox state (does NOT touch item.checked).
   * Keys are item IDs; value is whether the item has been ticked in Checklist.
   */
  checklistUse?: Record<string, boolean>;
  /** Called when the user toggles a checklist-use checkbox. */
  onToggle?: (itemId: string) => void;
}

/**
 * Shared rendering body used by both PreviewModal (on-screen Checklist) and
 * SharedPackListContent (standalone shared-link page).
 *
 * Modes:
 *  - Checklist modal:   filterToChecked=true, checklistUse + onToggle provided
 *                       → shows only source-selected items; checklist-use boxes are interactive
 *  - Shared-link page:  no flags                                 → shows all items read-only
 */
export function PreviewBody({
  data, system, categoryOrder, categoryMeta,
  onUpdateItem,
  filterToChecked = false,
  checklistUse,
  onToggle,
}: PreviewBodyProps) {
  const lu = largeUnit(system);
  const su = smallUnit(system);

  // Weight summary always sums source-selected (item.checked) items
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

  // Determine whether any items will be rendered
  const hasAnyItems = filterToChecked
    ? categoryOrder.some(cat => (data[cat] || []).some(i => i.checked))
    : categoryOrder.some(cat => (data[cat] || []).length > 0);

  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const summaryCells: { label: string; oz: number }[] = [
    { label: 'Base Weight', oz: baseOz },
    ...nonBaseTotals.map(c => ({ label: c.name, oz: c.oz })),
    { label: 'Grand Total', oz: grandOz },
  ];

  if (!hasAnyItems) {
    return (
      <p className="text-center text-gray-500 py-10 text-sm">
        {filterToChecked
          ? 'No items selected. Check items in the category list to add them here.'
          : 'No items in this list yet.'}
      </p>
    );
  }

  // Whether we are in checklist-use mode (separate ephemeral tick-boxes)
  const isChecklistUseMode = filterToChecked && checklistUse !== undefined;

  return (
    <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", color: '#111', minWidth: 0 }}>

      {/* Header */}
      <div style={{ borderBottom: '2px solid #3c5a3c', paddingBottom: 6, marginBottom: 10 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#2d5a27', margin: '0 0 2px 0', lineHeight: 1.1 }}>
          TrailWeigh{' '}
          <span style={{ fontWeight: 400, fontSize: 14, color: '#777', marginLeft: 8 }}>
            Pack Checklist
          </span>
        </h1>
        <p style={{ fontSize: 8.5, color: '#999', margin: 0 }}>{date}</p>
      </div>

      {/* Weight summary strip — based on source-selected (item.checked) items */}
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

      {/* Category blocks */}
      {categoryOrder.map(cat => {
        const allItems = data[cat] || [];
        // In checklist-use mode: show only source-selected items
        const items: GearItem[] = filterToChecked
          ? allItems.filter((i: GearItem) => i.checked)
          : allItems;

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
                {categoryMeta[cat]?.descLabel || 'Name'}
              </span>
              <span style={{ width: 64, flexShrink: 0, textAlign: 'right' }}>Weight</span>
            </div>

            {/* Item rows */}
            {items.map((item: GearItem, idx) => {
              // Checklist-use mode: tick state is separate from source selection
              const tickChecked = isChecklistUseMode
                ? (checklistUse![item.id] ?? false)
                : item.checked;

              const handleChange = isChecklistUseMode && onToggle
                ? () => onToggle(item.id)
                : onUpdateItem
                ? () => onUpdateItem(cat, item.id, !item.checked)
                : undefined;

              const isInteractive = !!handleChange;

              return (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center',
                  fontSize: 12, padding: '3px 4px',
                  borderBottom: '1px solid #f0f0f0',
                  background: idx % 2 === 0 ? '#f8fbf8' : undefined,
                  // In legacy mode, dim unchecked items; in checklist-use mode, all shown items are source-selected
                  opacity: filterToChecked ? 1 : (item.checked ? 1 : 0.5),
                }}>
                  {/* Checkbox */}
                  <span style={{ width: 22, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    {isInteractive ? (
                      <input
                        type="checkbox"
                        checked={tickChecked}
                        onChange={handleChange}
                        style={{ width: 14, height: 14, cursor: 'pointer', accentColor: '#2d5a27' }}
                      />
                    ) : (
                      <span style={{
                        display: 'inline-block', width: 16, height: 16,
                        border: '2px solid #333', borderRadius: 2, flexShrink: 0,
                        background: tickChecked ? '#2d5a27' : 'transparent',
                        position: 'relative',
                      }}>
                        {tickChecked && (
                          <span style={{
                            position: 'absolute', inset: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontSize: 11, fontWeight: 900, lineHeight: 1,
                          }}>✓</span>
                        )}
                      </span>
                    )}
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
              );
            })}
          </div>
        );
      })}

      {/* Footer */}
      <div style={{
        marginTop: 18, paddingTop: 5,
        borderTop: '1px solid #e0e0e0',
        fontSize: 7, color: '#bbb', textAlign: 'center',
      }}>
        TrailWeigh Pack Checklist &nbsp;•&nbsp; Printed {date}
      </div>
    </div>
  );
}

interface PreviewModalProps {
  data: PackState;
  system: UnitSystem;
  categoryOrder: string[];
  categoryMeta: Record<string, CategoryMeta>;
  onClose: () => void;
  onPrint: () => void;
  /**
   * Checklist-use checkbox state — separate from source item.checked.
   * Optional: when absent the modal renders in read-only display mode
   * (no interactive checkboxes, no Clear button).
   */
  checklistUse?: Record<string, boolean>;
  /** Called when a checklist-use checkbox is toggled. Optional — see checklistUse. */
  onToggle?: (itemId: string) => void;
  /** Called when Clear is clicked. Optional — Clear button hidden when absent. */
  onClear?: () => void;
  /** When provided, adds "Share Pack List" button in the modal toolbar. */
  onSharePackList?: () => void;
}

export function PreviewModal({
  data, system, categoryOrder, categoryMeta,
  onClose, onPrint,
  checklistUse, onToggle, onClear,
  onSharePackList,
}: PreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 overflow-y-auto py-8 px-4 screen-only">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-auto">
        {/* Modal toolbar: [Share] [Clear] [Print] [Close] */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Checklist</h2>
          <div className="flex items-center gap-2">
            {onSharePackList && (
              <button
                onClick={onSharePackList}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share Pack List
              </button>
            )}
            {onClear && (
              <button
                onClick={onClear}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
                title="Uncheck all checklist boxes"
              >
                <Eraser className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
            <button
              onClick={onPrint}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Close
            </button>
          </div>
        </div>

        {/* Content — only source-selected items appear; checklist-use boxes are interactive */}
        <div className="p-6 overflow-x-auto">
          <PreviewBody
            data={data}
            system={system}
            categoryOrder={categoryOrder}
            categoryMeta={categoryMeta}
            filterToChecked={true}
            checklistUse={checklistUse ?? {}}
            onToggle={onToggle}
          />
        </div>
      </div>
    </div>
  );
}
