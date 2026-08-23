/**
 * PackDataContext — v3-parity context for the native app.
 *
 * Architecture matches v3's mutateSandbox pattern:
 *   – ALL gear mutations (add/delete/rename/move/category ops/resetAll) go through
 *     mutate(), which pushes the current snapshot to undoStack then applies the change.
 *   – toggleItem (check/uncheck) bypasses mutate() — same as v3 where check/uncheck
 *     does NOT pollute the undo history.
 *   – listName changes bypass mutate() — list name is user metadata, not pack data.
 *   – Undo/redo history: up to HISTORY_LIMIT=30 snapshots of { data, categoryOrder }.
 *
 * Storage keys (AsyncStorage):
 *   pack-checklist-mobile-v1   – PackState (items by category)
 *   twm-catorder               – string[] (runtime category order)
 *   twm-listname               – string (list name)
 *   twm-active-locker-id       – string | null (active saved list id)
 *   twm-locker-v1              – NativeLockerEntry[] (saved lists)
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { INITIAL_DATA } from '@/data/initialData';

// ─── Types ────────────────────────────────────────────────────────────────────

export type GearItem = {
  id: string;
  sub: string;
  desc: string;
  weightOz: number;
  qty: number;
  checked: boolean;
  expendable: boolean;
};

export type PackState = { [category: string]: GearItem[] };

/** Internal snapshot stored in undo/redo stacks. */
type NativeSnapshot = {
  data: PackState;
  categoryOrder: string[];
};

/** Unified runtime state — single source of truth for mutate(). */
type NativeState = NativeSnapshot;

