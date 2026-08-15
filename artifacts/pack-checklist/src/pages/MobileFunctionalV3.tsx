/**
 * MobileFunctionalV3.tsx — 027Q
 * Full-screen mobile navigation repair at /mobile-functional-v3.
 *
 * SANDBOX ISOLATION:
 *   Reads production localStorage ONCE on mount → clones into local React state.
 *   ALL mutations apply to sandbox state only — no writes to owner's active
 *   production store key (`pack-checklist-v5-*`).
 *   Exception: Save creates a NEW Locker entry (additive only — does NOT
 *   overwrite the owner's active production data).
 *
 * 027O WIRING SUMMARY:
 *   Real + wired  : hamburger menu, unit toggle, undo/redo, reset, save (new
 *                   locker entry), print (PDF via jsPDF), share (PDF download),
 *                   checklist overlay (PreviewBody, separate checklistUse),
 *                   category accordion (icon tap), category reorder (Pointer
 *                   Events on handle), item checkbox (inclusion), weight input,
 *                   quantity select, total (derived), move (category swap),
 *                   add item, add category, scanner/import (ImportGearPanel),
 *                   locker browse + load-into-sandbox, summary overlay
 *                   (WeightSummary + WeightDistribution), expand/collapse all.
 *   Pending/future: guided Create New List flow, global search, Catalog tab,
 *                   item photo row backend, Dark V3 design.
 *
 * PRODUCTION SAFETY: /checklist, desktop layout, API, DB, auth — all untouched.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@clerk/react';
import {
  Menu, Search, Plus, Check, GripVertical, MoreHorizontal,
  Backpack, Folder, Grid3X3, BarChart2,
  Hash, PackageOpen, ArrowRightLeft, Luggage, Camera,
  Save, Undo2, Redo2, RotateCcw, Share2, Printer,
  Tent, HelpCircle, X, ChevronLeft, ChevronRight, Layers,
  Scale, Coins, LayoutList, AlertCircle, Trash2, Copy, Link2,
  BookOpen, Info, Pencil, Mail, Tag, FileText, Shield,
} from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose,
} from '../components/ui/sheet';
import { SourcesContent } from '../components/SourcesModal';
import { AboutContent } from './info/AboutPage';
import { HelpContent } from './info/HelpPage';
import { HowItWorksContent } from './info/HowItWorksPage';
import { BarStyleProvider } from '../context/BarStyleContext';
import { WeightSummary, WeightDistribution } from '../components/WeightSummary';
import { PreviewBody } from '../components/PreviewModal';
import { ImportGearPanel } from '../components/ImportGearPanel';
import { generatePackPDF } from '../lib/exportPDF';
import { buildShareURL } from '../lib/shareLink';
import type { SharePayload } from '../lib/shareLink';
import { resolveDestination } from '../lib/categoryAliases';
import type { GearItem, CategoryMeta } from '../hooks/usePackData';
import { LOCKER_KEY } from '../hooks/usePackData';
import type { LockerEntry } from '../components/LockerPanel';
import { getCategoryTheme } from '../lib/mobileCategoryTheme';
import { calcTotalOz, formatWeight, smallUnit, gramsToOz } from '../lib/weightUtils';
import { useUnit, UnitProvider } from '../context/UnitContext';

// ─── TYPES ─────────────────────────────────────────────────────────────────────
type PackState = { [category: string]: GearItem[] };
type SandboxStore = { items: PackState; order: string[]; meta: Record<string, CategoryMeta> };
type ActiveNav = 'list' | 'locker' | 'catalog' | 'summary';

// ─── MOBILE NAVIGATION TYPES (027Q) ────────────────────────────────────────────
type MobileScreen = 'list' | 'menu' | 'footer' | 'footer-page' | 'share' | 'sources';
type FooterPageId =
  | 'about' | 'how-it-works' | 'sources' | 'help'
  | 'report-problem' | 'contact' | 'privacy' | 'terms'
  | 'delete-account' | 'affiliate' | 'accessibility';
interface ScreenEntry { screen: MobileScreen; footerPageId?: FooterPageId; }

const HISTORY_LIMIT = 30;

// ─── DEMO SEED ──────────────────────────────────────────────────────────────────
const DEMO_SEED: SandboxStore = {
  order: ['Backpack', 'Clothing', 'Toiletries', 'Electronics', 'Shelter', 'Kitchen'],
  meta: {
    Backpack:    { countsToBase: true },
    Clothing:    { countsToBase: true },
    Toiletries:  { countsToBase: false },
    Electronics: { countsToBase: false },
    Shelter:     { countsToBase: true },
    Kitchen:     { countsToBase: true },
  },
  items: {
    Backpack: [
      { id: 'b1', sub: 'Backpack', desc: 'Osprey Atmos 65',       weightOz: 68.0,  qty: 1, checked: true,  expendable: false },
      { id: 'b2', sub: 'Backpack', desc: 'Pack Rain Cover',        weightOz: 4.5,   qty: 1, checked: true,  expendable: false },
      { id: 'b3', sub: 'Backpack', desc: 'Dry Bags',               weightOz: 3.2,   qty: 2, checked: false, expendable: false },
    ],
    Clothing: [
      { id: 'c1', sub: 'Clothing', desc: 'Merino Wool Base Layer', weightOz: 6.8,   qty: 1, checked: true,  expendable: false },
      { id: 'c2', sub: 'Clothing', desc: 'Hiking Pants',           weightOz: 12.0,  qty: 2, checked: true,  expendable: false },
      { id: 'c3', sub: 'Clothing', desc: 'Rain Jacket',            weightOz: 11.5,  qty: 1, checked: true,  expendable: false },
      { id: 'c4', sub: 'Clothing', desc: 'Fleece Mid-Layer',       weightOz: 14.0,  qty: 1, checked: false, expendable: false },
      { id: 'c5', sub: 'Clothing', desc: 'Hiking Socks',           weightOz: 2.8,   qty: 3, checked: true,  expendable: false },
    ],
    Toiletries: [
      { id: 't1', sub: 'Toiletries', desc: 'Toothbrush',           weightOz: 0.6,   qty: 1, checked: true,  expendable: true },
      { id: 't2', sub: 'Toiletries', desc: 'Travel Toothpaste',    weightOz: 1.2,   qty: 1, checked: false, expendable: true },
      { id: 't3', sub: 'Toiletries', desc: 'Sunscreen SPF 50',     weightOz: 3.4,   qty: 1, checked: false, expendable: true },
      { id: 't4', sub: 'Toiletries', desc: 'Biodegradable Soap',   weightOz: 2.0,   qty: 1, checked: true,  expendable: true },
    ],
    Electronics: [
      { id: 'e1', sub: 'Electronics', desc: 'Headlamp',            weightOz: 3.2,   qty: 1, checked: true,  expendable: false },
      { id: 'e2', sub: 'Electronics', desc: 'Power Bank',          weightOz: 6.4,   qty: 1, checked: true,  expendable: false },
      { id: 'e3', sub: 'Electronics', desc: 'GPS Watch',           weightOz: 4.8,   qty: 1, checked: true,  expendable: false },
    ],
    Shelter: [
      { id: 's1', sub: 'Shelter', desc: 'Tent (Nemo Hornet 2P)',   weightOz: 42.0,  qty: 1, checked: true,  expendable: false },
      { id: 's2', sub: 'Shelter', desc: 'Sleeping Bag',            weightOz: 32.0,  qty: 1, checked: true,  expendable: false },
      { id: 's3', sub: 'Shelter', desc: 'Sleeping Pad',            weightOz: 16.0,  qty: 1, checked: true,  expendable: false },
    ],
    Kitchen: [
      { id: 'k1', sub: 'Kitchen', desc: 'Jetboil Stove',           weightOz: 13.1,  qty: 1, checked: true,  expendable: false },
      { id: 'k2', sub: 'Kitchen', desc: 'Titanium Spork',          weightOz: 0.6,   qty: 1, checked: true,  expendable: false },
      { id: 'k3', sub: 'Kitchen', desc: 'Freeze Dried Meals',      weightOz: 4.5,   qty: 5, checked: false, expendable: true },
    ],
  },
};

// ─── CONSTANTS ──────────────────────────────────────────────────────────────────
const QTY_OPTIONS = Array.from({ length: 20 }, (_, i) => i + 1);
const WEDGE_W     = 72;
const WEDGE_POINT = 17;
const CARD_H      = 68;

// ─── TOKENS ─────────────────────────────────────────────────────────────────────
const SERIF        = "Georgia, 'Palatino Linotype', Palatino, 'Book Antiqua', ui-serif, serif";
const SANS         = "'Inter', system-ui, -apple-system, sans-serif";
const PAGE_BG      = '#F2EDE4';
const CARD_BG      = '#FFFFFF';
const HEADER_BG    = '#FFFFFF';
const HEADER_BDR   = 'rgba(0,0,0,0.07)';
const CARD_SHADOW  = '0 1px 6px rgba(0,0,0,0.10), 0 0 1px rgba(0,0,0,0.04)';
const CARD_BORDER  = 'rgba(0,0,0,0.06)';
const PRIMARY      = '#1A2920';
const SECONDARY    = '#4A5D54';
const MUTED        = '#9AAA9F';
const DIVIDER      = 'rgba(0,0,0,0.06)';
const SUMMARY_BG   = '#2A5740';
const SUMMARY_TEXT = '#FFFFFF';
const NAV_BG       = '#FFFFFF';
const NAV_ACTIVE   = '#2A5740';
const NAV_INACTIVE = '#A0ADA8';
const CB_CHECKED   = '#4E7D5C';
const CB_UNCHECKED = 'rgba(0,0,0,0.18)';
const DETAIL_BG    = '#F5F0E8';
const DETAIL_BDR   = 'rgba(0,0,0,0.06)';
const OVERLAY_BG   = '#F2EDE4';
const TOAST_BG     = '#2A5740';

// ─── LOGO MARK ──────────────────────────────────────────────────────────────────
function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M4 38 L16 18 L24 28 L32 14 L44 38 Z" fill="#2A5740" opacity="0.9"/>
      <path d="M32 14 L28.5 22 L35.5 22 Z" fill="#FFFFFF" opacity="0.85"/>
      <path d="M16 18 L13.5 23 L18.5 23 Z" fill="#FFFFFF" opacity="0.70"/>
      <circle cx="24" cy="32" r="2.5" fill="#FFFFFF" opacity="0.6"/>
    </svg>
  );
}

// ─── LANDSCAPE DECORATION ────────────────────────────────────────────────────────
function LandscapeDecoration() {
  return (
    <svg
      viewBox="0 0 500 110"
      preserveAspectRatio="xMaxYMax meet"
      aria-hidden="true"
      style={{ position: 'absolute', top: 0, right: 0, width: '78%', height: '110px', pointerEvents: 'none', zIndex: 0 }}
    >
      <defs>
        <linearGradient id="mtnFadeF" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"  stopColor="white" stopOpacity="1"/>
          <stop offset="35%" stopColor="white" stopOpacity="0"/>
        </linearGradient>
        <mask id="leftFadeF">
          <rect width="500" height="110" fill="white"/>
          <rect width="500" height="110" fill="url(#mtnFadeF)"/>
        </mask>
      </defs>
      <g mask="url(#leftFadeF)">
        <path d="M0,110 L40,62 L80,78 L130,35 L175,58 L215,20 L255,48 L290,14 L335,42 L370,8 L410,34 L450,16 L490,28 L500,24 L500,110 Z" fill="#C4D6CA" opacity="0.50"/>
        <path d="M290,14 L283,30 L297,30 Z" fill="#E0EEEA" opacity="0.88"/>
        <path d="M370,8  L362,26 L378,26 Z" fill="#E0EEEA" opacity="0.90"/>
        <path d="M450,16 L444,30 L456,30 Z" fill="#E0EEEA" opacity="0.78"/>
        <path d="M215,20 L209,33 L221,33 Z" fill="#DAE8DD" opacity="0.72"/>
        <path d="M490,28 L486,38 L494,38 Z" fill="#DAE8DD" opacity="0.65"/>
        <path d="M120,110 L190,48 L235,64 L278,30 L318,54 L355,26 L393,50 L428,22 L465,44 L490,20 L500,30 L500,110 Z" fill="#B5CCBA" opacity="0.56"/>
        <path d="M220,110 L275,58 L308,72 L342,44 L375,62 L408,36 L440,56 L468,38 L490,50 L500,44 L500,110 Z" fill="#A8BFB0" opacity="0.48"/>
        <path d="M280,110 L320,68 L352,82 L382,56 L412,72 L440,46 L468,64 L490,50 L500,56 L500,110 Z" fill="#9CB2A4" opacity="0.60"/>
        {([
          [290,110,5,14],[299,110,6,18],[308,110,5,13],[317,110,7,20],
          [327,110,5,16],[336,110,6,22],[346,110,5,15],[355,110,7,19],
          [365,110,5,17],[374,110,6,23],[384,110,5,14],[393,110,7,21],
          [403,110,5,18],[412,110,6,24],[422,110,5,16],[431,110,7,20],
          [441,110,5,18],[450,110,6,22],[460,110,5,15],[469,110,7,21],
          [479,110,5,17],[488,110,6,23],[497,110,5,16],
        ] as [number,number,number,number][]).map(([x,y,w,h], i) => (
          <polygon key={i} points={`${x},${y} ${x-w},${y-h} ${x+w},${y-h}`} fill="#8BA898" opacity={0.44 + (i % 5) * 0.04}/>
        ))}
      </g>
    </svg>
  );
}

// ─── LOCKER HELPERS (localStorage LOCKER_KEY — reads for browse, writes for save) ──
function readLockerEntries(): LockerEntry[] {
  try {
    const raw = localStorage.getItem(LOCKER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function appendLockerEntry(entry: LockerEntry): void {
  const entries = readLockerEntries();
  localStorage.setItem(LOCKER_KEY, JSON.stringify([...entries, entry]));
}

// ─── TOAST ───────────────────────────────────────────────────────────────────────
function Toast({ message }: { message: string }) {
  return (
    <div style={{
      position: 'fixed', bottom: 76, left: '50%', transform: 'translateX(-50%)',
      background: TOAST_BG, color: '#fff', borderRadius: 10, padding: '10px 18px',
      fontSize: 13.5, fontFamily: SANS, fontWeight: 500, zIndex: 9999,
      whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,0.32)',
      pointerEvents: 'none',
    }}>
      {message}
    </div>
  );
}

// ─── CHECKLIST OVERLAY ───────────────────────────────────────────────────────────
interface ChecklistOverlayProps {
  sandbox: SandboxStore;
  system: string;
  checklistUse: Record<string, boolean>;
  onToggle: (id: string) => void;
  onClear: () => void;
  onPrint: () => void;
  onShare: () => void;
  onClose: () => void;
}

function ChecklistOverlay({
  sandbox, system, checklistUse, onToggle, onClear, onPrint, onShare, onClose,
}: ChecklistOverlayProps) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: OVERLAY_BG,
      zIndex: 50, display: 'flex', flexDirection: 'column', fontFamily: SANS,
    }}>
      {/* Header */}
      <div style={{
        height: 52, background: HEADER_BG, borderBottom: `1px solid ${HEADER_BDR}`,
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          aria-label="Close checklist"
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <ChevronLeft size={22} color={SECONDARY} strokeWidth={2}/>
        </button>
        <span style={{ flex: 1, fontSize: 17, fontWeight: 600, color: PRIMARY, fontFamily: SERIF }}>
          Checklist
        </span>
        <button
          onClick={onClear}
          aria-label="Clear all checklist progress"
          title="Clear check progress (does not change your gear selection)"
          style={{ background: 'none', border: 'none', padding: '4px 8px', cursor: 'pointer',
            fontSize: 12.5, color: SECONDARY, borderRadius: 6, fontFamily: SANS }}
        >
          Clear
        </button>
        <button
          onClick={onPrint}
          aria-label="Print checklist"
          title="Print pack list"
          style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <Printer size={18} color={SECONDARY} strokeWidth={1.8}/>
        </button>
        <button
          onClick={onShare}
          aria-label="Download PDF"
          title="Download PDF"
          style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <Share2 size={18} color={SECONDARY} strokeWidth={1.8}/>
        </button>
      </div>

      {/* Note banner */}
      <div style={{
        background: 'rgba(42,87,64,0.08)', borderBottom: `1px solid rgba(42,87,64,0.12)`,
        padding: '7px 16px', fontSize: 12, color: SECONDARY, flexShrink: 0,
      }}>
        Showing your selected items. Tick boxes track trail progress separately.
      </div>

      {/* PreviewBody */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        <BarStyleProvider value={{ barColor: '', barFont: '', barTextColor: '', barTransparency: 1 }}>
          <PreviewBody
            data={sandbox.items}
            system={system as 'imperial' | 'metric'}
            categoryOrder={sandbox.order}
            categoryMeta={sandbox.meta}
            filterToChecked={true}
            checklistUse={checklistUse}
            onToggle={onToggle}
          />
        </BarStyleProvider>
      </div>
    </div>
  );
}

// ─── SUMMARY OVERLAY ─────────────────────────────────────────────────────────────
interface SummaryOverlayProps {
  sandbox: SandboxStore;
  onClose: () => void;
}

function SummaryOverlay({ sandbox, onClose }: SummaryOverlayProps) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: OVERLAY_BG,
      zIndex: 50, display: 'flex', flexDirection: 'column', fontFamily: SANS,
    }}>
      {/* Header */}
      <div style={{
        height: 52, background: HEADER_BG, borderBottom: `1px solid ${HEADER_BDR}`,
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          aria-label="Back to list"
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <ChevronLeft size={22} color={SECONDARY} strokeWidth={2}/>
        </button>
        <span style={{ flex: 1, fontSize: 17, fontWeight: 600, color: PRIMARY, fontFamily: SERIF }}>
          Summary
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <BarStyleProvider value={{ barColor: '', barFont: '', barTextColor: '', barTransparency: 1 }}>
          <WeightSummary
            data={sandbox.items}
            categoryOrder={sandbox.order}
            categoryMeta={sandbox.meta}
            forceOpen={true}
            forceOpenSeq={1}
          />
          <WeightDistribution
            data={sandbox.items}
            categoryOrder={sandbox.order}
            categoryMeta={sandbox.meta}
            paletteKey="trail"
            onPaletteChange={() => {}}
            forceOpen={true}
            forceOpenSeq={1}
          />
        </BarStyleProvider>
      </div>
    </div>
  );
}

