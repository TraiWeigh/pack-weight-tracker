/**
 * SharedChecklistPage
 *
 * Renders a fully interactive, in-memory copy of a shared pack list.
 * Recipient changes update React state only — nothing is ever written to
 * localStorage, IndexedDB, or the API.  Refreshing the page re-fetches the
 * immutable snapshot from the API, resetting all changes.
 *
 * "Save Your Own Copy" writes a brand-new Locker entry (new UUID) into the
 * RECIPIENT's localStorage — it never touches the sender's Locker or the
 * stored snapshot.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useUser, useClerk } from '@clerk/react';
import { useParams, useLocation } from 'wouter';
import { GearCategory } from '../components/GearCategory';
import { WeightSummary } from '../components/WeightSummary';
import { PrintLayout } from '../components/PrintLayout';
import { PreviewModal, PreviewBody } from '../components/PreviewModal';
import { ImportGearPanel } from '../components/ImportGearPanel';
import { UnitProvider, useUnit } from '../context/UnitContext';
import { sharePackList } from '../lib/exportPDF';
import { LOCKER_KEY } from '../hooks/usePackData';
import type { PackState, GearItem, CategoryMeta } from '../hooks/usePackData';
import type { LockerEntry } from '../components/LockerPanel';
import {
  BackgroundPickerButton, BackgroundPickerPanel,
  Background, PRESETS, getFullUrl,
} from '../components/BackgroundPicker';
import { getPhotoBlob, createPhotoObjectUrl, revokePhotoObjectUrl } from '../lib/bgPhotoStore';
import type { SharePayload, SharedLockerFile } from '../lib/shareLink';
import {
  Tent, Printer, Share2, FileDown, Plus, Check, X,
  User, UserPlus, LogOut, Info, FolderOpen, ChevronDown, ChevronUp,
} from 'lucide-react';

// ── Types that mirror usePackData ─────────────────────────────────────────────

type Store = {
  items: PackState;
  order: string[];
  meta: Record<string, CategoryMeta>;
};

/** Per-file temporary edit state — stored in a Map keyed by file ID. */
type TempFileState = {
  store: Store;
  background: Background | null;
  bgFade: number;
  bgTone: 'light' | 'dark';
  bgSize: 'cover' | 'contain';
};

/** Key used in the tempEdits Map for the primary (top-level) snapshot. */
const PRIMARY_KEY = '__primary__';

// ── Exclusive groups — mirrors usePackData ───────────────────────────────────

const EXCLUSIVE_GROUPS: Array<{ category: string; subs: string[] }> = [
  { category: 'Backpack', subs: ['Backpack'] },
  { category: 'Shelter',  subs: ['Tent', 'Tarp', 'Hammock'] },
  { category: 'Sleep',    subs: ['Sleeping Bag'] },
];

const MAX_HISTORY = 100;

// ── Shared Locker panel (view-only — no Rename, no Delete) ───────────────────

/**
 * Renders the view-only list of shared files.
 * Viewers can open/browse files but may NOT rename or delete them.
 * Controls for Rename (Pencil) and Delete (Trash) are intentionally absent.
 */
