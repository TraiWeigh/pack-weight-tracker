/**
 * MasterListScreen.tsx — Master List Phase 2
 *
 * Full-screen gear library: search, filter, sort, group, add/edit/delete+undo.
 * Reads/writes ONLY via masterList.ts IDB API (masterList + masterItemPhotos stores).
 * Zero access to checklist sandbox, locker, bgPhotos, or any PackState data.
 * Photos are lazy-loaded via getMasterItemPhotoBlob(); object-URL cache is revoked
 * on unmount. Location fields are display-only — no location creation/assignment here.
 */

import React, {
  useState, useEffect, useRef, useMemo, useCallback,
} from 'react';
import {
  ChevronLeft, Plus, Search, X, SlidersHorizontal,
  Camera, MapPin, Trash2, Pencil, Check,
  ChevronDown, ChevronUp, ArrowUpDown, Layers, BookOpen,
} from 'lucide-react';
import type { MasterItem } from '../lib/masterList';
import {
  loadMasterItems,
  putMasterItem,
  putMasterItemAndPhoto,
  removeMasterItemPhoto,
  deleteMasterItem,
  undoDeleteMasterItem,
  getMasterItemPhotoBlob,
} from '../lib/masterList';
import { getCategoryTheme } from '../lib/mobileCategoryTheme';
import { formatWeight, smallUnit } from '../lib/weightUtils';
import type { UnitSystem } from '../lib/weightUtils';
import { useUnit } from '../context/UnitContext';

// ─── DESIGN TOKENS — exact match to MobileFunctionalV3 ──────────────────────
const SANS        = "'Inter Variable', 'Inter', system-ui, -apple-system, sans-serif";
const PAGE_BG     = '#F2EDE4';
const CARD_BG     = '#FFFFFF';
const CARD_SHADOW = '0 1px 6px rgba(0,0,0,0.10), 0 0 1px rgba(0,0,0,0.04)';
const CARD_BORDER = 'rgba(0,0,0,0.06)';
const PRIMARY     = '#1A2920';
const SECONDARY   = '#4A5D54';
const MUTED       = '#667270';
const DIVIDER     = 'rgba(0,0,0,0.06)';
const NAV_ACTIVE  = '#2A5740';
const TOAST_BG    = '#2A5740';
const INPUT_BG    = '#F5F0E8';
const ML_OLIVE    = '#6B6B3A';   // Master List brand olive (same as Home wedge)
const HEADER_H    = 52;
const NAV_H       = 58;          // bottom nav bar height — Add bar must clear this
const ADD_BAR_H   = 52;
const SWIPE_W     = 88;          // matches SwipeDeleteRow in MobileFunctionalV3

// ─── UTILITIES ───────────────────────────────────────────────────────────────

/** Compress a device photo to a max-800px JPEG data URL. Device file is never altered. */
function compressPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new window.Image();
      img.onload = () => {
        const MAX = 800;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
          else                { width  = Math.round(width  * MAX / height); height = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('canvas unavailable')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.onerror = () => reject(new Error('image load failed'));
      img.src = ev.target?.result as string;
    };
    reader.onerror = () => reject(new Error('file read failed'));
    reader.readAsDataURL(file);
  });
}

function dataUrlToBlob(dataUrl: string): Blob | null {
  try {
    const [header, ...rest] = dataUrl.split(',');
    const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bin  = atob(rest.join(','));
    const arr  = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  } catch { return null; }
}

function fmtDate(ts: number): string {
  const d   = new Date(ts);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - ts) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)  return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── FILTER / SORT / GROUP TYPES ─────────────────────────────────────────────
type SortKey =
  | 'date-desc' | 'date-asc'
  | 'modified-desc'
  | 'name-asc' | 'name-desc'
  | 'weight-desc' | 'weight-asc'
  | 'cat-asc';

type GroupKey = 'category' | 'location' | 'none';
type TypeFilter  = 'all' | 'gear' | 'consumable';
type PhotoFilter = 'all' | 'has' | 'none';
type LocFilter   = 'all' | 'has' | 'none';
type DateFilter  = 'all' | '7d' | '30d' | '1y';

interface Filters {
  type:     TypeFilter;
  cats:     string[];       // empty = all
  photo:    PhotoFilter;
  loc:      LocFilter;
  date:     DateFilter;
  wMin:     string;
  wMax:     string;
  qMin:     string;
  qMax:     string;
  missing:  Set<'name' | 'weight' | 'category' | 'photo'>;
}

const BLANK_FILTERS: Filters = {
  type: 'all', cats: [], photo: 'all', loc: 'all', date: 'all',
  wMin: '', wMax: '', qMin: '', qMax: '', missing: new Set(),
};

function countActiveFilters(f: Filters): number {
  let n = 0;
  if (f.type !== 'all')  n++;
  if (f.cats.length > 0) n++;
  if (f.photo !== 'all') n++;
  if (f.loc   !== 'all') n++;
  if (f.date  !== 'all') n++;
  if (f.wMin || f.wMax)  n++;
  if (f.qMin || f.qMax)  n++;
  if (f.missing.size > 0) n++;
  return n;
}

// ─── PHOTO THUMBNAIL ─────────────────────────────────────────────────────────

