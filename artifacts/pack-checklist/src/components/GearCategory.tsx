import React, { useState, useEffect, useRef } from 'react';
import { GearItem, CategoryMeta } from '../hooks/usePackData';
import { GearRow } from './GearRow';
import { calcTotalOz, formatWeight, smallUnit, largeUnit } from '../lib/weightUtils';
import { useUnit } from '../context/UnitContext';
import { ChevronDown, ChevronUp, Plus, Trash2, GripVertical } from 'lucide-react';
import { GEAR_GRID_COLS, GEAR_GRID_GAP, RG_MOVE_W, RG_WEIGHT_W, RG_QTY_W, RG_TOTAL_W, RG_DELETE_W } from './gearGrid';
import { useBarStyle, barCombinedStyle, barFgStyle, barFontStyle, barCardStyle, barBasePillStyle } from '../context/BarStyleContext';

interface GearCategoryProps {
  name: string;
  items: GearItem[];
  meta: CategoryMeta;
  forceOpen?: boolean | null;
  forceOpenSeq?: number;
  order: string[];
  updateItem: (category: string, id: string, updates: Partial<GearItem>) => void;
  removeItem: (category: string, id: string) => void;
  moveItem: (sourceCategory: string, destinationCategory: string, itemId: string) => void;
  addItem: (category: string) => void;
  onUpdateMeta: (updates: Partial<CategoryMeta>) => void;
  onDelete: () => void;
  onRename?: (newName: string) => void;
  /** 026K: called with the new open/closed state when the header is clicked manually. */
  onToggle?: (isNowOpen: boolean) => void;
  /** 026N: when true the category is in owner View mode — structural controls are hidden;
   *  accordion, weight display, and checkbox interaction are unaffected. */
  viewMode?: boolean;
  // Drag-to-reorder
  isDragOver?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

// ── Inline-editable column header ────────────────────────────────────────────
function EditableColHeader({
  value,
  placeholder,
  onCommit,
  className = '',
  readOnly = false,
}: {
  value: string;
  placeholder: string;
  onCommit: (v: string) => void;
  className?: string;
  /** 025E: when true the heading is a fixed, non-interactive label — no pencil,
   *  no cursor, no click handler, no rename affordance of any kind. */
  readOnly?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(value); }, [value]);

  // 025E: fixed label — render nothing interactive
  if (readOnly) {
    return (
      <span className={`${className} text-xs font-semibold uppercase tracking-wider text-muted-foreground`}>
        {value || placeholder}
      </span>
    );
  }

