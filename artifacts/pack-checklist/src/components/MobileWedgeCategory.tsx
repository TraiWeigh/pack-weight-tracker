/**
 * MobileWedgeCategory.tsx — 026R
 *
 * Mobile-only elegant wedge category layout.
 * Rendered exclusively at < lg breakpoint (hidden on desktop via lg:hidden wrapper in Checklist.tsx).
 * GearCategory.tsx is completely unchanged — desktop isolation is guaranteed.
 *
 * Features:
 *  - Colored left-wedge strip with category-specific icon (from mobileCategoryTheme)
 *  - Category name (double-tap to rename), packed count, weight summary, chevron
 *  - Accordion (forceOpen/forceOpenSeq mirrors GearCategory behavior)
 *  - Expanded body: vertically stacked MobileItemRow for each item
 *  - Per-item: checkbox, name, type, weight input, qty select, total, move, delete
 *  - Base weight toggle pill
 *  - Add Item button
 *  - Delete category with confirmation
 */
import React, { useState, useEffect } from 'react';
import { GearItem, CategoryMeta } from '../hooks/usePackData';
import {
  calcTotalOz, formatWeight, smallUnit, largeUnit,
  ozToGrams, gramsToOz,
} from '../lib/weightUtils';
import { useUnit } from '../context/UnitContext';
import { ChevronDown, Plus, Trash2, X } from 'lucide-react';
import { getCategoryTheme } from '../lib/mobileCategoryTheme';

// ── QTY options (mirrors GearRow) ────────────────────────────────────────────
const QTY_OPTIONS = Array.from({ length: 20 }, (_, i) => i + 1);

// ── Mobile item row ───────────────────────────────────────────────────────────
interface MobileItemRowProps {
  item: GearItem;
  category: string;
  subLabel?: string;
  descLabel?: string;
  order: string[];
  updateItem: (cat: string, id: string, updates: Partial<GearItem>) => void;
  removeItem: (cat: string, id: string) => void;
  moveItem: (src: string, dst: string, id: string) => void;
}

