import { PackState, CategoryMeta } from '../hooks/usePackData';
import type { Background } from '../components/BackgroundPicker';
import type { UnitSystem } from './weightUtils';

/**
 * A snapshot of one saved Locker file, captured at share-generation time.
 * Used to populate the view-only Shared Locker on /s/:shareId.
 * Contains only the saved state — never credentials, auth tokens, or live storage refs.
 */
export interface SharedLockerFile {
  id: string;
  name: string;
  store: {
    items: PackState;
    order: string[];
    meta: Record<string, CategoryMeta>;
  };
  background?: Background | null;
  bgFade?: number;
  bgTone?: 'light' | 'dark';
  bgSize?: 'cover' | 'contain';
  chartPaletteKey?: string;
}

export interface SharePayload {
  data: PackState;
  categoryOrder: string[];
  categoryMeta: Record<string, CategoryMeta>;
  // Background settings — captured at share time so recipients see the same view
  background?: Background | null;
  bgFade?: number;
  bgTone?: 'light' | 'dark';
  bgSize?: 'cover' | 'contain';
  /** Sender's active unit system — initialises the recipient's unit display. */
  unit?: UnitSystem;
  /** Sender's Locker file name — displayed in the shared-view banner. */
  name?: string;
  /**
   * Snapshot of all saved Locker files at share-generation time.
   * Provides the Shared Locker on /s/:shareId — view-only, no rename/delete.
   * Absent for shares created before 021C; those render single-file view only.
   */
  lockerFiles?: SharedLockerFile[];
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
