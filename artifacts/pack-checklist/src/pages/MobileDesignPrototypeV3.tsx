/**
 * MobileDesignPrototypeV3.tsx — 027F
 * Isolated visual prototype at /mobile-design-v3
 * Static LIGHT mode only — no real control wiring.
 * 027F: search circle button, mountain depth, category title bump,
 *       summary/wedge fine-tune, drag-to-reorder removed.
 *
 * Derived 390px measurements:
 *   app-bar height:       52px
 *   outer h-padding:      16px
 *   trip-identity height: ~50px
 *   summary-card height:  ~122px  radius: 16px
 *   category-card height: ~68px   radius: 14px
 *   wedge width:          72px    point:  17px
 *   category gap:         8px
 *   item-row height:      44px
 *   detail-row height:    42px
 *   bottom-nav height:    58px
 */
import React from 'react';
import {
  Menu, Search, Plus,
  ChevronDown, ChevronUp,
  Check, GripVertical,
  MoreHorizontal,
  Briefcase, Shirt, Droplets, Globe, Monitor, Pill, Footprints, Waves,
  Backpack, LayoutList, Box, Map,
  Hash, Luggage, PackageOpen, ArrowRightLeft,
} from 'lucide-react';

// ─── FONTS ─────────────────────────────────────────────────────────────────────
// Display serif — used for wordmark and category titles (no new dependency)
const SERIF  = "Georgia, 'Palatino Linotype', Palatino, 'Book Antiqua', ui-serif, serif";
// Body sans — used for all supporting text
const SANS   = "'Inter', system-ui, -apple-system, sans-serif";

// ─── TOKENS ────────────────────────────────────────────────────────────────────

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

// ─── CATEGORY DATA ─────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'luggage',    name: 'Luggage',           color: '#5B7FA6', Icon: Briefcase,  items: 3,  packed: 3,  open: false },
  { id: 'clothing',   name: 'Clothing',           color: '#C97841', Icon: Shirt,      items: 18, packed: 12, open: false },
  { id: 'toiletries', name: 'Toiletries',         color: '#3A9E8A', Icon: Droplets,   items: 8,  packed: 4,  open: true  },
  { id: 'documents',  name: 'Documents',           color: '#7B5BB0', Icon: Globe,      items: 6,  packed: 6,  open: false },
  { id: 'electronics',name: 'Electronics',         color: '#4068A0', Icon: Monitor,    items: 6,  packed: 5,  open: false },
  { id: 'medication', name: 'Medication',          color: '#C45050', Icon: Pill,       items: 3,  packed: 2,  open: false },
  { id: 'shoes',      name: 'Shoes',               color: '#C99535', Icon: Footprints, items: 3,  packed: 2,  open: false },
  { id: 'beach',      name: 'Beach / Activities',  color: '#2BADA4', Icon: Waves,      items: 1,  packed: 1,  open: false },
];

// ─── LOGO MARK ─────────────────────────────────────────────────────────────────

function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M4 38 L16 18 L24 28 L32 14 L44 38 Z" fill="#2A5740" opacity="0.9"/>
      <path d="M32 14 L28.5 22 L35.5 22 Z" fill="#FFFFFF" opacity="0.85"/>
      <path d="M16 18 L13.5 23 L18.5 23 Z" fill="#FFFFFF" opacity="0.70"/>
      <circle cx="24" cy="32" r="2.5" fill="#FFFFFF" opacity="0.6"/>
    </svg>
  );
}

// ─── LANDSCAPE DECORATION ──────────────────────────────────────────────────────
// 027E: Refined multi-layer mountain/forest SVG matching target more closely.
// 4 depth layers + snow highlights + organic pine row + left-side opacity fade.

