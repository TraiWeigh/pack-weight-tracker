import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { INCOMING_SHARE_KEY } from '../hooks/usePackData';
import type { PackState, CategoryMeta } from '../hooks/usePackData';
import { calcTotalOz, formatWeight, largeUnit, smallUnit } from '../lib/weightUtils';
import { Tent, ArrowRight, UserPlus } from 'lucide-react';
import type { Background } from '../components/BackgroundPicker';
import { PRESETS, getFullUrl } from '../components/BackgroundPicker';

// ── Types ─────────────────────────────────────────────────────────────────────

interface StoredPayload {
  categoryOrder: string[];
  data: PackState;
  categoryMeta: Record<string, CategoryMeta>;
  background?: Background | null;
  bgFade?: number;
  bgTone?: 'light' | 'dark';
  bgSize?: 'cover' | 'contain';
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Resolve a Background object to a CSS image URL, or null if not applicable. */
function resolveBgUrl(bg: Background | null | undefined): string | null {
  if (!bg) return null;
  if (bg.type === 'preset' && bg.id) {
    const preset = PRESETS.find(p => p.id === bg.id);
    return preset ? getFullUrl(preset.photoId) : null;
  }
  if (bg.type === 'custom' && bg.dataUrl?.startsWith('data:image/')) {
    return bg.dataUrl;
  }
  return null;
}

/**
 * Write background settings to sessionStorage so ChecklistContent picks them up
 * when the user loads the shared list into their own checklist.
 */
function stashBgToSession(p: StoredPayload) {
  try {
    sessionStorage.setItem('tw-savedlist-bg',     JSON.stringify(p.background ?? null));
    sessionStorage.setItem('tw-savedlist-bgfade', String(p.bgFade ?? 1));
    sessionStorage.setItem('tw-savedlist-bgtone', p.bgTone ?? 'light');
    sessionStorage.setItem('tw-savedlist-bgsize', p.bgSize ?? 'cover');
  } catch { /* ignore */ }
}

// ── Read-only pack view ───────────────────────────────────────────────────────

function ReadOnlyPackView({
  payload,
  onCopyToList,
}: {
  payload: StoredPayload;
  onCopyToList: () => void;
}) {
  const { data, categoryOrder, categoryMeta, background, bgFade = 1, bgTone = 'light', bgSize = 'cover' } = payload;
  const [copied, setCopied] = useState(false);
  const system = 'imperial' as const;
  const lu = largeUnit(system);
  const su = smallUnit(system);

  // Resolve background image
  const bgImageUrl = resolveBgUrl(background);

  // Compute totals — only checked items count (mirrors the main app's WeightSummary)
  let baseOz = 0;
  let totalOz = 0;
  categoryOrder.forEach(cat => {
    const items = (data[cat] ?? []).filter(i => i.checked);
    const oz = items.reduce((s, i) => s + calcTotalOz(i.weightOz, i.qty), 0);
    totalOz += oz;
    if (categoryMeta[cat]?.countsToBase !== false) baseOz += oz;
  });

  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

  const handleAdd = () => {
    onCopyToList();
    window.location.href = `${basePath}/sign-up`;
  };

  // Build background inline style for the page wrapper
  const wrapperStyle: React.CSSProperties = bgImageUrl
    ? {
        backgroundImage:
          bgFade < 1
            ? `linear-gradient(rgba(${bgTone === 'dark' ? '0,0,0' : '255,255,255'},${1 - bgFade}),rgba(${bgTone === 'dark' ? '0,0,0' : '255,255,255'},${1 - bgFade})),url(${bgImageUrl})`
            : `url(${bgImageUrl})`,
        backgroundSize:   bgFade < 1 ? `100% 100%, ${bgSize}` : bgSize,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }
    : {};

  return (
    <div className="min-h-[100dvh] bg-background" style={wrapperStyle}>
      {/* Header */}
      <header className="bg-card/95 backdrop-blur-sm border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg text-primary">
            <Tent className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-foreground text-lg leading-tight">TrailWeigh</h1>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              Shared Pack List
            </p>
          </div>
        </div>

        {/* View-only banner */}
        <div className="border-t border-border bg-muted/50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              This is a view-only pack list. Sign in or create a free account to save your own copy.
            </p>
            <button
              onClick={handleAdd}
              className="flex items-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap flex-shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Summary bar — totals from checked items only */}
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl p-5 flex flex-wrap gap-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
              Base Weight
            </p>
            <p className="text-2xl font-black font-mono text-foreground tabular-nums">
              {formatWeight(baseOz, system, 'large')}
              <span className="text-sm font-semibold text-muted-foreground ml-1">{lu}</span>
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
              Grand Total
            </p>
            <p className="text-2xl font-black font-mono text-primary tabular-nums">
              {formatWeight(totalOz, system, 'large')}
              <span className="text-sm font-semibold text-muted-foreground ml-1">{lu}</span>
            </p>
          </div>
        </div>

        {/* Categories */}
        {categoryOrder.map(cat => {
          const items = data[cat] ?? [];
          if (items.length === 0) return null;
          // Category total — checked items only, matching main app behaviour
          const catOz = items.filter(i => i.checked).reduce((s, i) => s + calcTotalOz(i.weightOz, i.qty), 0);
          return (
            <div key={cat} className="bg-card/95 backdrop-blur-sm border border-border rounded-xl overflow-hidden">
              {/* Category header */}
              <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  {cat}
                </span>
                <span className="text-xs font-semibold text-muted-foreground font-mono tabular-nums">
                  {formatWeight(catOz, system, 'large')} {lu}
                </span>
              </div>

              {/* Items */}
              <div className="divide-y divide-border">
                {items.map(item => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 px-4 py-2.5 ${!item.checked ? 'opacity-50' : ''}`}
                  >
                    {/* Read-only checkbox indicator */}
                    <div
                      className={`w-4 h-4 rounded flex-shrink-0 border ${
                        item.checked
                          ? 'bg-primary border-primary'
                          : 'bg-transparent border-muted-foreground/40'
                      } flex items-center justify-center`}
                    >
                      {item.checked && (
                        <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 10 10">
                          <path d="M1.5 5l2.5 2.5 4.5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {item.sub && (
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mr-2">
                          {item.sub}
                        </span>
                      )}
                      <span className="text-sm text-foreground">{item.desc || '—'}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 text-right">
                      {item.qty > 1 && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          ×{item.qty}
                        </span>
                      )}
                      <span className="text-sm font-semibold font-mono text-foreground tabular-nums">
                        {formatWeight(calcTotalOz(item.weightOz, item.qty), system, 'small')}
                        <span className="text-xs text-muted-foreground ml-0.5">{su}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Footer CTA */}
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-3">
            Want to build your own pack list?
          </p>
          <a
            href={import.meta.env.BASE_URL || '/'}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            Get started with TrailWeigh
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </main>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ShortLinkView() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const [error, setError] = useState(false);
  const [payload, setPayload] = useState<StoredPayload | null>(null);

  const isEditable = new URLSearchParams(window.location.search).get('edit') === '1';

  useEffect(() => {
    const id = params.id;
    if (!id) { setLocation('/checklist'); return; }

    fetch(`/api/links/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('not found');
        return r.json();
      })
      .then(({ payload: p }) => {
        if (!p) throw new Error('empty payload');

        if (isEditable) {
          // Editable mode: load into the viewer's checklist and redirect
          const store = {
            __v: 5,
            order: p.categoryOrder,
            items: p.data,
            meta:  p.categoryMeta,
          };
          localStorage.setItem(INCOMING_SHARE_KEY, JSON.stringify(store));
          stashBgToSession(p as StoredPayload);
          setLocation('/checklist');
        } else {
          // Read-only mode: render the pack inline
          setPayload(p as StoredPayload);
        }
      })
      .catch(() => setError(true));
  }, [params.id, isEditable]);

  function handleCopyToList() {
    if (!payload) return;
    const store = {
      __v: 5,
      order: payload.categoryOrder,
      items: payload.data,
      meta:  payload.categoryMeta,
    };
    localStorage.setItem(INCOMING_SHARE_KEY, JSON.stringify(store));
    stashBgToSession(payload);
    setLocation('/checklist');
  }

  if (error) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
        <div className="text-center space-y-3">
          <p className="text-2xl">🏕️</p>
          <p className="font-semibold text-foreground">Link not found</p>
          <p className="text-sm text-muted-foreground">This share link may have expired or been removed.</p>
          <a href="/" className="inline-block text-sm text-primary underline underline-offset-4 mt-2">
            Go to TrailWeigh
          </a>
        </div>
      </div>
    );
  }

  if (payload) {
    return <ReadOnlyPackView payload={payload} onCopyToList={handleCopyToList} />;
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground animate-pulse">Loading pack…</p>
    </div>
  );
}
