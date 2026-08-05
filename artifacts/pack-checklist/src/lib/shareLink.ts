import { PackState, CategoryMeta } from '../hooks/usePackData';
import type { Background } from '../components/BackgroundPicker';

export interface SharePayload {
  data: PackState;
  categoryOrder: string[];
  categoryMeta: Record<string, CategoryMeta>;
  // Background settings — captured at share time so recipients see the same view
  background?: Background | null;
  bgFade?: number;
  bgTone?: 'light' | 'dark';
  bgSize?: 'cover' | 'contain';
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

/**
 * Creates a short /s/<id> link stored on the server. Falls back to hash URL if offline.
 * Pass `{ editable: true }` to generate a link that loads the list into the viewer's checklist.
 * Without that option the link opens a read-only view.
 */
export async function buildShareURL(
  payload: SharePayload,
  opts?: { editable?: boolean },
): Promise<string> {
  const base = window.location.origin +
    (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const suffix = opts?.editable ? '?edit=1' : '';

  try {
    const resp = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload }),
    });
    if (resp.ok) {
      const { id } = await resp.json() as { id: string };
      const url = `${base}/s/${id}${suffix}`;
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
