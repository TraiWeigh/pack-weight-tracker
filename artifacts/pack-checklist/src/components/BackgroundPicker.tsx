/**
 * BackgroundPicker.tsx — Prompt 016A
 *
 * Unified Background Edit panel with a single Theme dropdown that controls
 * which panel is displayed (Landscapes, custom theme, or new-theme form).
 * All photo-collection state lives here so the dropdown can reflect it.
 *
 * Key changes from Prompt 016:
 *  - Custom dropdown replaces the separate static label + native <select>
 *  - Landscape thumbnails and custom themes are mutually exclusive panels
 *  - Add Theme is the final dropdown option; creates via inline form
 *  - Exactly 10 fixed photo slots always shown for custom themes
 *  - Drag-and-drop with global Safari navigation prevention
 *  - Delete Theme at bottom-left below the ten photo slots
 *  - Max 10 custom themes enforced
 *  - PhotoCollections component no longer imported (logic inlined here)
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ImageIcon, X, Check, ChevronDown, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  PHOTO_COLLECTIONS_KEY,
  MAX_PHOTOS_PER_COLLECTION,
  MAX_COLLECTIONS,
  runMigration,
  createCollection,
  renameCollection,
  deleteCollection,
  addPhotoToCollection,
  deletePhotoFromCollection,
} from '../lib/bgCollections';
import type { PhotoCollection, CollectionPhoto } from '../lib/bgCollections';

// ── Types & constants ──────────────────────────────────────────────────────────

export type Background =
  | { type: 'preset'; id: string }
  | { type: 'custom'; dataUrl: string };

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

// ── Image helpers ─────────────────────────────────────────────────────────────

const SAFE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const UNSAFE_EXT = /\.(tiff?|raw|cr2|cr3|nef|arw|dng|orf|rw2|pef|heic|heif|bmp|svg)$/i;

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxW = 1920;
        const scale = img.width > maxW ? maxW / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Collection storage ────────────────────────────────────────────────────────

function loadCollections(): PhotoCollection[] {
  try {
    const raw = localStorage.getItem(PHOTO_COLLECTIONS_KEY);
    if (raw !== null) {
      const cols = JSON.parse(raw) as PhotoCollection[];
      return Array.isArray(cols) ? cols : [];
    }
    // First run: migrate any legacy single custom-photo slot into "My Photos"
    let cols: PhotoCollection[] = [];
    const bgRaw = localStorage.getItem(BG_STORAGE_KEY);
    if (bgRaw) {
      try {
        const bg = JSON.parse(bgRaw) as Background;
        if (bg.type === 'custom' && bg.dataUrl) {
          cols = runMigration(cols, bg.dataUrl);
        }
      } catch { /* ignore corrupt bg data */ }
    }
    localStorage.setItem(PHOTO_COLLECTIONS_KEY, JSON.stringify(cols));
    return cols;
  } catch { return []; }
}

// ── Button ────────────────────────────────────────────────────────────────────

