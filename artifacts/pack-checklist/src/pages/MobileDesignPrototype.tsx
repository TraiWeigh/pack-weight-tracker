/**
 * MobileDesignPrototype.tsx — 027A
 *
 * VISUAL DESIGN PROTOTYPE ONLY — no control wiring, no functional logic.
 * Reachable at: /mobile-preview
 *
 * Zero impact on:
 *  - existing Checklist page and working mobile UI
 *  - desktop layout
 *  - any database/API/auth/session
 *
 * All styles are inline — no global CSS pollution.
 */

import React, { useState } from 'react';
import {
  Backpack, Moon, Shirt, Tent, UtensilsCrossed, Droplets, Zap, Heart, Wrench,
  ChevronDown, ChevronUp, Sun, Pencil, Trash2, GripVertical,
  Undo2, Redo2, Save, RotateCcw, Share2, ClipboardList, EyeOff,
  Lock, ScanLine, BarChart2, AlignLeft, Menu, FilePlus, Scale,
} from 'lucide-react';

// ── Design tokens ─────────────────────────────────────────────────────────────

const LIGHT = {
  outerBg:      '#E8E5DD',
  pageBg:       '#F0EEE8',
  surfaceBg:    '#FFFFFF',
  surfaceAlt:   '#F7F5F0',
  border:       'rgba(0,0,0,0.08)',
  borderMid:    'rgba(0,0,0,0.12)',
  text:         '#1A2820',
  textSub:      '#5A6E63',
  textMuted:    '#8FA098',
  headerBg:     '#FFFFFF',
  headerBorder: 'rgba(0,0,0,0.08)',
  summaryBg:    '#2E4A38',
  summaryText:  '#FFFFFF',
  summaryBadge: 'rgba(255,255,255,0.15)',
  ctrlBg:       '#ECEAE4',
  ctrlBorder:   'rgba(0,0,0,0.07)',
  ctrlText:     '#4A6058',
  ctrlActive:   '#FFFFFF',
  ctrlActiveBg: 'rgba(0,0,0,0.06)',
  rowDivider:   'rgba(0,0,0,0.06)',
  utilHeader:   '#8FA098',
  expandedBg:   '#FAFAF8',
  badgeBg:      '#E8F0EA',
  badgeText:    '#3D5A46',
  chevron:      '#8FA098',
  weightColor:  '#2E5A3A',
  footerText:   '#9BADA0',
};

const DARK = {
  outerBg:      '#0E1310',
  pageBg:       '#161C18',
  surfaceBg:    '#1F2821',
  surfaceAlt:   '#1A201C',
  border:       'rgba(255,255,255,0.06)',
  borderMid:    'rgba(255,255,255,0.10)',
  text:         '#E2EBE5',
  textSub:      '#94AE9E',
  textMuted:    '#5E7869',
  headerBg:     '#1F2821',
  headerBorder: 'rgba(255,255,255,0.06)',
  summaryBg:    '#1E3328',
  summaryText:  '#E8F2EC',
  summaryBadge: 'rgba(255,255,255,0.08)',
  ctrlBg:       '#1A201C',
  ctrlBorder:   'rgba(255,255,255,0.06)',
  ctrlText:     '#94AE9E',
  ctrlActive:   '#E2EBE5',
  ctrlActiveBg: 'rgba(255,255,255,0.10)',
  rowDivider:   'rgba(255,255,255,0.06)',
  utilHeader:   '#5E7869',
  expandedBg:   '#1A201C',
  badgeBg:      '#1F3328',
  badgeText:    '#7DB890',
  chevron:      '#5E7869',
  weightColor:  '#7DB890',
  footerText:   '#5E7869',
};

// ── Measurements (documented design tokens) ────────────────────────────────────
// page-h-pad:          16px
// header-height:       56px total (logo row 40px + list-name row 36px)
// summary-card-h:      112px
// ctrl-bar-h:          ~80px (two rows × 36px + 8px gap)
// category-card-h:     60px collapsed
// wedge-w:             72px
// wedge-point-depth:   16px
// icon-size:           26px
// cat-title-size:      15px / 500
// summary-text-size:   13px
// cat-gap:             8px
// expanded-item-pad:   16px
// detail-row-h:        44px
// section-spacing:     20px
// card-radius:         12px

