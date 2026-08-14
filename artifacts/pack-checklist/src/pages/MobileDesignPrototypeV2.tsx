/**
 * MobileDesignPrototypeV2.tsx — 027B
 * Isolated visual prototype at /mobile-design-v2
 * Static design only — no real control wiring.
 * Add ?dark=1 for dark mode.
 */
import React, { useState } from 'react';
import {
  Menu, Search, Plus, Scale, Backpack, Moon, Tent, Shirt,
  UtensilsCrossed, Droplets, Zap, Heart, ChevronDown, ChevronUp,
  Check, GripVertical, Lock, MapPin, Hash, Weight, Package,
  BarChart2, ScanLine, ClipboardList, Sun, Eye, EyeOff,
  Undo2, Redo2, Save, RefreshCw, FilePlus, MoreHorizontal,
  AlignLeft, ChevronRight, Minus,
} from 'lucide-react';

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────

const LIGHT = {
  page:          '#F2EFE9',
  card:          '#FFFFFF',
  cardBorder:    'rgba(0,0,0,0.07)',
  cardShadow:    '0 1px 4px rgba(0,0,0,0.07)',
  headerBg:      '#FFFFFF',
  headerBorder:  'rgba(0,0,0,0.06)',
  listBand:      '#F2EFE9',
  primary:       '#1C2B22',
  secondary:     '#4E6358',
  muted:         '#8FA598',
  weight:        '#2E5C3A',
  summaryCard:   '#2D5A3B',
  summaryText:   '#FFFFFF',
  summaryMuted:  'rgba(255,255,255,0.65)',
  summaryBadge:  'rgba(255,255,255,0.15)',
  divider:       'rgba(0,0,0,0.06)',
  ctrlBg:        '#E8E5DF',
  ctrlBorder:    'rgba(0,0,0,0.08)',
  ctrlText:      '#3A4D42',
  segActive:     '#FFFFFF',
  segActiveShadow:'0 1px 3px rgba(0,0,0,0.15)',
  fabGreen:      '#2D5A3B',
  navBg:         '#FFFFFF',
  navBorder:     'rgba(0,0,0,0.08)',
  navActive:     '#2D5A3B',
  navInactive:   '#9AA89F',
  expandedBg:    '#FAFAF8',
  itemBorder:    'rgba(0,0,0,0.05)',
  detailBg:      '#F7F5F1',
  detailBorder:  'rgba(0,0,0,0.06)',
  checkbox:      'rgba(0,0,0,0.12)',
  checkboxChecked: '#4E7B5C',
  utilCard:      '#FFFFFF',
  utilBorder:    'rgba(0,0,0,0.07)',
  addCatBorder:  'rgba(0,0,0,0.15)',
  addCatText:    '#6A7D74',
};

const DARK = {
  page:          '#141A16',
  card:          '#1C2520',
  cardBorder:    'rgba(255,255,255,0.07)',
  cardShadow:    '0 1px 6px rgba(0,0,0,0.35)',
  headerBg:      '#1C2520',
  headerBorder:  'rgba(255,255,255,0.06)',
  listBand:      '#141A16',
  primary:       '#DDE8E2',
  secondary:     '#8AADA0',
  muted:         '#506860',
  weight:        '#7EC895',
  summaryCard:   '#1B3526',
  summaryText:   '#FFFFFF',
  summaryMuted:  'rgba(255,255,255,0.55)',
  summaryBadge:  'rgba(255,255,255,0.10)',
  divider:       'rgba(255,255,255,0.06)',
  ctrlBg:        '#1E2720',
  ctrlBorder:    'rgba(255,255,255,0.08)',
  ctrlText:      '#B8D0C4',
  segActive:     '#2D4035',
  segActiveShadow:'0 1px 3px rgba(0,0,0,0.4)',
  fabGreen:      '#2D5A3B',
  navBg:         '#1C2520',
  navBorder:     'rgba(255,255,255,0.07)',
  navActive:     '#7EC895',
  navInactive:   '#486055',
  expandedBg:    '#18211C',
  itemBorder:    'rgba(255,255,255,0.05)',
  detailBg:      '#1A221D',
  detailBorder:  'rgba(255,255,255,0.06)',
  checkbox:      'rgba(255,255,255,0.12)',
  checkboxChecked: '#4E7B5C',
  utilCard:      '#1C2520',
  utilBorder:    'rgba(255,255,255,0.07)',
  addCatBorder:  'rgba(255,255,255,0.12)',
  addCatText:    '#506860',
};