function MobileItemRow({
  item, category, subLabel, descLabel, order,
  updateItem, removeItem, moveItem,
}: MobileItemRowProps) {
  const { system } = useUnit();
  const su = smallUnit(system);
  const totalOz = calcTotalOz(item.weightOz, item.qty);

  const weightVal = item.weightOz === 0
    ? ''
    : system === 'metric'
      ? parseFloat(ozToGrams(item.weightOz).toFixed(2))
      : item.weightOz;

  const handleWeightChange = (val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      updateItem(category, item.id, { weightOz: system === 'metric' ? gramsToOz(num) : num });
    } else if (val === '') {
      updateItem(category, item.id, { weightOz: 0 });
    }
  };

  const otherCats = order.filter(c => c !== category);
  const canMove = otherCats.length > 0;

  return (
    <div
      className={`px-3 py-2.5 border-b border-border/30 transition-opacity ${
        !item.checked ? 'opacity-55' : ''
      }`}
    >
      {/* Row 1: checkbox · name · type · delete */}
      <div className="flex items-start gap-2">
        {/* Source-selection checkbox */}
        <label className="flex-shrink-0 mt-[3px] cursor-pointer">
          <input
            type="checkbox"
            checked={item.checked}
            onChange={e => updateItem(category, item.id, { checked: e.target.checked })}
            className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
            aria-label={`Include ${item.desc || 'item'} in Checklist`}
          />
        </label>

        {/* Name + sub-type stacked */}
        <div className="flex-1 min-w-0">
          {/* Item name */}
          <input
            type="text"
            value={item.desc}
            onChange={e => updateItem(category, item.id, { desc: e.target.value })}
            placeholder={descLabel ? `${descLabel}…` : 'Item name'}
            className="w-full bg-transparent text-sm font-medium text-foreground
              placeholder:text-muted-foreground/40 focus:outline-none
              focus:ring-1 focus:ring-primary/30 rounded px-1 -ml-1 h-7 truncate
              hover:bg-black/5 transition-colors"
          />
          {/* Sub-type */}
          <input
            type="text"
            value={item.sub}
            onChange={e => updateItem(category, item.id, { sub: e.target.value })}
            placeholder={subLabel || 'Type'}
            className="w-full bg-transparent text-xs text-muted-foreground
              placeholder:text-muted-foreground/30 focus:outline-none
              focus:ring-1 focus:ring-primary/20 rounded px-1 -ml-1 h-6
              hover:bg-black/5 transition-colors"
          />
        </div>

        {/* Delete item */}
        <button
          onClick={() => removeItem(category, item.id)}
          className="flex-shrink-0 p-1.5 rounded-md text-muted-foreground/40
            hover:text-destructive hover:bg-destructive/10 transition-colors
            touch-manipulation mt-0.5"
          title="Remove item"
          aria-label="Remove item"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Row 2: Weight · Qty · Total · Move */}
      <div className="mt-2 ml-6 flex items-center flex-wrap gap-x-4 gap-y-1.5">
        {/* Weight input */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide select-none">
            Wt
          </span>
          <input
            type="number"
            min="0"
            step={system === 'metric' ? '0.1' : '0.01'}
            value={weightVal}
            onChange={e => handleWeightChange(e.target.value)}
            className="w-16 bg-muted/50 rounded px-1.5 py-0.5 text-right font-mono
              text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
            placeholder="0"
            aria-label={`Weight in ${su}`}
          />
          <span className="text-[10px] text-muted-foreground select-none">{su}</span>
        </div>

        {/* Qty */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide select-none">
            Qty
          </span>
          <select
            value={item.qty}
            onChange={e => updateItem(category, item.id, { qty: parseInt(e.target.value) })}
            className="bg-muted/50 rounded px-1.5 py-0.5 text-xs font-mono
              text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30
              cursor-pointer"
            aria-label="Quantity"
          >
            {QTY_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        {/* Total */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-semibold text-muted-foreground select-none">=</span>
          <span className="text-xs font-mono font-medium text-foreground tabular-nums">
            {formatWeight(totalOz, system, 'small')} {su}
          </span>
        </div>

        {/* Move to another category */}
        {canMove && (
          <div className="relative ml-auto">
            <select
              value=""
              aria-label={`Move item — currently in ${category}`}
              onChange={e => { const d = e.target.value; if (d) moveItem(category, d, item.id); }}
              className="bg-muted/40 border border-border/50 rounded px-2 py-0.5
                text-xs text-muted-foreground cursor-pointer appearance-none pr-5
                focus:outline-none focus:ring-1 focus:ring-primary/30"
              title="Move to another category"
            >
              <option value="" disabled>Move…</option>
              {otherCats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Inline-editable category name (double-tap to rename) ─────────────────────
function EditableMobileCategoryName({
  name,
  textColor,
  onRename,
}: {
  name: string;
  textColor: string;
  onRename?: (n: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  useEffect(() => { if (!editing) setDraft(name); }, [name, editing]);

  const commit = () => {
    setEditing(false);
    const t = draft.trim();
    if (t && t !== name) onRename?.(t);
    else setDraft(name);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onClick={e => e.stopPropagation()}
        onKeyDown={e => {
          e.stopPropagation();
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setDraft(name); setEditing(false); }
        }}
        maxLength={40}
        className="bg-white/20 border-b border-white/50 focus:outline-none
          text-sm font-semibold w-full max-w-[180px] px-0.5 leading-tight"
        style={{ color: textColor }}
      />
    );
  }

  return (
    <span
      className="text-sm font-semibold leading-tight truncate max-w-[180px]"
      style={{ color: textColor }}
      onDoubleClick={e => { e.stopPropagation(); if (onRename) setEditing(true); }}
      title={onRename ? 'Double-tap to rename' : undefined}
    >
      {name}
    </span>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export interface MobileWedgeCategoryProps {
  name: string;
  /** Position index in categoryOrder — used for fallback color assignment. */
  categoryIndex: number;
  items: GearItem[];
  meta: CategoryMeta;
  forceOpen?: boolean | null;
  forceOpenSeq?: number;
  order: string[];
  updateItem: (category: string, id: string, updates: Partial<GearItem>) => void;
  removeItem: (category: string, id: string) => void;
  moveItem: (src: string, dst: string, id: string) => void;
  addItem: (category: string) => void;
  onUpdateMeta: (updates: Partial<CategoryMeta>) => void;
  onDelete: () => void;
  onRename?: (newName: string) => void;
  /** Called with the new open/closed state when the header is tapped. */
  onToggle?: (isNowOpen: boolean) => void;
}

export function MobileWedgeCategory({
  name, categoryIndex, items, meta, forceOpen, forceOpenSeq,
  order, updateItem, removeItem, moveItem, addItem,
  onUpdateMeta, onDelete, onRename, onToggle,
}: MobileWedgeCategoryProps) {
  // ── Accordion state — mirrors GearCategory forceOpen/forceOpenSeq logic ──
  const [isOpen, setIsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { system } = useUnit();

  useEffect(() => {
    if (forceOpen !== null && forceOpen !== undefined) setIsOpen(forceOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceOpen, forceOpenSeq]);

  // ── Computed values ──────────────────────────────────────────────────────
  const su = smallUnit(system);
  const lu = largeUnit(system);
  const packedCount = items.filter(i => i.checked).length;
  const categoryTotalOz = items
    .filter(i => i.checked)
    .reduce((s, item) => s + calcTotalOz(item.weightOz, item.qty), 0);
  const displaySmall = formatWeight(categoryTotalOz, system, 'small');
  const displayLarge = formatWeight(categoryTotalOz, system, 'large');

  // ── Category theme ───────────────────────────────────────────────────────
  const { bg, text, Icon } = getCategoryTheme(name, categoryIndex);

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    onToggle?.(next);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        boxShadow: `0 1px 4px ${bg}28, 0 1px 2px rgba(0,0,0,0.08)`,
        border: `1px solid ${bg}22`,
      }}
    >
      {/* ── Wedge header ── */}
      <div className="flex items-stretch" style={{ minHeight: 56 }}>

        {/* Left colored strip — icon lives here */}
        <div
          className="w-14 flex-shrink-0 flex items-center justify-center"
          style={{ backgroundColor: bg }}
          aria-hidden="true"
        >
          <Icon className="w-5 h-5" style={{ color: text }} />
        </div>

        {/* Center — name + stats; tapping opens/closes the accordion */}
        <button
          className="flex-1 flex items-center justify-between px-3 py-2 text-left
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
            touch-manipulation select-none"
          style={{ backgroundColor: `${bg}14` }}
          onClick={handleToggle}
          aria-expanded={isOpen}
          aria-label={`${name} category, ${packedCount} of ${items.length} selected`}
        >
          <div className="flex flex-col gap-0.5 min-w-0 mr-2">
            <EditableMobileCategoryName
              name={name}
              textColor="hsl(var(--foreground))"
              onRename={onRename}
            />
            <span className="text-[11px] text-muted-foreground leading-none">
              {packedCount}/{items.length} selected
            </span>
          </div>

          {/* Weight + chevron */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {categoryTotalOz > 0 && (
              <div className="text-right">
                <div className="text-sm font-mono font-bold tabular-nums leading-none"
                  style={{ color: bg }}>
                  {displaySmall} {su}
                </div>
                <div className="text-[10px] text-muted-foreground tabular-nums leading-none mt-0.5">
                  {displayLarge} {lu}
                </div>
              </div>
            )}
            <ChevronDown
              className="w-4 h-4 text-muted-foreground transition-transform duration-200 flex-shrink-0"
              style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </div>
        </button>

        {/* Right — category delete */}
        <div
          className="flex items-center pr-1 flex-shrink-0"
          style={{ backgroundColor: `${bg}14` }}
        >
          {confirmDelete ? (
            <div className="flex items-center gap-1 px-1">
              <button
                onClick={e => { e.stopPropagation(); onDelete(); setConfirmDelete(false); }}
                className="text-[10px] font-semibold bg-destructive text-destructive-foreground
                  px-1.5 py-1 rounded touch-manipulation"
                aria-label="Confirm delete category"
              >
                Yes
              </button>
              <button
                onClick={e => { e.stopPropagation(); setConfirmDelete(false); }}
                className="text-[10px] font-semibold bg-muted text-muted-foreground
                  px-1.5 py-1 rounded touch-manipulation"
                aria-label="Cancel delete"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); setConfirmDelete(true); }}
              className="p-2.5 text-muted-foreground/40 hover:text-destructive
                hover:bg-destructive/10 rounded-lg transition-colors touch-manipulation"
              title="Delete category"
              aria-label={`Delete ${name} category`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Expanded body ── */}
      {isOpen && (
        <div
          className="bg-card border-t animate-in fade-in slide-in-from-top-1 duration-150"
          style={{ borderColor: `${bg}18` }}
        >
          {/* Base weight pill — compact row above items */}
          <div className="px-3 pt-2 pb-1 flex items-center gap-2">
            <button
              onClick={() => onUpdateMeta({ countsToBase: !meta.countsToBase })}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border
                transition-colors touch-manipulation ${
                  meta.countsToBase
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border bg-muted/40 text-muted-foreground'
                }`}
              title={
                meta.countsToBase
                  ? 'Counts toward base weight — tap to exclude'
                  : 'Not counted in base weight — tap to include'
              }
            >
              {meta.countsToBase ? '+ Base' : '— Base'}
            </button>
          </div>

          {/* Item rows */}
          {items.length === 0 ? (
            <div className="px-3 py-5 text-sm text-muted-foreground text-center">
              No items yet — tap Add Item to begin
            </div>
          ) : (
            items.map(item => (
              <MobileItemRow
                key={item.id}
                item={item}
                category={name}
                subLabel={meta.subLabel}
                descLabel={meta.descLabel}
                order={order}
                updateItem={updateItem}
                removeItem={removeItem}
                moveItem={moveItem}
              />
            ))
          )}

          {/* Add Item */}
          <button
            onClick={() => addItem(name)}
            className="w-full flex items-center gap-2 px-3 py-3 text-sm font-medium
              text-primary hover:bg-primary/5 transition-colors touch-manipulation"
            aria-label={`Add item to ${name}`}
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      )}
    </div>
  );
}
