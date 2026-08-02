import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { INITIAL_DATA } from '@/data/initialData';

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
  "Expendables",
];

// Groups where only one item can be checked at a time
const EXCLUSIVE_GROUPS: Array<{ category: string; subs: string[] }> = [
  { category: 'Backpack', subs: ['Backpack'] },
  { category: 'Shelter',  subs: ['Tent', 'Tarp', 'Hammock'] },
  { category: 'Sleep',    subs: ['Sleeping Bag'] },
];

const STORAGE_KEY = 'pack-checklist-mobile-v1';

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function seedInitialData(): PackState {
  const seeded: PackState = {};
  for (const [cat, items] of Object.entries(INITIAL_DATA)) {
    seeded[cat] = items.map(item => ({ ...item, id: generateId() }));
  }
  CATEGORY_ORDER.forEach(cat => {
    if (!seeded[cat]) seeded[cat] = [];
  });
  return seeded;
}

type PackDataContextType = {
  data: PackState;
  toggleItem: (category: string, id: string) => void;
  isLoading: boolean;
};

const PackDataContext = createContext<PackDataContextType | null>(null);

export function PackDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<PackState>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const validated: PackState = {};
          CATEGORY_ORDER.forEach(cat => {
            validated[cat] = (parsed[cat] || []).map((item: any) => ({
              ...item,
              id: item.id || generateId(),
              expendable: item.expendable ?? false,
            }));
          });
          setData(validated);
        } else {
          setData(seedInitialData());
        }
      } catch {
        setData(seedInitialData());
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
    }
  }, [data, isLoading]);

  const toggleItem = useCallback((category: string, id: string) => {
    setData(prev => {
      const items = prev[category] || [];
      const target = items.find(i => i.id === id);
      if (!target) return prev;

      const newChecked = !target.checked;

      if (newChecked) {
        const group = EXCLUSIVE_GROUPS.find(g => g.category === category);
        if (group && group.subs.includes(target.sub)) {
          return {
            ...prev,
            [category]: items.map(item => {
              if (item.id === id) return { ...item, checked: true };
              if (group.subs.includes(item.sub)) return { ...item, checked: false };
              return item;
            }),
          };
        }
      }

      return {
        ...prev,
        [category]: items.map(item =>
          item.id === id ? { ...item, checked: newChecked } : item
        ),
      };
    });
  }, []);

  return (
    <PackDataContext.Provider value={{ data, toggleItem, isLoading }}>
      {children}
    </PackDataContext.Provider>
  );
}

export function usePackData() {
  const ctx = useContext(PackDataContext);
  if (!ctx) throw new Error('usePackData must be used within PackDataProvider');
  return ctx;
}
