import { useState, useEffect, useRef, useCallback } from 'react';

const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export interface BlockingConditions {
  isPreviewOpen: boolean;
  hasInputFocus: boolean;
  isDragging: boolean;
  isDialogOpen: boolean;
}

export interface InactivityTimerResult {
  showcaseActive: boolean;
  triggerShowcase: () => void;
  exitShowcase: () => void;
}

/**
 * Centralised inactivity manager for Background Showcase mode.
 *
 * Rules:
 * - One timer instance — no duplicate listeners.
 * - Activity events always reset the countdown.
 * - Timer fires → if any blocking flag is true, do NOT activate.
 * - When blocking clears → start a fresh 5-min countdown.
 * - Page Visibility API: pause on hidden, fresh timer on visible.
 * - exitShowcase: deactivate + restart countdown.
 * - triggerShowcase: immediately activate (manual pill).
 */
export function useInactivityTimer(
  blocking: BlockingConditions,
): InactivityTimerResult {
  const [showcaseActive, setShowcaseActive] = useState(false);

  const timerRef           = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blockingRef        = useRef(blocking);
  const showcaseActiveRef  = useRef(showcaseActive);
  blockingRef.current      = blocking;
  showcaseActiveRef.current = showcaseActive;

  // ── Helpers ──────────────────────────────────────────────────────────────

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startFreshTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      const b = blockingRef.current;
      const isBlocked =
        b.isPreviewOpen || b.hasInputFocus || b.isDragging || b.isDialogOpen;
      if (!isBlocked && !showcaseActiveRef.current) {
        setShowcaseActive(true);
      }
    }, TIMEOUT_MS);
  }, [clearTimer]);

  // ── Public API ────────────────────────────────────────────────────────────

  const exitShowcase = useCallback(() => {
    setShowcaseActive(false);
    startFreshTimer();
  }, [startFreshTimer]);

  const triggerShowcase = useCallback(() => {
    clearTimer();
    setShowcaseActive(true);
  }, [clearTimer]);

  // ── Mount: kick off initial timer ─────────────────────────────────────────

  useEffect(() => {
    startFreshTimer();
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Activity listeners ────────────────────────────────────────────────────

  useEffect(() => {
    const EVENTS = [
      'mousemove', 'click', 'keydown', 'scroll',
      'touchstart', 'dragstart', 'input', 'pointerdown',
    ] as const;
    const handler = () => {
      if (showcaseActiveRef.current) return; // showcase manages its own exit
      startFreshTimer();
    };
    EVENTS.forEach(e => window.addEventListener(e, handler, { passive: true }));
    return () => EVENTS.forEach(e => window.removeEventListener(e, handler));
  }, [startFreshTimer]);

  // ── Page Visibility API ───────────────────────────────────────────────────

  useEffect(() => {
    const handler = () => {
      if (document.hidden) {
        // Tab hidden: pause the countdown; stop showcase if somehow active
        clearTimer();
        if (showcaseActiveRef.current) setShowcaseActive(false);
      } else {
        // Tab visible: fresh countdown; never immediately enter showcase
        startFreshTimer();
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [clearTimer, startFreshTimer]);

  // ── Blocking condition changes ────────────────────────────────────────────

  const prevBlockedRef = useRef(
    blocking.isPreviewOpen || blocking.hasInputFocus ||
    blocking.isDragging    || blocking.isDialogOpen,
  );

  useEffect(() => {
    const isBlocked =
      blocking.isPreviewOpen || blocking.hasInputFocus ||
      blocking.isDragging    || blocking.isDialogOpen;

    const wasBlocked = prevBlockedRef.current;
    prevBlockedRef.current = isBlocked;

    if (isBlocked && !wasBlocked) {
      // Just became blocked: pause countdown
      clearTimer();
    } else if (!isBlocked && wasBlocked && !showcaseActive) {
      // Just unblocked: start fresh 5-min countdown
      startFreshTimer();
    }
  }, [
    blocking.isPreviewOpen, blocking.hasInputFocus,
    blocking.isDragging,    blocking.isDialogOpen,
    showcaseActive, clearTimer, startFreshTimer,
  ]);

  return { showcaseActive, triggerShowcase, exitShowcase };
}
