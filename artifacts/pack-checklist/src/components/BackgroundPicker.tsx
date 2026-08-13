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
import React, { useRef, useEffect, useLayoutEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ImageIcon, X, Check, ChevronDown, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useBarStyle, barCombinedStyle, barFontStyle } from '../context/BarStyleContext';
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

// ── Bar Color / Text — font options ───────────────────────────────────────────
export const FONT_OPTIONS: { label: string; value: string }[] = [
  { label: 'Default TrailWeigh',  value: '' },
  { label: 'Arial',               value: 'Arial, sans-serif' },
  { label: 'Helvetica',           value: 'Helvetica, sans-serif' },
  { label: 'Verdana',             value: 'Verdana, sans-serif' },
  { label: 'Trebuchet MS',        value: "'Trebuchet MS', sans-serif" },
  { label: 'Georgia',             value: 'Georgia, serif' },
  { label: 'Times New Roman',     value: "'Times New Roman', serif" },
  { label: 'Courier New',         value: "'Courier New', monospace" },
];

// ── Contrast helpers (WCAG relative luminance) ─────────────────────────────────
function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}
function relLum(r: number, g: number, b: number): number {
  return [r, g, b].reduce((acc, c, i) => {
    const v = c / 255;
    const l = v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    return acc + l * [0.2126, 0.7152, 0.0722][i];
  }, 0);
}
function contrastRatio(c1: string, c2: string): number {
  const r1 = hexToRgb(c1), r2 = hexToRgb(c2);
  if (!r1 || !r2) return Infinity;
  const l1 = relLum(...r1), l2 = relLum(...r2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/** Common shape for all built-in preset entries.
 *  Landscape presets use photoId (Unsplash); 026D static-asset presets use photoPath. */
export interface BuiltinPreset {
  id: string;
  label?: string;
  photoId?: string;
  photoPath?: string;
}

export const PRESETS: BuiltinPreset[] = [
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

// ── Permanent built-in themes — use { type:'preset', id } so they are fully ──
// portable through Share/Review without requiring the owner's IndexedDB blobs.

/** 026D: Exact recovered original photos installed as Vite static assets.
 *  10 PNGs per theme, served from /themes/<slug>/01.png … 10.png. */
export const PSYCHEDELIC_PRESETS: BuiltinPreset[] = Array.from({ length: 10 }, (_, i) => ({
  id: `psychedelic-${String(i + 1).padStart(2, '0')}`,
  photoPath: `/themes/psychedelic/${String(i + 1).padStart(2, '0')}.png`,
  label: `Photo ${i + 1}`,
}));

export const RETRO_PRESETS: BuiltinPreset[] = Array.from({ length: 10 }, (_, i) => ({
  id: `retro-outdoors-${String(i + 1).padStart(2, '0')}`,
  photoPath: `/themes/retro-outdoors/${String(i + 1).padStart(2, '0')}.png`,
  label: `Photo ${i + 1}`,
}));

export const TOPO_PRESETS: BuiltinPreset[] = Array.from({ length: 10 }, (_, i) => ({
  id: `topo-${String(i + 1).padStart(2, '0')}`,
  photoPath: `/themes/topo/${String(i + 1).padStart(2, '0')}.png`,
  label: `Photo ${i + 1}`,
}));

export const TRAILS_PRESETS: BuiltinPreset[] = Array.from({ length: 10 }, (_, i) => ({
  id: `trails-us-${String(i + 1).padStart(2, '0')}`,
  photoPath: `/themes/trails-us/${String(i + 1).padStart(2, '0')}.png`,
  label: `Photo ${i + 1}`,
}));

/** Ordered registry of every built-in theme. */
export const BUILTIN_THEMES = [
  { id: 'landscapes',     label: 'Landscape',      presets: PRESETS              },
  { id: 'psychedelic',    label: 'Psychedelic',    presets: PSYCHEDELIC_PRESETS  },
  { id: 'retro-outdoors', label: 'Retro-Outdoors', presets: RETRO_PRESETS        },
  { id: 'topo',           label: 'Topo',           presets: TOPO_PRESETS         },
  { id: 'trails-us',      label: 'Trails US',      presets: TRAILS_PRESETS       },
];

/** Flat list of every built-in preset across all themes. Used to resolve any
 *  preset ID → display URL without knowing its parent theme. */
export const ALL_BUILTIN_PRESETS: BuiltinPreset[] = BUILTIN_THEMES.flatMap(t => t.presets);

/** 026D: Legacy browser-local photo UUIDs → canonical built-in preset IDs.
 *  The four original custom collections were saved as { type:'custom', photoId }
 *  in the owner's localStorage. ReviewPage uses this map to normalise those
 *  saves to { type:'preset', id } so the correct static asset is shown in Review. */
export const LEGACY_PHOTO_ID_MAP: Record<string, string> = {
  // Psychedelic (original collection d79067cd-baff-4945-ad0e-d0e9d76ecd77)
  '3e332c40-c9f0-47ae-81a9-b8c935edbb6f': 'psychedelic-01',
  '0b24e918-fbb1-41b1-bc98-d9536ac1b51e': 'psychedelic-02',
  '333224d7-35fa-4c46-9dd5-6018478f6f5b': 'psychedelic-03',
  'a259f90c-d276-441b-9e0a-b67b0b348805': 'psychedelic-04',
  '4d5c2b91-91b5-43e6-91a8-4df2203a310c': 'psychedelic-05',
  '029d55db-70c7-40f3-a593-0bd8c285da5a': 'psychedelic-06',
  'efc60681-a786-470a-a90a-02ebb7c799bc': 'psychedelic-07',
  '331425c9-7950-46c9-83ca-d22e8b0db75d': 'psychedelic-08',
  '1fa4bb40-8029-4d05-bf8b-c705165c1880': 'psychedelic-09',
  '16b077e2-fd86-4012-926c-0df1ec92d46b': 'psychedelic-10',
  // Retro-Outdoors (original collection 13ed57b7-c050-43b6-bd85-05a7c0fe102a)
  '2440d098-98e0-41d7-9809-1e35811a30ce': 'retro-outdoors-01',
  '4998c2db-c344-4210-85fd-aa5673f25e83': 'retro-outdoors-02',
  'f050f6c4-a3e4-4601-b9f8-518d000432ec': 'retro-outdoors-03',
  '31ac6cb8-b02a-4df5-8561-69305a992949': 'retro-outdoors-04',
  '44b4390d-0c8a-4849-84d5-6f1a3130ecd6': 'retro-outdoors-05',
  '112b45c3-9a3f-4d5b-a789-c7fbf7517818': 'retro-outdoors-06',
  '35883452-6967-419d-9d2c-27fb52bdcb46': 'retro-outdoors-07',
  '9854e28b-58cc-4dd8-b186-e8e2e0f23be7': 'retro-outdoors-08',
  'f0fccc20-5841-4635-9cd5-3303ac6a1894': 'retro-outdoors-09',
  '701cc0ea-4912-416c-b08e-0c747381668c': 'retro-outdoors-10',
  // Topo (original collection 0452da5c-3bbe-4255-994d-02065c67bbec)
  '86ab16d2-a9b3-402e-b1c4-a9ef087bfaf3': 'topo-01',
  '5bcea54b-8af5-4f96-8235-66ef2e1f689b': 'topo-02',
  'd7e61aeb-ba47-46a4-97a9-bd52e60e1431': 'topo-03',
  'a6cee42d-b3ce-4d33-8423-95b0a678f80d': 'topo-04',
  'ddf5749c-e1f8-4be3-af3a-fd81ebcb3802': 'topo-05',
  'eb6c7fe1-49f4-40bf-9fa3-4745cdc6966a': 'topo-06',
  '1b386681-19cb-421e-afe9-ce3e2c374990': 'topo-07',
  '85bc06d6-35f3-4fbc-b94c-32f02099585f': 'topo-08',
  'e0ec1f6b-bdc8-4dd1-95b1-8ddcba03e049': 'topo-09',
  '9cd855ca-f2e1-46b7-a39e-5ddfd605e137': 'topo-10',
  // Trails US (original collection 77d40288-102c-41e6-8927-184eb55b073d)
  '65e1d32d-25ec-4d41-96c7-dd6e60f85f43': 'trails-us-01',
  '3cf3b624-94a7-4c89-a904-08c536c58bcd': 'trails-us-02',
  'dba3311b-adb5-46f0-a438-bc404842b01a': 'trails-us-03',
  '36f04b32-80e5-43c7-b57f-c98a31c7e34d': 'trails-us-04',
  '7eea6590-6d18-4785-bb1f-2578724ac108': 'trails-us-05',
  '611631b5-ff36-4dc1-81a2-10c11577c987': 'trails-us-06',
  '33c6e859-3cf9-43ac-ab22-fb473598631f': 'trails-us-07',
  '615f101e-afa2-4aed-b88c-c95136573092': 'trails-us-08',
  '79e6f628-9ca5-47c8-b2d8-f18021c2d8ef': 'trails-us-09',
  '944a1a61-6037-483a-8600-c498bf2e0978': 'trails-us-10',
};

/** 026D: Suppress the four original browser-local duplicate collections by
 *  exact UUID. Filter-only — the underlying localStorage/IndexedDB data is
 *  NOT deleted. Never filter by name; only exact UUID. */
const SUPPRESSED_LEGACY_COLLECTION_IDS = new Set([
  'd79067cd-baff-4945-ad0e-d0e9d76ecd77', // Psychedelic
  '13ed57b7-c050-43b6-bd85-05a7c0fe102a', // Retro-Outdoors
  '0452da5c-3bbe-4255-994d-02065c67bbec', // Topo
  '77d40288-102c-41e6-8927-184eb55b073d', // Trails US
]);

export function getFullUrl(photoId: string) {
  return `https://images.unsplash.com/photo-${photoId}?w=1920&q=85&fit=crop`;
}

function getThumbUrl(photoId: string) {
  return `https://images.unsplash.com/photo-${photoId}?w=400&h=260&fit=crop&q=70`;
}

/** Resolve the full-size display URL for any built-in preset.
 *  Landscape presets use Unsplash (photoId); 026D themes use Vite static assets (photoPath). */
export function getPresetFullUrl(preset: { photoId?: string; photoPath?: string }): string {
  if (preset.photoPath) return preset.photoPath;
  if (preset.photoId) return getFullUrl(preset.photoId);
  return '';
}

/** Resolve thumbnail URL for a built-in preset (static presets reuse the full image). */
function getPresetThumbUrl(preset: { photoId?: string; photoPath?: string }): string {
  if (preset.photoPath) return preset.photoPath;
  if (preset.photoId) return getThumbUrl(preset.photoId);
  return '';
}

/** Resolve the full-size URL for a preset ID, for use in Checklist / ReviewPage. */
export function resolvePresetUrl(id: string): string {
  const p = ALL_BUILTIN_PRESETS.find(q => q.id === id);
  return p ? getPresetFullUrl(p) : '';
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
   *  true  → pill shows active/open state.
   *  false → normal inactive pill matching Hide/Preview. */
  panelOpen: boolean;
}) {
  // 023F: consume bar style so the button matches all other toolbar pills
  const barStyle = useBarStyle();
  const hasBarColor = !!barStyle.barColor;

  // Active/open state: when a custom bar color is set, show an outline ring
  // to signal "open" while staying within the custom color family.
  // Without a custom color the legacy white-pill appearance is preserved.
  const activeStyle: React.CSSProperties =
    panelOpen && hasBarColor
      ? { outline: '2px solid rgba(255,255,255,0.75)', outlineOffset: '1px' }
      : {};

  return (
    <button
      onClick={onClick}
      title="Background Edit"
      aria-label="Background Edit"
      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
        panelOpen && !hasBarColor
          ? 'bg-white text-gray-900 border border-white/80'
          : 'bg-muted text-muted-foreground hover:text-foreground border border-transparent'
      }`}
      style={{ ...barCombinedStyle(barStyle), ...activeStyle }}
    >
      <ImageIcon className="w-3.5 h-3.5" />
      Background
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
  // ── 023E: Bar Color / Text props ──────────────────────────────────────────
  barColor: string;
  onBarColorChange: (v: string) => void;
  /** 023Q: Called on mousedown — records pre-pick value for single undo entry. */
  onBarColorPickerStart?: () => void;
  /** 023Q: Called on blur — commits one undo entry + localStorage write. */
  onBarColorCommit?: () => void;
  barFont: string;
  onBarFontChange: (v: string) => void;
  barTextColor: string;
  onBarTextColorChange: (v: string) => void;
  /** 023Q: Called on mousedown — records pre-pick value for single undo entry. */
  onBarTextColorPickerStart?: () => void;
  /** 023Q: Called on blur — commits one undo entry + localStorage write. */
  onBarTextColorCommit?: () => void;
  onResetBarStyle: () => void;
  // ── 023G/023N: Transparency ───────────────────────────────────────────────
  /** 0 = fully transparent, 1 = fully solid. Default 1. */
  barTransparency: number;
  /** Called on every onChange — live preview only, no undo push. */
  onBarTransparencyChange: (v: number) => void;
  /** Called on mousedown / keydown — records pre-drag state for undo. */
  onBarTransparencyDragStart?: () => void;
  /** Called on mouseup / touchend / keyup / blur — commits one undo entry. */
  onBarTransparencyCommit?: () => void;
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
  barColor,
  onBarColorChange,
  onBarColorPickerStart,
  onBarColorCommit,
  barFont,
  onBarFontChange,
  barTextColor,
  onBarTextColorChange,
  onBarTextColorPickerStart,
  onBarTextColorCommit,
  onResetBarStyle,
  barTransparency,
  onBarTransparencyChange,
  onBarTransparencyDragStart,
  onBarTransparencyCommit,
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

  // ── 024N: Fixed position for the portaled panel ───────────────────────────
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});

  useLayoutEffect(() => {
    if (!open || !containerRef?.current) return;
    const updatePos = () => {
      const anchor = containerRef!.current;
      if (!anchor) return;
      const rect   = anchor.getBoundingClientRect();
      const panelW = 384; // matches w-[24rem]
      const margin = 8;
      let left = rect.left + rect.width / 2 - panelW / 2;
      left = Math.max(margin, Math.min(left, window.innerWidth - panelW - margin));
      setPanelStyle({ top: rect.bottom + 8, left });
    };
    updatePos();
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [open, containerRef]);

  // ── Derived ──────────────────────────────────────────────────────────────
  const canAddTheme       = collections.length < MAX_COLLECTIONS;
  const activeCollection  = collections.find(c => c.id === activeThemeId) ?? null;

  const dropdownLabel = (() => {
    if (isAddingTheme) return 'Add Theme';
    // Check built-in themes first (Landscape, Psychedelic, Retro-Outdoors, Topo, Trails US)
    const builtIn = BUILTIN_THEMES.find(t => t.id === activeThemeId);
    if (builtIn) return builtIn.label;
    // Then user custom collections
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

    // Skip custom-thumbnail loading for all built-in themes (they use static URLs) and add-form
    const BUILTIN_IDS = new Set(BUILTIN_THEMES.map(t => t.id));
    if (!open || BUILTIN_IDS.has(activeThemeId) || isAddingTheme) {
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
      // 024N: panel is portaled to document.body so it lives outside
      // containerRef — check both the anchor container and the portaled panel.
      // Also exclude the Radix delete-confirmation popover (022Z).
      if (containerRef?.current?.contains(e.target as Node)) return;
      if (panelRef.current?.contains(e.target as Node)) return;
      if (deletePopoverContentRef.current?.contains(e.target as Node)) return;
      onClose();
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

  // ── Ensure activeThemeId references a valid built-in theme or user collection ─
  useEffect(() => {
    const BUILT_IN_IDS = BUILTIN_THEMES.map(t => t.id);
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

  // ── Main render ──────────────────────────────────────────────────────────
  // 024N: panel is portaled to document.body so it is never clipped by the
  // toolbar row's restored lg:overflow-hidden. Position is computed via
  // useLayoutEffect above and applied as fixed style props.
  return createPortal(
    <div
      ref={panelRef}
      className={`w-[24rem] max-h-[calc(100dvh-10rem)] overflow-y-auto bg-card border border-card-border rounded-xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-150${bgTone === 'dark' ? ' screen-dark' : ''}`}
      style={{
        display: open ? undefined : 'none',
        position: 'fixed',
        zIndex: 50,
        willChange: 'transform',
        ...panelStyle,
        // 023G: selected Font cascades through the entire expanded panel
        ...(barFont ? { fontFamily: barFont } : {}),
      }}
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

      {/* ── 023E: Bar Color / Text ── */}
      {(() => {
        const barHasCustom = !!(barColor || barFont || barTextColor);
        const lowContrast  = !!(barColor && barTextColor && contrastRatio(barColor, barTextColor) < 3);
        return (
          <div className="px-4 pb-3 border-b border-border">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-1">
              Bar Color / Text
            </p>

            {/* Bar Color row */}
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-medium text-foreground">Bar Color</label>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-5 h-5 rounded border border-border flex-shrink-0"
                  style={{ backgroundColor: barColor || 'transparent' }}
                  title={barColor || 'Default'}
                />
                <input
                  type="color"
                  value={barColor || '#f4f4f5'}
                  onChange={e => onBarColorChange(e.target.value)}
                  onMouseDown={() => onBarColorPickerStart?.()}
                  onBlur={() => onBarColorCommit?.()}
                  className="w-7 h-7 rounded border border-border cursor-pointer p-0.5 bg-transparent"
                  aria-label="Bar background color"
                />
                {barColor && (
                  <button
                    onClick={() => onBarColorChange('')}
                    className="text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1"
                    title="Reset bar color"
                  >✕</button>
                )}
              </div>
            </div>

            {/* Font row */}
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-medium text-foreground">Font</label>
              <select
                value={barFont}
                onChange={e => onBarFontChange(e.target.value)}
                className="text-[11px] border border-border rounded-md px-2 py-1 bg-background text-foreground w-[148px] focus:outline-none focus:border-primary/50 cursor-pointer"
                style={barFont ? { fontFamily: barFont } : undefined}
              >
                {FONT_OPTIONS.map(f => (
                  <option key={f.value} value={f.value} style={f.value ? { fontFamily: f.value } : undefined}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Text Color row */}
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-medium text-foreground">Text Color</label>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-5 h-5 rounded border border-border flex-shrink-0"
                  style={{ backgroundColor: barTextColor || 'transparent' }}
                  title={barTextColor || 'Default'}
                />
                <input
                  type="color"
                  value={barTextColor || '#71717a'}
                  onChange={e => onBarTextColorChange(e.target.value)}
                  onMouseDown={() => onBarTextColorPickerStart?.()}
                  onBlur={() => onBarTextColorCommit?.()}
                  className="w-7 h-7 rounded border border-border cursor-pointer p-0.5 bg-transparent"
                  aria-label="Bar text color"
                />
                {barTextColor && (
                  <button
                    onClick={() => onBarTextColorChange('')}
                    className="text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1"
                    title="Reset text color"
                  >✕</button>
                )}
              </div>
            </div>

            {/* Reset all + contrast warning */}
            <div className="flex items-center justify-between min-h-[18px]">
              {barHasCustom ? (
                <button
                  onClick={onResetBarStyle}
                  className="text-[10px] text-muted-foreground hover:text-foreground border border-border px-2 py-0.5 rounded transition-colors"
                >
                  Reset Bar / Text
                </button>
              ) : <span />}
              {lowContrast && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400 text-right leading-tight">
                  Low contrast — text may be hard to read
                </p>
              )}
            </div>
          </div>
        );
      })()}

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

      {/* ── 023G: Transparency — directly below Darken, above Background Themes ── */}
      <div className="px-4 pb-3 border-b border-border">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">Transparency</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {barTransparency >= 1 ? 'Solid' : barTransparency <= 0 ? 'Transparent' : `${Math.round(barTransparency * 100)}%`}
          </span>
        </div>
        {/* LEFT = more transparent / RIGHT = more solid */}
        {/* 023N: onChange → live preview only (no undo push).
            onMouseDown/onKeyDown → record pre-drag value.
            onMouseUp/onTouchEnd/onKeyUp/onBlur → commit one undo entry. */}
        <input
          type="range" min={0} max={1} step={0.01}
          value={barTransparency}
          onMouseDown={() => onBarTransparencyDragStart?.()}
          onKeyDown={() => onBarTransparencyDragStart?.()}
          onChange={e => onBarTransparencyChange(parseFloat(e.target.value))}
          onMouseUp={() => onBarTransparencyCommit?.()}
          onTouchEnd={() => onBarTransparencyCommit?.()}
          onKeyUp={() => onBarTransparencyCommit?.()}
          onBlur={() => onBarTransparencyCommit?.()}
          aria-label="Bar transparency — left is more transparent, right is more solid"
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary bg-border"
        />
        <div className="flex justify-between mt-0.5">
          <span className="text-[9px] text-muted-foreground/70">Transparent</span>
          <span className="text-[9px] text-muted-foreground/70">Solid</span>
        </div>
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
              {/* Built-in permanent themes: Landscape, Psychedelic, Retro-Outdoors, Topo, Trails US */}
              {BUILTIN_THEMES.map(theme => (
                <button
                  key={theme.id}
                  role="option"
                  aria-selected={!isAddingTheme && activeThemeId === theme.id}
                  onClick={() => handleThemeSelect(theme.id)}
                  className={`w-full text-left px-3 py-2 text-[11px] font-semibold transition-colors ${
                    !isAddingTheme && activeThemeId === theme.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted/50'
                  }`}
                >{theme.label}</button>
              ))}

              {/* 023B/C — Custom themes: display exact user-entered name, no "Theme " prefix; always last.
                  026D: filter out the four original browser-local collections by exact UUID so they
                  no longer appear as duplicates alongside the new permanent built-in themes. */}
              {collections.filter(col => !SUPPRESSED_LEGACY_COLLECTION_IDS.has(col.id)).map(col => (
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
      ) : (() => {
        // Check whether the active theme is one of the built-in permanent themes
        const builtInTheme = BUILTIN_THEMES.find(t => t.id === activeThemeId);
        if (builtInTheme) {
          // 017E fix: grid wrapper gets its own GPU compositing layer (willChange:transform)
          // so re-compositing caused by parent background-image repaints cannot cascade
          // into the tiles' rasterization context.  onMouseEnter fires the DEV measurement
          // (landscape only; non-landscape grids share the same pattern for consistency).
          return (
            <div
              ref={activeThemeId === 'landscapes' ? landscapeGridRef : undefined}
              className="px-3 pb-3"
              style={{ willChange: 'transform' }}
              onMouseEnter={activeThemeId === 'landscapes' ? handleGridMeasure : undefined}
            >
              <div className="grid grid-cols-2 gap-1.5">
                {builtInTheme.presets.map(p => {
                  const isActive = activePresetId === p.id;
                  return (
                    // 017E fix: outer div establishes the aspect-ratio container via
                    // padding-top: 66.667% (a layout-phase value, not a GPU compositing
                    // rasterization-phase value).
                    <div key={p.id} className="relative" style={{ paddingTop: '66.667%' }}>
                      <button
                        onClick={() => onBackgroundChange({ type: 'preset', id: p.id })}
                        aria-pressed={isActive}
                        aria-label={p.label ?? p.id}
                        className={`absolute inset-0 overflow-hidden rounded-lg group ${
                          isActive ? 'ring-2 ring-primary ring-offset-1' : 'hover:ring-2 hover:ring-foreground/30 hover:ring-offset-1'
                        }`}
                      >
                        <img src={getPresetThumbUrl(p)} alt={p.label ?? p.id} className="w-full h-full object-cover" loading="lazy" decoding="async" />
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
          );
        }
        // User custom collection
        if (activeCollection) return renderCustomThemePanel(activeCollection);
        return null;
      })()}

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
  , document.body);
}