// ─── SAMPLE DATA ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  { name: 'Backpack',        bg: '#3B6978', Icon: Backpack,       items: 4,  selected: 2, weight: '42.5 oz', lbs: '2.66 lb' },
  { name: 'Sleep System',    bg: '#5C6BC0', Icon: Moon,           items: 5,  selected: 3, weight: '34.0 oz', lbs: '2.13 lb', expanded: true },
  { name: 'Shelter System',  bg: '#4E7B5C', Icon: Tent,           items: 9,  selected: 4, weight: '45.0 oz', lbs: '2.81 lb' },
  { name: 'Clothing Packed', bg: '#7B5D87', Icon: Shirt,          items: 8,  selected: 0, weight: '—',       lbs: '' },
  { name: 'Kitchen Gear',    bg: '#A06030', Icon: UtensilsCrossed,items: 10, selected: 5, weight: '43.4 oz', lbs: '2.71 lb' },
  { name: 'Hydration',       bg: '#1B7A8A', Icon: Droplets,       items: 2,  selected: 2, weight: '11.2 oz', lbs: '0.70 lb' },
  { name: 'Electronics',     bg: '#B8722A', Icon: Zap,            items: 10, selected: 2, weight: '4.5 oz',  lbs: '0.28 lb' },
  { name: 'Toiletries',      bg: '#A05898', Icon: Heart,          items: 5,  selected: 0, weight: '—',       lbs: '' },
];

const SLEEP_ITEMS = [
  { name: 'Enlightened Equipment Quilt', type: 'Quilt',   weight: '18.0 oz', checked: true,  expanded: false },
  { name: 'Therm-a-Rest NeoAir XLite',  type: 'Pad',     weight: '12.0 oz', checked: true,  expanded: false },
  { name: 'Earplugs',                    type: 'Comfort', weight: '0.30 oz', checked: false, expanded: true  },
];

// ─── MOUNTAIN WATERMARK SVG ───────────────────────────────────────────────────

function MountainWatermark({ color = '#FFFFFF', opacity = 0.10 }: { color?: string; opacity?: number }) {
  return (
    <svg
      viewBox="0 0 260 90"
      preserveAspectRatio="xMaxYMax meet"
      style={{ position: 'absolute', right: 0, bottom: 0, width: '62%', height: '100%', pointerEvents: 'none' }}
    >
      {/* Background mountains */}
      <path d="M20,90 L90,28 L130,55 L170,10 L210,42 L250,18 L260,24 L260,90 Z"
            fill={color} opacity={opacity * 0.6}/>
      {/* Foreground mountains */}
      <path d="M100,90 L155,38 L185,60 L220,25 L260,52 L260,90 Z"
            fill={color} opacity={opacity}/>
      {/* Snow caps */}
      <path d="M170,10 L162,26 L178,26 Z" fill={color} opacity={opacity * 1.4}/>
      <path d="M250,18 L244,30 L256,30 Z" fill={color} opacity={opacity * 1.2}/>
      {/* Trees */}
      <polygon points="108,90 104,78 112,78" fill={color} opacity={opacity * 0.8}/>
      <polygon points="122,90 118,80 126,80" fill={color} opacity={opacity * 0.8}/>
      <polygon points="136,90 133,82 139,82" fill={color} opacity={opacity * 0.7}/>
      <polygon points="232,90 228,80 236,80" fill={color} opacity={opacity * 0.7}/>
      <polygon points="244,90 241,83 247,83" fill={color} opacity={opacity * 0.6}/>
    </svg>
  );
}

// ─── LOGO MARK ────────────────────────────────────────────────────────────────

