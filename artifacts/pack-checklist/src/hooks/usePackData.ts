import { useState, useEffect, useCallback } from 'react';
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
  subLabel?: string;   // column header for the "Type" field
  descLabel?: string;  // column header for the "Description" field
};

// Default order for built-in categories
const DEFAULT_CATEGORY_ORDER = [
  'Backpack', 'Shelter', 'Sleep', 'Clothing Packed', 'Kitchen',
  'Electronics', 'Toiletries', 'Med Kit', 'Repair Kit', 'Hydration',
  'Clothing Worn', 'Dog Pack', 'Expendables',
];

// Built-in categories excluded from base weight by default
const DEFAULT_EXCLUDES_BASE = new Set(['Dog Pack', 'Clothing Worn', 'Expendables']);

// Groups where only one item can be checked at a time
const EXCLUSIVE_GROUPS: Array<{ category: string; subs: string[] }> = [
  { category: 'Backpack', subs: ['Backpack'] },
  { category: 'Shelter',  subs: ['Tent', 'Tarp', 'Hammock'] },
  { category: 'Sleep',    subs: ['Sleeping Bag'] },
];

const V5_KEY   = (uid?: string) => uid ? `pack-checklist-v5-${uid}` : 'pack-checklist-v5-guest';
const V4_KEY   = (uid?: string) => uid ? `pack-checklist-v4-${uid}` : 'pack-checklist-v4-guest';

// ── Helpers ──────────────────────────────────────────────────────────────────

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

type Store = {
  items: PackState;
  order: string[];
  meta: Record<string, CategoryMeta>;
};

function sanitizeItems(raw: any[], cat: string): GearItem[] {
  return (raw || []).map((item: any) => ({
    ...item,
    id: item.id || crypto.randomUUID(),
    expendable: item.expendable ?? false,
  }));
}

function loadFromStorage(uid?: string): Store | null {
  // ── v5 format ─────────────────────────────────────────────
  try {
    const raw = localStorage.getItem(V5_KEY(uid));
    if (raw) {
      const p = JSON.parse(raw);
      if (p.__v === 5 && Array.isArray(p.order)) {
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
    }
  } catch { /* fall through */ }

  // ── v4 migration ───────────────────────────────────────────
  try {
    const raw = localStorage.getItem(V4_KEY(uid));
    if (raw) {
      const p = JSON.parse(raw);
      // Start with default order; then append any extra keys from the saved data
      const order = [...DEFAULT_CATEGORY_ORDER];
      Object.keys(p).forEach(cat => { if (!order.includes(cat)) order.push(cat); });
      const items: PackState = {};
      order.forEach(cat => { items[cat] = sanitizeItems(p[cat], cat); });
      return { items, order, meta: defaultMeta(order) };
    }
  } catch { /* fall through */ }

  return null;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function usePackData(userId?: string) {
  const [store, setStore] = useState<Store>(() => {
    const saved = loadFromStorage(userId);
    if (saved) return saved;
    return userId ? emptyData() : seedInitialData();
  });

  useEffect(() => {
    localStorage.setItem(V5_KEY(userId), JSON.stringify({ __v: 5, ...store }));
  }, [store, userId]);

  const updateItem = useCallback((category: string, id: string, updates: Partial<GearItem>) => {
    setStore(prev => {
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
  }, []);

  const addItem = useCallback((category: string, prefill?: Partial<GearItem>) => {
    setStore(prev => ({
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
  }, []);

  const removeItem = useCallback((category: string, id: string) => {
    setStore(prev => ({
      ...prev,
      items: {
        ...prev.items,
        [category]: (prev.items[category] || []).filter(item => item.id !== id),
      },
    }));
  }, []);

  const addCategory = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setStore(prev => {
      if (prev.order.includes(trimmed)) return prev;
      return {
        items: { ...prev.items, [trimmed]: [] },
        order: [...prev.order, trimmed],
        meta: { ...prev.meta, [trimmed]: { countsToBase: true } },
      };
    });
  }, []);

  const deleteCategory = useCallback((name: string) => {
    setStore(prev => {
      const order = prev.order.filter(c => c !== name);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [name]: _i, ...items } = prev.items;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [name]: _m, ...meta } = prev.meta;
      return { items, order, meta };
    });
  }, []);

  const updateCategoryMeta = useCallback((category: string, updates: Partial<CategoryMeta>) => {
    setStore(prev => ({
      ...prev,
      meta: { ...prev.meta, [category]: { ...prev.meta[category], ...updates } },
    }));
  }, []);

  const moveCategory = useCallback((category: string, dir: 'up' | 'down') => {
    setStore(prev => {
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
  }, []);

  const resetToDefaults = useCallback(() => {
    setStore(seedInitialData());
  }, []);

  return {
    data: store.items,
    categoryOrder: store.order,
    categoryMeta: store.meta,
    updateItem,
    addItem,
    removeItem,
    addCategory,
    deleteCategory,
    updateCategoryMeta,
    moveCategory,
    resetToDefaults,
  };
}
