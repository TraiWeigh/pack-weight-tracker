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
  "Dog Pack"
];

const STORAGE_KEY = 'pack-checklist-v3';

// Groups where only one item can be checked at a time.
// subs: the sub-type values that compete with each other within that category.
const EXCLUSIVE_GROUPS: Array<{ category: string; subs: string[] }> = [
  { category: 'Backpack', subs: ['Backpack'] },
  { category: 'Shelter',  subs: ['Tent', 'Tarp', 'Hammock'] },
  { category: 'Sleep',    subs: ['Sleeping Bag'] },
];

// Helper to seed IDs
const seedInitialData = (): PackState => {
  const seeded: PackState = {};
  for (const [cat, items] of Object.entries(INITIAL_DATA)) {
    seeded[cat] = items.map(item => ({
      ...item,
      id: crypto.randomUUID()
    }));
  }
  return seeded;
};

export function usePackData() {
  const [data, setData] = useState<PackState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Ensure all categories exist even if stored data is partial
        const validated: PackState = {};
        CATEGORY_ORDER.forEach(cat => {
          validated[cat] = parsed[cat] || [];
        });
        return validated;
      } catch (e) {
        console.error("Failed to parse pack data, using defaults");
      }
    }
    return seedInitialData();
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const updateItem = useCallback((category: string, id: string, updates: Partial<GearItem>) => {
    setData(prev => {
      // If checking an item, see if it belongs to an exclusive group
      if (updates.checked === true) {
        const group = EXCLUSIVE_GROUPS.find(g => g.category === category);
        if (group) {
          const target = prev[category].find(i => i.id === id);
          if (target && group.subs.includes(target.sub)) {
            // Uncheck all other items in this exclusive sub group
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
      sub: 'New Item',
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
    setData(seedInitialData());
  }, []);

  return {
    data,
    updateItem,
    addItem,
    removeItem,
    resetToDefaults
  };
}
