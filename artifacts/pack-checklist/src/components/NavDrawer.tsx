/**
 * NavDrawer.tsx — R0082
 * Half-screen slide-in navigation drawer for /mobile-functional-v3.
 *
 * Design contract:
 *  - Panel slides from LEFT  for right-handed mode (default)
 *  - Panel slides from RIGHT for left-handed mode
 *  - Width ≈ 55 % of shell, max 240 px, min 160 px
 *  - Open: 200 ms cubic-bezier, Close: 180 ms cubic-bezier
 *  - Backdrop: rgba(0,0,0,0.40) — slightly dims the underlying screen
 *  - Z-index: backdrop 45, panel 46 — above bottom-nav (40), below overlays (50+)
 *  - Swipe panel toward its edge → close; vertical scroll is native (touch-action: pan-y)
 *  - 5 nav rows, min-height 44 px each
 *  - Handedness toggle in the panel footer
 *
 * State philosophy:
 *  - Always rendered (open/close via CSS transform); list state is never disturbed.
 *  - No React.memo — this component is cheap and renders infrequently.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Home, BookOpen, Folder, HelpCircle, Settings,
} from 'lucide-react';

// ── Design tokens ──────────────────────────────────────────────────────────
// R0082P1: white panel with dark green/charcoal text for readability
const PANEL_BG      = '#FFFFFF';
const PANEL_BDR     = 'rgba(0,0,0,0.10)';
const ROW_TEXT      = '#1D3828';                  // TrailWeigh dark green
const ROW_ICON      = '#2A5740';                  // brand green
const ROW_MUTED     = 'rgba(0,0,0,0.35)';         // muted for disabled + sublabels
const ROW_HOVER_BG  = 'rgba(0,0,0,0.04)';
const BACKDROP_CLR  = 'rgba(0,0,0,0.40)';
const BRAND_GREEN   = '#2A5740';
const SANS          = "'Inter Variable', 'Inter', system-ui, -apple-system, sans-serif";

const OPEN_MS  = 200;
const CLOSE_MS = 180;

// Gesture thresholds
const AXIS_LOCK_PX  = 6;   // minimum movement before direction is committed
const CLOSE_COMMIT_PX = 50; // horizontal distance needed to commit close

// ── Types ──────────────────────────────────────────────────────────────────
export type Handedness = 'right' | 'left';

export interface NavDrawerProps {
  open:                 boolean;
  handedness:           Handedness;
  onClose:              () => void;
  onHome:               () => void;
  onMyLists:            () => void;
  onHelp:               () => void;
  onSettings:           () => void;
  onToggleHandedness:   () => void;
}

// ── Nav row definition ─────────────────────────────────────────────────────
interface NavRow {
  id:       string;
  Icon:     React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  label:    string;
  sublabel: string | null;
  disabled: boolean;
  onClick:  (() => void) | null;
}

// ── Component ──────────────────────────────────────────────────────────────
export function NavDrawer({
  open,
  handedness,
  onClose,
  onHome,
  onMyLists,
  onHelp,
  onSettings,
  onToggleHandedness,
}: NavDrawerProps) {

  const fromLeft = true; // R0083P2: always slide from the left regardless of handedness

  // ── Swipe-to-close gesture state ─────────────────────────────────────────
  //  ptrRef tracks the active pointer (null = no drag in progress).
  //  dragX is the current horizontal offset applied to the panel transform
  //  during a drag; it snaps to 0 when the gesture ends.
  const ptrRef = useRef<{
    id:         number;
    startX:     number;
    startY:     number;
    axisLocked: 'horiz' | 'vert' | null;
  } | null>(null);
  const [dragX, setDragX] = useState(0);

  // Reset drag offset whenever the drawer closes (e.g., backdrop tap, nav action).
  useEffect(() => {
    if (!open) setDragX(0);
  }, [open]);

  // ── Window-level gesture listeners ───────────────────────────────────────
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const ptr = ptrRef.current;
      if (!ptr || ptr.id !== e.pointerId) return;

      const dx = e.clientX - ptr.startX;
      const dy = e.clientY - ptr.startY;

      // Commit to horizontal or vertical axis once movement is unambiguous.
      if (ptr.axisLocked === null) {
        if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;
        if (Math.abs(dy) > Math.abs(dx)) {
          // Vertical — surrender to native scroll; cancel gesture tracking.
          ptrRef.current = null;
          setDragX(0);
          return;
        }
        ptr.axisLocked = 'horiz';
      }

      // Only track movement in the closing direction; clamp the other direction at 0.
      const raw = fromLeft ? Math.min(0, dx) : Math.max(0, dx);
      setDragX(raw);
    };

    const onUp = (e: PointerEvent) => {
      const ptr = ptrRef.current;
      if (!ptr || ptr.id !== e.pointerId) return;
      ptrRef.current = null;

      const dx = e.clientX - ptr.startX;
      const shouldClose = fromLeft ? (dx < -CLOSE_COMMIT_PX) : (dx > CLOSE_COMMIT_PX);
      if (shouldClose && open) onClose();
      setDragX(0);
    };

    const onCancel = (e: PointerEvent) => {
      const ptr = ptrRef.current;
      if (!ptr || ptr.id !== e.pointerId) return;
      ptrRef.current = null;
      setDragX(0);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup',   onUp);
    window.addEventListener('pointercancel', onCancel);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup',   onUp);
      window.removeEventListener('pointercancel', onCancel);
    };
  }, [fromLeft, open, onClose]);

  // ── Panel pointer-down handler (starts gesture tracking) ─────────────────
  const handlePanelPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    ptrRef.current = {
      id:         e.pointerId,
      startX:     e.clientX,
      startY:     e.clientY,
      axisLocked: null,
    };
  }, []);

  // ── Computed styles ───────────────────────────────────────────────────────
  const isDragging = ptrRef.current !== null; // read ref synchronously during render
  const closedTranslate = fromLeft ? '-100%' : '100%';
  const panelTranslate  = open
    ? (dragX !== 0 ? `${dragX}px` : '0px')
    : closedTranslate;
  const transition = isDragging
    ? 'none'
    : `transform ${open ? OPEN_MS : CLOSE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;

  // ── Nav rows ──────────────────────────────────────────────────────────────
  const rows: NavRow[] = [
    { id: 'home',    Icon: Home,       label: 'Home',              sublabel: null,          disabled: false, onClick: onHome    },
    { id: 'library', Icon: BookOpen,   label: 'Master Library',    sublabel: 'Coming soon', disabled: true,  onClick: null      },
    { id: 'my-lists',Icon: Folder,     label: 'My Lists',          sublabel: null,          disabled: false, onClick: onMyLists },
    { id: 'help',    Icon: HelpCircle, label: 'Help & Tutorials',  sublabel: null,          disabled: false, onClick: onHelp    },
    { id: 'settings',Icon: Settings,   label: 'Settings',          sublabel: null,          disabled: false, onClick: onSettings},
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── BACKDROP ─────────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        data-testid="nav-drawer-backdrop"
        style={{
          position:    'absolute',
          inset:       0,
          zIndex:      45,
          background:  BACKDROP_CLR,
          opacity:     open ? 1 : 0,
          transition:  `opacity ${open ? OPEN_MS : CLOSE_MS}ms ease`,
          pointerEvents: open ? 'auto' : 'none',
          touchAction: 'none',
        }}
        onClick={onClose}
      />

      {/* ── PANEL ────────────────────────────────────────────────────────── */}
      <nav
        aria-label="Navigation menu"
        data-testid="nav-drawer"
        data-open={open ? 'true' : 'false'}
        aria-hidden={open ? undefined : 'true'}
        onPointerDown={handlePanelPointerDown}
        style={{
          position:    'absolute',
          top:         0,
          bottom:      0,
          ...(fromLeft ? { left: 0 } : { right: 0 }),
          width:       '55%',
          maxWidth:    240,
          minWidth:    160,
          background:  PANEL_BG,
          zIndex:      46,
          display:     'flex',
          flexDirection: 'column',
          transform:   `translateX(${panelTranslate})`,
          transition,
          touchAction: 'pan-y',
          overflowY:   'auto',
          overflowX:   'hidden',
        }}
      >
        {/* Panel header — 52 px, matches the APP BAR height */}
        <div style={{
          height:       52,
          flexShrink:   0,
          display:      'flex',
          alignItems:   'center',
          padding:      '0 18px',
          borderBottom: `1px solid ${PANEL_BDR}`,
        }}>
          <span style={{
            fontSize:   18,
            fontWeight: 700,
            color:      ROW_TEXT,
            fontFamily: SANS,
            letterSpacing: '0.1px',
          }}>
            TrailWeigh
          </span>
        </div>

        {/* ── 5 Navigation rows ──────────────────────────────────────────── */}
        <div
          role="list"
          style={{ flex: 1, paddingTop: 6, paddingBottom: 6, overflowY: 'auto' }}
        >
          {rows.map(({ id, Icon, label, sublabel, disabled, onClick }) => (
            <div role="listitem" key={id}>
              <button
                data-testid={`drawer-nav-${id}`}
                disabled={disabled}
                onClick={disabled || !onClick ? undefined : onClick}
                aria-label={disabled ? `${label} — not yet available` : label}
                aria-disabled={disabled ? 'true' : undefined}
                style={{
                  display:    'flex',
                  alignItems: 'center',
                  width:      '100%',
                  minHeight:  44,
                  padding:    '11px 18px',
                  gap:        14,
                  background: 'none',
                  border:     'none',
                  cursor:     disabled ? 'default' : 'pointer',
                  color:      disabled ? ROW_MUTED : ROW_TEXT,
                  textAlign:  'left',
                  boxSizing:  'border-box',
                  fontFamily: SANS,
                }}
              >
                <Icon
                  size={20}
                  color={disabled ? ROW_MUTED : ROW_ICON}
                  strokeWidth={1.8}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize:   15,
                    fontWeight: 500,
                    lineHeight: 1.25,
                    color:      disabled ? ROW_MUTED : ROW_TEXT,
                    opacity:    disabled ? 0.55 : 1,
                  }}>
                    {label}
                  </div>
                  {sublabel && (
                    <div style={{
                      fontSize:   11,
                      color:      ROW_MUTED,
                      marginTop:  2,
                      lineHeight: 1.2,
                    }}>
                      {sublabel}
                    </div>
                  )}
                </div>
              </button>
            </div>
          ))}
        </div>

        {/* ── Panel footer — handedness toggle ───────────────────────────── */}
        <div style={{
          flexShrink:  0,
          borderTop:   `1px solid ${PANEL_BDR}`,
          padding:     '4px 0',
        }}>
          <button
            data-testid="drawer-handedness-toggle"
            onClick={onToggleHandedness}
            aria-label={handedness === 'left'
              ? 'Switch to right-handed layout — menu on the left'
              : 'Switch to left-handed layout — menu on the right'}
            style={{
              display:    'flex',
              alignItems: 'center',
              width:      '100%',
              minHeight:  44,
              padding:    '10px 18px',
              gap:        12,
              background: 'none',
              border:     'none',
              cursor:     'pointer',
              textAlign:  'left',
              boxSizing:  'border-box',
              fontFamily: SANS,
            }}
          >
            {/* Visual indicator — coloured dot on the active side */}
            <div style={{
              width:        22,
              height:       22,
              borderRadius: '50%',
              border:       `2px solid rgba(0,0,0,0.18)`,
              background:   '#F0F4F1',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              flexShrink:   0,
              position:     'relative',
            }}>
              <div style={{
                width:        8,
                height:       8,
                borderRadius: '50%',
                background:   BRAND_GREEN,
                position:     'absolute',
                // Dot on the left for right-handed (drawer from left), right for left-handed
                left:         handedness === 'right' ? 1 : undefined,
                right:        handedness === 'left'  ? 1 : undefined,
              }} />
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: ROW_MUTED }}>
                {handedness === 'right' ? 'Right-handed' : 'Left-handed'}
              </div>
              <div style={{ fontSize: 11, color: ROW_MUTED, opacity: 0.7, marginTop: 1 }}>
                Tap to flip menu side
              </div>
            </div>
          </button>
        </div>
      </nav>
    </>
  );
}
