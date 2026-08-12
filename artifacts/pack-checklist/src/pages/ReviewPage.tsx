/**
 * ReviewPage — Public Review Sandbox (025L)
 *
 * Thin loader for /s/:id routes. Fetches the share seed from /api/links/:id,
 * pre-populates a token-scoped localStorage namespace on first visit, then
 * renders the full ChecklistContent in review mode (isGuest + reviewToken).
 *
 * Reviewer sandbox keys: trailweigh:review:${token}:pack (gear data)
 *                         trailweigh:review:${token}:locker (local files)
 *                         trailweigh:review:${token}:welcomed (first-visit flag)
 *
 * Owner data is never touched — separate key namespace + no userId means all
 * server Locker API calls in ChecklistContent are skipped (already gated on userId).
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { UnitProvider } from '../context/UnitContext';
import { ChecklistContent } from './Checklist';

// ── Review-namespace key helpers ───────────────────────────────────────────────

function reviewWelcomedKey(token: string) { return `trailweigh:review:${token}:welcomed`; }
function reviewPackKey(token: string)     { return `trailweigh:review:${token}:pack`; }

// ── ReviewPage ─────────────────────────────────────────────────────────────────

export default function ReviewPage() {
  const params = useParams<{ id: string }>();
  const reviewToken = params.id ?? '';

  const [status, setStatus]       = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg]   = useState('');
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (!reviewToken) {
      setErrorMsg('No share ID in URL.');
      setStatus('error');
      return;
    }

    const packKey     = reviewPackKey(reviewToken);
    const hasData     = !!localStorage.getItem(packKey);
    const hasWelcomed = !!localStorage.getItem(reviewWelcomedKey(reviewToken));

    fetch(`/api/links/${reviewToken}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(({ payload }) => {
        if (!payload) throw new Error('Empty payload');

        // Seed the review namespace on the first visit to this link.
        // Returning reviewers keep their own edits — we only seed once.
        if (!hasData) {
          try {
            const data          = payload.data          ?? {};
            const categoryOrder = Array.isArray(payload.categoryOrder) ? payload.categoryOrder : [];
            const categoryMeta  = payload.categoryMeta  ?? {};
            const seedRecord = { __v: 5, items: data, order: categoryOrder, meta: categoryMeta };
            localStorage.setItem(packKey, JSON.stringify(seedRecord));
          } catch (e) {
            // Quota error or private-mode restriction — continue without seeding;
            // reviewer will get an empty list they can populate manually.
            console.warn('[TrailWeigh] ReviewPage: could not seed review storage:', e);
          }
        }

        // Show welcome modal on first-ever visit to this review link.
        if (!hasWelcomed) setShowWelcome(true);

        setStatus('ready');
      })
      .catch(err => {
        console.error('[TrailWeigh] ReviewPage: failed to load shared list:', err);
        setErrorMsg('This shared pack list could not be loaded.');
        setStatus('error');
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewToken]);

  const dismissWelcome = () => {
    try { localStorage.setItem(reviewWelcomedKey(reviewToken), '1'); } catch { /* ignore */ }
    setShowWelcome(false);
  };

  // ── Loading state ──────────────────────────────────────────────────────────

  if (status === 'loading') {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading shared list…
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────

  if (status === 'error') {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
        <div className="text-center space-y-3">
          <p className="text-2xl">🏕️</p>
          <p className="font-semibold text-foreground">Link not found</p>
          <p className="text-sm text-muted-foreground max-w-xs">{errorMsg}</p>
          <a
            href="/"
            className="inline-block text-sm text-primary underline underline-offset-4 mt-2"
          >
            Go to TrailWeigh
          </a>
        </div>
      </div>
    );
  }

  // ── Ready — render the full TrailWeigh UI in review/sandbox mode ───────────

  return (
    <>
      <UnitProvider>
        <ChecklistContent
          isGuest
          reviewToken={reviewToken}
          /* userId deliberately absent — all server Locker API calls in
             ChecklistContent are already gated on `if (userId)`, so they
             are skipped automatically in review mode. */
        />
      </UnitProvider>

      {/* ── Welcome modal — shown only on first open of a fresh review sandbox ── */}
      {showWelcome && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={dismissWelcome}
        >
          <div
            className="bg-card border border-border rounded-2xl shadow-2xl p-8 max-w-sm mx-4 text-center space-y-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-5xl select-none">🏕️</div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">Welcome to TrailWeigh</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Thank you for reviewing TrailWeigh. Feel free to explore, edit, and try anything
                — you won't affect the original file.
              </p>
            </div>
            <button
              onClick={dismissWelcome}
              className="w-full bg-primary text-primary-foreground font-semibold py-2.5 px-6 rounded-lg hover:bg-primary/90 transition-colors text-sm"
            >
              Start Exploring
            </button>
          </div>
        </div>
      )}
    </>
  );
}