  const commit = () => {
    setEditing(false);
    onCommit(draft.trim());
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

// ── Inline-editable category title ───────────────────────────────────────────
function EditableCategoryTitle({
  name,
  onRename,
}: {
  name: string;
  onRename?: (newName: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(name);

  useEffect(() => { if (!editing) setDraft(name); }, [name, editing]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== name) onRename?.(trimmed);
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
        className="text-base sm:text-lg font-semibold bg-transparent border-b-2 border-primary focus:outline-none text-foreground w-full max-w-[220px]"
      />
    );
  }

  return (
    <h2
      className={`text-base sm:text-lg truncate ${onRename ? 'cursor-text select-none' : ''}`}
      title={onRename ? 'Double-click to rename' : undefined}
      onDoubleClick={e => {
        if (!onRename) return;
        e.stopPropagation();
        setEditing(true);
      }}
    >
      {name}
    </h2>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export function GearCategory({
  name, items, meta, forceOpen, forceOpenSeq,
  order, updateItem, removeItem, moveItem, addItem,
  onUpdateMeta, onDelete, onRename, onToggle, viewMode = false,
  isDragOver, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop,
}: GearCategoryProps) {
  // 022G: start collapsed — each category is closed on every fresh open/refresh
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (forceOpen !== null && forceOpen !== undefined) {
      setIsOpen(forceOpen);
    }
  // forceOpenSeq increments on every Open/Close click so this fires even
  // when forceOpen's boolean value hasn't changed (e.g. Close clicked twice).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceOpen, forceOpenSeq]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { system } = useUnit();

  const categoryTotalOz = items
    .filter(i => i.checked)
    .reduce((sum, item) => sum + calcTotalOz(item.weightOz, item.qty), 0);

  const su = smallUnit(system);
  const lu = largeUnit(system);
  const displaySmall = formatWeight(categoryTotalOz, system, 'small');
  const displayLarge = formatWeight(categoryTotalOz, system, 'large');
  const packedCount = items.filter(i => i.checked).length;
  const barStyle = useBarStyle();

  const stopProp = (e: React.MouseEvent) => e.stopPropagation();

  // 023F: font cascades to both the bar header AND the expanded panel body
  const fontWrapStyle = barFontStyle(barStyle);

  // 026N: in view mode, category title is non-editable (pass undefined as onRename)
  const effectiveOnRename = viewMode ? undefined : onRename;

  return (
    <div
      className={`mb-1.5 bg-card border rounded-lg overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md ${
        isDragOver ? 'border-primary shadow-md ring-2 ring-primary/30' : 'border-card-border'
      }`}
      style={{ ...barCardStyle(barStyle), ...fontWrapStyle }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* ── Header ───────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between py-1.5 px-3 sm:py-2 sm:px-4 bg-muted/30 cursor-pointer select-none"
        style={barCombinedStyle(barStyle)}
        onClick={() => { const next = !isOpen; setIsOpen(next); onToggle?.(next); }}
      >
        {/* Left: collapse chevron + name + count badge */}
        <div className="flex items-center gap-2 text-foreground font-semibold min-w-0" style={barFgStyle(barStyle)}>
          {isOpen
            ? <ChevronUp   className="w-5 h-5 text-muted-foreground flex-shrink-0" style={barFgStyle(barStyle)} />
            : <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" style={barFgStyle(barStyle)} />}
          <div onClick={stopProp} className="min-w-0">
            {/* 026N: onRename is undefined in view mode → title is non-editable */}
            <EditableCategoryTitle name={name} onRename={effectiveOnRename} />
          </div>
          {/* 023F: text color cascades from barFgStyle so packed count follows text color */}
          <span className="text-xs font-normal text-muted-foreground bg-black/5 px-2 py-0.5 rounded-full ml-2 flex-shrink-0" style={barFgStyle(barStyle)}>
            {packedCount} / {items.length} packed
          </span>
        </div>

        {/* Right: controls + weight */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-3" onClick={stopProp}>
          {/* ── Category controls ── */}
          {/* 026N: structural controls (drag, +Base, delete) are hidden in view mode */}
          {!viewMode && (
            confirmDelete ? (
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
                {/* Drag handle — 023F: follows text color */}
                <div
                  draggable
                  onDragStart={e => { e.stopPropagation(); onDragStart?.(e); }}
                  onDragEnd={e => { e.stopPropagation(); onDragEnd?.(e); }}
                  title="Drag to reorder"
                  className="p-1 rounded cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors touch-none"
                  style={barFgStyle(barStyle)}
                >
                  <GripVertical className="w-3.5 h-3.5" />
                </div>

                {/* Base weight toggle — 023F: participates in bar color system.
                    023O: uses barBasePillStyle so +Base follows Transparency. */}
                <button
                  title={meta.countsToBase ? 'Counts toward base weight — click to exclude' : 'Not counted in base weight — click to include'}
                  onClick={() => onUpdateMeta({ countsToBase: !meta.countsToBase })}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors hidden sm:inline-flex items-center gap-1 ${
                    meta.countsToBase
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-border bg-muted/40 text-muted-foreground'
                  }`}
                  style={barBasePillStyle(barStyle, meta.countsToBase)}
                >
                  {meta.countsToBase ? '+ Base' : '— Base'}
                </button>

                {/* Delete — 023F: follows text color */}
                <button
                  title="Delete category"
                  onClick={() => setConfirmDelete(true)}
                  className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  style={barFgStyle(barStyle)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          )}

          {/* Weight display — 023F: weight/unit values follow text color */}
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 text-right ml-2 pl-2 border-l border-border/50">
            <div className="flex items-baseline gap-1">
              <span className="font-mono font-bold text-primary tabular-nums" style={barFgStyle(barStyle)}>{displaySmall}</span>
              <span className="text-xs font-medium text-muted-foreground" style={barFgStyle(barStyle)}>{su}</span>
            </div>
            <div className="hidden sm:flex items-baseline gap-1">
              <span className="text-muted-foreground/30" style={barFgStyle(barStyle)}>/</span>
              <span className="font-mono font-medium text-muted-foreground tabular-nums" style={barFgStyle(barStyle)}>{displayLarge}</span>
              <span className="text-[10px] font-medium text-muted-foreground" style={barFgStyle(barStyle)}>{lu}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────── */}
      {isOpen && (
        <div className="p-2 sm:p-4 animate-in fade-in slide-in-from-top-2 duration-200" style={{ backgroundColor: 'hsl(var(--card))' }}>
          <div className={`hidden sm:grid ${GEAR_GRID_COLS} ${GEAR_GRID_GAP} px-2 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 items-center`}>
            {/* Col 1 — checkbox/grip spacer */}
            <div className="w-[30px]" />
            {/* Col 2 — TYPE heading (025E: readOnly — no pencil, no rename) */}
            <EditableColHeader
              value={meta.subLabel ?? ''}
              placeholder="Type"
              onCommit={v => onUpdateMeta({ subLabel: v || undefined })}
              className="w-28"
              readOnly
            />
            {/* Col 3 — NAME heading (025E: readOnly — no pencil, no rename) */}
            <EditableColHeader
              value={meta.descLabel ?? ''}
              placeholder="Name"
              onCommit={v => onUpdateMeta({ descLabel: v || undefined })}
              readOnly
            />
            {/* Col 4 — Right-side group headings, mirroring GearRow right-group exactly */}
            <div className="flex items-center">
              {/* Sub-row A: MOVE · WEIGHT · QTY */}
              <div className="flex items-center gap-3">
                <div className={`${RG_MOVE_W} flex justify-center`}>Move</div>
                <div className={`${RG_WEIGHT_W} text-right`}>Weight</div>
                <div className={`${RG_QTY_W} text-right translate-x-3`}>Qty</div>
              </div>
              {/* 3 px spacer — matches the row's QTY-to-TOTAL gap */}
              <div className="w-[3px] shrink-0" />
              {/* Sub-row B: TOTAL · DELETE */}
              <div className="flex items-center gap-3">
                <div className={`${RG_TOTAL_W} text-right`}>Total</div>
                <div className={`${RG_DELETE_W}`} />
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            {items.map(item => (
              <GearRow
                key={item.id}
                item={item}
                category={name}
                subLabel={meta.subLabel}
                descLabel={meta.descLabel}
                order={order}
                updateItem={updateItem}
                removeItem={removeItem}
                moveItem={moveItem}
                viewMode={viewMode}
              />
            ))}
          </div>

          {/* 026N: Add Item button hidden in view mode */}
          {!viewMode && (
            <button
              onClick={() => addItem(name)}
              className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-foreground hover:bg-primary px-3 py-1.5 rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          )}
        </div>
      )}
    </div>
  );
}
