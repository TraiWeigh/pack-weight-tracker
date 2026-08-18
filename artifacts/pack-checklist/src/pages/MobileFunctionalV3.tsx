/**
 * MobileFunctionalV3.tsx — R0080
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

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
// R004 Part 3 — Inter Variable is the primary V3 mobile UI font (registers @font-face only;
// applied solely through this file's font tokens, so desktop/Checklist are unaffected)
import '@fontsource-variable/inter';
import { useAuth } from '@clerk/react';
import {
  Menu, Search, Plus, Check, MoreHorizontal,
  Backpack, Folder, Grid3X3, BarChart2,
  Hash, PackageOpen, ArrowRightLeft, Luggage, Camera, Image,
  Save, Undo2, Redo2, RotateCcw, Share2, Printer,
  Tent, HelpCircle, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Layers,
  Scale, Coins, AlertCircle, Trash2, Copy, Link2,
  BookOpen, Info, Pencil, Mail, Tag, FileText, Shield,
  CheckSquare,
  // R007 header identity icons + group 3
  Train, Plane, Ship, Car, Package,
} from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose,
} from '../components/ui/sheet';
import { SourcesContent } from '../components/SourcesModal';
import { NavDrawer } from '../components/NavDrawer';
import type { Handedness } from '../components/NavDrawer';
import { AboutContent } from './info/AboutPage';
import { HelpContent } from './info/HelpPage';
import { HowItWorksContent } from './info/HowItWorksPage';
import { BarStyleProvider } from '../context/BarStyleContext';
import { WeightSummary } from '../components/WeightSummary';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
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
import { calcTotalOz, formatWeight, smallUnit, largeUnit, gramsToOz } from '../lib/weightUtils';
import { useUnit, UnitProvider } from '../context/UnitContext';

// ─── TYPES ─────────────────────────────────────────────────────────────────────
type PackState = { [category: string]: GearItem[] };
type SandboxStore = { items: PackState; order: string[]; meta: Record<string, CategoryMeta> };
// (R002: the old ActiveNav tab type was retired — deck selection uses DeckId below.)

// ─── MOBILE NAVIGATION TYPES ───────────────────────────────────────────────────
// R002: bottom card-deck navigation — DeckId selects the raised deck; screenStack
// carries full-screen sub-pages (footer pages, share, sources).
type MobileScreen = 'list' | 'footer-page' | 'share' | 'sources';
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
// R004 Part 3 — Inter Variable primary; former SERIF surfaces keep their weight/size
// hierarchy but now render in the same Inter Variable family (no serif mixing).
const SANS         = "'Inter Variable', 'Inter', system-ui, -apple-system, sans-serif";
const SERIF        = SANS; // retained token name so existing weight/size hierarchy is untouched
const PAGE_BG      = '#F2EDE4';
const CARD_BG      = '#FFFFFF';
const HEADER_BG    = '#FFFFFF';
const HEADER_BDR   = 'rgba(0,0,0,0.07)';
const CARD_SHADOW  = '0 1px 6px rgba(0,0,0,0.10), 0 0 1px rgba(0,0,0,0.04)';
const CARD_BORDER  = 'rgba(0,0,0,0.06)';
const PRIMARY      = '#1A2920';
const SECONDARY    = '#4A5D54';
const MUTED        = '#667270'; // darkened from #9AAA9F for ≥4.5:1 on white (R0077)
const DIVIDER      = 'rgba(0,0,0,0.06)';
const SUMMARY_BG   = '#2A5740';
const SUMMARY_TEXT = '#FFFFFF';
const NAV_BG       = '#FFFFFF';
const NAV_ACTIVE   = '#2A5740';
const NAV_INACTIVE = '#6E7672'; // darkened from #A0ADA8 for ≥4.5:1 on white (R0077)
const CB_CHECKED   = '#4E7D5C';
const CB_UNCHECKED = 'rgba(0,0,0,0.18)';
const DETAIL_BG    = '#F5F0E8';
const DETAIL_BDR   = 'rgba(0,0,0,0.06)';
const OVERLAY_BG   = '#F2EDE4';
const TOAST_BG     = '#2A5740';

// ─── BOTTOM CARD-DECK NAVIGATION CONSTANTS (R002, geometry revised R003) ─────────
const NAV_H         = 58;   // bottom tab bar fallback height (px); actual height is measured (A4)
const BAR_PEEK_H    = 68;   // visible height of an inactive stacked bar (matches category-bar height)
// DRAG_ACTIVATE removed R0073: stacked bars are tap-only, no drag-to-activate
const TAP_MAX_PX    = 8;    // pointer movement below this = tap
// R006 Part 2 — long-press reorder tuning (documented stable values)
const LONG_PRESS_MS = 400;  // stationary hold duration that enters reorder mode
const HOLD_SLOP_PX  = 10;   // finger jitter tolerated during the hold; beyond it → scroll/swipe wins
const DRAG_SLOP_PX  = 8;    // movement beyond this locks the gesture mode (scroll vs lift)
/** Snap-animation duration: near-instant when prefers-reduced-motion is set. */
const motionDuration = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? '0.01s' : '0.28s';

/** ONE restrained haptic pulse when a card docks — only where genuinely supported.
 *  navigator.vibrate is absent on iOS Safari; the call is skipped silently there.
 *  No continuous vibration, no fake haptics — UI is fully usable without it. */
function hapticDock() {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(10);
    }
  } catch { /* no haptic support — ignore */ }
}

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

// R0079 — write full array, update one entry, remove one entry
function writeLockerEntries(entries: LockerEntry[]): void {
  localStorage.setItem(LOCKER_KEY, JSON.stringify(entries));
}
function updateLockerEntry(id: string, updated: LockerEntry): void {
  writeLockerEntries(readLockerEntries().map(e => e.id === id ? updated : e));
}
function removeLockerEntry(id: string): void {
  writeLockerEntries(readLockerEntries().filter(e => e.id !== id));
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

// ─── PREVIEW OVERLAY ─────────────────────────────────────────────────────────────
// R0072 §10 — Preview opens ONLY the pack-list checklist preview (selected items).
// Opening Preview does NOT auto-print. A separate Print button inside allows the
// user to deliberately start printing. Print is reachable only after Preview is open.
interface PreviewOverlayProps {
  sandbox: SandboxStore;
  system: string;
  onPrint: () => void;
  onClose: () => void;
}

function PreviewOverlay({ sandbox, system, onPrint, onClose }: PreviewOverlayProps) {
  // R0081 — Preview-local check state.
  // Initialised once from the working list on mount; NEVER writes back to sandbox.
  // Auto-discarded on close because this component unmounts when showPreview=false.
  const [previewChecks, setPreviewChecks] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const cat of Object.keys(sandbox.items)) {
      for (const item of sandbox.items[cat]) {
        init[item.id] = item.checked;
      }
    }
    return init;
  });

  // beforeClear: null  → not yet cleared (pill shows "Clear Checks")
  //             non-null → holds pre-clear snapshot (pill shows "Undo")
  const [beforeClear, setBeforeClear] = useState<Record<string, boolean> | null>(null);
  const isCleared = beforeClear !== null;

  // Display data: each item's checked value comes from previewChecks, not sandbox.
  // sandbox.items is read-only here — it is never mutated.
  const displayData: PackState = useMemo(() => {
    const out: PackState = {};
    for (const cat of Object.keys(sandbox.items)) {
      out[cat] = sandbox.items[cat].map(item => ({
        ...item,
        checked: previewChecks[item.id] ?? item.checked,
      }));
    }
    return out;
  }, [sandbox.items, previewChecks]);

  const handleClear = useCallback(() => {
    setBeforeClear(previewChecks);
    const allFalse: Record<string, boolean> = {};
    for (const id of Object.keys(previewChecks)) allFalse[id] = false;
    setPreviewChecks(allFalse);
  }, [previewChecks]);

  const handleUndo = useCallback(() => {
    if (beforeClear) {
      setPreviewChecks(beforeClear);
      setBeforeClear(null);
    }
  }, [beforeClear]);

  return (
    <div
      data-testid="preview-overlay"
      style={{
        position: 'absolute', inset: 0, background: OVERLAY_BG,
        zIndex: 50, display: 'flex', flexDirection: 'column', fontFamily: SANS,
      }}
    >
      {/* Header */}
      <div style={{
        height: 52, background: HEADER_BG, borderBottom: `1px solid ${HEADER_BDR}`,
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, flexShrink: 0,
      }}>
        <button
          onClick={onClose}
          aria-label="Close preview"
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', minWidth: 44, minHeight: 44, justifyContent: 'center' }}
        >
          <ChevronLeft size={22} color={SECONDARY} strokeWidth={2}/>
        </button>
        <span style={{ flex: 1, fontSize: 17, fontWeight: 600, color: PRIMARY, fontFamily: SERIF }}>
          Preview
        </span>
        {/* Deliberate Print control — R0072 §10: user must tap this to print */}
        <button
          onClick={onPrint}
          aria-label="Print gear list"
          title="Print pack list"
          data-testid="preview-print-btn"
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', minWidth: 44, minHeight: 44, justifyContent: 'center' }}
        >
          <Printer size={18} color={SECONDARY} strokeWidth={1.8}/>
        </button>
      </div>

      {/* Note banner — R0081: updated; no longer says "selected gear only" */}
      <div style={{
        background: 'rgba(42,87,64,0.08)', borderBottom: `1px solid rgba(42,87,64,0.12)`,
        padding: '7px 16px', fontSize: 12, color: SECONDARY, flexShrink: 0,
      }}>
        All items in this list — tap the printer icon to print or download.
      </div>

      {/* Clear Checks / Undo pill — R0081 */}
      <div style={{ padding: '10px 16px 6px', flexShrink: 0 }}>
        <button
          onClick={isCleared ? handleUndo : handleClear}
          aria-label={isCleared ? 'Undo clear checks' : 'Clear all preview checkmarks'}
          data-testid={isCleared ? 'preview-undo-btn' : 'preview-clear-btn'}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, width: '100%', minHeight: 44,
            background: SUMMARY_BG, border: 'none', borderRadius: 100,
            color: '#fff', fontSize: 15, fontWeight: 600, fontFamily: SANS,
            cursor: 'pointer', padding: '11px 20px', letterSpacing: '0.1px',
          }}
        >
          {isCleared
            ? <Undo2     size={18} color="#fff" strokeWidth={2}/>
            : <CheckSquare size={18} color="#fff" strokeWidth={2}/>
          }
          <span>{isCleared ? 'Undo' : 'Clear Checks'}</span>
        </button>
      </div>

      {/* Preview body — R0081: all items, no filter, no dimming */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        <BarStyleProvider value={{ barColor: '', barFont: '', barTextColor: '', barTransparency: 1 }}>
          <PreviewBody
            data={displayData}
            system={system as 'imperial' | 'metric'}
            categoryOrder={sandbox.order}
            categoryMeta={sandbox.meta}
            filterToChecked={false}
            dimUnchecked={false}
          />
        </BarStyleProvider>
      </div>
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
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', minWidth: 44, minHeight: 44, justifyContent: 'center' }}
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
            fontSize: 12.5, color: SECONDARY, borderRadius: 6, fontFamily: SANS, minHeight: 44, alignSelf: 'center' }}
        >
          Clear
        </button>
        <button
          onClick={onPrint}
          aria-label="Print checklist"
          title="Print pack list"
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', minWidth: 44, minHeight: 44, justifyContent: 'center' }}
        >
          <Printer size={18} color={SECONDARY} strokeWidth={1.8}/>
        </button>
        <button
          onClick={onShare}
          aria-label="Download PDF"
          title="Download PDF"
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', minWidth: 44, minHeight: 44, justifyContent: 'center' }}
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