function SharedLockerPanel({
  files,
  activeId,
  onOpen,
}: {
  files: SharedLockerFile[];
  activeId: string | null;
  onOpen: (file: SharedLockerFile) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 p-4 sm:p-5 border-b border-border bg-muted/20 text-left hover:bg-muted/30 transition-colors"
      >
        {open
          ? <ChevronUp   className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        }
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-foreground">
            <h2 className="font-semibold text-base">Shared Files</h2>
            {files.length > 0 && (
              <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {files.length}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Browse shared gear lists. Changes are temporary.
          </p>
        </div>
      </button>

      {open && (
        <div className="divide-y divide-border">
          {files.map(file => (
            /*
             * The ENTIRE ROW is the click target so users can tap the file name
             * text or anywhere in the row to open the file — not just the small
             * folder icon.  Rename and Delete controls are intentionally absent.
             */
            <div
              key={file.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpen(file)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(file); } }}
              title={`Open "${file.name}"`}
              className={`px-4 py-3 flex items-center gap-3 hover:bg-muted/20 transition-colors group cursor-pointer${
                activeId === file.id ? ' bg-primary/5' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate${
                  activeId === file.id ? ' text-primary' : ' text-foreground'
                }`}>{file.name}</p>
              </div>
              {/* Folder icon — visual affordance only; the whole row is the click target */}
              <span
                aria-hidden="true"
                className="p-1.5 rounded text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 opacity-60 group-hover:opacity-100"
              >
                <FolderOpen className="w-3.5 h-3.5" />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Unit toggle ───────────────────────────────────────────────────────────────

function UnitToggle() {
  const { system, setSystem } = useUnit();
  return (
    <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
      <button
        onClick={() => setSystem('imperial')}
        className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
          system === 'imperial' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Imperial
      </button>
      <button
        onClick={() => setSystem('metric')}
        className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
          system === 'metric' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Metric
      </button>
    </div>
  );
}

// ── Shared checklist content ──────────────────────────────────────────────────

interface SharedChecklistContentProps {
  snapshot: SharePayload;
  userId?: string;
  userEmail?: string;
  isGuest: boolean;
}

function SharedChecklistContent({
  snapshot,
  userId,
  userEmail,
  isGuest,
}: SharedChecklistContentProps) {
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();
  const { system } = useUnit();

  // ── In-memory store — NO localStorage writes ─────────────────────────────

  const [store, setStore] = useState<Store>(() => ({
    items: snapshot.data,
    order: snapshot.categoryOrder,
    meta:  snapshot.categoryMeta,
  }));

  const undoStackRef = useRef<Store[]>([]);
  const redoStackRef = useRef<Store[]>([]);
  const [historyVersion, setHistoryVersion] = useState(0);
  historyVersion; // referenced so linter doesn't complain
  const canUndo = undoStackRef.current.length > 0;
  const canRedo  = redoStackRef.current.length > 0;

  // ── Multi-file: active shared file + per-file temp edit stash ─────────────

  /** ID of the currently displayed shared file, or null = primary snapshot. */
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  /**
   * Per-file in-memory state stash — keyed by SharedLockerFile.id or PRIMARY_KEY.
   * Never written to localStorage; survives only for this browser session.
   */
  const tempEditsRef = useRef<Map<string, TempFileState>>(new Map());

  /** Push current store onto undo stack then apply fn. Never touches localStorage. */
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
    if (!stack.length) return;
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
    if (!stack.length) return;
    const next = stack[0];
    redoStackRef.current = stack.slice(1);
    setStore(current => {
      undoStackRef.current = [...undoStackRef.current.slice(-(MAX_HISTORY - 1)), current];
      return next;
    });
    setHistoryVersion(v => v + 1);
  }, []);

  // ── Mutations (in-memory only) ────────────────────────────────────────────

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

  const moveItem = useCallback((sourceCategory: string, destinationCategory: string, itemId: string) => {
    pushAndSet(prev => {
      const item = (prev.items[sourceCategory] || []).find((i: GearItem) => i.id === itemId);
      if (!item) return prev;
      return {
        ...prev,
        items: {
          ...prev.items,
          [sourceCategory]:      (prev.items[sourceCategory] || []).filter((i: GearItem) => i.id !== itemId),
          [destinationCategory]: [...(prev.items[destinationCategory] || []), item],
        },
      };
    });
  }, [pushAndSet]);

  const addCategory = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    pushAndSet(prev => {
      if (prev.order.includes(trimmed)) return prev;
      return {
        items: { ...prev.items, [trimmed]: [] },
        order: [...prev.order, trimmed],
        meta:  { ...prev.meta,  [trimmed]: { countsToBase: true } },
      };
    });
  }, [pushAndSet]);

  const deleteCategory = useCallback((name: string) => {
    pushAndSet(prev => {
      const order = prev.order.filter(c => c !== name);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [name]: _i, ...items } = prev.items;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [name]: _m, ...meta  } = prev.meta;
      return { items, order, meta };
    });
  }, [pushAndSet]);

  const renameCategory = useCallback((oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;
    pushAndSet(prev => {
      if (prev.order.includes(trimmed)) return prev;
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

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isInput) return;
      const meta = e.ctrlKey || e.metaKey;
      if (!meta) return;
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  // ── In-memory background (no localStorage writes) ─────────────────────────

  const [background,   setBackground]   = useState<Background | null>(snapshot.background ?? null);
  const [bgFade,       setBgFade]       = useState<number>(snapshot.bgFade ?? 1);
  const [bgTone,       setBgTone]       = useState<'light' | 'dark'>(snapshot.bgTone ?? 'light');
  const [bgSize,       setBgSize]       = useState<'cover' | 'contain'>(snapshot.bgSize ?? 'cover');
  const [bgPickerOpen, setBgPickerOpen] = useState(false);
  const bgPickerRef = useRef<HTMLDivElement>(null);

  // ── Switch between shared files ───────────────────────────────────────────

  /**
   * Switch the viewer to a different shared file.
   * - Stashes current temp state under the current file's key.
   * - Loads the target file's stashed state (or original snapshot data).
   * - Resets undo/redo (history is per-file conceptually; switching starts fresh).
   * - NEVER touches sender Locker, localStorage, or IndexedDB.
   */
  const switchToFile = useCallback((fileId: string | null) => {
    // Stash current temp state
    const currentKey = activeFileId ?? PRIMARY_KEY;
    tempEditsRef.current.set(currentKey, { store, background, bgFade, bgTone, bgSize });

    // Load the target file's state from stash or from original snapshot
    const newKey = fileId ?? PRIMARY_KEY;
    const stashed = tempEditsRef.current.get(newKey);

    let next: TempFileState;
    if (stashed) {
      next = stashed;
    } else if (fileId === null) {
      // Restore primary snapshot original
      next = {
        store:      { items: snapshot.data, order: snapshot.categoryOrder, meta: snapshot.categoryMeta },
        background: snapshot.background ?? null,
        bgFade:     snapshot.bgFade ?? 1,
        bgTone:     snapshot.bgTone ?? 'light',
        bgSize:     snapshot.bgSize ?? 'cover',
      };
    } else {
      const file = snapshot.lockerFiles?.find(f => f.id === fileId);
      if (!file) return; // unknown file — ignore
      next = {
        store:      file.store,
        background: file.background ?? null,
        bgFade:     file.bgFade ?? 1,
        bgTone:     file.bgTone ?? 'light',
        bgSize:     file.bgSize ?? 'cover',
      };
    }

    // Apply new state directly — direct setStore, not the undo-pushing helper
    setStore(next.store);
    setBackground(next.background);
    setBgFade(next.bgFade);
    setBgTone(next.bgTone);
    setBgSize(next.bgSize);
    // Reset undo/redo for the incoming file context
    undoStackRef.current = [];
    redoStackRef.current = [];
    setHistoryVersion(0);
    setActiveFileId(fileId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFileId, store, background, bgFade, bgTone, bgSize, snapshot]);

  // ── Custom background object URL (resolved async from recipient's IndexedDB)
  const [customBgObjectUrl, setCustomBgObjectUrl] = useState<string | null>(null);
  const customBgObjectUrlRef = useRef<string | null>(null);

  const activePhotoId =
    background?.type === 'custom'
      ? (background as { type: 'custom'; photoId: string }).photoId
      : null;

  useEffect(() => {
    if (!activePhotoId) {
      if (customBgObjectUrlRef.current) {
        revokePhotoObjectUrl(customBgObjectUrlRef.current);
        customBgObjectUrlRef.current = null;
      }
      setCustomBgObjectUrl(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const prev = customBgObjectUrlRef.current;
      customBgObjectUrlRef.current = null;
      if (prev) revokePhotoObjectUrl(prev);
      // Snapshot backgrounds with custom photoId are not available to the recipient;
      // only photos in the recipient's own IndexedDB library can be displayed.
      const blob = await getPhotoBlob(activePhotoId);
      if (!cancelled) {
        if (blob) {
          const url = createPhotoObjectUrl(blob);
          customBgObjectUrlRef.current = url;
          setCustomBgObjectUrl(url);
        } else {
          // Photo not in recipient's library (sender's photo) — show no background.
          setCustomBgObjectUrl(null);
        }
      }
    })();
    return () => {
      cancelled = true;
      if (customBgObjectUrlRef.current) {
        revokePhotoObjectUrl(customBgObjectUrlRef.current);
        customBgObjectUrlRef.current = null;
      }
    };
  }, [activePhotoId]);

  const bgImageUrl = background
    ? background.type === 'preset'
      ? getFullUrl(PRESETS.find(p => p.id === background.id)?.photoId ?? '')
      : customBgObjectUrl
    : null;

  // ── Open / Close all categories ───────────────────────────────────────────

  const [allOpen,       setAllOpen]       = useState(true);
  const [openCloseSeq,  setOpenCloseSeq]  = useState(0);

  // ── Add Category ──────────────────────────────────────────────────────────

  const [addingCat,    setAddingCat]    = useState(false);
  const [newCatName,   setNewCatName]   = useState('');
  const newCatInputRef = useRef<HTMLInputElement>(null);

  const handleAddCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    addCategory(name);
    setNewCatName('');
    setAddingCat(false);
  };

  const openAddCat = () => {
    setAddingCat(true);
    setTimeout(() => newCatInputRef.current?.focus(), 50);
  };

  // ── Drag-to-reorder ───────────────────────────────────────────────────────

  const [dragCat, setDragCat] = useState<string | null>(null);
  const [overCat, setOverCat] = useState<string | null>(null);

  // ── Preview ───────────────────────────────────────────────────────────────

  const [showPreview, setShowPreview] = useState(false);

  // ── Share PDF ─────────────────────────────────────────────────────────────

  const [sharing, setSharing] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const handleSharePdf = () => {
    setSharing(true);
    try {
      sharePackList(store.items, system, store.order, store.meta);
    } finally {
      setSharing(false);
    }
  };

  // ── Save Your Own Copy ────────────────────────────────────────────────────

  const [showSaveDialog,    setShowSaveDialog]    = useState(false);
  const [saveName,          setSaveName]          = useState('');
  const [saveConflictId,    setSaveConflictId]    = useState<string | null>(null);
  const [saveSuccess,       setSaveSuccess]       = useState<string | null>(null);
  const saveInputRef = useRef<HTMLInputElement>(null);

  const openSaveDialog = () => {
    if (isGuest) {
      const base = (import.meta.env.BASE_URL as string).replace(/\/$/, '');
      window.location.href = `${base}/sign-up`;
      return;
    }
    setShowSaveDialog(true);
    setSaveConflictId(null);
    setSaveSuccess(null);
    setTimeout(() => saveInputRef.current?.focus(), 50);
  };

  const closeSaveDialog = () => {
    setShowSaveDialog(false);
    setSaveName('');
    setSaveConflictId(null);
  };

  /** Read the recipient's own Locker entries (their localStorage). */
  function readLockerEntries(): LockerEntry[] {
    try {
      const raw = localStorage.getItem(LOCKER_KEY);
      return raw ? JSON.parse(raw) as LockerEntry[] : [];
    } catch { return []; }
  }

  /** Write to the recipient's Locker. Never touches the sender's data. */
  function writeLockerEntry(entry: LockerEntry) {
    try {
      const entries = readLockerEntries();
      const updated = [entry, ...entries.filter(e => e.id !== entry.id)];
      localStorage.setItem(LOCKER_KEY, JSON.stringify(updated));
      // Notify other tabs of this user that the Locker changed
      try {
        const ch = new BroadcastChannel('gear-locker-sync');
        ch.postMessage({ type: 'locker-update', entries: updated });
        ch.close();
      } catch { /* ignore */ }
    } catch { /* ignore */ }
  }

  const commitSave = useCallback((name: string, existingId?: string) => {
    const id = existingId ?? crypto.randomUUID();
    const entry: LockerEntry = {
      id,
      name,
      savedAt: Date.now(),
      store,          // recipient's current in-memory state (may include their edits)
      background,
      bgFade,
      bgTone,
      bgSize,         // preserve the viewed file's Fill/Fit setting in the saved copy
    };
    writeLockerEntry(entry);
    closeSaveDialog();
    setSaveSuccess(name);
    setTimeout(() => setSaveSuccess(null), 4000);

    // Open their copy in a new tab via the normal Locker load mechanism
    const base = (import.meta.env.BASE_URL as string).replace(/\/$/, '');
    const tab = window.open(`${window.location.origin}${base}/checklist?savedListId=${id}`, '_blank');
    if (!tab) {
      // Pop-up blocked — silently saved; they can open from Locker
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, background, bgFade, bgTone, bgSize]);

  const handleSaveToLocker = () => {
    const name = saveName.trim();
    if (!name) return;
    const entries = readLockerEntries();
    const existing = entries.find(e => e.name === name);
    if (existing) {
      setSaveConflictId(existing.id);
      return;
    }
    commitSave(name);
  };

  // ── Toolbar button style ──────────────────────────────────────────────────

  const toolBtn = 'flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-muted/50';
  const toolBtnDisabled = 'flex items-center gap-2 text-xs font-medium text-muted-foreground/30 px-2 py-1.5 rounded-md cursor-not-allowed';

  // ── User menu ─────────────────────────────────────────────────────────────

  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = () => {
    signOut({ redirectUrl: import.meta.env.BASE_URL || '/' });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Full-page wrapper with background ── */}
      <div
        className={`screen-only h-[100dvh] overflow-hidden flex flex-col bg-background${bgTone === 'dark' ? ' screen-dark' : ''}`}
        style={{
          ...(bgImageUrl ? {
            backgroundImage: bgFade < 1
              ? `linear-gradient(rgba(${bgTone === 'dark' ? '0,0,0' : '255,255,255'},${1 - bgFade}),rgba(${bgTone === 'dark' ? '0,0,0' : '255,255,255'},${1 - bgFade})),url(${bgImageUrl})`
              : `url(${bgImageUrl})`,
            backgroundSize: bgFade < 1 ? `100% 100%, ${bgSize}` : bgSize,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          } : {}),
        }}
      >
        {/* ── Header ── */}
        <header className="bg-card border-b border-border flex-shrink-0 z-10 shadow-sm">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
            {/* Logo */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="bg-primary/10 p-2 rounded-lg text-primary">
                <Tent className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-foreground text-xl leading-tight">TrailWeigh</h1>
                <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest">Gear Tracker</p>
              </div>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-1 min-w-0">

              {/* Undo */}
              <button
                onClick={undo}
                disabled={!canUndo}
                title={canUndo ? 'Undo (Ctrl+Z)' : 'Nothing to undo'}
                className={canUndo ? toolBtn : toolBtnDisabled}
              >
                <img src="/undo-icon.png" alt="Undo" className="w-5 h-5 min-w-[20px] object-contain flex-shrink-0" />
                <span className="hidden md:inline">Undo</span>
              </button>

              {/* Redo */}
              <button
                onClick={redo}
                disabled={!canRedo}
                title={canRedo ? 'Redo (Ctrl+Y)' : 'Nothing to redo'}
                className={canRedo ? toolBtn : toolBtnDisabled}
              >
                <img src="/redo-icon.png" alt="Redo" className="w-5 h-5 min-w-[20px] object-contain flex-shrink-0" />
                <span className="hidden md:inline">Redo</span>
              </button>

              {/* Save Your Own Copy */}
              {showSaveDialog ? (
                saveConflictId ? (
                  <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-4 duration-200">
                    <span className="text-xs text-muted-foreground hidden sm:inline truncate max-w-[120px]">
                      "{saveName}" exists:
                    </span>
                    <button
                      onClick={() => commitSave(saveName.trim(), saveConflictId)}
                      className="text-xs font-semibold bg-destructive text-destructive-foreground px-2.5 py-1.5 rounded-md hover:bg-destructive/90 transition-colors"
                    >
                      Replace
                    </button>
                    <button
                      onClick={() => commitSave(saveName.trim())}
                      className="text-xs font-semibold bg-primary text-primary-foreground px-2.5 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Save as New
                    </button>
                    <button
                      onClick={() => setSaveConflictId(null)}
                      className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      title="Back"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-4 duration-200">
                    <input
                      ref={saveInputRef}
                      type="text"
                      value={saveName}
                      onChange={e => setSaveName(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveToLocker();
                        if (e.key === 'Escape') closeSaveDialog();
                      }}
                      placeholder="List name…"
                      maxLength={40}
                      className="text-xs border border-border rounded-md px-2 py-1.5 bg-background focus:outline-none focus:border-primary/50 w-28 sm:w-36 text-foreground placeholder:text-muted-foreground"
                    />
                    <button
                      onClick={handleSaveToLocker}
                      disabled={!saveName.trim()}
                      className="text-xs font-semibold bg-primary text-primary-foreground px-2.5 py-1.5 rounded-md hover:bg-primary/90 disabled:opacity-40 transition-colors"
                    >
                      Save
                    </button>
                    <button onClick={closeSaveDialog} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              ) : (
                <button
                  onClick={openSaveDialog}
                  title={isGuest ? 'Sign in to save your own copy' : 'Save your own copy to your Locker'}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Save Your Own Copy</span>
                  <span className="sm:hidden">Save Copy</span>
                </button>
              )}

              {/* Divider */}
              <div className="w-px h-5 bg-border mx-1 flex-shrink-0" />

              {/* User menu / guest CTA */}
              {isGuest ? (
                <button
                  onClick={() => setLocation('/sign-up')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 bg-card hover:bg-muted/50 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign in</span>
                </button>
              ) : (
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setShowUserMenu(v => !v)}
                    className={toolBtn}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline max-w-[100px] truncate">{userEmail || 'Account'}</span>
                  </button>
                  {showUserMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                      <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-20 min-w-[160px] py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                        <div className="px-3 py-2 border-b border-border">
                          <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                        </div>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Shared-list banner ── */}
          <div className="border-t border-border bg-primary/5">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <Info className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <p className="text-xs text-muted-foreground truncate">
                  {(() => {
                    const currentName = activeFileId
                      ? (snapshot.lockerFiles?.find(f => f.id === activeFileId)?.name ?? snapshot.name)
                      : snapshot.name;
                    return currentName ? (
                      <>Viewing <span className="font-semibold text-foreground">"{currentName}"</span> — your changes are temporary and reset on refresh.</>
                    ) : (
                      'Viewing a shared list — your changes here are temporary and reset on refresh.'
                    );
                  })()}
                </p>
              </div>
              {saveSuccess && (
                <span className="text-xs font-semibold text-primary flex-shrink-0 animate-in fade-in duration-300">
                  ✓ Saved as "{saveSuccess}"
                </span>
              )}
            </div>
          </div>
        </header>

        {/* ── Main layout (mirrors ChecklistContent) ── */}
        <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 flex-1 min-h-0 lg:overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 lg:h-full">

            {/* ── Gear list ── */}
            <div className="lg:col-span-8 lg:h-full lg:flex lg:flex-col lg:overflow-hidden">
              {/* Pinned pills row */}
              <div className="pt-8 pb-3 flex items-center justify-between lg:pr-3 flex-shrink-0">
                <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
                  <button
                    onClick={() => { setAllOpen(true); setOpenCloseSeq(s => s + 1); }}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                      allOpen ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Open
                  </button>
                  <button
                    onClick={() => { setAllOpen(false); setOpenCloseSeq(s => s + 1); }}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                      !allOpen ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Close
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowPreview(true)}
                    className="flex items-center bg-muted rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Preview
                  </button>
                  <UnitToggle />
                </div>
              </div>

              {/* Scrollable categories */}
              <div className="lg:flex-1 lg:overflow-y-auto lg:min-h-0 space-y-2 pb-8 lg:pr-3 lg:[scrollbar-gutter:stable]">
                {store.order.map(category => (
                  <GearCategory
                    key={category}
                    name={category}
                    items={store.items[category] || []}
                    meta={store.meta[category] ?? { countsToBase: true }}
                    order={store.order}
                    forceOpen={allOpen}
                    forceOpenSeq={openCloseSeq}
                    updateItem={updateItem}
                    removeItem={removeItem}
                    moveItem={moveItem}
                    addItem={addItem}
                    onUpdateMeta={updates => updateCategoryMeta(category, updates)}
                    onDelete={() => deleteCategory(category)}
                    onRename={newName => renameCategory(category, newName)}
                    isDragOver={overCat === category && dragCat !== category}
                    onDragStart={() => setDragCat(category)}
                    onDragEnd={() => { setDragCat(null); setOverCat(null); }}
                    onDragOver={e => { e.preventDefault(); if (dragCat && dragCat !== category) setOverCat(category); }}
                    onDragLeave={() => setOverCat(prev => prev === category ? null : prev)}
                    onDrop={e => {
                      e.preventDefault();
                      if (dragCat && dragCat !== category) reorderCategory(dragCat, category);
                      setDragCat(null);
                      setOverCat(null);
                    }}
                  />
                ))}

                {/* Add Category */}
                <div className="mt-2">
                  {addingCat ? (
                    <div className="flex items-center gap-2 p-3 bg-card border border-primary/40 rounded-lg shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                      <input
                        ref={newCatInputRef}
                        type="text"
                        value={newCatName}
                        onChange={e => setNewCatName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleAddCategory();
                          if (e.key === 'Escape') { setAddingCat(false); setNewCatName(''); }
                        }}
                        placeholder="Category name…"
                        maxLength={40}
                        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                      />
                      <button
                        onClick={handleAddCategory}
                        disabled={!newCatName.trim()}
                        className="flex items-center gap-1 text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 disabled:opacity-40 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Add
                      </button>
                      <button
                        onClick={() => { setAddingCat(false); setNewCatName(''); }}
                        className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={openAddCat}
                      className="w-full flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 px-4 py-3 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Category
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── Sidebar ── */}
            <div className="lg:col-span-4 order-first lg:order-last lg:h-full lg:flex lg:flex-col lg:overflow-hidden">
              {/* Pinned action bar */}
              <div className="relative flex flex-wrap justify-center gap-2 pt-8 pb-3 lg:px-3 flex-shrink-0">
                <div ref={bgPickerRef}>
                  <BackgroundPickerButton onClick={() => setBgPickerOpen(o => !o)} active={!!background} panelOpen={bgPickerOpen} />
                  <BackgroundPickerPanel
                    open={bgPickerOpen}
                    onClose={() => setBgPickerOpen(false)}
                    background={background}
                    onBackgroundChange={bg => {
                      setBackground(bg);
                      // In shared mode: do NOT write to localStorage
                    }}
                    bgFade={bgFade}
                    onBgFadeChange={setBgFade}
                    bgTone={bgTone}
                    onBgToneChange={setBgTone}
                    bgSize={bgSize}
                    onBgSizeChange={setBgSize}
                    containerRef={bgPickerRef as React.RefObject<HTMLDivElement>}
                    onShowcase={undefined}
                    isShowcaseBlocked={true}
                  />
                </div>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 bg-card hover:bg-muted/50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
                {/* Share pill — PDF download only; recipients can't re-share via Copy Link here */}
                <div className="relative">
                  <button
                    onClick={() => setShowShareMenu(o => !o)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 bg-card hover:bg-muted/50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share
                  </button>
                  {showShareMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowShareMenu(false)} />
                      <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-20 min-w-[160px] py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                        <button
                          onClick={() => { handleSharePdf(); setShowShareMenu(false); }}
                          disabled={sharing}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted/60 transition-colors disabled:opacity-50"
                        >
                          <FileDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          {sharing ? 'Preparing…' : 'Download PDF'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Scrollable sidebar content */}
              <div className="lg:flex-1 lg:overflow-y-auto lg:min-h-0 lg:px-3 lg:[scrollbar-gutter:stable]">
                <div className="flex flex-col gap-4 py-2 pb-8">
                  <WeightSummary
                    data={store.items}
                    categoryOrder={store.order}
                    categoryMeta={store.meta}
                  />
                  <ImportGearPanel
                    categoryOrder={store.order}
                    onAddItem={(category, prefill) => addItem(category, prefill)}
                  />
                  {/* View-only Shared Locker — browse files, no Rename/Delete (lower panel, same position as owner Locker) */}
                  {snapshot.lockerFiles && snapshot.lockerFiles.length > 0 && (
                    <SharedLockerPanel
                      files={snapshot.lockerFiles}
                      activeId={activeFileId}
                      onOpen={f => switchToFile(f.id)}
                    />
                  )}
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* ── Preview modal ── */}
      {showPreview && (
        <PreviewModal
          data={store.items}
          system={system}
          categoryOrder={store.order}
          categoryMeta={store.meta}
          onClose={() => setShowPreview(false)}
          onPrint={() => window.print()}
        />
      )}

      {/* ── Print-only layout ── */}
      <PrintLayout
        data={store.items}
        system={system}
        categoryOrder={store.order}
        categoryMeta={store.meta}
      />
    </>
  );
}

// ── Snapshot loader ───────────────────────────────────────────────────────────

function sanitizeItems(raw: unknown[]): GearItem[] {
  return (raw || []).map((item: any) => ({
    id:         item.id         || crypto.randomUUID(),
    sub:        item.sub        ?? '',
    desc:       item.desc       ?? '',
    weightOz:   item.weightOz   ?? 0,
    qty:        item.qty        ?? 1,
    checked:    item.checked    ?? false,
    expendable: item.expendable ?? false,
  }));
}

/**
 * Normalize one raw lockerFile entry from the share payload.
 * Returns null if the entry is malformed so it can be filtered out safely.
 */
function normalizeLockerFile(raw: any): SharedLockerFile | null {
  if (!raw || typeof raw.id !== 'string' || !raw.id || typeof raw.name !== 'string' || !raw.name) return null;
  if (!Array.isArray(raw.store?.order)) return null;
  const order: string[] = raw.store.order;
  const items: PackState = {};
  order.forEach((cat: string) => {
    items[cat] = sanitizeItems(raw.store.items?.[cat] ?? []);
  });
  const meta: Record<string, CategoryMeta> = {};
  order.forEach((cat: string) => {
    const m = raw.store.meta?.[cat];
    meta[cat] = {
      countsToBase: m?.countsToBase ?? true,
      subLabel:     m?.subLabel  ?? undefined,
      descLabel:    m?.descLabel ?? undefined,
    };
  });
  return {
    id:              raw.id,
    name:            raw.name,
    store:           { items, order, meta },
    background:      raw.background ?? null,
    bgFade:          typeof raw.bgFade === 'number' ? raw.bgFade : 1,
    bgTone:          raw.bgTone === 'dark' ? 'dark' : 'light',
    bgSize:          raw.bgSize === 'contain' ? 'contain' : 'cover',
    chartPaletteKey: typeof raw.chartPaletteKey === 'string' ? raw.chartPaletteKey : undefined,
  };
}

/**
 * Validate and normalize the raw API payload into a canonical SharePayload.
 * Returns null if the snapshot is structurally invalid.
 */
function normalizeSnapshot(raw: any): SharePayload | null {
  if (!raw || !Array.isArray(raw.categoryOrder) || raw.categoryOrder.length === 0) {
    console.error('[TrailWeigh] Share snapshot missing categoryOrder', raw);
    return null;
  }
  const categoryOrder: string[] = raw.categoryOrder;
  const data: PackState = {};
  categoryOrder.forEach(cat => {
    data[cat] = sanitizeItems(raw.data?.[cat] ?? []);
  });
  const categoryMeta: Record<string, CategoryMeta> = {};
  categoryOrder.forEach(cat => {
    const m = raw.categoryMeta?.[cat];
    categoryMeta[cat] = {
      countsToBase: m?.countsToBase ?? true,
      subLabel:     m?.subLabel  ?? undefined,
      descLabel:    m?.descLabel ?? undefined,
    };
  });

  // Validate: if the API returned data but all arrays are empty,
  // that's likely a schema error — log it but still render (it's a valid empty list).
  const totalItems = categoryOrder.reduce((s, cat) => s + data[cat].length, 0);
  if (totalItems === 0) {
    console.warn('[TrailWeigh] Share snapshot has 0 items across', categoryOrder.length, 'categories — rendering empty list');
  }

  // Normalize shared Locker files — absent for pre-021C shares (graceful degradation)
  console.log('[TrailWeigh] Share snapshot raw.lockerFiles count:', Array.isArray(raw.lockerFiles) ? raw.lockerFiles.length : 'absent');
  const lockerFiles = Array.isArray(raw.lockerFiles)
    ? raw.lockerFiles
        .map(normalizeLockerFile)
        .filter((f: SharedLockerFile | null): f is SharedLockerFile => f !== null)
    : undefined;

  return {
    // Discriminate between Locker share and Pack List share.
    // Pre-021E links have no type; default to 'locker' for backward compatibility.
    type:       raw.type === 'pack-list' ? 'pack-list' : 'locker',
    data,
    categoryOrder,
    categoryMeta,
    background: raw.background ?? null,
    bgFade:     typeof raw.bgFade === 'number' ? raw.bgFade : 1,
    bgTone:     raw.bgTone === 'dark' ? 'dark' : 'light',
    bgSize:     raw.bgSize === 'contain' ? 'contain' : 'cover',
    // Preserve sender's display name and unit system from the payload.
    unit:       (raw.unit === 'metric' || raw.unit === 'imperial') ? raw.unit : undefined,
    name:       typeof raw.name === 'string' ? raw.name : undefined,
    lockerFiles: lockerFiles && lockerFiles.length > 0 ? lockerFiles : undefined,
  };
}

function SharedChecklistLoader() {
  const params = useParams<{ id: string }>();
  const [snapshot, setSnapshot] = useState<SharePayload | null>(null);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    const id = params.id;
    if (!id) { setError('No share ID in URL.'); return; }

    fetch(`/api/links/${id}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(({ payload }) => {
        if (!payload) throw new Error('Empty payload');
        const normalized = normalizeSnapshot(payload);
        if (!normalized) throw new Error('Invalid snapshot schema');
        setSnapshot(normalized);
      })
      .catch(err => {
        console.error('[TrailWeigh] Failed to load shared list:', err);
        setError('This shared pack list could not be loaded.');
      });
  }, [params.id]);

  if (error) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
        <div className="text-center space-y-3">
          <p className="text-2xl">🏕️</p>
          <p className="font-semibold text-foreground">Link not found</p>
          <p className="text-sm text-muted-foreground max-w-xs">{error}</p>
          <a href="/" className="inline-block text-sm text-primary underline underline-offset-4 mt-2">
            Go to TrailWeigh
          </a>
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Loading shared list…
        </div>
      </div>
    );
  }

  // Route to Pack List or Locker experience based on share type.
  // Pre-021E links have no type field and default to 'locker'.
  if (snapshot.type === 'pack-list') {
    return <SharedPackListInner snapshot={snapshot} />;
  }
  return <SharedChecklistInner snapshot={snapshot} />;
}

// ── Shared Pack List — Preview-style read-only page ───────────────────────────

/**
 * Full-page read-only display of a single shared pack list.
 * Matches the PreviewModal presentation using the shared PreviewBody component.
 * No editing, no Locker panel, no Save — Print only.
 */
function SharedPackListContent({ snapshot }: { snapshot: SharePayload }) {
  const { system } = useUnit();

  return (
    <>
      {/* Screen-only page */}
      <div className="min-h-[100dvh] bg-background screen-only">

        {/* Header */}
        <header className="bg-card border-b border-border shadow-sm sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg text-primary flex-shrink-0">
              <Tent className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-foreground text-xl leading-tight">TrailWeigh</h1>
              <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Gear Tracker
              </p>
            </div>
            {/* Print — only action available to pack-list share recipients */}
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 bg-card hover:bg-muted/50 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
          </div>

          {/* View-only banner */}
          <div className="border-t border-border bg-primary/5">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-2">
              <div className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <p className="text-xs text-muted-foreground">
                  {snapshot.name
                    ? <>Viewing <span className="font-semibold text-foreground">"{snapshot.name}"</span> — read-only shared pack list.</>
                    : 'This is a read-only shared pack list.'
                  }
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Pack list body — reuses the same PreviewBody as the Preview modal */}
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 overflow-x-auto">
              <PreviewBody
                data={snapshot.data}
                system={system}
                categoryOrder={snapshot.categoryOrder}
                categoryMeta={snapshot.categoryMeta}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Print-only layout — hidden on screen, rendered when window.print() fires */}
      <PrintLayout
        data={snapshot.data}
        system={system}
        categoryOrder={snapshot.categoryOrder}
        categoryMeta={snapshot.categoryMeta}
      />
    </>
  );
}

/** Clerk-aware wrapper for the pack-list share experience. */
function SharedPackListInner({ snapshot }: { snapshot: SharePayload }) {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <UnitProvider initialSystem={snapshot.unit}>
      <SharedPackListContent snapshot={snapshot} />
    </UnitProvider>
  );
}

/** Thin Clerk-aware wrapper — waits for auth to load, then renders content. */
function SharedChecklistInner({ snapshot }: { snapshot: SharePayload }) {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <UnitProvider initialSystem={snapshot.unit}>
      <SharedChecklistContent
        key={snapshot.categoryOrder.join(',')} // stable key for the snapshot
        snapshot={snapshot}
        userId={user?.id}
        userEmail={user?.primaryEmailAddress?.emailAddress}
        isGuest={!user}
      />
    </UnitProvider>
  );
}

export default function SharedChecklistPage() {
  return <SharedChecklistLoader />;
}
