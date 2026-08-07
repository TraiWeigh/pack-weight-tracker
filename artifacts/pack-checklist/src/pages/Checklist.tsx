import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useUser, useClerk } from '@clerk/react';
import { usePackData } from '../hooks/usePackData';
import { GearCategory } from '../components/GearCategory';
import { WeightSummary } from '../components/WeightSummary';
import { PrintLayout } from '../components/PrintLayout';
import { PreviewModal } from '../components/PreviewModal';
import { MailingListModal, hasSeenMailingPrompt } from '../components/MailingListModal';
import { UnitProvider, useUnit } from '../context/UnitContext';
import { sharePackList } from '../lib/exportPDF';
import { resolveDestination } from '../lib/categoryAliases';
import { useLocation } from 'wouter';
import { isAdmin } from './AdminPage';
import { ImportGearPanel } from '../components/ImportGearPanel';
import { LockerPanel, LockerEntry } from '../components/LockerPanel';
import {
  LockerDeleteDialog,
  LOCKER_PENDING_DELETE_KEY,
  LOCKER_DELETE_VERIFIED_PARAM,
} from '../components/LockerDeleteDialog';
import { LockerIcon } from '../components/LockerIcon';
import { LOCKER_KEY, BgSnapshot } from '../hooks/usePackData';
import { buildShareURL } from '../lib/shareLink';
import { useToast } from '../hooks/use-toast';
import {
  RotateCcw, Tent, Share2, Link, FileDown, LogOut,
  User, Shield, Plus, Check, X, ChevronsUpDown, Printer, ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { BackgroundPickerButton, BackgroundPickerPanel, Background, BG_STORAGE_KEY, PRESETS, getFullUrl } from '../components/BackgroundPicker';
import { getPhotoBlob, createPhotoObjectUrl, revokePhotoObjectUrl } from '../lib/bgPhotoStore';
import { useInactivityTimer } from '../hooks/useInactivityTimer';
import { BackgroundShowcase } from '../components/BackgroundShowcase';

function UnitToggle() {
  const { system, setSystem } = useUnit();
  return (
    <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
      <button
        onClick={() => setSystem('imperial')}
        className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
          system === 'imperial'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Imperial
      </button>
      <button
        onClick={() => setSystem('metric')}
        className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
          system === 'metric'
            ? 'bg-card text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        Metric
      </button>
    </div>
  );
}

interface ChecklistContentProps {
  userId?: string;
  userEmail?: string;
  isGuest?: boolean;
}

/** Identifies the Locker file that is the current Save target for this tab. */
type ActiveLockerFile = { id: string; name: string };

/**
 * sessionStorage key for the active Locker file.
 * sessionStorage is tab-local and survives React remounts (e.g. Clerk token
 * refresh) within the same browser tab, so the active save target is not
 * lost when ChecklistContent briefly unmounts and remounts.
 */
const ACTIVE_LOCKER_FILE_SS_KEY = 'tw-active-locker-file';

function readActiveLockerFileFromSS(): ActiveLockerFile | null {
  try {
    const raw = sessionStorage.getItem(ACTIVE_LOCKER_FILE_SS_KEY);
    return raw ? (JSON.parse(raw) as ActiveLockerFile) : null;
  } catch { return null; }
}

function writeActiveLockerFileToSS(value: ActiveLockerFile | null): void {
  try {
    if (value) sessionStorage.setItem(ACTIVE_LOCKER_FILE_SS_KEY, JSON.stringify(value));
    else sessionStorage.removeItem(ACTIVE_LOCKER_FILE_SS_KEY);
  } catch {}
}

function ChecklistContent({ userId, userEmail, isGuest = false }: ChecklistContentProps) {
  // ── onRestoreBg: called by undo/redo to restore the background that was
  // active at the time of the history entry.  Defined as a stable useCallback
  // so the ref inside usePackData stays current without recreation.
  // Note: this callback is defined before usePackData so the ref is available
  // at hook call time, but it closes over background/bgSize setters which are
  // defined later.  We use function refs to avoid stale closures.
  const restoreBgCallbackRef = useRef<((bg: BgSnapshot) => void) | null>(null);
  // Mirrors bgSize state as a ref so handleBackgroundChange can read the
  // current size without a temporal dependency on bgSize's declaration order.
  const bgSizeRef = useRef<'cover' | 'contain'>('cover');
  const onRestoreBg = useCallback((bg: BgSnapshot) => {
    restoreBgCallbackRef.current?.(bg);
  }, []);

  const {
    data, categoryOrder, categoryMeta, store,
    updateItem, addItem, removeItem, moveItem,
    addCategory, deleteCategory, updateCategoryMeta, moveCategory, reorderCategory,
    renameCategory, loadStore, replaceStore,
    resetToDefaults,
    undo, redo, canUndo, canRedo,
    syncBg, pushBg,
  } = usePackData(userId, { onRestoreBg });

  const { system } = useUnit();
  const { signOut } = useClerk();
  const { toast } = useToast();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showNewConfirm,   setShowNewConfirm]   = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [showMailingModal, setShowMailingModal] = useState(() => !isGuest && !!userId && !hasSeenMailingPrompt(userId));
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [backgroundPickerOpen, setBackgroundPickerOpen] = useState(false);
  const bgPickerContainerRef = useRef<HTMLDivElement>(null);
  const [dragCat, setDragCat] = useState<string | null>(null);
  const [overCat, setOverCat] = useState<string | null>(null);
  const [hasInputFocus, setHasInputFocus] = useState(false);

  // ── Background state — also loaded from saved-list session key ────────────

  const [background, setBackground] = useState<Background | null>(() => {
    // If this tab was opened via "New", restore background from the newseed bundle.
    // resolveStorageKey() (called inside usePackData above) already wrote tw-fork-id
    // to sessionStorage, so we can look up the matching bg key here.
    try {
      const forkId = sessionStorage.getItem('tw-fork-id');
      if (forkId) {
        const raw = localStorage.getItem(`tw-newseed-bg-${forkId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && 'background' in parsed) {
            // Stash the other values for their own initializers, then clean up.
            sessionStorage.setItem('tw-newbg-fade',       String(parsed.bgFade ?? 1));
            sessionStorage.setItem('tw-newbg-tone',       parsed.bgTone ?? 'light');
            sessionStorage.setItem('tw-newbg-size',       parsed.bgSize ?? 'cover');
            sessionStorage.setItem('tw-newbg-palettekey', parsed.chartPaletteKey ?? '');
            localStorage.removeItem(`tw-newseed-bg-${forkId}`);
            return parsed.background ?? null;
          }
        }
      }
    } catch {}
    // If this tab was opened via "Load This List", use the saved background
    try {
      const raw = sessionStorage.getItem('tw-savedlist-bg');
      if (raw !== null) {
        sessionStorage.removeItem('tw-savedlist-bg');
        const parsed = JSON.parse(raw);
        return parsed ?? null;
      }
    } catch {}
    // Normal path
    try {
      const s = localStorage.getItem(BG_STORAGE_KEY);
      if (!s) return null;
      const parsed = JSON.parse(s) as Background & { dataUrl?: string };
      if (parsed.type === 'custom') {
        // Old format had { type:'custom', dataUrl } — migration runs in BackgroundPicker.
        if ('dataUrl' in parsed || !parsed.photoId) {
          localStorage.removeItem(BG_STORAGE_KEY);
          return null;
        }
      }
      return parsed as Background;
    } catch {
      localStorage.removeItem(BG_STORAGE_KEY);
      return null;
    }
  });

  /**
   * Called when the user selects or uploads a background image.
   * Pushes an undo entry BEFORE applying the new selection so Undo restores
   * the previously displayed background (including its bgSize).
   * NOTE: bgSize is referenced in the closure but declared later — this is
   * safe because handleBackgroundChange is only ever called at event time,
   * by which point all state is initialised.
   */
  const handleBackgroundChange = (bg: Background | null) => {
    // Capture state BEFORE the change — this is what Undo will restore.
    // bgSize is used here; it is declared later in the function body but
    // initialised before any event handler can fire.
    pushBg({ background, bgSize: bgSizeRef.current });
    setBackground(bg);
    if (bg) localStorage.setItem(BG_STORAGE_KEY, JSON.stringify(bg));
    else localStorage.removeItem(BG_STORAGE_KEY);
  };

  const [bgFade, setBgFade] = useState<number>(() => {
    try {
      // "New" tab — stashed by background initializer above
      const newbg = sessionStorage.getItem('tw-newbg-fade');
      if (newbg !== null) {
        sessionStorage.removeItem('tw-newbg-fade');
        const v = parseFloat(newbg);
        return isNaN(v) ? 1 : Math.min(1, Math.max(0, v));
      }
    } catch {}
    try {
      const raw = sessionStorage.getItem('tw-savedlist-bgfade');
      if (raw !== null) {
        sessionStorage.removeItem('tw-savedlist-bgfade');
        const v = parseFloat(raw);
        return isNaN(v) ? 1 : Math.min(1, Math.max(0, v));
      }
    } catch {}
    const s = localStorage.getItem('trailweigh:bgFade');
    const v = s ? parseFloat(s) : 1;
    return isNaN(v) ? 1 : Math.min(1, Math.max(0, v));
  });

  const handleBgFadeChange = (v: number) => {
    setBgFade(v);
    localStorage.setItem('trailweigh:bgFade', String(v));
  };

  const [bgTone, setBgTone] = useState<'light' | 'dark'>(() => {
    try {
      // "New" tab — stashed by background initializer above
      const newbg = sessionStorage.getItem('tw-newbg-tone');
      if (newbg !== null) {
        sessionStorage.removeItem('tw-newbg-tone');
        return newbg as 'light' | 'dark';
      }
    } catch {}
    try {
      const raw = sessionStorage.getItem('tw-savedlist-bgtone');
      if (raw !== null) {
        sessionStorage.removeItem('tw-savedlist-bgtone');
        return raw as 'light' | 'dark';
      }
    } catch {}
    return (localStorage.getItem('trailweigh:bgTone') as 'light' | 'dark') ?? 'light';
  });

  const handleBgToneChange = (t: 'light' | 'dark') => {
    setBgTone(t);
    localStorage.setItem('trailweigh:bgTone', t);
  };

  // ── Background sizing — Fill Screen (cover) or Fit Image (contain) ─────────
  // Persisted to localStorage under 'trailweigh:bgSize'. Defaults to 'cover'.
  const [bgSize, setBgSize] = useState<'cover' | 'contain'>(() => {
    try {
      // "New" tab — stashed by background initializer above
      const newbg = sessionStorage.getItem('tw-newbg-size');
      if (newbg !== null) {
        sessionStorage.removeItem('tw-newbg-size');
        return newbg as 'cover' | 'contain';
      }
    } catch {}
    try {
      // Shared / saved-list tab — stashed by ShortLinkView / SharedPackView
      const sl = sessionStorage.getItem('tw-savedlist-bgsize');
      if (sl !== null) {
        sessionStorage.removeItem('tw-savedlist-bgsize');
        return sl as 'cover' | 'contain';
      }
    } catch {}
    return (localStorage.getItem('trailweigh:bgSize') as 'cover' | 'contain') ?? 'cover';
  });

  /**
   * Called when the user toggles Fill Screen ↔ Fit Image.
   * Pushes an undo entry so the size setting is reversible independently
   * (or together with a background selection if both change in one action).
   */
  const handleBgSizeChange = (v: 'cover' | 'contain') => {
    if (v === bgSize) return; // no change — don't push empty history entry
    pushBg({ background, bgSize });
    setBgSize(v);
    localStorage.setItem('trailweigh:bgSize', v);
  };

  // ── Keep bgSizeRef current on every render so handleBackgroundChange can
  // safely capture the correct bgSize in pushBg without a declaration-order
  // dependency.
  bgSizeRef.current = bgSize;

  // ── Chart palette key — per-file, saved in LockerEntry ─────────────────
  // Initialised from (in priority order):
  //   1. "New" tab newseed bundle  (tw-newbg-palettekey in sessionStorage)
  //   2. "Load This List" stash    (tw-savedlist-palettekey in sessionStorage)
  //   3. Global localStorage fallback (last-used palette for guest/unsaved lists)
  const [chartPaletteKey, setChartPaletteKey] = useState<string>(() => {
    try {
      const newbg = sessionStorage.getItem('tw-newbg-palettekey');
      if (newbg !== null) {
        sessionStorage.removeItem('tw-newbg-palettekey');
        return newbg || 'trail';
      }
    } catch {}
    try {
      const sl = sessionStorage.getItem('tw-savedlist-palettekey');
      if (sl !== null) {
        sessionStorage.removeItem('tw-savedlist-palettekey');
        return sl || 'trail';
      }
    } catch {}
    return localStorage.getItem('trailweigh:chartPalette') ?? 'trail';
  });

  const handlePaletteChange = useCallback((key: string) => {
    setChartPaletteKey(key);
    // Persist to localStorage so unsaved/guest lists remember the last choice
    // across page refreshes.  Saved lists override this on load.
    localStorage.setItem('trailweigh:chartPalette', key);
  }, []);

  // ── Wire up the onRestoreBg callback now that ALL bg state setters are in
  // scope.  Assigned inline on every render so the hook always calls the
  // freshest version (ref-based stable callback pattern).
  restoreBgCallbackRef.current = (snap: BgSnapshot) => {
    setBackground(snap.background as Background | null);
    setBgSize(snap.bgSize);
    // Persist the restored state exactly as a normal selection would
    if (snap.background) localStorage.setItem(BG_STORAGE_KEY, JSON.stringify(snap.background));
    else localStorage.removeItem(BG_STORAGE_KEY);
    localStorage.setItem('trailweigh:bgSize', snap.bgSize);
  };

  // ── Keep currentBgRef in usePackData in sync so every gear-change
  // pushAndSet captures the correct background snapshot in its undo entry.
  useEffect(() => {
    syncBg({ background, bgSize });
  }, [background, bgSize, syncBg]);

  // ── Custom background object URL (resolved async from IndexedDB) ────────────
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
      const blob = await getPhotoBlob(activePhotoId);
      if (!cancelled) {
        if (blob) {
          const url = createPhotoObjectUrl(blob);
          customBgObjectUrlRef.current = url;
          setCustomBgObjectUrl(url);
        } else {
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

  const [showShareMenu, setShowShareMenu] = useState(false);
  const [, setLocation] = useLocation();
  const admin = isAdmin(userEmail);

  const [allOpen, setAllOpen] = useState(true);
  const [openCloseSeq, setOpenCloseSeq] = useState(0);

  // ── Input-focus tracking (used to block inactivity showcase timer) ────────
  useEffect(() => {
    const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);
    const onIn  = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      if (INPUT_TAGS.has(el.tagName) || el.isContentEditable) setHasInputFocus(true);
    };
    const onOut = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      if (INPUT_TAGS.has(el.tagName) || el.isContentEditable) setHasInputFocus(false);
    };
    document.addEventListener('focusin',  onIn);
    document.addEventListener('focusout', onOut);
    return () => {
      document.removeEventListener('focusin',  onIn);
      document.removeEventListener('focusout', onOut);
    };
  }, []);

  // ── Inactivity timer → Showcase mode ─────────────────────────────────────
  const isDialogOpen = showResetConfirm || showNewConfirm || showShareMenu || backgroundPickerOpen;
  const { showcaseActive, triggerShowcase, exitShowcase } = useInactivityTimer({
    isPreviewOpen: showPreview,
    hasInputFocus,
    isDragging:    dragCat !== null,
    isDialogOpen,
  });

  const [copied, setCopied] = useState(false);
  async function copyUrlToClipboard(url: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      try {
        const el = document.createElement('textarea');
        el.value = url;
        el.style.cssText = 'position:fixed;pointer-events:none;opacity:0';
        document.body.appendChild(el);
        el.focus(); el.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(el);
        return ok;
      } catch { return false; }
    }
  }

  const handleCopyLink = async () => {
    // Snapshot validation — fail fast if the list data is structurally empty
    // even though the sender's screen has visible items (serialization guard).
    const totalItems = store.order.reduce(
      (s, cat) => s + (store.items[cat]?.length ?? 0), 0
    );
    if (store.order.length === 0 || totalItems === 0) {
      toast({
        title:       'Nothing to share',
        description: 'Add some gear items before creating a share link.',
        variant:     'destructive',
      });
      setShowShareMenu(false);
      return;
    }

    // Snapshot the complete current working file — same structure as Save.
    // Checkbox states are preserved as-is (unlike New which resets them).
    const payload = {
      data:          store.items,
      categoryOrder: store.order,
      categoryMeta:  store.meta,
      background:    background ?? null,
      bgFade,
      bgTone,
      bgSize,
      unit:          system,
      name:          activeLockerFile?.name ?? undefined,
    };

    const url = await buildShareURL(payload);
    const ok = await copyUrlToClipboard(url);
    if (!ok) window.prompt('Copy this link:', url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Add Category ──────────────────────────────────────────────────────────
  const [addingCat, setAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const newCatInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => { resetToDefaults(); setShowResetConfirm(false); };
  const handlePrint  = () => window.print();

  const handleShare = () => {
    setSharing(true);
    try {
      sharePackList(data, system, categoryOrder, categoryMeta);
    } finally {
      setSharing(false);
    }
  };

  const handleSignOut = () => {
    signOut({ redirectUrl: import.meta.env.BASE_URL || '/' });
  };

  const handleAddCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    addCategory(name);
    setNewCatName('');
    setAddingCat(false);
  };

  const handleAddCatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddCategory();
    if (e.key === 'Escape') { setAddingCat(false); setNewCatName(''); }
  };

  const openAddCat = () => {
    setAddingCat(true);
    setTimeout(() => newCatInputRef.current?.focus(), 50);
  };

  // ── New list in a new tab ─────────────────────────────────────────────────
  const handleNew = useCallback(() => {
    // Opening a new tab creates a separate unsaved file — detach from the
    // current Locker entry so this tab's Save button starts a fresh workflow.
    writeActiveLockerFileToSS(null);
    setActiveLockerFile(null);
    const uuid = crypto.randomUUID();

    // 1. Deep-clone the complete store — same structure that Save writes to Locker.
    //    JSON round-trip guarantees no shared object references with the original.
    const clonedStore: typeof store = JSON.parse(JSON.stringify(store));

    // 2. Traverse every copied item and set checked: false.
    //    We iterate store.order (not a separate categoryOrder ref) so the loop
    //    always uses the cloned object's own key list.
    for (const cat of clonedStore.order) {
      const items = clonedStore.items[cat];
      if (Array.isArray(items)) {
        clonedStore.items[cat] = items.map((item) => ({ ...item, checked: false }));
      }
    }

    // 3. Write gear data newseed.
    localStorage.setItem(`tw-newseed-${uuid}`, JSON.stringify({ __v: 5, ...clonedStore }));

    // 4. Write background settings alongside so the new tab opens with the same
    //    background, fill/fit mode, tone, and fade as the current tab.
    //    chartPaletteKey is bundled here so the new tab inherits the same
    //    Weight Distribution palette as the source file.
    localStorage.setItem(`tw-newseed-bg-${uuid}`, JSON.stringify({
      background: background ?? null,
      bgFade,
      bgTone,
      bgSize,
      chartPaletteKey,
    }));

    const base = (import.meta.env.BASE_URL as string).replace(/\/$/, '');
    window.open(`${window.location.origin}${base}/checklist?newseed=${uuid}`, '_blank');
  }, [store, background, bgFade, bgTone, bgSize]);

  // ── Keyboard shortcuts (Ctrl/Cmd+Z, Ctrl/Cmd+Y, Ctrl/Cmd+Shift+Z) ────────
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

  // ── Locker ────────────────────────────────────────────────────────────────

  const [lockerEntries, setLockerEntries] = useState<LockerEntry[]>(() => {
    try {
      const raw = localStorage.getItem(LOCKER_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  // Persist whenever lockerEntries changes (does NOT broadcast — broadcasts happen
  // explicitly in mutating handlers to avoid cross-tab echo loops)
  useEffect(() => {
    localStorage.setItem(LOCKER_KEY, JSON.stringify(lockerEntries));
  }, [lockerEntries]);

  // BroadcastChannel for cross-tab Locker sync
  const lockerChannelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    let ch: BroadcastChannel | null = null;
    try {
      ch = new BroadcastChannel('gear-locker-sync');
      lockerChannelRef.current = ch;
      ch.onmessage = (e) => {
        if (e.data?.type === 'locker-update') {
          const entries: LockerEntry[] = e.data.entries;
          // Write immediately so any subsequent refresh gets the latest data
          localStorage.setItem(LOCKER_KEY, JSON.stringify(entries));
          setLockerEntries(entries);
        }
      };
    } catch {
      lockerChannelRef.current = null;
    }
    return () => {
      ch?.close();
      lockerChannelRef.current = null;
    };
  }, []);

  /** Broadcast Locker state to every other open tab. */
  const broadcastLocker = useCallback((entries: LockerEntry[]) => {
    try {
      lockerChannelRef.current?.postMessage({ type: 'locker-update', entries });
    } catch {}
  }, []);

  // Error toast when a ?savedListId= was not found in the Locker
  useEffect(() => {
    const hadError = sessionStorage.getItem('tw-savedlist-error');
    if (hadError) {
      sessionStorage.removeItem('tw-savedlist-error');
      toast({
        title: 'List not found',
        description: 'That saved list may have been deleted from the Locker.',
        variant: 'destructive',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Save to Locker ────────────────────────────────────────────────────────

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveConflictId, setSaveConflictId] = useState<string | null>(null);
  const saveInputRef = useRef<HTMLInputElement>(null);

  // Tracks the active save target for this tab.  Only the id and name are
  // stored — enough to call commitSaveReplace without holding a stale copy of
  // the full LockerEntry (store, background, etc.).
  //
  // Initialised from sessionStorage so the value survives any React remount
  // (e.g. a Clerk token refresh that briefly cycles isLoaded → false → true
  // and causes ChecklistContent to unmount/remount with fresh useState).
  const [activeLockerFile, setActiveLockerFile] = useState<ActiveLockerFile | null>(
    readActiveLockerFileFromSS
  );

  // Keep sessionStorage in sync with the React state.
  useEffect(() => {
    writeActiveLockerFileToSS(activeLockerFile);
  }, [activeLockerFile]);

  // When this tab was opened via the new-tab path (window.open ?savedListId=),
  // usePackData stashes the entry id/name in sessionStorage during its store
  // initialiser. Read them here on mount and set activeLockerFile so Save works
  // without the naming dialog — exactly the same end-state as the in-place path.
  useEffect(() => {
    const entryId   = sessionStorage.getItem('tw-savedlist-entry-id');
    const entryName = sessionStorage.getItem('tw-savedlist-entry-name');
    if (entryId) {
      sessionStorage.removeItem('tw-savedlist-entry-id');
      sessionStorage.removeItem('tw-savedlist-entry-name');
      const active: ActiveLockerFile = { id: entryId, name: entryName ?? '' };
      writeActiveLockerFileToSS(active);
      setActiveLockerFile(active);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * "Save" chosen from the Save menu.
   *
   * • Active Locker file exists → update it directly by ID (no dialog).
   * • No active file (genuinely new checklist) → open naming dialog.
   */
  const handleSaveMenuSave = () => {
    // Use state as primary source; fall back to sessionStorage if state was
    // lost in a remount (the most common cause of activeLockerFile being null).
    const ssVal = readActiveLockerFileFromSS();
    const target = activeLockerFile ?? ssVal;
    if (target) {
      if (!activeLockerFile) {
        // Re-sync state from sessionStorage so subsequent renders are correct.
        setActiveLockerFile(target);
      }
      commitSaveReplace(target.id, target.name);
      return;
    }
    openSaveDialog();
  };

  /**
   * "Save As" chosen from the Save menu.
   * Always prompts for a name and creates a separate Locker file with a new ID.
   * The new file becomes the active save target.
   */
  const handleSaveMenuSaveAs = () => {
    openSaveDialog();
  };

  const openSaveDialog = () => {
    setShowSaveDialog(true);
    setSaveConflictId(null);
    setTimeout(() => saveInputRef.current?.focus(), 50);
  };

  const closeSaveDialog = () => {
    setShowSaveDialog(false);
    setSaveName('');
    setSaveConflictId(null);
  };

  /** Save as a brand-new entry (no duplicate check). */
  const commitSaveNew = useCallback((name: string) => {
    const entry: LockerEntry = {
      id: crypto.randomUUID(),
      name,
      savedAt: Date.now(),
      store,
      background,
      bgFade,
      bgTone,
      chartPaletteKey,
    };
    const updated = [entry, ...lockerEntries];
    setLockerEntries(updated);
    broadcastLocker(updated);
    // Make this new entry the active save target so subsequent Save clicks
    // update it in-place rather than asking for a name again.
    const newFile: ActiveLockerFile = { id: entry.id, name: entry.name };
    writeActiveLockerFileToSS(newFile);
    setActiveLockerFile(newFile);
    closeSaveDialog();
    toast({ description: `Saved "${name}"` });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, background, bgFade, bgTone, chartPaletteKey, lockerEntries, broadcastLocker, toast]);

  /** Save and replace an existing entry (same ID, updated content). */
  const commitSaveReplace = useCallback((existingId: string, name: string) => {
    try {
      const entry: LockerEntry = {
        id: existingId,
        name,
        savedAt: Date.now(),
        store,
        background,
        bgFade,
        bgTone,
        chartPaletteKey,
      };
      // Only update an entry that actually exists in the Locker.
      const exists = lockerEntries.some(e => e.id === existingId);
      if (!exists) {
        toast({ description: 'Save failed. The file no longer exists in your Locker.', variant: 'destructive' });
        return;
      }
      const updated = lockerEntries.map(e => e.id === existingId ? entry : e);
      setLockerEntries(updated);
      broadcastLocker(updated);
      // Keep (and refresh) the active file identity so subsequent Save clicks
      // continue updating this same Locker file without reopening the dialog.
      const refreshed: ActiveLockerFile = { id: existingId, name };
      writeActiveLockerFileToSS(refreshed);
      setActiveLockerFile(refreshed);
      closeSaveDialog();
      toast({ description: `Saved "${name}"` });
    } catch {
      toast({ description: 'Save failed. Your changes were not saved.', variant: 'destructive' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, background, bgFade, bgTone, chartPaletteKey, lockerEntries, broadcastLocker, toast]);

  const handleSaveToLocker = () => {
    const name = saveName.trim();
    if (!name) return;
    const existing = lockerEntries.find(e => e.name === name);
    if (existing) {
      // Show conflict options (Replace / Save as New / Cancel)
      setSaveConflictId(existing.id);
      return;
    }
    commitSaveNew(name);
  };

  const handleReplaceInLocker = () => {
    if (!saveConflictId) return;
    commitSaveReplace(saveConflictId, saveName.trim());
  };

  const handleSaveAsNew = () => {
    commitSaveNew(saveName.trim());
  };

  // ── Load from Locker ──────────────────────────────────────────────────────
  // When the current checklist has zero gear items across ALL categories, the
  // selected file is loaded directly into this tab (no new window).  The
  // current window's background is preserved — the file's stored background is
  // deliberately not applied.  Undo/Redo history is wiped so the user cannot
  // undo back to the empty state.
  //
  // When the current checklist has at least one item the existing new-tab
  // behaviour is kept exactly as-is.

  const handleLoadFromLocker = (entry: LockerEntry) => {
    // Count every gear item in every category (checked or not, any weight).
    const totalItems = store.order.reduce(
      (sum, cat) => sum + (store.items[cat]?.length ?? 0), 0
    );
    if (totalItems === 0) {
      // ── In-place open path ────────────────────────────────────────────────
      // 1. Background is already in React state — nothing to capture/restore
      //    because replaceStore only touches the gear store, not bg state.
      // 2. Restore the file's Weight Distribution palette key.
      //    Older entries without chartPaletteKey fall back to 'trail' (default).
      const restoredPalette = entry.chartPaletteKey ?? 'trail';
      setChartPaletteKey(restoredPalette);
      localStorage.setItem('trailweigh:chartPalette', restoredPalette);
      // 3. Replace the store (clears undo/redo; does not push history entry).
      replaceStore(entry.store as import('../hooks/usePackData').Store);
      // 4. Track the active file identity so Save routes to commitSaveReplace
      //    (updating this file, not creating a new one).
      //    Write to sessionStorage immediately (before the React state update
      //    queues) so the value survives a remount that might occur before the
      //    useEffect sync fires.
      const newActiveFile: ActiveLockerFile = { id: entry.id, name: entry.name };
      writeActiveLockerFileToSS(newActiveFile);
      setActiveLockerFile(newActiveFile);
      // 4. Stay in the same tab — no window.open.
      return;
    }

    // ── Non-empty path: existing new-tab behaviour (unchanged) ───────────────
    const base = (import.meta.env.BASE_URL as string).replace(/\/$/, '');
    const url = `${window.location.origin}${base}/checklist?savedListId=${entry.id}`;
    const tab = window.open(url, '_blank');
    if (!tab) {
      toast({
        title: 'Pop-up blocked',
        description: 'Allow pop-ups for this site and try again.',
        variant: 'destructive',
      });
    }
  };

  // ── Delete from Locker — identity-verified flow ───────────────────────────

  const [pendingDeleteIds,  setPendingDeleteIds]  = useState<string[]>([]);
  const [showDeleteDialog,  setShowDeleteDialog]  = useState(false);
  // Used only for the OAuth redirect round-trip path.
  const [oauthDeleteIds,    setOauthDeleteIds]    = useState<string[]>([]);

  // Detect OAuth redirect return on first render and schedule deletion.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get(LOCKER_DELETE_VERIFIED_PARAM) !== '1') return;

    // Scrub the verification param from the URL without a page reload.
    const cleaned = new URLSearchParams(window.location.search);
    cleaned.delete(LOCKER_DELETE_VERIFIED_PARAM);
    const newUrl =
      window.location.pathname +
      (cleaned.toString() ? `?${cleaned.toString()}` : '');
    window.history.replaceState({}, '', newUrl);

    // Retrieve and clear pending IDs stored before the redirect.
    const raw = sessionStorage.getItem(LOCKER_PENDING_DELETE_KEY);
    sessionStorage.removeItem(LOCKER_PENDING_DELETE_KEY);
    if (!raw) return;
    try {
      const ids: string[] = JSON.parse(raw);
      if (ids.length > 0) setOauthDeleteIds(ids);
    } catch { /* malformed storage — ignore */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Execute pending OAuth-verified deletion once state is ready.
  useEffect(() => {
    if (!oauthDeleteIds.length) return;
    const toDelete = lockerEntries.filter(e => oauthDeleteIds.includes(e.id));
    if (!toDelete.length) { setOauthDeleteIds([]); return; }
    const updated = lockerEntries.filter(e => !oauthDeleteIds.includes(e.id));
    setLockerEntries(updated);
    broadcastLocker(updated);
    setOauthDeleteIds([]);
    const msg = toDelete.length === 1
      ? `"${toDelete[0].name}" was permanently deleted.`
      : `${toDelete.length} Locker files were permanently deleted.`;
    toast({ description: msg });
  }, [oauthDeleteIds]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Called when the user clicks "Yes" on the LockerPanel inline confirm.
   * Opens the identity-verification dialog before performing any deletion.
   * For guests (no authentication), deletes directly.
   */
  const requestProtectedDelete = useCallback((id: string) => {
    if (isGuest || !userId) {
      // No auth system available — delete directly (preserve existing guest UX).
      const updated = lockerEntries.filter(e => e.id !== id);
      setLockerEntries(updated);
      broadcastLocker(updated);
      // If the deleted entry is the active file, detach — it no longer exists.
      const curA = readActiveLockerFileFromSS();
      const nextA = curA?.id === id ? null : curA;
      writeActiveLockerFileToSS(nextA);
      setActiveLockerFile(nextA);
      return;
    }
    setPendingDeleteIds([id]);
    setShowDeleteDialog(true);
  }, [isGuest, userId, lockerEntries, broadcastLocker]);

  /** Called by the dialog after identity is verified. */
  const handleConfirmedDelete = useCallback(() => {
    const toDelete = lockerEntries.filter(e => pendingDeleteIds.includes(e.id));
    if (!toDelete.length) { setShowDeleteDialog(false); setPendingDeleteIds([]); return; }
    const updated = lockerEntries.filter(e => !pendingDeleteIds.includes(e.id));
    setLockerEntries(updated);
    broadcastLocker(updated);
    // If the active file was among those deleted, detach the save target.
    const curB = readActiveLockerFileFromSS();
    const nextB = curB && pendingDeleteIds.includes(curB.id) ? null : curB;
    writeActiveLockerFileToSS(nextB);
    setActiveLockerFile(nextB);
    setShowDeleteDialog(false);
    setPendingDeleteIds([]);
    const msg = toDelete.length === 1
      ? `"${toDelete[0].name}" was permanently deleted.`
      : `${toDelete.length} Locker files were permanently deleted.`;
    toast({ description: msg });
  }, [lockerEntries, pendingDeleteIds, broadcastLocker, toast]);

  // ── Rename in Locker ──────────────────────────────────────────────────────

  const handleRenameInLocker = useCallback((id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const updated = lockerEntries.map(e => e.id === id ? { ...e, name: trimmed } : e);
    setLockerEntries(updated);
    broadcastLocker(updated);
  }, [lockerEntries, broadcastLocker]);

  // ── Toolbar button style ──────────────────────────────────────────────────
  const toolBtn = 'flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-muted/50';
  const toolBtnDisabled = 'flex items-center gap-2 text-xs font-medium text-muted-foreground/30 px-2 py-1.5 rounded-md cursor-not-allowed';

  return (
    <>
      {showMailingModal && (
        <MailingListModal userId={userId ?? ''} onDismiss={() => setShowMailingModal(false)} />
      )}

      {/* ── Background Showcase overlay ───────────────────────────────────── */}
      {/* Rendered outside the main app div so its z-index is unrestricted    */}
      <BackgroundShowcase
        active={showcaseActive}
        bgImageUrl={bgImageUrl}
        onWake={exitShowcase}
        bgSize={bgSize}
        letterboxColor={bgTone === 'dark' ? 'hsl(220, 20%, 8%)' : 'hsl(40, 20%, 97%)'}
      />

      {/* ── Screen content ── */}
      <div
        className={`screen-only h-[100dvh] overflow-hidden flex flex-col bg-background${bgTone === 'dark' ? ' screen-dark' : ''}`}
        style={{
          ...(bgImageUrl ? {
            // 017E fix: always use the 2-layer linear-gradient format regardless of
            // bgFade value.  When bgFade=1 the gradient alpha is 0 (fully transparent),
            // producing the same visual as the bare url() form but without a format
            // switch that triggers a heavier GPU compositing re-evaluation.  Format
            // switches between 1-layer and 2-layer backgroundImage values invalidate
            // compositing layer caches more aggressively than simple alpha changes.
            backgroundImage: `linear-gradient(rgba(${bgTone === 'dark' ? '0,0,0' : '255,255,255'},${Math.max(0, 1 - bgFade)}),rgba(${bgTone === 'dark' ? '0,0,0' : '255,255,255'},${Math.max(0, 1 - bgFade)})),url(${bgImageUrl})`,
            // Companion to the fixed format above: always supply two size values.
            // The gradient always fills the element; the image uses the selected sizing.
            backgroundSize: `100% 100%, ${bgSize}`,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          } : {}),
          // Fade out the app while Showcase is active
          opacity:       showcaseActive ? 0 : 1,
          transition:    'opacity 800ms ease',
          pointerEvents: showcaseActive ? 'none' : undefined,
        }}
      >
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

              {/* ── New ─────────────────────────────────────────── */}
              <div className="relative flex-shrink-0">
                {showNewConfirm ? (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
                    <button
                      onClick={() => { handleNew(); setShowNewConfirm(false); }}
                      className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 font-medium transition-colors whitespace-nowrap"
                    >
                      Create New List
                    </button>
                    <button
                      onClick={() => setShowNewConfirm(false)}
                      className="text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-md hover:bg-muted/80 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewConfirm(true)}
                    title="Create a new pack list as an exact copy of the current file? All gear-item checkboxes in the new file will be unchecked. The original file will not be changed."
                    className={toolBtn}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">New</span>
                  </button>
                )}
              </div>

              {/* ── Undo ────────────────────────────────────────── */}
              <button
                onClick={undo}
                disabled={!canUndo}
                title={canUndo ? 'Undo (Ctrl+Z)' : 'Nothing to undo'}
                className={canUndo ? toolBtn : toolBtnDisabled}
              >
                <img src="/undo-icon.png" alt="Undo" className="w-5 h-5 min-w-[20px] object-contain flex-shrink-0" />
                <span className="hidden md:inline">Undo</span>
              </button>

              {/* ── Redo ────────────────────────────────────────── */}
              <button
                onClick={redo}
                disabled={!canRedo}
                title={canRedo ? 'Redo (Ctrl+Y)' : 'Nothing to redo'}
                className={canRedo ? toolBtn : toolBtnDisabled}
              >
                <img src="/redo-icon.png" alt="Redo" className="w-5 h-5 min-w-[20px] object-contain flex-shrink-0" />
                <span className="hidden md:inline">Redo</span>
              </button>

              {/* ── Save ────────────────────────────────────────── */}
              {showSaveDialog ? (
                saveConflictId ? (
                  /* Duplicate-name conflict — ask user what to do */
                  <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-4 duration-200">
                    <span className="text-xs text-muted-foreground hidden sm:inline truncate max-w-[120px]">
                      "{saveName}" exists:
                    </span>
                    <button
                      onClick={handleReplaceInLocker}
                      className="text-xs font-semibold bg-destructive text-destructive-foreground px-2.5 py-1.5 rounded-md hover:bg-destructive/90 transition-colors"
                    >
                      Replace
                    </button>
                    <button
                      onClick={handleSaveAsNew}
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
                  /* Normal save — enter name */
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
                    <button
                      onClick={closeSaveDialog}
                      className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      title="Save current list to Locker"
                      className={`${toolBtn} gap-0.5`}
                    >
                      <LockerIcon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="hidden md:inline">Save</span>
                      <ChevronDown className="w-3 h-3 flex-shrink-0 opacity-70" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[120px]">
                    <DropdownMenuItem
                      className="text-sm cursor-pointer"
                      onSelect={handleSaveMenuSave}
                    >
                      Save
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-sm cursor-pointer"
                      onSelect={handleSaveMenuSaveAs}
                    >
                      Save As
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Divider */}
              <div className="w-px h-5 bg-border mx-1 flex-shrink-0" />

              {/* ── Reset ───────────────────────────────────────── */}
              <div className="relative flex-shrink-0">
                {showResetConfirm ? (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-200">
                    <span className="text-sm font-medium text-destructive">Clear All Items?</span>
                    <button onClick={handleReset} className="text-xs bg-destructive text-destructive-foreground px-3 py-1.5 rounded-md hover:bg-destructive/90 font-medium transition-colors">Confirm</button>
                    <button onClick={() => setShowResetConfirm(false)} className="text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-md hover:bg-muted/80 font-medium transition-colors">Cancel</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className={toolBtn}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                )}
              </div>

              {/* ── User menu / guest CTA ────────────────────────── */}
              {isGuest ? (
                <button
                  onClick={() => setLocation('/sign-up')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                >
                  <User className="w-3.5 h-3.5" />
                  Sign in to save
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
                        {admin && (
                          <button
                            onClick={() => { setShowUserMenu(false); setLocation('/admin'); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-primary/5 transition-colors"
                          >
                            <Shield className="w-3.5 h-3.5" />
                            Admin Panel
                          </button>
                        )}
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
        </header>

        <main className="w-full max-w-full mx-auto px-3 sm:px-4 lg:px-6 flex-1 min-h-0 lg:overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_365px] gap-8 lg:h-full">

            {/* Gear list */}
            <div className="lg:h-full lg:flex lg:flex-col lg:overflow-hidden">
              {/* Pinned pills row */}
              <div className="pt-8 pb-3 flex items-center lg:pr-3 flex-shrink-0 relative">
                <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5">
                  <button
                    onClick={() => { setAllOpen(true); setOpenCloseSeq(s => s + 1); }}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                      allOpen === true
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Open
                  </button>
                  <button
                    onClick={() => { setAllOpen(false); setOpenCloseSeq(s => s + 1); }}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                      allOpen === false
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Close
                  </button>
                </div>
                {/* Active file name — centered over the left checklist column.
                    Absolutely positioned so it never pushes Open/Close or Hide/Preview/Imperial/Metric. */}
                {activeLockerFile && (
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <span
                      aria-label={`Active file: ${activeLockerFile.name}`}
                      title={activeLockerFile.name}
                      className="flex items-center bg-muted rounded-lg px-3 py-1.5 text-xs font-semibold text-foreground max-w-[10rem] truncate select-none"
                    >
                      {activeLockerFile.name}
                    </span>
                  </div>
                )}
                <div className="ml-auto flex items-center gap-3">
                  <button
                    onClick={() => { setBackgroundPickerOpen(false); triggerShowcase(); }}
                    disabled={showResetConfirm || showShareMenu || showPreview || dragCat !== null || hasInputFocus}
                    aria-label="Hide interface and show background view"
                    title={
                      showResetConfirm || showShareMenu || showPreview || dragCat !== null || hasInputFocus
                        ? 'Finish the current action first'
                        : 'Hide the interface'
                    }
                    className="flex items-center bg-muted rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Hide
                  </button>
                  <button
                    onClick={() => setShowPreview(true)}
                    aria-label="Open checked-items preview"
                    className="flex items-center bg-muted rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Preview
                  </button>
                  <UnitToggle />
                </div>
              </div>

              {/* Scrollable categories */}
              <div className="lg:flex-1 lg:overflow-y-auto lg:min-h-0 space-y-2 pb-8 lg:pr-3 lg:[scrollbar-gutter:stable]">
              {categoryOrder.map((category) => (
                <GearCategory
                  key={category}
                  name={category}
                  items={data[category] || []}
                  meta={categoryMeta[category] ?? { countsToBase: true }}
                  forceOpen={allOpen}
                  forceOpenSeq={openCloseSeq}
                  order={categoryOrder}
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

              {/* ── Add Category ── */}
              <div className="mt-2">
                {addingCat ? (
                  <div className="flex items-center gap-2 p-3 bg-card border border-primary/40 rounded-lg shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                    <input
                      ref={newCatInputRef}
                      type="text"
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      onKeyDown={handleAddCatKeyDown}
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

            {/* Sidebar */}
            <div className="order-first lg:order-last lg:h-full lg:flex lg:flex-col lg:overflow-hidden">
              {/* Pinned action bar */}
              <div className="relative flex flex-wrap justify-center gap-2 pt-8 pb-3 lg:px-3 flex-shrink-0">
                <div ref={bgPickerContainerRef}>
                  <BackgroundPickerButton onClick={() => setBackgroundPickerOpen(o => !o)} active={!!background} />
                  <BackgroundPickerPanel
                    open={backgroundPickerOpen}
                    onClose={() => setBackgroundPickerOpen(false)}
                    background={background}
                    onBackgroundChange={handleBackgroundChange}
                    bgFade={bgFade}
                    onBgFadeChange={handleBgFadeChange}
                    bgTone={bgTone}
                    onBgToneChange={handleBgToneChange}
                    bgSize={bgSize}
                    onBgSizeChange={handleBgSizeChange}
                    containerRef={bgPickerContainerRef as React.RefObject<HTMLDivElement>}
                    onShowcase={background
                      ? () => { setBackgroundPickerOpen(false); triggerShowcase(); }
                      : undefined}
                    isShowcaseBlocked={
                      // Exclude backgroundPickerOpen: the panel IS the picker, so it
                      // is always open when this prop is evaluated. The onShowcase
                      // callback already closes it before triggering showcase.
                      !background || showResetConfirm || showShareMenu ||
                      showPreview || dragCat !== null || hasInputFocus
                    }
                  />
                </div>
                {/* Share pill + dropdown */}
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
                          onClick={() => { handleCopyLink(); setShowShareMenu(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted/60 transition-colors"
                        >
                          <Link className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <div className="text-left">
                            <div>{copied ? 'Copied!' : 'Copy Link'}</div>
                          </div>
                        </button>
                        <div className="my-1 border-t border-border" />
                        <button
                          onClick={() => { handleShare(); setShowShareMenu(false); }}
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
                  data={data}
                  categoryOrder={categoryOrder}
                  categoryMeta={categoryMeta}
                  paletteKey={chartPaletteKey}
                  onPaletteChange={handlePaletteChange}
                />
                <ImportGearPanel
                  categoryOrder={categoryOrder}
                  onAddItem={(category, prefill) => {
                    // Re-resolve against the live order so alias variants
                    // (e.g. 'Shelter' → 'Shelter System') are honoured and
                    // no duplicate category tab is created.
                    const resolved = resolveDestination(category, categoryOrder);
                    if (!categoryOrder.includes(resolved)) {
                      addCategory(resolved);
                    }
                    addItem(resolved, prefill);
                  }}
                />
                <LockerPanel
                  entries={lockerEntries}
                  onLoad={handleLoadFromLocker}
                  onRequestDelete={requestProtectedDelete}
                  onRename={handleRenameInLocker}
                />
              </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── Locker delete dialog ── */}
      {showDeleteDialog && pendingDeleteIds.length > 0 && (
        <LockerDeleteDialog
          entries={lockerEntries.filter(e => pendingDeleteIds.includes(e.id))}
          onConfirmed={handleConfirmedDelete}
          onCancel={() => { setShowDeleteDialog(false); setPendingDeleteIds([]); }}
          isGuest={isGuest}
        />
      )}

      {/* ── Preview modal ── */}
      {showPreview && (
        <PreviewModal
          onPrint={handlePrint}
          data={data}
          system={system}
          categoryOrder={categoryOrder}
          categoryMeta={categoryMeta}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* ── Print-only layout ── */}
      <PrintLayout
        data={data}
        system={system}
        categoryOrder={categoryOrder}
        categoryMeta={categoryMeta}
      />
    </>
  );
}

export default function Checklist() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return (
      <UnitProvider>
        <ChecklistContent key={user.id} userId={user.id} userEmail={user.primaryEmailAddress?.emailAddress} />
      </UnitProvider>
    );
  }

  return (
    <UnitProvider>
      <ChecklistContent key="guest" userId={undefined} isGuest />
    </UnitProvider>
  );
}
