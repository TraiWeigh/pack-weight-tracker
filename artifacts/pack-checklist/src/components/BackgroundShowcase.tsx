/**
 * BackgroundShowcase — full-viewport overlay shown during Showcase mode.
 *
 * Layer order (bottom → top):
 *   9990  Background image (+ letterbox fill behind it)
 *   9991  Wake-event intercept (transparent; captures first click/touch/mousemove)
 *
 * Behaviour:
 * - Background fades in/out via opacity (1000 ms, 0 ms for reduced-motion).
 * - The intercept captures the first click/touchstart (stopPropagation) so
 *   hidden app controls beneath are never accidentally triggered.
 * - Mouse movement on the intercept calls onWake without consuming the event.
 *
 * Letterbox colour (Fit Image / contain mode):
 * - The caller (ChecklistContent) computes the resolved theme colour and
 *   passes it as `letterboxColor`.  This avoids any CSS-variable cascade
 *   ambiguity: because BackgroundShowcase sits OUTSIDE the .screen-dark div,
 *   `var(--background)` resolves from :root (always light).  An explicit
 *   colour string sidesteps that entirely.
 * - The same letterboxColor value is used on both the full-viewport wrapper
 *   and the image layer, so every pixel behind the contained image matches
 *   the normal screen's unused-space colour exactly.
 */
import React, { useEffect, useRef } from 'react';

interface BackgroundShowcaseProps {
  active: boolean;
  bgImageUrl: string | null;
  onWake: () => void;
  /** 'cover' = Fill Screen (default); 'contain' = Fit Image */
  bgSize?: 'cover' | 'contain';
  /**
   * Resolved letterbox colour for Fit Image mode.
   * Must be a valid CSS colour string (e.g. 'hsl(220, 20%, 8%)').
   * Passed by the caller so Showcase never has to read a CSS variable
   * from the wrong cascade scope.
   */
  letterboxColor?: string;
}

export function BackgroundShowcase({
  active,
  bgImageUrl,
  onWake,
  bgSize = 'cover',
  letterboxColor = 'hsl(40, 20%, 97%)',
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
      {/*
       * ── Layer 1 (z-9990): Background image ──────────────────────────────
       *
       * backgroundColor is always the explicit resolved letterboxColor —
       * an HSL string computed in JS by the caller.  This guarantees the
       * unused-space fill matches the normal screen regardless of where in
       * the DOM this element is positioned, which CSS class scope it inherits,
       * or whether the Fullscreen API adds its own backdrop.
       *
       * In Fill Screen (cover) mode the image fills the viewport entirely so
       * backgroundColor is not visible; we still set it for the edge case
       * where the image hasn't loaded yet.
       */}
      <div
        style={{
          position:           'fixed',
          inset:              0,
          zIndex:             9990,
          backgroundColor:    letterboxColor,
          backgroundImage:    bgImageUrl ? `url(${bgImageUrl})` : undefined,
          backgroundSize:     bgSize,
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
