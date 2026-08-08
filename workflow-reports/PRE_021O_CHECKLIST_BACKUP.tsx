import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useUser, useClerk } from '@clerk/react';
import { usePackData } from '../hooks/usePackData';
import { GearCategory } from '../components/GearCategory';
import { WeightSummary, WeightDistribution } from '../components/WeightSummary';
import { PrintLayout } from '../components/PrintLayout';
import { PreviewModal } from '../components/PreviewModal';
import { MailingListModal, hasSeenMailingPrompt } from '../components/MailingListModal';
import { UnitProvider, useUnit } from '../context/UnitContext';
import { sharePackList } from '../lib/exportPDF';
import { resolveDestination } from '../lib/categoryAliases';
import { useLocation, Redirect } from 'wouter';
import { isAdmin } from './AdminPage';
import { ImportGearPanel } from '../components/ImportGearPanel';
import { LockerPanel, LockerEntry } from '../components/LockerPanel';
import { LockerDeleteDialog } from '../components/LockerDeleteDialog';
import { LockerIcon } from '../components/LockerIcon';
import { LOCKER_KEY, BgSnapshot } from '../hooks/usePackData';
import { buildShareURL, type SharedLockerFile } from '../lib/shareLink';
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
            // ── Stash fork-local restore keys (scoped to this tab's forkId) ──────
            // tw-newseed-bg-uuid is removed here and cannot be re-read on a React
            // remount (e.g. Clerk token refresh).  Scoped keys (suffix = forkId)
            // let remounts recover this tab's OWN appearance without consuming a
            // key inherited from the opener tab.  window.open() copies the opener's
            // sessionStorage to the new tab; generic (unsuffixed) keys would be
            // read by the wrong tab on its first render.
            sessionStorage.setItem(`tw-fork-bg-restore-${forkId}`,     JSON.stringify(parsed.background ?? null));
            sessionStorage.setItem(`tw-fork-bgtone-restore-${forkId}`, parsed.bgTone ?? 'light');
            sessionStorage.setItem(`tw-fork-bgfade-restore-${forkId}`, String(parsed.bgFade ?? 1));
            localStorage.removeItem(`tw-newseed-bg-${forkId}`);
            return parsed.background ?? null;
          }
        }
        // ── Remount path ──────────────────────────────────────────────────────
        // tw-newseed-bg-uuid was consumed on the first render.  Use the scoped
        // restore key (suffixed with forkId) rather than a generic key.  Generic
        // keys are inherited by new tabs opened via window.open() and would be
        // consumed by the wrong tab.
        const restore = sessionStorage.getItem(`tw-fork-bg-restore-${forkId}`);
        if (restore !== null) {
          try { return JSON.parse(restore) ?? null; } catch {}
        }
        // ── savedListId path ──────────────────────────────────────────────────
        // ?savedListId= tabs also set tw-fork-id (they share the fork mechanism
        // for storage isolation), but they are NOT newseed/New tabs.  usePackData's
        // store initializer writes tw-savedlist-bg synchronously before any useState
        // initializer runs, so we can read it here on the tab's first render.
        // Stash to the SCOPED restore key so React remounts also recover the correct
        // bg without interfering with other tabs.
        try {
          const savedBg = sessionStorage.getItem('tw-savedlist-bg');
          if (savedBg !== null) {
            sessionStorage.removeItem('tw-savedlist-bg');
            const parsed = JSON.parse(savedBg) ?? null;
            sessionStorage.setItem(`tw-fork-bg-restore-${forkId}`, JSON.stringify(parsed));
            return parsed;
          }
        } catch {}
        // No snapshot — default to Clear (correct for newseed/New tabs on remount).
        return null;
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
    // Normal path (primary / non-fork tab)
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
    // Keep the scoped restore key current so remounts reflect the user's
    // latest explicit choice, not the stale Locker-load value.
    try {
      const forkId = sessionStorage.getItem('tw-fork-id');
      if (forkId) sessionStorage.setItem(`tw-fork-bg-restore-${forkId}`, JSON.stringify(bg ?? null));
    } catch {}
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
        const result = isNaN(v) ? 1 : Math.min(1, Math.max(0, v));
        // Stash to scoped restore key for remount resilience.
        try {
          const forkId = sessionStorage.getItem('tw-fork-id');
          if (forkId) sessionStorage.setItem(`tw-fork-bgfade-restore-${forkId}`, String(result));
        } catch {}
        return result;
      }
    } catch {}
    // ── Remount path for fork tabs ────────────────────────────────────────────
    // tw-newbg-fade was consumed on first render.  Use the SCOPED restore key
    // (suffixed with forkId) to avoid reading a key inherited from the opener tab.
    try {
      const forkId = sessionStorage.getItem('tw-fork-id');
      if (forkId) {
        const restore = sessionStorage.getItem(`tw-fork-bgfade-restore-${forkId}`);
        if (restore !== null) {
          const v = parseFloat(restore);
          return isNaN(v) ? 1 : Math.min(1, Math.max(0, v));
        }
      }
    } catch {}
    const s = localStorage.getItem('trailweigh:bgFade');
    const v = s ? parseFloat(s) : 1;
    return isNaN(v) ? 1 : Math.min(1, Math.max(0, v));
  });

  const handleBgFadeChange = (v: number) => {
    setBgFade(v);
    localStorage.setItem('trailweigh:bgFade', String(v));
    // Keep the scoped restore key current so remounts use the user's latest choice.
    try {
      const forkId = sessionStorage.getItem('tw-fork-id');
      if (forkId) sessionStorage.setItem(`tw-fork-bgfade-restore-${forkId}`, String(v));
    } catch {}
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
        // Stash to scoped restore key for remount resilience.
        try {
          const forkId = sessionStorage.getItem('tw-fork-id');
          if (forkId) sessionStorage.setItem(`tw-fork-bgtone-restore-${forkId}`, raw);
        } catch {}
        return raw as 'light' | 'dark';
      }
    } catch {}
    // ── Remount path for fork tabs ────────────────────────────────────────────
    // tw-newbg-tone was consumed on first render.  Use the SCOPED restore key
    // (suffixed with forkId) to avoid reading a key inherited from the opener tab.
    try {
      const forkId = sessionStorage.getItem('tw-fork-id');
      if (forkId) {
        const restore = sessionStorage.getItem(`tw-fork-bgtone-restore-${forkId}`);
        if (restore !== null) return restore as 'light' | 'dark';
      }
    } catch {}
    return (localStorage.getItem('trailweigh:bgTone') as 'light' | 'dark') ?? 'light';
  });

  const handleBgToneChange = (t: 'light' | 'dark') => {
    setBgTone(t);
    localStorage.setItem('trailweigh:bgTone', t);
    // Keep the scoped restore key current so remounts use the user's latest choice.
    try {
      const forkId = sessionStorage.getItem('tw-fork-id');
      if (forkId) sessionStorage.setItem(`tw-fork-bgtone-restore-${forkId}`, t);
    } catch {}
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
  // Computed: how many gear items exist (checked or not) — drives Share button state
  const totalItems = store.order.reduce(
    (s, cat) => s + (store.items[cat]?.length ?? 0), 0
  );
  const canShare = totalItems > 0;
  // Share flow: 'menu' = normal dropdown, 'locker-warning' = save-before-Share-Locker reminder
  const [shareStep, setShareStep] = useState<'menu' | 'locker-warning'>('menu');
  // Mobile-only: show "add items first" message when tapping the grayed Share button
  const [showEmptyShareMsg, setShowEmptyShareMsg] = useState(false);
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

  const [copied,         setCopied]         = useState(false);
  const [copiedPackList, setCopiedPackList] = useState(false);
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

  /**
   * Share Locker — generates a multi-file shared experience.
   * Snapshots ALL saved Locker files at generation time so the recipient sees
   * the full Shared Locker panel.  The current open file is the primary view.
   */
  const handleShareLocker = async () => {
    // Empty-list case is handled by the UI (Share button grayed out when canShare=false).
    // This guard is a defensive fallback only.
    if (store.order.length === 0) return;

    // Snapshot all saved Locker entries at share time (their saved state, not live state).
    // This populates the view-only Shared Locker on /s/:shareId.
    let lockerFiles: SharedLockerFile[] | undefined;
    try {
      const rawLocker = localStorage.getItem(LOCKER_KEY);
      const entries: LockerEntry[] = rawLocker ? JSON.parse(rawLocker) as LockerEntry[] : [];
      if (entries.length > 0) {
        lockerFiles = entries.map(e => ({
          id:              e.id,
          name:            e.name,
          store:           e.store,
          background:      e.background ?? null,
          bgFade:          e.bgFade ?? 1,
          bgTone:          e.bgTone ?? 'light',
          bgSize:          e.bgSize ?? 'cover',  // use saved bgSize; older entries without it default to cover
          chartPaletteKey: e.chartPaletteKey,
        }));
        console.log(`[TrailWeigh] Share Locker: included ${lockerFiles.length} Locker file(s) in shared snapshot`);
      } else {
        console.log('[TrailWeigh] Share Locker: no saved Locker files found — sharing without Shared Locker panel');
      }
    } catch { /* ignore — share works without locker snapshot */ }

    // Snapshot the complete current working file — same structure as Save.
    // Checkbox states are preserved as-is (unlike New which resets them).
    const payload = {
      type:          'locker' as const,
      data:          store.items,
      categoryOrder: store.order,
      categoryMeta:  store.meta,
      background:    background ?? null,
      bgFade,
      bgTone,
      bgSize,
      unit:          system,
      name:          activeLockerFile?.name ?? undefined,
      lockerFiles,
    };

    const url = await buildShareURL(payload);
    const ok = await copyUrlToClipboard(url);
    if (!ok) window.prompt('Copy this link:', url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /**
   * Share Pack List — generates a single read-only Preview-style link for the
   * CURRENT open list only.  No Locker panel, no editing, Print only.
   */
  const handleSharePackList = async () => {
    if (store.order.length === 0) return; // defensive — button is already grayed when !canShare
    const payload = {
      type:          'pack-list' as const,
      data:          store.items,
      categoryOrder: store.order,
      categoryMeta:  store.meta,
      background:    background ?? null,
      bgFade,
      bgTone,
      bgSize,
      unit:          system,
      name:          activeLockerFile?.name ?? undefined,
      // No lockerFiles — Pack List share intentionally exposes no Locker
    };
    console.log('[TrailWeigh] Share Pack List: generating read-only single-list link (no Locker snapshot)');
    const url = await buildShareURL(payload);
    const ok = await copyUrlToClipboard(url);
    if (!ok) window.prompt('Copy this link:', url);
    setCopiedPackList(true);
    setTimeout(() => setCopiedPackList(false), 2000);
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

    // 1. Write a genuinely empty gear newseed.
    //    __blank: true tells parseV5 to skip mergeDefaultCategories so the empty
    //    order is preserved — without it, parseV5 would re-insert all 13 default
    //    categories automatically.  The flag is consumed on first parse and is
    //    never written to persistent storage, so it has no side-effects on Save.
    localStorage.setItem(`tw-newseed-${uuid}`, JSON.stringify({
      __v: 5,
      __blank: true,
      items: {},
      order: [],
      meta: {},
    }));

    // 2. Write background settings.  New always opens with a Clear background
    //    (background: null) and Light mode (bgTone: 'light') regardless of what
    //    the source tab has — a genuinely fresh workspace.  Background libraries
    //    (IndexedDB photos, built-in landscapes, custom themes) are untouched.
    //    chartPaletteKey is still inherited so chart colours feel consistent.
    localStorage.setItem(`tw-newseed-bg-${uuid}`, JSON.stringify({
      background: null,
      bgFade: 1,
      bgTone: 'light',
      bgSize: 'cover',
      chartPaletteKey,
    }));

    const base = (import.meta.env.BASE_URL as string).replace(/\/$/, '');
    window.open(`${window.location.origin}${base}/checklist?newseed=${uuid}`, '_blank');
  }, [chartPaletteKey]);

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
      bgSize,
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
    toast({ description: `Saved ${name}` });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, background, bgFade, bgTone, bgSize, chartPaletteKey, lockerEntries, broadcastLocker, toast]);

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
        bgSize,
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
      toast({ description: `Saved ${name}` });
    } catch {
      toast({ description: 'Save failed. Your changes were not saved.', variant: 'destructive' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, background, bgFade, bgTone, bgSize, chartPaletteKey, lockerEntries, broadcastLocker, toast]);

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
      // Used when the current list is blank (New tab or empty list).
      //
      // 1. Restore ALL of the saved file's appearance state from the entry.
      //    Previously only palette was restored; background/tone/fade were left
      //    at the stale New-tab values (null/light/1).  A prior assumption that
      //    "the bg was already correct" held for normal tabs but not for a New
      //    tab whose state was forced to Clear+Light by 020A.  First-open now
      //    restores everything the same way the new-tab (?savedListId) path has
      //    always done.
      const restoredPalette = entry.chartPaletteKey ?? 'trail';
      setChartPaletteKey(restoredPalette);
      localStorage.setItem('trailweigh:chartPalette', restoredPalette);

      // Restore background image (null = Clear).
      setBackground(entry.background as Background | null);

      // Restore tone (dark/light).  Older entries without bgTone fall back to light.
      const restoredTone = entry.bgTone ?? 'light';
      setBgTone(restoredTone);

      // Restore fade/darken.  Older entries without bgFade fall back to 1 (none).
      const restoredFade = entry.bgFade ?? 1;
      setBgFade(restoredFade);

      // Restore Fill/Fit (cover/contain).  Older entries without bgSize fall back to cover.
      setBgSize(entry.bgSize ?? 'cover');

      // Persist appearance for React-remount resilience.
      //
      // Fork tabs (opened via New with ?newseed=) must NOT write the opened
      // file's background to the shared localStorage keys (BG_STORAGE_KEY,
      // trailweigh:bgTone, trailweigh:bgFade).  Those keys are global — any
      // other fork tab that remounts after this point would fall through to
      // them and show this file's background instead of its own Clear initial
      // state.  (This was the 020C root cause: 020B wrote BG_STORAGE_KEY here
      // unconditionally.)
      //
      // Fork tabs use tab-local sessionStorage restore keys instead.  The
      // background/bgTone/bgFade initialisers check these keys on remount
      // before falling through to localStorage, so each fork tab always
      // recovers its own appearance.
      //
      // Non-fork tabs (the primary checklist tab, which has no ?newseed= in
      // its URL) still write to localStorage so a full page reload restores
      // the correct appearance.
      const forkId = sessionStorage.getItem('tw-fork-id');
      const isForkTab = !!forkId;
      if (isForkTab && forkId) {
        // Scoped keys: suffixed with this tab's forkId so inherited generic keys
        // from the opener are never confused with this tab's restoration data.
        sessionStorage.setItem(`tw-fork-bg-restore-${forkId}`,     JSON.stringify(entry.background ?? null));
        sessionStorage.setItem(`tw-fork-bgtone-restore-${forkId}`, restoredTone);
        sessionStorage.setItem(`tw-fork-bgfade-restore-${forkId}`, String(restoredFade));
      } else {
        if (entry.background) localStorage.setItem(BG_STORAGE_KEY, JSON.stringify(entry.background));
        else localStorage.removeItem(BG_STORAGE_KEY);
        localStorage.setItem('trailweigh:bgTone', restoredTone);
        localStorage.setItem('trailweigh:bgFade', String(restoredFade));
      }

      // 2. Replace the store (clears undo/redo; does not push history entry).
      replaceStore(entry.store as import('../hooks/usePackData').Store);

      // 3. Track the active file identity so Save routes to commitSaveReplace
      //    (updating this file, not creating a new one).
      //    Write to sessionStorage immediately (before the React state update
      //    queues) so the value survives a remount that might occur before the
      //    useEffect sync fires.
      const newActiveFile: ActiveLockerFile = { id: entry.id, name: entry.name };
      writeActiveLockerFileToSS(newActiveFile);
      setActiveLockerFile(newActiveFile);
      // Stay in the same tab — no window.open.
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

  /**
   * Called when the user clicks "Yes" on the LockerPanel inline confirm.
   * Opens the identity-verification dialog before performing any deletion.
   * Deletion requires authentication — signed-out sessions are redirected before
   * reaching /checklist, but this guard ensures no unauthenticated deletion path exists.
   */
  const requestProtectedDelete = useCallback((id: string) => {
    // Require authentication. This is a defensive check in addition to the route guard.
    if (isGuest || !userId) return;
    setPendingDeleteIds([id]);
    setShowDeleteDialog(true);
  }, [isGuest, userId]);

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

        <main className="w-full max-w-full mx-auto px-3 sm:px-4 lg:px-8 flex-1 min-h-0 lg:flex lg:flex-col">

          {/* ── Toolbar group — all toolbar controls share this single parent.
               To reposition the entire toolbar, change classes on this element only. ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_365px] lg:gap-4">

            {/* Left toolbar panel — Pinned pills row */}
            <div className="pt-8 pb-3 flex items-center lg:pr-7 flex-shrink-0 relative">
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
                    Uses inset-0 + matching pt-8 pb-3 so flex items-center references the same
                    content area as the outer container, putting the pill on the exact same
                    vertical centerline as Hide / Preview / Imperial / Metric. */}
                {activeLockerFile && (
                  <div className="absolute inset-0 pt-8 pb-3 flex items-center justify-center pointer-events-none">
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

            {/* Right toolbar panel — visually first in sidebar column via order-first at mobile ── */}
            <div className="order-first lg:order-last relative flex flex-wrap justify-center lg:justify-end gap-2 pt-8 pb-3 lg:pl-3 lg:pr-9 flex-shrink-0">
                <div ref={bgPickerContainerRef}>
                  <BackgroundPickerButton
                    onClick={() => setBackgroundPickerOpen(o => !o)}
                    active={!!background}
                    panelOpen={backgroundPickerOpen}
                  />
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
                  {!canShare ? (
                    /* Empty list — visually dimmed, explains on hover (desktop) or tap (mobile) */
                    <div className="group relative">
                      <button
                        type="button"
                        aria-disabled="true"
                        onClick={() => setShowEmptyShareMsg(v => !v)}
                        onBlur={() => setShowEmptyShareMsg(false)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground/40 border border-border/40 bg-card px-3 py-1.5 rounded-lg cursor-not-allowed select-none"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        Share
                      </button>
                      {/* Desktop: CSS hover/focus tooltip */}
                      <div className="pointer-events-none absolute right-0 top-full mt-1.5 bg-popover text-popover-foreground text-xs border border-border rounded-lg px-3 py-2 shadow-md whitespace-nowrap z-20 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity hidden md:block">
                        Add some gear items before creating a share link.
                      </div>
                      {/* Mobile: tap toggles message */}
                      {showEmptyShareMsg && (
                        <div className="absolute right-0 top-full mt-1.5 bg-popover text-popover-foreground text-xs border border-border rounded-lg px-3 py-2 shadow-md whitespace-nowrap z-20 md:hidden">
                          Add some gear items before creating a share link.
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Active: normal Share button with dropdown */
                    <>
                      <button
                        onClick={() => { setShowShareMenu(o => !o); setShareStep('menu'); }}
                        className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 bg-card hover:bg-muted/50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        Share
                      </button>
                      {showShareMenu && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => { setShowShareMenu(false); setShareStep('menu'); }} />
                          <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-20 min-w-[220px] py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                            {shareStep === 'menu' ? (
                              <>
                                {/* ── Share Link ── */}
                                <button
                                  onClick={() => setShareStep('locker-warning')}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted/60 transition-colors"
                                >
                                  <Link className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                  <div className="text-left">
                                    <div className="font-medium">{copied ? 'Copied!' : 'Share Link'}</div>
                                    <div className="text-[11px] text-muted-foreground">All your saved files</div>
                                  </div>
                                </button>

                                {/* ── Share Pack List ── */}
                                <button
                                  onClick={async () => {
                                    setShowShareMenu(false);
                                    setShareStep('menu');
                                    await handleSharePackList();
                                  }}
                                  disabled={!canShare}
                                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                                    canShare
                                      ? 'text-foreground hover:bg-muted/60'
                                      : 'text-muted-foreground/50 cursor-not-allowed'
                                  }`}
                                >
                                  <Share2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                  <div className="text-left">
                                    <div className="font-medium">{copiedPackList ? 'Copied!' : 'Share Pack List'}</div>
                                    <div className="text-[11px] text-muted-foreground">
                                      {canShare ? 'Copy link, read-only' : 'Add gear items first'}
                                    </div>
                                  </div>
                                </button>

                                <div className="my-1 border-t border-border" />

                                {/* ── Download PDF ── */}
                                <button
                                  onClick={() => { handleShare(); setShowShareMenu(false); setShareStep('menu'); }}
                                  disabled={sharing}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted/60 transition-colors disabled:opacity-50"
                                >
                                  <FileDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                  {sharing ? 'Preparing…' : 'Download PDF'}
                                </button>
                              </>
                            ) : (
                              /* Share Link — save-before-share reminder */
                              <div className="px-3 py-3 space-y-2.5">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  Save the currently open file first so its latest changes appear in the shared Locker snapshot.
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={async () => {
                                      setShowShareMenu(false);
                                      setShareStep('menu');
                                      await handleShareLocker();
                                    }}
                                    className="flex-1 text-xs font-semibold bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
                                  >
                                    Share Link Anyway
                                  </button>
                                  <button
                                    onClick={() => setShareStep('menu')}
                                    className="text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
            </div>

          </div>{/* end toolbar group */}

          {/* ── Content area ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_365px] gap-8 lg:gap-4 lg:flex-1 lg:min-h-0 lg:overflow-hidden">

            {/* Scrollable categories */}
            <div className="lg:h-full lg:overflow-y-auto lg:min-h-0 space-y-2 pb-8 lg:pr-3 lg:[scrollbar-gutter:stable]">
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

            {/* Scrollable sidebar content */}
            <div className="order-first lg:order-last lg:h-full lg:overflow-y-auto lg:min-h-0 lg:pl-1 lg:pr-5 lg:[scrollbar-gutter:stable]">
              <div className="flex flex-col gap-4 py-2 pb-8">
                <WeightSummary
                  data={data}
                  categoryOrder={categoryOrder}
                  categoryMeta={categoryMeta}
                />
                <WeightDistribution
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

          </div>{/* end content area */}
        </main>
      </div>

      {/* ── Locker delete dialog ── */}
      {showDeleteDialog && pendingDeleteIds.length > 0 && (
        <LockerDeleteDialog
          entries={lockerEntries.filter(e => pendingDeleteIds.includes(e.id))}
          onConfirmed={handleConfirmedDelete}
          onCancel={() => { setShowDeleteDialog(false); setPendingDeleteIds([]); }}
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
          onSharePackList={canShare ? async () => {
            setShowPreview(false);
            await handleSharePackList();
          } : undefined}
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

  // Signed out — require sign-in; do NOT render private checklist data.
  return <Redirect to="/sign-in" />;
}
