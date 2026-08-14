/**
 * MobileFunctionalV3.tsx — 027H
 * Isolated functional preview at /mobile-functional-v3.
 * Real TrailWeigh category/item interactions on a SANDBOXED copy of owner data.
 * Visual master: MobileDesignPrototypeV3 (approved in 027F).
 *
 * SANDBOX ISOLATION:
 *   Reads production localStorage ONCE on mount → clones into local React state.
 *   ALL mutations (check, weight, qty, move) apply to local state only.
 *   No writes to owner production localStorage at any time.
 *
 * CATEGORY TOUCH REORDER: BLOCKED
 *   Production uses HTML5 DnD only — not touch-safe and no DnD library is installed.
 *   Six-dot category handle is visually present (centered in bar) but inert.
 *   A separate implementation prompt is required for touch-safe category reorder.
 *
 * DESIGN FREEZE:
 *   Header height, typography, wedge geometry, summary, bottom-nav — all match
 *   the approved V3 master. No geometry changes from the frozen visual spec.
 *
 * V3 visual constants (unchanged from 027F):
 *   app-bar:  52px     summary-card: radius 16px   category-card: radius 14px
 *   wedge-w:  72px     wedge-point:  17px           card-h:        68px
 *   item-row: 44px     detail-row:   42px           bottom-nav:    58px
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/react';
import {
  Menu, Search, Plus, ChevronDown,
  Check, GripVertical, MoreHorizontal,
  Backpack, Folder, Grid3X3, BarChart2,
  Hash, PackageOpen, ArrowRightLeft, Luggage,
} from 'lucide-react';
import type { GearItem, CategoryMeta } from '../hooks/usePackData';
import { getCategoryTheme } from '../lib/mobileCategoryTheme';
import {
  calcTotalOz, formatWeight, smallUnit, gramsToOz,
} from '../lib/weightUtils';
import { useUnit, UnitProvider } from '../context/UnitContext';

// ─── TYPES ─────────────────────────────────────────────────────────────────────
type PackState = { [category: string]: GearItem[] };
type SandboxStore = { items: PackState; order: string[]; meta: Record<string, CategoryMeta> };

// ─── DEMO SEED (used when owner localStorage is empty / unauthenticated) ────────
// Realistic GearItem data matching production data shape for functional testing.
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
      { id: 'b1', sub: 'Backpack', desc: 'Osprey Atmos 65',      weightOz: 68.0,  qty: 1, checked: true,  expendable: false },
      { id: 'b2', sub: 'Backpack', desc: 'Pack Rain Cover',       weightOz: 4.5,   qty: 1, checked: true,  expendable: false },
      { id: 'b3', sub: 'Backpack', desc: 'Dry Bags',              weightOz: 3.2,   qty: 2, checked: false, expendable: false },
    ],
    Clothing: [
      { id: 'c1', sub: 'Clothing', desc: 'Merino Wool Base Layer', weightOz: 6.8,  qty: 1, checked: true,  expendable: false },
      { id: 'c2', sub: 'Clothing', desc: 'Hiking Pants',           weightOz: 12.0, qty: 2, checked: true,  expendable: false },
      { id: 'c3', sub: 'Clothing', desc: 'Rain Jacket',            weightOz: 11.5, qty: 1, checked: true,  expendable: false },
      { id: 'c4', sub: 'Clothing', desc: 'Fleece Mid-Layer',       weightOz: 14.0, qty: 1, checked: false, expendable: false },
      { id: 'c5', sub: 'Clothing', desc: 'Hiking Socks',           weightOz: 2.8,  qty: 3, checked: true,  expendable: false },
    ],
    Toiletries: [
      { id: 't1', sub: 'Toiletries', desc: 'Toothbrush',         weightOz: 0.6,  qty: 1, checked: true,  expendable: true },
      { id: 't2', sub: 'Toiletries', desc: 'Travel Toothpaste',  weightOz: 1.2,  qty: 1, checked: false, expendable: true },
      { id: 't3', sub: 'Toiletries', desc: 'Sunscreen SPF 50',   weightOz: 3.4,  qty: 1, checked: false, expendable: true },
      { id: 't4', sub: 'Toiletries', desc: 'Biodegradable Soap', weightOz: 2.0,  qty: 1, checked: true,  expendable: true },
    ],
    Electronics: [
      { id: 'e1', sub: 'Electronics', desc: 'Headlamp',          weightOz: 3.2,  qty: 1, checked: true,  expendable: false },
      { id: 'e2', sub: 'Electronics', desc: 'Power Bank',        weightOz: 6.4,  qty: 1, checked: true,  expendable: false },
      { id: 'e3', sub: 'Electronics', desc: 'GPS Watch',         weightOz: 4.8,  qty: 1, checked: true,  expendable: false },
    ],
    Shelter: [
      { id: 's1', sub: 'Shelter', desc: 'Tent (Nemo Hornet 2P)', weightOz: 42.0, qty: 1, checked: true,  expendable: false },
      { id: 's2', sub: 'Shelter', desc: 'Sleeping Bag',          weightOz: 32.0, qty: 1, checked: true,  expendable: false },
      { id: 's3', sub: 'Shelter', desc: 'Sleeping Pad',          weightOz: 16.0, qty: 1, checked: true,  expendable: false },
    ],
    Kitchen: [
      { id: 'k1', sub: 'Kitchen', desc: 'Jetboil Stove',         weightOz: 13.1, qty: 1, checked: true,  expendable: false },
      { id: 'k2', sub: 'Kitchen', desc: 'Titanium Spork',        weightOz: 0.6,  qty: 1, checked: true,  expendable: false },
      { id: 'k3', sub: 'Kitchen', desc: 'Freeze Dried Meals',    weightOz: 4.5,  qty: 5, checked: false, expendable: true },
    ],
  },
};

// ─── TOOTHBRUSH ICON (inline SVG — lucide-react has no Toothbrush) ─────────────
function ToothbrushIcon({ size = 26, color = 'rgba(255,255,255,0.93)', strokeWidth = 1.5 }: {
  size?: number; color?: string; strokeWidth?: number;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M3 21L14 10"/>
      <path d="M12 8L16 4L21 9L17 13Z"/>
      <path d="M14 6L19 11"/>
    </svg>
  );
}

/** True when the category name matches toiletries/hygiene keywords. */
function isToiletriesCategory(name: string): boolean {
  const l = name.toLowerCase();
  return ['toilet', 'hygiene', 'grooming', 'personal care', 'wash', 'beauty', 'soap'].some(kw => l.includes(kw));
}

