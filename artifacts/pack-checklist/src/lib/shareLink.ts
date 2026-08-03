import { PackData, CategoryMeta } from '../hooks/usePackData';

export interface SharePayload {
  data: PackData;
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

export function buildShareURL(payload: SharePayload): string {
  const base = window.location.origin + window.location.pathname.replace(/\/checklist.*$/, '');
  return `${base}/shared#${encodeSharePayload(payload)}`;
}
