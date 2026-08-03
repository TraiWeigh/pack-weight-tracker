import { PackState, CategoryMeta } from '../hooks/usePackData';

export interface SharePayload {
  data: PackState;
  categoryOrder: string[];
  categoryMeta: Record<string, CategoryMeta>;
}

export function encodeSharePayload(payload: SharePayload): string {
  const json = JSON.stringify(payload);
  return btoa(encodeURIComponent(json));
}

export function decodeSharePayload(encoded: string): SharePayload | null {
  try {
    const json = decodeURIComponent(atob(encoded));
    return JSON.parse(json) as SharePayload;
  } catch {
    return null;
  }
}

/** Creates a short /s/<id> link stored on the server. Falls back to hash URL if offline. */
export async function buildShareURL(payload: SharePayload): Promise<string> {
  const base = window.location.origin +
    (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

  try {
    const resp = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload }),
    });
    if (resp.ok) {
      const { id } = await resp.json() as { id: string };
      const url = `${base}/s/${id}`;
      console.log('[TrailWeigh] Short share URL:', url);
      return url;
    }
    console.warn('[TrailWeigh] Share API returned', resp.status, '— using fallback URL');
  } catch (err) {
    console.warn('[TrailWeigh] Share API error — using fallback URL', err);
  }

  // Offline / API unavailable — hash-encoded fallback (long but works)
  return `${base}/shared#${encodeSharePayload(payload)}`;
}
