/**
 * BackgroundPicker.tsx  —  Prompt 016B
 *
 * Unified Background Edit panel.
 *
 * Key changes from Prompt 016A:
 *  - Photo blobs stored in IndexedDB (bgPhotoStore.ts); no base64 in localStorage.
 *  - Background references a stable photoId, not a data URL.
 *  - Dropdown trigger button now has explicit text-foreground colour (blank-label fix).
 *  - Save-first-then-show: thumbnail appears only after IndexedDB write succeeds.
 *  - Storage failures produce TrailWeigh error messages, never the Vite overlay.
 *  - Object URLs for thumbnails are created on demand and revoked when unused.
 *  - Migration from old localStorage format runs on first panel open.
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ImageIcon, X, Check, ChevronDown, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover';
import { cleanupOrphanedPhotos } from '../lib/bgPhotoStore';
import {
  PHOTO_COLLECTIONS_KEY,
  MAX_PHOTOS_PER_COLLECTION,
  MAX_COLLECTIONS,
  createCollection,
  renameCollection,
  deleteCollection,
  addPhotoToCollection,
  deletePhotoFromCollection,
} from '../lib/bgCollections';
import type { PhotoCollection } from '../lib/bgCollections';
import {
  validateImageFile,
  compressPhotoFile,
  storePhoto,
  getPhotoBlob,
  deletePhoto,
  deletePhotos,
  createPhotoObjectUrl,
  revokePhotoObjectUrl,
  migrateCollectionsToIndexedDb,
  migrateLegacyActiveBackground,
  isMigrationDone,
  markMigrationDone,
  dataUrlToBlob,
} from '../lib/bgPhotoStore';

// ── Types & constants ──────────────────────────────────────────────────────────

export type Background =
  | { type: 'preset'; id: string }
  | { type: 'custom'; photoId: string };

export const BG_STORAGE_KEY = 'trailweigh:background';

export const PRESETS = [
  { id: 'rocky-mountains',  label: 'Rocky Mountains',  photoId: '1464822759023-fed622ff2c3b' },
  { id: 'swiss-alps',       label: 'Swiss Alps',        photoId: '1506905925346-21bda4d32df4' },
  { id: 'forest',           label: 'Pine Forest',       photoId: '1448375240586-882707db888b' },
  { id: 'lake-reflection',  label: 'Lake Reflection',   photoId: '1501854140801-50d01698950b' },
  { id: 'desert-dunes',     label: 'Desert Dunes',      photoId: '1509316785289-025f5b846b35' },
  { id: 'snowy-peaks',      label: 'Snowy Peaks',       photoId: '1519681393784-d120267933ba' },
  { id: 'green-valley',     label: 'Green Valley',      photoId: '1469474968028-56623f02e42e' },
  { id: 'foggy-mountains',  label: 'Foggy Mountains',   photoId: '1485470733090-0aae1788d5af' },
  { id: 'coast',            label: 'Ocean Coast',       photoId: '1505118380757-91f5f5632de0' },
  { id: 'starry-night',     label: 'Starry Night',      photoId: '1419242902214-272b3f66ee7a' },
];


export function getFullUrl(photoId: string) {
  return `https://images.unsplash.com/photo-${photoId}?w=1920&q=85&fit=crop`;
}

function getThumbUrl(photoId: string) {
  return `https://images.unsplash.com/photo-${photoId}?w=400&h=260&fit=crop&q=70`;
}

// ── Storage helpers ───────────────────────────────────────────────────────────

/** Load collections from localStorage, handling the old and new formats. */
function loadCollections(): PhotoCollection[] {
  try {
    const raw = localStorage.getItem(PHOTO_COLLECTIONS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }
    return [];
  } catch { return []; }
}

function saveCollections(cols: PhotoCollection[]): void {
  try { localStorage.setItem(PHOTO_COLLECTIONS_KEY, JSON.stringify(cols)); } catch { /* ignore */ }
}