// ─── MOBILE WEIGHT DISTRIBUTION (R0076) ─────────────────────────────────────────
// Inline pie chart that uses category wedge colours (getCategoryTheme) directly.
// Replaces the desktop WeightDistribution component in the mobile deck — no
// Trail/Ocean/Sunset/Forest/Berry/Desert theme selector.
interface MobileWDProps {
  data:          { [category: string]: import('../hooks/usePackData').GearItem[] };
  categoryOrder: string[];
  categoryMeta:  Record<string, import('../hooks/usePackData').CategoryMeta>;
}
function MobileWeightDistribution({ data, categoryOrder }: MobileWDProps) {
  const { system } = useUnit();
  const lu = largeUnit(system);

  // Build slice data using the same wedge-colour source as the category bars
  let grandTotal = 0;
  const slices = categoryOrder.map((cat, idx) => {
    const items = (data[cat] || []).filter(i => i.checked);
    const oz = items.reduce((s, i) => s + calcTotalOz(i.weightOz, i.qty), 0);
    grandTotal += oz;
    return { name: cat, value: oz, fill: getCategoryTheme(cat, idx).bg };
  }).filter(d => d.value > 0);

  const pct = (oz: number) => grandTotal > 0 ? ((oz / grandTotal) * 100).toFixed(1) : '0.0';

  // Colour constants borrowed from the outer component palette
  const SANS_  = '"Inter Variable", "Inter", system-ui, -apple-system, sans-serif';
  const PRIMARY_  = '#1a1a2e';
  const MUTED_    = '#8a8a9a';

  return (
    <div style={{ padding: '4px 0 8px' }}>
      {grandTotal > 0 ? (
        <>
          {/* Pie wheel */}
          <div style={{ height: 200, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {slices.map((s, i) => (
                    <Cell key={i} fill={s.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend — name · percentage · weight */}
          <div style={{ marginTop: 14, padding: '0 4px' }}>
            {slices.map((s, i) => (
              <div
                key={i}
                data-testid={`wd-legend-${i}`}
                data-cat-color={s.fill}
                data-cat-name={s.name}
                style={{
                  display: 'flex', alignItems: 'center',
                  gap: 8, marginBottom: 9,
                }}
              >
                {/* Colour swatch — matches the pie slice */}
                <div
                  data-testid={`wd-swatch-${i}`}
                  style={{
                    width: 12, height: 12, borderRadius: 3,
                    backgroundColor: s.fill, flexShrink: 0,
                  }}
                />
                <span style={{
                  flex: 1, fontSize: 13, fontWeight: 500, color: PRIMARY_,
                  fontFamily: SANS_,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {s.name}
                </span>
                <span style={{ fontSize: 12, color: MUTED_, fontFamily: SANS_, whiteSpace: 'nowrap' }}>
                  {pct(s.value)}%
                </span>
                <span style={{
                  fontSize: 12, color: MUTED_, fontFamily: 'monospace', whiteSpace: 'nowrap',
                  minWidth: 60, textAlign: 'right',
                }}>
                  {formatWeight(s.value, system, 'large')} {lu}
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{
          height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#8a8a9a', fontSize: 14, fontStyle: 'italic',
        }}>
          No items packed yet
        </div>
      )}
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
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', minWidth: 44, minHeight: 44, justifyContent: 'center' }}
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
          <MobileWeightDistribution
            data={sandbox.items}
            categoryOrder={sandbox.order}
            categoryMeta={sandbox.meta}
          />
        </BarStyleProvider>
      </div>
    </div>
  );
}

// (R002: the full-screen Locker overlay was retired — saved lists are now presented
//  as cards in the Locker deck, built inside MobileFunctionalV3Inner.)

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
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', minWidth: 44, minHeight: 44, justifyContent: 'center' }}
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

// ─── SLIDE-TO-DELETE ROW (R004 Part 1) ───────────────────────────────────────────
// Right-edge-to-left swipe reveals a Delete action underneath on the right.
// - gesture must BEGIN in the right-edge zone of the row;
// - 8px slop, then horizontal-vs-vertical mode lock (mostly-vertical → native scroll);
// - row follows the finger; release settles open (past half) or closed — no bounce;
// - swipe only REVEALS Delete; activation is a separate deliberate tap.
const SWIPE_ACTION_W = 88;   // revealed Delete width (px)
const SWIPE_SLOP_PX  = 8;    // gesture disambiguation slop
const SWIPE_EDGE_ZONE = 0.4; // gesture must start within right 40% of the row

function SwipeDeleteRow({ swipeKey, open, onOpenChange, onDelete, deleteLabel, reorderActive, children }: {
  swipeKey: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
  deleteLabel: string;
  /** R006 Part 4 — while a category reorder owns the gesture, the swipe
   *  machinery is inert: it can never reveal Delete mid-reorder. */
  reorderActive?: boolean;
  children: React.ReactNode;
}) {
  const [dragX, setDragX] = useState<number | null>(null); // live offset while dragging
  const gRef = useRef<{ startX: number; startY: number; baseX: number; mode: 'idle' | 'h' | 'v'; lastX: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const justDraggedRef = useRef(false); // swallow the synthetic click that follows a drag

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Closed rows: the delete gesture must begin at/near the RIGHT EDGE.
    // Open rows: allow a swipe-back-closed from anywhere on the row.
    if (!open && e.clientX < rect.right - rect.width * SWIPE_EDGE_ZONE) return;
    gRef.current = { startX: e.clientX, startY: e.clientY, baseX: open ? -SWIPE_ACTION_W : 0, mode: 'idle', lastX: e.clientX };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (reorderActive) { gRef.current = null; setDragX(null); return; }
    const g = gRef.current;
    if (!g) return;
    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    if (g.mode === 'idle') {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_SLOP_PX) return;
      if (Math.abs(dy) > Math.abs(dx)) { g.mode = 'v'; return; } // mostly vertical → scroll, never reveal
      g.mode = 'h';
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    if (g.mode !== 'h') return;
    g.lastX = e.clientX;
    const x = Math.min(0, Math.max(-SWIPE_ACTION_W, g.baseX + dx)); // clamp: no overshoot
    setDragX(x);
  };

  const endGesture = (commit: boolean) => {
    const g = gRef.current;
    gRef.current = null;
    if (!g || g.mode !== 'h') { setDragX(null); return; }
    justDraggedRef.current = true;
    if (commit) {
      const x = Math.min(0, Math.max(-SWIPE_ACTION_W, g.baseX + (g.lastX - g.startX)));
      onOpenChange(x < -SWIPE_ACTION_W / 2); // past half → open; short swipe → closed
    } else {
      onOpenChange(false);
    }
    setDragX(null);
  };

  const restingX = open ? -SWIPE_ACTION_W : 0;
  const x = dragX ?? restingX;

  return (
    <div
      ref={wrapRef}
      data-swipe-key={swipeKey}
      data-swipe-open={open ? 'true' : 'false'}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Revealed destructive action — underneath, right side */}
      <button
        onClick={() => { onOpenChange(false); onDelete(); }}
        aria-label={deleteLabel}
        aria-hidden={!open && dragX === null}
        tabIndex={open ? 0 : -1}
        style={{
          position: 'absolute', top: 0, bottom: 0, right: 0, width: SWIPE_ACTION_W,
          background: '#B03A2E', color: '#fff', border: 'none', cursor: 'pointer',
          fontSize: 13.5, fontWeight: 600, fontFamily: SANS,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}
      >
        <Trash2 size={15} strokeWidth={1.9} aria-hidden="true"/>
        Delete
      </button>
      {/* Row content — follows the finger; settles with a short ease-out (no bounce) */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={() => endGesture(true)}
        onPointerCancel={() => endGesture(false)}
        onClickCapture={e => {
          // The click fired right after a horizontal drag is part of the gesture — swallow it.
          if (justDraggedRef.current) { justDraggedRef.current = false; e.stopPropagation(); e.preventDefault(); return; }
          // Tap on an open row closes the reveal instead of activating the row.
          if (open && dragX === null) { e.stopPropagation(); e.preventDefault(); onOpenChange(false); }
        }}
        style={{
          transform: `translateX(${x}px)`,
          transition: dragX !== null ? 'none' : 'transform 0.18s ease-out',
          touchAction: 'pan-y',
          position: 'relative', zIndex: 1,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── BOTTOM BOX-GROUP BAR (R007 — 4 sliding groups, chevron + swipe navigation)
//
// Group 1 (default): Locker | Summary | Add | Search | [→ NEXT]
// Group 2:           [← BACK] | Undo | Redo | Reset | [→ NEXT]
// Group 3:           [← BACK] | Camera | Photos | Preview | [→ NEXT]
// Group 4:           [← BACK] | Save | Share | More
//
// Max five visible boxes at one time (chevron counts as a box).
// Stacked bars (inactive deck cards) are NOT part of this system and are never
// reorderable — they are purely content bars above the box groups.
// ─────────────────────────────────────────────────────────────────────────────

type DeckId = 'locker' | 'summary' | 'add' | 'search' | 'more';
const NUM_BOX_GROUPS = 4;
const GROUP_SWIPE_THRESHOLD = 44; // px horizontal drag to commit a group change

interface BoxGroupBarProps {
  activeDeck: DeckId | null;
  undoDisabled: boolean;
  redoDisabled: boolean;
  onLocker:  () => void;
  onSummary: () => void;
  onAdd:     () => void;
  onSearch:  () => void;
  onUndo:    () => void;
  onRedo:    () => void;
  onReset:   () => void;
  onCamera:  () => void;
  onPhotos:  () => void;
  onPreview: () => void;
  onSave:    () => void;
  onShare:   () => void;
  onMore:    () => void;
}

/** Shared box button inside a group. */
function NavBox({
  Icon, label, aria, active, disabled, onClick,
}: {
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  label: string; aria: string; active?: boolean; disabled?: boolean; onClick: () => void;
}) {
  const col = disabled ? NAV_INACTIVE + '60' : active ? NAV_ACTIVE : NAV_INACTIVE;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={aria}
      aria-current={active ? 'page' : undefined}
      style={{
        flex: 1, minWidth: 0, background: active ? 'rgba(42,87,64,0.10)' : 'none',
        border: 'none', borderRadius: 0, padding: '7px 0 8px',
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
      }}
    >
      <Icon size={21} color={col} strokeWidth={active ? 2.1 : 1.6}/>
      <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, color: col, letterSpacing: active ? '0.1px' : 0 }}>
        {label}
      </span>
    </button>
  );
}

/** Chevron navigation box — same size/style as other boxes. */
function ChevronBox({
  direction, aria, onClick,
}: { direction: 'left' | 'right'; aria: string; onClick: () => void }) {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={onClick}
      aria-label={aria}
      style={{
        flex: 1, minWidth: 0, background: 'none', border: 'none', borderRadius: 0,
        padding: '7px 0 8px', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
      }}
    >
      <Icon size={21} color={NAV_INACTIVE} strokeWidth={1.6}/>
      <span style={{ fontSize: 10, color: NAV_INACTIVE }}>
        {direction === 'left' ? 'Back' : 'Next'}
      </span>
    </button>
  );
}

const BoxGroupBar = React.forwardRef<HTMLDivElement, BoxGroupBarProps>(
  function BoxGroupBar(props, ref) {
    const {
      activeDeck, undoDisabled, redoDisabled,
      onLocker, onSummary, onAdd, onSearch,
      onUndo, onRedo, onReset,
      onCamera, onPhotos, onPreview,
      onSave, onShare, onMore,
    } = props;

    const [groupIdx, setGroupIdx]   = useState(0);
    const [dragX, setDragX]         = useState(0);  // live finger offset (px)
    // isAnimating: true for ~400ms after a committed group change so the CSS
    // slide transition can complete before off-screen groups are hidden again.
    const [isAnimating, setIsAnimating] = useState(false);
    const animTimerRef = useRef<number | null>(null);
    const swipeRef = useRef<{ startX: number; startY: number; dragged: boolean; locked: boolean; pointerId: number } | null>(null);
    const justDraggedRef = useRef(false);

    // Ref mirrors — kept current so window event listeners never close over stale state.
    const groupIdxRef = useRef(groupIdx);
    groupIdxRef.current = groupIdx;

    // Commit a group change (or stay put) and fire a single haptic if changed.
    const settle = useCallback((newIdx: number) => {
      const changed = newIdx !== groupIdxRef.current;
      setGroupIdx(newIdx);
      setDragX(0);
      if (changed) {
        hapticDock(); // R007 §8 — ONE haptic on successful group settle
        setIsAnimating(true);
        if (animTimerRef.current) window.clearTimeout(animTimerRef.current);
        animTimerRef.current = window.setTimeout(() => setIsAnimating(false), 400);
      }
    }, []); // stable — reads groupIdxRef instead of closing over groupIdx

    const settleRef = useRef(settle);
    settleRef.current = settle;

    const goLeft  = useCallback(() => { settle(Math.max(0, groupIdxRef.current - 1)); }, [settle]);
    // R0080: Next wraps Group 4 → Group 1; Back still clamps (no back-wrap from Group 1).
    const goRight = useCallback(() => { settle((groupIdxRef.current + 1) % NUM_BOX_GROUPS); }, [settle]);

    // ── Gesture handling via WINDOW listeners (not pointer capture) ──────────────
    // setPointerCapture() would redirect the synthetic `click` event to the nav
    // div, preventing ChevronBox / NavBox onClick handlers from firing.  Instead
    // we attach window-level move/up listeners from onPointerDown and remove them
    // in onUp — this works across the full viewport without losing clicks.
    const onPointerDown = useCallback((e: React.PointerEvent) => {
      if (!e.isPrimary || swipeRef.current) return;
      const startX = e.clientX;
      const startY = e.clientY;
      const pid    = e.pointerId;
      swipeRef.current = { startX, startY, dragged: false, locked: false, pointerId: pid };

      const onMove = (ev: PointerEvent) => {
        const s = swipeRef.current;
        if (!s || ev.pointerId !== pid) return;
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        if (!s.locked) {
          if (Math.abs(dy) > Math.abs(dx) + 6) {
            // Vertical scroll — abandon horizontal tracking
            swipeRef.current = null; setDragX(0);
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            return;
          }
          if (Math.abs(dx) > 6) { s.dragged = true; s.locked = true; }
        }
        if (s.dragged) {
          const cur = groupIdxRef.current;
          const clamped = cur === 0 && dx > 0 ? 0
                        : cur === NUM_BOX_GROUPS - 1 && dx < 0 ? 0
                        : dx;
          setDragX(clamped);
        }
      };

      // eslint-disable-next-line prefer-const
      function onUp(ev: PointerEvent) {
        if (ev.pointerId !== pid) return;
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        const s = swipeRef.current;
        if (!s) return;
        swipeRef.current = null;
        const dx = ev.clientX - startX;
        if (s.dragged) {
          // Swallow the click that immediately follows drag-end
          justDraggedRef.current = true;
          requestAnimationFrame(() => { justDraggedRef.current = false; });
        }
        const cur = groupIdxRef.current;
        // R0080P2: swipe clamps at endpoints (no wrap); only tapping Next wraps Group 4 → Group 1.
        if (dx < -GROUP_SWIPE_THRESHOLD && cur < NUM_BOX_GROUPS - 1) settleRef.current(cur + 1);
        else if (dx > GROUP_SWIPE_THRESHOLD && cur > 0) settleRef.current(cur - 1);
        else settleRef.current(cur); // short/cancelled → revert (no haptic)
      }

      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerup', onUp);
    }, []); // stable — everything read via refs or captured from startX/startY/pid

    // Percentage-based translate: each group occupies 25% of the track (track = 4×
    // the visible width). During live tracking, dragX pixels offset the settled position.
    // transition is suppressed while finger is down so it tracks naturally.
    const isDragging = !!swipeRef.current?.dragged;
    const trackStyle: React.CSSProperties = {
      display: 'flex',
      width: `${NUM_BOX_GROUPS * 100}%`,
      transform: `translateX(calc(-${groupIdx * (100 / NUM_BOX_GROUPS)}% + ${dragX}px))`,
      transition: isDragging ? 'none' : `transform ${motionDuration()} cubic-bezier(0.4,0,0.2,1)`,
      height: '100%',
    };

    const groupStyle: React.CSSProperties = {
      width: `${100 / NUM_BOX_GROUPS}%`,
      display: 'flex',
      alignItems: 'stretch',
      borderLeft: 'none',
    };

    // Divider between adjacent boxes
    const boxDivider = `1px solid ${DIVIDER}`;

    return (
      <div
        ref={ref}
        data-testid="bottom-nav"
        onPointerDown={onPointerDown}
        onClickCapture={e => {
          // Swallow the synthetic click that immediately follows a drag-end gesture
          if (justDraggedRef.current) { justDraggedRef.current = false; e.stopPropagation(); e.preventDefault(); }
        }}
        style={{
          position: 'sticky', bottom: 0, left: 0, right: 0,
          background: NAV_BG, borderTop: '1px solid rgba(0,0,0,0.10)',
          display: 'flex', flexDirection: 'column', alignItems: 'stretch',
          paddingBottom: 'var(--tw-safe-bottom, env(safe-area-inset-bottom, 0px))',
          zIndex: 40, minHeight: NAV_H, boxSizing: 'border-box', flexShrink: 0,
          overflow: 'hidden',
          touchAction: 'none', // pointer capture manages the gesture
        }}
      >
        <div style={trackStyle}>
          {/* Off-screen groups are visibility:hidden (not display:none so the flex
              track dimensions stay stable) and aria-hidden so they're excluded from
              the a11y tree and Playwright cannot find/click their buttons.
              During a live drag (dragX≠0) or animation (isAnimating) all groups
              are briefly visible so the CSS slide feels natural. */}
          {([
            {
              /* ── Group 1: Locker | Summary | Add | Search | [NEXT] ── */
              children: <>
                <NavBox Icon={Folder}    label="Locker"  aria="Locker — saved lists"                    active={activeDeck==='locker'}  onClick={onLocker}/>
                <span style={{ width: 1, background: DIVIDER, alignSelf: 'stretch' }}/>
                <NavBox Icon={BarChart2} label="Summary" aria="Summary — pack weight and progress"       active={activeDeck==='summary'} onClick={onSummary}/>
                <span style={{ width: 1, background: DIVIDER, alignSelf: 'stretch' }}/>
                <NavBox Icon={Plus}      label="Add"     aria="Add — add items, categories, or import"  active={activeDeck==='add'}     onClick={onAdd}/>
                <span style={{ width: 1, background: DIVIDER, alignSelf: 'stretch' }}/>
                <NavBox Icon={Search}    label="Search"  aria="Search — find gear"                       active={activeDeck==='search'}  onClick={onSearch}/>
                <span style={{ width: 1, background: DIVIDER, alignSelf: 'stretch' }}/>
                <ChevronBox direction="right" aria="Next controls" onClick={goRight}/>
              </>,
            },
            {
              /* ── Group 2: [BACK] | Undo | Redo | Reset | [NEXT] ── */
              children: <>
                <ChevronBox direction="left" aria="Previous controls" onClick={goLeft}/>
                <span style={{ width: 1, background: DIVIDER, alignSelf: 'stretch' }}/>
                <NavBox Icon={Undo2}     label="Undo"    aria="Undo last change"    disabled={undoDisabled} onClick={onUndo}/>
                <span style={{ width: 1, background: DIVIDER, alignSelf: 'stretch' }}/>
                <NavBox Icon={Redo2}     label="Redo"    aria="Redo last change"    disabled={redoDisabled} onClick={onRedo}/>
                <span style={{ width: 1, background: DIVIDER, alignSelf: 'stretch' }}/>
                <NavBox Icon={RotateCcw} label="Reset"   aria="Reset — clear checked/packed marks"          onClick={onReset}/>
                <span style={{ width: 1, background: DIVIDER, alignSelf: 'stretch' }}/>
                <ChevronBox direction="right" aria="Next controls" onClick={goRight}/>
              </>,
            },
            {
              /* ── Group 3: [BACK] | Camera | Photos | Preview | [NEXT] ── */
              children: <>
                <ChevronBox direction="left" aria="Previous controls" onClick={goLeft}/>
                <span style={{ width: 1, background: DIVIDER, alignSelf: 'stretch' }}/>
                <NavBox Icon={Camera}  label="Camera"  aria="Camera — capture gear photo"       onClick={onCamera}/>
                <span style={{ width: 1, background: DIVIDER, alignSelf: 'stretch' }}/>
                <NavBox Icon={Image}   label="Photos"  aria="Photos — gear photo library"       onClick={onPhotos}/>
                <span style={{ width: 1, background: DIVIDER, alignSelf: 'stretch' }}/>
                <NavBox Icon={Printer} label="Preview" aria="Preview — view and print gear list" onClick={onPreview}/>
                <span style={{ width: 1, background: DIVIDER, alignSelf: 'stretch' }}/>
                <ChevronBox direction="right" aria="Next controls" onClick={goRight}/>
              </>,
            },
            {
              /* ── Group 4: [BACK] | Save | Share | More ── */
              children: <>
                <ChevronBox direction="left" aria="Previous controls" onClick={goLeft}/>
                <span style={{ width: 1, background: DIVIDER, alignSelf: 'stretch' }}/>
                <NavBox Icon={Save}           label="Save"  aria="Save — save list to Locker"    onClick={onSave}/>
                <span style={{ width: 1, background: DIVIDER, alignSelf: 'stretch' }}/>
                <NavBox Icon={Share2}         label="Share" aria="Share — create a review link"  onClick={onShare}/>
                <span style={{ width: 1, background: DIVIDER, alignSelf: 'stretch' }}/>
                <NavBox Icon={MoreHorizontal} label="More"  aria="More — settings and tools"     active={activeDeck==='more'} onClick={onMore}/>
                <span style={{ width: 1, background: DIVIDER, alignSelf: 'stretch' }}/>
                {/* R0080: Next added to Group 4 — wraps forward to Group 1 */}
                <ChevronBox direction="right" aria="Next controls" onClick={goRight}/>
              </>,
            },
          ] as { children: React.ReactNode }[]).map(({ children }, i) => {
            const settled = !isAnimating && dragX === 0;
            const hidden = settled && i !== groupIdx;
            return (
              <div
                key={i}
                data-group-idx={i}
                data-group-active={i === groupIdx}
                aria-hidden={hidden}
                style={{
                  ...groupStyle,
                  borderLeft: i > 0 ? boxDivider : 'none',
                  visibility: hidden ? 'hidden' : 'visible',
                  pointerEvents: i === groupIdx ? 'auto' : 'none',
                }}
              >
                {children}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

// ─── CARD DECK (R002 — bottom-rising, vertically overlapping card stack) ─────────
// Tapping Locker / + / Search / More raises a deck of stacked cards from the bottom.
// Each inactive card shows its title strip; TAP activates it (stacked bars are
// tap-only — R0073/R0074 removed the drag-lift path). The active card expands at
// the top of the deck ("operational position") and shows its content.
// Switching active cards never requires closing the deck. Decks are conditionally
// rendered — when closed they do not exist in the DOM and cannot intercept input.

interface DeckCardDef {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  /** Content rendered when this card is in the active/operational position. */
  render?: () => React.ReactNode;
}

interface CardDeckProps {
  deckLabel: string;
  cards: DeckCardDef[];
  activeCardId: string | null;
  onActivateCard: (id: string) => void;
  onClose: () => void;
  emptyNote?: string;
  /** A4: measured bottom-nav occupied height (includes safe-area inset) — the
   *  single source of truth shared by nav, deck, and backdrop. */
  bottomOffset: number;
}

/** One inactive (stacked) bar — R003 compact category-header-scale geometry.
 *
 *  A1 GESTURE DISAMBIGUATION (scroll vs activation):
 *  Movement below DRAG_SLOP_PX on release = TAP → activate (always available).
 *  Once movement exceeds the slop, the gesture LOCKS into 'scroll' mode:
 *   - 'scroll' — ANY vertical drag scrolls an overflowing deck naturally in BOTH
 *     directions (reversible, 1:1, no bounce) and can never activate on release;
 *     on a non-overflowing deck the drag is a no-op.
 *  Stacked bars are TAP-ONLY (R0073/R0074 — lift/drag-activate path removed). */
function DeckInactiveCard({ card, index, onActivate, scrollBy, canDeckScroll }: {
  card: DeckCardDef;
  index: number;
  onActivate: () => void;
  scrollBy: (dy: number) => void;
  canDeckScroll: () => boolean;
}) {
  const [focused, setFocused] = useState(false);
  const dragRef = useRef<{ active: boolean; mode: 'idle' | 'scroll'; startY: number; lastY: number }>(
    { active: false, mode: 'idle', startY: 0, lastY: 0 }
  );

  const finishDrag = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const { startY } = dragRef.current;
    dragRef.current.active = false;
    dragRef.current.mode = 'idle';
    const total = Math.abs(e.clientY - startY);
    if (card.disabled) return;
    if (total < TAP_MAX_PX) { onActivate(); return; }  // tap
    // scroll mode on release — no-op (vertical drag never activates)
  };

  /** A cancelled gesture (e.g. browser takes over the pointer) must never
   *  activate the card — no visual drag state to reset. */
  const cancelDrag = () => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    dragRef.current.mode = 'idle';
  };

  return (
    <div
      role="button"
      tabIndex={card.disabled ? -1 : 0}
      aria-disabled={card.disabled || undefined}
      aria-label={card.disabled
        ? `${card.title} — not available yet`
        : `${card.title} — open card`}
      title={card.disabled ? `${card.title} — not available yet` : card.title}
      onKeyDown={e => {
        if (!card.disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onActivate(); }
      }}
      onPointerDown={e => {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        dragRef.current = { active: true, mode: 'idle', startY: e.clientY, lastY: e.clientY };
      }}
      onPointerMove={e => {
        const d = dragRef.current;
        if (!d.active) return;
        const totalDy = e.clientY - d.startY;
        if (d.mode === 'idle' && Math.abs(totalDy) > DRAG_SLOP_PX) {
          // Stacked bars are tap-only (R0073/R0074): always scroll mode.
          // Overflowing deck → scrolls content 1:1; non-overflowing → no-op.
          d.mode = 'scroll';
        }
        if (d.mode === 'scroll') {
          scrollBy(d.lastY - e.clientY);  // finger up → scrollTop increases; finger down → decreases
        }
        d.lastY = e.clientY;
      }}
      onPointerUp={finishDrag}
      onPointerCancel={cancelDrag}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        position: 'relative',
        zIndex: index + 1,
        background: CARD_BG,                      // A3: surface is ALWAYS fully opaque
        borderRadius: 0,                          // R003: square edges
        borderTop: index === 0 ? 'none' : `1px solid ${DIVIDER}`,
        minHeight: BAR_PEEK_H,
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 14px',
        cursor: card.disabled ? 'not-allowed' : 'pointer',
        userSelect: 'none', touchAction: 'none',
        outline: focused ? `2px solid ${NAV_ACTIVE}` : 'none',
        outlineOffset: focused ? -2 : undefined,
        flexShrink: 0, boxSizing: 'border-box',
      }}
    >
      {/* A3: only the CONTENT is muted when disabled — never the surface */}
      {card.icon && (
        <span style={{
          width: 32, height: 32, borderRadius: 0, background: 'rgba(42,87,64,0.10)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, color: NAV_ACTIVE,
          opacity: card.disabled ? 0.45 : 1,
        }}>
          {card.icon}
        </span>
      )}
      <div style={{ flex: 1, minWidth: 0, padding: '8px 0', opacity: card.disabled ? 0.5 : 1 }}>
        <div style={{
          fontSize: 14.5, fontWeight: 600, color: PRIMARY, fontFamily: SERIF,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {card.title}
        </div>
        {card.subtitle && (
          <div style={{
            fontSize: 11.5, color: card.disabled ? SECONDARY : MUTED, marginTop: 1,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {card.subtitle}
          </div>
        )}
      </div>
      {!card.disabled && (
        <ChevronLeft
          size={16} color={MUTED} strokeWidth={1.8}
          style={{ transform: 'rotate(90deg)', flexShrink: 0 }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

function CardDeck({ deckLabel, cards, activeCardId, onActivateCard, onClose, emptyNote, bottomOffset }: CardDeckProps) {
  const [risen, setRisen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Rise from the bottom after mount (motionDuration() → ~instant under reduced motion),
  // and move keyboard focus into the deck (non-modal: tabs stay reachable).
  useEffect(() => {
    const id = requestAnimationFrame(() => setRisen(true));
    closeBtnRef.current?.focus({ preventScroll: true });
    return () => cancelAnimationFrame(id);
  }, []);

  // Escape closes the deck.
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  const active   = cards.find(c => c.id === activeCardId) ?? null;
  const inactive = cards.filter(c => c.id !== activeCardId);
  const motion   = `${motionDuration()} cubic-bezier(0.4,0,0.2,1)`;
  const scrollBy = (dy: number) => { if (scrollRef.current) scrollRef.current.scrollTop += dy; };
  /** A1: true when the deck stack overflows and can scroll (drag = scroll mode). */
  const canDeckScroll = () => {
    const el = scrollRef.current;
    return !!el && el.scrollHeight > el.clientHeight + 1;
  };

  return (
    <>
      {/* Backdrop — covers content above the tab bar; tabs stay usable. Tap closes.
          A4: bottom anchored to the MEASURED nav height (incl. safe-area inset). */}
      <div
        onClick={onClose}
        aria-hidden="true"
        data-testid="deck-backdrop"
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: bottomOffset,
          zIndex: 30, background: `rgba(20,28,24,${risen ? 0.45 : 0})`,
          transition: `background ${motion}`,
        }}
      />
      {/* Deck — R003 flush full-width, square-edged stacked bars */}
      <div
        role="dialog"
        aria-label={deckLabel}
        data-testid="deck-panel"
        style={{
          position: 'absolute', left: 0, right: 0, bottom: bottomOffset,
          maxHeight: `calc(100% - ${bottomOffset + 60}px)`,
          zIndex: 31,
          display: 'flex', flexDirection: 'column',
          padding: 0,
          transform: risen ? 'translateY(0)' : 'translateY(105%)',
          transition: `transform ${motion}`,
          boxSizing: 'border-box',
        }}
      >
        {/* Deck label row */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px 8px', flexShrink: 0 }}>
          <span style={{
            fontFamily: SERIF, fontSize: 16, fontWeight: 700, color: '#fff',
            textShadow: '0 1px 3px rgba(0,0,0,0.45)',
          }}>
            {deckLabel}
          </span>
          <div style={{ flex: 1 }}/>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label={`Close ${deckLabel}`}
            style={{
              background: 'none', border: 'none', borderRadius: '50%',
              width: 44, height: 44, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {/* 28px visual circle, 44px tap target */}
            <span style={{ width: 28, height: 28, borderRadius: 14, background: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} color="#fff" strokeWidth={2}/>
            </span>
          </button>
        </div>

        {/* Scrollable bar stack — B6: no visible scrollbar chrome */}
        <div
          ref={scrollRef}
          className="tw-noscrollbar"
          data-testid="deck-scroll"
          style={{
            overflowY: 'auto', overflowX: 'hidden',
            display: 'flex', flexDirection: 'column',
            minHeight: 0,
            scrollbarWidth: 'none',
            overscrollBehavior: 'contain',
            borderTop: `1px solid rgba(0,0,0,0.10)`,
          }}
        >
          {/* Active / operational bar (square-edged, flush) */}
          {active && (
            <div
              role="group"
              aria-label={`${active.title} — active card`}
              style={{
                background: CARD_BG, borderRadius: 0,
                boxShadow: '0 4px 18px rgba(0,0,0,0.18)',
                marginBottom: 6, display: 'flex', flexDirection: 'column',
                overflow: 'hidden', flexShrink: 0,
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px', borderBottom: `1px solid ${DIVIDER}`,
                minHeight: BAR_PEEK_H, boxSizing: 'border-box',
              }}>
                {active.icon && (
                  <span style={{
                    width: 32, height: 32, borderRadius: 0, background: 'rgba(42,87,64,0.10)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, color: NAV_ACTIVE,
                  }}>
                    {active.icon}
                  </span>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 700, color: PRIMARY, fontFamily: SERIF }}>
                    {active.title}
                  </div>
                  {active.subtitle && (
                    <div style={{ fontSize: 11.5, color: MUTED, marginTop: 1 }}>{active.subtitle}</div>
                  )}
                </div>
              </div>
              {/* R007 §11/12 — maxHeight:300 inner scroll removed. The active
                  card content expands to its natural full height; the parent
                  CardDeck scroll container (deck-scroll) owns vertical overflow.
                  Neither Weight Distribution nor Pack Summary clips its content
                  in a nested 300px window any more. */}
              <div>
                {active.render?.()}
              </div>
            </div>
          )}

          {/* Inactive stacked bars */}
          {inactive.map((card, i) => (
            <DeckInactiveCard
              key={card.id}
              card={card}
              index={i}
              onActivate={() => onActivateCard(card.id)}
              scrollBy={scrollBy}
              canDeckScroll={canDeckScroll}
            />
          ))}

          {cards.length === 0 && emptyNote && (
            <div style={{
              background: CARD_BG, borderRadius: 0,
              padding: '28px 20px', textAlign: 'center', color: MUTED, fontSize: 14, fontFamily: SANS,
            }}>
              {emptyNote}
            </div>
          )}
        </div>
      </div>
    </>
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
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: NAV_ACTIVE, fontSize: 16, fontFamily: SANS, fontWeight: 500, padding: '4px 0', minHeight: 44 }}
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
  // Navigation stack (sub-pages only: footer-page, share, sources)
  const [screenStack, setScreenStack] = useState<ScreenEntry[]>([{ screen: 'list' }]);

  // ── R002 card-deck navigation state ──────────────────────────────────────────
  // activeDeck: which deck is raised (null = resting full-width list).
  // activeCardId: which card in the open deck is docked in the operational position.
  const [activeDeck, setActiveDeck] = useState<DeckId | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [lockerEntries, setLockerEntries] = useState<LockerEntry[]>([]);

  // ── R0082: navigation drawer ──────────────────────────────────────────────
  const [showDrawer, setShowDrawer] = useState(false);
  const [handedness, setHandedness] = useState<Handedness>(() => {
    try { return (localStorage.getItem('tw-handedness') as Handedness) || 'right'; }
    catch { return 'right'; }
  });
  // After openDeck('more') renders, activate the pending card (Settings shortcut).
  const [pendingCardActivation, setPendingCardActivation] = useState<string | null>(null);

  const openDeck = useCallback((deck: DeckId) => {
    setOpenSwipe(null); // R004: opening a deck closes any open delete reveal
    setActiveDeck(prev => {
      if (prev === deck) { setActiveCardId(null); return null; }  // re-tap toggles closed
      if (deck === 'locker') setLockerEntries(readLockerEntries());
      setActiveCardId(null);
      return deck;                                                // different tap switches directly
    });
  }, []);
  const closeDeck = useCallback(() => { setActiveDeck(null); setActiveCardId(null); }, []);
  const activateCard = useCallback((id: string) => { setActiveCardId(id); hapticDock(); }, []);

  // ── A4: measured bottom-nav occupied height — single source of truth for the
  //    deck/backdrop bottom offset. Tracks safe-area inset growth via ResizeObserver.
  const [navHeight, setNavHeight] = useState(NAV_H);
  const navRoRef = useRef<ResizeObserver | null>(null);

  // R0075: measured List Summary bar height — sticky top for open category header
  const [summaryH, setSummaryH] = useState(0);
  const summaryRoRef = useRef<ResizeObserver | null>(null);
  const summaryRef = useCallback((el: HTMLDivElement | null) => {
    summaryRoRef.current?.disconnect();
    summaryRoRef.current = null;
    if (!el) return;
    const update = () => setSummaryH(Math.round(el.getBoundingClientRect().height));
    update();
    const ro = new ResizeObserver(update);
    try { ro.observe(el, { box: 'border-box' }); } catch { ro.observe(el); }
    summaryRoRef.current = ro;
  }, []);

  // R0075: refs for scroll-based overflow chevron on the contextual Add Item bar
  const mainScrollRef = useRef<HTMLDivElement | null>(null);
  const openCatItemsRef = useRef<HTMLDivElement | null>(null);
  const [catOverflow, setCatOverflow] = useState<{ above: boolean; below: boolean }>({ above: false, below: false });

  // R0076: whether the currently open category is "long" (needs bounded item viewport)
  const [isCatLong, setIsCatLong] = useState(false);
  // R0076: available px for item rows in bounded mode — set from ACTUAL DOM positions
  // (not from stale state) when isCatLong activates, so it's always exact.
  const [availItemH, setAvailItemH] = useState(200);
  // R0076 repair: track previous item count for the open category so we can
  // auto-scroll to a newly added item without re-running the initial scroll-in.
  const prevOpenCatItemCountRef = useRef(0);
  // Callback ref: the component mounts the nav only after its loading gate, so a
  // one-shot effect would see null — attach measurement whenever the node appears.
  const navRef = useCallback((el: HTMLDivElement | null) => {
    navRoRef.current?.disconnect();
    navRoRef.current = null;
    if (!el) return;
    const update = () => setNavHeight(Math.round(el.getBoundingClientRect().height));
    update();
    const ro = new ResizeObserver(update);
    // Safe-area insets grow the nav's PADDING, not its content box — observe the
    // border-box so padding-only growth still triggers a re-measure.
    try { ro.observe(el, { box: 'border-box' }); } catch { ro.observe(el); }
    navRoRef.current = ro;
  }, []);

  const [showSummary, setShowSummary] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // 027Q navigation helpers
  const currentScreen = screenStack[screenStack.length - 1];
  const pushScreen = useCallback((entry: ScreenEntry) => setScreenStack(prev => [...prev, entry]), []);
  const popScreen = useCallback(() => setScreenStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev), []);

  // Category accordion
  const [openCatName, setOpenCatName] = useState<string | null>(null);
  const [allExpanded, setAllExpanded] = useState(false);
  const [expandedItem, setExpandedItem] = useState<{ cat: string; id: string } | null>(null);

  // Add category UI (R004 Part 4 — inline control removed; ADD deck is the only entry)
  const [newCatName, setNewCatName] = useState('');

  // Checklist-use state (separate from item.checked — tracks trail progress only)
  const [checklistUse, setChecklistUse] = useState<Record<string, boolean>>({});

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Category reorder via Pointer Events
  const catListRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ catIdx: number; dstIdx: number; origOrder: string[]; grabDY: number; draggedH: number } | null>(null);
  const liftRef = useRef(0); // R005 Part 8 — current applied translateY of the floating card
  const [dragSrcIdx, setDragSrcIdx] = useState<number | null>(null);
  // R004 Part 1 — at most ONE delete reveal open at a time (key: 'cat:<name>' | 'item:<cat>:<id>')
  const [openSwipe, setOpenSwipe] = useState<string | null>(null);
  // R004 Part 2 — name-keyed floating drag + single valid-target dim
  const [dragCatName, setDragCatName] = useState<string | null>(null);
  const [dragTargetName, setDragTargetName] = useState<string | null>(null);
  const [dragLift, setDragLift] = useState(0);
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

  // R0079 — Save chooser / Save As / Reset checked-state / Locker delete
  const [activeLockerEntryId, setActiveLockerEntryId] = useState<string | null>(null);
  const [showSaveChooser, setShowSaveChooser] = useState(false);
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
  const [saveAsName, setSaveAsName] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [lockerDeleteTarget, setLockerDeleteTarget] = useState<LockerEntry | null>(null);

  // D6 — item delete confirmation
  const [deleteItemConfirm, setDeleteItemConfirm] = useState<{ cat: string; id: string; name: string } | null>(null);
  // R0077P2 — dialog focus management
  const deleteTriggerRef   = useRef<HTMLElement | null>(null);  // which Delete btn opened the dialog
  const deleteConfirmedRef = useRef(false);                     // true when item was actually deleted
  const cancelDialogBtnRef  = useRef<HTMLButtonElement | null>(null);
  const confirmDialogBtnRef = useRef<HTMLButtonElement | null>(null);
  // R0079 — focus refs for new dialogs (initial focus on Cancel/safe button)
  const saveChooserCancelRef  = useRef<HTMLButtonElement | null>(null);
  const saveAsCancelRef        = useRef<HTMLButtonElement | null>(null);
  const saveAsInputRef         = useRef<HTMLInputElement  | null>(null);
  const resetCancelRef         = useRef<HTMLButtonElement | null>(null);
  const lockerDeleteCancelRef  = useRef<HTMLButtonElement | null>(null);

  // ── Helpers ───────────────────────────────────────────────────────────────────

  // Clear any pending toast timer on unmount (this view can be navigated away from).
  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  // R0077P2 — focus management for item delete dialog.
  // On open: focus Cancel (safe default). On close: return to trigger or Add Item fallback.
  useEffect(() => {
    if (deleteItemConfirm) {
      // Dialog just opened — focus Cancel after a tick for render to complete.
      const id = setTimeout(() => cancelDialogBtnRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
    // Dialog just closed.
    if (deleteConfirmedRef.current) {
      // Item was deleted — trigger is gone; fall back to Add Item button.
      deleteConfirmedRef.current = false;
      const addBtn = document.querySelector('[data-testid="cat-add-item-btn"]') as HTMLElement | null;
      addBtn?.focus();
    } else {
      // Cancelled — return focus to the button that opened the dialog.
      (deleteTriggerRef.current as HTMLElement | null)?.focus();
    }
    deleteTriggerRef.current = null;
    return undefined;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteItemConfirm]);

  // R0079 — focus management for new dialogs (all focus Cancel / input on open)
  useEffect(() => {
    if (showSaveChooser) {
      const id = setTimeout(() => saveChooserCancelRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [showSaveChooser]);
  useEffect(() => {
    if (showSaveAsDialog) {
      const id = setTimeout(() => saveAsInputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [showSaveAsDialog]);
  useEffect(() => {
    if (showResetConfirm) {
      const id = setTimeout(() => resetCancelRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [showResetConfirm]);
  useEffect(() => {
    if (lockerDeleteTarget) {
      const id = setTimeout(() => lockerDeleteCancelRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [lockerDeleteTarget]);

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

  // ── Reset — R0079: shows confirmation; only clears checked/packed marks ──────

  const handleReset = useCallback(() => {
    setShowResetConfirm(true);
  }, []);

  const handleResetConfirm = useCallback(() => {
    // Clear every item's checked mark; preserve all other fields.
    mutateSandbox(prev => {
      const newItems: SandboxStore['items'] = {};
      for (const cat of Object.keys(prev.items)) {
        newItems[cat] = prev.items[cat].map(item => ({ ...item, checked: false }));
      }
      return { ...prev, items: newItems };
    });
    setShowResetConfirm(false);
    showToast('Checked items cleared');
  }, [mutateSandbox, showToast]);

  // ── Save — R0079: opens chooser (Save / Save As / Cancel) ────────────────────

  /** Open the save chooser sheet. Does NOT immediately save. */
  const handleSave = useCallback(() => {
    setShowSaveChooser(true);
  }, []);

  /** Save to the currently active Locker entry (update), or auto-create new (unsaved list). */
  const handleSaveNow = useCallback(() => {
    setShowSaveChooser(false);
    const now = new Date();
    if (activeLockerEntryId) {
      const all = readLockerEntries();
      const existing = all.find(e => e.id === activeLockerEntryId);
      if (existing) {
        const updated: LockerEntry = {
          ...existing,
          savedAt: Date.now(),
          store: {
            items: sandboxRef.current.items,
            order: sandboxRef.current.order,
            meta:  sandboxRef.current.meta,
          } as LockerEntry['store'],
        };
        updateLockerEntry(activeLockerEntryId, updated);
        showToast(`Saved "${existing.name}"`);
        return;
      }
    }
    // No active entry — create new with auto-generated name (same as legacy behaviour).
    const name = `${listName} — ${now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ${now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
    const entry: LockerEntry = {
      id: crypto.randomUUID(),
      name,
      savedAt: Date.now(),
      store: {
        items: sandboxRef.current.items,
        order: sandboxRef.current.order,
        meta:  sandboxRef.current.meta,
      } as LockerEntry['store'],
      background: null,
      bgFade:     0.3,
      bgTone:     'light',
    };
    appendLockerEntry(entry);
    setActiveLockerEntryId(entry.id);
    showToast(`Saved as "${name}"`);
  }, [activeLockerEntryId, listName, showToast]);

  /** Open the Save As name dialog. */
  const handleSaveAsOpen = useCallback(() => {
    setShowSaveChooser(false);
    setSaveAsName(listName);
    setShowSaveAsDialog(true);
  }, [listName]);

  /** Create a new independent Locker copy with the typed name. */
  const handleSaveAsConfirm = useCallback(() => {
    const name = saveAsName.trim() || listName;
    const newId = crypto.randomUUID();
    const entry: LockerEntry = {
      id: newId,
      name,
      savedAt: Date.now(),
      store: {
        items: sandboxRef.current.items,
        order: sandboxRef.current.order,
        meta:  sandboxRef.current.meta,
      } as LockerEntry['store'],
      background: null,
      bgFade:     0.3,
      bgTone:     'light',
    };
    appendLockerEntry(entry);
    setActiveLockerEntryId(newId);
    setListName(name);
    setShowSaveAsDialog(false);
    showToast(`Saved as "${name}"`);
  }, [saveAsName, listName, showToast]);

  /** Delete the targeted Locker entry; if it is the active list, detach identity only. */
  const handleLockerDeleteConfirm = useCallback(() => {
    if (!lockerDeleteTarget) return;
    const { id, name } = lockerDeleteTarget;
    removeLockerEntry(id);
    if (activeLockerEntryId === id) {
      // Keep the working list in memory as unsaved; next Save creates a new entry.
      setActiveLockerEntryId(null);
    }
    // Refresh the locker entries panel.
    setLockerEntries(readLockerEntries());
    setLockerDeleteTarget(null);
    showToast(`Deleted "${name}"`);
  }, [lockerDeleteTarget, activeLockerEntryId, showToast]);

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

  // ── R0082: pending Settings card activation (after More deck opens) ─────────
  useEffect(() => {
    if (pendingCardActivation && activeDeck === 'more') {
      activateCard(pendingCardActivation);
      setPendingCardActivation(null);
    }
  }, [activeDeck, pendingCardActivation, activateCard]);

  // ── R0082: drawer action handlers ────────────────────────────────────────
  const handleToggleHandedness = useCallback(() => {
    setHandedness(prev => {
      const next: Handedness = prev === 'right' ? 'left' : 'right';
      try { localStorage.setItem('tw-handedness', next); } catch {}
      return next;
    });
  }, []);

  const handleDrawerHome = useCallback(() => {
    setShowDrawer(false);
    closeDeck();
  }, [closeDeck]);

  const handleDrawerMyLists = useCallback(() => {
    setOpenSwipe(null);
    setShowDrawer(false);
    openDeck('locker');
  }, [openDeck]);

  const handleDrawerHelp = useCallback(() => {
    setShowDrawer(false);
    pushScreen({ screen: 'footer-page', footerPageId: 'help' });
  }, [pushScreen]);

  const handleDrawerSettings = useCallback(() => {
    setOpenSwipe(null);
    setShowDrawer(false);
    openDeck('more');
    setPendingCardActivation('list-settings');
  }, [openDeck]);

  // ── Camera / Photos (Group 3 stubs — no downstream photo workflow in R007) ──
  // R007 §10: Camera and Photos are rendered correctly in Group 3. No photo-
  // storage subsystem exists yet; these handlers show a clear "coming soon" toast
  // so the controls are honest placeholders. The downstream workflow is noted in
  // R007.md under "Remaining Defects / Uncertainty".

  const handleCamera = useCallback(() => {
    showToast('Camera capture — coming in a future update');
  }, [showToast]);

  const handlePhotos = useCallback(() => {
    showToast('Photo library — coming in a future update');
  }, [showToast]);

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

  // R0075: expand/collapse all — restored for the List Summary global chevron
  const handleExpandAll   = useCallback(() => setAllExpanded(true), []);
  const handleCollapseAll = useCallback(() => { setAllExpanded(false); setOpenCatName(null); }, []);

  // (R002: the left/right/bottom slider gesture handlers were retired with the
  //  slider components — deck interaction lives in CardDeck / DeckInactiveCard.)

  const isCatOpen = (catName: string) => allExpanded || openCatName === catName;

  // R0076 repair: item count for the currently open category — used to detect
  // SHORT→LONG / LONG→SHORT transitions without requiring close + reopen.
  const openCatItemCount = openCatName ? (sandbox.items[openCatName] ?? []).length : 0;

  // R0076: recompute ▲/▼ chevron states from the item container's own scroll.
  const recalcCatOverflow = useCallback(() => {
    const items = openCatItemsRef.current;
    if (!items || !items.isConnected) { setCatOverflow({ above: false, below: false }); return; }
    if (isCatLong) {
      setCatOverflow({
        above: items.scrollTop > 4,
        below: items.scrollTop < items.scrollHeight - items.clientHeight - 4,
      });
      return;
    }
    setCatOverflow({ above: false, below: false });
  }, [isCatLong]);

  // R0076: scroll the item container (bounded mode).
  const scrollCatItems = useCallback((dir: 'down' | 'up') => {
    const items = openCatItemsRef.current;
    if (isCatLong && items) {
      const pageH = items.clientHeight;
      items.scrollBy({ top: dir === 'down' ? pageH : -pageH, behavior: 'smooth' });
      setTimeout(() => recalcCatOverflow(), 350);
      return;
    }
    const ms = mainScrollRef.current;
    if (!ms) return;
    const pageH = ms.clientHeight - summaryH - BAR_PEEK_H - 44;
    ms.scrollBy({ top: dir === 'down' ? pageH : -pageH, behavior: 'smooth' });
  }, [isCatLong, summaryH, recalcCatOverflow]);

  // R0076 repair: shared measurement helper — reads live DOM positions and updates
  // isCatLong / availItemH.  Called both from the initial open-effect and from the
  // items-count effect so transitions happen without close/reopen.
  // KEY: measure from the item container's OWN top (= headerBottom after layout),
  // NOT from summaryBottom − CARD_H.  This eliminates sub-pixel rounding drift
  // between the category header position and the summary bar bottom.
  const remeasureLongMode = useCallback(() => {
    const itemsEl = openCatItemsRef.current;
    if (!itemsEl?.isConnected) { setIsCatLong(false); return; }
    const navEl   = document.querySelector('[data-testid="bottom-nav"]') as HTMLElement | null;
    const itemsTop = itemsEl.getBoundingClientRect().top;
    const navTop   = navEl ? navEl.getBoundingClientRect().top : (window.innerHeight - navHeight);
    // availItemH = space between item container top and the Add Item bar bottom.
    // Add Item bar is 44px, so: rawAvailH = navTop − itemsTop − 44
    const rawAvailH = navTop - itemsTop - 44;
    const clampedH  = Math.max(44, rawAvailH);
    setAvailItemH(clampedH);
    setIsCatLong(itemsEl.scrollHeight > rawAvailH + 4);
  }, [navHeight]);

  // R0076: scroll category into view then measure long-mode on open/close.
  useEffect(() => {
    if (!openCatName || allExpanded) {
      setCatOverflow({ above: false, below: false });
      setIsCatLong(false);
      prevOpenCatItemCountRef.current = 0;
      return;
    }
    const ms     = mainScrollRef.current;
    const listEl = catListRef.current;
    if (!ms || !listEl) return;
    const catEl = listEl.querySelector(`[data-cat="${CSS.escape(openCatName)}"]`) as HTMLElement | null;
    if (!catEl) return;

    // R0076P2 — Use INSTANT scroll (not smooth) so the final position is
    // deterministic before the parent is locked.  A second RAF then reads the
    // actual settled geometry and applies a sub-pixel corrective offset if needed.
    // This replaces the previous smooth-scroll + 420 ms fixed-timer approach which
    // could lock the scroller before the animation finished, leaving other
    // categories visible between List Summary and the active long-category header.
    let raf1 = -1;
    let raf2 = -1;

    raf1 = requestAnimationFrame(() => {
      // NOTE: Do NOT set ms.style.overflowY = 'auto' here.
      // overflow:hidden elements still accept programmatic scrollTop changes (per spec),
      // so there is no need to unlock the outer scroll.  The previous R0076P2 approach
      // of setting overflowY='auto' to allow scrollTop changes was unnecessary, and the
      // inline style persisted when isCatLong was already true (no re-render → no
      // reset), leaving main-scroll permanently open to native touch scroll (R0076P3 Defect 1).

      const summaryEl = document.querySelector('[data-testid="list-summary-bar"]') as HTMLElement | null;
      const summaryBtm = summaryEl ? summaryEl.getBoundingClientRect().bottom : summaryH;
      const catTop     = catEl.getBoundingClientRect().top;
      // delta = how far the category header top is from its target (summaryBtm)
      const delta  = catTop - summaryBtm;
      const target = Math.max(0, ms.scrollTop + delta);

      // Direct property assignment — guaranteed synchronous in all browsers.
      // ms.scrollTo({ behavior: 'instant' }) is NOT reliably synchronous in Chrome
      // (it queues a task like smooth scroll); ms.scrollTop = N is always instant.
      ms.scrollTop = Math.max(0, target);

      // Second RAF: re-read the actual settled geometry and correct any sub-pixel residual.
      raf2 = requestAnimationFrame(() => {
        const summaryEl2 = document.querySelector('[data-testid="list-summary-bar"]') as HTMLElement | null;
        const summaryBtm2 = summaryEl2 ? summaryEl2.getBoundingClientRect().bottom : summaryH;
        const residual    = catEl.getBoundingClientRect().top - summaryBtm2;
        if (Math.abs(residual) > 0.5) {
          ms.scrollTop = Math.max(0, ms.scrollTop + residual);
        }
        // Header is now exactly at summaryBtm — run long-mode measurement and lock.
        remeasureLongMode();
        prevOpenCatItemCountRef.current = openCatName
          ? (sandbox.items[openCatName] ?? []).length
          : 0;
      });
    });

    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  // R0076P2: isCatLong is in deps so the effect re-fires when the category transitions
  // from short → long.  On first open (few items), the main-scroll content may be too
  // short for the full delta scroll, clamping scrollTop prematurely.  Re-firing when
  // isCatLong=true (content is now tall enough) applies the corrective offset.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCatName, isCatLong, allExpanded, summaryH, navHeight]);

  // R0076 repair: re-measure when items are added/deleted in the open category
  // so SHORT→LONG and LONG→SHORT transitions happen without close/reopen.
  useEffect(() => {
    if (!openCatName || allExpanded) return;
    const t = setTimeout(() => {
      remeasureLongMode();
    }, 150);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCatItemCount]);

  // R0076 repair: when an item is added to the open category while in long mode,
  // auto-scroll the item viewport so the new row is visible.
  useEffect(() => {
    if (!openCatName || allExpanded) return;
    if (openCatItemCount > prevOpenCatItemCountRef.current) {
      const el = openCatItemsRef.current;
      if (el) {
        setTimeout(() => {
          el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
          setTimeout(recalcCatOverflow, 350);
        }, 200);
      }
    }
    prevOpenCatItemCountRef.current = openCatItemCount;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCatItemCount]);

  // R0076: once isCatLong is established recalculate overflow so ▲/▼ appear immediately.
  useEffect(() => {
    if (isCatLong) setTimeout(() => recalcCatOverflow(), 60);
    else setCatOverflow({ above: false, below: false });
  }, [isCatLong, recalcCatOverflow]);

  // R0076P2: when an item accordion opens inside the bounded item viewport, auto-scroll
  // ONLY the item viewport just enough to reveal the Delete Item row immediately above
  // the fixed Add Item bar.  If the accordion already fits, nothing moves.
  useEffect(() => {
    if (!expandedItem || !isCatLong) return;
    const t = setTimeout(() => {
      const el = openCatItemsRef.current;
      if (!el) return;
      // Locate the Delete Item row (testid set only when isExpanded && isCatLong)
      const deleteRow = el.querySelector('[data-testid="item-delete-row"]') as HTMLElement | null;
      if (!deleteRow) return;
      const elRect     = el.getBoundingClientRect();
      const deleteBottom = deleteRow.getBoundingClientRect().bottom;
      // Only scroll if the Delete Item row extends below the visible item viewport.
      if (deleteBottom > elRect.bottom + 1) {
        el.scrollTop += (deleteBottom - elRect.bottom) + 2; // +2 breathing room
        setTimeout(recalcCatOverflow, 60);
      }
    }, 200); // Allow accordion render to settle before measuring
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedItem, isCatLong]);

  // ── Item expand/collapse ──────────────────────────────────────────────────────

  const handleItemToggle = useCallback((cat: string, id: string) => {
    setExpandedItem(prev => prev?.cat === cat && prev?.id === id ? null : { cat, id });
  }, []);

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

  // R005 Part 8 — drag tracking moved to WINDOW-level pointer listeners.
  // Why: the live reorder preview moves the dragged card's DOM node, which
  // makes the browser fire `lostpointercapture` on the grip button mid-drag.
  // Element-level capture therefore cannot survive a row crossing; window
  // listeners keep receiving pointermove/up/cancel regardless of DOM moves.

  const gripCleanupRef = useRef<(() => void) | null>(null);

  // D1 FIX: use actual element midpoints instead of fixed catHeight
  // This handles mixed-height categories (expanded vs collapsed) correctly
  const gripMoveAt = useCallback((clientY: number) => {
    if (!dragRef.current) return;
    const container = catListRef.current;
    if (!container) return;
    const children = Array.from(container.children) as HTMLElement[];
    // R005 Part 8 / R006 Part 3 — every card can carry a translateY (the dragged
    // card follows the finger; displaced bars glide by ±draggedH), so slot
    // detection always uses UNTRANSFORMED midpoints: subtract each card's
    // currently rendered translateY (computed transform matrix f value).
    // The DOM order is the ORIGINAL order for the whole drag (R006: no live
    // re-splicing), so the scan index IS the destination index in origOrder.
    const renderedYOf = (el: HTMLElement): number => {
      const t = getComputedStyle(el).transform;
      if (!t || t === 'none') return 0;
      const m = t.match(/matrix\(([^)]+)\)/);
      return m ? (parseFloat(m[1].split(',')[5]) || 0) : 0;
    };
    let newIdx = 0;
    for (let i = 0; i < children.length; i++) {
      const rect = children[i].getBoundingClientRect();
      if (clientY >= rect.top + rect.height / 2 - renderedYOf(children[i])) newIdx = i;
    }
    newIdx = Math.max(0, Math.min(dragRef.current.origOrder.length - 1, newIdx));
    dragRef.current.dstIdx = newIdx;
    setDragDstIdx(newIdx);

    // R004 Part 2 — valid-target dim, computed against the STABLE original order,
    // not the live-reordered children (the floating card occupies the pointer's
    // slot in the preview, which would otherwise clear the dim mid-cross).
    // Target = the single category being displaced by the current destination.
    const { catIdx, origOrder } = dragRef.current;
    setDragTargetName(newIdx === catIdx ? null : origOrder[newIdx] ?? null);

    // R005 Part 8 — true finger-follow: the floating card's translateY keeps the
    // grab point under the finger across the FULL drag distance (no small clamp).
    // The measured rect includes whatever transform is CURRENTLY RENDERED (which
    // can lag the last state update between React renders), so subtract the
    // rendered translateY — read from the computed transform matrix — to get the
    // card's untransformed slot center. Using a ref here instead would double-
    // count deltas whenever several pointermoves land between two renders.
    const draggedName = origOrder[catIdx];
    for (const child of children) {
      if ((child as HTMLElement).dataset.cat === draggedName) {
        const rect = child.getBoundingClientRect();
        const renderedY = renderedYOf(child);
        const slotCenter = rect.top + rect.height / 2 - renderedY;
        const lift = clientY - slotCenter - dragRef.current.grabDY;
        liftRef.current = lift;
        setDragLift(lift);
        break;
      }
    }
  }, []);

  const gripFinish = useCallback(() => {
    // R004: release clears ALL drag visuals immediately — no residual dim/elevation
    setDragCatName(null); setDragTargetName(null); setDragLift(0); liftRef.current = 0;
    const drag = dragRef.current;
    dragRef.current = null;
    setDragSrcIdx(null); setDragDstIdx(null);
    if (!drag) return;
    const { catIdx, origOrder, dstIdx } = drag;
    if (dstIdx !== catIdx) {
      const newOrder = [...origOrder];
      const [moved] = newOrder.splice(catIdx, 1);
      newOrder.splice(dstIdx, 0, moved);
      mutateSandbox(prev => ({ ...prev, order: newOrder }));
      showToast('Category order saved');
      // R007 Part 9 — ONE light haptic when a category settles into a NEW position.
      // No haptic during drag, no haptic when position is unchanged.
      hapticDock();
    }
  }, [mutateSandbox, showToast]);

  // R004 — idempotent CANCELLATION path (pointercancel):
  // clears every drag effect and does NOT commit a reorder.
  const handleGripPointerCancel = useCallback(() => {
    if (!dragRef.current) return; // no-op after a normal pointerup already finalized
    dragRef.current = null;
    setDragSrcIdx(null); setDragDstIdx(null);
    setDragCatName(null); setDragTargetName(null); setDragLift(0); liftRef.current = 0;
  }, []);

  // R006 Part 2 — reorder is now started by a LONG PRESS directly on the
  // category bar (the six-dot handle is gone). `startReorder` contains the
  // drag machinery shared by any initiation path; the long-press detector
  // below decides WHEN to call it.
  const startReorder = useCallback((catName: string, clientY: number, pointerId: number) => {
    // Replacement pointer: fully CANCEL any active drag (state + listeners)
    // before starting a new one — never just drop the listeners.
    if (dragRef.current) {
      gripCleanupRef.current?.();
      handleGripPointerCancel();
    }
    // Stable identity: resolve the dragged category by NAME against the saved
    // order — never by rendered slot index, which diverges from the data order
    // while a live reorder preview is showing.
    const catIdx = sandboxRef.current.order.indexOf(catName);
    if (catIdx < 0) return;
    // R005 Part 8 — true finger-follow: remember the finger's offset from the
    // dragged card's center so the card tracks the finger 1:1 for the whole drag.
    let grabDY = 0;
    let draggedH = CARD_H;
    const container = catListRef.current;
    if (container) {
      for (const child of Array.from(container.children) as HTMLElement[]) {
        if (child.dataset.cat === catName) {
          const rect = child.getBoundingClientRect();
          grabDY = clientY - (rect.top + rect.height / 2);
          draggedH = rect.height;
          break;
        }
      }
    }
    liftRef.current = 0;
    dragRef.current = {
      catIdx,
      dstIdx: catIdx,
      origOrder: [...sandboxRef.current.order],
      grabDY,
      draggedH,
    };
    setOpenSwipe(null); // R004: starting reorder closes any open delete reveal
    setDragCatName(catName); // name-keyed floating style
    setDragTargetName(null);
    setDragLift(0);
    setDragSrcIdx(catIdx);
    setDragDstIdx(catIdx);
    // R006 Part 2 — one subtle, genuinely supported haptic on entering reorder
    // mode; navigator.vibrate is a no-op ONLY where truly unsupported.
    try { if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(10); } catch { /* no haptics */ }

    const onMove = (ev: PointerEvent) => { if (ev.pointerId === pointerId) gripMoveAt(ev.clientY); };
    const onUp = (ev: PointerEvent) => { if (ev.pointerId === pointerId) { gripFinish(); cleanup(); } };
    // pointercancel is per-pointer: only OUR pointer's cancellation aborts the
    // drag. (Synthetic cancellations dispatched at the category list — e.g.
    // gesture-takeover simulation in tests — also count; an unrelated second
    // pointer's cancel must NOT kill the active drag.)
    const onCancel = (ev: PointerEvent) => {
      const targetsList = ev.target instanceof Node && !!catListRef.current?.contains(ev.target);
      if (ev.pointerId === pointerId || targetsList) { handleGripPointerCancel(); cleanup(); }
    };
    // Losing the window (tab switch, app switch, incoming call) must not leave
    // a stuck floating card: cancel without committing.
    const onBlur = () => { handleGripPointerCancel(); cleanup(); };
    const onVisibility = () => { if (document.visibilityState === 'hidden') { handleGripPointerCancel(); cleanup(); } };
    // R006 — after reorder mode activates, the drag OWNS the gesture: block
    // native touch scrolling for its duration so the browser cannot take the
    // pointer away (pointercancel) mid-drag. Registered non-passive on purpose.
    const onTouchMove = (ev: TouchEvent) => { if (ev.cancelable) ev.preventDefault(); };
    const cleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('touchmove', onTouchMove);
      gripCleanupRef.current = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    gripCleanupRef.current = cleanup;
  }, [gripMoveAt, gripFinish, handleGripPointerCancel]);

  // Unmount safety: drop window listeners if the view unmounts mid-drag
  useEffect(() => () => { gripCleanupRef.current?.(); }, []);

  // ── R006 Part 2/4 — long-press detection on the category bar ─────────────────
  // One stable threshold: 400 ms stationary hold enters reorder mode.
  // Gesture arbitration BEFORE the threshold:
  //   • vertical move beyond the jitter slop   → list scroll wins, hold cancelled;
  //   • horizontal move beyond the jitter slop → slide-to-delete wins, hold cancelled;
  //   • ≤ slop movement (finger jitter)        → hold stays alive.
  // After activation the drag owns the gesture until release/cancel; the click
  // that follows is swallowed so the accordion never toggles from a reorder.
  // The hold is a POINTER-ID-OWNED lifecycle: its pre-activation tracking
  // lives on window/document listeners (not the bar element), so a finger that
  // leaves the bar, a terminal event delivered elsewhere, blur, or a hidden
  // tab all tear the hold down atomically — the timer can never fire for a
  // pointer that is no longer down. Terminal/move events from OTHER pointers
  // are ignored (no cross-pointer cancellation, no second-pointer takeover).
  const holdRef = useRef<{ timer: number; pointerId: number; catName: string; startX: number; startY: number; lastY: number; cleanup: () => void } | null>(null);
  const reorderJustHappenedRef = useRef(false);
  const clearSwallowTimerRef = useRef<number | null>(null);

  // Swallow exactly the click that trails a reorder, then self-clear: cancel
  // paths (pointercancel/blur/hidden) produce no click, and the flag must not
  // eat the NEXT legitimate tap.
  const armClickSwallow = useCallback(() => {
    reorderJustHappenedRef.current = true;
    if (clearSwallowTimerRef.current !== null) window.clearTimeout(clearSwallowTimerRef.current);
    clearSwallowTimerRef.current = window.setTimeout(() => {
      reorderJustHappenedRef.current = false;
      clearSwallowTimerRef.current = null;
    }, 300);
  }, []);

  const clearHold = useCallback(() => {
    const h = holdRef.current;
    if (h) { holdRef.current = null; window.clearTimeout(h.timer); h.cleanup(); }
  }, []);

  const handleCatBarPointerDown = useCallback((e: React.PointerEvent, catName: string) => {
    // One hold at a time; a second pointer never disturbs an armed hold or an
    // active drag (ownership stays with the first gesture).
    if (!e.isPrimary || dragRef.current || holdRef.current) return;
    const pointerId = e.pointerId, startX = e.clientX, startY = e.clientY;
    const onMove = (ev: PointerEvent) => {
      const h = holdRef.current;
      if (!h || ev.pointerId !== h.pointerId) return;
      h.lastY = ev.clientY;
      // Meaningful movement before the threshold disambiguates to scroll/swipe.
      if (Math.abs(ev.clientX - h.startX) > HOLD_SLOP_PX || Math.abs(ev.clientY - h.startY) > HOLD_SLOP_PX) clearHold();
    };
    const onEnd = (ev: PointerEvent) => {
      if (holdRef.current && ev.pointerId === holdRef.current.pointerId) clearHold();
    };
    const onBlur = () => clearHold();
    const onVisibility = () => { if (document.visibilityState === 'hidden') clearHold(); };
    const cleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    const timer = window.setTimeout(() => {
      const h = holdRef.current;
      holdRef.current = null;
      if (!h) return;
      h.cleanup();
      armClickSwallow(); // the trailing click belongs to the gesture
      startReorder(h.catName, h.lastY, h.pointerId);
    }, LONG_PRESS_MS);
    holdRef.current = { timer, pointerId, catName, startX, startY, lastY: startY, cleanup };
  }, [clearHold, armClickSwallow, startReorder]);

  // Unmount safety for a pending hold timer + its window listeners
  useEffect(() => () => {
    clearHold();
    if (clearSwallowTimerRef.current !== null) window.clearTimeout(clearSwallowTimerRef.current);
  }, [clearHold]);

  // R006 Part 3 — during a drag the DOM order stays FIXED (original order);
  // displaced bars glide into their temporary positions via translateY
  // transitions instead of abruptly re-splicing the list. `shiftFor` returns
  // the current offset for a non-dragged bar at original index i.
  const visibleOrder: string[] = sandbox.order;
  const shiftFor = (i: number): number => {
    const drag = dragRef.current;
    if (!drag || dragSrcIdx === null || dragDstIdx === null) return 0;
    if (dragSrcIdx < dragDstIdx && i > dragSrcIdx && i <= dragDstIdx) return -drag.draggedH;
    if (dragDstIdx < dragSrcIdx && i >= dragDstIdx && i < dragSrcIdx) return drag.draggedH;
    return 0;
  };

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
  const catCount       = sandbox.order.length;
  const su             = smallUnit(system);

  // ── R002 deck card definitions ────────────────────────────────────────────────

  /** Close the open deck, then run an existing action (mirrors old panel behavior). */
  const runAndClose = (fn: () => void) => () => { closeDeck(); fn(); };

  /** Navigate to a footer page / sources screen from a deck card. */
  const goFooter = (id: FooterPageId | 'sources') => () => {
    closeDeck();
    if (id === 'sources') pushScreen({ screen: 'sources' });
    else pushScreen({ screen: 'footer-page', footerPageId: id });
  };

  /** Action row inside an active card (existing handlers only). */
  const deckAction = (icon: React.ReactNode, label: string, onClick: () => void, disabled = false, sublabel?: string) => (
    <button
      key={label}
      onClick={() => { if (!disabled) onClick(); }}
      disabled={disabled}
      aria-label={sublabel ? `${label} — ${sublabel}` : label}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, width: '100%',
        background: 'none', border: 'none', padding: '12px 16px',
        cursor: disabled ? 'not-allowed' : 'pointer', textAlign: 'left',
        borderTop: `1px solid ${DIVIDER}`, opacity: disabled ? 0.4 : 1, fontFamily: SANS,
      }}
    >
      <span style={{ color: SECONDARY, display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>
      <span>
        <span style={{ display: 'block', fontSize: 14.5, fontWeight: 500, color: PRIMARY }}>{label}</span>
        {sublabel && <span style={{ display: 'block', fontSize: 11.5, color: MUTED, marginTop: 1 }}>{sublabel}</span>}
      </span>
    </button>
  );

  /** Link row inside an active card — routes to an existing footer page. */
  const deckLink = (label: string, pageId: FooterPageId | 'sources') => (
    <button
      key={label}
      onClick={goFooter(pageId)}
      aria-label={label}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        background: 'none', border: 'none', padding: '12px 16px',
        cursor: 'pointer', textAlign: 'left', borderTop: `1px solid ${DIVIDER}`, fontFamily: SANS,
      }}
    >
      <span style={{ flex: 1, fontSize: 14.5, fontWeight: 500, color: PRIMARY }}>{label}</span>
      <ChevronLeft size={16} color={MUTED} strokeWidth={1.8} style={{ transform: 'rotate(180deg)' }} aria-hidden="true"/>
    </button>
  );

  // LOCKER deck — one card per saved list (real metadata; Load via existing mechanism).
  const lockerCards: DeckCardDef[] = [...lockerEntries].reverse().map(entry => {
    const store       = entry.store;
    const entryItems  = Object.values(store?.items ?? {}).flat();
    const itemCount   = entryItems.length;
    const entryCats   = store?.order?.length ?? 0;
    const selCount    = entryItems.filter(i => i.checked).length;
    const totOz       = entryItems.filter(i => i.checked).reduce((s, i) => s + calcTotalOz(i.weightOz, i.qty), 0);
    const dateStr     = new Date(entry.savedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    return {
      id: entry.id,
      title: entry.name,
      subtitle: `${dateStr} · ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`,
      icon: <Folder size={18} strokeWidth={1.8}/>,
      render: () => (
        <div style={{ padding: '12px 16px 16px', fontFamily: SANS }}>
          <div style={{ fontSize: 12.5, color: SECONDARY, lineHeight: 1.7 }}>
            <div>Saved: {dateStr}</div>
            <div>
              {entryCats} {entryCats === 1 ? 'category' : 'categories'} · {itemCount} {itemCount === 1 ? 'item' : 'items'} · {selCount} selected
            </div>
            {totOz > 0 && <div>Selected weight: {formatWeight(totOz, system, 'small')} {su}</div>}
          </div>
          <button
            onClick={() => {
              if (store) {
                mutateSandbox(() => ({
                  items: store.items ?? {},
                  order: store.order ?? [],
                  meta:  store.meta ?? {},
                }));
                // A2: the loaded Locker entry's name becomes the active list identity
                // immediately — subsequent Save and Share use this name.
                setListName(entry.name);
                // R0079: track which Locker entry is active so Save updates it.
                setActiveLockerEntryId(entry.id);
                closeDeck();
                showToast(`Loaded "${entry.name}"`);
              }
            }}
            aria-label={`Load ${entry.name} into the list`}
            style={{
              marginTop: 12, width: '100%', background: NAV_ACTIVE, color: '#fff',
              border: 'none', borderRadius: 10, padding: '11px 0',
              fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: SANS,
            }}
          >
            Load This List
          </button>
          {/* R0079 — Delete saved list (secondary/destructive, separated from Load) */}
          <button
            onClick={() => setLockerDeleteTarget(entry)}
            aria-label={`Delete saved list ${entry.name}`}
            style={{
              marginTop: 8, width: '100%', background: 'transparent', color: '#dc2626',
              border: '1px solid #dc2626', borderRadius: 10, padding: '10px 0',
              fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: SANS,
              minHeight: 44,
            }}
          >
            Delete List
          </button>
        </div>
      ),
    };
  });

  // SUMMARY deck (R003 C2) — deeper summary views built from EXISTING components
  // only (WeightSummary + WeightDistribution). No new analytics engine.
  const summaryCards: DeckCardDef[] = [
    {
      id: 'pack-summary',
      title: 'Pack Summary',
      subtitle: 'Base, expendables, and total weight',
      icon: <Scale size={18} strokeWidth={1.8}/>,
      render: () => (
        // R005 Part 7 — ONE flat panel: inner card chrome + duplicate collapsible
        // header stripped (.tw-flat/.tw-flat-ps); body always open; the panel
        // grows to content height and the deck view scrolls as a whole.
        <div className="tw-flat tw-flat-ps" style={{ padding: '4px 12px 14px' }}>
          <BarStyleProvider value={{ barColor: '', barFont: '', barTextColor: '', barTransparency: 1 }}>
            <WeightSummary
              data={sandbox.items}
              categoryOrder={sandbox.order}
              categoryMeta={sandbox.meta}
              forceOpen={true}
              forceOpenSeq={1}
            />
          </BarStyleProvider>
        </div>
      ),
    },
    {
      id: 'weight-distribution',
      title: 'Weight Distribution',
      subtitle: 'Category share of pack weight',
      icon: <BarChart2 size={18} strokeWidth={1.8}/>,
      render: () => (
        // R0076: replaced WeightDistribution (trail/ocean/… theme picker) with
        // MobileWeightDistribution — uses category wedge colours directly;
        // no palette dropdown.
        <MobileWeightDistribution
          data={sandbox.items}
          categoryOrder={sandbox.order}
          categoryMeta={sandbox.meta}
        />
      ),
    },
  ];

  // ADD deck — existing creation workflows only; Create New List is honestly disabled.
  const addCards: DeckCardDef[] = [
    {
      id: 'add-item',
      title: 'Add Item',
      subtitle: 'Add a new item to a category',
      icon: <Plus size={18} strokeWidth={2}/>,
      render: () => (
        <div style={{ padding: '4px 0 8px' }}>
          <div style={{ padding: '8px 16px 4px', fontSize: 12.5, color: SECONDARY, fontFamily: SANS }}>
            Choose a category for the new item:
          </div>
          {sandbox.order.map(cat => (
            <button
              key={cat}
              onClick={() => {
                addItem(cat);
                setAllExpanded(false);
                setOpenCatName(cat);
                closeDeck();
                showToast(`Item added to "${cat}"`);
              }}
              aria-label={`Add item to ${cat}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                background: 'none', border: 'none', padding: '11px 16px',
                cursor: 'pointer', textAlign: 'left', borderTop: `1px solid ${DIVIDER}`,
                fontSize: 14.5, color: PRIMARY, fontFamily: SANS,
              }}
            >
              <Plus size={14} color={NAV_ACTIVE} strokeWidth={2}/> {cat}
            </button>
          ))}
          {sandbox.order.length === 0 && (
            <div style={{ padding: '8px 16px', fontSize: 13, color: MUTED, fontFamily: SANS }}>
              No categories yet — add a category first.
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'add-category',
      title: 'Add Category',
      subtitle: 'Create a new gear category',
      icon: <Layers size={18} strokeWidth={1.8}/>,
      render: () => (
        <div style={{ padding: '12px 16px 16px', display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={newCatName}
            placeholder="Category name…"
            aria-label="New category name"
            onChange={e => setNewCatName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newCatName.trim()) {
                const ok = addCategory(newCatName);
                if (ok) { showToast(`Category "${newCatName.trim()}" added`); setNewCatName(''); closeDeck(); }
                else showToast('That category name already exists.');
              }
            }}
            style={{
              flex: 1, fontSize: 14, color: PRIMARY, fontFamily: SANS,
              border: `1px solid ${CARD_BORDER}`, borderRadius: 8, padding: '8px 10px',
              background: PAGE_BG, minWidth: 0,
            }}
          />
          <button
            disabled={!newCatName.trim()}
            onClick={() => {
              const ok = addCategory(newCatName);
              if (ok) { showToast(`Category "${newCatName.trim()}" added`); setNewCatName(''); closeDeck(); }
              else showToast('That category name already exists.');
            }}
            aria-label="Confirm add category"
            style={{
              background: newCatName.trim() ? NAV_ACTIVE : MUTED, color: '#fff', border: 'none',
              borderRadius: 8, padding: '8px 14px', cursor: newCatName.trim() ? 'pointer' : 'not-allowed',
              fontSize: 13.5, fontWeight: 600, fontFamily: SANS, flexShrink: 0, minHeight: 44,
            }}
          >
            Add
          </button>
        </div>
      ),
    },
    {
      id: 'scan-import',
      title: 'Scan / Import',
      subtitle: 'Import gear from a PDF or Word document',
      icon: <Scale size={18} strokeWidth={1.8}/>,
      render: () => (
        <div style={{ padding: '12px 16px 16px', fontFamily: SANS }}>
          <p style={{ fontSize: 12.5, color: SECONDARY, lineHeight: 1.55, margin: '0 0 12px' }}>
            Upload a gear list document and TrailWeigh will extract items you can add to your categories.
          </p>
          <button
            onClick={runAndClose(() => setShowScanner(true))}
            aria-label="Open Scan Gear List"
            style={{
              width: '100%', background: NAV_ACTIVE, color: '#fff', border: 'none',
              borderRadius: 10, padding: '11px 0', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: SANS,
            }}
          >
            Open Scan Gear List
          </button>
        </div>
      ),
    },
    {
      id: 'create-list',
      title: 'Create New List',
      subtitle: 'Guided setup — coming soon',
      icon: <FileText size={18} strokeWidth={1.8}/>,
      disabled: true,
    },
  ];

  // SEARCH deck — no search exists in V3 yet (global search is a future function),
  // so every family is presented honestly as unavailable. Nothing is faked.
  const searchCards: DeckCardDef[] = [
    { id: 'search-list',    title: 'Search Current List', subtitle: 'Not available yet', icon: <Search size={18} strokeWidth={1.8}/>,  disabled: true },
    { id: 'search-locker',  title: 'Search Locker',       subtitle: 'Not available yet', icon: <Folder size={18} strokeWidth={1.8}/>,  disabled: true },
    { id: 'search-catalog', title: 'Search Catalog',      subtitle: 'Future feature',    icon: <Grid3X3 size={18} strokeWidth={1.8}/>, disabled: true },
  ];

  // MORE deck — task-family cards routing to existing handlers and pages.
  const moreCards: DeckCardDef[] = [
    {
      id: 'list-actions',
      title: 'List Actions',
      subtitle: 'Save and trail checklist',
      icon: <Save size={18} strokeWidth={1.8}/>,
      render: () => (
        <div style={{ padding: '4px 0 8px' }}>
          {deckAction(<Save size={17} strokeWidth={1.8}/>,  'Save',      runAndClose(handleSave), false, 'Save or Save As')}
          {deckAction(<Tent size={17} strokeWidth={1.8}/>,  'Checklist', runAndClose(() => setShowChecklist(true)), false, 'Trail checklist for selected items')}
          {/* R0072 §10 No Duplicate Control: Undo/Redo/Reset moved to Group 2 bottom box.
              R0072 §10 No Duplicate Control: View/Print moved to Preview bottom box (Group 3).
              R0072 §10 No Duplicate Control: Share/Print moved to Share/Preview bottom boxes.
              These duplicate deck controls have been removed per R0072 §1. */}
        </div>
      ),
    },
    {
      id: 'list-settings',
      title: 'List Settings',
      subtitle: `Units: ${system === 'imperial' ? 'Imperial (lb / oz)' : 'Metric (kg / g)'}`,
      icon: <Scale size={18} strokeWidth={1.8}/>,
      render: () => (
        <div style={{ padding: '12px 16px 16px', fontFamily: SANS }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', color: MUTED, textTransform: 'uppercase', marginBottom: 8 }}>
            Units
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['imperial', 'metric'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSystem(s)}
                aria-pressed={system === s}
                aria-label={`Use ${s} units`}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 8,
                  border: `1px solid ${system === s ? NAV_ACTIVE : CARD_BORDER}`,
                  background: system === s ? 'rgba(42,87,64,0.10)' : '#fff',
                  color: system === s ? NAV_ACTIVE : SECONDARY,
                  fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
                  textTransform: 'capitalize', fontFamily: SANS,
                }}
              >
                {s === 'imperial' ? 'Imperial (lb/oz)' : 'Metric (kg/g)'}
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'help-trailweigh',
      title: 'Help & TrailWeigh',
      subtitle: 'Guides, about, sources, contact',
      icon: <HelpCircle size={18} strokeWidth={1.8}/>,
      render: () => (
        <div style={{ padding: '4px 0 8px' }}>
          {deckLink('Help & How-To', 'help')}
          {deckLink('About TrailWeigh', 'about')}
          {deckLink('How It Works', 'how-it-works')}
          {deckLink('Sources & References', 'sources')}
          {deckLink('Report a Problem', 'report-problem')}
          {deckLink('Contact Us', 'contact')}
        </div>
      ),
    },
    {
      id: 'account-privacy',
      title: 'Account & Privacy',
      subtitle: 'Policies and account data',
      icon: <Shield size={18} strokeWidth={1.8}/>,
      render: () => (
        <div style={{ padding: '4px 0 8px' }}>
          {deckLink('Privacy Policy', 'privacy')}
          {deckLink('Terms of Use', 'terms')}
          {!!userId && deckLink('Delete Account / Data', 'delete-account')}
          {deckLink('Affiliate Disclosure', 'affiliate')}
          {deckLink('Accessibility', 'accessibility')}
        </div>
      ),
    },
  ];

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
      <div className="tw-v3-root" style={{
        width: '100%', maxWidth: 430, height: '100dvh',
        background: PAGE_BG, display: 'flex', flexDirection: 'column',
        fontFamily: SANS, position: 'relative', overflow: 'hidden',
      }}>

        {/* B6: hide webkit scrollbar chrome on marked scrollers (scrolling unaffected)
            R005 Part 4: static V3 UI text is non-selectable (no iOS selection
            handles/callout during taps, swipes, reorder, slide-to-delete);
            editable controls explicitly re-enable selection.
            R005 Part 6/7: .tw-flat unwraps the shared WeightSummary /
            WeightDistribution accordion cards into ONE flat deck panel each —
            inner card chrome removed, inner duplicate header hidden (deck bar
            provides the single visible title), body always shown (forceOpen). */}
        <style>{`
          .tw-noscrollbar::-webkit-scrollbar{width:0;height:0;display:none}
          .tw-v3-root{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
          .tw-v3-root input,.tw-v3-root textarea,.tw-v3-root [contenteditable],
          .tw-v3-root input *,.tw-v3-root textarea *{
            -webkit-user-select:text;user-select:text;-webkit-touch-callout:default}
          .tw-flat > div{border:none!important;border-radius:0!important;box-shadow:none!important}
          .tw-flat-ps > div > button:first-of-type{display:none!important}
          .tw-flat-wd > div > div:first-child > button:first-child{display:none!important}
          /* R006 Part 5 — the app shell is pinned to the viewport: no page/body
             rubber-band bounce, no blank area above/below the app. Only the
             intended internal regions scroll. */
          html:has(.tw-v3-root),body:has(.tw-v3-root){
            overscroll-behavior:none;height:100%;overflow:hidden}
          .tw-v3-root{overscroll-behavior:none}
          .tw-v3-root [data-testid="main-scroll"]{overscroll-behavior:contain}
          /* R006 Part 6 — Trail palette dropdown: the flattened Weight
             Distribution panel must not clip the menu (the shared card ships
             overflow-hidden), and the menu is pinned to the panel's right edge
             so it always favors the right while staying fully inside the
             viewport at every width (320–430). */
          .tw-flat-wd > div{overflow:visible!important}
          .tw-flat-wd .relative > div.absolute{
            left:auto!important;right:0!important;max-width:calc(100vw - 32px);z-index:60!important}
          /* R006 Part 3 — reduced motion: nonessential reorder glide/dim
             transitions are minimized; state changes stay instant and clear. */
          @media (prefers-reduced-motion: reduce){
            .tw-v3-root [data-cat]{transition:none!important}
          }
          /* R0077 — restore focus-visible ring on inputs/selects that suppressed outline */
          .tw-v3-root input:focus-visible,
          .tw-v3-root select:focus-visible,
          .tw-v3-root textarea:focus-visible {
            outline: 2px solid #2A5740 !important;
            outline-offset: 1px !important;
          }
        `}</style>

        {/* ── APP BAR — R0082: hamburger added ── */}
        <div style={{
          height: 52, background: HEADER_BG, borderBottom: `1px solid ${HEADER_BDR}`,
          display: 'flex', alignItems: 'center', padding: '0 8px', gap: 0,
          flexShrink: 0, zIndex: 10, overflow: 'hidden',
        }}>
          {/* R0082: Hamburger — LEFT side for right-handed (default) */}
          {handedness === 'right' && (
            <button
              data-testid="hamburger-btn"
              aria-label="Open navigation menu"
              onClick={() => { setShowDrawer(true); setOpenSwipe(null); }}
              style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 44, minHeight: 44, flexShrink: 0,
              }}
            >
              <Menu size={22} color={NAV_ACTIVE} strokeWidth={2}/>
            </button>
          )}
          {/* Logo + wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, paddingLeft: 6 }}>
            <LogoMark size={24}/>
            <span style={{ fontSize: 19, fontWeight: 600, color: PRIMARY, letterSpacing: '0.1px', fontFamily: SERIF }}>
              TrailWeigh
            </span>
          </div>
          {/* R007 §13 — six decorative identity icons: one consistent family
              (Lucide), TrailWeigh green, even spacing, no text labels, no
              navigation action, no horizontal overflow. Flex: 1 distributes
              the remaining header width evenly across all six icons. */}
          <div
            aria-hidden="true"
            style={{
              flex: 1, display: 'flex', alignItems: 'center',
              justifyContent: 'flex-end', gap: 0, minWidth: 0,
              paddingLeft: 8,
            }}
          >
            {([
              [Backpack, 'Backpack'],
              [Train,    'Train'],
              [Plane,    'Plane'],
              [Ship,     'Boat / Cruise ship'],
              [Car,      'Car'],
              [Package,  'Moving box'],
            ] as [React.ComponentType<{ size: number; color: string; strokeWidth: number }>, string][]).map(
              ([Icon, title], i) => (
                <div
                  key={title}
                  title={title}
                  style={{
                    flex: '1 1 0', minWidth: 0, maxWidth: 38,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    paddingLeft: i === 0 ? 2 : 0,
                  }}
                >
                  <Icon size={18} color={NAV_ACTIVE} strokeWidth={1.55}/>
                </div>
              )
            )}
          </div>
          {/* R0082: Hamburger — RIGHT side for left-handed mode */}
          {handedness === 'left' && (
            <button
              data-testid="hamburger-btn"
              aria-label="Open navigation menu"
              onClick={() => { setShowDrawer(true); setOpenSwipe(null); }}
              style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 44, minHeight: 44, flexShrink: 0,
              }}
            >
              <Menu size={22} color={NAV_ACTIVE} strokeWidth={2}/>
            </button>
          )}
        </div>

        {/* ── SCROLLABLE CONTENT (R003 — full width, flush, hidden scrollbar chrome) ── */}
        <div
          className="tw-noscrollbar"
          data-testid="main-scroll"
          ref={mainScrollRef}
          onScroll={() => {
            if (openSwipe) setOpenSwipe(null);
            recalcCatOverflow();
          }}
          onPointerDownCapture={e => {
            // R004 — tapping anywhere OUTSIDE the open row closes its reveal
            if (!openSwipe) return;
            const el = (e.target as HTMLElement).closest?.('[data-swipe-key]') as HTMLElement | null;
            if (!el || el.dataset.swipeKey !== openSwipe) setOpenSwipe(null);
          }}
          style={{
            flex: 1,
            // R0076 repair: freeze the parent scroller while a long category is open so
            // the category header and Add Item bar cannot travel with the parent scroll.
            // The item-row container still scrolls independently via its own overflowY.
            overflowY: (isCatLong && !!openCatName && !allExpanded) ? 'hidden' : 'auto',
            overflowX: 'hidden', position: 'relative', scrollbarWidth: 'none',
          }}
        >

          {/* ── STICKY HEADER: INTEGRATED FILE IDENTITY + PACK SUMMARY BAR (B4) ── */}
          {/* R0080P2: outer wrapper is transparent so backdrop-filter blurs categories below;
               inner panel uses rgba(SUMMARY_BG, 0.94) — ~94% opacity gives a very subtle
               matte frost: categories barely visible underneath, no shine/gradient/gloss. */}
          <div ref={summaryRef} data-testid="list-summary-bar" style={{
            position: 'sticky', top: 0, zIndex: 4,
            backdropFilter: 'blur(9px) saturate(1.05)',
            WebkitBackdropFilter: 'blur(9px) saturate(1.05)',
          }}>

            {/* ── PACK SUMMARY STRUCTURAL BAR — square-edged, flush, no outer margin ── */}
            <div>
              <div style={{
                margin: 0, borderRadius: 0, background: 'rgba(42, 87, 64, 0.94)',
                padding: '10px 14px 12px', display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* Icon tile — unchanged */}
                <div style={{
                  width: 66, height: 66, borderRadius: 14, background: 'rgba(0,0,0,0.20)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Luggage size={34} color="rgba(255,255,255,0.90)" strokeWidth={1.4}/>
                </div>
                {/* Left: active file/list name (R004 Part 5 — occupies the former
                    LIST SUMMARY label position; size 15.5 / SUMMARY_TEXT preserved) + total count */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    data-testid="active-list-name"
                    style={{
                      fontSize: 15.5, fontWeight: 700, color: SUMMARY_TEXT, fontFamily: SANS,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      marginBottom: 3,
                    }}
                  >
                    {listName || 'Untitled List'}
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
                {/* R0075: global expand/collapse chevron — centered between item-count and Selected blocks */}
                {(() => {
                  const anyOpen = allExpanded || openCatName !== null;
                  return (
                    <button
                      data-testid="summary-expand-collapse"
                      onClick={() => anyOpen ? handleCollapseAll() : handleExpandAll()}
                      aria-label={anyOpen ? 'Collapse all categories' : 'Expand all categories'}
                      style={{
                        alignSelf: 'flex-end',
                        marginBottom: 2,
                        // R0076: move chevron ~48 px LEFT of its R0075 position.
                        // flex:1 on the left block absorbs the margin, shifting
                        // the chevron toward the item-count block.
                        marginRight: 48,
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'rgba(255,255,255,0.50)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        minWidth: 44, minHeight: 44,
                        padding: '0 4px',
                        flexShrink: 0,
                      }}
                    >
                      {anyOpen
                        ? <ChevronUp   size={36} strokeWidth={1.5}/>
                        : <ChevronDown size={36} strokeWidth={1.5}/>}
                    </button>
                  );
                })()}

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
                  {/* R004 Part 5 — "Not Selected" metric removed */}
                </div>
                </div>
              </div>
            </div>

          </div>{/* end sticky header */}

          {/* ── CATEGORY STACK (B5 — flush, touching, square-edged) ── */}
          <div
            ref={catListRef}
            style={{ padding: 0, display: 'flex', flexDirection: 'column', gap: 0 }}
          >
            {visibleOrder.map((catName, catIdx) => {
              const items   = sandbox.items[catName] ?? [];
              const isOpen  = isCatOpen(catName);
              const theme   = getCategoryTheme(catName, catIdx);
              // R004 Part 2 — floating style keyed by NAME, never by array index,
              // so the correct category stays lifted after crossing positions.
              const isDragging = dragCatName === catName;
              const isDimTarget = dragTargetName === catName && !isDragging;

              const selectedInCat = items.filter(i => i.checked).length;
              const catTotalOz = items
                .filter(i => i.checked)
                .reduce((s, i) => s + calcTotalOz(i.weightOz, i.qty), 0);

              return (
                <div
                  key={catName}
                  data-cat={catName}
                  data-floating={isDragging ? 'true' : 'false'}
                  data-dimtarget={isDimTarget ? 'true' : 'false'}
                  style={{
                    borderRadius: 0, overflow: 'hidden',
                    background: CARD_BG,
                    borderBottom: `1px solid ${DIVIDER}`,
                    // Raised/floating drag state: restrained elevation, no dramatic scale,
                    // dragged card stays fully opaque; only the valid TARGET dims slightly.
                    boxShadow: isDragging
                      ? '0 8px 26px rgba(0,0,0,0.24), 0 2px 6px rgba(0,0,0,0.14)'
                      : 'none',
                    opacity: isDimTarget ? 0.55 : 1,
                    // R006 Part 3 — non-dragged bars GLIDE into their temporary
                    // positions (translateY ± dragged height) while the DOM order
                    // stays fixed; the dragged card tracks the finger 1:1.
                    transform: isDragging
                      ? `translateY(${dragLift}px) scale(1.015)`
                      : (shiftFor(catIdx) !== 0 ? `translateY(${shiftFor(catIdx)}px)` : 'none'),
                    zIndex: isDragging ? 5 : 'auto',
                    position: 'relative',
                    transition: isDragging
                      ? 'box-shadow 0.1s'
                      : `box-shadow 0.15s, opacity ${motionDuration()} ease-out, transform ${motionDuration()} ease-out`,
                  }}>

                  {/* ── CATEGORY HEADER (R004 — right-edge-to-left slide reveals Delete) ── */}
                  <SwipeDeleteRow
                    swipeKey={`cat:${catName}`}
                    reorderActive={dragCatName !== null}
                    open={openSwipe === `cat:${catName}`}
                    onOpenChange={o => setOpenSwipe(o ? `cat:${catName}` : null)}
                    deleteLabel={`Delete ${catName} category`}
                    onDelete={() => {
                      // Reveal is NOT deletion: route into the existing confirmation flow
                      setCatOptionsFor(catName); setCatRenaming(false); setCatDeleteConfirm(true); setCatRenameValue(catName);
                    }}
                  >
                  <div
                    // R006 Part 2/4 — the whole category bar is the long-press
                    // reorder surface (400 ms stationary hold). Quick tap keeps
                    // accordion/options behavior; meaningful movement before the
                    // threshold hands the gesture to scroll or slide-to-delete.
                    data-testid={openCatName === catName && !allExpanded ? 'cat-header-open' : undefined}
                    onPointerDown={e => handleCatBarPointerDown(e, catName)}
                    onClickCapture={e => {
                      // The click that trails a long-press reorder is part of the
                      // gesture — it must not toggle the accordion or open options.
                      if (reorderJustHappenedRef.current) {
                        reorderJustHappenedRef.current = false;
                        e.stopPropagation(); e.preventDefault();
                      }
                    }}
                    style={{ display: 'flex', alignItems: 'stretch', minHeight: CARD_H, background: CARD_BG }}
                  >

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

                    {/* CONTENT grid — R006 Part 1: the six-dot handle and its
                        reserved columns are REMOVED; the category text reclaims
                        the full width: [text 1fr] [weight auto].
                        Reorder now starts with a long press anywhere on the bar. */}
                    <div style={{
                      flex: 1, minWidth: 0,
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 1fr) minmax(44px, auto)',
                      alignItems: 'center',
                      padding: '10px 12px',
                      columnGap: 10,
                    }}>
                      {/* Col 1 — name + subtitle both inside the button so the
                          tap target spans both lines. R0077: minHeight:44 is safe
                          here because 44 + 20px grid-padding = 64 < CARD_H (68). */}
                      <div style={{ minWidth: 0 }}>
                        <button
                          onClick={e => { e.stopPropagation(); setCatOptionsFor(catName); setCatRenaming(false); setCatDeleteConfirm(false); setCatRenameValue(catName); }}
                          aria-label={`Category options for ${catName}`}
                          title="Tap for category options (rename/delete)"
                          style={{
                            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                            textAlign: 'left', width: '100%', maxWidth: '100%',
                            minHeight: 44, display: 'flex', flexDirection: 'column', justifyContent: 'center',
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
                          <div style={{ fontSize: 12.5, color: MUTED }}>
                            {items.length} {items.length === 1 ? 'item' : 'items'} · {selectedInCat} selected
                          </div>
                        </button>
                      </div>

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
                  </SwipeDeleteRow>

                  {/* ── ITEM ROWS (when open) ── */}
                  {isOpen && items.length === 0 && (
                    <div style={{ borderTop: `1px solid ${DIVIDER}`, padding: '12px 14px', fontSize: 13.5, color: MUTED, fontStyle: 'italic' }}>
                      No items
                    </div>
                  )}

                  {/* R0076: item container — bounded scroll when category is "long".
                      Add Item bar is rendered OUTSIDE so it never scrolls away. */}
                  {isOpen && items.length > 0 && (
                    <div
                      ref={(el: HTMLDivElement | null) => {
                        if (openCatName === catName && !allExpanded) openCatItemsRef.current = el;
                      }}
                      data-testid={openCatName === catName && !allExpanded ? 'open-cat-items' : undefined}
                      onScroll={(isCatLong && openCatName === catName && !allExpanded) ? recalcCatOverflow : undefined}
                      style={{
                        borderTop: `1px solid ${DIVIDER}`,
                        ...((isCatLong && openCatName === catName && !allExpanded) ? {
                          maxHeight: availItemH,
                          overflowY: 'auto' as const,
                          overflowX: 'hidden' as const,
                          scrollbarWidth: 'none' as const,
                          // R0076P3: prevent scroll chaining from the bounded item
                          // viewport to the outer main-scroll.  Without this, when
                          // the inner viewport reaches its top/bottom boundary the
                          // browser would chain the gesture to main-scroll, which
                          // must remain locked ('hidden') during long-category mode.
                          overscrollBehavior: 'contain' as const,
                        } : {}),
                      }}
                    >
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

                            {/* ITEM ROW (R004 — right-edge-to-left slide reveals Delete) */}
                            <SwipeDeleteRow
                              swipeKey={`item:${catName}:${item.id}`}
                              reorderActive={dragCatName !== null}
                              open={openSwipe === `item:${catName}:${item.id}`}
                              onOpenChange={o => setOpenSwipe(o ? `item:${catName}:${item.id}` : null)}
                              deleteLabel={`Delete ${displayName}`}
                              onDelete={() => setDeleteItemConfirm({ cat: catName, id: item.id, name: displayName })}
                            >
                            {/* Item row — R0077: two independent keyboard controls, no interactive-inside-interactive.
                                1. Checkbox button (44px wide hit area, 20×20 visual) — toggles checklist selection.
                                2. Expand button (flex:1)  — opens/closes item detail panel. */}
                            <div
                              style={{
                                display: 'flex', alignItems: 'stretch',
                                minHeight: 44,
                                borderBottom: (isLast && !isExpanded) ? 'none' : `1px solid ${DIVIDER}`,
                                background: CARD_BG,
                              }}
                            >
                              {/* Checkbox — 44px wide tap target; 20×20 visual artwork unchanged */}
                              <button
                                role="checkbox"
                                aria-checked={item.checked}
                                aria-label={`${displayName}: ${item.checked ? 'selected' : 'not selected'} for checklist`}
                                tabIndex={0}
                                onClick={e => { e.stopPropagation(); updateItem(catName, item.id, { checked: !item.checked }); }}
                                onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); updateItem(catName, item.id, { checked: !item.checked }); } }}
                                style={{
                                  width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                }}
                              >
                                <div
                                  style={{
                                    width: 20, height: 20, borderRadius: 5,
                                    border: `1.5px solid ${item.checked ? CB_CHECKED : CB_UNCHECKED}`,
                                    background: item.checked ? CB_CHECKED : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    flexShrink: 0, pointerEvents: 'none',
                                  }}
                                >
                                  {item.checked && <Check size={11} color="#fff" strokeWidth={2.5}/>}
                                </div>
                              </button>

                              {/* Expand/collapse — remaining row width; toggles detail panel */}
                              <div
                                role="button"
                                tabIndex={0}
                                aria-expanded={isExpanded}
                                aria-label={`${displayName} — ${isExpanded ? 'collapse' : 'expand'} details`}
                                onClick={() => handleItemToggle(catName, item.id)}
                                onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleItemToggle(catName, item.id); } }}
                                style={{
                                  flex: 1, display: 'flex', alignItems: 'center',
                                  gap: 10, paddingRight: 14, cursor: 'pointer', minHeight: 44,
                                }}
                              >
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
                              </div>
                            </div>
                            </SwipeDeleteRow>

                            {/* EXPANDED DETAIL PANEL */}
                            {isExpanded && (
                              <div style={{
                                background: DETAIL_BG,
                                borderBottom: isLast ? 'none' : `1px solid ${DIVIDER}`,
                              }}>

                                {/* Weight — D2 FIX: local edit state prevents intermediate-value snapping */}
                                {/* R0077P2: row minHeight:44 (was height:42); input minHeight:44 for >=44px touch target */}
                                <div style={{
                                  display: 'flex', alignItems: 'center',
                                  padding: '0 14px', minHeight: 44, gap: 10,
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
                                    data-testid="expanded-weight-input"
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
                                      fontFamily: SANS, minHeight: 44,
                                    }}
                                  />
                                  <span style={{ fontSize: 13, color: MUTED, minWidth: 22, textAlign: 'left' }}>{su}</span>
                                </div>

                                {/* Quantity */}
                                {/* R0077P2: row minHeight:44 (was height:42); select minHeight:44 for >=44px touch target */}
                                <div style={{
                                  display: 'flex', alignItems: 'center',
                                  padding: '0 14px', minHeight: 44, gap: 10,
                                  borderBottom: `1px solid ${DETAIL_BDR}`,
                                }}>
                                  <PackageOpen size={14} color={MUTED} strokeWidth={1.8} aria-hidden="true"/>
                                  <div style={{ flex: 1, fontSize: 13.5, color: SECONDARY }}>Quantity</div>
                                  <select
                                    value={item.qty}
                                    aria-label={`Quantity of ${displayName}`}
                                    data-testid="expanded-qty-select"
                                    onChange={e => updateItem(catName, item.id, { qty: parseInt(e.target.value, 10) })}
                                    style={{
                                      fontSize: 13.5, fontWeight: 500, color: PRIMARY,
                                      border: `1px solid ${CARD_BORDER}`, borderRadius: 6,
                                      padding: '2px 8px', background: '#fff',
                                      fontFamily: SANS, minHeight: 44,
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
                                {/* R0077P2: row minHeight:44 (was height:42); select minHeight:44 for >=44px touch target */}
                                {otherCats.length > 0 && (
                                  <div style={{
                                    display: 'flex', alignItems: 'center',
                                    padding: '0 14px', minHeight: 44, gap: 10,
                                    borderBottom: `1px solid ${DETAIL_BDR}`,
                                  }}>
                                    <ArrowRightLeft size={14} color={MUTED} strokeWidth={1.8} aria-hidden="true"/>
                                    <div style={{ flex: 1, fontSize: 13.5, color: SECONDARY }}>Move</div>
                                    <select
                                      value=""
                                      aria-label={`Move ${displayName} to another category`}
                                      data-testid="expanded-move-select"
                                      onChange={e => { if (e.target.value) moveItem(catName, e.target.value, item.id); }}
                                      style={{
                                        fontSize: 13.5, fontWeight: 500, color: PRIMARY,
                                        border: `1px solid ${CARD_BORDER}`, borderRadius: 6,
                                        padding: '2px 8px', background: '#fff',
                                        maxWidth: 140, fontFamily: SANS, minHeight: 44,
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

                                {/* R004 — accessible NON-SWIPE delete path (replaces resting trash icon) */}
                                {/* R0076P2: testid set only when expanded inside bounded long mode
                                    so the auto-reveal effect can locate the exact Delete row.
                                    R0077P2: button itself gets data-testid="expanded-item-delete-btn"
                                    (unique, unambiguous) + minHeight:44 + alignSelf:stretch so it
                                    fills the row's full 44px height as a real touch target. */}
                                <div
                                  data-testid={isExpanded && isCatLong && openCatName === catName ? 'item-delete-row' : undefined}
                                  style={{
                                  display: 'flex', alignItems: 'stretch',
                                  padding: '0 14px', minHeight: 44, gap: 10,
                                  borderTop: `1px solid ${DETAIL_BDR}`,
                                }}>
                                  <Trash2 size={14} color="#B03A2E" strokeWidth={1.8} aria-hidden="true" style={{ alignSelf: 'center' }}/>
                                  <button
                                    data-testid="expanded-item-delete-btn"
                                    onClick={e => {
                                      e.stopPropagation();
                                      deleteTriggerRef.current = e.currentTarget;
                                      setDeleteItemConfirm({ cat: catName, id: item.id, name: displayName });
                                    }}
                                    aria-label={`Delete ${displayName}`}
                                    title={`Delete "${displayName}" from this list`}
                                    style={{
                                      background: 'none', border: 'none', cursor: 'pointer',
                                      padding: 0, fontSize: 13.5, color: '#B03A2E', fontWeight: 500,
                                      fontFamily: SANS, textAlign: 'left', flex: 1,
                                      minHeight: 44, display: 'flex', alignItems: 'center',
                                    }}
                                  >
                                    Delete Item
                                  </button>
                                </div>

                              </div>
                            )}
                          </div>
                        );
                      })}

                    </div>
                  )}

                  {/* R0076: Add Item bar — rendered OUTSIDE the item container so it
                      is always visible at the bottom of the bounded viewport for long
                      categories. Also appears for empty categories (items.length === 0). */}
                  {isOpen && (
                    <div
                      data-testid={openCatName === catName && !allExpanded ? 'cat-add-item-bar' : undefined}
                      style={{
                        display: 'flex', alignItems: 'center',
                        borderTop: `1px solid ${DIVIDER}`,
                        minHeight: 44,
                      }}
                    >
                      {/* Add Item tap target — full width minus optional chevron */}
                      <button
                        data-testid="cat-add-item-btn"
                        onClick={() => addItem(catName)}
                        aria-label={`Add item to ${catName}`}
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                          padding: '0 14px', minHeight: 44,
                          background: 'none', border: 'none', cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        <Plus size={14} color={NAV_ACTIVE} strokeWidth={2} aria-hidden="true"/>
                        <span style={{ fontSize: 13.5, color: NAV_ACTIVE, fontWeight: 500, fontFamily: SANS }}>
                          Add Item
                        </span>
                      </button>

                      {/* R0076 repair: TWO separate ▲/▼ paging controls.
                          Both always present in long mode; disabled (and aria-disabled)
                          at the top (▲) or bottom (▼) of the item viewport.          */}
                      {isCatLong && openCatName === catName && !allExpanded && (
                        <div style={{ display: 'flex', flexShrink: 0, borderLeft: `1px solid ${DIVIDER}` }}>
                          <button
                            data-testid="cat-chevron-up"
                            aria-label="Show earlier items"
                            aria-disabled={!catOverflow.above}
                            disabled={!catOverflow.above}
                            onClick={() => scrollCatItems('up')}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              width: 44, minHeight: 44, flexShrink: 0,
                              background: 'none', border: 'none',
                              cursor: catOverflow.above ? 'pointer' : 'default',
                              color: catOverflow.above ? SECONDARY : MUTED,
                              opacity: catOverflow.above ? 1 : 0.35,
                              borderRight: `1px solid ${DIVIDER}`,
                            }}
                          >
                            <ChevronUp size={18} strokeWidth={1.8}/>
                          </button>
                          <button
                            data-testid="cat-chevron-down"
                            aria-label="Show later items"
                            aria-disabled={!catOverflow.below}
                            disabled={!catOverflow.below}
                            onClick={() => scrollCatItems('down')}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              width: 44, minHeight: 44, flexShrink: 0,
                              background: 'none', border: 'none',
                              cursor: catOverflow.below ? 'pointer' : 'default',
                              color: catOverflow.below ? SECONDARY : MUTED,
                              opacity: catOverflow.below ? 1 : 0.35,
                            }}
                          >
                            <ChevronDown size={18} strokeWidth={1.8}/>
                          </button>
                        </div>
                      )}
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

            {/* R004 Part 4 — inline dashed "+ Add Category" control removed.
                Add Category remains available via the bottom ADD deck only. */}

            {/* R005 Part 3 — decorative 24px bottom spacer removed: content runs
                to the bottom nav (nav is in normal flow, so it never covers the
                last row; no reserved blank band needed). */}
          </div>

        </div>{/* end scrollable */}

        {/* ── BOTTOM BOX-GROUP BAR (R007 — 4 sliding groups) ── */}
        <BoxGroupBar
          ref={navRef}
          activeDeck={activeDeck}
          undoDisabled={undoHistory.length === 0}
          redoDisabled={redoHistory.length === 0}
          onLocker={()  => openDeck('locker')}
          onSummary={()  => openDeck('summary')}
          onAdd={()     => openDeck('add')}
          onSearch={()  => openDeck('search')}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onReset={handleReset}
          onCamera={handleCamera}
          onPhotos={handlePhotos}
          onPreview={() => setShowPreview(true)}
          onSave={handleSave}
          onShare={navigateToShare}
          onMore={()  => openDeck('more')}
        />

        {/* ── CARD DECKS (conditionally rendered; closed decks do not exist
              in the DOM and therefore cannot intercept pointer events).
              A4: all decks share the single measured bottomOffset. ── */}
        {activeDeck === 'locker' && (
          <CardDeck
            deckLabel="Locker"
            cards={lockerCards}
            activeCardId={activeCardId}
            onActivateCard={activateCard}
            onClose={closeDeck}
            emptyNote="No saved lists yet. Use More → List Actions → Save to add one."
            bottomOffset={navHeight}
          />
        )}
        {activeDeck === 'summary' && (
          <CardDeck
            deckLabel="Summary"
            cards={summaryCards}
            activeCardId={activeCardId}
            onActivateCard={activateCard}
            onClose={closeDeck}
            bottomOffset={navHeight}
          />
        )}
        {activeDeck === 'add' && (
          <CardDeck
            deckLabel="Add"
            cards={addCards}
            activeCardId={activeCardId}
            onActivateCard={activateCard}
            onClose={closeDeck}
            bottomOffset={navHeight}
          />
        )}
        {activeDeck === 'search' && (
          <CardDeck
            deckLabel="Search"
            cards={searchCards}
            activeCardId={activeCardId}
            onActivateCard={activateCard}
            onClose={closeDeck}
            bottomOffset={navHeight}
          />
        )}
        {activeDeck === 'more' && (
          <CardDeck
            deckLabel="More"
            cards={moreCards}
            activeCardId={activeCardId}
            onActivateCard={activateCard}
            onClose={closeDeck}
            bottomOffset={navHeight}
          />
        )}

        {/* ── OVERLAYS (rendered as absolute children of the phone frame) ── */}

        {/* R0082: Navigation drawer — always rendered, open/close via CSS transform */}
        <NavDrawer
          open={showDrawer}
          handedness={handedness}
          onClose={() => setShowDrawer(false)}
          onHome={handleDrawerHome}
          onMyLists={handleDrawerMyLists}
          onHelp={handleDrawerHelp}
          onSettings={handleDrawerSettings}
          onToggleHandedness={handleToggleHandedness}
        />

        {/* Summary overlay — reached via More → List Actions → Summary */}
        {showSummary && (
          <SummaryOverlay
            sandbox={sandbox}
            onClose={() => setShowSummary(false)}
          />
        )}

        {/* Checklist overlay — trail progress tracking (separate from Preview) */}
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

        {/* Preview overlay — R0072 §10: PDF-style checklist preview of selected items.
            Opening does NOT auto-print. Print button inside is the deliberate trigger. */}
        {showPreview && (
          <PreviewOverlay
            sandbox={sandbox}
            system={system}
            onPrint={handlePrint}
            onClose={() => setShowPreview(false)}
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
                style={{ background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: NAV_ACTIVE, fontSize: 15, fontWeight: 600, fontFamily: SANS, minHeight: 44 }}
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
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: NAV_ACTIVE, fontSize: 16, fontFamily: SANS, fontWeight: 500, padding: '4px 0', minHeight: 44 }}
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

        {/* (R002: sliders retired — creation lives in the Add deck above) */}

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
              {/* R005 Part 5 — Add Item (above Rename): adds directly into THIS
                  category via the existing addItem workflow; no re-picking. */}
              <button
                onClick={() => {
                  const cat = catOptionsFor;
                  addItem(cat);
                  setAllExpanded(false);
                  setOpenCatName(cat);
                  setCatOptionsFor(null);
                  showToast(`Item added to "${cat}"`);
                }}
                aria-label={`Add item to ${catOptionsFor}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: 12,
                  padding: '14px 16px', cursor: 'pointer', textAlign: 'left', width: '100%',
                  boxShadow: CARD_SHADOW,
                }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: NAV_ACTIVE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Plus size={17} color="#fff" strokeWidth={2}/>
                </div>
                <div style={{ fontSize: 15.5, fontWeight: 600, color: PRIMARY }}>Add Item</div>
              </button>
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
                  background: PAGE_BG, boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  onClick={() => setCatRenaming(false)}
                  aria-label="Cancel rename"
                  style={{ flex: 1, padding: '11px 0', borderRadius: 10, background: CARD_BG, border: `1px solid ${CARD_BORDER}`, fontSize: 14.5, fontWeight: 600, color: SECONDARY, cursor: 'pointer', minHeight: 44 }}
                >Cancel</button>
                <button
                  disabled={!catRenameValue.trim() || catRenameValue.trim() === catOptionsFor}
                  aria-label="Confirm rename"
                  onClick={() => {
                    sandboxRenameCategory(catOptionsFor, catRenameValue);
                    setCatOptionsFor(null); setCatRenaming(false);
                  }}
                  style={{
                    flex: 1, padding: '11px 0', borderRadius: 10,
                    background: catRenameValue.trim() && catRenameValue.trim() !== catOptionsFor ? NAV_ACTIVE : MUTED,
                    border: 'none', fontSize: 14.5, fontWeight: 600, color: '#fff',
                    cursor: catRenameValue.trim() && catRenameValue.trim() !== catOptionsFor ? 'pointer' : 'not-allowed',
                    minHeight: 44,
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
                    aria-label="Cancel delete category"
                    style={{ flex: 1, padding: '11px 0', borderRadius: 10, background: CARD_BG, border: `1px solid ${CARD_BORDER}`, fontSize: 14.5, fontWeight: 600, color: SECONDARY, cursor: 'pointer', minHeight: 44 }}
                  >Cancel</button>
                  <button
                    onClick={() => { sandboxDeleteCategory(catOptionsFor); setCatOptionsFor(null); setCatDeleteConfirm(false); showToast(`Deleted "${catOptionsFor}"`); }}
                    aria-label={`Confirm delete category ${catOptionsFor}`}
                    style={{ flex: 1, padding: '11px 0', borderRadius: 10, background: '#dc2626', border: 'none', fontSize: 14.5, fontWeight: 600, color: '#fff', cursor: 'pointer', minHeight: 44 }}
                  >Delete Category</button>
                </div>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* ── D6: Item delete confirmation ── */}
      {/* R0077P2: added Escape + Tab-trap focus containment, initial focus on Cancel,
          focus-return on Cancel (to trigger) and after confirmed delete (to Add Item). */}
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
          onClick={() => { deleteConfirmedRef.current = false; setDeleteItemConfirm(null); }}
          onKeyDown={e => {
            if (e.key === 'Escape') {
              e.preventDefault();
              deleteConfirmedRef.current = false;
              setDeleteItemConfirm(null);
            }
            if (e.key === 'Tab') {
              e.preventDefault();
              // Lightweight two-button focus trap
              const els = [cancelDialogBtnRef.current, confirmDialogBtnRef.current].filter((x): x is HTMLButtonElement => x !== null);
              const idx = els.indexOf(document.activeElement as HTMLButtonElement);
              if (e.shiftKey) {
                els[(idx - 1 + els.length) % els.length]?.focus();
              } else {
                els[(idx + 1) % els.length]?.focus();
              }
            }
          }}
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
                ref={cancelDialogBtnRef}
                onClick={() => { deleteConfirmedRef.current = false; setDeleteItemConfirm(null); }}
                aria-label="Cancel delete item"
                style={{ flex: 1, padding: '12px 0', borderRadius: 10, background: CARD_BG, border: `1px solid ${CARD_BORDER}`, fontSize: 15, fontWeight: 600, color: SECONDARY, cursor: 'pointer', minHeight: 44 }}
              >Cancel</button>
              <button
                ref={confirmDialogBtnRef}
                onClick={() => {
                  deleteConfirmedRef.current = true;
                  sandboxRemoveItem(deleteItemConfirm.cat, deleteItemConfirm.id);
                  setDeleteItemConfirm(null);
                  showToast(`Deleted "${deleteItemConfirm.name}"`);
                }}
                aria-label={`Confirm delete ${deleteItemConfirm.name}`}
                style={{ flex: 1, padding: '12px 0', borderRadius: 10, background: '#dc2626', border: 'none', fontSize: 15, fontWeight: 600, color: '#fff', cursor: 'pointer', minHeight: 44 }}
              >Delete Item</button>
            </div>
          </div>
        </div>
      )}

      {/* ── R0079-D1: Save Chooser — Save / Save As / Cancel ── */}
      {showSaveChooser && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Save options"
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            background: 'rgba(0,0,0,0.45)',
          }}
          onClick={() => setShowSaveChooser(false)}
          onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); setShowSaveChooser(false); } }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 500,
              background: '#fff', borderRadius: '16px 16px 0 0',
              padding: '20px 20px 40px', fontFamily: SANS,
              boxShadow: '0 -4px 32px rgba(0,0,0,0.18)',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.8px', color: MUTED, textTransform: 'uppercase', marginBottom: 16, textAlign: 'center' }}>
              Save List
            </div>
            <button
              data-testid="save-chooser-save"
              onClick={handleSaveNow}
              aria-label={activeLockerEntryId ? 'Save — update current saved list' : 'Save — create new saved list'}
              style={{
                width: '100%', marginBottom: 10, background: NAV_ACTIVE, color: '#fff',
                border: 'none', borderRadius: 10, padding: '13px 0',
                fontSize: 15, fontWeight: 600, cursor: 'pointer', minHeight: 44,
              }}
            >
              {activeLockerEntryId ? 'Save' : 'Save'}
            </button>
            <button
              data-testid="save-chooser-save-as"
              onClick={handleSaveAsOpen}
              aria-label="Save As — create a new independent copy"
              style={{
                width: '100%', marginBottom: 14, background: CARD_BG,
                border: `1px solid ${CARD_BORDER}`, borderRadius: 10, padding: '13px 0',
                fontSize: 15, fontWeight: 600, color: PRIMARY, cursor: 'pointer', minHeight: 44,
              }}
            >
              Save As
            </button>
            <button
              ref={saveChooserCancelRef}
              data-testid="save-chooser-cancel"
              onClick={() => setShowSaveChooser(false)}
              aria-label="Cancel save"
              style={{
                width: '100%', background: 'transparent', border: 'none',
                padding: '10px 0', fontSize: 14.5, fontWeight: 500, color: SECONDARY,
                cursor: 'pointer', minHeight: 44,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── R0079-D2: Save As — name input dialog ── */}
      {showSaveAsDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Save As"
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            background: 'rgba(0,0,0,0.45)',
          }}
          onClick={() => setShowSaveAsDialog(false)}
          onKeyDown={e => {
            if (e.key === 'Escape') { e.preventDefault(); setShowSaveAsDialog(false); }
            if (e.key === 'Enter') { e.preventDefault(); handleSaveAsConfirm(); }
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 500,
              background: '#fff', borderRadius: '16px 16px 0 0',
              padding: '24px 20px 40px', fontFamily: SANS,
              boxShadow: '0 -4px 32px rgba(0,0,0,0.18)',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: PRIMARY, marginBottom: 6 }}>
              Save As
            </div>
            <div style={{ fontSize: 13.5, color: SECONDARY, marginBottom: 16, lineHeight: 1.5 }}>
              Enter a name for the new copy. It will be saved independently.
            </div>
            <input
              ref={saveAsInputRef}
              data-testid="save-as-name-input"
              type="text"
              value={saveAsName}
              onChange={e => setSaveAsName(e.target.value)}
              placeholder="List name"
              aria-label="New list name"
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '11px 14px', borderRadius: 10, border: `1.5px solid ${CARD_BORDER}`,
                fontSize: 15, fontFamily: SANS, color: PRIMARY, outline: 'none', marginBottom: 18,
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                ref={saveAsCancelRef}
                data-testid="save-as-cancel"
                onClick={() => setShowSaveAsDialog(false)}
                aria-label="Cancel Save As"
                style={{ flex: 1, padding: '12px 0', borderRadius: 10, background: CARD_BG, border: `1px solid ${CARD_BORDER}`, fontSize: 15, fontWeight: 600, color: SECONDARY, cursor: 'pointer', minHeight: 44 }}
              >Cancel</button>
              <button
                data-testid="save-as-confirm"
                onClick={handleSaveAsConfirm}
                aria-label="Save copy"
                style={{ flex: 1, padding: '12px 0', borderRadius: 10, background: NAV_ACTIVE, border: 'none', fontSize: 15, fontWeight: 600, color: '#fff', cursor: 'pointer', minHeight: 44 }}
              >Save Copy</button>
            </div>
          </div>
        </div>
      )}

      {/* ── R0079-D3: Reset Checklist confirmation ── */}
      {showResetConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Reset Checklist confirmation"
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            background: 'rgba(0,0,0,0.45)',
          }}
          onClick={() => setShowResetConfirm(false)}
          onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); setShowResetConfirm(false); } }}
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
            <div style={{ fontSize: 18, fontWeight: 700, color: PRIMARY, marginBottom: 8 }}>
              Reset Checklist?
            </div>
            <div style={{ fontSize: 14, color: SECONDARY, marginBottom: 24, lineHeight: 1.55 }}>
              Clear all checked/packed marks in this list?
              <br/>
              Your items, categories, quantities, weights, and saved list will not be deleted.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                ref={resetCancelRef}
                data-testid="reset-cancel"
                onClick={() => setShowResetConfirm(false)}
                aria-label="Cancel reset"
                style={{ flex: 1, padding: '12px 0', borderRadius: 10, background: CARD_BG, border: `1px solid ${CARD_BORDER}`, fontSize: 15, fontWeight: 600, color: SECONDARY, cursor: 'pointer', minHeight: 44 }}
              >Cancel</button>
              <button
                data-testid="reset-confirm"
                onClick={handleResetConfirm}
                aria-label="Confirm reset checked items"
                style={{ flex: 1, padding: '12px 0', borderRadius: 10, background: '#b45309', border: 'none', fontSize: 15, fontWeight: 600, color: '#fff', cursor: 'pointer', minHeight: 44 }}
              >Reset Checks</button>
            </div>
          </div>
        </div>
      )}

      {/* ── R0079-D4: Locker Delete confirmation ── */}
      {lockerDeleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Delete Saved List confirmation"
          style={{
            position: 'fixed', inset: 0, zIndex: 201,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            background: 'rgba(0,0,0,0.55)',
          }}
          onClick={() => setLockerDeleteTarget(null)}
          onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); setLockerDeleteTarget(null); } }}
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
              Delete Saved List?
            </div>
            <div style={{ fontSize: 14, color: SECONDARY, marginBottom: 24, lineHeight: 1.55 }}>
              Delete "{lockerDeleteTarget.name}"?
              <br/>
              This removes the saved list only. Items in your Master Library will not be deleted.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                ref={lockerDeleteCancelRef}
                data-testid="locker-delete-cancel"
                onClick={() => setLockerDeleteTarget(null)}
                aria-label="Cancel delete saved list"
                style={{ flex: 1, padding: '12px 0', borderRadius: 10, background: CARD_BG, border: `1px solid ${CARD_BORDER}`, fontSize: 15, fontWeight: 600, color: SECONDARY, cursor: 'pointer', minHeight: 44 }}
              >Cancel</button>
              <button
                data-testid="locker-delete-confirm"
                onClick={handleLockerDeleteConfirm}
                aria-label={`Confirm delete ${lockerDeleteTarget.name}`}
                style={{ flex: 1, padding: '12px 0', borderRadius: 10, background: '#dc2626', border: 'none', fontSize: 15, fontWeight: 600, color: '#fff', cursor: 'pointer', minHeight: 44 }}
              >Delete List</button>
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