// ─── LOCKER OVERLAY ──────────────────────────────────────────────────────────────
interface LockerOverlayProps {
  onLoad: (store: SandboxStore) => void;
  onSave: () => void;
  onClose: () => void;
}

function LockerOverlay({ onLoad, onSave, onClose }: LockerOverlayProps) {
  const [entries, setEntries] = useState<LockerEntry[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setEntries(readLockerEntries());
  }, [refreshKey]);

  const handleSaveAndRefresh = () => {
    onSave();
    setTimeout(() => setRefreshKey(k => k + 1), 500);
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, background: OVERLAY_BG,
      zIndex: 50, display: 'flex', flexDirection: 'column', fontFamily: SANS,
    }}>
      {/* Header */}
      <div style={{
        height: 52, background: HEADER_BG, borderBottom: `1px solid ${HEADER_BDR}`,
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          aria-label="Back to list"
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <ChevronLeft size={22} color={SECONDARY} strokeWidth={2}/>
        </button>
        <span style={{ flex: 1, fontSize: 17, fontWeight: 600, color: PRIMARY, fontFamily: SERIF }}>
          Locker
        </span>
        <button
          onClick={handleSaveAndRefresh}
          aria-label="Save current list to Locker"
          title="Save current sandbox list as a new Locker entry"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: NAV_ACTIVE, color: '#fff', border: 'none',
            borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, fontFamily: SANS,
          }}
        >
          <Save size={14} strokeWidth={2}/> Save
        </button>
      </div>

      {/* Note */}
      <div style={{
        background: 'rgba(42,87,64,0.08)', borderBottom: `1px solid rgba(42,87,64,0.12)`,
        padding: '7px 16px', fontSize: 12, color: SECONDARY, flexShrink: 0,
      }}>
        Loading a list replaces the sandbox preview. Save creates a new Locker entry.
      </div>

      {/* Entries */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 24px', color: MUTED, fontSize: 14 }}>
            <Folder size={32} color={MUTED} strokeWidth={1.4} style={{ margin: '0 auto 8px', display: 'block' }}/>
            No saved lists yet.
          </div>
        )}
        {[...entries].reverse().map(entry => {
          const itemCount = Object.values(entry.store?.items ?? {}).flat().length;
          const catCount  = entry.store?.order?.length ?? 0;
          const date = new Date(entry.savedAt).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', year: 'numeric',
          });
          return (
            <div key={entry.id} style={{
              background: CARD_BG, borderRadius: 12, border: `1px solid ${CARD_BORDER}`,
              boxShadow: CARD_SHADOW, padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: PRIMARY, marginBottom: 2,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {entry.name}
                </div>
                <div style={{ fontSize: 12, color: MUTED }}>
                  {date} · {catCount} categories · {itemCount} items
                </div>
              </div>
              <button
                onClick={() => {
                  if (entry.store) {
                    onLoad({
                      items: entry.store.items ?? {},
                      order: entry.store.order ?? [],
                      meta:  entry.store.meta ?? {},
                    });
                    onClose();
                  }
                }}
                aria-label={`Load ${entry.name} into preview`}
                style={{
                  background: 'rgba(42,87,64,0.09)', color: NAV_ACTIVE,
                  border: 'none', borderRadius: 8, padding: '6px 14px',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: SANS, flexShrink: 0,
                }}
              >
                Load
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SCANNER OVERLAY ─────────────────────────────────────────────────────────────
interface ScannerOverlayProps {
  categoryOrder: string[];
  onAddItem: (category: string, prefill: Partial<GearItem>) => void;
  onClose: () => void;
}

function ScannerOverlay({ categoryOrder, onAddItem, onClose }: ScannerOverlayProps) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: OVERLAY_BG,
      zIndex: 50, display: 'flex', flexDirection: 'column', fontFamily: SANS,
    }}>
      {/* Header */}
      <div style={{
        height: 52, background: HEADER_BG, borderBottom: `1px solid ${HEADER_BDR}`,
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          aria-label="Close scanner"
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <ChevronLeft size={22} color={SECONDARY} strokeWidth={2}/>
        </button>
        <span style={{ flex: 1, fontSize: 17, fontWeight: 600, color: PRIMARY, fontFamily: SERIF }}>
          Scan Gear List
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        <BarStyleProvider value={{ barColor: '', barFont: '', barTextColor: '', barTransparency: 1 }}>
          <ImportGearPanel
            categoryOrder={categoryOrder}
            onAddItem={onAddItem}
            defaultOpen={true}
            forceOpen={true}
            forceOpenSeq={1}
          />
        </BarStyleProvider>
      </div>
    </div>
  );
}

// ─── BOTTOM NAV (interactive) ────────────────────────────────────────────────────
interface BottomNavBarProps {
  active: ActiveNav;
  onSelect: (tab: ActiveNav) => void;
  onMore: () => void;
}

function BottomNavBar({ active, onSelect, onMore }: BottomNavBarProps) {
  return (
    <div style={{
      position: 'sticky', bottom: 0, left: 0, right: 0,
      background: NAV_BG, borderTop: '1px solid rgba(0,0,0,0.08)',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      paddingTop: 8, paddingBottom: 10, zIndex: 20, height: 58, boxSizing: 'border-box',
    }}>
      {/* List */}
      <NavTab
        Icon={Backpack} label="List" active={active === 'list'}
        onClick={() => onSelect('list')}
        aria-label="List — current gear list"
      />
      {/* Locker */}
      <NavTab
        Icon={Folder} label="Locker" active={active === 'locker'}
        onClick={() => onSelect('locker')}
        aria-label="Locker — browse and load saved lists"
      />
      {/* Catalog — FUTURE */}
      <NavTabDisabled
        Icon={Grid3X3} label="Catalog"
        aria-label="Catalog — coming soon"
        title="Catalog — future feature"
      />
      {/* Summary */}
      <NavTab
        Icon={BarChart2} label="Summary" active={active === 'summary'}
        onClick={() => onSelect('summary')}
        aria-label="Summary — pack weight and distribution"
      />
      {/* More */}
      <NavTab
        Icon={MoreHorizontal} label="More" active={false}
        onClick={onMore}
        aria-label="More — settings and tools"
      />
    </div>
  );
}

function NavTab({ Icon, label, active, onClick, 'aria-label': ariaLabel }: {
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  label: string; active: boolean; onClick: () => void; 'aria-label'?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      aria-current={active ? 'page' : undefined}
      style={{
        background: 'none', border: 'none', padding: 0, cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 52,
      }}
    >
      <Icon size={22} color={active ? NAV_ACTIVE : NAV_INACTIVE} strokeWidth={active ? 2 : 1.6}/>
      <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, color: active ? NAV_ACTIVE : NAV_INACTIVE, letterSpacing: active ? '0.1px' : 0 }}>
        {label}
      </span>
    </button>
  );
}

function NavTabDisabled({ Icon, label, 'aria-label': ariaLabel, title }: {
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  label: string; 'aria-label'?: string; title?: string;
}) {
  return (
    <div
      aria-disabled="true"
      aria-label={ariaLabel ?? label}
      title={title ?? label}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        minWidth: 52, cursor: 'not-allowed', opacity: 0.45,
      }}
    >
      <Icon size={22} color={NAV_INACTIVE} strokeWidth={1.6}/>
      <span style={{ fontSize: 10, fontWeight: 400, color: NAV_INACTIVE }}>
        {label}
      </span>
    </div>
  );
}

// ─── FULL-SCREEN MENU VIEW (027Q — replaces Sheet side="left" hamburger) ─────────
interface FullScreenMenuProps {
  onBack: () => void;
  system: string;
  setSystem: (s: 'imperial' | 'metric') => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onSave: () => void;
  onPrint: () => void;
  onNavigateToShare: () => void;
  onChecklist: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  isAuthenticated: boolean;
}