// ── Sample data ───────────────────────────────────────────────────────────────

interface ItemDetail {
  name: string;
  type: string;
  weight: string;
  checked?: boolean;
}

interface CategoryData {
  name: string;
  bg: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  itemCount: number;
  selectedCount: number;
  weight?: string;
  lbs?: string;
  items?: ItemDetail[];
}

const CATEGORIES: CategoryData[] = [
  {
    name: 'Backpack', bg: '#3B6978', Icon: Backpack,
    itemCount: 4, selectedCount: 2, weight: '42.50 oz', lbs: '2.66 lbs',
  },
  {
    name: 'Sleep System', bg: '#5C6BC0', Icon: Moon,
    itemCount: 5, selectedCount: 2, weight: '34.00 oz', lbs: '2.13 lbs',
    items: [
      { name: 'Enlightened Equipment Quilt', type: 'Sleep', weight: '18.00 oz', checked: true },
      { name: 'Therm-a-Rest NeoAir XLite', type: 'Pad', weight: '12.00 oz', checked: true },
      { name: 'Earplugs', type: 'Comfort', weight: '0.30 oz', checked: false },
    ],
  },
  {
    name: 'Clothing Packed', bg: '#7B5D87', Icon: Shirt,
    itemCount: 8, selectedCount: 0,
  },
  {
    name: 'Shelter System', bg: '#4E7B5C', Icon: Tent,
    itemCount: 9, selectedCount: 4, weight: '45.00 oz', lbs: '2.81 lbs',
  },
  {
    name: 'Kitchen Gear', bg: '#A06030', Icon: UtensilsCrossed,
    itemCount: 10, selectedCount: 5, weight: '43.38 oz', lbs: '2.71 lbs',
  },
  {
    name: 'Hydration', bg: '#1B7A8A', Icon: Droplets,
    itemCount: 2, selectedCount: 2, weight: '11.20 oz', lbs: '0.70 lbs',
  },
  {
    name: 'Electronics', bg: '#B8722A', Icon: Zap,
    itemCount: 10, selectedCount: 2, weight: '4.50 oz', lbs: '0.28 lbs',
  },
  {
    name: 'Toiletries', bg: '#A05898', Icon: Heart,
    itemCount: 5, selectedCount: 0,
  },
  {
    name: 'Med Kit', bg: '#C0423C', Icon: Heart,
    itemCount: 3, selectedCount: 0,
  },
  {
    name: 'Repair Kit', bg: '#6B6B3A', Icon: Wrench,
    itemCount: 4, selectedCount: 0,
  },
];

// ── Helper components ─────────────────────────────────────────────────────────

/** The pentagon wedge shape on the left of each category card. */
function CategoryWedge({
  bg, Icon, size = 72,
}: {
  bg: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  size?: number;
}) {
  return (
    <div
      style={{
        width: size,
        minWidth: size,
        alignSelf: 'stretch',
        background: bg,
        clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingRight: 10,
      }}
    >
      <Icon size={24} color="rgba(255,255,255,0.92)" strokeWidth={1.8} />
    </div>
  );
}

/** A single collapsed item row inside an expanded category. */
function CollapsedItemRow({
  item, t, onExpand,
}: {
  item: ItemDetail;
  t: typeof LIGHT;
  onExpand: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px 14px 10px 14px',
        gap: 10,
        cursor: 'pointer',
        borderTop: `1px solid ${t.rowDivider}`,
      }}
      onClick={onExpand}
    >
      {/* Checkbox */}
      <div
        style={{
          width: 20, height: 20, minWidth: 20,
          borderRadius: 4,
          border: item.checked
            ? 'none'
            : `1.5px solid ${t.textMuted}`,
          background: item.checked ? '#4E7B5C' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {item.checked && (
          <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
            <path d="M1 4.5L4.5 8L11 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Name + type */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: t.text, lineHeight: '1.25', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.name}
        </div>
        <div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 1 }}>
          {item.type}
        </div>
      </div>

      {/* Weight */}
      <div style={{ fontSize: 13, fontWeight: 600, color: t.weightColor, whiteSpace: 'nowrap' }}>
        {item.weight}
      </div>

      {/* Chevron */}
      <ChevronDown size={15} color={t.chevron} strokeWidth={2} />
    </div>
  );
}

