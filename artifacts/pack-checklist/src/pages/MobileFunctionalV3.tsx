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

// ─── BOTTOM CARD-DECK NAVIGATION CONSTANTS (R002, geometry revised R003) ─────────
const NAV_H         = 58;   // bottom tab bar fallback height (px); actual height is measured (A4)
const BAR_PEEK_H    = 54;   // visible height of an inactive stacked bar (px, category-header scale)
const DRAG_ACTIVATE = 48;   // upward drag distance that activates a bar (px)
const TAP_MAX_PX    = 8;    // pointer movement below this = tap
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

// ─── BOTTOM BAR (R003 — exactly five flush square areas:
//     Locker | Summary | Add | Search | More — no List tab, no floating Add) ─────
type DeckId = 'locker' | 'summary' | 'add' | 'search' | 'more';

interface BottomNavBarProps {
  activeDeck: DeckId | null;
  onDeck: (deck: DeckId) => void;
}

const NAV_AREAS: { deck: DeckId; Icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>; label: string; aria: string }[] = [
  { deck: 'locker',  Icon: Folder,         label: 'Locker',  aria: 'Locker — saved lists' },
  { deck: 'summary', Icon: BarChart2,      label: 'Summary', aria: 'Summary — pack weight and progress' },
  { deck: 'add',     Icon: Plus,           label: 'Add',     aria: 'Add — add items, categories, or import a list' },
  { deck: 'search',  Icon: Search,         label: 'Search',  aria: 'Search — find gear' },
  { deck: 'more',    Icon: MoreHorizontal, label: 'More',    aria: 'More — settings and tools' },
];