function FullScreenMenu({
  onBack, system, setSystem, canUndo, canRedo,
  onUndo, onRedo, onReset, onSave, onPrint, onNavigateToShare, onChecklist,
  onExpandAll, onCollapseAll, isAuthenticated,
}: FullScreenMenuProps) {
  const menuItem = (
    icon: React.ReactNode,
    label: string,
    onClick: () => void,
    disabled = false,
    sublabel?: string,
  ) => (
    <button
      key={label}
      onClick={() => { if (!disabled) onClick(); }}
      disabled={disabled}
      aria-label={sublabel ? `${label} — ${sublabel}` : label}
      title={sublabel}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, width: '100%',
        background: 'none', border: 'none', padding: '14px 0', cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left', borderBottom: `1px solid ${DIVIDER}`, opacity: disabled ? 0.4 : 1,
      }}
    >
      <span style={{ color: SECONDARY, display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 15, fontWeight: 500, color: PRIMARY, fontFamily: SANS }}>{label}</div>
        {sublabel && <div style={{ fontSize: 11.5, color: MUTED, marginTop: 1 }}>{sublabel}</div>}
      </div>
    </button>
  );

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: PAGE_BG, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      {/* Sticky back bar */}
      <div style={{ position: 'sticky', top: 0, background: PAGE_BG, zIndex: 5, borderBottom: `1px solid ${DIVIDER}`, height: 48, display: 'flex', alignItems: 'center', padding: '0 16px', flexShrink: 0 }}>
        <button
          onClick={onBack}
          aria-label="Back to list"
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: NAV_ACTIVE, fontSize: 16, fontFamily: SANS, fontWeight: 500, padding: '4px 0' }}
        >
          <ChevronLeft size={20} strokeWidth={2.5}/> Back
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 40px' }}>
        <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: PRIMARY, marginBottom: 4 }}>Menu</div>
        <div style={{ fontSize: 12, color: MUTED, marginBottom: 20 }}>V3 Preview — sandboxed</div>

        {/* File */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', color: MUTED, textTransform: 'uppercase', marginBottom: 4 }}>File</div>
          {menuItem(<Save size={17} strokeWidth={1.8}/>, 'Save', () => { onSave(); onBack(); }, false, 'Save current list as new Locker entry')}
          {menuItem(<Undo2 size={17} strokeWidth={1.8}/>, 'Undo', () => { onUndo(); onBack(); }, !canUndo)}
          {menuItem(<Redo2 size={17} strokeWidth={1.8}/>, 'Redo', () => { onRedo(); onBack(); }, !canRedo)}
          {menuItem(<RotateCcw size={17} strokeWidth={1.8}/>, 'Reset', () => { onReset(); onBack(); }, false, 'Re-load from your saved data')}
        </div>

        {/* Actions */}
        <div style={{ marginBottom: 8, marginTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', color: MUTED, textTransform: 'uppercase', marginBottom: 4 }}>Actions</div>
          {menuItem(<Tent size={17} strokeWidth={1.8}/>, 'Checklist', () => { onChecklist(); onBack(); }, false, 'Trail checklist for selected items')}
          {menuItem(<Share2 size={17} strokeWidth={1.8}/>, 'Share (get review link)', () => { onNavigateToShare(); })}
          {menuItem(<Printer size={17} strokeWidth={1.8}/>, 'Print', () => { onPrint(); onBack(); })}
        </div>

        {/* View */}
        <div style={{ marginBottom: 8, marginTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', color: MUTED, textTransform: 'uppercase', marginBottom: 4 }}>View</div>
          {menuItem(<Layers size={17} strokeWidth={1.8}/>, 'Expand All', () => { onExpandAll(); onBack(); })}
          {menuItem(<LayoutList size={17} strokeWidth={1.8}/>, 'Collapse All', () => { onCollapseAll(); onBack(); })}
        </div>

        {/* Units */}
        <div style={{ marginBottom: 8, marginTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', color: MUTED, textTransform: 'uppercase', marginBottom: 8 }}>Units</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['imperial', 'metric'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSystem(s)}
                aria-pressed={system === s}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 13.5, fontWeight: 600,
                  border: `1.5px solid ${system === s ? NAV_ACTIVE : CARD_BORDER}`,
                  background: system === s ? NAV_ACTIVE : CARD_BG,
                  color: system === s ? '#fff' : SECONDARY, cursor: 'pointer', fontFamily: SANS,
                  textTransform: 'capitalize',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {isAuthenticated && (
          <div style={{ marginTop: 16, fontSize: 12, color: MUTED, padding: '8px 0' }}>
            Sign out available in the main app (/checklist).
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PLUS CREATION SHEET (slides from bottom) ────────────────────────────────────
interface PlusSheetProps {
  open: boolean;
  onClose: () => void;
  onScanGearList: () => void;
}

function PlusSheet({ open, onClose, onScanGearList }: PlusSheetProps) {
  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" style={{ padding: '24px 24px 36px', borderRadius: '20px 20px 0 0' }}>
        <SheetHeader>
          <SheetTitle style={{ fontFamily: SERIF, fontSize: 16, color: PRIMARY, textAlign: 'left', marginBottom: 4 }}>
            Start / Create
          </SheetTitle>
        </SheetHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
          {/* Create New List — guided flow PENDING */}
          <div
            aria-disabled="true"
            title="CREATE NEW LIST GUIDED FLOW = NOT YET IMPLEMENTED"
            style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '15px 4px',
              borderBottom: `1px solid ${DIVIDER}`, opacity: 0.4, cursor: 'not-allowed',
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: 'rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Plus size={20} color={SECONDARY} strokeWidth={2}/>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 500, color: PRIMARY, fontFamily: SANS }}>Create New List</div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Guided setup — coming soon</div>
            </div>
          </div>

          {/* Scan Gear List — REAL */}
          <button
            onClick={() => { onScanGearList(); onClose(); }}
            aria-label="Scan Gear List — import from PDF or DOCX file"
            style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '15px 4px',
              background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: 'rgba(42,87,64,0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Scale size={20} color={NAV_ACTIVE} strokeWidth={1.8}/>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 500, color: PRIMARY, fontFamily: SANS }}>Scan Gear List</div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Import from PDF or Word document</div>
            </div>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── FULL-SCREEN FOOTER VIEW (027Q — replaces MoreSheet; footer links only) ──────
interface FullScreenFooterProps {
  onBack: () => void;
  onNavigateToPage: (pageId: FooterPageId) => void;
  isAuthenticated: boolean;
}

function FullScreenFooter({ onBack, onNavigateToPage, isAuthenticated }: FullScreenFooterProps) {
  const footerRow = (label: string, pageId: FooterPageId) => (
    <button
      key={label}
      onClick={() => onNavigateToPage(pageId)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', background: 'none', border: 'none', padding: '15px 0',
        cursor: 'pointer', textAlign: 'left', borderBottom: `1px solid ${DIVIDER}`,
        fontFamily: SANS,
      }}
    >
      <span style={{ fontSize: 15, color: PRIMARY, fontWeight: 400 }}>{label}</span>
      <ChevronRight size={16} color={MUTED} strokeWidth={1.8}/>
    </button>
  );

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: PAGE_BG, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      {/* Sticky back bar */}
      <div style={{ position: 'sticky', top: 0, background: PAGE_BG, zIndex: 5, borderBottom: `1px solid ${DIVIDER}`, height: 48, display: 'flex', alignItems: 'center', padding: '0 16px', flexShrink: 0 }}>
        <button
          onClick={onBack}
          aria-label="Back to list"
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: NAV_ACTIVE, fontSize: 16, fontFamily: SANS, fontWeight: 500, padding: '4px 0' }}
        >
          <ChevronLeft size={20} strokeWidth={2.5}/> Back
        </button>
      </div>

      {/* Scrollable footer content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 40px' }}>
        <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 700, color: PRIMARY, marginBottom: 20 }}>More</div>

        {/* TrailWeigh section */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', color: MUTED, textTransform: 'uppercase', marginBottom: 2 }}>TrailWeigh</div>
          {footerRow('About TrailWeigh', 'about')}
          {footerRow('How It Works', 'how-it-works')}
          {footerRow('Sources & References', 'sources')}
        </div>

        {/* Help section */}
        <div style={{ marginBottom: 8, marginTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', color: MUTED, textTransform: 'uppercase', marginBottom: 2 }}>Help</div>
          {footerRow('Help & How-To', 'help')}
          {footerRow('Report a Problem', 'report-problem')}
          {footerRow('Contact Us', 'contact')}
        </div>

        {/* Account & Privacy section */}
        <div style={{ marginBottom: 8, marginTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1px', color: MUTED, textTransform: 'uppercase', marginBottom: 2 }}>Account &amp; Privacy</div>
          {footerRow('Privacy Policy', 'privacy')}
          {footerRow('Terms of Use', 'terms')}
          {isAuthenticated && footerRow('Delete Account / Data', 'delete-account')}
          {footerRow('Affiliate Disclosure', 'affiliate')}
          {footerRow('Accessibility', 'accessibility')}
        </div>

        {/* Copyright */}
        <div style={{ borderTop: `1px solid ${DIVIDER}`, paddingTop: 16, marginTop: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: MUTED, fontFamily: SANS }}>© 2026 TrailWeigh · All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

// ─── FOOTER PAGE CONTENT (027R — full production content, no escape buttons) ──────
interface FooterPageViewProps {
  pageId: FooterPageId;
  onBack: () => void;
  isAuthenticated: boolean;
  /** In-app navigation: path like '/help' → push footer-page screen. */
  navigate: (path: string) => void;
  /** Open the Sources screen (or scroll to a specific ref). */
  onOpenSources: (refId?: string) => void;
}

function FooterPageView({ pageId, onBack, isAuthenticated, navigate, onOpenSources }: FooterPageViewProps) {
  // ── Local Tailwind helpers matching production page styles ──────────────────
  function H2({ children }: { children: React.ReactNode }) {
    return <h2 className="text-base font-bold text-foreground mt-8 mb-3">{children}</h2>;
  }
  function P({ children }: { children: React.ReactNode }) {
    return <p className="text-sm text-foreground/80 leading-relaxed mb-3">{children}</p>;
  }
  /** In-app link — navigates to another footer page via the screen stack. */
  function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
    return (
      <button
        onClick={() => navigate(to)}
        className="underline underline-offset-2 hover:text-foreground font-medium"
      >
        {children}
      </button>
    );
  }

  // Pages whose h1 is rendered by the content component itself (do not add a wrapper h1)
  const contentOwnsTitle = new Set(['about', 'help', 'how-it-works']);

  const pageTitles: Record<FooterPageId, string> = {
    about: 'About TrailWeigh', 'how-it-works': 'How It Works',
    sources: 'Sources & References', help: 'Help & How-To',
    'report-problem': 'Report a Problem', contact: 'Contact Us',
    privacy: 'Privacy Policy', terms: 'Terms of Use',
    'delete-account': 'Delete Account / Data', affiliate: 'Affiliate Disclosure',
    accessibility: 'Accessibility',
  };

  const renderContent = () => {
    switch (pageId) {

      // ── Complex pages: render full extracted content components ─────────────
      case 'about':
        return <AboutContent onOpenSources={onOpenSources} navigate={navigate} />;

      case 'help':
        return <HelpContent navigate={navigate} />;

      case 'how-it-works':
        return <HowItWorksContent navigate={navigate} />;

      // ── Simple pages: verbatim production content, Links → NavLink ──────────

      case 'report-problem':
        return (
          <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm space-y-5">
            <P>
              Use this page when TrailWeigh is not behaving as expected — something isn't
              working, a result looks wrong, or you've encountered an error.
            </P>
            <div>
              <h2 className="font-semibold text-foreground mb-2">What to include in your report</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                A clear description helps us identify and fix the problem quickly. When you
                contact us, please include:
              </p>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside ml-1">
                <li><strong className="text-foreground">What you were doing</strong> — which part of TrailWeigh you were using and what action you took.</li>
                <li><strong className="text-foreground">What happened</strong> — the exact result, error message, or unexpected behavior you observed.</li>
                <li><strong className="text-foreground">What you expected to happen</strong> — what the correct behavior should have been.</li>
                <li><strong className="text-foreground">Your device and browser</strong> — for example, "iPhone 15, Safari" or "Windows 11, Chrome 125."</li>
                <li><strong className="text-foreground">Whether the problem is repeatable</strong> — does it happen every time or only occasionally?</li>
              </ol>
            </div>
            <div className="border-t border-border pt-5">
              <h2 className="font-semibold text-foreground mb-2">How to report</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Use the <NavLink to="/contact">Contact Us</NavLink> page
                to send your report. A built-in problem-reporting tool will be available in a future
                TrailWeigh update.
              </p>
            </div>
            <div className="border-t border-border pt-5">
              <button
                onClick={() => navigate('/contact')}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors text-sm"
              >
                Go to Contact Us
              </button>
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm space-y-4">
            <p className="text-foreground/80 leading-relaxed">
              TrailWeigh support contact information will be available here.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you have encountered a bug or something isn't working as expected, the{' '}
              <NavLink to="/report-problem">Report a Problem</NavLink>{' '}
              page describes what to include in your report.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              For questions about your account or data, see{' '}
              <NavLink to="/privacy">Privacy Policy</NavLink>{' '}
              or{' '}
              <NavLink to="/delete-account">Delete Account / Data</NavLink>.
            </p>
          </div>
        );

      case 'privacy':
        return (
          <>
            <div className="bg-amber-50 border border-amber-200/60 rounded-xl px-5 py-4 mb-8 text-sm text-amber-700/80 leading-relaxed">
              <strong className="font-semibold">Draft — not yet finalized.</strong> This policy
              describes TrailWeigh's current data practices to the best of our knowledge.
              It will be reviewed by qualified legal counsel before it is treated as a
              binding privacy statement. Check back for updates.
            </div>
            <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm">
              <P>This Privacy Policy describes what information TrailWeigh collects, how it is used, and the choices available to you.</P>
              <H2>1. Information you provide</H2>
              <P><strong>Account information.</strong> When you create a TrailWeigh account, you provide an email address. Account creation, sign-in, and session management are handled by <strong>Clerk</strong>, a third-party authentication service. TrailWeigh does not independently store your password. Clerk's own privacy policy governs the handling of your authentication credentials and session data.</P>
              <P><strong>Gear list content.</strong> The gear lists, categories, item names, descriptions, weights, and quantities you enter in TrailWeigh are your own content. TrailWeigh stores this content so the application can function.</P>
              <H2>2. How TrailWeigh stores your data</H2>
              <P><strong>Browser storage (your device).</strong> Your current working gear list — including all items, categories, and settings — is stored in your browser's <strong>local storage</strong>, tied to your account identifier. This data lives on the device and browser you are using. It is not automatically synced to another device. Signing out of TrailWeigh does not automatically clear this local data.</P>
              <P><strong>Background images.</strong> If you select a background photo, any photo files associated with custom theme slots are stored in your browser's <strong>IndexedDB</strong> (a local browser database on your device). Preset background photos provided by TrailWeigh are hosted externally by Unsplash and are loaded over the network, not stored locally.</P>
              <P><strong>Saved gear lists (Locker).</strong> Gear lists you explicitly save to the Locker are stored in your browser's local storage under your account ID. They are accessible from the same browser and device where you saved them.</P>
              <P><strong>Shared links.</strong> When you use the Share feature, a snapshot of your gear list at that moment — including items, categories, weights, list name, unit preference, and background settings — is stored in TrailWeigh's server database. This snapshot is associated with a randomly generated link ID, not directly with your account. Anyone who has the link can access this snapshot.</P>
              <P><strong>Scan credits.</strong> AI scan credits are tracked in your browser's local storage. No credit or payment information is stored on TrailWeigh's servers.</P>
              <H2>3. Server-side data</H2>
              <P>TrailWeigh's server database stores only share-link snapshots (as described above). It does not maintain a user database of your gear lists, personal profile, or account details beyond what Clerk manages for authentication purposes.</P>
              <P>Server logs record standard HTTP request information (request method, URL path, response status, and a request identifier) for operational purposes. These logs do not contain gear list content or personal information beyond what is in standard web server logs.</P>
              <H2>4. Third-party services</H2>
              <P>TrailWeigh uses the following external services:</P>
              <ul className="text-sm text-foreground/80 leading-relaxed list-disc list-inside space-y-2 mb-3 ml-1">
                <li><strong>Clerk</strong> — account creation, authentication, and session management. Clerk handles your email address and sign-in credentials.</li>
                <li><strong>OpenAI</strong> — powers the Scan Gear List AI feature. When you use Scan Gear List, the content of the file you submit is sent to OpenAI's API for processing. OpenAI's privacy policy governs how that data is handled.</li>
                <li><strong>Unsplash</strong> — provides preset background photos. Selecting a preset photo loads it directly from Unsplash's servers.</li>
              </ul>
              <P>TrailWeigh does not use advertising networks, behavioral tracking, or third-party analytics services.</P>
              <H2>5. How your information is used</H2>
              <P>Information collected by TrailWeigh is used solely to provide and improve the TrailWeigh gear-tracking service — specifically to operate your gear lists, enable saving and sharing, and authenticate your account. It is not sold to third parties.</P>
              <H2>6. Data retention and deletion</H2>
              <P><strong>Browser-local data</strong> (your working list, Locker, background photos) persists in your browser until you clear your browser's site data for TrailWeigh, or until the browser itself removes it as part of storage management.</P>
              <P><strong>Share-link snapshots</strong> on the server are retained to support shared links. TrailWeigh does not currently associate share-link snapshots with a user account for deletion purposes.</P>
              <P><strong>Account deletion.</strong> To request deletion of your TrailWeigh account and associated data, see the <NavLink to="/delete-account">Delete Account / Data</NavLink> page.</P>
              <H2>7. Security</H2>
              <P>TrailWeigh takes reasonable steps to protect the information it handles, including using established third-party services for authentication and hosting. No specific security certifications or guarantees are claimed here.</P>
              <H2>8. Children</H2>
              <P>TrailWeigh is not directed at children under 13. We do not knowingly collect personal information from children under 13.</P>
              <H2>9. Changes to this policy</H2>
              <P>This Privacy Policy may be updated as TrailWeigh's features and data practices evolve. Material changes will be noted on this page. Continued use of TrailWeigh after an update constitutes acceptance of the revised policy.</P>
              <H2>10. Contact</H2>
              <P>Questions about this Privacy Policy or your data can be directed through the <NavLink to="/contact">Contact Us</NavLink> page.</P>
            </div>
            <p className="mt-8 text-sm text-muted-foreground">
              See also:{' '}
              <NavLink to="/terms">Terms of Use</NavLink>{' · '}
              <NavLink to="/delete-account">Delete Account / Data</NavLink>
            </p>
          </>
        );

      case 'terms':
        return (
          <>
            <div className="bg-amber-50 border border-amber-200/60 rounded-xl px-5 py-4 mb-8 text-sm text-amber-700/80 leading-relaxed">
              <strong className="font-semibold">Draft — not yet finalized.</strong> These Terms
              of Use describe TrailWeigh's current expectations and practices in plain language.
              They will be reviewed by qualified legal counsel before being treated as a
              binding legal agreement. Check back for updates.
            </div>
            <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm">
              <P>By using TrailWeigh you agree to these Terms of Use. Please read them before using the service.</P>
              <H2>1. Using TrailWeigh</H2>
              <P>TrailWeigh is a gear-list and pack-weight planning application provided for personal use by hikers and backpackers. You may use TrailWeigh to create, manage, save, and share gear lists for your own trips and planning purposes.</P>
              <H2>2. Account responsibility</H2>
              <P>You are responsible for maintaining the security of your account credentials. You are responsible for all activity that occurs under your account. If you believe your account has been compromised, contact us promptly.</P>
              <P>You must be at least 13 years old to create a TrailWeigh account.</P>
              <H2>3. Acceptable use</H2>
              <P>You agree not to use TrailWeigh to:</P>
              <ul className="text-sm text-foreground/80 leading-relaxed list-disc list-inside space-y-1.5 mb-3 ml-1">
                <li>Violate any applicable law or regulation.</li>
                <li>Attempt to gain unauthorized access to TrailWeigh's systems or another user's data.</li>
                <li>Use automated tools to scrape, overload, or otherwise interfere with the service.</li>
                <li>Engage in any use that disrupts or harms TrailWeigh or its users.</li>
              </ul>
              <H2>4. Your gear-list content</H2>
              <P>The gear-list content you create in TrailWeigh — item names, descriptions, weights, and other information you enter — is yours. TrailWeigh stores and processes it only to provide the service to you.</P>
              <P>When you use the <strong>Share</strong> feature, you choose to make a snapshot of your gear list accessible to anyone with the link. You are responsible for deciding what to share and with whom.</P>
              <H2>5. TrailWeigh intellectual property</H2>
              <P>TrailWeigh and its associated software, design, interface, and content (other than your own gear-list content) are the property of TrailWeigh's creators. You may not copy, modify, distribute, or create derivative works from TrailWeigh's application code or design without permission.</P>
              <H2>6. Shared links</H2>
              <P>Shared links contain a snapshot of your gear list at the time the link was created. Anyone with the link can view that snapshot. Share links are not password-protected. Consider this before sharing a link to a list that contains information you do not want to be broadly accessible.</P>
              <H2>7. Service availability</H2>
              <P>TrailWeigh is provided on an as-available basis. We do not guarantee uninterrupted access. The service may be updated, modified, or temporarily unavailable from time to time.</P>
              <H2>8. Changes to features</H2>
              <P>TrailWeigh's features may change over time. Features may be added, modified, or removed. Where practical, significant changes will be communicated in advance.</P>
              <H2>9. Account termination</H2>
              <P>We reserve the right to suspend or terminate accounts that violate these Terms or that engage in behavior harmful to other users or to the service. You may also choose to delete your account at any time — see the <NavLink to="/delete-account">Delete Account / Data</NavLink> page for how to do so.</P>
              <H2>10. Disclaimers</H2>
              <P>TrailWeigh is a planning and organizational tool. It is provided for informational and planning purposes only. TrailWeigh does not provide outdoor safety advice, fitness guidance, or recommendations about what to bring on any specific trip. You are responsible for your own safety and preparedness in the outdoors.</P>
              <P>TrailWeigh is provided without warranties of any kind, express or implied, to the extent permitted by applicable law.</P>
              <H2>11. Limitation of liability</H2>
              <P>To the extent permitted by applicable law, TrailWeigh's liability for any claim arising from your use of the service is limited. TrailWeigh is not liable for indirect, incidental, or consequential damages.</P>
              <P><em>Note: The specific limits, jurisdiction, and governing law for this section require legal review and will be defined in the final Terms of Use.</em></P>
              <H2>12. Changes to these Terms</H2>
              <P>These Terms of Use may be updated as the service evolves. Continued use of TrailWeigh after an update constitutes acceptance of the revised Terms. Material changes will be noted on this page.</P>
              <H2>13. Contact</H2>
              <P>Questions about these Terms can be directed through the <NavLink to="/contact">Contact Us</NavLink> page.</P>
            </div>
            <p className="mt-8 text-sm text-muted-foreground">
              See also:{' '}
              <NavLink to="/privacy">Privacy Policy</NavLink>
            </p>
          </>
        );

      case 'delete-account':
        return (
          <>
            <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm space-y-5 mb-6">
              <div>
                <h2 className="font-semibold text-foreground mb-2">What deletion removes</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  Deleting your TrailWeigh account permanently removes:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1.5 ml-1">
                  <li>Your TrailWeigh account credentials and sign-in access</li>
                  <li>All saved gear lists stored in your Locker</li>
                  <li>Any shared links you have created</li>
                  <li>All other data associated with your account on TrailWeigh's servers</li>
                </ul>
              </div>
              <div className="border-t border-border pt-5">
                <h2 className="font-semibold text-foreground mb-2">Local browser data</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  TrailWeigh stores your current working gear list and background photo selections
                  locally in your browser. This browser-local data is separate from your account
                  and is not automatically removed when you delete your account. To remove it,
                  you can clear your browser's site data for TrailWeigh after your account has
                  been deleted.
                </p>
              </div>
              <div className="border-t border-border pt-5">
                <h2 className="font-semibold text-foreground mb-2">Deletion is permanent</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Account deletion cannot be undone. Gear lists removed during deletion are
                  not recoverable.
                </p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200/60 rounded-xl px-5 py-4 text-sm text-amber-700/80 leading-relaxed mb-6">
              <strong className="font-semibold">How to request deletion:</strong> A self-service
              account deletion option will be available in a future TrailWeigh update. In the
              meantime, please{' '}
              <button onClick={() => navigate('/contact')} className="underline underline-offset-2 hover:text-amber-900 font-medium">
                Contact Us
              </button>{' '}
              to request account and data deletion.
            </div>
            <p className="text-sm text-muted-foreground">
              See also:{' '}
              <NavLink to="/privacy">Privacy Policy</NavLink>
            </p>
          </>
        );

      case 'affiliate':
        return (
          <>
            <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm space-y-4 text-foreground/80 leading-relaxed">
              <p>
                TrailWeigh may earn a commission from qualifying purchases made through retailer
                links at no additional cost to you.
              </p>
              <p className="text-sm text-muted-foreground">
                Affiliate relationships, if any, will be disclosed specifically here once those
                arrangements are established. This disclosure will be updated to identify the
                programmes and retailers involved.
              </p>
              <p className="text-sm text-muted-foreground">
                Any affiliate relationships that may exist do not influence TrailWeigh's
                gear-tracking features, weight data, or application behavior.
              </p>
            </div>
            <p className="mt-8 text-sm text-muted-foreground">
              Questions?{' '}
              <NavLink to="/contact">Contact Us</NavLink>
            </p>
          </>
        );

      case 'accessibility':
        return (
          <>
            <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm space-y-4 text-foreground/80 leading-relaxed mb-6">
              <p>
                TrailWeigh is committed to making its application usable by as many people as
                possible, including people with disabilities. We are continually working to
                improve the accessibility of the application.
              </p>
              <p className="text-sm text-muted-foreground">
                We do not claim formal accessibility certification or full compliance with
                a specific accessibility standard at this time.
              </p>
            </div>
            <h2 className="font-bold text-foreground mb-4">Current accessibility features</h2>
            <div className="space-y-3 mb-8">
              {[
                { label: 'Keyboard-accessible controls', desc: 'Core application controls — including toolbar buttons, category expand/collapse, gear-item fields, save dialogs, and the Locker panel — are operable using a keyboard.' },
                { label: 'Readable text sizes', desc: 'TrailWeigh uses text sizes intended to be readable at standard screen resolutions. Browser-level text-size adjustments are respected.' },
                { label: 'Colour contrast', desc: 'Text and interactive elements use colour combinations intended to maintain readability. The dark-mode and light-mode options allow users to choose the display that works best for them.' },
                { label: 'Labels and titles', desc: 'Icon-only controls include descriptive title attributes that surface in browser tooltips and are available to assistive technology.' },
                { label: 'Responsive layout', desc: 'The TrailWeigh interface adapts to different screen sizes, including tablet and mobile widths.' },
              ].map(({ label, desc }) => (
                <div key={label} className="flex gap-4 bg-card border border-card-border rounded-xl p-4 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0 mt-2" />
                  <div>
                    <p className="font-medium text-foreground text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <h2 className="font-bold text-foreground mb-4">Planned improvements</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              TrailWeigh is actively improving keyboard navigation, screen-reader support,
              and contrast across all parts of the application. Specific improvement details
              will be documented here as they are completed.
            </p>
            <div className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
              <h2 className="font-semibold text-foreground mb-1">Encountered an accessibility barrier?</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If something in TrailWeigh is preventing you from using it effectively, please{' '}
                <NavLink to="/contact">Contact Us</NavLink>{' '}
                or{' '}
                <NavLink to="/report-problem">Report a Problem</NavLink>. Accessibility barriers are treated as bugs and addressed as a priority.
              </p>
            </div>
          </>
        );

      default:
        return <p className="text-sm text-foreground/80">Content not available.</p>;
    }
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 60, background: PAGE_BG, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      {/* Sticky back bar */}
      <div style={{ position: 'sticky', top: 0, background: PAGE_BG, zIndex: 5, borderBottom: `1px solid ${DIVIDER}`, height: 48, display: 'flex', alignItems: 'center', padding: '0 16px', flexShrink: 0 }}>
        <button
          onClick={onBack}
          aria-label="Back"
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: NAV_ACTIVE, fontSize: 16, fontFamily: SANS, fontWeight: 500, padding: '4px 0' }}
        >
          <ChevronLeft size={20} strokeWidth={2.5}/> Back
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 40px' }}>
        {/* For about/help/how-it-works, the content component renders its own h1 */}
        {!contentOwnsTitle.has(pageId) && (
          <h1 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: PRIMARY, marginBottom: 16 }}>
            {pageTitles[pageId] ?? pageId}
          </h1>
        )}
        {renderContent()}
      </div>
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────────
export default function MobileFunctionalV3() {
  return (
    <UnitProvider>
      <MobileFunctionalV3Inner/>
    </UnitProvider>
  );
}

function MobileFunctionalV3Inner() {
  const { userId, isLoaded } = useAuth();
  const { system, setSystem } = useUnit();

  // ── Sandbox state ─────────────────────────────────────────────────────────────
  const [sandbox, setSandbox] = useState<SandboxStore>({ items: {}, order: [], meta: {} });
  const [sandboxReady, setSandboxReady] = useState(false);
  const [listName, setListName] = useState('Untitled List');

  // Undo/redo history
  const [undoHistory, setUndoHistory] = useState<SandboxStore[]>([]);
  const [redoHistory, setRedoHistory] = useState<SandboxStore[]>([]);
  const sandboxRef = useRef(sandbox);
  sandboxRef.current = sandbox;
  const originalSeedRef = useRef<SandboxStore | null>(null);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [activeNav, setActiveNav] = useState<ActiveNav>('list');
  // 027Q: full-screen navigation stack (replaces openSheet for hamburger/more/help/share)
  const [screenStack, setScreenStack] = useState<ScreenEntry[]>([{ screen: 'list' }]);
  const [showPlusSheet, setShowPlusSheet] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // 027Q navigation helpers
  const currentScreen = screenStack[screenStack.length - 1];
  const pushScreen = useCallback((entry: ScreenEntry) => setScreenStack(prev => [...prev, entry]), []);
  const popScreen = useCallback(() => setScreenStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev), []);

  // Category accordion
  const [openCatName, setOpenCatName] = useState<string | null>(null);
  const [allExpanded, setAllExpanded] = useState(false);
  const [expandedItem, setExpandedItem] = useState<{ cat: string; id: string } | null>(null);

  // Add category UI
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const newCatInputRef = useRef<HTMLInputElement>(null);

  // Checklist-use state (separate from item.checked — tracks trail progress only)
  const [checklistUse, setChecklistUse] = useState<Record<string, boolean>>({});

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Category reorder via Pointer Events
  const catListRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ catIdx: number; origOrder: string[] } | null>(null);
  const [dragSrcIdx, setDragSrcIdx] = useState<number | null>(null);
  const [dragDstIdx, setDragDstIdx] = useState<number | null>(null);

  // D2 — weight input local edit state (prevents intermediate value snapping)
  const [weightInputs, setWeightInputs] = useState<Record<string, string>>({});

  // D4 — share link state (showShareSheet replaced by screenStack 'share')
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // D5 — category options
  const [catOptionsFor, setCatOptionsFor] = useState<string | null>(null);
  const [catRenaming, setCatRenaming] = useState(false);
  const [catRenameValue, setCatRenameValue] = useState('');
  const [catDeleteConfirm, setCatDeleteConfirm] = useState(false);

  // D6 — item delete confirmation
  const [deleteItemConfirm, setDeleteItemConfirm] = useState<{ cat: string; id: string; name: string } | null>(null);

  // ── Helpers ───────────────────────────────────────────────────────────────────

  const showToast = useCallback((msg: string, ms = 3000) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), ms);
  }, []);

  /** Push current sandbox to undo, then apply updater.  Uses ref to avoid stale closures. */
  const mutateSandbox = useCallback((updater: (prev: SandboxStore) => SandboxStore) => {
    const current = sandboxRef.current;
    setUndoHistory(prev => [...prev.slice(-(HISTORY_LIMIT - 1)), current]);
    setRedoHistory([]);
    setSandbox(updater);
  }, []);

  // ── Seed sandbox from production localStorage (read-once on auth ready) ───────
  useEffect(() => {
    if (!isLoaded) return;
    const key = userId ? `pack-checklist-v5-${userId}` : 'pack-checklist-v5-guest';
    let seeded = false;
    let seed: SandboxStore = DEMO_SEED;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.items && Array.isArray(parsed.order) && parsed.order.length > 0) {
          seed = {
            items: parsed.items as PackState,
            order: parsed.order as string[],
            meta:  (parsed.meta ?? {}) as Record<string, CategoryMeta>,
          };
          seeded = true;
        }
      }
    } catch { /* parsing failed — fall through */ }
    if (!seeded) { seed = DEMO_SEED; setListName('Demo Pack List'); }
    const savedName = sessionStorage.getItem('tw-savedlist-entry-name');
    if (savedName) setListName(savedName);
    setSandbox(seed);
    originalSeedRef.current = seed;
    setSandboxReady(true);
  }, [isLoaded, userId]);

  // ── Sandbox mutations ─────────────────────────────────────────────────────────

  const updateItem = useCallback((category: string, id: string, updates: Partial<GearItem>) => {
    mutateSandbox(prev => ({
      ...prev,
      items: {
        ...prev.items,
        [category]: (prev.items[category] ?? []).map(item =>
          item.id === id ? { ...item, ...updates } : item
        ),
      },
    }));
  }, [mutateSandbox]);

  const moveItem = useCallback((src: string, dst: string, id: string) => {
    mutateSandbox(prev => {
      const srcItems = prev.items[src] ?? [];
      const item = srcItems.find(i => i.id === id);
      if (!item) return prev;
      return {
        ...prev,
        items: {
          ...prev.items,
          [src]: srcItems.filter(i => i.id !== id),
          [dst]: [...(prev.items[dst] ?? []), item],
        },
      };
    });
    setExpandedItem(null);
  }, [mutateSandbox]);

  const addItem = useCallback((category: string, prefill?: Partial<GearItem>) => {
    const newItem: GearItem = {
      id: crypto.randomUUID(),
      sub:        prefill?.sub ?? '',
      desc:       prefill?.desc ?? '',
      weightOz:   prefill?.weightOz ?? 0,
      qty:        prefill?.qty ?? 1,
      checked:    prefill?.checked ?? true,
      expendable: prefill?.expendable ?? false,
    };
    mutateSandbox(prev => ({
      ...prev,
      items: {
        ...prev.items,
        [category]: [...(prev.items[category] ?? []), newItem],
      },
    }));
  }, [mutateSandbox]);

  const addCategory = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed || sandbox.order.includes(trimmed)) return false;
    mutateSandbox(prev => ({
      ...prev,
      order: [...prev.order, trimmed],
      items: { ...prev.items, [trimmed]: [] },
      meta:  { ...prev.meta, [trimmed]: { countsToBase: true } },
    }));
    return true;
  }, [sandbox.order, mutateSandbox]);

  // ── Undo / Redo ───────────────────────────────────────────────────────────────

  const handleUndo = useCallback(() => {
    if (undoHistory.length === 0) return;
    const prev = undoHistory[undoHistory.length - 1];
    setRedoHistory(r => [...r, sandboxRef.current]);
    setUndoHistory(u => u.slice(0, -1));
    setSandbox(prev);
  }, [undoHistory]);

  const handleRedo = useCallback(() => {
    if (redoHistory.length === 0) return;
    const next = redoHistory[redoHistory.length - 1];
    setUndoHistory(u => [...u, sandboxRef.current]);
    setRedoHistory(r => r.slice(0, -1));
    setSandbox(next);
  }, [redoHistory]);

  // ── Reset ─────────────────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    const seed = originalSeedRef.current ?? DEMO_SEED;
    setUndoHistory(prev => [...prev.slice(-(HISTORY_LIMIT - 1)), sandboxRef.current]);
    setRedoHistory([]);
    setSandbox(seed);
    setOpenCatName(null);
    setAllExpanded(false);
    setExpandedItem(null);
    showToast('Reset to original data');
  }, [showToast]);

  // ── Save (creates a new Locker entry — additive, does not overwrite active store) ──

  const handleSave = useCallback(() => {
    const now = new Date();
    const name = `${listName} — ${now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ${now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
    const entry: LockerEntry = {
      id: crypto.randomUUID(),
      name,
      savedAt: Date.now(),
      store: {
        items: sandboxRef.current.items,
        order: sandboxRef.current.order,
        meta:  sandboxRef.current.meta,
        // LockerEntry.store also has Background fields — not relevant here
      } as LockerEntry['store'],
      background:  null,
      bgFade:      0.3,
      bgTone:      'light',
    };
    appendLockerEntry(entry);
    showToast(`Saved as "${name}"`);
  }, [listName, showToast]);

  // ── Share — 027Q: navigate to full-screen Share view, then generate link ─────

  const navigateToShare = useCallback(() => {
    setShareLink(null);
    setShareCopied(false);
    setShareLoading(true);
    setScreenStack(prev => [...prev, { screen: 'share' }]);
    const payload: SharePayload = {
      type: 'pack-list',
      data: sandboxRef.current.items,
      categoryOrder: sandboxRef.current.order,
      categoryMeta: sandboxRef.current.meta,
      unit: system,
      name: listName,
    };
    void buildShareURL(payload).then(url => {
      setShareLoading(false);
      if (url) {
        setShareLink(url);
      } else {
        showToast('Share failed — sign in required or server unavailable');
      }
    });
  }, [system, listName, showToast]);

  // ── Print (downloads PDF and opens browser print) ────────────────────────────

  const handlePrint = useCallback(() => {
    try {
      generatePackPDF(
        sandboxRef.current.items,
        system,
        sandboxRef.current.order,
        sandboxRef.current.meta,
      );
      showToast('Print: download PDF then print from your device');
    } catch {
      showToast('Print failed');
    }
    // Also trigger browser print for the current page (the overlay shows filtered list)
    window.print();
  }, [system, showToast]);

  // ── Checklist handlers ────────────────────────────────────────────────────────

  const handleChecklistToggle = useCallback((id: string) => {
    setChecklistUse(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleChecklistClear = useCallback(() => setChecklistUse({}), []);

  // ── Category accordion ────────────────────────────────────────────────────────

  const handleCatToggle = useCallback((catName: string) => {
    if (allExpanded) {
      // Exit expand-all; the tapped category stays open (single-open mode resumes)
      setAllExpanded(false);
      setOpenCatName(catName);
      setExpandedItem(prev => prev?.cat !== catName ? null : prev);
    } else {
      const closing = openCatName === catName;
      setOpenCatName(closing ? null : catName);
      if (closing) setExpandedItem(prev => prev?.cat === catName ? null : prev);
    }
  }, [allExpanded, openCatName]);

  const handleExpandAll = useCallback(() => {
    setAllExpanded(true);
    setOpenCatName(null);
  }, []);

  const handleCollapseAll = useCallback(() => {
    setAllExpanded(false);
    setOpenCatName(null);
    setExpandedItem(null);
  }, []);

  const isCatOpen = (catName: string) => allExpanded || openCatName === catName;

  // ── Item expand/collapse ──────────────────────────────────────────────────────

  const handleItemToggle = useCallback((cat: string, id: string) => {
    setExpandedItem(prev => prev?.cat === cat && prev?.id === id ? null : { cat, id });
  }, []);

  // ── Add category ──────────────────────────────────────────────────────────────

  const handleAddCategoryConfirm = useCallback(() => {
    const ok = addCategory(newCatName);
    if (ok) {
      setNewCatName('');
      setShowAddCat(false);
      showToast(`Category "${newCatName.trim()}" added`);
    } else {
      showToast('Category name already exists or is empty');
    }
  }, [addCategory, newCatName, showToast]);

  // ── Scanner: resolve category alias then addItem to sandbox ──────────────────

  const handleScannerAddItem = useCallback((category: string, prefill: Partial<GearItem>) => {
    // resolveDestination finds the best matching existing category
    const resolved = resolveDestination(category, sandboxRef.current.order) ?? category;
    // If the resolved category doesn't exist yet, create it
    if (!sandboxRef.current.order.includes(resolved)) {
      mutateSandbox(prev => ({
        ...prev,
        order: [...prev.order, resolved],
        items: { ...prev.items, [resolved]: [] },
        meta:  { ...prev.meta, [resolved]: { countsToBase: true } },
      }));
    }
    addItem(resolved, prefill);
  }, [addItem, mutateSandbox]);

  // ── Category reorder via Pointer Events ──────────────────────────────────────

  const handleGripPointerDown = useCallback((e: React.PointerEvent, catIdx: number) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      catIdx,
      origOrder: [...sandboxRef.current.order],
    };
    setDragSrcIdx(catIdx);
    setDragDstIdx(catIdx);
  }, []);

  // D1 FIX: use actual element midpoints instead of fixed catHeight
  // This handles mixed-height categories (expanded vs collapsed) correctly
  const handleGripPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const container = catListRef.current;
    if (!container) return;
    const children = Array.from(container.children) as HTMLElement[];
    let newIdx = 0;
    for (let i = 0; i < children.length; i++) {
      const rect = children[i].getBoundingClientRect();
      if (e.clientY >= rect.top + rect.height / 2) newIdx = i;
    }
    newIdx = Math.max(0, Math.min(dragRef.current.origOrder.length - 1, newIdx));
    setDragDstIdx(newIdx);
  }, []);

  const handleGripPointerUp = useCallback((_e: React.PointerEvent) => {
    if (!dragRef.current || dragDstIdx === null) {
      setDragSrcIdx(null); setDragDstIdx(null); dragRef.current = null; return;
    }
    const { catIdx, origOrder } = dragRef.current;
    if (catIdx !== dragDstIdx) {
      const newOrder = [...origOrder];
      const [moved] = newOrder.splice(catIdx, 1);
      newOrder.splice(dragDstIdx, 0, moved);
      mutateSandbox(prev => ({ ...prev, order: newOrder }));
      showToast('Category order saved');
    }
    setDragSrcIdx(null); setDragDstIdx(null); dragRef.current = null;
  }, [dragDstIdx, mutateSandbox, showToast]);

  // Visible order during drag reorder
  const visibleOrder: string[] = (dragSrcIdx !== null && dragDstIdx !== null && dragRef.current)
    ? (() => {
        const order = [...dragRef.current.origOrder];
        const [moved] = order.splice(dragSrcIdx, 1);
        order.splice(dragDstIdx, 0, moved);
        return order;
      })()
    : sandbox.order;

  // ── Help / About — 027Q: navigate to More (footer) which contains Help link ──
  // handleHelp removed; Help accessible via More → Footer → Help & How-To

  // ── D5 — Sandbox category mutations ──────────────────────────────────────────

  const sandboxDeleteCategory = useCallback((name: string) => {
    mutateSandbox(prev => {
      const newItems = { ...prev.items };
      delete newItems[name];
      const newMeta = { ...prev.meta };
      delete newMeta[name];
      return { items: newItems, meta: newMeta, order: prev.order.filter(c => c !== name) };
    });
    // Close any open accordion for deleted category
    setOpenCatName(prev => prev === name ? null : prev);
    setExpandedItem(prev => prev?.cat === name ? null : prev);
  }, [mutateSandbox]);

  const sandboxRenameCategory = useCallback((oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    mutateSandbox(prev => {
      if (prev.order.includes(trimmed)) { showToast('Category name already exists'); return prev; }
      const order = prev.order.map(c => c === oldName ? trimmed : c);
      const newItems: PackState = {};
      const newMeta: Record<string, CategoryMeta> = {};
      prev.order.forEach(cat => {
        const key = cat === oldName ? trimmed : cat;
        newItems[key] = prev.items[cat] ?? [];
        newMeta[key]  = prev.meta[cat] ?? { countsToBase: true };
      });
      return { items: newItems, order, meta: newMeta };
    });
    setOpenCatName(prev => prev === oldName ? trimmed : prev);
    setExpandedItem(prev => prev?.cat === oldName ? { ...prev, cat: trimmed } : prev);
    showToast(`Renamed to "${trimmed}"`);
  }, [mutateSandbox, showToast]);

  // ── D6 — Sandbox item remove ──────────────────────────────────────────────────

  const sandboxRemoveItem = useCallback((cat: string, id: string) => {
    mutateSandbox(prev => ({
      ...prev,
      items: { ...prev.items, [cat]: (prev.items[cat] ?? []).filter(i => i.id !== id) },
    }));
    setChecklistUse(prev => { const next = { ...prev }; delete next[id]; return next; });
    setExpandedItem(prev => (prev?.cat === cat && prev?.id === id) ? null : prev);
  }, [mutateSandbox]);

  // ── Derived summary metrics ───────────────────────────────────────────────────

  const allItems       = sandbox.order.flatMap(cat => sandbox.items[cat] ?? []);
  const totalItems     = allItems.length;
  const selectedCount  = allItems.filter(i => i.checked).length;
  const notSelectedCount = totalItems - selectedCount;
  const catCount       = sandbox.order.length;
  const su             = smallUnit(system);

  // ── Loading state ─────────────────────────────────────────────────────────────

  if (!sandboxReady) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', background: PAGE_BG, color: SECONDARY, fontFamily: SANS }}>
        Loading preview…
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100dvh', background: '#DDD8CF', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <div style={{
        width: '100%', maxWidth: 430, height: '100dvh',
        background: PAGE_BG, display: 'flex', flexDirection: 'column',
        fontFamily: SANS, position: 'relative',
      }}>

        {/* ── APP BAR ── */}
        <div style={{
          height: 52, background: HEADER_BG, borderBottom: `1px solid ${HEADER_BDR}`,
          display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10,
          flexShrink: 0, zIndex: 10,
        }}>
          {/* Hamburger */}
          <button
            aria-label="Open menu"
            aria-expanded={currentScreen.screen === 'menu'}
            onClick={() => pushScreen({ screen: 'menu' })}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center' }}
          >
            <Menu size={22} color={SECONDARY} strokeWidth={1.8}/>
          </button>

          {/* Logo + wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
            <LogoMark size={24}/>
            <span style={{ fontSize: 19, fontWeight: 600, color: PRIMARY, letterSpacing: '0.1px', fontFamily: SERIF }}>
              TrailWeigh
            </span>
          </div>

          {/* Search circle — FUTURE FUNCTION */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              aria-label="Search (not yet available)"
              aria-disabled="true"
              title="GLOBAL SEARCH = FUTURE FUNCTION — no current search implemented"
              style={{
                width: 34, height: 34, borderRadius: 17, background: '#FFFFFF',
                boxShadow: '0 1px 4px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'not-allowed', flexShrink: 0, opacity: 0.5,
              }}
            >
              <Search size={17} color={SECONDARY} strokeWidth={1.8}/>
            </div>

            {/* FAB — opens + creation sheet */}
            <button
              aria-label="Create or import — Start / Create"
              aria-expanded={showPlusSheet}
              onClick={() => setShowPlusSheet(true)}
              style={{
                width: 34, height: 34, borderRadius: 17, background: NAV_ACTIVE,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0, border: 'none',
              }}
            >
              <Plus size={18} color="#fff" strokeWidth={2.4}/>
            </button>
          </div>
        </div>

        {/* ── SCROLLABLE CONTENT ── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>

          {/* ── STICKY HEADER: FILE NAME BAR + PACK SUMMARY (027U) ── */}
          <div style={{ position: 'sticky', top: 0, zIndex: 4, background: PAGE_BG }}>

            {/* ── FILE NAME BAR (027U: compact, actual name, no category count) ── */}
            <div style={{ position: 'relative', padding: '6px 16px 6px', overflow: 'hidden' }}>
              <LandscapeDecoration/>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 16.5, fontWeight: 500, color: PRIMARY, letterSpacing: '0px' }}>
                    {listName || 'Untitled List'}
                  </span>
                  {/* No accordion chevron — Locker bottom nav is the list-switch action */}
                </div>
              </div>
            </div>

            {/* ── PACK SUMMARY CARD (027U: category count added above Selected) ── */}
            <div style={{ paddingBottom: 10 }}>
              <div style={{
                margin: '0 16px', borderRadius: 16, background: SUMMARY_BG,
                padding: '10px 14px 10px 14px', display: 'flex', alignItems: 'center',
                gap: 14, boxShadow: '0 2px 10px rgba(42,87,64,0.28)',
              }}>
                {/* Icon tile — unchanged */}
                <div style={{
                  width: 66, height: 66, borderRadius: 14, background: 'rgba(0,0,0,0.20)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Luggage size={34} color="rgba(255,255,255,0.90)" strokeWidth={1.4}/>
                </div>
                {/* Left: label + total count */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '1.1px',
                    color: 'rgba(255,255,255,0.52)', textTransform: 'uppercase', marginBottom: 2,
                  }}>
                    LIST SUMMARY
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, lineHeight: 1 }}>
                    <span style={{ fontSize: 40, fontWeight: 800, color: SUMMARY_TEXT, letterSpacing: '-1.5px', lineHeight: 1 }}>
                      {totalItems}
                    </span>
                    <span style={{ fontSize: 17, fontWeight: 500, color: 'rgba(255,255,255,0.78)' }}>
                      items
                    </span>
                  </div>
                </div>
                {/* Right: categories / selected / not selected stacked (027U) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, alignSelf: 'center' }}>
                  {/* Category count — top of right stack */}
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.58)', whiteSpace: 'nowrap', letterSpacing: '0.2px' }}>
                    {catCount} {catCount === 1 ? 'category' : 'categories'}
                  </span>
                  {/* Selected */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: 9,
                      background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.50)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Check size={9} color="rgba(255,255,255,0.92)" strokeWidth={2.5}/>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: SUMMARY_TEXT, whiteSpace: 'nowrap' }}>
                      {selectedCount} Selected
                    </span>
                  </div>
                  {/* Not Selected */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 9, border: '1.5px solid rgba(255,255,255,0.38)', background: 'transparent', flexShrink: 0 }}/>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.78)', whiteSpace: 'nowrap' }}>
                      {notSelectedCount} Not Selected
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>{/* end sticky header (027U) */}

          {/* ── CATEGORY STACK ── */}
          <div
            ref={catListRef}
            style={{ padding: '4px 16px 8px', display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            {visibleOrder.map((catName, catIdx) => {
              const items   = sandbox.items[catName] ?? [];
              const isOpen  = isCatOpen(catName);
              const theme   = getCategoryTheme(catName, catIdx);
              const isDragging = dragSrcIdx === catIdx;

              const selectedInCat = items.filter(i => i.checked).length;
              const catTotalOz = items
                .filter(i => i.checked)
                .reduce((s, i) => s + calcTotalOz(i.weightOz, i.qty), 0);

              return (
                <div key={catName} style={{
                  borderRadius: 14, overflow: 'hidden',
                  background: CARD_BG, border: `1px solid ${CARD_BORDER}`,
                  boxShadow: isDragging
                    ? '0 6px 24px rgba(0,0,0,0.22), 0 0 0 2px rgba(42,87,64,0.25)'
                    : CARD_SHADOW,
                  opacity: isDragging ? 0.85 : 1,
                  transform: isDragging ? 'scale(1.01)' : 'none',
                  transition: 'box-shadow 0.1s, opacity 0.1s, transform 0.1s',
                }}>

                  {/* ── CATEGORY HEADER ── */}
                  <div style={{ display: 'flex', alignItems: 'stretch', minHeight: CARD_H }}>

                    {/* WEDGE / ICON — PRIMARY ACCORDION TRIGGER */}
                    <button
                      onClick={() => handleCatToggle(catName)}
                      aria-expanded={isOpen}
                      aria-label={`${isOpen ? 'Close' : 'Open'} ${catName} category`}
                      style={{
                        width: WEDGE_W, minHeight: CARD_H,
                        background: theme.bg,
                        clipPath: `polygon(0 0, calc(100% - ${WEDGE_POINT}px) 0, 100% 50%, calc(100% - ${WEDGE_POINT}px) 100%, 0 100%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, paddingRight: WEDGE_POINT / 2,
                        border: 'none', cursor: 'pointer', outline: 'none', boxShadow: 'none',
                      }}
                      onFocus={e => { e.currentTarget.style.outline = '2px solid rgba(255,255,255,0.6)'; e.currentTarget.style.outlineOffset = '-3px'; }}
                      onBlur={e => { e.currentTarget.style.outline = 'none'; }}
                    >
                      <theme.Icon size={26} color="rgba(255,255,255,0.93)" strokeWidth={1.5} aria-hidden="true"/>
                    </button>

                    {/* CONTENT grid: [text] [handle-slot 32px] [gap 18px] [weight minmax(44px,auto)] */}
                    <div style={{
                      flex: 1, minWidth: 0,
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 1fr) 32px 18px minmax(44px, auto)',
                      alignItems: 'center',
                      padding: '10px 12px',
                      columnGap: 0,
                    }}>
                      {/* Col 1 — name + subtitle (tap name → Category Options) */}
                      <div style={{ minWidth: 0 }}>
                        <button
                          onClick={e => { e.stopPropagation(); setCatOptionsFor(catName); setCatRenaming(false); setCatDeleteConfirm(false); setCatRenameValue(catName); }}
                          aria-label={`Category options for ${catName}`}
                          title="Tap for category options (rename/delete)"
                          style={{
                            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                            textAlign: 'left', width: '100%', maxWidth: '100%',
                          }}
                        >
                          <div style={{
                            fontSize: 17, fontWeight: 500, color: PRIMARY,
                            lineHeight: 1.2, marginBottom: 2, letterSpacing: '-0.1px',
                            fontFamily: SERIF,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {catName}
                          </div>
                        </button>
                        <div style={{ fontSize: 12.5, color: MUTED }}>
                          {items.length} {items.length === 1 ? 'item' : 'items'} · {selectedInCat} selected
                        </div>
                      </div>

                      {/* Col 2 — six-dot category reorder handle (Pointer Events) */}
                      <button
                        aria-label={`Drag to reorder ${catName} category`}
                        aria-grabbed={dragSrcIdx === catIdx ? 'true' : 'false'}
                        title="Hold and drag to reorder category"
                        onPointerDown={e => handleGripPointerDown(e, catIdx)}
                        onPointerMove={handleGripPointerMove}
                        onPointerUp={handleGripPointerUp}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'none', border: 'none', padding: 0,
                          cursor: 'grab', touchAction: 'none',
                          opacity: dragSrcIdx === catIdx ? 0.8 : 0.38,
                        }}
                        onFocus={e => { e.currentTarget.style.opacity = '0.8'; }}
                        onBlur={e => { e.currentTarget.style.opacity = dragSrcIdx === catIdx ? '0.8' : '0.38'; }}
                      >
                        <GripVertical size={18} color={SECONDARY} strokeWidth={1.5}/>
                      </button>

                      {/* Col 3 — gap */}
                      <div aria-hidden="true"/>

                      {/* Col 4 — selected-weight */}
                      <div style={{
                        textAlign: 'right',
                        fontSize: 13, fontWeight: 600, color: PRIMARY, letterSpacing: '-0.2px',
                        whiteSpace: 'nowrap',
                        visibility: catTotalOz > 0 ? 'visible' : 'hidden',
                      }}>
                        {catTotalOz > 0 ? `${formatWeight(catTotalOz, system, 'small')} ${su}` : '—'}
                      </div>
                    </div>
                  </div>

                  {/* ── ITEM ROWS (when open) ── */}
                  {isOpen && items.length === 0 && (
                    <div style={{ borderTop: `1px solid ${DIVIDER}`, padding: '12px 14px', fontSize: 13.5, color: MUTED, fontStyle: 'italic' }}>
                      No items
                    </div>
                  )}

                  {isOpen && items.length > 0 && (
                    <div style={{ borderTop: `1px solid ${DIVIDER}` }}>
                      {items.map((item, itemIdx) => {
                        const isExpanded  = expandedItem?.cat === catName && expandedItem?.id === item.id;
                        const isLast      = itemIdx === items.length - 1;
                        const totalOz     = calcTotalOz(item.weightOz, item.qty);
                        const otherCats   = sandbox.order.filter(c => c !== catName);
                        const displayName = item.desc || item.sub || 'Unnamed item';

                        const weightDisplay = system === 'metric'
                          ? +((item.weightOz) * 28.3495).toFixed(1)
                          : +item.weightOz.toFixed(2);

                        return (
                          <div key={item.id}>

                            {/* ITEM ROW — body tap expands detail; checkbox stops propagation */}
                            <div
                              role="button"
                              tabIndex={0}
                              aria-expanded={isExpanded}
                              aria-label={`${displayName} — ${isExpanded ? 'collapse' : 'expand'} details`}
                              onClick={() => handleItemToggle(catName, item.id)}
                              onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleItemToggle(catName, item.id); } }}
                              style={{
                                display: 'flex', alignItems: 'center',
                                padding: '0 14px', height: 44, gap: 10,
                                borderBottom: (isLast && !isExpanded) ? 'none' : `1px solid ${DIVIDER}`,
                                background: CARD_BG, cursor: 'pointer',
                              }}
                            >
                              {/* Main-list inclusion checkbox — stopPropagation prevents row expand */}
                              <div
                                role="checkbox"
                                aria-checked={item.checked}
                                aria-label={`${displayName} ${item.checked ? 'selected for checklist' : 'not selected'}`}
                                tabIndex={-1}
                                onClick={e => { e.stopPropagation(); updateItem(catName, item.id, { checked: !item.checked }); }}
                                onKeyDown={e => { e.stopPropagation(); if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); updateItem(catName, item.id, { checked: !item.checked }); } }}
                                style={{
                                  width: 20, height: 20, borderRadius: 5,
                                  border: `1.5px solid ${item.checked ? CB_CHECKED : CB_UNCHECKED}`,
                                  background: item.checked ? CB_CHECKED : 'transparent',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  flexShrink: 0, cursor: 'pointer',
                                }}
                              >
                                {item.checked && <Check size={11} color="#fff" strokeWidth={2.5}/>}
                              </div>

                              {/* Item name */}
                              <div style={{
                                flex: 1, fontSize: 14.5, fontWeight: 450, color: PRIMARY,
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              }}>
                                {displayName}
                              </div>

                              {/* Quantity */}
                              <span style={{ fontSize: 14, color: SECONDARY, flexShrink: 0 }}>
                                {item.qty}
                              </span>

                              {/* D6 — Trash icon immediately after Qty */}
                              <button
                                onClick={e => { e.stopPropagation(); setDeleteItemConfirm({ cat: catName, id: item.id, name: displayName }); }}
                                onPointerDown={e => e.stopPropagation()}
                                aria-label={`Delete ${displayName}`}
                                title={`Delete "${displayName}" from this list`}
                                style={{
                                  background: 'none', border: 'none', cursor: 'pointer',
                                  padding: '4px 2px', flexShrink: 0, lineHeight: 1,
                                  display: 'flex', alignItems: 'center',
                                  color: '#c0392b', opacity: 0.55,
                                }}
                              >
                                <Trash2 size={14} strokeWidth={1.8}/>
                              </button>
                            </div>

                            {/* EXPANDED DETAIL PANEL */}
                            {isExpanded && (
                              <div style={{
                                background: DETAIL_BG,
                                borderBottom: isLast ? 'none' : `1px solid ${DIVIDER}`,
                              }}>

                                {/* Weight — D2 FIX: local edit state prevents intermediate-value snapping */}
                                <div style={{
                                  display: 'flex', alignItems: 'center',
                                  padding: '0 14px', height: 42, gap: 10,
                                  borderBottom: `1px solid ${DETAIL_BDR}`,
                                }}>
                                  <Hash size={14} color={MUTED} strokeWidth={1.8} aria-hidden="true"/>
                                  <div style={{ flex: 1, fontSize: 13.5, color: SECONDARY }}>Weight</div>
                                  <input
                                    type="number"
                                    inputMode="decimal"
                                    min={0}
                                    step={system === 'metric' ? 1 : 0.1}
                                    value={item.id in weightInputs ? weightInputs[item.id] : weightDisplay.toString()}
                                    aria-label={`Weight of ${displayName} in ${su}`}
                                    onFocus={() => {
                                      setWeightInputs(prev => ({ ...prev, [item.id]: weightDisplay.toString() }));
                                    }}
                                    onChange={e => {
                                      // Store raw string — allow empty / decimal in-progress (e.g. "1." or "")
                                      setWeightInputs(prev => ({ ...prev, [item.id]: e.target.value }));
                                    }}
                                    onBlur={e => {
                                      // Commit on blur — parse and write to sandbox
                                      const raw = e.target.value;
                                      const num = parseFloat(raw);
                                      if (!isNaN(num) && num >= 0) {
                                        updateItem(catName, item.id, {
                                          weightOz: system === 'metric' ? gramsToOz(num) : num,
                                        });
                                      }
                                      // Clear local edit state — revert to derived display value
                                      setWeightInputs(prev => { const n = { ...prev }; delete n[item.id]; return n; });
                                    }}
                                    style={{
                                      width: 72, textAlign: 'right', fontSize: 13.5,
                                      fontWeight: 500, color: PRIMARY,
                                      border: `1px solid ${CARD_BORDER}`, borderRadius: 6,
                                      padding: '2px 6px', background: '#fff',
                                      fontFamily: SANS,
                                    }}
                                  />
                                  <span style={{ fontSize: 13, color: MUTED, minWidth: 22, textAlign: 'left' }}>{su}</span>
                                </div>

                                {/* Quantity */}
                                <div style={{
                                  display: 'flex', alignItems: 'center',
                                  padding: '0 14px', height: 42, gap: 10,
                                  borderBottom: `1px solid ${DETAIL_BDR}`,
                                }}>
                                  <PackageOpen size={14} color={MUTED} strokeWidth={1.8} aria-hidden="true"/>
                                  <div style={{ flex: 1, fontSize: 13.5, color: SECONDARY }}>Quantity</div>
                                  <select
                                    value={item.qty}
                                    aria-label={`Quantity of ${displayName}`}
                                    onChange={e => updateItem(catName, item.id, { qty: parseInt(e.target.value, 10) })}
                                    style={{
                                      fontSize: 13.5, fontWeight: 500, color: PRIMARY,
                                      border: `1px solid ${CARD_BORDER}`, borderRadius: 6,
                                      padding: '2px 8px', background: '#fff',
                                      fontFamily: SANS,
                                    }}
                                  >
                                    {QTY_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                                  </select>
                                </div>

                                {/* Total (derived) */}
                                <div style={{
                                  display: 'flex', alignItems: 'center',
                                  padding: '0 14px', height: 42, gap: 10,
                                  borderBottom: `1px solid ${DETAIL_BDR}`,
                                }}>
                                  <Check size={14} color={MUTED} strokeWidth={1.8} aria-hidden="true"/>
                                  <div style={{ flex: 1, fontSize: 13.5, color: SECONDARY }}>Total</div>
                                  <div style={{ fontSize: 13.5, fontWeight: 500, color: PRIMARY }}>
                                    {formatWeight(totalOz, system, 'small')} {su}
                                  </div>
                                </div>

                                {/* Move */}
                                {otherCats.length > 0 && (
                                  <div style={{
                                    display: 'flex', alignItems: 'center',
                                    padding: '0 14px', height: 42, gap: 10,
                                    borderBottom: `1px solid ${DETAIL_BDR}`,
                                  }}>
                                    <ArrowRightLeft size={14} color={MUTED} strokeWidth={1.8} aria-hidden="true"/>
                                    <div style={{ flex: 1, fontSize: 13.5, color: SECONDARY }}>Move</div>
                                    <select
                                      value=""
                                      aria-label={`Move ${displayName} to another category`}
                                      onChange={e => { if (e.target.value) moveItem(catName, e.target.value, item.id); }}
                                      style={{
                                        fontSize: 13.5, fontWeight: 500, color: PRIMARY,
                                        border: `1px solid ${CARD_BORDER}`, borderRadius: 6,
                                        padding: '2px 8px', background: '#fff',
                                        maxWidth: 140, fontFamily: SANS,
                                      }}
                                    >
                                      <option value="">Move to…</option>
                                      {otherCats.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                  </div>
                                )}

                                {/* Photo row — BELOW Move — visual reservation (disabled, pending backend) */}
                                <div
                                  aria-disabled="true"
                                  title="Photos not enabled yet — item photo backend pending implementation"
                                  style={{
                                    display: 'flex', alignItems: 'center',
                                    padding: '0 14px', height: 42, gap: 10,
                                    opacity: 0.4, cursor: 'not-allowed',
                                  }}
                                >
                                  <Camera size={14} color={MUTED} strokeWidth={1.8} aria-hidden="true"/>
                                  <div style={{ flex: 1, fontSize: 13.5, color: SECONDARY }}>Photo</div>
                                  <div style={{ fontSize: 12, color: MUTED, fontStyle: 'italic' }}>
                                    Photos not enabled yet
                                  </div>
                                </div>

                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Add Item button — contextual within open category */}
                      <div style={{ borderTop: `1px solid ${DIVIDER}`, padding: '8px 14px' }}>
                        <button
                          onClick={() => {
                            addItem(catName);
                            // Open the new item for editing (last item)
                            setExpandedItem({ cat: catName, id: '' }); // will be set after state update
                          }}
                          aria-label={`Add item to ${catName}`}
                          title="Add a new item to this category"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: 13.5, color: NAV_ACTIVE, fontWeight: 500,
                            padding: '4px 0', fontFamily: SANS,
                          }}
                        >
                          <Plus size={15} color={NAV_ACTIVE} strokeWidth={2.2}/>
                          Add Item
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Empty state */}
            {sandbox.order.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 24px', color: MUTED, fontSize: 14 }}>
                <div style={{ marginBottom: 8, fontSize: 22 }}>📋</div>
                <div>No list data found.</div>
                <div style={{ fontSize: 12.5, marginTop: 4 }}>Your gear list will appear here.</div>
              </div>
            )}

            {/* Add Category — contextual, below category stack */}
            <div style={{ marginTop: 4 }}>
              {showAddCat ? (
                <div style={{
                  background: CARD_BG, borderRadius: 12, border: `1px solid ${CARD_BORDER}`,
                  boxShadow: CARD_SHADOW, padding: '12px 14px',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <input
                    ref={newCatInputRef}
                    type="text"
                    value={newCatName}
                    placeholder="Category name…"
                    aria-label="New category name"
                    onChange={e => setNewCatName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddCategoryConfirm();
                      if (e.key === 'Escape') { setShowAddCat(false); setNewCatName(''); }
                    }}
                    autoFocus
                    style={{
                      flex: 1, fontSize: 14, color: PRIMARY, fontFamily: SANS,
                      border: `1px solid ${CARD_BORDER}`, borderRadius: 8, padding: '7px 10px',
                      background: PAGE_BG, outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleAddCategoryConfirm}
                    aria-label="Confirm add category"
                    style={{
                      background: NAV_ACTIVE, color: '#fff', border: 'none',
                      borderRadius: 8, padding: '7px 14px', cursor: 'pointer',
                      fontSize: 13.5, fontWeight: 600, fontFamily: SANS,
                    }}
                  >
                    Add
                  </button>
                  <button
                    onClick={() => { setShowAddCat(false); setNewCatName(''); }}
                    aria-label="Cancel add category"
                    style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    <X size={18} color={MUTED} strokeWidth={1.8}/>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setShowAddCat(true);
                    setTimeout(() => newCatInputRef.current?.focus(), 50);
                  }}
                  aria-label="Add a new category to this list"
                  title="Add new category"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: 'none', border: `1.5px dashed ${MUTED}`,
                    borderRadius: 12, padding: '12px 14px', cursor: 'pointer', width: '100%',
                    fontSize: 13.5, color: MUTED, fontFamily: SANS,
                  }}
                >
                  <Plus size={15} color={MUTED} strokeWidth={2}/>
                  Add Category
                </button>
              )}
            </div>

            {/* Bottom padding */}
            <div style={{ height: 24 }}/>
          </div>

        </div>{/* end scrollable */}

        {/* ── BOTTOM NAV ── */}
        <BottomNavBar
          active={activeNav}
          onSelect={tab => setActiveNav(tab)}
          onMore={() => pushScreen({ screen: 'footer' })}
        />

        {/* ── OVERLAYS (rendered as absolute children of the phone frame) ── */}

        {/* Locker overlay */}
        {activeNav === 'locker' && (
          <LockerOverlay
            onLoad={newStore => {
              mutateSandbox(() => newStore);
              setActiveNav('list');
            }}
            onSave={handleSave}
            onClose={() => setActiveNav('list')}
          />
        )}

        {/* Summary overlay */}
        {activeNav === 'summary' && (
          <SummaryOverlay
            sandbox={sandbox}
            onClose={() => setActiveNav('list')}
          />
        )}

        {/* Checklist overlay */}
        {showChecklist && (
          <ChecklistOverlay
            sandbox={sandbox}
            system={system}
            checklistUse={checklistUse}
            onToggle={handleChecklistToggle}
            onClear={handleChecklistClear}
            onPrint={handlePrint}
            onShare={navigateToShare}
            onClose={() => setShowChecklist(false)}
          />
        )}

        {/* Scanner overlay */}
        {showScanner && (
          <ScannerOverlay
            categoryOrder={sandbox.order}
            onAddItem={handleScannerAddItem}
            onClose={() => setShowScanner(false)}
          />
        )}

        {/* Toast */}
        {toast && <Toast message={toast}/>}

        {/* ── 027Q: FULL-SCREEN OVERLAYS (inside phone frame — constrained to 430px) ── */}

        {/* Hamburger Menu */}
        {currentScreen.screen === 'menu' && (
          <FullScreenMenu
            onBack={popScreen}
            system={system}
            setSystem={setSystem}
            canUndo={undoHistory.length > 0}
            canRedo={redoHistory.length > 0}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onReset={handleReset}
            onSave={() => { handleSave(); }}
            onPrint={handlePrint}
            onNavigateToShare={() => { popScreen(); navigateToShare(); }}
            onChecklist={() => { popScreen(); setShowChecklist(true); }}
            onExpandAll={handleExpandAll}
            onCollapseAll={handleCollapseAll}
            isAuthenticated={!!userId}
          />
        )}

        {/* More / Footer */}
        {currentScreen.screen === 'footer' && (
          <FullScreenFooter
            onBack={popScreen}
            onNavigateToPage={(id: FooterPageId) => {
              if (id === 'sources') {
                pushScreen({ screen: 'sources' });
              } else {
                pushScreen({ screen: 'footer-page', footerPageId: id });
              }
            }}
            isAuthenticated={!!userId}
          />
        )}

        {/* Footer page */}
        {currentScreen.screen === 'footer-page' && currentScreen.footerPageId && (
          <FooterPageView
            pageId={currentScreen.footerPageId}
            onBack={popScreen}
            isAuthenticated={!!userId}
            navigate={(path) => {
              const id = path.replace(/^\//, '') as FooterPageId;
              pushScreen({ screen: 'footer-page', footerPageId: id });
            }}
            onOpenSources={(_refId) => pushScreen({ screen: 'sources' })}
          />
        )}

        {/* Share */}
        {currentScreen.screen === 'share' && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 50,
            background: PAGE_BG, display: 'flex', flexDirection: 'column',
            fontFamily: SANS,
          }}>
            {/* Back bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 16px 12px', borderBottom: `1px solid ${CARD_BORDER}`,
              background: '#fff', flexShrink: 0,
            }}>
              <button
                aria-label="Back"
                onClick={() => { popScreen(); setShareLink(null); setShareCopied(false); }}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: NAV_ACTIVE, fontSize: 15, fontWeight: 600, fontFamily: SANS }}
              >
                <ChevronLeft size={20} strokeWidth={2.2}/> Back
              </button>
              <div style={{ flex: 1 }}/>
              <span style={{ fontSize: 16, fontWeight: 700, color: PRIMARY, fontFamily: SERIF }}>Share This List</span>
              <div style={{ flex: 1 }}/>
            </div>
            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 32px' }}>
              {shareLoading ? (
                <div style={{ textAlign: 'center', paddingTop: 48, color: MUTED, fontSize: 14 }}>
                  <div style={{ marginBottom: 12, fontSize: 28 }}>⏳</div>
                  Generating share link…
                </div>
              ) : shareLink ? (
                <>
                  <p style={{ fontSize: 13.5, color: SECONDARY, marginBottom: 16, lineHeight: 1.55 }}>
                    Reviewers can make temporary changes in their own review session. Your original list is not changed.
                  </p>
                  <div style={{
                    background: '#f5f7f5', border: `1px solid ${CARD_BORDER}`, borderRadius: 10,
                    padding: '12px 14px', fontSize: 12.5, color: PRIMARY, wordBreak: 'break-all',
                    marginBottom: 16, fontFamily: 'monospace',
                  }}>
                    {shareLink}
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
                    <button
                      onClick={() => { void navigator.clipboard.writeText(shareLink).then(() => setShareCopied(true)); }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        background: shareCopied ? '#16a34a' : NAV_ACTIVE, color: '#fff', border: 'none',
                        borderRadius: 12, padding: '14px 0', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      <Copy size={16} strokeWidth={2}/>
                      {shareCopied ? 'Copied!' : 'Copy Link'}
                    </button>
                    {typeof navigator.share === 'function' && (
                      <button
                        onClick={() => { void navigator.share({ title: 'My Pack List', url: shareLink }); }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          background: CARD_BG, color: PRIMARY, border: `1px solid ${CARD_BORDER}`,
                          borderRadius: 12, padding: '14px 0', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        <Link2 size={16} strokeWidth={2}/>
                        Share via…
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', paddingTop: 48, color: MUTED, fontSize: 14 }}>
                  Share link could not be generated. Sign in and try again.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sources & References — full-screen in-app page (027R) */}
        {currentScreen.screen === 'sources' && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 60, background: PAGE_BG, display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
            {/* Sticky back bar */}
            <div style={{ position: 'sticky', top: 0, background: PAGE_BG, zIndex: 5, borderBottom: `1px solid ${DIVIDER}`, height: 48, display: 'flex', alignItems: 'center', padding: '0 16px', flexShrink: 0 }}>
              <button
                onClick={popScreen}
                aria-label="Back"
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: NAV_ACTIVE, fontSize: 16, fontFamily: SANS, fontWeight: 500, padding: '4px 0' }}
              >
                <ChevronLeft size={20} strokeWidth={2.5}/> Back
              </button>
            </div>
            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 40px' }}>
              <h1 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 700, color: PRIMARY, marginBottom: 16 }}>
                Sources &amp; References
              </h1>
              <SourcesContent />
            </div>
          </div>
        )}

        {/* Plus creation sheet — kept as bottom Sheet (small utility panel, not primary nav) */}
        <PlusSheet
          open={showPlusSheet}
          onClose={() => setShowPlusSheet(false)}
          onScanGearList={() => { setShowPlusSheet(false); setShowScanner(true); }}
        />

      </div>{/* end phone frame */}

      {/* ── D5: Category Options sheet ── */}
      <Sheet open={catOptionsFor !== null} onOpenChange={v => { if (!v) { setCatOptionsFor(null); setCatRenaming(false); setCatDeleteConfirm(false); } }}>
        <SheetContent side="bottom" style={{ maxHeight: '70vh', fontFamily: SANS, padding: '20px 20px 32px' }}>
          <SheetHeader>
            <SheetTitle style={{ fontSize: 18, fontWeight: 700, color: PRIMARY, fontFamily: SERIF }}>
              Category Options
            </SheetTitle>
            {catOptionsFor && !catRenaming && !catDeleteConfirm && (
              <div style={{ fontSize: 13.5, color: SECONDARY, marginTop: 2 }}>"{catOptionsFor}"</div>
            )}
          </SheetHeader>

          {catOptionsFor && !catRenaming && !catDeleteConfirm && (
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Rename */}
              <button
                onClick={() => { setCatRenaming(true); setCatRenameValue(catOptionsFor); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: 12,
                  padding: '14px 16px', cursor: 'pointer', textAlign: 'left', width: '100%',
                  boxShadow: CARD_SHADOW,
                }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#4f87c4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Pencil size={17} color="#fff" strokeWidth={1.8}/>
                </div>
                <div style={{ fontSize: 15.5, fontWeight: 600, color: PRIMARY }}>Rename Category</div>
              </button>
              {/* Delete */}
              <button
                onClick={() => setCatDeleteConfirm(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: 12,
                  padding: '14px 16px', cursor: 'pointer', textAlign: 'left', width: '100%',
                  boxShadow: CARD_SHADOW,
                }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Trash2 size={17} color="#fff" strokeWidth={1.8}/>
                </div>
                <div style={{ fontSize: 15.5, fontWeight: 600, color: '#dc2626' }}>Delete Category</div>
              </button>
            </div>
          )}

          {/* Rename sub-view */}
          {catOptionsFor && catRenaming && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 13.5, color: SECONDARY, marginBottom: 10 }}>New name for "{catOptionsFor}":</div>
              <input
                autoFocus
                type="text"
                value={catRenameValue}
                onChange={e => setCatRenameValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && catRenameValue.trim()) {
                    sandboxRenameCategory(catOptionsFor, catRenameValue);
                    setCatOptionsFor(null); setCatRenaming(false);
                  }
                  if (e.key === 'Escape') { setCatRenaming(false); }
                }}
                placeholder="Category name…"
                style={{
                  width: '100%', fontSize: 15, color: PRIMARY, fontFamily: SANS,
                  border: `1.5px solid ${CARD_BORDER}`, borderRadius: 10, padding: '10px 12px',
                  background: PAGE_BG, outline: 'none', boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  onClick={() => setCatRenaming(false)}
                  style={{ flex: 1, padding: '11px 0', borderRadius: 10, background: CARD_BG, border: `1px solid ${CARD_BORDER}`, fontSize: 14.5, fontWeight: 600, color: SECONDARY, cursor: 'pointer' }}
                >Cancel</button>
                <button
                  disabled={!catRenameValue.trim() || catRenameValue.trim() === catOptionsFor}
                  onClick={() => {
                    sandboxRenameCategory(catOptionsFor, catRenameValue);
                    setCatOptionsFor(null); setCatRenaming(false);
                  }}
                  style={{
                    flex: 1, padding: '11px 0', borderRadius: 10,
                    background: catRenameValue.trim() && catRenameValue.trim() !== catOptionsFor ? NAV_ACTIVE : MUTED,
                    border: 'none', fontSize: 14.5, fontWeight: 600, color: '#fff',
                    cursor: catRenameValue.trim() && catRenameValue.trim() !== catOptionsFor ? 'pointer' : 'not-allowed',
                  }}
                >Rename</button>
              </div>
            </div>
          )}

          {/* Delete confirmation sub-view */}
          {catOptionsFor && catDeleteConfirm && (() => {
            const itemCount = (sandbox.items[catOptionsFor] ?? []).length;
            return (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#dc2626', marginBottom: 10 }}>
                  Delete "{catOptionsFor}"?
                </div>
                {itemCount === 0 ? (
                  <div style={{ fontSize: 14, color: SECONDARY, marginBottom: 20 }}>
                    This category is empty. It will be permanently removed from this list.
                  </div>
                ) : (
                  <div style={{ fontSize: 14, color: SECONDARY, marginBottom: 20, lineHeight: 1.5 }}>
                    This category contains <strong>{itemCount} {itemCount === 1 ? 'item' : 'items'}</strong>. Deleting the category will also permanently delete{' '}
                    {itemCount === 1 ? 'that item' : 'those items'} from this list.
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setCatDeleteConfirm(false)}
                    style={{ flex: 1, padding: '11px 0', borderRadius: 10, background: CARD_BG, border: `1px solid ${CARD_BORDER}`, fontSize: 14.5, fontWeight: 600, color: SECONDARY, cursor: 'pointer' }}
                  >Cancel</button>
                  <button
                    onClick={() => { sandboxDeleteCategory(catOptionsFor); setCatOptionsFor(null); setCatDeleteConfirm(false); showToast(`Deleted "${catOptionsFor}"`); }}
                    style={{ flex: 1, padding: '11px 0', borderRadius: 10, background: '#dc2626', border: 'none', fontSize: 14.5, fontWeight: 600, color: '#fff', cursor: 'pointer' }}
                  >Delete Category</button>
                </div>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* ── D6: Item delete confirmation ── */}
      {deleteItemConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Delete item confirmation"
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            background: 'rgba(0,0,0,0.45)',
          }}
          onClick={() => setDeleteItemConfirm(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 500,
              background: '#fff', borderRadius: '16px 16px 0 0',
              padding: '24px 20px 36px', fontFamily: SANS,
              boxShadow: '0 -4px 32px rgba(0,0,0,0.18)',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>
              Delete "{deleteItemConfirm.name}"?
            </div>
            <div style={{ fontSize: 14, color: SECONDARY, marginBottom: 24, lineHeight: 1.5 }}>
              This will permanently remove this item from the current list. Other lists are not affected.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setDeleteItemConfirm(null)}
                style={{ flex: 1, padding: '12px 0', borderRadius: 10, background: CARD_BG, border: `1px solid ${CARD_BORDER}`, fontSize: 15, fontWeight: 600, color: SECONDARY, cursor: 'pointer' }}
              >Cancel</button>
              <button
                onClick={() => { sandboxRemoveItem(deleteItemConfirm.cat, deleteItemConfirm.id); setDeleteItemConfirm(null); showToast(`Deleted "${deleteItemConfirm.name}"`); }}
                style={{ flex: 1, padding: '12px 0', borderRadius: 10, background: '#dc2626', border: 'none', fontSize: 15, fontWeight: 600, color: '#fff', cursor: 'pointer' }}
              >Delete Item</button>
            </div>
          </div>
        </div>
      )}

      {/* Share loading indicator */}
      {shareLoading && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.35)',
        }}>
          <div style={{
            background: '#fff', borderRadius: 14, padding: '20px 28px',
            fontFamily: SANS, fontSize: 15, color: PRIMARY, fontWeight: 600,
            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
          }}>
            Generating share link…
          </div>
        </div>
      )}

    </div>
  );
}