/** Load the active background reference from localStorage. */
export function loadStoredBackground(): Background | null {
  try {
    const raw = localStorage.getItem(BG_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Background & { dataUrl?: string };
    // Handle old format: { type: 'custom', dataUrl }
    if (parsed.type === 'custom' && 'dataUrl' in parsed) {
      // Old format detected — migration will be handled asynchronously
      return null;
    }
    return parsed;
  } catch { return null; }
}

// ── Button ────────────────────────────────────────────────────────────────────

export function BackgroundPickerButton({
  onClick,
  active,
  panelOpen,
}: {
  onClick: () => void;
  active: boolean;
  /** Whether the Background Edit panel is currently open.
   *  true  → pill turns white (active/open state).
   *  false → normal inactive pill matching Hide/Preview. */
  panelOpen: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title="Background Edit"
      aria-label="Background Edit"
      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
        panelOpen
          ? 'bg-white text-gray-900 border border-white/80'
          : 'bg-muted text-muted-foreground hover:text-foreground border border-transparent'
      }`}
    >
      <ImageIcon className="w-3.5 h-3.5" />
      Background Edit
    </button>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

interface BackgroundPickerPanelProps {
  open: boolean;
  onClose: () => void;
  background: Background | null;
  onBackgroundChange: (bg: Background | null) => void;
  bgFade: number;
  onBgFadeChange: (v: number) => void;
  bgTone: 'light' | 'dark';
  onBgToneChange: (t: 'light' | 'dark') => void;
  bgSize: 'cover' | 'contain';
  onBgSizeChange: (v: 'cover' | 'contain') => void;
  containerRef?: React.RefObject<HTMLDivElement>;
  onShowcase?: () => void;
  isShowcaseBlocked?: boolean;
  /**
   * 023A — Called immediately BEFORE a custom-theme is deleted, with a
   * complete snapshot of current collections and the active theme ID.
   * Checklist uses this to push an undo history entry that can restore the
   * deleted theme (metadata + photos still in IndexedDB).
   */
  onBeforeDeleteTheme?: (snapshot: { collections: PhotoCollection[]; activeThemeId: string }) => void;
  /**
   * 023A — Mutable ref that BackgroundPicker populates with a setter function.
   * Checklist calls it during undo/redo to restore collections state.
   */
  restoreCollectionsRef?: React.MutableRefObject<
    ((collections: PhotoCollection[], activeThemeId: string) => void) | null
  >;
}

export function BackgroundPickerPanel({
  open,
  onClose,
  background,
  onBackgroundChange,
  bgFade,
  onBgFadeChange,
  bgTone,
  onBgToneChange,
  bgSize,
  onBgSizeChange,
  containerRef,
  onShowcase,
  isShowcaseBlocked = false,
  onBeforeDeleteTheme,
  restoreCollectionsRef,
}: BackgroundPickerPanelProps) {
  const panelRef                = useRef<HTMLDivElement>(null);
  const dropdownRef             = useRef<HTMLDivElement>(null);
  const fileInputRef            = useRef<HTMLInputElement>(null);
  const newNameInputRef         = useRef<HTMLInputElement>(null);
  const renameInputRef          = useRef<HTMLInputElement>(null);
  // 017E: ref for the landscape grid wrapper — used by the DEV measurement effect
  const landscapeGridRef        = useRef<HTMLDivElement>(null);
  // 022Z: ref for delete-confirmation popover portal content.
  // The portal renders in document.body, outside containerRef, so the
  // mousedown-outside handler must explicitly exclude clicks inside it.
  const deletePopoverContentRef = useRef<HTMLDivElement | null>(null);

  // ── Theme selection ──────────────────────────────────────────────────────
  const [activeThemeId, setActiveThemeId] = useState<string>('landscapes');
  const [dropdownOpen,  setDropdownOpen]  = useState(false);

  // ── Collections ──────────────────────────────────────────────────────────
  const [collections, setCollections] = useState<PhotoCollection[]>(loadCollections);

  // ── Add-theme form ───────────────────────────────────────────────────────
  const [isAddingTheme, setIsAddingTheme] = useState(false);
  const [prevThemeId,   setPrevThemeId]   = useState<string>('landscapes');
  const [newThemeName,  setNewThemeName]  = useState('');
  const [newThemeError, setNewThemeError] = useState<string | null>(null);

  // ── Upload ───────────────────────────────────────────────────────────────
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);
  const [savingSlotKey,  setSavingSlotKey]  = useState<string | null>(null);
  const [storageError,   setStorageError]   = useState<string | null>(null);

  // ── Photo deletion confirmation ──────────────────────────────────────────
  const [confirmDeletePhoto, setConfirmDeletePhoto] = useState<{ cid: string; pid: string } | null>(null);

  // ── Theme deletion confirmation ──────────────────────────────────────────
  const [confirmDeleteTheme, setConfirmDeleteTheme] = useState<string | null>(null);

  // ── Rename ───────────────────────────────────────────────────────────────
  const [renamingId,  setRenamingId]  = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);

  // ── Drag-over ────────────────────────────────────────────────────────────
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  // ── Thumbnail object URLs (photoId → objectUrl) ──────────────────────────
  const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});
  const thumbnailUrlsRef = useRef<Record<string, string>>({});

  // ── Derived ──────────────────────────────────────────────────────────────
  const canAddTheme       = collections.length < MAX_COLLECTIONS;
  const activeCollection  = collections.find(c => c.id === activeThemeId) ?? null;

  const dropdownLabel = (() => {
    if (isAddingTheme)                  return 'Add Theme';
    if (activeThemeId === 'landscapes') return 'Landscape';
    const col = collections.find(c => c.id === activeThemeId);
    if (col) return col.name;  // 023B: no "Theme " prefix
    return 'Themes';
  })();

  // ── Migration: run once on first open ────────────────────────────────────
  const migrationRanRef = useRef(false);
  useEffect(() => {
    if (!open || migrationRanRef.current) return;
    if (isMigrationDone()) { migrationRanRef.current = true; return; }
    migrationRanRef.current = true;

    (async () => {
      const raw = loadCollections();
      // Check for old-format photos (with dataUrl field)
      const hasOldPhotos = raw.some(col =>
        col.photos.some((p: any) => typeof p.dataUrl === 'string'),
      );

      if (hasOldPhotos) {
        const { collections: migrated } = await migrateCollectionsToIndexedDb(
          raw as any,
        );
        setCollections(migrated);
        saveCollections(migrated);
      }

      // Migrate old active-background { type:'custom', dataUrl }
      try {
        const rawBg = localStorage.getItem(BG_STORAGE_KEY);
        if (rawBg) {
          const parsed = JSON.parse(rawBg) as { type: string; dataUrl?: string; photoId?: string };
          if (parsed.type === 'custom' && parsed.dataUrl && !parsed.photoId) {
            const newPhotoId = crypto.randomUUID();
            const ok = await migrateLegacyActiveBackground(parsed.dataUrl, newPhotoId);
            if (ok) {
              const newBg: Background = { type: 'custom', photoId: newPhotoId };
              localStorage.setItem(BG_STORAGE_KEY, JSON.stringify(newBg));
              // Also add to My Photos if not already present
              // (handled by runMigration in bgCollections — data-layer only)
              onBackgroundChange(newBg);
            } else {
              localStorage.removeItem(BG_STORAGE_KEY);
            }
          }
        }
      } catch { /* ignore — old bg format, skip gracefully */ }

      markMigrationDone();
    })();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Thumbnail loading: load for active theme ─────────────────────────────
  useEffect(() => {
    // Revoke all existing thumbnail object URLs first
    Object.values(thumbnailUrlsRef.current).forEach(revokePhotoObjectUrl);
    thumbnailUrlsRef.current = {};

    // Skip custom-thumbnail loading for built-in themes and add-form
    if (!open || activeThemeId === 'landscapes' || isAddingTheme) {
      setThumbnailUrls({});
      return;
    }

    const col = collections.find(c => c.id === activeThemeId);
    if (!col || !col.photos.length) {
      setThumbnailUrls({});
      return;
    }

    let cancelled = false;
    const photoIds = col.photos.map(p => p.id);

    (async () => {
      const newUrls: Record<string, string> = {};
      for (const id of photoIds) {
        if (cancelled) {
          Object.values(newUrls).forEach(revokePhotoObjectUrl);
          return;
        }
        try {
          const blob = await getPhotoBlob(id);
          if (blob && !cancelled) {
            newUrls[id] = createPhotoObjectUrl(blob);
          }
        } catch { /* skip — blob unavailable */ }
      }
      if (!cancelled) {
        thumbnailUrlsRef.current = newUrls;
        setThumbnailUrls({ ...newUrls });
      } else {
        Object.values(newUrls).forEach(revokePhotoObjectUrl);
      }
    })();

    return () => { cancelled = true; };
  }, [open, activeThemeId, collections]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup thumbnails when panel unmounts
  useEffect(() => {
    return () => {
      Object.values(thumbnailUrlsRef.current).forEach(revokePhotoObjectUrl);
      thumbnailUrlsRef.current = {};
    };
  }, []);

  // ── Global Safari drag prevention ────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const preventNav = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes('Files')) e.preventDefault();
    };
    document.addEventListener('dragover', preventNav);
    document.addEventListener('drop',     preventNav);
    return () => {
      document.removeEventListener('dragover', preventNav);
      document.removeEventListener('drop',     preventNav);
    };
  }, [open]);

  // ── Close panel on outside click ─────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const root = containerRef?.current ?? panelRef.current;
      if (root && !root.contains(e.target as Node)) {
        // 022Z: The delete-confirmation popover renders in a Radix portal at
        // document.body — outside `root`. Exclude those clicks so the panel
        // does not close (and destroy the anchor) before the confirmation
        // onClick handler can execute deletion.
        if (deletePopoverContentRef.current?.contains(e.target as Node)) return;
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose, containerRef]);

  // ── Close dropdown on outside click ──────────────────────────────────────
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  // ── Focus new-name input ──────────────────────────────────────────────────
  useEffect(() => {
    if (isAddingTheme) setTimeout(() => newNameInputRef.current?.focus(), 50);
  }, [isAddingTheme]);

  useEffect(() => {
    if (renamingId) setTimeout(() => renameInputRef.current?.focus(), 50);
  }, [renamingId]);

  // ── Ensure activeThemeId references a valid collection ────────────────────
  useEffect(() => {
    // Only landscape is a built-in theme ID; custom themes are user collections.
    const BUILT_IN_IDS = ['landscapes'];
    if (!BUILT_IN_IDS.includes(activeThemeId) && !collections.find(c => c.id === activeThemeId)) {
      setActiveThemeId('landscapes');
    }
  }, [collections, activeThemeId]);

  // ── Persist helper ────────────────────────────────────────────────────────
  const persist = useCallback((cols: PhotoCollection[]) => {
    setCollections(cols);
    saveCollections(cols);
  }, []);

  // ── 023A: Register restore setter so Checklist can call it from undo/redo ──
  // Declared AFTER `persist` so the effect dependency array is satisfied.
  // Checklist calls restoreCollectionsRef.current(cols, themeId) when an
  // undo/redo entry includes a collections snapshot.
  useEffect(() => {
    if (!restoreCollectionsRef) return;
    restoreCollectionsRef.current = (cols: PhotoCollection[], themeId: string) => {
      persist(cols);
      setActiveThemeId(themeId);
    };
    return () => { if (restoreCollectionsRef) restoreCollectionsRef.current = null; };
  }, [restoreCollectionsRef, persist]);

  // ── 023A: Orphaned-blob cleanup on first mount ─────────────────────────────
  // Blobs from themes deleted in previous sessions (or from redo after undo)
  // are not immediately removed so that Undo can restore them within the
  // same session.  This effect cleans up truly orphaned blobs on mount.
  useEffect(() => {
    const referencedIds = new Set(
      loadCollections().flatMap(c => c.photos.map(p => p.id)),
    );
    cleanupOrphanedPhotos(referencedIds).catch(() => {}); // best-effort
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once on mount only

  // ── 017E: DEV measurement — logs panel/grid geometry on bgFade slider change ──
  // Fires on every bgFade tick when the landscapes grid is visible.  Compare
  // logged tile.btn.h values frame-to-frame: stable values confirm the
  // padding-top fix eliminated aspect-ratio height drift.
  useEffect(() => {
    if (!open || activeThemeId !== 'landscapes') return;
    if (!import.meta.env.DEV) return;
    const panel = panelRef.current;
    const grid  = landscapeGridRef.current;
    if (!panel || !grid) return;
    const panelRect      = panel.getBoundingClientRect();
    const gridRect       = grid.getBoundingClientRect();
    const scrollbarWidth = panel.offsetWidth - panel.clientWidth;
    const hasScrollbar   = panel.scrollHeight > panel.clientHeight;
    const tiles = Array.from(grid.querySelectorAll('button[aria-pressed]')).slice(0, 2).map((btn, i) => {
      const r   = btn.getBoundingClientRect();
      const img = btn.querySelector('img');
      const ir  = img?.getBoundingClientRect() ?? null;
      const cs  = img ? window.getComputedStyle(img) : null;
      return { i, btn: { x: r.x, y: r.y, w: r.width, h: r.height }, img: ir ? { x: ir.x, y: ir.y, w: ir.width, h: ir.height } : null, objectFit: cs?.objectFit, objectPosition: cs?.objectPosition };
    });
    console.log('[017E:slider] bgFade=' + bgFade.toFixed(3), { panel: { offW: panel.offsetWidth, cliW: panel.clientWidth, scrollH: panel.scrollHeight, cliH: panel.clientHeight, scrollTop: panel.scrollTop, scrollbarWidth, hasScrollbar, rect: { x: panelRect.x, y: panelRect.y, w: panelRect.width, h: panelRect.height } }, grid: { offW: grid.offsetWidth, cliW: grid.clientWidth, rect: { x: gridRect.x, y: gridRect.y, w: gridRect.width, h: gridRect.height } }, tiles });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgFade]);

  // ── 017E: DEV measurement — logs panel/grid geometry on grid hover ────────
  // Provides console evidence that tile dimensions are stable across hover/slider
  // triggers.  Gated on import.meta.env.DEV so it tree-shakes out of production.
  const handleGridMeasure = useCallback(() => {
    if (!import.meta.env.DEV) return;
    const panel = panelRef.current;
    const grid  = landscapeGridRef.current;
    if (!panel || !grid) return;
    const panelRect      = panel.getBoundingClientRect();
    const gridRect       = grid.getBoundingClientRect();
    const scrollbarWidth = panel.offsetWidth - panel.clientWidth;
    const hasScrollbar   = panel.scrollHeight > panel.clientHeight;
    const tiles = Array.from(grid.querySelectorAll('button[aria-pressed]')).slice(0, 2).map((btn, i) => {
      const r   = btn.getBoundingClientRect();
      const img = btn.querySelector('img');
      const ir  = img?.getBoundingClientRect() ?? null;
      const cs  = img ? window.getComputedStyle(img) : null;
      return { i, btn: { x: r.x, y: r.y, w: r.width, h: r.height }, img: ir ? { x: ir.x, y: ir.y, w: ir.width, h: ir.height } : null, objectFit: cs?.objectFit, objectPosition: cs?.objectPosition };
    });
    console.log('[017E:hover] grid entered', { panel: { offW: panel.offsetWidth, cliW: panel.clientWidth, scrollH: panel.scrollHeight, cliH: panel.clientHeight, scrollbarWidth, hasScrollbar, rect: { x: panelRect.x, y: panelRect.y, w: panelRect.width, h: panelRect.height } }, grid: { offW: grid.offsetWidth, cliW: grid.clientWidth, rect: { x: gridRect.x, y: gridRect.y, w: gridRect.width, h: gridRect.height } }, tiles });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Dropdown actions ──────────────────────────────────────────────────────
  const handleThemeSelect = (id: string) => {
    setDropdownOpen(false);
    setStorageError(null);
    if (id === '__add_theme__') {
      setPrevThemeId(activeThemeId);
      setIsAddingTheme(true);
      setNewThemeName('');
      setNewThemeError(null);
    } else {
      setIsAddingTheme(false);
      setActiveThemeId(id);
      setConfirmDeleteTheme(null);
      setConfirmDeletePhoto(null);
      setRenamingId(null);
    }
  };

  // ── Add-theme ─────────────────────────────────────────────────────────────
  const commitNewTheme = () => {
    const name = newThemeName.trim();
    if (!name) { setNewThemeError('Theme name cannot be blank.'); return; }
    const res = createCollection(name, collections);
    if (!res) { setNewThemeError('A theme with that name already exists.'); return; }
    persist(res.result);
    setIsAddingTheme(false);
    setActiveThemeId(res.newId);
    setNewThemeName('');
    setNewThemeError(null);
  };

  const cancelNewTheme = () => {
    setIsAddingTheme(false);
    setActiveThemeId(prevThemeId);
    setNewThemeName('');
    setNewThemeError(null);
  };

  // ── Rename ────────────────────────────────────────────────────────────────
  const startRename = (col: PhotoCollection) => {
    setRenamingId(col.id);
    setRenameValue(col.name);
    setRenameError(null);
  };

  const commitRename = (id: string) => {
    const result = renameCollection(id, renameValue, collections);
    if (result === null) {
      const t = renameValue.trim();
      setRenameError(!t ? 'Name cannot be blank.' : 'Another theme already has that name.');
      return;
    }
    persist(result);
    setRenamingId(null);
    setRenameError(null);
  };

  const cancelRename = () => { setRenamingId(null); setRenameError(null); };

  // ── Upload ────────────────────────────────────────────────────────────────
  const triggerUpload = (collectionId: string) => {
    setUploadTargetId(collectionId);
    setStorageError(null);
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  /**
   * Save-first-then-show:
   * 1. Validate file.
   * 2. Compress (resize + encode).
   * 3. Write blob to IndexedDB.
   * 4. Update collection metadata.
   * 5. Load thumbnail object URL.
   * 6. Show thumbnail — only on success.
   */
  const processFiles = useCallback(async (files: File[], collectionId: string) => {
    setStorageError(null);

    const currentCol = (col: PhotoCollection[]) => col.find(c => c.id === collectionId);

    for (const file of files) {
      // Validate
      const validationError = validateImageFile(file);
      if (validationError) { setStorageError(validationError); continue; }

      // Check capacity (read latest state)
      const col = currentCol(collections);
      if (!col) continue;
      if (col.photos.length >= MAX_PHOTOS_PER_COLLECTION) break;

      const slotKey = `${collectionId}:saving-${Date.now()}`;
      setSavingSlotKey(slotKey);

      let photoId: string | null = null;

      try {
        // Compress
        const { blob, mimeType, width, height } = await compressPhotoFile(file);

        // Store in IndexedDB
        photoId = crypto.randomUUID();
        await storePhoto(photoId, blob, mimeType, width, height);

        // Update metadata
        const entry = { id: photoId };
        setCollections(prev => {
          const updated = addPhotoToCollection(collectionId, entry, prev);
          if (!updated) return prev;
          saveCollections(updated);
          return updated;
        });

        // Create thumbnail object URL from the blob we already have in memory
        const url = createPhotoObjectUrl(blob);
        thumbnailUrlsRef.current = { ...thumbnailUrlsRef.current, [photoId]: url };
        setThumbnailUrls(prev => ({ ...prev, [photoId!]: url }));

      } catch (err: any) {
        console.error('[TrailWeigh] Failed to save photo:', err);
        // Roll back: delete the blob if it was stored
        if (photoId) {
          await deletePhoto(photoId).catch(() => { /* best-effort */ });
        }
        const msg = err?.message?.includes('quota') || err?.name === 'QuotaExceededError'
          ? 'Photo storage is full. Remove unused theme photos before adding another.'
          : 'This photo could not be saved. Try a smaller image or remove unused theme photos.';
        setStorageError(msg);
      } finally {
        setSavingSlotKey(null);
      }
    }
  }, [collections]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!files.length || !uploadTargetId) return;
    await processFiles(files, uploadTargetId);
  };

  // ── Drag-and-drop ─────────────────────────────────────────────────────────
  const handleDragEnter = (e: React.DragEvent, key: string) => {
    e.preventDefault(); e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) setDragOverKey(key);
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDragLeave = (e: React.DragEvent, key: string) => {
    e.preventDefault(); e.stopPropagation();
    setDragOverKey(prev => (prev === key ? null : prev));
  };
  const handleDrop = async (e: React.DragEvent, collectionId: string, key: string) => {
    e.preventDefault(); e.stopPropagation();
    setDragOverKey(null);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) await processFiles(files, collectionId);
  };

  // ── Delete photo ──────────────────────────────────────────────────────────
  const confirmAndDeletePhoto = async (cid: string, pid: string) => {
    // If deleted photo is the active background, switch away
    if (background?.type === 'custom' && background.photoId === pid) {
      const col = collections.find(c => c.id === cid);
      const other = col?.photos.find(p => p.id !== pid);
      onBackgroundChange(other ? { type: 'custom', photoId: other.id } : null);
    }

    // Update metadata
    const updated = deletePhotoFromCollection(cid, pid, collections);
    persist(updated);
    setConfirmDeletePhoto(null);

    // Remove thumbnail URL
    if (thumbnailUrlsRef.current[pid]) {
      revokePhotoObjectUrl(thumbnailUrlsRef.current[pid]);
      const newUrls = { ...thumbnailUrlsRef.current };
      delete newUrls[pid];
      thumbnailUrlsRef.current = newUrls;
      setThumbnailUrls({ ...newUrls });
    }

    // Delete blob — check no other theme references this photo
    const stillUsed = updated.some(c => c.photos.some(p => p.id === pid));
    if (!stillUsed) await deletePhoto(pid);
  };

  // ── Delete theme ──────────────────────────────────────────────────────────
  const confirmAndDeleteTheme = async (id: string) => {
    const col = collections.find(c => c.id === id);

    // 023A: Push undo snapshot BEFORE making any state changes.
    // The snapshot includes the full collections array and active theme so
    // that Undo can restore the deleted theme (blobs remain in IndexedDB
    // for the duration of the session; orphans are cleaned on next mount).
    onBeforeDeleteTheme?.({ collections, activeThemeId });

    // If active background came from this theme, clear it
    if (background?.type === 'custom') {
      const usedByTheme = col?.photos.some(p => p.id === background.photoId);
      if (usedByTheme) onBackgroundChange(null);
    }

    const remaining = deleteCollection(id, collections);
    persist(remaining);
    setConfirmDeleteTheme(null);
    if (activeThemeId === id) setActiveThemeId('landscapes');
    if (renamingId === id) setRenamingId(null);

    // 023A: Photo blobs are intentionally NOT deleted immediately.
    // They remain in IndexedDB so Undo can restore the theme within the
    // current session.  Orphaned blobs are cleaned up on the next mount
    // via the cleanupOrphanedPhotos effect above.
    //
    // (Blob deletion deferred — blobs stay in IndexedDB until next mount cleanup)
  };

  // ── Render helpers ────────────────────────────────────────────────────────
  const activePresetId = background?.type === 'preset' ? background.id : null;

  const renderAddPhotoSlot = (col: PhotoCollection, slotIdx: number) => {
    const key = `${col.id}:${slotIdx}`;
    const isDragOver = dragOverKey === key;
    const isSaving   = savingSlotKey !== null && col.id === uploadTargetId;
    const atLimit    = col.photos.length >= MAX_PHOTOS_PER_COLLECTION;
    if (atLimit) return null;

    return (
      <div
        key={key}
        role={isSaving ? undefined : 'button'}
        tabIndex={isSaving ? undefined : 0}
        aria-label={isSaving ? 'Saving photo…' : `Add photo to ${col.name}, slot ${slotIdx + 1}`}
        onClick={isSaving ? undefined : () => triggerUpload(col.id)}
        onKeyDown={isSaving ? undefined : e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerUpload(col.id); }
        }}
        onDragEnter={e => handleDragEnter(e, key)}
        onDragOver={handleDragOver}
        onDragLeave={e => handleDragLeave(e, key)}
        onDrop={e => handleDrop(e, col.id, key)}
        className={`relative overflow-hidden rounded-lg aspect-[3/2] transition-all select-none
          ${isSaving ? 'cursor-default bg-muted/30' : 'cursor-pointer'}
          ${isDragOver
            ? 'ring-2 ring-primary ring-offset-1 bg-primary/10'
            : 'ring-1 ring-border hover:ring-2 hover:ring-foreground/30 hover:ring-offset-1'
          }
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
      >
        {!isSaving && (
          <div className={`absolute inset-0 m-1 rounded border-2 border-dashed transition-colors ${isDragOver ? 'border-primary' : 'border-border'}`} />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-[10px] font-semibold text-muted-foreground leading-none">Saving photo…</span>
            </>
          ) : (
            <>
              <div className="rounded-full p-1.5 bg-muted/60 text-muted-foreground transition-colors">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground leading-none">
                {isDragOver ? 'Drop here' : 'Add Photo'}
              </span>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderPhotoSlot = (col: PhotoCollection, slotIdx: number) => {
    const photo = col.photos[slotIdx];
    if (!photo) return renderAddPhotoSlot(col, slotIdx);

    const thumbUrl = thumbnailUrls[photo.id] ?? null;
    const isActive = background?.type === 'custom' && background.photoId === photo.id;
    const isConfirmingDelete = confirmDeletePhoto?.cid === col.id && confirmDeletePhoto.pid === photo.id;

    if (isConfirmingDelete) {
      return (
        <div key={photo.id} className="rounded-lg aspect-[3/2] bg-destructive/10 border border-destructive/30 flex flex-col items-center justify-center gap-1.5 p-2">
          <p className="text-[10px] text-center text-foreground leading-tight">Remove this photo?</p>
          <div className="flex gap-1">
            <button
              onClick={() => confirmAndDeletePhoto(col.id, photo.id)}
              className="text-[10px] font-semibold bg-destructive text-destructive-foreground px-2 py-0.5 rounded transition-colors"
            >Remove</button>
            <button
              onClick={() => setConfirmDeletePhoto(null)}
              className="text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded transition-colors"
            >Cancel</button>
          </div>
        </div>
      );
    }

    return (
      <div key={photo.id} className="relative group">
        <button
          onClick={() => onBackgroundChange({ type: 'custom', photoId: photo.id })}
          aria-pressed={isActive}
          aria-label="Select this photo as background"
          className={`w-full relative overflow-hidden rounded-lg aspect-[3/2] transition-all ${
            isActive ? 'ring-2 ring-primary ring-offset-1' : 'hover:ring-2 hover:ring-foreground/30 hover:ring-offset-1'
          }`}
        >
          {thumbUrl ? (
            <img src={thumbUrl} alt="Custom background" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/30">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {isActive && (
            <div className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center pointer-events-none">
              <Check className="w-2.5 h-2.5" />
            </div>
          )}
        </button>
        <button
          onClick={e => { e.stopPropagation(); setConfirmDeletePhoto({ cid: col.id, pid: photo.id }); }}
          className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center opacity-50 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Delete this photo"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  };

  // ── Custom theme panel ────────────────────────────────────────────────────
  const renderCustomThemePanel = (col: PhotoCollection) => {
    const isThisRenaming     = renamingId === col.id;
    const isConfirmingDelete = confirmDeleteTheme === col.id;
    const photoCount         = col.photos.length;
    const slots = Array.from({ length: MAX_PHOTOS_PER_COLLECTION }, (_, i) => i);

    return (
      <div className="px-3 pb-3">
        {/* Collection name / rename row */}
        <div className="flex items-center gap-1.5 mb-2 min-w-0">
          {isThisRenaming ? (
            <div className="flex-1 flex items-center gap-1 min-w-0">
              <input
                ref={renameInputRef}
                type="text"
                value={renameValue}
                onChange={e => { setRenameValue(e.target.value); setRenameError(null); }}
                onKeyDown={e => {
                  if (e.key === 'Enter') commitRename(col.id);
                  if (e.key === 'Escape') cancelRename();
                }}
                maxLength={40}
                aria-label={`Rename theme ${col.name}`}
                className="flex-1 text-xs border border-border rounded-md px-2 py-1 bg-background focus:outline-none focus:border-primary/50 text-foreground min-w-0"
              />
              <button
                onClick={() => commitRename(col.id)}
                className="text-xs font-semibold bg-primary text-primary-foreground px-2 py-1 rounded-md hover:bg-primary/90 transition-colors flex-shrink-0"
              >OK</button>
              <button
                onClick={cancelRename}
                className="p-1 text-muted-foreground hover:text-foreground flex-shrink-0"
                aria-label="Cancel rename"
              ><X className="w-3 h-3" /></button>
            </div>
          ) : (
            <>
              <span className="text-[11px] font-semibold text-foreground flex-1 truncate min-w-0" title={col.name}>
                {col.name}
              </span>
              <span className="text-[10px] text-muted-foreground flex-shrink-0 mr-0.5">
                {photoCount}/{MAX_PHOTOS_PER_COLLECTION}
              </span>
              <button
                onClick={() => startRename(col)}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`Edit theme name: ${col.name}`}
                title={`Rename theme "${col.name}"`}
              ><Pencil className="w-3 h-3" /></button>
              <Popover
                open={isConfirmingDelete}
                onOpenChange={(open) => { if (!open) setConfirmDeleteTheme(null); }}
              >
                <PopoverTrigger asChild>
                  <button
                    onClick={() => setConfirmDeleteTheme(col.id)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                    aria-label={`Delete theme "${col.name}"`}
                    title={`Delete theme "${col.name}"`}
                  ><Trash2 className="w-3 h-3" /></button>
                </PopoverTrigger>
                <PopoverContent
                  ref={deletePopoverContentRef}
                  side="top"
                  align="end"
                  className="w-56 p-3"
                  onInteractOutside={(e) => {
                    // 022Z: prevent Radix from treating a click inside the
                    // parent panel (or its portal siblings) as "outside" and
                    // closing the confirmation prematurely.
                    const root = containerRef?.current ?? panelRef.current;
                    if (root?.contains(e.target as Node)) e.preventDefault();
                  }}
                >
                  <p className="text-sm font-semibold mb-1 leading-snug">Delete Custom Theme?</p>
                  <p className="text-sm mb-1 leading-snug">
                    Delete <strong>"{col.name}"</strong> and its custom background photos?
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">You can undo this action.</p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setConfirmDeleteTheme(null)}
                      className="font-semibold bg-muted text-muted-foreground px-2.5 py-1 rounded-md text-xs hover:bg-muted/80 transition-colors"
                    >Cancel</button>
                    <button
                      onClick={() => confirmAndDeleteTheme(col.id)}
                      className="font-semibold bg-destructive text-destructive-foreground px-2.5 py-1 rounded-md text-xs hover:bg-destructive/90 transition-colors"
                    >Delete Theme</button>
                  </div>
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>

        {isThisRenaming && renameError && (
          <p className="text-[11px] text-destructive mb-1.5 px-0.5">{renameError}</p>
        )}

        {storageError && (
          <div className="mb-2 px-2 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-[11px] text-destructive leading-snug">{storageError}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-1.5">
          {slots.map(i => renderPhotoSlot(col, i))}
        </div>

        <p className="text-[10px] text-muted-foreground mt-1 px-0.5">
          JPEG, PNG, WebP, GIF — max 25 MB · click or drag to add
        </p>

      </div>
    );
  };

  // ── Add-theme form ────────────────────────────────────────────────────────
  const renderAddThemeForm = () => {
    const slots = Array.from({ length: MAX_PHOTOS_PER_COLLECTION }, (_, i) => i);
    return (
      <div className="px-3 pb-3">
        <div className="flex items-center gap-1.5 mb-2">
          <input
            ref={newNameInputRef}
            type="text"
            value={newThemeName}
            onChange={e => { setNewThemeName(e.target.value); setNewThemeError(null); }}
            onKeyDown={e => {
              if (e.key === 'Enter') commitNewTheme();
              if (e.key === 'Escape') cancelNewTheme();
            }}
            placeholder="Name…"
            maxLength={40}
            aria-label="New theme name"
            className="flex-1 text-xs border border-border rounded-md px-2 py-1.5 bg-background focus:outline-none focus:border-primary/50 text-foreground placeholder:text-muted-foreground min-w-0"
          />
          <button
            onClick={commitNewTheme}
            disabled={!newThemeName.trim()}
            className="text-xs font-semibold bg-primary text-primary-foreground px-2.5 py-1.5 rounded-md hover:bg-primary/90 disabled:opacity-40 transition-colors whitespace-nowrap flex-shrink-0"
          >Save</button>
          <button
            onClick={cancelNewTheme}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            aria-label="Cancel"
          ><X className="w-3.5 h-3.5" /></button>
        </div>
        {newThemeError && (
          <p className="text-[11px] text-destructive mb-2 px-0.5">{newThemeError}</p>
        )}
        <div className="grid grid-cols-2 gap-1.5 opacity-50 pointer-events-none" aria-hidden="true">
          {slots.map(i => (
            <div key={i} className="relative overflow-hidden rounded-lg aspect-[3/2] ring-1 ring-border">
              <div className="absolute inset-0 m-1 rounded border-2 border-dashed border-border" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                <div className="rounded-full p-1.5 bg-muted/60 text-muted-foreground">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground leading-none">Add Photo</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 px-0.5">Save the theme name to start adding photos.</p>
      </div>
    );
  };

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div
      ref={panelRef}
      className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-[24rem] max-h-[calc(100dvh-10rem)] overflow-y-auto bg-card border border-card-border rounded-xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-150"
      style={{ display: open ? undefined : 'none', willChange: 'transform' }}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        multiple
        className="sr-only"
        onChange={handleFileChange}
        aria-hidden="true"
      />

      {/* ── Header ── */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Background</h3>
      </div>

      {/* ── Fill/Fit + Light/Dark + Fade ── */}
      <div className="px-4 pb-3 border-b border-border">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5" aria-label="Background display controls">
          <div role="group" aria-label="Image sizing" className="flex rounded-lg overflow-hidden border border-border text-[11px] font-semibold">
            <button
              onClick={() => onBgSizeChange('cover')}
              aria-pressed={bgSize === 'cover'}
              className={`px-3 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${
                bgSize === 'cover' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >Fill Screen</button>
            <button
              onClick={() => onBgSizeChange('contain')}
              aria-pressed={bgSize === 'contain'}
              className={`px-3 py-1 transition-colors border-l border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${
                bgSize === 'contain' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >Fit Image</button>
          </div>
          <div role="group" aria-label="Background tone" className="flex rounded-lg overflow-hidden border border-border text-[11px] font-semibold">
            <button
              onClick={() => onBgToneChange('light')}
              aria-pressed={bgTone === 'light'}
              className={`px-3 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${
                bgTone === 'light' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >☀ Light</button>
            <button
              onClick={() => onBgToneChange('dark')}
              aria-pressed={bgTone === 'dark'}
              className={`px-3 py-1 transition-colors border-l border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${
                bgTone === 'dark' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >🌙 Dark</button>
          </div>
        </div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">{bgTone === 'dark' ? 'Darken' : 'Lighten'}</span>
          <span className="text-xs text-muted-foreground tabular-nums">{Math.round(bgFade * 100)}%</span>
        </div>
        <input
          type="range" min={0} max={1} step={0.01} value={bgFade}
          onChange={e => onBgFadeChange(parseFloat(e.target.value))}
          aria-label={bgTone === 'dark' ? 'Darken level' : 'Lighten level'}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary bg-border"
        />
      </div>

      {/* ── Theme dropdown ── */}
      <div className="px-3 pt-3 pb-0">
        <div ref={dropdownRef} className="relative mb-3">
          {/*
           * FIX (Prompt 016B): Added `text-foreground` so the closed-dropdown
           * label is visible in all themes/modes.  The previous version lacked
           * an explicit foreground colour, making the text invisible against the
           * muted background in some colour-scheme configurations.
           */}
          <button
            onClick={() => setDropdownOpen(v => !v)}
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
            className="w-full flex items-center justify-between gap-2 text-[11px] font-semibold text-foreground bg-muted/40 hover:bg-muted/70 border border-border rounded-lg px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span>{dropdownLabel}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform flex-shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div
              role="listbox"
              aria-label="Select theme"
              className="absolute left-0 right-0 top-full mt-1 z-10 bg-card border border-border rounded-lg shadow-lg overflow-hidden"
            >
              {/* Built-in 1: Landscape */}
              <button
                role="option"
                aria-selected={!isAddingTheme && activeThemeId === 'landscapes'}
                onClick={() => handleThemeSelect('landscapes')}
                className={`w-full text-left px-3 py-2 text-[11px] font-semibold transition-colors ${
                  !isAddingTheme && activeThemeId === 'landscapes'
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-muted/50'
                }`}
              >Landscape</button>

              {/* 023B/C — Custom themes: display exact user-entered name, no "Theme " prefix; always last */}
              {collections.map(col => (
                <button
                  key={col.id}
                  role="option"
                  aria-selected={!isAddingTheme && activeThemeId === col.id}
                  onClick={() => handleThemeSelect(col.id)}
                  className={`w-full text-left px-3 py-2 text-[11px] font-semibold transition-colors ${
                    !isAddingTheme && activeThemeId === col.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted/50'
                  }`}
                >{col.name}</button>
              ))}

              {canAddTheme ? (
                <button
                  role="option"
                  aria-selected={isAddingTheme}
                  onClick={() => handleThemeSelect('__add_theme__')}
                  className={`w-full text-left px-3 py-2 text-[11px] font-semibold border-t border-border transition-colors ${
                    isAddingTheme ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >+ Add Theme</button>
              ) : (
                <div className="px-3 py-2 text-[11px] text-muted-foreground border-t border-border">
                  Maximum of 10 custom themes reached.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Theme panel ── */}
      {isAddingTheme ? (
        renderAddThemeForm()
      ) : activeThemeId === 'landscapes' ? (
        // 017E fix: grid wrapper gets its own GPU compositing layer (willChange:transform)
        // so re-compositing caused by parent background-image repaints cannot cascade
        // into the tiles' rasterization context.  onMouseEnter fires the DEV measurement.
        <div
          ref={landscapeGridRef}
          className="px-3 pb-3"
          style={{ willChange: 'transform' }}
          onMouseEnter={handleGridMeasure}
        >
          <div className="grid grid-cols-2 gap-1.5">
            {PRESETS.map(p => {
              const isActive = activePresetId === p.id;
              return (
                // 017E fix: outer div establishes the aspect-ratio container via
                // padding-top: 66.667% (a layout-phase value, not a GPU compositing
                // rasterization-phase value).  Replaces the Tailwind aspect-ratio
                // class on the button, which was re-evaluated at compositing time
                // and could produce different subpixel heights on consecutive frames,
                // shifting the object-cover crop visibly.
                <div key={p.id} className="relative" style={{ paddingTop: '66.667%' }}>
                  <button
                    onClick={() => onBackgroundChange({ type: 'preset', id: p.id })}
                    aria-pressed={isActive}
                    aria-label={p.label}
                    className={`absolute inset-0 overflow-hidden rounded-lg group ${
                      isActive ? 'ring-2 ring-primary ring-offset-1' : 'hover:ring-2 hover:ring-foreground/30 hover:ring-offset-1'
                    }`}
                  >
                    <img src={getThumbUrl(p.photoId)} alt={p.label} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 pointer-events-none">
                      <span className="text-[10px] font-semibold text-white leading-none">{p.label}</span>
                    </div>
                    {isActive && (
                      <div className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center pointer-events-none">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      ) : activeCollection ? (
        renderCustomThemePanel(activeCollection)
      ) : null}

      {/* ── Remove background ── */}
      {background && (
        <>
          <div className="border-t border-border mx-3" />
          <div className="px-3 py-2.5">
            <button
              onClick={() => onBackgroundChange(null)}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive border border-border hover:border-destructive/40 bg-transparent hover:bg-destructive/5 px-3 py-2 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Remove background
            </button>
          </div>
        </>
      )}
    </div>
  );
}
