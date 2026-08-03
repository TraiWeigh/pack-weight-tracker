import React, { useState, useEffect, useRef } from 'react';
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

// ── Inline-editable column header ────────────────────────────────────────────
function EditableColHeader({
  value,
  placeholder,
  onCommit,
  className = '',
}: {
  value: string;
  placeholder: string;
  onCommit: (v: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // keep draft in sync if parent changes (e.g. reset)
  useEffect(() => { setDraft(value); }, [value]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    onCommit(trimmed);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
        className={`${className} bg-transparent border-b border-primary/50 focus:outline-none text-xs font-semibold uppercase tracking-wider text-primary w-full`}
        placeholder={placeholder}
      />
    );
  }

  return (
    <div
      className={`${className} group/hdr flex items-center gap-1 cursor-pointer`}
      title="Click to rename column"
      onClick={() => setEditing(true)}
    >
      <span>{value || placeholder}</span>
      <svg
        className="w-3 h-3 opacity-0 group-hover/hdr:opacity-60 transition-opacity flex-shrink-0"
        viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"
      >
        <path d="M11 2.5 13.5 5 5.5 13H3v-2.5L11 2.5Z" />
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
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
                {meta.countsToBase ? '+ Base' : '— Base'}
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
          <div className="hidden sm:grid grid-cols-[auto_auto_1fr_80px_70px_80px_auto] gap-4 px-2 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            <div className="w-[30px]" />
            {/* Editable "Type" column header */}
            <EditableColHeader
              value={meta.subLabel ?? ''}
              placeholder="Type"
              onCommit={v => onUpdateMeta({ subLabel: v || undefined })}
              className="w-28"
            />
            {/* Editable "Description" column header */}
            <EditableColHeader
              value={meta.descLabel ?? ''}
              placeholder="Description"
              onCommit={v => onUpdateMeta({ descLabel: v || undefined })}
            />
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
                subLabel={meta.subLabel}
                descLabel={meta.descLabel}
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