function LandscapeDecoration() {
  return (
    <svg
      viewBox="0 0 500 110"
      preserveAspectRatio="xMaxYMax meet"
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0, right: 0,
        width: '78%',
        height: '110px',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <defs>
        {/* Left-to-right fade: transparent on left, opaque on right */}
        <linearGradient id="mtnFade" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="white" stopOpacity="1"/>
          <stop offset="35%"  stopColor="white" stopOpacity="0"/>
        </linearGradient>
        <mask id="leftFade">
          <rect width="500" height="110" fill="white"/>
          <rect width="500" height="110" fill="url(#mtnFade)"/>
        </mask>
      </defs>

      <g mask="url(#leftFade)">
        {/* Layer 1 — distant pale peaks (tallest, lightest) */}
        <path
          d="M0,110 L40,62 L80,78 L130,35 L175,58 L215,20 L255,48 L290,14 L335,42 L370,8 L410,34 L450,16 L490,28 L500,24 L500,110 Z"
          fill="#C4D6CA" opacity="0.50"/>

        {/* Snow caps on distant peaks — stronger */}
        <path d="M290,14 L283,30 L297,30 Z" fill="#E0EEEA" opacity="0.88"/>
        <path d="M370,8  L362,26 L378,26 Z" fill="#E0EEEA" opacity="0.90"/>
        <path d="M450,16 L444,30 L456,30 Z" fill="#E0EEEA" opacity="0.78"/>
        <path d="M215,20 L209,33 L221,33 Z" fill="#DAE8DD" opacity="0.72"/>
        <path d="M490,28 L486,38 L494,38 Z" fill="#DAE8DD" opacity="0.65"/>

        {/* Layer 2 — mid-ground ridge, shifted right + stronger */}
        <path
          d="M120,110 L190,48 L235,64 L278,30 L318,54 L355,26 L393,50 L428,22 L465,44 L490,20 L500,30 L500,110 Z"
          fill="#B5CCBA" opacity="0.56"/>

        {/* Layer 2b — secondary mid ridge for extra depth */}
        <path
          d="M220,110 L275,58 L308,72 L342,44 L375,62 L408,36 L440,56 L468,38 L490,50 L500,44 L500,110 Z"
          fill="#A8BFB0" opacity="0.48"/>

        {/* Layer 3 — nearer rolling ridge (lower, darker) */}
        <path
          d="M280,110 L320,68 L352,82 L382,56 L412,72 L440,46 L468,64 L490,50 L500,56 L500,110 Z"
          fill="#9CB2A4" opacity="0.60"/>

        {/* Layer 4 — forest treeline (pines, organic heights, denser right) */}
        {([
          [290,110,5,14],[299,110,6,18],[308,110,5,13],[317,110,7,20],
          [327,110,5,16],[336,110,6,22],[346,110,5,15],[355,110,7,19],
          [365,110,5,17],[374,110,6,23],[384,110,5,14],[393,110,7,21],
          [403,110,5,18],[412,110,6,24],[422,110,5,16],[431,110,7,20],
          [441,110,5,18],[450,110,6,22],[460,110,5,15],[469,110,7,21],
          [479,110,5,17],[488,110,6,23],[497,110,5,16],
        ] as [number,number,number,number][]).map(([x,y,w,h], i) => (
          <polygon key={i}
            points={`${x},${y} ${x-w},${y-h} ${x+w},${y-h}`}
            fill="#8BA898" opacity={0.44 + (i % 5) * 0.04}/>
        ))}
      </g>
    </svg>
  );
}

// ─── TRIP SUMMARY CARD ─────────────────────────────────────────────────────────

function TripSummaryCard() {
  return (
    <div style={{
      margin: '0 16px',
      borderRadius: 16,
      background: SUMMARY_BG,
      padding: '16px 16px 16px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      boxShadow: '0 2px 10px rgba(42,87,64,0.28)',
    }}>
      {/* Luggage icon box */}
      <div style={{
        width: 66,
        height: 66,
        borderRadius: 14,
        background: 'rgba(0,0,0,0.20)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Luggage size={34} color="rgba(255,255,255,0.90)" strokeWidth={1.4}/>
      </div>

      {/* Right content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Label */}
        <div style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '1.1px',
          color: 'rgba(255,255,255,0.52)',
          textTransform: 'uppercase',
          marginBottom: 3,
        }}>
          TRIP SUMMARY
        </div>
        {/* Count row */}
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 5,
          marginBottom: 9,
          lineHeight: 1,
        }}>
          <span style={{
            fontSize: 40,
            fontWeight: 800,
            color: SUMMARY_TEXT,
            letterSpacing: '-1.5px',
            lineHeight: 1,
          }}>48</span>
          <span style={{
            fontSize: 17,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.78)',
          }}>items</span>
        </div>
        {/* Status indicators */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {/* Packed */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 19,
              height: 19,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.18)',
              border: '1.5px solid rgba(255,255,255,0.50)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Check size={10} color="rgba(255,255,255,0.92)" strokeWidth={2.5}/>
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: SUMMARY_TEXT }}>31 Packed</span>
          </div>
          {/* Remaining */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 19,
              height: 19,
              borderRadius: 10,
              border: '1.5px solid rgba(255,255,255,0.38)',
              background: 'transparent',
            }}/>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.78)' }}>17 Remaining</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── WEDGE CATEGORY CARD ───────────────────────────────────────────────────────

const WEDGE_W     = 72;
const WEDGE_POINT = 17;
const CARD_H      = 68;

