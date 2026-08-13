import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useUser, useClerk } from '@clerk/react';
import { usePackData } from '../hooks/usePackData';
import { GearCategory } from '../components/GearCategory';
import { WeightSummary, WeightDistribution } from '../components/WeightSummary';
import { PrintLayout } from '../components/PrintLayout';
import { PreviewModal } from '../components/PreviewModal';
import Footer from '@/components/Footer';
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
import type { PhotoCollection } from '../lib/bgCollections';
import { buildShareURL, buildLiveShareURL } from '../lib/shareLink';
import {
  fetchLockerEntries,
  fetchLockerStatus,
  mergeLockerEntries,
  serverSaveNew,
  serverSaveReplace,
  serverRename,
  serverDeleteMany,
  migrateLockerToServer,
} from '../lib/lockerApi';
import { useToast } from '../hooks/use-toast';
import {
  RotateCcw, Tent, Share2, Link, FileDown, LogOut,
  User, Shield, Plus, Check, X, ChevronsUpDown, Printer, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { BackgroundPickerButton, BackgroundPickerPanel, Background, BG_STORAGE_KEY, ALL_BUILTIN_PRESETS, getFullUrl } from '../components/BackgroundPicker';
import { BarStyleProvider, useBarStyle, barCombinedStyle, barBgStyle, barFgStyle } from '../context/BarStyleContext';
import { getPhotoBlob, createPhotoObjectUrl, revokePhotoObjectUrl } from '../lib/bgPhotoStore';
import { useInactivityTimer } from '../hooks/useInactivityTimer';
import { BackgroundShowcase } from '../components/BackgroundShowcase';

function UnitToggle() {
  const { system, setSystem } = useUnit();
  const barStyle = useBarStyle();
  const customBar = !!barStyle.barColor;

  return (
    <div
      className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5"
      style={barBgStyle(barStyle)}
    >
      <button
        onClick={() => setSystem('imperial')}
        className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
          system === 'imperial' && !customBar
            ? 'bg-card text-foreground shadow-sm'
            : !customBar ? 'text-muted-foreground hover:text-foreground' : ''
        }`}
        style={customBar
          ? system === 'imperial'
            ? { backgroundColor: 'rgba(255,255,255,0.22)', color: barStyle.barTextColor || 'white', fontFamily: barStyle.barFont || undefined }
            : { color: barStyle.barTextColor ? `${barStyle.barTextColor}99` : 'rgba(255,255,255,0.6)', fontFamily: barStyle.barFont || undefined }
          : barStyle.barFont ? { fontFamily: barStyle.barFont } : undefined
        }
      >
        Imperial
      </button>
      <button
        onClick={() => setSystem('metric')}
        className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
          system === 'metric' && !customBar
            ? 'bg-card text-foreground shadow-sm'
            : !customBar ? 'text-muted-foreground hover:text-foreground' : ''
        }`}
        style={customBar
          ? system === 'metric'
            ? { backgroundColor: 'rgba(255,255,255,0.22)', color: barStyle.barTextColor || 'white', fontFamily: barStyle.barFont || undefined }
            : { color: barStyle.barTextColor ? `${barStyle.barTextColor}99` : 'rgba(255,255,255,0.6)', fontFamily: barStyle.barFont || undefined }
          : barStyle.barFont ? { fontFamily: barStyle.barFont } : undefined
        }
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
  /** Present in Review/sandbox mode — keyed by share token for local-storage isolation.
   *  When set: pack data and Locker entries use token-scoped localStorage keys;
   *  server API calls are already gated on userId and are skipped automatically. */
  reviewToken?: string;
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

/**
 * 022G — Last-active-file persistence.
 *
 * Stores the last Locker file the user actively opened or saved, scoped to
 * their Clerk user ID so User A's file is never shown to User B.
 * Only written by the primary (non-fork) Checklist tab — SharedChecklistPage
 * never writes here, enforcing shared-link isolation.
 */
const LAST_ACTIVE_FILE_LS_PREFIX = 'trailweigh:last-active-file-';

function readLastActiveFileFromLS(uid: string): ActiveLockerFile | null {
  try {
    const raw = localStorage.getItem(LAST_ACTIVE_FILE_LS_PREFIX + uid);
    return raw ? (JSON.parse(raw) as ActiveLockerFile) : null;
  } catch { return null; }
}

function writeLastActiveFileToLS(uid: string, value: ActiveLockerFile | null): void {
  try {
    const key = LAST_ACTIVE_FILE_LS_PREFIX + uid;
    if (value) localStorage.setItem(key, JSON.stringify(value));
    else localStorage.removeItem(key);
  } catch {}
}

export function ChecklistContent({ userId, userEmail, isGuest = false, reviewToken }: ChecklistContentProps) {
  // ── onRestoreBg: called by undo/redo to restore the background that was
  // active at the time of the history entry.  Defined as a stable useCallback
  // so the ref inside usePackData stays current without recreation.
  // Note: this callback is defined before usePackData so the ref is available
  // at hook call time, but it closes over background/bgSize setters which are
  // defined later.  We use function refs to avoid stale closures.
  const restoreBgCallbackRef = useRef<((bg: BgSnapshot) => void) | null>(null);
  // 023A: Populated by BackgroundPickerPanel; called here on undo/redo to
  // restore custom-theme collections when the history entry includes them.
  const restoreCollectionsRef = useRef<
    ((collections: PhotoCollection[], activeThemeId: string) => void) | null
  >(null);
  // Mirrors bgSize state as a ref so handleBackgroundChange can read the
  // current size without a temporal dependency on bgSize's declaration order.
  const bgSizeRef = useRef<'cover' | 'contain'>('cover');
  // 023E/023G: Bar style refs — same temporal-ordering pattern as bgSizeRef.
  // Used in handleBackgroundChange and handleBgSizeChange which are declared
  // before the barColor/barFont/barTextColor/barTransparency state initialisers.
  const barColorRef        = useRef('');
  const barFontRef         = useRef('');
  const barTextColorRef    = useRef('');
  const barTransparencyRef = useRef(1);
  // 023N: Tracks the barTransparency value at the START of a drag/key interaction
  // so that a single undo entry is pushed per gesture (not per pixel of movement).
  const barTransparencyBeforeDragRef = useRef(1);
  // 023Q: Tracks bar color / text color value BEFORE the native picker opens.
  // Same one-entry-per-interaction pattern as barTransparencyBeforeDragRef.
  const barColorBeforePickerRef     = useRef('');
  const barTextColorBeforePickerRef = useRef('');
  const onRestoreBg = useCallback((bg: BgSnapshot) => {
    restoreBgCallbackRef.current?.(bg);
  }, []);

  // ── Review/sandbox mode — derived from reviewToken prop ──────────────────
  // isReview: true when this instance is the Public Review Sandbox (025L).
  // reviewLockerKey: token-scoped localStorage key for reviewer's local files.
  // All server Locker API calls (serverSaveNew, serverRename, etc.) are already
  // gated on `if (userId)` throughout this file — they are automatically skipped
  // in review mode because userId is undefined.
  const isReview = !!reviewToken;
  const reviewLockerKey = reviewToken
    ? `trailweigh:review:${reviewToken}:locker`
    : LOCKER_KEY;

  const {
    data, categoryOrder, categoryMeta, store,
    updateItem, addItem, removeItem, moveItem,
    addCategory, deleteCategory, updateCategoryMeta, moveCategory, reorderCategory,
    renameCategory, loadStore, replaceStore,
    resetToDefaults,
    undo, redo, canUndo, canRedo,
    syncBg, pushBg,
  } = usePackData(userId, {
    onRestoreBg,
    // Review mode: use a token-scoped storage key so reviewer gear data is
    // completely isolated from any owner or guest data on the same device.
    storageKey: reviewToken ? `trailweigh:review:${reviewToken}:pack` : undefined,
  });

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
            // 023G: stash bar style defaults for the new tab (normally all '' / 1).
            // The bar style lazy initialisers read these BEFORE falling through to
            // global localStorage, so a new tab always starts with default appearance
            // even if another tab has live customizations stored in localStorage.
            sessionStorage.setItem('tw-newbg-barcolor',        parsed.barColor       ?? '');
            sessionStorage.setItem('tw-newbg-barfont',         parsed.barFont        ?? '');
            sessionStorage.setItem('tw-newbg-bartextcolor',    parsed.barTextColor   ?? '');
            sessionStorage.setItem('tw-newbg-bartransparency', String(parsed.barTransparency ?? 1));
            // ── Stash fork-local restore keys (scoped to this tab's forkId) ──────
            // tw-newseed-bg-uuid is removed here and cannot be re-read on a React
            // remount (e.g. Clerk token refresh).  Scoped keys (suffix = forkId)
            // let remounts recover this tab's OWN appearance without consuming a
            // key inherited from the opener tab.  window.open() copies the opener's
            // sessionStorage to the new tab; generic (unsuffixed) keys would be
            // read by the wrong tab on its first render.
            sessionStorage.setItem(`tw-fork-bg-restore-${forkId}`,              JSON.stringify(parsed.background ?? null));
            sessionStorage.setItem(`tw-fork-bgtone-restore-${forkId}`,          parsed.bgTone ?? 'light');
            sessionStorage.setItem(`tw-fork-bgfade-restore-${forkId}`,          String(parsed.bgFade ?? 1));
            // 023G: scoped restore keys for bar style (used on React remounts within the same fork tab)
            sessionStorage.setItem(`tw-fork-barcolor-restore-${forkId}`,        parsed.barColor       ?? '');
            sessionStorage.setItem(`tw-fork-barfont-restore-${forkId}`,         parsed.barFont        ?? '');
            sessionStorage.setItem(`tw-fork-bartextcolor-restore-${forkId}`,    parsed.barTextColor   ?? '');
            sessionStorage.setItem(`tw-fork-bartransparency-restore-${forkId}`, String(parsed.barTransparency ?? 1));
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
      // 023H: removeItem can itself throw (Safari SecurityError) — guard it.
      try { localStorage.removeItem(BG_STORAGE_KEY); } catch {}
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
    pushBg({ background, bgSize: bgSizeRef.current, barColor: barColorRef.current, barFont: barFontRef.current, barTextColor: barTextColorRef.current, barTransparency: barTransparencyRef.current });
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
    pushBg({ background, bgSize, barColor: barColorRef.current, barFont: barFontRef.current, barTextColor: barTextColorRef.current, barTransparency: barTransparencyRef.current });
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

  // ── 023E/023G: Bar Color / Text / Transparency state ─────────────────────
  // 023G ISOLATION FIX: New-tab fork isolation uses the same scoped-sessionStorage
  // pattern as bgFade/bgTone/bgSize.  handleNew() writes bar style DEFAULTS
  // (all '' / 1) into the tw-newseed-bg-${uuid} bundle.  The background state
  // initialiser (which runs first) stashes these as tw-newbg-barcolor etc. and
  // tw-fork-bar*-restore-${forkId} scoped keys.  The initialisers below read the
  // newseed stash first — so a new tab always starts with default appearance even
  // when another tab has live customizations stored in localStorage.
  const [barColor, setBarColor] = useState<string>(() => {
    try {
      // New-tab path: consumed once on first render
      const v = sessionStorage.getItem('tw-newbg-barcolor');
      if (v !== null) {
        sessionStorage.removeItem('tw-newbg-barcolor');
        try {
          const forkId = sessionStorage.getItem('tw-fork-id');
          if (forkId) sessionStorage.setItem(`tw-fork-barcolor-restore-${forkId}`, v);
        } catch {}
        return v;
      }
    } catch {}
    // Remount path for fork tabs
    try {
      const forkId = sessionStorage.getItem('tw-fork-id');
      if (forkId) {
        const restore = sessionStorage.getItem(`tw-fork-barcolor-restore-${forkId}`);
        if (restore !== null) return restore;
        // 023P: savedListId path — stashed by usePackData before any useState runs.
        // Consume and promote to scoped restore key so remounts also recover the file's own value.
        try {
          const saved = sessionStorage.getItem('tw-savedlist-barcolor');
          if (saved !== null) {
            sessionStorage.removeItem('tw-savedlist-barcolor');
            sessionStorage.setItem(`tw-fork-barcolor-restore-${forkId}`, saved);
            return saved;
          }
        } catch {}
      }
    } catch {}
    // 023H: guard against Safari SecurityError / QuotaExceededError
    try { return localStorage.getItem('trailweigh:barColor') ?? ''; } catch { return ''; }
  });
  const [barFont, setBarFont] = useState<string>(() => {
    try {
      const v = sessionStorage.getItem('tw-newbg-barfont');
      if (v !== null) {
        sessionStorage.removeItem('tw-newbg-barfont');
        try {
          const forkId = sessionStorage.getItem('tw-fork-id');
          if (forkId) sessionStorage.setItem(`tw-fork-barfont-restore-${forkId}`, v);
        } catch {}
        return v;
      }
    } catch {}
    try {
      const forkId = sessionStorage.getItem('tw-fork-id');
      if (forkId) {
        const restore = sessionStorage.getItem(`tw-fork-barfont-restore-${forkId}`);
        if (restore !== null) return restore;
        // 023P: savedListId path
        try {
          const saved = sessionStorage.getItem('tw-savedlist-barfont');
          if (saved !== null) {
            sessionStorage.removeItem('tw-savedlist-barfont');
            sessionStorage.setItem(`tw-fork-barfont-restore-${forkId}`, saved);
            return saved;
          }
        } catch {}
      }
    } catch {}
    // 023H: guard against Safari SecurityError / QuotaExceededError
    try { return localStorage.getItem('trailweigh:barFont') ?? ''; } catch { return ''; }
  });
  const [barTextColor, setBarTextColor] = useState<string>(() => {
    try {
      const v = sessionStorage.getItem('tw-newbg-bartextcolor');
      if (v !== null) {
        sessionStorage.removeItem('tw-newbg-bartextcolor');
        try {
          const forkId = sessionStorage.getItem('tw-fork-id');
          if (forkId) sessionStorage.setItem(`tw-fork-bartextcolor-restore-${forkId}`, v);
        } catch {}
        return v;
      }
    } catch {}
    try {
      const forkId = sessionStorage.getItem('tw-fork-id');
      if (forkId) {
        const restore = sessionStorage.getItem(`tw-fork-bartextcolor-restore-${forkId}`);
        if (restore !== null) return restore;
        // 023P: savedListId path
        try {
          const saved = sessionStorage.getItem('tw-savedlist-bartextcolor');
          if (saved !== null) {
            sessionStorage.removeItem('tw-savedlist-bartextcolor');
            sessionStorage.setItem(`tw-fork-bartextcolor-restore-${forkId}`, saved);
            return saved;
          }
        } catch {}
      }
    } catch {}
    // 023H: guard against Safari SecurityError / QuotaExceededError
    try { return localStorage.getItem('trailweigh:barTextColor') ?? ''; } catch { return ''; }
  });
  // 023G: Bar transparency (0 = fully transparent, 1 = solid).  Same fork
  // isolation pattern as barColor above.  Default = 1 (solid).
  const [barTransparency, setBarTransparency] = useState<number>(() => {
    try {
      const v = sessionStorage.getItem('tw-newbg-bartransparency');
      if (v !== null) {
        sessionStorage.removeItem('tw-newbg-bartransparency');
        const n = parseFloat(v);
        const result = isNaN(n) ? 1 : Math.max(0, Math.min(1, n));
        try {
          const forkId = sessionStorage.getItem('tw-fork-id');
          if (forkId) sessionStorage.setItem(`tw-fork-bartransparency-restore-${forkId}`, String(result));
        } catch {}
        return result;
      }
    } catch {}
    try {
      const forkId = sessionStorage.getItem('tw-fork-id');
      if (forkId) {
        const restore = sessionStorage.getItem(`tw-fork-bartransparency-restore-${forkId}`);
        if (restore !== null) {
          const n = parseFloat(restore);
          return isNaN(n) ? 1 : Math.max(0, Math.min(1, n));
        }
        // 023P: savedListId path
        try {
          const saved = sessionStorage.getItem('tw-savedlist-bartransparency');
          if (saved !== null) {
            sessionStorage.removeItem('tw-savedlist-bartransparency');
            const n2 = parseFloat(saved);
            const result = isNaN(n2) ? 1 : Math.max(0, Math.min(1, n2));
            sessionStorage.setItem(`tw-fork-bartransparency-restore-${forkId}`, String(result));
            return result;
          }
        } catch {}
      }
    } catch {}
    // 023H: guard against Safari SecurityError / QuotaExceededError
    try {
      const s = localStorage.getItem('trailweigh:barTransparency');
      const n = s ? parseFloat(s) : 1;
      return isNaN(n) ? 1 : Math.max(0, Math.min(1, n));
    } catch { return 1; }
  });

  // ── helper: keep fork-scoped restore key current so React remounts within
  // this tab recover the correct live value, not the stale newseed default.
  const updateBarForkKey = (suffix: string, value: string) => {
    try {
      const forkId = sessionStorage.getItem('tw-fork-id');
      if (forkId) sessionStorage.setItem(`tw-fork-${suffix}-restore-${forkId}`, value);
    } catch {}
  };

  // 023Q: Bar Color — three-phase pattern matching barTransparency (023N).
  //
  // handleBarColorPickerStart — called on mousedown on the color input.
  //   Records the color BEFORE the picker opens so the undo entry captures
  //   the correct pre-pick snapshot regardless of how many intermediate
  //   samples the native picker fires.
  const handleBarColorPickerStart = () => {
    barColorBeforePickerRef.current = barColorRef.current;
  };
  //
  // handleBarColorChange — called on every onChange (many times per pick).
  //   Live preview only: updates React state + ref + fork restore key so
  //   bars repaint immediately.  Does NOT push an undo entry or write to
  //   localStorage — avoids undo-storms and write-storms during sampling.
  const handleBarColorChange = (v: string) => {
    setBarColor(v);
    barColorRef.current = v;
    updateBarForkKey('barcolor', v);
  };
  //
  // handleBarColorCommit — called on blur (picker closed / focus left input).
  //   Fires once per pick interaction.  Pushes one undo entry using the
  //   pre-pick snapshot and writes the final value to localStorage.
  const handleBarColorCommit = () => {
    const before  = barColorBeforePickerRef.current;
    const current = barColorRef.current;
    if (before === current) return; // picker opened but color unchanged — skip
    pushBg({ background, bgSize: bgSizeRef.current, barColor: before, barFont, barTextColor, barTransparency: barTransparencyRef.current });
    if (current) localStorage.setItem('trailweigh:barColor', current);
    else         localStorage.removeItem('trailweigh:barColor');
    barColorBeforePickerRef.current = current;
    // 023R: Update currentBgRef with the AFTER state so that when undo() fires
    // it saves the correct after-color onto the redo stack (not the stale before-color).
    // The syncBg useEffect only watches [background, bgSize] — bar color changes
    // are never synced otherwise, causing redo to restore the wrong color.
    syncBg({
      background,
      bgSize: bgSizeRef.current,
      barColor: current,
      barFont: barFontRef.current,
      barTextColor: barTextColorRef.current,
      barTransparency: barTransparencyRef.current,
    });
  };
  const handleBarFontChange = (v: string) => {
    pushBg({ background, bgSize: bgSizeRef.current, barColor, barFont, barTextColor, barTransparency: barTransparencyRef.current });
    setBarFont(v);
    barFontRef.current = v;
    if (v) localStorage.setItem('trailweigh:barFont', v);
    else localStorage.removeItem('trailweigh:barFont');
    updateBarForkKey('barfont', v);
  };
  // 023Q: Text Color — same three-phase pattern as Bar Color above.
  const handleBarTextColorPickerStart = () => {
    barTextColorBeforePickerRef.current = barTextColorRef.current;
  };
  const handleBarTextColorChange = (v: string) => {
    setBarTextColor(v);
    barTextColorRef.current = v;
    updateBarForkKey('bartextcolor', v);
  };
  const handleBarTextColorCommit = () => {
    const before  = barTextColorBeforePickerRef.current;
    const current = barTextColorRef.current;
    if (before === current) return;
    pushBg({ background, bgSize: bgSizeRef.current, barColor, barFont, barTextColor: before, barTransparency: barTransparencyRef.current });
    if (current) localStorage.setItem('trailweigh:barTextColor', current);
    else         localStorage.removeItem('trailweigh:barTextColor');
    barTextColorBeforePickerRef.current = current;
    // 023R: Same fix as handleBarColorCommit — update currentBgRef with the
    // AFTER text-color so the redo stack entry captures the correct value.
    syncBg({
      background,
      bgSize: bgSizeRef.current,
      barColor: barColorRef.current,
      barFont: barFontRef.current,
      barTextColor: current,
      barTransparency: barTransparencyRef.current,
    });
  };
  // 023G/023N: Transparency change — split into live preview + commit.
  //
  // handleBarTransparencyDragStart — called on mousedown/keydown.
  //   Records the value BEFORE the drag so the undo entry stores the correct
  //   pre-drag snapshot instead of the mid-drag value.
  const handleBarTransparencyDragStart = () => {
    barTransparencyBeforeDragRef.current = barTransparencyRef.current;
  };
  //
  // handleBarTransparencyChange — called on every onChange (many times per drag).
  //   Live preview only: updates React state + ref so bars repaint immediately.
  //   Does NOT push an undo entry or write to localStorage to avoid undo-storms
  //   and excessive storage writes during a drag gesture.
  const handleBarTransparencyChange = (v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setBarTransparency(clamped);
    barTransparencyRef.current = clamped;
  };
  //
  // handleBarTransparencyCommit — called on mouseup/touchend/keyup/blur.
  //   Fires once per drag gesture.  Pushes one undo entry using the
  //   pre-drag snapshot and persists the final value to localStorage.
  const handleBarTransparencyCommit = () => {
    const before = barTransparencyBeforeDragRef.current;
    const current = barTransparencyRef.current;
    if (before === current) return; // no change — skip noisy undo entry
    pushBg({ background, bgSize: bgSizeRef.current, barColor, barFont, barTextColor, barTransparency: before });
    localStorage.setItem('trailweigh:barTransparency', String(current));
    updateBarForkKey('bartransparency', String(current));
    // Update the "before" ref so a subsequent drag in the same session
    // doesn't compare against a stale pre-drag value.
    barTransparencyBeforeDragRef.current = current;
  };
  const handleResetBarStyle = () => {
    pushBg({ background, bgSize: bgSizeRef.current, barColor, barFont, barTextColor, barTransparency: barTransparencyRef.current });
    setBarColor('');       barColorRef.current        = '';
    setBarFont('');        barFontRef.current          = '';
    setBarTextColor('');   barTextColorRef.current     = '';
    setBarTransparency(1); barTransparencyRef.current  = 1;
    localStorage.removeItem('trailweigh:barColor');
    localStorage.removeItem('trailweigh:barFont');
    localStorage.removeItem('trailweigh:barTextColor');
    localStorage.removeItem('trailweigh:barTransparency');
    updateBarForkKey('barcolor',        '');
    updateBarForkKey('barfont',         '');
    updateBarForkKey('bartextcolor',    '');
    updateBarForkKey('bartransparency', '1');
  };

  // ── Keep bar style refs in sync so handlers declared before these state
  // declarations can safely read the current values.
  barColorRef.current        = barColor;
  barFontRef.current         = barFont;
  barTextColorRef.current    = barTextColor;
  barTransparencyRef.current = barTransparency;

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
    // 023A: Restore custom-theme collections when the snapshot includes them
    // (present only in entries created by custom-theme deletion).
    if (snap.collections !== undefined) {
      restoreCollectionsRef.current?.(snap.collections, snap.activeThemeId ?? 'landscapes');
    }
    // 023E/023G: Restore bar style when the snapshot includes it
    if (snap.barColor !== undefined) {
      setBarColor(snap.barColor);
      barColorRef.current = snap.barColor;
      if (snap.barColor) localStorage.setItem('trailweigh:barColor', snap.barColor);
      else localStorage.removeItem('trailweigh:barColor');
      updateBarForkKey('barcolor', snap.barColor);
    }
    if (snap.barFont !== undefined) {
      setBarFont(snap.barFont);
      barFontRef.current = snap.barFont;
      if (snap.barFont) localStorage.setItem('trailweigh:barFont', snap.barFont);
      else localStorage.removeItem('trailweigh:barFont');
      updateBarForkKey('barfont', snap.barFont);
    }
    if (snap.barTextColor !== undefined) {
      setBarTextColor(snap.barTextColor);
      barTextColorRef.current = snap.barTextColor;
      if (snap.barTextColor) localStorage.setItem('trailweigh:barTextColor', snap.barTextColor);
      else localStorage.removeItem('trailweigh:barTextColor');
      updateBarForkKey('bartextcolor', snap.barTextColor);
    }
    if (snap.barTransparency !== undefined) {
      const t = Math.max(0, Math.min(1, snap.barTransparency));
      setBarTransparency(t);
      barTransparencyRef.current = t;
      localStorage.setItem('trailweigh:barTransparency', String(t));
      updateBarForkKey('bartransparency', String(t));
    }
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
      ? getFullUrl(ALL_BUILTIN_PRESETS.find(p => p.id === background.id)?.photoId ?? '')
      : customBgObjectUrl
    : null;

  const [showShareMenu, setShowShareMenu] = useState(false);
  // 025G: ref + computed position for the Share dropdown.
  // The toolbar row has lg:overflow-hidden which clips absolute children that extend
  // below it (same issue that forced BackgroundPickerPanel to use fixed positioning).
  // Using fixed + getBoundingClientRect lets the dropdown escape the overflow clip.
  const shareContainerRef = useRef<HTMLDivElement>(null);
  const [shareMenuPos, setShareMenuPos] = useState<{ top: number; right: number } | null>(null);
  // 023E: Tracks Share button hover so we can apply white text inline (inline
  // styles can't be overridden by Tailwind hover pseudo-classes).
  const [shareHovered, setShareHovered] = useState(false);
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

  // 022G: start collapsed — categories, Pack Summary, and Weight Distribution all
  // begin closed on every fresh open/refresh.  The Open/Close control still works
  // normally after startup.
  const [allOpen, setAllOpen] = useState(false);
  const [openCloseSeq, setOpenCloseSeq] = useState(0);
  // 025F: Per-panel sidebar state for single-open accordion behavior.
  // Each panel gets its own { open, seq } pair so Expand All / Collapse All and
  // individual accordion toggles can be applied independently.
  type SidebarPanelKey = 'summary' | 'distribution' | 'import' | 'locker';
  const [sidebarForce, setSidebarForce] = useState<Record<SidebarPanelKey, { open: boolean; seq: number }>>({
    summary:      { open: false, seq: 0 },
    distribution: { open: false, seq: 0 },
    import:       { open: false, seq: 0 },
    locker:       { open: false, seq: 0 },
  });
  const SIDEBAR_KEYS: SidebarPanelKey[] = ['summary', 'distribution', 'import', 'locker'];
  // Derived active states for Expand All / Collapse All button highlights
  const sidebarExpandActive   = SIDEBAR_KEYS.every(k => sidebarForce[k].open);
  const sidebarCollapseActive = SIDEBAR_KEYS.every(k => !sidebarForce[k].open);
  /** 025F: Accordion — open one sidebar panel, automatically close all others. */
  const handleSidebarPanelToggle = useCallback((id: SidebarPanelKey, nowOpen: boolean) => {
    setSidebarForce(prev => {
      const next = { ...prev };
      if (nowOpen) {
        // Close all other panels so only the newly opened one remains
        for (const k of ['summary', 'distribution', 'import', 'locker'] as SidebarPanelKey[]) {
          if (k !== id) next[k] = { open: false, seq: prev[k].seq + 1 };
        }
        next[id] = { open: true, seq: prev[id].seq };
      } else {
        // Panel closed itself — just sync Checklist state (siblings already closed in accordion mode)
        next[id] = { open: false, seq: prev[id].seq };
      }
      return next;
    });
  }, []);

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

  const [copied,           setCopied]           = useState(false);
  const [copiedCheckable,  setCopiedCheckable]  = useState(false);
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
   * Share Locker — 025P: creates a LIVE share link.
   *
   * Posts { type:'live-locker' } to the server; the server extracts the owner
   * userId from the Clerk JWT and stores only { type, ownerId } — no gear data
   * is snapshotted.  On every GET /api/links/:id the server reads the current
   * Locker from the DB, so the same URL always reflects the owner's latest changes.
   */
  const handleShareLocker = async () => {
    // Live-locker share requires an authenticated owner.
    if (!userId) return;

    const url = await buildLiveShareURL();
    if (!url) {
      toast({
        title: 'Could not create share link',
        description: 'Check your connection and try again.',
        variant: 'destructive',
      });
      return;
    }
    const title = activeLockerFile?.name ? `${activeLockerFile.name} — TrailWeigh` : 'TrailWeigh Pack List';
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        const ok = await copyUrlToClipboard(url);
        if (!ok) window.prompt('Copy this link:', url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // User dismissed the share sheet or clipboard failed — silently ignore
    }
  };

  /**
   * Share Checkable Packing List — generates a simplified, focused link that
   * opens a clean gear checklist (type:'checkable') without Scan Gear List or
   * background controls.  Invokes native Web Share when available.
   */
  const handleShareCheckableList = async () => {
    if (store.order.length === 0) return;
    // 025O: same multi-level name fallback as handleShareLocker (no lockerFiles here).
    const resolvedCheckableName: string | undefined =
      activeLockerFile?.name ??
      (userId ? readLastActiveFileFromLS(userId)?.name : undefined);
    const payload = {
      type:          'checkable' as const,
      data:          store.items,
      categoryOrder: store.order,
      categoryMeta:  store.meta,
      background:    background ?? null,
      bgFade,
      bgTone,
      bgSize,
      unit:          system,
      name:          resolvedCheckableName,
      barColor,
      barFont,
      barTextColor,
      barTransparency,
    };
    const url = await buildShareURL(payload);
    // 025M: buildShareURL returns null when the server is unreachable.
    if (!url) {
      toast({
        title: 'Could not create share link',
        description: 'Check your connection and try again.',
        variant: 'destructive',
      });
      return;
    }
    const title = activeLockerFile?.name ? `${activeLockerFile.name} — Packing List` : 'TrailWeigh Packing List';
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        const ok = await copyUrlToClipboard(url);
        if (!ok) window.prompt('Copy this link:', url);
        setCopiedCheckable(true);
        setTimeout(() => setCopiedCheckable(false), 2000);
      }
    } catch {
      // User dismissed the share sheet or clipboard failed — silently ignore
    }
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
      // 023G: new tab always starts with DEFAULT appearance — not inheriting
      // another tab's live customizations from global localStorage.
      barColor:        '',
      barFont:         '',
      barTextColor:    '',
      barTransparency: 1,
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
      const raw = localStorage.getItem(reviewLockerKey);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  // 022T: Sync Status state — drives the SyncStatusPanel diagnostic UI
  const [syncState, setSyncState] = useState<{
    status: 'idle' | 'syncing' | 'error';
    serverCount: number | null;
    lastSyncTime: number | null;
    syncError: string | null;
  }>({ status: 'idle', serverCount: null, lastSyncTime: null, syncError: null });

  // Persist whenever lockerEntries changes (does NOT broadcast — broadcasts happen
  // explicitly in mutating handlers to avoid cross-tab echo loops)
  useEffect(() => {
    localStorage.setItem(reviewLockerKey, JSON.stringify(lockerEntries));
  }, [lockerEntries, reviewLockerKey]);

  // BroadcastChannel for cross-tab Locker sync
  const lockerChannelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    let ch: BroadcastChannel | null = null;
    try {
      // Review mode: use a token-scoped channel so reviewer tabs don't
      // cross-sync with owner Locker tabs or other review sessions.
      const channelName = isReview
        ? `gear-locker-sync-review-${reviewToken}`
        : 'gear-locker-sync';
      ch = new BroadcastChannel(channelName);
      lockerChannelRef.current = ch;
      ch.onmessage = (e) => {
        if (e.data?.type === 'locker-update') {
          const entries: LockerEntry[] = e.data.entries;
          // Write immediately so any subsequent refresh gets the latest data
          localStorage.setItem(reviewLockerKey, JSON.stringify(entries));
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Broadcast Locker state to every other open tab. */
  const broadcastLocker = useCallback((entries: LockerEntry[]) => {
    try {
      lockerChannelRef.current?.postMessage({ type: 'locker-update', entries });
    } catch {}
  }, []);

  // ── 022R/022S: server-backed Locker sync ─────────────────────────────────
  // Keep a ref so sync callbacks can read lockerEntries without stale closures.
  const lockerEntriesRef = useRef<LockerEntry[]>(lockerEntries);
  useEffect(() => { lockerEntriesRef.current = lockerEntries; }, [lockerEntries]);

  // isSyncingRef: prevent concurrent overlapping fetches.
  // 022S fix: this is a concurrency guard only — NOT a one-shot "ran once" flag.
  // A failed fetch clears this ref so a retry can proceed.
  const isSyncingRef = useRef(false);

  // Track the userId we last SUCCESSFULLY synced. Detects account changes.
  // 022S fix: was a simple boolean that permanently blocked retries after failure.
  const lastSyncedUserIdRef = useRef<string | null>(null);

  // Retry timer so a failed sync doesn't permanently disable synchronisation.
  const syncRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // userIdRef so async callbacks always see the current userId without being
  // added to useCallback dependency arrays (which would recreate on every render).
  const userIdRef = useRef<string | undefined>(userId);
  useEffect(() => { userIdRef.current = userId; }, [userId]);

  /**
   * performLockerSync — 022S rewrite
   *
   * Fetches the server's Locker for the authenticated user, merges it with the
   * current localStorage cache using stable file IDs (neither side loses data),
   * uploads any local-only or locally-newer entries, and updates the UI.
   *
   * Fixes vs 022R:
   *   • credentials: 'include' on every fetch (Clerk cookies through Replit proxy)
   *   • Bidirectional merge instead of replace-or-migrate (no silent data loss)
   *   • Migration is awaited and confirmed, not fire-and-forget
   *   • Failed fetch clears isSyncingRef so a later retry can proceed
   *   • Console.error logs the actual failure reason (no silent swallowing)
   *   • Toast shown when sync fails so the user knows the file is device-local
   */
  const performLockerSync = useCallback(async (uid: string) => {
    if (isSyncingRef.current) return; // prevent concurrent overlapping fetches
    isSyncingRef.current = true;
    setSyncState(s => ({ ...s, status: 'syncing' }));

    try {
      // ── 1. Fetch server entries ──────────────────────────────────────────
      const serverEntries = await fetchLockerEntries();
      const localEntries  = lockerEntriesRef.current;

      // ── 2. Bidirectional merge by stable ID ──────────────────────────────
      // mergeLockerEntries never discards entries: server-only IDs are pulled
      // down, local-only IDs are marked for upload, same-ID conflicts keep the
      // newer savedAt timestamp. savedAt values are normalized (string or number).
      const { merged, localOnly } = mergeLockerEntries(serverEntries, localEntries);

      // ── 3. Update local state and cache with the merged result ───────────
      setLockerEntries(merged);
      // Wrap in try/catch: iOS Safari in private mode throws QuotaExceededError.
      // React state (setLockerEntries) already fired above — UI still updates.
      try {
        localStorage.setItem(LOCKER_KEY, JSON.stringify(merged));
      } catch (storageErr) {
        console.error('[TrailWeigh] localStorage write failed (iOS private mode?):', storageErr);
      }
      broadcastLocker(merged);

      // ── 4. Upload local-only (or locally-newer) entries to server ────────
      if (localOnly.length > 0) {
        const { failed } = await migrateLockerToServer(localOnly);
        if (failed.length > 0) {
          // Partial failure: failed entries remain in localStorage and will be
          // retried on the next sync cycle. Not fatal — report and continue.
          console.error(
            `[TrailWeigh] Locker migration: ${failed.length}/${localOnly.length} entries failed to upload. Will retry next sync.`,
          );
        }
      }

      // ── 5. Mark sync as successful ───────────────────────────────────────
      lastSyncedUserIdRef.current = uid;
      setSyncState({
        status: 'idle',
        serverCount: serverEntries.length,
        lastSyncTime: Date.now(),
        syncError: null,
      });
      // Clear any pending retry timer — we just succeeded.
      if (syncRetryTimerRef.current) {
        clearTimeout(syncRetryTimerRef.current);
        syncRetryTimerRef.current = null;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      // Log the actual error (not silent) — this is the 022R bug that hid failures.
      console.error(
        '[TrailWeigh] Locker server sync failed — localStorage cache still intact:',
        message,
      );
      setSyncState(s => ({
        ...s,
        status: 'error',
        syncError: message,
      }));
      // Schedule a retry in 30 s if the user is still on the same account.
      // This handles temporary network failures without polling aggressively.
      if (syncRetryTimerRef.current) clearTimeout(syncRetryTimerRef.current);
      syncRetryTimerRef.current = setTimeout(() => {
        syncRetryTimerRef.current = null;
        // Only retry if still the same signed-in user.
        if (userIdRef.current === uid) {
          isSyncingRef.current = false; // allow the retry to proceed
          performLockerSync(uid).catch(() => {});
        }
      }, 30_000);
    } finally {
      isSyncingRef.current = false;
    }
  // broadcastLocker and setSyncState are stable; mergeLockerEntries is a pure import.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [broadcastLocker]);

  // 022T: Manual "Sync Now" handler — triggered by the SyncStatusPanel button.
  const handleSyncNow = useCallback(() => {
    if (!userId) return;
    // Force re-sync even if lastSyncedUserIdRef matches (explicit user action).
    isSyncingRef.current = false;
    performLockerSync(userId).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, performLockerSync]);

  // Trigger sync when userId becomes available or changes (account switch).
  useEffect(() => {
    if (!userId) return;
    // Don't re-sync if we already succeeded for this exact userId (e.g. token
    // refresh causing a brief remount keeps the data fresh without redundant fetch).
    // But DO re-sync if we've never synced, or if the account changed.
    if (lastSyncedUserIdRef.current !== userId) {
      performLockerSync(userId).catch(() => {});
    }
  }, [userId, performLockerSync]);

  // Page-visibility refresh: Safari on iPhone suspends tabs and restores them.
  // A visibility-change listener re-syncs when the user returns to TrailWeigh
  // from another app, ensuring they see files saved from another device.
  // Debounced to 1 s to avoid hammering the server if the browser fires
  // multiple visibility events in quick succession (e.g. swipe-back gestures).
  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    function handleVisibilityChange() {
      if (document.visibilityState !== 'visible') return;
      const uid = userIdRef.current;
      if (!uid) return;
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        // Allow a fresh sync: a returning page may have missed mutations from
        // another device while it was suspended in the background.
        isSyncingRef.current = false;
        performLockerSync(uid).catch(() => {});
      }, 1_000);
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (debounceTimer) clearTimeout(debounceTimer);
      if (syncRetryTimerRef.current) {
        clearTimeout(syncRetryTimerRef.current);
        syncRetryTimerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [performLockerSync]);

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
      // 022G: fork tab opened an existing Locker file — update last-active so
      // the next fresh open returns to this file rather than the opener's file.
      if (userId) writeLastActiveFileToLS(userId, active);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 022G: Startup last-active-file restoration ────────────────────────────
  // On a genuine fresh open of the primary (non-fork) tab, automatically load
  // the user's last saved Locker file.  This reunites the user with the same
  // file, same background, and same saved checkbox states, while all collapsible
  // panels start closed (allOpen=false + GearCategory init=false handles that).
  //
  // Preconditions (all must hold):
  //   1. Authenticated user (userId defined)
  //   2. Not a fork/newseed tab (no tw-fork-id in sessionStorage)
  //   3. No active file already in sessionStorage (tab remount → skip)
  //   4. No tw-savedlist-entry-id pending (that mount effect runs just above)
  useEffect(() => {
    if (!userId) return;
    // Fork tabs manage their own restoration via ?savedListId= / ?newseed=
    const forkId = sessionStorage.getItem('tw-fork-id');
    if (forkId) return;
    // Tab remount (e.g. Clerk token refresh) — active file already loaded
    if (sessionStorage.getItem(ACTIVE_LOCKER_FILE_SS_KEY)) return;
    // The savedlist-entry mount effect above will handle this case
    if (sessionStorage.getItem('tw-savedlist-entry-id')) return;

    const lastActive = readLastActiveFileFromLS(userId);
    if (!lastActive) return;

    // Verify the entry still exists in the user's Locker
    const entry = lockerEntries.find(e => e.id === lastActive.id);
    if (!entry) {
      // File was deleted — clear the stale reference and fall back to normal startup
      writeLastActiveFileToLS(userId, null);
      return;
    }

    // ── Restore appearance (mirrors the in-place Locker-load non-fork path) ──────
    const restoredPalette = entry.chartPaletteKey ?? 'trail';
    setChartPaletteKey(restoredPalette);
    localStorage.setItem('trailweigh:chartPalette', restoredPalette);

    setBackground(entry.background as Background | null);
    if (entry.background) localStorage.setItem(BG_STORAGE_KEY, JSON.stringify(entry.background));
    else localStorage.removeItem(BG_STORAGE_KEY);

    const restoredTone = entry.bgTone ?? 'light';
    setBgTone(restoredTone);
    localStorage.setItem('trailweigh:bgTone', restoredTone);

    const restoredFade = entry.bgFade ?? 1;
    setBgFade(restoredFade);
    localStorage.setItem('trailweigh:bgFade', String(restoredFade));

    const restoredSize = entry.bgSize ?? 'cover';
    setBgSize(restoredSize);
    localStorage.setItem('trailweigh:bgSize', restoredSize);

    // 023E/023G: Restore bar style — optional fields; older entries fall back to '' / 1.
    const startBarColor        = entry.barColor        ?? '';
    const startBarFont         = entry.barFont         ?? '';
    const startBarTextColor    = entry.barTextColor    ?? '';
    const startBarTransparency = typeof entry.barTransparency === 'number'
      ? Math.max(0, Math.min(1, entry.barTransparency)) : 1;
    setBarColor(startBarColor);
    setBarFont(startBarFont);
    setBarTextColor(startBarTextColor);
    setBarTransparency(startBarTransparency);
    barColorRef.current        = startBarColor;
    barFontRef.current         = startBarFont;
    barTextColorRef.current    = startBarTextColor;
    barTransparencyRef.current = startBarTransparency;
    if (startBarColor)     localStorage.setItem('trailweigh:barColor',     startBarColor);
    else                   localStorage.removeItem('trailweigh:barColor');
    if (startBarFont)      localStorage.setItem('trailweigh:barFont',      startBarFont);
    else                   localStorage.removeItem('trailweigh:barFont');
    if (startBarTextColor) localStorage.setItem('trailweigh:barTextColor', startBarTextColor);
    else                   localStorage.removeItem('trailweigh:barTextColor');
    localStorage.setItem('trailweigh:barTransparency', String(startBarTransparency));
    updateBarForkKey('barcolor',        startBarColor);
    updateBarForkKey('barfont',         startBarFont);
    updateBarForkKey('bartextcolor',    startBarTextColor);
    updateBarForkKey('bartransparency', String(startBarTransparency));

    // Replace the gear store (clears undo/redo; does not write to the saved entry)
    replaceStore(entry.store as import('../hooks/usePackData').Store);

    // Track active file so Save routes to commitSaveReplace for this file
    const activeFile: ActiveLockerFile = { id: entry.id, name: entry.name };
    writeActiveLockerFileToSS(activeFile);
    setActiveLockerFile(activeFile);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount only

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
    // 023E: Explicitly clear stale input-focus state before unmounting the save
    // input. Some browsers don't fire 'focusout' when an element is removed from
    // the DOM while focused, which leaves hasInputFocus=true and disables Hide.
    saveInputRef.current?.blur();
    setHasInputFocus(false);
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
      barColor,
      barFont,
      barTextColor,
      barTransparency,
    };
    const updated = [entry, ...lockerEntries];
    setLockerEntries(updated);
    broadcastLocker(updated);
    // Make this new entry the active save target so subsequent Save clicks
    // update it in-place rather than asking for a name again.
    const newFile: ActiveLockerFile = { id: entry.id, name: entry.name };
    writeActiveLockerFileToSS(newFile);
    setActiveLockerFile(newFile);
    // 022G: persist as last-active so the next fresh open restores this file.
    if (userId) writeLastActiveFileToLS(userId, newFile);
    // 022S: server sync — log failures; localStorage is the device-local safety net
    if (userId) {
      serverSaveNew(entry).catch(err => {
        console.error('[TrailWeigh] serverSaveNew failed:', err instanceof Error ? err.message : String(err));
        toast({ description: 'Saved on this device — cloud sync failed. Will retry.', variant: 'destructive' });
      });
    }
    closeSaveDialog();
    toast({ description: `Saved ${name}` });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, background, bgFade, bgTone, bgSize, chartPaletteKey, barColor, barFont, barTextColor, barTransparency, lockerEntries, broadcastLocker, toast]);

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
        barColor,
        barFont,
        barTextColor,
        barTransparency,
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
      // 022G: persist as last-active so the next fresh open restores this file.
      if (userId) writeLastActiveFileToLS(userId, refreshed);
      // 022S: server sync — log failures; localStorage is the device-local safety net
      if (userId) {
        serverSaveReplace(entry).catch(err => {
          console.error('[TrailWeigh] serverSaveReplace failed:', err instanceof Error ? err.message : String(err));
          toast({ description: 'Saved on this device — cloud sync failed. Will retry.', variant: 'destructive' });
        });
      }
      closeSaveDialog();
      toast({ description: `Saved ${name}` });
    } catch {
      toast({ description: 'Save failed. Your changes were not saved.', variant: 'destructive' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, background, bgFade, bgTone, bgSize, chartPaletteKey, barColor, barFont, barTextColor, barTransparency, lockerEntries, broadcastLocker, toast]);

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
    // Review mode: always load in-place — opening a new tab to /checklist
    // would redirect unauthenticated users to sign-in.
    if (totalItems === 0 || isReview) {
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

      // 023E: Restore bar color/font/text — optional fields; older entries fall back to ''.
      const restoredBarColor     = entry.barColor     ?? '';
      const restoredBarFont      = entry.barFont      ?? '';
      const restoredBarTextColor = entry.barTextColor ?? '';
      setBarColor(restoredBarColor);
      setBarFont(restoredBarFont);
      setBarTextColor(restoredBarTextColor);
      barColorRef.current     = restoredBarColor;
      barFontRef.current      = restoredBarFont;
      barTextColorRef.current = restoredBarTextColor;
      if (restoredBarColor)     localStorage.setItem('trailweigh:barColor',     restoredBarColor);
      else                      localStorage.removeItem('trailweigh:barColor');
      if (restoredBarFont)      localStorage.setItem('trailweigh:barFont',      restoredBarFont);
      else                      localStorage.removeItem('trailweigh:barFont');
      if (restoredBarTextColor) localStorage.setItem('trailweigh:barTextColor', restoredBarTextColor);
      else                      localStorage.removeItem('trailweigh:barTextColor');

      // 023P: Restore bar transparency — the only field previously missing from
      // this block.  Without it the previous working file's transparency persisted
      // across in-place Locker opens.  Older entries without barTransparency fall
      // back to 1 (Solid) — NOT to the global localStorage key.
      const restoredBarTransparency = entry.barTransparency ?? 1;
      setBarTransparency(restoredBarTransparency);
      barTransparencyRef.current = restoredBarTransparency;
      barTransparencyBeforeDragRef.current = restoredBarTransparency;
      localStorage.setItem('trailweigh:barTransparency', String(restoredBarTransparency));

      // 023E: Clear stale input-focus state so Hide is never stuck disabled
      // after a file load (browser may not fire 'focusout' for removed inputs).
      setHasInputFocus(false);

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
        sessionStorage.setItem(`tw-fork-bg-restore-${forkId}`,              JSON.stringify(entry.background ?? null));
        sessionStorage.setItem(`tw-fork-bgtone-restore-${forkId}`,          restoredTone);
        sessionStorage.setItem(`tw-fork-bgfade-restore-${forkId}`,          String(restoredFade));
        // 023P: also scope bar fields so a React remount within this fork tab
        // recovers File B's appearance, not the stale global localStorage value.
        sessionStorage.setItem(`tw-fork-barcolor-restore-${forkId}`,        restoredBarColor);
        sessionStorage.setItem(`tw-fork-barfont-restore-${forkId}`,         restoredBarFont);
        sessionStorage.setItem(`tw-fork-bartextcolor-restore-${forkId}`,    restoredBarTextColor);
        sessionStorage.setItem(`tw-fork-bartransparency-restore-${forkId}`, String(restoredBarTransparency));
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
      // 022G: in-place open (primary tab) — update last-active.
      if (userId) writeLastActiveFileToLS(userId, newActiveFile);
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
    // Review mode: allow direct local delete without identity verification.
    // No server call is made (userId is undefined → serverDeleteMany is skipped).
    if (isReview) {
      const entry = lockerEntries.find(e => e.id === id);
      const updated = lockerEntries.filter(e => e.id !== id);
      setLockerEntries(updated);
      broadcastLocker(updated);
      const curB = readActiveLockerFileFromSS();
      const nextB = curB?.id === id ? null : curB;
      writeActiveLockerFileToSS(nextB);
      setActiveLockerFile(nextB);
      if (entry) toast({ description: `"${entry.name}" was deleted.` });
      return;
    }
    // Require authentication. This is a defensive check in addition to the route guard.
    if (isGuest || !userId) return;
    setPendingDeleteIds([id]);
    setShowDeleteDialog(true);
  }, [isReview, isGuest, userId, lockerEntries, broadcastLocker, toast]);

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
    // 022G: also clear the last-active localStorage reference if it was deleted,
    // so the next fresh open doesn't attempt to load a non-existent file.
    if (userId) {
      const lastActive = readLastActiveFileFromLS(userId);
      if (lastActive && pendingDeleteIds.includes(lastActive.id)) {
        writeLastActiveFileToLS(userId, null);
      }
    }
    // 022S: server sync — log failures
    if (userId) {
      serverDeleteMany(pendingDeleteIds).catch(err => {
        console.error('[TrailWeigh] serverDeleteMany failed:', err instanceof Error ? err.message : String(err));
      });
    }
    setShowDeleteDialog(false);
    setPendingDeleteIds([]);
    const msg = toDelete.length === 1
      ? `"${toDelete[0].name}" was permanently deleted.`
      : `${toDelete.length} Locker files were permanently deleted.`;
    toast({ description: msg });
  }, [lockerEntries, pendingDeleteIds, broadcastLocker, toast, userId]);

  // ── Rename in Locker ──────────────────────────────────────────────────────

  const handleRenameInLocker = useCallback((id: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const updated = lockerEntries.map(e => e.id === id ? { ...e, name: trimmed } : e);
    setLockerEntries(updated);
    broadcastLocker(updated);
    // 022S: server sync — log failures
    if (userId) {
      serverRename(id, trimmed).catch(err => {
        console.error('[TrailWeigh] serverRename failed:', err instanceof Error ? err.message : String(err));
      });
    }
  }, [lockerEntries, broadcastLocker, userId]);

  // ── Toolbar button style ──────────────────────────────────────────────────
  const toolBtn = 'flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-muted/50';
  const toolBtnDisabled = 'flex items-center gap-2 text-xs font-medium text-muted-foreground/30 px-2 py-1.5 rounded-md cursor-not-allowed';

  return (
    // 023E/023G: BarStyleProvider makes barColor/barFont/barTextColor/barTransparency
    // available to all descendant components (GearCategory, WeightSummary, LockerPanel,
    // ImportGearPanel, UnitToggle, etc.) without prop-drilling.
    <BarStyleProvider value={{ barColor, barFont, barTextColor, barTransparency }}>
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

      {/* ── Page scroll container ────────────────────────────────────────────
           h-[100dvh] + overflow-y-auto: fills the viewport, allows the user
           to scroll downward to reach the footer below the app area.
           The inner screen-content div keeps its own h-[100dvh] overflow-hidden
           so the checklist workspace is unchanged. ── */}
      <div className="h-[100dvh] overflow-y-auto">

      {/* ── Screen content ── */}
      {/* 022U fix: mobile must NOT be clipped to h-[100dvh] overflow-hidden —
           that clips the Locker list (and any content below the fold) on narrow
           screens where everything stacks in a single column.
           On desktop (lg+) we restore the two-column viewport-height layout. */}
      <div
        className={`screen-only min-h-[100dvh] lg:h-[100dvh] lg:overflow-hidden flex flex-col bg-background${bgTone === 'dark' ? ' screen-dark' : ''}`}
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
          {/* 022W: portrait = flex-col (logo+account row 1, action-icons row 2); sm+ = single flex row */}
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8
                          flex flex-col sm:flex-row sm:h-16 sm:items-center sm:justify-between
                          py-2 sm:py-0 gap-y-1.5">

            {/* ── Logo row: logo on left + portrait-only Account on right ──────── */}
            <div className="flex items-center justify-between gap-2 sm:flex-shrink-0">
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
              {/* Portrait-only Account/Guest — hidden at sm+ (shown below in actions row) */}
              <div className="sm:hidden flex-shrink-0">
                {isGuest ? (
                  <button
                    onClick={() => setLocation('/sign-up')}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                    Sign in
                  </button>
                ) : (
                  <div className="relative">
                    <button onClick={() => setShowUserMenu(v => !v)} className={toolBtn}>
                      <User className="w-3.5 h-3.5" />
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

            {/* ── Actions row: portrait centered, sm+ right-aligned ─────────── */}
            <div className="flex items-center justify-center sm:justify-end gap-1 flex-wrap sm:flex-nowrap min-w-0">

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

              {/* Divider — hidden on portrait to save horizontal space */}
              <div className="hidden sm:block w-px h-5 bg-border mx-1 flex-shrink-0" />

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

              {/* ── User menu / guest CTA — sm+ only (portrait version is in logo row) ── */}
              <div className="hidden sm:flex items-center flex-shrink-0">
                {isGuest ? (
                  <button
                    onClick={() => setLocation('/sign-up')}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary border border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                    Sign in<span className="hidden sm:inline"> to save</span>
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
            </div>{/* end actions row */}
          </div>{/* end header inner */}
        </header>

        <main className="w-full max-w-full mx-auto px-3 sm:px-4 lg:px-8 flex-1 min-h-0 lg:flex lg:flex-col">

          {/* ── 023B: Phone Row 1 — File Name + Preview, centered (mobile only) ──
               On desktop this div is lg:hidden; the file-name pill and Preview button
               continue to appear in the left-toolbar via their own lg: positioning.
               On mobile this row sits at the very top of the content area, above the
               Background Edit / Share row. */}
          <div className="pt-4 lg:hidden flex items-center justify-center gap-2 pb-2 flex-wrap">
            {activeLockerFile && (
              <span
                aria-label={`Active file: ${activeLockerFile.name}`}
                title={activeLockerFile.name}
                className="flex items-center bg-muted rounded-lg px-3 py-1.5 text-xs font-semibold text-foreground max-w-[10rem] truncate select-none"
              >
                {activeLockerFile.name}
              </span>
            )}
            <button
              onClick={() => setShowPreview(true)}
              aria-label="Open checked-items preview"
              className="flex items-center bg-muted rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Preview
            </button>
          </div>

          {/* ── Toolbar group — all toolbar controls share this single parent.
               pt-4 is desktop-only (lg:pt-4); mobile top spacing is in Phone Row 1. ── */}
          <div className="pt-2 lg:pt-4 grid grid-cols-1 lg:grid-cols-[1fr_365px] lg:gap-4">

            {/* Left toolbar panel — Pinned pills row
                023B: hidden on mobile (all mobile controls now live in Phone Row 1 and
                the Lower Phone Toolbar below Locker). On desktop (lg:flex-row) the
                existing layout is preserved unchanged.
                ─ Desktop (lg: flex-row):
                    [Open|Close] ··· [pill: lg:absolute centered] ··· [Hide][Preview][UnitToggle] */}
            <div className="hidden lg:flex lg:flex-row lg:items-center lg:gap-0 lg:pr-7 lg:relative lg:pb-3">

              {/* ── Row B (mobile): File-name pill — centered in normal flow ──────
                  Desktop: lg:absolute lg:inset-0 removes it from flex-row flow while
                  centering it visually over the left panel. */}
              {activeLockerFile && (
                <div className="w-full flex justify-center pointer-events-none
                                lg:absolute lg:inset-0 lg:pb-3 lg:flex lg:items-center lg:justify-center lg:w-auto">
                  <span
                    aria-label={`Active file: ${activeLockerFile.name}`}
                    title={activeLockerFile.name}
                    className="flex items-center bg-muted rounded-lg px-3 py-1.5 text-xs font-semibold text-foreground max-w-[10rem] truncate select-none"
                    style={barCombinedStyle({ barColor, barFont, barTextColor, barTransparency })}
                  >
                    {activeLockerFile.name}
                  </span>
                </div>
              )}

              {/* ── Row A (mobile) — 023B: both Open/Close and Units moved to Lower Phone Toolbar.
                  Parent is hidden on mobile (lg:flex-row only), so this renders desktop-only.
                  On desktop: just Open/Close (Units are in the desktop right group). */}
              <div className="flex items-center flex-shrink-0">
                {/* Open/Close segmented control — always together */}
                <div
                  className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5"
                  style={barBgStyle({ barColor, barFont, barTextColor, barTransparency })}
                >
                  <button
                    onClick={() => { setAllOpen(true); setOpenCloseSeq(s => s + 1); }}
                    aria-label="Open all categories"
                    title="Open all categories"
                    className={`flex items-center justify-center px-2 py-1.5 rounded-md transition-colors ${
                      allOpen === true && !barColor
                        ? 'bg-card text-foreground shadow-sm'
                        : !barColor ? 'text-muted-foreground hover:text-foreground' : ''
                    }`}
                    style={barColor
                      ? allOpen === true
                        ? { backgroundColor: 'rgba(255,255,255,0.22)', color: barTextColor || 'white', fontFamily: barFont || undefined }
                        : { color: barTextColor ? `${barTextColor}99` : 'rgba(255,255,255,0.6)', fontFamily: barFont || undefined }
                      : barFont ? { fontFamily: barFont } : undefined}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => { setAllOpen(false); setOpenCloseSeq(s => s + 1); }}
                    aria-label="Close all categories"
                    title="Close all categories"
                    className={`flex items-center justify-center px-2 py-1.5 rounded-md transition-colors ${
                      allOpen === false && !barColor
                        ? 'bg-card text-foreground shadow-sm'
                        : !barColor ? 'text-muted-foreground hover:text-foreground' : ''
                    }`}
                    style={barColor
                      ? allOpen === false
                        ? { backgroundColor: 'rgba(255,255,255,0.22)', color: barTextColor || 'white', fontFamily: barFont || undefined }
                        : { color: barTextColor ? `${barTextColor}99` : 'rgba(255,255,255,0.6)', fontFamily: barFont || undefined }
                      : barFont ? { fontFamily: barFont } : undefined}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Row C (mobile): removed in 023B — Hide moved to Lower Phone Toolbar,
                  Preview moved to Phone Row 1. Desktop right group unchanged. */}

              {/* ── Desktop-only right group: ml-auto → [Hide][Preview][UnitToggle] ──
                  Hidden on mobile (handled by rows above). */}
              <div className="hidden lg:flex items-center gap-3 ml-auto flex-shrink-0">
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
                  style={barCombinedStyle({ barColor, barFont, barTextColor, barTransparency })}
                >
                  Hide
                </button>
                <button
                  onClick={() => setShowPreview(true)}
                  aria-label="Open checked-items preview"
                  className="flex items-center bg-muted rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  style={barCombinedStyle({ barColor, barFont, barTextColor, barTransparency })}
                >
                  Preview
                </button>
                <UnitToggle />
              </div>
            </div>

            {/* 024B: Sidebar controls row — toolbar group right column so it sits at
                 the same vertical level as the cat OC pill. lg:[scrollbar-gutter:stable]
                 matches the sidebar scrollable content box, preserving 024A horizontal
                 alignment. 024D: lg:overflow-hidden REMOVED — it was clipping the
                 BackgroundPickerPanel (position:absolute top-full) making it invisible.
                 024N: lg:overflow-hidden RESTORED — panel is now portaled to document.body
                 with fixed positioning, so overflow-hidden no longer clips it. */}
            <div className="relative flex items-center pb-3 lg:pl-1 lg:pr-5 lg:overflow-hidden lg:[scrollbar-gutter:stable]">
                {/* 023W: Sidebar accordion Open/Close — controls Pack Summary, Weight Distribution,
                     Scan Gear List, and Locker only. Independent of the main category Open/Close. */}
                <div
                  className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5"
                  style={barBgStyle({ barColor, barFont, barTextColor, barTransparency })}
                >
                  <button
                    onClick={() => setSidebarForce(prev => ({
                      summary:      { open: true, seq: prev.summary.seq + 1 },
                      distribution: { open: true, seq: prev.distribution.seq + 1 },
                      import:       { open: true, seq: prev.import.seq + 1 },
                      locker:       { open: true, seq: prev.locker.seq + 1 },
                    }))}
                    aria-label="Open all sidebar panels"
                    title="Open all sidebar panels"
                    className={`flex items-center justify-center px-2 py-1.5 rounded-md transition-colors ${
                      sidebarExpandActive && !barColor
                        ? 'bg-card text-foreground shadow-sm'
                        : !barColor ? 'text-muted-foreground hover:text-foreground' : ''
                    }`}
                    style={barColor
                      ? sidebarExpandActive
                        ? { backgroundColor: 'rgba(255,255,255,0.22)', color: barTextColor || 'white', fontFamily: barFont || undefined }
                        : { color: barTextColor ? `${barTextColor}99` : 'rgba(255,255,255,0.6)', fontFamily: barFont || undefined }
                      : barFont ? { fontFamily: barFont } : undefined}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setSidebarForce(prev => ({
                      summary:      { open: false, seq: prev.summary.seq + 1 },
                      distribution: { open: false, seq: prev.distribution.seq + 1 },
                      import:       { open: false, seq: prev.import.seq + 1 },
                      locker:       { open: false, seq: prev.locker.seq + 1 },
                    }))}
                    aria-label="Close all sidebar panels"
                    title="Close all sidebar panels"
                    className={`flex items-center justify-center px-2 py-1.5 rounded-md transition-colors ${
                      sidebarCollapseActive && !barColor
                        ? 'bg-card text-foreground shadow-sm'
                        : !barColor ? 'text-muted-foreground hover:text-foreground' : ''
                    }`}
                    style={barColor
                      ? sidebarCollapseActive
                        ? { backgroundColor: 'rgba(255,255,255,0.22)', color: barTextColor || 'white', fontFamily: barFont || undefined }
                        : { color: barTextColor ? `${barTextColor}99` : 'rgba(255,255,255,0.6)', fontFamily: barFont || undefined }
                      : barFont ? { fontFamily: barFont } : undefined}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                </div>
                {/* BgEdit + Share — grouped so they stay together on the right */}
                <div className="flex items-center gap-2 ml-auto">
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
                    onBeforeDeleteTheme={(snap) => {
                      // 023A: push undo entry with full collections snapshot before
                      // the theme is removed.  background/bgSizeRef capture current
                      // values at call time (always inside an event handler).
                      pushBg({
                        background,
                        bgSize: bgSizeRef.current,
                        collections: snap.collections,
                        activeThemeId: snap.activeThemeId,
                        barColor: barColorRef.current,
                        barFont: barFontRef.current,
                        barTextColor: barTextColorRef.current,
                        barTransparency: barTransparencyRef.current,
                      });
                    }}
                    restoreCollectionsRef={restoreCollectionsRef}
                    barColor={barColor}
                    onBarColorChange={handleBarColorChange}
                    onBarColorPickerStart={handleBarColorPickerStart}
                    onBarColorCommit={handleBarColorCommit}
                    barFont={barFont}
                    onBarFontChange={handleBarFontChange}
                    barTextColor={barTextColor}
                    onBarTextColorChange={handleBarTextColorChange}
                    onBarTextColorPickerStart={handleBarTextColorPickerStart}
                    onBarTextColorCommit={handleBarTextColorCommit}
                    onResetBarStyle={handleResetBarStyle}
                    barTransparency={barTransparency}
                    onBarTransparencyChange={handleBarTransparencyChange}
                    onBarTransparencyDragStart={handleBarTransparencyDragStart}
                    onBarTransparencyCommit={handleBarTransparencyCommit}
                  />
                </div>
                {/* Share pill + dropdown */}
                {/* 025G: ref used to compute fixed position for the dropdown (escapes overflow-hidden) */}
                <div className="relative" ref={shareContainerRef}>
                  {isReview ? (
                    /* Review mode (025L): share = copy the existing review URL.
                     * Reviewer cannot create new server-side share links. */
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await copyUrlToClipboard(window.location.href);
                        if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
                      }}
                      className="flex items-center gap-1.5 text-xs font-semibold border border-border/60 bg-card px-3 py-1.5 rounded-lg transition-colors text-muted-foreground"
                      style={barCombinedStyle({ barColor: barColorRef.current, barFont: barFontRef.current, barTextColor: barTextColorRef.current, barTransparency: barTransparencyRef.current })}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      {copied ? 'Copied!' : 'Share'}
                    </button>
                  ) : !canShare ? (
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
                        onClick={() => {
                          // 025G: compute fixed-position anchor before opening
                          if (!showShareMenu && shareContainerRef.current) {
                            const r = shareContainerRef.current.getBoundingClientRect();
                            setShareMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
                          }
                          setShowShareMenu(o => !o);
                          setShareStep('menu');
                        }}
                        onMouseEnter={() => setShareHovered(true)}
                        onMouseLeave={() => setShareHovered(false)}
                        className="flex items-center gap-1.5 text-xs font-semibold border border-border/60 bg-card px-3 py-1.5 rounded-lg transition-colors text-muted-foreground"
                        style={shareHovered
                          ? { ...(barColorRef.current ? { backgroundColor: barColorRef.current } : {}), color: 'white' }
                          : barCombinedStyle({ barColor: barColorRef.current, barFont: barFontRef.current, barTextColor: barTextColorRef.current, barTransparency: barTransparencyRef.current })
                        }
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        Share
                      </button>
                      {/* 025G: showShareMenu && shareMenuPos — position calculated on open */}
                      {showShareMenu && shareMenuPos && (
                        <>
                          {/* 025G: fixed backdrop at z-40 — above sidebar panels */}
                          <div className="fixed inset-0 z-40" onClick={() => { setShowShareMenu(false); setShareStep('menu'); }} />
                          {/* 025G: fixed dropdown at z-50 — escapes lg:overflow-hidden toolbar row
                              that clipped the old absolute top-full dropdown (same issue as BackgroundPickerPanel) */}
                          <div
                            className="fixed bg-card border border-border rounded-lg shadow-lg z-50 min-w-[220px] py-1 animate-in fade-in slide-in-from-top-2 duration-150"
                            style={{ top: shareMenuPos.top, right: shareMenuPos.right }}
                          >
                            {shareStep === 'menu' ? (
                              <>
                                {/* ── Share TrailWeigh List ── */}
                                <button
                                  onClick={() => setShareStep('locker-warning')}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted/60 transition-colors"
                                >
                                  <Link className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                  <div className="text-left">
                                    <div className="font-medium">{copied ? 'Copied!' : 'Share TrailWeigh List'}</div>
                                    <div className="text-[11px] text-muted-foreground">Full list with all saved files</div>
                                  </div>
                                </button>

                                {/* ── Share Checkable Packing List ── */}
                                <button
                                  onClick={async () => {
                                    setShowShareMenu(false);
                                    setShareStep('menu');
                                    await handleShareCheckableList();
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
                                    <div className="font-medium">{copiedCheckable ? 'Copied!' : 'Share Checkable Packing List'}</div>
                                    <div className="text-[11px] text-muted-foreground">
                                      {canShare ? 'Simple checklist for packing' : 'Add gear items first'}
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
                </div>{/* end BgEdit+Share group */}
            </div>{/* end sidebar controls */}

          </div>{/* end toolbar group */}

          {/* ── Content area ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_365px] gap-8 lg:gap-4 lg:flex-1 lg:min-h-0 lg:overflow-hidden">

            {/* Scrollable categories */}
            <div className="lg:h-full lg:overflow-y-auto lg:min-h-0 space-y-1 pb-8 lg:pr-3 lg:[scrollbar-gutter:stable]">
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
              <div className="pt-3 lg:pt-0 flex flex-col gap-1.5 pb-8">
                <WeightSummary
                  data={data}
                  categoryOrder={categoryOrder}
                  categoryMeta={categoryMeta}
                  forceOpen={sidebarForce.summary.open}
                  forceOpenSeq={sidebarForce.summary.seq}
                  onToggle={nowOpen => handleSidebarPanelToggle('summary', nowOpen)}
                />
                <WeightDistribution
                  data={data}
                  categoryOrder={categoryOrder}
                  categoryMeta={categoryMeta}
                  paletteKey={chartPaletteKey}
                  onPaletteChange={handlePaletteChange}
                  forceOpen={sidebarForce.distribution.open}
                  forceOpenSeq={sidebarForce.distribution.seq}
                  onToggle={nowOpen => handleSidebarPanelToggle('distribution', nowOpen)}
                />
                <ImportGearPanel
                  categoryOrder={categoryOrder}
                  forceOpen={sidebarForce.import.open}
                  forceOpenSeq={sidebarForce.import.seq}
                  onToggle={nowOpen => handleSidebarPanelToggle('import', nowOpen)}
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
                {/* 025L: Review mode label — clarifies local-only storage to reviewer */}
                {isReview && (
                  <p className="text-[11px] text-muted-foreground px-3 -mt-1 mb-0.5">
                    Review files — stored on this device
                  </p>
                )}
                <LockerPanel
                  entries={lockerEntries}
                  onLoad={handleLoadFromLocker}
                  onRequestDelete={requestProtectedDelete}
                  onRename={handleRenameInLocker}
                  forceOpen={sidebarForce.locker.open}
                  forceOpenSeq={sidebarForce.locker.seq}
                  onToggle={nowOpen => handleSidebarPanelToggle('locker', nowOpen)}
                  syncProps={userId ? {
                    userId,
                    syncStatus: syncState.status,
                    serverCount: syncState.serverCount,
                    lastSyncTime: syncState.lastSyncTime,
                    syncError: syncState.syncError,
                    onSyncNow: handleSyncNow,
                  } : undefined}
                />

                {/* ── 023B: Lower Phone Toolbar — below Locker, above Categories ──
                    Mobile-only (lg:hidden). Mirrors the desktop left-toolbar row:
                    [Open|Close] LEFT · [Hide] CENTER · [Imperial|Metric] RIGHT.
                    On desktop this div does not render (lg:hidden). */}
                <div className="lg:hidden flex items-center justify-between gap-2 pt-1">
                  {/* Open / Close — left */}
                  <div
                    className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5"
                    style={barBgStyle({ barColor, barFont, barTextColor, barTransparency })}
                  >
                    <button
                      onClick={() => { setAllOpen(true); setOpenCloseSeq(s => s + 1); }}
                      aria-label="Open all categories"
                      title="Open all categories"
                      className={`flex items-center justify-center px-2 py-1.5 rounded-md transition-colors ${
                        allOpen === true && !barColor
                          ? 'bg-card text-foreground shadow-sm'
                          : !barColor ? 'text-muted-foreground hover:text-foreground' : ''
                      }`}
                      style={barColor
                        ? allOpen === true
                          ? { backgroundColor: 'rgba(255,255,255,0.22)', color: barTextColor || 'white', fontFamily: barFont || undefined }
                          : { color: barTextColor ? `${barTextColor}99` : 'rgba(255,255,255,0.6)', fontFamily: barFont || undefined }
                        : barFont ? { fontFamily: barFont } : undefined}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => { setAllOpen(false); setOpenCloseSeq(s => s + 1); }}
                      aria-label="Close all categories"
                      title="Close all categories"
                      className={`flex items-center justify-center px-2 py-1.5 rounded-md transition-colors ${
                        allOpen === false && !barColor
                          ? 'bg-card text-foreground shadow-sm'
                          : !barColor ? 'text-muted-foreground hover:text-foreground' : ''
                      }`}
                      style={barColor
                        ? allOpen === false
                          ? { backgroundColor: 'rgba(255,255,255,0.22)', color: barTextColor || 'white', fontFamily: barFont || undefined }
                          : { color: barTextColor ? `${barTextColor}99` : 'rgba(255,255,255,0.6)', fontFamily: barFont || undefined }
                        : barFont ? { fontFamily: barFont } : undefined}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                  </div>
                  {/* Hide — center */}
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
                    style={barCombinedStyle({ barColor, barFont, barTextColor, barTransparency })}
                  >
                    Hide
                  </button>
                  {/* Imperial / Metric — right */}
                  <UnitToggle />
                </div>
              </div>
            </div>

          </div>{/* end content area */}
        </main>
      </div>{/* end screen content */}

      {/* ── Site footer — below the app area, reachable by scrolling ── */}
      <Footer />

      </div>{/* end page scroll container */}

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
            await handleShareCheckableList();
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
    </BarStyleProvider>
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
