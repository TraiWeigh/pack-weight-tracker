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

export const CATEGORY_ORDER = [
  "Backpack",
  "Shelter",
  "Sleep",
  "Clothing Packed",
  "Kitchen",
  "Electronics",
  "Toiletries",
  "Med Kit",
  "Repair Kit",
  "Hydration",
  "Clothing Worn",
  "Dog Pack",
  "Expendables"
];

// Groups where only one item can be checked at a time.
const EXCLUSIVE_GROUPS: Array<{ category: string; subs: string[] }> = [
  { category: 'Backpack', subs: ['Backpack'] },
  { category: 'Shelter',  subs: ['Tent', 'Tarp', 'Hammock'] },
  { category: 'Sleep',    subs: ['Sleeping Bag'] },
];

const getStorageKey = (userId?: string) =>
  userId ? `pack-checklist-v4-${userId}` : 'pack-checklist-v4-guest';

const seedInitialData = (): PackState => {
  const seeded: PackState = {};
  for (const [cat, items] of Object.entries(INITIAL_DATA)) {
    seeded[cat as string] = items.map(item => ({ ...item, id: crypto.randomUUID() }));
  }
  // Ensure all categories exist
  CATEGORY_ORDER.forEach(cat => {
    if (!seeded[cat]) seeded[cat] = [];
  });
  return seeded;
};

const emptyData = (): PackState => {
  const empty: PackState = {};
  CATEGORY_ORDER.forEach(cat => { empty[cat] = []; });
  return empty;
};

const loadFromStorage = (key: string): PackState | null => {
  const stored = localStorage.getItem(key);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    const validated: PackState = {};
    CATEGORY_ORDER.forEach(cat => {
      validated[cat] = (parsed[cat] || []).map((item: any) => ({
        ...item,
        id: item.id || crypto.randomUUID(),
        expendable: item.expendable ?? false,
      }));
    });
    return validated;
  } catch {
    return null;
  }
};

export function usePackData(userId?: string) {
  const storageKey = getStorageKey(userId);

  const [data, setData] = useState<PackState>(() => {
    const saved = loadFromStorage(storageKey);
    if (saved) return saved;
    // Authenticated new user → empty; guest → Kevin's seed data
    return userId ? emptyData() : seedInitialData();
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(data));
  }, [data, storageKey]);

  const updateItem = useCallback((category: string, id: string, updates: Partial<GearItem>) => {
    setData(prev => {
      if (updates.checked === true) {
        const group = EXCLUSIVE_GROUPS.find(g => g.category === category);
        if (group) {
          const target = prev[category].find(i => i.id === id);
          if (target && group.subs.includes(target.sub)) {
            return {
              ...prev,
              [category]: prev[category].map(item => {
                if (item.id === id) return { ...item, ...updates };
                if (group.subs.includes(item.sub)) return { ...item, checked: false };
                return item;
              }),
            };
          }
        }
      }
      return {
        ...prev,
        [category]: prev[category].map(item =>
          item.id === id ? { ...item, ...updates } : item
        ),
      };
    });
  }, []);

  const addItem = useCallback((category: string) => {
    const newItem: GearItem = {
      id: crypto.randomUUID(),
      sub: '',
      desc: '',
      weightOz: 0,
      qty: 1,
      checked: true,
      expendable: false
    };
    setData(prev => ({
      ...prev,
      [category]: [...(prev[category] || []), newItem]
    }));
  }, []);

  const removeItem = useCallback((category: string, id: string) => {
    setData(prev => ({
      ...prev,
      [category]: prev[category].filter(item => item.id !== id)
    }));
  }, []);

  const resetToDefaults = useCallback(() => {
    // Always reset to Kevin's full gear list regardless of auth state
    setData(seedInitialData());
  }, []);

  return { data, updateItem, addItem, removeItem, resetToDefaults };
}