export function BackgroundPickerButton({ onClick, active }: { onClick: () => void; active: boolean }) {
  return (
    <button
      onClick={onClick}
      title="Background Edit"
      aria-label="Background Edit"
      className={`flex items-center gap-1.5 text-xs font-semibold border px-3 py-1.5 rounded-lg transition-colors ${
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'text-muted-foreground hover:text-foreground border-border hover:border-foreground/30 bg-card hover:bg-muted/50'
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
  /** 'cover' = Fill Screen (default); 'contain' = Fit Image */
  bgSize: 'cover' | 'contain';
  onBgSizeChange: (v: 'cover' | 'contain') => void;
  containerRef?: React.RefObject<HTMLDivElement>;
  onShowcase?: () => void;
  isShowcaseBlocked?: boolean;
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
}: BackgroundPickerPanelProps) {
  const panelRef    = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef    = useRef<HTMLInputElement>(null);
  const newNameInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef  = useRef<HTMLInputElement>(null);

  // ── Theme selection state ──────────────────────────────────────────────────
  const [activeThemeId, setActiveThemeId] = useState<string>('landscapes');
  const [dropdownOpen,  setDropdownOpen]  = useState(false);

  // ── Collections state ──────────────────────────────────────────────────────
  const [collections, setCollections] = useState<PhotoCollection[]>(loadCollections);

  // ── Add-theme form state ───────────────────────────────────────────────────
  const [isAddingTheme, setIsAddingTheme] = useState(false);
  const [prevThemeId,   setPrevThemeId]   = useState<string>('landscapes');
  const [newThemeName,  setNewThemeName]  = useState('');
  const [newThemeError, setNewThemeError] = useState<string | null>(null);

  // ── Upload state ───────────────────────────────────────────────────────────
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);
  const [uploadError,    setUploadError]    = useState<string | null>(null);

  // ── Photo delete confirmation ──────────────────────────────────────────────
  const [confirmDeletePhoto, setConfirmDeletePhoto] = useState<{ cid: string; pid: string } | null>(null);

  // ── Theme delete confirmation ──────────────────────────────────────────────
  const [confirmDeleteTheme, setConfirmDeleteTheme] = useState<string | null>(null);

  // ── Rename state ───────────────────────────────────────────────────────────
  const [renamingId,   setRenamingId]   = useState<string | null>(null);
  const [renameValue,  setRenameValue]  = useState('');
  const [renameError,  setRenameError]  = useState<string | null>(null);

  // ── Drag-over state ────────────────────────────────────────────────────────
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  // ── Derived ────────────────────────────────────────────────────────────────
  const canAddTheme = collections.length < MAX_COLLECTIONS;
  const activeCollection = collections.find(c => c.id === activeThemeId) ?? null;

  const dropdownLabel = (() => {
    if (isAddingTheme) return 'Add Theme';
    if (activeThemeId === 'landscapes') return 'Landscapes';
    const col = collections.find(c => c.id === activeThemeId);
    if (col) return `Theme ${col.name}`;
    return 'Themes';
  })();

  // ── Global Safari drag prevention (active only while panel is open) ────────
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

  // ── Close panel on outside click ───────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const root = containerRef?.current ?? panelRef.current;
      if (root && !root.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose, containerRef]);

  // ── Close dropdown on outside click ───────────────────────────────────────
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

  // ── Focus new-name input when add-theme form opens ────────────────────────
  useEffect(() => {
    if (isAddingTheme) {
      setTimeout(() => newNameInputRef.current?.focus(), 50);
    }
  }, [isAddingTheme]);

  // ── Focus rename input when rename starts ─────────────────────────────────
  useEffect(() => {
    if (renamingId) {
      setTimeout(() => renameInputRef.current?.focus(), 50);
    }
  }, [renamingId]);

  // ── Ensure activeThemeId references a valid collection ────────────────────
  useEffect(() => {
    if (activeThemeId !== 'landscapes' && !collections.find(c => c.id === activeThemeId)) {
      setActiveThemeId('landscapes');
    }
  }, [collections, activeThemeId]);

  // ── Persist helper ─────────────────────────────────────────────────────────
  const persist = useCallback((cols: PhotoCollection[]) => {
    setCollections(cols);
    try { localStorage.setItem(PHOTO_COLLECTIONS_KEY, JSON.stringify(cols)); } catch {}
  }, []);

  // ── Dropdown actions ───────────────────────────────────────────────────────
  const handleThemeSelect = (id: string) => {
    setDropdownOpen(false);
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

  // ── Add-theme handlers ─────────────────────────────────────────────────────
  const commitNewTheme = () => {
    const name = newThemeName.trim();
    if (!name) { setNewThemeError('Theme name cannot be blank.'); return; }
    const res = createCollection(name, collections);
    if (!res) {
      setNewThemeError('A theme with that name already exists.');
      return;
    }
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

  // ── Rename handlers ────────────────────────────────────────────────────────
  const startRename = (col: PhotoCollection) => {
    setRenamingId(col.id);
    setRenameValue(col.name);
    setRenameError(null);
  };

  const commitRename = (id: string) => {
    const result = renameCollection(id, renameValue, collections);
    if (result === null) {
      const trimmed = renameValue.trim();
      setRenameError(!trimmed ? 'Name cannot be blank.' : 'Another theme already has that name.');
      return;
    }
    persist(result);
    setRenamingId(null);
    setRenameError(null);
  };

  const cancelRename = () => { setRenamingId(null); setRenameError(null); };

  // ── Upload handler ─────────────────────────────────────────────────────────
  const triggerUpload = (collectionId: string) => {
    setUploadTargetId(collectionId);
    setUploadError(null);
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const processFiles = useCallback(async (files: File[], collectionId: string) => {
    setUploadError(null);
    // Work against the current snapshot from state
    setCollections(prev => {
      const col = prev.find(c => c.id === collectionId);
      if (!col) return prev;
      const remaining = MAX_PHOTOS_PER_COLLECTION - col.photos.length;
      if (remaining <= 0) return prev;
      const toProcess = files.slice(0, remaining);

      // We need async processing — kick off and re-persist after
      (async () => {
        let current = prev;
        let added = 0;
        for (const file of toProcess) {
          if (!SAFE_TYPES.includes(file.type) || UNSAFE_EXT.test(file.name)) {
            setUploadError('Only JPEG, PNG, WebP, and GIF are supported.');
            continue;
          }
          if (file.size > 25 * 1024 * 1024) {
            setUploadError('File is too large (max 25 MB).');
            continue;
          }
          try {
            const dataUrl = await compressImage(file);
            const photo: CollectionPhoto = { id: crypto.randomUUID(), dataUrl };
            const updated = addPhotoToCollection(collectionId, photo, current);
            if (updated) { current = updated; added++; }
          } catch {
            setUploadError('Could not load that image. Try a different file.');
          }
        }
        if (added > 0) persist(current);
      })();

      return prev; // Synchronous return unchanged; async will update via persist
    });
  }, [persist]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!files.length || !uploadTargetId) return;
    await processFiles(files, uploadTargetId);
  };

  // ── Drag-and-drop handlers ─────────────────────────────────────────────────
  const handleDragEnter = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) setDragOverKey(key);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDragLeave = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverKey(prev => (prev === key ? null : prev));
  };
  const handleDrop = async (e: React.DragEvent, collectionId: string, key: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverKey(null);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) await processFiles(files, collectionId);
  };

  // ── Delete photo ───────────────────────────────────────────────────────────
  const confirmAndDeletePhoto = (cid: string, pid: string) => {
    const col = collections.find(c => c.id === cid);
    const photo = col?.photos.find(p => p.id === pid);
    // If deleted photo is active background, switch to another photo in same theme or clear
    if (background?.type === 'custom' && photo && background.dataUrl === photo.dataUrl) {
      const other = col?.photos.find(p => p.id !== pid);
      onBackgroundChange(other ? { type: 'custom', dataUrl: other.dataUrl } : null);
    }
    persist(deletePhotoFromCollection(cid, pid, collections));
    setConfirmDeletePhoto(null);
  };

  // ── Delete theme ───────────────────────────────────────────────────────────
  const confirmAndDeleteTheme = (id: string) => {
    const col = collections.find(c => c.id === id);
    // If active background is from this collection, clear it
    if (background?.type === 'custom') {
      const hasActive = col?.photos.some(p => p.dataUrl === (background as { type: 'custom'; dataUrl: string }).dataUrl);
      if (hasActive) onBackgroundChange(null);
    }
    persist(deleteCollection(id, collections));
    setConfirmDeleteTheme(null);
    if (activeThemeId === id) setActiveThemeId('landscapes');
    if (renamingId === id) setRenamingId(null);
  };

  // ── Render helpers ─────────────────────────────────────────────────────────
  const activePresetId = background?.type === 'preset' ? background.id : null;

  const renderAddPhotoSlot = (col: PhotoCollection, slotIdx: number) => {
    const key = `${col.id}:${slotIdx}`;
    const isDragOver = dragOverKey === key;
    const atLimit = col.photos.length >= MAX_PHOTOS_PER_COLLECTION;
    if (atLimit) return null; // Don't render empty slot if collection is full

    return (
      <div
        key={key}
        role="button"
        tabIndex={0}
        aria-label={`Add photo to ${col.name}, slot ${slotIdx + 1}`}
        onClick={() => triggerUpload(col.id)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerUpload(col.id); }}}
        onDragEnter={e => handleDragEnter(e, key)}
        onDragOver={handleDragOver}
        onDragLeave={e => handleDragLeave(e, key)}
        onDrop={e => handleDrop(e, col.id, key)}
        className={`relative overflow-hidden rounded-lg aspect-[3/2] transition-all cursor-pointer select-none
          ${isDragOver
            ? 'ring-2 ring-primary ring-offset-1 bg-primary/10'
            : 'ring-1 ring-border hover:ring-2 hover:ring-foreground/30 hover:ring-offset-1'
          }
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
      >
        <div className={`absolute inset-0 m-1 rounded border-2 border-dashed transition-colors ${isDragOver ? 'border-primary' : 'border-border group-hover:border-foreground/30'}`} />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <div className="rounded-full p-1.5 bg-muted/60 text-muted-foreground transition-colors">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-semibold text-muted-foreground leading-none">
            {isDragOver ? 'Drop here' : 'Add Photo'}
          </span>
        </div>
      </div>
    );
  };

  const renderPhotoSlot = (col: PhotoCollection, slotIdx: number) => {
    const photo = col.photos[slotIdx];
    if (!photo) return renderAddPhotoSlot(col, slotIdx);

    const isActive = background?.type === 'custom' && background.dataUrl === photo.dataUrl;
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
          onClick={() => onBackgroundChange({ type: 'custom', dataUrl: photo.dataUrl })}
          aria-pressed={isActive}
          aria-label="Select this photo as background"
          className={`w-full relative overflow-hidden rounded-lg aspect-[3/2] transition-all ${
            isActive ? 'ring-2 ring-primary ring-offset-1' : 'hover:ring-2 hover:ring-foreground/30 hover:ring-offset-1'
          }`}
        >
          <img src={photo.dataUrl} alt="Custom background" className="w-full h-full object-cover" />
          {isActive && (
            <div className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center pointer-events-none">
              <Check className="w-2.5 h-2.5" />
            </div>
          )}
        </button>
        {/* Delete button — always visible on touch, hover on desktop */}
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

  // ── Custom theme panel ─────────────────────────────────────────────────────
  const renderCustomThemePanel = (col: PhotoCollection) => {
    const isThisRenaming     = renamingId === col.id;
    const isConfirmingDelete = confirmDeleteTheme === col.id;
    const photoCount         = col.photos.length;

    // Always render exactly MAX_PHOTOS_PER_COLLECTION slots
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
              ><Pencil className="w-3 h-3" /></button>
            </>
          )}
        </div>

        {/* Rename error */}
        {isThisRenaming && renameError && (
          <p className="text-[11px] text-destructive mb-1.5 px-0.5">{renameError}</p>
        )}

        {/* Upload error */}
        {uploadError && (
          <p className="text-[11px] text-destructive mb-1.5 px-0.5">{uploadError}</p>
        )}

        {/* 10 fixed photo slots */}
        <div className="grid grid-cols-2 gap-1.5">
          {slots.map(i => renderPhotoSlot(col, i))}
        </div>

        {/* Formats hint */}
        <p className="text-[10px] text-muted-foreground mt-1 px-0.5">
          JPEG, PNG, WebP, GIF — max 25 MB · click or drag to add
        </p>

        {/* Delete Theme — bottom-left, below the grid */}
        <div className="mt-3">
          {isConfirmingDelete ? (
            <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-[11px]">
              <p className="text-foreground mb-2 leading-snug">
                Delete <strong>{col.name}</strong>? This removes the custom theme and its {photoCount} photo{photoCount !== 1 ? 's' : ''} from your library. Built-in Landscapes is not affected.
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => confirmAndDeleteTheme(col.id)}
                  className="font-semibold bg-destructive text-destructive-foreground px-2.5 py-1 rounded-md text-[11px] hover:bg-destructive/90 transition-colors"
                >Delete</button>
                <button
                  onClick={() => setConfirmDeleteTheme(null)}
                  className="font-semibold bg-muted text-muted-foreground px-2.5 py-1 rounded-md text-[11px] hover:bg-muted/80 transition-colors"
                >Cancel</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                if (photoCount > 0) {
                  setConfirmDeleteTheme(col.id);
                } else {
                  confirmAndDeleteTheme(col.id);
                }
              }}
              className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-destructive transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={`Delete theme ${col.name}`}
            >
              <Trash2 className="w-3 h-3" />
              Delete Theme
            </button>
          )}
        </div>
      </div>
    );
  };

  // ── Add-theme form (replaces landscape panel while active) ─────────────────
  const renderAddThemeForm = () => {
    const slots = Array.from({ length: MAX_PHOTOS_PER_COLLECTION }, (_, i) => i);
    return (
      <div className="px-3 pb-3">
        {/* Name input */}
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
            placeholder="Theme name…"
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
        {/* 10 empty photo slots (not yet uploadable — theme must be saved first) */}
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

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div
      ref={panelRef}
      className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 w-[24rem] max-h-[calc(100dvh-10rem)] overflow-y-auto bg-card border border-card-border rounded-xl shadow-xl animate-in fade-in slide-in-from-top-2 duration-150"
      style={{ display: open ? undefined : 'none' }}
    >
      {/* Hidden file input — shared for all upload actions */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        multiple
        className="sr-only"
        onChange={handleFileChange}
        aria-hidden="true"
      />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Background</h3>
        {onShowcase && (
          <button
            onClick={onShowcase}
            disabled={isShowcaseBlocked}
            title={isShowcaseBlocked ? 'Finish the current action first' : 'Fill the screen with this background'}
            className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors flex-shrink-0 ${
              isShowcaseBlocked
                ? 'bg-muted text-muted-foreground/40 cursor-not-allowed'
                : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
            }`}
          >Showcase</button>
        )}
      </div>

      {/* ── Fill/Fit + Light/Dark row ───────────────────────────────────────── */}
      <div className="px-4 pb-3 border-b border-border">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5" aria-label="Background display controls">
          {/* Fill Screen / Fit Image */}
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
          {/* Light / Dark */}
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
        {/* Fade slider */}
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

      {/* ── Theme dropdown + panel ─────────────────────────────────────────── */}
      <div className="px-3 pt-3 pb-0">
        {/* Custom dropdown */}
        <div ref={dropdownRef} className="relative mb-3">
          <button
            onClick={() => setDropdownOpen(v => !v)}
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
            className="w-full flex items-center justify-between gap-2 text-[11px] font-semibold bg-muted/40 hover:bg-muted/70 border border-border rounded-lg px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span>{dropdownLabel}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div
              role="listbox"
              aria-label="Select theme"
              className="absolute left-0 right-0 top-full mt-1 z-10 bg-card border border-border rounded-lg shadow-lg overflow-hidden"
            >
              {/* Landscapes */}
              <button
                role="option"
                aria-selected={!isAddingTheme && activeThemeId === 'landscapes'}
                onClick={() => handleThemeSelect('landscapes')}
                className={`w-full text-left px-3 py-2 text-[11px] font-semibold transition-colors ${
                  !isAddingTheme && activeThemeId === 'landscapes'
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-muted/50'
                }`}
              >Landscapes</button>

              {/* Custom themes */}
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
                >Theme {col.name}</button>
              ))}

              {/* Add Theme — final option, only when under limit */}
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

      {/* ── Theme panel ───────────────────────────────────────────────────── */}
      {isAddingTheme ? (
        renderAddThemeForm()
      ) : activeThemeId === 'landscapes' ? (
        /* Landscapes grid */
        <div className="px-3 pb-3">
          <div className="grid grid-cols-2 gap-1.5">
            {PRESETS.map(p => {
              const isActive = activePresetId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onBackgroundChange({ type: 'preset', id: p.id })}
                  aria-pressed={isActive}
                  aria-label={p.label}
                  className={`relative overflow-hidden rounded-lg aspect-[3/2] group transition-all ${
                    isActive ? 'ring-2 ring-primary ring-offset-1' : 'hover:ring-2 hover:ring-foreground/30 hover:ring-offset-1'
                  }`}
                >
                  <img src={getThumbUrl(p.photoId)} alt={p.label} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-semibold text-white leading-none">{p.label}</span>
                  </div>
                  {isActive && (
                    <div className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : activeCollection ? (
        renderCustomThemePanel(activeCollection)
      ) : null}

      {/* ── Remove background ──────────────────────────────────────────────── */}
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
