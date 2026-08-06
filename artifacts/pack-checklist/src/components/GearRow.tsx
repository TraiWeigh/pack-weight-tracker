import React, { memo, useState } from 'react';
import { GearItem } from '../hooks/usePackData';
import { formatWeight, calcTotalOz, smallUnit, largeUnit, ozToGrams, gramsToOz } from '../lib/weightUtils';
import { useUnit } from '../context/UnitContext';
import { X, GripVertical, ChevronDown } from 'lucide-react';
import { GEAR_GRID_COLS, GEAR_GRID_GAP, RG_MOVE_W, RG_WEIGHT_W, RG_QTY_W, RG_TOTAL_W, RG_DELETE_W } from './gearGrid';

interface GearRowProps {
  item: GearItem;
  category: string;
  subLabel?: string;
  descLabel?: string;
  order: string[];
  updateItem: (category: string, id: string, updates: Partial<GearItem>) => void;
  removeItem: (category: string, id: string) => void;
  moveItem: (sourceCategory: string, destinationCategory: string, itemId: string) => void;
}

const QTY_OPTIONS = Array.from({ length: 20 }, (_, i) => i + 1);

export const GearRow = memo(function GearRow({
  item, category, subLabel, descLabel, order,
  updateItem, removeItem, moveItem,
}: GearRowProps) {
  const { system } = useUnit();
  const totalOz = calcTotalOz(item.weightOz, item.qty);
  const su = smallUnit(system);
  const lu = largeUnit(system);

  // Weight input display value — stored as oz, shown in current unit
  const weightInputValue = item.weightOz === 0
    ? ''
    : system === 'metric'
      ? parseFloat(ozToGrams(item.weightOz).toFixed(2))
      : item.weightOz;

  const handleWeightChange = (value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      const oz = system === 'metric' ? gramsToOz(num) : num;
      updateItem(category, item.id, { weightOz: oz });
    } else if (value === '') {
      updateItem(category, item.id, { weightOz: 0 });
    }
  };

  // Move-to dropdown state — reset to placeholder after each selection
  const otherCategories = order.filter(c => c !== category);
  const canMove = otherCategories.length > 0;

  const rowClasses = `group grid ${GEAR_GRID_COLS} ${GEAR_GRID_GAP} py-2 border-b border-border/50 items-center transition-opacity hover:bg-black/5 dark:hover:bg-white/5 px-2 -mx-2 rounded-md ${
    !item.checked ? 'opacity-50 grayscale' : ''
  }`;

  return (
    <div className={rowClasses}>
      {/* Col 1 — Checkbox + grip */}
      <div className="flex items-center gap-1 sm:gap-2">
        <GripVertical className="w-4 h-4 text-muted-foreground/30 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={item.checked}
            onChange={(e) => updateItem(category, item.id, { checked: e.target.checked })}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer accent-primary"
          />
        </label>
      </div>

      {/* Col 2 — Sub-type (editable) */}
      <input
        type="text"
        value={item.sub}
        onChange={(e) => updateItem(category, item.id, { sub: e.target.value })}
        placeholder={subLabel || 'Type'}
        className="text-xs sm:text-sm font-medium text-muted-foreground w-20 sm:w-28 bg-transparent focus:outline-none focus:ring-1 focus:ring-primary/30 rounded px-1 -ml-1 h-7 truncate placeholder:text-muted-foreground/30 transition-colors hover:bg-black/5"
      />

      {/* Col 3 — Description (1fr — receives all width the right group doesn't use) */}
      <input
        type="text"
        value={item.desc}
        onChange={(e) => updateItem(category, item.id, { desc: e.target.value })}
        placeholder={descLabel ? `${descLabel}…` : 'Item description'}
        className="w-full bg-transparent text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 rounded px-1 -ml-1 h-7 truncate placeholder:text-muted-foreground/50 transition-colors hover:bg-black/5"
      />

      {/* Col 4 — Right-side group: MOVE · WEIGHT · QTY [6px] TOTAL · DELETE
          Sub-row A (MOVE/WEIGHT/QTY): gap-3 = 12 px between each.
          Sub-row B (TOTAL/DELETE):    gap-3 = 12 px.
          The 6 px spacer between the two sub-rows is the only reduced gap.       */}
      <div className="flex items-center">
        {/* Sub-row A: MOVE · WEIGHT · QTY */}
        <div className="flex items-center gap-3">
          {/* MOVE — 32 px tap target; ChevronDown always visible; transparent select on top */}
          <div
            className={`${RG_MOVE_W} relative flex items-center justify-center h-7 rounded transition-colors
              ${canMove ? 'hover:bg-primary/10 focus-within:ring-1 focus-within:ring-primary/30' : 'opacity-30'}`}
            title={canMove ? 'Move to another category' : 'No other categories to move to'}
          >
            <ChevronDown
              className={`w-3.5 h-3.5 pointer-events-none ${canMove ? 'text-muted-foreground' : 'text-muted-foreground/40'}`}
            />
            {canMove && (
              <select
                value=""
                aria-label={`Move item — currently in ${category}`}
                onChange={e => {
                  const dest = e.target.value;
                  if (dest) moveItem(category, dest, item.id);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                <option value="" disabled>Move to…</option>
                {otherCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
          </div>

          {/* WEIGHT — 90 px */}
          <div className={`${RG_WEIGHT_W} flex items-center gap-1`}>
            <input
              type="number"
              min="0"
              step={system === 'metric' ? '0.1' : '0.01'}
              value={weightInputValue}
              onChange={(e) => handleWeightChange(e.target.value)}
              className="w-full bg-transparent text-sm text-right font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 rounded px-1 h-7 transition-colors hover:bg-black/5"
              placeholder="0"
            />
            <span className="text-xs text-muted-foreground select-none w-4">{su}</span>
          </div>

          {/* QTY — 56 px (w-14); comfortable for 1–20 with appearance-none center-aligned select */}
          <div className={`${RG_QTY_W} flex items-center`}>
            <select
              value={item.qty}
              onChange={(e) => updateItem(category, item.id, { qty: parseInt(e.target.value) })}
              className="w-full bg-transparent text-sm text-center font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 rounded px-1 h-7 transition-colors hover:bg-black/5 cursor-pointer appearance-none"
            >
              {QTY_OPTIONS.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 6 px gap between QTY and TOTAL (half the standard gap-3 = 12 px) */}
        <div className="w-1.5 shrink-0" />

        {/* Sub-row B: TOTAL · DELETE */}
        <div className="flex items-center gap-3">
          {/* TOTAL — 88 px */}
          <div className={`${RG_TOTAL_W} flex flex-col items-end justify-center`}>
            <span className="text-sm font-mono font-medium text-foreground tabular-nums leading-none">
              {formatWeight(totalOz, system, 'small')} {su}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground tabular-nums leading-tight">
              {formatWeight(totalOz, system, 'large')} {lu}
            </span>
          </div>

          {/* DELETE — 24 px */}
          <div className={RG_DELETE_W}>
            <button
              onClick={() => removeItem(category, item.id)}
              className="text-muted-foreground hover:text-destructive p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-destructive/30"
              title="Remove item"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
