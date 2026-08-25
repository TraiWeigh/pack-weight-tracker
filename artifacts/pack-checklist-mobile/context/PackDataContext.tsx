/**
 * PackDataContext — v3-parity context for the native app.
 *
 * Architecture matches v3's mutateSandbox pattern:
 *   – ALL gear mutations (add/delete/rename/move/category ops/resetAll) go through
 *     mutate(), which pushes the current snapshot to undoStack then applies the change.
 *   – toggleItem (check/uncheck) bypasses mutate() — same as v3 where check/uncheck
 *     does NOT pollute the undo history.
 *   – listName / listKind / locations / photoListCaptureDataUrl bypass mutate() —
 *     list metadata, not pack data.
 *   – Undo/redo history: up to HISTORY_LIMIT=30 snapshots of { data, categoryOrder }.
 *
 * Storage keys (AsyncStorage):
 *   pack-checklist-mobile-v1   – PackState (items by category)
 *   twm-catorder               – string[] (runtime category order)
 *   twm-listname               – string (list name)
 *   twm-listkind               – 'standard' | 'photo'
 *   twm-locations              – PackLocation[] (photo list locations)
 *   twm-pending-capture        – string | null (pending photo dataUrl)
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
  photoDataUrl?: string;
  locationId?: string;
};

export type PackState = { [category: string]: GearItem[] };

export type PackLocation = {
  id: string;
  name: string;
  photoDataUrl?: string;
};

/** Internal snapshot stored in undo/redo stacks. */
type NativeSnapshot = {
  data: PackState;
  categoryOrder: string[];
};

/** Unified runtime state — single source of truth for mutate(). */
type NativeState = NativeSnapshot;