/** Native equivalent of v3's LockerEntry (no background/photo/meta). */
export interface NativeLockerEntry {
  id: string;
  name: string;
  savedAt: number;
  store: {
    data: PackState;
    categoryOrder: string[];
    listName: string;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default ordered category list — used for seeding and as fallback. */
export const CATEGORY_ORDER = [
  'Backpack', 'Shelter', 'Sleep', 'Clothing Packed', 'Kitchen',
  'Electronics', 'Toiletries', 'Med Kit', 'Repair Kit', 'Hydration',
  'Clothing Worn', 'Dog Pack', 'Expendables',
];

const HISTORY_LIMIT = 30;

const STORAGE_KEY   = 'pack-checklist-mobile-v1';
const CATORDER_KEY  = 'twm-catorder';
const LISTNAME_KEY  = 'twm-listname';
const ACTIVE_ID_KEY = 'twm-active-locker-id';
const LOCKER_KEY    = 'twm-locker-v1';

/** Exclusive-check groups (only one item active per sub-label within category). */
const EXCLUSIVE_GROUPS: Array<{ category: string; subs: string[] }> = [
  { category: 'Backpack', subs: ['Backpack'] },
  { category: 'Shelter',  subs: ['Tent', 'Tarp', 'Hammock'] },
  { category: 'Sleep',    subs: ['Sleeping Bag'] },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function seedInitialData(order: string[]): PackState {
  const seeded: PackState = {};
  for (const cat of order) seeded[cat] = [];
  for (const [cat, items] of Object.entries(INITIAL_DATA)) {
    seeded[cat] = (items as Omit<GearItem, 'id'>[]).map(item => ({
      ...item,
      id: generateId(),
    }));
  }
  return seeded;
}

function validateData(parsed: unknown, order: string[]): PackState {
  const validated: PackState = {};
  const src = (parsed && typeof parsed === 'object' && !Array.isArray(parsed))
    ? (parsed as Record<string, unknown>) : {};

  // All categories in the loaded order
  for (const cat of order) {
    const raw = Array.isArray(src[cat]) ? (src[cat] as unknown[]) : [];
    validated[cat] = raw.map((item: unknown) => {
      const i = item as Record<string, unknown>;
      return {
        sub:        String(i.sub        ?? i.desc ?? ''),
        desc:       String(i.desc       ?? i.sub  ?? ''),
        weightOz:   Number(i.weightOz   ?? 0),
        qty:        Number(i.qty        ?? 1),
        checked:    Boolean(i.checked   ?? false),
        expendable: Boolean(i.expendable ?? false),
        id:         String(i.id         ?? generateId()),
      };
    });
  }
  // Categories in data not in order — append them
  for (const cat of Object.keys(src)) {
    if (!validated[cat]) {
      const raw = Array.isArray(src[cat]) ? (src[cat] as unknown[]) : [];
      validated[cat] = raw.map((item: unknown) => {
        const i = item as Record<string, unknown>;
        return {
          sub:        String(i.sub        ?? i.desc ?? ''),
          desc:       String(i.desc       ?? i.sub  ?? ''),
          weightOz:   Number(i.weightOz   ?? 0),
          qty:        Number(i.qty        ?? 1),
          checked:    Boolean(i.checked   ?? false),
          expendable: Boolean(i.expendable ?? false),
          id:         String(i.id         ?? generateId()),
        };
      });
    }
  }
  return validated;
}

// ─── Context type ─────────────────────────────────────────────────────────────

type PackDataContextType = {
  // Current state
  data: PackState;
  categoryOrder: string[];
  isLoading: boolean;

  // List name (not part of undo history — user metadata)
  listName: string;
  setListName: (name: string) => void;

  // Undo / Redo — v3 HISTORY_LIMIT=30, same class of mutations
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;

  // Item mutations (undo-able via mutate())
  toggleItem:  (category: string, id: string) => void;  // NOT undo-able (v3 parity)
  addItem:     (category: string, desc: string, weightOz: number, qty: number) => void;
  deleteItem:  (category: string, id: string) => void;
  renameItem:  (category: string, id: string, newDesc: string) => void;
  updateItem:  (category: string, id: string, patch: Partial<Pick<GearItem, 'weightOz' | 'qty' | 'expendable' | 'sub'>>) => void;
  moveItem:    (fromCat: string, toCat: string, id: string) => void;
  resetAll:    () => void;

  // Category mutations (undo-able via mutate())
  addCategory:        (name: string) => boolean;
  deleteCategory:     (name: string) => void;
  renameCategory:     (oldName: string, newName: string) => boolean;
  reorderCategories:  (newOrder: string[]) => void;

  // Locker
  lockerEntries:       NativeLockerEntry[];
  activeLockerEntryId: string | null;
  refreshLockerEntries: () => Promise<void>;
  saveToLocker:        () => Promise<void>;
  saveAsToLocker:      (name: string) => Promise<void>;
  loadFromLocker:      (entry: NativeLockerEntry) => void;
  deleteLockerEntry:   (id: string) => Promise<void>;
  renameLockerEntry:   (id: string, newName: string) => Promise<void>;
  startNewList:        () => void;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const PackDataContext = createContext<PackDataContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PackDataProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<NativeState>({ data: {}, categoryOrder: [] });
  const [listName, setListName_state] = useState('My Pack');
  const [isLoading, setIsLoading] = useState(true);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [activeLockerEntryId, setActiveLockerEntryId] = useState<string | null>(null);
  const [lockerEntries, setLockerEntries] = useState<NativeLockerEntry[]>([]);

  // Refs for stale-closure-safe access in callbacks
  const currentRef = useRef(current);
  currentRef.current = current;
  const listNameRef = useRef(listName);
  listNameRef.current = listName;
  const activeIdRef = useRef(activeLockerEntryId);
  activeIdRef.current = activeLockerEntryId;
  const undoStackRef = useRef<NativeSnapshot[]>([]);
  const redoStackRef = useRef<NativeSnapshot[]>([]);

  // ── Load ─────────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      try {
        const [rawData, rawOrder, rawName, rawActiveId] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(CATORDER_KEY),
          AsyncStorage.getItem(LISTNAME_KEY),
          AsyncStorage.getItem(ACTIVE_ID_KEY),
        ]);

        const order: string[] = rawOrder
          ? (JSON.parse(rawOrder) as string[])
          : CATEGORY_ORDER.slice();

        const data: PackState = rawData
          ? validateData(JSON.parse(rawData), order)
          : seedInitialData(order);

        setCurrent({ data, categoryOrder: order });
        if (rawName) setListName_state(rawName);
        if (rawActiveId) setActiveLockerEntryId(rawActiveId);
      } catch {
        const order = CATEGORY_ORDER.slice();
        setCurrent({ data: seedInitialData(order), categoryOrder: order });
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // ── Persist on change ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isLoading) {
      AsyncStorage.setItem(STORAGE_KEY,  JSON.stringify(current.data)).catch(() => {});
      AsyncStorage.setItem(CATORDER_KEY, JSON.stringify(current.categoryOrder)).catch(() => {});
    }
  }, [current, isLoading]);

  useEffect(() => {
    if (!isLoading) AsyncStorage.setItem(LISTNAME_KEY, listName).catch(() => {});
  }, [listName, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      if (activeLockerEntryId) AsyncStorage.setItem(ACTIVE_ID_KEY, activeLockerEntryId).catch(() => {});
      else AsyncStorage.removeItem(ACTIVE_ID_KEY).catch(() => {});
    }
  }, [activeLockerEntryId, isLoading]);

  // ── mutate() — core undo-aware state updater ──────────────────────────────────
  // Every undo-able mutation calls this.  Mirrors v3's mutateSandbox().

  const mutate = useCallback((updater: (prev: NativeState) => NativeState) => {
    const snapshot = currentRef.current;
    undoStackRef.current = [...undoStackRef.current.slice(-(HISTORY_LIMIT - 1)), snapshot];
    redoStackRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
    setCurrent(updater);
  }, []);

  // ── Undo / Redo ───────────────────────────────────────────────────────────────

  const undo = useCallback(() => {
    if (undoStackRef.current.length === 0) return;
    const prev = undoStackRef.current[undoStackRef.current.length - 1];
    redoStackRef.current = [...redoStackRef.current, currentRef.current];
    undoStackRef.current = undoStackRef.current.slice(0, -1);
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(true);
    setCurrent(prev);
  }, []);

  const redo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const next = redoStackRef.current[redoStackRef.current.length - 1];
    undoStackRef.current = [...undoStackRef.current, currentRef.current];
    redoStackRef.current = redoStackRef.current.slice(0, -1);
    setCanUndo(true);
    setCanRedo(redoStackRef.current.length > 0);
    setCurrent(next);
  }, []);

  function clearHistory() {
    undoStackRef.current = [];
    redoStackRef.current = [];
    setCanUndo(false);
    setCanRedo(false);
  }

  // ── List name (NOT undo-able — user metadata, same as v3) ────────────────────

  const setListName = useCallback((name: string) => {
    setListName_state(name.trim() || 'My Pack');
  }, []);

  // ── toggleItem (NOT undo-able — v3 parity) ───────────────────────────────────

  const toggleItem = useCallback((category: string, id: string) => {
    setCurrent(prev => {
      const items = prev.data[category] || [];
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
            data: {
              ...prev.data,
              [category]: items.map(item => {
                if (item.id === id) return { ...item, checked: true };
                if (group.subs.includes(item.sub)) return { ...item, checked: false };
                return item;
              }),
            },
          };
        }
      }
      return {
        ...prev,
        data: {
          ...prev.data,
          [category]: items.map(item =>
            item.id === id ? { ...item, checked: newChecked } : item,
          ),
        },
      };
    });
  }, []);

  // ── Item mutations (undo-able) ────────────────────────────────────────────────

  const addItem = useCallback((category: string, desc: string, weightOz: number, qty: number) => {
    const newItem: GearItem = {
      id: generateId(), sub: desc, desc,
      weightOz: Math.max(0, weightOz), qty: Math.max(1, qty),
      checked: false, expendable: false,
    };
    mutate(prev => ({
      ...prev,
      data: { ...prev.data, [category]: [...(prev.data[category] || []), newItem] },
    }));
  }, [mutate]);

  const deleteItem = useCallback((category: string, id: string) => {
    mutate(prev => ({
      ...prev,
      data: { ...prev.data, [category]: (prev.data[category] || []).filter(i => i.id !== id) },
    }));
  }, [mutate]);

  const renameItem = useCallback((category: string, id: string, newDesc: string) => {
    mutate(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [category]: (prev.data[category] || []).map(item =>
          item.id === id ? { ...item, desc: newDesc.trim() } : item,
        ),
      },
    }));
  }, [mutate]);

  const updateItem = useCallback((
    category: string,
    id: string,
    patch: Partial<Pick<GearItem, 'weightOz' | 'qty' | 'expendable' | 'sub'>>,
  ) => {
    mutate(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [category]: (prev.data[category] || []).map(item =>
          item.id === id ? { ...item, ...patch } : item,
        ),
      },
    }));
  }, [mutate]);

  const moveItem = useCallback((fromCat: string, toCat: string, id: string) => {
    mutate(prev => {
      const item = (prev.data[fromCat] || []).find(i => i.id === id);
      if (!item || fromCat === toCat) return prev;
      return {
        ...prev,
        data: {
          ...prev.data,
          [fromCat]: (prev.data[fromCat] || []).filter(i => i.id !== id),
          [toCat]:   [...(prev.data[toCat]   || []), item],
        },
      };
    });
  }, [mutate]);

  const resetAll = useCallback(() => {
    mutate(prev => ({
      ...prev,
      data: Object.fromEntries(
        Object.entries(prev.data).map(([cat, items]) => [
          cat, items.map(item => item.checked ? { ...item, checked: false } : item),
        ]),
      ),
    }));
  }, [mutate]);

  // ── Category mutations (undo-able) ────────────────────────────────────────────

  const addCategory = useCallback((name: string): boolean => {
    const trimmed = name.trim();
    if (!trimmed || currentRef.current.categoryOrder.includes(trimmed)) return false;
    mutate(prev => ({
      categoryOrder: [...prev.categoryOrder, trimmed],
      data: { ...prev.data, [trimmed]: [] },
    }));
    return true;
  }, [mutate]);

  const deleteCategory = useCallback((name: string) => {
    mutate(prev => {
      const { [name]: _dropped, ...rest } = prev.data;
      return {
        categoryOrder: prev.categoryOrder.filter(n => n !== name),
        data: rest,
      };
    });
  }, [mutate]);

  const renameCategory = useCallback((oldName: string, newName: string): boolean => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return false;
    if (currentRef.current.categoryOrder.includes(trimmed)) return false;
    mutate(prev => {
      const newData: PackState = {};
      for (const [k, v] of Object.entries(prev.data)) {
        newData[k === oldName ? trimmed : k] = v;
      }
      return {
        categoryOrder: prev.categoryOrder.map(n => n === oldName ? trimmed : n),
        data: newData,
      };
    });
    return true;
  }, [mutate]);

  const reorderCategories = useCallback((newOrder: string[]) => {
    mutate(prev => ({ ...prev, categoryOrder: newOrder }));
  }, [mutate]);

  // ── Locker helpers ────────────────────────────────────────────────────────────

  const refreshLockerEntries = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(LOCKER_KEY);
      const entries: NativeLockerEntry[] = raw ? JSON.parse(raw) : [];
      setLockerEntries([...entries].sort((a, b) => b.savedAt - a.savedAt));
    } catch {
      setLockerEntries([]);
    }
  }, []);

  const _writeLockerEntries = async (entries: NativeLockerEntry[]) => {
    await AsyncStorage.setItem(LOCKER_KEY, JSON.stringify(entries));
    setLockerEntries([...entries].sort((a, b) => b.savedAt - a.savedAt));
  };

  const _readLockerEntries = async (): Promise<NativeLockerEntry[]> => {
    try {
      const raw = await AsyncStorage.getItem(LOCKER_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  };

  /** Save — updates existing active entry OR creates new with timestamped name (v3 parity). */
  const saveToLocker = useCallback(async () => {
    const state  = currentRef.current;
    const lName  = listNameRef.current;
    const activeId = activeIdRef.current;
    const entries = await _readLockerEntries();

    if (activeId) {
      const idx = entries.findIndex(e => e.id === activeId);
      if (idx !== -1) {
        entries[idx] = { ...entries[idx], savedAt: Date.now(), store: { data: state.data, categoryOrder: state.categoryOrder, listName: lName } };
        await _writeLockerEntries(entries);
        return;
      }
    }
    // Auto-name: "My Pack — Aug 22, 3:45 PM"
    const now  = new Date();
    const name = `${lName} — ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    const entry: NativeLockerEntry = { id: generateId(), name, savedAt: Date.now(), store: { data: state.data, categoryOrder: state.categoryOrder, listName: lName } };
    await _writeLockerEntries([...entries, entry]);
    setActiveLockerEntryId(entry.id);
  }, []);

  /** Save As — always creates a new entry with the provided name. */
  const saveAsToLocker = useCallback(async (name: string) => {
    const state   = currentRef.current;
    const lName   = listNameRef.current;
    const trimmed = name.trim() || lName;
    const entries = await _readLockerEntries();
    const entry: NativeLockerEntry = { id: generateId(), name: trimmed, savedAt: Date.now(), store: { data: state.data, categoryOrder: state.categoryOrder, listName: lName } };
    await _writeLockerEntries([...entries, entry]);
    setActiveLockerEntryId(entry.id);
  }, []);

  /** Load — replaces current state with a saved entry; clears undo/redo (v3 parity). */
  const loadFromLocker = useCallback((entry: NativeLockerEntry) => {
    setCurrent({ data: entry.store.data, categoryOrder: entry.store.categoryOrder });
    setListName_state(entry.store.listName);
    setActiveLockerEntryId(entry.id);
    clearHistory();
  }, []);

  const deleteLockerEntry = useCallback(async (id: string) => {
    const entries = await _readLockerEntries();
    await _writeLockerEntries(entries.filter(e => e.id !== id));
    if (activeIdRef.current === id) setActiveLockerEntryId(null);
  }, []);

  const renameLockerEntry = useCallback(async (id: string, newName: string) => {
    const entries = await _readLockerEntries();
    await _writeLockerEntries(entries.map(e => e.id === id ? { ...e, name: newName.trim() } : e));
  }, []);

  /** Start a new empty list — matches v3's handleCreateNewList. */
  const startNewList = useCallback(() => {
    const order = CATEGORY_ORDER.slice();
    setCurrent({ data: Object.fromEntries(order.map(c => [c, []])), categoryOrder: order });
    setListName_state('New List');
    setActiveLockerEntryId(null);
    clearHistory();
  }, []);

  // ── Context value ─────────────────────────────────────────────────────────────

  const value = useMemo<PackDataContextType>(() => ({
    data:          current.data,
    categoryOrder: current.categoryOrder,
    isLoading,
    listName,
    setListName,
    canUndo, canRedo, undo, redo,
    toggleItem, addItem, deleteItem, renameItem, updateItem, moveItem, resetAll,
    addCategory, deleteCategory, renameCategory, reorderCategories,
    lockerEntries, activeLockerEntryId,
    refreshLockerEntries, saveToLocker, saveAsToLocker,
    loadFromLocker, deleteLockerEntry, renameLockerEntry, startNewList,
  }), [
    current, isLoading, listName, setListName,
    canUndo, canRedo, undo, redo,
    toggleItem, addItem, deleteItem, renameItem, updateItem, moveItem, resetAll,
    addCategory, deleteCategory, renameCategory, reorderCategories,
    lockerEntries, activeLockerEntryId,
    refreshLockerEntries, saveToLocker, saveAsToLocker,
    loadFromLocker, deleteLockerEntry, renameLockerEntry, startNewList,
  ]);

  return (
    <PackDataContext.Provider value={value}>
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
