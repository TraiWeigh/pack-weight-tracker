import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { INCOMING_SHARE_KEY } from '../hooks/usePackData';
import type { PackState, CategoryMeta } from '../hooks/usePackData';
import { calcTotalOz, formatWeight, largeUnit, smallUnit } from '../lib/weightUtils';
import { Tent, ArrowRight, UserPlus } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface StoredPayload {
  categoryOrder: string[];
  data: PackState;
  categoryMeta: Record<string, CategoryMeta>;
}

// ── Read-only pack view ───────────────────────────────────────────────────────

function ReadOnlyPackView({
  payload,
  onCopyToList,
}: {
  payload: StoredPayload;
  onCopyToList: () => void;
}) {
  const { data, categoryOrder, categoryMeta } = payload;
  const [copied, setCopied] = useState(false);
  const system = 'imperial' as const;
  const lu = largeUnit(system);
  const su = smallUnit(system);

  // Compute totals
  let baseOz = 0;
  let totalOz = 0;
  categoryOrder.forEach(cat => {
    const items = data[cat] ?? [];
    const oz = items.reduce((s, i) => s + calcTotalOz(i.weightOz, i.qty), 0);
    totalOz += oz;
    if (categoryMeta[cat]?.countsToBase !== false) baseOz += oz;
  });

  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

  const handleAdd = () => {
    onCopyToList();
    window.location.href = `${basePath}/sign-up`;
  };

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
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
        {/* Summary bar */}
        <div className="bg-card border border-border rounded-xl p-5 flex flex-wrap gap-6">
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
          const catOz = items.reduce((s, i) => s + calcTotalOz(i.weightOz, i.qty), 0);
          return (
            <div key={cat} className="bg-card border border-border rounded-xl overflow-hidden">
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
                  <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
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
