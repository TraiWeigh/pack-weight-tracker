/**
 * MobileWedgeCategory.tsx — 026S (repairs 026R defects)
 *
 * Mobile-only elegant wedge category layout.
 * Rendered exclusively at < lg breakpoint (hidden on desktop via lg:hidden wrapper in Checklist.tsx).
 * GearCategory.tsx and GearRow.tsx are completely unchanged — desktop isolation is guaranteed.
 *
 * 026S repairs:
 *  A. Real angled wedge: clip-path polygon on left strip (not a plain rectangle)
 *  B. Vertical item details: Weight / Qty / Total / Move each on its own labeled row
 *  C. Touch-accessible rename: always-visible Pencil icon button next to category name
 *  D. KIS: no KIS state exists in codebase — gap documented; not implemented
 */
import React, { useState, useEffect } from 'react';
import { GearItem, CategoryMeta } from '../hooks/usePackData';
import {
  calcTotalOz, formatWeight, smallUnit, largeUnit,
  ozToGrams, gramsToOz,
} from '../lib/weightUtils';
import { useUnit } from '../context/UnitContext';
import { ChevronDown, Plus, Trash2, X, Pencil } from 'lucide-react';
import { getCategoryTheme } from '../lib/mobileCategoryTheme';

// ── QTY options (mirrors GearRow) ────────────────────────────────────────────
const QTY_OPTIONS = Array.from({ length: 20 }, (_, i) => i + 1);