function PhotoThumb({
  photoId, urlCache, onLoaded,
}: {
  photoId: string;
  urlCache: Map<string, string>;
  onLoaded: (photoId: string, url: string) => void;
}) {
  const cached = urlCache.get(photoId);
  useEffect(() => {
    if (cached) return;
    let cancelled = false;
    getMasterItemPhotoBlob(photoId).then(blob => {
      if (!blob || cancelled) return;
      const url = URL.createObjectURL(blob);
      onLoaded(photoId, url);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [photoId, cached, onLoaded]);

  if (!cached) {
    return (
      <div style={{
        width: 38, height: 38, borderRadius: 7, background: INPUT_BG,
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Camera size={16} color={MUTED} strokeWidth={1.6}/>
      </div>
    );
  }
  return (
    <img
      src={cached}
      alt=""
      style={{ width: 38, height: 38, borderRadius: 7, objectFit: 'cover', flexShrink: 0 }}
    />
  );
}

// ─── SWIPE ROW ───────────────────────────────────────────────────────────────

function SwipeRow({
  rowId, openId, onOpenChange, onDelete, onEdit, children,
}: {
  rowId:        string;
  openId:       string | null;
  onOpenChange: (id: string | null) => void;
  onDelete:     () => void;
  onEdit:       () => void;
  children:     React.ReactNode;
}) {
  const open    = openId === rowId;
  const wrapRef = useRef<HTMLDivElement>(null);
  const gRef    = useRef<{ sx: number; sy: number; bx: number; mode: 'idle' | 'h' | 'v'; lx: number } | null>(null);
  const [dragX, setDragX] = useState<number | null>(null);
  const draggedRef = useRef(false);
  const reveal = SWIPE_W * 2; // Edit + Delete

  const onPD = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Closed: must start from right 40%; Open: anywhere closes
    if (!open && e.clientX < rect.right - rect.width * 0.40) return;
    gRef.current = { sx: e.clientX, sy: e.clientY, bx: open ? -reveal : 0, mode: 'idle', lx: e.clientX };
  };

  const onPM = (e: React.PointerEvent) => {
    const g = gRef.current;
    if (!g) return;
    const dx = e.clientX - g.sx, dy = e.clientY - g.sy;
    if (g.mode === 'idle') {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) { g.mode = 'v'; return; }
      g.mode = 'h';
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    if (g.mode !== 'h') return;
    g.lx = e.clientX;
    setDragX(Math.min(0, Math.max(-reveal, g.bx + dx)));
  };

  const end = (commit: boolean) => {
    const g = gRef.current; gRef.current = null;
    if (!g || g.mode !== 'h') { setDragX(null); return; }
    draggedRef.current = true;
    const x = commit ? Math.min(0, Math.max(-reveal, g.bx + (g.lx - g.sx))) : g.bx;
    onOpenChange(x < -reveal / 2 ? rowId : null);
    setDragX(null);
  };

  const restX = open ? -reveal : 0;
  const tx    = dragX ?? restX;

  return (
    <div ref={wrapRef} style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Edit button */}
      <button
        onClick={() => { onOpenChange(null); onEdit(); }}
        aria-label="Edit item"
        tabIndex={open ? 0 : -1}
        aria-hidden={!open}
        style={{
          position: 'absolute', top: 0, bottom: 0, right: SWIPE_W, width: SWIPE_W,
          background: '#2A5740', color: '#fff', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          fontSize: 13.5, fontWeight: 600, fontFamily: SANS, minHeight: 44,
        }}
      >
        <Pencil size={14} strokeWidth={2}/> Edit
      </button>
      {/* Delete button */}
      <button
        onClick={() => { onOpenChange(null); onDelete(); }}
        aria-label="Delete item"
        tabIndex={open ? 0 : -1}
        aria-hidden={!open}
        style={{
          position: 'absolute', top: 0, bottom: 0, right: 0, width: SWIPE_W,
          background: '#B03A2E', color: '#fff', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          fontSize: 13.5, fontWeight: 600, fontFamily: SANS,
        }}
      >
        <Trash2 size={14} strokeWidth={1.9}/> Delete
      </button>
      {/* Row content */}
      <div
        onPointerDown={onPD} onPointerMove={onPM}
        onPointerUp={() => end(true)} onPointerCancel={() => end(false)}
        onClickCapture={e => {
          if (draggedRef.current) { draggedRef.current = false; e.stopPropagation(); e.preventDefault(); return; }
          if (open) { e.stopPropagation(); e.preventDefault(); onOpenChange(null); }
        }}
        style={{
          transform: `translateX(${tx}px)`,
          transition: dragX !== null ? 'none' : 'transform 0.18s ease-out',
          touchAction: 'pan-y', position: 'relative', zIndex: 1,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── ITEM ROW ────────────────────────────────────────────────────────────────

function ItemRow({
  item, system, openId, urlCache, onOpenChange, onEdit, onDelete, onPhotoLoaded,
}: {
  item:          MasterItem;
  system:        UnitSystem;
  openId:        string | null;
  urlCache:      Map<string, string>;
  onOpenChange:  (id: string | null) => void;
  onEdit:        (item: MasterItem) => void;
  onDelete:      (item: MasterItem) => void;
  onPhotoLoaded: (photoId: string, url: string) => void;
}) {
  const weightStr = `${formatWeight(item.weightOz, system)} ${smallUnit(system)}`;

  return (
    <SwipeRow
      rowId={item.id} openId={openId} onOpenChange={onOpenChange}
      onEdit={() => onEdit(item)} onDelete={() => onDelete(item)}
    >
      <button
        onClick={() => onEdit(item)}
        aria-label={`Edit ${item.name || 'item'}`}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          minHeight: 56, padding: '10px 14px', gap: 10,
          background: CARD_BG, border: 'none', cursor: 'pointer',
          borderBottom: `1px solid ${DIVIDER}`, textAlign: 'left',
        }}
      >
        {/* Photo thumbnail or placeholder */}
        {item.photoId ? (
          <PhotoThumb photoId={item.photoId} urlCache={urlCache} onLoaded={onPhotoLoaded}/>
        ) : (
          <div style={{
            width: 38, height: 38, borderRadius: 7, flexShrink: 0,
            background: INPUT_BG, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BookOpen size={15} color={MUTED} strokeWidth={1.6}/>
          </div>
        )}

        {/* Main info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
            <span style={{
              fontSize: 14.5, fontWeight: 500, color: item.name ? PRIMARY : MUTED,
              fontFamily: SANS, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              flex: 1, minWidth: 0,
            }}>
              {item.name || <em>No name</em>}
            </span>
            {item.expendable && (
              <span style={{
                fontSize: 10, fontWeight: 700, color: '#7B5D87',
                background: 'rgba(123,93,135,0.10)', padding: '1px 5px', borderRadius: 4,
                letterSpacing: '0.3px', flexShrink: 0, whiteSpace: 'nowrap',
              }}>CONSUMABLE</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {item.sub && (
              <span style={{ fontSize: 12, color: SECONDARY, fontFamily: SANS }}>{item.sub}</span>
            )}
            {item.category && (
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
                background: getCategoryTheme(item.category, 0).bg + '22',
                color: getCategoryTheme(item.category, 0).bg,
                fontFamily: SANS, whiteSpace: 'nowrap',
              }}>
                {item.category}
              </span>
            )}
            {item.locationId && (
              <MapPin size={11} color={MUTED} strokeWidth={2} aria-label="Has location"/>
            )}
          </div>
        </div>

        {/* Right: weight + qty + date */}
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: PRIMARY, fontFamily: SANS }}>
            {item.weightOz > 0 ? weightStr : <span style={{ color: MUTED }}>—</span>}
          </div>
          {item.qty !== 1 && (
            <div style={{ fontSize: 11.5, color: SECONDARY, fontFamily: SANS }}>×{item.qty}</div>
          )}
          <div style={{ fontSize: 10.5, color: MUTED, marginTop: 2, fontFamily: SANS }}>
            {fmtDate(item.dateAdded)}
          </div>
        </div>
      </button>
    </SwipeRow>
  );
}

// ─── GROUP HEADER ─────────────────────────────────────────────────────────────

function GroupHeader({
  label, count, collapsed, onToggle,
}: {
  label: string; count: number; collapsed: boolean; onToggle: () => void;
}) {
  const theme = getCategoryTheme(label, 0);
  const isLocGroup = label === '📍 Has location' || label === 'No location';

  return (
    <button
      onClick={onToggle}
      aria-expanded={!collapsed}
      aria-label={`${label} group, ${count} items`}
      style={{
        width: '100%', display: 'flex', alignItems: 'stretch',
        border: 'none', padding: 0, cursor: 'pointer', marginTop: 8,
        boxShadow: CARD_SHADOW,
      }}
    >
      {/* Wedge */}
      <div style={{
        width: 72, minHeight: 48, flexShrink: 0,
        background: isLocGroup ? '#4A5D54' : theme.bg,
        clipPath: `polygon(0 0, calc(100% - 17px) 0, 100% 50%, calc(100% - 17px) 100%, 0 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', paddingRight: 8,
      }}>
        {isLocGroup
          ? <MapPin size={18} color="rgba(255,255,255,0.92)" strokeWidth={1.8}/>
          : React.createElement(theme.Icon, { size: 18, color: 'rgba(255,255,255,0.92)', strokeWidth: 1.8 })
        }
      </div>
      {/* Label */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', gap: 8,
        padding: '0 12px', background: CARD_BG, minHeight: 48,
      }}>
        <span style={{ fontSize: 14.5, fontWeight: 600, color: PRIMARY, fontFamily: SANS, flex: 1, textAlign: 'left' }}>
          {label}
        </span>
        <span style={{ fontSize: 12, color: MUTED, fontFamily: SANS }}>{count}</span>
        {collapsed
          ? <ChevronDown size={16} color={MUTED} strokeWidth={2}/>
          : <ChevronUp   size={16} color={MUTED} strokeWidth={2}/>
        }
      </div>
    </button>
  );
}

// ─── BOTTOM SHEET WRAPPER ────────────────────────────────────────────────────

function BottomSheet({
  open, onClose, title, children,
}: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      role="dialog" aria-modal="true" aria-label={title}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        background: 'rgba(0,0,0,0.45)',
      }}
      onClick={onClose}
    >
      {/* R0090: dvh-aware max-height — 88dvh tracks the real visible viewport
          (address bar present/absent, keyboard open/closed) on iOS 15.4+.
          The duplicate rule lets browsers without dvh support fall back to 88vh.
          Safe-area !important overrides the inline padding shorthand bottom so
          content clears the home-indicator when viewport-fit=cover is active. */}
      <style>{`.tw-ms-sheet{max-height:88vh;max-height:88dvh;padding-bottom:calc(40px + env(safe-area-inset-bottom,0px))!important}`}</style>
      <div
        className="tw-ms-sheet"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 500, background: '#fff',
          borderRadius: '18px 18px 0 0', padding: '22px 20px 40px',
          fontFamily: SANS, boxShadow: '0 -4px 32px rgba(0,0,0,0.18)',
          overflowY: 'auto', overscrollBehavior: 'contain',
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, color: PRIMARY, marginBottom: 16 }}>{title}</div>
        {children}
      </div>
    </div>
  );
}

// ─── SORT + GROUP SHEET ───────────────────────────────────────────────────────

function SortGroupSheet({
  open, onClose, sortKey, groupKey, onSort, onGroup,
}: {
  open: boolean; onClose: () => void;
  sortKey: SortKey; groupKey: GroupKey;
  onSort: (s: SortKey) => void; onGroup: (g: GroupKey) => void;
}) {
  const sortOpts: { key: SortKey; label: string }[] = [
    { key: 'date-desc',     label: 'Date Added — newest first' },
    { key: 'date-asc',      label: 'Date Added — oldest first' },
    { key: 'modified-desc', label: 'Recently Modified' },
    { key: 'name-asc',      label: 'Name A → Z' },
    { key: 'name-desc',     label: 'Name Z → A' },
    { key: 'weight-desc',   label: 'Weight — heaviest first' },
    { key: 'weight-asc',    label: 'Weight — lightest first' },
    { key: 'cat-asc',       label: 'Category A → Z' },
  ];
  const groupOpts: { key: GroupKey; label: string }[] = [
    { key: 'category', label: 'By Category' },
    { key: 'location', label: 'By Location status' },
    { key: 'none',     label: 'No grouping (flat list)' },
  ];

  const rowStyle = (active: boolean): React.CSSProperties => ({
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '11px 0', border: 'none', background: 'none', cursor: 'pointer',
    fontSize: 14.5, fontFamily: SANS, color: active ? NAV_ACTIVE : PRIMARY, fontWeight: active ? 600 : 400,
    borderBottom: `1px solid ${DIVIDER}`,
  });

  return (
    <BottomSheet open={open} onClose={onClose} title="Sort & Group">
      <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 6 }}>Sort</p>
      {sortOpts.map(o => (
        <button key={o.key} style={rowStyle(sortKey === o.key)} onClick={() => { onSort(o.key); }}>
          <span>{o.label}</span>
          {sortKey === o.key && <Check size={16} color={NAV_ACTIVE} strokeWidth={2.5}/>}
        </button>
      ))}
      <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 6, marginTop: 16 }}>Group</p>
      {groupOpts.map(o => (
        <button key={o.key} style={rowStyle(groupKey === o.key)} onClick={() => { onGroup(o.key); }}>
          <span>{o.label}</span>
          {groupKey === o.key && <Check size={16} color={NAV_ACTIVE} strokeWidth={2.5}/>}
        </button>
      ))}
    </BottomSheet>
  );
}

// ─── FILTER SHEET ────────────────────────────────────────────────────────────

function FilterSheet({
  open, onClose, filters, allCats, onApply,
}: {
  open: boolean; onClose: () => void;
  filters: Filters; allCats: string[];
  onApply: (f: Filters) => void;
}) {
  const [local, setLocal] = useState<Filters>(filters);
  useEffect(() => { if (open) setLocal(filters); }, [open, filters]);

  const upd = <K extends keyof Filters>(k: K, v: Filters[K]) => setLocal(prev => ({ ...prev, [k]: v }));

  const toggleMissing = (flag: 'name' | 'weight' | 'category' | 'photo') => {
    const next = new Set(local.missing);
    if (next.has(flag)) next.delete(flag); else next.add(flag);
    upd('missing', next);
  };
  const toggleCat = (cat: string) => {
    const next = local.cats.includes(cat)
      ? local.cats.filter(c => c !== cat)
      : [...local.cats, cat];
    upd('cats', next);
  };

  const pill = (label: string, active: boolean, onClick: () => void, color?: string): React.ReactNode => (
    <button
      key={label}
      onClick={onClick}
      style={{
        padding: '6px 12px', borderRadius: 20, border: `1.5px solid ${active ? (color ?? NAV_ACTIVE) : CARD_BORDER}`,
        background: active ? ((color ?? NAV_ACTIVE) + '18') : CARD_BG,
        color: active ? (color ?? NAV_ACTIVE) : SECONDARY,
        fontSize: 13, fontWeight: active ? 600 : 400, fontFamily: SANS, cursor: 'pointer', whiteSpace: 'nowrap',
      }}
    >{label}</button>
  );

  const section = (title: string, children: React.ReactNode) => (
    <div style={{ marginBottom: 18 }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8 }}>{title}</p>
      {children}
    </div>
  );

  return (
    <BottomSheet open={open} onClose={() => { onApply(local); onClose(); }} title="Filter">
      {section('Type',
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {pill('All',        local.type === 'all',         () => upd('type', 'all'))}
          {pill('Gear',       local.type === 'gear',        () => upd('type', 'gear'))}
          {pill('Consumable', local.type === 'consumable',  () => upd('type', 'consumable'), '#7B5D87')}
        </div>
      )}
      {section('Photograph',
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {pill('Any',       local.photo === 'all',  () => upd('photo', 'all'))}
          {pill('Has photo', local.photo === 'has',  () => upd('photo', 'has'))}
          {pill('No photo',  local.photo === 'none', () => upd('photo', 'none'))}
        </div>
      )}
      {section('Location',
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {pill('Any',          local.loc === 'all',  () => upd('loc', 'all'))}
          {pill('Has location', local.loc === 'has',  () => upd('loc', 'has'))}
          {pill('No location',  local.loc === 'none', () => upd('loc', 'none'))}
        </div>
      )}
      {section('Date Added',
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {pill('Any time',    local.date === 'all', () => upd('date', 'all'))}
          {pill('Last 7 days', local.date === '7d',  () => upd('date', '7d'))}
          {pill('Last 30 days',local.date === '30d', () => upd('date', '30d'))}
          {pill('Last year',   local.date === '1y',  () => upd('date', '1y'))}
        </div>
      )}
      {section('Weight (oz)',
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="number" min={0} placeholder="Min" value={local.wMin}
            onChange={e => upd('wMin', e.target.value)}
            style={{ flex: 1, fontSize: 14, padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${CARD_BORDER}`, background: INPUT_BG, fontFamily: SANS, color: PRIMARY }}
          />
          <span style={{ color: MUTED, fontSize: 13 }}>–</span>
          <input type="number" min={0} placeholder="Max" value={local.wMax}
            onChange={e => upd('wMax', e.target.value)}
            style={{ flex: 1, fontSize: 14, padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${CARD_BORDER}`, background: INPUT_BG, fontFamily: SANS, color: PRIMARY }}
          />
        </div>
      )}
      {section('Quantity',
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="number" min={1} max={99} placeholder="Min" value={local.qMin}
            onChange={e => upd('qMin', e.target.value)}
            style={{ flex: 1, fontSize: 14, padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${CARD_BORDER}`, background: INPUT_BG, fontFamily: SANS, color: PRIMARY }}
          />
          <span style={{ color: MUTED, fontSize: 13 }}>–</span>
          <input type="number" min={1} max={99} placeholder="Max" value={local.qMax}
            onChange={e => upd('qMax', e.target.value)}
            style={{ flex: 1, fontSize: 14, padding: '8px 10px', borderRadius: 8, border: `1.5px solid ${CARD_BORDER}`, background: INPUT_BG, fontFamily: SANS, color: PRIMARY }}
          />
        </div>
      )}
      {allCats.length > 0 && section('Category',
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {allCats.map((c, ci) => pill(c, local.cats.includes(c), () => toggleCat(c), getCategoryTheme(c, ci).bg))}
        </div>
      )}
      {section('Missing info (show only items with…)',
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {pill('No name',     local.missing.has('name'),     () => toggleMissing('name'),     '#dc2626')}
          {pill('No weight',   local.missing.has('weight'),   () => toggleMissing('weight'),   '#dc2626')}
          {pill('No category', local.missing.has('category'), () => toggleMissing('category'), '#dc2626')}
          {pill('No photo',    local.missing.has('photo'),    () => toggleMissing('photo'),    '#dc2626')}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          onClick={() => setLocal({ ...BLANK_FILTERS, missing: new Set() })}
          style={{
            flex: 1, padding: '12px 0', borderRadius: 10, background: CARD_BG,
            border: `1px solid ${CARD_BORDER}`, fontSize: 15, fontWeight: 600,
            color: SECONDARY, cursor: 'pointer', minHeight: 44, fontFamily: SANS,
          }}
        >Clear all</button>
        <button
          onClick={() => { onApply(local); onClose(); }}
          style={{
            flex: 2, padding: '12px 0', borderRadius: 10, background: NAV_ACTIVE,
            border: 'none', fontSize: 15, fontWeight: 600,
            color: '#fff', cursor: 'pointer', minHeight: 44, fontFamily: SANS,
          }}
        >Apply filters</button>
      </div>
    </BottomSheet>
  );
}

// ─── ADD / EDIT SHEET ─────────────────────────────────────────────────────────

interface EditDraft {
  name: string; sub: string; category: string;
  weightOz: string; qty: string;
  expendable: boolean; notes: string;
  // photo state
  existingPhotoId: string | undefined;
  newPhotoDataUrl: string | null;  // new compressed data URL (not yet saved)
  removePhoto: boolean;
}

function blankDraft(allCats: string[]): EditDraft {
  return {
    name: '', sub: '', category: allCats[0] ?? '',
    weightOz: '', qty: '1', expendable: false, notes: '',
    existingPhotoId: undefined, newPhotoDataUrl: null, removePhoto: false,
  };
}

function itemToDraft(item: MasterItem): EditDraft {
  return {
    name: item.name, sub: item.sub,
    category: item.category, weightOz: item.weightOz > 0 ? String(item.weightOz) : '',
    qty: String(item.qty), expendable: item.expendable, notes: item.notes ?? '',
    existingPhotoId: item.photoId, newPhotoDataUrl: null, removePhoto: false,
  };
}

function AddEditSheet({
  open, onClose, item, allCats, existingPhotoUrl, system, onSaved,
}: {
  open: boolean; onClose: () => void;
  item: MasterItem | null;      // null = add new
  allCats: string[];
  existingPhotoUrl: string | undefined;
  system: UnitSystem;
  onSaved: (saved: MasterItem) => void;
}) {
  const [draft, setDraft] = useState<EditDraft>(() =>
    item ? itemToDraft(item) : blankDraft(allCats)
  );
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setDraft(item ? itemToDraft(item) : blankDraft(allCats));
      setSaving(false); setSaveErr('');
      setTimeout(() => nameRef.current?.focus(), 80);
    }
  }, [open, item]);  // eslint-disable-line react-hooks/exhaustive-deps

  const upd = <K extends keyof EditDraft>(k: K, v: EditDraft[K]) =>
    setDraft(p => ({ ...p, [k]: v }));

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressPhoto(file);
      upd('newPhotoDataUrl', dataUrl);
      upd('removePhoto', false);
    } catch { /* ignore compression failure */ }
    e.target.value = '';
  };

  const handleSave = async () => {
    const name = draft.name.trim();
    if (!name) { setSaveErr('Name is required'); nameRef.current?.focus(); return; }
    setSaving(true); setSaveErr('');
    try {
      const now  = Date.now();
      const base: Omit<MasterItem, 'id' | 'dateAdded' | 'schemaVersion'> = {
        name,
        sub:        draft.sub.trim().slice(0, 100),
        category:   draft.category.trim().slice(0, 100),
        weightOz:   Math.max(0, parseFloat(draft.weightOz) || 0),
        qty:        Math.max(1, Math.min(99, Math.round(parseInt(draft.qty) || 1))),
        expendable: draft.expendable,
        notes:      draft.notes.slice(0, 5000) || undefined,
        photoId:    item?.photoId,
        locationId: item?.locationId,
        dateModified: now,
      };

      const finalItem: MasterItem = {
        schemaVersion: 1,
        id:        item?.id ?? crypto.randomUUID(),
        dateAdded: item?.dateAdded ?? now,
        ...base,
      };

      let result;
      if (draft.newPhotoDataUrl) {
        // New/replacement photo
        const blob = dataUrlToBlob(draft.newPhotoDataUrl);
        if (blob) {
          const newPhotoId = crypto.randomUUID();
          result = await putMasterItemAndPhoto(
            { ...finalItem, photoId: newPhotoId },
            newPhotoId, blob, 'image/jpeg', 0, 0,
          );
          finalItem.photoId = newPhotoId;
        } else {
          result = await putMasterItem(finalItem);
        }
      } else if (draft.removePhoto && finalItem.photoId) {
        result = await removeMasterItemPhoto(finalItem.id);
        finalItem.photoId = undefined;
      } else {
        result = await putMasterItem(finalItem);
      }

      if (!result.ok) { setSaveErr(result.message ?? 'Save failed'); setSaving(false); return; }
      onSaved(finalItem);
      onClose();
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : 'Save failed');
      setSaving(false);
    }
  };

  const previewUrl = draft.removePhoto ? undefined
    : (draft.newPhotoDataUrl ?? existingPhotoUrl);
  const canSave = draft.name.trim().length > 0 && !saving;

  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 700, color: MUTED, letterSpacing: '0.7px',
    textTransform: 'uppercase', fontFamily: SANS, marginBottom: 5, display: 'block',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', fontSize: 15, color: PRIMARY, fontFamily: SANS, boxSizing: 'border-box',
    border: `1.5px solid ${CARD_BORDER}`, borderRadius: 10, padding: '10px 12px',
    background: INPUT_BG,
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={item ? 'Edit Item' : 'Add to Master List'}>
      {/* Name */}
      <label style={labelStyle}>Name *</label>
      <input
        ref={nameRef} type="text" value={draft.name}
        onChange={e => upd('name', e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
        placeholder="Item name…" aria-label="Item name" maxLength={200}
        style={{ ...inputStyle, marginBottom: 12 }}
      />

      {/* Sub / Description */}
      <label style={labelStyle}>Description / model</label>
      <input
        type="text" value={draft.sub}
        onChange={e => upd('sub', e.target.value)}
        placeholder="e.g. DCF version, size M…" maxLength={100}
        aria-label="Item description" style={{ ...inputStyle, marginBottom: 12 }}
      />

      {/* Category */}
      <label style={labelStyle}>Category</label>
      <input
        type="text" value={draft.category}
        list="ml-cat-list"
        onChange={e => upd('category', e.target.value)}
        placeholder="Shelter, Kitchen, Clothing…" maxLength={100}
        aria-label="Category" style={{ ...inputStyle, marginBottom: 12 }}
      />
      <datalist id="ml-cat-list">
        {allCats.map(c => <option key={c} value={c}/>)}
      </datalist>

      {/* Weight + Qty */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 2 }}>
          <label style={labelStyle}>Weight ({smallUnit(system)})</label>
          <input
            type="number" min={0} step="0.01" value={draft.weightOz}
            onChange={e => upd('weightOz', e.target.value)}
            placeholder="0.00" aria-label="Weight in oz"
            style={{ ...inputStyle, width: '100%' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Qty</label>
          <input
            type="number" min={1} max={99} value={draft.qty}
            onChange={e => upd('qty', e.target.value)}
            aria-label="Quantity" style={{ ...inputStyle, width: '100%' }}
          />
        </div>
      </div>

      {/* Expendable toggle */}
      <button
        onClick={() => upd('expendable', !draft.expendable)}
        aria-pressed={draft.expendable}
        aria-label="Toggle consumable"
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '11px 14px', border: `1.5px solid ${CARD_BORDER}`, borderRadius: 10,
          background: draft.expendable ? 'rgba(123,93,135,0.08)' : CARD_BG,
          cursor: 'pointer', marginBottom: 12, fontFamily: SANS, minHeight: 44,
        }}
      >
        <span style={{ fontSize: 14.5, color: PRIMARY, fontWeight: 500 }}>
          Consumable / expendable
        </span>
        <div style={{
          width: 40, height: 24, borderRadius: 12,
          background: draft.expendable ? '#7B5D87' : CARD_BORDER,
          position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        }}>
          <div style={{
            position: 'absolute', top: 3, left: draft.expendable ? 18 : 3,
            width: 18, height: 18, borderRadius: 9, background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s',
          }}/>
        </div>
      </button>

      {/* Notes */}
      <label style={labelStyle}>Notes</label>
      <textarea
        value={draft.notes}
        onChange={e => upd('notes', e.target.value)}
        placeholder="Any details, links, notes…" maxLength={5000}
        rows={3} aria-label="Notes"
        style={{ ...inputStyle, resize: 'vertical', marginBottom: 12 }}
      />

      {/* Photo */}
      <label style={labelStyle}>Photo</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        {previewUrl ? (
          <img src={previewUrl} alt="Item photo"
            style={{ width: 56, height: 56, borderRadius: 9, objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <div style={{
            width: 56, height: 56, borderRadius: 9, background: INPUT_BG,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Camera size={22} color={MUTED} strokeWidth={1.6}/>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              padding: '8px 14px', borderRadius: 8, border: `1.5px solid ${CARD_BORDER}`,
              background: CARD_BG, fontSize: 13.5, fontWeight: 600, color: PRIMARY,
              cursor: 'pointer', fontFamily: SANS, minHeight: 36, textAlign: 'left',
            }}
          >
            {previewUrl ? 'Change photo' : 'Add photo'}
          </button>
          {previewUrl && (
            <button
              onClick={() => { upd('removePhoto', true); upd('newPhotoDataUrl', null); }}
              style={{
                padding: '8px 14px', borderRadius: 8, border: `1.5px solid rgba(220,38,38,0.25)`,
                background: 'rgba(220,38,38,0.06)', fontSize: 13, fontWeight: 600, color: '#dc2626',
                cursor: 'pointer', fontFamily: SANS, minHeight: 36, textAlign: 'left',
              }}
            >
              Remove photo
            </button>
          )}
        </div>
        <input
          ref={fileRef} type="file" accept="image/*" capture="environment"
          onChange={handleFile}
          style={{ display: 'none' }}
          aria-label="Choose photo"
        />
      </div>

      {saveErr && (
        <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 10, fontFamily: SANS }}>{saveErr}</p>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onClose}
          style={{
            flex: 1, padding: '12px 0', borderRadius: 10, background: CARD_BG,
            border: `1px solid ${CARD_BORDER}`, fontSize: 15, fontWeight: 600,
            color: SECONDARY, cursor: 'pointer', minHeight: 44, fontFamily: SANS,
          }}
        >Cancel</button>
        <button
          onClick={handleSave}
          disabled={!canSave}
          style={{
            flex: 2, padding: '12px 0', borderRadius: 10,
            background: canSave ? NAV_ACTIVE : MUTED,
            border: 'none', fontSize: 15, fontWeight: 600,
            color: '#fff', cursor: canSave ? 'pointer' : 'not-allowed',
            minHeight: 44, fontFamily: SANS,
          }}
        >
          {saving ? 'Saving…' : (item ? 'Save Changes' : 'Add to Library')}
        </button>
      </div>
    </BottomSheet>
  );
}

// ─── UNDO TOAST ───────────────────────────────────────────────────────────────

function UndoToast({ name, onUndo }: { name: string; onUndo: () => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed', bottom: 72, left: '50%', transform: 'translateX(-50%)',
        background: TOAST_BG, color: '#fff', borderRadius: 10, zIndex: 9999,
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px 10px 18px',
        fontSize: 13.5, fontFamily: SANS, fontWeight: 500,
        boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
        whiteSpace: 'nowrap',
      }}
    >
      <span>Deleted "{name.length > 20 ? name.slice(0, 20) + '…' : name}"</span>
      <button
        onClick={onUndo}
        aria-label="Undo delete"
        style={{
          background: 'rgba(255,255,255,0.22)', border: 'none', borderRadius: 7,
          color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
          padding: '4px 12px', fontFamily: SANS, minHeight: 32,
        }}
      >Undo</button>
    </div>
  );
}

