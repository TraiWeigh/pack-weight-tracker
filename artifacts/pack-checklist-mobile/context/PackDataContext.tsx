/**
 * PackDataContext — full mutation set for v3 parity
 *
 * Mutations added beyond the original toggleItem:
 *   addItem, deleteItem, renameItem, updateItem, moveItem, resetAll
 * State added:
 *   listName / setListName (persisted separately)
 *
 * Storage keys:
 *   STORAGE_KEY        — pack data (unchanged from v1)
 *   LISTNAME_KEY       — list name string
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { INITIAL_DATA } from '@/data/initialData';

// ─── Types ────────────────────────────────────────────────────────────────────

export type GearItem = {
  id: string;
  sub: string;          // item type / sub-category label
  desc: string;         // display name (primary label)
  weightOz: number;
  qty: number;
  checked: boolean;
  expendable: boolean;
};

export type PackState = {
  [category: string]: GearItem[];
};

// ─── Category order (matches v3) ──────────────────────────────────────────────

export const CATEGORY_ORDER = [
  'Backpack',
  'Shelter',
  'Sleep',
  'Clothing Packed',
  'Kitchen',
  'Electronics',
  'Toiletries',
  'Med Kit',
  'Repair Kit',
  'Hydration',
  'Clothing Worn',
  'Dog Pack',
  'Expendables',
];

// ─── Exclusive-check groups (only one item active per group) ──────────────────

const EXCLUSIVE_GROUPS: Array<{ category: string; subs: string[] }> = [
  { category: 'Backpack', subs: ['Backpack'] },
  { category: 'Shelter',  subs: ['Tent', 'Tarp', 'Hammock'] },
  { category: 'Sleep',    subs: ['Sleeping Bag'] },
];

// ─── Storage keys ─────────────────────────────────────────────────────────────

const STORAGE_KEY  = 'pack-checklist-mobile-v1';
const LISTNAME_KEY = 'twm-listname';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
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

// ─── Context type ─────────────────────────────────────────────────────────────

type PackDataContextType = {
  data: PackState;
  isLoading: boolean;

  // Identity
  listName: string;
  setListName: (name: string) => void;

  // Core
  toggleItem:  (category: string, id: string) => void;
  resetAll:    () => void;

  // Item CRUD
  addItem:    (category: string, desc: string, weightOz: number, qty: number) => void;
  deleteItem: (category: string, id: string) => void;
  renameItem: (category: string, id: string, newDesc: string) => void;
  updateItem: (category: string, id: string, patch: Partial<Pick<GearItem, 'weightOz' | 'qty' | 'expendable' | 'sub'>>) => void;
  moveItem:   (fromCat: string, toCat: string, id: string) => void;
};

const PackDataContext = createContext<PackDataContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PackDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData]         = useState<PackState>({});
  const [listName, _setListName] = useState<string>('My Pack');
  const [isLoading, setIsLoading] = useState(true);

  // ── Load from storage ──────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      try {
        const [stored, storedName] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(LISTNAME_KEY),
        ]);

        if (stored) {
          const parsed = JSON.parse(stored);
          const validated: PackState = {};
          CATEGORY_ORDER.forEach(cat => {
            validated[cat] = (parsed[cat] || []).map((item: any) => ({
              sub:        item.sub        ?? '',
              desc:       item.desc       ?? item.sub ?? '',
              weightOz:   item.weightOz   ?? 0,
              qty:        item.qty        ?? 1,
              checked:    item.checked    ?? false,
              expendable: item.expendable ?? false,
              id:         item.id         || generateId(),
            }));
          });
          setData(validated);
        } else {
          setData(seedInitialData());
        }

        if (storedName) _setListName(storedName);
      } catch {
        setData(seedInitialData());
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // ── Persist data changes ───────────────────────────────────────────────────

  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
    }
  }, [data, isLoading]);

  // ── List name ──────────────────────────────────────────────────────────────

  const setListName = useCallback((name: string) => {
    _setListName(name);
    AsyncStorage.setItem(LISTNAME_KEY, name).catch(() => {});
  }, []);

  // ── toggleItem ─────────────────────────────────────────────────────────────

  const toggleItem = useCallback((category: string, id: string) => {
    setData(prev => {
      const items = prev[category] || [];
      const target = items.find(i => i.id === id);
      if (!target) return prev;

      const newChecked = !target.checked;
      if (newChecked) {
        const group = EXCLUSIVE_GROUPS.find(
          g => g.category === category && g.subs.includes(target.sub),
        );
        if (group) {
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
          item.id === id ? { ...item, checked: newChecked } : item,
        ),
      };
    });
  }, []);

  // ── resetAll ───────────────────────────────────────────────────────────────

  const resetAll = useCallback(() => {
    setData(prev => {
      const next: PackState = {};
      for (const cat of CATEGORY_ORDER) {
        next[cat] = (prev[cat] || []).map(item =>
          item.checked ? { ...item, checked: false } : item,
        );
      }
      return next;
    });
  }, []);

  // ── addItem ────────────────────────────────────────────────────────────────

  const addItem = useCallback(
    (category: string, desc: string, weightOz: number, qty: number) => {
      const newItem: GearItem = {
        id:         generateId(),
        sub:        desc,  // use desc as sub-label for new items
        desc:       desc,
        weightOz:   Math.max(0, weightOz),
        qty:        Math.max(1, qty),
        checked:    false,
        expendable: false,
      };
      setData(prev => ({
        ...prev,
        [category]: [...(prev[category] || []), newItem],
      }));
    },
    [],
  );

  // ── deleteItem ─────────────────────────────────────────────────────────────

  const deleteItem = useCallback((category: string, id: string) => {
    setData(prev => ({
      ...prev,
      [category]: (prev[category] || []).filter(item => item.id !== id),
    }));
  }, []);

  // ── renameItem ─────────────────────────────────────────────────────────────

  const renameItem = useCallback(
    (category: string, id: string, newDesc: string) => {
      setData(prev => ({
        ...prev,
        [category]: (prev[category] || []).map(item =>
          item.id === id ? { ...item, desc: newDesc.trim() } : item,
        ),
      }));
    },
    [],
  );

  // ── updateItem ─────────────────────────────────────────────────────────────

  const updateItem = useCallback(
    (
      category: string,
      id: string,
      patch: Partial<Pick<GearItem, 'weightOz' | 'qty' | 'expendable' | 'sub'>>,
    ) => {
      setData(prev => ({
        ...prev,
        [category]: (prev[category] || []).map(item =>
          item.id === id ? { ...item, ...patch } : item,
        ),
      }));
    },
    [],
  );

  // ── moveItem ───────────────────────────────────────────────────────────────

  const moveItem = useCallback((fromCat: string, toCat: string, id: string) => {
    setData(prev => {
      const item = (prev[fromCat] || []).find(i => i.id === id);
      if (!item || fromCat === toCat) return prev;
      return {
        ...prev,
        [fromCat]: (prev[fromCat] || []).filter(i => i.id !== id),
        [toCat]:   [...(prev[toCat]   || []), item],
      };
    });
  }, []);

  // ── Context value ──────────────────────────────────────────────────────────

  return (
    <PackDataContext.Provider
      value={{
        data,
        isLoading,
        listName,
        setListName,
        toggleItem,
        resetAll,
        addItem,
        deleteItem,
        renameItem,
        updateItem,
        moveItem,
      }}
    >
      {children}
    </PackDataContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePackData() {
  const ctx = useContext(PackDataContext);
  if (!ctx) throw new Error('usePackData must be used within PackDataProvider');
  return ctx;
}
