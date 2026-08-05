import { useState, useEffect, useCallback, useRef } from 'react';
import { INITIAL_DATA } from '../data/initialData';

export type GearItem = {
  id: string;
  sub: string;
  desc: string;
  weightOz: number;
  qty: number;
  checked: boolean;
  expendable: boolean;
};

export type PackState = {
  [category: string]: GearItem[];
};

export type CategoryMeta = {
  countsToBase: boolean;
  subLabel?: string;
  descLabel?: string;
};

const DEFAULT_CATEGORY_ORDER = [
  'Backpack', 'Shelter', 'Sleep', 'Clothing Packed', 'Kitchen',
  'Electronics', 'Toiletries', 'Med Kit', 'Repair Kit', 'Hydration',
  'Clothing Worn', 'Dog Pack', 'Expendables',
];

const DEFAULT_EXCLUDES_BASE = new Set(['Dog Pack', 'Clothing Worn', 'Expendables']);

const EXCLUSIVE_GROUPS: Array<{ category: string; subs: string[] }> = [
  { category: 'Backpack', subs: ['Backpack'] },
  { category: 'Shelter',  subs: ['Tent', 'Tarp', 'Hammock'] },
  { category: 'Sleep',    subs: ['Sleeping Bag'] },
];

const V5_KEY       = (uid?: string) => uid ? `pack-checklist-v5-${uid}` : 'pack-checklist-v5-guest';
const V4_KEY       = (uid?: string) => uid ? `pack-checklist-v4-${uid}` : 'pack-checklist-v4-guest';
export const INCOMING_SHARE_KEY = 'tw-incoming-share';
export const LOCKER_KEY = 'trailweigh:locker';
const MAX_HISTORY = 200;

// ── Types ─────────────────────────────────────────────────────────────────────

export type Store = {
  items: PackState;
  order: string[];
  meta: Record<string, CategoryMeta>;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function defaultMeta(cats: string[]): Record<string, CategoryMeta> {
  const meta: Record<string, CategoryMeta> = {};
  cats.forEach(cat => { meta[cat] = { countsToBase: !DEFAULT_EXCLUDES_BASE.has(cat) }; });
  return meta;
}

function seedInitialData(): Store {
  const items: PackState = {};
  for (const [cat, catItems] of Object.entries(INITIAL_DATA)) {
    items[cat] = catItems.map(item => ({ ...item, id: crypto.randomUUID() }));
  }
  DEFAULT_CATEGORY_ORDER.forEach(cat => { if (!items[cat]) items[cat] = []; });
  return { items, order: [...DEFAULT_CATEGORY_ORDER], meta: defaultMeta(DEFAULT_CATEGORY_ORDER) };
}

function emptyData(): Store {
  const items: PackState = {};
  DEFAULT_CATEGORY_ORDER.forEach(cat => { items[cat] = []; });
  return { items, order: [...DEFAULT_CATEGORY_ORDER], meta: defaultMeta(DEFAULT_CATEGORY_ORDER) };
}

function sanitizeItems(raw: any[], _cat: string): GearItem[] {
  return (raw || []).map((item: any) => ({
    ...item,
    id: item.id || crypto.randomUUID(),
    expendable: item.expendable ?? false,
  }));
}

function parseV5(p: any): Store | null {
  if (!p || p.__v !== 5 || !Array.isArray(p.order)) return null;
  const order: string[] = p.order;
  const items: PackState = {};
  order.forEach(cat => { items[cat] = sanitizeItems(p.items?.[cat], cat); });
  const meta: Record<string, CategoryMeta> = {};
  order.forEach(cat => {
    const m = p.meta?.[cat];
    meta[cat] = {
      countsToBase: m?.countsToBase ?? !DEFAULT_EXCLUDES_BASE.has(cat),
      subLabel:  m?.subLabel  ?? undefined,
      descLabel: m?.descLabel ?? undefined,
    };
  });
  return { items, order, meta };
}

function loadFromKey(key: string): Store | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = parseV5(JSON.parse(raw));
      if (parsed) return parsed;
    }
  } catch { /* fall through */ }
  return null;
}

