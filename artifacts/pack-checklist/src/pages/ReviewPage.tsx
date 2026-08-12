/**
 * ReviewPage — Public Review Sandbox (025L / 025P)
 *
 * Thin loader for /s/:id routes.
 *
 * LIVE-LOCKER links (025P+):
 *   GET /api/links/:id returns { type:'live-locker', files, sourceVersion }.
 *   On every open/reload, applies CASE A/B/C sync:
 *     A — no local sandbox → seed from current owner source.
 *     B — sandbox exists, source unchanged → preserve reviewer local edits.
 *     C — sandbox exists, source changed → replace sandbox from latest owner source.
 *
 * FROZEN-SNAPSHOT links (legacy, pre-025P):
 *   GET /api/links/:id returns { payload }.
 *   Seeds once; returning reviewers keep their own edits.
 *
 * Reviewer sandbox localStorage keys:
 *   trailweigh:review:${token}:pack           — current working gear data
 *   trailweigh:review:${token}:locker         — local Locker file list
 *   trailweigh:review:${token}:welcomed       — first-visit flag
 *   trailweigh:review:${token}:sourceVersion  — owner source fingerprint (live links only)
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { UnitProvider } from '../context/UnitContext';
import { ChecklistContent } from './Checklist';
import { useToast } from '../hooks/use-toast';

// ── Review-namespace key helpers ───────────────────────────────────────────────

function reviewWelcomedKey(token: string)      { return `trailweigh:review:${token}:welcomed`; }
function reviewPackKey(token: string)          { return `trailweigh:review:${token}:pack`; }
function reviewLockerKey(token: string)        { return `trailweigh:review:${token}:locker`; }
function reviewSourceVersionKey(token: string) { return `trailweigh:review:${token}:sourceVersion`; }

/** sessionStorage key for the currently-open Locker file (matches ChecklistContent's constant). */
const ACTIVE_LOCKER_FILE_SS_KEY = 'tw-active-locker-file';

// ── Type: live-locker file returned by GET /api/links/:id ─────────────────────

interface LiveLockerFile {
  id:              string;
  name:            string;
  savedAt:         number;
  store:           { items: Record<string, unknown>; order: string[]; meta: Record<string, unknown> };
  background:      unknown;
  bgFade:          number;
  bgTone:          string;
  bgSize:          string;
  chartPaletteKey?: string;
  barColor:        string;
  barFont:         string;
  barTextColor:    string;
  barTransparency: number;
}

// ── ReviewPage ─────────────────────────────────────────────────────────────────