/** Expanded item — shows Weight, Quantity, Total, Move detail rows. */
function ExpandedItemRow({
  item, t,
}: {
  item: ItemDetail;
  t: typeof LIGHT;
}) {
  const detailRows = [
    { label: 'Weight', value: item.weight },
    { label: 'Quantity', value: '1' },
    { label: 'Total', value: item.weight },
    { label: 'Move', value: 'Toiletries', isAction: true },
  ];

  return (
    <div
      style={{
        borderTop: `1px solid ${t.rowDivider}`,
        background: t.expandedBg,
      }}
    >
      {/* Collapsed-style header for the expanded item */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '10px 14px', gap: 10,
      }}>
        <div style={{
          width: 20, height: 20, minWidth: 20, borderRadius: 4,
          border: `1.5px solid ${t.textMuted}`,
          background: 'transparent',
        }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: t.text }}>{item.name}</div>
          <div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 1 }}>{item.type}</div>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: t.weightColor }}>{item.weight}</div>
        <ChevronUp size={15} color={t.chevron} strokeWidth={2} />
      </div>

      {/* Detail rows */}
      <div style={{ margin: '0 14px 2px 14px', borderRadius: 8, overflow: 'hidden', border: `1px solid ${t.borderMid}` }}>
        {detailRows.map((row, idx) => (
          <div
            key={row.label}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '11px 13px',
              borderTop: idx > 0 ? `1px solid ${t.rowDivider}` : 'none',
              background: t.surfaceBg,
              minHeight: 44,
            }}
          >
            <div style={{ fontSize: 13, color: t.textSub, fontWeight: 500 }}>
              {row.label}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 13.5, fontWeight: row.isAction ? 500 : 600,
              color: row.isAction ? t.textSub : t.text,
            }}>
              {row.value}
              {row.isAction && <ChevronDown size={14} color={t.textMuted} strokeWidth={2} />}
            </div>
          </div>
        ))}
      </div>

      {/* Drag to reorder */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px 0 4px', color: t.textMuted }}>
        <GripVertical size={14} color={t.textMuted} strokeWidth={1.8} />
        <span style={{ fontSize: 11.5 }}>Drag to reorder</span>
      </div>

      {/* Edit / Delete actions */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        padding: '8px 14px 12px',
        borderTop: `1px solid ${t.rowDivider}`,
      }}>
        <button type="button" style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '6px 12px', borderRadius: 7,
          background: t.ctrlBg, border: `1px solid ${t.ctrlBorder}`,
          color: t.ctrlText, fontSize: 12.5, fontWeight: 500, cursor: 'default',
        }}>
          <Pencil size={13} strokeWidth={2} />
          Edit item
        </button>
        <button type="button" style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '6px 12px', borderRadius: 7,
          background: 'transparent', border: `1px solid rgba(192,66,60,0.25)`,
          color: '#C0423C', fontSize: 12.5, fontWeight: 500, cursor: 'default',
        }}>
          <Trash2 size={13} strokeWidth={2} />
          Delete
        </button>
      </div>
    </div>
  );
}