const BottomNavBar = React.forwardRef<HTMLDivElement, BottomNavBarProps>(
  function BottomNavBar({ activeDeck, onDeck }, ref) {
    return (
      <div
        ref={ref}
        data-testid="bottom-nav"
        style={{
          position: 'sticky', bottom: 0, left: 0, right: 0,
          background: NAV_BG, borderTop: '1px solid rgba(0,0,0,0.10)',
          display: 'flex', alignItems: 'stretch',
          paddingBottom: 'var(--tw-safe-bottom, env(safe-area-inset-bottom, 0px))',
          zIndex: 40, minHeight: NAV_H, boxSizing: 'border-box', flexShrink: 0,
        }}
      >
        {NAV_AREAS.map(({ deck, Icon, label, aria }, i) => {
          const active = activeDeck === deck;
          return (
            <button
              key={deck}
              onClick={() => onDeck(deck)}
              aria-label={aria}
              aria-current={active ? 'page' : undefined}
              style={{
                flex: 1, minWidth: 0,
                background: active ? 'rgba(42,87,64,0.10)' : 'none',
                border: 'none', borderRadius: 0,
                borderLeft: i === 0 ? 'none' : `1px solid ${DIVIDER}`,
                padding: '7px 0 8px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 2,
              }}
            >
              <Icon size={21} color={active ? NAV_ACTIVE : NAV_INACTIVE} strokeWidth={active ? 2.1 : 1.6}/>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, color: active ? NAV_ACTIVE : NAV_INACTIVE, letterSpacing: active ? '0.1px' : 0 }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    );
  }
);

// ─── CARD DECK (R002 — bottom-rising, vertically overlapping card stack) ─────────
// Tapping Locker / + / Search / More raises a deck of stacked cards from the bottom.
// Each inactive card shows its title strip; TAP always activates it, and an upward
// DRAG (≥ DRAG_ACTIVATE px) is an equivalent optional gesture. The active card
// expands at the top of the deck ("operational position") and shows its content.
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
 *  Once movement exceeds the slop, the gesture LOCKS into exactly one mode:
 *   - 'scroll' — when the deck overflows (canDeckScroll()), ANY vertical drag
 *     scrolls the deck naturally in BOTH directions (reversible, 1:1, no bounce)
 *     and can never activate the bar on release;
 *   - 'lift'   — only when the deck does NOT overflow: an upward drag lifts the
 *     bar and docks it past DRAG_ACTIVATE px; short lifts spring back.
 *  This removes the R002 conflict where upward drags in a long deck always
 *  activated a bar and scrollTop could never increase via touch. */
function DeckInactiveCard({ card, index, onActivate, scrollBy, canDeckScroll }: {
  card: DeckCardDef;
  index: number;
  onActivate: () => void;
  scrollBy: (dy: number) => void;
  canDeckScroll: () => boolean;
}) {
  const [lift, setLift] = useState(0);
  const [settling, setSettling] = useState(false);
  const [focused, setFocused] = useState(false);
  const dragRef = useRef<{ active: boolean; mode: 'idle' | 'scroll' | 'lift'; startY: number; lastY: number }>(
    { active: false, mode: 'idle', startY: 0, lastY: 0 }
  );

  const finishDrag = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const { mode, startY } = dragRef.current;
    dragRef.current.active = false;
    dragRef.current.mode = 'idle';
    const total  = Math.abs(e.clientY - startY);
    const lifted = startY - e.clientY; // positive = upward
    if (card.disabled) { setLift(0); return; }
    if (total < TAP_MAX_PX) { setLift(0); onActivate(); return; }         // tap
    if (mode === 'lift' && lifted >= DRAG_ACTIVATE) { setLift(0); onActivate(); return; } // drag-dock
    setSettling(true); setLift(0);                                        // settle back (scroll mode never activates)
  };

  /** A cancelled gesture (e.g. browser takes over the pointer) must never
   *  activate the card — it only clears the visual drag state. */
  const cancelDrag = () => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    dragRef.current.mode = 'idle';
    setSettling(true); setLift(0);
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
        setSettling(false);
      }}
      onPointerMove={e => {
        const d = dragRef.current;
        if (!d.active) return;
        const totalDy = e.clientY - d.startY;
        if (d.mode === 'idle' && Math.abs(totalDy) > DRAG_SLOP_PX) {
          // Lock the gesture mode once: overflowing deck → scroll (both directions);
          // non-overflowing deck + upward start → lift; otherwise scroll (no-op if nothing to scroll).
          d.mode = canDeckScroll() ? 'scroll'
            : (totalDy < 0 && !card.disabled ? 'lift' : 'scroll');
        }
        if (d.mode === 'scroll') {
          scrollBy(d.lastY - e.clientY);  // finger up → scrollTop increases; finger down → decreases
          setLift(0);
        } else if (d.mode === 'lift') {
          setLift(Math.max(0, Math.min(d.startY - e.clientY, 120)));
        }
        d.lastY = e.clientY;
      }}
      onPointerUp={finishDrag}
      onPointerCancel={cancelDrag}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onTransitionEnd={() => setSettling(false)}
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
        transform: `translateY(${-lift}px)`,
        transition: settling ? `transform ${motionDuration()} cubic-bezier(0.4,0,0.2,1)` : 'none',
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
              background: 'rgba(255,255,255,0.16)', border: 'none', borderRadius: 14,
              width: 28, height: 28, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={16} color="#fff" strokeWidth={2}/>
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
              <div className="tw-noscrollbar" style={{ overflowY: 'auto', maxHeight: 300, scrollbarWidth: 'none' }}>
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
  // Navigation stack (sub-pages only: footer-page, share, sources)
  const [screenStack, setScreenStack] = useState<ScreenEntry[]>([{ screen: 'list' }]);

  // ── R002 card-deck navigation state ──────────────────────────────────────────
  // activeDeck: which deck is raised (null = resting full-width list).
  // activeCardId: which card in the open deck is docked in the operational position.
  const [activeDeck, setActiveDeck] = useState<DeckId | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [lockerEntries, setLockerEntries] = useState<LockerEntry[]>([]);

  const openDeck = useCallback((deck: DeckId) => {
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

  // Clear any pending toast timer on unmount (this view can be navigated away from).
  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

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

  // (R002: the left/right/bottom slider gesture handlers were retired with the
  //  slider components — deck interaction lives in CardDeck / DeckInactiveCard.)

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
        <div style={{ padding: '10px 12px 14px' }}>
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
        <div style={{ padding: '10px 12px 14px' }}>
          <BarStyleProvider value={{ barColor: '', barFont: '', barTextColor: '', barTransparency: 1 }}>
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
              background: PAGE_BG, outline: 'none', minWidth: 0,
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
              fontSize: 13.5, fontWeight: 600, fontFamily: SANS, flexShrink: 0,
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
      subtitle: 'Save, undo, reset, expand, views',
      icon: <Save size={18} strokeWidth={1.8}/>,
      render: () => (
        <div style={{ padding: '4px 0 8px' }}>
          {deckAction(<Save size={17} strokeWidth={1.8}/>,       'Save',         runAndClose(handleSave), false, 'Save current list as a new Locker entry')}
          {deckAction(<Undo2 size={17} strokeWidth={1.8}/>,      'Undo',         runAndClose(handleUndo), undoHistory.length === 0)}
          {deckAction(<Redo2 size={17} strokeWidth={1.8}/>,      'Redo',         runAndClose(handleRedo), redoHistory.length === 0)}
          {deckAction(<RotateCcw size={17} strokeWidth={1.8}/>,  'Reset',        runAndClose(handleReset), false, 'Reload from your saved data (undoable)')}
          {deckAction(<Layers size={17} strokeWidth={1.8}/>,     'Expand All',   runAndClose(handleExpandAll))}
          {deckAction(<LayoutList size={17} strokeWidth={1.8}/>, 'Collapse All', runAndClose(handleCollapseAll))}
          {deckAction(<Tent size={17} strokeWidth={1.8}/>,       'Checklist',    runAndClose(() => setShowChecklist(true)), false, 'Trail checklist for selected items')}
          {deckAction(<BarChart2 size={17} strokeWidth={1.8}/>,  'Summary',      runAndClose(() => setShowSummary(true)), false, 'Pack weight and distribution')}
        </div>
      ),
    },
    {
      id: 'share-print',
      title: 'Share & Print',
      subtitle: 'Review links and printable lists',
      icon: <Share2 size={18} strokeWidth={1.8}/>,
      render: () => (
        <div style={{ padding: '4px 0 8px' }}>
          {deckAction(<Share2 size={17} strokeWidth={1.8}/>,  'Share', runAndClose(navigateToShare), false, 'Get a review link for this list')}
          {deckAction(<Printer size={17} strokeWidth={1.8}/>, 'Print', runAndClose(handlePrint), false, 'Print your gear list')}
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
      <div style={{
        width: '100%', maxWidth: 430, height: '100dvh',
        background: PAGE_BG, display: 'flex', flexDirection: 'column',
        fontFamily: SANS, position: 'relative', overflow: 'hidden',
      }}>

        {/* B6: hide webkit scrollbar chrome on marked scrollers (scrolling unaffected) */}
        <style>{`.tw-noscrollbar::-webkit-scrollbar{width:0;height:0;display:none}`}</style>

        {/* ── APP BAR ── */}
        <div style={{
          height: 52, background: HEADER_BG, borderBottom: `1px solid ${HEADER_BDR}`,
          display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10,
          flexShrink: 0, zIndex: 10,
        }}>
          {/* Logo + wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
            <LogoMark size={24}/>
            <span style={{ fontSize: 19, fontWeight: 600, color: PRIMARY, letterSpacing: '0.1px', fontFamily: SERIF }}>
              TrailWeigh
            </span>
          </div>

          {/* Search circle — FUTURE FUNCTION */}
          {/* + is the right-edge slider cap; FAB removed per three-slider spec */}
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
        </div>

        {/* ── SCROLLABLE CONTENT (R003 — full width, flush, hidden scrollbar chrome) ── */}
        <div
          className="tw-noscrollbar"
          data-testid="main-scroll"
          style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative', scrollbarWidth: 'none' }}
        >

          {/* ── STICKY HEADER: INTEGRATED FILE IDENTITY + PACK SUMMARY BAR (B4) ── */}
          <div style={{ position: 'sticky', top: 0, zIndex: 4, background: PAGE_BG }}>

            {/* ── PACK SUMMARY STRUCTURAL BAR — square-edged, flush, no outer margin ── */}
            <div>
              <div style={{
                margin: 0, borderRadius: 0, background: SUMMARY_BG,
                padding: '10px 14px 12px', display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                {/* File identity — the active list/file name lives INSIDE the summary bar */}
                <div style={{
                  fontSize: 15.5, fontWeight: 700, color: SUMMARY_TEXT, fontFamily: SERIF,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  borderBottom: '1px solid rgba(255,255,255,0.16)', paddingBottom: 7,
                }}
                  data-testid="active-list-name"
                >
                  {listName || 'Untitled List'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
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
              const isDragging = dragSrcIdx === catIdx;

              const selectedInCat = items.filter(i => i.checked).length;
              const catTotalOz = items
                .filter(i => i.checked)
                .reduce((s, i) => s + calcTotalOz(i.weightOz, i.qty), 0);

              return (
                <div key={catName} style={{
                  borderRadius: 0, overflow: 'hidden',
                  background: CARD_BG,
                  borderBottom: `1px solid ${DIVIDER}`,
                  boxShadow: isDragging
                    ? '0 6px 24px rgba(0,0,0,0.22), 0 0 0 2px rgba(42,87,64,0.25)'
                    : 'none',
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

        {/* ── BOTTOM BAR (R003 — Locker | Summary | Add | Search | More) ── */}
        <BottomNavBar
          ref={navRef}
          activeDeck={activeDeck}
          onDeck={openDeck}
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

        {/* Summary overlay — reached via More → List Actions → Summary */}
        {showSummary && (
          <SummaryOverlay
            sandbox={sandbox}
            onClose={() => setShowSummary(false)}
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
