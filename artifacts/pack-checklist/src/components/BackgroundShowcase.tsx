/**
 * BackgroundShowcase — full-viewport overlay shown during Showcase mode.
 *
 * Behaviour:
 * - Fixed div covering the entire viewport (z-index 9990).
 * - Fades in/out via CSS opacity transition (800–1000 ms).
 * - Displays the selected background at cover/center with no darkening overlay.
 * - Renders the HikerAnimation silhouette near the viewport bottom.
 * - A transparent intercept div (z-index 9991) captures the FIRST click/tap
 *   and calls onWake without propagating — so the hidden control underneath
 *   is never activated.
 * - Mouse movement on the overlay calls onWake directly (no click interception).
 */
import React, { useEffect, useRef } from 'react';
import { HikerAnimation } from './HikerAnimation';

interface BackgroundShowcaseProps {
  active: boolean;
  bgImageUrl: string | null;
  onWake: () => void;
}

export function BackgroundShowcase({
  active,
  bgImageUrl,
  onWake,
}: BackgroundShowcaseProps) {
  // Check reduced-motion preference for transitions
  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  const transitionMs = prefersReducedMotion ? 0 : 1000;

  // Keep a ref so the mousemove handler is always fresh
  const onWakeRef = useRef(onWake);
  onWakeRef.current = onWake;

  // Keydown exits showcase (in addition to the window-level handler in the hook)
  useEffect(() => {
    if (!active) return;
    const handler = (e: KeyboardEvent) => {
      e.stopPropagation();
      onWakeRef.current();
    };
    window.addEventListener('keydown', handler, { capture: true });
    return () => window.removeEventListener('keydown', handler, { capture: true });
  }, [active]);

  // Scroll exits showcase
  useEffect(() => {
    if (!active) return;
    const handler = () => onWakeRef.current();
    window.addEventListener('scroll', handler, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', handler, { capture: true });
  }, [active]);

  return (
    <>
      {/* ── Showcase overlay ─────────────────────────────────────────────── */}
      <div
        style={{
          position:         'fixed',
          inset:            0,
          zIndex:           9990,
          // Background image (no darkening overlay — full clarity)
          backgroundImage:  bgImageUrl ? `url(${bgImageUrl})` : undefined,
          backgroundColor:  bgImageUrl ? undefined : '#0d1117',
          backgroundSize:   'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          // Fade
          opacity:          active ? 1 : 0,
          transition:       `opacity ${transitionMs}ms ease`,
          pointerEvents:    active ? 'auto' : 'none',
        }}
        // Pointer movement exits showcase without consuming the subsequent click
        onMouseMove={active ? () => onWakeRef.current() : undefined}
      >
        {/* Hiker + dog silhouette */}
        <HikerAnimation active={active} />
      </div>

      {/* ── Click / touch / mousemove intercept overlay ──────────────────── */}
      {/* Sits above the showcase visuals at z-9991 so it receives ALL pointer  */}
      {/* events before the overlay beneath does.                               */}
      {/*   • mousemove → wake (no propagation block; next click lands normally  */}
      {/*     if the interface has faded back in by then)                        */}
      {/*   • click / touchstart → wake AND stop propagation so the hidden app  */}
      {/*     control underneath is never accidentally triggered.                */}
      {active && (
        <div
          style={{
            position:      'fixed',
            inset:         0,
            zIndex:        9991,
            cursor:        'default',
            pointerEvents: 'auto',
          }}
          onMouseMove={() => onWakeRef.current()}
          onClick={e => {
            e.stopPropagation();
            e.preventDefault();
            onWakeRef.current();
          }}
          onTouchStart={e => {
            e.stopPropagation();
            e.preventDefault();
            onWakeRef.current();
          }}
        />
      )}
    </>
  );
}