/** A category card (collapsed or expanded). */
function CategoryCard({
  cat, t, expanded, expandedItemName, onToggle, onExpandItem,
}: {
  cat: CategoryData;
  t: typeof LIGHT;
  expanded: boolean;
  expandedItemName: string | null;
  onToggle: () => void;
  onExpandItem: (name: string) => void;
}) {
  return (
    <div style={{
      background: t.surfaceBg,
      borderRadius: 12,
      border: `1px solid ${t.border}`,
      overflow: 'hidden',
      boxShadow: `0 1px 3px rgba(0,0,0,0.06), 0 0 0 0.5px ${t.border}`,
    }}>
      {/* Header row */}
      <div
        style={{
          display: 'flex', alignItems: 'stretch', minHeight: 60,
          cursor: 'pointer',
        }}
        onClick={onToggle}
      >
        {/* Wedge */}
        <CategoryWedge bg={cat.bg} Icon={cat.Icon} />

        {/* Content */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px 10px 12px', minWidth: 0,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: t.text, lineHeight: '1.2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {cat.name}
            </div>
            <div style={{ fontSize: 11.5, color: t.textMuted, marginTop: 3 }}>
              {cat.selectedCount}/{cat.itemCount} selected
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {cat.weight && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: t.weightColor }}>
                  {cat.weight}
                </div>
                <div style={{ fontSize: 11, color: t.textMuted, marginTop: 1 }}>
                  {cat.lbs}
                </div>
              </div>
            )}
            <div style={{ color: t.chevron }}>
              {expanded
                ? <ChevronUp size={18} strokeWidth={2} color={t.chevron} />
                : <ChevronDown size={18} strokeWidth={2} color={t.chevron} />
              }
            </div>
          </div>
        </div>
      </div>

      {/* Expanded items */}
      {expanded && cat.items && (
        <div>
          {cat.items.map(item => {
            const isExpanded = item.name === expandedItemName;
            return isExpanded ? (
              <ExpandedItemRow key={item.name} item={item} t={t} />
            ) : (
              <CollapsedItemRow
                key={item.name}
                item={item}
                t={t}
                onExpand={() => onExpandItem(isExpanded ? '' : item.name)}
              />
            );
          })}

          {/* Add item */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '11px 14px', gap: 6,
            borderTop: `1px solid ${t.rowDivider}`,
            color: t.textMuted, fontSize: 13, cursor: 'default',
          }}>
            <div style={{ fontSize: 17, lineHeight: 1, fontWeight: 300 }}>+</div>
            <span>Add item</span>
          </div>
        </div>
      )}
    </div>
  );
}

/** Segmented control (visual only). */
function SegmentedControl({
  options, active, t,
}: {
  options: string[];
  active: string;
  t: typeof LIGHT;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: t.ctrlBg, borderRadius: 8,
      padding: 3, gap: 2,
      border: `1px solid ${t.ctrlBorder}`,
    }}>
      {options.map(opt => (
        <div
          key={opt}
          style={{
            padding: '5px 10px', borderRadius: 6,
            fontSize: 12.5, fontWeight: opt === active ? 600 : 400,
            color: opt === active ? t.text : t.ctrlText,
            background: opt === active ? t.ctrlActive : 'transparent',
            boxShadow: opt === active ? '0 1px 2px rgba(0,0,0,0.10)' : 'none',
            cursor: 'default',
          }}
        >
          {opt}
        </div>
      ))}
    </div>
  );
}

/** Single icon+label toolbar button (visual only). */
function CtrlBtn({
  icon: Icon, label, t, danger = false,
}: {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  t: typeof LIGHT;
  danger?: boolean;
}) {
  const color = danger ? '#C0423C' : t.ctrlText;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      padding: '5px 8px', borderRadius: 8, cursor: 'default', minWidth: 44,
    }}>
      <Icon size={18} color={color} strokeWidth={1.9} />
      <span style={{ fontSize: 10, color, fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  );
}

/** Compact utility panel row. */
function UtilRow({
  icon: Icon, label, badge, t,
}: {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  badge?: number;
  t: typeof LIGHT;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '13px 16px', gap: 11,
      borderBottom: `1px solid ${t.border}`,
    }}>
      <Icon size={16} color={t.textMuted} strokeWidth={1.8} />
      <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: t.textSub }}>{label}</div>
      {badge !== undefined && (
        <div style={{
          background: '#2E4A38', color: '#fff', fontSize: 11, fontWeight: 600,
          borderRadius: 10, padding: '1px 7px', minWidth: 20, textAlign: 'center',
        }}>
          {badge}
        </div>
      )}
      <ChevronDown size={16} color={t.chevron} strokeWidth={1.8} />
    </div>
  );
}

