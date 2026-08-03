import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { INCOMING_SHARE_KEY } from '../hooks/usePackData';

export default function ShortLinkView() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const [error, setError] = useState(false);

  useEffect(() => {
    const id = params.id;
    if (!id) { setLocation('/checklist'); return; }

    fetch(`/api/links/${id}`)
      .then(r => {
        if (!r.ok) throw new Error('not found');
        return r.json();
      })
      .then(({ payload }) => {
        if (payload) {
          // Write to the staging key — usePackData reads & clears it on next load,
          // regardless of whether the recipient is signed in or a guest.
          const store = {
            __v: 5,
            order: payload.categoryOrder,
            items: payload.data,
            meta:  payload.categoryMeta,
          };
          localStorage.setItem(INCOMING_SHARE_KEY, JSON.stringify(store));
        }
        setLocation('/checklist');
      })
      .catch(() => setError(true));
  }, [params.id]);

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

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground animate-pulse">Loading pack…</p>
    </div>
  );
}
