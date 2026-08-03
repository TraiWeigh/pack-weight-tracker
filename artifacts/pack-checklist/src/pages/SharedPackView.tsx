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
      }
    }
    // Always redirect to checklist — with or without data
    setLocation('/checklist');
  }, []);

  return null;
}
