import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { decodeSharePayload } from '../lib/shareLink';

const GUEST_KEY = 'pack-checklist-v5-guest';

export default function SharedPackView() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const payload = decodeSharePayload(hash);
      if (payload) {
        const store = {
          __v: 5,
          order: payload.categoryOrder,
          items: payload.data,
          meta: payload.categoryMeta,
        };
        localStorage.setItem(GUEST_KEY, JSON.stringify(store));

        // Carry background settings so ChecklistContent picks them up on mount.
        try {
          sessionStorage.setItem('tw-savedlist-bg',     JSON.stringify(payload.background ?? null));
          sessionStorage.setItem('tw-savedlist-bgfade', String(payload.bgFade ?? 1));
          sessionStorage.setItem('tw-savedlist-bgtone', payload.bgTone ?? 'light');
          sessionStorage.setItem('tw-savedlist-bgsize', payload.bgSize ?? 'cover');
        } catch { /* ignore */ }
      }
    }
    // Always redirect to checklist — with or without data
    setLocation('/checklist');
  }, []);

  return null;
}