function loadFromStorage(uid?: string): Store | null {
  // v5
  const v5 = loadFromKey(V5_KEY(uid));
  if (v5) return v5;

  // v4 migration
  try {
    const raw = localStorage.getItem(V4_KEY(uid));
    if (raw) {
      const p = JSON.parse(raw);
      const order = [...DEFAULT_CATEGORY_ORDER];
      Object.keys(p).forEach(cat => { if (!order.includes(cat)) order.push(cat); });
      const items: PackState = {};
      order.forEach(cat => { items[cat] = sanitizeItems(p[cat], cat); });
      return { items, order, meta: defaultMeta(order) };
    }
  } catch { /* fall through */ }

  return null;
}

/** Resolve the storage key for this browser session.
 *  Fork tabs (opened via "New" button or "Load This List") get an isolated key stored in sessionStorage. */
function resolveStorageKey(userId?: string): { key: string; isFork: boolean } {
  try {
    // Already in a forked session?
    const forkId = sessionStorage.getItem('tw-fork-id');
    if (forkId) return { key: `pack-checklist-v5-fork-${forkId}`, isFork: true };

    const params = new URLSearchParams(window.location.search);

    // First load of a forked tab via "New" button?
    const seedId = params.get('newseed');
    if (seedId) {
      sessionStorage.setItem('tw-fork-id', seedId);
      return { key: `pack-checklist-v5-fork-${seedId}`, isFork: true };
    }

    // First load of a saved list via "Load This List"?
    const savedListId = params.get('savedListId');
    if (savedListId) {
      const newForkId = crypto.randomUUID();
      sessionStorage.setItem('tw-fork-id', newForkId);
      return { key: `pack-checklist-v5-fork-${newForkId}`, isFork: true };
    }
  } catch { /* ignore */ }
  return { key: V5_KEY(userId), isFork: false };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function usePackData(userId?: string) {
  // Resolved once at mount — fork tabs get an isolated storage key
  const [storageKey] = useState<string>(() => resolveStorageKey(userId).key);

  // Undo / redo stacks (refs — mutations don't need to trigger renders)
  const undoStackRef = useRef<Store[]>([]);
  const redoStackRef = useRef<Store[]>([]);
  // historyVersion just triggers canUndo/canRedo recalcs
  const [historyVersion, setHistoryVersion] = useState(0);

  const [store, setStore] = useState<Store>(() => {
    // 0. Saved list from Locker (opened via "Load This List" with ?savedListId=<id>)
    try {
      const params = new URLSearchParams(window.location.search);
      const savedListId = params.get('savedListId');
      if (savedListId) {
        const lockerRaw = localStorage.getItem(LOCKER_KEY);
        const entries: any[] = lockerRaw ? JSON.parse(lockerRaw) : [];
        const entry = entries.find((e: any) => e.id === savedListId);
        if (entry?.store) {
          // Write into the fork key (already set by resolveStorageKey above)
          const v5Store = { __v: 5, ...entry.store };
          localStorage.setItem(storageKey, JSON.stringify(v5Store));
          // Stash background settings for ChecklistContent to pick up
          sessionStorage.setItem('tw-savedlist-bg',     JSON.stringify(entry.background ?? null));
          sessionStorage.setItem('tw-savedlist-bgfade', String(entry.bgFade ?? 1));
          sessionStorage.setItem('tw-savedlist-bgtone', entry.bgTone ?? 'light');
          // Clean URL
          const url = new URL(window.location.href);
          url.searchParams.delete('savedListId');
          window.history.replaceState(null, '', url.toString());
          const parsed = parseV5(v5Store);
          if (parsed) return parsed;
        }
        // Entry not found — flag for error toast
        sessionStorage.setItem('tw-savedlist-error', '1');
        const url = new URL(window.location.href);
        url.searchParams.delete('savedListId');
        window.history.replaceState(null, '', url.toString());
      }
    } catch { /* ignore */ }

    // 1. Newseed (first load of forked tab via "New" button) — load from temp key
    try {
      const params = new URLSearchParams(window.location.search);
      const seedId = params.get('newseed');
      if (seedId) {
        const raw = localStorage.getItem(`tw-newseed-${seedId}`);
        localStorage.removeItem(`tw-newseed-${seedId}`);
        // Clean ?newseed from URL
        const url = new URL(window.location.href);
        url.searchParams.delete('newseed');
        window.history.replaceState(null, '', url.toString());
        if (raw) {
          const parsed = parseV5(JSON.parse(raw));
          if (parsed) return parsed;
        }
      }
    } catch { /* ignore */ }

    // 2. Incoming share link
    try {
      const incoming = localStorage.getItem(INCOMING_SHARE_KEY);
      if (incoming) {
        localStorage.removeItem(INCOMING_SHARE_KEY);
        const parsed = parseV5(JSON.parse(incoming));
        if (parsed) return parsed;
      }
    } catch { /* ignore */ }

    // 3. If fork key — try loading from fork storage (tab was refreshed)
    const { isFork } = resolveStorageKey(userId);
    if (isFork) {
      const forkData = loadFromKey(storageKey);
      if (forkData) return forkData;
    }

    // 4. Normal user / guest storage
    const saved = loadFromStorage(userId);
    if (saved) return saved;
    return userId ? emptyData() : seedInitialData();
  });

  // Persist on every store change
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ __v: 5, ...store }));
  }, [store, storageKey]);

  // ── History helpers ──────────────────────────────────────────────────────

  /** Like setStore but pushes the previous state onto the undo stack. */
  const pushAndSet = useCallback((fn: (prev: Store) => Store) => {
    setStore(prev => {
      undoStackRef.current = [...undoStackRef.current.slice(-(MAX_HISTORY - 1)), prev];
      redoStackRef.current = [];
      return fn(prev);
    });
    setHistoryVersion(v => v + 1);
  }, []);

  const undo = useCallback(() => {
    const stack = undoStackRef.current;
    if (stack.length === 0) return;
    const prev = stack[stack.length - 1];
    undoStackRef.current = stack.slice(0, -1);
    setStore(current => {
      redoStackRef.current = [current, ...redoStackRef.current.slice(0, MAX_HISTORY - 1)];
      return prev;
    });
    setHistoryVersion(v => v + 1);
  }, []);

  const redo = useCallback(() => {
    const stack = redoStackRef.current;
    if (stack.length === 0) return;
    const next = stack[0];
    redoStackRef.current = stack.slice(1);
    setStore(current => {
      undoStackRef.current = [...undoStackRef.current.slice(-(MAX_HISTORY - 1)), current];
      return next;
    });
    setHistoryVersion(v => v + 1);
  }, []);

  // Derive canUndo/canRedo — re-evaluated after every historyVersion change
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  historyVersion; // referenced so the linter doesn't complain
  const canUndo = undoStackRef.current.length > 0;
  const canRedo  = redoStackRef.current.length > 0;

  // ── Mutations ────────────────────────────────────────────────────────────

  const updateItem = useCallback((category: string, id: string, updates: Partial<GearItem>) => {
    pushAndSet(prev => {
      if (updates.checked === true) {
        const group = EXCLUSIVE_GROUPS.find(g => g.category === category);
        if (group) {
          const target = (prev.items[category] || []).find(i => i.id === id);
          if (target && group.subs.includes(target.sub)) {
            return {
              ...prev,
              items: {
                ...prev.items,
                [category]: (prev.items[category] || []).map(item => {
                  if (item.id === id) return { ...item, ...updates };
                  if (group.subs.includes(item.sub)) return { ...item, checked: false };
                  return item;
                }),
              },
            };
          }
        }
      }
      return {
        ...prev,
        items: {
          ...prev.items,
          [category]: (prev.items[category] || []).map(item =>
            item.id === id ? { ...item, ...updates } : item
          ),
        },
      };
    });
  }, [pushAndSet]);

  const addItem = useCallback((category: string, prefill?: Partial<GearItem>) => {
    pushAndSet(prev => ({
      ...prev,
      items: {
        ...prev.items,
        [category]: [...(prev.items[category] || []), {
          id: crypto.randomUUID(),
          sub: prefill?.sub ?? '',
          desc: prefill?.desc ?? '',
          weightOz: prefill?.weightOz ?? 0,
          qty: prefill?.qty ?? 1,
          checked: prefill?.checked ?? true,
          expendable: prefill?.expendable ?? false,
        }],
      },
    }));
  }, [pushAndSet]);

  const removeItem = useCallback((category: string, id: string) => {
    pushAndSet(prev => ({
      ...prev,
      items: {
        ...prev.items,
        [category]: (prev.items[category] || []).filter(item => item.id !== id),
      },
    }));
  }, [pushAndSet]);

  const addCategory = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    pushAndSet(prev => {
      if (prev.order.includes(trimmed)) return prev;
      return {
        items: { ...prev.items, [trimmed]: [] },
        order: [...prev.order, trimmed],
        meta: { ...prev.meta, [trimmed]: { countsToBase: true } },
      };
    });
  }, [pushAndSet]);

  const deleteCategory = useCallback((name: string) => {
    pushAndSet(prev => {
      const order = prev.order.filter(c => c !== name);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [name]: _i, ...items } = prev.items;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [name]: _m, ...meta } = prev.meta;
      return { items, order, meta };
    });
  }, [pushAndSet]);

  const renameCategory = useCallback((oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    pushAndSet(prev => {
      if (prev.order.includes(trimmed)) return prev; // duplicate name
      const order = prev.order.map(c => c === oldName ? trimmed : c);
      const newItems: PackState = {};
      const newMeta: Record<string, CategoryMeta> = {};
      prev.order.forEach(cat => {
        const key = cat === oldName ? trimmed : cat;
        newItems[key] = prev.items[cat] ?? [];
        newMeta[key]  = prev.meta[cat] ?? { countsToBase: true };
      });
      return { items: newItems, order, meta: newMeta };
    });
  }, [pushAndSet]);

  const updateCategoryMeta = useCallback((category: string, updates: Partial<CategoryMeta>) => {
    pushAndSet(prev => ({
      ...prev,
      meta: { ...prev.meta, [category]: { ...prev.meta[category], ...updates } },
    }));
  }, [pushAndSet]);

  const moveCategory = useCallback((category: string, dir: 'up' | 'down') => {
    pushAndSet(prev => {
      const idx = prev.order.indexOf(category);
      if (idx < 0) return prev;
      const order = [...prev.order];
      if (dir === 'up' && idx > 0) {
        [order[idx - 1], order[idx]] = [order[idx], order[idx - 1]];
      } else if (dir === 'down' && idx < order.length - 1) {
        [order[idx], order[idx + 1]] = [order[idx + 1], order[idx]];
      } else {
        return prev;
      }
      return { ...prev, order };
    });
  }, [pushAndSet]);

  const reorderCategory = useCallback((fromCat: string, toCat: string) => {
    pushAndSet(prev => {
      const order = [...prev.order];
      const fromIdx = order.indexOf(fromCat);
      const toIdx   = order.indexOf(toCat);
      if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return prev;
      order.splice(fromIdx, 1);
      order.splice(toIdx, 0, fromCat);
      return { ...prev, order };
    });
  }, [pushAndSet]);

  /** Restore an entire store snapshot (used by Locker). */
  const loadStore = useCallback((newStore: Store) => {
    pushAndSet(() => newStore);
  }, [pushAndSet]);

  const resetToDefaults = useCallback(() => {
    pushAndSet(prev => {
      const clearedItems: PackState = {};
      prev.order.forEach(cat => { clearedItems[cat] = []; });
      return { ...prev, items: clearedItems };
    });
  }, [pushAndSet]);

  return {
    data: store.items,
    categoryOrder: store.order,
    categoryMeta: store.meta,
    store,
    updateItem,
    addItem,
    removeItem,
    addCategory,
    deleteCategory,
    renameCategory,
    updateCategoryMeta,
    moveCategory,
    reorderCategory,
    loadStore,
    resetToDefaults,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