// ─── CONSTANTS ─────────────────────────────────────────────────────────────────
const QTY_OPTIONS = Array.from({ length: 20 }, (_, i) => i + 1);
const WEDGE_W     = 72;
const WEDGE_POINT = 17;
const CARD_H      = 68;

// ─── TOKENS (matches approved V3 master) ──────────────────────────────────────
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

// ─── LOGO MARK (unchanged from V3 master) ─────────────────────────────────────
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

// ─── LANDSCAPE DECORATION (unchanged from V3 master — 027F art) ───────────────
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

// ─── BOTTOM NAV ────────────────────────────────────────────────────────────────
// Labels per 027H approved product direction: List | Locker | Catalog | Summary | More
function BottomNav() {
  const tabs = [
    { Icon: Backpack,       label: 'List',    active: true  },
    { Icon: Folder,         label: 'Locker',  active: false },
    { Icon: Grid3X3,        label: 'Catalog', active: false },
    { Icon: BarChart2,      label: 'Summary', active: false },
    { Icon: MoreHorizontal, label: 'More',    active: false },
  ];
  return (
    <div style={{
      position: 'sticky', bottom: 0, left: 0, right: 0,
      background: NAV_BG, borderTop: '1px solid rgba(0,0,0,0.08)',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      paddingTop: 8, paddingBottom: 10, zIndex: 20, height: 58, boxSizing: 'border-box',
    }}>
      {tabs.map(({ Icon, label, active }) => (
        <div
          key={label}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 52, cursor: active ? 'default' : 'not-allowed' }}
          aria-disabled={!active}
          aria-current={active ? 'page' : undefined}
        >
          <Icon size={22} color={active ? NAV_ACTIVE : NAV_INACTIVE} strokeWidth={active ? 2 : 1.6}/>
          <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, color: active ? NAV_ACTIVE : NAV_INACTIVE, letterSpacing: active ? '0.1px' : 0 }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
// Wrapped with UnitProvider so this isolated route is fully self-contained
// without requiring App.tsx to know about the UnitContext dependency.
export default function MobileFunctionalV3() {
  return (
    <UnitProvider>
      <MobileFunctionalV3Inner/>
    </UnitProvider>
  );
}

function MobileFunctionalV3Inner() {
  const { userId, isLoaded } = useAuth();
  const { system } = useUnit();

  // ── Sandbox state — cloned from production localStorage, never written back ──
  const [sandbox, setSandbox] = useState<SandboxStore>({ items: {}, order: [], meta: {} });
  const [sandboxReady, setSandboxReady] = useState(false);
  const [listName, setListName] = useState('My Pack List');

  // ── UI state ──
  const [openCatName, setOpenCatName] = useState<string | null>(null); // single-open
  const [expandedItem, setExpandedItem] = useState<{ cat: string; id: string } | null>(null);

  // ── Seed sandbox from production localStorage (read-once on auth ready) ──
  useEffect(() => {
    if (!isLoaded) return;
    const key = userId
      ? `pack-checklist-v5-${userId}`
      : 'pack-checklist-v5-guest';
    let seeded = false;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.items && Array.isArray(parsed.order) && parsed.order.length > 0) {
          setSandbox({
            items:  parsed.items  as PackState,
            order:  parsed.order  as string[],
            meta:   (parsed.meta  ?? {}) as Record<string, CategoryMeta>,
          });
          seeded = true;
        }
      }
    } catch {
      // Parsing failed — fall through to demo seed
    }
    // Fall back to demo seed when owner localStorage has no data
    // (e.g. unauthenticated, new user, or guest session)
    if (!seeded) {
      setSandbox(DEMO_SEED);
      setListName('Demo Pack List');
    }
    // Active list name from sessionStorage (set by Locker when a file is opened)
    const savedName = sessionStorage.getItem('tw-savedlist-entry-name');
    if (savedName) setListName(savedName);

    setSandboxReady(true);
  }, [isLoaded, userId]);

  // ── Sandbox mutations — local state only, no localStorage writes ──────────────

  const updateItem = useCallback((category: string, id: string, updates: Partial<GearItem>) => {
    setSandbox(prev => ({
      ...prev,
      items: {
        ...prev.items,
        [category]: (prev.items[category] ?? []).map(item =>
          item.id === id ? { ...item, ...updates } : item
        ),
      },
    }));
  }, []);

  const moveItem = useCallback((src: string, dst: string, id: string) => {
    setSandbox(prev => {
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
    // Collapse expanded panel after move (item is now in a different category)
    setExpandedItem(null);
  }, []);

  // ── Category accordion — single-open, zero-open allowed ──────────────────────

  const handleCatToggle = useCallback((catName: string) => {
    setOpenCatName(prev => {
      const closing = prev === catName;
      return closing ? null : catName;
    });
    // Collapse any expanded item when its category closes
    setExpandedItem(prev => (prev?.cat === catName ? null : prev));
  }, []);

  // ── Item expand/collapse — single item open at a time ────────────────────────

  const handleItemToggle = useCallback((cat: string, id: string) => {
    setExpandedItem(prev =>
      prev?.cat === cat && prev?.id === id ? null : { cat, id }
    );
  }, []);

  // ── Derived summary metrics (sandbox-scoped) ─────────────────────────────────

  const allItems   = sandbox.order.flatMap(cat => sandbox.items[cat] ?? []);
  const totalItems = allItems.length;
  const selectedCount    = allItems.filter(i => i.checked).length;
  const notSelectedCount = totalItems - selectedCount;
  const catCount   = sandbox.order.length;
  const su         = smallUnit(system);

  // ── Loading state ────────────────────────────────────────────────────────────

  if (!sandboxReady) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', background: PAGE_BG, color: SECONDARY, fontFamily: SANS }}>
        Loading preview…
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100dvh', background: '#DDD8CF', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
      <div style={{
        width: '100%', maxWidth: 430, height: '100dvh',
        background: PAGE_BG, display: 'flex', flexDirection: 'column',
        fontFamily: SANS, overflow: 'hidden', position: 'relative',
      }}>

        {/* ── APP BAR ── */}
        <div style={{
          height: 52, background: HEADER_BG, borderBottom: `1px solid ${HEADER_BDR}`,
          display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10,
          flexShrink: 0, zIndex: 10,
        }}>
          {/* Hamburger — inert in 027H */}
          <button
            aria-label="Menu"
            aria-disabled="true"
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

          {/* Search circle — inert in 027H */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              aria-label="Search"
              aria-disabled="true"
              style={{
                width: 34, height: 34, borderRadius: 17, background: '#FFFFFF',
                boxShadow: '0 1px 4px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'not-allowed', flexShrink: 0,
              }}
            >
              <Search size={17} color={SECONDARY} strokeWidth={1.8}/>
            </div>

            {/* FAB — inert in 027H */}
            <div
              aria-label="Add"
              aria-disabled="true"
              style={{
                width: 34, height: 34, borderRadius: 17, background: NAV_ACTIVE,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'not-allowed', flexShrink: 0,
              }}
            >
              <Plus size={18} color="#fff" strokeWidth={2.4}/>
            </div>
          </div>
        </div>

        {/* ── SCROLLABLE CONTENT ── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>

          {/* ── LIST IDENTITY with landscape decoration ── */}
          <div style={{ position: 'relative', padding: '11px 16px 10px', overflow: 'hidden' }}>
            <LandscapeDecoration/>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                <span style={{ fontSize: 16.5, fontWeight: 500, color: PRIMARY, letterSpacing: '0px' }}>
                  {listName}
                </span>
                {/* Title chevron — inert in 027H */}
                <ChevronDown size={16} color={SECONDARY} strokeWidth={2} aria-hidden="true"/>
              </div>
              <div style={{ fontSize: 12.5, color: MUTED }}>
                {catCount} {catCount === 1 ? 'category' : 'categories'}
              </div>
            </div>
          </div>

          {/* ── LIST SUMMARY CARD ── */}
          <div style={{ paddingBottom: 12 }}>
            <div style={{
              margin: '0 16px', borderRadius: 16, background: SUMMARY_BG,
              padding: '16px 16px 16px 14px', display: 'flex', alignItems: 'center',
              gap: 16, boxShadow: '0 2px 10px rgba(42,87,64,0.28)',
            }}>
              {/* Icon box */}
              <div style={{
                width: 66, height: 66, borderRadius: 14, background: 'rgba(0,0,0,0.20)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Luggage size={34} color="rgba(255,255,255,0.90)" strokeWidth={1.4}/>
              </div>

              {/* Right content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Label — LIST SUMMARY (not "TRIP SUMMARY") */}
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '1.1px',
                  color: 'rgba(255,255,255,0.52)', textTransform: 'uppercase', marginBottom: 3,
                }}>
                  LIST SUMMARY
                </div>

                {/* Item count */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 9, lineHeight: 1 }}>
                  <span style={{ fontSize: 40, fontWeight: 800, color: SUMMARY_TEXT, letterSpacing: '-1.5px', lineHeight: 1 }}>
                    {totalItems}
                  </span>
                  <span style={{ fontSize: 17, fontWeight: 500, color: 'rgba(255,255,255,0.78)' }}>
                    items
                  </span>
                </div>

                {/* Selected / Not Selected — NOT "Packed / Remaining" */}
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 19, height: 19, borderRadius: 10,
                      background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.50)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Check size={10} color="rgba(255,255,255,0.92)" strokeWidth={2.5}/>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: SUMMARY_TEXT }}>
                      {selectedCount} Selected
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 19, height: 19, borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.38)', background: 'transparent' }}/>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.78)' }}>
                      {notSelectedCount} Not Selected
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── CATEGORY STACK ── */}
          <div style={{ padding: '4px 16px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sandbox.order.map((catName, catIdx) => {
              const items   = sandbox.items[catName] ?? [];
              const isOpen  = openCatName === catName;
              const theme   = getCategoryTheme(catName, catIdx);

              // Category metrics — selected items only
              const selectedInCat = items.filter(i => i.checked).length;
              const catTotalOz    = items
                .filter(i => i.checked)
                .reduce((s, i) => s + calcTotalOz(i.weightOz, i.qty), 0);
              // catTotalOz is displayed on the RIGHT of the category bar (not in subtitle)

              return (
                <div key={catName} style={{
                  borderRadius: 14, overflow: 'hidden',
                  background: CARD_BG, border: `1px solid ${CARD_BORDER}`,
                  boxShadow: CARD_SHADOW,
                }}>

                  {/* ── CATEGORY HEADER ── */}
                  <div style={{ display: 'flex', alignItems: 'stretch', minHeight: CARD_H }}>

                    {/* WEDGE / ICON — PRIMARY ACCORDION TOGGLE */}
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
                      {/* Toothbrush overrides Heart/Droplets for Toiletries category */}
                      {isToiletriesCategory(catName)
                        ? <ToothbrushIcon size={26} color="rgba(255,255,255,0.93)" strokeWidth={1.5}/>
                        : <theme.Icon size={26} color="rgba(255,255,255,0.93)" strokeWidth={1.5} aria-hidden="true"/>}
                    </button>

                    {/* CONTENT — three-column grid: [text] [handle-slot] [weight]
                        Col 1 (minmax 0,1fr): name + subtitle — protected, never overlaps.
                        Col 2 (32px fixed):   six-dot handle — dedicated structural slot.
                        Col 3 (auto):         selected weight — far right, never clipped. */}
                    <div style={{
                      flex: 1, minWidth: 0,
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 1fr) 32px auto',
                      alignItems: 'center',
                      padding: '10px 12px',
                      columnGap: 0,
                    }}>
                      {/* Col 1 — name + subtitle */}
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontSize: 17, fontWeight: 500, color: PRIMARY,
                          lineHeight: 1.2, marginBottom: 2, letterSpacing: '-0.1px',
                          fontFamily: SERIF,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {catName}
                        </div>
                        <div style={{ fontSize: 12.5, color: MUTED }}>
                          {items.length} {items.length === 1 ? 'item' : 'items'} • {selectedInCat} selected
                        </div>
                      </div>

                      {/* Col 2 — six-dot handle in reserved structural slot; inert (no DnD installed) */}
                      <div aria-hidden="true" style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: 0.28,
                      }}>
                        <GripVertical size={18} color={SECONDARY} strokeWidth={1.5}/>
                      </div>

                      {/* Col 3 — selected-weight, right-aligned, live via calcTotalOz */}
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
                        const isExpanded = expandedItem?.cat === catName && expandedItem?.id === item.id;
                        const isLast     = itemIdx === items.length - 1;
                        const totalOz    = calcTotalOz(item.weightOz, item.qty);
                        const otherCats  = sandbox.order.filter(c => c !== catName);
                        const displayName = item.desc || item.sub || 'Unnamed item';

                        // Weight display value in current unit system
                        const weightDisplay = system === 'metric'
                          ? +((item.weightOz) * 28.3495).toFixed(1)
                          : +item.weightOz.toFixed(2);

                        return (
                          <div key={item.id}>

                            {/* ITEM ROW — body tap opens/closes detail panel.
                                Checkbox stops propagation so it only toggles selection.
                                No chevron: row body IS the expand/collapse affordance. */}
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
                                aria-label={`${displayName} ${item.checked ? 'selected' : 'not selected'}`}
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
                              <span style={{ fontSize: 14, color: SECONDARY }}>
                                {item.qty}
                              </span>
                            </div>

                            {/* EXPANDED DETAIL PANEL */}
                            {isExpanded && (
                              <div style={{
                                background: DETAIL_BG,
                                borderBottom: isLast ? 'none' : `1px solid ${DIVIDER}`,
                              }}>

                                {/* Weight */}
                                <div style={{
                                  display: 'flex', alignItems: 'center',
                                  padding: '0 14px', height: 42, gap: 10,
                                  borderBottom: `1px solid ${DETAIL_BDR}`,
                                }}>
                                  <Hash size={14} color={MUTED} strokeWidth={1.8} aria-hidden="true"/>
                                  <div style={{ flex: 1, fontSize: 13.5, color: SECONDARY }}>Weight</div>
                                  <input
                                    type="number"
                                    min={0}
                                    step={system === 'metric' ? 1 : 0.1}
                                    value={weightDisplay}
                                    aria-label={`Weight of ${displayName} in ${su}`}
                                    onChange={e => {
                                      const num = parseFloat(e.target.value);
                                      if (!isNaN(num) && num >= 0) {
                                        updateItem(catName, item.id, {
                                          weightOz: system === 'metric' ? gramsToOz(num) : num,
                                        });
                                      }
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

                                {/* Total (derived — not stored) */}
                                <div style={{
                                  display: 'flex', alignItems: 'center',
                                  padding: '0 14px', height: 42, gap: 10,
                                  borderBottom: otherCats.length > 0 ? `1px solid ${DETAIL_BDR}` : 'none',
                                }}>
                                  <Check size={14} color={MUTED} strokeWidth={1.8} aria-hidden="true"/>
                                  <div style={{ flex: 1, fontSize: 13.5, color: SECONDARY }}>Total</div>
                                  <div style={{ fontSize: 13.5, fontWeight: 500, color: PRIMARY }}>
                                    {formatWeight(totalOz, system, 'small')} {su}
                                  </div>
                                </div>

                                {/* Move — only shown when other categories exist */}
                                {otherCats.length > 0 && (
                                  <div style={{
                                    display: 'flex', alignItems: 'center',
                                    padding: '0 14px', height: 42, gap: 10,
                                  }}>
                                    <ArrowRightLeft size={14} color={MUTED} strokeWidth={1.8} aria-hidden="true"/>
                                    <div style={{ flex: 1, fontSize: 13.5, color: SECONDARY }}>Move</div>
                                    <select
                                      value=""
                                      aria-label={`Move ${displayName} to another category`}
                                      onChange={e => {
                                        if (e.target.value) moveItem(catName, e.target.value, item.id);
                                      }}
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

                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              );
            })}

            {/* Empty state — sandbox had no categories */}
            {sandbox.order.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 24px', color: MUTED, fontSize: 14 }}>
                <div style={{ marginBottom: 8, fontSize: 22 }}>📋</div>
                <div>No list data found.</div>
                <div style={{ fontSize: 12.5, marginTop: 4 }}>Open your list in the main app first, then return here.</div>
              </div>
            )}
          </div>

        </div>{/* end scrollable */}

        {/* ── BOTTOM NAV (List | Locker | Catalog | Summary | More) ── */}
        <BottomNav/>

      </div>
    </div>
  );
}
