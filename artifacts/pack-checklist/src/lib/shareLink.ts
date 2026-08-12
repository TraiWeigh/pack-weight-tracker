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
  barColor?: string;
  barFont?: string;
  barTextColor?: string;
  barTransparency?: number;
}

export interface SharePayload {
  /**
   * Discriminates between a full Locker share (multi-file shared locker) and a
   * single Pack List share (Preview-style read-only view).
   * Absent on pre-021E links — treated as 'locker' for backward compatibility.
   */
  type?: 'locker' | 'pack-list' | 'checkable';
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
  barColor?: string;
  barFont?: string;
  barTextColor?: string;
  barTransparency?: number;
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
 * Creates a short /s/<id> link stored on the server.
 * Returns null if the API call fails — callers MUST handle null and show an
 * error rather than falling back to a hash-encoded payload URL.
 *
 * IMPORTANT: Do NOT restore a hash-encoded fallback here. A base64-JSON hash
 * URL containing the full gear payload is thousands of characters long and is
 * misidentified as a search query by browsers and search engines (025M root
 * cause). When the server is unavailable the correct UX is an error toast.
 *
 * Pass `{ editable: true }` to generate a link that loads the list into the
 * viewer's checklist. Without that option the link opens a read-only view.
 */
export async function buildShareURL(
  payload: SharePayload,
  opts?: { editable?: boolean },
): Promise<string | null> {
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
    console.warn('[TrailWeigh] Share API returned', resp.status, '— cannot create share link');
  } catch (err) {
    console.warn('[TrailWeigh] Share API error — cannot create share link', err);
  }

  // Signal failure to the caller — do NOT fall back to a hash-encoded URL.
  return null;
}

/**
 * Creates a LIVE share link (025P+).
 *
 * Unlike buildShareURL (which snapshots gear data into the record), this posts
 * only { type: 'live-locker' } to the server. The server extracts ownerId from
 * the Clerk JWT and stores { type:'live-locker', ownerId }. On every subsequent
 * GET, the server reads the current Locker from the DB, so the same URL always
 * reflects the owner's latest changes.
 *
 * Returns null on API failure — caller must handle and show an error toast.
 */
export async function buildLiveShareURL(): Promise<string | null> {
  const base = window.location.origin +
    (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  try {
    const resp = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload: { type: 'live-locker' } }),
    });
    if (resp.ok) {
      const { id } = await resp.json() as { id: string };
      const url = `${base}/s/${id}`;
      console.log('[TrailWeigh] Live share URL:', url);
      return url;
    }
    console.warn('[TrailWeigh] Live share API returned', resp.status, '— cannot create live share link');
  } catch (err) {
    console.warn('[TrailWeigh] Live share API error — cannot create live share link', err);
  }
  return null;
}
