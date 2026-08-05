/**
 * BackgroundShowcase — full-viewport overlay shown during Showcase mode.
 *
 * Layer order (bottom → top):
 *   9990  Background image
 *   9991  Wake-event intercept (transparent; captures first click/touch/mousemove)
 *
 * Behaviour:
 * - Background fades in/out via opacity (1000 ms, 0 ms for reduced-motion).
 * - The intercept captures the first click/touchstart (stopPropagation) so
 *   hidden app controls beneath are never accidentally triggered.
 * - Mouse movement on the intercept calls onWake without consuming the event.
 */
import React, { useEffect, useRef } from 'react';

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
  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  const transitionMs = prefersReducedMotion ? 0 : 1000;

  // Always-fresh ref so event handlers never capture a stale onWake
  const onWakeRef = useRef(onWake);
  onWakeRef.current = onWake;

  // Keydown exits showcase
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
      {/* ── Layer 1 (z-9990): Background image ───────────────────────────── */}
      <div
        style={{
          position:           'fixed',
          inset:              0,
          zIndex:             9990,
          backgroundImage:    bgImageUrl ? `url(${bgImageUrl})` : undefined,
          backgroundColor:    bgImageUrl ? undefined : '#0d1117',
          backgroundSize:     'cover',
          backgroundPosition: 'center',
          backgroundRepeat:   'no-repeat',
          opacity:            active ? 1 : 0,
          transition:         `opacity ${transitionMs}ms ease`,
          pointerEvents:      'none',
        }}
      />

      {/* ── Layer 2 (z-9991): Wake-event intercept ───────────────────────── */}
      {/* Transparent; captures the first click/touchstart so hidden app      */}
      {/* controls beneath are never accidentally triggered on wake.           */}
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