function CategoryHeader({
  cat,
  isOpen,
}: {
  cat: typeof CATEGORIES[0];
  isOpen: boolean;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'stretch',
      minHeight: CARD_H,
    }}>
      {/* Wedge */}
      <div style={{
        width: WEDGE_W,
        minHeight: CARD_H,
        background: cat.color,
        clipPath: `polygon(0 0, calc(100% - ${WEDGE_POINT}px) 0, 100% 50%, calc(100% - ${WEDGE_POINT}px) 100%, 0 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        paddingRight: WEDGE_POINT / 2,
      }}>
        <cat.Icon size={26} color="rgba(255,255,255,0.93)" strokeWidth={1.5}/>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        padding: '10px 12px 10px 12px',
        minWidth: 0,
        gap: 6,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 17,
            fontWeight: 500,
            color: PRIMARY,
            lineHeight: 1.2,
            marginBottom: 2,
            letterSpacing: '-0.1px',
            fontFamily: SERIF,
          }}>
            {cat.name}
          </div>
          <div style={{ fontSize: 12.5, color: MUTED }}>
            {cat.items} {cat.items === 1 ? 'item' : 'items'} • {cat.packed} packed
          </div>
        </div>
        {isOpen
          ? <ChevronUp size={18} color={MUTED} strokeWidth={2}/>
          : <ChevronDown size={18} color={MUTED} strokeWidth={2}/>}
      </div>
    </div>
  );
}

// ─── ITEM ROW ──────────────────────────────────────────────────────────────────

interface ItemData {
  name: string;
  checked: boolean;
  qty: number;
  expanded?: boolean;
}

function ItemRow({ item, isLast }: { item: ItemData; isLast?: boolean }) {
  return (
    <div>
      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        height: 44,
        gap: 10,
        borderBottom: isLast && !item.expanded ? 'none' : `1px solid ${DIVIDER}`,
        background: CARD_BG,
      }}>
        {/* Checkbox */}
        <div style={{
          width: 20,
          height: 20,
          borderRadius: 5,
          border: `1.5px solid ${item.checked ? CB_CHECKED : CB_UNCHECKED}`,
          background: item.checked ? CB_CHECKED : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {item.checked && <Check size={11} color="#fff" strokeWidth={2.5}/>}
        </div>

        {/* Name */}
        <div style={{
          flex: 1,
          fontSize: 14.5,
          fontWeight: 450,
          color: PRIMARY,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {item.name}
        </div>

        {/* Qty */}
        <span style={{
          fontSize: 14,
          color: SECONDARY,
          marginRight: 8,
        }}>{item.qty}</span>

        {/* Grip / Chevron */}
        {item.expanded
          ? <ChevronUp size={16} color={MUTED} strokeWidth={2}/>
          : <GripVertical size={16} color={MUTED} strokeWidth={1.8}/>}
      </div>

      {/* Expanded detail section */}
      {item.expanded && (
        <div style={{
          background: DETAIL_BG,
          borderBottom: isLast ? 'none' : `1px solid ${DIVIDER}`,
        }}>
          {[
            { Icon: Hash,          label: 'Quantity',       value: '1',           dropdown: false },
            { Icon: PackageOpen,   label: 'Bag / Location', value: 'Carry-On',    dropdown: true  },
            { Icon: Check,         label: 'Packed',         value: 'No',          dropdown: false },
            { Icon: ArrowRightLeft,label: 'Move',           value: 'Toiletry Bag',dropdown: true  },
          ].map(({ Icon, label, value, dropdown }, i, arr) => (
            <div key={label} style={{
              display: 'flex',
              alignItems: 'center',
              padding: '0 14px',
              height: 42,
              gap: 10,
              borderBottom: i < arr.length - 1 ? `1px solid ${DETAIL_BDR}` : 'none',
            }}>
              <Icon size={14} color={MUTED} strokeWidth={1.8}/>
              <div style={{ flex: 1, fontSize: 13.5, color: SECONDARY }}>{label}</div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 13.5,
                fontWeight: 500,
                color: PRIMARY,
              }}>
                {value}
                {dropdown && <ChevronDown size={13} color={MUTED} strokeWidth={2}/>}
              </div>
            </div>
          ))}
          {/* Drag to reorder — removed per 027F user decision */}
        </div>
      )}
    </div>
  );
}

// ─── TOILETRIES OPEN CATEGORY ──────────────────────────────────────────────────

const TOILETRIES_ITEMS: ItemData[] = [
  { name: 'Toothbrush',         checked: true,  qty: 1, expanded: false },
  { name: 'Travel Toothpaste',  checked: false, qty: 1, expanded: false },
  { name: 'Sunscreen SPF 50',   checked: false, qty: 1, expanded: true  },
];

// ─── BOTTOM NAV ────────────────────────────────────────────────────────────────

function BottomNav() {
  const tabs = [
    { Icon: Backpack,        label: 'Pack List', active: true  },
    { Icon: LayoutList,      label: 'Summary',   active: false },
    { Icon: Box,             label: 'Gear',      active: false },
    { Icon: Map,             label: 'Trips',     active: false },
    { Icon: MoreHorizontal,  label: 'More',      active: false },
  ];

  return (
    <div style={{
      position: 'sticky',
      bottom: 0,
      left: 0,
      right: 0,
      background: NAV_BG,
      borderTop: `1px solid rgba(0,0,0,0.08)`,
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingTop: 8,
      paddingBottom: 10,
      zIndex: 20,
      height: 58,
      boxSizing: 'border-box',
    }}>
      {tabs.map(({ Icon, label, active }) => (
        <div key={label} style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          minWidth: 52,
          cursor: 'pointer',
        }}>
          <Icon
            size={22}
            color={active ? NAV_ACTIVE : NAV_INACTIVE}
            strokeWidth={active ? 2 : 1.6}
          />
          <span style={{
            fontSize: 10,
            fontWeight: active ? 600 : 400,
            color: active ? NAV_ACTIVE : NAV_INACTIVE,
            letterSpacing: active ? '0.1px' : 0,
          }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────

export default function MobileDesignPrototypeV3() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: '#DDD8CF',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 430,
        height: '100dvh',
        background: PAGE_BG,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        overflow: 'hidden',
        position: 'relative',
      }}>

        {/* ── APP BAR ── */}
        <div style={{
          height: 52,
          background: HEADER_BG,
          borderBottom: `1px solid ${HEADER_BDR}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 10,
          flexShrink: 0,
          zIndex: 10,
        }}>
          {/* Hamburger */}
          <Menu
            size={22}
            color={SECONDARY}
            strokeWidth={1.8}
            style={{ cursor: 'pointer', flexShrink: 0 }}
          />

          {/* Logo + wordmark */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flex: 1,
          }}>
            <LogoMark size={24}/>
            <span style={{
              fontSize: 19,
              fontWeight: 600,
              color: PRIMARY,
              letterSpacing: '0.1px',
              fontFamily: SERIF,
            }}>
              TrailWeigh
            </span>
          </div>

          {/* Search + FAB */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Search — white circle button matching + button size */}
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              background: '#FFFFFF',
              boxShadow: '0 1px 4px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.04)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}>
              <Search size={17} color={SECONDARY} strokeWidth={1.8}/>
            </div>
            {/* FAB */}
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              background: NAV_ACTIVE,
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

        {/* ── SCROLLABLE CONTENT ── */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}>

          {/* ── TRIP IDENTITY with landscape decoration ── */}
          <div style={{
            position: 'relative',
            padding: '11px 16px 10px',
            overflow: 'hidden',
          }}>
            {/* Mountain decoration behind the text */}
            <LandscapeDecoration/>

            {/* Trip name + date */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                marginBottom: 3,
              }}>
                <span style={{
                  fontSize: 16.5,
                  fontWeight: 500,
                  color: PRIMARY,
                  letterSpacing: '0px',
                }}>
                  Italy Adventure Trip
                </span>
                <ChevronDown size={16} color={SECONDARY} strokeWidth={2}/>
              </div>
              <div style={{ fontSize: 12.5, color: MUTED }}>
                May 24 – Jun 6, 2025
              </div>
            </div>
          </div>

          {/* ── TRIP SUMMARY CARD ── */}
          <div style={{ paddingBottom: 12 }}>
            <TripSummaryCard/>
          </div>

          {/* ── CATEGORY STACK ── */}
          <div style={{
            padding: '4px 16px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            {CATEGORIES.map((cat) => {
              if (cat.open) {
                // Toiletries — statically open with items
                return (
                  <div key={cat.id} style={{
                    borderRadius: 14,
                    overflow: 'hidden',
                    background: CARD_BG,
                    border: `1px solid ${CARD_BORDER}`,
                    boxShadow: CARD_SHADOW,
                  }}>
                    <CategoryHeader cat={cat} isOpen={true}/>
                    <div style={{ borderTop: `1px solid ${DIVIDER}` }}>
                      {TOILETRIES_ITEMS.map((item, i) => (
                        <ItemRow
                          key={item.name}
                          item={item}
                          isLast={i === TOILETRIES_ITEMS.length - 1}
                        />
                      ))}
                    </div>
                  </div>
                );
              }

              // Collapsed categories
              return (
                <div key={cat.id} style={{
                  borderRadius: 14,
                  overflow: 'hidden',
                  background: CARD_BG,
                  border: `1px solid ${CARD_BORDER}`,
                  boxShadow: CARD_SHADOW,
                }}>
                  <CategoryHeader cat={cat} isOpen={false}/>
                </div>
              );
            })}
          </div>

        </div>{/* end scrollable */}

        {/* ── BOTTOM NAV ── */}
        <BottomNav/>

      </div>
    </div>
  );
}