function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M4 38 L16 18 L24 28 L32 14 L44 38 Z" fill="hsl(140,30%,30%)" opacity="0.9"/>
      <path d="M32 14 L28 22 L36 22 Z" fill="hsl(40,20%,95%)" opacity="0.85"/>
      <path d="M16 18 L13.5 23 L18.5 23 Z" fill="hsl(40,20%,95%)" opacity="0.7"/>
      <circle cx="24" cy="32" r="2.5" fill="hsl(40,25%,80%)" opacity="0.9"/>
    </svg>
  );
}

// ─── WEDGE CARD ───────────────────────────────────────────────────────────────

function CategoryCard({
  cat, t, isExpanded, children,
}: {
  cat: typeof CATEGORIES[0];
  t: typeof LIGHT;
  isExpanded?: boolean;
  children?: React.ReactNode;
}) {
  const WEDGE_W = 72;
  const CARD_H = 72;
  const POINT = 18;

  return (
    <div style={{
      borderRadius: 16,
      overflow: 'hidden',
      background: t.card,
      border: `1px solid ${t.cardBorder}`,
      boxShadow: t.cardShadow,
    }}>
      {/* ── collapsed header row ── */}
      <div style={{ display: 'flex', alignItems: 'stretch', minHeight: CARD_H }}>
        {/* Wedge */}
        <div style={{
          width: WEDGE_W,
          minHeight: CARD_H,
          background: cat.bg,
          clipPath: `polygon(0 0, calc(100% - ${POINT}px) 0, 100% 50%, calc(100% - ${POINT}px) 100%, 0 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          paddingRight: POINT / 2,
          cursor: 'pointer',
        }}>
          <cat.Icon size={28} color="rgba(255,255,255,0.92)" strokeWidth={1.6}/>
        </div>

        {/* Category info */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          padding: '10px 10px 10px 14px',
          minWidth: 0,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: t.primary, lineHeight: 1.2, marginBottom: 3 }}>
              {cat.name}
            </div>
            <div style={{ fontSize: 13, color: t.muted }}>
              {cat.items} items • {cat.selected} selected
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: 8 }}>
            {cat.weight !== '—' && (
              <>
                <div style={{ fontSize: 15, fontWeight: 700, color: t.weight }}>{cat.weight}</div>
                {cat.lbs && <div style={{ fontSize: 11.5, color: t.muted }}>{cat.lbs}</div>}
              </>
            )}
            <div style={{ marginTop: cat.weight !== '—' ? 2 : 0 }}>
              {isExpanded
                ? <ChevronUp size={18} color={t.muted} strokeWidth={2}/>
                : <ChevronDown size={18} color={t.muted} strokeWidth={2}/>}
            </div>
          </div>
        </div>
      </div>

      {/* ── expanded body ── */}
      {isExpanded && children && (
        <div style={{ background: t.expandedBg, borderTop: `1px solid ${t.divider}` }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── ITEM ROW ─────────────────────────────────────────────────────────────────

function ItemRow({
  item, categoryBg, t, isExpanded,
}: {
  item: typeof SLEEP_ITEMS[0];
  categoryBg: string;
  t: typeof LIGHT;
  isExpanded?: boolean;
}) {
  const ICON_SIZE = 30;

  return (
    <div>
      {/* collapsed item header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '11px 16px',
        gap: 12,
        borderBottom: `1px solid ${t.itemBorder}`,
      }}>
        {/* Checkbox */}
        <div style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          border: `1.5px solid ${item.checked ? t.checkboxChecked : t.checkbox}`,
          background: item.checked ? t.checkboxChecked : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {item.checked && <Check size={12} color="#fff" strokeWidth={2.5}/>}
        </div>

        {/* Item type icon tile */}
        <div style={{
          width: ICON_SIZE,
          height: ICON_SIZE,
          borderRadius: 8,
          background: categoryBg + '22',
          border: `1px solid ${categoryBg}44`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Moon size={14} color={categoryBg} strokeWidth={1.8}/>
        </div>

        {/* Name + type */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 15,
            fontWeight: 500,
            color: t.primary,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.25,
          }}>
            {item.name}
          </div>
          <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{item.type}</div>
        </div>

        {/* Weight + chevron */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: t.weight }}>{item.weight}</div>
          <div style={{ marginTop: 2 }}>
            {isExpanded
              ? <ChevronUp size={15} color={t.muted} strokeWidth={2}/>
              : <ChevronDown size={15} color={t.muted} strokeWidth={2}/>}
          </div>
        </div>
      </div>

      {/* expanded detail rows */}
      {isExpanded && (
        <div style={{ background: t.detailBg, margin: '0 12px 8px', borderRadius: 10, border: `1px solid ${t.detailBorder}` }}>
          {[
            { icon: Weight,    label: 'Weight',   value: '0.30 oz' },
            { icon: Hash,      label: 'Quantity',  value: '1' },
            { icon: Package,   label: 'Total',     value: '0.30 oz' },
            { icon: MapPin,    label: 'Move',      value: 'Toiletries ↓' },
          ].map(({ icon: Icon, label, value }, i, arr) => (
            <div key={label} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '11px 14px',
              borderBottom: i < arr.length - 1 ? `1px solid ${t.detailBorder}` : 'none',
              gap: 10,
            }}>
              <Icon size={15} color={t.muted} strokeWidth={1.8}/>
              <div style={{ flex: 1, fontSize: 14, color: t.secondary }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: t.primary }}>{value}</div>
            </div>
          ))}
          {/* drag to reorder */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '8px 14px',
            borderTop: `1px solid ${t.detailBorder}`,
          }}>
            <GripVertical size={13} color={t.muted} strokeWidth={1.8}/>
            <span style={{ fontSize: 12, color: t.muted }}>Drag to reorder</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── COMPACT CTRL BUTTON ──────────────────────────────────────────────────────

function CtrlBtn({ icon: Icon, label, t, active }: {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  t: typeof LIGHT;
  active?: boolean;
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 3,
      padding: '6px 8px',
      borderRadius: 10,
      background: active ? t.segActive : 'transparent',
      boxShadow: active ? t.segActiveShadow : 'none',
      cursor: 'pointer',
      flexShrink: 0,
    }}>
      <Icon size={17} color={active ? t.weight : t.ctrlText} strokeWidth={1.8}/>
      <span style={{ fontSize: 10.5, color: active ? t.weight : t.ctrlText, fontWeight: active ? 600 : 400, whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </div>
  );
}

// ─── SEGMENTED CONTROL ────────────────────────────────────────────────────────

function SegmentedControl({ left, right, t }: { left: string; right: string; t: typeof LIGHT }) {
  return (
    <div style={{
      display: 'flex',
      background: t.ctrlBg,
      borderRadius: 10,
      padding: 3,
      gap: 2,
    }}>
      {[left, right].map((label, i) => (
        <div key={label} style={{
          padding: '5px 14px',
          borderRadius: 8,
          background: i === 0 ? t.segActive : 'transparent',
          boxShadow: i === 0 ? t.segActiveShadow : 'none',
          fontSize: 13,
          fontWeight: i === 0 ? 600 : 400,
          color: i === 0 ? t.ctrlText : t.muted,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}>
          {label}
        </div>
      ))}
    </div>
  );
}

// ─── UTILITY ROW ─────────────────────────────────────────────────────────────

function UtilRow({
  icon: Icon, label, badge, last, t,
}: {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string; badge?: number; last?: boolean; t: typeof LIGHT;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '13px 16px',
      gap: 12,
      borderBottom: last ? 'none' : `1px solid ${t.divider}`,
    }}>
      <Icon size={17} color={t.muted} strokeWidth={1.8}/>
      <span style={{ flex: 1, fontSize: 14, color: t.secondary }}>{label}</span>
      {badge != null && (
        <span style={{
          background: t.fabGreen,
          color: '#fff',
          fontSize: 11,
          fontWeight: 700,
          borderRadius: 10,
          padding: '1px 7px',
        }}>{badge}</span>
      )}
      <ChevronRight size={15} color={t.muted} strokeWidth={2}/>
    </div>
  );
}

// ─── BOTTOM NAV ───────────────────────────────────────────────────────────────

function BottomNav({ t }: { t: typeof LIGHT }) {
  const tabs = [
    { icon: Backpack,     label: 'Pack List', active: true },
    { icon: Scale,        label: 'Summary',   active: false },
    { icon: Package,      label: 'Gear',      active: false },
    { icon: BarChart2,    label: 'Stats',     active: false },
    { icon: MoreHorizontal, label: 'More',   active: false },
  ];
  return (
    <div style={{
      position: 'sticky',
      bottom: 0,
      left: 0,
      right: 0,
      background: t.navBg,
      borderTop: `1px solid ${t.navBorder}`,
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '8px 0 12px',
      zIndex: 20,
    }}>
      {tabs.map(({ icon: Icon, label, active }) => (
        <div key={label} style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          padding: '0 4px',
          cursor: 'pointer',
          minWidth: 52,
        }}>
          <Icon size={22} color={active ? t.navActive : t.navInactive} strokeWidth={active ? 2 : 1.7}/>
          <span style={{
            fontSize: 10.5,
            fontWeight: active ? 600 : 400,
            color: active ? t.navActive : t.navInactive,
          }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function MobileDesignPrototypeV2() {
  const [dark, setDark] = useState(
    typeof window !== 'undefined' && window.location.search.includes('dark=1'),
  );
  const t = dark ? DARK : LIGHT;

  return (
    <div style={{
      minHeight: '100dvh',
      background: dark ? '#0E1310' : '#DEDAD3',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 430,
        height: '100dvh',
        background: t.page,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        overflow: 'hidden',
      }}>

        {/* ── HEADER ── */}
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: t.headerBg,
          borderBottom: `1px solid ${t.headerBorder}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          height: 56,
          gap: 10,
        }}>
          <Menu size={22} color={t.secondary} strokeWidth={1.8} style={{ cursor: 'pointer', flexShrink: 0 }}/>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1 }}>
            <LogoMark size={26}/>
            <span style={{ fontSize: 19, fontWeight: 700, color: t.primary, letterSpacing: '-0.3px' }}>TrailWeigh</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setDark(d => !d)} style={{
              background: 'none', border: 'none', padding: 4, cursor: 'pointer', display: 'flex',
            }}>
              {dark
                ? <Sun size={20} color={t.secondary} strokeWidth={1.8}/>
                : <Moon size={20} color={t.secondary} strokeWidth={1.8}/>}
            </button>
            <Search size={20} color={t.secondary} strokeWidth={1.8} style={{ cursor: 'pointer' }}/>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              background: t.fabGreen,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}>
              <Plus size={18} color="#fff" strokeWidth={2.4}/>
            </div>
          </div>
        </div>

        {/* ── LIST IDENTITY BAND ── */}
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          background: t.summaryCard,
          padding: '14px 16px 0',
        }}>
          {/* Mountain watermark */}
          <MountainWatermark color="#FFFFFF" opacity={0.08}/>

          {/* List name */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              marginBottom: 2,
            }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.2px' }}>
                JMT Weekend Kit
              </span>
              <ChevronDown size={18} color="rgba(255,255,255,0.65)" strokeWidth={2}/>
            </div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.50)', marginBottom: 16 }}>
              Unsaved changes
            </div>
          </div>

          {/* ── SUMMARY CARD (inside list band) ── */}
          <div style={{
            position: 'relative',
            zIndex: 1,
            background: 'rgba(255,255,255,0.10)',
            borderRadius: '14px 14px 0 0',
            padding: '16px 16px 20px',
          }}>
            {/* Icon + label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Scale size={20} color="rgba(255,255,255,0.85)" strokeWidth={1.8}/>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.9px', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>
                BASE WEIGHT
              </span>
            </div>

            {/* Dominant number */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginBottom: 14 }}>
              <span style={{ fontSize: 42, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-1px', lineHeight: 1 }}>12</span>
              <span style={{ fontSize: 22, fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginRight: 6 }}>lb</span>
              <span style={{ fontSize: 42, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-1px', lineHeight: 1 }}>6</span>
              <span style={{ fontSize: 22, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>oz</span>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { value: '52', label: 'Total Items' },
                { value: '2 lb 1 oz', label: 'Worn Weight' },
              ].map(({ value, label }) => (
                <div key={label} style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.12)',
                  borderRadius: 10,
                  padding: '9px 10px',
                }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>{value}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>

          {/* ── CONTROL STRIP ── */}
          <div style={{
            background: t.headerBg,
            borderBottom: `1px solid ${t.headerBorder}`,
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            {/* Row 1: primary view controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between' }}>
              <SegmentedControl left="Imperial" right="Metric" t={t}/>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <CtrlBtn icon={ChevronDown} label="Open All" t={t}/>
                <CtrlBtn icon={EyeOff}     label="Hide"     t={t}/>
                <CtrlBtn icon={ClipboardList} label="List"  t={t} active/>
              </div>
            </div>
            {/* Row 2: secondary file controls */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              background: t.ctrlBg,
              borderRadius: 10,
              padding: '4px 6px',
            }}>
              {[
                { icon: FilePlus,   label: 'New'   },
                { icon: Undo2,      label: 'Undo'  },
                { icon: Redo2,      label: 'Redo'  },
                { icon: Save,       label: 'Save'  },
                { icon: RefreshCw,  label: 'Reset' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 2, padding: '4px 2px', cursor: 'pointer',
                }}>
                  <Icon size={15} color={t.ctrlText} strokeWidth={1.8}/>
                  <span style={{ fontSize: 9.5, color: t.muted }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── CATEGORY LIST ── */}
          <div style={{ padding: '14px 14px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>

            {CATEGORIES.map((cat) => (
              <CategoryCard key={cat.name} cat={cat} t={t} isExpanded={!!cat.expanded}>
                {/* Sleep System expanded items */}
                <div>
                  {SLEEP_ITEMS.map((item) => (
                    <ItemRow
                      key={item.name}
                      item={item}
                      categoryBg={cat.bg}
                      t={t}
                      isExpanded={item.expanded}
                    />
                  ))}
                  {/* Add item */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '12px 16px',
                    color: t.muted,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}>
                    <Plus size={14} color={t.muted} strokeWidth={2}/>
                    Add item
                  </div>
                </div>
              </CategoryCard>
            ))}

            {/* Add category */}
            <div style={{
              border: `1.5px dashed ${t.addCatBorder}`,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '16px',
              cursor: 'pointer',
              marginBottom: 20,
            }}>
              <Plus size={15} color={t.addCatText} strokeWidth={2}/>
              <span style={{ fontSize: 14, color: t.addCatText }}>Add Category</span>
            </div>
          </div>

          {/* ── UTILITY PANELS ── */}
          <div style={{ padding: '0 14px', marginBottom: 20 }}>
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.8px',
              color: t.muted,
              textTransform: 'uppercase',
              marginBottom: 10,
              paddingLeft: 2,
            }}>
              Utilities
            </div>
            <div style={{
              background: t.utilCard,
              borderRadius: 14,
              border: `1px solid ${t.utilBorder}`,
              boxShadow: t.cardShadow,
              overflow: 'hidden',
            }}>
              <UtilRow icon={AlignLeft}  label="Pack Summary"       t={t}/>
              <UtilRow icon={BarChart2}  label="Weight Distribution" t={t}/>
              <UtilRow icon={ScanLine}   label="Scan Gear List"      t={t}/>
              <UtilRow icon={Lock}       label="Locker"              badge={1} last t={t}/>
            </div>
          </div>

          {/* ── FOOTER ── */}
          <div style={{
            padding: '14px 16px 20px',
            borderTop: `1px solid ${t.divider}`,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.secondary, marginBottom: 8 }}>
              TrailWeigh
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {['About', 'How It Works', 'Help', 'Privacy'].map(l => (
                <span key={l} style={{ fontSize: 12, color: t.muted, cursor: 'pointer' }}>{l}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── BOTTOM NAV ── */}
        <BottomNav t={t}/>
      </div>
    </div>
  );
}
