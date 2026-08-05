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
 *
 * Theme-aware unused-space colour (Fit Image / contain mode):
 * - The showcase div receives the same .screen-dark class as the normal screen
 *   when bgTone === 'dark'.  This means var(--background) resolves from the
 *   showcase div's own CSS variable scope, not from :root, giving an exact
 *   match with the normal screen's unused-space colour in all modes.
 * - The normal screen applies .screen-dark to its wrapper div; the showcase
 *   applies it to its own fixed-position div.  Both read the same --background
 *   value, so they always match.
 */
import React, { useEffect, useRef } from 'react';

interface BackgroundShowcaseProps {
  active: boolean;
  bgImageUrl: string | null;
  onWake: () => void;
  /** 'cover' = Fill Screen (default); 'contain' = Fit Image with theme-aware unused-space fill */
  bgSize?: 'cover' | 'contain';
  /**
   * Light or dark tone — passed from ChecklistContent so the showcase div can
   * apply the same .screen-dark class as the normal screen, ensuring
   * var(--background) resolves to the correct theme value in both contexts.
   */
  bgTone?: 'light' | 'dark';
}

export function BackgroundShowcase({
  active,
  bgImageUrl,
  onWake,
  bgSize = 'cover',
  bgTone = 'light',
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
       * The .screen-dark class is applied when bgTone === 'dark'.  This
       * overrides --background to the dark value (hsl 220 20% 8%) within
       * THIS div's CSS scope, so var(--background) resolves correctly even
       * though this element sits outside the normal screen's .screen-dark div.
       *
       * In Fill Screen (cover) mode the image fills the viewport entirely so
       * backgroundColor is irrelevant; we still apply .screen-dark for
       * consistency but it has no visible effect.
       */}
      <div
        className={bgTone === 'dark' ? 'screen-dark' : ''}
        style={{
          position:           'fixed',
          inset:              0,
          zIndex:             9990,
          backgroundImage:    bgImageUrl ? `url(${bgImageUrl})` : undefined,
          // In Fit Image (contain) mode, unused space uses var(--background)
          // from THIS div's scope — which is dark when .screen-dark is applied.
          backgroundColor:    bgSize === 'contain'
            ? 'var(--background)'
            : (bgImageUrl ? undefined : 'var(--background)'),
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