/** Native equivalent of v3's LockerEntry. */
export interface NativeLockerEntry {
  id: string;
  name: string;
  savedAt: number;
  store: {
    data: PackState;
    categoryOrder: string[];
    listName: string;
    listKind?: 'standard' | 'photo';
    locations?: PackLocation[];
    photoListCaptureDataUrl?: string | null;
    weightUnit?: 'imperial' | 'metric';   // F-15
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Default ordered category list — used for seeding and as fallback. */
export const CATEGORY_ORDER = [
  'Backpack', 'Shelter', 'Sleep', 'Clothing Packed', 'Kitchen',
  'Electronics', 'Toiletries', 'Med Kit', 'Repair Kit', 'Hydration',
  'Clothing Worn', 'Dog Pack', 'Expendables',
];

/** Structural category for Photo List items (created silently on first assignment). */
export const PHOTO_ITEMS_CATEGORY = 'Items';

const HISTORY_LIMIT = 30;

const STORAGE_KEY        = 'pack-checklist-mobile-v1';
const CATORDER_KEY       = 'twm-catorder';
const LISTNAME_KEY       = 'twm-listname';
const LISTKIND_KEY       = 'twm-listkind';
const LOCATIONS_KEY      = 'twm-locations';
const PENDING_CAPTURE_KEY = 'twm-pending-capture';
const ACTIVE_ID_KEY      = 'twm-active-locker-id';
const LOCKER_KEY         = 'twm-locker-v1';
const TEST_PACK_SEED_KEY = 'twm-test-pack-seed-v1';
const TEST_PACK_LOCKER_SEED_KEY = 'twm-test-pack-locker-seed-v1';
const TEST_PACK_LOCKER_ID = 'twm-default-test-pack-v1';

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

  for (const cat of order) {
    const raw = Array.isArray(src[cat]) ? (src[cat] as unknown[]) : [];
    validated[cat] = raw.map((item: unknown) => {
      const i = item as Record<string, unknown>;
      return {
        sub:          String(i.sub          ?? i.desc ?? ''),
        desc:         String(i.desc         ?? i.sub  ?? ''),
        weightOz:     Number(i.weightOz     ?? 0),
        qty:          Number(i.qty          ?? 1),
        checked:      Boolean(i.checked     ?? false),
        expendable:   Boolean(i.expendable  ?? false),
        id:           String(i.id           ?? generateId()),
        photoDataUrl: typeof i.photoDataUrl === 'string' ? i.photoDataUrl : undefined,
        locationId:   typeof i.locationId   === 'string' ? i.locationId   : undefined,
      };
    });
  }
  for (const cat of Object.keys(src)) {
    if (!validated[cat]) {
      const raw = Array.isArray(src[cat]) ? (src[cat] as unknown[]) : [];
      validated[cat] = raw.map((item: unknown) => {
        const i = item as Record<string, unknown>;
        return {
          sub:          String(i.sub          ?? i.desc ?? ''),
          desc:         String(i.desc         ?? i.sub  ?? ''),
          weightOz:     Number(i.weightOz     ?? 0),
          qty:          Number(i.qty          ?? 1),
          checked:      Boolean(i.checked     ?? false),
          expendable:   Boolean(i.expendable  ?? false),
          id:           String(i.id           ?? generateId()),
          photoDataUrl: typeof i.photoDataUrl === 'string' ? i.photoDataUrl : undefined,
          locationId:   typeof i.locationId   === 'string' ? i.locationId   : undefined,
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

  // List metadata (not part of undo history)
  listName: string;
  setListName: (name: string) => void;

  // Photo List metadata
  listKind: 'standard' | 'photo';
  locations: PackLocation[];
  photoListCaptureDataUrl: string | null;

  // Undo / Redo
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;

  // Weight unit
  weightUnit:    'imperial' | 'metric';
  setWeightUnit: (u: 'imperial' | 'metric') => void;

  // Trail checklist use state
  checklistUse:       Record<string, boolean>;
  toggleChecklistItem:(id: string) => void;
  clearChecklistUse:  () => void;

  // Item mutations (undo-able via mutate())
  toggleItem:  (category: string, id: string) => void;
  addItem:     (category: string, desc: string, weightOz: number, qty: number) => string;
  deleteItem:  (category: string, id: string) => void;
  renameItem:  (category: string, id: string, newDesc: string) => void;
  updateItem:  (category: string, id: string, patch: Partial<Pick<GearItem, 'weightOz' | 'qty' | 'expendable' | 'sub' | 'photoDataUrl' | 'locationId'>>) => void;
  moveItem:    (fromCat: string, toCat: string, id: string) => void;
  resetAll:    () => void;

  // Category mutations (undo-able via mutate())
  addCategory:        (name: string) => boolean;
  deleteCategory:     (name: string) => void;
  renameCategory:     (oldName: string, newName: string) => boolean;
  reorderCategories:  (newOrder: string[]) => void;

  // Photo List actions
  startNewPhotoList:  (name: string) => void;
  addLocation:        (name: string, photoDataUrl: string) => string; // returns new location id
  updateLocation:     (id: string, patch: Partial<Pick<PackLocation, 'name' | 'photoDataUrl'>>) => void;
  setPendingCapture:  (dataUrl: string) => void;
  clearPendingCapture: () => void;
  assignPhotoToItem:  (locationId: string | null) => string; // creates item, returns id

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
  const [listKind, setListKind_state] = useState<'standard' | 'photo'>('standard');
  const [locations, setLocations_state] = useState<PackLocation[]>([]);
  const [photoListCaptureDataUrl, setPhotoListCaptureDataUrl_state] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [activeLockerEntryId, setActiveLockerEntryId] = useState<string | null>(null);
  const [lockerEntries, setLockerEntries] = useState<NativeLockerEntry[]>([]);
  const [weightUnit, setWeightUnit_state] = useState<'imperial' | 'metric'>('imperial');
  const weightUnitRef = useRef<'imperial' | 'metric'>('imperial');   // F-15: stale-closure-safe ref
  const [checklistUse, setChecklistUse]   = useState<Record<string, boolean>>({});

  // Refs for stale-closure-safe access
  const currentRef = useRef(current);
  currentRef.current = current;
  const listNameRef = useRef(listName);
  listNameRef.current = listName;
  const listKindRef = useRef(listKind);
  listKindRef.current = listKind;
  const locationsRef = useRef(locations);
  locationsRef.current = locations;
  const pendingCaptureRef = useRef(photoListCaptureDataUrl);
  pendingCaptureRef.current = photoListCaptureDataUrl;
  const activeIdRef = useRef(activeLockerEntryId);
  // Keep weightUnitRef in sync with state for use in locker helpers
  weightUnitRef.current = weightUnit;
  activeIdRef.current = activeLockerEntryId;
  const undoStackRef = useRef<NativeSnapshot[]>([]);
  const redoStackRef = useRef<NativeSnapshot[]>([]);

  // ── Load ─────────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      try {
        const [rawData, rawOrder, rawName, rawActiveId, rawListKind, rawLocations, rawPending, rawWeightUnit, rawTestPackSeed, rawLocker, rawLockerSeed] =
          await Promise.all([
            AsyncStorage.getItem(STORAGE_KEY),
            AsyncStorage.getItem(CATORDER_KEY),
            AsyncStorage.getItem(LISTNAME_KEY),
            AsyncStorage.getItem(ACTIVE_ID_KEY),
            AsyncStorage.getItem(LISTKIND_KEY),
            AsyncStorage.getItem(LOCATIONS_KEY),
            AsyncStorage.getItem(PENDING_CAPTURE_KEY),
            AsyncStorage.getItem('twm-weight-unit'),    // F-16
            AsyncStorage.getItem(TEST_PACK_SEED_KEY),
            AsyncStorage.getItem(LOCKER_KEY),
            AsyncStorage.getItem(TEST_PACK_LOCKER_SEED_KEY),
          ]);

        const order: string[] = rawOrder
          ? (JSON.parse(rawOrder) as string[])
          : CATEGORY_ORDER.slice();

        let data: PackState = rawData
          ? validateData(JSON.parse(rawData), order)
          : seedInitialData(order);

        // Existing Expo installs may already have persisted an empty default
        // standard list, which previously prevented INITIAL_DATA from loading.
        // Seed that empty default once so a usable pack is always available for
        // testing, while preserving every non-empty or Photo List installation.
        const storedItemCount = Object.values(data).reduce((count, items) => count + items.length, 0);
        const shouldSeedTestPack = !rawTestPackSeed && storedItemCount === 0 && rawListKind !== 'photo';
        if (shouldSeedTestPack) {
          data = seedInitialData(order);
        }
        if (!rawTestPackSeed && (!rawData || shouldSeedTestPack)) {
          await AsyncStorage.setItem(TEST_PACK_SEED_KEY, '1');
        }

        let locker: NativeLockerEntry[] = [];
        try { locker = rawLocker ? JSON.parse(rawLocker) : []; } catch { locker = []; }
        const finalItemCount = Object.values(data).reduce((count, items) => count + items.length, 0);
        const testPackName = 'My Pack';
        const existingTestPack = locker.find(entry => {
          const entryItemCount = Object.values(entry.store?.data || {})
            .reduce((count, items) => count + items.length, 0);
          return entry.id === TEST_PACK_LOCKER_ID ||
            (entry.name === testPackName && entry.store?.listKind !== 'photo' && entryItemCount > 0);
        });
        let seededLockerId: string | null = null;
        if (existingTestPack) {
          seededLockerId = existingTestPack.id;
        } else {
          const canonicalOrder = CATEGORY_ORDER.slice();
          const entry: NativeLockerEntry = {
            id: TEST_PACK_LOCKER_ID,
            name: testPackName,
            savedAt: Date.now(),
            store: {
              data: seedInitialData(canonicalOrder),
              categoryOrder: canonicalOrder,
              listName: testPackName,
              listKind: 'standard',
              locations: [],
              photoListCaptureDataUrl: null,
              weightUnit: rawWeightUnit === 'metric' ? 'metric' : 'imperial',
            },
          };
          locker = [...locker, entry];
          seededLockerId = entry.id;
          await AsyncStorage.setItem(LOCKER_KEY, JSON.stringify(locker));
        }
        if (!rawLockerSeed) {
          await AsyncStorage.setItem(TEST_PACK_LOCKER_SEED_KEY, '1');
        }

        setCurrent({ data, categoryOrder: order });
        setLockerEntries([...locker].sort((a, b) => b.savedAt - a.savedAt));
        if (rawName)     setListName_state(rawName);
        if (rawActiveId) setActiveLockerEntryId(rawActiveId);
        else if (seededLockerId && rawListKind !== 'photo' && finalItemCount > 0) {
          setActiveLockerEntryId(seededLockerId);
          await AsyncStorage.setItem(ACTIVE_ID_KEY, seededLockerId);
        }
        if (rawListKind) setListKind_state(rawListKind as 'standard' | 'photo');
        if (rawLocations) {
          try { setLocations_state(JSON.parse(rawLocations)); } catch { /* ignore */ }
        }
        if (rawPending) setPhotoListCaptureDataUrl_state(rawPending);
        if (rawWeightUnit === 'metric' || rawWeightUnit === 'imperial') setWeightUnit_state(rawWeightUnit);  // F-16
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
    if (!isLoading) AsyncStorage.setItem(LISTKIND_KEY, listKind).catch(() => {});
  }, [listKind, isLoading]);

  useEffect(() => {
    if (!isLoading) AsyncStorage.setItem(LOCATIONS_KEY, JSON.stringify(locations)).catch(() => {});
  }, [locations, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      if (photoListCaptureDataUrl) {
        AsyncStorage.setItem(PENDING_CAPTURE_KEY, photoListCaptureDataUrl).catch(() => {});
      } else {
        AsyncStorage.removeItem(PENDING_CAPTURE_KEY).catch(() => {});
      }
    }
  }, [photoListCaptureDataUrl, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      if (activeLockerEntryId) AsyncStorage.setItem(ACTIVE_ID_KEY, activeLockerEntryId).catch(() => {});
      else AsyncStorage.removeItem(ACTIVE_ID_KEY).catch(() => {});
    }
  }, [activeLockerEntryId, isLoading]);

  // ── mutate() — core undo-aware state updater ──────────────────────────────────

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

  // ── List name ────────────────────────────────────────────────────────────────

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

  const addItem = useCallback((category: string, desc: string, weightOz: number, qty: number): string => {
    const newItem: GearItem = {
      id: generateId(), sub: desc, desc,
      weightOz: Math.max(0, weightOz), qty: Math.max(1, qty),
      checked: false, expendable: false,
    };
    mutate(prev => ({
      ...prev,
      data: { ...prev.data, [category]: [...(prev.data[category] || []), newItem] },
    }));
    return newItem.id;
  }, [mutate]);

  const setWeightUnit = useCallback(async (u: 'imperial' | 'metric') => {
    setWeightUnit_state(u);
    try { await AsyncStorage.setItem('twm-weight-unit', u); } catch {}
  }, []);

  const toggleChecklistItem = useCallback((id: string) => {
    setChecklistUse(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const clearChecklistUse = useCallback(() => {
    setChecklistUse({});
  }, []);

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
          item.id === id ? { ...item, desc: newDesc.trim(), sub: newDesc.trim() } : item,
        ),
      },
    }));
  }, [mutate]);

  const updateItem = useCallback((
    category: string,
    id: string,
    patch: Partial<Pick<GearItem, 'weightOz' | 'qty' | 'expendable' | 'sub' | 'photoDataUrl' | 'locationId'>>,
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

  // ── Photo List actions ────────────────────────────────────────────────────────

  /** Start a new Photo List — clears all data and sets listKind='photo'. */
  const startNewPhotoList = useCallback((name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setCurrent({ data: {}, categoryOrder: [] });
    setListName_state(trimmedName);
    setListKind_state('photo');
    setLocations_state([]);
    setPhotoListCaptureDataUrl_state(null);
    setActiveLockerEntryId(null);
    clearHistory();
  }, []);

  /** Add a location; transfers pending capture to the location. Returns new location id. */
  const addLocation = useCallback((name: string, photoDataUrl: string): string => {
    const id = generateId();
    const loc: PackLocation = { id, name: name.trim(), photoDataUrl };
    setLocations_state(prev => [...prev, loc]);
    setPhotoListCaptureDataUrl_state(null);
    return id;
  }, []);

  /** Update an existing location's name or photo. */
  const updateLocation = useCallback((
    id: string,
    patch: Partial<Pick<PackLocation, 'name' | 'photoDataUrl'>>,
  ) => {
    setLocations_state(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));
  }, []);

  /** Store a captured image as pending (waiting for classification). */
  const setPendingCapture = useCallback((dataUrl: string) => {
    setPhotoListCaptureDataUrl_state(dataUrl);
  }, []);

  /** Clear the pending capture (user chose "Decide later" or assignment complete). */
  const clearPendingCapture = useCallback(() => {
    setPhotoListCaptureDataUrl_state(null);
  }, []);

  /**
   * Assign the pending photo to a new item in the structural 'Items' category.
   * Silently creates 'Items' category if absent.
   * Clears pending capture.
   * Returns the new item id.
   */
  const assignPhotoToItem = useCallback((locationId: string | null): string => {
    const newId = generateId();
    const pendingCapture = pendingCaptureRef.current;

    mutate(prev => {
      // Ensure 'Items' category exists at position 0
      const hasItems = prev.categoryOrder.includes(PHOTO_ITEMS_CATEGORY);
      const newCatOrder = hasItems
        ? prev.categoryOrder
        : [PHOTO_ITEMS_CATEGORY, ...prev.categoryOrder];

      const newItem: GearItem = {
        id: newId,
        sub: '',
        desc: '',
        weightOz: 0,
        qty: 1,
        checked: true,  // auto-check new Photo List items (v3 parity)
        expendable: false,
        photoDataUrl: pendingCapture || undefined,
        locationId: locationId || undefined,
      };

      return {
        categoryOrder: newCatOrder,
        data: {
          ...prev.data,
          [PHOTO_ITEMS_CATEGORY]: [
            ...(prev.data[PHOTO_ITEMS_CATEGORY] || []),
            newItem,
          ],
        },
      };
    });

    // Clear pending capture after assignment
    setPhotoListCaptureDataUrl_state(null);
    return newId;
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

  const saveToLocker = useCallback(async () => {
    const state    = currentRef.current;
    const lName    = listNameRef.current;
    const lKind    = listKindRef.current;
    const locs     = locationsRef.current;
    const pending  = pendingCaptureRef.current;
    const activeId = activeIdRef.current;
    const entries  = await _readLockerEntries();

    const storeBase = {
      data: state.data,
      categoryOrder: state.categoryOrder,
      listName: lName,
      listKind: lKind,
      locations: locs,
      photoListCaptureDataUrl: pending,
      weightUnit: weightUnitRef.current,   // F-15
    };

    if (activeId) {
      const idx = entries.findIndex(e => e.id === activeId);
      if (idx !== -1) {
        entries[idx] = { ...entries[idx], savedAt: Date.now(), store: storeBase };
        await _writeLockerEntries(entries);
        return;
      }
    }
    const now  = new Date();
    const name = `${lName} — ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    const entry: NativeLockerEntry = { id: generateId(), name, savedAt: Date.now(), store: storeBase };
    await _writeLockerEntries([...entries, entry]);
    setActiveLockerEntryId(entry.id);
  }, []);

  const saveAsToLocker = useCallback(async (name: string) => {
    const state   = currentRef.current;
    const lName   = listNameRef.current;
    const lKind   = listKindRef.current;
    const locs    = locationsRef.current;
    const pending = pendingCaptureRef.current;
    const trimmed = name.trim() || lName;
    const entries = await _readLockerEntries();
    const entry: NativeLockerEntry = {
      id: generateId(), name: trimmed, savedAt: Date.now(),
      store: {
        data: state.data, categoryOrder: state.categoryOrder, listName: lName,
        listKind: lKind, locations: locs, photoListCaptureDataUrl: pending,
        weightUnit: weightUnitRef.current,   // F-15
      },
    };
    await _writeLockerEntries([...entries, entry]);
    setActiveLockerEntryId(entry.id);
  }, []);

  const loadFromLocker = useCallback((entry: NativeLockerEntry) => {
    setCurrent({ data: entry.store.data, categoryOrder: entry.store.categoryOrder });
    setListName_state(entry.store.listName);
    setListKind_state(entry.store.listKind || 'standard');
    setLocations_state(entry.store.locations || []);
    setPhotoListCaptureDataUrl_state(entry.store.photoListCaptureDataUrl || null);
    if (entry.store.weightUnit) setWeightUnit_state(entry.store.weightUnit);  // F-15
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

  /** Start a new empty standard list. */
  const startNewList = useCallback(() => {
    const order = CATEGORY_ORDER.slice();
    setCurrent({ data: Object.fromEntries(order.map(c => [c, []])), categoryOrder: order });
    setListName_state('New List');
    setListKind_state('standard');
    setLocations_state([]);
    setPhotoListCaptureDataUrl_state(null);
    setActiveLockerEntryId(null);
    clearHistory();
  }, []);

  // ── Context value ─────────────────────────────────────────────────────────────

  const value = useMemo<PackDataContextType>(() => ({
    data:          current.data,
    categoryOrder: current.categoryOrder,
    isLoading,
    listName,       setListName,
    listKind,       locations,      photoListCaptureDataUrl,
    weightUnit,     setWeightUnit,
    checklistUse,   toggleChecklistItem, clearChecklistUse,
    canUndo,        canRedo,        undo,           redo,
    toggleItem,     addItem,        deleteItem,     renameItem,
    updateItem,     moveItem,       resetAll,
    addCategory,    deleteCategory, renameCategory, reorderCategories,
    startNewPhotoList, addLocation, updateLocation, setPendingCapture, clearPendingCapture, assignPhotoToItem,
    lockerEntries,  activeLockerEntryId,
    refreshLockerEntries, saveToLocker, saveAsToLocker,
    loadFromLocker, deleteLockerEntry, renameLockerEntry, startNewList,
  }), [
    current, isLoading, listName, setListName,
    listKind, locations, photoListCaptureDataUrl,
    weightUnit, setWeightUnit, checklistUse, toggleChecklistItem, clearChecklistUse,
    canUndo, canRedo, undo, redo,
    toggleItem, addItem, deleteItem, renameItem, updateItem, moveItem, resetAll,
    addCategory, deleteCategory, renameCategory, reorderCategories,
    startNewPhotoList, addLocation, updateLocation, setPendingCapture, clearPendingCapture, assignPhotoToItem,
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