export default function ReviewPage() {
  const params = useParams<{ id: string }>();
  const reviewToken = params.id ?? '';
  const { toast } = useToast();

  const [status, setStatus]           = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg]       = useState('');
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (!reviewToken) {
      setErrorMsg('No share ID in URL.');
      setStatus('error');
      return;
    }

    const packKey     = reviewPackKey(reviewToken);
    const lockerKey   = reviewLockerKey(reviewToken);
    const svKey       = reviewSourceVersionKey(reviewToken);
    const hasWelcomed = !!localStorage.getItem(reviewWelcomedKey(reviewToken));

    fetch(`/api/links/${reviewToken}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json: Record<string, unknown>) => {

        // ── LIVE-LOCKER path (025P+) ───────────────────────────────────────────
        if (json.type === 'live-locker') {
          const files        = (json.files as LiveLockerFile[]) ?? [];
          const newSourceVer = (json.sourceVersion as string) ?? '';

          const hasData    = !!localStorage.getItem(packKey);
          const hasLocker  = !!localStorage.getItem(lockerKey);
          const localSV    = localStorage.getItem(svKey);

          const needsSeed    = !hasData || !hasLocker;
          const sourceChanged = !needsSeed && localSV !== newSourceVer;

          if (needsSeed) {
            // CASE A: no local sandbox — seed from current owner source.
            seedFromLiveFiles(files, packKey, lockerKey, svKey, newSourceVer);
          } else if (sourceChanged) {
            // CASE C: owner source changed — replace review sandbox with latest state.
            seedFromLiveFiles(files, packKey, lockerKey, svKey, newSourceVer);
            toast({
              title:       'Review files updated',
              description: 'The shared collection changed — your view shows the latest version.',
              duration:    4000,
            });
          }
          // CASE B (else): source unchanged — preserve reviewer local edits; do nothing.

          if (!hasWelcomed) setShowWelcome(true);
          setStatus('ready');
          return;
        }

        // ── FROZEN-SNAPSHOT path (legacy — pre-025P links) ────────────────────
        const { payload } = json as { payload: Record<string, unknown> };
        if (!payload) throw new Error('Empty payload');

        const data          = payload.data          ?? {};
        const categoryOrder = Array.isArray(payload.categoryOrder) ? payload.categoryOrder : [];
        const categoryMeta  = payload.categoryMeta  ?? {};
        const seedFileName  = (payload.name as string | undefined) ?? 'Shared Pack List';
        const seedEntryId   = `review-seed-${reviewToken}`;

        const hasData   = !!localStorage.getItem(packKey);
        const hasLocker = !!localStorage.getItem(lockerKey);

        function buildFrozenLockerEntry() {
          return [{
            id:              seedEntryId,
            name:            seedFileName,
            savedAt:         Date.now(),
            store:           { items: data, order: categoryOrder, meta: categoryMeta },
            background:      payload.background ?? null,
            bgFade:          (payload.bgFade as number)          ?? 1,
            bgTone:          (payload.bgTone as string)          ?? 'light',
            bgSize:          (payload.bgSize as string)          ?? 'cover',
            chartPaletteKey: payload.chartPaletteKey as string | undefined,
            barColor:        (payload.barColor as string)        ?? '',
            barFont:         (payload.barFont as string)         ?? '',
            barTextColor:    (payload.barTextColor as string)    ?? '',
            barTransparency: (payload.barTransparency as number) ?? 1,
          }];
        }

        if (!hasData) {
          try {
            const seedRecord = { __v: 5, items: data, order: categoryOrder, meta: categoryMeta };
            localStorage.setItem(packKey, JSON.stringify(seedRecord));
            localStorage.setItem(lockerKey, JSON.stringify(buildFrozenLockerEntry()));
            setActiveFileSS(seedEntryId, seedFileName);
          } catch (e) {
            console.warn('[TrailWeigh] ReviewPage: could not seed review storage:', e);
          }
        } else if (!hasLocker) {
          // Migration guard (025N): packKey exists from 025L partial seed, lockerKey absent.
          try {
            localStorage.setItem(lockerKey, JSON.stringify(buildFrozenLockerEntry()));
            setActiveFileSS(seedEntryId, seedFileName);
          } catch (e) {
            console.warn('[TrailWeigh] ReviewPage: could not seed review locker (migration):', e);
          }
        }

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

  // ── Loading ────────────────────────────────────────────────────────────────

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

  // ── Error ──────────────────────────────────────────────────────────────────

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

  // ── Ready — full TrailWeigh UI in review/sandbox mode ─────────────────────

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

      {/* Welcome modal — shown only on first open of a fresh review sandbox */}
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

// ── Module-level helpers (outside component) ───────────────────────────────────

/** Write the active-file marker to sessionStorage. */
function setActiveFileSS(id: string, name: string) {
  try {
    sessionStorage.setItem(ACTIVE_LOCKER_FILE_SS_KEY, JSON.stringify({ id, name }));
  } catch { /* sessionStorage unavailable in some private-mode browsers — safe to skip */ }
}

/**
 * Seed (or reseed) the review namespace from the current live-locker files.
 *
 * • The most-recently-saved file (files[0], server-sorted desc by savedAt) is
 *   selected as the active/primary file and written to packKey.
 * • All files are written to lockerKey — reviewer sees all in the Locker panel.
 * • sourceVersion is persisted to detect future owner changes (CASE B/C).
 *
 * Called for CASE A (no local sandbox) and CASE C (source changed).
 * NOT called for CASE B (source unchanged — reviewer local edits are preserved).
 */
function seedFromLiveFiles(
  files:         LiveLockerFile[],
  packKey:       string,
  lockerKey:     string,
  svKey:         string,
  sourceVersion: string,
) {
  try {
    if (files.length === 0) {
      // Owner has no Locker files — write empty state so CASE B is stable.
      const emptyPack = { __v: 5, items: {}, order: [], meta: {} };
      localStorage.setItem(packKey,   JSON.stringify(emptyPack));
      localStorage.setItem(lockerKey, JSON.stringify([]));
      localStorage.setItem(svKey,     sourceVersion);
      return;
    }

    // Primary file — most recently saved (first after server sort by savedAt desc).
    const primary = files[0];
    const pStore  = primary.store;

    // Seed working state (what the gear editor opens with) from the primary file.
    const seedRecord = {
      __v:   5,
      items: pStore.items ?? {},
      order: Array.isArray(pStore.order) ? pStore.order : [],
      meta:  pStore.meta  ?? {},
    };
    localStorage.setItem(packKey, JSON.stringify(seedRecord));

    // Build LockerEntry array from ALL live files — reviewer sees all of them
    // in the Locker panel and can switch between files, rename, delete locally.
    const lockerEntries = files.map(f => {
      const s = f.store;
      return {
        id:              f.id,
        name:            f.name,
        savedAt:         f.savedAt,
        store: {
          items: s.items ?? {},
          order: Array.isArray(s.order) ? s.order : [],
          meta:  s.meta  ?? {},
        },
        background:      f.background ?? null,
        bgFade:          f.bgFade          ?? 1,
        bgTone:          f.bgTone          ?? 'light',
        bgSize:          f.bgSize          ?? 'cover',
        chartPaletteKey: f.chartPaletteKey,
        barColor:        f.barColor        ?? '',
        barFont:         f.barFont         ?? '',
        barTextColor:    f.barTextColor    ?? '',
        barTransparency: f.barTransparency ?? 1,
      };
    });
    localStorage.setItem(lockerKey, JSON.stringify(lockerEntries));

    // Persist source version for CASE B/C comparison on next open/reload.
    localStorage.setItem(svKey, sourceVersion);

    // Pre-select the primary file so ChecklistContent opens it on mount.
    setActiveFileSS(primary.id, primary.name);
  } catch (e) {
    console.warn('[TrailWeigh] ReviewPage: could not seed review storage from live files:', e);
  }
}