// ─── MASTER LIST SCREEN ───────────────────────────────────────────────────────

export interface MasterListScreenProps {
  onBack: () => void;
}

export function MasterListScreen({ onBack }: MasterListScreenProps) {
  const { system } = useUnit();

  // ── Data ──────────────────────────────────────────────────────────────────
  const [items,     setItems]     = useState<MasterItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [loadErr,   setLoadErr]   = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true); setLoadErr('');
    loadMasterItems().then(res => {
      if (!alive) return;
      setItems(res.items);
      setLoading(false);
    }).catch(e => {
      if (!alive) return;
      setLoadErr(e instanceof Error ? e.message : 'Failed to load');
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);

  // ── Photo URL cache ───────────────────────────────────────────────────────
  const [photoUrls, setPhotoUrls] = useState<Map<string, string>>(new Map());
  const photoUrlsRef = useRef<Map<string, string>>(photoUrls);
  photoUrlsRef.current = photoUrls;

  useEffect(() => {
    return () => {
      // Revoke all object URLs on unmount to prevent memory leaks
      for (const url of photoUrlsRef.current.values()) URL.revokeObjectURL(url);
    };
  }, []);

  const handlePhotoLoaded = useCallback((photoId: string, url: string) => {
    setPhotoUrls(prev => {
      if (prev.get(photoId) === url) return prev;
      const next = new Map(prev);
      next.set(photoId, url);
      return next;
    });
  }, []);

  // ── Search / filter / sort / group state ─────────────────────────────────
  const [searchText, setSearchText] = useState('');
  const [sortKey,    setSortKey]     = useState<SortKey>('date-desc');
  const [groupKey,   setGroupKey]    = useState<GroupKey>('category');
  const [filters,    setFilters]     = useState<Filters>({ ...BLANK_FILTERS, missing: new Set() });

  // ── Swipe state ───────────────────────────────────────────────────────────
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);

  // ── Sheet visibility ──────────────────────────────────────────────────────
  const [showSortGroup, setShowSortGroup] = useState(false);
  const [showFilter,    setShowFilter]    = useState(false);
  const [editTarget,    setEditTarget]    = useState<{ item: MasterItem | null; open: boolean }>({ item: null, open: false });

  // ── Undo toast ────────────────────────────────────────────────────────────
  const [undoToast, setUndoToast] = useState<{ id: string; name: string } | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearUndoTimer = () => {
    if (undoTimerRef.current) { clearTimeout(undoTimerRef.current); undoTimerRef.current = null; }
  };

  // ── Collapsed groups ──────────────────────────────────────────────────────
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggleCollapse = (label: string) =>
    setCollapsed(prev => {
      const n = new Set(prev);
      if (n.has(label)) n.delete(label); else n.add(label);
      return n;
    });

  // ── Derived: all unique categories ───────────────────────────────────────
  const allCats = useMemo(() =>
    Array.from(new Set(items.map(i => i.category).filter(Boolean))).sort(),
    [items]
  );

  // ── Filtered + sorted items ───────────────────────────────────────────────
  const processed = useMemo(() => {
    const now = Date.now();
    const cutoffs: Record<string, number> = {
      '7d': now - 7 * 86_400_000,
      '30d': now - 30 * 86_400_000,
      '1y':  now - 365 * 86_400_000,
    };
    const q = searchText.trim().toLowerCase();
    const wMin = parseFloat(filters.wMin);
    const wMax = parseFloat(filters.wMax);
    const qMin = parseInt(filters.qMin);
    const qMax = parseInt(filters.qMax);
    const dateCut = filters.date !== 'all' ? cutoffs[filters.date] : null;

    const filtered = items.filter(item => {
      if (q && !`${item.name} ${item.sub} ${item.category} ${item.notes ?? ''}`.toLowerCase().includes(q)) return false;
      if (filters.type === 'gear'       && item.expendable)  return false;
      if (filters.type === 'consumable' && !item.expendable) return false;
      if (filters.cats.length > 0 && !filters.cats.includes(item.category)) return false;
      if (filters.photo === 'has'  && !item.photoId)    return false;
      if (filters.photo === 'none' && item.photoId)     return false;
      if (filters.loc   === 'has'  && !item.locationId) return false;
      if (filters.loc   === 'none' && item.locationId)  return false;
      if (!isNaN(wMin) && item.weightOz < wMin) return false;
      if (!isNaN(wMax) && item.weightOz > wMax) return false;
      if (!isNaN(qMin) && item.qty < qMin) return false;
      if (!isNaN(qMax) && item.qty > qMax) return false;
      if (dateCut !== null && item.dateAdded < dateCut) return false;
      if (filters.missing.has('name')     && item.name.trim())     return false;
      if (filters.missing.has('weight')   && item.weightOz > 0)    return false;
      if (filters.missing.has('category') && item.category.trim()) return false;
      if (filters.missing.has('photo')    && item.photoId)         return false;
      return true;
    });

    return filtered.sort((a, b) => {
      switch (sortKey) {
        case 'name-asc':      return a.name.localeCompare(b.name);
        case 'name-desc':     return b.name.localeCompare(a.name);
        case 'weight-asc':    return a.weightOz - b.weightOz;
        case 'weight-desc':   return b.weightOz - a.weightOz;
        case 'date-asc':      return a.dateAdded - b.dateAdded;
        case 'date-desc':     return b.dateAdded - a.dateAdded;
        case 'modified-desc': return b.dateModified - a.dateModified;
        case 'cat-asc':       return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
        default:              return 0;
      }
    });
  }, [items, searchText, sortKey, filters]);

  // ── Grouped ───────────────────────────────────────────────────────────────
  const groups = useMemo((): { label: string | null; items: MasterItem[] }[] => {
    if (groupKey === 'none') return [{ label: null, items: processed }];
    if (groupKey === 'location') {
      const withLoc = processed.filter(i => i.locationId);
      const noLoc   = processed.filter(i => !i.locationId);
      const out: { label: string | null; items: MasterItem[] }[] = [];
      if (withLoc.length) out.push({ label: '📍 Has location', items: withLoc });
      if (noLoc.length)   out.push({ label: 'No location',     items: noLoc });
      return out.length ? out : [{ label: null, items: [] }];
    }
    // by category
    const map = new Map<string, MasterItem[]>();
    for (const item of processed) {
      const key = item.category || 'Uncategorised';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
  }, [processed, groupKey]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const handleSaved = useCallback((saved: MasterItem) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === saved.id);
      return idx >= 0
        ? prev.map(i => i.id === saved.id ? saved : i)
        : [saved, ...prev];
    });
  }, []);

  const handleDelete = useCallback((item: MasterItem) => {
    setOpenSwipeId(null);
    // Soft-delete to trash immediately; show Undo toast
    deleteMasterItem(item.id).then(result => {
      if (!result.ok) return;
      setItems(prev => prev.filter(i => i.id !== item.id));
      // Revoke old photo URL if cached
      if (item.photoId) {
        const url = photoUrlsRef.current.get(item.photoId);
        if (url) { URL.revokeObjectURL(url); }
        setPhotoUrls(prev => { const n = new Map(prev); n.delete(item.photoId!); return n; });
      }
      clearUndoTimer();
      setUndoToast({ id: item.id, name: item.name });
      undoTimerRef.current = setTimeout(() => setUndoToast(null), 5000);
    }).catch(() => { /* deletion failed silently */ });
  }, []);

  const handleUndo = useCallback(() => {
    if (!undoToast) return;
    clearUndoTimer();
    const { id } = undoToast;
    setUndoToast(null);
    undoDeleteMasterItem(id).then(result => {
      if (!result.ok) return;
      // Reload from IDB to get the restored item
      loadMasterItems().then(res => setItems(res.items)).catch(() => {});
    }).catch(() => {});
  }, [undoToast]);

  // ── Pill helper ───────────────────────────────────────────────────────────
  const filterCount = countActiveFilters(filters);
  const sortLabels: Record<SortKey, string> = {
    'date-desc': 'Newest', 'date-asc': 'Oldest',
    'modified-desc': 'Modified', 'name-asc': 'A→Z', 'name-desc': 'Z→A',
    'weight-desc': 'Heaviest', 'weight-asc': 'Lightest', 'cat-asc': 'Category',
  };
  const groupLabels: Record<GroupKey, string> = {
    'category': 'By category', 'location': 'By location', 'none': 'No group',
  };

  const pillBtn = (label: string, badge: number | null, icon: React.ReactNode, onClick: () => void, active = false): React.ReactNode => (
    <button
      key={label}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '7px 12px', borderRadius: 20, border: `1.5px solid ${active ? NAV_ACTIVE : CARD_BORDER}`,
        background: active ? 'rgba(42,87,64,0.10)' : CARD_BG,
        color: active ? NAV_ACTIVE : SECONDARY,
        fontSize: 13, fontWeight: active ? 600 : 400, fontFamily: SANS, cursor: 'pointer',
        whiteSpace: 'nowrap', flexShrink: 0, minHeight: 36,
      }}
    >
      {icon}
      {label}
      {badge !== null && badge > 0 && (
        <span style={{
          background: NAV_ACTIVE, color: '#fff', borderRadius: 10,
          fontSize: 10.5, fontWeight: 700, padding: '1px 5px', lineHeight: 1.4,
        }}>{badge}</span>
      )}
    </button>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      data-testid="master-list-screen"
      role="main"
      aria-label="Master List"
      style={{
        position: 'absolute', top: HEADER_H, left: 0, right: 0, bottom: 0,
        zIndex: 35, background: PAGE_BG,
        display: 'flex', flexDirection: 'column', fontFamily: SANS,
        overscrollBehavior: 'contain',
      }}
    >
      {/* ── HEADER ── */}
      <div style={{
        height: HEADER_H, background: '#fff',
        borderBottom: `1px solid rgba(0,0,0,0.07)`,
        display: 'flex', alignItems: 'center',
        padding: '0 4px 0 0', flexShrink: 0, zIndex: 2,
      }}>
        <button
          onClick={onBack}
          aria-label="Back to Home"
          style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', minWidth: 52, minHeight: HEADER_H,
            justifyContent: 'center',
          }}
        >
          <ChevronLeft size={22} color={SECONDARY} strokeWidth={2}/>
        </button>
        <div style={{
          width: 28, height: 28, borderRadius: 7, background: ML_OLIVE,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginRight: 8, flexShrink: 0,
        }}>
          <BookOpen size={15} color="rgba(255,255,255,0.93)" strokeWidth={1.8}/>
        </div>
        <span style={{ flex: 1, fontSize: 17, fontWeight: 700, color: PRIMARY, fontFamily: SANS, letterSpacing: '-0.2px' }}>
          Master List
        </span>
        <span style={{ fontSize: 13, color: MUTED, marginRight: 14, fontFamily: SANS }}>
          {loading ? '…' : `${processed.length}${processed.length !== items.length ? `/${items.length}` : ''}`}
        </span>
      </div>

      {/* ── SEARCH BAR ── */}
      <div style={{
        padding: '10px 12px 6px', background: '#fff', flexShrink: 0,
        borderBottom: `1px solid ${DIVIDER}`,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: INPUT_BG, borderRadius: 12, padding: '0 12px',
          border: `1.5px solid ${CARD_BORDER}`,
        }}>
          <Search size={16} color={MUTED} strokeWidth={2} aria-hidden="true"/>
          <input
            type="search" value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="Search name, description, category…"
            aria-label="Search master list"
            style={{
              flex: 1, border: 'none', background: 'transparent', outline: 'none',
              fontSize: 15, color: PRIMARY, fontFamily: SANS, padding: '9px 0',
            }}
          />
          {searchText && (
            <button
              onClick={() => setSearchText('')}
              aria-label="Clear search"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', minHeight: 36, alignItems: 'center' }}
            >
              <X size={15} color={MUTED} strokeWidth={2}/>
            </button>
          )}
        </div>
      </div>

      {/* ── FILTER / SORT / GROUP PILL ROW ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
        background: '#fff', flexShrink: 0,
        borderBottom: `1px solid ${DIVIDER}`,
        overflowX: 'auto', overscrollBehavior: 'contain',
        scrollbarWidth: 'none',
      }}>
        {pillBtn(
          `Filter`, filterCount > 0 ? filterCount : null,
          <SlidersHorizontal size={14} strokeWidth={2}/>,
          () => setShowFilter(true), filterCount > 0,
        )}
        {pillBtn(
          `Sort: ${sortLabels[sortKey]}`, null,
          <ArrowUpDown size={14} strokeWidth={2}/>,
          () => setShowSortGroup(true),
        )}
        {pillBtn(
          groupLabels[groupKey], null,
          <Layers size={14} strokeWidth={2}/>,
          () => setShowSortGroup(true),
        )}
        {filterCount > 0 && (
          <button
            onClick={() => setFilters({ ...BLANK_FILTERS, missing: new Set() })}
            aria-label="Clear all filters"
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '7px 10px', borderRadius: 20,
              border: `1.5px solid rgba(220,38,38,0.30)`,
              background: 'rgba(220,38,38,0.06)', color: '#dc2626',
              fontSize: 12.5, fontWeight: 600, fontFamily: SANS, cursor: 'pointer',
              whiteSpace: 'nowrap', flexShrink: 0, minHeight: 36,
            }}
          >
            <X size={12} strokeWidth={2.5}/> Clear filters
          </button>
        )}
      </div>

      {/* ── LIST BODY ── */}
      <div
        style={{ flex: 1, overflowY: 'auto', overscrollBehavior: 'contain',
          paddingBottom: `calc(${ADD_BAR_H + NAV_H}px + env(safe-area-inset-bottom, 0px) + 8px)` }}
        onClick={() => { if (openSwipeId) setOpenSwipeId(null); }}
      >
        {loading && (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: MUTED, fontSize: 14 }}>
            Loading…
          </div>
        )}
        {!loading && loadErr && (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#dc2626', fontSize: 14 }}>
            {loadErr}
          </div>
        )}
        {!loading && !loadErr && items.length === 0 && (
          <div style={{ padding: '64px 28px', textAlign: 'center' }}>
            <BookOpen size={40} color={MUTED} strokeWidth={1.2} style={{ marginBottom: 16 }}/>
            <div style={{ fontSize: 17, fontWeight: 600, color: PRIMARY, marginBottom: 8 }}>Your gear library is empty</div>
            <div style={{ fontSize: 14, color: SECONDARY, lineHeight: 1.6 }}>
              Add items to build a permanent catalogue of your gear — weights, photos, and notes in one place.
            </div>
          </div>
        )}
        {!loading && !loadErr && items.length > 0 && processed.length === 0 && (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: MUTED, fontSize: 14 }}>
            No items match your search or filters.
            <br/>
            <button
              onClick={() => { setSearchText(''); setFilters({ ...BLANK_FILTERS, missing: new Set() }); }}
              style={{ marginTop: 12, padding: '8px 16px', borderRadius: 8, background: NAV_ACTIVE, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 600, fontFamily: SANS }}
            >Clear search & filters</button>
          </div>
        )}

        {groups.map(({ label, items: groupItems }) => {
          const isFlat = label === null;
          const isColl = !isFlat && collapsed.has(label!);
          return (
            <div key={label ?? '__flat__'} style={{ paddingBottom: isFlat ? 0 : 4 }}>
              {!isFlat && label !== null && (
                <div style={{ padding: '0 10px' }}>
                  <GroupHeader
                    label={label} count={groupItems.length}
                    collapsed={isColl} onToggle={() => toggleCollapse(label!)}
                  />
                </div>
              )}
              {!isColl && (
                <div style={{
                  margin: isFlat ? '8px 10px 0' : '2px 10px 0',
                  boxShadow: CARD_SHADOW, borderRadius: 6, overflow: 'hidden',
                }}>
                  {groupItems.map(item => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      system={system}
                      openId={openSwipeId}
                      urlCache={photoUrls}
                      onOpenChange={setOpenSwipeId}
                      onEdit={i => setEditTarget({ item: i, open: true })}
                      onDelete={handleDelete}
                      onPhotoLoaded={handlePhotoLoaded}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── ADD BAR (sticky bottom, above the bottom nav bar) ── */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: NAV_H,
        background: '#fff', borderTop: `1px solid ${DIVIDER}`,
        zIndex: 10, flexShrink: 0,
      }}>
        <button
          onClick={() => setEditTarget({ item: null, open: true })}
          aria-label="Add item to Master List"
          data-testid="ml-add-btn"
          style={{
            width: '100%', minHeight: ADD_BAR_H, border: 'none',
            background: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontSize: 14, fontWeight: 600, color: NAV_ACTIVE, fontFamily: SANS,
          }}
        >
          <Plus size={18} color={NAV_ACTIVE} strokeWidth={2.2}/>
          Add to Master List
        </button>
      </div>

      {/* ── SHEETS ── */}
      <SortGroupSheet
        open={showSortGroup} onClose={() => setShowSortGroup(false)}
        sortKey={sortKey} groupKey={groupKey}
        onSort={setSortKey} onGroup={setGroupKey}
      />
      <FilterSheet
        open={showFilter} onClose={() => setShowFilter(false)}
        filters={filters} allCats={allCats}
        onApply={setFilters}
      />
      <AddEditSheet
        open={editTarget.open}
        onClose={() => setEditTarget(p => ({ ...p, open: false }))}
        item={editTarget.item}
        allCats={allCats}
        existingPhotoUrl={
          editTarget.item?.photoId ? photoUrls.get(editTarget.item.photoId) : undefined
        }
        system={system}
        onSaved={handleSaved}
      />

      {/* ── UNDO TOAST ── */}
      {undoToast && <UndoToast name={undoToast.name} onUndo={handleUndo}/>}
    </div>
  );
}