// ── Inline-editable category name with visible touch-accessible rename button ─
function EditableMobileCategoryName({
  name,
  onRename,
}: {
  name: string;
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

  const startEditing = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    if (onRename) setEditing(true);
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
        className="bg-black/10 border-b border-foreground/40 focus:outline-none
          text-sm font-semibold text-foreground w-full max-w-[180px] px-0.5 leading-tight rounded-sm"
      />
    );
  }

  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span
        className="text-sm font-semibold leading-tight truncate"
        onDoubleClick={startEditing}
      >
        {name}
      </span>
      {/* Touch-accessible rename affordance (026S C): always-visible, tappable, keyboard-reachable */}
      {onRename && (
        <button
          type="button"
          onClick={startEditing}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              startEditing(e);
            }
          }}
          className="flex-shrink-0 p-0.5 rounded text-muted-foreground/40
            hover:text-primary focus:text-primary focus-visible:ring-2
            focus-visible:ring-primary/40 touch-manipulation transition-colors"
          title="Rename category"
          aria-label="Rename category"
        >
          <Pencil className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ── Mobile item row — vertically stacked detail rows (026S B) ─────────────────
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

  /** Shared label style for the detail-row left column. */
  const labelCls = 'text-[10px] font-semibold text-muted-foreground uppercase tracking-wide w-14 flex-shrink-0 select-none leading-none';

  return (
    <div
      className={`px-3 py-2.5 border-b border-border/30 transition-opacity ${
        !item.checked ? 'opacity-55' : ''
      }`}
    >
      {/* Row 1: checkbox · name · sub-type · delete */}
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

        {/* Delete item — always visible on mobile */}
        <button
          type="button"
          onClick={() => removeItem(category, item.id)}
          className="flex-shrink-0 p-1.5 rounded-md text-muted-foreground/40
            hover:text-destructive hover:bg-destructive/10 transition-colors
            touch-manipulation mt-0.5 focus-visible:ring-2 focus-visible:ring-destructive/40"
          title="Remove item"
          aria-label="Remove item"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── 026S B: Vertical detail rows — Weight / Qty / Total / Move ── */}
      <div className="mt-2 ml-6 flex flex-col space-y-1.5">

        {/* Weight */}
        <div className="flex items-center gap-2">
          <span className={labelCls}>Weight</span>
          <input
            type="number"
            min="0"
            step={system === 'metric' ? '0.1' : '0.01'}
            value={weightVal}
            onChange={e => handleWeightChange(e.target.value)}
            className="w-20 bg-muted/50 rounded px-2 py-1 text-right font-mono
              text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
            placeholder="0"
            aria-label={`Weight in ${su}`}
          />
          <span className="text-[10px] text-muted-foreground select-none">{su}</span>
        </div>

        {/* Quantity */}
        <div className="flex items-center gap-2">
          <span className={labelCls}>Qty</span>
          <select
            value={item.qty}
            onChange={e => updateItem(category, item.id, { qty: parseInt(e.target.value) })}
            className="bg-muted/50 rounded px-2 py-1 text-xs font-mono
              text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30
              cursor-pointer"
            aria-label="Quantity"
          >
            {QTY_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        {/* Total */}
        <div className="flex items-center gap-2">
          <span className={labelCls}>Total</span>
          <span className="text-xs font-mono font-medium text-foreground tabular-nums">
            {formatWeight(totalOz, system, 'small')} {su}
          </span>
        </div>

        {/* Move to another category */}
        {canMove && (
          <div className="flex items-center gap-2">
            <span className={labelCls}>Move to</span>
            <div className="relative flex-1">
              <select
                value=""
                aria-label={`Move item — currently in ${category}`}
                onChange={e => { const d = e.target.value; if (d) moveItem(category, d, item.id); }}
                className="w-full bg-muted/40 border border-border/50 rounded px-2 py-1
                  text-xs text-muted-foreground cursor-pointer appearance-none pr-6
                  focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                <option value="" disabled>Choose…</option>
                {otherCats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        )}

      </div>
    </div>
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
  onToggle?: (isNowOpen: boolean) => void;
}

export function MobileWedgeCategory({
  name, categoryIndex, items, meta, forceOpen, forceOpenSeq,
  order, updateItem, removeItem, moveItem, addItem,
  onUpdateMeta, onDelete, onRename, onToggle,
}: MobileWedgeCategoryProps) {
  // Accordion state — mirrors GearCategory forceOpen/forceOpenSeq logic
  const [isOpen, setIsOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { system } = useUnit();

  useEffect(() => {
    if (forceOpen !== null && forceOpen !== undefined) setIsOpen(forceOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceOpen, forceOpenSeq]);

  const su = smallUnit(system);
  const lu = largeUnit(system);
  const packedCount = items.filter(i => i.checked).length;
  const categoryTotalOz = items
    .filter(i => i.checked)
    .reduce((s, item) => s + calcTotalOz(item.weightOz, item.qty), 0);
  const displaySmall = formatWeight(categoryTotalOz, system, 'small');
  const displayLarge = formatWeight(categoryTotalOz, system, 'large');

  const { bg, text, Icon } = getCategoryTheme(name, categoryIndex);

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    onToggle?.(next);
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        boxShadow: `0 1px 4px ${bg}28, 0 1px 2px rgba(0,0,0,0.08)`,
        border: `1px solid ${bg}22`,
      }}
    >
      {/* ── Wedge header ─────────────────────────────────────────────────── */}
      {/*
        026S A: The header flex container gets the light-tint background.
        This means the clipped corners of the wedge div (top-right / bottom-right)
        reveal the same ${bg}14 tint that the button area shows — giving a
        seamless color transition from the wedge point into the lighter header.
      */}
      <div
        className="flex items-stretch"
        style={{ minHeight: 56, backgroundColor: `${bg}14` }}
      >
        {/* ── 026S A: Real angled wedge — clip-path polygon ── */}
        {/*
          polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%)
          creates a right-pointing pentagon:
            top-left → top-right-minus-14px → midpoint-right-edge → bottom-right-minus-14px → bottom-left
          The angled cut spans 14 px horizontally across the full element height,
          producing a visible slant at the right edge of the colored strip.
        */}
        <div
          className="w-16 flex-shrink-0 flex items-center justify-center"
          style={{
            backgroundColor: bg,
            clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%)',
          }}
          aria-hidden="true"
        >
          <Icon className="w-5 h-5" style={{ color: text }} />
        </div>

        {/* Center: category name + stats — tapping toggles accordion.
            NOTE: uses div[role=button] (not <button>) so the Pencil rename
            button inside EditableMobileCategoryName is not nested inside a
            <button>, which is invalid HTML. */}
        <div
          role="button"
          tabIndex={0}
          className="flex-1 flex items-center justify-between px-3 py-2
            cursor-pointer focus:outline-none focus-visible:ring-2
            focus-visible:ring-primary/40 touch-manipulation select-none"
          onClick={handleToggle}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleToggle();
            }
          }}
          aria-expanded={isOpen}
          aria-label={`${name} category, ${packedCount} of ${items.length} selected`}
        >
          <div className="flex flex-col gap-0.5 min-w-0 mr-2">
            <EditableMobileCategoryName name={name} onRename={onRename} />
            <span className="text-[11px] text-muted-foreground leading-none">
              {packedCount}/{items.length} selected
            </span>
          </div>

          {/* Weight summary + chevron */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {categoryTotalOz > 0 && (
              <div className="text-right">
                <div
                  className="text-sm font-mono font-bold tabular-nums leading-none"
                  style={{ color: bg }}
                >
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
        </div>

        {/* Right: delete category (two-step confirm IS the touch-accessible disclosure) */}
        <div className="flex items-center pr-1 flex-shrink-0">
          {confirmDelete ? (
            <div className="flex items-center gap-1 px-1">
              <button
                type="button"
                onClick={e => { e.stopPropagation(); onDelete(); setConfirmDelete(false); }}
                className="text-[10px] font-semibold bg-destructive text-destructive-foreground
                  px-1.5 py-1 rounded touch-manipulation"
                aria-label="Confirm delete category"
              >
                Yes
              </button>
              <button
                type="button"
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
              type="button"
              onClick={e => { e.stopPropagation(); setConfirmDelete(true); }}
              className="p-2.5 text-muted-foreground/40 hover:text-destructive
                hover:bg-destructive/10 rounded-lg transition-colors touch-manipulation
                focus-visible:ring-2 focus-visible:ring-destructive/40"
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
          {/* Base weight pill */}
          <div className="px-3 pt-2 pb-1">
            <button
              type="button"
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
            type="button"
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