// ── Main prototype component ──────────────────────────────────────────────────

export default function MobileDesignPrototype() {
  // ?dark=1 URL param lets automated screenshots capture dark mode
  const startDark = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('dark') === '1';
  const [isDark, setIsDark] = useState(startDark);
  const [units, setUnits] = useState<'Imperial' | 'Metric'>('Imperial');
  const [expandedCat, setExpandedCat] = useState<string | null>('Sleep System');
  const [expandedItem, setExpandedItem] = useState<string | null>('Earplugs');

  const t = isDark ? DARK : LIGHT;

  const toggleCat = (name: string) =>
    setExpandedCat(prev => (prev === name ? null : name));

  const toggleItem = (name: string) =>
    setExpandedItem(prev => (prev === name ? null : name));

  return (
    /* ── Outer shell (desktop centering / outer bg) ───────────────────────── */
    <div style={{
      minHeight: '100dvh',
      background: t.outerBg,
      display: 'flex',
      justifyContent: 'center',
    }}>
      {/* ── Phone viewport ─────────────────────────────────────────────────── */}
      <div style={{
        width: '100%',
        maxWidth: 430,
        minHeight: '100dvh',
        background: t.pageBg,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Plus Jakarta Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
        position: 'relative',
      }}>

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div style={{
          background: t.headerBg,
          borderBottom: `1px solid ${t.headerBorder}`,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          {/* Logo row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 16px 8px',
            height: 52,
          }}>
            {/* Left: menu + logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ padding: 4, color: t.textMuted }}>
                <Menu size={20} color={t.textMuted} strokeWidth={1.8} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                {/* TrailWeigh mountain logo (inline SVG — no external dep) */}
                <svg width="26" height="26" viewBox="0 0 48 48" fill="none">
                  <path d="M4 38 L16 18 L24 28 L32 14 L44 38 Z" fill="#3D6B52" opacity="0.9" />
                  <path d="M32 14 L28 22 L36 22 Z" fill="#F0EEE8" opacity="0.85" />
                  <path d="M16 18 L13.5 23 L18.5 23 Z" fill="#F0EEE8" opacity="0.70" />
                  <circle cx="24" cy="33" r="2.5" fill="#C8B89A" opacity="0.8" />
                </svg>
                <span style={{ fontSize: 17, fontWeight: 700, color: t.text, letterSpacing: '-0.3px' }}>
                  TrailWeigh
                </span>
              </div>
            </div>

            {/* Right: action icons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button type="button" style={{ padding: 7, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'default', color: t.textSub }}>
                <Save size={18} color={t.textSub} strokeWidth={1.8} />
              </button>
              <button type="button" style={{ padding: 7, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'default', color: t.textSub }}>
                <Share2 size={18} color={t.textSub} strokeWidth={1.8} />
              </button>
              {/* Light/Dark toggle */}
              <button
                type="button"
                onClick={() => setIsDark(d => !d)}
                style={{
                  padding: 7, borderRadius: 8,
                  background: t.ctrlBg,
                  border: `1px solid ${t.ctrlBorder}`,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {isDark
                  ? <Sun size={17} color={t.ctrlText} strokeWidth={2} />
                  : <Moon size={17} color={t.ctrlText} strokeWidth={2} />
                }
              </button>
            </div>
          </div>

          {/* List name row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 16px 10px',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>
                  JMT Weekend Kit
                </span>
                <ChevronDown size={15} color={t.textMuted} strokeWidth={2} />
              </div>
              <div style={{ fontSize: 11, color: t.textMuted, marginTop: 1, fontStyle: 'italic' }}>
                Unsaved changes
              </div>
            </div>
            {/* New list */}
            <button type="button" style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '5px 11px', borderRadius: 8,
              background: '#2E4A38', border: 'none', cursor: 'default',
              color: '#FFFFFF', fontSize: 12.5, fontWeight: 600,
            }}>
              <FilePlus size={14} color="#FFFFFF" strokeWidth={2} />
              New
            </button>
          </div>
        </div>

        {/* ── SCROLLABLE BODY ────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 32 }}>

          {/* ── SUMMARY CARD ────────────────────────────────────────────── */}
          <div style={{ padding: '14px 16px 0' }}>
            <div style={{
              background: t.summaryBg,
              borderRadius: 14,
              padding: '14px 16px 16px',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Subtle decorative arc */}
              <div style={{
                position: 'absolute', right: -20, top: -20,
                width: 120, height: 120, borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)',
                pointerEvents: 'none',
              }} />

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                {/* Icon */}
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: 'rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Scale size={22} color="rgba(255,255,255,0.90)" strokeWidth={1.8} />
                </div>

                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                    Base Weight
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: t.summaryText, lineHeight: 1.1, marginTop: 1, letterSpacing: '-0.5px' }}>
                    12 <span style={{ fontSize: 20, fontWeight: 600 }}>lb</span>{' '}
                    6 <span style={{ fontSize: 20, fontWeight: 600 }}>oz</span>
                  </div>
                </div>
              </div>

              {/* Badges row */}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <div style={{
                  background: t.summaryBadge, borderRadius: 8,
                  padding: '7px 12px', flex: 1,
                }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: t.summaryText }}>52</div>
                  <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.60)', marginTop: 1 }}>Total Items</div>
                </div>
                <div style={{
                  background: t.summaryBadge, borderRadius: 8,
                  padding: '7px 12px', flex: 1,
                }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: t.summaryText }}>2 lb 1 oz</div>
                  <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.60)', marginTop: 1 }}>Worn Weight</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── TOOLBAR / CONTROL BAR ────────────────────────────────────── */}
          <div style={{
            margin: '14px 16px 0',
            background: t.ctrlBg,
            borderRadius: 12,
            border: `1px solid ${t.ctrlBorder}`,
            overflow: 'hidden',
          }}>
            {/* ROW 1: History controls */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-around',
              padding: '8px 4px 6px',
              borderBottom: `1px solid ${t.ctrlBorder}`,
            }}>
              <CtrlBtn icon={FilePlus} label="New" t={t} />
              <CtrlBtn icon={Undo2} label="Undo" t={t} />
              <CtrlBtn icon={Redo2} label="Redo" t={t} />
              <CtrlBtn icon={Save} label="Save" t={t} />
              <CtrlBtn icon={RotateCcw} label="Reset" t={t} />
              <CtrlBtn icon={Share2} label="Share" t={t} />
            </div>

            {/* ROW 2: View controls */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 12px 8px',
              gap: 8,
            }}>
              {/* Open / Close */}
              <div style={{
                display: 'flex', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                borderRadius: 8, overflow: 'hidden',
              }}>
                <button type="button" style={{
                  padding: '6px 10px', border: 'none', background: 'transparent',
                  color: t.ctrlText, cursor: 'default', display: 'flex', alignItems: 'center',
                }}>
                  <ChevronDown size={16} color={t.ctrlText} strokeWidth={2} />
                </button>
                <button type="button" style={{
                  padding: '6px 10px', border: 'none', background: 'transparent',
                  color: t.ctrlText, cursor: 'default', display: 'flex', alignItems: 'center',
                  borderLeft: `1px solid ${t.ctrlBorder}`,
                }}>
                  <ChevronUp size={16} color={t.ctrlText} strokeWidth={2} />
                </button>
              </div>

              {/* Imperial/Metric */}
              <SegmentedControl
                options={['Imperial', 'Metric']}
                active={units}
                t={t}
              />

              {/* Checklist + Hide */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" style={{
                  padding: '6px 10px', borderRadius: 8,
                  background: 'transparent', border: `1px solid ${t.ctrlBorder}`,
                  color: t.ctrlText, fontSize: 12, fontWeight: 500, cursor: 'default',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <ClipboardList size={14} color={t.ctrlText} strokeWidth={1.9} />
                  List
                </button>
                <button type="button" style={{
                  padding: '6px 10px', borderRadius: 8,
                  background: 'transparent', border: `1px solid ${t.ctrlBorder}`,
                  color: t.ctrlText, fontSize: 12, fontWeight: 500, cursor: 'default',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <EyeOff size={14} color={t.ctrlText} strokeWidth={1.9} />
                  Hide
                </button>
              </div>
            </div>
          </div>

          {/* ── CATEGORY LIST ────────────────────────────────────────────── */}
          <div style={{ padding: '14px 16px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CATEGORIES.map((cat) => (
              <CategoryCard
                key={cat.name}
                cat={cat}
                t={t}
                expanded={expandedCat === cat.name}
                expandedItemName={expandedItem}
                onToggle={() => toggleCat(cat.name)}
                onExpandItem={toggleItem}
              />
            ))}

            {/* Add Category */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '14px 0', gap: 7,
              borderRadius: 12,
              border: `1.5px dashed ${t.borderMid}`,
              color: t.textMuted, fontSize: 13.5, fontWeight: 500,
              cursor: 'default',
            }}>
              <span style={{ fontSize: 20, lineHeight: 1, fontWeight: 300 }}>+</span>
              Add Category
            </div>
          </div>

          {/* ── UTILITY PANELS ───────────────────────────────────────────── */}
          <div style={{ margin: '20px 16px 0' }}>
            <div style={{
              fontSize: 10.5, fontWeight: 700, color: t.utilHeader,
              letterSpacing: '0.8px', textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              Utilities
            </div>
            <div style={{
              background: t.surfaceBg, borderRadius: 12,
              border: `1px solid ${t.border}`,
              overflow: 'hidden',
            }}>
              <UtilRow icon={AlignLeft} label="Pack Summary" t={t} />
              <UtilRow icon={BarChart2} label="Weight Distribution" t={t} />
              <UtilRow icon={ScanLine} label="Scan Gear List" t={t} />
              <div style={{
                display: 'flex', alignItems: 'center', padding: '13px 16px', gap: 11,
              }}>
                <Lock size={16} color={t.textMuted} strokeWidth={1.8} />
                <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: t.textSub }}>Locker</div>
                <div style={{
                  background: '#2E4A38', color: '#fff', fontSize: 11, fontWeight: 600,
                  borderRadius: 10, padding: '1px 7px',
                }}>1</div>
                <ChevronDown size={16} color={t.chevron} strokeWidth={1.8} />
              </div>
            </div>
          </div>

          {/* ── COMPACT FOOTER ───────────────────────────────────────────── */}
          <div style={{ margin: '24px 16px 0', paddingBottom: 8 }}>
            <div style={{
              borderTop: `1px solid ${t.border}`,
              paddingTop: 16,
            }}>
              <div style={{
                fontSize: 13, fontWeight: 700, color: t.footerText,
                marginBottom: 8,
              }}>
                TrailWeigh
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {['About', 'How It Works', 'Help', 'Privacy'].map(link => (
                  <span key={link} style={{ fontSize: 12, color: t.footerText, cursor: 'default' }}>
                    {link}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>{/* end scrollable body */}

        {/* ── PROTOTYPE BADGE ─────────────────────────────────────────────── */}
        <div style={{
          position: 'fixed',
          bottom: 16, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.72)',
          color: '#fff', fontSize: 11, fontWeight: 600,
          padding: '5px 12px', borderRadius: 20,
          letterSpacing: '0.4px',
          pointerEvents: 'none',
          zIndex: 100,
          backdropFilter: 'blur(8px)',
          whiteSpace: 'nowrap',
        }}>
          027A DESIGN PROTOTYPE — tap ☀/🌙 to toggle
        </div>

      </div>{/* end phone viewport */}
    </div>
  );
}
