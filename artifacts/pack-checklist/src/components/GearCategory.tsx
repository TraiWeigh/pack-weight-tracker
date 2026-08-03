import React, { useState, useEffect } from 'react';
import { GearItem, CategoryMeta } from '../hooks/usePackData';
import { GearRow } from './GearRow';
import { calcTotalOz, formatWeight, smallUnit, largeUnit } from '../lib/weightUtils';
import { useUnit } from '../context/UnitContext';
import { ChevronDown, ChevronRight, Plus, ChevronUp, Trash2 } from 'lucide-react';

interface GearCategoryProps {
  name: string;
  items: GearItem[];
  meta: CategoryMeta;
  isFirst: boolean;
  isLast: boolean;
  forceOpen?: boolean | null;
  updateItem: (category: string, id: string, updates: Partial<GearItem>) => void;
  removeItem: (category: string, id: string) => void;
  addItem: (category: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onUpdateMeta: (updates: Partial<CategoryMeta>) => void;
  onDelete: () => void;
}

export function GearCategory({
  name, items, meta, isFirst, isLast, forceOpen,
  updateItem, removeItem, addItem,
  onMoveUp, onMoveDown, onUpdateMeta, onDelete,
}: GearCategoryProps) {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (forceOpen !== null && forceOpen !== undefined) {
      setIsOpen(forceOpen);
    }
  }, [forceOpen]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { system } = useUnit();

  const categoryTotalOz = items
    .filter(i => i.checked)
    .reduce((sum, item) => sum + calcTotalOz(item.weightOz, item.qty), 0);

  const su = smallUnit(system); // oz or g
  const lu = largeUnit(system); // lbs or kg
  const displaySmall = formatWeight(categoryTotalOz, system, 'small');
  const displayLarge = formatWeight(categoryTotalOz, system, 'large');
  const packedCount = items.filter(i => i.checked).length;

  const stopProp = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="mb-6 bg-card border border-card-border rounded-lg overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md">
      {/* ── Header ───────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between p-3 sm:p-4 bg-muted/30 cursor-pointer select-none"
        onClick={() => setIsOpen(o => !o)}
      >
        {/* Left: collapse chevron + name + count badge */}
        <div className="flex items-center gap-2 text-foreground font-semibold min-w-0">
          {isOpen
            ? <ChevronDown  className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            : <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
          <h2 className="text-base sm:text-lg truncate">{name}</h2>
          <span className="text-xs font-normal text-muted-foreground bg-black/5 px-2 py-0.5 rounded-full ml-2 flex-shrink-0">
            {packedCount} / {items.length} packed
          </span>
        </div>

        {/* Right: controls + weight */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-3" onClick={stopProp}>
          {/* ── Category controls ── */}
          {confirmDelete ? (
            <div className="flex items-center gap-1.5 animate-in fade-in duration-100">
              <span className="text-xs text-destructive font-medium hidden sm:inline">Delete?</span>
              <button
                onClick={() => { onDelete(); setConfirmDelete(false); }}
                className="text-[10px] font-semibold bg-destructive text-destructive-foreground px-2 py-1 rounded"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-1 rounded"
              >
                No
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              {/* Move up */}
              <button
                title="Move category up"
                disabled={isFirst}
                onClick={onMoveUp}
                className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              {/* Move down */}
              <button
                title="Move category down"
                disabled={isLast}
                onClick={onMoveDown}
                className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {/* Base weight toggle */}
              <button
                title={meta.countsToBase ? 'Counts toward base weight — click to exclude' : 'Not counted in base weight — click to include'}
                onClick={() => onUpdateMeta({ countsToBase: !meta.countsToBase })}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors hidden sm:inline-flex items-center gap-1 ${
                  meta.countsToBase
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border bg-muted/40 text-muted-foreground'
                }`}
              >
                {meta.countsToBase ? '✓ Base' : '— Base'}
              </button>

              {/* Delete */}
              <button
                title="Delete category"
                onClick={() => setConfirmDelete(true)}
                className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Weight display */}
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 text-right ml-2 pl-2 border-l border-border/50">
            <div className="flex items-baseline gap-1">
              <span className="font-mono font-bold text-primary tabular-nums">{displaySmall}</span>
              <span className="text-xs font-medium text-muted-foreground">{su}</span>
            </div>
            <div className="hidden sm:flex items-baseline gap-1">
              <span className="text-muted-foreground/30">/</span>
              <span className="font-mono font-medium text-muted-foreground tabular-nums">{displayLarge}</span>
              <span className="text-[10px] font-medium text-muted-foreground">{lu}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────── */}
      {isOpen && (
        <div className="p-2 sm:p-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="hidden sm:grid grid-cols-[auto_auto_1fr_80px_70px_80px_auto] gap-4 px-2 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider select-none mb-1">
            <div className="w-[30px]" />
            <div className="w-28">Type</div>
            <div>Description</div>
            <div className="text-right">Weight</div>
            <div className="text-center">Qty</div>
            <div className="text-right">Total</div>
            <div className="w-6" />
          </div>

          <div className="flex flex-col">
            {items.map(item => (
              <GearRow
                key={item.id}
                item={item}
                category={name}
                updateItem={updateItem}
                removeItem={removeItem}
              />
            ))}
          </div>

          <button
            onClick={() => addItem(name)}
            className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-foreground hover:bg-primary px-3 py-1.5 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      )}
    </div>
  );
}
